#!/usr/bin/env python3
"""
Database Backup Script - Daily PostgreSQL Dump
Compresses, uploads to S3/Hetzner, and prunes old backups
"""

import os
import sys
import json
import logging
import subprocess
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any

# Setup logging
log_dir = os.getenv("LOG_DIR", "/var/log")
log_file = os.path.join(log_dir, "db_backup.log")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


class DatabaseBackup:
    """Database Backup Manager"""

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "postgresql://localhost/indiainflation")
        self.backup_dir = os.getenv("BACKUP_DIR", "/backups")
        self.retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", 30))

        # S3 configuration
        self.s3_enabled = os.getenv("S3_ENABLED", "false").lower() == "true"
        self.s3_bucket = os.getenv("S3_BUCKET", "indiainflation-backups")
        self.s3_region = os.getenv("AWS_REGION", "us-east-1")

        # Hetzner configuration
        self.hetzner_enabled = os.getenv("HETZNER_ENABLED", "false").lower() == "true"
        self.hetzner_endpoint = os.getenv("HETZNER_ENDPOINT")
        self.hetzner_bucket = os.getenv("HETZNER_BUCKET", "indiainflation-backups")
        self.hetzner_key = os.getenv("HETZNER_ACCESS_KEY")
        self.hetzner_secret = os.getenv("HETZNER_SECRET_KEY")

        # Alerts
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        self.email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        self.alert_emails = os.getenv("ALERT_EMAILS", "").split(",")

        # Create backup directory
        os.makedirs(self.backup_dir, exist_ok=True)

        self.stats = {
            "backup_file": None,
            "backup_size": 0,
            "compressed_size": 0,
            "status": "pending",
            "error": None,
            "uploaded_to": [],
            "start_time": None,
            "end_time": None,
        }

    def parse_db_url(self) -> Dict[str, str]:
        """Parse PostgreSQL connection URL"""
        try:
            from urllib.parse import urlparse

            parsed = urlparse(self.db_url)
            return {
                "host": parsed.hostname or "localhost",
                "port": str(parsed.port or 5432),
                "username": parsed.username or "postgres",
                "password": parsed.password or "",
                "database": parsed.path.lstrip("/") or "postgres",
            }
        except Exception as e:
            logger.error(f"Failed to parse DB URL: {str(e)}")
            raise

    def create_dump(self) -> str:
        """Create PostgreSQL dump file"""
        try:
            db_config = self.parse_db_url()
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            dump_file = os.path.join(self.backup_dir, f"indiainflation_db_{timestamp}.sql")

            logger.info(f"Creating database dump: {dump_file}")

            # Build pg_dump command
            env = os.environ.copy()
            if db_config["password"]:
                env["PGPASSWORD"] = db_config["password"]

            cmd = [
                "pg_dump",
                f"--host={db_config['host']}",
                f"--port={db_config['port']}",
                f"--username={db_config['username']}",
                "--verbose",
                "--no-password",
                db_config["database"],
            ]

            with open(dump_file, "w") as f:
                subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, env=env, check=True)

            dump_size = os.path.getsize(dump_file)
            self.stats["backup_file"] = dump_file
            self.stats["backup_size"] = dump_size

            logger.info(f"Database dump created: {dump_size} bytes")
            return dump_file

        except Exception as e:
            logger.error(f"Failed to create dump: {str(e)}")
            raise

    def compress_dump(self, dump_file: str) -> str:
        """Compress SQL dump with gzip"""
        try:
            compressed_file = f"{dump_file}.gz"
            logger.info(f"Compressing dump: {compressed_file}")

            with open(dump_file, "rb") as f_in:
                with gzip.open(compressed_file, "wb") as f_out:
                    f_out.writelines(f_in)

            compressed_size = os.path.getsize(compressed_file)
            self.stats["compressed_size"] = compressed_size

            # Remove uncompressed dump
            os.remove(dump_file)
            logger.info(f"Compression complete: {compressed_size} bytes")

            return compressed_file

        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            raise

    def upload_to_s3(self, file_path: str) -> bool:
        """Upload backup to AWS S3"""
        if not self.s3_enabled:
            return False

        try:
            import boto3

            logger.info(f"Uploading to S3: s3://{self.s3_bucket}/{os.path.basename(file_path)}")

            s3_client = boto3.client("s3", region_name=self.s3_region)
            s3_client.upload_file(file_path, self.s3_bucket, os.path.basename(file_path))

            self.stats["uploaded_to"].append("S3")
            logger.info("S3 upload successful")
            return True

        except Exception as e:
            logger.error(f"S3 upload failed: {str(e)}")
            return False

    def upload_to_hetzner(self, file_path: str) -> bool:
        """Upload backup to Hetzner Storage Box"""
        if not self.hetzner_enabled:
            return False

        try:
            import boto3

            logger.info(
                f"Uploading to Hetzner: {self.hetzner_endpoint}/{self.hetzner_bucket}/{os.path.basename(file_path)}"
            )

            s3_client = boto3.client(
                "s3",
                endpoint_url=self.hetzner_endpoint,
                aws_access_key_id=self.hetzner_key,
                aws_secret_access_key=self.hetzner_secret,
                region_name="us-east-1",
            )

            s3_client.upload_file(file_path, self.hetzner_bucket, os.path.basename(file_path))

            self.stats["uploaded_to"].append("Hetzner")
            logger.info("Hetzner upload successful")
            return True

        except Exception as e:
            logger.error(f"Hetzner upload failed: {str(e)}")
            return False

    def prune_old_backups(self):
        """Delete backups older than retention period"""
        try:
            logger.info(f"Pruning backups older than {self.retention_days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=self.retention_days)
            deleted_count = 0

            for backup_file in Path(self.backup_dir).glob("indiainflation_db_*.sql.gz"):
                file_mtime = datetime.fromtimestamp(backup_file.stat().st_mtime)

                if file_mtime < cutoff_date:
                    backup_file.unlink()
                    deleted_count += 1
                    logger.info(f"Deleted old backup: {backup_file.name}")

            logger.info(f"Pruned {deleted_count} old backups")

        except Exception as e:
            logger.error(f"Pruning failed: {str(e)}")

    def run_backup(self) -> bool:
        """Execute complete backup pipeline"""
        self.stats["start_time"] = datetime.utcnow().isoformat()

        try:
            # Create dump
            dump_file = self.create_dump()

            # Compress
            compressed_file = self.compress_dump(dump_file)

            # Upload to cloud storage
            self.upload_to_s3(compressed_file)
            self.upload_to_hetzner(compressed_file)

            # Prune old backups
            self.prune_old_backups()

            self.stats["status"] = "success"
            self.stats["end_time"] = datetime.utcnow().isoformat()

            logger.info(f"Backup completed successfully: {json.dumps(self.stats, indent=2)}")
            return True

        except Exception as e:
            self.stats["status"] = "failed"
            self.stats["error"] = str(e)
            self.stats["end_time"] = datetime.utcnow().isoformat()

            logger.error(f"Backup failed: {str(e)}")
            self.send_alert(f"Database Backup Failed: {str(e)}")
            return False

    def send_alert(self, message: str):
        """Send alert via Slack and/or Email"""
        try:
            if self.slack_webhook:
                import requests

                payload = {
                    "text": f":warning: *Database Backup Alert*\n{message}\n\nStats: {json.dumps(self.stats, indent=2)}"
                }
                requests.post(self.slack_webhook, json=payload, timeout=10)
                logger.info("Slack alert sent")

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")


def main():
    """Main entry point"""
    logger.info("=" * 80)
    logger.info("Starting Database Backup")
    logger.info("=" * 80)

    backup = DatabaseBackup()
    success = backup.run_backup()

    logger.info("=" * 80)
    logger.info(f"Database Backup Complete - Status: {backup.stats['status']}")
    logger.info("=" * 80)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
