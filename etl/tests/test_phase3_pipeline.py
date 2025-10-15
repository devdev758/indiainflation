import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.append(str(CURRENT_DIR.parents[1]))

from etl.phase3_pipeline import (
    parse_datagov_resource,
    parse_dpiit_resource,
    parse_imf_series,
    run_phase3_pipeline,
)
from etl.utils import ensure_directory


FIXTURES = CURRENT_DIR / "fixtures"


def test_parse_datagov_resource_generates_regional_rows():
    fixture = FIXTURES / "datagov_phase3.csv"
    rows = parse_datagov_resource(fixture)
    assert len(rows) == 5
    first = rows[0]
    assert first["region_alias"].startswith("Delhi")
    assert first["region_type"] == "urban"
    assert first["source"] == "data_gov"
    assert first["year"] == 2024
    assert first["month"] == 1


def test_parse_imf_series_returns_normalized_rows():
    fixture = FIXTURES / "imf_phase3.json"
    rows = parse_imf_series(fixture)
    assert len(rows) == 2
    values = {row["month"] for row in rows}
    assert values == {2, 3}
    for row in rows:
        assert row["region_type"] == "nation"
        assert row["source"] == "imf"


def test_parse_dpiit_resource_handles_wpi_csv():
    fixture = FIXTURES / "dpiit_wpi.csv"
    rows = parse_dpiit_resource(fixture)
    assert len(rows) == 3
    first = rows[0]
    assert first["source"] == "dpiit"
    assert first["region_type"] == "nation"
    assert first["month"] == 1
    assert first["item_slug"].startswith("wpi-")


def test_run_phase3_pipeline_dry_run_creates_previews(tmp_path, monkeypatch):
    mospi_fixture = FIXTURES / "sample_annex.xlsx"
    datagov_fixture = FIXTURES / "datagov_phase3.csv"
    imf_fixture = FIXTURES / "imf_phase3.json"
    dpiit_fixture = FIXTURES / "dpiit_wpi.csv"

    def _fake_run_directory(base: Path) -> Path:  # noqa: ANN001
        return ensure_directory(tmp_path / "run")

    monkeypatch.setattr("etl.phase3_pipeline.current_run_directory", _fake_run_directory)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    summary = run_phase3_pipeline(
        mospi_annexes=[str(mospi_fixture)],
        datagov_resources=[str(datagov_fixture)],
        imf_series=[str(imf_fixture)],
        dpiit_resources=[str(dpiit_fixture)],
        dry_run=True,
    )

    assert summary.totals["batches"] == 4
    assert summary.totals["rows"] > 0
    previews = [batch for batch in summary.batches if batch["status"] == "preview"]
    assert len(previews) == 4
    for batch in previews:
        preview_path = Path(batch["preview"])
        assert preview_path.exists()
