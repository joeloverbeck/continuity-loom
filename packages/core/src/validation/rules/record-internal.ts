import { extractRecordReferences } from "../../records/registry.js";
import type { RecordReference } from "../../records/references.js";
import { classifyReference } from "../reference-classification.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRule } from "./types.js";

export const recordInternalReferenceRules: readonly ValidationRule[] = Object.freeze([
  validateRecordInternalReferences
]);

const entityReferenceTypes = ["ENTITY", "CAST MEMBER"] as const;
const locationReferenceTypes = ["LOCATION"] as const;
const objectLocationReferenceTypes = ["LOCATION", "OBJECT"] as const;
const entityIdReferenceTypes = ["ENTITY"] as const;

const expectedTypesByRole = new Map<string, readonly string[]>([
  ["available_to", entityReferenceTypes],
  ["carried_by", entityReferenceTypes],
  ["current_location", locationReferenceTypes],
  ["entity_id", entityIdReferenceTypes],
  ["from", entityReferenceTypes],
  ["holder", entityReferenceTypes],
  ["holder_or_target", entityReferenceTypes],
  ["known_by", entityReferenceTypes],
  ["location", locationReferenceTypes],
  ["non_holder_to_protect", entityReferenceTypes],
  ["owed_by", entityReferenceTypes],
  ["owed_to", entityReferenceTypes],
  ["owner", entityReferenceTypes],
  ["participant", entityReferenceTypes],
  ["secret_holder", entityReferenceTypes],
  ["to", entityReferenceTypes]
]);

export interface ExtractedRecordInternalReference {
  sourceRecord: ValidationRecord;
  reference: RecordReference;
}

export function recordInternalReferences(snapshot: ValidationSnapshot): readonly ExtractedRecordInternalReference[] {
  return snapshot.records.flatMap((record) =>
    safelyExtractRecordReferences(record)
      .filter((reference) => typeof reference.targetId === "string" && reference.targetId.length > 0)
      .map((reference) => ({ sourceRecord: record, reference }))
  );
}

export function expectedRecordReferenceTypes(refRole: string, sourceRecord?: ValidationRecord): readonly string[] | undefined {
  if (refRole === "current_location" && sourceRecord?.type === "OBJECT") {
    return objectLocationReferenceTypes;
  }

  return expectedTypesByRole.get(refRole);
}

export function isRecordReferenceRequired(snapshot: ValidationSnapshot, sourceRecord: ValidationRecord, refRole: string): boolean {
  if (
    sourceRecord.type === "SECRET" &&
    (refRole === "secret_holder" || refRole === "non_holder_to_protect")
  ) {
    return isActiveSecretStatus(objectPayload(sourceRecord).status);
  }

  return sourceRecord.type === "PLAN" &&
    refRole === "holder" &&
    (isSelectedActivePlan(snapshot, sourceRecord) || hasExpectedLocalMode(snapshot, "non_pov_hidden_plan_behavior"));
}

function isSelectedActivePlan(snapshot: ValidationSnapshot, sourceRecord: ValidationRecord): boolean {
  return objectPayload(sourceRecord).plan_status === "active" &&
    (snapshot.generationSession.active_working_set?.selected_records ?? []).includes(sourceRecord.id);
}

function validateRecordInternalReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return recordInternalReferences(snapshot).flatMap(({ sourceRecord, reference }) => {
    const expectedTypes = expectedRecordReferenceTypes(reference.refRole, sourceRecord);
    const classified = classifyReference(snapshot, reference.targetId, expectedTypes);

    if (classified.classification === "dangling") {
      return [
        blocker(
          DIAGNOSTIC_CODES.recordReferenceDangling,
          `Record ${sourceRecord.id} ${reference.refRole} reference ${reference.targetId} does not resolve to a project record.`,
          sourceRecord,
          reference
        )
      ];
    }

    if (!classified.typeMatches) {
      return [
        blocker(
          DIAGNOSTIC_CODES.recordReferenceTypeMismatch,
          `Record ${sourceRecord.id} ${reference.refRole} reference ${reference.targetId} resolves to ${classified.actualType ?? "unknown"} instead of the required record type.`,
          sourceRecord,
          reference
        )
      ];
    }

    return classified.classification === "unselected" && isRecordReferenceRequired(snapshot, sourceRecord, reference.refRole)
      ? [
          blocker(
            DIAGNOSTIC_CODES.recordReferenceUnselectedRequired,
            `Record ${sourceRecord.id} ${reference.refRole} reference ${reference.targetId} must be selected for this required prompt lane.`,
            sourceRecord,
            reference
          )
        ]
      : [];
  });
}

function safelyExtractRecordReferences(record: ValidationRecord): readonly RecordReference[] {
  try {
    return extractRecordReferences(record.type, record.payload);
  } catch {
    return [];
  }
}

function isActiveSecretStatus(status: unknown): boolean {
  return status === "hidden" || status === "partially_revealed" || status === "revealed";
}

function hasExpectedLocalMode(snapshot: ValidationSnapshot, mode: string): boolean {
  return snapshot.generationSession.generation_validation_focus?.validation_focus_tags?.expected_local_modes?.some((candidate) => candidate === mode) ?? false;
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
    ? record.payload as Record<string, unknown>
    : {};
}

function blocker(code: string, message: string, sourceRecord: ValidationRecord, reference: RecordReference): Diagnostic {
  return {
    severity: "blocker",
    code,
    message,
    affected: [{ recordId: sourceRecord.id, field: `${sourceRecord.type}.${reference.refRole}` }],
    whyItMatters: "Selected records must not name missing, mistyped, or required-but-unselected story state before prompt compilation.",
    suggestedActions: ["revise", "remove", "deselect"]
  };
}
