import { readFile } from "node:fs/promises";

export const GOLD_CASE_ORDER = Object.freeze([
  "death",
  "injury",
  "location-change",
  "custody-change",
  "clock-threshold-crossing",
  "commitment-change",
  "secret-disclosure",
  "no-change"
]);

export const CHANGE_REVIEW_BRIEF_FIELD_PATHS = Object.freeze([
  "current_authoritative_state.current_time",
  "current_authoritative_state.current_location",
  "current_authoritative_state.onstage_entities",
  "current_authoritative_state.immediate_situation_summary",
  "current_authoritative_state.offstage_pressuring_entities",
  "current_authoritative_state.positions",
  "current_authoritative_state.possessions",
  "current_authoritative_state.visible_conditions",
  "current_authoritative_state.environmental_conditions",
  "current_authoritative_state.entity_statuses",
  "current_authoritative_state.line_of_sight_and_visibility",
  "current_authoritative_state.pov_cannot_perceive_now",
  "current_authoritative_state.routes_and_exits",
  "current_authoritative_state.available_time",
  "current_authoritative_state.consent_or_force_conditions",
  "current_authoritative_state.current_locks",
  "immediate_handoff.recent_causal_context",
  "immediate_handoff.last_visible_moment",
  "immediate_handoff.begin_after"
]);

export const CHANGE_REVIEW_COVERAGE_DIMENSIONS = Object.freeze([
  "spatial/material/bodily state",
  "time/clocks/ongoing processes",
  "facts/knowledge/beliefs/secrets",
  "intentions/plans/commitments/promises/open pressures",
  "emotions/relationships",
  "immediate next-segment handoff"
]);

const FIXTURE_DIRECTORY = new URL(
  "../../packages/core/test/fixtures/accepted-segment-change-review/",
  import.meta.url
);

const COVERAGE_STATUSES = new Set([
  "changes found",
  "checked - no relevant change",
  "uncertain"
]);
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
const CREDENTIAL_PATTERN = /sk-or-[A-Za-z0-9_-]+|OPENROUTER_API_KEY|Bearer\s+[A-Za-z0-9._-]+/i;

export async function loadGoldCorpus() {
  const corpus = await Promise.all(
    GOLD_CASE_ORDER.map(async (caseId) => {
      const fixtureUrl = new URL(`${caseId}.json`, FIXTURE_DIRECTORY);
      let parsed;

      try {
        parsed = JSON.parse(await readFile(fixtureUrl, "utf8"));
      } catch (error) {
        throw new Error(`Unable to load gold case ${caseId}: ${errorMessage(error)}`, { cause: error });
      }

      return parsed;
    })
  );

  return validateGoldCorpus(corpus);
}

export function validateGoldCorpus(corpus) {
  requireArray(corpus, "gold corpus");
  const caseIds = corpus.map((fixture, index) => requireString(fixture?.caseId, `case ${index} id`));
  requireDeepEqual(caseIds, GOLD_CASE_ORDER, "gold corpus case order");

  for (const fixture of corpus) {
    validateFixture(fixture);
  }

  const serialized = JSON.stringify(corpus);
  if (CREDENTIAL_PATTERN.test(serialized)) {
    throw new Error("Gold corpus contains credential-shaped content.");
  }

  return corpus;
}

function validateFixture(fixture) {
  const caseId = requireString(fixture.caseId, "case id");
  if (fixture.schemaVersion !== 1) {
    throw new Error(`${caseId}: schemaVersion must be 1.`);
  }
  if (fixture.syntheticData !== true) {
    throw new Error(`${caseId}: syntheticData must be true.`);
  }
  if (!/synthetic/i.test(requireString(fixture.syntheticDataDisclosure, `${caseId} synthetic disclosure`))) {
    throw new Error(`${caseId}: syntheticDataDisclosure must visibly say synthetic.`);
  }

  validateAcceptedSegment(fixture.acceptedSegment, fixture.expectedSourceAccounting, caseId);
  validateBriefProjection(fixture.generationBriefProjection, caseId);
  validateRecordInputs(fixture.recordInputs, fixture.expectedSourceAccounting, caseId);
  validateAdjudication(fixture, caseId);
}

function validateAcceptedSegment(segment, accounting, caseId) {
  requireObject(segment, `${caseId} acceptedSegment`);
  if (segment.selection !== "latest") {
    throw new Error(`${caseId}: acceptedSegment.selection must be latest.`);
  }
  requireString(segment.id, `${caseId} accepted segment id`);
  requireNonnegativeInteger(segment.sequence, `${caseId} accepted segment sequence`);
  const text = requireString(segment.text, `${caseId} accepted segment text`);
  requireArray(segment.evidenceSpans, `${caseId} evidence spans`);
  if (segment.evidenceSpans.length === 0) {
    throw new Error(`${caseId}: evidence spans must not be empty.`);
  }

  const evidenceKeys = [];
  for (const span of segment.evidenceSpans) {
    const key = requireString(span?.key, `${caseId} evidence key`);
    const spanText = requireString(span?.text, `${caseId} evidence span text`);
    if (!text.includes(spanText)) {
      throw new Error(`${caseId}: evidence span ${key} does not resolve inside the complete accepted segment.`);
    }
    evidenceKeys.push(key);
  }
  requireUnique(evidenceKeys, `${caseId} evidence keys`);

  requireObject(accounting, `${caseId} expected source accounting`);
  requireDeepEqual(accounting.acceptedSegmentId, segment.id, `${caseId} accepted segment accounting id`);
  requireDeepEqual(accounting.acceptedSegmentSequence, segment.sequence, `${caseId} accepted segment accounting sequence`);
  requireDeepEqual(accounting.evidenceKeys, evidenceKeys, `${caseId} evidence key accounting`);
}

function validateBriefProjection(projection, caseId) {
  requireObject(projection, `${caseId} generation brief projection`);
  requireDeepEqual(
    Object.keys(projection),
    CHANGE_REVIEW_BRIEF_FIELD_PATHS,
    `${caseId} exact nineteen-field Generation Brief projection`
  );
}

function validateRecordInputs(recordInputs, accounting, caseId) {
  requireObject(recordInputs, `${caseId} record inputs`);
  const activeWorkingSet = requireArray(recordInputs.activeWorkingSet, `${caseId} Active Working Set records`);
  const wholeProject = requireArray(recordInputs.wholeProject, `${caseId} Whole Project records`);
  activeWorkingSet.forEach((record, index) => validateRecord(record, `${caseId} Active Working Set record ${index}`));
  wholeProject.forEach((record, index) => validateRecord(record, `${caseId} Whole Project record ${index}`));

  const activeIds = activeWorkingSet.map((record) => record.id);
  const wholeIds = wholeProject.map((record) => record.id);
  requireUnique(activeIds, `${caseId} Active Working Set ids`);
  requireUnique(wholeIds, `${caseId} Whole Project ids`);
  if (!activeIds.every((recordId) => wholeIds.includes(recordId))) {
    throw new Error(`${caseId}: Active Working Set must be a subset of Whole Project records.`);
  }

  requireDeepEqual(accounting.activeWorkingSetRecordIds, activeIds, `${caseId} Active Working Set accounting`);
  requireDeepEqual(accounting.wholeProjectRecordIds, wholeIds, `${caseId} Whole Project accounting`);
  requireDeepEqual(accounting.generationBriefFieldCount, 19, `${caseId} Generation Brief field count`);

  const secretRecordIds = wholeProject.filter((record) => record.type === "SECRET").map((record) => record.id);
  requireDeepEqual(accounting.secretRecordIds, secretRecordIds, `${caseId} SECRET accounting`);

  requireArray(accounting.contrastKeys, `${caseId} contrast keys`);
  requireUnique(accounting.contrastKeys, `${caseId} contrast keys`);
  for (const key of accounting.contrastKeys) {
    if (!contrastKeyResolves(key, activeWorkingSet)) {
      throw new Error(`${caseId}: contrast key ${key} does not resolve in the declared source.`);
    }
  }
}

function validateRecord(record, label) {
  requireObject(record, label);
  requireString(record.id, `${label} id`);
  requireString(record.type, `${label} type`);
  requireString(record.displayLabel, `${label} displayLabel`);
  if (record.archived !== false) {
    throw new Error(`${label} must declare archived false.`);
  }
  requireObject(record.payload, `${label} payload`);
}

function validateAdjudication(fixture, caseId) {
  const adjudication = requireObject(fixture.adjudication, `${caseId} adjudication`);
  const findings = requireArray(adjudication.findings, `${caseId} findings`);
  const coverage = requireArray(adjudication.coverage, `${caseId} coverage`);
  const prohibitedInventions = requireArray(adjudication.prohibitedInventions, `${caseId} prohibited inventions`);

  if (caseId === "no-change" ? findings.length !== 0 : findings.length === 0) {
    throw new Error(`${caseId}: adjudicated findings do not match the seeded case kind.`);
  }
  if (prohibitedInventions.length === 0 || prohibitedInventions.some((value) => !isNonemptyString(value))) {
    throw new Error(`${caseId}: prohibited inventions must contain nonblank strings.`);
  }

  const evidenceKeys = new Set(fixture.expectedSourceAccounting.evidenceKeys);
  const contrastKeys = new Set(fixture.expectedSourceAccounting.contrastKeys);
  const findingIds = [];
  for (const finding of findings) {
    const findingId = requireString(finding?.findingId, `${caseId} finding id`);
    findingIds.push(findingId);
    requireString(finding.summary, `${caseId} finding summary`);
    validateKnownKeys(finding.evidenceKeys, evidenceKeys, `${caseId} finding ${findingId} evidence`);
    validateKnownKeys(finding.contrastKeys, contrastKeys, `${caseId} finding ${findingId} contrast`);
    if (!EPISTEMIC_STATUSES.has(finding.epistemicStatus)) {
      throw new Error(`${caseId}: finding ${findingId} has invalid epistemicStatus.`);
    }
    if (!RETENTION_HORIZONS.has(finding.retentionHorizon)) {
      throw new Error(`${caseId}: finding ${findingId} has invalid retentionHorizon.`);
    }
    requireArray(finding.targetHints, `${caseId} finding ${findingId} target hints`);
    requireString(finding.uncertaintyOrRivalReading, `${caseId} finding ${findingId} uncertainty`);
  }
  requireUnique(findingIds, `${caseId} finding ids`);

  requireDeepEqual(
    coverage.map((row) => row?.dimension),
    CHANGE_REVIEW_COVERAGE_DIMENSIONS,
    `${caseId} six coverage dimensions`
  );
  for (const row of coverage) {
    if (!COVERAGE_STATUSES.has(row.status)) {
      throw new Error(`${caseId}: invalid coverage status for ${row.dimension}.`);
    }
    requireString(row.reason, `${caseId} coverage reason for ${row.dimension}`);
  }

  if (
    fixture.expectedSourceAccounting.secretRecordIds.length > 0 &&
    !/synthetic.*SECRET|SECRET.*synthetic/i.test(fixture.syntheticDataDisclosure)
  ) {
    throw new Error(`${caseId}: synthetic SECRET data must be visibly disclosed.`);
  }
}

function validateKnownKeys(values, knownKeys, label) {
  requireArray(values, label);
  if (values.length === 0 || values.some((value) => !knownKeys.has(value))) {
    throw new Error(`${label} contains an unresolved key.`);
  }
}

function contrastKeyResolves(key, records) {
  if (CHANGE_REVIEW_BRIEF_FIELD_PATHS.some((fieldPath) => key === `[BRIEF:${fieldPath}]`)) {
    return true;
  }

  const match = /^\[([A-Z][A-Z-]*)-(\d+)]$/.exec(key);
  if (!match) {
    return false;
  }
  const recordType = match[1].replaceAll("-", " ");
  const ordinal = Number(match[2]);
  return records.filter((record) => record.type === recordType).length >= ordinal;
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

function requireString(value, label) {
  if (!isNonemptyString(value)) {
    throw new Error(`${label} must be a nonblank string.`);
  }
  return value;
}

function requireNonnegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
}

function requireUnique(values, label) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique.`);
  }
}

function requireDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the deterministic contract.`);
  }
}

function isNonemptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
