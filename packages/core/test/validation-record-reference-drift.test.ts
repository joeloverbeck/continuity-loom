import { extractRecordReferences, recordTypeRegistry } from "../src/index.js";
import { describe, expect, it } from "vitest";
import type { z } from "zod";

type ZodInternalDef = {
  type?: unknown;
  format?: unknown;
  element?: unknown;
  innerType?: unknown;
  options?: unknown;
  shape?: unknown;
};

type ZodSchemaWithInternals = z.ZodType & {
  def?: unknown;
  _def?: unknown;
  shape?: unknown;
};

const idA = "019b0298-5c00-7000-8000-000000000601";
const idB = "019b0298-5c00-7000-8000-000000000602";

const expectedRoleByPath: Readonly<Record<string, string>> = {
  "BELIEF.holder": "holder",
  "CAST MEMBER.entity_id": "entity_id",
  "CONSEQUENCE.cause": "record_link",
  "CONSEQUENCE.holder_or_target": "holder_or_target",
  "CONSEQUENCE.holder_or_target[]": "holder_or_target",
  "ENTITY STATUS.entity_id": "entity_id",
  "ENTITY STATUS.location": "current_location",
  "EMOTION.holder": "holder",
  "EVENT.causes[]": "record_link",
  "EVENT.effects[]": "record_link",
  "EVENT.known_by[]": "known_by",
  "EVENT.location": "location",
  "EVENT.participants[]": "participant",
  "FACT.known_by[]": "known_by",
  "INTENTION.holder": "holder",
  "OBJECT.carried_by": "carried_by",
  "OBJECT.current_location": "current_location",
  "OBJECT.owner": "owner",
  "OBLIGATION.owed_by[]": "owed_by",
  "OBLIGATION.owed_to[]": "owed_to",
  "PLAN.holder": "holder",
  "RELATIONSHIP.from": "from",
  "RELATIONSHIP.to": "to",
  "SECRET.holders[]": "secret_holder",
  "SECRET.non_holders_to_protect[]": "non_holder_to_protect",
  "VISIBLE AFFORDANCE.available_to": "available_to"
};

const exemptRecordIdPaths: Readonly<Record<string, string>> = {
  "ENTITY.id": "Payload id is the record's own identifier, not an outbound reference.",
  "FACT.id": "Payload id is the record's own identifier, not an outbound reference.",
  "BELIEF.id": "Payload id is the record's own identifier, not an outbound reference.",
  "SECRET.id": "Payload id is the record's own identifier, not an outbound reference.",
  "LOCATION.id": "Payload id is the record's own identifier, not an outbound reference.",
  "OBJECT.id": "Payload id is the record's own identifier, not an outbound reference.",
  "VISIBLE AFFORDANCE.id": "Payload id is the record's own identifier, not an outbound reference.",
  "EVENT.id": "Payload id is the record's own identifier, not an outbound reference.",
  "INTENTION.id": "Payload id is the record's own identifier, not an outbound reference.",
  "PLAN.id": "Payload id is the record's own identifier, not an outbound reference.",
  "CLOCK.id": "Payload id is the record's own identifier, not an outbound reference.",
  "OBLIGATION.id": "Payload id is the record's own identifier, not an outbound reference.",
  "CONSEQUENCE.id": "Payload id is the record's own identifier, not an outbound reference.",
  "OPEN THREAD.id": "Payload id is the record's own identifier, not an outbound reference.",
  "RELATIONSHIP.id": "Payload id is the record's own identifier, not an outbound reference.",
  "EMOTION.id": "Payload id is the record's own identifier, not an outbound reference.",
  "SECRET.clue_carriers[].discovered_by": "Compiler surfaces clue text only for clue carriers; discovered_by ids are not prompt-facing reference lanes."
};

const representativePayloadByType: Readonly<Record<string, unknown>> = {
  "ENTITY": {
    id: idA,
    display_name: "A",
    entity_kind: "person",
    roles_in_story: ["viewpoint"],
    short_description: "A careful witness."
  },
  "ENTITY STATUS": {
    entity_id: idA,
    life: "alive",
    agency: "free",
    location: idB,
    visibility_to_pov: "visible",
    current_activity: "Watching the door."
  },
  "CAST MEMBER": {
    entity_id: idA,
    identity: {
      one_line: "A careful operator.",
      public_face: "Composed",
      private_pressure: "Fearful"
    },
    voice_anchor: {
      core_voice: "formal",
      rhythm_and_syntax: "measured",
      register_and_diction: "precise",
      vocabulary_and_metaphor_pools: "weather",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "home",
      dialogue_tactics_and_speech_functions: "deflects",
      address_terms_and_naming: "titles",
      silence_interruption_and_turntaking: "strategic",
      under_pressure_voice: "clipped",
      suppression_or_evasion_rule: "redirects",
      must_preserve: ["precision"],
      must_avoid: ["rambling"],
      anti_repetition_warnings: ["do not repeat weather metaphors"]
    },
    pressure_behavior_core: {
      cornered: "narrows choices",
      tempted_or_offered_power: "bargains",
      protecting_attachment: "deflects"
    },
    body_presence_core: {
      physicality: "still",
      habitual_gestures_or_presence: "folded hands",
      social_presentation: "controlled"
    },
    agency_core: { default_strategy: "delay", risk_style: "calculated" }
  },
  "FACT": {
    id: idA,
    fact_kind: "current_state",
    statement: "A knows B.",
    scope: "entity",
    known_by: [idB],
    audience_visibility: "explicit",
    salience: "medium"
  },
  "BELIEF": {
    id: idA,
    status: "active",
    holder: idB,
    claim: "The door is watched.",
    belief_mode: "believes",
    truth_relation: "unknown",
    confidence: "medium",
    visibility: "private",
    access_route: "inference",
    behavioral_effect: "A hesitates.",
    salience: "medium"
  },
  "SECRET": {
    id: idA,
    status: "hidden",
    secret_kind: "identity",
    secret_claim: "The witness is using an alias.",
    holders: [idA],
    non_holders_to_protect: [idB],
    audience_visibility: "hidden",
    pov_access: "hidden",
    salience: "critical",
    allowed_surface_cues: [],
    forbidden_reveals: [],
    reveal_permission: "locked",
    reveal_triggers: [],
    clue_carriers: [
      {
        clue_text: "A familiar signature.",
        clue_strength: "suggestive",
        discovered_by: idB,
        audience_visible: "hidden",
        status: "available"
      }
    ]
  },
  "LOCATION": {
    id: idA,
    status: "active",
    label: "Station",
    description: "A locked station.",
    layout_relevant_now: "One stairwell.",
    access_routes: [],
    visibility_and_sound: "Dim and echoing.",
    hazards_or_shelters: [],
    social_rules: []
  },
  "OBJECT": {
    id: idA,
    status: "active",
    label: "Key",
    description: "A brass key.",
    owner: idA,
    carried_by: idB,
    current_location: idA,
    visibility_to_pov: "visible",
    usable_affordances: [],
    constraints: [],
    durability: "continuity_relevant"
  },
  "VISIBLE AFFORDANCE": {
    id: idA,
    status: "available",
    label: "Open the grate",
    available_to: idB,
    action_families: ["move"],
    requires: [],
    risk: "physical",
    durability: "reversible_state_change",
    prompt_text: "The grate can be opened."
  },
  "EVENT": {
    id: idA,
    status: "active",
    event_kind: "recent_causal",
    sequence_order: 1,
    description: "A found B at the station.",
    participants: [idA],
    location: idB,
    pov_visibility: "perceived_directly",
    audience_visibility: "explicit",
    known_by: [idB],
    causes: [idA],
    effects: [idB],
    current_relevance: "high"
  },
  "INTENTION": {
    id: idA,
    status: "active",
    holder: idB,
    intent: "Find the exit.",
    urgency: "high",
    behavioral_pressure: "Moves quickly."
  },
  "PLAN": {
    id: idA,
    plan_status: "active",
    holder: idB,
    objective: "Reach the roof.",
    resources: [],
    blockers: [],
    current_step: "Find the stairs.",
    fallback_steps: [],
    visibility_to_pov: "hidden",
    salience: "high"
  },
  "CLOCK": {
    id: idA,
    status: "active",
    title: "Security arrives",
    clock_kind: "danger",
    salience: "high",
    visibility: "public",
    current_pressure: "Footsteps approach.",
    tick_trigger: "Noise.",
    next_threshold: "Door opens.",
    possible_effects: [],
    tick_history: []
  },
  "OBLIGATION": {
    id: idA,
    status: "open",
    obligation_kind: "promise",
    owed_by: [idA],
    owed_to: [idB],
    urgency: "medium",
    terms: "Keep watch.",
    consequence_if_broken: "Trust breaks.",
    visibility: "private"
  },
  "CONSEQUENCE": {
    id: idA,
    status: "active",
    consequence_kind: "physical",
    holder_or_target: [idA],
    cause: idB,
    urgency: "medium",
    current_effect: "The wing is unsafe.",
    possible_next_effect: "The exit may close.",
    visibility: "public"
  },
  "OPEN THREAD": {
    id: idA,
    type: "question",
    status: "active",
    title: "Who opened the door?",
    summary: "The door opened offstage.",
    audience_visibility: "hidden",
    urgency: "medium",
    current_relevance: "high",
    possible_pressure_now: "Suspicion rises.",
    answer_if_known: "none"
  },
  "RELATIONSHIP": {
    id: idA,
    status: "active",
    axis: "trust",
    direction_kind: "directed",
    from: idA,
    to: idB,
    value: "medium",
    valence: "asymmetric",
    visibility: "private",
    description: "A guarded alliance.",
    pressure_text: "Trust is conditional.",
    current_expression: "Careful cooperation."
  },
  "EMOTION": {
    id: idA,
    status: "active",
    holder: idB,
    description: "A quiet fear.",
    affect_kind: "fear",
    intensity: "medium",
    behavioral_pressure: ["freeze"],
    visibility: "private",
    surface_expression: "Still hands."
  }
};

describe("record reference extraction drift", () => {
  it("keeps recordId-like schema paths mapped to extractReferences roles or explicit exemptions", () => {
    const schemaPaths = Object.entries(recordTypeRegistry).flatMap(([recordType, definition]) =>
      recordIdPaths(definition.payloadSchema).map((path) => `${recordType}.${path}`)
    );

    expect(
      schemaPaths.filter((path) => !(path in expectedRoleByPath) && !(path in exemptRecordIdPaths)).sort(),
      "recordId schema paths without extraction mapping or exemption"
    ).toEqual([]);

    expect(
      Object.keys(expectedRoleByPath).filter((path) => !schemaPaths.includes(path)).sort(),
      "reference mappings that no longer match a recordId schema path"
    ).toEqual([]);

    expect(
      Object.values(exemptRecordIdPaths).filter((reason) => reason.trim().length === 0),
      "reference exemptions must explain why the field is exempt"
    ).toEqual([]);
  });

  it("emits the mapped reference role for every non-exempt recordId-like schema path", () => {
    for (const [path, expectedRole] of Object.entries(expectedRoleByPath)) {
      const recordType = path.slice(0, path.lastIndexOf("."));
      const payload = representativePayloadByType[recordType];

      expect(payload, `missing representative payload for ${recordType}`).toBeDefined();
      expect(
        extractRecordReferences(recordType, payload).map((reference) => reference.refRole),
        path
      ).toContain(expectedRole);
    }
  });
});

function recordIdPaths(schema: z.ZodType, prefix = ""): string[] {
  const def = schemaDef(schema);

  if (isUuidSchema(def)) {
    return [prefix];
  }

  switch (def.type) {
    case "array":
      return isZodType(def.element) ? recordIdPaths(def.element, `${prefix}[]`) : [];
    case "default":
    case "optional":
      return isZodType(def.innerType) ? recordIdPaths(def.innerType, prefix) : [];
    case "object":
      return Object.entries(schemaShape(schema)).flatMap(([key, child]) =>
        recordIdPaths(child, prefix ? `${prefix}.${key}` : key)
      );
    case "union":
      return Array.isArray(def.options)
        ? def.options.filter(isZodType).flatMap((option) => recordIdPaths(option, prefix))
        : [];
    default:
      return [];
  }
}

function schemaDef(schema: z.ZodType): ZodInternalDef {
  const schemaWithInternals = schema as ZodSchemaWithInternals;
  const def = schemaWithInternals.def ?? schemaWithInternals._def;

  return isObjectRecord(def) ? def : {};
}

function schemaShape(schema: z.ZodType): Record<string, z.ZodType> {
  const directShape = (schema as ZodSchemaWithInternals).shape;
  const defShape = schemaDef(schema).shape;

  if (isZodShape(directShape)) {
    return directShape;
  }

  return isZodShape(defShape) ? defShape : {};
}

function isUuidSchema(def: ZodInternalDef): boolean {
  return def.type === "string" && def.format === "uuid";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isZodType(value: unknown): value is z.ZodType {
  return isObjectRecord(value) && "parse" in value;
}

function isZodShape(value: unknown): value is Record<string, z.ZodType> {
  return isObjectRecord(value) && Object.values(value).every(isZodType);
}
