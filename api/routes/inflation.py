"""FastAPI routes exposing inflation data endpoints."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from api.core.db import get_session

LOGGER = logging.getLogger("indiainflation.api.routes")

router = APIRouter(prefix="/api", tags=["inflation"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/inflation/latest")
async def inflation_latest() -> dict[str, Any]:
    query = text(
        """
        SELECT 'CPI' AS dataset, observation_month, sector, major_group, subgroup, index_value, yoy_inflation_rate
        FROM inflation_summary
        UNION ALL
        SELECT 'WPI' AS dataset, observation_month, NULL AS sector, category AS major_group, NULL AS subgroup, index_value, NULL AS yoy_inflation_rate
        FROM wpi_trends
        ORDER BY dataset, observation_month DESC
        """
    )
    async with get_session() as session:
        result = await session.execute(query)
        rows = [dict(row._mapping) for row in result]
    if not rows:
        raise HTTPException(status_code=404, detail="No inflation data available")
    return {"data": rows}


@router.get("/inflation/statewise")
async def inflation_statewise() -> dict[str, Any]:
    query = text("SELECT * FROM statewise_latest ORDER BY state, sector")
    async with get_session() as session:
        result = await session.execute(query)
        rows = [dict(row._mapping) for row in result]
    return {"data": rows}


@router.get("/inflation/trends")
async def inflation_trends(limit: int = Query(24, ge=1, le=120)) -> dict[str, Any]:
    query = text(
        """
        WITH cpi_series AS (
            SELECT observation_month, sector, major_group, index_value
            FROM cpi_national
            ORDER BY observation_month DESC
            LIMIT :limit
        ),
        wpi_series AS (
            SELECT observation_month, category, index_value
            FROM wpi
            ORDER BY observation_month DESC
            LIMIT :limit
        )
        SELECT 'CPI' AS dataset, observation_month, sector, major_group AS label, index_value
        FROM cpi_series
        UNION ALL
        SELECT 'WPI' AS dataset, observation_month, NULL AS sector, category AS label, index_value
        FROM wpi_series
        ORDER BY observation_month DESC, dataset
        """
    )
    async with get_session() as session:
        result = await session.execute(query, {"limit": limit})
        rows = [dict(row._mapping) for row in result]
    return {"data": rows}


@router.get("/inflation/compare")
async def inflation_compare(
    sector: str = Query("Combined"),
    cpi_group: str = Query("All Items"),
    wpi_category: str = Query("All Commodities"),
    months: int = Query(12, ge=1, le=60),
) -> dict[str, Any]:
    query = text(
        """
        WITH cpi_filtered AS (
            SELECT observation_month, index_value, yoy_inflation_rate
            FROM cpi_national
            WHERE sector = :sector AND major_group = :cpi_group
            ORDER BY observation_month DESC
            LIMIT :months
        ),
        wpi_filtered AS (
            SELECT observation_month, index_value
            FROM wpi
            WHERE category = :wpi_category
            ORDER BY observation_month DESC
            LIMIT :months
        )
        SELECT 'CPI' AS dataset, observation_month, index_value, yoy_inflation_rate
        FROM cpi_filtered
        UNION ALL
        SELECT 'WPI' AS dataset, observation_month, index_value, NULL AS yoy_inflation_rate
        FROM wpi_filtered
        ORDER BY observation_month DESC, dataset
        """
    )
    async with get_session() as session:
        result = await session.execute(
            query,
            {
                "sector": sector,
                "cpi_group": cpi_group,
                "wpi_category": wpi_category,
                "months": months,
            },
        )
        rows = [dict(row._mapping) for row in result]
    if not rows:
        raise HTTPException(status_code=404, detail="No comparison data available")
    return {"data": rows}


@router.get("/inflation/groups")
async def inflation_groups(sector: str = Query("Combined")) -> dict[str, Any]:
    query = text(
        """
        SELECT major_group, AVG(index_value) AS index_value, AVG(yoy_inflation_rate) AS yoy_inflation_rate
        FROM cpi_national
        WHERE sector = :sector AND observation_month = (
            SELECT MAX(observation_month) FROM cpi_national
        )
        GROUP BY major_group
        ORDER BY major_group
        """
    )
    async with get_session() as session:
        result = await session.execute(query, {"sector": sector})
        rows = [dict(row._mapping) for row in result]
    return {"data": rows}
