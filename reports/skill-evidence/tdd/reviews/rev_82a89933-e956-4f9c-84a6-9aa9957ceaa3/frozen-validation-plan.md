# Frozen validation plan — rev_82a89933-e956-4f9c-84a6-9aa9957ceaa3

Frozen before any candidate existed. Target: `.claude/skills/tdd`, baseline hash
`810a4c9e7311539dce37634ded37e73dfb61e6fb78aabd266b896914b9611395`.

## Implicated mechanism (from the authorized packet)

`validate-tdd-closeout-body.mjs:350-357` gates each verification-command-ledger row on
`hasObservedOutcome && hasOutputDetail`. `hasOutputDetail` accepts only `exit <digits>` or
`<digits> <unit-noun>`, so genuinely output-derived counts in the shapes real runners print
(`passed 21 of 21; failed 0`, `21 passed, 0 failed`, `passed 21/21`, `3 passing`) are rejected.
The single emitted message — `verification command ledger row N must contain an output-derived
result or count` — names neither which half failed nor any accepted form.

## Risk tier

Escalated: the change alters a validation gate protecting durable verification evidence.
Five paired trials, including an added core-regression case and a safety-boundary case.

## Paired trials (each runs on unchanged current AND candidate)

### T1 — Fresh reproduction of the implicated mechanism (blind, behavioral)
- Raw task: independent agent receives real command transcripts (Vitest-style
  `Tests  21 passed (21)` for four commands, plus `prettier --check` output
  `All matched files use Prettier code style!`), a closing TDD closeout body skeleton whose
  verification ledger is empty, and the validator path. Instruction: fill the ledger from the
  transcripts and run the validator until it passes.
- Withheld: the diagnosis, the intended repair, which version they hold, that a defect exists.
- Observable metric: (a) count of validator-rejection rounds before pass; (b) fidelity — does
  the passing row still carry the observed failure count (`failed 0`) from the transcript?
- Pass rubric for candidate: strictly fewer rejection rounds, OR equal rounds with strictly
  higher output fidelity (observed counts preserved rather than reshaped away).
- Protects: the incident behavior itself.

### T2 — Adjacent case, same capability exercised differently (blind, behavioral)
- Raw task: same shape, different runner vocabulary — Mocha `3 passing (12ms)` /
  `0 failing`, plus `tsc --noEmit` that prints nothing and exits 0.
- Observable metric: rejection rounds to a passing ledger.
- Protects: generalization beyond the exact incident strings.

### T3 — Core regression: gate integrity against prose claims (deterministic)
- Inputs: ledger result cells `focused tests passed`, `all good`, `tests were run`,
  `looks fine`, `passed`.
- Required on BOTH versions: rejected. The documented rule "a prose claim such as
  `focused tests passed` is not durable verification" must survive unchanged.
- Protects: the durable-verification invariant the gate exists for.

### T4 — Core regression: documented happy path and unrelated row checks (deterministic)
- Inputs: the documented example `passed: 2 files and 5 tests; exit 0`; a complete valid
  closing body; rows violating column count, run count, and represented-SHA rules.
- Required on BOTH versions: identical verdicts and identical messages for every unrelated
  check.
- Protects: everything in the ledger check other than the implicated predicate.

### T5 — Safety boundary: widening must open no hole (deterministic)
- Inputs: `21 tests` (count, no outcome word), `exit code` (no digit), `<n> tests passed`
  (unresolved placeholder), `not applicable` (no reason), `` (empty),
  `passed 0 of 0` (vacuous claim of nothing run).
- Required on BOTH versions: rejected.
- Protects: against the candidate degrading the gate into an outcome-word-only check.

## Deterministic checks

- **D1**: `node --test .claude/skills/tdd/scripts/validate-tdd-closeout-body.test.mjs` on both
  versions. Baseline is 58 tests / 57 pass / 1 fail — the pre-existing failure
  `guidance carries sink, snapshot, exactness, and shared closeout contracts` (expects
  `docs/robustness-testing.md` in SKILL.md), unrelated to this mechanism and out of scope.
  Requirement: candidate's failure set must be a subset of baseline's; no new failure.
- **D2**: fixture accept/reject matrix over the T1-T5 result strings, executed against both
  versions' `validateBody` path via the real CLI.
- **D3**: for a genuinely non-compliant row, the candidate's message must name the accepted
  forms (the "without naming the missing token" half of the incident). Current version is
  expected to fail D3; that is the point of D3, not a regression.

## Evaluator independence

Blind executors receive only the raw task, the transcripts, and a validator path. Version
identity is concealed; no executor is told a defect exists or what shape a fix would take.
Deterministic checks are version-labelled only in the recording harness, not in any prompt.

## Abort condition

If the candidate cannot resolve T1 without failing T3 or T5, the acceptance gate fails and the
review closes `candidate_rejected_validation` with the live target untouched.
