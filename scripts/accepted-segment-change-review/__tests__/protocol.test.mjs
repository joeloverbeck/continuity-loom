import assert from "node:assert/strict";
import test from "node:test";

import { loadGoldCorpus } from "../corpus.mjs";
import { buildDryRunPlan, loadProtocol, loadProtocolV1, loadProtocolV3, validateProtocol } from "../protocol.mjs";

test("pins one old and one new request for every case under one shared envelope", async () => {
  const corpus = await loadGoldCorpus();
  const protocol = await loadProtocol();
  const plan = buildDryRunPlan(corpus, protocol);

  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.protocolId, "accepted-segment-change-review-comparison.v2");
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.providerCallsExecuted, 0);
  assert.equal(plan.maximumProviderRequestsForLaterApprovedRun, 16);
  assert.equal(plan.requests.length, 16);
  assert.equal(plan.phaseAccounting.thisRepairAuthorizesCompletionRequests, false);
  assert.deepEqual(
    plan.phaseAccounting.phases.map((phase) => [phase.id, phase.maximumProviderCompletionRequests]),
    [
      ["capability-preflight", 0],
      ["compatibility-smoke", 1],
      ["bounded-comparison", 16]
    ]
  );
  assert.deepEqual(
    plan.requests.map((request) => [request.caseId, request.workflow]),
    corpus.flatMap((fixture) => [
      [fixture.caseId, "old"],
      [fixture.caseId, "new"]
    ])
  );
  assert.deepEqual(new Set(plan.requests.map((request) => JSON.stringify(request.envelope))), new Set([
    JSON.stringify(protocol.sharedEnvelope)
  ]));
  assert.deepEqual(new Set(plan.requests.map((request) => request.contract)), new Set([
    "segment_reconciliation.v1",
    "accepted_segment_change_review.v1"
  ]));
  assert.ok(plan.requests.every((request) => request.execution === "not-executed-dry-run"));
  assert.ok(plan.requests.every((request) => request.requestPolicy.retryCount === 0));
  assert.ok(plan.requests.every((request) => request.requestPolicy.fallbackUsed === false));
  assert.ok(plan.requests.every((request) => request.requestPolicy.repairCallUsed === false));
  assert.ok(plan.requests.every((request) => request.requestPolicy.substitutionUsed === false));
});

test("rejects retry, fallback, repair, substitution, or request-ceiling drift", async () => {
  const protocol = await loadProtocol();

  for (const [field, value] of [
    ["automaticRetries", 1],
    ["fallbackRequests", 1],
    ["repairCalls", 1]
  ]) {
    const invalid = globalThis.structuredClone(protocol);
    invalid.requestPolicy[field] = value;
    assert.throws(() => validateProtocol(invalid), new RegExp(field));
  }

  const substitution = globalThis.structuredClone(protocol);
  substitution.requestPolicy.unapprovedSubstitutions = "allowed";
  assert.throws(() => validateProtocol(substitution), /unapprovedSubstitutions/);

  const ceiling = globalThis.structuredClone(protocol);
  ceiling.requestPolicy.maximumProviderRequests = 17;
  assert.throws(() => validateProtocol(ceiling), /maximumProviderRequests/);

  const contract = globalThis.structuredClone(protocol);
  contract.workflowContracts = {
    old: "drifted-contract",
    new: "accepted_segment_change_review.v1"
  };
  assert.throws(() => validateProtocol(contract), /workflowContracts/);
});

test("version 2 rejects model, routing-envelope, and phase-accounting drift", async () => {
  const protocol = await loadProtocol();

  const model = globalThis.structuredClone(protocol);
  model.sharedEnvelope.model = "anthropic/claude-sonnet-4";
  assert.throws(() => validateProtocol(model), /sharedEnvelope\.model must be anthropic\/claude-sonnet-4\.6/);

  const strict = globalThis.structuredClone(protocol);
  strict.routingEnvelope.strictJsonSchema = false;
  assert.throws(() => validateProtocol(strict), /strictJsonSchema/);

  const fallbacks = globalThis.structuredClone(protocol);
  fallbacks.routingEnvelope.allowFallbacks = true;
  assert.throws(() => validateProtocol(fallbacks), /allowFallbacks/);

  const capabilities = globalThis.structuredClone(protocol);
  capabilities.routingEnvelope.requiredCapabilities = ["response_format"];
  assert.throws(() => validateProtocol(capabilities), /requiredCapabilities/);

  const smokeCeiling = globalThis.structuredClone(protocol);
  smokeCeiling.phaseAccounting.phases[1].maximumProviderCompletionRequests = 16;
  assert.throws(() => validateProtocol(smokeCeiling), /compatibility-smoke|maximumProviderCompletionRequests/);

  const authorizes = globalThis.structuredClone(protocol);
  authorizes.phaseAccounting.thisRepairAuthorizesCompletionRequests = true;
  assert.throws(() => validateProtocol(authorizes), /thisRepairAuthorizesCompletionRequests/);
});

test("version 1 protocol remains identifiable and validatable and is distinct from version 2", async () => {
  const [v1, v2] = await Promise.all([loadProtocolV1(), loadProtocol()]);

  assert.equal(v1.schemaVersion, 1);
  assert.equal(v1.protocolId, "accepted-segment-change-review-comparison.v1");
  assert.equal(v1.sharedEnvelope.model, "anthropic/claude-sonnet-4");
  assert.equal(v1.completionBoundary.executionAuthorized, false);

  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.protocolId, "accepted-segment-change-review-comparison.v2");
  assert.equal(v2.sharedEnvelope.model, "anthropic/claude-sonnet-4.6");
  assert.equal(v2.supersedes, "accepted-segment-change-review-comparison.v1");

  assert.notEqual(v1.protocolId, v2.protocolId);
  assert.notEqual(v1.sharedEnvelope.model, v2.sharedEnvelope.model);
  assert.notEqual(v1.schemaVersion, v2.schemaVersion);
});

test("version 3 protocol is prepared, validatable, records the schema repair, and is not pinned active", async () => {
  const [active, v3] = await Promise.all([loadProtocol(), loadProtocolV3()]);

  // Prepared and validatable.
  assert.equal(v3.schemaVersion, 3);
  assert.equal(v3.protocolId, "accepted-segment-change-review-comparison.v3");
  assert.equal(v3.supersedes, "accepted-segment-change-review-comparison.v2");
  assert.doesNotThrow(() => validateProtocol(v3));

  // Mirrors the v2 envelope: same model, same routing, same phases.
  assert.equal(v3.sharedEnvelope.model, "anthropic/claude-sonnet-4.6");
  assert.deepEqual(
    v3.phaseAccounting.phases.map((phase) => [phase.id, phase.maximumProviderCompletionRequests]),
    [
      ["capability-preflight", 0],
      ["compatibility-smoke", 1],
      ["bounded-comparison", 16]
    ]
  );

  // Records the schema-repair provenance (GitHub issue #142) and the offending keyword.
  assert.match(v3.supersededReason, /#142/);
  assert.match(v3.supersededReason, /uniqueItems/);

  // NOT live-authorized: never authorizes a run, never a GO, never executes a call.
  assert.equal(v3.completionBoundary.executionAuthorized, false);
  assert.equal(v3.completionBoundary.providerCallsExecuted, 0);
  assert.equal(v3.completionBoundary.issueClosureIsGo, false);
  assert.equal(v3.phaseAccounting.thisRepairAuthorizesCompletionRequests, false);

  // NOT pinned as the active comparison protocol; the active one stays v2.
  assert.equal(active.schemaVersion, 2);
  assert.equal(active.protocolId, "accepted-segment-change-review-comparison.v2");
  assert.notEqual(v3.protocolId, active.protocolId);

  // A usable-but-inactive protocol still builds a 16-request dry-run plan.
  const corpus = await loadGoldCorpus();
  const plan = buildDryRunPlan(corpus, v3);
  assert.equal(plan.schemaVersion, 3);
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.requests.length, 16);
});
