# PROJGATE-003: Sound failure handling for `validate()` so a 409/error body cannot masquerade as a ValidationResult

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` (`api.ts` `validate()` typing, `generation-brief/ValidationPanel.tsx`). No `@loom/core` or `@loom/server` changes.
**Deps**: None

## Problem

`validate()` (`packages/web/src/api.ts:330`) is typed `Promise<ValidationResult>`, but it is implemented via `postJson` → `requestJson` (`api.ts:197-220`), which — unlike `fetchJson` (`api.ts:183-195`) — **never checks `response.ok`**: it blindly returns the parsed body cast to `T`. When no project is open, `POST /api/validate` returns HTTP 409 `{ ok: false, kind: "no-open-project", message: … }`. That failure body is handed back as if it were a `ValidationResult`. `ValidationPanel.tsx:24-28` then resolves into `status:"ready"` and passes it to `ValidationResultView`, which destructures `{ blockers, warnings }` (both `undefined`) and reads `blockers.length` (`ValidationResultView.tsx:33`) → uncaught `TypeError` → crash (whole-app blank, live-reproduced 2026-06-06).

This is the data-layer root cause of the Generation Brief crash. PROJGATE-001 stops the *no-project* trigger by guarding the route, and PROJGATE-002 stops a throw from blanking the app — but the unsound type is a latent defect that would still crash if `/api/validate` returned any failure (e.g. a transient 500) **while a project is open**. This ticket makes `validate()` honest about failure and makes `ValidationPanel` handle it.

## Assumption Reassessment (2026-06-06)

1. `requestJson` (`api.ts:197-215`) does not inspect `response.status`/`response.ok`; it returns `(await response.json()) as T`. `postJson` (`api.ts:218-220`) delegates to it. `fetchJson` (used by GET helpers) *does* throw on `!response.ok` (`api.ts:190-192`). This asymmetry is the defect. Verified by read.
2. `validate()` returns `postJson<ValidationResult>("/api/validate")` (`api.ts:330-332`); the server returns a `no-open-project` `ApiFailure` body with HTTP 409 for the no-project case (`packages/server/src/snapshot-builder.ts` `noOpenProject()` path, cited by exploration). The type therefore lies whenever the server fails. `ApiFailure` is already defined at `api.ts:45-51`.
3. Scope boundary under audit: **only the `validate()` boundary and its sole consumer `ValidationPanel`.** A global change to `requestJson` (throw on `!response.ok`) is explicitly rejected — other `postJson`/`requestJson` callers (`compile`, `generate`, `putOpenRouterSettings`, accepted-segment mutations) **intentionally** consume `ok:false` bodies and branch on them (e.g. `PromptPreviewView`/`GenerateView`/`AcceptedSegmentsView` render a friendly "Open a project first."). Making the shared transport throw would convert those structured failures into thrown errors and break that handling. The surgical, correct fix is at the `validate()` typing + `ValidationPanel` guard. Verified by grep of `postJson`/`requestJson` callers.
4. FOUNDATIONS principle under audit: §11 (validation fails closed) and §27. Validation already fails closed server-side; this ticket ensures the client renders that closed state safely instead of crashing. No fail-closed gate is weakened — a failure body is treated as "validation could not run," never as "no blockers." §15 secret firewall and §8 deterministic compilation are untouched (no prompt/compiler/secret surface changes). No principle is tensioned.
5. Schema note: `validate()`'s return type is widened from `ValidationResult` to `ValidationResult | ApiFailure`. The **only consumer is `ValidationPanel`** (grep-confirmed), which is updated in this ticket; `ValidationResultView` keeps its strict `ValidationResult` prop and is only ever passed a well-formed result after the guard. This is a consumer-complete, not breaking-and-unhandled, change.

## Architecture Check

1. Narrowing the fix to the `validate()` boundary is cleaner and safer than reworking the shared `requestJson`: it fixes the unsound type exactly where it lies, leaves the deliberate `ok:false`-consuming callers intact, and adds no special-casing to the transport layer. `ValidationPanel` already has a three-state machine (`loading`/`ready`/`error`); routing a failure body into its existing `error` state is the minimal, consistent change.
2. No backwards-compatibility aliasing or shims. No duplicate validation path is introduced; the single `validate()` helper simply tells the truth about its result.

## Verification Layers

1. `validate()` returns `ValidationResult | ApiFailure` and a `no-open-project`/error body is surfaced as a failure, not cast to a result -> schema/type validation (typecheck) + unit test on the API helper or panel.
2. `ValidationPanel` given a failure body renders its error state (e.g. "Open a project first." for `no-open-project`) and never passes a malformed object to `ValidationResultView` -> RTL test.
3. `ValidationResultView` is only ever rendered with a well-formed `ValidationResult` (blockers/warnings present) -> RTL test asserting it is not rendered on the failure path.
4. §11 fail-closed alignment (failure ⇒ "could not validate", never "no blockers") -> FOUNDATIONS alignment check.

## What to Change

### 1. Make `validate()` honest

In `api.ts`, change `validate()` to return `Promise<ValidationResult | ApiFailure>`. Detect failure by the response body shape (`"ok" in body && body.ok === false`) — consistent with how `compile()`'s `CompileResponse` union is already consumed — so a 409/4xx/5xx failure body is typed as `ApiFailure` rather than silently cast to `ValidationResult`.

### 2. Guard in `ValidationPanel`

In `generation-brief/ValidationPanel.tsx`, branch on the result: if it is an `ApiFailure` (`"ok" in result && result.ok === false`), set `status:"error"` with a friendly message (map `no-open-project` → "Open a project first.", consistent with the sibling views), and only set `status:"ready"` with a `result` when it is a well-formed `ValidationResult`. `ValidationResultView` continues to receive only `ValidationResult`.

## Files to Touch

- `packages/web/src/api.ts` (modify — `validate()` return type + failure detection)
- `packages/web/src/generation-brief/ValidationPanel.tsx` (modify — failure branch)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (new or modify)

## Out of Scope

- Any change to the shared `requestJson`/`postJson` behavior or to other callers (`compile`, `generate`, settings, accepted-segments) — explicitly rejected in Assumption Reassessment item 3.
- Route gating (PROJGATE-001) and the render-safety boundary (PROJGATE-002).
- Server-side validation behavior, schema, or the `no-open-project` response contract — unchanged.

## Acceptance Criteria

### Tests That Must Pass

1. `ValidationPanel` given a `no-open-project` `ApiFailure` from `validate()` renders an error/notice state ("Open a project first.") and does **not** render `ValidationResultView` — no `TypeError` is thrown.
2. `ValidationPanel` given a well-formed `ValidationResult` renders `ValidationResultView` with the correct blockers/warnings counts (existing happy path still works).
3. `validate()`'s type is `ValidationResult | ApiFailure` and `npm run typecheck` passes with the updated consumer.
4. `npm test --workspace @loom/web` passes; `npm run lint` passes.

### Invariants

1. A failure response from `/api/validate` is never interpreted as a passing/empty validation; it is surfaced as "validation could not run" (fail-closed, §11).
2. `ValidationResultView` is only ever constructed with a well-formed `ValidationResult`.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/ValidationPanel.test.tsx` — failure body → error state (no throw, `ValidationResultView` absent); well-formed result → `ValidationResultView` present with correct counts.

### Commands

1. `npm test --workspace @loom/web -- src/generation-brief/ValidationPanel.test.tsx`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted panel test plus typecheck (which proves the widened return type is fully handled by the single consumer) is the correct boundary; full `npm test` confirms no cross-package regression.

## Outcome

Completed: 2026-06-07

What changed:
- `packages/web/src/api.ts` now types `validate()` as `ValidationResult | ApiFailure` so structured validation failure bodies are no longer represented as successful validation results.
- `packages/web/src/generation-brief/ValidationPanel.tsx` detects `ApiFailure`, maps `no-open-project` to `Open a project first.`, and renders the panel error state instead of passing a malformed object to `ValidationResultView`.
- `packages/web/src/api.test.tsx` verifies a 409 validation failure body is returned intact.
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` verifies the failure path renders the closed/error state and does not render validation result sections.

Deviations from original plan:
- No behavioral change was made to `requestJson()` or `postJson()`, matching the ticket's scoped architecture check.

Verification results:
- `npm test --workspace @loom/web -- src/generation-brief/ValidationPanel.test.tsx` passed.
- `npm test --workspace @loom/web -- src/api.test.tsx` passed.
- `npm test --workspace @loom/web` passed: 18 files, 112 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 72 files, 434 tests.
