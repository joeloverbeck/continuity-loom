import { validateTddCloseoutBody } from "/home/joeloverbeck/src/continuity-loom/.claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs";
const expectedFinalSha = "abcdef0123456789";
const A = "aligned because ADR 0001 and active principles authorize the seam";
const mk = (red, extra = (b) => b) => extra(`TDD evidence

Final SHA: ${expectedFinalSha}

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #1 | read | ${A} | red-first public workflow | ${red} | \`pnpm test -- workflow-order\` passed and production browser observed Proposal then staging then Pressure | AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session | N/A |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm test -- workflow-order\` | passed: 1 file and 3 tests; exit 0 | 1 | ${expectedFinalSha} |

Existing-test contract-change rows: none

TDD review-fix map: N/A because review created no TDD row changes

TDD closeout preflight:
- Durable sink/body inspected: test fixture
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- Pre-red evidence reference: issue #1 implementation ledger; anchor TDD preflight heading; chronology same-sink line order before first red command
- CONTEXT.md status: present
- ADRs/principles/docs status: ${A}
- Acceptance atom map: all rows list authoritative atoms and proof surfaces
- Acceptance sequence map: all rows list ordered proof or justified sequence N/A
- Partial-red / red-first skip reasons: none
- Evidence-only rows freshness: none
- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows
- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows
- Evidence identity refresh: same-sink current/historical-red/superseded identity block inspected
- Existing-test contract-change rows: none

Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png
- Historical red identities retained: fixture FAC-17 retained in the red row
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

TDD evidence gate passed: durable sink test fixture; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status ${A}; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`);
const run = (label, body) => {
  const e = validateTddCloseoutBody(body, { flags: ["--closing"], expectedFinalSha });
  console.log(`\n### ${label}\n  ${e.length ? e.join("\n  ") : "PASS"}`);
};
const RED = "`pnpm test -- workflow-order` failed because Pressure appeared before staging";
run("baseline", mk(RED));
// coverage-only phrasing variants
run("cov-1 canonical", mk("coverage-only existing behavior; red-first N/A because behavior already existed and no production code changed"));
run("cov-2 'the behavior already existed'", mk("coverage-only existing behavior; red-first N/A because the behavior already existed and no production code changed"));
run("cov-3 'red-first is N/A because behavior already existed'", mk("coverage-only existing behavior; red-first is N/A because behavior already existed and no production code changed"));
run("cov-4 'no production code changed; red-first N/A because behavior already existed'", mk("coverage-only existing behavior; no production code changed, so red-first N/A because behavior already existed"));
// freshness variants (needs browser evidence-only row? test the field alone)
const fresh = (v) => mk(RED, (b) => b.replace("- Evidence-only rows freshness: none", `- Evidence-only rows freshness: ${v}`));
run("fresh-1 canonical", fresh("browser smoke rerun passed on final tree for route/action/API/fixture Propagation with observed outcome ready"));
run("fresh-2 'reran the browser smoke on the final tree; observed outcome ready'", fresh("reran the browser smoke on the final tree for route /stories; observed outcome ready"));
run("fresh-3 'browser smoke re-executed on the final tree ... passed'", fresh("browser smoke re-executed on the final tree for route /stories and passed with observed outcome ready"));
run("fresh-4 'not affected' full form", fresh("not affected because changed path `packages/core/src/x.ts` is compiler-internal; evidence route/action/API/fixture /stories is untouched; targeted proof `npm test -- x` passed"));
// proof server preflight
const ps = (v) => mk(RED, (b) => b.replace("- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows", `- Evidence-only proof server preflight: ${v}`));
run("ps-1 doc example", ps("configured API/UI ports 4173 (single production port) plus dev 5173 and 5174; owner-check result all free; unrelated pre-existing owners none; configured ports verified free with no isolated proof-owned ports needed and no separate proxy/API base because the production server serves UI and API together on 127.0.0.1:4173; cleanup ownership stopped only the proof-owned npm start pid 1234"));
run("ps-2 'configured ports 4173 and 5173 were free'", ps("configured API/UI ports 4173 and 5173; owner-check result no owners; unrelated pre-existing owners none; both ports were free before the run; cleanup ownership stopped only the proof-owned pid 1234"));
