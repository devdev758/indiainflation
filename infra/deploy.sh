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

WEB_IMAGE="${WEB_IMAGE:-ghcr.io/example/indiainflation-web:latest}"
ETL_IMAGE="${ETL_IMAGE:-ghcr.io/example/indiainflation-etl:latest}"

ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$HETZNER_HOST" <<EOF
set -e
docker pull "$WEB_IMAGE"
docker pull "$ETL_IMAGE"
docker compose -f /opt/indiainflation/docker-compose.yml down
WEB_IMAGE="$WEB_IMAGE" ETL_IMAGE="$ETL_IMAGE" docker compose -f /opt/indiainflation/docker-compose.yml up -d
EOF
