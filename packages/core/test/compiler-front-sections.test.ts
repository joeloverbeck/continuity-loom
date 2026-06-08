import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS,
  versionInfo,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { describe, expect, it } from "vitest";

const povId = "019b0298-5c00-7000-8000-000000000001";
const holderId = "019b0298-5c00-7000-8000-000000000002";
const factId = "019b0298-5c00-7000-8000-000000000003";
const secretId = "019b0298-5c00-7000-8000-000000000004";
const beliefId = "019b0298-5c00-7000-8000-000000000005";

function populatedInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: povId,
        type: "ENTITY",
        metadata: metadata(povId, "Jon Vale"),
        payload: {
          id: povId,
          display_name: "Jon Vale",
          status: "active",
          entity_kind: "person",
          canonical_summary: "Jon watches the archive door."
        }
      },
      {
        id: factId,
        type: "FACT",
        payload: {
          id: factId,
          status: "active",
          fact_kind: "hard_canon",
          statement: "The tower bell never rings after midnight.",
          known_by: [povId]
        }
      },
      {
        id: beliefId,
        type: "BELIEF",
        payload: {
          id: beliefId,
          status: "active",
          holder: povId,
          claim: "The locked door may be a trap.",
          belief_mode: "suspects"
        }
      },
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "hidden",
          secret_claim: "Mara stole the archive key.",
          holders: [holderId],
          non_holders_to_protect: [povId],
          audience_visibility: "explicit",
          pov_access: "can_suspect",
          allowed_surface_cues: ["Mara avoids the desk drawer."],
          forbidden_reveals: ["Do not state that Mara has the key."],
          reveal_permission: "clue_only",
          reveal_triggers: ["Only if Mara is directly searched."]
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [povId, factId, beliefId, secretId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "After midnight.",
        current_location: "North archive.",
        onstage_entities: [povId],
        immediate_situation_summary: "Mara is beside the desk while Jon waits at the archive door.",
        offstage_pressuring_entities: [holderId],
        positions: ["Mara is beside the desk.", "Jon is at the door."],
        possessions: "Jon carries the lantern.",
        visible_conditions: ["Mara's sleeve is ink-stained."],
        environmental_conditions: "Rain rattles the windows.",
        entity_statuses: "Both are awake and free to move.",
        line_of_sight_and_visibility: "Jon can see Mara but not inside the drawer.",
        routes_and_exits: ["North stair", "servant corridor"],
        available_time: "Enough time for one exchange.",
        consent_or_force_conditions: "none",
        current_locks: ["The bell cannot ring."]
      },
      immediate_handoff: {
        recent_causal_context: "Jon followed the wet footprints upstairs.",
        last_visible_moment: "Mara shut the drawer too quickly.",
        prior_accepted_prose_status_or_handoff_note: "No quoted prose; the prior segment ended at the desk.",
        begin_after: "Begin with Jon noticing Mara's hand."
      },
      manual_moment_directive: {
        must_render: ["Jon asks about the drawer."],
        may_render_if_naturally_caused: ["Mara deflects."],
        do_not_force: ["Do not reveal the key."]
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Suspense, threat, and deception.",
        tonal_handling: "Tense but restrained.",
        governing_policy_note: "Provider policy remains higher authority.",
        character_bias_handling: "Character judgments are not narrator fact."
      },
      storyContract: {
        title: "Rain Archive",
        premise: "An archivist hunts a stolen key during a storm.",
        genre_mode: "gothic mystery",
        tone: ["tense", "intimate"],
        continuity_philosophy: "continuity_first",
        setting_baseline: "A coastal archive tower.",
        content_intensity: "mature",
        explicitness: "non-graphic",
        language_register: "literary",
        prose_preferences: {
          psychic_distance: "close",
          dialogue_density: "balanced",
          interiority: "filtered",
          paragraphing: "mixed"
        }
      },
      proseMode: {
        pov_character: povId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: ["No scene headings."]
      }
    },
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
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

function sectionBody(prompt: string, section: string): string {
  const pattern = new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`);
  return prompt.match(pattern)?.[1] ?? "";
}

describe("compiler front-section resolvers", () => {
  it("renders populated content policy, story contract, prose mode, state, handoff, and directive fields", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));

    expect(sectionBody(prompt, "content_policy")).toContain("RATING: Mature");
    expect(sectionBody(prompt, "story_contract")).toContain("Title: Rain Archive");
    expect(sectionBody(prompt, "story_contract")).toContain("Tone: tense\nintimate");
    const proseMode = sectionBody(prompt, "prose_mode");
    expect(proseMode).toContain("POV: Jon Vale");
    expect(proseMode).not.toContain(povId);
    expect(sectionBody(prompt, "hard_canon")).toContain("- The tower bell never rings after midnight.");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("After midnight.");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("Mara is beside the desk.\nJon is at the door.");
    expect(sectionBody(prompt, "immediate_handoff")).toContain("Begin with Jon noticing Mara's hand.");
    expect(sectionBody(prompt, "manual_directive")).toContain("Jon asks about the drawer.");
  });

  it("renders exact empty-state constants when front-section sources are absent", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyInput()));

    expect(EMPTY_STATE_CONSTANTS.soft_unit_guidance).toBe(
      "Soft unit: No additional user narrowing; use the universal local stop rule above."
    );
    expect(sectionBody(prompt, "content_policy")).toContain(`RATING: ${EMPTY_STATE_CONSTANTS.rating_label}`);
    expect(sectionBody(prompt, "story_contract")).toContain(`Title: ${EMPTY_STATE_CONSTANTS.title}`);
    expect(sectionBody(prompt, "hard_canon")).toContain(EMPTY_STATE_CONSTANTS.hard_canon_bullets);
    expect(sectionBody(prompt, "current_authoritative_state")).toContain(EMPTY_STATE_CONSTANTS.current_time);
    expect(sectionBody(prompt, "immediate_handoff")).toContain(EMPTY_STATE_CONSTANTS.recent_causal_context);
    expect(sectionBody(prompt, "immediate_handoff")).toContain(
      EMPTY_STATE_CONSTANTS.prior_accepted_prose_status_or_handoff_note
    );
    expect(sectionBody(prompt, "immediate_handoff")).toContain(EMPTY_STATE_CONSTANTS.begin_after);
    expect(sectionBody(prompt, "stop_rule")).toContain(EMPTY_STATE_CONSTANTS.soft_unit_guidance);
    expect(sectionBody(prompt, "secrets_and_reveal_constraints")).toContain(
      EMPTY_STATE_CONSTANTS.writer_visible_hidden_truths
    );
  });

  it("records the deliberate compiler and contract version bump", () => {
    expect(versionInfo.compiler.version).toBe("1.2.0");
    expect(versionInfo.contract.version).toBe("1.2.0");
  });

  it("renders literal POV modes without record lookup", () => {
    for (const literal of ["omniscient", "variable"] as const) {
      const input = populatedInput();
      input.storyConfig.proseMode!.pov_character = literal;

      const { prompt } = compilePrompt(buildValidationSnapshot(input));

      expect(sectionBody(prompt, "prose_mode")).toContain(`POV: ${literal}`);
    }
  });

  it("falls back to the raw POV id when the referenced record is not selected", () => {
    const input = populatedInput();
    input.records = input.records.filter((record) => record.id !== povId);
    input.generationSession.active_working_set!.selected_records =
      input.generationSession.active_working_set!.selected_records.filter((recordId) => recordId !== povId);

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(sectionBody(prompt, "prose_mode")).toContain(`POV: ${povId}`);
  });

  it("keeps writer-visible secrets out of POV knowledge while preserving protection lanes", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));
    const povSection = sectionBody(prompt, "pov_knowledge_constraints");
    const secretSection = sectionBody(prompt, "secrets_and_reveal_constraints");
    const audienceSection = sectionBody(prompt, "audience_knowledge");

    expect(secretSection).toContain("Mara stole the archive key.");
    expect(secretSection).toContain(holderId);
    expect(secretSection).toContain(povId);
    expect(povSection).not.toContain("POV knows:\n- Mara stole the archive key.");
    expect(povSection).toContain("POV does not know:\n- Mara stole the archive key.");
    expect(audienceSection).toContain("Audience already knows:\n- Mara stole the archive key.");
  });

  it("renders affirmative no-forbidden-reveals secrets without using the empty state", () => {
    const input = populatedInput();
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              id: secretId,
              status: "hidden",
              secret_claim: "Mara stole the archive key.",
              holders: [holderId],
              non_holders_to_protect: [povId],
              audience_visibility: "explicit",
              pov_access: "can_suspect",
              allowed_surface_cues: ["Mara avoids the desk drawer."],
              forbidden_reveals: "none",
              reveal_permission: "clue_only",
              reveal_triggers: ["Only if Mara is directly searched."]
            }
          }
        : record
    );

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const secretSection = sectionBody(prompt, "secrets_and_reveal_constraints");

    expect(secretSection).toContain("- No reveals are forbidden beyond the stated reveal permission.");
    expect(secretSection).not.toContain(`Forbidden reveals:\n${EMPTY_STATE_CONSTANTS.forbidden_reveals}`);
  });

  it("still renders populated forbidden reveals as a list", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));

    expect(sectionBody(prompt, "secrets_and_reveal_constraints")).toContain(
      "- Do not state that Mara has the key."
    );
  });

  it("renders only the user-authored handoff note or the no-accepted-prose constant", () => {
    const populated = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const empty = compilePrompt(buildValidationSnapshot(emptyInput())).prompt;

    expect(sectionBody(populated, "immediate_handoff")).toContain(
      "No quoted prose; the prior segment ended at the desk."
    );
    expect(sectionBody(empty, "immediate_handoff")).toContain(
      EMPTY_STATE_CONSTANTS.prior_accepted_prose_status_or_handoff_note
    );
  });

  it("renders deterministic front-section output for identical snapshots", () => {
    const snapshot = buildValidationSnapshot(populatedInput());
    const first = compilePrompt(snapshot);
    const second = compilePrompt(snapshot);

    expect(second.prompt).toBe(first.prompt);
    expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint);
  });
});

function metadata(id: string, displayLabel: string) {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    archived: false
  };
}
