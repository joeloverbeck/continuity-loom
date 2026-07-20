# T03 Baseline Command And Check Log

Trial: T03 baseline
Pinned commit: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`
Temporary shared clone: `/tmp/continuity-loom-t03-baseline-OXNcCm/repo`
Assigned variant: `baseline`

## Setup and decontamination

- Created a unique temporary directory and ran `git clone --shared --no-checkout`.
- Checked out the pinned commit and created local branch `trial-t03-baseline`.
- Overlaid every frozen T03 input at its repository-relative path.
- Verified source SHA-256 `457239ac24551154242b45d6d8571b6f07e74c714b8739af26dcb3c07720afe9`, matching the frozen hash ledger.
- Quarantined the clone's tracked source same-stem prep without reading it.
- Installed only the baseline snapshot at `.claude/skills/playtest-prd-prep`.
- Baseline and frozen-current validator SHA-256 values both matched `da49f2a67ff8d9b9506f285728be52816295e458b7ad5f8eed1e5772d4aeb08e`.

## Source and provenance checks

- `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-winter-letter-2026-07-19T022000Z.md`: exit 0, PASS.
- `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source ...`: exit 0, status ok; 6 prioritized findings, 14 cumulative rows, 6 strengths, no warnings or errors.
- Source path is tracked and clean.
- `git ls-tree origin/main -- <source>` and `git hash-object <source>` both resolved blob `954d429395303d411c6e4a589555240f1f891615`.
- Owner commits `7940337f...`, `a5ca3b9f...`, and `d94b365b...` are ancestors of the pinned trial HEAD.
- Read-only tracker reconciliation checked #100, #103, #109-#112, and #117; no tracker mutation command was run.

## Focused product proof

Command:

`npx vitest run packages/core/test/segment-reconciliation-parser.test.ts packages/web/src/ProjectPicker.test.tsx packages/web/src/config/StoryConfigEditor.test.tsx packages/web/src/working-set/WorkingSetView.test.tsx packages/web/src/generate/GenerateView.test.tsx packages/core/test/cast-member-draft-template.test.ts packages/core/test/cast-member-draft-import.test.ts packages/web/src/records/CastMemberEditor.test.tsx`

Result: exit 0; 8 files passed, 105 tests passed.

## Prep validation

- Baseline draft validator: exit 0; 14 disposition rows, 6 strength rows, 0 PRD candidates, 0 ticket packets, no warnings or errors.
- Manual semantic review: all 14 report rows have one evidence-backed disposition; all 6 strengths have one preservation constraint; no remaining product contradiction or unsupported scope was found.
- Privacy and stale-language scan: no machine-local path, localhost URL, prompt/response payload, key-like value, stale completion phrase, or non-draft pending language found.
- Baseline final validator: exit 0; status ok, completion mode final.
- Frozen current-skill final validator: exit 0; status ok, completion mode final.
- Pre- and post-final-validation branch/status snapshots matched exactly.

## Mutations and skipped gates

- Authored only the same-stem prep in the temporary clone and evidence files in the assigned T03 result directory.
- No source report, product code, test, doc, skill, spec, ticket, or tracker state was changed.
- No commit, push, issue mutation, PRD publication, browser reproduction, or root lint/typecheck/build gate was run.
