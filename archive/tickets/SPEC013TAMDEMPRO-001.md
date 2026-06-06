# SPEC013TAMDEMPRO-001: Core demo fixture module (The Letter Under the Flour Bin)

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/core` `src/demo/` fixture module exporting typed demo data (story config, records, generation session) + public re-export from `packages/core/src/index.ts`
**Deps**: None

## Problem

Continuity Loom has a complete v1 loop but no built-in, schema-valid demo data to exercise it. SPEC-013 D1 requires a pure, framework-free fixture in `@loom/core` carrying *The Letter Under the Flour Bin* as typed objects — the three story-config payloads, the full required-record set, and the first-segment generation session (active working set + cast bands + brief + validation focus tags). This module is the data substrate every other SPEC-013 ticket consumes; it must validate against the existing record/config/brief schemas and must not weaken the core purity boundary.

## Assumption Reassessment (2026-06-06)

1. The record/config/brief schemas the fixture must satisfy are registered in `@loom/core`: `recordTypeRegistry` / `parseRecordPayload` (`packages/core/src/records/registry.ts:35,45`); STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE definitions (`packages/core/src/records/global-config.ts:59,64,69`); `generationSessionSchema` + `activeWorkingSetSchema` (`packages/core/src/records/generation-brief.ts:5,158`); validation-focus enums (`packages/core/src/records/generation-brief.ts:114-146`). Cast inclusion bands live in `active_working_set.{active_onstage_cast_full[].local_function, present_minor_cast_compressed, offstage_relevant_cast}`, NOT on CAST MEMBER payloads — confirmed at `generation-brief.ts:8-25`.
2. SPEC-013 (reassessed in-session 2026-06-06) §Approach 1 + §Deliverables fix the record inventory: CAST MEMBER ×2 (Elin, Niko), ENTITY ×2 (Mara Venn, Orin Ward), SECRET, OBJECT ×4 (Letter, Lantern, Flour bin, Cellar latch), LOCATION + VISIBLE AFFORDANCE, and PRESSURE records EVENT ×2, BELIEF ×2, EMOTION ×2, RELATIONSHIP, INTENTION ×2, OPEN THREAD, optional CLOCK/CONSEQUENCE. The first-segment brief sets focus tags `first_segment`, `dialogue_expected`, `introspection_expected`, `secret_or_clue_pressure`, `physical_interaction_expected`, `object_use_possible` (spec §Approach 1; source `docs/requirements-version-1/DEMO-PROJECT-AND-STRESS-COVERAGE.md:131`).
3. Shared boundary under audit: the fixture's typed exports are consumed by SPEC013TAMDEMPRO-002 (server orchestration loops these records/configs/session through `createRecord`/`setStoryConfig`/`setGenerationSession`), -004 (blocker recipes edit from this baseline), -005 (capability tests reuse it), -006 (capstone). The contract is "every exported payload parses under its registry/config/session schema with zero validation blockers on the baseline."
4. FOUNDATIONS principles motivating the data shape: §10 (no accepted prose in prompts — the brief's `prior_accepted_prose_status_or_handoff_note` must be a clean `None.` note) and §15 (POV/secret firewall — SECRET names holder Elin, protected non-holder Niko, allowed cues, forbidden reveal; POV-knowledge must not contradict). Restated before trusting spec narrative.
5. Secret-firewall / deterministic-compilation substrate: no validator or compiler is *added* here, but this data feeds the existing fail-closed validation engine (`packages/core/src/validation/rules/universal-blockers.ts`) and deterministic compiler (`packages/core/src/compiler/compile-prompt.ts`). Confirm the fixture introduces no leakage path the engine forbids: the valid baseline must NOT trip `hidden-truth-in-pov-knowledge`, `secret-reveal-contradiction`, or `prompt-facing-prose-contamination`. Per spec §Risks, the first-segment handoff must avoid `CONTINUATION_MARKERS`/`CONTAMINATION_MARKERS` (`universal-blockers.ts:23,33`) and keep the prior-prose note `isCleanNoAcceptedProseNote`-clean (`universal-blockers.ts:524`). Enforcement stays in the existing engine (exercised by -004/-006); this ticket only authors conforming data.

## Architecture Check

1. Demo *data* as pure typed objects in `@loom/core` (not server seed code, not test-only payloads) keeps the fixture reusable by core tests, server orchestration, and capability tests through one canonical source, and keeps creation orchestration (SPEC013TAMDEMPRO-002) free of embedded literals. Conforming to existing schemas rather than introducing demo-specific shapes preserves "demo is ordinary project data" (spec §Out of Scope; FOUNDATIONS §4.4 no special-casing).
2. No backwards-compatibility aliasing/shims: this is net-new data; it adds an export to `packages/core/src/index.ts` and introduces no parallel/legacy path.

## Verification Layers

1. Every record payload parses under its registry schema -> schema validation: `parseRecordPayload(type, payload)` succeeds for each fixture record (test assertion in `demo-fixture.test.ts`).
2. Story configs + generation session parse -> schema validation: each config payload validates against its `global-config.ts` definition; the session validates against `generationSessionSchema`.
3. Record-set completeness (every required record type present per Assumption 2) -> test assertion enumerating required types against the fixture.
4. Core purity boundary intact (no `node:*`/`fastify`/`react`/`vite` imports) -> codebase grep-proof + the existing core import-boundary lint rule/test (`npm run lint`).
5. Secret firewall + no-prose substrate hold on the baseline -> FOUNDATIONS alignment check (§10/§15): SECRET holder/non-holder/forbidden-reveal present and POV-knowledge consistent; prior-prose note clean. (Engine-level enforcement is exercised by SPEC013TAMDEMPRO-006.)

## What to Change

### 1. Fixture data module

Add `packages/core/src/demo/letter-under-flour-bin.ts` exporting typed constants:
- The three story-config payloads (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE) keyed by their `StoryConfigKind`, sourced from `DEMO-PROJECT-AND-STRESS-COVERAGE.md` §Demo story configuration.
- An ordered array of demo records `{ type, displayLabel, payload }` covering the full inventory in Assumption 2 (POV Elin; SECRET with holder Elin / protected non-holder Niko / allowed cues / forbidden reveal / `reveal_permission: clue_only`, no active CLOCK per spec §Risks recommendation).
- The first-segment `GenerationSession` payload: `active_working_set` (selected_records, `active_onstage_cast_full` with `local_function` bands for Elin = `pov_narrator` and Niko = `active_speaker`, `selected_pov`, `manual_directive_id`), `current_authoritative_state`, `immediate_handoff` (clean `None.` prior-prose note, no continuation markers), `manual_moment_directive`, `stop_guidance`, and `generation_validation_focus` with the six focus tags.

### 2. Module barrel + package export

Add `packages/core/src/demo/index.ts` re-exporting the fixture, and extend the `export { ... }` block in `packages/core/src/index.ts` to expose the demo fixture (and any helper types) on the `@loom/core` public API so `@loom/server` can import it.

### 3. Fixture tests

Add `packages/core/src/demo/demo-fixture.test.ts` asserting per-payload schema validity, record-set completeness, the clean first-segment handoff invariant, and absence of node/framework imports.

## Files to Touch

- `packages/core/src/demo/letter-under-flour-bin.ts` (new)
- `packages/core/src/demo/index.ts` (new)
- `packages/core/src/demo/demo-fixture.test.ts` (new)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- Server creation orchestration and the `create-demo` route (SPEC013TAMDEMPRO-002).
- Any web affordance (SPEC013TAMDEMPRO-003).
- Blocker-recipe edits/tests (SPEC013TAMDEMPRO-004) and stress matrix (SPEC013TAMDEMPRO-005).
- Any change to compiler, validation, schema, or prompt-template behavior — the fixture conforms to them (spec §Out of Scope).
- Pre-broken demo variants or blocker-toggle data (spec §Out of Scope).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/src/demo/demo-fixture.test.ts` — every config/record/session payload parses; required-record-type set is complete.
2. `npm run lint` — passes, including the `@loom/core` import-boundary rule (fixture stays node/framework-free).
3. `npm run typecheck && npm test` — full pipeline green with the new module exported from `@loom/core`.

### Invariants

1. Every exported demo payload validates against its existing registry/config/session schema with no schema-shape changes to those schemas.
2. The first-segment fixture session keeps `prior_accepted_prose_status_or_handoff_note` `isCleanNoAcceptedProseNote`-clean and contains no `CONTINUATION_MARKERS`/`CONTAMINATION_MARKERS`, so the baseline carries zero `prompt-facing-prose-contamination` cause.

## Test Plan

### New/Modified Tests

1. `packages/core/src/demo/demo-fixture.test.ts` — per-payload schema validation, completeness enumeration, clean-handoff and purity assertions.

### Commands

1. `npx vitest run packages/core/src/demo/demo-fixture.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. Targeted vitest is the correct inner-loop boundary (single new module); the full `npm test` confirms the new `@loom/core` export does not regress dependent server tests that build core first.

## Outcome

Completed: 2026-06-06

What changed:
- Added the pure `@loom/core` demo fixture module for *The Letter Under the Flour Bin*, including story config, ordinary record payloads, and the first-segment generation session.
- Re-exported the demo fixture from `packages/core/src/demo/index.ts` and the public `packages/core/src/index.ts` barrel.
- Added focused fixture tests for schema parsing, required record inventory, clean first-segment handoff wording, and the Elin/Niko secret-firewall substrate.

Deviations from original plan:
- Included both optional pressure records (`CLOCK` and `CONSEQUENCE`) instead of omitting the optional clock, to give later stress and capstone tests concrete deadline/exposure pressure without changing any schema or validation rule.

Verification:
- `npx vitest run packages/core/src/demo/demo-fixture.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
