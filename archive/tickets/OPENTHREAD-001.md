# OPENTHREAD-001: Fix the answer_if_known editor control (scalar prose-or-sentinel field renders as a "none"-only selectbox)

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds a `sentinel_prose` `FieldKind` and detector to `@loom/core` editor descriptors; adds a renderer branch to `@loom/web` `RecordEditor`. No schema, validation, or compiler changes.
**Deps**: None (independent of OPENTHREAD-002; may land in any order)

## Problem

When editing an OPEN THREAD record, the `answer_if_known` field renders as a dropdown whose only selectable value is `none`. An author can never enter an actual answer through the UI, even though the field is meant to hold either free prose or the literal `none` (`docs/story-record-schema.md` §8.7: `answer_if_known: prose | none`).

Root cause is in the editor descriptor, not the schema. The schema is `answer_if_known: z.union([nonemptyString, z.literal("none")])` (`packages/core/src/records/causal-pressure.ts:139`). In `describeField` (`packages/core/src/records/editor-descriptors.ts:209-294`), the generic enum branch (lines 279-282) calls `enumValuesForSchema` (lines 355-372), which treats any `union` as an enum and flat-maps its arms: the `nonemptyString` arm yields `[]`, the `z.literal("none")` arm yields `["none"]`, so the field is classified `kind: "enum"` with `enumValues: ["none"]`. `RecordEditor` then renders a `<select>` (`packages/web/src/records/RecordEditor.tsx:533-542`) and, because the field is required, `EnumGuidance` shows no "Unset" option either (`packages/web/src/field-help/EnumGuidance.tsx:71`). Result: a required field permanently pinned to `none`.

The correct shape is a **scalar prose-or-sentinel** field — the scalar analogue of the existing `sentinel_prose_list` kind (e.g. `SECRET.forbidden_reveals`), which has no scalar counterpart in the descriptor or renderer yet.

## Assumption Reassessment (2026-06-09)

1. **Schema and root cause confirmed in code.** `answer_if_known: z.union([nonemptyString, z.literal("none")])` at `packages/core/src/records/causal-pressure.ts:139`. `enumValuesForSchema` union handling at `editor-descriptors.ts:367-369` produces `["none"]`; `describeField` enum branch at `editor-descriptors.ts:279-282` then sets `kind: "enum"`. Renderer `<select>` at `RecordEditor.tsx:533-542`; required-field "Unset" suppression at `EnumGuidance.tsx:71`.
2. **Doc intent confirmed.** `docs/story-record-schema.md:837` types the field `prose | none`, so the editor must accept free prose (a textarea), not an enumerated choice. The `none` value is a sentinel meaning "answer not yet known", consistent with the `forbidden_reveals` sentinel pattern (`editor-descriptors.ts:437-448`, `field-guidance-records.ts:115-121`).
3. **Cross-artifact boundary under audit.** The shared contract is the `FieldDescriptor` produced by `@loom/core` `describeField` and consumed by `@loom/web` `FieldRenderer` (`RecordEditor.tsx:512-622`). The change adds one `FieldKind` and one render branch; both sides move together. The brief editor is **not** on this path — GENERATION BRIEF is not in `recordTypeRegistry` and `GenerationBriefView.tsx` does not call `describeSchemaFields`/`FieldRenderer`, so brief fields with the same `string | "none"` shape are rendered by their own form and are unaffected.
4. **FOUNDATIONS principle under audit.** §18 Causal pressure records (`docs/FOUNDATIONS.md:607`): OPEN THREAD records "color the current local unit without forcing resolution." Letting an author record the known answer (kept out of the prompt — see OPENTHREAD-002) supports human gatekeeping (§20) without pressuring closure. This ticket is editor-rendering only and does not change what the compiler sends.
6. **Output-schema extension check.** No schema change. The record schema, validation, and compiler are untouched; only the derived `FieldDescriptor.kind` for this field changes (`enum` → `sentinel_prose`). Additive `FieldKind`; existing kinds unchanged.
8. **Adjacent contradiction uncovered — classified as a separate bug (own ticket).** `EVENT.sequence_order: z.union([z.number().finite(), nonemptyString, z.literal("unknown")])` (`causal-pressure.ts:24`) hits the same root cause and currently renders as a single-option `unknown` dropdown. It is out of this ticket's OPEN THREAD scope and is a genuinely larger shape (a `number | string | sentinel` union, not `string | sentinel`). The detector below is deliberately narrow so it does **not** match `sequence_order` (the `number` arm excludes it), leaving its current behavior unchanged. A follow-up ticket should extend the same mechanism to the `number|string|sentinel` case.

## Architecture Check

1. Mirrors the established sentinel pattern rather than inventing a new one: `sentinel_prose` is the scalar sibling of `sentinel_prose_list` (`editor-descriptors.ts:437-458`, `RecordEditor.tsx:597-607`). Fixing the descriptor at the source (one detector, ordered before the generic enum branch) keeps a single canonical classification path instead of special-casing one field name in the UI.
2. No backwards-compatibility aliasing or shims. The old `enum`/`["none"]` classification is replaced outright; nothing depends on the broken behavior.

## Verification Layers

1. Descriptor classifies `answer_if_known` as `sentinel_prose` (not `enum`) with `enumValues: ["none"]` -> schema validation / codebase grep-proof in `editor-descriptors.test.ts`.
2. Editor lets the author type free prose AND set the `none` sentinel for `answer_if_known` -> skill dry-run via `RecordEditor.test.tsx` (render OPEN THREAD form, type an answer, toggle the sentinel).
3. `EVENT.sequence_order` remains `enum` (no regression / no accidental scope creep) -> codebase grep-proof in `editor-descriptors.test.ts`.
4. The detector touches no compiler or validation surface -> FOUNDATIONS alignment check (§8 deterministic compilation, §18) plus grep-proof that `compiler/` and validation sources are unchanged.

## What to Change

### 1. `@loom/core` — add the `sentinel_prose` field kind and its detector

- Add `"sentinel_prose"` to the `FieldKind` union (`editor-descriptors.ts:5-16`).
- Add `isSentinelProseSchema(schema, name)`: returns true only when `schema` is a `union`, the field has no reference role (`referenceTargetsByRole[roleForField(name)]` is undefined), the union has **exactly one** non-sentinel arm and that arm is a plain `string` (`schemaType === "string"`, not an array/object/number/reference), and at least one arm is a literal sentinel (`enumValuesForSchema(arm).length > 0`). The `number` arm of `sequence_order` must make it fail this check. Model it on `isSentinelProseListSchema` (`editor-descriptors.ts:437-448`) but for a scalar string instead of an array.
- In `describeField`, check `isSentinelProseSchema` **before** the generic enum branch (insert near the other sentinel checks, before line 279) and return `{ ...base, kind: "sentinel_prose", enumValues: enumValuesForSchema(unwrapped) }` (the sentinel literal(s)).

### 2. `@loom/web` — render `sentinel_prose`

- Add `case "sentinel_prose":` to `FieldRenderer`'s switch (`RecordEditor.tsx:529-611`) that renders a new `SentinelProseField` component.
- `SentinelProseField`: a `<textarea>` for free prose plus a control to set/clear the sentinel value (when the sentinel is active the stored value is `"none"` and the textarea is empty/disabled; clearing it lets the author type). Model the sentinel toggle on `SentinelProseListField` (`RecordEditor.tsx:597-607`). Render as prose (textarea), consistent with the `prose | none` doc typing; no change to `PROSE_FIELD_HINTS` is required.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify — `FieldKind`, `isSentinelProseSchema`, `describeField` ordering)
- `packages/web/src/records/RecordEditor.tsx` (modify — `FieldRenderer` case + `SentinelProseField` component)
- `packages/core/test/editor-descriptors.test.ts` (modify — classification + sequence_order non-regression assertions)
- `packages/web/src/records/RecordEditor.test.tsx` (modify — render/interaction assertions)

## Out of Scope

- `EVENT.sequence_order` (`number | string | sentinel`) — discovered separate bug; its own follow-up ticket.
- GENERATION BRIEF fields with the same `string | "none"` shape — rendered by `GenerationBriefView`, not this path; not broken.
- `answer_if_known` guidance text and prompt-facing reclassification — OPENTHREAD-002.
- Any schema, validation, or compiler change. `answer_if_known` stays required with the `none` sentinel.

## Acceptance Criteria

### Tests That Must Pass

1. `editor-descriptors.test.ts`: `describeSchemaFields(openThreadSchema)` (or the OPEN THREAD descriptor) yields an `answer_if_known` field with `kind === "sentinel_prose"` and `enumValues` equal to `["none"]` — and **not** `"enum"`.
2. `editor-descriptors.test.ts`: `EVENT.sequence_order` still has `kind === "enum"` (non-regression for the out-of-scope sibling).
3. `RecordEditor.test.tsx`: rendering an OPEN THREAD editor shows a free-text (textarea) control for `answer_if_known`; the author can enter arbitrary prose and persist it, and can set the value back to `none` via the sentinel control.
4. `npm run lint && npm run typecheck && npm test` all pass.

### Invariants

1. Exactly one canonical classification path: a scalar `string | sentinel-literal` record-field union renders as `sentinel_prose`, never as a single-option enum.
2. No compiler/validation behavior changes; `answer_if_known` remains a required field whose value is free prose or the literal `none`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — assert `answer_if_known` → `sentinel_prose` with `["none"]`; assert `sequence_order` unchanged.
2. `packages/web/src/records/RecordEditor.test.tsx` — assert the OPEN THREAD form renders a textarea for `answer_if_known`, accepts typed prose, and supports the `none` sentinel.

### Commands

1. `npm test -- editor-descriptors RecordEditor`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-09

What changed:
- Added the scalar `sentinel_prose` editor descriptor kind for `string | literal-sentinel` record fields with no reference role.
- Rendered `sentinel_prose` fields in the web record editor as a prose textarea plus sentinel mode selector.
- Added descriptor coverage proving `OPEN THREAD.answer_if_known` is `sentinel_prose` with `["none"]`, while `EVENT.sequence_order` remains the out-of-scope single-option enum.
- Added record-editor coverage proving `answer_if_known` accepts arbitrary prose and can be returned to `none`.

Deviations from original plan:
- None. No schema, validation, or compiler behavior changed.

Verification:
- `npm test -- editor-descriptors RecordEditor` passed.
