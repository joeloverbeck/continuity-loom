# SPEC025SCHAUDPAS-005: Remove FACT.status + add shared record-payload cleanup migration

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — FACT payload schema + registry status projection, record editor/column/guidance, NEW server record-payload cleanup migration + project-store wiring, web FACT status control, authority docs, demo fixture
**Deps**: None

## Problem

`FACT.status` is a required enum whose only legal value is `active` (`packages/core/src/records/knowledge.ts:7,14`). Active truth is already the FACT category invariant (FOUNDATIONS §14); the field cannot distinguish two states, express author control, or back a validation decision, yet it implies a lifecycle choice in editors/grids. This ticket removes the payload field, keeps `active` as a registry-projected invariant, and introduces the shared record-payload cleanup migration (also used by ticket 006 for `PLAN.can_drive_prose`).

## Assumption Reassessment (2026-06-20)

1. `factStatusValues = ["active"]` (`knowledge.ts:7`), `status: z.enum(factStatusValues)` is a required FACT payload field (`knowledge.ts:14`), and the registry entry projects it via `statusValues: factStatusValues` + `projectStatus: (payload: Fact) => payload.status` (`knowledge.ts:89-90`). Confirmed by grep. No validator branches on a FACT's payload `status` (reassessment grep: FACT reads in `matrix-voice.ts:210` use `known_by`; `universal-completeness.ts:313` keys on `record.type === "FACT"`, not `.status`), so removing it is compiler/validation-behavior-neutral.
2. `docs/story-record-schema.md` §6.1 is the FACT schema authority. Existing migrations are invoked from `packages/server/src/project-store.ts` (create path L284/286, open path L391/393) after global-config/draft migrations and before strict `RecordRepository` reads — the new record-payload cleanup migration wires in at the same seams.
3. Cross-artifact boundary under audit: the FACT payload schema (`knowledge.ts` / `docs/story-record-schema.md` §6.1) ↔ the registry status projection ↔ the record editor/column manifest. The projection must switch from reading a payload key to a constant so the inferred `Fact` type (which loses `.status`) still typechecks.
4. FOUNDATIONS principle motivating this ticket: §14 (FACT = active truth). Restated: active truth is the category invariant, not a stored lifecycle choice; supersession stays a diagnostic, never a stored FACT status. Removing the field makes the invariant impossible to mis-enter.
5. Enforcement-surface check (§8/§11): **compiler behavior must not change** — FACTs are selected by kind/scope/knowledge/visibility/salience/working-set membership, not payload status, so prose + ideation goldens stay **byte-identical** for equivalent migrated data (byte-stability tests assert this). The new migration is fail-closed: per FACT row, parse `payload_json`, delete only top-level `status`, validate with the new strict parser, write canonical JSON only when changed, preserve siblings/id/type/label/metadata/timestamps, roll back on malformed JSON or failed validation, idempotent. No secret-firewall surface touched.
6. Output-schema change: this modifies the FACT record payload. It is **breaking** for any FACT payload carrying `status`; consumers are `knowledge.ts` (schema + `Fact` type + registry projection), `registry.ts`, `editor-descriptors.ts`, `column-manifest.ts`, `field-guidance-records.ts`, field paths, the demo fixture, the web `RecordEditor`, and schema tests. The shared migration removes the stored key so legacy projects parse.
7. Schema-field removal blast radius (grep `factStatusValues` → `knowledge.ts` only in src; broader `FACT`+`status` reads checked clean in (1)). One vertical (schema tighten + migration + cross-package consumers co-land). The migration is **created here** and **extended by ticket 006** (create-then-modify chain — 006 `Deps: 005`). The retired-key capstone assertion is owned by ticket 008.

## Architecture Check

1. Keeping `["active"]` as registry metadata with a `projectStatus: () => "active"` projection (not a payload key) is cleaner than a single-value required field: the grid/editor still shows the invariant read-only, but the payload can no longer carry a misleading lifecycle control. A shared record-payload cleanup migration (vs. two field-specific migrations) keeps one transactional code path for per-row payload edits, which ticket 006 extends rather than duplicates.
2. No backwards-compatibility aliasing or shims: the projection is a constant, not a fallback read of an absent key; the migration deletes the key with no alias; the web editor renders a read-only projected value, not a fake editable control.

## Verification Layers

1. `status` gone from FACT payload + `Fact` type → codebase grep-proof: `grep -n "status" packages/core/src/records/knowledge.ts` shows no FACT payload `status` field (BELIEF/SECRET statuses remain); `factStatusValues` survives only as registry metadata.
2. FACT rendering unchanged → golden byte-stability test: prose + ideation goldens identical before/after for equivalent migrated FACT data.
3. Registry projects `active` read-only → unit test on the registry status projection (`projectStatus` returns `"active"` without reading payload).
4. Migration is transactional + idempotent + rollback-safe → server e2e: a FACT row with `status` is cleaned on open; second open no-ops; a malformed `payload_json` row rolls back atomically with an actionable error; siblings/id/label/metadata/timestamps preserved.

## What to Change

### 1. Remove the payload field; keep the registry invariant

In `knowledge.ts`, remove `status` from the FACT payload schema and the inferred `Fact` type; keep `factStatusValues: ["active"]` as registry metadata and change the projection to `projectStatus: () => "active"`. Update `registry.ts` status projection, `editor-descriptors.ts`, `column-manifest.ts` (no editable status column for FACT), `field-guidance-records.ts`, and field paths (`field-paths.ts` / `field-path-enumeration.ts`). Compiler behavior must not change.

### 2. Add the shared record-payload cleanup migration + wire it

Create `packages/server/src/record-payload-cleanup-migration.ts`: per record row of the targeted type, parse `payload_json`, delete only the targeted top-level key(s) (this ticket: FACT `status`), validate against the new strict parser, write canonical JSON only when changed, preserve siblings/id/type/label/metadata/timestamps, roll back on malformed JSON or failed validation, idempotent. Wire it into `project-store.ts` at both the create and open seams (after global-config/draft migrations, before strict `RecordRepository` reads). Structure it so ticket 006 can add `PLAN.can_drive_prose` to the same per-row cleanup.

### 3. Web editor + docs + fixture

In `RecordEditor.tsx`, remove the single-option FACT status input; render the registry-projected read-only `active` (or omit the column per existing policy) — no fake editable control. Update `docs/story-record-schema.md` §6.1 (FACT active status = implicit invariant), and `docs/compiler-contract.md` / `docs/prompt-template-rationale.md` / `docs/validation-rule-inventory.md` only where they name the field. Update the demo fixture `letter-under-flour-bin.ts` to drop FACT `status`; the goldens must remain byte-identical (add byte-stability tests).

## Files to Touch

- `packages/core/src/records/knowledge.ts` (modify)
- `packages/core/src/records/registry.ts` (modify)
- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/src/records/column-manifest.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/src/records/field-paths.ts` (modify)
- `packages/core/src/records/field-path-enumeration.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/record-payload-cleanup-migration.ts` (new)
- `packages/server/src/project-store.ts` (modify)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)

## Out of Scope

- `PLAN.can_drive_prose` removal and the mixed FACT/PLAN rollback test — ticket 006 (which extends this migration).
- BELIEF/SECRET status fields (retained) and the other retired fields — separate tickets.
- The retired-key capstone assertion (ticket 008). Any FACT lifecycle/supersession stored status (rejected — supersession stays a diagnostic).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- records` (schema tests) — FACT payload rejects/ignores `status`; registry projects `active`.
2. A new byte-stability test — prose + ideation goldens identical for equivalent migrated FACT data (`status` removed).
3. A new `record-payload-cleanup-migration` test — FACT `status` stripped on open; idempotent; malformed-row rollback with actionable error; siblings/metadata/timestamps preserved.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green (typecheck proves the `Fact` type no longer carries `.status` across packages).

### Invariants

1. No FACT payload under `packages/` carries `status`; `factStatusValues` survives only as registry metadata projecting `"active"`.
2. Equivalent migrated FACT data compiles byte-identically (no accidental dependence on the removed field).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — FACT schema without payload `status`; registry projection returns `active`.
2. `packages/server/src/record-payload-cleanup-migration.test.ts` (new) — strip, idempotence, malformed-row rollback, sibling/metadata preservation.
3. `packages/core/test/compiler-golden.test.ts` — byte-stability assertion for FACT data across the removal.
4. `packages/web/src/records/RecordEditor.test.tsx` — no editable FACT status control; read-only `active` (or omitted column).

### Commands

1. `npm test -- records record-payload-cleanup-migration compiler-golden`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted suites prove schema + migration + byte-stability; the full pipeline is the correct final boundary because the removal spans `@loom/core` schema/type, `@loom/server` migration + wiring, and `@loom/web` editor under strict TS.

## Outcome

Completed: 2026-06-20

Removed `status` from the strict FACT payload schema and changed the registry projection to constant `active`. Descriptor-derived editor and field-path surfaces no longer expose an editable FACT payload status, and the FACT-specific browser/column display omits the removed payload column while list-level record metadata can still show projected status.

Added the shared `record-payload-cleanup-migration` and wired it into both project create/open seams before strict repository reads. The migration strips top-level legacy FACT `status`, validates the strict payload, updates projected metadata, is idempotent, and avoids partial writes when malformed JSON or invalid stripped payloads are encountered.

Docs now state FACT active truth as an implicit category invariant. `docs/validation-rule-inventory.md` did not require an edit because it did not name the removed FACT payload field. The demo fixture did not contain a FACT payload `status` key to remove.

Verification:
- `npm test -- records record-payload-cleanup-migration compiler-golden RecordEditor column-manifest project-store record-routes record-layer`
- `npm test -- story-notes-migration`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite chunk-size warning)
- `git diff --check`
- Grep: `FACT.status` / FACT payload status references are absent from live implementation surfaces; `factStatusValues` remains only as registry metadata.

Browser smoke: not run; this ticket is covered by schema, server migration, compiler byte-stability, and descriptor-driven UI tests.
