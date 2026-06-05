import { z } from "zod";

import { nonemptyString, recordId } from "./common.js";
import type { RecordTypeDefinition } from "./registry.js";

export const entitySchema = z
  .object({
    id: recordId,
    display_name: nonemptyString,
    entity_kind: z.enum([
      "person",
      "group",
      "institution",
      "faction",
      "family",
      "animal",
      "place_agent",
      "object_agent",
      "supernatural_force",
      "system",
      "other"
    ]),
    roles_in_story: z.array(
      z.enum([
        "viewpoint",
        "primary_actor",
        "opposing_actor",
        "allied_actor",
        "authority",
        "dependent",
        "witness",
        "information_source",
        "pressure_source",
        "social_bridge",
        "background"
      ])
    ),
    short_description: nonemptyString
  })
  .strict();

export const entityStatusSchema = z
  .object({
    entity_id: recordId,
    life: z.enum(["alive", "dead", "unknown", "not_applicable"]),
    agency: z.enum(["free", "constrained", "coerced", "captive", "incapacitated", "unconscious", "unknown", "not_applicable"]),
    location: z.union([recordId, z.enum(["unknown", "concealed", "offstage", "not_applicable"])]),
    visibility_to_pov: z.enum(["visible", "audible", "inferred", "hidden", "not_applicable"]),
    current_activity: nonemptyString
  })
  .strict();

export type Entity = z.infer<typeof entitySchema>;
export type EntityStatus = z.infer<typeof entityStatusSchema>;

export const entityDefinitions = [
  {
    recordType: "ENTITY",
    payloadSchema: entitySchema,
    extractReferences: () => []
  },
  {
    recordType: "ENTITY STATUS",
    payloadSchema: entityStatusSchema,
    extractReferences: (payload: EntityStatus) => [
      { refRole: "entity_id", targetId: payload.entity_id },
      ...(payload.location ? [{ refRole: "current_location", targetId: payload.location }] : [])
    ]
  }
] satisfies RecordTypeDefinition[];
