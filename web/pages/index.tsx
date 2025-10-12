import Head from "next/head";
import InflationConverter from "@/components/InflationConverter";
import LatestCPIWidget from "@/components/LatestCPIWidget";

export default function Home() {
  return (
    <>
      <Head>
        <title>Indiainflation</title>
        <meta name="description" content="India inflation insights and calculators" />
      </Head>
      <main className="min-h-screen bg-slate-50">
        <section className="max-w-4xl mx-auto py-12 px-4 space-y-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Indiainflation Dashboard</h1>
            <p className="text-slate-600">
              Convert historical prices, explore item inflation series, and stay up to date with the
              latest CPI print.
            </p>
          </header>
          <LatestCPIWidget />
          <InflationConverter />
        </section>
      </main>
    </>
  );
}
