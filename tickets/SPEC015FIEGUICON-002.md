# SPEC015FIEGUICON-002: FieldGuidance model, catalog registry, lookup, and promptDestination validator

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` guidance model + registry + lookup + destination validator (`field-guidance.ts`), one additive export from `compile-destinations.ts`, and `index.ts` exports; no production prompt/validation behavior change (catalog not yet consumed by compiler or UI).
**Deps**: SPEC015FIEGUICON-001

## Problem

SPEC-015 §9 defines the guidance data model — `FieldGuidance` / `EnumValueGuidance`, a tri-state `promptFacing`, and `promptDestinations` that must reference real prompt placeholders or compile-destination families (§9.3, §11 rule 6). This ticket builds that model, the catalog registry keyed by canonical field path, the lookup the web renderer will call, and the deterministic validator that rejects a `promptDestinations` entry naming a placeholder/family that does not exist. The catalog ships empty here; content tickets (004/005/006) contribute their per-area entries. This is the spine every later core and web ticket consumes.

## Assumption Reassessment (2026-06-07)

1. The authoritative prompt-destination vocabularies exist and are importable within `@loom/core`: `PLACEHOLDER_MAP` (a `Record<PlaceholderName, …>`) in `packages/core/src/compiler/placeholder-map.ts` — its keys are every valid placeholder (e.g. `manual_must_render`, `soft_unit_guidance`, `reveal_permissions`, `pov_accessible_facts`); and the compile-destination families in `packages/core/src/records/compile-destinations.ts` (`CompileDestinationFamilyId`, ordered in the non-exported `promptFamilyOrder`, incl. `rich_active_cast_dossiers`). A runtime list of family ids is **not currently exported** — this ticket adds an additive export so the validator can check family membership.
2. The model shape, the `always|conditional|never` tri-state, the `promptDestinations` `{placeholder}` syntax, and the family-id example (`"rich_active_cast_dossiers"`) are specified in `specs/SPEC-015-…md` §9, §9.2, §9.3.
3. **Shared boundary under audit**: the registry is keyed by the canonical field path from SPEC015FIEGUICON-001 (`field-paths.ts`); `getFieldGuidance` must normalize a runtime DOM path via `normalizeListIndices` before lookup so the web renderer and the core coverage tests resolve the same key. The catalog is `@loom/core`-owned and must never be serialized into project data or prompts (§9, §17).
4. **FOUNDATIONS §10 / §29.4 (no help text in prompts) — substrate**: this ticket builds the *inputs* to the no-leak invariant, not its enforcement. The `promptFacing`/`promptDestinations` model is data only; the catalog is never read by the deterministic compiler. The "guidance never enters a generated prompt" and "`promptFacing: never` entries carry no prompt-sent wording" invariants are enforced by the doctrine-regression suite in SPEC015FIEGUICON-011 and by the compiler's existing `accepted-prose-exclusion`-style isolation — named here so the model introduces no path the later surface must undo. The destination validator added here is the deterministic guard that a destination string names a real compiler placeholder/family rather than free text.

## Architecture Check

1. Separating the model + registry + lookup + destination-validator (this ticket) from the guidance *content* (004/005/006) keeps each content diff reviewable and lets the destination validator be unit-tested against a tiny fixture catalog before hundreds of entries land. Keying the registry on the canonical path (not on `FieldDescriptor` identity) decouples guidance from the descriptor shape, so `FieldDescriptor` stays unmodified.
2. No backwards-compatibility shims: net-new model; the one `compile-destinations.ts` change is an additive export of an already-existing ordered list, not a rename or alias.

## Verification Layers

1. Destination validator accepts known placeholders/families and rejects unknown → unit test (`field-guidance.test.ts`) over a fixture with one valid `{manual_must_render}`, one valid `rich_active_cast_dossiers`, and one bogus `{not_a_placeholder}`.
2. Lookup normalizes runtime indices → unit test asserting `getFieldGuidance("X.must_render.0")` resolves the entry registered at `X.must_render[]`.
3. Catalog isolation invariant → FOUNDATIONS alignment check (§10/§17): the registry exposes no serializer and is imported by no compiler/persistence module (grep-proof, re-asserted by 011).
4. Additive export does not alter compilation → `@loom/core` compiler golden tests (`compiler-golden.test.ts`) unchanged.

## What to Change

### 1. New module `packages/core/src/records/field-guidance.ts`

- `export type PromptFacing = "always" | "conditional" | "never";`
- `export interface EnumValueGuidance { short: string; implications?: string; useWhen?: string; avoidWhen?: string; }`
- `export interface FieldGuidance { fieldPath: string; surface: "story_config" | "generation_brief" | "record"; ownerKind: string; short: string; details?: string; promptFacing: PromptFacing; promptDestinations?: string[]; validationRole?: string; continuityRole?: string; authoringAdvice?: string; criticalVisibleHint?: string; doctrineWarnings?: string[]; commonMistakes?: string[]; examples?: string[]; antiExamples?: string[]; relatedFields?: string[]; enumValues?: Record<string, EnumValueGuidance>; }`
- An aggregation point: `const GUIDANCE_ENTRIES: readonly FieldGuidance[] = [ ...]` seeded empty (content tickets add `...brefConfigGuidance` etc. by importing their area module and spreading it here), and `export const GUIDANCE_REGISTRY: ReadonlyMap<string, FieldGuidance>` built from it (assert no duplicate `fieldPath`).
- `export function getFieldGuidance(path: string): FieldGuidance | undefined` — normalize via `normalizeListIndices` (from `field-paths.js`) then map-lookup.
- `export function validatePromptDestinations(g: FieldGuidance): string[]` — for each `promptDestinations` entry: a `{name}` token must have `name` ∈ `Object.keys(PLACEHOLDER_MAP)`; a bare token must be ∈ the compile-destination family ids; return offending entries (empty = valid). An empty `promptDestinations: []` is valid (required for validation-only fields, §9.3).

### 2. Additive export `packages/core/src/records/compile-destinations.ts`

- `export const compileDestinationFamilyIds: readonly CompileDestinationFamilyId[] = promptFamilyOrder;` (or extract the literal array to a named `const` the type and `promptFamilyOrder` both derive from) so the validator has a runtime family-id list.

### 3. Barrel export `packages/core/src/index.ts`

- Re-export `FieldGuidance`, `EnumValueGuidance`, `PromptFacing`, `getFieldGuidance`, `validatePromptDestinations`, and `GUIDANCE_REGISTRY` for `@loom/web`.

## Files to Touch

- `packages/core/src/records/field-guidance.ts` (new)
- `packages/core/test/field-guidance.test.ts` (new)
- `packages/core/src/records/compile-destinations.ts` (modify)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- Authoring any guidance entries (004/005/006) — the catalog ships empty.
- Coverage-completeness tests (011) and the `promptFacing: never` wording test (011).
- Deriving field paths from descriptors/schemas (003).
- Any web rendering (007+).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance` (vitest, `@loom/core`) — `validatePromptDestinations` returns `[]` for `{manual_must_render}` and `rich_active_cast_dossiers`, and returns the offending token for `{not_a_placeholder}` / `bogus_family`.
2. `npm test -- field-guidance` — `getFieldGuidance` resolves a fixture entry registered at `…must_render[]` when queried with the runtime path `…must_render.0`; duplicate `fieldPath` registration throws at build time.
3. `npm run typecheck && npm run lint` pass; `npm test` keeps `compiler-golden.test.ts` green (additive export does not change compilation).

### Invariants

1. `promptDestinations` may contain only `{<known placeholder>}` tokens or known compile-destination family ids — never free prose.
2. The guidance registry is imported by no compiler or persistence module and exposes no serializer (catalog never reaches a prompt or project file).

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance.test.ts` — model/registry build, lookup normalization, destination-validator accept/reject, duplicate-path guard.

### Commands

1. `npm test -- field-guidance`
2. `npm test -- compiler-golden` — confirms the additive `compile-destinations.ts` export does not perturb deterministic compilation (the narrow boundary at risk).
3. `npm run typecheck && npm run lint`
