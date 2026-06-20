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

  it("classifies generation-brief requiredness from the compiler contract", () => {
    const cases = {
      always: [
        "GENERATION BRIEF.current_authoritative_state.current_time",
        "GENERATION BRIEF.current_authoritative_state.current_location",
        "GENERATION BRIEF.current_authoritative_state.onstage_entities[]",
        "GENERATION BRIEF.current_authoritative_state.immediate_situation_summary",
        "GENERATION BRIEF.manual_moment_directive.must_render[]"
      ],
      continuation: [
        "GENERATION BRIEF.immediate_handoff.recent_causal_context",
        "GENERATION BRIEF.immediate_handoff.last_visible_moment",
        "GENERATION BRIEF.immediate_handoff.begin_after"
      ],
      conditional: [
        "GENERATION BRIEF.current_authoritative_state.offstage_pressuring_entities[]",
        "GENERATION BRIEF.current_authoritative_state.positions",
        "GENERATION BRIEF.current_authoritative_state.possessions",
        "GENERATION BRIEF.current_authoritative_state.visible_conditions[]",
        "GENERATION BRIEF.current_authoritative_state.environmental_conditions",
        "GENERATION BRIEF.current_authoritative_state.entity_statuses",
        "GENERATION BRIEF.current_authoritative_state.line_of_sight_and_visibility",
        "GENERATION BRIEF.current_authoritative_state.pov_cannot_perceive_now",
        "GENERATION BRIEF.current_authoritative_state.routes_and_exits[]",
        "GENERATION BRIEF.current_authoritative_state.available_time",
        "GENERATION BRIEF.current_authoritative_state.consent_or_force_conditions",
        "GENERATION BRIEF.current_authoritative_state.current_locks[]"
      ],
      optional: [
        "GENERATION BRIEF.stop_guidance.soft_unit_guidance",
        "GENERATION BRIEF.manual_moment_directive.may_render_if_naturally_caused[]",
        "GENERATION BRIEF.manual_moment_directive.do_not_force[]",
        "GENERATION BRIEF.active_working_set.selected_records[]",
        "GENERATION BRIEF.active_working_set.active_onstage_cast_full[].cast_member_id",
        "GENERATION BRIEF.active_working_set.active_onstage_cast_full[].local_function",
        "GENERATION BRIEF.active_working_set.present_minor_cast_compressed[]",
        "GENERATION BRIEF.active_working_set.offstage_relevant_cast[]",
        "GENERATION BRIEF.active_working_set.selected_pov",
        "GENERATION BRIEF.current_cast_voice_pressure[].cast_member_id",
        "GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure",
        "GENERATION BRIEF.current_cast_voice_pressure[].dialogue_pressure",
        "GENERATION BRIEF.current_cast_voice_pressure[].pov_narration_pressure",
        "GENERATION BRIEF.current_cast_voice_pressure[].nonverbal_or_silence_pressure",
        "GENERATION BRIEF.current_cast_voice_pressure[].current_must_preserve[]",
        "GENERATION BRIEF.current_cast_voice_pressure[].current_must_avoid[]",
        "GENERATION BRIEF.cast_voice_overrides[].cast_member_id",
        "GENERATION BRIEF.cast_voice_overrides[].reason",
        "GENERATION BRIEF.cast_voice_overrides[].applies_to[]",
        "GENERATION BRIEF.cast_voice_overrides[].override_text",
        "GENERATION BRIEF.generation_validation_focus.validation_focus_tags.generation_context[]",
        "GENERATION BRIEF.generation_validation_focus.validation_focus_tags.expected_local_modes[]",
        "GENERATION BRIEF.generation_validation_focus.validation_focus_tags.possible_durable_changes[]"
      ]
    } as const;

    for (const [requiredness, paths] of Object.entries(cases)) {
      for (const path of paths) {
        expect(getFieldGuidance(path)?.requiredness, path).toBe(requiredness);
      }
    }
  });

  it("keeps requiredness unpopulated outside the generation-brief surface", () => {
    expect(getFieldGuidance("STORY CONTRACT.title")?.requiredness).toBeUndefined();
  });

  it("adds requiredness notes for continuation either-or handoff fields", () => {
    expect(getFieldGuidance("GENERATION BRIEF.immediate_handoff.last_visible_moment")?.requirednessNote).toContain(
      "this or begin_after"
    );
    expect(getFieldGuidance("GENERATION BRIEF.immediate_handoff.begin_after")?.requirednessNote).toContain(
      "this or last_visible_moment"
    );
  });

  it("distinguishes state snapshot guidance from causal handoff guidance", () => {
    const state = getFieldGuidance("GENERATION BRIEF.current_authoritative_state.immediate_situation_summary");
    const handoff = getFieldGuidance("GENERATION BRIEF.immediate_handoff.recent_causal_context");

    expect(state?.authoringAdvice).toContain("what is true at the start");
    expect(state?.antiExamples?.join(" ")).toContain("why they are arguing now");
    expect(state?.relatedFields).toContain("GENERATION BRIEF.immediate_handoff.recent_causal_context");

    expect(handoff?.continuityRole).toContain("not automatically POV knowledge");
    expect(handoff?.doctrineWarnings?.join(" ")).toContain("Do not paste or summarize accepted prose");
    expect(handoff?.relatedFields).toEqual(
      expect.arrayContaining([
        "GENERATION BRIEF.current_authoritative_state.immediate_situation_summary",
        "GENERATION BRIEF.immediate_handoff.last_visible_moment",
        "GENERATION BRIEF.immediate_handoff.begin_after"
      ])
    );
  });

  it("separates last visible moment from begin-after guidance", () => {
    const lastVisible = getFieldGuidance("GENERATION BRIEF.immediate_handoff.last_visible_moment");
    const beginAfter = getFieldGuidance("GENERATION BRIEF.immediate_handoff.begin_after");

    expect(lastVisible?.continuityRole).toContain("concrete final image or action");
    expect(lastVisible?.examples?.length).toBeGreaterThan(0);
    expect(lastVisible?.antiExamples?.length).toBeGreaterThan(0);
    expect(lastVisible?.relatedFields).toContain("GENERATION BRIEF.immediate_handoff.begin_after");

    expect(beginAfter?.continuityRole).toContain("Imperative cut-point");
    expect(beginAfter?.authoringAdvice).toContain("use last_visible_moment for the descriptive image");
    expect(beginAfter?.relatedFields).toContain("GENERATION BRIEF.immediate_handoff.last_visible_moment");
  });

  it("distinguishes POV perception limits from line-of-sight geometry", () => {
    const perception = getFieldGuidance("GENERATION BRIEF.current_authoritative_state.pov_cannot_perceive_now");

    expect(perception?.promptDestinations).toEqual(["{pov_cannot_perceive_now}"]);
    expect(perception?.requiredness).toBe("conditional");
    expect(perception?.doctrineWarnings?.join(" ")).toContain("do not paste general line-of-sight geometry");
    expect(perception?.antiExamples?.join(" ")).toContain("hallway is dim");
    expect(perception?.relatedFields).toContain(
      "GENERATION BRIEF.current_authoritative_state.line_of_sight_and_visibility"
    );
  });

  it("does not expose retired prior accepted prose guidance", () => {
    const retiredPath = "GENERATION BRIEF.immediate_handoff.prior" + "_accepted_prose_status_or_handoff_note";
    expect(
      getFieldGuidance(retiredPath)
    ).toBeUndefined();
  });

  it("gives high-risk handoff, directive, and stop fields examples and anti-examples", () => {
    for (const path of [
      "GENERATION BRIEF.manual_moment_directive.must_render[]",
      "GENERATION BRIEF.stop_guidance.soft_unit_guidance"
    ]) {
      const entry = getFieldGuidance(path);

      expect(entry?.examples?.length, path).toBeGreaterThan(0);
      expect(entry?.antiExamples?.length, path).toBeGreaterThan(0);
    }
  });
});
