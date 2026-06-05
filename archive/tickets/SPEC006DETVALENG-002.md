# SPEC006DETVALENG-002: Universal minimum completeness checks

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/universal-completeness.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 1 of the engine: universal minimum completeness (`docs/compiler-contract.md` §5 / `docs/requirements-version-1/VALIDATION-ENGINE.md` "Universal minimum completeness"). Every generation must satisfy a deterministic set of presence/non-blank/enum-resolved checks before it can proceed — story contract + content policy + prose mode populated; current authoritative state, immediate handoff, manual directive, and stop guidance present and local-prose-only; non-omniscient POV has populated knowledge sources; active secrets carry holders/non-holders/cues/forbidden/permission; active physical interaction carries location/onstage/positions/possession/visibility/routes/time/impossible-actions; active/onstage materially-involved person-like cast has a core dossier + `local_function`; exactly one generation-context focus tag. These are completeness blockers — missing mandatory inputs, not contradictions (contradictions are ticket 003).

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot type, `Diagnostic`/`ValidationResult`, rule barrel, `DIAGNOSTIC_CODES`) is created by SPEC006DETVALENG-001 at `packages/core/src/validation/`. This ticket adds `rules/universal-completeness.ts` and appends its rule spread to `rules/index.ts`. The snapshot's 8 brief surfaces map to `generationSessionSchema` fields (`packages/core/src/records/generation-brief.ts`): `current_authoritative_state`, `immediate_handoff`, `manual_moment_directive`, `stop_guidance`, `generation_validation_focus`, `active_working_set`, `current_cast_voice_pressure`, `cast_voice_overrides`.
2. Binding criteria are `docs/compiler-contract.md` §5 (items 1–10) and §4 "Required?" / "Missing behavior" columns; `VALIDATION-ENGINE.md` "Universal minimum completeness". Story config singletons are `StoryConfigKind = "STORY CONTRACT" | "UNIVERSAL CONTENT POLICY" | "PROSE MODE"` (`packages/server/src/record-repository.ts`), defined as record types in `packages/core/src/records/global-config.ts`.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel (created by 001) and the `ValidationRule` signature. This ticket's rules are additive; they must not assume rule-ordering relative to siblings (002–008) since the engine stable-sorts output by `(code, affected)`.
4. FOUNDATIONS §11 (validation and hard fails): "missing mandatory generation fields are blockers." Restated before trusting the spec: these checks are deterministic presence/non-blank/enum-resolved tests, never a quality/"genericness" heuristic (SPEC-006 §Risks "Populated enough … is a judgement threshold"). "Populated enough to avoid a generic prompt" is implemented as concrete presence/non-blank rules; any finer rule would be added to `docs/compiler-contract.md` in the same change.
5. Fail-closed/determinism surface: each completeness check emits a `blocker` `Diagnostic` keyed to a stable code with `affected` pointing at the missing brief field or record. No mutation, no LLM, no gap-filling (§4.4/§29.4/§29.5). Each rule is traceable to a named snapshot field, so the secret-firewall and physical-continuity inputs that ticket 004/005 enforce as contradictions are here only checked for *presence* — no leakage path is introduced.

## Architecture Check

1. Completeness (missing input) and contradiction (003) are separated into distinct rule modules because they answer different questions (is X present? vs. do X and Y conflict?), use different diagnostic codes, and are independently reviewable; merging them would produce a 26-check diff. Each check is a small pure predicate over named snapshot fields.
2. No backwards-compatibility aliasing/shims: net-new rule module.

## Verification Layers

1. Each completeness blocker fires on a crafted snapshot missing that input -> unit test (one case per check).
2. Each completeness blocker stays silent on a fully-populated clean snapshot -> unit test (clean-snapshot negative).
3. "Populated enough" is deterministic presence/non-blank, not heuristic -> FOUNDATIONS alignment check (§11) + grep-proof that no rule references token counts, ratios, or model calls.
4. `affected` ref points at the actual missing field/record -> schema validation against `generationSessionSchema` field names.

## What to Change

### 1. Universal minimum completeness rules

`packages/core/src/validation/rules/universal-completeness.ts` — one predicate per §5 item, each returning a `blocker` `Diagnostic` when unsatisfied:
- STORY CONTRACT title/premise/genre/tone/content/language present; UNIVERSAL CONTENT POLICY rating/scope/tonal/governing present; PROSE MODE resolved (pov/person/tense/interiority).
- `current_authoritative_state`, `immediate_handoff` (incl. `last_visible_moment`, `begin_after`), `manual_moment_directive.must_render` (≥1), `stop_guidance.soft_unit_guidance` present.
- Non-omniscient POV (`active_working_set.selected_pov !== "omniscient"`) requires populated POV knowledge sources (selected FACT/BELIEF/SECRET/EVENT/ENTITY STATUS bearing POV knowledge per `compiler-contract.md` §4 `{pov_knows}` mapping).
- Active secrets present → holders, non_holders_to_protect, forbidden_reveals, reveal_permission present; allowed cues present when clue pressure applies.
- Active physical interaction → location, onstage entities, positions, possession (when objects matter), visibility, routes, available time present; impossible-actions where omission invites error.
- Active/onstage person-like cast materially involved → core dossier + `local_function`.
- Exactly one `generation_validation_focus.validation_focus_tags.generation_context` tag.

### 2. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `universalCompletenessRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/universal-completeness.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-completeness.test.ts` (new)

## Out of Scope

- Contradiction blockers (two locations, two holders, accepted-prose contamination, non-local directive) — ticket 003.
- Focus-tag matrix rows — tickets 004–007.
- Warnings and API-key safety — ticket 008.
- Server/web surfacing — tickets 009–010.

## Acceptance Criteria

### Tests That Must Pass

1. Each universal-completeness check fires (emits its blocker code) on a snapshot crafted to omit exactly that input.
2. A fully-populated clean snapshot yields zero completeness blockers.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Every completeness diagnostic is a `blocker` with a stable code and an `affected` ref naming the missing field/record.
2. No check uses token counts, ratios, wall-clock, randomness, or an LLM — presence/non-blank/enum-resolved only.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-completeness.test.ts` — per-check fire-on-missing and silent-on-clean cases; determinism with ticket 001's engine.

### Commands

1. `npm test -- validation-completeness`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented universal minimum completeness validation in `@loom/core`:

- Added `validation/rules/universal-completeness.ts` with deterministic blocker predicates for story config, generation brief surfaces, POV knowledge profile presence, active secret reveal-boundary presence, active physical context presence, active/onstage cast dossier/local-function presence, and exactly one generation-context focus tag.
- Registered the rule family in the validation rule barrel.
- Extended the diagnostic-code catalogue with completeness-specific stable codes.
- Added `packages/core/test/validation-completeness.test.ts` covering clean-snapshot silence and each completeness blocker category.
- Adjusted the ticket-001 engine-shell test to pass an explicit empty rule list now that the real default registry is no longer empty.

Deviation from original plan: accepted-prose contamination and non-local directive/stop-guidance validation remain out of scope for this ticket as ticket 003 contradiction/local-scope blockers own those checks.

Verification:

- `npm test -- validation-completeness` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
