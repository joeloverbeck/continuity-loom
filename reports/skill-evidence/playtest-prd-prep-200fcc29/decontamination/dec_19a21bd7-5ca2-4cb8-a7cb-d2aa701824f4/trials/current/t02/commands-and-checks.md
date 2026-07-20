# T02 Baseline Command And Check Log

Variant: frozen baseline snapshot
Repository commit: 7e8a545860c0d70f25be429d0a02b37d44be8bbc
Task source: reports/playtest-the-unbidden-oath-2026-07-18T145754Z.md

## Harness setup

- Created a fresh shared clone in a unique temporary directory and checked out the required commit detached.
- Overlaid all three frozen T02 inputs at their repository-relative paths.
- Removed only reports/playtest-the-unbidden-oath-2026-07-18T145754Z-prd-prep.md before execution.
- Replaced the clone's playtest-prd-prep installation with the frozen baseline snapshot.
- Frozen input hashes matched hashes.sha256:
  - prior report: b8bad94a76e92201e474b81c6a0780ba34a4e71dff2f9aa3563badb656f18694
  - prior prep: 4c1f1693c62998f14f4d5f8662fc61358c51616757914ab956aabf80c4563e51
  - source report: feec1508c1638abf978f302f942048f347bd9fce5ec7dcd7ab028288db76bd6d
- Baseline and frozen-current validator SHA-256 both resolved to da49f2a67ff8d9b9506f285728be52816295e458b7ad5f8eed1e5772d4aeb08e.

## Intake and reconciliation checks

- Source report validator: exit 0, PASS.
- Source inspector: exit 0, status ok, source validation passed, 5 prioritized findings, 27 cumulative rows, 12 strengths.
- Historical prior-report validator: exit 0, PASS with its bounded schema-v1 compatibility warning.
- Live tracker read: zero open issues. Closed #91-#108 were reviewed as likely owners; exact-title searches found no owner for Ideate slot completeness or runtime-status wording.
- Durability gate: source report, prior report, and prior prep are tracked, clean, visible on origin/main, and content-identical.
- Current-source inspection confirmed the Ideate parser accepts any nonempty valid block set and does not receive the compiled assigned-slot set.

## Focused tests

Command:
npm test -- packages/core/test/segment-reconciliation-golden.test.ts packages/core/test/ideation-request-rendering.test.ts packages/server/src/ideation-parse.test.ts packages/server/src/segment-reconciliation-routes.test.ts packages/web/src/generation-brief/GenerationBriefView.test.tsx packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx packages/web/src/shell/AppShell.test.tsx packages/web/src/prompt/PromptInspector.test.tsx packages/web/src/config/StoryConfigEditor.test.tsx packages/web/src/records/RecordBrowser.test.tsx packages/web/src/notes/NoteEditor.persistence.test.tsx

Result: exit 0; 10 test files passed, 121 tests passed.

Root lint, root typecheck, the full test suite, and root production build were skipped for this report-only trial.

## Artifact validation

- Draft validator: exit 0; current contract v2, 27 dispositions, 12 strength constraints, 0 PRD candidates, 1 ticket packet.
- Manual semantic review: completed.
- Privacy/stale-language scan: no matches for machine-local paths, localhost addresses, credential names, or incomplete-language sentinels.
- Baseline final validator: exit 0; status ok, completionMode final.
- Frozen-current final validator: exit 0; status ok, completionMode final.
- Post-validation branch/status comparison matched the validated detached-HEAD, one-row worktree ledger.

## Non-actions

No source report, product code, test, active doc, skill, tracker item, commit, branch, or remote was changed. No browser journey, OpenRouter request, issue mutation, PRD publication, or /to-prd seam checkpoint occurred.
