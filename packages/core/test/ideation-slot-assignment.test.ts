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
      focus: "",
      avoidList: []
    });

    expect(() => ideationRequestSchema.parse({ count: 2 })).toThrow();
    expect(() => ideationRequestSchema.parse({ count: 7 })).toThrow();
  });

  it("fills eligible operators in taxonomy order from selected record types", () => {
    const assignment = assignSlots(
      [
        record("plan-a", "PLAN", "Plan A", { plan_status: "active" }),
        record("emotion-a", "EMOTION", "Emotion A", { status: "active" }),
        record("affordance-a", "VISIBLE AFFORDANCE", "Affordance A", { status: "available" }),
        record("clock-a", "CLOCK", "Clock A", { status: "active" }),
        record("secret-a", "SECRET", "Secret A", {
          status: "hidden",
          reveal_permission: "natural_reveal_allowed"
        }),
        record("belief-a", "BELIEF", "Belief A", { status: "active" }),
        record("fact-a", "FACT", "Fact A")
      ],
      { count: 4, dormantSlot: false }
    );

    expect(assignment.slots.map((slot) => slot.operator)).toEqual([
      "reveal",
      "plan_meets_friction",
      "emotion_becomes_action",
      "shift_option_set"
    ]);
    expect(assignment.shrunk).toBe(false);
  });

  it("shrinks the slate instead of padding when too few operators are eligible", () => {
    const assignment = assignSlots([record("clock-a", "CLOCK", "Clock A", { status: "active" })], {
      count: 5,
      dormantSlot: false
    });

    expect(assignment).toMatchObject({
      requestedCount: 5,
      assignedCount: 1,
      shrunk: true
    });
    expect(assignment.slots.map((slot) => slot.operator)).toEqual(["clock_advances"]);
  });

  it("requires both belief and fact/event evidence for the falsify-belief operator", () => {
    const beliefOnly = assignSlots([record("belief-a", "BELIEF", "Belief A")], { count: 3, dormantSlot: false });
    const withFact = assignSlots(
      [record("belief-a", "BELIEF", "Belief A", { status: "active" }), record("fact-a", "FACT", "Fact A")],
      {
        count: 3,
        dormantSlot: false
      }
    );

    expect(beliefOnly.slots.map((slot) => slot.operator)).not.toContain("falsify_belief");
    expect(withFact.slots.map((slot) => slot.operator)).toContain("falsify_belief");
  });

  it("uses the least recently updated viable selected pressure as a dormant modifier", () => {
    const assignment = assignSlots(
      [
        record("plan-b", "PLAN", "Plan B", { plan_status: "active" }, "2026-06-03T00:00:00.000Z"),
        record("plan-a", "PLAN", "Plan A", { plan_status: "active" }, "2026-06-03T00:00:00.000Z"),
        record("clock-a", "CLOCK", "Clock A", { status: "active" }, "2026-06-02T00:00:00.000Z"),
        record("fact-new", "FACT", "Fact New", {}, "2026-06-04T00:00:00.000Z")
      ],
      { count: 3, dormantSlot: true }
    );

    expect(assignment.slots.at(-1)).toMatchObject({
      operator: "commit_at_a_cost",
      recordKeys: ["[CLOCK-1]", "[PLAN-2]"],
      dormantRecordKey: "[CLOCK-1]"
    });

    const tieAssignment = assignSlots(
      [
        record("plan-b", "PLAN", "Plan B", { plan_status: "active" }, "2026-06-03T00:00:00.000Z"),
        record("plan-a", "PLAN", "Plan A", { plan_status: "active" }, "2026-06-03T00:00:00.000Z"),
        record("clock-a", "CLOCK", "Clock A", { status: "active" }, "2026-06-04T00:00:00.000Z")
      ],
      { count: 3, dormantSlot: true }
    );

    expect(tieAssignment.slots.at(-1)).toMatchObject({
      operator: "commit_at_a_cost",
      dormantRecordKey: "[PLAN-1]"
    });
  });

  it("uses identical slot machinery for question mode", () => {
    const records = [
      record("secret-a", "SECRET", "Secret A", { reveal_permission: "locked" }),
      record("clock-a", "CLOCK", "Clock A", { status: "active" })
    ];

    expect(assignSlots(records, { mode: "ideas", count: 3, dormantSlot: false }).slots).toEqual(
      assignSlots(records, { mode: "questions", count: 3, dormantSlot: false }).slots
    );
  });

  it("uses an available nonblank clue carrier after ignoring malformed carrier entries", () => {
    const assignment = assignSlots([
      record("secret-carrier", "SECRET", "Carrier-backed secret", {
        reveal_permission: "locked",
        allowed_surface_cues: [],
        clue_carriers: [
          null,
          { status: "spent", clue_text: "An exhausted clue." },
          { status: "available", clue_text: "  A fresh hinge scrape.  " }
        ]
      })
    ], {
      count: 3,
      dormantSlot: false,
      focus: "How can pressure surface without inventing evidence?"
    });

    expect(assignment.slots[0]).toMatchObject({
      operator: "reveal",
      recordKeys: ["[SECRET-1]"]
    });
  });

  it("is deterministic for identical inputs and assigns per-type citation-key ordinals predictably", () => {
    const records = [
      record("fact-b", "FACT", "Same Label"),
      record("fact-a", "FACT", "Same Label"),
      record("belief-a", "BELIEF", "Belief A")
    ];

    expect(assignSlots(records, { count: 3, dormantSlot: true })).toEqual(
      assignSlots(records, { count: 3, dormantSlot: true })
    );
    expect([...citationKeysFor(records).entries()]).toEqual([
      ["belief-a", "[BELIEF-1]"],
      ["fact-a", "[FACT-1]"],
      ["fact-b", "[FACT-2]"]
    ]);
    expect([...citationKeysFor([...records].reverse()).entries()]).toEqual([
      ["belief-a", "[BELIEF-1]"],
      ["fact-a", "[FACT-1]"],
      ["fact-b", "[FACT-2]"]
    ]);
  });

  it("orders citation-key ordinals from full record labels instead of truncated browse labels", () => {
    const fullClaim =
      "Jon Urena keeps daydreaming in his spare time, during commute, even in bed because the missing audit page gives his fear a shape";
    const truncatedBrowseLabel = `${fullClaim.slice(0, 77)}...`;
    const records = [
      record("belief-long", "BELIEF", truncatedBrowseLabel, {
        claim: fullClaim
      }),
      record("belief-alpha", "BELIEF", "Later browse label", {
        claim: "A private worry that sorts before Jon's full claim"
      })
    ];

    expect(citationKeysFor(records).get("belief-alpha")).toBe("[BELIEF-1]");
    expect(citationKeysFor(records).get("belief-long")).toBe("[BELIEF-2]");
    const dormantSlot = assignSlots(
      [
        record("secret-a", "SECRET", "Secret A", {
          status: "hidden",
          reveal_permission: "natural_reveal_allowed"
        }),
        record("plan-a", "PLAN", "Plan A", { plan_status: "active" }),
        ...records,
        record("fact-a", "FACT", "Fact A")
      ],
      { count: 3, dormantSlot: true }
    ).slots.at(-1);

    expect(dormantSlot).toMatchObject({
      operator: "falsify_belief",
      dormantRecordKey: "[BELIEF-1]"
    });
  });
});

function record(
  id: string,
  type: string,
  label: string,
  payload: Record<string, unknown> = {},
  updatedAt = "2026-06-05T00:00:00.000Z"
): ValidationRecord {
  const fullPayload = { ...labelPayload(type, label), ...payload };

  return {
    id,
    type,
    payload: fullPayload,
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

function labelPayload(type: string, label: string): Record<string, unknown> {
  switch (type) {
    case "BELIEF":
      return { status: "active", claim: label };
    case "CLOCK":
      return { status: "active", title: label };
    case "OPEN THREAD":
      return { status: "active", current_relevance: "high", title: label };
    case "CONSEQUENCE":
      return { status: "active", current_effect: label };
    case "EVENT":
      return { status: "active", current_relevance: "high", description: label };
    case "RELATIONSHIP":
      return { status: "active", description: label };
    case "FACT":
      return { statement: label };
    case "INTENTION":
      return { status: "active", intent: label };
    case "OBLIGATION":
      return { status: "open", terms: label };
    case "PLAN":
      return { plan_status: "active", objective: label };
    case "SECRET":
      return { status: "hidden", secret_claim: label };
    case "EMOTION":
      return { status: "active", description: label };
    case "VISIBLE AFFORDANCE":
      return { status: "available", label };
    case "OBJECT":
    case "LOCATION":
      return { status: "active", label };
    case "ENTITY STATUS":
      return { current_activity: label };
    default:
      return { label };
  }
}
