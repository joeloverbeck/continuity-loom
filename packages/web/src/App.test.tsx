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
    status: "stable"
  },
  compiler: {
    version: "0.0.0",
    status: "stable"
  },
  contract: {
    version: "1.0.0",
    status: "stable"
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

function runtimeFetch(url: string): Promise<Response> {
  if (url === "/api/health") {
    return Promise.resolve(jsonResponse({ status: "ok" }));
  }

  if (url === "/api/version") {
    return Promise.resolve(jsonResponse(versionPayload));
  }

  if (url === "/api/project") {
    return Promise.resolve(jsonResponse({ open: false }));
  }

  if (url === "/api/records" || url === "/api/records?type=ENTITY" || url === "/api/records?includeArchived=true") {
    return Promise.resolve(jsonResponse({ ok: true, records: [] }));
  }

  if (url === "/api/working-set") {
    return Promise.resolve(jsonResponse({ ok: true, selectedRecordIds: [] }));
  }

  if (url === "/api/generation-brief") {
    return Promise.resolve(jsonResponse({ ok: true, session: {} }));
  }

  if (url.startsWith("/api/story-config/")) {
    return Promise.resolve(jsonResponse({ ok: false, kind: "not-found", message: "Missing config." }));
  }

  return Promise.reject(new Error(`Unexpected URL: ${url}`));
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
      vi.fn(runtimeFetch)
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Continuity Loom" })).toBeTruthy();
    expect(await screen.findByText("ok")).toBeTruthy();
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getAllByText("stable")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Local Project" })).toBeTruthy();
  });

  it("navigates the primary shell surfaces and keeps later-phase surfaces disabled", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(runtimeFetch)
    );

    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Records" }));
    expect(screen.getByRole("heading", { name: "Records" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Active Working Set" }));
    expect(screen.getByRole("heading", { name: "Active Working Set" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Generation Brief" }));
    expect(screen.getByRole("heading", { name: "Generation Brief" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Story Configuration" }));
    expect(screen.getByRole("heading", { name: "Story Configuration" })).toBeTruthy();

    for (const name of ["Validation/Preview", "Generate/Candidate", "Accepted Segments"]) {
      expect(screen.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
    }
  });

  it("renders settings without exposing a key value", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(runtimeFetch)
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
