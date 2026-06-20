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
const physicalEntityId = "019b0298-5c00-7000-8000-000000000413";
const physicalLocationId = "019b0298-5c00-7000-8000-000000000414";
const physicalStatusId = "019b0298-5c00-7000-8000-000000000415";
const missingPhysicalEntityId = "019b0298-5c00-7000-8000-000000000416";
const missingObjectOwnerId = "019b0298-5c00-7000-8000-000000000417";
const missingStateLocationId = "019b0298-5c00-7000-8000-000000000420";
const missingStateStatusId = "019b0298-5c00-7000-8000-000000000421";
const povLongBeliefClaim =
  "The guard is bluffing about the archive lock because he keeps touching the wrong key ring before answering.";
const nonPovLongBeliefClaim =
  "The archive door is watched by someone above the landing even though the stairwell sounds empty from below.";
const longPhysicalActivity =
  "Jon has just bought a Cormac McCarthy novel from the corner shop and is trying to hide the receipt from everyone nearby.";

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
      claim: povLongBeliefClaim,
      belief_mode: "suspects",
      truth_relation: "unknown",
      confidence: "medium",
      visibility: "private",
      access_route: "inference",
      behavioral_effect: "Keeps pressure on the guard instead of retreating."
    }),
    record("019b0298-5c00-7000-8000-000000000406", "BELIEF", "Non-POV belief", {
      holder: nonPovId,
      claim: nonPovLongBeliefClaim,
      belief_mode: "believes",
      truth_relation: "partly_true",
      confidence: "high",
      visibility: "concealed",
      access_route: "direct_observation",
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
      visibility_and_sound: "Echoes carry.",
      hazards_or_shelters: ["Loose rail on the west turn.", "Alcove gives cover from the landing."],
      social_rules: ["Archivists must yield the inner stair to sealed-ledger couriers."]
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
    }),
    record(physicalEntityId, "ENTITY", "Jon Ureña", {
      id: physicalEntityId,
      display_name: "Jon Ureña",
      entity_kind: "person",
      roles_in_story: ["primary_actor"],
      short_description: "A watchful man in the archive."
    }),
    record(physicalLocationId, "LOCATION", "Jon Ureña's home...", {
      status: "active",
      label: "Jon Ureña's home",
      description: "A narrow apartment above the shop.",
      layout_relevant_now: "The stairs turn tightly.",
      access_routes: ["street door"],
      visibility_and_sound: "Neighbors can hear raised voices."
    }),
    record(physicalStatusId, "ENTITY STATUS", `${longPhysicalActivity.slice(0, 77)}...`, {
      entity_id: physicalEntityId,
      life: "alive",
      agency: "free",
      location: physicalLocationId,
      visibility_to_pov: "visible",
      current_activity: longPhysicalActivity
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
        immediate_situation_summary: "The POV stands below the landing with the lantern in hand.",
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
    storyConfig: {
      proseMode: {
        pov_character: "variable",
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
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain(
      "hazards or shelters: Loose rail on the west turn., Alcove gives cover from the landing."
    );
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain(
      "social rules: Archivists must yield the inner stair to sealed-ledger couriers."
    );
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain("Lantern");
    expect(sectionBody(prompt, "locations_objects_affordances")).toContain("Servant door");
    expect(sectionBody(prompt, "physical_continuity")).toContain("The POV stands below the landing.");
  });

  it("renders location hazards and social rules in ideation tail sections", () => {
    const prompt = compilePrompt(buildValidationSnapshot(input()), { promptKind: "ideation" }).prompt;
    const locationsObjects = sectionBody(prompt, "locations_objects_affordances");

    expect(locationsObjects).toContain("hazards or shelters: Loose rail on the west turn., Alcove gives cover from the landing.");
    expect(locationsObjects).toContain("social rules: Archivists must yield the inner stair to sealed-ledger couriers.");
    expect(locationsObjects).not.toContain("Dock Authority - institution");
  });

  it("resolves object and visible affordance references to display labels", () => {
    const availableAffordanceId = "019b0298-5c00-7000-8000-000000000418";
    const sentinelAffordanceId = "019b0298-5c00-7000-8000-000000000419";
    const records = tailRecords().map((item) =>
      item.id === "019b0298-5c00-7000-8000-000000000411"
        ? record(item.id, item.type, item.metadata?.displayLabel ?? item.id, {
            status: "active",
            label: "Lantern",
            description: "A smoky hand lantern.",
            owner: physicalEntityId,
            carried_by: physicalEntityId,
            current_location: physicalLocationId,
            visibility_to_pov: "visible",
            usable_affordances: ["raise light"],
            constraints: ["oil is low"]
          })
        : item
    );
    const recordsWithAvailableAffordance = [
      ...records,
      record(availableAffordanceId, "VISIBLE AFFORDANCE", "Lift lantern", {
        status: "available",
        label: "Lift lantern",
        prompt_text: "The lantern can be raised to throw light up the stair.",
        requires: ["free hand"],
        action_families: ["perceive"],
        available_to: physicalEntityId,
        risk: "physical",
        durability: "reversible_state_change"
      }),
      record(sentinelAffordanceId, "VISIBLE AFFORDANCE", "Signal anyone onstage", {
        status: "available",
        label: "Signal anyone onstage",
        prompt_text: "Anyone onstage can signal toward the landing.",
        requires: [],
        action_families: ["communicate"],
        available_to: "any_onstage",
        risk: "social",
        durability: "durable_state_change"
      })
    ];
    const locationsObjects = sectionBody(
      compilePrompt(buildValidationSnapshot(input(recordsWithAvailableAffordance))).prompt,
      "locations_objects_affordances"
    );

    expect(locationsObjects).toContain(
      "- Lantern; A smoky hand lantern.; owner: Jon Ureña; carried by: Jon Ureña; location: Jon Ureña's home; visibility: visible; affordances: raise light; constraints: oil is low"
    );
    expect(locationsObjects).toContain(
      "- Lift lantern; The lantern can be raised to throw light up the stair.; available to: Jon Ureña; actions: perceive; requires: free hand; risk: physical; durability: reversible_state_change"
    );
    expect(locationsObjects).toContain(
      "- Signal anyone onstage; Anyone onstage can signal toward the landing.; available to: any_onstage; actions: communicate; risk: social; durability: durable_state_change"
    );
    expect(locationsObjects).toContain("available to: any_onstage");
    expect(locationsObjects).not.toContain(`owner: ${physicalEntityId}`);
    expect(locationsObjects).not.toContain(`carried by: ${physicalEntityId}`);
    expect(locationsObjects).not.toContain(`location: ${physicalLocationId}`);
    expect(locationsObjects).not.toContain(`available to: ${physicalEntityId}`);
  });

  it("falls back to raw ids when object references are absent from the snapshot", () => {
    const records = tailRecords().map((item) =>
      item.id === "019b0298-5c00-7000-8000-000000000411"
        ? record(item.id, item.type, item.metadata?.displayLabel ?? item.id, {
            status: "active",
            label: "Lantern",
            description: "A smoky hand lantern.",
            owner: missingObjectOwnerId,
            carried_by: "unknown",
            current_location: "offstage",
            visibility_to_pov: "hidden",
            usable_affordances: ["raise light"],
            constraints: ["oil is low"]
          })
        : item
    );
    const locationsObjects = sectionBody(compilePrompt(buildValidationSnapshot(input(records))).prompt, "locations_objects_affordances");

    expect(locationsObjects).toContain(
      `- Lantern; A smoky hand lantern.; owner: ${missingObjectOwnerId}; carried by: unknown; location: offstage; visibility: hidden; affordances: raise light; constraints: oil is low`
    );
  });

  it("renders section-level empty states when composite tail sources are absent", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyInput()));
    const facts = sectionBody(prompt, "relevant_facts_beliefs_events");
    const locationsObjects = sectionBody(prompt, "locations_objects_affordances");

    expect(facts.trim()).toBe("None specified");
    expect(facts).not.toContain("POV-accessible facts:");
    expect(facts).not.toContain("Recent events:");
    expect(locationsObjects.trim()).toBe("None specified");
    expect(locationsObjects).not.toContain("Locations:");
    expect(locationsObjects).not.toContain("Visible affordances:");
    expect(locationsObjects).not.toContain("Unavailable or impossible actions:");
    expect(sectionBody(prompt, "physical_continuity")).toContain(EMPTY_STATE_CONSTANTS.physical_continuity);
  });

  it("omits empty optional sub-blocks while keeping populated composite siblings", () => {
    const records = tailRecords().filter((item) => item.type !== "VISIBLE AFFORDANCE");
    const mixedInput = input(records);
    const state = mixedInput.generationSession.current_authoritative_state;
    if (state) {
      state.current_locks = [];
    }
    const prompt = compilePrompt(buildValidationSnapshot(mixedInput)).prompt;
    const locationsObjects = sectionBody(prompt, "locations_objects_affordances");

    expect(locationsObjects).toContain("Locations:\n- Archive stair");
    expect(locationsObjects).toContain("Objects:\n- Lantern");
    expect(locationsObjects).not.toContain("Visible affordances:");
    expect(locationsObjects).not.toContain("Unavailable or impossible actions:");
    expect(locationsObjects).not.toContain("None specified");
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

  it("renders all prompt-facing belief fields without truncating long claims", () => {
    const facts = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "relevant_facts_beliefs_events");

    expect(facts).toContain(
      [
        "POV-relevant beliefs:",
        `- ${povLongBeliefClaim}; truth: unknown; mode: suspects; confidence: medium; access: inference; behavior: Keeps pressure on the guard instead of retreating.; visibility: private`
      ].join("\n")
    );
    expect(facts).toContain(
      [
        "Non-POV behavior-shaping beliefs:",
        `- ${nonPovLongBeliefClaim}; behavior: Keeps glancing toward the landing.; mode: believes; truth: partly_true; confidence: high; access: direct_observation; visibility: concealed`
      ].join("\n")
    );
    expect(facts).not.toContain(`${povLongBeliefClaim.slice(0, 80)}...`);
    expect(facts).not.toContain(`${nonPovLongBeliefClaim.slice(0, 80)}...`);
  });

  it("resolves physical continuity entity and location references to display labels", () => {
    const physicalContinuity = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "physical_continuity");

    expect(physicalContinuity).toContain(
      `- entity: Jon Ureña; life: alive; agency: free; location: Jon Ureña's home; visibility: visible; activity: ${longPhysicalActivity}`
    );
    expect(physicalContinuity).not.toContain(`entity: ${physicalEntityId}`);
    expect(physicalContinuity).not.toContain(`location: ${physicalLocationId}`);
  });

  it("resolves physical continuity current-state location ids while preserving prose and dangling values", () => {
    const selectedInput = input();
    selectedInput.generationSession.current_authoritative_state!.current_location = physicalLocationId;
    const selectedContinuity = sectionBody(compilePrompt(buildValidationSnapshot(selectedInput)).prompt, "physical_continuity");
    expect(selectedContinuity).toContain("- location: Jon Ureña's home");
    expect(selectedContinuity).not.toContain(`- location: ${physicalLocationId}`);

    const proseInput = input();
    proseInput.generationSession.current_authoritative_state!.current_location = "the mill loft at dusk";
    const proseContinuity = sectionBody(compilePrompt(buildValidationSnapshot(proseInput)).prompt, "physical_continuity");
    expect(proseContinuity).toContain("- location: the mill loft at dusk");

    const danglingInput = input();
    danglingInput.generationSession.current_authoritative_state!.current_location = missingStateLocationId;
    const danglingContinuity = sectionBody(compilePrompt(buildValidationSnapshot(danglingInput)).prompt, "physical_continuity");
    expect(danglingContinuity).toContain(`- location: ${missingStateLocationId}`);
  });

  it("resolves physical continuity current-state entity status arrays while preserving prose and dangling values", () => {
    const selectedInput = input();
    selectedInput.generationSession.current_authoritative_state!.entity_statuses = [physicalStatusId];
    const selectedContinuity = sectionBody(compilePrompt(buildValidationSnapshot(selectedInput)).prompt, "physical_continuity");
    expect(selectedContinuity).toContain(`- statuses: ${longPhysicalActivity}`);
    expect(selectedContinuity).not.toContain(`- statuses: ${physicalStatusId}`);

    const proseInput = input();
    proseInput.generationSession.current_authoritative_state!.entity_statuses = "Everyone is mobile.";
    const proseContinuity = sectionBody(compilePrompt(buildValidationSnapshot(proseInput)).prompt, "physical_continuity");
    expect(proseContinuity).toContain("- statuses: Everyone is mobile.");

    const danglingInput = input();
    danglingInput.generationSession.current_authoritative_state!.entity_statuses = [missingStateStatusId];
    const danglingContinuity = sectionBody(compilePrompt(buildValidationSnapshot(danglingInput)).prompt, "physical_continuity");
    expect(danglingContinuity).toContain(`- statuses: ${missingStateStatusId}`);
  });

  it("renders physical continuity location labels once and without editor truncation markers", () => {
    const physicalContinuity = sectionBody(compilePrompt(buildValidationSnapshot(input())).prompt, "physical_continuity");
    const locationLine = physicalContinuity
      .split("\n")
      .find((line) => line.includes("A narrow apartment above the shop."));

    expect(locationLine).toBe(
      "- Jon Ureña's home; A narrow apartment above the shop.; status: active"
    );
    expect(locationLine?.match(/Jon Ureña's home/g)).toHaveLength(1);
    expect(physicalContinuity.split("\n").some((line) => line.endsWith("..."))).toBe(false);
  });

  it("falls back to raw ids when physical continuity references are absent from the snapshot", () => {
    const records = tailRecords().map((item) =>
      item.id === physicalStatusId
        ? record(item.id, item.type, item.metadata?.displayLabel ?? item.id, {
            entity_id: missingPhysicalEntityId,
            life: "alive",
            agency: "free",
            location: "offstage",
            visibility_to_pov: "hidden",
            current_activity: "Waiting beyond the visible room."
          })
        : item
    );
    const physicalContinuity = sectionBody(compilePrompt(buildValidationSnapshot(input(records))).prompt, "physical_continuity");

    expect(physicalContinuity).toContain(
      `- entity: ${missingPhysicalEntityId}; life: alive; agency: free; location: offstage; visibility: hidden; activity: Waiting beyond the visible room.`
    );
  });
});
