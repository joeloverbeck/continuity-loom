import fc from "fast-check";

import {
  buildValidationSnapshot,
  compilePrompt,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import {
  optionalSectionInput,
  optionalSectionVariantArbitrary,
  proseSnapshotInputArbitrary
} from "./support/arbitraries/prose-snapshots.js";
import { describe, expect, it } from "vitest";

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 16): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

function compile(input: BuildValidationSnapshotInput) {
  return compilePrompt(buildValidationSnapshot(input));
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return value;
}

function hasSection(prompt: string, section: string): boolean {
  return new RegExp(`^<${section}(?:\\s[^>]*)?>$`, "m").test(prompt);
}

describe("compiler prose metamorphic properties", () => {
  it("is invariant to input record permutation for prompt bytes and metadata", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const forward = compile(input);
        const reversed = compile({ ...input, records: [...input.records].reverse() });

        expect(reversed.prompt).toBe(forward.prompt);
        expect(reversed.metadata).toEqual(forward.metadata);
      }),
      0x26009
    );
  });

  it("is repeatable for the same frozen snapshot", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const snapshot = buildValidationSnapshot(input);
        const first = compilePrompt(snapshot);
        const second = compilePrompt(snapshot);

        expect(second.prompt).toBe(first.prompt);
        expect(second.metadata).toEqual(first.metadata);
      }),
      0x2600a
    );
  });

  it("does not mutate deep-frozen compiler inputs while building and compiling snapshots", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const before = structuredClone(input);
        const frozen = deepFreeze(input);
        const result = compile(frozen);

        expect(result.prompt.length).toBeGreaterThan(0);
        expect(frozen).toEqual(before);
      }),
      0x2600b
    );
  });

  it("renders optional prose sections exactly when their source categories are populated", () => {
    runProperty(
      fc.property(optionalSectionVariantArbitrary, (variant) => {
        const prompt = compile(optionalSectionInput(variant)).prompt;

        expect(hasSection(prompt, "hard_canon")).toBe(variant === "hardCanon");
        expect(hasSection(prompt, "present_minor_cast")).toBe(variant === "presentMinor");
        expect(hasSection(prompt, "offstage_relevance")).toBe(variant === "offstage");
      }),
      0x2600c,
      12
    );
  });
});
