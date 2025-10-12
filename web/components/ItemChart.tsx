import { useEffect, useRef } from "react";

type ItemChartProps = {
  title: string;
  series: Array<{
    date: string;
    value: number;
  }>;
};

const ItemChart = ({ title, series }: ItemChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let chart: { destroy: () => void } | null = null;
    let cancelled = false;

    async function buildChart() {
      const ChartModule = await import("chart.js/auto");
      if (!canvasRef.current || cancelled) {
        return;
      }

      chart = new ChartModule.default(canvasRef.current, {
        type: "line",
        data: {
          labels: series.map((point) => point.date),
          datasets: [
            {
              label: title,
              data: series.map((point) => point.value),
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.12)",
              tension: 0.25,
              fill: true,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            intersect: false,
            mode: "index"
          },
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                autoSkipPadding: 8
              }
            },
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }

    if (series.length > 0) {
      buildChart().catch(() => {
        // swallow runtime chart errors in non-browser environments
      });
    }

    return () => {
      cancelled = true;
      chart?.destroy();
    };
  }, [series, title]);

  if (series.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        No series data available.
      </div>
    );
  }

  return <canvas ref={canvasRef} aria-label={title} role="img" className="w-full" />;
};

export default ItemChart;
