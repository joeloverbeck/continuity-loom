import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

const NON_PERSON_KINDS = new Set([
  "group",
  "institution",
  "faction",
  "family",
  "animal",
  "place_agent",
  "object_agent",
  "supernatural_force",
  "system",
  "other"
]);

export const physicalMatrixRules: readonly ValidationRule[] = Object.freeze([
  validatePhysicalInteractionExpected,
  validateOffstageInterruptionPossible,
  validateNonhumanOrInstitutionalPressureExpected
]);

function validatePhysicalInteractionExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "physical_interaction_expected")) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;

  if (
    state &&
    hasText(state.current_location) &&
    hasValue(state.onstage_entities) &&
    hasValue(state.positions) &&
    hasText(state.line_of_sight_and_visibility) &&
    hasValue(state.routes_and_exits) &&
    hasText(state.available_time) &&
    hasValue(state.current_locks)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
      field: "generationSession.current_authoritative_state",
      message: "Physical interaction focus lacks required physical continuity state.",
      whyItMatters: "Physical interaction requires location, onstage bodies, positions, visibility, routes, time, and impossible/unavailable action locks.",
      suggestedActions: ["add-current-state", "add-route"]
    })
  ];
}

function validateOffstageInterruptionPossible(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "offstage_interruption_possible")) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;
  const offstageIds = state?.offstage_pressuring_entities ?? [];
  const hasOffstageStatus = snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return (
      record.type === "ENTITY STATUS" &&
      hasText(payload.entity_id) &&
      offstageIds.includes(payload.entity_id) &&
      hasText(payload.location) &&
      hasText(payload.visibility_to_pov)
    );
  });
  const hasAwarenessMechanism = currentLocks(snapshot).some((lock) => {
    const normalized = lock.toLowerCase();

    return normalized.includes("awareness mechanism") || normalized.includes("interruption route") || normalized.includes("communication route");
  });

  if (
    state &&
    hasValue(offstageIds) &&
    hasOffstageStatus &&
    hasValue(state.routes_and_exits) &&
    hasText(state.available_time) &&
    hasAwarenessMechanism
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
      field: "generationSession.current_authoritative_state.offstage_pressuring_entities",
      message: "Offstage interruption focus lacks offstage status, awareness, route, timing, or communication mechanism.",
      whyItMatters: "An interruption must have a deterministic way to become locally perceptible or physically present.",
      suggestedActions: ["add-current-state", "add-route"]
    })
  ];
}

function validateNonhumanOrInstitutionalPressureExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "nonhuman_or_institutional_pressure_expected")) {
    return [];
  }

  const nonPerson = snapshot.records.find((record) => {
    const payload = objectPayload(record);

    return record.type === "ENTITY" && hasText(payload.entity_kind) && NON_PERSON_KINDS.has(payload.entity_kind);
  });

  if (!nonPerson) {
    return [nonhumanBlocker()];
  }

  const entityPayload = objectPayload(nonPerson);
  const status = snapshot.records.find((record) => {
    const payload = objectPayload(record);

    return record.type === "ENTITY STATUS" && payload.entity_id === nonPerson.id;
  });
  const hasMechanism = currentLocks(snapshot).some((lock) => {
    const normalized = lock.toLowerCase();

    return normalized.includes("pressure mechanism") || normalized.includes("authority relation") || normalized.includes("agency limit");
  });

  if (
    hasText(entityPayload.short_description) &&
    status &&
    hasText(objectPayload(status).location) &&
    hasMechanism
  ) {
    return [];
  }

  return [nonhumanBlocker()];
}

function nonhumanBlocker(): Diagnostic {
  return blocker({
    code: DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete,
    field: "ENTITY",
    message: "Nonhuman or institutional pressure focus lacks entity rules, reach/location, pressure mechanism, or agency/interiority limits.",
    whyItMatters: "Non-person pressure must be rendered through explicit operating rules and mechanisms, not inferred agency or hidden interiority.",
    suggestedActions: ["add-current-state", "add-knowledge-constraint"]
  });
}

function blocker(input: {
  code: string;
  message: string;
  field: string;
  whyItMatters: string;
  suggestedActions: readonly SuggestedAction[];
}): Diagnostic {
  return {
    severity: "blocker",
    code: input.code,
    message: input.message,
    affected: [{ field: input.field }],
    whyItMatters: input.whyItMatters,
    suggestedActions: input.suggestedActions
  };
}

function currentLocks(snapshot: ValidationSnapshot): readonly string[] {
  return snapshot.generationSession.current_authoritative_state?.current_locks ?? [];
}

function hasFocusTag(snapshot: ValidationSnapshot, tag: string): boolean {
  const tags = snapshot.generationSession.generation_validation_focus?.validation_focus_tags;
  const activeTags: readonly string[] = [
    ...(tags?.generation_context ?? []),
    ...(tags?.expected_local_modes ?? []),
    ...(tags?.possible_durable_changes ?? [])
  ];

  return activeTags.includes(tag);
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return hasObject(record.payload) ? record.payload : {};
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return hasText(value) || (value !== undefined && value !== null);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
