#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const usage = `Usage:
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs <body-file> [options]
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs --stdin [options]

Options:
  --expect-checklist           Require the browser-visible guidance checklist.
  --approved-source <path>     Allow a durable local citation; repeat as needed.
  --disallowed-source <path>   Reject a summarized/local-only source; repeat as needed.
  --policy-file <path>         Load checklist and source policy from a reusable JSON file.
  --extract-sources            Print citation and ADR discovery without validating.
  --help                       Show this help.`;

const checklistAuthorityPath = fileURLToPath(
  new URL("../../../../docs/agents/issue-tracker.md", import.meta.url),
);
const checklistStartMarker = "<!-- browser-visible-guidance-checklist:start -->";
const checklistEndMarker = "<!-- browser-visible-guidance-checklist:end -->";

function failUsage(message) {
  if (message) console.error(message);
  console.error(usage);
  process.exit(2);
}

function loadChecklistItems() {
  let authority;
  try {
    authority = readFileSync(checklistAuthorityPath, "utf8");
  } catch (error) {
    failUsage(`Cannot read browser checklist authority ${checklistAuthorityPath}: ${error.message}`);
  }

  const startIndex = authority.indexOf(checklistStartMarker);
  const endIndex = authority.indexOf(checklistEndMarker);
  if (startIndex < 0 || endIndex <= startIndex) {
    failUsage("Browser checklist authority is missing its ordered start/end markers.");
  }

  const block = authority.slice(startIndex + checklistStartMarker.length, endIndex);
  const items = [...block.matchAll(/^- `([^`]+)`: /gm)].map((match) => match[1]);
  if (items.length === 0) failUsage("Browser checklist authority contains no canonical items.");
  if (new Set(items).size !== items.length) {
    failUsage("Browser checklist authority contains duplicate canonical item labels.");
  }
  return items;
}

const checklistItems = loadChecklistItems();

function parsePolicyFile(policyFile) {
  let policy;
  try {
    policy = JSON.parse(readFileSync(policyFile, "utf8"));
  } catch (error) {
    failUsage(`Cannot read validator policy file ${policyFile}: ${error.message}`);
  }

  if (policy == null || typeof policy !== "object" || Array.isArray(policy)) {
    failUsage("Validator policy must be a JSON object.");
  }

  const allowedKeys = new Set(["expectChecklist", "approvedSources", "disallowedSources"]);
  const unknownKeys = Object.keys(policy).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    failUsage(`Unknown validator policy field(s): ${unknownKeys.join(", ")}`);
  }
  if (typeof policy.expectChecklist !== "boolean") {
    failUsage("Validator policy expectChecklist must be a boolean.");
  }

  for (const key of ["approvedSources", "disallowedSources"]) {
    if (!Array.isArray(policy[key]) || policy[key].some((value) => typeof value !== "string" || value.length === 0)) {
      failUsage(`Validator policy ${key} must be an array of non-empty strings.`);
    }
  }

  return {
    approvedSources: unique(policy.approvedSources),
    disallowedSources: unique(policy.disallowedSources),
    expectChecklist: policy.expectChecklist,
  };
}

function parseArgs(argv) {
  const options = {
    approvedSources: [],
    bodyFile: null,
    disallowedSources: [],
    expectChecklist: false,
    extractSources: false,
    inlinePolicyProvided: false,
    policyFile: null,
    stdin: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      console.log(usage);
      process.exit(0);
    }
    if (argument === "--stdin") {
      options.stdin = true;
      continue;
    }
    if (argument === "--expect-checklist") {
      options.expectChecklist = true;
      options.inlinePolicyProvided = true;
      continue;
    }
    if (argument === "--extract-sources") {
      options.extractSources = true;
      continue;
    }
    if (argument === "--approved-source" || argument === "--disallowed-source") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) failUsage(`${argument} requires a path.`);
      const destination = argument === "--approved-source" ? options.approvedSources : options.disallowedSources;
      destination.push(value);
      options.inlinePolicyProvided = true;
      index += 1;
      continue;
    }
    if (argument === "--policy-file") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) failUsage("--policy-file requires a path.");
      if (options.policyFile) failUsage("Provide --policy-file only once.");
      options.policyFile = value;
      index += 1;
      continue;
    }
    if (argument.startsWith("--")) failUsage(`Unknown option: ${argument}`);
    if (options.bodyFile) failUsage("Provide exactly one body file, or use --stdin.");
    options.bodyFile = argument;
  }

  if (options.stdin === Boolean(options.bodyFile)) failUsage("Provide exactly one body file, or use --stdin.");
  if (options.policyFile && options.inlinePolicyProvided) {
    failUsage("Do not combine --policy-file with inline checklist or source-policy options.");
  }
  if (options.policyFile) Object.assign(options, parsePolicyFile(options.policyFile));
  return options;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function sectionBody(lines, heading) {
  const startIndex = lines.findIndex((line) => line === `## ${heading}`);
  if (startIndex < 0) return "";

  const followingLines = lines.slice(startIndex + 1);
  const nextSectionIndex = followingLines.findIndex((line) => line.startsWith("## "));
  return (nextSectionIndex < 0 ? followingLines : followingLines.slice(0, nextSectionIndex)).join("\n");
}

function inspectBody(body) {
  const sourcePattern = /(?:^|[\s([`])((?:(?:docs|reports|archive)\/[A-Za-z0-9._/-]+|(?:CONTEXT(?:-MAP)?|CLAUDE|AGENTS)\.md))/g;
  const localSourcePaths = unique(
    [...body.matchAll(sourcePattern)]
      .map((match) => ({
        explicitlyFormatted: match[0].startsWith("`"),
        path: match[1].replace(/[).,;:`]+$/, ""),
      }))
      .filter(({ explicitlyFormatted, path }) => explicitlyFormatted || /\.[A-Za-z0-9]+$/.test(path))
      .map(({ path }) => path),
  );
  const adrShorthands = unique([...body.matchAll(/\bADR [0-9]{4}\b/g)].map((match) => match[0]));
  const adrDirectory = "docs/adr";
  const adrFiles = existsSync(adrDirectory) ? readdirSync(adrDirectory) : [];
  const resolvedAdrPaths = [];
  const unresolvedAdrShorthands = [];

  for (const shorthand of adrShorthands) {
    const number = shorthand.match(/[0-9]{4}/)?.[0];
    const matches = adrFiles
      .filter((name) => name.startsWith(`${number}-`) && name.endsWith(".md"))
      .map((name) => `${adrDirectory}/${name}`);
    if (matches.length === 1) resolvedAdrPaths.push(matches[0]);
    else unresolvedAdrShorthands.push(shorthand);
  }

  return {
    adrShorthands,
    localSourcePaths,
    resolvedAdrPaths: unique(resolvedAdrPaths),
    unresolvedAdrShorthands,
  };
}

const options = parseArgs(process.argv.slice(2));
const body = options.stdin ? readFileSync(0, "utf8") : readFileSync(options.bodyFile, "utf8");
if (!body.trim()) {
  console.error("PRD body input is empty.");
  process.exit(1);
}
const inspection = inspectBody(body);

if (options.extractSources) {
  console.log(JSON.stringify({ mode: "extract-sources", ...inspection }, null, 2));
  process.exit(0);
}

const lines = body.split(/\r?\n/);
const storyPattern = /^[0-9]+\. As an? .+, I want .+, so that .+$/;
const storyLines = [...body.matchAll(/^[0-9]+\. As .+$/gm)].map((match) => match[0]);
const badStories = storyLines.filter((story) => !storyPattern.test(story));
const testingDecisionsBody = sectionBody(lines, "Testing Decisions");
const furtherNotesBody = sectionBody(lines, "Further Notes");
const hasChecklist = body.includes("Browser-visible guidance checklist mapping");
const checklistMissing = options.expectChecklist
  ? checklistItems.filter(
      (item) =>
        !lines.some(
          (line) =>
            line.toLowerCase().includes(item.toLowerCase()) &&
            (/N\/A - .+/.test(line) ||
              /(preamble|Problem Statement|Solution|User Stories|Implementation Decisions|Testing Decisions|Principles|Further Notes|covered|covers|home)/i.test(
                line,
              )),
        ),
    )
  : [];
const unexpectedLocalSourcePaths = inspection.localSourcePaths.filter(
  (path) => !options.approvedSources.includes(path),
);
const leakedDisallowedLocalSources = options.disallowedSources.filter((path) => body.includes(path));
const trimmedBody = body.trimStart();

const checks = {
  startsUntitled: trimmedBody.length > 0 && !trimmedBody.startsWith("#"),
  hasProblem: body.includes("## Problem Statement"),
  hasSolution: body.includes("## Solution"),
  hasStories: body.includes("## User Stories"),
  hasImplementation: body.includes("## Implementation Decisions"),
  hasTesting: body.includes("## Testing Decisions"),
  hasTestingSeamConfirmationMarker: testingDecisionsBody.includes("Seam confirmation:"),
  hasPrinciples: body.includes("## Principles"),
  hasOutOfScope: body.includes("## Out of Scope"),
  hasFurtherNotes: body.includes("## Further Notes"),
  hasFurtherNotesSeamConfirmationMarker: furtherNotesBody.includes("Seam confirmation:"),
  checklistModeMatches: options.expectChecklist || !hasChecklist,
  hasChecklist: !options.expectChecklist || hasChecklist,
  hasChecklistItems: !options.expectChecklist || checklistMissing.length === 0,
  hasNoTmp: !body.includes("/tmp"),
  hasNoHome: !body.includes("/home/"),
  hasNoH1: !/^# /m.test(body),
  hasStoriesConforming: storyLines.length > 0 && badStories.length === 0,
  hasOnlyApprovedLocalSources: unexpectedLocalSourcePaths.length === 0,
  hasNoDisallowedLocalSources: leakedDisallowedLocalSources.length === 0,
  hasResolvedAdrShorthands: inspection.unresolvedAdrShorthands.length === 0,
};
const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  mode: options.stdin ? "stdin" : "file",
  bodyFile: options.bodyFile,
  policyFile: options.policyFile,
  expectsChecklist: options.expectChecklist,
  checklistAuthorityPath,
  checklistItems,
  checks,
  storyCount: storyLines.length - badStories.length,
  badStories,
  checklistMissing,
  approvedDurableSourcePaths: unique(options.approvedSources),
  disallowedLocalSources: unique(options.disallowedSources),
  unexpectedLocalSourcePaths,
  leakedDisallowedLocalSources,
  ...inspection,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exit(1);
