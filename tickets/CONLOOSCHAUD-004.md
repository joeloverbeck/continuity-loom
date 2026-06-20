# CONLOOSCHAUD-004: Remove CAST VOICE OVERRIDES[].scope

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — removes `cast_voice_overrides[].scope` from core schema/draft/ready/descriptor/guidance; replaces the dynamic scope clause in the shared cast override renderer with a static current-generation label; adds a generation-session migration step; compiled prose + ideation prompts lose only the redundant scope clause
**Deps**: CONLOOSCHAUD-003

## Problem

`cast_voice_overrides[].scope` is constrained to the single literal `current_generation_only` (`packages/core/src/records/generation-brief.ts:92`). The enclosing block is already defined as temporary generation-time state and the renderer labels the material as a current-generation override, so `scope` offers no author choice and is redundantly printed as prompt text. The real authorial control lives in `cast_member_id`, optional `reason`, `applies_to`, and `override_text`; `scope` adds no independent compilation, validation, continuity, voice, prose-quality, or authorial-control function. (Spec §7.)

## Assumption Reassessment (2026-06-20)

1. `scope: z.literal("current_generation_only")` exists at `packages/core/src/records/generation-brief.ts:92` (the `castVoiceOverrideSchema`), with mirrors in `generation-brief-draft.ts`, and is read by the shared `overrideLines` renderer in `packages/core/src/compiler/sections/cast.ts:188`. The retained override fields are `cast_member_id`, `reason`, `applies_to`, `override_text`. Verified by read/grep 2026-06-20.
2. `overrideLines` (`cast.ts:188`) is the single override serializer used by `renderActiveVoicePins` (line 61), `renderCompressedCastBand` (line 91), and `renderDossier` (line 114, under the static "Current generation voice override:" label). `docs/story-record-schema.md` §3.6, `docs/compiler-contract.md`, `docs/prompt-template.md` ("within the scope stated there" wording), `docs/prompt-template-rationale.md` §11, and `docs/ideation-prompt-template.md` are the authority docs. Spec: `specs/continuity-loom-schema-audit-and-changes.md` §7.
3. Cross-artifact boundary under audit: the generation-session override schema (`generation-brief.ts`/`draft`/`readiness`) ↔ the shared `overrideLines` renderer (`cast.ts`, used by active pins, present-minor compressed band, and full dossiers) ↔ the server draft migration (`generation-session-draft-migration.ts`) ↔ the prose + ideation goldens ↔ the schema/contract/template/rationale/ideation authority docs. Because `overrideLines` is shared, the scope-clause removal propagates to both prose and ideation override renderings — this is synchronization, not an ideation redesign.
4. FOUNDATIONS §17 (temporary cast voice overrides are generation-time-scoped instructions; `applies_to` carries the real targeting) and §13 (field economy) motivate removal. §29 clearance: the removal touches no continuity authority, deterministic compilation completeness, fail-closed validation, working-set selection, POV/reveal boundary, accepted-prose exclusion, or local ownership.
5. Deterministic-compilation surface (§8/§29.4): the golden output must lose only the redundant scope clause while the universal prompt contract stays complete via the same-change template/contract/rationale edit. `applies_to` must still gate the affected voice dimensions. No secret-firewall (§15) path is touched.
6. Output-schema modification: removes `scope` from the `cast_voice_overrides` item (storage + draft + ready). Consumers: the descriptor, field guidance, `overrideLines`, web override control, the server migration, and override-rendering tests. All updated here; breaking storage change handled by the migration.
7. Removed-symbol blast radius (grep 2026-06-20): `cast_voice_overrides[].scope` is defined in `generation-brief.ts`/`generation-brief-draft.ts`, read in `cast.ts` `overrideLines`, surfaced in the web override UI, and asserted in `compiler-cast-sections.test.ts`, `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `generation-session-draft-migration.test.ts`, and `records.test.ts`. (The literal `scope` is generic; scope the grep to the `cast_voice_overrides` context to avoid unrelated matches.)
8. Adjacent contradiction (required consequence): `docs/prompt-template.md` says "within the scope stated there"; after removal this must be reworded to rely on the listed `applies_to` functions and the current-generation block semantics. Because `overrideLines` is shared, the ideation `<present_minor_cast>` and `<active_cast_full_dossiers>` renderings also drop the scope clause — the ideation golden (`golden-ideation.prompt.txt`) and `docs/ideation-prompt-template.md` must sync in the same change.
9. Mismatch + correction: none. Spec references validated 1:1 against the codebase.

## Architecture Check

1. Deleting the one-value `scope` and keeping a static "Current generation voice override" label is cleaner than retaining a fixed literal that re-states the block's intrinsic temporariness: it removes a duplicate path while preserving explicit temporary authorial control via `applies_to`/`override_text`. Editing the shared `overrideLines` once propagates the fix consistently to active, present-minor, and dossier renderings.
2. No backwards-compatibility aliasing/shims. `scope` is deleted; the temporariness is documented as structural, not re-encoded under another field.

## Verification Layers

1. `cast_voice_overrides[].scope` is gone from schema/draft/ready/descriptor/guidance and the renderer -> codebase grep-proof.
2. Legacy draft migrates, stripping only `cast_voice_overrides[*].scope` while preserving all other override data and order -> schema validation (`generation-session-draft-migration.test.ts`).
3. Override still renders for active/full and present-minor targets; `applies_to` still gates the affected dimensions; the golden loses only the scope clause -> compiler section + golden tests (prose + ideation).
4. No override persists into a durable CAST MEMBER record -> FOUNDATIONS §17 alignment check in the cast-section test.

## What to Change

### 1. Core schema, draft, ready, descriptor, guidance

Remove `scope` from the `castVoiceOverrideSchema` in `generation-brief.ts`, plus the draft (`generation-brief-draft.ts`) and ready (`generation-brief-readiness.ts`) shapes, the descriptor (`generation-brief-descriptors.ts`), and the field-guidance entry (`field-guidance-brief-config.ts`). The generation-time-only rule remains structural and documented.

### 2. Compiler — static label, no dynamic scope

In `cast.ts` `overrideLines`, stop emitting the dynamic `scope` value; retain a static "Current generation voice override" label so active, present-minor, and dossier renderings all show the override as temporary without a per-item scope clause.

### 3. Server migration

In `generation-session-draft-migration.ts`, add an idempotent step stripping `cast_voice_overrides[*].scope` before strict parse, preserving all other override data and item order.

### 4. Web

Remove any one-option scope control/readout from `GenerationBriefView.tsx` (and `field-help/EnumGuidance.tsx` if it carries the scope enum). The UI should make temporariness clear at the block level.

### 5. Authority docs (§8 co-land)

`docs/story-record-schema.md` §3.6 (delete the field; state the block is intrinsically current-generation-only); `docs/compiler-contract.md` (remove dynamic scope as a source/rendered clause); `docs/prompt-template.md` (replace "within the scope stated there" with wording based on `applies_to` + current-generation block semantics); `docs/prompt-template-rationale.md` §11 (remove `scope` from the shape description; retain the non-durable-override rationale); `docs/ideation-prompt-template.md` (note the scope clause drops from the ideation present-minor and full-dossier renderings). Update the prose golden (`golden-first-segment.prompt.txt`) and the ideation golden (`golden-ideation.prompt.txt`).

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-readiness.ts` (modify)
- `packages/core/src/records/generation-brief-descriptors.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/compiler/sections/cast.ts` (modify)
- `packages/server/src/generation-session-draft-migration.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/field-help/EnumGuidance.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-cast-sections.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/server/src/generation-session-draft-migration.test.ts` (modify)
- `packages/core/test/records.test.ts` (modify)

## Out of Scope

- Retaining `scope` or re-encoding temporariness under another field.
- Changing `applies_to` gating behavior or any other override field.
- Persisting any override into a durable CAST MEMBER record.
- The voice-pressure normalization (CONLOOSCHAUD-003) and entity/location delivery (CONLOOSCHAUD-005).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-cast-sections compiler-golden compiler-ideation-golden` — override renders for active/full and present-minor targets with a static label and no per-item scope clause; `applies_to` still gates dimensions; prose + ideation goldens lose only the scope clause.
2. `npm test -- generation-session-draft-migration` — `cast_voice_overrides[*].scope` stripped, all other override data and order preserved, rerun a no-op.
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. `scope` does not appear in the `cast_voice_overrides` schema, renderer, or guidance after the change (grep-proof in context).
2. Temporary overrides never persist into durable CAST MEMBER records; `applies_to` remains the override targeting authority.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-cast-sections.test.ts` — assert the static current-generation label renders and no dynamic scope clause appears, across active/full and present-minor targets.
2. `packages/server/src/generation-session-draft-migration.test.ts` — scope-strip case + other-fields-preserved case + idempotence.

### Commands

1. `npm test -- compiler-cast-sections compiler-golden compiler-ideation-golden generation-session-draft-migration`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `! grep -n "scope" packages/core/src/records/generation-brief.ts` (grep-proof in the schema's context; run after `npm run build`).
