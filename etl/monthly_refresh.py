"""Utility to run the Phase 3 ETL pipeline on a monthly cadence."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Optional, Sequence

import click
from sqlalchemy import func, select

from .models import series_table
from .phase3_pipeline import run_phase3_pipeline
from .utils import configure_logging, get_engine


logger = configure_logging()


@dataclass
class RefreshConfig:
    mospi_annexes: Sequence[str]
    datagov_resources: Sequence[str]
    imf_series: Sequence[str]
    dpiit_resources: Sequence[str]


def load_config(path: Path) -> RefreshConfig:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return RefreshConfig(
        mospi_annexes=tuple(payload.get("mospi_annexes", [])),
        datagov_resources=tuple(payload.get("datagov_resources", [])),
        imf_series=tuple(payload.get("imf_series", [])),
        dpiit_resources=tuple(payload.get("dpiit_resources", [])),
    )


def should_refresh(engine, reference: date) -> bool:
    if engine is None:
        return False
    with engine.begin() as conn:
        latest = conn.execute(select(func.max(series_table.c.date))).scalar_one_or_none()
    if latest is None:
        return True
    return (latest.year, latest.month) < (reference.year, reference.month)


@click.command()
@click.option("--config", "config_path", type=click.Path(path_type=Path), required=True, help="JSON config with data source lists")
@click.option("--database-url", envvar="DATABASE_URL", help="Database connection string")
@click.option("--force", is_flag=True, help="Run even if the latest month is already present")
def main(config_path: Path, database_url: Optional[str], force: bool) -> None:
    """Entrypoint for the monthly refresh cron wrapper."""

    config = load_config(config_path)
    if not (config.mospi_annexes or config.datagov_resources or config.imf_series or config.dpiit_resources):
        raise click.ClickException("Config must list at least one data source")

    engine = get_engine(database_url)
    today = date.today().replace(day=1)

    if not force and not should_refresh(engine, today):
        logger.info("ETL already up to date for %s; skipping", today)
        return

    summary = run_phase3_pipeline(
        mospi_annexes=config.mospi_annexes,
        datagov_resources=config.datagov_resources,
        imf_series=config.imf_series,
        dpiit_resources=config.dpiit_resources,
        database_url=database_url,
        dry_run=False,
    )
    logger.info("Phase 3 refresh completed: %s", summary.totals)


if __name__ == "__main__":
    main()
