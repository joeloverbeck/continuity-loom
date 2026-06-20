import { resolveEffectivePov } from "../../records/effective-pov.js";
import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

export const knowledgeMatrixRules: readonly ValidationRule[] = Object.freeze([
  validateIntrospectionExpected,
  validateAmbiguousPerceptionExpected,
  validateSecretOrCluePressure,
  validateNonPovHiddenPlanBehavior
]);

function validateIntrospectionExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "introspection_expected")) {
    return [];
  }

  const pov = selectedPov(snapshot);
  const hasPovBelief = !!pov && snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return record.type === "BELIEF" && payload.holder === pov && hasText(payload.claim);
  });
  const hasPovEmotion = !!pov && snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return record.type === "EMOTION" && payload.holder === pov && hasText(payload.surface_expression);
  });
  const proseMode = snapshot.storyConfig.proseMode;
  const hasInteriorityMode = !!proseMode && hasText(proseMode.psychic_distance) && hasText(proseMode.interiority_mode);
  const hasNonPovRestriction = currentLocks(snapshot).some((lock) => lock.toLowerCase().includes("non-pov interiority"));

  if (hasPovBelief && hasPovEmotion && hasInteriorityMode && hasNonPovRestriction) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
      field: "generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes",
      message: "Introspection focus lacks POV belief, emotion pressure, prose-mode, or non-POV interiority constraints.",
      whyItMatters: "Introspection must be bounded by what the POV believes, feels, and is allowed to know without leaking non-POV interiority.",
      suggestedActions: ["add-knowledge-constraint", "add-current-state"]
    })
  ];
}

function validateAmbiguousPerceptionExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "ambiguous_perception_expected")) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;
  const hasPerceptionBoundary = currentLocks(snapshot).some((lock) => {
    const normalized = lock.toLowerCase();

    return normalized.includes("pov cannot perceive") || normalized.includes("misread") || normalized.includes("uncertain");
  });
  const hasPovKnowledgeDifference = snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return (
      (record.type === "SECRET" && hasText(payload.audience_visibility) && payload.pov_access !== "knows") ||
      (record.type === "BELIEF" && hasText(payload.truth_relation))
    );
  });

  if (
    state &&
    hasText(state.line_of_sight_and_visibility) &&
    hasValue(state.visible_conditions) &&
    hasPerceptionBoundary &&
    hasPovKnowledgeDifference
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
      field: "generationSession.current_authoritative_state",
      message: "Ambiguous perception focus lacks line-of-sight, uncertainty, POV perception limits, or audience/writer knowledge difference.",
      whyItMatters: "Ambiguous perception must identify what can be perceived, what cannot, and where the audience or writer may know more than the POV.",
      suggestedActions: ["add-current-state", "add-knowledge-constraint"]
    })
  ];
}

function validateSecretOrCluePressure(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "secret_or_clue_pressure")) {
    return [];
  }

  const activeSecrets = snapshot.records.filter((record) => {
    const payload = objectPayload(record);

    return record.type === "SECRET" && (payload.status === "hidden" || payload.status === "partially_revealed");
  });

  if (
    activeSecrets.length > 0 &&
    activeSecrets.every((record) => {
      const payload = objectPayload(record);

      return (
        hasText(payload.secret_claim) &&
        hasValue(payload.holders) &&
        hasValue(payload.non_holders_to_protect) &&
        hasText(payload.pov_access) &&
        hasText(payload.audience_visibility) &&
        hasValue(payload.allowed_surface_cues) &&
        hasValue(payload.forbidden_reveals) &&
        hasText(payload.reveal_permission)
      );
    })
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
      field: "SECRET",
      message: "Secret or clue pressure focus lacks a complete active secret/reveal lane.",
      whyItMatters: "Secret pressure needs claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, and reveal permission.",
      suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
    })
  ];
}

function validateNonPovHiddenPlanBehavior(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "non_pov_hidden_plan_behavior")) {
    return [];
  }

  const pov = selectedPov(snapshot);
  const statuses = new Map(
    snapshot.records
      .filter((record) => record.type === "ENTITY STATUS")
      .map((record) => [objectPayload(record).entity_id, objectPayload(record)])
      .filter((entry): entry is [string, Record<string, unknown>] => hasText(entry[0]))
  );
  const hasNonPovRestriction = currentLocks(snapshot).some((lock) => lock.toLowerCase().includes("non-pov interiority"));
  const validPlan = snapshot.records.some((record) => {
    if (record.type !== "PLAN") {
      return false;
    }

    const payload = objectPayload(record);
    const holder = payload.holder;

    if (!hasText(holder) || holder === pov || payload.visibility_to_pov !== "hidden") {
      return false;
    }

    const status = statuses.get(holder);

    return (
      !!status &&
      status.location !== "unknown" &&
      status.location !== "not_applicable" &&
      hasText(payload.current_step) &&
      hasText(payload.visibility_to_pov) &&
      (hasValue(payload.resources) || hasValue(payload.blockers) || hasValue(payload.fallback_steps)) &&
      hasNonPovRestriction
    );
  });

  if (validPlan) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
      field: "PLAN",
      message: "Non-POV hidden plan focus lacks holder status, means, current step, POV visibility, or non-interiority constraint.",
      whyItMatters: "A hidden non-POV plan can shape behavior only through deterministic external cues, not leaked interiority.",
      suggestedActions: ["add-knowledge-constraint", "add-current-state"]
    })
  ];
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

function selectedPov(snapshot: ValidationSnapshot): string | undefined {
  return resolveEffectivePov(snapshot);
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
