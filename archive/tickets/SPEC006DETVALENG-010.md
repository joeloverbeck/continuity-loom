# SPEC006DETVALENG-010: Web validation panel + typed `api.ts` wrapper

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `packages/web/src/generation-brief/ValidationPanel.tsx`; modifies `packages/web/src/api.ts`, `packages/web/src/generation-brief/GenerationBriefView.tsx`, and `packages/web/src/records/RecordBrowser.tsx` (deep-link target).
**Deps**: SPEC006DETVALENG-009

## Problem

Deliverable 3: the validation panel surfaced in the SPEC-005 generation-brief workflow, calling `POST /api/validate` via a typed wrapper. It summarizes blockers and warnings separately (blockers prominent; warnings collapsible/quieter), renders each diagnostic's `code`/`message`/`whyItMatters`/`suggestedActions`, navigates to the affected record or field when an `affected` ref is present, re-runs validation deterministically when inputs change, and presents the result as the authoritative readiness signal — with no "validate anyway", no override, no hidden bypass. It gates no preview/send (neither exists yet).

## Assumption Reassessment (2026-06-05)

1. `packages/web/src/api.ts` is the central typed wrapper module (holds `getStoryConfig`/`getWorkingSet`/`getGenerationBrief`/`listRecords`, etc.); there is no existing `validate` function. The brief view is `packages/web/src/generation-brief/GenerationBriefView.tsx`, mounted at `/generation-brief` in `packages/web/src/shell/AppShell.tsx` (react-router `Routes`/`Route`). Records live at `/records` (`RecordBrowser`); navigation uses `react-router-dom` (`NavLink`; `useNavigate` available). There is no `/records/:id` route — record diagnostics deep-link to `/records` with the target record preselected.
2. Binding source: SPEC-006 §"`@loom/web` — validation panel in the generation workflow" + §Deliverables 3 + `VALIDATION-ENGINE.md` "User-facing behavior" / "Prompt/send gating". The `ValidationResult`/`Diagnostic` shape comes from `@loom/core` (ticket 001); the endpoint comes from ticket 009.
3. Cross-artifact boundary under audit: the `/api/validate` request/response contract (ticket 009) and the `ValidationResult` type (ticket 001) the panel renders; plus the navigation contract between a diagnostic's `affected` ref (`{ recordId?, field? }`) and the records/brief surfaces it links to.
4. FOUNDATIONS §4.5/§11/§29.5 (fail closed; no v1 override) restated: the panel exposes no "validate anyway"/override/bypass control; it states plainly when generation is blocked. Domain validation already enforces blocking server-side (ticket 009) — the UI reflects state and must not be the sole gate.
5. Fail-closed surface named: the panel is a read-only readiness signal. It triggers re-validation on input change (brief edit, working-set change, record edit) by re-calling `/api/validate`; it never sets or clears validation state locally and never bypasses a blocker. No secret value is rendered — the security blocker (ticket 008) already names the field without the key, so the panel renders only `affected.field`.
6. Mismatch + correction: the typed wrapper is added to the **existing** `packages/web/src/api.ts` (not a new `api.ts`), per the post-reassessment spec text; `packages/web/src/api.test.tsx` is the existing api test to extend.

## Architecture Check

1. Mounting the panel inside `GenerationBriefView` (the launch surface) and reusing `react-router` `useNavigate` for deep-links keeps the panel co-located with the brief workflow and avoids a parallel navigation mechanism. Separating blockers/warnings into distinct render groups with a collapsible warnings region matches `VALIDATION-ENGINE.md` "User-facing behavior" directly.
2. No backwards-compatibility aliasing/shims: the `validate` wrapper is a new function in the existing api module; no alias of an old endpoint.

## Verification Layers

1. Blockers and warnings render in separate groups -> component test (Testing Library) asserting distinct group regions.
2. A blocker disables/hides any "ready to generate" affordance the panel owns; no override control exists -> component test (negative: query for an override/"validate anyway" control returns nothing).
3. Clicking a field-linked diagnostic triggers navigation -> component test asserting `useNavigate`/router target for a diagnostic with an `affected` ref.
4. Warning-only state shows warnings but reports "not blocked" -> component test.
5. Re-run on input change calls `/api/validate` deterministically -> component test with a mocked `validate` wrapper asserting re-invocation on input change.
6. Typed wrapper contract -> `packages/web/src/api.test.tsx` asserting `validate()` shape against the `ValidationResult` type.

## What to Change

### 1. Typed wrapper

`packages/web/src/api.ts` (modify) — add `export async function validate(): Promise<ValidationResult>` posting to `/api/validate`, typed against the `@loom/core` `ValidationResult`.

### 2. Validation panel

`packages/web/src/generation-brief/ValidationPanel.tsx` (new) — renders blockers (prominent) and warnings (collapsible/quiet) in separate groups; per-diagnostic `code`/`message`/`whyItMatters`/`suggestedActions`; click-to-navigate (record diagnostics → `/records` preselecting `affected.recordId`; brief-field diagnostics → focus the field in the brief view); deterministic re-run on input change; a plain "generation is blocked" readiness statement; no override control.

### 3. Mount + deep-link wiring

`packages/web/src/generation-brief/GenerationBriefView.tsx` (modify) — mount `ValidationPanel` and trigger re-validation on brief/working-set/record edits. `packages/web/src/records/RecordBrowser.tsx` (modify) — accept a preselected record target (router state/query) so a diagnostic deep-link opens the affected record.

## Files to Touch

- `packages/web/src/generation-brief/ValidationPanel.tsx` (new)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/records/RecordBrowser.tsx` (modify)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (new)
- `packages/web/src/api.test.tsx` (modify)

## Out of Scope

- Engine rule logic and the server endpoint — tickets 001–009.
- Prompt preview / send affordances and any gate consuming `isBlocked` — Phases 8–9 (the panel gates no preview/send; neither exists).
- Deterministic focus-tag *suggestion* panels ("you selected two speakers; add `dialogue_expected`?") — SPEC-006 §Out of Scope (deferrable polish; see Step 6 deferred follow-ups).

## Acceptance Criteria

### Tests That Must Pass

1. Blockers and warnings render in separate groups; warnings are collapsible.
2. A field-linked diagnostic navigates to the affected record (`/records` preselected) or focuses the affected brief field.
3. Warning-only state shows warnings and reports "not blocked"; a blocked state reports "blocked".
4. No override / "validate anyway" control exists in the panel (negative assertion).
5. Editing an input re-invokes the `validate` wrapper.
6. `npm test -- ValidationPanel` and `npm test -- api` pass; `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The panel exposes no override/bypass; it reflects server validation state and never authorizes generation locally.
2. No secret value is rendered — only `affected.field`/`recordId` are shown.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/ValidationPanel.test.tsx` — group separation, navigation, no-override, blocked/not-blocked, re-run-on-change.
2. `packages/web/src/api.test.tsx` (modify) — `validate()` wrapper request/response typing.

### Commands

1. `npm test -- ValidationPanel`
2. `npm test -- api`
3. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the web validation panel and typed API wrapper:

- Added `validate()` to `packages/web/src/api.ts` for `POST /api/validate`.
- Added `packages/web/src/generation-brief/ValidationPanel.tsx` rendering blockers and warnings separately, with warnings collapsible and no override/bypass control.
- Mounted the panel in `GenerationBriefView`, revalidating on load, edit, and save; field diagnostics focus matching brief inputs.
- Added record diagnostic navigation to `/records?recordId=...` and updated `RecordBrowser` to preselect that target.
- Added `ValidationPanel` tests and extended API/brief/record tests for the new routing and validation behavior.

Deviation from original plan: field focus is implemented through named brief inputs for currently rendered fields; record diagnostics deep-link through a query parameter because there is no record detail route yet.

Verification:

- `npm test -- ValidationPanel` — passed.
- `npm test -- api` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
