# CASTLABEL-002: Backfill stale persisted display labels on project open

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/display-label-backfill.ts` invoked from `packages/server/src/project-store.ts` `openProject`; regression test `packages/server/src/display-label-backfill.test.ts`. Uses `deriveDisplayLabel` from `@loom/core`. No schema change; rewrites only the derived `records.display_label` column.
**Deps**: CASTLABEL-001 (derivation must be correct before backfilling from it)

## Problem

`display_label` is computed once and **stored** in the `records` table. Every CAST MEMBER record saved before CASTLABEL-001 holds the stale value `"Cast Member"`. Fixing the derivation function alone does not repair existing projects — the red-bunny project, and any other already-authored project, keep the wrong label until each record is manually re-saved.

The stale value has a wide blast radius:
- Working-set rows and the Records browser "Label" column (`packages/web/src/records/RecordBrowser.tsx`) show "Cast Member" for every cast member.
- **Reference pickers** render `<option value={record.id}>{record.displayLabel}</option>` (`RecordEditor.tsx:240-247`, `CastMemberEditor.tsx:161`), so POV/relationship selectors list every cast member as "Cast Member".
- **The compiled prompt** uses the stored label: `packages/core/src/compiler/sections/cast.ts:121` emits `## ${displayLabel(record)}` for rich dossiers and `:57`/`:89` for voice-pressure pins, where `displayLabel` resolves to `record.metadata?.displayLabel ?? record.id` (`cast.ts:236-238`). Both characters' dossiers are therefore titled `## Cast Member`, flattening cast identity in the prose prompt.

This ticket adds a deterministic, idempotent backfill that recomputes `display_label` from each record's payload on project open, mirroring the existing `repairWorkingSetReferences` on-open migration.

## Assumption Reassessment (2026-06-07)

1. `display_label` is **never user-authored**: both editors always overwrite it via `deriveDisplayLabel(recordType, values)` on create *and* update (`packages/web/src/records/RecordEditor.tsx:439-440`, `packages/web/src/records/CastMemberEditor.tsx:83-84`). A repo-wide search finds no manual `display_label` input control. Therefore recomputing the stored value cannot clobber author intent — it restores the value the editors would have written.
2. The compiler reads the **stored** label, not a freshly derived one: `packages/core/src/compiler/sections/cast.ts:236-238` returns `record.metadata?.displayLabel ?? record.id`; the snapshot is built from persisted records (`packages/server/src/snapshot-builder.ts`). So the prompt defect is only repaired by correcting the stored data — this is the prompt-generation problem the symptom report suspected.
3. On-open migration precedent exists and is the canonical hook: `project-store.ts:348-350` calls `ensureRecordTables(database)`, then `migrateGlobalConfigRecords(database)`, then `repairWorkingSetReferences(database)` inside `openProject`. The new backfill slots in alongside these, after `ensureRecordTables`. The structural template is `packages/server/src/working-set-integrity-migration.ts` (read rows, compute, write changed rows in a single transaction).
4. FOUNDATIONS principle under audit — **§8 deterministic compilation** and **§24 / §4.10 local-first user-owned data**: recomputing a derived denormalization is deterministic and does not mutate user-authored story canon (the payload is the source of truth; `display_label` is a derived index of it). It is not an LLM operation and triggers no §29.2 hard-fail (no inferred canon, no record-content mutation). It also serves §17 / §4.8 by restoring distinct cast identity in the prompt.
5. Information-path note: `display_label` is a denormalized cache of `deriveDisplayLabel(type, payload)`. This ticket does **not** introduce a second derivation path — it reuses the same `@loom/core` helper, keeping one canonical derivation rule. The backfill only re-synchronizes the cache with that single rule.
6. Scope decision — backfill is **all-types**, not cast-only: the same `deriveDisplayLabel` correction model applies to any record whose stored label drifted from its payload. Recomputing every record (writing only rows where stored ≠ derived) is the robust, type-agnostic form and avoids a second cast-special-case path. This is additive to existing on-open repair and changes no schema.

## Architecture Check

1. An idempotent on-open backfill keyed on "stored label ≠ derived label" is cleaner than (a) a one-shot manual re-save (poor UX, misses every existing record) or (b) re-deriving the label at every read site (would scatter derivation across compiler, browser, and pickers, and contradict the existing denormalized-`display_label` design). It re-uses the single `@loom/core` derivation rule and the established on-open migration slot, so there is exactly one derivation authority and one repair point.
2. No backwards-compatibility shim or alias path: the backfill writes the canonical derived value in place; it does not add a parallel label field or preserve the old value anywhere.

## Verification Layers

1. After open, no record's `display_label` differs from `deriveDisplayLabel(type, payload)` → server unit test opening a fixture DB seeded with stale labels and asserting post-open equality.
2. Cast members specifically resolve to identity-derived labels (not "Cast Member") after open → server test assertion on a seeded CAST MEMBER row.
3. Backfill is idempotent and only writes changed rows → test runs the backfill twice and asserts the second pass reports zero updates.
4. Recompute does not mutate `payload_json` (story canon untouched) → test asserts payload bytes unchanged for a record whose label was rewritten → FOUNDATIONS §24 / §8 alignment check.

## What to Change

### 1. New backfill module

Add `packages/server/src/display-label-backfill.ts` exporting `backfillDisplayLabels(database)`, structured like `working-set-integrity-migration.ts`:
- Select `id, type, display_label, payload_json` from `records`.
- For each row, compute `deriveDisplayLabel(type, JSON.parse(payload_json))`.
- Collect rows where the computed label differs from the stored `display_label`.
- If none differ, return an empty summary (no transaction).
- Otherwise, in a single `BEGIN IMMEDIATE` … `COMMIT` (with `ROLLBACK` on error), `UPDATE records SET display_label = ?, updated_at = ? WHERE id = ?` for each changed row.
- Return a summary `{ updatedIds: string[] }`.

### 2. Invoke on project open

In `packages/server/src/project-store.ts` `openProject`, call `backfillDisplayLabels(database)` after `ensureRecordTables(database)` and alongside the existing `migrateGlobalConfigRecords` / `repairWorkingSetReferences` calls (≈ `project-store.ts:348-350`).

## Files to Touch

- `packages/server/src/display-label-backfill.ts` (new)
- `packages/server/src/project-store.ts` (modify)
- `packages/server/src/display-label-backfill.test.ts` (new)

## Out of Scope

- The derivation-function fix itself (CASTLABEL-001; this ticket depends on it).
- Working-set control labelling / accessibility (CASTLABEL-003).
- Changing the storage model away from a denormalized `display_label` column.
- Touching `updated_at` semantics for records whose label did not change (only changed rows are rewritten).

## Acceptance Criteria

### Tests That Must Pass

1. `display-label-backfill.test.ts`: opening (or running the backfill on) a DB seeded with a CAST MEMBER row storing `display_label = "Cast Member"` and a populated `identity.one_line` yields the identity-derived label.
2. Idempotency: a second backfill pass reports zero updated rows.
3. `payload_json` of a relabelled record is byte-identical before/after.
4. `npm run typecheck`, `npm run lint`, and `npm test` pass.

### Invariants

1. After `openProject`, every record's stored `display_label` equals `deriveDisplayLabel(type, payload)` (single derivation authority, cache synchronized).
2. The backfill never alters `payload_json` and never writes rows whose label is already correct.

## Test Plan

### New/Modified Tests

1. `packages/server/src/display-label-backfill.test.ts` — seeds stale labels (incl. CAST MEMBER), asserts repair, idempotency, and payload immutability.

### Commands

1. `npm test -- display-label-backfill`
2. `npm run typecheck && npm run lint && npm test`

## Outcome

Completion date: 2026-06-07

Added `packages/server/src/display-label-backfill.ts`, which recomputes stored `records.display_label` values from `deriveDisplayLabel(type, payload_json)` and updates only rows whose cached label differs. Wired the backfill into project-store initialization before repositories are exposed, and added direct plus open-project regression coverage for stale CAST MEMBER labels, idempotency, and payload immutability.

Deviations from original plan: added a small `packages/server/src/project-store.test.ts` integration assertion to prove the on-open hook, and raised the ESLint default-project file-count cap in `eslint.config.js` because adding the new test file crossed the existing limit during `npm run lint`.

Verification results:

- `npm test -- display-label-backfill` passed.
- `npm test -- display-label-backfill project-store` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
