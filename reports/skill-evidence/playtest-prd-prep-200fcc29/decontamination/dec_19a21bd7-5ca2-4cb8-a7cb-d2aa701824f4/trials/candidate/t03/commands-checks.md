# T03 candidate commands and checks

- Fresh shared clone created from repository commit `7e8a545860c0d70f25be429d0a02b37d44be8bbc`; frozen T03 input overlaid; source same-stem prep removed; assigned candidate installed at `.claude/skills/playtest-prd-prep`.
- Frozen source SHA-256: expected and observed `457239ac24551154242b45d6d8571b6f07e74c714b8739af26dcb3c07720afe9`.
- `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-winter-letter-2026-07-19T022000Z.md`: PASS.
- Candidate `--inspect-source`: status ok; 6 prioritized findings, 14 cumulative rows, 6 strength rows; no warnings or errors.
- Published-main readback: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`; source blob and working copy both `954d429395303d411c6e4a589555240f1f891615`.
- Exact tracker reads: #100, #109, #110, #111, #112, and #117 were CLOSED. Current implementation and tests matched their acceptance seams.
- Candidate draft validator: status ok; contract v2 current; no warnings or errors.
- Initial focused Vitest command: 5 files and 70 tests passed, but 4 suites failed to resolve `@loom/core` because the fresh clone had not built the workspace package.
- `npm run build -w @loom/core`: passed.
- Focused rerun across Project Picker, Story Configuration, Working Set, Generate, Segment Reconciliation core/server/web, and Cast Member draft import: 9 files passed, 119 tests passed.
- Privacy and stale-language scan: no machine-local path, localhost URL, key marker, raw prompt/prose marker, or stale completion phrase found.
- Candidate final validator: status ok; final mode; 14 dispositions, 6 strength constraints, 0 PRD candidates, 0 ticket packets; no warnings or errors.
- Frozen current-skill validator from an independent clean checkout at the required commit: same final pass, no warnings or errors.
- Root lint, typecheck, full test, and full build gates were intentionally skipped for this report-only run, as directed by the candidate skill.
- Final branch: detached HEAD. Final status exactly matches the three-row artifact ledger in `final-git-status.txt`.
