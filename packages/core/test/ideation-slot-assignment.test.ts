import { describe, expect, it } from "vitest";

import { assignSlots } from "../src/compiler/ideation/slot-assignment.js";
import { citationKeysFor } from "../src/compiler/ideation/citation-keys.js";
import { ideationRequestSchema } from "../src/compiler/ideation/types.js";
import type { ValidationRecord } from "../src/validation/snapshot.js";

describe("ideation slot assignment", () => {
  it("normalizes ideation requests with bounded count and defaults", () => {
    expect(ideationRequestSchema.parse({})).toEqual({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      avoidList: []
    });

    expect(() => ideationRequestSchema.parse({ count: 2 })).toThrow();
    expect(() => ideationRequestSchema.parse({ count: 7 })).toThrow();
  });

  it("fills eligible operators in taxonomy order from selected record types", () => {
    const assignment = assignSlots(
      [
        record("plan-a", "PLAN", "Plan A"),
        record("clock-a", "CLOCK", "Clock A"),
        record("secret-a", "SECRET", "Secret A", {
          reveal_permission: "natural_reveal_allowed"
        }),
        record("belief-a", "BELIEF", "Belief A"),
        record("fact-a", "FACT", "Fact A")
      ],
      { count: 4, dormantSlot: false }
    );

    expect(assignment.slots.map((slot) => slot.operator)).toEqual([
      "reveal",
      "falsify_belief",
      "clock_advances",
      "plan_meets_friction"
    ]);
    expect(assignment.shrunk).toBe(false);
  });

  it("shrinks the slate instead of padding when too few operators are eligible", () => {
    const assignment = assignSlots([record("clock-a", "CLOCK", "Clock A")], { count: 5, dormantSlot: false });

    expect(assignment).toMatchObject({
      requestedCount: 5,
      assignedCount: 1,
      shrunk: true
    });
    expect(assignment.slots.map((slot) => slot.operator)).toEqual(["clock_advances"]);
  });

  it("requires both belief and fact/event evidence for the falsify-belief operator", () => {
    const beliefOnly = assignSlots([record("belief-a", "BELIEF", "Belief A")], { count: 3, dormantSlot: false });
    const withFact = assignSlots([record("belief-a", "BELIEF", "Belief A"), record("fact-a", "FACT", "Fact A")], {
      count: 3,
      dormantSlot: false
    });

    expect(beliefOnly.slots.map((slot) => slot.operator)).not.toContain("falsify_belief");
    expect(withFact.slots.map((slot) => slot.operator)).toContain("falsify_belief");
  });

  it("targets the least recently updated selected pressure record for dormancy, with id tie-break", () => {
    const assignment = assignSlots(
      [
        record("plan-b", "PLAN", "Plan B", {}, "2026-06-03T00:00:00.000Z"),
        record("plan-a", "PLAN", "Plan A", {}, "2026-06-03T00:00:00.000Z"),
        record("clock-a", "CLOCK", "Clock A", {}, "2026-06-02T00:00:00.000Z"),
        record("fact-new", "FACT", "Fact New", {}, "2026-06-04T00:00:00.000Z")
      ],
      { count: 3, dormantSlot: true }
    );

    expect(assignment.slots.at(-1)).toMatchObject({
      operator: "reincorporate_dormant",
      recordKeys: ["[CLOCK: Clock A]"]
    });

    const tieAssignment = assignSlots(
      [
        record("plan-b", "PLAN", "Plan B", {}, "2026-06-03T00:00:00.000Z"),
        record("plan-a", "PLAN", "Plan A", {}, "2026-06-03T00:00:00.000Z")
      ],
      { count: 3, dormantSlot: true }
    );

    expect(tieAssignment.slots.at(-1)?.recordKeys).toEqual(["[PLAN: Plan A]"]);
  });

  it("uses identical slot machinery for question mode", () => {
    const records = [
      record("secret-a", "SECRET", "Secret A", { reveal_permission: "locked" }),
      record("clock-a", "CLOCK", "Clock A")
    ];

    expect(assignSlots(records, { mode: "ideas", count: 3, dormantSlot: false }).slots).toEqual(
      assignSlots(records, { mode: "questions", count: 3, dormantSlot: false }).slots
    );
  });

  it("is deterministic for identical inputs and resolves citation-key collisions predictably", () => {
    const records = [
      record("fact-b", "FACT", "Same Label"),
      record("fact-a", "FACT", "Same Label"),
      record("belief-a", "BELIEF", "Belief A")
    ];

    expect(assignSlots(records, { count: 3, dormantSlot: true })).toEqual(
      assignSlots(records, { count: 3, dormantSlot: true })
    );
    expect([...citationKeysFor(records).entries()]).toEqual([
      ["belief-a", "[BELIEF: Belief A]"],
      ["fact-a", "[FACT: Same Label]"],
      ["fact-b", "[FACT: Same Label 2]"]
    ]);
  });
});

function record(
  id: string,
  type: string,
  label: string,
  payload: Record<string, unknown> = {},
  updatedAt = "2026-06-05T00:00:00.000Z"
): ValidationRecord {
  return {
    id,
    type,
    payload,
    metadata: {
      id,
      type,
      displayLabel: label,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt,
      archived: false
    }
  };
}
