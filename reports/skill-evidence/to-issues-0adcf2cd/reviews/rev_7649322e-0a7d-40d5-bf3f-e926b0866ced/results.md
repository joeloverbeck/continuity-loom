# Trial results — rev_7649322e-0a7d-40d5-bf3f-e926b0866ced

Pack `7f3` = unchanged live skill. Pack `c2a` = candidate. Executors never saw a version label, never
saw the diagnosis, and were barred from `.claude/skills/`. Raw outputs in `results/`.

| Trial | Current (7f3) | Candidate (c2a) | Divergence site exercised | Reproduced on a fresh case? |
|---|---|---|---|---|
| T1 run sheet, affected slice | **FAIL** — `hasNoMissingItems`, `hasNoUnexpectedItems` | PASS | site 1 (row pipes) | **No.** Both wrote rowCount 10 with correct pipes. The current-pack failure was an unrelated cause: it wrapped checklist item names in backticks. |
| T2 working ledger | PASS | PASS | site 2 (`blockedBySlices`) | No. Both used the `slice` identifier. |
| T3 blocked-by body | PASS | PASS | site 3 (blocker over-extraction) | No. Neither wrote a second issue number into the bullet. |
| T4 posted parent ledger | PASS | PASS | site 4 (`Breakdown decisions`) | No. Both included the heading. |
| T5 family manifest | **FAIL** — `parent.ledger.status must be posted or skipped` | **PASS** | site 5 (manifest value shapes) | **Yes.** Current pack invented `{posted: true, url, bodyFile}` instead of `{status, commentUrl, bodyFile}`. |
| T6 run sheet, affected + unaffected (adjacent) | PASS | PASS | — | noninferior |
| T7 standalone-source body (core regression) | PASS | PASS | — | noninferior |
| T8 approval checkpoint (core regression, blind rubric) | 12/12 | 11/12 | — | 1-point delta on criterion 6 only |
| T9 gate strength (deterministic) | 70/70 tests pass | 70/70 tests pass | — | `scripts/` byte-identical between versions |

## T8 detail

Blind evaluator, concealed labels (X = candidate, Y = current), did not know which was which. Both
scored 2/2 on criteria 1–5. The candidate scored 1 on criterion 6 because it appended a
worktree-status note after its authorization sentence. `SKILL.md` is byte-identical between versions
and the checkpoint task touches no edited section, so this is single-sample run variance, not an
effect of the candidate.

## Honest reading of the frozen acceptance rule

The frozen rule said "T1–T5 fail on current and pass on candidate for at least the divergence sites
they exercise". Under its strictest reading that is **not satisfied**: only T5 produced a
current-fails/candidate-passes flip on its own site. T2, T3 and T4 showed no problem at all on the
current documentation, and T1's failure was off-mechanism.

What the trials do establish:

- The mechanism is real and target-owned, and one fresh reproduction (T5) confirms it and shows the
  candidate resolving it.
- Sites 2 and 4 are documentation statements that are **verifiably false or incomplete** against the
  validator source (`slices.indexOf(blockedSlice)` matches `entry.slice`, never `entry.title`;
  `validateLedger` requires the literal `Breakdown decisions` string in every posted ledger). They did
  not bite in these synthetic runs, but the trigger events record them biting in real ones.
- No regression anywhere. No gate weakened. `scripts/` untouched.

Growth is therefore **outcome-supported at site 5 and correctness-supported at sites 1–4**. Total
growth is +552 bytes on a 13,125-byte file (+4.2%), confined to the five divergence sites, with no
other file changed.

## Knowingly unrepaired

Incident `evt_44c0ab5a` also reported friction from the composite-checklist component vocabulary not
being listed in the documentation. That is left alone: the protocol already directs the author to
"let the validator report missing components", which is a designed recovery loop rather than a
contradiction between doc and gate. It stays available as evidence for a later cycle.
