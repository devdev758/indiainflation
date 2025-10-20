"""Download CPI datasets from MoSPI and persist raw files."""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Iterable

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from etl.utils import configure_logging, ensure_directory

LOGGER = configure_logging()

MO_SPI_DATASETS: dict[str, str] = {
    "cpi_national_sdmx": "https://www.mospi.gov.in/sites/default/files/SI_CPI/CPI-SDMX-Month-wise-2024.xlsx",
    "cpi_annexure_excel": "https://www.mospi.gov.in/sites/default/files/SI_CPI/Annexure_11.xlsx",
}


def _chunked(iterable: Iterable[bytes], chunk_size: int = 8192) -> Iterable[bytes]:
    for chunk in iterable:
        if chunk:
            yield chunk


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type((requests.RequestException,)),
)
def download_file(url: str, destination: Path) -> None:
    """Download a file with retry logic and save it to destination."""

    response = requests.get(url, stream=True, timeout=30)
    response.raise_for_status()

    checksum = hashlib.sha256()
    with destination.open("wb") as file_handle:
        for chunk in _chunked(response.iter_content(chunk_size=8192)):
            file_handle.write(chunk)
            checksum.update(chunk)
    LOGGER.info("Downloaded %s (sha256=%s)", url, checksum.hexdigest())


def file_needs_download(path: Path, url: str) -> bool:
    if not path.exists():
        return True
    LOGGER.info("Skipping %s; file already exists at %s", url, path)
    return False


def extract_cpi(base_dir: Path | None = None) -> None:
    """Fetch CPI datasets and store them under raw directory."""

    base_dir = base_dir or Path(__file__).resolve().parents[1] / "data" / "raw" / "cpi"
    ensure_directory(base_dir)

    run_dir = base_dir / datetime.utcnow().strftime("%Y_%m")
    ensure_directory(run_dir)

    for name, url in MO_SPI_DATASETS.items():
        extension = Path(url).suffix or ".dat"
        destination = run_dir / f"{name}{extension}"
        if not file_needs_download(destination, url):
            continue

        try:
            download_file(url, destination)
        except requests.HTTPError as exc:
            LOGGER.error("Failed to download %s -> %s: %s", url, destination, exc)
        except Exception as exc:  # noqa: BLE001
            LOGGER.exception("Unexpected error while downloading %s: %s", url, exc)


if __name__ == "__main__":
    extract_cpi()
