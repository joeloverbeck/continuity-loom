# SPECVALGATTAX-002: Minimum universal brief-surface blocker set

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — rewrites `validateGenerationBriefSurfaces` and `validateGenerationContextFocus` (`universal-completeness.ts`); extends stop-guidance markers in `universal-blockers.ts`; removes the `missing-stop-guidance` code from `DIAGNOSTIC_CODES`. Production behavior change (a quiet first local unit stops being falsely blocked).
**Deps**: SPECVALGATTAX-001; `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` (FOUNDATIONS §11 amendment that removes the `missing stop guidance;` hard-fail bullet — coupling, see Assumption Reassessment item 4)

## Problem

The current universal completeness rule over-blocks: it requires eight physical current-state fields for every generation, blocks blank `soft_unit_guidance`, blocks missing immediate handoff even for a first segment, and raises `focus-tag-count-invalid` on a missing (not just malformed) generation context. The spec (§Minimum universal current authoritative state, §Blank `soft_unit_guidance`, §Immediate handoff, §Diagnostic code changes) minimizes the universal blocker set to structural impossibility only. Blockers stay deterministic and blocking (§11); the physical fields move to the context-gated matrix, which already enforces them when the relevant focus tag is selected.

## Assumption Reassessment (2026-06-07)

1. `validateGenerationBriefSurfaces` (`packages/core/src/validation/rules/universal-completeness.ts:92`) currently requires `current_time, current_location, onstage_entities, positions, visible_conditions, line_of_sight_and_visibility, routes_and_exits, available_time` (lines 100-120) via `missing-current-authoritative-state`; blocks blank `soft_unit_guidance` via `missing-stop-guidance` (lines 152-162); blocks missing handoff via `missing-immediate-handoff` (lines 122-138) with no context gate. `validateGenerationContextFocus` (line 272) blocks unless exactly one `generation_context`.
2. The context-gated matrix already re-enforces the physical fields per focus tag: `matrix-physical.ts` `validatePhysicalInteractionExpected` requires positions/visibility/routes/time/locks; `matrix-durable.ts` `physicalStateReady` likewise. So removing them from the universal blocker does not drop coverage when a physical tag is selected — it removes the *false universal* requirement (spec §Minimum universal current authoritative state).
3. Cross-artifact boundary under audit: the `DIAGNOSTIC_CODES` enum (`packages/core/src/validation/types.ts:36`) ↔ the rule files that reference each code ↔ docs/tests asserting them. Removing `missingStopGuidance` requires deleting its enum key and its only producing site (this ticket) together.
4. FOUNDATIONS principle restated (the coupling): FOUNDATIONS §11:348 still lists `- missing stop guidance;` as a hard-fail and §29.5 still asks "generate when mandatory generation-time fields are missing?". Retiring the blocker is sanctioned only by the §11 amendment in `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` (regression-plan Phase 7). This ticket declares that spec as a Dep; the implementer must land (or coordinate landing) the §11 amendment so the validator is not in violation of the un-amended constitution. This is a required consequence of the spec's Phase-4 placement, not a separate bug.
5. Fail-closed surface touched: the universal blocker set. The change *narrows* what blocks but keeps every retained blocker deterministic and blocking — `missing-manual-directive` stays; the minimum state (`current_time, current_location, onstage_entities, immediate_situation_summary`) stays a blocker. The secret firewall (§15) and deterministic compilation (§8) are untouched — no validation path is made advisory that the spec keeps as a blocker, and warnings are not introduced here.
6. Removes a diagnostic code: `grep -rn "missing-stop-guidance" packages/ docs/` → `validation/types.ts` (enum), `universal-completeness.ts` (producer, removed here), web `ValidationPanel.test.tsx` / `ValidationResultView.test.tsx` (Readiness/UX-owned — folded into SPECVALGATTAX-006 per F2), `docs/stress-coverage-matrix.md` (SPECVALGATTAX-005). The producer + enum land here; consumers route to 005/006.

## Architecture Check

1. Keeping the physical-field requirement in exactly one place (the focus-tag matrix) removes the current duplication where both the universal rule and the matrix demand the same fields — the matrix is the deterministic, mode-scoped authority. The minimum universal set is the irreducible structural ground every prompt needs.
2. No backwards-compatibility alias: `missing-stop-guidance` is removed outright, not deprecated-in-place; invalid nonblank stop guidance is rerouted to the existing `local-prose-scope-violation` / `directive-stop-guidance-disagreement` blockers rather than a parallel code.

## Verification Layers

1. Minimum-state blocker fires on missing `immediate_situation_summary` but not on missing `positions`/`routes` (no physical tag) -> validation unit test (`validation-completeness.test.ts`).
2. Blank `soft_unit_guidance` does not block; nonlocal stop guidance still blocks via `local-prose-scope-violation` -> validation unit tests (`validation-completeness.test.ts`, `validation-blockers.test.ts`).
3. First-segment missing handoff compiles; continuation missing handoff blocks -> validation unit test driven by `generation_context`.
4. `missing-stop-guidance` fully removed -> codebase grep-proof (`grep -rn "missing-stop-guidance" packages/core/src` returns nothing).

## What to Change

### 1. Minimum universal current authoritative state (`universal-completeness.ts`)

In `validateGenerationBriefSurfaces`, reduce the `missing-current-authoritative-state` requirement to `current_time`, `current_location`, `onstage_entities`, and `immediate_situation_summary` (the field from SPECVALGATTAX-001). Drop `positions`, `visible_conditions`, `line_of_sight_and_visibility`, `routes_and_exits`, `available_time` from the universal check — they are enforced by the focus-tag matrix.

### 2. Blank stop guidance (`universal-completeness.ts`)

Remove the `missing-stop-guidance` blocker entirely (the compiler already emits the deterministic empty state `EMPTY_STATE_CONSTANTS.soft_unit_guidance`).

### 3. Handoff context-gating (`universal-completeness.ts`)

Gate the `missing-immediate-handoff` blocker to `generation_context === "continuation_after_accepted_segment"`. For `first_segment`, do not require handoff sub-fields (the compiler renders the deterministic first-segment empty state via existing `recent_causal_context` / `prior_accepted_prose_status_or_handoff_note` empty-states).

### 4. Focus-tag-count (`universal-completeness.ts`)

Change `validateGenerationContextFocus` to raise `focus-tag-count-invalid` only when `generation_context.length > 1` (malformed), not when it is missing/empty — the server-side normalizer (`deriveGenerationContextDefault`, landed) guarantees a default.

### 5. Stop-guidance invalid-nonblank extensions (`universal-blockers.ts`)

Extend `validateLocalProseOnly`'s `NON_LOCAL_MARKERS` to cover any future-consequence stop-guidance phrasing not already caught, and confirm `validateDirectiveStopGuidanceDisagreement` catches stop-guidance-vs-launch-directive contradiction. Do not add new codes — reuse `local-prose-scope-violation` and `directive-stop-guidance-disagreement` (spec §Blank `soft_unit_guidance`).

### 6. Enum (`types.ts`)

Remove `missingStopGuidance` from `DIAGNOSTIC_CODES`. Leave `missingCurrentAuthoritativeState`, `missingImmediateHandoff`, `focusTagCountInvalid` (their semantics change, not their codes).

## Files to Touch

- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `packages/core/test/validation-completeness.test.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify)

## Out of Scope

- Adding the `immediate_situation_summary` field/schema/placeholder (SPECVALGATTAX-001).
- Cast voice-pressure blocker removal (SPECVALGATTAX-003) and salience warnings (SPECVALGATTAX-004).
- The FOUNDATIONS §11 amendment itself (owned by `SPEC-foundational-doc-amendments-for-generation-readiness.md`; this ticket depends on it).
- Web validation panel/test updates (folded into SPECVALGATTAX-006).
- `docs/stress-coverage-matrix.md` sync (SPECVALGATTAX-005).

## Acceptance Criteria

### Tests That Must Pass

1. A first-segment session with the minimum state (`current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`), blank `soft_unit_guidance`, no handoff, and a `must_render` directive produces **no** blockers.
2. A continuation session with accepted segments and no handoff still blocks (`missing-immediate-handoff`); missing `must_render` still blocks; nonlocal stop guidance still blocks (`local-prose-scope-violation`).
3. Missing `generation_context` does not raise `focus-tag-count-invalid`; two context values does.
4. `npm test` passes.

### Invariants

1. Every retained universal blocker stays deterministic and blocking; no universal requirement is converted to a warning here (§11).
2. `missing-stop-guidance` has zero producing sites after this ticket; the physical current-state fields are required only through the focus-tag matrix.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-completeness.test.ts` — minimum-state pass case; blank stop-guidance pass; first-segment-no-handoff pass; continuation-no-handoff block; focus-tag-count malformed-only.
2. `packages/core/test/validation-blockers.test.ts` — nonlocal stop guidance still blocks via `local-prose-scope-violation`; stop-vs-directive disagreement still blocks.

### Commands

1. `npm run -w @loom/core build && npx vitest run packages/core/test/validation-completeness.test.ts packages/core/test/validation-blockers.test.ts`
2. `npm test`

## Outcome

Completion date: 2026-06-07

Implemented the minimum universal current-state blocker set: `current_time`, `current_location`, `onstage_entities`, and `immediate_situation_summary`. Blank `soft_unit_guidance` no longer produces a blocker, `missing-immediate-handoff` is gated to `continuation_after_accepted_segment`, and `focus-tag-count-invalid` now reports only malformed multiple generation contexts. Nonlocal stop guidance continues to block through `local-prose-scope-violation`.

Deviations from original plan: made the narrow dependent `FOUNDATIONS.md` §4.5/§11 amendment in this ticket so the validator no longer contradicts the active constitution after retiring the stop-guidance hard fail. Updated blocker-free test fixtures across core and server suites to include the new minimum current-state field introduced by SPECVALGATTAX-001.

Verification results:

- `npm run -w @loom/core build` passed.
- `npx vitest run packages/core/test/validation-completeness.test.ts packages/core/test/validation-blockers.test.ts` passed.
- `npm test` passed: 95 test files, 559 tests.
- `rg -n "missing-stop-guidance|missingStopGuidance" packages/core/src` returned no matches.
