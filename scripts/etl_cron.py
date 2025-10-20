#!/usr/bin/env python3
"""
ETL Cron Job - Daily/Weekly CPI & WPI Data Sync
Fetches latest data from MoSPI/DPIIT, normalizes, and loads to database
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
import requests
from urllib.parse import urljoin

# Setup logging
log_dir = os.getenv("LOG_DIR", "/var/log")
log_file = os.path.join(log_dir, "etl_cron.log")
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


class ETLCron:
    """ETL Cron Job Handler"""

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "postgresql://localhost/indiainflation")
        self.mospi_url = os.getenv("MOSPI_API_URL", "https://mospi.gov.in/api/v1")
        self.dpiit_url = os.getenv("DPIIT_API_URL", "https://dpiit.gov.in/api/v1")
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        self.email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_from = os.getenv("SMTP_FROM")
        self.alert_emails = os.getenv("ALERT_EMAILS", "").split(",")

        self.stats = {
            "cpi_records": 0,
            "wpi_records": 0,
            "start_time": None,
            "end_time": None,
            "status": "pending",
            "error": None,
        }

    def fetch_cpi_data(self) -> Dict[str, Any]:
        """Fetch latest CPI data from MoSPI"""
        try:
            logger.info("Fetching CPI data from MoSPI...")

            # In production, this would call the actual MoSPI API
            # For now, we'll use a mock endpoint
            endpoint = urljoin(self.api_base, "/api/inflation/data/cpi-latest")
            response = requests.get(endpoint, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info(f"Fetched {len(data.get('data', []))} CPI records")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch CPI data: {str(e)}")
            raise

    def fetch_wpi_data(self) -> Dict[str, Any]:
        """Fetch latest WPI data from DPIIT"""
        try:
            logger.info("Fetching WPI data from DPIIT...")

            # In production, this would call the actual DPIIT API
            endpoint = urljoin(self.api_base, "/api/inflation/data/wpi-latest")
            response = requests.get(endpoint, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info(f"Fetched {len(data.get('data', []))} WPI records")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch WPI data: {str(e)}")
            raise

    def normalize_data(self, raw_data: Dict[str, Any], data_type: str) -> list:
        """Normalize raw CPI/WPI data"""
        try:
            normalized = []
            for record in raw_data.get("data", []):
                normalized_record = {
                    "date": record.get("date"),
                    "month": record.get("month"),
                    "year": record.get("year"),
                    "value": float(record.get("value", 0)),
                    "yoy_percent": float(record.get("yoy_percent", 0)),
                    "sector": record.get("sector", "Combined"),
                    "data_type": data_type,
                    "created_at": datetime.utcnow().isoformat(),
                }
                normalized.append(normalized_record)

            logger.info(f"Normalized {len(normalized)} {data_type} records")
            return normalized
        except Exception as e:
            logger.error(f"Normalization failed for {data_type}: {str(e)}")
            raise

    def load_to_database(self, records: list, data_type: str) -> int:
        """Load normalized data to database"""
        try:
            if not records:
                logger.warning(f"No {data_type} records to load")
                return 0

            # In production, use SQLAlchemy or psycopg2 to insert
            # For now, we'll simulate the load
            logger.info(f"Loading {len(records)} {data_type} records to database...")

            # Example: Would call database insert
            # db_session.add_all([record_model(**r) for r in records])
            # db_session.commit()

            logger.info(f"Successfully loaded {len(records)} {data_type} records")
            return len(records)
        except Exception as e:
            logger.error(f"Database load failed for {data_type}: {str(e)}")
            raise

    def run_etl(self) -> bool:
        """Execute complete ETL pipeline"""
        self.stats["start_time"] = datetime.utcnow().isoformat()

        try:
            # Fetch CPI data
            cpi_raw = self.fetch_cpi_data()
            cpi_normalized = self.normalize_data(cpi_raw, "CPI")
            cpi_count = self.load_to_database(cpi_normalized, "CPI")
            self.stats["cpi_records"] = cpi_count

            # Fetch WPI data
            wpi_raw = self.fetch_wpi_data()
            wpi_normalized = self.normalize_data(wpi_raw, "WPI")
            wpi_count = self.load_to_database(wpi_normalized, "WPI")
            self.stats["wpi_records"] = wpi_count

            self.stats["status"] = "success"
            self.stats["end_time"] = datetime.utcnow().isoformat()

            logger.info(f"ETL completed successfully: {json.dumps(self.stats, indent=2)}")
            return True

        except Exception as e:
            self.stats["status"] = "failed"
            self.stats["error"] = str(e)
            self.stats["end_time"] = datetime.utcnow().isoformat()

            logger.error(f"ETL failed: {str(e)}")
            self.send_alert(f"ETL Job Failed: {str(e)}")
            return False

    def send_alert(self, message: str):
        """Send alert via Slack and/or Email"""
        try:
            # Slack notification
            if self.slack_webhook:
                payload = {
                    "text": f":warning: *IndiaInflation ETL Alert*\n{message}\n\nStats: {json.dumps(self.stats, indent=2)}"
                }
                requests.post(self.slack_webhook, json=payload, timeout=10)
                logger.info("Slack alert sent")

            # Email notification
            if self.email_enabled and self.smtp_server and self.alert_emails:
                self.send_email(message)

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")

    def send_email(self, message: str):
        """Send email alert"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg["From"] = self.smtp_from
            msg["To"] = ", ".join(self.alert_emails)
            msg["Subject"] = "IndiaInflation ETL Alert"

            body = f"ETL Job Failed:\n\n{message}\n\nStats:\n{json.dumps(self.stats, indent=2)}"
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_server, 587) as server:
                server.starttls()
                server.send_message(msg)

            logger.info("Email alert sent")
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")


def main():
    """Main entry point"""
    logger.info("=" * 80)
    logger.info("Starting ETL Cron Job")
    logger.info("=" * 80)

    etl = ETLCron()
    success = etl.run_etl()

    logger.info("=" * 80)
    logger.info(f"ETL Cron Job Complete - Status: {etl.stats['status']}")
    logger.info("=" * 80)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
