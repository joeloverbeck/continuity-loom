import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const corpusDir = new URL(".", import.meta.url).pathname;
const trialRootIndex = process.argv.indexOf("--trials");
const trialRoot = trialRootIndex >= 0 ? process.argv[trialRootIndex + 1] : null;
const tasks = [
  "task-01-large-multicontext",
  "task-02-small-concentrated",
  "task-03-wsl-report-open",
  "task-04-browser-render-fallback",
  "task-05-verify-before-promote",
  "task-06-design-brief-only",
  "task-07-load-bearing-rejection",
];

const failures = [];
for (const task of tasks) {
  for (const file of ["prompt.md", "input.md", "rubric.md"]) {
    const path = join(corpusDir, task, file);
    if (!existsSync(path) || readFileSync(path, "utf8").trim().length === 0) {
      failures.push(`missing or empty corpus artifact: ${task}/${file}`);
    }
  }
  if (trialRoot) {
    const output = join(trialRoot, task, "response.md");
    if (!existsSync(output) || readFileSync(output, "utf8").trim().length === 0) {
      failures.push(`missing or empty trial output: ${output}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`validated ${tasks.length} frozen tasks${trialRoot ? " and outputs" : ""}`);
