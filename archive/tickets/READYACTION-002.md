# READYACTION-002: Make readiness "Edit X" actions move the viewport to the field

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` only: `GenerationBriefView.tsx` (focus helper + mount param), `preview/PromptPreviewView.tsx`, `generate/GenerateView.tsx`
**Deps**: READYACTION-001 (the new current-state inputs and the section `data-field` anchor are the focus targets this ticket scrolls to). This ticket's generic focus/scroll/cross-page logic is independent and can be reviewed separately; the end-to-end "Edit current state" experience needs both.

## Problem

Readiness "Edit X" buttons are supposed to take the author to the field that needs fixing, but they do not move the page view — a codebase-wide problem across every page that renders the readiness checklist:

- **On the Generation Brief**, `focusBriefField` (`packages/web/src/generation-brief/GenerationBriefView.tsx:231-237`) does `querySelector('[name="…"], [data-field="…"]')` then `.focus()` with **no `scrollIntoView`**, so a field below the fold is never brought into view. Worse, the current-state blocker's action target is the **parent** path `generationSession.current_authoritative_state` (`packages/core/src/validation/readiness.ts:330` derives the action `target` from the affected field path), which matches **no** input element, so `.focus()` is a no-op. Verified live: clicking "Edit current state" leaves `document.activeElement === BODY`.
- **From Prompt Preview and Generate**, the field action is discarded entirely — `onFocusField` ignores its argument and just `navigate("/generation-brief")` (`packages/web/src/preview/PromptPreviewView.tsx:85-99`, `packages/web/src/generate/GenerateView.tsx:129-143`), landing the author at the top of the Brief with no scroll or focus.

By contrast record actions work, because `RecordBrowser` honors a `?recordId=` URL param and auto-selects (`packages/web/src/records/RecordBrowser.tsx:221-233`). The Brief has no equivalent field-targeting mechanism. This breaks the FOUNDATIONS guarantee that readiness diagnostics are author-actionable (`docs/FOUNDATIONS.md:387`).

## Assumption Reassessment (2026-06-08)

1. `focusBriefField` (`packages/web/src/generation-brief/GenerationBriefView.tsx:231-237`) calls `.focus()` only; no scroll. Passed to `ValidationPanel` as `onFocusField` (line 266) → `ReadinessChecklist` `runAction` `focus-field` branch (`packages/web/src/readiness/ReadinessChecklist.tsx:224-230`).
2. Action `target` for a generation-field diagnostic is the affected field path (`packages/core/src/validation/readiness.ts:325-335`); for the current-state blocker that path is the parent `generationSession.current_authoritative_state`, which no `[name]` element matches. Verified by Read + live DOM probe (`hasParentInput === false`, only `…current_time` exists).
3. Cross-page readiness checklist consumers `PromptPreviewView.tsx:85-99` and `GenerateView.tsx:129-143` both define `onFocusField: () => navigate("/generation-brief")`, dropping the field argument. The same `ReadinessChecklist` component drives all three pages (FOUNDATIONS §836 "same readiness model must drive Generation Brief, Prompt Preview, and Generate", `docs/FOUNDATIONS.md:836`).
4. FOUNDATIONS principle: author-actionable diagnostics (`docs/FOUNDATIONS.md:387`). This ticket makes the existing action buttons deliver on that; it adds no new diagnostics and changes no validation behavior.
5. Reference pattern to mirror: `RecordBrowser.tsx:221-233` reads a URL search param (`useSearchParams`) on mount and acts on it. The Brief will read a `field` param the same way.
8. No adjacent contradictions beyond those already ticketed (READYACTION-001 supplies the inputs/anchor that make the current-state target resolvable).

## Architecture Check

1. A single robust `focusBriefField` (scroll + focus, with a parent/section-prefix fallback) plus one URL-param convention reused across the three checklist pages is cleaner than per-page bespoke handlers, and it reuses the existing `RecordBrowser` `?param=` precedent rather than inventing a new mechanism.
2. No backwards-compatibility shims: the cross-page handlers change from "navigate, drop field" to "navigate with field"; no alias retained.

## What to Change

### 1. `focusBriefField` — scroll, focus, and resolve section/parent targets

In `GenerationBriefView.tsx`, change `focusBriefField(field)` to:
- Try the exact element (`[name="…"], [data-field="…"]`); if found, `scrollIntoView({ block: "center" })` then `focus()`.
- If no exact element matches, fall back to a **section** element whose `data-field` equals the target (or is a prefix of it) — e.g. the parent path `generationSession.current_authoritative_state` resolves to the CURRENT AUTHORITATIVE STATE section (anchor added in READYACTION-001) — and `scrollIntoView` to it; focus the first focusable control within it when present.

### 2. Cross-page field targeting via a Brief URL param

- In `PromptPreviewView.tsx` and `GenerateView.tsx`, change `onFocusField` to accept the field and navigate with it: `onFocusField: (field) => navigate(`/generation-brief?field=${encodeURIComponent(field)}`)`.
- In `GenerationBriefView.tsx`, read the `field` search param on mount (`useSearchParams`) and, **after** the brief data has loaded, call `focusBriefField(field)` — mirroring `RecordBrowser.tsx:221-233`. Guard so it runs once per param value and only after the form is rendered.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/preview/PromptPreviewView.tsx` (modify)
- `packages/web/src/generate/GenerateView.tsx` (modify)
- Nearest existing web test for these views (modify/new)

## Out of Scope

- Adding the missing current-state inputs and the section `data-field` anchor — READYACTION-001.
- Record / provider-settings / working-set actions, which already navigate correctly.
- Any change to which diagnostics exist, when they block, or the validation gate.

## Acceptance Criteria

### Tests That Must Pass

1. Clicking "Edit current state" on the Generation Brief scrolls the CURRENT AUTHORITATIVE STATE section into view and moves focus to a control within that section (`document.activeElement` is inside the section), rather than leaving focus on `<body>`.
2. A readiness field action triggered from Prompt Preview / Generate navigates to `/generation-brief?field=<path>`, and on arrival the Brief scrolls/focuses that field.
3. Record, provider-settings, and working-set readiness actions still navigate exactly as before.
4. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. No validation/diagnostic behavior changes; this ticket only affects navigation and focus.
2. The `field` URL param is read-only navigation state — it does not mutate or persist any draft.

## Test Plan

### New/Modified Tests

1. Generation Brief view test — `focusBriefField` scrolls+focuses an exact field and resolves a parent/section target to its section (assert on the focused element / a `scrollIntoView` spy, since jsdom does not perform layout).
2. Preview/Generate view test — `onFocusField` navigates to `/generation-brief?field=<encoded path>`.

### Commands

1. `npm test -w @loom/web`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completion date: 2026-06-08

What changed:
- Updated `GenerationBriefView` field focusing to scroll the resolved target into view and focus the matching control or the first focusable control inside a matched section.
- Added a `field` URL param reader in `GenerationBriefView` so cross-page readiness actions can land on and focus a specific Brief field after data loads.
- Updated Prompt Preview and Generate readiness actions to navigate to `/generation-brief?field=<encoded path>` instead of dropping the target field.
- Added route-level readiness tests for local Brief focus, Prompt Preview to Brief focus, and Generate to Brief focus.

Deviations from original plan:
- Added a local selector escaping fallback because jsdom does not provide `CSS.escape`; browser behavior still uses `CSS.escape` when available.
- The parent current-state action resolves through the exact `data-field` section match and focuses the first control in that section.

Verification results:
- `npm test -w @loom/web -- readiness-cross-page GenerationBriefView PromptPreviewView GenerateView` passed.
- `npm run typecheck -w @loom/web` passed.
- `npm test -w @loom/web -- readiness-cross-page` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed; Vite reported the existing large chunk warning.
