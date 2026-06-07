# SPEC015FIEGUICON-005: Guidance content for knowledge, causal-pressure, and relationship/emotion records

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new guidance-content module (`field-guidance-records.ts`), registry wiring in `field-guidance.ts`, and a scoped coverage test; no production behavior change.
**Deps**: SPEC015FIEGUICON-002

## Problem

The knowledge records (FACT, BELIEF, SECRET), causal-pressure records (EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD), and relationship/emotion records carry the POV/secret-firewall and local-causal-pressure semantics authors most often misuse. SPEC-015 §14.12–§14.20 and §15.3 specify product copy — especially SECRET reveal/clue/forbidden fields, RELATIONSHIP pressure text, and the EMOTION behavioral-pressure enum. This ticket authors guidance for every field of these record types (including nested/list fields) and registers it.

## Assumption Reassessment (2026-06-07)

1. The record types and field names are confirmed in core: `SECRET` (`packages/core/src/records/knowledge.ts`) has `reveal_permission` enum `["locked","clue_only","natural_reveal_allowed","directive_required"]`, `allowed_surface_cues[]`, `forbidden_reveals[]`, `pov_access` `["hidden","can_suspect","knows_partly","knows"]`, `audience_visibility` `["hidden","implied","explicit","ambiguous"]`; `FACT.audience_visibility` `["hidden","implied","explicit","not_applicable"]`; `RELATIONSHIP.pressure_text` (`relationship-emotion.ts`); `EMOTION.behavioral_pressure` is `z.array(z.enum([...18 values]))`; `PLAN.{current_step,can_drive_prose,visibility_to_pov}`, `CLOCK.{current_pressure,tick_trigger,visibility}`, `OBLIGATION.consequence_if_broken`, `CONSEQUENCE.{current_effect,possible_next_effect}`, `OPEN THREAD.possible_pressure_now` (`causal-pressure.ts`). All reachable via `recordEditorDescriptors` (`packages/core/src/records/editor-descriptors.ts`).
2. The copy semantics are `specs/SPEC-015-…md` §14.12–§14.20, §15.3, coverage rules §11 r3,5, and reassessment finding **M5** (`EMOTION.behavioral_pressure[]` is a closed enum array authored as selection guidance, not prose; non-obvious values `accommodate`/`self_soothe`/`ruminate`/`withdraw_socially` get value-level guidance).
3. **Shared boundary under audit**: each entry's `fieldPath` must equal a path emitted by `recordEditorDescriptors` for these types (`SECRET.reveal_permission`, `EMOTION.behavioral_pressure[]`, etc.); the scoped coverage test fails on any mismatch rather than mis-keying the UI lookup.
4. **FOUNDATIONS §15 / §29.6 (POV, knowledge, secrets) — substrate**: SECRET/BELIEF/FACT guidance teaches the firewall (POV vs. audience vs. writer-visible truth; `locked` cannot be overridden by manual directive) but is static copy that never enters a generated prompt and never mutates a record, so it introduces no leakage path. The "no secret-leak language / no prose-as-canon" invariant is enforced by the doctrine-regression suite in SPEC015FIEGUICON-011; this ticket supplies copy that already satisfies it.

## Architecture Check

1. Clustering knowledge + causal-pressure + relationship/emotion in one module (and cast/entity/material in SPEC015FIEGUICON-006) splits the record content into two reviewable diffs while each remains a coherent doctrine group. Keying by canonical path keeps the copy decoupled from the descriptor shape.
2. No backwards-compatibility shim: net-new content; the `field-guidance.ts` change is the additive registry aggregation.

## Verification Layers

1. Coverage for these record types → scoped test iterating `recordEditorDescriptors` field paths for the in-scope types and asserting `getFieldGuidance` is defined for each (nested/list included).
2. Enum value guidance present → test asserting `SECRET.reveal_permission` (all four values), `SECRET.pov_access`, `SECRET.audience_visibility`, `FACT.audience_visibility`, and the non-obvious `EMOTION.behavioral_pressure` values carry `enumValues` entries.
3. Prompt-destination validity → `validatePromptDestinations` returns `[]` for every entry.
4. Secret-firewall doctrine → FOUNDATIONS §15 alignment check: SECRET copy distinguishes POV/audience/writer-visible and states `locked` is directive-proof (re-asserted by the 011 forbidden-phrase test).

## What to Change

### 1. New module `packages/core/src/records/field-guidance-records.ts`

- Author `FieldGuidance` entries (`surface: "record"`) for every field of FACT, BELIEF, SECRET, EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, EMOTION (including nested/list fields).
- High-risk entries with `examples`/`antiExamples` per §14.12–§14.20: `SECRET.reveal_permission` (enum guidance for locked/clue_only/natural_reveal_allowed/directive_required), `SECRET.allowed_surface_cues[]`, `SECRET.forbidden_reveals[]`, `FACT.audience_visibility`, `RELATIONSHIP.pressure_text`, `EMOTION.behavioral_pressure[]` (selection guidance over the enum), `PLAN.current_step`/`PLAN.can_drive_prose`, `CLOCK.current_pressure`/`CLOCK.tick_trigger`, `OBLIGATION.consequence_if_broken`, `CONSEQUENCE.current_effect`/`CONSEQUENCE.possible_next_effect`, `OPEN THREAD.possible_pressure_now`.

### 2. Registry wiring `packages/core/src/records/field-guidance.ts`

- Import `recordGuidance` and spread it into `GUIDANCE_ENTRIES`.

## Files to Touch

- `packages/core/src/records/field-guidance-records.ts` (new)
- `packages/core/test/field-guidance-records.test.ts` (new)
- `packages/core/src/records/field-guidance.ts` (modify — registry aggregation; Deps SPEC015FIEGUICON-002 creates this file)

## Out of Scope

- CAST MEMBER, ENTITY, ENTITY STATUS, LOCATION, OBJECT, VISIBLE AFFORDANCE guidance (SPEC015FIEGUICON-006).
- Generation-brief / story-config guidance (SPEC015FIEGUICON-004).
- Any web rendering (SPEC015FIEGUICON-007+).
- Global cross-surface coverage gate and doctrine-regression suite (SPEC015FIEGUICON-011).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance-records` (vitest, `@loom/core`) — every `recordEditorDescriptors` field path for the in-scope record types resolves to a guidance entry.
2. `npm test -- field-guidance-records` — enum guidance exists for `SECRET.reveal_permission`/`pov_access`/`audience_visibility`, `FACT.audience_visibility`, and the non-obvious `EMOTION.behavioral_pressure` values; `validatePromptDestinations` returns `[]` for every entry.
3. `npm run typecheck && npm run lint` pass.

### Invariants

1. SECRET/FACT/BELIEF guidance keeps POV, audience, and writer-visible truth distinct and never implies a record-mutating or prose-as-canon move.
2. `EMOTION.behavioral_pressure[]` guidance is authored as enum-selection guidance, not free-prose entry guidance.

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-records.test.ts` — record-type coverage (nested/list), enum-guidance presence, destination validity.

### Commands

1. `npm test -- field-guidance-records`
2. `npm test -- field-guidance` — confirms registry aggregation still builds without duplicate `fieldPath`.
3. `npm run typecheck && npm run lint`

## Outcome

Completed: 2026-06-07

Changed:

- Added `packages/core/src/records/field-guidance-records.ts` with guidance entries for FACT, BELIEF, SECRET, EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, and EMOTION descriptor paths.
- Added specific secret-firewall, causal-pressure, relationship-pressure, and emotion-behavior copy for the high-risk fields named in the ticket.
- Added enum guidance for `SECRET.reveal_permission`, `SECRET.pov_access`, `SECRET.audience_visibility`, `FACT.audience_visibility`, and non-obvious `EMOTION.behavioral_pressure[]` values.
- Wired `recordGuidance` into the core guidance registry.
- Added `packages/core/test/field-guidance-records.test.ts` for scoped record coverage, enum-guidance presence, and prompt-destination validity.

Deviations from original plan:

- Used descriptor-derived deterministic generic entries for low-risk fields, with authored overrides for high-risk fields, so coverage tracks the current schema without hand-maintaining repeated boilerplate.

Verification:

- `npm test -- field-guidance-records` passed.
- `npm test -- field-guidance` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
