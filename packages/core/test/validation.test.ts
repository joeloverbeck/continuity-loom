import { describe, expect, it } from "vitest";

import {
  buildValidationSnapshot,
  runValidation,
  type Diagnostic,
  type ValidationRecord,
  type ValidationRule
} from "../src/index.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

const unsortedRecords: readonly ValidationRecord[] = [
  {
    id: idB,
    type: "FACT",
    payload: { statement: "B is second." }
  },
  {
    id: idA,
    type: "CAST MEMBER",
    castBand: "active_onstage_cast_full",
    localFunction: "active_speaker",
    payload: { name: "A" }
  }
];

function minimalSnapshot() {
  return buildValidationSnapshot({
    records: unsortedRecords,
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: {
      template: "0.0.0",
      compiler: "0.0.0",
      contract: "1.0.0"
    }
  });
}

function diagnostic(input: Pick<Diagnostic, "severity" | "code" | "affected">): Diagnostic {
  return {
    ...input,
    message: `${input.code} message`,
    whyItMatters: `${input.code} rationale`,
    suggestedActions: ["revise"]
  };
}

describe("validation engine foundation", () => {
  it("returns an unblocked empty result with no registered rules", () => {
    expect(runValidation(minimalSnapshot(), [])).toEqual({
      blockers: [],
      warnings: [],
      isBlocked: false
    });
  });

  it("normalizes and freezes snapshots without mutating caller input", () => {
    const records = [...unsortedRecords];
    const snapshot = buildValidationSnapshot({
      records,
      generationSession: {
        current_cast_voice_pressure: [],
        cast_voice_overrides: []
      },
      storyConfig: {},
      versions: {
        template: "template-a",
        compiler: "compiler-a",
        contract: "contract-a"
      }
    });

    expect(snapshot.records.map((record) => record.id)).toEqual([idA, idB]);
    expect(records.map((record) => record.id)).toEqual([idB, idA]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.records)).toBe(true);
    expect(Object.isFrozen(snapshot.records[0])).toBe(true);
    expect(snapshot.versions.contract).toBe("contract-a");
  });

  it("derives isBlocked from blockers only and stable-sorts diagnostics", () => {
    const rules: readonly ValidationRule[] = [
      () => [
        diagnostic({ severity: "warning", code: "z-warning", affected: [{ recordId: idB }] }),
        diagnostic({ severity: "blocker", code: "b-blocker", affected: [{ recordId: idB }] }),
        diagnostic({ severity: "blocker", code: "a-blocker", affected: [{ recordId: idB }] }),
        diagnostic({ severity: "blocker", code: "a-blocker", affected: [{ recordId: idA }] })
      ]
    ];

    const result = runValidation(minimalSnapshot(), rules);

    expect(result.isBlocked).toBe(true);
    expect(result.blockers.map((item) => [item.code, item.affected[0]?.recordId])).toEqual([
      ["a-blocker", idA],
      ["a-blocker", idB],
      ["b-blocker", idB]
    ]);
    expect(result.warnings.map((item) => item.code)).toEqual(["z-warning"]);
  });

  it("warnings never block and repeated runs are deep-equal", () => {
    const rules: readonly ValidationRule[] = [
      () => [
        diagnostic({ severity: "warning", code: "b-warning", affected: [{ field: "later" }] }),
        diagnostic({ severity: "warning", code: "a-warning", affected: [{ field: "earlier" }] })
      ]
    ];
    const snapshot = minimalSnapshot();

    const first = runValidation(snapshot, rules);
    const second = runValidation(snapshot, rules);

    expect(first).toEqual(second);
    expect(first.isBlocked).toBe(false);
    expect(first.warnings.map((item) => item.code)).toEqual(["a-warning", "b-warning"]);
  });
});
