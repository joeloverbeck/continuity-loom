# SPEC030RECHYGWOR-004: Web scope selector, disclosure, and API client

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds a scope selector + scope disclosure to `RecordHygieneView`; widens the `recordHygieneCompile`/`recordHygieneAnalyze` API client to pass the selected mode; refines the quarantine conformance test. No server or compiler change.
**Deps**: `archive/tickets/SPEC030RECHYGWOR-003.md`

## Problem

With the server honoring both modes (-003), the author needs a UI to choose the scope, and the page must disclose the active scope (the reworded §29.3 requires disclosure in the inspection UI). The Record Hygiene page currently hardcodes the whole-project mode and discloses a fixed "Full active atomic story-record review" source. This ticket adds an explicit scope control, scope-aware disclosure with in-scope counts, a distinct empty-scope message, and threads the mode through the API client — while preserving the §26.1 quarantine: the page reads working-set membership but never mutates it and grows no write/apply controls.

## Assumption Reassessment (2026-06-22)

1. Current web surfaces confirmed this session: `packages/web/src/record-hygiene/RecordHygieneView.tsx` renders the Source Disclosure at `:128-129` (fixed copy), the OpenRouter Send panel at `:153-164` (send `disabled` only by `!sendConfirmed || scratchState.status === "sending"`), and recompiles via `refreshPrompt()`; `api.ts` `recordHygieneCompile`/`recordHygieneAnalyze` (`:562-571`) currently hardcode `{ mode: "full_active_atomic_review" }` in the POST body.
2. Specs/docs confirmed: Deliverable 4 (`specs/SPEC-030-record-hygiene-working-set-scope.md:297-308`), the reassess I1 quarantine-test refinement, and reassess Q1=(a) — empty working-set scope shows a distinct empty-scope message but leaves send behavior identical to the existing empty-project case (no scope-specific send-disable).
3. Cross-artifact boundary under audit: the page↔server contract is the request `mode` and the compile/analyze response metadata. The `mode` union type is owned by `@loom/core` (-002); `api.ts` must send a value of that union. The disclosure counts come from `compileState.metadata` (already rendered at `RecordHygieneView.tsx:133-136`).
4. FOUNDATIONS principle restated: §26.1 assistance-output quarantine — assistance is opt-in, pull-based, non-canonical, and the page must not mutate continuity surfaces. The scope selector READS working-set membership (to choose a scope) but performs no write; it adds no apply/merge/delete/archive/status/working-set-mutation control. §29.3 (reworded) requires the active scope be disclosed in the inspection UI.
5. Deterministic-compilation / secret-firewall enforcement surface under audit: the page does not compile — the server recompiles from project state and never trusts a client prompt. Confirm the scope selector changes only the request `mode` it sends; it introduces no client-side record selection, no working-set write, and no path for a secret to reach a surface the records forbid (SECRET handling is server-side and unchanged). The existing quarantine assertion (`RecordHygieneView.test.tsx:85`, `queryByRole("button", { name: /working set/i })`) must be refined to forbid working-set *mutation* controls while permitting the read-only scope selector (a radio, role `radio`, not `button`).
6. Existing output schema extended: none — the response shape is unchanged; only the request gains the already-defined `mode` value. No new web-owned type.

## Architecture Check

1. A radio scope control that recompiles on change reuses the existing `refreshPrompt()`/`recordHygieneCompile` path and the existing `compileState.metadata` counts — cleaner than a second compile endpoint or client-side scoping (which would violate "server recompiles from project state"). The read-only selector keeps the page within the §26.1 quarantine.
2. No backwards-compatibility aliasing/shims: `recordHygieneCompile`/`recordHygieneAnalyze` gain a `mode` parameter (defaulting to whole-project to preserve current call sites is acceptable as a real default, not a shim); the quarantine test is refined in place, not duplicated.

## Verification Layers

1. Scope control defaults to whole-project; switching to working set recompiles → web component test (Testing Library, `RecordHygieneView.test.tsx`).
2. Disclosure names the active scope, shows in-scope counts, and explains working-set exclusion ("excluded by your scope choice, not by archive or status") → web component test (DOM text assertions).
3. Empty working-set scope shows a distinct empty-scope message and leaves send behavior identical to the empty-project case (no scope-specific disable) → web component test.
4. No apply/merge/delete/archive/status/working-set-**mutation** control in DOM or handlers; the read-only scope selector is the only working-set-referencing control → web component test (refined quarantine block) + manual handler review.

## What to Change

### 1. Scope selector + disclosure (`RecordHygieneView.tsx`)

Add an explicit scope control (radio: "Whole project" (default) / "Active working set") that recompiles on change by passing the selected mode to `recordHygieneCompile`. Update the Source Disclosure copy (`:129`) to name the active scope and show in-scope counts; in working-set mode add the note that "records you have not added to the active working set are excluded by your scope choice (not by archive or status)." When working-set mode yields zero in-scope records, show a distinct empty-scope message ("nothing in your current scope to review," distinct from "no hygiene-active records exist in the project"); leave the Send panel's existing enablement unchanged (no scope-specific send-disable).

### 2. API client (`api.ts`)

Give `recordHygieneCompile`/`recordHygieneAnalyze` (`:562-571`) a `mode` parameter and pass it in the POST body. No new write controls; no working-set mutation from this page.

### 3. Refine the quarantine conformance test (`RecordHygieneView.test.tsx`)

Refine the assertion at `:85` so it forbids working-set *mutation* controls (a button/action that edits working-set membership) while permitting the read-only scope selector; keep asserting absence of apply/merge/delete/archive/status/use-as-prose/accept/fix-all controls (`:81-89`).

### 4. Scope-selector styling (co-located)

Add any minimal styling for the scope radio to `packages/web/src/styles.css` (co-located supporting asset; keep it consistent with existing `RecordHygieneView` panel styles).

## Files to Touch

- `packages/web/src/record-hygiene/RecordHygieneView.tsx` (modify)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/record-hygiene/RecordHygieneView.test.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Server scope selection / route plumbing (`archive/tickets/SPEC030RECHYGWOR-003.md`) and the core mode/compiler (`archive/tickets/SPEC030RECHYGWOR-002.md`).
- Persisting a scope preference beyond the current view state (keepers remain sessionStorage-only; no new persistence).
- Any working-set mutation, record-write, apply/merge/archive control on this page.
- Docs (SPEC030RECHYGWOR-005) and capstone regression (SPEC030RECHYGWOR-006).

## Acceptance Criteria

### Tests That Must Pass

1. `RecordHygieneView.test.tsx`: the scope control defaults to whole-project; selecting "Active working set" triggers a recompile with that mode; the disclosure names the active scope, shows in-scope counts, and (working-set mode) explains the scope-choice exclusion.
2. `RecordHygieneView.test.tsx`: empty working-set scope renders the distinct empty-scope message; the Send panel enablement matches the existing empty-project behavior (no scope-specific disable); the refined quarantine block confirms no working-set-mutation control while the read-only scope selector is present.
3. `npm test && npm run typecheck && npm run lint` green.

### Invariants

1. The page sends only a request `mode`; it never compiles a prompt, never selects records client-side, and never writes the working set.
2. The active scope is disclosed in the inspection UI for both modes (§29.3 disclosure requirement).

## Test Plan

### New/Modified Tests

1. `packages/web/src/record-hygiene/RecordHygieneView.test.tsx` — scope-default + switch-recompiles + disclosure-text + empty-scope-message cases; refined quarantine assertion.

### Commands

1. `npm test -- RecordHygieneView` (targeted web component test).
2. `npm test && npm run typecheck && npm run lint` (full web + cross-package; the mode value is core-owned, so typecheck spans packages).
3. The component-scoped test is the correct targeted boundary because the change is confined to the Record Hygiene view + its API client; server behavior is proved by -003 and end-to-end by -006.
