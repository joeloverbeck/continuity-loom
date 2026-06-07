# SPEC015FIEGUICON-006: Guidance content for cast-member dossier and entity/space-material records

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new guidance-content module (`field-guidance-cast-material.ts`), registry wiring in `field-guidance.ts`, and a scoped coverage test; no production behavior change.
**Deps**: SPEC015FIEGUICON-002

## Problem

The cast-member dossier carries the product's deepest continuity surface — durable voice identity, sample utterances, and anti-generic pressure — and the entity/space-material records carry physical-continuity state. SPEC-015 §14.16–§14.17 and §15.3 specify product copy, and reassessment finding **A2** requires the cast coverage to enumerate via the existing `castMemberSectionModel()` so the two emphasis-only paths are not missed. This ticket authors guidance for every field of CAST MEMBER, ENTITY, ENTITY STATUS, LOCATION, OBJECT, and VISIBLE AFFORDANCE, and registers it.

## Assumption Reassessment (2026-06-07)

1. Field names confirmed in core: `CAST MEMBER` (`recordType: "CAST MEMBER"`, with a space, `packages/core/src/records/cast-member.ts`) has nested `voice_anchor.{core_voice,rhythm_and_syntax,…,must_preserve[],must_avoid[],anti_repetition_warnings[]}`, `identity.*`, `pressure_behavior_core/extended`, `body_presence_core/extended`, `agency_core/extended`, `world_pressure_core`, `perception_and_embodiment`, `voice_extended.{…,anti_generic_warnings[]}`, and `sample_utterances[].copy_policy` enum `["never_copy_verbatim","may_reuse_cadence_not_text","canonical_phrase"]`. `castMemberSectionModel()` (`packages/core/src/records/cast-member-sections.ts`) exposes section `fields` plus `emphasisFieldPaths: ["voice_anchor.anti_repetition_warnings","voice_extended.anti_generic_warnings"]`. `OBJECT.visibility_to_pov` `["visible","hidden","inferred","unknown"]` and `OBJECT.durability` `["local_texture","continuity_relevant","major"]`; `VISIBLE AFFORDANCE.{risk,durability}`, `ENTITY STATUS.{life,agency,visibility_to_pov}` (`entity.ts`, `space-material.ts`).
2. Copy semantics are `specs/SPEC-015-…md` §14.16–§14.17, §15.3, coverage rule §11 r4, and reassessment finding **A2** (enumerate cast fields via `castMemberSectionModel()` + `emphasisFieldPaths`).
3. **Shared boundary under audit**: each cast entry's `fieldPath` must match both the `recordEditorDescriptors` enumeration for `CAST MEMBER` and the `castMemberSectionModel()` section/emphasis paths; the scoped coverage test asserts both so the emphasis-only paths (`…voice_anchor.anti_repetition_warnings`, `…voice_extended.anti_generic_warnings`) cannot slip through.
4. **FOUNDATIONS §17 (character voice is continuity) / §15 (POV) — substrate**: cast guidance teaches that the voice anchor is durable identity that must not be silently compressed for active/onstage cast and that sample utterances default to never-copy-verbatim; entity/object visibility guidance teaches POV perceptibility. This is static copy that never enters a prompt or mutates a record. The no-prose-as-canon / no-secret-leak invariants are enforced by the doctrine-regression suite in SPEC015FIEGUICON-011.

## Architecture Check

1. Pairing the cast dossier with entity/space-material in one module (knowledge/pressure/relationship live in SPEC015FIEGUICON-005) keeps each record content diff reviewable while grouping the two surfaces (rich dossier + physical-continuity records) that share visibility/perception semantics. Enumerating cast coverage through `castMemberSectionModel()` reuses the existing section authority rather than re-deriving section membership.
2. No backwards-compatibility shim: net-new content; the `field-guidance.ts` change is the additive registry aggregation.

## Verification Layers

1. Cast coverage via section model → scoped test iterating `castMemberSectionModel()` section `fields` ∪ `emphasisFieldPaths` (and the `recordEditorDescriptors` CAST MEMBER nested paths) asserting `getFieldGuidance` is defined for each, including the two emphasis-only paths.
2. Entity/material coverage → test iterating `recordEditorDescriptors` paths for ENTITY, ENTITY STATUS, LOCATION, OBJECT, VISIBLE AFFORDANCE asserting guidance exists.
3. Enum value guidance present → test asserting `CAST MEMBER.sample_utterances[].copy_policy` (all three values), `OBJECT.visibility_to_pov`/`durability`, `VISIBLE AFFORDANCE.durability`, `ENTITY STATUS.{life,agency,visibility_to_pov}` carry `enumValues`.
4. Prompt-destination validity → `validatePromptDestinations` returns `[]` for every entry (cast dossiers map to `{active_onstage_full_cast_dossiers}` / `rich_active_cast_dossiers`).

## What to Change

### 1. New module `packages/core/src/records/field-guidance-cast-material.ts`

- Author `FieldGuidance` entries (`surface: "record"`) for every field of CAST MEMBER (including all nested voice/pressure/body/agency groups, `sample_utterances[]`, and the emphasis paths) and ENTITY, ENTITY STATUS, LOCATION, OBJECT, VISIBLE AFFORDANCE.
- High-risk entries with `examples`/`antiExamples` per §14.16–§14.17: `CAST MEMBER.voice_anchor.*` (durable voice, not silently compressed; behaviorally useful constraints, not generic adjectives), `CAST MEMBER.sample_utterances[].copy_policy` (enum guidance for the three copy policies), plus §15.3 enum guidance for OBJECT/VISIBLE AFFORDANCE/ENTITY STATUS visibility and durability.

### 2. Registry wiring `packages/core/src/records/field-guidance.ts`

- Import `castMaterialGuidance` and spread it into `GUIDANCE_ENTRIES`.

## Files to Touch

- `packages/core/src/records/field-guidance-cast-material.ts` (new)
- `packages/core/test/field-guidance-cast-material.test.ts` (new)
- `packages/core/src/records/field-guidance.ts` (modify — registry aggregation; Deps SPEC015FIEGUICON-002 creates this file)

## Out of Scope

- Knowledge / causal-pressure / relationship-emotion record guidance (SPEC015FIEGUICON-005).
- Generation-brief / story-config guidance (SPEC015FIEGUICON-004).
- Any web rendering, incl. the cast-section UI integration (SPEC015FIEGUICON-008).
- Global cross-surface coverage gate and doctrine-regression suite (SPEC015FIEGUICON-011).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance-cast-material` (vitest, `@loom/core`) — every `castMemberSectionModel()` field path and `emphasisFieldPath`, and every ENTITY/ENTITY STATUS/LOCATION/OBJECT/VISIBLE AFFORDANCE descriptor path, resolves to a guidance entry.
2. `npm test -- field-guidance-cast-material` — enum guidance exists for `sample_utterances[].copy_policy`, OBJECT/VISIBLE AFFORDANCE durability/visibility, and ENTITY STATUS life/agency/visibility; `validatePromptDestinations` returns `[]` for every entry.
3. `npm run typecheck && npm run lint` pass.

### Invariants

1. The two emphasis-only cast paths (`…voice_anchor.anti_repetition_warnings`, `…voice_extended.anti_generic_warnings`) each have guidance.
2. Cast voice-anchor guidance states the anchor is durable identity that is not silently compressed for active/onstage cast.

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-cast-material.test.ts` — cast section-model coverage (incl. emphasis paths), entity/material coverage, enum-guidance presence, destination validity.

### Commands

1. `npm test -- field-guidance-cast-material`
2. `npm test -- field-guidance` — confirms registry aggregation still builds without duplicate `fieldPath`.
3. `npm run typecheck && npm run lint`
