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

const projectStatus = {
  folderPath: "/tmp/loom/alpha",
  title: "Alpha",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  databaseFilename: "loom.sqlite",
  appSchemaVersion: 1,
  storeUserVersion: 1,
  compatibility: "ok"
};

let projectResponse: unknown = { open: false };

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
    return Promise.resolve(jsonResponse(projectResponse));
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

  if (url === "/api/compile") {
    return Promise.resolve(jsonResponse({ ok: false, kind: "no-open-project", message: "No open project." }));
  }

  if (url === "/api/settings/openrouter") {
    return Promise.resolve(
      jsonResponse({
        model: "",
        temperature: 1,
        maxOutputTokens: 1024,
        hasOpenRouterCredential: false
      })
    );
  }

  if (url === "/api/accepted-segments") {
    return Promise.resolve(jsonResponse({ ok: true, segments: [] }));
  }

  if (url === "/api/durable-change-reminder") {
    return Promise.resolve(
      jsonResponse({
        ok: true,
        reminder: {
          active: false,
          latestSegment: null,
          acknowledgedThroughSequence: 0
        }
      })
    );
  }

  if (url === "/api/story-config") {
    return Promise.resolve(jsonResponse({ ok: true, configs: {} }));
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
  projectResponse = { open: false };
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

  it("navigates the primary shell surfaces", async () => {
    projectResponse = projectStatus;
    vi.stubGlobal(
      "fetch",
      vi.fn(runtimeFetch)
    );

    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Records" }));
    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Active Working Set" }));
    expect(await screen.findByRole("heading", { name: "Active Working Set" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Generation Brief" }));
    expect(await screen.findByRole("heading", { name: "Generation Brief" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Validation / Prompt Preview" }));
    expect(await screen.findByRole("heading", { name: "Validation / Prompt Preview" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Generate / Candidate" }));
    expect(await screen.findByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Accepted Segments" }));
    expect(await screen.findByRole("heading", { name: "Accepted Segments" })).toBeTruthy();
    expect(await screen.findByText("No accepted segments yet.")).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Story Configuration" }));
    expect(await screen.findByRole("heading", { name: "Story Configuration" })).toBeTruthy();

    expect(screen.queryByRole("button", { name: "Validation/Preview" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Generate/Candidate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Accepted Segments" })).toBeNull();
  });

  it("renders settings without exposing a key value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(runtimeFetch)
    );

    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(await screen.findByText("OpenRouter key")).toBeTruthy();
    expect(screen.getByText("API key missing")).toBeTruthy();
    expect(screen.queryByText(/sk-or-/i)).toBeNull();
  });

  it("renders a clear local-server error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    render(<App />);

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((alert) => alert.textContent === "Cannot reach local server.")).toBe(true);
  });
});
