
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

    expect(
      screen.getByLabelText("Reading date")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Reading slot")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Blood glucose value (mg/dL)")
    ).toBeInTheDocument();

    // Wait for the initial dashboard API requests to finish.
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
      screen.getByRole("button", { name: "Add reading" })
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
});
