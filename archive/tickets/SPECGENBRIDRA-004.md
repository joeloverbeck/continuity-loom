# SPECGENBRIDRA-004: Repository read/write paths parse via draft schema

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `record-repository.ts` and `working-set-integrity-migration.ts` parse persisted generation-session state with `generationSessionDraftSchema` instead of the strict `generationSessionSchema`; new test file
**Deps**: SPECGENBRIDRA-001

## Problem

Every server path that reads or writes the persisted generation session currently parses with the strict `generationSessionSchema`. The moment a partial draft is allowed (SPECGENBRIDRA-005), each of these throws: `setGenerationSession` (`packages/server/src/record-repository.ts:361`), `getGenerationSession` (`:380`), `pruneDeletedRecordFromGenerationSession` (`:392`, which fires on **any record deletion**), and `working-set-integrity-migration.ts:34`. This ticket switches all four to `generationSessionDraftSchema` so persisted partial drafts round-trip without error. It is the persistence-layer precondition for the route contracts (SPECGENBRIDRA-005) and migration (SPECGENBRIDRA-007).

## Assumption Reassessment (2026-06-07)

1. The four strict-parse sites exist exactly as the spec's §Migration section now documents: `record-repository.ts:361` (`generationSessionSchema.parse(payloadInput)`), `:380` (`parseJsonWithSchema(row.payload_json, generationSessionSchema, …)`), `:392` (`generationSessionSchema.parse(JSON.parse(...))`), and `working-set-integrity-migration.ts:34`. Confirmed this session via grep. `generation-brief-descriptors.ts:5` consumes the schema *shape* (not persisted data) and must stay on the strict schema — out of scope.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §Migration and backfill) explicitly enumerates these three runtime read paths and excludes the descriptors consumer; this ticket implements that enumeration.
3. Shared boundary under audit: the persisted `generation_session` row contract. `generationSessionDraftSchema` (SPECGENBRIDRA-001) is a superset of `generationSessionSchema`, so previously-stored strict sessions remain valid under the draft schema (no data loss on read). `pruneWorkingSetReferences` (used at `:392`) operates on the parsed object structurally and is shape-compatible with the draft type.
4. FOUNDATIONS restated: §24 local-first/user-owned data — switching the parse schema must preserve existing stored data integrity and inspectability (a stricter-written session still reads). §11 — this relaxes *persistence* parsing only; it does not weaken any generation validation gate (Preview/Generate strictness is unchanged and lives elsewhere).
5. Schema-consumer classification: this is a **consumer switch**, not a schema extension — the four sites change which schema parses persisted state. The change is safe because draft ⊇ strict; it is additive at the data level (no stored field is dropped or made invalid). Consumers updated: the three repository methods + the working-set migration parse.
6. Mismatch + correction: the spec's read-path enumeration was added during the in-session `/reassess-spec` run (finding I3); this ticket is its direct implementation, so there is no spec/codebase drift to reconcile beyond confirming the four line references above.

## Architecture Check

1. Routing all persisted-state reads through the permissive draft schema (while the strict schema stays the generation-ready authority) matches the spec's "different acts, different contracts" model and removes a whole class of false failures (record deletion throwing on a partial draft) at the correct layer — persistence, not validation.
2. No backwards-compatibility aliasing/shims: the strict schema is not wrapped or aliased; each site is switched outright to the draft schema. `generationSessionSchema` remains for shape descriptors and the generation-ready path only.

## Verification Layers

1. Partial-draft round-trip invariant (a stored partial draft is read back by `getGenerationSession` without throwing) -> server test in `record-repository-draft.test.ts`.
2. Record-deletion resilience invariant (`pruneDeletedRecordFromGenerationSession` does not throw when the stored session is a partial draft) -> server test deleting a referenced record with a partial draft present.
3. Backward-data invariant (a session previously written under the strict schema still reads under the draft schema) -> server test seeding a strict-shaped row then reading.
4. Strict-shape-descriptor untouched invariant (`generation-brief-descriptors.ts` still imports `generationSessionSchema`) -> codebase grep-proof.

## What to Change

### 1. `packages/server/src/record-repository.ts`

- Import `generationSessionDraftSchema` from `@loom/core`.
- `setGenerationSession`: parse `payloadInput` with `generationSessionDraftSchema` before storing (route-level merge/normalize lands in SPECGENBRIDRA-005; the repository accepts an already-merged draft payload).
- `getGenerationSession`: parse the stored row with `generationSessionDraftSchema` via `parseJsonWithSchema`.
- `pruneDeletedRecordFromGenerationSession`: parse the stored row with `generationSessionDraftSchema` before `pruneWorkingSetReferences`.

### 2. `packages/server/src/working-set-integrity-migration.ts`

- Switch the line-34 parse from `generationSessionSchema` to `generationSessionDraftSchema` (and update the import) so working-set integrity repair tolerates partial drafts.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify)
- `packages/server/src/working-set-integrity-migration.ts` (modify)
- `packages/server/src/record-repository-draft.test.ts` (new)

## Out of Scope

- Field-aware merge, normalization, and the `malformed-draft` 400 response (SPECGENBRIDRA-005).
- One-time backfill of stored sessions — default context, fabricated-directive strip, empty cast-pressure removal (SPECGENBRIDRA-007).
- `generation-brief-descriptors.ts` (stays on the strict schema).
- Snapshot-builder defaulting (SPECGENBRIDRA-006).

## Acceptance Criteria

### Tests That Must Pass

1. Storing a partial/blank draft via `setGenerationSession` and reading it via `getGenerationSession` returns the stored draft with `ok: true` (no throw).
2. Deleting a record referenced by a partial draft does not throw in `pruneDeletedRecordFromGenerationSession`.
3. A session row written in the strict shape still parses under the draft schema on read.
4. `npm test` passes (server + core).

### Invariants

1. Previously-stored strict-shaped generation sessions remain readable after the switch — no data migration is required for read compatibility (§24).
2. `generation-brief-descriptors.ts` continues to consume `generationSessionSchema` (the strict shape stays the descriptor authority).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-repository-draft.test.ts` (new) — partial-draft round-trip, record-deletion resilience, and strict-row backward-read against the draft schema.

### Commands

1. `npx vitest run packages/server/src/record-repository-draft.test.ts` — targeted repository draft-parse tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate.

## Outcome

Completion date: 2026-06-07

Switched persisted generation-session parsing in `record-repository.ts` and `working-set-integrity-migration.ts` from the strict schema to `generationSessionDraftSchema`. Added repository-level draft persistence coverage in `packages/server/src/record-repository-draft.test.ts`, updated route/repository expectations for draft-shape preservation, and kept `generation-brief-descriptors.ts` on the strict schema.

Deviations from original plan: `packages/core/src/records/working-set-integrity.ts` needed a narrow type adjustment because `pruneWorkingSetReferences` only depends on `active_working_set` but was typed to the strict `GenerationSession`. It now accepts draft-shaped sessions and defaults missing working-set arrays to empty arrays during pruning.

Verification results:

- `npm exec vitest run packages/server/src/record-repository-draft.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
- `git diff --check` passed.
