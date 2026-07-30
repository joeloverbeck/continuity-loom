// D1 deterministic accept/reject matrix — frozen instrument for rev_5f41929f.
// Usage: node d1-matrix.mjs <path-to-validate-closeout-body.mjs> [--json]
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const validator = process.argv[2];
const asJson = process.argv.includes("--json");
const sha = "abcdef0123456789";

const cleanIdentity =
  "fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none";
const cleanEvidence =
  "atoms: atomic; proof surfaces: `scripts/x.test.mjs`; sequence: N/A because criterion is not sequence-sensitive";
const defaultRow = `| \`node --test\` | passed - 3 tests | 1 | \`${sha}\` |`;
const noneSweep = "N/A because every superseded category is none";

const body = ({
  current = cleanIdentity,
  superseded = cleanIdentity,
  sweep = noneSweep,
  verifyRow = defaultRow,
  evidence = cleanEvidence
}) => `Implementation closeout

Final SHA: ${sha}
Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
${verifyRow}

N/A because no tdd skill was invoked
Review frame: fixed point input HEAD~1; fixed point resolved SHA 1234567890abcdef; reviewed HEAD SHA ${sha}; diff command git diff HEAD~1...HEAD; commits one; worktree scope test; excluded dirty files none; spec source fixture.
Review: code-review against abcdef0; outcome no findings; verification rerun node --test.
Browser evidence: N/A because process-only work changed no browser-consumed surface
Console state: N/A because browser evidence is N/A
Final freshness delta: N/A because browser evidence is N/A
Evidence identity refresh:
- Current evidence identities: ${current}
- Historical red identities retained: none
- Superseded evidence identities: ${superseded}
- Superseded-token sweep: ${sweep}

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
| #1 | AC1 - does the thing | ${evidence} | satisfied |

Closeout body check passed: exact fields inspected.
Closeout preflight:
- Audit sink: local test body
- Final SHA: ${sha}

Closeout gate passed: audit sink local test body.
`;

const sweptSweep = (value) =>
  `\`rg -n "${value}" body.md\` - no hits outside classified identity/history lines and no active-proof hits; historical-red hits none`;
const supersededWith = (category, value) =>
  cleanIdentity.replace(`${category} none`, `${category} \`${value}\``);
const row = (command, result) => `| \`${command}\` | ${result} | 1 | \`${sha}\` |`;

const CASES = [
  // --- FLIP: expected reject on current, accept on candidate ---
  ["F1", "flip", { current: cleanIdentity.replace("fixture paths none", "fixture paths reports/skill-evidence/to-issues-0adcf2cd/decontamination/corpus/tasks/05-pending-source.md") }],
  ["F2", "flip", { current: supersededWith("fixture paths", "reports/skill-evidence/to-issues-0adcf2cd/decontamination/corpus/tasks/05-pending-source.md") }],
  ["F3", "flip", { current: supersededWith("artifacts", "reports/skill-evidence/playtest-to-issues/decontamination/corpus/task-08-unknown-future-contract/rubric.md") }],
  ["F4", "flip", { superseded: supersededWith("fixture paths", "/tmp/pending-fixture.sqlite"), sweep: sweptSweep("/tmp/pending-fixture.sqlite") }],
  ["F5", "flip", { superseded: supersededWith("artifacts", "reports/task-08-unknown-future-contract/rubric.md"), sweep: sweptSweep("reports/task-08-unknown-future-contract/rubric.md") }],
  ["F6", "flip", { verifyRow: row("npm run typecheck", "exit 0; no errors") }],
  ["F7", "flip", { verifyRow: row("npm run lint", "0 errors, 0 warnings") }],
  ["F8", "flip", { verifyRow: row("npm test", "21 passing") }],
  ["F9", "flip", { verifyRow: row("npm run build", "succeeded; 3 packages built") }],
  ["F10", "flip", { verifyRow: row("node --test", "ok - 43 tests, 0 failures") }],

  // --- SAFETY: must stay rejected on both arms ---
  ["S1", "safety", { current: cleanIdentity.replace("fixture paths none", "fixture paths TBD") }],
  ["S2", "safety", { current: cleanIdentity.replace("browser sessions none", "browser sessions pending") }],
  ["S3", "safety", { superseded: supersededWith("fixture paths", "/tmp/old.sqlite"), sweep: "TODO run the sweep" }],
  ["S4", "safety", { superseded: cleanIdentity.replace("active revisions none", "active revisions unknown") }],
  ["S5", "safety", { verifyRow: row("npm test", "") }],
  ["S6", "safety", { verifyRow: row("npm test", "see above") }],
  ["S7", "safety", { verifyRow: row("npm test", "0 passing") }],
  ["S8", "safety", { verifyRow: row("npm test", "no tests found") }],
  ["S9", "safety", { verifyRow: row("npm test", "<result>") }],
  ["S10", "safety", { evidence: "atoms: atomic; proof surfaces: reports/pending-review-notes.md; sequence: N/A because criterion is not sequence-sensitive" }],

  // --- PRESERVED: must stay accepted on both arms, identical stdout ---
  ["R1", "preserved", {}],
  ["R2", "preserved", { verifyRow: row("node --test", "passed - 3 tests") }],
  ["R3", "preserved", { verifyRow: row("npm run e2e", "blocked - sandbox unavailable") }],
  ["R4", "preserved", { current: "fixture paths withheld because the project store is private; logical fixture story-record-v4; content SHA-256 " + "a".repeat(64) + "; provenance generated by the test harness; browser sessions none; packet paths/hashes none; active revisions none; artifacts none" }],
  ["R5", "preserved", { evidence: "atoms: atomic; proof surfaces: `reports/pending-review-notes.md`; sequence: N/A because criterion is not sequence-sensitive" }]
];

const dir = mkdtempSync(join(tmpdir(), "d1-matrix-"));
const bodyPath = join(dir, "body.md");
const manifestPath = join(dir, "manifest.json");
writeFileSync(manifestPath, JSON.stringify({ version: 1, issues: [{ number: 1, checks: [{ id: "AC1", text: "does the thing" }] }] }));

const results = [];
for (const [id, kind, opts] of CASES) {
  writeFileSync(bodyPath, body(opts));
  const run = spawnSync(
    process.execPath,
    [validator, bodyPath, "--closing", "--expected-final-sha", sha, "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  results.push({
    id,
    kind,
    accepted: run.status === 0,
    stdout: (run.stdout ?? "").replace(bodyPath, "<body>").trim(),
    stderr: (run.stderr ?? "").replace(bodyPath, "<body>").trim()
  });
}
rmSync(dir, { recursive: true, force: true });

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`${r.id}\t${r.kind}\t${r.accepted ? "ACCEPT" : "REJECT"}\t${r.accepted ? "" : r.stderr.split("\n").slice(1).join(" || ")}`);
  }
}
