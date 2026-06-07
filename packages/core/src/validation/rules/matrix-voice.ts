import { DIAGNOSTIC_CODES, type Diagnostic, type SuggestedAction } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

const SPEAKING_FUNCTIONS = new Set(["active_speaker", "pov_narrator"]);

export const voiceMatrixRules: readonly ValidationRule[] = Object.freeze([
  validateDialogueExpected,
  validateEnsembleDialogueExpected,
  validateActiveSilentPresenceExpected,
  validatePresentMinorSpeechPossible
]);

function validateDialogueExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "dialogue_expected")) {
    return [];
  }

  const speakerIds = activeSpeakerIds(snapshot);

  if (
    speakerIds.length > 0 &&
    speakerIds.every((castId) => castHasVoiceAnchor(snapshot, castId)) &&
    hasText(snapshot.storyConfig.proseMode?.language_output) &&
    hasPovKnowledge(snapshot) &&
    hasRelationshipOrStatusContext(snapshot)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixDialogueIncomplete,
      field: "generationSession.active_working_set.active_onstage_cast_full",
      message: "Dialogue focus lacks active speaker voice anchors, language, knowledge, or relationship/status context.",
      whyItMatters: "Dialogue needs current speaker functions, durable voice anchors, and relationship/status context so active cast do not flatten into generic speech.",
      suggestedActions: ["add-voice-or-body-pressure", "add-knowledge-constraint"]
    })
  ];
}

function validateEnsembleDialogueExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "ensemble_dialogue_expected")) {
    return [];
  }

  const speakerIds = activeSpeakerIds(snapshot);
  const state = snapshot.generationSession.current_authoritative_state;

  if (
    speakerIds.length >= 3 &&
    speakerIds.every((castId) => castHasVoiceAnchor(snapshot, castId)) &&
    hasRelationshipOrStatusContext(snapshot) &&
    state &&
    hasText(state.line_of_sight_and_visibility) &&
    hasValue(state.positions)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
      field: "generationSession.active_working_set.active_onstage_cast_full",
      message: "Ensemble dialogue focus lacks three anchored speakers or audibility/relationship context.",
      whyItMatters: "Three or more speakers need durable voice anchors plus clear interruptibility/audibility and relationship/status state.",
      suggestedActions: ["add-voice-or-body-pressure", "add-current-state"]
    })
  ];
}

function validateActiveSilentPresenceExpected(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "active_silent_presence_expected")) {
    return [];
  }

  const silentIds = snapshot.generationSession.active_working_set?.active_onstage_cast_full
    .filter((entry) => entry.local_function === "active_silent")
    .map((entry) => entry.cast_member_id) ?? [];
  const state = snapshot.generationSession.current_authoritative_state;

  if (
    silentIds.length > 0 &&
    silentIds.every((castId) => castHasBodyPresence(snapshot, castId) && hasSilentPressure(snapshot, castId)) &&
    state &&
    hasValue(state.positions) &&
    hasText(state.line_of_sight_and_visibility) &&
    hasValue(state.current_locks)
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
      field: "generationSession.current_cast_voice_pressure",
      message: "Active silent presence focus lacks body dossier, position/visibility, silence pressure, or POV/action limits.",
      whyItMatters: "A silent onstage character still needs body presence and allowed nonverbal pressure to remain continuity-bearing.",
      suggestedActions: ["add-voice-or-body-pressure", "add-current-state"]
    })
  ];
}

function validatePresentMinorSpeechPossible(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "present_minor_speech_possible")) {
    return [];
  }

  const minorIds = snapshot.generationSession.active_working_set?.present_minor_cast_compressed ?? [];
  const promotedIds = new Set(snapshot.generationSession.active_working_set?.active_onstage_cast_full.map((entry) => entry.cast_member_id) ?? []);

  if (
    minorIds.length > 0 &&
    minorIds.every((castId) => promotedIds.has(castId) || hasPresentMinorVoicePressure(snapshot, castId))
  ) {
    return [];
  }

  return [
    blocker({
      code: DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
      field: "generationSession.active_working_set.present_minor_cast_compressed",
      message: "Present minor speech focus lacks a compressed voice note or active/onstage promotion.",
      whyItMatters: "A present minor cast member should not receive material speech without a voice pin or full active cast treatment.",
      suggestedActions: ["promote-cast", "add-voice-or-body-pressure"]
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

function activeSpeakerIds(snapshot: ValidationSnapshot): readonly string[] {
  return snapshot.generationSession.active_working_set?.active_onstage_cast_full
    .filter((entry) => SPEAKING_FUNCTIONS.has(entry.local_function))
    .map((entry) => entry.cast_member_id) ?? [];
}

function castHasVoiceAnchor(snapshot: ValidationSnapshot, castId: string): boolean {
  const cast = findCast(snapshot, castId);

  return !!cast && hasObject(objectPayload(cast).voice_anchor);
}

function castHasBodyPresence(snapshot: ValidationSnapshot, castId: string): boolean {
  const cast = findCast(snapshot, castId);

  return !!cast && hasObject(objectPayload(cast).body_presence_core);
}

function findCast(snapshot: ValidationSnapshot, castId: string): ValidationRecord | undefined {
  return snapshot.records.find((record) => record.id === castId && record.type === "CAST MEMBER");
}

function hasSilentPressure(snapshot: ValidationSnapshot, castId: string): boolean {
  const pressure = voicePressureFor(snapshot, castId);

  return !!pressure && hasText(pressure.nonverbal_or_silence_pressure) && pressure.nonverbal_or_silence_pressure !== "none";
}

function hasPresentMinorVoicePressure(snapshot: ValidationSnapshot, castId: string): boolean {
  const pressure = voicePressureFor(snapshot, castId);

  return !!pressure && pressure.local_function === "present_minor_speaker" && hasText(pressure.current_voice_pressure);
}

function voicePressureFor(snapshot: ValidationSnapshot, castId: string) {
  return snapshot.generationSession.current_cast_voice_pressure.find((entry) => entry.cast_member_id === castId);
}

function hasPovKnowledge(snapshot: ValidationSnapshot): boolean {
  const pov = snapshot.generationSession.active_working_set?.selected_pov ?? snapshot.storyConfig.proseMode?.pov_character;

  if (!pov || pov === "omniscient") {
    return true;
  }

  return snapshot.records.some((record) => {
    const payload = objectPayload(record);

    return (
      (record.type === "FACT" && Array.isArray(payload.known_by) && payload.known_by.includes(pov)) ||
      (record.type === "BELIEF" && payload.holder === pov) ||
      (record.type === "SECRET" && Array.isArray(payload.holders) && payload.holders.includes(pov))
    );
  });
}

function hasRelationshipOrStatusContext(snapshot: ValidationSnapshot): boolean {
  return snapshot.records.some((record) => record.type === "RELATIONSHIP" || record.type === "ENTITY STATUS");
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
