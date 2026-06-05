import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";

export const relationshipStatusValues = ["active", "resolved", "abandoned"] as const;
export const emotionStatusValues = ["active", "suppressed", "settled", "transformed", "dissociated"] as const;

export const relationshipSchema = z
  .object({
    id: recordId,
    status: z.enum(relationshipStatusValues),
    axis: z.enum([
      "trust",
      "fear",
      "desire",
      "debt",
      "intimacy",
      "loyalty",
      "resentment",
      "power_imbalance",
      "attention",
      "familiarity",
      "approval",
      "respect",
      "obligation",
      "hostility",
      "dependency",
      "rivalry",
      "protectiveness",
      "other"
    ]),
    direction_kind: z.enum(["directed", "bidirectional"]),
    from: recordId,
    to: recordId,
    value: z.enum(["none", "trace", "low", "medium", "high", "extreme"]),
    valence: z.enum(["symmetric", "asymmetric", "bidirectional", "adversarial", "unstable"]),
    visibility: z.enum(["private", "shared", "public", "hidden", "audience_only"]),
    description: nonemptyString,
    pressure_text: nonemptyString,
    current_expression: nonemptyString
  })
  .strict();

export const emotionSchema = z
  .object({
    id: recordId,
    status: z.enum(emotionStatusValues),
    holder: recordId,
    description: nonemptyString,
    affect_kind: z.enum([
      "fear",
      "anxiety",
      "anger",
      "disgust",
      "grief",
      "shame",
      "guilt",
      "humiliation",
      "hope",
      "relief",
      "joy",
      "awe",
      "tenderness",
      "desire",
      "envy",
      "contempt",
      "confusion",
      "dread",
      "numbness",
      "mixed",
      "null"
    ]),
    intensity: z.enum(["low", "medium", "high", "extreme"]),
    behavioral_pressure: z.array(
      z.enum([
        "approach",
        "flee",
        "freeze",
        "attack",
        "reject",
        "dominate",
        "submit",
        "seek_contact",
        "protect_other",
        "seek_help",
        "confess",
        "conceal",
        "withdraw_socially",
        "plan",
        "accommodate",
        "self_soothe",
        "ruminate",
        "collapse"
      ])
    ),
    visibility: z.enum(["private", "visible", "inferred", "hidden"]),
    surface_expression: nonemptyString
  })
  .strict();

export type Relationship = z.infer<typeof relationshipSchema>;
export type Emotion = z.infer<typeof emotionSchema>;

export const relationshipEmotionDefinitions = [
  {
    recordType: "RELATIONSHIP",
    payloadSchema: relationshipSchema,
    statusValues: relationshipStatusValues,
    projectStatus: (payload: Relationship) => payload.status,
    extractReferences: (payload: Relationship) => [
      { refRole: "from", targetId: payload.from },
      { refRole: "to", targetId: payload.to }
    ]
  },
  {
    recordType: "EMOTION",
    payloadSchema: emotionSchema,
    statusValues: emotionStatusValues,
    projectStatus: (payload: Emotion) => payload.status,
    extractReferences: (payload: Emotion) => [{ refRole: "holder", targetId: payload.holder }]
  }
] satisfies RecordTypeDefinition[];
