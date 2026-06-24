import { ZodError } from "zod";

import { parseRecordPayload } from "../../records/registry.js";
import { allowedDeactivationDestinationsFor } from "./schema-catalog.js";
import { SEGMENT_RECONCILIATION_OUTPUT_CONTRACT } from "./output-schema.js";
import type {
  ReconciliationBriefField,
  ReconciliationRecord,
  ReconciliationReferenceStub,
  SegmentReconciliationRecordScope
} from "./types.js";

export type SegmentReconciliationMalformedReason =
  | "not-pure-json"
  | "schema-mismatch"
  | "source-mismatch"
  | "unknown-citation"
  | "invalid-brief-path"
  | "invalid-brief-value"
  | "invalid-record-target"
  | "invalid-patch"
  | "invalid-lifecycle-destination"
  | "invalid-record-type"
  | "invalid-enum"
  | "invalid-record-payload"
  | "invalid-reference"
  | "cyclic-creation-dependency"
  | "verbatim-source-echo";

export type SegmentReconciliationParseResult =
  | {
      status: "valid";
      output: SegmentReconciliationParsedOutput;
    }
  | {
      status: "malformed";
      reasonCode: SegmentReconciliationMalformedReason;
      summary: string;
      rawOutput: string;
    };

export interface SegmentReconciliationParseContext {
  promptFingerprint: string;
  acceptedSegmentId: string;
  acceptedSegmentSequence: number;
  recordScope: SegmentReconciliationRecordScope;
  acceptedSegmentText: string;
  segmentSpanKeys: readonly string[];
  briefFields: readonly ReconciliationBriefField[];
  records: readonly ReconciliationRecord[];
  referenceStubs: readonly ReconciliationReferenceStub[];
  recordKeyById: ReadonlyMap<string, string>;
  referenceStubKeyById: ReadonlyMap<string, string>;
  schemaCatalogRecordTypes: readonly string[];
}

export interface SegmentReconciliationParsedOutput {
  contract: typeof SEGMENT_RECONCILIATION_OUTPUT_CONTRACT;
  source: SegmentReconciliationSourceEcho;
  briefProposals: readonly ParsedBriefProposal[];
  recordChangeProposals: readonly ParsedRecordChangeProposal[];
  recordCreationProposals: readonly ParsedRecordCreationProposal[];
}

export interface SegmentReconciliationSourceEcho {
  profile: "segment-reconciliation";
  accepted_segment_id: string;
  accepted_segment_sequence: number;
  record_scope: SegmentReconciliationRecordScope;
  prompt_fingerprint: string;
}

export interface ParsedBriefProposal {
  id: string;
  action: "FILL" | "REPLACE" | "CLEAR";
  fieldPath: string;
  proposedValue: unknown;
  evidence: readonly string[];
  contrast: readonly string[];
  rationale: string;
}

export interface ParsedRecordChangeProposal {
  id: string;
  action: "UPDATE_FIELDS" | "DEACTIVATE";
  recordId: string;
  recordKey: string;
  patches: readonly JsonPatchOperation[];
  lifecycleDestination?: string;
  evidence: readonly string[];
  contrast: readonly string[];
  rationale: string;
}

export interface ParsedRecordCreationProposal {
  id: string;
  recordType: string;
  payload: unknown;
  dependencies: readonly string[];
  evidence: readonly string[];
  contrast: readonly string[];
  rationale: string;
}

export interface JsonPatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const citationPattern = /^\[(?:SEG-\d+-S\d{3}|BRIEF:[^\]]+|(?:REF-)?[A-Z][A-Z -]*-\d+|RECORD-SCOPE)]$/;
const recordTokenPattern = /^\$record:\[[^\]]+]$/;
const newTokenPattern = /^\$new:NEW-\d{3}$/;

export function parseSegmentReconciliationOutput(
  rawOutput: string,
  context: SegmentReconciliationParseContext
): SegmentReconciliationParseResult {
  try {
    const parsed = parsePureJsonObject(rawOutput);
    validateTopLevel(parsed);
    const source = parseSource(parsed.source);
    validateSource(source, context);
    const citationContext = buildCitationContext(context);
    const briefProposals = parseBriefProposals(parsed.brief_proposals as unknown[], context, citationContext);
    const recordChangeProposals = parseRecordChangeProposals(parsed.record_change_proposals as unknown[], context, citationContext);
    const recordCreationProposals = parseRecordCreationProposals(parsed.record_creation_proposals as unknown[], context, citationContext);
    validateNoDuplicateTargets(briefProposals, recordChangeProposals);
    validateCreationGraph(recordCreationProposals);
    validateEchoFirewall(parsed, context.acceptedSegmentText);

    return {
      status: "valid",
      output: {
        contract: SEGMENT_RECONCILIATION_OUTPUT_CONTRACT,
        source,
        briefProposals,
        recordChangeProposals,
        recordCreationProposals
      }
    };
  } catch (error) {
    return malformed(rawOutput, reasonFromError(error), error instanceof Error ? error.message : "Malformed output.");
  }
}

function parsePureJsonObject(rawOutput: string): Record<string, unknown> {
  const trimmed = rawOutput.trim();

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw reason("not-pure-json", "Output must be one JSON object with no surrounding text.");
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isPlainObject(parsed)) {
      throw reason("not-pure-json", "Output must be a JSON object.");
    }

    return parsed;
  } catch (error) {
    if (isReasonError(error)) {
      throw error;
    }

    throw reason("not-pure-json", "Output is not parseable JSON.");
  }
}

function validateTopLevel(output: Record<string, unknown>) {
  expectKeys(output, ["contract", "source", "brief_proposals", "record_change_proposals", "record_creation_proposals"]);

  if (output.contract !== SEGMENT_RECONCILIATION_OUTPUT_CONTRACT) {
    throw reason("schema-mismatch", "Unexpected reconciliation output contract.");
  }

  if (!Array.isArray(output.brief_proposals) || !Array.isArray(output.record_change_proposals) || !Array.isArray(output.record_creation_proposals)) {
    throw reason("schema-mismatch", "Proposal arrays are required.");
  }
}

function parseSource(source: unknown): SegmentReconciliationSourceEcho {
  if (!isPlainObject(source)) {
    throw reason("schema-mismatch", "source must be an object.");
  }

  expectKeys(source, ["profile", "accepted_segment_id", "accepted_segment_sequence", "record_scope", "prompt_fingerprint"]);

  if (
    source.profile !== "segment-reconciliation" ||
    typeof source.accepted_segment_id !== "string" ||
    typeof source.accepted_segment_sequence !== "number" ||
    (source.record_scope !== "active_working_set" && source.record_scope !== "whole_project") ||
    typeof source.prompt_fingerprint !== "string"
  ) {
    throw reason("schema-mismatch", "source echo has invalid fields.");
  }

  return {
    profile: "segment-reconciliation",
    accepted_segment_id: source.accepted_segment_id,
    accepted_segment_sequence: source.accepted_segment_sequence,
    record_scope: source.record_scope,
    prompt_fingerprint: source.prompt_fingerprint
  };
}

function validateSource(source: SegmentReconciliationSourceEcho, context: SegmentReconciliationParseContext) {
  if (
    source.accepted_segment_id !== context.acceptedSegmentId ||
    source.accepted_segment_sequence !== context.acceptedSegmentSequence ||
    source.record_scope !== context.recordScope ||
    source.prompt_fingerprint !== context.promptFingerprint
  ) {
    throw reason("source-mismatch", "Reconciliation output source echo does not match inspected source.");
  }
}

function parseBriefProposals(
  value: unknown[],
  context: SegmentReconciliationParseContext,
  citationContext: CitationContext
): ParsedBriefProposal[] {
  validateSequentialIds(value, "BRIEF");
  const allowedPaths = new Set<string>(context.briefFields.map((field) => field.fieldPath));

  return value.map((proposal) => {
    if (!isPlainObject(proposal)) {
      throw reason("schema-mismatch", "Brief proposal must be an object.");
    }

    expectKeys(proposal, ["id", "action", "field_path", "proposed_value", "evidence", "contrast", "rationale"]);

    if (!isBriefAction(proposal.action) || typeof proposal.field_path !== "string" || typeof proposal.rationale !== "string") {
      throw reason("schema-mismatch", "Brief proposal has invalid fields.");
    }

    if (!allowedPaths.has(proposal.field_path)) {
      throw reason("invalid-brief-path", `Invalid brief field path: ${proposal.field_path}`);
    }

    if (proposal.action !== "CLEAR" && isBlankValue(proposal.proposed_value)) {
      throw reason("invalid-brief-value", "FILL and REPLACE require a nonblank proposed value.");
    }

    const evidence = parseCitationList(proposal.evidence, citationContext.segmentKeys);
    const contrast = parseCitationList(proposal.contrast, citationContext.contrastKeys);

    return {
      id: proposal.id as string,
      action: proposal.action,
      fieldPath: proposal.field_path,
      proposedValue: proposal.proposed_value,
      evidence,
      contrast,
      rationale: proposal.rationale
    };
  });
}

function parseRecordChangeProposals(
  value: unknown[],
  context: SegmentReconciliationParseContext,
  citationContext: CitationContext
): ParsedRecordChangeProposal[] {
  validateSequentialIds(value, "RECORD");
  const recordIdByKey = invertMap(context.recordKeyById);

  return value.map((proposal) => {
    if (!isPlainObject(proposal)) {
      throw reason("schema-mismatch", "Record-change proposal must be an object.");
    }

    expectKeys(proposal, ["id", "action", "record_key", "patches", "lifecycle_destination", "evidence", "contrast", "rationale"]);

    if (!isRecordAction(proposal.action) || typeof proposal.record_key !== "string" || typeof proposal.rationale !== "string") {
      throw reason("schema-mismatch", "Record-change proposal has invalid fields.");
    }

    const recordId = recordIdByKey.get(proposal.record_key);
    const record = context.records.find((candidate) => candidate.id === recordId);
    if (!recordId || !record) {
      throw reason("invalid-record-target", `Invalid record target: ${proposal.record_key}`);
    }

    const patches = parsePatches(proposal.patches);
    const lifecycleDestination = parseLifecycleDestination(proposal.lifecycle_destination, proposal.action, record.type);
    if (proposal.action === "UPDATE_FIELDS") {
      validatePatchedRecordPayload(record, patches);
    }
    const evidence = parseCitationList(proposal.evidence, citationContext.segmentKeys);
    const contrast = parseCitationList(proposal.contrast, new Set([...citationContext.contrastKeys, proposal.record_key]));

    return {
      id: proposal.id as string,
      action: proposal.action,
      recordId,
      recordKey: proposal.record_key,
      patches,
      ...(lifecycleDestination ? { lifecycleDestination } : {}),
      evidence,
      contrast,
      rationale: proposal.rationale
    };
  });
}

function parseRecordCreationProposals(
  value: unknown[],
  context: SegmentReconciliationParseContext,
  citationContext: CitationContext
): ParsedRecordCreationProposal[] {
  validateSequentialIds(value, "NEW");
  const allowedTypes = new Set(context.schemaCatalogRecordTypes);
  const temporaryIds = new Map<string, string>();

  for (const proposal of value) {
    if (isPlainObject(proposal) && typeof proposal.id === "string") {
      temporaryIds.set(proposal.id, deterministicTemporaryId(context.promptFingerprint, proposal.id));
    }
  }

  return value.map((proposal) => {
    if (!isPlainObject(proposal)) {
      throw reason("schema-mismatch", "Record-creation proposal must be an object.");
    }

    expectKeys(proposal, ["id", "record_type", "payload", "dependencies", "evidence", "contrast", "rationale"]);

    if (typeof proposal.id !== "string" || typeof proposal.record_type !== "string" || !isPlainObject(proposal.payload) || typeof proposal.rationale !== "string") {
      throw reason("schema-mismatch", "Record-creation proposal has invalid fields.");
    }

    if (!allowedTypes.has(proposal.record_type)) {
      throw reason("invalid-record-type", `Invalid record type: ${proposal.record_type}`);
    }

    const dependencies = parseDependencies(proposal.dependencies);
    const evidence = parseCitationList(proposal.evidence, citationContext.segmentKeys);
    const contrast = parseCitationList(proposal.contrast, citationContext.contrastKeys);
    if ("id" in proposal.payload) {
      throw reason("invalid-record-payload", "Creation payload must not include a repository id.");
    }
    const resolvedPayload = resolveReferenceTokens(proposal.payload, citationContext, temporaryIds);
    const temporaryPayload = { id: temporaryIds.get(proposal.id), ...(isPlainObject(resolvedPayload) ? resolvedPayload : {}) };

    try {
      try {
        parseRecordPayload(proposal.record_type, resolvedPayload);
      } catch {
        parseRecordPayload(proposal.record_type, temporaryPayload);
      }
    } catch (error) {
      throw invalidRecordPayloadReason(error, proposal.record_type);
    }

    return {
      id: proposal.id,
      recordType: proposal.record_type,
      payload: resolvedPayload,
      dependencies,
      evidence,
      contrast,
      rationale: proposal.rationale
    };
  });
}

function parsePatches(value: unknown): JsonPatchOperation[] {
  if (!Array.isArray(value)) {
    throw reason("invalid-patch", "patches must be an array.");
  }

  return value.map((patch) => {
    if (!isPlainObject(patch)) {
      throw reason("invalid-patch", "Patch must be an object.");
    }

    expectKeys(patch, ["op", "path", "value"]);
    if ((patch.op !== "add" && patch.op !== "replace" && patch.op !== "remove") || typeof patch.path !== "string" || !patch.path.startsWith("/")) {
      throw reason("invalid-patch", "Invalid JSON patch operation.");
    }

    return {
      op: patch.op,
      path: patch.path,
      ...(patch.op === "remove" ? {} : { value: patch.value })
    };
  });
}

function parseLifecycleDestination(value: unknown, action: "UPDATE_FIELDS" | "DEACTIVATE", recordType: string): string | undefined {
  if (action === "UPDATE_FIELDS") {
    if (value !== null) {
      throw reason("invalid-lifecycle-destination", "UPDATE_FIELDS must not name a lifecycle destination.");
    }
    return undefined;
  }

  if (typeof value !== "string" || !allowedDeactivationDestinationsFor(recordType).includes(value)) {
    throw reason("invalid-lifecycle-destination", `Invalid lifecycle destination for ${recordType}.`);
  }

  return value;
}

function validatePatchedRecordPayload(record: ReconciliationRecord, patches: readonly JsonPatchOperation[]) {
  const patchedPayload = structuredClone(record.payload);
  for (const patch of patches) {
    applyPatchOperation(patchedPayload, patch);
  }

  try {
    parseRecordPayload(record.type, patchedPayload);
  } catch (error) {
    throw invalidRecordPayloadReason(error, record.type);
  }
}

function applyPatchOperation(document: unknown, patch: JsonPatchOperation) {
  const segments = parsePointerSegments(patch.path);
  if (segments[0] === "id") {
    throw reason("invalid-patch", "Record repository id is immutable.");
  }

  if (segments.length === 0) {
    throw reason("invalid-patch", "Patch must target a record field.");
  }

  const parent = resolvePointerParent(document, segments);
  const key = segments[segments.length - 1];
  if (key === undefined) {
    throw reason("invalid-patch", "Patch must target a record field.");
  }

  if (Array.isArray(parent)) {
    applyArrayPatch(parent, key, patch);
    return;
  }

  if (!isPlainObject(parent)) {
    throw reason("invalid-patch", "Patch path does not resolve to an object or array.");
  }

  applyObjectPatch(parent, key, patch);
}

function parsePointerSegments(path: string): string[] {
  return path
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function resolvePointerParent(document: unknown, segments: readonly string[]): unknown {
  let current = document;
  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(current)) {
      const index = parseExistingArrayIndex(current, segment);
      current = current[index];
      continue;
    }

    if (isPlainObject(current) && Object.hasOwn(current, segment)) {
      current = current[segment];
      continue;
    }

    throw reason("invalid-patch", "Patch path does not resolve.");
  }

  return current;
}

function applyObjectPatch(parent: Record<string, unknown>, key: string, patch: JsonPatchOperation) {
  if (patch.op === "add") {
    parent[key] = patch.value;
    return;
  }

  if (!Object.hasOwn(parent, key)) {
    throw reason("invalid-patch", "Patch path does not resolve.");
  }

  if (patch.op === "replace") {
    parent[key] = patch.value;
    return;
  }

  delete parent[key];
}

function applyArrayPatch(parent: unknown[], key: string, patch: JsonPatchOperation) {
  if (patch.op === "add") {
    const index = key === "-" ? parent.length : parseArrayIndexForAdd(parent, key);
    parent.splice(index, 0, patch.value);
    return;
  }

  const index = parseExistingArrayIndex(parent, key);
  if (patch.op === "replace") {
    parent[index] = patch.value;
    return;
  }

  parent.splice(index, 1);
}

function parseExistingArrayIndex(array: readonly unknown[], segment: string): number {
  const index = parseArrayIndex(segment);
  if (index < 0 || index >= array.length) {
    throw reason("invalid-patch", "Patch array index does not resolve.");
  }

  return index;
}

function parseArrayIndexForAdd(array: readonly unknown[], segment: string): number {
  const index = parseArrayIndex(segment);
  if (index < 0 || index > array.length) {
    throw reason("invalid-patch", "Patch array index does not resolve.");
  }

  return index;
}

function parseArrayIndex(segment: string): number {
  if (!/^(?:0|[1-9]\d*)$/.test(segment)) {
    throw reason("invalid-patch", "Patch array index is invalid.");
  }

  return Number(segment);
}

function invalidRecordPayloadReason(error: unknown, recordType: string): ReasonError {
  if (error instanceof ZodError && error.issues.some((issue) => issue.code === "invalid_value")) {
    return reason("invalid-enum", `Invalid enum value for ${recordType}.`);
  }

  return reason("invalid-record-payload", `Invalid payload for ${recordType}.`);
}

function parseDependencies(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && /^NEW-\d{3}$/.test(item))) {
    throw reason("invalid-reference", "dependencies must be NEW proposal ids.");
  }

  return value.map((item) => item as string);
}

function validateCreationGraph(proposals: readonly ParsedRecordCreationProposal[]) {
  const ids = new Set(proposals.map((proposal) => proposal.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(proposals.map((proposal) => [proposal.id, proposal]));

  for (const proposal of proposals) {
    for (const dependency of proposal.dependencies) {
      if (!ids.has(dependency)) {
        throw reason("invalid-reference", `Unknown creation dependency: ${dependency}`);
      }
    }
    visit(proposal.id, byId, visiting, visited);
  }
}

function visit(
  id: string,
  byId: ReadonlyMap<string, ParsedRecordCreationProposal>,
  visiting: Set<string>,
  visited: Set<string>
) {
  if (visited.has(id)) {
    return;
  }

  if (visiting.has(id)) {
    throw reason("cyclic-creation-dependency", "Creation dependencies must be acyclic.");
  }

  visiting.add(id);
  for (const dependency of byId.get(id)?.dependencies ?? []) {
    visit(dependency, byId, visiting, visited);
  }
  visiting.delete(id);
  visited.add(id);
}

function resolveReferenceTokens(
  value: unknown,
  citationContext: CitationContext,
  temporaryIds: ReadonlyMap<string, string>
): unknown {
  if (typeof value === "string") {
    if (recordTokenPattern.test(value)) {
      const key = value.slice("$record:".length);
      const recordId = citationContext.recordIdByCitation.get(key);
      if (!recordId) {
        throw reason("invalid-reference", `Unknown record token: ${value}`);
      }
      return recordId;
    }

    if (newTokenPattern.test(value)) {
      const id = value.slice("$new:".length);
      const temporaryId = temporaryIds.get(id);
      if (!temporaryId) {
        throw reason("invalid-reference", `Unknown new-record token: ${value}`);
      }
      return temporaryId;
    }

    if (uuidPattern.test(value)) {
      throw reason("invalid-reference", "Raw UUID references are not allowed; use reference tokens.");
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveReferenceTokens(item, citationContext, temporaryIds));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, resolveReferenceTokens(nested, citationContext, temporaryIds)])
    );
  }

  return value;
}

function validateNoDuplicateTargets(
  briefProposals: readonly ParsedBriefProposal[],
  recordChangeProposals: readonly ParsedRecordChangeProposal[]
) {
  assertNoDuplicates(briefProposals.map((proposal) => `brief:${proposal.fieldPath}:${proposal.action}`), "invalid-brief-path");
  assertNoDuplicates(recordChangeProposals.map((proposal) => `record:${proposal.recordId}:${proposal.action}`), "invalid-record-target");
}

function validateEchoFirewall(output: unknown, acceptedSegmentText: string) {
  const accepted = normalizeEchoText(acceptedSegmentText);
  const acceptedTokens = tokensForEcho(accepted);

  for (const text of collectStrings(output)) {
    if (isEchoExempt(text)) {
      continue;
    }

    const normalized = normalizeEchoText(text);
    if (normalized.length >= 50 && accepted.includes(normalized)) {
      throw reason("verbatim-source-echo", "Output contains a material accepted-segment substring.");
    }

    const tokens = tokensForEcho(normalized);
    if (hasVerbatimTokenRun(tokens, acceptedTokens, 8)) {
      throw reason("verbatim-source-echo", "Output contains a material accepted-segment token run.");
    }
  }
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (isPlainObject(value)) {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
}

function normalizeEchoText(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function tokensForEcho(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function hasVerbatimTokenRun(tokens: readonly string[], acceptedTokens: readonly string[], runLength: number): boolean {
  if (tokens.length < runLength) {
    return false;
  }

  const acceptedRuns = new Set<string>();
  for (let index = 0; index <= acceptedTokens.length - runLength; index += 1) {
    acceptedRuns.add(acceptedTokens.slice(index, index + runLength).join(" "));
  }

  for (let index = 0; index <= tokens.length - runLength; index += 1) {
    if (acceptedRuns.has(tokens.slice(index, index + runLength).join(" "))) {
      return true;
    }
  }

  return false;
}

function isEchoExempt(text: string): boolean {
  return (
    citationPattern.test(text) ||
    recordTokenPattern.test(text) ||
    newTokenPattern.test(text) ||
    /^(?:BRIEF|RECORD|NEW)-\d{3}$/.test(text) ||
    /^(?:true|false|null|active|resolved|abandoned|hidden|open|pending|settled)$/i.test(text) ||
    text.trim().split(/\s+/).length <= 3 && /^[\p{L}\p{N} .'-]+$/u.test(text)
  );
}

interface CitationContext {
  segmentKeys: ReadonlySet<string>;
  contrastKeys: ReadonlySet<string>;
  recordIdByCitation: ReadonlyMap<string, string>;
}

function buildCitationContext(context: SegmentReconciliationParseContext): CitationContext {
  const recordEntries = [...context.recordKeyById.entries()].map(([recordId, key]): [string, string] => [key, recordId]);
  const stubEntries = [...context.referenceStubKeyById.entries()].map(([recordId, key]): [string, string] => [key, recordId]);
  const recordIdByCitation = new Map([...recordEntries, ...stubEntries]);

  return {
    segmentKeys: new Set(context.segmentSpanKeys),
    contrastKeys: new Set([
      ...context.briefFields.map((field) => field.citationKey),
      ...recordIdByCitation.keys(),
      "[RECORD-SCOPE]"
    ]),
    recordIdByCitation
  };
}

function parseCitationList(value: unknown, allowed: ReadonlySet<string>): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string")) {
    throw reason("unknown-citation", "Citation lists must contain at least one string key.");
  }

  for (const item of value) {
    if (!allowed.has(item)) {
      throw reason("unknown-citation", `Unknown citation key: ${item}`);
    }
  }

  return value;
}

function validateSequentialIds(value: readonly unknown[], prefix: "BRIEF" | "RECORD" | "NEW") {
  value.forEach((proposal, index) => {
    if (!isPlainObject(proposal) || proposal.id !== `${prefix}-${String(index + 1).padStart(3, "0")}`) {
      throw reason("schema-mismatch", `${prefix} proposal ids must be sequential.`);
    }
  });
}

function assertNoDuplicates(values: readonly string[], reasonCode: SegmentReconciliationMalformedReason) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw reason(reasonCode, `Duplicate target/action: ${value}`);
    }
    seen.add(value);
  }
}

function invertMap(map: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
  return new Map([...map.entries()].map(([key, value]) => [value, key]));
}

function expectKeys(value: Record<string, unknown>, expectedKeys: readonly string[]) {
  const expected = new Set(expectedKeys);
  const actual = Object.keys(value);

  if (actual.length !== expected.size || actual.some((key) => !expected.has(key))) {
    throw reason("schema-mismatch", `Unexpected object keys: ${actual.join(", ")}`);
  }
}

function isBlankValue(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function isBriefAction(value: unknown): value is ParsedBriefProposal["action"] {
  return value === "FILL" || value === "REPLACE" || value === "CLEAR";
}

function isRecordAction(value: unknown): value is ParsedRecordChangeProposal["action"] {
  return value === "UPDATE_FIELDS" || value === "DEACTIVATE";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

interface ReasonError extends Error {
  reasonCode: SegmentReconciliationMalformedReason;
}

function reason(reasonCode: SegmentReconciliationMalformedReason, message: string): ReasonError {
  const error = new Error(message) as ReasonError;
  error.reasonCode = reasonCode;
  return error;
}

function isReasonError(error: unknown): error is ReasonError {
  return error instanceof Error && "reasonCode" in error;
}

function reasonFromError(error: unknown): SegmentReconciliationMalformedReason {
  return isReasonError(error) ? error.reasonCode : "schema-mismatch";
}

function malformed(
  rawOutput: string,
  reasonCode: SegmentReconciliationMalformedReason,
  summary: string
): SegmentReconciliationParseResult {
  return {
    status: "malformed",
    reasonCode,
    summary,
    rawOutput
  };
}

function deterministicTemporaryId(fingerprint: string, proposalId: string): string {
  const hex = fnv1a32(`${fingerprint}:${proposalId}`).padStart(8, "0");
  return `019b0298-${hex.slice(0, 4)}-7000-8000-${hex}${hex}`.slice(0, 36);
}

function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
