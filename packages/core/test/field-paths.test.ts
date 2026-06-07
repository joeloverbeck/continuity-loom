import { describe, expect, it } from "vitest";

import {
  assertCanonical,
  buildFieldPath,
  isCanonicalFieldPath,
  normalizeListIndices
} from "../src/index.js";

describe("field paths", () => {
  it("builds canonical paths for story config, brief, and cast fields", () => {
    expect(buildFieldPath("STORY CONTRACT", [
      { name: "prose_preferences" },
      { name: "psychic_distance" }
    ])).toBe("STORY CONTRACT.prose_preferences.psychic_distance");

    expect(buildFieldPath("GENERATION BRIEF", [
      { name: "manual_moment_directive" },
      { name: "must_render", list: true }
    ])).toBe("GENERATION BRIEF.manual_moment_directive.must_render[]");

    expect(buildFieldPath("CAST MEMBER", [
      { name: "voice_anchor" },
      { name: "must_preserve", list: true }
    ])).toBe("CAST MEMBER.voice_anchor.must_preserve[]");

    expect(buildFieldPath("GENERATION BRIEF", [
      { name: "current_cast_voice_pressure", list: true },
      { name: "current_voice_pressure" }
    ])).toBe("GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure");
  });

  it("normalizes runtime list indices and leaves canonical paths unchanged", () => {
    expect(normalizeListIndices("IMMEDIATE_HANDOFF.must_render.0")).toBe("IMMEDIATE_HANDOFF.must_render[]");
    expect(normalizeListIndices("GENERATION BRIEF.current_cast_voice_pressure.2.current_voice_pressure")).toBe(
      "GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure"
    );
    expect(normalizeListIndices("GENERATION BRIEF.manual_moment_directive.must_render[]")).toBe(
      "GENERATION BRIEF.manual_moment_directive.must_render[]"
    );
    expect(normalizeListIndices(normalizeListIndices("X.0.y.12.z"))).toBe("X[].y[].z");
  });

  it("identifies and rejects numeric, array-index, and DOM-id paths", () => {
    expect(isCanonicalFieldPath("GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure")).toBe(true);
    expect(isCanonicalFieldPath("GENERATION BRIEF.current_cast_voice_pressure.0.current_voice_pressure")).toBe(false);
    expect(isCanonicalFieldPath("GENERATION BRIEF.current_cast_voice_pressure[0].current_voice_pressure")).toBe(false);
    expect(isCanonicalFieldPath("GENERATION BRIEF.field-rhf-123.current_voice_pressure")).toBe(false);

    expect(() => assertCanonical("GENERATION BRIEF.current_cast_voice_pressure.0.current_voice_pressure")).toThrow(
      /Non-canonical field path/
    );
  });
});
