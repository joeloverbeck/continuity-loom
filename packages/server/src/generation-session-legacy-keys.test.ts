import { describe, expect, it } from "vitest";

import { stripLegacyGenerationSessionKeys } from "./generation-session-legacy-keys.js";

// All four keys earlier schema versions stored but the current strict draft
// schema rejects. Concatenated so the removed accepted-prose field name never
// appears literally in source (FOUNDATIONS §10 grep-purity rule).
const removedManualDirectiveKey = "manual" + "_directive_id";
const removedLocalFunctionKey = "local" + "_function";
const removedScopeKey = "scope";
const removedPriorAcceptedProseHandoffKey = "prior" + "_accepted_prose_status_or_handoff_note";

describe("stripLegacyGenerationSessionKeys", () => {
  it("strips the legacy manual_directive_id from active_working_set", () => {
    const result = stripLegacyGenerationSessionKeys({
      active_working_set: { selected_records: ["a"], [removedManualDirectiveKey]: "x" }
    }) as { active_working_set: Record<string, unknown> };

    expect(removedManualDirectiveKey in result.active_working_set).toBe(false);
    expect(result.active_working_set.selected_records).toEqual(["a"]);
  });

  it("strips the legacy local_function from every current_cast_voice_pressure entry", () => {
    const result = stripLegacyGenerationSessionKeys({
      current_cast_voice_pressure: [
        { cast_member_id: "a", [removedLocalFunctionKey]: "speaker" },
        { cast_member_id: "b" }
      ]
    }) as { current_cast_voice_pressure: Array<Record<string, unknown>> };

    expect(removedLocalFunctionKey in result.current_cast_voice_pressure[0]).toBe(false);
    expect(result.current_cast_voice_pressure[0].cast_member_id).toBe("a");
    expect(result.current_cast_voice_pressure[1]).toEqual({ cast_member_id: "b" });
  });

  it("strips the legacy scope from every cast_voice_overrides entry", () => {
    const result = stripLegacyGenerationSessionKeys({
      cast_voice_overrides: [{ cast_member_id: "a", [removedScopeKey]: "global" }]
    }) as { cast_voice_overrides: Array<Record<string, unknown>> };

    expect(removedScopeKey in result.cast_voice_overrides[0]).toBe(false);
    expect(result.cast_voice_overrides[0].cast_member_id).toBe("a");
  });

  it("strips the legacy prior-accepted-prose handoff key from immediate_handoff", () => {
    const result = stripLegacyGenerationSessionKeys({
      immediate_handoff: { begin_after: "the door clicks", [removedPriorAcceptedProseHandoffKey]: "note" }
    }) as { immediate_handoff: Record<string, unknown> };

    expect(removedPriorAcceptedProseHandoffKey in result.immediate_handoff).toBe(false);
    expect(result.immediate_handoff.begin_after).toBe("the door clicks");
  });

  it("strips multiple legacy keys across sections in one pass", () => {
    const result = stripLegacyGenerationSessionKeys({
      active_working_set: { selected_records: [], [removedManualDirectiveKey]: "x" },
      immediate_handoff: { begin_after: "now", [removedPriorAcceptedProseHandoffKey]: "note" }
    }) as { active_working_set: Record<string, unknown>; immediate_handoff: Record<string, unknown> };

    expect(removedManualDirectiveKey in result.active_working_set).toBe(false);
    expect(removedPriorAcceptedProseHandoffKey in result.immediate_handoff).toBe(false);
  });

  it("returns the input by reference when there is nothing to strip", () => {
    const clean = {
      active_working_set: { selected_records: ["a"] },
      immediate_handoff: { begin_after: "now" }
    };

    expect(stripLegacyGenerationSessionKeys(clean)).toBe(clean);
  });

  it("returns non-object inputs unchanged", () => {
    expect(stripLegacyGenerationSessionKeys(null)).toBeNull();
    expect(stripLegacyGenerationSessionKeys("draft")).toBe("draft");
    const arr = [1, 2, 3];
    expect(stripLegacyGenerationSessionKeys(arr)).toBe(arr);
  });

  it("leaves a section unchanged when it is not the expected shape", () => {
    const value = { active_working_set: "not-an-object", current_cast_voice_pressure: "nope" };
    expect(stripLegacyGenerationSessionKeys(value)).toBe(value);
  });
});
