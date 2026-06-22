# SPEC030RECHYGWOR-003: Server snapshot scope selection and route mode plumbing

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends the `RecordHygieneRepository` interface and `buildStoryRecordHygieneSnapshot` to apply a user-selected scope; threads the request mode through the record-hygiene routes; adds a read-not-write working-set test. No change to prose/ideation compilation.
**Deps**: `archive/tickets/SPEC030RECHYGWOR-002.md`

## Problem

The widened request mode (-002) is inert until the server actually restricts the hygiene corpus. In `active_working_set_atomic_review` mode, the snapshot builder must scope the candidate corpus to `active_working_set.selected_records` (read from the generation session) **before** applying the unchanged archive + per-type-status predicate, and the route must accept and forward the mode. Scope membership is a pure id-set test — no ranking, salience, recency, or token-budget logic — so determinism and §29.3/§29.4 (no eviction) hold. The scope reads the working set and never writes it (§6.4: reading is not a mutation).

## Assumption Reassessment (2026-06-22)

1. Current server surfaces confirmed this session: `RecordHygieneRepository` (interface, `packages/server/src/record-hygiene-snapshot-builder.ts:18-22`) exposes `listRecords`/`referencesForRecord`/`incomingReferencesForRecord` and **no** working-set accessor; `buildStoryRecordHygieneSnapshot(repository)` (`:24`) takes no request; the route builds the repo via `manager.getRecordRepository()` and calls `buildStoryRecordHygieneSnapshot(repository)` at `record-hygiene-routes.ts:109`, with mode parsing/rejection at `:130-138` and `allowedRequestKeys` at `:11`.
2. Specs/docs confirmed: Deliverable 2 + 3 (`archive/specs/SPEC-030-record-hygiene-working-set-scope.md:270-295`) and the reassess A1 edge (`:283-290`): empty/absent working set, archived/terminal selected id, non-existent id, and a malformed/unreadable session all resolve to a deterministic empty-or-filtered corpus — never a spurious 422.
3. Cross-artifact boundary under audit: the `RecordHygieneRepository` interface is the seam between the route's concrete repository and the pure snapshot builder. The concrete `getRecordRepository()` already implements `getGenerationSession(): JsonReadResult` (`packages/server/src/record-repository.ts:371`), so adding `getGenerationSession` to the `RecordHygieneRepository` interface does NOT break the concrete implementor — only the test double `fakeRepository` (`record-hygiene-snapshot-builder.test.ts:55-58`) must add the member.
4. FOUNDATIONS principle restated: §29.3 (reworded by -001) forbids applying a scope the user did not select and forbids incompletely rendering the predicate *within* the selected scope; §29.4 forbids eviction. The scope here is an explicit id-set membership test over `selected_records` (a first-class authorial decision, §7), applied before the unchanged predicate; every in-scope record satisfying the predicate is included.
5. Deterministic-compilation + secret-firewall enforcement surface: `buildStoryRecordHygieneSnapshot`. Confirm the scope read introduces no nondeterminism — `getGenerationSession()` returns stored session JSON; membership is an id-set test; output order remains the existing `HYGIENE_TYPE_ORDER` + within-type ordering, NOT working-set order. No working-set write occurs (read-only `getGenerationSession`). SECRET payload handling is unchanged (the predicate is untouched).
6. Existing output schema extended: `buildStoryRecordHygieneSnapshot` gains a request/mode parameter — a **breaking signature change** for its sole caller (`record-hygiene-routes.ts:109`) and its test (`record-hygiene-snapshot-builder.test.ts`). Both co-land here; CLAUDE.md forbids a compatibility-default shim. This is the indivisibility rationale for merging Deliverables 2 and 3 into one ticket (the route caller fails typecheck the instant the signature changes).
7. Adjacent contradiction classification: `getGenerationSession` returns `JsonReadResult` (a discriminated union; `not-found`/parse-failure are non-`ok`). A non-`ok` session, or an `ok` session with an absent/malformed `active_working_set.selected_records`, is a required consequence handled here (→ empty in-scope corpus), not a separate bug. The `objectPayload` defensive-parse helper in `working-set-routes.ts:16` is private; the builder replicates an equivalent local `Array.isArray(...) ? ... : []` parse rather than importing it.

## Architecture Check

1. Applying scope in the snapshot builder (server) — not the compiler (core) — preserves the §8 deterministic-renderer boundary: the compiler still renders whatever snapshot it is given. Reading `selected_records` through the existing `getGenerationSession()` reuses the generation-session store; no new storage, schema, or migration.
2. No backwards-compatibility aliasing/shims: `buildStoryRecordHygieneSnapshot`'s signature changes in place and its sole caller + test double update in the same diff; the `RecordHygieneRepository` interface gains a real member rather than an optional shim.

## Verification Layers

1. Whole-project mode includes all non-archived hygiene-active records even when absent from the working set (SPEC-027 invariant intact) → server unit test (`record-hygiene-snapshot-builder.test.ts`).
2. Working-set mode includes exactly the in-scope hygiene-active records and no others; archived/terminal in-scope records excluded by the normal predicate; non-existent selected id ignored → server unit test.
3. A malformed in-scope record row → `422 malformed-hygiene-source`; a malformed/absent **session** → empty in-scope corpus, never 422 → server unit test (distinct proof surfaces for row-malformed vs session-malformed).
4. Scope reads but never writes the working set → server route test asserting `getGenerationSession` is read and no working-set write path is invoked (`record-hygiene-routes.test.ts`).

## What to Change

### 1. Extend the repository interface (snapshot builder)

In `packages/server/src/record-hygiene-snapshot-builder.ts`, add `getGenerationSession(): JsonReadResult` to `RecordHygieneRepository` (import `JsonReadResult` from `./record-repository.js`). Change `buildStoryRecordHygieneSnapshot` to accept the request/mode alongside the repository.

### 2. Apply scope before the predicate

For `active_working_set_atomic_review`, read `getGenerationSession()`; on `ok`, parse `active_working_set.selected_records` defensively (`Array.isArray(...) ? ... : []`); restrict the candidate corpus to that id-set **before** the existing archive + per-type-status predicate. A non-`ok` session or absent/malformed `selected_records` → empty id-set → empty in-scope corpus. Whole-project mode is byte-for-byte unchanged. Output order is the existing fixed order, independent of working-set order. A malformed in-scope row still returns `422 malformed-hygiene-source`; a malformed row outside the scope is not consulted.

### 3. Thread the mode through the route

In `packages/server/src/record-hygiene-routes.ts`, pass the parsed mode from `compileFromOpenProject` (`:99-116`) into `buildStoryRecordHygieneSnapshot`. `allowedRequestKeys` already permits `mode` (`:11`); update the mode acceptance at `:135-138` to accept both modes and reject any other. Add a test that working-set mode reads but never writes the working set.

## Files to Touch

- `packages/server/src/record-hygiene-snapshot-builder.ts` (modify)
- `packages/server/src/record-hygiene-routes.ts` (modify)
- `packages/server/src/record-hygiene-snapshot-builder.test.ts` (modify) — `fakeRepository` gains `getGenerationSession`; scope/edge-case cases
- `packages/server/src/record-hygiene-routes.test.ts` (modify) — both modes accepted; read-not-write working-set assertion

## Out of Scope

- Core request type / compiler scope line / version bump (`archive/tickets/SPEC030RECHYGWOR-002.md`).
- Web scope selector / API client (SPEC030RECHYGWOR-004).
- The §8 contract docs (co-landed in -002) and trailing docs (-005).
- Any new storage, schema field, or migration; any working-set mutation.
- Changing the hygiene-active predicate itself.

## Acceptance Criteria

### Tests That Must Pass

1. `record-hygiene-snapshot-builder.test.ts`: whole-project mode includes a hygiene-active record absent from the working set; working-set mode includes exactly the in-scope hygiene-active records; a working-set-selected-but-archived/terminal record is excluded; a selected id that does not exist is ignored; a malformed/absent session → empty in-scope corpus (not 422); a malformed in-scope row → 422.
2. `record-hygiene-routes.test.ts`: both modes are accepted; an invalid mode is rejected; working-set mode reads `getGenerationSession` and invokes no working-set write.
3. `npm run typecheck && npm test && npm run lint` green (signature change + interface member + caller all co-land).

### Invariants

1. Identical project state + mode → identical snapshot (deterministic id-set membership; fixed output order independent of working-set order).
2. The scope path performs no working-set write and grants no record prose authority; whole-project mode output is byte-for-byte unchanged from SPEC-027.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-hygiene-snapshot-builder.test.ts` — adds `getGenerationSession` to the test double and the scope + edge-case cases (archived/terminal/non-existent/malformed-session).
2. `packages/server/src/record-hygiene-routes.test.ts` — both-modes-accepted + read-not-write working-set assertion.

### Commands

1. `npm test -- record-hygiene` (targeted server hygiene unit + route tests).
2. `npm run typecheck && npm test && npm run lint` (proves the breaking signature change co-lands with its caller + test double across the package).
3. A package-scoped `npm test` is sufficient here because the change is confined to `@loom/server`; the core version bump and goldens are proved by -002.

## Outcome

Completed: 2026-06-22

What changed:

- Extended `RecordHygieneRepository` with `getGenerationSession()` and changed `buildStoryRecordHygieneSnapshot(repository, request)` to apply working-set scope before the hygiene-active predicate.
- Preserved whole-project mode behavior while making working-set mode an explicit selected-ID set test with fixed type/full-label/id output order.
- Treated absent, malformed, or wrong-shaped generation-session working-set data as an empty working-set scope.
- Kept malformed selected source rows fail-closed as `422 malformed-hygiene-source` while ignoring malformed rows outside the selected working-set scope.
- Threaded both request modes through `/api/record-hygiene/compile` and `/api/record-hygiene/analyze`, with unsupported modes rejected.
- Added route coverage proving working-set mode reads the selected IDs by producing a scoped prompt and does not mutate the working set.

Deviations:

- No browser smoke was run for this server-only ticket. The request shape was exercised through Fastify route injection against a temporary project; the UI/browser selector is owned by SPEC030RECHYGWOR-004 and cross-surface end-to-end proof is owned by SPEC030RECHYGWOR-006.

Verification:

- `npm test -- record-hygiene` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
