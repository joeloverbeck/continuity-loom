# POVDISPLAY-003: Warn when the POV character cannot be resolved to a selected record (prevent a silent UUID fallback)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` validation (`packages/core/src/validation/rules/warnings.ts`, `types.ts`) and the compiler-contract doc note. No schema, storage, or blocker-gate change.
**Deps**: POVDISPLAY-002 (the compiler now renders the POV name; this ticket surfaces the one case where it still cannot).

## Problem

After POVDISPLAY-002, the compiler resolves `pov_character` (an `entity_id`) to the entity's `displayLabel`. But the compiler snapshot contains only **selected** records (`packages/server/src/snapshot-builder.ts:119-140`). When `pov_character` (or its override `selected_pov`) references an entity the author has **not** selected into the active working set, the id→name lookup finds nothing and falls back to the raw UUID — silently reproducing the original defect for that author with no signal as to why.

`docs/compiler-contract.md`'s `{pov_character}` row states the placeholder should "Block if unresolved." A hard block is too aggressive here (`pov_character` is a STORY CONFIG default; `selected_pov` overrides it per generation, and `omniscient`/`variable` are always valid), so the correct fail-closed-without-over-blocking response is an advisory **warning** that tells the author the POV entity is not selected and its name cannot render. This matches the `FOUNDATIONS.md §29.11` legibility intent and the existing warning-not-blocker taxonomy (`compiler-contract.md §6` warnings, `FOUNDATIONS.md:112-114`).

## Assumption Reassessment (2026-06-08)

1. **Warning-rule mechanism, confirmed.** Warnings are pure `ValidationRule` functions returning `Diagnostic[]` with `severity: "warning"`, registered in `packages/core/src/validation/rules/warnings.ts:5-16` and aggregated via `rules/index.ts:11-20`. The `warning(code, message, field)` helper (`warnings.ts:157-166`) and `DIAGNOSTIC_CODES` registry (`packages/core/src/validation/types.ts:36-90`) are the only surfaces a new warning needs. Warnings never set `isBlocked` (`validation/engine.ts:11-17`).
2. **POV value resolution, confirmed.** The operative POV is `active_working_set.selected_pov ?? proseMode.pov_character` (the precedence used in `matrix-voice`/`matrix-knowledge`; `selected_pov` is `recordId | "omniscient"` per `archive/tickets/POVDISPLAY-001.md` item 1, `pov_character` is `recordId | "omniscient" | "variable"`). The warning must skip the `"omniscient"`/`"variable"` literals and only fire for an id that is absent from `snapshot.records`.
3. **FOUNDATIONS / contract principle under audit.** Fail-closed is for deterministic impossibility and structural prompt-contract failures (`FOUNDATIONS.md:112-114`, `§29` blocker taxonomy); legibility/curation gaps are warnings (`compiler-contract.md §6-7`). An unselected POV entity is a legibility gap, not a structural impossibility (the prompt still compiles), so a warning — not a blocker — is the doc-aligned severity. This ticket does not weaken any existing gate.
4. **Snapshot scope, confirmed.** Only selected records are present (`snapshot-builder.ts:125 selectedIds = active_working_set.selected_records`). So "id not in `snapshot.records`" is a faithful proxy for "POV entity not selected", which is exactly the case that yields the raw-UUID fallback in POVDISPLAY-002.
5. **No schema extension.** This ticket adds one `DIAGNOSTIC_CODES` entry and one warning rule. It changes no record, brief, or prompt schema; no consumer of those schemas changes.
6. **Contract change-control.** Adding a warning row touches the validation taxonomy; per `compiler-contract.md §10` and §6, add the new warning to the contract's warning list in the same change.

## Architecture Check

1. A standalone warning rule keyed on the resolved POV id reuses the established warning pattern (cf. `warnStaleSelectedRecord`, `warnCastSalienceRisk`) and keeps the check independent of the compiler — validation already runs against the same snapshot, so no new data dependency is introduced. It deliberately does not promote to a blocker, preserving the "warnings never disable Preview/Generate" invariant.
2. No backwards-compatibility shims; this is purely additive (one code, one rule).

## Verification Layers

1. A POV id absent from selected records emits exactly one warning (not a blocker), naming the unselected POV -> unit test on the new rule (`isBlocked` stays false).
2. `"omniscient"`/`"variable"` POV and a POV id **present** in selected records emit no warning -> unit test (no false positives).
3. The warning never gates preview/generation -> `engine.ts` aggregation proof (`severity: "warning"` ⇒ excluded from `blockers`).

## What to Change

### 1. Add the diagnostic code (`packages/core/src/validation/types.ts`)

- Add e.g. `povCharacterNotSelected: "pov-character-not-selected"` to `DIAGNOSTIC_CODES` (`:36-90`).

### 2. Add the warning rule (`packages/core/src/validation/rules/warnings.ts`)

- Add `warnPovCharacterNotSelected(snapshot)` and register it in `warningRules` (`:5-16`).
- Logic: resolve `pov = selected_pov ?? proseMode.pov_character`; if `pov` is undefined or `"omniscient"`/`"variable"`, return `[]`; if a record with `id === pov` exists in `snapshot.records`, return `[]`; otherwise return one `warning(DIAGNOSTIC_CODES.povCharacterNotSelected, "The POV character is not in the selected records, so its name cannot render in the prompt; select the POV entity into the active working set.", "generationSession.active_working_set.selected_pov")`.

### 3. Record the warning in the contract (`docs/compiler-contract.md`)

- Add the warning to the §6 "Warnings that must not block" list and reference it from the POVDISPLAY-002 `{pov_character}` row note (unresolved id ⇒ raw-id fallback + this warning).

## Files to Touch

- `packages/core/src/validation/types.ts` (modify)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/rules/warnings.test.ts` (modify or create — match the repo's existing warning-test location)
- `docs/compiler-contract.md` (modify)

## Out of Scope

- Promoting this to a blocker, or any change to existing blocker gates.
- The compiler's POV rendering/fallback itself (POVDISPLAY-002).
- Any UI presentation of the warning beyond what the generic readiness/warning surface already renders.
- Schema changes to `selected_pov`/`pov_character`.

## Acceptance Criteria

### Tests That Must Pass

1. A snapshot whose resolved POV id is absent from `snapshot.records` produces exactly one `pov-character-not-selected` warning and `isBlocked === false`.
2. A snapshot whose POV id **is** in selected records, and snapshots with `"omniscient"`/`"variable"`/undefined POV, produce no such warning.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The new diagnostic is always `severity: "warning"` and never appears in `blockers`.
2. No existing blocker or gate is altered; `selected_pov`/`pov_character` schemas and consumers are unchanged.

### Invariants → proof

1. Invariant 1 → unit test asserting severity + `engine.ts` aggregation.
2. Invariant 2 → grep-proof no schema/consumer/blocker-rule file modified beyond the additive warning.

## Test Plan

### New/Modified Tests

1. `packages/core/src/validation/rules/warnings.test.ts` (or the repo's warning-rule test file) — cover the fire case, the present-entity no-fire case, and the literal/undefined no-fire cases; rationale: the rule is pure over the snapshot and fully unit-testable.

### Commands

1. `npm test --workspace @loom/core -- warnings` (targeted rule proof; adjust filter to the actual test file name).
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate per CLAUDE.md).

## Outcome

Completion date: 2026-06-08

Added the `pov-character-not-selected` diagnostic code and registered a non-blocking warning rule that checks the resolved POV (`selected_pov ?? pov_character`). The rule skips `omniscient`, `variable`, and undefined POV values, stays silent when the referenced POV record is present in the selected snapshot, and warns when the id is absent so the compiler would fall back to a raw id. Updated the compiler contract to document the warning taxonomy and `{pov_character}` fallback behavior.

Deviations from original plan: tests were added to the existing `packages/core/test/validation-warnings-security.test.ts` warning-rule coverage file rather than creating a separate warning test file.

Verification results:

- `npm test --workspace @loom/core -- validation-warnings-security` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 628 tests.
