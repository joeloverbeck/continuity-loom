# SPEC003SCHEMAFIX-002: Fix CONSEQUENCE reference extractor UUID guard

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/causal-pressure.ts` CONSEQUENCE `extractReferences`.
**Deps**: None (corrects SPEC-003, archived/completed)

## Problem

The CONSEQUENCE reference extractor (`causal-pressure.ts:204–211`) classifies `cause` as a record reference using a one-character guard:

```ts
...(/^[0-9a-f]/i.test(payload.cause) ? [{ refRole: "record_link", targetId: payload.cause }] : [])
```

`cause` is typed `z.union([recordId, nonemptyString])`, so it legitimately holds **prose**. Any prose `cause` beginning with a hex digit — *"fire spread to the east wing"* (`f`), *"3 days of silence"* (`3`), *"a debt came due"* (`a`) — is misclassified as a record reference and written into `record_references` with a garbage `target_id`. Every other extractor in the repo guards with the full UUID regex (`references.ts:15`, `common.ts:17`). This isolated weak guard pollutes the reference projection — the exact deterministic substrate Phase 6 validation traverses for contradiction/dangling-reference checks.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/causal-pressure.ts:204–211`, CONSEQUENCE `extractReferences`. The `holder_or_target` branch (line 207) is **safe** — its single-string form is `recordId | "public" | "unknown"`, and neither enum value starts with a hex char, so a passing single string is always a UUID. Only the `cause` branch (line 210) is defective because `nonemptyString` admits arbitrary prose.
2. Canonical guard already exists: `referenceIfId(refRole, value)` in `packages/core/src/records/common.ts:14` returns a `{refRole, targetId}` only for full-UUID values, else `undefined`; `compactReferences` (`references.ts:6`) drops the `undefined`s. This is the pattern OBJECT already uses (`space-material.ts:94–99`).
3. Schema under audit: the `record_references` projection contract (`from_record_id`, `ref_role`, `target_id`) populated from each type's `extractReferences`. Consumer: Phase 6 deterministic validation (future) plus the server's transactional projection refresh on save (`@loom/server` repository). The fix changes only which tuples CONSEQUENCE emits — no projection-shape change.
4. FOUNDATIONS principle restated: §8 deterministic compilation and §11 validation/hard-fails depend on a clean reference graph; a reference pointing at non-existent `target_id` "fire spread to the east wing" would either be ignored (silent data rot) or trip a spurious dangling-reference blocker. Restated: reference projection must contain only real outgoing references.
5. Adjacent-contradiction classification: the weak guard is a **separate bug uncovered during reassessment**, fully contained in this ticket; no other type uses `/^[0-9a-f]/i` (grep-confirmed: the pattern appears only at `causal-pressure.ts:207,210`).

## Architecture Check

1. Routing both CONSEQUENCE `cause` and `holder_or_target` through `referenceIfId`/`compactReferences` makes the type use the same full-UUID guard as the rest of the registry — one reference-detection rule, no per-type heuristic drift.
2. No backwards-compatibility shim — the `/^[0-9a-f]/i` heuristic is removed, not retained behind a flag.

## Verification Layers

1. A prose `cause` beginning with a hex char emits **no** reference -> unit test on CONSEQUENCE `extractReferences`.
2. A UUID `cause` and a UUID `holder_or_target` still emit `record_link`/`holder_or_target` references -> unit test.
3. No weak guard remains -> grep-proof (`grep -rn "0-9a-f]/i" packages/core/src` matches nothing outside the full 36-char UUID regex).

## What to Change

### 1. Replace the `cause` heuristic with the canonical UUID guard

In `causal-pressure.ts` CONSEQUENCE `extractReferences`, build references via `compactReferences([... referenceIfId("record_link", payload.cause), ...])` and route the single-string `holder_or_target` form through `referenceIfId("holder_or_target", ...)` as well, dropping both `/^[0-9a-f]/i` tests. Keep the array-form `holder_or_target` and `owed_by`-style list handling via `refsFromStrings` (already UUID-guarded).

## Files to Touch

- `packages/core/src/records/causal-pressure.ts` (modify — import `referenceIfId`/`compactReferences`, rewrite CONSEQUENCE extractor)
- `packages/core/test/records.test.ts` (modify — CONSEQUENCE reference-extraction coverage)

## Out of Scope

- Other types' extractors (already UUID-guarded; verified).
- Phase-6 validation behavior over the projection.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — CONSEQUENCE with a prose `cause` ("fire spread…") emits zero references; with a UUID `cause` and UUID `holder_or_target` emits the expected `record_link` and `holder_or_target` tuples.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Every reference emitted by any record type targets a full-UUID `target_id`.
2. No `/^[0-9a-f]/i` (or any sub-UUID hex prefix test) remains in `packages/core/src`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — CONSEQUENCE prose-cause (no ref) and UUID-cause/target (refs emitted) cases.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

What changed:
- Replaced CONSEQUENCE's scalar `holder_or_target` and `cause` one-character hex prefix tests with the shared full-UUID `referenceIfId` guard.
- Kept array-form `holder_or_target` extraction on `refsFromStrings`, which already filters for full UUID values.
- Added record extractor tests proving prose causes beginning with a hex character emit no reference while UUID `cause` and UUID `holder_or_target` still emit the expected references.

Deviations from original plan:
- None.

Verification results:
- `npm test --workspace @loom/core` passed: 3 test files, 15 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 14 test files, 64 tests.
- `npm run build` passed.
- `rg -n "0-9a-f\\]/i|/\\^\\[0-9a-f\\]" packages/core/src` found only the full UUID regex helpers in `common.ts` and `references.ts`.
