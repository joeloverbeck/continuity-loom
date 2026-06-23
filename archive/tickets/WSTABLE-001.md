# WSTABLE-001: Decouple Active Working Set table layout from the shared `.recordTable` positional CSS

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: None — UI-only (CSS + JSX class wiring in `@loom/web`); no schema, compiler, validation, or stored-data surface touched.
**Deps**: None.

## Problem

The Active Working Set page (`WorkingSetView`) renders its per-type record tables with `className="recordTable"`, reusing the stylesheet authored for the Record Browser grid. That stylesheet pins column widths **by position** (`nth-child(1)` = 112px, `nth-child(2)` = `clamp(280px,34vw,440px)`), and those positions were chosen for the Record Browser's column order — not the Working Set's.

The two views order their columns differently, so the positional widths land on the wrong columns in the Working Set:

- **Record label is crushed into 112px** and wraps into 6–8 short lines (`Eneko / suspects / something / horrible has / …`), while large horizontal whitespace sits unused to the right.
- **The MEMBERSHIP column (the "Remove" button) floats awkwardly** at a mid-right position with dead space on both sides, because the wide `clamp(280px,34vw,440px)` slot is consumed by the lone STATUS value (`active`/`none`/`pending`). This is most visible in the tables that have **no CAST BAND column** — BELIEF, CONSEQUENCE, EMOTION — which is the majority of tables.

Both symptoms are a single root cause: positional CSS coupled to the wrong column order. The fix must repair the Working Set layout **without** altering the Record Browser, which uses the same `.recordTable` class correctly.

## Assumption Reassessment (2026-06-23)

1. **Both consumers of `.recordTable` and their column orders are confirmed.** Only two files reference the class: `packages/web/src/records/RecordBrowser.tsx` and `packages/web/src/working-set/WorkingSetView.tsx` (grep, `--include=*.tsx`). RecordBrowser's column order is `Working Set` button (`RecordBrowser.tsx:586`) → `Label`/`displayLabel` (`RecordBrowser.tsx:605`, line-clamped via `styles.css:556–563`) → status/extra columns. WorkingSetView's order is `Label` (`WorkingSetView.tsx:220,229`) → `Status` (`WorkingSetView.tsx:221,230`) → optional `Cast band` for `CAST MEMBER` only (`WorkingSetView.tsx:222,231`) → `Membership` (`WorkingSetView.tsx:223,265`). The positional `nth-child` rules at `styles.css:516–533` therefore size the wrong columns in WorkingSetView.
2. **The offending CSS rules are confirmed by file:line.** `styles.css:499–505` (`.recordTable` base: `width:100%; min-width:760px`), `styles.css:516–523` (`nth-child(1)`: `width:112px; min-width:112px; position:sticky; left:0`), `styles.css:525–533` (`nth-child(2)`: `width:clamp(280px,34vw,440px); min-width:280px; max-width:440px; position:sticky; left:112px`). The `nth-child(2) .linkButton` line-clamp (`styles.css:556–563`) is RecordBrowser-specific and does not apply to WorkingSetView (which renders a bare `<td>{record.displayLabel}</td>`, `WorkingSetView.tsx:229`).
3. **Shared boundary under audit: the `.recordTable` class is the shared contract between RecordBrowser and WorkingSetView.** The change must scope new layout to WorkingSetView only (a modifier class + semantic column classes) and leave the positional rules intact for RecordBrowser, whose layout currently renders correctly. The `.recordTable` base visual rules (borders, padding, header typography at `styles.css:507–545`) remain shared and unchanged.
4. **Adjacent observation:** WorkingSetView does **not** wrap its `<table>` in `.recordTableScroll` (`styles.css:494–497`), unlike RecordBrowser (`RecordBrowser.tsx:581`), so the `min-width:760px` has no horizontal-scroll container on narrow viewports. Classified as a **required consequence** of this ticket — adding the wrapper is part of making the Working Set table layout self-consistent. No separate ticket needed.
5. **No FOUNDATIONS principle is engaged.** This is a purely presentational CSS/JSX-class change. It touches no prompt-compilation, validation, storage, secrets, POV/knowledge, or accepted-prose surface, so `docs/FOUNDATIONS.md` imposes no constraint beyond "don't change runtime behavior" — which this honors (membership/cast-band semantics and persistence are untouched).
6. **No prior decision on this surface.** `triage/` (3 active files: open-thread-fields, prompt-generation-issues, ideation-prompt-issues) contains no record of the Working Set table layout; no active or archived ticket addresses `.recordTable` reuse by WorkingSetView. `.recordTable` originated with SPEC-016 (records grid) and was later reused here. No reversal concern.

## Architecture Check

1. **A WorkingSetView-scoped modifier (`workingSetTable`) plus semantic column classes is cleaner than the alternatives.** It (a) targets columns by meaning rather than DOM position, so it is robust to the 3-column (non-cast) vs 4-column (cast) variants — both order Label→Status first, with Membership always last and Cast band only present for cast; (b) reuses the shared `.recordTable` visual base, avoiding duplication of borders/padding/header rules; and (c) leaves RecordBrowser's positional rules — which are correct for its order — completely untouched, minimizing regression surface. Rejected: making `.recordTable` column-agnostic for both consumers (larger diff, regresses RecordBrowser's working layout for a cosmetic fix — YAGNI); a fully separate stylesheet block (duplicates shared base rules).
2. **No backwards-compatibility aliasing or shims are introduced.** The change replaces positional sizing for one table with semantic sizing; it adds no parallel/duplicate authority path and removes no public interface.

## Verification Layers

1. **Invariant: RecordBrowser layout is unchanged.** → codebase grep-proof: `.recordTable` base and `nth-child` rules in `styles.css` remain applied to RecordBrowser; no edit to `RecordBrowser.tsx` column rendering. Confirm the new width rules are gated behind the `workingSetTable` modifier (or the semantic column classes, which RecordBrowser does not emit).
2. **Invariant: WorkingSetView label/status/membership columns are sized by meaning, not position.** → manual review (rendered before/after screenshot): Label takes the wide share on one line with ellipsis; Status is narrow; Membership is compact at the right edge; the cast table's band column sits between Status and Membership. jsdom has no layout engine, so this is verified by a self-contained HTML+CSS render via the browser-automation MCP, not by the unit suite.
3. **Invariant: no behavior/data change.** → existing test suite: `packages/web/src/working-set/WorkingSetView.test.tsx` continues to pass unchanged (membership removal, cast-band assignment, local-function updates are untouched).

## What to Change

### 1. `packages/web/src/working-set/WorkingSetView.tsx` — add the modifier and semantic column classes

- Add a `workingSetTable` class alongside `recordTable` on the `<table>` (`WorkingSetView.tsx:217`).
- Add semantic classes to the header cells and body cells:
  - Label `<th>`/`<td>` → `labelCol`
  - Status `<th>`/`<td>` → `statusCol`
  - Cast band `<th>`/`<td>` (cast only) → `bandCol`
  - Membership `<th>`/`<td>` → `membershipCol`
- Wrap the `<table>` in a `<div className="recordTableScroll">` for parity with RecordBrowser (resolves Assumption-Reassessment item 4).

### 2. `packages/web/src/styles.css` — add `workingSetTable` layout rules

- Under a `.workingSetTable` selector, neutralize the inherited positional rules for this table (reset the `nth-child(1)`/`nth-child(2)` fixed widths and `position: sticky` so they no longer mis-size Label/Status), and size by semantic class:
  - `.workingSetTable .labelCol` — takes the dominant share (auto / flexible, with the table using a layout that lets Label expand and other columns stay compact).
  - `.workingSetTable .statusCol` — narrow (status values are short single words).
  - `.workingSetTable .bandCol` — medium (holds the band + local_function selects).
  - `.workingSetTable .membershipCol` — compact, holding only the Remove button.
- Keep the `.recordTable` base (borders, padding, header typography) applying to both tables; do **not** edit the existing `.recordTable nth-child` rules (RecordBrowser depends on them).

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Any change to RecordBrowser (`RecordBrowser.tsx`) or the shared `.recordTable` positional rules.
- Any behavioral or information-architecture change to the Working Set tables (cast-band control type, membership semantics, what compiles, record grouping). This ticket is presentation-only.
- Any change to record content, schema, validation, or persistence.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint` — passes (per-package + core import boundary).
2. `npm run typecheck` — passes (strict TS, all packages).
3. `npm test` — passes; in particular `packages/web/src/working-set/WorkingSetView.test.tsx` is green with no assertion changes (behavior unchanged).
4. Rendered before/after check: a self-contained HTML+CSS reproduction (or the running app with seeded records) rendered via the browser-automation MCP shows, for a non-cast table (BELIEF/CONSEQUENCE/EMOTION), the Label column wide on a single clamped line, Status narrow, and the Remove button compact at the right edge with no large dead gap; and for the CAST MEMBER table, the Cast band column sized between Status and Membership.

### Invariants

1. The `.recordTable` positional `nth-child` width/sticky rules remain unmodified and continue to govern RecordBrowser's grid.
2. WorkingSetView column widths are determined by semantic column classes / the `workingSetTable` modifier, not by DOM position, and hold across both the 3-column (non-cast) and 4-column (cast) table variants.

## Test Plan

### New/Modified Tests

1. `None — presentation-only ticket; layout is not computable by jsdom. Verification is the rendered before/after check (Acceptance Criteria 4) plus the unchanged, still-green `WorkingSetView.test.tsx` confirming no behavior regression.`

### Commands

1. `npm run lint && npm run typecheck`
2. `npm test`
3. Narrower command not applicable: CSS layout has no stylelint/unit gate in this repo, so the fidelity-appropriate verification is the rendered before/after screenshot named in Acceptance Criteria 4, not an automated assertion.

## Outcome

Completion date: 2026-06-23.

Implemented the Working Set table layout decoupling in `packages/web/src/working-set/WorkingSetView.tsx` and `packages/web/src/styles.css`. `WorkingSetView` now wraps each per-type table in `recordTableScroll`, adds the `workingSetTable` modifier beside the shared `recordTable` class, and emits semantic column classes for label, status, cast band, and membership cells. The shared `.recordTable` visual base and RecordBrowser positional `nth-child` rules remain in place; the Working Set modifier neutralizes the inherited first/second-column sticky sizing and applies meaning-based widths for both 3-column and 4-column Working Set tables.

Deviations from original plan: none.

Verification results:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 158 files, 1703 tests.
- `npm run build` passed. Vite emitted its existing large-chunk warning.
- Browser-rendered self-contained HTML/CSS proof via the Playwright CLI wrapper passed and saved `/tmp/wstable-layout-check.png`. The measured baseline showed the inherited broken layout with Label 132px, Status 428px, and Membership 360px. The fixed non-cast Working Set table measured Label 662px with nowrap/ellipsis, Status 116px, and Membership 142px. The fixed cast-member table measured Label 342px, Status 116px, Cast band 320px, and Membership 142px.
