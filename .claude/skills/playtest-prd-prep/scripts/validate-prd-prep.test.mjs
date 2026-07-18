import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inspectSourceReport, validatePrepArtifact } from "./validate-prd-prep.mjs";

const validatorPath = fileURLToPath(new URL("./validate-prd-prep.mjs", import.meta.url));

const DEFAULT_PRIORITIZED = [
  ["F001", "major", "defect", "fixture", "A fixture defect", "high", "new"]
];

const DEFAULT_CUMULATIVE = [
  ["F001", "current run", "defect", "A fixture defect", "open", "fixture evidence"],
  ["F002", "current run", "strength", "A fixture strength", "preserve-strength", "fixture evidence"]
];

function markdownRows(rows) {
  return rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function createSourceFixture(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "loom-playtest-prd-prep-"));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  const reportsDir = join(root, "reports");
  mkdirSync(reportsDir);

  const stem = "playtest-fixture-2026-07-17T120000Z";
  const reportPath = join(reportsDir, `${stem}.md`);
  const runMode = options.continuation ? "continuation" : "new_story";
  const priorReport = options.continuation
    ? "reports/playtest-fixture-2026-07-16T120000Z.md"
    : "null";
  const prioritizedRows = options.prioritizedRows ?? DEFAULT_PRIORITIZED;
  const cumulativeRows = options.cumulativeRows ?? DEFAULT_CUMULATIVE;

  const markdown = `---
report_type: continuity-loom-author-playtest
schema_version: 1
run_id: ${stem}
report_stem: ${stem}
story_title: Fixture Story
story_slug: fixture
run_mode: ${runMode}
prior_report: ${priorReport}
project_path: /tmp/continuity-loom-playtest-projects/fixture
project_exists_at_close: true
started_at: 2026-07-17T12:00:00Z
completed_at: 2026-07-17T13:00:00Z
status: completed
completion_reason: accepted-one-segment
accepted_segment_sequence: 1
base_url: http://127.0.0.1:41731
browser: chromium
viewport: 1440x900
openrouter_send_controls_clicked: 0
provider_request_attempts: 0
provider_requests_blocked: 0
cold_prose_attempts: 1
cold_assistance_attempts: 0
counterfactual_probes: 0
candidate_intervention: light
---

# Continuity Loom Author Playtest Report: Fixture Story

## Run Status

Completed fixture run.

## Executive Assessment

Fixture assessment.

## Story Intent and Expectations

Fixture intent.

## Run Configuration and Continuation Contract

Fixture configuration.

## Condensed Author Journey

Fixture journey.

## What Worked

- Fixture strength.

## Prioritized Findings

| ID | Severity | Classification | Category | Summary | Confidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
${markdownRows(prioritizedRows)}

## Surface-by-Surface Experience

| Surface | Author task | Result | Intervention | Verdict |
| --- | --- | --- | --- | --- |
| Fixture | Exercise fixture | Complete | none | useful |

## Prompt Usefulness

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| P1 | Fixture | Complete | 1 | 0 | 1 | useful | high |

## Generation Brief Field Influence

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| current_time | Fixture | Fixture influence | present | present | clear | high |

## Assistance Evaluation

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Ideate | Not needed | skipped | none | none | none | intentional |

## Candidate and Accepted Segment

One fixture candidate was accepted after a light edit.

## Cumulative Finding Ledger

| ID | First seen | Classification | Summary | Current status | Latest evidence |
| --- | --- | --- | --- | --- | --- |
${markdownRows(cumulativeRows)}

## Continuation Handoff

Fixture handoff.

## Diagnostics and Evidence

### Evidence Index

No retained evidence.

## Coverage Limitations

Fixture-only coverage.
`;

  const finalizedMarkdown = options.nonBlockingCounterfactualDefect
    ? markdown.replace("counterfactual_probes: 0", "counterfactual_probes: 1")
    : markdown;

  writeFileSync(reportPath, finalizedMarkdown);
  return { reportPath, reportsDir, stem };
}

function candidateBlock(title, role, sources = "F001", strengths = "F002") {
  return `### PRD Candidate: ${title}

Candidate role: ${role}
Purpose: Improve the fixture behavior.
Sources: ${sources}
Problem: The fixture exposes a stable author-facing defect.
Product rule or seam: Keep the fixture behavior explicit at the existing boundary.
Affected surfaces: Fixture code, tests, active docs, and skill evidence.
Scope: Correct the fixture behavior and preserve its existing contract.
Acceptance: The fixture scenario passes at the existing behavior seam.
Preserved strengths: ${strengths}
Testing seam: Existing fixture integration seam.
Out of scope: Unrelated fixture cleanup.
`;
}

function createPrepFixture(t, sourceFixture, options = {}) {
  const source = inspectSourceReport(sourceFixture.reportPath);
  assert.deepEqual(source.errors, []);
  const packageValue = options.packageValue ?? "single intended PRD";
  const verdict =
    options.verdict ??
    (packageValue === "multi-PRD program"
      ? "Recommended multi-PRD program: Fixture program"
      : packageValue === "no new PRD"
        ? "No-new-PRD verdict: The fixture needs no broad product change."
        : "Recommended first new PRD: Fixture rule");

  const dispositionRows = source.cumulativeRows
    .filter((row) => row.ID !== options.omitDispositionId)
    .map((row) => {
      const isStrength = source.strengthIds.includes(row.ID);
      const disposition =
        options.dispositionOverrides?.[row.ID] ??
        (isStrength
          ? "preserve-strength"
          : packageValue === "no new PRD"
            ? "ticket-candidate"
            : "fresh-prd-scope");
      return `| ${row.ID} | ${row.Summary} | ${disposition} | Current fixture evidence. | Fixture impact. |`;
    });
  if (options.duplicateDispositionId) {
    const row = source.cumulativeRows.find(
      (candidate) => candidate.ID === options.duplicateDispositionId
    );
    dispositionRows.push(
      `| ${row.ID} | ${row.Summary} | fresh-prd-scope | Duplicate evidence. | Duplicate impact. |`
    );
  }

  const strengthRows = source.cumulativeRows
    .filter((row) => source.strengthIds.includes(row.ID) && row.ID !== options.omitStrengthId)
    .map(
      (row) =>
        `| ${row.ID} | global | Preserve the fixture strength. | Existing fixture regression proof. |`
    );

  let candidates = "";
  if (packageValue === "single intended PRD") {
    candidates = candidateBlock("Fixture rule", "first");
  } else if (packageValue === "first PRD plus deferred follow-ons") {
    candidates = `${candidateBlock("Fixture rule", "first")}\n${candidateBlock(
      "Fixture follow-on",
      "deferred"
    )}`;
  } else if (packageValue === "multi-PRD program") {
    candidates = `${candidateBlock("Fixture program one", "program 1")}\n${candidateBlock(
      "Fixture program two",
      "program 2"
    )}`;
  }

  const existingClassification = options.existingClassification ?? "missing at intake";
  const completionMode = options.completionMode ?? "final";
  const completionFields =
    completionMode === "draft"
      ? {
          validator: "pending",
          semanticReview: "pending",
          privacyScan: "pending"
        }
      : {
          validator: "passed",
          semanticReview: "completed",
          privacyScan: "clear"
        };
  const consumption =
    existingClassification === "missing at intake" || options.omitConsumption
      ? ""
      : `
### Prior Recommendation Consumption Ledger

| Prior recommendation | Current classification | Evidence | Resulting action |
| --- | --- | --- | --- |
| Old fixture recommendation | consumed | Current fixture evidence. | Remove from live scope. |
`;

  const prepPath = join(sourceFixture.reportsDir, `${sourceFixture.stem}-prd-prep.md`);
  const markdown = `# Playtest PRD Prep: Fixture Story

## Header And Freshness

Source report path: reports/${basename(sourceFixture.reportPath)}
Source validation: ${
    source.sourceValidation === "passed"
      ? "passed"
      : "nonblocking defects - counterfactual metadata disclosure mismatch"
  }
Source durability: summarized, not cited
Authored artifact durability: new/untracked
Live checkout: fixture branch and tree
Tracker freshness: unavailable - deterministic fixture
Existing same-stem prep classification: ${existingClassification}
Prior-report traversal: not applicable - fixture source is self-contained
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: none - fixture needs no preceding action
${verdict}
Publication package: ${packageValue}

## Source Inventory

Source prioritized findings: ${source.counts.prioritizedFindings}
Source cumulative ledger rows: ${source.counts.cumulativeLedgerRows}
Source strength rows: ${source.counts.strengthRows}
Disposition rows: ${dispositionRows.length}
Strength constraint rows: ${strengthRows.length}
${consumption}
## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| --- | --- | --- | --- | --- |
${dispositionRows.join("\n")}

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| --- | --- | --- | --- |
${strengthRows.join("\n")}

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| --- | --- | --- | --- | --- |
| Fixture rule | FOUNDATIONS fixture boundary | Existing fixture seam | No doc change owed | PRD |

## Recommended PRD Package

${candidates}
## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| --- | --- | --- | --- |
| None | N/A | No additional fixture action. | Current fixture proof. |

## Rejected Or No-Op Alternatives

- No unrelated fixture cleanup.

## PRD Publication Inputs

Recommended testing seam: Existing fixture integration seam.
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: needs-triage in the deterministic fixture
Label downgrade conditions: none
Browser-visible guidance checklist: applies - map every fixture item

## Completion Self-Check

Prep validator: ${completionFields.validator}
Manual semantic review: ${completionFields.semanticReview}
Privacy and stale-language scan: ${completionFields.privacyScan}

## Freshness And Boundaries

The fixture prep changed only this synthetic artifact and did not publish or implement anything.
`;

  writeFileSync(prepPath, options.appendText ? `${markdown}\n${options.appendText}\n` : markdown);
  return prepPath;
}

test("inspects a valid playtest report and inventories cumulative strengths", (t) => {
  const fixture = createSourceFixture(t);
  const result = inspectSourceReport(fixture.reportPath);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.counts, {
    prioritizedFindings: 1,
    cumulativeLedgerRows: 2,
    strengthRows: 1
  });
  assert.deepEqual(result.prioritizedIds, ["F001"]);
  assert.deepEqual(result.cumulativeIds, ["F001", "F002"]);
  assert.deepEqual(result.strengthIds, ["F002"]);
});

test("accepts a continuation report as the inventory frontier", (t) => {
  const fixture = createSourceFixture(t, { continuation: true });
  const result = inspectSourceReport(fixture.reportPath);

  assert.deepEqual(result.errors, []);
  assert.equal(result.runMode, "continuation");
  assert.equal(result.priorReport, "reports/playtest-fixture-2026-07-16T120000Z.md");
});

test("continues inventory across a non-blocking prompt-evaluation metadata defect", (t) => {
  const fixture = createSourceFixture(t, { nonBlockingCounterfactualDefect: true });
  const source = inspectSourceReport(fixture.reportPath);

  assert.deepEqual(source.errors, []);
  assert.equal(source.sourceValidation, "nonblocking-defects");
  assert.equal(source.nonBlockingReportErrors.length, 1);
  assert.deepEqual(source.counts, {
    prioritizedFindings: 1,
    cumulativeLedgerRows: 2,
    strengthRows: 1
  });

  const prepPath = createPrepFixture(t, fixture);
  const prep = validatePrepArtifact(fixture.reportPath, prepPath);
  assert.deepEqual(prep.errors, []);
});

test("rejects a prioritized finding absent from the cumulative ledger", (t) => {
  const fixture = createSourceFixture(t, { cumulativeRows: DEFAULT_CUMULATIVE.slice(1) });
  const result = inspectSourceReport(fixture.reportPath);

  assert(
    result.errors.includes("Prioritized finding F001 is absent from the Cumulative Finding Ledger.")
  );
});

test("validates a single intended PRD package", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture);
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert.deepEqual(result.errors, []);
  assert.equal(result.prep.candidateCount, 1);
  assert.equal(result.prep.publicationPackage, "single intended PRD");
});

test("validates a prep artifact through the command-line entrypoint", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture);
  const result = spawnSync(process.execPath, [validatorPath, fixture.reportPath, prepPath], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "ok");
  assert.equal(payload.source.counts.cumulativeLedgerRows, 2);
  assert.equal(payload.prep.dispositionRows, 2);
});

test("separates draft validation from final completion claims", (t) => {
  const fixture = createSourceFixture(t);
  const draftPath = createPrepFixture(t, fixture, { completionMode: "draft" });
  const draft = validatePrepArtifact(fixture.reportPath, draftPath, {
    completionMode: "draft"
  });

  assert.deepEqual(draft.errors, []);
  assert.equal(draft.prep.completionMode, "draft");

  const prematureFinal = validatePrepArtifact(fixture.reportPath, draftPath);
  assert(prematureFinal.errors.includes("Prep validator must be: passed"));
  assert(prematureFinal.errors.includes("Manual semantic review must be: completed"));
  assert(prematureFinal.errors.includes("Privacy and stale-language scan must be: clear"));

  const cliDraft = spawnSync(
    process.execPath,
    [validatorPath, "--draft", fixture.reportPath, draftPath],
    { encoding: "utf8" }
  );
  assert.equal(cliDraft.status, 0, `${cliDraft.stderr}\n${cliDraft.stdout}`);
  const draftPayload = JSON.parse(cliDraft.stdout);
  assert.equal(draftPayload.mode, "validate-prep-draft");
  assert.equal(draftPayload.prep.completionMode, "draft");

  const finalPath = createPrepFixture(t, fixture);
  const finalAsDraft = validatePrepArtifact(fixture.reportPath, finalPath, {
    completionMode: "draft"
  });
  assert(finalAsDraft.errors.includes("Prep validator must be: pending during draft validation"));
  assert(
    finalAsDraft.errors.includes("Manual semantic review must be: pending during draft validation")
  );
  assert(
    finalAsDraft.errors.includes(
      "Privacy and stale-language scan must be: pending during draft validation"
    )
  );
});

test("validates a first PRD with deferred follow-ons", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture, {
    packageValue: "first PRD plus deferred follow-ons"
  });
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert.deepEqual(result.errors, []);
  assert.equal(result.prep.candidateCount, 2);
});

test("validates a contiguous multi-PRD program", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture, { packageValue: "multi-PRD program" });
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert.deepEqual(result.errors, []);
  assert.equal(result.prep.candidateCount, 2);
});

test("validates a no-new-PRD package and a report with no ledger rows", (t) => {
  const fixture = createSourceFixture(t, { cumulativeRows: [], prioritizedRows: [] });
  const prepPath = createPrepFixture(t, fixture, { packageValue: "no new PRD" });
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert.deepEqual(result.errors, []);
  assert.equal(result.prep.candidateCount, 0);
  assert.equal(result.prep.dispositionRows, 0);
  assert.equal(result.prep.strengthConstraintRows, 0);
});

test("requires every cumulative row exactly once", (t) => {
  const fixture = createSourceFixture(t);
  const missingPath = createPrepFixture(t, fixture, { omitDispositionId: "F001" });
  const missing = validatePrepArtifact(fixture.reportPath, missingPath);
  assert(missing.errors.includes("Evidence Disposition Ledger is missing source row F001."));

  const duplicatePath = createPrepFixture(t, fixture, { duplicateDispositionId: "F001" });
  const duplicate = validatePrepArtifact(fixture.reportPath, duplicatePath);
  assert(
    duplicate.errors.includes("Evidence Disposition Ledger contains duplicate stable ID: F001")
  );
});

test("requires every source strength and its preserve-strength disposition", (t) => {
  const fixture = createSourceFixture(t);
  const missingPath = createPrepFixture(t, fixture, { omitStrengthId: "F002" });
  const missing = validatePrepArtifact(fixture.reportPath, missingPath);
  assert(missing.errors.includes("Strength Preservation Ledger is missing source strength F002."));

  const wrongPath = createPrepFixture(t, fixture, {
    dispositionOverrides: { F002: "covered" }
  });
  const wrong = validatePrepArtifact(fixture.reportPath, wrongPath);
  assert(wrong.errors.includes("Source strength F002 must use disposition preserve-strength."));
});

test("requires verdict and package agreement", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture, {
    verdict: "No-new-PRD verdict: Incorrect fixture verdict."
  });
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert(
    result.errors.includes("single intended PRD must use verdict field: Recommended first new PRD")
  );
});

test("requires an existing-prep consumption ledger on rerun", (t) => {
  const fixture = createSourceFixture(t);
  const missingPath = createPrepFixture(t, fixture, {
    existingClassification: "stale",
    omitConsumption: true
  });
  const missing = validatePrepArtifact(fixture.reportPath, missingPath);
  assert(
    missing.errors.includes(
      "Missing section for table: ### Prior Recommendation Consumption Ledger"
    )
  );

  const presentPath = createPrepFixture(t, fixture, { existingClassification: "stale" });
  const present = validatePrepArtifact(fixture.reportPath, presentPath);
  assert.deepEqual(present.errors, []);
});

test("rejects machine-local path leakage", (t) => {
  const fixture = createSourceFixture(t);
  const prepPath = createPrepFixture(t, fixture, {
    appendText: "Leaked path: /tmp/private-fixture"
  });
  const result = validatePrepArtifact(fixture.reportPath, prepPath);

  assert(result.errors.includes("Prep artifact must not contain machine-local /tmp paths."));
});
