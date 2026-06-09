import { describe, expect, it } from "vitest";
import type { FieldRequiredness, GenerationSessionDraft } from "@loom/core";

import { isRequiredNow, type GenerationContext } from "./requiredness-now.js";
import { computeSectionFill, sectionFillLabel } from "./section-fill.js";

describe("isRequiredNow", () => {
  const cases: readonly [FieldRequiredness | undefined, GenerationContext, boolean][] = [
    ["always", "first_segment", true],
    ["always", "continuation_after_accepted_segment", true],
    ["continuation", "first_segment", false],
    ["continuation", "continuation_after_accepted_segment", true],
    ["conditional", "first_segment", false],
    ["conditional", "continuation_after_accepted_segment", false],
    ["optional", "first_segment", false],
    ["optional", "continuation_after_accepted_segment", false],
    [undefined, "first_segment", false],
    [undefined, "continuation_after_accepted_segment", false]
  ];

  it.each(cases)("maps %s in %s to required-now %s", (requiredness, generationContext, expected) => {
    expect(isRequiredNow(requiredness, generationContext)).toBe(expected);
  });
});

describe("computeSectionFill", () => {
  it("counts always-required fields and reports required empty without asserting readiness", () => {
    const fills = computeSectionFill(
      {
        current_authoritative_state: {
          current_time: "dawn",
          current_location: "kitchen"
        }
      },
      "first_segment"
    );

    const currentState = fills.find((fill) => fill.sectionId === "current-state");

    expect(currentState).toMatchObject({
      tone: "amber",
      requiredFilled: 2,
      requiredTotal: 4
    });
    expect(sectionFillLabel(currentState!)).toBe("2 required empty");
    expect(sectionFillLabel(currentState!)).not.toMatch(/valid|ready/i);
  });

  it("switches continuation-required handoff fields based on generation context", () => {
    const draft: GenerationSessionDraft = {
      immediate_handoff: {
        recent_causal_context: "Mara heard the latch click."
      }
    };

    const firstSegmentHandoff = computeSectionFill(draft, "first_segment").find(
      (fill) => fill.sectionId === "handoff"
    );
    const continuationHandoff = computeSectionFill(draft, "continuation_after_accepted_segment").find(
      (fill) => fill.sectionId === "handoff"
    );

    expect(firstSegmentHandoff).toMatchObject({
      tone: "neutral",
      requiredFilled: 0,
      requiredTotal: 0,
      filled: 1
    });
    expect(sectionFillLabel(firstSegmentHandoff!)).toBe("1 filled");

    expect(continuationHandoff).toMatchObject({
      tone: "amber",
      requiredFilled: 1,
      requiredTotal: 3
    });
    expect(sectionFillLabel(continuationHandoff!)).toBe("2 required empty");
  });
});
