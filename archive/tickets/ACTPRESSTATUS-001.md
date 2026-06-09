# ACTPRESSTATUS-001: Annotate non-active records in the Action pressure summary

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`; `docs/compiler-contract.md`; a `@loom/core` golden/compiler test.
**Deps**: None

## Problem

In `<active_working_set>`, the "Action pressure:" summary renders every selected `INTENTION` / `PLAN` / `OPEN THREAD` / `VISIBLE AFFORDANCE` regardless of its lifecycle status, with no status marker. A blocked intention therefore reads identically to an active one — e.g. `- Jon Ureña: Cross the park…; Jon Ureña is tired from work…` even though its `status` is `blocked`. This confounds the prose-writer LLM (it reads a thwarted goal as live pressure to act) and is internally inconsistent: the same blocked intention is **excluded** from the detailed `<active_intentions>` section (which filters to `status: active`), so the summary and the detail disagree.

The chosen fix (user-approved) is to **annotate** non-active records with a deterministic status tag so the writer knows the record is blocked/suspended/etc., rather than dropping them (which would defeat the author's intent of letting the prompt know the intention exists but is blocked).

## Assumption Reassessment (2026-06-09)

1. `active_action_pressure` resolver at `packages/core/src/compiler/sections/pressure.ts:12-18` uses the predicate `() => true` — no status filtering. Line projection is `actionPressureLine` (`pressure.ts:165-177`): `compactSummaryLine(displayLabel(record), firstText(payload, ["behavioral_pressure","current_step","possible_pressure_now","prompt_text"]))`, with a resolved-holder prefix for `INTENTION`/`PLAN`. Every sibling resolver filters to active: `active_intentions`→`isActiveIntention` (`:224`), `active_plans`→`isActivePlan` (`:228`), `active_open_threads`→`isActiveStatus` (`:232`). Status fields and baselines confirmed against the schemas: `INTENTION.status` baseline `active` (`records/causal-pressure.ts:8,40`), `PLAN.plan_status` baseline `active` (`causal-pressure.ts:9,51`), `OPEN THREAD.status` baseline `active` (`causal-pressure.ts:13`), `VISIBLE AFFORDANCE.status` ∈ `available|blocked|unavailable`, baseline `available` (`records/space-material.ts:9,66`).
2. `docs/compiler-contract.md:134` (`{active_action_pressure}` row) specifies the feed and holder-prefix behavior but says nothing about status; the empty-state is `None beyond detailed records below`. FOUNDATIONS §28 (`docs/FOUNDATIONS.md:128`): active plans/intentions/etc. "drive choices, refusals, tactics… must never become act-structure machinery" — a blocked intention presented as live pressure mis-drives the writer; an explicit status tag surfaces it as honest context.
3. Shared boundary under audit: the deterministic prompt-compilation surface (`{active_action_pressure}` placeholder) and its contract row. The change is additive to a prompt section; the only consumer is the prose-writer prompt and the compiler golden tests.
4. Motivating principle (FOUNDATIONS §28): causal-pressure records are context that drives behavior, not machinery. Restated: surface the record's true state; do not let a non-active record read as active pressure.
6. Extends the rendered `{active_action_pressure}` prompt-section text. Additive-only: active records render byte-for-byte unchanged; non-active records gain a suffixed `[<type> <status>]` tag on the display-label segment. Consumers: prose-writer LLM, compiler golden tests, prompt-fingerprint.
8. Adjacent contradiction: `compiler-contract.md:134` lists `CONSEQUENCE` in the feed, but the resolver renders `VISIBLE AFFORDANCE` and **not** `CONSEQUENCE` (`pressure.ts:15`). Classified as a **separate code/contract drift**, out of scope for this ticket (see Out of Scope) — do not silently change the type set here.

## Architecture Check

1. Add one pure helper, `actionPressureStatusTag(record, payload)`, that returns the tag (or `""`) and is called from `actionPressureLine`. This keeps status logic in one place, mirrors the existing per-type predicate pattern, and changes no control flow for active records. No filtering is introduced, so the summary keeps its role as the broad working-set summary while the detailed `<active_*>` sections retain their active-only filters.
2. No backwards-compatibility aliases/shims: the tag is computed from the record's own status field and a small per-type baseline map; no duplicate authority path.

## Verification Layers

1. A blocked `INTENTION` renders `… [intention blocked]…` in `{active_action_pressure}` → `@loom/core` compiler golden test.
2. An `active` `INTENTION`/`PLAN`/`OPEN THREAD` and an `available` `VISIBLE AFFORDANCE` render with **no** tag (output byte-identical to current) → golden test asserting absence of `[` tag for active records.
3. Determinism preserved (no ordering/spacing change for active-only working sets) → existing prompt-fingerprint/golden snapshot unchanged for the all-active case.

## What to Change

### 1. `packages/core/src/compiler/sections/pressure.ts`

Add a deterministic status-tag helper and apply it inside `actionPressureLine`:

- Per-type display word: `INTENTION`→`intention`, `PLAN`→`plan`, `OPEN THREAD`→`open thread`, `VISIBLE AFFORDANCE`→`affordance`.
- Per-type active baseline: `INTENTION`/`PLAN`/`OPEN THREAD`→`active`, `VISIBLE AFFORDANCE`→`available`.
- Status field selector: `PLAN`→`plan_status`, all others→`status`.
- `actionPressureStatusTag(record, payload)` reads the status via the selector; if it is empty or equals the baseline, return `""`; otherwise return `` ` [${word} ${status}]` ``.
- In `actionPressureLine`, append the tag to the **display-label** argument of `compactSummaryLine`:
  `compactSummaryLine(displayLabel(record) + actionPressureStatusTag(record, payload), firstText(...))`.
  Result for the reported case: `- Jon Ureña: Cross the park near the Leka-Enea school… [intention blocked]; Jon Ureña is tired from work…`.

### 2. `docs/compiler-contract.md`

In the `{active_action_pressure}` row (`:134`), extend the Notes cell to state: non-active action-pressure records (`INTENTION`/`PLAN`/`OPEN THREAD` not `active`; `VISIBLE AFFORDANCE` not `available`) render a deterministic `[<type> <status>]` annotation on the display-label segment so blocked/suspended/etc. records are not mistaken for active pressure; unlike the detailed `<active_*>` sections, the action-pressure summary intentionally retains non-active records with this annotation.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/<action-pressure golden/compiler test>` (new or modify — colocate with existing pressure-section tests)

## Out of Scope

- The `CONSEQUENCE`-vs-`VISIBLE AFFORDANCE` feed drift in `compiler-contract.md:134` (separate ticket if pursued).
- The detailed `<active_intentions>` / `<active_plans>` / `<active_open_threads>` sections — their active-only filters are unchanged.
- Filtering/dropping non-active records (explicitly rejected in favor of annotation).

## Acceptance Criteria

### Tests That Must Pass

1. New/updated golden test: a `blocked` intention with a holder renders `… [intention blocked]…`; a `suspended` plan renders `[plan suspended]`; an `unavailable` affordance renders `[affordance unavailable]`; a non-`active` open thread renders `[open thread <status>]`.
2. Active/available records of all four types render with no status tag (byte-identical to pre-change output).
3. `npm test` (builds `@loom/core` then Vitest) passes; `npm run lint` and `npm run typecheck` pass.

### Invariants

1. Active-only working sets compile byte-for-byte identically to the pre-change compiler (no incidental spacing/ordering change).
2. The status tag is derived solely from the record's own status field and the per-type baseline — no second source of truth.

## Test Plan

### New/Modified Tests

1. `packages/core/test/<pressure-section test file>` — assert annotation for each non-active status across all four types, and absence for active/available.

### Commands

1. `npm test` (targeted: the pressure-section compiler test)
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-09

Implemented deterministic non-active status annotations for `active_action_pressure` records in `packages/core/src/compiler/sections/pressure.ts`. `INTENTION`, `PLAN`, `OPEN THREAD`, and `VISIBLE AFFORDANCE` records now append `[<type> <status>]` to the display-label segment only when their status differs from the active baseline (`active` for the causal pressure records, `available` for visible affordances). Active and available records continue to render without tags.

Updated `docs/compiler-contract.md` to document that the summary intentionally retains non-active action-pressure records with annotations, unlike the detailed active-only sections.

Added pressure-section compiler tests covering blocked intentions, suspended plans, answered open threads, unavailable affordances, and absence of tags for active/available records.

Deviations: none. The existing `CONSEQUENCE` versus `VISIBLE AFFORDANCE` contract/feed drift remains out of scope as stated in the ticket.

Verification:

- `npm exec vitest run packages/core/test/compiler-pressure-sections.test.ts` — passed, 15 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 99 files / 730 tests.
- `npm run build` — passed; Vite emitted the existing large-chunk warning.
