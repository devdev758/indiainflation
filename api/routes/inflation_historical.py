"""FastAPI route for historical CPI data (1958-present)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from api.core.db import get_session

LOGGER = logging.getLogger("indiainflation.api.routes.inflation_historical")

router = APIRouter(prefix="/api", tags=["inflation"])

# Simple in-memory cache: {cache_key: (data, expiry_time)}
_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def _get_cache_key(from_date: str | None, to_date: str | None) -> str:
    """Generate cache key from query parameters."""
    return f"historical:{from_date or 'all'}:{to_date or 'all'}"


def _is_cache_valid(cache_key: str) -> bool:
    """Check if cache entry exists and is not expired."""
    if cache_key not in _cache:
        return False
    _, expiry_time = _cache[cache_key]
    if datetime.now().timestamp() > expiry_time:
        del _cache[cache_key]
        return False
    return True


def _get_cached_data(cache_key: str) -> Any | None:
    """Retrieve data from cache if valid."""
    if _is_cache_valid(cache_key):
        data, _ = _cache[cache_key]
        return data
    return None


def _set_cache(cache_key: str, data: Any) -> None:
    """Store data in cache with expiry time."""
    expiry_time = datetime.now().timestamp() + CACHE_TTL_SECONDS
    _cache[cache_key] = (data, expiry_time)


def _validate_date_format(date_str: str) -> bool:
    """Validate date string in YYYY-MM format."""
    try:
        datetime.strptime(date_str, "%Y-%m")
        return True
    except ValueError:
        return False


def _validate_date_range(from_date: str | None, to_date: str | None) -> tuple[bool, str]:
    """Validate date range parameters."""
    if from_date and not _validate_date_format(from_date):
        return False, "Invalid 'from' date format. Use YYYY-MM."

    if to_date and not _validate_date_format(to_date):
        return False, "Invalid 'to' date format. Use YYYY-MM."

    if from_date and to_date:
        from_obj = datetime.strptime(from_date, "%Y-%m")
        to_obj = datetime.strptime(to_date, "%Y-%m")
        if from_obj > to_obj:
            return False, "'from' date must be on or before 'to' date."

    # Check if from_date is before 1958-01 (data coverage start)
    if from_date:
        from_obj = datetime.strptime(from_date, "%Y-%m")
        if from_obj < datetime(1958, 1, 1):
            return False, "Data coverage begins from 1958-01. 'from' date cannot be earlier."

    return True, ""


@router.get("/inflation/historical")
async def get_historical_cpi(
    from_date: str | None = Query(None, description="Start date in YYYY-MM format (default: 1958-01)"),
    to_date: str | None = Query(None, description="End date in YYYY-MM format (default: current month)"),
) -> dict[str, Any]:
    """
    Fetch historical CPI data for the inflation calculator.

    Query Parameters:
        from_date (optional): Start date in YYYY-MM format. Default: 1958-01
        to_date (optional): End date in YYYY-MM format. Default: current month

    Returns:
        JSON object with:
        - data: Array of {date, cpi_value} objects sorted by date ascending
        - coverage: Metadata about data availability
        - source: Data source information

    Example:
        GET /api/inflation/historical?from_date=2000-01&to_date=2024-10
        Returns: {
            "data": [
                {"date": "2000-01", "cpi_value": 225.5},
                {"date": "2000-02", "cpi_value": 226.1},
                ...
            ],
            "coverage": {
                "from": "1958-01",
                "to": "2024-10",
                "total_points": 804
            },
            "source": "MoSPI CPI All-India Combined",
            "cached": false
        }
    """
    # Validate input parameters
    is_valid, error_msg = _validate_date_range(from_date, to_date)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Check cache
    cache_key = _get_cache_key(from_date, to_date)
    cached_response = _get_cached_data(cache_key)
    if cached_response:
        cached_response["cached"] = True
        return cached_response

    try:
        async with get_session() as session:
            # Build query for Combined (All-India) CPI with "All Items" major group
            query = text(
                """
                SELECT 
                    TO_CHAR(observation_month, 'YYYY-MM') AS date,
                    index_value AS cpi_value
                FROM cpi_national
                WHERE 
                    sector = 'Combined'
                    AND major_group = 'All Items'
                    (:from_date::date IS NULL OR observation_month >= :from_date::date)
                    (:to_date::date IS NULL OR observation_month <= :to_date::date)
                ORDER BY observation_month ASC
                """
            )

            # Convert YYYY-MM to DATE format for SQL (first day of month)
            from_date_sql = None
            to_date_sql = None
            if from_date:
                from_date_sql = f"{from_date}-01"
            if to_date:
                to_date_sql = f"{to_date}-01"

            result = await session.execute(
                query,
                {"from_date": from_date_sql, "to_date": to_date_sql},
            )
            rows = [dict(row._mapping) for row in result]

        if not rows:
            raise HTTPException(
                status_code=404,
                detail="No CPI data found for the requested date range.",
            )

        # Convert cpi_value to float for JSON serialization
        for row in rows:
            row["cpi_value"] = float(row["cpi_value"])

        # Get coverage info
        coverage_query = text(
            """
            SELECT 
                MIN(TO_CHAR(observation_month, 'YYYY-MM')) AS earliest,
                MAX(TO_CHAR(observation_month, 'YYYY-MM')) AS latest,
                COUNT(*) AS total_points
            FROM cpi_national
            WHERE sector = 'Combined' AND major_group = 'All Items'
            """
        )

        async with get_session() as session:
            coverage_result = await session.execute(coverage_query)
            coverage_row = coverage_result.fetchone()

        coverage = {
            "from": coverage_row[0] if coverage_row[0] else "1958-01",
            "to": coverage_row[1] if coverage_row[1] else datetime.now().strftime("%Y-%m"),
            "total_points": coverage_row[2] if coverage_row[2] else 0,
        }

        response = {
            "data": rows,
            "coverage": coverage,
            "source": "MoSPI CPI All-India Combined (Base Year 2012 = 100)",
            "cached": False,
        }

        # Cache the response
        _set_cache(cache_key, response)

        return response

    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        LOGGER.exception("Error fetching historical CPI data: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching historical CPI data.",
        ) from exc


@router.get("/inflation/historical/metadata")
async def get_historical_metadata() -> dict[str, Any]:
    """
    Get metadata about the historical CPI dataset.

    Returns:
        Metadata including coverage, base year, update frequency, source.

    Example:
        GET /api/inflation/historical/metadata
        Returns: {
            "data_coverage": {"from": "1958-01", "to": "2024-10", "total_months": 804},
            "base_year": 2012,
            "update_frequency": "Monthly",
            "source": "Ministry of Statistics and Programme Implementation (MoSPI)",
            "sectors_available": ["Combined", "Urban", "Rural"],
            "latest_update": "2024-10-15"
        }
    """
    try:
        async with get_session() as session:
            query = text(
                """
                SELECT 
                    MIN(TO_CHAR(observation_month, 'YYYY-MM')) AS earliest,
                    MAX(TO_CHAR(observation_month, 'YYYY-MM')) AS latest,
                    COUNT(*) AS total_points,
                    COUNT(DISTINCT sector) AS distinct_sectors
                FROM cpi_national
                WHERE major_group = 'All Items'
                """
            )
            result = await session.execute(query)
            row = result.fetchone()

        return {
            "data_coverage": {
                "from": row[0] or "1958-01",
                "to": row[1] or datetime.now().strftime("%Y-%m"),
                "total_months": row[2] or 0,
            },
            "base_year": 2012,
            "update_frequency": "Monthly",
            "source": "Ministry of Statistics and Programme Implementation (MoSPI), Government of India",
            "sectors_available": ["Combined", "Urban", "Rural"],
            "latest_update": datetime.now().isoformat(),
        }

    except Exception as exc:  # noqa: BLE001
        LOGGER.exception("Error fetching historical metadata: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching metadata.",
        ) from exc


def clear_cache() -> None:
    """Clear all cached historical CPI data. Useful for manual cache invalidation."""
    global _cache  # noqa: PLW0603
    _cache.clear()
    LOGGER.info("Historical CPI cache cleared")


__all__ = ["router", "clear_cache"]
