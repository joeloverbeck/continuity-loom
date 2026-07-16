import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateChild, validateRunSheet } from "./validate-publication.mjs";

const checklistItems = [
  "package source cited",
  "decision-point contract named",
  "required, optional, skippable, and severity-dependent fields visible where relevant",
  "doctrine at the actual decision point",
  "prompt packet preview, source manifest, and cold external LLM test",
  "advisory/canon separation visible",
  "skip path and reason storage",
  "blockers/substance validation",
  "current, next, and resume state",
  "read-side audit or provenance link",
  "cognitive walkthrough scenario",
];

const issueBody = (blocker = "None - can start immediately") => `
## Parent

PRD #1

## What to build

Build the slice.

## User stories covered

US1.

## Acceptance criteria

- [ ] Observable behavior.

## Blocked by

${blocker}

## Principles

No exception.
`;

const checklistIssueBody = () => issueBody().replace(
  "- [ ] Observable behavior.",
  checklistItems.map((item) => `- [ ] ${item}.`).join("\n"),
);

const checklistRows = (slice) => checklistItems
  .map((item, index) => `| ${slice} | ${item} | AC ${index + 1} - "${item}." | - |`)
  .join("\n");

const options = (overrides = {}) => ({
  blockers: [],
  children: [],
  externalBlockers: [],
  expectAcCount: null,
  expectChecklistNa: false,
  expectNoBlocker: false,
  expectStories: false,
  forbidPatterns: [],
  onlySlices: [],
  parent: null,
  placeholderRe: "#SLICE|PLACEHOLDER",
  sliceBodies: [],
  source: null,
  sourceRelationship: null,
  unaffectedSlices: [],
  ...overrides,
});

test("run-sheet mode requires every represented slice by default", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    const runSheet = join(directory, "run-sheet.md");
    writeFileSync(bodyA, checklistIssueBody());
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${checklistRows("Slice A")}
${checklistRows("Slice B")}
`);

    const report = validateRunSheet(readFile(runSheet), options({
      sliceBodies: [{ slice: "Slice A", path: bodyA }],
    }));
    assert.deepEqual(report.unconfiguredSlices, ["Slice B"]);
    assert.equal(report.checks.hasNoUnconfiguredSlices, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--only-slice supports a serial check against a shared run sheet", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    const runSheet = join(directory, "run-sheet.md");
    writeFileSync(bodyA, checklistIssueBody());
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${checklistRows("Slice A")}
${checklistRows("Slice B")}
`);

    const report = validateRunSheet(readFile(runSheet), options({
      onlySlices: ["Slice A"],
      sliceBodies: [{ slice: "Slice A", path: bodyA }],
    }));
    assert.deepEqual(report.onlySlices, ["Slice A"]);
    assert.equal(report.selectedRowCount, 11);
    assert.deepEqual(report.unconfiguredSlices, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode rejects placeholders in a configured affected child body", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    const runSheet = join(directory, "run-sheet.md");
    writeFileSync(bodyA, checklistIssueBody().replace("Build the slice.", "Build #SLICE."));
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${checklistRows("Slice A")}
`);

    const report = validateRunSheet(readFile(runSheet), options({
      sliceBodies: [{ slice: "Slice A", path: bodyA }],
    }));
    assert.equal(report.affected[0].checks.noPlaceholders, false);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode rejects a run-specific forbidden pattern in a configured body", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    const runSheet = join(directory, "run-sheet.md");
    writeFileSync(bodyA, checklistIssueBody().replace("Build the slice.", "Build reports/.tmp-private.md."));
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${checklistRows("Slice A")}
`);

    const report = validateRunSheet(readFile(runSheet), options({
      forbidPatterns: ["reports/\\.tmp"],
      sliceBodies: [{ slice: "Slice A", path: bodyA }],
    }));
    assert.equal(report.affected[0].checks.noForbiddenPatterns, false);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode resolves each verbatim excerpt against its exact acceptance criterion", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody());
    const rows = checklistRows("Slice A").replace(
      'AC 1 - "package source cited."',
      'AC 2 - "package source cited."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.equal(report.affected[0].checks.hasMatchingAcceptanceExcerpts, false);
    assert.deepEqual(report.affected[0].invalidExcerpts, [{
      acceptanceText: "decision-point contract named.",
      excerpt: "package source cited.",
      item: "package source cited",
      ordinal: 2,
    }]);
    assert.equal(report.affected[0].resolvedCoverage[0].acceptanceText, "decision-point contract named.");
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode rejects a bare AC ordinal without a verbatim excerpt", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody());
    const rows = checklistRows("Slice A").replace(
      'AC 1 - "package source cited."',
      "AC 1",
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].invalidCoverage, ["package source cited"]);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode requires every component named by a composite checklist item", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "prompt packet preview, source manifest, and cold external LLM test.",
      "prompt packet preview and source manifest.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 5 - "prompt packet preview, source manifest, and cold external LLM test."',
      'AC 5 - "prompt packet preview and source manifest."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "prompt packet preview, source manifest, and cold external LLM test",
      missing: ["cold external LLM test"],
    }]);
    assert.equal(report.affected[0].checks.hasCompleteCompositeCoverage, false);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode accepts repo-native governed-deferral and incomplete-work language", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody()
      .replace(
        "skip path and reason storage.",
        "Governed deferral requires a rationale and records it in immutable history.",
      )
      .replace(
        "blockers/substance validation.",
        "Server blockers refuse incomplete specialized work and return remediation.",
      ));
    const rows = checklistRows("Slice A")
      .replace(
        'AC 7 - "skip path and reason storage."',
        'AC 7 - "Governed deferral requires a rationale and records it in immutable history."',
      )
      .replace(
        'AC 8 - "blockers/substance validation."',
        'AC 8 - "Server blockers refuse incomplete specialized work and return remediation."',
      );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, []);
    assert.equal(report.affected[0].checks.hasCompleteCompositeCoverage, true);
    assert.equal(report.checks.affectedSlicesPass, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode still requires reason persistence for governed deferral", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "skip path and reason storage.",
      "Governed deferral is available.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 7 - "skip path and reason storage."',
      'AC 7 - "Governed deferral is available."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "skip path and reason storage",
      missing: ["reason storage"],
    }]);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode still requires incomplete-work or substance validation", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "blockers/substance validation.",
      "Server blockers return exact remediation.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 8 - "blockers/substance validation."',
      'AC 8 - "Server blockers return exact remediation."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "blockers/substance validation",
      missing: ["substance validation"],
    }]);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("child output distinguishes an inactive no-blocker expectation", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const body = join(directory, "blocked.md");
    writeFileSync(body, issueBody("- #10 - Contract blocker"));

    const report = validateChild(readFile(body), options({
      blockers: ["#10"],
      expectAcCount: 1,
      expectStories: true,
      parent: "PRD #1",
    }));
    assert.deepEqual(report.actualBlockers, ["#10"]);
    assert.deepEqual(report.expectations, { noBlocker: false });
    assert.equal(report.checks.noBlockerExpectationPassed, true);
    assert.equal("hasNoBlocker" in report.checks, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("child validation treats an exact non-tracker prerequisite as an external blocker", () => {
  const externalBlocker = "P-03 conformance repair with a current active-route packet";
  const report = validateChild(issueBody(`- ${externalBlocker}`), options({
    externalBlockers: [externalBlocker],
    expectAcCount: 1,
    expectStories: true,
    parent: "PRD #1",
  }));

  assert.deepEqual(report.actualBlockers, []);
  assert.deepEqual(report.actualExternalBlockers, [externalBlocker]);
  assert.deepEqual(report.expectedExternalBlockers, [externalBlocker]);
  assert.equal(report.checks.hasExpectedExternalBlockers, true);
  assert.equal(report.checks.hasOnlyExpectedExternalBlockers, true);
});

test("child validation rejects an undeclared external blocker instead of treating it as no blocker", () => {
  const report = validateChild(issueBody("- P-03 conformance repair"), options({
    expectAcCount: 1,
    expectStories: true,
    parent: "PRD #1",
  }));

  assert.deepEqual(report.actualExternalBlockers, ["P-03 conformance repair"]);
  assert.equal(report.checks.hasOnlyExpectedExternalBlockers, false);
});

test("child validation rejects each configured run-specific forbidden pattern", () => {
  const report = validateChild(
    issueBody().replace("Build the slice.", "Build reports/.tmp-private.md from field-build-18-local.md."),
    options({
      expectNoBlocker: true,
      forbidPatterns: ["reports/\\.tmp", "field-build-18-.*\\.md"],
    }),
  );

  assert.deepEqual(report.forbiddenPatterns, ["field-build-18-.*\\.md", "reports/\\.tmp"]);
  assert.equal(report.checks.noForbiddenPatterns, false);
});

test("child validation accepts an exact standalone source relationship", () => {
  const sourceBody = issueBody().replace(
    "## Parent\n\nPRD #1",
    "## Source and coordination\n\nPRD #379\n\nBlocks PRD #379",
  );
  const report = validateChild(sourceBody, options({
    expectAcCount: 1,
    expectNoBlocker: true,
    expectStories: true,
    source: "PRD #379",
    sourceRelationship: "Blocks PRD #379",
  }));

  assert.equal(report.checks.hasSourceHeading, true);
  assert.equal(report.checks.hasSource, true);
  assert.equal(report.checks.hasSourceRelationship, true);
  assert.equal(Object.values(report.checks).every(Boolean), true);
});

test("child validation rejects a mismatched standalone source relationship", () => {
  const sourceBody = issueBody().replace(
    "## Parent\n\nPRD #1",
    "## Source and coordination\n\nPRD #379\n\nCoordinates with PRD #379",
  );
  const report = validateChild(sourceBody, options({
    expectNoBlocker: true,
    source: "PRD #379",
    sourceRelationship: "Blocks PRD #379",
  }));

  assert.equal(report.checks.hasSourceRelationship, false);
});

function readFile(path) {
  return readFileSync(path, "utf8");
}
