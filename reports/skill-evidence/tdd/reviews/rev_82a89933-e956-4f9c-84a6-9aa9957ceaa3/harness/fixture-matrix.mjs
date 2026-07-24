// D2/D3 harness for rev_82a89933. Runs the frozen fixture matrix against both versions.
import { validateTddCloseoutBody as current } from "../../../../../../.claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs";
import { validateTddCloseoutBody as candidate } from "../candidate/scripts/validate-tdd-closeout-body.mjs";

const sha = "abcdef0123456789";
const aligned = "aligned because ADR 0001 and active principles authorize the seam";
const LEDGER_ERR = "output-derived result or count";

const bodyWith = (result) => `TDD evidence

Final SHA: ${sha}

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #1 | read | ${aligned} | red-first public workflow | \`pnpm test -- workflow-order\` failed because Pressure appeared before staging | \`pnpm test -- workflow-order\` passed and production browser observed Proposal then staging then Pressure | AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session | N/A |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm test -- workflow-order\` | ${result} | 1 | ${sha} |

Existing-test contract-change rows: none

TDD review-fix map: N/A because review created no TDD row changes

TDD closeout preflight:
- Durable sink/body inspected: test fixture
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- Pre-red evidence reference: issue #1 implementation ledger; anchor TDD preflight heading; chronology same-sink line order before first red command
- CONTEXT.md status: present
- ADRs/principles/docs status: ${aligned}
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

TDD evidence gate passed: durable sink test fixture; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status ${aligned}; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`;

const opts = { flags: ["--closing"], expectedFinalSha: sha };

// [trial, result cell, expected verdict on BOTH versions unless noted]
const FIXTURES = [
  ["T1", "passed 21 of 21; failed 0", "accept-on-candidate"],
  ["T1", "passed; all matched files use Prettier code style", "reject-both"],
  ["T2", "21 passed, 0 failed", "accept-on-candidate"],
  ["T2", "3 passing, 0 failing", "accept-on-candidate"],
  ["T2", "passed 21/21", "accept-on-candidate"],
  ["T2", "passed; exit 0", "accept-both"],
  ["T3", "focused tests passed", "reject-both"],
  ["T3", "all good", "reject-both"],
  ["T3", "tests were run", "reject-both"],
  ["T3", "looks fine", "reject-both"],
  ["T3", "passed", "reject-both"],
  ["T4", "passed: 2 files and 5 tests; exit 0", "accept-both"],
  ["T4", "passed: 1 file and 3 tests; exit 0", "accept-both"],
  ["T4", "blocked because the proof server port was owned by an unrelated process", "accept-both"],
  ["T5", "21 tests", "reject-both"],
  ["T5", "exit code", "reject-both"],
  ["T5", "<n> tests passed", "reject-both"],
  ["T5", "not applicable", "reject-both"],
  ["T5", "passed 0 of 0", "reject-both"],
  ["T5", "passed 0/0; failed 0", "reject-both"]
];

const verdict = (fn, result) => {
  const errors = fn(bodyWith(result), opts);
  return errors.some((e) => e.includes(LEDGER_ERR)) ? "reject" : "accept";
};

let mismatches = 0;
const rows = [];
for (const [trial, result, expected] of FIXTURES) {
  const cur = verdict(current, result);
  const can = verdict(candidate, result);
  let ok;
  if (expected === "reject-both") ok = cur === "reject" && can === "reject";
  else if (expected === "accept-both") ok = cur === "accept" && can === "accept";
  else ok = can === "accept"; // accept-on-candidate: candidate must accept; current recorded as-is
  if (!ok) mismatches += 1;
  rows.push(`${ok ? "OK  " : "FAIL"} | ${trial} | current=${cur} candidate=${can} | expected=${expected} | ${JSON.stringify(result)}`);
}
console.log(rows.join("\n"));

// D3: candidate message must name accepted forms; current is expected not to.
const msgOf = (fn) => (fn(bodyWith("verification claimed"), opts).find((e) => e.includes(LEDGER_ERR)) ?? "");
const curMsg = msgOf(current);
const canMsg = msgOf(candidate);
const namesForms = (m) => /exit 0/.test(m) && /passed/.test(m);
console.log("\nD3 current message names accepted forms:", namesForms(curMsg));
console.log("D3 candidate message names accepted forms:", namesForms(canMsg));
console.log("D3 candidate keeps pinned substring:", canMsg.includes("must contain an output-derived result or count"));
console.log("\nMISMATCHES:", mismatches);
