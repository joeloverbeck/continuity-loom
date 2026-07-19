#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validatePrepArtifact } from "../../playtest-prd-prep/scripts/validate-prd-prep.mjs";

const FOLLOW_UP_HEADERS = ["Item", "Destination", "Trigger or next action", "Evidence required"];
const ISSUE_DISPOSITIONS = new Set([
  "published",
  "existing-owner",
  "routed",
  "no-create",
  "blocked",
]);
const PRD_DISPOSITIONS = new Set(["remaining", "consumed", "rejected", "blocked"]);
const FIRST_ACTION_STATUSES = new Set(["satisfied", "owned", "not-required", "blocked"]);
const LEGACY_COMPATIBILITY_PATTERNS = [
  /^Prep artifact requires exactly one bare line-start field: (Prior-report prep path|Prior-report prep classification|Final branch|Final worktree rows): value$/,
  /^Source validation must be: (passed|nonblocking defects - .+)$/,
  /^Prior-report prep path must be: .+$/,
  /^Prior-report prep classification must be: .+$/,
  /^Missing section for table: ### Final Worktree Ledger$/,
];

const usage = `Usage:
  node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs intake <prep-artifact>
  node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs inspect <prep-artifact>
  node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs validate <prep-artifact> <custody-ledger.json>`;

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const normalizedInputPath = (path) => {
  const repoRelative = relative(process.cwd(), resolve(path)).replaceAll("\\", "/");
  return repoRelative.replace(/^\.\//, "");
};

const stripFrontmatter = (markdown) => markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

const section = (markdown, heading) => {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const start = lines.findIndex((line) => line === heading);
  if (start < 0) return null;
  const level = /^(#+) /.exec(heading)?.[1].length;
  if (!level) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const candidateLevel = /^(#+) /.exec(lines[index])?.[1].length;
    if (candidateLevel && candidateLevel <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
};

const splitTableRow = (line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;

  const cells = [];
  let cell = "";
  for (let index = 1; index < trimmed.length - 1; index += 1) {
    const character = trimmed[index];
    if (character === "|" && trimmed[index - 1] !== "\\") {
      cells.push(cell.trim().replaceAll("\\|", "|"));
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim().replaceAll("\\|", "|"));
  return cells;
};

const sameCells = (left, right) =>
  left?.length === right.length && right.every((cell, index) => left[index] === cell);

const parseTable = (markdown, heading, headers) => {
  const errors = [];
  const body = section(markdown, heading);
  if (body === null) return { errors: [`Missing section: ${heading}`], rows: [] };

  const lines = body.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => sameCells(splitTableRow(line), headers));
  if (headerIndex < 0) {
    return { errors: [`${heading} is missing table header: | ${headers.join(" | ")} |`], rows: [] };
  }
  const divider = splitTableRow(lines[headerIndex + 1] ?? "");
  if (divider?.length !== headers.length || divider.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    errors.push(`${heading} has a missing or malformed table divider.`);
  }

  const rows = [];
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    if (!lines[index].trim()) {
      if (rows.length > 0) break;
      continue;
    }
    const cells = splitTableRow(lines[index]);
    if (cells === null) break;
    if (cells.length !== headers.length) {
      errors.push(`${heading} row ${index - headerIndex} has ${cells.length} cells; expected ${headers.length}.`);
      continue;
    }
    rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]])));
  }
  if (rows.length === 0) errors.push(`${heading} table has no rows.`);
  return { errors, rows };
};

const fieldValues = (markdown, label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...markdown.matchAll(new RegExp(`^${escaped}:\\s*(.*?)\\s*$`, "gm"))]
    .map((match) => match[1].trim());
};

const oneField = (markdown, label, errors, scope = "Prep artifact") => {
  const values = fieldValues(markdown, label);
  if (values.length !== 1 || !values[0]) {
    errors.push(`${scope} requires exactly one non-empty field: ${label}: value`);
    return null;
  }
  return values[0];
};

const candidateSections = (markdown) => {
  const body = section(markdown, "## Recommended PRD Package");
  if (body === null) return null;
  const lines = body.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("### PRD Candidate: ")) starts.push(index);
  }
  return starts.map((start, index) => ({
    title: lines[start].slice("### PRD Candidate: ".length).trim(),
    body: lines.slice(start + 1, starts[index + 1] ?? lines.length).join("\n"),
  }));
};

const duplicateValues = (values) => [...new Set(values.filter(
  (value) => values.filter((candidate) => candidate === value).length > 1,
))];

export const inspectPrepCustody = ({ markdown, prepPath }) => {
  const errors = [];
  const prepArtifact = normalizedInputPath(prepPath);
  if (!/^reports\/playtest-.+-prd-prep\.md$/.test(prepArtifact) || prepArtifact.startsWith("../")) {
    errors.push("prepArtifact must resolve to one repo-relative reports/playtest-*-prd-prep.md path.");
  }
  const sourceReport = oneField(markdown, "Source report path", errors);
  if (
    sourceReport !== null
    && (!/^reports\/playtest-.+\.md$/.test(sourceReport) || sourceReport.endsWith("-prd-prep.md"))
  ) {
    errors.push("Source report path must name one repo-relative reports/playtest-*.md file.");
  }
  const firstOperationalAction = oneField(markdown, "First operational action", errors);
  const publicationPackage = oneField(markdown, "Publication package", errors);

  const requiredCompletion = {
    "Prep validator": "passed",
    "Manual semantic review": "completed",
    "Privacy and stale-language scan": "clear",
  };
  for (const [field, expected] of Object.entries(requiredCompletion)) {
    const actual = oneField(markdown, field, errors);
    if (actual !== null && actual !== expected) {
      errors.push(`${field} must be ${expected}; found ${actual}.`);
    }
  }

  const followUpTable = parseTable(markdown, "## Non-PRD Follow-Up", FOLLOW_UP_HEADERS);
  errors.push(...followUpTable.errors);
  const nonPrdFollowUps = followUpTable.rows
    .filter((row) => !/^none\b/i.test(row.Item))
    .map((row) => ({
      item: row.Item,
      destination: row.Destination,
      triggerOrNextAction: row["Trigger or next action"],
      evidenceRequired: row["Evidence required"],
    }));
  for (const item of duplicateValues(nonPrdFollowUps.map((row) => row.item))) {
    errors.push(`Duplicate Non-PRD Follow-Up item: ${item}`);
  }

  const candidateParts = candidateSections(markdown);
  if (candidateParts === null) errors.push("Missing section: ## Recommended PRD Package");
  const prdCandidates = (candidateParts ?? []).map((candidate) => ({
    title: candidate.title,
    role: oneField(candidate.body, "Candidate role", errors, `PRD candidate ${candidate.title}`),
    sources: oneField(candidate.body, "Sources", errors, `PRD candidate ${candidate.title}`),
  }));
  for (const title of duplicateValues(prdCandidates.map((candidate) => candidate.title))) {
    errors.push(`Duplicate PRD candidate: ${title}`);
  }

  return {
    errors,
    inventory: {
      schemaVersion: 1,
      prepArtifact,
      prepSha256: sha256(markdown),
      sourceReport,
      firstOperationalAction,
      publicationPackage,
      nonPrdFollowUps,
      prdCandidates,
    },
  };
};

export const inspectPrepFile = (prepPath) => {
  const markdown = readFileSync(resolve(prepPath), "utf8");
  return inspectPrepCustody({ markdown, prepPath });
};

export const classifyPrepIntake = ({ inspected, currentValidation }) => {
  const errors = [...inspected.errors];
  const validatorErrors = currentValidation.errors ?? [];
  const sourceValidation = currentValidation.source?.sourceValidation;
  if (!new Set(["passed", "nonblocking-defects"]).has(sourceValidation)) {
    errors.push(`Current source validation is not usable: ${sourceValidation ?? "unknown"}.`);
  }
  const incompatibleErrors = validatorErrors.filter(
    (error) => !LEGACY_COMPATIBILITY_PATTERNS.some((pattern) => pattern.test(error)),
  );
  errors.push(...incompatibleErrors);
  const intakeStatus = errors.length > 0
    ? "invalid"
    : validatorErrors.length === 0
      ? "current"
      : "legacy-compatible";
  return {
    mode: "intake",
    intakeStatus,
    errors,
    warnings: currentValidation.warnings ?? [],
    currentValidatorErrors: validatorErrors,
    inventory: inspected.inventory,
  };
};

const nonEmpty = (value) => typeof value === "string" && value.trim() !== "";

const issueFieldsValid = (entry, prefix, errors) => {
  if (!Number.isInteger(entry.issueNumber) || entry.issueNumber < 1) {
    errors.push(`${prefix}.issueNumber must be a positive integer.`);
  }
  const expectedSuffix = Number.isInteger(entry.issueNumber) ? `/issues/${entry.issueNumber}` : null;
  if (!nonEmpty(entry.issueUrl) || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(entry.issueUrl)) {
    errors.push(`${prefix}.issueUrl must be an exact GitHub issue URL.`);
  } else if (expectedSuffix !== null && !entry.issueUrl.endsWith(expectedSuffix)) {
    errors.push(`${prefix}.issueUrl must match issueNumber.`);
  }
  if (!new Set(["OPEN", "CLOSED"]).has(entry.liveState)) {
    errors.push(`${prefix}.liveState must be OPEN or CLOSED.`);
  }
  if (!Array.isArray(entry.labels) || entry.labels.length === 0 || entry.labels.some((label) => !nonEmpty(label))) {
    errors.push(`${prefix}.labels must be a non-empty string array.`);
  } else if (new Set(entry.labels).size !== entry.labels.length) {
    errors.push(`${prefix}.labels must not contain duplicates.`);
  }
  if (entry.verifierStatus !== "verified") {
    errors.push(`${prefix}.verifierStatus must be verified.`);
  }
};

const exactEntryMap = ({ actual, expected, key, label, errors }) => {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array.`);
    return new Map();
  }
  const keys = actual.map((entry) => entry?.[key]);
  for (const value of duplicateValues(keys)) errors.push(`${label} contains duplicate ${key}: ${value}`);
  const expectedKeys = new Set(expected.map((entry) => entry[key]));
  for (const value of keys) {
    if (!expectedKeys.has(value)) errors.push(`${label} contains unexpected ${key}: ${value ?? "<missing>"}`);
  }
  for (const value of expectedKeys) {
    if (!keys.includes(value)) errors.push(`${label} is missing ${key}: ${value}`);
  }
  return new Map(actual.filter((entry) => entry && key in entry).map((entry) => [entry[key], entry]));
};

export const validateCustodyLedger = ({ inventory, ledger }) => {
  const errors = [];
  if (ledger?.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (ledger?.prepArtifact !== inventory.prepArtifact) errors.push("prepArtifact does not match the inspected artifact.");
  if (ledger?.prepSha256 !== inventory.prepSha256) errors.push("prepSha256 does not match the inspected artifact bytes.");

  const first = ledger?.firstOperationalAction;
  if (first?.value !== inventory.firstOperationalAction) {
    errors.push("firstOperationalAction.value does not match the inspected artifact.");
  }
  if (!FIRST_ACTION_STATUSES.has(first?.status)) {
    errors.push("firstOperationalAction.status is invalid.");
  }
  if (!nonEmpty(first?.evidence)) errors.push("firstOperationalAction.evidence is required.");

  const nonPrdByItem = exactEntryMap({
    actual: ledger?.nonPrd,
    expected: inventory.nonPrdFollowUps,
    key: "item",
    label: "nonPrd",
    errors,
  });
  for (const source of inventory.nonPrdFollowUps) {
    const entry = nonPrdByItem.get(source.item);
    if (!entry) continue;
    const prefix = `nonPrd[${source.item}]`;
    if (!ISSUE_DISPOSITIONS.has(entry.disposition)) errors.push(`${prefix}.disposition is invalid.`);
    if (!nonEmpty(entry.evidence)) errors.push(`${prefix}.evidence is required.`);
    if (entry.disposition === "published" || entry.disposition === "existing-owner") {
      issueFieldsValid(entry, prefix, errors);
    } else if (entry.disposition === "routed") {
      if (!nonEmpty(entry.route)) errors.push(`${prefix}.route is required for routed custody.`);
    } else if (entry.disposition === "no-create" || entry.disposition === "blocked") {
      if (!nonEmpty(entry.reason)) errors.push(`${prefix}.reason is required for ${entry.disposition}.`);
    }
  }

  const prdsByTitle = exactEntryMap({
    actual: ledger?.prds,
    expected: inventory.prdCandidates,
    key: "title",
    label: "prds",
    errors,
  });
  const remainingPrds = [];
  for (const source of inventory.prdCandidates) {
    const entry = prdsByTitle.get(source.title);
    if (!entry) continue;
    const prefix = `prds[${source.title}]`;
    if (entry.role !== source.role) errors.push(`${prefix}.role does not match the inspected candidate.`);
    if (!PRD_DISPOSITIONS.has(entry.disposition)) errors.push(`${prefix}.disposition is invalid.`);
    if (!nonEmpty(entry.evidence)) errors.push(`${prefix}.evidence is required.`);
    if (entry.disposition === "remaining") {
      remainingPrds.push({ title: source.title, role: source.role, toPrdInvocation: entry.toPrdInvocation });
      if (
        !nonEmpty(entry.toPrdInvocation)
        || !entry.toPrdInvocation.includes("$to-prd")
        || !entry.toPrdInvocation.includes(inventory.prepArtifact)
        || !entry.toPrdInvocation.includes(source.title)
      ) {
        errors.push(`${prefix}.toPrdInvocation must name $to-prd, the prep artifact, and candidate title.`);
      }
    } else if (entry.disposition === "consumed") {
      issueFieldsValid(entry, prefix, errors);
    } else if (entry.disposition === "rejected" || entry.disposition === "blocked") {
      if (!nonEmpty(entry.reason)) errors.push(`${prefix}.reason is required for ${entry.disposition}.`);
    }
  }

  const blockedItems = inventory.nonPrdFollowUps
    .filter((source) => nonPrdByItem.get(source.item)?.disposition === "blocked")
    .map((source) => source.item);
  const blockedPrds = inventory.prdCandidates
    .filter((source) => prdsByTitle.get(source.title)?.disposition === "blocked")
    .map((source) => source.title);
  const firstActionBlocked = first?.status === "blocked";
  const custodyComplete = errors.length === 0
    && blockedItems.length === 0
    && blockedPrds.length === 0
    && !firstActionBlocked;

  return {
    mode: "validate",
    custodyComplete,
    readyForToPrd: custodyComplete && remainingPrds.length > 0,
    errors,
    blockedItems,
    blockedPrds,
    firstActionBlocked,
    resolvedNonPrdCount: inventory.nonPrdFollowUps.length - blockedItems.length,
    sourceNonPrdCount: inventory.nonPrdFollowUps.length,
    remainingPrds,
  };
};

const main = () => {
  const [mode, prepPath, ledgerPath, ...rest] = process.argv.slice(2);
  if (mode === "--help") {
    console.log(usage);
    return;
  }
  if (!new Set(["intake", "inspect", "validate"]).has(mode) || !prepPath || rest.length > 0 || (mode === "validate" && !ledgerPath)) {
    console.error(usage);
    process.exit(2);
  }

  try {
    const inspected = inspectPrepFile(prepPath);
    if (mode === "intake") {
      const currentValidation = inspected.inventory.sourceReport == null
        ? { errors: ["Cannot run current producer validation without Source report path."], warnings: [] }
        : validatePrepArtifact(inspected.inventory.sourceReport, prepPath);
      const report = classifyPrepIntake({ inspected, currentValidation });
      console.log(JSON.stringify(report, null, 2));
      if (report.intakeStatus === "invalid") process.exit(1);
      return;
    }
    if (inspected.errors.length > 0) {
      console.error(JSON.stringify({ mode: "inspect", ...inspected }, null, 2));
      process.exit(1);
    }
    if (mode === "inspect") {
      console.log(JSON.stringify({ mode, ...inspected.inventory, errors: [] }, null, 2));
      return;
    }

    const ledger = JSON.parse(readFileSync(resolve(ledgerPath), "utf8"));
    const report = validateCustodyLedger({ inventory: inspected.inventory, ledger });
    console.log(JSON.stringify(report, null, 2));
    if (!report.custodyComplete) process.exit(1);
  } catch (error) {
    console.error(JSON.stringify({ mode: mode ?? "unknown", error: error.message }, null, 2));
    process.exit(2);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
