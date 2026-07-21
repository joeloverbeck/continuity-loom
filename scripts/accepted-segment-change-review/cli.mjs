#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { loadGoldCorpus } from "./corpus.mjs";
import { evaluateComparison } from "./evaluator.mjs";
import { buildDryRunPlan, COMPARISON_ACTIVATION_AUTHORITY, loadProtocol } from "./protocol.mjs";

const USAGE =
  "Usage: node scripts/accepted-segment-change-review/cli.mjs readiness | live-smoke | dry-run | evaluate --results <comparison-run.json>\n" +
  "  readiness  New-candidate-only offline readiness bar over the eight adjudicated gold cases (the active activation floor).\n" +
  "  live-smoke Prepared, non-executing new-candidate-only live conformance smoke plan (execution owned by issue #148).\n" +
  "  dry-run / evaluate  Retired old-versus-new comparison tooling, kept as historical evidence only (no activation authority).";

try {
  const output = await run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (output && output.passed === false) {
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(`${errorMessage(error)}\n${USAGE}\n`);
  process.exitCode = 1;
}

async function run(args) {
  const [command] = args;

  if (command === "readiness" && args.length === 1) {
    // readiness.mjs imports the built @loom/core parser; load it lazily so the
    // retired comparison commands do not require a core build.
    const { runReadiness } = await import("./readiness.mjs");
    return runReadiness();
  }

  if (command === "live-smoke" && args.length === 1) {
    const { buildLiveSmokePlan, loadLiveSmokeProtocol } = await import("./live-smoke.mjs");
    const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadLiveSmokeProtocol()]);
    return buildLiveSmokePlan(corpus, protocol);
  }

  if (command === "dry-run" && args.length === 1) {
    const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
    return { ...buildDryRunPlan(corpus, protocol), activationAuthority: COMPARISON_ACTIVATION_AUTHORITY };
  }

  if (command === "evaluate" && args.length === 3 && args[1] === "--results") {
    const [corpus, protocol, comparisonRun] = await Promise.all([
      loadGoldCorpus(),
      loadProtocol(),
      readJson(args[2], "captured comparison run")
    ]);
    return { ...evaluateComparison(corpus, comparisonRun, protocol), activationAuthority: COMPARISON_ACTIVATION_AUTHORITY };
  }

  throw new Error(
    "Unsupported command. This offline tool supports readiness, live-smoke, dry-run, or evaluate."
  );
}

async function readJson(path, label) {
  if (typeof path !== "string" || path.trim().length === 0) {
    throw new Error(`${label} path must be nonblank.`);
  }
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read ${label}: ${errorMessage(error)}`, { cause: error });
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
