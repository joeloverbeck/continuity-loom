import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { cleanValidationInput } from "./support/arbitraries/validation-snapshots.js";
import { describe, expect, it } from "vitest";

// PRD #165 / issue #168: a deterministic, non-gating advisory warning fires when a FACT whose
// fact_kind is hard_canon OR whose salience is critical is set to audience_visibility: hidden,
// because FACT.audience_visibility is not a reader-concealment control (see issue #167). The
// warning must fire on exactly that predicate, never for other FACT audience_visibility values,
// and never for any SECRET record.

const factId = "019b0298-5c00-7000-8000-000000000f01";
const secretId = "019b0298-5c00-7000-8000-000000000f02";
const povId = "019b0298-5c00-7000-8000-000000000001";

const CODE = DIAGNOSTIC_CODES.factHiddenAudienceVisibilityNotConcealment;

type FactOverrides = {
  fact_kind?: "hard_canon" | "current_state" | "setting_fact" | "discovered_fact";
  salience?: "low" | "medium" | "high" | "critical";
  audience_visibility?: "hidden" | "implied" | "explicit" | "not_applicable";
};

function factRecord(overrides: FactOverrides): ValidationRecord {
  return {
    id: factId,
    type: "FACT",
    payload: {
      id: factId,
      fact_kind: overrides.fact_kind ?? "current_state",
      statement: "The premise the author wants to protect.",
      scope: "global",
      known_by: [povId],
      audience_visibility: overrides.audience_visibility ?? "explicit",
      salience: overrides.salience ?? "medium"
    }
  };
}

function inputWith(record: ValidationRecord): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [...input.records, record];
  return input;
}

function warningCodes(input: BuildValidationSnapshotInput): string[] {
  const result = runValidation(buildValidationSnapshot(input));
  return result.warnings.map((diagnostic) => diagnostic.code);
}

describe("advisory warning for a hidden critical or hard-canon FACT (PRD #165 / #168)", () => {
  it("fires for a hard_canon FACT set to audience_visibility: hidden", () => {
    expect(warningCodes(inputWith(factRecord({ fact_kind: "hard_canon", audience_visibility: "hidden" })))).toContain(CODE);
  });

  it("fires for a critical FACT set to audience_visibility: hidden", () => {
    expect(
      warningCodes(inputWith(factRecord({ fact_kind: "current_state", salience: "critical", audience_visibility: "hidden" })))
    ).toContain(CODE);
  });

  it("is classified as a warning and never appears among blockers", () => {
    // Non-gating behavior (canPreview/canGenerate stay true) is proved through deriveReadiness in
    // validation-diagnostic-contract.test.ts; here we only assert the classification is a warning.
    const input = inputWith(factRecord({ fact_kind: "hard_canon", audience_visibility: "hidden" }));
    const result = runValidation(buildValidationSnapshot(input));

    expect(result.blockers.map((diagnostic) => diagnostic.code)).not.toContain(CODE);
    const warning = result.warnings.find((diagnostic) => diagnostic.code === CODE);
    expect(warning?.severity).toBe("warning");
  });

  it("routes the recovery guidance to the SECRET model", () => {
    const input = inputWith(factRecord({ fact_kind: "hard_canon", audience_visibility: "hidden" }));
    const warning = runValidation(buildValidationSnapshot(input)).warnings.find((d) => d.code === CODE);
    const text = `${warning?.message ?? ""} ${warning?.repairInstruction ?? ""}`;

    expect(text).toContain("SECRET");
    expect(text).toContain("pov_access: knows");
    expect(text).toContain("audience_visibility: hidden");
  });

  it("does not fire for other FACT audience_visibility values even when critical or hard_canon", () => {
    for (const audience_visibility of ["implied", "explicit", "not_applicable"] as const) {
      expect(
        warningCodes(inputWith(factRecord({ fact_kind: "hard_canon", salience: "critical", audience_visibility }))),
        `hard_canon+critical FACT with audience_visibility=${audience_visibility}`
      ).not.toContain(CODE);
    }
  });

  it("does not fire for a hidden FACT that is neither hard_canon nor critical", () => {
    expect(
      warningCodes(inputWith(factRecord({ fact_kind: "current_state", salience: "medium", audience_visibility: "hidden" })))
    ).not.toContain(CODE);
  });

  it("never fires for a SECRET record, even with pov_access knows and audience_visibility hidden", () => {
    const secret: ValidationRecord = {
      id: secretId,
      type: "SECRET",
      payload: {
        id: secretId,
        status: "hidden",
        secret_kind: "body_state",
        secret_claim: "The POV is immortal.",
        holders: [povId],
        non_holders_to_protect: "all_except_holders",
        audience_visibility: "hidden",
        pov_access: "knows",
        salience: "critical",
        allowed_surface_cues: ["Never seems to age."],
        forbidden_reveals: ["Do not state it."],
        reveal_permission: "locked",
        reveal_triggers: []
      }
    };

    expect(warningCodes(inputWith(secret))).not.toContain(CODE);
  });
});
