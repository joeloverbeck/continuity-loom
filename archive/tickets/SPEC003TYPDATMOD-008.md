# SPEC003TYPDATMOD-008: Relationship & emotion schemas

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` payload schemas for RELATIONSHIP and EMOTION; status enums; reference extractors; registry registration; exports.
**Deps**: SPEC003TYPDATMOD-001

## Problem

RELATIONSHIP and EMOTION preserve social and affective pressure rendered as pressure text and current expression (not raw axes). They are causal-pressure substrate for Phase-6 validation (e.g. relationship implying contact between characters who have not met) and Phase-7 rendering. Phase 3 needs their runtime schemas and from/to/holder reference projections.

## Assumption Reassessment (2026-06-05)

1. Substrate from SPEC003TYPDATMOD-001 exists. This ticket registers two definitions.
2. Field names + status enums from `docs/story-record-schema.md`: RELATIONSHIP §9.1 (`status: active|resolved|abandoned`; `axis` enum, `direction_kind`, `from`, `to`, `value`, `valence`, `description`, `pressure_text`, `current_expression`); EMOTION §9.2 (`status: active|suppressed|settled|transformed|dissociated`; `holder`, `affect_kind`, `intensity`, `behavioral_pressure` enum list, `surface_expression`).
3. Cross-artifact boundary: RELATIONSHIP `from`/`to` and EMOTION `holder` projections feed `record_references` (ticket 011). RELATIONSHIP carries prose fields (`description`, `pressure_text`, `current_expression`) whose Phase-7 rendering uses prose, not raw axes (§18) — Phase 3 stores all of them.
4. FOUNDATIONS §18 (RELATIONSHIP/EMOTION render as pressure text and current expression) motivates keeping the prose fields; field economy (§13) is satisfied because each prose field protects characterization nuance. Restated: store axes + prose together; never reduce to axes alone.
5. Reference roles: RELATIONSHIP → `from`, `to`; EMOTION → `holder`. Neither carries a name-based reference (ids only).

## Architecture Check

1. Two atomic schemas through the shared registry; no special-casing. Prose + structured fields coexist per §8 of `docs/story-record-schema.md` design stance.
2. No backwards-compatibility shims; new schemas only.

## Verification Layers

1. RELATIONSHIP/EMOTION schemas + status enums match §9.1–§9.2 -> schema validation test (accept valid; reject bad `axis`/`affect_kind`/status, unknown key).
2. RELATIONSHIP emits `from`/`to`; EMOTION emits `holder` -> `extractReferences` unit test.
3. Both present in registry -> registry iteration test.

## What to Change

### 1. Schemas

Add `packages/core/src/records/relationship-emotion.ts`: Zod `.strict()` schemas for RELATIONSHIP and EMOTION per §9, each with its status enum and documented enums.

### 2. Registry + extractors

Register both with status enums; emit from/to/holder projections.

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/relationship-emotion.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register two definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/relationship-emotion.test.ts` (new)

## Out of Scope

- "Relationship implies contact between characters who have not met" and similar blockers — Phase 6.
- Pressure-text / current-expression prompt rendering — Phase 7.
- DDL / repository — tickets 010/011.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — accept valid RELATIONSHIP/EMOTION; reject bad enums/status + unknown keys; from/to/holder reference extraction.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Status enums match §9.1–§9.2; `axis`/`affect_kind`/`behavioral_pressure` enums match the schema.
2. RELATIONSHIP retains `description`/`pressure_text`/`current_expression` prose fields (not axes-only).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/relationship-emotion.test.ts` — accept/reject + status + reference-extractor coverage.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented RELATIONSHIP and EMOTION schemas with status semantics, prose pressure fields, and from/to/holder reference projections.

Deviation: social/affective validation remains deferred to Phase 6.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
