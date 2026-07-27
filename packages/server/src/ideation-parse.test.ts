import { describe, expect, it } from "vitest";

import {
  parseIdeationResponse,
  type IdeationParseExpectation
} from "./ideation-parse.js";

const ideaExpectation: IdeationParseExpectation = {
  mode: "ideas",
  slots: [
    { slotNumber: 1, operator: "Reveal" },
    { slotNumber: 2, operator: "Clock Advances" }
  ],
  validCitationKeys: new Set(["[SECRET-1]", "[CLOCK-1]"])
};

describe("ideation response parser", () => {
  it.each([
    {
      name: "assigned idea blocks",
      expectation: ideaExpectation,
      text: [
        "IDEA 1",
        "operator: Reveal",
        "headline: Let the sealed letter become visible.",
        "why: The letter supports a pressure move.",
        "grounds: [SECRET-1], [UNKNOWN-99]",
        "",
        "IDEA 2",
        "operator: Clock Advances",
        "headline: Let the closing window force a choice.",
        "why: The active clock supports time pressure.",
        "grounds: [CLOCK-1]"
      ].join("\n"),
      ideas: [
        {
          slotNumber: 1,
          operator: "Reveal",
          headline: "Let the sealed letter become visible.",
          why: "The letter supports a pressure move.",
          grounds: ["[SECRET-1]", "[UNKNOWN-99]"],
          unknownCitations: ["[UNKNOWN-99]"]
        },
        {
          slotNumber: 2,
          operator: "Clock Advances",
          headline: "Let the closing window force a choice.",
          why: "The active clock supports time pressure.",
          grounds: ["[CLOCK-1]"],
          unknownCitations: []
        }
      ]
    },
    {
      name: "assigned question blocks",
      expectation: {
        mode: "questions" as const,
        slots: [{ slotNumber: 1, operator: "Reveal" }],
        validCitationKeys: new Set(["[SECRET-1]"])
      },
      text: [
        "IDEA 1",
        "operator: Reveal",
        "question: What surface clue could make the hidden pressure visible?",
        "why: The selected secret supports a clue without certifying a reveal.",
        "grounds: [SECRET-1]"
      ].join("\n"),
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        question: "What surface clue could make the hidden pressure visible?",
        why: "The selected secret supports a clue without certifying a reveal.",
        grounds: ["[SECRET-1]"],
        unknownCitations: []
      }]
    },
    {
      name: "the contract-defined assigned SKIPPED block",
      expectation: {
        mode: "ideas" as const,
        slots: [{ slotNumber: 1, operator: "Reveal" }],
        validCitationKeys: new Set<string>()
      },
      text: [
        "IDEA 1",
        "operator: Reveal",
        "SKIPPED: no compiled record supports this slot."
      ].join("\n"),
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        skipped: true,
        grounds: [],
        unknownCitations: []
      }]
    }
  ])("accepts $name and preserves assigned identity", ({ expectation, text, ideas }) => {
    expect(parseIdeationResponse(text, expectation)).toEqual({ ok: true, ideas });
  });

  it.each([
    {
      name: "no idea blocks",
      text: "No idea blocks here.",
      expectation: ideaExpectation,
      failure: { code: "missing-idea-blocks" }
    },
    {
      name: "a missing assigned slot",
      text: normalIdeaBlock(1, "Reveal"),
      expectation: ideaExpectation,
      failure: { code: "missing-slot", slotNumber: 2 }
    },
    {
      name: "a duplicate assigned slot",
      text: [normalIdeaBlock(1, "Reveal"), normalIdeaBlock(1, "Reveal"), normalIdeaBlock(2, "Clock Advances")].join("\n\n"),
      expectation: ideaExpectation,
      failure: { code: "duplicate-slot", slotNumber: 1 }
    },
    {
      name: "an unexpected slot",
      text: normalIdeaBlock(3, "Reveal"),
      expectation: ideaExpectation,
      failure: { code: "unexpected-slot", slotNumber: 3 }
    },
    {
      name: "a mismatched operator",
      text: [normalIdeaBlock(1, "Clock Advances"), normalIdeaBlock(2, "Clock Advances")].join("\n\n"),
      expectation: ideaExpectation,
      failure: { code: "mismatched-operator", slotNumber: 1 }
    },
    {
      name: "a missing operator",
      text: normalIdeaBlock(1, "Reveal").replace("operator: Reveal\n", ""),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "missing-operator", slotNumber: 1 }
    },
    {
      name: "a missing idea headline",
      text: normalIdeaBlock(1, "Reveal").replace("headline: A grounded possibility.\n", ""),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "missing-headline", slotNumber: 1 }
    },
    {
      name: "a headline in question mode",
      text: normalIdeaBlock(1, "Reveal"),
      expectation: { ...ideaExpectation, mode: "questions" as const, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "unexpected-mode-field", slotNumber: 1 }
    },
    {
      name: "a missing question",
      text: [
        "IDEA 1",
        "operator: Reveal",
        "why: The assigned records support it.",
        "grounds: [SECRET-1]"
      ].join("\n"),
      expectation: { ...ideaExpectation, mode: "questions" as const, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "missing-question", slotNumber: 1 }
    },
    {
      name: "a malformed slot number",
      text: normalIdeaBlock(1, "Reveal").replace("IDEA 1", "IDEA nope"),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "malformed-slot-number" }
    },
    {
      name: "a missing why field",
      text: normalIdeaBlock(1, "Reveal").replace("why: The assigned records support it.\n", ""),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "missing-why", slotNumber: 1 }
    },
    {
      name: "a missing grounds field",
      text: normalIdeaBlock(1, "Reveal").replace("grounds: [SECRET-1]", ""),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "missing-grounds", slotNumber: 1 }
    },
    {
      name: "malformed grounds",
      text: normalIdeaBlock(1, "Reveal").replace("grounds: [SECRET-1]", "grounds: [SECRET-1] plus prose"),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "malformed-grounds", slotNumber: 1 }
    },
    {
      name: "a duplicate field",
      text: normalIdeaBlock(1, "Reveal").replace("operator: Reveal", "operator: Reveal\noperator: Reveal"),
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "duplicate-field", slotNumber: 1 }
    },
    {
      name: "an unexpected field",
      text: `${normalIdeaBlock(1, "Reveal")}\nnotes: do not expose this value`,
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "unexpected-field", slotNumber: 1 }
    },
    {
      name: "an invalid SKIPPED marker",
      text: "IDEA 1\noperator: Reveal\nSKIPPED: unsupported",
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "invalid-skipped-marker", slotNumber: 1 }
    },
    {
      name: "a SKIPPED block with normal fields",
      text: `${normalIdeaBlock(1, "Reveal")}\nSKIPPED: no compiled record supports this slot.`,
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "skipped-with-normal-fields", slotNumber: 1 }
    },
    {
      name: "an untagged structural line",
      text: `${normalIdeaBlock(1, "Reveal")}\nmodel commentary`,
      expectation: { ...ideaExpectation, slots: [ideaExpectation.slots[0]!] },
      failure: { code: "malformed-line", slotNumber: 1 }
    }
  ])("rejects $name with a deterministic content-free reason", ({ text, expectation, failure }) => {
    expect(parseIdeationResponse(text, expectation)).toEqual({ ok: false, reason: failure });
  });
});

function normalIdeaBlock(slotNumber: number, operator: string): string {
  return [
    `IDEA ${slotNumber}`,
    `operator: ${operator}`,
    "headline: A grounded possibility.",
    "why: The assigned records support it.",
    "grounds: [SECRET-1]"
  ].join("\n");
}
