import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
import {
  DEFAULT_CLOSEOUT_BODY_MAX_BYTES,
  DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES,
  assertCloseoutBodySize,
  buildCloseoutBodyPlan,
  buildCloseoutBodyScaffold,
  buildCloseoutBodySizePlan,
  validateAuditInput
} from "./build-closeout-body.mjs";
import { validateReviewSpecCoverage } from "../../code-review/scripts/review-evidence-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const builder = resolve(here, "build-closeout-body.mjs");
const implementValidator = resolve(here, "validate-closeout-body.mjs");
const normalReviewValidator = resolve(here, "../../code-review/scripts/validate-review-normal-body.mjs");
const tddValidator = resolve(here, "../../tdd/scripts/validate-tdd-closeout-body.mjs");

const manifest = buildAcceptanceManifest([
  {
    number: 364,
    title: "Parent PRD",
    body: `## Acceptance criteria

- [ ] Parent behavior

## Principles
`
  },
  {
    number: 368,
    title: "Replay child",
    body: `## Acceptance criteria

- [ ] Replay the production route
`
  }
]);

const structuredEvidence = {
  tddRows: [
    {
      issue: 364,
      contextStatus: "absent",
      authorityStatus: "Principles read",
      seam: "parent integration",
      red: "red-first skipped because the parent row is evidence-only",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      acceptance: "AC1, Principles; atoms: parent behavior; proof surfaces: .claude/skills/implement/scripts/build-closeout-body.test.mjs; sequence: N/A because the criterion is not sequence-sensitive",
      reviewDisposition: "coverage-only parent proof"
    },
    {
      issue: 368,
      contextStatus: "absent",
      authorityStatus: "active docs read",
      seam: "replay route",
      red: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because the replay assertion did not match",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      acceptance: "AC1; atoms: production replay; proof surfaces: .claude/skills/implement/scripts/build-closeout-body.test.mjs; sequence: request -> replay -> assertion",
      reviewDisposition: "review fixes mapped below"
    }
  ],
  tddReviewFixes: [
    {
      id: "RF-1",
      finding: "first behavior repair",
      red: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because the RF-1 assertion did not match",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-1",
      issue: 368,
      seam: "replay route",
      durability: "durable regression test added at build-closeout-body.test.mjs",
      browserFreshness: "N/A because no browser/manual evidence applies",
      backendCurrentness: "N/A because no browser/manual evidence was used",
      identityRefresh: "current revision refreshed"
    },
    {
      id: "RF-2",
      finding: "spec coverage repair",
      red: "coverage-only review fix; red-first N/A because behavior already existed and no code changed",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-2",
      issue: 364,
      seam: "parent integration",
      durability: "durable regression test added at build-closeout-body.test.mjs",
      browserFreshness: "N/A because no browser/manual evidence applies",
      backendCurrentness: "N/A because no browser/manual evidence was used",
      identityRefresh: "current revision refreshed"
    },
    {
      id: "RF-3",
      finding: "second-pass behavior repair",
      red: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because the RF-3 assertion did not match",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-3",
      issue: 368,
      seam: "replay route",
      durability: "durable regression test added at build-closeout-body.test.mjs",
      browserFreshness: "N/A because no browser/manual evidence applies",
      backendCurrentness: "N/A because no browser/manual evidence was used",
      identityRefresh: "current revision refreshed"
    }
  ],
  reviewFindings: [
    {
      id: "P1-standards-1",
      severity: "high",
      reviewer: "standards-initial",
      originalFinding: "first behavior repair",
      repairClass: "behavior",
      tddDisposition: "RF-1",
      repair: "first behavior repaired",
      rerunEvidence: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-1",
      finalStatus: "fixed"
    },
    {
      id: "P1-spec-1",
      severity: "medium",
      reviewer: "spec-initial",
      originalFinding: "spec coverage repair",
      repairClass: "coverage-only",
      tddDisposition: "RF-2",
      repair: "spec coverage added",
      rerunEvidence: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-2",
      finalStatus: "fixed"
    },
    {
      id: "P2-standards-1",
      severity: "medium",
      reviewer: "standards-final",
      originalFinding: "second-pass behavior repair",
      repairClass: "behavior",
      tddDisposition: "RF-3",
      repair: "second-pass behavior repaired",
      rerunEvidence: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-3",
      finalStatus: "fixed"
    }
  ]
};

const structuredAuditRows = manifest.issues.flatMap((issue) =>
  issue.checks.map((check) => ({
    issue: issue.number,
    checkId: check.id,
    atoms: `exact ${check.id} behavior`,
    proofSurfaces: ".claude/skills/implement/scripts/build-closeout-body.test.mjs and `node --test`",
    sequence: "N/A because the criterion is not sequence-sensitive",
    status: "satisfied"
  }))
);

const completeStructuredEvidenceBody = (generated) => generated
  .replace(
    /^Review frame:.*$/m,
    "Review frame: fixed point input abcdef0; fixed point resolved SHA abcdef0; reviewed HEAD SHA fedcba9; diff command `git diff abcdef0...HEAD`; commits fedcba9; worktree scope implement skill; excluded dirty files none; spec source issues #364 and #368."
  )
  .replace(
    /^Review:.*$/m,
    "Review: code-review against abcdef0; outcome findings fixed in SHA fedcba9; verification rerun node --test passed."
  )
  .replace(
    /^Review subagents:.*$/m,
    "Review subagents: Standards initial reviewer standards-initial completed, final reviewer standards-final completed; Spec initial reviewer spec-initial completed, final reviewer spec-final completed"
  )
  .replace(
    /^Review subagent cleanup:.*$/m,
    "Review subagent cleanup: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion"
  )
  .replace(
    /^Review subagent cleanup proof:.*$/m,
    "Review subagent cleanup proof: Standards reviewers standards-initial and standards-final terminal status completed; no close primitive surfaced; Spec reviewers spec-initial and spec-final terminal status completed; no close primitive surfaced"
  )
  .replace(
    /^(?:Pre-dispatch|Handoff) Standards source inventory:.*$/gm,
    (line) => `${line.split(":")[0]}: AGENTS.md | CLAUDE.md | smell baseline`
  )
  .replace(
    /^(?:Pre-dispatch|Handoff) Spec source inventory:.*$/gm,
    (line) => `${line.split(":")[0]}: issue #364 | issue #368`
  )
  .replace(/^Sources reviewed:.*$/gm, "Sources reviewed: AGENTS.md, active issue bodies, and the implementation diff")
  .replace(/^Findings:.*$/gm, "Findings: none")
  .replace(
    /^\| #364 \| AC1, Principles; sequence:.*$/m,
    "| #364 | AC1, Principles; sequence: N/A because the criteria are not sequence-sensitive | implementation diff and node --test | none |"
  )
  .replace(
    /^\| #368 \| AC1; sequence:.*$/m,
    "| #368 | AC1; sequence: request -> replay -> assertion | implementation diff and node --test | none |"
  )
  .replace(/^Axis summary:.*$/m, "Axis summary: Standards 0/none, Spec 0/none")
  .replace(/^Residual findings:.*$/m, "Residual findings: none")
  .replace(/^Parent PRD coverage:.*$/m, "Parent PRD coverage: N/A because this fixture is not a parent PRD")
  .replace(
    /^Spec sequence coverage:.*$/m,
    "Spec sequence coverage: sequence: request -> replay -> assertion observed by the integration test"
  )
  .replace(
    /^Browser\/manual evidence freshness:.*$/m,
    "Browser/manual evidence freshness: N/A because no browser/manual evidence was used"
  )
  .replace(
    /^Browser\/manual console state:.*$/m,
    "Browser/manual console state: N/A because no browser/manual evidence was used"
  )
  .replace(
    /^Backend process currentness:.*$/m,
    "Backend process currentness: N/A because no browser/manual evidence was used"
  )
  .replace(/^Commit handling:.*$/m, "Commit handling: follow-up commit fedcba9")
  .replace(
    /^Existing-test contract-change rows:.*$/gm,
    "Existing-test contract-change rows: none"
  )
  .replace(
    /^Browser\/manual freshness:.*$/m,
    "Browser/manual freshness: N/A because no browser/manual evidence applies"
  )
  .replace(
    /^- Durable sink\/body inspected:.*$/m,
    "- Durable sink/body inspected: structured evidence integration test fixture"
  )
  .replace(/^- Compact table\/header:.*$/m, "- Compact table/header: present after structural check")
  .replace(
    /^- Pre-red recovery status:.*$/m,
    "- Pre-red recovery status: N/A because the pre-red preflight/table was visible before first red"
  )
  .replace(
    /^- Pre-red evidence reference:.*$/m,
    "- Pre-red evidence reference: durable sink issue #364; exact heading TDD closeout preflight; line order proves this section precedes the first red command"
  )
  .replace(/^- CONTEXT\.md status:.*$/m, "- CONTEXT.md status: absent")
  .replace(/^- ADRs\/principles\/docs status:.*$/m, "- ADRs/principles/docs status: active docs read")
  .replace(
    /^- Acceptance atom map:.*$/m,
    "- Acceptance atom map: all rows list authoritative atoms and proof surfaces"
  )
  .replace(
    /^- Acceptance sequence map:.*$/m,
    "- Acceptance sequence map: all rows list ordered proof or justified sequence N/A"
  )
  .replace(/^- Partial-red \/ red-first skip reasons:.*$/m, "- Partial-red / red-first skip reasons: parent row is evidence-only")
  .replace(/^- Evidence-only rows freshness:.*$/m, "- Evidence-only rows freshness: none")
  .replace(
    /^- Evidence-only browser console state:.*$/m,
    "- Evidence-only browser console state: N/A because no browser/manual evidence-only rows exist"
  )
  .replace(
    /^- Evidence-only proof server preflight:.*$/m,
    "- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows exist"
  )
  .replace(
    /^- Evidence-only backend process currentness:.*$/m,
    "- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows exist"
  )
  .replace(
    /^- Evidence identity refresh:.*$/m,
    "- Evidence identity refresh: same-sink current, historical-red, and superseded identity block inspected"
  )
  .replace(
    /^TDD evidence gate passed:.*$/m,
    "TDD evidence gate passed: durable sink structured evidence integration test fixture; compact table/header present after structural check; seams accounted for #364 / parent integration; #368 / replay route; RF-1, RF-2, RF-3; CONTEXT.md status absent; ADRs/principles/docs status present; sequence evidence present; evidence identities present; partial-red / red-first skip reasons listed; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none."
  )
  .replace(
    /^- Current evidence identities:.*$/m,
    "- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions fixture-v1; artifacts none"
  )
  .replace(
    /^- Historical red identities retained:.*$/m,
    "- Historical red identities retained: fixture paths fixture-v0; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
  )
  .replace(
    /^- Superseded evidence identities:.*$/m,
    "- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
  )
  .replace(/^- Superseded-token sweep:.*$/m, "- Superseded-token sweep: N/A because every superseded category is none")
  .replaceAll(
    "atoms: TODO; proof surfaces: TODO; sequence: TODO or N/A because criterion is not sequence-sensitive | not done",
    "atoms: exact criterion; proof surfaces: .claude/skills/implement/scripts/build-closeout-body.test.mjs and node --test; sequence: N/A because the criterion is not sequence-sensitive | satisfied"
  );

test("buildCloseoutBodyScaffold emits selected normal-review closeout fields", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    browser: true,
    principles: true,
    localOnly: true,
    fixedChildMode: "pending"
  });

  assert.match(body, /^Implementation closeout for #364/m);
  assert.match(body, /Scaffold status: incomplete/);
  assert.match(body, /Local-only SHA: <final SHA> is not remote-reachable/);
  assert.match(body, /TDD closeout preflight:/);
  assert.match(body, /Pre-red evidence reference:/);
  assert.match(body, /TDD review-fix map:/);
  assert.match(body, /\| Finding ID \| Finding\/source \| Intended red command\/failure \|/);
  assert.match(body, /Evidence-only proof server preflight:/);
  assert.match(body, /proof server preflight <present or N\/A>/);
  assert.match(body, /Review: code-review against <resolved fixed point>/);
  assert.match(body, /outcome findings fixed in SHA <final SHA>/);
  assert.match(body, /\| Finding ID \| Review pass \| Axis \| Reviewer \| Original finding \|/);
  for (const label of [
    "Initial Standards outcome:",
    "Initial Spec outcome:",
    "Final Standards outcome:",
    "Final Spec outcome:",
    "Findings found:",
    "Fixes made:",
    "TDD/review-fix evidence:",
    "TDD closeout gate:",
    "Verification rerun:",
    "Browser/manual evidence freshness:",
    "Browser/manual console state:",
    "Commit handling:"
  ]) {
    assert.match(body, new RegExp(label));
  }
  assert.match(body, /## Standards[\s\S]+## Spec/);
  assert.match(body, /Browser evidence:\n- Route\/action\/outcome:/);
  assert.match(body, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(body, /fixture paths <path 1 \| path 2 \| none/);
  assert.match(body, /every normalized exact superseded value individually/);
  assert.match(body, /Fixed child inline close comment: Completed by <final SHA>\. Evidence: this parent rollup comment URL/);
  assert.match(body, /\| #364 \| AC1 - Parent behavior \|/);
  assert.match(body, /\| #368 \| AC1 - Replay the production route \|/);
  assert.doesNotMatch(body, /\| satisfied \|/);
  assert.doesNotMatch(body, /Review fallback:/);
});

test("structured evidence single-sources multi-pass review and TDD summaries", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    evidence: structuredEvidence
  });

  assert.match(body, /TDD review-fix map: RF-1, RF-2, RF-3 below\./);
  assert.match(body, /Rows accounted for: #364 \/ parent integration; #368 \/ replay route; RF-1, RF-2, RF-3/);
  assert.match(body, /seams accounted for #364 \/ parent integration; #368 \/ replay route; RF-1, RF-2, RF-3/);
  assert.match(body, /\| RF-3 \| second-pass behavior repair \| `node --test [^`]+` failed because the RF-3 assertion did not match \|/);
  assert.match(body, /\| #368 \| absent \| active docs read \| replay route \|[^\n]+RF-1, RF-3 mapped below \|/);
  assert.match(body, /Initial Standards outcome: 1 finding, worst high: first behavior repair/);
  assert.match(body, /Initial Spec outcome: 1 finding, worst medium: spec coverage repair/);
  assert.match(body, /Findings found: 3: first behavior repair; spec coverage repair; second-pass behavior repair/);
  assert.match(body, /\| P2-standards-1 \| P2 \| Standards \| standards-final \| second-pass behavior repair \|/);
  assert.match(body, /TDD\/review-fix evidence: RF-1, RF-2, RF-3 mapped above; remaining dispositions are recorded per finding below\./);
  assert.doesNotMatch(body, /\| RF-1 \| <one review finding\/source>/);
  assert.doesNotMatch(body, /\| P1-standards-1 \| P1 \| Standards \| <initial reviewer ID or local fallback>/);
});

test("parent-rollup scaffold quotes generated non-AC/US acceptance IDs", () => {
  const parentPrdManifest = buildAcceptanceManifest([
    {
      number: 397,
      title: "Parent PRD",
      body: `## Problem Statement

The workflow is incomplete.

## Solution

Complete the workflow.

## User Stories

1. As a steward, I want exact closeout evidence, so that the parent can close

## Implementation Decisions

- Keep one manifest authority.

## Testing Decisions

- Validate the generated rollup.

## Principles
`
    }
  ]);
  const body = buildCloseoutBodyScaffold(parentPrdManifest, {
    parentIssue: 397,
    reviewMode: "normal",
    tddParentRollup: true
  });
  const row = body.split("\n").find((line) => line.startsWith("| #397 |"));

  assert.match(
    row ?? "",
    /`Parent-Solution`, US1, `Parent-Implementation-Decisions`, `Parent-Testing-Decisions`, `Principles`;/
  );
});

test("structured evidence rejects inconsistent switches and RF issue/seam mappings", () => {
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      immediateFix: true,
      evidence: structuredEvidence
    }),
    /TDD evidence requires --tdd-parent-rollup/
  );

  const inconsistent = {
    ...structuredEvidence,
    tddReviewFixes: structuredEvidence.tddReviewFixes.map((fix) => ({ ...fix }))
  };
  inconsistent.tddReviewFixes[0].seam = "different seam";
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      immediateFix: true,
      tddParentRollup: true,
      evidence: inconsistent
    }),
    /RF-1 must map to an exact structured TDD issue\/seam row/
  );
});

test("structured evidence rejects values that downstream review and TDD validators reject", () => {
  const build = (evidence) => buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    evidence
  });
  const invalidCases = [
    [
      (evidence) => { evidence.reviewFindings[0].repairClass = "design"; },
      /repairClass is not recognized/
    ],
    [
      (evidence) => { evidence.reviewFindings[0].tddDisposition = "fixed in review"; },
      /tddDisposition must link RF-N/
    ],
    [
      (evidence) => { evidence.tddReviewFixes[0].red = "the assertion failed"; },
      /red is not concrete/
    ],
    [
      (evidence) => { evidence.tddReviewFixes[0].green = "the fix works"; },
      /green is not concrete/
    ],
    [
      (evidence) => { evidence.tddReviewFixes[0].durability = "covered later"; },
      /durability must state durable test added at a path/
    ],
    [
      (evidence) => { evidence.tddReviewFixes[0].browserFreshness = "still fresh"; },
      /browserFreshness must state rerun proof/
    ],
    [
      (evidence) => { evidence.tddReviewFixes[0].backendCurrentness = "server is current"; },
      /backendCurrentness must state server command/
    ]
  ];

  for (const [mutate, expected] of invalidCases) {
    const evidence = JSON.parse(JSON.stringify(structuredEvidence));
    mutate(evidence);
    assert.throws(() => build(evidence), expected);
  }
});

test("structured audit rows render exact manifest coverage and reject inconsistent input", () => {
  const evidence = { auditRows: structuredAuditRows };
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    evidence
  });

  for (const row of structuredAuditRows) {
    assert.match(body, new RegExp(`\\| #${row.issue} \\| ${row.checkId} - `));
  }
  assert.equal(body.match(/\| satisfied \|/g)?.length, structuredAuditRows.length);
  assert.doesNotMatch(body, /atoms: TODO|proof surfaces: TODO|sequence: TODO/);

  const build = (auditRows, audit) => buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    audit,
    evidence: { auditRows }
  });
  assert.throws(() => build(structuredAuditRows.slice(1)), /auditRows is missing #364:AC1/);
  assert.throws(
    () => build([...structuredAuditRows, { ...structuredAuditRows[0] }]),
    /duplicate audit row for #364:AC1/
  );
  assert.throws(
    () => build([{ ...structuredAuditRows[0], checkId: "missing" }, ...structuredAuditRows.slice(1)]),
    /must name one exact manifest check/
  );
  assert.throws(
    () => build([{ ...structuredAuditRows[0], status: "done" }, ...structuredAuditRows.slice(1)]),
    /status must be satisfied, blocked, or not done/
  );
  assert.throws(
    () => build(structuredAuditRows, buildAuditScaffold(manifest)),
    /use either audit input or evidence auditRows, not both/
  );
});

test("split manifests can reuse complete TDD evidence while partitioning structured audit rows", () => {
  const source = buildAcceptanceManifest([
    {
      number: 500,
      title: "Split parent",
      body: "## Acceptance criteria\n\n- [ ] Parent first\n- [ ] Parent second\n"
    },
    {
      number: 501,
      title: "Split child",
      body: "## Acceptance criteria\n\n- [ ] Child first\n- [ ] Child second\n"
    }
  ]);
  const parts = [
    selectAcceptanceManifest(source, ["500:AC1", "501:AC1"]),
    selectAcceptanceManifest(source, ["500:AC2", "501:AC2"])
  ];
  const tddRows = [
    {
      issue: 500,
      contextStatus: "absent",
      authorityStatus: "active docs read",
      seam: "parent split",
      red: "red-first skipped because the split row is evidence-only",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      acceptance: "AC1, AC2; atoms: parent checks; proof surfaces: build-closeout-body.test.mjs; sequence: N/A because the criteria are not sequence-sensitive",
      reviewDisposition: "N/A because review created no TDD row changes"
    },
    {
      issue: 501,
      contextStatus: "absent",
      authorityStatus: "active docs read",
      seam: "child split",
      red: "red-first skipped because the split row is evidence-only",
      green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      acceptance: "AC1, AC2; atoms: child checks; proof surfaces: build-closeout-body.test.mjs; sequence: N/A because the criteria are not sequence-sensitive",
      reviewDisposition: "N/A because review created no TDD row changes"
    }
  ];
  const allAuditRows = source.issues.flatMap((issue) =>
    issue.checks.map((check) => ({
      issue: issue.number,
      checkId: check.id,
      atoms: check.text,
      proofSurfaces: ".claude/skills/implement/scripts/build-closeout-body.test.mjs",
      sequence: "N/A because the criterion is not sequence-sensitive",
      status: "satisfied"
    }))
  );
  const rendered = parts.map((part) => {
    const selected = new Set(part.issues.flatMap((issue) =>
      issue.checks.map((check) => `${issue.number}:${check.id}`)
    ));
    return buildCloseoutBodyScaffold(part, {
      parentIssue: 500,
      reviewMode: "normal",
      tddParentRollup: true,
      evidence: {
        auditRows: allAuditRows.filter((row) => selected.has(`${row.issue}:${row.checkId}`)),
        tddRows,
        tddReviewFixes: [],
        reviewFindings: []
      }
    });
  });

  assert.match(rendered[0], /\| #500 \| AC1 - Parent first \|/);
  assert.match(rendered[0], /\| #501 \| AC1 - Child first \|/);
  assert.doesNotMatch(rendered[0], /AC2 -/);
  assert.match(rendered[1], /\| #500 \| AC2 - Parent second \|/);
  assert.match(rendered[1], /\| #501 \| AC2 - Child second \|/);
  assert.doesNotMatch(rendered[1], /AC1 -/);
});

test("structured evidence accepts multiple unique seams per manifest issue", () => {
  const evidence = {
    tddRows: structuredEvidence.tddRows.map((row) => ({ ...row })),
    tddReviewFixes: structuredEvidence.tddReviewFixes.map((fix) => ({ ...fix })),
    reviewFindings: structuredEvidence.reviewFindings.map((finding) => ({ ...finding }))
  };
  evidence.tddRows.push({
    ...evidence.tddRows[1],
    seam: "replay persistence",
    red: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because replay persistence was not covered",
    green: "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed replay persistence",
    acceptance: "AC1; atoms: persisted production replay; proof surfaces: .claude/skills/implement/scripts/build-closeout-body.test.mjs; sequence: request -> persist -> replay -> assertion"
  });
  evidence.tddReviewFixes.push({
    ...evidence.tddReviewFixes[0],
    id: "RF-4",
    finding: "replay persistence repair",
    issue: 368,
    seam: "replay persistence"
  });

  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    evidence
  });

  assert.match(body, /#368 \/ replay route; #368 \/ replay persistence/);
  assert.match(body, /\| RF-4 \| replay persistence repair \|/);
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      immediateFix: true,
      tddParentRollup: true,
      evidence: {
        ...evidence,
        tddRows: [...evidence.tddRows, { ...evidence.tddRows[1] }]
      }
    }),
    /duplicate TDD row for #368 \/ replay route/
  );
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      immediateFix: true,
      tddParentRollup: true,
      evidence: {
        ...evidence,
        tddRows: evidence.tddRows.filter((row) => row.issue !== 364)
      }
    }),
    /at least one row for every manifest issue/
  );
});

test("structured P1/P2 and RF-1 through RF-3 evidence passes all closeout validators", () => {
  const generated = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    evidence: structuredEvidence
  });
  const body = completeStructuredEvidenceBody(generated);
  const directory = mkdtempSync(join(tmpdir(), "implement-structured-evidence-test-"));
  const bodyPath = join(directory, "body.md");
  const auditPath = join(directory, "audit.md");
  const manifestPath = join(directory, "manifest.json");
  const auditStart = body.indexOf("| Issue | Acceptance criterion or conformance check | Evidence | Status |");
  const auditEnd = body.indexOf("\n\nPrinciples/ADR conformance:", auditStart);
  writeFileSync(bodyPath, body);
  writeFileSync(auditPath, body.slice(auditStart, auditEnd));
  writeFileSync(manifestPath, JSON.stringify(manifest));

  try {
    const invocations = [
      ["TDD", tddValidator, bodyPath, ["--parent-rollup", "--acceptance-manifest", manifestPath]],
      [
        "normal review",
        normalReviewValidator,
        bodyPath,
        ["--immediate-fix", "--tdd-parent-rollup", "--acceptance-manifest", manifestPath]
      ],
      [
        "implement",
        implementValidator,
        auditPath,
        ["--audit-only", "--review-entry", "--acceptance-manifest", manifestPath]
      ]
    ];

    for (const [name, validator, validationPath, flags] of invocations) {
      const result = spawnSync(process.execPath, [validator, validationPath, ...flags], { encoding: "utf8" });
      assert.equal(result.status, 0, `${name} validator failed:\n${result.stderr}${result.stdout}`);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("normal immediate-fix scaffold satisfies the normal-review validator after filling generated fields", () => {
  const generated = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true
  });
  const body = generated
    .replace(
      /^Review frame:.*$/m,
      "Review frame: fixed point input abcdef0; fixed point resolved SHA abcdef0; reviewed HEAD SHA fedcba9; diff command `git diff abcdef0...HEAD`; commits fedcba9; worktree scope implement skill; excluded dirty files none; spec source issue #364."
    )
    .replace(
      /^Review:.*$/m,
      "Review: code-review against abcdef0; outcome findings fixed in SHA fedcba9; verification rerun node --test."
    )
    .replace(
      /^Review subagents:.*$/m,
      "Review subagents: Standards initial reviewer standards-initial completed, final reviewer standards-final completed; Spec initial and final reviewer spec-final completed"
    )
    .replace(
      /^Review subagent cleanup:.*$/m,
      "Review subagent cleanup: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion"
    )
    .replace(
      /^Review subagent cleanup proof:.*$/m,
      "Review subagent cleanup proof: Standards reviewers standards-initial and standards-final terminal status completed; no close primitive surfaced; Spec reviewer spec-final terminal status completed; no close primitive surfaced"
    )
    .replace(
      /^(?:Pre-dispatch|Handoff) Standards source inventory:.*$/gm,
      (line) => `${line.split(":")[0]}: AGENTS.md | CLAUDE.md | smell baseline`
    )
    .replace(
      /^(?:Pre-dispatch|Handoff) Spec source inventory:.*$/gm,
      (line) => `${line.split(":")[0]}: issue #364`
    )
    .replace(/^Findings:.*$/gm, "Findings: none")
    .replace(/^Axis summary:.*$/m, "Axis summary: Standards 0/none, Spec 0/none")
    .replace(/^Residual findings:.*$/m, "Residual findings: none")
    .replace(
      /^Spec sequence coverage:.*$/m,
      "Spec sequence coverage: sequence: N/A because the reviewed criteria are not sequence-sensitive"
    )
    .replace(/^Initial Standards outcome:.*$/m, "Initial Standards outcome: 1/medium before fixes")
    .replace(/^Initial Spec outcome:.*$/m, "Initial Spec outcome: 0/none before fixes")
    .replace(/^Final Standards outcome:.*$/m, "Final Standards outcome: 0/none after final re-review")
    .replace(/^Final Spec outcome:.*$/m, "Final Spec outcome: 0/none after final re-review")
    .replace(/^Findings found:.*$/m, "Findings found: 1 Standards finding")
    .replace(
      /^\| P1-standards-1 \|.*$/m,
      "| P1-standards-1 | P1 | Standards | standards-initial | Scaffold field was incomplete | conformance-only | red-first skipped because Standards-only fix did not change behavior | Scaffold field corrected | Standards final review and node --test passed | fixed |"
    )
    .replace(/^Fixes made:.*$/m, "Fixes made: scaffold field corrected")
    .replace(
      /^TDD\/review-fix evidence:.*$/m,
      "TDD/review-fix evidence: red-first skipped because Standards-only fix did not change behavior"
    )
    .replace(/^TDD closeout gate:.*$/m, "TDD closeout gate: N/A because no tdd skill was invoked")
    .replace(/^Verification rerun:.*$/m, "Verification rerun: node --test passed")
    .replace(
      /^Browser\/manual evidence freshness:.*$/m,
      "Browser/manual evidence freshness: N/A because no browser/manual evidence was used"
    )
    .replace(
      /^Browser\/manual console state:.*$/m,
      "Browser/manual console state: N/A because no browser/manual evidence was used"
    )
    .replace(
      /^Backend process currentness:.*$/m,
      "Backend process currentness: N/A because no browser/manual evidence was used"
    )
    .replace(/^Commit handling:.*$/m, "Commit handling: follow-up commit abcdef0")
    .replace(
      /^- Current evidence identities:.*$/m,
      "- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(/^- Historical red identities retained:.*$/m, "- Historical red identities retained: none")
    .replace(
      /^- Superseded evidence identities:.*$/m,
      "- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(/^- Superseded-token sweep:.*$/m, "- Superseded-token sweep: N/A because every superseded category is none");

  const directory = mkdtempSync(join(tmpdir(), "implement-normal-review-scaffold-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, body);
  const result = spawnSync(process.execPath, [normalReviewValidator, bodyPath, "--immediate-fix"], {
    encoding: "utf8"
  });
  rmSync(directory, { recursive: true, force: true });

  assert.equal(result.status, 0, result.stderr);
});

test("buildCloseoutBodyScaffold emits immediate-fix fallback fields", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "fallback",
    immediateFix: true
  });

  assert.match(body, /Review fallback:/);
  assert.match(body, /\| Finding ID \| Review pass \| Axis \| Reviewer \| Original finding \|/);
  for (const label of [
    "Browser/manual evidence freshness:",
    "Browser/manual console state:",
    "Backend process currentness:",
    "Findings found:",
    "Fixes made:",
    "TDD/review-fix evidence:",
    "Verification rerun:",
    "Commit handling:",
    "Residual findings:"
  ]) {
    assert.match(body, new RegExp(label));
  }
});

test("buildCloseoutBodyScaffold preserves a completed exact audit input", () => {
  const audit = buildAuditScaffold(manifest)
    .replaceAll("atoms: TODO", "atoms: exact")
    .replaceAll("proof surfaces: TODO", "proof surfaces: focused test")
    .replaceAll(
      "sequence: TODO or N/A because criterion is not sequence-sensitive",
      "sequence: N/A because criterion is not sequence-sensitive"
    )
    .replaceAll("| not done |", "| satisfied |");
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    audit,
    reviewMode: "normal"
  });

  assert.equal(body.split(audit.trim()).length - 1, 1);
  assert.equal(validateAuditInput(manifest, audit), audit.trim());
});

test("validateAuditInput rejects missing exact manifest coverage", () => {
  const audit = buildAuditScaffold(manifest).replace(
    /^\| #368 \| AC1 - Replay the production route .*\n/m,
    ""
  );

  assert.throws(
    () => validateAuditInput(manifest, audit),
    /#368 AC1 requires exactly one exact audit row; found 0/
  );
});

test("closeout scaffold enforces the configured UTF-8 byte ceiling", () => {
  assert.equal(assertCloseoutBodySize("é", 2), "é");
  assert.throws(() => assertCloseoutBodySize("é", 1), /closeout body is 2 bytes; maximum is 1 bytes/);
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      maxBytes: 100
    }),
    /Shorten concrete evidence or split it into separately validated durable tracker sinks/
  );
  assert.equal(DEFAULT_CLOSEOUT_BODY_MAX_BYTES, 65_536);
});

test("closeout size plan reports scaffold, audit, and evidence headroom", () => {
  const audit = buildAuditScaffold(manifest);
  const { body, sizePlan } = buildCloseoutBodyPlan(manifest, {
    parentIssue: 364,
    audit,
    reviewMode: "normal"
  });

  assert.equal(sizePlan.scaffoldBytes, Buffer.byteLength(body, "utf8"));
  assert.equal(sizePlan.auditBytes, Buffer.byteLength(audit.trim(), "utf8"));
  assert.equal(
    sizePlan.remainingBytes,
    DEFAULT_CLOSEOUT_BODY_MAX_BYTES - sizePlan.scaffoldBytes
  );
  assert.equal(
    sizePlan.recommendedEvidenceHeadroomBytes,
    DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES
  );
  assert.equal(sizePlan.status, "ok");

  const lowHeadroom = buildCloseoutBodySizePlan("x".repeat(90), "audit", 100);
  assert.deepEqual(lowHeadroom, {
    maxBytes: 100,
    scaffoldBytes: 90,
    auditBytes: 5,
    nonAuditScaffoldBytes: 85,
    remainingBytes: 10,
    recommendedEvidenceHeadroomBytes: 25,
    status: "low-headroom"
  });
  assert.equal(buildCloseoutBodySizePlan("x".repeat(101), "audit", 100).status, "exceeds-limit");
});

test("buildCloseoutBodyScaffold emits fallback and explicit N/A branches", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "fallback",
    fixedChildMode: "none"
  });

  assert.match(body, /Review fallback gate passed:/);
  assert.match(body, /Review fallback: <why code-review could not run>/);
  assert.match(body, /Browser\/manual evidence freshness:/);
  assert.match(body, /Browser\/manual console state:/);
  assert.match(body, /Backend process currentness:/);
  assert.match(body, /TDD evidence: N\/A because no tdd skill was invoked/);
  assert.match(body, /Browser evidence: N\/A because <reason no browser\/manual evidence applies>/);
  assert.match(body, /Principles\/ADR conformance: N\/A because no in-scope issue has a Principles section/);
  assert.match(body, /Fixed child inline close comment: N\/A because no fixed-template child closeout applies/);
});

test("closeout scaffold CLI writes a deterministic body", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-scaffold-test-"));
  const manifestPath = join(directory, "manifest.json");
  const auditPath = join(directory, "audit.md");
  const evidencePath = join(directory, "evidence.json");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(auditPath, buildAuditScaffold(manifest));
  writeFileSync(evidencePath, JSON.stringify(structuredEvidence));

  const args = [
    builder,
    manifestPath,
    "--audit-input",
    auditPath,
    "--evidence-input",
    evidencePath,
    "--output",
    outputPath,
    "--parent",
    "364",
    "--review",
    "normal",
    "--immediate-fix",
    "--tdd-parent-rollup",
    "--browser",
    "--principles",
    "--local-only",
    "--fixed-child",
    "pending"
  ];
  const first = spawnSync(process.execPath, args, { encoding: "utf8" });
  const firstBody = readFileSync(outputPath, "utf8");
  const second = spawnSync(process.execPath, args, { encoding: "utf8" });
  const secondBody = readFileSync(outputPath, "utf8");
  rmSync(directory, { recursive: true, force: true });

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(secondBody, firstBody);
  assert.match(secondBody, /TDD review-fix map: RF-1, RF-2, RF-3 below\./);
});

test("closeout scaffold CLI supports sibling issue sets and linked audit chunks", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-issue-set-scaffold-test-"));
  const manifestPath = join(directory, "manifest.json");
  const auditPath = join(directory, "audit.md");
  const corePath = join(directory, "core.md");
  const chunkPath = join(directory, "chunk.md");
  const sharedEvidenceCoreUrl = "https://github.com/example/repo/issues/364#issuecomment-123";
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(auditPath, buildAuditScaffold(manifest));

  const core = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--audit-input",
      auditPath,
      "--output",
      corePath,
      "--scope",
      "issue-set",
      "--anchor",
      "364",
      "--review",
      "normal"
    ],
    { encoding: "utf8" }
  );
  const chunk = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--audit-input",
      auditPath,
      "--output",
      chunkPath,
      "--scope",
      "issue-set",
      "--anchor",
      "364",
      "--audit-chunk",
      "--shared-evidence-core-url",
      sharedEvidenceCoreUrl
    ],
    { encoding: "utf8" }
  );
  const coreBody = readFileSync(corePath, "utf8");
  const chunkBody = readFileSync(chunkPath, "utf8");
  rmSync(directory, { recursive: true, force: true });

  assert.equal(core.status, 0, core.stderr);
  assert.equal(chunk.status, 0, chunk.stderr);
  assert.match(coreBody, /^Implementation closeout for sibling issue set anchored at #364$/m);
  assert.match(coreBody, /^Parent PRD coverage: N\/A because this is a sibling issue set with no parent PRD\.$/m);
  assert.match(chunkBody, /^Acceptance evidence chunk for sibling issue set anchored at #364$/m);
  assert.match(chunkBody, new RegExp(`^Shared evidence core: ${sharedEvidenceCoreUrl}$`, "m"));
});

test("closeout scaffold CLI refuses an oversized output", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-size-test-"));
  const manifestPath = join(directory, "manifest.json");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));

  const result = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--output",
      outputPath,
      "--parent",
      "364",
      "--review",
      "normal",
      "--max-bytes",
      "100"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /maximum is 100 bytes/);
  assert.equal(existsSync(outputPath), false);
  rmSync(directory, { recursive: true, force: true });
});

test("closeout scaffold CLI emits a size plan and can require fill headroom", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-plan-test-"));
  const manifestPath = join(directory, "manifest.json");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const basePlan = buildCloseoutBodyPlan(manifest, {
    parentIssue: 364,
    reviewMode: "normal"
  }).sizePlan;
  const maxBytes = basePlan.scaffoldBytes + 10;

  const result = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--output",
      outputPath,
      "--parent",
      "364",
      "--review",
      "normal",
      "--max-bytes",
      String(maxBytes),
      "--size-plan",
      "--require-headroom"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, "low-headroom");
  assert.match(result.stderr, /recommended minimum headroom/);
  assert.equal(existsSync(outputPath), false);
  rmSync(directory, { recursive: true, force: true });
});

test("closeout guidance documents structured splits, audit rows, and withheld-fixture currentness", () => {
  const templates = readFileSync(resolve(here, "../references/closeout-templates.md"), "utf8");
  const implementationEvidence = readFileSync(
    resolve(here, "../references/implementation-evidence.md"),
    "utf8"
  );

  assert.match(templates, /Shared-core structured-evidence rule:/);
  assert.match(templates, /linked audit chunk's evidence file may contain `auditRows` only/);
  assert.match(templates, /Use either `auditRows` or `--audit-input`, never both/);
  assert.match(templates, /Repair classes are `behavior`, `coverage-only`, `Standards-only`/);
  assert.match(templates, /form is non-`none` for review validation/);
  assert.match(templates, /`N\/A because no stateful fixture was copied`/);
  assert.match(implementationEvidence, /treats this withheld form as a non-`none` fixture identity/);
  assert.match(implementationEvidence, /`N\/A because no stateful fixture was copied`/);

  const documentedEvidence = JSON.parse(
    templates.match(/The JSON shape is:\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? ""
  );
  const documentedManifest = buildAcceptanceManifest([
    {
      number: 368,
      title: "Documented evidence example",
      body: "## Acceptance criteria\n\n- [ ] Replay the production route\n"
    }
  ]);
  assert.doesNotThrow(() => buildCloseoutBodyScaffold(documentedManifest, {
    parentIssue: 368,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    evidence: documentedEvidence
  }));
});

test("Principles-only issue-set review rows cite their adjacent exact audit rows", () => {
  const principlesManifest = selectAcceptanceManifest(manifest, ["364:Principles"]);
  const generated = buildCloseoutBodyScaffold(principlesManifest, {
    scopeMode: "issue-set",
    anchorIssue: 364,
    reviewMode: "normal"
  });
  const body = generated.replace(
    /^\| #364 \| `Principles`; exact adjacent acceptance audit table rows below; sequence:.*$/m,
    "| #364 | `Principles`; exact adjacent acceptance audit table rows below; sequence: N/A because the criterion is not sequence-sensitive | implementation diff and node --test | none |"
  );
  const errors = [];

  validateReviewSpecCoverage(body, errors, {
    requireIssueSet: true,
    acceptanceManifest: principlesManifest
  });

  assert.deepEqual(errors, []);
  assert.match(body, /^Implementation closeout for sibling issue set anchored at #364$/m);
  assert.match(body, /^Parent PRD coverage: N\/A because this is a sibling issue set with no parent PRD\.$/m);
});

test("linked audit chunks omit repeated review evidence and retain exact manifest rows", () => {
  const sharedEvidenceCoreUrl = "https://github.com/example/repo/issues/364#issuecomment-123";
  const body = buildCloseoutBodyScaffold(manifest, {
    scopeMode: "issue-set",
    anchorIssue: 364,
    auditChunk: true,
    sharedEvidenceCoreUrl,
    evidence: { auditRows: structuredAuditRows }
  });

  assert.match(body, /^Acceptance evidence chunk for sibling issue set anchored at #364$/m);
  assert.match(body, new RegExp(`^Shared evidence core: ${sharedEvidenceCoreUrl}$`, "m"));
  assert.match(body, /\| #364 \| AC1 - Parent behavior \|/);
  assert.match(body, /\| #368 \| AC1 - Replay the production route \|/);
  assert.doesNotMatch(body, /^Review frame:/m);
  assert.doesNotMatch(body, /^TDD evidence/m);
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      scopeMode: "issue-set",
      anchorIssue: 364,
      auditChunk: true,
      sharedEvidenceCoreUrl,
      evidence: structuredEvidence
    }),
    /audit chunk evidence may contain auditRows only/
  );
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      scopeMode: "issue-set",
      anchorIssue: 364,
      auditChunk: true,
      sharedEvidenceCoreUrl,
      principles: true
    }),
    /audit chunks cannot use shared-core modes: principles/
  );
});

test("Codex implement adapter is independent, explicit-only, and points to the canonical skill", () => {
  const adapterRoot = resolve(here, "../../../../.agents/skills/implement");
  const adapter = readFileSync(resolve(adapterRoot, "SKILL.md"), "utf8");
  const metadata = readFileSync(resolve(adapterRoot, "agents/openai.yaml"), "utf8");

  assert.equal(lstatSync(adapterRoot).isSymbolicLink(), false);
  assert.match(adapter, /^---\nname: implement\ndescription:/);
  assert.doesNotMatch(adapter, /disable-model-invocation/);
  assert.match(adapter, /\.claude\/skills\/implement\/SKILL\.md/);
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.match(metadata, /\$implement/);
});
