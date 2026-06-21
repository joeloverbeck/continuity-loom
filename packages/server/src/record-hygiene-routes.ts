import { compileRecordHygienePrompt, type RecordHygieneRequest } from "@loom/core";
import type { FastifyInstance } from "fastify";

import { sendChatCompletion } from "./openrouter/client.js";
import type { ProjectStoreManager } from "./project-store.js";
import { parseRecordHygieneResponse } from "./record-hygiene-parse.js";
import { buildStoryRecordHygieneSnapshot } from "./record-hygiene-snapshot-builder.js";
import { readOpenRouterSettings, type OpenRouterSettingsStatus } from "./settings.js";

const defaultRequest: RecordHygieneRequest = { mode: "full_active_atomic_review" };
const allowedRequestKeys = new Set(["mode"]);

export function registerRecordHygieneRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/record-hygiene/compile", async (request, reply) => {
    const hygieneRequest = parseRecordHygieneRequest(request.body);
    if (!hygieneRequest.ok) {
      return reply.code(400).send(hygieneRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, hygieneRequest.value);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }

    return {
      ok: true,
      prompt: compileResult.prompt,
      metadata: compileMetadata(compileResult.metadata),
      citations: compileResult.metadata.citationMap ?? {}
    };
  });

  app.post("/api/record-hygiene/analyze", async (request, reply) => {
    const hygieneRequest = parseRecordHygieneRequest(request.body);
    if (!hygieneRequest.ok) {
      return reply.code(400).send(hygieneRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, hygieneRequest.value);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }

    const settings = readOpenRouterSettings();
    if (!settings.hasOpenRouterCredential) {
      return {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      };
    }

    if (isPromptTooLarge(compileResult.metadata.tokenEstimate, settings)) {
      return {
        ok: false,
        category: "prompt-too-large",
        message: "Compiled record hygiene prompt exceeds the selected model context window."
      };
    }

    const transportResult = await sendChatCompletion({
      prompt: compileResult.prompt,
      settings
    });

    if (!transportResult.ok) {
      return transportResult;
    }

    const validCitationKeys = new Set(Object.keys(compileResult.metadata.citationMap ?? {}));
    const parsed = parseRecordHygieneResponse(transportResult.candidate.text, validCitationKeys);
    const metadata = analyzeMetadata(settings, compileResult.metadata);

    if (!parsed.ok) {
      return {
        ok: true,
        malformed: true,
        raw: parsed.raw,
        metadata
      };
    }

    return {
      ok: true,
      findings: parsed.findings,
      metadata
    };
  });
}

type CompileFromProjectResult =
  | {
      ok: true;
      prompt: string;
      metadata: ReturnType<typeof compileRecordHygienePrompt>["metadata"];
    }
  | { ok: false; status: number; body: unknown };

function compileFromOpenProject(manager: ProjectStoreManager, request: RecordHygieneRequest): CompileFromProjectResult {
  const repository = manager.getRecordRepository();
  if (!repository) {
    return {
      ok: false,
      status: 409,
      body: { ok: false, kind: "no-open-project", message: "No project is open." }
    };
  }

  const snapshotResult = buildStoryRecordHygieneSnapshot(repository);
  if (!snapshotResult.ok) {
    return snapshotResult;
  }

  const compileResult = compileRecordHygienePrompt(snapshotResult.snapshot, request);
  return { ok: true, prompt: compileResult.prompt, metadata: compileResult.metadata };
}

function parseRecordHygieneRequest(body: unknown):
  | { ok: true; value: RecordHygieneRequest }
  | { ok: false; body: { ok: false; kind: "invalid-record-hygiene-request"; issues: string[] } } {
  if (body === undefined || body === null) {
    return { ok: true, value: defaultRequest };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest(["Body must be an object."]);
  }

  const keys = Object.keys(body);
  const extraKeys = keys.filter((key) => !allowedRequestKeys.has(key));
  if (extraKeys.length > 0) {
    return invalidRequest(extraKeys.map((key) => `Unsupported field: ${key}`));
  }

  const mode = (body as { mode?: unknown }).mode;
  if (mode !== undefined && mode !== defaultRequest.mode) {
    return invalidRequest(["mode must be full_active_atomic_review."]);
  }

  return { ok: true, value: defaultRequest };
}

function invalidRequest(issues: string[]): { ok: false; body: { ok: false; kind: "invalid-record-hygiene-request"; issues: string[] } } {
  return {
    ok: false,
    body: { ok: false, kind: "invalid-record-hygiene-request", issues }
  };
}

function compileMetadata(metadata: ReturnType<typeof compileRecordHygienePrompt>["metadata"]) {
  return {
    versions: metadata.versions,
    fingerprint: metadata.fingerprint,
    lengthEstimate: metadata.lengthEstimate,
    tokenEstimate: metadata.tokenEstimate,
    recordCount: Object.values(metadata.countsByType ?? {}).reduce((sum, count) => sum + count, 0),
    countsByType: metadata.countsByType
  };
}

function analyzeMetadata(
  settings: OpenRouterSettingsStatus,
  metadata: ReturnType<typeof compileRecordHygienePrompt>["metadata"]
) {
  return {
    model: settings.model,
    provider: "openrouter",
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    ...(settings.topP !== undefined ? { topP: settings.topP } : {}),
    ...compileMetadata(metadata)
  };
}

function isPromptTooLarge(promptTokenEstimate: number, settings: OpenRouterSettingsStatus): boolean {
  const contextLength = settings.cachedModels?.find((model) => model.id === settings.model)?.contextLength;
  return contextLength !== undefined && promptTokenEstimate + settings.maxOutputTokens > contextLength;
}
