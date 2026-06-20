# CONLOOSCHAUD-001: Remove STORY CONTRACT.continuity_philosophy

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — removes `storyContract.continuity_philosophy` from the core global-config schema, its descriptor, field guidance, demo fixture, and the story-config UI; adds a global-config migration step (live + orphan rows); compiled prompt output is unchanged
**Deps**: None

## Problem

`STORY CONTRACT.continuity_philosophy` is constrained to the single literal `continuity_first` (`packages/core/src/records/global-config.ts`). The story-config editor cannot offer a meaningful alternative, the deterministic compiler never reads the stored value, and continuity-first / no-branches doctrine already lives in the constitutional static prompt authority. The field is a fixed persisted echo of the constitution: it is not authorial control, and a presence/strict-schema requirement on it would be circular. Keeping it creates a second apparent authority path — an agent may infer that changing story configuration could alter continuity philosophy when no supported alternative exists. This is the same defect class as the `prose_preferences` removal precedent (`archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`), smaller in scope. (Spec §4.)

## Assumption Reassessment (2026-06-20)

1. `continuity_philosophy` exists today in `packages/core/src/records/global-config.ts` (storyContract Zod object + inferred type), `packages/core/src/records/story-config-descriptors.ts` (editor descriptor), `packages/core/src/records/field-guidance-brief-config.ts` (guidance entry), `packages/core/src/demo/letter-under-flour-bin.ts` (fixture key), and `packages/web/src/config/StoryConfigEditor.tsx` (one-option control). Verified by grep on 2026-06-20.
2. `docs/story-record-schema.md` §2.1 documents the field; `docs/compiler-contract.md` carries no resolver for it (it is not a placeholder source). The removal precedent and its same-change cascade discipline are recorded in `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`. The change proposal is `specs/continuity-loom-schema-audit-and-changes.md` §4.
3. Cross-artifact boundary under audit: the STORY CONTRACT storage schema (`global-config.ts`, `.strict()`) ↔ its server migration (`packages/server/src/global-config-migration.ts`) ↔ the story-config UI (`StoryConfigEditor.tsx`) ↔ the schema authority doc (`docs/story-record-schema.md` §2.1). A strict-schema removal without a co-landing migration breaks opening legacy projects (the SPEC-024 failure mode).
4. FOUNDATIONS §13 (field economy) is the motivating principle: every field must earn its place through deterministic compilation, deterministic validation, continuity interpretation, voice/behavior preservation, prose-quality protection, or authorial control. `continuity_philosophy` clears none — it is a fixed literal with no compiler read. §29.5 also bars keeping a hollow/fixed-literal readiness requirement.
5. Deterministic-compilation surface (§8): the field has no compiler resolver, so removal must leave compiled prompt text byte-identical. No secret-firewall (§15) surface is touched; the migration is a local stored-payload transform with no logging/key path. The golden (`packages/core/test/golden-first-segment.prompt.txt`) must not change.
6. Output-schema modification: this removes a member from the STORY CONTRACT global-config schema. Consumers of that schema are the descriptor, field guidance, demo fixture, story-config UI, server migration/parse path, and tests asserting the field. All are updated in this ticket; this is a breaking storage change handled by the migration, not an additive one.
7. Removed-symbol blast radius (grep 2026-06-20): `continuity_philosophy` appears in `global-config.ts`, `story-config-descriptors.ts`, `field-guidance-brief-config.ts`, `letter-under-flour-bin.ts`, `StoryConfigEditor.tsx`, `docs/story-record-schema.md`, and ~20 test files (`packages/core/test/records.test.ts`, `validation-matrix-*.test.ts`, `validation-completeness.test.ts`, `compiler-front-sections.test.ts`, `compiler-golden.test.ts`, `validation-blockers.test.ts`, `validation-clarity-invariants.test.ts`, `validation-stress-mapping.test.ts`; server `global-config-migration.test.ts`, `story-config-routes.test.ts`, `project-store.test.ts`, `compile-routes.test.ts`, `generate-routes*.test.ts`, `validation-routes.test.ts`, `ideate-routes.test.ts`, `phase4-gate.e2e.test.ts`, `generation-brief-draftability.e2e.test.ts`; web `StoryConfigEditor.test.tsx`). Field paths are derived programmatically (the identifier is not hard-coded in `field-path-enumeration.ts`/`field-paths.ts`), so schema removal auto-drops it from enumeration; `field-paths.test.ts` count assertions update with this change. `dist/**` and `packages/web/dist/**` matches are build artifacts refreshed by `npm run build`.
8. Adjacent contradiction: any global-config completeness helper/message that names `continuity_philosophy` carries a dead presence condition — remove only that condition while leaving substantive STORY CONTRACT and PROSE MODE readiness intact. This is a required consequence of the removal, not a separate bug.
9. Mismatch + correction: none. Spec references validated 1:1 against the codebase at commit `8970656` (= the spec's target commit `89706560`).

## Architecture Check

1. Removing the key outright (no deprecated alias, no `continuity_mode`, no default-then-override) is cleaner than retaining a one-value enum: it eliminates the duplicate authority path and keeps continuity-first doctrine where it belongs — constitutional and static. A migration that strips the key before strict parse is the minimum mechanism that preserves SPEC-024's lossless-open guarantee.
2. No backwards-compatibility aliasing or shim is introduced. The migration deletes the key; it does not rewrite it to another field or preserve a read alias.

## Verification Layers

1. Field is gone from schema/descriptor/guidance/UI -> codebase grep-proof (`continuity_philosophy` absent from `packages/*/src`).
2. Legacy live + orphan STORY CONTRACT rows open, migrate, and re-save without the key -> schema validation via the real project-open/read path (`packages/server/src/global-config-migration.test.ts`, `project-store.test.ts`).
3. Compiled prompt is unchanged -> golden snapshot (`packages/core/test/golden-first-segment.prompt.txt` via `compiler-golden.test.ts`) is byte-identical.
4. Migration rerun is a no-op -> idempotence assertion in `global-config-migration.test.ts`.

## What to Change

### 1. Core schema, descriptor, guidance, fixture (`@loom/core`)

Remove the Zod field and inferred type member from `storyContract` in `packages/core/src/records/global-config.ts`. Remove the editor descriptor in `story-config-descriptors.ts`, the field-guidance entry in `field-guidance-brief-config.ts`, and the fixture key in `demo/letter-under-flour-bin.ts`. Remove only the dead `continuity_philosophy` presence condition from any global-config completeness helper, leaving the rest of STORY CONTRACT/PROSE MODE readiness intact. Do not add a resolver; compiled prompt text must not change.

### 2. Server migration (`@loom/server`)

Extend `packages/server/src/global-config-migration.ts` to strip `continuity_philosophy` from (a) live `story_config` STORY CONTRACT rows and (b) orphan global-config records, before strict Zod parse. The migration must be idempotent, key-specific, lossless for sibling fields, and executed before parse so the project-open/read path recovers legacy projects rather than classifying them malformed. Do not preserve an alias or rewrite to another field.

### 3. Story-config UI (`@loom/web`)

Remove the one-option control from `packages/web/src/config/StoryConfigEditor.tsx` and any contextual enum guidance for it (`packages/web/src/field-help/EnumGuidance.tsx` if present). Update `StoryConfigEditor.test.tsx` / `EnumGuidance.test.tsx` accordingly.

### 4. Authority docs (§8 co-land)

`docs/story-record-schema.md` §2.1: delete the field; state continuity-first doctrine is constitutional/static, not a configurable story property. `docs/compiler-contract.md`: remove any input-inventory / field-guidance implication that treats it as a compiler source. No prompt-template structural change (the static doctrine remains); no placeholder added/renamed/deleted.

## Files to Touch

- `packages/core/src/records/global-config.ts` (modify)
- `packages/core/src/records/story-config-descriptors.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/global-config-migration.ts` (modify)
- `packages/web/src/config/StoryConfigEditor.tsx` (modify)
- `packages/web/src/field-help/EnumGuidance.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/server/src/global-config-migration.test.ts` (modify)
- `packages/server/src/project-store.test.ts` (modify)
- `packages/web/src/config/StoryConfigEditor.test.tsx` (modify)
- `packages/web/src/field-help/EnumGuidance.test.tsx` (modify)
- `packages/core/test/records.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- Other `continuity_philosophy`-bearing test fixtures listed in Assumption Reassessment item 7 (modify — fixture cleanup only)

## Out of Scope

- Introducing `continuity_mode`, a deprecated alias, or any default-then-override relationship.
- Making static continuity doctrine conditional on stored data.
- Any change to the generation-session brief schema (manual_directive_id, voice pressure, override scope) — those are CONLOOSCHAUD-002/003/004.
- Any prompt placeholder add/rename/delete or structural prompt-template change.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- global-config-migration` — legacy live row and legacy orphan STORY CONTRACT record both migrate (not dropped/malformed) and re-save without the key; rerun is a no-op.
2. `npm test -- compiler-golden` — `golden-first-segment.prompt.txt` is byte-identical (compiled prompt unchanged).
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green (strict TS confirms no dangling references in core/server/web).

### Invariants

1. `continuity_philosophy` does not appear in any `packages/*/src` file (grep-proof) after the change.
2. Opening a legacy project that contains `continuity_philosophy` is lossless for every sibling STORY CONTRACT field.

## Test Plan

### New/Modified Tests

1. `packages/server/src/global-config-migration.test.ts` — add legacy live-row + orphan-row strip cases and an idempotence case.
2. `packages/web/src/config/StoryConfigEditor.test.tsx` — assert no continuity-philosophy control renders.
3. `packages/core/test/records.test.ts` and the fixtures in Assumption Reassessment item 7 — drop the removed key from constructed STORY CONTRACT objects so strict parse passes.

### Commands

1. `npm test -- global-config-migration compiler-golden StoryConfigEditor`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `! grep -rn "continuity_philosophy" packages/core/src packages/server/src packages/web/src` (grep-proof; run after `npm run build` so `dist/**` is refreshed — narrower than full-suite because it proves the removal invariant directly).

## Outcome

Completed: 2026-06-20

What changed:

- Removed `storyContract.continuity_philosophy` from the STORY CONTRACT schema, generated story-config descriptors, field guidance, demo fixture, Story Configuration UI, active schema docs, and current test fixtures.
- Extended the global-config migration to strip legacy STORY CONTRACT keys before strict parsing, including both live `story_config` rows and orphan STORY CONTRACT records.
- Added migration coverage proving legacy live/orphan rows with `continuity_philosophy` open losslessly, re-save without the key, and rerun idempotently.

Deviations from plan:

- `docs/compiler-contract.md` did not need a content change because it already grouped STORY CONTRACT fields without naming `continuity_philosophy` as an independent compiler source.

Verification:

- `npm test -- global-config-migration compiler-golden StoryConfigEditor` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 131 files, 972 tests.
- `npm run build` passed.
- `rg -n "continuity_philosophy" packages/core/src packages/server/src packages/web/src` returned no matches.
- Browser smoke: launched `npm run dev` on `127.0.0.1:5173` / `127.0.0.1:5174`, opened `/tmp/letter-under-flour-bin-demo`, visited `/story-config`, and confirmed the STORY CONTRACT editor renders `title`, `premise`, `genre_mode`, `tone`, `setting_baseline`, `content_intensity`, `explicitness`, and `language_register` with no `continuity_philosophy` control. A prior demo-create attempt reported an expected `409 folder-exists` for the existing `/tmp/letter-under-flour-bin-demo`; the project then opened normally. Browser and dev server were stopped, and `.playwright-cli/` was removed.
