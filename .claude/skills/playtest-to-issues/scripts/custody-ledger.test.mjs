import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  classifyPrepIntake,
  inspectPrepCustody,
  renderCustodyReceipt,
  validateCustodyLedger,
} from "./custody-ledger.mjs";

const script = fileURLToPath(new URL("./custody-ledger.mjs", import.meta.url));

const mixedPrep = `# Playtest PRD Prep: Example

## Header And Freshness

Source report path: reports/playtest-example.md

## Reassessment Verdict

First operational action: Publish the bounded verification issue
Publication package: first PRD plus deferred follow-ons

## Recommended PRD Package

### PRD Candidate: First PRD

Candidate role: first
Sources: F003

### PRD Candidate: Deferred PRD

Candidate role: deferred
Sources: F009

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| --- | --- | --- | --- |
| F001 - Product repair | ticket | Publish a bounded bug | Exact component regression |
| F002 - Method repair | skill-audit | Audit the playtest skill | Audit report |

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear
`;

const noWorkPrep = `# Playtest PRD Prep: Empty

## Header And Freshness

Source report path: reports/playtest-empty.md

## Reassessment Verdict

First operational action: none - no live work
Publication package: no new PRD

## Recommended PRD Package

No PRD candidates remain.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| --- | --- | --- | --- |
| None | no-op | No follow-up remains | Current evidence |

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear
`;

const inspectMixed = () => inspectPrepCustody({
  markdown: mixedPrep,
  prepPath: "reports/playtest-example-prd-prep.md",
});

const validMixedLedger = (inventory) => ({
  schemaVersion: 1,
  prepArtifact: inventory.prepArtifact,
  prepSha256: inventory.prepSha256,
  firstOperationalAction: {
    value: inventory.firstOperationalAction,
    status: "owned",
    evidence: "Issue #123 owns the bounded verification.",
  },
  nonPrd: [
    {
      item: "F001 - Product repair",
      disposition: "published",
      issueNumber: 123,
      issueUrl: "https://github.com/example/repo/issues/123",
      liveState: "OPEN",
      labels: ["bug", "ready-for-agent"],
      verifierStatus: "verified",
      evidence: "Published body and metadata match the approved issue.",
    },
    {
      item: "F002 - Method repair",
      disposition: "routed",
      route: "$skill-audit \".claude/skills/playtest\"",
      evidence: "The producer classified this as skill maintenance.",
    },
  ],
  prds: [
    {
      title: "First PRD",
      role: "first",
      disposition: "remaining",
      toPrdInvocation: "$to-prd \"reports/playtest-example-prd-prep.md - create First PRD\"",
      evidence: "No current tracker owner exists.",
    },
    {
      title: "Deferred PRD",
      role: "deferred",
      disposition: "consumed",
      issueNumber: 122,
      issueUrl: "https://github.com/example/repo/issues/122",
      liveState: "CLOSED",
      labels: ["enhancement"],
      verifierStatus: "verified",
      evidence: "Closed PRD #122 and its children consumed this scope.",
    },
  ],
});

test("inspects every non-PRD row and PRD candidate in source order", () => {
  const result = inspectMixed();

  assert.deepEqual(result.errors, []);
  assert.equal(result.inventory.sourceReport, "reports/playtest-example.md");
  assert.equal(result.inventory.nonPrdFollowUps.length, 2);
  assert.deepEqual(
    result.inventory.nonPrdFollowUps.map((entry) => entry.item),
    ["F001 - Product repair", "F002 - Method repair"],
  );
  assert.deepEqual(
    result.inventory.prdCandidates.map((entry) => [entry.title, entry.role]),
    [["First PRD", "first"], ["Deferred PRD", "deferred"]],
  );
  assert.match(result.inventory.prepSha256, /^[a-f0-9]{64}$/);
});

test("accepts current and bounded legacy producer validation without accepting semantic defects", () => {
  const inspected = inspectMixed();
  const current = classifyPrepIntake({
    inspected,
    currentValidation: { errors: [], warnings: [], source: { sourceValidation: "passed" } },
  });
  assert.equal(current.intakeStatus, "current");

  const legacy = classifyPrepIntake({
    inspected,
    currentValidation: {
      errors: [
        "Prep artifact requires exactly one bare line-start field: Final branch: value",
        "Missing section for table: ### Final Worktree Ledger",
      ],
      warnings: [],
      source: { sourceValidation: "passed" },
    },
  });
  assert.equal(legacy.intakeStatus, "legacy-compatible");
  assert.deepEqual(legacy.errors, []);

  const invalid = classifyPrepIntake({
    inspected,
    currentValidation: {
      errors: ["Evidence Disposition Ledger is missing source ID F003"],
      warnings: [],
      source: { sourceValidation: "passed" },
    },
  });
  assert.equal(invalid.intakeStatus, "invalid");
  assert.deepEqual(invalid.errors, ["Evidence Disposition Ledger is missing source ID F003"]);
});

test("accepts complete issue, routed-workflow, consumed-PRD, and remaining-PRD custody", () => {
  const { inventory } = inspectMixed();
  const report = validateCustodyLedger({ inventory, ledger: validMixedLedger(inventory) });

  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, true);
  assert.equal(report.readyForToPrd, true);
  assert.equal(report.resolvedNonPrdCount, 2);
  assert.deepEqual(report.remainingPrds.map((entry) => entry.title), ["First PRD"]);
});

test("renders the passing receipt with exact routes, source order, and worktree rows", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  const receipt = renderCustodyReceipt({
    inventory,
    ledger,
    finalBranch: "main",
    finalWorktreeRows: [" M user-owned.md", "?? notes.md"],
  });

  assert.equal(receipt, `## Playtest Follow-Up Custody Receipt

Prep artifact: reports/playtest-example-prd-prep.md
Prep SHA-256: ${inventory.prepSha256}
Custody validator: passed
Non-PRD custody: 2/2
First operational action: owned - Issue #123 owns the bounded verification.

| Non-PRD item | Disposition | Owner or proof |
| --- | --- | --- |
| F001 - Product repair | published | [Issue #123](https://github.com/example/repo/issues/123) |
| F002 - Method repair | routed | \`$skill-audit ".claude/skills/playtest"\` |

PRD queue: 1

| PRD candidate | Role | Disposition | Next action or proof |
| --- | --- | --- | --- |
| First PRD | first | remaining | \`$to-prd "reports/playtest-example-prd-prep.md - create First PRD"\` |
| Deferred PRD | deferred | consumed | [Issue #122](https://github.com/example/repo/issues/122) |

Next PRD action: $to-prd "reports/playtest-example-prd-prep.md - create First PRD"
Temporary artifacts: absent
Final branch: main
Final worktree:
\`\`\`text
 M user-owned.md
?? notes.md
\`\`\``);
  assert.equal(receipt.includes("…"), false);
});

test("render-receipt CLI requires explicit final worktree posture and emits the exact receipt", () => {
  const directory = mkdtempSync(join(tmpdir(), "playtest-custody-receipt-"));
  try {
    const reportsDirectory = join(directory, "reports");
    mkdirSync(reportsDirectory);
    const prep = join(reportsDirectory, "playtest-example-prd-prep.md");
    const ledgerPath = join(directory, "custody.json");
    writeFileSync(prep, mixedPrep);
    const { inventory } = inspectMixed();
    writeFileSync(ledgerPath, JSON.stringify(validMixedLedger(inventory)));
    const args = [
      script,
      "render-receipt",
      "reports/playtest-example-prd-prep.md",
      ledgerPath,
      "--final-branch",
      "main",
    ];

    const missingPosture = spawnSync(process.execPath, args, { cwd: directory, encoding: "utf8" });
    const clean = spawnSync(
      process.execPath,
      [...args, "--final-worktree-clean"],
      { cwd: directory, encoding: "utf8" },
    );

    assert.equal(missingPosture.status, 2);
    assert.match(missingPosture.stderr, /Use exactly one of --final-worktree-clean or --final-worktree-row\./);
    assert.equal(clean.status, 0, clean.stderr);
    assert.match(clean.stdout, /^## Playtest Follow-Up Custody Receipt\n/);
    assert.match(clean.stdout, /Final worktree: clean\n$/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("accepts an explicit no-create disposition without inventing a tracker owner", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.nonPrd[0] = {
    item: "F001 - Product repair",
    disposition: "no-create",
    reason: "Fresh tracker reads show the behavior is already correct and no implementation work remains.",
    evidence: "The bounded reproduction passed and the exact-title duplicate search found no residual scope.",
  };

  const report = validateCustodyLedger({ inventory, ledger });

  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, true);
  assert.equal(report.resolvedNonPrdCount, 2);
});

test("accepts satisfied work, an existing owner, no-create evidence, and a rejected PRD", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.firstOperationalAction = {
    value: inventory.firstOperationalAction,
    status: "satisfied",
    evidence: "Current implementation and focused regression evidence satisfy the source action.",
  };
  ledger.nonPrd[0].disposition = "existing-owner";
  ledger.nonPrd[0].evidence = "Fresh exact read proves issue #123 owns the complete live scope.";
  ledger.nonPrd[1] = {
    item: "F002 - Method repair",
    disposition: "no-create",
    reason: "The current producer contract already enforces the requested method behavior.",
    evidence: "The current validator fixture fails when that behavior is absent.",
  };
  ledger.prds[0] = {
    title: "First PRD",
    role: "first",
    disposition: "rejected",
    reason: "Current authority explicitly rejects the proposed behavior.",
    evidence: "The governing contract and current implementation agree that no PRD scope remains.",
  };

  const report = validateCustodyLedger({ inventory, ledger });

  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, true);
  assert.equal(report.readyForToPrd, false);
  assert.deepEqual(report.remainingPrds, []);
});

test("fails closed when a source follow-up is missing", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.nonPrd.pop();

  const report = validateCustodyLedger({ inventory, ledger });

  assert.equal(report.custodyComplete, false);
  assert.equal(report.errors.includes("nonPrd is missing item: F002 - Method repair"), true);
});

test("preserves a blocker but does not issue a passing custody receipt", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.nonPrd[0] = {
    item: "F001 - Product repair",
    disposition: "blocked",
    reason: "Tracker access is unavailable.",
    evidence: "The exact-title and owner reads both failed.",
  };

  const report = validateCustodyLedger({ inventory, ledger });

  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, false);
  assert.deepEqual(report.blockedItems, ["F001 - Product repair"]);
  assert.equal(report.readyForToPrd, false);
});

test("blocks custody when the first action or a PRD candidate is unresolved", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.firstOperationalAction = {
    value: inventory.firstOperationalAction,
    status: "blocked",
    evidence: "The required owner decision is unavailable.",
  };
  ledger.prds[0] = {
    title: "First PRD",
    role: "first",
    disposition: "blocked",
    reason: "Current authority conflicts with the report's proposed scope.",
    evidence: "The conflict must be resolved before PRD intake can proceed.",
  };

  const report = validateCustodyLedger({ inventory, ledger });

  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, false);
  assert.equal(report.firstActionBlocked, true);
  assert.deepEqual(report.blockedPrds, ["First PRD"]);
  assert.equal(report.readyForToPrd, false);
});

test("accepts an exhausted portfolio without inventing issues or PRDs", () => {
  const inspected = inspectPrepCustody({
    markdown: noWorkPrep,
    prepPath: "reports/playtest-empty-prd-prep.md",
  });
  const inventory = inspected.inventory;
  const ledger = {
    schemaVersion: 1,
    prepArtifact: inventory.prepArtifact,
    prepSha256: inventory.prepSha256,
    firstOperationalAction: {
      value: inventory.firstOperationalAction,
      status: "not-required",
      evidence: "The validated prep reports no live work.",
    },
    nonPrd: [],
    prds: [],
  };

  assert.deepEqual(inspected.errors, []);
  const report = validateCustodyLedger({ inventory, ledger });
  assert.deepEqual(report.errors, []);
  assert.equal(report.custodyComplete, true);
  assert.equal(report.readyForToPrd, false);
  assert.deepEqual(report.remainingPrds, []);
});

test("renders explicit empty-inventory rows for an exhausted portfolio", () => {
  const inspected = inspectPrepCustody({
    markdown: noWorkPrep,
    prepPath: "reports/playtest-empty-prd-prep.md",
  });
  const ledger = {
    schemaVersion: 1,
    prepArtifact: inspected.inventory.prepArtifact,
    prepSha256: inspected.inventory.prepSha256,
    firstOperationalAction: {
      value: inspected.inventory.firstOperationalAction,
      status: "not-required",
      evidence: "The validated prep reports no live work.",
    },
    nonPrd: [],
    prds: [],
  };

  const receipt = renderCustodyReceipt({
    inventory: inspected.inventory,
    ledger,
    finalBranch: "main",
    finalWorktreeRows: [],
  });

  assert.match(receipt, /\| None \| N\/A \| No non-PRD follow-ups in source inventory\. \|/);
  assert.match(receipt, /PRD queue: exhausted/);
  assert.match(receipt, /\| None \| N\/A \| N\/A \| No PRD candidates in source inventory\. \|/);
  assert.match(receipt, /Next PRD action: none - PRD queue exhausted/);
  assert.match(receipt, /Final worktree: clean$/);
});

test("refuses to render a passing receipt while custody is blocked", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.nonPrd[0] = {
    item: "F001 - Product repair",
    disposition: "blocked",
    reason: "Tracker access is unavailable.",
    evidence: "The exact-title and owner reads both failed.",
  };

  assert.throws(
    () => renderCustodyReceipt({
      inventory,
      ledger,
      finalBranch: "main",
      finalWorktreeRows: [],
    }),
    /Cannot render a passing custody receipt/,
  );
});

test("rejects a stale prep hash and unverified tracker ownership", () => {
  const { inventory } = inspectMixed();
  const ledger = validMixedLedger(inventory);
  ledger.prepSha256 = "0".repeat(64);
  ledger.nonPrd[0].verifierStatus = "pending";

  const report = validateCustodyLedger({ inventory, ledger });

  assert.equal(report.custodyComplete, false);
  assert.equal(report.errors.includes("prepSha256 does not match the inspected artifact bytes."), true);
  assert.equal(
    report.errors.includes("nonPrd[F001 - Product repair].verifierStatus must be verified."),
    true,
  );
});
