# SPEC017GENBRIVIS-004: Sticky section rail with scroll-spy and fill chips

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds the `SectionRail` component and mounts it into `GenerationBriefView`, plus rail/scroll-spy CSS; no validation, save, or gating change
**Deps**: SPEC017GENBRIVIS-002, `archive/tickets/SPEC017GENBRIVIS-003.md`

## Problem

The generation brief is ~7,900 px of scroll with no in-page navigation and no way to tell from anywhere which sections still have unfilled required fields, so fields get overlooked (SPEC-017 Problem Statement §2). This ticket adds a sticky in-page section rail — anchor jumps, scroll-spy highlight, and a quiet per-section draft-fill chip — using the section-fill logic from `archive/tickets/SPEC017GENBRIVIS-003.md` and the restructured section cards from SPEC017GENBRIVIS-002.

## Assumption Reassessment (2026-06-10)

1. The 8 section headings already carry ids the rail anchors to: `active-working-set-brief`, `current-state-brief`, `handoff-brief`, `directive-brief`, `voice-pressure-brief`, `override-brief`, `validation-focus-brief`, `stop-guidance-brief` (`packages/web/src/generation-brief/GenerationBriefView.tsx`, the `aria-labelledby` h3 ids). `focusBriefField`/`resolveBriefFieldTarget` (`:318–350`) already resolve targets and `scrollIntoView`; anchor jumps reuse these ids with `scroll-margin-top`. The restructured cards (SPEC017GENBRIVIS-002) keep these ids stable.
2. SPEC-017 D3: the rail lists Validation plus the 8 sections; each entry is an anchor jump + scroll-spy active highlight (IntersectionObserver) + a per-section fill chip ("3/3 required" success, "1 required empty" amber, "n filled" neutral). It degrades to a horizontal jump bar under the page header at narrow widths. Two open questions stand (SPEC-017 Risks): rail placement (right-edge assumed; flip if it crowds the 1280 px layout) and final section-description copy (review against `docs/prompt-template.md` destination names) — both are implementation-time decisions, not blockers.
3. Shared boundary under audit: the rail consumes the section-fill helper + `isRequiredNow` from `archive/tickets/SPEC017GENBRIVIS-003.md` (chip data) and the section cards/heading ids from SPEC017GENBRIVIS-002 (jump targets). IntersectionObserver lives behind a small seam so the chip/anchor logic is unit-testable while scroll-spy is covered by the manual pass (SPEC017GENBRIVIS-006); jsdom cannot exercise IntersectionObserver directly.
4. FOUNDATIONS §11 / §29.5: the chips render the section-fill helper's advisory output ("filled"/"empty"), gate nothing, and never use "valid"/"ready"; the readiness panel (`ValidationPanel`) remains first on the page and the sole diagnostic authority.
5. §27 (UI/workflow): a sticky in-page section nav with anchor links and scroll-spy is the research-backed pattern for a long page an expert revisits with a specific target — it makes the brief legible without accordions or a mode switch, satisfying §27's "pleasant, fast, tractable" intent. This stays within the brief surface (no §6 five-surface boundary change).

## Architecture Check

1. A dedicated `SectionRail` component keeps navigation/scroll-spy concerns out of the already-large `GenerationBriefView`; it reuses the existing heading ids and `focusBriefField` rather than inventing a parallel anchor scheme, and reuses the `archive/tickets/SPEC017GENBRIVIS-003.md` chip logic rather than recomputing fill state. Putting IntersectionObserver behind a seam isolates the one untestable piece.
2. No backwards-compatibility aliasing/shims: the rail is additive navigation; no existing anchor or focus path is duplicated or aliased.

## Verification Layers

1. Rail lists Validation + all 8 sections, each anchoring to an id that exists in the page → `SectionRail.test.tsx` asserts each anchor target id + grep-proof the ids exist in `GenerationBriefView.tsx`.
2. Fill chips reflect the section-fill helper incl. continuation switching → `SectionRail.test.tsx` with a fixture draft under both generation contexts.
3. Rail is a labeled `nav` landmark → `SectionRail.test.tsx` accessibility assertion (`role="navigation"` + accessible name).
4. Scroll-spy active highlight → manual Puppeteer pass (SPEC017GENBRIVIS-006); not assertable in jsdom — the IntersectionObserver seam keeps the rest unit-tested.

## What to Change

### 1. `SectionRail` component (new)

Create `packages/web/src/generation-brief/SectionRail.tsx`: a labeled `nav` listing Validation + the 8 sections. Each entry renders an anchor jump (reusing the heading ids / `focusBriefField`, relying on `scroll-margin-top`), a scroll-spy active class driven by an IntersectionObserver behind a small injectable seam, and the fill chip from the `archive/tickets/SPEC017GENBRIVIS-003.md` helper. Provide the narrow-viewport horizontal jump-bar layout.

### 2. Mount into the view

Render `SectionRail` inside `GenerationBriefView` (right edge of the brief content column on wide viewports; horizontal bar under the page header at narrow widths), passing the in-memory draft + effective `generationContext` so chips recompute as the draft changes.

### 3. Rail styles

Add rail container, sticky positioning, scroll-spy active state, chip tones (success/amber/neutral), `scroll-margin-top` on section headings, and the narrow-width horizontal fallback to `styles.css`.

## Files to Touch

- `packages/web/src/generation-brief/SectionRail.tsx` (new)
- `packages/web/src/generation-brief/SectionRail.test.tsx` (new)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- The contextual save bar (SPEC017GENBRIVIS-005).
- The section-fill / `isRequiredNow` computation itself (`archive/tickets/SPEC017GENBRIVIS-003.md` owns it).
- A GOV.UK-style "check your answers" read-mode (SPEC-017 Out of Scope).
- Any readiness/validation/gating change.

## Acceptance Criteria

### Tests That Must Pass

1. `SectionRail.test.tsx`: rail renders Validation + all 8 section entries; every anchor target id resolves against the rendered page; chips reflect the section-fill helper for a fixture draft and flip a `continuation`-required section between contexts.
2. Rail exposes a `nav` landmark with an accessible name.
3. `npm test --workspace @loom/web` and `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Anchor targets are the existing heading ids — the rail introduces no new id scheme and does not alter `focusBriefField` resolution.
2. Chips are advisory; nothing in the rail gates Save/Preview/Generate, and the readiness panel stays first on the page.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/SectionRail.test.tsx` — section list + anchor targets + chip correctness + `nav` landmark.

### Commands

1. `npm test --workspace @loom/web -- SectionRail`
2. `npm run lint && npm run typecheck && npm test`
3. `grep -nE "active-working-set-brief|stop-guidance-brief" packages/web/src/generation-brief/GenerationBriefView.tsx` — confirms the anchor target ids the rail depends on still exist (narrow proof scoped to the jump-target contract).
