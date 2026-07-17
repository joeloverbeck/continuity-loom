import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CHECKLIST_ITEMS, validateChild, validateRunSheet } from "./validate-publication.mjs";

const expectedChecklistItems = [
  "entry point and availability",
  "user-visible states, actions, and outcomes",
  "validation, warning, error, and recovery behavior",
  "prompt preview contents and freshness",
  "user-initiated external LLM boundary",
  "canon and prose boundary visibility",
  "persistence, migration, export, and provenance",
  "browser and accessibility regression scenario",
];
const checklistItems = CHECKLIST_ITEMS;

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
  forbidLiterals: [],
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

test("loads the Continuity Loom checklist from the issue-tracker authority", () => {
  assert.deepEqual(checklistItems, expectedChecklistItems);
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
    assert.equal(report.selectedRowCount, checklistItems.length);
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

test("run-sheet mode rejects exact run-specific forbidden text without regex escaping", () => {
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
      forbidLiterals: ["reports/.tmp-private"],
      sliceBodies: [{ slice: "Slice A", path: bodyA }],
    }));
    assert.equal(report.affected[0].checks.noForbiddenLiterals, false);
    assert.deepEqual(report.forbiddenLiterals, ["reports/.tmp-private"]);
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
      'AC 1 - "entry point and availability."',
      'AC 2 - "entry point and availability."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.equal(report.affected[0].checks.hasMatchingAcceptanceExcerpts, false);
    assert.deepEqual(report.affected[0].invalidExcerpts, [{
      acceptanceText: "user-visible states, actions, and outcomes.",
      excerpt: "entry point and availability.",
      item: "entry point and availability",
      ordinal: 2,
    }]);
    assert.equal(
      report.affected[0].resolvedCoverage[0].acceptanceText,
      "user-visible states, actions, and outcomes.",
    );
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
      'AC 1 - "entry point and availability."',
      "AC 1",
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].invalidCoverage, ["entry point and availability"]);
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
      "user-visible states, actions, and outcomes.",
      "user-visible states and actions.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 2 - "user-visible states, actions, and outcomes."',
      'AC 2 - "user-visible states and actions."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "user-visible states, actions, and outcomes",
      missing: ["outcomes"],
    }]);
    assert.equal(report.affected[0].checks.hasCompleteCompositeCoverage, false);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode accepts plural entry points with availability", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    const entryPointCriterion = "Prompt Preview and Ideate entry points remain available.";
    writeFileSync(bodyA, checklistIssueBody().replace(
      "entry point and availability.",
      entryPointCriterion,
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 1 - "entry point and availability."',
      `AC 1 - "${entryPointCriterion}"`,
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, []);
    assert.equal(report.affected[0].checks.hasCompleteCompositeCoverage, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode accepts repo-native browser and accessibility wording", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "browser and accessibility regression scenario.",
      "Browser regression and accessible-name coverage exercise the scenario.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 8 - "browser and accessibility regression scenario."',
      'AC 8 - "Browser regression and accessible-name coverage exercise the scenario."',
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

test("run-sheet mode still requires prompt freshness coverage", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "prompt preview contents and freshness.",
      "Prompt preview shows complete contents.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 4 - "prompt preview contents and freshness."',
      'AC 4 - "Prompt preview shows complete contents."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "prompt preview contents and freshness",
      missing: ["freshness"],
    }]);
    assert.equal(report.checks.affectedSlicesPass, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("run-sheet mode still requires accessibility coverage", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-validator-"));
  try {
    const bodyA = join(directory, "a.md");
    writeFileSync(bodyA, checklistIssueBody().replace(
      "browser and accessibility regression scenario.",
      "Browser regression scenario.",
    ));
    const rows = checklistRows("Slice A").replace(
      'AC 8 - "browser and accessibility regression scenario."',
      'AC 8 - "Browser regression scenario."',
    );

    const report = validateRunSheet(`
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
${rows}
`, options({ sliceBodies: [{ slice: "Slice A", path: bodyA }] }));

    assert.deepEqual(report.affected[0].missingCompositeComponents, [{
      item: "browser and accessibility regression scenario",
      missing: ["accessibility"],
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
