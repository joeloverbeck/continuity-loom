import { describe, expect, it } from "vitest";

import {
  castMemberSectionModel,
  getFieldGuidance,
  recordEditorDescriptors,
  validatePromptDestinations
} from "../src/index.js";
import { enumerateCanonicalPaths } from "../src/records/field-path-enumeration.js";
import { castMaterialGuidance } from "../src/records/field-guidance-cast-material.js";

const materialRecordTypes = ["ENTITY", "ENTITY STATUS", "LOCATION", "OBJECT", "VISIBLE AFFORDANCE"] as const;

describe("field guidance for cast, entity, and material records", () => {
  it("covers every CAST MEMBER descriptor path and cast-section emphasis path", () => {
    for (const path of enumerateCanonicalPaths("CAST MEMBER", recordEditorDescriptors["CAST MEMBER"].fields)) {
      expect(getFieldGuidance(path), path).toBeDefined();
    }

    for (const section of castMemberSectionModel()) {
      for (const field of section.fields) {
        for (const path of enumerateCanonicalPaths("CAST MEMBER", [field])) {
          expect(getFieldGuidance(path), `${section.id}:${path}`).toBeDefined();
        }
      }

      for (const emphasisPath of section.emphasisFieldPaths ?? []) {
        const canonicalPath = `CAST MEMBER.${emphasisPath}[]`;
        expect(getFieldGuidance(canonicalPath), `${section.id}:${canonicalPath}`).toBeDefined();
      }
    }
  });

  it("covers every entity and material descriptor path", () => {
    for (const recordType of materialRecordTypes) {
      for (const path of enumerateCanonicalPaths(recordType, recordEditorDescriptors[recordType].fields)) {
        expect(getFieldGuidance(path), path).toBeDefined();
      }
    }
  });

  it("provides required enum value guidance", () => {
    expect(Object.keys(getFieldGuidance("CAST MEMBER.sample_utterances[].copy_policy")?.enumValues ?? {}).sort())
      .toEqual(["canonical_phrase", "may_reuse_cadence_not_text", "never_copy_verbatim"]);
    expect(Object.keys(getFieldGuidance("OBJECT.visibility_to_pov")?.enumValues ?? {}).sort()).toEqual([
      "hidden",
      "inferred",
      "unknown",
      "visible"
    ]);
    expect(Object.keys(getFieldGuidance("OBJECT.durability")?.enumValues ?? {}).sort()).toEqual([
      "continuity_relevant",
      "local_texture",
      "major"
    ]);
    expect(Object.keys(getFieldGuidance("VISIBLE AFFORDANCE.durability")?.enumValues ?? {}).sort()).toEqual([
      "durable_state_change",
      "irreversible",
      "local",
      "reversible_state_change"
    ]);
    expect(Object.keys(getFieldGuidance("ENTITY STATUS.life")?.enumValues ?? {}).sort()).toEqual([
      "alive",
      "dead",
      "not_applicable",
      "unknown"
    ]);
    expect(Object.keys(getFieldGuidance("ENTITY STATUS.agency")?.enumValues ?? {}).sort()).toEqual([
      "captive",
      "coerced",
      "constrained",
      "free",
      "incapacitated",
      "not_applicable",
      "unconscious",
      "unknown"
    ]);
    expect(Object.keys(getFieldGuidance("ENTITY STATUS.visibility_to_pov")?.enumValues ?? {}).sort()).toEqual([
      "audible",
      "hidden",
      "inferred",
      "not_applicable",
      "visible"
    ]);
  });

  it("uses only valid prompt destinations", () => {
    for (const entry of castMaterialGuidance) {
      expect(validatePromptDestinations(entry), entry.fieldPath).toEqual([]);
    }
  });
});
