# SPEC003TYPDATMOD-003: Entity & entity-status schemas

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` payload schemas for ENTITY and ENTITY STATUS; registry registration; reference extractors; exports from `packages/core/src/index.ts`.
**Deps**: SPEC003TYPDATMOD-001

## Problem

ENTITY and ENTITY STATUS define what can hold state or exert pressure and track current operational state (life, agency, location, visibility). They are the identity targets most other records reference, and ENTITY STATUS is load-bearing for later validation (e.g. an active PLAN held by an incapacitated entity). Phase 3 needs their runtime schemas + reference projections.

## Assumption Reassessment (2026-06-05)

1. The substrate from SPEC003TYPDATMOD-001 exists (`registry.ts`, `references.ts`, `metadata.ts`, exports). This ticket registers two definitions and their extractors.
2. Field names from `docs/story-record-schema.md` §4.1 (ENTITY: `id`, `display_name`, `entity_kind` enum, `roles_in_story` enum list, `short_description`) and §4.2 (ENTITY STATUS: `entity_id`, `life`, `agency`, `location`, `visibility_to_pov`, `current_activity`). ENTITY STATUS has **no** `status` field — its common-metadata `status` projection is `NULL`.
3. Cross-artifact boundary: ENTITY STATUS's `entity_id` and `location` are reference projections consumed by the server's `record_references` refresh (ticket 011) and, later, Phase-6 validation. `target_id` is a denormalized projection, not a SQL foreign key (SPEC-003 §Approach).
4. FOUNDATIONS §16 (physical continuity) motivates ENTITY STATUS: `location`/`visibility_to_pov`/`agency` are the substrate validation later uses to block impossible movement/perception. Restated: Phase 3 stores these fields faithfully; it enforces nothing yet.
5. Reference roles emitted: ENTITY → none (it is a target, not a source, beyond optional role tags); ENTITY STATUS → `entity_id` (the subject) and `location` (when a `location_id`).

## Architecture Check

1. Modeling ENTITY STATUS as a separate atomic record (not folded into ENTITY) matches `docs/story-record-schema.md` and FOUNDATIONS §13 atomic-record economy: status changes without rewriting identity.
2. No backwards-compatibility shims — new schemas only.

## Verification Layers

1. ENTITY / ENTITY STATUS schemas match `docs/story-record-schema.md` §4 field names + enums -> schema validation test (accept valid fixtures; reject bad enum values, unknown keys).
2. ENTITY STATUS emits `entity_id` + `location` reference projections -> unit test on `extractReferences`.
3. Both types present in the registry -> registry iteration test.

## What to Change

### 1. Schemas

Add `packages/core/src/records/entity.ts`: Zod `.strict()` schemas for ENTITY (§4.1) and ENTITY STATUS (§4.2), with the documented enums.

### 2. Registry + extractors

Register both. ENTITY STATUS extractor emits `{ refRole: "entity_id", targetId }` and `{ refRole: "current_location", targetId }` (when location is an id).

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/entity.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register two definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/entity.test.ts` (new)

## Out of Scope

- CAST MEMBER (person-like rich dossier) — ticket 004.
- DDL / repository / reference-integrity behavior — tickets 010/011.
- Validation of entity-status contradictions — Phase 6.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — ENTITY/ENTITY STATUS accept valid fixtures, reject bad enums + unknown keys; ENTITY STATUS reference extraction covered.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. ENTITY STATUS carries no `status` field; its enums match `docs/story-record-schema.md` §4.2.
2. ENTITY STATUS produces `entity_id` and `current_location` reference projections.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/entity.test.ts` — accept/reject + reference-extractor coverage for ENTITY STATUS.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
