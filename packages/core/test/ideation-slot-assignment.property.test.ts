import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { assignSlots } from "../src/compiler/ideation/slot-assignment.js";
import { ideationRequestSchema } from "../src/compiler/ideation/types.js";
import type { ValidationRecord } from "../src/validation/snapshot.js";
import {
  ideationPresenceVectorArbitrary,
  ideationRecord,
  recordsForPresence
} from "./support/arbitraries/ideation-records.js";
import { ideationRequestArbitrary } from "./support/arbitraries/ideation-requests.js";

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 48): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("ideation slot assignment properties", () => {
  it("enforces exact request-count boundaries and defaults", () => {
    expect(ideationRequestSchema.parse({})).toEqual({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      avoidList: []
    });

    expect(assignSlots(fullOperatorRecordSet(), { count: 3, dormantSlot: false })).toMatchObject({
      requestedCount: 3,
      assignedCount: 3,
      shrunk: false
    });
    expect(assignSlots(fullOperatorRecordSet(), { count: 6, dormantSlot: false })).toMatchObject({
      requestedCount: 6,
      assignedCount: 6,
      shrunk: false
    });
    expect(() => assignSlots(fullOperatorRecordSet(), { count: 2, dormantSlot: false })).toThrow();
    expect(() => assignSlots(fullOperatorRecordSet(), { count: 7, dormantSlot: false })).toThrow();
  });

  it("never pads, never overfills, and reports shrink exactly for generated requests", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, ideationRequestArbitrary, (vector, request) => {
        const assignment = assignSlots(recordsForPresence(vector), request);

        expect(assignment.requestedCount).toBe(request.count);
        expect(assignment.assignedCount).toBe(assignment.slots.length);
        expect(assignment.assignedCount).toBeLessThanOrEqual(request.count);
        expect(assignment.shrunk).toBe(assignment.assignedCount < request.count);
        expect(assignment.slots).not.toContain(undefined);
      }),
      0x26011
    );
  });

  it("reserves a requested dormant slot as the final slot when any dormant-eligible record exists", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, ideationRequestArbitrary, (vector, request) => {
        const records = recordsForPresence(vector);
        const assignment = assignSlots(records, { ...request, dormantSlot: true });
        const dormantSlot = assignment.slots.find((slot) => slot.operator === "reincorporate_dormant");

        if (records.length === 0) {
          expect(dormantSlot).toBeUndefined();
          return;
        }

        expect(dormantSlot).toBeDefined();
        expect(assignment.slots.at(-1)?.operator).toBe("reincorporate_dormant");
      }),
      0x26012
    );
  });

  it("does not synthesize an empty dormant slot when no dormant-eligible record exists", () => {
    expect(assignSlots([], { count: 3, dormantSlot: true })).toEqual({
      slots: [],
      requestedCount: 3,
      assignedCount: 0,
      shrunk: true
    });
  });

  it("omits the dormant slot when it is not requested", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, ideationRequestArbitrary, (vector, request) => {
        const assignment = assignSlots(recordsForPresence(vector), { ...request, dormantSlot: false });

        expect(assignment.slots.map((slot) => slot.operator)).not.toContain("reincorporate_dormant");
      }),
      0x26013
    );
  });

  it("prefers revealable secrets over secrets that have no reveal permission", () => {
    const assignment = assignSlots(
      [
        secretWithMalformedPayload("secret-malformed-payload"),
        secretWithoutRevealPermission("secret-without-permission"),
        ideationRecord("SECRET", "secret-directive", { revealable: "directive_required" }),
        ideationRecord("SECRET", "secret-natural", { revealable: true })
      ],
      { count: 3, dormantSlot: false }
    );

    expect(assignment.slots[0]).toMatchObject({
      operator: "reveal",
      recordKeys: ["[SECRET-2]", "[SECRET-3]"]
    });
  });

  it("selects the oldest dormant record with id as the deterministic tie-break", () => {
    const oldestByTimestamp = assignSlots(
      [
        ideationRecord("PLAN", "plan-newer", { updatedAt: "2026-06-03T00:00:00.000Z" }),
        ideationRecord("CLOCK", "clock-oldest", { updatedAt: "2026-06-01T00:00:00.000Z" }),
        ideationRecord("FACT", "fact-middle", { updatedAt: "2026-06-02T00:00:00.000Z" })
      ],
      { count: 3, dormantSlot: true }
    );
    const idTieBreak = assignSlots(
      [
        ideationRecord("PLAN", "plan-b", { updatedAt: "2026-06-01T00:00:00.000Z" }),
        ideationRecord("PLAN", "plan-a", { updatedAt: "2026-06-01T00:00:00.000Z" })
      ],
      { count: 3, dormantSlot: true }
    );

    expect(oldestByTimestamp.slots.at(-1)).toMatchObject({
      operator: "reincorporate_dormant",
      recordKeys: ["[CLOCK-1]"]
    });
    expect(idTieBreak.slots.at(-1)).toMatchObject({
      operator: "reincorporate_dormant",
      recordKeys: ["[PLAN-1]"]
    });
  });

  it("is invariant to selected-record storage order", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, ideationRequestArbitrary, fc.integer(), (vector, request, seed) => {
        const records = recordsForPresence(vector);
        const permutedRecords = fc.sample(fc.shuffledSubarray(records, { minLength: records.length, maxLength: records.length }), {
          seed,
          numRuns: 1
        })[0]!;

        expect(assignSlots(permutedRecords, request)).toEqual(assignSlots(records, request));
      }),
      0x26014
    );
  });

  it("ignores records that are ineligible for every ideation operator", () => {
    runProperty(
      fc.property(ideationPresenceVectorArbitrary, ideationRequestArbitrary, (vector, request) => {
        const records = recordsForPresence(vector);
        const withIneligibleRecord = [...records, ineligibleRecord("cast-member-extra")];

        expect(assignSlots(withIneligibleRecord, request)).toEqual(assignSlots(records, request));
      }),
      0x26015
    );
  });

  it("does not use an ineligible record as the dormant target", () => {
    const assignment = assignSlots(
      [
        ineligibleRecord("cast-member-older", "2026-06-01T00:00:00.000Z"),
        ideationRecord("CLOCK", "clock-newer", { updatedAt: "2026-06-02T00:00:00.000Z" })
      ],
      { count: 3, dormantSlot: true }
    );

    expect(assignment.slots.at(-1)).toMatchObject({
      operator: "reincorporate_dormant",
      recordKeys: ["[CLOCK-1]"]
    });
  });
});

function fullOperatorRecordSet(): ValidationRecord[] {
  return [
    ideationRecord("SECRET", "secret", { revealable: true }),
    ideationRecord("BELIEF", "belief"),
    ideationRecord("FACT", "fact"),
    ideationRecord("CLOCK", "clock"),
    ideationRecord("PLAN", "plan"),
    ideationRecord("OBLIGATION", "obligation"),
    ideationRecord("RELATIONSHIP", "relationship"),
    ideationRecord("VISIBLE AFFORDANCE", "affordance"),
    ideationRecord("OPEN THREAD", "thread"),
    ideationRecord("EVENT", "event")
  ];
}

function secretWithoutRevealPermission(id: string): ValidationRecord {
  return {
    ...ideationRecord("SECRET", id),
    payload: { secret_claim: "Secret without reveal permission" }
  };
}

function secretWithMalformedPayload(id: string): ValidationRecord {
  return {
    ...ideationRecord("SECRET", id),
    payload: null
  };
}

function ineligibleRecord(id: string, updatedAt = "2026-06-21T00:00:00.000Z"): ValidationRecord {
  return {
    id,
    type: "CAST MEMBER",
    payload: { name: "Ineligible Cast Member" },
    metadata: {
      id,
      type: "test",
      displayLabel: "Ineligible Cast Member",
      createdAt: "2026-06-21T00:00:00.000Z",
      updatedAt,
      archived: false
    }
  };
}
