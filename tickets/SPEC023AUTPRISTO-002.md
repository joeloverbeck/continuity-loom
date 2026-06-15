# SPEC023AUTPRISTO-002: Core `StoryNote` schemas, types, and helpers

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/core/src/story-notes.ts` module + `@loom/core` export + core tests; no change to existing core behavior
**Deps**: 001

## Problem

Author-private Story Notes need a pure, framework-free domain shape in `@loom/core` before any persistence, route, or UI work: the `StoryNote` record, its create/update inputs, and Zod schemas that the server repository (004) and routes (005) validate every value against. The shape must live behind the core purity boundary (no `node:*`, Fastify, React, or Vite) and must be provably absent from the record registry, generation-brief, and compiler surfaces.

## Assumption Reassessment (2026-06-15)

1. The core purity boundary is enforced by `packages/core/test/boundary.test.ts` and ESLint `no-restricted-imports`; `story-notes.ts` must use the existing `globalThis.crypto` posture for UUID generation, never `node:crypto`. The public barrel is `packages/core/src/index.ts` (confirmed; re-exports `LOOM_SCHEMA_VERSION` and the record registry).
2. SPEC-023 §"Data Model / Core shape" specifies the exact field set, length caps, and schema names: `StoryNote { id, title, body, tags[], pinned, createdAt, updatedAt }`, `StoryNoteCreateInput`, `StoryNoteUpdateInput`, and `storyNote*Schema` Zod schemas. Title trimmed 1–160; body ≤200,000 untrimmed (empty valid); tag trimmed 1–32 normalized; tags array ≤12 default `[]`; strict objects.
3. **Cross-artifact boundary under audit**: the record registry is `recordTypeRegistry` (a frozen `Record<string, RecordTypeDefinition>`) in `packages/core/src/records/registry.ts`, with per-module `recordTypes` arrays. Notes must NOT be added to either, nor to `compileDestinationFamilyIds` / the `compile-destinations` module, nor to the generation-brief readiness input `GenerationSessionReady` (`packages/core/src/records/generation-brief-readiness.ts`).
4. **FOUNDATIONS principle under audit (§6.6, §10/§28.1)**: §6.6 (added by 001) establishes notes as inert scratch. §10/§28.1 forbid prose-derived prompt context — the core shape introduces no automatic summary/derived field; `body` is raw author text only.
5. **Substrate-only enforcement-surface confirmation (§8/§15)**: this ticket builds the *inputs* to enforcement surfaces a later phase proves, not the enforcement itself. The deferred surfaces are the validation snapshot/readiness (`packages/core/src/validation/`), deterministic compiler (`packages/core/src/compiler/compile-prompt.ts`), and the capstone non-leakage sentinel (ticket 009). The data model introduces no leakage or nondeterminism path those surfaces would have to undo: `StoryNote` carries no record reference, no POV/secret field, no compile destination, and no wall-clock-derived canonical field (timestamps are server-stamped capture metadata produced by 004, not compiler inputs). Determinism (§8) and the secret firewall (§15) are unaffected because no compiler/validation code imports `story-notes.ts` — proven by Verification Layer 5.
6. **Mismatch + correction**: an earlier spec draft named the brief readiness input `GenerationSessionReadyInput`; `/reassess-spec` (this session) corrected it to the actual `GenerationSessionReady` / `normalizeGenerationSessionForReadiness`. The generation-brief exclusion test below asserts against the corrected symbol.

## Architecture Check

1. A dedicated `story-notes.ts` module keeps the Notes shape isolated from the record graph — separation is itself the isolation proof, cleaner than threading an optional note variant through `recordTypeRegistry` (which would couple notes to record validation/compilation).
2. No backwards-compatibility aliasing/shims: a single new module, single barrel export, no parallel/legacy note shape.
3. **Same revision; never merge standalone ahead of 001 (§1.1)** — co-lands with the FOUNDATIONS amendment.

## Verification Layers

1. Core purity preserved -> codebase grep-proof (`story-notes.ts` imports no `node:*`/`fastify`/`react`/`vite`) + `packages/core/test/boundary.test.ts` stays green.
2. Schema correctness (title bounds, body cap + empty-ok, tag normalization + de-dup, tags cap, strict-object rejection of unknown keys) -> schema validation (Vitest cases in `story-notes.test.ts`).
3. Registry exclusion: no `NOTE`/`STORY_NOTE`/equivalent key in `recordTypeRegistry` or any `recordTypes` array -> codebase grep-proof + assertion test.
4. Generation-brief exclusion: note-shaped data is rejected by `GenerationSessionReady` / brief schemas -> schema validation test.
5. Compiler exclusion: no `story-notes` import exists under `packages/core/src/compiler/` -> codebase grep-proof.

## What to Change

### 1. New pure module `packages/core/src/story-notes.ts`

- Types: `StoryNote`, `StoryNoteCreateInput`, `StoryNoteUpdateInput` exactly per SPEC-023 §"Core shape".
- Zod schemas: `storyNoteIdSchema` (UUID), `storyNoteTitleSchema` (trim, 1–160), `storyNoteBodySchema` (≤200,000, not trimmed, empty allowed), `storyNoteTagSchema` (trim, 1–32, Unicode letters/numbers/space/`_`/`-`/`.`, no control chars), `storyNoteTagsSchema` (array, ≤12, default `[]`), `storyNoteSchema` (strict), `storyNoteCreateInputSchema` (strict), `storyNoteUpdateInputSchema` (strict).
- Pure helper `generateStoryNoteId()` using the existing `globalThis.crypto` posture (UUIDv7-style), no `node:*` import.
- Tag normalization helper used by both validation and (later) the repository's case-insensitive de-dup while preserving a stable display form.

### 2. Export from `packages/core/src/index.ts`

Add the new types, schemas, and helper to the barrel. Do NOT register anything in `recordTypeRegistry` or the compiler/brief surfaces.

## Files to Touch

- `packages/core/src/story-notes.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/story-notes.test.ts` (new)

## Out of Scope

- SQLite DDL, schema-version bump, migration (ticket 003).
- `StoryNotesRepository` and persistence (ticket 004).
- Routes, web client, UI (tickets 005–008).
- Any record-registry / compiler / generation-brief integration — Notes stay absent from all three by construction.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — `story-notes.test.ts` covers valid/invalid title (empty, >160, whitespace-only), body (empty ok, >200,000 rejected), tag (control char rejected, normalized, case-insensitive de-dup), tags cap (>12 rejected), and strict-object unknown-key rejection for create/update.
2. `npm test --workspace @loom/core` — `boundary.test.ts` still passes (core purity intact); registry-exclusion and brief-exclusion assertions pass.
3. `npm run typecheck` — `@loom/core` types compile; the barrel re-exports resolve.

### Invariants

1. No `story-notes` symbol is imported anywhere under `packages/core/src/compiler/` or referenced by `recordTypeRegistry` / `recordTypes`.
2. `StoryNote` carries no record reference, compile destination, POV/secret field, or readiness status — the data contract is inert scratch.

## Test Plan

### New/Modified Tests

1. `packages/core/test/story-notes.test.ts` (new) — schema validity matrix + registry/brief/compiler exclusion assertions.
2. `packages/core/test/boundary.test.ts` (existing, must stay green) — confirms `story-notes.ts` adds no forbidden import.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck`
3. `grep -rn "story-notes" packages/core/src/compiler/ packages/core/src/records/registry.ts` — must return no production import (exclusion grep-proof); the narrower grep is the correct boundary because it proves the isolation invariant directly.
