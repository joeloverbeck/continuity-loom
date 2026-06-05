# SPEC004RECCRUBAS-002: Relax active_working_set runtime schema for membership-only persistence

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/records/generation-brief.ts` (`activeWorkingSetSchema`); reconcile `docs/story-record-schema.md`
**Deps**: None

## Problem

Phase 4 ships a *minimal* manual active-working-set membership toggle persisted through the existing `generation_session` storage, holding only the `selected_records` list — the full brief (POV, cast bands, manual directive, voice pressure, focus tags, stop guidance) is Phase 5. But `activeWorkingSetSchema` (`packages/core/src/records/generation-brief.ts`) currently **requires** `selected_pov`, `manual_directive_id`, and `active_onstage_cast_full` (no defaults). Because `generationSessionSchema.active_working_set` is that schema, a membership-only write (`{ active_working_set: { selected_records: [...] } }`) fails `setGenerationSession` validation (`packages/server/src/record-repository.ts:314`). The spec's working-set persistence is therefore not implementable as written. This was resolved during decomposition as **Option A (expand-scope-in-place): relax the runtime schema** — storage becomes permissive; the Phase-6 validation engine enforces presence at generation time (fail-closed). This keeps one canonical working-set object, progressively filled across phases, rather than forking a parallel membership representation.

## Assumption Reassessment (2026-06-05)

1. `activeWorkingSetSchema` (`packages/core/src/records/generation-brief.ts`, the `selected_records`/`active_onstage_cast_full`/`present_minor_cast_compressed`/`offstage_relevant_cast`/`selected_pov`/`manual_directive_id` object, `.strict()`) makes `selected_records` (`z.array(recordId)`), `active_onstage_cast_full` (`z.array(...)`), `selected_pov` (`z.union([recordId, "omniscient"])`), and `manual_directive_id` (`recordId`) all required; `present_minor_cast_compressed`/`offstage_relevant_cast` already `.default([])`. `generationSessionSchema` wraps it as `active_working_set: activeWorkingSetSchema.optional()` and is itself `.strict()`. Confirmed at decomposition.
2. Spec `specs/SPEC-004-...md` (Approach → `@loom/server` working-set routes; Risks & Open Questions #4) explicitly anticipated this ("If `setGenerationSession` currently validates against a strict full brief schema, a partial/loose membership shape may be needed — reconcile in the ticket phase"). `docs/story-record-schema.md` §3.1 (ACTIVE WORKING SET) lists `selected_pov` and `manual_directive_id` as fields without marking storage-requiredness; their generation-time necessity is a validation/compiler concern.
3. Shared boundary under audit: the **generation-time-brief schema** (`generationSessionSchema` / `activeWorkingSetSchema`) is the contract between this ticket, the working-set server routes (SPEC004RECCRUBAS-004), the web working-set surface (SPEC004RECCRUBAS-010), and future Phase-5 brief editing + Phase-6 validation. The relaxation must be additive-permissive so none of those consumers break.
4. FOUNDATIONS §7 (active working set supremacy — membership is a first-class manual decision, independent of the rest of the brief) and the project's "deterministic storage, fail-closed validation" split (§4.4/§4.5/§11) motivate storing membership permissively and enforcing completeness at generation. Per §20 (no silent retcon): SPEC-003 deliberately made these fields required; this ticket reverses that storage-level choice **for the documented reason** that Phase 4 needs membership persistence before the rest of the brief exists, and records the rationale here and in the schema doc — not silently.
5. Enforcement-surface note (substrate feeding a deferred surface): `selected_pov` and `manual_directive_id` presence is constitutionally required *at generation time* (FOUNDATIONS §11 hard fails: "missing manual directive"; "selected POV lacks required knowledge constraints"; `docs/story-record-schema.md` "Minimum prompt completeness"). That enforcement lands in the **Phase-6 validation engine**, which no code yet implements. This ticket confirms relaxing storage introduces no leakage or nondeterminism the later validator must undo: making a field optional at rest cannot bypass a fail-closed generation-time check that does not exist yet, and the field names/values are unchanged, so the Phase-7 compiler mapping stays mechanical. The relaxation must be paired with a `docs/story-record-schema.md` note so Phase 6 knows these are generation-time-required despite being storage-optional.
6. Schema extension classification: this **modifies an existing output schema** (`activeWorkingSetSchema`, a generation-time-brief surface). Consumers today: `setGenerationSession`/`getGenerationSession` (`record-repository.ts:313-333`) and `packages/server/src/record-layer.test.ts`. The change is `required → optional` (additive-permissive): every previously-valid full-brief payload remains valid, so it is non-breaking for existing producers; it only *admits* new partial payloads. No consumer asserts these fields are absent.

## Architecture Check

1. Relaxing the single canonical `activeWorkingSetSchema` keeps one working-set representation that Phase 5 fills in further, versus Option B's parallel "membership-only" key that Phase 5 would have to reconcile/merge (drift risk). It matches the established pattern where storage schemas are permissive and validation is the fail-closed gate.
2. No backwards-compatibility shim: the field requiredness is changed in place; no alias field, no dual schema, no migration (stored JSON is re-validated on read and previously-stored full briefs remain valid).

## Verification Layers

1. Membership-only `active_working_set` payload now parses -> schema validation (`generationSessionSchema.parse` of a `{ active_working_set: { selected_records: [...] } }` fixture).
2. Previously-valid full-brief payload still parses (non-breaking relaxation) -> schema validation (full-brief fixture parse).
3. `.strict()` still rejects unknown keys -> schema validation (unknown-key rejection test).
4. Storage relaxation introduces no generation-time leakage/nondeterminism the Phase-6 validator must undo -> FOUNDATIONS alignment check (§7/§11; deferred-enforcement note in `docs/story-record-schema.md`).
5. Core purity preserved -> FOUNDATIONS alignment check via `packages/core/test/boundary.test.ts`.

## What to Change

### 1. Relax the schema

In `packages/core/src/records/generation-brief.ts`, make `selected_pov`, `manual_directive_id`, and `active_onstage_cast_full` optional on `activeWorkingSetSchema` (e.g. `.optional()`, and `active_onstage_cast_full` may take `.default([])` for ergonomic membership writes). Keep `.strict()`. Leave `selected_records` required (an empty array is a valid empty working set). No other brief schema changes.

### 2. Reconcile the schema doc

In `docs/story-record-schema.md` §3.1 (ACTIVE WORKING SET), add a short note that `selected_pov` and `manual_directive_id` are **generation-time-required but storage-optional** — enforced by the Phase-6 validation engine, not the storage schema — so Phase 4 can persist membership-only working sets. Cite SPEC004RECCRUBAS-002 / Option A.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/records.test.ts` (modify) — add membership-only acceptance + full-brief still-valid cases

## Out of Scope

- Server working-set routes — SPEC004RECCRUBAS-004 (depends on this ticket).
- Web working-set surface — SPEC004RECCRUBAS-010.
- Phase-6 generation-time validation enforcing POV/directive presence — Phase 6.
- Any change to the other seven brief surfaces.

## Acceptance Criteria

### Tests That Must Pass

1. `generationSessionSchema.parse({ active_working_set: { selected_records: ["<uuid>"] } })` succeeds (membership-only write is now valid).
2. A previously-valid full `active_working_set` payload (all of `selected_records`, `active_onstage_cast_full`, `selected_pov`, `manual_directive_id`) still parses (non-breaking).
3. `.strict()` still rejects unknown keys on `activeWorkingSetSchema`.
4. `npm test`, `npm run typecheck`, `npm run lint` pass; `packages/core/test/boundary.test.ts` stays green.

### Invariants

1. The relaxation is `required → optional` only — no field renamed, removed, retyped, or added; no previously-valid payload becomes invalid (FOUNDATIONS §20 documented, non-breaking).
2. `selected_records` remains present on the schema (membership is always representable, even when empty).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — membership-only parse success, full-brief parse still valid, strict-unknown-key rejection.

### Commands

1. `npx vitest run packages/core/test/records.test.ts`
2. `npm test && npm run typecheck && npm run lint`
