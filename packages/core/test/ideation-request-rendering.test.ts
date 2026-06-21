import { describe, expect, it } from "vitest";

import { compilePrompt, demoGenerationSession, demoStoryConfig } from "../src/index.js";
import { renderIdeationSlotsSection } from "../src/compiler/sections/ideation.js";
import { ideationRequestSchema } from "../src/compiler/ideation/types.js";
import { buildValidationSnapshot, type ValidationRecord } from "../src/validation/snapshot.js";
import { ideationRecord } from "./support/arbitraries/ideation-records.js";

describe("ideation request rendering", () => {
  it("normalizes avoid-list entries by trimming prompt-facing request text", () => {
    expect(ideationRequestSchema.parse({ avoidList: ["  repeat the previous slate  "] }).avoidList).toEqual([
      "repeat the previous slate"
    ]);
  });

  it("renders exact question-mode slot fields, shrink disclosure, operator labels, and grounds", () => {
    const section = renderIdeationSlotsSection(snapshotWith([
      ideationRecord("SECRET", "secret", { revealable: true }),
      ideationRecord("BELIEF", "belief"),
      ideationRecord("FACT", "fact"),
      ideationRecord("CLOCK", "clock")
    ]), { mode: "questions", count: 4, dormantSlot: false });

    expect(section).toBe(`<ideation_slots>
Mode: questions. Render each slot as an author-facing story question.
Slate shrank from 4 requested slots to 3 grounded slots. Do not pad.

Slot 1: Reveal
Operator id: reveal
Definition: Bring a selected secret closer to the surface while respecting reveal permission and POV knowledge constraints.
Grounds: [SECRET-1]

Slot 2: Falsify a Belief
Operator id: falsify_belief
Definition: Make a selected belief collide with a selected fact or event that can expose its limits.
Grounds: [BELIEF-1], [FACT-1]

Slot 3: Clock Advances
Operator id: clock_advances
Definition: Advance a selected clock in a way that changes immediate pressure without inventing unsupported facts.
Grounds: [CLOCK-1]
</ideation_slots>`);
  });

  it("renders exact idea-mode empty-state text when no slot can be grounded", () => {
    expect(renderIdeationSlotsSection(snapshotWith([]), {})).toBe(`<ideation_slots>
Mode: ideas. Render each slot as a premise-level possibility.
Slate shrank from 5 requested slots to 0 grounded slots. Do not pad.

No grounded ideation slots are available.
</ideation_slots>`);
  });

  it("keeps prose-only continuation sections and hidden clock instructions out of ideation prompts", () => {
    const result = compilePrompt(snapshotWith([ideationRecord("CLOCK", "clock")]), {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 3, dormantSlot: true, avoidList: ["repeat the last slate"] }
    });

    expect(result.prompt).toContain("<ideation_slots>");
    expect(result.prompt).toContain("Mode: ideas.");
    expect(result.prompt).toContain("Slate shrank from 3 requested slots to 2 grounded slots. Do not pad.");
    expect(result.prompt).not.toContain("<prose_craft>");
    expect(result.prompt).not.toContain("<stop_rule>");
    expect(result.prompt).not.toContain("<final_output_instruction>");
    expect(result.prompt).not.toContain("Begin prose exactly after this point");
    expect(result.prompt).not.toContain("hidden clock");
  });
});

function snapshotWith(records: readonly ValidationRecord[]) {
  return buildValidationSnapshot({
    records,
    generationSession: demoGenerationSession,
    storyConfig: demoStoryConfig,
    versions: { template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" }
  });
}
