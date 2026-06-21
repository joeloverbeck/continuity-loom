import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { IDEATION_OPERATORS } from "../src/compiler/ideation/operators.js";
import { assignSlots } from "../src/compiler/ideation/slot-assignment.js";
import type { IdeationOperatorId } from "../src/compiler/ideation/types.js";
import {
  ideationPresenceVectorArbitrary,
  ideationRecord,
  recordsForPresence,
  type IdeationPresenceVector,
  type IdeationRecordType
} from "./support/arbitraries/ideation-records.js";

type TruthRow = {
  id: IdeationOperatorId;
  name: string;
  definition: string;
  feedingTypes: readonly IdeationRecordType[];
};

const operatorTruthTable: readonly TruthRow[] = [
  {
    id: "reveal",
    name: "Reveal",
    definition:
      "Change information access by bringing one selected secret closer to the surface through an authored legal cue or reveal permission.",
    feedingTypes: ["SECRET"]
  },
  {
    id: "plan_meets_friction",
    name: "Plan Meets Friction",
    definition: "Change attempt state by making one selected plan or intention meet local resistance, cost, or interruption.",
    feedingTypes: ["PLAN", "INTENTION"]
  },
  {
    id: "emotion_becomes_action",
    name: "Emotion Becomes Action",
    definition:
      "Change observable tactics by making one selected emotion produce a concrete action, refusal, concealment, or control shift.",
    feedingTypes: ["EMOTION"]
  },
  {
    id: "shift_option_set",
    name: "Shift the Option Set",
    definition:
      "Change the immediate feasible-action set through one selected affordance, object, location, or entity status.",
    feedingTypes: ["VISIBLE AFFORDANCE", "OBJECT", "LOCATION", "ENTITY STATUS"]
  },
  {
    id: "falsify_belief",
    name: "Falsify a Belief",
    definition: "Change operative interpretation by making one selected active belief collide with one selected fact or event.",
    feedingTypes: ["BELIEF", "FACT", "EVENT"]
  },
  {
    id: "clock_advances",
    name: "Clock Advances",
    definition: "Change temporal pressure by advancing one selected active clock without inventing unsupported facts.",
    feedingTypes: ["CLOCK"]
  },
  {
    id: "debt_comes_due",
    name: "Debt Comes Due",
    definition: "Change duty or effect pressure by making one selected obligation or consequence demand action now.",
    feedingTypes: ["OBLIGATION", "CONSEQUENCE"]
  },
  {
    id: "relationship_turns",
    name: "Relationship Turns",
    definition:
      "Change relational pressure by making one selected relationship turn, tighten, invert, or demand a new response.",
    feedingTypes: ["RELATIONSHIP"]
  },
  {
    id: "commit_at_a_cost",
    name: "Commit at a Cost",
    definition:
      "Change commitment under pressure by forcing one selected costly move from two different active pressure families; never render an A/B menu or branch list.",
    feedingTypes: [
      "SECRET",
      "BELIEF",
      "EVENT",
      "PLAN",
      "INTENTION",
      "CLOCK",
      "OBLIGATION",
      "CONSEQUENCE",
      "RELATIONSHIP",
      "EMOTION",
      "OPEN THREAD",
      "VISIBLE AFFORDANCE",
      "OBJECT",
      "LOCATION",
      "ENTITY STATUS"
    ]
  }
];

const dormantCandidateTypes: readonly IdeationRecordType[] = [
  "SECRET",
  "BELIEF",
  "EVENT",
  "CLOCK",
  "PLAN",
  "INTENTION",
  "OBLIGATION",
  "CONSEQUENCE",
  "RELATIONSHIP",
  "EMOTION",
  "OPEN THREAD",
  "VISIBLE AFFORDANCE",
  "OBJECT",
  "LOCATION",
  "ENTITY STATUS"
];

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 32): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

function expectedOperators(vector: IdeationPresenceVector): IdeationOperatorId[] {
  return operatorTruthTable
    .filter((row) => eligibleByTruthTable(row, vector))
    .map((row) => row.id)
    .slice(0, 6);
}

function eligibleByTruthTable(row: TruthRow, vector: IdeationPresenceVector): boolean {
  switch (row.id) {
    case "reveal":
      return vector.SECRET > 0 && vector.revealableSecret;
    case "plan_meets_friction":
      return vector.PLAN + vector.INTENTION > 0;
    case "emotion_becomes_action":
      return vector.EMOTION > 0;
    case "shift_option_set":
      return vector["VISIBLE AFFORDANCE"] + vector.OBJECT + vector.LOCATION + vector["ENTITY STATUS"] > 0;
    case "falsify_belief":
      return vector.BELIEF > 0 && vector.FACT + vector.EVENT > 0;
    case "clock_advances":
      return vector.CLOCK > 0;
    case "debt_comes_due":
      return vector.OBLIGATION + vector.CONSEQUENCE > 0;
    case "relationship_turns":
      return vector.RELATIONSHIP > 0;
    case "commit_at_a_cost":
      return pressureFamilyCount(vector) >= 2;
  }
}

function pressureFamilyCount(vector: IdeationPresenceVector): number {
  return [
    vector.PLAN + vector.INTENTION,
    vector.CLOCK,
    vector.OBLIGATION + vector.CONSEQUENCE,
    vector["OPEN THREAD"],
    vector.RELATIONSHIP,
    vector.EMOTION,
    vector.SECRET + vector.BELIEF,
    vector["VISIBLE AFFORDANCE"] + vector.OBJECT + vector.LOCATION + vector["ENTITY STATUS"],
    vector.EVENT
  ].filter((count) => count > 0).length;
}

describe("ideation operator eligibility", () => {
  it("matches the doc-derived operator truth table for generated presence vectors", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, (vector) => {
        const assigned = assignSlots(recordsForPresence(vector), { count: 6, dormantSlot: false });

        expect(assigned.slots.map((slot) => slot.operator)).toEqual(expectedOperators(vector));
      }),
      0x26010
    );
  });

  it("keeps the code operator table in SPEC-028 order", () => {
    expect(IDEATION_OPERATORS.map((operator) => operator.id)).toEqual(operatorTruthTable.map((row) => row.id));
    expect(IDEATION_OPERATORS.map((operator) => operator.name)).toEqual(operatorTruthTable.map((row) => row.name));
  });

  it.each(operatorTruthTable)("admits the minimal documented inputs for %s", (row) => {
    const records = minimalRecords(row);
    const assigned = assignSlots(records, { count: 6, dormantSlot: false });
    const slot = assigned.slots.find((candidate) => candidate.operator === row.id);

    expect(assigned.slots.map((slot) => slot.operator)).toContain(row.id);
    expect(slot?.operatorName).toBe(row.name);
    expect(slot?.definition).toBe(row.definition);
  });

  it("requires BELIEF plus FACT or EVENT for Falsify a Belief", () => {
    const beliefOnly = assignSlots([ideationRecord("BELIEF", "belief-only")], { count: 6, dormantSlot: false });
    const factOnly = assignSlots([ideationRecord("FACT", "fact-only")], { count: 6, dormantSlot: false });
    const withFact = assignSlots([ideationRecord("BELIEF", "belief"), ideationRecord("FACT", "fact")], {
      count: 6,
      dormantSlot: false
    });
    const withEvent = assignSlots([ideationRecord("BELIEF", "belief"), ideationRecord("EVENT", "event")], {
      count: 6,
      dormantSlot: false
    });

    expect(beliefOnly.slots.map((slot) => slot.operator)).not.toContain("falsify_belief");
    expect(factOnly.slots.map((slot) => slot.operator)).not.toContain("falsify_belief");
    expect(withFact.slots.map((slot) => slot.operator)).toContain("falsify_belief");
    expect(withEvent.slots.map((slot) => slot.operator)).toContain("falsify_belief");
  });

  it("requires two different pressure families for Commit at a Cost and excludes FACT", () => {
    const oneFamily = assignSlots([ideationRecord("PLAN", "plan"), ideationRecord("INTENTION", "intention")], {
      count: 6,
      dormantSlot: false
    });
    const factPlusPlan = assignSlots([ideationRecord("PLAN", "plan"), ideationRecord("FACT", "fact")], {
      count: 6,
      dormantSlot: false
    });
    const twoFamilies = assignSlots([ideationRecord("PLAN", "plan"), ideationRecord("CLOCK", "clock")], {
      count: 6,
      dormantSlot: false
    });

    expect(oneFamily.slots.map((slot) => slot.operator)).not.toContain("commit_at_a_cost");
    expect(factPlusPlan.slots.map((slot) => slot.operator)).not.toContain("commit_at_a_cost");
    expect(twoFamilies.slots.map((slot) => slot.operator)).toContain("commit_at_a_cost");
  });

  it("fails closed for stale statuses and preserves the documented PLAN plan_status exception", () => {
    expect(assignSlots([ideationRecord("PLAN", "revised", { payload: { plan_status: "revised" } })], { count: 6, dormantSlot: false }).slots).toEqual([]);
    expect(assignSlots([ideationRecord("CLOCK", "paused", { payload: { status: "paused" } })], { count: 6, dormantSlot: false }).slots).toEqual([]);
    expect(assignSlots([ideationRecord("EMOTION", "transformed", { payload: { status: "transformed" } })], { count: 6, dormantSlot: false }).slots.map((slot) => slot.operator)).toEqual(["emotion_becomes_action"]);
    expect(assignSlots([ideationRecord("EVENT", "irrelevant", { payload: { current_relevance: "none" } })], { count: 6, dormantSlot: false }).slots).toEqual([]);
  });

  it("requires a legal authored surface move for Reveal and does not treat directive_required alone as enough", () => {
    const directiveOnly = ideationRecord("SECRET", "directive", { revealable: "directive_required" });
    const lockedWithCue = ideationRecord("SECRET", "locked-cue", {
      payload: { reveal_permission: "locked", allowed_surface_cues: ["A visible flinch."] }
    });
    const clueOnly = ideationRecord("SECRET", "clue", { payload: { reveal_permission: "clue_only" } });

    expect(assignSlots([directiveOnly], { count: 6, dormantSlot: false }).slots).toEqual([]);
    expect(assignSlots([lockedWithCue], { count: 6, dormantSlot: false }).slots.map((slot) => slot.operator)).toEqual([
      "reveal"
    ]);
    expect(assignSlots([clueOnly], { count: 6, dormantSlot: false }).slots.map((slot) => slot.operator)).toEqual([
      "reveal"
    ]);
  });

  it("uses dormant selected pressure as a modifier on a real unused operator", () => {
    const assignment = assignSlots(
      [
        ideationRecord("CLOCK", "clock-old", { updatedAt: "2026-06-01T00:00:00.000Z" }),
        ideationRecord("PLAN", "plan-new", { updatedAt: "2026-06-02T00:00:00.000Z" })
      ],
      { count: 3, dormantSlot: true }
    );

    expect(assignment.slots.at(-1)).toMatchObject({
      operator: "commit_at_a_cost",
      recordKeys: ["[CLOCK-1]", "[PLAN-1]"],
      dormantRecordKey: "[CLOCK-1]"
    });
    expect(assignSlots(assignmentRecordsWithoutDormantViability(), { count: 3, dormantSlot: true }).shrunk).toBe(true);
  });

  it("allows each dormant candidate type to participate in at least one real operator", () => {
    for (const type of dormantCandidateTypes) {
      const id = type.toLowerCase().replaceAll(" ", "-") + "-candidate";
      const records = [ideationRecord(type, id, { revealable: type === "SECRET" })];
      const withSupport =
        type === "BELIEF"
          ? [...records, ideationRecord("FACT", "fact-support")]
          : type === "EVENT"
            ? [...records, ideationRecord("CLOCK", "clock-support")]
          : type === "OPEN THREAD"
            ? [...records, ideationRecord("CLOCK", "clock-support")]
            : records;
      const assignment = assignSlots(withSupport, { count: 6, dormantSlot: false });

      expect(assignment.slots.length, type).toBeGreaterThan(0);
      expect(assignment.slots.some((slot) => slot.recordKeys.includes("[" + type + "-1]")), type).toBe(true);
    }
  });
});

function minimalRecords(row: TruthRow): ReturnType<typeof ideationRecord>[] {
  switch (row.id) {
    case "falsify_belief":
      return [ideationRecord("BELIEF", "belief"), ideationRecord("FACT", "fact")];
    case "commit_at_a_cost":
      return [ideationRecord("PLAN", "plan"), ideationRecord("CLOCK", "clock")];
    default:
      return [ideationRecord(row.feedingTypes[0]!, row.id + "-record", { revealable: row.id === "reveal" })];
  }
}

function assignmentRecordsWithoutDormantViability(): ReturnType<typeof ideationRecord>[] {
  return [ideationRecord("CLOCK", "clock-only", { updatedAt: "2026-06-01T00:00:00.000Z" })];
}
