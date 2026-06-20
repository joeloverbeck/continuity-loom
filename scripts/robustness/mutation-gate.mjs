import { readFileSync } from "node:fs";

export const MUTANT_STATUSES = Object.freeze([
  "Killed",
  "Survived",
  "NoCoverage",
  "Timeout",
  "RuntimeError",
  "CompileError",
  "Ignored",
  "Pending"
]);

const DETECTED_STATUSES = new Set(["Killed"]);
const SCORE_EXCLUDED_STATUSES = new Set(["Ignored"]);

export function summarizeMutationReport(report, floor = null) {
  const statusTotals = Object.fromEntries(MUTANT_STATUSES.map((status) => [status, 0]));
  const files = report?.files;

  if (!files || typeof files !== "object") {
    throw new Error("Stryker report is missing a files object");
  }

  for (const file of Object.values(files)) {
    const mutants = file?.mutants;

    if (!Array.isArray(mutants)) {
      throw new Error("Stryker report file entry is missing a mutants array");
    }

    for (const mutant of mutants) {
      const status = mutant?.status;

      if (!MUTANT_STATUSES.includes(status)) {
        throw new Error(`Unsupported mutant status: ${String(status)}`);
      }

      statusTotals[status] += 1;
    }
  }

  const scoreDenominator = Object.entries(statusTotals)
    .filter(([status]) => !SCORE_EXCLUDED_STATUSES.has(status))
    .reduce((total, [, count]) => total + count, 0);
  const detected = Object.entries(statusTotals)
    .filter(([status]) => DETECTED_STATUSES.has(status))
    .reduce((total, [, count]) => total + count, 0);
  const score = scoreDenominator === 0 ? 100 : roundScore((detected / scoreDenominator) * 100);
  const gate = floor === null
    ? { floor: null, passed: true, reason: "advisory" }
    : {
        floor,
        passed: score >= floor,
        reason: score >= floor ? "score-meets-floor" : "score-below-floor"
      };

  return {
    statusTotals,
    mutationScore: score,
    scoreDenominator,
    gate
  };
}

export function readMutationReport(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function parseFloor(value) {
  if (value === undefined || value === "" || value === "null") {
    return null;
  }

  const floor = Number(value);

  if (!Number.isFinite(floor) || floor < 0 || floor > 100) {
    throw new Error(`Invalid mutation floor: ${value}`);
  }

  return floor;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , reportPath, floorArg] = process.argv;

  if (!reportPath) {
    console.error("Usage: node scripts/robustness/mutation-gate.mjs <mutation.json> [floor|null]");
    process.exit(2);
  }

  try {
    const summary = summarizeMutationReport(readMutationReport(reportPath), parseFloor(floorArg));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.gate.passed ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
