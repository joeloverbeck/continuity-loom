import { existsSync } from "node:fs";
import { spawnSync, execFileSync } from "node:child_process";
import { readMutationReport, summarizeMutationReport } from "./mutation-gate.mjs";

const ADVERSE_STATUSES = Object.freeze(["Survived", "NoCoverage", "Timeout", "RuntimeError", "Pending"]);

export const PILLARS = Object.freeze({
  prose: {
    config: "stryker.prose.config.mjs",
    report: "reports/mutation/prose/mutation.json",
    cache: ".cache/stryker/prose.json"
  },
  ideation: {
    config: "stryker.ideation.config.mjs",
    report: "reports/mutation/ideation/mutation.json",
    cache: ".cache/stryker/ideation.json"
  },
  validation: {
    config: "stryker.validation.config.mjs",
    report: "reports/mutation/validation/mutation.json",
    cache: ".cache/stryker/validation.json"
  }
});

export function classifyChangedPaths(paths, options = {}) {
  const normalizedPaths = [...new Set(paths.map(normalizePath).filter(Boolean))].sort();
  const cacheExists = options.cacheExists ?? ((path) => existsSync(path));

  if (normalizedPaths.some(isFullCampaignTrigger)) {
    return {
      status: "in-scope",
      reason: "robustness-infrastructure-change",
      changedPaths: normalizedPaths,
      campaigns: Object.keys(PILLARS).map((pillar) => campaignPlan(pillar, [], cacheExists))
    };
  }

  const mutateByPillar = new Map();
  for (const path of normalizedPaths) {
    const pillar = pillarForSourcePath(path);
    if (!pillar) {
      continue;
    }

    const targets = mutateByPillar.get(pillar) ?? new Set();
    targets.add(path);
    mutateByPillar.set(pillar, targets);
  }

  const campaigns = [...mutateByPillar.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([pillar, targets]) => campaignPlan(pillar, [...targets].sort(), cacheExists));

  return campaigns.length === 0
    ? {
        status: "out-of-scope",
        reason: "no locked-pillar source or robustness-infrastructure changes",
        changedPaths: normalizedPaths,
        campaigns: []
      }
    : {
        status: "in-scope",
        reason: "locked-pillar-source-change",
        changedPaths: normalizedPaths,
        campaigns
      };
}

export function buildStrykerArgs(campaign) {
  const args = ["stryker", "run", PILLARS[campaign.pillar].config, "--force"];

  if (campaign.mutate.length > 0) {
    args.push("--mutate", campaign.mutate.join(","));
  }

  return args;
}

export function adverseStatusTotals(summary) {
  return Object.fromEntries(
    ADVERSE_STATUSES
      .map((status) => [status, summary.statusTotals[status] ?? 0])
      .filter(([, count]) => count > 0)
  );
}

function campaignPlan(pillar, mutate, cacheExists) {
  const cache = PILLARS[pillar].cache;
  return {
    pillar,
    config: PILLARS[pillar].config,
    report: PILLARS[pillar].report,
    cache,
    cacheHit: cacheExists(cache),
    mutate
  };
}

function isFullCampaignTrigger(path) {
  return path === "package.json" ||
    path === "package-lock.json" ||
    path === "vitest.config.ts" ||
    path === "tsconfig.json" ||
    path === "stryker.prose.config.mjs" ||
    path === "stryker.ideation.config.mjs" ||
    path === "stryker.validation.config.mjs" ||
    path.startsWith("scripts/robustness/") ||
    path.startsWith("packages/core/test/support/");
}

function pillarForSourcePath(path) {
  if (path.startsWith("packages/core/src/validation/") && path.endsWith(".ts")) {
    return "validation";
  }

  if (
    (path.startsWith("packages/core/src/compiler/ideation/") ||
      path === "packages/core/src/compiler/sections/ideation.ts") &&
    path.endsWith(".ts")
  ) {
    return "ideation";
  }

  if (path.startsWith("packages/core/src/compiler/") && path.endsWith(".ts")) {
    return "prose";
  }

  return null;
}

function normalizePath(path) {
  return path.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function changedPathsFromGit() {
  const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "HEAD~1";
  const output = execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`], { encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    dry: false,
    json: false,
    changed: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry") {
      args.dry = true;
      continue;
    }

    if (arg === "--json") {
      args.json = true;
      continue;
    }

    if (arg === "--changed") {
      args.changed = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function splitChanged(value) {
  return value.split(/[\s,]+/).filter(Boolean);
}

function printPlan(plan, json) {
  if (json) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (plan.status === "out-of-scope") {
    console.log(`mutation-changed: ${plan.reason}`);
    return;
  }

  console.log(`mutation-changed: ${plan.reason}`);
  for (const campaign of plan.campaigns) {
    const scope = campaign.mutate.length === 0 ? "full campaign" : campaign.mutate.join(", ");
    const cache = campaign.cacheHit ? "cache hit" : "cache miss; forced fallback";
    console.log(`- ${campaign.pillar}: ${scope} (${cache})`);
  }
}

function runCampaign(campaign) {
  const args = buildStrykerArgs(campaign);
  const result = spawnSync("npx", args, { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`${campaign.pillar} mutation command failed with status ${result.status ?? "unknown"}`);
  }

  const summary = summarizeMutationReport(readMutationReport(campaign.report), null);
  const adverse = adverseStatusTotals(summary);

  if (Object.keys(adverse).length > 0) {
    throw new Error(`${campaign.pillar} mutation report contains adverse statuses: ${JSON.stringify(adverse)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const changedPaths = args.changed === null ? changedPathsFromGit() : splitChanged(args.changed);
  const plan = classifyChangedPaths(changedPaths);

  printPlan(plan, args.json);

  if (args.dry || plan.status === "out-of-scope") {
    return;
  }

  for (const campaign of plan.campaigns) {
    runCampaign(campaign);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
