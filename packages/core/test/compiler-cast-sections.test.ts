import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { describe, expect, it } from "vitest";

const activeCastId = "019b0298-5c00-7000-8000-000000000301";
const presentCastId = "019b0298-5c00-7000-8000-000000000302";
const offstageCastId = "019b0298-5c00-7000-8000-000000000303";
const entityId = "019b0298-5c00-7000-8000-000000000304";
const longCastOneLine =
  "Jon Ureña is a wary witness at the archive door whose clipped silence hides fear, resentment, and a precise memory of the stolen ledger.";

function castPayload() {
  return {
    entity_id: entityId,
    identity: {
      one_line: "Mara is a precise archivist under pressure.",
      public_face: "Calm and procedural.",
      private_pressure: "Terrified of being found out."
    },
    voice_anchor: {
      core_voice: "Measured, clipped, and evasive.",
      rhythm_and_syntax: "Short clauses before longer deflections.",
      register_and_diction: "Formal unless cornered.",
      vocabulary_and_metaphor_pools: "ledgers, locks, weather",
      profanity_and_intensity: "Rare profanity, sharp when it lands.",
      taboo_and_avoidance_patterns: "Avoids direct admissions.",
      dialogue_tactics_and_speech_functions: "Answers questions with procedures.",
      address_terms_and_naming: "Uses titles under stress.",
      silence_interruption_and_turntaking: "Lets silence do work.",
      under_pressure_voice: "Quieter and more exact.",
      suppression_or_evasion_rule: "Redirects to protocol.",
      must_preserve: ["precision", "restraint"],
      must_avoid: ["bubbly warmth"],
      anti_repetition_warnings: ["Do not overuse ledger metaphors."]
    },
    voice_extended: {
      intimacy: "Softens only through practical help.",
      anger: "Becomes colder.",
      anti_generic_warnings: ["No generic trembling."]
    },
    pressure_behavior_core: {
      cornered: "Offers a technically true answer.",
      tempted_or_offered_power: "Calculates the debt first.",
      protecting_attachment: "Moves before explaining."
    },
    body_presence_core: {
      physicality: "Still shoulders, quick hands.",
      habitual_gestures_or_presence: "Smooths paper edges.",
      social_presentation: "Unobtrusive authority."
    },
    agency_core: {
      default_strategy: "Delay, redirect, document.",
      risk_style: "Accepts quiet procedural risk."
    },
    world_pressure_core: {
      world_produced_wound: "Institutions taught her truth is expensive.",
      active_appetite: "Needs the archive to stay intact.",
      self_mythology: "Believes she is the last responsible person.",
      irreconcilable_contradiction: "Protects records by hiding records."
    },
    relational_charge: "Trust is transactional right now.",
    moral_psychological_edge: "Will lie to preserve evidence.",
    body_and_presence_extended: {
      body_limits: "Sleep deprived.",
      clothing_presentation: "Ink on one cuff.",
      sensory_or_appearance_signatures: "Smells faintly of dust and rain."
    },
    perception_and_embodiment: {
      notices: "Misfiled paper edges.",
      misses: "Gentle concern.",
      misreads: "Kindness as leverage.",
      sensory_bias: "Listens for paper and keys."
    },
    pressure_behavior_extended: {
      humiliated: "Retreats into exact wording.",
      offered_power: "Asks who benefits.",
      refused_power: "Documents the refusal."
    },
    agency_and_planning_extended: {
      fallback_style: "Keeps a second route.",
      planning_blind_spots: "Underestimates emotional loyalty."
    },
    sample_utterances: [
      {
        text: "That is not where the key belongs.",
        situation: "correcting a lie",
        speech_function: "refusal",
        pressure_tags: ["control"],
        copy_policy: "never_copy_verbatim"
      },
      {
        text: "You may inspect the index, not the drawer.",
        situation: "deflecting inspection",
        speech_function: "bargaining",
        pressure_tags: ["evasion"],
        copy_policy: "may_reuse_cadence_not_text"
      },
      {
        text: "Protocol exists for a reason.",
        situation: "holding a boundary",
        speech_function: "performance",
        pressure_tags: ["authority"],
        copy_policy: "canonical_phrase"
      },
      {
        text: "Fourth sample should not render.",
        situation: "overflow",
        speech_function: "other",
        pressure_tags: ["overflow"],
        copy_policy: "never_copy_verbatim"
      }
    ]
  };
}

function input(records: ValidationRecord[] = castRecords()): BuildValidationSnapshotInput {
  return {
    records,
    generationSession: {
      current_cast_voice_pressure: [
        {
          cast_member_id: activeCastId,
          current_voice_pressure: "Make every answer sound carefully bounded.",
          dialogue_pressure: "Use procedural deflection.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "Let silence sharpen suspicion.",
          current_must_preserve: ["precision"],
          current_must_avoid: ["rambling"]
        },
        {
          cast_member_id: presentCastId,
          current_voice_pressure: "Let any speech sound reluctant and brief.",
          dialogue_pressure: "Only answer if directly addressed.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "Prefer silence.",
          current_must_preserve: [],
          current_must_avoid: ["chatty exposition"]
        }
      ],
      cast_voice_overrides: [
        {
          cast_member_id: activeCastId,
          scope: "current_generation_only",
          reason: "She is hiding panic.",
          applies_to: ["dialogue", "silence"],
          override_text: "Even shorter than usual."
        },
        {
          cast_member_id: presentCastId,
          scope: "current_generation_only",
          reason: "Background line risk.",
          applies_to: ["dialogue"],
          override_text: "Keep him silent unless directly addressed."
        }
      ]
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

function castRecords(): ValidationRecord[] {
  return [
    {
      id: activeCastId,
      type: "CAST MEMBER",
      castBand: "active_onstage_cast_full",
      localFunction: "active_speaker",
      metadata: metadata(activeCastId, "Mara"),
      payload: castPayload()
    },
    {
      id: presentCastId,
      type: "CAST MEMBER",
      castBand: "present_minor_cast_compressed",
      metadata: metadata(presentCastId, "Jon"),
      payload: {
        ...castPayload(),
        identity: { one_line: "Jon is watching from the door." },
        voice_anchor: { core_voice: "Plainspoken and wary." }
      }
    },
    {
      id: offstageCastId,
      type: "CAST MEMBER",
      castBand: "offstage_relevant_cast",
      metadata: metadata(offstageCastId, "Guard"),
      payload: {
        ...castPayload(),
        identity: { one_line: "The guard may return soon." },
        voice_anchor: { core_voice: "Brusque and suspicious." }
      }
    }
  ];
}

function metadata(id: string, displayLabel: string): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "CAST MEMBER",
    displayLabel,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    archived: false
  };
}

function emptyInput(): BuildValidationSnapshotInput {
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

function currentStateWithOffstagePressure(): NonNullable<
  BuildValidationSnapshotInput["generationSession"]["current_authoritative_state"]
> {
  return {
    current_time: "Night.",
    current_location: "Archive.",
    onstage_entities: [],
    immediate_situation_summary: "The archive door is closed while pressure builds outside.",
    offstage_pressuring_entities: ["The guard is nearing the archive door."],
    positions: "No one else is onstage.",
    possessions: "None relevant.",
    visible_conditions: [],
    environmental_conditions: "Quiet hallway.",
    entity_statuses: "The guard is offstage.",
    line_of_sight_and_visibility: "The guard is not visible from inside.",
    routes_and_exits: ["archive door"],
    available_time: "A few seconds.",
    consent_or_force_conditions: "none",
    current_locks: ["The guard cannot be seen until the door opens."]
  };
}

function sectionBody(prompt: string, section: string): string {
  const pattern = new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`);
  return prompt.match(pattern)?.[1] ?? "";
}

describe("compiler cast-section resolvers", () => {
  it("renders every populated active/onstage dossier field without compression", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(input()));
    const dossier = sectionBody(prompt, "active_cast_full_dossiers");

    for (const expected of [
      "Mara is a precise archivist under pressure.",
      "Measured, clipped, and evasive.",
      "No generic trembling.",
      "Offers a technically true answer.",
      "Still shoulders, quick hands.",
      "Delay, redirect, document.",
      "Institutions taught her truth is expensive.",
      "Trust is transactional right now.",
      "Will lie to preserve evidence.",
      "Sleep deprived.",
      "Listens for paper and keys.",
      "Underestimates emotional loyalty."
    ]) {
      expect(dossier).toContain(expected);
    }
  });

  it("renders active dossiers in core-first order with samples last and capped at three", () => {
    const dossier = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "active_cast_full_dossiers");

    expect(dossier.indexOf("identity:")).toBeLessThan(dossier.indexOf("voice_anchor:"));
    expect(dossier.indexOf("voice_anchor:")).toBeLessThan(dossier.indexOf("voice_extended:"));
    expect(dossier.indexOf("voice_extended:")).toBeLessThan(dossier.indexOf("pressure_behavior_core:"));
    expect(dossier.indexOf("pressure_behavior_core:")).toBeLessThan(dossier.indexOf("body_presence_core:"));
    expect(dossier.indexOf("body_presence_core:")).toBeLessThan(dossier.indexOf("agency_core:"));
    expect(dossier.indexOf("sample_utterances:")).toBeGreaterThan(dossier.indexOf("planning_blind_spots"));
    expect(dossier).toContain("copy policy: may_reuse_cadence_not_text");
    expect(dossier).toContain("copy policy: canonical_phrase");
    expect(dossier).not.toContain("Fourth sample should not render.");
  });

  it("does not render record-reference ids in active cast dossiers", () => {
    const dossier = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "active_cast_full_dossiers");

    expect(dossier).not.toContain("entity_id:");
    expect(dossier).not.toContain(entityId);
    expect(dossier).not.toContain(activeCastId);
    expect(dossier).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/u);
    expect(dossier.trimStart()).toContain("identity:");
  });

  it("renders voice pins near the active working set without replacing the full dossier", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(input()));
    const activeWorkingSet = sectionBody(prompt, "active_working_set");
    const dossier = sectionBody(prompt, "active_cast_full_dossiers");

    expect(activeWorkingSet).toContain("Make every answer sound carefully bounded.");
    expect(activeWorkingSet).toContain("Current generation voice override");
    expect(dossier).toContain("Measured, clipped, and evasive.");
    expect(dossier).toContain("Current generation voice override");
  });

  it("scopes temporary overrides to the current render and mutates no source record", () => {
    const snapshot = buildValidationSnapshot(input());
    const before = JSON.stringify(snapshot.records);
    const { prompt } = compilePrompt(snapshot);

    expect(sectionBody(prompt, "active_cast_full_dossiers")).toContain("scope: current_generation_only");
    expect(JSON.stringify(snapshot.records)).toBe(before);
  });

  it("omits empty present-minor and gate-closed offstage compressed cast sections", () => {
    const prompt = compilePrompt(buildValidationSnapshot(emptyInput())).prompt;

    expect(prompt).not.toContain("<present_minor_cast>");
    expect(prompt).not.toContain("</present_minor_cast>");
    expect(prompt).not.toContain("<offstage_relevance>");
    expect(prompt).not.toContain("</offstage_relevance>");
  });

  it("renders populated present-minor and offstage compressed cast sections", () => {
    const populated = compilePrompt(buildValidationSnapshot(input())).prompt;

    expect(sectionBody(populated, "present_minor_cast")).toContain("Jon");
    expect(sectionBody(populated, "present_minor_cast")).toContain("current generation voice pressure");
    expect(sectionBody(populated, "present_minor_cast")).toContain("Let any speech sound reluctant and brief.");
    expect(sectionBody(populated, "present_minor_cast")).toContain("Only answer if directly addressed.");
    expect(sectionBody(populated, "present_minor_cast")).toContain("Keep him silent unless directly addressed.");
    const offstageRelevance = sectionBody(populated, "offstage_relevance");
    expect(offstageRelevance).toContain("The guard may return soon.");
    expect(offstageRelevance).not.toContain(EMPTY_STATE_CONSTANTS.offstage_relevance_notes);
  });

  it("omits present-minor current voice pressure from ideation prompts", () => {
    const populated = compilePrompt(buildValidationSnapshot(input()), { promptKind: "ideation" }).prompt;

    expect(sectionBody(populated, "present_minor_cast")).toContain("Jon");
    expect(sectionBody(populated, "present_minor_cast")).not.toContain("current generation voice pressure");
    expect(sectionBody(populated, "present_minor_cast")).not.toContain("Let any speech sound reluctant and brief.");
    expect(sectionBody(populated, "present_minor_cast")).toContain("Keep him silent unless directly addressed.");
  });

  it("renders the offstage relevance directive when interruption focus opens the gate with no offstage cast", () => {
    const prompt = compilePrompt(
      buildValidationSnapshot({
        ...emptyInput(),
        generationSession: {
          ...emptyInput().generationSession,
          generation_validation_focus: {
            validation_focus_tags: {
              generation_context: ["first_segment"],
              expected_local_modes: ["offstage_interruption_possible"],
              possible_durable_changes: []
            }
          }
        }
      })
    ).prompt;

    expect(prompt).toContain("<offstage_relevance>");
    expect(sectionBody(prompt, "offstage_relevance")).toContain(EMPTY_STATE_CONSTANTS.offstage_relevance_notes);
    expect(sectionBody(prompt, "offstage_relevance")).not.toContain(">None<");
  });

  it("renders the offstage relevance directive when offstage pressure opens the gate with no offstage cast", () => {
    const prompt = compilePrompt(
      buildValidationSnapshot({
        ...emptyInput(),
        generationSession: {
          ...emptyInput().generationSession,
          current_authoritative_state: currentStateWithOffstagePressure()
        }
      })
    ).prompt;

    const offstageRelevance = sectionBody(prompt, "offstage_relevance");
    expect(prompt).toContain("<offstage_relevance>");
    expect(offstageRelevance).toContain(EMPTY_STATE_CONSTANTS.offstage_relevance_notes);
    expect(offstageRelevance).not.toBe("None");
  });

  it("renders long cast labels fully in voice pins and once in compressed notes", () => {
    const records = castRecords().map((record) =>
      record.id === presentCastId
        ? {
            ...record,
            metadata: metadata(presentCastId, `${longCastOneLine.slice(0, 77)}...`),
            payload: {
              ...castPayload(),
              identity: { one_line: longCastOneLine },
              voice_anchor: { core_voice: "Plainspoken and wary." }
            }
          }
        : record.id === activeCastId
          ? {
              ...record,
              metadata: metadata(activeCastId, `${longCastOneLine.slice(0, 77)}...`),
              payload: {
                ...castPayload(),
                identity: { ...castPayload().identity, one_line: longCastOneLine }
              }
            }
          : record
    );
    const prompt = compilePrompt(buildValidationSnapshot(input(records))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");
    const presentMinor = sectionBody(prompt, "present_minor_cast");

    expect(activeWorkingSet).toContain(longCastOneLine);
    expect(activeWorkingSet).not.toContain(`${longCastOneLine.slice(0, 77)}...`);
    expect(presentMinor).toContain(longCastOneLine);
    expect(presentMinor).not.toContain(`${longCastOneLine.slice(0, 77)}...`);
    expect(presentMinor.match(new RegExp(escapeRegExp(longCastOneLine), "g"))).toHaveLength(1);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
