import { describe, expect, it } from "vitest";

import { createServer, LOOPBACK_HOST, startServer } from "./server.js";
import { healthResponseSchema, versionInfoSchema } from "./version-schema.js";

describe("@loom/server stub API", () => {
  it("returns the health contract", async () => {
    const app = createServer();

    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: "ok" });
  });

  it("returns version metadata from core", async () => {
    const app = createServer();

    const response = await app.inject({ method: "GET", url: "/api/version" });
    const payload = versionInfoSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(payload.app.name).toBe("Continuity Loom");
    expect(payload.templates.status).toBe("stable");
    expect(payload.compiler.status).toBe("stable");
    expect(payload.contract.status).toBe("stable");
  });

  it("binds only to the loopback host", async () => {
    const server = await startServer(0);

    try {
      expect(server.address.address).toBe(LOOPBACK_HOST);
      expect(server.address.port).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });
});
