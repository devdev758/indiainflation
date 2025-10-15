"""Phase 4 ETL orchestration covering MOSPI, Data.gov.in, IMF, and DPIIT sources."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Iterable, List, Mapping, Optional, Sequence

import click
import pandas as pd
import re
import zipfile

from .fetch_mospi import (
    compute_file_checksum,
    download_file,
    ingest_with_engine,
    month_to_number,
    parse_annex,
    write_dry_run_csv,
)
from .models import items_table, regions_table, series_table
from .utils import configure_logging, current_run_directory, ensure_directory, get_engine, slugify
from sqlalchemy import func, select


logger = configure_logging()


ACCEPTED_YEARS = (1958, 2025)


CPI_ITEM_OVERRIDES: Mapping[str, tuple[str, str, Iterable[str] | None]] = {
    "general": ("cpi-all-items", "CPI All Items", ("general index", "headline cpi")),
    "food and beverages": (
        "cpi-food-and-beverages",
        "CPI Food & Beverages",
        ("food beverages", "food and bev"),
    ),
    "pan tobacco and intoxicants": (
        "cpi-pan-tobacco-intoxicants",
        "CPI Pan, Tobacco & Intoxicants",
        None,
    ),
    "clothing and footwear": ("cpi-clothing-footwear", "CPI Clothing & Footwear", None),
    "housing": ("cpi-housing", "CPI Housing", None),
    "fuel and light": (
        "cpi-fuel-and-light",
        "CPI Fuel & Light",
        ("fuel & light", "fuel light"),
    ),
    "miscellaneous": ("cpi-miscellaneous", "CPI Miscellaneous", None),
}

WPI_ITEM_OVERRIDES: Mapping[str, tuple[str, str, Iterable[str] | None]] = {
    "all commodities": ("wpi-all-commodities", "WPI All Commodities", None),
    "primary articles": ("wpi-primary-articles", "WPI Primary Articles", None),
    "fuel and power": ("wpi-fuel-and-power", "WPI Fuel & Power", None),
    "manufactured products": (
        "wpi-manufactured-products",
        "WPI Manufactured Products",
        ("manufactured goods",),
    ),
}


@dataclass
class SourceBatch:
    """Container for a parsed dataset ready for ingestion."""

    name: str
    file_path: Path
    rows: List[dict]


@dataclass
class PipelineSummary:
    """Aggregate response for the Phase 3 ingestion run."""

    batches: List[Mapping[str, object]]
    totals: Mapping[str, object]


def _year_in_scope(year: int) -> bool:
    start, end = ACCEPTED_YEARS
    return start <= year <= end


def _normalize_numeric(value) -> float:
    if value is None:
        raise ValueError("missing numeric value")
    if isinstance(value, (int, float)):
        return float(value)
    string_value = str(value).strip()
    if not string_value:
        raise ValueError("empty numeric value")
    return float(string_value)


def _normalize_item_key(alias: str) -> str:
    value = alias.lower()
    value = re.sub(r"&", " and ", value)
    value = value.split("(")[0]
    value = value.split("/")[0]
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    return " ".join(value.split())


def _resolve_item_override(alias: str, source: str) -> tuple[Optional[str], Optional[str], Optional[Iterable[str]]]:
    key = _normalize_item_key(alias)
    if source in {"mospi", "data_gov", "imf"}:
        override = CPI_ITEM_OVERRIDES.get(key)
    elif source == "dpiit":
        override = WPI_ITEM_OVERRIDES.get(key)
    else:
        override = None

    if not override:
        return None, None, None

    slug, canonical, aliases = override
    return slug, canonical, aliases


def _infer_region_type(alias: str) -> str:
    token = alias.lower()
    if "urban" in token:
        return "urban"
    if "rural" in token:
        return "rural"
    if "all india" in token or "india" in token:
        return "nation"
    return "state"


def _base_row(row: Mapping[str, object]) -> dict:
    return {
        "item_alias": row["item_alias"],
        "region_alias": row["region_alias"],
        "year": row["year"],
        "month": row["month"],
        "index_value": row["index_value"],
    }


def _normalized_row(
    *,
    item_alias: str,
    region_alias: str,
    year: int,
    month: int,
    value: float,
    source: str,
    item_slug: Optional[str] = None,
    canonical_name: Optional[str] = None,
    region_code: Optional[str] = None,
    region_type: Optional[str] = None,
    extra_item_aliases: Optional[Iterable[str]] = None,
    extra_region_aliases: Optional[Iterable[str]] = None,
) -> dict:
    if not _year_in_scope(year):
        raise ValueError("year out of accepted range")
    normalized_region_code = region_code or slugify(region_alias)
    normalized_region_type = region_type or _infer_region_type(region_alias)
    canonical = canonical_name or item_alias
    return {
        "item_alias": item_alias,
        "item_slug": item_slug or slugify(item_alias),
        "item_canonical_name": canonical,
        "item_aliases": list(extra_item_aliases) if extra_item_aliases else None,
        "region_alias": region_alias,
        "region_code": normalized_region_code,
        "region_type": normalized_region_type,
        "region_aliases": list(extra_region_aliases) if extra_region_aliases else None,
        "year": year,
        "month": month,
        "index_value": value,
        "source": source,
    }


def parse_mospi_annex(path: Path) -> List[dict]:
    rows = parse_annex(path)
    results: List[dict] = []
    for entry in rows:
        try:
            year = int(entry["year"])
            if not _year_in_scope(year):
                continue
            month = int(entry["month"])
            value = _normalize_numeric(entry["index_value"])
            region_alias = str(entry["region_alias"]).strip()
            item_alias = str(entry["item_alias"]).strip()
            item_slug, canonical_name, extra_aliases = _resolve_item_override(item_alias, "mospi")
            results.append(
                _normalized_row(
                    item_alias=item_alias,
                    region_alias=region_alias,
                    year=year,
                    month=month,
                    value=value,
                    source="mospi",
                    item_slug=item_slug,
                    canonical_name=canonical_name,
                    extra_item_aliases=extra_aliases,
                )
            )
        except ValueError:
            continue
    return results


def parse_datagov_resource(path: Path) -> List[dict]:
    df = pd.read_csv(path)
    column_groups = {
        "item": ["item", "commodity", "series", "series_name"],
        "state": ["state", "region", "location"],
        "sector": ["sector", "population", "segment"],
        "year": ["year", "fiscal_year"],
        "month": ["month", "period", "month_name"],
        "value": ["value", "index", "cpi", "wpi"],
    }
    rename_map: dict[str, str] = {}
    for canonical, candidates in column_groups.items():
        for candidate in candidates:
            if candidate in df.columns:
                rename_map[candidate] = canonical
                break
    df = df.rename(columns=rename_map)

    required = {"item", "state", "year", "month", "value"}
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Data.gov.in resource missing required columns: {', '.join(missing)}")

    results: List[dict] = []
    for _, row in df.iterrows():
        try:
            year = int(row["year"])
            if not _year_in_scope(year):
                continue
            month = month_to_number(row["month"])
            value = _normalize_numeric(row["value"])
            item_alias = str(row["item"]).strip()
            state = str(row["state"]).strip()
            sector_raw = str(row.get("sector") or "").strip()
            sector = sector_raw.lower() if sector_raw else "combined"
            region_alias = f"{state} ({sector.title()})" if sector != "combined" else state
            region_type = sector if sector in {"rural", "urban"} else "state"
            region_code = slugify(region_alias)
            item_slug, canonical_name, extra_aliases = _resolve_item_override(item_alias, "data_gov")
            results.append(
                _normalized_row(
                    item_alias=item_alias,
                    region_alias=region_alias,
                    year=year,
                    month=month,
                    value=value,
                    source="data_gov",
                    region_code=region_code,
                    region_type=region_type,
                    extra_region_aliases=(state,),
                    item_slug=item_slug,
                    canonical_name=canonical_name,
                    extra_item_aliases=extra_aliases,
                )
            )
        except ValueError:
            continue
    return results


def parse_imf_series(path: Path) -> List[dict]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    series: Sequence[Mapping[str, object]] = []
    if isinstance(raw, Mapping):
        if isinstance(raw.get("series"), list):
            series = raw["series"]  # type: ignore[assignment]
        elif isinstance(raw.get("data"), list):
            series = raw["data"]  # type: ignore[assignment]
    elif isinstance(raw, list):
        series = raw  # type: ignore[assignment]

    results: List[dict] = []
    for entry in series:
        item = str(entry.get("item") or entry.get("indicator") or entry.get("series") or "IMF CPI").strip()
        region = str(entry.get("region") or entry.get("country") or "All India").strip()
        date_value = entry.get("date") or entry.get("period")
        year_value = entry.get("year")
        month_value = entry.get("month")

        if date_value and not (year_value and month_value):
            try:
                parsed = datetime.fromisoformat(str(date_value))
                year_value = parsed.year
                month_value = parsed.month
            except ValueError:
                continue

        if year_value is None or month_value is None:
            continue

        try:
            year = int(year_value)
            if not _year_in_scope(year):
                continue
            month = month_to_number(month_value)
            value = _normalize_numeric(entry.get("value") or entry.get("obs_value"))
        except ValueError:
            continue

        region_type = str(entry.get("region_type") or "nation").lower()
        item_slug, canonical_name, extra_aliases = _resolve_item_override(item, "imf")
        results.append(
            _normalized_row(
                item_alias=item,
                region_alias=region,
                year=year,
                month=month,
                value=value,
                source="imf",
                region_type=region_type,
                item_slug=item_slug,
                canonical_name=canonical_name,
                extra_item_aliases=extra_aliases,
            )
        )
    return results


def _load_dpiit_dataframe(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".zip":
        with zipfile.ZipFile(path, "r") as archive:
            preferred = [name for name in archive.namelist() if not name.endswith("/")]
            if not preferred:
                raise ValueError("DPIIT archive is empty")
            # prioritize Excel over CSV, then fallback to first file
            preferred.sort(key=lambda name: (0 if name.lower().endswith((".xlsx", ".xls")) else (1 if name.lower().endswith(".csv") else 2), name))
            target_name = preferred[0]
            with archive.open(target_name) as handle:
                data = handle.read()
            buffer = BytesIO(data)
            if target_name.lower().endswith((".xlsx", ".xls")):
                return pd.read_excel(buffer, sheet_name=0)
            if target_name.lower().endswith(".csv"):
                return pd.read_csv(buffer)
            raise ValueError(f"Unsupported DPIIT file inside archive: {target_name}")

    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path, sheet_name=0)
    if suffix == ".csv":
        return pd.read_csv(path)

    raise ValueError(f"Unsupported DPIIT resource type: {path.suffix}")


def parse_dpiit_resource(path: Path) -> List[dict]:
    df = _load_dpiit_dataframe(path)

    df = df.rename(
        columns={
            str(col): str(col).strip().lower().replace(" ", "_")
            for col in df.columns
        }
    )

    column_groups = {
        "item": [
            "item",
            "commodity",
            "product",
            "group",
            "sub_group",
            "series",
            "commodity_name",
        ],
        "year": ["year", "financial_year", "yr"],
        "month": ["month", "month_name", "period"],
        "value": ["index", "wpi", "value", "level", "weighted_index"],
        "region": ["region", "state", "market", "centre", "location"],
        "sector": ["sector", "population", "segment"],
    }

    rename_map: dict[str, str] = {}
    for canonical, candidates in column_groups.items():
        for candidate in candidates:
            if candidate in df.columns:
                rename_map[candidate] = canonical
                break

    df = df.rename(columns=rename_map)

    required = {"item", "year", "month", "value"}
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"DPIIT WPI resource missing required columns: {', '.join(missing)}")

    results: List[dict] = []
    for _, row in df.iterrows():
        try:
            year = int(row["year"])
            if not _year_in_scope(year):
                continue
            month = month_to_number(row["month"])
            value = _normalize_numeric(row["value"])
            item_alias = str(row["item"]).strip() or "WPI All Commodities"
            item_slug_override, canonical_override, extra_aliases = _resolve_item_override(item_alias, "dpiit")
            slug_value = item_slug_override or slugify(f"wpi-{item_alias}")
            canonical_label = canonical_override or item_alias
            region_raw = str(row.get("region") or "All India").strip()
            sector_raw = str(row.get("sector") or "").strip()
            if not region_raw:
                region_raw = "All India"
            region_alias = region_raw
            if sector_raw and sector_raw.lower() not in region_raw.lower():
                region_alias = f"{region_raw} ({sector_raw})"
            region_type = "nation"
            lowered = region_alias.lower()
            if "rural" in lowered:
                region_type = "rural"
            elif "urban" in lowered:
                region_type = "urban"
            elif "india" not in lowered:
                region_type = "state"

            results.append(
                _normalized_row(
                    item_alias=item_alias,
                    region_alias=region_alias,
                    year=year,
                    month=month,
                    value=value,
                    source="dpiit",
                    item_slug=slug_value,
                    canonical_name=canonical_label,
                    region_type=region_type,
                    extra_region_aliases=(region_raw,) if region_raw != region_alias else None,
                    extra_item_aliases=extra_aliases,
                )
            )
        except ValueError:
            continue

    return results


def collect_validation_snapshot(engine) -> Mapping[str, object]:
    with engine.begin() as conn:
        item_count = conn.execute(select(func.count()).select_from(items_table)).scalar_one()
        region_count = conn.execute(select(func.count()).select_from(regions_table)).scalar_one()
        latest_date = conn.execute(select(func.max(series_table.c.date))).scalar_one()
    return {
        "items": int(item_count),
        "regions": int(region_count),
        "latest_date": latest_date.isoformat() if latest_date else None,
    }


def build_batches(
    mospi_annexes: Sequence[str],
    datagov_resources: Sequence[str],
    imf_series: Sequence[str],
    dpiit_resources: Sequence[str],
    raw_root: Path,
) -> List[SourceBatch]:
    batches: List[SourceBatch] = []

    for url in mospi_annexes:
        path = download_file(url, ensure_directory(raw_root / "mospi"))
        rows = parse_mospi_annex(path)
        batches.append(SourceBatch(name="mospi", file_path=path, rows=rows))

    for url in datagov_resources:
        path = download_file(url, ensure_directory(raw_root / "datagov"))
        rows = parse_datagov_resource(path)
        batches.append(SourceBatch(name="data_gov", file_path=path, rows=rows))

    for url in imf_series:
        path = download_file(url, ensure_directory(raw_root / "imf"))
        rows = parse_imf_series(path)
        batches.append(SourceBatch(name="imf", file_path=path, rows=rows))

    for url in dpiit_resources:
        path = download_file(url, ensure_directory(raw_root / "dpiit"))
        rows = parse_dpiit_resource(path)
        batches.append(SourceBatch(name="dpiit", file_path=path, rows=rows))

    return batches


def run_phase3_pipeline(
    *,
    mospi_annexes: Sequence[str],
    datagov_resources: Sequence[str],
    imf_series: Sequence[str],
    dpiit_resources: Sequence[str],
    database_url: Optional[str] = None,
    dry_run: bool = False,
) -> PipelineSummary:
    raw_root = current_run_directory(Path(__file__).resolve().parent / "data" / "raw" / "phase3")
    ensure_directory(raw_root)
    engine = get_engine(database_url)

    batches = build_batches(mospi_annexes, datagov_resources, imf_series, dpiit_resources, raw_root)
    summaries: List[Mapping[str, object]] = []

    for batch in batches:
        checksum = compute_file_checksum(batch.file_path)
        base_summary = {
            "source": batch.name,
            "file": str(batch.file_path),
            "rows": len(batch.rows),
            "checksum": checksum,
        }
        if dry_run or engine is None:
            preview_dir = ensure_directory(raw_root / "previews")
            preview_path = preview_dir / f"{batch.file_path.stem}_{batch.name}.csv"
            write_dry_run_csv([_base_row(row) for row in batch.rows], preview_path)
            summaries.append({**base_summary, "status": "preview", "preview": str(preview_path)})
            continue

        try:
            ingest_with_engine(engine, batch.file_path, batch.rows, checksum, logger)
            summaries.append({**base_summary, "status": "ingested"})
        except Exception as exc:  # noqa: BLE001
            summaries.append({**base_summary, "status": "failed", "error": str(exc)})
            raise

    totals = {
        "batches": len(batches),
        "rows": sum(batch["rows"] for batch in summaries),
    }

    if not dry_run and engine is not None:
        totals["validation"] = collect_validation_snapshot(engine)

    return PipelineSummary(batches=summaries, totals=totals)


@click.command()
@click.option("--mospi-annex", "mospi_annexes", multiple=True, help="MOSPI annex sources (file path or URL)")
@click.option("--datagov-resource", "datagov_resources", multiple=True, help="Data.gov.in CPI/WPI resources (CSV)")
@click.option("--imf-series", "imf_series", multiple=True, help="IMF CPI series resources (JSON)")
@click.option("--dpiit-resource", "dpiit_resources", multiple=True, help="DPIIT WPI resources (ZIP/Excel/CSV)")
@click.option("--database-url", envvar="DATABASE_URL", help="Database connection string")
@click.option("--dry-run", is_flag=True, help="Parse sources without writing to the database")
def main(
    mospi_annexes: Sequence[str],
    datagov_resources: Sequence[str],
    imf_series: Sequence[str],
    dpiit_resources: Sequence[str],
    database_url: Optional[str],
    dry_run: bool,
) -> None:
    """CLI entry point for the Phase 3 ETL pipeline."""

    if not (mospi_annexes or datagov_resources or imf_series or dpiit_resources):
        raise click.UsageError(
            "Provide at least one data source via --mospi-annex/--datagov-resource/--imf-series/--dpiit-resource"
        )

    summary = run_phase3_pipeline(
        mospi_annexes=mospi_annexes,
        datagov_resources=datagov_resources,
        imf_series=imf_series,
        dpiit_resources=dpiit_resources,
        database_url=database_url,
        dry_run=dry_run,
    )
    click.echo(json.dumps({"batches": summary.batches, "totals": summary.totals}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
