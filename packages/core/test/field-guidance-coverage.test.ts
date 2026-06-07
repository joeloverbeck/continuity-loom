import { describe, expect, it } from "vitest";

import {
  assertCanonical,
  castMemberSectionModel,
  generationBriefFieldPaths,
  getFieldGuidance,
  GUIDANCE_REGISTRY,
  recordEditorDescriptors,
  storyConfigFieldPaths,
  validatePromptDestinations
} from "../src/index.js";
import type { FieldGuidance } from "../src/index.js";
import { enumerateCanonicalPaths } from "../src/records/field-path-enumeration.js";

const highImplicationEnumPaths = [
  "STORY CONTRACT.content_intensity",
  "STORY CONTRACT.prose_preferences.psychic_distance",
  "STORY CONTRACT.prose_preferences.dialogue_density",
  "STORY CONTRACT.prose_preferences.interiority",
  "PROSE MODE.person",
  "PROSE MODE.psychic_distance",
  "PROSE MODE.interiority_mode",
  "PROSE MODE.dialogue_density",
  "SECRET.reveal_permission",
  "SECRET.pov_access",
  "SECRET.audience_visibility",
  "FACT.audience_visibility",
  "EMOTION.behavioral_pressure[]",
  "CAST MEMBER.sample_utterances[].copy_policy",
  "ENTITY STATUS.life",
  "ENTITY STATUS.agency",
  "ENTITY STATUS.visibility_to_pov",
  "OBJECT.visibility_to_pov",
  "OBJECT.durability",
  "VISIBLE AFFORDANCE.durability"
];

describe("field guidance coverage", () => {
  it("covers every field path across story config, generation brief, records, and cast emphasis", () => {
    const paths = allCoveredFieldPaths();

    for (const path of paths) {
      expect(() => assertCanonical(path), path).not.toThrow();
      expect(getFieldGuidance(path), path).toBeDefined();
    }
  });

  it("uses valid prompt destinations catalog-wide", () => {
    for (const guidance of allGuidance()) {
      expect(validatePromptDestinations(guidance), guidance.fieldPath).toEqual([]);
    }
  });

  it("carries enum guidance for every high-implication enum", () => {
    for (const path of highImplicationEnumPaths) {
      expect(Object.keys(getFieldGuidance(path)?.enumValues ?? {}).length, path).toBeGreaterThan(0);
    }
  });
});

function allCoveredFieldPaths(): readonly string[] {
  const recordPaths = Object.entries(recordEditorDescriptors).flatMap(([recordType, descriptor]) =>
    enumerateCanonicalPaths(recordType, descriptor.fields)
  );
  const castEmphasisPaths = castMemberSectionModel().flatMap((section) =>
    (section.emphasisFieldPaths ?? []).map((path) => `CAST MEMBER.${path}[]`)
  );

  return [
    ...storyConfigFieldPaths(),
    ...generationBriefFieldPaths(),
    ...recordPaths,
    ...castEmphasisPaths
  ];
}

function allGuidance(): readonly FieldGuidance[] {
  return Array.from(GUIDANCE_REGISTRY.values());
}
