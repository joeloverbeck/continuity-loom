import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
  acceptedSegmentChangeReviewOutputJsonSchema,
  compileAcceptedSegmentChangeReviewPrompt,
  parseAcceptedSegmentChangeReviewOutput,
  type AcceptedSegmentChangeReviewRequest,
  type AcceptedSegmentChangeReviewSnapshot
} from "@loom/core";
import type { FastifyInstance } from "fastify";

import {
  buildChatCompletionRequest,
  inspectChatCompletionRequest,
  type OpenRouterRequestOptions
} from "./openrouter/request.js";
import { runOpenRouterSendPipeline } from "./openrouter/send-pipeline.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import {
  buildAcceptedSegmentChangeReviewSnapshot,
  type BuildAcceptedSegmentChangeReviewSnapshotResult
} from "./accepted-segment-change-review-snapshot-builder.js";

const defaultRequest: AcceptedSegmentChangeReviewRequest = {
  segmentSelection: "latest",
  recordScope: "active_working_set"
};

const compileKeys = new Set(["segmentSelection", "recordScope"]);
const analyzeKeys = new Set([
  "segmentSelection",
  "recordScope",
  "expectedPromptFingerprint",
  "expectedRequestFingerprint"
]);

export function registerAcceptedSegmentChangeReviewRoutes(
  app: FastifyInstance,
  manager: ProjectStoreManager
): void {
  app.post("/api/accepted-segment-change-review/compile", async (request, reply) => {
    const parsedRequest = parseRequest(request.body, false);
    if (!parsedRequest.ok) {
      return reply.code(400).send(parsedRequest.body);
    }

    const compiled = compileFromOpenProject(manager, parsedRequest.request);
    if (!compiled.ok) {
      return reply.code(compiled.status).send(compiled.body);
    }

    const settings = readOpenRouterSettings();
    const finalizedRequest = buildChatCompletionRequest({
      prompt: compiled.prompt,
      settings,
      requestOptions: changeReviewRequestOptions()
    });
    return {
      ok: true,
      prompt: compiled.prompt,
      disclosure: compiled.disclosure,
      citations: compiled.disclosure.citationMap,
      outputSchema: acceptedSegmentChangeReviewOutputJsonSchema(),
      consumedGuidance: compiled.consumedGuidance,
      providerRequest: inspectChatCompletionRequest(finalizedRequest, settings)
    };
  });

  app.post("/api/accepted-segment-change-review/analyze", async (request, reply) => {
    const parsedRequest = parseRequest(request.body, true);
    if (!parsedRequest.ok) {
      return reply.code(400).send(parsedRequest.body);
    }

    const compiled = compileFromOpenProject(manager, parsedRequest.request);
    if (!compiled.ok) {
      return reply.code(compiled.status).send(compiled.body);
    }

    const outputSchema = acceptedSegmentChangeReviewOutputJsonSchema();
    const requestOptions = changeReviewRequestOptions(outputSchema);
    const sendResult = await runOpenRouterSendPipeline({
      profile: {
        prompt: compiled.prompt,
        promptFingerprint: compiled.disclosure.fingerprint,
        requestOptions,
        staleness: {
          mode: "separate",
          expectedPromptFingerprint: parsedRequest.expectedPromptFingerprint ?? "",
          expectedRequestFingerprint: parsedRequest.expectedRequestFingerprint ?? "",
          promptRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "accepted-segment-change-review-source-changed",
              message: "The review source changed. Compile and inspect it again before Analyze.",
              currentPromptFingerprint: compiled.disclosure.fingerprint
            }
          },
          providerRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "accepted-segment-change-review-source-changed",
              message: "The review source or provider configuration changed. Compile and inspect it again before Analyze.",
              currentPromptFingerprint: compiled.disclosure.fingerprint
            }
          }
        },
        metadata: {
          providerFields: "identity",
          placement: "after",
          additions: {
            sourceProfile: ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
            acceptedSegmentId: compiled.snapshot.acceptedSegment.id,
            acceptedSegmentSequence: compiled.snapshot.acceptedSegment.sequence,
            recordScope: compiled.snapshot.request.recordScope,
            versions: compiled.disclosure.versions,
            fingerprint: compiled.disclosure.fingerprint
          }
        }
      }
    });
    if (!sendResult.ok) {
      return sendResult.status === undefined
        ? sendResult.body
        : reply.code(sendResult.status).send(sendResult.body);
    }

    const parsed = parseAcceptedSegmentChangeReviewOutput(
      sendResult.candidate.text,
      parseContext(compiled.snapshot, compiled.disclosure.citationMap)
    );

    if (parsed.status === "quarantined") {
      return {
        ok: true,
        quarantined: true,
        reasonCode: parsed.reasonCode,
        summary: parsed.summary,
        recovery: parsed.recovery,
        metadata: sendResult.metadata
      };
    }

    return {
      ok: true,
      review: parsed.output,
      advisory: { verified: false, canonical: false },
      metadata: sendResult.metadata
    };
  });
}

type CompiledReview = {
  ok: true;
  prompt: string;
  snapshot: AcceptedSegmentChangeReviewSnapshot;
  disclosure: ReturnType<typeof compileAcceptedSegmentChangeReviewPrompt>["disclosure"];
  consumedGuidance: Extract<BuildAcceptedSegmentChangeReviewSnapshotResult, { ok: true }>["consumedGuidance"];
};

function compileFromOpenProject(
  manager: ProjectStoreManager,
  request: AcceptedSegmentChangeReviewRequest
): CompiledReview | { ok: false; status: number; body: unknown } {
  const repository = manager.getRecordRepository();
  if (!repository) {
    return {
      ok: false,
      status: 409,
      body: { ok: false, kind: "no-open-project", message: "No project is open." }
    };
  }

  const source = buildAcceptedSegmentChangeReviewSnapshot(repository, request);
  if (!source.ok) {
    return source;
  }

  const compiled = compileAcceptedSegmentChangeReviewPrompt(source.snapshot);
  return {
    ok: true,
    prompt: compiled.prompt,
    snapshot: source.snapshot,
    disclosure: compiled.disclosure,
    consumedGuidance: source.consumedGuidance
  };
}

function parseRequest(
  body: unknown,
  requireFingerprint: boolean
):
  | {
      ok: true;
      request: AcceptedSegmentChangeReviewRequest;
      expectedPromptFingerprint?: string;
      expectedRequestFingerprint?: string;
    }
  | { ok: false; body: { ok: false; kind: "invalid-accepted-segment-change-review-request"; issues: string[] } } {
  if (body === undefined || body === null) {
    return requireFingerprint
      ? invalidRequest(["expectedPromptFingerprint and expectedRequestFingerprint are required."])
      : { ok: true, request: defaultRequest };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest(["Body must be an object."]);
  }

  const allowed = requireFingerprint ? analyzeKeys : compileKeys;
  const record = body as Record<string, unknown>;
  const issues = Object.keys(record)
    .filter((key) => !allowed.has(key))
    .map((key) => `Unsupported field: ${key}`);

  if (record.segmentSelection !== undefined && record.segmentSelection !== "latest") {
    issues.push("segmentSelection must be latest.");
  }
  if (
    record.recordScope !== undefined &&
    record.recordScope !== "active_working_set" &&
    record.recordScope !== "whole_project"
  ) {
    issues.push("recordScope must be active_working_set or whole_project.");
  }
  if (
    requireFingerprint &&
    (typeof record.expectedPromptFingerprint !== "string" || !record.expectedPromptFingerprint.trim())
  ) {
    issues.push("expectedPromptFingerprint is required.");
  }
  if (
    requireFingerprint &&
    (typeof record.expectedRequestFingerprint !== "string" || !record.expectedRequestFingerprint.trim())
  ) {
    issues.push("expectedRequestFingerprint is required.");
  }

  if (issues.length > 0) {
    return invalidRequest(issues);
  }

  return {
    ok: true,
    request: {
      segmentSelection: "latest",
      recordScope: record.recordScope === "whole_project" ? "whole_project" : "active_working_set"
    },
    ...(typeof record.expectedPromptFingerprint === "string"
      ? { expectedPromptFingerprint: record.expectedPromptFingerprint }
      : {}),
    ...(typeof record.expectedRequestFingerprint === "string"
      ? { expectedRequestFingerprint: record.expectedRequestFingerprint }
      : {})
  };
}

function changeReviewRequestOptions(
  outputSchema: ReturnType<typeof acceptedSegmentChangeReviewOutputJsonSchema> =
    acceptedSegmentChangeReviewOutputJsonSchema()
): OpenRouterRequestOptions {
  return {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "accepted_segment_change_review",
        strict: true,
        schema: outputSchema
      }
    },
    provider: { require_parameters: true, allow_fallbacks: false },
    transforms: [],
    plugins: [],
    tools: [],
    tool_choice: "none"
  };
}

function invalidRequest(issues: string[]) {
  return {
    ok: false as const,
    body: { ok: false as const, kind: "invalid-accepted-segment-change-review-request" as const, issues }
  };
}

function parseContext(
  snapshot: AcceptedSegmentChangeReviewSnapshot,
  citationMap: Readonly<Record<string, string>>
) {
  const evidenceKeys = new Set(snapshot.acceptedSegmentSpans.map((span) => span.key));
  return {
    acceptedSegmentText: snapshot.acceptedSegment.text,
    evidenceKeys: [...evidenceKeys],
    evidenceTextByKey: Object.fromEntries(snapshot.acceptedSegmentSpans.map((span) => [span.key, span.text])),
    contrastKeys: Object.keys(citationMap).filter((key) => !evidenceKeys.has(key))
  };
}
