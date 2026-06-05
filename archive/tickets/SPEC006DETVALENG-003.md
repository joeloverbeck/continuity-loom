# SPEC006DETVALENG-003: Universal blockers + generation-context rows

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/universal-blockers.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 2 of the engine: the universal blockers (`docs/FOUNDATIONS.md` §11 / `docs/requirements-version-1/VALIDATION-ENGINE.md` "Universal blockers" / `docs/compiler-contract.md` §6 tail), plus the two generation-context focus rows (`first_segment`, `continuation_after_accepted_segment`) which gate handoff/accepted-prose self-sufficiency. These are deterministic contradiction and local-prose-only checks: whole-chapter/outline/multi-point directive or stop guidance; directive vs stop-guidance disagreement; current state contradicts immediate handoff; one entity in two current locations; one object with two current holders; active plan held by a dead/unconscious/captive/incapacitated/absent entity; secret both hidden-from and known-by the same POV; hidden truth in a POV-knowledge field; offstage interruption lacking route/timing/communication/awareness; physical action lacking bodies/positions/routes/visibility/time/consent-or-force; active/onstage materially-involved cast missing required core dossier; expected dialogue lacking voice pressure; content envelope contradicting cast ages/statuses/config/provider; **accepted/rejected/superseded/auto-summary prose in prompt-facing fields**; any required constitutional section missing or structurally empty. This ticket houses the two SPEC-005 deferrals (authoritative accepted-prose-contamination blocker; non-local directive/stop blocker) and the core stress-suite-mapping targets.

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic`, barrel, `DIAGNOSTIC_CODES`) is created by SPEC006DETVALENG-001. This ticket adds `rules/universal-blockers.ts` and appends to `rules/index.ts`. Enum-driven contradiction inputs exist in the schema: PLAN `holder`/`can_drive_prose` (`packages/core/src/records/causal-pressure.ts`), ENTITY STATUS life/agency/visibility, SECRET `holders`/`non_holders_to_protect`/`pov_access`/`reveal_permission` (`packages/core/src/records/knowledge.ts`), `immediateHandoffSchema.prior_accepted_prose_status_or_handoff_note` (`generation-brief.ts`).
2. Binding source: `compiler-contract.md` §6 "Universal blockers not tied to a single validation focus tag" + the §6 matrix rows for `first_segment`/`continuation_after_accepted_segment`; `VALIDATION-ENGINE.md` "Universal blockers"; `FOUNDATIONS.md` §11. SPEC-006 §"What SPEC-005 deferred to Phase 6" names the accepted-prose-contamination blocker and the non-local directive/stop blocker as in-scope here.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature. Rules must not depend on sibling ordering (engine stable-sorts).
4. FOUNDATIONS §11 / §10 / §2+§12 restated: contradictions, impossible prompt conditions, and local-prose-only violations are blockers; accepted prose must never appear in prompt-facing fields (§10/§28.1); directive/stop guidance requesting chapter/act/beat/arc/outline/multi-point is a no-plot-rails blocker (§2/§12). These are the principles under audit, ahead of the spec narrative.
5. Fail-closed/secret-firewall/determinism surface named: the "secret both hidden-from and known-by the same POV" and "hidden truth in a POV-knowledge field" checks are part of the secret firewall (§15/§29.6) — verified deterministic and enum-driven (SECRET `pov_access`/`holders`/`non_holders_to_protect` vs selected POV), never free-text NLP. The accepted-prose-contamination check is a deterministic length/structure/marker heuristic on `prior_accepted_prose_status_or_handoff_note` and other prompt-facing fields, at least as strict as the SPEC-005 editor paste-guard (SPEC-006 §Risks), never an LLM check and never mutating.
6. Adjacent contradictions classification: the "active/onstage materially-involved cast missing required core dossier" and "expected dialogue lacking voice pressure" conditions overlap conceptually with the voice/dialogue matrix rows (ticket 006). Classification: the *unconditional* core-dossier/voice-pressure blocker (materially-involved cast regardless of focus tag) belongs here; the *focus-tag-activated* voice checks (`dialogue_expected`/`ensemble`) belong to 006. No duplication — different activation conditions, distinct codes.

## Architecture Check

1. Grouping all non-focus-tag contradiction blockers in one module keeps the cross-cutting "always-checked" rules together and separate from focus-tag-activated matrix rows (004–007), so a reviewer sees the full unconditional blocker surface in one diff. Each blocker is a pure enum/contradiction predicate traceable to named record fields (no free-text inference).
2. No backwards-compatibility aliasing/shims: net-new rule module; the accepted-prose blocker is the blocking successor to the non-blocking SPEC-005 paste-guard, not an alias of it.

## Verification Layers

1. Each universal blocker fires on a crafted contradictory snapshot -> unit test (one case per blocker).
2. Each stays silent on a clean snapshot -> unit test (clean negative).
3. Secret hidden+known-by-same-POV / hidden-truth-in-POV-field -> FOUNDATIONS alignment check (§15/§29.6) + schema validation against SECRET fields.
4. Accepted-prose contamination + non-local directive/stop fire as **blockers** (SPEC-005 deferrals) -> unit test asserting `severity === "blocker"`, not warning.
5. No free-text NLP / no LLM -> grep-proof that rules reference only named enum/field values and deterministic marker heuristics.

## What to Change

### 1. Universal blocker rules

`packages/core/src/validation/rules/universal-blockers.ts` — one predicate per §6/§11 blocker, each emitting a `blocker` `Diagnostic`:
- local-prose-only: directive/stop guidance requesting chapter/outline/alternate-options/downstream-summary/beat-act-chapter-package/multiple-response-points (deterministic marker/keyword set); directive vs stop-guidance disagreement.
- state vs handoff contradiction; one entity two current locations; one object two current holders.
- active plan held by dead/unconscious/captive/incapacitated/absent entity with no plausible means (PLAN.holder + ENTITY STATUS life/agency).
- secret hidden-from + known-by same POV without explicit partial/ambiguous access; hidden truth in a POV-knowledge field.
- offstage interruption lacking route/timing/communication/awareness; physical action lacking bodies/positions/routes/visibility/time/consent-or-force where relevant.
- active/onstage materially-involved cast missing required core dossier fields.
- content envelope contradicting active cast ages/statuses/story config/provider constraints.
- accepted/rejected/superseded/auto-summary prose in any prompt-facing field (deterministic length/structure/marker heuristic).
- any required constitutional section missing or structurally empty (evaluated against the deterministic sources, not by compiling).

### 2. Generation-context rows

In the same module: `first_segment` → `prior_accepted_prose_status_or_handoff_note` renders no accepted prose, launch state self-sufficient, no continuation phrases; `continuation_after_accepted_segment` → handoff user-authored, accepted/rejected/auto-summary blocks, durable changes represented in selected records/state.

### 3. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `universalBlockerRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/universal-blockers.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-blockers.test.ts` (new)

## Out of Scope

- Universal minimum completeness (missing-input checks) — ticket 002.
- Focus-tag matrix rows (knowledge/physical/voice/durable) — tickets 004–007.
- Warnings and API-key safety — ticket 008.
- Server/web surfacing — tickets 009–010.

## Acceptance Criteria

### Tests That Must Pass

1. Each universal blocker fires (emits its code, `severity === "blocker"`) on a crafted contradictory snapshot and is silent on a clean one.
2. Accepted-prose-contamination and non-local directive/stop guidance fire as blockers (the SPEC-005 deferrals), not warnings.
3. Secret hidden+known-by-same-POV and hidden-truth-in-POV-field fire deterministically from SECRET enum fields.
4. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Every blocker is traceable to named record/brief fields; no rule uses free-text NLP, token-count heuristics, wall-clock, randomness, or an LLM.
2. The accepted-prose blocker is at least as strict as the SPEC-005 editor paste-guard and never mutates input.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-blockers.test.ts` — per-blocker fire/silent cases, SPEC-005-deferral severity assertions, secret-firewall cases.

### Commands

1. `npm test -- validation-blockers`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented universal blocker validation in `@loom/core`:

- Added `validation/rules/universal-blockers.ts` with deterministic blockers for local-prose-only violations, directive/stop disagreement, handoff/current-state contradiction markers, entity-location conflicts, object-holder conflicts, inactive plan holders, secret firewall contradictions, offstage interruption route gaps, physical-action context gaps, active-speaker voice-pressure gaps, content-envelope contradictions, prompt-facing prose contamination, generation-context handoff rows, and missing template/compiler section sources.
- Registered the universal blocker rule family after completeness rules in the rule barrel.
- Extended the diagnostic-code catalogue with blocker-specific stable codes.
- Added `packages/core/test/validation-blockers.test.ts` covering each blocker as a `blocker`, including the SPEC-005 deferrals for accepted-prose contamination and non-local directive/stop guidance.
- Updated completeness fixtures so their clean snapshot remains clean once universal blockers are registered.

Deviation from original plan: state-vs-handoff contradiction and accepted-prose contamination use deterministic marker checks rather than free-text inference; this preserves the no-LLM/no-NLP invariant while giving later tickets room to add stricter structured fields if the contract evolves.

Verification:

- `npm test -- validation-blockers` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
