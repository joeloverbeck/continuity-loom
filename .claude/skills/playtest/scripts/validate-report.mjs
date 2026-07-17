#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const FILENAME_PATTERN = /^playtest-([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{4}-\d{2}-\d{2}T\d{6}Z)\.md$/;

const REQUIRED_KEYS = [
  "report_type",
  "schema_version",
  "run_id",
  "report_stem",
  "story_title",
  "story_slug",
  "run_mode",
  "prior_report",
  "project_path",
  "project_exists_at_close",
  "started_at",
  "completed_at",
  "status",
  "completion_reason",
  "accepted_segment_sequence",
  "base_url",
  "browser",
  "viewport",
  "openrouter_send_controls_clicked",
  "provider_request_attempts",
  "provider_requests_blocked",
  "cold_prose_attempts",
  "cold_assistance_attempts",
  "counterfactual_probes",
  "candidate_intervention"
];

const COUNT_KEYS = [
  "openrouter_send_controls_clicked",
  "provider_request_attempts",
  "provider_requests_blocked",
  "cold_prose_attempts",
  "cold_assistance_attempts",
  "counterfactual_probes"
];

const INTERVENTIONS = new Set(["none", "light", "substantial", "rewrite", "not-reached"]);

export const REQUIRED_SECTION_HEADINGS = [
  "## Run Status",
  "## Executive Assessment",
  "## Story Intent and Expectations",
  "## Run Configuration and Continuation Contract",
  "## Condensed Author Journey",
  "## What Worked",
  "## Prioritized Findings",
  "## Surface-by-Surface Experience",
  "## Prompt Usefulness",
  "## Generation Brief Field Influence",
  "## Assistance Evaluation",
  "## Candidate and Accepted Segment",
  "## Cumulative Finding Ledger",
  "## Continuation Handoff",
  "## Diagnostics and Evidence",
  "## Coverage Limitations"
];

const REQUIRED_TABLE_HEADERS = [
  "| ID | Severity | Classification | Category | Summary | Confidence | Status |",
  "| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |",
  "| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |",
  "| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |",
  "| ID | First seen | Classification | Summary | Current status | Latest evidence |"
];

function usage() {
  return `Usage:
  node .claude/skills/playtest/scripts/validate-report.mjs --report <path>`;
}

export function parseFrontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match) return null;
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_]+):\s*(.*?)\s*$/.exec(line);
    if (!pair) continue;
    const raw = pair[2];
    values[pair[1]] =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
  }
  return values;
}

export function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
}

export function validateSectionOrder(markdown) {
  const body = stripFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const errors = [];
  if (!lines.some((line) => line.startsWith("# Continuity Loom Author Playtest Report: "))) {
    errors.push("Missing report title: # Continuity Loom Author Playtest Report: <Story title>");
  }

  const positions = REQUIRED_SECTION_HEADINGS.map((heading) =>
    lines.findIndex((line) => line === heading)
  );
  for (let index = 0; index < positions.length; index += 1) {
    if (positions[index] < 0) {
      errors.push(`Missing required report heading: ${REQUIRED_SECTION_HEADINGS[index]}`);
    }
  }

  let priorPosition = -1;
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index];
    if (position < 0) continue;
    if (position <= priorPosition) {
      errors.push(`Required report heading is out of order: ${REQUIRED_SECTION_HEADINGS[index]}`);
    }
    priorPosition = Math.max(priorPosition, position);
  }
  return errors;
}

export function relativeLinks(markdown) {
  const links = [];
  for (const match of stripFrontmatter(markdown).matchAll(
    /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  )) {
    const target = match[1];
    if (/^(?:https?:|mailto:|data:|#)/.test(target)) continue;
    links.push(target);
  }
  return links;
}

function toPosix(filePath) {
  return filePath.split(sep).join("/");
}

export function listEvidenceArtifacts(evidenceDir) {
  if (!existsSync(evidenceDir)) return [];
  const artifacts = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) walk(absolutePath);
      else artifacts.push(toPosix(relative(evidenceDir, absolutePath)));
    }
  };
  walk(evidenceDir);
  return artifacts.sort();
}

function isChildPath(parent, candidate) {
  const fromParent = relative(resolve(parent), resolve(candidate));
  return (
    fromParent !== "" &&
    fromParent !== ".." &&
    !fromParent.startsWith(`..${sep}`) &&
    !isAbsolute(fromParent)
  );
}

function isNull(value) {
  return value === undefined || value === "null";
}

function integer(value) {
  return /^\d+$/.test(value ?? "") ? Number(value) : null;
}

function evidenceIndexLinks(markdown) {
  const body = stripFrontmatter(markdown);
  const marker = "### Evidence Index";
  const markerIndex = body.indexOf(marker);
  if (markerIndex < 0) return [];
  const afterMarker = body.slice(markerIndex + marker.length);
  const nextSection = afterMarker.search(/\n## /);
  return relativeLinks(nextSection < 0 ? afterMarker : afterMarker.slice(0, nextSection));
}

function privacyErrors(markdown, links) {
  const errors = [];
  const secretPatterns = [
    /sk-or-v1-[A-Za-z0-9_-]{12,}/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /(?:OPENROUTER_API_KEY|api[_ -]?key)\s*[:=]\s*(?!blank\b|none\b|null\b|missing\b|redacted\b)\S{8,}/i
  ];
  if (secretPatterns.some((pattern) => pattern.test(markdown))) {
    errors.push("Report appears to contain an API key or key-like secret.");
  }

  const forbiddenBodyHeadings = [
    /^#{1,6}\s+(?:Full|Exact|Compiled) Prompt\b/im,
    /^#{1,6}\s+Raw (?:Assistance )?Response\b/im,
    /^#{1,6}\s+(?:Candidate|Accepted) Prose\b/im
  ];
  if (forbiddenBodyHeadings.some((pattern) => pattern.test(markdown))) {
    errors.push(
      "Report contains a forbidden full-prompt, raw-response, candidate-prose, or accepted-prose section."
    );
  }

  for (const match of markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    if (match[1].length > 1_000) {
      errors.push("Report contains an oversized fenced block that may be a raw prompt or payload.");
      break;
    }
  }

  for (const link of links) {
    if (/\.(?:sqlite3?|db)(?:-(?:wal|shm))?$/i.test(link)) {
      errors.push(`Project database files must not be retained as evidence: ${link}`);
    }
  }
  return errors;
}

function forbiddenEvidenceReason(artifact, evidenceDir) {
  const fileName = basename(artifact);
  if (/\.(?:sqlite3?|db)(?:-(?:wal|shm))?$/i.test(fileName)) {
    return "project database";
  }
  if (/^trace(?:-\d+)?\.zip$/i.test(fileName)) return "browser trace";
  if (
    [
      "session.json",
      "app-session.json",
      "shutdown.request",
      "save-trace.request",
      "save-trace.done",
      "server-stdout.log",
      "server-stderr.log"
    ].includes(fileName)
  ) {
    return "run plumbing";
  }
  if (artifact.split("/").some((segment) => segment.startsWith("profile-"))) {
    return "browser profile";
  }
  if (
    [
      "console-log.jsonl",
      "network-failures.jsonl",
      "provider-request-blocks.jsonl",
      "external-request-blocks.jsonl"
    ].includes(fileName) &&
    lstatSync(join(evidenceDir, artifact)).size === 0
  ) {
    return "empty diagnostic stream";
  }
  return null;
}

export function validateReport(reportPath) {
  const errors = [];
  const warnings = [];
  const absoluteReport = resolve(reportPath);
  const fileName = basename(absoluteReport);
  const reportDir = dirname(absoluteReport);
  const nameMatch = FILENAME_PATTERN.exec(fileName);

  if (basename(reportDir) !== "reports") {
    errors.push("Report must be a direct child of reports/.");
  }
  if (!nameMatch) {
    errors.push(
      `Filename "${fileName}" does not match playtest-<story-slug>-<YYYY-MM-DDTHHMMSSZ>.md.`
    );
  }

  let markdown;
  try {
    markdown = readFileSync(absoluteReport, "utf8");
  } catch {
    return { errors: [`Cannot read report: ${absoluteReport}`], warnings };
  }

  const frontmatter = parseFrontmatter(markdown);
  if (!frontmatter) {
    return { errors: [...errors, "Missing or unclosed YAML frontmatter block."], warnings };
  }
  errors.push(...validateSectionOrder(markdown));
  for (const key of REQUIRED_KEYS) {
    if (!(key in frontmatter) || frontmatter[key] === "") {
      errors.push(`Missing required frontmatter key: ${key}`);
    }
  }

  if (frontmatter.report_type !== "continuity-loom-author-playtest") {
    errors.push('report_type must be "continuity-loom-author-playtest".');
  }
  if (frontmatter.schema_version !== "1") {
    errors.push('schema_version must be "1".');
  }
  if (!isNull(frontmatter.viewport) && frontmatter.viewport !== "1440x900") {
    errors.push('viewport must be "1440x900" or null.');
  }
  if (!isNull(frontmatter.browser) && !["chromium", "chrome"].includes(frontmatter.browser)) {
    errors.push('browser must be "chromium", "chrome", or null.');
  }
  if (!["new_story", "continuation"].includes(frontmatter.run_mode)) {
    errors.push('run_mode must be "new_story" or "continuation".');
  }
  if (!["completed", "blocked"].includes(frontmatter.status)) {
    errors.push('status must be "completed" or "blocked".');
  }
  if (!INTERVENTIONS.has(frontmatter.candidate_intervention)) {
    errors.push("candidate_intervention has an unsupported value.");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.completion_reason ?? "")) {
    errors.push("completion_reason must be a short kebab-case value.");
  }
  if (
    !isNull(frontmatter.base_url) &&
    !/^http:\/\/127\.0\.0\.1:\d+$/.test(frontmatter.base_url ?? "")
  ) {
    errors.push("base_url must be null or an http://127.0.0.1 URL with an explicit port.");
  }

  const stem = fileName.replace(/\.md$/, "");
  if (frontmatter.run_id !== stem) errors.push("run_id must match the report filename stem.");
  if (frontmatter.report_stem !== stem) {
    errors.push("report_stem must match the report filename stem.");
  }
  if (nameMatch && frontmatter.story_slug !== nameMatch[1]) {
    errors.push("story_slug must match the story slug in the report filename.");
  }

  if (!isNull(frontmatter.prior_report)) {
    const prior = frontmatter.prior_report;
    if (
      isAbsolute(prior) ||
      (!prior.startsWith("reports/") && !prior.startsWith("reports\\")) ||
      resolve(dirname(reportDir), prior) === absoluteReport ||
      !isChildPath(reportDir, resolve(dirname(reportDir), prior))
    ) {
      errors.push("prior_report must be null or a different repository-relative reports/ path.");
    }
  }
  if (frontmatter.run_mode === "new_story" && !isNull(frontmatter.prior_report)) {
    errors.push("new_story runs require prior_report: null.");
  }
  if (frontmatter.run_mode === "continuation" && isNull(frontmatter.prior_report)) {
    errors.push("continuation runs require a repository-relative prior_report.");
  }

  if (!frontmatter.story_title?.trim()) errors.push("story_title must not be blank.");
  const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!isoTimestamp.test(frontmatter.started_at ?? "")) {
    errors.push("started_at must be an ISO-8601 UTC timestamp.");
  }
  if (!isoTimestamp.test(frontmatter.completed_at ?? "")) {
    errors.push("completed_at must be an ISO-8601 UTC timestamp.");
  }

  if (!isNull(frontmatter.project_path)) {
    const projectPath = frontmatter.project_path;
    if (!isAbsolute(projectPath) || !isChildPath("/tmp", projectPath)) {
      errors.push("project_path must be null or an absolute child path under /tmp.");
    }
  }
  if (!["true", "false"].includes(frontmatter.project_exists_at_close)) {
    errors.push("project_exists_at_close must be true or false.");
  }

  const counts = {};
  for (const key of COUNT_KEYS) {
    counts[key] = integer(frontmatter[key]);
    if (counts[key] === null) errors.push(`${key} must be a non-negative integer.`);
  }
  const acceptedSequence = isNull(frontmatter.accepted_segment_sequence)
    ? null
    : integer(frontmatter.accepted_segment_sequence);
  if (
    !isNull(frontmatter.accepted_segment_sequence) &&
    (acceptedSequence === null || acceptedSequence < 1)
  ) {
    errors.push("accepted_segment_sequence must be null or a positive integer.");
  }

  if ((counts.cold_prose_attempts ?? 0) > 2) {
    errors.push("cold_prose_attempts must not exceed 2.");
  }
  if ((counts.counterfactual_probes ?? 0) > 1) {
    errors.push("counterfactual_probes must not exceed 1.");
  }

  const providerAttempts = counts.provider_request_attempts ?? 0;
  const providerBlocks = counts.provider_requests_blocked ?? 0;
  const sendClicks = counts.openrouter_send_controls_clicked ?? 0;
  if (providerAttempts > 0 || providerBlocks > 0 || sendClicks > 0) {
    if (frontmatter.status !== "blocked") {
      errors.push("Any provider-send interaction requires status: blocked.");
    }
    if (frontmatter.completion_reason !== "provider-request-attempt") {
      errors.push(
        "Any provider-send interaction requires completion_reason: provider-request-attempt."
      );
    }
    if (providerAttempts < 1 || providerBlocks < providerAttempts) {
      errors.push("Provider attempts must be nonzero and no greater than provider guard blocks.");
    }
  }

  if (frontmatter.status === "completed") {
    if (frontmatter.completion_reason !== "accepted-one-segment") {
      errors.push("Completed runs require completion_reason: accepted-one-segment.");
    }
    if (acceptedSequence === null || acceptedSequence < 1) {
      errors.push("Completed runs require a positive accepted_segment_sequence.");
    }
    if (frontmatter.project_exists_at_close !== "true" || isNull(frontmatter.project_path)) {
      errors.push("Completed runs require an existing-at-close /tmp project path.");
    }
    if (
      isNull(frontmatter.base_url) ||
      isNull(frontmatter.browser) ||
      isNull(frontmatter.viewport)
    ) {
      errors.push("Completed runs require base_url, browser, and viewport values.");
    }
    if (![1, 2].includes(counts.cold_prose_attempts)) {
      errors.push("Completed runs require one or two cold prose attempts.");
    }
    if (frontmatter.candidate_intervention === "not-reached") {
      errors.push("Completed runs must record the candidate intervention burden.");
    }
    if (providerAttempts !== 0 || providerBlocks !== 0 || sendClicks !== 0) {
      errors.push("Completed runs require zero provider sends, attempts, and guard blocks.");
    }
  }

  for (const header of REQUIRED_TABLE_HEADERS) {
    if (!markdown.includes(header)) errors.push(`Missing required report table header: ${header}`);
  }
  if (!markdown.includes("### Evidence Index")) {
    errors.push("Missing required subsection: ### Evidence Index");
  }

  const links = relativeLinks(markdown);
  errors.push(...privacyErrors(markdown, links));
  const evidencePrefix = `assets/${stem}/`;
  const evidenceDir = join(reportDir, "assets", stem);
  for (const link of links) {
    if (isAbsolute(link)) {
      errors.push(`Evidence link must be relative to the report: ${link}`);
      continue;
    }
    if (!link.startsWith(evidencePrefix)) {
      errors.push(`Evidence link outside ${evidencePrefix}: ${link}`);
      continue;
    }
    const target = resolve(reportDir, link);
    if (!isChildPath(evidenceDir, target)) {
      errors.push(`Evidence link escapes ${evidencePrefix}: ${link}`);
      continue;
    }
    if (!existsSync(target)) {
      errors.push(`Evidence link target does not exist: ${link}`);
    } else if (lstatSync(target).isSymbolicLink()) {
      errors.push(`Evidence links must not target symbolic links: ${link}`);
    }
  }

  const indexedLinks = new Set(evidenceIndexLinks(markdown));
  for (const artifact of listEvidenceArtifacts(evidenceDir)) {
    const reportRelative = `${evidencePrefix}${artifact}`;
    const forbiddenReason = forbiddenEvidenceReason(artifact, evidenceDir);
    if (forbiddenReason) {
      errors.push(`Forbidden ${forbiddenReason} retained in evidence: ${reportRelative}`);
    }
    if (!indexedLinks.has(reportRelative)) {
      errors.push(`Evidence artifact is not listed in Evidence Index: ${reportRelative}`);
    }
  }

  return { errors, warnings };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const reportIndex = argv.indexOf("--report");
  const reportPath = reportIndex >= 0 ? argv[reportIndex + 1] : null;
  if (!reportPath) {
    process.stderr.write(`${usage()}\n`);
    return 1;
  }
  const { errors, warnings } = validateReport(reportPath);
  for (const warning of warnings) process.stdout.write(`WARN: ${warning}\n`);
  if (errors.length > 0) {
    for (const error of errors) process.stdout.write(`FAIL: ${error}\n`);
    return 1;
  }
  process.stdout.write(`PASS: ${reportPath}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
