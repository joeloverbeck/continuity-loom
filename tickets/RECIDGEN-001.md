# RECIDGEN-001: Treat record `id` as system-managed — drop it from the editor descriptor and expose an id-free form schema

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core`: `packages/core/src/records/editor-descriptors.ts` (new `SYSTEM_MANAGED_FIELDS`, descriptor field filter, new `getEditorFormSchema` helper) and its export in `packages/core/src/index.ts`.
**Deps**: None.

## Problem

Every record-creation form renders the record's own `id` as a **required free-text input** that validates as `z.uuid()`, forcing the user to hand-author a UUID. Reproduced live at `/records` → **Create ENTITY**: typing `ent-ane-arrieta` in `id *` fails with **"Invalid UUID"**. The field's own help tooltip describes it as *"Validation only… Not sent to the prose prompt… Operational metadata for filtering or UI state."* — i.e. a system key the user should never type.

Root cause in core: `editor-descriptors.ts` lists **every** schema field as a form field. The `STATUS_OR_VALIDATION_FIELDS` set that contains `"id"` only flips `promptFacing: false` (`:189`); it does **not** exclude `id` from the rendered field list (`describeObjectFields`, `:176-182`). This ticket makes core stop describing the record's own `id` as a rendered field and exposes an id-free schema for client-side form validation. Server-side id authority (RECIDGEN-002) and the web resolver swap (RECIDGEN-003) are the paired follow-ups.

## Assumption Reassessment (2026-06-07)

1. `editor-descriptors.ts:69-83` `STATUS_OR_VALIDATION_FIELDS` includes `"id"`, but it is consumed only at `:189` to set `promptFacing: !STATUS_OR_VALIDATION_FIELDS.has(name)`. It does **not** filter `describeObjectFields` output (`:176-182`), so `id` is emitted as a `short_string` descriptor field and rendered by the web editor (`packages/web/src/records/RecordEditor.tsx:465-475`). Confirmed by live reproduction.
2. Record schemas declare the own primary key as `id: recordId` (`recordId = z.uuid()`, `packages/core/src/records/common.ts:7`) in 16 types: ENTITY (`entity.ts:9`); FACT/BELIEF/SECRET (`knowledge.ts:13,26,64`); LOCATION/OBJECT/VISIBLE AFFORDANCE (`space-material.ts:35,49,65`); EVENT/INTENTION/PLAN/CLOCK/OBLIGATION/CONSEQUENCE/OPEN THREAD (`causal-pressure.ts:21,39,50,74,102,116,130`); RELATIONSHIP/EMOTION (`relationship-emotion.ts:11,47`). `docs/story-record-schema.md` documents `id: id` as the record key, not authored content. ENTITY STATUS (`entity.ts:45`) and CAST MEMBER (`cast-member.ts:81`) have **no own `id`** — they key on `entity_id` (a reference), so they have nothing to exclude.
3. Cross-artifact boundary under audit: the editor **descriptor** contract (`FieldDescriptor[]`, consumed by `@loom/web` `RecordEditor`) and a **new derived form-schema** contract (also consumed by `RecordEditor`'s resolver). The record's own `id` is the only system-managed primary key. References (`entity_id`, `location`, `current_location`, `holder`, …; `editor-descriptors.ts:85-104`) are **user-chosen** and MUST remain rendered as pickers (`RecordEditor.tsx:240-247`). `SYSTEM_MANAGED_FIELDS` must contain **only** `"id"`, never any reference role.
4. FOUNDATIONS principle under audit: §27 / §29.11 ("make atomic record creation faster"). §4.4 / §8 determinism is **not** weakened — `id` is non-prompt-facing, so removing it from the form cannot change compiled prompt output.
6. Schema-extension classification: this ticket does **not** alter any stored payload schema — `id` stays `recordId` (required `z.uuid()`) in storage. It adds (a) a top-level descriptor filter and (b) a derived, id-omitted **form** schema. Both are additive/derived; consumers of the storage schemas are unaffected.
8. Adjacent contradictions: server-side id injection (RECIDGEN-002) and the web resolver swap (RECIDGEN-003) are **required consequences** of this change and are split into their own layered tickets; without them the form would render no id field but the client resolver / server would still demand one.

## Architecture Check

1. One `SYSTEM_MANAGED_FIELDS = {"id"}` defined in core, with the **storage** schema left strict (`id` required) and a **form** schema derived by omitting `id`, keeps a single source of truth while preserving the strong stored-data invariant. This is cleaner than (a) making `id` optional across 16 schema files (which weakens the storage invariant and is high-churn) or (b) prefilling a UUID into a visible/readonly field (which leaks an opaque key into the UI and moves id authority into the web layer).
2. No backwards-compatibility aliases or shims: the id field is removed from the form descriptor path outright; the derived form schema is the single new surface.

## Verification Layers

1. `id` absent from every record descriptor's rendered fields -> codebase grep-proof (`SYSTEM_MANAGED_FIELDS` filter) + unit test asserting `getEditorDescriptor("ENTITY").fields` contains no `id`.
2. Form schema omits the own `id` -> schema validation: `getEditorFormSchema("ENTITY")` accepts a valid ENTITY payload that has **no** `id`.
3. References still rendered -> FieldDescriptor unit assertion: CAST MEMBER `entity_id` and ENTITY STATUS `entity_id` remain `kind: "reference"` in their descriptors.
4. Determinism untouched -> FOUNDATIONS §4.4 alignment check: the derived form schema is used only for client form validation, never by the compiler; `id` remains non-prompt-facing.

## What to Change

### 1. Exclude the record's own `id` from rendered descriptor fields

In `editor-descriptors.ts`, add `const SYSTEM_MANAGED_FIELDS = new Set(["id"]);`. In the `recordEditorDescriptors` construction (`:127-137`), filter the **top-level** field list:
`fields: describeObjectFields(definition.payloadSchema).filter((field) => !SYSTEM_MANAGED_FIELDS.has(field.name))`.
Apply the filter **only at the record top level** — do not change `describeObjectFields` itself (it recurses for nested groups; no nested `id` exists today, and references must never be filtered). Leave `STATUS_OR_VALIDATION_FIELDS` and `promptFacing` semantics unchanged so `status`, `salience`, etc. keep rendering as non-prompt-facing fields.

### 2. Add an id-free form schema helper

Add `export function getEditorFormSchema(recordType: string): z.ZodType | undefined`. Return the registry payload schema with system-managed fields omitted when present: for a `ZodObject` whose shape contains `id`, return `schema.omit({ id: true })` (top-level only); otherwise return the schema unchanged (ENTITY STATUS / CAST MEMBER keep their full schema). This is the schema the web resolver will use (RECIDGEN-003).

### 3. Export the helper

Export `getEditorFormSchema` from `packages/core/src/index.ts` alongside `getEditorDescriptor`.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)

## Out of Scope

- Server-side id generation/injection (RECIDGEN-002).
- Web form resolver swap and reference-picker regression (RECIDGEN-003).
- Any change to stored payload schemas (`id` stays `z.uuid()` required in storage).
- Human-readable / slug ids (explicitly rejected during triage; pickers already display `displayLabel`, so opaque ids are not user-visible).

## Acceptance Criteria

### Tests That Must Pass

1. New/updated `packages/core/test/editor-descriptors.test.ts`: `getEditorDescriptor(t).fields` contains no field named `id` for all 16 id-bearing types; `getEditorFormSchema("ENTITY")` successfully parses an ENTITY payload that omits `id`; CAST MEMBER and ENTITY STATUS descriptors still expose `entity_id` as `kind: "reference"`.
2. `npm run typecheck`
3. `npm run lint` and `npm test`

### Invariants

1. `id` is the **only** field treated as system-managed; no reference role is ever added to `SYSTEM_MANAGED_FIELDS`.
2. Stored payload schemas remain strict with `id: z.uuid()` required (unchanged by this ticket).

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — assert top-level `id` exclusion across all id-bearing types, `getEditorFormSchema` id-omission, and reference-field retention for CAST MEMBER / ENTITY STATUS.

### Commands

1. `npm test -w @loom/core`
2. `npm run typecheck && npm run lint && npm test`
