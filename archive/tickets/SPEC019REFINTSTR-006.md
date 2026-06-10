# SPEC019REFINTSTR-006: Structural contradiction rules

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `structural-contradiction.ts` blocker rule module registered in `rules/index.ts`; four `DIAGNOSTIC_CODES` entries (`@loom/core`); inventory rows; new unit test. Adds blocking validation behavior.
**Deps**: None

## Problem

SPEC-019 D6: deterministic enum/id cross-record contradictions go undetected and currently compile — an entity both onstage and offstage-pressuring; an onstage entity whose selected ENTITY STATUS places it `offstage`/`concealed` or at a different location than the scene; an `OBJECT.current_location: "carried_by_holder"` whose `carried_by` is `"none"`; a `RELATIONSHIP` whose `from === to`. Each is detectable by pure enum/id comparison.

## Assumption Reassessment (2026-06-10)

1. Field shapes confirmed: `RELATIONSHIP.from`/`to` are plain `recordId` with no self-reference refinement (`packages/core/src/records/relationship-emotion.ts:34-35`); `OBJECT.current_location: recordId | carried_by_holder/unknown/offstage` and `OBJECT.carried_by: recordId | none/unknown` (`packages/core/src/records/space-material.ts:53-68`); `ENTITY STATUS.location: recordId | unknown/concealed/offstage/not_applicable` (`packages/core/src/records/entity.ts:43-52`); the brief's `onstage_entities` / `offstage_pressuring_entities` are `recordId[]` (`generation-brief.ts:33-41`). Rule modules export a frozen `readonly ValidationRule[]` and register in `rules/index.ts`.
2. `docs/validation-rule-inventory.md` + `validation-rule-inventory.test.ts` require the four new codes and their rows to land together; all four are blockers, so they live in this one non-`warnings.ts` module (per-file severity → blocker).
3. Shared boundary under audit: this ticket touches the same aggregation surfaces as 003–005 (`types.ts` `DIAGNOSTIC_CODES`, `rules/index.ts`, `docs/validation-rule-inventory.md`) but shares no rule logic — it needs neither `projectRecordIndex` (001) nor `classifyReference` (002), operating purely on selected records, brief arrays, and enums. It is independent and parallel.
4. FOUNDATIONS §11 clause 3 (selected records / generation fields contain a hard contradiction) justifies each blocker; §16 physical continuity backs the status-location and object-holder cases. Only enum equality, id equality, and set membership are used (SPEC-019 spec invariant).
5. Fail-closed surface: `runValidation` → `compile-routes.ts:17` (`isBlocked`). No secret content is read; determinism preserved (pure comparisons, no wall-clock/random).
6. Schema/namespace extension: `DIAGNOSTIC_CODES` gains `onstage-offstage-entity-overlap`, `onstage-entity-status-contradiction`, `object-location-holder-incoherence`, `relationship-self-reference` (all blockers).
7. Design note (SPEC-019 brainstorm named assumption 1): `relationship-self-reference` is implemented as a validation rule, **not** a Zod refinement, so an already-saved self-referential RELATIONSHIP loads and surfaces a legible diagnostic instead of failing parse.

## Architecture Check

1. A single blocker module for the four contradictions is the right grain — each is a small deterministic comparison with no shared state, and keeping them together avoids four near-empty modules. Validation-rule placement (not Zod refinement) for self-reference keeps already-saved records loadable, matching how the rest of the validation layer surfaces contradictions rather than rejecting persistence.
2. No backwards-compatibility aliasing/shims: all codes and the module are new; no Zod schema is altered.

## Verification Layers

1. Same id in `onstage_entities` and `offstage_pressuring_entities` -> `onstage-offstage-entity-overlap` blocker unit test.
2. Onstage entity's selected ENTITY STATUS `offstage`/`concealed`, or its location recordId ≠ recordId-form `current_location` -> `onstage-entity-status-contradiction` blocker unit test; `unknown`/`not_applicable` produce no diagnostic (negative test).
3. `OBJECT.current_location: "carried_by_holder"` with `carried_by: "none"` -> `object-location-holder-incoherence` blocker unit test; `carried_by: "unknown"` produces no diagnostic (negative test).
4. `RELATIONSHIP.from === to` on a selected record -> `relationship-self-reference` blocker unit test; the record still parses/loads.
5. Inventory/code-set integrity -> `validation-rule-inventory.test.ts` green.

## What to Change

### 1. Blocker rules (`packages/core/src/validation/rules/structural-contradiction.ts`, new)

Export `structuralContradictionRules` emitting the four codes per the comparisons above. `unknown`/`not_applicable`/`none` sentinels behave as specified (status `unknown`/`not_applicable` do not block; object `carried_by: "unknown"` does not block).

### 2. Register + declare codes + inventory

Add `...structuralContradictionRules` to `rules/index.ts`; add the four codes to `types.ts`; add four blocker rows with §11 clause-3 mappings to `docs/validation-rule-inventory.md`.

## Files to Touch

- `packages/core/src/validation/rules/structural-contradiction.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/validation-structural-contradiction.test.ts` (new)

## Out of Scope

- Reference-existence/type/selection checks (003–005); these rules assume ids may be checked for equality without resolving them.
- Any Zod schema refinement on RELATIONSHIP or OBJECT.
- Structured story-time / clock-deadline checks (SPEC-019 Out of Scope).
- `EVENT.sequence_order` wiring (standing deferral).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-structural-contradiction` — all four contradictions plus the sentinel negatives (`unknown`/`not_applicable`/`none`).
2. `npm test --workspace @loom/core -- validation-rule-inventory` — four blocker codes present at matching severity.
3. `npm run lint && npm run typecheck && npm test` — full gate; `compiler-golden.test.ts` unchanged.

### Invariants

1. Each contradiction blocks via pure enum/id comparison; no reference resolution or content inspection occurs.
2. A self-referential RELATIONSHIP loads successfully and surfaces a blocker rather than failing schema parse.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-structural-contradiction.test.ts` (new) — positive contradiction cases and sentinel-driven negatives for each of the four codes.

### Commands

1. `npm test --workspace @loom/core -- validation-structural-contradiction`
2. `npm test --workspace @loom/core -- validation-rule-inventory`
3. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-10.

- Added `structuralContradictionRules` with blockers for onstage/offstage entity overlap, onstage entity-status contradictions, object carried-by-holder incoherence, and relationship self-reference.
- Registered the four new blocker codes and inventory rows under §11.3.
- Kept the relationship self-reference check in validation rather than Zod parsing; the test confirms a self-referential relationship payload still parses and then surfaces a blocker.
- Used direct enum/id comparisons only; no project-index lookup, reference classifier, or content inspection was introduced.

Verification:

- `npm test --workspace @loom/core -- validation-structural-contradiction`
- `npm test --workspace @loom/core -- validation-rule-inventory`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite large-chunk warning)
