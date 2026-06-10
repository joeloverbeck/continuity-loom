import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

export const structuralContradictionRules: readonly ValidationRule[] = Object.freeze([
  validateOnstageOffstageOverlap,
  validateOnstageEntityStatuses,
  validateObjectHolderLocationCoherence,
  validateRelationshipSelfReferences
]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateOnstageOffstageOverlap(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const state = snapshot.generationSession.current_authoritative_state;
  const onstageIds = new Set(state?.onstage_entities ?? []);
  const overlapping = (state?.offstage_pressuring_entities ?? []).filter((id) => onstageIds.has(id));

  return overlapping.length > 0
    ? [
        blocker({
          code: DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
          field: "generationSession.current_authoritative_state.onstage_entities/offstage_pressuring_entities",
          message: "The same entity is both onstage and offstage-pressuring in current authoritative state.",
          whyItMatters: "A selected entity cannot be physically present and offstage-pressuring in the same local moment without an explicit state distinction."
        })
      ]
    : [];
}

function validateOnstageEntityStatuses(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const state = snapshot.generationSession.current_authoritative_state;
  const onstageIds = new Set(state?.onstage_entities ?? []);
  const currentLocation = state?.current_location;
  const currentLocationId = isUuid(currentLocation) ? currentLocation : undefined;

  return snapshot.records.flatMap((record) => {
    if (record.type !== "ENTITY STATUS") {
      return [];
    }

    const payload = objectPayload(record);

    if (!isText(payload.entity_id) || !onstageIds.has(payload.entity_id) || !isText(payload.location)) {
      return [];
    }

    if (payload.location === "offstage" || payload.location === "concealed") {
      return [
        blocker({
          code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
          recordId: record.id,
          field: "ENTITY STATUS.location",
          message: "An onstage entity has a selected status placing it offstage or concealed.",
          whyItMatters: "Onstage participation requires physical continuity that does not contradict the selected entity status."
        })
      ];
    }

    if (currentLocationId && isUuid(payload.location) && payload.location !== currentLocationId) {
      return [
        blocker({
          code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
          recordId: record.id,
          field: "ENTITY STATUS.location",
          message: "An onstage entity status places the entity at a different current location than the scene.",
          whyItMatters: "The prompt cannot deterministically render an onstage entity in two different current locations."
        })
      ];
    }

    return [];
  });
}

function validateObjectHolderLocationCoherence(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    if (record.type !== "OBJECT") {
      return [];
    }

    const payload = objectPayload(record);

    return payload.current_location === "carried_by_holder" && payload.carried_by === "none"
      ? [
          blocker({
            code: DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
            recordId: record.id,
            field: "OBJECT.current_location/carried_by",
            message: "Object current_location says it is carried by its holder, but carried_by is none.",
            whyItMatters: "Object location and holder state must agree before physical use, transfer, or possession can compile deterministically."
          })
        ]
      : [];
  });
}

function validateRelationshipSelfReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    if (record.type !== "RELATIONSHIP") {
      return [];
    }

    const payload = objectPayload(record);

    return isText(payload.from) && payload.from === payload.to
      ? [
          blocker({
            code: DIAGNOSTIC_CODES.relationshipSelfReference,
            recordId: record.id,
            field: "RELATIONSHIP.from/to",
            message: "Relationship endpoints reference the same record.",
            whyItMatters: "A relationship record must model pressure between distinct endpoints; self-reference makes the social pressure ambiguous."
          })
        ]
      : [];
  });
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
    ? record.payload as Record<string, unknown>
    : {};
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isUuid(value: unknown): value is string {
  return isText(value) && uuidPattern.test(value);
}

function blocker(input: {
  code: string;
  message: string;
  whyItMatters: string;
  field: string;
  recordId?: string;
}): Diagnostic {
  return {
    severity: "blocker",
    code: input.code,
    message: input.message,
    affected: [input.recordId ? { recordId: input.recordId, field: input.field } : { field: input.field }],
    whyItMatters: input.whyItMatters,
    suggestedActions: ["revise", "remove", "deselect"]
  };
}
