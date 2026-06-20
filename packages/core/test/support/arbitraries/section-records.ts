import fc from "fast-check";

import type {
  BuildValidationSnapshotInput,
  ValidationRecord
} from "../../../src/index.js";

export const sectionFixtureVariantArbitrary = fc.constantFrom("populated", "empty");

const activeCastId = "019b0298-5c00-7000-8000-000000000801";
const presentCastId = "019b0298-5c00-7000-8000-000000000802";
const offstageCastId = "019b0298-5c00-7000-8000-000000000803";
const entityId = "019b0298-5c00-7000-8000-000000000804";
const locationId = "019b0298-5c00-7000-8000-000000000805";
const objectId = "019b0298-5c00-7000-8000-000000000806";
const affordanceId = "019b0298-5c00-7000-8000-000000000807";

export function emptySectionInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

export function populatedSectionInput(): BuildValidationSnapshotInput {
  return {
    records: [
      activeCast(),
      presentCast(),
      offstageCast(),
      factRecord(),
      relationshipRecord(),
      emotionRecord(),
      intentionRecord(),
      planRecord(),
      clockRecord(),
      obligationRecord(),
      consequenceRecord(),
      openThreadRecord(),
      locationRecord(),
      objectRecord(),
      affordanceRecord("available"),
      affordanceRecord("blocked"),
      entityStatusRecord(),
      secretRecord(),
      beliefRecord(),
      eventRecord("019b0298-5c00-7000-8000-000000000818", "immediate_previous", "The guard knocked once.", "seen"),
      eventRecord("019b0298-5c00-7000-8000-000000000819", "relevant_backstory", "Mara hid the ledger last winter.", "writer_visible"),
      eventRecord("019b0298-5c00-7000-8000-000000000820", "withheld", "The clerk already copied the key.", "withheld")
    ],
    generationSession: {
      active_working_set: {
        selected_records: [
          activeCastId,
          presentCastId,
          offstageCastId,
          locationId,
          objectId,
          affordanceId
        ],
        active_onstage_cast_full: [{ cast_member_id: activeCastId, local_function: "active_speaker" }],
        present_minor_cast_compressed: [presentCastId],
        offstage_relevant_cast: [offstageCastId],
        selected_pov: activeCastId
      },
      current_authoritative_state: {
        current_time: "Dawn.",
        current_location: locationId,
        onstage_entities: [entityId],
        immediate_situation_summary: "Mara guards the ledger while the corridor goes quiet.",
        offstage_pressuring_entities: [offstageCastId],
        positions: "Mara stands by the locked desk.",
        possessions: "The ledger is under Mara's hand.",
        visible_conditions: ["Mara has ink on one cuff."],
        environmental_conditions: "Rain taps the windows.",
        entity_statuses: [entityId],
        line_of_sight_and_visibility: "The stair is visible from the desk.",
        routes_and_exits: ["stair", "rear door"],
        available_time: "One exchange.",
        consent_or_force_conditions: "none",
        current_locks: ["The desk drawer is locked."]
      },
      immediate_handoff: {
        recent_causal_context: "The guard left to fetch the clerk.",
        last_visible_moment: "Mara touched the key.",
        begin_after: "Begin with Mara at the desk."
      },
      manual_moment_directive: {
        must_render: ["Mara refuses to surrender the ledger."],
        may_render_if_naturally_caused: ["The guard may knock from the stair."],
        do_not_force: ["Do not reveal the copied key."]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: activeCastId,
          current_voice_pressure: "Keep Mara clipped and procedural.",
          dialogue_pressure: "Use precise deflection.",
          pov_narration_pressure: "Let narration stay close and guarded.",
          nonverbal_or_silence_pressure: "Use stillness before speech.",
          current_must_preserve: ["precision"],
          current_must_avoid: ["warm banter"]
        },
        {
          cast_member_id: presentCastId,
          current_voice_pressure: "Keep Jon reluctant.",
          dialogue_pressure: "Only answer if addressed.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "Prefer silence.",
          current_must_preserve: [],
          current_must_avoid: ["exposition"]
        }
      ],
      cast_voice_overrides: [
        {
          cast_member_id: activeCastId,
          reason: "Current fear is hidden.",
          applies_to: ["dialogue", "silence"],
          override_text: "Make responses shorter than usual."
        },
        {
          cast_member_id: presentCastId,
          reason: "Background character.",
          applies_to: ["dialogue"],
          override_text: "Keep him terse."
        }
      ]
    },
    storyConfig: {
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "suspense and coercion",
        tonal_handling: "restrained",
        character_bias_handling: "character claims are not narrator fact"
      },
      storyContract: {
        title: "Section Contract",
        premise: "An archivist protects a ledger.",
        genre_mode: "mystery",
        tone: "tense",
        setting_baseline: "archive tower",
        content_intensity: "mature",
        explicitness: "non-graphic",
        language_register: "literary"
      },
      proseMode: {
        pov_character: activeCastId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: ["concrete sensory detail"]
      }
    },
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

function activeCast(): ValidationRecord {
  return {
    id: activeCastId,
    type: "CAST MEMBER",
    castBand: "active_onstage_cast_full",
    localFunction: "active_speaker",
    metadata: metadata(activeCastId, "Mara"),
    payload: {
      entity_id: entityId,
      identity: {
        one_line: "Mara guards the archive.",
        public_face: "calm",
        private_pressure: "afraid"
      },
      voice_anchor: {
        core_voice: "Measured and clipped.",
        rhythm_and_syntax: "Short clauses.",
        register_and_diction: "formal"
      },
      pressure_behavior_core: {
        cornered: "answers narrowly"
      },
      body_presence_core: {
        physicality: "still hands"
      },
      agency_core: {
        default_strategy: "delay"
      },
      sample_utterances: [
        sample("Look at the index.", "deflection"),
        sample("The key is logged.", "boundary"),
        sample("Protocol decides this.", "refusal"),
        sample("Fourth sample must not render.", "overflow")
      ]
    }
  };
}

function presentCast(): ValidationRecord {
  return compressedCast(presentCastId, "present_minor_cast_compressed", "Jon watches from the stair.");
}

function offstageCast(): ValidationRecord {
  return compressedCast(offstageCastId, "offstage_relevant_cast", "The guard may return soon.");
}

function compressedCast(
  id: string,
  castBand: "present_minor_cast_compressed" | "offstage_relevant_cast",
  oneLine: string
): ValidationRecord {
  return {
    id,
    type: "CAST MEMBER",
    castBand,
    metadata: metadata(id, oneLine),
    payload: {
      entity_id: entityId,
      identity: { one_line: oneLine },
      voice_anchor: { core_voice: "Plainspoken and wary." }
    }
  };
}

function sample(text: string, situation: string): Record<string, unknown> {
  return {
    text,
    situation,
    speech_function: "refusal",
    pressure_tags: ["control"],
    copy_policy: "never_copy_verbatim"
  };
}

function factRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000808", "FACT", "Canon", {
    fact_kind: "hard_canon",
    statement: "The archive key is unique.",
    known_by: "public"
  });
}

function secretRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000821", "SECRET", "Copied key", {
    status: "hidden",
    secret_kind: "security",
    secret_claim: "The clerk copied the archive key.",
    holders: [offstageCastId],
    non_holders_to_protect: "all_except_holders",
    pov_access: "does_not_know",
    audience_visibility: "explicit",
    allowed_surface_cues: ["Mara notices wax on the key ring."],
    clue_carriers: [
      {
        status: "available",
        clue_text: "A wax smear marks the copied key."
      },
      {
        status: "spent",
        clue_text: "This spent clue must not render."
      }
    ],
    forbidden_reveals: "none",
    reveal_permission: "clue_only",
    reveal_triggers: ["Mara studies the key."]
  });
}

function beliefRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000822", "BELIEF", "Mara suspects Jon", {
    holder: activeCastId,
    belief_mode: "suspects",
    claim: "Jon may be stalling for the guard.",
    truth_relation: "uncertain",
    confidence: "medium",
    access_route: "tone",
    behavioral_effect: "Mara keeps answers short.",
    visibility: "private"
  });
}

function relationshipRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000809", "RELATIONSHIP", "Mara/Jon", {
    description: "Mara distrusts Jon",
    pressure_text: "Trust is thin.",
    current_expression: "They speak around the ledger."
  });
}

function emotionRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000810", "EMOTION", "Mara fear", {
    description: "Mara is afraid",
    surface_expression: "Her hands stay still."
  });
}

function intentionRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000811", "INTENTION", "Protect ledger", {
    status: "active",
    intent: "Keep the ledger on the desk.",
    holder: activeCastId,
    urgency: "high",
    behavioral_pressure: "Answers only what is asked."
  });
}

function planRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000812", "PLAN", "Delay guard", {
    plan_status: "active",
    objective: "Delay the guard.",
    holder: activeCastId,
    current_step: "stand between guard and desk",
    resources: "archive rules",
    blockers: "Jon is watching",
    visibility_to_pov: "visible"
  });
}

function clockRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000813", "CLOCK", "Audit round", {
    status: "active",
    title: "Audit round",
    current_pressure: "The guard may return soon.",
    tick_trigger: "The bell rings.",
    next_threshold: "Someone reaches the stair.",
    possible_effects: "Mara must hide the ledger."
  });
}

function obligationRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000814", "OBLIGATION", "Archive oath", {
    status: "open",
    terms: "Protect archive records.",
    owed_by: activeCastId,
    owed_to: "institution",
    urgency: "high",
    consequence_if_broken: "Mara loses authority."
  });
}

function consequenceRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000815", "CONSEQUENCE", "Exposure risk", {
    status: "active",
    current_effect: "The copied key could expose Mara.",
    holder_or_target: activeCastId,
    cause: "public",
    urgency: "medium",
    possible_next_effect: "Jon may suspect her."
  });
}

function openThreadRecord(): ValidationRecord {
  return record("019b0298-5c00-7000-8000-000000000816", "OPEN THREAD", "Missing page", {
    status: "active",
    title: "Missing page",
    summary: "A ledger page is gone.",
    urgency: "high",
    possible_pressure_now: "The scene may hint at the gap."
  });
}

function locationRecord(): ValidationRecord {
  return record(locationId, "LOCATION", "Archive", {
    status: "active",
    label: "Archive",
    description: "Tall shelves.",
    layout_relevant_now: "one narrow aisle",
    access_routes: ["stair"],
    visibility_and_sound: "echoing",
    hazards_or_shelters: "loose paper",
    social_rules: "quiet"
  });
}

function objectRecord(): ValidationRecord {
  return record(objectId, "OBJECT", "Ledger", {
    status: "active",
    label: "Ledger",
    description: "A brass-bound ledger.",
    owner: activeCastId,
    carried_by: activeCastId,
    current_location: locationId,
    visibility_to_pov: "visible",
    usable_affordances: ["read", "hide"],
    constraints: "too large for a pocket"
  });
}

function affordanceRecord(status: "available" | "blocked"): ValidationRecord {
  return record(
    status === "available" ? affordanceId : "019b0298-5c00-7000-8000-000000000817",
    "VISIBLE AFFORDANCE",
    status === "available" ? "Hide ledger" : "Open drawer",
    {
      status,
      label: status === "available" ? "Hide ledger" : "Open drawer",
      prompt_text: status === "available" ? "Mara can slide the ledger under papers." : "The locked drawer cannot open.",
      available_to: activeCastId,
      action_families: ["conceal"],
      requires: "free hand",
      risk: "paper noise",
      durability: "temporary"
    }
  );
}

function entityStatusRecord(): ValidationRecord {
  return record(entityId, "ENTITY STATUS", "Mara status", {
    entity_id: activeCastId,
    life: "alive",
    agency: "mobile",
    location: locationId,
    visibility_to_pov: "visible",
    current_activity: "guarding the ledger"
  });
}

function eventRecord(id: string, kind: string, description: string, visibility: string): ValidationRecord {
  return record(id, "EVENT", description, {
    event_kind: kind,
    description,
    pov_visibility: visibility,
    current_relevance: "high"
  });
}

function record(id: string, type: string, label: string, payload: Record<string, unknown>): ValidationRecord {
  return {
    id,
    type,
    metadata: metadata(id, label),
    payload
  };
}

function metadata(id: string, displayLabel: string): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    archived: false
  };
}
