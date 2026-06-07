import { describe, expect, it } from "vitest";

import {
  getFieldGuidance,
  recordEditorDescriptors,
  validatePromptDestinations
} from "../src/index.js";
import { enumerateCanonicalPaths } from "../src/records/field-path-enumeration.js";
import { recordGuidance } from "../src/records/field-guidance-records.js";

const recordTypes = [
  "FACT",
  "BELIEF",
  "SECRET",
  "EVENT",
  "INTENTION",
  "PLAN",
  "CLOCK",
  "OBLIGATION",
  "CONSEQUENCE",
  "OPEN THREAD",
  "RELATIONSHIP",
  "EMOTION"
] as const;

describe("field guidance for knowledge, pressure, relationship, and emotion records", () => {
  it("covers every descriptor field path for in-scope record types", () => {
    for (const recordType of recordTypes) {
      const descriptor = recordEditorDescriptors[recordType];
      const paths = enumerateCanonicalPaths(recordType, descriptor!.fields);

      for (const path of paths) {
        expect(getFieldGuidance(path), path).toBeDefined();
      }
    }
  });

  it("provides required enum value guidance", () => {
    expect(Object.keys(getFieldGuidance("SECRET.reveal_permission")?.enumValues ?? {}).sort()).toEqual([
      "clue_only",
      "directive_required",
      "locked",
      "natural_reveal_allowed"
    ]);
    expect(Object.keys(getFieldGuidance("SECRET.pov_access")?.enumValues ?? {}).sort()).toEqual([
      "can_suspect",
      "hidden",
      "knows",
      "knows_partly"
    ]);
    expect(Object.keys(getFieldGuidance("SECRET.audience_visibility")?.enumValues ?? {}).sort()).toEqual([
      "ambiguous",
      "explicit",
      "hidden",
      "implied"
    ]);
    expect(Object.keys(getFieldGuidance("FACT.audience_visibility")?.enumValues ?? {}).sort()).toEqual([
      "explicit",
      "hidden",
      "implied",
      "not_applicable"
    ]);

    const emotionValues = getFieldGuidance("EMOTION.behavioral_pressure[]")?.enumValues ?? {};
    for (const value of ["accommodate", "self_soothe", "ruminate", "withdraw_socially"]) {
      expect(emotionValues[value], value).toBeDefined();
    }
  });

  it("uses only valid prompt destinations", () => {
    for (const entry of recordGuidance) {
      expect(validatePromptDestinations(entry), entry.fieldPath).toEqual([]);
    }
  });
});
