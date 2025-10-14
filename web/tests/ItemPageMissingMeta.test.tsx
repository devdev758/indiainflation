/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import ItemPage from "@/pages/items/[slug]";

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/ItemChart", () => ({ title }: { title: string }) => <div data-testid="item-chart">{title}</div>);

describe("ItemPage with missing metadata", () => {
  it("renders item name and fallback values when metadata is null", () => {
    const exportData = {
      slug: "milk",
      name: "Milk",
      metadata: null,
      series: [],
    } as const;

    render(<ItemPage exportData={exportData} />);

    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByTestId("item-chart")).toHaveTextContent("Milk CPI Index");
  });
});
