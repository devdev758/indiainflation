#!/usr/bin/env python3
"""
Report Generator - Monthly Inflation Summary (PDF + JSON)
Generates comprehensive monthly reports with charts and analysis
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path

# Setup logging
log_dir = os.getenv("LOG_DIR", "/var/log")
log_file = os.path.join(log_dir, "report_generator.log")
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


class ReportGenerator:
    """Monthly Inflation Report Generator"""

    def __init__(self):
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.report_dir = os.getenv("REPORT_DIR", "/reports/monthly")
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")

        # Create report directory
        os.makedirs(self.report_dir, exist_ok=True)

        # Get report month (default: last month)
        today = datetime.utcnow()
        self.report_date = today.replace(day=1) - timedelta(days=1)
        self.month_year = self.report_date.strftime("%m-%Y")

        self.stats = {
            "month": self.month_year,
            "generated_at": datetime.utcnow().isoformat(),
            "pdf_file": None,
            "json_file": None,
            "status": "pending",
            "error": None,
        }

    def fetch_latest_cpi(self) -> Dict[str, Any]:
        """Fetch latest CPI data"""
        try:
            import requests

            logger.info("Fetching latest CPI data...")

            # Get last month's data
            from_date = (self.report_date.replace(day=1) - timedelta(days=1)).replace(day=1)
            to_date = self.report_date

            endpoint = f"{self.api_base}/api/inflation/historical"
            params = {
                "from_date": from_date.strftime("%Y-%m"),
                "to_date": to_date.strftime("%Y-%m"),
                "sector": "Combined",
            }

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info(f"Fetched {len(data.get('data', []))} CPI records")
            return data

        except Exception as e:
            logger.error(f"Failed to fetch CPI data: {str(e)}")
            raise

    def fetch_statewise_inflation(self) -> Dict[str, Any]:
        """Fetch state-wise inflation data"""
        try:
            import requests

            logger.info("Fetching state-wise inflation data...")

            endpoint = f"{self.api_base}/api/inflation/statewise"
            params = {"month": self.report_date.strftime("%Y-%m"), "sector": "Combined"}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info(f"Fetched {len(data.get('data', []))} state records")
            return data

        except Exception as e:
            logger.error(f"Failed to fetch state-wise data: {str(e)}")
            raise

    def fetch_wpi_comparison(self) -> Dict[str, Any]:
        """Fetch CPI vs WPI comparison"""
        try:
            import requests

            logger.info("Fetching CPI vs WPI comparison...")

            from_date = self.report_date.replace(day=1)
            to_date = self.report_date

            endpoint = f"{self.api_base}/api/inflation/compare"
            params = {
                "from_date": from_date.strftime("%Y-%m"),
                "to_date": to_date.strftime("%Y-%m"),
            }

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info("CPI vs WPI comparison fetched")
            return data

        except Exception as e:
            logger.error(f"Failed to fetch CPI vs WPI: {str(e)}")
            raise

    def generate_json_report(
        self,
        cpi_data: Dict[str, Any],
        statewise_data: Dict[str, Any],
        wpi_data: Dict[str, Any],
    ) -> str:
        """Generate JSON report"""
        try:
            logger.info("Generating JSON report...")

            # Get latest CPI value
            latest_cpi = cpi_data.get("data", [{}])[-1]
            cpi_yoy = latest_cpi.get("yoy_percent", 0)

            # Find highest and lowest inflation states
            states = statewise_data.get("data", [])
            highest_state = max(states, key=lambda x: x.get("yoy_percent", 0)) if states else {}
            lowest_state = min(states, key=lambda x: x.get("yoy_percent", float("inf"))) if states else {}

            report = {
                "month": self.month_year,
                "generated_at": datetime.utcnow().isoformat(),
                "headline_cpi": {
                    "value": latest_cpi.get("value"),
                    "yoy_percent": cpi_yoy,
                    "previous_month": cpi_data.get("data", [{}])[-2].get("value") if len(cpi_data.get("data", [])) > 1 else None,
                },
                "statewise_highlights": {
                    "highest_inflation": {
                        "state": highest_state.get("state"),
                        "yoy_percent": highest_state.get("yoy_percent"),
                    },
                    "lowest_inflation": {
                        "state": lowest_state.get("state"),
                        "yoy_percent": lowest_state.get("yoy_percent"),
                    },
                    "national_average": sum(s.get("yoy_percent", 0) for s in states) / len(states) if states else 0,
                },
                "wpi_comparison": wpi_data,
                "data_sources": [
                    {
                        "name": "Ministry of Statistics & Programme Implementation (MoSPI)",
                        "url": "https://mospi.gov.in",
                        "data_type": "CPI",
                    },
                    {
                        "name": "Department of Industrial Policy & Promotion (DPIIT)",
                        "url": "https://dpiit.gov.in",
                        "data_type": "WPI",
                    },
                ],
            }

            json_file = os.path.join(self.report_dir, f"{self.month_year}.json")
            with open(json_file, "w") as f:
                json.dump(report, f, indent=2)

            self.stats["json_file"] = json_file
            logger.info(f"JSON report saved: {json_file}")
            return json_file

        except Exception as e:
            logger.error(f"JSON report generation failed: {str(e)}")
            raise

    def generate_pdf_report(
        self,
        cpi_data: Dict[str, Any],
        statewise_data: Dict[str, Any],
    ) -> str:
        """Generate PDF report with charts"""
        try:
            logger.info("Generating PDF report...")

            # Try to use matplotlib + reportlab for PDF generation
            try:
                from reportlab.lib.pagesizes import letter, A4
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                from reportlab.lib import colors
            except ImportError:
                logger.warning("reportlab not installed, creating text-based PDF")
                return self.generate_text_report()

            pdf_file = os.path.join(self.report_dir, f"{self.month_year}.pdf")

            # Create PDF
            doc = SimpleDocTemplate(pdf_file, pagesize=A4, title=f"Inflation Report {self.month_year}")
            styles = getSampleStyleSheet()
            story = []

            # Title
            title_style = ParagraphStyle(
                "CustomTitle",
                parent=styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1F40AF"),
                spaceAfter=30,
                alignment=1,
            )
            story.append(Paragraph(f"India Inflation Report - {self.month_year}", title_style))
            story.append(Spacer(1, 12))

            # Headline stats
            latest_cpi = cpi_data.get("data", [{}])[-1]
            stats_text = f"""
            <b>Headline CPI:</b> {latest_cpi.get('value', 'N/A')}<br/>
            <b>YoY Inflation:</b> {latest_cpi.get('yoy_percent', 'N/A')}%<br/>
            <b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>
            """
            story.append(Paragraph(stats_text, styles["Normal"]))
            story.append(Spacer(1, 12))

            # State data table
            states = statewise_data.get("data", [])
            if states:
                highest_state = max(states, key=lambda x: x.get("yoy_percent", 0))
                lowest_state = min(states, key=lambda x: x.get("yoy_percent", float("inf")))

                state_stats = f"""
                <b>Highest Inflation:</b> {highest_state.get('state')} ({highest_state.get('yoy_percent', 'N/A')}%)<br/>
                <b>Lowest Inflation:</b> {lowest_state.get('state')} ({lowest_state.get('yoy_percent', 'N/A')}%)<br/>
                """
                story.append(Paragraph(state_stats, styles["Normal"]))
                story.append(Spacer(1, 12))

            # Build PDF
            doc.build(story)

            self.stats["pdf_file"] = pdf_file
            logger.info(f"PDF report saved: {pdf_file}")
            return pdf_file

        except Exception as e:
            logger.error(f"PDF report generation failed: {str(e)}")
            raise

    def generate_text_report(self) -> str:
        """Fallback: Generate text-based report"""
        try:
            logger.info("Generating text-based report (PDF fallback)...")

            pdf_file = os.path.join(self.report_dir, f"{self.month_year}.txt")

            with open(pdf_file, "w") as f:
                f.write(f"INDIA INFLATION REPORT - {self.month_year}\n")
                f.write("=" * 80 + "\n")
                f.write(f"Generated: {datetime.utcnow().isoformat()}\n")
                f.write(f"Source: Ministry of Statistics & Programme Implementation (MoSPI)\n")
                f.write("=" * 80 + "\n")

            self.stats["pdf_file"] = pdf_file
            logger.info(f"Text report saved: {pdf_file}")
            return pdf_file

        except Exception as e:
            logger.error(f"Text report generation failed: {str(e)}")
            raise

    def run_report(self) -> bool:
        """Execute complete report generation"""
        try:
            # Fetch data
            cpi_data = self.fetch_latest_cpi()
            statewise_data = self.fetch_statewise_inflation()
            wpi_data = self.fetch_wpi_comparison()

            # Generate reports
            self.generate_json_report(cpi_data, statewise_data, wpi_data)
            self.generate_pdf_report(cpi_data, statewise_data)

            self.stats["status"] = "success"

            logger.info(f"Report generation completed: {json.dumps(self.stats, indent=2)}")
            return True

        except Exception as e:
            self.stats["status"] = "failed"
            self.stats["error"] = str(e)

            logger.error(f"Report generation failed: {str(e)}")
            return False


def main():
    """Main entry point"""
    logger.info("=" * 80)
    logger.info("Starting Monthly Report Generation")
    logger.info("=" * 80)

    generator = ReportGenerator()
    success = generator.run_report()

    logger.info("=" * 80)
    logger.info(f"Report Generation Complete - Status: {generator.stats['status']}")
    logger.info("=" * 80)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
