import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";
import { refsFromStrings } from "./references.js";

export const eventStatusValues = ["active", "resolved", "background", "abandoned"] as const;
export const intentionStatusValues = ["active", "satisfied", "abandoned", "blocked"] as const;
export const planStatusValues = ["active", "blocked", "suspended", "fulfilled", "failed", "abandoned", "revised"] as const;
export const clockStatusValues = ["active", "paused", "resolved", "abandoned"] as const;
export const obligationStatusValues = ["open", "closed", "escalated", "abandoned", "transferred"] as const;
export const consequenceStatusValues = ["pending", "active", "resolved", "escalated", "abandoned"] as const;
export const openThreadStatusValues = ["active", "answered", "resolved", "escalated", "abandoned", "superseded"] as const;

const recordLinkList = z.union([z.array(recordId), z.array(nonemptyString)]).default([]);
const salienceEnum = z.enum(["low", "medium", "high", "critical"]);
const urgencyEnum = z.enum(["low", "medium", "high", "critical"]);

export const eventSchema = z
  .object({
    id: recordId,
    status: z.enum(eventStatusValues),
    event_kind: z.enum(["immediate_previous", "recent_causal", "relevant_backstory", "offstage", "withheld"]),
    sequence_order: z.union([z.number().finite(), nonemptyString, z.literal("unknown")]),
    description: nonemptyString,
    participants: z.array(recordId).default([]),
    location: z.union([recordId, z.enum(["unknown", "offstage"])]),
    pov_visibility: z.enum(["perceived_directly", "inferred_from_trace", "reported", "discovered_after", "withheld"]),
    audience_visibility: z.enum(["hidden", "implied", "explicit", "ambiguous"]),
    known_by: z.union([z.array(recordId), z.enum(["public", "unknown"])]),
    causes: recordLinkList,
    effects: recordLinkList,
    current_relevance: z.enum(["none", "low", "medium", "high", "critical"])
  })
  .strict();

export const intentionSchema = z
  .object({
    id: recordId,
    status: z.enum(intentionStatusValues),
    holder: recordId,
    intent: nonemptyString,
    urgency: urgencyEnum,
    behavioral_pressure: nonemptyString
  })
  .strict();

export const planSchema = z
  .object({
    id: recordId,
    plan_status: z.enum(planStatusValues),
    holder: recordId,
    objective: nonemptyString,
    resources: z.array(nonemptyString).default([]),
    blockers: z.array(nonemptyString).default([]),
    current_step: nonemptyString,
    fallback_steps: z.array(nonemptyString).default([]),
    visibility_to_pov: z.enum(["visible", "hidden", "suspected", "known"]),
    salience: salienceEnum,
    can_drive_prose: z.boolean()
  })
  .strict();

const tickHistorySchema = z
  .object({
    threshold: nonemptyString,
    cause: nonemptyString,
    result: nonemptyString
  })
  .strict();

export const clockSchema = z
  .object({
    id: recordId,
    status: z.enum(clockStatusValues),
    title: nonemptyString,
    clock_kind: z.enum([
      "danger",
      "racing",
      "mission",
      "faction",
      "exposure",
      "pursuit",
      "deadline",
      "worsening_condition",
      "opportunity",
      "resource",
      "emotional"
    ]),
    salience: salienceEnum,
    visibility: z.enum(["hidden", "holder_specific", "public", "factional", "audience_only"]),
    current_pressure: nonemptyString,
    tick_trigger: nonemptyString,
    next_threshold: nonemptyString,
    possible_effects: z.array(nonemptyString).default([]),
    tick_history: z.array(tickHistorySchema).default([])
  })
  .strict();

export const obligationSchema = z
  .object({
    id: recordId,
    status: z.enum(obligationStatusValues),
    obligation_kind: z.enum(["promise", "debt", "role", "legal", "social", "familial", "magical", "financial", "moral", "institutional", "other"]),
    owed_by: z.array(recordId),
    owed_to: z.union([z.array(recordId), z.enum(["public", "institution", "self", "unknown"])]),
    urgency: urgencyEnum,
    terms: nonemptyString,
    consequence_if_broken: nonemptyString,
    visibility: z.enum(["private", "shared", "public", "hidden"])
  })
  .strict();

export const consequenceSchema = z
  .object({
    id: recordId,
    status: z.enum(consequenceStatusValues),
    consequence_kind: z.enum(["physical", "emotional", "social", "legal", "financial", "reputational", "relational", "logistical", "supernatural", "institutional", "other"]),
    holder_or_target: z.union([z.array(recordId), recordId, z.enum(["public", "unknown"])]),
    cause: z.union([recordId, nonemptyString]),
    urgency: urgencyEnum,
    current_effect: nonemptyString,
    possible_next_effect: nonemptyString,
    visibility: z.enum(["hidden", "holder_specific", "public", "audience_only"])
  })
  .strict();

export const openThreadSchema = z
  .object({
    id: recordId,
    type: z.enum(["question", "promise", "unresolved_setup", "tension", "mystery", "risk"]),
    status: z.enum(openThreadStatusValues),
    title: nonemptyString,
    summary: nonemptyString,
    audience_visibility: z.enum(["hidden", "implied", "explicit", "ambiguous"]),
    urgency: urgencyEnum,
    current_relevance: z.enum(["none", "low", "medium", "high", "critical"]),
    possible_pressure_now: nonemptyString,
    answer_if_known: z.union([nonemptyString, z.literal("none")])
  })
  .strict();

export type EventRecord = z.infer<typeof eventSchema>;
export type Intention = z.infer<typeof intentionSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Clock = z.infer<typeof clockSchema>;
export type Obligation = z.infer<typeof obligationSchema>;
export type Consequence = z.infer<typeof consequenceSchema>;
export type OpenThread = z.infer<typeof openThreadSchema>;

export const causalPressureDefinitions = [
  {
    recordType: "EVENT",
    payloadSchema: eventSchema,
    statusValues: eventStatusValues,
    projectStatus: (payload: EventRecord) => payload.status,
    extractReferences: (payload: EventRecord) => [
      ...refsFromStrings("participant", payload.participants),
      ...refsFromStrings("record_link", [...payload.causes, ...payload.effects]),
      ...(Array.isArray(payload.known_by) ? refsFromStrings("known_by", payload.known_by) : [])
    ]
  },
  {
    recordType: "INTENTION",
    payloadSchema: intentionSchema,
    statusValues: intentionStatusValues,
    projectStatus: (payload: Intention) => payload.status,
    projectUrgency: (payload: Intention) => payload.urgency,
    extractReferences: (payload: Intention) => [{ refRole: "holder", targetId: payload.holder }]
  },
  {
    recordType: "PLAN",
    payloadSchema: planSchema,
    statusValues: planStatusValues,
    projectStatus: (payload: Plan) => payload.plan_status,
    projectSalience: (payload: Plan) => payload.salience,
    extractReferences: (payload: Plan) => [{ refRole: "holder", targetId: payload.holder }]
  },
  {
    recordType: "CLOCK",
    payloadSchema: clockSchema,
    statusValues: clockStatusValues,
    projectStatus: (payload: Clock) => payload.status,
    projectSalience: (payload: Clock) => payload.salience,
    extractReferences: () => []
  },
  {
    recordType: "OBLIGATION",
    payloadSchema: obligationSchema,
    statusValues: obligationStatusValues,
    projectStatus: (payload: Obligation) => payload.status,
    projectUrgency: (payload: Obligation) => payload.urgency,
    extractReferences: (payload: Obligation) => [
      ...refsFromStrings("owed_by", payload.owed_by),
      ...(Array.isArray(payload.owed_to) ? refsFromStrings("owed_to", payload.owed_to) : [])
    ]
  },
  {
    recordType: "CONSEQUENCE",
    payloadSchema: consequenceSchema,
    statusValues: consequenceStatusValues,
    projectStatus: (payload: Consequence) => payload.status,
    projectUrgency: (payload: Consequence) => payload.urgency,
    extractReferences: (payload: Consequence) => [
      ...(Array.isArray(payload.holder_or_target)
        ? refsFromStrings("holder_or_target", payload.holder_or_target)
        : /^[0-9a-f]/i.test(payload.holder_or_target)
          ? [{ refRole: "holder_or_target", targetId: payload.holder_or_target }]
          : []),
      ...(/^[0-9a-f]/i.test(payload.cause) ? [{ refRole: "record_link", targetId: payload.cause }] : [])
    ]
  },
  {
    recordType: "OPEN THREAD",
    payloadSchema: openThreadSchema,
    statusValues: openThreadStatusValues,
    projectStatus: (payload: OpenThread) => payload.status,
    projectUrgency: (payload: OpenThread) => payload.urgency,
    extractReferences: () => []
  }
] satisfies RecordTypeDefinition[];
