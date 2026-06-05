# SPEC006DETVALENG-004: Context-dependent matrix — knowledge/secret/POV rows

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/matrix-knowledge.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 3 (one of four matrix clusters): the knowledge/secret/POV rows of the context-dependent validation matrix (`docs/compiler-contract.md` §6 / `docs/requirements-version-1/VALIDATION-ENGINE.md` "Context-dependent validation matrix"). Each of these focus tags, when present in `generation_validation_focus`, activates its specified contextual blockers: `introspection_expected`, `ambiguous_perception_expected`, `secret_or_clue_pressure`, `non_pov_hidden_plan_behavior`. These guard POV-knowledge and reveal discipline at the focus-tag level (e.g. `secret_or_clue_pressure` requires secret claim/holders/non-holders/POV access/audience visibility/allowed clues/forbidden reveals/reveal permission).

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic`, barrel) is created by SPEC006DETVALENG-001. This ticket adds `rules/matrix-knowledge.ts` and appends to `rules/index.ts`. The activating tags exist in `generationValidationFocusSchema.validation_focus_tags.expected_local_modes` (`packages/core/src/records/generation-brief.ts`): `introspection_expected`, `ambiguous_perception_expected`, `secret_or_clue_pressure`, `non_pov_hidden_plan_behavior` are all members.
2. Binding source: `compiler-contract.md` §6 matrix rows for these four tags + `VALIDATION-ENGINE.md` "Context-dependent validation matrix" (binding implementation interpretation). Field inputs: SECRET fields (`knowledge.ts`), BELIEF, POV knowledge mapping (`compiler-contract.md` §4 `{pov_*}` rows), PLAN `visibility_to_pov` for hidden-plan behavior.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature. These rules activate only when their tag is present; absent the tag they emit nothing. They are parallel siblings with tickets 005–007 on the same barrel (append-only).
4. FOUNDATIONS §15 / §29.6 (POV, knowledge, secrets) restated: the prompt must distinguish what POV knows / does not know / cannot perceive, who holds a secret, who must not know, allowed clues, forbidden reveals, reveal permission. These matrix rows are completeness gates ensuring those fields are present when the focus tag declares the pressure active — never plot beats (§11 "tags are validation controls, not plot beats").
5. Fail-closed/secret-firewall surface named: these rows feed the secret firewall by blocking generation when an active secret/clue/hidden-plan focus lacks its required POV/secret fields. Deterministic and enum/presence-driven over named SECRET/BELIEF/PLAN/POV fields; no leakage path is introduced and no free-text NLP is used.

## Architecture Check

1. Splitting the 22-row matrix into four FOUNDATIONS-aligned clusters (knowledge/secret/POV here; physical/perception/offstage; voice/dialogue/presence; durable-change) keeps each diff to ~4 reviewable focus-tag predicates with focused tests, rather than one unreviewable matrix module. Clustering by principle (§15 here) also localizes the secret-firewall review surface.
2. No backwards-compatibility aliasing/shims: net-new rule module.

## Verification Layers

1. Each tag's blockers fire when the tag is present and its required fields are missing -> unit test per row.
2. Each row is silent when its tag is absent, and silent when the tag is present with all required fields -> unit test (tag-absent and tag-present-clean negatives).
3. Secret/POV field requirements -> FOUNDATIONS alignment check (§15/§29.6) + schema validation against SECRET/BELIEF/PLAN field names.

## What to Change

### 1. Knowledge/secret/POV matrix rules

`packages/core/src/validation/rules/matrix-knowledge.ts` — tag-activated predicates:
- `introspection_expected` → POV beliefs/suspicions/misreads, relevant emotion/interior pressure, psychic distance/interiority mode, non-POV interiority restrictions present.
- `ambiguous_perception_expected` → line-of-sight/sound state, obstruction/uncertainty, POV can/cannot perceive, possible misreads, audience/writer knowledge difference when applicable.
- `secret_or_clue_pressure` → secret claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, reveal permission, triggers if any.
- `non_pov_hidden_plan_behavior` → plan holder status/location/means, current step, `visibility_to_pov`, behavioral surface cues, close-POV non-interiority restriction.

### 2. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `knowledgeMatrixRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/matrix-knowledge.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-matrix-knowledge.test.ts` (new)

## Out of Scope

- Physical/perception/offstage rows — ticket 005.
- Voice/dialogue/presence rows — ticket 006.
- Durable-change rows — ticket 007.
- Universal completeness/blockers (rule families 1–2) — tickets 002–003.

## Acceptance Criteria

### Tests That Must Pass

1. Each of the four tags' blockers fires on a snapshot where the tag is set and a required field is missing.
2. Each row is silent when its tag is absent and when the tag is present with all required fields populated.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. A matrix row contributes diagnostics only when its activating focus tag is present in the snapshot.
2. Every diagnostic is traceable to named SECRET/BELIEF/PLAN/POV fields; no free-text NLP or LLM.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-knowledge.test.ts` — per-row tag-present-missing, tag-absent, and tag-present-clean cases.

### Commands

1. `npm test -- validation-matrix-knowledge`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the knowledge/secret/POV context-dependent matrix cluster:

- Added `validation/rules/matrix-knowledge.ts` with tag-gated blockers for `introspection_expected`, `ambiguous_perception_expected`, `secret_or_clue_pressure`, and `non_pov_hidden_plan_behavior`.
- Registered the knowledge matrix rule family in the validation rule barrel.
- Added stable matrix diagnostic codes for incomplete introspection, ambiguous perception, secret/clue, and hidden-plan rows.
- Added `packages/core/test/validation-matrix-knowledge.test.ts` covering tag-absent silence, tag-present clean silence, and tag-present missing-state blockers for each row.

Deviation from original plan: non-POV interiority and ambiguous-perception limits are represented as deterministic current-lock text markers until a more structured dedicated field exists; no free-text inference or LLM evaluation is used.

Verification:

- `npm test -- validation-matrix-knowledge` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
