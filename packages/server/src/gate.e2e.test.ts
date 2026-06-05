import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { launch } from "./launch.js";
import { healthResponseSchema, versionInfoSchema } from "./version-schema.js";

describe("phase 1 gate", () => {
  it("declares the required root scripts", () => {
    const rootPackage = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8")) as {
      scripts?: Record<string, string>;
    };

    for (const scriptName of ["dev", "build", "typecheck", "lint", "test"]) {
      expect(typeof rootPackage.scripts?.[scriptName]).toBe("string");
    }
  });

  it("serves health and version APIs on the same origin as built assets", async () => {
    const webDistDir = mkdtempSync(join(tmpdir(), "loom-gate-web-dist-"));
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
      const version: unknown = await fetch(`${app.url}/api/version`).then((response) =>
        response.json()
      );

      expect(html).toContain("Continuity Loom");
      expect(healthResponseSchema.parse(health)).toEqual({ status: "ok" });
      expect(versionInfoSchema.parse(version).app.name).toBe("Continuity Loom");
    } finally {
      await app.close();
    }
  });
});
