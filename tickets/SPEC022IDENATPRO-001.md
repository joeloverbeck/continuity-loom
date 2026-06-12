# SPEC022IDENATPRO-001: Ideation section restructure — drop the précis, add the relationship/emotion section

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — restructures ideation prompt compilation (`IDEATION_SECTION_ORDER`, a new `<relationship_and_emotion_pressure>` ideation section, a slim ideation `<physical_continuity>` variant, an ideation-only un-gating of the `locations`/`objects` sub-blocks), refreshes the ideation golden, and co-lands `docs/compiler-contract.md` + `docs/ideation-prompt-template.md`; the prose prompt is unchanged.
**Deps**: None

## Problem

The ideation prompt reuses the prose prompt's `<active_working_set>` précis (~25% of a real mid-story prompt), which restates records already rendered in the detail sections — wasted distractor mass for a consultant emitting ~5 premise ideas (SPEC-022 §Problem Statement #1). This ticket performs the structural half of the ideation-native restructure (SPEC-022 §B / D2): it drops the précis, relocates the records it uniquely surfaced into a dedicated section so nothing is silently removed, slims the duplicated physical-continuity descriptions, and moves the task frame to the top. It deliberately keeps today's full-label citation keys and adds **no** inline key prefixes — short keys and keyed render sites land in SPEC022IDENATPRO-002, which depends on this restructure because single-site keying is only correct once `<active_working_set>` is gone.

## Assumption Reassessment (2026-06-12)

1. `IDEATION_SECTION_ORDER` (`packages/core/src/compiler/template-constants.ts:34-61`) currently lists `active_working_set` (line 45) and renders `ideation_role` near the end (line 57); the order is consumed by `renderIdeationPrompt` (`packages/core/src/compiler/compile-prompt.ts:127-135`) which maps each id through `renderSection`. `<active_working_set>`'s template (`template-constants.ts:205-229`) is the **only** ideation render site for RELATIONSHIP/EMOTION records via its `{relationship_emotion_pressure}` lane (resolver `packages/core/src/compiler/sections/pressure.ts:39-49`, types `["RELATIONSHIP","EMOTION"]`); its other lanes (action/knowledge/material/voice) restate records that already render in their detail sections.
2. SPEC-022 §B (the new 26-entry order) and §Scope decisions confirm `active_cast_full_dossiers` stays byte-identical and the prose `SECTION_ORDER` (`template-constants.ts:1-30`) is untouched. `active_working_set` remains a prose section (prose `SECTION_ORDER` line 14), so it is removed **from the ideation order only**, not deleted.
3. Cross-artifact boundary under audit: the ideation prompt-section contract spans `template-constants.ts` (`IDEATION_SECTION_ORDER` + templates), `compile-prompt.ts` (render branches), `docs/compiler-contract.md` §3.2, and `docs/ideation-prompt-template.md` §Section Order. §8's same-revision drift rule binds all four — they move together in this ticket.
4. §8 deterministic compilation / §29.3 no-silent-removal (the FOUNDATIONS surfaces this ticket touches): the restructure must add no LLM intermediary and keep identical inputs ⇒ identical prompt; and **every record `<active_working_set>` summarized must still render at exactly one authoritative site.** RELATIONSHIP/EMOTION move to the new `<relationship_and_emotion_pressure>` section; action/knowledge/material-pressure records already render in their detail sections; voice-pressure pins are generation-session-derived, not records, so dropping them removes no selected record.
5. Prompt-section schema extension: this adds the `relationship_and_emotion_pressure` ideation section id to `IdeationSectionId`. Consumers of `IDEATION_SECTION_ORDER` are `renderIdeationPrompt` + `renderSection` (one package, `compile-prompt.ts`) and the goldens. The addition is ideation-only; the prose `PromptSectionId` union and `SECTION_ORDER` are not extended.
6. Required-consequence coupling (no silent retcon — §20): slimming `<physical_continuity>` to status lines **must co-land with** un-gating the ideation `locations`/`objects` sub-blocks. `renderPhysicalContinuity` (`packages/core/src/compiler/sections/records-tail.ts:145-170`) is today the only site rendering LOCATION/OBJECT *descriptions* for records whose `status` is not `active`/`available` (the `locations`/`objects` resolvers gate on `activeStatus`, `records-tail.ts:80,90,226`). Slimming physical-continuity without un-gating would drop those descriptions entirely (§29.3). Both changes are in this ticket's scope; the keyed-coverage payoff is realized in -002.

## Architecture Check

1. Relocating RELATIONSHIP/EMOTION into a dedicated section (rather than leaving a stripped-down working set) keeps the "one authoritative render site per record" model the keying ticket depends on, and reuses the existing `{relationship_emotion_pressure}` resolver rather than deriving relationship pressure a second time. The new section is rendered via a `renderTemplate` branch (resolving `{relationship_emotion_pressure}`), not a raw static `IDEATION_SECTION_TEMPLATES` entry — those return text unresolved, which would emit a literal `{relationship_emotion_pressure}` (the same trap SPEC-022 §C flags for placeholder-bearing variants).
2. No backwards-compatibility aliasing or shims: `active_working_set` is removed from the ideation order outright (no dual path); the prose prompt keeps its own unchanged `SECTION_ORDER`. The ideation slim/un-gated rendering is reached by threading the existing prose/ideation signal `renderSection` already has, not a parallel renderer fork.

## Verification Layers

1. No record silently removed (§29.3) -> codebase grep-proof: every type in `<active_working_set>`'s lanes renders at a detail site — assert in the golden that RELATIONSHIP/EMOTION appear in `<relationship_and_emotion_pressure>` and that no selected record type lost its site.
2. Prose prompt untouched (§ Out of Scope) -> `compiler-golden.test.ts` (prose golden) byte-identical.
3. Physical-continuity dedup + no description loss -> golden assertion: `<physical_continuity>` carries no LOCATION/OBJECT description text, and an inactive LOCATION/OBJECT now renders in `<locations_objects_affordances>`.
4. Deterministic compilation (§8) -> two compiles from identical inputs produce identical ideation prompts (determinism assertion in the golden test).

## What to Change

### 1. `IDEATION_SECTION_ORDER` and the new section template

In `template-constants.ts`: rebuild `IDEATION_SECTION_ORDER` per SPEC-022 §B — move `ideation_role` to position 1; remove `active_working_set`; insert `relationship_and_emotion_pressure` after `active_open_threads` and before `active_cast_full_dossiers`. Add `relationship_and_emotion_pressure` to `IdeationSectionId`. Add a `<relationship_and_emotion_pressure>` template that wraps the existing `{relationship_emotion_pressure}` placeholder (rendering RELATIONSHIP and EMOTION records, unkeyed for now).

### 2. Render branch + slim physical-continuity + un-gated locations/objects

In `compile-prompt.ts`: add a `renderSection` branch for `relationship_and_emotion_pressure` that calls `renderTemplate(<the new template>, snapshot)`. Thread the existing prose/ideation signal (the boolean `renderSection` already receives, `compile-prompt.ts:131`) into `renderPhysicalContinuity` and the `locations`/`objects` rendering. In `records-tail.ts`: make `renderPhysicalContinuity` emit, for ideation, status lines only — time/location/statuses/routes-exits/entity-object status — and drop the LOCATION/OBJECT description re-render (`records-tail.ts:184-189`); and make the `locations`/`objects` sub-blocks render **all** selected LOCATION/OBJECT records for ideation (status shown as a label) by not applying the `activeStatus` gate on the ideation path. The prose path keeps the gate and the full physical-continuity rendering.

### 3. Golden + contract/template docs (same revision, §8)

Refresh `golden-ideation.prompt.txt`; update `compiler-ideation-golden.test.ts` assertions. Update `docs/compiler-contract.md` §3.2 (drop `active_working_set` from the ideation order; add the new section; note the slim physical-continuity variant and the ideation locations/objects un-gating) and `docs/ideation-prompt-template.md` §Section Order to match.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/ideation-prompt-template.md` (modify)

## Out of Scope

- Short citation keys and inline keyed render sites (SPEC022IDENATPRO-002).
- Ideation-framed contract variants (`ideation_authority_hierarchy`, content-policy/handoff/directive labels) and the distinctness instruction (SPEC022IDENATPRO-003).
- UI grounds provenance (SPEC022IDENATPRO-004).
- Any change to the prose prompt, cast dossier rendering, record selection, slot assignment, operator taxonomy, dormancy logic, request shape, validation gating, or quarantine rules (SPEC-022 §Out of Scope).
- De-duplicating `pov_knowledge_constraints` (retained knowledge-boundary surface).

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-ideation-golden.test.ts`: the ideation prompt contains no `<active_working_set>`; `<relationship_and_emotion_pressure>` is present and renders a sampled RELATIONSHIP and a sampled EMOTION record; `<physical_continuity>` contains no LOCATION/OBJECT description text; a sampled inactive LOCATION/OBJECT renders in `<locations_objects_affordances>`; `<ideation_role>` is the first section.
2. `compiler-golden.test.ts` (prose golden) is byte-identical — proves the prose prompt is untouched.
3. `npm test` (builds `@loom/core`, runs full Vitest) passes; `npm run lint`; `npm run typecheck`.

### Invariants

1. Every record type previously surfaced only via `<active_working_set>` (RELATIONSHIP, EMOTION) renders at exactly one ideation site; no selected record is dropped (§29.3).
2. Identical inputs + versions ⇒ byte-identical ideation prompt (§8); the slim physical-continuity and locations/objects un-gating apply to the ideation prompt only.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ideation-golden.test.ts` — add the structural assertions above; refresh the embedded golden expectations.
2. `packages/core/test/golden-ideation.prompt.txt` — regenerate against the restructured ideation prompt.

### Commands

1. `npx vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test`
3. Narrower core-only run (`npx vitest run packages/core/...`) is the correct boundary while iterating because this ticket changes no server/web surface; the full `npm test` is the merge gate.
