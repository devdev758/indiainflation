"""Export normalized CPI series into gzipped JSON blobs."""

from __future__ import annotations

import gzip
import json
import os
import tempfile
from contextlib import nullcontext
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import boto3
import click
from sqlalchemy import select

from .models import items_table, regions_table, series_table
from .utils import StorageConfig, configure_logging, ensure_directory, get_engine


logger = configure_logging()


@dataclass
class ExportTarget:
    """Container describing an export target."""

    slug: str
    kind: str  # "item" or "region"


def month_delta(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month)


def compute_series_metrics(rows: Iterable[Tuple[date, Decimal]]) -> Tuple[List[dict], dict]:
    history: Dict[Tuple[int, int], Decimal] = {}
    entries: List[dict] = []
    prev_date: Optional[date] = None
    prev_value: Optional[Decimal] = None
    total = Decimal("0")

    for current_date, value in rows:
        key = (current_date.year, current_date.month)
        history[key] = value

        yoy_value = None
        ref_key = (current_date.year - 1, current_date.month)
        ref_value = history.get(ref_key)
        if ref_value and ref_value != 0:
            yoy_value = float((value / ref_value - 1) * 100)

        mom_value = None
        if prev_date and prev_value and prev_value != 0 and month_delta(prev_date, current_date) == 1:
            mom_value = float((value / prev_value - 1) * 100)

        entries.append(
            {
                "date": current_date.isoformat(),
                "index_value": float(value),
                "yoy_pct": round(yoy_value, 6) if yoy_value is not None else None,
                "mom_pct": round(mom_value, 6) if mom_value is not None else None,
            }
        )

        prev_date = current_date
        prev_value = value
        total += value

    if not entries:
        return entries, {
            "first_date": None,
            "last_date": None,
            "count": 0,
            "last_index_value": None,
            "average_index_value": None,
        }

    avg = float(total / Decimal(len(entries)))
    metadata = {
        "first_date": entries[0]["date"],
        "last_date": entries[-1]["date"],
        "count": len(entries),
        "last_index_value": entries[-1]["index_value"],
        "average_index_value": avg,
    }
    return entries, metadata


def write_gzip_json(payload: dict, destination: Path, force: bool) -> Optional[Path]:
    ensure_directory(destination.parent)
    if destination.exists() and not force:
        logger.info("Skipped existing export %s (use --force to overwrite)", destination)
        return None

    tmp_ctx = nullcontext(destination)
    temp_path: Optional[Path] = None
    try:
        tmp_file = tempfile.NamedTemporaryFile("wb", delete=False, dir=destination.parent)
        temp_path = Path(tmp_file.name)
        with tmp_file:
            with gzip.GzipFile(fileobj=tmp_file, mode="wb") as gz:
                gz.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
        temp_path.replace(destination)
    finally:
        if temp_path and temp_path.exists() and temp_path != destination:
            temp_path.unlink(missing_ok=True)

    return destination


def upload_to_s3(storage: StorageConfig, local_path: Path, remote_key: str) -> None:
    if not storage.bucket:
        return

    session = boto3.session.Session(
        aws_access_key_id=storage.access_key,
        aws_secret_access_key=storage.secret_key,
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )
    client = session.client("s3", endpoint_url=storage.endpoint)
    client.upload_file(
        str(local_path),
        storage.bucket,
        remote_key,
        ExtraArgs={"ContentType": "application/json", "ContentEncoding": "gzip"},
    )


def fetch_item_series(conn, slug: str, since: Optional[date]):
    stmt = (
        select(
            items_table.c.id,
            items_table.c.canonical_name,
            series_table.c.date,
            series_table.c.index_value,
        )
        .join(series_table, series_table.c.item_id == items_table.c.id)
        .where(items_table.c.slug == slug)
    )
    if since is not None:
        stmt = stmt.where(series_table.c.date >= since)
    stmt = stmt.order_by(series_table.c.date)

    rows = conn.execute(stmt).fetchall()
    if not rows:
        return None

    item_id = rows[0][0]
    name = rows[0][1]
    series_rows = [(row[2], Decimal(str(row[3]))) for row in rows]
    return item_id, name, series_rows


def fetch_region_series(conn, code: str, since: Optional[date]):
    stmt = (
        select(
            regions_table.c.id,
            regions_table.c.name,
            series_table.c.date,
            series_table.c.index_value,
        )
        .join(series_table, series_table.c.region_id == regions_table.c.id)
        .where(regions_table.c.code == code)
    )
    if since is not None:
        stmt = stmt.where(series_table.c.date >= since)
    stmt = stmt.order_by(series_table.c.date)

    rows = conn.execute(stmt).fetchall()
    if not rows:
        return None

    region_id = rows[0][0]
    name = rows[0][1]
    series_rows = [(row[2], Decimal(str(row[3]))) for row in rows]
    return region_id, name, series_rows


def load_all_slugs(conn, table) -> List[str]:  # type: ignore[no-untyped-def]
    return conn.execute(select(table.c.slug)).scalars().all()


def parse_since(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        dt = datetime.strptime(value, "%Y-%m")
        return date(dt.year, dt.month, 1)
    except ValueError as exc:  # noqa: RUF100
        raise click.BadParameter("Expected YYYY-MM format for --since") from exc


def build_payload(slug: str, name: str, series_rows: List[Tuple[date, Decimal]]) -> dict:
    series_entries, metadata = compute_series_metrics(series_rows)
    payload = {
        "slug": slug,
        "name": name,
        "metadata": metadata,
        "series": series_entries,
        "generated_at": datetime.utcnow().isoformat(),
    }
    return payload


def export_target(
    conn,
    target: ExportTarget,
    output_dir: Path,
    since: Optional[date],
    force: bool,
    dry_run: bool,
    storage: StorageConfig,
) -> Optional[Path]:
    if target.kind == "item":
        result = fetch_item_series(conn, target.slug, since)
        if not result:
            logger.warning("No data found for item %s", target.slug)
            return None
        _, name, rows = result
        payload = build_payload(target.slug, name, rows)
        local_path = output_dir / "items" / f"{target.slug}.json.gz"
        s3_key = f"exports/items/{target.slug}.json.gz"
    else:
        result = fetch_region_series(conn, target.slug, since)
        if not result:
            logger.warning("No data found for region %s", target.slug)
            return None
        _, name, rows = result
        payload = build_payload(target.slug, name, rows)
        local_path = output_dir / "regions" / f"{target.slug}.json.gz"
        s3_key = f"exports/regions/{target.slug}.json.gz"

    if dry_run:
        logger.info("Dry-run: would export %s to %s", target.slug, local_path)
        return None

    written = write_gzip_json(payload, local_path, force)
    if written is None:
        return None

    if storage.bucket:
        upload_to_s3(storage, written, s3_key)
        logger.info("Uploaded %s to s3://%s/%s", written.name, storage.bucket, s3_key)

    logger.info("Exported %s -> %s", target.slug, written)
    return written


def run_export(
    items: Iterable[str],
    regions: Iterable[str],
    export_all: bool,
    since: Optional[str],
    force: bool,
    output_dir: Optional[str],
    dry_run: bool,
    database_url: Optional[str] = None,
) -> dict:
    since_date = parse_since(since)
    engine = get_engine(database_url)
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")

    out_dir = Path(output_dir) if output_dir else Path(__file__).resolve().parent / "data" / "exports"
    ensure_directory(out_dir)
    storage = StorageConfig.from_env()

    targets: List[ExportTarget] = []

    with engine.begin() as conn:
        item_slugs = list(items)
        region_slugs = list(regions)
        if export_all:
            item_slugs = load_all_slugs(conn, items_table)
            region_slugs = conn.execute(select(regions_table.c.code)).scalars().all()
        targets.extend(ExportTarget(slug=s, kind="item") for s in item_slugs)
        targets.extend(ExportTarget(slug=s, kind="region") for s in region_slugs)

        results = []
        for target in targets:
            try:
                path = export_target(conn, target, out_dir, since_date, force, dry_run, storage)
                results.append({"slug": target.slug, "kind": target.kind, "path": str(path) if path else None})
            except Exception as exc:  # noqa: BLE001
                logger.error("Failed to export %s: %s", target.slug, exc)
                raise

    return {"targets": results, "dry_run": dry_run, "output_dir": str(out_dir)}


@click.command()
@click.option("--item", "items", multiple=True, help="Export only the given item slug")
@click.option("--region", "regions", multiple=True, help="Export only the given region slug")
@click.option("--all", "export_all", is_flag=True, help="Export all items and regions")
@click.option("--since", type=str, help="Limit series to dates >= YYYY-MM")
@click.option("--force", is_flag=True, help="Overwrite existing files")
@click.option("--output-dir", type=click.Path(path_type=Path), help="Directory to write exports")
@click.option("--dry-run", is_flag=True, help="Preview actions without writing files")
@click.option("--database-url", envvar="DATABASE_URL", help="Database connection string")
def main(
    items: Tuple[str, ...],
    regions: Tuple[str, ...],
    export_all: bool,
    since: Optional[str],
    force: bool,
    output_dir: Optional[Path],
    dry_run: bool,
    database_url: Optional[str],
) -> None:
    """Export normalized CPI series into JSON for items and regions."""

    if not (items or regions or export_all):
        raise click.UsageError("Specify --item, --region, or --all")

    try:
        run_export(
            items=items,
            regions=regions,
            export_all=export_all,
            since=since,
            force=force,
            output_dir=str(output_dir) if output_dir else None,
            dry_run=dry_run,
            database_url=database_url,
        )
    except RuntimeError as exc:
        raise click.ClickException(str(exc)) from exc


if __name__ == "__main__":
    main()
