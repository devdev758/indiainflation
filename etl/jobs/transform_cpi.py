"""Transform raw CPI datasets into normalized CSV outputs."""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

import pandas as pd

from etl.utils import configure_logging, ensure_directory

LOGGER = configure_logging()

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw" / "cpi"
STAGING_DIR = Path(__file__).resolve().parents[1] / "data" / "staging"


SECTOR_MAP = {
    "rural": "Rural",
    "urban": "Urban",
    "combined": "Combined",
    "all india": "Combined",
}


def normalize_sector(value: str) -> str:
    if not isinstance(value, str):
        return "Combined"
    key = value.strip().lower()
    return SECTOR_MAP.get(key, value.title())


def parse_month(value: str) -> datetime:
    value = value.strip()
    for fmt in ("%Y-%m", "%b-%Y", "%b %Y", "%Y/%m"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {value}")


def compute_yoy(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("observation_month")
    df["prior_year_index"] = df.groupby(["sector", "major_group", "subgroup"]) ["index_value"].shift(12)
    df["yoy_inflation_rate"] = ((df["index_value"] - df["prior_year_index"]) / df["prior_year_index"]) * 100
    df["yoy_inflation_rate"] = df["yoy_inflation_rate"].round(2)
    df.drop(columns=["prior_year_index"], inplace=True)
    return df


def transform_cpi(raw_dir: Path | None = None, staging_dir: Path | None = None) -> Path | None:
    """Transform CPI raw files into cleaned CSV ready for loading."""

    raw_dir = raw_dir or RAW_DIR
    staging_dir = staging_dir or STAGING_DIR
    ensure_directory(staging_dir)

    latest_dir = max(raw_dir.glob("*/"), default=None)
    if latest_dir is None:
        LOGGER.warning("No CPI raw data directories found under %s", raw_dir)
        return None

    dataframes = []
    for file_path in latest_dir.glob("*.xls*"):
        try:
            df = pd.read_excel(file_path)
        except Exception as exc:  # noqa: BLE001
            LOGGER.error("Failed to read %s: %s", file_path, exc)
            continue

        df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
        rename_map = {
            "month": "observation_month",
            "sector": "sector",
            "major_group": "major_group",
            "sub_group": "subgroup",
            "index": "index_value",
            "index_value": "index_value",
            "base_year": "base_year",
        }
        df.rename(columns=rename_map, inplace=True)

        required_cols = {"observation_month", "sector", "major_group", "subgroup", "index_value"}
        missing = required_cols - set(df.columns)
        if missing:
            LOGGER.warning("Skipping %s; missing columns: %s", file_path, ", ".join(sorted(missing)))
            continue

        df = df[list(rename_map.values())]
        df["observation_month"] = df["observation_month"].astype(str).map(parse_month).dt.to_period("M").dt.to_timestamp()
        df["sector"] = df["sector"].astype(str).map(normalize_sector)
        df["major_group"] = df["major_group"].astype(str).str.strip().str.title()
        df["subgroup"] = df["subgroup"].astype(str).str.strip().str.title()
        df["index_value"] = pd.to_numeric(df["index_value"], errors="coerce")
        df["base_year"] = pd.to_numeric(df.get("base_year"), errors="coerce").fillna(2012).astype(int)

        df = df.dropna(subset=["index_value"])
        dataframes.append(df)

    if not dataframes:
        LOGGER.warning("No CPI datasets transformed from %s", latest_dir)
        return None

    combined = pd.concat(dataframes, ignore_index=True)
    combined = compute_yoy(combined)

    month_token = latest_dir.name
    output_path = staging_dir / f"cpi_cleaned_{month_token}.csv"
    combined.to_csv(output_path, index=False)
    LOGGER.info("Wrote transformed CPI data to %s", output_path)
    return output_path


if __name__ == "__main__":
    transform_cpi()
