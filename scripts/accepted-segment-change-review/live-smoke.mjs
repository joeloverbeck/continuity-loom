import { readFile } from "node:fs/promises";

import { GOLD_CASE_ORDER } from "./corpus.mjs";

// The prepared new-candidate-only live conformance smoke. It sends exactly one
// new-candidate request per synthetic case under a fixed eight-request ceiling,
// with no retries, fallbacks, repairs, tools, substitutions, or old-prompt
// request, and it stays `executionAuthorized: false` until fresh owner
// authorization recorded by GitHub issue #148. It never references the retired
// Segment Reconciliation prompt.
const LIVE_SMOKE_URL = new URL("./live-smoke.v1.json", import.meta.url);
const LIVE_SMOKE_PROTOCOL_ID = "accepted-segment-change-review-live-smoke.v1";
const NEW_CANDIDATE_CONTRACT = "accepted_segment_change_review.v2";
const LIVE_SMOKE_MODEL = "anthropic/claude-sonnet-4.6";
const MAXIMUM_PROVIDER_REQUESTS = 8;
const REQUIRED_CAPABILITIES = Object.freeze([
  "response_format",
  "structured_outputs",
  "temperature",
  "top_p",
  "max_tokens|max_completion_tokens"
]);
const OLD_PROMPT_PATTERN = /segment[_-]reconciliation/i;

export async function loadLiveSmokeProtocol() {
  let protocol;
  try {
    protocol = JSON.parse(await readFile(LIVE_SMOKE_URL, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load live-smoke protocol: ${errorMessage(error)}`, { cause: error });
  }
  return validateLiveSmokeProtocol(protocol);
}

export function validateLiveSmokeProtocol(protocol) {
  requireObject(protocol, "live-smoke protocol");
  if (protocol.schemaVersion !== 1) {
    throw new Error("Live-smoke protocol schemaVersion must be 1.");
  }
  if (protocol.protocolId !== LIVE_SMOKE_PROTOCOL_ID) {
    throw new Error(`Live-smoke protocolId must be ${LIVE_SMOKE_PROTOCOL_ID}.`);
  }
  if (protocol.candidate !== "new-candidate-only") {
    throw new Error("Live-smoke protocol must be new-candidate-only.");
  }
  requireString(protocol.purpose, "live-smoke purpose");
  requireDeepEqual(protocol.caseOrder, GOLD_CASE_ORDER, "live-smoke caseOrder");
  if (protocol.workflowContract !== NEW_CANDIDATE_CONTRACT) {
    throw new Error(`Live-smoke workflowContract must be ${NEW_CANDIDATE_CONTRACT}.`);
  }
  if (OLD_PROMPT_PATTERN.test(JSON.stringify(protocol))) {
    throw new Error("Live-smoke protocol must not reference the retired Segment Reconciliation prompt.");
  }

  const envelope = requireObject(protocol.sharedEnvelope, "live-smoke sharedEnvelope");
  if (envelope.model !== LIVE_SMOKE_MODEL) {
    throw new Error(`live-smoke sharedEnvelope.model must be ${LIVE_SMOKE_MODEL}.`);
  }
  const settings = requireObject(envelope.settings, "live-smoke sharedEnvelope.settings");
  requireFiniteNonnegative(settings.temperature, "live-smoke temperature");
  requirePositiveInteger(settings.maxOutputTokens, "live-smoke maxOutputTokens");
  requireFiniteNonnegative(settings.topP, "live-smoke topP");
  if (envelope.segmentSelection !== "latest") {
    throw new Error("live-smoke sharedEnvelope.segmentSelection must be latest.");
  }
  if (envelope.recordScope !== "active_working_set" && envelope.recordScope !== "whole_project") {
    throw new Error("live-smoke sharedEnvelope.recordScope must be active_working_set or whole_project.");
  }

  const routing = requireObject(protocol.routingEnvelope, "live-smoke routingEnvelope");
  if (routing.responseFormat !== "json_schema") {
    throw new Error("live-smoke routingEnvelope.responseFormat must be json_schema.");
  }
  if (routing.strictJsonSchema !== true) {
    throw new Error("live-smoke routingEnvelope.strictJsonSchema must be true.");
  }
  if (routing.requireParameters !== true) {
    throw new Error("live-smoke routingEnvelope.requireParameters must be true.");
  }
  if (routing.allowFallbacks !== false) {
    throw new Error("live-smoke routingEnvelope.allowFallbacks must be false.");
  }
  if (routing.toolChoice !== "none") {
    throw new Error("live-smoke routingEnvelope.toolChoice must be none.");
  }
  requireDeepEqual(routing.requiredCapabilities, REQUIRED_CAPABILITIES, "live-smoke requiredCapabilities");

  const requestPolicy = requireObject(protocol.requestPolicy, "live-smoke requestPolicy");
  if (requestPolicy.maximumProviderRequests !== MAXIMUM_PROVIDER_REQUESTS) {
    throw new Error(`live-smoke requestPolicy.maximumProviderRequests must be exactly ${MAXIMUM_PROVIDER_REQUESTS}.`);
  }
  if (requestPolicy.requestsPerCase !== 1) {
    throw new Error("live-smoke requestPolicy.requestsPerCase must be exactly 1.");
  }
  for (const field of ["automaticRetries", "fallbackRequests", "repairCalls", "toolCalls", "oldPromptRequests"]) {
    if (requestPolicy[field] !== 0) {
      throw new Error(`live-smoke requestPolicy.${field} must be 0.`);
    }
  }
  if (requestPolicy.unapprovedSubstitutions !== "prohibited") {
    throw new Error("live-smoke requestPolicy.unapprovedSubstitutions must be prohibited.");
  }

  const completionBoundary = requireObject(protocol.completionBoundary, "live-smoke completionBoundary");
  if (completionBoundary.executionAuthorized !== false) {
    throw new Error("live-smoke completionBoundary.executionAuthorized must remain false until fresh owner authorization.");
  }
  if (completionBoundary.providerCallsExecuted !== 0) {
    throw new Error("live-smoke completionBoundary.providerCallsExecuted must remain 0.");
  }
  if (completionBoundary.issueClosureIsGo !== false) {
    throw new Error("live-smoke completionBoundary.issueClosureIsGo must remain false.");
  }
  requireString(completionBoundary.liveExecutionOwner, "live-smoke liveExecutionOwner");

  return protocol;
}

export function buildLiveSmokePlan(corpus, protocol) {
  validateLiveSmokeProtocol(protocol);
  requireDeepEqual(
    corpus.map((fixture) => fixture.caseId),
    protocol.caseOrder,
    "live-smoke corpus case order"
  );

  const requests = corpus.map((fixture, index) => ({
    requestOrdinal: index + 1,
    requestId: `smoke-${String(index + 1).padStart(2, "0")}-new-${fixture.caseId}`,
    caseId: fixture.caseId,
    workflow: "new",
    contract: protocol.workflowContract,
    envelope: globalThis.structuredClone(protocol.sharedEnvelope),
    expectedSourceAccounting: globalThis.structuredClone(fixture.expectedSourceAccounting),
    requestPolicy: {
      retryCount: 0,
      fallbackUsed: false,
      repairCallUsed: false,
      toolCallUsed: false,
      substitutionUsed: false,
      oldPromptRequested: false
    },
    execution: "not-executed-prepared-only"
  }));

  if (requests.length !== MAXIMUM_PROVIDER_REQUESTS) {
    throw new Error(
      `Live-smoke plan must contain exactly ${MAXIMUM_PROVIDER_REQUESTS} new-candidate requests; received ${requests.length}.`
    );
  }

  return {
    schemaVersion: protocol.schemaVersion,
    protocolId: protocol.protocolId,
    candidate: protocol.candidate,
    workflowContract: protocol.workflowContract,
    executionAuthorized: false,
    providerCallsExecuted: 0,
    maximumProviderRequestsForLaterApprovedRun: MAXIMUM_PROVIDER_REQUESTS,
    oldPromptRequests: 0,
    liveExecutionOwner: protocol.completionBoundary.liveExecutionOwner,
    notice: "Prepared only. No provider request was or can be executed by this plan builder; execution and the steward GO/NO-GO belong to GitHub issue #148.",
    requests
  };
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a nonblank string.`);
  }
  return value;
}

function requireFiniteNonnegative(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite nonnegative number.`);
  }
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function requireDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the deterministic protocol.`);
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
