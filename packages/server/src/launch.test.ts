import { createServer } from "node:net";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";

import { launch, parseLaunchArgs } from "./launch.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("launch", () => {
  it("parses explicit launch options", () => {
    expect(parseLaunchArgs(["--api-only", "--no-open", "--port", "5123"], "/tmp/web-dist")).toEqual({
      apiOnly: true,
      openBrowser: false,
      port: 5123,
      webDistDir: "/tmp/web-dist"
    });
  });

  it("prints the loopback URL when serving", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const app = await launch({
      apiOnly: true,
      openBrowser: false,
      port: 0,
      webDistDir: "/unused"
    });

    try {
      expect(app.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
      expect(log).toHaveBeenCalledWith(`Continuity Loom is running at ${app.url}`);
    } finally {
      await app.close();
    }
  });

  it("fails clearly when the requested port is occupied", async () => {
    const blocker = createServer();
    await new Promise<void>((resolve) => blocker.listen(0, "127.0.0.1", resolve));
    const address = blocker.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected TCP blocker address.");
    }

    try {
      await expect(
        launch({
          apiOnly: true,
          openBrowser: false,
          port: address.port,
          webDistDir: "/unused"
        })
      ).rejects.toThrow(`Port ${address.port} is already in use.`);
    } finally {
      await new Promise<void>((resolve, reject) => {
        blocker.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("serves built static assets with the API on one origin", async () => {
    const webDistDir = mkdtempSync(join(tmpdir(), "loom-web-dist-"));
    writeFileSync(join(webDistDir, "index.html"), "<!doctype html><title>Continuity Loom</title>");

    const app = await launch({
      apiOnly: false,
      openBrowser: false,
      port: 0,
      webDistDir
    });

    try {
      const html = await fetch(app.url).then((response) => response.text());
      const health: unknown = await fetch(`${app.url}/api/health`).then((response) =>
        response.json()
      );

      expect(html).toContain("Continuity Loom");
      expect(health).toEqual({ status: "ok" });
    } finally {
      await app.close();
    }
  });
});
