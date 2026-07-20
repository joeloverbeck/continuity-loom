# T05 Baseline Command And Check Log

Run: `dec_19a21bd7-5ca2-4cb8-a7cb-d2aa701824f4`
Variant: baseline snapshot installed as `.claude/skills/playtest-prd-prep`
Task: T05 only
Isolated checkout: `/tmp/continuity-loom-t05-baseline-22gQcl/repo`

## Isolation And Input

1. `sha256sum <run>/corpus/t05/inputs/reports/playtest-ash-at-low-water-2026-07-19T102650Z.md`
   - Passed: `b0fc015705e1506050c33ae784cd9376adc08eb3fb53e29f076942693f3a1774`, matching `corpus/environment/hashes.sha256`.
2. `git clone --shared /home/joeloverbeck/projects/continuity-loom /tmp/continuity-loom-t05-baseline-22gQcl/repo`
   - Passed.
3. `git checkout --detach 7e8a545860c0d70f25be429d0a02b37d44be8bbc`, then `git checkout -b trial-t05-baseline 7e8a545860c0d70f25be429d0a02b37d44be8bbc`
   - Passed; exact HEAD confirmed.
4. Preserved the commit's current-skill validator, replaced only `.claude/skills/playtest-prd-prep` with the run's baseline snapshot, and copied the frozen T05 report input to its repo-relative path.
   - `diff -qr <run>/baseline .claude/skills/playtest-prd-prep`: no differences.
   - Frozen source hash in clone matched `b0fc015705e1506050c33ae784cd9376adc08eb3fb53e29f076942693f3a1774`.
5. Removed only `reports/playtest-ash-at-low-water-2026-07-19T102650Z-prd-prep.md` before execution.
   - Passed: same-stem prep absent; baseline worktree showed only its deletion.

## Source Intake And Read-Only Reconciliation

1. `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-ash-at-low-water-2026-07-19T102650Z.md`
   - Passed.
2. `node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source reports/playtest-ash-at-low-water-2026-07-19T102650Z.md`
   - Passed: new-story mode, no prior report, 5 prioritized findings, 10 cumulative rows, 5 strength rows, no warnings/errors.
3. Read the complete source report and the required active authority set: `AGENTS.md`, `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, relevant `docs/story-record-schema.md` sections, `docs/validation-rule-inventory.md`, `docs/segment-reconciliation-prompt-template.md`, `docs/user-guide.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `tickets/README.md`.
4. Read current implementation and regression seams for field guidance, editor list metadata, readiness copy, linked CAST workflow, and Segment Reconciliation's all-empty state.
5. Live tracker reads:
   - #100: closed, `Warn that an all-empty Segment Reconciliation result is unverified`.
   - #113: closed, `ENTITY prompt-eligibility guidance correction`.
   - #114: closed, `Required-list marker clarification`.
   - #115: closed, `Structured-pressure warning copy correction`.
   - #116: closed, `Linked CAST creation and activation handoff`.
   - Open search for `Ash at Low Water`: `[]`.
   - One exploratory `gh issue list` query had shell quoting split `F010 Ash` and exited 1; corrected exact searches completed and found no F010/Ash issue. No tracker write command ran.
6. Durability checks:
   - Source is tracked and clean.
   - Source is visible on `origin/main`.
   - Working-tree and `origin/main` source blob ids both equal `82d11f4506a7217a5b4d729515950f8d1e82bfd3`.
   - Commits `7940337f7b93935d2862269d765683b376f63e77` (#100 evidence) and `407fe82904dc5819aab9e8585cc8c83bb316a59e` (#113-#116) are ancestors of the trial HEAD.

## Focused Checks

1. `npm ci`
   - Passed: 544 packages added; 0 vulnerabilities reported.
2. Initial focused `npx vitest run` across 10 files
   - Partial environment-order failure: 5 core-side files passed with 93 tests; 5 web/server suites could not resolve the unbuilt `@loom/core` package.
3. `npm run build`
   - Passed for core, server, and web; Vite reported only its non-fatal large-chunk warning.
4. Repeated the unchanged 10-file focused command:

   `npx vitest run packages/core/test/field-guidance-cast-material.test.ts packages/core/test/compiler-pressure-sections.test.ts packages/core/test/editor-descriptors.test.ts packages/core/test/readiness.test.ts packages/web/src/field-help/FieldHelp.a11y.test.tsx packages/web/src/records/RecordEditor.test.tsx packages/web/src/records/CastMemberEditor.test.tsx packages/web/src/records/RecordBrowser.test.tsx packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx packages/server/src/segment-reconciliation-routes.test.ts`

   - Passed: 10 files, 176 tests.

## Prep Validation And Final Freshness

1. Baseline validator draft mode
   - Passed: contract version 2, 0 candidates, 0 ticket packets, 10 disposition rows, 5 strength constraints, no warnings/errors.
2. Manual semantic review
   - Completed: every F001-F010 row has one supported disposition; each source strength is represented once; no unowned candidate or non-PRD action remains.
3. Privacy/stale-language scan
   - Clear: no machine-local path, localhost address, key-like value, full prompt/response/payload/prose, `TBD`, or stale conditional completion language; only the three required draft `pending` values existed before finalization.
4. Baseline final validator
   - Passed with no warnings/errors; post-pass branch and worktree matched the validated snapshot.
5. Validator identity
   - Baseline and frozen current-skill validator SHA-256 both: `da49f2a67ff8d9b9506f285728be52816295e458b7ad5f8eed1e5772d4aeb08e`.
6. First frozen-current invocation from a flattened copied path
   - Exited 1 because the unchanged validator's relative `playtest` import resolved outside its preserved directory layout.
7. Frozen current-skill final validator from the preserved skill/sibling layout
   - Passed with no warnings/errors.
8. Final comparison
   - Branch: `trial-t05-baseline` before and after validation.
   - HEAD: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`.
   - Status before and after validation: only ` M reports/playtest-ash-at-low-water-2026-07-19T102650Z-prd-prep.md`.

## Non-Actions

No source report, product code, test, active doc, skill source, spec, ticket, or tracker state was edited. No commit, push, issue mutation, PRD publication, OpenRouter request, browser reproduction, or `/to-prd` checkpoint occurred.

## Retained-Evidence Check

- `raw-prep.md` and the validated clone artifact have identical SHA-256 `0f4871e15bde651b405de592765c078ca0a2ab3de4c0c7b2bab0eff4131d18ca`.
- `source-inspector.json`, `baseline-validator.json`, and `current-skill-validator.json` parse as JSON.
- The trial directory contains the raw prep, raw response, command/check log, source report validator, source inspector, both final validators, and final status.
