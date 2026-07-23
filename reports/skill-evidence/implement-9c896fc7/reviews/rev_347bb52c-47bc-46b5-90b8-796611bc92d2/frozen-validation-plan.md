# Frozen Validation Plan — rev_347bb52c-47bc-46b5-90b8-796611bc92d2

Frozen BEFORE any candidate exists. Target: `.claude/skills/implement`.
Baseline target hash: `b4857a8635d28a746cbb42f33a3713462b846d0591a71398b8eeabe4129e2f59`.

## Confirmed mechanism (from step 3)

No-immediate-fix accepted-residual closeout path. The builder
(`build-closeout-body.mjs`) emits only the placeholder
`Residual findings: <none or accepted residual records>`. To pass
`--mutation-ready` / `--emit-final-summary`, the author must hand-author
structured records in the exact two-line form:

```
Accepted residual: <title>
Axis: Standards        (or Spec)
```

The validator (`validate-closeout-body.mjs` `acceptedResidualRecords()`,
lines 300–342, 754–766) requires: (a) `Accepted residual:` on its own line;
(b) `Axis: Standards|Spec` on a *following* line within 12 lines; (c) if the
body contains the phrase "accepted residuals" but no such record exists, it
rejects with "final-summary emission found an accepted-residual claim without a
structured residual record" — so a parent rollup that only cites a child's
residuals fails.

This exact format is NOT shown as a copy-ready form anywhere:
- `review-evidence.md` shows only the immediate-fix **ledger** table and a prose
  placeholder `Residual findings: <remaining ... or none>`.
- `closeout-templates.md` "Validator-passing field examples" catalog explicitly
  scopes itself to fields "enforced by exact-token regexes in
  `tdd-evidence-contract.mjs` and `review-evidence-contract.mjs`" — NOT the
  implement validator's own residual parser.

Ownership: **target defect** (missing guidance). Distinct from rev_6d02b15c
(ordering, rejected) and rev_b0fd77f7 (zero-diff recipe, rejected).

## Change hypothesis (candidate to be built AFTER this plan is frozen)

Add one copy-ready structured accepted-residual record form to the existing
"Validator-passing field examples" catalog in `closeout-templates.md`, covering
the two-line `Accepted residual:` / `Axis: Standards|Spec` format and the rule
that a parent rollup must carry its own record (not cite the child's). Correct
the catalog's mis-scoped framing so it names the implement validator's residual
field too. Minimal, token-lean, no new recipe section, no narratives.

## Risk tier

**High.** The guidance governs external tracker actions (issue closeout) and a
convention (accepted-residual accounting) shared across the normal and fallback
review paths and the implement/review validator contracts. ≥5 paired trials.

## Paired trials (run version-blind, independent executors, minimal context)

Each executor receives ONLY the raw task + artifacts, never the diagnosis,
intended repair, expected answer, or which skill version they hold. Evaluators
receive concealed/randomized version labels.

### T1 — Reproduction (protects the demonstrated mechanism)
Task: produce a `--mutation-ready` single-issue GitHub closeout body for an
issue whose `code-review` ended with exactly **one accepted residual** (Standards
axis) that was intentionally **not fixed** (no immediate-fix, no finding ledger).
All other closeout fields are straightforward (code change present, verification
run, no browser, no Principles). 
Pass/compare rubric: (a) number of `validate-closeout-body.mjs`
rejection rounds to reach a passing `--emit-preflight --mutation-ready` body;
(b) whether the final body's residual record is in the validator-parsed form.
Frozen metric: candidate materially better = strictly fewer rejection rounds OR
current-skill executor fails to reach a correct structured record where the
candidate executor succeeds.

### T2 — Adjacent capability (parent-rollup residual, friction #4)
Task: parent PRD + one child, review ended with one accepted residual (Spec
axis); the parent rollup is the durable sink. Produce the `--mutation-ready`
parent body. 
Compare rubric: rejection rounds + whether the parent body carries its OWN
structured residual record (not merely a phrase citing the child).

### T3 — Core regression: immediate-fix ledger route (protects ledger path)
Task: single-issue closeout where two review findings were **fixed** via an
immediate-fix finding ledger (one row `accepted residual`, one `fixed`). Produce
the `--mutation-ready` body. 
Rubric: correct immediate-fix ledger (NOT the structured no-ledger record);
noninferior; candidate must not push the author toward the wrong route or
double-count.

### T4 — Core regression: no-residual clean close (protects no-residual path)
Task: single-issue closeout, review found **no** findings (`Residual findings:
none`). Produce the `--mutation-ready` body. 
Rubric: candidate must NOT induce a spurious structured residual record where
none exists; noninferior.

### T5 — Safety/edge: residual-integrity invariant (SEVERE if failed)
Task: a body that claims "accepted residuals" in prose but the executor is asked
whether it is mutation-ready; the correct outcome is that the validator STILL
rejects a bare claim without a real Standards/Spec-axis record, and rejects an
invalid axis. 
Rubric: candidate's copy-ready form must not let an author fabricate a passing
residual claim or bypass the Standards/Spec axis requirement; the validator's
rejection of a bare/invalid claim must be preserved. Any weakening = SEVERE
regression = automatic reject.

## Deterministic checks (run on candidate before landing)

- **D1** `node --test .claude/skills/implement/scripts/validate-closeout-body.test.mjs` passes (validator script MUST be unchanged; candidate is docs-only).
- **D2** `node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passes, incl. the guidance-conformance test that killed rev_6d02b15c.
- **D3** The candidate's copy-ready structured-record form, placed in a minimal no-ledger body, clears `--closing --expected-final-sha <sha> --emit-preflight --mutation-ready` in ONE shot (exit 0) — proves the form is validator-accurate.
- **D4** `diff -rq` isolated to the intended reference file(s) only; runtime size delta recorded (growth must be minimal).
- **D5** No script/`.mjs` byte changed (mechanism is guidance-only).

## Acceptance gate (applied from trial results alone)

Candidate passes ONLY if: resolves the mechanism on T1 (and T2); noninferior on
T3/T4; T5 safety invariant preserved; all deterministic checks pass; growth
necessary/minimal; and materially better on the mechanism rather than merely
worded differently. Behaviorally tied → keep the incumbent unless the candidate
is meaningfully smaller or clearer. A rejected candidate is not a license to
improvise another in this review.
