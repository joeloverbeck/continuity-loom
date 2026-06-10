import {
  buildValidationSnapshot,
  compilePrompt,
  DIAGNOSTIC_CODES,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { warningRules } from "../src/validation/rules/warnings.js";
import { describe, expect, it } from "vitest";

function minimalInput(projectRecordIndex?: Readonly<Record<string, string>>): BuildValidationSnapshotInput {
  const input: BuildValidationSnapshotInput = {
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

  if (projectRecordIndex) {
    input.projectRecordIndex = projectRecordIndex;
  }

  return input;
}

describe("validation snapshot project record index", () => {
  it("builds snapshots with a present, canonical, frozen project record index", () => {
    const snapshot = buildValidationSnapshot(
      minimalInput({
        "019b0298-5c00-7000-8000-000000000002": "LOCATION",
        "019b0298-5c00-7000-8000-000000000001": "CAST MEMBER"
      })
    );

    expect(snapshot.projectRecordIndex).toEqual({
      "019b0298-5c00-7000-8000-000000000001": "CAST MEMBER",
      "019b0298-5c00-7000-8000-000000000002": "LOCATION"
    });
    expect(Object.keys(snapshot.projectRecordIndex)).toEqual([
      "019b0298-5c00-7000-8000-000000000001",
      "019b0298-5c00-7000-8000-000000000002"
    ]);
    expect(Object.isFrozen(snapshot.projectRecordIndex)).toBe(true);
  });

  it("defaults the input index to an empty frozen index", () => {
    const snapshot = buildValidationSnapshot(minimalInput());

    expect(snapshot.projectRecordIndex).toEqual({});
    expect(Object.isFrozen(snapshot.projectRecordIndex)).toBe(true);
  });

  it("keeps compiler output byte-identical when only the project index changes", () => {
    const withSmallIndex = compilePrompt(buildValidationSnapshot(minimalInput({ a: "ENTITY" })));
    const withLargeIndex = compilePrompt(
      buildValidationSnapshot(
        minimalInput({
          a: "ENTITY",
          b: "LOCATION",
          c: "CAST MEMBER"
        })
      )
    );

    expect(withLargeIndex.prompt).toBe(withSmallIndex.prompt);
    expect(withLargeIndex.metadata.fingerprint).toBe(withSmallIndex.metadata.fingerprint);
  });

  it("does not count the project index toward prompt-middle salience risk", () => {
    const largeIndex = Object.fromEntries(
      Array.from({ length: 300 }, (_, index) => [
        `019b0298-5c00-7000-8000-${String(index).padStart(12, "0")}`,
        "ENTITY"
      ])
    );
    const snapshot = buildValidationSnapshot(minimalInput(largeIndex));
    const result = runValidation(snapshot, warningRules);

    expect(JSON.stringify(snapshot).length).toBeGreaterThan(5000);
    expect(result.warnings.map((warning) => warning.code)).not.toContain(DIAGNOSTIC_CODES.promptMiddleSalienceRisk);
  });

  it("is deterministic for identical snapshot inputs", () => {
    const first = buildValidationSnapshot(minimalInput({ b: "LOCATION", a: "ENTITY" }));
    const second = buildValidationSnapshot(minimalInput({ b: "LOCATION", a: "ENTITY" }));

    expect(second).toEqual(first);
  });
});
