# SPEC008PROPREGAT-001: Typed `compile()` API client over `POST /api/compile`

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: None — `packages/web` only; consumes the existing `/api/compile` endpoint and `@loom/core` types unchanged.
**Deps**: None

## Problem

The web front end has no client for `POST /api/compile`. `packages/web/src/api.ts`
exposes `validate()` (`/api/validate`) but nothing that fetches the compiled prompt.
SPEC-008's preview surface (SPEC008PROPREGAT-003) needs a typed `compile()` that maps
the endpoint's three response shapes — success, validation-blocked, structured error —
into a discriminated union the UI can switch on without re-deriving "is this blocked".

## Assumption Reassessment (2026-06-05)

1. The endpoint contract is verified in `packages/server/src/compile-routes.ts`: on
   success it returns the bare `compilePrompt()` result (`CompileResult` = `{ prompt,
   metadata }`, **no `ok` field**, line 25); when `runValidation().isBlocked` it returns
   `{ ok: false, kind: "validation-blocked", validation }` (lines 17-23); snapshot
   failures forward `{ ok: false, kind, message }` for `no-open-project` /
   `malformed-validation-source` (`packages/server/src/snapshot-builder.ts:24,28`) with a
   non-200 status code.
2. The types exist and are exported from `@loom/core`: `CompileResult` /
   `CompileMetadata` (`packages/core/src/compiler/types.ts:3,10`, re-exported at
   `packages/core/src/index.ts:20-21`) and `ValidationResult`
   (`packages/core/src/validation/types.ts:30`). `packages/web/src/api.ts:1` already
   imports `ValidationResult` from `@loom/core`; `CompileResult` must be added to that
   import. `ApiFailure` already exists (`packages/web/src/api.ts:40-46`).
3. Shared boundary under audit: the HTTP wire contract between
   `packages/server/src/compile-routes.ts` and `packages/web/src/api.ts`. The private
   helpers `requestJson` / `postJson` (`api.ts:113-133`) are the established fetch layer;
   `compile()` reuses `postJson`, matching `validate()` (`api.ts:239-241`). No second
   fetch layer is introduced.
4. FOUNDATIONS principle restated before trusting the spec: §4.5 fail-closed — the client
   must represent the blocked outcome as a *distinct no-prompt branch*, never as an empty
   prompt. The discriminated union encodes this so the consuming surface cannot
   accidentally render a partial prompt. The payload is key-free (§22/§23), so the typed
   client adds no secret-bearing field.

## Architecture Check

1. A discriminated union keyed on `ok === false` then `kind` mirrors the existing
   `CreateProjectResponse`/`OpenProjectResponse` union style in `api.ts` and lets the
   consumer narrow with a single `switch`, keeping the "blocked vs ready" decision the
   server's, not the client's. Returning the bare `CompileResult` for success (no wrapper)
   matches the endpoint exactly — no client-side reshaping that could drift.
2. No backwards-compatibility aliasing/shims: this is a net-new export; `validate()` and
   all existing clients are untouched.

## Verification Layers

1. `compile()` exists and returns the union type → grep-proof (`grep -n "export async function compile" packages/web/src/api.ts`) + `npm run typecheck`.
2. A success body (no `ok`) narrows to `CompileResult` with `prompt` + `metadata` → unit test.
3. A `validation-blocked` body narrows to the blocked branch carrying `ValidationResult` → unit test.
4. A `no-open-project` / `malformed-validation-source` body narrows to the `ApiFailure` branch with its `kind` → unit test.

## What to Change

### 1. Add the compile response type and `compile()` to `api.ts`

- Extend the `@loom/core` type import (line 1) to include `CompileResult`.
- Define the response union, e.g.:
  ```ts
  export type CompileBlocked = { ok: false; kind: "validation-blocked"; validation: ValidationResult };
  export type CompileResponse = CompileResult | CompileBlocked | ApiFailure;
  ```
- Add `export async function compile(): Promise<CompileResponse>` calling
  `postJson<CompileResponse>("/api/compile")`. Document the discrimination rule in a
  comment: a body with `ok === false` is blocked-or-error (switch on `kind`); any other
  body is a `CompileResult` (has `prompt` + `metadata`).

### 2. Client tests in `api.test.tsx`

- Add cases that stub `fetch` (matching the existing `api.test.tsx` style) and assert:
  success body → `CompileResult` branch (`"prompt" in result`); `validation-blocked` body
  → blocked branch with `result.validation`; `no-open-project` and
  `malformed-validation-source` bodies → failure branch with the right `kind`.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api.test.tsx` (modify)

## Out of Scope

- The `PromptPreviewView` surface, nav promotion, and styling (SPEC008PROPREGAT-003).
- Any `@loom/server` / `@loom/core` / schema change — endpoint and types are consumed as-is.
- Importing `compilePrompt` or any compiler runtime into the web (compilation stays server-side).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/api.test.tsx` — the new compile cases pass.
2. `npm run typecheck` — `CompileResponse` and `compile()` typecheck against `@loom/core` shapes.
3. `npm test` — full web + core suite green (no regression to existing api clients).

### Invariants

1. `compile()` never returns an empty/partial prompt: the only branch carrying a `prompt`
   is the success `CompileResult`; blocked and failure branches carry no prompt field.
2. The success branch is the bare `CompileResult` (no synthesized `ok: true` wrapper), so
   the client shape equals the endpoint shape.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — add compile-client cases (success / blocked / two error kinds), stubbing `fetch` per the file's existing pattern.

### Commands

1. `npm test -- packages/web/src/api.test.tsx`
2. `npm run typecheck && npm test`
3. Per-file `vitest run` is the correct narrow boundary for the client unit; the full `npm test` run is the integration guard.
