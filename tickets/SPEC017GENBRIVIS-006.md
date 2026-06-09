# SPEC017GENBRIVIS-006: Pre-flight console integration verification

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: None — verification-only capstone; exercises SPEC017GENBRIVIS-001–005 end-to-end via the existing gate plus a manual runbook, adds no code/test/doc surface
**Deps**: `archive/tickets/SPEC017GENBRIVIS-004.md`, SPEC017GENBRIVIS-005

## Problem

SPEC-017's §Verification includes a manual pass that cannot run in the project's test infra — scroll-spy needs a real browser (no browser-automation harness exists; web tests are jsdom `vitest run`), and the "page materially shorter with the same data" / "rail jump lands below sticky chrome" / "ⓘ in the label row" checks are visual. This capstone exercises the composed pre-flight console (cards + field rows + rail + save bar) end-to-end: the full automated gate plus a manual runbook against a real project. It introduces no production logic.

## Assumption Reassessment (2026-06-10)

1. The five implementation tickets compose in `packages/web/src/generation-brief/GenerationBriefView.tsx`: `archive/tickets/SPEC017GENBRIVIS-002.md` (section cards + `BriefFieldRow`), `archive/tickets/SPEC017GENBRIVIS-004.md` (`SectionRail` + scroll-spy + chips), -005 (contextual save bar), over -001 (core `displayLabel`) and -003 (fill-chip logic). The automated gate is `npm run lint`, `npm run typecheck`, `npm test` (root `test` builds `@loom/core` then runs `vitest run`); web tests are jsdom. The `?field=` deep-link path is `focusBriefField`/`resolveBriefFieldTarget` (`:318–350`), regression-covered by `archive/tickets/SPEC017GENBRIVIS-002.md`'s updated `GenerationBriefView.test.tsx`.
2. SPEC-017 §Verification items: (1) lint/typecheck/test pass; (2) `?field=` focus/scroll verified by existing tests (updated for markup); (3) manual Puppeteer pass against the red-bunny reproduction — sections render as distinct cards with titles/descriptions, rail jumps land with the heading visible below any sticky chrome, editing summons the save bar, saving dismisses it and refreshes readiness, empty optional textareas no longer dominate scroll height, ⓘ sits in the label row; (4) fill-chip correctness with `generation_context = continuation_after_accepted_segment` (continuation-required fields count) vs `first_segment` (they do not).
3. Cross-artifact boundary: this capstone exercises the pipeline the upstream tickets composed; it modifies none of their files. `Deps` is the leaf set {004, 005}, whose transitive `Deps` cover 001/002/003.
4. FOUNDATIONS §27: the manual smoke confirms the restructured brief is legible and that the readiness panel (`ValidationPanel`) remains first and the sole diagnostic surface — chips and the save bar are advisory, not diagnostic.

## Architecture Check

1. A single trailing verification ticket keeps the end-to-end/manual checks out of the implementation tickets (which carry their own unit coverage) and gives the un-automatable visual smoke an explicit home with a reproducible runbook. It adds no production code, so it cannot regress behavior.
2. No backwards-compatibility aliasing/shims: verification-only.

## Verification Layers

1. Full automated gate green across the integrated surface → `npm run lint && npm run typecheck && npm test`.
2. `?field=` deep-link still focuses/scrolls and lands below sticky chrome → `archive/tickets/SPEC017GENBRIVIS-002.md`'s `GenerationBriefView.test.tsx` (CI) + manual confirm of the visible-below-chrome behavior (runbook).
3. Visual restructure smoke — cards distinct, rail jumps, save-bar summon/dismiss, reduced scroll height, inline ⓘ → manual Puppeteer runbook (no CI harness).
4. Fill-chip continuation correctness → SPEC017GENBRIVIS-003 `section-fill.test.ts` (CI) + manual spot-check toggling `generation_context` (runbook).

## What to Change

No production code. Add nothing to the tree; execute the verification below.

### Manual runbook (implementer follows by hand)

Open a real project (the red-bunny reproduction) via the standard Open Project flow, navigate to `/generation-brief`, and confirm each observable:

1. The 8 sections render as visually contained cards with human titles and one-line descriptions; STOP GUIDANCE keeps its amber accent; the validation panel is first and visually distinct.
2. Each field row shows a human label, the requiredness chip, the muted schema path, and the ⓘ **inside the label row**; `short` helper text is visible under the label; the `prior_accepted_prose…` "Accepted prose is readable output…" hint is visible without opening the popover.
3. Clicking each rail entry scrolls to its section with the heading visible **below** the sticky chrome; the active rail entry highlights as you scroll (scroll-spy).
4. Editing any field summons the contextual save bar; saving dismisses it, shows "Draft saved.", and refreshes readiness.
5. With the same data, the page is materially shorter than the pre-change ~7,900 px (empty optional textareas no longer dominate).
6. Set `generation_context` to `continuation_after_accepted_segment`: the continuation-required handoff fields count toward their section's required chip; switch to `first_segment`: they no longer count.

## Files to Touch

- None — verification-only.

## Out of Scope

- Any production code change (all logic lands in SPEC017GENBRIVIS-001–005).
- Adding a browser-automation harness to the repo (the smoke stays a manual runbook).

## Acceptance Criteria

### Tests That Must Pass (CI-runnable)

1. `npm run lint && npm run typecheck && npm test` all pass on the integrated branch.
2. `GenerationBriefView.test.tsx` deep-link case and `section-fill.test.ts` continuation case are green (regression coverage for runbook steps 3 and 6).

### Invariants (implementer-checklist, runbook)

1. Every runbook observable (1–6 above) holds against the red-bunny project.
2. The readiness panel remains first and the only diagnostic surface; chips and the save bar gate nothing.

## Test Plan

### New/Modified Tests

1. `None — verification-only capstone; coverage is the upstream tickets' tests named in Assumption Reassessment, exercised end-to-end here.`

### Commands

1. `npm run lint && npm run typecheck && npm test`
2. `npm test --workspace @loom/web -- GenerationBriefView` and `npm test --workspace @loom/web -- section-fill` (the CI-runnable regressions backing runbook steps 3 and 6).
3. Manual runbook above — the non-CI visual smoke (scroll-spy, scroll height, jump-below-chrome) that has no browser-automation harness in this project.
