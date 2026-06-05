# SPEC004RECCRUBAS-009: Web global story-configuration singleton editors

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` Story Configuration editor surface (three singletons)
**Deps**: SPEC004RECCRUBAS-007, SPEC004RECCRUBAS-004

## Problem

The three global story-config singletons — STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE — are required record coverage (`DATA-MODEL-AND-RECORDS.md` "Required record coverage") and must be editable through typed UI in Phase 4. They are stored as singletons (`story_config`), not rows in `records`, so they need their own editor surface reached from the shell's Story Configuration area, built on the generic editor engine (-007) and the story-config routes (-004).

## Assumption Reassessment (2026-06-05)

1. Foundations exist: the editor engine from SPEC004RECCRUBAS-007; the story-config get/set routes + api wrappers from SPEC004RECCRUBAS-004 (mapping `:kind` → `StoryConfigKind`); the three singleton Zod schemas in `packages/core/src/records/global-config.ts` (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE) with descriptors from -001. These are singleton upserts (`get/setStoryConfig`), not `records`-table CRUD.
2. Spec `specs/SPEC-004-...md` (Approach → global story-configuration editors; DATA-MODEL-AND-RECORDS.md "Global story configuration") requires typed forms for all three, reachable from the shell.
3. Shared boundary under audit: the **engine component API** (-007), the **story-config route contract** (-004 via -005's client), and the **three singleton schemas** (-001 descriptors). The shell's Story Configuration route is a shared mount point (mechanical merge with sibling web tickets).
4. FOUNDATIONS §25 (mature-fiction envelope) and `story-record-schema.md` §2.2 motivate the UNIVERSAL CONTENT POLICY editor exposing **all five** content-policy fields (`rating_label`, `allowed_content_scope`, `tonal_handling`, `governing_policy_note`, `character_bias_handling`) as authored prose — never collapsing them to a generic maturity boilerplate, and never offering a "NO RESTRICTIONS" shortcut. PROSE MODE's `pov_character` is an entity reference (uses the reference picker); these are authoring fields only — content-envelope/POV *validation* is Phase 6.

## Architecture Check

1. Reusing the generic engine for the three singletons (with a singleton get/set submit path instead of records CRUD) avoids a second bespoke form stack while honoring that these are one-per-project, not list records. Keeping all five content-policy fields as discrete authored fields preserves the §2.2 contract that the compiler later renders them verbatim, not as boilerplate.
2. No backwards-compatibility shim: net-new surface; the singleton submit path reuses the engine's field rendering with the config api wrappers, no alias over records CRUD.

## Verification Layers

1. Each singleton editor renders all its schema fields and round-trips get→edit→set -> web component test with mocked config routes.
2. The content-policy editor exposes all five fields as authored prose (no boilerplate collapse, no "NO RESTRICTIONS" affordance) -> component test asserting field presence + FOUNDATIONS §25 / schema §2.2 alignment check.
3. PROSE MODE `pov_character` uses the entity reference picker -> component test.

## What to Change

### 1. Story-configuration editors

Add `packages/web/src/config/StoryConfigEditor.tsx` rendering the three singleton editors (engine-driven) under the shell's Story Configuration route, each loading via `getStoryConfig(kind)` and saving via `setStoryConfig(kind, …)`. Required-first layout; content-policy's five fields shown in full.

## Files to Touch

- `packages/web/src/config/StoryConfigEditor.tsx` (new)
- `packages/web/src/shell/` (modify) — register the Story Configuration route (shared with sibling web tickets; mechanical merge)
- `packages/web/src/config/StoryConfigEditor.test.tsx` (new)

## Out of Scope

- Generation-time brief editing (PROSE MODE overrides, POV selection at generation time) — Phase 5; this edits the durable defaults.
- Content-envelope / POV validation (consistency with cast ages, provider policy) — Phase 6.
- Record-table CRUD — SPEC004RECCRUBAS-003/-006/-007.

## Acceptance Criteria

### Tests That Must Pass

1. Each of the three singleton editors renders all of its schema fields and round-trips get→edit→set against mocked routes.
2. The UNIVERSAL CONTENT POLICY editor exposes all five content-policy fields as authored prose, with no boilerplate-collapse and no "NO RESTRICTIONS" affordance.
3. PROSE MODE `pov_character` is edited via the entity reference picker.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. The content-policy editor preserves all five distinct fields (FOUNDATIONS §25; `story-record-schema.md` §2.2) — never a single generic maturity field.
2. Global config is edited through typed UI, not raw JSON.

## Test Plan

### New/Modified Tests

1. `packages/web/src/config/StoryConfigEditor.test.tsx` — per-singleton field coverage + round-trip, five-field content-policy assertion, POV reference picker.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/config/StoryConfigEditor.test.tsx`
2. `npm test && npm run typecheck && npm run lint && npm run build`
