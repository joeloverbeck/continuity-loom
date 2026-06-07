# CASTLABEL-003: Associate working-set band/local_function controls with their cast member

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/working-set/WorkingSetView.tsx` (accessible names on the cast-band selects); test update in `packages/web/src/working-set/WorkingSetView.test.tsx`. No schema, compiler, validation, or stored-data change.
**Deps**: CASTLABEL-001 (so `record.displayLabel` carries a real cast name to reference). CASTLABEL-002 recommended (so existing projects already show real names).

## Problem

In the working-set CAST MEMBER table, the `band` and `local_function` selects are wrapped in `<label>` elements whose visible text is the bare field name `band` / `local_function` (`packages/web/src/working-set/WorkingSetView.tsx:221-222,234-235`). The controls sit in the same row as the cast member's `displayLabel` (`:217`), so once CASTLABEL-001/002 give each row a real name they are visually associated — but each `<select>`'s **accessible name** is still just "band" / "local_function", with no reference to the cast member. A screen-reader user tabbing through the table hears "band" repeatedly with no indication of which character it controls.

This ticket gives each control an accessible name that includes the cast member, closing the literal "doesn't say to what cast member each applies" gap at the accessibility layer. It is the lowest-value of the three CASTLABEL tickets because the visible row label (after CASTLABEL-001/002) already disambiguates sighted users.

## Assumption Reassessment (2026-06-07)

1. The controls are already row-scoped to the correct record: `WorkingSetView.tsx:215` keys the row by `record.id`, and both `onChange` handlers pass `record.id` (`:225`, `:241`). The defect is purely the human/AT-facing accessible name, not the data binding.
2. Each `<select>` currently derives its accessible name from the wrapping `<label>` text ("band" / "local_function"). The table column header is already "Cast band" (`:210`). Adding an `aria-label` to each `<select>` overrides the wrapping-label name, so this is the correct surface to inject the cast member name without restructuring the `<label>` markup.
3. Test coupling confirmed: `packages/web/src/working-set/WorkingSetView.test.tsx` queries these controls via `getByLabelText(/^band/)` and `findByLabelText(/^local_function/)` (the "persists explicit cast bands and local_function …" test). Changing the accessible name **will** break those queries, so this ticket must update them in lockstep — this is a required consequence of the change, not a separate bug.
4. No FOUNDATIONS enforcement surface is touched: this is presentation/accessibility only. It supports §27 (UI clarity; "no hidden … controls") and §29.3's "able to inspect what will be compiled" without altering compilation, validation, or stored data.
5. `record.displayLabel` is the right token to embed: after CASTLABEL-001 it is the identity-derived label; it is already rendered in the row's first cell (`:217`), so the accessible name will match the visible name.

## Architecture Check

1. Adding an `aria-label` referencing `record.displayLabel` on each select is the minimal, idiomatic fix: it reuses the value already shown in the row, keeps the existing `<label>` micro-caption as a visible hint, and introduces no new component, state, or prop. Restructuring into `<th scope>` / `aria-labelledby` associations would be heavier and unnecessary for two row-local controls.
2. No backwards-compatibility shim or alias: the accessible name changes outright; no dual labelling path is retained.

## Verification Layers

1. Each cast-band `<select>` exposes an accessible name containing the cast member's `displayLabel` → component test querying by the new accessible name (e.g. `getByLabelText(/cast band for <name>/i)`).
2. Both `onChange` handlers still persist against the correct `record.id` after the relabel → existing "persists explicit cast bands and local_function …" assertions retained (query updated, expectations unchanged).
3. No compiler/validation/storage behavior changes → grep-proof that the diff is confined to `WorkingSetView.tsx` (+ its test).

## What to Change

### 1. Accessible names on the cast-band selects

In `packages/web/src/working-set/WorkingSetView.tsx`, add to the band `<select>` an `aria-label={\`Cast band for ${record.displayLabel}\`}` and to the local_function `<select>` an `aria-label={\`Local function for ${record.displayLabel}\`}`. Keep the existing visible micro-captions.

### 2. Update the coupled test queries

In `packages/web/src/working-set/WorkingSetView.test.tsx`, update the `getByLabelText(/^band/)` / `findByLabelText(/^local_function/)` queries to match the new accessible names (e.g. `/cast band for/i`, `/local function for/i`). The persisted-payload expectations are unchanged.

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (modify)

## Out of Scope

- The label-derivation fix and the stale-data backfill (CASTLABEL-001/002).
- Any change to `band` / `local_function` data binding, compilation, or validation.
- Broader working-set table accessibility beyond the two cast-band controls.

## Acceptance Criteria

### Tests That Must Pass

1. Updated `WorkingSetView.test.tsx` selects the controls by an accessible name containing the cast member and still asserts the same persisted `active_onstage_cast_full` payloads.
2. `npm run typecheck`, `npm run lint`, and `npm test` pass.

### Invariants

1. Every cast-band/local_function control has an accessible name that names its cast member.
2. The diff changes presentation only — no compiler, validation, or stored-data behavior is affected.

## Test Plan

### New/Modified Tests

1. `packages/web/src/working-set/WorkingSetView.test.tsx` — re-query by cast-member-scoped accessible name; rationale: locks the association and prevents regression of the bare-label accessible name.

### Commands

1. `npm test -- WorkingSetView`
2. `npm run typecheck && npm run lint && npm test`

## Outcome

Completion date: 2026-06-07

Added cast-member-scoped accessible names to the working-set CAST MEMBER band and local_function selects using the row's `record.displayLabel`. Updated the coupled WorkingSetView regression test to query the controls by the new accessible names while preserving the existing persisted generation-brief payload assertions.

Deviations from original plan: none.

Verification results:

- `npm test -- WorkingSetView` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
