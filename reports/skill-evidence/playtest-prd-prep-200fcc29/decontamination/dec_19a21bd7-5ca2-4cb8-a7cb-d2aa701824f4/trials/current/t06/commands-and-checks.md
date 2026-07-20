# T06 Baseline Commands And Checks

- Fresh shared clone: detached at `7e8a545860c0d70f25be429d0a02b37d44be8bbc`.
- Variant installed: frozen `baseline/` snapshot only at `.claude/skills/playtest-prd-prep`.
- Frozen inputs: all seven T06 source, predecessor, prep, and image hashes matched `corpus/environment/hashes.sha256` before execution.
- Source report validator: `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-winter-letter-2026-07-20T092714Z.md` -> PASS.
- Source inspector: `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source reports/playtest-the-winter-letter-2026-07-20T092714Z.md` -> status `ok`; 3 prioritized findings, 19 cumulative rows, and 8 strength rows.
- Focused verification group 1: Ideate view/request rendering/slot assignment, compiler cast sections, Segment Reconciliation, and Private Note editor -> 6 files, 64 tests passed.
- Focused verification group 2: Project Picker, Story Configuration, Working Set, Generate/Candidate, and CAST MEMBER editor -> 5 files, 76 tests passed.
- Total focused verification: 11 files, 140 tests passed.
- Variant draft validator: `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --draft <source> <prep>` -> status `ok`, contract v2, 19 dispositions, 8 strength constraints, 1 ticket packet, 0 PRD candidates.
- Variant final validator: `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs <source> <prep>` -> status `ok`, final mode, no warnings or errors.
- Frozen current-skill validator: passed with the same final output. The validator recovered from the fresh clone and the assigned baseline validator have identical SHA-256 `da49f2a67ff8d9b9506f285728be52816295e458b7ad5f8eed1e5772d4aeb08e`; the installed hierarchy was used for the second invocation so its required sibling `playtest` import remained resolvable.
- One attempted invocation from the relocated current-skill directory failed before validation because relocation broke its relative import of the sibling playtest validator. It did not read or alter the prep; hash identity and the successful hierarchy-preserving second invocation resolve this harness issue.
- Manual semantic review: completed. The prep accounts for 19/19 cumulative items, 8/8 strengths, and all three governed immediate-prior recommendations.
- Privacy and stale-language scan: clear after the two frozen evidence images were overlaid; the prep does not reproduce image content, prompts, prose, payloads, secrets, Private Note content, or browser plumbing.
- Final checkout: detached at the required commit with exactly four untracked frozen/intentional rows, matching the prep ledger and `git-status.txt`.
- Broader root lint, typecheck, full test, build, and browser reproduction were not run: this report-only trial changed no product surface, and focused evidence was sufficient for the dispositions.
- External effects: no GitHub or tracker writes, commits, pushes, product/source edits, or PRD publication.
