import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import InflationConverter, { adjustAmount } from "@/components/InflationConverter";

describe("adjustAmount", () => {
  it("scales amount according to CPI indices", () => {
    expect(adjustAmount(100, 100, 125)).toBe(125);
  });

  it("throws when base index is zero", () => {
    expect(() => adjustAmount(100, 0, 125)).toThrow("Base index must be positive");
  });
});

describe("InflationConverter component", () => {
  beforeEach(() => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { year: 2020, index: 120 },
          { year: 2021, index: 130 }
        ])
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("converts amount using fetched CPI data", async () => {
    render(<InflationConverter />);

    await waitFor(() => expect(screen.getByLabelText(/Amount/)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText("Base Year"), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText("Target Year"), { target: { value: "2021" } });

    fireEvent.click(screen.getByRole("button", { name: /convert/i }));

    await waitFor(() => expect(screen.getByText(/₹216\.67/)).toBeInTheDocument());
  });
});
