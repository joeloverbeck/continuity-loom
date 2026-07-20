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
  renderBlockedCustodyReceipt,
  renderCustodyReceipt,
  validateCustodyLedger,
} from "./custody-ledger.mjs";

const script = fileURLToPath(new URL("./custody-ledger.mjs", import.meta.url));

const mixedPrep = `# Playtest PRD Prep: Example

## Header And Freshness

Prep contract version: 2
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
| F001 - Product repair | ticket - Product repair | Publish a bounded bug | Exact component regression |
| F002 - Method repair | research commission | Commission a playtest method review | Research report |

### Ticket Packet: Product repair

Sources: F001
Type and readiness: bug plus ready-for-agent with current fixture evidence.
Problem: The example exposes a bounded author-visible defect.
Product rule: Preserve the example boundary while correcting the defect.
Affected surfaces: Example code, tests, active docs, and skill evidence.
Scope: Correct the bounded product behavior.
Acceptance:

- The existing component regression passes.

Preserved strengths: N/A - no affected source strength
Testing seam: Existing component regression seam.
Out of scope: Unrelated example cleanup.
Browser-visible guidance checklist mapping:

- \`entry point and availability\`: existing example entry point.

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear
`;

const noWorkPrep = `# Playtest PRD Prep: Empty

## Header And Freshness

Prep contract version: 2
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

const contractIdentity = (status, diagnostics = []) => ({
  declaredVersion: status === "current" ? 2 : null,
  effectiveVersion: status === "current" ? 2 : 1,
  currentVersion: 2,
  status,
  diagnostics,
  migrationInvocation:
    status === "migration-required" ? '$playtest-prd-prep "reports/playtest-example.md"' : null,
});

const producerValidation = ({ status = "current", errors = [], diagnostics = [] } = {}) => ({
  errors,
  warnings: [],
  source: { sourceValidation: "passed" },
  contract: contractIdentity(status, diagnostics),
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
      route: "research commission: playtest method review",
      evidence: "The producer classified this as method research.",
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

const blockedMixedLedger = (inventory) => {
  const ledger = validMixedLedger(inventory);
  ledger.firstOperationalAction = {
    value: inventory.firstOperationalAction,
    status: "blocked",
    evidence: "The required owner decision is unavailable.",
  };
  ledger.nonPrd[0] = {
    item: "F001 - Product repair",
    disposition: "blocked",
    reason: "Tracker access is unavailable.",
    evidence: "The exact-title and owner reads both failed.",
  };
  ledger.prds[0] = {
    title: "First PRD",
    role: "first",
    disposition: "blocked",
    reason: "Current authority conflicts with the report's proposed scope.",
    evidence: "The conflict must be resolved before PRD intake can proceed.",
  };
  return ledger;
};

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
  assert.deepEqual(
    result.inventory.ticketPackets.map((entry) => [entry.title, entry.sourceIds]),
    [["Product repair", ["F001"]]],
  );
  assert.match(result.inventory.prepSha256, /^[a-f0-9]{64}$/);
});

test("requires producer migration for a circular legacy first operational action", () => {
  const inspected = inspectPrepCustody({
    markdown: mixedPrep
      .replace("Prep contract version: 2\n", "")
      .replace(
        "First operational action: Publish the bounded verification issue",
        'First operational action: run $playtest-to-issues "reports/playtest-example-prd-prep.md"',
      ),
    prepPath: "reports/playtest-example-prd-prep.md",
  });

  assert.deepEqual(inspected.errors, []);
  const intake = classifyPrepIntake({
    inspected,
    currentValidation: producerValidation({
      status: "invalid",
      errors: ["Prep contract version must be: 2"],
    }),
    contractValidation: producerValidation({
      status: "migration-required",
      diagnostics: [
        {
          code: "PREP_CONTRACT_FIRST_ACTION_MIGRATION_REQUIRED",
          disposition: "migration-required",
          message: "Legacy first action requires producer migration.",
        },
      ],
    }),
  });
  assert.equal(intake.intakeStatus, "migration-required");
  assert.deepEqual(intake.errors, []);
  assert.equal(intake.migration.invocation, '$playtest-prd-prep "reports/playtest-example.md"');
});

test("classifies current, bounded legacy, and invalid producer contracts without message matching", () => {
  const inspected = inspectMixed();
  const current = classifyPrepIntake({
    inspected,
    currentValidation: producerValidation(),
    contractValidation: producerValidation(),
  });
  assert.equal(current.intakeStatus, "current");

  const legacy = classifyPrepIntake({
    inspected,
    currentValidation: producerValidation({
      status: "invalid",
      errors: [
        "Prep artifact requires exactly one bare line-start field: Final branch: value",
        "Missing section for table: ### Final Worktree Ledger",
        "Ticket Packet Product repair requires exactly one bare line-start field: Testing seam: value",
        "Ticket-candidate source F001 is not covered by exactly one Ticket Packet.",
      ],
    }),
    contractValidation: producerValidation({ status: "legacy-compatible" }),
  });
  assert.equal(legacy.intakeStatus, "legacy-compatible");
  assert.deepEqual(legacy.errors, []);
  assert.equal(legacy.currentValidatorErrors.length, 4);

  const invalid = classifyPrepIntake({
    inspected,
    currentValidation: producerValidation({
      status: "invalid",
      errors: ["Evidence Disposition Ledger is missing source ID F003"],
    }),
    contractValidation: producerValidation({
      status: "invalid",
      errors: ["Evidence Disposition Ledger is missing source ID F003"],
    }),
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
| F002 - Method repair | routed | \`research commission: playtest method review\` |

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

test("renders the blocked receipt with exact inventory tables and every blocker", () => {
  const { inventory } = inspectMixed();
  const receipt = renderBlockedCustodyReceipt({
    inventory,
    ledger: blockedMixedLedger(inventory),
    finalBranch: "main",
    finalWorktreeRows: [],
  });

  assert.equal(receipt, `## Playtest Follow-Up Custody Receipt

Prep artifact: reports/playtest-example-prd-prep.md
Prep SHA-256: ${inventory.prepSha256}
Custody validator: blocked
Non-PRD custody: 1/2
First operational action: blocked - The required owner decision is unavailable.

Custody blockers:
- Non-PRD item: F001 - Product repair
- PRD candidate: First PRD
- First operational action: Publish the bounded verification issue

| Non-PRD item | Disposition | Owner or proof |
| --- | --- | --- |
| F001 - Product repair | blocked | Tracker access is unavailable. Evidence: The exact-title and owner reads both failed. |
| F002 - Method repair | routed | \`research commission: playtest method review\` |

PRD queue: blocked - 0 remaining candidates

| PRD candidate | Role | Disposition | Next action or proof |
| --- | --- | --- | --- |
| First PRD | first | blocked | Current authority conflicts with the report's proposed scope. Evidence: The conflict must be resolved before PRD intake can proceed. |
| Deferred PRD | deferred | consumed | [Issue #122](https://github.com/example/repo/issues/122) |

Next PRD action: blocked - resolve follow-up custody first
Temporary artifacts: absent
Final branch: main
Final worktree: clean`);
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

    writeFileSync(ledgerPath, JSON.stringify(blockedMixedLedger(inventory)));
    const blocked = spawnSync(
      process.execPath,
      [
        script,
        "render-blocked-receipt",
        "reports/playtest-example-prd-prep.md",
        ledgerPath,
        "--final-branch",
        "main",
        "--final-worktree-clean",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(blocked.status, 0, blocked.stderr);
    assert.match(blocked.stdout, /Custody validator: blocked/);
    assert.match(blocked.stdout, /Next PRD action: blocked - resolve follow-up custody first/);
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

test("refuses to render a blocked receipt from complete or structurally invalid custody", () => {
  const { inventory } = inspectMixed();
  const completeLedger = validMixedLedger(inventory);
  const invalidLedger = blockedMixedLedger(inventory);
  invalidLedger.nonPrd.pop();

  assert.throws(
    () => renderBlockedCustodyReceipt({
      inventory,
      ledger: completeLedger,
      finalBranch: "main",
      finalWorktreeRows: [],
    }),
    /Cannot render a blocked custody receipt from a complete custody ledger/,
  );
  assert.throws(
    () => renderBlockedCustodyReceipt({
      inventory,
      ledger: invalidLedger,
      finalBranch: "main",
      finalWorktreeRows: [],
    }),
    /Cannot render a blocked custody receipt from a structurally invalid custody ledger/,
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
