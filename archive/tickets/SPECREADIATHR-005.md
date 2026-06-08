# SPECREADIATHR-005: Prompt Preview page readiness wiring

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — modify `packages/web/src/preview/PromptPreviewView.tsx` to render the shared readiness checklist for gating/warnings while keeping the compiled prompt body from `/api/compile`. No change to the deterministic compiler or prompt content.
**Deps**: SPECREADIATHR-003

## Problem

The Prompt Preview page currently renders the raw-code `ValidationResultView` for the blocked state and the prompt body otherwise. Per the spec's §Prompt Preview page it must show three states — blocked (checklist, no prompt body), warnings-only (prompt body plus "Recommended before sending"), and clean (prompt body plus "Ready to generate") — using the shared readiness checklist, with warnings never entering the compiled prompt.

## Assumption Reassessment (2026-06-07)

1. `PromptPreviewView.tsx` imports `CompileResult` from `@loom/core` and calls `compile()` (`packages/web/src/preview/PromptPreviewView.tsx:35`), rendering `ValidationResultView` with `state.result.validation` when blocked (`:91`, under "Prompt preview is unavailable while blockers exist." `:87`) and `PromptInspector` for the body otherwise (`:110`). The prompt body is produced solely by the deterministic compiler via `/api/compile`.
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Prompt Preview page) requires: blockers → "Prompt preview is blocked" + checklist, no body; warnings-only → body + warnings under "Recommended before sending"; clean → body + "Ready to generate". Technical metadata stays outside the prompt body; warnings are not inserted into the compiled prompt.
3. Cross-artifact boundary under audit: preview adds `/api/readiness` (SPECREADIATHR-002) for the checklist and gating decision (`readiness.canPreview`) while keeping `/api/compile` for the prompt body; the blocked-state renderer changes from `ValidationResultView` to `ReadinessChecklist` (SPECREADIATHR-003). `compile()` and `readiness()` can be fetched together (mirroring `GenerateView`'s `Promise.all`).
4. FOUNDATIONS restated: §10 — accepted prose and advisory warnings must never enter the compiled prompt. The prompt body remains exactly `compile()`'s `prompt`; warnings render as UI chrome (checklist) outside `PromptInspector`. This migration must not route any warning or readiness text into the prompt body.
5. §20 no silent retcon: replacing the blocked-state renderer and adding the readiness fetch is a deliberate behavior change — rationale: the spec's shared readiness presentation across all three pages.

## Architecture Check

1. Reading `readiness.canPreview` for the gate (instead of re-deriving blocked-ness from `compile().validation` locally) keeps the gating decision single-sourced in the core model that the other two pages also use, and isolates the prompt body to the deterministic compiler. Fetching both in parallel keeps the refresh path simple.
2. No backwards-compatibility shims: the `ValidationResultView` branch is replaced, not retained beside the checklist.

## Verification Layers

1. Blocked state -> `PromptPreviewView.test.tsx`: `readiness.canPreview === false` renders "Prompt preview is blocked" + `ReadinessChecklist` and no `PromptInspector`.
2. Warnings-only state -> test: prompt body renders, warnings appear under "Recommended before sending", and the rendered prompt body equals `compile().prompt` byte-for-byte (FOUNDATIONS §10 — no warning text in body).
3. Clean state -> test: prompt body renders with "Ready to generate" and no warning section.
4. Technical metadata stays outside the prompt body -> test asserting `legacyCode`/raw paths appear only within the checklist's technical expander, never inside `PromptInspector`.

## What to Change

### 1. `packages/web/src/preview/PromptPreviewView.tsx`

Fetch `readiness()` alongside `compile()` in `refreshPreview`. Extend the state to carry the `GenerationReadiness` plus the optional compiled prompt. Gate on `readiness.canPreview`: when false, render the "Prompt preview is blocked" heading + `<ReadinessChecklist>` and no `PromptInspector`; when true, render `PromptInspector` for the body plus either the warnings checklist under "Recommended before sending" (`status === "ready-with-warnings"`) or a "Ready to generate" affordance (`status === "ready"`). Remove the `ValidationResultView` import/branch.

### 2. `packages/web/src/preview/PromptPreviewView.test.tsx`

Cover the three states and the §10 body-equality assertion.

## Files to Touch

- `packages/web/src/preview/PromptPreviewView.tsx` (modify)
- `packages/web/src/preview/PromptPreviewView.test.tsx` (modify)

## Out of Scope

- Generation Brief and Generate pages (SPECREADIATHR-004 / 006).
- `ReadinessChecklist` internals (SPECREADIATHR-003).
- Deleting `ValidationResultView` — still imported by Generate until it migrates (SPECREADIATHR-007).
- Compiler / prompt-template changes — `cross-spec: SPEC-foundational-doc-amendments-for-generation-readiness` (Phase 7).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/preview/PromptPreviewView.test.tsx`.
2. `npm run typecheck`.
3. `npm run lint`.

### Invariants

1. The rendered prompt body equals the deterministic compiler output (`compile().prompt`); no warning, technical, or readiness text enters the prompt body (§10).
2. The preview gate reads `readiness.canPreview`; warnings never disable preview.

## Test Plan

### New/Modified Tests

1. `packages/web/src/preview/PromptPreviewView.test.tsx` — modify: mock `readiness()` + `compile()`; assert blocked (checklist, no body), warnings-only (body + "Recommended before sending", body equals compiler output), and clean (body + "Ready to generate") states.

### Commands

1. `npm test -- packages/web/src/preview/PromptPreviewView.test.tsx`
2. `npm run typecheck && npm run lint`
3. Page-level component test is the correct boundary; cross-page consistency is the SPECREADIATHR-007 capstone.

## Outcome

Completed: 2026-06-08

What changed:

- Updated `PromptPreviewView` to fetch `readiness()` alongside `compile()` and gate preview rendering on `readiness.canPreview`.
- Replaced the blocked raw `ValidationResultView` branch with `ReadinessChecklist`.
- Added warning-only rendering under `Recommended before sending` while keeping `PromptInspector` body content byte-for-byte from `compile().prompt`.
- Added clean-state `Ready to generate.` affordance and readiness action callbacks.
- Updated `PromptPreviewView.test.tsx` for blocked, warning-only, clean, refresh, copy/search/clear, structured-error, and prompt-body isolation behavior.

Deviations from original plan:

- None. Compiler behavior and prompt content remain unchanged.

Verification:

- `npm test -- packages/web/src/preview/PromptPreviewView.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
