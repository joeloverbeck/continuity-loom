import { describe, expect, it } from "vitest";

import { compilePrompt, demoGenerationSession, demoStoryConfig, type GenerationSession } from "../src/index.js";
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
Slate contains 4 grounded slots.

Slot 1: Reveal
Operator id: reveal
Definition: Change information access by bringing one selected secret closer to the surface through an authored legal cue or reveal permission.
Grounds: [SECRET-1]

Slot 2: Falsify a Belief
Operator id: falsify_belief
Definition: Change operative interpretation by making one selected active belief collide with one selected fact or event.
Grounds: [BELIEF-1], [FACT-1]

Slot 3: Clock Advances
Operator id: clock_advances
Definition: Change temporal pressure by advancing one selected active clock without inventing unsupported facts.
Grounds: [CLOCK-1]

Slot 4: Commit at a Cost
Operator id: commit_at_a_cost
Definition: Change commitment under pressure by forcing one selected costly move from two different active pressure families; never render an A/B menu or branch list.
Grounds: [BELIEF-1], [CLOCK-1]
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
    expect(result.prompt).toContain("Slate shrank from 3 requested slots to 1 grounded slots. Do not pad.");
    expect(result.prompt).not.toContain("<prose_craft>");
    expect(result.prompt).not.toContain("<stop_rule>");
    expect(result.prompt).not.toContain("<final_output_instruction>");
    expect(result.prompt).not.toContain("Begin prose exactly after this point");
    expect(result.prompt).not.toContain("hidden clock");
  });

  it("renders EMOTION and ENTITY STATUS keys only in ideation prompts", () => {
    const generationSession: GenerationSession = {
      ...demoGenerationSession,
      current_authoritative_state: {
        ...demoGenerationSession.current_authoritative_state,
        entity_statuses: ["entity-status"]
      }
    };
    const snapshot = snapshotWith(
      [
        ideationRecord("EMOTION", "emotion", { label: "Elin keeps fear under tight control" }),
        ideationRecord("ENTITY STATUS", "entity-status", { label: "Elin stands by the flour bin" })
      ],
      generationSession
    );
    const ideation = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 3, dormantSlot: false }
    }).prompt;
    const prose = compilePrompt(snapshot, { promptKind: "prose" }).prompt;

    expect(ideation).toContain("[EMOTION-1] Elin keeps fear under tight control");
    expect(ideation).toContain("statuses: [ENTITY STATUS-1] Elin stands by the flour bin");
    expect(prose).toContain("Elin keeps fear under tight control");
    expect(prose).toContain("statuses: Elin stands by the flour bin");
    expect(prose).not.toContain("[EMOTION-1]");
    expect(prose).not.toContain("[ENTITY STATUS-1]");
  });
});

function snapshotWith(records: readonly ValidationRecord[], generationSession: GenerationSession = demoGenerationSession) {
  return buildValidationSnapshot({
    records,
    generationSession,
    storyConfig: demoStoryConfig,
    versions: { template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" }
  });
}
