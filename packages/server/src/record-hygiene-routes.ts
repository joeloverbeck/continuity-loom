import { compileRecordHygienePrompt, type RecordHygieneRequest } from "@loom/core";
import type { FastifyInstance } from "fastify";

import { buildChatCompletionRequest, inspectChatCompletionRequest } from "./openrouter/request.js";
import { runOpenRouterSendPipeline } from "./openrouter/send-pipeline.js";
import { createDiagnosticReceipt } from "./openrouter/response.js";
import type { ProjectStoreManager } from "./project-store.js";
import { parseRecordHygieneResponse } from "./record-hygiene-parse.js";
import { buildStoryRecordHygieneSnapshot } from "./record-hygiene-snapshot-builder.js";
import { readOpenRouterSettings } from "./settings.js";

const defaultRequest: RecordHygieneRequest = { mode: "full_active_atomic_review" };
const requestModes = new Set<RecordHygieneRequest["mode"]>([
  "full_active_atomic_review",
  "active_working_set_atomic_review"
]);
const compileRequestKeys = new Set(["mode"]);
const analyzeRequestKeys = new Set(["mode", "expectedPromptFingerprint", "expectedRequestFingerprint"]);

export function registerRecordHygieneRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/record-hygiene/compile", async (request, reply) => {
    const hygieneRequest = parseRecordHygieneRequest(request.body, false);
    if (!hygieneRequest.ok) {
      return reply.code(400).send(hygieneRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, hygieneRequest.value);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }
    const settings = readOpenRouterSettings();

    return {
      ok: true,
      prompt: compileResult.prompt,
      metadata: compileMetadata(compileResult.metadata),
      citations: compileResult.metadata.citationMap ?? {},
      providerRequest: inspectChatCompletionRequest(buildChatCompletionRequest({
        prompt: compileResult.prompt,
        settings,
        outputPolicy: "strict"
      }), "strict", settings)
    };
  });

  app.post("/api/record-hygiene/analyze", async (request, reply) => {
    const hygieneRequest = parseRecordHygieneRequest(request.body, true);
    if (!hygieneRequest.ok) {
      return reply.code(400).send(hygieneRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, hygieneRequest.value);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }

    const sendResult = await runOpenRouterSendPipeline({
      profile: {
        outputPolicy: "strict",
        prompt: compileResult.prompt,
        promptFingerprint: compileResult.metadata.fingerprint,
        staleness: {
          mode: "combined",
          expectedPromptFingerprint: hygieneRequest.expectedPromptFingerprint ?? "",
          expectedRequestFingerprint: hygieneRequest.expectedRequestFingerprint ?? "",
          refusal: {
            status: 409,
            body: {
              ok: false,
              kind: "stale-record-hygiene-inspection",
              message: "The hygiene source or provider configuration changed. Compile and inspect it again before Analyze."
            }
          }
        },
        metadata: {
          providerFields: "full",
          placement: "before",
          additions: compileMetadata(compileResult.metadata)
        }
      }
    });
    if (!sendResult.ok) {
      return sendResult.status === undefined
        ? sendResult.body
        : reply.code(sendResult.status).send(sendResult.body);
    }

    const validCitationKeys = new Set(Object.keys(compileResult.metadata.citationMap ?? {}));
    const parsed = parseRecordHygieneResponse(sendResult.candidate.text, validCitationKeys);

    if (!parsed.ok) {
      const recovery = "Review the safe structural reason, then use the existing Record Hygiene action manually if you want another attempt. No retry is automatic.";
      return {
        ok: true,
        quarantined: true,
        reasonCode: "local-parser-rejected",
        summary: "Candidate content reached Continuity Loom but failed local Record Hygiene validation.",
        recovery,
        diagnostic: createDiagnosticReceipt(
          "local-validation",
          sendResult.response,
          "Candidate content reached Continuity Loom but failed local Record Hygiene validation.",
          recovery,
          undefined,
          parsed.reason
        )
      };
    }

    return {
      ok: true,
      findings: parsed.findings,
      metadata: sendResult.metadata
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

  const snapshotResult = buildStoryRecordHygieneSnapshot(repository, request);
  if (!snapshotResult.ok) {
    return snapshotResult;
  }

  const compileResult = compileRecordHygienePrompt(snapshotResult.snapshot, request);
  return { ok: true, prompt: compileResult.prompt, metadata: compileResult.metadata };
}

function parseRecordHygieneRequest(body: unknown, requireFingerprint: boolean):
  | {
      ok: true;
      value: RecordHygieneRequest;
      expectedPromptFingerprint?: string;
      expectedRequestFingerprint?: string;
    }
  | { ok: false; body: { ok: false; kind: "invalid-record-hygiene-request"; issues: string[] } } {
  if (body === undefined || body === null) {
    return requireFingerprint
      ? invalidRequest(["expectedPromptFingerprint and expectedRequestFingerprint are required."])
      : { ok: true, value: defaultRequest };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest(["Body must be an object."]);
  }

  const keys = Object.keys(body);
  const allowedKeys = requireFingerprint ? analyzeRequestKeys : compileRequestKeys;
  const extraKeys = keys.filter((key) => !allowedKeys.has(key));
  if (extraKeys.length > 0) {
    return invalidRequest(extraKeys.map((key) => `Unsupported field: ${key}`));
  }

  const mode = (body as { mode?: unknown }).mode;
  if (mode !== undefined && (typeof mode !== "string" || !requestModes.has(mode as RecordHygieneRequest["mode"]))) {
    return invalidRequest(["mode must be full_active_atomic_review or active_working_set_atomic_review."]);
  }
  const record = body as Record<string, unknown>;
  if (
    requireFingerprint &&
    (
      typeof record.expectedPromptFingerprint !== "string" ||
      !record.expectedPromptFingerprint.trim() ||
      typeof record.expectedRequestFingerprint !== "string" ||
      !record.expectedRequestFingerprint.trim()
    )
  ) {
    return invalidRequest(["expectedPromptFingerprint and expectedRequestFingerprint are required."]);
  }

  return {
    ok: true,
    value: { mode: mode === undefined ? defaultRequest.mode : mode as RecordHygieneRequest["mode"] },
    ...(typeof record.expectedPromptFingerprint === "string"
      ? { expectedPromptFingerprint: record.expectedPromptFingerprint }
      : {}),
    ...(typeof record.expectedRequestFingerprint === "string"
      ? { expectedRequestFingerprint: record.expectedRequestFingerprint }
      : {})
  };
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
