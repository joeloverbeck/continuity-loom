import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  checklistValidationArgs,
  resolveFamilyPayloads,
  validateManifest,
  validateWorkingPublicationState,
  verifyPublishedChild,
  verifyPublishedFamily,
} from "./verify-published-family.mjs";

const script = fileURLToPath(new URL("./verify-published-family.mjs", import.meta.url));

const body = ({ blocker = null, externalBlocker = null } = {}) => `
## Parent

PRD #353

## What to build

Build the slice.

## User stories covered

US1.

## Acceptance criteria

- [ ] Observable behavior.

## Blocked by

${blocker != null
  ? `- ${blocker} - Prior slice`
  : externalBlocker != null
    ? `- ${externalBlocker}`
    : "None - can start immediately"}

## Principles

No exception.
`;

const sourceBody = () => `
## Source and coordination

PRD #379

Blocks PRD #379

## What to build

Build the repair.

## User stories covered

US1.

## Acceptance criteria

- [ ] Observable behavior.

## Blocked by

None - can start immediately

## Principles

No exception.
`;

const artifactBody = () => `
## Source and coordination

Playtest report reports/playtest-example.md

Standalone non-PRD follow-up from the playtest report; it does not ratify or implement the remaining PRD candidates.

## What to build

Build the bounded follow-up.

## User stories covered

N/A - the source report has no user stories.

## Acceptance criteria

- [ ] Observable behavior.

## Blocked by

None - can start immediately

## Principles

No exception.
`;

const ledgerBody = `
# Child Issue Map for PRD #353 - Issues #354-#355

| Slice | Issue |
|---|---|
| Contract | #354 |
| Server | #355 |
`;

const manifest = {
  approvedCount: 2,
  forbidLiterals: ["LOCAL_ONLY"],
  forbidPatterns: ["RUN_TOKEN"],
  runSheet: "run-sheet.md",
  workingLedger: "working-publication.json",
  parent: {
    number: 353,
    token: "PRD #353",
    labels: ["enhancement", "needs-triage"],
    ledger: {
      status: "posted",
      commentUrl: "https://example.test/issues/353#comment-1",
      bodyFile: "ledger.md",
    },
  },
  children: [
    {
      number: 354,
      url: "https://example.test/issues/354",
      title: "Contract",
      bodyFile: "354.md",
      slice: "Contract",
      labels: ["enhancement", "needs-triage"],
      blockers: [],
      externalBlockers: [],
      noBlockerPhrase: "None - can start immediately",
      checklistMapped: "yes",
    },
    {
      number: 355,
      url: "https://example.test/issues/355",
      title: "Server",
      bodyFile: "355.md",
      slice: "Server",
      labels: ["enhancement", "ready-for-agent"],
      blockers: ["#354"],
      externalBlockers: [],
      checklistMapped: "yes",
    },
  ],
};

const stagedBodies = new Map([
  [354, body()],
  [355, body({ blocker: "#354" })],
]);

const childPayloads = new Map([
  [354, {
    number: 354,
    title: "Contract",
    body: stagedBodies.get(354).trimEnd(),
    labels: [{ name: "enhancement" }, { name: "needs-triage" }],
    state: "OPEN",
    url: "https://example.test/issues/354",
  }],
  [355, {
    number: 355,
    title: "Server",
    body: stagedBodies.get(355).trimEnd(),
    labels: [{ name: "enhancement" }, { name: "ready-for-agent" }],
    state: "OPEN",
    url: "https://example.test/issues/355",
  }],
]);

const parentPayload = {
  number: 353,
  labels: [{ name: "enhancement" }, { name: "needs-triage" }],
  state: "OPEN",
  url: "https://example.test/issues/353",
  comments: [{
    url: manifest.parent.ledger.commentUrl,
    body: ledgerBody.trimEnd(),
  }],
};

const sourceManifest = {
  approvedCount: 1,
  forbidLiterals: ["LOCAL_ONLY"],
  forbidPatterns: ["RUN_TOKEN"],
  runSheet: "run-sheet.md",
  workingLedger: "working-publication.json",
  source: {
    number: 379,
    token: "PRD #379",
    relationship: "Blocks PRD #379",
  },
  children: [{
    number: 380,
    url: "https://example.test/issues/380",
    title: "Repair conformance before PRD delivery",
    bodyFile: "380.md",
    slice: "Conformance repair",
    labels: ["enhancement", "ready-for-agent"],
    blockers: [],
    externalBlockers: [],
    noBlockerPhrase: "None - can start immediately",
    checklistMapped: "yes",
  }],
};

const sourceStagedBodies = new Map([[380, sourceBody()]]);
const sourceChildPayloads = new Map([[380, {
  number: 380,
  title: sourceManifest.children[0].title,
  body: sourceBody().trimEnd(),
  labels: [{ name: "enhancement" }, { name: "ready-for-agent" }],
  state: "OPEN",
  url: "https://example.test/issues/380",
}]]);
const sourcePayload = {
  number: 379,
  state: "OPEN",
  url: "https://example.test/issues/379",
};

const artifactManifest = {
  ...globalThis.structuredClone(sourceManifest),
  artifactSource: {
    path: "reports/playtest-example.md",
    token: "Playtest report reports/playtest-example.md",
    relationship:
      "Standalone non-PRD follow-up from the playtest report; it does not ratify or implement the remaining PRD candidates.",
    publicationRef: "origin/main",
  },
};
delete artifactManifest.source;
artifactManifest.children[0].title = "Publish bounded playtest follow-up";
const artifactStagedBodies = new Map([[380, artifactBody()]]);
const artifactChildPayloads = new Map([[380, {
  ...sourceChildPayloads.get(380),
  title: artifactManifest.children[0].title,
  body: artifactBody().trimEnd(),
}]]);
const artifactSourceDurability = {
  publicationRef: "origin/main",
  publicationRefSha: "a".repeat(40),
  allDurable: true,
  artifacts: [{
    path: "reports/playtest-example.md",
    tracked: true,
    worktreeClean: true,
    visibleAtRef: true,
    identicalToRef: true,
    durable: true,
    reasons: [],
  }],
};

const workingLedgerFor = (subject) => ({
  approvedCount: subject.approvedCount,
  entries: subject.children.map((child, index) => ({
    slice: child.slice,
    title: child.title,
    number: child.number,
    url: child.url,
    blockedBySlices: index === 0 ? [] : [subject.children[index - 1].slice],
    prerequisiteIssues: [],
    blockers: child.blockers,
    externalBlockers: child.externalBlockers ?? [],
    verifierStatus: "verified",
  })),
});

test("verifies an approved published family and ledger", () => {
  const report = verifyPublishedFamily({
    manifest,
    childPayloads,
    stagedBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.deepEqual(report.failedChecks, []);
  assert.equal(report.checks.approvedCreatedCount, true);
  assert.equal(report.children[1].checks.blockersMatch, true);
  assert.equal(report.parent.checks.ledgerChildrenPresent, true);
});

test("fails the family when a published child has an unexpected label", () => {
  const wrongPayloads = new Map(childPayloads);
  wrongPayloads.set(354, {
    ...wrongPayloads.get(354),
    labels: [...wrongPayloads.get(354).labels, { name: "needs-info" }],
  });

  const report = verifyPublishedFamily({
    manifest,
    childPayloads: wrongPayloads,
    stagedBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.equal(report.children[0].checks.labelsMatch, false);
  assert.equal(report.checks.childrenPass, false);
  assert.deepEqual(report.failedChecks, ["childrenPass"]);
});

test("fails the family when the parent label transition does not match approval", () => {
  const wrongParent = {
    ...parentPayload,
    labels: [{ name: "enhancement" }, { name: "ready-for-agent" }],
  };
  const report = verifyPublishedFamily({
    manifest,
    childPayloads,
    stagedBodies,
    parentPayload: wrongParent,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.equal(report.parent.checks.labelsMatch, false);
  assert.equal(report.checks.parentPass, false);
});

test("single-child verification normalizes markdown and checks the exact contract", () => {
  const report = verifyPublishedChild({
    actual: childPayloads.get(354),
    expected: manifest.children[0],
    expectedBody: `${stagedBodies.get(354)}\n`,
    parentToken: manifest.parent.token,
  });

  assert.equal(report.checks.stagedBodyMatches, true);
  assert.equal(report.checks.labelsMatch, true);
  assert.equal(report.checks.noBlockerPhraseMatches, true);
  assert.equal(report.relationshipMode, "parent");
  assert.equal(report.checks.parentHeadingPresent, true);
  assert.equal(report.checks.parentPresent, true);
  assert.equal("sourceHeadingPresent" in report.checks, false);
  assert.equal("sourcePresent" in report.checks, false);
  assert.equal("sourceRelationshipPresent" in report.checks, false);
  assert.equal("checklistMapped" in report.checks, false);
  assert.equal(Object.values(report.checks).every(Boolean), true);
});

test("single-child verification requires the active parent heading even when the token is present", () => {
  const actual = {
    ...childPayloads.get(354),
    body: childPayloads.get(354).body.replace("## Parent", "## Context"),
  };
  const report = verifyPublishedChild({
    actual,
    expected: manifest.children[0],
    expectedBody: actual.body,
    parentToken: manifest.parent.token,
  });

  assert.equal(report.relationshipMode, "parent");
  assert.equal(report.checks.parentHeadingPresent, false);
  assert.equal(report.checks.parentPresent, true);
});

test("verifies a standalone issue with an exact source relationship and no parent ledger", () => {
  assert.deepEqual(validateManifest(sourceManifest), []);

  const report = verifyPublishedFamily({
    manifest: sourceManifest,
    childPayloads: sourceChildPayloads,
    stagedBodies: sourceStagedBodies,
    sourcePayload,
    checklistVerified: true,
    workingLedger: workingLedgerFor(sourceManifest),
  });

  assert.deepEqual(report.failedChecks, []);
  assert.equal(report.checks.sourcePass, true);
  assert.equal(report.children[0].relationshipMode, "standalone-source");
  assert.equal(report.children[0].checks.sourceHeadingPresent, true);
  assert.equal(report.children[0].checks.sourcePresent, true);
  assert.equal(report.children[0].checks.sourceRelationshipPresent, true);
  assert.equal("parentHeadingPresent" in report.children[0].checks, false);
  assert.equal("parentPresent" in report.children[0].checks, false);
  assert.equal(report.source.relationship, "Blocks PRD #379");
  assert.equal("parent" in report, false);
});

test("manifest validation rejects a parent ledger in standalone-source mode", () => {
  const wrongManifest = globalThis.structuredClone(sourceManifest);
  wrongManifest.source.ledger = { status: "skipped", reason: "not applicable" };

  assert.equal(
    validateManifest(wrongManifest).includes(
      "source.ledger is not allowed in standalone-source mode"),
    true,
  );
});

test("verifies a published family against a durable artifact source", () => {
  assert.deepEqual(validateManifest(artifactManifest), []);

  const report = verifyPublishedFamily({
    manifest: artifactManifest,
    childPayloads: artifactChildPayloads,
    stagedBodies: artifactStagedBodies,
    artifactSourceDurability,
    checklistVerified: true,
    workingLedger: workingLedgerFor(artifactManifest),
  });

  assert.deepEqual(report.failedChecks, []);
  assert.equal(report.checks.artifactSourcePass, true);
  assert.equal(report.children[0].relationshipMode, "artifact-source");
  assert.equal(report.children[0].checks.sourcePresent, true);
  assert.equal(report.children[0].checks.sourceRelationshipPresent, true);
  assert.equal(report.artifactSource.checks.artifactDurable, true);
  assert.equal(report.artifactSource.path, "reports/playtest-example.md");
  assert.equal("parent" in report, false);
  assert.equal("source" in report, false);
});

test("fails artifact-source verification when source bytes are not durable", () => {
  const durability = globalThis.structuredClone(artifactSourceDurability);
  durability.allDurable = false;
  durability.artifacts[0].durable = false;
  durability.artifacts[0].identicalToRef = false;
  durability.artifacts[0].reasons = ["content-differs-from-ref"];

  const report = verifyPublishedFamily({
    manifest: artifactManifest,
    childPayloads: artifactChildPayloads,
    stagedBodies: artifactStagedBodies,
    artifactSourceDurability: durability,
    checklistVerified: true,
    workingLedger: workingLedgerFor(artifactManifest),
  });

  assert.equal(report.checks.artifactSourcePass, false);
  assert.deepEqual(report.failedChecks, ["artifactSourcePass"]);
  assert.deepEqual(report.artifactSource.reasons, ["content-differs-from-ref"]);
});

test("manifest validation requires a complete exclusive artifact source", () => {
  const incomplete = globalThis.structuredClone(artifactManifest);
  delete incomplete.artifactSource.publicationRef;
  assert.equal(
    validateManifest(incomplete).includes(
      "artifactSource.path, artifactSource.token, artifactSource.relationship, and artifactSource.publicationRef are required",
    ),
    true,
  );

  const ambiguous = globalThis.structuredClone(artifactManifest);
  ambiguous.source = globalThis.structuredClone(sourceManifest.source);
  assert.equal(
    validateManifest(ambiguous).includes("exactly one of parent, source, or artifactSource is required"),
    true,
  );

  const traversing = globalThis.structuredClone(artifactManifest);
  traversing.artifactSource.path = "../private-report.md";
  assert.equal(
    validateManifest(traversing).includes(
      "artifactSource.path must be a repo-relative path without parent traversal",
    ),
    true,
  );
});

test("manifest validation requires valid custom forbidden values and a working ledger", () => {
  const missing = globalThis.structuredClone(manifest);
  delete missing.forbidLiterals;
  delete missing.forbidPatterns;
  delete missing.workingLedger;
  assert.equal(validateManifest(missing).includes("forbidLiterals must be an array"), true);
  assert.equal(validateManifest(missing).includes("forbidPatterns must be an array"), true);
  assert.equal(validateManifest(missing).includes("workingLedger is required"), true);

  const invalidLiteral = globalThis.structuredClone(manifest);
  invalidLiteral.forbidLiterals = ["   "];
  assert.equal(
    validateManifest(invalidLiteral).includes("forbidLiterals must contain non-empty strings"),
    true,
  );

  const invalid = globalThis.structuredClone(manifest);
  invalid.forbidPatterns = ["("];
  assert.equal(validateManifest(invalid).some((error) => error.startsWith("forbidPatterns[0] is invalid:")), true);
});

test("family checklist validation receives every manifest forbidden value", () => {
  const args = checklistValidationArgs(manifest);
  assert.deepEqual(args.slice(-4), [
    "--forbid-pattern",
    "RUN_TOKEN",
    "--forbid-literal",
    "LOCAL_ONLY",
  ]);
});

test("single-child verification rejects a mismatched standalone source relationship", () => {
  const actual = sourceChildPayloads.get(380);
  const report = verifyPublishedChild({
    actual,
    expected: sourceManifest.children[0],
    expectedBody: actual.body,
    sourceToken: sourceManifest.source.token,
    sourceRelationship: "Follows PRD #379",
  });

  assert.equal(report.checks.sourcePresent, true);
  assert.equal(report.checks.sourceRelationshipPresent, false);
});

test("single-child verification applies a run-specific placeholder pattern", () => {
  const actual = {
    ...childPayloads.get(354),
    body: childPayloads.get(354).body.replace("Build the slice.", "Build RUN_TOKEN."),
  };
  const report = verifyPublishedChild({
    actual,
    expected: manifest.children[0],
    expectedBody: actual.body,
    parentToken: manifest.parent.token,
    placeholderRe: "#SLICE|PLACEHOLDER|RUN_TOKEN",
  });

  assert.equal(report.checks.noPlaceholders, false);
});

test("single-child verification rejects every family forbidden pattern", () => {
  const actual = {
    ...childPayloads.get(354),
    body: childPayloads.get(354).body.replace("Build the slice.", "Build RUN_TOKEN."),
  };
  const report = verifyPublishedChild({
    actual,
    expected: manifest.children[0],
    expectedBody: actual.body,
    forbiddenPatterns: manifest.forbidPatterns,
    parentToken: manifest.parent.token,
  });

  assert.equal(report.checks.noForbiddenPatterns, false);
  assert.deepEqual(report.forbiddenPatterns, ["RUN_TOKEN"]);
});

test("single-child verification rejects exact family forbidden text", () => {
  const actual = {
    ...childPayloads.get(354),
    body: childPayloads.get(354).body.replace("Build the slice.", "Build LOCAL_ONLY."),
  };
  const report = verifyPublishedChild({
    actual,
    expected: manifest.children[0],
    expectedBody: actual.body,
    forbiddenLiterals: manifest.forbidLiterals,
    parentToken: manifest.parent.token,
  });

  assert.equal(report.checks.noForbiddenLiterals, false);
  assert.deepEqual(report.forbiddenLiterals, ["LOCAL_ONLY"]);
});

test("single-child CLI rejects exact forbidden text from a snapshot", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-child-snapshot-"));
  try {
    const bodyFile = join(directory, "354.md");
    const snapshotFile = join(directory, "354.json");
    const actual = {
      ...childPayloads.get(354),
      body: childPayloads.get(354).body.replace("Build the slice.", "Build LOCAL_ONLY."),
    };
    writeFileSync(bodyFile, actual.body);
    writeFileSync(snapshotFile, JSON.stringify(actual));

    const result = spawnSync(process.execPath, [
      script,
      "child",
      "354",
      bodyFile,
      "--title",
      "Contract",
      "--parent",
      "PRD #353",
      "--label",
      "enhancement",
      "--label",
      "needs-triage",
      "--expect-no-blocker",
      "--forbid-literal",
      "LOCAL_ONLY",
      "--snapshot",
      snapshotFile,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.checks.noForbiddenLiterals, false);
    assert.deepEqual(report.forbiddenLiterals, ["LOCAL_ONLY"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("family verification rejects a forbidden pattern in the exact posted ledger", () => {
  const forbiddenLedger = `${ledgerBody}\nRUN_TOKEN\n`;
  const forbiddenParent = globalThis.structuredClone(parentPayload);
  forbiddenParent.comments[0].body = forbiddenLedger.trimEnd();
  const report = verifyPublishedFamily({
    manifest,
    childPayloads,
    stagedBodies,
    parentPayload: forbiddenParent,
    ledgerBody: forbiddenLedger,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.equal(report.parent.checks.ledgerPostureValid, true);
  assert.equal(report.parent.checks.ledgerNoForbiddenPatterns, false);
  assert.equal(report.checks.parentPass, false);
});

test("family verification rejects exact forbidden text in the posted ledger", () => {
  const forbiddenLedger = `${ledgerBody}\nLOCAL_ONLY\n`;
  const forbiddenParent = globalThis.structuredClone(parentPayload);
  forbiddenParent.comments[0].body = forbiddenLedger.trimEnd();
  const report = verifyPublishedFamily({
    manifest,
    childPayloads,
    stagedBodies,
    parentPayload: forbiddenParent,
    ledgerBody: forbiddenLedger,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.equal(report.parent.checks.ledgerPostureValid, true);
  assert.equal(report.parent.checks.ledgerNoForbiddenLiterals, false);
  assert.equal(report.checks.parentPass, false);
});

test("family verification requires every working-ledger entry to be verified", () => {
  const workingLedger = workingLedgerFor(manifest);
  workingLedger.entries[1].verifierStatus = "failed";
  const report = verifyPublishedFamily({
    manifest,
    childPayloads,
    stagedBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger,
  });

  assert.equal(report.workingPublicationLedger.entries[1].checks.verifierPassed, false);
  assert.equal(report.checks.workingPublicationLedgerPass, false);
  assert.equal(report.failedChecks.includes("workingPublicationLedgerPass"), true);
});

test("working-ledger validation preserves logical blockers before numbers exist", () => {
  const workingLedger = {
    approvedCount: 2,
    entries: [
      {
        slice: "Contract",
        title: "Contract",
        number: null,
        url: null,
        blockedBySlices: [],
        prerequisiteIssues: [],
        blockers: [],
        externalBlockers: [],
        verifierStatus: null,
      },
      {
        slice: "Server",
        title: "Server",
        number: null,
        url: null,
        blockedBySlices: ["Contract"],
        prerequisiteIssues: [],
        blockers: [],
        externalBlockers: [],
        verifierStatus: null,
      },
    ],
  };

  assert.deepEqual(validateWorkingPublicationState(workingLedger), []);

  workingLedger.entries[0] = {
    ...workingLedger.entries[0],
    number: 354,
    url: "https://example.test/issues/354",
    verifierStatus: "verified",
  };
  assert.equal(
    validateWorkingPublicationState(workingLedger).includes(
      "entries[1].blockers must equal prerequisiteIssues plus verified blockedBySlices"),
    true,
  );

  workingLedger.entries[1].blockers = ["#354"];
  assert.deepEqual(validateWorkingPublicationState(workingLedger), []);
});

test("working-ledger validation rejects forward and unknown dependency edges", () => {
  const workingLedger = {
    approvedCount: 2,
    entries: [
      {
        slice: "Contract",
        title: "Contract",
        number: null,
        url: null,
        blockedBySlices: ["Server", "Missing"],
        prerequisiteIssues: [],
        blockers: [],
        externalBlockers: [],
        verifierStatus: null,
      },
      {
        slice: "Server",
        title: "Server",
        number: null,
        url: null,
        blockedBySlices: [],
        prerequisiteIssues: [],
        blockers: [],
        externalBlockers: [],
        verifierStatus: null,
      },
    ],
  };

  const errors = validateWorkingPublicationState(workingLedger);
  assert.equal(errors.includes("entries[0].blockedBySlices must reference an earlier slice: Server"), true);
  assert.equal(errors.includes("entries[0].blockedBySlices references unknown slice Missing"), true);
});

test("family payload resolution uses complete snapshots without calling gh", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-snapshots-"));
  try {
    const childPaths = new Map();
    for (const [number, payload] of childPayloads) {
      const path = join(directory, `${number}.json`);
      writeFileSync(path, JSON.stringify(payload));
      childPaths.set(number, path);
    }
    const parentPath = join(directory, "parent.json");
    writeFileSync(parentPath, JSON.stringify(parentPayload));

    const resolved = resolveFamilyPayloads({
      manifest,
      childSnapshots: childPaths,
      parentSnapshot: parentPath,
      fetcher: () => {
        throw new Error("gh should not be called in snapshot mode");
      },
    });

    assert.deepEqual(resolved.childPayloads.get(354), childPayloads.get(354));
    assert.deepEqual(resolved.parentPayload, parentPayload);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("artifact-source snapshot mode requires only complete child snapshots", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-artifact-snapshots-"));
  try {
    const childPath = join(directory, "380.json");
    writeFileSync(childPath, JSON.stringify(artifactChildPayloads.get(380)));
    const childPaths = new Map([[380, childPath]]);

    const resolved = resolveFamilyPayloads({
      manifest: artifactManifest,
      childSnapshots: childPaths,
      fetcher: () => {
        throw new Error("gh should not be called in artifact-source snapshot mode");
      },
    });

    assert.deepEqual(resolved.childPayloads.get(380), artifactChildPayloads.get(380));
    assert.equal(resolved.parentPayload, null);
    assert.equal(resolved.sourcePayload, null);
    assert.throws(
      () => resolveFamilyPayloads({
        manifest: artifactManifest,
        childSnapshots: childPaths,
        sourceSnapshot: childPath,
      }),
      /--source-snapshot is not valid in artifact-source mode/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("family CLI verifies a complete standalone-source snapshot set without gh", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-family-snapshots-"));
  try {
    const bodyFile = join(directory, "380.md");
    const runSheet = join(directory, "run-sheet.md");
    const workingLedger = join(directory, "working-ledger.json");
    const childSnapshot = join(directory, "380.json");
    const sourceSnapshot = join(directory, "379.json");
    const manifestFile = join(directory, "manifest.json");
    const cliManifest = globalThis.structuredClone(sourceManifest);
    cliManifest.runSheet = runSheet;
    cliManifest.workingLedger = workingLedger;
    cliManifest.children[0].bodyFile = bodyFile;
    cliManifest.children[0].checklistMapped = "N/A - server-only repair";

    writeFileSync(bodyFile, sourceBody());
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
| Conformance repair | browser-visible guidance checklist | N/A | N/A - server-only repair |
`);
    writeFileSync(workingLedger, JSON.stringify(workingLedgerFor(cliManifest)));
    writeFileSync(childSnapshot, JSON.stringify(sourceChildPayloads.get(380)));
    writeFileSync(sourceSnapshot, JSON.stringify(sourcePayload));
    writeFileSync(manifestFile, JSON.stringify(cliManifest));

    const result = spawnSync(process.execPath, [
      script,
      manifestFile,
      "--child-snapshot",
      `380=${childSnapshot}`,
      "--source-snapshot",
      sourceSnapshot,
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.checks.sourcePass, true);
    assert.deepEqual(report.failedChecks, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("family CLI verifies child snapshots against a live durable artifact source", () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-artifact-family-"));
  try {
    const bodyFile = join(directory, "380.md");
    const runSheet = join(directory, "run-sheet.md");
    const workingLedger = join(directory, "working-ledger.json");
    const childSnapshot = join(directory, "380.json");
    const manifestFile = join(directory, "manifest.json");
    const cliManifest = globalThis.structuredClone(artifactManifest);
    cliManifest.runSheet = runSheet;
    cliManifest.workingLedger = workingLedger;
    cliManifest.artifactSource.path = "docs/ACTIVE-DOCS.md";
    cliManifest.artifactSource.token = "Authority artifact docs/ACTIVE-DOCS.md";
    cliManifest.artifactSource.publicationRef = "HEAD";
    cliManifest.children[0].bodyFile = bodyFile;
    cliManifest.children[0].checklistMapped = "N/A - validator fixture only";
    const cliBody = artifactBody().replace(
      "Playtest report reports/playtest-example.md",
      "Authority artifact docs/ACTIVE-DOCS.md",
    );
    const cliPayload = {
      ...artifactChildPayloads.get(380),
      body: cliBody.trimEnd(),
    };

    writeFileSync(bodyFile, cliBody);
    writeFileSync(runSheet, `
| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
| Conformance repair | browser-visible guidance checklist | N/A | N/A - validator fixture only |
`);
    writeFileSync(workingLedger, JSON.stringify(workingLedgerFor(cliManifest)));
    writeFileSync(childSnapshot, JSON.stringify(cliPayload));
    writeFileSync(manifestFile, JSON.stringify(cliManifest));

    const result = spawnSync(process.execPath, [
      script,
      manifestFile,
      "--child-snapshot",
      `380=${childSnapshot}`,
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.checks.artifactSourcePass, true);
    assert.equal(report.artifactSource.path, "docs/ACTIVE-DOCS.md");
    assert.deepEqual(report.failedChecks, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fails the family when a published blocker differs from the manifest", () => {
  const wrongBodies = new Map(stagedBodies);
  wrongBodies.set(355, body({ blocker: "#999" }));
  const wrongPayloads = new Map(childPayloads);
  wrongPayloads.set(355, {
    ...wrongPayloads.get(355),
    body: wrongBodies.get(355),
  });

  const report = verifyPublishedFamily({
    manifest,
    childPayloads: wrongPayloads,
    stagedBodies: wrongBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(manifest),
  });

  assert.equal(report.children[1].checks.blockersMatch, false);
  assert.equal(report.checks.childrenPass, false);
  assert.deepEqual(report.failedChecks, ["childrenPass"]);
});

test("verifies an exact external blocker for a checklist-mapped needs-triage child", () => {
  const externalBlocker = "P-03 conformance repair with a current active-route packet";
  const externalManifest = globalThis.structuredClone(manifest);
  externalManifest.children[0].externalBlockers = [externalBlocker];
  delete externalManifest.children[0].noBlockerPhrase;
  const externalBodies = new Map(stagedBodies);
  externalBodies.set(354, body({ externalBlocker }));
  const externalPayloads = new Map(childPayloads);
  externalPayloads.set(354, {
    ...externalPayloads.get(354),
    body: externalBodies.get(354),
  });

  const report = verifyPublishedFamily({
    manifest: externalManifest,
    childPayloads: externalPayloads,
    stagedBodies: externalBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(externalManifest),
  });

  assert.deepEqual(report.children[0].actualBlockers, []);
  assert.deepEqual(report.children[0].actualExternalBlockers, [externalBlocker]);
  assert.equal(report.children[0].checks.externalBlockersMatch, true);
  assert.equal(report.children[0].checks.checklistMapped, true);
  assert.deepEqual(report.failedChecks, []);
});

test("manifest validation reserves noBlockerPhrase for a truly unblocked child", () => {
  const externalManifest = globalThis.structuredClone(manifest);
  externalManifest.children[0].externalBlockers = ["P-03 conformance repair"];
  delete externalManifest.children[0].noBlockerPhrase;
  assert.deepEqual(validateManifest(externalManifest), []);

  externalManifest.children[0].noBlockerPhrase = "None - can start immediately";
  assert.equal(
    validateManifest(externalManifest).includes(
      "children[0].noBlockerPhrase is valid only when tracker and external blockers are empty"),
    true,
  );
});

test("fails the family when an external blocker differs from the manifest", () => {
  const externalManifest = globalThis.structuredClone(manifest);
  externalManifest.children[0].externalBlockers = ["P-03 conformance repair"];
  delete externalManifest.children[0].noBlockerPhrase;
  const wrongBodies = new Map(stagedBodies);
  wrongBodies.set(354, body({ externalBlocker: "F-01 conformance repair" }));
  const wrongPayloads = new Map(childPayloads);
  wrongPayloads.set(354, {
    ...wrongPayloads.get(354),
    body: wrongBodies.get(354),
  });

  const report = verifyPublishedFamily({
    manifest: externalManifest,
    childPayloads: wrongPayloads,
    stagedBodies: wrongBodies,
    parentPayload,
    ledgerBody,
    checklistVerified: true,
    workingLedger: workingLedgerFor(externalManifest),
  });

  assert.equal(report.children[0].checks.externalBlockersMatch, false);
  assert.equal(report.checks.childrenPass, false);
  assert.deepEqual(report.failedChecks, ["childrenPass"]);
});
