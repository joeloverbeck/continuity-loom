# RECIDGEN-003: Web form stops asking for `id` — use the id-free resolver and lock reference pickers to display labels

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/web`: `packages/web/src/records/RecordEditor.tsx` (resolver schema source), and a reference-picker regression test.
**Deps**: RECIDGEN-001 (provides `getEditorFormSchema` and the id-free descriptor). End-to-end create requires RECIDGEN-002 (server-generated id).

## Problem

The record editor validates with `zodResolver` against the full payload schema (`RecordEditor.tsx:411-412`), which requires `id: z.uuid()` — that is the **client-side** source of the "Invalid UUID" error. Once RECIDGEN-001 removes `id` from the rendered descriptor, the form will no longer render an id field, but the resolver would still reject submission because `prunePayload` drops `id` while the schema still demands it. This ticket points the resolver at the id-free form schema so the client stops demanding an id, and locks the user's reference-picker concern with a regression test: **pickers display `displayLabel`, never raw UUIDs.**

## Assumption Reassessment (2026-06-07)

1. `RecordEditor.tsx:406-418`: `descriptor = getEditorDescriptor(recordType)`; `schema = payloadSchema ?? definition?.payloadSchema`; `resolver = zodResolver(z.preprocess((values) => prunePayload(values, descriptor.fields), schema))`. `prunePayload` (`:128-136`) keeps only `descriptor.fields`. After RECIDGEN-001 the descriptor has no `id`, so `prunePayload` strips `id`; with the full schema still requiring `id`, the resolver fails. Confirmed by reading the resolver wiring.
2. RECIDGEN-001 exports `getEditorFormSchema(recordType)` (id omitted). This ticket consumes it as the resolver's schema source. `recordTypeRegistry` / `getEditorDescriptor` remain the descriptor source.
3. Cross-artifact boundary under audit: the `@loom/web` editor's **resolver schema** must agree with the **rendered descriptor fields** (both must exclude the own `id`) and with the **server contract** (server injects the id, RECIDGEN-002). Reference fields stay rendered: `ReferencePicker` (`RecordEditor.tsx:226-249`) emits `<option value={record.id}>{record.displayLabel}</option>` — the UUID is the hidden `value`, the visible text is `displayLabel`. CAST MEMBER reuses this picker (`CastMemberEditor.tsx:161`). Switching own ids from typed-UUID to server-generated-UUID does **not** change picker display.
4. FOUNDATIONS under audit: §27 / §29.11 (faster atomic record creation) and §29.11 (clearer working-set/record selection). The picker-shows-label behavior already satisfies "the user never reads raw ids"; this ticket prevents regression.
6. Schema-extension classification: no stored schema change. The web layer swaps its **client validation** schema to the id-omitted variant; the create/update requests simply no longer carry `id` in `payload` (the server supplies it). Additive/behavioral only.
8. Adjacent: `deriveDisplayLabel` (`editor-descriptors.ts:143-153`) already derives the create/update `displayLabel` from label fields (e.g. ENTITY → `display_name`), so pickers remain meaningful without any `id`. Classified as an existing guarantee to assert, not new work.

## Architecture Check

1. Sourcing the resolver from `getEditorFormSchema` keeps the client's validation contract identical to what the form actually renders (descriptor and schema both id-free) and consistent with the server (which owns the id). This is cleaner than locally stripping `id` inside `RecordEditor` (which would duplicate the system-managed-field policy already centralized in core by RECIDGEN-001).
2. No backwards-compatibility shims: the editor uses the id-free schema directly; no dual id/no-id code path is introduced.

## Verification Layers

1. Submitting Create ENTITY with no id field present passes client validation and issues a `createRecord` whose payload omits `id` -> web component test (`RecordEditor.test.tsx`).
2. No record editor renders an `id` input -> web component test asserting absence of an `id`-labelled field for representative types (ENTITY, FACT, PLAN).
3. Reference picker shows `displayLabel`, not the UUID, and submits the UUID as the option value -> web component test (`RecordEditor.test.tsx` and/or `CastMemberEditor.test.tsx`).
4. FOUNDATIONS §27 alignment — record creation requires no hand-authored key -> manual review against the reproduction (Create ENTITY now needs no UUID).

## What to Change

### 1. Point the resolver at the id-free form schema

In `RecordEditor.tsx` (`:406-413`), source the validation schema from `getEditorFormSchema(recordType)` (with the existing `payloadSchema` prop still taking precedence for callers that pass one). The descriptor continues to come from `getEditorDescriptor`. Result: the form renders no `id` field (RECIDGEN-001) and the resolver no longer requires one. `createRecord` / `updateRecord` calls (`:439-441`) are unchanged in shape; their `payload` simply no longer contains `id`.

### 2. Confirm the CAST MEMBER editor path

`CastMemberEditor.tsx` reuses `FieldRenderer` and passes `referenceRecords` (`:161`); its `entity_id` field stays a reference picker. Verify it inherits the id-free behavior (it has no own `id` field, so no resolver change is needed beyond what its schema already implies) and that its entity picker shows `displayLabel`.

### 3. Reference-picker regression test

Add/strengthen a test asserting that `ReferencePicker` renders option **text** = `displayLabel` and option **value** = `record.id` (UUID), so a future change cannot regress pickers into showing raw UUIDs.

## Files to Touch

- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)
- `packages/web/src/records/CastMemberEditor.test.tsx` (modify)

## Out of Scope

- Core descriptor / form-schema helper (RECIDGEN-001).
- Server id generation/injection (RECIDGEN-002).
- Any change to reference-target eligibility or picker sorting (`eligibleReferenceTargets`).

## Acceptance Criteria

### Tests That Must Pass

1. `RecordEditor.test.tsx`: Create ENTITY renders **no** `id` input; submitting valid non-id fields calls `createRecord` with a payload that omits `id` and succeeds at the client-validation layer.
2. Picker regression: a reference field renders an option whose visible text is the target's `displayLabel` and whose value is the target's `id`.
3. `npm run typecheck && npm run lint && npm test`

### Invariants

1. The web editor never renders an input for the record's own `id`.
2. Reference pickers always display `displayLabel`; raw UUIDs never appear as picker text.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordEditor.test.tsx` — assert no `id` field, successful id-free submission, and picker label/value mapping.
2. `packages/web/src/records/CastMemberEditor.test.tsx` — assert the entity picker shows `displayLabel` for `entity_id`.

### Commands

1. `npm test -w @loom/web`
2. `npm run typecheck && npm run lint && npm test`

### End-to-end (with RECIDGEN-001 + RECIDGEN-002 landed)

3. Manual: `npm run dev`, open `/records` → Create ENTITY → fill `display_name`/`entity_kind`/`roles_in_story`/`short_description` (no id field present) → record is created; reopen and confirm a server-generated UUID id and that a CAST MEMBER entity picker lists the entity by name.

## Outcome

Completed on 2026-06-07.

The web record editor now validates with `getEditorFormSchema(recordType)` by default, so rendered descriptor fields and client validation agree that the record's own `id` is not user-authored. Create and update payloads omit the own `id`; the server supplies or preserves it. Regression tests assert no own-id input for representative creates, id-free create/update submission, and reference pickers displaying `displayLabel` while keeping UUIDs as option values. CAST MEMBER keeps its `entity_id` picker label/value behavior.

Deviation from original plan: this seam was implemented before server archival because RECIDGEN-001's descriptor change made the full suite fail until the web resolver consumed the id-free schema. RECIDGEN-002 was then implemented before archival so the real browser create flow was end-to-end valid.

Verification: `npm test -w @loom/web`, `npm test -w @loom/server`, `npm run typecheck`, `npm run lint`, and `npm test` all passed. Manual browser smoke on `http://127.0.0.1:5173/records` created ENTITY "Ane Arrieta" with no `id` field shown; the detail panel displayed generated id `019ea1a5-deda-799f-8321-f5b4ccf388f5` and matching `payload.id`.
