# EVENTSEQ-001: Fix the EVENT.sequence_order editor control and correct its prompt-facing classification

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — generalizes the `@loom/core` sentinel-scalar descriptor/renderer (introduced in OPENTHREAD-001) to the `number | string | sentinel` shape; reclassifies `EVENT.sequence_order` guidance as non-prompt-facing. No schema, validation, or compiler-ordering changes.
**Deps**: OPENTHREAD-001 (generalizes its `sentinel_prose` detector/renderer; should land after it)

## Problem

Two coupled defects on `EVENT.sequence_order` (`packages/core/src/records/causal-pressure.ts:24`, `z.union([z.number().finite(), nonemptyString, z.literal("unknown")])`; `docs/story-record-schema.md:738`: `sequence_order: number | prose | unknown`):

1. **Broken editor control (same root cause as OPENTHREAD-001).** `enumValuesForSchema` (`editor-descriptors.ts:355-372`) flat-maps the union arms: the `number` arm yields `[]`, the `nonemptyString` arm yields `[]`, the `z.literal("unknown")` arm yields `["unknown"]`, so `describeField` (`editor-descriptors.ts:279-282`) classifies the field `kind: "enum"` with `enumValues: ["unknown"]`. The editor renders a `<select>` whose only value is `unknown`, and because the field is required no "Unset" is offered. An author can never enter a numeric or prose ordering value.

2. **Mislabeled prompt-facing status; the field is dormant.** `sequence_order` is not in `operationalFields`, so its guidance reports `promptFacing: "conditional"` and the help popup tells authors it is sent to the prompt. This is false: a repo-wide grep finds the field referenced **only** by its schema declaration — no compiler section renders it, and event ordering runs off `metadata.userOrder` → compile-destination family → salience → urgency → label → id (`packages/core/src/compiler/ordering.ts:30-41`), never the payload `sequence_order`. The field is authoring metadata whose prompt-facing classification must be corrected to `never`, matching the OPENTHREAD-002 treatment of `answer_if_known`.

Per `docs/**`, the compiler omitting `sequence_order` does not violate `docs/compiler-contract.md` (which assigns the field no prompt role), and FOUNDATIONS §8 makes the deterministic record ordering — not a payload field — the ordering authority. **Wiring `sequence_order` into compiled output or into event ordering would be new behavior requiring a spec and is explicitly out of scope.** This ticket makes the field authorable and makes its (authoring-only) status honest.

## Assumption Reassessment (2026-06-09)

1. **Root cause and dormancy confirmed in code.** Schema at `causal-pressure.ts:24`; enum mis-classification at `editor-descriptors.ts:367-369` + `279-282`; required-field no-Unset at `EnumGuidance.tsx:71`. `grep -rn sequence_order packages/core/src` returns only the schema line — no compiler or ordering consumer. Ordering authority is `metadata.userOrder` (`ordering.ts:35`, declared `records/metadata.ts:14`).
2. **Doc intent confirmed.** `docs/story-record-schema.md:738` declares `number | prose | unknown` with no prompt role; `docs/compiler-contract.md` does not list `sequence_order` among compiled sections. Guidance currently falls through to the `recordEntry` default (`field-guidance-records.ts:196-217`) — no override, no `EVENT.sequence_order` entry in `specificGuidance`.
3. **Cross-artifact boundary under audit.** Same boundary as OPENTHREAD-001: the `FieldDescriptor` produced by `@loom/core` `describeField` and consumed by `@loom/web` `FieldRenderer`. This ticket broadens the OPENTHREAD-001 sentinel-scalar detector to also accept a `number` free arm, and the renderer to pick input vs textarea by field kind.
4. **FOUNDATIONS principle under audit.** §8 deterministic compilation: the ordering authority is the deterministic record ordering, not the `sequence_order` payload. Reclassifying the field `never` aligns the authoring surface with the compiler's actual (and contract-correct) behavior; it does not change deterministic compilation.
6. **Output-schema extension check.** No schema change. Only the derived `FieldDescriptor.kind` (`enum` → sentinel scalar) and the guidance `promptFacing` value change. `sequence_order` stays a required field accepting a number, prose, or the `unknown` sentinel.
8. **Adjacent contradiction classification.** The "ordering ignores `sequence_order`" observation is **not** a bug to fix here: the compiler-contract defines ordering via `metadata.userOrder` and friends, so changing it is a deliberate behavior change requiring a spec. Classified as out-of-scope future design, not a consequence of this ticket. This ticket treats `sequence_order` as authoring metadata, consistent with the contract.

## Architecture Check

1. Reuses and generalizes one canonical mechanism instead of adding a parallel one: OPENTHREAD-001 introduces sentinel-scalar handling for `string | sentinel`; this ticket widens it to `number | string | sentinel` and lets the renderer choose a text input vs textarea by `stringFieldKind`. The guidance fix reuses the per-path override + proven prompt-`never` phrasing already used for `answer_if_known`/`PLAN.can_drive_prose`.
2. No backwards-compatibility aliasing or shims; the broken `enum`/`["unknown"]` classification is replaced outright.

## Verification Layers

1. `sequence_order` classifies as the sentinel-scalar kind (not `enum`) with `enumValues: ["unknown"]` -> schema/codebase grep-proof in `editor-descriptors.test.ts`.
2. The editor lets the author enter a numeric or prose ordering value AND set the `unknown` sentinel -> skill dry-run via `RecordEditor.test.tsx` (render EVENT form, type a value, toggle the sentinel).
3. `sequence_order` guidance reports `promptFacing === "never"` and the popup shows "Not sent to the prose prompt." -> unit assertion in `field-guidance-records.test.ts` + FOUNDATIONS alignment check (§8).
4. No change to compiled output or event ordering -> codebase grep-proof that `compiler/` is untouched + existing compiler/ordering tests stay green.

## What to Change

### 1. `@loom/core` — generalize the sentinel-scalar detector (builds on OPENTHREAD-001)

- Broaden the OPENTHREAD-001 detector so a scalar union whose non-sentinel arms are a `string` and/or a finite `number` (no array/object/reference arms) plus at least one sentinel literal classifies as the sentinel-scalar kind. `EVENT.sequence_order` (`number | string | "unknown"`) must match; multi-arm reference/array unions must not.
- Keep the detector ordered before the generic enum branch in `describeField`.

### 2. `@loom/web` — render the control by field kind

- Generalize the OPENTHREAD-001 `SentinelProseField` (or the shared sentinel-scalar renderer) to select a `<textarea>` for prose fields and a single-line `<input type="text">` for short-string fields, via `stringFieldKind(name)`, plus the sentinel set/clear control. `sequence_order` (short_string by name) renders as a text input accepting a number or prose; `answer_if_known` (doc-typed `prose | none`) renders as a textarea — add `"answer"` to `PROSE_FIELD_HINTS` (`editor-descriptors.ts:41-70`) so it remains prose under the generalized renderer.

### 3. `@loom/core` — reclassify `EVENT.sequence_order` guidance

- Add a `specificGuidance` override (`field-guidance-records.ts`) setting `promptFacing: "never"`, `promptDestinations: []`, a `validationRole` mirroring the proven "it is not sent to the prose prompt" phrasing (doctrine-test safe), a `short` explaining it is an authoring note about where the event falls in sequence (a number, a prose note, or `unknown`), and that prompt event ordering is controlled separately. Do not add `sequence_order` to `operationalFields`.

### 4. (Optional, minor) doc alignment

- In `docs/story-record-schema.md` §8.1, note that `sequence_order` is authoring metadata and is not sent to the prose prompt nor used for compiled ordering.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify — generalize the sentinel-scalar detector; add `"answer"` to `PROSE_FIELD_HINTS`)
- `packages/web/src/records/RecordEditor.tsx` (modify — render control by field kind)
- `packages/core/src/records/field-guidance-records.ts` (modify — `EVENT.sequence_order` override)
- `packages/core/test/editor-descriptors.test.ts` (modify — classification assertions)
- `packages/web/src/records/RecordEditor.test.tsx` (modify — EVENT control render/interaction)
- `packages/core/test/field-guidance-records.test.ts` (modify — `never` classification assertion)
- `docs/story-record-schema.md` (modify — optional one-line §8.1 note)

## Out of Scope

- Wiring `sequence_order` into compiled output or into event ordering — that is new behavior governed by `docs/compiler-contract.md` and FOUNDATIONS §8 and needs a spec, not this ticket.
- Any schema or validation change. `sequence_order` stays required, accepting number, prose, or `unknown`.
- Other records' fields and GENERATION BRIEF fields.

## Acceptance Criteria

### Tests That Must Pass

1. `editor-descriptors.test.ts`: the EVENT descriptor's `sequence_order` field has the sentinel-scalar kind with `enumValues` equal to `["unknown"]`, not `kind === "enum"`.
2. `RecordEditor.test.tsx`: an EVENT editor renders a single-line text control for `sequence_order` that accepts a numeric or prose value and supports setting `unknown` via the sentinel control; the OPENTHREAD-001 `answer_if_known` field still renders as a textarea.
3. `field-guidance-records.test.ts`: `getFieldGuidance("EVENT.sequence_order").promptFacing === "never"` with empty `promptDestinations`.
4. `field-guidance-doctrine.test.ts`, `field-guidance-coverage.test.ts`, and the compiler/ordering tests stay green (no prompt-sent wording on the `never` entry; ordering output unchanged).
5. `npm run lint && npm run typecheck && npm test` all pass.

### Invariants

1. A scalar `number|string|sentinel` record-field union renders as an authorable text control with a sentinel affordance, never as a single-option enum.
2. Guidance prompt-facing classification matches actual compiler behavior; compiled output and event ordering are byte-for-byte unchanged.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — `sequence_order` sentinel-scalar classification.
2. `packages/web/src/records/RecordEditor.test.tsx` — EVENT `sequence_order` text control + sentinel; regression check that `answer_if_known` stays prose.
3. `packages/core/test/field-guidance-records.test.ts` — `EVENT.sequence_order` `never` classification.

### Commands

1. `npm test -- editor-descriptors RecordEditor field-guidance`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Generalized scalar sentinel descriptor handling so `EVENT.sequence_order` classifies as `sentinel_short_string` with `unknown`, not a single-option enum.
- Updated the record editor to render short sentinel scalars as a single-line text input while preserving `OPEN THREAD.answer_if_known` as a textarea sentinel field.
- Added explicit `EVENT.sequence_order` guidance marking it authoring-only metadata that is not sent to the prose prompt and does not control compiled event ordering.
- Added a schema note documenting that `sequence_order` is authoring metadata only.

Deviations from original plan:

- The implementation introduced a distinct `sentinel_short_string` field kind rather than overloading `sentinel_prose`, so the renderer can choose the control from the descriptor without reimplementing core field-name heuristics in the web package.

Verification results:

- `npm test -- editor-descriptors RecordEditor field-guidance` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
