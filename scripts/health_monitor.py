#!/usr/bin/env python3
"""
Health Monitor - System Health Check
Monitors API response times, database, SSL certificate, and disk usage
"""

import os
import sys
import json
import logging
import time
import subprocess
import ssl
import socket
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path
import requests

# Setup logging
log_dir = os.getenv("LOG_DIR", "/var/log")
log_file = os.path.join(log_dir, "health_monitor.log")
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


class HealthMonitor:
    """System Health Monitor"""

    def __init__(self):
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.domain = os.getenv("DOMAIN", "indiainflation.com")
        self.db_url = os.getenv("DATABASE_URL", "postgresql://localhost/indiainflation")
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")

        # Thresholds
        self.api_timeout_threshold = float(os.getenv("API_TIMEOUT_THRESHOLD", 5.0))
        self.disk_usage_threshold = float(os.getenv("DISK_USAGE_THRESHOLD", 80.0))
        self.ssl_cert_threshold_days = int(os.getenv("SSL_CERT_THRESHOLD_DAYS", 30))

        self.checks = {
            "api_health": {"status": "pending", "response_time": None, "error": None},
            "database": {"status": "pending", "response_time": None, "error": None},
            "ssl_certificate": {"status": "pending", "days_until_expiry": None, "error": None},
            "disk_usage": {"status": "pending", "usage_percent": None, "error": None},
        }

        self.alerts = []

    def check_api_health(self) -> bool:
        """Check API health and response time"""
        try:
            logger.info("Checking API health...")

            endpoints = [
                "/api/health",
                "/api/inflation/metadata",
            ]

            start_time = time.time()
            errors = []

            for endpoint in endpoints:
                try:
                    url = f"{self.api_base}{endpoint}"
                    response = requests.get(url, timeout=self.api_timeout_threshold)
                    response.raise_for_status()
                except Exception as e:
                    errors.append(f"{endpoint}: {str(e)}")

            response_time = time.time() - start_time

            if errors:
                self.checks["api_health"]["status"] = "warning"
                self.checks["api_health"]["error"] = "; ".join(errors)
                self.alerts.append(f"API Warning: {'; '.join(errors)}")
                logger.warning(f"API health warning: {'; '.join(errors)}")
            else:
                self.checks["api_health"]["status"] = "healthy"

            self.checks["api_health"]["response_time"] = response_time
            logger.info(f"API health check complete (response time: {response_time:.2f}s)")
            return True

        except Exception as e:
            self.checks["api_health"]["status"] = "unhealthy"
            self.checks["api_health"]["error"] = str(e)
            self.alerts.append(f"API Unhealthy: {str(e)}")
            logger.error(f"API health check failed: {str(e)}")
            return False

    def check_database(self) -> bool:
        """Check database connectivity"""
        try:
            logger.info("Checking database connectivity...")

            import psycopg2
            from urllib.parse import urlparse

            # Parse connection string
            parsed = urlparse(self.db_url)
            conn_params = {
                "host": parsed.hostname or "localhost",
                "port": parsed.port or 5432,
                "user": parsed.username or "postgres",
                "password": parsed.password or "",
                "database": parsed.path.lstrip("/") or "postgres",
            }

            start_time = time.time()

            # Test connection
            conn = psycopg2.connect(**conn_params)
            conn.close()

            response_time = time.time() - start_time

            self.checks["database"]["status"] = "healthy"
            self.checks["database"]["response_time"] = response_time

            logger.info(f"Database check passed (response time: {response_time:.2f}s)")
            return True

        except Exception as e:
            self.checks["database"]["status"] = "unhealthy"
            self.checks["database"]["error"] = str(e)
            self.alerts.append(f"Database Unhealthy: {str(e)}")
            logger.error(f"Database check failed: {str(e)}")
            return False

    def check_ssl_certificate(self) -> bool:
        """Check SSL certificate validity"""
        try:
            logger.info(f"Checking SSL certificate for {self.domain}...")

            # Get certificate expiry date
            context = ssl.create_default_context()
            conn = socket.create_connection((self.domain, 443), timeout=10)
            sock = context.wrap_socket(conn, server_hostname=self.domain)

            cert = sock.getpeercert()
            sock.close()

            # Parse expiry date
            from email.utils import parsedate_to_datetime

            expiry_date_str = cert.get("notAfter")
            expiry_date = parsedate_to_datetime(expiry_date_str)

            days_until_expiry = (expiry_date - datetime.utcnow()).days

            self.checks["ssl_certificate"]["status"] = "healthy"
            self.checks["ssl_certificate"]["days_until_expiry"] = days_until_expiry

            if days_until_expiry < self.ssl_cert_threshold_days:
                self.checks["ssl_certificate"]["status"] = "warning"
                self.alerts.append(
                    f"SSL Certificate expires in {days_until_expiry} days (threshold: {self.ssl_cert_threshold_days})"
                )
                logger.warning(f"SSL certificate warning: expires in {days_until_expiry} days")

            logger.info(f"SSL certificate valid for {days_until_expiry} more days")
            return True

        except Exception as e:
            self.checks["ssl_certificate"]["status"] = "unhealthy"
            self.checks["ssl_certificate"]["error"] = str(e)
            self.alerts.append(f"SSL Certificate Check Failed: {str(e)}")
            logger.error(f"SSL certificate check failed: {str(e)}")
            return False

    def check_disk_usage(self) -> bool:
        """Check disk usage"""
        try:
            logger.info("Checking disk usage...")

            # Get disk usage for root or specified path
            import shutil

            disk_stats = shutil.disk_usage("/")
            usage_percent = (disk_stats.used / disk_stats.total) * 100

            self.checks["disk_usage"]["status"] = "healthy"
            self.checks["disk_usage"]["usage_percent"] = usage_percent

            if usage_percent > self.disk_usage_threshold:
                self.checks["disk_usage"]["status"] = "warning"
                self.alerts.append(
                    f"Disk usage is {usage_percent:.1f}% (threshold: {self.disk_usage_threshold}%)"
                )
                logger.warning(f"Disk usage warning: {usage_percent:.1f}%")

            logger.info(f"Disk usage: {usage_percent:.1f}%")
            return True

        except Exception as e:
            self.checks["disk_usage"]["status"] = "unhealthy"
            self.checks["disk_usage"]["error"] = str(e)
            logger.error(f"Disk usage check failed: {str(e)}")
            return False

    def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        logger.info("Starting health checks...")

        self.check_api_health()
        self.check_database()
        self.check_ssl_certificate()
        self.check_disk_usage()

        # Determine overall status
        all_healthy = all(check["status"] == "healthy" for check in self.checks.values())

        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "healthy" if all_healthy else "unhealthy",
            "checks": self.checks,
            "alerts": self.alerts,
        }

        logger.info(f"Health checks complete: {json.dumps(result, indent=2)}")

        # Send alerts if any issues
        if self.alerts:
            self.send_alerts(result)

        return result

    def send_alerts(self, result: Dict[str, Any]):
        """Send alerts via Slack"""
        try:
            if not self.slack_webhook:
                return

            message = f":warning: *Health Check Alert - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}*\n\n"
            message += f"Status: {result['overall_status']}\n\n"
            message += "Alerts:\n"
            for alert in result["alerts"]:
                message += f"• {alert}\n"

            payload = {"text": message}

            requests.post(self.slack_webhook, json=payload, timeout=10)
            logger.info("Slack alert sent")

        except Exception as e:
            logger.error(f"Failed to send Slack alert: {str(e)}")


def main():
    """Main entry point"""
    logger.info("=" * 80)
    logger.info("Starting Health Monitor")
    logger.info("=" * 80)

    monitor = HealthMonitor()
    result = monitor.run_checks()

    logger.info("=" * 80)
    logger.info(f"Health Monitor Complete - Overall Status: {result['overall_status']}")
    logger.info("=" * 80)

    sys.exit(0)


if __name__ == "__main__":
    main()
