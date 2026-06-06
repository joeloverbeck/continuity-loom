# SPEC012DURCHAREM-003: Web API clients for reminder endpoints

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — two new web API client functions in `packages/web/src/api.ts` (`getDurableChangeReminder`, `acknowledgeDurableChangeReminder`) plus their response types
**Deps**: SPEC012DURCHAREM-002

## Problem

The banner component (SPEC012DURCHAREM-005) needs typed client functions to read reminder state and to acknowledge it, each returning a discriminated success/failure union consistent with the rest of `api.ts`. This ticket adds those clients and their tests against the endpoint contract defined in SPEC012DURCHAREM-002. (SPEC-012 Deliverable 3.)

## Assumption Reassessment (2026-06-06)

1. **`api.ts` client convention confirmed.** `packages/web/src/api.ts` defines `ApiFailure` (`api.ts:40`) and per-surface discriminated unions such as `AcceptResponse = { ok: true; segment: AcceptedSegmentRef } | ApiFailure` (`api.ts:110`) and `ListAcceptedSegmentsResponse` (`api.ts:111`). The new reminder clients follow this exact `{ ok: true; reminder: … } | ApiFailure` shape, with `no-open-project` reachable through `ApiFailure`.
2. **Endpoint contract lands in SPEC012DURCHAREM-002.** `GET /api/durable-change-reminder` and `POST /api/durable-change-reminder/acknowledge` return the reminder state object; per `Deps`, the routes exist before this ticket. SPEC-012 §Deliverables 3 governs.
3. **Shared boundary under audit:** the typed client/route contract. The client `ReminderResponse` type must match the server response field-for-field (`active`, `latestSegment: { sequence, createdAt } | null`, `acknowledgedThroughSequence`); a drift here is a silent integration break.
4. **Existing web test convention:** client tests live in `packages/web/src/api.test.tsx` (jsdom, mocked `fetch`); the new client tests extend that file rather than creating a new one.

## Architecture Check

1. Adding the clients to `api.ts` keeps all server communication in one typed module (the banner imports functions, never raw `fetch`), matching every other surface. The discriminated union lets the banner branch on `ok` and treat `no-open-project` as "inactive" without special-casing transport.
2. No backwards-compatibility shim: these are new functions; no prior reminder client exists to alias.

## Verification Layers

1. Client request shape -> test: `getDurableChangeReminder` issues `GET /api/durable-change-reminder`; `acknowledgeDurableChangeReminder` issues `POST /api/durable-change-reminder/acknowledge` with an empty body.
2. Response typing -> test (mocked `fetch`): active, inactive, and post-acknowledge payloads parse into the typed union; `no-open-project` resolves to `ApiFailure`.
3. Type contract parity with server -> FOUNDATIONS-adjacent manual review: `ReminderResponse` fields equal the SPEC012DURCHAREM-002 response fields.

## What to Change

### 1. Reminder client functions + types

In `packages/web/src/api.ts`:

- Add `Reminder` / `ReminderResponse` types: `{ ok: true; reminder: { active: boolean; latestSegment: { sequence: number; createdAt: string } | null; acknowledgedThroughSequence: number } } | ApiFailure`.
- `getDurableChangeReminder(): Promise<ReminderResponse>` — `GET /api/durable-change-reminder`.
- `acknowledgeDurableChangeReminder(): Promise<ReminderResponse>` — `POST /api/durable-change-reminder/acknowledge` with an empty JSON body, returning the recomputed state.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api.test.tsx` (modify)

## Out of Scope

- The banner component and AppShell mount — SPEC012DURCHAREM-005.
- The RecordBrowser `?create=<TYPE>` consumer — SPEC012DURCHAREM-004.
- Any server-side route logic — SPEC012DURCHAREM-002 (`Deps`).

## Acceptance Criteria

### Tests That Must Pass

1. `getDurableChangeReminder` parses an `active:true` payload and an `active:false` payload into the typed union.
2. `acknowledgeDurableChangeReminder` posts to the acknowledge endpoint and parses the recomputed (`active:false`) state.
3. A `no-open-project` response resolves to `ApiFailure` for both clients.
4. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The banner imports reminder clients from `api.ts`; no component issues a raw `fetch` for reminder state.
2. `ReminderResponse` is field-identical to the SPEC012DURCHAREM-002 server response.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — add reminder-client cases (active, inactive, post-acknowledge, `no-open-project`) with mocked `fetch`, alongside the existing accepted-segment client tests.

### Commands

1. `npm test -- api.test` — targeted run of the web API client suite.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline.

## Outcome

Completed: 2026-06-06

Added typed durable-change reminder client support in `packages/web/src/api.ts`: `DurableChangeReminderResponse`, `getDurableChangeReminder()`, and `acknowledgeDurableChangeReminder()`. The response type matches the server route fields (`active`, `latestSegment`, `acknowledgedThroughSequence`), and the acknowledge client posts an empty JSON body to the acknowledge endpoint.

Extended `packages/web/src/api.test.tsx` with mocked-fetch coverage for active and inactive reminder reads, acknowledge request shape and recomputed response parsing, and unchanged `no-open-project` failures for both clients. No deviations from the ticket plan.

Verification:

- `npm test -- api.test` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
