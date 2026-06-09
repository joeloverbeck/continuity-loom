# SPEC017GENBRIVIS-002: Section cards and field-row component

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — restructures `GenerationBriefView` markup into section cards, introduces a `BriefFieldRow` component, adds card/field-row/helper/textarea CSS; no schema, save, validation, or compiler change
**Deps**: `archive/tickets/SPEC017GENBRIVIS-001.md`

## Problem

The generation brief renders its 8 sections as one continuous wall of `configPanel`s separated only by a hairline, with raw snake_case labels and the ⓘ help trigger floating orphaned *after* each `</label>` so it visually attaches to the next field; the rich `short` guidance is popover-only and routinely missed (SPEC-017 Problem Statement §1, §3, §4). This ticket restructures the page into contained section cards and a single field-row component (human label + requiredness chip + muted schema path + inline ⓘ + always-visible helper text), the central restructure the rail (004) and save bar (005) build on.

## Assumption Reassessment (2026-06-10)

1. Current structure (verified in `packages/web/src/generation-brief/GenerationBriefView.tsx`): `BriefLabel` (`:76–93`) renders label + `RequirednessMarker`; `BriefFieldHelp` (`:72–74`) renders `<FieldHelp>` *after* each `</label>` (the orphaned ⓘ). There are exactly 8 `configPanel` sections at h3 ids `active-working-set-brief` (:385), `current-state-brief` (:412), `handoff-brief` (:628), `directive-brief` (:681), `voice-pressure-brief` (:729), `override-brief` (:773), `validation-focus-brief` (:785), `stop-guidance-brief` (:824); `current_authoritative_state` carries `data-field` (:410) and STOP GUIDANCE carries `stopGuidancePanel` (:823). ~30 fields render. `.configPanel` styling is bare `border-top` at `styles.css:662`.
2. **`FieldHelp` already renders `guidance.criticalVisibleHint` always-visible *outside* the popover** (`packages/web/src/field-help/FieldHelp.tsx:32–34`, `<span className="fieldHelpCriticalHint">`; `Popover.Root` opens at :35) — so the SPEC-017 premise was corrected to "mostly popover-only, criticalVisibleHint excepted." Among rendered brief fields it surfaces on `prior_accepted_prose_status_or_handoff_note`, `stop_guidance.soft_unit_guidance`, `current_cast_voice_pressure[].current_voice_pressure`, and `generation_context`. SPEC-017 D2 requires the rework to **preserve** this always-visible rendering.
3. Shared boundaries under audit: (a) the deep-link contract — `focusBriefField` / `resolveBriefFieldTarget` (`:318–350`) resolve `?field=` by exact `[name=…]` / `[data-field=…]` then by `section[data-field]`; the restructure must keep heading ids, `name`, and `data-field` anchors stable. (b) The `FieldGuidance` contract — `BriefFieldRow` reads `displayLabel` (added by `archive/tickets/SPEC017GENBRIVIS-001.md`) with fallback to the schema leaf, and `short` for helper text.
4. FOUNDATIONS §10 / §28.1: `prior_accepted_prose_status_or_handoff_note`'s `criticalVisibleHint` ("Accepted prose is readable output, not continuity authority.") is a §10-aligned always-visible safeguard; it must remain visible without opening the popover. §27 (make high-friction continuity work pleasant, fast, tractable; readiness checklist drives diagnostics) motivates the restructure — not the §6 five-surfaces-distinctness clause (this stays *within* the brief surface; SPEC-017 M1).
5. Adjacent-behavior classification: the always-visible `criticalVisibleHint` is **existing** behavior the rework must carry forward, not new behavior — a required consequence of restructuring the field row, not a separate bug or future cleanup. No `configPanel` consumer outside this page depends on the brief's class usage (`BriefLabel`/`BriefFieldHelp` are local to `GenerationBriefView.tsx`; verified no external importers).

## Architecture Check

1. A single `BriefFieldRow` component composing label + chip + muted path + inline ⓘ + helper text replaces the split `BriefLabel`/`BriefFieldHelp` so the ⓘ sits in the label row (fixing orphaning) and helper text is wired once with `aria-describedby` — one component to test rather than two coordinated fragments. Section cards reuse the existing heading ids/anchors, so the deep-link machinery is untouched.
2. No backwards-compatibility aliasing/shims: `BriefLabel`/`BriefFieldHelp` are replaced, not aliased; the `configPanel` class is superseded by the card treatment on this page without leaving a dead alias.

## Verification Layers

1. `?field=` deep-link focus/scroll still resolves → existing `GenerationBriefView.test.tsx` deep-link case (updated for markup) + grep-proof that heading ids and `name`/`data-field` anchors are unchanged.
2. `criticalVisibleHint` renders always-visible after the rework → `GenerationBriefView.test.tsx` asserts the `prior_accepted_prose…` hint text is present without opening the popover; FOUNDATIONS §10 alignment check.
3. `short` helper text renders always-visible and the input is wired with `aria-describedby` → `FieldHelp.a11y.test.tsx` / `GenerationBriefView.test.tsx` accessibility assertion.
4. ⓘ trigger sits inline in the label row (not after `</label>`) → `FieldHelp.a11y.test.tsx` placement assertion.

## What to Change

### 1. `BriefFieldRow` component (new)

Create `packages/web/src/generation-brief/BriefFieldRow.tsx`: a label row containing, on one line — human label (`getFieldGuidance(path)?.displayLabel ?? <schema leaf>`), the existing `RequirednessMarker` chip, the schema path as small muted monospace, and the inline `FieldHelp` ⓘ; below it, `guidance.short` as always-visible helper text wired to the input via `aria-describedby`; and the existing always-visible `criticalVisibleHint` preserved. It wraps the field control as children.

### 2. Section cards

Rework each of the 8 sections in `GenerationBriefView.tsx` into a contained card: header row (human section title + one-line muted description of what the section feeds, aligned with each section's role in §6.3 and the compiler destinations) plus card body. Keep DOM section order, heading ids, and `data-field`/`name` anchors stable. STOP GUIDANCE keeps its `stopGuidancePanel` amber accent; the validation panel stays first and visually distinct.

### 3. Textarea right-sizing

Give prose textareas default heights proportional to expected content (`rows={2}` for optional/conditional, `rows={4}` for required narrative fields); add `field-sizing: content` (progressive enhancement) with `resize: vertical` retained and a `max-height` + scroll cap so a long value cannot blow up the page.

### 4. Styles

Add `briefSection` card treatment (replacing bare `.configPanel` usage on this page), field-row and always-visible helper-text styles, and the textarea sizing rules to `styles.css`.

### 5. Tests

Update `GenerationBriefView.test.tsx` queries to the new labels/markup (query by accessible name or `name` attribute — never weaken assertions); add cases for helper text + `aria-describedby`, `displayLabel` fallback to schema leaf, and `criticalVisibleHint` still rendering for `prior_accepted_prose…`. Extend `FieldHelp.a11y.test.tsx` to the inline-trigger placement and the labeled trigger.

## Files to Touch

- `packages/web/src/generation-brief/BriefFieldRow.tsx` (new)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/styles.css` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)
- `packages/web/src/field-help/FieldHelp.a11y.test.tsx` (modify)

## Out of Scope

- The sticky section rail and fill chips (SPEC017GENBRIVIS-004) and the contextual save bar (SPEC017GENBRIVIS-005).
- The core `displayLabel` field and its population (`archive/tickets/SPEC017GENBRIVIS-001.md`).
- Any change to readiness/validation logic, stored draft shape, the save payload, or routes.
- Accordion/collapse machinery and reorderable sections (documented anti-patterns — SPEC-017 Out of Scope).

## Acceptance Criteria

### Tests That Must Pass

1. `GenerationBriefView.test.tsx`: fields are found by accessible human label; `?field=` deep-link still focuses/scrolls the target; the `prior_accepted_prose…` `criticalVisibleHint` text is present without opening any popover.
2. `FieldHelp.a11y.test.tsx`: the ⓘ trigger renders inside the field's label row and exposes its accessible name; helper text is associated via `aria-describedby`.
3. `npm test --workspace @loom/web` and `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Heading ids, `name`, and `data-field` anchors are unchanged, so `focusBriefField`/`resolveBriefFieldTarget` keep resolving every existing `?field=` target.
2. Every field with a `criticalVisibleHint` still renders it always-visible (not folded into the popover).

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — re-query by accessible label/`name`; add helper-text/`aria-describedby`, `displayLabel`-fallback, deep-link, and `criticalVisibleHint`-preservation cases.
2. `packages/web/src/field-help/FieldHelp.a11y.test.tsx` — inline-trigger placement + labeled trigger.

### Commands

1. `npm test --workspace @loom/web -- GenerationBriefView`
2. `npm test --workspace @loom/web -- FieldHelp.a11y`
3. `npm run lint && npm run typecheck && npm test`
