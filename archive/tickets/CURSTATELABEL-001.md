# CURSTATELABEL-001: Resolve onstage/offstage entity ids to display labels in `<current_authoritative_state>`

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` resolvers; `docs/compiler-contract.md` §9 resolved-label list
**Deps**: None

## Problem

The compiled `<current_authoritative_state>` block renders raw record UUIDs instead of human names for onstage and offstage entities. A real preview showed:

```
Onstage entities: 019ea1b1-3957-705f-8332-d3a06305ccd3
019ea213-8f7e-73dc-8e5b-67ba95ca94fe
```

instead of the cast member display labels (e.g. *Jon*, *Ane Arrieta*). Raw UUIDs are noise to the generating model and break the prompt-facing contract that entity-id-bearing placeholders resolve to display labels.

## Assumption Reassessment (2026-06-08)

1. **Code**: `packages/core/src/compiler/sections/front.ts:53-64` resolves `onstage_entities` and `offstage_pressuring_entities` with `valueOrEmpty(...)` → `renderValue` (`front.ts:175-185`), which joins raw id strings with newlines and never looks up records. By contrast `secret_holders`/`secret_non_holders_to_protect` (`front.ts:131-137`) and the tail resolvers `objects`/`visible_affordances`/physical-continuity entity refs (`records-tail.ts:94-107,175`) route ids through `resolveRecordLabel(snapshot, value)` (`packages/core/src/compiler/labels.ts:8-16`). The label resolver already exists and already falls back to the raw id when no record matches (`labels.ts:15`).
2. **Docs**: `docs/compiler-contract.md §9` enumerates the placeholders that resolve ids → display labels (`pov_character`, `secret_holders`, `secret_non_holders_to_protect`, `objects`, `visible_affordances`) and states *"A raw id in these lines means the referenced record was not available in the selected snapshot."* It does **not** list `onstage_entities` or `offstage_pressuring_entities`. So this ticket is a code fix **plus** an additive §9 amendment to bring the contract in line with the established label-resolution principle.
3. **Shared boundary under audit**: the id→label resolution contract for prompt-facing entity references, shared between the compiler resolvers and `docs/compiler-contract.md §9`. Both must agree after this change.
4. **FOUNDATIONS principle**: §8 deterministic compilation — label resolution is a pure function of the selected snapshot (record lookup by id), so determinism is preserved; §9 universal prompt contract — prompt-facing entity references are human-readable.
5. **Schema/consumers**: `onstage_entities` is `z.array(recordId)` and `offstage_pressuring_entities` is `z.array(recordId)` (`packages/core/src/records/generation-brief-draft.ts:41`, and the onstage array). The change is render-only; no schema change, no new field.
6. **Adjacent contradiction (classified as separate future cleanup, NOT this ticket)**: `entity_statuses` (`front.ts:66-67`) also accepts an entity-ref-array variant (`generation-brief-draft.ts:46`, `z.union([draftString, z.array(recordId)])`) yet renders via `valueOrEmpty`/`renderValue` without label resolution. It is out of scope here; see Out of Scope.

## Architecture Check

1. Reuses the existing `resolveRecordLabel` helper rather than introducing a parallel resolution path — identical mechanism to the secrets and tail sections, so behavior (including raw-id fallback for absent records) is consistent across the prompt.
2. No backwards-compatibility aliasing/shims introduced. The flat-id rendering is replaced, not aliased.

## Verification Layers

1. Onstage/offstage entity ids render as display labels → schema validation (prompt-section conformance against `docs/compiler-contract.md §9`) + new unit test in `@loom/core`.
2. Absent referenced record falls back to raw id (no crash) → codebase grep-proof of `resolveRecordLabel` fallback + unit test with an unresolvable id.
3. Determinism preserved (same snapshot → identical block) → FOUNDATIONS §8 alignment check via existing golden/compile test.

## What to Change

### 1. `packages/core/src/compiler/sections/front.ts`

Replace the `onstage_entities` and `offstage_pressuring_entities` resolvers so each array value is mapped through `resolveRecordLabel(snapshot, id)` (newline-joined for onstage, matching the current line shape), falling back to the existing empty-state constant when the array is empty. Mirror the `secret_holders` pattern. Import `resolveRecordLabel` from `../labels.js` (already imported elsewhere in the package).

### 2. `docs/compiler-contract.md` §9

Add `onstage_entities` and `offstage_pressuring_entities` to the list of placeholders whose ids resolve to selected records' display labels, with the same raw-id-fallback-when-absent rule. Keep the existing wording style.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `docs/compiler-contract.md` (modify — §9)
- `packages/core/test/...` compiler front-section test (new or modify — co-located with existing front-section/compile tests)

## Out of Scope

- `entity_statuses` entity-ref-array label resolution (separate latent issue; own ticket if pursued).
- Adding a `*-not-resolved` non-blocking warning à la `pov_character` — `secret_holders`/`objects` resolve without one; keep parity (silent raw-id fallback). 
- Empty-line suppression for this block (CURSTATEOMIT-001).
- Editor surfaces (CURSTATEEDIT-001).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: a snapshot with two onstage CAST/ENTITY records renders their display labels (not UUIDs) in the `Onstage entities:` line; an offstage ref renders its label in `Offstage but pressuring entities:`.
2. Unit test: an onstage id with no matching record renders the raw id (fallback), no throw.
3. `npm test` (builds `@loom/core` then runs Vitest) passes.

### Invariants

1. No prompt-facing `<current_authoritative_state>` entity line contains a raw UUID when the referenced record exists in the selected snapshot.
2. Rendering remains a deterministic pure function of the validation snapshot (FOUNDATIONS §8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler` front-section test — assert label resolution + raw-id fallback for onstage/offstage entities.

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completed: 2026-06-08

What changed:
- Resolved `current_authoritative_state.onstage_entities` and `offstage_pressuring_entities` through the existing deterministic record-label resolver.
- Preserved the existing raw-id fallback when a referenced record is absent from the validation snapshot.
- Updated `docs/compiler-contract.md` so prompt-facing id-resolution rules include both current-state entity placeholders.
- Updated compiler-front and golden prompt coverage for label rendering.

Deviations from original plan:
- The golden first-segment prompt fixture also needed the intentional label-rendering rebaseline.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
