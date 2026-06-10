import {
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  GUIDANCE_REGISTRY,
  type FieldGuidance
} from "../src/index.js";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const promptSentPositivePatterns = [
  /\bmodel sees\b/i,
  /\btell the prose writer\b/i,
  /\bthis prompt says\b/i,
  /\bsend this to the model\b/i
];

const doctrineForbiddenPatterns = [
  /\baccepted prose is canon\b/i,
  /\btreat accepted prose as canon\b/i,
  /\bpaste accepted prose\b/i,
  /\bmine accepted prose\b/i,
  /\bauto(?:matically)?[- ]summari[sz]e accepted prose\b/i,
  /\bLLM\b.*\b(?:infer|update|mutate|decide)\b.*\bcanon\b/i,
  /\b(?:branching|story branch|act structure|drama[- ]manager|autonomous plot)\b/i,
  /\bdirective (?:can|may) override\b/i
];

describe("field guidance doctrine", () => {
  it("keeps prompt-never entries free of positive prompt-sent wording", () => {
    for (const guidance of allGuidance()) {
      if (guidance.promptFacing !== "never") {
        continue;
      }

      const text = guidanceText(guidance);
      for (const pattern of promptSentPositivePatterns) {
        expect(text, `${guidance.fieldPath}: ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps catalog copy within Continuity Loom doctrine", () => {
    for (const guidance of allGuidance()) {
      const text = guidanceText(guidance);

      for (const pattern of doctrineForbiddenPatterns) {
        expect(text, `${guidance.fieldPath}: ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("is not imported by the compiler and does not appear in compiled prompts", () => {
    const compilerSource = compilerSourceText();
    const prompt = compilePrompt(
      buildValidationSnapshot({
        records: structuredClone(demoRecords),
        generationSession: structuredClone(demoGenerationSession),
        storyConfig: structuredClone(demoStoryConfig),
        versions: { template: "1.0.0", compiler: "1.2.0", contract: "1.3.0" }
      })
    ).prompt;

    expect(compilerSource).not.toMatch(/field-guidance/i);

    for (const text of guidanceStrings()) {
      if (text.length >= 24) {
        expect(prompt, text).not.toContain(text);
      }
    }
  });
});

function guidanceText(guidance: FieldGuidance): string {
  return guidanceStringsFor(guidance).join("\n");
}

function guidanceStrings(): readonly string[] {
  return allGuidance().flatMap(guidanceStringsFor);
}

function allGuidance(): readonly FieldGuidance[] {
  return Array.from(GUIDANCE_REGISTRY.values());
}

function guidanceStringsFor(guidance: FieldGuidance): readonly string[] {
  return [
    guidance.short,
    guidance.details,
    guidance.validationRole,
    guidance.continuityRole,
    guidance.authoringAdvice,
    guidance.criticalVisibleHint,
    ...(guidance.doctrineWarnings ?? []),
    ...(guidance.commonMistakes ?? []),
    ...(guidance.examples ?? []),
    ...(guidance.antiExamples ?? []),
    ...Object.values(guidance.enumValues ?? {}).flatMap((enumGuidance) => [
      enumGuidance.short,
      enumGuidance.implications,
      enumGuidance.useWhen,
      enumGuidance.avoidWhen
    ])
  ].filter((value): value is string => Boolean(value?.trim()));
}

function compilerSourceText(): string {
  return listTypeScriptFiles(new URL("../src/compiler", import.meta.url).pathname)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listTypeScriptFiles(path);
    }

    return extname(entry.name) === ".ts" ? [path] : [];
  });
}
