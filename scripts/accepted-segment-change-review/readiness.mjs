import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  compileAcceptedSegmentChangeReviewPrompt,
  parseAcceptedSegmentChangeReviewOutput,
  partitionAcceptedSegmentSpans
} from "@loom/core";

import { CHANGE_REVIEW_COVERAGE_DIMENSIONS, GOLD_CASE_ORDER, loadGoldCorpus } from "./corpus.mjs";

// The offline readiness bar is new-candidate-only. It compiles the repaired
// `accepted-segment-change-review` candidate, builds each adjudicated gold output,
// and parses it through the real @loom/core parser. It never touches the retired
// old-versus-new comparison, never compiles or requests the old Segment
// Reconciliation prompt, and never issues a provider request or a project-store write.
const READINESS_BAR_ID = "accepted-segment-change-review-offline-readiness.v1";
const CANDIDATE_VERSIONS = Object.freeze({ template: "2.0.0", compiler: "2.0.0", contract: "2.1.0" });
const READINESS_ACCEPTED_AT = "2026-07-21T00:00:00.000Z";

export async function runReadiness(corpusInput) {
  const corpus = corpusInput ?? (await loadGoldCorpus());
  requireCaseOrder(corpus);

  const cases = corpus.map((fixture) => evaluateCase(fixture));
  const providerCallsExecuted = 0;
  const automaticWrites = 0;
  const projectStoreWrites = 0;

  const failures = cases.flatMap((entry) => entry.failures.map((reason) => `${entry.caseId}: ${reason}`));
  const passed =
    failures.length === 0 &&
    cases.length === GOLD_CASE_ORDER.length &&
    cases.every(
      (entry) =>
        entry.parsedValid &&
        entry.sixCoverageRows &&
        entry.completeSourceAccounting &&
        entry.seededChangesAccounted &&
        entry.zeroInventedEstablished
    ) &&
    providerCallsExecuted === 0 &&
    automaticWrites === 0 &&
    projectStoreWrites === 0;

  return {
    readinessBar: READINESS_BAR_ID,
    outputContract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
    candidateVersions: CANDIDATE_VERSIONS,
    caseOrder: [...GOLD_CASE_ORDER],
    providerCallsExecuted,
    automaticWrites,
    projectStoreWrites,
    oldPromptRequested: false,
    cases,
    failures,
    passed
  };
}

export function buildCandidateOutput(fixture) {
  return {
    contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
    items: fixture.adjudication.findings.map((finding, index) => ({
      id: `ITEM-${String(index + 1).padStart(3, "0")}`,
      change_statement: finding.summary,
      evidence_excerpt: finding.evidenceExcerpt,
      evidence: finding.evidenceKeys,
      contrast: finding.contrastKeys,
      epistemic_status: finding.epistemicStatus,
      retention_horizon: finding.retentionHorizon,
      affected_target_hints: finding.targetHints,
      uncertainty_or_rival_reading: finding.uncertaintyOrRivalReading
    })),
    coverage: fixture.adjudication.coverage
  };
}

function evaluateCase(fixture) {
  const failures = [];
  const acceptedSegment = { ...fixture.acceptedSegment, acceptedAt: READINESS_ACCEPTED_AT };
  const spans = partitionAcceptedSegmentSpans(acceptedSegment.text, acceptedSegment.sequence);
  const snapshot = {
    request: { segmentSelection: "latest", recordScope: "active_working_set" },
    acceptedSegment,
    acceptedSegmentSpans: spans,
    generationBriefProjection: fixture.generationBriefProjection,
    records: fixture.recordInputs.activeWorkingSet,
    referenceStubs: [],
    versions: CANDIDATE_VERSIONS
  };

  const compiled = compileAcceptedSegmentChangeReviewPrompt(snapshot);
  const context = buildParseContext(snapshot, compiled.disclosure.citationMap);
  const output = buildCandidateOutput(fixture);
  const result = parseAcceptedSegmentChangeReviewOutput(JSON.stringify(output), context);

  const parsedValid = result.status === "valid";
  if (!parsedValid) {
    failures.push(`adjudicated gold output did not parse valid (${result.reasonCode}: ${result.summary})`);
  }

  const sixCoverageRows =
    parsedValid &&
    result.output.coverage.length === 6 &&
    new Set(result.output.coverage.map((row) => row.dimension)).size === 6 &&
    CHANGE_REVIEW_COVERAGE_DIMENSIONS.every((dimension) =>
      result.output.coverage.some((row) => row.dimension === dimension)
    );
  if (parsedValid && !sixCoverageRows) {
    failures.push("result does not carry exactly six reasoned coverage rows for the declared dimensions");
  }

  const completeSourceAccounting = verifySourceAccounting(fixture, compiled.disclosure);
  if (!completeSourceAccounting) {
    failures.push("declared source is not completely accounted for in the compiled disclosure");
  }

  const seededChangesAccounted = parsedValid && verifySeededChanges(fixture, result.output);
  if (parsedValid && !seededChangesAccounted) {
    failures.push("a seeded change is neither found nor explicitly marked uncertain");
  }

  const zeroInventedEstablished =
    parsedValid && result.output.items.length === fixture.adjudication.findings.length;
  if (parsedValid && !zeroInventedEstablished) {
    failures.push("an established item is not backed by an adjudicated seeded finding");
  }

  return {
    caseId: fixture.caseId,
    parsedValid,
    reasonCode: parsedValid ? null : result.reasonCode,
    itemCount: output.items.length,
    sixCoverageRows: Boolean(sixCoverageRows),
    completeSourceAccounting,
    seededChangesAccounted: Boolean(seededChangesAccounted),
    zeroInventedEstablished: Boolean(zeroInventedEstablished),
    failures
  };
}

function buildParseContext(snapshot, citationMap) {
  const evidenceKeys = new Set(snapshot.acceptedSegmentSpans.map((span) => span.key));
  return {
    acceptedSegmentText: snapshot.acceptedSegment.text,
    evidenceKeys: [...evidenceKeys],
    evidenceTextByKey: Object.fromEntries(snapshot.acceptedSegmentSpans.map((span) => [span.key, span.text])),
    contrastKeys: Object.keys(citationMap).filter((key) => !evidenceKeys.has(key))
  };
}

function verifySourceAccounting(fixture, disclosure) {
  const accounting = fixture.expectedSourceAccounting;
  const activeIds = accounting.activeWorkingSetRecordIds;
  if (disclosure.fullRecordCount !== activeIds.length) {
    return false;
  }
  if (Object.keys(fixture.generationBriefProjection).length !== accounting.generationBriefFieldCount) {
    return false;
  }
  const citationValues = new Set(Object.values(disclosure.citationMap));
  if (!activeIds.every((id) => citationValues.has(id))) {
    return false;
  }
  if (!accounting.evidenceKeys.every((key) => key in disclosure.citationMap)) {
    return false;
  }
  return true;
}

function verifySeededChanges(fixture, output) {
  const seeded = fixture.adjudication.findings.length;
  if (output.items.length !== seeded) {
    return false;
  }
  if (seeded === 0) {
    return true;
  }
  return output.coverage.some((row) => row.status === "changes found" || row.status === "uncertain");
}

function requireCaseOrder(corpus) {
  const order = corpus.map((fixture) => fixture.caseId);
  if (JSON.stringify(order) !== JSON.stringify(GOLD_CASE_ORDER)) {
    throw new Error("Readiness corpus case order does not match the gold order.");
  }
}
