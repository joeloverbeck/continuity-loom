import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";

const looseObject = z.record(z.string(), z.unknown()).optional();

export const sampleUtteranceSchema = z
  .object({
    text: nonemptyString,
    situation: nonemptyString,
    speech_function: z.enum([
      "refusal",
      "bargaining",
      "evasion",
      "intimacy",
      "anger",
      "politeness",
      "threat",
      "lie",
      "confession",
      "performance",
      "other"
    ]),
    pressure_tags: z.array(nonemptyString),
    copy_policy: z
      .enum(["never_copy_verbatim", "may_reuse_cadence_not_text", "canonical_phrase"])
      .default("never_copy_verbatim")
  })
  .strict();

export const castMemberSchema = z
  .object({
    entity_id: recordId,
    identity: z
      .object({
        one_line: nonemptyString,
        public_face: nonemptyString,
        private_pressure: nonemptyString
      })
      .strict(),
    voice_anchor: z
      .object({
        core_voice: nonemptyString,
        rhythm_and_syntax: nonemptyString,
        register_and_diction: nonemptyString,
        vocabulary_and_metaphor_pools: nonemptyString,
        profanity_and_intensity: nonemptyString,
        taboo_and_avoidance_patterns: nonemptyString,
        dialogue_tactics_and_speech_functions: nonemptyString,
        address_terms_and_naming: nonemptyString,
        silence_interruption_and_turntaking: nonemptyString,
        under_pressure_voice: nonemptyString,
        suppression_or_evasion_rule: nonemptyString,
        must_preserve: z.array(nonemptyString),
        must_avoid: z.array(nonemptyString),
        anti_repetition_warnings: z.array(nonemptyString)
      })
      .strict(),
    pressure_behavior_core: z
      .object({
        cornered: nonemptyString,
        tempted_or_offered_power: nonemptyString,
        protecting_attachment: nonemptyString
      })
      .strict(),
    body_presence_core: z
      .object({
        physicality: nonemptyString,
        habitual_gestures_or_presence: nonemptyString,
        social_presentation: nonemptyString
      })
      .strict(),
    agency_core: z
      .object({
        default_strategy: nonemptyString,
        risk_style: nonemptyString
      })
      .strict(),
    world_pressure_core: z
      .object({
        world_produced_wound: nonemptyString,
        active_appetite: nonemptyString,
        self_mythology: nonemptyString,
        irreconcilable_contradiction: nonemptyString
      })
      .strict()
      .optional(),
    relational_charge: z.string().optional(),
    moral_psychological_edge: z.string().optional(),
    voice_extended: looseObject,
    body_and_presence_extended: looseObject,
    perception_and_embodiment: looseObject,
    pressure_behavior_extended: looseObject,
    agency_and_planning_extended: looseObject,
    sample_utterances: z.array(sampleUtteranceSchema).optional()
  })
  .strict();

export type CastMember = z.infer<typeof castMemberSchema>;

export const castMemberDefinition = {
  recordType: "CAST MEMBER",
  payloadSchema: castMemberSchema,
  extractReferences: (payload: CastMember) => [{ refRole: "entity_id", targetId: payload.entity_id }]
} satisfies RecordTypeDefinition<CastMember>;
