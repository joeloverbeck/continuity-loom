# Frozen validation plan — rev_c08a5b3e-c82c-42b6-8958-8c636dba5e3c

Frozen before any candidate existed. Target: `.claude/skills/tdd`, baseline hash
`ffcebc988a4b83eec8a90456886feadce857d3ebc7715c01a262fe312e43ee93`.

## Confirmed mechanism under test

The TDD closeout validator's acceptance predicates gate on brittle literal token
sequences and whole-field keyword scans instead of on the requirement they enforce, so
semantically-correct, fully-conforming evidence is rejected; and several rejection
messages name no accepted form or name the wrong one, so the author cannot recover from
the message and must reread validator source or guess-and-rerun.

Confirmed instances (all reproduced against the live target before freezing — see
`raw/pre-freeze-repro.txt`):

| ID | Field | Wrong behavior | Named by trigger |
|---|---|---|---|
| D-A | `ADRs/principles/docs status` | unconditional whole-field `conflict\|blocked\|unresolved` scan runs before every disposition branch, so a resolved `aligned because …`/`N/A because …` that merely mentions those words is rejected as an unresolved conflict | evt_59fefaa9 "authority dispositions" |
| D-B | `Acceptance atom map` / `Acceptance sequence map` | requires the literal bigram `all row(s)`; `every row`, `each row`, `all acceptance-audit rows` rejected | evt_59fefaa9 "acceptance atom and sequence maps" |
| D-C | `Evidence identity refresh` block and TDD review-fix map cells | whole-field `TODO\|TBD\|pending\|unknown\|<…>` scan rejects legitimate citations containing those tokens; message names no offending token | evt_59fefaa9 "evidence identities" |
| D-D | compact-row `Red command/failure` coverage-only form | requires the contiguous literal `red-first N/A because behavior already existed`; and on failure the message describes the unrelated expectation-rewrite case instead of the coverage-only accepted form | evt_59fefaa9 "coverage-only skip phrasing" |

## Risk tier

**High** — the change edits the target's own gate script, which enforces a shared
convention consumed by sibling skills (`implement`, `code-review`) and whose loosening
could admit unresolved authority conflicts or unresolved placeholders into a tracker
closeout. Escalated to five paired trials plus deterministic checks.

## Deterministic checks (decisive instrument)

Prior-cycle lesson recorded for this evidence store: blind round-count ties for
validator-behavior candidates because capable executors front-load by reading validator
source. The **deterministic verdict matrix is the primary gate**; blind trials measure
diagnosability and guard against regression.

- **D1 — verdict matrix.** `raw/verdict-matrix.mjs`, run against both versions. Every
  case has a frozen expected verdict:
  - **Flip cases (must be rejected by current, accepted by candidate):** F1 aligned
    disposition ending `no conflict with ADR-0003`; F2 aligned disposition citing a
    `blocked-demo` domain noun; F3 `N/A because … no unresolved governing authority`;
    F4 atom map `all acceptance-audit rows list …`; F5 atom map `every row lists …`;
    F6 sequence map `every row lists ordered proof or a justified sequence N/A`;
    F7 identity artifact path `` `reports/pending-review-notes.md` ``; F8 identity naming
    a backticked angle-bracket domain token; F9 coverage-only red cell reading
    `red-first N/A because the behavior already existed …`; F10 coverage-only red cell
    reading `red-first is N/A because behavior already existed …`.
  - **Safety cases (must be rejected by BOTH versions):** S1 `conflict - blocked because
    FOUNDATIONS forbids the requested behavior`; S2 `read` only; S3 `approved amendment`
    with no durable reference; S4 identity `fixture paths <paths>`; S5 review-fix map
    cell that is literally `TBD`; S6 atom map `some rows list authoritative atoms and
    proof surfaces` (non-universal quantifier); S7 atom map `rows list atoms` with no
    quantifier; S8 red cell `coverage-only existing behavior` with no reason clause;
    S9 sequence map `most rows list ordered proof`; S10 authority value
    `aligned` with no basis.
  - **Preserved-pass cases (must be accepted by BOTH versions):** P1 baseline
    single-issue closing body; P2 canonical coverage-only red cell; P3 canonical atom and
    sequence maps; P4 withheld-fixture structured identity; P5 browser evidence-only body
    with proof-server preflight, backend currentness, freshness, console state; P6
    existing contract-change expectation row; P7 recovery-addendum body; P8 review-fix map
    body; P9 parent-rollup body with acceptance manifest; P10 all-none superseded sweep.
  - Pass condition: candidate flips all 10 flip cases, changes no safety verdict, changes
    no preserved-pass verdict.
- **D2 — suite regression.** `node --test .claude/skills/tdd/scripts/*.test.mjs` in a
  sibling-complete temp tree (copy of all of `.claude/skills` with the candidate swapped
  in at the canonical path), current vs candidate. Recorded gotcha for this store: the
  tdd test file imports `../../code-review/scripts/review-evidence-contract.mjs`, so the
  isolated candidate directory alone cannot run; and the baseline there carries one
  pre-existing failure (`guidance carries sink, snapshot, exactness…` expecting
  `docs/robustness-testing.md`) which is NOT a regression and must not be "fixed" here.
  Pass condition: candidate's pass/fail counts equal the current baseline's, with no new
  failure.
- **D3 — repo lint.** `npm run lint` after landing must pass.

## Paired blind trials

Executors are independent agents given only the raw authoring task and the skill version
they hold, with no diagnosis, no intended repair, no expected answer, and no version
label. Raw outputs retained under `raw/`.

- **T1 — fresh reproduction of the implicated mechanism.** Author a closing TDD closeout
  body for a single-issue task whose authority disposition legitimately involves a
  resolved conflict and whose one row is coverage-only existing behavior. Measured:
  number of validator rejection rounds to first pass, and whether the executor recovered
  from validator message text alone or had to read validator source. Protects: D-A, D-D.
- **T2 — adjacent case exercising the same capability differently.** Author a closing TDD
  closeout body for a task whose acceptance audit lives in an adjacent keyed map (natural
  "all acceptance-audit rows" phrasing) and whose current evidence identities cite a real
  artifact whose filename contains a placeholder-like token. Same measurements.
  Protects: D-B, D-C.
- **T3 — unrelated core regression.** Author an ordinary single-issue red-first closing
  body with no defect-adjacent field content. Both versions must accept an equivalent
  body; neither may introduce a new rejection. Protects: baseline closeout authoring.
- **T4 — second core regression.** Author a closing body carrying browser/manual
  evidence-only rows: freshness, proof-server preflight, backend currentness, console
  state, and a review-fix map. Protects: the browser/evidence-only contract, which the
  candidate must not touch.
- **T5 — safety / fragile case.** Author a closing body for work where an authority
  conflict is genuinely unresolved and one identity value is genuinely not yet known.
  Both versions must refuse; the candidate must not admit either. Protects: the gate's
  safety invariant.

## Rubric

- Deterministic (D1/D2/D3): exact verdict comparison, no evaluator judgment.
- Blind trials: pass/fail is "did the frozen deterministic expectation for that trial
  hold on that version"; rejection-round counts and message-recovery observations are
  recorded as the diagnosability comparison, not as the primary gate.

## Acceptance gate

Candidate lands only if: D1 flips all 10 flip cases with zero safety or preserved-pass
verdict change; D2 shows no new failure; T3/T4/T5 show no regression on either version;
T1/T2 show the candidate at least as good on rounds-to-pass and strictly better on
message-recovery; and the candidate introduces no growth beyond what the mechanism
demands. Behaviorally tied ⇒ incumbent stays.
