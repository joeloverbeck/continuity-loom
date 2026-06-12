import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apps: ReturnType<typeof createServer>[] = [];
const fakeApiKey = "sk-or-IDEATE-LEAK-CANARY-0000";

describe("ideate route secret leakage regression", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-ideate-secret-leakage-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    process.env.OPENROUTER_API_KEY = fakeApiKey;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("keeps configured keys out of ideate prompts, responses, and logs", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: {
        text: "IDEA 1\noperator: Reveal\nheadline: A pressure.\nwhy: It follows.\ngrounds: [ENTITY: A]"
      }
    });
    const capture = captureProcessWrites();
    const fastify = createServer({ logger: true });
    apps.push(fastify);

    try {
      await fastify.inject({ method: "POST", url: "/api/project/create", payload: { parentPath: tmpdir(), folderName: "ideate-secret", title: "Ideate" } });
      const response = await fastify.inject({ method: "POST", url: "/api/ideate" });

      expect(response.body).not.toContain(fakeApiKey);
      expect(sendChatCompletionMock.mock.calls[0]?.[0]?.prompt ?? "").not.toContain(fakeApiKey);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(fakeApiKey);
    }
  });
});

function captureProcessWrites(): { restore: () => string } {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let captured = "";

  function capture(chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean {
    captured += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (typeof done === "function") {
      done();
    }
    return true;
  }

  process.stdout.write = capture as typeof process.stdout.write;
  process.stderr.write = capture as typeof process.stderr.write;

  return {
    restore: () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      return captured;
    }
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
