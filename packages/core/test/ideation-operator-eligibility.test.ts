import fc from "fast-check";

import { assignSlots } from "../src/compiler/ideation/slot-assignment.js";
import type { IdeationOperatorId } from "../src/compiler/ideation/types.js";
import {
  ideationPresenceVectorArbitrary,
  ideationRecord,
  recordsForPresence,
  type IdeationPresenceVector,
  type IdeationRecordType
} from "./support/arbitraries/ideation-records.js";
import { describe, expect, it } from "vitest";

type TruthRow = {
  id: IdeationOperatorId;
  name: string;
  definition: string;
  feedingTypes: readonly IdeationRecordType[];
  minimumRecords?: number;
  requiredGroups?: readonly (readonly IdeationRecordType[])[];
};

const operatorTruthTable: readonly TruthRow[] = [
  {
    id: "reveal",
    name: "Reveal",
    definition:
      "Bring a selected secret closer to the surface while respecting reveal permission and POV knowledge constraints.",
    feedingTypes: ["SECRET"]
  },
  {
    id: "falsify_belief",
    name: "Falsify a Belief",
    definition: "Make a selected belief collide with a selected fact or event that can expose its limits.",
    feedingTypes: ["BELIEF", "FACT", "EVENT"],
    requiredGroups: [["BELIEF"], ["FACT", "EVENT"]]
  },
  {
    id: "clock_advances",
    name: "Clock Advances",
    definition: "Advance a selected clock in a way that changes immediate pressure without inventing unsupported facts.",
    feedingTypes: ["CLOCK"]
  },
  {
    id: "plan_meets_friction",
    name: "Plan Meets Friction",
    definition: "Turn a selected plan or intention into a yes-but or no-and complication.",
    feedingTypes: ["PLAN", "INTENTION"]
  },
  {
    id: "debt_comes_due",
    name: "Debt Comes Due",
    definition: "Make a selected obligation or consequence demand action now.",
    feedingTypes: ["OBLIGATION", "CONSEQUENCE"]
  },
  {
    id: "relationship_reversal",
    name: "Relationship Reversal",
    definition: "Invert, stress, or reframe a selected relationship pressure in the current moment.",
    feedingTypes: ["RELATIONSHIP"]
  },
  {
    id: "close_escape_route",
    name: "Close the Escape Route",
    definition: "Use a selected affordance, object, or location to remove an easy path forward.",
    feedingTypes: ["VISIBLE AFFORDANCE", "OBJECT", "LOCATION"]
  },
  {
    id: "collide_two_threads",
    name: "Collide Two Threads",
    definition: "Make two selected pressures interfere with each other instead of resolving cleanly.",
    feedingTypes: ["OPEN THREAD", "PLAN", "SECRET", "EVENT"],
    minimumRecords: 2
  }
];

const dormantTypes: readonly IdeationRecordType[] = [
  "SECRET",
  "BELIEF",
  "FACT",
  "EVENT",
  "CLOCK",
  "PLAN",
  "INTENTION",
  "OBLIGATION",
  "CONSEQUENCE",
  "RELATIONSHIP",
  "OPEN THREAD",
  "VISIBLE AFFORDANCE",
  "OBJECT",
  "LOCATION"
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
  const feedingCount = row.feedingTypes.reduce((total, type) => total + vector[type], 0);
  const hasMinimum = feedingCount >= (row.minimumRecords ?? 1);
  const hasRequiredGroups = (row.requiredGroups ?? []).every((group) => group.some((type) => vector[type] > 0));

  return hasMinimum && hasRequiredGroups;
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

  it("requires two feeding records for Collide Two Threads", () => {
    const oneRecord = assignSlots([ideationRecord("OPEN THREAD", "thread")], { count: 6, dormantSlot: false });
    const twoRecords = assignSlots([
      ideationRecord("OPEN THREAD", "thread"),
      ideationRecord("PLAN", "plan")
    ], { count: 6, dormantSlot: false });

    expect(oneRecord.slots.map((slot) => slot.operator)).not.toContain("collide_two_threads");
    expect(twoRecords.slots.map((slot) => slot.operator)).toContain("collide_two_threads");
  });

  it("prefers revealable secrets but still grounds Reveal when only locked secrets are selected", () => {
    const revealable = assignSlots([
      ideationRecord("SECRET", "locked-secret"),
      ideationRecord("SECRET", "revealable-secret", { revealable: true })
    ], { count: 6, dormantSlot: false });
    const lockedOnly = assignSlots([ideationRecord("SECRET", "locked-secret")], { count: 6, dormantSlot: false });

    expect(revealable.slots[0]).toMatchObject({
      operator: "reveal",
      recordKeys: ["[SECRET-2]"]
    });
    expect(lockedOnly.slots[0]).toMatchObject({
      operator: "reveal",
      recordKeys: ["[SECRET-1]"]
    });
  });

  it("reserves the dormant slot only when requested and a dormant-eligible record exists", () => {
    const records = [ideationRecord("CLOCK", "clock", { updatedAt: "2026-06-01T00:00:00.000Z" })];

    expect(assignSlots(records, { count: 3, dormantSlot: true }).slots.at(-1)?.operator).toBe(
      "reincorporate_dormant"
    );
    expect(assignSlots(records, { count: 3, dormantSlot: false }).slots.map((slot) => slot.operator)).not.toContain(
      "reincorporate_dormant"
    );
    expect(dormantTypes).toContain("CLOCK");
  });

  it.each(dormantTypes)(
    "allows %s records to ground the dormant slot",
    (type) => {
      const id = type.toLowerCase().replaceAll(" ", "-") + "-dormant";
      const assignment = assignSlots([ideationRecord(type, id)], {
        count: 3,
        dormantSlot: true
      });
      const expectedKey = "[" + type + "-1]";

      expect(assignment.slots.at(-1)).toMatchObject({
        operator: "reincorporate_dormant",
        recordKeys: [expectedKey]
      });
    }
  );
});

function minimalRecords(row: TruthRow): ReturnType<typeof ideationRecord>[] {
  if (row.id === "falsify_belief") {
    return [ideationRecord("BELIEF", "belief"), ideationRecord("FACT", "fact")];
  }

  if (row.id === "collide_two_threads") {
    return [ideationRecord("OPEN THREAD", "thread"), ideationRecord("EVENT", "event")];
  }

  return [ideationRecord(row.feedingTypes[0]!, row.id + "-record", { revealable: row.id === "reveal" })];
}
