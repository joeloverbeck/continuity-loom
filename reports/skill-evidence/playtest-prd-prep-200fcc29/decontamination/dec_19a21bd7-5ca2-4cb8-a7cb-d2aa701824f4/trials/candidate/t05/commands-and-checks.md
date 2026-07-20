# T05 Candidate Commands And Checks

## Trial setup

- Created a fresh shared clone and checked out detached commit `7e8a545860c0d70f25be429d0a02b37d44be8bbc`.
- Verified the frozen T05 source SHA-256 as `b0fc015705e1506050c33ae784cd9376adc08eb3fb53e29f076942693f3a1774` against the harness manifest and after overlay.
- Preserved the commit's current validator before replacing `.claude/skills/playtest-prd-prep` with the assigned candidate snapshot.
- Overlaid the frozen T05 input and removed the source's own same-stem prep before intake.

## Intake and live reconciliation

| Check | Result |
| --- | --- |
| `git rev-parse HEAD` | `7e8a545860c0d70f25be429d0a02b37d44be8bbc` |
| `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-ash-at-low-water-2026-07-19T102650Z.md` | PASS |
| `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source reports/playtest-ash-at-low-water-2026-07-19T102650Z.md` | ok; 5 prioritized, 10 cumulative, 5 strengths |
| Source durability | tracked, clean, visible at `origin/main`, content-identical to HEAD and frozen input |
| Exact tracker owners | #100 and #113-#116 closed; later evidence-only #122 closed |
| Implementation ancestry | #100 present at launch baseline; commit `407fe829` for #113-#116 and closeout commit `2df8f8c` for #122 are ancestors of trial HEAD |

The current code and tracker consume every non-strength finding: #114 covers F003, #113 covers F004, #115 covers F005, #100 covers the F008 all-empty-result risk, and #116 covers F009. F001, F002, F006, F007, and F010 remain preservation constraints. Closed #122 supplies a later evidence-only no-create result for the broad dossier-cost question.

## Validation

| Check | Result |
| --- | --- |
| Candidate draft validator | ok; 0 PRD candidates, 0 ticket packets, 10 disposition rows, 5 strength rows |
| Manual semantic review | completed; verdict/package/cardinality and owner mapping consistent |
| Privacy and stale-language scan | clear; only the three draft self-check values used `pending`, then they were finalized |
| Candidate final validator | ok; contract v2 current, completion mode final, 10/10 dispositions, 5/5 strengths |
| Frozen-current final validator | ok with the same counts and verdict |
| Final branch/status comparison | detached HEAD; exact three-row status matches the validated ledger |

The first frozen-validator attempt from a flattened temporary location failed because its relative import of the playtest report validator could not resolve. The preserved script was then placed in the original `.claude/skills/playtest-prd-prep/scripts` directory shape alongside the commit's playtest validator and passed unchanged. This was harness plumbing, not an artifact or validator semantic failure.

Root lint, typecheck, test, and build gates were skipped as directed by the report-only skill; no product code changed. No tracker write, commit, push, source-report edit, product edit, browser journey, or provider request occurred.
