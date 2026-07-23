// D3: prove the candidate's documented copy-ready structured accepted-residual
// record form clears the full --emit-preflight --mutation-ready gate in one shot.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { buildAcceptanceManifest } from "/home/joeloverbeck/projects/continuity-loom/.claude/skills/implement/scripts/build-acceptance-manifest.mjs";

const validator =
  "/home/joeloverbeck/projects/continuity-loom/.claude/skills/implement/scripts/validate-closeout-body.mjs";

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
const sha = "abcdef0123456789";

// EXACT copy-ready form as documented in the candidate (Residual findings header +
// bulleted block, one field per line, Axis exactly "Standards").
const residualBlock = `Residual findings:
- **Accepted residual**: Context-specific availability wording remains separate
  - **Axis**: Standards
  - **Source**: final Standards review
  - **Rationale**: the two consumers present different decisions and unifying them is out of scope
  - **Revisit trigger**: a third consumer appears`;

const rows = [
  `| #359 | AC1 - First exact behavior | ${evidence} | satisfied |`,
  `| #359 | AC2 - Second exact behavior with a continuation | ${evidence} | satisfied |`,
  `| #359 | Principles - Principles/ADR conformance for #359 | ${evidence} | satisfied |`
];

const body = `Implementation closeout

Final SHA: ${sha}
Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| \`node --test\` | passed - 3 tests | 1 | \`${sha}\` |

N/A because no tdd skill was invoked
Review frame: fixed point input HEAD~1; fixed point resolved SHA 1234567890abcdef; reviewed HEAD SHA ${sha}; diff command git diff HEAD~1...HEAD; commits one; worktree scope test; excluded dirty files none; spec source fixture.
Review: code-review against abcdef0; outcome accepted residuals recorded 1/final Standards review/intentional; unhandled findings none beyond accepted residuals; verification rerun node --test.
${residualBlock}
Principles/ADR conformance: no deliberate exceptions.
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
- Final SHA: ${sha}

Closeout gate passed: audit sink local test body.
`;

const manifest = buildAcceptanceManifest(issueInput);
const dir = mkdtempSync(join(tmpdir(), "d3-"));
const bodyPath = join(dir, "body.md");
const manifestPath = join(dir, "manifest.json");
writeFileSync(bodyPath, body);
writeFileSync(manifestPath, JSON.stringify(manifest));

const result = spawnSync(
  process.execPath,
  [
    validator,
    bodyPath,
    "--closing",
    "--expected-final-sha",
    sha,
    "--emit-preflight",
    "--mutation-ready",
    "--principles",
    "--acceptance-manifest",
    manifestPath
  ],
  { encoding: "utf8" }
);

console.log("EXIT:", result.status);
console.log("STDOUT:\n" + result.stdout);
if (result.stderr) console.log("STDERR:\n" + result.stderr);
