# SPECGENBRIDRA-007: Generation-session draft migration & backfill

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new on-open migration `generation-session-draft-migration.ts` (default context, strip fabricated directive, remove empty cast-pressure rows), wired in `project-store.ts`; new test file
**Deps**: SPECGENBRIDRA-001, SPECGENBRIDRA-004

## Problem

Existing stored generation sessions carry artifacts of the old strict/UI-fabricating model: a UI-fabricated `manual_moment_directive.must_render: ["Continue the immediate moment."]`, possibly-missing `generation_context`, and empty current-cast-pressure rows. Because the project has not yet successfully generated a prompt, a simple, explicit one-time migration can clean these up on project open. This ticket adds that migration alongside the existing on-open backfills, applying the spec's conservative, no-silent-mutation rules.

## Assumption Reassessment (2026-06-07)

1. On-open backfills are wired in `packages/server/src/project-store.ts` at the open chain (`:248–250`: `backfillDisplayLabels(database)`, `migrateGlobalConfigRecords(database)`, `repairWorkingSetReferences(database)`) and a second open path near `:347`; each takes the `DatabaseSync`. Confirmed this session — the new migration follows this signature and is added to both open sites.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §Migration and backfill, as corrected in-session) prescribes: read stored sessions through the draft schema (the read-path switch is SPECGENBRIDRA-004, this ticket's Dep), default missing `generation_context` from accepted-segment count, preserve nonblank `soft_unit_guidance`, remove empty current-cast-pressure rows, and strip the fabricated directive **only** under the exact sole-entry rule.
3. Shared boundary under audit: the stored `generation_session` row. This migration WRITES partial drafts (stripping the directive can leave `must_render` empty), so it depends on SPECGENBRIDRA-004 — otherwise the post-migration `getGenerationSession` (strict, pre-004) would throw. It imports `deriveGenerationContextDefault` + `generationSessionDraftSchema` from `@loom/core` (SPECGENBRIDRA-001).
4. FOUNDATIONS restated: §4.1 user-owned continuity & §20 no silent mutation — the directive strip MUST be conservative: remove only when `manual_moment_directive.must_render` is exactly `["Continue the immediate moment."]` (sole entry, byte-identical). Any other content (additional entries, different text, the phrase among others) is left untouched, because there is no reliable way to distinguish a user who authored that exact phrase. The migration must not heuristically guess authorship beyond this rule.
5. Stored-schema classification: the migration mutates stored draft rows in place; it parses with `generationSessionDraftSchema`, applies the deterministic transforms, and re-stores canonical JSON. It is idempotent — re-running on an already-migrated row is a no-op (no sole-entry fabricated directive remains; context already present). No new field is added.
6. Mismatch + correction: the conservative exact-sole-entry rule replaced the spec's original looser "if identified as the UI fallback" heuristic during the in-session `/reassess-spec` run (user-approved option (a)); this ticket implements the corrected rule, not the original prose.

## Architecture Check

1. A dedicated on-open migration module (mirroring `display-label-backfill`, `global-config-migration`, `working-set-integrity-migration`) is the established pattern for one-time stored-data cleanup and keeps the transform isolated and idempotent. Defaulting context here is belt-and-suspenders with the read-time defaults (GET/snapshot) and harmless because deterministic.
2. No backwards-compatibility aliasing/shims: the fabricated-directive value is removed, not preserved behind a flag; the migration is idempotent rather than version-gated.

## Verification Layers

1. Conservative-strip invariant (exact `["Continue the immediate moment."]` removed; any other `must_render` untouched) -> server test in `generation-session-draft-migration.test.ts`.
2. Context-backfill invariant (missing `generation_context` filled from accepted-segment count; existing valid context preserved) -> server test.
3. Empty-row-removal invariant (empty current-cast-pressure rows removed; nonblank `soft_unit_guidance` preserved) -> server test.
4. Idempotency invariant (second run is a no-op) -> server test running the migration twice.
5. Wiring invariant (migration invoked on project open at both sites) -> codebase grep-proof against `project-store.ts`.

## What to Change

### 1. New `packages/server/src/generation-session-draft-migration.ts`

- Export `migrateGenerationSessionDraft(database: DatabaseSync): void` (matching the sibling backfill signatures). Read the `generation_session` row; if absent, return. Parse with `generationSessionDraftSchema`. Apply, deterministically: (a) if `manual_moment_directive.must_render` is exactly `["Continue the immediate moment."]`, drop it; (b) if `generation_context` is absent, set it via `deriveGenerationContextDefault` using the accepted-segment count from the DB; (c) preserve nonblank `soft_unit_guidance`; (d) remove empty current-cast-pressure rows. Re-store canonical JSON only if something changed. Idempotent.

### 2. `packages/server/src/project-store.ts`

- Import and invoke `migrateGenerationSessionDraft(database)` in the on-open chain at both open sites (after `repairWorkingSetReferences`, ~`:250` and ~`:347`).

## Files to Touch

- `packages/server/src/generation-session-draft-migration.ts` (new)
- `packages/server/src/project-store.ts` (modify)
- `packages/server/src/generation-session-draft-migration.test.ts` (new)

## Out of Scope

- The repository read-path schema switch (SPECGENBRIDRA-004 — depended upon).
- Read-time context defaults in GET/snapshot (SPECGENBRIDRA-005/-006).
- Removing the UI fabrication going forward (SPECGENBRIDRA-008).

## Acceptance Criteria

### Tests That Must Pass

1. A stored session with `must_render: ["Continue the immediate moment."]` (sole entry) has that directive removed; a session with additional or different entries is left untouched.
2. A stored session missing `generation_context` is backfilled deterministically from accepted-segment count; an existing valid context is preserved.
3. Empty current-cast-pressure rows are removed; nonblank `soft_unit_guidance` is preserved.
4. Running the migration twice produces no further change (idempotent).
5. `npm test` passes.

### Invariants

1. The migration never removes or rewrites a `must_render` that is not the exact sole-entry fabricated fallback (§4.1/§20 — no silent mutation of authored state).
2. The migration is deterministic and idempotent; it introduces no accepted prose or invented continuity.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generation-session-draft-migration.test.ts` (new) — conservative strip, context backfill, empty-row removal, soft-guidance preservation, idempotency, and a negative test for a user-authored directive matching the phrase among other entries.

### Commands

1. `npx vitest run packages/server/src/generation-session-draft-migration.test.ts` — targeted migration tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate.

## Outcome

Completion date: 2026-06-07

Added `migrateGenerationSessionDraft(database)` and wired it into both project create/open migration chains. The migration removes only the exact sole fabricated directive, backfills missing `generation_context` from accepted-segment count, removes semantically empty current-cast-pressure rows, preserves nonblank stop guidance, and writes only when the canonical stored draft changes.

Deviations from original plan: none.

Verification results:

- `npm exec vitest run packages/server/src/generation-session-draft-migration.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
- `git diff --check` passed.
