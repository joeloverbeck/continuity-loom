# SPEC024REMSTOCON-001: Remove `prose_preferences` from @loom/core schema, validation, guidance, and demo — with authority docs co-landed

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — removes the `prose_preferences` group from `storyContractSchema` (changing the `StoryContract` type), drops the presence clause + `prosePreferencesPresent` helper from the STORY CONTRACT completeness rule and scrubs its `whyItMatters` message, removes four STORY-CONTRACT field-guidance entries, removes the demo-fixture block, and updates authority docs (`docs/story-record-schema.md`, `docs/compiler-contract.md`). Compiled prompt output is unchanged — the removed fields were never compiled.
**Deps**: None

## Problem

The story-config page exposes the same four prose-style knobs in two places: under `STORY CONTRACT.prose_preferences` (`psychic_distance`, `dialogue_density`, `interiority`, `paragraphing`) and as top-level `PROSE MODE` fields. Only the PROSE MODE copies are read by the deterministic compiler (`packages/core/src/compiler/sections/front.ts:39-42`); the STORY CONTRACT copies feed **no** prompt placeholder. Their only runtime "function" is a self-referential validation presence check that blocks if they are absent — a circular justification that fails the FOUNDATIONS field-economy rule (§13, `docs/FOUNDATIONS.md:520-526`). This is a duplicate authority path (forbidden by `CLAUDE.md`) plus a docs-vs-implementation divergence (a phantom "or story default" fallback in `docs/compiler-contract.md` that was never implemented). This ticket removes the dead group from `@loom/core` and synchronizes the two authority docs in the same change, leaving PROSE MODE as the sole authority for the four knobs.

## Assumption Reassessment (2026-06-19)

1. **Schema duplication is real and `.strict()`.** `packages/core/src/records/global-config.ts:16-25` declares `storyContractSchema.prose_preferences` (`psychic_distance`, `dialogue_density`, `interiority`, `paragraphing`), inner + outer `.strict()`; `:37-49` declares the surviving `proseModeSchema` peer (`psychic_distance`, `interiority_mode`, `dialogue_density`, `paragraphing`). PROSE MODE is untouched by this ticket.
2. **Compiler reads PROSE MODE only.** `front.ts:39-42` resolves `{psychic_distance}`, `{interiority_mode}`, `{dialogue_density}`, `{paragraphing}` exclusively from `snapshot.storyConfig.proseMode?.*`; `front.ts:24-34` has no `storyContract.prose_preferences.*` resolver. Confirmed no stray `.prose_preferences` reads exist in `packages/core/src/compiler` or `packages/server/src` (grep, 2026-06-19).
3. **Cross-artifact boundary under audit:** the `StoryContract` type / `storyContractSchema` shape and its derived field-paths (`describeSchemaFields(storyContractSchema)` in `packages/core/src/records/story-config-descriptors.ts:11`), which the field-guidance coverage tests assert against. Removing the schema group must move together with the field-guidance entries and the path assertions or the guidance-coverage tests break.
4. **FOUNDATIONS principles motivating this ticket** (restated before trusting the spec): §13 field economy (`:520-526`) — a field with no compilation/validation/voice/control use must be removed; §11 fail-closed validation — a blocker is legitimate only when it proves a real structural/contradiction/missing-mandatory condition. The removed presence check proves none (the four placeholders are sourced from PROSE MODE, which strict-parse-requires `psychic_distance`/`dialogue_density`/`paragraphing` and presence-gates `interiority_mode` at `universal-completeness.ts:75`), so dropping it weakens no real gate.
5. **Fail-closed / deterministic-compilation surface named:** the STORY CONTRACT completeness blocker in `validateStoryConfig` (`packages/core/src/validation/rules/universal-completeness.ts:30-50`, code `DIAGNOSTIC_CODES.missingStoryConfig`) and the compiler-contract authority doc (§8). Confirmed: `missingStoryConfig` is emitted by three independent clauses (`:43` storyContract, `:61` policy, `:80` proseMode), so removing the prose-prefs sub-clause does not orphan the code in the one-severity-per-code inventory (`packages/core/test/validation-rule-inventory.test.ts`). No secret-firewall surface (§15) is touched; compiled output is byte-identical because the removed fields were never compiled (determinism preserved, §8).
6. **Schema change is a breaking removal, not additive.** Host schema: `storyContractSchema` → `StoryContract`. Consumers of the removed sub-shape: the demo fixture (`satisfies StoryContract`), the field-guidance path assertions, and ~13 core test fixtures — all updated in this ticket. Cross-package consumers (`@loom/server`, `@loom/web`) are updated in SPEC024REMSTOCON-002 / -003, which `Deps` on this ticket (co-landing — see Architecture Check).
7. **Rename/removal blast radius (repo-wide grep, 2026-06-19).** `prose_preferences`: 37 src/test/doc sites + 3 space-form `prose preferences`; `prosePreferencesPresent`: exactly 2 sites — the call (`universal-completeness.ts:39`) and the helper def (`:382-393`), both in this ticket's scope. `@loom/core`-side sites: `global-config.ts:16`, `field-guidance-brief-config.ts:168-179`, `universal-completeness.ts:39/:382`, `demo/letter-under-flour-bin.ts:72-77`, 13 `test/*` fixtures, `docs/story-record-schema.md:36-41`, `docs/compiler-contract.md:26/:173`. The shared guidance constants (`psychicDistanceGuidance`, `dialogueDensityGuidance`, `interiorityGuidance`, `paragraphingGuidance`, `field-guidance-brief-config.ts:102-124`) are also referenced by PROSE MODE entries (`:209-219`) and are **retained**.
8. **Adjacent contradictions classified as required consequences of this removal** (not separate bugs): (a) the blocker's `whyItMatters` (`universal-completeness.ts:46`) names "prose preferences" — must be scrubbed or it over-claims a removed requirement; (b) `docs/compiler-contract.md:26` lists "story-level prose preferences" as a compilation input — stale once the block is gone. Both are in scope. `docs/compiler-contract.md:242` ("Story/prose preferences … render in their own placeholders") stays — still accurate via PROSE MODE. `docs/validation-rule-inventory.md` references neither `prose_preferences` nor `missingStoryConfig` (grep) → no-change deliverable.

## Architecture Check

1. Removal (not a wired fallback or keep-and-relabel) is the only design that eliminates the duplicate authority path: STORY CONTRACT and PROSE MODE are peer global-config blocks co-edited on one page, so a default-then-override between them is meaningless and would preserve a forbidden second authority. Co-locating the two authority docs in this same change honors §8 (drift between schema and compiler contract is a continuity bug).
2. No backwards-compatibility aliasing or shims are introduced — the field is deleted outright. Stored-payload compatibility is handled by the SPEC024REMSTOCON-002 migration, not by tolerating the dead key here.
3. **Co-landing constraint:** this is a breaking removal from a shared `.strict()` schema. It must **land in the same revision** as SPEC024REMSTOCON-002 (server) and -003 (web); it must not merge standalone ahead of them, or their suites go red against the tightened schema.

## Verification Layers

1. `prose_preferences` gone from `storyContractSchema` → codebase grep-proof (`grep -n prose_preferences packages/core/src/records/global-config.ts` returns nothing) + `npm run typecheck`.
2. Presence clause + `prosePreferencesPresent` helper removed, `missingStoryConfig` still blocks on the surviving STORY CONTRACT fields → grep-proof (helper absent) + `validation-completeness.test.ts` (a STORY CONTRACT missing title/premise still blocks).
3. Compiled prompt output unchanged → `compiler-golden.test.ts` (golden baseline byte-identical; FOUNDATIONS §8 determinism).
4. Field-guidance has no orphan `STORY CONTRACT.prose_preferences.*` entry **and** the four shared constants remain (referenced by PROSE MODE) → `guidance-coverage-sources.test.ts` / `field-guidance-coverage.test.ts` + grep that `psychicDistanceGuidance` et al. still resolve.
5. Authority docs match the tightened schema → grep-proof (`story-record-schema.md` has no `prose_preferences:` block; `compiler-contract.md` has no "or story default" and no ":26 story-level prose preferences") — §8 schema/contract sync.

## What to Change

### 1. Schema (`global-config.ts`)

Delete the `prose_preferences` object (lines 16-25) from `storyContractSchema`, leaving the outer `.strict()` on the remaining fields. Do not touch `proseModeSchema`.

### 2. Validation rule (`universal-completeness.ts`)

In `validateStoryConfig`, remove the `!prosePreferencesPresent(storyContract.prose_preferences)` clause (line 39) from the compound `if`. Delete the now-unused `prosePreferencesPresent` helper (lines 382-393). In the blocker's `whyItMatters` (line 46), drop the trailing "or prose preferences" so it reads "…tone, content envelope, without the story contract." (or equivalent), naming no removed field.

### 3. Field guidance (`field-guidance-brief-config.ts`)

Remove the four `config("STORY CONTRACT.prose_preferences.*", …)` entries (lines 168-179). **Retain** `psychicDistanceGuidance`, `dialogueDensityGuidance`, `interiorityGuidance`, `paragraphingGuidance` (lines 102-124) — still referenced by the PROSE MODE entries (lines 209-219).

### 4. Demo fixture (`demo/letter-under-flour-bin.ts`)

Remove the `prose_preferences: { … }` block (lines 72-77) from the STORY CONTRACT object, keeping it valid under `satisfies StoryContract`.

### 5. Authority docs (§8 co-located)

`docs/story-record-schema.md`: drop the `prose_preferences:` block (lines 36-41) from the STORY CONTRACT section (§2.1). `docs/compiler-contract.md`: at line 173, remove "or story default" so the `{psychic_distance}`/`{interiority_mode}`/`{dialogue_density}`/`{paragraphing}` source reads as PROSE MODE only; at line 26, remove "story-level prose preferences" from the compilation-inputs list. Leave line 242 unchanged.

### 6. Core test fixtures + field-path absence regression

Drop the `prose_preferences` block from each core test fixture (see Files to Touch). Add the regression: flip the path assertion in `field-paths.test.ts` / `guidance-coverage-sources.test.ts` so the derived `storyConfig` field paths **do not** contain any `STORY CONTRACT.prose_preferences.*` entry (Verification (a) of the spec).

## Files to Touch

- `packages/core/src/records/global-config.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/field-paths.test.ts` (modify — incl. absence regression)
- `packages/core/test/guidance-coverage-sources.test.ts` (modify — incl. absence regression)
- `packages/core/test/field-guidance-coverage.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/records.test.ts` (modify)
- `packages/core/test/validation-completeness.test.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify)
- `packages/core/test/validation-matrix-physical.test.ts` (modify)
- `packages/core/test/validation-matrix-voice.test.ts` (modify)
- `packages/core/test/validation-matrix-knowledge.test.ts` (modify)
- `packages/core/test/validation-clarity-invariants.test.ts` (modify)
- `packages/core/test/validation-stress-mapping.test.ts` (modify)

## Out of Scope

- Any change to PROSE MODE fields, the PROSE MODE validation gate (`universal-completeness.ts:70-87`), or the compiled `<prose_mode>` prompt section.
- Renaming `interiority_mode` ↔ `interiority` in PROSE MODE.
- Stored-payload migration (`@loom/server`) — SPEC024REMSTOCON-002.
- Story-config UI / `EnumGuidance` removal (`@loom/web`) — SPEC024REMSTOCON-003.
- The unrelated `pov_cannot_perceive_now` duplication (`triage/2026-06-09-prompt-generation-issues-triage.md` O4).
- Introducing any new "story default" / fallback mechanism — explicitly rejected.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — green after fixtures updated; `compiler-golden.test.ts` baseline byte-identical (compiled output unchanged).
2. The field-path absence regression asserts the derived `storyConfig` field paths contain no `STORY CONTRACT.prose_preferences.*` entry; `validation-completeness.test.ts` confirms a STORY CONTRACT missing a surviving required field still emits `missingStoryConfig`.
3. `npm run typecheck` and `npm run lint` — clean across `@loom/core` (no dangling reference to the removed field or helper).

### Invariants

1. `storyContractSchema` has no `prose_preferences` group; `proseModeSchema` is unchanged.
2. The compiled universal prompt is byte-identical to the pre-change golden baseline (the removed fields had no placeholder).

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-paths.test.ts` / `packages/core/test/guidance-coverage-sources.test.ts` — flip the `prose_preferences` path assertions to absence (field-path regression, spec Verification (a)).
2. `packages/core/test/field-guidance-coverage.test.ts` — drop the three STORY CONTRACT prose-prefs guidance paths; PROSE MODE coverage unchanged.
3. The remaining 9 core fixtures (`compiler-golden`, `records`, `validation-completeness`, `compiler-front-sections`, `validation-blockers`, `validation-matrix-{physical,voice,knowledge}`, `validation-clarity-invariants`, `validation-stress-mapping`) — drop the `prose_preferences` input block.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint`
3. `grep -rn "prose_preferences" packages/core/src docs && echo FAIL || echo OK` — targeted to this ticket's surfaces; the repo-wide sweep across all packages is the capstone (SPEC024REMSTOCON-004) because `@loom/server` / `@loom/web` sites clear in 002 / 003.

## Outcome

Completed: 2026-06-19

Implemented with the same-revision coupling required by SPEC024REMSTOCON-001/-002/-003. Removed `STORY CONTRACT.prose_preferences` from the core `storyContractSchema`, the STORY CONTRACT completeness blocker, field-guidance entries, demo fixture, and core test fixtures. Updated `docs/story-record-schema.md` and `docs/compiler-contract.md` so PROSE MODE is the sole source for the surviving prose-style prompt placeholders. Added/updated absence assertions for the removed story-config field paths.

Deviations: none from the intended end state. The migration and web UI portions landed in the same revision through SPEC024REMSTOCON-002 and SPEC024REMSTOCON-003 because the shared strict schema could not safely land alone.

Verification:
- `npm test --workspace @loom/core` — passed, 52 files / 447 tests.
- `npm run typecheck` — passed across workspaces.
- `npm run lint` — passed across workspaces.
- `git diff --check` — passed.
