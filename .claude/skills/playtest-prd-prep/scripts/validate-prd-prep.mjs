#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseFrontmatter,
  stripFrontmatter,
  validateReport
} from "../../playtest/scripts/validate-report.mjs";

const PRIORITIZED_HEADERS = [
  "ID",
  "Severity",
  "Classification",
  "Category",
  "Summary",
  "Confidence",
  "Status"
];

const CUMULATIVE_HEADERS = [
  "ID",
  "First seen",
  "Classification",
  "Summary",
  "Current status",
  "Latest evidence"
];

const DISPOSITION_HEADERS = [
  "Report item",
  "Report summary",
  "Disposition",
  "Current evidence",
  "Change/PRD impact"
];

const STRENGTH_HEADERS = [
  "Strength ID",
  "Applies to",
  "Preservation constraint",
  "Regression evidence"
];

const AUTHORITY_HEADERS = [
  "Candidate or follow-up",
  "Governing authority",
  "Code/test impact",
  "Doc/skill impact",
  "Required artifact type"
];

const FOLLOW_UP_HEADERS = ["Item", "Destination", "Trigger or next action", "Evidence required"];

const CONSUMPTION_HEADERS = [
  "Prior recommendation",
  "Current classification",
  "Evidence",
  "Resulting action"
];

const PREP_HEADINGS = [
  "## Header And Freshness",
  "## Reassessment Verdict",
  "## Source Inventory",
  "## Evidence Disposition Ledger",
  "## Strength Preservation Ledger",
  "## Authority And Change-Surface Map",
  "## Recommended PRD Package",
  "## Non-PRD Follow-Up",
  "## Rejected Or No-Op Alternatives",
  "## PRD Publication Inputs",
  "## Completion Self-Check",
  "## Freshness And Boundaries"
];

const REQUIRED_FIELDS = [
  "Source report path",
  "Source validation",
  "Source durability",
  "Authored artifact durability",
  "Live checkout",
  "Tracker freshness",
  "Existing same-stem prep classification",
  "Prior-report traversal",
  "Deliverable status",
  "External research",
  "First operational action",
  "Publication package",
  "Source prioritized findings",
  "Source cumulative ledger rows",
  "Source strength rows",
  "Disposition rows",
  "Strength constraint rows",
  "Recommended testing seam",
  "/to-prd consultation",
  "Likely label",
  "Label downgrade conditions",
  "Browser-visible guidance checklist",
  "Prep validator",
  "Manual semantic review",
  "Privacy and stale-language scan"
];

const VERDICT_FIELDS = [
  "Recommended first new PRD",
  "Recommended multi-PRD program",
  "No-new-PRD verdict"
];

const CANDIDATE_FIELDS = [
  "Candidate role",
  "Purpose",
  "Sources",
  "Problem",
  "Product rule or seam",
  "Affected surfaces",
  "Scope",
  "Acceptance",
  "Preserved strengths",
  "Testing seam",
  "Out of scope"
];

const DISPOSITIONS = new Set([
  "preserve-strength",
  "covered",
  "verification/reopen",
  "fresh-prd-scope",
  "ticket-candidate",
  "skill-maintenance",
  "doc-correction",
  "coverage-follow-up",
  "research-follow-up",
  "no-op/rejected"
]);

const CONSUMPTION_CLASSIFICATIONS = new Set(["consumed", "still live", "rejected", "superseded"]);

const PACKAGE_VALUES = new Set([
  "single intended PRD",
  "first PRD plus deferred follow-ons",
  "multi-PRD program",
  "no new PRD"
]);

const COMPLETION_VALUES = Object.freeze({
  draft: Object.freeze({
    "Prep validator": "pending",
    "Manual semantic review": "pending",
    "Privacy and stale-language scan": "pending"
  }),
  final: Object.freeze({
    "Prep validator": "passed",
    "Manual semantic review": "completed",
    "Privacy and stale-language scan": "clear"
  })
});

const ID_PATTERN = /^F\d{3,}$/;

const NON_BLOCKING_REPORT_ERROR_PATTERNS = [
  /^counterfactual_probes must be 1 when a ### Targeted Counterfactual disclosure is present\.$/,
  /^counterfactual_probes: 1 requires a ### Targeted Counterfactual disclosure in ## Prompt Usefulness\.$/,
  /^Targeted Counterfactual /
];

const usage = `Usage:
  node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source <report>
  node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --draft <report> <prep-artifact>
  node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs <report> <prep-artifact>`;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function literal(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("`") && trimmed.endsWith("`") ? trimmed.slice(1, -1).trim() : trimmed;
}

function splitTableRow(line) {
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
}

function sameCells(left, right) {
  return left.length === right.length && left.every((cell, index) => cell === right[index]);
}

function dividerCells(cells, expectedLength) {
  return cells?.length === expectedLength && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function section(markdown, heading) {
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
}

function parseTable(markdown, sectionHeading, headers, { allowEmpty = false } = {}) {
  const errors = [];
  const body = section(markdown, sectionHeading);
  if (body === null) {
    return { errors: [`Missing section for table: ${sectionHeading}`], rows: [] };
  }

  const lines = body.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = splitTableRow(line);
    return cells !== null && sameCells(cells, headers);
  });
  if (headerIndex < 0) {
    return {
      errors: [`${sectionHeading} is missing table header: | ${headers.join(" | ")} |`],
      rows: []
    };
  }

  const divider = splitTableRow(lines[headerIndex + 1] ?? "");
  if (!dividerCells(divider, headers.length)) {
    errors.push(`${sectionHeading} has a missing or malformed table divider.`);
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
      errors.push(
        `${sectionHeading} table row ${index - headerIndex} has ${cells.length} cells; expected ${headers.length}.`
      );
      continue;
    }
    rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]])));
  }

  if (!allowEmpty && rows.length === 0) errors.push(`${sectionHeading} table has no rows.`);
  return { errors, rows };
}

function fieldValues(markdown, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)}:\\s*(.*?)\\s*$`, "gm");
  return [...markdown.matchAll(pattern)].map((match) => match[1].trim());
}

function oneField(markdown, label, errors, scope = "Prep artifact") {
  const values = fieldValues(markdown, label);
  if (values.length !== 1) {
    errors.push(`${scope} requires exactly one bare line-start field: ${label}: value`);
    return null;
  }
  if (!values[0]) {
    errors.push(`${scope} field ${label} must not be blank.`);
    return null;
  }
  return values[0];
}

function validateHeadingOrder(markdown, title) {
  const errors = [];
  const body = stripFrontmatter(markdown);
  if (!body.trimStart().startsWith(`# Playtest PRD Prep: ${title}\n`)) {
    errors.push(`Prep artifact must begin with: # Playtest PRD Prep: ${title}`);
  }

  const lines = body.split(/\r?\n/);
  const positions = PREP_HEADINGS.map((heading) => lines.findIndex((line) => line === heading));
  for (let index = 0; index < positions.length; index += 1) {
    if (positions[index] < 0) errors.push(`Missing required prep heading: ${PREP_HEADINGS[index]}`);
  }
  let prior = -1;
  for (let index = 0; index < positions.length; index += 1) {
    if (positions[index] < 0) continue;
    if (positions[index] <= prior) {
      errors.push(`Required prep heading is out of order: ${PREP_HEADINGS[index]}`);
    }
    prior = Math.max(prior, positions[index]);
  }
  return errors;
}

function stableIds(rows, key, tableName, errors) {
  const ids = [];
  for (const row of rows) {
    const id = literal(row[key] ?? "");
    if (!ID_PATTERN.test(id)) {
      errors.push(`${tableName} has invalid stable ID: ${row[key] || "<blank>"}`);
      continue;
    }
    ids.push(id);
  }
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      errors.push(`${tableName} contains duplicate stable ID: ${id}`);
    }
  }
  return ids;
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort();
}

export function inspectSourceReport(reportPath) {
  const reportValidation = validateReport(reportPath);
  const nonBlockingReportErrors = reportValidation.errors.filter((error) =>
    NON_BLOCKING_REPORT_ERROR_PATTERNS.some((pattern) => pattern.test(error))
  );
  const errors = reportValidation.errors.filter(
    (error) => !nonBlockingReportErrors.includes(error)
  );
  const warnings = [
    ...reportValidation.warnings,
    ...nonBlockingReportErrors.map(
      (error) => `Source report validator defect (non-blocking for disposition): ${error}`
    )
  ];
  if (errors.length > 0) {
    return {
      errors,
      warnings,
      counts: { prioritizedFindings: 0, cumulativeLedgerRows: 0, strengthRows: 0 },
      cumulativeIds: [],
      prioritizedIds: [],
      strengthIds: [],
      sourceValidation: "blocking-errors",
      nonBlockingReportErrors
    };
  }

  const markdown = readFileSync(resolve(reportPath), "utf8");
  const frontmatter = parseFrontmatter(markdown);
  const prioritized = parseTable(markdown, "## Prioritized Findings", PRIORITIZED_HEADERS, {
    allowEmpty: true
  });
  const cumulative = parseTable(markdown, "## Cumulative Finding Ledger", CUMULATIVE_HEADERS, {
    allowEmpty: true
  });
  errors.push(...prioritized.errors, ...cumulative.errors);

  const prioritizedIds = stableIds(prioritized.rows, "ID", "Prioritized Findings", errors);
  const cumulativeIds = stableIds(cumulative.rows, "ID", "Cumulative Finding Ledger", errors);
  const cumulativeSet = new Set(cumulativeIds);
  const missingFromCumulative = prioritizedIds.filter((id) => !cumulativeSet.has(id));
  for (const id of missingFromCumulative) {
    errors.push(`Prioritized finding ${id} is absent from the Cumulative Finding Ledger.`);
  }

  const strengthIds = cumulative.rows
    .filter(
      (row) =>
        literal(row.Classification).toLowerCase() === "strength" ||
        literal(row["Current status"]).toLowerCase() === "preserve-strength"
    )
    .map((row) => literal(row.ID))
    .filter((id) => ID_PATTERN.test(id));

  return {
    errors,
    warnings,
    reportPath: `reports/${basename(resolve(reportPath))}`,
    reportStem: frontmatter?.report_stem ?? basename(reportPath, ".md"),
    storyTitle: frontmatter?.story_title ?? "",
    runMode: frontmatter?.run_mode ?? "",
    priorReport: frontmatter?.prior_report ?? "null",
    sourceValidation: nonBlockingReportErrors.length > 0 ? "nonblocking-defects" : "passed",
    nonBlockingReportErrors,
    counts: {
      prioritizedFindings: prioritizedIds.length,
      cumulativeLedgerRows: cumulativeIds.length,
      strengthRows: strengthIds.length
    },
    cumulativeIds,
    prioritizedIds,
    strengthIds,
    cumulativeRows: cumulative.rows
  };
}

function candidateSections(markdown) {
  const packageBody = section(markdown, "## Recommended PRD Package");
  if (packageBody === null) return [];
  const lines = packageBody.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("### PRD Candidate: ")) starts.push(index);
  }
  return starts.map((start, candidateIndex) => {
    const end = starts[candidateIndex + 1] ?? lines.length;
    return {
      title: lines[start].slice("### PRD Candidate: ".length).trim(),
      body: lines.slice(start + 1, end).join("\n")
    };
  });
}

function validateCandidates(markdown, packageValue, source, errors) {
  const candidates = candidateSections(markdown);
  const sourceIds = new Set(source.cumulativeIds);
  const strengthIds = new Set(source.strengthIds);
  const roles = [];
  const titles = new Set();

  for (const candidate of candidates) {
    if (!candidate.title) errors.push("PRD candidate heading must include a name.");
    if (titles.has(candidate.title))
      errors.push(`Duplicate PRD candidate name: ${candidate.title}`);
    titles.add(candidate.title);

    const values = {};
    for (const field of CANDIDATE_FIELDS) {
      values[field] = oneField(candidate.body, field, errors, `PRD candidate ${candidate.title}`);
    }
    if (values["Candidate role"]) roles.push(values["Candidate role"]);

    const citedSourceIds = values.Sources?.match(/\bF\d{3,}\b/g) ?? [];
    if (citedSourceIds.length === 0) {
      errors.push(`PRD candidate ${candidate.title} must cite at least one report ID in Sources.`);
    }
    for (const id of citedSourceIds) {
      if (!sourceIds.has(id))
        errors.push(`PRD candidate ${candidate.title} cites unknown source ID ${id}.`);
    }

    const preservation = values["Preserved strengths"] ?? "";
    if (!preservation.startsWith("N/A - no affected source strength")) {
      const citedStrengthIds = preservation.match(/\bF\d{3,}\b/g) ?? [];
      if (citedStrengthIds.length === 0) {
        errors.push(
          `PRD candidate ${candidate.title} must cite a source strength or use the explicit N/A reason.`
        );
      }
      for (const id of citedStrengthIds) {
        if (!strengthIds.has(id)) {
          errors.push(`PRD candidate ${candidate.title} cites non-strength preservation ID ${id}.`);
        }
      }
    }
  }

  const firstCount = roles.filter((role) => role === "first").length;
  const deferredCount = roles.filter((role) => role === "deferred").length;
  const programNumbers = roles
    .map((role) => /^program (\d+)$/.exec(role)?.[1])
    .filter(Boolean)
    .map(Number)
    .sort((left, right) => left - right);
  const invalidRoles = roles.filter(
    (role) => role !== "first" && role !== "deferred" && !/^program [1-9]\d*$/.test(role)
  );
  for (const role of invalidRoles) errors.push(`Unsupported PRD candidate role: ${role}`);

  if (packageValue === "single intended PRD") {
    if (
      candidates.length !== 1 ||
      firstCount !== 1 ||
      deferredCount !== 0 ||
      programNumbers.length
    ) {
      errors.push(
        "single intended PRD requires exactly one first candidate and no other candidates."
      );
    }
  } else if (packageValue === "first PRD plus deferred follow-ons") {
    if (firstCount !== 1 || deferredCount < 1 || programNumbers.length) {
      errors.push(
        "first PRD plus deferred follow-ons requires exactly one first candidate and at least one deferred candidate."
      );
    }
  } else if (packageValue === "multi-PRD program") {
    if (firstCount !== 0 || programNumbers.length < 2) {
      errors.push(
        "multi-PRD program requires at least two program <n> candidates and no first role."
      );
    }
    for (let index = 0; index < programNumbers.length; index += 1) {
      if (programNumbers[index] !== index + 1) {
        errors.push("multi-PRD program roles must be contiguous from program 1.");
        break;
      }
    }
  } else if (packageValue === "no new PRD" && candidates.length !== 0) {
    errors.push("no new PRD must not contain PRD candidate subsections.");
  }

  return candidates.length;
}

function integerField(markdown, label, expected, errors) {
  const value = oneField(markdown, label, errors);
  if (value === null) return;
  if (!/^\d+$/.test(value)) {
    errors.push(`${label} must be a non-negative integer.`);
    return;
  }
  if (Number(value) !== expected) {
    errors.push(`${label} is ${value}; expected ${expected}.`);
  }
}

function validateFixedFields(markdown, fields, source, completionMode, errors) {
  if (source.sourceValidation === "passed" && fields["Source validation"] !== "passed") {
    errors.push("Source validation must be: passed");
  }
  if (
    source.sourceValidation === "nonblocking-defects" &&
    !fields["Source validation"]?.startsWith("nonblocking defects - ")
  ) {
    errors.push("Source validation must summarize the nonblocking source-validator defects.");
  }
  if (fields["Deliverable status"] !== "PRD-ready determination only; prep artifact write only") {
    errors.push(
      "Deliverable status must be: PRD-ready determination only; prep artifact write only"
    );
  }
  if (
    !/^(?:skipped - repo-local prep|used - explicit user request: .+)$/.test(
      fields["External research"] ?? ""
    )
  ) {
    errors.push(
      "External research must be repo-local skipped wording or name an explicit user-requested scope."
    );
  }
  if (fields["/to-prd consultation"] !== "house style only; seam checkpoint still owed") {
    errors.push("/to-prd consultation must state: house style only; seam checkpoint still owed");
  }

  const expectedCompletion = COMPLETION_VALUES[completionMode];
  for (const [field, expected] of Object.entries(expectedCompletion)) {
    if (fields[field] !== expected) {
      const qualifier = completionMode === "draft" ? " during draft validation" : "";
      errors.push(`${field} must be: ${expected}${qualifier}`);
    }
  }
}

function privacyAndStaleLanguageErrors(markdown) {
  const checks = [
    [/\/tmp\//, "Prep artifact must not contain machine-local /tmp paths."],
    [/\/home\//, "Prep artifact must not contain machine-local home-directory paths."],
    [/http:\/\/127\.0\.0\.1:\d+/, "Prep artifact must not contain localhost URLs."],
    [/sk-or-v1-[A-Za-z0-9_-]{12,}/i, "Prep artifact appears to contain an API key."],
    [/\bTBD\b/i, "Prep artifact contains stale TBD wording."],
    [/\bshould be checked\b/i, "Prep artifact contains future-tense check wording."],
    [
      /\bmust be checked before publication\b/i,
      "Prep artifact contains stale publication wording."
    ],
    [/\bif the body passes\b/i, "Prep artifact contains conditional completion wording."]
  ];
  return checks.filter(([pattern]) => pattern.test(markdown)).map(([, message]) => message);
}

export function validatePrepArtifact(reportPath, prepPath, { completionMode = "final" } = {}) {
  if (!Object.hasOwn(COMPLETION_VALUES, completionMode)) {
    throw new TypeError(`Unsupported completion mode: ${completionMode}`);
  }

  const source = inspectSourceReport(reportPath);
  const errors = [...source.errors];
  const warnings = [...source.warnings];
  if (source.errors.length > 0) return { errors, warnings, source };

  const absolutePrep = resolve(prepPath);
  let markdown;
  try {
    markdown = readFileSync(absolutePrep, "utf8");
  } catch {
    return { errors: [...errors, `Cannot read prep artifact: ${absolutePrep}`], warnings, source };
  }

  if (basename(dirname(absolutePrep)) !== "reports") {
    errors.push("Prep artifact must be a direct child of reports/.");
  }
  const expectedPrepName = `${source.reportStem}-prd-prep.md`;
  if (basename(absolutePrep) !== expectedPrepName) {
    errors.push(`Prep artifact filename must be: ${expectedPrepName}`);
  }
  if (resolve(reportPath) === absolutePrep)
    errors.push("Source report and prep artifact must differ.");

  errors.push(...validateHeadingOrder(markdown, source.storyTitle));
  errors.push(...privacyAndStaleLanguageErrors(markdown));

  const fields = {};
  for (const label of REQUIRED_FIELDS) fields[label] = oneField(markdown, label, errors);
  validateFixedFields(markdown, fields, source, completionMode, errors);
  if (fields["Source report path"] !== source.reportPath) {
    errors.push(`Source report path must be: ${source.reportPath}`);
  }

  const verdicts = VERDICT_FIELDS.flatMap((label) =>
    fieldValues(markdown, label).map((value) => ({ label, value }))
  );
  if (verdicts.length !== 1 || !verdicts[0]?.value) {
    errors.push(
      `Prep artifact requires exactly one non-empty verdict field: ${VERDICT_FIELDS.join(" / ")}`
    );
  }

  const packageValue = fields["Publication package"];
  if (!PACKAGE_VALUES.has(packageValue)) {
    errors.push(`Unsupported Publication package: ${packageValue ?? "<missing>"}`);
  }
  if (verdicts.length === 1) {
    const expectedVerdict =
      packageValue === "multi-PRD program"
        ? "Recommended multi-PRD program"
        : packageValue === "no new PRD"
          ? "No-new-PRD verdict"
          : "Recommended first new PRD";
    if (verdicts[0].label !== expectedVerdict) {
      errors.push(`${packageValue} must use verdict field: ${expectedVerdict}`);
    }
  }

  const dispositions = parseTable(markdown, "## Evidence Disposition Ledger", DISPOSITION_HEADERS, {
    allowEmpty: source.counts.cumulativeLedgerRows === 0
  });
  const strengths = parseTable(markdown, "## Strength Preservation Ledger", STRENGTH_HEADERS, {
    allowEmpty: source.counts.strengthRows === 0
  });
  const authorityMap = parseTable(
    markdown,
    "## Authority And Change-Surface Map",
    AUTHORITY_HEADERS
  );
  const followUps = parseTable(markdown, "## Non-PRD Follow-Up", FOLLOW_UP_HEADERS);
  errors.push(
    ...dispositions.errors,
    ...strengths.errors,
    ...authorityMap.errors,
    ...followUps.errors
  );

  const dispositionIds = stableIds(
    dispositions.rows,
    "Report item",
    "Evidence Disposition Ledger",
    errors
  );
  const sourceIdSet = new Set(source.cumulativeIds);
  const dispositionIdSet = new Set(dispositionIds);
  for (const id of setDifference(sourceIdSet, dispositionIdSet)) {
    errors.push(`Evidence Disposition Ledger is missing source row ${id}.`);
  }
  for (const id of setDifference(dispositionIdSet, sourceIdSet)) {
    errors.push(`Evidence Disposition Ledger contains unknown source row ${id}.`);
  }

  const strengthIdSet = new Set(source.strengthIds);
  for (const row of dispositions.rows) {
    const id = literal(row["Report item"]);
    const disposition = literal(row.Disposition);
    if (!DISPOSITIONS.has(disposition)) {
      errors.push(
        `Evidence Disposition Ledger has unsupported disposition for ${id}: ${disposition}`
      );
    }
    for (const key of ["Report summary", "Current evidence", "Change/PRD impact"]) {
      if (!row[key]?.trim()) errors.push(`Evidence Disposition Ledger ${id} has blank ${key}.`);
    }
    if (strengthIdSet.has(id) && disposition !== "preserve-strength") {
      errors.push(`Source strength ${id} must use disposition preserve-strength.`);
    }
    if (!strengthIdSet.has(id) && disposition === "preserve-strength") {
      errors.push(`Non-strength ${id} must not use disposition preserve-strength.`);
    }
  }

  const strengthRows = stableIds(
    strengths.rows,
    "Strength ID",
    "Strength Preservation Ledger",
    errors
  );
  const outputStrengthSet = new Set(strengthRows);
  for (const id of setDifference(strengthIdSet, outputStrengthSet)) {
    errors.push(`Strength Preservation Ledger is missing source strength ${id}.`);
  }
  for (const id of setDifference(outputStrengthSet, strengthIdSet)) {
    errors.push(`Strength Preservation Ledger contains non-strength source row ${id}.`);
  }
  for (const row of strengths.rows) {
    const id = literal(row["Strength ID"]);
    for (const key of ["Applies to", "Preservation constraint", "Regression evidence"]) {
      if (!row[key]?.trim()) errors.push(`Strength Preservation Ledger ${id} has blank ${key}.`);
    }
  }

  integerField(markdown, "Source prioritized findings", source.counts.prioritizedFindings, errors);
  integerField(
    markdown,
    "Source cumulative ledger rows",
    source.counts.cumulativeLedgerRows,
    errors
  );
  integerField(markdown, "Source strength rows", source.counts.strengthRows, errors);
  integerField(markdown, "Disposition rows", dispositions.rows.length, errors);
  integerField(markdown, "Strength constraint rows", strengths.rows.length, errors);

  const candidateCount = PACKAGE_VALUES.has(packageValue)
    ? validateCandidates(markdown, packageValue, source, errors)
    : 0;

  const existingPrep = fields["Existing same-stem prep classification"];
  if (existingPrep && existingPrep !== "missing at intake") {
    const consumption = parseTable(
      markdown,
      "### Prior Recommendation Consumption Ledger",
      CONSUMPTION_HEADERS
    );
    errors.push(...consumption.errors);
    for (const row of consumption.rows) {
      const classification = literal(row["Current classification"]);
      if (!CONSUMPTION_CLASSIFICATIONS.has(classification)) {
        errors.push(`Unsupported prior recommendation classification: ${classification}`);
      }
    }
  }

  return {
    errors,
    warnings,
    source,
    prep: {
      completionMode,
      candidateCount,
      dispositionRows: dispositions.rows.length,
      strengthConstraintRows: strengths.rows.length,
      verdict: verdicts[0] ?? null,
      publicationPackage: packageValue ?? null
    }
  };
}

function printResult(result, mode) {
  const source = result.source ?? result;
  const payload = {
    status: result.errors.length === 0 ? "ok" : "invalid",
    mode,
    source: {
      reportPath: source?.reportPath ?? null,
      reportStem: source?.reportStem ?? null,
      runMode: source?.runMode ?? null,
      priorReport: source?.priorReport ?? null,
      sourceValidation: source?.sourceValidation ?? null,
      nonBlockingReportErrors: source?.nonBlockingReportErrors ?? [],
      counts: source?.counts ?? null,
      prioritizedIds: source?.prioritizedIds ?? [],
      cumulativeIds: source?.cumulativeIds ?? [],
      strengthIds: source?.strengthIds ?? []
    },
    ...(result.prep ? { prep: result.prep } : {}),
    warnings: result.warnings,
    errors: result.errors
  };
  console.log(JSON.stringify(payload, null, 2));
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 1 && argv[0] === "--help") {
    console.log(usage);
    return;
  }
  if (argv.length === 2 && argv[0] === "--inspect-source") {
    const source = inspectSourceReport(argv[1]);
    printResult(source, "inspect-source");
    if (source.errors.length > 0) process.exitCode = 1;
    return;
  }
  if (argv.length === 3 && argv[0] === "--draft") {
    const result = validatePrepArtifact(argv[1], argv[2], { completionMode: "draft" });
    printResult(result, "validate-prep-draft");
    if (result.errors.length > 0) process.exitCode = 1;
    return;
  }
  if (argv.length !== 2 || argv.some((argument) => argument.startsWith("--"))) {
    console.error(usage);
    process.exitCode = 2;
    return;
  }

  const result = validatePrepArtifact(argv[0], argv[1]);
  printResult(result, "validate-prep");
  if (result.errors.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
