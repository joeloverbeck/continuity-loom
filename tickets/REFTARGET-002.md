# REFTARGET-002: Preserve a stored reference value the picker cannot resolve to an eligible target

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` `RecordEditor` reference picker components only. No schema, storage, validation, or compiler change.
**Deps**: REFTARGET-001 (the common filter-starvation cause is fixed there; this ticket hardens the residual edge).

## Problem

A single-value reference picker renders only the values it can enumerate: the eligible (non-archived, type-matching) records plus, for sentinel fields, the schema sentinels. If a record's **stored** reference value is none of those — most realistically a reference to a now-**archived** or **deleted** target — the `<select>` has no matching `<option>`, so it renders blank. The author sees an empty field, and if they save (or the control coerces), a previously valid stored reference can be silently dropped.

REFTARGET-001 removes the common trigger (browse-filter starvation) by giving the editor the full record universe. This ticket closes the remaining gap: even with the full universe, `eligibleReferenceTargets` intentionally excludes archived targets (`packages/core/src/records/editor-descriptors.ts:185`, `!record.archived`), and a target deleted out from under the record will also be absent. In both cases the stored value must remain visible and preserved, not masked.

## Assumption Reassessment (2026-06-08)

1. The single-value reference pickers build their option set purely from enumerable sources and have no provision for an out-of-set stored value: `ReferencePicker` (`packages/web/src/records/RecordEditor.tsx:238-261`) renders `eligibleReferenceTargets(...)` plus a `""` "Select record" option; `SentinelReferencePicker` (`:263-291`) renders `field.enumValues` plus `eligibleReferenceTargets(...)`. Neither renders the currently-bound form value when it falls outside those sets. Confirmed.
2. Eligible targets exclude archived records by contract: `eligibleReferenceTargets` at `packages/core/src/records/editor-descriptors.ts:180-191` filters `!record.archived`. This is intended behavior for *new* selections and is **not** changed here — the fix is additive at the picker layer only.
3. Shared boundary under audit: the picker components in `RecordEditor.tsx` and the react-hook-form value bound at `path`. The pickers already receive `form` and `path` (`:238-247`, `:263-272`); the current value is readable via `form.watch(path)`. No prop-shape change to `FieldRenderer` is required.
4. FOUNDATIONS principle under audit: local-first authoring integrity / human gatekeeping (§4, §20) and the §29 "silently remove/alter user data" hard-fail family, applied to the editor authoring surface. Surfacing the stored value as an explicit option keeps the human the gate — an author who wants to change an archived/dangling reference must do so deliberately, not have it erased by opening the form.
8. Adjacent finding classified: archived-vs-deleted targets are the same residual class for this picker (both absent from eligible targets); both are covered by one guard. No separate ticket needed. List-typed reference fields (`SentinelReferenceListField`) are out of scope — see Out of Scope.

## Architecture Check

1. Rendering the current value as an explicit fallback option in the picker is cleaner than (a) widening `eligibleReferenceTargets` to include archived records (which would pollute *new* selections with archived targets) or (b) blocking the form (which punishes the author for upstream archival). The guard is local to the two single-value pickers, value-driven, and self-clearing once the author picks a resolvable value.
2. No backwards-compatibility shim: the fallback option only appears when the bound value is non-empty and absent from the enumerated options; it introduces no parallel data path and no schema change.

## Verification Layers

1. An OBJECT whose `owner` references an **archived** ENTITY opens with that value shown (clearly marked unresolved/archived) and selected, and saving without change preserves the stored value -> `@loom/web` RTL test on `RecordEditor`/`SentinelReferencePicker`.
2. A pure-reference field (`ReferencePicker`, e.g. ENTITY STATUS `entity_id`) whose stored target is absent from eligible targets likewise shows and preserves the value -> `@loom/web` RTL test.
3. When the stored value *is* an eligible target or a valid sentinel, no duplicate/fallback option is rendered (the guard is inert) -> `@loom/web` RTL non-regression assertion.

## What to Change

### 1. Add an out-of-set value guard to the single-value pickers

In `packages/web/src/records/RecordEditor.tsx`, for both `ReferencePicker` (`:238`) and `SentinelReferencePicker` (`:263`):
- Read the current bound value via `form.watch(path)`.
- Compute whether that value is non-empty and matches neither an `eligibleReferenceTargets` record id nor (for the sentinel picker) a `field.enumValues` entry.
- When unmatched, render one additional `<option>` for that value at the top of the list so the select displays and submits it. Label it to make the unresolved state legible (e.g. the resolved display label if the record is known-but-archived, otherwise the raw value annotated as unresolved/missing). Keep it a single select — no array handling.

### 2. Keep the guard inert in the resolvable case

- Do not emit the fallback option when the value is empty, an eligible target, or a valid sentinel, so the common path renders exactly as today.

## Files to Touch

- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- List-typed reference fields (`SentinelReferenceListField` and any array reference field) — single-value pickers only.
- Changing `eligibleReferenceTargets` archived-filtering (`editor-descriptors.ts:185`) — archived targets stay out of the eligible set for *new* selections.
- Any schema, validation, storage, or compiler change; any change to how archival itself is performed.
- Resurrecting deleted records or back-resolving display labels for ids no longer present in the store (show the raw value when the label is unavailable).

## Acceptance Criteria

### Tests That Must Pass

1. `@loom/web` RTL: an OBJECT with `owner` set to an archived ENTITY id opens with that value selected and marked unresolved/archived; submitting without change preserves the id.
2. `@loom/web` RTL: a `ReferencePicker` field whose stored id is absent from the eligible-target universe shows and preserves the id; and when the stored value is a normal eligible target, no extra fallback option is rendered.
3. `npm run typecheck && npm run lint && npm test` pass (full pipeline).

### Invariants

1. Opening a record never changes its stored reference values; a value the picker cannot resolve is displayed and preserved, never silently blanked.
2. The fallback option is rendered only for an unmatched non-empty value (no duplicate options for resolvable values or sentinels).

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordEditor.test.tsx` — assert archived/absent stored references render and round-trip in both single-value pickers, and that the guard is inert for resolvable values.

### Commands

1. `npm test --workspace @loom/web` (targeted; requires `npm run build --workspace @loom/core` first because `@loom/web` resolves `@loom/core` through `packages/core/dist`).
2. `npm run typecheck && npm run lint && npm test` (full pipeline).
