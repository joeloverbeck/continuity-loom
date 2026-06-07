# SPEC015FIEGUICON-007: Accessible FieldHelp component and Radix Popover dependency

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/web` overlay primitive (`FieldHelp` + `field-help-ids`), the `@radix-ui/react-popover` dependency, and popover/badge styles; standalone component, not yet wired into editors (that is SPEC015FIEGUICON-008/009).
**Deps**: SPEC015FIEGUICON-001, SPEC015FIEGUICON-002

## Problem

SPEC-015 §12–§13 require a reusable, accessible field-help affordance: a real button trigger (not hover-only), click/tap/keyboard open, Escape and outside-click dismissal, correct ARIA, and critical hints that stay visible without opening the popover. The inspected web package has no overlay primitive (`@radix-ui/react-popover` absent), so this ticket adds it and builds the `FieldHelp` renderer that looks up guidance by canonical path. The popover is only the renderer; the catalog (SPEC015FIEGUICON-002) is the substance.

## Assumption Reassessment (2026-06-07)

1. `packages/web/package.json` has React 19 + React Hook Form + Testing Library + vitest but **no overlay primitive** (`@radix-ui/react-popover`, Floating UI all absent — confirmed). `@loom/core` exports `getFieldGuidance`, `FieldGuidance`, `PromptFacing` (SPEC015FIEGUICON-002) and `normalizeListIndices`/`buildFieldPath` (SPEC015FIEGUICON-001). `packages/web/src/styles.css` exists. The web test runner is vitest + `@testing-library/react` (existing web `*.test.tsx` files confirm the harness).
2. The required behavior/ARIA is `specs/SPEC-015-…md` §12.2–§12.3, §13, §16.2, and research anchors R3 (WAI-ARIA tooltip pattern), R4 (WCAG 1.4.13 hover/focus), R6 (React Aria — tooltips not on touch), R7 (Radix Popover). §8.4 recommends `@radix-ui/react-popover`.
3. **Shared boundary under audit**: `FieldHelp` consumes the canonical field path (SPEC015FIEGUICON-001) to (a) look up guidance via `getFieldGuidance` (SPEC015FIEGUICON-002) and (b) derive a deterministic DOM id (`field-help-ids.ts`) from the path plus stable list context. The DOM id is derived, never stored in project data (§12.2); the path key must match what core authored, or lookup returns `undefined`.
4. **FOUNDATIONS §10 / §29.4 (no help text in prompts)**: `FieldHelp` reads guidance for display only; it never writes to a generation payload, prompt, or project record. This display-only boundary is the design invariant — re-asserted by the prompt-exclusion test in SPEC015FIEGUICON-011 (guidance copy never appears in a compiled prompt).

## Architecture Check

1. Radix Popover supplies collision-aware positioning, managed focus, modal/non-modal modes, and Escape/outside-click dismissal as primitives, so the project does not re-implement ARIA/interaction glue (Floating UI would push that into app code, R8). A click/tap/focus popover (not a hover tooltip) is correct because the guidance is longer and more semantic than microcontent and must work on touch (R6). Critical hints render as always-visible text *outside* the popover so task-essential information is never hidden (R1/R2, §12.1).
2. No backwards-compatibility shim: net-new component and dependency; no existing tooltip is wrapped or aliased.

## Verification Layers

1. Trigger is a real `<button>` and opens on click and keyboard → RTL test (`FieldHelp.test.tsx`).
2. Escape and outside-click dismiss; second trigger activation closes → RTL test.
3. Trigger exposes accessible name (`Help for <field label>`), `aria-expanded`, and associates content via `aria-controls`/`aria-describedby` → RTL test.
4. `criticalVisibleHint` renders without opening the popover; validation errors are not moved into the popover → RTL test.
5. Touch/click path does not depend on hover → RTL test (open via click with no `pointerover`).

## What to Change

### 1. Dependency

- Add `@radix-ui/react-popover` to `packages/web/package.json` dependencies (lockfile regenerates).

### 2. New `packages/web/src/field-help/field-help-ids.ts`

- `fieldHelpId(canonicalPath: string, listContext?: string): string` — deterministic DOM id from the canonical path (+ stable list-row context for repeated items), never persisted.

### 3. New `packages/web/src/field-help/FieldHelp.tsx`

- Props: `{ fieldPath: string; fieldLabel: string; listContext?: string }`. Look up via `getFieldGuidance(fieldPath)`; render a compact info `<button>` adjacent to the label; popover content structured per §12.3 (Short / Prompt / Validation / Continuity / Advice, with Examples / Avoid / Related as separated subsections). Render the `criticalVisibleHint` (if any) as always-visible text outside the popover. Render a status badge (`Prompt` / `Validation only` / `Current generation only`) per §12.4 when it reduces confusion. No-op (render nothing or label-only) when no guidance entry exists, so partial catalogs degrade gracefully.

### 4. Styles

- Add popover, trigger, badge, and critical-hint styles to `packages/web/src/styles.css` (contrast meets WCAG; popover does not trap focus unless modal).

## Files to Touch

- `packages/web/package.json` (modify)
- `packages/web/src/field-help/field-help-ids.ts` (new)
- `packages/web/src/field-help/FieldHelp.tsx` (new)
- `packages/web/src/field-help/FieldHelp.test.tsx` (new)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Wiring `FieldHelp` into `RecordEditor`/`FieldShell`, `StoryConfigEditor`, `CastMemberEditor` (SPEC015FIEGUICON-008).
- `GenerationBriefView` help triggers (SPEC015FIEGUICON-009).
- Enum radio/card controls and selected-value display (SPEC015FIEGUICON-010).
- Cross-surface accessibility suite and global coverage gate (SPEC015FIEGUICON-011).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- FieldHelp` (vitest + RTL, `@loom/web`) — trigger renders as a button; click and keyboard activation open the popover; Escape and outside-click dismiss it.
2. `npm test -- FieldHelp` — trigger exposes `aria-expanded` and an accessible name; `criticalVisibleHint` renders without opening; the open path uses no hover.
3. `npm run typecheck && npm run lint` pass (web package).

### Invariants

1. The primary help interaction works by click, tap, and keyboard, and never depends on hover.
2. Critical/required hints and validation errors are reachable without opening the popover; DOM ids are derived from canonical paths, never persisted.

## Test Plan

### New/Modified Tests

1. `packages/web/src/field-help/FieldHelp.test.tsx` — trigger/open/dismiss/ARIA/critical-hint/touch-path cases.

### Commands

1. `npm test -- FieldHelp`
2. `npm run typecheck && npm run lint`
3. `npm --workspace @loom/web run build` — confirms the new dependency resolves and the component compiles in the Vite build (narrow boundary: the dependency add).

## Outcome

Completed: 2026-06-07

Changed:

- Added `@radix-ui/react-popover` to the web workspace dependency set and regenerated the lockfile.
- Added `packages/web/src/field-help/field-help-ids.ts` for deterministic DOM ids derived from canonical field paths and optional list context.
- Added `packages/web/src/field-help/FieldHelp.tsx`, a standalone display-only guidance popover that reads `getFieldGuidance`, renders critical hints outside the popover, exposes a real button trigger, and structures prompt/validation/continuity/advice/example/enum content.
- Added FieldHelp styles to `packages/web/src/styles.css`.
- Added `packages/web/src/field-help/FieldHelp.test.tsx` covering button trigger behavior, click and keyboard open, Escape/outside/second-click dismissal, ARIA state, non-hover access, visible critical hints, and graceful no-guidance rendering.

Deviations from original plan:

- Added explicit Enter/Space handling on the trigger so keyboard activation is deterministic in both jsdom and the component, instead of relying only on native button event synthesis.

Verification:

- `npm test -- FieldHelp` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm --workspace @loom/web run build` passed with Vite's large-chunk warning.
