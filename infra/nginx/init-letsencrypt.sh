#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SITE_HOSTNAME:-}" ]]; then
  echo "SITE_HOSTNAME env var required" >&2
  exit 1
fi

email="${LETSENCRYPT_EMAIL:-infra@indiainflation.in}"
staging="${LETSENCRYPT_STAGING:-0}"

staging_flag=""
if [[ "$staging" == "1" ]]; then
  staging_flag="--staging"
fi

docker compose -f infra/docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --agree-tos \
  --no-eff-email \
  --email "$email" \
  --rsa-key-size 4096 \
  --force-renewal \
  --cert-name "$SITE_HOSTNAME" \
  $staging_flag \
  -d "$SITE_HOSTNAME"
