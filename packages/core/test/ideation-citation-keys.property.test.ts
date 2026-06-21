import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { citationKey, citationKeysFor } from "../src/compiler/ideation/citation-keys.js";
import { ideationRecord } from "./support/arbitraries/ideation-records.js";
import { ideationRecordSetArbitrary, ideationSlateArbitrary } from "./support/arbitraries/ideation-slates.js";

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 48): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("ideation citation keys", () => {
  it("derives the single-record citation key with the default first ordinal", () => {
    expect(citationKey(ideationRecord("VISIBLE AFFORDANCE", "affordance"))).toBe("[VISIBLE AFFORDANCE-1]");
  });

  it("forms a one-to-one key map with unique keys for every generated selected record", () => {
    runProperty(
      fc.property(ideationRecordSetArbitrary, (records) => {
        const keys = citationKeysFor(records);

        expect(keys.size).toBe(records.length);
        expect(new Set(keys.keys()).size).toBe(records.length);
        expect(new Set(keys.values()).size).toBe(records.length);
        for (const record of records) {
          expect(keys.get(record.id)).toMatch(new RegExp("^\\[" + record.type + "-\\d+\\]$"));
        }
      }),
      0x26016
    );
  });

  it("uses contiguous one-based ordinals within each record type", () => {
    runProperty(
      fc.property(ideationRecordSetArbitrary, (records) => {
        const keys = citationKeysFor(records);
        const ordinalsByType = new Map<string, number[]>();

        for (const record of records) {
          const key = keys.get(record.id);
          const ordinal = Number(key?.match(/-(\d+)\]$/)?.[1]);
          ordinalsByType.set(record.type, [...(ordinalsByType.get(record.type) ?? []), ordinal]);
        }

        for (const ordinals of ordinalsByType.values()) {
          expect([...ordinals].sort((left, right) => left - right)).toEqual(
            Array.from({ length: ordinals.length }, (_, index) => index + 1)
          );
        }
      }),
      0x26017
    );
  });

  it("is stable under selected-record storage-order permutation", () => {
    runProperty(
      fc.property(ideationRecordSetArbitrary, fc.integer(), (records, seed) => {
        const permutedRecords = fc.sample(fc.shuffledSubarray([...records], { minLength: records.length, maxLength: records.length }), {
          seed,
          numRuns: 1
        })[0]!;

        expect(sortedEntries(citationKeysFor(permutedRecords))).toEqual(
          sortedEntries(citationKeysFor(records))
        );
      }),
      0x26018
    );
  });

  it("sorts ordinals by type, full display label, then record id", () => {
    const records = [
      ideationRecord("FACT", "fact-z", { label: "Same fact label" }),
      ideationRecord("FACT", "fact-a", { label: "Same fact label" }),
      ideationRecord("FACT", "fact-middle", { label: "Middle fact label" }),
      ideationRecord("BELIEF", "belief-a", { label: "Later belief label" })
    ];

    expect([...citationKeysFor(records).entries()]).toEqual([
      ["belief-a", "[BELIEF-1]"],
      ["fact-middle", "[FACT-1]"],
      ["fact-a", "[FACT-2]"],
      ["fact-z", "[FACT-3]"]
    ]);
  });

  it("renders only resolvable keys in assigned slot grounds", () => {
    runProperty(
      fc.property(ideationSlateArbitrary, ({ assignment, citationKeys }) => {
        const keySet = new Set(citationKeys.values());

        for (const slot of assignment.slots) {
          expect(slot.recordKeys.length).toBeGreaterThan(0);
          for (const key of slot.recordKeys) {
            expect(keySet.has(key)).toBe(true);
          }
        }
      }),
      0x26019
    );
  });
});

function sortedEntries(keys: ReadonlyMap<string, string>): [string, string][] {
  return [...keys.entries()].sort(([left], [right]) => left.localeCompare(right));
}
