import gzip
import json
import os
import sys
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import create_engine

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.append(str(CURRENT_DIR.parents[1]))

from etl import utils
from etl.export_json import run_export


def seed_database(engine) -> None:
    ddl_statements = [
        "DROP TABLE IF EXISTS series",
        "DROP TABLE IF EXISTS items",
        "DROP TABLE IF EXISTS regions",
        """
        CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            canonical_name TEXT NOT NULL,
            aliases TEXT NOT NULL DEFAULT '[]'
        )
        """,
        """
        CREATE TABLE regions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'unknown'
        )
        """,
        """
        CREATE TABLE series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            region_id INTEGER NOT NULL,
            date DATE NOT NULL,
            index_value NUMERIC(12, 6) NOT NULL
        )
        """,
    ]

    with engine.begin() as conn:
        for statement in ddl_statements:
            conn.exec_driver_sql(statement)
        conn.exec_driver_sql(
            "INSERT INTO items (slug, canonical_name, aliases) VALUES (:slug, :canonical_name, :aliases)",
            {"slug": "sample-item", "canonical_name": "Sample Item", "aliases": "[\"Sample Item\"]"},
        )
        conn.exec_driver_sql(
            "INSERT INTO regions (code, name, type) VALUES (:code, :name, :type)",
            {"code": "all-india", "name": "All India", "type": "nation"},
        )
        data_points = [
            (date(2023, 1, 1), 100),
            (date(2023, 2, 1), 102),
            (date(2023, 12, 1), 108),
            (date(2024, 1, 1), 110),
            (date(2024, 2, 1), 111),
        ]
        for point_date, value in data_points:
            conn.exec_driver_sql(
                """
                INSERT INTO series (item_id, region_id, date, index_value)
                VALUES (
                    (SELECT id FROM items WHERE slug = 'sample-item'),
                    (SELECT id FROM regions WHERE code = 'all-india'),
                    :date,
                    :index_value
                )
                """,
                {"date": point_date, "index_value": value},
            )


def load_export(path: Path) -> dict:
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        return json.load(handle)


@pytest.fixture()
def sqlite_database(tmp_path):
    database_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{database_path}", future=True)
    seed_database(engine)
    try:
        yield engine
    finally:
        engine.dispose()


def test_export_item_writes_local_file(tmp_path, monkeypatch, sqlite_database):
    db_url = str(sqlite_database.url) if hasattr(sqlite_database, "url") else f"sqlite:///{tmp_path / 'test.db'}"
    utils.dispose_engine(db_url)
    monkeypatch.setenv("DATABASE_URL", db_url)
    for key in ["S3_BUCKET", "S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY"]:
        monkeypatch.delenv(key, raising=False)

    output_dir = tmp_path / "exports"
    run_export(
        items=["sample-item"],
        regions=[],
        export_all=False,
        since=None,
        force=True,
        output_dir=str(output_dir),
        dry_run=False,
        database_url=db_url,
    )
    utils.dispose_engine(db_url)

    export_path = output_dir / "items" / "sample-item.json.gz"
    assert export_path.exists()
    payload = load_export(export_path)

    assert payload["slug"] == "sample-item"
    assert payload["name"] == "Sample Item"
    series = payload["series"]
    assert series[0]["yoy_pct"] is None
    jan_2024 = next(point for point in series if point["date"] == "2024-01-01")
    assert pytest.approx(jan_2024["yoy_pct"], abs=1e-4) == 10.0
    assert pytest.approx(jan_2024["mom_pct"], abs=1e-4) == 1.851851
    metadata = payload["metadata"]
    assert metadata["count"] == 5
    assert metadata["first_date"] == "2023-01-01"
    assert metadata["last_date"] == "2024-02-01"


def test_export_region_writes_local_file(tmp_path, monkeypatch, sqlite_database):
    db_url = str(sqlite_database.url) if hasattr(sqlite_database, "url") else f"sqlite:///{tmp_path / 'test.db'}"
    utils.dispose_engine(db_url)
    monkeypatch.setenv("DATABASE_URL", db_url)
    for key in ["S3_BUCKET", "S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY"]:
        monkeypatch.delenv(key, raising=False)

    output_dir = tmp_path / "exports"
    run_export(
        items=[],
        regions=["all-india"],
        export_all=False,
        since="2023-12",
        force=True,
        output_dir=str(output_dir),
        dry_run=False,
        database_url=db_url,
    )
    utils.dispose_engine(db_url)

    export_path = output_dir / "regions" / "all-india.json.gz"
    assert export_path.exists()
    payload = load_export(export_path)
    assert payload["slug"] == "all-india"
    series_dates = [entry["date"] for entry in payload["series"]]
    assert "2023-12-01" in series_dates
    assert "2023-02-01" not in series_dates
