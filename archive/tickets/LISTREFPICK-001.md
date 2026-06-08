# LISTREFPICK-001: List-item reference fields render as raw UUID text inputs instead of name pickers

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/records/editor-descriptors.ts` (`roleForField` ordering); regression coverage in `packages/core/test/editor-descriptors.test.ts` and `packages/web/src/records/RecordEditor.test.tsx`
**Deps**: None

## Problem

When editing a SECRET record, the **holders** section renders each holder as a free-text field that requires pasting a raw entity UUID (e.g. `019ea1b1-3957-705f-8332-d3a06305ccd3`), instead of the name `<select>` used elsewhere for entity references (e.g. PROSE-MODE `pov_character`, which shows `display_name`). Live repro: open project `red-bunny` → Records → SECRET *"Ane Arrieta has been a sex worker for years."* → Edit Record → the holders list renders `<input type="text" name="holders.0">`.

Root cause is **role resolution for list items**, not the holders field specifically. `roleForField` (`editor-descriptors.ts:346-364`) performs its name→role remaps (`holders`→`secret_holder`, `participants`→`participant`, `causes`/`effects`/`cause`→`record_link`) by comparing the **bare** field name with `===`. But array fields are described per-item via `describeListItem` (`editor-descriptors.ts:248-256`), which calls `describeField` with the name **suffixed** as `"holders[]"`. None of the `===` checks match the suffixed name, so the role falls through to `name.replace(/\[\]$/, "")` → `"holders"`, which is **not** a key in `referenceTargetsByRole` (the registered key is `secret_holder`, `editor-descriptors.ts:108`). `isReferenceSchema` therefore returns `false` (`editor-descriptors.ts:326-329`), the item is classified `short_string`, and `RecordEditor.tsx` renders a text input (`RecordEditor.tsx:378-379`) instead of the `ReferencePicker` `<select>` (`RecordEditor.tsx:376-377`, `226-249`).

This silently breaks **every** list-item reference field that needs a name→role remap:
- `holders` (SECRET, `knowledge.ts:68`) → should resolve `secret_holder`
- `participants` (EVENT, `causal-pressure.ts:26`) → should resolve `participant`
- `causes` / `effects` (`record_link`)

Single, non-array reference fields whose name already equals a registered role key (`pov_character`, `location`) work, which masked the defect.

## Assumption Reassessment (2026-06-08)

1. `roleForField` (`packages/core/src/records/editor-descriptors.ts:346-364`) runs its `name === "holders"` / `"participants"` / `"causes"` checks **before** stripping the `[]` suffix; `describeListItem` (`:248-256`) passes the item name as `` `${name}[]` `` (`:249`). Confirmed by direct simulation: `roleForField("holders[]")` returns `"holders"` (unregistered), `roleForField("participants[]")` returns `"participants"` (unregistered), `roleForField("location[]")` returns `"location"` (registered → works). The render path is correct: `kind: "reference"` → `ReferencePicker` `<select>` of `displayLabel` options (`packages/web/src/records/RecordEditor.tsx:226-249, 376-377`).
2. `referenceTargetsByRole` (`editor-descriptors.ts:91-110`) registers `secret_holder`, `participant`, `record_link`, `holder`, `pov_character`, `location` — but not `holders`, `participants`, or `causes`. SECRET holders schema is `z.array(recordId).default([])` (`packages/core/src/records/knowledge.ts:68`); `recordId = z.uuid()` (`packages/core/src/records/common.ts:7`), so the item schema satisfies `isReferenceSchema`'s `string`+`uuid` check once the role resolves.
3. Shared boundary under audit: the descriptor contract between `@loom/core` (`editor-descriptors.ts` field-kind classification) and `@loom/web` (`RecordEditor.tsx` `FieldRenderer` switch). The fix changes only role-string resolution inside core; no schema or render-layer change.
4. `non_holders_to_protect` is **out of scope** here — it is a `union(array[entity_id], enum)` (`knowledge.ts:69`) routed to the enum branch, a distinct defect tracked in `NONHOLDPICK-001`. This ticket fixes only plain `array[recordId]` reference fields.

## Architecture Check

1. Fix the **root cause** (role resolution for list items) rather than special-casing `holders` in the render layer: a one-place reorder in `roleForField` repairs holders, participants, and causes/effects simultaneously and keeps all entity-reference resolution in one function. A holders-only patch would leave participants/causes broken and duplicate role logic.
2. No backwards-compatibility shim. The `[]`-stripping already exists as the fallback `return name.replace(/\[\]$/, "")`; the change only moves it ahead of the remap comparisons. The redundant `if (name === "location")` remap (it returns the same value the fallback would) may be deleted as part of the cleanup but is not required.

## Verification Layers

1. Descriptor classifies `holders` item as a reference → unit assertion in `packages/core/test/editor-descriptors.test.ts` (SECRET descriptor: `holders.itemDescriptor.kind === "reference"`, `referenceRole === "secret_holder"`).
2. Sibling fields repaired → unit assertion that EVENT `participants` item resolves `kind: "reference"`, `referenceRole: "participant"`.
3. UI renders a name `<select>` (not a text input) for holders, storing the entity id → RTL assertion in `packages/web/src/records/RecordEditor.test.tsx` (mirror the existing "lists only eligible reference targets and stores selected ids" test at `:184`, for `recordType="SECRET"`).
4. No regression for already-working pickers → existing `pov_character` / `location` reference-picker tests still pass.

## What to Change

### 1. `roleForField` — strip the list-item suffix before remapping

In `packages/core/src/records/editor-descriptors.ts`, compute the bare name first, then run the remaps against it:

```ts
function roleForField(name: string): string {
  const bare = name.replace(/\[\]$/, "");

  if (bare === "holders") {
    return "secret_holder";
  }

  if (bare === "participants") {
    return "participant";
  }

  if (bare === "causes" || bare === "effects" || bare === "cause") {
    return "record_link";
  }

  return bare;
}
```

(The former `if (name === "location") return "location";` branch becomes redundant — `bare` already returns `"location"` — and should be removed.)

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify — add reference-classification assertions for holders + participants)
- `packages/web/src/records/RecordEditor.test.tsx` (modify — add SECRET holders picker render/store test)

## Out of Scope

- `non_holders_to_protect` entity selection (union type) — `NONHOLDPICK-001`.
- The active-secret blocker not naming the missing field — `SECRETDIAG-001`.
- Any change to stored data shape, schema, or prompt compilation: holders remain `array[recordId]`; only the editor widget changes.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/core/test/editor-descriptors.test.ts` — SECRET `holders` item descriptor is `kind: "reference"`, `referenceRole: "secret_holder"`; EVENT `participants` item is `kind: "reference"`, `referenceRole: "participant"`.
2. `packages/web/src/records/RecordEditor.test.tsx` — editing a SECRET renders the holders entry as a `<select>` listing eligible ENTITY `displayLabel`s and stores the selected `id` (no `<input type="text">` for `holders.*`).
3. `npm run lint && npm run typecheck && npm test` all green.

### Invariants

1. Every `array[recordId]` field whose bare name maps to a registered reference role renders via `ReferencePicker`, never a free-text input.
2. Stored holder values remain entity UUIDs; the change is presentation-only (no schema/compiler change).

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — assert list-item reference roles resolve for holders and participants (locks the root cause).
2. `packages/web/src/records/RecordEditor.test.tsx` — assert the SECRET holders widget is a name picker, not a UUID text field (locks the user-visible symptom).

### Commands

1. `npm test -- editor-descriptors RecordEditor`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completion date: 2026-06-08

What changed:
- `roleForField` now strips list-item `[]` suffixes before applying reference-role remaps, so list items such as `holders[]`, `participants[]`, `causes[]`, and `effects[]` resolve to registered reference roles.
- Core descriptor regression coverage now asserts SECRET `holders` and EVENT `participants` list items are reference fields.
- The RecordEditor regression suite now verifies SECRET holders render as an ENTITY picker, exclude non-eligible targets, and submit the selected entity id.

Deviations from original plan:
- None.

Verification results:
- `npm test -- editor-descriptors RecordEditor` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
