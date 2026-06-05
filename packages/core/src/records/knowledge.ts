import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";
import { refsFromStrings } from "./references.js";

export const factStatusValues = ["active"] as const;
export const beliefStatusValues = ["active", "resolved", "abandoned"] as const;
export const secretStatusValues = ["hidden", "partially_revealed", "revealed", "disproven", "abandoned"] as const;

export const factSchema = z
  .object({
    id: recordId,
    status: z.enum(factStatusValues),
    fact_kind: z.enum(["hard_canon", "current_state", "setting_fact", "discovered_fact"]),
    statement: nonemptyString,
    scope: z.enum(["global", "entity", "location", "object", "relationship", "current_segment"]),
    known_by: z.union([z.array(recordId), z.enum(["public", "unknown", "not_applicable"])]),
    audience_visibility: z.enum(["hidden", "implied", "explicit", "not_applicable"]),
    salience: z.enum(["low", "medium", "high", "critical"])
  })
  .strict();

export const beliefSchema = z
  .object({
    id: recordId,
    status: z.enum(beliefStatusValues),
    holder: recordId,
    claim: nonemptyString,
    belief_mode: z.enum(["knows", "believes", "suspects", "doubts", "denies", "reports", "claims", "deceives", "misremembers", "interprets"]),
    truth_relation: z.enum(["true", "false", "partly_true", "unknown", "contested", "future_contingent"]),
    confidence: z.enum(["certain", "high", "medium", "low", "uncommitted"]),
    visibility: z.enum(["private", "shared", "factional", "public", "rumored", "concealed", "suppressed"]),
    access_route: z.enum([
      "direct_observation",
      "testimony",
      "document",
      "object_trace",
      "location_trace",
      "inference",
      "surveillance",
      "institutional_channel",
      "magic_tech",
      "rumor",
      "authorial_initialization"
    ]),
    behavioral_effect: nonemptyString,
    salience: z.enum(["low", "medium", "high", "critical"])
  })
  .strict();

const clueCarrierSchema = z
  .object({
    clue_text: nonemptyString,
    clue_strength: z.enum(["weak", "suggestive", "confirming", "decisive", "misleading"]),
    discovered_by: z.union([recordId, z.enum(["none", "multiple", "audience_only"])]),
    audience_visible: z.enum(["hidden", "visible", "ambiguous"]),
    status: z.enum(["available", "discovered", "destroyed", "suppressed", "superseded"])
  })
  .strict();

export const secretSchema = z
  .object({
    id: recordId,
    status: z.enum(secretStatusValues),
    secret_kind: z.enum(["identity", "motive", "location", "event_cause", "artifact_truth", "relationship", "institutional", "body_state", "plan", "other"]),
    secret_claim: nonemptyString,
    holders: z.array(recordId).default([]),
    non_holders_to_protect: z.union([z.array(recordId), z.enum(["all_except_holders", "none"])]),
    audience_visibility: z.enum(["hidden", "implied", "explicit", "ambiguous"]),
    pov_access: z.enum(["hidden", "can_suspect", "knows_partly", "knows"]),
    salience: z.enum(["low", "medium", "high", "critical"]),
    allowed_surface_cues: z.array(nonemptyString).default([]),
    forbidden_reveals: z.array(nonemptyString).default([]),
    reveal_permission: z.enum(["locked", "clue_only", "natural_reveal_allowed", "directive_required"]),
    reveal_triggers: z.array(nonemptyString).default([]),
    clue_carriers: z.array(clueCarrierSchema).default([])
  })
  .strict();

export type Fact = z.infer<typeof factSchema>;
export type Belief = z.infer<typeof beliefSchema>;
export type Secret = z.infer<typeof secretSchema>;

export const knowledgeDefinitions = [
  {
    recordType: "FACT",
    payloadSchema: factSchema,
    statusValues: factStatusValues,
    projectStatus: (payload: Fact) => payload.status,
    projectSalience: (payload: Fact) => payload.salience,
    extractReferences: (payload: Fact) =>
      Array.isArray(payload.known_by) ? refsFromStrings("known_by", payload.known_by) : []
  },
  {
    recordType: "BELIEF",
    payloadSchema: beliefSchema,
    statusValues: beliefStatusValues,
    projectStatus: (payload: Belief) => payload.status,
    projectSalience: (payload: Belief) => payload.salience,
    extractReferences: (payload: Belief) => [{ refRole: "holder", targetId: payload.holder }]
  },
  {
    recordType: "SECRET",
    payloadSchema: secretSchema,
    statusValues: secretStatusValues,
    projectStatus: (payload: Secret) => payload.status,
    projectSalience: (payload: Secret) => payload.salience,
    extractReferences: (payload: Secret) => [
      ...refsFromStrings("secret_holder", payload.holders),
      ...(Array.isArray(payload.non_holders_to_protect)
        ? refsFromStrings("non_holder_to_protect", payload.non_holders_to_protect)
        : [])
    ]
  }
] satisfies RecordTypeDefinition[];
