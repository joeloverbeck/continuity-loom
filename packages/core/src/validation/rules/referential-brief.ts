import { classifyReference } from "../reference-classification.js";
import type { ValidationSnapshot } from "../snapshot.js";
import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRule } from "./types.js";

export const referentialBriefRules: readonly ValidationRule[] = Object.freeze([
  validateOnstageEntityReferences,
  validateOffstageEntityReferences,
  validateEntityStatusesReferences,
  validateCurrentLocationReference
]);

const entityStatusRequiredModes = new Set([
  "physical_interaction_expected",
  "active_silent_presence_expected",
  "non_pov_hidden_plan_behavior",
  "object_transfer_possible",
  "restraint_or_coercion_possible",
  "intimacy_or_sex_possible",
  "violence_or_injury_possible"
]);

export function isOffstageEntityReferenceRequired(snapshot: ValidationSnapshot): boolean {
  return hasExpectedLocalMode(snapshot, "offstage_interruption_possible");
}

export function isEntityStatusesReferenceRequired(snapshot: ValidationSnapshot): boolean {
  return expectedLocalModes(snapshot).some((mode) => entityStatusRequiredModes.has(mode));
}

function validateOnstageEntityReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return currentStateArray(snapshot, "onstage_entities").flatMap((id) => {
    const reference = classifyReference(snapshot, id, ["ENTITY"]);

    return reference.classification !== "selected" || !reference.typeMatches
      ? [
          blocker(
            DIAGNOSTIC_CODES.onstageEntityReferenceInvalid,
            `Onstage entity reference ${id} must resolve to a selected ENTITY record.`,
            "generationSession.current_authoritative_state.onstage_entities"
          )
        ]
      : [];
  });
}

function validateOffstageEntityReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const laneRequired = isOffstageEntityReferenceRequired(snapshot);

  return currentStateArray(snapshot, "offstage_pressuring_entities").flatMap((id) => {
    const reference = classifyReference(snapshot, id, ["ENTITY"]);

    if (reference.classification === "dangling" || !reference.typeMatches) {
      return [
        blocker(
          DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
          `Offstage pressure reference ${id} must resolve to an ENTITY record.`,
          "generationSession.current_authoritative_state.offstage_pressuring_entities"
        )
      ];
    }

    return laneRequired && reference.classification === "unselected"
      ? [
          blocker(
            DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
            `Offstage pressure reference ${id} must be selected when offstage interruption pressure is required.`,
            "generationSession.current_authoritative_state.offstage_pressuring_entities"
          )
        ]
      : [];
  });
}

function validateEntityStatusesReferences(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const entityStatuses = snapshot.generationSession.current_authoritative_state?.entity_statuses;
  const laneRequired = isEntityStatusesReferenceRequired(snapshot);

  if (!Array.isArray(entityStatuses)) {
    return [];
  }

  return entityStatuses.flatMap((id) => {
    const reference = classifyReference(snapshot, id, ["ENTITY STATUS"]);

    if (reference.classification === "dangling" || !reference.typeMatches) {
      return [
        blocker(
          DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
          `Entity status reference ${id} must resolve to an ENTITY STATUS record.`,
          "generationSession.current_authoritative_state.entity_statuses"
        )
      ];
    }

    return laneRequired && reference.classification === "unselected"
      ? [
          blocker(
            DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
            `Entity status reference ${id} must be selected when current agency/status is required.`,
            "generationSession.current_authoritative_state.entity_statuses"
          )
        ]
      : [];
  });
}

function validateCurrentLocationReference(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  const currentLocation = snapshot.generationSession.current_authoritative_state?.current_location;

  if (typeof currentLocation !== "string" || !(currentLocation in snapshot.projectRecordIndex)) {
    return [];
  }

  const reference = classifyReference(snapshot, currentLocation, ["LOCATION"]);

  return reference.classification !== "selected" || !reference.typeMatches
    ? [
        blocker(
          DIAGNOSTIC_CODES.currentLocationReferenceInvalid,
          `Current location reference ${currentLocation} must resolve to a selected LOCATION record.`,
          "generationSession.current_authoritative_state.current_location"
        )
      ]
    : [];
}

function currentStateArray(snapshot: ValidationSnapshot, field: "onstage_entities" | "offstage_pressuring_entities"): readonly string[] {
  return snapshot.generationSession.current_authoritative_state?.[field] ?? [];
}

function expectedLocalModes(snapshot: ValidationSnapshot): readonly string[] {
  return snapshot.generationSession.generation_validation_focus?.validation_focus_tags?.expected_local_modes ?? [];
}

function hasExpectedLocalMode(snapshot: ValidationSnapshot, mode: string): boolean {
  return expectedLocalModes(snapshot).includes(mode);
}

function blocker(code: string, message: string, field: string): Diagnostic {
  return {
    severity: "blocker",
    code,
    message,
    affected: [{ field }],
    whyItMatters: "Required prompt context must resolve to explicit selected story records before generation can proceed.",
    suggestedActions: ["revise", "remove", "deselect"]
  };
}
