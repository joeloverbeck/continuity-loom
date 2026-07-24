import {
  CAST_POSSIBILITIES_SOURCE_PROFILE,
  castPossibilitiesOutputJsonSchema,
  compileCastPossibilitiesPrompt,
  fingerprintPrompt,
  parseCastPossibilitiesOutput,
  type CastPossibilitiesCompileSuccess
} from "@loom/core";
import type { FastifyInstance } from "fastify";

import { admitStructuredOutputModel } from "./openrouter/capability.js";
import { sendChatCompletion } from "./openrouter/client.js";
import type { OpenRouterRequestOptions } from "./openrouter/request.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings, type OpenRouterSettingsStatus } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

const compileKeys = new Set(["targetCharacterId", "avoidList", "baseSourceFingerprint"]);
const analyzeKeys = new Set([
  "expectedPromptFingerprint",
  "targetCharacterId",
  "avoidList",
  "baseSourceFingerprint"
]);

type CastPossibilitiesRequest = {
  expectedPromptFingerprint?: string;
  targetCharacterId?: string;
  avoidList?: readonly string[];
  baseSourceFingerprint?: string;
};

export function registerCastPossibilitiesRoutes(
  app: FastifyInstance,
  manager: ProjectStoreManager
): void {
  app.post("/api/cast-possibilities/compile", async (request, reply) => {
    const parsed = parseRequest(request.body, false);
    if (!parsed.ok) {
      return reply.code(400).send(parsed.body);
    }
    const compiled = compileFromOpenProject(manager, parsed.request);
    if (!compiled.ok) {
      return reply.code(compiled.status).send(compiled.body);
    }
    return {
      ok: true,
      projectIdentity: compiled.projectIdentity,
      prompt: compiled.result.prompt,
      disclosure: compiled.result.disclosure,
      citations: compiled.result.disclosure.citationMap,
      outputSchema: compiled.result.outputSchema,
      versions: compiled.result.disclosure.versions,
      fingerprint: compiled.result.disclosure.fingerprint
    };
  });

  app.post("/api/cast-possibilities/analyze", async (request, reply) => {
    const parsed = parseRequest(request.body, true);
    if (!parsed.ok) {
      return reply.code(400).send(parsed.body);
    }
    const compiled = compileFromOpenProject(manager, parsed.request);
    if (!compiled.ok) {
      return reply.code(compiled.status).send(compiled.body);
    }
    if (compiled.result.disclosure.fingerprint !== parsed.request.expectedPromptFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "cast-possibilities-source-changed",
        message: "The saved Cast Possibilities source changed. Compile and inspect it again before sending.",
        currentPromptFingerprint: compiled.result.disclosure.fingerprint
      });
    }

    const settings = readOpenRouterSettings();
    if (!settings.hasOpenRouterCredential) {
      return { ok: false, category: "missing-key", message: "OpenRouter API key is missing." };
    }
    if (isPromptTooLarge(compiled.result.disclosure.tokenEstimate, settings)) {
      return {
        ok: false,
        kind: "cast-possibilities-prompt-too-large",
        message: "The complete Cast Possibilities source exceeds the selected model context window. Choose a compatible model."
      };
    }

    const requestOptions: OpenRouterRequestOptions = {
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cast_possibilities",
          strict: true,
          schema: castPossibilitiesOutputJsonSchema()
        }
      },
      provider: { require_parameters: true, allow_fallbacks: false },
      transforms: [],
      plugins: [],
      tools: [],
      tool_choice: "none"
    };
    const admission = admitStructuredOutputModel({ settings, requestOptions });
    if (!admission.ok) {
      return admission;
    }

    const transport = await sendChatCompletion({
      prompt: compiled.result.prompt,
      settings,
      requestOptions
    });
    if (!transport.ok) {
      return transport;
    }

    const parsedOutput = parseCastPossibilitiesOutput(
      transport.candidate.text,
      compiled.result.parseContext
    );
    if (parsedOutput.status === "quarantined") {
      return {
        ok: true,
        quarantined: true,
        reasonCode: parsedOutput.reasonCode,
        summary: parsedOutput.summary,
        recovery: parsedOutput.recovery
      };
    }

    const metadata = trustedMetadata(compiled, settings, parsed.request.targetCharacterId);
    const characters = parsedOutput.output.characters;
    return {
      ok: true,
      ...(parsed.request.targetCharacterId
        ? { replacement: characters[0] }
        : { possibilities: parsedOutput.output }),
      advisory: { verified: false, canonical: false, prose: false },
      metadata
    };
  });
}

type CompiledCastPossibilities = {
  ok: true;
  result: CastPossibilitiesCompileSuccess;
  projectIdentity: string;
};

function compileFromOpenProject(
  manager: ProjectStoreManager,
  request: CastPossibilitiesRequest
): CompiledCastPossibilities | { ok: false; status: number; body: unknown } {
  const repository = manager.getRecordRepository();
  const status = manager.getActiveProjectStatus();
  if (!repository || "open" in status) {
    return {
      ok: false,
      status: 409,
      body: { ok: false, kind: "no-open-project", message: "No project is open." }
    };
  }
  const draft = repository.getGenerationSession();
  if (!draft.ok) {
    return {
      ok: false,
      status: draft.kind === "not-found" ? 409 : 422,
      body: {
        ok: false,
        kind: draft.kind === "not-found" ? "cast-possibilities-no-saved-draft" : "malformed-cast-possibilities-source",
        message: draft.kind === "not-found"
          ? "Save the Generation Brief before using Cast Possibilities."
          : "The saved Generation Brief could not be read."
      }
    };
  }
  const snapshot = buildSnapshotFromOpenProject(manager);
  if (!snapshot.ok) {
    return snapshot;
  }
  const savedDraftIdentity = `generation-brief:${fingerprintPrompt(JSON.stringify(draft.payload))}`;
  if (request.targetCharacterId) {
    const fullSource = compileCastPossibilitiesPrompt(snapshot.snapshot, { savedDraftIdentity });
    if (!fullSource.ok) {
      return {
        ok: false,
        status: 422,
        body: { ...fullSource, projectIdentity: status.projectUuid }
      };
    }
    if (fullSource.disclosure.fingerprint !== request.baseSourceFingerprint) {
      return {
        ok: false,
        status: 409,
        body: {
          ok: false,
          kind: "cast-possibilities-source-changed",
          message: "The full-cast Cast Possibilities source changed. Compile and inspect it again before regenerating.",
          currentPromptFingerprint: fullSource.disclosure.fingerprint
        }
      };
    }
  }
  const result = compileCastPossibilitiesPrompt(snapshot.snapshot, {
    savedDraftIdentity,
    ...(request.targetCharacterId ? { targetCharacterId: request.targetCharacterId } : {}),
    ...(request.avoidList ? { avoidList: request.avoidList } : {})
  });
  if (!result.ok) {
    return {
      ok: false,
      status: 422,
      body: { ...result, projectIdentity: status.projectUuid }
    };
  }
  return {
    ok: true,
    result,
    projectIdentity: status.projectUuid
  };
}

function parseRequest(
  body: unknown,
  requireFingerprint: boolean
):
  | { ok: true; request: CastPossibilitiesRequest }
  | { ok: false; body: { ok: false; kind: "invalid-cast-possibilities-request"; issues: string[] } } {
  const record = body === undefined || body === null ? {} : body;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return invalidRequest(["Body must be an object."]);
  }
  const value = record as Record<string, unknown>;
  const allowed = requireFingerprint ? analyzeKeys : compileKeys;
  const issues = Object.keys(value)
    .filter((key) => !allowed.has(key))
    .map((key) => `Unsupported field: ${key}`);
  if (
    requireFingerprint &&
    (typeof value.expectedPromptFingerprint !== "string" || !value.expectedPromptFingerprint.trim())
  ) {
    issues.push("expectedPromptFingerprint is required.");
  }
  if (
    value.targetCharacterId !== undefined &&
    (typeof value.targetCharacterId !== "string" || !value.targetCharacterId.trim())
  ) {
    issues.push("targetCharacterId must be a nonblank string.");
  }
  if (
    value.baseSourceFingerprint !== undefined &&
    (typeof value.baseSourceFingerprint !== "string" || !value.baseSourceFingerprint.trim())
  ) {
    issues.push("baseSourceFingerprint must be a nonblank string.");
  }
  if (value.avoidList !== undefined) {
    if (
      !Array.isArray(value.avoidList) ||
      value.avoidList.length !== 3 ||
      value.avoidList.some((item) => typeof item !== "string" || !item.trim())
    ) {
      issues.push("avoidList must contain exactly three nonblank card summaries.");
    }
    if (value.targetCharacterId === undefined) {
      issues.push("avoidList requires targetCharacterId.");
    }
  }
  if (value.targetCharacterId !== undefined && !Array.isArray(value.avoidList)) {
    issues.push("targetCharacterId requires an avoidList of exactly three card summaries.");
  }
  if (
    value.targetCharacterId !== undefined &&
    (typeof value.baseSourceFingerprint !== "string" || !value.baseSourceFingerprint.trim())
  ) {
    issues.push("targetCharacterId requires the inspected full-slate baseSourceFingerprint.");
  }
  if (value.targetCharacterId === undefined && value.baseSourceFingerprint !== undefined) {
    issues.push("baseSourceFingerprint requires targetCharacterId.");
  }
  if (issues.length > 0) {
    return invalidRequest(issues);
  }
  return {
    ok: true,
    request: {
      ...(typeof value.expectedPromptFingerprint === "string"
        ? { expectedPromptFingerprint: value.expectedPromptFingerprint }
        : {}),
      ...(typeof value.targetCharacterId === "string" ? { targetCharacterId: value.targetCharacterId } : {}),
      ...(Array.isArray(value.avoidList) ? { avoidList: value.avoidList as string[] } : {}),
      ...(typeof value.baseSourceFingerprint === "string"
        ? { baseSourceFingerprint: value.baseSourceFingerprint }
        : {})
    }
  };
}

function invalidRequest(issues: string[]) {
  return {
    ok: false as const,
    body: { ok: false as const, kind: "invalid-cast-possibilities-request" as const, issues }
  };
}

function trustedMetadata(
  compiled: CompiledCastPossibilities,
  settings: OpenRouterSettingsStatus,
  targetCharacterId?: string
) {
  return {
    projectIdentity: compiled.projectIdentity,
    savedDraftIdentity: compiled.result.disclosure.savedDraftIdentity,
    sourceProfile: CAST_POSSIBILITIES_SOURCE_PROFILE,
    character: targetCharacterId ?? "all-eligible-characters",
    versions: compiled.result.disclosure.versions,
    fingerprint: compiled.result.disclosure.fingerprint,
    model: settings.model,
    provider: "openrouter"
  };
}

function isPromptTooLarge(promptTokenEstimate: number, settings: OpenRouterSettingsStatus): boolean {
  const contextLength = settings.cachedModels?.find((model) => model.id === settings.model)?.contextLength;
  return contextLength !== undefined && promptTokenEstimate + settings.maxOutputTokens > contextLength;
}
