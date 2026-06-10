# SPEC019REFINTSTR-005: Record-internal reference rules and extraction drift test

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `record-internal.ts` blocker rule module (a first validation consumer of `extractRecordReferences`); one warning rule in `warnings.ts`; `DIAGNOSTIC_CODES` + inventory rows (`@loom/core`); a new drift test locking `extractReferences` completeness. Adds blocking validation behavior; no record-extraction declaration is added (they already exist).
**Deps**: `archive/tickets/SPEC019REFINTSTR-001.md`, `archive/tickets/SPEC019REFINTSTR-002.md`

## Problem

SPEC-019 D5: record-internal entity references (`PLAN.holder`, `SECRET.holders/non_holders_to_protect`, `OBJECT.owner/carried_by/current_location`, `RELATIONSHIP.from/to`, `EVENT.participants/causes/effects`, `AFFORDANCE.available_to`, `ENTITY STATUS.entity_id/location`, `CAST MEMBER.entity_id`, and the rest) are never validated, so the prompt-facing lanes the compiler resolves to display labels silently degrade to raw ids when a reference is dangling, mistyped, or unselected. The extraction infrastructure already exists and is complete; what is missing is a **validation** consumer of it plus a drift test that keeps it complete.

## Assumption Reassessment (2026-06-10)

1. `extractRecordReferences` (`packages/core/src/records/registry.ts:53`, exported `packages/core/src/index.ts:166`) dispatches to per-type `extractReferences`, which are **already complete** for every recordId-typed payload field — verified field-by-field: `knowledge.ts:92,101,109` (FACT.known_by, BELIEF.holder, SECRET.holders/non_holders), `space-material.ts:94,106` (OBJECT.owner/carried_by/current_location, AFFORDANCE.available_to), `relationship-emotion.ts:111,121` (RELATIONSHIP.from/to, EMOTION.holder), `causal-pressure.ts:157,170,178,194` (EVENT.participants/causes/effects/known_by, INTENTION/PLAN holder, OBLIGATION owed_by/owed_to), `cast-member.ts:152` (CAST MEMBER.entity_id), `entity.ts:66` (ENTITY STATUS.entity_id/location). **Do not re-add these declarations.**
2. The infrastructure is **not dormant**: `packages/server/src/record-repository.ts:205,258` consume the per-type `extractReferences` to populate a `record_references` table, and `assertNoActiveInboundReferences` (`:516`) gates archive (`:320`) and delete (`:327`). `incomingReferencesForRecord` (`:480`) counts only non-archived referrers (`r.archived = 0`). There is no **validation** consumer today — that is this ticket's new work.
3. Cross-artifact boundary: the rules consume `classifyReference` (002) and `extractRecordReferences` (registry). Each extracted reference carries a `refRole`; the rule maps `refRole → { expectedTypes, requiredness }` (the lane table's content, re-derived from compiler-contract §4 per SPEC-019 D2; the documentation copy is owned by 009).
4. FOUNDATIONS §11: a blocker is legitimate under clause 3 (a selected record names story state that does not exist — dangling — or the wrong type) or clause 2 (a required prompt lane lacks truthful deterministic state — unselected in a required lane). Only id lookup, record-type comparison, and set membership are used (SPEC-019 spec invariant).
5. Fail-closed surface + write-time guard reconciliation: the rules run in `runValidation` and gate via `compile-routes.ts:17`. Because `assertNoActiveInboundReferences` already blocks deleting/archiving a record while active records reference it, a `record-reference-dangling` state is only reachable via the narrow archived-referrer / archived-target path; this rule is the validation-time safety net for that residual, and **must not** duplicate or replace the repository's write-time guard.
6. Schema/namespace extension: `DIAGNOSTIC_CODES` gains `record-reference-dangling`, `record-reference-type-mismatch`, `record-reference-unselected-required` (blockers) and `record-reference-unselected-optional` (warning); the drift test guards the extraction-completeness invariant going forward.
7. Mismatch + correction (no silent retcon, §20): the spec D5 bullet "complete `extractReferences` declarations" describes already-landed work; this ticket instead delivers the **drift test** (converting ad-hoc completeness into a guaranteed invariant) and the **validation consumer**, and records the reconciliation with the existing integrity guard.
8. Per SPEC-019 I1 (option a), the hybrid `record-reference-unselected` is realized as `record-reference-unselected-required` (blocker, e.g. SECRET holder/non-holder when the secret is active, PLAN holder when the plan drives prose or the hidden-plan tag is set) plus `record-reference-unselected-optional` (warning, e.g. EVENT participants, AFFORDANCE `available_to`, OBJECT owner/carried_by, BELIEF/EMOTION/INTENTION holders, RELATIONSHIP endpoints).

## Architecture Check

1. Reusing `extractRecordReferences` as the single source of "which fields are references" is cleaner than hand-written per-type walkers and means the drift test — not a future code reviewer — guarantees a new recordId field cannot escape validation. The `refRole → expectedTypes/requiredness` map co-locates the lane decision with the only rule that needs it.
2. No backwards-compatibility aliasing/shims: the validation consumer is new; the extraction layer is reused as-is, not forked.

## Verification Layers

1. Selected record with a dangling extracted reference -> `record-reference-dangling` blocker unit test.
2. Extracted reference resolving to a type outside the `refRole`'s expected set -> `record-reference-type-mismatch` blocker unit test.
3. Unselected reference in a required lane blocks; in an optional lane warns -> unit tests on both unselected codes.
4. Extraction completeness -> drift test: every recordId-typed schema field is extracted by its type's `extractReferences` or appears in an explicit exemption list with a reason.
5. No content heuristics / determinism -> FOUNDATIONS §11 review.

## What to Change

### 1. Validation consumer (`packages/core/src/validation/rules/record-internal.ts`, new)

Export `recordInternalReferenceRules`. For each record in `snapshot.records`, call `extractRecordReferences(record.type, record.payload)`; classify each reference with `classifyReference`; emit `record-reference-dangling` (target absent from the project index), `record-reference-type-mismatch` (actual type outside the `refRole`'s expected set), or `record-reference-unselected-required` (unselected in a required lane) per the `refRole → { expectedTypes, requiredness }` map.

### 2. Optional-lane warning (`packages/core/src/validation/rules/warnings.ts`, modify)

Add `record-reference-unselected-optional` (`severity: "warning"`) for unselected references in optional lanes.

### 3. Drift test (`packages/core/test/validation-record-reference-drift.test.ts`, new)

Assert that every recordId-typed field across all record-type payload schemas is either covered by its type's `extractReferences` output or listed in an explicit exemption map with a stated reason. (Recommended mechanism: introspect each Zod payload schema for the `recordId` brand and diff against the `refRole` set the type's `extractReferences` produces on a representative payload.)

### 4. Codes, registry, inventory

Add `...recordInternalReferenceRules` to `rules/index.ts`; add the four codes to `types.ts`; add four rows (three blocker, one warning) with §11 clause mappings to `docs/validation-rule-inventory.md`.

## Files to Touch

- `packages/core/src/validation/rules/record-internal.ts` (new)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/rules/index.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/validation-record-reference-drift.test.ts` (new)
- `packages/core/test/validation-record-internal.test.ts` (new)

## Out of Scope

- Re-adding or modifying any per-type `extractReferences` declaration (already complete).
- Changing the server's `record_references` integrity table or `assertNoActiveInboundReferences` (write-time guard, untouched).
- Brief-field (003), cast-band (004), structural-contradiction (006) rules.
- The compiler-contract §6 lane table document (009).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-record-internal` — dangling, type-mismatch, unselected-required (blocker), unselected-optional (warning), and coherent negatives.
2. `npm test --workspace @loom/core -- validation-record-reference-drift` — completeness invariant holds for the current schemas (and would fail if a new recordId field were added without extraction/exemption).
3. `npm test --workspace @loom/core -- validation-rule-inventory` — four codes present at matching severities.
4. `npm run lint && npm run typecheck && npm test` — full gate; `compiler-golden.test.ts` unchanged.

### Invariants

1. Every recordId-typed schema field is either extracted or explicitly exempted; the drift test fails otherwise.
2. The validation rules read `extractRecordReferences` output only — no hand-rolled field walking, no record content inspection.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-record-internal.test.ts` (new) — per-`refRole` case matrix across the blocker and warning codes.
2. `packages/core/test/validation-record-reference-drift.test.ts` (new) — schema-completeness assertion with the explicit exemption map.

### Commands

1. `npm test --workspace @loom/core -- "validation-record-internal|validation-record-reference-drift"`
2. `npm test --workspace @loom/core -- validation-rule-inventory`
3. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-10.

- Added `recordInternalReferenceRules` as the first validation consumer of `extractRecordReferences`, with blockers for dangling, type-mismatched, and required-but-unselected internal references.
- Added `record-reference-unselected-optional` as a warning for optional internal-reference lanes that resolve to unselected records.
- Registered the four new diagnostic codes and documented them in `docs/validation-rule-inventory.md`.
- Added `validation-record-internal` coverage for dangling, type mismatch, required unselected, optional unselected, and coherent selected references.
- Added `validation-record-reference-drift` coverage that walks record payload Zod schemas for UUID-shaped fields and requires each path to be mapped to an extractor role or explicitly exempted.
- Preserved the existing extraction declarations and server write-time reference guard. The drift test records `SECRET.clue_carriers[].discovered_by` as an explicit non-prompt-facing exemption because compiler-contract guidance surfaces clue text only.

Verification:

- `npm test --workspace @loom/core -- validation-record-internal`
- `npm test --workspace @loom/core -- validation-record-reference-drift`
- `npm test --workspace @loom/core -- validation-rule-inventory`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite large-chunk warning)
