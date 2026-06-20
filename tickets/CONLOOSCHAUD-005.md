# CONLOOSCHAUD-005: Render entity material-pressure and location hazards/social-rules

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds a deterministic entity-pressure serializer to the `{material_pressure}` source (prose-only) and hazards/social-rules clauses to the shared location renderer (prose + ideation); compiled prompts gain currently-dropped selected-record content; no schema, storage, or migration change
**Deps**: CONLOOSCHAUD-004

## Problem

Two valid fields and one valid field group currently fail to reach their promised prompt destinations (spec §8.1–§8.2):

1. **ENTITY** — `entity_kind` and `short_description` are valid, and selected non-person entities may compile as pressure sources, but the material-pressure renderer provides no concrete representation of a selected non-person/undossiered entity. A label resolved from an id cannot tell the writer what an institution, system, collective, or nonhuman agent is or how it bears on the moment, weakening the existing `nonhuman_or_institutional_pressure_expected` validation intent.
2. **LOCATION** — `hazards_or_shelters` (safe movement, danger, cover, refuge) and `social_rules` (public behavior, access, etiquette, authority, taboo, consequence) have concrete functions, but the location renderer emits description, status, layout, routes, and visibility/sound while omitting these two fields — costly because the current-state matrix treats environment/route/perception/force constraints as load-bearing.

This change adds no fields and no categories: it makes existing valid selected state reach existing prompt destinations.

## Assumption Reassessment (2026-06-20)

1. `entity_kind` (enum), `short_description`, and `roles_in_story` exist on the ENTITY schema (`packages/core/src/records/entity.ts:11/24/39`). `hazards_or_shelters` and `social_rules` exist on the LOCATION schema (`packages/core/src/records/space-material.ts:42/43`, both `z.array(nonemptyString).default([])`). The `{material_pressure}` resolver is at `packages/core/src/compiler/sections/pressure.ts:44`; `renderLocations`/`renderObjects` are at `packages/core/src/compiler/sections/records-tail.ts:252/265` and already accept a `TailRenderOptions.ideation` flag (line 11) that gates status-only vs all-records rendering. Verified by read/grep 2026-06-20.
2. `nonhuman_or_institutional_pressure_expected` is a focus tag in `matrix-physical.ts` / `generation-brief.ts` (not voice). `docs/compiler-contract.md` documents `{material_pressure}` and `{locations}`; `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, and `docs/ideation-prompt-template.md` (the ideation `<locations_objects_affordances>` description) are the authority docs. Spec: `specs/continuity-loom-schema-audit-and-changes.md` §8.1–§8.2.
3. Cross-artifact boundary under audit: the ENTITY/LOCATION schemas (`entity.ts`, `space-material.ts`) ↔ the `{material_pressure}` resolver (`pressure.ts`) and shared location renderer (`records-tail.ts`, used by both prose and ideation) ↔ the prose + ideation goldens ↔ the compiler-contract / prompt-template / rationale / ideation authority docs ↔ field guidance (`field-guidance-records.ts`) and `compile-destinations.ts`. The location renderer is the single shared serializer for both prompt kinds; the ideation prompt does NOT render `{material_pressure}` (its `<physical_continuity>` emits status-only ENTITY STATUS/LOCATION/OBJECT/AFFORDANCE lines), so the entity-pressure rendering is prose-only (Q2) while the location clauses render in both modes.
4. FOUNDATIONS §16 (physical continuity is hard authority; the prompt should surface environmental/route/force constraints) and §8 (deterministic, selected-records-only rendering) motivate the change. §29.7 is strengthened; a hazard is an affordance/constraint condition, not a command that harm occur, and a social rule is pressure, not a required beat (no §12 plot-rail risk).
5. Deterministic-compilation surface (§8/§29.4): both renderings must use only explicitly selected/current-snapshot records, in stable schema/list order, with no synthesis, ranking, or LLM relevance inference. Compiled output remains deterministic; accepted prose stays excluded. No secret-firewall (§15) path is touched.
6. Output-schema (prompt-section contract) extension: `{material_pressure}` gains an entity sub-rendering and `{locations}` gains hazards/social-rules clauses. Consumers are the compiler contract, prompt template, rationale, ideation-template, goldens, and renderer tests — all updated here. No stored Zod schema changes; no migration (spec §8.1/§8.2 confirm none required).
7. (Rename/removal item not applicable — this ticket renames/removes no symbol; it adds rendering of existing fields.)
8. Adjacent contradiction / harm guard (required consequence): entity material-pressure must not duplicate a selected full CAST MEMBER dossier. Inclusion rule: selected ENTITY records whose kind is not `person`, OR selected person-like entities not represented by a selected CAST MEMBER dossier and materially relevant to the current unit. `roles_in_story` stays out of literal prose (structured authoring metadata) — its explicit non-prompt status is documented in CONLOOSCHAUD-006. Add explicit one-and-only-one rendering tests (§18.3).
9. Mismatch + correction: the spec hedges "`pressure.ts` or the shared material-pressure serializer" and "`renderObjects` if social/material clauses extend there"; confirmed the `{material_pressure}` resolver is in `pressure.ts` and the location fields belong to `renderLocations` (extend `renderObjects` only if a clause genuinely belongs to OBJECT). No other drift.

## Architecture Check

1. Adding a deterministic entity serializer to the existing `{material_pressure}` source and labeled hazards/social-rules clauses to the existing `renderLocations` is cleaner than introducing new placeholders or categories: it routes existing valid state to existing destinations with no schema growth, and editing the shared location renderer once keeps prose and ideation consistent. Humanizing `entity_kind` via a small deterministic label/ordering helper keeps the output readable without raw enum dumps or raw ids.
2. No backwards-compatibility aliasing/shims. No new fields, no new categories, no migration.

## Verification Layers

1. Selected non-person entity kind/description appears once in `{material_pressure}` (prose), and a selected full CAST MEMBER dossier is not duplicated there -> compiler section + golden tests (`compiler-pressure-sections.test.ts`, `compiler-golden.test.ts`).
2. Location `hazards_or_shelters` and `social_rules` render in deterministic order in both prose and ideation when nonempty -> renderer + golden tests (`compiler-tail-sections.test.ts`, `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`).
3. Entity material-pressure does not appear in the ideation prompt (`{material_pressure}` not rendered there) -> ideation golden assertion.
4. Rendering uses only selected/current records with no relevance inference -> FOUNDATIONS §8/§29.7 alignment check in the section tests.

## What to Change

### 1. Compiler — entity material-pressure (prose-only)

In `pressure.ts` (the `{material_pressure}` source), add a deterministic entity-pressure serializer rendering, for each included ENTITY, a stable line such as `<display name> — <humanized entity kind>: <short description>`. Inclusion rule per Assumption Reassessment item 8. Do not duplicate a full selected cast dossier, do not compile raw ids, and do not infer relevance outside explicit selection/current-state membership. Add any small label/ordering helper needed for deterministic humanization. This rendering is prose-only (the ideation prompt does not render `{material_pressure}`).

### 2. Compiler — location hazards/social-rules (prose + ideation)

In `records-tail.ts` `renderLocations` (and `renderObjects` only if a clause genuinely belongs to OBJECT), append, for each selected/current location, stable labeled clauses when nonempty:

```
Hazards or shelters: ...
Social rules: ...
```

Preserve schema order and deterministic list formatting; do not synthesize or rank entries. Because the renderer is shared, these clauses render in both the prose prompt (status-gated) and the ideation prompt (`ideation: true`).

### 3. Field guidance / compile destinations

In `field-guidance-records.ts` and `compile-destinations.ts`, give `entity_kind`, `short_description`, and the two LOCATION fields truthful prompt destinations now that they render. (`roles_in_story` and the broader non-prompt field set are handled in CONLOOSCHAUD-006.)

### 4. Authority docs (§8 co-land)

`docs/compiler-contract.md` (`{material_pressure}` entity source/notes; `{locations}` hazards/social-rules); `docs/prompt-template.md` (explanatory sentence so material pressure covers entity, entity-status, location, and object constraints); `docs/prompt-template-rationale.md` (explain the existing summary destination only as needed); `docs/ideation-prompt-template.md` (update `<locations_objects_affordances>` to include hazards/shelters and social rules); `docs/story-record-schema.md` (prompt-treatment note for the now-rendered ENTITY/LOCATION fields). Update the prose golden (`golden-first-segment.prompt.txt`) and the ideation golden (`golden-ideation.prompt.txt`).

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/src/records/compile-destinations.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)

## Out of Scope

- Adding any ENTITY or LOCATION field, or any new record category.
- Compiling `roles_in_story` into literal prose (it remains structured metadata — see CONLOOSCHAUD-006).
- Extending entity material-pressure into the ideation prompt (separately justified, out of scope).
- Any storage schema or migration change.
- The broader non-prompt guidance-truthfulness pass (CONLOOSCHAUD-006).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-pressure-sections compiler-golden` — a selected non-person entity's kind/description appears exactly once in `{material_pressure}`; a selected full CAST MEMBER dossier is not duplicated there.
2. `npm test -- compiler-tail-sections compiler-ideation-golden` — location hazards/shelters and social rules render in deterministic order in prose and ideation; entity material-pressure does not appear in the ideation prompt.
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. Entity and location rendering use only explicitly selected/current-snapshot records, in stable order, with no synthesis or relevance inference.
2. Identical normalized input/version compiles byte-identically; accepted prose remains excluded from both renderings.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — non-person entity renders once; person entity with a selected dossier is not duplicated; raw ids never appear.
2. `packages/core/test/compiler-tail-sections.test.ts` — hazards/social-rules clauses render when nonempty, omit when empty, in schema order, in both prose and ideation modes.

### Commands

1. `npm test -- compiler-pressure-sections compiler-tail-sections compiler-golden compiler-ideation-golden`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `npm test -- compiler-golden` (narrower golden-diff boundary confirming the prose prompt gains only the intended entity/location content).
