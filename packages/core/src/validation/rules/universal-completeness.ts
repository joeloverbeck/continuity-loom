import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

const PERSON_LIKE_ENTITY_KINDS = new Set(["person", "animal", "place_agent", "object_agent", "supernatural_force", "other"]);
const PHYSICAL_FOCUS_TAGS = new Set([
  "physical_interaction_expected",
  "object_use_possible",
  "object_transfer_possible",
  "location_change_possible",
  "restraint_or_coercion_possible",
  "intimacy_or_sex_possible",
  "violence_or_injury_possible"
]);

export const universalCompletenessRules: readonly ValidationRule[] = Object.freeze([
  validateStoryConfig,
  validateGenerationBriefSurfaces,
  validatePovKnowledgeProfile,
  validateActiveSecrets,
  validateActivePhysicalContext,
  validateActiveCast,
  validateGenerationContextFocus
]);

function validateStoryConfig(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { storyContract, universalContentPolicy, proseMode } = snapshot.storyConfig;

  if (
    !storyContract ||
    !hasText(storyContract.title) ||
    !hasText(storyContract.premise) ||
    !hasValue(storyContract.genre_mode) ||
    !hasValue(storyContract.tone) ||
    !hasText(storyContract.content_intensity) ||
    !hasText(storyContract.explicitness) ||
    !hasText(storyContract.language_register) ||
    !prosePreferencesPresent(storyContract.prose_preferences)
  ) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingStoryConfig,
        field: "storyConfig.storyContract",
        message: "Story contract is missing required launch context.",
        whyItMatters: "The prompt cannot carry story identity, tone, content envelope, or prose preferences without the story contract.",
        suggestedActions: ["revise"]
      })
    );
  }

  if (
    !universalContentPolicy ||
    !hasText(universalContentPolicy.rating_label) ||
    !hasText(universalContentPolicy.allowed_content_scope) ||
    !hasText(universalContentPolicy.tonal_handling) ||
    !hasText(universalContentPolicy.governing_policy_note)
  ) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingStoryConfig,
        field: "storyConfig.universalContentPolicy",
        message: "Universal content policy is missing required launch context.",
        whyItMatters: "The prompt cannot state the governing content envelope or provider-policy handling without this policy.",
        suggestedActions: ["revise"]
      })
    );
  }

  if (
    !proseMode ||
    !hasText(proseMode.pov_character) ||
    !hasText(proseMode.person) ||
    !hasText(proseMode.tense) ||
    !hasText(proseMode.interiority_mode) ||
    !hasText(proseMode.language_output)
  ) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingStoryConfig,
        field: "storyConfig.proseMode",
        message: "Prose mode is missing required launch context.",
        whyItMatters: "The prompt cannot deterministically set POV, person, tense, interiority, or language output without prose mode.",
        suggestedActions: ["revise"]
      })
    );
  }

  return diagnostics;
}

function validateGenerationBriefSurfaces(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const session = snapshot.generationSession;
  const state = session.current_authoritative_state;
  const handoff = session.immediate_handoff;
  const directive = session.manual_moment_directive;
  const generationContext = session.generation_validation_focus?.validation_focus_tags?.generation_context?.[0];

  if (
    !state ||
    !hasText(state.current_time) ||
    !hasText(state.current_location) ||
    !hasValue(state.onstage_entities) ||
    !hasText(state.immediate_situation_summary)
  ) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
        field: "generationSession.current_authoritative_state",
        message: "Current authoritative state is missing required launch context.",
        whyItMatters: "The prompt needs current time, location, onstage entities, and an immediate situation summary as deterministic continuity ground.",
        suggestedActions: ["add-current-state"]
      })
    );
  }

  if (
    generationContext === "continuation_after_accepted_segment" &&
    (!handoff ||
      !hasText(handoff.recent_causal_context) ||
      !hasText(handoff.last_visible_moment) ||
      !hasText(handoff.prior_accepted_prose_status_or_handoff_note) ||
      !hasText(handoff.begin_after))
  ) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingImmediateHandoff,
        field: "generationSession.immediate_handoff",
        message: "Immediate handoff is missing required launch context.",
        whyItMatters: "The prompt needs a user-authored recent causal bridge, last visible moment, accepted-prose status note, and begin-after point.",
        suggestedActions: ["revise"]
      })
    );
  }

  if (!directive || !hasValue(directive.must_render)) {
    diagnostics.push(
      blocker({
        code: DIAGNOSTIC_CODES.missingManualDirective,
        field: "generationSession.manual_moment_directive.must_render",
        message: "Manual moment directive needs at least one must-render instruction.",
        whyItMatters: "The prose writer needs a local, user-authored launch instruction instead of inferring the next story move.",
        suggestedActions: ["change-directive"]
      })
    );
  }

  return diagnostics;
}

function validatePovKnowledgeProfile(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const pov = selectedPov(snapshot);

  if (!pov || pov === "omniscient") {
    return [];
  }

  if (snapshot.records.some((record) => recordCarriesPovKnowledge(record, pov))) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.povKnowledgeMissing,
      field: "generationSession.active_working_set.selected_pov",
      message: "Selected non-omniscient POV has no selected knowledge profile.",
      whyItMatters: "A non-omniscient prompt needs deterministic selected facts, beliefs, secrets, events, or status records to bound what the POV can know.",
      suggestedActions: ["add-knowledge-constraint"]
    })
  ];
}

function validateActiveSecrets(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const cluePressure = hasFocusTag(snapshot, "secret_or_clue_pressure");

  return activeSecrets(snapshot).flatMap((record) => {
    const payload = objectPayload(record);
    const missingCues = cluePressure && !hasValue(payload.allowed_surface_cues);

    if (
      !hasValue(payload.holders) ||
      !hasValue(payload.non_holders_to_protect) ||
      !hasValue(payload.forbidden_reveals) ||
      !hasText(payload.reveal_permission) ||
      missingCues
    ) {
      return [
        blocker({
          code: DIAGNOSTIC_CODES.activeSecretIncomplete,
          recordId: record.id,
          field: missingCues ? "allowed_surface_cues" : "SECRET",
          message: "Active secret is missing required reveal-boundary fields.",
          whyItMatters: "Active secrets need holders, protected non-holders, forbidden reveals, reveal permission, and clue cues when clue pressure is active.",
          suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
        })
      ];
    }

    return [];
  });
}

function validateActivePhysicalContext(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasActivePhysicalInteraction(snapshot)) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;

  if (
    state &&
    hasText(state.current_location) &&
    hasValue(state.onstage_entities) &&
    hasValue(state.positions) &&
    (!objectsMatter(snapshot) || hasValue(state.possessions)) &&
    hasText(state.line_of_sight_and_visibility) &&
    hasValue(state.routes_and_exits) &&
    hasText(state.available_time) &&
    Array.isArray(state.current_locks)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.activePhysicalContextIncomplete,
      field: "generationSession.current_authoritative_state",
      message: "Active physical interaction is missing required physical continuity context.",
      whyItMatters: "Physical action needs location, onstage entities, positions, possession state when objects matter, visibility, routes, time, and impossible-action locks.",
      suggestedActions: ["add-current-state", "add-route"]
    })
  ];
}

function validateActiveCast(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return materialCastRecords(snapshot).flatMap((record) => {
    const payload = objectPayload(record);

    if (record.localFunction && castCoreDossierPresent(payload)) {
      return [];
    }

    return [
      blocker({
        code: DIAGNOSTIC_CODES.activeCastIncomplete,
        recordId: record.id,
        field: "CAST MEMBER",
        message: "Active onstage cast member is missing a local function or core dossier.",
        whyItMatters: "Materially involved cast need identity, voice, pressure behavior, body presence, agency, and current local function to avoid generic rendering.",
        suggestedActions: ["promote-cast", "add-voice-or-body-pressure"]
      })
    ];
  });
}

function validateGenerationContextFocus(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const contextTags = snapshot.generationSession.generation_validation_focus?.validation_focus_tags?.generation_context;

  if (!contextTags || contextTags.length <= 1) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.focusTagCountInvalid,
      field: "generationSession.generation_validation_focus.validation_focus_tags.generation_context",
      message: "Generation validation focus must identify exactly one generation context.",
      whyItMatters: "The engine must know whether this is a first segment or a continuation before applying contextual validation.",
      suggestedActions: ["revise"]
    })
  ];
}

function blocker(input: {
  code: string;
  message: string;
  field: string;
  recordId?: string;
  whyItMatters: string;
  suggestedActions: readonly SuggestedAction[];
}): Diagnostic {
  return {
    severity: "blocker",
    code: input.code,
    message: input.message,
    affected: [input.recordId ? { recordId: input.recordId, field: input.field } : { field: input.field }],
    whyItMatters: input.whyItMatters,
    suggestedActions: input.suggestedActions
  };
}

function selectedPov(snapshot: ValidationSnapshot): string | undefined {
  return snapshot.generationSession.active_working_set?.selected_pov ?? snapshot.storyConfig.proseMode?.pov_character;
}

function recordCarriesPovKnowledge(record: ValidationRecord, pov: string): boolean {
  const payload = objectPayload(record);

  if (record.type === "FACT" || record.type === "EVENT") {
    return Array.isArray(payload.known_by) ? payload.known_by.includes(pov) : payload.known_by === "public";
  }

  if (record.type === "BELIEF") {
    return payload.holder === pov;
  }

  if (record.type === "SECRET") {
    return Array.isArray(payload.holders) && payload.holders.includes(pov);
  }

  if (record.type === "ENTITY STATUS") {
    return payload.entity_id === pov;
  }

  return false;
}

function activeSecrets(snapshot: ValidationSnapshot): readonly ValidationRecord[] {
  return snapshot.records.filter((record) => {
    const payload = objectPayload(record);

    return record.type === "SECRET" && (payload.status === "hidden" || payload.status === "partially_revealed");
  });
}

function hasActivePhysicalInteraction(snapshot: ValidationSnapshot): boolean {
  return focusTags(snapshot).some((tag) => PHYSICAL_FOCUS_TAGS.has(tag));
}

function objectsMatter(snapshot: ValidationSnapshot): boolean {
  return hasFocusTag(snapshot, "object_use_possible") || hasFocusTag(snapshot, "object_transfer_possible");
}

function materialCastRecords(snapshot: ValidationSnapshot): readonly ValidationRecord[] {
  const entityKinds = new Map<string, string>(
    snapshot.records
      .filter((record) => record.type === "ENTITY")
      .flatMap((record) => {
        const entityKind = objectPayload(record).entity_kind;

        return typeof entityKind === "string" ? [[record.id, entityKind]] : [];
      })
  );

  return snapshot.records.filter((record) => {
    if (record.type !== "CAST MEMBER" || record.castBand !== "active_onstage_cast_full") {
      return false;
    }

    const entityId = objectPayload(record).entity_id;
    const entityKind = typeof entityId === "string" ? entityKinds.get(entityId) : undefined;

    return !entityKind || PERSON_LIKE_ENTITY_KINDS.has(entityKind);
  });
}

function castCoreDossierPresent(payload: Record<string, unknown>): boolean {
  return (
    hasObject(payload.identity) &&
    hasObject(payload.voice_anchor) &&
    hasObject(payload.pressure_behavior_core) &&
    hasObject(payload.body_presence_core) &&
    hasObject(payload.agency_core)
  );
}

function prosePreferencesPresent(value: unknown): boolean {
  if (!hasObject(value)) {
    return false;
  }

  return (
    hasText(value.psychic_distance) &&
    hasText(value.dialogue_density) &&
    hasText(value.interiority) &&
    hasText(value.paragraphing)
  );
}

function hasFocusTag(snapshot: ValidationSnapshot, tag: string): boolean {
  return focusTags(snapshot).includes(tag);
}

function focusTags(snapshot: ValidationSnapshot): readonly string[] {
  const tags = snapshot.generationSession.generation_validation_focus?.validation_focus_tags;

  return [
    ...(tags?.generation_context ?? []),
    ...(tags?.expected_local_modes ?? []),
    ...(tags?.possible_durable_changes ?? [])
  ];
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return hasObject(record.payload) ? record.payload : {};
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return hasText(value);
  }

  return value !== undefined && value !== null;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
