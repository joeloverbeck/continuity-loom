import { readFile } from "node:fs/promises";

import { GOLD_CASE_ORDER } from "./corpus.mjs";

const PROTOCOL_V1_URL = new URL("./protocol.json", import.meta.url);
const PROTOCOL_V2_URL = new URL("./protocol.v2.json", import.meta.url);
const PROTOCOL_V3_URL = new URL("./protocol.v3.json", import.meta.url);
// v2 is the active comparison protocol; v1 is retained only as historical evidence of the failed
// #136 run (see GitHub issue #138). v3 is prepared but NOT pinned active: it repairs the strict
// response_format schema keywords (GitHub issue #142) and stays pending a real compatibility smoke
// owned by #136, so the active protocol deliberately remains v2.
const ACTIVE_PROTOCOL_URL = PROTOCOL_V2_URL;

const WORKFLOW_CONTRACTS = Object.freeze({
  old: "segment_reconciliation.v1",
  new: "accepted_segment_change_review.v1"
});
const V2_MODEL = "anthropic/claude-sonnet-4.6";
const V2_REQUIRED_CAPABILITIES = Object.freeze([
  "response_format",
  "structured_outputs",
  "temperature",
  "top_p",
  "max_tokens|max_completion_tokens"
]);
const V2_PHASES = Object.freeze([
  { id: "capability-preflight", maximumProviderCompletionRequests: 0 },
  { id: "compatibility-smoke", maximumProviderCompletionRequests: 1 },
  { id: "bounded-comparison", maximumProviderCompletionRequests: 16 }
]);

export async function loadProtocol() {
  return loadProtocolFromUrl(ACTIVE_PROTOCOL_URL);
}

export async function loadProtocolV1() {
  return loadProtocolFromUrl(PROTOCOL_V1_URL);
}

export async function loadProtocolV3() {
  return loadProtocolFromUrl(PROTOCOL_V3_URL);
}

async function loadProtocolFromUrl(url) {
  let protocol;
  try {
    protocol = JSON.parse(await readFile(url, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load comparison protocol: ${errorMessage(error)}`, { cause: error });
  }
  return validateProtocol(protocol);
}

export function validateProtocol(protocol) {
  requireObject(protocol, "protocol");
  if (protocol.schemaVersion !== 1 && protocol.schemaVersion !== 2 && protocol.schemaVersion !== 3) {
    throw new Error("Protocol schemaVersion must be 1, 2, or 3.");
  }
  requireString(protocol.protocolId, "protocolId");
  requireDeepEqual(protocol.caseOrder, GOLD_CASE_ORDER, "caseOrder");
  requireDeepEqual(protocol.workflows, ["old", "new"], "workflows");
  requireDeepEqual(protocol.workflowContracts, WORKFLOW_CONTRACTS, "workflowContracts");

  const envelope = requireObject(protocol.sharedEnvelope, "sharedEnvelope");
  requireString(envelope.model, "sharedEnvelope.model");
  const settings = requireObject(envelope.settings, "sharedEnvelope.settings");
  requireFiniteNonnegative(settings.temperature, "sharedEnvelope.settings.temperature");
  requirePositiveInteger(settings.maxOutputTokens, "sharedEnvelope.settings.maxOutputTokens");
  requireFiniteNonnegative(settings.topP, "sharedEnvelope.settings.topP");
  if (envelope.segmentSelection !== "latest") {
    throw new Error("sharedEnvelope.segmentSelection must be latest.");
  }
  if (envelope.recordScope !== "active_working_set" && envelope.recordScope !== "whole_project") {
    throw new Error("sharedEnvelope.recordScope must be active_working_set or whole_project.");
  }

  const requestPolicy = requireObject(protocol.requestPolicy, "requestPolicy");
  if (requestPolicy.maximumProviderRequests !== 16) {
    throw new Error("requestPolicy.maximumProviderRequests must be exactly 16.");
  }
  for (const field of ["automaticRetries", "fallbackRequests", "repairCalls"]) {
    if (requestPolicy[field] !== 0) {
      throw new Error(`requestPolicy.${field} must be 0.`);
    }
  }
  if (requestPolicy.unapprovedSubstitutions !== "prohibited") {
    throw new Error("requestPolicy.unapprovedSubstitutions must be prohibited.");
  }

  const completionBoundary = requireObject(protocol.completionBoundary, "completionBoundary");
  if (completionBoundary.executionAuthorized !== false) {
    throw new Error("completionBoundary.executionAuthorized must remain false; this repository never authorizes a live run.");
  }
  if (completionBoundary.providerCallsExecuted !== 0) {
    throw new Error("completionBoundary.providerCallsExecuted must remain 0; this repository never executes a provider call.");
  }
  if (completionBoundary.issueClosureIsGo !== false) {
    throw new Error("completionBoundary.issueClosureIsGo must remain false.");
  }
  requireString(completionBoundary.liveExecutionOwner, "completionBoundary.liveExecutionOwner");

  if (protocol.schemaVersion === 2 || protocol.schemaVersion === 3) {
    validateComparisonRoutingEnvelope(protocol, envelope);
  }
  if (protocol.schemaVersion === 3) {
    validateVersionThree(protocol);
  }

  return protocol;
}

// v3 mirrors the v2 routing/envelope/phase contract exactly; only the identity and provenance
// fields differ (see protocol.v3.json / GitHub issue #142), so both share this validation.
function validateComparisonRoutingEnvelope(protocol, envelope) {
  if (envelope.model !== V2_MODEL) {
    throw new Error(`sharedEnvelope.model must be ${V2_MODEL} for the comparison protocol.`);
  }

  const routing = requireObject(protocol.routingEnvelope, "routingEnvelope");
  if (routing.responseFormat !== "json_schema") {
    throw new Error("routingEnvelope.responseFormat must be json_schema.");
  }
  if (routing.strictJsonSchema !== true) {
    throw new Error("routingEnvelope.strictJsonSchema must be true.");
  }
  if (routing.requireParameters !== true) {
    throw new Error("routingEnvelope.requireParameters must be true.");
  }
  if (routing.allowFallbacks !== false) {
    throw new Error("routingEnvelope.allowFallbacks must be false.");
  }
  if (routing.toolChoice !== "none") {
    throw new Error("routingEnvelope.toolChoice must be none.");
  }
  requireDeepEqual(routing.requiredCapabilities, V2_REQUIRED_CAPABILITIES, "routingEnvelope.requiredCapabilities");

  const capabilityProof = requireObject(routing.capabilityProof, "routingEnvelope.capabilityProof");
  requireString(capabilityProof.method, "routingEnvelope.capabilityProof.method");
  requireString(capabilityProof.endpointsSource, "routingEnvelope.capabilityProof.endpointsSource");
  requireString(capabilityProof.eligibleEndpointExample, "routingEnvelope.capabilityProof.eligibleEndpointExample");
  if (capabilityProof.providerCompletionRequests !== 0) {
    throw new Error("routingEnvelope.capabilityProof.providerCompletionRequests must be 0; the endpoint check makes no completion request.");
  }

  const phaseAccounting = requireObject(protocol.phaseAccounting, "phaseAccounting");
  if (phaseAccounting.thisRepairAuthorizesCompletionRequests !== false) {
    throw new Error("phaseAccounting.thisRepairAuthorizesCompletionRequests must be false; issue #138 authorizes no completion request.");
  }
  const phases = phaseAccounting.phases;
  if (!Array.isArray(phases) || phases.length !== V2_PHASES.length) {
    throw new Error(`phaseAccounting.phases must list exactly ${V2_PHASES.length} phases.`);
  }
  phases.forEach((phase, index) => {
    const expected = V2_PHASES[index];
    requireObject(phase, `phaseAccounting.phases[${index}]`);
    if (phase.id !== expected.id) {
      throw new Error(`phaseAccounting.phases[${index}].id must be ${expected.id}.`);
    }
    if (phase.maximumProviderCompletionRequests !== expected.maximumProviderCompletionRequests) {
      throw new Error(
        `phaseAccounting.phases[${index}].maximumProviderCompletionRequests must be ${expected.maximumProviderCompletionRequests}.`
      );
    }
    requireString(phase.authority, `phaseAccounting.phases[${index}].authority`);
  });
}

function validateVersionThree(protocol) {
  if (protocol.supersedes !== "accepted-segment-change-review-comparison.v2") {
    throw new Error("version-3 protocol must supersede accepted-segment-change-review-comparison.v2.");
  }
  requireString(protocol.supersededReason, "supersededReason");
}

export function buildDryRunPlan(corpus, protocol) {
  validateProtocol(protocol);
  requireDeepEqual(
    corpus.map((fixture) => fixture.caseId),
    protocol.caseOrder,
    "corpus case order"
  );

  const requests = corpus.flatMap((fixture) =>
    protocol.workflows.map((workflow) => ({
      caseId: fixture.caseId,
      workflow,
      contract: protocol.workflowContracts[workflow],
      envelope: globalThis.structuredClone(protocol.sharedEnvelope),
      expectedSourceAccounting: globalThis.structuredClone(fixture.expectedSourceAccounting)
    }))
  ).map((request, index) => ({
    requestOrdinal: index + 1,
    requestId: `request-${String(index + 1).padStart(2, "0")}-${request.workflow}-${request.caseId}`,
    ...request,
    requestPolicy: {
      retryCount: 0,
      fallbackUsed: false,
      repairCallUsed: false,
      substitutionUsed: false
    },
    execution: "not-executed-dry-run"
  }));

  if (requests.length !== protocol.requestPolicy.maximumProviderRequests) {
    throw new Error(
      `Dry-run plan must contain exactly ${protocol.requestPolicy.maximumProviderRequests} requests; received ${requests.length}.`
    );
  }

  const plan = {
    schemaVersion: protocol.schemaVersion,
    protocolId: protocol.protocolId,
    executionAuthorized: false,
    providerCallsExecuted: 0,
    maximumProviderRequestsForLaterApprovedRun: protocol.requestPolicy.maximumProviderRequests,
    notice: "Dry run only. No provider request was or can be executed by this plan builder.",
    requests
  };

  if (protocol.phaseAccounting !== undefined) {
    plan.phaseAccounting = globalThis.structuredClone(protocol.phaseAccounting);
  }

  return plan;
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
