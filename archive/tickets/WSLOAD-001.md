# WSLOAD-001: Load the working set by parsing the generation brief as a draft

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/working-set/WorkingSetView.tsx` (load path); test in `packages/web/src/working-set/WorkingSetView.test.tsx`. No schema, server, or `@loom/core` changes.
**Deps**: None

## Problem

The Active Working Set page shows **"Could not load active working set."** for any project whose generation session is only partially authored, and edits to the cast `band` / `local_function` selectors appear never to save.

Root cause (reproduced against `/home/joeloverbeck/stories/red-bunny`): `WorkingSetView` validates the **draft** generation session returned by `GET /api/generation-brief` with the strict **completion** schema `generationSessionSchema` at `packages/web/src/working-set/WorkingSetView.tsx:98`. That schema requires a fully-populated `current_authoritative_state` (~15 fields) and `immediate_handoff` (`last_visible_moment`, `begin_after`). A real in-progress session fills only some of those fields, so `parse` throws (verified: 12 `invalid_type`/`invalid_union` issues on the persisted payload). The throw rejects the `Promise.all(...).then(...)` and lands in the `.catch` at `:108–111`, which sets the error notice. Because `setActiveWorkingSet` (`:99`) never runs, the selectors render the empty default instead of persisted state.

The "doesn't save" symptom is a consequence, not a second bug: the `PUT /api/generation-brief` save (validated by the lenient draft schema server-side) succeeds, but every reload re-throws on the same draft, so the page never reflects saved state. Additionally, because in-memory state is stuck at the empty default, each band edit builds its payload from that default and can clobber persisted fields (e.g. `selected_pov`) on the next save. Both symptoms disappear once the load stops throwing.

## Assumption Reassessment (2026-06-08)

1. The offending parse is `generationSessionSchema.parse(briefResponse.session)` at `packages/web/src/working-set/WorkingSetView.tsx:98`; it is the only use of the strict final schema in `packages/web` (`grep -rn generationSessionSchema packages/web/src` returns just this file). Confirmed.
2. The correct pattern already exists in-repo: `packages/web/src/generation-brief/GenerationBriefView.tsx:49` parses the same endpoint's response with `generationSessionDraftSchema`. Confirmed.
3. Shared boundary under audit: the `GET /api/generation-brief` response contract. The server handler (`packages/server/src/generation-brief-routes.ts`) returns `session` parsed/normalized via `generationSessionDraftSchema`, i.e. a **draft** (partial sub-records allowed). The web consumer must validate against the same draft contract, not the completion schema.
4. FOUNDATIONS/validation principle restated: the strict `generationSessionSchema` is the deliberate **compile-readiness/completion** gate (paired with `generation-brief-readiness`). This ticket must not weaken it — the gate stays strict; the UI simply stops mis-applying it to an in-progress draft at load time.
5. Enforcement-surface check (deterministic compilation / validation gate): compile-readiness is enforced elsewhere (the final schema + readiness logic). Switching the working-set **load** to the draft schema does not relax any gate that governs what compiles; it only restores correct display of an in-progress draft. `activeWorkingSetSchema` (the working-set sub-object's own strict schema) remains applied to the working set itself (see What to Change), so the working set's own validation is unchanged.
6. Schema consumers: no schema changes. `generationSessionDraftSchema` is already exported from `@loom/core` (`packages/core/src/index.ts:109`) and already consumed by `GenerationBriefView`.
8. Adjacent contradiction classification: the broad `.catch` at `:108–111` conflates the three independent requests and network-vs-parse failures, masking the true cause. That is a **separate robustness improvement** tracked in WSLOAD-002, not required for this fix.

## Architecture Check

1. Aligns the working-set load with the existing `GenerationBriefView` precedent (one consistent way to read this endpoint: as a draft). It validates each object against the schema appropriate to its state — the draft session as a draft, and the `active_working_set` sub-object against its own strict `activeWorkingSetSchema` (which is genuinely complete) — rather than forcing an in-progress draft through a completion gate.
2. No backwards-compatibility alias or shim: the strict-schema import is replaced, not duplicated. No second authority path is introduced.

## Verification Layers

1. A partially-authored session loads without error -> component test mocking a session with a partial `current_authoritative_state`/`immediate_handoff` asserts no `role="alert"` notice and that persisted bands render.
2. The working-set sub-object is still strictly validated -> the load still parses `session.active_working_set` with `activeWorkingSetSchema`; a malformed `active_working_set` still surfaces an error (existing behavior preserved).
3. No strict completion schema remains on the web load path -> `grep -rn "generationSessionSchema" packages/web/src` returns no `.parse` usage.

## What to Change

### 1. Parse the brief response as a draft in `WorkingSetView`

In `packages/web/src/working-set/WorkingSetView.tsx`:

- Replace the `generationSessionSchema` import (line 3) with `generationSessionDraftSchema`.
- At the load site (currently `:98–103`), parse the response with the draft schema, then validate only the working-set sub-object with the existing strict `activeWorkingSetSchema` (already imported) before spreading it over the default. Illustrative shape:

  ```ts
  const session = generationSessionDraftSchema.parse(briefResponse.session);
  const persistedWorkingSet = session.active_working_set
    ? activeWorkingSetSchema.parse(session.active_working_set)
    : undefined;
  setActiveWorkingSet({
    ...defaultActiveWorkingSet(selectedIds),
    ...(persistedWorkingSet ?? {}),
    selected_records: selectedIds
  });
  ```

  This keeps strict validation exactly where the data is complete (the working set itself) and removes it from sibling draft sub-records the component never reads.

### 2. Regression test for the partial-draft load

In `packages/web/src/working-set/WorkingSetView.test.tsx`, add a case that mocks `getGenerationBrief` returning `ok: true` with a session whose `current_authoritative_state` and `immediate_handoff` are partially filled (the shape that previously threw) plus a populated `active_working_set` (a cast member in `active_onstage_cast_full` and a `selected_pov`). Assert: (a) no "Could not load active working set." alert appears, and (b) the cast `band` selector reflects the persisted `active` band.

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (modify)

## Out of Scope

- Any change to `generationSessionSchema`, `activeWorkingSetSchema`, the draft schema, or server routes.
- Granular error reporting / splitting the broad `.catch` — see WSLOAD-002.
- Backfilling or migrating persisted draft sessions.

## Acceptance Criteria

### Tests That Must Pass

1. New `WorkingSetView.test.tsx` case: a session with partial `current_authoritative_state`/`immediate_handoff` loads with no error notice and renders the persisted `active` band.
2. Existing `WorkingSetView.test.tsx` cases continue to pass unchanged.
3. `npm run lint && npm run typecheck && npm test` all pass.

### Invariants

1. The working-set load path validates the generation session as a **draft**; the strict completion schema is never applied to a session that may be partially authored.
2. The `active_working_set` sub-object remains strictly validated by `activeWorkingSetSchema` on load.

## Test Plan

### New/Modified Tests

1. `packages/web/src/working-set/WorkingSetView.test.tsx` — add the partial-draft load case (the previously-uncovered shape that triggered the bug; existing mocks only used `session: {}` or a bare `active_working_set`).

### Commands

1. `npm test -- WorkingSetView` (targeted: the component under change)
2. `npm run lint && npm run typecheck && npm test` (full pipeline)

## Outcome

Completion date: 2026-06-08

What changed:

- `WorkingSetView` now parses `GET /api/generation-brief` sessions with `generationSessionDraftSchema` on load.
- The nested `active_working_set` payload is still parsed with `activeWorkingSetSchema` before being merged into the page state.
- Added a `WorkingSetView` regression for a partially authored draft that preserves and renders persisted cast band metadata without writing on load.

Deviations from original plan:

- None.

Verification results:

- `npm test -- WorkingSetView` passed.
- `rg -n "generationSessionSchema" packages/web/src` returned no matches.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 629 tests.
