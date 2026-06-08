# SPECREADIATHR-004: Generation Brief page readiness wiring

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — modify `packages/web/src/generation-brief/ValidationPanel.tsx` to consume `/api/readiness` and render `ReadinessChecklist`, and `GenerationBriefView.tsx` to feed it unsaved-draft state; no change to draft-save semantics.
**Deps**: SPECREADIATHR-003

## Problem

The Generation Brief page hosts the readiness surface through `ValidationPanel`, which currently fetches `/api/validate` and renders the raw-code `ValidationResultView`. Per the spec's §Generation Brief page, it must render the shared readiness checklist while keeping draft save independent of readiness. The save-status line, the stale-readiness notice, and field focus already exist; this ticket swaps the readiness host onto the new model and component.

## Assumption Reassessment (2026-06-07)

1. `GenerationBriefView.tsx` already carries `hasUnsavedChanges` state (`packages/web/src/generation-brief/GenerationBriefView.tsx:68`), the save-status line (`:221`, `role="status"`), the stale-readiness notice (`:235`–`236`, "Displayed readiness may be stale until you save this draft."), `validationKey` (`:69`), and renders `<ValidationPanel validationKey onFocusField={focusBriefField} />` (`:240`). Draft save is already independent of readiness (landed via `archive/specs/SPEC-generation-brief-draftability-and-save-model.md`). This ticket does NOT re-implement save independence — it migrates the readiness host.
2. `ValidationPanel.tsx` currently imports `validate` from `../api.js` and renders `ValidationResultView` (`packages/web/src/generation-brief/ValidationPanel.tsx:4`–`5`). The spec's §Generation Brief page required-UX items (header, draft status line, checklist, save-available-with-blockers, refresh, field-focus, defaulted-fields labelled) are mostly already present; the new piece is the readiness checklist + `/api/readiness` data source.
3. Cross-artifact boundary under audit: `ValidationPanel`'s data source switches from `/api/validate` (`ValidationResult`) to `/api/readiness` (`GenerationReadiness`, SPECREADIATHR-002), and its render switches from `ValidationResultView` to `ReadinessChecklist` (SPECREADIATHR-003). `onFocusField` is already wired to `focusBriefField`.
4. §20 no silent retcon: switching `ValidationPanel`'s data source is a deliberate behavior change — rationale: the page must present the shared readiness model, not raw validation codes (spec Executive decision). The save button must remain ungated by readiness after the migration (§11 / `canSaveDraft` always true).

## Architecture Check

1. Reusing the existing `ValidationPanel` host (rather than adding a parallel readiness panel) keeps one readiness surface on the page and lets the swap be a contained diff: data source + render component + action callbacks. The save path is untouched, preserving the draft/readiness separation.
2. No backwards-compatibility shims: `validate()` usage in this panel is replaced, not kept alongside `readiness()`.

## Verification Layers

1. `ValidationPanel` fetches `/api/readiness` and renders `ReadinessChecklist` -> `ValidationPanel.test.tsx` mocking `readiness()` and asserting the checklist renders (no `ValidationResultView`).
2. Save remains enabled while blockers exist -> `GenerationBriefView.test.tsx` asserting the save button is not disabled by a blocked readiness result.
3. Unsaved changes surface the stale-readiness notice -> `GenerationBriefView.test.tsx` (existing notice retained; assert it shows when `hasUnsavedChanges`).
4. Field-focus action moves keyboard focus to the editor field -> `ValidationPanel.test.tsx` invoking the checklist's `onFocusField` and asserting `focusBriefField` target receives focus.

## What to Change

### 1. `packages/web/src/generation-brief/ValidationPanel.tsx`

Replace `validate()` with `readiness()`; hold `GenerationReadiness` in state; render `<ReadinessChecklist readiness={...} actions={...} />`. Wire `actions`: `onFocusField` passthrough; `onOpenRecord(recordId)` / `onOpenProviderSettings()` / `onOpenWorkingSet()` via `react-router-dom` `useNavigate` (the same `/records?recordId=` deep-link `ValidationResultView` used, plus settings and working-set routes); `onCopyTechnicalJson`. Accept a new `hasUnsavedChanges` prop and set `readiness.unsavedDraft` accordingly so the checklist reflects stale state. Preserve the API-failure and loading states.

### 2. `packages/web/src/generation-brief/GenerationBriefView.tsx`

Pass `hasUnsavedChanges` into `<ValidationPanel>`. Keep the existing save-status line and stale-readiness notice. Confirm the save control is not gated by readiness.

## Files to Touch

- `packages/web/src/generation-brief/ValidationPanel.tsx` (modify)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- Prompt Preview and Generate pages (SPECREADIATHR-005 / 006).
- `ReadinessChecklist` internals (SPECREADIATHR-003).
- Deleting `ValidationResultView` — still imported by Preview/Generate until they migrate (SPECREADIATHR-007).
- Doc amendments — `cross-spec: SPEC-foundational-doc-amendments-for-generation-readiness` (Phase 7).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/generation-brief/ValidationPanel.test.tsx packages/web/src/generation-brief/GenerationBriefView.test.tsx`.
2. `npm run typecheck`.
3. `npm run lint`.

### Invariants

1. Draft save is never gated by readiness (`canSaveDraft` always true); the save button stays enabled with blockers present.
2. The Generation Brief readiness host reads `/api/readiness`, not `/api/validate`, and renders `ReadinessChecklist`, not `ValidationResultView`.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/ValidationPanel.test.tsx` — modify: mock `readiness()`; assert `ReadinessChecklist` render, action callbacks (record/settings/working-set/focus), and stale-state propagation from `hasUnsavedChanges`.
2. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — modify: save-with-blockers enabled, stale notice on unsaved changes.

### Commands

1. `npm test -- packages/web/src/generation-brief/ValidationPanel.test.tsx packages/web/src/generation-brief/GenerationBriefView.test.tsx`
2. `npm run typecheck && npm run lint`
3. Page-level component tests are the correct boundary; cross-page consistency is the SPECREADIATHR-007 capstone.
