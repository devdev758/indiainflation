import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatCPI, formatPercent, getCategoryLabel, getSectorLabel } from "@/lib/dataUtils";
import type { DatasetRecord } from "@/lib/dataUtils";

interface DatasetTableProps {
  data: DatasetRecord[];
  isLoading?: boolean;
  pageSize?: number;
  onViewTrend?: (date: string) => void;
}

type SortField = "date" | "indexValue" | "yoyPercent";
type SortOrder = "asc" | "desc";

export function DatasetTable({
  data,
  isLoading = false,
  pageSize = 25,
  onViewTrend,
}: DatasetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Sort and paginate data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === "date") {
        aVal = a.date;
        bVal = b.date;
      } else if (sortField === "indexValue") {
        aVal = a.indexValue;
        bVal = b.indexValue;
      } else if (sortField === "yoyPercent") {
        aVal = a.yoyPercent ?? 0;
        bVal = b.yoyPercent ?? 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto" />
          <p className="text-sm text-slate-600">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-600">No data available for the selected filters.</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white">
      {/* Sticky Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                <button
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center hover:text-blue-600"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-900">
                <button
                  onClick={() => toggleSort("indexValue")}
                  className="inline-flex items-center hover:text-blue-600 float-right"
                >
                  Index Value
                  <SortIcon field="indexValue" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-900">
                <button
                  onClick={() => toggleSort("yoyPercent")}
                  className="inline-flex items-center hover:text-blue-600 float-right"
                >
                  YoY Change
                  <SortIcon field="yoyPercent" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Sector</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedData.map((record, idx) => (
              <tr key={`${record.date}-${record.category}-${idx}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900 font-medium">{formatDate(record.date)}</td>
                <td className="px-4 py-3 text-slate-700">{getCategoryLabel(record.category)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatCPI(record.indexValue)}</td>
                <td className={`px-4 py-3 text-right font-medium ${
                  record.yoyPercent && record.yoyPercent > 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {formatPercent(record.yoyPercent)}
                </td>
                <td className="px-4 py-3 text-slate-700">{getSectorLabel(record.sector)}</td>
                <td className="px-4 py-3 text-center">
                  {onViewTrend && (
                    <button
                      onClick={() => onViewTrend(record.date)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Trend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(startIndex + pageSize, sortedData.length)}</span> of{" "}
            <span className="font-medium">{sortedData.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
              className="rounded border border-slate-200 p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous page"
              className="rounded border border-slate-200 p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    page = currentPage - 2 + i;
                  }
                  if (page > totalPages) page = totalPages - (4 - i);
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded px-2 py-1 text-sm font-medium ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next page"
              className="rounded border border-slate-200 p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
              className="rounded border border-slate-200 p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
