import { readFile } from "node:fs/promises";

import { GOLD_CASE_ORDER } from "./corpus.mjs";

const PROTOCOL_URL = new URL("./protocol.json", import.meta.url);

export async function loadProtocol() {
  let protocol;
  try {
    protocol = JSON.parse(await readFile(PROTOCOL_URL, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load comparison protocol: ${errorMessage(error)}`, { cause: error });
  }
  return validateProtocol(protocol);
}

export function validateProtocol(protocol) {
  requireObject(protocol, "protocol");
  if (protocol.schemaVersion !== 1) {
    throw new Error("Protocol schemaVersion must be 1.");
  }
  requireString(protocol.protocolId, "protocolId");
  requireDeepEqual(protocol.caseOrder, GOLD_CASE_ORDER, "caseOrder");
  requireDeepEqual(protocol.workflows, ["old", "new"], "workflows");

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
    throw new Error("completionBoundary.executionAuthorized must remain false for issue #134.");
  }
  if (completionBoundary.providerCallsExecuted !== 0) {
    throw new Error("completionBoundary.providerCallsExecuted must remain 0 for issue #134.");
  }
  if (completionBoundary.issueClosureIsGo !== false) {
    throw new Error("completionBoundary.issueClosureIsGo must remain false.");
  }
  requireString(completionBoundary.liveExecutionOwner, "completionBoundary.liveExecutionOwner");

  return protocol;
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

  return {
    schemaVersion: 1,
    protocolId: protocol.protocolId,
    executionAuthorized: false,
    providerCallsExecuted: 0,
    maximumProviderRequestsForLaterApprovedRun: protocol.requestPolicy.maximumProviderRequests,
    notice: "Dry run only. No provider request was or can be executed by this plan builder.",
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
