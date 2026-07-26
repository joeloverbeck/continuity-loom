// Frozen deterministic verdict matrix for skill-evolution review
// rev_c08a5b3e-c82c-42b6-8958-8c636dba5e3c.
// Usage: node verdict-matrix.mjs <path-to-validate-tdd-closeout-body.mjs>
// Prints one line per case: <id> <ACCEPT|REJECT> <first error or ->

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const validatorPath = process.argv[2];
if (!validatorPath) {
  console.error("usage: node verdict-matrix.mjs <validator.mjs>");
  process.exit(2);
}
const { validateTddCloseoutBody } = await import(pathToFileURL(resolve(validatorPath)).href);

const sha = "abcdef0123456789";
const A = "aligned because ADR 0001 and active principles authorize the seam";
const RED = "`pnpm test -- workflow-order` failed because Pressure appeared before staging";
const COV_OK =
  "coverage-only existing behavior; red-first N/A because behavior already existed and no production code changed";

const bodyWith = ({
  acceptance = "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session",
  green = "`pnpm test -- workflow-order` passed and production browser observed Proposal then staging then Pressure",
  red = RED,
  seam = "red-first public workflow",
  authorityRow = A,
  authorityPreflight = A,
  authorityGate = A,
  atomMap = "all rows list authoritative atoms and proof surfaces",
  seqMap = "all rows list ordered proof or justified sequence N/A",
  reviewFixMap = "TDD review-fix map: N/A because review created no TDD row changes",
  current = "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png",
  historical = "fixture FAC-17 retained in the red row",
  superseded = "fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
  sweep = "N/A because every superseded category is none",
  existingRows = "none"
} = {}) => `TDD evidence

Final SHA: ${sha}

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #1 | read | ${authorityRow} | ${seam} | ${red} | ${green} | ${acceptance} | N/A |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm test -- workflow-order\` | passed: 1 file and 3 tests; exit 0 | 1 | ${sha} |

Existing-test contract-change rows: ${existingRows}

${reviewFixMap}

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
- Existing-test contract-change rows: ${existingRows}

Evidence identity refresh:
- Current evidence identities: ${current}
- Historical red identities retained: ${historical}
- Superseded evidence identities: ${superseded}
- Superseded-token sweep: ${sweep}

TDD evidence gate passed: durable sink test fixture; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status ${authorityGate}; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows ${existingRows}.
`;

const withAuthority = (value) =>
  bodyWith({ authorityRow: value, authorityPreflight: value, authorityGate: value });

const browserBody = () =>
  bodyWith({ seam: "evidence-only browser route", red: "red-first skipped because the route is browser-visible only" })
    .replace(
      "- Evidence-only rows freshness: none",
      "- Evidence-only rows freshness: browser smoke rerun passed on final tree for route/action/API/fixture Propagation with observed outcome ready\n- Evidence-only browser console state: 0 errors and 0 warnings"
    )
    .replace(
      "- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows",
      "- Evidence-only proof server preflight: configured API/UI ports 4173 and 5173; owner-check result occupied; unrelated pre-existing owners PID 100 and PID 101; isolated proof-owned ports 4174 and 5174 with proxy aligned; cleanup ownership proof PIDs only"
    )
    .replace(
      "- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows",
      "- Evidence-only backend process currentness: server command npm start, no watch/reload mode; process/port ownership pid 1234 on 127.0.0.1:4173; restart proof: proof server restarted on the post-fix build; expected API behavior probe POST /api/segments returned accepted; N/A because no stateful fixture was copied"
    );

const reviewFixBody = () =>
  bodyWith({
    reviewFixMap: `TDD review-fix map:

| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |
|---|---|---|---|---|---|---|---|---|
| RF-1 | closeout citation wording | red-first skipped because Standards-only/conformance-only fix did not change behavior | \`pnpm typecheck\` passed: 1 check | #1 / red-first public workflow | N/A because the intended red was not a transient browser/manual probe | N/A because no UI/routes/browser-consumed API/fixtures/action path changed | N/A because no browser/manual proof was used | same-sink current/historical-red/superseded identity block inspected |`
  }).replace(" | N/A |\n\nVerification command ledger:", " | RF-1 - review fix |\n\nVerification command ledger:");

const reviewFixBodyWithCell = (cell) =>
  reviewFixBody().replace("\`pnpm typecheck\` passed: 1 check", cell);

const existingContractBody = () =>
  bodyWith({
    seam: "existing contract-change expectation",
    red: "existing contract-change expectation in `packages/core/src/compile.test.ts` because `npm test -- compile` failed with expected prompt header mismatch",
    existingRows: "compact row #1"
  });

const recoveryBody = () =>
  bodyWith()
    .replace(
      "Pre-red recovery status: N/A - pre-red preflight/table was visible before first red",
      "Pre-red recovery status: listed with TDD recovery addendum"
    )
    .replace(
      /- Pre-red evidence reference: .+\n/,
      "- Pre-red evidence reference: TDD recovery addendum in issue #1 implementation ledger; heading TDD recovery addendum\n"
    )
    .replace(
      "TDD closeout preflight:",
      `TDD recovery addendum:
- Missed pre-red gate inventory: TDD preflight and compact table were absent before first red
- Authoritative acceptance manifest recovery: issue #1 AC1 coverage reconstructed in the compact row above
- Issue/seam red-green reconstruction: issue #1 / red-first public workflow uses the red and green commands in the compact row above
- Final preservation sink: issue #1 implementation ledger; heading TDD recovery addendum

TDD closeout preflight:`
    );

const singleIssueManifest = {
  version: 1,
  issues: [
    { number: 1, title: "Single issue", checks: [{ id: "AC1", kind: "acceptance", text: "Exact workflow" }] }
  ]
};

const closing = { flags: ["--closing"], expectedFinalSha: sha };
const childFamily = {
  flags: ["--closing", "--child-family"],
  expectedFinalSha: sha,
  acceptanceManifest: singleIssueManifest
};

const cases = [
  // ---- Flip cases: conforming evidence the live target wrongly rejects ----
  ["F1", "authority: aligned + 'no conflict with ADR-0003'", withAuthority("aligned because `docs/principles/FOUNDATIONS.md` §11 authorizes the blocker seam; no conflict with ADR-0003"), closing],
  ["F2", "authority: aligned citing a 'blocked-demo' domain noun", withAuthority("aligned because `docs/principles/FOUNDATIONS.md` §11 governs the blocked-demo inventory"), closing],
  ["F3", "authority: N/A because no unresolved governing authority", withAuthority("N/A because this documentation-only seam has no unresolved governing authority"), closing],
  ["F4", "atom map: 'all acceptance-audit rows list ...'", bodyWith({ atomMap: "all acceptance-audit rows list authoritative atoms and proof surfaces" }), closing],
  ["F5", "atom map: 'every row lists ...'", bodyWith({ atomMap: "every row lists authoritative atoms and proof surfaces" }), closing],
  ["F6", "sequence map: 'every row lists ordered proof or a justified sequence N/A'", bodyWith({ seqMap: "every row lists ordered proof or a justified sequence N/A" }), closing],
  ["F7", "identity artifact filename containing 'pending'", bodyWith({ current: "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts `reports/pending-review-notes.md`" }), closing],
  ["F8", "identity naming a backticked angle-bracket domain token", bodyWith({ current: "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts golden prompt containing the `<audience_knowledge>` block" }), closing],
  ["F9", "coverage-only red cell: 'because the behavior already existed'", bodyWith({ red: "coverage-only existing behavior; red-first N/A because the behavior already existed and no production code changed" }), closing],
  ["F10", "coverage-only red cell: 'red-first is N/A because ...'", bodyWith({ red: "coverage-only existing behavior; red-first is N/A because behavior already existed and no production code changed" }), closing],

  // ---- Safety cases: must stay rejected on both versions ----
  ["S1", "authority: genuine unresolved conflict", withAuthority("conflict - blocked because FOUNDATIONS forbids the requested behavior"), closing],
  ["S2", "authority: presence-only 'read'", withAuthority("read"), closing],
  ["S3", "authority: approved amendment with no durable reference", withAuthority("approved amendment for the requested behavior"), closing],
  ["S4", "identity: unresolved <paths> placeholder", bodyWith({ current: "fixture paths <paths>; browser sessions none; packet paths/hashes none; active revisions none; artifacts none" }), closing],
  ["S5", "review-fix map cell literally TBD", reviewFixBodyWithCell("TBD"), closing],
  ["S6", "atom map: non-universal 'some rows'", bodyWith({ atomMap: "some rows list authoritative atoms and proof surfaces" }), closing],
  ["S7", "atom map: no quantifier", bodyWith({ atomMap: "rows list atoms" }), closing],
  ["S8", "coverage-only red cell with no reason clause", bodyWith({ red: "coverage-only existing behavior" }), closing],
  ["S9", "sequence map: 'most rows list ordered proof'", bodyWith({ seqMap: "most rows list ordered proof" }), closing],
  ["S10", "authority: bare 'aligned' with no basis", withAuthority("aligned"), closing],

  // ---- Preserved-pass cases: must stay accepted on both versions ----
  ["P1", "baseline single-issue closing body", bodyWith(), closing],
  ["P2", "canonical coverage-only red cell", bodyWith({ red: COV_OK }), closing],
  ["P3", "canonical atom and sequence maps", bodyWith({ atomMap: "all rows list authoritative atoms and proof surfaces", seqMap: "all rows list ordered proof or justified sequence N/A" }), closing],
  ["P4", "withheld structured fixture identity", bodyWith({ current: `fixture paths withheld because repository policy forbids machine-local paths; logical fixture LF-1; content SHA-256 ${"a".repeat(64)}; provenance generated by the fixture builder; browser sessions none; packet paths/hashes none; active revisions none; artifacts none` }), closing],
  ["P5", "browser evidence-only body", browserBody(), closing],
  ["P6", "existing contract-change expectation row", existingContractBody(), closing],
  ["P7", "recovery addendum body", recoveryBody(), closing],
  ["P8", "review-fix map body", reviewFixBody(), closing],
  ["P9", "child-family body with acceptance manifest", bodyWith({ acceptance: "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session" }), childFamily],
  ["P10", "all-none superseded inventory with terminal punctuation", bodyWith({ superseded: "fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none." }), closing]
];

for (const [id, label, body, options] of cases) {
  const errors = validateTddCloseoutBody(body, options);
  const verdict = errors.length ? "REJECT" : "ACCEPT";
  console.log(`${id}\t${verdict}\t${label}\t${errors[0] ?? "-"}`);
}
