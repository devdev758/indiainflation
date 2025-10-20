import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { apiClient } from "@/components/apiClient";
import { InflationChart } from "@/components/InflationChart";
import { calculateInflation, formatCurrency, formatPercent, getDataCoverage, filterCPIDataByRange, isInflationError } from "@/lib/inflationCalculator";
import { generateFinancialToolSchema } from "@/lib/structuredData";
import type { CPIDataPoint, InflationResult, InflationError } from "@/lib/inflationCalculator";

interface CalculationState {
  result?: InflationResult | InflationError;
  loading: boolean;
  error?: string;
}

export default function InflationCalculatorPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/inflation-calculator`;

  const [amount, setAmount] = useState("100");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cpiData, setCpiData] = useState<CPIDataPoint[]>([]);
  const [calculationState, setCalculationState] = useState<CalculationState>({ loading: false });
  const [dataLoading, setDataLoading] = useState(true);

  // Get data coverage
  const dataCoverage = useMemo(() => getDataCoverage(), []);

  // Initialize default dates
  useEffect(() => {
    // Set default from date to 1 year ago
    const fromYear = dataCoverage.fromYear;
    const fromMonth = "01";
    setFromDate(`${fromYear}-${fromMonth}`);

    // Set default to date to current month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    setToDate(`${currentYear}-${currentMonth}`);
  }, [dataCoverage]);

  // Fetch CPI data
  useEffect(() => {
    const fetchCPIData = async () => {
      try {
        setDataLoading(true);
        const response = await apiClient.get<{ data: CPIDataPoint[] }>("/inflation/historical");
        if (response.data && response.data.data) {
          setCpiData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch CPI data:", error);
        // Fallback: use empty array, show error to user
        setCalculationState({
          loading: false,
          error: "Unable to load CPI data. Please try again later."
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchCPIData();
  }, []);

  // Handle calculation
  const handleCalculate = () => {
    if (!amount || !fromDate || !toDate) {
      setCalculationState({
        loading: false,
        error: "Please fill in all required fields"
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setCalculationState({
        loading: false,
        error: "Amount must be a positive number"
      });
      return;
    }

    setCalculationState({ loading: true });

    // Simulate API call delay (in real app, might be async)
    setTimeout(() => {
      const result = calculateInflation(numAmount, fromDate, toDate, cpiData);
      setCalculationState({ loading: false, result });
    }, 300);
  };

  // Get filtered chart data
  const chartData = useMemo(() => {
    if (!calculationState.result || isInflationError(calculationState.result)) {
      return [];
    }
    return filterCPIDataByRange(cpiData, calculationState.result.fromDate, calculationState.result.toDate);
  }, [calculationState.result, cpiData]);

  // Generate structured data
  const toolSchema = generateFinancialToolSchema({
    name: "Indian Inflation Calculator",
    description: "Calculate how inflation has affected the value of money in India from 1958 to present",
    url: canonicalUrl,
    dataRange: `${dataCoverage.from} to ${dataCoverage.to}`
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: new Date(2024, i, 1).toLocaleDateString("en-US", { month: "short" })
  }));

  return (
    <>
      <Head>
        <title>Indian Inflation Calculator | Historical Rupee Converter | Indiainflation</title>
        <meta
          name="description"
          content="Calculate how inflation has changed the value of money in India. Use historical CPI data from 1958 to convert rupee amounts to today's prices."
        />
        <meta
          name="keywords"
          content="inflation calculator India, rupee converter, CPI calculator, historical inflation, money value calculator"
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Indian Inflation Calculator | Indiainflation" />
        <meta
          property="og:description"
          content="Calculate historical rupee values using India's CPI data from 1958 to present. See how inflation has impacted purchasing power."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Indian Inflation Calculator | Indiainflation" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      </Head>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Financial Tool</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Indian Inflation Calculator</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Discover how inflation has affected the purchasing power of money in India. Use historical CPI data dating back to 1958 to convert any amount to its modern-day equivalent.
            </p>
          </div>
        </section>

        {/* Calculator Card */}
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-slate-900">Calculate Inflation</h2>

          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Amount (₹)</label>
              <div className="mt-2 flex items-center">
                <span className="text-2xl font-bold text-slate-900">₹</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in rupees"
                  className="ml-2 flex-1 rounded-lg border border-slate-200 px-4 py-3 text-lg text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Minimum ₹1, suggest multiples of ₹100 for clarity</p>
            </div>

            {/* Date Selection Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* From Date */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">From (Select Month & Year)</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={fromDate.split("-")[1] || ""}
                    onChange={(e) => {
                      const year = fromDate.split("-")[0] || dataCoverage.fromYear;
                      setFromDate(`${year}-${e.target.value}`);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Month</option>
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={fromDate.split("-")[0] || ""}
                    onChange={(e) => {
                      const month = fromDate.split("-")[1] || "01";
                      setFromDate(`${e.target.value}-${month}`);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from(
                      { length: new Date().getFullYear() - dataCoverage.fromYear + 1 },
                      (_, i) => dataCoverage.fromYear + i
                    )
                      .reverse()
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                </div>
                {fromDate && (
                  <p className="text-xs font-medium text-blue-600">
                    Selected: {new Date(fromDate + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* To Date */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">To (Select Month & Year)</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={toDate.split("-")[1] || ""}
                    onChange={(e) => {
                      const year = toDate.split("-")[0] || new Date().getFullYear();
                      setToDate(`${year}-${e.target.value}`);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Month</option>
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={toDate.split("-")[0] || ""}
                    onChange={(e) => {
                      const month = toDate.split("-")[1] || "01";
                      setToDate(`${e.target.value}-${month}`);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from(
                      { length: new Date().getFullYear() - dataCoverage.fromYear + 1 },
                      (_, i) => dataCoverage.fromYear + i
                    )
                      .reverse()
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                </div>
                {toDate && (
                  <p className="text-xs font-medium text-blue-600">
                    Selected: {new Date(toDate + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {calculationState.error && !isInflationError(calculationState.result) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{calculationState.error}</p>
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={dataLoading || calculationState.loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculationState.loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {calculationState.result && !isInflationError(calculationState.result) && (
          <section className="space-y-6">
            {/* Main Result Card */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-600">Inflation Adjusted Value</p>
                  <p className="mt-3 text-4xl font-bold text-slate-900">
                    {formatCurrency(calculationState.result.adjustedAmount)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatCurrency(calculationState.result.originalAmount)} in{" "}
                    {new Date(calculationState.result.fromDate + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric"
                    })}{" "}
                    is worth{" "}
                    {formatCurrency(calculationState.result.adjustedAmount)} in{" "}
                    {new Date(calculationState.result.toDate + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Cumulative Inflation</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatPercent(calculationState.result.inflationRate)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Avg. Annual Rate (CAGR)</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatPercent(calculationState.result.avgAnnualRate)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Time Span</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{calculationState.result.yearsSpan} years</p>
                    <p className="text-xs text-slate-500">{calculationState.result.monthsSpan} months total</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 border-t border-slate-200 pt-6">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-slate-600">From CPI Index:</span>
                    <span className="font-medium text-slate-900">{calculationState.result.fromCPIValue}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-slate-600">To CPI Index:</span>
                    <span className="font-medium text-slate-900">{calculationState.result.toCPIValue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && <InflationChart data={chartData} fromDate={calculationState.result.fromDate} toDate={calculationState.result.toDate} />}
          </section>
        )}

        {/* Error Result */}
        {calculationState.result && isInflationError(calculationState.result) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <p className="font-semibold text-red-900">{calculationState.result.message}</p>
          </div>
        )}

        {/* Data Coverage Info */}
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-8">
          <div className="flex gap-4">
            <Info className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Data Coverage</h3>
              <p className="text-sm text-blue-800">
                This calculator uses official CPI (Consumer Price Index) data from the Ministry of Statistics and Programme
                Implementation (MoSPI), Government of India. Data is available from {dataCoverage.from} to {dataCoverage.to}.
              </p>
              <p className="text-sm text-blue-700">
                The calculator uses the <strong>All-India Combined CPI</strong> (base year 2012 = 100) for all calculations. Results are
                rounded to the nearest rupee and percentage.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {[
              {
                q: "Why does the data start from 1958?",
                a: "The CPI series for India was first published by the Ministry of Statistics and Programme Implementation (MoSPI) starting from 1958. This represents the earliest official inflation data available for India."
              },
              {
                q: "How accurate are these calculations?",
                a: "The calculations are based on official CPI data published by MoSPI. Accuracy depends on the CPI data quality and the selected date range. Results are for indicative purposes; actual inflation impact may vary by region and consumption pattern."
              },
              {
                q: "What does CAGR mean?",
                a: "CAGR (Compound Annual Growth Rate) represents the average annual inflation rate over the selected period. This smooths out year-to-year volatility to show the long-term trend."
              },
              {
                q: "Can I download the data?",
                a: "Yes! Visit our Datasets page to download complete historical CPI and WPI data in CSV, JSON, or Excel formats for further analysis."
              }
            ].map((item, idx) => (
              <details key={idx} className="group rounded-lg border border-slate-200 p-4 transition">
                <summary className="cursor-pointer font-semibold text-slate-900 group-open:text-blue-600">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
