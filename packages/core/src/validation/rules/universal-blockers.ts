import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

const NON_LOCAL_MARKERS = [
  "whole chapter",
  "entire chapter",
  "chapter outline",
  "global outline",
  "alternate options",
  "downstream consequence",
  "downstream summary",
  "plot beat",
  "beat package",
  "act package",
  "chapter package",
  "plot arc",
  "story arc",
  "milestone",
  "multiple response points",
  "several response points"
];
const CONTAMINATION_MARKERS = [
  "verbatim accepted prose",
  "copied accepted prose",
  "accepted segment text",
  "rejected candidate",
  "superseded regeneration",
  "automatic prose-derived summary",
  "auto-summary",
  "prose-mined continuity"
];
const CONTINUATION_MARKERS = ["as above", "as before", "from the previous segment", "continue from last time"];
const UNABLE_LIFE = new Set(["dead"]);
const UNABLE_AGENCY = new Set(["captive", "incapacitated", "unconscious"]);

export const universalBlockerRules: readonly ValidationRule[] = Object.freeze([
  validateLocalProseOnly,
  validateDirectiveStopAgreement,
  validateStateHandoffAgreement,
  validateEntityLocations,
  validateObjectHolders,
  validateActivePlanHolders,
  validateSecretFirewall,
  validateOffstageInterruptionRoute,
  validatePhysicalActionContext,
  validateDialogueVoicePressure,
  validateContentEnvelope,
  validatePromptFacingContamination,
  validateGenerationContextRows,
  validateConstitutionalSections
]);

function validateLocalProseOnly(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const promptFacing = promptFacingFields(snapshot);
  const offenders = promptFacing.filter((entry) => containsAny(entry.text, NON_LOCAL_MARKERS));

  return offenders.map((entry) =>
    blocker({
      code: DIAGNOSTIC_CODES.localProseScopeViolation,
      field: entry.field,
      message: "Directive or stop guidance asks for non-local prose scope.",
      whyItMatters: "Generation must render only the next local prose unit, not chapters, outlines, plot packages, or multiple response points.",
      suggestedActions: entry.field.includes("stop_guidance") ? ["change-stop-guidance"] : ["change-directive"]
    })
  );
}

function validateDirectiveStopAgreement(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const directiveText = promptFacingDirectiveText(snapshot);
  const stopText = snapshot.generationSession.stop_guidance?.soft_unit_guidance ?? "";

  if (
    (containsAny(directiveText, ["continue through", "do not stop", "keep going until"]) &&
      containsAny(stopText, ["stop after", "first response point", "next response point"])) ||
    (containsAny(directiveText, ["stop immediately", "single line"]) && containsAny(stopText, ["continue through", "later consequence"]))
  ) {
    return [
      blocker({
        code: DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
        field: "generationSession.manual_moment_directive",
        message: "Manual directive and stop guidance disagree about the local unit.",
        whyItMatters: "The prompt cannot deterministically tell the writer both to continue past and stop at the same local boundary.",
        suggestedActions: ["change-directive", "change-stop-guidance"]
      })
    ];
  }

  return [];
}

function validateStateHandoffAgreement(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const state = snapshot.generationSession.current_authoritative_state;
  const handoff = snapshot.generationSession.immediate_handoff;

  if (!state || !handoff) {
    return [];
  }

  const handoffText = [
    handoff.recent_causal_context,
    handoff.last_visible_moment,
    handoff.begin_after
  ].join("\n");

  if (containsAny(handoffText, ["contradicts current state", "not the current state"])) {
    return [
      blocker({
        code: DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
        field: "generationSession.immediate_handoff",
        message: "Immediate handoff explicitly contradicts current authoritative state.",
        whyItMatters: "The prompt cannot launch from one current state while the handoff tells the writer a different state is true.",
        suggestedActions: ["revise", "add-current-state"]
      })
    ];
  }

  return [];
}

function validateEntityLocations(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const byEntity = new Map<string, Map<string, string[]>>();

  for (const record of snapshot.records) {
    if (record.type !== "ENTITY STATUS") {
      continue;
    }

    const payload = objectPayload(record);

    if (!isText(payload.entity_id) || !isText(payload.location) || payload.location === "unknown") {
      continue;
    }

    const locations = byEntity.get(payload.entity_id) ?? new Map<string, string[]>();
    const recordIds = locations.get(payload.location) ?? [];
    recordIds.push(record.id);
    locations.set(payload.location, recordIds);
    byEntity.set(payload.entity_id, locations);
  }

  return [...byEntity.entries()].flatMap(([entityId, locations]) => {
    if (locations.size < 2) {
      return [];
    }

    return [
      blocker({
        code: DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
        recordId: entityId,
        field: "ENTITY STATUS.location",
        message: "Selected records place one entity in more than one current location.",
        whyItMatters: "A character or entity cannot be physically current in two different places unless the records explicitly model a special means.",
        suggestedActions: ["revise", "remove", "deselect"]
      })
    ];
  });
}

function validateObjectHolders(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    if (record.type !== "OBJECT") {
      return [];
    }

    const payload = objectPayload(record);

    if (isText(payload.owner) && isText(payload.carried_by) && !["none", "unknown"].includes(payload.owner) && !["none", "unknown"].includes(payload.carried_by) && payload.owner !== payload.carried_by) {
      return [
        blocker({
          code: DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
          recordId: record.id,
          field: "OBJECT.owner/carried_by",
          message: "Selected object has two different current holders.",
          whyItMatters: "Object possession must be deterministic before the prompt can render use, transfer, loss, or physical action.",
          suggestedActions: ["revise", "remove", "deselect"]
        })
      ];
    }

    return [];
  });
}

function validateActivePlanHolders(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const statuses = new Map(
    snapshot.records
      .filter((record) => record.type === "ENTITY STATUS")
      .map((record) => [objectPayload(record).entity_id, objectPayload(record)])
      .filter((entry): entry is [string, Record<string, unknown>] => isText(entry[0]))
  );

  return snapshot.records.flatMap((record) => {
    if (record.type !== "PLAN") {
      return [];
    }

    const payload = objectPayload(record);

    if (payload.plan_status !== "active" || payload.can_drive_prose === false || !isText(payload.holder)) {
      return [];
    }

    const status = statuses.get(payload.holder);

    if (
      status &&
      (UNABLE_LIFE.has(String(status.life)) ||
        UNABLE_AGENCY.has(String(status.agency)) ||
        status.location === "offstage") &&
      !hasPlausibleMeans(payload)
    ) {
      return [
        blocker({
          code: DIAGNOSTIC_CODES.inactivePlanHolder,
          recordId: record.id,
          field: "PLAN.holder",
          message: "Active plan is held by an entity that currently cannot plausibly act.",
          whyItMatters: "A plan cannot drive local prose if its holder is dead, captive, unconscious, incapacitated, absent, or otherwise without means.",
          suggestedActions: ["revise", "deselect"]
        })
      ];
    }

    return [];
  });
}

function validateSecretFirewall(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const pov = selectedPov(snapshot);

  if (!pov || pov === "omniscient") {
    return [];
  }

  return snapshot.records.flatMap((record) => {
    if (record.type !== "SECRET") {
      return [];
    }

    const payload = objectPayload(record);
    const knownByPov = Array.isArray(payload.holders) && payload.holders.includes(pov);
    const protectedFromPov =
      (Array.isArray(payload.non_holders_to_protect) && payload.non_holders_to_protect.includes(pov)) ||
      payload.non_holders_to_protect === "all_except_holders";
    const diagnostics: Diagnostic[] = [];

    if (knownByPov && protectedFromPov && payload.pov_access !== "knows_partly") {
      diagnostics.push(
        blocker({
          code: DIAGNOSTIC_CODES.secretRevealContradiction,
          recordId: record.id,
          field: "SECRET.holders/non_holders_to_protect",
          message: "Selected secret is both known by and hidden from the selected POV.",
          whyItMatters: "The prompt must not give a POV both protected ignorance and confirmed knowledge of the same secret.",
          suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
        })
      );
    }

    if (payload.pov_access === "hidden" && knownByPov) {
      diagnostics.push(
        blocker({
          code: DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
          recordId: record.id,
          field: "SECRET.pov_access",
          message: "Hidden secret truth appears in a POV knowledge field.",
          whyItMatters: "A hidden truth cannot be simultaneously modeled as POV-held knowledge without breaking reveal discipline.",
          suggestedActions: ["add-knowledge-constraint"]
        })
      );
    }

    return diagnostics;
  });
}

function validateOffstageInterruptionRoute(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "offstage_interruption_possible")) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;

  if (state && hasValue(state.offstage_pressuring_entities) && hasValue(state.routes_and_exits) && hasText(state.available_time)) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
      field: "generationSession.current_authoritative_state",
      message: "Offstage interruption lacks route, timing, communication, or awareness context.",
      whyItMatters: "An offstage interruption needs a deterministic way to enter, communicate, be heard, or arrive at the local moment.",
      suggestedActions: ["add-current-state", "add-route"]
    })
  ];
}

function validatePhysicalActionContext(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasPhysicalAction(snapshot)) {
    return [];
  }

  const state = snapshot.generationSession.current_authoritative_state;

  if (
    state &&
    hasValue(state.onstage_entities) &&
    hasValue(state.positions) &&
    hasValue(state.routes_and_exits) &&
    hasText(state.line_of_sight_and_visibility) &&
    hasText(state.available_time) &&
    hasText(state.consent_or_force_conditions)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
      field: "generationSession.current_authoritative_state",
      message: "Physical action lacks required bodies, routes, visibility, time, or consent/force context.",
      whyItMatters: "The prompt cannot safely render physical action without deterministic physical and consent/force conditions.",
      suggestedActions: ["add-current-state", "add-route"]
    })
  ];
}

function validateDialogueVoicePressure(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const activeSpeakerIds = new Set(
    snapshot.generationSession.active_working_set?.active_onstage_cast_full
      .filter((entry) => entry.local_function === "active_speaker" || entry.local_function === "pov_narrator")
      .map((entry) => entry.cast_member_id) ?? []
  );
  const pressuredIds = new Set(
    (snapshot.generationSession.current_cast_voice_pressure ?? [])
      .filter((entry) => entry.local_function === "active_speaker" || entry.local_function === "pov_narrator")
      .filter((entry) => hasText(entry.current_voice_pressure) || hasText(entry.dialogue_pressure))
      .map((entry) => entry.cast_member_id)
  );

  return [...activeSpeakerIds].flatMap((castId) => {
    const castRecord = snapshot.records.find((record) => record.id === castId && record.type === "CAST MEMBER");
    const hasVoiceAnchor = castRecord ? hasObject(objectPayload(castRecord).voice_anchor) : false;

    if (hasVoiceAnchor && pressuredIds.has(castId)) {
      return [];
    }

    return [
      blocker({
        code: DIAGNOSTIC_CODES.sparseVoicePressure,
        recordId: castId,
        field: "generationSession.current_cast_voice_pressure",
        message: "Active speaker lacks enough voice pressure for expected dialogue.",
        whyItMatters: "Dialogue or close POV needs a current voice/body pin so the prompt does not flatten the speaker into generic prose.",
        suggestedActions: ["add-voice-or-body-pressure"]
      })
    ];
  });
}

function validateContentEnvelope(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const policy = snapshot.storyConfig.universalContentPolicy?.allowed_content_scope ?? "";
  const directive = promptFacingDirectiveText(snapshot);

  if (containsAny(policy, ["non-explicit", "no explicit sex", "non-graphic"]) && containsAny(directive, ["explicit sex", "graphic sex", "graphic gore"])) {
    return [
      blocker({
        code: DIAGNOSTIC_CODES.contentEnvelopeContradiction,
        field: "storyConfig.universalContentPolicy.allowed_content_scope",
        message: "Manual directive contradicts the active content envelope.",
        whyItMatters: "The prompt cannot ask the provider to render material that the story configuration or policy envelope excludes.",
        suggestedActions: ["revise", "change-directive"]
      })
    ];
  }

  return [];
}

function validatePromptFacingContamination(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return promptFacingFields(snapshot)
    .filter((entry) => !isCleanAcceptedStatus(entry) && containsAny(entry.text, CONTAMINATION_MARKERS))
    .map((entry) =>
      blocker({
        code: DIAGNOSTIC_CODES.promptFacingProseContamination,
        field: entry.field,
        message: "Prompt-facing field appears to contain accepted, rejected, superseded, or automatic prose-derived text.",
        whyItMatters: "Accepted and candidate prose are not canon for future prompts; durable changes must be represented in records or current state.",
        suggestedActions: ["revise", "remove"]
      })
    );
}

function validateGenerationContextRows(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const context = snapshot.generationSession.generation_validation_focus?.validation_focus_tags.generation_context[0];
  const handoff = snapshot.generationSession.immediate_handoff;

  if (!context || !handoff) {
    return [];
  }

  const handoffText = [
    handoff.recent_causal_context,
    handoff.last_visible_moment,
    handoff.prior_accepted_prose_status_or_handoff_note,
    handoff.begin_after
  ].join("\n");

  if (context === "first_segment" && (!isCleanNoAcceptedProseNote(handoff.prior_accepted_prose_status_or_handoff_note) || containsAny(handoffText, CONTINUATION_MARKERS))) {
    return [
      blocker({
        code: DIAGNOSTIC_CODES.promptFacingProseContamination,
        field: "generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note",
        message: "First segment handoff must not depend on accepted prose or continuation phrasing.",
        whyItMatters: "A first segment prompt must be self-sufficient from current state and records.",
        suggestedActions: ["revise"]
      })
    ];
  }

  if (context === "continuation_after_accepted_segment" && containsAny(handoffText, CONTAMINATION_MARKERS)) {
    return [
      blocker({
        code: DIAGNOSTIC_CODES.promptFacingProseContamination,
        field: "generationSession.immediate_handoff",
        message: "Continuation handoff contains accepted/candidate prose contamination instead of user-authored state.",
        whyItMatters: "Continuation handoff may refer to user-authored durable state, but it must not paste candidate or accepted prose into prompt inputs.",
        suggestedActions: ["revise"]
      })
    ];
  }

  return [];
}

function validateConstitutionalSections(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (snapshot.versions.template && snapshot.versions.compiler) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.missingConstitutionalSection,
      field: "versions",
      message: "Template or compiler version is missing for constitutional prompt sections.",
      whyItMatters: "Required constitutional sections must have deterministic template and compiler sources before prompt compilation.",
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

function promptFacingFields(snapshot: ValidationSnapshot): readonly { field: string; text: string }[] {
  const session = snapshot.generationSession;
  const handoff = session.immediate_handoff;
  const directive = session.manual_moment_directive;
  const stopGuidance = session.stop_guidance;

  return [
    ...textEntry("generationSession.immediate_handoff.recent_causal_context", handoff?.recent_causal_context),
    ...textEntry("generationSession.immediate_handoff.last_visible_moment", handoff?.last_visible_moment),
    ...textEntry("generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note", handoff?.prior_accepted_prose_status_or_handoff_note),
    ...textEntry("generationSession.immediate_handoff.begin_after", handoff?.begin_after),
    ...textEntries("generationSession.manual_moment_directive.must_render", directive?.must_render),
    ...textEntries("generationSession.manual_moment_directive.may_render_if_naturally_caused", directive?.may_render_if_naturally_caused),
    ...textEntries("generationSession.manual_moment_directive.do_not_force", directive?.do_not_force),
    ...textEntry("generationSession.stop_guidance.soft_unit_guidance", stopGuidance?.soft_unit_guidance)
  ];
}

function promptFacingDirectiveText(snapshot: ValidationSnapshot): string {
  const directive = snapshot.generationSession.manual_moment_directive;

  return [
    ...(directive?.must_render ?? []),
    ...(directive?.may_render_if_naturally_caused ?? []),
    ...(directive?.do_not_force ?? [])
  ].join("\n");
}

function textEntry(field: string, value: unknown): readonly { field: string; text: string }[] {
  return isText(value) ? [{ field, text: value }] : [];
}

function textEntries(field: string, values: unknown): readonly { field: string; text: string }[] {
  return Array.isArray(values)
    ? values.flatMap((value, index) => textEntry(`${field}[${index}]`, value))
    : [];
}

function containsAny(text: string, markers: readonly string[]): boolean {
  const normalized = text.toLowerCase();

  return markers.some((marker) => normalized.includes(marker));
}

function isCleanAcceptedStatus(entry: { field: string; text: string }): boolean {
  return (
    entry.field === "generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note" &&
    isCleanNoAcceptedProseNote(entry.text)
  );
}

function isCleanNoAcceptedProseNote(text: string): boolean {
  return text.trim().toLowerCase() === "none. no accepted prose is included.";
}

function selectedPov(snapshot: ValidationSnapshot): string | undefined {
  return snapshot.generationSession.active_working_set?.selected_pov ?? snapshot.storyConfig.proseMode?.pov_character;
}

function hasPlausibleMeans(plan: Record<string, unknown>): boolean {
  return (
    hasValue(plan.resources) ||
    hasValue(plan.fallback_steps) ||
    (isText(plan.current_step) && containsAny(plan.current_step, ["remote", "message", "delegate", "proxy", "signal"]))
  );
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

function hasPhysicalAction(snapshot: ValidationSnapshot): boolean {
  return (
    hasFocusTag(snapshot, "physical_interaction_expected") ||
    hasFocusTag(snapshot, "object_use_possible") ||
    hasFocusTag(snapshot, "object_transfer_possible") ||
    hasFocusTag(snapshot, "location_change_possible") ||
    hasFocusTag(snapshot, "restraint_or_coercion_possible") ||
    hasFocusTag(snapshot, "intimacy_or_sex_possible") ||
    hasFocusTag(snapshot, "violence_or_injury_possible")
  );
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return hasObject(record.payload) ? record.payload : {};
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return isText(value) || (value !== undefined && value !== null);
}

function hasText(value: unknown): value is string {
  return isText(value) && value.trim().length > 0;
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function hasObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
