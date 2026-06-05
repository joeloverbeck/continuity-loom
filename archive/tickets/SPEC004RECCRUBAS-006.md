# SPEC004RECCRUBAS-006: Web dense record browser

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/web` record browser surface
**Deps**: SPEC004RECCRUBAS-005, SPEC004RECCRUBAS-001

## Problem

The user needs to see and navigate all records densely and create new ones. Per `UI-WORKFLOWS.md`, atomic records use a dense split list/detail (table preferred over cards) so many small state claims can be compared quickly. This ticket builds the record browser on the shell (-005) and the core editor descriptors / registry (-001): a TanStack-Table-backed dense list with type/status/search/reference filtering, salience/urgency grouping where schema-defined, and create-from-template actions per record type. The working-set filter/column/quick-toggle is deliberately deferred to SPEC004RECCRUBAS-010 (it requires the working-set read route from -004); this ticket stays focused on the records read/filter/create surface.

## Assumption Reassessment (2026-06-05)

1. Foundations exist: the shell + router + typed `api.ts` record list/get wrappers from SPEC004RECCRUBAS-005; `recordTypes`, `getEditorDescriptor`, and `deriveDisplayLabel` from SPEC004RECCRUBAS-001 (`packages/core/src/records/editor-descriptors.ts`); `@tanstack/react-table` added to `packages/web/package.json` by -005. The list route returns the common metadata projection (id/type/displayLabel/status/salience/urgency/archived/userOrder/timestamps) per `record-routes` (-003).
2. Spec `specs/SPEC-004-...md` (Approach → record browser; UI-WORKFLOWS.md "Record browser") requires type filter, status filter, text search, entity/location/object reference filters, salience/urgency grouping where schema-defined, create-from-template actions, dense table over cards. (Active-working-set filter + quick select/deselect are routed to -010 per this decomposition.)
3. Shared boundary under audit: the browser consumes the **descriptor contract** (-001) to enumerate types and drive filter options, and the **list route contract** (-003 via -005's client). The router/shell mount file is shared with sibling web tickets (mechanical merge).
4. FOUNDATIONS §27 (dense where records are dense; make record state legible — active/inactive/resolved/archived) and §13 (atomic records) motivate the dense table and the status/type/salience legibility; the browser surfaces record state without LLM ranking — all sort/filter is deterministic.

## Architecture Check

1. A single TanStack-Table browser driven by the registry/descriptors covers all 21 types uniformly (filters/columns derive from descriptors), versus per-type bespoke lists. Deterministic filtering/sorting keeps the surface continuity-honest (no model judgment about "what matters").
2. No backwards-compatibility shim: net-new surface mounted on the shell; create-from-template reuses the editor engine entry point (SPEC004RECCRUBAS-007) without duplicating form logic — until -007 lands, create actions may route to a placeholder, but this ticket does not hand-author per-type forms.

## Verification Layers

1. Browser lists records and filters by type/status/search/reference deterministically -> web component test with a fixture record set + mocked list route.
2. Salience/urgency grouping appears only for types whose schema defines it -> component test keyed off descriptors.
3. Create-from-template offers an action per record type -> component test enumerating `recordTypes`.

## What to Change

### 1. Record browser surface

Add a browser component (e.g. `packages/web/src/records/RecordBrowser.tsx`) using TanStack Table: dense list/detail, columns from the metadata projection, filters for type / status / free-text `q` / reference (entity/location/object), salience/urgency grouping where the descriptor marks those projections present, and a detail pane showing the selected record. Wire it to the shell's Records route.

### 2. Create-from-template actions

Per-type "create" entry points (enumerated from `recordTypes`) that open the editor for a new record of that type. The form rendering itself is owned by SPEC004RECCRUBAS-007; this ticket provides the entry points and routing.

## Files to Touch

- `packages/web/src/records/RecordBrowser.tsx` (new)
- `packages/web/src/shell/` (modify) — register the Records route (shared with sibling web tickets; mechanical merge)
- `packages/web/src/records/RecordBrowser.test.tsx` (new)

## Out of Scope

- Editor forms / reference pickers — SPEC004RECCRUBAS-007.
- CAST MEMBER and global-config editors — SPEC004RECCRUBAS-008/-009.
- **Active-working-set filter, working-set column, and quick select/deselect** — SPEC004RECCRUBAS-010 (requires the working-set read route from -004).
- Continuity validation badges — Phase 6 (UI-WORKFLOWS lists them, but they need the validation engine).

## Acceptance Criteria

### Tests That Must Pass

1. The browser renders a dense list of fixture records and filters correctly by type, status, free-text search, and reference (entity/location/object).
2. Salience/urgency grouping is offered only for record types whose descriptors expose those projections.
3. A create-from-template action exists for every type in `recordTypes`.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. All filtering, grouping, and sorting is deterministic — no model/LLM ranking of records (FOUNDATIONS §4.4/§27).
2. The browser presents record state (type/status/archived) legibly and never silently hides selected/active records.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — list render, type/status/search/reference filters, salience/urgency grouping presence, create-from-template coverage.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/records/RecordBrowser.test.tsx`
2. `npm test && npm run typecheck && npm run lint && npm run build`
