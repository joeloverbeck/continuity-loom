#!/usr/bin/env node
// Frozen fixture trials T1-T4. Runs one skill version's validator over identical inputs.
// Usage: node fixture-trials.mjs --skill <skill-root>

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const skillRoot = resolve(args[args.indexOf("--skill") + 1]);
const validator = join(skillRoot, "scripts/validate-closeout-body.mjs");
const { buildAcceptanceManifest } = await import(join(skillRoot, "scripts/build-acceptance-manifest.mjs"));

const issueInput = [
  {
    number: 359,
    title: "First slice",
    body: `## Acceptance criteria

- [ ] First exact behavior
- [x] Second exact behavior
  with a continuation

## Principles

- Follow the named principle.
`
  }
];

const evidence =
  "atoms: atomic; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs; sequence: N/A because criterion is not sequence-sensitive";
const expectedFinalSha = "abcdef0123456789";

const closeoutBody = (rows) => `Implementation closeout

Final SHA: ${expectedFinalSha}
Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| \`node --test\` | passed - 3 tests | 1 | \`${expectedFinalSha}\` |

N/A because no tdd skill was invoked
Review frame: fixed point input HEAD~1; fixed point resolved SHA 1234567890abcdef; reviewed HEAD SHA ${expectedFinalSha}; diff command git diff HEAD~1...HEAD; commits one; worktree scope test; excluded dirty files none; spec source fixture.
Review: code-review against abcdef0; outcome no findings; verification rerun node --test.
Browser evidence: N/A because process-only work changed no browser-consumed surface
Console state: N/A because browser evidence is N/A
Final freshness delta: N/A because browser evidence is N/A
Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
${rows.join("\n")}

Closeout body check passed: exact fields inspected.
Closeout preflight:
- Audit sink: local test body
- Final SHA: ${expectedFinalSha}

Closeout gate passed: audit sink local test body.
`;

const run = (rowEvidence) => {
  const manifest = buildAcceptanceManifest(issueInput);
  const body = closeoutBody([
    `| #359 | AC1 - First exact behavior | ${rowEvidence} | satisfied |`,
    `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
    `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
  ]);
  const directory = mkdtempSync(join(tmpdir(), "impl-trial-"));
  const bodyPath = join(directory, "body.md");
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(bodyPath, body);
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const result = spawnSync(
    process.execPath,
    [validator, bodyPath, "--closing", "--expected-final-sha", expectedFinalSha, "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });
  const stderr = result.stderr ?? "";
  return {
    exit: result.status,
    unresolved: /contains an unresolved value/.test(stderr),
    anchor: /proof surfaces must name a concrete test, command, path, route, URL, or tracker reference/.test(stderr),
    circular: /uses a circular atom or proof-surface reference/.test(stderr)
  };
};

const fixtures = [
  // T1 - reproduction of M-A: quoted literal test title containing gate vocabulary.
  ["T1", "atoms: census keeps a ready target; proof surfaces: .claude/skills/skill-evolution-status/scripts/status.test.mjs case \"a pending-cooldown gate state never removes a ready target from the census\"; sequence: N/A because criterion is not sequence-sensitive"],
  ["T1b", "atoms: census keeps a ready target; proof surfaces: .claude/skills/skill-evolution-status/scripts/status.test.mjs case `a pending-cooldown gate state never removes a ready target from the census`; sequence: N/A because criterion is not sequence-sensitive"],
  // T2 - reproduction of M-B: bare source file names as the only anchors.
  ["T2", "atoms: gate derivation; proof surfaces: evolution.mjs derives the gate and status.mjs:226 reads it; sequence: N/A because criterion is not sequence-sensitive"],
  // T3 - safety: genuine unresolved values must stay rejected.
  ["T3a", "atoms: exact behavior; proof surfaces: TODO; sequence: N/A because criterion is not sequence-sensitive"],
  ["T3b", "atoms: exact behavior; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs; sequence: pending"],
  ["T3c", "atoms: unknown; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs; sequence: N/A because criterion is not sequence-sensitive"],
  ["T3d", "atoms: browser surface; proof surfaces: .claude/skills/implement/scripts/validate-closeout-body.test.mjs, browser check pending; sequence: N/A because criterion is not sequence-sensitive"],
  // T4 - safety: vacuous or circular proof surfaces must stay rejected.
  ["T4a", "atoms: lifecycle start and stop; proof surfaces: verified locally by inspection; sequence: start then stop observed by the suite"],
  ["T4b", "atoms: lifecycle start and stop; proof surfaces: the tests pass; sequence: start then stop observed by the suite"],
  ["T4c", "atoms: lifecycle start and stop; proof surfaces: all named items; sequence: start then stop observed by the suite"]
];

const report = {};
for (const [id, rowEvidence] of fixtures) report[id] = run(rowEvidence);
console.log(JSON.stringify(report, null, 2));
