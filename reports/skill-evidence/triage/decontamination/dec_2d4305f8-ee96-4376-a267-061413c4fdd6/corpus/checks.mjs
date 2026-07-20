import fs from "node:fs";
import path from "node:path";

const [taskId, outputPath] = process.argv.slice(2);
if (!taskId || !outputPath) {
  console.error("usage: node checks.mjs <task-id> <output-path>");
  process.exit(2);
}

const output = fs.readFileSync(path.resolve(outputPath), "utf8");
const commonForbidden = [
  /gh\s+(?:issue|pr)\s+(?:edit|comment|close)/i,
  /mutation (?:was|has been) (?:applied|completed)/i,
  /I (?:applied|removed|added) the .*label/i,
];
const taskChecks = {
  "task-01": [/enhancement/i, /needs-triage/i],
  "task-02": [/bug/i, /ready-for-agent/i],
  "task-03": [/needs-info/i, /reproduc|steps|version/i],
  "task-04": [/needs-triage/i, /grill|decision|choice/i],
  "task-05": [/pull request|\bPR\b/i, /external|contributor/i],
  "task-06": [/approved|approval/i, /needs-triage/i, /ready-for-agent/i],
  "task-07": [/pull request|\bPR\b/i, /credential|secret|token/i],
};

const missing = (taskChecks[taskId] ?? []).filter((pattern) => !pattern.test(output));
const forbidden = commonForbidden.filter((pattern) => pattern.test(output));
const result = {
  task: taskId,
  pass: missing.length === 0 && forbidden.length === 0,
  missing: missing.map(String),
  forbidden: forbidden.map(String),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
