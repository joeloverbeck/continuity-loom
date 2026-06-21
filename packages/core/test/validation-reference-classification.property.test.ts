import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { buildValidationSnapshot } from "../src/index.js";
import { classifyReference } from "../src/validation/reference-classification.js";
import { cleanValidationInput, validationIds } from "./support/arbitraries/validation-snapshots.js";

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 48): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("validation reference classification", () => {
  it("classifies selected, unselected, dangling, and wrong-target-type references exactly", () => {
    const input = cleanValidationInput();
    input.projectRecordIndex = {
      unselectedFact: "FACT",
      unselectedCast: "CAST MEMBER"
    };
    const snapshot = buildValidationSnapshot(input);

    expect(classifyReference(snapshot, validationIds.cast, ["CAST MEMBER"])).toEqual({
      classification: "selected",
      actualType: "CAST MEMBER",
      typeMatches: true
    });
    expect(classifyReference(snapshot, validationIds.cast, ["FACT"])).toEqual({
      classification: "selected",
      actualType: "CAST MEMBER",
      typeMatches: false
    });
    expect(classifyReference(snapshot, "unselectedFact", ["FACT"])).toEqual({
      classification: "unselected",
      actualType: "FACT",
      typeMatches: true
    });
    expect(classifyReference(snapshot, "missing-record", ["FACT"])).toEqual({
      classification: "dangling",
      actualType: undefined,
      typeMatches: false
    });
  });

  it("treats expected type omission as an unconstrained match", () => {
    const snapshot = buildValidationSnapshot(cleanValidationInput());

    expect(classifyReference(snapshot, validationIds.cast)).toEqual({
      classification: "selected",
      actualType: "CAST MEMBER",
      typeMatches: true
    });
    expect(classifyReference(snapshot, "missing-record")).toEqual({
      classification: "dangling",
      actualType: undefined,
      typeMatches: true
    });
  });

  it("is deterministic under selected-record storage-order permutations", () => {
    runProperty(
      fc.property(fc.integer(), (seed) => {
        const input = cleanValidationInput();
        const shuffledRecords = fc.sample(fc.shuffledSubarray([...input.records], {
          minLength: input.records.length,
          maxLength: input.records.length
        }), { seed, numRuns: 1 })[0]!;
        const shuffledInput = { ...input, records: shuffledRecords };

        expect(classifyReference(buildValidationSnapshot(shuffledInput), validationIds.cast, ["CAST MEMBER"])).toEqual(
          classifyReference(buildValidationSnapshot(input), validationIds.cast, ["CAST MEMBER"])
        );
      }),
      0x26021
    );
  });

  it("falls back from selected records to the project index after archive/remove", () => {
    const input = cleanValidationInput();
    input.projectRecordIndex = {
      [validationIds.cast]: "CAST MEMBER"
    };
    input.records = input.records.filter((record) => record.id !== validationIds.cast);

    expect(classifyReference(buildValidationSnapshot(input), validationIds.cast, ["CAST MEMBER"])).toEqual({
      classification: "unselected",
      actualType: "CAST MEMBER",
      typeMatches: true
    });
  });
});
