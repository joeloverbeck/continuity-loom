import { resolveEffectivePov } from "../../records/effective-pov.js";
import { classifyReference } from "../reference-classification.js";
import type { SelectedCastBand, ValidationSnapshot } from "../snapshot.js";
import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRule } from "./types.js";

export const castBandRules: readonly ValidationRule[] = Object.freeze([
  validateCastBandDuplicateMembership,
  validateCastBandReferences,
  validateSelectedPovReference,
  validateVoicePressureAttachments
]);

export function castBandMemberIds(snapshot: ValidationSnapshot): ReadonlySet<string> {
  return new Set(castBandEntries(snapshot).map((entry) => entry.id));
}

function validateCastBandDuplicateMembership(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const bandsById = new Map<string, Set<SelectedCastBand>>();

  for (const entry of castBandEntries(snapshot)) {
    const bands = bandsById.get(entry.id) ?? new Set<SelectedCastBand>();
    bands.add(entry.band);
    bandsById.set(entry.id, bands);
  }

  return [...bandsById.entries()].flatMap(([id, bands]) =>
    bands.size > 1
      ? [
          blocker(
            DIAGNOSTIC_CODES.castBandDuplicateMembership,
            `Cast member ${id} appears in multiple cast bands: ${[...bands].join(", ")}.`,
            "generationSession.active_working_set"
          )
        ]
      : []
  );
}

function validateCastBandReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const selectedRecordIds = new Set(snapshot.generationSession.active_working_set?.selected_records ?? []);

  return castBandEntries(snapshot).flatMap((entry) => {
    const reference = classifyReference(snapshot, entry.id, ["CAST MEMBER"]);

    return !selectedRecordIds.has(entry.id) || reference.classification !== "selected" || !reference.typeMatches
      ? [
          blocker(
            DIAGNOSTIC_CODES.castBandReferenceInvalid,
            `Cast-band member ${entry.id} must resolve to a selected CAST MEMBER record.`,
            castBandFieldPath(entry.band)
          )
        ]
      : [];
  });
}

function validateSelectedPovReference(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const prosePov = snapshot.storyConfig.proseMode?.pov_character;
  const selectedPov = snapshot.generationSession.active_working_set?.selected_pov;

  if (prosePov === "variable" && !selectedPov) {
    return [
      blocker(
        DIAGNOSTIC_CODES.selectedPovRequiredForVariableMode,
        "Variable POV mode requires a concrete selected POV for this generation.",
        "generationSession.active_working_set.selected_pov"
      )
    ];
  }

  if (
    selectedPov &&
    prosePov &&
    prosePov !== "variable" &&
    selectedPov !== prosePov
  ) {
    return [
      blocker(
        DIAGNOSTIC_CODES.selectedPovConflictsWithProseMode,
        `Selected POV ${selectedPov} conflicts with configured prose-mode POV ${prosePov}.`,
        "generationSession.active_working_set.selected_pov"
      )
    ];
  }

  const pov = resolveEffectivePov(snapshot);

  if (!pov || pov === "omniscient") {
    return [];
  }

  const reference = classifyReference(snapshot, pov, ["ENTITY", "CAST MEMBER"]);

  return reference.classification !== "selected" || !reference.typeMatches
    ? [
        blocker(
          DIAGNOSTIC_CODES.selectedPovReferenceInvalid,
          `Selected POV reference ${pov} must resolve to a selected ENTITY or CAST MEMBER record.`,
          "generationSession.active_working_set.selected_pov"
        )
      ]
    : [];
}

function validateVoicePressureAttachments(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return voicePressureAttachmentIds(snapshot).flatMap(({ id, field }) => {
    const reference = classifyReference(snapshot, id, ["CAST MEMBER"]);

    return reference.classification === "dangling" || !reference.typeMatches
      ? [
          blocker(
            DIAGNOSTIC_CODES.voicePressureAttachmentInvalid,
            `Voice-pressure attachment ${id} must resolve to a CAST MEMBER record.`,
            field
          )
        ]
      : [];
  });
}

function castBandEntries(snapshot: ValidationSnapshot): readonly { id: string; band: SelectedCastBand }[] {
  const workingSet = snapshot.generationSession.active_working_set;

  return [
    ...(workingSet?.active_onstage_cast_full ?? []).map((entry) => ({
      id: entry.cast_member_id,
      band: "active_onstage_cast_full" as const
    })),
    ...(workingSet?.present_minor_cast_compressed ?? []).map((id) => ({
      id,
      band: "present_minor_cast_compressed" as const
    })),
    ...(workingSet?.offstage_relevant_cast ?? []).map((id) => ({
      id,
      band: "offstage_relevant_cast" as const
    }))
  ];
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

function castBandFieldPath(band: SelectedCastBand): string {
  return `generationSession.active_working_set.${band}`;
}

function blocker(code: string, message: string, field: string): Diagnostic {
  return {
    severity: "blocker",
    code,
    message,
    affected: [{ field }],
    whyItMatters: "Working-set, POV, and voice-pressure references must attach to selected story records before generation can proceed.",
    suggestedActions: ["revise", "remove", "deselect", "promote-cast"]
  };
}
