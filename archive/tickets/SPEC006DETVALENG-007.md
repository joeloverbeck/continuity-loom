# SPEC006DETVALENG-007: Context-dependent matrix — durable-change rows

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/matrix-durable.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 3 (one of four matrix clusters): the durable-change rows of the context-dependent validation matrix (`docs/compiler-contract.md` §6 / `docs/requirements-version-1/VALIDATION-ENGINE.md`). When present, these focus tags activate the state required to support a durable change: `object_use_possible`, `object_transfer_possible`, `location_change_possible`, `restraint_or_coercion_possible`, `intimacy_or_sex_possible`, `violence_or_injury_possible`, `institutional_involvement_possible`, `clock_tick_possible`, `obligation_breach_possible`. Each requires the corresponding physical/object/consent-force/route-time/injury/institution/clock/obligation state per the matrix.

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic`, barrel) is created by SPEC006DETVALENG-001. This ticket adds `rules/matrix-durable.ts` and appends to `rules/index.ts`. All nine tags are members of `generationValidationFocusSchema.validation_focus_tags.possible_durable_changes` (`packages/core/src/records/generation-brief.ts`, verified: `object_use_possible`, `object_transfer_possible`, `location_change_possible`, `restraint_or_coercion_possible`, `intimacy_or_sex_possible`, `violence_or_injury_possible`, `institutional_involvement_possible`, `clock_tick_possible`, `obligation_breach_possible`).
2. Binding source: `compiler-contract.md` §6 matrix rows for the nine durable-change tags + `VALIDATION-ENGINE.md` "durable-change tags require the corresponding … state." Field inputs: OBJECT owner/carried_by/current_location/visibility (`space-material.ts`), `currentAuthoritativeStateSchema` positions/possessions/routes_and_exits/available_time/consent_or_force_conditions (`generation-brief.ts`), CLOCK/OBLIGATION/CONSEQUENCE (`causal-pressure.ts`), ENTITY STATUS agency/status (`entity.ts`).
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature; parallel sibling with tickets 004/005/006 (append-only). Rules activate only on their tag.
4. FOUNDATIONS §20 / §16 restated: the prose writer may create durable/irreversible changes only when strongly caused by the active working set and current moment, and the human remains the gatekeeper; physical continuity must remain possible. These rows block when a declared durable-change focus lacks the state that would make the change feasible — a completeness gate, never a command to force the event (§11 "tags are not instructions to force events").
5. Fail-closed/determinism surface named: each durable-change requirement maps to named enum/presence fields (e.g. `intimacy_or_sex_possible` → active cast ages/statuses + content-envelope consistency + `consent_or_force_conditions` + positions; `clock_tick_possible` → active CLOCK + tick trigger + next threshold). Bounded and enum-driven; no free-text NLP, no LLM, no mutation. Content-envelope-vs-cast-age checks here are presence/consistency gates and do not duplicate the unconditional envelope-contradiction blocker in ticket 003 (different activation: tag-gated here vs. always-checked there).

## Architecture Check

1. Clustering the nine durable-change rows in one module keeps the largest matrix slice as a single focused diff with shared test scaffolding (each row is the same shape: tag present → required-state predicate). Separating them from the physical cluster (005) avoids conflating "interaction specified" gates with "durable change supported" gates.
2. No backwards-compatibility aliasing/shims: net-new rule module.

## Verification Layers

1. Each of the nine tags' blockers fires when the tag is present and a required state field is missing -> unit test per row.
2. Each row is silent when its tag is absent and when present-and-complete -> unit test (negatives).
3. Durable-change state requirements -> FOUNDATIONS alignment check (§20/§16) + schema validation against OBJECT/CLOCK/OBLIGATION/ENTITY STATUS/`currentAuthoritativeStateSchema` field names.

## What to Change

### 1. Durable-change matrix rules

`packages/core/src/validation/rules/matrix-durable.ts` — tag-activated predicates per `compiler-contract.md` §6:
- `object_use_possible` / `object_transfer_possible` → object owner/carried_by/current_location/visibility, affordance/constraints, body positions, consent/force if relevant, resulting holder state.
- `location_change_possible` → source location, destination/reachable route, exits, available time, movement constraints, transport if relevant, arrival consequences.
- `restraint_or_coercion_possible` → agency/status, consent/force conditions, body positions, exits, power relationship, available time, physical/social constraints.
- `intimacy_or_sex_possible` → active cast ages/statuses, content-envelope consistency, consent/force, body positions, privacy, relationship/emotion pressure, physical affordances.
- `violence_or_injury_possible` → agency/status, positions, weapon/body affordances, force conditions, injury consequences, visibility, time, location constraints.
- `institutional_involvement_possible` → institution/entity record or current-state route, communication/access mechanism, jurisdiction/authority relation, current opportunity.
- `clock_tick_possible` → active clock, current pressure, tick trigger, next threshold, possible effects, concrete event that could visibly cause the tick.
- `obligation_breach_possible` → obligation terms, owed_by, owed_to, visibility, consequence_if_broken, current opportunity/pressure to breach or fulfil.

### 2. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `durableChangeMatrixRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/matrix-durable.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-matrix-durable.test.ts` (new)

## Out of Scope

- Knowledge/secret/POV rows — ticket 004.
- Physical/perception/offstage rows — ticket 005.
- Voice/dialogue/presence rows — ticket 006.
- The unconditional content-envelope-contradiction blocker — ticket 003.

## Acceptance Criteria

### Tests That Must Pass

1. Each of the nine durable-change tags' blockers fires on a snapshot where the tag is set and a required state field is missing.
2. Each row is silent when its tag is absent and when the tag is present with all required fields populated.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. A matrix row contributes diagnostics only when its activating focus tag is present.
2. Every diagnostic is traceable to named record/brief fields; never an instruction to force the event, never an LLM.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-durable.test.ts` — per-row tag-present-missing, tag-absent, and tag-present-clean cases for all nine tags.

### Commands

1. `npm test -- validation-matrix-durable`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the durable-change context-dependent matrix cluster:

- Added `validation/rules/matrix-durable.ts` with tag-gated blockers for `object_use_possible`, `object_transfer_possible`, `location_change_possible`, `restraint_or_coercion_possible`, `intimacy_or_sex_possible`, `violence_or_injury_possible`, `institutional_involvement_possible`, `clock_tick_possible`, and `obligation_breach_possible`.
- Registered the durable-change matrix rule family in the validation rule barrel.
- Added stable diagnostic codes for each durable-change matrix row.
- Added `packages/core/test/validation-matrix-durable.test.ts` covering tag-absent silence, tag-present clean silence, and tag-present missing-state blockers for all nine rows.

Deviation from original plan: several route/opportunity/resulting-state details are represented through deterministic current-lock markers until dedicated structured fields exist; the rules remain named-field and marker based, never LLM-based and never instructions to force an event.

Verification:

- `npm test -- validation-matrix-durable` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
