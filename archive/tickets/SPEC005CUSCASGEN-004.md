# SPEC005CUSCASGEN-004: Web API client wrappers for the generation brief

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — new typed client wrappers in `packages/web/src/api.ts`
**Deps**: SPEC005CUSCASGEN-003

## Problem

The web brief workflow (SPEC005CUSCASGEN-006) and curation extension (SPEC005CUSCASGEN-007) need typed client wrappers for `GET /api/generation-brief`, `PUT /api/generation-brief` (partial-surface write), and the extended `active_working_set` write. Today `api.ts` exposes only `getWorkingSet` / `setWorkingSet` for membership (`packages/web/src/api.ts:222-228`).

## Assumption Reassessment (2026-06-05)

1. `packages/web/src/api.ts` provides `requestJson` (`:112-128`), the `ApiFailure` type (`:40-46`), `getWorkingSet`/`setWorkingSet` (`:222-228`), and `getStoryConfig("PROSE MODE")` (`:214-216`) — the latter is how the brief reads PROSE MODE for the POV. `StoryConfigResponse` (`:95`) already types its payload as `unknown`, the precedent this ticket follows.
2. Route contract from SPEC005CUSCASGEN-003: `GET /api/generation-brief` → `{ok: true, session}` (empty `{}` when none); `PUT /api/generation-brief` accepts any partial subset of brief surfaces → `{ok: true}` | `ApiFailure` (400 with `issues` on malformed). The `GenerationSession` TS type is **not** re-exported from `@loom/core`'s `index.ts`, so this client types `session` as `unknown` (mirroring `StoryConfigResponse`); consumers narrow via `generationSessionSchema` from `@loom/core` if needed.
3. Shared boundary under audit: `api.ts` is the single typed web↔server surface; the new wrappers are consumed by tickets 006 and 007. This ticket is purely additive — it adds functions and types and modifies no existing export, so no existing behavior changes (no §20 retcon).

## Architecture Check

1. Centralizing brief I/O in the existing `api.ts` keeps fetch/error handling uniform with the rest of the client. Typing `session` as `unknown` (like `StoryConfigResponse`) avoids coupling the client to the core schema's TS type and lets each consumer parse/narrow as needed.
2. No backwards-compatibility aliasing or shims — net-new wrappers; `getWorkingSet`/`setWorkingSet` are left untouched.

## Verification Layers

1. Wrappers issue the correct method/URL/body → `api.test.tsx` mock-fetch assertions for `getGenerationBrief` / `setGenerationBrief`.
2. Failure passthrough → `api.test.tsx`: a server `ApiFailure` (e.g. 400 with `issues`) surfaces unchanged through the wrapper.
3. Single-module ticket: layers 1–2 cover the client's two invariants (correct request shaping, faithful failure passthrough); no additional layer applies because the wrappers add no logic beyond request/response plumbing.

## What to Change

### 1. Generation-brief client wrappers

In `api.ts` add `getGenerationBrief(): Promise<GenerationBriefResponse>` and `setGenerationBrief(surfaces): Promise<OkResponse>` (partial-surface payload), plus the `GenerationBriefResponse = { ok: true; session: unknown } | ApiFailure` type. Reuse `requestJson`.

### 2. Extended active-working-set write path

The extended `active_working_set` write (cast bands, `local_function`, `selected_pov`, `manual_directive_id`) is issued through `setGenerationBrief({ active_working_set: ... })`. Keep `getWorkingSet`/`setWorkingSet` for membership.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api.test.tsx` (modify)

## Out of Scope

- Server route implementation (SPEC005CUSCASGEN-003).
- The brief workflow UI and curation UI (SPEC005CUSCASGEN-006/007).
- Re-exporting the `GenerationSession` TS type from `@loom/core` (client types `session` as `unknown`).

## Acceptance Criteria

### Tests That Must Pass

1. New `api.test.tsx` cases: `getGenerationBrief` GETs `/api/generation-brief`; `setGenerationBrief` PUTs the partial surface payload.
2. New `api.test.tsx` case: an `ApiFailure` response surfaces unchanged through the wrapper.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Error passthrough is uniform with the existing client (`ApiFailure` shape preserved).
2. `getWorkingSet`/`setWorkingSet` membership wrappers are unchanged.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — request shaping + failure passthrough for the two new wrappers.

### Commands

1. `npm test` — builds `@loom/core`, then runs Vitest (includes the web `api.test.tsx`).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the client wrappers are proven by `api.test.tsx` within `npm test`; `npx vitest run packages/web/src/api.test.tsx` (from `packages/web`) filters to it during development.
