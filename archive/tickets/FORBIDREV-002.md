# FORBIDREV-002: Editor affordance to set `forbidden_reveals: none`

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/records/editor-descriptors.ts` (field-descriptor derivation), `packages/web/src/records/RecordEditor.tsx` (field rendering); coverage in `packages/web/src/records/RecordEditor.test.tsx`
**Deps**: FORBIDREV-001 (the schema must accept `forbidden_reveals: "none"` first)

## Problem

FORBIDREV-001 makes `forbidden_reveals: "none"` a valid, gate-clearing value for an active secret, but there is no in-app way to *set* it. `forbidden_reveals` derives `kind: "list"` (`packages/core/src/records/editor-descriptors.ts:224-231`), so the editor only renders an append-prose-items list (`RecordEditor.tsx` `ListField`, `:288-313`); typing into it produces `["none"]` (an array), never the string sentinel `"none"`. Without this ticket the affirmative-none decision is only reachable by raw/programmatic editing.

The `non_holders_to_protect` field already solves the analogous "list of items **or** a sentinel literal" problem with the `sentinel_reference_list` kind (`editor-descriptors.ts:215-222`) rendered by `SentinelReferenceListField` (`RecordEditor.tsx:328-373`), which shows a mode `<select>` (sentinel options + `specific_entities`) and only renders the list when a list mode is chosen. This ticket gives `forbidden_reveals` the same affordance — except its items are **prose**, not entity references.

## Assumption Reassessment (2026-06-08)

1. `forbidden_reveals` currently maps to `kind: "list"` with a prose item descriptor via `describeField` (`packages/core/src/records/editor-descriptors.ts:224-231`). The sentinel path `isSentinelReferenceListSchema` (`:353`) is hardcoded to `roleForField(name) === "non_holder_to_protect"` and requires a `union` schema — so after FORBIDREV-001 widens `forbidden_reveals` to a union, it still will **not** match that reference-only sentinel path. A prose-item sentinel path must be added.
2. `SentinelReferenceListField` (`packages/web/src/records/RecordEditor.tsx:328-373`) builds its inner `listField.itemDescriptor` with `kind: "reference"` (`:338`). For `forbidden_reveals` the inner items are prose strings, so the sentinel-list renderer must support a **text** item descriptor, not a reference one. The mode `<select>` + `updateMode` (`:344-349`, setting `[]` for the list mode or the sentinel string otherwise) is reusable as-is.
3. Cross-artifact boundary under audit: `FieldDescriptor`/`FieldKind` is defined in `@loom/core` (`editor-descriptors.ts:10-21`) and consumed by `@loom/web` (`RecordEditor.tsx`). Adding a kind is an additive change to that shared contract; confirm all `switch (field.kind)` sites in `RecordEditor.tsx` (`:404-`, the field renderer) handle the new kind (no unhandled-case fallthrough).
4. FOUNDATIONS principle: this is a UI affordance over the secret reveal-boundary surface (§15). It changes no validation, no compilation, no stored semantics beyond letting the user author the value FORBIDREV-001 already made legal — so it neither weakens the secret firewall nor touches deterministic compilation.
5. Output-schema extension: `FieldDescriptor` gains one new `kind` value (e.g. `"sentinel_prose_list"`); additive-only, the sole consumer is `RecordEditor.tsx`.

## Architecture Check

1. Generalize the existing sentinel-list mechanism rather than special-casing `forbidden_reveals` in the UI: introduce a prose-item sentinel-list kind (or parameterize the existing `sentinel_reference_list` item descriptor to be prose vs reference). This reuses the proven `non_holders_to_protect` UX and keeps one mental model for "list or affirmative sentinel" fields.
2. No backwards-compat shim: `forbidden_reveals` simply changes which `kind` it derives. Existing array values continue to render in the list sub-editor; only a mode `<select>` is added above it.

## Verification Layers

1. `forbidden_reveals` derives the sentinel-prose-list kind with sentinel option `none` → `@loom/core` descriptor unit test asserting `describeField` output for the widened SECRET field.
2. Editor renders a mode control offering `none` and a prose-list mode; choosing `none` sets the field value to the string `"none"`; choosing the list mode sets `[]` and shows the prose list editor → `RecordEditor.test.tsx` component test.
3. Round-trip: a SECRET loaded with `forbidden_reveals: "none"` renders in `none` mode (not as a one-item list) → component test.

## What to Change

### 1. Add a prose-item sentinel-list descriptor (`packages/core/src/records/editor-descriptors.ts`)

Add a derivation path so `forbidden_reveals` (now `union([array(nonemptyString), literal("none")])`) maps to a new `kind` — e.g. `"sentinel_prose_list"` — carrying `enumValues: ["none"]` (from `enumValuesForSchema`) and a prose item descriptor. Add the kind to the `FieldKind` union (`:10`). Prefer a generalized predicate (union of `array` + string-literal enum, prose element) over hardcoding the field name, but scope the match so only this field (and any future prose-sentinel-list field) qualifies — do not change `non_holders_to_protect`'s existing `sentinel_reference_list` classification.

### 2. Render the new kind (`packages/web/src/records/RecordEditor.tsx`)

Either extend `SentinelReferenceListField` to build a **text** item descriptor when the kind is the prose variant, or add a sibling `SentinelProseListField` that reuses the mode `<select>` + `updateMode` logic with a prose `ListField`. Wire the new kind into the `FieldRenderer` `switch` (`:404-`). The list mode option label may stay generic (e.g. `specific_reveals`); the sentinel option is `none`.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/core/test/` — descriptor derivation test for the widened SECRET field (modify/add; locate the suite covering `editor-descriptors`)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- The schema/compiler/validation changes (those are FORBIDREV-001).
- A bespoke `suggestedAction` (e.g. an `add-knowledge-constraint`-style one-click) for the blocker — the mode `<select>` is the affordance; a dedicated suggested-action is a separate UX enhancement if later desired.
- Re-styling or reworking the `non_holders_to_protect` editor.

## Acceptance Criteria

### Tests That Must Pass

1. `describeField` for the widened `forbidden_reveals` SECRET field returns the prose-sentinel-list kind with `none` among its `enumValues` and a prose (text) item descriptor — and `non_holders_to_protect` still returns `sentinel_reference_list`.
2. In the editor, selecting the `none` mode sets the SECRET's `forbidden_reveals` to the string `"none"` (not `["none"]`); selecting the list mode sets `[]` and reveals the prose list editor.
3. A SECRET whose `forbidden_reveals` is `"none"` renders with the `none` mode selected on load.
4. `npm run lint && npm run typecheck && npm test` all green.

### Invariants

1. `FieldDescriptor`/`FieldKind` change is additive; every `field.kind` switch in `RecordEditor.tsx` handles the new kind with no unhandled fallthrough.
2. `non_holders_to_protect` rendering and classification are unchanged.
3. The editor can only set `forbidden_reveals` to a prose-string array or the exact literal `"none"` — never any other sentinel.

## Test Plan

### New/Modified Tests

1. `@loom/core` editor-descriptors test — assert the new kind/enumValues/item-descriptor for `forbidden_reveals` and the unchanged `non_holders_to_protect` classification.
2. `packages/web/src/records/RecordEditor.test.tsx` — assert mode-toggle behavior (sets `"none"` vs `[]`) and load-time mode selection for an existing `"none"` value.

### Commands

1. `npm test -- editor-descriptors RecordEditor`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-08

What changed:

- Added the additive `sentinel_prose_list` editor descriptor kind for prose-list-or-sentinel fields.
- Classified SECRET `forbidden_reveals` as a sentinel prose list with the `none` sentinel while keeping `non_holders_to_protect` on the existing `sentinel_reference_list` path.
- Added a RecordEditor control that switches `forbidden_reveals` between the exact string `"none"` and an editable prose list, preserving blank list mode by default.
- Added descriptor and editor regression tests for classification, selecting `none`, switching back to list mode, and loading an existing `"none"` value.

Deviations from original plan:

- None. The implementation used a sibling `SentinelProseListField` rather than changing the reference-specific sentinel renderer.

Verification results:

- `npm test -- editor-descriptors RecordEditor` — passed, 2 files / 24 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 99 files / 653 tests.
