#!/bin/bash
set -euo pipefail

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
backup_dir=/backups
mkdir -p "$backup_dir"

if [[ -z "${DATABASE_URL:-}" ]];
then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

backup_file="$backup_dir/indiainflation-${timestamp}.sql.gz"

echo "[backup] dumping database to $backup_file"
pg_dump "$DATABASE_URL" | gzip > "$backup_file"

if [[ -n "${BACKUP_S3_BUCKET:-}" && -n "${BACKUP_S3_ENDPOINT:-}" && -n "${BACKUP_S3_ACCESS_KEY:-}" && -n "${BACKUP_S3_SECRET_KEY:-}" ]];
then
  if command -v aws >/dev/null 2>&1; then
    echo "[backup] uploading to object storage"
    AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "$backup_file" "s3://$BACKUP_S3_BUCKET/indiainflation/$timestamp.sql.gz"
  else
    echo "[backup] aws CLI not installed; skipping upload" >&2
  fi
fi

retention_days=${BACKUP_RETENTION_DAYS:-7}
if [[ "$retention_days" -gt 0 ]];
then
  find "$backup_dir" -type f -name 'indiainflation-*.sql.gz' -mtime +"$retention_days" -print -delete
fi

echo "[backup] complete"
