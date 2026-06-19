import { describe, expect, it } from "vitest";

import {
  assertCanonical,
  generationBriefFieldPaths,
  storyConfigFieldPaths
} from "../src/index.js";

describe("guidance coverage sources", () => {
  it("enumerates story-config field paths from core schemas", () => {
    const paths = storyConfigFieldPaths();

    expect(paths).not.toContain(`STORY CONTRACT.${"prose" + "_preferences"}.psychic_distance`);
    expect(paths).toContain("UNIVERSAL CONTENT POLICY.allowed_content_scope");
    expect(paths).toContain("PROSE MODE.pov_character");
    expect(paths).not.toContain(`STORY CONTRACT.${"prose" + "_preferences"}.0`);
    expectCanonicalPaths(paths);
  });

  it("enumerates generation-brief field paths from the full core schema", () => {
    const paths = generationBriefFieldPaths();

    expect(paths).toContain("GENERATION BRIEF.manual_moment_directive.must_render[]");
    expect(paths).toContain("GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure");
    expect(paths).toContain("GENERATION BRIEF.immediate_handoff.begin_after");
    expect(paths).toContain("GENERATION BRIEF.manual_moment_directive.do_not_force[]");
    expect(paths).toContain("GENERATION BRIEF.current_authoritative_state.consent_or_force_conditions");
    expect(paths).not.toContain("GENERATION BRIEF.current_cast_voice_pressure.0.current_voice_pressure");
    expectCanonicalPaths(paths);
  });
});

function expectCanonicalPaths(paths: readonly string[]): void {
  for (const path of paths) {
    expect(() => assertCanonical(path)).not.toThrow();
  }
}
