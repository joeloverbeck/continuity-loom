// D2 frozen verdict matrix — runs every plan case against both versions.
// Usage: node matrix.mjs <scripts-dir>
const dir = process.argv[2];
const { validateReviewSpecCoverage } = await import(`${dir}/review-evidence-contract.mjs`);
const { validateReviewNormalBody } = await import(`${dir}/validate-review-normal-body.mjs`);

const header = "| Issue | Acceptance source | Evidence reviewed | Findings/residuals |";
const manifest = { version: 1, issues: [{ number: 181, checks: [{ id: "AC1" }] }] };

const seqVerdict = (seq) => {
  const body = [
    "## Spec",
    "Findings: none",
    "",
    header,
    "|---|---|---|---|",
    `| #181 | AC1 enumerated; ${seq} | diff + tests | none |`,
    ""
  ].join("\n");
  const errors = [];
  validateReviewSpecCoverage(body, errors, { requireIssueSet: true, acceptanceManifest: manifest });
  return { ok: errors.length === 0, message: errors[0] ?? "" };
};

const identityBlock = `- **Evidence identity refresh**: refreshed after the final fix
- **Current evidence identities**: none
- **Historical red identities retained**: none
- **Superseded evidence identities**: none
- **Superseded-token sweep**: clean`;

const invBody = (std, spec) => `## Standards

Findings: none.

## Spec

Findings: none.
Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

- **Review subagents**: Standards reviewer standards-1 completed; Spec reviewer spec-1 completed
- **Review recovery**: none
- **Review subagent cleanup**: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion
- **Review subagent cleanup proof**: Standards reviewer standards-1 terminal status completed; no close primitive surfaced; Spec reviewer spec-1 terminal status completed; no close primitive surfaced
- **Pre-dispatch Standards source inventory**: ${std}
- **Pre-dispatch Spec source inventory**: ${spec}
- **Handoff Standards source inventory**: ${std}
- **Handoff Spec source inventory**: ${spec}
- **Axis summary**: Standards 0/none, Spec 0/none
- **Residual findings**: none
- **Parent PRD coverage**: parent PRD row present
- **Browser/manual evidence freshness**: N/A because no browser/manual evidence was used
- **Browser/manual console state**: N/A because no browser/manual evidence was used
- **Backend process currentness**: N/A because no browser/manual evidence was used
${identityBlock}
- **Review evidence line**: Review: code-review against abc1234; outcome no findings; verification rerun pnpm test.

Review: code-review against abc1234; outcome no findings; verification rerun pnpm test.
`;

const STD = "AGENTS.md | CLAUDE.md | smell baseline";
const invVerdict = (spec, std = STD) => {
  const errors = validateReviewNormalBody(invBody(std, spec)).filter((e) => /inventory/i.test(e));
  return { ok: errors.length === 0, message: errors[0] ?? "" };
};

const cases = [
  ["F1", "seq", "sequence: load -> save -> reload, covered by the four settings tests", "accept"],
  ["F2", "seq", "sequence: build -> inspect -> derive, exercised by the presenter regression tests", "accept"],
  ["F3", "seq", "sequence: request -> accept -> export, confirmed by the archive test suite", "accept"],
  ["F4", "seq", "sequence: classify -> present -> recover, proven by the workflow tests", "accept"],
  ["F5", "seq", "sequence: write -> read, traced in the request logs", "accept"],
  ["F6", "seq", "sequence: load -> save, shown by the sequence proof in the presenter suite", "accept"],
  ["F7", "inv", "issue #180 comment ID 5052198448", "accept"],
  ["S1", "seq", "sequence: load -> save -> reload", "reject"],
  ["S2", "seq", "sequence: settings load, compile, admit, observed by the settings test", "reject"],
  ["S3", "seq", "sequence: N/A", "reject"],
  ["S4", "seq", "sequence: TBD", "reject"],
  ["S5", "seq", "sequence: load -> save -> reload, it is fine", "reject"],
  ["S6", "inv", "issues #181-#183", "reject"],
  ["S7", "inv", "issue #180 comment ID abc", "reject"],
  ["S8", "invstd", "AGENTS.md, CLAUDE.md, smell baseline", "reject"],
  ["S9", "invstd", "AGENTS.md | CLAUDE.md", "reject"],
  ["P1", "seq", "sequence: load -> save -> reload, observed by the settings test", "accept"],
  ["P2", "seq", "sequence: N/A because the acceptance is not sequence-sensitive", "accept"],
  ["P3", "inv", "issue #180 comment 5052198448", "accept"],
  ["P4", "inv", "issue #180 | docs/specs/README.md", "accept"]
];

const rows = [];
for (const [id, kind, value, expected] of cases) {
  const v =
    kind === "seq" ? seqVerdict(value) : kind === "inv" ? invVerdict(value) : invVerdict("issue #1", value);
  rows.push({ id, verdict: v.ok ? "accept" : "reject", expected, message: v.message });
}
for (const r of rows) console.log(`${r.id}\t${r.verdict}\t(plan expects candidate: ${r.expected})`);

// D3 — message diagnosability
const seqMsg = seqVerdict("sequence: load -> save -> reload, it is fine").message;
const invMsg = invVerdict("issue #180 comment ID abc").message;
const namesSeqForms = /observed \/ asserted|using one of:/i.test(seqMsg);
const namesInvForms = /accepted forms are/i.test(invMsg);
console.log(`D3-seq-names-accepted-forms\t${namesSeqForms}`);
console.log(`D3-inv-names-accepted-forms\t${namesInvForms}`);
