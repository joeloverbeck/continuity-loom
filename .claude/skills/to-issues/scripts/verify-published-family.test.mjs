import assert from "node:assert/strict";
import test from "node:test";
import {
  checklistValidationArgs,
  validateManifest,
  verifyPublishedChild,
  verifyPublishedFamily,
} from "./verify-published-family.mjs";

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

const ledgerBody = `
# Child Issue Map for PRD #353 - Issues #354-#355

| Slice | Issue |
|---|---|
| Contract | #354 |
| Server | #355 |
`;

const manifest = {
  approvedCount: 2,
  forbidPatterns: ["RUN_TOKEN"],
  runSheet: "run-sheet.md",
  workingLedger: "working-publication.json",
  parent: {
    number: 353,
    token: "PRD #353",
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
  state: "OPEN",
  url: "https://example.test/issues/353",
  comments: [{
    url: manifest.parent.ledger.commentUrl,
    body: ledgerBody.trimEnd(),
  }],
};

const sourceManifest = {
  approvedCount: 1,
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

const workingLedgerFor = (subject) => ({
  approvedCount: subject.approvedCount,
  entries: subject.children.map((child) => ({
    slice: child.slice,
    title: child.title,
    number: child.number,
    url: child.url,
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
  assert.equal("checklistMapped" in report.checks, false);
  assert.equal(Object.values(report.checks).every(Boolean), true);
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
  assert.equal(report.children[0].checks.sourceHeadingPresent, true);
  assert.equal(report.children[0].checks.sourcePresent, true);
  assert.equal(report.children[0].checks.sourceRelationshipPresent, true);
  assert.equal(report.source.relationship, "Blocks PRD #379");
  assert.equal("parent" in report, false);
});

test("manifest validation rejects a parent ledger in standalone-source mode", () => {
  const wrongManifest = structuredClone(sourceManifest);
  wrongManifest.source.ledger = { status: "skipped", reason: "not applicable" };

  assert.equal(
    validateManifest(wrongManifest).includes(
      "source.ledger is not allowed in standalone-source mode"),
    true,
  );
});

test("manifest validation requires valid custom forbidden patterns and a working ledger", () => {
  const missing = structuredClone(manifest);
  delete missing.forbidPatterns;
  delete missing.workingLedger;
  assert.equal(validateManifest(missing).includes("forbidPatterns must be an array"), true);
  assert.equal(validateManifest(missing).includes("workingLedger is required"), true);

  const invalid = structuredClone(manifest);
  invalid.forbidPatterns = ["("];
  assert.equal(validateManifest(invalid).some((error) => error.startsWith("forbidPatterns[0] is invalid:")), true);
});

test("family checklist validation receives every manifest forbidden pattern", () => {
  const args = checklistValidationArgs(manifest);
  assert.deepEqual(args.slice(-2), ["--forbid-pattern", "RUN_TOKEN"]);
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

test("family verification rejects a forbidden pattern in the exact posted ledger", () => {
  const forbiddenLedger = `${ledgerBody}\nRUN_TOKEN\n`;
  const forbiddenParent = structuredClone(parentPayload);
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
  const externalManifest = structuredClone(manifest);
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
  const externalManifest = structuredClone(manifest);
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
  const externalManifest = structuredClone(manifest);
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
