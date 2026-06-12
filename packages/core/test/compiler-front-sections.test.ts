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
const danglingHolderId = "019b0298-5c00-7000-8000-000000000006";
const locationId = "019b0298-5c00-7000-8000-000000000007";
const entityStatusId = "019b0298-5c00-7000-8000-000000000008";
const danglingLocationId = "019b0298-5c00-7000-8000-000000000009";
const danglingStatusId = "019b0298-5c00-7000-8000-000000000010";

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
        id: holderId,
        type: "ENTITY",
        metadata: metadata(holderId, "Mara Lorne"),
        payload: {
          id: holderId,
          display_name: "Mara Lorne",
          status: "active",
          entity_kind: "person",
          canonical_summary: "Mara keeps secrets behind procedural calm."
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
          secret_kind: "other",
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
        selected_records: [povId, holderId, factId, beliefId, secretId],
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

function sectionLines(prompt: string, section: string): string[] {
  return sectionBody(prompt, section).split("\n").filter((line) => line.trim().length > 0);
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

  it("resolves current-state onstage and offstage entity ids to display labels", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));
    const currentState = sectionBody(prompt, "current_authoritative_state");

    expect(currentState).toContain("Onstage entities: Jon Vale");
    expect(currentState).toContain("Offstage but pressuring entities: Mara Lorne");
    expect(currentState).not.toContain(`Onstage entities: ${povId}`);
    expect(currentState).not.toContain(`Offstage but pressuring entities: ${holderId}`);
  });

  it("renders multiple current-state entity references as comma-joined single lines", () => {
    const input = populatedInput();
    input.generationSession.current_authoritative_state!.onstage_entities = [povId, holderId];
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [holderId, povId];

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(sectionLines(prompt, "current_authoritative_state")).toContain("Onstage entities: Jon Vale, Mara Lorne");
    expect(sectionLines(prompt, "current_authoritative_state")).toContain(
      "Offstage but pressuring entities: Mara Lorne, Jon Vale"
    );
    expect(sectionBody(prompt, "current_authoritative_state")).not.toContain("Onstage entities: Jon Vale\nMara Lorne");
    expect(sectionBody(prompt, "current_authoritative_state")).not.toContain(
      "Offstage but pressuring entities: Mara Lorne\nJon Vale"
    );
  });

  it("falls back to a raw current-state entity id when no matching record is selected", () => {
    const input = populatedInput();
    input.generationSession.current_authoritative_state!.onstage_entities = [danglingHolderId];

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(sectionBody(prompt, "current_authoritative_state")).toContain(`Onstage entities: ${danglingHolderId}`);
  });

  it("resolves current-state location ids to display labels while preserving prose and dangling values", () => {
    const input = populatedInput();
    input.records = [
      ...input.records,
      {
        id: locationId,
        type: "LOCATION",
        metadata: metadata(locationId, "Vale bakery cellar"),
        payload: {
          id: locationId,
          status: "active",
          label: "Vale bakery cellar",
          description: "A whitewashed cellar below the bakery."
        }
      }
    ];
    input.generationSession.active_working_set!.selected_records = [
      ...input.generationSession.active_working_set!.selected_records,
      locationId
    ];
    input.generationSession.current_authoritative_state!.current_location = locationId;

    const selectedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;
    const selectedState = sectionBody(selectedPrompt, "current_authoritative_state");
    expect(selectedState).toContain("Location: Vale bakery cellar");
    expect(selectedState).not.toContain(`Location: ${locationId}`);

    input.generationSession.current_authoritative_state!.current_location = "the mill loft at dusk";
    const proseState = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "current_authoritative_state");
    expect(proseState).toContain("Location: the mill loft at dusk");

    input.generationSession.current_authoritative_state!.current_location = danglingLocationId;
    const danglingState = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "current_authoritative_state");
    expect(danglingState).toContain(`Location: ${danglingLocationId}`);
  });

  it("resolves current-state entity status arrays to display labels while preserving prose and dangling values", () => {
    const input = populatedInput();
    input.records = [
      ...input.records,
      {
        id: entityStatusId,
        type: "ENTITY STATUS",
        metadata: metadata(entityStatusId, "Mara is guarding the stair"),
        payload: {
          id: entityStatusId,
          entity_id: holderId,
          life: "alive",
          agency: "free",
          current_activity: "Mara is guarding the stair"
        }
      }
    ];
    input.generationSession.active_working_set!.selected_records = [
      ...input.generationSession.active_working_set!.selected_records,
      entityStatusId
    ];
    input.generationSession.current_authoritative_state!.entity_statuses = [entityStatusId];

    const selectedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;
    const selectedState = sectionBody(selectedPrompt, "current_authoritative_state");
    expect(selectedState).toContain("Current agency/status: Mara is guarding the stair");
    expect(selectedState).not.toContain(`Current agency/status: ${entityStatusId}`);

    input.generationSession.current_authoritative_state!.entity_statuses = "Both are awake and free to move.";
    const proseState = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "current_authoritative_state");
    expect(proseState).toContain("Current agency/status: Both are awake and free to move.");

    input.generationSession.current_authoritative_state!.entity_statuses = [danglingStatusId];
    const danglingState = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "current_authoritative_state");
    expect(danglingState).toContain(`Current agency/status: ${danglingStatusId}`);
  });

  it("always renders the four required current-state lines and omits empty optional lines", () => {
    const input = populatedInput();
    input.generationSession.current_authoritative_state = {
      current_time: "After midnight.",
      current_location: "North archive.",
      onstage_entities: [povId],
      immediate_situation_summary: "Jon waits at the archive door.",
      offstage_pressuring_entities: [],
      positions: [],
      possessions: [],
      visible_conditions: [],
      environmental_conditions: "",
      entity_statuses: [],
      line_of_sight_and_visibility: "",
      routes_and_exits: [],
      available_time: "",
      consent_or_force_conditions: "none",
      current_locks: []
    };

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const currentState = sectionBody(prompt, "current_authoritative_state");

    expect(sectionLines(prompt, "current_authoritative_state")).toEqual([
      "Time: After midnight.",
      "Location: North archive.",
      "Onstage entities: Jon Vale",
      "Immediate situation: Jon waits at the archive door."
    ]);
    expect(currentState).not.toContain("None currently specified");
    expect(currentState).not.toContain("Offstage but pressuring entities:");
    expect(currentState).not.toContain("Routes and exits:");
  });

  it("renders optional current-state lines only while their values are populated", () => {
    const input = populatedInput();
    input.generationSession.current_authoritative_state!.routes_and_exits = ["North stair"];

    const populatedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;
    expect(sectionBody(populatedPrompt, "current_authoritative_state")).toContain("Routes and exits: North stair");

    input.generationSession.current_authoritative_state!.routes_and_exits = [];
    const clearedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;

    expect(sectionBody(clearedPrompt, "current_authoritative_state")).not.toContain("Routes and exits:");
  });

  it("omits default none consent or force conditions", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));

    expect(sectionBody(prompt, "current_authoritative_state")).not.toContain("Consent or force conditions:");
  });

  it("renders exact empty-state constants when front-section sources are absent", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyInput()));
    const povSection = sectionBody(prompt, "pov_knowledge_constraints");
    const secretsSection = sectionBody(prompt, "secrets_and_reveal_constraints");

    expect(EMPTY_STATE_CONSTANTS.soft_unit_guidance).toBe(
      "No additional user narrowing; use the universal local stop rule above."
    );
    expect(sectionBody(prompt, "content_policy")).toContain(`RATING: ${EMPTY_STATE_CONSTANTS.rating_label}`);
    expect(sectionBody(prompt, "story_contract")).toContain(`Title: ${EMPTY_STATE_CONSTANTS.title}`);
    expect(prompt).not.toContain("<hard_canon>");
    expect(prompt).not.toContain(EMPTY_STATE_CONSTANTS.hard_canon_bullets);
    expect(sectionBody(prompt, "current_authoritative_state")).toContain(EMPTY_STATE_CONSTANTS.current_time);
    expect(sectionBody(prompt, "immediate_handoff")).toContain(EMPTY_STATE_CONSTANTS.recent_causal_context);
    expect(sectionBody(prompt, "immediate_handoff")).toContain(
      EMPTY_STATE_CONSTANTS.prior_accepted_prose_status_or_handoff_note
    );
    expect(sectionBody(prompt, "immediate_handoff")).not.toContain(EMPTY_STATE_CONSTANTS.begin_after);
    expect(sectionBody(prompt, "manual_directive")).toContain(EMPTY_STATE_CONSTANTS.manual_must_render);
    expect(sectionBody(prompt, "stop_rule")).not.toContain("Soft unit:");
    expect(sectionBody(prompt, "stop_rule")).not.toContain("Additional user stop guidance");
    expect(prompt).toContain("<secrets_and_reveal_constraints>");
    expect(secretsSection).not.toContain("Writer-visible hidden truths:");
    expect(secretsSection).not.toContain("Secret holders:");
    expect(secretsSection).not.toContain("Characters who must not know yet:");
    expect(secretsSection).not.toContain("Allowed clues and surface cues now:");
    expect(secretsSection).not.toContain("Forbidden reveals now:");
    expect(secretsSection).not.toContain("Reveal permission:");
    expect(secretsSection).not.toContain("None specified");
    expect(secretsSection).not.toContain(EMPTY_STATE_CONSTANTS.writer_visible_hidden_truths);
    expect(secretsSection).toContain("A secret may be revealed only if its reveal permission allows reveal");
    expect(prompt).toContain("<pov_knowledge_constraints>");
    expect(povSection).toContain("Prompt-label rule:");
    expect(povSection).toContain("Non-POV interiority rule:");
    expect(povSection).not.toContain("POV knows:");
    expect(povSection).not.toContain("POV believes, suspects, or misreads:");
    expect(povSection).not.toContain("POV does not know:");
    expect(povSection).not.toContain("POV cannot perceive right now:");
    expect(povSection).not.toContain(EMPTY_STATE_CONSTANTS.pov_knows);
  });

  it("renders supplied soft-unit guidance once and omits it when blank", () => {
    const withGuidance = compilePrompt(
      buildValidationSnapshot({
        ...populatedInput(),
        generationSession: {
          ...populatedInput().generationSession,
          stop_guidance: {
            soft_unit_guidance: "Stop after she refuses."
          }
        }
      })
    ).prompt;
    const blank = compilePrompt(
      buildValidationSnapshot({
        ...populatedInput(),
        generationSession: {
          ...populatedInput().generationSession,
          stop_guidance: {
            soft_unit_guidance: ""
          }
        }
      })
    ).prompt;

    expect(sectionBody(withGuidance, "stop_rule").match(/Soft unit:/g)).toHaveLength(1);
    expect(sectionBody(withGuidance, "stop_rule")).toContain("Soft unit: Stop after she refuses.");
    expect(sectionBody(blank, "stop_rule")).not.toContain("Soft unit:");
    expect(sectionBody(blank, "stop_rule")).toContain("Stop as soon as one of these occurs:");
  });

  it("records the deliberate compiler and contract version bump", () => {
    expect(versionInfo.templates.version).toBe("1.1.0");
    expect(versionInfo.compiler.version).toBe("1.3.0");
    expect(versionInfo.contract.version).toBe("1.4.0");
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

    expect(secretSection).toContain("[other] Mara stole the archive key.");
    expect(secretSection).toContain("Secret holders:\n- Mara Lorne");
    expect(secretSection).toContain("Characters who must not know yet:\n- Jon Vale");
    expect(secretSection).not.toContain(holderId);
    expect(secretSection).not.toContain(povId);
    expect(povSection).not.toContain("POV knows:\n- Mara stole the archive key.");
    expect(povSection).toContain("POV does not know:\n- Mara stole the archive key.");
    expect(audienceSection).toContain("Audience already knows:\n- Mara stole the archive key.");
  });

  it("does not reuse line-of-sight state as POV cannot-perceive text", () => {
    const input = populatedInput();
    input.records = input.records.filter((record) => record.id === povId || record.id === factId);
    input.generationSession.active_working_set!.selected_records = [povId, factId];
    input.generationSession.current_authoritative_state!.line_of_sight_and_visibility =
      "Jon can see Mara but not inside the drawer.";

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(sectionBody(prompt, "current_authoritative_state")).toContain(
      "Line of sight / visibility: Jon can see Mara but not inside the drawer."
    );
    expect(sectionBody(prompt, "pov_knowledge_constraints")).not.toContain("POV cannot perceive right now:");
    expect(sectionBody(prompt, "pov_knowledge_constraints")).not.toContain(
      "Jon can see Mara but not inside the drawer."
    );
  });

  it("renders authored POV cannot-perceive text independently of line-of-sight state", () => {
    const input = populatedInput();
    input.generationSession.current_authoritative_state!.line_of_sight_and_visibility =
      "Jon can see Mara but not inside the drawer.";
    input.generationSession.current_authoritative_state!.pov_cannot_perceive_now =
      "Jon cannot hear the messenger behind the archive door.";

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const povSection = sectionBody(prompt, "pov_knowledge_constraints");

    expect(sectionBody(prompt, "current_authoritative_state")).toContain(
      "Line of sight / visibility: Jon can see Mara but not inside the drawer."
    );
    expect(povSection).toContain(
      "POV cannot perceive right now:\nJon cannot hear the messenger behind the archive door."
    );
    expect(povSection).not.toContain("Jon can see Mara but not inside the drawer.");
  });

  it("renders populated POV knowledge lines while omitting empty sibling lines", () => {
    const input = populatedInput();
    input.records = input.records.filter((record) => record.id === povId || record.id === factId);
    input.generationSession.active_working_set!.selected_records = [povId, factId];
    input.generationSession.current_authoritative_state!.line_of_sight_and_visibility = "";

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const povSection = sectionBody(prompt, "pov_knowledge_constraints");

    expect(povSection).toContain("POV knows:\n- The tower bell never rings after midnight.");
    expect(povSection).not.toContain("POV believes, suspects, or misreads:");
    expect(povSection).not.toContain("POV does not know:");
    expect(povSection).not.toContain("POV cannot perceive right now:");
    expect(povSection).not.toContain("None specified");
    expect(povSection).toContain("Prompt-label rule:");
    expect(povSection).toContain("Non-POV interiority rule:");
  });

  it("renders ambiguous audience perception without placing the secret in existing audience lanes", () => {
    const input = populatedInput();
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              ...(record.payload as Record<string, unknown>),
              status: "partially_revealed",
              audience_visibility: "ambiguous"
            }
          }
        : record
    );

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const audienceSection = sectionBody(prompt, "audience_knowledge");

    expect(audienceSection).toContain(
      "Audience may be inferring (ambiguous - not established reader knowledge):\n- Mara stole the archive key."
    );
    expect(audienceSection).toContain(
      "Treat these as unresolved: shape suspense and surface cues, but do not write as if the audience has confirmed them."
    );
    expect(audienceSection).not.toContain("Audience already knows:\n- Mara stole the archive key.");
    expect(audienceSection).not.toContain("Audience does not know:\n- Mara stole the archive key.");
    expect(audienceSection).not.toContain("Dramatic irony allowed now:\n- Mara stole the archive key.");
  });

  it("omits the ambiguous audience perception block when no active ambiguous secret exists", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));
    const audienceSection = sectionBody(prompt, "audience_knowledge");

    expect(audienceSection).not.toContain("Audience may be inferring");
    expect(audienceSection).not.toContain("Treat these as unresolved:");
    expect(audienceSection).toContain(
      [
        "Audience already knows:",
        "- Mara stole the archive key.",
        "",
        "Audience does not know:",
        "None specified",
        "",
        "Dramatic irony allowed now:",
        "- Mara stole the archive key.",
        "",
        "If the audience knows something the POV does not, you may let that truth shape surface cues and tension. Do not grant the POV forbidden knowledge."
      ].join("\n")
    );
  });

  it("falls back to a raw secret holder id when no matching record is selected", () => {
    const input = populatedInput();
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              ...(record.payload as Record<string, unknown>),
              holders: [danglingHolderId]
            }
          }
        : record
    );

    const { prompt } = compilePrompt(buildValidationSnapshot(input));

    expect(sectionBody(prompt, "secrets_and_reveal_constraints")).toContain(
      `Secret holders:\n- ${danglingHolderId}`
    );
  });

  it("renders protected non-holder sentinel values as deterministic phrases", () => {
    for (const [sentinel, phrase] of [
      ["all_except_holders", "Everyone except the secret holders"],
      ["none", "No protected non-holders"]
    ] as const) {
      const input = populatedInput();
      input.records = input.records.map((record) =>
        record.id === secretId
          ? {
              ...record,
              payload: {
                ...(record.payload as Record<string, unknown>),
                non_holders_to_protect: sentinel
              }
            }
          : record
      );

      const { prompt } = compilePrompt(buildValidationSnapshot(input));

      expect(sectionBody(prompt, "secrets_and_reveal_constraints")).toContain(
        `Characters who must not know yet:\n- ${phrase}`
      );
      expect(sectionBody(prompt, "secrets_and_reveal_constraints")).not.toContain(`- ${sentinel}`);
    }
  });

  it("renders available clue carrier text alongside authored surface cues without discovered-by ids", () => {
    const input = populatedInput();
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              ...(record.payload as Record<string, unknown>),
              clue_carriers: [
                {
                  clue_text: "A clean scrape marks the drawer edge.",
                  clue_strength: "suggestive",
                  discovered_by: povId,
                  audience_visible: "visible",
                  status: "available"
                },
                {
                  clue_text: "A broken lock hidden under the papers.",
                  clue_strength: "confirming",
                  discovered_by: holderId,
                  audience_visible: "hidden",
                  status: "suppressed"
                }
              ]
            }
          }
        : record
    );

    const secretSection = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "secrets_and_reveal_constraints");

    expect(secretSection).toContain("Allowed clues and surface cues now:\n- Mara avoids the desk drawer., A clean scrape marks the drawer edge.");
    expect(secretSection).not.toContain("A broken lock hidden under the papers.");
    expect(secretSection).not.toContain(`discovered_by`);
    expect(secretSection).not.toContain(povId);
    expect(secretSection).not.toContain(holderId);
  });

  it("omits the clue value-line when no surface cues or available carriers exist", () => {
    const input = populatedInput();
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              ...(record.payload as Record<string, unknown>),
              allowed_surface_cues: [],
              clue_carriers: [
                {
                  clue_text: "A broken lock hidden under the papers.",
                  clue_strength: "confirming",
                  discovered_by: holderId,
                  audience_visible: "hidden",
                  status: "suppressed"
                }
              ]
            }
          }
        : record
    );

    const secretSection = sectionBody(compilePrompt(buildValidationSnapshot(input)).prompt, "secrets_and_reveal_constraints");

    expect(secretSection).not.toContain("Allowed clues and surface cues now:");
    expect(secretSection).not.toContain(EMPTY_STATE_CONSTANTS.allowed_clues_and_surface_cues);
    expect(secretSection).toContain("Writer-visible hidden truths:");
    expect(secretSection).toContain("A secret may be revealed only if its reveal permission allows reveal");
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
              secret_kind: "other",
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

    expect(secretSection).toContain("Forbidden reveals now:");
    expect(secretSection).toContain("- No reveals are forbidden beyond the stated reveal permission.");
    expect(secretSection).not.toContain(`Forbidden reveals now:\n${EMPTY_STATE_CONSTANTS.forbidden_reveals}`);
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

  it("omits empty optional handoff and directive blocks while keeping load-bearing defaults", () => {
    const input = populatedInput();
    input.generationSession.immediate_handoff = {
      recent_causal_context: "",
      last_visible_moment: "",
      prior_accepted_prose_status_or_handoff_note: "none",
      begin_after: ""
    };
    input.generationSession.manual_moment_directive = {
      must_render: [],
      may_render_if_naturally_caused: [],
      do_not_force: []
    };

    const { prompt } = compilePrompt(buildValidationSnapshot(input));
    const handoff = sectionBody(prompt, "immediate_handoff");
    const directive = sectionBody(prompt, "manual_directive");

    expect(handoff).toContain(`Recent causal context (writer-visible; not automatically POV knowledge):\n${EMPTY_STATE_CONSTANTS.recent_causal_context}`);
    expect(handoff).toContain(
      `Prior accepted prose status / user-authored continuity handoff:\n${EMPTY_STATE_CONSTANTS.prior_accepted_prose_status_or_handoff_note}`
    );
    expect(handoff).toContain(
      "Do not include or quote accepted prose. Do not infer canon from archived prose. Use this handoff only as user-authored continuity context."
    );
    expect(handoff).not.toContain("Last visible moment:");
    expect(handoff).not.toContain("Begin prose exactly after this point:");
    expect(directive).toContain(`Must render:\n${EMPTY_STATE_CONSTANTS.manual_must_render}`);
    expect(directive).not.toContain("May render if naturally caused:");
    expect(directive).not.toContain("Do not force:");
    expect(prompt).toContain('<manual_directive priority="high">');
  });

  it("renders optional handoff and directive blocks only while their values are populated", () => {
    const input = populatedInput();
    input.generationSession.immediate_handoff!.last_visible_moment = "Mara's hand vanished into her sleeve.";
    input.generationSession.immediate_handoff!.begin_after = "";
    input.generationSession.manual_moment_directive!.may_render_if_naturally_caused = ["Mara changes the subject."];
    input.generationSession.manual_moment_directive!.do_not_force = [];

    const populatedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;

    expect(sectionBody(populatedPrompt, "immediate_handoff")).toContain(
      "Last visible moment:\nMara's hand vanished into her sleeve."
    );
    expect(sectionBody(populatedPrompt, "immediate_handoff")).not.toContain(
      "Begin prose exactly after this point:"
    );
    expect(sectionBody(populatedPrompt, "manual_directive")).toContain(
      "May render if naturally caused:\nMara changes the subject."
    );
    expect(sectionBody(populatedPrompt, "manual_directive")).not.toContain("Do not force:");

    input.generationSession.immediate_handoff!.last_visible_moment = "";
    input.generationSession.manual_moment_directive!.may_render_if_naturally_caused = [];
    const clearedPrompt = compilePrompt(buildValidationSnapshot(input)).prompt;

    expect(sectionBody(clearedPrompt, "immediate_handoff")).not.toContain("Last visible moment:");
    expect(sectionBody(clearedPrompt, "manual_directive")).not.toContain("May render if naturally caused:");
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
