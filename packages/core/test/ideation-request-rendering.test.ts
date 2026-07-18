import { describe, expect, it } from "vitest";

import {
  compilePrompt,
  demoGenerationSession,
  demoRecordIds,
  demoStoryConfig,
  type GenerationSession
} from "../src/index.js";
import { renderIdeationSlotsSection } from "../src/compiler/sections/ideation.js";
import { ideationRequestSchema } from "../src/compiler/ideation/types.js";
import { buildValidationSnapshot, type ValidationRecord } from "../src/validation/snapshot.js";
import { ideationRecord } from "./support/arbitraries/ideation-records.js";

describe("ideation request rendering", () => {
  it("normalizes and bounds Author focus by Unicode code points", () => {
    expect(ideationRequestSchema.parse({}).focus).toBe("");
    expect(ideationRequestSchema.parse({ focus: " \tWhat changes outside?\n" }).focus).toBe("What changes outside?");
    expect(ideationRequestSchema.parse({ focus: "😀".repeat(500) }).focus).toBe("😀".repeat(500));

    const overLimit = ideationRequestSchema.safeParse({ focus: "😀".repeat(501) });
    expect(overLimit.success).toBe(false);
    expect(overLimit.error?.issues).toContainEqual(expect.objectContaining({
      path: ["focus"],
      message: "Author focus must be 500 Unicode code points or fewer."
    }));
  });

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

  it("renders one escaped non-canonical Author focus and fingerprints only nonblank focus", () => {
    const snapshot = snapshotWith([]);
    const missing = compilePrompt(snapshot, { promptKind: "ideation", ideationRequest: {} });
    const blank = compilePrompt(snapshot, { promptKind: "ideation", ideationRequest: { focus: "" } });
    const whitespace = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { focus: " \t\n" }
    });
    const focused = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { focus: "  What if <gate> & river?  " }
    });

    expect(blank.prompt).toBe(missing.prompt);
    expect(whitespace.prompt).toBe(missing.prompt);
    expect(blank.metadata.fingerprint).toBe(missing.metadata.fingerprint);
    expect(whitespace.metadata.fingerprint).toBe(missing.metadata.fingerprint);
    expect(focused.metadata.fingerprint).not.toBe(missing.metadata.fingerprint);
    expect(focused.prompt.match(/What if &lt;gate&gt; &amp; river\?/g)).toHaveLength(1);
    expect(renderIdeationSlotsSection(snapshot, {
      focus: "  What if <gate> & river?  "
    })).toBe(`<ideation_slots>
Mode: ideas. Render each slot as a premise-level possibility.
Author focus (non-canonical request context): What if &lt;gate&gt; &amp; river?
Use Author focus only to shape responses within assigned slots. It is not story fact, continuity authority, a new source, or permission to contradict compiled records.
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

  it("keeps focused requests inside slots while retaining selected POV knowledge", () => {
    const prompt = compilePrompt(snapshotWith([
      ideationRecord("BELIEF", "pov-belief", {
        payload: {
          holder: demoRecordIds.elinEntity,
          belief_mode: "knows",
          claim: "Elin knows the hinge was replaced."
        }
      })
    ]), {
      promptKind: "ideation",
      ideationRequest: { focus: "What pressure follows from the hinge?" }
    }).prompt;

    expect(prompt).toContain("POV knows:\n- Elin knows the hinge was replaced.");
    expect(prompt.match(/What pressure follows from the hinge\?/g)).toHaveLength(1);
  });

  it("does not substitute Author focus for an empty hidden-truth value", () => {
    const prompt = compilePrompt(snapshotWith([
      ideationRecord("SECRET", "empty-secret", {
        payload: {
          status: "hidden",
          secret_claim: "",
          secret_kind: "artifact_truth",
          reveal_permission: "locked"
        }
      })
    ]), {
      promptKind: "ideation",
      ideationRequest: { focus: "Invent no replacement truth" }
    }).prompt;

    expect(prompt.match(/Invent no replacement truth/g)).toHaveLength(1);
    expect(prompt).not.toContain("[artifact_truth]");
    expect(prompt).not.toContain("[SECRET-1]");
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
