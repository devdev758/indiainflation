import { render, screen, waitFor } from "@testing-library/react";

import ItemChart from "@/components/ItemChart";

jest.mock("chart.js/auto", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    destroy: jest.fn()
  }))
}));

describe("ItemChart", () => {
  it("renders a canvas and initialises the chart", async () => {
    render(
      <ItemChart
        title="Sample Item"
        series={[
          { date: "2024-01-01", value: 110 },
          { date: "2024-02-01", value: 112 }
        ]}
      />
    );

    expect(screen.getByRole("img", { name: "Sample Item" })).toBeInTheDocument();

    const chartModule = await import("chart.js/auto");
    await waitFor(() => {
      expect((chartModule.default as jest.Mock).mock.calls[0][1].data.labels).toEqual([
        "2024-01-01",
        "2024-02-01"
      ]);
    });
  });
});
