# SPEC019REFINTSTR-004: Working-set and cast-band coherence rules

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `cast-band.ts` blocker rule module; one warning rule added and `pov-character-not-selected` removed in `warnings.ts`; `DIAGNOSTIC_CODES` gains four codes and loses `povCharacterNotSelected` (`@loom/core`); inventory rows added/removed; the existing POV warning test is rewritten. Adds blocking validation behavior and reverses one prior warning.
**Deps**: `archive/tickets/SPEC019REFINTSTR-001.md`, `archive/tickets/SPEC019REFINTSTR-002.md`

## Problem

SPEC-019 D4: cast-band coherence is unvalidated. One id can sit in multiple cast bands (`snapshot-builder.ts:166` keeps only the last via a single `Map`), band ids are not checked to be CAST MEMBER records, `selected_pov` falls back to a non-blocking warning even though `{pov_character}` is a readiness-required line, and `current_cast_voice_pressure` / `cast_voice_overrides` entries whose `cast_member_id` matches no rendered cast member are silently discarded (`packages/core/src/compiler/sections/cast.ts:174-186`), losing author-written nuance against FOUNDATIONS §8.

## Assumption Reassessment (2026-06-10)

1. The three cast bands live on the session (`active_working_set.active_onstage_cast_full[].cast_member_id`, `present_minor_cast_compressed[]`, `offstage_relevant_cast[]`); `selected_pov` is `active_working_set.selected_pov` (read today by `warnPovCharacterNotSelected`, `packages/core/src/validation/rules/warnings.ts`). `current_cast_voice_pressure[].cast_member_id` and `cast_voice_overrides[].cast_member_id` are session fields (`packages/core/src/compiler/sections/cast.ts:174-200`).
2. `docs/validation-rule-inventory.md` + `packages/core/test/validation-rule-inventory.test.ts` couple the inventory to `DIAGNOSTIC_CODES`: adding codes (with rows) and removing `pov-character-not-selected` (its code, its rule, and its row) must all land in this diff or the drift test fails.
3. Cross-artifact boundary: blocker rules consume `classifyReference` (002) and `projectRecordIndex` (001); the POV reversal also coordinates with `docs/compiler-contract.md` §4/§6 (the must-not-block rows), whose edits are owned by 009 — leaving a documented staleness window between this ticket and 009 (acceptable: 009 `Deps` on this ticket).
4. FOUNDATIONS principles: §11 clause 2 justifies `selected-pov-reference-invalid` as a blocker (the readiness-required `{pov_character}` lane has no truthful deterministic state when the POV id is unresolved/unselected); §29.5 is not violated — reclassifying a specific diagnostic warning→blocker on a proven-required lane is legitimate and carries explicit user sign-off (SPEC-019 scope decision 2); §8 motivates `voice-pressure-attachment-invalid` / the orphaned-attachment warning, which end the silent discard of authored voice pressure.
5. Fail-closed surface: `runValidation` → `compile-routes.ts:17` (`isBlocked`). New blockers gate compile/send; the new warning never gates. No secret content is read.
6. Schema/namespace extension: `DIAGNOSTIC_CODES` gains `cast-band-duplicate-membership`, `cast-band-reference-invalid`, `selected-pov-reference-invalid`, `voice-pressure-attachment-invalid` (blockers) and `voice-pressure-orphaned-attachment` (warning).
7. Rename/removal blast radius for `pov-character-not-selected` (grepped repo-wide): `packages/core/src/validation/types.ts` (code), `packages/core/src/validation/rules/warnings.ts` (`warnPovCharacterNotSelected` + array entry), `packages/core/test/validation-warnings-security.test.ts` (assertion), `docs/validation-rule-inventory.md` (row), and `docs/compiler-contract.md` (§4 row + §6 bullet). This ticket owns the first four; `docs/compiler-contract.md` is owned by 009.
8. Mismatch + correction (no silent retcon, §20): per SPEC-019 I1 (option a) the hybrid `voice-pressure-attachment-invalid` concept is realized as a blocker code (`…-invalid`, for dangling/non-CAST-MEMBER `cast_member_id`) plus a warning code (`voice-pressure-orphaned-attachment`, for a valid CAST MEMBER that attaches to no rendered band member). `selected-pov-reference-invalid` supersedes `pov-character-not-selected` per scope decision 2.

## Architecture Check

1. A dedicated `cast-band.ts` blocker module plus the single warning in `warnings.ts` matches the per-file severity model; `cast-band-duplicate-membership` checked on the three band arrays directly is more robust than inferring duplication after `castBandAssignments` has already collapsed it. The POV reversal corrects a documented mismatch (a required lane that only warned) rather than adding machinery.
2. No backwards-compatibility aliasing/shims: `pov-character-not-selected` is removed outright, not aliased to the new code.

## Verification Layers

1. One id in ≥2 cast bands -> `cast-band-duplicate-membership` blocker unit test.
2. Band id not selected or not CAST MEMBER -> `cast-band-reference-invalid` blocker unit test.
3. `selected_pov` dangling / non-ENTITY-or-CAST-MEMBER / unselected -> `selected-pov-reference-invalid` blocker unit test; and a grep-proof that `pov-character-not-selected` no longer exists in `DIAGNOSTIC_CODES`, `warnings.ts`, or the inventory.
4. Voice-pressure `cast_member_id` dangling/non-CAST-MEMBER blocks; valid-but-orphaned warns -> unit tests on both codes; the silent discard is gone.
5. Inventory/code-set integrity -> `validation-rule-inventory.test.ts` green after add + remove.

## What to Change

### 1. Blocker rules (`packages/core/src/validation/rules/cast-band.ts`, new)

Export `castBandRules` emitting: `cast-band-duplicate-membership` (an id in more than one of the three bands); `cast-band-reference-invalid` (band id not in `selected_records` or not CAST MEMBER-typed); `selected-pov-reference-invalid` (`selected_pov` dangling or not ENTITY/CAST MEMBER-typed, or existing-but-unselected — all block); `voice-pressure-attachment-invalid` (any `current_cast_voice_pressure[]`/`cast_voice_overrides[]` `cast_member_id` dangling or not CAST MEMBER-typed).

### 2. Warning rule + removal (`packages/core/src/validation/rules/warnings.ts`, modify)

Add `voice-pressure-orphaned-attachment` (`severity: "warning"`): a valid CAST MEMBER `cast_member_id` that attaches to no rendered cast-band member. Remove `warnPovCharacterNotSelected` (function and its entry in `warningRules`).

### 3. Codes, registry, inventory, test

Add `...castBandRules` to `rules/index.ts`; add the five new codes and remove `povCharacterNotSelected` in `types.ts`; add five rows and remove the `pov-character-not-selected` row in `docs/validation-rule-inventory.md`; rewrite the POV assertion in `packages/core/src/validation/test`'s `validation-warnings-security.test.ts` to cover `selected-pov-reference-invalid` instead.

## Files to Touch

- `packages/core/src/validation/rules/cast-band.ts` (new)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/rules/index.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/validation-warnings-security.test.ts` (modify)
- `packages/core/test/validation-cast-band.test.ts` (new)

## Out of Scope

- `docs/compiler-contract.md` §4/§6 POV-row edits and the §6 lane table (009).
- Brief-field rules (003), record-internal rules (005), structural contradictions (006).
- Changing `castBandAssignments`' last-band-wins collapse in `snapshot-builder.ts` (the rule blocks the duplicate before it matters; the compiler is untouched).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-cast-band` — duplicate-membership, band-reference, selected-pov, voice-pressure-attachment, and voice-pressure-orphaned cases.
2. `npm test --workspace @loom/core -- validation-warnings-security` — the rewritten POV coverage passes and no `pov-character-not-selected` assertion remains.
3. `npm test --workspace @loom/core -- validation-rule-inventory` — five codes added, `pov-character-not-selected` removed, severities match.
4. `npm run lint && npm run typecheck && npm test` — full gate; `compiler-golden.test.ts` unchanged.

### Invariants

1. A readiness-required POV reference that is dangling, mistyped, or unselected blocks; `pov-character-not-selected` no longer exists anywhere in `@loom/core` or the inventory.
2. Author-written voice pressure is never silently discarded: an invalid attachment blocks, a valid-but-orphaned attachment warns.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-cast-band.test.ts` (new) — the four blocker rules + the orphaned-attachment warning, with coherent negatives.
2. `packages/core/test/validation-warnings-security.test.ts` (modify) — replace the `pov-character-not-selected` warning assertion with `selected-pov-reference-invalid` blocker coverage.

### Commands

1. `npm test --workspace @loom/core -- validation-cast-band`
2. `npm test --workspace @loom/core -- "validation-warnings-security|validation-rule-inventory"`
3. `npm run lint && npm run typecheck && npm test`
