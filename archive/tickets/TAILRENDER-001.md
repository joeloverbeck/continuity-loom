# TAILRENDER-001: Resolve OBJECT and VISIBLE AFFORDANCE id references to display labels in the prompt

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/records-tail.ts` (objects + visible_affordances resolvers); `docs/compiler-contract.md` (§4 `{objects}`/`{visible_affordances}` rows, §9 id-derived list); `packages/core/test/compiler-tail-sections.test.ts`
**Deps**: None

## Problem

In the compiled `<locations_objects_affordances>` section, OBJECT records render their `owner`, `carried_by`, and `current_location` values as raw record IDs (UUIDs) instead of human display labels. Observed in a real project (the "The Passenger" object):

```
Objects:
- copy of Cormac McCarthy's The Passenger; ...; owner: 019ea213-8f7e-73dc-8e5b-67ba95ca94fe; carried by: 019ea213-8f7e-73dc-8e5b-67ba95ca94fe; location: 019ea1ba-d007-70e9-b279-3e88d1c575d1; visibility: visible; affordances: ...
```

This violates the compiler contract. Per `docs/compiler-contract.md` §9, record IDs are validation-only by default and "record IDs unless deliberately exposed for debugging outside the generated prompt" must not be prompt-facing. The established prompt-facing pattern for id-bearing fields (`{pov_character}`, `{secret_holders}`, `{secret_non_holders_to_protect}`) resolves ids to selected records' human display labels, with a raw-id fallback only when the referenced record is absent from the snapshot. Raw UUIDs in the prose prompt are noise that degrades the external prose writer.

The same latent leak exists in the `{visible_affordances}` resolver: VISIBLE AFFORDANCE `available_to` may be a record id and is currently rendered raw.

## Assumption Reassessment (2026-06-08)

1. **Defect location confirmed.** `packages/core/src/compiler/sections/records-tail.ts:89-101` (`objects` resolver) renders `labelValue("owner", payload.owner)`, `labelValue("carried by", payload.carried_by)`, `labelValue("location", payload.current_location)` directly on the raw payload — no id resolution. `records-tail.ts:102-112` (`visible_affordances` resolver) renders `labelValue("available to", payload.available_to)` raw.
2. **Fix helper already exists and is already used in this file.** `resolveRecordLabel(snapshot, value)` in `packages/core/src/compiler/labels.ts:8-16` returns the matched record's display label, falls back to the raw id string when no record matches, and returns `""` for empty input. `records-tail.ts:171-181` (`physicalRecordText`) already uses it for ENTITY STATUS `entity_id`/`location`, and `compiler-tail-sections.test.ts:261-268` already asserts that physical-continuity references resolve to display labels and do not render the raw id. Objects/affordances were simply missed; the import is already present at `records-tail.ts:2`.
3. **Shared contract under audit.** The prompt-section conformance contract `docs/compiler-contract.md` §9 ("Prompt-facing vs validation-only fields") enumerates which id-derived placeholders are resolved to display labels. `{objects}` and `{visible_affordances}` are absent from that list and must be added in the same change (§10 change-control rule; FOUNDATIONS §8 line 252: any empty-state/placeholder rendering rule change must update the compiler contract in the same revision).
4. **FOUNDATIONS principle restated.** §8 deterministic compilation: the compiler is a deterministic renderer. `resolveRecordLabel` is a deterministic lookup over `snapshot.records` by id; identical inputs/versions produce identical output (§29 / §907). §9 universal prompt contract: prompt-facing id-derived values resolve to human labels. This change does not weaken the secret firewall (§15): object owner/holder/location are ordinary continuity references, resolved with the exact treatment §9 already mandates for secret holders; no hidden state is introduced.
5. **Schema field references verified.** OBJECT payload fields `owner`, `carried_by`, `current_location`, `visibility_to_pov`, `usable_affordances`, `constraints` and VISIBLE AFFORDANCE `available_to` (`recordId | "group" | "any_onstage"`) are defined in `packages/core/src/records/space-material.ts`. `available_to` sentinels (`"group"`, `"any_onstage"`) are not record ids; `resolveRecordLabel` returns them unchanged (no matching record), so they render as deterministic literals — correct behavior, matching how §9 renders `all_except_holders`/`none` for `{secret_non_holders_to_protect}`.
6. **Adjacent contradiction classification.** The `available_to` raw-id leak is the same class of defect as the object fields and is fixed here as a required consequence (same resolver group, same file). The `{allowed_clues_and_surface_cues}` `discovered_by` handling lives outside this file (pressure/front sections) and is already governed by its own §4 row ("clue carriers surface only `clue_text`, not `discovered_by` ids"); it is out of scope.

## Architecture Check

1. Reuses the existing, already-proven `resolveRecordLabel` helper and the §9 id→label pattern rather than introducing a new resolution path. This makes OBJECT/VISIBLE AFFORDANCE id rendering consistent with `{pov_character}`, `{secret_holders}`, and physical-continuity references — one canonical id-resolution rule across the compiler.
2. No backwards-compatibility aliasing or shims. The raw-id fallback inside `resolveRecordLabel` is the intended deterministic degradation (referenced record absent from the snapshot), not a compatibility shim.

## Verification Layers

1. OBJECT `owner`/`carried_by`/`current_location` referencing selected records render display labels, not UUIDs -> Vitest unit assertion in `compiler-tail-sections.test.ts`.
2. Raw-id fallback when a referenced record is absent from the snapshot -> Vitest unit assertion (object referencing an unselected id renders the raw id, matching §9 fallback semantics).
3. VISIBLE AFFORDANCE `available_to` recordId resolves to a label while `"group"`/`"any_onstage"` sentinels render as literals -> Vitest unit assertion.
4. `{objects}` and `{visible_affordances}` appear in the §9 id-derived resolution list -> codebase grep-proof against `docs/compiler-contract.md` + prompt-section conformance (schema validation) review.
5. Deterministic compilation preserved -> FOUNDATIONS §8 alignment check (lookup is pure over `snapshot.records`).

## What to Change

### 1. Resolve object id fields to display labels

In `packages/core/src/compiler/sections/records-tail.ts`, the `objects` resolver (lines 89-101) wraps the id-bearing values in `resolveRecordLabel`:

```ts
labelValue("owner", resolveRecordLabel(snapshot, payload.owner)),
labelValue("carried by", resolveRecordLabel(snapshot, payload.carried_by)),
labelValue("location", resolveRecordLabel(snapshot, payload.current_location)),
```

`labelValue` already suppresses empty/`"none"` values, so an unset reference still renders nothing. (`resolveRecordLabel` is already imported at line 2.)

### 2. Resolve visible-affordance `available_to`

In the `visible_affordances` resolver (lines 102-112), wrap `available_to`:

```ts
labelValue("available to", resolveRecordLabel(snapshot, payload.available_to)),
```

Sentinels `"group"`/`"any_onstage"` have no matching record and pass through as literals. (No id fields exist in `renderUnavailableActions`'s affordance projection, so it is unchanged.)

### 3. Update the compiler contract

In `docs/compiler-contract.md`:
- §9 "Prompt-facing only ... id-derived values": add `{objects}` (owner/carried_by/current_location) and `{visible_affordances}` (`available_to`) to the set of placeholders whose entity/location ids are resolved to selected records' display labels before rendering, with raw-id fallback when the referenced record is absent, and noting `available_to` sentinels render as literals.
- §4 Notes column: amend the `{objects}` row ("Owner/carried_by/current_location/visibility must align.") and the `{visible_affordances}` row to state that id references resolve to display labels with raw-id fallback.

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)

## Out of Scope

- Whether `current_authoritative_state.current_locks` deserves a dedicated UI editor field (separate concern; no UI change here).
- `{allowed_clues_and_surface_cues}` / `discovered_by` id handling (different section, already governed by its own §4 row).
- Empty-section / "None specified" omission — handled by TAILRENDER-002.
- Any change to record schemas or stored data; this is render-only.

## Acceptance Criteria

### Tests That Must Pass

1. New/updated assertions in `packages/core/test/compiler-tail-sections.test.ts`: an OBJECT whose `owner`/`carried_by`/`current_location` reference selected records renders those records' display labels (not UUIDs) in `locations_objects_affordances`; an object referencing an id absent from the snapshot renders the raw id (fallback); a VISIBLE AFFORDANCE with `available_to` set to a selected record id renders its label, and with `available_to: "any_onstage"` renders the literal.
2. `npm test` (builds `@loom/core` first, then Vitest) passes.
3. `npm run lint && npm run typecheck` pass.

### Invariants

1. No raw record-id (UUID) appears in `{objects}` or `{visible_affordances}` output for references resolvable within the selected snapshot.
2. Compilation remains deterministic: identical snapshot + versions produce identical prompt output.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — extend the existing "renders populated ... objects, affordances ..." case (or add a focused case) to assert object owner/carried_by/current_location label resolution and the raw-id fallback, mirroring the existing physical-continuity label-resolution test at lines 261-268.

### Commands

1. `npm test -- compiler-tail-sections` (targeted: the resolver under change).
2. `npm test && npm run lint && npm run typecheck` (full pre-completion gate).

## Outcome

Completed: 2026-06-08

Changed:
- Resolved OBJECT `owner`, `carried_by`, and `current_location` ids through the existing deterministic display-label resolver.
- Resolved VISIBLE AFFORDANCE `available_to` ids through the same resolver while preserving literal sentinel output.
- Updated compiler contract language and golden prompt output for the new prompt-facing label rendering.
- Added compiler-tail coverage for selected-record label resolution and absent-record raw-id fallback.

Deviations:
- The frozen demo golden prompt baseline also changed because it intentionally captures prompt-facing object output.

Verification:
- `npm test -- compiler-tail-sections` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
