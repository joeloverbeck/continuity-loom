import { describe, expect, it } from "vitest";

import {
  applyConsumedGenerationGuidanceRemoval,
  listConsumedGenerationGuidance,
  type GenerationSessionDraft
} from "../src/index.js";

const castId = "019f9000-0000-7000-8000-000000000001";

describe("Accepted-Segment Change Review consumed guidance", () => {
  it("lists only nonblank values from the exact allowlist with nothing preselected", () => {
    const entries = listConsumedGenerationGuidance(fullDraft());

    expect(entries.map((entry) => entry.fieldPath)).toEqual([
      "manual_moment_directive.must_render[]",
      "manual_moment_directive.may_render_if_naturally_caused[]",
      "manual_moment_directive.do_not_force[]",
      "current_cast_voice_pressure[]",
      "cast_voice_overrides[]",
      "generation_validation_focus.validation_focus_tags.expected_local_modes[]",
      "generation_validation_focus.validation_focus_tags.possible_durable_changes[]",
      "stop_guidance.soft_unit_guidance"
    ]);
    expect(entries.every((entry) => entry.value.trim().length > 0)).toBe(true);
    expect(entries.every((entry) => !("selected" in entry))).toBe(true);
    expect(entries.map((entry) => entry.fieldPath)).not.toContain("generation_context");
    expect(entries.map((entry) => entry.fieldPath)).not.toContain("active_working_set");
    expect(entries.map((entry) => entry.fieldPath)).not.toContain("current_authoritative_state");
    expect(entries.map((entry) => entry.fieldPath)).not.toContain("immediate_handoff");
  });

  it("removes only explicitly selected entries from an editable clone", () => {
    const original = fullDraft();
    const entries = listConsumedGenerationGuidance(original);
    const selectedIds = entries
      .filter((entry) => [
        "manual_moment_directive.must_render[]",
        "current_cast_voice_pressure[]",
        "generation_validation_focus.validation_focus_tags.possible_durable_changes[]",
        "stop_guidance.soft_unit_guidance"
      ].includes(entry.fieldPath))
      .map((entry) => entry.id);

    const updated = applyConsumedGenerationGuidanceRemoval(original, selectedIds);

    expect(updated).not.toBe(original);
    expect(updated.manual_moment_directive).toEqual({
      must_render: [""],
      may_render_if_naturally_caused: ["Let the bell interrupt naturally."],
      do_not_force: ["Do not reveal the caller."]
    });
    expect(updated.current_cast_voice_pressure).toEqual([{ cast_member_id: castId }]);
    expect(updated.cast_voice_overrides).toEqual(original.cast_voice_overrides);
    expect(updated.generation_validation_focus?.validation_focus_tags).toEqual({
      generation_context: ["continuation_after_accepted_segment"],
      expected_local_modes: ["dialogue_expected"],
      possible_durable_changes: []
    });
    expect(updated.stop_guidance).toEqual({ soft_unit_guidance: "" });
    expect(updated.active_working_set).toEqual(original.active_working_set);
    expect(updated.current_authoritative_state).toEqual(original.current_authoritative_state);
    expect(updated.immediate_handoff).toEqual(original.immediate_handoff);
    expect(original.current_cast_voice_pressure?.[0]).toHaveProperty("current_voice_pressure", "Clipped and wary.");
  });
});

function fullDraft(): GenerationSessionDraft {
  return {
    active_working_set: {
      selected_records: [castId],
      selected_pov: castId
    },
    current_authoritative_state: {
      current_time: "Third watch",
      current_location: "North stair",
      immediate_situation_summary: "The caller waits below."
    },
    immediate_handoff: {
      recent_causal_context: "A bell rang once.",
      begin_after: "Begin with the reply."
    },
    manual_moment_directive: {
      must_render: ["Open the door.", ""],
      may_render_if_naturally_caused: ["Let the bell interrupt naturally."],
      do_not_force: ["Do not reveal the caller."]
    },
    current_cast_voice_pressure: [{
      cast_member_id: castId,
      current_voice_pressure: "Clipped and wary."
    }],
    cast_voice_overrides: [{
      cast_member_id: castId,
      reason: "Immediate danger.",
      applies_to: ["dialogue"],
      override_text: "Use shorter answers."
    }],
    generation_validation_focus: {
      validation_focus_tags: {
        generation_context: ["continuation_after_accepted_segment"],
        expected_local_modes: ["dialogue_expected"],
        possible_durable_changes: ["location_change_possible"]
      }
    },
    stop_guidance: { soft_unit_guidance: "Stop after the reply." }
  };
}
