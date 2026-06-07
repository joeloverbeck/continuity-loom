# SPEC015FIEGUICON-001: Canonical field-path module and index normalization

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — new `@loom/core` field-path utility (`field-paths.ts`) + test surface and one `index.ts` export; no runtime/compiler/validator behavior change.
**Deps**: None

## Problem

SPEC-015 §10 requires ONE canonical field-path format used everywhere the guidance system reasons about a field: the catalog registry, coverage tests, UI test IDs, related-field references, and any future generated field-guide surface. The web editor renders list items at runtime with numeric DOM paths (`${path}.${index}` in `packages/web/src/records/RecordEditor.tsx`) and renames list-item descriptors to `"<name> <n>"`, while nested groups render at `${path}.${child.name}`. Without a single normalization authority, every consumer would invent its own path scheme and the `[]` list convention (§10.1, §11 rule 12) would drift. This ticket establishes the format primitives and the numeric-index → `[]` normalization that all later guidance tickets depend on.

## Assumption Reassessment (2026-06-07)

1. The web renderer's list-item path shape is `${path}.${index}` and nested-group child path is `${path}.${child.name}` — confirmed in `packages/web/src/records/RecordEditor.tsx` (`ListField` builds `path={`${path}.${index}`}`; `FieldRenderer` nested case builds `path={`${path}.${child.name}`}`). Story-config list items carry a munged descriptor name (`"special_style_constraints item"`) in `packages/web/src/config/StoryConfigEditor.tsx`, so canonical derivation must key off the owning **field name** + `[]`, never the itemDescriptor's display name.
2. The canonical format and its required example paths are defined in `specs/SPEC-015-field-guidance-and-contextual-help.md` §10.1–§10.2 (`<OWNER_KIND>.<field>[.<nested_field>][].<list_item_field>`; list items use `[]`, never numeric indexes; no record IDs/array indexes/DOM IDs). `OWNER_KIND` values are the exact record/config/group names (e.g. `CAST MEMBER` with a space — confirmed `recordType: "CAST MEMBER"` in `packages/core/src/records/cast-member.ts`).
3. **Shared boundary under audit**: the canonical path is the contract joining three artifacts — core coverage tests (this spec §16.1), the web renderer's deterministic DOM IDs (§12.2), and related-field references / future field-guide keys (§10). This module is that boundary's single source of truth; it must be `@loom/core`-owned (purity boundary: no `node:*`/`react`/`fastify` imports) so both core and web consume one implementation.

## Architecture Check

1. A pure string-format module with no dependency on Zod or React keeps the convention framework-free and reusable by both the core catalog/coverage layer and the web renderer, avoiding two divergent path schemes. Normalization is a deterministic pure function (regex collapse of numeric segments), so identical inputs always yield identical canonical paths — no incidental ordering or runtime state.
2. No backwards-compatibility aliasing or shims: this is net-new surface; no existing path helper is being wrapped or renamed.

## Verification Layers

1. Canonical format correctness (nested dot + `[]` list) → unit test (`field-paths.test.ts`) asserting the §10.2 required example paths build exactly.
2. Index normalization removes every numeric segment → unit test feeding runtime DOM paths (`X.0`, `X.2.y`) and asserting `X[]`, `X[].y`.
3. No-DOM-id / no-numeric-index invariant → unit test asserting `assertCanonical` rejects paths containing `\.\d+` or generated IDs.
4. Purity boundary preserved → `@loom/core` boundary test (`packages/core/test/boundary.test.ts`) continues to pass (no `node:*`/react imports added).

## What to Change

### 1. New module `packages/core/src/records/field-paths.ts`

- Export `buildFieldPath(ownerKind: string, segments: ReadonlyArray<{ name: string; list?: boolean }>): string` — joins `ownerKind` + segments, appending `[]` for `list: true` segments and `.` separators between named segments (a list segment renders as `.<name>[]`).
- Export `normalizeListIndices(path: string): string` — collapse every `.<digits>` segment to `[]` (e.g. `IMMEDIATE_HANDOFF.must_render.0` → `IMMEDIATE_HANDOFF.must_render[]`), so a runtime DOM path normalizes to its canonical key.
- Export `assertCanonical(path: string): void` (or a boolean `isCanonicalFieldPath`) — throw / return false when a path contains a numeric index segment, an array index, or a DOM-generated id; used by coverage tests to forbid per-index guidance (§11 rule 12).
- Keep the module free of `node:*`, `react`, `fastify`, `vite` imports (purity boundary).

### 2. Barrel export

Add `export * from "./records/field-paths.js";` (or named re-exports matching the file's public API) to `packages/core/src/index.ts` so `@loom/web` can import the canonical-path helpers.

## Files to Touch

- `packages/core/src/records/field-paths.ts` (new)
- `packages/core/test/field-paths.test.ts` (new)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- The guidance catalog model and registry (SPEC015FIEGUICON-002).
- Enumerating field paths from descriptors/schemas (SPEC015FIEGUICON-003).
- Any web-side DOM-id generation (SPEC015FIEGUICON-007 consumes these helpers).
- Mutating `FieldDescriptor` to carry a `fieldPath` — the decomposition computes paths via this util (SPEC-015 §8.3 pattern 2), leaving `FieldDescriptor` unchanged.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-paths` (vitest, `@loom/core`) — builds the §10.2 required example paths (`STORY CONTRACT.prose_preferences.psychic_distance`, `GENERATION BRIEF.manual_moment_directive.must_render[]`, `CAST MEMBER.voice_anchor.must_preserve[]`, `GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure`) exactly.
2. `npm test -- field-paths` — `normalizeListIndices` collapses every numeric segment and is idempotent on already-canonical paths; `assertCanonical` rejects a numeric-index path.
3. `npm run typecheck` and `npm run lint` pass (the latter includes the core import-boundary rule).

### Invariants

1. A canonical path contains no numeric index, array index, or DOM-generated id — list depth is expressed only by `[]`.
2. `field-paths.ts` imports nothing from `node:*`, `react`, `fastify`, or `vite` (core purity boundary holds).

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-paths.test.ts` — format-builder cases, index-normalization cases (incl. nested-inside-list), and `assertCanonical` rejection cases.

### Commands

1. `npm test -- field-paths`
2. `npm run typecheck && npm run lint`
3. `npm test` — full `@loom/core` suite incl. `boundary.test.ts`, confirming the new module does not breach the purity boundary (narrower than a repo-wide run because the invariant at risk is core-package-local).
