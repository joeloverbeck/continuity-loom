import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  immediateHandoffSchema,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const acceptedSegmentCanary = "ACCEPTED_SEGMENT_CANARY_DO_NOT_PROMPT";
const promptFacingHandoffFields = [
  "recent_causal_context",
  "last_visible_moment",
  "prior_accepted_prose_status_or_handoff_note",
  "begin_after"
] as const;

describe("accepted prose exclusion", () => {
  it("keeps accepted-segment text outside compiled prompts and compiler imports", () => {
    const prompt = compilePrompt(buildValidationSnapshot(input())).prompt;

    expect(prompt).not.toContain(acceptedSegmentCanary);
    expect(compilerSourceText()).not.toMatch(/from\s+["'][^"']*(accepted|record-repository|record-tables)[^"']*["']/i);
  });

  it.each(promptFacingHandoffFields)("blocks prompt-facing prose contamination in %s", (field) => {
    const snapshotInput = input();
    snapshotInput.generationSession.immediate_handoff[field] =
      `Rejected candidate copied from accepted prose: ${acceptedSegmentCanary}`;

    const result = runValidation(buildValidationSnapshot(snapshotInput));

    expect(result.isBlocked).toBe(true);
    expect(result.blockers.map((diagnostic) => diagnostic.code)).toContain(
      DIAGNOSTIC_CODES.promptFacingProseContamination
    );
  });

  it("allows a clean user-authored accepted-prose status handoff note", () => {
    const snapshotInput = input();
    snapshotInput.generationSession.generation_validation_focus.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    snapshotInput.generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note =
      "The previous accepted segment introduced no durable continuity change; records are current.";

    const result = runValidation(buildValidationSnapshot(snapshotInput));

    expect(result.blockers.map((diagnostic) => diagnostic.code)).not.toContain(
      DIAGNOSTIC_CODES.promptFacingProseContamination
    );
  });

  it("keeps immediate handoff schema limited to user-authored handoff fields", () => {
    const expectedFields = [
      "begin_after",
      "last_visible_moment",
      "prior_accepted_prose_status_or_handoff_note",
      "recent_causal_context"
    ];
    const validHandoff = input().generationSession.immediate_handoff;

    expect(immediateHandoffSchema.parse(validHandoff)).toEqual(validHandoff);
    expect(() =>
      immediateHandoffSchema.parse({
        ...validHandoff,
        automatic_prose_summary: "The app mined this from accepted prose."
      })
    ).toThrow();
    expect(Object.keys(validHandoff).sort()).toEqual(expectedFields);

    const schemaDoc = readFileSync(new URL("../../../docs/story-record-schema.md", import.meta.url), "utf8");
    expect(schemaDoc).toContain("prior_accepted_prose_status_or_handoff_note");
    expect(schemaDoc).not.toMatch(/automatic_prose_summary/i);
  });
});

function input(): BuildValidationSnapshotInput {
  return {
    records: structuredClone(demoRecords),
    generationSession: structuredClone(demoGenerationSession),
    storyConfig: structuredClone(demoStoryConfig),
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  };
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
