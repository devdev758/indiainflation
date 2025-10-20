import { Download, FileJson, FileText } from "lucide-react";
import { exportToCSV, exportToJSON } from "@/lib/dataUtils";
import type { DatasetRecord } from "@/lib/dataUtils";

interface ExportButtonsProps {
  data: DatasetRecord[];
  filename?: string;
  disabled?: boolean;
  variant?: "default" | "compact";
}

export function ExportButtons({
  data,
  filename = "inflation-data",
  disabled = false,
  variant = "default",
}: ExportButtonsProps) {
  const handleExportCSV = () => {
    exportToCSV(data, `${filename}.csv`);
  };

  const handleExportJSON = () => {
    exportToJSON(data, `${filename}.json`);
  };

  if (variant === "compact") {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          disabled={disabled || data.length === 0}
          title="Download as CSV"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4" />
          CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={disabled || data.length === 0}
          title="Download as JSON"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileJson className="h-4 w-4" />
          JSON
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Export Data</p>
      <p className="text-xs text-slate-600">Download {data.length} records in your preferred format</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <button
          onClick={handleExportCSV}
          disabled={disabled || data.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <FileText className="h-4 w-4" />
          Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={disabled || data.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </button>
      </div>
      <p className="text-xs text-slate-500">
        <Download className="inline h-3 w-3 mr-1" />
        Files are processed and downloaded client-side
      </p>
    </div>
  );
}
