# Historical CPI API Endpoint Documentation

## Overview

The Historical CPI API provides full access to India's consumer price index data from **January 1958 to the present day**. This endpoint powers the Inflation Calculator and supports date-range filtering, efficient caching, and metadata queries.

---

## Endpoint Details

### 1. GET `/api/inflation/historical`

**Purpose:** Retrieve historical CPI data for the inflation calculator.

**Base URL:** `https://indiainflation.com`

**Full URL:** `https://indiainflation.com/api/inflation/historical`

#### Query Parameters

| Parameter | Type | Required | Format | Description | Example |
|-----------|------|----------|--------|-------------|---------|
| `from_date` | String | No | YYYY-MM | Start date (default: 1958-01) | `2000-01` |
| `to_date` | String | No | YYYY-MM | End date (default: current month) | `2024-10` |

#### Request Examples

**Fetch all available data:**
```bash
curl "https://indiainflation.com/api/inflation/historical"
```

**Fetch specific date range:**
```bash
curl "https://indiainflation.com/api/inflation/historical?from_date=2000-01&to_date=2024-10"
```

**Fetch single year:**
```bash
curl "https://indiainflation.com/api/inflation/historical?from_date=2020-01&to_date=2020-12"
```

---

#### Response Format

**Success (200 OK):**
```json
{
  "data": [
    {
      "date": "2000-01",
      "cpi_value": 225.5
    },
    {
      "date": "2000-02",
      "cpi_value": 226.1
    },
    ...
  ],
  "coverage": {
    "from": "1958-01",
    "to": "2024-10",
    "total_points": 804
  },
  "source": "MoSPI CPI All-India Combined (Base Year 2012 = 100)",
  "cached": false
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | Array | Array of CPI observations sorted by date ascending |
| `data[].date` | String | Observation date in YYYY-MM format |
| `data[].cpi_value` | Number | CPI index value (Base Year 2012 = 100) |
| `coverage` | Object | Metadata about data availability |
| `coverage.from` | String | Earliest available date |
| `coverage.to` | String | Latest available date |
| `coverage.total_points` | Number | Total monthly data points available |
| `source` | String | Data source attribution |
| `cached` | Boolean | Whether response was served from cache |

**Error (400 Bad Request):**
```json
{
  "detail": "Invalid 'from' date format. Use YYYY-MM."
}
```

**Error (404 Not Found):**
```json
{
  "detail": "No CPI data found for the requested date range."
}
```

**Error (500 Internal Server Error):**
```json
{
  "detail": "Internal server error while fetching historical CPI data."
}
```

---

### 2. GET `/api/inflation/historical/metadata`

**Purpose:** Get metadata about the historical CPI dataset.

**Full URL:** `https://indiainflation.com/api/inflation/historical/metadata`

#### Request Examples

```bash
curl "https://indiainflation.com/api/inflation/historical/metadata"
```

#### Response Format

**Success (200 OK):**
```json
{
  "data_coverage": {
    "from": "1958-01",
    "to": "2024-10",
    "total_months": 804
  },
  "base_year": 2012,
  "update_frequency": "Monthly",
  "source": "Ministry of Statistics and Programme Implementation (MoSPI), Government of India",
  "sectors_available": ["Combined", "Urban", "Rural"],
  "latest_update": "2024-10-20T13:45:00"
}
```

---

## Data Specifications

### Coverage

- **Start Date:** January 1958 (1958-01)
- **End Date:** Current month
- **Frequency:** Monthly
- **Total Points:** ~804 data points
- **Update Cycle:** Monthly (typically first week of the month)

### Data Source

- **Provider:** Ministry of Statistics and Programme Implementation (MoSPI), Government of India
- **Series:** CPI All-India Combined
- **Base Year:** 2012 = 100
- **URL:** https://mospi.gov.in/

### Data Quality

- ✓ Official government statistics
- ✓ Continuous monthly series (no gaps)
- ✓ Indexed to base 2012 = 100
- ✓ Regularly updated and verified

---

## Validation Rules

### Input Validation

| Rule | Description | Example |
|------|-------------|---------|
| Date Format | Must be YYYY-MM | ✓ 2024-10 ✗ 10-2024 |
| From Date | Must be ≥ 1958-01 | ✓ 2000-01 ✗ 1950-01 |
| To Date | Must be ≤ current month | ✓ 2024-10 ✗ 2099-12 |
| Date Range | from_date ≤ to_date | ✓ from=2000-01, to=2024-10 |
| Month Valid | Month must be 01-12 | ✓ 2024-01 ✗ 2024-13 |

### Error Codes

| Code | Status | Message | Solution |
|------|--------|---------|----------|
| 400 | Bad Request | Invalid date format | Use YYYY-MM format |
| 400 | Bad Request | Date before 1958-01 | Select 1958-01 or later |
| 400 | Bad Request | From date after to date | Adjust date range |
| 404 | Not Found | No data for range | Verify dates within coverage |
| 500 | Server Error | Internal error | Contact support |

---

## Performance & Caching

### Cache Strategy

- **TTL:** 60 minutes (3600 seconds)
- **Key:** Combination of from_date and to_date parameters
- **Storage:** In-memory cache
- **Reset:** Automatic on cache expiry

### Cache Examples

```
Request 1 (miss):  GET /api/inflation/historical?from=2000-01&to=2024-10
Response: {"cached": false, ...}

Request 2 (hit):   GET /api/inflation/historical?from=2000-01&to=2024-10
Response: {"cached": true, ...}  # Same data, served from memory
```

### Performance Metrics

- **Response Time:** < 500ms (first request)
- **Cached Response:** < 50ms
- **Data Volume:** ~804 records = ~15 KB JSON
- **Bandwidth:** Minimal (gzipped ~3 KB)

---

## Integration Guide

### Frontend (Next.js)

The endpoint is already integrated into the inflation calculator at:
- `web/pages/inflation-calculator.tsx`
- Hook: `useInflationData.ts`

**Usage in Components:**
```typescript
import { apiClient } from "@/components/apiClient";

// Fetch data
const response = await apiClient.get("/inflation/historical?from_date=2000-01&to_date=2024-10");
const cpiData = response.data.data;
```

### Backend (FastAPI)

**Route File:** `api/routes/inflation_historical.py`

**Key Components:**
- `get_historical_cpi()` - Main endpoint
- `get_historical_metadata()` - Metadata endpoint
- `_validate_date_range()` - Input validation
- `_cache` - In-memory cache storage

**Database Query:**
```sql
SELECT 
    TO_CHAR(observation_month, 'YYYY-MM') AS date,
    index_value AS cpi_value
FROM cpi_national
WHERE 
    sector = 'Combined'
    AND major_group = 'All Items'
    AND observation_month >= :from_date
    AND observation_month <= :to_date
ORDER BY observation_month ASC
```

---

## Usage Examples

### Example 1: Fetch All Historical Data

```bash
curl "https://indiainflation.com/api/inflation/historical" \
  -H "Accept: application/json"
```

**Response Summary:**
- First entry: 1958-01, CPI = 42.5
- Last entry: 2024-10, CPI = 1247.35
- Total points: 804 months
- Cache: false

### Example 2: Year 2000 Analysis

```bash
curl "https://indiainflation.com/api/inflation/historical?from_date=2000-01&to_date=2000-12"
```

**Response:**
- 12 data points (Jan-Dec 2000)
- CPI range: ~225.5 to ~232.5
- Can be used to calculate average CPI for the year

### Example 3: Decade Comparison

```bash
curl "https://indiainflation.com/api/inflation/historical?from_date=2010-01&to_date=2019-12"
```

**Response:**
- 120 data points (10 years)
- Shows inflation trends across a decade
- Useful for long-term analysis

### Example 4: JavaScript/Node.js

```javascript
// Fetch historical CPI data
async function getCPIData(fromDate, toDate) {
  try {
    const params = new URLSearchParams();
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    const response = await fetch(
      `https://indiainflation.com/api/inflation/historical?${params}`,
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Data points: ${data.data.length}`);
    console.log(`Coverage: ${data.coverage.from} to ${data.coverage.to}`);
    console.log(`Source: ${data.source}`);
    
    return data.data;
  } catch (error) {
    console.error("Failed to fetch CPI data:", error);
  }
}

// Usage
const cpiData = await getCPIData("2000-01", "2024-10");
```

### Example 5: Python

```python
import requests

def get_cpi_data(from_date=None, to_date=None):
    """Fetch historical CPI data from IndiaInflation API."""
    url = "https://indiainflation.com/api/inflation/historical"
    
    params = {}
    if from_date:
        params["from_date"] = from_date
    if to_date:
        params["to_date"] = to_date
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    print(f"Data points: {len(data['data'])}")
    print(f"Coverage: {data['coverage']['from']} to {data['coverage']['to']}")
    
    return data["data"]

# Usage
cpi_data = get_cpi_data(from_date="2000-01", to_date="2024-10")
for entry in cpi_data:
    print(f"{entry['date']}: {entry['cpi_value']}")
```

---

## Troubleshooting

### Issue: 400 Bad Request

**Problem:** Invalid date format error

**Solution:** Ensure dates are in YYYY-MM format
```bash
# Wrong
❌ curl ".../api/inflation/historical?from_date=01-01-2000"

# Correct
✓ curl ".../api/inflation/historical?from_date=2000-01"
```

### Issue: 404 Not Found

**Problem:** No data returned for date range

**Possible Causes:**
- Dates outside 1958-01 to present
- from_date after to_date
- Future dates selected

**Solution:**
```bash
# Check coverage first
curl ".../api/inflation/historical/metadata"

# Use valid range
curl ".../api/inflation/historical?from_date=1958-01&to_date=2024-10"
```

### Issue: Slow Response

**Problem:** First request taking > 1 second

**Cause:** Database query execution + serialization

**Solution:** 
- Subsequent requests will use cache (< 50ms)
- Pre-warm cache by calling endpoint periodically
- Or use specific date ranges to reduce data volume

### Issue: Inconsistent CPI Values

**Problem:** Same date returns different values on different requests

**Likely Cause:** Data updated upstream from MoSPI

**Solution:** Clear cache and re-fetch
```python
# Contact backend admin to clear cache
# Cache TTL is 60 minutes, so it auto-refreshes
```

---

## API Limits & Quotas

| Limit | Value | Notes |
|-------|-------|-------|
| Rate Limit | Unlimited | CORS-enabled for frontend |
| Response Size | ~15 KB | Full dataset (gzipped ~3 KB) |
| Request Timeout | 30 seconds | Typical: < 500ms |
| Cache TTL | 60 minutes | Auto-refresh |
| Max Date Range | 66+ years | Full 1958-present |

---

## Future Enhancements

### Planned Improvements

- [ ] Sector-specific endpoints (Urban, Rural, Combined separate endpoints)
- [ ] WPI (Wholesale Price Index) endpoint
- [ ] Comparison endpoint (CPI vs WPI)
- [ ] Time-series analysis endpoints
- [ ] Export to CSV/Excel formats
- [ ] Pagination for large datasets
- [ ] JSONP support for cross-domain requests
- [ ] GraphQL interface

### Coming Soon

- Redis-based caching (for horizontal scaling)
- Database-level compression
- Historical data archive (pre-1958, if available)
- International comparison data

---

## Support & Feedback

- **Issues:** Report via GitHub Issues
- **Questions:** Contact via support@indiainflation.com
- **Feedback:** Feedback form on website
- **Status:** https://indiainflation.com/status

---

## Related Resources

- **Frontend Inflation Calculator:** https://indiainflation.com/inflation-calculator
- **CPI Dashboard:** https://indiainflation.com/cpi-dashboard
- **Data Comparison:** https://indiainflation.com/compare
- **Datasets Page:** https://indiainflation.com/datasets
- **API Documentation:** https://indiainflation.com/api/docs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-10-20 | Initial release - Full historical CPI from 1958-present |

---

**Last Updated:** 2024-10-20  
**Status:** Production Ready ✅  
**Maintainer:** IndiaInflation Development Team
