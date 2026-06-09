# ACTPRESSTATUS-001: Annotate non-active records and add CONSEQUENCE to the Action pressure summary

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`; `docs/compiler-contract.md`; a `@loom/core` golden/compiler test.
**Deps**: None

## Problem

In `<active_working_set>`, the "Action pressure:" summary renders every selected `INTENTION` / `PLAN` / `OPEN THREAD` / `VISIBLE AFFORDANCE` regardless of its lifecycle status, with no status marker. A blocked intention therefore reads identically to an active one — e.g. `- Jon Ureña: Cross the park…; Jon Ureña is tired from work…` even though its `status` is `blocked`. This confounds the prose-writer LLM (it reads a thwarted goal as live pressure to act) and is internally inconsistent: the same blocked intention is **excluded** from the detailed `<active_intentions>` section (which filters to `status: active`), so the summary and the detail disagree.

The chosen fix (user-approved) is to **annotate** non-active records with a deterministic status tag so the writer knows the record is blocked/suspended/etc., rather than dropping them (which would defeat the author's intent of letting the prompt know the intention exists but is blocked).

This ticket also folds in an adjacent **contract-conformance** fix (user decision 2026-06-09): the authoritative contract feed for `{active_action_pressure}` is `INTENTION/PLAN/AFFORDANCE/CONSEQUENCE/OPEN THREAD` (`compiler-contract.md:134`), but the resolver omits `CONSEQUENCE` (`pressure.ts:15`). The code is conformed to the contract by adding `CONSEQUENCE` to the type set so consequences appear in the summary like the other causal-pressure records (and gain the same status annotation). The contract's "AFFORDANCE" is shorthand for the code's "VISIBLE AFFORDANCE" — no drift there.

## Assumption Reassessment (2026-06-09)

1. `active_action_pressure` resolver at `packages/core/src/compiler/sections/pressure.ts:12-18` uses the predicate `() => true` — no status filtering — over types `["INTENTION","PLAN","OPEN THREAD","VISIBLE AFFORDANCE"]`. Line projection is `actionPressureLine` (`pressure.ts:165-177`): `compactSummaryLine(displayLabel(record), firstText(payload, ["behavioral_pressure","current_step","possible_pressure_now","prompt_text"]))`, with a resolved-holder prefix for `INTENTION`/`PLAN`. Every sibling resolver filters to active: `active_intentions`→`isActiveIntention` (`:224`), `active_plans`→`isActivePlan` (`:228`), `active_open_threads`→`isActiveStatus` (`:232`). Status fields and baselines confirmed against the schemas: `INTENTION.status` baseline `active` (`records/causal-pressure.ts:8,40`), `PLAN.plan_status` baseline `active` (`causal-pressure.ts:9,51`), `OPEN THREAD.status` baseline `active` (`causal-pressure.ts:13`), `VISIBLE AFFORDANCE.status` ∈ `available|blocked|unavailable`, baseline `available` (`records/space-material.ts:9,66`), `CONSEQUENCE.status` ∈ `pending|active|resolved|escalated|abandoned`, baseline `active` (`causal-pressure.ts:12`).
2. `docs/compiler-contract.md:134` (`{active_action_pressure}` row) lists the feed `INTENTION/PLAN/AFFORDANCE/CONSEQUENCE/OPEN THREAD` and the holder-prefix behavior but says nothing about status; the empty-state is `None beyond detailed records below`. CONSEQUENCE also retains its own dedicated detailed section `{active_consequences}` (`compiler-contract.md:144`, resolver `pressure.ts:93-102`). FOUNDATIONS §28 (`docs/FOUNDATIONS.md:128`): active plans/intentions/clocks/obligations/**consequences**/etc. "drive choices, refusals, tactics… must never become act-structure machinery" — a non-active record presented as live pressure mis-drives the writer; an explicit status tag surfaces it as honest context, and consequences are explicitly named pressure-bearers.
3. Shared boundary under audit: the deterministic prompt-compilation surface (`{active_action_pressure}` placeholder) and its contract row. Annotation is additive to a prompt section; the CONSEQUENCE addition newly surfaces consequence records in the summary (the contract already lists them). Consumers: the prose-writer prompt and the compiler golden tests.
4. Motivating principle (FOUNDATIONS §28): causal-pressure records are context that drives behavior, not machinery. Restated: surface each record's true state; do not let a non-active record read as active pressure; surface consequences as the contract already prescribes.
6. Extends the rendered `{active_action_pressure}` prompt-section text. (a) Annotation is additive-only: active/available records render byte-for-byte unchanged; non-active records gain a suffixed `[<type> <status>]` tag on the display-label segment. (b) Adding CONSEQUENCE changes output for working sets that contain consequence records (they now appear in the summary, rendering `possible_next_effect`, the consequence-specific next-pressure field); CONSEQUENCE has no `holder` field, so it renders without a name prefix per the contract. Consumers: prose-writer LLM, compiler golden tests, prompt-fingerprint.
8. Resolved conformance gap (folded in per user decision 2026-06-09): `compiler-contract.md:134` lists `CONSEQUENCE`, the resolver omitted it — conformed by adding `CONSEQUENCE` to the type set. No FOUNDATIONS amendment: §28 already classes consequences as pressure-bearers, so surfacing them aligns with the constitution.

## Architecture Check

1. Add one pure helper, `actionPressureStatusTag(record, payload)`, that returns the tag (or `""`) and is called from `actionPressureLine`. This keeps status logic in one place, mirrors the existing per-type predicate pattern, and changes no control flow for active records. Adding `CONSEQUENCE` to the resolver type set extends the existing `actionPressureLine` projection with `possible_next_effect`. No filtering is introduced, so the summary keeps its role as the broad working-set summary while the detailed `<active_*>` sections retain their active-only filters.
2. No backwards-compatibility aliases/shims: the tag is computed from the record's own status field and a small per-type baseline map; no duplicate authority path.

## Verification Layers

1. A blocked `INTENTION` renders `… [intention blocked]…` in `{active_action_pressure}` → `@loom/core` compiler golden test.
2. An `active` `INTENTION`/`PLAN`/`OPEN THREAD`, an `available` `VISIBLE AFFORDANCE`, and an `active` `CONSEQUENCE` render with **no** tag → golden test asserting absence of a `[` tag for baseline-status records.
3. A `CONSEQUENCE` record appears in the summary (rendering `possible_next_effect`, no name prefix) where it previously did not → golden test for the feed addition.
4. Determinism preserved: working sets containing none of these five record types compile byte-for-byte identically; the prompt-fingerprint changes only where annotation or the new CONSEQUENCE line legitimately alters output.

## What to Change

### 1. `packages/core/src/compiler/sections/pressure.ts`

- Add `"CONSEQUENCE"` to the `active_action_pressure` resolver type set (`pressure.ts:15`) so the summary matches the authoritative contract feed; `actionPressureLine` resolves `possible_next_effect` for it and applies no holder prefix (CONSEQUENCE is not INTENTION/PLAN).
- Add a deterministic status-tag helper and apply it inside `actionPressureLine`:
  - Per-type display word: `INTENTION`→`intention`, `PLAN`→`plan`, `OPEN THREAD`→`open thread`, `VISIBLE AFFORDANCE`→`affordance`, `CONSEQUENCE`→`consequence`.
  - Per-type active baseline: `INTENTION`/`PLAN`/`OPEN THREAD`/`CONSEQUENCE`→`active`, `VISIBLE AFFORDANCE`→`available`.
  - Status field selector: `PLAN`→`plan_status`, all others→`status`.
  - `actionPressureStatusTag(record, payload)` reads the status via the selector; if it is empty or equals the baseline, return `""`; otherwise return `` ` [${word} ${status}]` ``.
  - In `actionPressureLine`, append the tag to the **display-label** argument of `compactSummaryLine`:
    `compactSummaryLine(displayLabel(record) + actionPressureStatusTag(record, payload), firstText(...))`.
    Result for the reported case: `- Jon Ureña: Cross the park near the Leka-Enea school… [intention blocked]; Jon Ureña is tired from work…`.

### 2. `docs/compiler-contract.md`

In the `{active_action_pressure}` row (`:134`), extend the Notes cell to state: non-active action-pressure records (`INTENTION`/`PLAN`/`OPEN THREAD`/`CONSEQUENCE` not `active`; `VISIBLE AFFORDANCE` not `available`) render a deterministic `[<type> <status>]` annotation on the display-label segment so blocked/suspended/etc. records are not mistaken for active pressure; unlike the detailed `<active_*>` sections, the action-pressure summary intentionally retains non-active records with this annotation. The resolver now also renders `CONSEQUENCE`, matching this row's listed feed (the row already lists it).

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/<action-pressure golden/compiler test>` (new or modify — colocate with existing pressure-section tests)

## Out of Scope

- The detailed `<active_intentions>` / `<active_plans>` / `<active_open_threads>` / `<active_consequences>` sections — their active-only filters are unchanged.
- Filtering/dropping non-active records (explicitly rejected in favor of annotation).

## Acceptance Criteria

### Tests That Must Pass

1. New/updated golden test: a `blocked` intention with a holder renders `… [intention blocked]…`; a `suspended` plan renders `[plan suspended]`; an `unavailable` affordance renders `[affordance unavailable]`; a non-`active` open thread renders `[open thread <status>]`; a non-`active` consequence renders `[consequence <status>]`.
2. Active/available/`active`-consequence records of all five types render with no status tag.
3. A `CONSEQUENCE` record now appears in the `{active_action_pressure}` summary (rendering `possible_next_effect`, no name prefix).
4. `npm test` (builds `@loom/core` then Vitest) passes; `npm run lint` and `npm run typecheck` pass.

### Invariants

1. The status annotation is additive for the four pre-existing types: active/available records render byte-for-byte as before. The CONSEQUENCE addition newly surfaces consequence records in the summary — golden tests for working sets containing consequences are updated to reflect their new presence.
2. The status tag is derived solely from the record's own status field and the per-type baseline — no second source of truth.

## Test Plan

### New/Modified Tests

1. `packages/core/test/<pressure-section test file>` — assert annotation for each non-active status across all five types, absence for baseline statuses, and that a CONSEQUENCE record renders in the summary.

### Commands

1. `npm test` (targeted: the pressure-section compiler test)
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-09

What changed:

- `packages/core/src/compiler/sections/pressure.ts` now includes `CONSEQUENCE` in `{active_action_pressure}` and applies deterministic status annotations to non-baseline `INTENTION`, `PLAN`, `OPEN THREAD`, `VISIBLE AFFORDANCE`, and `CONSEQUENCE` records.
- `{active_action_pressure}` now renders `CONSEQUENCE.possible_next_effect` as the consequence summary text, with no holder/name prefix.
- `docs/compiler-contract.md` now documents consequence action-pressure rendering and the non-active status annotation rule.
- `packages/core/test/compiler-pressure-sections.test.ts` covers status tags, baseline no-tag behavior, holder-less consequence rendering, and the new consequence summary line.
- `packages/core/test/golden-first-segment.prompt.txt` was re-baselined for the intentional new pending consequence line in the demo first-segment prompt.

Deviations from original plan:

- The ticket prose referred to `CONSEQUENCE.possible_pressure_now`; current schema authority uses `possible_next_effect`, so the implementation uses `possible_next_effect`.

Verification:

- `npm exec vitest run packages/core/test/compiler-pressure-sections.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
