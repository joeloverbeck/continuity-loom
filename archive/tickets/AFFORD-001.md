# AFFORD-001: Expose `available_to` group/any_onstage sentinels in the record editor

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `sentinel_reference` field kind in `@loom/core` editor descriptors; new renderer branch in `@loom/web` `RecordEditor`. No schema, storage, or compiler change.
**Deps**: None

## Problem

A VISIBLE AFFORDANCE's `available_to` is schema-typed as `recordId | "group" | "any_onstage"` (`packages/core/src/records/space-material.ts:68`). The deterministic compiler already renders all three forms — entity ids resolve to display labels, and `group`/`any_onstage` render as literals — and `docs/compiler-contract.md:159,273` makes this an explicit contract.

But the editor only ever offers a single-entity `<select>`. `describeField` classifies `available_to` as a plain `reference` kind (`packages/core/src/records/editor-descriptors.ts:216`) and **silently discards the union's sentinel enum values**, so `ReferencePicker` (`packages/web/src/records/RecordEditor.tsx:248`) renders only entity records plus an empty "Select record" option. The two documented sentinels are unreachable from the UI.

User-visible consequence: an author cannot mark an affordance as available to `group` or `any_onstage`, and therefore experiences `available_to` as "one character only" — even though the documented mechanism for "multiple characters" (the `group`/`any_onstage` sentinels) exists in the schema and compiler. This ticket restores the documented authoring path **without** changing the schema (the single-entity-plus-sentinels shape is intentional per `docs/story-record-schema.md` §7.3).

## Assumption Reassessment (2026-06-08)

1. `available_to` schema is `z.union([recordId, z.enum(["group", "any_onstage"])])` at `packages/core/src/records/space-material.ts:68` — single value, not an array. Confirmed; this ticket does **not** change it.
2. `docs/compiler-contract.md:159` and `:273` require `group` and `any_onstage` to render as deterministic literals in `{visible_affordances}`, and `docs/story-record-schema.md:697` documents `available_to: entity_id | group | any_onstage`. The editor-only fix is therefore aligned with existing docs; no doc amendment is required.
3. Shared boundary under audit: the schema→editor-descriptor→web-renderer pipeline. `editor-descriptors.ts` derives `FieldDescriptor`s from the Zod schema; `RecordEditor.tsx` renders them. The defect is that the `reference` branch (`editor-descriptors.ts:216`) drops `enumValues` that the union carries.
4. Existing precedent: `sentinel_reference_list` already pairs a reference array with sentinels (`editor-descriptors.ts:366`, rendered by `SentinelReferenceListField` at `RecordEditor.tsx:320`), but it is list-typed and hard-gated to `non_holder_to_protect` only (`editor-descriptors.ts:367`). It is the wrong kind for a single-valued field; this ticket adds the **single-value** analogue rather than reusing or widening the list kind.
6. Output-schema impact: none. This is an authoring-surface (editor) change only. Stored `available_to` values, validation, and compiler output are unchanged in shape; the change only makes already-valid sentinel values reachable from the UI.
8. Adjacent contradiction (required consequence): the same `reference`-kind sentinel-dropping root cause also affects OBJECT's `owner`, `carried_by`, and `current_location` (each `recordId | "none" | "unknown"` — `space-material.ts:53-55`). A correctly general `sentinel_reference` kind will make those sentinels selectable too. This is the **correct** fix (per "fix the code, don't special-case"); it is treated as in-scope and must be covered by a non-regression check (see Acceptance Criteria), not gated to `available_to`.

## Architecture Check

1. A general `sentinel_reference` kind (single reference value OR a sentinel) is cleaner than enhancing `ReferencePicker` ad hoc, and avoids the per-field special-casing smell already present in the `non_holder_to_protect` gate. It is detected structurally — a reference-role field whose unwrapped schema is `union(uuid-reference, enum-sentinels)` — so it applies uniformly wherever that shape occurs.
2. No backwards-compatibility alias or duplicate path: the existing `reference` kind is retained for pure-reference fields (e.g. `entity_id`, `holder`); only fields whose union also carries sentinels reclassify to `sentinel_reference`. No schema shim, no parallel authority for `available_to`.

## Verification Layers

1. Descriptor invariant: `available_to` (and `owner`/`carried_by`/`current_location`) classify as `sentinel_reference` with `enumValues` populated -> `@loom/core` unit test against `getEditorDescriptor`.
2. Render invariant: the editor `<select>` for `available_to` contains `group` and `any_onstage` options plus entity options, and a chosen sentinel round-trips through the form value -> `@loom/web` RTL test on `RecordEditor`.
3. Non-regression invariant: existing pure-reference fields still render as before, and OBJECT sentinel fields gain (not lose) options without breaking existing save flows -> existing `RecordEditor.test.tsx` plus a new OBJECT assertion.

## What to Change

### 1. New `sentinel_reference` field kind (`@loom/core`)

In `packages/core/src/records/editor-descriptors.ts`:
- Add `"sentinel_reference"` to the `FieldKind` union.
- Add a detector (e.g. `isSentinelReferenceSchema`) that returns true when `roleForField(name)` has reference targets AND the unwrapped schema is a `union` containing both a uuid-reference option and ≥1 enum/literal sentinel option.
- In `describeField`, check this **before** the existing `reference` branch (`editor-descriptors.ts:216`); when matched, return `{ ...base, kind: "sentinel_reference", referenceRole: roleForField(name), enumValues: enumValuesForSchema(unwrapped) }`. The pure-`reference` branch then only matches reference unions with no sentinels.

### 2. New renderer branch (`@loom/web`)

In `packages/web/src/records/RecordEditor.tsx`:
- Add a `case "sentinel_reference"` to `FieldRenderer` (alongside `reference` at `:503`) rendering a single `<select>` whose options are the sentinel values (labeled human-readably) followed by the eligible entity records from `eligibleReferenceTargets`. A small `SentinelReferencePicker` component, or an extension of `ReferencePicker` that accepts `enumValues`, is acceptable; keep it a single select (no array).
- Ensure the default/empty handling sets a valid value: the field is required (no schema default), so the control must not allow persisting an empty string for `available_to`.

### 3. Field default

In the `fieldDefault` switch (`RecordEditor.tsx:74`), add a `sentinel_reference` arm returning `field.enumValues?.[0] ?? ""` (mirrors `sentinel_reference_list` at `:75`) so newly-added affordances start on a valid sentinel rather than an invalid blank.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/core/test/...` editor-descriptor coverage test (modify/new)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- Any change to `available_to`'s schema shape (no array / named-subset of multiple specific entities — that is a separate, spec-shaped design deliberately deferred).
- Any change to compiler output or `docs/compiler-contract.md` (the compiler already handles all three forms).
- Renaming or removing the `non_holder_to_protect`-gated `sentinel_reference_list` kind.

## Acceptance Criteria

### Tests That Must Pass

1. `@loom/core` editor-descriptor test: `getEditorDescriptor("VISIBLE AFFORDANCE")`'s `available_to` field has `kind: "sentinel_reference"` and `enumValues` containing `"group"` and `"any_onstage"`.
2. `@loom/web` RTL test: rendering the VISIBLE AFFORDANCE editor exposes selectable `group` and `any_onstage` options for `available_to`; selecting `group` and saving submits `available_to: "group"`.
3. Non-regression: OBJECT `owner`/`carried_by`/`current_location` now expose their `none`/`unknown` sentinels, and an OBJECT with an entity owner still saves; pure-reference fields (e.g. `entity_id`) render unchanged.
4. `npm run typecheck` and `npm run lint` pass (new `FieldKind` member is exhaustively handled in the `FieldRenderer` switch).

### Invariants

1. The schema for `available_to` is byte-for-byte unchanged; only its editor descriptor classification changes.
2. No field whose schema is a pure reference union (no sentinels) reclassifies away from `reference`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/...editor-descriptor...` — assert `sentinel_reference` classification + `enumValues` for affordance and OBJECT sentinel fields.
2. `packages/web/src/records/RecordEditor.test.tsx` — assert sentinel options render and round-trip for `available_to`; assert OBJECT non-regression.

### Commands

1. `npm test --workspace @loom/core` and `npm test --workspace @loom/web` (targeted package suites covering descriptor + renderer).
2. `npm run typecheck && npm run lint && npm test` (full pipeline; lint includes the core import-boundary rule).

## Outcome

Completed: 2026-06-08

What changed:
- Added the single-value `sentinel_reference` editor descriptor kind for reference-or-sentinel union fields.
- Rendered `sentinel_reference` fields as one select containing sentinel values followed by eligible record references.
- Made required `sentinel_reference` fields default to the first schema sentinel so new records do not start with an invalid blank value.
- Added descriptor and React editor regression coverage for VISIBLE AFFORDANCE `available_to` and OBJECT `owner`/`carried_by`/`current_location`.

Deviations from original plan:
- OBJECT `current_location` was verified against the live schema sentinels `carried_by_holder`, `unknown`, and `offstage`.
- `@loom/web` targeted tests required rebuilding `@loom/core` first because the workspace import resolves through `packages/core/dist`.

Verification results:
- `npm test --workspace @loom/core` passed: 38 files, 284 tests.
- `npm run build --workspace @loom/core` passed.
- `npm test --workspace @loom/web` passed: 24 files, 178 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 99 files, 669 tests.
