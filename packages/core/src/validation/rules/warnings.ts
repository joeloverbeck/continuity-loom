import { classifyReference } from "../reference-classification.js";
import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import { castBandMemberIds } from "./cast-band.js";
import {
  isEntityStatusesReferenceRequired,
  isOffstageEntityReferenceRequired
} from "./referential-brief.js";
import {
  expectedRecordReferenceTypes,
  isRecordReferenceRequired,
  recordInternalReferences
} from "./record-internal.js";
import type { ValidationRule } from "./types.js";

export const warningRules: readonly ValidationRule[] = Object.freeze([
  warnOffstageEntityReferenceUnselectedOptional,
  warnEntityStatusesReferenceUnselectedOptional,
  warnVoicePressureOrphanedAttachment,
  warnRecordReferenceUnselectedOptional,
  warnPromptMiddleSalienceRisk,
  warnManyHighSalienceRecords,
  warnNoSampleUtterances,
  warnSparseSettingTexture,
  warnNoActiveClockPressure,
  warnLocalVoicePressureMayHelp,
  warnEnsembleVoiceDistinctionRisk,
  warnCastSalienceRisk,
  warnLowDramaScenePressure,
  warnStaleSelectedRecord,
  warnHiddenCriticalFactNotConcealed
]);

function warnOffstageEntityReferenceUnselectedOptional(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (isOffstageEntityReferenceRequired(snapshot)) {
    return [];
  }

  return currentStateArray(snapshot, "offstage_pressuring_entities").flatMap((id) => {
    const reference = classifyReference(snapshot, id, ["ENTITY"]);

    return reference.classification === "unselected" && reference.typeMatches
      ? [
          warning(
            DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional,
            `Offstage pressure reference ${id} exists but is not selected, so it will not render unless selected into the active working set.`,
            "generationSession.current_authoritative_state.offstage_pressuring_entities"
          )
        ]
      : [];
  });
}

function warnEntityStatusesReferenceUnselectedOptional(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const entityStatuses = snapshot.generationSession.current_authoritative_state?.entity_statuses;

  if (isEntityStatusesReferenceRequired(snapshot) || !Array.isArray(entityStatuses)) {
    return [];
  }

  return entityStatuses.flatMap((id) => {
    const reference = classifyReference(snapshot, id, ["ENTITY STATUS"]);

    return reference.classification === "unselected" && reference.typeMatches
      ? [
          warning(
            DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional,
            `Entity status reference ${id} exists but is not selected, so it will not render unless selected into the active working set.`,
            "generationSession.current_authoritative_state.entity_statuses"
          )
        ]
      : [];
  });
}

function warnVoicePressureOrphanedAttachment(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const bandMemberIds = castBandMemberIds(snapshot);

  return voicePressureAttachmentIds(snapshot).flatMap(({ id, field }) => {
    const reference = classifyReference(snapshot, id, ["CAST MEMBER"]);

    return reference.classification !== "dangling" && reference.typeMatches && !bandMemberIds.has(id)
      ? [
          warning(
            DIAGNOSTIC_CODES.voicePressureOrphanedAttachment,
            `Voice-pressure attachment ${id} resolves to a CAST MEMBER but is not attached to any rendered cast band.`,
            field
          )
        ]
      : [];
  });
}

function warnRecordReferenceUnselectedOptional(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return recordInternalReferences(snapshot).flatMap(({ sourceRecord, reference }) => {
    const classified = classifyReference(snapshot, reference.targetId, expectedRecordReferenceTypes(reference.refRole, sourceRecord));

    return classified.classification === "unselected" &&
      classified.typeMatches &&
      !isRecordReferenceRequired(snapshot, sourceRecord, reference.refRole)
      ? [
          warning(
            DIAGNOSTIC_CODES.recordReferenceUnselectedOptional,
            `Record ${sourceRecord.id} ${reference.refRole} reference ${reference.targetId} exists but is not selected, so it will not render unless selected into the active working set.`,
            `${sourceRecord.type}.${reference.refRole}`
          )
        ]
      : [];
  });
}

function warnPromptMiddleSalienceRisk(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return JSON.stringify(snapshotWithoutProjectRecordIndex(snapshot)).length > 5000
    ? [
        warning(
          DIAGNOSTIC_CODES.promptMiddleSalienceRisk,
          "Snapshot is large enough to risk lost-in-the-middle prompt behavior.",
          "records"
        )
      ]
    : [];
}

function snapshotWithoutProjectRecordIndex(snapshot: ValidationSnapshot): Omit<ValidationSnapshot, "projectRecordIndex"> {
  return {
    records: snapshot.records,
    generationSession: snapshot.generationSession,
    storyConfig: snapshot.storyConfig,
    versions: snapshot.versions
  };
}

function currentStateArray(snapshot: ValidationSnapshot, field: "onstage_entities" | "offstage_pressuring_entities"): readonly string[] {
  return snapshot.generationSession.current_authoritative_state?.[field] ?? [];
}

function voicePressureAttachmentIds(snapshot: ValidationSnapshot): readonly { id: string; field: string }[] {
  return [
    ...(snapshot.generationSession.current_cast_voice_pressure ?? []).map((entry) => ({
      id: entry.cast_member_id,
      field: "generationSession.current_cast_voice_pressure"
    })),
    ...(snapshot.generationSession.cast_voice_overrides ?? []).map((entry) => ({
      id: entry.cast_member_id,
      field: "generationSession.cast_voice_overrides"
    }))
  ];
}

function warnManyHighSalienceRecords(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const highSalienceCount = snapshot.records.filter((record) => {
    const payload = objectPayload(record);
    const salience = record.metadata?.salience ?? payload.salience;

    return salience === "high" || salience === "critical";
  }).length;

  return highSalienceCount > 6
    ? [warning(DIAGNOSTIC_CODES.manyHighSalienceRecords, "Many high-salience records are selected for one local unit.", "records")]
    : [];
}

function warnNoSampleUtterances(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const activeCast = snapshot.records.filter((record) => record.type === "CAST MEMBER" && record.castBand === "active_onstage_cast_full");
  const hasSampleUtterance = activeCast.some((record) => hasValue(objectPayload(record).sample_utterances));

  return activeCast.length > 0 && !hasSampleUtterance
    ? [warning(DIAGNOSTIC_CODES.noSampleUtterances, "Active cast has no sample utterances selected.", "CAST MEMBER.sample_utterances")]
    : [];
}

function warnSparseSettingTexture(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const hasLocationRecord = snapshot.records.some((record) => record.type === "LOCATION");
  const environment = snapshot.generationSession.current_authoritative_state?.environmental_conditions ?? "";

  return !hasLocationRecord && environment.length < 24
    ? [warning(DIAGNOSTIC_CODES.sparseSettingTexture, "Setting texture is sparse for the current local unit.", "generationSession.current_authoritative_state.environmental_conditions")]
    : [];
}

function warnNoActiveClockPressure(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const directive = snapshot.generationSession.manual_moment_directive?.must_render ?? [];
  const hasPressureRecord = snapshot.records.some((record) => ["CLOCK", "OBLIGATION", "OPEN THREAD"].includes(record.type));

  return directive.length > 0 && !hasPressureRecord
    ? [warning(DIAGNOSTIC_CODES.noActiveClockPressure, "Directive has local pressure but no active clock, obligation, or open thread selected.", "records")]
    : [];
}

function warnLocalVoicePressureMayHelp(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "dialogue_expected")) {
    return [];
  }

  const missingPins = activeSpeakerIds(snapshot).filter(
    (castId) => castHasVoiceAnchor(snapshot, castId) && !hasVoicePressure(snapshot, castId)
  );

  return missingPins.length > 0
    ? [
        warning(
          DIAGNOSTIC_CODES.localVoicePressureMayHelp,
          "Dialogue is structurally ready, but local voice pressure may help keep active speakers salient.",
          "generationSession.current_cast_voice_pressure"
        )
      ]
    : [];
}

function warnEnsembleVoiceDistinctionRisk(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  if (!hasFocusTag(snapshot, "ensemble_dialogue_expected")) {
    return [];
  }

  const speakerIds = activeSpeakerIds(snapshot);
  if (speakerIds.length < 3) {
    return [];
  }

  const pressurePins = speakerIds
    .map((castId) => voicePressureFor(snapshot, castId)?.current_voice_pressure)
    .filter(hasText)
    .map((pin) => pin.trim().toLowerCase());
  const distinctPins = new Set(pressurePins);

  return pressurePins.length < speakerIds.length || distinctPins.size < pressurePins.length
    ? [
        warning(
          DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk,
          "Ensemble dialogue is structurally ready, but absent or repeated local voice pins may blur speakers.",
          "generationSession.current_cast_voice_pressure"
        )
      ]
    : [];
}

function warnCastSalienceRisk(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const affectedLabels = snapshot.records
    .filter((record) => record.type === "CAST MEMBER" && JSON.stringify(record.payload).length > 1200)
    .filter((record) =>
      !snapshot.generationSession.current_cast_voice_pressure.some(
        (entry) => entry.cast_member_id === record.id && hasText(entry.current_voice_pressure)
      )
    )
    .map((record) => record.metadata?.displayLabel ?? record.id);

  return affectedLabels.length > 0
    ? [
        warning(
          DIAGNOSTIC_CODES.castSalienceRisk,
          `Long active cast dossiers may need a stronger local salience pin: ${affectedLabels.join(", ")}.`,
          "generationSession.current_cast_voice_pressure"
        )
      ]
    : [];
}

function warnLowDramaScenePressure(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const directiveText = (snapshot.generationSession.manual_moment_directive?.must_render ?? []).join(" ");
  const hasPressureRecord = snapshot.records.some((record) => ["CLOCK", "OBLIGATION", "OPEN THREAD", "SECRET", "RELATIONSHIP", "EMOTION"].includes(record.type));

  return directiveText.length < 80 && !hasPressureRecord
    ? [warning(DIAGNOSTIC_CODES.lowDramaScenePressure, "Low-drama scene may need sharper prose-craft pressure.", "generationSession.manual_moment_directive.must_render")]
    : [];
}

function warnStaleSelectedRecord(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    const status = record.metadata?.status ?? objectPayload(record).status;

    return status === "resolved" || status === "abandoned" || status === "superseded"
      ? [warning(DIAGNOSTIC_CODES.staleSelectedRecord, "Selected record is old or resolved but may still be relevant.", `record:${record.id}`)]
      : [];
  });
}

function warnHiddenCriticalFactNotConcealed(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    if (record.type !== "FACT") {
      return [];
    }

    const payload = objectPayload(record);
    const salience = record.metadata?.salience ?? payload.salience;
    const isHardCanonOrCritical = payload.fact_kind === "hard_canon" || salience === "critical";

    if (payload.audience_visibility !== "hidden" || !isHardCanonOrCritical) {
      return [];
    }

    return [
      {
        severity: "warning",
        code: DIAGNOSTIC_CODES.factHiddenAudienceVisibilityNotConcealment,
        message:
          "This FACT is set to audience_visibility: hidden, but FACT.audience_visibility is not a reader-concealment control, so the compiled prompt will not hide this premise from the reader.",
        affected: [{ recordId: record.id, field: "FACT.audience_visibility" }],
        whyItMatters:
          "A hard-canon or critical premise marked hidden reads as protected, yet it renders identically to an explicit fact; reader-concealment lives only in the SECRET record.",
        repairInstruction:
          "To hide this POV-known premise from the reader, model it as a SECRET (pov_access: knows, audience_visibility: hidden), or change this FACT's audience_visibility.",
        suggestedActions: ["revise"]
      }
    ];
  });
}

function warning(code: string, message: string, field: string): Diagnostic {
  return {
    severity: "warning",
    code,
    message,
    affected: [{ field }],
    whyItMatters: "This warning helps improve curation without blocking generation.",
    suggestedActions: ["revise", "deselect"]
  };
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
    ? record.payload as Record<string, unknown>
    : {};
}

function activeSpeakerIds(snapshot: ValidationSnapshot): readonly string[] {
  return snapshot.generationSession.active_working_set?.active_onstage_cast_full
    .filter((entry) => entry.local_function === "active_speaker" || entry.local_function === "pov_narrator")
    .map((entry) => entry.cast_member_id) ?? [];
}

function castHasVoiceAnchor(snapshot: ValidationSnapshot, castId: string): boolean {
  const cast = snapshot.records.find((record) => record.id === castId && record.type === "CAST MEMBER");

  return !!cast && hasObject(objectPayload(cast).voice_anchor);
}

function hasVoicePressure(snapshot: ValidationSnapshot, castId: string): boolean {
  const pressure = voicePressureFor(snapshot, castId);

  return !!pressure && (hasText(pressure.current_voice_pressure) || hasText(pressure.dialogue_pressure));
}

function voicePressureFor(snapshot: ValidationSnapshot, castId: string) {
  return snapshot.generationSession.current_cast_voice_pressure.find((entry) => entry.cast_member_id === castId);
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

function hasObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : hasText(value) || (value !== undefined && value !== null);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
