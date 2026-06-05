import { z } from "zod";

import { nonemptyString, recordId, referenceIfId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";
import { compactReferences, refsFromStrings } from "./references.js";

export const locationStatusValues = ["active", "inactive", "destroyed", "inaccessible"] as const;
export const objectStatusValues = ["active", "lost", "destroyed", "transferred", "inactive"] as const;
export const visibleAffordanceStatusValues = ["available", "blocked", "unavailable"] as const;
export const affordanceActionFamilies = [
  "move",
  "evade",
  "pursue",
  "perceive",
  "investigate",
  "communicate",
  "persuade",
  "negotiate",
  "bond",
  "oppose",
  "harm",
  "protect",
  "control",
  "transfer",
  "use",
  "make_change",
  "ritual_protocol",
  "recover",
  "wait",
  "decide"
] as const;

export const locationSchema = z
  .object({
    id: recordId,
    status: z.enum(locationStatusValues),
    label: nonemptyString,
    description: nonemptyString,
    layout_relevant_now: nonemptyString,
    access_routes: z.array(nonemptyString).default([]),
    visibility_and_sound: nonemptyString,
    hazards_or_shelters: z.array(nonemptyString).default([]),
    social_rules: z.array(nonemptyString).default([])
  })
  .strict();

export const objectSchema = z
  .object({
    id: recordId,
    status: z.enum(objectStatusValues),
    label: nonemptyString,
    description: nonemptyString,
    owner: z.union([recordId, z.enum(["none", "unknown"])]),
    carried_by: z.union([recordId, z.enum(["none", "unknown"])]),
    current_location: z.union([recordId, z.enum(["carried_by_holder", "unknown", "offstage"])]),
    visibility_to_pov: z.enum(["visible", "hidden", "inferred", "unknown"]),
    usable_affordances: z.array(nonemptyString).default([]),
    constraints: z.array(nonemptyString).default([]),
    durability: z.enum(["local_texture", "continuity_relevant", "major"])
  })
  .strict();

export const visibleAffordanceSchema = z
  .object({
    id: recordId,
    status: z.enum(visibleAffordanceStatusValues),
    label: nonemptyString,
    available_to: z.union([recordId, z.enum(["group", "any_onstage"])]),
    action_families: z.array(z.enum(affordanceActionFamilies)),
    requires: z.array(nonemptyString).default([]),
    risk: z.enum(["none", "social", "physical", "legal", "emotional", "secrecy", "mixed"]),
    durability: z.enum(["local", "reversible_state_change", "durable_state_change", "irreversible"]),
    prompt_text: nonemptyString
  })
  .strict();

export type Location = z.infer<typeof locationSchema>;
export type StoryObject = z.infer<typeof objectSchema>;
export type VisibleAffordance = z.infer<typeof visibleAffordanceSchema>;

export const spaceMaterialDefinitions = [
  {
    recordType: "LOCATION",
    payloadSchema: locationSchema,
    statusValues: locationStatusValues,
    projectStatus: (payload: Location) => payload.status,
    extractReferences: () => []
  },
  {
    recordType: "OBJECT",
    payloadSchema: objectSchema,
    statusValues: objectStatusValues,
    projectStatus: (payload: StoryObject) => payload.status,
    extractReferences: (payload: StoryObject) =>
      compactReferences([
        referenceIfId("owner", payload.owner),
        referenceIfId("carried_by", payload.carried_by),
        referenceIfId("current_location", payload.current_location)
      ])
  },
  {
    recordType: "VISIBLE AFFORDANCE",
    payloadSchema: visibleAffordanceSchema,
    statusValues: visibleAffordanceStatusValues,
    projectStatus: (payload: VisibleAffordance) => payload.status,
    extractReferences: (payload: VisibleAffordance) => refsFromStrings("available_to", payload.available_to ? [payload.available_to] : [])
  }
] satisfies RecordTypeDefinition[];
