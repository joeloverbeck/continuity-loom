# SPEC004RECCRUBAS-007: Web generic typed record editor engine and reference pickers

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/web` registry-driven editor engine + reference pickers
**Deps**: SPEC004RECCRUBAS-005, SPEC004RECCRUBAS-001

## Problem

Every record type must be creatable and editable through a typed UI form with no raw-JSON fallback. Hand-authoring 18+ forms would duplicate field lists and drift from the schema. This ticket builds one registry-driven editor engine: given a record type, it renders a React Hook Form (with a Zod resolver against the type's payload schema) from the core editor descriptor (-001) — required fields first, prose fields as comfortable textareas, enums as selects, references as pickers populated from existing records, lists/nested groups recursively. It is the form layer the browser's create/edit actions (-006) and the CAST MEMBER / config editors (-008/-009) build on.

## Assumption Reassessment (2026-06-05)

1. Foundations exist: `getEditorDescriptor`, `deriveDisplayLabel`, `eligibleReferenceTargets` from SPEC004RECCRUBAS-001 (`packages/core/src/records/editor-descriptors.ts`); the per-type Zod payload schemas exported from `@loom/core` (`recordTypeRegistry[...].payloadSchema`); `react-hook-form` + `@hookform/resolvers` + `zod` (`^4.x`, matching core) and the typed create/update api wrappers from SPEC004RECCRUBAS-005. Reference roles are enumerable from descriptors (`FieldDescriptor.referenceRole`).
2. Spec `specs/SPEC-004-...md` (Approach → generic/semi-generic typed record editors; UI-WORKFLOWS.md "Record editor patterns") requires required-first ordering, prompt-facing prose fields clearly, validation-only/status fields clearly, reference pickers, and explicitly **no raw Markdown/JSON editor as ordinary UI**.
3. Shared boundary under audit: the **descriptor contract** (-001) drives the form; the **create/update route contract** (-003 via -005) persists it; the engine's component API is the boundary that -008 (CAST MEMBER) and -009 (config editors) consume. The engine must render every descriptor field kind, including nested groups and lists, so no consumer needs a JSON escape hatch.
4. FOUNDATIONS §29.4 ("no arbitrary unvalidated blobs") and §13 (required fields earn their place; field economy) motivate a Zod-resolver-validated form (client-side validation mirrors the server's repository validation) and the required-first layout. The resolver uses the same Zod schema the server validates against, so the client cannot submit a shape the server would reject for structural reasons.

## Architecture Check

1. One descriptor-driven engine keeps a single source of truth (schema → descriptor → form) and makes adding a record type a no-op for the UI. The alternative — per-type React forms — re-encodes every field by hand and drifts. Using the actual core Zod schema as the RHF resolver means client and server validate the same contract.
2. No backwards-compatibility shim: net-new engine; no raw-JSON editor is introduced even transitionally (the no-JSON-UI invariant holds from first commit).

## Verification Layers

1. Engine renders a complete typed form for a representative atomic type and round-trips create + edit -> web component test with mocked create/update routes.
2. No descriptor field renders as a raw-JSON textarea; each kind maps to its typed control -> component test asserting control types per field kind.
3. Reference pickers list only eligible targets for the role -> component test with a fixture record set via `eligibleReferenceTargets`.
4. Client Zod-resolver rejects an invalid form before submit -> component test submitting an invalid value.

## What to Change

### 1. Editor engine

Add `packages/web/src/records/RecordEditor.tsx` (+ field-renderer subcomponents): consumes `getEditorDescriptor(type)` + the type's payload schema, builds an RHF form with a Zod resolver, renders controls per `FieldKind` (short string → input, prose → textarea, enum → select, boolean → checkbox, number → number input, reference → picker, list → add/remove rows, nested_group → fieldset), required fields first, with prompt-facing vs. status/validation-only fields visually distinguished. Submit calls the create or update api wrapper; surfaces server structured-error issues field-linked.

### 2. Reference pickers

A reference-picker control that, given a `referenceRole`, lists eligible existing records (`eligibleReferenceTargets`) by display label, storing the selected ID (never a mutable name).

## Files to Touch

- `packages/web/src/records/RecordEditor.tsx` (new)
- `packages/web/src/records/fields/` (new — per-kind field renderers + reference picker)
- `packages/web/src/records/RecordEditor.test.tsx` (new)

## Out of Scope

- CAST MEMBER-specific editor wiring — SPEC004RECCRUBAS-008 (consumes this engine).
- Global story-config singleton editors — SPEC004RECCRUBAS-009.
- Working-set surface — SPEC004RECCRUBAS-010.
- Continuity validation diagnostics (field-linked blockers from the engine) — Phase 6; this ticket surfaces only structural/Zod errors.
- Rich sectioned/navigable editing affordances beyond required-first typed forms — Phase 5.

## Acceptance Criteria

### Tests That Must Pass

1. The engine renders a complete typed form for a representative atomic record type and round-trips create and edit against mocked routes.
2. Every descriptor field kind renders as its typed control; **no** field renders as a raw-JSON editor.
3. Reference pickers list only role-eligible records and persist the selected ID.
4. An invalid value is rejected client-side by the Zod resolver before submit; server-side structural errors are shown field-linked.
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. No record type is ever edited through a raw arbitrary-JSON UI (FOUNDATIONS §29.4; UI-WORKFLOWS "no raw Markdown/JSON editing").
2. The client form validates against the same Zod payload schema the server enforces — no divergent client contract.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordEditor.test.tsx` — typed-form render, create/edit round-trip, per-kind control mapping, no-JSON assertion, reference-picker eligibility, client+server validation surfacing.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/records/RecordEditor.test.tsx`
2. `npm test && npm run typecheck && npm run lint && npm run build`
