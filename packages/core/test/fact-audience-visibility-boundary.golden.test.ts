import {
  buildValidationSnapshot,
  compilePrompt,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { describe, expect, it } from "vitest";

// PRD #165 / issue #167: SECRET is the sole reader-concealment (dramatic-irony) authority.
// FACT.audience_visibility is not a reader-concealment control, so a `hidden` hard-canon
// FACT the POV knows must compile byte-identically to an `explicit` one, while an equivalent
// SECRET (pov_access: knows, audience_visibility: hidden) is what populates the compiled
// "Audience does not know" line. This golden test locks that boundary so no future change
// silently wires FACT.audience_visibility into compiled concealment (that would require a
// deliberate FOUNDATIONS amendment first).

const povId = "019b0298-5c00-7000-8000-0000000000a1";
const factId = "019b0298-5c00-7000-8000-0000000000a2";
const secretId = "019b0298-5c00-7000-8000-0000000000a3";

const premiseClaim = "The point-of-view character can time-travel and is functionally immortal.";

type AudienceVisibility = "hidden" | "implied" | "explicit" | "not_applicable";

function metadata(id: string, displayLabel: string, salience: string) {
  return {
    id,
    type: "test",
    displayLabel,
    status: "active",
    salience,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    archived: false
  };
}

function baseInput(factAudienceVisibility: AudienceVisibility): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: povId,
        type: "ENTITY",
        metadata: metadata(povId, "Vale", "high"),
        payload: {
          id: povId,
          display_name: "Vale",
          status: "active",
          entity_kind: "person",
          canonical_summary: "Vale keeps a very old secret behind an ordinary face."
        }
      },
      {
        id: factId,
        type: "FACT",
        metadata: metadata(factId, "The premise", "critical"),
        payload: {
          id: factId,
          fact_kind: "hard_canon",
          statement: premiseClaim,
          scope: "global",
          known_by: [povId],
          audience_visibility: factAudienceVisibility,
          salience: "critical"
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [povId, factId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "A grey afternoon.",
        current_location: "The reading room.",
        onstage_entities: [povId],
        immediate_situation_summary: "Vale waits for the archivist to return.",
        offstage_pressuring_entities: [],
        positions: ["Vale sits by the window."],
        possessions: "Vale carries a worn ticket stub.",
        visible_conditions: ["Dust drifts in the light."],
        environmental_conditions: "Rain against the glass.",
        entity_statuses: "Vale is calm and free to move.",
        line_of_sight_and_visibility: "Vale can see the whole room.",
        routes_and_exits: ["The main stair."],
        available_time: "A quiet minute.",
        consent_or_force_conditions: "none",
        current_locks: []
      },
      manual_moment_directive: {
        must_render: ["Vale notices the clock has stopped."],
        may_render_if_naturally_caused: [],
        do_not_force: ["Do not reveal that Vale is immortal."]
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {
      storyContract: {
        title: "The Long Afternoon",
        premise: "An immortal waits out one more century in a library.",
        genre_mode: "quiet speculative",
        tone: "still and watchful",
        setting_baseline: "A civic archive.",
        content_intensity: "mature",
        explicitness: "non-graphic",
        language_register: "literary"
      },
      proseMode: {
        pov_character: povId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "sparse",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

function withEquivalentSecret(input: BuildValidationSnapshotInput): BuildValidationSnapshotInput {
  input.records = [
    ...input.records,
    {
      id: secretId,
      type: "SECRET",
      metadata: metadata(secretId, "The concealed premise", "critical"),
      payload: {
        id: secretId,
        status: "hidden",
        secret_kind: "body_state",
        secret_claim: premiseClaim,
        holders: [povId],
        non_holders_to_protect: "all_except_holders",
        audience_visibility: "hidden",
        pov_access: "knows",
        allowed_surface_cues: ["Vale never seems to age."],
        forbidden_reveals: ["Do not state that Vale is immortal."],
        reveal_permission: "locked",
        reveal_triggers: []
      }
    }
  ];
  input.generationSession.active_working_set!.selected_records = [
    ...input.generationSession.active_working_set!.selected_records,
    secretId
  ];
  return input;
}

function sectionBody(prompt: string, section: string): string {
  const pattern = new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`);
  return prompt.match(pattern)?.[1] ?? "";
}

function compile(input: BuildValidationSnapshotInput): string {
  return compilePrompt(buildValidationSnapshot(input)).prompt;
}

describe("FACT audience_visibility is not a reader-concealment control (PRD #165 / #167)", () => {
  it("compiles a hidden hard-canon FACT byte-identically to an explicit one", () => {
    const hiddenPrompt = compile(baseInput("hidden"));
    const explicitPrompt = compile(baseInput("explicit"));

    expect(hiddenPrompt).toBe(explicitPrompt);
  });

  it("keeps the audience-knowledge block SECRET-driven when only a hidden FACT carries the premise", () => {
    const prompt = compile(baseInput("hidden"));
    const audience = sectionBody(prompt, "audience_knowledge");

    // The hidden FACT never reaches any audience lane: no per-fact concealment annotation.
    expect(audience).not.toContain(premiseClaim);
    expect(audience).toContain("Audience does not know:\nNone specified");

    // The POV still knows the premise; re-scoping does not strip POV knowledge.
    expect(sectionBody(prompt, "pov_knowledge_constraints")).toContain(`POV knows:\n- ${premiseClaim}`);
  });

  it("populates the compiled \"Audience does not know\" line from an equivalent hidden SECRET", () => {
    const prompt = compile(withEquivalentSecret(baseInput("hidden")));
    const audience = sectionBody(prompt, "audience_knowledge");

    expect(audience).toContain(`Audience does not know:\n- ${premiseClaim}`);
    expect(audience).not.toContain("Audience does not know:\nNone specified");
  });
});
