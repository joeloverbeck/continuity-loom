import {
  buildValidationSnapshot,
  compilePrompt,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { estimatePromptTokens, fingerprintPrompt } from "../src/compiler/fingerprint.js";
import { describe, expect, it } from "vitest";

function minimalSnapshotInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

describe("compiler fingerprint contract", () => {
  it.each([
    ["empty prompt", "", "fnv1a32:811c9dc5"],
    ["single ASCII code unit", "a", "fnv1a32:e40c292c"],
    ["ASCII sequence with a leading-zero digest", "f8", "fnv1a32:0d226273"],
    ["ASCII word", "hello", "fnv1a32:4f9f2cab"],
    ["punctuated ASCII sentence", "Hello, world!", "fnv1a32:ed90f094"],
    ["single non-ASCII BMP code unit", "é", "fnv1a32:6c0b6c44"],
    ["single non-BMP character represented by two UTF-16 code units", "𠮷", "fnv1a32:b02212b6"]
  ])("matches the FNV-1a 32-bit vector for %s", (_label, prompt, expected) => {
    expect(fingerprintPrompt(prompt)).toBe(expected);
  });

  it.each([
    ["empty", "", 1],
    ["one code unit", "a", 1],
    ["four code units", "abcd", 1],
    ["five code units", "abcde", 2],
    ["non-ASCII code unit", "é", 1]
  ])("estimates prompt tokens for %s prompts", (_label, prompt, expected) => {
    expect(estimatePromptTokens(prompt)).toBe(expected);
  });

  it("derives prompt metadata from the emitted prompt", () => {
    const result = compilePrompt(buildValidationSnapshot(minimalSnapshotInput()));

    expect(result.metadata).toEqual({
      versions: {
        template: "1.0.0",
        compiler: "1.0.0",
        contract: "1.0.0"
      },
      fingerprint: fingerprintPrompt(result.prompt),
      lengthEstimate: result.prompt.length,
      tokenEstimate: estimatePromptTokens(result.prompt)
    });
  });
});
