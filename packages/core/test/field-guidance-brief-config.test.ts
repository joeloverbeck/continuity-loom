import { describe, expect, it } from "vitest";

import {
  generationBriefFieldPaths,
  getFieldGuidance,
  storyConfigFieldPaths,
  validatePromptDestinations
} from "../src/index.js";
import { briefConfigGuidance } from "../src/records/field-guidance-brief-config.js";

describe("field guidance for brief and story config", () => {
  it("covers every story-config and generation-brief schema path", () => {
    for (const path of [...storyConfigFieldPaths(), ...generationBriefFieldPaths()]) {
      expect(getFieldGuidance(path), path).toBeDefined();
    }
  });

  it("uses only valid prompt destinations", () => {
    for (const entry of briefConfigGuidance) {
      expect(validatePromptDestinations(entry), entry.fieldPath).toEqual([]);
    }
  });

  it("keeps validation-focus tags validation-only", () => {
    for (const entry of briefConfigGuidance.filter((guidance) =>
      guidance.fieldPath.startsWith("GENERATION BRIEF.generation_validation_focus.validation_focus_tags.")
    )) {
      expect(entry.promptFacing, entry.fieldPath).toBe("never");
      expect(entry.promptDestinations, entry.fieldPath).toEqual([]);
    }
  });

  it("gives high-risk handoff, directive, and stop fields examples and anti-examples", () => {
    for (const path of [
      "GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note",
      "GENERATION BRIEF.manual_moment_directive.must_render[]",
      "GENERATION BRIEF.stop_guidance.soft_unit_guidance"
    ]) {
      const entry = getFieldGuidance(path);

      expect(entry?.examples?.length, path).toBeGreaterThan(0);
      expect(entry?.antiExamples?.length, path).toBeGreaterThan(0);
    }
  });
});
