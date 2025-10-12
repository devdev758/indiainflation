import { render, screen, waitFor } from "@testing-library/react";
import LatestCPIWidget from "@/components/LatestCPIWidget";

describe("LatestCPIWidget", () => {
  beforeEach(() => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ headline: 5.4, delta_month: 0.3, release_date: "2024-08-12" })
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders fetched headline data", async () => {
    render(<LatestCPIWidget />);

    await waitFor(() => expect(screen.getByText(/Headline CPI/)).toBeInTheDocument());
    expect(screen.getByText(/5\.4%/)).toBeInTheDocument();
    expect(screen.getByText(/▲ 0\.3 pts/)).toBeInTheDocument();
  });
});
