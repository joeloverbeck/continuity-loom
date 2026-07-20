import { mkdtemp } from "node:fs/promises";
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
const createdProjectParents: string[] = [];
const keySecretText = "sk-or-record-hygiene-route-secret";
const promptSecretText = "HYGIENE_PROMPT_SECRET_DO_NOT_LOG";
const modelOutputSecretText = "HYGIENE_MODEL_OUTPUT_SECRET_DO_NOT_LOG";

describe("record hygiene routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-record-hygiene-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
    for (const parent of createdProjectParents.splice(0)) {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it("returns a structured no-open-project error from the registered compile route", async () => {
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
  });

  it("compiles the full active hygiene prompt without credentials", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "full_active_atomic_review" }
    });
    const body = response.json() as {
      prompt: string;
      metadata: { recordCount: number; countsByType: Record<string, number> };
      citations: Record<string, string>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("# Story-Record Hygiene Prompt");
    expect(body.prompt).toContain(promptSecretText);
    expect(body.metadata.recordCount).toBe(2);
    expect(body.metadata.countsByType.FACT).toBe(2);
    expect(body.citations).toEqual({ "[FACT-1]": expect.any(String), "[FACT-2]": expect.any(String) });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("accepts working-set mode, scopes by selected records, and does not mutate the working set", async () => {
    const fastify = app();
    const { alphaId } = await prepareHygieneProject(fastify);
    await putWorkingSet(fastify, [alphaId]);
    const before = await getWorkingSet(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "active_working_set_atomic_review" }
    });
    const after = await getWorkingSet(fastify);
    const body = response.json() as {
      prompt: string;
      metadata: { recordCount: number; countsByType: Record<string, number> };
      citations: Record<string, string>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("request_mode: active_working_set_atomic_review");
    expect(body.prompt).toContain("hygiene_scope: active_working_set");
    expect(body.prompt).toContain(`display_label: ${promptSecretText} The cellar door is locked.`);
    expect(body.prompt).not.toContain("display_label: The cellar door remains locked after Niko tests it.");
    expect(body.metadata.recordCount).toBe(1);
    expect(body.metadata.countsByType.FACT).toBe(1);
    expect(body.citations).toEqual({ "[FACT-1]": alphaId });
    expect(after).toEqual(before);
  });

  it("shows complete payload-derived labels in both compile scopes without exposing the stored browse label", async () => {
    const fastify = app();
    await openProject(fastify);
    const sharedPrefix = "W".repeat(80);
    const browseLabel = `${sharedPrefix.slice(0, 77)}...`;
    const fullLabel = `${sharedPrefix}Complete Ω ñ < & > label`;
    const recordId = await createFact(fastify, browseLabel, fullLabel);
    await putWorkingSet(fastify, [recordId]);

    for (const mode of ["full_active_atomic_review", "active_working_set_atomic_review"] as const) {
      const response = await fastify.inject({
        method: "POST",
        url: "/api/record-hygiene/compile",
        payload: { mode }
      });
      const body = response.json() as { prompt: string };

      expect(response.statusCode).toBe(200);
      expect(body.prompt).toContain(`display_label: ${escapeDataText(fullLabel)}`);
      expect(body.prompt).not.toContain(`display_label: ${browseLabel}`);
      expect(body.prompt).not.toContain("full_display_label:");
    }
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported record hygiene modes", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "unknown" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "invalid-record-hygiene-request",
      issues: ["mode must be full_active_atomic_review or active_working_set_atomic_review."]
    });
  });

  it("rejects client-supplied prompt, subset, edit, and write fields before transport", async () => {
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/analyze",
      payload: {
        mode: "full_active_atomic_review",
        prompt: "hostile replacement",
        subset: ["one-record"],
        edit: { action: "remove" },
        write: true
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-record-hygiene-request" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("blocks analyze only when the OpenRouter key is missing", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const compileResponse = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });
    const analyzeResponse = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });

    expect(compileResponse.statusCode).toBe(200);
    expect(analyzeResponse.json()).toEqual({
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("sends the server-compiled prompt, returns parsed findings, and does not mutate project data", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: validHygieneResponse() } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const before = await listRecords(fastify);
    const compileResponse = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });
    const analyzeResponse = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });
    const after = await listRecords(fastify);
    const compileBody = compileResponse.json() as { prompt: string };
    const analyzeBody = analyzeResponse.json() as { findings: unknown[]; metadata: Record<string, unknown> };

    expect(analyzeResponse.statusCode).toBe(200);
    expect(analyzeBody.findings).toHaveLength(1);
    expect(analyzeBody.metadata).toMatchObject({ provider: "openrouter", model: "" });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]?.prompt).toBe(compileBody.prompt);
    expect(after).toEqual(before);
  });

  it("preserves the normalized transport detail across the record hygiene route", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 11
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });

    expect(response.json()).toEqual({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 11
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("quarantines malformed model output as raw scratch", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "freeform hygiene answer" } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });

    expect(response.json()).toMatchObject({ ok: true, malformed: true, raw: "freeform hygiene answer" });
  });

  it("returns prompt-too-large before transport when the selected model context is too small", async () => {
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await putSettings(fastify, {
      model: "tiny/context",
      temperature: 1,
      maxOutputTokens: 1024,
      cachedModels: [{ id: "tiny/context", name: "Tiny Context", contextLength: 16 }]
    });
    await prepareHygieneProject(fastify);

    const before = await listRecords(fastify);
    const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });
    const after = await listRecords(fastify);

    expect(response.json()).toEqual({
      ok: false,
      kind: "prompt-too-large",
      message: "Compiled record hygiene prompt exceeds the selected model context window."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
    expect(after).toEqual(before);
  });

  it("keeps prompts, payloads, model output, parsed findings, citations, and keys out of logs", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: validHygieneResponse(modelOutputSecretText) } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await prepareHygieneProject(fastify);
      const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/analyze" });

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toContain(keySecretText);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(keySecretText);
      expect(output).not.toContain(promptSecretText);
      expect(output).not.toContain(modelOutputSecretText);
      expect(output).not.toContain("[FACT-1]");
      expect(output).not.toContain("[FACT-2]");
    }
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function prepareHygieneProject(fastify: ReturnType<typeof createServer>): Promise<{ alphaId: string; betaId: string }> {
  await openProject(fastify);
  const alphaId = await createFact(fastify, "Alpha fact", `${promptSecretText} The cellar door is locked.`);
  const betaId = await createFact(fastify, "Beta fact", "The cellar door remains locked after Niko tests it.");

  return { alphaId, betaId };
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-record-hygiene-project-"));
  createdProjectParents.push(parentPath);
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath,
      folderName: "hygiene",
      title: "Record Hygiene"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function createFact(fastify: ReturnType<typeof createServer>, displayLabel: string, statement: string): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "FACT",
      displayLabel,
      payload: {
        fact_kind: "current_state",
        statement,
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "high"
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

async function putSettings(fastify: ReturnType<typeof createServer>, payload: Record<string, unknown>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload
  });

  expect(response.statusCode).toBe(200);
}

async function putWorkingSet(fastify: ReturnType<typeof createServer>, selectedRecordIds: string[]): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/working-set",
    payload: { selectedRecordIds }
  });

  expect(response.statusCode).toBe(200);
}

async function getWorkingSet(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/working-set" });

  expect(response.statusCode).toBe(200);
  return response.json();
}

async function listRecords(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/records" });

  expect(response.statusCode).toBe(200);
  return response.json();
}

function validHygieneResponse(detail = "They appear to restate the same locked-door state."): string {
  return [
    "HYGIENE REVIEW",
    "findings_reported: 1",
    "FINDING 1",
    "cluster: locked cellar door",
    "relation: NEAR_DUPLICATE",
    "action: REWORD",
    "citations: [FACT-1], [FACT-2]",
    "shared_core: The cellar door is locked.",
    "material_differences: One states the lock; the other repeats it after testing.",
    "why_it_matters: Duplicated state records make prompt context noisy.",
    `manual_recommendation: ${detail}`,
    "survivor: none",
    "reference_caution: Check references before editing either record.",
    "confidence: high",
    "END HYGIENE REVIEW"
  ].join("\n");
}

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

function escapeDataText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
