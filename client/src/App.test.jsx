
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

describe("Sweety reading form", () => {
  let fetchMock;

  beforeEach(() => {
    localStorage.setItem("sweety_token", "test-token");
    localStorage.setItem(
      "sweety_user",
      JSON.stringify({
        name: "Test User",
        email: "test@example.com",
      })
    );

    fetchMock = vi.fn(async (url, options = {}) => {
      const pathname = new URL(url).pathname;
      const method = options.method || "GET";

      if (pathname.endsWith("/readings") && method === "POST") {
        return mockResponse({
          message: "Reading added successfully.",
        });
      }

      if (pathname.endsWith("/readings")) {
        return mockResponse({
          count: 0,
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          readings: [],
        });
      }

      if (pathname.endsWith("/reports")) {
        return mockResponse({
          count: 0,
          highest: null,
          lowest: null,
          average: null,
          readings: [],
        });
      }

      return mockResponse({ message: "Not found" }, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("displays the Add Reading form", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Add a reading" })
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Reading date")).toBeInTheDocument();

    expect(screen.getByLabelText("Reading slot")).toBeInTheDocument();

    expect(
      screen.getByLabelText("Blood glucose value (mg/dL)")
    ).toBeInTheDocument();

    await screen.findByText("No readings yet");
  });

  it("rejects a glucose value below 40", async () => {
    const user = userEvent.setup();

    render(<App />);

    const glucoseInput = screen.getByLabelText(
      "Blood glucose value (mg/dL)"
    );

    await user.type(glucoseInput, "30");

    expect(glucoseInput).toBeInvalid();

    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          new URL(url).pathname.endsWith("/readings") &&
          options?.method === "POST"
      )
    ).toBe(false);
  });

  it("submits a valid glucose reading successfully", async () => {
    const user = userEvent.setup();

    render(<App />);

    const glucoseInput = screen.getByLabelText(
      "Blood glucose value (mg/dL)"
    );

    await user.type(glucoseInput, "110");

    await user.click(
      screen.getByRole("button", { name: /Add reading/ })
    );

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent("Reading added successfully.");

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, options]) =>
          new URL(url).pathname.endsWith("/readings") &&
          options?.method === "POST"
      );

      expect(postCall).toBeDefined();

      const submittedData = JSON.parse(postCall[1].body);

      expect(submittedData.glucose_value).toBe(110);
      expect(submittedData.slot).toBe("Morning (fasting)");
    });
  });

  it("displays saved readings in the reading list", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      const pathname = new URL(url).pathname;

      if (pathname.endsWith("/readings")) {
        return mockResponse({
          count: 1,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          readings: [
            {
              id: "reading-1",
              reading_date: "2026-11-17",
              slot: "Evening",
              glucose_value: 125,
            },
          ],
        });
      }

      if (pathname.endsWith("/reports")) {
        return mockResponse({
          count: 1,
          highest: 125,
          lowest: 125,
          average: 125,
          readings: [],
        });
      }

      return mockResponse({ message: "Not found" }, 404);
    });

    render(<App />);

    expect(
      await screen.findByRole("cell", { name: /125/ })
    ).toBeInTheDocument();

    expect(screen.getByText("Evening")).toBeInTheDocument();
  });

  it("logs out and clears saved authentication details", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      await screen.findByRole("button", { name: "Log out" })
    );

    await waitFor(() => {
      expect(localStorage.getItem("sweety_token")).toBeNull();
      expect(localStorage.getItem("sweety_user")).toBeNull();
    });

    expect(
      screen.queryByRole("button", { name: "Log out" })
    ).not.toBeInTheDocument();
  });

  it("updates an existing glucose reading successfully", async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (url, options = {}) => {
      const pathname = new URL(url).pathname;
      const method = options.method || "GET";

      if (
        pathname.endsWith("/readings/reading-1") &&
        method === "PUT"
      ) {
        return mockResponse({
          message: "Reading updated successfully.",
        });
      }

      if (pathname.endsWith("/readings")) {
        return mockResponse({
          count: 1,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          readings: [
            {
              id: "reading-1",
              reading_date: "2026-11-17",
              slot: "After lunch",
              glucose_value: 125,
            },
          ],
        });
      }

      if (pathname.endsWith("/reports")) {
        return mockResponse({
          count: 1,
          highest: 125,
          lowest: 125,
          average: 125,
          readings: [],
        });
      }

      return mockResponse({ message: "Not found" }, 404);
    });

    render(<App />);

    await user.click(
      await screen.findByRole("button", { name: "Edit" })
    );

    const dialog = screen.getByRole("dialog");

    const glucoseInput = within(dialog).getByLabelText(
      "Blood glucose value (mg/dL)"
    );

    await user.clear(glucoseInput);
    await user.type(glucoseInput, "135");

    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    );

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent("Reading updated successfully.");

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([url, options]) =>
          new URL(url).pathname.endsWith("/readings/reading-1") &&
          options?.method === "PUT"
      );

      expect(putCall).toBeDefined();

      const updatedData = JSON.parse(putCall[1].body);

      expect(updatedData.glucose_value).toBe(135);
      expect(updatedData.slot).toBe("After lunch");
    });
  });
});
