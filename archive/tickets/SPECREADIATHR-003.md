# SPECREADIATHR-003: Shared `ReadinessChecklist` UI component

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `packages/web/src/readiness/ReadinessChecklist.tsx` and its test; no production behavior change to existing pages until they adopt it (SPECREADIATHR-004–006).
**Deps**: SPECREADIATHR-002

## Problem

Today each page renders raw `diagnostic.code` as the primary clickable label (`packages/web/src/generation-brief/ValidationResultView.tsx:68`). The spec requires one shared author-facing readiness checklist — four ordered groups, technical details collapsed by default, user-facing action labels, and accessible disclosure — rendered identically on all three pages. This ticket builds that reusable presentational component; the three page tickets then adopt it.

## Assumption Reassessment (2026-06-07)

1. The current shared renderer is `ValidationResultView` (`packages/web/src/generation-brief/ValidationResultView.tsx`), consumed by `ValidationPanel.tsx`, `PromptPreviewView.tsx`, and `GenerateView.tsx`. It renders `diagnostic.code` as a `<strong>` button label and lists `whyItMatters`/`suggestedActions`/`affected` as flat text — exactly the raw-code-first experience the spec replaces. `ReadinessChecklist` supersedes it; the file is retired once all three pages migrate (SPECREADIATHR-007).
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Readiness checklist groups, §Navigation and actions, §Accessibility, §Technical details expander) defines the four-group order, the per-card copy fields, the user-facing action labels, and the accessibility requirements (`aria-live="polite"` summary, counts in headings, `<details>`/`<summary>`, keyboard-reachable actions, focus movement, color-not-sole-indicator).
3. Cross-artifact boundary under audit: the component's prop contract is the `GenerationReadiness` / `ReadinessDiagnostic` / `AffectedTarget` / `DiagnosticAction` types from `@loom/core` (SPECREADIATHR-001), surfaced over `/api/readiness` (002). The component is purely presentational — it renders the model and emits action callbacks; it makes no gating decision and performs no fetch.
4. FOUNDATIONS restated: §11 — warnings are advisory. The component renders warnings in the "Recommended" / "Prompt length / salience" groups and must never present them as gates; gating lives in `GenerationReadiness.canPreview`/`canGenerate`, which the pages (004–006) read, not this component.

## Architecture Check

1. A single presentational component keyed off the derived model guarantees the three pages render identical readiness, satisfying the spec's "same checklist on all three pages" without duplicating grouping/copy logic per page. Keeping it fetch-free and decision-free makes it trivially testable and reusable.
2. No backwards-compatibility shims: `ReadinessChecklist` is net-new; `ValidationResultView` is not aliased or wrapped — it is retired wholesale once consumers migrate (007).

## Verification Layers

1. Groups render in spec order and "Technical diagnostics" is collapsed by default -> RTL test asserting group headings order and the `<details>` default-closed state.
2. Raw codes are not the primary label; action buttons carry user-facing labels, raw code appears only inside the technical expander -> RTL test asserting button text is the action label and `legacyCode` is within `<details>`.
3. Accessibility: `aria-live="polite"` summary region, blocker/warning counts in headings, keyboard-reachable actions, field-focus action moves focus -> RTL/jsdom test (role queries, `toHaveFocus`).
4. Component is presentational only (no preview/generate gating inside it) -> architectural review + grep-proof that the component imports no `api.ts` fetch and reads `canPreview`/`canGenerate` only for display labelling, not control flow.

## What to Change

### 1. New `packages/web/src/readiness/ReadinessChecklist.tsx`

Props: `{ readiness: GenerationReadiness; actions: { onFocusField(field): void; onOpenRecord(recordId): void; onOpenProviderSettings(): void; onOpenWorkingSet(): void; onCopyTechnicalJson(diagnostic): void } }`.

Render:
- A summary region (`role="status"`, `aria-live="polite"`) showing `summary.headline` / `summary.nextAction` and the blocker/warning counts in the section headings.
- The four groups in order — **Required before prompt generation**, **Recommended for stronger output**, **Prompt length / salience risks**, **Technical diagnostics** — placing each `ReadinessDiagnostic` by its `group`. The first three are author-facing; "Technical diagnostics" is a default-collapsed `<details>`.
- Per diagnostic card: `title`, `summary`, `whyItMatters`, `fastestFix`, and the optional `whenItBecomesBlocking` / `whyThisIsNotBlocking` / `ignoringIsReasonableWhen`; affected targets by `displayLabel`; `actions` as buttons with user-facing labels; a per-card collapsed technical expander (`technical.legacyCode`, `ruleId`, `severity`, `rawPaths`, raw record IDs, and any version/source metadata) plus a "Copy technical JSON" action.
- Non-color status indicators (text/icon) for blocker vs warning.

### 2. New `packages/web/src/readiness/ReadinessChecklist.test.tsx`

Covers the four Verification Layers against a fixture `GenerationReadiness`.

## Files to Touch

- `packages/web/src/readiness/ReadinessChecklist.tsx` (new)
- `packages/web/src/readiness/ReadinessChecklist.test.tsx` (new)

## Out of Scope

- Page wiring and the `readiness()` fetch (SPECREADIATHR-004–006 each adopt the component).
- The unsaved-draft stale notice (set by the Generation Brief page, SPECREADIATHR-004; the component renders it from `readiness.unsavedDraft` when present).
- Retiring `ValidationResultView` (SPECREADIATHR-007).
- `deriveReadiness` logic (SPECREADIATHR-001).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/readiness/ReadinessChecklist.test.tsx` — group order, default-collapsed technical group, action-label-not-code, and accessibility assertions.
2. `npm run typecheck`.
3. `npm run lint`.

### Invariants

1. "Technical diagnostics" is collapsed by default and no raw `code`/`legacyCode` appears as a primary author-facing label.
2. The component is presentational: it renders `GenerationReadiness` and emits action callbacks; it performs no fetch and makes no `canPreview`/`canGenerate` gating decision.

## Test Plan

### New/Modified Tests

1. `packages/web/src/readiness/ReadinessChecklist.test.tsx` — new: renders a fixture with blockers + grouped warnings + technical entries; asserts group order, collapsed technical disclosure, user-facing action button labels, `aria-live` summary, heading counts, and focus movement on a field action.

### Commands

1. `npm test -- packages/web/src/readiness/ReadinessChecklist.test.tsx`
2. `npm run typecheck && npm run lint`
3. Component-level test is the correct boundary; end-to-end cross-page consistency is exercised by the SPECREADIATHR-007 capstone.

## Outcome

Completed: 2026-06-08

What changed:

- Added `packages/web/src/readiness/ReadinessChecklist.tsx`, a fetch-free presentational renderer for `GenerationReadiness` with ordered groups, status summary, blocker/warning counts, user-facing actions, affected labels, and collapsed technical details.
- Added `packages/web/src/readiness/ReadinessChecklist.test.tsx` covering group order, default-collapsed technical diagnostics, author-facing action labels, accessibility/focus behavior through callbacks, action callback dispatch, and no-fetch behavior.
- Added scoped CSS for the checklist, diagnostic cards, actions, affected targets, and technical details.

Deviations from original plan:

- None. Page adoption and `ValidationResultView` retirement remain out of scope for later tickets.

Verification:

- `npm test -- packages/web/src/readiness/ReadinessChecklist.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
