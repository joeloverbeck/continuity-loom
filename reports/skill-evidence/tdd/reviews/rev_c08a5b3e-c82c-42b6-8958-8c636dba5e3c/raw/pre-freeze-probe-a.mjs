import { validateTddCloseoutBody } from "/home/joeloverbeck/src/continuity-loom/.claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs";

const expectedFinalSha = "abcdef0123456789";
const alignedAuthority = "aligned because ADR 0001 and active principles authorize the seam";

const bodyWith = ({
  acceptance = "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session",
  green = "`pnpm test -- workflow-order` passed and production browser observed Proposal then staging then Pressure",
  authorityRow = alignedAuthority,
  authorityPreflight = alignedAuthority,
  authorityGate = alignedAuthority,
  atomMap = "all rows list authoritative atoms and proof surfaces",
  seqMap = "all rows list ordered proof or justified sequence N/A",
  current = "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png",
  historical = "fixture FAC-17 retained in the red row",
  superseded = "fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
  sweep = "N/A because every superseded category is none"
} = {}) => `TDD evidence

Final SHA: ${expectedFinalSha}

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #1 | read | ${authorityRow} | red-first public workflow | \`pnpm test -- workflow-order\` failed because Pressure appeared before staging | ${green} | ${acceptance} | N/A |

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
- ADRs/principles/docs status: ${authorityPreflight}
- Acceptance atom map: ${atomMap}
- Acceptance sequence map: ${seqMap}
- Partial-red / red-first skip reasons: none
- Evidence-only rows freshness: none
- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows
- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows
- Evidence identity refresh: same-sink current/historical-red/superseded identity block inspected
- Existing-test contract-change rows: none

Evidence identity refresh:
- Current evidence identities: ${current}
- Historical red identities retained: ${historical}
- Superseded evidence identities: ${superseded}
- Superseded-token sweep: ${sweep}

TDD evidence gate passed: durable sink test fixture; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status ${authorityGate}; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`;

const run = (label, opts) => {
  const errs = validateTddCloseoutBody(bodyWith(opts), { flags: ["--closing"], expectedFinalSha });
  console.log(`\n### ${label}\n  ${errs.length ? errs.join("\n  ") : "PASS (0 errors)"}`);
};

run("BASELINE", {});

// D-A: resolved authority disposition that mentions the word conflict / blocked
const a1 = "aligned because `docs/principles/FOUNDATIONS.md` §11 authorizes the blocker seam; no conflict with ADR-0003";
run("D-A1 aligned + 'no conflict with ADR-0003'", { authorityRow: a1, authorityPreflight: a1, authorityGate: a1 });
const a2 = "aligned because `docs/principles/FOUNDATIONS.md` §11 governs the blocked-demo inventory";
run("D-A2 aligned citing a 'blocked' domain noun", { authorityRow: a2, authorityPreflight: a2, authorityGate: a2 });
const a3 = "N/A because this documentation-only seam has no unresolved governing authority";
run("D-A3 N/A because ... 'no unresolved' authority", { authorityRow: a3, authorityPreflight: a3, authorityGate: a3 });

// D-B: atom/sequence map with equivalent wording
run("D-B1 'all acceptance-audit rows list ... atoms ... proof surfaces'", { atomMap: "all acceptance-audit rows list authoritative atoms and proof surfaces" });
run("D-B2 'every row lists authoritative atoms and proof surfaces'", { atomMap: "every row lists authoritative atoms and proof surfaces" });
run("D-B3 seq: 'every row lists ordered proof or a justified sequence N/A'", { seqMap: "every row lists ordered proof or a justified sequence N/A" });
run("D-B4 seq: 'all acceptance-audit rows list ordered proof or a justified sequence N/A'", { seqMap: "all acceptance-audit rows list ordered proof or a justified sequence N/A" });

// D-C: identity placeholder scan over legitimate citations
const c1 = "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts `reports/pending-review-notes.md`";
run("D-C1 artifact path containing 'pending'", { current: c1 });
const c2 = "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts golden prompt containing the `<audience_knowledge>` block";
run("D-C2 identity naming an angle-bracket domain token", { current: c2 });
