import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  vi.restoreAllMocks();
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

        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      })
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Continuity Loom" })).toBeTruthy();
    expect(await screen.findByText("ok")).toBeTruthy();
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getAllByText("placeholder")).toHaveLength(2);
  });

  it("renders a clear local-server error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe("Cannot reach local server.");
  });
});
