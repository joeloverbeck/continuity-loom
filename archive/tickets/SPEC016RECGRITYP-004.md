# SPEC016RECGRITYP-004: Default type, URL sync, default sort, empty state

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds default-type resolution, `type`↔URL sync, type-scoped default sort, and a three-part empty state to `packages/web/src/records/RecordBrowser.tsx`. UI behavior change on `/records`; no server/schema change.
**Deps**: SPEC016RECGRITYP-001, SPEC016RECGRITYP-003

## Problem

After the grid renders per-type columns (SPEC016RECGRITYP-003), the surface still opens on the meaningless "All types" union and offers no scoped default sort or empty state. On load the grid should resolve a sensible default type (URL param → most-populated → "All types"), mirror the type to the URL, default-sort a scoped view by its severity column descending, and show a useful empty state when a type has zero records.

## Assumption Reassessment (2026-06-09)

1. The component already reads `useSearchParams` (`RecordBrowser.tsx:80`) and consumes `recordId`/`create` params (lines 256–276); the `type` filter is local state (`filters.type`, lines 88–96, 327–337). No `type` URL sync exists today — this ticket adds it. The existing grouping/sort lives in `groupedRecords` (lines 179–189), which sorts by `String(left[field]).localeCompare(...)` — i.e. **alphabetically**, not by severity.
2. Severity ordering must use the manifest's `severityOrdinal`/`compareSeverityDesc` from SPEC016RECGRITYP-001, not `localeCompare` (which orders `critical/high/low/medium` wrong). The default sort applies only when **Group by** is "None"; the existing Group-by controls remain.
3. Cross-artifact boundary under audit: the core `severityOrdinal` domain (`low<medium<high<critical`; intensity `…<extreme`) ↔ the per-type severity column the manifest marks (`salience`/`urgency`/`intensity`). The sort reads the severity value from `displayValues` (or existing `salience`/`urgency` metadata) and ranks via the ordinal.
4. Modifies existing behavior (§20 no silent retcon): rationale is SPEC-016 §Default view — opening on the union is "basically useless"; a scoped, action-sorted default with restorable URL state and a real empty state is the fix. §6.1 (all story records) is preserved: "All types" remains an explicit reachable choice; default-scoping changes presentation, not completeness, and cross-type search is untouched.

## Architecture Check

1. Resolving the active type once on load (URL `type` if valid → most-populated among loaded records → `""`) and mirroring it to the `type` search param makes the view restorable/shareable using the router the component already uses, with no new persistence layer. Using the manifest severity ordinal for the default sort fixes the alphabetical mis-order at the single sort site rather than per-column.
2. No backwards-compatibility aliasing/shims: the URL sync reuses `useSearchParams`; no duplicate state store is introduced. Most-populated resolution is a deterministic count with a stable tie-break (first in `recordTypes` order).

## Verification Layers

1. Default type on load = most-populated (URL `type` overrides) -> `RecordBrowser.test.tsx` (006) + manual review.
2. `type`↔URL sync (changing the Type select updates `?type=`; loading `?type=FACT` selects FACT) -> component test (006).
3. Default sort orders by severity descending via the ordinal (not lexicographic), only when Group by = None -> component test (006) asserting order for a type with `salience`/`intensity`.
4. Empty state (status line + what-the-type-holds + "Create {TYPE}") renders for a zero-record type -> component test (006) + manual review.

## What to Change

### 1. Default-type resolution + URL sync

On load, resolve the active type: valid `searchParams.get("type")` → else the most-populated type among loaded records (tie-break: first in `recordTypes`) → else `""`. Mirror `filters.type` into the `type` search param via `setSearchParams` whenever it changes.

### 2. Type-scoped default sort

When `filters.groupBy === ""` and the active type has a severity column (`salience`/`urgency`/`intensity` per the manifest), sort `groupedRecords` by that value descending using `compareSeverityDesc`; else by `updatedAt` descending. Keep the existing Group-by sort path for when a group field is selected.

### 3. Three-part empty state

When the active scoped type has zero records, render: a status line, one sentence on what the type holds, and the matching "Create {TYPE}" action (reusing `openCreateForm`).

## Files to Touch

- `packages/web/src/records/RecordBrowser.tsx` (modify)

## Out of Scope

- The manifest-driven column construction itself (SPEC016RECGRITYP-003).
- CSS / line-clamp / horizontal scroll / sticky columns (SPEC016RECGRITYP-005).
- The `RecordBrowser.test.tsx` assertions (SPEC016RECGRITYP-006).
- "Last-used" persistence beyond the URL param — spec §Risks (out of scope).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx` — existing tests pass after the default-view/sort/empty-state changes (new assertions in 006).
2. `npm run typecheck && npm run lint` — pass.
3. `npm test` — full gates pass.

### Invariants

1. On load with no URL `type`, the active type is the most-populated type among existing records (deterministic tie-break); a valid `?type=` overrides; with no records the view falls back to "All types".
2. The default severity sort uses the manifest ordinal (not `localeCompare`) and applies only when Group by = None; Group-by controls remain functional.
3. "All types" stays reachable and cross-type search is unchanged (§6.1 completeness preserved).

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — re-run existing cases; the default-type / URL-sync / default-sort / empty-state assertions are authored in SPEC016RECGRITYP-006 (single owner for the shared test file).

### Commands

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx`
2. `npm test`
3. The component test is the correct boundary because default-view, URL sync, sort, and empty state are all client-side; `npm test` confirms the core severity-ordinal import type-checks across packages.

## Outcome

Completed: 2026-06-09

What changed:
- Added `?type=` initialization and synchronization for the records type filter.
- Added one-time default type resolution from projected record summaries: valid URL type → most-populated projected type → "All types".
- Added scoped default sort by manifest severity column (`salience`, `urgency`, or `intensity`) using `compareSeverityDesc`, with `updatedAt` descending as fallback.
- Added a scoped zero-record empty state with status line, type description, and `Create {TYPE}` action.

Deviations from original plan:
- The new default/sort behavior is gated on summaries carrying `displayValues`. This preserves the optional projection contract and keeps legacy/test fixtures without projected display values on the pre-SPEC-016 path; production list responses from SPEC016RECGRITYP-002 carry `displayValues`.
- Used `npm exec vitest -- ...` for the targeted component test rather than `npx vitest ...`; the same test file was run.

Verification:
- `npm exec vitest -- run packages/web/src/records/RecordBrowser.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
