# T01 Baseline Command And Check Log

## Isolation and frozen inputs

- Read the complete `corpus/environment/execution-harness.md`, `corpus/t01/prompt.md`, baseline `SKILL.md`, and baseline `references/prep-format.md`. The rubric, candidate paths, and live-workspace same-stem prep were not read.
- Created `/tmp/continuity-loom-t01-baseline.COqm4W` with:

```text
git clone --shared --no-checkout /home/joeloverbeck/projects/continuity-loom /tmp/continuity-loom-t01-baseline.COqm4W
git checkout --detach 7e8a545860c0d70f25be429d0a02b37d44be8bbc
git switch -c trial-t01-baseline-dec-19a21bd7
```

- Overlaid the sole frozen T01 input at its repository-relative path.
- Removed only `reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md` before execution.
- Replaced `.claude/skills/playtest-prd-prep` with the baseline snapshot.

Checks:

```text
git rev-parse HEAD
7e8a545860c0d70f25be429d0a02b37d44be8bbc

sha256sum reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
b8bad94a76e92201e474b81c6a0780ba34a4e71dff2f9aa3563badb656f18694  reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md

same-stem prep before execution: absent
diff -qr <baseline-snapshot> .claude/skills/playtest-prd-prep
<no output; exit 0>
```

The frozen hash matched `corpus/environment/hashes.sha256`. The installed validator and frozen snapshot validator both had SHA-256 `da49f2a67ff8d9b9506f285728be52816295e458b7ad5f8eed1e5772d4aeb08e`.

## Source validation and provenance

Command:

```text
node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
```

Result: exit 0; PASS with one warning that a historical schema v1 report declared one counterfactual probe before the later disclosure block existed.

Command:

```text
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
```

Result: exit 0; `status: ok`, `sourceValidation: passed`, 12 prioritized findings, 21 cumulative rows, and 7 strengths. Exact output is retained in `source-inspector.json`.

Durability checks:

```text
git diff --quiet -- reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
exit 0

git ls-tree -r --name-only origin/main -- reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md

git rev-parse origin/main
7e8a545860c0d70f25be429d0a02b37d44be8bbc

git diff --quiet origin/main -- reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
exit 0
```

## Tracker and current-tree reconciliation

Read-only GitHub metadata showed PRDs #91 and #94, children #92-#93 and #95-#96, and follow-ups #100-#108 closed. Likely-owner bodies were read for #91, #94, and #100-#108. No tracker write command was run.

The current tree was inspected for the compact reconciliation catalog, all-empty warning, named voice-pressure picker, accepted-segment generation-context mismatch, sidebar reachability, CAST prerequisite, Prompt Inspector navigation, Story Configuration state, CAST browse identity, and Private Note identity regression. Active hygiene and Ideation authorities were also checked for the remaining low-severity rows.

## Focused current proof

The existing workspace dependency directory was attached temporarily as an ignored execution dependency, then removed before final freshness capture.

Command:

```text
npm test -- packages/core/test/segment-reconciliation-golden.test.ts packages/core/test/generation-brief-readiness.test.ts packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx packages/web/src/generation-brief/GenerationBriefView.test.tsx packages/web/src/shell/AppShell.test.tsx packages/web/src/prompt/PromptInspector.test.tsx packages/web/src/config/StoryConfigEditor.test.tsx packages/web/src/records/RecordBrowser.test.tsx test/note-editor-persistence.test.ts
```

Result:

```text
Test Files  9 passed (9)
Tests  119 passed (119)
Duration  7.02s
exit 0
```

Broader root gates and browser reproduction were skipped for this report-only reassessment.

## Prep validation

Draft command:

```text
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --draft reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
```

Result: exit 0; current contract v2, draft mode, 0 PRD candidates, 0 ticket packets, 21 disposition rows, 7 strength rows, no errors, and the historical-schema warning.

After manual semantic review, the privacy scan and stale-language scan returned no matches. The immediately pre-validation branch and status were:

```text
trial-t01-baseline-dec-19a21bd7
 M reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
```

Variant final command:

```text
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
```

Result: exit 0; final mode, current contract v2, no errors. Exact output is retained in `validator-variant.json`.

The first attempt to invoke the frozen validator directly from the evidence snapshot failed because its relative import expected a sibling `playtest` skill. This was an execution-layout issue, not a validator result. A fresh `/tmp/t01-frozen-current-validator.XRpUhq/.claude/skills/` tree was created with the frozen validator plus the same clone's `playtest/scripts/validate-report.mjs`, preserving the validator bytes.

Frozen-current final command:

```text
node /tmp/t01-frozen-current-validator.XRpUhq/.claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
```

Result: exit 0; byte-identical final output with no errors. Exact output is retained in `validator-frozen-current.json`.

Post-validation branch and status exactly matched the validated snapshot:

```text
trial-t01-baseline-dec-19a21bd7
 M reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
```

No source workspace file, product file, source report, tracker state, commit, push, or PRD publication was changed.
