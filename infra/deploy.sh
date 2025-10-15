#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${HETZNER_HOST:-}" ]]; then
  echo "HETZNER_HOST env var missing" >&2
  exit 1
fi

if [[ -z "${SSH_KEY_PATH:-}" ]]; then
  echo "SSH_KEY_PATH env var missing" >&2
  exit 1
fi

ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$HETZNER_HOST" <<EOF
set -e
cd /opt/indiainflation
docker compose -f infra/docker-compose.prod.yml pull || true
docker compose -f infra/docker-compose.prod.yml down
docker compose -f infra/docker-compose.prod.yml up -d --build
EOF
