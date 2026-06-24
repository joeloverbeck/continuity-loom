# SPEC032SEGRECASS-003: Registry-derived schema catalog and record/stub renderer

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` modules `compiler/reconciliation/{schema-catalog,record-renderer}.ts` and tests; no change to existing behavior
**Deps**: SPEC032SEGRECASS-002

## Problem

The model must receive every registered record schema and controlled enum from one generated source of truth, never a hand-maintained second taxonomy (which would drift and could reproduce the brief's "17 vs 18 record types" mismatch). This ticket generates the deterministic, provider-neutral creation-schema catalog from `recordTypeRegistry` + each type's Zod payload schema, and renders full in-scope records and minimal reference stubs into the prompt's data sections. The catalog is the authoritative creation vocabulary presented to the model; the renderer produces the escaped-JSON record blocks with deterministic per-type keys.

Implements SPEC-032 Deliverable 2 (part b). Detailed catalog contents and rendering rules are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §5.5–§5.6 and §7.

## Assumption Reassessment (2026-06-24)

1. The registry exposes exactly 18 record types and the generator seams this ticket reuses (verified this session): `recordTypeRegistry`, `recordTypes`, `parseRecordPayload(recordType, payload): unknown` (registry.ts:43), `projectRecordStatus(recordType, payload): string | null` (registry.ts:63), `extractRecordReferences(recordType, payload): RecordReference[]` (registry.ts:53). The catalog and renderer must derive the type list, field shapes, requiredness, and enum vocabularies from these — never from a typed constant.
2. **Zod 4 `z.toJSONSchema()` is available** (verified: `packages/core/package.json` depends on `zod ^4.1.13`, installed 4.4.3; `typeof z.toJSONSchema === "function"`). It provides the base JSON Schema; it is a transport aid only — the authoritative validator after token resolution remains `parseRecordPayload` (enforced in SPEC032SEGRECASS-005). Catalog generation must FAIL (block) if a creation-relevant constraint cannot be represented without silently dropping it.
3. **Cross-artifact boundary under audit**: the catalog's per-type lifecycle field + legal values + allowed deactivation destinations (proposal §7.3/§7.4 — the sign-off-gated D4 table) and reference-bearing-path metadata are consumed by the output parser (SPEC032SEGRECASS-005, which validates `DEACTIVATE` destinations and reference tokens) and described in `docs/story-record-schema.md` §9.4 (SPEC032SEGRECASS-004). The catalog version is tied to `contract.version`. A capstone test (SPEC032SEGRECASS-008) asserts the generated type/enum sets equal the registry-derived sets so the catalog follows future same-change schema amendments.
4. **Deterministic-compilation surface (§8)**: catalog generation and record rendering must be deterministic — sort declared collections, order records by fixed registry order then deterministic display label then id, escape `<`/`>`/`&`/quotes in canonical JSON, never call an LLM, never read wall-clock time. Reference stubs (id/type/label only) must never import an out-of-scope record's payload — the firewall against silent source expansion. The deferred enforcement is the SPEC032SEGRECASS-004 byte-identical-prompt golden; this ticket's tests confirm catalog/registry agreement and stub-payload isolation.

## Architecture Check

1. Deriving the catalog from `recordTypeRegistry` + `z.toJSONSchema()` means correctness never depends on a count or enum list typed into a prompt constant — the single source of truth is the same validators used at repository boundaries, so a future schema amendment flows through automatically and is caught by the agreement test. This is strictly cleaner than the rejected hand-maintained-catalog alternative (proposal §15.16).
2. No backwards-compatibility aliasing/shims: the catalog is generated fresh each compile; no cached or duplicated enum table is retained.

## Verification Layers

1. Catalog-equals-registry invariant (every registered type, field, requiredness rule, and enum in the catalog equals the registry-derived set) → unit test comparing generated catalog against `recordTypes` / registry schemas.
2. Round-trip invariant (representative payloads validate through `parseRecordPayload` against the catalog's declared shape) → schema-validation test per record type.
3. Stub-isolation invariant (a reference stub renders only id/type/display-label, never an out-of-scope payload) → unit test asserting stub objects carry no payload fields.
4. Catalog-generation-fails-closed invariant (an unrepresentable creation-relevant constraint blocks rather than silently drops) → unit test forcing the failure path and asserting it throws/blocks.

## What to Change

### 1. `compiler/reconciliation/schema-catalog.ts`

For each registered type in registry order, emit: exact type literal; payload JSON Schema via `z.toJSONSchema()` (required fields, defaults, unions, arrays, every enum value); a separate `display_label` requirement; `id` marked repository-managed and forbidden in output; lifecycle field name + all legal lifecycle values + allowed deactivation destinations (proposal §7.4); reference-bearing paths with cardinality, legal literal alternatives, expected target types; and a stable catalog version tied to `contract.version`. Block on any unrepresentable creation-relevant constraint.

### 2. `compiler/reconciliation/record-renderer.ts`

Render every full in-scope record with real id, type, stored display label, projected lifecycle state (`projectRecordStatus`), canonical escaped full payload, and deterministic outgoing/incoming reference summaries (`extractRecordReferences`). Order by fixed registry order, then deterministic full display label, then id. Render reference stubs (id/type/label only) in their declared sub-block. Emit the exact empty-state string `No non-archived records exist in the selected reconciliation scope.` when no full records qualify.

## Files to Touch

- `packages/core/src/compiler/reconciliation/schema-catalog.ts` (new)
- `packages/core/src/compiler/reconciliation/record-renderer.ts` (new)
- `packages/core/test/segment-reconciliation-catalog.test.ts` (new)

## Out of Scope

- Assembling the full prompt / section order / fingerprint (SPEC032SEGRECASS-004) — this ticket produces the catalog object and rendered record blocks, not the final prompt string.
- The output parser's use of the catalog for validation (SPEC032SEGRECASS-005).
- Selecting which records are in scope (the server snapshot builder, SPEC032SEGRECASS-006) — this ticket renders whatever record set it is handed.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-catalog` — catalog-equals-registry, round-trip, stub-isolation, and fail-closed tests pass.
2. `npm run typecheck` — strict TS compile.
3. `npm run lint` — passes including the `@loom/core` import-boundary rule.

### Invariants

1. The generated type set and every enum vocabulary equal the registry-derived sets; no type/enum is sourced from a typed constant.
2. A reference stub never carries an out-of-scope payload; record ordering is deterministic (registry order → label → id).

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-catalog.test.ts` — asserts catalog/registry agreement for all 18 types, `parseRecordPayload` round-trip per type, stub-payload isolation, and the catalog-generation fail-closed path.

### Commands

1. `npm test -- segment-reconciliation-catalog`
2. `npm run typecheck && npm run lint`
3. The catalog/renderer are pure functions over the registry; a targeted vitest filter plus typecheck/lint is the right boundary, with end-to-end agreement re-asserted by the capstone (SPEC032SEGRECASS-008).

## Outcome

Completed: 2026-06-24

Added the registry-derived segment-reconciliation schema catalog and deterministic record/reference rendering for reconciliation prompts.

Verification: `npm test -- segment-reconciliation-catalog`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
