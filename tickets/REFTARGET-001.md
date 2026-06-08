# REFTARGET-001: Source the record editor's reference-target universe independently of the browse filter

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` `RecordBrowser` reference-target wiring only. No schema, storage, validation, or compiler change.
**Deps**: None

## Problem

In the Records browser, every reference `<select>` in the record editor (e.g. OBJECT `owner`/`carried_by`/`current_location`, VISIBLE AFFORDANCE `available_to`, and all other reference fields) loses its entity/location options whenever a browse-list filter is active. With the type filter set to OBJECT, opening an OBJECT's editor shows `owner`/`carried_by`/`current_location` with **only their sentinel options** and no records to pick — and a `carried_by` that holds a real ENTITY UUID renders blank (the stored reference is masked).

Root cause: `RecordBrowser` reuses the browse-filtered record list as the editor's reference-target universe.
- The list fetch sends the active filters to the server (`packages/web/src/records/RecordBrowser.tsx:105-111`, e.g. `...(filters.type ? { type: filters.type } : {})`), so `records` (`RecordBrowser.tsx:66`) is narrowed to the filtered type.
- That same narrowed array is passed straight to both editor invocations as `referenceRecords={records}` (`RecordBrowser.tsx:252`, `:270`).
- `eligibleReferenceTargets(refRole, records)` (`packages/core/src/records/editor-descriptors.ts:180-191`) filters by target type, so when `records` excludes ENTITY/LOCATION, every cross-type picker has zero options.

This is **not** caused by the AFFORD work. The `referenceRecords={records}` sourcing was introduced in `0cf6b74` (2026-06-05), 233 commits before AFFORD-001. AFFORD-001 (reclassifying `owner`/`carried_by`/`current_location` from `reference` to `sentinel_reference`) only changed the *visible* symptom from an empty "Select record" option to sentinel-only options; it did not introduce the starvation.

User-visible consequence: references are unauthorable (and stored references are masked, risking silent loss on save) whenever the author has filtered the record list — which the natural "find the record to edit" flow encourages.

## Assumption Reassessment (2026-06-08)

1. `RecordBrowser` sends browse filters to the server and reuses the result as the editor reference universe: `listRecords({ ...(filters.type ? { type } : {}), ...status, ...q, ...refRole, ...targetId })` at `packages/web/src/records/RecordBrowser.tsx:105-111`; result stored in `records` (`:66`, set at `:125`); passed as `referenceRecords={records}` to the generic `RecordEditor` (`:252`) and the `CastMemberEditor` (`:270`). Confirmed.
2. The eligible-target helper filters strictly by target type and archived state: `eligibleReferenceTargets` at `packages/core/src/records/editor-descriptors.ts:180-191` (`eligibleTypeSet.has(record.type) && !record.archived`). It is correct; the defect is the starved input array, not this helper.
3. Shared boundary under audit: the `RecordBrowser` → (`RecordEditor` | `CastMemberEditor`) `referenceRecords` prop. The established correct pattern already exists in the repo: `StoryConfigEditor` fetches its reference universe independently of any browse filter (`packages/web/src/config/StoryConfigEditor.tsx:158,213` — `listRecords({ type: "ENTITY" })` into its own `referenceRecords` state). This ticket brings `RecordBrowser` in line with that pattern.
4. FOUNDATIONS principle under audit: local-first authoring integrity — the app must not silently drop or mask user-authored data (the spirit of §4/§20 human-gatekeeping and the §29 "silently remove/alter" hard-fail family, applied to the editor authoring surface). The fix restores alignment; it removes a path where a valid stored reference is hidden from the author and at risk on save. No deterministic-compilation (§8) or secret-firewall (§15) surface is touched.
8. Adjacent findings classified: (a) the AFFORD reclassification is *not* the cause (separate, already-shipped, correct change — no action); (b) a stored reference to an **archived or deleted** target is also filtered out by `eligibleReferenceTargets` and would render blank even after this fix — that residual is a **separate follow-up**, REFTARGET-002, not in scope here.

## Architecture Check

1. A dedicated, browse-filter-independent reference-target fetch is cleaner than threading the browse filters out of the picker or special-casing affected fields: it fixes every reference picker (all record types, all roles) at one site, and matches the existing `StoryConfigEditor` precedent rather than inventing a new pattern. Filtering the table locally instead of server-side would not help — `status`/`q`/`refRole`/`targetId` filters would still starve the pickers.
2. No backwards-compatibility shim or duplicate authority: the browse table keeps using its filtered/grouped list; only the editors' `referenceRecords` prop is repointed to the new unfiltered universe. No alias, no second source of truth for record data.

## Verification Layers

1. Editor reference universe is independent of the active type filter: with the type filter set to OBJECT, the OBJECT editor's `owner` picker still lists ENTITY records and `current_location` lists LOCATION records -> `@loom/web` RTL test on `RecordBrowser`.
2. A stored entity reference survives round-trip while a filter is active: open a record whose `carried_by` is an ENTITY UUID under an active OBJECT filter; the select shows the resolved entity and submitting preserves the UUID -> `@loom/web` RTL test.
3. The browse table itself is unchanged by the fix (still reflects the active filters) -> existing `RecordBrowser` table tests (non-regression) plus FOUNDATIONS alignment check that no records are silently injected into the table.

## What to Change

### 1. Add a browse-filter-independent reference-target universe in `RecordBrowser`

In `packages/web/src/records/RecordBrowser.tsx`:
- Add state `const [referenceTargets, setReferenceTargets] = useState<RecordSummary[]>([])`.
- Add a `useEffect` that fetches `listRecords({})` (no browse filters) and stores the full result in `referenceTargets`. It must **not** depend on `filters.*`; it should depend only on a project/refresh signal (mount, plus the same save trigger used for the table).
- Keep `referenceTargets` fresh on save: in `handleSavedRecord` (`RecordBrowser.tsx:195`), upsert the saved summary into `referenceTargets` the same way it is upserted into `records` (`:197-209`), so a newly created/renamed reference target is immediately selectable.

### 2. Repoint both editor invocations

In `packages/web/src/records/RecordBrowser.tsx`:
- Change `referenceRecords={records}` to `referenceRecords={referenceTargets}` for the generic `RecordEditor` invocation (`:252`) and the `CastMemberEditor` invocation (`:270`).
- Leave the browse table (`filteredRecords`/`groupedRecords`) on the filtered list — unchanged.

## Files to Touch

- `packages/web/src/records/RecordBrowser.tsx` (modify)
- `packages/web/src/records/RecordBrowser.test.tsx` (modify/new — reference-universe-vs-filter coverage)

## Out of Scope

- Surfacing stored references whose target is archived or deleted (those remain filtered out by `eligibleReferenceTargets`) — that is REFTARGET-002.
- Any change to `eligibleReferenceTargets`, the editor descriptors, or the picker components in `RecordEditor.tsx`.
- Any change to server-side `listRecords` filtering, schema, validation, or the compiler.
- The `sentinel_reference` / AFFORD-001 classification (correct as shipped).

## Acceptance Criteria

### Tests That Must Pass

1. `@loom/web` RTL: render `RecordBrowser` with seeded ENTITY + LOCATION + OBJECT records, set the type filter to OBJECT, open an OBJECT editor — `owner` exposes the ENTITY records and `current_location` exposes the LOCATION records (alongside their sentinels).
2. `@loom/web` RTL: an OBJECT whose `carried_by` is an ENTITY UUID opens (under an active OBJECT filter) with that entity shown as the selected option, and saving without touching the field submits the same UUID (no silent drop).
3. `npm run typecheck && npm run lint && npm test` pass (full pipeline; lint includes the `@loom/core` import-boundary rule).

### Invariants

1. The editor's reference-target options never depend on the browse list filters (`type`/`status`/`q`/`refRole`/`targetId`).
2. The browse table continues to reflect the active filters exactly as before (no records injected or removed by this change).

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — assert the editor reference universe is filter-independent and that a stored entity reference round-trips under an active filter.

### Commands

1. `npm test --workspace @loom/web` (targeted browser/editor suite; requires `npm run build --workspace @loom/core` first because `@loom/web` resolves `@loom/core` through `packages/core/dist`).
2. `npm run typecheck && npm run lint && npm test` (full pipeline).
