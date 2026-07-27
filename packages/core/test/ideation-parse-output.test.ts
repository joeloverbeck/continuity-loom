import { describe, expect, it } from "vitest";

import {
  parseIdeationOutput,
  type IdeationParseContext
} from "../src/index.js";

describe("Ideate structured-output parser", () => {
  it("accepts a grounded idea and rejects a display-name operator with a safe slot reason", async () => {
    const core = await import("../src/index.js") as typeof import("../src/index.js") & {
      parseIdeationOutput?: (
        input: unknown,
        context: {
          mode: "ideas";
          slots: readonly { slotNumber: number; operator: string; operatorName: string }[];
          validCitationKeys: ReadonlySet<string>;
        }
      ) => unknown;
    };
    const context = {
      mode: "ideas" as const,
      slots: [{ slotNumber: 1, operator: "reveal", operatorName: "Reveal" }],
      validCitationKeys: new Set(["[SECRET-1]"])
    };
    const valid = JSON.stringify({
      contract: "grounded_ideation.v1",
      ideas: [{
        slot_number: 1,
        operator: "reveal",
        status: "idea",
        headline: "The sealed ledger surfaces at the worst moment.",
        why: "The cited secret supports a controlled reveal.",
        grounds: ["[SECRET-1]"]
      }]
    });

    expect(core.parseIdeationOutput).toBeTypeOf("function");
    expect(core.parseIdeationOutput(valid, context)).toEqual({
      ok: true,
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        headline: "The sealed ledger surfaces at the worst moment.",
        why: "The cited secret supports a controlled reveal.",
        grounds: ["[SECRET-1]"],
        unknownCitations: []
      }]
    });
    expect(core.parseIdeationOutput({
      contract: "grounded_ideation.v1",
      ideas: [{
        slot_number: 1,
        operator: "Reveal",
        status: "idea",
        headline: "The sealed ledger surfaces.",
        why: "The secret supports it.",
        grounds: ["[SECRET-1]"]
      }]
    }, context)).toEqual({
      ok: false,
      reason: { code: "mismatched-operator", slotNumber: 1 }
    });
  });

  it.each([
    ["ideas", "headline", "A pressure becomes visible."],
    ["questions", "question", "Which pressure becomes visible?"]
  ] as const)("accepts a complete %s item", (mode, modeField, modeValue) => {
    const context = parseContext(mode);

    expect(parseIdeationOutput({
      contract: "grounded_ideation.v1",
      ideas: [{
        slot_number: 1,
        operator: "reveal",
        status: "idea",
        [modeField]: modeValue,
        why: "The cited secret creates the pressure.",
        grounds: ["[SECRET-1]"]
      }]
    }, context)).toEqual({
      ok: true,
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        [modeField]: modeValue,
        why: "The cited secret creates the pressure.",
        grounds: ["[SECRET-1]"],
        unknownCitations: []
      }]
    });
  });

  it("accepts the exact skipped shape and rejects content in each skipped field", () => {
    const context = parseContext("ideas");
    const skipped = idea({ status: "skipped", headline: "", why: "", grounds: [] });

    expect(parseIdeationOutput(envelope(skipped), context)).toEqual({
      ok: true,
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        skipped: true,
        grounds: [],
        unknownCitations: []
      }]
    });

    for (const patch of [
      { headline: "Not empty" },
      { why: "Not empty" },
      { grounds: ["[SECRET-1]"] }
    ]) {
      expect(parseIdeationOutput(envelope({ ...skipped, ...patch }), context)).toEqual({
        ok: false,
        reason: { code: "skipped-with-normal-fields", slotNumber: 1 }
      });
    }
  });

  it.each([
    ["display name", "Reveal"],
    ["wrong casing", "REVEAL"],
    ["unassigned token", "clock_advances"]
  ])("rejects a %s operator token", (_label, operator) => {
    expect(parseIdeationOutput(envelope(idea({ operator })), parseContext("ideas"))).toEqual({
      ok: false,
      reason: { code: "mismatched-operator", slotNumber: 1 }
    });
  });

  it.each([
    ["missing slot", { contract: "grounded_ideation.v1", ideas: [] }, "missing-slot", 1],
    ["unexpected slot", envelope(idea({ slot_number: 2 })), "unexpected-slot", 2],
    ["duplicate slot", envelope(idea(), idea()), "duplicate-slot", 1],
    ["missing operator", envelope(omit(idea(), "operator")), "missing-operator", 1],
    ["invalid status", envelope(idea({ status: "maybe" })), "invalid-status", 1],
    ["missing headline", envelope(omit(idea(), "headline")), "missing-headline", 1],
    ["missing why", envelope(omit(idea(), "why")), "missing-why", 1],
    ["missing grounds", envelope(omit(idea(), "grounds")), "missing-grounds", 1],
    ["empty grounds", envelope(idea({ grounds: [] })), "missing-grounds", 1],
    ["malformed grounds", envelope(idea({ grounds: [""] })), "malformed-grounds", 1],
    ["unexpected field", envelope({ ...idea(), commentary: "no" }), "unexpected-field", 1],
    ["wrong mode field", envelope({ ...omit(idea(), "headline"), question: "Wrong mode?" }), "unexpected-mode-field", 1]
  ] as const)("fails closed for %s", (_label, input, code, slotNumber) => {
    expect(parseIdeationOutput(input, parseContext("ideas"))).toEqual({
      ok: false,
      reason: { code, slotNumber }
    });
  });

  it("requires the question field in question mode", () => {
    expect(parseIdeationOutput(envelope({
      ...omit(idea(), "headline"),
      status: "idea"
    }), parseContext("questions"))).toEqual({
      ok: false,
      reason: { code: "missing-question", slotNumber: 1 }
    });
  });

  it("keeps unknown citations as a visible non-blocking flag", () => {
    expect(parseIdeationOutput(envelope(idea({
      grounds: ["[SECRET-1]", "[UNKNOWN-9]"]
    })), parseContext("ideas"))).toMatchObject({
      ok: true,
      ideas: [{
        grounds: ["[SECRET-1]", "[UNKNOWN-9]"],
        unknownCitations: ["[UNKNOWN-9]"]
      }]
    });
  });

  it.each([
    ["non-JSON text", "not JSON", "not-pure-json"],
    ["wrong contract", { contract: "other", ideas: [] }, "contract-mismatch"],
    ["wrong envelope", { contract: "grounded_ideation.v1", ideas: [], extra: true }, "schema-mismatch"]
  ])("quarantines %s without response-derived detail", (_label, input, code) => {
    expect(parseIdeationOutput(input, parseContext("ideas"))).toEqual({
      ok: false,
      reason: { code }
    });
  });
});

function parseContext(mode: "ideas" | "questions"): IdeationParseContext {
  return {
    mode,
    slots: [{ slotNumber: 1, operator: "reveal", operatorName: "Reveal" }],
    validCitationKeys: new Set(["[SECRET-1]"])
  };
}

function envelope(...ideas: Record<string, unknown>[]): Record<string, unknown> {
  return { contract: "grounded_ideation.v1", ideas };
}

function idea(patch: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slot_number: 1,
    operator: "reveal",
    status: "idea",
    headline: "A pressure becomes visible.",
    why: "The cited secret creates the pressure.",
    grounds: ["[SECRET-1]"],
    ...patch
  };
}

function omit(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy = { ...value };
  delete copy[key];
  return copy;
}
