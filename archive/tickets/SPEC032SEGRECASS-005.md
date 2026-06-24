# SPEC032SEGRECASS-005: Strict output JSON Schema, full-response parser, reference tokens, and verbatim-echo firewall

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `compiler/reconciliation/{output-schema,parse-output}.ts` and an exhaustive parser test suite; no change to existing behavior
**Deps**: SPEC032SEGRECASS-003

## Problem

Reconciliation output is one strict JSON object validated locally in full, all-or-nothing: any malformed key, invented enum, illegal lifecycle destination, invalid reference, cyclic dependency, stale source fingerprint, or material verbatim accepted-prose echo quarantines the **entire** response — no partial salvage, no JSON repair, no second model pass. This ticket builds the canonical output JSON Schema (provider-neutral, `additionalProperties:false` throughout) and the authoritative local parser: the 14 ordered validation passes (proposal §6.8), the reference-token grammar (`$record:[KEY]` / `$new:NEW-NNN`, §6.7), the acyclic creation-dependency resolution with deterministic temporary ids, the post-resolution `parseRecordPayload` re-validation, and the deterministic verbatim-echo firewall (§6.9).

Implements SPEC-032 Deliverable 2 (part d). Output contract, validation order, and echo thresholds are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §6.

## Assumption Reassessment (2026-06-24)

1. The parser consumes the catalog from SPEC032SEGRECASS-003 (lifecycle field map, allowed deactivation destinations, reference-bearing paths, enum vocabularies) and re-validates resolved payloads through `parseRecordPayload(recordType, payload)` (registry.ts:43, verified this session). It does not re-derive types/enums — the catalog is the single source.
2. The proposal-suggested reason codes (`not-pure-json`, `schema-mismatch`, `source-mismatch`, `unknown-citation`, `invalid-brief-path`, `invalid-brief-value`, `invalid-record-target`, `invalid-patch`, `invalid-lifecycle-destination`, `invalid-record-type`, `invalid-enum`, `invalid-record-payload`, `invalid-reference`, `cyclic-creation-dependency`, `verbatim-source-echo`) are ephemeral assistance-output parse codes, **not** `docs/validation-rule-inventory.md` diagnostic codes — they are not bound by the one-severity-per-code inventory model (confirmed: reconciliation does not register validation rules). They live only in the malformed-result scratch shape.
3. **Cross-artifact boundary under audit**: the parser validates against (a) the citation keys emitted by SPEC032SEGRECASS-002 (`[SEG-…]`, `[BRIEF:…]`, record/stub/scope keys), (b) the catalog from -003, and (c) the source fingerprint produced by the compiler in SPEC032SEGRECASS-004 (the `source` echo must exactly match the current inspected source). These three contracts must align; a drift in any key/format breaks parsing. The server (SPEC032SEGRECASS-006) calls this parser and never repairs its output.
4. **FOUNDATIONS principle restated (§10 / §29.2)**: the verbatim-echo firewall is the deterministic enforcement of "no accepted prose copied into a proposed canonical field." It scans every model-authored natural-language string (brief prose values, string/list patches, creation prose, display labels, rationales): NFKC + case-fold + whitespace-collapse, reject a ≥50-normalized-char accepted-segment substring or a ≥8-token verbatim run, exempt only enum literals/booleans/numbers/ids/keys/tokens and validated proper-name atoms ≤3 tokens. A threshold change is contract behavior requiring the version cascade.
5. **Deterministic, fail-closed, no-repair surface (§8/§11/§29.2)**: parsing is all-or-nothing and deterministic — the 14 passes either all succeed (`valid`) or the whole response quarantines (`malformed` scratch with a reason code). No partial salvage, no JSON repair, no second LLM call, no persistence. Temporary creation-validation ids are derived from the prompt fingerprint + proposal id (deterministic), exist only during validation, and are never surfaced as copyable ids or written to storage.

## Architecture Check

1. A single all-or-nothing parser with ordered passes is simpler and safer than per-item salvage: cross-item dependencies (a creation graph, a reference token) mean one invalid enum can change the meaning of the whole proposal set, so whole-response quarantine is the correct boundary (proposal §15.13). Reference tokens bound to inspected source keys (never raw model UUIDs) prevent hallucinated ids and force deterministic validation (§15.14).
2. No backwards-compatibility aliasing/shims: the parser is net-new; it does not wrap or fall back to a lenient legacy path — malformed is malformed.

## Verification Layers

1. Full-response-quarantine invariant (any single invalid item quarantines the whole response; no partial salvage) → parser unit test with one-bad-item-among-valid fixtures per failure class.
2. Reference-resolution invariant (existing tokens resolve to rendered keys/stubs, new-to-new tokens form an acyclic graph, raw UUIDs rejected, resolved payloads pass `parseRecordPayload`) → parser test over token/dependency fixtures including cycles and self-reference.
3. Echo-firewall invariant (≥50-char substring or ≥8-token run quarantines; short atomic names/enums exempt) → parser test at, below, and above both thresholds.
4. Schema-strictness invariant (`additionalProperties:false` at every object layer; unknown/missing keys rejected) → JSON-Schema assertion + parse-rejection test.

## What to Change

### 1. `compiler/reconciliation/output-schema.ts`

Generate the strict top-level output JSON Schema (`contract: "segment_reconciliation.v1"`, `source` echo, three always-present proposal arrays, `additionalProperties:false` at every layer) plus the per-proposal shapes (brief-field `FILL/REPLACE/CLEAR`; record-change `UPDATE_FIELDS/DEACTIVATE` with RFC-6901 pointers; creation with reference tokens + `dependencies`). Provider-neutral; usable as the OpenRouter `response_format` schema when supported.

### 2. `compiler/reconciliation/parse-output.ts`

Implement the 14 ordered passes (proposal §6.8): pure-JSON-object check; strict top-level parse; source/sequence/scope match; unique sequential prefixed ids; citation-key resolution + kind; brief path/value validation; record pointer/operation legality; lifecycle-destination legality; type/field/enum/union/unknown-key checks; reference-token resolution to compatible existing/proposed type; exact acyclic dependencies; resolved-payload `parseRecordPayload` + reference validation against a synthetic project index; no duplicate target/action; and the verbatim-echo firewall. Emit `valid` proposals or a `malformed` scratch (`status`, `reasonCode`, `summary`, in-memory `rawOutput`). Deterministic temporary ids from prompt fingerprint + proposal id.

## Files to Touch

- `packages/core/src/compiler/reconciliation/output-schema.ts` (new)
- `packages/core/src/compiler/reconciliation/parse-output.ts` (new)
- `packages/core/test/segment-reconciliation-parser.test.ts` (new)

## Out of Scope

- Exporting these from `index.ts` and the version bump — those land with SPEC032SEGRECASS-004 (this ticket's tests import the modules directly; if -004 has not yet exported the barrel, the import path is the module file).
- Calling the parser from the server / making the OpenRouter request (SPEC032SEGRECASS-006).
- The UI rendering of valid proposals vs. malformed scratch (SPEC032SEGRECASS-007).
- Mutation-config enrollment of these files (SPEC032SEGRECASS-008).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-parser` — exhaustive valid/invalid fixtures (proposal §12.3) pass: every brief path/operation, every lifecycle destination, every creation type/enum, token/dependency/cycle cases, fingerprint/scope drift, and echo thresholds.
2. `npm run typecheck` — strict TS compile.
3. `npm run lint` — passes including the `@loom/core` import-boundary rule.

### Invariants

1. The output JSON Schema has `additionalProperties:false` at every object layer; the parser is all-or-nothing with no partial salvage, repair, or second pass.
2. Every reference resolves to a compatible existing/proposed type via inspected source keys; raw model UUIDs are rejected; resolved payloads pass `parseRecordPayload`; temporary ids never reach storage or the UI.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-parser.test.ts` — the exhaustive valid/invalid fixture matrix of proposal §12.3, including the one-bad-item-quarantines-all case and echo thresholds at/below/above.

### Commands

1. `npm test -- segment-reconciliation-parser`
2. `npm run typecheck && npm run lint`
3. A targeted filter plus typecheck/lint is the right boundary; the parser is a pure function with no server integration here. Mutation coverage of the parser's lifecycle/path/enum/citation/dependency/echo dispatch is enrolled in SPEC032SEGRECASS-008.

## Outcome

Completed: 2026-06-24

Added the strict segment-reconciliation output JSON schema and local parser, including source echo validation, citation validation, record/brief/creation proposal validation, dependency checks, and accepted-prose echo quarantine.

Verification: `npm test -- segment-reconciliation-parser`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
