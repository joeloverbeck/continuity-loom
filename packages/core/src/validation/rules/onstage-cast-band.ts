import type { SelectedCastBand, ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRule } from "./types.js";

export const onstageCastBandRules: readonly ValidationRule[] = Object.freeze([
  validateOnstageCastBandPresence
]);

const presentCastBands = new Set<SelectedCastBand>([
  "active_onstage_cast_full",
  "present_minor_cast_compressed"
]);

function validateOnstageCastBandPresence(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const onstageIds = new Set(snapshot.generationSession.current_authoritative_state?.onstage_entities ?? []);

  if (onstageIds.size === 0) {
    return [];
  }

  return snapshot.records.flatMap((record) => {
    if (record.type !== "CAST MEMBER") {
      return [];
    }

    const entityId = objectPayload(record).entity_id;

    return typeof entityId === "string" && onstageIds.has(entityId) && !isPresentCastBand(record.castBand)
      ? [blocker(record)]
      : [];
  });
}

function isPresentCastBand(band: SelectedCastBand | undefined): boolean {
  return !!band && presentCastBands.has(band);
}

function objectPayload(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
    ? record.payload as Record<string, unknown>
    : {};
}

function blocker(record: ValidationRecord): Diagnostic {
  const label = record.metadata?.displayLabel ?? record.id;
  const bandState = record.castBand === "offstage_relevant_cast" ? "in offstage relevance" : "Unassigned";

  return {
    severity: "blocker",
    code: DIAGNOSTIC_CODES.onstageCastBandMissing,
    message: `Onstage character "${label}" is ${bandState}, so its dossier will not be compiled as present cast. Assign it to active/onstage full or present-minor compressed, or remove it from onstage entities.`,
    affected: [{ recordId: record.id, field: "generationSession.active_working_set" }],
    whyItMatters: "An onstage character must have its dossier rendered as present cast so voice, body, and pressure authority compile deterministically.",
    suggestedActions: ["promote-cast", "revise", "deselect"]
  };
}
