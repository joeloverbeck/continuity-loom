# SPEC025SCHAUDPAS-006: Remove PLAN.can_drive_prose + extend shared migration + fix record-internal holder check

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — PLAN payload schema, two holder-reference validators (universal-blockers + record-internal), record editor/column/guidance, shared record-payload migration extension + mixed FACT/PLAN rollback tests, authority docs
**Deps**: archive/tickets/SPEC025SCHAUDPAS-005.md

## Problem

`PLAN.can_drive_prose` is internally contradictory: the compiler renders every selected active PLAN regardless of the flag (`pressure.ts`, which gates on `plan_status === "active"`), while two validators **honor** the flag. `universal-blockers.ts:203` uses `can_drive_prose === false` to *suppress* the holder/agency safety blocker, and `record-internal.ts:67` uses `can_drive_prose === true` to *gate* whether a PLAN `holder` reference is required. A selected active plan marked `false` still pressures prose **and** silently bypasses the proof that its holder can plausibly act — a deceptive control and a §29.3 silent-inclusion ambiguity. This ticket removes the field, makes every selected active PLAN holder a required reference, and extends the shared record-payload migration from ticket 005.

## Assumption Reassessment (2026-06-20)

1. `can_drive_prose: z.boolean()` is a required PLAN payload field (`causal-pressure.ts:60`). Two validators read it: `universal-blockers.ts:203` (`validateActivePlanHolders` — `payload.can_drive_prose === false` suppresses the holder blocker) and `record-internal.ts:67` (`isRecordReferenceRequired` — `can_drive_prose === true || hasExpectedLocalMode(snapshot, "non_pov_hidden_plan_behavior")` gates PLAN holder requiredness). Confirmed by grep. The compiler does **not** read it (`pressure.ts` gates on `plan_status === "active"` at `:21,:422`).
2. `docs/story-record-schema.md` §8.3 is the PLAN schema authority. The shared record-payload cleanup migration is created by ticket 005 (`packages/server/src/record-payload-cleanup-migration.ts`) and wired into `project-store.ts`; this ticket extends it to also strip `can_drive_prose`.
3. Cross-artifact boundary under audit: the PLAN payload schema ↔ **both** holder-reference validators (`universal-blockers.ts` + `record-internal.ts`). This is the reassessment **I1** finding — SPEC-025 R5 names both files explicitly. Removing the field without fixing `record-internal.ts:67` would silently reduce its `can_drive_prose === true` arm to `undefined === true` (false), making PLAN holder references required *only* under `non_pov_hidden_plan_behavior` — the opposite of this ticket's intent.
4. FOUNDATIONS principles motivating this ticket: §11 / §29.5 (fail-closed — every selected active PLAN must prove a plausible holder/means) and §29.1/§29.3 (removing a secondary gate makes PLAN *less* plot-like and selected-record membership the sole inclusion authority). Restated: selection is the gate; a selected active plan cannot bypass the holder/means safety check.
5. Enforcement-surface check (§8/§11): this **strengthens** fail-closed validation — deleting the `=== false` bypass and the `=== true` arm makes a PLAN `holder` a required selected ENTITY/CAST MEMBER reference for every selected active PLAN (keeping the `non_pov_hidden_plan_behavior` mode and any selected-active gating). Compiler stays unchanged (already correct) — pin the intended selected-active behavior with a test rather than adding a new filter. `fallback_steps` stays author-only / non-prompt-facing (preserves §12 no-rail boundary); `hasPlausibleMeans` may still read `resources` / `fallback_steps` / current step. The migration extension is fail-closed/rollback-safe. No secret-firewall surface touched.
6. Output-schema change: this modifies the PLAN record payload. It is **breaking** for any PLAN payload carrying `can_drive_prose`; consumers are `causal-pressure.ts` (schema + type), `editor-descriptors.ts`, `column-manifest.ts`, `field-guidance-records.ts`, field paths, both validators, the web `RecordEditor`, and tests. The shared migration removes the stored key so legacy projects parse.
7. Schema-field removal blast radius (grep `can_drive_prose`): src surfaces (`causal-pressure.ts`, `editor-descriptors.ts`, `column-manifest.ts`, `field-guidance-records.ts`, `universal-blockers.ts`, `record-internal.ts`) in Files to Touch; test consumers (`validation-record-internal.test.ts`, `validation-blockers.test.ts`, `validation-record-reference-drift.test.ts`, `validation-matrix-knowledge.test.ts`, `records.test.ts`, web `RecordEditor.test.tsx`) in Test Plan; the capstone assertion is owned by ticket 008. One vertical; the migration edit is the create-then-modify chain on ticket 005.

## Architecture Check

1. Making selected-record membership the sole inclusion authority and the holder reference unconditionally required (for selected active PLANs) is cleaner and safer than a per-plan boolean that contradicts the compiler: it removes a deceptive control and closes the silent holder-check bypass in *both* validators. Extending the shared migration (vs. a new PLAN-specific one) keeps one transactional per-row cleanup path.
2. No backwards-compatibility aliasing or shims: the field is deleted with no alias; both validators drop their flag arms rather than defaulting the absent flag; the web control is removed, not disabled.

## Verification Layers

1. `can_drive_prose` gone from PLAN payload + type + both validators → codebase grep-proof: `grep -rn "can_drive_prose" packages/` returns only the ticket-008 capstone test (zero in production src).
2. Every selected active PLAN holder is a required reference → unit tests on **both** validators: `universal-blockers` no longer suppresses the holder blocker; `record-internal` `isRecordReferenceRequired` returns true for a selected active PLAN `holder` regardless of any (now-absent) flag.
3. Compiler unchanged → golden byte-stability test: prose + ideation goldens identical for equivalent migrated PLAN data.
4. Migration strips `can_drive_prose`; mixed FACT/PLAN transaction rolls back atomically → server e2e: one malformed row in a mixed batch rolls back all changes; idempotent.

## What to Change

### 1. Remove the boolean from schema + editors

In `causal-pressure.ts`, remove `can_drive_prose` from the PLAN payload schema and inferred type. Update `editor-descriptors.ts`, `column-manifest.ts`, `field-guidance-records.ts`, and field paths (`field-paths.ts` / `field-path-enumeration.ts`).

### 2. Fix both holder-reference validators

In `universal-blockers.ts`, delete the `payload.can_drive_prose === false` arm from `validateActivePlanHolders` (`:203`) so every selected active PLAN holder is a required selected ENTITY/CAST MEMBER reference subject to holder/means checks. In `record-internal.ts`, fix `isRecordReferenceRequired` (`:67`): drop the `can_drive_prose === true` arm so a PLAN `holder` is required for every selected active PLAN, keeping the `non_pov_hidden_plan_behavior` mode and any selected-active gating. Add a test pinning the intended selected-active compiler behavior (no new filter).

### 3. Extend the shared migration + web + docs

Extend `record-payload-cleanup-migration.ts` (created by ticket 005) to also strip top-level `can_drive_prose` from PLAN payloads in the same per-row transactional cleanup; add mixed FACT/PLAN transaction tests proving one malformed row rolls back all changes. In `RecordEditor.tsx`, remove the boolean + guidance; replace with working-set selection guidance (select to pressure the writer; deselect to exclude). Update `docs/story-record-schema.md` §8.3 (selected-record membership is the gate; revise holder-selection language), `docs/compiler-contract.md`, `docs/prompt-template-rationale.md` causal-pressure sections, and `docs/validation-rule-inventory.md`. Goldens remain byte-identical (add byte-stability assertions).

## Files to Touch

- `packages/core/src/records/causal-pressure.ts` (modify)
- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/src/records/column-manifest.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/src/records/field-paths.ts` (modify)
- `packages/core/src/records/field-path-enumeration.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/validation/rules/record-internal.ts` (modify)
- `packages/server/src/record-payload-cleanup-migration.ts` (modify)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)

## Out of Scope

- The `FACT.status` removal and the migration's creation/wiring — ticket 005 (this ticket extends the existing migration only).
- The other retired fields and the effective-POV work — separate tickets.
- The retired-key capstone assertion (ticket 008). `fallback_steps` prompt exposure (stays author-only).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- validation-blockers validation-record-internal` — both validators require the holder reference for every selected active PLAN; no flag bypass remains.
2. A byte-stability test — prose + ideation goldens identical for equivalent migrated PLAN data.
3. `npm test -- record-payload-cleanup-migration` — `can_drive_prose` stripped; mixed FACT/PLAN batch rolls back atomically on one malformed row; idempotent.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green (typecheck proves the PLAN type no longer carries `can_drive_prose` across packages).

### Invariants

1. No production source under `packages/` references `can_drive_prose`; a selected active PLAN cannot bypass the holder/means check in either validator.
2. Equivalent migrated PLAN data compiles byte-identically.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-blockers.test.ts` — selected active PLAN with `false`-equivalent state still blocks on a missing/implausible holder.
2. `packages/core/test/validation-record-internal.test.ts` — `isRecordReferenceRequired` returns true for a selected active PLAN `holder` (I1 regression pin).
3. `packages/server/src/record-payload-cleanup-migration.test.ts` — extend with `can_drive_prose` strip + mixed FACT/PLAN rollback.
4. `packages/core/test/compiler-golden.test.ts` — PLAN byte-stability across the removal.
5. Update `validation-record-reference-drift.test.ts`, `validation-matrix-knowledge.test.ts`, `records.test.ts`, web `RecordEditor.test.tsx` per the `can_drive_prose` grep.

### Commands

1. `npm test -- validation-blockers validation-record-internal record-payload-cleanup-migration compiler-golden`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted suites prove both validators + migration + byte-stability; the full pipeline is the correct final boundary because the removal spans `@loom/core` schema/validators, `@loom/server` migration, and `@loom/web` editor under strict TS.
