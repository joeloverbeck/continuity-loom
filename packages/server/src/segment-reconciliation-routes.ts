import {
  compileSegmentReconciliationPrompt,
  segmentReconciliationOutputJsonSchema,
  type SegmentReconciliationRequest
} from "@loom/core";
import type { FastifyInstance } from "fastify";

import { admitStructuredOutputModel } from "./openrouter/capability.js";
import { sendChatCompletion } from "./openrouter/client.js";
import type { OpenRouterRequestOptions } from "./openrouter/request.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings, type OpenRouterSettingsStatus } from "./settings.js";
import { parseSegmentReconciliationResponse } from "./segment-reconciliation-parse.js";
import {
  buildSegmentReconciliationSnapshot,
  type BuildSegmentReconciliationSnapshotResult
} from "./segment-reconciliation-snapshot-builder.js";

const defaultRequest: SegmentReconciliationRequest = {
  segmentSelection: "latest",
  recordScope: "active_working_set"
};

const segmentSelections = new Set<SegmentReconciliationRequest["segmentSelection"]>(["latest"]);
const recordScopes = new Set<SegmentReconciliationRequest["recordScope"]>(["active_working_set", "whole_project"]);
const compileRequestKeys = new Set(["segmentSelection", "recordScope"]);
const analyzeRequestKeys = new Set(["segmentSelection", "recordScope", "expectedPromptFingerprint"]);

export function registerSegmentReconciliationRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/segment-reconciliation/compile", async (request, reply) => {
    const reconciliationRequest = parseSegmentReconciliationRequest(request.body, { requireFingerprint: false });
    if (!reconciliationRequest.ok) {
      return reply.code(400).send(reconciliationRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, reconciliationRequest.value.request);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }

    return {
      ok: true,
      prompt: compileResult.prompt,
      metadata: compileMetadata(compileResult.metadata),
      citations: compileResult.metadata.citationMap ?? {},
      disclosure: disclosure(compileResult),
      outputSchema: segmentReconciliationOutputJsonSchema(),
      source: sourceMetadata(compileResult)
    };
  });

  app.post("/api/segment-reconciliation/analyze", async (request, reply) => {
    const reconciliationRequest = parseSegmentReconciliationRequest(request.body, { requireFingerprint: true });
    if (!reconciliationRequest.ok) {
      return reply.code(400).send(reconciliationRequest.body);
    }

    const compileResult = compileFromOpenProject(manager, reconciliationRequest.value.request);
    if (!compileResult.ok) {
      return reply.code(compileResult.status).send(compileResult.body);
    }

    if (compileResult.metadata.fingerprint !== reconciliationRequest.value.expectedPromptFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "reconciliation-source-changed",
        message: "Reconciliation source changed. Recompile before sending.",
        currentPromptFingerprint: compileResult.metadata.fingerprint
      });
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
        kind: "segment-reconciliation-prompt-too-large",
        message: "Compiled segment reconciliation prompt exceeds the selected model context window."
      };
    }

    const outputSchema = segmentReconciliationOutputJsonSchema();
    const requestOptions: OpenRouterRequestOptions = {
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "segment_reconciliation",
          strict: true,
          schema: outputSchema
        }
      },
      provider: {
        require_parameters: true,
        allow_fallbacks: false
      },
      transforms: [],
      plugins: [],
      tools: [],
      tool_choice: "none"
    };

    const admission = admitStructuredOutputModel({ settings, requestOptions });
    if (!admission.ok) {
      return admission;
    }

    const transportResult = await sendChatCompletion({
      prompt: compileResult.prompt,
      settings,
      requestOptions
    });

    if (!transportResult.ok) {
      return transportResult;
    }

    const parsed = parseSegmentReconciliationResponse({
      rawOutput: transportResult.candidate.text,
      promptFingerprint: compileResult.metadata.fingerprint,
      snapshot: compileResult.snapshot,
      request: reconciliationRequest.value.request,
      contractVersion: compileResult.metadata.versions.contract
    });
    const metadata = analyzeMetadata(settings, compileResult.metadata);

    if (parsed.status === "malformed") {
      return {
        ok: true,
        malformed: true,
        reasonCode: parsed.reasonCode,
        summary: parsed.summary,
        raw: parsed.rawOutput,
        metadata
      };
    }

    return {
      ok: true,
      proposals: parsed.output,
      metadata
    };
  });
}

type CompileFromProjectResult =
  | {
      ok: true;
      prompt: string;
      snapshot: NonNullable<Extract<BuildSegmentReconciliationSnapshotResult, { ok: true }>["snapshot"]>;
      metadata: ReturnType<typeof compileSegmentReconciliationPrompt>["metadata"];
    }
  | { ok: false; status: number; body: unknown };

function compileFromOpenProject(
  manager: ProjectStoreManager,
  request: SegmentReconciliationRequest
): CompileFromProjectResult {
  const repository = manager.getRecordRepository();
  if (!repository) {
    return {
      ok: false,
      status: 409,
      body: { ok: false, kind: "no-open-project", message: "No project is open." }
    };
  }

  const snapshotResult = buildSegmentReconciliationSnapshot(repository, request);
  if (!snapshotResult.ok) {
    return snapshotResult;
  }

  const compileResult = compileSegmentReconciliationPrompt(snapshotResult.snapshot, request);
  return {
    ok: true,
    prompt: compileResult.prompt,
    snapshot: snapshotResult.snapshot,
    metadata: compileResult.metadata
  };
}

function parseSegmentReconciliationRequest(
  body: unknown,
  options: { requireFingerprint: boolean }
):
  | {
      ok: true;
      value: { request: SegmentReconciliationRequest; expectedPromptFingerprint?: string };
    }
  | {
      ok: false;
      body: { ok: false; kind: "invalid-segment-reconciliation-request"; issues: string[] };
    } {
  if (body === undefined || body === null) {
    if (options.requireFingerprint) {
      return invalidRequest(["expectedPromptFingerprint is required."]);
    }

    return { ok: true, value: { request: defaultRequest } };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest(["Body must be an object."]);
  }

  const allowedKeys = options.requireFingerprint ? analyzeRequestKeys : compileRequestKeys;
  const keys = Object.keys(body);
  const extraKeys = keys.filter((key) => !allowedKeys.has(key));
  if (extraKeys.length > 0) {
    return invalidRequest(extraKeys.map((key) => `Unsupported field: ${key}`));
  }

  const segmentSelection = (body as { segmentSelection?: unknown }).segmentSelection;
  const recordScope = (body as { recordScope?: unknown }).recordScope;
  const expectedPromptFingerprint = (body as { expectedPromptFingerprint?: unknown }).expectedPromptFingerprint;
  const issues: string[] = [];

  if (
    segmentSelection !== undefined &&
    (typeof segmentSelection !== "string" || !segmentSelections.has(segmentSelection as SegmentReconciliationRequest["segmentSelection"]))
  ) {
    issues.push("segmentSelection must be latest.");
  }

  if (
    recordScope !== undefined &&
    (typeof recordScope !== "string" || !recordScopes.has(recordScope as SegmentReconciliationRequest["recordScope"]))
  ) {
    issues.push("recordScope must be active_working_set or whole_project.");
  }

  if (options.requireFingerprint) {
    if (typeof expectedPromptFingerprint !== "string" || expectedPromptFingerprint.trim().length === 0) {
      issues.push("expectedPromptFingerprint is required.");
    }
  } else if (expectedPromptFingerprint !== undefined) {
    issues.push("expectedPromptFingerprint is not accepted by compile.");
  }

  if (issues.length > 0) {
    return invalidRequest(issues);
  }

  return {
    ok: true,
    value: {
      request: {
        segmentSelection: segmentSelection === undefined
          ? defaultRequest.segmentSelection
          : segmentSelection as SegmentReconciliationRequest["segmentSelection"],
        recordScope: recordScope === undefined ? defaultRequest.recordScope : recordScope as SegmentReconciliationRequest["recordScope"]
      },
      ...(typeof expectedPromptFingerprint === "string" ? { expectedPromptFingerprint } : {})
    }
  };
}

function invalidRequest(issues: string[]): {
  ok: false;
  body: { ok: false; kind: "invalid-segment-reconciliation-request"; issues: string[] };
} {
  return {
    ok: false,
    body: { ok: false, kind: "invalid-segment-reconciliation-request", issues }
  };
}

function compileMetadata(metadata: ReturnType<typeof compileSegmentReconciliationPrompt>["metadata"]) {
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
  metadata: ReturnType<typeof compileSegmentReconciliationPrompt>["metadata"]
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

function disclosure(compileResult: Extract<CompileFromProjectResult, { ok: true }>) {
  return {
    sourceProfile: "segment-reconciliation",
    acceptedSegment: {
      id: compileResult.snapshot.acceptedSegment.id,
      sequence: compileResult.snapshot.acceptedSegment.sequence,
      acceptedAt: compileResult.snapshot.acceptedSegment.acceptedAt,
      spanCount: compileResult.snapshot.acceptedSegmentSpans.length
    },
    recordScope: compileResult.snapshot.request.recordScope,
    recordCount: compileResult.snapshot.records.length,
    referenceStubCount: compileResult.snapshot.referenceStubs.length,
    briefFieldCount: compileResult.snapshot.briefFields.length
  };
}

function sourceMetadata(compileResult: Extract<CompileFromProjectResult, { ok: true }>) {
  return {
    segmentSelection: compileResult.snapshot.request.segmentSelection,
    recordScope: compileResult.snapshot.request.recordScope,
    acceptedSegmentId: compileResult.snapshot.acceptedSegment.id,
    acceptedSegmentSequence: compileResult.snapshot.acceptedSegment.sequence,
    acceptedSegmentAcceptedAt: compileResult.snapshot.acceptedSegment.acceptedAt
  };
}

function isPromptTooLarge(promptTokenEstimate: number, settings: OpenRouterSettingsStatus): boolean {
  const contextLength = settings.cachedModels?.find((model) => model.id === settings.model)?.contextLength;
  return contextLength !== undefined && promptTokenEstimate + settings.maxOutputTokens > contextLength;
}
