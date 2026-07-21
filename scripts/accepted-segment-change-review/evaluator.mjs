import { CHANGE_REVIEW_COVERAGE_DIMENSIONS, GOLD_CASE_ORDER } from "./corpus.mjs";
import { validateProtocol } from "./protocol.mjs";

const RESULT_STATUSES = new Set(["completed", "malformed", "failed"]);
const COVERAGE_STATUSES = new Set([
  "changes found",
  "checked - no relevant change",
  "uncertain"
]);
const FINDING_DISPOSITIONS = new Set(["found", "uncertain"]);
const EPISTEMIC_STATUSES = new Set([
  "established change",
  "interpretation requiring author judgment"
]);
const RETENTION_HORIZONS = new Set([
  "durable record candidate",
  "next-brief-only",
  "no storage",
  "author decision required"
]);

export function evaluateComparison(corpus, comparisonRun, protocol) {
  validateComparisonRun(comparisonRun, protocol);
  const fixturesById = new Map(corpus.map((fixture) => [fixture.caseId, fixture]));
  const perRequest = comparisonRun.requests.map((result) => {
    const fixture = fixturesById.get(result.caseId);
    if (!fixture) {
      throw new Error(`Unknown comparison case: ${String(result.caseId)}.`);
    }
    return scoreRequest(fixture, result, comparisonRun.requests.length);
  });
  const protocolPlanComplete = isProtocolPlanComplete(comparisonRun.requests);
  const aggregate = aggregateScores(perRequest, protocolPlanComplete);

  return {
    schemaVersion: comparisonRun.schemaVersion,
    protocolId: comparisonRun.protocolId,
    requests: perRequest,
    aggregate,
    deterministicFloorsPassed:
      protocolPlanComplete && perRequest.every((request) => request.floors.passed),
    stewardReceipt: globalThis.structuredClone(comparisonRun.stewardReceipt),
    issueClosureIsGo: false
  };
}

export function validateComparisonRun(comparisonRun, protocol) {
  validateProtocol(protocol);
  requireObject(comparisonRun, "comparison run");
  requireExactKeys(
    comparisonRun,
    ["schemaVersion", "protocolId", "issueClosureIsGo", "requests", "stewardReceipt"],
    "comparison run"
  );
  if (comparisonRun.schemaVersion !== protocol.schemaVersion) {
    throw new Error(`Comparison run schemaVersion must be ${protocol.schemaVersion} to match the pinned protocol.`);
  }
  requireString(comparisonRun.protocolId, "comparison protocol id");
  if (comparisonRun.protocolId !== protocol.protocolId) {
    throw new Error("Comparison protocolId does not match the pinned protocol.");
  }
  if (comparisonRun.issueClosureIsGo !== false) {
    throw new Error("issueClosureIsGo must remain false; closure is not a steward decision.");
  }

  const requests = requireArray(comparisonRun.requests, "comparison requests");
  if (requests.length > 16) {
    throw new Error("Comparison run exceeds the 16-request ceiling.");
  }
  const requestIds = [];
  for (const result of requests) {
    validateRequestResult(result, protocol);
    requestIds.push(result.requestId);
  }
  requireUnique(requestIds, "comparison request ids");
  validateStewardReceipt(comparisonRun.stewardReceipt);
  return comparisonRun;
}

function validateRequestResult(result, protocol) {
  requireObject(result, "request result");
  requireExactKeys(
    result,
    [
      "schemaVersion",
      "requestId",
      "requestOrdinal",
      "caseId",
      "workflow",
      "provenance",
      "status",
      "failure",
      "sourceAccounting",
      "findings",
      "coverage",
      "requestPolicy",
      "writes",
      "measurements"
    ],
    "request result"
  );
  if (result.schemaVersion !== protocol.schemaVersion) {
    throw new Error(`Request result schemaVersion must be ${protocol.schemaVersion} to match the pinned protocol.`);
  }
  requireString(result.requestId, "request id");
  requireIntegerInRange(result.requestOrdinal, 1, 16, "request ordinal");
  requireString(result.caseId, "request caseId");
  if (result.workflow !== "old" && result.workflow !== "new") {
    throw new Error("Request workflow must be old or new.");
  }
  if (!RESULT_STATUSES.has(result.status)) {
    throw new Error("Request status must be completed, malformed, or failed.");
  }

  validateProvenance(result.provenance, result.workflow, protocol);
  validateSourceAccounting(result.sourceAccounting, result.requestId);
  requireArray(result.findings, `${result.requestId} findings`);
  requireArray(result.coverage, `${result.requestId} coverage`);
  validateRequestPolicy(result.requestPolicy, result.requestId);
  validateWrites(result.writes, result.requestId);
  validateMeasurements(result.measurements, result.requestId);

  if (result.status === "completed") {
    if (result.failure !== null) {
      throw new Error(`${result.requestId}: a completed result must have failure null.`);
    }
    result.findings.forEach((finding) => validateFinding(finding, result.requestId));
    requireUnique(
      result.findings.map((finding) => finding.findingId),
      `${result.requestId} finding ids`
    );
    result.coverage.forEach((row) => validateCoverageRow(row, result.requestId));
  } else {
    if (result.findings.length > 0 || result.coverage.length > 0) {
      throw new Error(
        `${result.requestId}: malformed or failed results must not retain findings or coverage.`
      );
    }
    requireObject(result.failure, `${result.requestId} failure`);
    requireExactKeys(result.failure, ["kind", "message"], `${result.requestId} failure`);
    requireString(result.failure.kind, `${result.requestId} failure kind`);
    requireString(result.failure.message, `${result.requestId} failure message`);
  }
}

function validateProvenance(provenance, workflow, protocol) {
  requireObject(provenance, "request provenance");
  requireExactKeys(
    provenance,
    [
      "contract",
      "model",
      "settings",
      "segmentSelection",
      "recordScope",
      "startedAt",
      "completedAt",
      "sourceFingerprint",
      "promptSha256"
    ],
    "request provenance"
  );
  requireString(provenance.contract, "provenance contract");
  if (provenance.contract !== protocol.workflowContracts[workflow]) {
    throw new Error("Provenance contract does not match the pinned workflow contract.");
  }
  requireString(provenance.model, "provenance model");
  if (provenance.model !== protocol.sharedEnvelope.model) {
    throw new Error("Provenance model does not match the pinned protocol model.");
  }
  requireObject(provenance.settings, "provenance settings");
  requireExactKeys(
    provenance.settings,
    ["temperature", "maxOutputTokens", "topP"],
    "provenance settings"
  );
  requireFiniteNonnegative(provenance.settings.temperature, "provenance temperature");
  requireFiniteNonnegative(provenance.settings.maxOutputTokens, "provenance maxOutputTokens");
  requireFiniteNonnegative(provenance.settings.topP, "provenance topP");
  if (!deepEqual(provenance.settings, protocol.sharedEnvelope.settings)) {
    throw new Error("Provenance settings do not match the pinned protocol settings.");
  }
  requireString(provenance.segmentSelection, "provenance segmentSelection");
  if (provenance.segmentSelection !== protocol.sharedEnvelope.segmentSelection) {
    throw new Error("Provenance segmentSelection does not match the pinned protocol.");
  }
  requireString(provenance.recordScope, "provenance recordScope");
  if (provenance.recordScope !== protocol.sharedEnvelope.recordScope) {
    throw new Error("Provenance recordScope does not match the pinned protocol.");
  }
  requireDateTime(provenance.startedAt, "provenance startedAt");
  requireDateTime(provenance.completedAt, "provenance completedAt");
  requireSha256(provenance.sourceFingerprint, "provenance sourceFingerprint");
  requireSha256(provenance.promptSha256, "provenance promptSha256");
}

function validateSourceAccounting(sourceAccounting, requestId) {
  const label = `${requestId} source accounting`;
  requireObject(sourceAccounting, label);
  requireExactKeys(
    sourceAccounting,
    [
      "acceptedSegmentId",
      "acceptedSegmentSequence",
      "generationBriefFieldCount",
      "activeWorkingSetRecordIds",
      "wholeProjectRecordIds",
      "evidenceKeys",
      "contrastKeys",
      "secretRecordIds"
    ],
    label
  );
  requireString(sourceAccounting.acceptedSegmentId, `${label} acceptedSegmentId`);
  requireNonnegativeInteger(
    sourceAccounting.acceptedSegmentSequence,
    `${label} acceptedSegmentSequence`
  );
  if (sourceAccounting.generationBriefFieldCount !== 19) {
    throw new Error(`${label} generationBriefFieldCount must be 19.`);
  }
  for (const field of [
    "activeWorkingSetRecordIds",
    "wholeProjectRecordIds",
    "evidenceKeys",
    "contrastKeys",
    "secretRecordIds"
  ]) {
    requireSchemaStringArray(sourceAccounting[field], `${label} ${field}`);
  }
}

function validateRequestPolicy(policy, requestId) {
  requireObject(policy, `${requestId} request policy`);
  requireExactKeys(
    policy,
    ["retryCount", "fallbackUsed", "repairCallUsed", "substitutionUsed"],
    `${requestId} request policy`
  );
  requireFiniteNonnegative(policy.retryCount, `${requestId} retryCount`);
  for (const field of ["fallbackUsed", "repairCallUsed", "substitutionUsed"]) {
    if (typeof policy[field] !== "boolean") {
      throw new Error(`${requestId}: ${field} must be boolean.`);
    }
  }
}

function validateWrites(writes, requestId) {
  requireObject(writes, `${requestId} writes`);
  requireExactKeys(writes, ["automatic", "projectStore"], `${requestId} writes`);
  requireFiniteNonnegative(writes.automatic, `${requestId} automatic writes`);
  requireFiniteNonnegative(writes.projectStore, `${requestId} project-store writes`);
}

function validateMeasurements(measurements, requestId) {
  requireObject(measurements, `${requestId} measurements`);
  requireExactKeys(
    measurements,
    [
      "reviewTimeMs",
      "promptCharacters",
      "promptTokensEstimate",
      "latencyMs",
      "inputTokens",
      "outputTokens",
      "costUsd"
    ],
    `${requestId} measurements`
  );
  for (const field of [
    "reviewTimeMs",
    "promptCharacters",
    "promptTokensEstimate",
    "latencyMs",
    "inputTokens",
    "outputTokens",
    "costUsd"
  ]) {
    requireFiniteNonnegative(measurements[field], `${requestId} ${field}`);
  }
}

function validateFinding(finding, requestId) {
  requireObject(finding, `${requestId} finding`);
  requireExactKeys(
    finding,
    [
      "findingId",
      "disposition",
      "evidenceKeys",
      "contrastKeys",
      "epistemicStatus",
      "retentionHorizon",
      "invented"
    ],
    `${requestId} finding`
  );
  requireString(finding.findingId, `${requestId} findingId`);
  if (!FINDING_DISPOSITIONS.has(finding.disposition)) {
    throw new Error(`${requestId}: finding disposition must be found or uncertain.`);
  }
  requireStringArray(finding.evidenceKeys, `${requestId} finding evidenceKeys`);
  requireStringArray(finding.contrastKeys, `${requestId} finding contrastKeys`);
  if (!EPISTEMIC_STATUSES.has(finding.epistemicStatus)) {
    throw new Error(`${requestId}: invalid finding epistemicStatus.`);
  }
  if (!RETENTION_HORIZONS.has(finding.retentionHorizon)) {
    throw new Error(`${requestId}: invalid finding retentionHorizon.`);
  }
  if (typeof finding.invented !== "boolean") {
    throw new Error(`${requestId}: finding invented must be boolean.`);
  }
}

function validateCoverageRow(row, requestId) {
  requireObject(row, `${requestId} coverage row`);
  requireExactKeys(row, ["dimension", "status", "reason"], `${requestId} coverage row`);
  requireString(row.dimension, `${requestId} coverage dimension`);
  requireString(row.status, `${requestId} coverage status`);
  if (!COVERAGE_STATUSES.has(row.status)) {
    throw new Error(`${requestId}: coverage status is outside the three-value contract.`);
  }
  requireString(row.reason, `${requestId} coverage reason`);
}

function validateStewardReceipt(receipt) {
  requireObject(receipt, "steward receipt");
  requireExactKeys(
    receipt,
    ["status", "steward", "decision", "recordedAt", "rationale"],
    "steward receipt"
  );
  if (receipt.status === "not-recorded") {
    for (const field of ["steward", "decision", "recordedAt", "rationale"]) {
      if (receipt[field] !== null) {
        throw new Error(`Unrecorded steward receipt must keep ${field} null.`);
      }
    }
    return;
  }
  if (receipt.status !== "recorded") {
    throw new Error("Steward receipt status must be not-recorded or recorded.");
  }
  requireString(receipt.steward, "steward receipt steward");
  if (receipt.decision !== "GO" && receipt.decision !== "NO-GO") {
    throw new Error("Recorded steward decision must be GO or NO-GO.");
  }
  requireDateTime(receipt.recordedAt, "steward receipt recordedAt");
  requireString(receipt.rationale, "steward receipt rationale");
}

function scoreRequest(fixture, result, requestCount) {
  const malformed = result.status === "malformed";
  const completed = result.status === "completed";
  const expectedFindings = new Map(
    fixture.adjudication.findings.map((finding) => [finding.findingId, finding])
  );
  const reportedFindings = completed ? result.findings : [];
  const correctFindings = reportedFindings.filter((finding) => {
    const expected = expectedFindings.get(finding.findingId);
    return expected && findingMatchesSeed(finding, expected);
  });
  const accountedIds = new Set(
    correctFindings.map((finding) => finding.findingId)
  );
  const inventedFindings = reportedFindings.filter((finding) => {
    const expected = expectedFindings.get(finding.findingId);
    return finding.invented ||
      !expected ||
      !citationsResolve(finding, fixture.expectedSourceAccounting) ||
      (finding.epistemicStatus === "established change" &&
        expected.epistemicStatus !== "established change");
  });
  const retentionMatches = reportedFindings.filter((finding) => {
    const expected = expectedFindings.get(finding.findingId);
    return expected &&
      findingMatchesSeed(finding, expected) &&
      expected.retentionHorizon === finding.retentionHorizon;
  }).length;
  const coverage = coverageMetrics(fixture, completed ? result.coverage : []);
  const completeDeclaredSourceInclusion = deepEqual(
    result.sourceAccounting,
    fixture.expectedSourceAccounting
  );
  const sixUniqueCoverageRows =
    completed &&
    result.coverage.length === 6 &&
    deepEqual(
      result.coverage.map((row) => row.dimension),
      CHANGE_REVIEW_COVERAGE_DIMENSIONS
    );
  const zeroInventedEstablishedItems = !inventedFindings.some(
    (finding) => finding.epistemicStatus === "established change"
  );
  const allSeededChangesAccounted = accountedIds.size === expectedFindings.size;
  const boundedRequestPolicy =
    requestCount <= 16 &&
    result.requestPolicy.retryCount === 0 &&
    result.requestPolicy.fallbackUsed === false &&
    result.requestPolicy.repairCallUsed === false &&
    result.requestPolicy.substitutionUsed === false;
  const floors = {
    completeDeclaredSourceInclusion,
    sixUniqueCoverageRows,
    zeroAutomaticWrites: result.writes.automatic === 0,
    zeroProjectStoreWrites: result.writes.projectStore === 0,
    zeroInventedEstablishedItems,
    allSeededChangesAccounted,
    boundedRequestPolicy
  };

  return {
    requestId: result.requestId,
    requestOrdinal: result.requestOrdinal,
    caseId: result.caseId,
    workflow: result.workflow,
    provenance: globalThis.structuredClone(result.provenance),
    status: result.status,
    failure: globalThis.structuredClone(result.failure),
    sourceAccounting: globalThis.structuredClone(result.sourceAccounting),
    findings: globalThis.structuredClone(result.findings),
    coverage: globalThis.structuredClone(result.coverage),
    requestPolicy: globalThis.structuredClone(result.requestPolicy),
    writes: globalThis.structuredClone(result.writes),
    measurements: globalThis.structuredClone(result.measurements),
    metrics: {
      recall: ratio(accountedIds.size, expectedFindings.size, expectedFindings.size === 0 ? 1 : 0),
      precision: ratio(
        correctFindings.length,
        reportedFindings.length,
        expectedFindings.size === 0 ? 1 : 0
      ),
      retentionClassification: ratio(
        retentionMatches,
        expectedFindings.size,
        expectedFindings.size === 0 ? 1 : 0
      ),
      invention: {
        count: inventedFindings.length,
        rate: ratio(inventedFindings.length, reportedFindings.length, 0)
      },
      empty: completed && reportedFindings.length === 0,
      malformed,
      coverage,
      reviewTimeMs: result.measurements.reviewTimeMs,
      promptCharacters: result.measurements.promptCharacters,
      promptTokensEstimate: result.measurements.promptTokensEstimate,
      latencyMs: result.measurements.latencyMs,
      costUsd: result.measurements.costUsd
    },
    floors: {
      ...floors,
      passed: Object.values(floors).every(Boolean)
    }
  };
}

function findingMatchesSeed(finding, expected) {
  return FINDING_DISPOSITIONS.has(finding.disposition) &&
    deepEqual(finding.evidenceKeys, expected.evidenceKeys) &&
    deepEqual(finding.contrastKeys, expected.contrastKeys) &&
    finding.epistemicStatus === expected.epistemicStatus;
}

function citationsResolve(finding, sourceAccounting) {
  return finding.evidenceKeys.every((key) => sourceAccounting.evidenceKeys.includes(key)) &&
    finding.contrastKeys.every((key) => sourceAccounting.contrastKeys.includes(key));
}

function coverageMetrics(fixture, coverageRows) {
  const rowsByDimension = new Map();
  for (const row of coverageRows) {
    if (!rowsByDimension.has(row.dimension)) {
      rowsByDimension.set(row.dimension, row);
    }
  }
  const expectedByDimension = new Map(
    fixture.adjudication.coverage.map((row) => [row.dimension, row])
  );
  const recognizedDimensions = CHANGE_REVIEW_COVERAGE_DIMENSIONS.filter((dimension) =>
    rowsByDimension.has(dimension)
  );
  const matchedOutcomes = recognizedDimensions.filter(
    (dimension) => rowsByDimension.get(dimension).status === expectedByDimension.get(dimension).status
  ).length;

  return {
    uniqueDimensions: rowsByDimension.size,
    completeness: ratio(recognizedDimensions.length, 6, 0),
    outcomeMatch: ratio(matchedOutcomes, 6, 0)
  };
}

function aggregateScores(perRequest, protocolPlanComplete) {
  const byWorkflow = {
    old: workflowAggregate(perRequest, "old"),
    new: workflowAggregate(perRequest, "new")
  };

  return {
    protocolPlanComplete,
    actualRequestCount: perRequest.length,
    actualCostUsd: sum(perRequest.map((request) => request.metrics.costUsd)),
    emptyFrequency: ratio(perRequest.filter((request) => request.metrics.empty).length, perRequest.length, 0),
    malformedFrequency: ratio(
      perRequest.filter((request) => request.metrics.malformed).length,
      perRequest.length,
      0
    ),
    averages: {
      recall: average(perRequest.map((request) => request.metrics.recall)),
      precision: average(perRequest.map((request) => request.metrics.precision)),
      retentionClassification: average(
        perRequest.map((request) => request.metrics.retentionClassification)
      ),
      inventionRate: average(perRequest.map((request) => request.metrics.invention.rate)),
      coverageCompleteness: average(
        perRequest.map((request) => request.metrics.coverage.completeness)
      ),
      coverageOutcomeMatch: average(
        perRequest.map((request) => request.metrics.coverage.outcomeMatch)
      ),
      reviewTimeMs: average(perRequest.map((request) => request.metrics.reviewTimeMs)),
      promptCharacters: average(perRequest.map((request) => request.metrics.promptCharacters)),
      promptTokensEstimate: average(
        perRequest.map((request) => request.metrics.promptTokensEstimate)
      ),
      latencyMs: average(perRequest.map((request) => request.metrics.latencyMs)),
      costUsd: average(perRequest.map((request) => request.metrics.costUsd))
    },
    byWorkflow
  };
}

function isProtocolPlanComplete(requests) {
  const expected = GOLD_CASE_ORDER.flatMap((caseId) =>
    ["old", "new"].map((workflow) => ({ caseId, workflow }))
  );

  return requests.length === expected.length && requests.every((request, index) => {
    const requestOrdinal = index + 1;
    const expectedRequest = expected[index];
    return request.requestOrdinal === requestOrdinal &&
      request.caseId === expectedRequest.caseId &&
      request.workflow === expectedRequest.workflow &&
      request.requestId ===
        `request-${String(requestOrdinal).padStart(2, "0")}-${request.workflow}-${request.caseId}`;
  });
}

function workflowAggregate(perRequest, workflow) {
  const requests = perRequest.filter((request) => request.workflow === workflow);
  return {
    requestCount: requests.length,
    totalCostUsd: sum(requests.map((request) => request.metrics.costUsd))
  };
}

function ratio(numerator, denominator, emptyValue) {
  return denominator === 0 ? emptyValue : round(numerator / denominator);
}

function average(values) {
  return values.length === 0 ? 0 : round(sum(values) / values.length);
}

function sum(values) {
  return round(values.reduce((total, value) => total + value, 0));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function requireExactKeys(value, expectedKeys, label) {
  const actualKeys = Object.keys(value);
  const undeclaredKeys = actualKeys.filter((key) => !expectedKeys.includes(key));
  if (undeclaredKeys.length > 0) {
    throw new Error(`${label} contains undeclared field(s): ${undeclaredKeys.join(", ")}.`);
  }
  const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));
  if (missingKeys.length > 0) {
    throw new Error(`${label} is missing required field(s): ${missingKeys.join(", ")}.`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a nonblank string.`);
  }
  return value;
}

function requireDateTime(value, label) {
  requireString(value, label);
  const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[Tt](?:[01]\d|2[0-3]):[0-5]\d:(?:[0-5]\d|60)(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (!match || day > daysInMonth[month - 1]) {
    throw new Error(`${label} must be an RFC 3339 date-time.`);
  }
}

function requireNonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
}

function requireStringArray(value, label) {
  requireArray(value, label);
  if (value.length === 0 || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new Error(`${label} must contain nonblank strings.`);
  }
}

function requireSchemaStringArray(value, label) {
  requireArray(value, label);
  if (value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new Error(`${label} must contain only nonblank strings.`);
  }
}

function requireFiniteNonnegative(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite nonnegative number.`);
  }
}

function requireIntegerInRange(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
}

function requireSha256(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${label} must be a 64-character hexadecimal SHA-256.`);
  }
}

function requireUnique(values, label) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique.`);
  }
}
