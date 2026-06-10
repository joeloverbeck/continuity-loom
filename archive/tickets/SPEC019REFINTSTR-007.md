# SPEC019REFINTSTR-007: Legible snapshot-build failure for dangling selected_records

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — enriches the `SnapshotBuildResult` failure body in `snapshot-builder.ts` (`@loom/server`) and the failure rendering in `ValidationPanel.tsx` (`@loom/web`); server + web tests. Fail-closed behavior is unchanged — only the diagnostic legibility changes.
**Deps**: None

## Problem

SPEC-019 D7: when a `selected_records` id no longer resolves to a stored record, `resolveSelectedRecords` bails on the first missing id and the build returns an opaque 422 `malformed-validation-source` body (`packages/server/src/snapshot-builder.ts:118-139`). The user sees a generic error with no indication of which working-set entry is stale or how to fix it. Make the failure identify the dangling id(s) and the one-step fix (remove from the working set), and render it as an actionable readiness diagnostic — without changing the fail-closed behavior.

## Assumption Reassessment (2026-06-10)

1. Server seam: `resolveSelectedRecords` (`packages/server/src/snapshot-builder.ts`) loops `selected_records`, calls `repository.getRecord(id)`, and returns `{ ok: false, message }` on the **first** failure; `buildSnapshotFromOpenProject` wraps it as `{ ok: false, status: 422, body: malformedDependency(message) }` where `malformedDependency` yields `{ ok: false, kind: "malformed-validation-source", message }`. The body is emitted unchanged by all four callers (`readiness-routes.ts:13`, `validation-routes.ts:12`, `compile-routes.ts`, `generate-routes.ts`) via `reply.code(status).send(body)` — so enriching the body propagates to every route with no per-route edit.
2. Web seam: `packages/web/src/generation-brief/ValidationPanel.tsx` maps a failure to a message via `validationFailureMessage(result)` and already branches on `failure.kind` (e.g. `=== "no-open-project"` at `:99`). The `malformed-validation-source` kind currently falls through to a generic string; this ticket adds a branch that names the dangling ids and the fix.
3. Cross-artifact boundary under audit: the `SnapshotBuildResult` failure `body` shape is the server↔web contract. The enrichment is additive (new fields on the existing `malformed-validation-source` body); the only consumer that reads `kind`/fields is `ValidationPanel.tsx` — the four routes are pass-through.
4. FOUNDATIONS §11 legibility: "a validation error should identify the conflicting records or fields, explain the conflict in plain language, and indicate what the user can change." Today's opaque message violates this; the fix satisfies it. Author-facing message stays plain; raw ids may appear in details.
5. Fail-closed surface (§4.5): the build still fails closed on a dangling `selected_records` id — preview/compile/send remain blocked. Only the body's legibility changes; no new path lets a broken working set compile. No secret content is added to the body (record ids only).
6. Schema/namespace: the `malformed-validation-source` body gains a structured dangling-ids field plus an actionable message; additive, so existing tests asserting `kind === "malformed-validation-source"` still hold.

## Architecture Check

1. Collecting all dangling ids in `resolveSelectedRecords` (instead of bailing on the first) and surfacing them in the typed body is cleaner than a string-only message the web must parse — the web renders structured ids directly. Enriching the shared `SnapshotBuildResult.body` keeps all four routes legible from one change rather than special-casing each route.
2. No backwards-compatibility aliasing/shims: the body is extended in place; no parallel "legible" body type is introduced.

## Verification Layers

1. All dangling `selected_records` ids are collected (not just the first) -> server unit test on `buildSnapshotFromOpenProject` with two missing ids.
2. The 422 body names the dangling id(s) and the remove-from-working-set fix, `kind` unchanged -> server test asserting the body shape.
3. `ValidationPanel` renders the dangling-id diagnostic as an actionable message -> web component test (`ValidationPanel.test.tsx`).
4. Fail-closed unchanged -> server test asserting the result is still `{ ok: false, status: 422 }` (build still refused).

## What to Change

### 1. Collect-all + enrich the body (`packages/server/src/snapshot-builder.ts`)

Change `resolveSelectedRecords` to accumulate every unresolved `selected_records` id rather than returning on the first. Extend `malformedDependency` (or the dangling-specific path) so the 422 body carries the dangling ids and an actionable message ("remove these ids from the active working set"), keeping `kind: "malformed-validation-source"`.

### 2. Render it (`packages/web/src/generation-brief/ValidationPanel.tsx`)

Extend `validationFailureMessage` so the `malformed-validation-source` branch surfaces the dangling ids and the one-step fix as an author-actionable readiness message.

## Files to Touch

- `packages/server/src/snapshot-builder.ts` (modify)
- `packages/web/src/generation-brief/ValidationPanel.tsx` (modify)
- `packages/server/src/snapshot-builder.test.ts` (modify)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (modify)

## Out of Scope

- The `projectRecordIndex` population in `snapshot-builder.ts` (001 owns it; mechanical merge if both land — see Step 6 shared-file overlaps).
- Any validation rule (003–006); D7 is about the build-failure path, not `runValidation`.
- Auto-pruning dangling `selected_records` (rejected — SPEC-019 scope decision 3 keeps deletion-dangling surfaced, not auto-cleaned).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server -- snapshot-builder` — a snapshot build with multiple dangling `selected_records` ids returns a 422 whose body lists all of them and states the fix.
2. `npm test --workspace @loom/web -- ValidationPanel` — the panel renders the dangling-id failure as an actionable message.
3. `npm run lint && npm run typecheck && npm test` — full gate.

### Invariants

1. A dangling `selected_records` id still fails the build closed (status 422); only the body legibility changes.
2. The failure body enumerates every dangling id, not just the first encountered.

## Test Plan

### New/Modified Tests

1. `packages/server/src/snapshot-builder.test.ts` (modify) — multi-dangling-id collection + structured body shape + still-fails-closed.
2. `packages/web/src/generation-brief/ValidationPanel.test.tsx` (modify) — actionable rendering of the enriched `malformed-validation-source` body.

### Commands

1. `npm test --workspace @loom/server -- snapshot-builder`
2. `npm test --workspace @loom/web -- ValidationPanel`
3. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-10.

- Updated snapshot building so dangling `active_working_set.selected_records` ids are collected together instead of stopping at the first missing id.
- Kept fail-closed behavior unchanged: a stale selected record still returns 422 with `kind: "malformed-validation-source"`.
- Enriched the malformed validation-source body with `danglingSelectedRecordIds` and `suggestedAction: "Remove these ids from the active working set."`.
- Updated `ValidationPanel` to render the structured dangling-id failure as an actionable message.
- Added server and web coverage for multiple dangling ids and the rendered working-set fix.

Verification:

- `npm test --workspace @loom/server -- snapshot-builder`
- `npm test --workspace @loom/web -- ValidationPanel`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite large-chunk warning)
