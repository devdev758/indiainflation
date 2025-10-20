"""Load transformed CPI data into PostgreSQL."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from etl.utils import configure_logging
from etl.utils.db import execute_upsert

LOGGER = configure_logging()

STAGING_DIR = Path(__file__).resolve().parents[1] / "data" / "staging"


def load_cpi(staging_dir: Path | None = None) -> None:
    """Load the most recent CPI CSV into the cpi_national table."""

    staging_dir = staging_dir or STAGING_DIR
    latest_file = max(staging_dir.glob("cpi_cleaned_*.csv"), default=None)
    if latest_file is None:
        LOGGER.warning("No CPI staging files found under %s", staging_dir)
        return

    LOGGER.info("Loading CPI data from %s", latest_file)
    dataframe = pd.read_csv(latest_file, parse_dates=["observation_month"])

    dataframe["observation_month"] = dataframe["observation_month"].dt.date

    inserted, updated = execute_upsert(
        "cpi_national",
        dataframe,
        conflict_columns=["observation_month", "sector", "major_group", "subgroup"],
    )

    LOGGER.info(
        "CPI load complete: %s inserted, %s updated from %s",
        inserted,
        updated,
        latest_file.name,
    )


if __name__ == "__main__":
    load_cpi()
