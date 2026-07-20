#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

function usage() {
  return `Usage:
  node .claude/skills/playtest/scripts/prepare-run.mjs \\
    --story-title <title> [--prior-report reports/<report>.md] [--repo-root <path>]

Creates a unique evidence directory plus a structured /tmp run root. For a new
story it proposes, but does not create, the project folder. For a continuation
it reads project_path from the supplied report and reports whether it exists.`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--story-title") args.storyTitle = argv[(index += 1)];
    else if (token === "--prior-report") args.priorReport = argv[(index += 1)];
    else if (token === "--repo-root") args.repoRoot = argv[(index += 1)];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

export function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "story";
}

export function timestampForId(date = new Date()) {
  return date
    .toISOString()
    .replace(/:/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function yamlScalar(frontmatter, key) {
  const line = frontmatter.split(/\r?\n/).find((candidate) => candidate.startsWith(`${key}:`));
  if (!line) return null;
  const raw = line.slice(line.indexOf(":") + 1).trim();
  if (!raw || raw === "null") return null;
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

function readPriorReport(repoRoot, priorReportInput) {
  const reportsRoot = resolve(repoRoot, "reports");
  const priorReport = resolve(repoRoot, priorReportInput);
  const reportsRelative = relative(reportsRoot, priorReport);
  if (
    reportsRelative === "" ||
    reportsRelative.startsWith(`..${sep}`) ||
    reportsRelative === ".." ||
    isAbsolute(reportsRelative)
  ) {
    throw new Error("Prior report must resolve to a file under reports/.");
  }
  if (!existsSync(priorReport) || !statSync(priorReport).isFile()) {
    throw new Error(`Prior report does not exist: ${priorReport}`);
  }

  const body = readFileSync(priorReport, "utf8");
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("Prior report has no readable YAML frontmatter.");

  const projectPath = yamlScalar(match[1], "project_path");
  const priorRunId = yamlScalar(match[1], "run_id");
  let continuationBlocker = null;

  if (!projectPath) {
    continuationBlocker = "prior-report-missing-project-path";
  } else {
    const tmpRelative = relative("/tmp", resolve(projectPath));
    if (
      !isAbsolute(projectPath) ||
      tmpRelative === "" ||
      tmpRelative === ".." ||
      tmpRelative.startsWith(`..${sep}`) ||
      isAbsolute(tmpRelative)
    ) {
      continuationBlocker = "prior-report-project-path-not-under-tmp";
    } else if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
      continuationBlocker = "continuation-project-missing";
    }
  }

  return {
    priorReport,
    priorReportRelative: relative(repoRoot, priorReport),
    priorRunId,
    projectPath,
    continuationBlocker
  };
}

export function prepareRun({
  storyTitle,
  priorReport,
  repoRoot = process.cwd(),
  now = new Date()
}) {
  if (typeof storyTitle !== "string" || storyTitle.trim() === "") {
    throw new Error("--story-title is required.");
  }

  const resolvedRoot = resolve(repoRoot);
  const storySlug = slugify(storyTitle);
  const timestamp = timestampForId(now);
  const reportStem = `playtest-${storySlug}-${timestamp}`;
  const reportPath = join(resolvedRoot, "reports", `${reportStem}.md`);
  const evidenceDir = join(resolvedRoot, "reports", "assets", reportStem);
  const runRoot = join("/tmp", "continuity-loom-playtest", reportStem);
  const continuation = priorReport ? readPriorReport(resolvedRoot, priorReport) : null;
  const projectParent = join("/tmp", "continuity-loom-playtest-projects");
  const projectFolderName = continuation ? null : `${storySlug}-${timestamp}`;
  const projectPath = continuation
    ? continuation.projectPath
    : join(projectParent, projectFolderName);

  for (const path of [reportPath, evidenceDir, runRoot, ...(continuation ? [] : [projectPath])]) {
    if (existsSync(path))
      throw new Error(`Run path already exists; refusing to overwrite: ${path}`);
  }

  const scratchpad = join(runRoot, "scratchpad.md");
  const shotsDir = join(runRoot, "shots");
  const exchangeDir = join(runRoot, "exchange");
  const browserScratchDir = join(runRoot, "browser");
  const appSessionDir = join(runRoot, "app");
  const configDir = join(runRoot, "config");

  mkdirSync(evidenceDir, { recursive: true });
  for (const directory of [
    shotsDir,
    exchangeDir,
    browserScratchDir,
    appSessionDir,
    configDir,
    projectParent
  ]) {
    mkdirSync(directory, { recursive: true });
  }

  const mode = continuation ? "continuation" : "new_story";
  const startedAt = now.toISOString();

  writeFileSync(
    scratchpad,
    `# Continuity Loom Playtest Scratchpad

## Run identity
- Run ID: ${reportStem}
- Mode: ${mode}
- Prior report: ${continuation?.priorReportRelative ?? "null"}
- Prior run ID: ${continuation?.priorRunId ?? "null"}
- Project path: ${projectPath ?? "null"}
- Continuation blocker: ${continuation?.continuationBlocker ?? "none"}
- Report path: ${relative(resolvedRoot, reportPath)}
- Evidence directory: ${relative(resolvedRoot, evidenceDir)}
- Scratch directory: ${runRoot}
- Started at: ${startedAt}
- Repository HEAD:
- Worktree baseline:

## Story intent
- Intended story:
- Intended next local segment:
- Intended stopping point:
- Intended characters and functions:
- Continuity and physical constraints:
- Knowledge, POV, and reveal constraints:
- Voice and prose expectations:
- Content boundaries:
- Non-goals / do not force:

## Pre-use expectations
- Expected first steps:
- Expected useful records:
- Expected private-note use:
- Expected working-set behavior:
- Expected Generation Brief work:
- Expected assistance:
- Sealed mental model:

## Quantitative journey ledger
- Status: inactive - activate only when the invocation requests counts or cost comparisons
- Requested boundaries: none
- Comparison / shortest-path question: none

| ID | Timestamp | Phase | Visible action | Kind | Field label / instance | Distinct field? | Successful write / selection? | Counted? | Exclusion reason |
| -- | --------- | ----- | -------------- | ---- | ---------------------- | --------------- | ----------------------------- | -------- | ---------------- |

### Quantitative boundary snapshots

| Boundary | Through action ID | Counted visible actions | Distinct authored fields | Successful writes / selections | Notes |
| -------- | ----------------- | ----------------------: | -----------------------: | -----------------------------: | ----- |

## Prompt ledger

## Generation Brief field-influence ledger

## Author journey observations

## Candidate and acceptance ledger

## Post-acceptance continuity ledger
`,
    "utf8"
  );

  return {
    runId: reportStem,
    reportStem,
    storyTitle: storyTitle.trim(),
    storySlug,
    mode,
    priorReport: continuation?.priorReport ?? null,
    priorReportRelative: continuation?.priorReportRelative ?? null,
    priorRunId: continuation?.priorRunId ?? null,
    continuationBlocker: continuation?.continuationBlocker ?? null,
    projectParent,
    projectFolderName,
    projectPath,
    reportPath,
    evidenceDir,
    runRoot,
    scratchpad,
    shotsDir,
    exchangeDir,
    browserScratchDir,
    appSessionDir,
    configDir,
    startedAt
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const prepared = prepareRun({
    storyTitle: args.storyTitle,
    priorReport: args.priorReport,
    repoRoot: args.repoRoot ?? process.cwd()
  });
  process.stdout.write(`${JSON.stringify(prepared, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n\n${usage()}\n`
    );
    process.exit(1);
  });
}
