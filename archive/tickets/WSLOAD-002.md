# WSLOAD-002: Report working-set load failures distinctly instead of one catch-all

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/working-set/WorkingSetView.tsx` (load-effect error handling); test in `packages/web/src/working-set/WorkingSetView.test.tsx`. No schema, server, or `@loom/core` changes.
**Deps**: WSLOAD-001 (do this after the root-cause fix lands so the new tests reflect corrected load behavior)

## Problem

The working-set load effect wraps three independent requests in a single `Promise.all(...)` with one broad `.catch` at `packages/web/src/working-set/WorkingSetView.tsx:108–111` that always emits the same message: **"Could not load active working set."** This conflates unrelated failure modes — a records-list fetch error, a working-set membership fetch error, a brief fetch error, a client-side parse error, and a transport/network error — behind one notice. That is precisely what made the WSLOAD-001 defect hard to diagnose: a client-side schema throw was indistinguishable from a genuine load failure.

This ticket hardens the diagnostics only; it does not change what data is fetched or persisted.

## Assumption Reassessment (2026-06-08)

1. The single catch-all is `packages/web/src/working-set/WorkingSetView.tsx:108–111`; the three requests are `listRecords`, `getWorkingSet`, `getGenerationBrief` (`:82`). Each `*Response` already carries a discriminated `ok` flag and, on failure, a `message` (see `ApiFailure` in `packages/web/src/api.ts`). Confirmed.
2. After WSLOAD-001, the per-request `ok` branches at `:88–106` already handle the not-ok cases for records and working-set; the remaining gap is that a thrown error (e.g. an unexpected malformed `active_working_set`) and a transport rejection still collapse into one message. Confirmed against the post-WSLOAD-001 load shape.
3. Shared boundary under audit: the `ApiFailure` contract (`{ ok: false, message, ... }`) already returned by `api.ts` for each endpoint — this ticket consumes existing per-response messages; it does not invent a new error contract.
8. Adjacent contradiction classification: this is the "future cleanup that must become its own ticket" item split out from WSLOAD-001's reassessment; it is a robustness improvement, not a correctness fix.

## Architecture Check

1. Surfacing each endpoint's own `message` (and distinguishing a parse/transport error from an API-level failure) gives the user and future maintainers an actionable cause instead of a generic string, without changing the fetch topology. Cleaner than leaving a lossy catch-all that masks distinct faults.
2. No backwards-compatibility shim: this refines existing error handling in place; no new error-reporting authority path is added.

## Verification Layers

1. A failing `getGenerationBrief` (API `ok: false` with a specific `message`) surfaces that message, not the generic string -> component test mocking that response asserts the specific message renders.
2. A failing `listRecords` or `getWorkingSet` surfaces a distinguishable notice -> component test per endpoint asserts the corresponding message.
3. An unexpected thrown/transport error still degrades gracefully with a clear (distinct) fallback notice -> component test forcing a rejection asserts the fallback message and no crash.

## What to Change

### 1. Distinguish failure modes in the load effect

In `packages/web/src/working-set/WorkingSetView.tsx`:

- When an individual response is `ok: false`, surface that response's `message` (scoped to which surface failed) rather than the generic catch-all. Records and working-set already have `ok` branches at `:88–94`; extend the brief branch and add an explicit not-ok notice path.
- Keep the outer `.catch` only for genuine thrown/transport errors, with a fallback message distinct from the API-level failure messages, so a real exception is no longer confused with an API failure.
- Preserve current success behavior exactly (no change to what is fetched, parsed, or stored).

### 2. Tests for each failure mode

In `packages/web/src/working-set/WorkingSetView.test.tsx`, add cases asserting that an API-level failure of each endpoint surfaces its specific `message`, and that a forced rejection surfaces the distinct fallback notice.

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (modify)

## Out of Scope

- The WSLOAD-001 root-cause draft-schema fix (separate ticket; this one depends on it).
- Any change to the fetch set, request shapes, server routes, or schemas.
- Retry/backoff or offline-handling behavior.

## Acceptance Criteria

### Tests That Must Pass

1. A mocked `ok: false` from `getGenerationBrief` renders that response's `message`, not "Could not load active working set."
2. A mocked `ok: false` from `listRecords` and from `getWorkingSet` each render a distinguishable notice.
3. A forced promise rejection renders the distinct fallback notice and does not crash the view.
4. `npm run lint && npm run typecheck && npm test` all pass.

### Invariants

1. Distinct load failure modes produce distinct, message-bearing notices; no single string masks unrelated faults.
2. Success-path behavior (data fetched, parsed, displayed) is byte-for-byte unchanged from WSLOAD-001.

## Test Plan

### New/Modified Tests

1. `packages/web/src/working-set/WorkingSetView.test.tsx` — add per-endpoint API-failure cases and a transport-rejection case; assert message specificity.

### Commands

1. `npm test -- WorkingSetView` (targeted)
2. `npm run lint && npm run typecheck && npm test` (full pipeline)

## Outcome

Completion date: 2026-06-08

What changed:

- Working-set load API failures now surface scoped notices using each endpoint's own failure message.
- Thrown or rejected load failures now use a distinct fallback notice: `Unexpected error while loading active working set.`
- Added component tests covering records-list, working-set membership, generation-brief, and thrown load failures.

Deviations from original plan:

- None.

Verification results:

- `npm test -- WorkingSetView` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 633 tests.
