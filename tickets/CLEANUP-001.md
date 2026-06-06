# CLEANUP-001: Remove orphaned `acceptedProseContamination` diagnostic code

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — removes one entry from `DIAGNOSTIC_CODES` in `packages/core/src/validation/types.ts`; no behavioral change.
**Deps**: None

## Problem

`DIAGNOSTIC_CODES.acceptedProseContamination` (`"accepted-prose-contamination"`) is registered in `packages/core/src/validation/types.ts` but is not the production diagnostic used for prompt-facing accepted/candidate prose contamination.

The live contamination path uses `DIAGNOSTIC_CODES.promptFacingProseContamination` (`"prompt-facing-prose-contamination"`) from `packages/core/src/validation/types.ts` and emits it from `packages/core/src/validation/rules/universal-blockers.ts`.

The orphaned registry entry creates unnecessary surface area and invites confusion between two near-identical contamination codes. Removing it aligns with `docs/FOUNDATIONS.md` field-economy doctrine without changing validation behavior.

## Assumption Reassessment (2026-06-06; path-status corrected post-v1)

1. The orphan is the `acceptedProseContamination: "accepted-prose-contamination"` entry inside the `DIAGNOSTIC_CODES` registry in `packages/core/src/validation/types.ts`.
2. The live accepted/candidate prose contamination diagnostic is `promptFacingProseContamination: "prompt-facing-prose-contamination"` in the same registry.
3. `packages/core/src/validation/rules/universal-blockers.ts` emits `promptFacingProseContamination` from the prompt-facing contamination and generation-context validation paths. This ticket must not change those emit sites or their behavior.
4. SPEC-014 is not active at the post-v1 target commit. Its archived paths are:
   - `archive/specs/SPEC-014-polish-regression-hardening-and-documentation.md`
   - `archive/tickets/SPEC014POLREGHAR-002.md`
   - `archive/tickets/SPEC014POLREGHAR-006.md`
5. Archived SPEC-014 materials explicitly treated removal of `acceptedProseContamination` as separate cleanup, not part of Phase 14 hardening. Those archived files are historical records and are not edited by this ticket.
6. Cross-artifact boundary under audit: the diagnostic-code registry is consumed by validation rules, validation tests, and stress/coverage checks. This cleanup removes only the dead registry entry; it does not remove a live emitted diagnostic.
7. FOUNDATIONS principle under audit: §13 records-and-field economy. A never-emitted code has no concrete validation, compilation, continuity, voice, or authorial-control function and should be deleted rather than kept as speculative surface.
8. Mismatch corrected from the pre-transition ticket wording: SPEC-014 and its tickets are archived, not active. Brittle line-number-specific claims are intentionally avoided here; verify current symbols directly before implementation.

## Architecture Check

1. Deleting the unused registry line is the minimal remediation: less surface, no shim, no alias, no rename indirection.
2. Keeping the entry "in case a future rule needs it" is YAGNI. A future rule can add a fresh diagnostic code when it actually emits one.
3. No backwards-compatibility shims or aliases are introduced.

## Verification Layers

1. Orphan removed → `grep -rn '"accepted-prose-contamination"' packages --include='*.ts'` returns no production TypeScript match.
2. Live contamination code intact → `grep -rn "promptFacingProseContamination" packages/core/src/validation --include='*.ts'` still finds the registry entry and live rule emit sites.
3. Registry-consumer safety → `npm run build --workspace @loom/core && npm test` passes after the deletion.
4. FOUNDATIONS alignment → removal eliminates a function-less diagnostic code and changes no accepted-prose exclusion behavior.

## What to Change

### 1. Delete the orphaned code entry

Remove this single entry from the `DIAGNOSTIC_CODES` object in `packages/core/src/validation/types.ts`:

```ts
acceptedProseContamination: "accepted-prose-contamination",
```

Leave every other diagnostic entry untouched, including `promptFacingProseContamination`.

## Files to Touch

- `packages/core/src/validation/types.ts` (modify)

## Out of Scope

- Any change to `promptFacingProseContamination`, its string value, its validation emit sites, or accepted-prose exclusion behavior.
- Renaming local test helper functions that happen to use the phrase `acceptedProseContamination` while mapping to the live `promptFacingProseContamination` code. That would be cosmetic churn.
- Editing archived specs or tickets that mention the accepted-prose-contamination concept historically.
- Introducing aliases, deprecation placeholders, or backwards-compatibility shims.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build --workspace @loom/core && npm test`
2. `grep -rn '"accepted-prose-contamination"' packages --include='*.ts'` returns no production TypeScript match.
3. `grep -rn "promptFacingProseContamination" packages/core/src/validation --include='*.ts'` still returns the registry entry and rule emit sites.

### Invariants

1. `DIAGNOSTIC_CODES` contains no never-emitted `accepted-prose-contamination` registry entry after this change.
2. Accepted-prose/candidate-prose prompt-facing contamination still blocks via `promptFacingProseContamination`.
3. No validation code, severity, gating behavior, prompt compiler behavior, or accepted-segment behavior changes.

## Test Plan

### New/Modified Tests

1. None — this is a removal-only cleanup. Existing validation and accepted-prose exclusion suites prove the live behavior remains intact; grep-proof verifies the dead value is gone.

### Commands

1. `npm run build --workspace @loom/core && npm test`
2. `grep -rn '"accepted-prose-contamination"' packages --include='*.ts'`
3. `grep -rn "promptFacingProseContamination" packages/core/src/validation --include='*.ts'`
