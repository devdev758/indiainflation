# Inflation Calculator - Quick Reference

## 🎯 At a Glance

| Component | File | Size | Purpose |
|-----------|------|------|---------|
| **Page** | `pages/inflation-calculator.tsx` | 19 KB | Full UI with form, results, chart |
| **Logic** | `lib/inflationCalculator.ts` | 7.3 KB | Calculate & validate inflation |
| **Chart** | `components/InflationChart.tsx` | 7.7 KB | Recharts CPI trend visualization |
| **API** | `pages/api/inflation/calculator.ts` | 4.5 KB | REST endpoint (POST) |
| **Docs** | `docs/INFLATION_CALCULATOR.md` | 11 KB | Full implementation guide |

## 🔗 URLs

- **Calculator:** `https://indiainflation.com/inflation-calculator`
- **API Endpoint:** `POST https://indiainflation.com/api/inflation/calculator`

## 📋 Form Inputs

```
Amount (₹):        [Input field] → Min ₹1, no upper limit
From Date:         [Month dropdown] [Year dropdown] → 1958 to current year
To Date:           [Month dropdown] [Year dropdown] → 1958 to current month
[Calculate Button]
```

## 📊 Output Metrics

```
Main: ₹100 in Jan 2000 is equivalent to ₹450 in Oct 2024
Card 1: Cumulative Inflation = 350%
Card 2: Avg Annual Rate (CAGR) = 4.87%
Card 3: Time Span = 24 years
Chart:  24-year CPI trend with dual axes
```

## 🧮 Calculation

```
Adjusted = (Amount × CPI_to) / CPI_from
Inflation% = ((CPI_to - CPI_from) / CPI_from) × 100
CAGR% = ((CPI_to / CPI_from)^(1/years) - 1) × 100
```

## 🔄 API Usage

**Request:**
```bash
curl -X POST /api/inflation/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "fromDate": "2000-01",
    "toDate": "2024-10",
    "includeTrend": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalAmount": 100,
    "adjustedAmount": 450.25,
    "inflationRate": 350.25,
    "avgAnnualRate": 4.87,
    "yearsSpan": 24,
    "monthsSpan": 294,
    "fromDate": "2000-01",
    "toDate": "2024-10",
    "fromCPIValue": 225.5,
    "toCPIValue": 1030.75,
    "trend": [{"date": "2000-01", "cpiValue": 225.5}, ...]
  }
}
```

## ✅ Validation Rules

| Input | Min | Max | Format | Required |
|-------|-----|-----|--------|----------|
| Amount | 1 | ∞ | Number | Yes |
| From Date | 1958-01 | Today | YYYY-MM | Yes |
| To Date | From Date | Today | YYYY-MM | Yes |

## ❌ Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `INVALID_AMOUNT` | Amount ≤ 0 | Enter positive number |
| `FROM_DATE_TOO_EARLY` | Before 1958-01 | Select 1958 or later |
| `TO_DATE_IN_FUTURE` | After today | Select current month or earlier |
| `TO_DATE_BEFORE_FROM_DATE` | Bad range | Adjust dates |
| `FROM_CPI_NOT_FOUND` | No data | Try different date |

## 📱 Responsive

| Size | Layout |
|------|--------|
| Mobile (< 768px) | Single column, stacked |
| Tablet (768-1024px) | 2-column dates |
| Desktop (> 1024px) | Full layout |

## 🧪 Test Cases

1. **Basic:** ₹100, 2000-01 to 2024-10 → ₹450+
2. **Edge:** ₹1, 1958-01 to 2024-10 → ₹4.50+
3. **Large:** ₹10,000,000, any valid range
4. **Short:** Same year, different months
5. **Long:** 1958-01 to 2024-10 (full range)

## 🔌 Integration

**Required Endpoint:**
```typescript
GET /api/inflation/historical
Response: { data: CPIDataPoint[] }
```

**Expected Data:**
```typescript
{
  date: "2024-10",
  cpiValue: 1247.35,
  sector: "Combined"
}
```

## 📈 Performance

- Page load: < 2s
- Calculate: < 300ms
- Chart render: < 500ms
- API response: < 500ms

## 🎨 Styling

- Framework: **Tailwind CSS**
- Colors: Blue (primary), slate (neutral), green (positive)
- Typography: Inter font (body), Lexend (display)
- Spacing: 6-8px grid
- Border radius: 8-24px (rounded-lg to rounded-3xl)

## ♿ Accessibility

- ✅ ARIA labels on inputs
- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ WCAG AA contrast
- ✅ Touch targets 48px+

## 🚀 Deployment

1. Set env: `NEXT_PUBLIC_SITE_URL`
2. Build: `npm run build`
3. Start: `npm start`
4. Test: `curl http://localhost:3000/inflation-calculator`

## 📚 Resources

- Main Docs: `docs/INFLATION_CALCULATOR.md`
- Full Summary: `docs/INFLATION_CALCULATOR_SUMMARY.md`
- Data Source: MoSPI (Ministry of Statistics & PI)
- Base Year: 2012 = 100

## 💡 Pro Tips

- Use ₹100 for easy mental math
- Select same month different years to see annual change
- Export results via API for research
- Chart shows full 66+ year history available
- CAGR smooths volatile years

## 🔗 Related Pages

- `/cpi-dashboard` - State-wise analysis
- `/compare` - CPI vs WPI comparison
- `/datasets` - Download full CPI data
- `/about` - Methodology & sources

---

**Status:** Production Ready ✅  
**Last Updated:** 2024-10-20
