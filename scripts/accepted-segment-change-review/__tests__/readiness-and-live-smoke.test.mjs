import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadGoldCorpus } from "../corpus.mjs";
import { buildLiveSmokePlan, loadLiveSmokeProtocol, validateLiveSmokeProtocol } from "../live-smoke.mjs";
import { COMPARISON_ACTIVATION_AUTHORITY } from "../protocol.mjs";
import { buildCandidateOutput, runReadiness } from "../readiness.mjs";

const OLD_PROMPT_PATTERN = /segment[_-]reconciliation/i;

test("readiness bar passes over the eight adjudicated gold cases with no provider call or store write", async () => {
  const result = await runReadiness();

  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
  assert.equal(result.cases.length, 8);
  assert.equal(result.providerCallsExecuted, 0);
  assert.equal(result.automaticWrites, 0);
  assert.equal(result.projectStoreWrites, 0);
  assert.equal(result.oldPromptRequested, false);
  assert.equal(result.outputContract, "accepted_segment_change_review.v2");
  for (const entry of result.cases) {
    assert.equal(entry.parsedValid, true, `${entry.caseId} parses valid`);
    assert.equal(entry.sixCoverageRows, true, `${entry.caseId} has six coverage rows`);
    assert.equal(entry.completeSourceAccounting, true, `${entry.caseId} accounts for its source`);
    assert.equal(entry.seededChangesAccounted, true, `${entry.caseId} accounts for seeded changes`);
    assert.equal(entry.zeroInventedEstablished, true, `${entry.caseId} invents no established item`);
  }
});

test("readiness bar fails closed when an adjudicated established excerpt is not grounded in a cited span", async () => {
  const corpus = globalThis.structuredClone(await loadGoldCorpus());
  const death = corpus.find((fixture) => fixture.caseId === "death");
  death.adjudication.findings[0].evidenceExcerpt = "the moon rose over harbor";

  const result = await runReadiness(corpus);

  assert.equal(result.passed, false);
  assert.ok(result.failures.some((reason) => reason.startsWith("death:")));
  const deathCase = result.cases.find((entry) => entry.caseId === "death");
  assert.equal(deathCase.parsedValid, false);
  assert.equal(deathCase.reasonCode, "invalid-evidence-excerpt");
});

test("buildCandidateOutput emits sequential ids, the readable statement, and the bounded excerpt", async () => {
  const corpus = await loadGoldCorpus();
  const death = corpus.find((fixture) => fixture.caseId === "death");
  const output = buildCandidateOutput(death);

  assert.equal(output.contract, "accepted_segment_change_review.v2");
  assert.equal(output.items[0].id, "ITEM-001");
  assert.equal(output.items[0].change_statement, death.adjudication.findings[0].summary);
  assert.equal(output.items[0].evidence_excerpt, death.adjudication.findings[0].evidenceExcerpt);
  assert.notEqual(output.items[0].change_statement, output.items[0].evidence_excerpt);
});

test("live-smoke protocol is prepared new-candidate-only with an eight-request ceiling and no execution", async () => {
  const corpus = await loadGoldCorpus();
  const protocol = await loadLiveSmokeProtocol();
  const plan = buildLiveSmokePlan(corpus, protocol);

  assert.equal(protocol.protocolId, "accepted-segment-change-review-live-smoke.v1");
  assert.equal(protocol.workflowContract, "accepted_segment_change_review.v2");
  assert.equal(protocol.completionBoundary.executionAuthorized, false);
  assert.equal(plan.requests.length, 8);
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.providerCallsExecuted, 0);
  assert.equal(plan.oldPromptRequests, 0);
  assert.equal(plan.maximumProviderRequestsForLaterApprovedRun, 8);
  assert.ok(plan.requests.every((request) => request.workflow === "new"));
  assert.ok(plan.requests.every((request) => request.requestPolicy.oldPromptRequested === false));
});

test("live-smoke protocol rejects raised ceilings, authorized execution, or an old-prompt reference", () => {
  const base = () => ({
    schemaVersion: 1,
    protocolId: "accepted-segment-change-review-live-smoke.v1",
    candidate: "new-candidate-only",
    purpose: "test",
    caseOrder: [
      "death",
      "injury",
      "location-change",
      "custody-change",
      "clock-threshold-crossing",
      "commitment-change",
      "secret-disclosure",
      "no-change"
    ],
    workflowContract: "accepted_segment_change_review.v2",
    sharedEnvelope: {
      model: "anthropic/claude-sonnet-4.6",
      settings: { temperature: 0, maxOutputTokens: 4096, topP: 1 },
      segmentSelection: "latest",
      recordScope: "active_working_set"
    },
    routingEnvelope: {
      responseFormat: "json_schema",
      strictJsonSchema: true,
      requireParameters: true,
      allowFallbacks: false,
      toolChoice: "none",
      requiredCapabilities: [
        "response_format",
        "structured_outputs",
        "temperature",
        "top_p",
        "max_tokens|max_completion_tokens"
      ]
    },
    requestPolicy: {
      maximumProviderRequests: 8,
      requestsPerCase: 1,
      automaticRetries: 0,
      fallbackRequests: 0,
      repairCalls: 0,
      toolCalls: 0,
      unapprovedSubstitutions: "prohibited",
      oldPromptRequests: 0
    },
    completionBoundary: {
      executionAuthorized: false,
      providerCallsExecuted: 0,
      issueClosureIsGo: false,
      liveExecutionOwner: "GitHub issue #148"
    }
  });

  const raisedCeiling = base();
  raisedCeiling.requestPolicy.maximumProviderRequests = 9;
  assert.throws(() => validateLiveSmokeProtocol(raisedCeiling), /maximumProviderRequests must be exactly 8/);

  const authorized = base();
  authorized.completionBoundary.executionAuthorized = true;
  assert.throws(() => validateLiveSmokeProtocol(authorized), /executionAuthorized must remain false/);

  const oldPrompt = base();
  oldPrompt.purpose = "compare against segment_reconciliation.v1";
  assert.throws(() => validateLiveSmokeProtocol(oldPrompt), /must not reference the retired Segment Reconciliation prompt/);

  const oldPromptRequest = base();
  oldPromptRequest.requestPolicy.oldPromptRequests = 1;
  assert.throws(() => validateLiveSmokeProtocol(oldPromptRequest), /oldPromptRequests must be 0/);
});

test("the readiness bar and live-smoke plan never require the old Segment Reconciliation prompt", async () => {
  const readinessSource = await readFile(new URL("../readiness.mjs", import.meta.url), "utf8");
  const liveSmokeSource = await readFile(new URL("../live-smoke.mjs", import.meta.url), "utf8");
  const liveSmokeProtocolSource = await readFile(new URL("../live-smoke.v1.json", import.meta.url), "utf8");

  // The one allowed occurrence is the explicit guard pattern in live-smoke.mjs.
  assert.doesNotMatch(readinessSource, OLD_PROMPT_PATTERN);
  assert.doesNotMatch(liveSmokeProtocolSource, OLD_PROMPT_PATTERN);
  const guardStripped = liveSmokeSource.replace(/OLD_PROMPT_PATTERN[^\n]*\n/g, "");
  assert.doesNotMatch(guardStripped, OLD_PROMPT_PATTERN);

  assert.equal(COMPARISON_ACTIVATION_AUTHORITY.status, "retired-as-activation-authority");
  assert.equal(COMPARISON_ACTIVATION_AUTHORITY.historicalEvidenceOnly, true);
});
