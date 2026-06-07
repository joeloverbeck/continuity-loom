# SPEC015FIEGUICON-003: Core-accessible field-path sources for story config and generation brief

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — new `@loom/core` path-enumeration modules (`story-config-descriptors.ts`, `generation-brief-descriptors.ts`), one additive export from `editor-descriptors.ts`, and `index.ts` exports; no production behavior change.
**Deps**: SPEC015FIEGUICON-001

## Problem

SPEC-015 §16.1 places the story-config and generation-brief coverage tests in `@loom/core`, but the story-config descriptors live in `@loom/web` (`storyConfigEditorDescriptors` in `packages/web/src/config/StoryConfigEditor.tsx`) and the generation brief has no descriptor at all (hand-built `GenerationBriefView`). A core test cannot enumerate either surface today. Reassessment finding **M1** resolved this: derive the canonical field-path set for both surfaces from the already-core-exported Zod schemas, so core owns the enumeration authority and no field can silently escape guidance coverage. This is the source both the content tickets and the capstone coverage gate consume.

## Assumption Reassessment (2026-06-07)

1. `packages/core/src/records/editor-descriptors.ts` contains a private `describeObjectFields(schema)` that turns a Zod object schema into `FieldDescriptor[]` (handling optional/default/array/nested). The schemas are core-exported: `storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema` (`packages/core/src/records/global-config.ts`) and `generationSessionSchema` (`packages/core/src/records/generation-brief.ts`). The web `storyConfigEditorDescriptors` is hand-maintained with **no drift guard** asserting it matches those schemas — deriving coverage from the schemas (M1's recommended additive path) is therefore the authority, and the web descriptor list is left untouched for rendering.
2. The convention is `specs/SPEC-015-…md` §10.1 — `OWNER_KIND` is the user-facing record/config/group name; generation-brief paths read `GENERATION BRIEF.<schema_group>.<field>` (per the §10.2 required examples). M1 and §8.2 elevate these two modules from "optional" to required-where-core-tests-enumerate.
3. **Shared boundary under audit**: the `OWNER_KIND` strings emitted here (`STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, `PROSE MODE`, `GENERATION BRIEF`) and the canonical leaf paths are the keys the content tickets (004) author guidance under and the web renderer derives lookups from. They must match exactly across core enumeration, catalog registration, and web DOM-id derivation, or coverage tests pass while the UI looks up a nonexistent key.

## Architecture Check

1. Deriving the path set from the single schema source removes the web-local hand-maintained descriptor list as a coverage authority (it can drift from the schema with no test catching it); the schema is the one source of truth the runtime already validates against. Reusing the existing `describeObjectFields` (exported additively) avoids a second schema-walking implementation.
2. No backwards-compatibility shim: the web `storyConfigEditorDescriptors` is not aliased or removed — it keeps rendering; this ticket adds an independent, schema-derived enumeration for coverage.

## Verification Layers

1. Story-config enumeration matches the schemas → unit test asserting `storyConfigFieldPaths()` contains `STORY CONTRACT.prose_preferences.psychic_distance`, `UNIVERSAL CONTENT POLICY.allowed_content_scope`, `PROSE MODE.pov_character` and nothing keyed by a numeric index.
2. Generation-brief enumeration covers the full schema → unit test asserting `generationBriefFieldPaths()` includes the §10.2 examples plus the not-yet-rendered fields (`GENERATION BRIEF.immediate_handoff.begin_after`, `…manual_moment_directive.do_not_force[]`, `…current_authoritative_state.consent_or_force_conditions`).
3. Canonical-path discipline → every emitted path passes `assertCanonical` (SPEC015FIEGUICON-001) — list depth only via `[]`.

## What to Change

### 1. Additive export `packages/core/src/records/editor-descriptors.ts`

- `export function describeSchemaFields(schema: z.ZodType): readonly FieldDescriptor[]` wrapping the existing private `describeObjectFields`, so non-registry schemas (story config, generation brief) can be walked with the same logic the registry uses.

### 2. New module `packages/core/src/records/story-config-descriptors.ts`

- For each story-config kind (`STORY CONTRACT` → `storyContractSchema`, `UNIVERSAL CONTENT POLICY` → `universalContentPolicySchema`, `PROSE MODE` → `proseModeSchema`), describe the schema and enumerate canonical leaf paths with `OWNER_KIND` = the kind name.
- Export `storyConfigFieldPaths(): readonly string[]` and a structured `storyConfigDescriptors` (kind → `FieldDescriptor[]`) for reuse.

### 3. New module `packages/core/src/records/generation-brief-descriptors.ts`

- Describe `generationSessionSchema` and enumerate canonical leaf paths under `OWNER_KIND` = `GENERATION BRIEF`, recursing nested groups (dot) and arrays-of-objects (`[]`), so the **full** schema leaf set is produced (per Q1(a): catalog coverage is keyed to the full schema, not the rendered subset).
- Export `generationBriefFieldPaths(): readonly string[]`.

### 4. Shared walker + barrel

- A small shared `enumerateCanonicalPaths(ownerKind, fields)` (in one of the new modules or a tiny helper) building leaf paths via `buildFieldPath` (SPEC015FIEGUICON-001). Re-export `storyConfigFieldPaths` / `generationBriefFieldPaths` / `describeSchemaFields` from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/story-config-descriptors.ts` (new)
- `packages/core/src/records/generation-brief-descriptors.ts` (new)
- `packages/core/test/guidance-coverage-sources.test.ts` (new)
- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- Record-type field enumeration — `recordEditorDescriptors` already exists in core and is consumed directly by content/coverage tickets.
- Authoring guidance content (004).
- Rendering the not-yet-rendered brief fields in the UI — a §7.2 pre-validated non-goal (catalog covers them; UI does not render them in v1).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- guidance-coverage-sources` (vitest, `@loom/core`) — `storyConfigFieldPaths()` and `generationBriefFieldPaths()` contain the SPEC-015 §10.2 required example paths and emit no numeric-index path.
2. `npm test -- guidance-coverage-sources` — `generationBriefFieldPaths()` includes the not-yet-rendered fields (`…begin_after`, `…do_not_force[]`, `…consent_or_force_conditions`), proving full-schema coverage.
3. `npm run typecheck && npm run lint` pass; `npm test -- editor-descriptors` stays green (the additive export does not change existing descriptor behavior).

### Invariants

1. The story-config and generation-brief path sets are derived from the exported Zod schemas, not from the web-local hand-maintained descriptor list.
2. Every emitted path is canonical (`assertCanonical` holds) and uses the user-facing `OWNER_KIND`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/guidance-coverage-sources.test.ts` — story-config + generation-brief enumeration cases, full-schema-vs-rendered assertion, canonical-path assertion.

### Commands

1. `npm test -- guidance-coverage-sources`
2. `npm test -- editor-descriptors` — confirms the additive `describeSchemaFields` export leaves existing descriptor generation unchanged.
3. `npm run typecheck && npm run lint`
