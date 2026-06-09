# CURSTATEEDIT-001: Add editor widgets for the 11 missing authoritative-state fields

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `packages/web/src/generation-brief/GenerationBriefView.tsx` editor surface
**Deps**: None functionally. Best landed alongside CURSTATEOMIT-001 so newly-fillable optional fields are suppressed when left blank (not required).

## Problem

`<current_authoritative_state>` documents 15 fields, but the generation-brief editor only exposes 4 of them (`current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`). The other 11 are defined in the draft schema and consumed by the compiler, yet there is **no UI to fill them** — so they are permanently empty and unreachable. The writer cannot author positions, possessions, routes/exits, locks, etc., even though the prompt contract supports them.

## Assumption Reassessment (2026-06-08)

1. **Code (editor gap confirmed)**: only four `name="generationSession.current_authoritative_state.*"` input widgets exist (`packages/web/src/generation-brief/GenerationBriefView.tsx:377-424`): `current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`. The other eleven appear in the file only inside the `updateCurrentAuthoritativeState` state-preservation spread (`GenerationBriefView.tsx:244-253`) — read/preserved, never editable. `grep -rn 'name="generationSession.current_authoritative_state\.'` returns exactly those four.
2. **Schema (target exists, additive)**: all eleven fields already exist in the draft schema (`packages/core/src/records/generation-brief-draft.ts:41-51`):
   - `offstage_pressuring_entities: z.array(recordId).optional()`
   - `positions: z.union([draftString, z.array(draftString)]).optional()`
   - `possessions: z.union([draftString, z.array(draftString)]).optional()`
   - `visible_conditions: z.array(draftString).optional()`
   - `environmental_conditions: draftString.optional()`
   - `entity_statuses: z.union([draftString, z.array(recordId)]).optional()`
   - `line_of_sight_and_visibility: draftString.optional()`
   - `routes_and_exits: z.array(draftString).optional()`
   - `available_time: draftString.optional()`
   - `consent_or_force_conditions: z.union([draftString, z.literal("none")]).optional()`
   - `current_locks: z.array(draftString).optional()`
   No schema change required — this ticket only adds UI that writes already-valid shapes.
3. **Docs**: all eleven are documented authoritative-state fields (`docs/compiler-contract.md` lines 102–112). Adding editors closes a UI/schema gap, not a contract change. `docs/story-record-schema.md` / `docs/user-guide.md` may warrant a follow-up note but are not blocking.
4. **FOUNDATIONS principle**: §4 — records and user-authored generation-time fields are the continuity authority; exposing them for authoring serves that principle. No determinism or secret-firewall surface is touched (pure editor input).
5. **Schema consumers**: the save path `updateCurrentAuthoritativeState` (`GenerationBriefView.tsx:237-255`) already spreads all fields into the payload, and the compiler resolvers (`front.ts:65-92`) already read them. Adding widgets requires only new `onChange` handlers; no consumer changes.
6. **Existing widget patterns to reuse**: entity-ref multi-select → `onstage_entities` using `povEntities` (`GenerationBriefView.tsx:397-410`); string-array textarea via `splitLines`/`join("\n")` → `must_render` (`GenerationBriefView.tsx:462-466`); plain string → `current_time` input / `immediate_situation_summary` textarea; each field already has a `BriefFieldHelp` registry entry path convention.

## Architecture Check

1. Reuses existing editor patterns (multi-select with `povEntities`, `splitLines` textareas, plain inputs) and the existing `updateCurrentAuthoritativeState` updater — no new state plumbing or schema work, so the change is purely additive UI.
2. No backwards-compatibility aliasing/shims. Fields already round-trip through state; this only surfaces them.

## Widget mapping (per field)

| Field | Schema shape | Widget |
|---|---|---|
| `offstage_pressuring_entities` | `recordId[]` | multi-`select` over `povEntities` (mirror `onstage_entities`) |
| `entity_statuses` | `string \| recordId[]` | `textarea` (free-text variant) |
| `positions` | `string \| string[]` | `textarea` (free-text variant) |
| `possessions` | `string \| string[]` | `textarea` (free-text variant) |
| `visible_conditions` | `string[]` | `textarea` + `splitLines` |
| `routes_and_exits` | `string[]` | `textarea` + `splitLines` |
| `current_locks` | `string[]` | `textarea` + `splitLines` |
| `environmental_conditions` | `string` | `input`/`textarea` |
| `line_of_sight_and_visibility` | `string` | `textarea` |
| `available_time` | `string` | `input` |
| `consent_or_force_conditions` | `string \| "none"` | `input` (default `"none"`) |

(For the union fields, author the simpler lawful variant — free-text for `entity_statuses`/`positions`/`possessions`. Surfacing the entity-ref-array variant of those is out of scope.)

## What to Change

### 1. `packages/web/src/generation-brief/GenerationBriefView.tsx`

In the `CURRENT AUTHORITATIVE STATE` section (`<section ... aria-labelledby="current-state-brief">`, lines 371-425), add a labelled widget + `onChange` (calling `updateCurrentAuthoritativeState({ <field>: ... })`) + `BriefFieldHelp` for each of the eleven fields per the widget table. Reuse `povEntities` for the entity multi-select and `splitLines` for string-array textareas.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/...` BriefFieldHelp content registry (modify — add help entries for the new field paths, following existing entries)
- `packages/web/test/...` GenerationBriefView test (modify/new — assert widgets render and persist)

## Out of Scope

- Schema changes (fields already exist and are additive-optional).
- Entity-ref-array variants of `entity_statuses`/`positions`/`possessions` (free-text only here).
- Prompt rendering changes — entity labels (CURSTATELABEL-001) and empty-line suppression (CURSTATEOMIT-001).
- Validation-rule changes.

## Acceptance Criteria

### Tests That Must Pass

1. Component test: each of the eleven fields renders an editable widget in the current-authoritative-state section.
2. Component test: editing a field (e.g. `routes_and_exits`) and saving persists it into the generation brief draft and survives reload.
3. `npm test` passes; `npm run lint && npm run typecheck` pass.

### Invariants

1. All 15 documented `current_authoritative_state` fields are user-editable from the generation-brief editor.
2. Saved values conform to the existing draft schema (`generation-brief-draft.ts:41-51`) with no schema modification.

## Test Plan

### New/Modified Tests

1. `packages/web/test` GenerationBriefView test — render + persist coverage for the eleven new widgets.

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completed: 2026-06-08

What changed:
- Added generation-brief editor controls for the eleven previously unreachable `current_authoritative_state` fields.
- Reused existing entity multi-select, plain input, and textarea patterns; free-text union fields author the string variant.
- Added component coverage that all 15 documented current-state fields render as editable widgets with help controls.
- Added save/reload coverage for `routes_and_exits`, including validation against the existing draft schema.

Deviations from original plan:
- No field-help registry change was needed because guidance entries for the new field paths already existed in `@loom/core`.

Verification:
- `npm exec -- vitest run packages/web/src/generation-brief/GenerationBriefView.test.tsx` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
