import {
  CAST_POSSIBILITIES_OUTPUT_CONTRACT,
  CAST_POSSIBILITIES_SOURCE_PROFILE,
  buildValidationSnapshot,
  castPossibilitiesVersionInfo,
  compileCastPossibilitiesPrompt,
  parseCastPossibilitiesOutput,
  renderActiveDossier,
  renderActiveDossierBody,
  renderActiveVoicePressurePin,
  type CastPossibilitiesCard,
  type ValidationRecord
} from "../src/index.js";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

const povCastId = "019c0000-0000-7000-8000-000000000001";
const povEntityId = "019c0000-0000-7000-8000-000000000002";
const firstCastId = "019c0000-0000-7000-8000-000000000003";
const firstEntityId = "019c0000-0000-7000-8000-000000000004";
const secondCastId = "019c0000-0000-7000-8000-000000000005";
const secondEntityId = "019c0000-0000-7000-8000-000000000006";
const factId = "019c0000-0000-7000-8000-000000000007";

describe("Cast Possibilities core contract", () => {
  it("compiles every eligible non-POV active/full character in working-set order from the saved moment", () => {
    const snapshot = fixtureSnapshot();
    const compiled = compileCastPossibilitiesPrompt(snapshot, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    expect(CAST_POSSIBILITIES_SOURCE_PROFILE).toBe("cast-possibilities");
    expect(CAST_POSSIBILITIES_OUTPUT_CONTRACT).toBe("cast_possibilities.v1");
    expect(castPossibilitiesVersionInfo).toEqual({
      template: "1.0.0",
      compiler: "1.0.1",
      contract: "1.0.0"
    });
    expect(compiled.disclosure.eligibleCharacters.map((character) => character.castMemberId)).toEqual([
      secondCastId,
      firstCastId
    ]);
    expect(compiled.disclosure.selectedPov).toEqual({
      entityId: povEntityId,
      label: "Pov Character"
    });
    expect(compiled.disclosure.recordCountsByType).toMatchObject({
      "CAST MEMBER": 3,
      ENTITY: 3,
      FACT: 1
    });
    expect(compiled.disclosure.includesSecrets).toBe(false);
    expect(compiled.prompt).toContain("Immediate situation: The three characters face a locked archive.");
    expect(compiled.prompt).toContain("Do not write scene prose, drafted dialogue, branches, plans, or future sequences.");
    expect(compiled.prompt).toContain('"statement":"The archive door is locked."');
    expect(compiled.prompt).not.toContain("accepted prose");
  });

  it("reuses the byte-identical prose-authoritative dossier body including current pressure and override", () => {
    const snapshot = fixtureSnapshot();
    const compiled = compileCastPossibilitiesPrompt(snapshot, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    const firstRecord = snapshot.records.find((record) => record.id === firstCastId);
    expect(firstRecord).toBeDefined();
    if (!firstRecord) {
      return;
    }

    const body = renderActiveDossierBody(snapshot, firstRecord);
    const dossier = renderActiveDossier(snapshot, firstRecord);
    const pressurePin = renderActiveVoicePressurePin(snapshot, firstRecord);
    expect(compiled.prompt).toContain(body);
    expect(compiled.prompt).toContain(dossier);
    expect(compiled.prompt).toContain(`Voice pressure pin: ${pressurePin}`);
    expect(dossier).toContain("## First Character");
    expect(pressurePin).toContain("current generation voice pressure: Keep the pressure practical.");
    expect(body).toContain("Current generation voice override:");
    expect(body).toContain("Be terser than usual.");
  });

  it("renders every selected payload completely while excluding unsanctioned session-only sources", () => {
    const base = fixtureSnapshot();
    const polluted = {
      ...base,
      generationSession: {
        ...base.generationSession,
        accepted_prose: "ACCEPTED_PROSE_SENTINEL",
        private_notes: "PRIVATE_NOTES_SENTINEL",
        rejected_candidate: "REJECTED_CANDIDATE_SENTINEL",
        prompt_archive: "PROMPT_ARCHIVE_SENTINEL",
        prior_assistance: "PRIOR_ASSISTANCE_SENTINEL"
      }
    };
    const compiled = compileCastPossibilitiesPrompt(polluted, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    for (const record of base.records) {
      expect(compiled.prompt).toContain(JSON.stringify(record.payload));
    }
    for (const sentinel of [
      "ACCEPTED_PROSE_SENTINEL",
      "PRIVATE_NOTES_SENTINEL",
      "REJECTED_CANDIDATE_SENTINEL",
      "PROMPT_ARCHIVE_SENTINEL",
      "PRIOR_ASSISTANCE_SENTINEL"
    ]) {
      expect(compiled.prompt).not.toContain(sentinel);
    }
  });

  it("reports purpose-specific blockers without requiring must_render", () => {
    const snapshot = fixtureSnapshot({
      current_authoritative_state: currentState({
        current_time: "",
        immediate_situation_summary: ""
      }),
      manual_moment_directive: { must_render: [] }
    });

    const compiled = compileCastPossibilitiesPrompt(snapshot, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });

    expect(compiled).toMatchObject({
      ok: false,
      kind: "cast-possibilities-not-ready",
      blockers: [
        { code: "cast-possibilities-current-time-required" },
        { code: "cast-possibilities-immediate-situation-required" }
      ]
    });
  });

  it("requires the resolved POV to be a selected character entity or linked cast member", () => {
    const snapshot = fixtureSnapshot();
    const malformed = {
      ...snapshot,
      generationSession: {
        ...snapshot.generationSession,
        active_working_set: {
          ...snapshot.generationSession.active_working_set!,
          selected_pov: factId
        }
      }
    };

    expect(compileCastPossibilitiesPrompt(malformed, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    })).toMatchObject({
      ok: false,
      kind: "cast-possibilities-not-ready",
      blockers: [{ code: "cast-possibilities-pov-required" }]
    });
  });

  it("fails closed when selected records or active/full cast links are incomplete or duplicated", () => {
    const base = fixtureSnapshot();
    const invalidLink = {
      ...base,
      records: base.records.map((record) => record.id === firstCastId
        ? { ...record, payload: { ...record.payload as object, entity_id: factId } }
        : record)
    };
    const duplicateActive = {
      ...base,
      generationSession: {
        ...base.generationSession,
        active_working_set: {
          ...base.generationSession.active_working_set!,
          active_onstage_cast_full: [
            ...base.generationSession.active_working_set!.active_onstage_cast_full,
            base.generationSession.active_working_set!.active_onstage_cast_full[0]!
          ]
        }
      }
    };
    const duplicateSelected = {
      ...base,
      generationSession: {
        ...base.generationSession,
        active_working_set: {
          ...base.generationSession.active_working_set!,
          selected_records: [
            ...base.generationSession.active_working_set!.selected_records,
            firstCastId
          ]
        }
      }
    };

    expect(blockerCodes(compileCastPossibilitiesPrompt(invalidLink, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    }))).toContain("cast-possibilities-active-cast-invalid");
    expect(blockerCodes(compileCastPossibilitiesPrompt(duplicateActive, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    }))).toContain("cast-possibilities-active-cast-duplicate");
    expect(blockerCodes(compileCastPossibilitiesPrompt(duplicateSelected, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    }))).toContain("cast-possibilities-selected-record-integrity");
  });

  it("accepts only the complete ordered three-card envelope and quarantines cross-character dossier citations", () => {
    const snapshot = fixtureSnapshot();
    const compiled = compileCastPossibilitiesPrompt(snapshot, {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    const [second, first] = compiled.disclosure.eligibleCharacters;
    const contextKey = Object.keys(compiled.disclosure.citationMap).find((key) => key.startsWith("[BRIEF-"));
    expect(second).toBeDefined();
    expect(first).toBeDefined();
    expect(contextKey).toBeDefined();
    if (!second || !first || !contextKey) {
      return;
    }

    const valid = {
      contract: CAST_POSSIBILITIES_OUTPUT_CONTRACT,
      characters: [
        characterResult(second.characterKey, second.dossierKeys[0]!, contextKey, "Second"),
        characterResult(first.characterKey, first.dossierKeys[0]!, contextKey, "First")
      ]
    };

    expect(parseCastPossibilitiesOutput(JSON.stringify(valid), compiled.parseContext)).toMatchObject({
      status: "accepted",
      output: valid
    });

    const crossCharacter = structuredClone(valid);
    crossCharacter.characters[0]!.cards[0]!.dossier_keys = [first.dossierKeys[0]!];
    expect(parseCastPossibilitiesOutput(crossCharacter, compiled.parseContext)).toMatchObject({
      status: "quarantined",
      reasonCode: "dossier-citation-owner-mismatch"
    });
  });

  it("keeps prompt bytes and fingerprints deterministic across saved-draft identities", () => {
    const snapshot = fixtureSnapshot();
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 80 }).filter((value) => value.trim().length > 0),
      (savedDraftIdentity) => {
        const first = compileCastPossibilitiesPrompt(snapshot, { savedDraftIdentity });
        const second = compileCastPossibilitiesPrompt(snapshot, { savedDraftIdentity });
        expect(first).toEqual(second);
      }
    ));
  });

  it("quarantines every non-three card count without partial salvage", () => {
    const compiled = compileCastPossibilitiesPrompt(fixtureSnapshot(), {
      savedDraftIdentity: "generation-brief:sha256:fixture",
      targetCharacterId: secondCastId,
      avoidList: ["old one", "old two", "old three"]
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }
    const character = compiled.disclosure.eligibleCharacters[0]!;
    const contextKey = Object.keys(compiled.disclosure.citationMap).find((key) => key.startsWith("[BRIEF-"))!;
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 7 }).filter((count) => count !== 3),
      (count) => {
        const output = {
          contract: CAST_POSSIBILITIES_OUTPUT_CONTRACT,
          characters: [{
            character_key: character.characterKey,
            cards: Array.from({ length: count }, (_, index) =>
              card(`Move ${index + 1}`, character.dossierKeys[0]!, contextKey))
          }]
        };
        expect(parseCastPossibilitiesOutput(output, compiled.parseContext)).toMatchObject({
          status: "quarantined",
          reasonCode: "card-count-mismatch"
        });
      }
    ));
  });

  it("quarantines every named malformed-envelope class as one whole response", () => {
    const compiled = compileCastPossibilitiesPrompt(fixtureSnapshot(), {
      savedDraftIdentity: "generation-brief:sha256:fixture"
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }
    const [second, first] = compiled.disclosure.eligibleCharacters;
    const contextKey = Object.keys(compiled.disclosure.citationMap).find((key) => key.startsWith("[BRIEF-"));
    expect(second).toBeDefined();
    expect(first).toBeDefined();
    expect(contextKey).toBeDefined();
    if (!second || !first || !contextKey) {
      return;
    }
    const valid = {
      contract: CAST_POSSIBILITIES_OUTPUT_CONTRACT,
      characters: [
        characterResult(second.characterKey, second.dossierKeys[0]!, contextKey, "Second"),
        characterResult(first.characterKey, first.dossierKeys[0]!, contextKey, "First")
      ]
    };
    const cases: readonly [string, unknown, string][] = [
      ["non-JSON", "not JSON", "not-pure-json"],
      ["unsupported envelope field", { ...valid, metadata: {} }, "schema-mismatch"],
      ["wrong contract", { ...valid, contract: "wrong" }, "contract-mismatch"],
      ["missing character", { ...valid, characters: valid.characters.slice(0, 1) }, "character-set-mismatch"],
      ["duplicate character", {
        ...valid,
        characters: [
          valid.characters[0],
          { ...valid.characters[1], character_key: valid.characters[0]!.character_key }
        ]
      }, "character-set-mismatch"],
      ["out-of-order character", {
        ...valid,
        characters: [valid.characters[1], valid.characters[0]]
      }, "character-order-mismatch"],
      ["blank field", withFirstCard(valid, { observable_move: " " }), "blank-field"],
      ["unknown context citation", withFirstCard(valid, { context_keys: ["[UNKNOWN-1]"] }), "unknown-citation"],
      ["duplicate citation", withFirstCard(valid, {
        context_keys: [contextKey, contextKey]
      }), "duplicate-citation"],
      ["cross-character dossier citation", withFirstCard(valid, {
        dossier_keys: [first.dossierKeys[0]!]
      }), "dossier-citation-owner-mismatch"]
    ];

    for (const [label, input, reasonCode] of cases) {
      expect(parseCastPossibilitiesOutput(input, compiled.parseContext), label).toMatchObject({
        status: "quarantined",
        reasonCode
      });
    }
  });
});

function blockerCodes(result: ReturnType<typeof compileCastPossibilitiesPrompt>): string[] {
  return result.ok ? [] : result.blockers.map((blocker) => blocker.code);
}

function withFirstCard(
  output: {
    contract: string;
    characters: ReturnType<typeof characterResult>[];
  },
  patch: Record<string, unknown>
) {
  const copy = structuredClone(output);
  copy.characters[0]!.cards[0] = {
    ...copy.characters[0]!.cards[0]!,
    ...patch
  };
  return copy;
}

function characterResult(
  characterKey: string,
  dossierKey: string,
  contextKey: string,
  prefix: string
) {
  return {
    character_key: characterKey,
    cards: [1, 2, 3].map((number) => card(`${prefix} move ${number}`, dossierKey, contextKey))
  };
}

function card(label: string, dossierKey: string, contextKey: string): CastPossibilitiesCard {
  return {
    observable_move: label,
    character_fit: `${label} follows the dossier.`,
    moment_fit: `${label} is feasible now.`,
    local_effect: `${label} changes immediate pressure.`,
    dossier_keys: [dossierKey],
    context_keys: [contextKey],
    distinction: `${label} uses a distinct channel.`
  };
}

function fixtureSnapshot(generationSessionPatch: Record<string, unknown> = {}) {
  const baseGenerationSession = {
    active_working_set: {
      selected_records: [
        povCastId,
        povEntityId,
        secondCastId,
        secondEntityId,
        firstCastId,
        firstEntityId,
        factId
      ],
      active_onstage_cast_full: [
        { cast_member_id: secondCastId, local_function: "active_silent" as const },
        { cast_member_id: povCastId, local_function: "pov_narrator" as const },
        { cast_member_id: firstCastId, local_function: "active_speaker" as const }
      ],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: povEntityId
    },
    current_authoritative_state: currentState(),
    immediate_handoff: {
      recent_causal_context: "The alarm has just stopped.",
      last_visible_moment: "Dust settles from the lock.",
      begin_after: "The failed opening attempt."
    },
    manual_moment_directive: {
      must_render: [],
      may_render_if_naturally_caused: ["A practical response."],
      do_not_force: ["No reveal."]
    },
    current_cast_voice_pressure: [
      {
        cast_member_id: firstCastId,
        current_voice_pressure: "Keep the pressure practical.",
        dialogue_pressure: "Use clipped refusals.",
        pov_narration_pressure: "none",
        nonverbal_or_silence_pressure: "Still hands.",
        current_must_preserve: ["precision"],
        current_must_avoid: ["monologue"]
      }
    ],
    cast_voice_overrides: [
      {
        cast_member_id: firstCastId,
        reason: "The lock raised the stakes.",
        applies_to: ["dialogue" as const],
        override_text: "Be terser than usual."
      }
    ],
    stop_guidance: { soft_unit_guidance: "One immediate response." }
  };

  return buildValidationSnapshot({
    records: records(),
    generationSession: {
      ...baseGenerationSession,
      ...generationSessionPatch
    },
    storyConfig: {
      storyContract: {
        title: "Fixture",
        premise: "Three people confront a locked archive.",
        genre_mode: "mystery",
        tone: "tense",
        setting_baseline: "A sealed municipal archive.",
        content_intensity: "general",
        explicitness: "restrained",
        language_register: "contemporary"
      },
      universalContentPolicy: {
        rating_label: "General",
        allowed_content_scope: "Non-graphic suspense.",
        tonal_handling: "Keep danger grounded.",
        character_bias_handling: "Keep perception character-bound."
      },
      proseMode: {
        pov_character: povEntityId,
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
    versions: { template: "1.11.0", compiler: "1.13.0", contract: "1.16.0" }
  });
}

function currentState(
  overrides: Partial<{
    current_time: string;
    current_location: string;
    onstage_entities: string[];
    immediate_situation_summary: string;
  }> = {}
) {
  return {
    current_time: "Midnight",
    current_location: "Archive",
    onstage_entities: [povEntityId, firstEntityId, secondEntityId],
    immediate_situation_summary: "The three characters face a locked archive.",
    offstage_pressuring_entities: [],
    positions: "All three are beside the door.",
    possessions: "No relevant possessions.",
    visible_conditions: [],
    environmental_conditions: "Dusty and still.",
    entity_statuses: "All three are able to act.",
    line_of_sight_and_visibility: "Everyone can see everyone.",
    pov_cannot_perceive_now: "",
    routes_and_exits: ["the corridor"],
    available_time: "A few minutes.",
    consent_or_force_conditions: "none",
    current_locks: ["The archive door remains locked."],
    ...overrides
  };
}

function records(): ValidationRecord[] {
  return [
    entity(povEntityId, "Pov Character"),
    entity(firstEntityId, "First Character"),
    entity(secondEntityId, "Second Character"),
    cast(povCastId, povEntityId, "Pov dossier", "active_onstage_cast_full", "pov_narrator"),
    cast(firstCastId, firstEntityId, "First dossier", "active_onstage_cast_full", "active_speaker"),
    cast(secondCastId, secondEntityId, "Second dossier", "active_onstage_cast_full", "active_silent"),
    {
      id: factId,
      type: "FACT",
      payload: {
        id: factId,
        fact_kind: "current_state",
        statement: "The archive door is locked.",
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "high"
      }
    }
  ];
}

function entity(id: string, displayName: string): ValidationRecord {
  return {
    id,
    type: "ENTITY",
    payload: {
      id,
      display_name: displayName,
      entity_kind: "person",
      roles_in_story: ["primary_actor"],
      short_description: `${displayName} is present.`
    }
  };
}

function cast(
  id: string,
  entityId: string,
  oneLine: string,
  castBand: "active_onstage_cast_full",
  localFunction: string
): ValidationRecord {
  return {
    id,
    type: "CAST MEMBER",
    castBand,
    localFunction,
    payload: {
      id,
      entity_id: entityId,
      identity: {
        one_line: oneLine,
        public_face: "Controlled.",
        private_pressure: "Worried."
      },
      voice_anchor: {
        core_voice: "Exact and grounded.",
        rhythm_and_syntax: "Short clauses.",
        register_and_diction: "Plain.",
        vocabulary_and_metaphor_pools: "locks and doors",
        profanity_and_intensity: "None.",
        taboo_and_avoidance_patterns: "Avoids confession.",
        dialogue_tactics_and_speech_functions: "Redirects.",
        address_terms_and_naming: "Uses names.",
        silence_interruption_and_turntaking: "Waits.",
        under_pressure_voice: "Quieter.",
        suppression_or_evasion_rule: "Deflects.",
        must_preserve: ["precision"],
        must_avoid: ["generic banter"],
        anti_repetition_warnings: ["Do not repeat lock metaphors."]
      },
      pressure_behavior_core: {
        cornered: "Refuses narrowly.",
        tempted_or_offered_power: "Asks the cost.",
        protecting_attachment: "Moves first."
      },
      body_presence_core: {
        physicality: "Still.",
        habitual_gestures_or_presence: "Touches the doorframe.",
        social_presentation: "Reserved."
      },
      agency_core: {
        default_strategy: "Test the constraint.",
        risk_style: "Measured."
      }
    }
  };
}
