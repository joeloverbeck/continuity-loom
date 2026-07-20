# T04 Baseline Commands and Checks

## Isolation and frozen inputs

- Created a fresh shared clone at `/tmp/continuity-loom-t04-baseline.ooGac5/repo` and checked out detached commit `7e8a545860c0d70f25be429d0a02b37d44be8bbc`.
- Overlaid only the frozen T04 source report, predecessor report, and predecessor prep supplied by the harness.
- Verified the frozen input hashes:
  - Current report: `75c7d008...`
  - Predecessor report: `457239ac...`
  - Predecessor prep: `6a70a39...`
- Removed only the current source's own same-stem prep from the clone without inspecting it; preserved the predecessor prep.
- Replaced the clone's installed `playtest-prd-prep` skill with the frozen baseline snapshot from `run/baseline`.
- Did not inspect the rubric, candidate skill, candidate output, or live same-stem T04 prep.

## Intake and source checks

- Read the harness and raw T04 prompt. Executed the requested workflow for `reports/playtest-the-winter-letter-2026-07-20T023325Z.md`.
- Read the installed baseline skill and its required prep-format reference in full before authoring.
- Read the active repository authorities relevant to the report, including `AGENTS.md`, `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md`, the story-record/compiler/reconciliation/user-guide authorities, ticket guidance, and the `/to-prd` seam contract.
- Read the current source report and predecessor prep in full; used only targeted predecessor-report detail needed to reconcile F003 and the cumulative ledger.
- `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-winter-letter-2026-07-20T023325Z.md`: PASS.
- Baseline source inspector: `status: ok`; continuation run; predecessor prep present; source validation passed; 2 prioritized findings, 15 cumulative ledger rows, and 6 strength rows.
- Confirmed detached `HEAD` at the frozen commit. The source report's launch commit `d94b365...` is an ancestor of the frozen trial commit.

## Read-only reconciliation

- Read-only GitHub lookup found no open issues and exact closed owners #100, #109, #110, #111, #112, #122, and #123.
- Relevant post-report drift is consumed: #122 records the F003 verification/no-create disposition, and #123 fixes F015's Private Note save-state copy.
- Current code confirms #100's all-empty reconciliation treatment: unverified-result labeling, manual comparison, explicit retry, and no write.
- Focused tests passed: 4 files and 42 tests covering the reconciliation parser/routes/view and NoteEditor. A temporary dependency symlink was removed after the run.
- Source and durable authorities are tracked, clean, visible at `origin/main`, and content-identical.

## Prep validation

- Baseline draft validator: PASS with 0 candidates, 0 ticket packets, 15 disposition rows, 6 strength-constraint rows, and no warnings or errors.
- Manual semantic review: completed.
- Privacy and stale-language scans: clear; no local absolute paths, loopback URLs, API-key names or values, or unresolved placeholder/check-later language in the prep.
- `git diff --check`: PASS.
- Baseline final validator: PASS; retained in `baseline-validator-output.txt`.
- Frozen current-skill final validator, executed without inspecting that skill: PASS; retained in `current-skill-validator-output.txt`.
- Raw evidence prep and clone artifact are byte-identical: SHA-256 `097f30f2c6dffa5f6e209afd5dda7457260eb9b2c50a25e0399db93da7746cd6`.
- Final clone status contains exactly one intentional modification: `reports/playtest-the-winter-letter-2026-07-20T023325Z-prd-prep.md`.

## Outcome and non-actions

- Verdict: no new PRD. Every current and predecessor action has a closed owner or an evidence-backed no-create disposition.
- No tracker writes, product/source edits, implementation, commits, pushes, PRD publication, or `/to-prd` seam checkpoint occurred.
- Root repository gates were not run because this was a report-only evidence trial with no product or source change.
