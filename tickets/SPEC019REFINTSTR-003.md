# SPEC019REFINTSTR-003: Brief-field reference rules

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `referential-brief.ts` blocker rule module + two warning rules in `warnings.ts`; registered in `rules/index.ts`; new `DIAGNOSTIC_CODES` entries (`@loom/core`); `docs/validation-rule-inventory.md` rows; new unit test. Adds blocking validation behavior.
**Deps**: `archive/tickets/SPEC019REFINTSTR-001.md`, `archive/tickets/SPEC019REFINTSTR-002.md`

## Problem

SPEC-019 D3: the generation brief's id-bearing fields — `onstage_entities`, `offstage_pressuring_entities`, recordId-form `current_location`, and recordId-form `entity_statuses` — are never validated, so an unresolvable id compiles as a raw UUID into readiness-required prompt lines (`packages/core/src/compiler/labels.ts:15`). These rules classify each such reference (via 002) and emit a blocker when the lane is required (dangling, type-mismatch, or unselected-in-a-required-lane) and a warning when an unselected reference fills only an optional lane.

## Assumption Reassessment (2026-06-10)

1. Generation-brief field shapes confirmed (`packages/core/src/records/generation-brief.ts:33-41`): `current_location: recordId | nonemptyString`, `onstage_entities: recordId[]`, `offstage_pressuring_entities: recordId[]`, `entity_statuses: nonemptyString | recordId[]`. Rule modules export a frozen `readonly ValidationRule[]` and register in `packages/core/src/validation/rules/index.ts`; severity is derived per-file by the drift test (`deriveFileSeverity`: `warnings.ts` → warning, any other module → blocker).
2. `docs/validation-rule-inventory.md` lists every `DIAGNOSTIC_CODES` value with a severity column; `packages/core/test/validation-rule-inventory.test.ts` asserts the inventory ID set equals `DIAGNOSTIC_CODES` and that each code's severity matches the file it is emitted from. New codes must land with their inventory rows in this same diff or the drift test fails.
3. Cross-artifact boundary: these rules consume `classifyReference` from 002 and `snapshot.projectRecordIndex` from 001. The lane-table **document** (which lane is required vs optional) is authored in 009; the required-vs-optional decision per field is re-derived here from the compiler-contract §4 requiredness column (SPEC-019 D2 / Risk 3) — `{onstage_entities}` and `{current_location}` are readiness-required; `{offstage_pressuring_entities}`/`{entity_statuses}` are context-gated.
4. FOUNDATIONS principle: §11 — a blocker is legitimate only under clause 2 (required lane lacks truthful deterministic state — a raw UUID is not one) or clause 3 (hard contradiction, e.g. a type mismatch). Only id equality, record-type comparison, and set membership are used; no field-content inspection (SPEC-019 spec invariant).
5. Fail-closed enforcement surface: `runValidation` (`packages/core/src/validation/engine.ts`) splits diagnostics into blockers/warnings; `/api/compile` refuses on `validation.isBlocked` (`packages/server/src/compile-routes.ts:17`). New blockers therefore gate preview/compile/send as intended; warnings never gate (§29.5). No secret-firewall path is touched (no secret field is read).
6. Schema/namespace extension: `DIAGNOSTIC_CODES` + the inventory. Additive — new codes only; no existing code is renamed or removed in this ticket.
7. Mismatch + correction (per SPEC-019 I1 disposition, option a): the spec's single hybrid `…-invalid` codes are realized as a blocker code plus a separate `…-unselected-optional` warning code, because the inventory + drift test bind one severity per code. The blocker rule emits the `…-invalid` code for dangling / type-mismatch / required-lane-unselected; the warning rule emits the `…-unselected-optional` code for optional-lane-unselected.

## Architecture Check

1. Splitting each hybrid concept into a blocker code (in `referential-brief.ts`) and a warning code (in `warnings.ts`) fits the existing one-severity-per-code inventory and per-file severity model without touching the drift test's contract — cleaner than re-engineering `deriveFileSeverity` for multi-severity codes (I1 option b). Reusing `classifyReference` keeps all three membership outcomes uniform across the four fields.
2. No backwards-compatibility aliasing/shims: all codes and rules are new.

## Verification Layers

1. `onstage_entities`: dangling / non-ENTITY / unselected each blocks -> unit test on `onstage-entity-reference-invalid`.
2. `offstage_pressuring_entities` / `entity_statuses`: dangling + type-mismatch block; unselected blocks when context requires, warns when optional -> unit tests on both the `…-invalid` (blocker) and `…-unselected-optional` (warning) codes.
3. `current_location`: index-matching value must be LOCATION-typed and selected (blocker); a value matching nothing in the index is treated as prose and produces no diagnostic -> unit test on `current-location-reference-invalid` plus a negative prose-passthrough case (contract §9).
4. Inventory/code-set integrity -> `validation-rule-inventory.test.ts` stays green with the new rows.
5. No content heuristics -> FOUNDATIONS §11 review: id/type/membership operations only.

## What to Change

### 1. Blocker rules (`packages/core/src/validation/rules/referential-brief.ts`, new)

Export `referentialBriefRules`. Emit blocker diagnostics:

- `onstage-entity-reference-invalid` — each `onstage_entities` id must be selected and ENTITY-typed; dangling, non-ENTITY, or unselected all block (readiness-required lane).
- `offstage-entity-reference-invalid` — each `offstage_pressuring_entities` id: dangling or non-ENTITY blocks; unselected blocks when offstage pressure/interruption context makes the lane required.
- `entity-statuses-reference-invalid` — each recordId-form `entity_statuses` entry must exist and be ENTITY STATUS-typed (blockers); unselected blocks when context-required.
- `current-location-reference-invalid` — a `current_location` value present in the project index must be LOCATION-typed (else block) and selected (else block); a value absent from the index is a prose scene-space label → no diagnostic.

### 2. Optional-lane warning rules (`packages/core/src/validation/rules/warnings.ts`, modify)

Add `offstage-entity-reference-unselected-optional` and `entity-statuses-reference-unselected-optional`, emitting `severity: "warning"` when the reference is unselected and the lane is optional.

### 3. Register + declare codes + inventory

Add `...referentialBriefRules` to `rules/index.ts`; add all six codes to `DIAGNOSTIC_CODES` (`types.ts`); add six rows (four blocker, two warning) with FOUNDATIONS §11 clause mappings to `docs/validation-rule-inventory.md`.

## Files to Touch

- `packages/core/src/validation/rules/referential-brief.ts` (new)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/rules/index.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/validation-brief-references.test.ts` (new)

## Out of Scope

- Cast-band / POV / voice-pressure rules (004), record-internal rules (005), structural contradictions (006).
- The compiler-contract §6 severity lane table and any compiler-contract edits (009).
- Removing raw-id fallback from optional lanes (SPEC-019 Out of Scope — compiler untouched).
- Any keyword/content-based validation (SPEC-019 spec invariant).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-brief-references` — every blocker case, every optional-lane warning case, and the `current_location` prose-passthrough negative case.
2. `npm test --workspace @loom/core -- validation-rule-inventory` — the six new codes are present in both `DIAGNOSTIC_CODES` and the inventory at matching severities.
3. `npm run lint && npm run typecheck && npm test` — full gate green; `compiler-golden.test.ts` unchanged (compiler untouched).

### Invariants

1. A required-lane reference that is dangling, mistyped, or unselected always blocks; an optional-lane unselected reference only warns.
2. Diagnostics derive solely from id membership and record-type comparison — no brief-field prose is inspected.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-brief-references.test.ts` (new) — case matrix across all four fields: selected/coherent (no diagnostic), dangling, type-mismatch, unselected-required (blocker), unselected-optional (warning), and `current_location` prose value (no diagnostic).

### Commands

1. `npm test --workspace @loom/core -- validation-brief-references`
2. `npm test --workspace @loom/core -- validation-rule-inventory`
3. `npm run lint && npm run typecheck && npm test`
