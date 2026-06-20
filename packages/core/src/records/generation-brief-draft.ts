import { z } from "zod";

import { recordId } from "./common.js";

const draftString = z.string();
const generationContext = z.enum(["first_segment", "continuation_after_accepted_segment"]);

const activeWorkingSetDraftSchema = z
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
    selected_pov: z.union([recordId, z.literal("omniscient")]).optional()
  })
  .strict();

const currentAuthoritativeStateDraftSchema = z
  .object({
    current_time: draftString.optional(),
    current_location: z.union([recordId, draftString]).optional(),
    onstage_entities: z.array(recordId).optional(),
    immediate_situation_summary: draftString.optional(),
    offstage_pressuring_entities: z.array(recordId).optional(),
    positions: z.union([draftString, z.array(draftString)]).optional(),
    possessions: z.union([draftString, z.array(draftString)]).optional(),
    visible_conditions: z.array(draftString).optional(),
    environmental_conditions: draftString.optional(),
    entity_statuses: z.union([draftString, z.array(recordId)]).optional(),
    line_of_sight_and_visibility: draftString.optional(),
    pov_cannot_perceive_now: draftString.optional(),
    routes_and_exits: z.array(draftString).optional(),
    available_time: draftString.optional(),
    consent_or_force_conditions: z.union([draftString, z.literal("none")]).optional(),
    current_locks: z.array(draftString).optional()
  })
  .strict();

const immediateHandoffDraftSchema = z
  .object({
    recent_causal_context: draftString.optional(),
    last_visible_moment: draftString.optional(),
    prior_accepted_prose_status_or_handoff_note: z.union([draftString, z.literal("none")]).optional(),
    begin_after: draftString.optional()
  })
  .strict();

const manualMomentDirectiveDraftSchema = z
  .object({
    must_render: z.array(draftString).optional(),
    may_render_if_naturally_caused: z.array(draftString).optional(),
    do_not_force: z.array(draftString).optional()
  })
  .strict();

const currentCastVoicePressureDraftSchema = z
  .object({
    cast_member_id: recordId,
    current_voice_pressure: draftString.optional(),
    dialogue_pressure: z.union([draftString, z.literal("none")]).optional(),
    pov_narration_pressure: z.union([draftString, z.literal("none")]).optional(),
    nonverbal_or_silence_pressure: z.union([draftString, z.literal("none")]).optional(),
    current_must_preserve: z.array(draftString).optional(),
    current_must_avoid: z.array(draftString).optional()
  })
  .strict();

const castVoiceOverridesDraftSchema = z
  .object({
    cast_member_id: recordId,
    scope: z.literal("current_generation_only").optional(),
    reason: z.union([draftString, z.literal("none")]).optional(),
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
    override_text: draftString.optional()
  })
  .strict();

const generationValidationFocusDraftSchema = z
  .object({
    validation_focus_tags: z
      .object({
        generation_context: z.array(generationContext).max(1).optional(),
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
      .optional()
  })
  .strict();

const stopGuidanceDraftSchema = z
  .object({
    soft_unit_guidance: draftString.optional()
  })
  .strict();

export const generationSessionDraftSchema = z
  .object({
    active_working_set: activeWorkingSetDraftSchema.optional(),
    current_authoritative_state: currentAuthoritativeStateDraftSchema.optional(),
    immediate_handoff: immediateHandoffDraftSchema.optional(),
    manual_moment_directive: manualMomentDirectiveDraftSchema.optional(),
    current_cast_voice_pressure: z.array(currentCastVoicePressureDraftSchema).optional(),
    cast_voice_overrides: z.array(castVoiceOverridesDraftSchema).optional(),
    generation_validation_focus: generationValidationFocusDraftSchema.optional(),
    stop_guidance: stopGuidanceDraftSchema.optional()
  })
  .strict();

export type GenerationSessionDraft = z.infer<typeof generationSessionDraftSchema>;

export function deriveGenerationContextDefault(
  acceptedSegmentCount: number
): "first_segment" | "continuation_after_accepted_segment" {
  return acceptedSegmentCount === 0 ? "first_segment" : "continuation_after_accepted_segment";
}

export function normalizeGenerationSessionDraft(
  draft: GenerationSessionDraft,
  opts: { acceptedSegmentCount: number }
): GenerationSessionDraft {
  const normalized: GenerationSessionDraft = {};

  assignIfNonempty(normalized, "active_working_set", normalizeObject(draft.active_working_set));
  assignIfNonempty(normalized, "current_authoritative_state", normalizeObject(draft.current_authoritative_state));
  assignIfNonempty(normalized, "immediate_handoff", normalizeObject(draft.immediate_handoff));
  assignIfNonempty(normalized, "manual_moment_directive", normalizeObject(draft.manual_moment_directive));
  assignIfNonempty(normalized, "current_cast_voice_pressure", normalizeObjectList(draft.current_cast_voice_pressure));
  assignIfNonempty(normalized, "cast_voice_overrides", normalizeObjectList(draft.cast_voice_overrides));
  assignIfNonempty(normalized, "stop_guidance", normalizeObject(draft.stop_guidance));

  const normalizedFocus = normalizeObject(draft.generation_validation_focus);
  const focusTags = normalizeObject(normalizedFocus?.validation_focus_tags);
  if (!focusTags?.generation_context?.length) {
    const defaultContext = deriveGenerationContextDefault(opts.acceptedSegmentCount);
    assignIfNonempty(normalized, "generation_validation_focus", {
      ...normalizedFocus,
      validation_focus_tags: {
        ...focusTags,
        generation_context: [defaultContext]
      }
    });
  } else {
    assignIfNonempty(normalized, "generation_validation_focus", {
      ...normalizedFocus,
      validation_focus_tags: focusTags
    });
  }

  return normalized;
}

function assignIfNonempty<Key extends keyof GenerationSessionDraft>(
  target: GenerationSessionDraft,
  key: Key,
  value: GenerationSessionDraft[Key] | undefined
) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function normalizeObject<T extends Record<string, unknown>>(input: T | undefined): T | undefined {
  if (!input) {
    return undefined;
  }

  const entries = Object.entries(input)
    .map(([key, value]) => [key, normalizeValue(value)] as const)
    .filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as T;
}

function normalizeObjectList<T extends Record<string, unknown>>(input: T[] | undefined): T[] | undefined {
  const normalized = input?.map((item) => normalizeObject(item)).filter((item): item is T => item !== undefined);
  return normalized && normalized.length > 0 ? normalized : undefined;
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
    return normalizeObject(value as Record<string, unknown>);
  }

  return value;
}
