# SPEC003TYPDATMOD-012: Singleton, session & accepted-segment accessors

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends `packages/server/src/record-repository.ts` with story-config / generation-session singleton accessors and minimal accepted-segment append/list.
**Deps**: SPEC003TYPDATMOD-002, SPEC003TYPDATMOD-009, SPEC003TYPDATMOD-011

## Problem

Beyond durable records, Phase 3 needs singleton accessors for the three global story-config kinds and the current generation-session brief state, plus a minimal append-only accepted-segment API. Critically, `accepted_segments` must be reachable **only** through its own API — no record or reference query may read it — establishing the no-compiler-input invariant Phase 7 inherits (FOUNDATIONS §10/§21/§29.8).

## Assumption Reassessment (2026-06-05)

1. Deps land first: the `recordRepository` shell + lifecycle from SPEC003TYPDATMOD-011 (this ticket extends `record-repository.ts`, a file that ticket creates `(new)` — hence the explicit `Deps`); the global-config schemas from 002 (for `setStoryConfig` validation); the brief schemas from 009 (for `setGenerationSession` validation). The five tables exist via ticket 010 (transitively through 011's Deps).
2. Field/shape sources: `story_config` rows keyed by config kind (STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE), each Zod-validated by its 002 schema; `generation_session` holds the current brief state validated by the 009 schemas; `accepted_segments` append-only ordered text + metadata (`DATA-MODEL-AND-RECORDS.md` "Accepted prose storage rules").
3. Shared boundary under audit: the `accepted_segments` table created by ticket 010. The invariant is that the repository exposes exactly `listAcceptedSegments`/`appendAcceptedSegment` as readers — no `getRecord`/`listRecords`/reference query touches it.
4. FOUNDATIONS §10/§21/§29.8 (no accepted prose in prompts; archive separated) motivates the accepted-segment boundary; §20/§29.8 (accepted segments are story output, not future-generation authority) confirms append-only with no prompt-source path. Restated: this phase creates the read/write API for the distinct archive; no compiler-input path exists or is added. Secret firewall (§15) untouched.
5. Singletons are upserts (one row per kind / one session row); `getStoryConfig`/`getGenerationSession` Zod-parse on read and surface a structured diagnostic on malformed JSON (same discipline as ticket 011's record reads).

## Architecture Check

1. Co-locating the singleton/session/accepted accessors on the same `recordRepository` (server-instance state) keeps one lifecycle-bound seam, while routing config/session to their own tables (never `records`) preserves the FOUNDATIONS §6 surface distinction.
2. No backwards-compatibility shims; the accepted-segment API is the sole reader of `accepted_segments` (no alias query path).

## Verification Layers

1. story-config + generation-session singleton round-trips (upsert + read) -> server integration test (`vitest`); malformed JSON surfaces a diagnostic, not a crash.
2. `setStoryConfig` rejects a payload failing its 002 schema; `setGenerationSession` rejects one failing its 009 schema -> integration test (Zod rejection).
3. `accepted_segments` is read ONLY via `listAcceptedSegments`/`appendAcceptedSegment` — no record/reference query reads it -> integration + grep-proof that no other repository method queries `accepted_segments` (FOUNDATIONS §10/§21/§29.8; establishes the Phase-7 no-compiler-input invariant).

## What to Change

### 1. Singleton accessors

Extend `packages/server/src/record-repository.ts`: `getStoryConfig`/`setStoryConfig` (keyed by config kind, Zod-validated by 002 schemas), `getGenerationSession`/`setGenerationSession` (Zod-validated by 009 schemas) — singleton upserts.

### 2. Accepted-segment API

Add `listAcceptedSegments`/`appendAcceptedSegment` (minimal, ordered, append-only) as the sole readers/writers of `accepted_segments`.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify — add singleton/session/accepted accessors; created by ticket 011)
- `packages/server/src/record-repository.accessors.test.ts` (new)

## Out of Scope

- Accepted-segment lifecycle, candidate session, OpenRouter transport — Phases 9–11 (this ticket only creates the minimal append/list API over the distinct table).
- Generation-time brief workflow editor — Phase 5.
- Content-envelope / brief validation — Phase 6.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — story-config + generation-session round-trips; Zod rejection on invalid config/session; `accepted_segments` reachable only via its API; malformed-JSON read diagnostics.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

## Outcome

Completed: 2026-06-05.

Implemented story-config upserts, generation-session upsert/read, and append/list accepted-segment accessors on the lifecycle-bound repository.

Deviation: accepted segments are intentionally excluded from record list/read APIs; the implementation keeps only three SQL touchpoints for the table.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.

### Invariants

1. `accepted_segments` is read by no method other than `listAcceptedSegments`/`appendAcceptedSegment` (§10/§21/§29.8).
2. story-config and generation-session writes are Zod-validated by the 002 / 009 schemas before persistence.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-repository.accessors.test.ts` — singleton round-trips, validation rejection, accepted-segment append/list + boundary assertion.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
