# SPEC008PROPREGAT-002: Extract a presentational `ValidationResultView` from `ValidationPanel`

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: None — `packages/web` only; internal component refactor, no API/schema change.
**Deps**: None

## Problem

`ValidationPanel` (`packages/web/src/generation-brief/ValidationPanel.tsx`) self-fetches
`/api/validate` and renders the blocker/warning list inline. SPEC-008's preview surface
already receives a `ValidationResult` inside the `validation-blocked` compile body, so it
must render the same blocker/warning UI **without** a second `/api/validate` round-trip.
Per SPEC-008 Risk R-1, the clean path is to extract the presentational blocker/warning
rendering into a component that accepts a `ValidationResult` prop, reused by both surfaces.
This ticket does the extraction as an isolated, behavior-preserving refactor.

## Assumption Reassessment (2026-06-05)

1. Current shape verified: `ValidationPanel` (`ValidationPanel.tsx:17`) holds three
   states (`loading` / `ready` / `error`, lines 12-15), fetches via `validate()` in a
   `useEffect` keyed on `validationKey` (lines 21-40), and in the `ready` state renders the
   status line + `Blockers (n)` + collapsible `Warnings (n)` using the internal
   `DiagnosticList` (lines 75-132) with `activateDiagnostic` (navigate-to-record via
   `useNavigate`, else `onFocusField`). **Change rationale (§20, no silent retcon):** this
   modifies `ValidationPanel.tsx` solely to delegate its ready-state rendering to the new
   component; the fetch + loading/error behavior and the rendered DOM stay identical so
   `GenerationBriefView`'s usage is unchanged.
2. Consumer verified: `ValidationPanel` is consumed by
   `packages/web/src/generation-brief/GenerationBriefView.tsx` (the only importer); its
   contract is the `{ validationKey, onFocusField? }` props. Those props and behavior are
   preserved by this ticket. `Diagnostic` / `ValidationResult` are imported as types from
   `@loom/core` (`ValidationPanel.tsx:1`).
3. Shared boundary under audit: the blocker/warning *presentation* contract. The new
   `ValidationResultView` takes `{ result: ValidationResult; onFocusField?: (field: string)
   => void }` and owns the status/blockers/warnings markup (incl. `DiagnosticList` and the
   navigate/focus activation). `ValidationPanel` becomes a thin fetch wrapper that renders
   `<ValidationResultView result={...} onFocusField={...} />` in its ready state.
   `PromptPreviewView` (SPEC008PROPREGAT-003) will render the same component from the
   compile body's `ValidationResult` — no `/api/validate` call.

## Architecture Check

1. Separating "fetch + state machine" (`ValidationPanel`) from "render a result"
   (`ValidationResultView`) is the standard container/presentational split and is the only
   change that lets two data sources (the `/api/validate` fetch and the compile body) share
   one renderer without duplicating markup or forcing a redundant fetch on the preview
   surface. Keeping `ValidationPanel`'s public props identical avoids touching
   `GenerationBriefView`.
2. No backwards-compatibility aliasing/shims: `ValidationPanel` is not aliased or kept in
   two forms; the rendering simply moves into the new component and is imported back.

## Verification Layers

1. `ValidationResultView` renders status + blockers + collapsible warnings from a
   `ValidationResult` prop → unit test (`ValidationResultView.test.tsx`).
2. `ValidationResultView` performs no data fetch → grep-proof (`grep -n "validate" packages/web/src/generation-brief/ValidationResultView.tsx` returns no `validate()` call/import).
3. `ValidationPanel` behavior in `GenerationBriefView` is unchanged → existing `ValidationPanel.test.tsx` passes (adjust only selectors that move, preserving asserted text/roles).

## What to Change

### 1. New `ValidationResultView.tsx` (presentational)

- Create `packages/web/src/generation-brief/ValidationResultView.tsx` exporting
  `ValidationResultView({ result, onFocusField }: { result: ValidationResult; onFocusField?: (field: string) => void })`.
- Move the status line, `Blockers (n)` section, collapsible `Warnings (n)` section,
  `DiagnosticList`, and `activateDiagnostic` (using `useNavigate` + `onFocusField`) into it.
  Preserve the exact markup, headings, roles, and class names from the current
  `ValidationPanel` ready state so existing assertions still match.

### 2. Slim `ValidationPanel.tsx` down to a fetch wrapper

- Keep `validate()` fetch, `validationKey` effect, and loading/error states.
- In the ready state render `<ValidationResultView result={state.result} onFocusField={onFocusField} />`
  inside the same wrapping `<section className="configPanel validationPanel">` + heading,
  so the outer DOM is unchanged.

### 3. Tests

- Add `ValidationResultView.test.tsx`: render with a fabricated `ValidationResult`
  (blockers + warnings) and assert the blocker codes/messages and warning toggle render.
- Update `ValidationPanel.test.tsx` only where a moved selector requires it; the goal is
  zero assertion changes (markup-preserving).

## Files to Touch

- `packages/web/src/generation-brief/ValidationResultView.tsx` (new)
- `packages/web/src/generation-brief/ValidationResultView.test.tsx` (new)
- `packages/web/src/generation-brief/ValidationPanel.tsx` (modify)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (modify — only if a moved selector requires it)

## Out of Scope

- The `PromptPreviewView` surface and its consumption of this component (SPEC008PROPREGAT-003).
- Any change to `/api/validate`, the `ValidationResult` shape, or `GenerationBriefView`.
- Adding new validation logic — this is presentation-only extraction.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/generation-brief/ValidationResultView.test.tsx` — new component renders blockers/warnings from a prop.
2. `npm test -- packages/web/src/generation-brief/ValidationPanel.test.tsx` — existing panel behavior unchanged.
3. `npm run typecheck && npm test` — full suite green.

### Invariants

1. `ValidationResultView` is pure-presentational: it issues no network request (the only
   data it shows comes from its `result` prop).
2. `ValidationPanel`'s public props (`validationKey`, `onFocusField`) and rendered DOM are
   unchanged — `GenerationBriefView` needs no edit.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/ValidationResultView.test.tsx` — proves prop-driven rendering and no-fetch behavior.
2. `packages/web/src/generation-brief/ValidationPanel.test.tsx` — guards behavior preservation after the extraction.

### Commands

1. `npm test -- packages/web/src/generation-brief/ValidationResultView.test.tsx packages/web/src/generation-brief/ValidationPanel.test.tsx`
2. `npm run typecheck && npm test`
3. The two-file `vitest run` is the correct boundary: it exercises both the new renderer and the preserved container in one pass.
