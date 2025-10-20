export interface CPIDataPoint {
  date: string; // YYYY-MM format
  cpiValue: number;
  sector?: "Combined" | "Urban" | "Rural";
}

export interface InflationResult {
  originalAmount: number;
  adjustedAmount: number;
  inflationRate: number; // cumulative percentage
  avgAnnualRate: number; // average annual percentage
  yearsSpan: number;
  monthsSpan: number;
  fromDate: string; // YYYY-MM format
  toDate: string; // YYYY-MM format
  fromCPIValue: number;
  toCPIValue: number;
}

export interface InflationError {
  code: string;
  message: string;
}

// Earliest data point: January 1958
const EARLIEST_DATE = new Date(1958, 0, 1); // January 1958
const CURRENT_DATE = new Date();

/**
 * Validates date string in YYYY-MM format
 */
function isValidDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month] = dateStr.split("-").map(Number);
  return month >= 1 && month <= 12;
}

/**
 * Parses YYYY-MM date string to Date object
 */
function parseDate(dateStr: string): Date {
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Formats Date to YYYY-MM string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Finds the closest CPI data point for a given date
 */
function findClosestCPIPoint(
  targetDate: string,
  cpiData: CPIDataPoint[],
  direction: "before" | "after" = "before"
): CPIDataPoint | null {
  const targetTime = parseDate(targetDate).getTime();

  if (direction === "before") {
    // Find the latest CPI point on or before target date
    for (let i = cpiData.length - 1; i >= 0; i--) {
      const dataTime = parseDate(cpiData[i].date).getTime();
      if (dataTime <= targetTime) {
        return cpiData[i];
      }
    }
  } else {
    // Find the earliest CPI point on or after target date
    for (let i = 0; i < cpiData.length; i++) {
      const dataTime = parseDate(cpiData[i].date).getTime();
      if (dataTime >= targetTime) {
        return cpiData[i];
      }
    }
  }

  return null;
}

/**
 * Calculates inflation between two dates using CPI data
 */
export function calculateInflation(
  amount: number,
  fromDate: string,
  toDate: string,
  cpiData: CPIDataPoint[]
): InflationResult | InflationError {
  // Validate inputs
  if (!amount || amount <= 0) {
    return { code: "INVALID_AMOUNT", message: "Amount must be greater than 0" };
  }

  if (!isValidDateFormat(fromDate)) {
    return { code: "INVALID_FROM_DATE", message: "From date must be in YYYY-MM format" };
  }

  if (!isValidDateFormat(toDate)) {
    return { code: "INVALID_TO_DATE", message: "To date must be in YYYY-MM format" };
  }

  if (!cpiData || cpiData.length === 0) {
    return { code: "NO_CPI_DATA", message: "CPI data is required for calculation" };
  }

  // Parse dates
  const fromDateObj = parseDate(fromDate);
  const toDateObj = parseDate(toDate);

  // Validate date ranges
  if (fromDateObj < EARLIEST_DATE) {
    return {
      code: "FROM_DATE_TOO_EARLY",
      message: `Data coverage begins from ${formatDate(EARLIEST_DATE)}. From date cannot be earlier.`
    };
  }

  if (toDateObj < fromDateObj) {
    return {
      code: "TO_DATE_BEFORE_FROM_DATE",
      message: "To date must be on or after from date"
    };
  }

  if (toDateObj > CURRENT_DATE) {
    return {
      code: "TO_DATE_IN_FUTURE",
      message: `To date cannot be in the future. Latest available: ${formatDate(CURRENT_DATE)}`
    };
  }

  // Find CPI values
  const fromCPIPoint = findClosestCPIPoint(fromDate, cpiData, "before");
  const toCPIPoint = findClosestCPIPoint(toDate, cpiData, "before");

  if (!fromCPIPoint) {
    return {
      code: "FROM_CPI_NOT_FOUND",
      message: `No CPI data found for or before ${fromDate}`
    };
  }

  if (!toCPIPoint) {
    return {
      code: "TO_CPI_NOT_FOUND",
      message: `No CPI data found for or before ${toDate}`
    };
  }

  // Calculate inflation
  const fromCPIValue = fromCPIPoint.cpiValue;
  const toCPIValue = toCPIPoint.cpiValue;

  if (fromCPIValue === 0) {
    return { code: "INVALID_CPI_DATA", message: "From date CPI value cannot be zero" };
  }

  // Calculate adjusted amount
  const adjustedAmount = (amount * toCPIValue) / fromCPIValue;

  // Calculate cumulative inflation rate
  const inflationRate = ((toCPIValue - fromCPIValue) / fromCPIValue) * 100;

  // Calculate time span
  const timeDiff = toCPIPoint.date > fromCPIPoint.date ? 
    parseDate(toCPIPoint.date).getTime() - parseDate(fromCPIPoint.date).getTime() :
    0;
  
  const years = Math.abs((toDateObj.getFullYear() - fromDateObj.getFullYear()) + 
                        (toDateObj.getMonth() - fromDateObj.getMonth()) / 12);
  
  const months = Math.abs(
    (toDateObj.getFullYear() - fromDateObj.getFullYear()) * 12 +
    (toDateObj.getMonth() - fromDateObj.getMonth())
  );

  // Calculate average annual rate (CAGR - Compound Annual Growth Rate)
  let avgAnnualRate = 0;
  if (years > 0) {
    avgAnnualRate = (Math.pow(toCPIValue / fromCPIValue, 1 / years) - 1) * 100;
  }

  return {
    originalAmount: amount,
    adjustedAmount: Math.round(adjustedAmount * 100) / 100,
    inflationRate: Math.round(inflationRate * 100) / 100,
    avgAnnualRate: Math.round(avgAnnualRate * 100) / 100,
    yearsSpan: Math.floor(years),
    monthsSpan: months,
    fromDate: fromCPIPoint.date,
    toDate: toCPIPoint.date,
    fromCPIValue: Math.round(fromCPIValue * 100) / 100,
    toCPIValue: Math.round(toCPIValue * 100) / 100
  };
}

/**
 * Formats currency in Indian Rupees
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formats percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Returns date range for available CPI data
 */
export function getDataCoverage(): { from: string; to: string; fromYear: number; toYear: number } {
  return {
    from: formatDate(EARLIEST_DATE),
    to: formatDate(CURRENT_DATE),
    fromYear: EARLIEST_DATE.getFullYear(),
    toYear: CURRENT_DATE.getFullYear()
  };
}

/**
 * Generates array of months between two dates (for chart)
 */
export function getMonthsBetween(fromDate: string, toDate: string): string[] {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  const months: string[] = [];

  const current = new Date(from);
  while (current <= to) {
    months.push(formatDate(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Filters CPI data within date range
 */
export function filterCPIDataByRange(
  cpiData: CPIDataPoint[],
  fromDate: string,
  toDate: string
): CPIDataPoint[] {
  const fromTime = parseDate(fromDate).getTime();
  const toTime = parseDate(toDate).getTime();

  return cpiData.filter((point) => {
    const pointTime = parseDate(point.date).getTime();
    return pointTime >= fromTime && pointTime <= toTime;
  });
}

/**
 * Checks if result is an error
 */
export function isInflationError(result: InflationResult | InflationError): result is InflationError {
  return "code" in result && "message" in result && !("adjustedAmount" in result);
}
