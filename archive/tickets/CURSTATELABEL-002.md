# CURSTATELABEL-002: Resolve `current_location` record ids to display labels in `<current_authoritative_state>` and `{physical_continuity}`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` resolver; `packages/core/src/compiler/sections/records-tail.ts` physical-continuity state lines; `docs/compiler-contract.md` §9 resolved-label list; golden prompt fixture rebaseline
**Deps**: None (independent of `specs/SPEC-019`; see Assumption Reassessment item 7 for coordination)

## Problem

`current_authoritative_state.current_location` accepts a LOCATION record id or a prose scene-space label (`packages/core/src/records/generation-brief.ts:33`). When the user picks a LOCATION record, the compiled prompt renders the raw record id instead of the location's display label, in two sections:

- the `Location:` line of `<current_authoritative_state>` (`front.ts:51-52` renders via `valueOrEmpty` with no record lookup);
- the `location:` state line of `{physical_continuity}` (`records-tail.ts:150` renders `state.current_location` via `labelValue` with no record lookup).

This diverges from the compiler contract, which already specifies the resolved behavior: the `{current_location}` §4 row reads "CURRENT AUTHORITATIVE STATE.current_location **+ selected LOCATION label if present**" (`docs/compiler-contract.md:103`). Raw UUIDs are noise to the generating model — the same defect class CURSTATELABEL-001 fixed for `onstage_entities`/`offstage_pressuring_entities` (`archive/tickets/CURSTATELABEL-001.md`).

## Assumption Reassessment (2026-06-10)

1. **Code**: `front.ts:51-52` resolves the `current_location` placeholder via `valueOrEmpty(...)` only — no record lookup. `records-tail.ts:145-160` (`renderPhysicalContinuity`) renders `state.current_location` raw at line 150. The shared helper `resolveRecordLabel` (`packages/core/src/compiler/labels.ts:8-16`) already implements exactly the needed semantics: selected-record id → display label; any other string (prose label, unselected/dangling id) → returned verbatim. Sibling lines in the same section already use it (onstage/offstage entities via CURSTATELABEL-001; the OBJECT `current_location` field at `records-tail.ts:96`).
2. **Docs**: `docs/compiler-contract.md` §4 `{current_location}` row (line 103) already specifies "+ selected LOCATION label if present" — the contract is ahead of the code. The §9 resolved-label placeholder list (line 284) does **not** include `{current_location}`; this ticket adds it (additive amendment), mirroring CURSTATELABEL-001's §9 change. §10 same-change rule: contract, compiler tests, and golden baseline update in this revision.
3. **Shared boundary under audit**: the id→label resolution contract for prompt-facing record references, shared between the compiler resolvers and `docs/compiler-contract.md` §4/§9. Both must agree after this change (cross-artifact ticket).
4. **FOUNDATIONS principle**: §8 deterministic compilation — label resolution is a pure lookup against the validation snapshot, so determinism is preserved; §9 universal prompt contract — prompt-facing references render human-readable. No validation behavior changes.
5. **Deterministic-compilation enforcement surface**: `compilePrompt` rendering only. No validation rule, gate, or secret-firewall surface is touched; the change cannot weaken fail-closed behavior (§4.5) or the secret firewall (§15) because it only substitutes a display label for an id already present in the prompt.
6. **Schema/consumers**: render-only change. `current_location: z.union([recordId, nonemptyString])` is unchanged; no schema, store, or UI consumer is affected.
7. **Adjacent contradictions (classified)**: (a) `entity_statuses` recordId-array variant also renders raw (`front.ts:66-67`, `records-tail.ts:152`) — this is the separate future cleanup CURSTATELABEL-001 explicitly deferred ("own ticket if pursued"); it remains out of scope here. (b) `specs/SPEC-019` D3 adds *validation* for `current_location` references (type/selection checks); that is the validation side of the same field and lands independently — neither change depends on the other, and both treat "value not matching any project record" as a prose label.

## Architecture Check

1. Reuses the existing `resolveRecordLabel` helper at both render sites rather than introducing a parallel resolution path — identical mechanism and fallback semantics to every other resolved placeholder, so the prompt's id-resolution behavior stays uniform. The union type needs no special-casing: prose values match no record and pass through verbatim by the helper's existing fallback.
2. No backwards-compatibility aliasing/shims introduced. The unresolved rendering is replaced, not aliased.

## Verification Layers

1. Selected LOCATION id renders as its display label in both `<current_authoritative_state>` and `{physical_continuity}` → new/extended unit tests + prompt-section conformance against `docs/compiler-contract.md` §4 row 103 / amended §9.
2. Prose scene-space value passes through verbatim (no lookup side effects) → unit test with a non-id string.
3. Unresolvable id falls back to the raw id without throwing (parity with all resolved placeholders) → unit test with a dangling id.
4. Determinism preserved (same snapshot → identical prompt) and the output change is intentional → golden prompt fixture rebaseline reviewed as part of this diff (FOUNDATIONS §8 alignment check).

## What to Change

### 1. `packages/core/src/compiler/sections/front.ts`

Route the `current_location` placeholder value through `resolveRecordLabel(snapshot, value)` before the existing `valueOrEmpty` empty-state handling, mirroring the onstage/offstage resolver shape from CURSTATELABEL-001. Empty-state behavior (`empty-states.ts:24`) is unchanged.

### 2. `packages/core/src/compiler/sections/records-tail.ts`

In `renderPhysicalContinuity`, render `state.current_location` through `resolveRecordLabel(snapshot, ...)` (the function already receives the snapshot), matching the OBJECT `current_location` treatment at line 96.

### 3. `docs/compiler-contract.md`

§9: add `{current_location}` to the resolved-label placeholder list with the standard raw-id-fallback-when-absent wording, and note the prose-label passthrough (a value matching no selected record renders verbatim). No §4 change — the row already specifies the resolved behavior. No version bump (parity with CURSTATELABEL-001: rendering conformance fixes rebaseline the golden without bumping compiler/contract versions).

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify — §9)
- `packages/core/test/` front-section and physical-continuity/tail compiler tests (modify or add, co-located with existing coverage)
- golden prompt fixture (intentional rebaseline)

## Out of Scope

- `entity_statuses` recordId-array label resolution (CURSTATELABEL-001's recorded deferral; own ticket if pursued).
- Validation of `current_location` references (type/selection/dangling checks) — `specs/SPEC-019` D3.
- Any warning for unresolved ids (SPEC-019's severity doctrine governs that surface).
- Empty-state or section-structure changes.

## Acceptance Criteria

### Tests That Must Pass

1. Unit test: a snapshot whose `current_location` is a selected LOCATION record id renders the location's display label in the `<current_authoritative_state>` `Location:` line and the `{physical_continuity}` `location:` line — no UUID in either.
2. Unit test: a prose `current_location` ("the mill loft at dusk") renders verbatim in both sections.
3. Unit test: a dangling id renders as the raw id without throwing.
4. `npm test` (builds `@loom/core`, then Vitest), `npm run lint`, `npm run typecheck` pass.

### Invariants

1. No prompt-facing `current_location` line contains a raw record id when the referenced record exists in the selected snapshot.
2. Rendering remains a deterministic pure function of the validation snapshot (FOUNDATIONS §8); identical snapshots produce identical prompts.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — label resolution, prose passthrough, and raw-id fallback for the `current_location` placeholder.
2. Tail/physical-continuity compiler test (co-located with existing records-tail coverage) — same three cases for the `{physical_continuity}` state line.
3. `packages/core/test/compiler-golden.test.ts` — intentional rebaseline if the golden fixture uses a record-id `current_location`; otherwise assert unchanged.

### Commands

1. `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test && npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-10

What changed:
- `current_authoritative_state.current_location` now resolves selected record ids to display labels in `<current_authoritative_state>` and `{physical_continuity}`.
- Prose scene-space values still pass through verbatim, and dangling ids still render raw without throwing.
- `docs/compiler-contract.md` §9 now lists `{current_location}` as prompt-facing id-derived output.
- Front-section, tail-section, and frozen golden prompt coverage were updated.

Deviations from original plan:
- The frozen demo prompt used the affected location field, so the golden fixture was intentionally rebaselined.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-tail-sections.test.ts packages/core/test/compiler-golden.test.ts` — passed.
- `npm test` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed, with Vite's chunk-size warning.
