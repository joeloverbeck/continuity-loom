# Trial results — rev_5f41929f-2681-4ac9-b39a-17a500fd08cb

Arms: **current** = live `.claude/skills/implement` bytes (hash `ccd33707…`); **candidate** =
`reviews/rev_5f41929f-.../candidate`. Both staged sibling-complete outside skill discovery; exactly
one runtime file differs.

## D1 — deterministic accept/reject matrix (decisive instrument)

Raw output: `d1-current.txt`, `d1-candidate.txt`. Harness: `d1-matrix.mjs`.

| Block | Current | Candidate | Frozen requirement | Result |
|---|---|---|---|---|
| FLIP (10) | 0 accepted | **10 accepted** | ≥ 8 flips | pass |
| SAFETY (10) | 10 rejected | 10 rejected | 0 newly accepted | pass |
| PRESERVED (5) | 5 accepted | 5 accepted | 0 newly rejected | pass |

S10 (audit-row bare `pending`) is byte-identical on both arms — the already-repaired sibling scan was
not touched. S7/S8 confirm the vacuity guard: `0 passing` and `no tests found` stay rejected on the
widened predicate (V5 satisfied).

**D1 is not tied. The candidate wins the decisive instrument outright**, so the frozen tie-break order
(D2 → diagnosability → size) is informational only.

## D2 — existing suites, sibling-complete staging trees (T5)

| Suite | Current | Candidate |
|---|---|---|
| `implement/validate-closeout-body.test.mjs` | 47/47 | **50/50** |
| `implement/build-closeout-body.test.mjs` | 27/28 | 27/28 |
| `implement/capture-github-issues.test.mjs` | 4/4 | 4/4 |
| `implement/verify-github-comment-body.test.mjs` | 4/4 | 4/4 |
| `code-review/validate-review-normal-body.test.mjs` | 29/29 | 29/29 |
| `tdd/validate-tdd-closeout-body.test.mjs` | 65/66 | 65/66 |
| **total** | 176/178 | **179/181** |

Both failures are pre-existing and identical on both arms: the locational `Codex implement adapter …`
test (also fails at the canonical live path, so it is not a staging artifact) and the known
`guidance carries sink, snapshot, exactness …` failure in the tdd suite. Neither is a regression and
neither is in scope for this review.

The candidate's three added tests were cross-checked against the current validator: 4 of them fail
there (including the tightened existing assertion that the message names the token), so they encode
the behavior change rather than restating current behavior. No V3 veto.

## T1–T3 — blind paired authoring trials

Executors received only the raw task packet and their own staging tree; no diagnosis, no version
label, no expected answer, and an explicit bar on reading `reports/skill-evidence/**` and the live
`.claude/`. Metric: validator invocations exiting non-zero before the first mutation-ready pass.

| Trial | Current arm | Candidate arm |
|---|---|---|
| T1 — reproduction: a true fixture path `reports/corpus/tasks/05-pending-source.md` | **1 round**; error message insufficient, executor was forced into `validate-closeout-body.mjs` source | **0 rounds**; references only, source never opened |
| T2 — adjacent: superseded-sweep collision `/tmp/pending-fixture.sqlite` + a `npm run typecheck` row whose real output is `exit 0; no errors` | **2 rounds**; the documented backtick remedy failed on round 2, then the source | **0 rounds**; references only, source never opened |
| T3 — unrelated core regression: clean body, no colliding identifiers | 0 rounds | 0 rounds |

T1-B was rerun after the first attempt died on a mid-stream API error. Per the frozen plan that is a
harness artifact: the tree was reset and the trial rerun; the aborted attempt is not counted.

### What the current-arm executors did, unprompted

Both independently rediscovered the diagnosed mechanism and named it as a validator defect — the
identity scan at line 497 tests raw text while the audit-row scan at 656-661 strips backtick/quote
citations first, so the remedy the references teach does not work in the identity field. Both then
**published the true path outside its identity category** to get past the gate. That is the same
shape as the incidents' recorded `workaround_taken`, reproduced blind.

## Cross-validation control

Every passing blind body run against both validators:

| Body | on current | on candidate |
|---|---|---|
| T1-A, T2-A, T3-A (current-authored) | pass | **pass** |
| T3-B | pass | pass |
| T1-B, T2-B (candidate-authored) | **reject** — `evidence identity refresh contains an unresolved value` | pass |

No current-authored body regresses on the candidate. The only divergences are the two bodies that
publish a true identifier in its own identity category — exactly the diagnosed behavior change, and
nothing else.

## Acceptance gate

| Gate | Result |
|---|---|
| V1 safety leak | none — 10/10 SAFETY rejected |
| V2 preserved regression | none — 5/5 PRESERVED accepted, S10 output byte-identical |
| V3 suite regression | none — D2 identical, both failures pre-existing |
| V4 scope | diff touches only the two named predicates, their messages, and one hoisted shared helper |
| V5 vacuity guard | shipped — `vacuousResult` keeps zero-work results rejected (S7, S8) |
| Existing mechanism | reproduced on the current arm (D1 flips, T1/T2 rounds) |
| Noninferiority | T3 tied, D2 tied, cross-validation clean |
| Material improvement | D1 10 flips; T1 1→0 and T2 2→0 rounds; both current-arm workarounds eliminated |
| Minimal growth | +1311 bytes runtime (+0.48%), all of it the two predicates, the guard, and the two error messages that carry the diagnosability win |

**Decision: accepted.**
