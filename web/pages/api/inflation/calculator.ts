import type { NextApiRequest, NextApiResponse } from "next";
import { calculateInflation, isInflationError, filterCPIDataByRange } from "@/lib/inflationCalculator";
import type { CPIDataPoint, InflationResult, InflationError } from "@/lib/inflationCalculator";

interface CalculatorRequestBody {
  amount: number;
  fromDate: string; // YYYY-MM format
  toDate: string; // YYYY-MM format
  includeTrend?: boolean; // Optional: include CPI trend data
}

interface CalculatorResponse {
  success: boolean;
  data?: {
    originalAmount: number;
    adjustedAmount: number;
    inflationRate: number;
    avgAnnualRate: number;
    yearsSpan: number;
    monthsSpan: number;
    fromDate: string;
    toDate: string;
    fromCPIValue: number;
    toCPIValue: number;
    trend?: Array<{
      date: string;
      cpiValue: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Mock CPI data - in production, this would come from database
const MOCK_CPI_DATA: CPIDataPoint[] = [
  { date: "1958-01", cpiValue: 42.5 },
  { date: "1958-02", cpiValue: 42.7 },
  { date: "1958-03", cpiValue: 42.9 },
  // ... This would be populated with full data
  // For demo, we'll show it can be extended
];

export default function handler(req: NextApiRequest, res: NextApiResponse<CalculatorResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are allowed"
      }
    });
  }

  try {
    const { amount, fromDate, toDate, includeTrend } = req.body as CalculatorRequestBody;

    // Validate required fields
    if (!amount || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REQUIRED_FIELDS",
          message: "amount, fromDate, and toDate are required"
        }
      });
    }

    // TODO: Fetch real CPI data from database
    // For now, we'll use mock data, but in production:
    // const cpiData = await getCPIDataFromDatabase();
    const cpiData = MOCK_CPI_DATA;

    if (cpiData.length === 0) {
      return res.status(500).json({
        success: false,
        error: {
          code: "NO_DATA_AVAILABLE",
          message: "CPI data is not currently available"
        }
      });
    }

    // Calculate inflation
    const result = calculateInflation(amount, fromDate, toDate, cpiData);

    if (isInflationError(result)) {
      const error = result as InflationError;
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    // Filter trend data if requested
    let trend: Array<{ date: string; cpiValue: number }> | undefined;
    if (includeTrend) {
      const trendData = filterCPIDataByRange(cpiData, (result as InflationResult).fromDate, (result as InflationResult).toDate);
      trend = trendData.map((point) => ({
        date: point.date,
        cpiValue: point.cpiValue
      }));
    }

    const calcResult = result as InflationResult;

    return res.status(200).json({
      success: true,
      data: {
        originalAmount: calcResult.originalAmount,
        adjustedAmount: calcResult.adjustedAmount,
        inflationRate: calcResult.inflationRate,
        avgAnnualRate: calcResult.avgAnnualRate,
        yearsSpan: calcResult.yearsSpan,
        monthsSpan: calcResult.monthsSpan,
        fromDate: calcResult.fromDate,
        toDate: calcResult.toDate,
        fromCPIValue: calcResult.fromCPIValue,
        toCPIValue: calcResult.toCPIValue,
        ...(trend && { trend })
      }
    });
  } catch (error) {
    console.error("Calculator API error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while processing your request"
      }
    });
  }
}

/**
 * EXAMPLE USAGE:
 *
 * POST /api/inflation/calculator
 * {
 *   "amount": 100,
 *   "fromDate": "2000-01",
 *   "toDate": "2024-10",
 *   "includeTrend": true
 * }
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "originalAmount": 100,
 *     "adjustedAmount": 450.25,
 *     "inflationRate": 350.25,
 *     "avgAnnualRate": 4.87,
 *     "yearsSpan": 24,
 *     "monthsSpan": 294,
 *     "fromDate": "2000-01",
 *     "toDate": "2024-10",
 *     "fromCPIValue": 225.5,
 *     "toCPIValue": 1030.75,
 *     "trend": [
 *       { "date": "2000-01", "cpiValue": 225.5 },
 *       ...
 *     ]
 *   }
 * }
 */
