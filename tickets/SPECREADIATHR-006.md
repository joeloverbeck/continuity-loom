# SPECREADIATHR-006: Generate page readiness wiring

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — modify `packages/web/src/generate/GenerateView.tsx` to gate on the shared readiness model (including the provider blocker) and render `ReadinessChecklist`. The candidate generate/accept/discard lifecycle and accepted-prose boundaries are unchanged.
**Deps**: SPECREADIATHR-003

## Problem

The Generate page renders the raw-code `ValidationResultView` and derives gating from a separate `getOpenRouterSettings()` credential check plus `validation.isBlocked`. Per the spec's §Generate page it must show the same readiness checklist as Preview, surface a provider-configuration blocker inside that checklist, disable Generate on validation or provider blockers (never on warnings), and keep provider-send errors separate — all while leaving the candidate lifecycle intact.

## Assumption Reassessment (2026-06-07)

1. `GenerateView.tsx` imports `ValidationResultView` (`packages/web/src/generate/GenerateView.tsx:16`) and renders it with `state.result.validation` (`:181`); it fetches `Promise.all([compile(), getOpenRouterSettings()])` (`:58`) and stores `hasOpenRouterCredential` (`:70`); `canGenerate` disables the Generate button (`:261`); the candidate generate/accept/discard lifecycle lives at `:77`–`154` / `:197`, and provider-unavailable is a post-send candidate state (`:342`).
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Generate page) requires: validation blockers → same blocked checklist as Preview; provider settings missing → provider-configuration blocker in the checklist (prompt preview can still render if validation is ready); warnings-only → Generate enabled when provider is valid; provider errors after send are separate from readiness blockers; candidate accept/discard unchanged — candidates are not canon until accepted, and accepted prose still requires manual record updates.
3. Cross-artifact boundary under audit: Generate's gating source switches from `getOpenRouterSettings()` + `validation.isBlocked` to `/api/readiness` (`readiness.canGenerate`, `readiness.provider`), and the renderer from `ValidationResultView` to `ReadinessChecklist`; `/api/compile` still supplies the prompt body and `/api/generate` still drives the candidate.
4. FOUNDATIONS restated: §11 — Generate is disabled by validation blockers OR provider blockers; warnings never disable it (`canGenerate := readiness.canGenerate && not-sending`). §20 / §29.8 — the candidate lifecycle (regenerate/discard/accept; not canon until accepted; post-accept manual-record reminder) and accepted-prose boundaries must remain unchanged; this is a readiness-presentation change only.
5. §20 no silent retcon: replacing the gating source and renderer is deliberate — rationale: one shared readiness model across all three pages, with the provider blocker expressed as a readiness item rather than an ad-hoc credential check.

## Architecture Check

1. Sourcing `provider.configured` and `canGenerate` from the readiness model (which the server computes from the same credential source) removes the parallel `getOpenRouterSettings()` gating path and makes the provider blocker a first-class checklist item, consistent with Preview. The candidate lifecycle stays orthogonal, so the diff is contained to the readiness surface.
2. No backwards-compatibility shims: the `ValidationResultView` branch and the standalone settings-based gate are replaced, not kept alongside the readiness model.

## Verification Layers

1. Validation blockers -> `GenerateView.test.tsx`: blocked checklist renders and Generate is disabled.
2. Provider missing (`provider.configured === false`) -> test: a provider-configuration blocker appears in the checklist and Generate is disabled, while a validation-ready state still allows the prompt body to render.
3. Warnings-only + provider configured -> test: Generate is enabled.
4. Candidate lifecycle unchanged -> existing accept/discard/regenerate tests retained and passing; post-send provider error remains a separate candidate state, not a readiness blocker.

## What to Change

### 1. `packages/web/src/generate/GenerateView.tsx`

Fetch `readiness()` alongside `compile()` (replacing the standalone `getOpenRouterSettings()` gate; provider state now comes from `readiness.provider`). Replace the `ValidationResultView` render with `<ReadinessChecklist>` (the provider blocker renders in its "Required before prompt generation" group via the readiness model). Derive `canGenerate` from `readiness.canGenerate && candidate-not-sending`. Keep the candidate generate/accept/discard handlers, the not-canon-until-accepted semantics, the post-accept reminder, and the post-send provider-unavailable handling exactly as they are.

### 2. `packages/web/src/generate/GenerateView.test.tsx`

Cover the four Verification Layers; keep the existing candidate-lifecycle assertions.

## Files to Touch

- `packages/web/src/generate/GenerateView.tsx` (modify)
- `packages/web/src/generate/GenerateView.test.tsx` (modify)

## Out of Scope

- Generation Brief and Prompt Preview pages (SPECREADIATHR-004 / 005).
- `ReadinessChecklist` internals (SPECREADIATHR-003).
- Deleting `ValidationResultView` (SPECREADIATHR-007, after all three pages migrate).
- Candidate persistence / accepted-prose boundaries (unchanged; governed by the landed candidate-lifecycle and accepted-segment specs).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/generate/GenerateView.test.tsx`.
2. `npm run typecheck`.
3. `npm run lint`.

### Invariants

1. Generate is disabled only by validation blockers or provider blockers; warnings never disable it.
2. The candidate lifecycle is unchanged: candidates are not canon until accepted, provider-send errors stay separate from readiness blockers, and the post-accept manual-record reminder still fires.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generate/GenerateView.test.tsx` — modify: mock `readiness()` + `compile()` + `generate()`; assert blocked checklist + disabled Generate, provider-missing blocker + disabled Generate with body still renderable, warnings-only enabled Generate, and retained candidate accept/discard behavior.

### Commands

1. `npm test -- packages/web/src/generate/GenerateView.test.tsx`
2. `npm run typecheck && npm run lint`
3. Page-level component test is the correct boundary; cross-page end-to-end is the SPECREADIATHR-007 capstone.
