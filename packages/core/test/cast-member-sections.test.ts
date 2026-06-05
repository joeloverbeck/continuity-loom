import { describe, expect, it } from "vitest";

import { castMemberSectionModel, getEditorDescriptor } from "../src/index.js";

describe("CAST MEMBER section model", () => {
  it("places every CAST MEMBER descriptor field exactly once", () => {
    const descriptorFields = getEditorDescriptor("CAST MEMBER")?.fields.map((field) => field.name) ?? [];
    const sectionFields = castMemberSectionModel().flatMap((section) => section.fields.map((field) => field.name));

    expect(sectionFields).toHaveLength(descriptorFields.length);
    expect(new Set(sectionFields).size).toBe(sectionFields.length);
    expect([...sectionFields].sort()).toEqual([...descriptorFields].sort());
  });

  it("orders sections and fields in core-first render order", () => {
    const sections = castMemberSectionModel();

    expect(sections.map((section) => section.id)).toEqual([
      "identity",
      "durable_voice_anchor",
      "voice_extended_speech_pattern",
      "pressure_behavior",
      "body_and_presence",
      "agency_and_planning",
      "world_pressure_relational_moral_edge",
      "perception_and_embodiment",
      "sample_utterances",
      "anti_generic_and_anti_repetition_warnings"
    ]);

    expect(sections.flatMap((section) => section.fields.map((field) => field.name))).toEqual([
      "entity_id",
      "identity",
      "voice_anchor",
      "voice_extended",
      "pressure_behavior_core",
      "pressure_behavior_extended",
      "body_presence_core",
      "body_and_presence_extended",
      "agency_core",
      "agency_and_planning_extended",
      "world_pressure_core",
      "relational_charge",
      "moral_psychological_edge",
      "perception_and_embodiment",
      "sample_utterances"
    ]);
  });

  it("keeps warning fields nested inside their parent voice groups", () => {
    const fieldsByName = new Map(
      castMemberSectionModel()
        .flatMap((section) => section.fields)
        .map((field) => [field.name, field])
    );
    const warningCue = castMemberSectionModel().find((section) => section.id === "anti_generic_and_anti_repetition_warnings");

    expect(fieldsByName.get("voice_anchor")?.fields?.map((field) => field.name)).toContain(
      "anti_repetition_warnings"
    );
    expect(fieldsByName.get("voice_extended")?.fields?.map((field) => field.name)).toContain(
      "anti_generic_warnings"
    );
    expect(warningCue?.fields).toEqual([]);
    expect(warningCue?.emphasisFieldPaths).toEqual([
      "voice_anchor.anti_repetition_warnings",
      "voice_extended.anti_generic_warnings"
    ]);
  });
});
