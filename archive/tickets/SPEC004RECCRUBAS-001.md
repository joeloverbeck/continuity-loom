# SPEC004RECCRUBAS-001: Core record-editor descriptors and label/reference-target helpers

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` UI-support module(s); new exports in `packages/core/src/index.ts`
**Deps**: None

## Problem

Phase 4 must render typed editors and reference pickers for all 21 registry record types (18 durable + 3 global-config singletons) without any raw-JSON fallback and without silently dropping fields. Today `@loom/core` exposes the registry (`recordTypeRegistry`, `parseRecordPayload`, `extractRecordReferences`) but nothing that tells a UI *what fields a record type has, in what order, of what kind (short string / prose / enum / reference / list / nested group), required or optional, and prompt-facing vs. status/validation-only*. Without a deterministic, registry-keyed descriptor the web editors would hand-hardcode per-type forms (drift risk) or fall back to raw JSON (forbidden). This ticket adds the pure, I/O-free descriptor layer plus two small helpers (default display-label derivation, eligible reference-target resolution) that the browser and editor tickets consume.

## Assumption Reassessment (2026-06-05)

1. The registry contract exists as assumed: `recordTypeRegistry: Readonly<Record<string, RecordTypeDefinition>>`, `recordTypes`, `getRecordTypeDefinition`, `parseRecordPayload`, `extractRecordReferences`, `projectRecordStatus` in `packages/core/src/records/registry.ts:15-65`; `RecordReference { refRole, targetId }` in `packages/core/src/records/references.ts:1`. Per-type Zod payload schemas live in `packages/core/src/records/{entity,cast-member,knowledge,space-material,causal-pressure,relationship-emotion,global-config,generation-brief}.ts`. `RecordTypeDefinition` carries `extractReferences(payload)` per type, so reference *roles* are already enumerable from the registry.
2. Spec `specs/SPEC-004-record-crud-and-basic-editors.md` (Approach → `@loom/core`, Deliverable 1) names exactly: per-type field manifests/editor descriptors, display-label derivation, reference-target option helpers; and constrains them to the pure import boundary. `docs/story-record-schema.md` is the field-name authority; `docs/requirements-version-1/UI-WORKFLOWS.md` ("Record editor patterns") requires required-first ordering and a prompt-facing vs. validation-only/status distinction.
3. Shared boundary under audit: the **descriptor contract** is a cross-package interface consumed by web tickets SPEC004RECCRUBAS-006 (browser filters), -007 (editor engine), -008 (CAST MEMBER editor), -009 (config editors). Its exported TypeScript shape and field-kind enum are the contract; they must be stable and cover every schema field so no consumer needs a raw-JSON fallback.
4. FOUNDATIONS §13 (field economy; atomic records + CAST MEMBER rich exception) and §29.3 (no silent compression of active/onstage cast) motivate the hard requirement that a descriptor enumerate **every** field of its type — including every CAST MEMBER core + extended field — so the editor cannot silently omit one. The descriptor is a presentation aid only; it adds no selection/ranking intelligence (no LLM, no "smart" reordering beyond the deterministic required-first then schema-order rule).

## Architecture Check

1. A single registry-keyed descriptor derived from the canonical Zod schemas keeps one source of truth: the schema defines the fields, the descriptor projects them for UI. The alternative — hand-authored per-type React forms — duplicates field lists across 21 types and drifts from the schema. A drift-guard test (descriptor field set ≡ schema key set per type) makes the coverage invariant mechanical.
2. No backwards-compatibility shims: this is net-new pure code. It does not alter the registry or any schema; it reads them.

## Verification Layers

1. Every registry type yields a descriptor whose field set equals its schema's key set (no omissions) -> schema validation (descriptor-vs-schema key diff test over `recordTypes`).
2. Descriptor field-kind classification is deterministic and total (every field maps to a known kind enum) -> codebase grep-proof + unit test asserting no `unknown`/unclassified field.
3. Reference-target helper returns only schema-eligible targets for a given role (e.g. `owner` → ENTITY-kind records) -> unit test with a fixture record set.
4. Purity preserved -> FOUNDATIONS alignment check via existing `packages/core/test/boundary.test.ts` (no `node:*`/framework import added).

## What to Change

### 1. Editor-descriptor module

Add `packages/core/src/records/editor-descriptors.ts` exporting:
- a `FieldKind` union (`"short_string" | "prose" | "enum" | "reference" | "list" | "nested_group" | "boolean" | "number"`);
- a `FieldDescriptor` interface (`name`, `kind`, `required`, `promptFacing` boolean (false = status/validation-only), `enumValues?`, `referenceRole?`, `itemDescriptor?` for lists, `fields?` for nested groups);
- a `RecordEditorDescriptor` interface (`recordType`, ordered `fields: FieldDescriptor[]` with required fields first then schema order);
- `getEditorDescriptor(recordType: string): RecordEditorDescriptor | undefined` and `recordEditorDescriptors` keyed by type.

Descriptors must be derived from / kept in lockstep with the registry schemas. Whether by Zod-schema introspection or hand-authored manifests co-located with each schema is the implementer's choice, subject to the drift-guard test in Acceptance.

### 2. Display-label + reference-target helpers

In the same module (or a sibling pure module, re-exported): `deriveDisplayLabel(recordType, payload): string` (e.g. ENTITY `display_name`, FACT truncated `statement`, falling back to a type-name default) and `eligibleReferenceTargets(refRole, records): RecordSummary[]` returning deterministically-sorted records whose type is valid for that role. No ranking beyond stable sort (type, label, id).

### 3. Exports

Add the new public surface to `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (new)

## Out of Scope

- Any React/UI code, forms, or pickers — web tickets SPEC004RECCRUBAS-006/-007/-008/-009.
- HTTP routes — SPEC004RECCRUBAS-003/-004.
- Working-set schema relaxation — SPEC004RECCRUBAS-002.
- Validation rules / deterministic compilation mapping — Phases 6/7.

## Acceptance Criteria

### Tests That Must Pass

1. For every type in `recordTypes`, `getEditorDescriptor(type)` is defined and its descriptor field set equals the type's Zod schema key set (drift-guard; no missing or extra field) — explicitly asserted for CAST MEMBER's full core + extended field tree.
2. Every descriptor field has a `FieldKind` in the known union (no unclassified field) and `required`/`promptFacing` booleans set.
3. `deriveDisplayLabel` and `eligibleReferenceTargets` return expected values for a representative fixture; `eligibleReferenceTargets` excludes type-ineligible records.
4. `npm test` and `npm run typecheck` pass; `packages/core/test/boundary.test.ts` stays green.

### Invariants

1. A descriptor enumerates every field of its record type — never a subset (no silent field drop; FOUNDATIONS §29.3).
2. The module imports no `node:*` and no framework (core purity boundary holds).

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — descriptor coverage/drift-guard over all `recordTypes`, field-kind totality, label + reference-target helpers.

### Commands

1. `npx vitest run packages/core/test/editor-descriptors.test.ts packages/core/test/boundary.test.ts`
2. `npm test && npm run typecheck && npm run lint`
