import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";

export const storyContractSchema = z
  .object({
    title: nonemptyString,
    premise: nonemptyString,
    genre_mode: z.union([nonemptyString, z.array(nonemptyString)]),
    tone: z.union([nonemptyString, z.array(nonemptyString)]),
    continuity_philosophy: z.literal("continuity_first"),
    setting_baseline: nonemptyString,
    content_intensity: z.enum(["general", "mature", "explicit", "graphic", "variable"]),
    explicitness: nonemptyString,
    language_register: nonemptyString,
    prose_preferences: z
      .object({
        psychic_distance: z.enum(["close", "medium", "distant", "variable"]),
        dialogue_density: z.enum(["sparse", "balanced", "moment_led", "dense"]),
        interiority: z.enum(["minimal", "filtered", "free_indirect", "direct", "variable"]),
        paragraphing: z.enum(["spare", "mixed", "lush", "variable"])
      })
      .strict()
  })
  .strict();

export const universalContentPolicySchema = z
  .object({
    rating_label: nonemptyString,
    allowed_content_scope: nonemptyString,
    tonal_handling: nonemptyString,
    governing_policy_note: nonemptyString,
    character_bias_handling: nonemptyString
  })
  .strict();

export const proseModeSchema = z
  .object({
    pov_character: z.union([recordId, z.enum(["omniscient", "variable"])]),
    person: z.enum(["first", "second", "third", "omniscient"]),
    tense: z.enum(["past", "present", "future", "variable"]),
    psychic_distance: z.enum(["close", "medium", "distant", "variable"]),
    interiority_mode: z.enum(["minimal", "filtered", "free_indirect", "direct", "variable"]),
    dialogue_density: z.enum(["sparse", "balanced", "moment_led", "dense"]),
    paragraphing: z.enum(["spare", "mixed", "lush", "variable"]),
    language_output: nonemptyString,
    special_style_constraints: z.array(nonemptyString).default([])
  })
  .strict();

export type StoryContract = z.infer<typeof storyContractSchema>;
export type UniversalContentPolicy = z.infer<typeof universalContentPolicySchema>;
export type ProseMode = z.infer<typeof proseModeSchema>;
