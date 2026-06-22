# SPEC030RECHYGWOR-006: Capstone — cross-surface scope regression

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends `packages/server/src/record-hygiene.e2e.test.ts` with both-mode end-to-end coverage and cross-surface regression assertions; no production behavior change.
**Deps**: `archive/tickets/SPEC030RECHYGWOR-004.md`

## Problem

The scope feature spans core (mode + compiler + version), server (snapshot scoping + routes), and web (selector + disclosure). This capstone exercises the composed pipeline end-to-end and pins the cross-surface invariants the spec's §Verification names: both modes compile and analyze correctly; the working-set scope discloses and renders completely within scope; prose/ideation goldens are unchanged except version metadata; active-working-set *prose* compilation stays selected-record-only and independent of hygiene scope; no DB migration; no persisted hygiene output. It introduces no new production logic — it verifies the pipeline the earlier tickets composed.

## Assumption Reassessment (2026-06-22)

1. Current surface confirmed this session: `packages/server/src/record-hygiene.e2e.test.ts` exists ("record hygiene end-to-end conformance", `:25`) and drives compile/analyze with `payload: { mode: "full_active_atomic_review" }` (`:71,227`). It is the natural host for the both-mode end-to-end coverage (extend, not a new file → no collision).
2. Specs/docs confirmed: the spec's §Verification (`archive/specs/SPEC-030-record-hygiene-working-set-scope.md:358-382`) and Deliverable 6 capstone bullet (`:337-340`) enumerate the cross-surface regression checks this ticket pins.
3. Cross-artifact boundary under audit: this ticket exercises the full record-hygiene pipeline (route → snapshot builder → compiler) for both modes and asserts non-interference with prose/ideation compilation. It maps each spec §Verification bullet to a runnable assertion; it modifies no upstream production file (it exercises them).
4. FOUNDATIONS principle restated: §8 (deterministic compilation — identical inputs+versions → identical prompt), §10/§29.1 (no accepted prose in prompts), §29.3/§29.4 (scope disclosed, no eviction). The capstone proves these hold across the composed feature, not just per-ticket.
5. Test-armoring scope (this ticket modifies only test code): the FOUNDATIONS surface under test is the deterministic record-hygiene compiler + the working-set-scoped snapshot builder; this ticket changes no production behavior — it adds e2e assertions that exercise the existing surfaces in a sandbox (a temporary project DB), confirming the secret firewall (SECRET payloads sent only on explicit analyze, never logged) and determinism hold end-to-end.
6. Adjacent contradiction classification: re-enumerate expected in-scope counts from the test fixture at test start rather than hardcoding (hardcoded counts go stale against fixture edits) — a required consequence of capstone discipline, not a separate change.

## Architecture Check

1. A single trailing capstone exercising the composed pipeline is cleaner than duplicating cross-surface assertions into each implementation ticket: it gives one authoritative end-to-end gate and keeps the per-ticket tests focused on their unit. Extending the existing e2e file (vs a new one) reuses the established harness.
2. No backwards-compatibility aliasing/shims: the capstone adds assertions only; it introduces no production code and no compatibility path.

## Verification Layers

1. Whole-project mode end-to-end includes all non-archived hygiene-active records; working-set mode includes exactly the in-scope records and discloses `hygiene_scope: active_working_set` → server e2e (`record-hygiene.e2e.test.ts`).
2. Empty working-set scope returns the truthful empty state distinct from empty-project → server e2e.
3. Prose + ideation goldens unchanged except version metadata; active-working-set prose compilation stays selected-record-only and independent of hygiene scope → core golden re-run + FOUNDATIONS alignment check (the prose path never reads the hygiene mode).
4. No DB migration and no persisted hygiene output → codebase grep-proof (no new migration file; no hygiene-output persistence write path) + manual review.

## What to Change

### 1. Extend the end-to-end conformance test

In `packages/server/src/record-hygiene.e2e.test.ts`, add cases driving compile + analyze in `active_working_set_atomic_review` mode against a fixture project whose working set selects a subset of hygiene-active records: assert the compiled prompt discloses the active scope and renders exactly the in-scope corpus (counts re-enumerated from the fixture); assert a selected-but-archived/terminal record is excluded; assert empty working-set scope yields the truthful empty state. Keep the existing whole-project conformance case as the SPEC-027 regression.

### 2. Pin the cross-surface non-interference invariants

Assert (by running the existing suites / targeted checks) that prose and ideation goldens differ from pre-feature only in version metadata, that prose active-working-set compilation is unaffected by hygiene mode, that no new migration is introduced, and that no hygiene output is persisted.

## Files to Touch

- `packages/server/src/record-hygiene.e2e.test.ts` (modify)

## Out of Scope

- Any production logic (this ticket is verification-only; the upstream tickets own all behavior).
- The §8 contract docs (-002) and trailing docs (-005).
- Modifying the upstream tickets' files — the capstone exercises them, it does not change them.

## Acceptance Criteria

### Tests That Must Pass

1. `record-hygiene.e2e.test.ts` passes both the whole-project (SPEC-027 regression) and working-set scope cases, including the archived-in-scope-excluded and empty-scope cases, with in-scope counts re-enumerated from the fixture.
2. `npm run lint && npm run typecheck && npm test && npm run build` all green — the full gate the spec requires for every ticket.
3. Prose + ideation goldens pass with only version-metadata differences from pre-feature; no new migration file exists under the server's migration path; no hygiene-output persistence write exists.

### Invariants

1. Identical fixture + mode + versions → identical compiled hygiene prompt end-to-end (deterministic pipeline).
2. The prose prompt path is independent of the hygiene scope mode and remains selected-record-only; accepted prose and notes are absent from every prompt.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-hygiene.e2e.test.ts` — adds working-set + empty-scope + archived-in-scope end-to-end cases; retains the whole-project conformance case.

### Commands

1. `npm test -- record-hygiene.e2e` (targeted end-to-end conformance).
2. `npm run lint && npm run typecheck && npm test && npm run build` (the full capstone gate proving the composed feature regresses nothing across packages).
3. The full pipeline is the correct boundary because the capstone's purpose is whole-feature regression across core + server + web; a narrower command cannot prove cross-surface non-interference.

## Outcome

Completed: 2026-06-22

What changed:

- Extended `packages/server/src/record-hygiene.e2e.test.ts` with a both-mode capstone case.
- The new case compiles whole-project and active-working-set hygiene prompts against one temporary project, proves whole-project includes an active unselected fact, proves working-set scope includes only selected hygiene-active records, excludes a selected terminal plan, discloses `hygiene_scope: active_working_set`, and sends the scoped prompt on analyze.
- The existing e2e case continues to cover full-project determinism, accepted prose/private notes exclusion, prose/ideation non-interference, no persisted hygiene output, and reference-integrity guardrails.

Deviations:

- The first full `npm test` run failed in unrelated `AcceptedSegmentsView` UI test `keeps display indices stable under filters and restores tracked expansion after clearing`. The focused rerun of that file passed, and the broad `npm test` rerun passed.

Verification:

- `npm test -- record-hygiene.e2e` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` initially failed in the unrelated accepted-segments assertion noted above; `npm test -- AcceptedSegmentsView` passed; broad `npm test` rerun passed.
- `npm run build` passed.
- `rg -n "hygiene|record_hygiene|record-hygiene" packages/server/src/*migration*.ts packages/server/src/project-store.ts packages/server/src/record-repository.ts packages/server/src/version-schema.ts` returned no matches.
