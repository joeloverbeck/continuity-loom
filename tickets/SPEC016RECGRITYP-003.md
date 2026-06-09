# SPEC016RECGRITYP-003: Grid renders columns from the manifest

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — reworks the records grid rendering in `packages/web/src/records/RecordBrowser.tsx` to build TanStack columns from the `@loom/core` manifest per active type. UI behavior change on the `/records` surface; no server/schema change.
**Deps**: SPEC016RECGRITYP-001, SPEC016RECGRITYP-002

## Problem

`RecordBrowser.tsx` builds a single hardcoded column set (`columns`, lines 22–33) used for every type, so EMOTION shows empty `Salience`/`Urgency` and hides `affect_kind`/`intensity`, and the long primary-label cell (lines 432–441) renders as a tall block. The grid must instead build its columns from the per-type manifest for the selected type, render a minimal shared set for "All types", show the primary label per the new rules, and render "—" for empty cells.

## Assumption Reassessment (2026-06-09)

1. Current hardcoded columns are `const columns` at `RecordBrowser.tsx:22–33` (`type, displayLabel, status, salience, urgency, archived`), fed to `useReactTable` at line 191–195. The Working Set toggle is a hardcoded leading `<th>`/`<td>` (lines 415, 427–431), independent of the data columns — it is preserved unchanged. The primary-label cell special-cases `cell.column.id === "displayLabel"` into a `linkButton` (lines 434–437). `descriptorHasField` (lines 35–37) and the existing filters/search/grouping (lines 39–62, 138–189) remain.
2. The manifest (`recordColumnManifest`, `allTypesColumns`) and `RecordSummary.displayValues` are provided by SPEC016RECGRITYP-001/002; this ticket consumes them. The active type is `filters.type` (`""` = All types) set by the Type `<select>` (lines 325–338).
3. Cross-artifact boundary under audit: the `@loom/core` manifest column descriptors (field key, header, kind/align) ↔ the `RecordSummary.displayValues` map keyed by those same field keys. The grid reads `row.original.displayValues?.[fieldKey]` for additional columns; a mismatch would render blanks, so the manifest is the single keying authority.
4. Modifies existing behavior (§20 no silent retcon): the rationale is SPEC-016 §Problem — the fixed union grid produces meaningless empty columns and hides type-relevant fields. The Working Set toggle, filters, search, and grouping are intentionally preserved; only the data-column construction and primary-label/empty-cell rendering change.

## Architecture Check

1. Building `ColumnDef[]` from the manifest for `filters.type` (or `allTypesColumns` when `""`) replaces the static array with a memoized derivation — one declarative source, no per-type branching in JSX. Reading additional-column values from `displayValues` (already projected server-side) keeps the component free of payload-parsing logic. Carrying `displayValues` through `toRecordSummary` keeps a freshly-saved row consistent with a reloaded one.
2. No backwards-compatibility aliasing/shims: the static `columns` array is removed, not aliased; the Working Set leading column stays as the existing hardcoded markup.

## Verification Layers

1. Per-type columns (EMOTION shows Affect kind/Intensity, not empty Salience/Urgency) -> `RecordBrowser.test.tsx` assertion (authored in SPEC016RECGRITYP-006) + manual review.
2. "All types" minimal set (Working Set, Type, Label, Status, Updated; OPEN THREAD's thread-kind not shown here) -> component test (006) + manifest grep-proof.
3. Empty-cell rendering ("—" for null `displayValues`) and primary-label link preserved -> component test (006) + manual review of the cell renderer.
4. Working Set toggle + filters/search/grouping unchanged -> grep-proof that the toggle markup (lines 415, 427–431) and `filterLocally`/`groupingOptions` are intact + existing test coverage.

## What to Change

### 1. Build columns from the manifest

Replace the static `columns` array with a `useMemo` that, for `filters.type === ""`, builds columns from `allTypesColumns` (Type, Label, Status, Updated), and otherwise builds: Label (primary) + each `recordColumnManifest[type].additionalColumns` mapped to `ColumnDef` with `accessorFn: (row) => row.displayValues?.[fieldKey] ?? null`, header from the descriptor (OPEN THREAD → "Thread kind"), and alignment from `kind`. Feed the memoized list to `useReactTable`.

### 2. Primary-label + empty cells

Keep the Label column as the clickable `linkButton` to detail. Render additional-column cells via a shared cell renderer that prints `value ?? "—"`. (Bounded width / line-clamp is CSS — SPEC016RECGRITYP-005.)

### 3. Carry `displayValues` through the saved-record path

In `toRecordSummary` (lines 64–77), copy `record.displayValues` onto the constructed summary so a freshly-saved record renders its type columns immediately (the detail response carries it per SPEC016RECGRITYP-002).

## Files to Touch

- `packages/web/src/records/RecordBrowser.tsx` (modify)

## Out of Scope

- Default-type-on-load, URL `type` sync, type-scoped default sort, and the empty state (SPEC016RECGRITYP-004).
- Label line-clamp / bounded width / horizontal-scroll container / sticky columns CSS (SPEC016RECGRITYP-005).
- The `RecordBrowser.test.tsx` assertions for these behaviors (SPEC016RECGRITYP-006).
- Reference-field name resolution — deferred per spec §Out of Scope.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck` — the manifest-driven `ColumnDef` construction type-checks against `RecordSummary` (incl. optional `displayValues`).
2. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx` — existing record-browser tests still pass after the column rework (new per-type assertions land in 006).
3. `npm run lint && npm test` — full gates pass.

### Invariants

1. The active type determines the rendered data columns: a scoped type renders its manifest columns; `""` renders exactly `allTypesColumns`. No type ever renders a column that is null for the entire type.
2. The Working Set toggle leading column and all existing filters/search/grouping controls are preserved unchanged.
3. Additional-column cells read only from `displayValues` (no payload parsing in the component); a null value renders "—".

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — re-run existing cases against the reworked grid (no new assertions here; per-type/All-types/default/empty-state assertions are authored in SPEC016RECGRITYP-006 to keep the shared test file owned by one ticket).

### Commands

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx`
2. `npm test`
3. The component test is the correct boundary because the rework is web-only rendering; `npm test` confirms cross-package typecheck against the core manifest export.
