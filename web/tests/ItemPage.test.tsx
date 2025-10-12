import { render, screen } from "@testing-library/react";

import ItemPage from "@/pages/items/[slug]";
import type { ItemExportData } from "@/lib/exportLoader";

jest.mock("chart.js/auto", () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() }))
}));

describe("Item page", () => {
  const exportData: ItemExportData = {
    slug: "sample-item",
    name: "Sample Item",
    metadata: {
      first_date: "2023-01-01",
      last_date: "2024-03-01",
      count: 15,
      last_index_value: 128,
      average_index_value: 114
    },
    series: [
      { date: "2023-01-01", index_value: 100, yoy_pct: null, mom_pct: null },
      { date: "2023-02-01", index_value: 102, yoy_pct: null, mom_pct: 2 },
      { date: "2024-03-01", index_value: 128, yoy_pct: 12, mom_pct: 1.5 }
    ]
  };

  it("renders metadata and download links", () => {
    render(<ItemPage exportData={exportData} />);

    expect(screen.getByRole("heading", { name: /sample item/i })).toBeInTheDocument();
    expect(screen.getByText(/Download JSON/i)).toHaveAttribute(
      "href",
      "/api/exports/download/items/sample-item"
    );
    expect(screen.getByText(/Download CSV/i)).toHaveAttribute(
      "href",
      "/api/exports/download/csv/items/sample-item"
    );
  });
});
