import { z } from "zod";

import { recordId } from "./common.js";
import {
  deriveGenerationContextDefault,
  type GenerationSessionDraft
} from "./generation-brief-draft.js";

const readyString = z.string().trim().min(1);
const generationContext = z.enum(["first_segment", "continuation_after_accepted_segment"]);

const activeWorkingSetReadySchema = z
  .object({
    selected_records: z.array(recordId).optional(),
    active_onstage_cast_full: z
      .array(
        z
          .object({
            cast_member_id: recordId,
            local_function: z.enum([
              "pov_narrator",
              "active_speaker",
              "active_silent",
              "close_non_pov",
              "physically_active",
              "materially_referenced"
            ])
          })
          .strict()
      )
      .optional(),
    present_minor_cast_compressed: z.array(recordId).optional(),
    offstage_relevant_cast: z.array(recordId).optional(),
    selected_pov: z.union([recordId, z.literal("omniscient")]).optional(),
    manual_directive_id: recordId.optional()
  })
  .strict();

const currentAuthoritativeStateReadySchema = z
  .object({
    current_time: readyString.optional(),
    current_location: z.union([recordId, readyString]).optional(),
    onstage_entities: z.array(recordId).optional(),
    offstage_pressuring_entities: z.array(recordId).optional(),
    positions: z.union([readyString, z.array(readyString)]).optional(),
    possessions: z.union([readyString, z.array(readyString)]).optional(),
    visible_conditions: z.array(readyString).optional(),
    environmental_conditions: readyString.optional(),
    entity_statuses: z.union([readyString, z.array(recordId)]).optional(),
    line_of_sight_and_visibility: readyString.optional(),
    routes_and_exits: z.array(readyString).optional(),
    available_time: readyString.optional(),
    consent_or_force_conditions: z.union([readyString, z.literal("none")]).optional(),
    current_locks: z.array(readyString).optional()
  })
  .strict();

const immediateHandoffReadySchema = z
  .object({
    recent_causal_context: readyString.optional(),
    last_visible_moment: readyString.optional(),
    prior_accepted_prose_status_or_handoff_note: z.union([readyString, z.literal("none")]).optional(),
    begin_after: readyString.optional()
  })
  .strict();

const manualMomentDirectiveReadySchema = z
  .object({
    must_render: z.array(readyString).min(1).optional(),
    may_render_if_naturally_caused: z.array(readyString).optional(),
    do_not_force: z.array(readyString).optional()
  })
  .strict();

const currentCastVoicePressureReadySchema = z
  .object({
    cast_member_id: recordId,
    local_function: z
      .enum([
        "pov_narrator",
        "active_speaker",
        "active_silent",
        "close_non_pov",
        "present_minor_speaker",
        "physically_active",
        "materially_referenced"
      ])
      .optional(),
    current_voice_pressure: readyString.optional(),
    dialogue_pressure: z.union([readyString, z.literal("none")]).optional(),
    pov_narration_pressure: z.union([readyString, z.literal("none")]).optional(),
    nonverbal_or_silence_pressure: z.union([readyString, z.literal("none")]).optional(),
    current_must_preserve: z.array(readyString).optional(),
    current_must_avoid: z.array(readyString).optional()
  })
  .strict();

const castVoiceOverridesReadySchema = z
  .object({
    cast_member_id: recordId,
    scope: z.literal("current_generation_only").optional(),
    reason: z.union([readyString, z.literal("none")]).optional(),
    applies_to: z
      .array(
        z.enum([
          "dialogue",
          "pov_narration",
          "interiority",
          "nonverbal_behavior",
          "register",
          "rhythm",
          "diction",
          "profanity",
          "silence",
          "all_prompted_voice"
        ])
      )
      .optional(),
    override_text: readyString.optional()
  })
  .strict();

const generationValidationFocusReadySchema = z
  .object({
    validation_focus_tags: z
      .object({
        generation_context: z.array(generationContext).length(1),
        expected_local_modes: z
          .array(
            z.enum([
              "dialogue_expected",
              "ensemble_dialogue_expected",
              "introspection_expected",
              "physical_interaction_expected",
              "active_silent_presence_expected",
              "present_minor_speech_possible",
              "ambiguous_perception_expected",
              "offstage_interruption_possible",
              "nonhuman_or_institutional_pressure_expected",
              "secret_or_clue_pressure",
              "non_pov_hidden_plan_behavior"
            ])
          )
          .optional(),
        possible_durable_changes: z
          .array(
            z.enum([
              "object_use_possible",
              "object_transfer_possible",
              "location_change_possible",
              "restraint_or_coercion_possible",
              "intimacy_or_sex_possible",
              "violence_or_injury_possible",
              "institutional_involvement_possible",
              "clock_tick_possible",
              "obligation_breach_possible"
            ])
          )
          .optional()
      })
      .strict()
  })
  .strict();

const stopGuidanceReadySchema = z
  .object({
    soft_unit_guidance: z.union([readyString, z.literal("")])
  })
  .strict();

export const generationSessionReadySchema = z
  .object({
    active_working_set: activeWorkingSetReadySchema.optional(),
    current_authoritative_state: currentAuthoritativeStateReadySchema.optional(),
    immediate_handoff: immediateHandoffReadySchema.optional(),
    manual_moment_directive: manualMomentDirectiveReadySchema.optional(),
    current_cast_voice_pressure: z.array(currentCastVoicePressureReadySchema).optional(),
    cast_voice_overrides: z.array(castVoiceOverridesReadySchema).optional(),
    generation_validation_focus: generationValidationFocusReadySchema,
    stop_guidance: stopGuidanceReadySchema
  })
  .strict();

export type GenerationSessionReadyCandidate = z.infer<typeof generationSessionReadySchema>;
export type GenerationSessionReady = GenerationSessionReadyCandidate;

export function normalizeGenerationSessionForReadiness(
  draft: GenerationSessionDraft,
  opts: { acceptedSegmentCount: number }
): GenerationSessionReadyCandidate {
  const normalized = (normalizeValue(draft) ?? {}) as Partial<GenerationSessionReadyCandidate>;

  normalized.generation_validation_focus = normalizeGenerationValidationFocus(
    draft.generation_validation_focus,
    opts.acceptedSegmentCount
  );
  normalized.stop_guidance = normalizeStopGuidance(draft.stop_guidance);
  normalized.current_cast_voice_pressure = normalizeSemanticObjectList(
    normalized.current_cast_voice_pressure,
    "cast_member_id"
  );
  normalized.cast_voice_overrides = normalizeSemanticObjectList(normalized.cast_voice_overrides, "cast_member_id");

  return generationSessionReadySchema.parse(normalized);
}

function normalizeGenerationValidationFocus(
  focus: GenerationSessionDraft["generation_validation_focus"],
  acceptedSegmentCount: number
): GenerationSessionReadyCandidate["generation_validation_focus"] {
  const normalizedFocus = normalizeValue(focus) as
    | Partial<GenerationSessionReadyCandidate["generation_validation_focus"]>
    | undefined;
  const normalizedTags = normalizedFocus?.validation_focus_tags;
  const explicitContext = normalizedTags?.generation_context?.[0];
  const generation_context = [explicitContext ?? deriveGenerationContextDefault(acceptedSegmentCount)] as [
    "first_segment" | "continuation_after_accepted_segment"
  ];

  return {
    validation_focus_tags: {
      ...normalizedTags,
      generation_context
    }
  };
}

function normalizeStopGuidance(
  stopGuidance: GenerationSessionDraft["stop_guidance"]
): GenerationSessionReadyCandidate["stop_guidance"] {
  const softUnitGuidance = stopGuidance?.soft_unit_guidance?.trim();
  return { soft_unit_guidance: softUnitGuidance && softUnitGuidance.length > 0 ? softUnitGuidance : "" };
}

function normalizeSemanticObjectList<T extends Record<string, unknown>>(
  input: T[] | undefined,
  identityKey: keyof T
): T[] | undefined {
  const semanticItems = input?.filter((item) =>
    Object.entries(item).some(([key, value]) => key !== identityKey && value !== undefined)
  );
  return semanticItems && semanticItems.length > 0 ? semanticItems : undefined;
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const normalizedItems = value.map((item) => normalizeValue(item)).filter((item) => item !== undefined);
    return normalizedItems.length > 0 ? normalizedItems : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, nested]) => [key, normalizeValue(nested)] as const)
      .filter(([, nested]) => nested !== undefined);

    if (entries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(entries);
  }

  return value;
}
