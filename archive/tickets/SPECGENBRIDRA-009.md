# SPECGENBRIDRA-009: Capstone — draft→save→readiness end-to-end + UI runbook

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — new server e2e test `generation-brief-draftability.e2e.test.ts` + a manual UI runbook; no production behavior change
**Deps**: SPECGENBRIDRA-003, SPECGENBRIDRA-006, SPECGENBRIDRA-007, SPECGENBRIDRA-008

## Problem

The spec's §Test requirements span core, server, snapshot, and web layers. Per-layer assertions live in their owning tickets (001–008), but the spec's central guarantee — that saving a partial draft never invokes readiness blockers, that defaults make the false `focus-tag-count-invalid` blocker disappear, and that Preview/Generate still block on true gaps — is a cross-layer property. This capstone exercises the composed draft→save→readiness pipeline end-to-end and provides a manual runbook for the UI smoke (no browser-automation harness exists in the repo). It introduces no production logic.

## Assumption Reassessment (2026-06-07)

1. The repo's e2e convention is co-located server `*.e2e.test.ts` (`packages/server/src/gate.e2e.test.ts`, `phase4-gate.e2e.test.ts`, `demo-e2e.test.ts`); the web layer is exercised by vitest component tests (`GenerationBriefView.test.tsx`), so the CI-runnable cross-layer surface is the server e2e and the UI portion is a manual runbook. Confirmed this session. `generation-brief-draftability.e2e.test.ts` does not yet exist (collision-checked free).
2. The capstone exercises the surfaces built by its Deps: route contracts (SPECGENBRIDRA-005 via 008), repository draft parse (004 via 005/007), snapshot default (006), migration (007), and compiler empty states (003). SPECGENBRIDRA-002 (readiness normalizer) has no in-spec consumer and is unit-tested in its own ticket — it is intentionally not exercised here.
3. Shared boundary under audit: the full `/api/generation-brief` → snapshot → validation pipeline. This ticket modifies none of it; it asserts the composed behavior. Expected counts (e.g. accepted-segment count → context) are re-derived from the test fixture at test start, not hardcoded.
4. FOUNDATIONS restated and verified by this capstone: §11 — saving a partial draft runs no readiness blockers, yet Preview/Generate remain blocked when a true blocker exists (missing launch directive) and warnings never block; §10 — no accepted-prose text enters the snapshot/prompt input; §8 — the deterministic context default is server-visible and reproducible.

## Architecture Check

1. A single trailing capstone that exercises the assembled pipeline (rather than duplicating per-layer unit assertions) gives one authoritative end-to-end gate while keeping each layer's fine-grained tests in its own ticket. The manual runbook covers the one surface CI cannot drive (the live UI smoke).
2. No backwards-compatibility aliasing/shims and no production logic introduced — verification-only.

## Verification Layers

1. Draft-save-no-blocker invariant (PUT partial blank draft → `ok: true`, no readiness evaluation) -> server e2e assertion.
2. Default-removes-false-blocker invariant (after save, the snapshot/validation does not raise `focus-tag-count-invalid`) -> server e2e assertion against the validation route/snapshot.
3. True-blocker-still-blocks invariant (missing `manual_moment_directive.must_render` blocks Preview/Generate) -> server e2e assertion.
4. No-accepted-prose invariant (snapshot/prompt input contains no accepted-segment text) -> server e2e grep/assertion on compiled input.
5. UI smoke (blank-draft save shows `Draft saved.`, Preview blocked, no console errors) -> manual runbook (no browser-automation harness).

## What to Change

### 1. New `packages/server/src/generation-brief-draftability.e2e.test.ts`

- Drive the open-project → `PUT /api/generation-brief` (partial blank draft) → `GET` → validation/snapshot path. Assert: partial draft saves `ok: true` with no readiness blockers; GET `defaults.generation_context` matches the fixture's accepted-segment count (re-derived, not hardcoded); a defaulted snapshot raises no `focus-tag-count-invalid`; a missing launch directive still blocks Preview/Generate; warnings do not block; no accepted-prose text appears in the compiled/snapshot input; the save path logs no secret-bearing payload.

### 2. Manual UI runbook (in this ticket)

- Step-by-step: launch the app → Generation Brief → leave the manual directive blank → Save → expect `Draft saved.` and no console error → confirm Preview/Generate remain blocked (missing directive) with a legible blocker, not a save failure. Each step lists its expected observable result.

## Files to Touch

- `packages/server/src/generation-brief-draftability.e2e.test.ts` (new)

## Out of Scope

- Any production logic (verification-only; owned by SPECGENBRIDRA-001–008).
- The readiness three-page UX and `ReadinessSummary` (`SPEC-readiness-diagnostics-and-three-page-ux.md`).
- Browser-automation tooling (the UI smoke is a manual runbook).

## Acceptance Criteria

### Tests That Must Pass

1. `PUT` of a partial blank draft returns `ok: true` and triggers no readiness blocker; a subsequent validation/snapshot read raises no `focus-tag-count-invalid`.
2. With a missing launch directive, Preview/Generate are blocked with a legible blocker; warnings do not block.
3. No accepted-prose text appears in the compiled prompt / snapshot input; the save path logs no secret-bearing payload.
4. `GET defaults.generation_context` equals the value derived from the fixture's accepted-segment count.
5. `npm run lint && npm run typecheck && npm test` all pass.

### Invariants

1. Draft saving and generation readiness remain separated end-to-end: `canSaveDraft` holds except for malformed shape / no project (§11).
2. Accepted prose never enters prompt context anywhere in the pipeline (§10).

## Test Plan

### New/Modified Tests

1. `packages/server/src/generation-brief-draftability.e2e.test.ts` (new) — composed draft→save→readiness pipeline assertions enumerating the spec's §Test requirements cross-layer bullets; fixture-derived counts.

### Commands

1. `npx vitest run packages/server/src/generation-brief-draftability.e2e.test.ts` — the capstone e2e gate.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate (the final spec-completion gate; manual UI runbook executed alongside).

## Outcome

Completed on 2026-06-07.

- Added `packages/server/src/generation-brief-draftability.e2e.test.ts` as the composed capstone for draft save, deterministic generation-context defaults, readiness validation, compile blocking, warning-only compile success, accepted-prose exclusion from compiled prompt text, and save-path log secrecy.
- The capstone creates a project, appends one accepted segment, saves a blank launch-directive draft, verifies `continuation_after_accepted_segment` is derived from the accepted-segment count, verifies `missing-manual-directive` remains the true blocker while `focus-tag-count-invalid` is absent, then saves a directive and compiles without including accepted prose.

Manual UI runbook:

1. Start the app with `npm run dev` and open the Vite URL.
2. Create or open a project, then navigate to Generation Brief.
3. Leave `manual_moment_directive.must_render` blank and click Save Generation Brief.
4. Expected: the page shows `Draft saved.`, no console error is emitted for the blank directive, and the UI does not insert `Continue the immediate moment.`
5. Run Preview/Generate from the normal workflow with the directive still blank.
6. Expected: Preview/Generate are blocked by the missing manual directive readiness blocker; the save itself is not reported as failed.
7. Add a local must-render directive and save again.
8. Expected: readiness refreshes from server state, warning-only validation does not block generation, and accepted prose text is not surfaced as prompt context.

Verification:

- `npm exec vitest run packages/server/src/generation-brief-draftability.e2e.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
