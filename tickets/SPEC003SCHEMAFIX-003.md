# SPEC003SCHEMAFIX-003: Restore global story-config field fidelity (tone, pov_character)

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/global-config.ts` STORY CONTRACT `tone`, PROSE MODE `pov_character`.
**Deps**: None (corrects SPEC-003, archived/completed)

## Problem

Two global story-config fields drifted from `docs/story-record-schema.md` §2:

1. **STORY CONTRACT `tone`** is typed `nonemptyString` (`global-config.ts:12`), but §2.1 declares `tone: prose or tag list`. Its sibling `genre_mode` correctly allows `string | string[]` (line 11); `tone` should match. The tag-list authoring path is silently unavailable.
2. **PROSE MODE `pov_character`** is typed `z.union([optionalRecordId, z.enum(["omniscient","variable"])])` (`global-config.ts:41`). `optionalRecordId` is `z.uuid().optional()`, so the field can be **omitted entirely**, but §2.3 declares it required (`pov_character: entity_id | omniscient | variable`) and §2.3 prompt treatment makes POV always-included. A missing `pov_character` would let a PROSE MODE singleton validate without the POV anchor the non-omniscient POV knowledge profile (§6.4) depends on.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/global-config.ts:12` (`tone: nonemptyString`), `:41` (`pov_character` union with `optionalRecordId`). `optionalRecordId`/`recordId` defined in `common.ts:7–8`.
2. Authoritative fields: `docs/story-record-schema.md` §2.1 (`tone: prose or tag list`) and §2.3 (`pov_character: entity_id | omniscient | variable`, required, always-included prompt treatment).
3. Schema under audit: STORY CONTRACT and PROSE MODE singletons, consumed by the server `story_config` singleton accessors (`@loom/server`) and PROSE MODE's `extractReferences` (`global-config.ts:71–77`), which emits a `pov_character` reference when it is an entity id. Making `pov_character` required does not change the extractor's `omniscient`/`variable` guard.
4. FOUNDATIONS principle restated: §13 field economy (fields carry their authored shape) and §15 POV/knowledge (POV must be anchored). `pov_character` is the POV anchor; allowing its omission weakens the POV substrate §15/§6.4 build on.
5. Schema-extension classification: `tone` widens (additive — string still accepted, array newly accepted); `pov_character` tightens (a previously-omittable field becomes required). The tightening is safe — no released store, no consumer reads a PROSE MODE singleton yet — and is the correct end-state per §2.3.
6. `pov_character` end-state: `z.union([recordId, z.enum(["omniscient","variable"])])` (non-optional). Use `recordId` (= `z.uuid()`), not `optionalRecordId`.

## Architecture Check

1. Mirroring `genre_mode`'s `string | string[]` union for `tone`, and dropping the stray `.optional()` from `pov_character`, makes the two singletons transcribe §2 exactly — no special-case authoring rules, no optional POV anchor.
2. No backwards-compatibility shim — the optional `pov_character` form is removed outright, not retained.

## Verification Layers

1. STORY CONTRACT accepts both a prose `tone` and a `string[]` `tone` -> schema validation test.
2. PROSE MODE rejects a payload omitting `pov_character` -> schema validation test.
3. PROSE MODE with a UUID `pov_character` still emits the `pov_character` reference; `omniscient`/`variable` emit none -> unit test on `extractReferences`.

## What to Change

### 1. `tone` union

`global-config.ts` STORY CONTRACT: `tone: z.union([nonemptyString, z.array(nonemptyString)])`.

### 2. `pov_character` required

`global-config.ts` PROSE MODE: `pov_character: z.union([recordId, z.enum(["omniscient", "variable"])])` (replace `optionalRecordId`; import `recordId`). Adjust the `extractReferences` narrowing if the type change requires it (the existing `!== "omniscient" && !== "variable"` guard still holds).

## Files to Touch

- `packages/core/src/records/global-config.ts` (modify)
- `packages/core/test/records.test.ts` (modify — tone array case, pov_character required case)

## Out of Scope

- UNIVERSAL CONTENT POLICY (five fields, already correct).
- Content-envelope validation / `NO RESTRICTIONS` ban — Phase 6.
- Compiling STORY CONTRACT / PROSE MODE into prompt sections — Phase 7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — STORY CONTRACT accepts `tone` as string and as `string[]`; PROSE MODE rejects a payload without `pov_character` and still extracts a `pov_character` reference for a UUID value.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. `tone` accepts both authored forms in §2.1; `pov_character` is non-optional per §2.3.
2. PROSE MODE `extractReferences` emits a `pov_character` reference only for entity-id values.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — `tone` array acceptance; `pov_character` required rejection; `pov_character` reference extraction.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
