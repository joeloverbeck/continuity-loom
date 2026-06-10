import {
  buildValidationSnapshot,
  type BuildValidationSnapshotInput,
  type ValidationSnapshot
} from "../src/index.js";
import { classifyReference } from "../src/validation/reference-classification.js";
import { describe, expect, it } from "vitest";

const selectedId = "019b0298-5c00-7000-8000-000000000201";
const unselectedId = "019b0298-5c00-7000-8000-000000000202";
const danglingId = "019b0298-5c00-7000-8000-000000000203";

function snapshot(): ValidationSnapshot {
  const input: BuildValidationSnapshotInput = {
    records: [
      {
        id: selectedId,
        type: "CAST MEMBER",
        payload: {}
      }
    ],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    },
    projectRecordIndex: {
      [selectedId]: "CAST MEMBER",
      [unselectedId]: "LOCATION"
    }
  };

  return buildValidationSnapshot(input);
}

describe("classifyReference", () => {
  it("classifies selected, unselected, and dangling references", () => {
    const validationSnapshot = snapshot();

    expect(classifyReference(validationSnapshot, selectedId)).toEqual({
      classification: "selected",
      actualType: "CAST MEMBER",
      typeMatches: true
    });
    expect(classifyReference(validationSnapshot, unselectedId)).toEqual({
      classification: "unselected",
      actualType: "LOCATION",
      typeMatches: true
    });
    expect(classifyReference(validationSnapshot, danglingId)).toEqual({
      classification: "dangling",
      actualType: undefined,
      typeMatches: true
    });
  });

  it("uses selected records as the actual-type authority for selected ids", () => {
    const validationSnapshot = buildValidationSnapshot({
      ...snapshotInputBase(),
      records: [
        {
          id: selectedId,
          type: "ENTITY",
          payload: {}
        }
      ],
      projectRecordIndex: {
        [selectedId]: "LOCATION"
      }
    });

    expect(classifyReference(validationSnapshot, selectedId, ["ENTITY"])).toEqual({
      classification: "selected",
      actualType: "ENTITY",
      typeMatches: true
    });
  });

  it("checks expected type sets for resolved references", () => {
    const validationSnapshot = snapshot();

    expect(classifyReference(validationSnapshot, selectedId, ["ENTITY", "CAST MEMBER"]).typeMatches).toBe(true);
    expect(classifyReference(validationSnapshot, selectedId, ["LOCATION"]).typeMatches).toBe(false);
    expect(classifyReference(validationSnapshot, unselectedId, ["LOCATION"]).typeMatches).toBe(true);
    expect(classifyReference(validationSnapshot, unselectedId, ["CAST MEMBER"]).typeMatches).toBe(false);
    expect(classifyReference(validationSnapshot, danglingId, ["ENTITY"]).typeMatches).toBe(false);
  });

  it("does not require a type match when no expected types are supplied", () => {
    const validationSnapshot = snapshot();

    expect(classifyReference(validationSnapshot, danglingId).typeMatches).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const validationSnapshot = snapshot();

    expect(classifyReference(validationSnapshot, unselectedId, ["LOCATION"])).toEqual(
      classifyReference(validationSnapshot, unselectedId, ["LOCATION"])
    );
  });
});

function snapshotInputBase(): BuildValidationSnapshotInput {
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
