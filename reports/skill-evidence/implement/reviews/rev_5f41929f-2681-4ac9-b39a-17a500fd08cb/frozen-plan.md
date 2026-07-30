# Frozen validation plan — rev_5f41929f-2681-4ac9-b39a-17a500fd08cb

Frozen before any candidate bytes existed. Target `.claude/skills/implement`, baseline hash
`ccd33707b0610dcf17d9f7b45115e7e7f22822b752f8b289e8b1d91cff6ce016`.

## Binding constraint

The `cost` incidents require a **truthful** closeout body whose real evidence values collide with a
brittle acceptance predicate in `scripts/validate-closeout-body.mjs`: a real artifact/fixture/session
identifier whose name contains `pending`/`unknown`/`todo`/`tbd`, or a real verification command whose
genuine success output does not contain the words `passed`/`failed`/`blocked`. Both conditions are
fully expressible in a fresh, short-context trial (supply the artifact names and the command output),
so the constraint is variable by the instrument. Run length and accumulated context are *not* the
binding constraint — the rejection is deterministic and reproduces on a 30-line body.

## Risk tier

**High.** The change edits acceptance predicates in a closeout validation gate (shared convention,
gate strength, multiple skills consume this validator's conventions). Minimum five paired trials,
mandatory vacuity guards, mandatory safety fixtures.

## Decisive instrument

**D1 — frozen deterministic accept/reject matrix (20 cases).** Declared decisive *before* the
candidate exists, because prior reviews of this skill family proved blind round-count collapses to a
tie when capable executors front-load the validator source (`rev_347bb52c`, `rev_82a89933`,
`rev_301fd08e`).

Pass condition for the candidate: **≥ 8 of the 10 FLIP cases move reject → accept, with zero SAFETY
case newly accepted and zero PRESERVED case newly rejected.** Current arm is expected to produce 0
flips; if the current arm accepts a FLIP case, the mechanism did not reproduce and the review closes
`monitor_for_recurrence`.

### Ordered tie-break (used only if D1 ties)

1. D1 (decisive, above)
2. **D2** — existing repo suites: `validate-closeout-body.test.mjs` + `build-closeout-body.test.mjs`
   + sibling `code-review` / `tdd` validator suites, run in a sibling-complete temp tree. Candidate
   must be ≥ current.
3. **Diagnosability pairing (T1–T3 blind)** — rejection rounds to a mutation-ready body.
4. **Runtime size** — smaller wins; growth only where the fix cannot be expressed by replacement.

### Hard vetoes (any one rejects the candidate outright)

- V1: any SAFETY case accepted by the candidate.
- V2: any PRESERVED case rejected by the candidate, or its output text changed.
- V3: any regression in D2 beyond the known pre-existing sibling failure.
- V4: any edit outside the two named predicates, their error messages, and a shared helper extracted
  for them. No opportunistic cleanup.
- V5: a widened gate shipped without a vacuity guard (a zero-work "success" must still be rejected).

## D1 matrix

All cases are a single-issue `--closing --expected-final-sha <sha> --acceptance-manifest` run over a
minimal valid body, varying exactly one field.

### FLIP — must be rejected by current, accepted by candidate

| ID | Field | Value |
|---|---|---|
| F1 | Current evidence identities | `fixture paths reports/skill-evidence/to-issues-0adcf2cd/decontamination/corpus/tasks/05-pending-source.md` (bare real repo path) |
| F2 | Current evidence identities | same path, backticked |
| F3 | Current evidence identities | ``artifacts `reports/skill-evidence/playtest-to-issues/decontamination/corpus/task-08-unknown-future-contract/rubric.md` `` |
| F4 | Superseded identities + sweep | superseded ``fixture paths `/tmp/pending-fixture.sqlite` ``, sweep quotes it verbatim |
| F5 | Superseded identities + sweep | superseded artifact `task-08-unknown-future-contract/rubric.md`, sweep quotes it verbatim |
| F6 | Verification row | `` `npm run typecheck` `` → `exit 0; no errors` |
| F7 | Verification row | `` `npm run lint` `` → `0 errors, 0 warnings` |
| F8 | Verification row | `` `npm test` `` → `21 passing` |
| F9 | Verification row | `` `npm run build` `` → `succeeded; 3 packages built` |
| F10 | Verification row | `` `node --test` `` → `ok - 43 tests, 0 failures` |

### SAFETY — must stay rejected on BOTH arms

| ID | Field | Value |
|---|---|---|
| S1 | Current evidence identities | `fixture paths TBD` |
| S2 | Current evidence identities | `browser sessions pending` (genuine unresolved status) |
| S3 | Superseded-token sweep | `TODO run the sweep` |
| S4 | Superseded identities | `active revisions unknown` |
| S5 | Verification row | result cell empty |
| S6 | Verification row | result `see above` |
| S7 | Verification row | result `0 passing` (vacuity guard) |
| S8 | Verification row | result `no tests found` (vacuity guard) |
| S9 | Verification row | result `<result>` (angle placeholder) |
| S10 | Satisfied audit row Evidence | bare `reports/pending-review-notes.md` — remains rejected, existing remedy message unchanged |

### PRESERVED — must stay accepted on BOTH arms, byte-identical stdout

| ID | Field | Value |
|---|---|---|
| R1 | baseline | clean all-none body |
| R2 | Verification row | `passed - 3 tests` |
| R3 | Verification row | `blocked - sandbox unavailable` |
| R4 | Current evidence identities | structured withheld-fixture identity form |
| R5 | Satisfied audit row Evidence | backticked `` `reports/pending-review-notes.md` `` (already-repaired sibling scan) |

## Paired trials

| Trial | Kind | Instrument |
|---|---|---|
| T1 | reproduction, blind paired | Author a mutation-ready closeout body for a task whose real evidence set includes a fixture path containing `pending`. Metric: rejection rounds to first passing `--emit-preflight --mutation-ready`. |
| T2 | adjacent, blind paired | Same capability, different shape: collision lands in the superseded-token sweep **and** the verification ledger carries a `typecheck` row whose real output is `exit 0; no errors`. |
| T3 | unrelated core regression, blind paired | Ordinary closeout body with no colliding identifiers and a `passed - N tests` row. Must validate on both arms; candidate must not add rounds. |
| T4 | safety/fragile, deterministic paired | D1 SAFETY block S1–S10 on both arms. |
| T5 | core regression, deterministic paired | D2 suites on both arms in a sibling-complete temp tree. |

### Blind-executor rules (T1–T3)

Executors receive only the raw authoring task, the target skill path in their staging tree, and the
artifacts. They are told: do not read `reports/skill-evidence/**` (it holds the incident bodies, this
diagnosis, and the candidate bytes), and are given no version label, no diagnosis, and no expected
answer. A staging tree is a sibling-complete copy of `.claude/skills` outside skill discovery, with
the arm's bytes at `implement/`. A location-only failure, or an executor that reached concealed
material, is a harness artifact: repair and rerun, never count.

### Evaluator independence

D1/D2 are deterministic and evaluated by exit status + stderr diff, not by judgment. T1–T3 are scored
only by counted rejection rounds recorded in the executor's own transcript output.
