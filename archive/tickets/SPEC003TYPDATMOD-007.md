# SPEC003TYPDATMOD-007: Causal-pressure schemas (EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD)

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` payload schemas for the seven causal-pressure record types; per-type status enums (incl. PLAN's `plan_status`); reference extractors; registry registration; exports.
**Deps**: SPEC003TYPDATMOD-001

## Problem

EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, and OPEN THREAD produce local causal pressure — the substrate that drives tactics, refusals, escalation, and durable change without becoming plot machinery. Phase 3 needs their runtime schemas, their divergent status fields, and holder/participant/record-link projections (load-bearing for the Phase-6 "active plan held by incapacitated entity" blocker).

## Assumption Reassessment (2026-06-05)

1. Substrate from SPEC003TYPDATMOD-001 exists. This ticket registers seven definitions.
2. Field names + status fields from `docs/story-record-schema.md` §8: EVENT §8.1 (`status: active|resolved|background|abandoned`; `participants`, `causes`/`effects` record-link lists, `known_by`); INTENTION §8.2 (`status: active|satisfied|abandoned|blocked`; `holder`); **PLAN §8.3 uses `plan_status` (NOT `status`): `active|blocked|suspended|fulfilled|failed|abandoned|revised`; `holder`, `can_drive_prose`**; CLOCK §8.4 (`status: active|paused|resolved|abandoned`); OBLIGATION §8.5 (`status: open|closed|escalated|abandoned|transferred`; `owed_by`, `owed_to`); CONSEQUENCE §8.6 (`status: pending|active|resolved|escalated|abandoned`; `holder_or_target`, `cause` record-link); OPEN THREAD §8.7 (`status: active|answered|resolved|escalated|abandoned|superseded`).
3. The reassessment (this session) confirmed PLAN's status field is named `plan_status`, not `status`; the registry definition for PLAN must map `plan_status` into the common-metadata `status` projection (SPEC-003 §Approach status-semantics).
4. FOUNDATIONS §18 (causal pressure records) + §12 (no plot-rail machinery) motivate these: OPEN THREAD must use that term (not "dramatic question"); none of these may encode act/beat/arc structure. Restated: schemas store local causal pressure only; no plot-structure field is introduced.
5. Reference roles: EVENT → `participant`, `record_link` (causes/effects ids), `known_by`; INTENTION/PLAN → `holder`; OBLIGATION → `owed_by`, `owed_to` (entity ids); CONSEQUENCE → `holder_or_target`, `record_link` (cause); CLOCK/OPEN THREAD → none required (visibility/relevance only). `causes`/`effects` may be prose lists — emit `record_link` projections only for id entries.

## Architecture Check

1. Grouping the seven atomic causal-pressure types in one ticket keeps a cohesive reviewable diff (each schema is small) while isolating the `plan_status`→`status` projection nuance in one place.
2. No backwards-compatibility shims; OPEN THREAD uses the canonical term, no "dramatic question" alias.

## Verification Layers

1. All seven schemas + status fields match §8.1–§8.7 -> schema validation test (accept valid; reject bad status enum + unknown key per type).
2. PLAN's `plan_status` maps into the common `status` projection -> registry definition test asserting the projection mapping.
3. Reference projections (`holder`, `participant`, `owed_by`/`owed_to`, `record_link`) emitted -> `extractReferences` unit tests; `record_link` emitted only for id entries, not prose.

## What to Change

### 1. Schemas

Add `packages/core/src/records/causal-pressure.ts`: Zod `.strict()` schemas for the seven types per §8, each with its status field (PLAN: `plan_status`).

### 2. Registry + extractors + status mapping

Register all seven. PLAN's definition maps `plan_status` → common `status` projection. Extractors emit the reference roles above (id entries only).

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/causal-pressure.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register seven definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/causal-pressure.test.ts` (new)

## Out of Scope

- "Active plan held by incapacitated entity" and other contradiction blockers — Phase 6.
- Clock-tick / obligation-breach prompt rendering — Phase 7.
- DDL / repository — tickets 010/011.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — accept valid for all seven; reject bad status enums + unknown keys; PLAN `plan_status`→`status` projection; reference extraction for holder/participant/owed-to/record-link.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. PLAN's status field is `plan_status` and maps into the common `status` projection; all seven status enums match §8.
2. `causes`/`effects`/`cause` produce `record_link` projections only for id entries, not prose strings.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/causal-pressure.test.ts` — per-type accept/reject + status + reference-extractor coverage incl. PLAN mapping.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, and OPEN THREAD schemas, including PLAN `plan_status` projection and reference extraction for holders, participants, owed parties, and record links.

Deviation: causal contradiction checks remain deferred to deterministic validation.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
