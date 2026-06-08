# NONHOLDPICK-001: non_holders_to_protect cannot select specific entities (sentinel-only select)

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `packages/core/src/records/editor-descriptors.ts` (union-with-reference-array classification) and `packages/web/src/records/RecordEditor.tsx` (union widget); coverage in `packages/core/test/editor-descriptors.test.ts` and `packages/web/src/records/RecordEditor.test.tsx`
**Deps**: None (independent of `archive/tickets/LISTREFPICK-001.md`, but shares the entity-reference-picker infrastructure)

## Problem

In the SECRET editor, **`non_holders_to_protect`** renders as a two-option `<select>` offering only `all_except_holders` and `none`. The user cannot enumerate **specific** protected entities, even though the documented shape supports it:

> `docs/story-record-schema.md:616` — `non_holders_to_protect: list[entity_id] | all_except_holders | none`

Schema (`packages/core/src/records/knowledge.ts:69`):

```ts
non_holders_to_protect: z.union([z.array(recordId), z.enum(["all_except_holders", "none"])]),
```

Two compounding causes:
1. **Union routing.** `describeField` (`packages/core/src/records/editor-descriptors.ts:202-246`) sees a `union`, fails `isReferenceSchema` (the top-level node is a union, not a `string`+`uuid`), and falls through to `enumValuesForSchema`, which flattens the union and yields only the enum branch's `["all_except_holders", "none"]` → `kind: "enum"`. The `array[entity_id]` branch is discarded.
2. **Role key mismatch.** Even if the array branch were reached, `roleForField("non_holders_to_protect")` returns `"non_holders_to_protect"`, which is **not** registered; the registered key is the singular `non_holder_to_protect` (`editor-descriptors.ts:101`).

Live-confirmed: project `red-bunny`, SECRET *"Ane Arrieta…"* shows `non_holders_to_protect` as a sentinel-only select with stored value `"all_except_holders"`.

## Assumption Reassessment (2026-06-08)

1. `describeField` routes `non_holders_to_protect` to the enum branch (`packages/core/src/records/editor-descriptors.ts:231-234` via `enumValuesForSchema` union-flattening at `:319-321`); the `array[recordId]` option is never surfaced as a list/reference. Confirmed by live DOM (2-option select) and by reading the function.
2. `referenceTargetsByRole` registers `non_holder_to_protect` (singular, `editor-descriptors.ts:101`) but `roleForField` would compute `non_holders_to_protect` (plural) for this field — mismatch must be resolved (add a remap `non_holders_to_protect`→`non_holder_to_protect`, consistent with the `holders`→`secret_holder` style, and note `archive/tickets/LISTREFPICK-001.md` reorders `roleForField` to strip `[]` first).
3. Shared boundary under audit: the descriptor→render contract for **union** fields. There is currently **no** descriptor `FieldKind` for "either a sentinel enum or a reference list". This ticket introduces handling for that discriminated shape; confirm no other union field relies on the current enum-flattening behavior before changing it — grep `z.union` across `packages/core/src/records/*.ts` and classify each (e.g. `causal-pressure.ts:15` `recordLinkList` is a `union(array[recordId], array[nonemptyString])`, a different shape).
4. Schema-extension classification: this is **additive, presentation-only** — the stored value remains `array[recordId] | "all_except_holders" | "none"`; compiler consumption (`docs/compiler-contract.md:129`) is unchanged. No story-record schema field is added, renamed, or removed.
5. Adjacent contradiction: `archive/tickets/LISTREFPICK-001.md` fixes plain `array[recordId]` reference list items; this ticket handles the union variant. Keep them separate — different root cause (union routing vs `[]`-suffix role resolution).

## Architecture Check

1. Model the field as a **mode toggle** (`all_except_holders` / `none` / `specific entities`) that, in the "specific entities" mode, reveals an entity multi-picker reusing the existing `ReferencePicker` + `eligibleReferenceTargets` infrastructure (`RecordEditor.tsx:226-249`, role `non_holder_to_protect`). This preserves the common sentinel path while unlocking the documented `list[entity_id]` path, and reuses the proven holder-style picker rather than inventing a new control.
2. No backwards-compat shim: stored values keep their existing union shape; the editor simply gains a third authoring mode. The descriptor change is additive (a new union-aware classification), not a rewrite of enum handling.

## Verification Layers

1. Descriptor surfaces the reference-array branch → unit assertion in `packages/core/test/editor-descriptors.test.ts` that SECRET `non_holders_to_protect` is classified as a union/reference-capable field (not a bare 2-value enum).
2. UI offers specific-entity selection and round-trips an `array[recordId]` value → RTL assertion in `packages/web/src/records/RecordEditor.test.tsx`.
3. Sentinel values still selectable and stored verbatim → RTL assertion that choosing `all_except_holders` stores the string, not an array.
4. Compiler/validation unaffected → existing active-secret validation and compiler tests (`validation-blockers.test.ts`, `compiler-front-sections.test.ts`) still pass for both sentinel and entity-list values.

## What to Change

### 1. Descriptor: recognize the sentinel-or-reference-array union

In `packages/core/src/records/editor-descriptors.ts`, detect a `union` whose options are `array[recordId]` + `enum`, and emit a descriptor that carries both the enum sentinels and the reference role (`non_holder_to_protect`) so the editor can render a mode toggle. Resolve the plural/singular role via a `roleForField` remap.

### 2. Editor: union (sentinel + entity-list) widget

In `packages/web/src/records/RecordEditor.tsx`, add a `FieldRenderer` branch for the new descriptor that renders a mode selector and, in entity mode, a list of `ReferencePicker`s (reusing `ListField`/`ReferencePicker`).

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- The holders picker (`archive/tickets/LISTREFPICK-001.md`) and the active-secret diagnostic message (`SECRETDIAG-001`).
- Generalizing the union widget to all union fields — scope strictly to the sentinel-or-reference-array shape used by `non_holders_to_protect`. Other unions (e.g. `recordLinkList`) keep current behavior.
- Any change to stored data shape, validation predicates, or prompt compilation.

## Acceptance Criteria

### Tests That Must Pass

1. Editing a SECRET allows choosing "specific entities" and storing `non_holders_to_protect` as an `array[recordId]` of entity ids selected by name.
2. The sentinel options `all_except_holders` and `none` remain selectable and store as the literal strings.
3. `npm run lint && npm run typecheck && npm test` all green; existing active-secret validation and compiler tests pass unchanged for both value shapes.

### Invariants

1. Stored `non_holders_to_protect` is always one of: `array[recordId]`, `"all_except_holders"`, `"none"` — the editor never produces an out-of-union value.
2. The compiler and validation continue to consume the union exactly as before; this change is editor-presentation-only.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — assert the union classification exposes both sentinels and the `non_holder_to_protect` reference role.
2. `packages/web/src/records/RecordEditor.test.tsx` — assert mode toggle + entity-list round-trip and sentinel round-trip for `non_holders_to_protect`.

### Commands

1. `npm test -- editor-descriptors RecordEditor`
2. `npm run lint && npm run typecheck && npm test`
