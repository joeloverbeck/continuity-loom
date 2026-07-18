import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validateResearchBrief } from "./validate-research-brief.mjs";

const BRIEF_ID = "CMGR-TEST-2026-07-18-01";
const checkedRows = [
  "Artifact set verified.",
  "Target identity verified.",
  "Internal source access verified.",
  "Ref-backed paths verified.",
  "Method map verified.",
  "Operating envelope verified.",
  "Adopted lineage verified.",
  "Settled negatives verified.",
  "Candidates remain hypotheses.",
  "Open-ended sweep required.",
  "External fields selected by function.",
  "Recommendation contract complete.",
  "Citation rules explicit.",
  "Negative findings required.",
  "Executor authority bounded.",
  "Post-report consumption route explicit.",
  "No completeness claim made."
];

function briefBody({ bundle = false, appendix = "" } = {}) {
  const packetIdentity = bundle
    ? "bundle manifest with exact file hashes"
    : "fully inlined evidence with exact hashes";
  const internalAccess = bundle
    ? "verified direct references plus attached evidence bundle"
    : "fully inlined";
  const evidenceBundle = bundle ? "commission.evidence" : "none";
  const bundleManifest = bundle ? "commission.evidence/manifest.json" : "none";

  return `# Research Brief — Method-Gap Audit of Test Skill

Brief ID: ${BRIEF_ID}

## 0. Commission

- Audited skill: test-skill at .claude/skills/test-skill, unversioned
- Repository scope: /workspace/repository from the nearest Git root
- Source identity: current SHA-256 and immutable baseline
- Evidence-packet identity: ${packetIdentity}
- Decision owner: repository owner
- Commissioner: commission-method-gap-research
- Research executor: authorized external researcher
- Audit date: 2026-07-18
- Prior audit: never
- In-flight or unconsumed work: none
- Internal-source access: ${internalAccess}
- External-source access: public primary sources as of 2026-07-18
- Privacy and sanitization: exclude secrets and private story material

Recommendation: **commission now**.

This bounded commission does not authorize edits to the skill or adoption of recommendations.

## 1. Objective

Identify consequential missing method capabilities. This audit cannot establish that no further
gaps exist.

## 2. Intended outcomes and internal improvement loop

Map outcomes, claims, instruments, evidence, authority, and revision routes.

## 3. Operating envelope

Keep recommendations within one maintainer's bounded time and tools.

## 4. Evidence packet

### Commission artifact set

- Brief: commission.md
- Evidence bundle: ${evidenceBundle}
- Bundle manifest: ${bundleManifest}

The packet identifies current skill machinery and empirical history.

## 5. Adopted-lineage fence

No adopted prior research line exists.

## 6. Settled-negative and run-scope fences

Product policy remains outside this commission.

## 7. Candidate gap areas

The executor must test one locally grounded candidate and perform an open sweep.

## 8. External knowledge bases

Use fields selected for the missing function.

## 9. Research tasks

Reconstruct coverage, test candidates, and prioritize surviving recommendations.

## 10. Recommendation contract

Each recommendation owes prior art, adaptation, costs, a witness, risks, disposition, and landing
target.

## 11. Citation rules

Use claim-level citations and mark inaccessible claims relayed—unverified.

## 12. Deliverable

Return one consolidated, prioritized report with negative findings.

## 13. Authority and consumption boundary

Do not edit the skill or adopt recommendations. The owner adjudicates every result.

## 14. Completion condition

Deliver every scoped result. Bounded research cannot establish that no further method gaps exist.

### Exact executor handoff

Use this complete commission artifact set as the sole instruction. Return one consolidated report.
Do not edit the repository or adopt recommendations; mark inaccessible claims relayed—unverified.

## Commission validation

${checkedRows.map((row) => `- [x] ${row}`).join("\n")}
${appendix}`;
}

function withTempDirectory(run) {
  const directory = mkdtempSync(join(tmpdir(), "commission-brief-validator-"));
  try {
    return run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function writeBrief(directory, source = briefBody()) {
  const briefPath = join(directory, "commission.md");
  writeFileSync(briefPath, source);
  return briefPath;
}

function materializeBundle(directory) {
  const bundlePath = join(directory, "commission.evidence");
  const filesDirectory = join(bundlePath, "files");
  const bytes = Buffer.from("current target reference\n");
  mkdirSync(filesDirectory, { recursive: true });
  writeFileSync(join(filesDirectory, "reference.md"), bytes);
  writeFileSync(
    join(bundlePath, "manifest.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        briefId: BRIEF_ID,
        files: [
          {
            path: "files/reference.md",
            sourcePath: ".claude/skills/test-skill/references/reference.md",
            sha256: createHash("sha256").update(bytes).digest("hex"),
            bytes: bytes.length
          }
        ]
      },
      null,
      2
    )
  );
  return bundlePath;
}

test("accepts a complete inline research brief", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(directory);
    assert.deepEqual(validateResearchBrief(briefPath), []);
  });
});

test("rejects a missing or reordered numbered section", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(
      directory,
      briefBody().replace("## 8. External knowledge bases", "## External knowledge bases")
    );
    assert.ok(
      validateResearchBrief(briefPath).some((error) =>
        error.includes("## 8. External knowledge bases must appear exactly once")
      )
    );
  });
});

test("rejects unresolved template placeholders", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(directory, briefBody().replace("Test Skill", "[SKILL NAME]"));
    assert.ok(
      validateResearchBrief(briefPath).some((error) =>
        error.includes("Unresolved template placeholder")
      )
    );
  });
});

test("rejects a non-commission cadence outcome", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(
      directory,
      briefBody().replace("**commission now**", "**postpone**")
    );
    assert.ok(
      validateResearchBrief(briefPath).some((error) =>
        error.includes("permitted only for a commission now")
      )
    );
  });
});

test("rejects an incomplete handoff or unchecked validation row", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(
      directory,
      briefBody()
        .replace("Do not edit the repository or adopt recommendations", "Return the report")
        .replace("- [x] Artifact set verified.", "- [ ] Artifact set verified.")
    );
    const errors = validateResearchBrief(briefPath);
    assert.ok(errors.some((error) => error.includes("executor handoff")));
    assert.ok(errors.some((error) => error.includes("unchecked rows")));
  });
});

test("verifies canonical inline base64 payload hashes", () => {
  withTempDirectory((directory) => {
    const bytes = Buffer.from("hello");
    const appendix = `
## Appendix A — Current bytes

Path: references/current.md

Current SHA-256: ${createHash("sha256").update(bytes).digest("hex")}

Encoding: base64, no line wrapping.

~~~~text
${bytes.toString("base64")}
~~~~
`;
    const briefPath = writeBrief(directory, briefBody({ appendix }));
    assert.deepEqual(validateResearchBrief(briefPath), []);

    writeFileSync(
      briefPath,
      briefBody({
        appendix: appendix.replace(
          /Current SHA-256: [a-f0-9]{64}/,
          `Current SHA-256: ${"0".repeat(64)}`
        )
      })
    );
    assert.ok(
      validateResearchBrief(briefPath).some((error) =>
        error.includes("Inline base64 SHA-256 mismatch")
      )
    );
  });
});

test("verifies a canonical sibling evidence bundle", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(directory, briefBody({ bundle: true }));
    const bundlePath = materializeBundle(directory);
    assert.deepEqual(validateResearchBrief(briefPath, { bundlePath }), []);
  });
});

test("rejects unmanifested or hash-mismatched bundle files", () => {
  withTempDirectory((directory) => {
    const briefPath = writeBrief(directory, briefBody({ bundle: true }));
    const bundlePath = materializeBundle(directory);
    writeFileSync(join(bundlePath, "files", "extra.md"), "not declared\n");
    writeFileSync(join(bundlePath, "files", "reference.md"), "changed bytes\n");

    const errors = validateResearchBrief(briefPath, { bundlePath });
    assert.ok(errors.some((error) => error.includes("Manifest byte count mismatch")));
    assert.ok(errors.some((error) => error.includes("Manifest SHA-256 mismatch")));
    assert.ok(errors.some((error) => error.includes("unmanifested file")));
  });
});
