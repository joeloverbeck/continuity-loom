import { describe, expect, it } from "vitest";

import {
  castMemberSchema,
  extractRecordReferences,
  factSchema,
  generateRecordId,
  generationSessionSchema,
  getRecordTypeDefinition,
  planSchema,
  recordMetadataSchema,
  recordTypes,
  secretSchema
} from "../src/index.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

const fullCastMemberPayload = {
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
};

describe("record data model", () => {
  it("validates common metadata and rejects unknown keys", () => {
    expect(
      recordMetadataSchema.parse({
        id: idA,
        type: "FACT",
        displayLabel: "Known fact",
        status: "active",
        salience: 3,
        urgency: null,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        archived: false
      })
    ).toMatchObject({ id: idA });

    expect(() =>
      recordMetadataSchema.parse({
        id: idA,
        type: "FACT",
        displayLabel: "Known fact",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        archived: false,
        api_key: "secret"
      })
    ).toThrow();
  });

  it("generates sortable UUIDv7 record ids", () => {
    const ids = [
      generateRecordId(new Date("2026-06-05T00:00:00.000Z")),
      generateRecordId(new Date("2026-06-05T00:00:00.001Z")),
      generateRecordId(new Date("2026-06-05T00:00:00.002Z"))
    ];

    expect(ids).toEqual([...ids].sort());
    expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("registers durable record types and keeps brief surfaces out of the registry", () => {
    expect(recordTypes).toContain("FACT");
    expect(recordTypes).toContain("CAST MEMBER");
    expect(recordTypes).not.toContain("ACTIVE WORKING SET");
    expect(getRecordTypeDefinition("PLAN")?.projectStatus?.({ plan_status: "blocked" })).toBe(
      "blocked"
    );
  });

  it("validates payloads and extracts references", () => {
    expect(factSchema.parse({
      id: idA,
      status: "active",
      fact_kind: "current_state",
      statement: "A knows B.",
      scope: "entity",
      known_by: [idA],
      audience_visibility: "explicit",
      salience: "medium"
    })).toMatchObject({ status: "active" });
    expect(() =>
      secretSchema.parse({
        id: idB,
        status: "hidden",
        secret_kind: "identity",
        secret_claim: "Hidden truth",
        holders: [idA],
        non_holders_to_protect: [idB],
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "critical",
        reveal_permission: "locked",
        allowed_surface_cues: [],
        forbidden_reveals: [],
        reveal_triggers: [],
        clue_carriers: [],
        api_key: "not allowed"
      })
    ).toThrow();
    expect(() =>
      planSchema.parse({ plan_status: "active", holder: idA, objective: "Act", steps: [], can_drive_prose: true, status: "active" })
    ).toThrow();

    expect(
      extractRecordReferences("SECRET", {
        status: "hidden",
        id: idB,
        secret_kind: "identity",
        secret_claim: "Hidden truth",
        holders: [idA],
        non_holders_to_protect: [idB],
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "critical",
        reveal_permission: "locked",
        allowed_surface_cues: [],
        forbidden_reveals: [],
        reveal_triggers: [],
        clue_carriers: []
      })
    ).toEqual([
      { refRole: "secret_holder", targetId: idA },
      { refRole: "non_holder_to_protect", targetId: idB }
    ]);
  });

  it("accepts full cast dossiers and generation sessions", () => {
    expect(
      castMemberSchema.parse({
        ...fullCastMemberPayload,
        relational_charge: "toward B",
        moral_psychological_edge: "pride",
        sample_utterances: [
          {
            text: "We have time.",
            situation: "delay",
            speech_function: "evasion",
            pressure_tags: ["control"]
          }
        ]
      })
    ).toMatchObject({ entity_id: idA });

    const session = generationSessionSchema.parse({
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "At the door",
        prior_accepted_prose_status_or_handoff_note: "none",
        begin_after: "Someone knocks"
      },
      manual_moment_directive: { must_render: ["The knock"] },
      generation_validation_focus: {
        validation_focus_tags: { generation_context: ["first_segment"] }
      }
    });

    expect(session.immediate_handoff?.last_visible_moment).toBe("At the door");
  });

  it("validates CAST MEMBER extended-field schemas from story schema section 5.2", () => {
    expect(
      castMemberSchema.parse({
        ...fullCastMemberPayload,
        relational_charge: "toward B",
        moral_psychological_edge: "pride",
        voice_extended: {
          intimacy: "softens only in private",
          anger: "precise and quiet",
          lying: "over-explains dates",
          register_switching: "formal under observation",
          humor_or_irony_style: "dry understatement",
          idiom_or_sociolect_notes: "legal metaphors",
          anti_generic_warnings: ["do not make the voice broadly aristocratic"]
        },
        body_and_presence_extended: {
          body_limits: "old knee injury slows stairs",
          clothing_presentation: "immaculate cuffs",
          sensory_or_appearance_signatures: "cold mint scent"
        },
        perception_and_embodiment: {
          notices: "locked windows",
          misses: "warm gestures",
          misreads: "politeness as leverage",
          sensory_bias: "tracks temperature shifts"
        },
        pressure_behavior_extended: {
          humiliated: "becomes procedural",
          offered_power: "asks for terms",
          refused_power: "records the refusal"
        },
        agency_and_planning_extended: {
          fallback_style: "withdraw and document",
          planning_blind_spots: "assumes everyone values control"
        }
      })
    ).toMatchObject({
      voice_extended: { register_switching: "formal under observation" },
      agency_and_planning_extended: { planning_blind_spots: "assumes everyone values control" }
    });

    expect(
      castMemberSchema.parse({
        ...fullCastMemberPayload,
        voice_extended: { intimacy: "keeps confidences short" }
      }).voice_extended
    ).toEqual({ intimacy: "keeps confidences short" });

    expect(() =>
      castMemberSchema.parse({
        ...fullCastMemberPayload,
        voice_extended: { intimacy: "softens only in private", typo_field: "not allowed" }
      })
    ).toThrow();

    expect(() =>
      castMemberSchema.parse({
        ...fullCastMemberPayload,
        relational_charge: ""
      })
    ).toThrow();
  });
});
