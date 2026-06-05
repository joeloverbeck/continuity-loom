# SPEC006DETVALENG-005: Context-dependent matrix — physical/perception/offstage rows

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/matrix-physical.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 3 (one of four matrix clusters): the physical/perception/offstage rows of the context-dependent validation matrix (`docs/compiler-contract.md` §6 / `docs/requirements-version-1/VALIDATION-ENGINE.md`). When present, these focus tags activate physical-continuity completeness gates: `physical_interaction_expected` (location, onstage entities, positions/distance, visibility, possessions where relevant, routes/exits, available time, impossible/unavailable actions), `offstage_interruption_possible` (offstage location/uncertainty, awareness mechanism, communication/entrance/timing route, interruption type), and `nonhuman_or_institutional_pressure_expected` (entity kind/description, operating rules or authority relation, current location/reach, pressure mechanism, limits on interiority/agency).

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic`, barrel) is created by SPEC006DETVALENG-001. This ticket adds `rules/matrix-physical.ts` and appends to `rules/index.ts`. The activating tags `physical_interaction_expected`, `offstage_interruption_possible`, `nonhuman_or_institutional_pressure_expected` are members of `generationValidationFocusSchema...expected_local_modes` (`packages/core/src/records/generation-brief.ts`).
2. Binding source: `compiler-contract.md` §6 matrix rows for these tags + `VALIDATION-ENGINE.md`. Field inputs: `currentAuthoritativeStateSchema` (positions, possessions, line_of_sight_and_visibility, routes_and_exits, available_time, onstage_entities — `generation-brief.ts`), LOCATION/OBJECT/VISIBLE AFFORDANCE/ENTITY STATUS records (`space-material.ts`, `entity.ts`), ENTITY records for nonhuman/institutional.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature; parallel sibling with tickets 004/006/007 on the same barrel (append-only). Rules activate only on their tag.
4. FOUNDATIONS §16 (physical continuity) restated: the prose writer must not move characters/objects without plausible action, route, time, consent/force, and physical possibility; validation must block when selected records make physical continuity impossible or dangerously underspecified. These rows are presence gates over named physical-state fields when the focus tag declares the interaction active — never plot beats.
5. Fail-closed/determinism surface named: physical-impossibility and "no plausible means" criteria are bounded and enum/presence-driven (e.g. ENTITY STATUS `life`/`agency` enums, `currentAuthoritativeStateSchema` arrays) per SPEC-006 §Risks "Physical-impossibility … need bounded, deterministic criteria." Rules must not infer impossibility by free-text NLP; each is traceable to a named record field. No leakage or nondeterminism path.

## Architecture Check

1. Clustering physical/perception/offstage rows under §16 localizes the physical-continuity review surface to one diff with focused tests; separating it from the durable-change rows (007) avoids conflating "is the interaction specified?" gates with "is the durable change supported?" gates even though both touch physical state.
2. No backwards-compatibility aliasing/shims: net-new rule module.

## Verification Layers

1. Each tag's blockers fire when the tag is present and a required physical-state field is missing -> unit test per row.
2. Each row is silent when its tag is absent, and when present-and-complete -> unit test (negatives).
3. Physical-continuity field requirements -> FOUNDATIONS alignment check (§16) + schema validation against `currentAuthoritativeStateSchema`/LOCATION/OBJECT/ENTITY STATUS field names.

## What to Change

### 1. Physical/perception/offstage matrix rules

`packages/core/src/validation/rules/matrix-physical.ts` — tag-activated predicates:
- `physical_interaction_expected` → location, onstage entities, positions/distance, visibility, relevant possessions, routes/exits, available time, impossible/unavailable actions when omission invites error.
- `offstage_interruption_possible` → offstage entity location or uncertainty state, awareness mechanism, communication/entrance/timing route, interruption type.
- `nonhuman_or_institutional_pressure_expected` → ENTITY kind/description, operating rules or authority relation, current location/reach, pressure mechanism, limits on interiority/agency if non-person.

### 2. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `physicalMatrixRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/matrix-physical.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-matrix-physical.test.ts` (new)

## Out of Scope

- Knowledge/secret/POV rows — ticket 004.
- Voice/dialogue/presence rows — ticket 006.
- Durable-change rows (object_use/transfer, location_change, restraint, intimacy, violence, institutional, clock_tick, obligation_breach) — ticket 007.
- Universal completeness/blockers — tickets 002–003.

## Acceptance Criteria

### Tests That Must Pass

1. Each of the three tags' blockers fires on a snapshot where the tag is set and a required physical-state field is missing.
2. Each row is silent when its tag is absent and when the tag is present with all required fields populated.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. A matrix row contributes diagnostics only when its activating focus tag is present.
2. Every diagnostic is traceable to named physical-state record/brief fields; impossibility is never inferred by free-text NLP or an LLM.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-physical.test.ts` — per-row tag-present-missing, tag-absent, and tag-present-clean cases.

### Commands

1. `npm test -- validation-matrix-physical`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the physical/perception/offstage context-dependent matrix cluster:

- Added `validation/rules/matrix-physical.ts` with tag-gated blockers for `physical_interaction_expected`, `offstage_interruption_possible`, and `nonhuman_or_institutional_pressure_expected`.
- Registered the physical matrix rule family in the validation rule barrel.
- Added stable matrix diagnostic codes for incomplete physical interaction, offstage interruption, and nonhuman/institutional pressure rows.
- Added `packages/core/test/validation-matrix-physical.test.ts` covering tag-absent silence, tag-present clean silence, and tag-present missing-state blockers for each row.

Deviation from original plan: offstage awareness/interruption route and nonhuman pressure mechanism are represented through deterministic current-lock markers until dedicated structured fields exist; the rules do not infer physical possibility through NLP or LLM evaluation.

Verification:

- `npm test -- validation-matrix-physical` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
