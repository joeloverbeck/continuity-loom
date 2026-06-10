# CURSTATELABEL-003: Resolve `entity_statuses` record-id arrays to display labels in `<current_authoritative_state>` and `{physical_continuity}`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` resolver; `packages/core/src/compiler/sections/records-tail.ts` physical-continuity state lines; `docs/compiler-contract.md` §9 resolved-label list; golden prompt fixture rebaseline if affected
**Deps**: None. File-adjacent to `tickets/CURSTATELABEL-002.md` (both touch the same two compiler files); implement in either order.

## Problem

`current_authoritative_state.entity_statuses` accepts prose or an array of ENTITY STATUS record ids (`packages/core/src/records/generation-brief.ts:41`, `z.union([nonemptyString, z.array(recordId)])`). When the user supplies record ids, the compiled prompt renders the raw UUIDs instead of the records' display labels, in two sections:

- the `Entity statuses:` line of `<current_authoritative_state>` (`front.ts:72-73` renders via `valueOrEmpty` with no record lookup);
- the `statuses:` state line of `{physical_continuity}` (`records-tail.ts:152` renders `state.entity_statuses` via `labelValue` with no record lookup).

Raw UUIDs are noise to the generating model. This is the latent issue `archive/tickets/CURSTATELABEL-001.md` explicitly recorded as deferred ("separate latent issue; own ticket if pursued" — its Assumption Reassessment item 6 and Out of Scope); this ticket actions that standing deferral with user authorization (2026-06-10).

## Assumption Reassessment (2026-06-10)

1. **Code**: `front.ts:72-73` resolves the `entity_statuses` placeholder via `valueOrEmpty(...)` only. `records-tail.ts:145-160` (`renderPhysicalContinuity`) renders `state.entity_statuses` raw at line 152. The sibling `onstage_entities`/`offstage_pressuring_entities` resolvers already route id arrays through `renderEntityReferenceList(snapshot, ids)` (`front.ts:53-57,63-70`), which maps each id through `resolveRecordLabel` (`packages/core/src/compiler/labels.ts:8-16`) — the exact mechanism needed for the recordId-array branch.
2. **Docs**: `docs/compiler-contract.md:108` (§4 `{entity_statuses}` row) already names "CURRENT AUTHORITATIVE STATE.entity_statuses + ENTITY STATUS records" as the deterministic source, and `docs/story-record-schema.md:178` describes the field as "prose or **compiled ENTITY STATUS list**" — both support label compilation. The §9 resolved-label placeholder list (`docs/compiler-contract.md:284`) does **not** include `{entity_statuses}`; this ticket adds it (additive amendment, mirroring CURSTATELABEL-001's §9 change). §10 same-change rule: contract, compiler tests, and golden baseline (if affected) update in this revision.
3. **Shared boundary under audit**: the id→label resolution contract for prompt-facing record references, shared between the compiler resolvers and `docs/compiler-contract.md` §4/§9 (cross-artifact ticket). Both must agree after this change.
4. **FOUNDATIONS principle**: §8 deterministic compilation — label resolution is a pure lookup against the validation snapshot; §9 universal prompt contract — prompt-facing references render human-readable. No validation behavior changes.
5. **Deterministic-compilation enforcement surface**: `compilePrompt` rendering only. No validation rule, gate, or secret-firewall surface is touched; substituting display labels for ids already present in the prompt cannot weaken fail-closed behavior (§4.5) or the secret firewall (§15).
6. **Schema/consumers**: render-only change; the `entity_statuses` union is unchanged and no store/UI consumer is affected. The prose branch (`nonemptyString`) must continue to render verbatim — only the `recordId[]` branch gains resolution.
7. **Label-derivation check (verified)**: `deriveFullDisplayLabel` returns the first non-empty field from `labelFieldsByType["ENTITY STATUS"] = ["current_activity", "entity_id"]` (`packages/core/src/records/editor-descriptors.ts:125,171-181`). `current_activity` is a required `nonemptyString` (`packages/core/src/records/entity.ts:50`), so the resolved label is always the activity prose; the raw-`entity_id` fallback branch is unreachable for schema-valid records. No nested-resolution work is needed.
8. **Adjacent contradictions (classified)**: `specs/SPEC-019` D3 adds *validation* for recordId-form `entity_statuses` (existence/type checks, context-gated severity) — the validation side of the same field; render fix and validation rules are independent and land in either order. No other unresolved current-state line remains after CURSTATELABEL-002 and this ticket.

## Architecture Check

1. Reuses `renderEntityReferenceList`/`resolveRecordLabel` for the array branch rather than a parallel resolution path — identical mechanism and raw-id fallback to the onstage/offstage lines fixed by CURSTATELABEL-001, keeping id-resolution behavior uniform across the prompt. The union needs one branch test (string → verbatim; array → resolve-and-join), matching how the field is already type-narrowed elsewhere.
2. No backwards-compatibility aliasing/shims introduced. The unresolved rendering is replaced, not aliased.

## Verification Layers

1. RecordId-array `entity_statuses` renders display labels (not UUIDs) in both `<current_authoritative_state>` and `{physical_continuity}` → new/extended unit tests + prompt-section conformance against amended `docs/compiler-contract.md` §9.
2. Prose `entity_statuses` renders verbatim (string branch untouched) → unit test with a prose value.
3. A dangling id falls back to the raw id without throwing (parity with all resolved placeholders) → unit test with an unresolvable id.
4. Determinism preserved (same snapshot → identical prompt); any golden change is an intentional reviewed rebaseline → FOUNDATIONS §8 alignment check via golden/compile tests.

## What to Change

### 1. `packages/core/src/compiler/sections/front.ts`

In the `entity_statuses` resolver, branch on the union: arrays route through `renderEntityReferenceList(snapshot, ids)` (matching the onstage/offstage line shape); strings keep the current verbatim path. Empty-state behavior is unchanged.

### 2. `packages/core/src/compiler/sections/records-tail.ts`

In `renderPhysicalContinuity`, apply the same branch to `state.entity_statuses` before `labelValue("statuses", ...)`, resolving array entries through `resolveRecordLabel(snapshot, id)`.

### 3. `docs/compiler-contract.md`

§9: add `{entity_statuses}` to the resolved-label placeholder list, noting that only the recordId-array branch resolves (prose values pass through verbatim) with the standard raw-id-fallback-when-absent rule. No §4 change — row 108 already names ENTITY STATUS records as a source. No version bump (parity with CURSTATELABEL-001/-002: rendering conformance fixes rebaseline the golden without bumping compiler/contract versions).

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify — §9)
- `packages/core/test/` front-section and tail/physical-continuity compiler tests (modify or add, co-located with existing coverage)
- golden prompt fixture (intentional rebaseline only if the fixture exercises a recordId-array `entity_statuses`)

## Out of Scope

- `current_location` label resolution (CURSTATELABEL-002).
- Validation of `entity_statuses` references (existence/type/selection checks) — `specs/SPEC-019` D3.
- Any warning for unresolved ids (SPEC-019's severity doctrine governs that surface).
- Changing the ENTITY STATUS display-label derivation (e.g. embedding the entity's name); label design is a separate concern.
- Empty-state or section-structure changes.

## Acceptance Criteria

### Tests That Must Pass

1. Unit test: a snapshot whose `entity_statuses` is an array of selected ENTITY STATUS ids renders their display labels (each record's `current_activity`) in the `Entity statuses:` line and the `{physical_continuity}` `statuses:` line — no UUID in either.
2. Unit test: a prose `entity_statuses` value renders verbatim in both sections.
3. Unit test: a dangling id in the array renders as the raw id without throwing.
4. `npm test` (builds `@loom/core`, then Vitest), `npm run lint`, `npm run typecheck` pass.

### Invariants

1. No prompt-facing `entity_statuses` line contains a raw record id when the referenced record exists in the selected snapshot.
2. Rendering remains a deterministic pure function of the validation snapshot (FOUNDATIONS §8); identical snapshots produce identical prompts.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — array-branch label resolution, prose passthrough, and raw-id fallback for the `entity_statuses` placeholder.
2. Tail/physical-continuity compiler test (co-located with existing records-tail coverage) — same three cases for the `{physical_continuity}` statuses line.
3. `packages/core/test/compiler-golden.test.ts` — assert unchanged, or intentional rebaseline if the fixture uses a recordId-array `entity_statuses`.

### Commands

1. `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test && npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-10

What changed:
- `current_authoritative_state.entity_statuses` now resolves record-id arrays to display labels in `<current_authoritative_state>` and `{physical_continuity}`.
- Prose `entity_statuses` values still pass through verbatim, and dangling ids in arrays still render raw without throwing.
- `docs/compiler-contract.md` §9 now lists `{entity_statuses}` as prompt-facing id-derived output and documents the array-only resolution branch.
- Front-section, tail-section, and frozen golden prompt coverage were updated.

Deviations from original plan:
- The frozen demo prompt used a record-id array in `entity_statuses`, so the golden fixture was intentionally rebaselined.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-tail-sections.test.ts packages/core/test/compiler-golden.test.ts` — passed.
- `npm test` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed, with Vite's chunk-size warning.
