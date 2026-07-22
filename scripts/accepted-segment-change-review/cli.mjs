#!/usr/bin/env node

import { loadGoldCorpus } from "./corpus.mjs";

const USAGE =
  "Usage: node scripts/accepted-segment-change-review/cli.mjs readiness | live-smoke\n" +
  "  readiness  New-candidate-only offline readiness bar over the eight adjudicated gold cases (the active activation floor).\n" +
  "  live-smoke Prepared, non-executing new-candidate-only live conformance smoke plan.";

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
    // command surface can be inspected without a core build.
    const { runReadiness } = await import("./readiness.mjs");
    return runReadiness();
  }

  if (command === "live-smoke" && args.length === 1) {
    const { buildLiveSmokePlan, loadLiveSmokeProtocol } = await import("./live-smoke.mjs");
    const [corpus, protocol] = await Promise.all([loadGoldCorpus(), loadLiveSmokeProtocol()]);
    return buildLiveSmokePlan(corpus, protocol);
  }

  throw new Error("Unsupported command. This offline tool supports readiness or live-smoke.");
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
