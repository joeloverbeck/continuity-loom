import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildAcceptanceManifest,
  buildAuditScaffold,
  selectAcceptanceManifest
} from "./build-acceptance-manifest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const validator = resolve(here, "validate-closeout-body.mjs");
const builder = resolve(here, "build-acceptance-manifest.mjs");
const skillRoot = resolve(here, "..");
const normalReviewValidator = resolve(skillRoot, "../code-review/scripts/validate-review-normal-body.mjs");

const issueInput = [
  {
    number: 359,
    title: "First slice",
    body: `## Acceptance criteria

- [ ] First exact behavior
- [x] Second exact behavior
  with a continuation

## Principles

- Follow the named principle.
`
  }
];

const evidence =
  "atoms: atomic; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs; sequence: N/A because criterion is not sequence-sensitive";
const expectedFinalSha = "abcdef0123456789";

const closeoutBody = (rows) => `Implementation closeout

Final SHA: ${expectedFinalSha}
Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| \`node --test\` | passed - 3 tests | 1 | \`${expectedFinalSha}\` |

N/A because no tdd skill was invoked
Review frame: fixed point input HEAD~1; fixed point resolved SHA 1234567890abcdef; reviewed HEAD SHA ${expectedFinalSha}; diff command git diff HEAD~1...HEAD; commits one; worktree scope test; excluded dirty files none; spec source fixture.
Review: code-review against abcdef0; outcome no findings; verification rerun node --test.
Browser evidence: N/A because process-only work changed no browser-consumed surface
Console state: N/A because browser evidence is N/A
Final freshness delta: N/A because browser evidence is N/A
Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
${rows.join("\n")}

Closeout body check passed: exact fields inspected.
Closeout preflight:
- Audit sink: local test body
- Final SHA: ${expectedFinalSha}

Closeout gate passed: audit sink local test body.
`;

const auditBody = (rows) => `| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
${rows.join("\n")}
`;

const auditChunkBody = (rows, sharedEvidenceCoreUrl) => `Acceptance evidence chunk

Final SHA: ${expectedFinalSha}

Shared evidence core: ${sharedEvidenceCoreUrl}

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
${rows.join("\n")}

Audit chunk body check passed: exact manifest rows inspected and shared evidence core exact-read verified.
`;

const runValidator = (body, manifest, modeFlags = ["--closing"], expectedSha = expectedFinalSha) => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-test-"));
  const bodyPath = join(directory, "body.md");
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(bodyPath, body);
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const closingFlags = modeFlags.includes("--closing") && expectedSha && !modeFlags.includes("--expected-final-sha")
    ? [...modeFlags, "--expected-final-sha", expectedSha]
    : modeFlags;
  const result = spawnSync(
    process.execPath,
    [validator, bodyPath, ...closingFlags, "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });
  return result;
};

test("buildAcceptanceManifest preserves source order and adds Principles", () => {
  const manifest = buildAcceptanceManifest(issueInput);

  assert.deepEqual(manifest.issues[0].checks, [
    { id: "AC1", kind: "acceptance", text: "First exact behavior" },
    { id: "AC2", kind: "acceptance", text: "Second exact behavior with a continuation" },
    { id: "Principles", kind: "principles", text: "Principles/ADR conformance for #359" }
  ]);
  assert.match(buildAuditScaffold(manifest), /\| #359 \| AC2 - Second exact behavior with a continuation \|/);
});

test("buildAcceptanceManifest keeps an empty Principles heading as a required check", () => {
  const manifest = buildAcceptanceManifest({
    number: 360,
    body: "## Acceptance criteria\n\n- [ ] One behavior\n\n## Principles\n"
  });

  assert.equal(manifest.issues[0].checks.at(-1).id, "Principles");
});

test("buildAcceptanceManifest expands parent PRD sections and individual user stories", () => {
  const manifest = buildAcceptanceManifest({
    number: 391,
    title: "PRD: Parent coverage",
    body: `## Problem Statement

The workflow is incomplete.

## Solution

Complete the workflow.

## User Stories

1. As a steward, I want the first behavior, so that the workflow is complete
2. As a reviewer, I want the second behavior,
   so that the evidence is exact

## Implementation Decisions

- Keep policy server-owned.

## Testing Decisions

- Exercise the production seam.

## Principles
`
  });

  assert.deepEqual(manifest.issues[0].checks, [
    {
      id: "Parent-Solution",
      kind: "parent-prd-section",
      text: "Parent PRD ## Solution section"
    },
    {
      id: "US1",
      kind: "user-story",
      text: "As a steward, I want the first behavior, so that the workflow is complete"
    },
    {
      id: "US2",
      kind: "user-story",
      text: "As a reviewer, I want the second behavior, so that the evidence is exact"
    },
    {
      id: "Parent-Implementation-Decisions",
      kind: "parent-prd-section",
      text: "Parent PRD ## Implementation Decisions section"
    },
    {
      id: "Parent-Testing-Decisions",
      kind: "parent-prd-section",
      text: "Parent PRD ## Testing Decisions section"
    },
    {
      id: "Principles",
      kind: "principles",
      text: "Principles/ADR conformance for #391"
    }
  ]);
});

test("selectAcceptanceManifest emits deterministic issue and check subsets", () => {
  const full = buildAcceptanceManifest([
    {
      number: 391,
      body: `## Problem Statement

Problem.

## Solution

Solution.

## User Stories

1. As a steward, I want one behavior, so that one outcome follows
2. As a steward, I want another behavior, so that another outcome follows

## Testing Decisions

- Test both.

## Principles
`
    },
    {
      number: 392,
      body: "## Acceptance criteria\n\n- [ ] Child behavior\n"
    }
  ]);

  const subset = selectAcceptanceManifest(full, [
    "391:US2,Parent-Testing-Decisions",
    "392"
  ]);

  assert.deepEqual(
    subset.issues.map((issue) => [issue.number, issue.checks.map((check) => check.id)]),
    [
      [391, ["US2", "Parent-Testing-Decisions"]],
      [392, ["AC1"]]
    ]
  );
  const audit = buildAuditScaffold(subset);
  assert.match(audit, /\| #391 \| US2 - As a steward/);
  assert.match(audit, /\| #392 \| AC1 - Child behavior/);
  assert.doesNotMatch(audit, /Parent-Solution/);
  assert.throws(
    () => selectAcceptanceManifest(full, ["391:US99"]),
    /selector references missing check #391:US99/
  );
});

test("manifest CLI writes JSON and audit scaffold from saved issue output", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-manifest-test-"));
  const inputPath = join(directory, "issues.json");
  const manifestPath = join(directory, "manifest.json");
  const auditPath = join(directory, "audit.md");
  writeFileSync(inputPath, JSON.stringify({ issues: issueInput }));

  const result = spawnSync(
    process.execPath,
    [builder, inputPath, "--output", manifestPath, "--audit-output", auditPath],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(manifestPath, "utf8")).issues[0].checks.length, 3);
  assert.match(readFileSync(auditPath, "utf8"), /\| #359 \| Principles - Principles\/ADR conformance/);
  rmSync(directory, { recursive: true, force: true });
});

test("manifest CLI writes a selected check subset and matching audit scaffold", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-manifest-subset-test-"));
  const inputPath = join(directory, "issues.json");
  const manifestPath = join(directory, "manifest.json");
  const auditPath = join(directory, "audit.md");
  writeFileSync(inputPath, JSON.stringify({ issues: issueInput }));

  const result = spawnSync(
    process.execPath,
    [
      builder,
      inputPath,
      "--select",
      "359:AC2,Principles",
      "--output",
      manifestPath,
      "--audit-output",
      auditPath
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    JSON.parse(readFileSync(manifestPath, "utf8")).issues[0].checks.map((check) => check.id),
    ["AC2", "Principles"]
  );
  assert.doesNotMatch(readFileSync(auditPath, "utf8"), /\| #359 \| AC1 -/);
  assert.match(readFileSync(auditPath, "utf8"), /\| #359 \| AC2 -/);
  rmSync(directory, { recursive: true, force: true });
});

test("closeout validator accepts exact one-to-one manifest coverage", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 0, result.stderr);
});

test("closing validator requires a live expected final SHA", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest,
    ["--closing"],
    null
  );

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--closing requires --expected-final-sha/);
});

test("closing validator compares every Final SHA and reviewed HEAD SHA with live HEAD", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const staleFinal = runValidator(
    body.replace(`Final SHA: ${expectedFinalSha}`, "Final SHA: 1111111222222222"),
    manifest
  );
  const staleReview = runValidator(
    body.replace(`reviewed HEAD SHA ${expectedFinalSha}`, "reviewed HEAD SHA 3333333444444444"),
    manifest
  );

  assert.equal(staleFinal.status, 1);
  assert.match(staleFinal.stderr, /Final SHA 1111111222222222 does not match expected final SHA/);
  assert.equal(staleReview.status, 1);
  assert.match(staleReview.stderr, /reviewed HEAD SHA 3333333444444444 does not match expected final SHA/);
});

test("closing validator requires final-tree verification ledger rows", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const missing = runValidator(
    body.replace(
      /\| Exact command \| Observed result\/counts \| Run count \| Represented SHA\/tree \|\n\|---\|---\|---:\|---\|\n\| `node --test` \| passed - 3 tests \| 1 \| `abcdef0123456789` \|/,
      "- node --test: passed"
    ),
    manifest
  );
  const staleTree = runValidator(
    body.replace(`\`${expectedFinalSha}\` |`, "`5555555666666666` |"),
    manifest
  );
  const badCount = runValidator(body.replace("| passed - 3 tests | 1 |", "| passed - 3 tests | many |"), manifest);

  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /missing verification command ledger header/);
  assert.equal(staleTree.status, 1);
  assert.match(staleTree.stderr, /represents 5555555666666666, not expected final SHA/);
  assert.equal(badCount.status, 1);
  assert.match(badCount.stderr, /run count must be a positive integer/);
});

test("emit-preflight prints the exact validated preflight block and gate line", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const result = runValidator(body, manifest, ["--closing", "--emit-preflight"]);
  const expected = `Closeout preflight:\n- Audit sink: local test body\n- Final SHA: ${expectedFinalSha}\n\nCloseout gate passed: audit sink local test body.\n\nPost-comment verification next: after gh issue comment --body-file returns a URL, run node .claude/skills/implement/scripts/verify-github-comment-body.mjs "$comment_url" "$body" before any close command.\n`;

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, expected);
});

test("ordinary closing validation warns that it is not mutation-ready", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const result = runValidator(body, manifest);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /not mutation-ready/i);
  assert.match(result.stdout, /--emit-preflight --mutation-ready/);
});

test("mutation-ready validation requires and confirms preflight emission", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const missingEmit = runValidator(body, manifest, ["--closing", "--mutation-ready"]);
  const ready = runValidator(body, manifest, ["--closing", "--emit-preflight", "--mutation-ready"]);

  assert.equal(missingEmit.status, 2);
  assert.match(missingEmit.stderr, /--mutation-ready requires --emit-preflight/);
  assert.equal(ready.status, 0, ready.stderr);
  assert.match(ready.stdout, /Mutation-ready closeout validation passed/);
  assert.match(
    ready.stdout,
    /Accepted residuals: 0; affected axes none; durable record local test body; unhandled findings none beyond accepted residuals\./
  );
});

test("final-summary emission derives accepted residual count, axis, and required wording", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Browser evidence: N/A because process-only work changed no browser-consumed surface",
    `- **Accepted residual**: Context-specific availability wording remains separate\n  - **Axis**: Standards\n  - **Source**: final Standards review\n  - **Rationale**: the two consumers present different decisions\n  - **Revisit trigger**: a third consumer appears\n\nBrowser evidence: N/A because process-only work changed no browser-consumed surface`
  );
  const result = runValidator(body, manifest, ["--closing", "--emit-final-summary"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /Accepted residuals: 1; affected axes Standards; durable record local test body; unhandled findings none beyond accepted residuals\./
  );
});

test("final-summary emission reads accepted residuals from the structured review ledger", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const findingLedger = `| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-standards-1 | P1 | Standards | reviewer-1 | Context-specific wording remains separate | standards-only | N/A because accepted residual is intentional | accepted with rationale | node --test passed | accepted residual |`;
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Browser evidence: N/A because process-only work changed no browser-consumed surface",
    `${findingLedger}\n\nBrowser evidence: N/A because process-only work changed no browser-consumed surface`
  );
  const result = runValidator(body, manifest, ["--closing", "--emit-final-summary"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /Accepted residuals: 1; affected axes Standards; durable record local test body; unhandled findings none beyond accepted residuals\./
  );
});

test("final-summary emission does not double-count residuals shared by the finding ledger and structured records", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const findingLedger = `| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-standards-1 | P1 | Standards | reviewer-1 | Duplicated helper repeats the optimistic rollback shape | standards-only | N/A because accepted residual is intentional | accepted with rationale | node --test passed | accepted residual |
| P1-spec-1 | P1 | Spec | reviewer-2 | Recovery branch is subsumed into the retry path | conformance-only | N/A because accepted residual is intentional | accepted with rationale | node --test passed | accepted residual |`;
  const structuredResiduals = `- **Accepted residual**: Duplicated optimistic rollback helper
  - **Axis**: Standards
  - **Source**: P1-standards-1
  - **Rationale**: the two helpers differ in error surfacing
  - **Revisit trigger**: a third call site appears
- **Accepted residual**: Subsumed recovery branch
  - **Axis**: Spec
  - **Source**: P1-spec-1
  - **Rationale**: no dangling link can arise from the detail
  - **Revisit trigger**: a back-pointer data model is introduced`;
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Browser evidence: N/A because process-only work changed no browser-consumed surface",
    `${findingLedger}\n\n${structuredResiduals}\n\nBrowser evidence: N/A because process-only work changed no browser-consumed surface`
  );
  const result = runValidator(body, manifest, ["--closing", "--emit-final-summary"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /Accepted residuals: 2; affected axes Standards, Spec; durable record local test body; unhandled findings none beyond accepted residuals\./
  );
});

test("linked audit chunks validate exact rows without repeating the shared evidence core", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const sharedEvidenceCoreUrl = "https://github.com/example/repo/issues/359#issuecomment-123";
  const body = auditChunkBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ], sharedEvidenceCoreUrl);
  const result = runValidator(body, manifest, [
    "--closing",
    "--audit-chunk",
    "--shared-evidence-core-url",
    sharedEvidenceCoreUrl
  ]);
  const repeatedReview = runValidator(`${body}\nReview: duplicated from shared core\n`, manifest, [
    "--closing",
    "--audit-chunk",
    "--shared-evidence-core-url",
    sharedEvidenceCoreUrl
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Acceptance audit chunk validation passed/);
  assert.match(result.stdout, new RegExp(sharedEvidenceCoreUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(repeatedReview.status, 1);
  assert.match(repeatedReview.stderr, /forbidden repeated review evidence/);
});

test("audit-only validator accepts a review-ready audit without closeout fields", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    auditBody([
      `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest,
    ["--audit-only", "--review-entry"]
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Acceptance audit validation passed/);
});

test("audit-only validator accepts the exact ideation prompt tag from a manifest criterion", () => {
  const manifest = buildAcceptanceManifest({
    number: 397,
    body: "## Acceptance criteria\n\n- [ ] Render focus once in the existing `<ideation_slots>` request header.\n"
  });
  const body = auditBody([
    `| #397 | AC1 - Render focus once in the existing \`<ideation_slots>\` request header. | ${evidence} | satisfied |`
  ]);

  const result = runValidator(body, manifest, ["--audit-only", "--review-entry"]);

  assert.equal(result.status, 0, result.stderr);
});

test("audit-only validator permits truthful blocked rows until review entry", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = auditBody([
    `| #359 | AC1 - First exact behavior | atoms: behavior; proof surfaces: pending browser; sequence: N/A because criterion is not sequence-sensitive | blocked |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const working = runValidator(body, manifest, ["--audit-only"]);
  const reviewEntry = runValidator(body, manifest, ["--audit-only", "--review-entry"]);

  assert.equal(working.status, 0, working.stderr);
  assert.equal(reviewEntry.status, 1);
  assert.match(reviewEntry.stderr, /review-entry gate row is not satisfied/);
});

test("audit-only mode requires a manifest and rejects closeout flags", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-audit-flags-test-"));
  const bodyPath = join(directory, "audit.md");
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(bodyPath, auditBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`
  ]));
  writeFileSync(manifestPath, JSON.stringify(buildAcceptanceManifest(issueInput)));

  const missingManifest = spawnSync(process.execPath, [validator, bodyPath, "--audit-only"], {
    encoding: "utf8"
  });
  const incompatible = spawnSync(
    process.execPath,
    [validator, bodyPath, "--audit-only", "--closing", "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });

  assert.equal(missingManifest.status, 2);
  assert.match(missingManifest.stderr, /--audit-only requires --acceptance-manifest/);
  assert.equal(incompatible.status, 2);
  assert.match(incompatible.stderr, /--audit-only cannot be combined with --closing/);
});

test("closeout validator rejects missing manifest coverage", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /#359 AC2 requires exactly one audit row with exact criterion text; found 0/);
});

test("closeout validator rejects a matching ID with substituted criterion text", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - Nearby behavior instead | ${evidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /#359 AC1 requires exactly one audit row with exact criterion text; found 0/);
});

test("closeout validator rejects incomplete satisfied-row evidence", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      "| #359 | AC1 - First exact behavior | focused test only | satisfied |",
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing atoms:/);
  assert.match(result.stderr, /missing proof surfaces:/);
  assert.match(result.stderr, /missing sequence:/);
});

test("closeout validator rejects unresolved satisfied-row evidence", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const unresolvedEvidence =
    "atoms: TODO; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs; sequence: N/A because criterion is not sequence-sensitive";
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${unresolvedEvidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /contains an unresolved value/);
});

test("closeout validator rejects circular satisfied-row evidence", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const circularEvidence =
    "atoms: exact named items in this criterion; proof surfaces: server lifecycle suite; sequence: N/A because criterion is not sequence-sensitive";
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${circularEvidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /uses a circular atom or proof-surface reference/);
  assert.match(result.stderr, /proof surfaces must name a concrete test, command, path, route, URL, or tracker reference/);
});

test("closeout validator rejects an unanchored proof surface", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const unanchoredEvidence =
    "atoms: lifecycle start and stop; proof surfaces: server lifecycle suite; sequence: start then stop observed by the suite";
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${unanchoredEvidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /proof surfaces must name a concrete test, command, path, route, URL, or tracker reference/);
});

test("closing validator rejects a body above the configured byte ceiling", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const result = runValidator(
    closeoutBody([
      `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
      `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
      `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
    ]),
    manifest,
    ["--closing", "--max-bytes", "100"]
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /maximum is 100 bytes/);
});

test("closeout validator rejects a superseded inventory without a no-hit sweep", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ])
    .replace(
      "Superseded evidence identities: fixture paths none; browser sessions none",
      "Superseded evidence identities: fixture paths old.json; browser sessions old-session"
    )
    .replace(
      "Superseded-token sweep: N/A because every superseded category is none",
      "Superseded-token sweep: checked the body"
    );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /no hits outside classified identity\/history lines and no active-proof hits/);
});

test("closeout validator accepts terminal punctuation on an all-none superseded inventory", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
    "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none."
  );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 0, result.stderr);
});

test("closeout validator requires the cross-validator-safe superseded sweep", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none\n- Superseded-token sweep: N/A because every superseded category is none",
    "Superseded evidence identities: fixture paths old.json; browser sessions old-session; packet paths/hashes none; active revisions none; artifacts none\n- Superseded-token sweep: rg old.json old-session body.md; no hits outside classified identity/history lines and no active-proof hits; historical-red hits classified as none"
  );

  assert.equal(runValidator(body, manifest).status, 0);
  for (const oneSided of [
    "rg old.json old-session body.md; no active-proof hits; historical-red hits classified as none",
    "rg old.json old-session body.md; no hits outside classified identity/history lines; historical-red hits classified as none"
  ]) {
    const result = runValidator(
      body.replace(
        "rg old.json old-session body.md; no hits outside classified identity/history lines and no active-proof hits; historical-red hits classified as none",
        oneSided
      ),
      manifest
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no hits outside classified identity\/history lines and no active-proof hits/);
  }
});

test("closeout validator compares backend currentness commits with Final SHA", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const base = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Console state: N/A because browser evidence is N/A",
    "Console state: N/A because browser evidence is N/A\nBackend process currentness: server command pnpm dev; restart/reload proof clean start from final committed SHA abcdef0\nEvidence-only backend process currentness: server command pnpm dev; restart/reload proof clean start from final commit abcdef0"
  );

  assert.equal(runValidator(base, manifest).status, 0);
  const stale = runValidator(base.replace("committed SHA abcdef0", "committed SHA 1234567"), manifest);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Backend process currentness names commit 1234567, which does not match Final SHA abcdef0123456789/);
  const staleEvidenceOnly = runValidator(
    base.replace("final commit abcdef0", "final commit 7654321"),
    manifest
  );
  assert.equal(staleEvidenceOnly.status, 1);
  assert.match(staleEvidenceOnly.stderr, /Evidence-only backend process currentness names commit 7654321/);
});

test("closeout validator rejects unresolved current evidence identities", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace("Current evidence identities: fixture paths none", "Current evidence identities: fixture paths TODO");
  const result = runValidator(body, manifest);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /evidence identity refresh contains an unresolved value/);
});

test("closing validator rejects a local staging path in publishable sink fields", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Closeout gate passed: audit sink local test body.",
    "Durable sink/body inspected: `/tmp/worldloom-closeout-359.md`\nCloseout gate passed: audit sink local test body."
  );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /published closeout field Durable sink\/body inspected contains local staging path/);
  assert.match(result.stderr, /use a stable issue\/comment reference/);
});

test("closing validator permits local fixture paths outside publishable sink fields", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Current evidence identities: fixture paths none",
    "Current evidence identities: fixture paths /tmp/worldloom-proof.sqlite"
  );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 0, result.stderr);
});

test("closing validator accepts a complete authority-sensitive withheld fixture identity", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const hash = "a".repeat(64);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Current evidence identities: fixture paths none; browser sessions none",
    `Current evidence identities: fixture paths withheld because issue #359 forbids local path publication; logical fixture world-alpha; content SHA-256 ${hash}; provenance generated from issue #359 seed; browser sessions none`
  );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 0, result.stderr);
});

test("closing validator rejects an incomplete withheld fixture identity", () => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]).replace(
    "Current evidence identities: fixture paths none",
    "Current evidence identities: fixture paths withheld because issue #359 forbids local path publication"
  );
  const result = runValidator(body, manifest);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /withheld fixture identity must include reason, logical fixture, 64-character content SHA-256, and provenance/);
});

test("normal-review template and validator matrix use the normal contract", () => {
  const template = readFileSync(resolve(skillRoot, "references/closeout-templates.md"), "utf8");
  const gates = readFileSync(resolve(skillRoot, "references/tracker-closeout-gates.md"), "utf8");

  assert.match(template, /The review portion above is the normal `code-review` path/);
  assert.doesNotMatch(template, /Review fallback: <fallback line, or N\/A because code-review ran normally>/);
  assert.match(template, /## Standards[\s\S]+## Spec/);
  assert.match(template, /\| Issue \| Acceptance source \| Evidence reviewed \| Findings\/residuals \|/);
  assert.match(template, /--child-family --acceptance-manifest \/tmp\/worldloom-acceptance-manifest\.json/);
  assert.match(gates, /validate-review-normal-body\.mjs/);
  assert.match(gates, /--child-family/);
  assert.match(gates, /--acceptance-manifest <path>/);
  for (const line of gates.split(/\r?\n/).filter((candidate) =>
    candidate.includes("validate-review-fallback-body.mjs") && candidate.includes("--child-family")
  )) {
    assert.match(line, /--acceptance-manifest/);
  }
});

test("implementation guidance carries the audited staging, exactness, and sibling contracts", () => {
  const skill = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");
  const evidenceGuide = readFileSync(resolve(skillRoot, "references/implementation-evidence.md"), "utf8");
  const scopeGuide = readFileSync(resolve(skillRoot, "references/scope-ledger.md"), "utf8");
  const reviewGuide = readFileSync(resolve(skillRoot, "references/review-evidence.md"), "utf8");
  const template = readFileSync(resolve(skillRoot, "references/closeout-templates.md"), "utf8");
  const gates = readFileSync(resolve(skillRoot, "references/tracker-closeout-gates.md"), "utf8");
  const childGuide = readFileSync(resolve(skillRoot, "references/child-family-closeout.md"), "utf8");

  assert.match(skill, /Implementation pre-stage gate passed:/);
  assert.match(skill, /Implementation commit gate passed: staged files scoped yes/);
  assert.match(skill, /Tracked implementation evidence and publishable closeout evidence are separate sinks/);
  assert.match(
    skill,
    /review produced findings or more than one TDD review fix[\s\S]+--evidence-input[\s\S]+--immediate-fix --tdd-parent-rollup[\s\S]+Do not hand-copy/
  );
  assert.match(evidenceGuide, /two independent snapshots or server renders are not equivalent/);
  assert.match(evidenceGuide, /SQLite `.backup`/);
  assert.match(evidenceGuide, /package manifest or lockfile changes/);
  assert.match(evidenceGuide, /artifact disposition/);
  assert.match(evidenceGuide, /## Verification Command Ledger/);
  assert.match(evidenceGuide, /\| Exact command \| Observed result\/counts \| Run count \| Represented SHA\/tree \|/);
  assert.match(evidenceGuide, /publish only rows whose represented\s+SHA\/tree is the final SHA/);
  assert.match(evidenceGuide, /published current artifact is not safe to remove until closeout is complete/);
  assert.match(evidenceGuide, /Before starting or attaching to any proof server, inspect the configured API\/UI ports/);
  assert.match(evidenceGuide, /fixture paths withheld because <authority and reason>/);
  assert.match(scopeGuide, /save one canonical ordered JSON snapshot/);
  assert.match(scopeGuide, /capture-github-issues\.mjs <issue\.\.\.> --output \/tmp\/worldloom-issues\.json/);
  assert.match(scopeGuide, /Artifact disposition:/);
  assert.match(template, /## Sibling-Issue Rollup/);
  assert.match(template, /capture-github-issues\.mjs 369 370 371/);
  assert.match(template, /build-closeout-body\.mjs/);
  assert.match(template, /--scope issue-set --anchor 369/);
  assert.doesNotMatch(template, /--parent 369[^\n]*--fixed-child pending/);
  assert.match(template, /--audit-chunk --shared-evidence-core-url/);
  assert.match(template, /Linked acceptance-audit chunks:/);
  assert.match(template, /--review normal --immediate-fix/);
  assert.match(template, /--expected-final-sha "\$\(git rev-parse HEAD\)" --emit-preflight --mutation-ready/);
  assert.match(reviewGuide, /Two-sink boundary/);
  assert.match(reviewGuide, /Do not amend a tracked evidence report solely to append/);
  assert.match(template, /stable issue reference before tracker URL exists/);
  assert.match(template, /Review subagents: Standards initial reviewer <ID> completed, final reviewer <ID> completed; Spec initial reviewer <ID> completed, final reviewer <ID> completed/);
  assert.match(template, /keyed review finding ledger/);
  assert.match(template, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(template, /verify-github-comment-body\.mjs "\$comment_url" "\$body"/);
  assert.match(template, /Nested-validator angle-token rule/);
  assert.match(template, /65,536-byte maximum/);
  assert.match(template, /wc -c "\$body"/);
  assert.match(template, /Do not recover space with circular evidence/);
  assert.match(template, /one or more rows per manifest issue/);
  assert.match(template, /unique `\(issue, seam\)` tuple/);
  assert.match(template, /Authority-sensitive alternative when local fixture paths must not be published/);
  assert.match(reviewGuide, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(reviewGuide, /machine-derived `Accepted residuals:` line into the final response/);
  assert.doesNotMatch(template, /Durable sink\/body inspected: <inspected body file path/);
  assert.match(gates, /Working pre-review audit/);
  assert.match(gates, /--audit-only --acceptance-manifest/);
  assert.match(gates, /Never drop `--expected-final-sha` from a closing validation/);
  assert.match(gates, /copy the emitted `Closeout preflight:` block plus `Closeout gate passed:` line verbatim/);
  assert.match(gates, /two or more sibling issues with no parent PRD/);
  assert.match(gates, /nested validator may classify the entire cell as unresolved/);
  assert.match(gates, /default hard stop is 65,536 bytes/);
  assert.match(gates, /atoms or surfaces point circularly/);
  assert.match(gates, /exact stored-body verification with `verify-github-comment-body\.mjs`/);
  assert.match(gates, /Post-comment verification next:/);
  assert.match(gates, /not mutation-ready/);
  assert.match(gates, /--emit-final-summary/);
  assert.match(gates, /Linked acceptance-audit chunk/);
  assert.match(childGuide, /Low-headroom split exception/);
  assert.match(childGuide, /shared evidence core/);
  assert.match(childGuide, /Post and read back every disjoint evidence chunk before closing any issue/);
  assert.match(childGuide, /--audit-chunk --shared-evidence-core-url/);
  assert.match(childGuide, /Linked acceptance-audit chunks:/);
  assert.match(childGuide, /verify-github-comment-body\.mjs <parent-comment-url> <parent-body>/);
  assert.match(childGuide, /verify-github-comment-body\.mjs <child-comment-url> <child-body>/);
  assert.match(skill, /published `Current evidence identities:` inventory is not safe to remove/);
  assert.match(skill, /--emit-preflight --mutation-ready/);
  assert.match(skill, /--emit-final-summary/);
});

test("documented normal-review fields satisfy the normal-review validator", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-normal-review-test-"));
  const bodyPath = join(directory, "normal-review.md");
  const manifestPath = join(directory, "acceptance-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(buildAcceptanceManifest(issueInput)));
  writeFileSync(
    bodyPath,
    `Review: code-review against abcdef0; outcome no findings; verification rerun node --test.
Review subagents: Standards final reviewer reviewer-1 completed; Spec final reviewer reviewer-2 completed
Review subagent cleanup: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion
Review subagent cleanup proof: Standards reviewer reviewer-1 terminal status completed; no close primitive surfaced; Spec reviewer reviewer-2 terminal status completed; no close primitive surfaced
Pre-dispatch Standards source inventory: AGENTS.md | CLAUDE.md | smell baseline
Pre-dispatch Spec source inventory: issue #359

## Standards

Handoff Standards source inventory: AGENTS.md | CLAUDE.md | smell baseline
Sources reviewed: AGENTS.md
Findings: none

## Spec

Handoff Spec source inventory: issue #359
Sources reviewed: issue #359
Findings: none

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #359 | issue #359 AC1, AC2, Principles; sequence: N/A because these criteria are not sequence-sensitive | validator integration test | none |

Axis summary: Standards 0/none, Spec 0/none
Residual findings: none
Backend process currentness: N/A because no browser/manual evidence was used
Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none
`
  );

  const result = spawnSync(
    process.execPath,
    [normalReviewValidator, bodyPath, "--child-family", "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });
  assert.equal(result.status, 0, result.stderr);
});
