# Blind paired behavioral results — rev_82a89933

Version key (concealed from every executor): `v-7f3a` = current, `v-2c9d` = candidate.
Executors received only the raw task, the transcripts, a skeleton body, and a validator path.
No executor was told a defect existed, what a fix would look like, or which version they held.
Control: the skeleton produces exactly one identical error on both versions
(`verification command ledger must contain at least one final-tree row`), so the ledger is the
only variable.

## T1 — five-command transcript (Vitest counts + silent typecheck + prettier prose)

| Run | Version | Rounds | Fidelity of final rows |
|---|---|---|---|
| r1 | current | 0 | reshaped `21 passed (21)` → `1 file and 21 tests`; invented `exit 0` on three rows whose transcripts showed no exit code |
| r2 | current | 0 | kept `21 passed` alongside `1 file and 21 tests`; added unrequested durations |
| r3 | candidate | 0 | `1 test file and 21 tests; 0 failed` — preserved the zero-failure datum, invented no exit codes |
| r4 | candidate | 1 | `1 file and 21 tests; exit 0`; the failing round was on the two non-test rows (missing outcome word — a half the candidate does not change) |

T1 verdict: **tied on rounds** (current 0/0, candidate 0/1). r3 and r6 state outright that they
read the validator source before drafting; front-loading collapses the round-count metric on
both versions. Fidelity mixed, not a clean win.

## T2 — Mocha vocabulary (`3 passing` / `0 failing`) + silent tsc

| Run | Version | Rounds | Outcome |
|---|---|---|---|
| r5 | current | 1 | Rejected cell was `passed: 3 passing and 0 failing in 12ms` — a verbatim copy of the transcript's own counts. Executor **had to read validator source lines 350-356** to work out the rule, then rewrote `3 passing` → `3 tests`. |
| r6 | candidate | 0 | Passed first run; independently reported the accepted outcome vocabulary as `passed\|passing\|failed\|failing\|blocked\|unavailable\|not applicable` (the candidate's widened list). |

T2 verdict: **candidate better** (0 vs 1 rounds; current required a source read).

## Message diagnosability, paired directly

The sharpest pairing, because both executors hit the same error class:

- r5 (**current**): "The message named neither which sub-check failed nor the accepted token
  vocabulary … I confirmed the guess afterwards by reading
  `validate-tdd-closeout-body.mjs:350-356`." — the incident reproduced verbatim.
- r4 (**candidate**): "it names the row number **and lists acceptable forms**, but does not say
  which half of the requirement my cell was missing … I had to diff my cells against the
  message's shortest example (`passed; exit 0`)." — recovered in one round **without reading
  source**.

## Executor observations recorded but OUT OF SCOPE for this review

Reported by multiple executors; none is the implicated mechanism, none is repaired here, and
none becomes evidence unless a real skill use records it:

- `closeout-evidence.md` states no accepted-form vocabulary; its single example conflates
  "count" and "exit code" (r1, r2, r3, r4, r5, r6).
- `Run count` is unverifiable from the evidence artifact; any positive integer passes (r1, r2, r3, r6).
- No cross-check between the compact table's green command and the ledger; an incomplete or
  contradictory ledger still exits 0 (r2, r4, r6).
- `isExecutableCommand`'s allowlist and the whole-cell backtick rule are undocumented (r3).
