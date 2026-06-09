import {
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  SECTION_ORDER,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function goldenInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: "019b0298-5c00-7000-8000-000000000501",
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        metadata: metadata("019b0298-5c00-7000-8000-000000000501", "Mara"),
        payload: {
          entity_id: "019b0298-5c00-7000-8000-000000000502",
          identity: { one_line: "Mara guards the archive.", public_face: "calm", private_pressure: "afraid" },
          voice_anchor: {
            core_voice: "Precise and guarded.",
            rhythm_and_syntax: "Short, exact sentences.",
            register_and_diction: "formal",
            vocabulary_and_metaphor_pools: "paper, locks",
            profanity_and_intensity: "rare",
            taboo_and_avoidance_patterns: "avoids confession",
            dialogue_tactics_and_speech_functions: "deflects",
            address_terms_and_naming: "titles",
            silence_interruption_and_turntaking: "waits",
            under_pressure_voice: "colder",
            suppression_or_evasion_rule: "redirect",
            must_preserve: ["precision"],
            must_avoid: ["generic panic"],
            anti_repetition_warnings: []
          },
          pressure_behavior_core: { cornered: "answers narrowly", tempted_or_offered_power: "counts cost", protecting_attachment: "moves first" },
          body_presence_core: { physicality: "still", habitual_gestures_or_presence: "smooths paper", social_presentation: "quiet authority" },
          agency_core: { default_strategy: "delay", risk_style: "procedural" },
          sample_utterances: [
            { text: "Look at the index.", situation: "deflection", speech_function: "evasion", pressure_tags: ["control"], copy_policy: "never_copy_verbatim" }
          ]
        }
      },
      {
        id: "019b0298-5c00-7000-8000-000000000503",
        type: "FACT",
        metadata: metadata("019b0298-5c00-7000-8000-000000000503", "Canon"),
        payload: { fact_kind: "hard_canon", statement: "The archive key is unique.", known_by: "public" }
      },
      {
        id: "019b0298-5c00-7000-8000-000000000504",
        type: "PLAN",
        metadata: metadata("019b0298-5c00-7000-8000-000000000504", "Plan"),
        payload: { plan_status: "active", objective: "Leave with the ledger.", current_step: "reach the stair", visibility_to_pov: "visible" }
      },
      {
        id: "019b0298-5c00-7000-8000-000000000505",
        type: "LOCATION",
        metadata: metadata("019b0298-5c00-7000-8000-000000000505", "Archive"),
        payload: { status: "active", label: "Archive", description: "Tall shelves.", layout_relevant_now: "one narrow aisle", visibility_and_sound: "echoing" }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [
          "019b0298-5c00-7000-8000-000000000501",
          "019b0298-5c00-7000-8000-000000000503",
          "019b0298-5c00-7000-8000-000000000504",
          "019b0298-5c00-7000-8000-000000000505"
        ],
        active_onstage_cast_full: [{ cast_member_id: "019b0298-5c00-7000-8000-000000000501", local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: "019b0298-5c00-7000-8000-000000000501"
      },
      current_authoritative_state: {
        current_time: "Dawn.",
        current_location: "Archive.",
        onstage_entities: ["019b0298-5c00-7000-8000-000000000501"],
        immediate_situation_summary: "Mara is alone in the archive with the ledger exposed on the desk.",
        offstage_pressuring_entities: [],
        positions: "Mara stands in the aisle.",
        possessions: "The ledger is on the desk.",
        visible_conditions: [],
        environmental_conditions: "Rain outside.",
        entity_statuses: "Mara is awake and mobile.",
        line_of_sight_and_visibility: "The aisle is visible.",
        routes_and_exits: ["stair"],
        available_time: "One exchange.",
        consent_or_force_conditions: "none",
        current_locks: ["The archive key cannot duplicate itself."]
      },
      immediate_handoff: {
        recent_causal_context: "The guard left.",
        last_visible_moment: "Mara reached for the ledger.",
        prior_accepted_prose_status_or_handoff_note: "none",
        begin_after: "Begin with the ledger on the desk."
      },
      manual_moment_directive: { must_render: ["Mara refuses to hand it over."], may_render_if_naturally_caused: [], do_not_force: [] },
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "suspense",
        tonal_handling: "restrained",
        governing_policy_note: "policy first",
        character_bias_handling: "character claims are not fact"
      },
      storyContract: {
        title: "Golden Archive",
        premise: "An archivist protects a ledger.",
        genre_mode: "mystery",
        tone: "tense",
        continuity_philosophy: "continuity_first",
        setting_baseline: "archive tower",
        content_intensity: "mature",
        explicitness: "non-graphic",
        language_register: "literary",
        prose_preferences: { psychic_distance: "close", dialogue_density: "balanced", interiority: "filtered", paragraphing: "mixed" }
      },
      proseMode: {
        pov_character: "019b0298-5c00-7000-8000-000000000501",
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: { template: "1.0.0", compiler: "1.2.0", contract: "1.2.0" }
  };
}

function metadata(id: string, displayLabel: string) {
  return { id, type: "test", displayLabel, createdAt: "2026-06-05T00:00:00.000Z", updatedAt: "2026-06-05T00:00:00.000Z", archived: false };
}

function promptSectionOrder(prompt: string): string[] {
  return Array.from(prompt.matchAll(/^<([a-z_]+)(?:\s[^>]*)?>$/gm), (match) => match[1] ?? "");
}

describe("compiler golden prompt", () => {
  it("matches the frozen demo first-segment prompt baseline byte-for-byte", () => {
    const snapshot = buildValidationSnapshot({
      records: demoRecords,
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "1.0.0", compiler: "1.2.0", contract: "1.2.0" }
    });
    const result = compilePrompt(snapshot);
    const frozenGolden = readFileSync(new URL("./golden-first-segment.prompt.txt", import.meta.url), "utf8");

    // Re-baseline this fixture only with a deliberate template/compiler/contract version change.
    expect(result.prompt).toBe(frozenGolden);
  });

  it("renders a full prompt deterministically with all sections and stable metadata", () => {
    const snapshot = buildValidationSnapshot(goldenInput());
    const first = compilePrompt(snapshot);
    const second = compilePrompt(snapshot);
    const expectedRenderedOrder = SECTION_ORDER.filter(
      (section) => section !== "present_minor_cast" && section !== "offstage_relevance"
    );

    expect(promptSectionOrder(first.prompt)).toEqual(expectedRenderedOrder);
    expect(second.prompt).toBe(first.prompt);
    expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint);
    expect(first.prompt).toContain("Golden Archive");
    expect(first.prompt).toContain("Mara guards the archive.");
    expect(first.prompt).toContain("POV: Mara");
    expect(first.prompt).toContain("The archive key is unique.");
    expect(first.prompt).toContain("The archive key cannot duplicate itself.");
    expect(first.metadata.versions).toEqual({ template: "1.0.0", compiler: "1.2.0", contract: "1.2.0" });
  });

  it("omits the hard-canon section without leaving an extra blank line when no hard canon is selected", () => {
    const input = goldenInput();
    input.records = input.records.filter((record) => record.type !== "FACT");
    input.generationSession.active_working_set!.selected_records =
      input.generationSession.active_working_set!.selected_records.filter(
        (recordId) => recordId !== "019b0298-5c00-7000-8000-000000000503"
      );

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(prompt).not.toContain("<hard_canon>");
    expect(prompt).not.toContain("None selected for this generation");
    expect(prompt).toContain("</prose_mode>\n\n<current_authoritative_state>");
    expect(prompt).not.toContain("</prose_mode>\n\n\n<current_authoritative_state>");
  });
});
