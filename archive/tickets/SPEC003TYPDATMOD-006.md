# SPEC003TYPDATMOD-006: Space & material schemas (LOCATION, OBJECT, VISIBLE AFFORDANCE)

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` payload schemas for LOCATION, OBJECT, VISIBLE AFFORDANCE; status enums; reference extractors; registry registration; exports.
**Deps**: SPEC003TYPDATMOD-001

## Problem

LOCATION, OBJECT, and VISIBLE AFFORDANCE preserve physical possibility, possession, line of sight, routes, and what can/cannot happen now. They are the substrate for physical-continuity validation (Phase 6) and the physical-continuity prompt sections (Phase 7). Phase 3 needs their runtime schemas and the object→holder/location reference projections that later detect "two holders for one object" / "two current locations for one entity."

## Assumption Reassessment (2026-06-05)

1. Substrate from SPEC003TYPDATMOD-001 exists. This ticket registers three definitions.
2. Field names + status enums from `docs/story-record-schema.md`: LOCATION §7.1 (`status: active|inactive|destroyed|inaccessible`; `label`, `access_routes`, …); OBJECT §7.2 (`status: active|lost|destroyed|transferred|inactive`; `owner`, `carried_by`, `current_location`, `usable_affordances`, `durability`); VISIBLE AFFORDANCE §7.3 (`status: available|blocked|unavailable`; `available_to`, `action_families` enum list, `risk`, `durability`, `prompt_text`).
3. Cross-artifact boundary: OBJECT's `owner`/`carried_by`/`current_location` projections feed `record_references` (ticket 011) and the Phase-6 holder/location contradiction blockers. `current_location` may be the literal `carried_by_holder` sentinel (not an id) — emit a projection only for real ids.
4. FOUNDATIONS §16 (physical continuity) motivates these: the schema must preserve possession, routes, visibility, and unavailable/impossible affordances. Restated: Phase 3 stores them; Phase 6 blocks on impossibility.
5. Reference roles: OBJECT → `owner`, `carried_by`, `current_location` (when ids); VISIBLE AFFORDANCE → `available_to` (when an entity id); LOCATION → none (it is a reference target).

## Architecture Check

1. Keeping AFFORDANCE separate from OBJECT/LOCATION matches `docs/story-record-schema.md` §7.3 and FOUNDATIONS §18 (affordances define what can plausibly happen now) — selectable independently.
2. No backwards-compatibility shims; new schemas only.

## Verification Layers

1. LOCATION/OBJECT/AFFORDANCE schemas + status enums match §7.1–§7.3 -> schema validation test (accept valid; reject bad status/enum, unknown key).
2. OBJECT emits `owner`/`carried_by`/`current_location` projections (ids only, not `carried_by_holder` sentinel) -> `extractReferences` unit test.
3. AFFORDANCE `action_families` enum exhaustive per §7.3 -> schema test rejecting an out-of-enum value.

## What to Change

### 1. Schemas

Add `packages/core/src/records/space-material.ts`: Zod `.strict()` schemas for LOCATION, OBJECT, VISIBLE AFFORDANCE per §7, each with its status enum and documented enums.

### 2. Registry + extractors

Register all three with status enums. OBJECT extractor emits owner/carried_by/current_location projections for real ids only.

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/space-material.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register three definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/space-material.test.ts` (new)

## Out of Scope

- Physical-continuity validation (two-holders, two-locations blockers) — Phase 6.
- Physical-continuity prompt-section rendering — Phase 7.
- DDL / repository — tickets 010/011.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — accept valid LOCATION/OBJECT/AFFORDANCE; reject bad status/`action_families` enum + unknown keys; OBJECT reference extraction (ids only).
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Status enums match §7.1–§7.3 exactly; `action_families` enum is the §7.3 set.
2. OBJECT `current_location` projection is emitted only for real location ids, never for the `carried_by_holder` sentinel.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/space-material.test.ts` — accept/reject + status/enum + OBJECT reference-extractor coverage.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented LOCATION, OBJECT, and VISIBLE AFFORDANCE schemas with status semantics and material reference projections.

Deviation: physical contradiction validation remains deferred to Phase 6.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
