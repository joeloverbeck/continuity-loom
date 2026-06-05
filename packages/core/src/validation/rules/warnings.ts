import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

export const warningRules: readonly ValidationRule[] = Object.freeze([
  warnPromptLengthRisk,
  warnManyHighSalienceRecords,
  warnNoSampleUtterances,
  warnSparseSettingTexture,
  warnNoActiveClockPressure,
  warnLongDossierNeedsPin,
  warnLowDramaScenePressure,
  warnStaleSelectedRecord
]);

function warnPromptLengthRisk(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return JSON.stringify(snapshot).length > 5000
    ? [warning(DIAGNOSTIC_CODES.promptLengthRisk, "Snapshot is large enough to risk lost-in-the-middle prompt behavior.", "records")]
    : [];
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

function warnLongDossierNeedsPin(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return snapshot.records.flatMap((record) => {
    if (record.type !== "CAST MEMBER" || JSON.stringify(record.payload).length <= 1200) {
      return [];
    }

    const hasPin = snapshot.generationSession.current_cast_voice_pressure.some((entry) => entry.cast_member_id === record.id && hasText(entry.current_voice_pressure));

    return hasPin
      ? []
      : [warning(DIAGNOSTIC_CODES.longDossierNeedsPin, "Long active dossier may need a stronger current voice/body pressure pin.", `record:${record.id}`)];
  });
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

function hasValue(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : hasText(value) || (value !== undefined && value !== null);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
