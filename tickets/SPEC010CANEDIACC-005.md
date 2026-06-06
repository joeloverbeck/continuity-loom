# SPEC010CANEDIACC-005: Promote Generate/Candidate route + relocate off /preview

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `/generate` route + `GenerateView`; `AppShell` nav promotion; `/preview` loses the Generate button + candidate panel
**Deps**: SPEC010CANEDIACC-003, SPEC010CANEDIACC-004

## Problem

`"Generate/Candidate"` is a disabled nav placeholder (`packages/web/src/shell/AppShell.tsx:29`,
`laterPhaseSurfaces`) and the SPEC-009 Generate button + read-only candidate panel currently sit on
`/preview` (`PromptPreviewView.tsx:189,240-249`). SPEC-010 makes `/generate` a real primary route
that owns generation, leaving `/preview` inspection-only (FOUNDATIONS §22 distinct surfaces). This
ticket promotes the nav, creates the `/generate` route with the relocated **read-only** generate +
candidate display (built on the shared inspector from -004), strips those controls from `/preview`,
and relocates the existing tests. The editable lifecycle (regenerate/discard/accept) lands in -006.

## Assumption Reassessment (2026-06-06)

1. `AppShell.tsx`: nav links at `:24` (`{ to:"/preview", label:"Validation / Prompt Preview" }`); `laterPhaseSurfaces = ["Generate/Candidate", "Accepted Segments"]` at `:29` rendered as `disabled` buttons at `:79-80`; routes at `:92` (`/preview` only). There is currently **no** `AppShell.test.tsx` (confirmed absent) — the nav test is new.
2. The generate state machine to relocate is in `PromptPreviewView.tsx:22-89` (`GenerateState`, `generateCandidate`, `onGenerate`/`onClearCandidate`) plus the Generate button (`:189`) and candidate panel (`:240-249`, `candidateBody`). The four `/preview` generate/candidate tests are `PromptPreviewView.test.tsx:112,134,151,168` (read-only draft candidate, two generate-error cases, validation-blocked deferral) — per SPEC-010 reassessment finding M1.
3. Shared boundary under audit: `GenerateView` consumes `PromptInspector` (SPEC010CANEDIACC-004) so the prompt is inspectable before Send on `/generate` (§22), and `generate()` whose `GenerateResponse` metadata was widened in SPEC010CANEDIACC-003 — the relocated `candidateMetadata()` mock must construct the widened shape.
4. FOUNDATIONS §22 motivates this: the five continuity surfaces stay distinct — `/generate` owns generation+candidate, `/preview` is inspection-only; neither persists prompt/candidate beyond session state.
5. Inspectable-before-send surface (§22): `GenerateView` must render `PromptInspector` over the **same** validation-gated compile the Send uses, so a user never sends something they could not inspect (SPEC-010 §Risks). This ticket wires the read-only path; -006 adds Send-driven lifecycle.
6. Schema/type coherence: relocating the candidate display moves `candidateMetadata()` (`PromptPreviewView.test.tsx:225`) into the new `/generate` test; because -003 widened `GenerateResponse.metadata` to `GenerationMetadata`, the moved mock is updated to include `provider`/`temperature`/`maxOutputTokens` (+`topP?`). Additive — no consumer asserts the old narrow shape after the move.

## Architecture Check

1. A dedicated `GenerateView` route cleanly separates the generation surface from the inspection surface, matching the requirements' distinct nav model, rather than overloading `/preview` with both roles.
2. Reusing `PromptInspector` (-004) keeps a single compiled-prompt rendering across both surfaces — no duplication, no drift.
3. No backwards-compatibility shims: the Generate button + candidate panel are **moved**, not duplicated; `/preview` retains no hidden generate affordance and the disabled `"Generate/Candidate"` placeholder is replaced by a real link (the placeholder array shrinks to `["Accepted Segments"]`).

## Verification Layers

1. Nav surface separation → new `AppShell.test.tsx` asserts an **enabled** `Generate / Candidate` link/route and a still-**disabled** `Accepted Segments`.
2. `/preview` is inspection-only → updated `PromptPreviewView.test.tsx` asserts no Generate button and no candidate panel render on `/preview`; the prompt inspector still renders.
3. `/generate` shows inspector + read-only candidate → relocated tests in `GenerateView.test.tsx` assert the prompt is inspectable and a successful `generate()` yields the read-only draft candidate (the four moved cases).
4. Type coherence → `npm run typecheck` with the widened `candidateMetadata()` mock.

## What to Change

### 1. Promote nav + route in AppShell

In `packages/web/src/shell/AppShell.tsx`: add a real nav link `{ to:"/generate", label:"Generate / Candidate" }`; remove `"Generate/Candidate"` from `laterPhaseSurfaces` (leaving `["Accepted Segments"]` disabled); add `<Route path="/generate" element={<GenerateView />} />`.

### 2. New GenerateView (read-only relocation)

Create `packages/web/src/generate/GenerateView.tsx` hosting: the shared `PromptInspector` (inspect-before-send), the **Send/Generate** button, the sending status, the read-only candidate display (`candidateBody`), and the error branch — i.e. the SPEC-009 behavior moved verbatim from `PromptPreviewView`, including the `GenerateState`/`generateCandidate` logic (`PromptPreviewView.tsx:22-89`). The candidate stays read-only here; editing/regenerate/discard/accept arrive in -006.

### 3. Strip generate/candidate from PromptPreviewView

Remove the Generate button (`:189`), candidate panel (`:240-249`), and the generate state machine from `PromptPreviewView.tsx`; keep the compile/validation inspection (via `PromptInspector`).

### 4. Relocate + add tests

Move the four generate/candidate cases (`PromptPreviewView.test.tsx:112-182`) and `candidateMetadata()` into `packages/web/src/generate/GenerateView.test.tsx`, updating the mock to the widened `GenerationMetadata`. Update `PromptPreviewView.test.tsx` to assert `/preview` no longer offers Generate/candidate. Create `packages/web/src/shell/AppShell.test.tsx` for the nav assertions. Add any minimal `/generate` layout CSS to `styles.css`.

## Files to Touch

- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/shell/AppShell.test.tsx` (new)
- `packages/web/src/generate/GenerateView.tsx` (new)
- `packages/web/src/generate/GenerateView.test.tsx` (new)
- `packages/web/src/preview/PromptPreviewView.tsx` (modify)
- `packages/web/src/preview/PromptPreviewView.test.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Editable candidate, Regenerate/Discard/Accept, post-accept notice — SPEC010CANEDIACC-006.
- Wiring `acceptCandidate()` — consumed in -006 (this ticket relocates the read-only path only).
- Enabling `Accepted Segments` (Phase 11) — stays disabled.
- Server/api changes.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- AppShell` — nav exposes an enabled `Generate / Candidate` route and a still-disabled `Accepted Segments`.
2. `npm test -- GenerateView PromptPreviewView` — `/generate` renders the inspector + a read-only draft candidate on success (relocated cases); `/preview` offers no Generate button and no candidate panel but still renders the prompt inspector.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The Generate button and candidate panel render on `/generate` only; `/preview` is inspection-only (surfaces stay distinct, §22).
2. The compiled-prompt inspector on `/generate` reflects the same validation-gated compile the Send uses (inspect-before-send, §22).

## Test Plan

### New/Modified Tests

1. `packages/web/src/generate/GenerateView.test.tsx` — relocated generate/candidate cases with the widened metadata mock.
2. `packages/web/src/shell/AppShell.test.tsx` — nav enabled/disabled assertions.
3. `packages/web/src/preview/PromptPreviewView.test.tsx` — assert inspection-only `/preview`.

### Commands

1. `npm test -- AppShell GenerateView PromptPreviewView`
2. `npm run typecheck && npm run lint && npm test && npm run build`
