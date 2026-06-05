// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App.js";

const versionPayload = {
  app: {
    name: "Continuity Loom",
    version: "0.0.0"
  },
  templates: {
    version: "0.0.0",
    status: "placeholder"
  },
  compiler: {
    version: "0.0.0",
    status: "placeholder"
  }
};

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

describe("App", () => {
  it("renders app name and fetched runtime status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/health") {
          return Promise.resolve(jsonResponse({ status: "ok" }));
        }

        if (url === "/api/version") {
          return Promise.resolve(jsonResponse(versionPayload));
        }

        if (url === "/api/project") {
          return Promise.resolve(jsonResponse({ open: false }));
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      })
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Continuity Loom" })).toBeTruthy();
    expect(await screen.findByText("ok")).toBeTruthy();
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getAllByText("placeholder")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Local Project" })).toBeTruthy();
  });

  it("navigates the primary shell surfaces and keeps later-phase surfaces disabled", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/health") {
          return Promise.resolve(jsonResponse({ status: "ok" }));
        }

        if (url === "/api/version") {
          return Promise.resolve(jsonResponse(versionPayload));
        }

        if (url === "/api/project") {
          return Promise.resolve(jsonResponse({ open: false }));
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      })
    );

    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Records" }));
    expect(screen.getByRole("heading", { name: "Records" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Active Working Set" }));
    expect(screen.getByRole("heading", { name: "Active Working Set" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Story Configuration" }));
    expect(screen.getByRole("heading", { name: "Story Configuration" })).toBeTruthy();

    for (const name of ["Generation Brief", "Validation/Preview", "Generate/Candidate", "Accepted Segments"]) {
      expect(screen.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
    }
  });

  it("renders settings without exposing a key value", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/health") {
          return Promise.resolve(jsonResponse({ status: "ok" }));
        }

        if (url === "/api/version") {
          return Promise.resolve(jsonResponse(versionPayload));
        }

        if (url === "/api/project") {
          return Promise.resolve(jsonResponse({ open: false }));
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      })
    );

    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(screen.getByText("OpenRouter key")).toBeTruthy();
    expect(screen.getByText("Not configured")).toBeTruthy();
    expect(screen.queryByText(/sk-or-/i)).toBeNull();
  });

  it("renders a clear local-server error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    render(<App />);

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((alert) => alert.textContent === "Cannot reach local server.")).toBe(true);
  });
});
