#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
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

const V2_PRIORITIZED_HEADERS = [...PRIORITIZED_HEADERS, "Evidence basis"];

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
  "Source prep",
  "Prior recommendation",
  "Current classification",
  "Evidence",
  "Resulting action"
];

const FINAL_WORKTREE_HEADERS = ["Path", "Classification"];

export const CURRENT_PREP_CONTRACT_VERSION = 2;
export const IMPLICIT_LEGACY_PREP_CONTRACT_VERSION = 1;

export const PREP_CONTRACT_DIAGNOSTIC_CODES = Object.freeze({
  IMPLICIT_LEGACY_VERSION: "PREP_CONTRACT_IMPLICIT_V1",
  EXPLICIT_LEGACY_VERSION: "PREP_CONTRACT_EXPLICIT_LEGACY_VERSION",
  INVALID_VERSION: "PREP_CONTRACT_INVALID_VERSION",
  FUTURE_VERSION: "PREP_CONTRACT_UNSUPPORTED_FUTURE_VERSION",
  FIRST_ACTION_MIGRATION_REQUIRED: "PREP_CONTRACT_FIRST_ACTION_MIGRATION_REQUIRED",
  CURRENT_FIRST_ACTION_INVALID: "PREP_CONTRACT_CURRENT_FIRST_ACTION_INVALID"
});

const CONTRACT_MODES = new Set(["current", "declared"]);

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
  "Prep contract version",
  "Source report path",
  "Source validation",
  "Source durability",
  "Authored artifact durability",
  "Live checkout",
  "Tracker freshness",
  "Existing same-stem prep classification",
  "Prior-report prep path",
  "Prior-report prep classification",
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
  "Privacy and stale-language scan",
  "Final branch",
  "Final worktree rows"
];

const LEGACY_OPTIONAL_FIELDS = new Set([
  "Prep contract version",
  "Prior-report prep path",
  "Prior-report prep classification",
  "Final branch",
  "Final worktree rows"
]);

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

const TICKET_PACKET_FIELDS = [
  "Sources",
  "Type and readiness",
  "Problem",
  "Product rule",
  "Affected surfaces",
  "Scope",
  "Preserved strengths",
  "Testing seam",
  "Out of scope"
];

const TICKET_DESTINATION_PATTERN = /^ticket\s+-\s+(.+)$/i;
const CIRCULAR_FIRST_ACTION_PATTERN = /(?:\$?playtest-to-issues|\/to-prd)\b/i;

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

const PREP_CLASSIFICATIONS = new Set([
  "missing at intake",
  "current",
  "partially consumed",
  "stale",
  "superseded",
  "not relevant"
]);

const PRIOR_PREP_CLASSIFICATIONS = new Set(["not applicable", ...PREP_CLASSIFICATIONS]);

const FINAL_WORKTREE_CLASSIFICATIONS = new Set([
  "intentional prep artifact",
  "pre-existing",
  "concurrent/unowned"
]);

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

function optionalField(markdown, label) {
  const values = fieldValues(markdown, label);
  return values.length === 1 && values[0] ? values[0] : null;
}

function bulletField(markdown, label, errors, scope, { required }) {
  const lines = markdown.split(/\r?\n/);
  const pattern = new RegExp(`^${escapeRegExp(label)}:\\s*$`);
  const starts = lines
    .map((line, index) => (pattern.test(line) ? index : -1))
    .filter((index) => index >= 0);
  if (starts.length !== 1) {
    if (required) {
      errors.push(`${scope} requires exactly one bare line-start list field: ${label}:`);
    }
    return [];
  }

  let end = lines.length;
  for (let index = starts[0] + 1; index < lines.length; index += 1) {
    if (/^[^\s|#*-][^:]*:\s*.*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const bullets = lines
    .slice(starts[0] + 1, end)
    .map((line) => /^\s*-\s+(.+)$/.exec(line)?.[1]?.trim())
    .filter(Boolean);
  if (required && bullets.length === 0) {
    errors.push(`${scope} field ${label} must contain at least one bullet.`);
  }
  return bullets;
}

export function isCircularFirstOperationalAction(value) {
  return typeof value === "string" && CIRCULAR_FIRST_ACTION_PATTERN.test(value);
}

const contractDiagnostic = (code, disposition, message) => ({ code, disposition, message });

export function inspectPrepContract(markdown) {
  const values = fieldValues(markdown, "Prep contract version");
  if (values.length === 0) {
    return {
      declaredVersion: null,
      effectiveVersion: IMPLICIT_LEGACY_PREP_CONTRACT_VERSION,
      currentVersion: CURRENT_PREP_CONTRACT_VERSION,
      diagnostics: [
        contractDiagnostic(
          PREP_CONTRACT_DIAGNOSTIC_CODES.IMPLICIT_LEGACY_VERSION,
          "legacy-compatible",
          `Missing Prep contract version is the historical implicit version ${IMPLICIT_LEGACY_PREP_CONTRACT_VERSION}.`
        )
      ]
    };
  }

  if (values.length !== 1 || !/^[1-9]\d*$/.test(values[0])) {
    return {
      declaredVersion: null,
      effectiveVersion: null,
      currentVersion: CURRENT_PREP_CONTRACT_VERSION,
      diagnostics: [
        contractDiagnostic(
          PREP_CONTRACT_DIAGNOSTIC_CODES.INVALID_VERSION,
          "invalid",
          "Prep contract version must be exactly one positive integer field."
        )
      ]
    };
  }

  const declaredVersion = Number(values[0]);
  if (declaredVersion > CURRENT_PREP_CONTRACT_VERSION) {
    return {
      declaredVersion,
      effectiveVersion: declaredVersion,
      currentVersion: CURRENT_PREP_CONTRACT_VERSION,
      diagnostics: [
        contractDiagnostic(
          PREP_CONTRACT_DIAGNOSTIC_CODES.FUTURE_VERSION,
          "invalid",
          `Prep contract version ${declaredVersion} is newer than supported version ${CURRENT_PREP_CONTRACT_VERSION}.`
        )
      ]
    };
  }

  return {
    declaredVersion,
    effectiveVersion: declaredVersion,
    currentVersion: CURRENT_PREP_CONTRACT_VERSION,
    diagnostics:
      declaredVersion < CURRENT_PREP_CONTRACT_VERSION
        ? [
            contractDiagnostic(
              PREP_CONTRACT_DIAGNOSTIC_CODES.EXPLICIT_LEGACY_VERSION,
              "legacy-compatible",
              `Prep contract version ${declaredVersion} is older than current version ${CURRENT_PREP_CONTRACT_VERSION}.`
            )
          ]
        : []
  };
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

function derivePriorPrep(reportPath, priorReport) {
  if (typeof priorReport !== "string" || priorReport === "null" || !priorReport.trim()) {
    return { path: null, absolutePath: null, exists: false };
  }

  const prepName = `${basename(priorReport, ".md")}-prd-prep.md`;
  const absolutePath = resolve(dirname(resolve(reportPath)), prepName);
  return {
    path: `reports/${prepName}`,
    absolutePath,
    exists: existsSync(absolutePath)
  };
}

export function inspectSourceReport(reportPath) {
  const reportValidation = validateReport(reportPath);
  let sourceSchemaVersion = null;
  try {
    sourceSchemaVersion = parseFrontmatter(
      readFileSync(resolve(reportPath), "utf8")
    )?.schema_version;
  } catch {
    // The report validator owns unreadable-source diagnostics below.
  }
  const nonBlockingReportErrors =
    sourceSchemaVersion === "1"
      ? reportValidation.errors.filter((error) =>
          NON_BLOCKING_REPORT_ERROR_PATTERNS.some((pattern) => pattern.test(error))
        )
      : [];
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
  const priorReport = frontmatter?.prior_report ?? "null";
  const priorPrep = derivePriorPrep(reportPath, priorReport);
  const prioritizedHeaders =
    frontmatter?.schema_version === "2" ? V2_PRIORITIZED_HEADERS : PRIORITIZED_HEADERS;
  const prioritized = parseTable(markdown, "## Prioritized Findings", prioritizedHeaders, {
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
    priorReport,
    priorPrepPath: priorPrep.path,
    priorPrepAbsolutePath: priorPrep.absolutePath,
    priorPrepExists: priorPrep.exists,
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

function ticketPacketSections(markdown) {
  const followUpBody = section(markdown, "## Non-PRD Follow-Up");
  if (followUpBody === null) return [];
  const lines = followUpBody.split(/\r?\n/);
  const headingIndexes = lines
    .map((line, index) => (line.startsWith("### ") ? index : -1))
    .filter((index) => index >= 0);
  return headingIndexes
    .filter((index) => lines[index].startsWith("### Ticket Packet:"))
    .map((start) => {
      const end = headingIndexes.find((index) => index > start) ?? lines.length;
      return {
        title: lines[start].slice("### Ticket Packet:".length).trim(),
        body: lines.slice(start + 1, end).join("\n")
      };
    });
}

export function inspectTicketPackets(markdown, { requireFields = true } = {}) {
  const errors = [];
  const titles = new Set();
  const packets = ticketPacketSections(markdown).map((packet) => {
    const scope = `Ticket Packet ${packet.title || "<blank>"}`;
    if (!packet.title) errors.push("Ticket Packet heading must include a name.");
    if (titles.has(packet.title)) errors.push(`Duplicate Ticket Packet name: ${packet.title}`);
    titles.add(packet.title);

    const fields = {};
    for (const field of TICKET_PACKET_FIELDS) {
      fields[field] = requireFields
        ? oneField(packet.body, field, errors, scope)
        : optionalField(packet.body, field);
    }
    const acceptance = bulletField(packet.body, "Acceptance", errors, scope, {
      required: requireFields
    });
    const checklistMapping = bulletField(
      packet.body,
      "Browser-visible guidance checklist mapping",
      errors,
      scope,
      { required: requireFields }
    );

    return {
      title: packet.title,
      sources: fields.Sources,
      sourceIds: fields.Sources?.match(/\bF\d{3,}\b/g) ?? [],
      typeAndReadiness: fields["Type and readiness"],
      problem: fields.Problem,
      productRule: fields["Product rule"],
      affectedSurfaces: fields["Affected surfaces"],
      scope: fields.Scope,
      acceptance,
      preservedStrengths: fields["Preserved strengths"],
      testingSeam: fields["Testing seam"],
      outOfScope: fields["Out of scope"],
      browserVisibleGuidanceChecklistMapping: checklistMapping
    };
  });
  return { errors, packets };
}

function inventoryPrepRecommendations(prepPath) {
  const errors = [];
  let markdown;
  try {
    markdown = readFileSync(prepPath, "utf8");
  } catch {
    return { errors: [`Cannot read prior-report prep artifact: ${prepPath}`], recommendations: [] };
  }

  const firstActions = fieldValues(markdown, "First operational action");
  if (firstActions.length !== 1 || !firstActions[0]) {
    errors.push(
      "Prior-report prep requires exactly one non-empty First operational action for consumption."
    );
  }

  if (section(markdown, "## Recommended PRD Package") === null) {
    errors.push("Prior-report prep is missing section: ## Recommended PRD Package");
  }
  const candidates = candidateSections(markdown);
  const followUps = parseTable(markdown, "## Non-PRD Follow-Up", FOLLOW_UP_HEADERS);
  errors.push(...followUps.errors);

  const recommendations = [];
  if (firstActions.length === 1 && firstActions[0]) {
    recommendations.push(`First operational action: ${firstActions[0]}`);
  }
  for (const candidate of candidates) {
    if (candidate.title) recommendations.push(`PRD Candidate: ${candidate.title}`);
  }
  for (const row of followUps.rows) {
    const item = literal(row.Item ?? "");
    if (item && !/^none\b/i.test(item)) {
      recommendations.push(`Non-PRD Follow-Up: ${item}`);
    }
  }

  return { errors, recommendations };
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

function validateTicketPackets(markdown, followUps, dispositions, source, errors) {
  const inspection = inspectTicketPackets(markdown);
  errors.push(...inspection.errors);

  const destinationNames = [];
  for (const row of followUps.rows) {
    const item = literal(row.Item ?? "");
    const destination = literal(row.Destination ?? "");
    if (/^none\b/i.test(item) || !/^ticket\b/i.test(destination)) continue;
    const match = TICKET_DESTINATION_PATTERN.exec(destination);
    if (!match?.[1]?.trim()) {
      errors.push(
        `Ticket destination for ${item || "<blank>"} must use: ticket - <exact packet name>`
      );
      continue;
    }
    destinationNames.push(match[1].trim());
  }

  for (const name of new Set(destinationNames)) {
    const destinationCount = destinationNames.filter((candidate) => candidate === name).length;
    if (destinationCount > 1) errors.push(`Duplicate ticket destination name: ${name}`);
    const packetCount = inspection.packets.filter((packet) => packet.title === name).length;
    if (packetCount !== 1) errors.push(`Ticket destination ${name} requires exactly one Ticket Packet.`);
  }
  const destinationSet = new Set(destinationNames);
  for (const packet of inspection.packets) {
    if (!destinationSet.has(packet.title)) {
      errors.push(`Ticket Packet has no matching ticket destination: ${packet.title || "<blank>"}`);
    }
  }

  const sourceIds = new Set(source.cumulativeIds);
  const strengthIds = new Set(source.strengthIds);
  const ticketCandidateIds = new Set(
    dispositions.rows
      .filter((row) => literal(row.Disposition ?? "") === "ticket-candidate")
      .map((row) => literal(row["Report item"] ?? ""))
      .filter((id) => ID_PATTERN.test(id))
  );
  const coverage = new Map();
  for (const packet of inspection.packets) {
    if (packet.sourceIds.length === 0) {
      errors.push(`Ticket Packet ${packet.title} must cite at least one report ID in Sources.`);
    }
    for (const id of packet.sourceIds) {
      if (!sourceIds.has(id)) {
        errors.push(`Ticket Packet ${packet.title} cites unknown source ID ${id}.`);
      } else if (!ticketCandidateIds.has(id)) {
        errors.push(`Ticket Packet ${packet.title} cites non-ticket-candidate source ID ${id}.`);
      }
      coverage.set(id, (coverage.get(id) ?? 0) + 1);
    }

    const preservation = packet.preservedStrengths ?? "";
    if (preservation && !preservation.startsWith("N/A - no affected source strength")) {
      const citedStrengthIds = preservation.match(/\bF\d{3,}\b/g) ?? [];
      if (citedStrengthIds.length === 0) {
        errors.push(
          `Ticket Packet ${packet.title} must cite a source strength or use the explicit N/A reason.`
        );
      }
      for (const id of citedStrengthIds) {
        if (!strengthIds.has(id)) {
          errors.push(`Ticket Packet ${packet.title} cites non-strength preservation ID ${id}.`);
        }
      }
    }
  }
  for (const id of ticketCandidateIds) {
    if (coverage.get(id) !== 1) {
      errors.push(`Ticket-candidate source ${id} is not covered by exactly one Ticket Packet.`);
    }
  }

  return inspection.packets.length;
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

function validateFixedFields(markdown, fields, source, completionMode, errors, { legacyContract }) {
  if (
    !legacyContract &&
    source.sourceValidation === "passed" &&
    fields["Source validation"] !== "passed"
  ) {
    errors.push("Source validation must be: passed");
  }
  if (
    !legacyContract &&
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
  if (!legacyContract && isCircularFirstOperationalAction(fields["First operational action"])) {
    errors.push(
      "First operational action must name substantive portfolio work, not playtest-to-issues or /to-prd."
    );
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

export function validatePrepArtifact(
  reportPath,
  prepPath,
  { completionMode = "final", contractMode = "current" } = {}
) {
  if (!Object.hasOwn(COMPLETION_VALUES, completionMode)) {
    throw new TypeError(`Unsupported completion mode: ${completionMode}`);
  }
  if (!CONTRACT_MODES.has(contractMode)) {
    throw new TypeError(`Unsupported contract mode: ${contractMode}`);
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

  const inspectedContract = inspectPrepContract(markdown);
  const contractDiagnostics = [...inspectedContract.diagnostics];
  const contractHasInvalidDiagnostic = contractDiagnostics.some(
    (diagnostic) => diagnostic.disposition === "invalid"
  );
  if (contractHasInvalidDiagnostic) {
    errors.push(
      ...contractDiagnostics
        .filter((diagnostic) => diagnostic.disposition === "invalid")
        .map((diagnostic) => diagnostic.message)
    );
  }
  const legacyContract =
    contractMode === "declared" &&
    !contractHasInvalidDiagnostic &&
    inspectedContract.effectiveVersion === IMPLICIT_LEGACY_PREP_CONTRACT_VERSION;

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
  for (const label of REQUIRED_FIELDS) {
    fields[label] =
      legacyContract && LEGACY_OPTIONAL_FIELDS.has(label)
        ? optionalField(markdown, label)
        : oneField(markdown, label, errors);
  }
  if (!legacyContract && fields["Prep contract version"] !== String(CURRENT_PREP_CONTRACT_VERSION)) {
    errors.push(`Prep contract version must be: ${CURRENT_PREP_CONTRACT_VERSION}`);
  }
  if (isCircularFirstOperationalAction(fields["First operational action"])) {
    contractDiagnostics.push(
      contractDiagnostic(
        legacyContract
          ? PREP_CONTRACT_DIAGNOSTIC_CODES.FIRST_ACTION_MIGRATION_REQUIRED
          : PREP_CONTRACT_DIAGNOSTIC_CODES.CURRENT_FIRST_ACTION_INVALID,
        legacyContract ? "migration-required" : "invalid",
        legacyContract
          ? "The legacy First operational action names a custody or PRD handoff and requires producer migration to substantive portfolio work."
          : "First operational action must name substantive portfolio work, not playtest-to-issues or /to-prd."
      )
    );
  }
  validateFixedFields(markdown, fields, source, completionMode, errors, { legacyContract });
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
  const legacyTicketPacketInspection = legacyContract
    ? inspectTicketPackets(markdown, { requireFields: false })
    : null;
  if (legacyTicketPacketInspection) errors.push(...legacyTicketPacketInspection.errors);
  const ticketPacketCount = legacyTicketPacketInspection
    ? legacyTicketPacketInspection.packets.length
    : validateTicketPackets(markdown, followUps, dispositions, source, errors);

  const existingPrep = fields["Existing same-stem prep classification"];
  if (existingPrep && !PREP_CLASSIFICATIONS.has(existingPrep)) {
    errors.push(`Unsupported existing same-stem prep classification: ${existingPrep}`);
  }

  const priorPrepPath = fields["Prior-report prep path"];
  const priorPrepClassification = fields["Prior-report prep classification"];
  if (priorPrepClassification && !PRIOR_PREP_CLASSIFICATIONS.has(priorPrepClassification)) {
    errors.push(`Unsupported prior-report prep classification: ${priorPrepClassification}`);
  }
  if (legacyContract) {
    // Version 1 predates mandatory prior-prep identity fields. Current source inspection remains
    // authoritative, and any present consumption ledger is still validated below.
  } else if (source.priorPrepPath === null) {
    if (priorPrepPath !== "not applicable") {
      errors.push("Prior-report prep path must be: not applicable");
    }
    if (priorPrepClassification !== "not applicable") {
      errors.push("Prior-report prep classification must be: not applicable");
    }
  } else {
    if (priorPrepPath !== source.priorPrepPath) {
      errors.push(`Prior-report prep path must be: ${source.priorPrepPath}`);
    }
    if (
      source.priorPrepExists &&
      ["not applicable", "missing at intake"].includes(priorPrepClassification)
    ) {
      errors.push("An existing prior-report prep must receive a current classification.");
    }
    if (!source.priorPrepExists && priorPrepClassification !== "missing at intake") {
      errors.push("A missing prior-report prep must be classified: missing at intake");
    }
  }

  const currentPrepRequiresConsumption = existingPrep && existingPrep !== "missing at intake";
  const priorPrepRequiresConsumption =
    source.priorPrepExists &&
    priorPrepClassification &&
    !["not applicable", "missing at intake"].includes(priorPrepClassification);
  if (currentPrepRequiresConsumption || priorPrepRequiresConsumption) {
    const consumption = parseTable(
      markdown,
      "### Prior Recommendation Consumption Ledger",
      CONSUMPTION_HEADERS
    );
    errors.push(...consumption.errors);
    const rowKeys = new Set();
    for (const row of consumption.rows) {
      const sourcePrep = literal(row["Source prep"] ?? "");
      const recommendation = literal(row["Prior recommendation"] ?? "");
      const classification = literal(row["Current classification"]);
      const rowKey = `${sourcePrep}\u0000${recommendation}`;
      if (!sourcePrep)
        errors.push("Prior Recommendation Consumption Ledger has a blank Source prep.");
      if (!recommendation) {
        errors.push("Prior Recommendation Consumption Ledger has a blank Prior recommendation.");
      }
      if (rowKeys.has(rowKey)) {
        errors.push(
          `Prior Recommendation Consumption Ledger contains duplicate recommendation: ${sourcePrep} / ${recommendation}`
        );
      }
      rowKeys.add(rowKey);
      if (!CONSUMPTION_CLASSIFICATIONS.has(classification)) {
        errors.push(`Unsupported prior recommendation classification: ${classification}`);
      }
      for (const key of ["Evidence", "Resulting action"]) {
        if (!row[key]?.trim()) {
          errors.push(
            `Prior Recommendation Consumption Ledger has blank ${key}: ${recommendation}`
          );
        }
      }
    }

    const currentPrepPath = `reports/${expectedPrepName}`;
    const allowedSourcePreps = new Set([
      ...(currentPrepRequiresConsumption ? [currentPrepPath] : []),
      ...(priorPrepRequiresConsumption ? [source.priorPrepPath] : [])
    ]);
    for (const row of consumption.rows) {
      const sourcePrep = literal(row["Source prep"] ?? "");
      if (sourcePrep && !allowedSourcePreps.has(sourcePrep)) {
        errors.push(
          `Prior Recommendation Consumption Ledger names unexpected source prep: ${sourcePrep}`
        );
      }
    }
    if (
      currentPrepRequiresConsumption &&
      !consumption.rows.some((row) => literal(row["Source prep"] ?? "") === currentPrepPath)
    ) {
      errors.push(`Prior Recommendation Consumption Ledger has no row for: ${currentPrepPath}`);
    }

    if (priorPrepRequiresConsumption) {
      const priorInventory = inventoryPrepRecommendations(source.priorPrepAbsolutePath);
      errors.push(...priorInventory.errors);
      const actualPriorRecommendations = new Set(
        consumption.rows
          .filter((row) => literal(row["Source prep"] ?? "") === source.priorPrepPath)
          .map((row) => literal(row["Prior recommendation"] ?? ""))
      );
      const expectedPriorRecommendations = new Set(priorInventory.recommendations);
      for (const recommendation of setDifference(
        expectedPriorRecommendations,
        actualPriorRecommendations
      )) {
        errors.push(`Prior Recommendation Consumption Ledger is missing: ${recommendation}`);
      }
      for (const recommendation of setDifference(
        actualPriorRecommendations,
        expectedPriorRecommendations
      )) {
        errors.push(
          `Prior Recommendation Consumption Ledger has unknown prior recommendation: ${recommendation}`
        );
      }
    }
  }

  if (!legacyContract) {
    const finalWorktree = parseTable(
      markdown,
      "### Final Worktree Ledger",
      FINAL_WORKTREE_HEADERS,
      { allowEmpty: true }
    );
    errors.push(...finalWorktree.errors);
    integerField(markdown, "Final worktree rows", finalWorktree.rows.length, errors);
    const worktreePaths = new Set();
    let intentionalPrepRows = 0;
    for (const row of finalWorktree.rows) {
      const path = literal(row.Path ?? "");
      const classification = literal(row.Classification ?? "");
      if (!path) errors.push("Final Worktree Ledger has a blank Path.");
      if (worktreePaths.has(path))
        errors.push(`Final Worktree Ledger contains duplicate path: ${path}`);
      worktreePaths.add(path);
      if (!FINAL_WORKTREE_CLASSIFICATIONS.has(classification)) {
        errors.push(
          `Unsupported final worktree classification for ${path || "<blank>"}: ${classification}`
        );
      }
      if (classification === "intentional prep artifact") {
        intentionalPrepRows += 1;
        if (path !== `reports/${expectedPrepName}`) {
          errors.push(`Intentional prep artifact path must be: reports/${expectedPrepName}`);
        }
      }
    }
    if (intentionalPrepRows > 1) {
      errors.push("Final Worktree Ledger may contain at most one intentional prep artifact.");
    }
  }

  const contractStatus =
    errors.length > 0 || contractDiagnostics.some((diagnostic) => diagnostic.disposition === "invalid")
      ? "invalid"
      : contractDiagnostics.some(
            (diagnostic) => diagnostic.disposition === "migration-required"
          )
        ? "migration-required"
        : legacyContract
          ? "legacy-compatible"
          : "current";
  const contract = {
    ...inspectedContract,
    status: contractStatus,
    diagnostics: contractDiagnostics,
    migrationInvocation:
      contractStatus === "migration-required"
        ? `$playtest-prd-prep "${source.reportPath}"`
        : null
  };

  return {
    errors,
    warnings,
    source,
    contract,
    prep: {
      completionMode,
      candidateCount,
      ticketPacketCount,
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
      priorPrepPath: source?.priorPrepPath ?? null,
      priorPrepExists: source?.priorPrepExists ?? false,
      sourceValidation: source?.sourceValidation ?? null,
      nonBlockingReportErrors: source?.nonBlockingReportErrors ?? [],
      counts: source?.counts ?? null,
      prioritizedIds: source?.prioritizedIds ?? [],
      cumulativeIds: source?.cumulativeIds ?? [],
      strengthIds: source?.strengthIds ?? []
    },
    ...(result.contract ? { contract: result.contract } : {}),
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
