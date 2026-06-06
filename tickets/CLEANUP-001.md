# CLEANUP-001: Remove orphaned `acceptedProseContamination` diagnostic code

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — removes one entry from `DIAGNOSTIC_CODES` in `packages/core/src/validation/types.ts`; no behavioral change.
**Deps**: None

## Problem

`DIAGNOSTIC_CODES.acceptedProseContamination` (`"accepted-prose-contamination"`, `packages/core/src/validation/types.ts:37`) is registered but emitted by **no production rule** — the verbatim/auto-summary prose-in-handoff path fires `promptFacingProseContamination` (`packages/core/src/validation/rules/universal-blockers.ts:388,415,427`). An orphaned diagnostic code is dead surface that invites confusion (two near-identical contamination codes, only one live) and contradicts FOUNDATIONS §13 field economy ("sophisticated-sounding fields that have no … use should be merged, demoted, renamed, or deleted"). This was surfaced during the SPEC-014 reassessment (2026-06-06) and deliberately scoped out of that hardening phase as a separate cleanup; this ticket performs it.

## Assumption Reassessment (2026-06-06)

1. The orphan is `acceptedProseContamination: "accepted-prose-contamination"` at `packages/core/src/validation/types.ts:37`, inside the `Object.freeze({ … })` `DIAGNOSTIC_CODES` registry (line 36). The live contamination code is `promptFacingProseContamination: "prompt-facing-prose-contamination"` (`types.ts:80`), emitted at `universal-blockers.ts:388,415,427`.
2. SPEC-014 (active, `specs/SPEC-014-…md`) and its tickets `SPEC014POLREGHAR-002` / `-006` explicitly defer this removal ("separate cleanup, not this hardening phase"); archived `SPEC-006`/`SPEC006DETVALENG-003` reference the *accepted-prose-contamination blocker concept*, which remains implemented as `promptFacingProseContamination` — those archived files are historical and are not edited.
3. Cross-artifact boundary under audit: the diagnostic-codes registry (`types.ts`) is consumed by validation rules (emit sites), tests that cite specific codes, and `packages/core/src/demo/stress-coverage.test.ts:64` which enumerates `Object.values(DIAGNOSTIC_CODES)`. The audit confirms the enumeration is used only as a **superset** check (`knownDiagnosticCodes` must *contain* each `MATRIX_DIAGNOSTIC_CODES` entry, lines 68-70), so shrinking the registry by one unused entry cannot fail it.
4. FOUNDATIONS principle under audit: §13 records-and-field-economy — every field/code must earn its place through a concrete function (compilation, validation, continuity, voice, authorial control); a never-emitted code has none and should be deleted. Removal strengthens field economy; it removes no live validation behavior.
5. Removal blast radius (repo-wide grep on symbol `acceptedProseContamination` and value `accepted-prose-contamination`, excluding `dist/`): the **only** functional site is the `types.ts:37` definition. `validation-stress-mapping.test.ts:20,186` reference a **local fixture-builder function** coincidentally named `acceptedProseContamination` that maps to `DIAGNOSTIC_CODES.promptFacingProseContamination` — it does not touch the registry key and is unaffected. No `.ts/.tsx` file references `DIAGNOSTIC_CODES.acceptedProseContamination` or the string `"accepted-prose-contamination"` outside the definition. Archived specs/tickets and the SPEC-014 spec/tickets reference it only in prose. So Files to Touch is the single definition line.
6. No mismatch: emit-site absence, the subset nature of the stress-coverage check, and the local-function naming coincidence were all read from the working tree on 2026-06-06.

## Architecture Check

1. Deleting the unused registry line is the minimal, cleanest remediation — strictly less surface, no shim, no rename indirection. The alternative (keeping it "in case a future rule needs it") is YAGNI and perpetuates the two-contamination-codes confusion; a future rule can re-add a code when it actually emits one.
2. No backwards-compatibility shims: the entry is removed outright; no alias or deprecation placeholder is introduced.

## Verification Layers

1. Orphan gone → grep-proof: `grep -rn '"accepted-prose-contamination"' packages --include=*.ts` returns no match (the value existed only at the deleted definition).
2. No registry-consumer regression → `npm test` green; specifically `packages/core/src/demo/stress-coverage.test.ts` still passes (its superset check is unaffected).
3. Live contamination code intact → grep-proof: `DIAGNOSTIC_CODES.promptFacingProseContamination` still defined (`types.ts`) and emitted (`universal-blockers.ts:388,415,427`); the accepted-prose-exclusion behavior is unchanged.
4. FOUNDATIONS §13 alignment → FOUNDATIONS alignment check (removal eliminates a function-less code; no live rule loses its code).

## What to Change

### 1. Delete the orphaned code entry

Remove the single line `acceptedProseContamination: "accepted-prose-contamination",` from the `DIAGNOSTIC_CODES` object in `packages/core/src/validation/types.ts` (line 37). Leave every other entry — including `promptFacingProseContamination` — untouched.

## Files to Touch

- `packages/core/src/validation/types.ts` (modify)

## Out of Scope

- Renaming the coincidentally-named local fixture builder `acceptedProseContamination` in `packages/core/test/validation-stress-mapping.test.ts` — it is a valid local helper mapping to the live `promptFacingProseContamination` code; renaming it is optional cosmetic churn, not required by this removal.
- Any change to `promptFacingProseContamination` or its emit sites, or to validation behavior.
- Editing archived specs/tickets that reference the accepted-prose-contamination blocker concept (historical records).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build --workspace @loom/core && npm test` — full suite green after the deletion (no test referenced the orphaned key).
2. `grep -rn '"accepted-prose-contamination"' packages --include=*.ts` — returns nothing (orphan value eliminated).
3. `grep -rn "promptFacingProseContamination" packages/core/src/validation --include=*.ts` — still present (live code retained).

### Invariants

1. `DIAGNOSTIC_CODES` contains no never-emitted code after this change.
2. The accepted-prose-exclusion blocking behavior (via `promptFacingProseContamination`) is unchanged.

## Test Plan

### New/Modified Tests

1. `None — removal-only ticket; existing validation/stress-coverage suites prove no consumer relied on the orphaned code, and the grep-proofs confirm the value is gone while the live code remains.`

### Commands

1. `npm run build --workspace @loom/core && npm test`
2. `grep -rn '"accepted-prose-contamination"' packages --include=*.ts` (expect no output) and `grep -rn "promptFacingProseContamination" packages/core/src/validation --include=*.ts` (expect matches)
3. The full `npm test` is the correct boundary — the only risk is a hidden registry consumer, which a whole-suite run plus the grep-proofs jointly rule out.
