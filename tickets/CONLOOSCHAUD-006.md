# CONLOOSCHAUD-006: Make retained non-prompt fields explicit in guidance

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds field-specific prompt-destination/status metadata (guidance, compile-destinations) for ~13 retained non-prompt fields and updates the schema/contract prompt-treatment notes; no compiled-prompt, schema, storage, or migration change
**Deps**: CONLOOSCHAUD-005

## Problem

The guidance system relies on a broad default that makes every prose-looking or structured field appear conditionally prompt-facing. Several retained fields are deliberately authoring-, classification-, history-, validation-, or UI-facing rather than literal prompt content, and the guidance should say so explicitly so authors and agents are not misled into expecting an absent compiler effect (spec §8.3–§8.4). "Not prompt-facing" does not mean "unnecessary": these fields have real authoring, classification, continuity-history, validation, or UI functions, so the fix is truthful destination labels, not deletion.

## Assumption Reassessment (2026-06-20)

1. The guidance/destination surfaces are `packages/core/src/records/compile-destinations.ts`, `field-guidance-records.ts`, and `field-guidance.ts`, plus editor descriptors where destination badges/help are derived. The fields in scope exist today on their records: `ENTITY.roles_in_story`/`aliases` (`entity.ts`), `OBJECT.durability` (`space-material.ts:59`), `EVENT.sequence_order` and `PLAN.fallback_steps` and `CLOCK.tick_history` and `OPEN THREAD.answer_if_known` (`causal-pressure.ts`), and `RELATIONSHIP.axis`/`direction_kind`/`value`/`valence`/`visibility` (`relationship-emotion.ts`). Verified by grep 2026-06-20.
2. Guidance coverage/doctrine is enforced by `packages/core/test/field-guidance-coverage.test.ts`, `field-guidance-doctrine.test.ts`, `guidance-coverage-sources.test.ts`, `field-guidance-records.test.ts`, `field-guidance.test.ts`, and `compile-destinations.test.ts`. `docs/story-record-schema.md` (prompt-treatment notes) and `docs/compiler-contract.md` §9 (prompt-facing vs validation-only fields) are the authority docs. Spec: `specs/continuity-loom-schema-audit-and-changes.md` §8.3–§8.4.
3. Cross-artifact boundary under audit: the per-field guidance/destination metadata (`compile-destinations.ts`, `field-guidance-records.ts`, `field-guidance.ts`) ↔ the guidance coverage/doctrine tests ↔ the schema/contract prompt-treatment docs. This is a truthfulness correction to destination metadata, not a compiler or schema change. It depends on CONLOOSCHAUD-005, which already assigns truthful prompt destinations to the now-rendered ENTITY/LOCATION fields; this ticket covers the remaining non-prompt fields without contradicting those.
4. FOUNDATIONS §13 (field economy — a field earns its place through a concrete function even if not prompt-facing) and §29.11 (reduce false configurability / improve guidance legibility without reducing authorial control) motivate the change. The harm guard is §8.3/§14: marking `PLAN.fallback_steps` and `CLOCK.tick_history` non-prompt-facing prevents compiling alternative futures (soft branches) or stale event repetition.
5. Enforcement-surface confirmation (§8/§10): these fields are already not compiled into any prompt — the existing deterministic compiler is the enforcement surface. This ticket makes the guidance/docs *state* that truthfully; it introduces no new leakage or nondeterminism path and changes no compiled output. The doctrine test is the standing guard that prevents a future regression from quietly making them prompt-facing.
6. Metadata-contract extension: this adds field-specific destination/status entries to the guidance/compile-destinations metadata. Consumers are the coverage/doctrine tests and editor destination badges; the extension is additive per-field labelling, replacing reliance on the broad conditional default. No story-record Zod schema is touched.
7. (Rename/removal item not applicable — no symbol is renamed or removed; metadata is added/clarified.)
8. Adjacent contradiction (required consequence): the broad default that makes structured/prose-looking fields appear conditionally prompt-facing is the root cause; the fix is field-specific destinations for the §8.3 set: `ENTITY.roles_in_story` (not literal prompt content), `ENTITY.aliases`/lifecycle/timestamp (not literal prompt content unless used to resolve labels), `OBJECT.durability` (not currently literal prompt content), `EVENT.sequence_order` (not prompt-facing; does not order compilation), `PLAN.fallback_steps` (not prompt-facing by default), `CLOCK.tick_history.*` (not prompt-facing), `OPEN THREAD.answer_if_known` (not prompt-facing), `RELATIONSHIP.axis`/`direction_kind`/`value`/`valence`/`visibility` (not literal prompt content; RELATIONSHIP stays prose-facing via `description`/`pressure_text`/`current_expression`), and record IDs/source provenance/timestamps/diagnostic severity (validation/operational only).
9. Mismatch + correction: none. The field set and their host records are confirmed against the schema files.

## Architecture Check

1. Field-specific destination/status metadata is cleaner and more truthful than a broad conditional default: it stops the guidance from implying compiler effects that do not exist while preserving each field's real authoring/validation/UI function. RELATIONSHIP keeps its prose-facing contract (`description`, `pressure_text`, `current_expression`) so structured axes are not dumped as raw enum labels.
2. No backwards-compatibility aliasing/shims. No schema change, no migration, no compiler logic change — only metadata/docs truthfulness.

## Verification Layers

1. Each §8.3 field carries an explicit non-prompt (or validation/operational-only) destination/status -> guidance coverage + doctrine tests (`field-guidance-coverage.test.ts`, `field-guidance-doctrine.test.ts`, `compile-destinations.test.ts`).
2. The listed author-only fields do not leak into any compiled prompt -> codebase/compiler grep-proof + golden stability (the prose/ideation goldens from CONLOOSCHAUD-005 remain unchanged by this ticket).
3. RELATIONSHIP prose-facing contract is preserved (`description`/`pressure_text`/`current_expression` remain the writer-facing representation) -> guidance records test.
4. `PLAN.fallback_steps` and `CLOCK.tick_history` guidance states the author-update path (update `current_step`/current state; historical ticks excluded unless represented as current state/event/consequence) -> FOUNDATIONS §14 alignment check in the guidance records test.

## What to Change

### 1. Per-field destinations/statuses

In `compile-destinations.ts`, `field-guidance-records.ts`, and `field-guidance.ts`, replace the broad conditional default for the §8.3 field set with explicit per-field destinations/statuses (Assumption Reassessment item 8). Add the specific guidance prose: for `PLAN.fallback_steps`, that when a fallback becomes current the author updates `current_step`/selected pressure/current state rather than expecting the compiler to offer multiple future options; for `CLOCK.tick_history`, that historical ticks remain visible to the author but are excluded from current prompt context unless represented as current state, event, consequence, or current clock pressure.

### 2. Editor descriptors

Update editor descriptors where destination badges/help are derived so the non-prompt status is visible in the editing UI.

### 3. Authority docs

`docs/story-record-schema.md`: add prompt-treatment notes where absent for the §8.3 fields. `docs/compiler-contract.md` §9: distinguish prompt-facing vs validation-only fields for the set. This subsection is a doc/guidance truthfulness correction; it does not tighten stored Zod shapes and requires no migration.

## Files to Touch

- `packages/core/src/records/compile-destinations.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/src/records/field-guidance.ts` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/field-guidance-coverage.test.ts` (modify)
- `packages/core/test/field-guidance-doctrine.test.ts` (modify)
- `packages/core/test/guidance-coverage-sources.test.ts` (modify)
- `packages/core/test/field-guidance-records.test.ts` (modify)
- `packages/core/test/compile-destinations.test.ts` (modify)

## Out of Scope

- Deleting any of the in-scope fields (they have real non-prompt functions).
- Changing any Zod schema, compiler resolver, or compiled prompt output.
- The ENTITY/LOCATION fields that CONLOOSCHAUD-005 makes prompt-facing (this ticket covers only the non-prompt set).
- Any storage migration.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance-coverage field-guidance-doctrine compile-destinations` — each §8.3 field has an explicit non-prompt / validation-only destination and the doctrine test passes with no broad-default fallback for the set.
2. `npm test -- field-guidance-records compiler-golden compiler-ideation-golden` — RELATIONSHIP prose-facing contract preserved; prose/ideation goldens are unchanged by this ticket (no field newly compiled).
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. The §8.3 author-only/operational fields never appear in any compiled prompt (grep/golden-proof).
2. Every in-scope field retains a documented concrete function (authoring, classification, continuity-history, validation, or UI); none is demoted to "unnecessary."

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-doctrine.test.ts` / `field-guidance-coverage.test.ts` — assert explicit per-field non-prompt status for the §8.3 set; assert no field relies on the broad conditional default.
2. `packages/core/test/field-guidance-records.test.ts` — assert `PLAN.fallback_steps` and `CLOCK.tick_history` guidance carries the author-update path; assert RELATIONSHIP prose-facing fields unchanged.

### Commands

1. `npm test -- field-guidance-coverage field-guidance-doctrine guidance-coverage-sources field-guidance-records compile-destinations`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `npm test -- compiler-golden compiler-ideation-golden` (golden-stability check confirming this metadata-only change adds nothing to either compiled prompt).
