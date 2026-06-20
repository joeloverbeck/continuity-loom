# CONLOOSCHAUD-002: Remove ACTIVE WORKING SET.manual_directive_id

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — removes `active_working_set.manual_directive_id` from the core generation-brief storage/draft/ready/descriptor/guidance shapes and the working-set integrity path; adds a generation-session draft migration step; removes the dead UI control/help; compiled prompt output and readiness behavior are unchanged
**Deps**: None

## Problem

`ACTIVE WORKING SET.manual_directive_id` (`generationSession.active_working_set.manual_directive_id`) is a phantom reference: there is no `MANUAL DIRECTIVE` record category for it to resolve to. The actual directive lives inline as `manual_moment_directive.must_render` / `may_render_if_naturally_caused` / `do_not_force`. The compiler does not use the ID to obtain directive content, referential validation establishes no meaningful target contract, the working-set integrity path treats it only as a value to retain/prune, and the demo fixture points it at an `INTENTION` id — demonstrating the field has no stable semantic target. The schema doc also calls it generation-time-required while implementation shapes allow it to be absent; readiness correctly depends on inline `must_render`, not an orphan id. (Spec §5.)

## Assumption Reassessment (2026-06-20)

1. `manual_directive_id` exists today in `packages/core/src/records/generation-brief.ts`, `generation-brief-draft.ts`, `generation-brief-readiness.ts`, `field-guidance-brief-config.ts`, `working-set-integrity.ts`, and `demo/letter-under-flour-bin.ts`. The inline directive triad `manual_moment_directive.{must_render,may_render_if_naturally_caused,do_not_force}` is the real authority. Verified by grep on 2026-06-20. (`generation-brief-descriptors.ts` carries the working-set descriptors and is the descriptor surface to check for a control entry.)
2. `docs/story-record-schema.md` §3.1 documents the field (and states it is generation-time-required). `docs/compiler-contract.md` carries no resolver that reads the id for directive content. The change proposal is `specs/continuity-loom-schema-audit-and-changes.md` §5.
3. Cross-artifact boundary under audit: the generation-session storage schema (`generation-brief.ts`, nested `.strict()`) ↔ the draft schema (`generation-brief-draft.ts`) ↔ the readiness shape (`generation-brief-readiness.ts`) ↔ the working-set integrity path (`working-set-integrity.ts`) ↔ the server draft migration (`packages/server/src/generation-session-draft-migration.ts`) ↔ the schema authority doc (`docs/story-record-schema.md` §3.1). Strict-schema tightening must co-land with the migration or saved drafts fail to open.
4. FOUNDATIONS §13 (field economy) motivates removal — the id clears no compilation/validation/continuity/voice/authorial-control function. The retained behavior is the §29.11 rule: `manual_moment_directive.must_render` stays readiness-required for Preview/Generate while a structurally saveable draft may still be saved before it is complete.
5. Fail-closed (§11/§29.5) and deterministic-compilation (§8) surfaces: removal must (a) keep readiness blocking a blank `must_render`, (b) keep an incomplete-but-saveable draft saveable, and (c) leave compiled prompt text byte-identical (the id was never compiled). The golden `packages/core/test/golden-first-segment.prompt.txt` must not change. No secret-firewall (§15) path is touched.
6. Output-schema modification: removes a member from the active-working-set schema in storage, draft, and ready shapes. Consumers are the descriptor, field guidance, working-set integrity, demo fixture, web working-set/brief surfaces, the server draft migration/parse path, and tests. All updated here; breaking storage change handled by the migration, not additive.
7. Removed-symbol blast radius (grep 2026-06-20): besides the core files above, `manual_directive_id` appears in `packages/web/src/generation-brief/section-fill.ts` and the working-set/brief views, and in tests `packages/core/test/records.test.ts`, `working-set-integrity.test.ts`, `field-guidance-brief-config.test.ts`; server `record-repository-draft.test.ts`, `record-layer.test.ts`, `working-set-routes.test.ts`, `generation-brief-routes.test.ts`, `generation-session-draft-migration.test.ts`, `working-set-integrity-migration.test.ts`; web `GenerationBriefView.test.tsx`, `WorkingSetView.test.tsx`. `dist/**` matches are build artifacts.
8. Adjacent contradiction (required consequence): `docs/story-record-schema.md` §3.1 marks the id generation-time-required while shapes allow absence. Resolve by removing the field and the generation-time-required statement, and reiterating that `manual_moment_directive.must_render` is the readiness-required content. Do not synthesize directive content from the old id during migration.
9. Mismatch + correction: the spec's web cascade names only "active-working-set or generation-brief control/help text"; the concrete consumers are `GenerationBriefView.tsx`, `WorkingSetView.tsx`, and `section-fill.ts` (mechanical enumeration of the spec's intent, folded into Files to Touch).

## Architecture Check

1. Removing the orphan id leaves the inline authored directive as the single generation-time authority — cleaner than retaining a pseudo-record link that invites agents/users to "select a directive record" that does not exist. The working-set integrity path loses dead prune/copy logic for a non-reference.
2. No backwards-compatibility alias or shim. The migration deletes the key; it does not introduce a replacement id or rewrite it to a referenced record.

## Verification Layers

1. Field is gone from storage/draft/ready/descriptor/guidance/integrity/UI -> codebase grep-proof (`manual_directive_id` absent from `packages/*/src`).
2. Legacy draft opens and retains all inline directive prose after migration; strict draft/ready schemas reject the legacy key -> schema validation (`packages/server/src/generation-session-draft-migration.test.ts`).
3. Readiness still blocks blank `must_render`; an incomplete draft still saves -> FOUNDATIONS §29.11/§29.5 alignment check exercised in `generation-brief-readiness`/draftability tests.
4. `workingSetIntegrity` no longer reports/prunes the id and compiled prompt is unchanged -> `working-set-integrity.test.ts` + golden snapshot (`compiler-golden.test.ts`).

## What to Change

### 1. Core schema, draft, ready, descriptor, guidance, integrity, fixture (`@loom/core`)

Remove `manual_directive_id` from the active-working-set object in `generation-brief.ts`, `generation-brief-draft.ts`, and `generation-brief-readiness.ts`; remove its descriptor entry (`generation-brief-descriptors.ts`) and field-guidance entry (`field-guidance-brief-config.ts`); remove the retain/prune/copy logic for this non-reference in `working-set-integrity.ts`; remove the misleading fixture value in `demo/letter-under-flour-bin.ts`. Retain the readiness rule that `manual_moment_directive.must_render` must be nonblank for Preview/Generate while a draft may be saved before it is complete.

### 2. Server migration (`@loom/server`)

Add an idempotent generation-session draft migration step in `packages/server/src/generation-session-draft-migration.ts` that deletes `active_working_set.manual_directive_id` before the tightened nested `.strict()` schemas parse persisted drafts. Preserve incomplete-but-structurally-saveable drafts. Do not synthesize directive content from the old id or any referenced record.

### 3. Web (`@loom/web`)

Remove any active-working-set / generation-brief control or help text for the id in `GenerationBriefView.tsx`, `WorkingSetView.tsx`, and `generation-brief/section-fill.ts`. The user edits the directive content, not a nonexistent directive record. Update the corresponding `.test.tsx` files.

### 4. Authority docs (§8 co-land)

`docs/story-record-schema.md` §3.1: remove the field and the generation-time-required statement; reiterate that `manual_moment_directive.must_render` is readiness-required. `docs/compiler-contract.md`: remove any source/reference mention of the id; preserve the inline directive placeholders and readiness rules.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-readiness.ts` (modify)
- `packages/core/src/records/generation-brief-descriptors.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/records/working-set-integrity.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/generation-session-draft-migration.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/generation-brief/section-fill.ts` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/server/src/generation-session-draft-migration.test.ts` (modify)
- `packages/core/test/working-set-integrity.test.ts` (modify)
- `packages/core/test/records.test.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (modify)
- Other `manual_directive_id`-bearing test fixtures listed in Assumption Reassessment item 7 (modify — fixture cleanup only)

## Out of Scope

- Introducing a replacement id, a `MANUAL DIRECTIVE` record category, or any alias.
- Changing readiness so a blank `manual_moment_directive.must_render` no longer blocks Preview/Generate.
- The `current_cast_voice_pressure.local_function`, `{voice_pressure}` lane, and `cast_voice_overrides.scope` work — CONLOOSCHAUD-003/004.
- Any prompt placeholder change (the id is not compiled).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- generation-session-draft-migration` — legacy draft strips `active_working_set.manual_directive_id`, retains all inline directive prose, rerun is a no-op, and an incomplete-but-saveable draft still saves.
2. `npm test -- working-set-integrity compiler-golden` — integrity no longer references/prunes the id; `golden-first-segment.prompt.txt` is byte-identical.
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. `manual_directive_id` does not appear in any `packages/*/src` file after the change (grep-proof).
2. Readiness blocks a blank `manual_moment_directive.must_render` for Preview/Generate, and a structurally saveable draft remains saveable.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generation-session-draft-migration.test.ts` — add the id-strip case, prose-preservation case, idempotence case, and incomplete-saveable-draft case.
2. `packages/core/test/working-set-integrity.test.ts` — assert no manual-directive-id classification/pruning remains.
3. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` / `WorkingSetView.test.tsx` — assert no directive-id control/help renders.

### Commands

1. `npm test -- generation-session-draft-migration working-set-integrity compiler-golden`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `! grep -rn "manual_directive_id" packages/core/src packages/server/src packages/web/src` (grep-proof; run after `npm run build`).

## Outcome

Completed: 2026-06-20

What changed:

- Removed `active_working_set.manual_directive_id` from the generation-session storage, draft, and readiness schemas.
- Removed the field from generation-brief guidance, section-fill accounting, working-set reference pruning, the demo generation session, active schema docs, and current test fixtures.
- Added a generation-session draft migration that strips the legacy nested key before strict parsing while preserving inline `manual_moment_directive` prose.
- Updated working-set integrity tests so only actual working-set references are pruned.

Deviations from plan:

- `docs/compiler-contract.md` did not need a content change because it did not describe `manual_directive_id` as a compiler source.

Verification:

- `npm test -- generation-session-draft-migration working-set-integrity compiler-golden` passed.
- `npm run lint` passed.
- `npm run typecheck` passed after tightening the raw migration helper's local type narrowing.
- `npm test` passed: 131 files, 973 tests.
- `npm run build` passed.
- `rg -n "manual_directive_id" packages/core/src packages/server/src packages/web/src` returned no matches.
- Browser smoke: launched `npm run dev` on `127.0.0.1:5173` / `127.0.0.1:5174`, created a disposable `/tmp/conlooschaud-002-smoke-20260620` project, visited `/generation-brief`, and confirmed the Active Working Set section exposes `selected_pov` while directive content remains in Manual Moment Directive with no `manual_directive_id` surface. Browser console contained only the standard React DevTools info line. Browser/dev server were stopped, `.playwright-cli/` was removed, and the disposable `/tmp` project folder was removed.
