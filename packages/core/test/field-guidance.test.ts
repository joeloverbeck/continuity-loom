import { describe, expect, it } from "vitest";

import {
  buildGuidanceRegistry,
  getFieldGuidance,
  validatePromptDestinations,
  type FieldGuidance
} from "../src/index.js";

function guidance(overrides: Partial<FieldGuidance> = {}): FieldGuidance {
  return {
    fieldPath: "GENERATION BRIEF.manual_moment_directive.must_render[]",
    surface: "generation_brief",
    ownerKind: "GENERATION BRIEF",
    short: "Required local pressure to render.",
    promptFacing: "always",
    ...overrides
  };
}

describe("field guidance", () => {
  it("validates prompt placeholder and compile-family destinations", () => {
    expect(validatePromptDestinations(guidance({
      promptDestinations: ["{manual_must_render}", "rich_active_cast_dossiers"]
    }))).toEqual([]);

    expect(validatePromptDestinations(guidance({
      promptDestinations: ["{not_a_placeholder}", "bogus_family"]
    }))).toEqual(["{not_a_placeholder}", "bogus_family"]);

    expect(validatePromptDestinations(guidance({
      promptFacing: "never",
      promptDestinations: []
    }))).toEqual([]);
  });

  it("looks up guidance after normalizing runtime list indices", () => {
    const entry = guidance();
    const registry = buildGuidanceRegistry([entry]);

    expect(getFieldGuidance("GENERATION BRIEF.manual_moment_directive.must_render.0", registry)).toBe(entry);
  });

  it("rejects duplicate and non-canonical field paths while building a registry", () => {
    const entry = guidance();

    expect(() => buildGuidanceRegistry([entry, entry])).toThrow(/Duplicate field guidance path/);
    expect(() => buildGuidanceRegistry([
      guidance({ fieldPath: "GENERATION BRIEF.manual_moment_directive.must_render.0" })
    ])).toThrow(/Non-canonical field path/);
  });
});
