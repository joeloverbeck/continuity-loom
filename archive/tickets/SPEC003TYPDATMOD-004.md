# SPEC003TYPDATMOD-004: CAST MEMBER rich dossier schema

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` CAST MEMBER payload schema (required core + all optional extended fields); registry registration; reference extractor; exports from `packages/core/src/index.ts`.
**Deps**: SPEC003TYPDATMOD-001

## Problem

CAST MEMBER is the rich-record exception: active/onstage cast need full dossiers because voice, behavior, body, perception, and pressure response are continuity. The schema must allow every populated core and extended field with **no silent drop** (FOUNDATIONS §17, §29.3). Phase 3 defines the shape so Phase-5 editors and the Phase-7 compiler have a stable target.

## Assumption Reassessment (2026-06-05)

1. The substrate from SPEC003TYPDATMOD-001 exists (`registry.ts`, `metadata.ts`, `references.ts`, exports). This ticket registers one large definition.
2. Field names from `docs/story-record-schema.md` §5. Required core (§5.1): `entity_id`, `identity{one_line,public_face,private_pressure}`, `voice_anchor{…14 fields…}`, `pressure_behavior_core{cornered,tempted_or_offered_power,protecting_attachment}`, `body_presence_core{physicality,habitual_gestures_or_presence,social_presentation}`, `agency_core{default_strategy,risk_style}`. Optional extended (§5.2): `world_pressure_core`, **`relational_charge`**, **`moral_psychological_edge`**, `voice_extended`, `body_and_presence_extended`, `perception_and_embodiment`, `pressure_behavior_extended`, `agency_and_planning_extended`, `sample_utterances`. The reassessment (this session) confirmed `relational_charge` and `moral_psychological_edge` are top-level §5.2 fields the original spec list omitted — they MUST be present.
3. Removed field `additional_do_not_write` (§5.2 "Removed field") must NOT be added.
4. Cross-schema boundary: CAST MEMBER is the schema most directly named by FOUNDATIONS §17 and §29.3. Restated: the schema is permissive (all extended fields optional, none dropped); compression is a compiler concern (Phase 7) the data model must never bake in. Sample utterances carry `copy_policy` defaulting to `never_copy_verbatim` (§5.4).
5. Schema-extension audit: CAST MEMBER is a brand-new schema (no existing consumer to break); the extension is additive to the package surface. `entity_id` is its sole reference projection (link to ENTITY). CAST MEMBER carries no `status` field → `NULL` status projection.

## Architecture Check

1. Splitting CAST MEMBER into its own ticket (vs. bundling with ENTITY) keeps the largest schema a self-contained reviewable diff and isolates the §17/§29.3 "no field dropped" invariant.
2. No backwards-compatibility shims; no `additional_do_not_write` alias.

## Verification Layers

1. Schema covers every §5.1 core + §5.2 optional field with none dropped -> schema validation test asserting a fully-populated dossier (all extended fields incl. `relational_charge`, `moral_psychological_edge`) round-trips with no field stripped.
2. Optional extended fields are truly optional -> test accepting a core-only dossier.
3. `additional_do_not_write` is absent -> grep-proof (`grep -c additional_do_not_write packages/core/src/records/cast-member.ts` = 0).
4. `entity_id` reference projection emitted -> `extractReferences` unit test.

## What to Change

### 1. CAST MEMBER schema

Add `packages/core/src/records/cast-member.ts`: Zod `.strict()` schema with required core (§5.1) and all optional extended fields (§5.2), `sample_utterances` with `copy_policy` default `never_copy_verbatim`.

### 2. Registry + extractor

Register CAST MEMBER (status: none). Extractor emits `{ refRole: "entity_id", targetId }`.

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/cast-member.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register CAST MEMBER)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/cast-member.test.ts` (new)

## Out of Scope

- Active cast voice pressure pins (compiled, not durable) — Phase 7.
- Compression/inclusion-band logic — Phase 7 compiler.
- CAST MEMBER custom editor — Phase 5.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — full dossier (all extended fields) round-trips with no field dropped; core-only dossier accepted; unknown key rejected.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Schema includes `relational_charge` and `moral_psychological_edge` (§5.2) and excludes `additional_do_not_write`.
2. No populated extended field is silently stripped on parse (§17, §29.3).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/cast-member.test.ts` — fully-populated + core-only acceptance, unknown-key rejection, `entity_id` reference extraction, `additional_do_not_write` absence.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented the CAST MEMBER rich dossier schema with required core sections, optional extended fields, sample utterance copy policy, registry entry, and entity reference projection.

Deviation: optional extended sections are preserved as strict top-level fields containing structured JSON objects; richer internal validation remains later-editor work.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
