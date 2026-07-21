import assert from "node:assert/strict";
import test from "node:test";

import { loadGoldCorpus } from "../corpus.mjs";
import { evaluateComparison } from "../evaluator.mjs";
import { loadProtocol } from "../protocol.mjs";

test("scores every declared metric for a complete adjudicated result without provider access", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const comparison = comparisonRun([
    successfulResult(death, "old", 1, { reviewTimeMs: 40_000, promptCharacters: 8_000, latencyMs: 1_200, costUsd: 0.02 }),
    successfulResult(death, "new", 2, { reviewTimeMs: 20_000, promptCharacters: 6_000, latencyMs: 900, costUsd: 0.04 })
  ]);

  const evaluation = evaluateComparison(corpus, comparison, protocol);

  assert.equal(evaluation.requests.length, 2);
  assert.deepEqual(evaluation.requests[0].metrics, {
    recall: 1,
    precision: 1,
    retentionClassification: 1,
    invention: { count: 0, rate: 0 },
    empty: false,
    malformed: false,
    coverage: { uniqueDimensions: 6, completeness: 1, outcomeMatch: 1 },
    reviewTimeMs: 40_000,
    promptCharacters: 8_000,
    promptTokensEstimate: 2_000,
    latencyMs: 1_200,
    costUsd: 0.02
  });
  assert.deepEqual(evaluation.requests[0].floors, {
    completeDeclaredSourceInclusion: true,
    sixUniqueCoverageRows: true,
    zeroAutomaticWrites: true,
    zeroProjectStoreWrites: true,
    zeroInventedEstablishedItems: true,
    allSeededChangesAccounted: true,
    boundedRequestPolicy: true,
    passed: true
  });
  assert.deepEqual(evaluation.aggregate, {
    protocolPlanComplete: false,
    actualRequestCount: 2,
    actualCostUsd: 0.06,
    emptyFrequency: 0,
    malformedFrequency: 0,
    averages: {
      recall: 1,
      precision: 1,
      retentionClassification: 1,
      inventionRate: 0,
      coverageCompleteness: 1,
      coverageOutcomeMatch: 1,
      reviewTimeMs: 30_000,
      promptCharacters: 7_000,
      promptTokensEstimate: 1_750,
      latencyMs: 1_050,
      costUsd: 0.03
    },
    byWorkflow: {
      old: { requestCount: 1, totalCostUsd: 0.02 },
      new: { requestCount: 1, totalCostUsd: 0.04 }
    }
  });
  assert.equal(evaluation.deterministicFloorsPassed, false);
  assert.deepEqual(evaluation.stewardReceipt, comparison.stewardReceipt);
  assert.equal(evaluation.issueClosureIsGo, false);
});

test("passes the overall deterministic gate only for the exact 16-entry protocol matrix", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const requests = corpus.flatMap((fixture) => ["old", "new"].map((workflow) => ({ fixture, workflow })))
    .map(({ fixture, workflow }, index) => successfulResult(fixture, workflow, index + 1));

  const evaluation = evaluateComparison(corpus, comparisonRun(requests), protocol);

  assert.equal(evaluation.requests.length, 16);
  assert.equal(evaluation.aggregate.protocolPlanComplete, true);
  assert.equal(evaluation.deterministicFloorsPassed, true);
});

test("rejects protocol identity, contract, model, settings, segment-selection, or scope drift", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const driftCases = [
    ["protocolId", (run) => { run.protocolId = "drifted-protocol"; }],
    ["contract", (run) => { run.requests[0].provenance.contract = "drifted-contract"; }],
    ["model", (run) => { run.requests[0].provenance.model = "drifted-model"; }],
    ["settings", (run) => { run.requests[0].provenance.settings.temperature = 0.5; }],
    ["segmentSelection", (run) => { run.requests[0].provenance.segmentSelection = "older"; }],
    ["recordScope", (run) => { run.requests[0].provenance.recordScope = "whole_project"; }]
  ];

  for (const [label, mutate] of driftCases) {
    const run = comparisonRun([successfulResult(death, "old", 1)]);
    mutate(run);
    assert.throws(() => evaluateComparison(corpus, run, protocol), new RegExp(label));
  }
});

test("fails seeded and invented-established floors without weakening other deterministic accounting", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const result = successfulResult(death, "new", 1);
  result.findings = [
    {
      findingId: "invented-weather-1",
      disposition: "found",
      evidenceKeys: death.expectedSourceAccounting.evidenceKeys,
      contrastKeys: death.expectedSourceAccounting.contrastKeys,
      epistemicStatus: "established change",
      retentionHorizon: "no storage",
      invented: true
    }
  ];

  const [scored] = evaluateComparison(corpus, comparisonRun([result]), protocol).requests;

  assert.equal(scored.metrics.recall, 0);
  assert.equal(scored.metrics.precision, 0);
  assert.deepEqual(scored.metrics.invention, { count: 1, rate: 1 });
  assert.equal(scored.floors.zeroInventedEstablishedItems, false);
  assert.equal(scored.floors.allSeededChangesAccounted, false);
  assert.equal(scored.floors.completeDeclaredSourceInclusion, true);
  assert.equal(scored.floors.passed, false);
});

test("distinguishes a valid empty no-change result from malformed output", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const noChange = corpus.at(-1);
  const death = corpus[0];
  const empty = successfulResult(noChange, "new", 1);
  const malformed = successfulResult(death, "old", 2);
  malformed.status = "malformed";
  malformed.failure = { kind: "malformed-output", message: "Coverage could not be parsed." };
  malformed.findings = [];
  malformed.coverage = [];

  const evaluation = evaluateComparison(corpus, comparisonRun([empty, malformed]), protocol);

  assert.equal(evaluation.requests[0].metrics.empty, true);
  assert.equal(evaluation.requests[0].metrics.malformed, false);
  assert.equal(evaluation.requests[0].metrics.recall, 1);
  assert.equal(evaluation.requests[0].floors.passed, true);
  assert.equal(evaluation.requests[1].metrics.empty, false);
  assert.equal(evaluation.requests[1].metrics.malformed, true);
  assert.equal(evaluation.requests[1].floors.sixUniqueCoverageRows, false);
  assert.equal(evaluation.aggregate.emptyFrequency, 0.5);
  assert.equal(evaluation.aggregate.malformedFrequency, 0.5);
  assert.equal(evaluation.deterministicFloorsPassed, false);
});

test("quarantines findings and coverage from malformed or failed requests", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];

  for (const status of ["malformed", "failed"]) {
    const result = successfulResult(death, "old", 1);
    result.status = status;
    result.failure = { kind: `${status}-output`, message: "The response was quarantined." };
    result.findings[0].rawPrompt = "must not survive";
    result.coverage[0].status = "garbage";

    assert.throws(
      () => evaluateComparison(corpus, comparisonRun([result]), protocol),
      /must not retain findings or coverage/
    );
  }
});

test("fails complete-source accounting when a declared record is omitted", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const result = successfulResult(death, "old", 1);
  result.sourceAccounting = {
    ...result.sourceAccounting,
    wholeProjectRecordIds: result.sourceAccounting.wholeProjectRecordIds.slice(0, -1)
  };

  const [scored] = evaluateComparison(corpus, comparisonRun([result]), protocol).requests;

  assert.equal(scored.floors.completeDeclaredSourceInclusion, false);
  assert.equal(scored.floors.passed, false);
});

test("does not trust a seeded id or invented flag when citations leave the gold source boundary", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const result = successfulResult(death, "new", 1);
  result.findings[0].evidenceKeys = ["[SEG-FABRICATED]"];
  result.findings[0].contrastKeys = ["[ENTITY-STATUS-FABRICATED]"];
  result.findings[0].invented = false;

  const [scored] = evaluateComparison(corpus, comparisonRun([result]), protocol).requests;

  assert.equal(scored.metrics.recall, 0);
  assert.equal(scored.metrics.precision, 0);
  assert.deepEqual(scored.metrics.invention, { count: 1, rate: 1 });
  assert.equal(scored.floors.zeroInventedEstablishedItems, false);
  assert.equal(scored.floors.allSeededChangesAccounted, false);
  assert.equal(scored.floors.passed, false);
});

test("fails closed on duplicate finding ids before ratios can be inflated", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const result = successfulResult(death, "old", 1);
  result.findings.push(globalThis.structuredClone(result.findings[0]));

  assert.throws(
    () => evaluateComparison(corpus, comparisonRun([result]), protocol),
    /finding ids must be unique/
  );
});

test("fails closed on a coverage status outside the three-value contract", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const result = successfulResult(death, "new", 1);
  result.coverage[0].status = "garbage";

  assert.throws(
    () => evaluateComparison(corpus, comparisonRun([result]), protocol),
    /coverage status/
  );
});

test("rejects undeclared fields on every captured surface before cloning durable output", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const mutations = [
    (run) => { run.rawPrompt = "must not survive"; },
    (run) => { run.requests[0].rawResponse = "must not survive"; },
    (run) => { run.requests[0].provenance.apiKey = "must not survive"; },
    (run) => { run.requests[0].provenance.settings.seed = 42; },
    (run) => { run.requests[0].sourceAccounting.privatePayload = "must not survive"; },
    (run) => { run.requests[0].findings[0].rawModelItem = "must not survive"; },
    (run) => { run.requests[0].coverage[0].rawReason = "must not survive"; },
    (run) => { run.requests[0].requestPolicy.fallbackModel = "must not survive"; },
    (run) => { run.requests[0].writes.detail = "must not survive"; },
    (run) => { run.requests[0].measurements.prompt = "must not survive"; },
    (run) => { run.stewardReceipt.privateNote = "must not survive"; }
  ];

  for (const mutate of mutations) {
    const run = comparisonRun([successfulResult(death, "old", 1)]);
    mutate(run);
    assert.throws(
      () => evaluateComparison(corpus, run, protocol),
      /undeclared field/
    );
  }
});

test("rejects captured values that violate the durable result schema", async () => {
  const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
  const death = corpus[0];
  const mutations = [
    (run) => { run.requests[0].provenance.startedAt = "not-a-date"; },
    (run) => { run.requests[0].provenance.completedAt = "also-not-a-date"; },
    (run) => { run.requests[0].provenance.startedAt = "2026-02-31T10:00:00.000Z"; },
    (run) => { run.requests[0].sourceAccounting.acceptedSegmentId = ""; },
    (run) => { run.requests[0].sourceAccounting.acceptedSegmentSequence = "not-an-integer"; },
    (run) => { run.requests[0].sourceAccounting.generationBriefFieldCount = 18; },
    ...[
      "activeWorkingSetRecordIds",
      "wholeProjectRecordIds",
      "evidenceKeys",
      "contrastKeys",
      "secretRecordIds"
    ].map((field) => (run) => { run.requests[0].sourceAccounting[field] = [1]; }),
    (run) => {
      run.stewardReceipt = {
        status: "recorded",
        steward: "comparison steward",
        decision: "NO-GO",
        recordedAt: "not-a-date",
        rationale: "Schema validation must fail first."
      };
    }
  ];

  for (const mutate of mutations) {
    const run = comparisonRun([successfulResult(death, "old", 1)]);
    mutate(run);
    assert.throws(
      () => evaluateComparison(corpus, run, protocol),
      /date-time|source accounting|must be a nonblank string|must contain only nonblank strings/
    );
  }
});

function comparisonRun(requests) {
  return {
    schemaVersion: 1,
    protocolId: "accepted-segment-change-review-comparison.v1",
    issueClosureIsGo: false,
    requests,
    stewardReceipt: {
      status: "not-recorded",
      steward: null,
      decision: null,
      recordedAt: null,
      rationale: null
    }
  };
}

function successfulResult(fixture, workflow, requestOrdinal, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `request-${String(requestOrdinal).padStart(2, "0")}-${workflow}-${fixture.caseId}`,
    requestOrdinal,
    caseId: fixture.caseId,
    workflow,
    provenance: {
      contract: workflow === "old" ? "segment_reconciliation.v1" : "accepted_segment_change_review.v1",
      model: "anthropic/claude-sonnet-4",
      settings: { temperature: 0, maxOutputTokens: 4_096, topP: 1 },
      segmentSelection: "latest",
      recordScope: "active_working_set",
      startedAt: "2026-07-21T10:00:00.000Z",
      completedAt: "2026-07-21T10:00:01.000Z",
      sourceFingerprint: "a".repeat(64),
      promptSha256: "b".repeat(64)
    },
    status: "completed",
    failure: null,
    sourceAccounting: globalThis.structuredClone(fixture.expectedSourceAccounting),
    findings: fixture.adjudication.findings.map((finding) => ({
      findingId: finding.findingId,
      disposition: "found",
      evidenceKeys: finding.evidenceKeys,
      contrastKeys: finding.contrastKeys,
      epistemicStatus: finding.epistemicStatus,
      retentionHorizon: finding.retentionHorizon,
      invented: false
    })),
    coverage: globalThis.structuredClone(fixture.adjudication.coverage),
    requestPolicy: {
      retryCount: 0,
      fallbackUsed: false,
      repairCallUsed: false,
      substitutionUsed: false
    },
    writes: { automatic: 0, projectStore: 0 },
    measurements: {
      reviewTimeMs: overrides.reviewTimeMs ?? 10_000,
      promptCharacters: overrides.promptCharacters ?? 4_000,
      promptTokensEstimate: (overrides.promptCharacters ?? 4_000) / 4,
      latencyMs: overrides.latencyMs ?? 1_000,
      inputTokens: 1_000,
      outputTokens: 200,
      costUsd: overrides.costUsd ?? 0.01
    }
  };
}
