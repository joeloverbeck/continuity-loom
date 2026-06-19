# SPEC-024 — Remove the Dead STORY CONTRACT `prose_preferences` Duplicate

**Status**: DRAFT
Phase: post-v1 cleanup spec; schema + validation + storage + docs alignment
Depends on: existing local project store, global-config migration hook, deterministic compiler, validation engine, story-config UI, and field-guidance system
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/story-record-schema.md`, `docs/compiler-contract.md`
Supporting authorities: `docs/validation-rule-inventory.md`, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the external-generator
> evidence-ledger preamble (commit-of-record / raw-URL provenance) carried by the
> most-recent archived spec, because this spec was authored locally against the
> working tree, not fetched at an exact commit.

---

## Brainstorm Context

- **Original request:** The story-config page edits and saves STORY CONTRACT,
  UNIVERSAL CONTENT POLICY, and PROSE MODE individually. Four style knobs appear
  to be duplicated between STORY CONTRACT and PROSE MODE — `psychic_distance`,
  `interiority` (vs `interiority_mode`), `dialogue_density`, and `paragraphing`.
  Trace the lifecycle of these variables, determine which are actually used in
  prompt generation, explain the duplication, and remove what is dead.
- **Spec number:** `SPEC-024` — highest existing across `specs/` (empty) and
  `archive/specs/` is `SPEC-023-author-private-story-notes.md`.
- **Deliverable-class decision:** the request pre-authorized tickets, but the
  change touches record schema, a validation gate, and project-store/migration
  compatibility, which `docs/ACTIVE-DOCS.md` (§"When a change needs a spec…") and
  `CLAUDE.md` route to a spec. User confirmed the spec class via the brainstorm.
- **Remedy decision:** user confirmed **removal** of `STORY CONTRACT.prose_preferences`
  (over wiring a fallback or keep-and-relabel).
- **Prior-triage discovery:** no prior decision on this surface. The only adjacent
  triage record (`O4` in `triage/2026-06-09-prompt-generation-issues-triage.md`)
  concerns a different duplication (`pov_cannot_perceive_now`). This is fresh.

### Premise verification (operator-verified by Read/grep against the working tree)

- **Both copies are declared, both `.strict()`:** `packages/core/src/records/global-config.ts:16-25`
  declares `storyContractSchema.prose_preferences` with `psychic_distance`,
  `dialogue_density`, `interiority`, `paragraphing`; `:37-49` declares
  `proseModeSchema` with `psychic_distance`, `interiority_mode`,
  `dialogue_density`, `paragraphing`. Same enum value sets.
- **Compiler reads PROSE MODE only:** `packages/core/src/compiler/sections/front.ts:39-42`
  resolves `{psychic_distance}`, `{interiority_mode}`, `{dialogue_density}`,
  `{paragraphing}` exclusively from `snapshot.storyConfig.proseMode?.*`. The
  story-contract resolvers (`front.ts:24-34`) cover title/premise/genre_mode/tone/
  content_intensity/explicitness/language_register/setting_baseline only — there
  is **no** resolver for any `storyContract.prose_preferences.*` field, and no
  such placeholder exists anywhere.
- **Validation use is hollow and self-referential:** `packages/core/src/validation/rules/universal-completeness.ts:39`
  calls `prosePreferencesPresent(storyContract.prose_preferences)` (a presence
  check only); the PROSE MODE gate is independent at `:70-87` (keys on
  `interiority_mode`). The story-contract values are never read for anything else.
- **Docs/guidance falsely promise a prompt destination:**
  `packages/core/src/records/field-guidance-brief-config.ts:168-180` maps the four
  `STORY CONTRACT.prose_preferences.*` fields to `{psychic_distance}`,
  `{dialogue_density}`, `{interiority_mode}` (crossing the name boundary), and
  `{paragraphing}` — placeholders the compiler fills from PROSE MODE.
  `docs/compiler-contract.md:173` sources those placeholders from "PROSE MODE
  generation-time field **or story default**"; the "or story default" fallback
  was never implemented. `docs/story-record-schema.md:36-41` documents the
  duplicate group under STORY CONTRACT.
- **UI renders the dead group:** `packages/web/src/config/StoryConfigEditor.tsx:54-61`
  renders `prose_preferences` as a `nested_group`; `packages/web/src/field-help/EnumGuidance.tsx:18-20`
  lists the three enum paths for contextual help.
- **Storage/migration surface — two distinct locations:** stored STORY CONTRACT
  payloads live in the `story_config` table and are parsed against the strict
  schema on every read (`record-repository.ts:348` `getStoryConfig` →
  `:357 parseJsonWithSchema(..., storyContractSchema)`). Removing the field from a
  `.strict()` schema makes that read fail for any already-stored payload that
  still carries `prose_preferences`. `migrateGlobalConfigRecords`
  (`packages/server/src/global-config-migration.ts`, invoked at
  `packages/server/src/project-store.ts:284,391`) does **not** rewrite existing
  `story_config` rows — it only moves orphan `records`-table rows of kind STORY
  CONTRACT into `story_config`, preserving any pre-existing `story_config` row
  untouched (`global-config-migration.test.ts:160-173`), and it parses each orphan
  against the strict schema (`global-config-migration.ts:128`) before insert. So
  the cleanup must strip `prose_preferences` from **both** the live `story_config`
  rows (the common case) and orphan `records` payloads (before the line-128 parse,
  else the orphan is dropped as malformed).
- **Demo fixture carries it:** `packages/core/src/demo/letter-under-flour-bin.ts:72`.
- **Tests assert it:** `packages/core/test/field-paths.test.ts:13-15`,
  `packages/core/test/guidance-coverage-sources.test.ts:13-16`,
  `packages/core/test/field-guidance-coverage.test.ts:18-20`,
  `packages/core/test/compiler-golden.test.ts:125`,
  `packages/core/test/records.test.ts:84`,
  `packages/core/test/validation-completeness.test.ts:125`,
  `packages/core/test/compiler-front-sections.test.ts:146`,
  `packages/web/src/config/StoryConfigEditor.test.tsx:29`, plus several
  `@loom/server` route/store test fixtures and `@loom/core` validation-matrix
  fixtures that include a `prose_preferences` block (see the grep inventory in
  Verification).

### Scope decisions (confirmed during the brainstorm)

1. **Remove, do not wire a fallback.** STORY CONTRACT and PROSE MODE are peer
   global-config sections edited on the same page; a default-then-override
   between two co-edited global blocks is meaningless and would preserve a
   duplicate authority path (forbidden by `CLAUDE.md`).
2. **PROSE MODE is the sole surviving authority** for psychic distance,
   interiority, dialogue density, and paragraphing. No PROSE MODE behavior
   changes.
3. **Retain shared enum-guidance constants** (`psychicDistanceGuidance`,
   `dialogueDensityGuidance`, `interiorityGuidance`, `paragraphingGuidance`) that
   the PROSE MODE field-guidance entries still reference — only the STORY CONTRACT
   entries are removed.
4. **Compiled prompt output is unchanged.** Because the removed fields were never
   compiled, the golden prompt baseline does not change; golden fixtures change
   only where they carried the now-invalid `prose_preferences` input block.

---

## Problem Statement

The story-config page exposes the same four prose-style knobs in two places. In
`STORY CONTRACT` they live under `prose_preferences` (`psychic_distance`,
`dialogue_density`, `interiority`, `paragraphing`); in `PROSE MODE` they live as
top-level fields (`psychic_distance`, `interiority_mode`, `dialogue_density`,
`paragraphing`). Only the PROSE MODE copies are ever read by the deterministic
compiler (`front.ts:39-42`); the STORY CONTRACT copies feed **no** prompt
placeholder.

The STORY CONTRACT copies are therefore dead with respect to prompt generation.
Their only runtime "function" is a self-referential validation presence check
(`universal-completeness.ts:39`) that blocks if they are absent — a circular
justification that does not satisfy the FOUNDATIONS field-economy rule
(`FOUNDATIONS.md:520-526`). Worse, two surfaces actively mislead authors and
agents into believing the dead fields shape the prompt: the field-guidance
config maps them to live placeholders (`field-guidance-brief-config.ts:168-180`),
and the compiler contract describes a "story default" fallback
(`compiler-contract.md:173`) that was never implemented.

This is a duplicate authority path and a documentation-vs-implementation
divergence. The fix is to delete the dead `STORY CONTRACT.prose_preferences`
group across schema, validation, UI, field guidance, the two authority docs, the
demo fixture, stored payloads (migration), and tests, leaving PROSE MODE as the
sole authority.

## Approach

Remove `STORY CONTRACT.prose_preferences` as a single coherent cleanup, in the
package-boundary order that keeps each intermediate state buildable:

1. **`@loom/core` schema + validation.** Delete the `prose_preferences` object
   from `storyContractSchema` (`global-config.ts:16-25`). Remove the
   `prosePreferencesPresent(...)` clause from the STORY CONTRACT completeness
   check (`universal-completeness.ts:39`) and delete the now-unused
   `prosePreferencesPresent` helper. Drop the trailing "or prose preferences"
   from that blocker's `whyItMatters` message (`universal-completeness.ts:46`) so
   it no longer names a removed requirement. Leave the PROSE MODE schema and its
   validation gate (`:70-87`) untouched.
2. **`@loom/core` field guidance.** Remove the four
   `STORY CONTRACT.prose_preferences.*` entries (`field-guidance-brief-config.ts:168-180`),
   retaining the shared enum-guidance constants still referenced by the PROSE
   MODE entries.
3. **`@loom/core` demo fixture.** Remove the `prose_preferences` block from
   `letter-under-flour-bin.ts:72`.
4. **`@loom/web` UI.** Remove the `prose_preferences` `nested_group` field from
   the STORY CONTRACT descriptor (`StoryConfigEditor.tsx:54-61`) and the three
   enum paths from `EnumGuidance.tsx:18-20`.
5. **`@loom/server` migration — strip both storage surfaces.** A `prose_preferences`
   key must be stripped from every stored STORY CONTRACT payload so existing
   projects re-parse cleanly under the tightened `.strict()` schema. Two surfaces
   carry it, and `migrateGlobalConfigRecords` as written reaches only the second:
   - **Live `story_config` rows (the common case).** Add a one-time, idempotent
     rewrite pass over `story_config` STORY CONTRACT rows that removes the
     `prose_preferences` key. `migrateGlobalConfigRecords` does not touch these
     rows today (it preserves existing `story_config` untouched), so this is new
     behavior, runnable on every open like the sibling migrations. The function
     boundary — extend `migrateGlobalConfigRecords` vs. a dedicated
     `stripRemovedStoryContractFields` migration invoked alongside it at
     `project-store.ts:284,391` — is a decomposition detail.
   - **Orphan `records` payloads.** Strip the key *before*
     `migrateGlobalConfigRecords` parses the orphan against the strict schema
     (`global-config-migration.ts:128`); otherwise a legacy orphan is pushed to
     `malformedRecordIds` and silently dropped.
   Keep every pass idempotent (the existing migration tests establish this
   contract).
6. **Authority docs.** Update `docs/story-record-schema.md` §2.1 to drop the
   `prose_preferences` block from STORY CONTRACT, and `docs/compiler-contract.md:173`
   to remove the "or story default" fallback wording so the placeholder source
   reads as PROSE MODE only. Also update `docs/compiler-contract.md:26`, which
   lists "story-level prose preferences" as a compilation input — stale once the
   STORY CONTRACT block is gone. Leave `docs/compiler-contract.md:242`
   ("Story/prose preferences ... render in their own placeholders") as-is — still
   accurate via PROSE MODE. Apply the `docs/validation-rule-inventory.md`
   same-change drift rule if the completeness-code coverage description changes (a
   grep confirms it currently names neither `prose_preferences` nor the
   `missingStoryConfig` code, so no change is expected).
7. **Tests.** Update every fixture and assertion enumerated in Verification to
   drop the STORY CONTRACT `prose_preferences` block / path, and add a regression
   test asserting no `storyContract.prose_preferences.*` path is emitted by
   `storyConfigFieldPaths()` and that loading a legacy payload containing
   `prose_preferences` succeeds post-migration.

## Deliverables

- `storyContractSchema` with no `prose_preferences` group (`@loom/core`).
- STORY CONTRACT completeness check without the presence clause and without the
  dead `prosePreferencesPresent` helper, and with the "or prose preferences"
  wording removed from the blocker's `whyItMatters` message (`@loom/core`).
- Field-guidance config without the four STORY CONTRACT entries; shared enum
  guidance constants retained for PROSE MODE (`@loom/core`).
- Demo fixture without the STORY CONTRACT `prose_preferences` block (`@loom/core`).
- Story-config UI descriptor and `EnumGuidance` path list with the STORY CONTRACT
  prose-preferences group removed (`@loom/web`).
- A migration step that strips `prose_preferences` from stored STORY CONTRACT
  payloads idempotently across **both** storage surfaces — live `story_config`
  rows (a new rewrite pass) and orphan `records` payloads (pre-parse) — so
  existing projects load cleanly (`@loom/server`).
- Updated `docs/story-record-schema.md` §2.1 and `docs/compiler-contract.md:173`;
  `docs/validation-rule-inventory.md` updated if its coverage text drifts.
- Updated test fixtures/assertions plus a regression test for field-path absence
  and legacy-payload migration.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| Field economy — every field must earn its place (`FOUNDATIONS.md:520-526`) | aligns | Removes four fields with no compilation/continuity/voice/authorial use at the schema surface; their only use was a self-referential presence check. |
| Single continuity authority / no duplicate authority paths (`CLAUDE.md`; `ACTIVE-DOCS.md` non-negotiable invariants) | aligns | PROSE MODE becomes the sole authority for the four style knobs at the schema + compiler surface. |
| Deterministic compilation, no hidden state | aligns | Compiler already read only PROSE MODE; removal makes the schema match the deterministic behavior, removing a phantom "story default" source from `compiler-contract.md`. |
| Validation must fail closed (`ACTIVE-DOCS.md` invariants) | aligns | Drops a hollow presence blocker only; the real PROSE MODE completeness gate (`universal-completeness.ts:70-87`) is unchanged. |
| Schema/template synchronization (`story-record-schema.md §10`) | aligns | Authority docs are updated in the same change; no placeholder is added, renamed, or deleted (the dead fields had none). |
| §29 hard-fail checklist | clears | Removal hides nothing from review, weakens no gate, and changes no compiled prompt output (the fields were never compiled). |

## Verification

- `npm run lint` — clean (incl. the `@loom/core` import-boundary rule).
- `npm run typecheck` — clean across all packages (no dangling references to the
  removed schema field or helper).
- `npm test` — green, after updating the fixtures/assertions below. Build
  `@loom/core` first per the project test flow.
- **Fixtures/assertions to update** (grep inventory of `prose_preferences`):
  - `@loom/core`: `test/field-paths.test.ts:13-15`,
    `test/guidance-coverage-sources.test.ts:13-16`,
    `test/field-guidance-coverage.test.ts:18-20`,
    `test/compiler-golden.test.ts:125`, `test/records.test.ts:84`,
    `test/validation-completeness.test.ts:125`,
    `test/compiler-front-sections.test.ts:146`,
    `test/validation-blockers.test.ts:417`,
    `test/validation-matrix-physical.test.ts:206`,
    `test/validation-matrix-voice.test.ts:255`,
    `test/validation-matrix-knowledge.test.ts:338`,
    `test/validation-clarity-invariants.test.ts:260`,
    `test/validation-stress-mapping.test.ts:125`.
  - `@loom/server`: the `prose_preferences` fixtures in `generate-routes.test.ts`,
    `phase4-gate.e2e.test.ts`, `validation-routes.test.ts`,
    `compile-routes.test.ts`, `project-store.test.ts`,
    `global-config-migration.test.ts`, `story-config-routes.test.ts`,
    `ideate-routes.test.ts`, `generate-routes.secret-leakage.test.ts`,
    `generation-brief-draftability.e2e.test.ts`.
  - `@loom/web`: `src/config/StoryConfigEditor.test.tsx:29`.
- **New regressions:** (a) `storyConfigFieldPaths()` (or equivalent) emits no
  `STORY CONTRACT.prose_preferences.*` path; (b) opening a project whose live
  `story_config` STORY CONTRACT row contains a legacy `prose_preferences` block
  succeeds and the block is stripped — exercised through the project-open /
  `getStoryConfig` read path (the common case), not only the orphan-records move;
  (c) an orphan `records` STORY CONTRACT row carrying `prose_preferences` still
  migrates into `story_config` (stripped) rather than being dropped as malformed
  (extend `global-config-migration.test.ts`).
- **Grep proof:** after `npm run build` (so `dist/` is regenerated, not stale),
  `grep -rn "prose_preferences" packages docs` returns no STORY-CONTRACT-side
  references (PROSE MODE has no `prose_preferences` key, so the underscore token
  should be fully gone from source/docs). Because that gate keys on the underscore
  identifier only, also run a space-form sweep —
  `grep -rni "prose preferences" packages docs` — and confirm the sole remaining
  match is `compiler-contract.md:242` (the accurate PROSE-MODE rendering note);
  the `universal-completeness.ts:46` message and `compiler-contract.md:26` line
  must be gone.

## Out of Scope

- Any change to PROSE MODE fields, the PROSE MODE validation gate, or the
  compiled `<prose_mode>` prompt section.
- Renaming `interiority_mode` to `interiority` in PROSE MODE (or vice versa) —
  the surviving PROSE MODE names are unchanged.
- The unrelated `pov_cannot_perceive_now` duplication tracked separately in
  `triage/2026-06-09-prompt-generation-issues-triage.md` (`O4`).
- Introducing any new "story default" / fallback mechanism — explicitly rejected.

## Risks & Open Questions

- **Stored-payload migration is the highest-risk step.** Tightening `.strict()`
  without stripping the legacy key would make existing projects fail to load.
  The primary surface is the live `story_config` table read by `getStoryConfig`,
  which `migrateGlobalConfigRecords` does not currently rewrite — the strip pass
  must cover it, not only the orphan-records path. The strip must run before
  schema validation on open and be idempotent; cover both surfaces with tests.
- **Shared enum-guidance constants.** Verify during implementation that removing
  the STORY CONTRACT field-guidance entries does not delete constants still
  referenced by PROSE MODE entries (scope decision 3); a typecheck pass catches
  dangling references.
- **`docs/validation-rule-inventory.md` drift.** If the removed presence check
  has a named diagnostic-code coverage line there, update it in the same change
  per the inventory's same-change drift rule.
- **Decomposition granularity (for ticketing):** the change is one coherent
  removal but spans `@loom/core`, `@loom/web`, `@loom/server` (migration), and
  docs. A natural split is core+docs+migration as one reviewable diff and the web
  UI as a second; the decomposition step settles this.
