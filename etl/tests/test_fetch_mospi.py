import os
import sys
import uuid
from pathlib import Path

import pytest
from sqlalchemy import func, select, text

sys.path.append(str(Path(__file__).resolve().parents[2]))

from etl import models, utils
from etl.fetch_mospi import parse_annex, run_etl, write_dry_run_csv

FIXTURE = Path(__file__).parent / "fixtures" / "sample_annex.xlsx"


def test_parse_annex_yields_normalized_rows(tmp_path):
    rows = parse_annex(FIXTURE)
    assert len(rows) == 4
    assert rows[0]["item_alias"] == "Rice"
    assert rows[0]["region_alias"] == "All India"
    assert rows[0]["year"] == 2023
    assert rows[0]["month"] == 1
    assert rows[0]["index_value"] == 140.2


def test_write_dry_run_csv_creates_file(tmp_path):
    rows = parse_annex(FIXTURE)
    destination = tmp_path / "dry.csv"
    write_dry_run_csv(rows, destination)
    assert destination.exists()
    content = destination.read_text().splitlines()
    assert content[0] == "item_alias,region_alias,year,month,index_value"


@pytest.mark.integration
def test_etl_database_ingestion(monkeypatch):
    db_url = os.getenv("TEST_DATABASE_URL")
    if not db_url:
        pytest.skip("TEST_DATABASE_URL not set")

    engine = utils.get_engine(db_url)
    if engine is None:
        pytest.skip("Unable to create engine for TEST_DATABASE_URL")

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        utils.dispose_engine(db_url)
        pytest.skip("Database unavailable")

    models.metadata.drop_all(engine)
    models.metadata.create_all(engine)

    try:
        result = run_etl(str(FIXTURE), dry_run=False, database_url=db_url)
        assert result["status"] == "success"
        run_id = uuid.UUID(result["run_id"])

        with engine.connect() as conn:
            raw_count = conn.execute(
                select(func.count()).select_from(models.raw_series_table)
            ).scalar_one()
            assert raw_count == 4

            series_count = conn.execute(
                select(func.count()).select_from(models.series_table)
            ).scalar_one()
            assert series_count == 4

            items = conn.execute(select(models.items_table)).fetchall()
            assert {row.slug for row in items} >= {"rice", "milk"}
            for row in items:
                alias_list = row.aliases or []
                assert isinstance(alias_list, list)

            run_record = conn.execute(
                select(models.etl_runs_table).where(models.etl_runs_table.c.run_id == run_id)
            ).one()
            assert run_record.status == "success"

        second = run_etl(str(FIXTURE), dry_run=False, database_url=db_url)
        assert second["status"] == "success"

        with engine.connect() as conn:
            raw_count_twice = conn.execute(
                select(func.count()).select_from(models.raw_series_table)
            ).scalar_one()
            assert raw_count_twice == 8
            series_count_twice = conn.execute(
                select(func.count()).select_from(models.series_table)
            ).scalar_one()
            assert series_count_twice == 4
            run_count = conn.execute(
                select(func.count()).select_from(models.etl_runs_table)
            ).scalar_one()
            assert run_count == 2
    finally:
        models.metadata.drop_all(engine)
        utils.dispose_engine(db_url)
