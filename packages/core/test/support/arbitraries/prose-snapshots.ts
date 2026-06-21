import fc from "fast-check";

import type {
  BuildValidationSnapshotInput,
  ValidationRecord
} from "../../../src/index.js";

export type ProseSnapshotVariant = "minimal" | "hardCanon" | "castBands" | "material";
export type OptionalSectionVariant = "none" | "hardCanon" | "presentMinor" | "offstage";

const activeCastId = "019b0298-5c00-7000-8000-000000000901";
const presentCastId = "019b0298-5c00-7000-8000-000000000902";
const offstageCastId = "019b0298-5c00-7000-8000-000000000903";
const locationId = "019b0298-5c00-7000-8000-000000000904";
const factId = "019b0298-5c00-7000-8000-000000000905";

export const proseSnapshotInputArbitrary: fc.Arbitrary<BuildValidationSnapshotInput> = fc
  .constantFrom<ProseSnapshotVariant>("minimal", "hardCanon", "castBands", "material")
  .map((variant) => proseSnapshotInput(variant));

export const optionalSectionVariantArbitrary: fc.Arbitrary<OptionalSectionVariant> = fc.constantFrom(
  "none",
  "hardCanon",
  "presentMinor",
  "offstage"
);

export function proseSnapshotInput(variant: ProseSnapshotVariant = "material"): BuildValidationSnapshotInput {
  const records: ValidationRecord[] = [activeCast()];

  if (variant === "hardCanon" || variant === "material") {
    records.push(hardCanonFact());
  }

  if (variant === "castBands" || variant === "material") {
    records.push(presentCast(), offstageCast());
  }

  if (variant === "material") {
    records.push(locationRecord());
  }

  return {
    records,
    generationSession: {
      active_working_set: {
        selected_records: records.map((record) => record.id),
        active_onstage_cast_full: [{ cast_member_id: activeCastId, local_function: "active_speaker" }],
        present_minor_cast_compressed: records.some((record) => record.id === presentCastId) ? [presentCastId] : [],
        offstage_relevant_cast: records.some((record) => record.id === offstageCastId) ? [offstageCastId] : [],
        selected_pov: activeCastId
      },
      current_authoritative_state: {
        current_time: "Noon.",
        current_location: variant === "material" ? locationId : "Archive",
        onstage_entities: [activeCastId],
        immediate_situation_summary: "Mara waits by the desk.",
        offstage_pressuring_entities: records.some((record) => record.id === offstageCastId) ? [offstageCastId] : [],
        positions: "Mara faces the door.",
        possessions: "The ledger is on the desk.",
        visible_conditions: [],
        environmental_conditions: "The room is quiet.",
        entity_statuses: [],
        line_of_sight_and_visibility: "The stair is visible.",
        routes_and_exits: ["stair"],
        available_time: "One breath.",
        consent_or_force_conditions: "none",
        current_locks: []
      },
      immediate_handoff: {
        recent_causal_context: "The archive bell has just stopped.",
        last_visible_moment: "Mara lifted her hand from the ledger.",
        begin_after: "Begin after the bell stops."
      },
      manual_moment_directive: {
        must_render: ["Keep the exchange local."],
        may_render_if_naturally_caused: [],
        do_not_force: ["Do not reveal offstage intent."]
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {
      universalContentPolicy: {
        rating_label: "Teen",
        allowed_content_scope: "suspense",
        tonal_handling: "restrained",
        character_bias_handling: "character claims are not narrator fact"
      },
      storyContract: {
        title: "Metamorphic Contract",
        premise: "An archivist protects a ledger.",
        genre_mode: "mystery",
        tone: "tense",
        setting_baseline: "archive tower",
        content_intensity: "general",
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
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  };
}

export function optionalSectionInput(variant: OptionalSectionVariant): BuildValidationSnapshotInput {
  const input = proseSnapshotInput("minimal");
  const records = [...input.records];

  if (variant === "hardCanon") {
    records.push(hardCanonFact());
  }

  if (variant === "presentMinor") {
    records.push(presentCast());
    input.generationSession.active_working_set!.present_minor_cast_compressed = [presentCastId];
  }

  if (variant === "offstage") {
    records.push(offstageCast());
    input.generationSession.active_working_set!.offstage_relevant_cast = [offstageCastId];
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [offstageCastId];
  }

  input.records = records;
  input.generationSession.active_working_set!.selected_records = records.map((record) => record.id);
  return input;
}

function activeCast(): ValidationRecord {
  return {
    id: activeCastId,
    type: "CAST MEMBER",
    castBand: "active_onstage_cast_full",
    localFunction: "speaker",
    metadata: metadata(activeCastId, "Mara"),
    payload: {
      identity: { one_line: "Mara keeps the ledger closed." },
      voice_anchor: { core_voice: "Measured and clipped." },
      sample_utterances: [
        {
          text: "The ledger stays here.",
          situation: "refusal",
          speech_function: "boundary",
          copy_policy: "never_copy_verbatim"
        }
      ]
    }
  };
}

function presentCast(): ValidationRecord {
  return {
    id: presentCastId,
    type: "CAST MEMBER",
    castBand: "present_minor_cast_compressed",
    metadata: metadata(presentCastId, "Jon"),
    payload: {
      identity: { one_line: "Jon waits by the stair." },
      voice_anchor: { core_voice: "Plain and wary." }
    }
  };
}

function offstageCast(): ValidationRecord {
  return {
    id: offstageCastId,
    type: "CAST MEMBER",
    castBand: "offstage_relevant_cast",
    metadata: metadata(offstageCastId, "The guard"),
    payload: {
      identity: { one_line: "The guard may return." },
      voice_anchor: { core_voice: "Formal and terse." }
    }
  };
}

function hardCanonFact(): ValidationRecord {
  return {
    id: factId,
    type: "FACT",
    metadata: metadata(factId, "Archive rule"),
    payload: {
      fact_kind: "hard_canon",
      statement: "Only Mara can open the ledger.",
      known_by: "public"
    }
  };
}

function locationRecord(): ValidationRecord {
  return {
    id: locationId,
    type: "LOCATION",
    metadata: metadata(locationId, "Archive"),
    payload: {
      status: "active",
      label: "Archive",
      description: "A narrow archive room.",
      layout_relevant_now: "one desk and one stair"
    }
  };
}

function metadata(id: string, displayLabel: string): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    archived: false
  };
}
