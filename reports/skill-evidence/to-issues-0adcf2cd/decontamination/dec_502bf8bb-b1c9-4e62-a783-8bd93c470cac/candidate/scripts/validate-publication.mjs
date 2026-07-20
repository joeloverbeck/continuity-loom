#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const checklistAuthorityPath = fileURLToPath(
  new URL("../../../../docs/agents/issue-tracker.md", import.meta.url),
);
const checklistAuthority = readFileSync(checklistAuthorityPath, "utf8");
const checklistBlock = checklistAuthority.match(
  /<!-- browser-visible-guidance-checklist:start -->([\s\S]*?)<!-- browser-visible-guidance-checklist:end -->/,
)?.[1];

export const CHECKLIST_ITEMS = [...(checklistBlock ?? "").matchAll(/^- `([^`]+)`: /gm)].map(
  (match) => match[1],
);

if (CHECKLIST_ITEMS.length === 0 || new Set(CHECKLIST_ITEMS).size !== CHECKLIST_ITEMS.length) {
  throw new Error(`Invalid browser checklist authority: ${checklistAuthorityPath}`);
}

const COMPOSITE_CHECKLIST_COMPONENTS = new Map([
  ["entry point and availability", [
    ["entry point", /\bentry points?\b|\b(?:reach|open|access)(?:es|ed|ible)?\b/i],
    ["availability", /\bavailab\w*\b|\benabl\w*\b|\bdisabl\w*\b|\bhidden\b/i],
  ]],
  ["user-visible states, actions, and outcomes", [
    ["states", /\bstates?\b/i],
    ["actions", /\bactions?\b|\bcontrols?\b/i],
    ["outcomes", /\boutcomes?\b|\bresults?\b/i],
  ]],
  ["validation, warning, error, and recovery behavior", [
    ["validation", /\bvalidation\b|\bblockers?\b|\breject\w*\b|\binvalid\w*\b/i],
    ["warning", /\bwarnings?\b/i],
    ["error", /\berrors?\b|\bfail(?:s|ure)?\b/i],
    ["recovery", /\brecover\w*\b|\bremediation\b/i],
  ]],
  ["prompt preview contents and freshness", [
    ["prompt preview", /\bprompt (?:preview|inspection|inspector)\b/i],
    ["contents", /\bcontents?\b|\bcomplete\b|\bfull\b|\b(?:shows?|renders?|displays?)\b[\s\S]{0,80}\b(?:exact|normalized|escaped|current)\b/i],
    ["freshness", /\bfresh(?:ness)?\b|\bstale\b|\bfingerprint\w*\b/i],
  ]],
  ["user-initiated external LLM boundary", [
    ["user-initiated", /\buser[- ]initiated\b|\buser\b[\s\S]{0,120}\b(?:action|click|send|generate)\b|\b(?:Get ideas|Get new slate|Regenerate all|per-slot Regenerate)\b/i],
    ["external LLM", /\bexternal (?:LLM|model)\b|\bOpenRouter\b|\bprovider\b/i],
    ["boundary", /\bboundary\b|\bno provider call\b|\bsends?\b/i],
  ]],
  ["canon and prose boundary visibility", [
    ["canon", /\bcanon(?:ical)?\b|\bauthority\b/i],
    ["prose", /\bprose\b|\bcandidate\b|\bsegment\b/i],
    ["boundary visibility", /\bboundar\w*\b|\bvisib\w*\b|\bdistinct\b|\blabel\w*\b[\s\S]{0,120}\bnon[- ]canonical\b/i],
  ]],
  ["persistence, migration, export, and provenance", [
    ["persistence", /\bpersist\w*\b|\bstor(?:e|ed|age)\b/i],
    ["migration", /\bmigrat\w*\b/i],
    ["export", /\bexport\w*\b/i],
    ["provenance", /\bprovenance\b|\borigin\b/i],
  ]],
  ["browser and accessibility regression scenario", [
    ["browser", /\bbrowser\b|\bcomponent\b/i],
    ["accessibility", /\baccessib\w*\b|\bkeyboard\b|\baccessible name\b/i],
    ["regression scenario", /\bregression\b|\bscenario\b|\bsmoke\b|\btests?\b[\s\S]{0,80}\bcover\w*\b/i],
  ]],
]);

const usage = `Usage:
  node .claude/skills/to-issues/scripts/validate-publication.mjs child <body-file> [options]
  node .claude/skills/to-issues/scripts/validate-publication.mjs ledger <body-file> [options]
  node .claude/skills/to-issues/scripts/validate-publication.mjs run-sheet <run-sheet-file> [options]

Child options:
  --parent <token>             Require a parent reference.
  --source <token>             Require a standalone source reference.
  --source-relationship <text> Require the exact standalone source relationship.
  --blocker <issue-ref>        Require exactly this blocker; repeat as needed.
  --external-blocker <text>    Require exactly this non-tracker prerequisite; repeat as needed.
  --expect-no-blocker          Require the house-style no-blocker phrase and zero tracker or external blockers.
  --expect-stories             Require the user-story coverage section.
  --expect-checklist-na        Require a checklist N/A summary.
  --expect-ac-count <count>    Require an exact acceptance-criterion count; mandatory in child mode.

Ledger options:
  --child <issue-ref>          Require a child reference; repeat as needed.
  --expect-story-coverage      Require an explicit ledger story-coverage section.

Run-sheet options:
  --slice-body <slice>=<path>  Require all canonical checklist rows for an affected slice.
  --unaffected-slice <slice>   Require one checklist-N/A row for an unaffected slice.
  --only-slice <slice>         Validate only this configured slice; repeat as needed.

Shared options:
  --placeholder-re <pattern>   Placeholder regex; defaults to #SLICE|PLACEHOLDER.
  --forbid-literal <text>      Reject exact run-specific text; repeat as needed.
  --forbid-pattern <pattern>   Reject a run-specific regex; repeat as needed.
  --help                       Show this help.`;

function failUsage(message) {
  if (message) console.error(message);
  console.error(usage);
  process.exit(2);
}

function requireValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) failUsage(`${option} requires a value.`);
  return value;
}

function parseSliceBody(value) {
  const separator = value.indexOf("=");
  if (separator < 1 || separator === value.length - 1) {
    failUsage("--slice-body requires <slice>=<path>.");
  }
  return { slice: value.slice(0, separator), path: value.slice(separator + 1) };
}

function parseArgs(argv) {
  if (argv.includes("--help")) {
    console.log(usage);
    process.exit(0);
  }
  const [mode, inputFile, ...args] = argv;
  if (!["child", "ledger", "run-sheet"].includes(mode) || !inputFile) failUsage();

  const options = {
    blockers: [],
    children: [],
    externalBlockers: [],
    expectAcCount: null,
    expectChecklistNa: false,
    expectNoBlocker: false,
    expectStoryCoverage: false,
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
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--expect-no-blocker") options.expectNoBlocker = true;
    else if (argument === "--expect-stories") options.expectStories = true;
    else if (argument === "--expect-checklist-na") options.expectChecklistNa = true;
    else if (argument === "--expect-story-coverage") options.expectStoryCoverage = true;
    else if (["--parent", "--source", "--source-relationship", "--blocker", "--external-blocker", "--child", "--expect-ac-count", "--placeholder-re", "--forbid-literal", "--forbid-pattern", "--slice-body", "--unaffected-slice", "--only-slice"].includes(argument)) {
      const value = requireValue(args, index, argument);
      if (argument === "--parent") options.parent = value;
      else if (argument === "--source") options.source = value;
      else if (argument === "--source-relationship") options.sourceRelationship = value;
      else if (argument === "--blocker") options.blockers.push(value);
      else if (argument === "--external-blocker") options.externalBlockers.push(value);
      else if (argument === "--child") options.children.push(value);
      else if (argument === "--placeholder-re") options.placeholderRe = value;
      else if (argument === "--forbid-literal") options.forbidLiterals.push(value);
      else if (argument === "--forbid-pattern") options.forbidPatterns.push(value);
      else if (argument === "--slice-body") options.sliceBodies.push(parseSliceBody(value));
      else if (argument === "--unaffected-slice") options.unaffectedSlices.push(value);
      else if (argument === "--only-slice") options.onlySlices.push(value);
      else {
        const count = Number(value);
        if (!Number.isInteger(count) || count < 1) failUsage("--expect-ac-count requires a positive integer.");
        options.expectAcCount = count;
      }
      index += 1;
    } else failUsage(`Unknown option: ${argument}`);
  }

  if (mode === "child" && options.expectNoBlocker && (options.blockers.length > 0 || options.externalBlockers.length > 0)) {
    failUsage("Use --expect-no-blocker or blocker options, not both.");
  }
  if (mode === "child" && options.parent != null && options.source != null) {
    failUsage("Use --parent or --source, not both.");
  }
  if (mode === "child" && options.parent == null && options.source == null) {
    failUsage("child mode requires exactly one of --parent or --source.");
  }
  if (mode === "child" && ((options.source == null) !== (options.sourceRelationship == null))) {
    failUsage("--source and --source-relationship must be provided together.");
  }
  if (mode === "child" && options.expectAcCount == null) {
    failUsage("child mode requires --expect-ac-count.");
  }
  if (mode === "run-sheet" && options.sliceBodies.length === 0 && options.unaffectedSlices.length === 0) {
    failUsage("run-sheet mode requires --slice-body or --unaffected-slice.");
  }
  if (mode !== "run-sheet" && options.onlySlices.length > 0) {
    failUsage("--only-slice is available only in run-sheet mode.");
  }
  if (mode !== "ledger" && options.expectStoryCoverage) {
    failUsage("--expect-story-coverage is available only in ledger mode.");
  }
  return { inputFile, mode, options };
}

function readText(path) {
  try {
    const text = readFileSync(path, "utf8");
    if (!text.trim()) throw new Error("file is empty");
    return text;
  } catch (error) {
    console.error(`Cannot read ${path}: ${error.message}`);
    process.exit(2);
  }
}

function unique(values) {
  return [...new Set(values)].sort();
}

function sectionBody(body, heading) {
  const start = body.indexOf(heading);
  if (start < 0) return "";
  const remainder = body.slice(start + heading.length);
  const nextHeading = remainder.search(/\n## /);
  return nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
}

function compilePattern(pattern, option) {
  try {
    return new RegExp(pattern);
  } catch (error) {
    failUsage(`Invalid ${option}: ${error.message}`);
  }
}

function commonArtifactChecks(body, options) {
  const placeholderPattern = compilePattern(options.placeholderRe, "--placeholder-re");
  const forbiddenLiterals = options.forbidLiterals ?? [];
  const forbiddenPatterns = (options.forbidPatterns ?? [])
    .map((pattern) => compilePattern(pattern, "--forbid-pattern"));
  return {
    hasContent: body.trim().length > 0,
    noPatchMarkers: !/\*\*\* (Begin|End) Patch/.test(body),
    noPlaceholders: !placeholderPattern.test(body),
    noForbiddenLiterals: forbiddenLiterals.every((literal) => !body.includes(literal)),
    noForbiddenPatterns: forbiddenPatterns.every((pattern) => !pattern.test(body)),
  };
}

function commonBodyChecks(body, options) {
  return {
    ...commonArtifactChecks(body, options),
    noHome: !body.includes("/home/"),
    noTmp: !body.includes("/tmp"),
  };
}

function acceptanceCriteria(body) {
  return (sectionBody(body, "## Acceptance criteria").match(/^- \[ \] .+$/gm) ?? [])
    .map((line, index) => ({ ordinal: index + 1, text: line.replace(/^- \[ \] /, "").trim() }));
}

function acceptanceCount(body) {
  return acceptanceCriteria(body).length;
}

function blockerEntries(body) {
  return sectionBody(body, "## Blocked by")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

export function validateChild(body, options) {
  const entries = blockerEntries(body);
  const expectedBlockers = unique(options.blockers);
  const expectedExternalBlockers = unique(options.externalBlockers ?? []);
  const expectedExternalSet = new Set(expectedExternalBlockers);
  const actualExternalBlockers = unique(entries.filter((entry) =>
    expectedExternalSet.has(entry) || !/#\d+/.test(entry)));
  const trackerEntries = entries.filter((entry) => !actualExternalBlockers.includes(entry));
  const actualBlockers = unique(trackerEntries.flatMap((entry) => entry.match(/#\d+/g) ?? []));
  const count = acceptanceCount(body);
  const relationshipMode = options.parent == null ? "standalone-source" : "parent";
  const sourceSection = sectionBody(body, "## Source and coordination");
  const checks = {
    ...commonBodyChecks(body, options),
    ...(relationshipMode === "parent"
      ? {
          hasParentHeading: body.includes("## Parent"),
          hasParent: body.includes(options.parent),
        }
      : {
          hasSourceHeading: body.includes("## Source and coordination"),
          hasSource: sourceSection.includes(options.source),
          hasSourceRelationship: sourceSection.includes(options.sourceRelationship),
        }),
    hasWhat: body.includes("## What to build"),
    hasAcceptance: body.includes("## Acceptance criteria"),
    hasAcceptanceItems: count > 0,
    hasBlockedBy: body.includes("## Blocked by"),
    hasPrinciples: body.includes("## Principles"),
    hasStoryCoverage: !options.expectStories || body.includes("## User stories covered"),
    ...(options.expectChecklistNa
      ? {
          hasChecklistNa:
            /(?:Browser-visible guidance checklist mapped|checklist mapped): N\/A/i.test(body),
        }
      : {}),
    noBlockerExpectationPassed:
      !options.expectNoBlocker ||
      (body.includes("None - can start immediately") &&
        actualBlockers.length === 0 &&
        actualExternalBlockers.length === 0),
    hasExpectedBlockers:
      options.expectNoBlocker || expectedBlockers.every((reference) => actualBlockers.includes(reference)),
    hasOnlyExpectedBlockers:
      options.expectNoBlocker ||
      options.blockers.length === 0 ||
      actualBlockers.every((reference) => expectedBlockers.includes(reference)),
    hasExpectedExternalBlockers:
      options.expectNoBlocker ||
      expectedExternalBlockers.every((blocker) => actualExternalBlockers.includes(blocker)),
    hasOnlyExpectedExternalBlockers:
      options.expectNoBlocker ||
      actualExternalBlockers.every((blocker) => expectedExternalBlockers.includes(blocker)),
    hasExpectedAcceptanceCount:
      Number.isInteger(options.expectAcCount) && count === options.expectAcCount,
  };
  return {
    acceptanceCount: count,
    actualBlockers,
    actualExternalBlockers,
    expectedBlockers,
    expectedExternalBlockers,
    expectedAcceptanceCount: options.expectAcCount,
    expectations: { noBlocker: options.expectNoBlocker },
    forbiddenLiterals: unique(options.forbidLiterals ?? []),
    forbiddenPatterns: unique(options.forbidPatterns ?? []),
    checks,
    relationshipMode,
  };
}

export function validateLedger(body, options) {
  const checks = {
    ...commonBodyChecks(body, options),
    hasChildMap: body.includes("Child Issue Map"),
    hasBreakdownDecisions: body.includes("Breakdown decisions"),
    ...(options.expectStoryCoverage
      ? { hasStoryCoverage: body.includes("## Story coverage") }
      : {}),
    hasChildren: options.children.every((reference) => body.includes(reference)),
  };
  return {
    expectedChildren: unique(options.children),
    forbiddenLiterals: unique(options.forbidLiterals ?? []),
    forbiddenPatterns: unique(options.forbidPatterns ?? []),
    checks,
  };
}

function parseChecklistRows(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => /^\|.*\|$/.test(line.trim()))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length === 4)
    .filter((cells) => cells[0].toLowerCase() !== "slice")
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell)));
}

function resolveCoverageMappings(coverage, criteria) {
  const mappingPattern = /\bAC\s+(\d+)\s+-\s+"([^"]+)"/g;
  const mappings = [...coverage.matchAll(mappingPattern)].map((match) => {
    const ordinal = Number(match[1]);
    const acceptanceText = criteria[ordinal - 1]?.text ?? null;
    const excerpt = match[2];
    return {
      acceptanceText,
      excerpt,
      excerptMatches: acceptanceText != null && acceptanceText.includes(excerpt),
      ordinal,
    };
  });
  const remainder = coverage
    .replace(mappingPattern, "")
    .replace(/<br\s*\/?>|[;,\s]/gi, "");
  return { mappings, syntaxValid: mappings.length > 0 && remainder.length === 0 };
}

function validateAffectedSlice(rows, slice, path, options) {
  const body = readText(path);
  const criteria = acceptanceCriteria(body);
  const count = criteria.length;
  const sliceRows = rows.filter((row) => row[0] === slice);
  const actualItems = sliceRows.map((row) => row[1]);
  const missingItems = CHECKLIST_ITEMS.filter((item) => !actualItems.includes(item));
  const unexpectedItems = actualItems.filter((item) => !CHECKLIST_ITEMS.includes(item));
  const duplicateItems = unique(actualItems.filter((item, index) => actualItems.indexOf(item) !== index));
  const invalidCoverage = [];
  const invalidExcerpts = [];
  const invalidOrdinals = [];
  const missingCompositeComponents = [];
  const resolvedCoverage = [];

  for (const [, item, coverage, reason] of sliceRows) {
    const hasNa = /^N\/A - .+/.test(reason);
    if (hasNa) continue;
    const resolved = resolveCoverageMappings(coverage, criteria);
    if (!resolved.syntaxValid) invalidCoverage.push(item);
    for (const mapping of resolved.mappings) {
      resolvedCoverage.push({ item, ...mapping });
      if (mapping.acceptanceText == null) invalidOrdinals.push({ item, ordinal: mapping.ordinal });
      else if (!mapping.excerptMatches) {
        invalidExcerpts.push({
          acceptanceText: mapping.acceptanceText,
          excerpt: mapping.excerpt,
          item,
          ordinal: mapping.ordinal,
        });
      }
    }
    const resolvedText = unique(resolved.mappings
      .map((mapping) => mapping.acceptanceText)
      .filter((text) => text != null))
      .join("\n");
    const missing = (COMPOSITE_CHECKLIST_COMPONENTS.get(item) ?? [])
      .filter(([, pattern]) => !pattern.test(resolvedText))
      .map(([component]) => component);
    if (missing.length > 0) {
      missingCompositeComponents.push({ item, missing });
    }
  }

  const checks = {
    ...commonBodyChecks(body, options),
    hasAcceptanceItems: count > 0,
    hasExactRowCount: sliceRows.length === CHECKLIST_ITEMS.length,
    hasNoMissingItems: missingItems.length === 0,
    hasNoUnexpectedItems: unexpectedItems.length === 0,
    hasNoDuplicateItems: duplicateItems.length === 0,
    hasCoverageOrNa: invalidCoverage.length === 0,
    hasValidAcceptanceOrdinals: invalidOrdinals.length === 0,
    hasMatchingAcceptanceExcerpts: invalidExcerpts.length === 0,
    hasCompleteCompositeCoverage: missingCompositeComponents.length === 0,
  };
  return {
    acceptanceCount: count,
    checks,
    duplicateItems,
    invalidCoverage,
    invalidExcerpts,
    invalidOrdinals,
    missingItems,
    missingCompositeComponents,
    path,
    resolvedCoverage,
    slice,
    unexpectedItems,
  };
}

function validateUnaffectedSlice(rows, slice) {
  const sliceRows = rows.filter((row) => row[0] === slice);
  const expectedItem = "browser-visible guidance checklist";
  const checks = {
    hasSingleRow: sliceRows.length === 1,
    hasChecklistLabel: sliceRows[0]?.[1] === expectedItem,
    hasSpecificNaReason: /^N\/A - .+/.test(sliceRows[0]?.[3] ?? ""),
  };
  return { checks, rows: sliceRows, slice };
}

export function validateRunSheet(body, options) {
  const rows = parseChecklistRows(body);
  const onlySlices = new Set(options.onlySlices);
  const selectedSliceBodies = options.onlySlices.length === 0
    ? options.sliceBodies
    : options.sliceBodies.filter(({ slice }) => onlySlices.has(slice));
  const selectedUnaffectedSlices = options.onlySlices.length === 0
    ? options.unaffectedSlices
    : options.unaffectedSlices.filter((slice) => onlySlices.has(slice));
  const configuredSliceNames = new Set([
    ...options.sliceBodies.map(({ slice }) => slice),
    ...options.unaffectedSlices,
  ]);
  const missingOnlySlices = unique(options.onlySlices.filter((slice) => !configuredSliceNames.has(slice)));
  const selectedRows = options.onlySlices.length === 0
    ? rows
    : rows.filter((row) => onlySlices.has(row[0]));
  const affected = selectedSliceBodies.map(({ slice, path }) =>
    validateAffectedSlice(selectedRows, slice, path, options));
  const unaffected = selectedUnaffectedSlices.map((slice) => validateUnaffectedSlice(selectedRows, slice));
  const configuredSlices = new Set([
    ...selectedSliceBodies.map(({ slice }) => slice),
    ...selectedUnaffectedSlices,
  ]);
  const unconfiguredSlices = unique(selectedRows.map((row) => row[0]).filter((slice) => !configuredSlices.has(slice)));
  const checks = {
    ...commonArtifactChecks(body, options),
    hasRows: rows.length > 0,
    hasSelectedRows: options.onlySlices.length === 0 || selectedRows.length > 0,
    hasNoMissingOnlySlices: missingOnlySlices.length === 0,
    hasNoUnconfiguredSlices: unconfiguredSlices.length === 0,
    affectedSlicesPass: affected.every((report) => Object.values(report.checks).every(Boolean)),
    unaffectedSlicesPass: unaffected.every((report) => Object.values(report.checks).every(Boolean)),
  };
  return {
    affected,
    checklistItems: CHECKLIST_ITEMS,
    checks,
    forbiddenLiterals: unique(options.forbidLiterals ?? []),
    forbiddenPatterns: unique(options.forbidPatterns ?? []),
    missingOnlySlices,
    onlySlices: unique(options.onlySlices),
    rowCount: rows.length,
    selectedRowCount: selectedRows.length,
    unaffected,
    unconfiguredSlices,
  };
}

const main = () => {
  const { inputFile, mode, options } = parseArgs(process.argv.slice(2));
  const body = readText(inputFile);
  const details =
    mode === "child"
      ? validateChild(body, options)
      : mode === "ledger"
        ? validateLedger(body, options)
        : validateRunSheet(body, options);
  const failedChecks = Object.entries(details.checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  const report = { mode, inputFile, ...details, failedChecks };

  console.log(JSON.stringify(report, null, 2));
  if (failedChecks.length > 0) process.exit(1);
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
