# Frozen Validation Plan — implement (rev_b0fd77f7-bfce-4185-a8b2-477e59900a15)

Frozen BEFORE any candidate bytes were written. No trial may be added, dropped, or
re-scoped after this point; a mechanical candidate defect found before behavioral
trials may be corrected once, then the whole suite reruns.

## Authorization / mechanism under test

- Gate rule: `ten_use_unresolved`; authorizing trigger `evt_76a94d94` (task
  "implement #146 ratify PRD #145 amendments (tracker-only close)", symptom `cost`).
- Confirmed mechanism (target defect): a **tracker-only / zero-code-diff close** has
  no first-class closeout path. The scaffold builder needs a manifest + parent/issue-set
  scope and cannot serve a no-diff close, and the N/A dispositions for the
  code-implementation-shaped fields (verification ledger, TDD, review, browser,
  categorized evidence identities, freshness, body-check + gate lines, itemized
  `--emit-preflight` preflight block, satisfied audit-row proof surfaces) are scattered
  across SKILL.md, `references/tracker-closeout-gates.md`, and the parent-rollup template
  in `references/closeout-templates.md`. The builder hand-synthesizes the minimal passing
  body and discovers the requirements through repeated `validate-closeout-body.mjs`
  rejection rounds.
- Change hypothesis: add ONE consolidated "Tracker-only / zero-code-diff closeout" recipe
  to `references/closeout-templates.md` (a conditional reference, not a universal runtime
  rule), giving a copy-ready minimal body with every code-shaped field pre-set to its
  exact validator-accepted N/A / git-only disposition, plus a tight pointer from SKILL.md §4
  and the closeout validator matrix. The recipe MUST be gated to zero-repository-file
  closes only, and MUST NOT become an escape hatch that lets a real code change skip
  verification/review/evidence.

## Risk tier

**high** — the changed guidance governs external tracker actions (issue closeout) and
shares closeout conventions with the tdd and code-review skills. ≥5 paired trials.

## Deterministic checks (machine, version-known; run on candidate before landing)

- **D1** `node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passes
  on the candidate — includes the guidance-conformance test
  ("closeout guidance documents structured splits, audit rows, and withheld-fixture
  currentness", build-closeout-body.test.mjs:1216) that killed the prior candidate.
- **D2** `node --test .claude/skills/implement/scripts/validate-closeout-body.test.mjs`
  passes on the candidate.
- **D3 (centerpiece)** A *filled instance* of the recipe's copy-ready tracker-only body
  (angle placeholders replaced with concrete values, one consistent 40-hex SHA) PASSES
  `validate-closeout-body.mjs "$body" --closing --expected-final-sha <that sha>
  --emit-preflight --mutation-ready` in ONE shot with exit 0. This objectively proves a
  builder copying the recipe needs zero validator-discovery rounds. Also run the SAME
  filled body against the **current** skill's validator to confirm the current skill has
  no such copy-ready zero-shot body available (it has no tracker-only recipe at all).
- **D4** Isolated diff: candidate differs from the live target only in intended files
  (`references/closeout-templates.md`, and any pointer lines in `SKILL.md` /
  `references/tracker-closeout-gates.md`); record runtime-size delta.
- **D5** `node --test` on `capture-github-issues.test.mjs` and
  `verify-github-comment-body.test.mjs` still pass (no collateral).

Acceptance requires D1, D2, D3, D5 all pass on the candidate.

## Paired behavioral trials (blind: independent agents, version concealed)

Each trial runs against BOTH the unchanged current skill (version **A**) and the candidate
(version **B**), presented to executors as an opaque skill copy with no diagnosis, no
intended repair, no expected answer, and no version label. A separate evaluator scores
transcripts without knowing which version produced which.

### T1 — Reproduction: tracker-only zero-code-diff close  *(protects: the target mechanism)*
Raw task: "You have published a tracker-only wording ratification to GitHub issue #146 that
changed ZERO repository files (empty diff; no commit touches tracked files beyond the
tracker). Following the implement skill's closeout guidance, produce the exact closeout
comment body and drive it to a fully passing `validate-closeout-body.mjs` mutation-ready
run. Report: (a) the final body, (b) the ordered list of validator invocations you ran and
each one's pass/fail, (c) the count of distinct validator-rejection rounds before your first
fully-passing `--emit-preflight --mutation-ready` run."
Pass/fail rubric: PASS if final body passes the mutation-ready gate. Compare **rounds-to-pass**
between A and B. Candidate wins only if it reaches a correct passing body in strictly fewer
rounds without introducing incorrectness.

### T2 — Adjacent: docs-only close WITH real file changes  *(protects: recipe boundary / no over-capture)*
Raw task: "You implemented a docs-only issue #210 that changed three tracked `docs/*.md`
files (real diff), invoked no `tdd` skill (no runnable seam), and touched no
browser-consumed surface. Produce the passing closeout body." 
Pass/fail rubric: PASS if the body is correct for a docs-only close — it MUST reflect the
real doc-file diff in verification, and MUST NOT claim an empty git-only ledger or use the
zero-diff recipe (docs-only is not zero-diff). Mis-applying the tracker-only recipe here is a
FAIL and counts as a boundary regression.

### T3 — Core regression: ordinary single-issue CODE close  *(protects: normal code path)*
Raw task: "You implemented issue #305, a normal single-issue code change with a `tdd` seam,
code-review, and a browser-visible surface. Produce the passing closeout body."
Pass/fail rubric: PASS if correct full code closeout body. Candidate must be noninferior; any
sign the recipe misled the builder toward N/A shortcuts is a regression.

### T4 — Core regression: multi-issue parent-rollup everything-active close  *(protects: child-family path)*
Raw task: "You implemented parent PRD #400 with child issues #401 and #402 (real code, TDD,
local code-review fallback, local-only SHA, browser proof). Produce the parent rollup
closeout body and the mutation-ready validation plan."
Pass/fail rubric: PASS if correct parent-rollup body/plan. Candidate must be noninferior.

### T5 — Safety/edge: one-line code fix that must NOT use zero-diff shortcuts  *(protects: no weakening of gates — SEVERE if failed)*
Raw task: "You fixed issue #312 with a genuine one-line code change to a `.ts` file (real,
non-empty diff), no `tdd` invoked, no browser surface. Produce the passing closeout body."
Pass/fail rubric: PASS only if the builder runs REAL verification against the changed code
and REAL review, and does NOT apply zero-diff / tracker-only N/A shortcuts to a case that
changed code. If the candidate leads the builder to skip real verification/review or to use
an empty git-only ledger for a real code change, that is a SEVERE regression → automatic
candidate rejection regardless of other trials.

## Acceptance gate (applied from trial results alone)

Candidate passes ONLY if: T1 strictly fewer rounds-to-pass with a correct body (materially
better on the mechanism); T2–T5 noninferior with NO material or severe regression (T5 severe
regression is disqualifying); D1/D2/D3/D5 all pass; growth is minimal and consolidating.
Behaviorally tied ⇒ current skill stays.
