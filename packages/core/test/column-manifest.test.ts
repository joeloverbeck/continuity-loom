import { describe, expect, it } from "vitest";

import {
  allTypesColumns,
  compareSeverityDesc,
  getAdditionalColumnKeys,
  getColumnManifest,
  getEditorDescriptor,
  projectDisplayValues,
  recordColumnManifest,
  recordTypes,
  severityOrdinal
} from "../src/index.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

describe("record column manifest", () => {
  it("has exactly one entry for every record type", () => {
    expect(Object.keys(recordColumnManifest).sort()).toEqual([...recordTypes].sort());
    expect(getColumnManifest("EMOTION")?.primaryLabelHeader).toBe("Description");
    expect(getColumnManifest("UNKNOWN")).toBeUndefined();
  });

  it("declares additional fields that exist on each editor descriptor", () => {
    for (const recordType of recordTypes) {
      const descriptor = getEditorDescriptor(recordType);
      const fieldNames = new Set(descriptor?.fields.map((field) => field.name) ?? []);
      const columns = getColumnManifest(recordType)?.additionalColumns ?? [];

      expect(descriptor, recordType).toBeDefined();
      expect(columns, recordType).not.toContainEqual(expect.objectContaining({ fieldKey: "id" }));

      for (const column of columns) {
        expect(fieldNames.has(column.fieldKey), `${recordType}.${column.fieldKey}`).toBe(true);
      }
    }
  });

  it("exports the minimal all-types data columns", () => {
    expect(allTypesColumns.map((column) => column.fieldKey)).toEqual(["type", "displayLabel", "status", "updatedAt"]);
    expect(allTypesColumns.map((column) => column.header)).toEqual(["Type", "Label", "Status", "Updated"]);
  });

  it("projects scalar and ordinal display values from payloads", () => {
    expect(
      projectDisplayValues("EMOTION", {
        id: idA,
        status: "active",
        holder: idB,
        description: "Mara is furious that the door was sealed.",
        affect_kind: "anger",
        intensity: "high",
        behavioral_pressure: ["attack", "reject"],
        visibility: "visible",
        surface_expression: "Her hands shake against the latch."
      })
    ).toEqual({
      status: "active",
      affect_kind: "anger",
      intensity: "high",
      visibility: "visible"
    });

    expect(
      projectDisplayValues("FACT", {
        id: idA,
        status: "active",
        fact_kind: "current_state",
        statement: "The cellar key is missing.",
        scope: "object",
        known_by: "unknown",
        audience_visibility: "explicit",
        salience: "critical"
      })
    ).toEqual({
      status: "active",
      fact_kind: "current_state",
      scope: "object",
      salience: "critical",
      audience_visibility: "explicit"
    });
  });

  it("join-formats array columns and emits null for absent optional values", () => {
    expect(
      projectDisplayValues("ENTITY", {
        id: idA,
        display_name: "Mara",
        entity_kind: "person",
        roles_in_story: ["viewpoint", "primary_actor"],
        short_description: "A locksmith."
      })
    ).toEqual({
      entity_kind: "person",
      roles_in_story: "viewpoint, primary_actor"
    });

    expect(
      projectDisplayValues("CAST MEMBER", {
        entity_id: idA,
        identity: {
          one_line: "A guarded locksmith.",
          public_face: "Composed",
          private_pressure: "Furious"
        },
        voice_anchor: {
          core_voice: "precise",
          rhythm_and_syntax: "short",
          register_and_diction: "plain",
          vocabulary_and_metaphor_pools: "locks",
          profanity_and_intensity: "low",
          taboo_and_avoidance_patterns: "family",
          dialogue_tactics_and_speech_functions: "deflects",
          address_terms_and_naming: "names only",
          silence_interruption_and_turntaking: "interrupts rarely",
          under_pressure_voice: "clipped",
          suppression_or_evasion_rule: "changes topic",
          must_preserve: ["precision"],
          must_avoid: ["generic softness"],
          anti_repetition_warnings: ["do not repeat lock metaphors"]
        },
        pressure_behavior_core: {
          cornered: "narrows her options",
          tempted_or_offered_power: "asks the price",
          protecting_attachment: "gets blunt"
        },
        body_presence_core: {
          physicality: "still",
          habitual_gestures_or_presence: "checks exits",
          social_presentation: "contained"
        },
        agency_core: {
          default_strategy: "delay",
          risk_style: "calculated"
        }
      })
    ).toEqual({});
  });

  it("keeps severity ordering explicit and descending", () => {
    expect(severityOrdinal).toMatchObject({
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
      extreme: 4
    });
    expect(compareSeverityDesc("critical", "low")).toBeLessThan(0);
    expect(compareSeverityDesc("low", "critical")).toBeGreaterThan(0);
    expect(compareSeverityDesc("medium", "medium")).toBe(0);
  });

  it("exposes additional column keys in manifest order", () => {
    expect(getAdditionalColumnKeys("OPEN THREAD")).toEqual(["status", "type", "urgency", "current_relevance"]);
    expect(getColumnManifest("OPEN THREAD")?.additionalColumns.find((column) => column.fieldKey === "type")?.header).toBe(
      "Thread kind"
    );
  });
});
