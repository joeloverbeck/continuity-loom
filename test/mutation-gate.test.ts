import { describe, expect, it } from "vitest";

import { readMutationReport, summarizeMutationReport } from "../scripts/robustness/mutation-gate.mjs";

describe("mutation-gate summarizer", () => {
  it("summarizes documented Stryker mutant statuses and advisory gate output", () => {
    const summary = summarizeMutationReport(readMutationReport("test/fixtures/robustness/mutation.json"));

    expect(summary).toEqual({
      statusTotals: {
        Killed: 1,
        Survived: 1,
        NoCoverage: 1,
        Timeout: 1,
        RuntimeError: 1,
        CompileError: 1,
        Ignored: 1,
        Pending: 0
      },
      mutationScore: 16.67,
      scoreDenominator: 6,
      gate: {
        floor: null,
        passed: true,
        reason: "advisory"
      }
    });
  });

  it("fails the gate when a supplied floor exceeds the computed score", () => {
    const summary = summarizeMutationReport(readMutationReport("test/fixtures/robustness/mutation.json"), 90);

    expect(summary.gate).toEqual({
      floor: 90,
      passed: false,
      reason: "score-below-floor"
    });
  });
});
