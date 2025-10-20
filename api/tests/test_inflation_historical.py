"""Tests for the historical CPI endpoint."""

import pytest
from httpx import AsyncClient

from api.main import app


@pytest.mark.asyncio
async def test_historical_cpi_default_range():
    """Test historical CPI endpoint with default date range."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical")

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "data" in data
        assert "coverage" in data
        assert "source" in data
        assert "cached" in data

        # Verify data array
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0

        # Verify first entry structure
        first_entry = data["data"][0]
        assert "date" in first_entry
        assert "cpi_value" in first_entry
        assert isinstance(first_entry["date"], str)
        assert isinstance(first_entry["cpi_value"], (int, float))

        # Verify date format (YYYY-MM)
        date_str = first_entry["date"]
        assert len(date_str) == 7  # YYYY-MM
        assert date_str[4] == "-"

        # Verify coverage info
        assert "from" in data["coverage"]
        assert "to" in data["coverage"]
        assert "total_points" in data["coverage"]


@pytest.mark.asyncio
async def test_historical_cpi_with_date_range():
    """Test historical CPI endpoint with specific date range."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=2000-01&to_date=2024-10")

        assert response.status_code == 200
        data = response.json()

        # Verify data exists
        assert len(data["data"]) > 0

        # Verify date range
        first_date = data["data"][0]["date"]
        last_date = data["data"][-1]["date"]

        assert first_date >= "2000-01"
        assert last_date <= "2024-10"


@pytest.mark.asyncio
async def test_historical_cpi_invalid_from_date_format():
    """Test historical CPI endpoint with invalid from date format."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=01-2000")

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid" in data["detail"] or "format" in data["detail"]


@pytest.mark.asyncio
async def test_historical_cpi_invalid_to_date_format():
    """Test historical CPI endpoint with invalid to date format."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?to_date=2024/10")

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


@pytest.mark.asyncio
async def test_historical_cpi_from_after_to():
    """Test historical CPI endpoint with from date after to date."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=2024-10&to_date=2000-01")

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


@pytest.mark.asyncio
async def test_historical_cpi_before_1958():
    """Test historical CPI endpoint with date before data coverage."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=1950-01&to_date=1960-01")

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "1958-01" in data["detail"]


@pytest.mark.asyncio
async def test_historical_cpi_ascending_order():
    """Test historical CPI data is sorted by date ascending."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=2000-01&to_date=2000-12")

        assert response.status_code == 200
        data = response.json()

        # Verify ascending order
        dates = [entry["date"] for entry in data["data"]]
        assert dates == sorted(dates)


@pytest.mark.asyncio
async def test_historical_cpi_cpi_values_positive():
    """Test that all CPI values are positive numbers."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=2020-01&to_date=2024-10")

        assert response.status_code == 200
        data = response.json()

        for entry in data["data"]:
            assert entry["cpi_value"] > 0, f"CPI value must be positive: {entry}"


@pytest.mark.asyncio
async def test_historical_metadata():
    """Test metadata endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical/metadata")

        assert response.status_code == 200
        data = response.json()

        # Verify metadata structure
        assert "data_coverage" in data
        assert "base_year" in data
        assert "update_frequency" in data
        assert "source" in data
        assert "sectors_available" in data
        assert "latest_update" in data

        # Verify base year
        assert data["base_year"] == 2012

        # Verify update frequency
        assert "Monthly" in data["update_frequency"]

        # Verify sectors
        assert isinstance(data["sectors_available"], list)
        assert "Combined" in data["sectors_available"]


@pytest.mark.asyncio
async def test_historical_cpi_cache_consistency():
    """Test that cached responses have consistent data."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First request (not cached)
        response1 = await client.get("/api/inflation/historical?from_date=2010-01&to_date=2010-12")
        data1 = response1.json()

        # Second request (should be cached)
        response2 = await client.get("/api/inflation/historical?from_date=2010-01&to_date=2010-12")
        data2 = response2.json()

        # Verify data is identical
        assert data1["data"] == data2["data"]
        assert data1["coverage"] == data2["coverage"]

        # Second response should indicate cached
        assert data2["cached"] is True


# Manual test helper for development
async def manual_test_sample_request():
    """Manual test to verify API response structure (for development)."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/inflation/historical?from_date=2000-01&to_date=2024-10")
        print(f"\nStatus: {response.status_code}")
        print(f"Response:\n{response.json()}\n")


if __name__ == "__main__":
    import asyncio

    asyncio.run(manual_test_sample_request())
