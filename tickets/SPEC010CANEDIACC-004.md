# SPEC010CANEDIACC-004: Extract shared compiled-prompt inspector

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new shared web component `packages/web/src/prompt/PromptInspector.tsx`; `PromptPreviewView` refactored to consume it
**Deps**: None

## Problem

SPEC-010 requires the compiled prompt to be inspectable **before Send on the `/generate`
surface** (FOUNDATIONS §22), not only on `/preview`. Today the compiled-prompt display lives
inline in `PromptPreviewView` (`packages/web/src/preview/PromptPreviewView.tsx:208`, the
`<pre className="promptBody">` and its highlight logic). To reuse it on `/generate` without
duplicating it, factor the compiled-prompt inspector into a shared presentational component.
This is a **pure refactor** — `/preview` behavior is unchanged — that unblocks the new surface.

## Assumption Reassessment (2026-06-06)

1. `PromptPreviewView.tsx` renders the compiled prompt at `:208` (`<pre className="promptBody" data-testid="prompt-body">{highlightedPrompt}</pre>`) inside its layout component (`PromptPreviewLayout`, `:159` onward), driven by compile/validation state fetched in the view. The candidate panel (`:240-249`) and Generate button (`:189`) are separate concerns relocated in SPEC010CANEDIACC-005, not here.
2. Web feature dirs are co-located by surface (`packages/web/src/{preview,records,working-set,generation-brief,config,shell}`); there is no shared/presentational dir yet. A new `packages/web/src/prompt/` dir is the neutral home for a cross-surface component (confirmed absent at decomposition).
3. Shared boundary under audit: the extracted `PromptInspector` is the single rendering of the validation-gated compiled prompt consumed by both `/preview` (this ticket) and `/generate` (SPEC010CANEDIACC-005). Its props are the contract; both consumers must pass the same compiled-prompt/validation inputs so "what you inspect is what you send" holds (SPEC-010 §Risks).
4. FOUNDATIONS §22 motivates this: the prompt must be inspectable before sending and must not become a permanent archive — the inspector renders session state only; it persists nothing and logs nothing.
5. Determinism/secret surface (§8/§22): the inspector is presentational over already-compiled output; it performs no record selection, no LLM call, and renders no secret (the compiled prompt already excludes keys). The refactor moves rendering only — no change to what is compiled.

## Architecture Check

1. A presentational `PromptInspector` (props in, no data fetching) is reusable by any surface and trivially testable in isolation, versus duplicating the highlight + `<pre>` block on `/generate` (which would drift from `/preview`).
2. Keeping the component presentational (caller owns compile/validation fetching) avoids two surfaces racing two independent fetches of the same compile — the boundary stays "render the prompt I give you".
3. No backwards-compatibility shims: `PromptPreviewView` is rewired to import the extracted component; the inline block is removed, not left aliased.

## Verification Layers

1. `/preview` behavior unchanged → existing `PromptPreviewView.test.tsx` prompt-inspection assertions (e.g. `data-testid="prompt-body"`) still pass unmodified.
2. Component renders compiled prompt in isolation → new `PromptInspector.test.tsx` renders the component with fixture props and asserts the highlighted prompt body.
3. Single rendering source → grep-proof that the `promptBody` `<pre>` exists only in `PromptInspector.tsx` after the refactor, not inline in `PromptPreviewView.tsx`.

## What to Change

### 1. Extract PromptInspector

Create `packages/web/src/prompt/PromptInspector.tsx` exporting a presentational `PromptInspector` that takes the compiled-prompt text (and whatever highlight inputs `PromptPreviewView` currently computes for `highlightedPrompt`) as props and renders the `<pre className="promptBody" data-testid="prompt-body">` block. Move the highlight helper alongside it if it is local to the view.

### 2. Rewire PromptPreviewView

In `packages/web/src/preview/PromptPreviewView.tsx`, replace the inline compiled-prompt `<pre>` (and its local highlight logic) with `<PromptInspector ... />`, passing the same data it computes today. No change to the view's compile/validation fetching, the Generate button, or the candidate panel (those relocate in -005).

### 3. Tests

Create `packages/web/src/prompt/PromptInspector.test.tsx`. Leave `PromptPreviewView.test.tsx` assertions intact — they are the regression guard that the refactor is behavior-preserving.

## Files to Touch

- `packages/web/src/prompt/PromptInspector.tsx` (new)
- `packages/web/src/prompt/PromptInspector.test.tsx` (new)
- `packages/web/src/preview/PromptPreviewView.tsx` (modify)

## Out of Scope

- Nav promotion, the `/generate` route, and relocating the Generate button / candidate panel — SPEC010CANEDIACC-005.
- Any candidate editing/lifecycle behavior — SPEC010CANEDIACC-006.
- Changing what is compiled or how validation gates it — rendering only.
- Server/api changes.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- PromptInspector` — the component renders the compiled prompt body from fixture props.
2. `npm test -- PromptPreviewView` — all existing `/preview` prompt-inspection assertions pass unchanged (behavior-preserving refactor).
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The compiled-prompt `<pre className="promptBody">` is rendered from exactly one component (`PromptInspector`) after the refactor.
2. The inspector persists nothing and logs nothing; it is presentational over already-compiled session state (§22).

## Test Plan

### New/Modified Tests

1. `packages/web/src/prompt/PromptInspector.test.tsx` — isolated render of the inspector.
2. `packages/web/src/preview/PromptPreviewView.tsx` rewiring is covered by the existing `PromptPreviewView.test.tsx` (unmodified) as the regression guard.

### Commands

1. `npm test -- PromptInspector PromptPreviewView`
2. `npm run typecheck && npm run lint && npm test && npm run build`
