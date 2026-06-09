import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS,
  SECTION_ORDER,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { describe, expect, it } from "vitest";

function minimalSnapshotInput(): BuildValidationSnapshotInput {
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

function promptSectionOrder(prompt: string): string[] {
  const sectionPattern = /^<([a-z_]+)(?:\s[^>]*)?>$/gm;

  return Array.from(prompt.matchAll(sectionPattern), (match) => match[1] ?? "");
}

function sectionBody(prompt: string, section: string): string {
  const pattern = new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`);
  const match = prompt.match(pattern);

  return match?.[1] ?? "";
}

describe("compiler scaffold", () => {
  it("renders all prompt sections in compiler-contract order", () => {
    const result = compilePrompt(buildValidationSnapshot(minimalSnapshotInput()));
    const expectedRenderedOrder = SECTION_ORDER.filter(
      (section) => section !== "present_minor_cast" && section !== "offstage_relevance"
    );

    expect(promptSectionOrder(result.prompt)).toEqual(expectedRenderedOrder);
  });

  it("pins scaffold empty-state constants to their prompt sections", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(minimalSnapshotInput()));

    expect(sectionBody(prompt, "hard_canon")).toContain(EMPTY_STATE_CONSTANTS.hard_canon_bullets);
    expect(sectionBody(prompt, "current_authoritative_state")).toContain(
      EMPTY_STATE_CONSTANTS.positions
    );
    expect(sectionBody(prompt, "immediate_handoff")).toContain(
      EMPTY_STATE_CONSTANTS.prior_accepted_prose_status_or_handoff_note
    );
    expect(sectionBody(prompt, "audience_knowledge")).toContain(EMPTY_STATE_CONSTANTS.audience_knows);
    expect(sectionBody(prompt, "secrets_and_reveal_constraints")).toContain(
      EMPTY_STATE_CONSTANTS.writer_visible_hidden_truths
    );
    expect(sectionBody(prompt, "active_working_set")).toContain(
      EMPTY_STATE_CONSTANTS.active_action_pressure
    );
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain(
      EMPTY_STATE_CONSTANTS.active_intentions
    );
    expect(sectionBody(prompt, "active_cast_full_dossiers")).toContain(
      EMPTY_STATE_CONSTANTS.active_onstage_full_cast_dossiers
    );
    expect(prompt).not.toContain("<present_minor_cast>");
    expect(prompt).not.toContain("<offstage_relevance>");
    expect(sectionBody(prompt, "relevant_facts_beliefs_events").trim()).toBe("None specified");
    expect(sectionBody(prompt, "locations_objects_affordances").trim()).toBe("None specified");
    expect(sectionBody(prompt, "physical_continuity")).toContain(
      EMPTY_STATE_CONSTANTS.physical_continuity
    );
    expect(prompt).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
  });

  it("is deterministic for the same snapshot and version triple", () => {
    const snapshot = buildValidationSnapshot(minimalSnapshotInput());
    const first = compilePrompt(snapshot);
    const second = compilePrompt(snapshot);

    expect(second.prompt).toBe(first.prompt);
    expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint);
    expect(first.metadata.versions).toEqual({
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    });
    expect(first.metadata.lengthEstimate).toBe(first.prompt.length);
    expect(first.metadata.tokenEstimate).toBeGreaterThan(0);
  });
});
