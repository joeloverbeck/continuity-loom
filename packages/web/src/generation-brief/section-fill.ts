import {
  getFieldGuidance,
  type GenerationSessionDraft
} from "@loom/core";

import { isRequiredNow, type GenerationContext } from "./requiredness-now.js";

export type BriefSectionId =
  | "active-working-set"
  | "current-state"
  | "handoff"
  | "directive"
  | "voice-pressure"
  | "override"
  | "validation-focus"
  | "stop-guidance";

export type SectionFillTone = "success" | "amber" | "neutral";

export interface SectionFill {
  sectionId: BriefSectionId;
  tone: SectionFillTone;
  requiredFilled: number;
  requiredTotal: number;
  filled: number;
}

const SECTION_FIELDS: Record<BriefSectionId, readonly string[]> = {
  "active-working-set": [
    "active_working_set.selected_records[]",
    "active_working_set.active_onstage_cast_full[].cast_member_id",
    "active_working_set.active_onstage_cast_full[].local_function",
    "active_working_set.present_minor_cast_compressed[]",
    "active_working_set.offstage_relevant_cast[]",
    "active_working_set.selected_pov"
  ],
  "current-state": [
    "current_authoritative_state.current_time",
    "current_authoritative_state.current_location",
    "current_authoritative_state.onstage_entities[]",
    "current_authoritative_state.immediate_situation_summary",
    "current_authoritative_state.offstage_pressuring_entities[]",
    "current_authoritative_state.positions",
    "current_authoritative_state.possessions",
    "current_authoritative_state.visible_conditions[]",
    "current_authoritative_state.environmental_conditions",
    "current_authoritative_state.entity_statuses",
    "current_authoritative_state.line_of_sight_and_visibility",
    "current_authoritative_state.pov_cannot_perceive_now",
    "current_authoritative_state.routes_and_exits[]",
    "current_authoritative_state.available_time",
    "current_authoritative_state.consent_or_force_conditions",
    "current_authoritative_state.current_locks[]"
  ],
  handoff: [
    "immediate_handoff.recent_causal_context",
    "immediate_handoff.last_visible_moment",
    "immediate_handoff.prior_accepted_prose_status_or_handoff_note",
    "immediate_handoff.begin_after"
  ],
  directive: [
    "manual_moment_directive.must_render[]",
    "manual_moment_directive.may_render_if_naturally_caused[]",
    "manual_moment_directive.do_not_force[]"
  ],
  "voice-pressure": [
    "current_cast_voice_pressure[].cast_member_id",
    "current_cast_voice_pressure[].local_function",
    "current_cast_voice_pressure[].current_voice_pressure",
    "current_cast_voice_pressure[].dialogue_pressure",
    "current_cast_voice_pressure[].pov_narration_pressure",
    "current_cast_voice_pressure[].nonverbal_or_silence_pressure",
    "current_cast_voice_pressure[].current_must_preserve[]",
    "current_cast_voice_pressure[].current_must_avoid[]"
  ],
  override: [
    "cast_voice_overrides[].cast_member_id",
    "cast_voice_overrides[].scope",
    "cast_voice_overrides[].reason",
    "cast_voice_overrides[].applies_to[]",
    "cast_voice_overrides[].override_text"
  ],
  "validation-focus": [
    "generation_validation_focus.validation_focus_tags.generation_context[]",
    "generation_validation_focus.validation_focus_tags.expected_local_modes[]",
    "generation_validation_focus.validation_focus_tags.possible_durable_changes[]"
  ],
  "stop-guidance": ["stop_guidance.soft_unit_guidance"]
};

export function computeSectionFill(
  draft: GenerationSessionDraft,
  generationContext: GenerationContext
): readonly SectionFill[] {
  return Object.entries(SECTION_FIELDS).map(([sectionId, paths]) => {
    let requiredFilled = 0;
    let requiredTotal = 0;
    let filled = 0;

    for (const path of paths) {
      const fieldIsFilled = isDraftPathFilled(draft, path);
      const requiredNow = isRequiredNow(
        getFieldGuidance(`GENERATION BRIEF.${path}`)?.requiredness,
        generationContext
      );

      if (fieldIsFilled) {
        filled += 1;
      }

      if (requiredNow) {
        requiredTotal += 1;
        if (fieldIsFilled) {
          requiredFilled += 1;
        }
      }
    }

    return {
      sectionId: sectionId as BriefSectionId,
      tone: requiredTotal === 0 ? "neutral" : requiredFilled === requiredTotal ? "success" : "amber",
      requiredFilled,
      requiredTotal,
      filled
    };
  });
}

export function sectionFillLabel(fill: SectionFill): string {
  if (fill.requiredTotal === 0) {
    return `${fill.filled} filled`;
  }

  const requiredEmpty = fill.requiredTotal - fill.requiredFilled;
  return requiredEmpty === 0 ? `${fill.requiredFilled}/${fill.requiredTotal} required` : `${requiredEmpty} required empty`;
}

function isDraftPathFilled(draft: GenerationSessionDraft, path: string): boolean {
  const normalizedPath = path.replace(/\[]/g, "");
  const segments = normalizedPath.split(".");

  return isValueFilled(valueAtPath(draft, segments));
}

function valueAtPath(value: unknown, segments: readonly string[]): unknown {
  if (segments.length === 0) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => valueAtPath(item, segments));
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const [head, ...tail] = segments;
  return valueAtPath((value as Record<string, unknown>)[head ?? ""], tail);
}

function isValueFilled(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => isValueFilled(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => isValueFilled(item));
  }

  return value !== undefined && value !== null;
}
