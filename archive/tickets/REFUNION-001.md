# REFUNION-001: Render EVENT causes/effects as a record-link list, not a text box

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` record-editor descriptor logic (`packages/core/src/records/editor-descriptors.ts`); no schema, API, or compiler change.
**Deps**: None. (Edits the same file as REFUNION-002 — coordinate merges; no logical dependency.)

## Problem

Creating an EVENT record in the web app fails on submit with `causes` → "Invalid input: expected array, received string" and `effects` → same. Both fields render as single-line text boxes, so the form submits a `string`, but the API schema requires an array.

Root cause is in the editor descriptor layer, not the schema (the schema is correct). `causes`/`effects` use `recordLinkList = z.union([z.array(recordId), z.array(nonemptyString)]).default([])` (`packages/core/src/records/causal-pressure.ts:15,31-32`). `describeField` (`packages/core/src/records/editor-descriptors.ts:209-280`) has **no branch for a union of arrays**: it is not a sentinel reference list (that helper is hard-gated to the `non_holder_to_protect` role, line 377), not a reference/sentinel-reference (the union arms are arrays, not uuid-strings), not a sentinel prose list (early-out because `record_link` has a `referenceTargetsByRole` entry, line 403), and `schemaType` is `"union"`, not `"array"` (so the array branch at line 248 is skipped). With no enum sentinels to match, it falls through to line 279 → `kind: stringFieldKind("causes")` = `"short_string"` (`editor-descriptors.ts:451-453`) → `<input type="text">` (`packages/web/src/records/RecordEditor.tsx:608-609`) → submits a string.

Per `docs/story-record-schema.md:745-746`, `causes/effects: list[record_id] | prose list` — `record_id` is the primary form. The role `record_link` resolves to **every** registered record type (`referenceTargetsByRole.record_link = Object.keys(recordTypeRegistry)`, `editor-descriptors.ts:110`), and UUID items are extracted as `record_link` graph edges (`causal-pressure.ts:159`). The correct widget is a list of record pickers spanning all record types.

## Assumption Reassessment (2026-06-08)

1. **Defect is in `describeField`, not the schema or API.** Confirmed by reading `editor-descriptors.ts:209-280` and tracing `recordLinkList` to the `short_string` fall-through (line 279). The schema `eventSchema.causes/effects` (`causal-pressure.ts:31-32`) and the API zod validation are correct and unchanged.
2. **Doc intent confirmed.** `docs/story-record-schema.md:745-746` lists `list[record_id]` first; `docs/FOUNDATIONS.md` §18 (line 584) requires causal motion "through records, not global plot form." Record-linking is the doc-primary form; loose prose earns nothing the system reads.
3. **Shared boundary under audit:** `FieldDescriptor` / `FieldKind` (`editor-descriptors.ts:5-27`) consumed by `RecordEditor.tsx`. The fix emits `kind: "list"` with a `reference` `itemDescriptor`, which already has a complete render path: `ListField` (`RecordEditor.tsx:334-386`) → `ReferencePicker` (`RecordEditor.tsx:270-297`), exactly as `SentinelReferenceListField` builds its inner reference item (`RecordEditor.tsx:406-416`). No new `FieldKind` is introduced.
4. **FOUNDATIONS principles motivating this ticket:** §70 (`docs/FOUNDATIONS.md:70` — deterministic validation must not block *ordinary authoring*; today an Event cannot be authored at all) and §448 (field economy — record links earn their place via referential validation). The fix makes the editor emit schema-valid payloads; it strengthens, never weakens, the validation gate.
5. **Deterministic-compilation surface check (§8/§252):** `causes`/`effects` are **not** read by any compiler section — grep of `packages/core/src/compiler/` finds no `payload.causes`/`payload.effects` and no `record_link` usage; EVENT renders via `description` + `pov_visibility`/`current_relevance` only (`packages/core/src/compiler/sections/records-tail.ts:58-78`). This ticket changes no prompt output and requires **no** `docs/compiler-contract.md` change. The secret firewall (§15) is untouched.
6. **Schema-consumer check:** No schema change. `extractReferences` (`causal-pressure.ts:157-162`) already treats `causes`/`effects` as `record_link` references; emitting UUID arrays from the editor produces exactly the values it expects. `refsFromStrings` (`references.ts:12-18`) keeps only UUID items, so any prose left by import is stored but unlinked — unchanged behavior.
7. N/A — no skill/rule/field rename or removal.
8. **Adjacent contradiction uncovered:** `known_by` (EVENT, FACT) and `owed_to` (OBLIGATION) share a related descriptor-detection miss (array-bearing union with sentinels → renders as a bare enum, losing entity selection). Classified as a **separate bug** → REFUNION-002. `CONSEQUENCE.holder_or_target` is a distinct 3-arm shape, deliberately out of scope for both tickets.

## Architecture Check

1. Adding a precise `isRecordLinkListSchema` detector + a `kind: "list"` branch reuses the existing `ListField`/`ReferencePicker` rendering, `prunePayload` list handling (`RecordEditor.tsx:101-108`), and `fieldDefault` list default `[]` (`RecordEditor.tsx:59-60`). No new widget, no new `FieldKind`, no API/schema/compiler change. Cleaner than special-casing field names or loosening the existing sentinel detectors (which would mis-classify sibling fields).
2. No backwards-compatibility aliases or shims. The previous `short_string` classification was a latent defect, not a contract; it is replaced outright.

## Verification Layers

1. **Descriptor invariant** (EVENT `causes`/`effects` classify as `list` of `reference`/`record_link`) → schema validation + codebase grep-proof via `packages/core/test/editor-descriptors.test.ts`.
2. **Authoring invariant** (creating an EVENT with one or more causes/effects submits an array and passes API validation) → manual review + component test in `packages/web/src/records/RecordEditor.test.tsx`.
3. **Non-regression of prompt output** (no compiler section reads `causes`/`effects`) → codebase grep-proof (`grep -rn "causes\|effects" packages/core/src/compiler` returns only unrelated `possible_effects`/template prose) + FOUNDATIONS §252 alignment check.

## What to Change

### 1. Detect the record-link-list union in `describeField`

In `packages/core/src/records/editor-descriptors.ts`, add a detector:

```ts
function isRecordLinkListSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)] || schemaType(schema) !== "union") {
    return false;
  }
  const options = unionOptions(schema);
  const hasReferenceArray = options.some(
    (option) => schemaType(option) === "array" && isReferenceSchema(arrayElement(option), name)
  );
  const hasSentinels = enumValuesForSchema(schema).length > 0;
  return hasReferenceArray && !hasSentinels;
}
```

Add a branch in `describeField` (after the sentinel-list/sentinel-reference checks, before the `schemaType(unwrapped) === "array"` branch at line 248) that returns a list whose item is a `record_link` reference picker, mirroring `SentinelReferenceListField`'s inner item:

```ts
if (isRecordLinkListSchema(unwrapped, name)) {
  return {
    ...base,
    kind: "list",
    itemDescriptor: { ...base, name, kind: "reference", required: true, referenceRole: roleForField(name) }
  };
}
```

The `!hasSentinels` clause ensures this never collides with `known_by`/`owed_to`/`non_holders_to_protect` (all carry enum sentinels) — those remain REFUNION-002 / existing-behavior.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- Rendering `causes`/`effects` in the generated prompt (they are continuity-graph/validation metadata only; surfacing them in prose would be a compiler change requiring a `docs/compiler-contract.md` amendment per FOUNDATIONS §252 — a separate spec).
- Free-text ("prose list") entry alongside record pickers — the chosen widget is record-pickers-only; prose items are never linked or rendered, so no UI affordance is added.
- `known_by`, `owed_to` (REFUNION-002) and `CONSEQUENCE.holder_or_target`.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/core` — `editor-descriptors.test.ts` asserts the EVENT `causes` and `effects` descriptors have `kind === "list"`, `itemDescriptor.kind === "reference"`, and `itemDescriptor.referenceRole === "record_link"`.
2. `npm test -w @loom/web` — `RecordEditor.test.tsx` renders an EVENT editor, adds two `causes` via the picker, submits, and asserts the submitted payload `causes` is an array of strings (no "expected array, received string" issue); confirms no `<input type="text">` is rendered for `causes`/`effects`.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. No field whose schema is a union carrying enum sentinels is matched by `isRecordLinkListSchema` (guards `known_by`/`owed_to`/`non_holders_to_protect`).
2. The editor never emits a non-array value for an array-typed record field; `causes`/`effects` payloads validate against `z.array(recordId)`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — EVENT `causes`/`effects` classify as a `record_link` reference list; a sentinel-bearing sibling (e.g. EVENT `known_by`) is *not* matched by the new detector (negative guard).
2. `packages/web/src/records/RecordEditor.test.tsx` — add-cause-and-submit produces an array payload; text input absent for these fields.

### Commands

1. `npm test -w @loom/core -- editor-descriptors` and `npm test -w @loom/web -- RecordEditor`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-08

Changed `packages/core/src/records/editor-descriptors.ts` to classify sentinel-free reference-array unions such as EVENT `causes` and `effects` as `list` descriptors whose items are `record_link` reference pickers. Added core descriptor coverage for both fields and a web RecordEditor round-trip proving EVENT causes submit as an array from picker selections, with no textboxes rendered for `causes` or `effects`.

Deviations: none.

Verification:

- `npm test -w @loom/core -- editor-descriptors` passed.
- `npm run build -w @loom/core` passed before the web package-local test so `@loom/web` consumed fresh core dist output.
- `npm test -w @loom/web -- RecordEditor` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 676 tests.
