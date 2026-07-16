#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const usage = `Usage:
  node .claude/skills/to-issues/scripts/verify-published-family.mjs <manifest.json>
  node .claude/skills/to-issues/scripts/verify-published-family.mjs child <issue-number> <body-file> [options]

The manifest records the approved count, tracker relationship, shared run sheet,
and one entry per published issue. Single-issue options:
  --title <title>              Require the exact title.
  --parent <token>             Require the parent reference.
  --source <token>             Require the standalone source reference.
  --source-relationship <text> Require the exact standalone source relationship.
  --state <state>              Require the state; defaults to OPEN.
  --label <label>              Require the exact label set; repeat as needed.
  --blocker <issue-ref>        Require exactly this blocker; repeat as needed.
  --external-blocker <text>    Require exactly this external blocker; repeat as needed.
  --expect-no-blocker          Require the house-style no-blocker phrase and no blockers.
  --expect-stories             Require the user-story coverage section.
  --placeholder-re <pattern>   Placeholder regex; defaults to #SLICE|PLACEHOLDER.
  --forbid-pattern <pattern>   Reject a run-specific regex; repeat as needed.

See references/publication-protocol.md.`;

const readText = (path) => {
  try {
    return readFileSync(resolve(path), "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
};

const readJson = (path) => {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Cannot parse ${path}: ${error.message}`);
    throw error;
  }
};

const unique = (values) => [...new Set(values)].sort();

const normalizeMarkdown = (value) => value.replace(/\r\n/g, "\n").trimEnd();

const sectionBody = (body, heading) => {
  const start = body.indexOf(heading);
  if (start < 0) return "";
  const remainder = body.slice(start + heading.length);
  const nextHeading = remainder.search(/\n## /);
  return nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
};

const blockerEntries = (body) => sectionBody(body, "## Blocked by")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith("- "))
  .map((line) => line.slice(2).trim());

const classifiedBlockers = (body, expectedExternalBlockers = []) => {
  const entries = blockerEntries(body);
  const expectedExternalSet = new Set(expectedExternalBlockers);
  const externalBlockers = unique(entries.filter((entry) =>
    expectedExternalSet.has(entry) || !/#\d+/.test(entry)));
  const trackerEntries = entries.filter((entry) => !externalBlockers.includes(entry));
  return {
    externalBlockers,
    trackerBlockers: unique(trackerEntries.flatMap((entry) => entry.match(/#\d+/g) ?? [])),
  };
};

const labelNames = (labels) => unique((labels ?? []).map((label) => typeof label === "string" ? label : label.name));

const allTrue = (checks) => Object.values(checks).every(Boolean);

const exactValues = (actual, expected) =>
  actual.length === expected.length && expected.every((value) => actual.includes(value));

const compilePattern = (pattern, option) => {
  try {
    return new RegExp(pattern);
  } catch (error) {
    throw new Error(`Invalid ${option}: ${error.message}`);
  }
};

export const validateManifest = (manifest) => {
  const errors = [];
  if (!Number.isInteger(manifest.approvedCount) || manifest.approvedCount < 1) {
    errors.push("approvedCount must be a positive integer");
  }
  const hasParent = manifest.parent != null;
  const hasSource = manifest.source != null;
  if (hasParent === hasSource) {
    errors.push("exactly one of parent or source is required");
  } else if (hasParent && (!Number.isInteger(manifest.parent.number) || !manifest.parent.token)) {
    errors.push("parent.number and parent.token are required");
  } else if (hasSource && (
    !Number.isInteger(manifest.source.number) ||
    !manifest.source.token ||
    !manifest.source.relationship
  )) {
    errors.push("source.number, source.token, and source.relationship are required");
  }
  if (hasSource && manifest.source.ledger != null) {
    errors.push("source.ledger is not allowed in standalone-source mode");
  }
  if (!manifest.runSheet) errors.push("runSheet is required");
  if (!manifest.workingLedger) errors.push("workingLedger is required");
  if (!Array.isArray(manifest.forbidPatterns)) {
    errors.push("forbidPatterns must be an array");
  } else {
    for (const [index, pattern] of manifest.forbidPatterns.entries()) {
      if (typeof pattern !== "string" || !pattern.trim()) {
        errors.push(`forbidPatterns[${index}] must be a non-empty string`);
      } else {
        try {
          new RegExp(pattern);
        } catch (error) {
          errors.push(`forbidPatterns[${index}] is invalid: ${error.message}`);
        }
      }
    }
  }
  if (!Array.isArray(manifest.children) || manifest.children.length === 0) {
    errors.push("children must be a non-empty array");
  }
  const childNumbers = (manifest.children ?? []).map((child) => child.number);
  if (unique(childNumbers).length !== childNumbers.length) errors.push("children numbers must be unique");
  for (const [index, child] of (manifest.children ?? []).entries()) {
    const prefix = `children[${index}]`;
    if (!Number.isInteger(child.number)) errors.push(`${prefix}.number must be an integer`);
    if (!child.title) errors.push(`${prefix}.title is required`);
    if (!child.url) errors.push(`${prefix}.url is required`);
    if (!child.bodyFile) errors.push(`${prefix}.bodyFile is required`);
    if (!child.slice) errors.push(`${prefix}.slice is required`);
    if (!Array.isArray(child.labels) || child.labels.length === 0) errors.push(`${prefix}.labels is required`);
    if (!Array.isArray(child.blockers)) errors.push(`${prefix}.blockers must be an array`);
    if (child.externalBlockers != null && !Array.isArray(child.externalBlockers)) {
      errors.push(`${prefix}.externalBlockers must be an array when provided`);
    }
    if ((child.externalBlockers ?? []).some((blocker) => typeof blocker !== "string" || !blocker.trim())) {
      errors.push(`${prefix}.externalBlockers must contain non-empty strings`);
    }
    if (!(child.checklistMapped === "yes" || /^N\/A - .+/.test(child.checklistMapped ?? ""))) {
      errors.push(`${prefix}.checklistMapped must be "yes" or "N/A - <reason>"`);
    }
    const hasAnyBlocker = (child.blockers ?? []).length > 0 || (child.externalBlockers ?? []).length > 0;
    if (!hasAnyBlocker && !child.noBlockerPhrase) {
      errors.push(`${prefix}.noBlockerPhrase is required when tracker and external blockers are empty`);
    }
    if (hasAnyBlocker && child.noBlockerPhrase) {
      errors.push(`${prefix}.noBlockerPhrase is valid only when tracker and external blockers are empty`);
    }
  }
  if (hasParent) {
    const ledger = manifest.parent.ledger;
    if (!ledger || !["posted", "skipped"].includes(ledger.status)) {
      errors.push("parent.ledger.status must be posted or skipped");
    } else if (ledger.status === "posted" && (!ledger.commentUrl || !ledger.bodyFile)) {
      errors.push("a posted parent ledger requires commentUrl and bodyFile");
    } else if (ledger.status === "skipped" && !ledger.reason) {
      errors.push("a skipped parent ledger requires a reason");
    }
  }
  return errors;
};

export const verifyPublishedChild = ({
  expected,
  actual,
  expectedBody,
  parentToken = null,
  sourceToken = null,
  sourceRelationship = null,
  checklistVerified = null,
  forbiddenPatterns = [],
  placeholderRe = "#SLICE|PLACEHOLDER",
}) => {
  const body = actual?.body ?? "";
  const expectedBlockers = unique(expected.blockers);
  const expectedExternalBlockers = unique(expected.externalBlockers ?? []);
  const {
    externalBlockers: actualExternalBlockers,
    trackerBlockers: actualBlockers,
  } = classifiedBlockers(body, expectedExternalBlockers);
  const actualLabels = labelNames(actual?.labels);
  const expectedLabels = unique(expected.labels);
  const placeholderPattern = compilePattern(placeholderRe, "--placeholder-re");
  const compiledForbiddenPatterns = forbiddenPatterns
    .map((pattern) => compilePattern(pattern, "--forbid-pattern"));
  const sourceSection = sectionBody(body, "## Source and coordination");
  const checks = {
    fetched: actual != null,
    titleMatches: actual?.title === expected.title,
    stateMatches: actual?.state === (expected.state ?? "OPEN"),
    labelsMatch: exactValues(actualLabels, expectedLabels),
    parentPresent: parentToken == null || body.includes(parentToken),
    sourceHeadingPresent: sourceToken == null || body.includes("## Source and coordination"),
    sourcePresent: sourceToken == null || sourceSection.includes(sourceToken),
    sourceRelationshipPresent:
      sourceRelationship == null || sourceSection.includes(sourceRelationship),
    stagedBodyMatches: normalizeMarkdown(body) === normalizeMarkdown(expectedBody),
    hasWhat: body.includes("## What to build"),
    hasAcceptance: body.includes("## Acceptance criteria"),
    hasPrinciples: body.includes("## Principles"),
    storyCoverageMatches: expected.expectStories === false || body.includes("## User stories covered"),
    blockersMatch: exactValues(actualBlockers, expectedBlockers),
    externalBlockersMatch: exactValues(actualExternalBlockers, expectedExternalBlockers),
    noBlockerPhraseMatches:
      expectedBlockers.length > 0 ||
      expectedExternalBlockers.length > 0 ||
      body.includes(expected.noBlockerPhrase),
    noPlaceholders: !placeholderPattern.test(body),
    noForbiddenPatterns: compiledForbiddenPatterns.every((pattern) => !pattern.test(body)),
    noHome: !body.includes("/home/"),
    noTmp: !body.includes("/tmp"),
  };
  if (checklistVerified != null) {
    checks.checklistMapped =
      checklistVerified && (expected.checklistMapped === "yes" || /^N\/A - .+/.test(expected.checklistMapped));
  }
  return {
    actualBlockers,
    actualExternalBlockers,
    checks,
    expectedBlockers,
    expectedExternalBlockers,
    forbiddenPatterns: unique(forbiddenPatterns),
    labels: actualLabels,
    number: expected.number,
    state: actual?.state ?? null,
    title: actual?.title ?? expected.title,
    url: actual?.url ?? null,
  };
};

export const verifyWorkingPublicationLedger = ({ manifest, workingLedger, children }) => {
  const entries = Array.isArray(workingLedger?.entries) ? workingLedger.entries : [];
  const entryReports = manifest.children.map((expected, index) => {
    const entry = entries[index];
    const child = children[index];
    const checks = {
      present: entry != null,
      sliceMatches: entry?.slice === expected.slice,
      titleMatches: entry?.title === expected.title,
      numberMatches: entry?.number === expected.number,
      urlMatchesManifest: entry?.url === expected.url,
      urlMatchesLiveIssue: entry?.url === child?.url,
      blockersMatch: exactValues(unique(entry?.blockers ?? []), unique(expected.blockers)),
      externalBlockersMatch:
        exactValues(unique(entry?.externalBlockers ?? []), unique(expected.externalBlockers ?? [])),
      verifierPassed: entry?.verifierStatus === "verified",
    };
    return { checks, index, number: expected.number, slice: expected.slice };
  });
  const checks = {
    approvedCountMatches: workingLedger?.approvedCount === manifest.approvedCount,
    entryCountMatches: entries.length === manifest.children.length,
    entriesPass: entryReports.every((entry) => allTrue(entry.checks)),
  };
  return { checks, entries: entryReports };
};

export const verifyPublishedFamily = ({
  manifest,
  childPayloads,
  stagedBodies,
  parentPayload = null,
  sourcePayload = null,
  ledgerBody = null,
  checklistVerified,
  workingLedger = null,
}) => {
  const usesSource = manifest.source != null;
  const children = manifest.children.map((expected) => verifyPublishedChild({
    actual: childPayloads.get(expected.number),
    checklistVerified,
    expected,
    expectedBody: stagedBodies.get(expected.number) ?? "",
    forbiddenPatterns: manifest.forbidPatterns,
    parentToken: usesSource ? null : manifest.parent.token,
    sourceRelationship: usesSource ? manifest.source.relationship : null,
    sourceToken: usesSource ? manifest.source.token : null,
  }));

  const workingPublication = verifyWorkingPublicationLedger({ manifest, workingLedger, children });

  let relationshipChecks;
  let relationshipReport;
  if (usesSource) {
    relationshipChecks = {
      fetched: sourcePayload != null,
      numberMatches: sourcePayload?.number === manifest.source.number,
      stateMatches: sourcePayload?.state === (manifest.source.state ?? "OPEN"),
      sourcePresentInChildren: children.every((child) => child.checks.sourcePresent),
      relationshipPresentInChildren:
        children.every((child) => child.checks.sourceRelationshipPresent),
    };
    relationshipReport = {
      checks: relationshipChecks,
      number: manifest.source.number,
      relationship: manifest.source.relationship,
      state: sourcePayload?.state ?? null,
      url: sourcePayload?.url ?? null,
    };
  } else {
    const ledger = manifest.parent.ledger;
    const comment = ledger.status === "posted"
      ? (parentPayload?.comments ?? []).find((candidate) => candidate.url === ledger.commentUrl)
      : null;
    relationshipChecks = {
      fetched: parentPayload != null,
      numberMatches: parentPayload?.number === manifest.parent.number,
      stateMatches: parentPayload?.state === (manifest.parent.state ?? "OPEN"),
      ledgerPostureValid:
        ledger.status === "skipped"
          ? ledger.reason.trim().length > 0
          : comment != null && normalizeMarkdown(comment.body) === normalizeMarkdown(ledgerBody ?? ""),
      ledgerChildrenPresent:
        ledger.status === "skipped"
          ? true
          : manifest.children.every((child) => comment?.body.includes(`#${child.number}`)),
      ledgerNoPlaceholders:
        ledger.status === "skipped" || !/#SLICE|PLACEHOLDER/.test(comment?.body ?? ""),
      ledgerNoForbiddenPatterns:
        ledger.status === "skipped" || manifest.forbidPatterns
          .map((pattern) => compilePattern(pattern, "forbidPatterns"))
          .every((pattern) => !pattern.test(comment?.body ?? "")),
      ledgerNoHome: ledger.status === "skipped" || !(comment?.body ?? "").includes("/home/"),
      ledgerNoTmp: ledger.status === "skipped" || !(comment?.body ?? "").includes("/tmp"),
    };
    relationshipReport = {
      checks: relationshipChecks,
      ledgerStatus: ledger.status,
      number: manifest.parent.number,
      state: parentPayload?.state ?? null,
      url: parentPayload?.url ?? null,
    };
  }

  const checks = {
    approvedCreatedCount:
      manifest.children.length === manifest.approvedCount &&
      children.filter((child) => child.checks.fetched).length === manifest.approvedCount,
    checklistVerified,
    childrenPass: children.every((child) => allTrue(child.checks)),
    workingPublicationLedgerPass: allTrue(workingPublication.checks),
    [usesSource ? "sourcePass" : "parentPass"]: allTrue(relationshipChecks),
  };
  return {
    approvedCount: manifest.approvedCount,
    checks,
    children,
    failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name),
    mode: "published-family",
    forbiddenPatterns: unique(manifest.forbidPatterns),
    workingPublicationLedger: workingPublication,
    [usesSource ? "source" : "parent"]: relationshipReport,
  };
};

const fetchIssue = (number, includeComments = false) => {
  const fields = includeComments
    ? "number,title,body,labels,state,url,comments"
    : "number,title,body,labels,state,url";
  const output = execFileSync("gh", ["issue", "view", String(number), "--json", fields], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
};

const requireChildValue = (args, index, option) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
};

const parsePublishedChildArgs = (argv) => {
  const [numberText, bodyFile, ...args] = argv;
  const number = Number(numberText);
  if (!Number.isInteger(number) || number < 1 || !bodyFile) {
    throw new Error("child mode requires <issue-number> <body-file>.");
  }
  const options = {
    blockers: [],
    expectNoBlocker: false,
    expectStories: false,
    externalBlockers: [],
    forbidPatterns: [],
    labels: [],
    parentToken: null,
    sourceRelationship: null,
    sourceToken: null,
    placeholderRe: "#SLICE|PLACEHOLDER",
    state: "OPEN",
    title: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--expect-no-blocker") options.expectNoBlocker = true;
    else if (argument === "--expect-stories") options.expectStories = true;
    else if ([
      "--title",
      "--parent",
      "--source",
      "--source-relationship",
      "--state",
      "--label",
      "--blocker",
      "--external-blocker",
      "--placeholder-re",
      "--forbid-pattern",
    ].includes(argument)) {
      const value = requireChildValue(args, index, argument);
      if (argument === "--title") options.title = value;
      else if (argument === "--parent") options.parentToken = value;
      else if (argument === "--source") options.sourceToken = value;
      else if (argument === "--source-relationship") options.sourceRelationship = value;
      else if (argument === "--state") options.state = value;
      else if (argument === "--label") options.labels.push(value);
      else if (argument === "--blocker") options.blockers.push(value);
      else if (argument === "--external-blocker") options.externalBlockers.push(value);
      else if (argument === "--forbid-pattern") options.forbidPatterns.push(value);
      else options.placeholderRe = value;
      index += 1;
    } else {
      throw new Error(`Unknown child option: ${argument}`);
    }
  }
  if (!options.title || options.labels.length === 0) {
    throw new Error("child mode requires --title and at least one --label.");
  }
  if ((options.parentToken == null) === (options.sourceToken == null)) {
    throw new Error("child mode requires exactly one of --parent or --source.");
  }
  if ((options.sourceToken == null) !== (options.sourceRelationship == null)) {
    throw new Error("--source and --source-relationship must be used together.");
  }
  const hasBlockers = options.blockers.length > 0 || options.externalBlockers.length > 0;
  if (options.expectNoBlocker && hasBlockers) {
    throw new Error("Use --expect-no-blocker or blocker options, not both.");
  }
  if (!options.expectNoBlocker && !hasBlockers) {
    throw new Error("Use --expect-no-blocker when tracker and external blockers are empty.");
  }
  return {
    bodyFile,
    expected: {
      blockers: options.blockers,
      expectStories: options.expectStories,
      externalBlockers: options.externalBlockers,
      labels: options.labels,
      noBlockerPhrase: options.expectNoBlocker ? "None - can start immediately" : undefined,
      number,
      state: options.state,
      title: options.title,
    },
    number,
    parentToken: options.parentToken,
    forbidPatterns: options.forbidPatterns,
    placeholderRe: options.placeholderRe,
    sourceRelationship: options.sourceRelationship,
    sourceToken: options.sourceToken,
  };
};

export const checklistValidationArgs = (manifest) => {
  const validator = fileURLToPath(new URL("./validate-publication.mjs", import.meta.url));
  const args = [validator, "run-sheet", resolve(manifest.runSheet)];
  for (const child of manifest.children) {
    if (child.checklistMapped === "yes") {
      args.push("--slice-body", `${child.slice}=${resolve(child.bodyFile)}`);
    } else {
      args.push("--unaffected-slice", child.slice);
    }
  }
  for (const pattern of manifest.forbidPatterns) {
    args.push("--forbid-pattern", pattern);
  }
  return args;
};

const runChecklistValidation = (manifest) => {
  const args = checklistValidationArgs(manifest);
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = { stderr: result.stderr, stdout: result.stdout };
  }
  return { passed: result.status === 0, report };
};

const main = () => {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help")) {
    console.log(usage);
    process.exit(argv.includes("--help") ? 0 : 2);
  }

  try {
    if (argv[0] === "child") {
      const child = parsePublishedChildArgs(argv.slice(1));
      const report = verifyPublishedChild({
        actual: fetchIssue(child.number),
        expected: child.expected,
        expectedBody: readText(child.bodyFile),
        forbiddenPatterns: child.forbidPatterns,
        parentToken: child.parentToken,
        placeholderRe: child.placeholderRe,
        sourceRelationship: child.sourceRelationship,
        sourceToken: child.sourceToken,
      });
      const failedChecks = Object.entries(report.checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name);
      console.log(JSON.stringify({ mode: "published-child", ...report, failedChecks }, null, 2));
      if (failedChecks.length > 0) process.exit(1);
      return;
    }

    const [manifestFile, ...rest] = argv;
    if (rest.length > 0) throw new Error("family mode accepts only <manifest.json>.");
    const manifest = readJson(manifestFile);
    const manifestErrors = validateManifest(manifest);
    if (manifestErrors.length > 0) {
      console.error(JSON.stringify({ manifestErrors, mode: "published-family" }, null, 2));
      process.exit(2);
    }

    const checklist = runChecklistValidation(manifest);
    const workingLedger = readJson(manifest.workingLedger);
    const stagedBodies = new Map(manifest.children.map((child) => [child.number, readText(child.bodyFile)]));
    const childPayloads = new Map(manifest.children.map((child) => [child.number, fetchIssue(child.number)]));
    const parentPayload = manifest.parent == null ? null : fetchIssue(manifest.parent.number, true);
    const sourcePayload = manifest.source == null ? null : fetchIssue(manifest.source.number);
    const ledgerBody = manifest.parent?.ledger.status === "posted"
      ? readText(manifest.parent.ledger.bodyFile)
      : null;
    const report = verifyPublishedFamily({
      manifest,
      childPayloads,
      stagedBodies,
      parentPayload,
      sourcePayload,
      ledgerBody,
      checklistVerified: checklist.passed,
      workingLedger,
    });
    report.checklistReport = checklist.report;
    console.log(JSON.stringify(report, null, 2));
    if (report.failedChecks.length > 0) process.exit(1);
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, mode: "published-family" }, null, 2));
    process.exit(2);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
