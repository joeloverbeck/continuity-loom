import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-project-routes-"));
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("project routes", () => {
  it("drives create, open, status, backup, and close", async () => {
    const fastify = app();
    const parentPath = await tempParent();

    const createResponse = await fastify.inject({
      method: "POST",
      url: "/api/project/create",
      payload: {
        parentPath,
        folderName: "route-project",
        title: "Route Project",
        description: "API flow"
      }
    });
    const created = createResponse.json() as {
      folderPath: string;
      title: string;
      compatibility: string;
    };

    expect(createResponse.statusCode).toBe(201);
    expect(created.title).toBe("Route Project");
    expect(created.compatibility).toBe("ok");

    const closeResponse = await fastify.inject({ method: "POST", url: "/api/project/close" });
    expect(closeResponse.json()).toEqual({ open: false });

    const openResponse = await fastify.inject({
      method: "POST",
      url: "/api/project/open",
      payload: { folderPath: created.folderPath }
    });
    expect(openResponse.statusCode).toBe(200);
    expect(openResponse.json()).toEqual({ ok: true, status: created });

    const statusResponse = await fastify.inject({ method: "GET", url: "/api/project" });
    expect(statusResponse.json()).toEqual(created);

    const backupResponse = await fastify.inject({ method: "POST", url: "/api/project/backup" });
    const backup = backupResponse.json() as { backupPath: string };
    expect(backupResponse.statusCode).toBe(200);
    expect(backup.backupPath.startsWith(join(created.folderPath, "backups"))).toBe(true);

    const finalCloseResponse = await fastify.inject({ method: "POST", url: "/api/project/close" });
    expect(finalCloseResponse.json()).toEqual({ open: false });
  });

  it("passes through structured open failures", async () => {
    const fastify = app();
    const folderPath = await tempParent();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/project/open",
      payload: { folderPath }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "missing-metadata"
    });
  });

  it("rejects relative parent paths so projects never land in the app folder", async () => {
    const fastify = app();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/project/create",
      payload: { parentPath: "relative/projects", folderName: "alpha", title: "Alpha" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ ok: false, kind: "parent-not-absolute" });
  });

  it("returns an actionable diagnostic when the parent path is missing", async () => {
    const fastify = app();
    const parentPath = join(await tempParent(), "missing-parent");

    const response = await fastify.inject({
      method: "POST",
      url: "/api/project/create",
      payload: { parentPath, folderName: "alpha", title: "Alpha" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ ok: false, kind: "parent-missing" });
  });

  it("returns an actionable diagnostic when the folder already exists", async () => {
    const fastify = app();
    const parentPath = await tempParent();
    const payload = { parentPath, folderName: "alpha", title: "Alpha" };

    await fastify.inject({ method: "POST", url: "/api/project/create", payload });
    const response = await fastify.inject({ method: "POST", url: "/api/project/create", payload });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ ok: false, kind: "folder-exists" });
  });

  it("rejects malformed create requests", async () => {
    const fastify = app();
    const parentPath = await tempParent();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/project/create",
      payload: {
        parentPath,
        folderName: "missing-title"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "invalid-request"
    });
  });
});
