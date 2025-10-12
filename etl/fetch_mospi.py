"""Fetch and ingest MOSPI CPI annex data into Postgres."""

from __future__ import annotations

import csv
import sys
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Dict, List

import click
import pandas as pd
import requests
from sqlalchemy import exc, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from .models import etl_runs_table, items_table, raw_series_table, regions_table, series_table
from .utils import (
    checksum_bytes,
    configure_logging,
    current_run_directory,
    ensure_directory,
    get_engine,
    slugify,
)


MAX_LOG_CHARS = 64 * 1024
MAX_RETRIES = 3
RETRY_BASE_DELAY_SECONDS = 2


def month_to_number(value: str | int) -> int:
    """Convert month names or numbers into integers."""

    if isinstance(value, int):
        return value
    value_clean = value.strip().lower()
    month_lookup = {
        "jan": 1,
        "feb": 2,
        "mar": 3,
        "apr": 4,
        "may": 5,
        "jun": 6,
        "jul": 7,
        "aug": 8,
        "sep": 9,
        "sept": 9,
        "oct": 10,
        "nov": 11,
        "dec": 12,
    }
    key = value_clean[:3]
    if key not in month_lookup:
        raise ValueError(f"Unsupported month value: {value}")
    return month_lookup[key]


def download_file(url: str, destination_dir: Path) -> Path:
    """Download a remote file (or copy a local path) and return the target path."""

    if url.startswith("file://"):
        source_path = Path(url.replace("file://", ""))
        filename = source_path.name
        target_path = destination_dir / filename
        target_path.write_bytes(source_path.read_bytes())
        return target_path

    if url.startswith("http"):
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        filename = url.split("/")[-1]
        target_path = destination_dir / filename
        target_path.write_bytes(response.content)
        return target_path

    source_path = Path(url)
    if not source_path.exists():
        raise FileNotFoundError(f"Cannot locate annex at {url}")
    filename = source_path.name
    target_path = destination_dir / filename
    target_path.write_bytes(source_path.read_bytes())
    return target_path


def parse_annex(file_path: Path) -> List[dict]:
    """Parse the MOSPI annex Excel file into normalized rows."""

    sheets = pd.read_excel(file_path, sheet_name=None)
    sheet_name = "Table 1" if "Table 1" in sheets else next(iter(sheets))
    df = sheets[sheet_name]
    df = df.rename(
        columns={
            col: col.strip().lower().replace(" ", "_")
            for col in df.columns
            if isinstance(col, str)
        }
    )

    candidate_columns = {"item": "item", "item_name": "item", "description": "item"}
    region_columns = {"state": "region", "region": "region", "sector": "region"}
    year_columns = {"year": "year"}
    month_columns = {"month": "month"}
    value_columns = {"index": "index_value", "cpi": "index_value", "value": "index_value"}

    rename_map: dict[str, str] = {}
    for mapping in (candidate_columns, region_columns, year_columns, month_columns, value_columns):
        for candidate, canonical in mapping.items():
            if candidate in df.columns:
                rename_map[candidate] = canonical

    df = df.rename(columns=rename_map)

    missing = {"item", "region", "year", "month", "index_value"} - set(df.columns)
    if missing:
        raise ValueError(f"Annex missing required columns: {', '.join(sorted(missing))}")

    df = df.dropna(subset=["item", "region", "year", "month", "index_value"])

    normalized_rows = []
    for _, row in df.iterrows():
        try:
            year = int(row["year"])
            month = month_to_number(row["month"])
            value = float(row["index_value"])
        except (TypeError, ValueError) as exc:  # noqa: PERF203
            raise ValueError(f"Invalid record encountered: {row}") from exc

        normalized_rows.append(
            {
                "item_alias": str(row["item"]).strip(),
                "region_alias": str(row["region"]).strip(),
                "year": year,
                "month": month,
                "index_value": value,
            }
        )

    return normalized_rows


def write_dry_run_csv(rows: List[dict], destination: Path) -> Path:
    """Write parsed rows to CSV for dry-run mode."""

    ensure_directory(destination.parent)
    fieldnames = ["item_alias", "region_alias", "year", "month", "index_value"]
    with destination.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return destination


def compute_file_checksum(file_path: Path) -> str:
    """Calculate the SHA256 checksum for a file."""

    with file_path.open("rb") as handle:
        return checksum_bytes(iter(lambda: handle.read(65536), b""))


def _normalize_alias(value: str) -> str:
    slug = slugify(value)
    return slug or value.strip().lower()


class DimensionManager:
    """Manage item and region dimension lookups and inserts."""

    def __init__(self, conn):
        self.conn = conn
        self.items: Dict[int, Dict] = {}
        self.item_alias_index: Dict[str, Dict] = {}
        self.slug_index: Dict[str, Dict] = {}
        self.regions: Dict[int, Dict] = {}
        self.region_alias_index: Dict[str, Dict] = {}
        self.region_code_index: Dict[str, Dict] = {}
        self._load_items()
        self._load_regions()

    def _load_items(self) -> None:
        result = self.conn.execute(
            select(
                items_table.c.id,
                items_table.c.slug,
                items_table.c.canonical_name,
                items_table.c.aliases,
            )
        )
        for row in result:
            aliases = list(row.aliases or [])
            record = {
                "id": row.id,
                "slug": row.slug,
                "canonical_name": row.canonical_name,
                "aliases": aliases,
            }
            self.items[row.id] = record
            self.slug_index[row.slug] = record
            self._register_item_alias(record, row.slug)
            self._register_item_alias(record, row.canonical_name)
            for alias in aliases:
                self._register_item_alias(record, alias)

    def _load_regions(self) -> None:
        result = self.conn.execute(
            select(
                regions_table.c.id,
                regions_table.c.code,
                regions_table.c.name,
                regions_table.c.type,
            )
        )
        for row in result:
            record = {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "type": row.type,
            }
            self.regions[row.id] = record
            self.region_code_index[row.code] = record
            self._register_region_alias(record, row.code)
            self._register_region_alias(record, row.name)

    def _register_item_alias(self, record: Dict, alias: str) -> None:
        token = _normalize_alias(alias)
        self.item_alias_index[token] = record

    def _register_region_alias(self, record: Dict, alias: str) -> None:
        token = _normalize_alias(alias)
        self.region_alias_index[token] = record

    def _unique_item_slug(self, base_slug: str) -> str:
        slug = base_slug or "item"
        candidate = slug
        counter = 1
        while candidate in self.slug_index:
            counter += 1
            candidate = f"{slug}-{counter}"
        return candidate

    def _unique_region_code(self, base_code: str) -> str:
        code = base_code or "region"
        candidate = code
        counter = 1
        while candidate in self.region_code_index:
            counter += 1
            candidate = f"{code}-{counter}"
        return candidate

    def _append_item_alias_if_needed(self, record: Dict, alias: str) -> None:
        token = _normalize_alias(alias)
        existing_tokens = {_normalize_alias(existing) for existing in record["aliases"]}
        if token in existing_tokens:
            return
        updated_aliases = record["aliases"] + [alias]
        self.conn.execute(
            update(items_table)
            .where(items_table.c.id == record["id"])
            .values(aliases=updated_aliases)
        )
        record["aliases"] = updated_aliases
        self._register_item_alias(record, alias)

    def ensure_item(self, alias: str) -> int:
        token = _normalize_alias(alias)
        record = self.item_alias_index.get(token)
        if record:
            self._append_item_alias_if_needed(record, alias)
            return record["id"]

        slug_candidate = slugify(alias)
        token_from_slug = _normalize_alias(slug_candidate)
        record = self.item_alias_index.get(token_from_slug)
        if record:
            self._append_item_alias_if_needed(record, alias)
            return record["id"]

        slug = self._unique_item_slug(slug_candidate)
        result = self.conn.execute(
            items_table.insert()
            .values(slug=slug, canonical_name=alias, aliases=[alias])
            .returning(items_table.c.id)
        )
        item_id = result.scalar_one()
        record = {
            "id": item_id,
            "slug": slug,
            "canonical_name": alias,
            "aliases": [alias],
        }
        self.items[item_id] = record
        self.slug_index[slug] = record
        self._register_item_alias(record, slug)
        self._register_item_alias(record, alias)
        return item_id

    def ensure_region(self, alias: str) -> int:
        token = _normalize_alias(alias)
        record = self.region_alias_index.get(token)
        if record:
            return record["id"]

        code_candidate = slugify(alias)
        code = self._unique_region_code(code_candidate)
        result = self.conn.execute(
            regions_table.insert()
            .values(code=code, name=alias, type="unknown")
            .returning(regions_table.c.id)
        )
        region_id = result.scalar_one()
        record = {"id": region_id, "code": code, "name": alias, "type": "unknown"}
        self.regions[region_id] = record
        self.region_code_index[code] = record
        self._register_region_alias(record, code)
        self._register_region_alias(record, alias)
        return region_id


def ingest_with_engine(engine, file_path: Path, rows: List[dict], checksum: str, logger) -> dict:
    """Persist parsed rows into the database using the provided engine."""

    run_id = uuid.uuid4()
    started_at = datetime.now(timezone.utc)
    log_entries: List[str] = []
    status = "success"

    def append_log(level: str, message: str, *args) -> None:
        formatted = message % args if args else message
        entry = f"{datetime.now(timezone.utc).isoformat()} [{level.upper()}] {formatted}"
        log_entries.append(entry)
        log_method = getattr(logger, level, logger.info)
        log_method(formatted)

    def record_run(final_status: str) -> None:
        finished_at = datetime.now(timezone.utc)
        log_text = "\n".join(log_entries)
        truncated_log = log_text[:MAX_LOG_CHARS]
        try:
            with engine.begin() as conn:
                conn.execute(
                    etl_runs_table.insert().values(
                        run_id=run_id,
                        started_at=started_at,
                        finished_at=finished_at,
                        status=final_status,
                        checksum=checksum,
                        log=truncated_log,
                    )
                )
        except Exception as run_exc:  # noqa: BLE001
            logger.error("Failed to record ETL run metadata: %s", run_exc)

    try:
        append_log("info", "Starting database ingestion for %s rows", len(rows))
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                with engine.begin() as conn:
                    append_log("info", "Inserting raw series rows (attempt %s)", attempt)
                    payload = [
                        {
                            "source_file": str(file_path),
                            "item_alias": row["item_alias"],
                            "region_alias": row["region_alias"],
                            "year": row["year"],
                            "month": row["month"],
                            "raw_value": Decimal(str(row["index_value"])),
                        }
                        for row in rows
                    ]
                    conn.execute(raw_series_table.insert(), payload)

                    dimensions = DimensionManager(conn)
                    for row in rows:
                        item_id = dimensions.ensure_item(row["item_alias"])
                        region_id = dimensions.ensure_region(row["region_alias"])
                        date_value = datetime(row["year"], row["month"], 1).date()
                        value = Decimal(str(row["index_value"]))
                        conn.execute(
                            pg_insert(series_table)
                            .values(
                                item_id=item_id,
                                region_id=region_id,
                                date=date_value,
                                index_value=value,
                            )
                            .on_conflict_do_update(
                                index_elements=[
                                    series_table.c.item_id,
                                    series_table.c.region_id,
                                    series_table.c.date,
                                ],
                                set_={"index_value": value},
                            )
                        )
                    append_log("info", "Upserted %s series rows", len(rows))
                break
            except (exc.OperationalError, exc.DBAPIError) as transient_error:
                if attempt == MAX_RETRIES:
                    append_log("error", "Database operation failed after %s attempts: %s", attempt, transient_error)
                    status = "failed"
                    raise
                wait_time = min(RETRY_BASE_DELAY_SECONDS * attempt, 10)
                append_log(
                    "warning",
                    "Transient database error (attempt %s/%s): %s. Retrying in %s seconds",
                    attempt,
                    MAX_RETRIES,
                    transient_error,
                    wait_time,
                )
                engine.dispose()
                time.sleep(wait_time)
        append_log("info", "Database ingestion complete")
    except Exception:
        status = "failed"
        raise
    finally:
        record_run(status)

    return {
        "run_id": str(run_id),
        "status": status,
        "rows_processed": len(rows),
    }


def run_etl(mospi_url: str, dry_run: bool = False, database_url: str | None = None) -> dict:
    """Execute the ETL workflow for a MOSPI annex."""

    logger = configure_logging()
    project_root = Path(__file__).resolve().parent
    raw_dir = current_run_directory(project_root / "data" / "raw")
    logger.info("Downloading MOSPI annex: %s", mospi_url)
    file_path = download_file(mospi_url, raw_dir)
    logger.info("Saved annex to %s", file_path)

    rows = parse_annex(file_path)
    logger.info("Parsed %s rows", len(rows))

    if dry_run:
        exports_dir = ensure_directory(project_root / "data" / "exports")
        csv_path = exports_dir / f"dry_run_{file_path.stem}.csv"
        write_dry_run_csv(rows, csv_path)
        logger.info("Dry run complete. CSV written to %s", csv_path)
        return {
            "status": "dry_run",
            "rows_parsed": len(rows),
            "output_file": str(csv_path),
        }

    checksum = compute_file_checksum(file_path)
    engine = get_engine(database_url)
    if engine is None:
        logger.info("No DATABASE_URL configured. Skipping database ingestion.")
        return {
            "status": "skipped",
            "rows_parsed": len(rows),
            "checksum": checksum,
        }

    result = ingest_with_engine(engine, file_path, rows, checksum, logger)
    result["rows_parsed"] = len(rows)
    result["checksum"] = checksum
    return result


@click.command()
@click.argument("mospi_url")
@click.option("--dry-run", is_flag=True, help="Parse annex and write CSV without touching the database")
@click.option("--database-url", envvar="DATABASE_URL", help="Database connection string")
def main(mospi_url: str, dry_run: bool, database_url: str | None) -> None:
    """CLI entry point for the MOSPI fetch ETL."""

    run_etl(mospi_url, dry_run=dry_run, database_url=database_url)


if __name__ == "__main__":
    try:
        main()
    except Exception:  # noqa: BLE001
        sys.exit(1)
