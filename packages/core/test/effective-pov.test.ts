import { describe, expect, it } from "vitest";

import {
  buildValidationSnapshot,
  resolveEffectivePov
} from "../src/index.js";

const povId = "019b0298-5c00-7000-8000-000000000001";
const otherPovId = "019b0298-5c00-7000-8000-000000000002";

describe("resolveEffectivePov", () => {
  it.each([
    ["variable with selected id", "variable", povId, povId],
    ["variable with selected omniscient", "variable", "omniscient", "omniscient"],
    ["variable without selection", "variable", undefined, undefined],
    ["fixed id without selection", povId, undefined, povId],
    ["fixed id with matching selection", povId, povId, povId],
    ["fixed id with divergent selection", povId, otherPovId, povId],
    ["omniscient without selection", "omniscient", undefined, "omniscient"],
    ["omniscient with matching selection", "omniscient", "omniscient", "omniscient"],
    ["omniscient with concrete selection", "omniscient", povId, "omniscient"]
  ] as const)("resolves %s", (_label, prosePov, selectedPov, expected) => {
    expect(resolveEffectivePov(snapshot(prosePov, selectedPov))).toBe(expected);
  });
});

function snapshot(
  prosePov: string,
  selectedPov: string | undefined
) {
  return buildValidationSnapshot({
    records: [],
    generationSession: {
      active_working_set: {
        selected_records: [],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        ...(selectedPov === undefined ? {} : { selected_pov: selectedPov })
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {
      proseMode: {
        pov_character: prosePov,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: { template: "1", compiler: "1", contract: "1" }
  });
}
