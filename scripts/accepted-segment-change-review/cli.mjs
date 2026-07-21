#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { loadGoldCorpus } from "./corpus.mjs";
import { evaluateComparison } from "./evaluator.mjs";
import { buildDryRunPlan, loadProtocol } from "./protocol.mjs";

const USAGE =
  "Usage: node scripts/accepted-segment-change-review/cli.mjs dry-run | evaluate --results <comparison-run.json>";

try {
  const output = await run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${errorMessage(error)}\n${USAGE}\n`);
  process.exitCode = 1;
}

async function run(args) {
  const [command] = args;
  if (command === "dry-run" && args.length === 1) {
    const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadProtocol()]);
    return buildDryRunPlan(corpus, protocol);
  }

  if (command === "evaluate" && args.length === 3 && args[1] === "--results") {
    const [corpus, protocol, comparisonRun] = await Promise.all([
      loadGoldCorpus(),
      loadProtocol(),
      readJson(args[2], "captured comparison run")
    ]);
    return evaluateComparison(corpus, comparisonRun, protocol);
  }

  throw new Error("Unsupported command. This offline tool only supports dry-run or evaluate.");
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
