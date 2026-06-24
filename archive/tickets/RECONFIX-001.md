# RECONFIX-001: Re-validate UPDATE_FIELDS patched payloads through `parseRecordPayload` in the reconciliation output parser

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — tightens the `@loom/core` segment-reconciliation output parser (`compiler/reconciliation/parse-output.ts`) to enforce the already-declared output contract pass 12; no output-schema, prompt, fingerprint, or `version.ts` change
**Deps**: None (SPEC-032 / SPEC032SEGRECASS-001..008 implemented and archived; this is a post-completion conformance remediation against that implementation)

> Namespace note: this is the first active `tickets/` ticket; no active prefix existed. The archived SPEC-032 ticket family is `SPEC032SEGRECASS-001..008` (in `archive/tickets/`), which this does not extend because that spec is COMPLETED/archived. A fresh `RECONFIX` (segment-RECONciliation FIX) prefix is used at `-001`.

## Problem

SPEC-032's segment-reconciliation output parser is **all-or-nothing**: any malformed item must quarantine the entire provider response (`status: "malformed"`), with no partial salvage. The spec mandates that record-change proposals pass a **post-patch registry re-parse** — Approach §7 ("…RFC-6901 pointer patches, immutable id, ≤1 proposal per record, **post-patch registry re-parse**"), the source proposal §6.8 **pass 12** ("all **patched**/created payloads pass registry parsing and reference validation"; `reports/segment-reconciliation-assistance-change-proposal.md:787`), and ticket SPEC032SEGRECASS-005 §2.

The implementation validates `UPDATE_FIELDS` patches **structurally only** (op/path/value shape) and never applies the patch to the target record's stored payload nor re-parses the result through `parseRecordPayload`. Record **creation** proposals are re-parsed (`parse-output.ts:347`); record **change** proposals are not. Consequently a patch that would yield a schema-invalid record — an invalid enum value, a removed required field, or a mutated immutable `id` — is returned to the UI as a **`valid`** "Suggestion only" card instead of quarantining the whole response.

The blast radius is bounded (nothing auto-applies; the canonical record editor re-validates on manual re-authoring), but this breaks the all-or-nothing quarantine guarantee the design leans on (FOUNDATIONS §29.2: "any malformed item quarantines the complete response"). The green test suite never caught it because `packages/core/test/segment-reconciliation-parser.test.ts` has **no** UPDATE_FIELDS-yields-invalid-payload fixtures.

## Assumption Reassessment (2026-06-24)

1. The gap is real and located at `packages/core/src/compiler/reconciliation/parse-output.ts` (verified this session): `parseRecordChangeProposals` (`:262-304`) calls `parsePatches` (`:371-392`), which only validates `op ∈ {add,replace,remove}`, `typeof path === "string"`, and `path.startsWith("/")` — no patch application, no registry re-parse. The creation path re-parses at `:345-357` (`parseRecordPayload(proposal.record_type, resolvedPayload)`), proving the seam and the `invalid-enum`/`invalid-record-payload` reason-code dispatch (`:351-357`) this ticket reuses. `grep -niE "applyPatch|apply.*patch|rfc6901"` over the module returns nothing — no existing patch-application helper.
2. The parser has everything it needs to apply+re-parse (verified): `ReconciliationRecord` carries `id`, `type: string`, and `payload: unknown` (`packages/core/src/compiler/reconciliation/types.ts:37-44`); `SegmentReconciliationParseContext.records: readonly ReconciliationRecord[]` (`parse-output.ts:57`) is in scope, and `parseRecordChangeProposals` already resolves the exact target `record` at `:282`. `parseRecordPayload(recordType: string, payload: unknown): unknown` is the authoritative validator (`packages/core/src/records/registry.ts:43`).
3. **Cross-artifact boundary under audit**: the output contract `segment_reconciliation.v1` and the proposal §6.8 fourteen-pass validation order are the shared contract. This ticket implements the *missing* slice of pass 12 (patched payloads) **without** changing the output JSON Schema (`output-schema.ts`), the prompt, the compiler fingerprint, or `version.ts` — the contract already declares this validation; the parser was merely not enforcing it. No version cascade is required (this is not an echo-threshold or schema change, which SPEC032SEGRECASS-005 §4 correctly says *would* require the cascade).
4. **FOUNDATIONS principle restated before trusting the spec narrative**: the change strengthens §29.2 (durable change & human gatekeeping — "any malformed item quarantines the complete response; no repair/salvage/second pass") and §11/§29.5 (validation completeness). It adds enforcement; it relaxes nothing. The amended §10/§28.1 accepted-prose lane is untouched.
5. **Fail-closed validation + deterministic-compilation surface (§8)**: the parser is a fail-closed, deterministic, all-or-nothing surface. The patch application must be pure (deep-clone the stored payload, apply add/replace/remove against the clone, re-parse) — no `Date`/random/LLM, no mutation of `context.records`, no network. A re-parse failure must `throw reason(...)` so the single top-level `try/catch` (`:120-145`) quarantines the **whole** response — never a partial salvage. The secret firewall (§15) is unaffected: no new data is read or emitted; validation happens on already-in-memory payloads.
6. **Adjacent findings classified (audit O2/O3, out of scope)**: the catalog fail-closed check in `schema-catalog.ts:104-112` is shallow (audit finding O2) — left unticketed as low-value defense-in-depth, since `parseRecordPayload` is the authoritative validator and already backstops invalid creations. The §10 near-duplicate restatements in `docs/FOUNDATIONS.md` (audit finding O3) are cosmetic redundancy, not a contradiction — no action. Neither is a required consequence of this ticket.

## Architecture Check

1. Reusing the existing creation-path pattern — `parseRecordPayload` re-parse with the `invalid-enum` vs `invalid-record-payload` reason-code dispatch — keeps both proposal paths validated by the **same** authoritative registry validator, rather than inventing a second, weaker structural-only check for patches. Applying the patch to a clone of the real stored payload (available at `:282`) is the only way to validate the *post-patch* record, which is what the contract's pass 12 requires.
2. No backwards-compatibility aliasing/shims: the validation is added inline to `parseRecordChangeProposals`; no lenient legacy path is retained, no parallel validator introduced.

## Verification Layers

1. Post-patch quarantine invariant (an `UPDATE_FIELDS` patch that produces a schema-invalid record — invalid enum, removed required field — quarantines the **whole** response as `malformed`, no partial salvage) → parser unit test with one-bad-patch-among-valid fixtures.
2. Immutable-id / illegal-pointer invariant (a patch targeting `/id`, or a pointer that cannot legally apply to the record, is rejected → `malformed`) → parser unit test.
3. No-regression invariant (a valid `UPDATE_FIELDS` patch that yields a schema-valid record still parses to `valid`; determinism preserved; `context.records` not mutated) → parser unit test asserting a valid patched proposal round-trips and the source record object is unchanged after parsing.

## What to Change

### 1. `compiler/reconciliation/parse-output.ts` — re-parse patched payloads

In `parseRecordChangeProposals`, for each `UPDATE_FIELDS` proposal (the target `record` is already resolved at the existing `:282`): deep-clone `record.payload`, apply each parsed `JsonPatchOperation` (`add`/`replace`/`remove`) against the clone using deterministic RFC-6901 pointer resolution, then call `parseRecordPayload(record.type, patchedPayload)`. Reuse the existing creation-path catch (`:351-357`): a `ZodError` with an `invalid_value` issue → `reason("invalid-enum", …)`, any other failure → `reason("invalid-record-payload", …)`. Reject before applying: a patch whose `path` is `/id` (or otherwise mutates the immutable repository id) → `reason("invalid-patch", …)`; a pointer that cannot legally apply to the record's structure (e.g. `replace`/`remove` of a non-existent path) → `reason("invalid-patch", …)`. `DEACTIVATE` proposals (no patches) keep their current lifecycle-destination validation unchanged. Apply patches against a clone only — never mutate `context.records`.

### 2. `packages/core/test/segment-reconciliation-parser.test.ts` — add the missing pass-12 fixtures

Add fixtures (co-located with the existing parser suite): an `UPDATE_FIELDS` patch that sets an invalid enum value → `malformed` (`invalid-enum`); a patch that removes a required field → `malformed` (`invalid-record-payload`); a patch targeting `/id` → `malformed` (`invalid-patch`); and a positive case — a valid `UPDATE_FIELDS` patch yielding a schema-valid record still returns `valid`. Each invalid case asserts the **entire** response quarantines (no surviving valid proposals).

## Files to Touch

- `packages/core/src/compiler/reconciliation/parse-output.ts` (modify)
- `packages/core/test/segment-reconciliation-parser.test.ts` (modify)

## Out of Scope

- Any change to the output JSON Schema (`output-schema.ts`), the prompt/template, the compiler fingerprint, or `version.ts` — this is a validation-completeness fix against the already-declared contract, not a contract change.
- The catalog fail-closed depth (audit O2) and the §10 doc redundancy (audit O3) — see Assumption Reassessment item 6.
- Any server/web change — the route already returns the parser's `malformed` scratch verbatim (`segment-reconciliation-parse.ts`); tightening the core parser propagates with no route/UI edit.
- Echo-firewall thresholds, reference-token grammar, or creation-payload validation — unchanged.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-parser` — the new invalid-enum / removed-required-field / `/id`-mutation patch fixtures each quarantine the whole response as `malformed`, and the valid-patch positive case still parses to `valid`.
2. `npm test` — green across both packages (no regression in the existing parser, golden, route, e2e, or cross-pillar suites).
3. `npm run typecheck && npm run lint && npm run build` — green, including the `@loom/core` import-boundary rule.

### Invariants

1. A record-change proposal whose post-patch payload fails `parseRecordPayload` (or whose patch targets `/id` or an illegal pointer) quarantines the **complete** response; no partial salvage, no repair, no second pass.
2. Patch application is pure and deterministic — it operates on a clone, never mutates `context.records`, and uses no clock/random/network/LLM; identical input yields identical output.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-parser.test.ts` — adds the UPDATE_FIELDS post-patch fixtures (invalid enum, removed required field, `/id` mutation → `malformed`; valid patch → `valid`), closing the pass-12 coverage gap that let the defect ship.

### Commands

1. `npm test -- segment-reconciliation-parser`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. A targeted parser filter plus a full `npm test` is the correct boundary: the parser is a pure `@loom/core` function, so the targeted filter proves the fix, and the full run confirms the tightened validation doesn't regress the golden/route/e2e/cross-pillar suites that exercise the parser end to end.

## Outcome

Completed: 2026-06-24

What changed:

- Tightened `packages/core/src/compiler/reconciliation/parse-output.ts` so `UPDATE_FIELDS` proposals apply JSON pointer patches to a cloned target payload and re-parse the patched payload with `parseRecordPayload`.
- Added deterministic RFC-6901 pointer handling for `add`, `replace`, and `remove`, including rejection for immutable `/id` mutations and unresolved object/array paths.
- Reused the existing `invalid-enum` versus `invalid-record-payload` reason-code split for post-patch registry validation failures.
- Added parser fixtures in `packages/core/test/segment-reconciliation-parser.test.ts` for invalid enum patches, removed required fields, immutable `/id` patches, unresolved pointers, valid patches, and source-payload immutability.

Deviations from original plan:

- None. No output schema, prompt/template, fingerprint, version, server, or web changes were made for this ticket.
- Smoke skipped: this is a pure `@loom/core` parser validation change with no browser-facing, request-shape, provider-route, or localhost workflow surface.

Verification:

- `npm test -- segment-reconciliation-parser` — passed; 1 test file, 17 tests.
- `npm test` — passed; 166 test files, 1753 tests.
- `npm run typecheck` — passed across core, server, and web workspaces.
- `npm run lint` — passed across core, server, and web workspaces.
- `npm run build` — passed; Vite emitted the pre-existing chunk-size warning only.
