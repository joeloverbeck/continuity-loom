import assert from "node:assert/strict";
import test from "node:test";

import { loadGoldCorpus } from "../corpus.mjs";
import { buildDryRunPlan, loadProtocol, validateProtocol } from "../protocol.mjs";

test("pins one old and one new request for every case under one shared envelope", async () => {
  const corpus = await loadGoldCorpus();
  const protocol = await loadProtocol();
  const plan = buildDryRunPlan(corpus, protocol);

  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.protocolId, "accepted-segment-change-review-comparison.v1");
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.providerCallsExecuted, 0);
  assert.equal(plan.maximumProviderRequestsForLaterApprovedRun, 16);
  assert.equal(plan.requests.length, 16);
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
