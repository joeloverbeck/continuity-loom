import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";

export const activeWorkingSetSchema = z
  .object({
    selected_records: z.array(recordId),
    active_onstage_cast_full: z.array(
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
    ),
    present_minor_cast_compressed: z.array(recordId).default([]),
    offstage_relevant_cast: z.array(recordId).default([]),
    selected_pov: z.union([recordId, z.literal("omniscient")]),
    manual_directive_id: recordId
  })
  .strict();

export const currentAuthoritativeStateSchema = z
  .object({
    current_time: nonemptyString,
    current_location: z.union([recordId, nonemptyString]),
    onstage_entities: z.array(recordId),
    offstage_pressuring_entities: z.array(recordId).default([]),
    positions: z.union([nonemptyString, z.array(nonemptyString)]),
    possessions: z.union([nonemptyString, z.array(nonemptyString)]),
    visible_conditions: z.array(nonemptyString),
    environmental_conditions: nonemptyString,
    entity_statuses: z.union([nonemptyString, z.array(recordId)]),
    line_of_sight_and_visibility: nonemptyString,
    routes_and_exits: z.array(nonemptyString),
    available_time: nonemptyString,
    consent_or_force_conditions: z.union([nonemptyString, z.literal("none")]),
    current_locks: z.array(nonemptyString)
  })
  .strict();

export const immediateHandoffSchema = z
  .object({
    recent_causal_context: nonemptyString,
    last_visible_moment: nonemptyString,
    prior_accepted_prose_status_or_handoff_note: z.union([nonemptyString, z.literal("none")]),
    begin_after: nonemptyString
  })
  .strict();

export const manualMomentDirectiveSchema = z
  .object({
    must_render: z.array(nonemptyString).min(1),
    may_render_if_naturally_caused: z.array(nonemptyString).default([]),
    do_not_force: z.array(nonemptyString).default([])
  })
  .strict();

export const currentCastVoicePressureSchema = z
  .object({
    cast_member_id: recordId,
    local_function: z.enum([
      "pov_narrator",
      "active_speaker",
      "active_silent",
      "close_non_pov",
      "present_minor_speaker",
      "physically_active",
      "materially_referenced"
    ]),
    current_voice_pressure: nonemptyString,
    dialogue_pressure: z.union([nonemptyString, z.literal("none")]),
    pov_narration_pressure: z.union([nonemptyString, z.literal("none")]),
    nonverbal_or_silence_pressure: z.union([nonemptyString, z.literal("none")]),
    current_must_preserve: z.array(nonemptyString),
    current_must_avoid: z.array(nonemptyString)
  })
  .strict();

export const castVoiceOverridesSchema = z
  .object({
    cast_member_id: recordId,
    scope: z.literal("current_generation_only"),
    reason: z.union([nonemptyString, z.literal("none")]),
    applies_to: z.array(
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
    ),
    override_text: nonemptyString
  })
  .strict();

export const generationValidationFocusSchema = z
  .object({
    validation_focus_tags: z
      .object({
        generation_context: z.array(z.enum(["first_segment", "continuation_after_accepted_segment"])).length(1),
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
          .default([]),
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
          .default([])
      })
      .strict()
  })
  .strict();

export const stopGuidanceSchema = z
  .object({
    soft_unit_guidance: nonemptyString,
    stop_before: z.array(nonemptyString).default([])
  })
  .strict();

export const generationSessionSchema = z
  .object({
    active_working_set: activeWorkingSetSchema.optional(),
    current_authoritative_state: currentAuthoritativeStateSchema.optional(),
    immediate_handoff: immediateHandoffSchema.optional(),
    manual_moment_directive: manualMomentDirectiveSchema.optional(),
    current_cast_voice_pressure: z.array(currentCastVoicePressureSchema).default([]),
    cast_voice_overrides: z.array(castVoiceOverridesSchema).default([]),
    generation_validation_focus: generationValidationFocusSchema.optional(),
    stop_guidance: stopGuidanceSchema.optional()
  })
  .strict();

export type GenerationSession = z.infer<typeof generationSessionSchema>;
