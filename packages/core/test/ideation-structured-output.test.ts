import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig
} from "../src/index.js";

describe("Ideate structured-output compilation", () => {
  it("exposes Ideate only through the canonical compile artifact", () => {
    const snapshot = buildValidationSnapshot({
      records: structuredClone(demoRecords),
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "1.11.0", compiler: "1.13.0", contract: "1.16.0" }
    });

    // @ts-expect-error compilePrompt is prose-only; Ideate must use compileIdeationPrompt.
    compilePrompt(snapshot, { promptKind: "ideation" });
  });

  it("compiles one assignment into the prompt, strict schema, and parse context", async () => {
    const core = await import("../src/index.js") as typeof import("../src/index.js") & {
      compileIdeationPrompt?: (
        snapshot: ReturnType<typeof buildValidationSnapshot>,
        request: { mode: "ideas"; count: number; dormantSlot: boolean }
      ) => {
        prompt: string;
        assignment: {
          slots: readonly { operator: string }[];
        };
        outputSchema: Record<string, unknown>;
        parseContext: {
          mode: "ideas" | "questions";
          slots: readonly { slotNumber: number; operator: string }[];
          validCitationKeys: ReadonlySet<string>;
        };
      };
    };
    const snapshot = buildValidationSnapshot({
      records: structuredClone(demoRecords),
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "1.11.0", compiler: "1.13.0", contract: "1.16.0" }
    });

    expect(core.compileIdeationPrompt).toBeTypeOf("function");
    const result = core.compileIdeationPrompt(snapshot, {
      mode: "ideas",
      count: 3,
      dormantSlot: false
    });
    const properties = result.outputSchema.properties as Record<string, unknown>;
    const ideas = properties.ideas as {
      items: {
        properties: Record<string, { enum?: unknown; items?: { enum?: unknown }; type?: unknown }>;
      };
    };
    const assignedOperators = result.assignment.slots.map((slot) => slot.operator);
    const assignedSlots = result.assignment.slots.map((_, index) => index + 1);

    expect(result.prompt).toContain("Copy the assigned slot's Operator id exactly");
    expect(result.parseContext).toMatchObject({
      mode: "ideas",
      slots: result.assignment.slots.map((slot, index) => ({
        slotNumber: index + 1,
        operator: slot.operator
      }))
    });
    expect(ideas.items.properties.operator?.enum).toEqual(assignedOperators);
    expect(ideas.items.properties.slot_number?.enum).toEqual(assignedSlots);
    expect(ideas.items.properties.headline).toEqual({ type: "string" });
    expect(result.parseContext.validCitationKeys).toEqual(
      new Set(ideas.items.properties.grounds?.items?.enum as readonly string[])
    );
  });

  it("uses the mode-specific question field", async () => {
    const { compileIdeationPrompt } = await import("../src/index.js");
    const snapshot = buildValidationSnapshot({
      records: structuredClone(demoRecords),
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "1.11.0", compiler: "1.13.0", contract: "1.16.0" }
    });

    const result = compileIdeationPrompt(snapshot, {
      mode: "questions",
      count: 3,
      dormantSlot: false
    });
    const properties = result.outputSchema.properties as Record<string, unknown>;
    const ideas = properties.ideas as {
      items: { properties: Record<string, unknown>; required: readonly string[] };
    };

    expect(ideas.items.properties).toHaveProperty("question", { type: "string" });
    expect(ideas.items.properties).not.toHaveProperty("headline");
    expect(ideas.items.required).toContain("question");
  });

  it("calls slot assignment exactly once inside the public compile seam", () => {
    const source = readFileSync(
      new URL("../src/compiler/ideation/compile-ideation-prompt.ts", import.meta.url),
      "utf8"
    );

    expect(source.match(/\bassignSlots\s*\(/g)).toHaveLength(1);
    expect(source).not.toContain("compilePrompt(snapshot, {");
  });
});
