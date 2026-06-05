import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

export const durableChangeMatrixRules: readonly ValidationRule[] = Object.freeze([
  rule("object_use_possible", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "OBJECT", "Object use focus lacks object state, usable affordance, current positions, visibility, or constraints.", objectUseReady),
  rule("object_transfer_possible", DIAGNOSTIC_CODES.matrixObjectTransferIncomplete, "OBJECT", "Object transfer focus lacks object holder/location state, body positions, consent/force, transfer route, or resulting holder state.", objectTransferReady),
  rule("location_change_possible", DIAGNOSTIC_CODES.matrixLocationChangeIncomplete, "generationSession.current_authoritative_state.routes_and_exits", "Location change focus lacks source location, reachable route, available time, movement constraints, or arrival consequence.", locationChangeReady),
  rule("restraint_or_coercion_possible", DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete, "generationSession.current_authoritative_state.consent_or_force_conditions", "Restraint or coercion focus lacks agency/status, consent/force, positions, exits, power relationship, time, or constraints.", restraintReady),
  rule("intimacy_or_sex_possible", DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete, "generationSession.current_authoritative_state.consent_or_force_conditions", "Intimacy or sex focus lacks active cast status, content-envelope consistency, consent/force, privacy/body positions, relationship pressure, or affordance state.", intimacyReady),
  rule("violence_or_injury_possible", DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete, "generationSession.current_authoritative_state.consent_or_force_conditions", "Violence or injury focus lacks agency/status, positions, force conditions, injury consequence, visibility, time, or location constraints.", violenceReady),
  rule("institutional_involvement_possible", DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete, "ENTITY", "Institutional involvement focus lacks an institution/entity, communication/access route, authority relation, or current opportunity.", institutionalReady),
  rule("clock_tick_possible", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "CLOCK", "Clock tick focus lacks active clock pressure, tick trigger, next threshold, possible effects, or a concrete visible cause.", clockTickReady),
  rule("obligation_breach_possible", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "OBLIGATION", "Obligation breach focus lacks obligation terms, parties, visibility, consequence, or current opportunity pressure.", obligationReady)
]);

function rule(
  tag: string,
  code: string,
  field: string,
  message: string,
  predicate: (snapshot: ValidationSnapshot) => boolean
): ValidationRule {
  return (snapshot) => {
    if (!hasFocusTag(snapshot, tag) || predicate(snapshot)) {
      return [];
    }

    return [
      blocker({
        code,
        field,
        message,
        whyItMatters: "Durable-change tags are validation gates; they require explicit state support before the writer can be asked to render durable change.",
        suggestedActions: ["add-current-state", "add-route"]
      })
    ];
  };
}

function objectUseReady(snapshot: ValidationSnapshot): boolean {
  return hasObjectState(snapshot) && hasAffordance(snapshot, "use") && physicalStateReady(snapshot);
}

function objectTransferReady(snapshot: ValidationSnapshot): boolean {
  return hasObjectState(snapshot) && hasAffordance(snapshot, "transfer") && physicalStateReady(snapshot) && hasText(state(snapshot)?.consent_or_force_conditions) && hasLock(snapshot, "resulting holder");
}

function locationChangeReady(snapshot: ValidationSnapshot): boolean {
  const currentState = state(snapshot);

  return !!currentState && hasText(currentState.current_location) && hasValue(currentState.routes_and_exits) && hasText(currentState.available_time) && hasLock(snapshot, "destination") && hasLock(snapshot, "movement constraint");
}

function restraintReady(snapshot: ValidationSnapshot): boolean {
  return hasEntityStatus(snapshot) && physicalStateReady(snapshot) && hasText(state(snapshot)?.consent_or_force_conditions) && hasLock(snapshot, "power relationship") && hasLock(snapshot, "physical constraint");
}

function intimacyReady(snapshot: ValidationSnapshot): boolean {
  const policy = snapshot.storyConfig.universalContentPolicy?.allowed_content_scope ?? "";

  return hasEntityStatus(snapshot) && physicalStateReady(snapshot) && hasText(state(snapshot)?.consent_or_force_conditions) && hasRelationshipOrEmotion(snapshot) && hasAffordance(snapshot, "bond") && !policy.toLowerCase().includes("no intimacy");
}

function violenceReady(snapshot: ValidationSnapshot): boolean {
  return hasEntityStatus(snapshot) && physicalStateReady(snapshot) && hasText(state(snapshot)?.consent_or_force_conditions) && hasAffordance(snapshot, "harm") && hasRecord(snapshot, "CONSEQUENCE") && hasLock(snapshot, "injury consequence");
}

function institutionalReady(snapshot: ValidationSnapshot): boolean {
  return hasInstitution(snapshot) && hasValue(state(snapshot)?.routes_and_exits) && hasLock(snapshot, "authority relation") && hasLock(snapshot, "current opportunity");
}

function clockTickReady(snapshot: ValidationSnapshot): boolean {
  const clock = snapshot.records.find((record) => {
    const payload = objectPayload(record);

    return record.type === "CLOCK" && payload.status === "active";
  });

  if (!clock) {
    return false;
  }

  const payload = objectPayload(clock);

  return hasText(payload.current_pressure) && hasText(payload.tick_trigger) && hasText(payload.next_threshold) && hasValue(payload.possible_effects) && hasLock(snapshot, "clock tick cause");
}

function obligationReady(snapshot: ValidationSnapshot): boolean {
  const obligation = snapshot.records.find((record) => {
    const payload = objectPayload(record);

    return record.type === "OBLIGATION" && (payload.status === "open" || payload.status === "escalated");
  });

  if (!obligation) {
    return false;
  }

  const payload = objectPayload(obligation);

  return hasText(payload.terms) && hasValue(payload.owed_by) && hasValue(payload.owed_to) && hasText(payload.visibility) && hasText(payload.consequence_if_broken) && hasLock(snapshot, "obligation opportunity");
}

function hasObjectState(snapshot: ValidationSnapshot): boolean {
  return snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return (
      record.type === "OBJECT" &&
      hasText(payload.owner) &&
      hasText(payload.carried_by) &&
      hasText(payload.current_location) &&
      hasText(payload.visibility_to_pov) &&
      hasValue(payload.usable_affordances)
    );
  });
}

function hasAffordance(snapshot: ValidationSnapshot, actionFamily: string): boolean {
  return snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return record.type === "VISIBLE AFFORDANCE" && Array.isArray(payload.action_families) && payload.action_families.includes(actionFamily) && hasText(payload.prompt_text);
  });
}

function physicalStateReady(snapshot: ValidationSnapshot): boolean {
  const currentState = state(snapshot);

  return !!currentState && hasValue(currentState.positions) && hasText(currentState.line_of_sight_and_visibility) && hasValue(currentState.routes_and_exits) && hasText(currentState.available_time);
}

function hasEntityStatus(snapshot: ValidationSnapshot): boolean {
  return snapshot.records.some((record) => record.type === "ENTITY STATUS");
}

function hasRelationshipOrEmotion(snapshot: ValidationSnapshot): boolean {
  return snapshot.records.some((record) => record.type === "RELATIONSHIP" || record.type === "EMOTION");
}

function hasInstitution(snapshot: ValidationSnapshot): boolean {
  return snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return record.type === "ENTITY" && (payload.entity_kind === "institution" || payload.entity_kind === "faction" || payload.entity_kind === "system");
  });
}

function hasRecord(snapshot: ValidationSnapshot, type: string): boolean {
  return snapshot.records.some((record) => record.type === type);
}

function hasLock(snapshot: ValidationSnapshot, marker: string): boolean {
  return (state(snapshot)?.current_locks ?? []).some((lock) => lock.toLowerCase().includes(marker));
}

function state(snapshot: ValidationSnapshot) {
  return snapshot.generationSession.current_authoritative_state;
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
