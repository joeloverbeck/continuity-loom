import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const validatorPath = fileURLToPath(new URL("./validate-prd-body.mjs", import.meta.url));

const issueTrackerPath = fileURLToPath(
  new URL("../../../../docs/agents/issue-tracker.md", import.meta.url),
);
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
const checklistAuthority = readFileSync(issueTrackerPath, "utf8");
const checklistBlock = checklistAuthority.match(
  /<!-- browser-visible-guidance-checklist:start -->([\s\S]*?)<!-- browser-visible-guidance-checklist:end -->/,
)?.[1];
const checklistItems = [...(checklistBlock ?? "").matchAll(/^- `([^`]+)`: /gm)].map(
  (match) => match[1],
);

const titleCase = (value) => value[0].toUpperCase() + value.slice(1);

const bodyWithChecklist = (items) => `Publication provenance was ratified in this session.

## Problem Statement

The publication body needs validation.

## Solution

Validate the body before publication.

## User Stories

1. As a steward, I want checklist validation, so that publication remains safe

## Implementation Decisions

### Browser-visible guidance checklist mapping

| Checklist item | PRD home |
|---|---|
${items.map((item) => `| ${item} | Implementation Decisions home |`).join("\n")}

## Testing Decisions

Seam confirmation: answered with the existing seam.

## Principles

The body affirms non-contradiction.

## Out of Scope

Runtime implementation.

## Further Notes

Seam confirmation: answered.
`;

const runValidator = (body, args = ["--stdin", "--expect-checklist"]) => {
  const result = spawnSync(process.execPath, [validatorPath, ...args], {
    encoding: "utf8",
    input: body,
  });
  return {
    ...result,
    report: result.stdout.trim() ? JSON.parse(result.stdout) : null,
  };
};

const validate = (body) => runValidator(body);
const extractSources = (body) => runValidator(body, ["--stdin", "--extract-sources"]);

test("loads the Continuity Loom checklist from the issue-tracker authority", () => {
  assert.deepEqual(checklistItems, expectedChecklistItems);
});

test("accepts lowercase browser checklist labels", () => {
  const result = validate(bodyWithChecklist(checklistItems));

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.checklistMissing, []);
});

test("accepts Title Case browser checklist labels", () => {
  const result = validate(bodyWithChecklist(checklistItems.map(titleCase)));

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.checklistMissing, []);
});

test("still rejects a genuinely missing browser checklist item", () => {
  const result = validate(bodyWithChecklist(checklistItems.slice(0, -1)));

  assert.equal(result.status, 1);
  assert.deepEqual(result.report.checklistMissing, ["browser and accessibility regression scenario"]);
});

test("ignores an unformatted slash compound that is not a source citation", () => {
  const result = extractSources("The archive/draft mismatch is author-visible.");

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.localSourcePaths, []);
});

test("extracts extension-bearing and explicitly formatted source paths", () => {
  const result = extractSources(
    "Use docs/principles/FOUNDATIONS.md, reports/playtest.md, archive/specs/SPEC.md, and `archive/draft`.",
  );

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.localSourcePaths, [
    "archive/draft",
    "archive/specs/SPEC.md",
    "docs/principles/FOUNDATIONS.md",
    "reports/playtest.md",
  ]);
});

test("requires the seam confirmation marker in Testing Decisions", () => {
  const body = bodyWithChecklist(checklistItems).replace(
    "Seam confirmation: answered with the existing seam.",
    "The user ratified the existing seam.",
  );
  const result = validate(body);

  assert.equal(result.status, 1);
  assert.equal(result.report.checks.hasTestingSeamConfirmationMarker, false);
  assert.equal(result.report.checks.hasFurtherNotesSeamConfirmationMarker, true);
  assert.deepEqual(result.report.failures, ["hasTestingSeamConfirmationMarker"]);
});

test("requires the seam confirmation marker in Further Notes", () => {
  const body = bodyWithChecklist(checklistItems).replace(
    "Seam confirmation: answered.",
    "The Step 2 answer ratified the test package.",
  );
  const result = validate(body);

  assert.equal(result.status, 1);
  assert.equal(result.report.checks.hasTestingSeamConfirmationMarker, true);
  assert.equal(result.report.checks.hasFurtherNotesSeamConfirmationMarker, false);
  assert.deepEqual(result.report.failures, ["hasFurtherNotesSeamConfirmationMarker"]);
});

test("loads checklist and source policy from a reusable policy file", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-prd-policy-"));
  const policyFile = join(directory, "policy.json");
  try {
    writeFileSync(policyFile, JSON.stringify({
      expectChecklist: true,
      approvedSources: ["CONTEXT.md"],
      disallowedSources: ["reports/local-prep.md"],
    }));
    const body = bodyWithChecklist(checklistItems).replace(
      "Publication provenance was ratified in this session.",
      "Publication provenance from CONTEXT.md was ratified in this session.",
    );

    const result = runValidator(body, ["--stdin", "--policy-file", policyFile]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.report.policyFile, policyFile);
    assert.equal(result.report.expectsChecklist, true);
    assert.deepEqual(result.report.approvedDurableSourcePaths, ["CONTEXT.md"]);
    assert.deepEqual(result.report.disallowedLocalSources, ["reports/local-prep.md"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects mixing a policy file with inline policy options", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-prd-policy-"));
  const policyFile = join(directory, "policy.json");
  try {
    writeFileSync(policyFile, JSON.stringify({
      expectChecklist: true,
      approvedSources: [],
      disallowedSources: [],
    }));

    const result = runValidator(bodyWithChecklist(checklistItems), [
      "--stdin",
      "--policy-file",
      policyFile,
      "--expect-checklist",
    ]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /Do not combine --policy-file with inline checklist or source-policy options/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects malformed validator policy fields", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-prd-policy-"));
  const policyFile = join(directory, "policy.json");
  try {
    writeFileSync(policyFile, JSON.stringify({
      expectChecklist: "yes",
      approvedSources: [],
      disallowedSources: [],
    }));

    const result = runValidator(bodyWithChecklist(checklistItems), ["--stdin", "--policy-file", policyFile]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /expectChecklist must be a boolean/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
