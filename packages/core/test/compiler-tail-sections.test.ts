import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { describe, expect, it } from "vitest";

const povId = "019b0298-5c00-7000-8000-000000000401";
const nonPovId = "019b0298-5c00-7000-8000-000000000402";

function tailRecords(): ValidationRecord[] {
  return [
    record("019b0298-5c00-7000-8000-000000000403", "FACT", "Public fact", {
      statement: "The bridge is closed.",
      known_by: "public"
    }),
    record("019b0298-5c00-7000-8000-000000000404", "FACT", "Hidden fact", {
      statement: "The guard has a second key.",
      known_by: [nonPovId]
    }),
    record("019b0298-5c00-7000-8000-000000000405", "BELIEF", "POV belief", {
      holder: povId,
      claim: "The guard is bluffing.",
      truth_relation: "unknown"
    }),
    record("019b0298-5c00-7000-8000-000000000406", "BELIEF", "Non-POV belief", {
      holder: nonPovId,
      claim: "The archive door is watched.",
      behavioral_effect: "Keeps glancing toward the landing."
    }),
    record("019b0298-5c00-7000-8000-000000000407", "EVENT", "Recent event", {
      event_kind: "recent_causal",
      description: "A lantern fell in the hall.",
      pov_visibility: "perceived_directly"
    }),
    record("019b0298-5c00-7000-8000-000000000408", "EVENT", "Backstory event", {
      event_kind: "relevant_backstory",
      description: "The old curator sealed the archive years ago.",
      current_relevance: "high"
    }),
    record("019b0298-5c00-7000-8000-000000000409", "EVENT", "Withheld event", {
      event_kind: "withheld",
      description: "The guard already sent a warning.",
      pov_visibility: "withheld"
    }),
    record("019b0298-5c00-7000-8000-000000000410", "LOCATION", "Archive stair", {
      status: "active",
      label: "Archive stair",
      description: "Narrow stone stairs.",
      layout_relevant_now: "Only one person can pass.",
      access_routes: ["landing", "north hall"],
      visibility_and_sound: "Echoes carry."
    }),
    record("019b0298-5c00-7000-8000-000000000411", "OBJECT", "Lantern", {
      status: "active",
      label: "Lantern",
      description: "A smoky hand lantern.",
      owner: povId,
      carried_by: povId,
      current_location: "carried_by_holder",
      visibility_to_pov: "visible",
      usable_affordances: ["raise light"],
      constraints: ["oil is low"]
    }),
    record("019b0298-5c00-7000-8000-000000000412", "VISIBLE AFFORDANCE", "Blocked door", {
      status: "blocked",
      label: "Servant door",
      prompt_text: "The servant door cannot open from this side.",
      requires: ["key"],
      action_families: ["move"],
      available_to: "any_onstage",
      risk: "physical"
    })
  ];
}

function record(id: string, type: string, label: string, payload: Record<string, unknown>): ValidationRecord {
  return {
    id,
    type,
    metadata: {
      id,
      type,
      displayLabel: label,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      archived: false
    },
    payload
  };
}

function input(records = tailRecords()): BuildValidationSnapshotInput {
  return {
    records,
    generationSession: {
      active_working_set: {
        selected_records: records.map((item) => item.id),
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "Dawn.",
        current_location: "Archive stair.",
        onstage_entities: [povId],
        offstage_pressuring_entities: [nonPovId],
        positions: "The POV stands below the landing.",
        possessions: "The lantern is in POV's hand.",
        visible_conditions: ["low light"],
        environmental_conditions: "Wet stone.",
        entity_statuses: "Everyone is mobile.",
        line_of_sight_and_visibility: "The landing is partly hidden.",
        routes_and_exits: ["north hall"],
        available_time: "One quick exchange.",
        consent_or_force_conditions: "none",
        current_locks: ["The servant door is blocked."]
      },
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

describe("compiler tail-section resolvers", () => {
  it("renders populated facts, beliefs, events, locations, objects, affordances, and physical continuity", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(input()));

    expect(sectionBody(prompt, "relevant_facts_beliefs_events")).toContain("The bridge is closed.");
    expect(sectionBody(prompt, "relevant_facts_beliefs_events")).toContain("The guard has a second key.");
    expect(sectionBody(prompt, "relevant_facts_beliefs_events")).toContain("A lantern fell in the hall.");
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain("Archive stair");
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain("Lantern");
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain("Servant door");
    expect(sectionBody(prompt, "physical_continuity")).toContain("The POV stands below the landing.");
  });

  it("renders exact empty-state constants when tail sources are absent", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyInput()));

    expect(sectionBody(prompt, "relevant_facts_beliefs_events")).toContain(
      EMPTY_STATE_CONSTANTS.pov_accessible_facts
    );
    expect(sectionBody(prompt, "relevant_facts_beliefs_events")).toContain(EMPTY_STATE_CONSTANTS.recent_events);
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain(EMPTY_STATE_CONSTANTS.locations);
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain(
      EMPTY_STATE_CONSTANTS.unavailable_or_impossible_actions
    );
    expect(sectionBody(prompt, "physical_continuity")).toContain(EMPTY_STATE_CONSTANTS.physical_continuity);
  });

  it("derives unavailable actions from current locks and blocked affordances", () => {
    const unavailable = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "locations_objects_affordances");

    expect(unavailable).toContain("Current lock: The servant door is blocked.");
    expect(unavailable).toContain("status: blocked");
    expect(unavailable).toContain("The servant door cannot open from this side.");
  });

  it("keeps writer-visible facts and withheld events out of POV-accessible facts", () => {
    const facts = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "relevant_facts_beliefs_events");

    expect(facts).toContain("POV-accessible facts:\n- The bridge is closed.");
    expect(facts).not.toContain("POV-accessible facts:\n- The guard has a second key.");
    expect(facts).toContain("Writer-visible or non-POV facts:\n- The guard has a second key.");
    expect(facts).toContain("Offstage or withheld events:\n- The guard already sent a warning.");
  });
});
