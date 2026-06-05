# SPEC005CUSCASGEN-001: Core CAST MEMBER section model

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` pure helper (`cast-member-sections.ts`) + new exports in `packages/core/src/index.ts`
**Deps**: None

## Problem

The custom CAST MEMBER editor (SPEC005CUSCASGEN-005) needs a deterministic, registry-derived grouping of the CAST MEMBER field descriptors into the navigable sections `UI-WORKFLOWS.md` names, in the `story-record-schema.md` §5.5 core-first render order, covering every dossier field exactly once. Today only the flat `recordEditorDescriptors["CAST MEMBER"]` list exists (`packages/core/src/records/editor-descriptors.ts`) — an undifferentiated, required-first field array with no section structure. This ticket adds the pure section model in `@loom/core` so the React editor consumes a single ordering source rather than re-deriving field order in the UI.

## Assumption Reassessment (2026-06-05)

1. `getEditorDescriptor("CAST MEMBER")` / `recordEditorDescriptors` exist in `packages/core/src/records/editor-descriptors.ts:130-144` and yield `FieldDescriptor[]` (required-first). The CAST MEMBER top-level fields are confirmed in `packages/core/src/records/cast-member.ts:79-145` (`entity_id`, `identity`, `voice_anchor`, `pressure_behavior_core`, `body_presence_core`, `agency_core`, optional `world_pressure_core`/`relational_charge`/`moral_psychological_edge`/`voice_extended`/`body_and_presence_extended`/`perception_and_embodiment`/`pressure_behavior_extended`/`agency_and_planning_extended`/`sample_utterances`). This helper groups existing descriptors; it adds no fields.
2. §5.5 render order in `docs/story-record-schema.md:496-512` is `identity → voice_anchor → voice_extended/speech-pattern → pressure_behavior_core → body_presence_core → agency_core → remaining optional extended in schema order → selected sample_utterances last`, and §5.5 states "Core-first render order is a salience rule, not a compression rule." `docs/requirements-version-1/UI-WORKFLOWS.md:92-105` names the 10 navigable sections.
3. Shared boundary under audit: the `FieldDescriptor` contract from `editor-descriptors.ts` is the input; the sole consumer is web ticket SPEC005CUSCASGEN-005. The section model must place every descriptor field **exactly once** — no omission, no duplication.
4. (FOUNDATIONS §17 / §8.8) Character voice is continuity; active cast must not be silently compressed. The section model is presentation-only: core-first ordering is a salience rule (per §5.5), never a compression; every populated and unpopulated field receives a placement. Per SPEC-005 (resolved finding M1) `anti_repetition_warnings` lives inside `voice_anchor` (`cast-member.ts:104`) and `anti_generic_warnings` inside `voice_extended` (`cast-member.ts:14`); both render **in-place within their parent groups**, and "anti-generic and anti-repetition warnings" is a navigation cue, not a field-relocating section.
5. (Deterministic-compilation substrate) This helper is pure data over descriptors and is **not** the Phase-7 deterministic compiler; the §8 compiler that renders the dossier into prompt sections remains Phase 7. The helper introduces no nondeterminism (order derives from stable schema descriptor order) and no §15 secret-leakage path (it groups field *names*, never values).

## Architecture Check

1. A pure core helper keeps section ordering deterministic and unit-testable inside `@loom/core` (the purity boundary) and reused by the React editor without duplicating ordering logic. Deriving from `recordEditorDescriptors` (the single descriptor source) avoids a second hand-maintained field list that could drift from `castMemberSchema`.
2. No backwards-compatibility aliasing or shims — a net-new export only.

## Verification Layers

1. Every CAST MEMBER field appears exactly once across sections → core unit test asserting the flattened section field set equals the descriptor field set (no omission, no duplication).
2. Section/field order follows §5.5 with warnings nested → core unit test asserting order matches the §5.5 sequence and that `anti_repetition_warnings`/`anti_generic_warnings` sit under `voice_anchor`/`voice_extended`.
3. Core purity preserved → `packages/core/test/boundary.test.ts` stays green (no `node:*` / framework imports added).

## What to Change

### 1. New section-model helper

Add `packages/core/src/records/cast-member-sections.ts` exporting a `CastMemberSection` type and `castMemberSectionModel(): CastMemberSection[]`, deriving from `getEditorDescriptor("CAST MEMBER")`. Each section carries an id/label, an ordered `FieldDescriptor[]`, and a required-core vs optional-extended flag. Order sections/fields per §5.5; keep `anti_repetition_warnings` within the `voice_anchor` group and `anti_generic_warnings` within the `voice_extended` group.

### 2. Export from index

Add the helper and its type to `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/cast-member-sections.ts` (new)
- `packages/core/test/cast-member-sections.test.ts` (new)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- React rendering of the sections (SPEC005CUSCASGEN-005).
- Current-voice-pressure-pin computation / compiled prompt ordering (Phase 7).
- Any new or renamed schema field.

## Acceptance Criteria

### Tests That Must Pass

1. New `cast-member-sections.test.ts`: the flattened section field set equals the CAST MEMBER descriptor field set (every field exactly once).
2. New `cast-member-sections.test.ts`: section/field order matches §5.5, with warning fields nested under their parent groups.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green (including `packages/core/test/boundary.test.ts`).

### Invariants

1. The section model covers every CAST MEMBER descriptor field exactly once — no omission, no duplication.
2. The helper adds no new fields and produces a pure, deterministic order.

## Test Plan

### New/Modified Tests

1. `packages/core/test/cast-member-sections.test.ts` — field-coverage (exactly-once), §5.5 order, and warning-field nesting.

### Commands

1. `npm test` — builds `@loom/core` first, then runs Vitest across packages (includes the new core test + boundary test).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the section model is pure `@loom/core` logic, so the core unit test inside `npm test` is the correct verification surface; `npx vitest run packages/core/test/cast-member-sections.test.ts` (from `packages/core`) filters to it during development.
