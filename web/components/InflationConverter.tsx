import { FormEvent, useEffect, useMemo, useState } from "react";

type CPIEntry = {
  year: number;
  index: number;
};

export function adjustAmount(amount: number, baseIndex: number, targetIndex: number): number {
  if (baseIndex <= 0) {
    throw new Error("Base index must be positive");
  }
  return (amount * targetIndex) / baseIndex;
}

const CPI_SOURCE = "/sample-data/cpi_yearly.json";

export default function InflationConverter() {
  const [entries, setEntries] = useState<CPIEntry[]>([]);
  const [amount, setAmount] = useState("1000");
  const [baseYear, setBaseYear] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(CPI_SOURCE)
      .then((res) => res.json())
      .then((data: CPIEntry[]) => {
        setEntries(data);
        if (data.length >= 2) {
          setBaseYear(data[0].year);
          setTargetYear(data[data.length - 1].year);
        }
      })
      .catch(() => setError("Failed to load CPI reference data."));
  }, []);

  const yearOptions = useMemo(() => entries.map((entry) => entry.year), [entries]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!baseYear || !targetYear) {
      setError("Select both base and target years.");
      return;
    }

    const baseEntry = entries.find((entry) => entry.year === baseYear);
    const targetEntry = entries.find((entry) => entry.year === targetYear);

    if (!baseEntry || !targetEntry) {
      setError("Missing CPI index for selected years.");
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      const adjusted = adjustAmount(numericAmount, baseEntry.index, targetEntry.index);
      setResult(Number.isFinite(adjusted) ? adjusted : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to convert amount.");
    }
  };

  return (
    <section className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Inflation Converter</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Amount (₹)</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Base Year</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={baseYear ?? ""}
              onChange={(event) => setBaseYear(Number(event.target.value))}
            >
              <option value="" disabled>
                Select year
              </option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Target Year</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={targetYear ?? ""}
              onChange={(event) => setTargetYear(Number(event.target.value))}
            >
              <option value="" disabled>
                Select year
              </option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          Convert
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {result !== null && !error && (
        <div className="mt-6 rounded bg-blue-50 p-4 text-blue-900">
          <p className="text-sm font-medium">Inflation-adjusted amount</p>
          <p className="text-2xl font-bold">₹{result.toFixed(2)}</p>
        </div>
      )}
    </section>
  );
}
