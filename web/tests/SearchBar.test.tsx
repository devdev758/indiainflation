/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SearchBar from "@/components/SearchBar";
import { clearSearchCache } from "@/lib/search";

const pushMock = jest.fn();
let fetchMock: jest.Mock;

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: pushMock,
    pathname: "/",
  }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    pushMock.mockReset();
    clearSearchCache();
    fetchMock = jest.fn();
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("debounces input before fetching", async () => {
    fetchMock.mockResolvedValue(
      {
        ok: true,
        status: 200,
        json: async () => [{ id: "milk", name: "Milk", category: "general", last_index_value: 132.7 }],
      } as Response
    );

    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "milk");

    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/v1/search?q=milk&type=item");
  });

  it("allows keyboard navigation and selection", async () => {
    fetchMock.mockResolvedValue(
      {
        ok: true,
        status: 200,
        json: async () => [
          { id: "milk", name: "Milk", category: "general", last_index_value: 132.7 },
          { id: "rice", name: "Rice", category: "grains", last_index_value: 140.1 },
        ],
      } as Response
    );

    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "rice");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/items/rice");
  });

  it("shows empty state when no results", async () => {
    fetchMock.mockResolvedValue(
      {
        ok: true,
        status: 200,
        json: async () => [],
      } as Response
    );

    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "unknown");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(await screen.findByText("No results")).toBeInTheDocument();
  });
});
