import { useEffect, useState } from "react";

type LatestCPI = {
  headline: number;
  delta_month: number;
  release_date: string;
};

const LATEST_SOURCE = "/sample-data/latest_headline.json";

export default function LatestCPIWidget() {
  const [data, setData] = useState<LatestCPI | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(LATEST_SOURCE)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Unable to load latest CPI headline."));
  }, []);

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-semibold">Latest CPI</p>
        <p className="text-sm">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 text-slate-500">
        Loading latest CPI...
      </section>
    );
  }

  const deltaLabel = data.delta_month >= 0 ? "▲" : "▼";
  const deltaColor = data.delta_month >= 0 ? "text-emerald-600" : "text-red-600";

  return (
    <section className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-500">Headline CPI</p>
        <p className="text-3xl font-bold">{data.headline.toFixed(1)}%</p>
        <p className="text-xs text-slate-400">Release: {data.release_date}</p>
      </div>
      <div className={`text-right text-lg font-semibold ${deltaColor}`}>
        {deltaLabel} {Math.abs(data.delta_month).toFixed(1)} pts
      </div>
    </section>
  );
}
