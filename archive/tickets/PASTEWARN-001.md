# PASTEWARN-001: Remove the orphaned "looks like pasted prose" warning from the Generation Brief

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — removes the `proseLikePaste` UI heuristic and its inline warning from `@loom/web` (`GenerationBriefView.tsx`); no `@loom/core`, schema, validation-rule, or compiler change.
**Deps**: none

## Problem

The Generation Brief page renders a warning — *"This looks like pasted prose. Use user-authored launch context instead."* — between the `last_visible_moment` and `begin_after` textareas of the Immediate Handoff section. It is confusing and incorrect:

- The message is self-contradictory. The Immediate Handoff fields (`recent_causal_context`, `last_visible_moment`, `begin_after`) **are** the user-authored launch context (section description, `GenerationBriefView.tsx:646`), so telling the user to "use user-authored launch context instead" of what they typed there is meaningless.
- It is an orphan from a removed field. The `proseLikePaste` warning originally guarded the `immediate_handoff.prior_accepted_prose_status_or_handoff_note` field, where its copy ("Use a user-authored **handoff note** instead.") was a coherent firewall nudge. Commit `acfb6ea` (SPEC025SCHAUDPAS-001-002) deleted that field and, instead of retiring the warning, re-pointed `proseLikePaste` at the three surviving Immediate Handoff fields and rewrote the copy to "launch context."
- The heuristic fires on legitimate authored content. It flags text `>240` chars, or with `≥4` sentences, or containing a blank line (`:38-41`) — across the concatenation of all three fields — which is exactly the prose those fields are meant to hold per FOUNDATIONS §10/§28.1 (continuation launch uses user-authored recent causal context plus a cutpoint). A length/sentence heuristic cannot distinguish legitimately-authored launch context from verbatim-pasted accepted prose, so the nudge cannot serve its stated firewall purpose.
- Its placement is wrong: it renders between two fields but is computed over all three (including `recent_causal_context`, which sits above it).

The accepted-prose firewall is enforced structurally at the compiler (FOUNDATIONS §10 — accepted prose never enters a generated prompt) and does not depend on this UI nudge. The correct fix is to remove the orphaned warning.

## Assumption Reassessment (2026-06-22)

1. The warning and its heuristic live only in the web package: `proseLikePaste` is defined at `packages/web/src/generation-brief/GenerationBriefView.tsx:38-41`, consumed by the `pasteWarning` memo at `:311-314`, and rendered at `:662`. A repo-wide grep finds `proseLikePaste` in no other source file (only this file + its test).
2. The Immediate Handoff schema (`packages/core/src/records/generation-brief.ts:50-56`) now contains exactly `recent_causal_context`, `last_visible_moment`, `begin_after`; `prior_accepted_prose_status_or_handoff_note` was removed by commit `acfb6ea` (its retirement is asserted in `packages/core/test/schema-audit-cleanup-capstone.test.ts:158-197`). FOUNDATIONS §6.4 (lines 215-217) classifies these as user-maintained generation-time fields that legitimately hold authored prose; §10/§28.1 place the accepted-prose firewall at prompt compilation, not on this field.
3. Shared boundary under audit: the Generation Brief UI ↔ the `generationSession`/`immediate_handoff` draft schema. This change touches only the presentational warning; the `updateSurface` save payload, `setGenerationBrief` call, and `ValidationPanel`/readiness behavior are unchanged.
4. This warning is **not** a governed validation surface. `proseLikePaste` is an ad-hoc React heuristic, not a diagnostic code: it does not appear in `docs/validation-rule-inventory.md`, never compiles into a prompt, and never gates Preview/Generate/save (FOUNDATIONS §validation doctrine, line 459). Removing it weakens no fail-closed gate, no deterministic-compilation surface (§8), and no secret firewall (§15).
5. Removal blast radius (repo-wide grep for `proseLikePaste` and the warning text): the only live references are `GenerationBriefView.tsx` and `GenerationBriefView.test.tsx`. The `"not pasted prose"` string in `packages/core/src/validation/readiness.ts:109` is an unrelated readiness `fastestFix` hint on a different surface and is out of scope. Mentions in `archive/tickets/*` and `archive/specs/*` are historical provenance only.

## Architecture Check

1. Removing the orphaned warning is cleaner than repairing it: a deterministic length/sentence heuristic cannot tell authored launch context from pasted accepted prose, so any repaired copy would still false-positive on legitimate content while implying a firewall it cannot enforce. Deleting it removes a misleading surface; the real firewall stays at the compiler.
2. No backwards-compatibility alias, shim, or duplicate authority path is introduced — the function, its memo, and its JSX are deleted outright.

## Verification Layers

1. The warning text no longer exists in the web bundle -> codebase grep-proof: `grep -r "looks like pasted prose\|proseLikePaste" packages/web/src` returns no matches.
2. The Immediate Handoff fields still render and save unchanged -> `GenerationBriefView.test.tsx` (the save/readiness test continues to pass with its paste-warning assertion removed).
3. No validation/compilation surface changed -> `docs/validation-rule-inventory.md` is unchanged and `npm test` for `@loom/core` is unaffected (the heuristic was web-only).

## What to Change

### 1. Remove the heuristic and its usage from `GenerationBriefView.tsx`

- Delete the `proseLikePaste` function (`:38-41`).
- Delete the `pasteWarning` `useMemo` (`:311-314`).
- Delete the JSX line that renders the warning (`:662`): `{pasteWarning ? <p className="status statusWarning">…</p> : null}`.

Leave `nonLocalStopPattern` / `nonLocalStopWarning` (the "sounds non-local" stop-guidance warning) untouched — it maps to a live FOUNDATIONS concern (no chapter/act/beat machinery) and targets a coherent field.

### 2. Update the test

In `packages/web/src/generation-brief/GenerationBriefView.test.tsx`, the test currently named `"shows deterministic warnings and readiness blockers while still saving"` (`:603-633`) asserts the paste warning at `:627` (`expect(screen.getByText(/looks like pasted prose/i)).toBeTruthy();`). Remove that single assertion (and adjust the test name/setup if it now reads oddly), keeping the `/sounds non-local/i` and `"Current state is required."` assertions and the save flow intact.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- The `nonLocalStopWarning` stop-guidance warning — kept as-is.
- The `"not pasted prose"` readiness `fastestFix` copy in `packages/core/src/validation/readiness.ts:109` — unrelated surface.
- Adding any replacement static `FieldHelp` guidance about not pasting accepted prose — explicitly not in scope (the §10 firewall is structural; no new surface was requested).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint` — passes (no unused `proseLikePaste`/`pasteWarning` symbols left).
2. `npm run typecheck` — passes.
3. `npm test` — passes, including the updated `GenerationBriefView.test.tsx`.

### Invariants

1. The string "looks like pasted prose" appears nowhere in `packages/web/src` (grep-proof).
2. The Immediate Handoff save payload, readiness behavior, and `ValidationPanel` output are byte-for-byte unchanged — only the inline warning is removed.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — remove the paste-warning assertion from the deterministic-warnings/readiness save test; keep the non-local-stop and readiness coverage so the test still proves warnings + blockers coexist with a successful save.

### Commands

1. `npm test -- generation-brief` (targeted: exercises the modified Generation Brief view test).
2. `npm run lint && npm run typecheck && npm test` (full pipeline).
3. A narrower command is insufficient because removing the symbol must clear lint (unused-symbol) and the full web test suite must confirm no other test depended on the warning.

## Outcome

Completed: 2026-06-22

What changed:
- Removed the orphaned `proseLikePaste` heuristic, its `pasteWarning` memo, and the inline "looks like pasted prose" warning from `GenerationBriefView.tsx`.
- Removed the obsolete paste-warning assertion from `GenerationBriefView.test.tsx` while keeping coverage for the non-local stop warning, readiness blocker display, and successful draft save.

Deviations from original plan:
- No replacement static guidance was added, as requested.
- No browser smoke was run. This was a narrow component-level warning removal with unchanged save payload, readiness calls, and routing behavior; the updated component test, grep proof, lint/typecheck, full test suite, and production build cover the ticket acceptance surface.

Verification results:
- `rg -n "looks like pasted prose|proseLikePaste" packages/web/src` returned no matches.
- `npm test -- generation-brief` passed: 9 files, 75 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 158 files, 1674 tests.
- `npm run build` passed. Vite reported the pre-existing large chunk advisory.
