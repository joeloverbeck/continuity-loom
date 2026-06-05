# SPEC003TYPDATMOD-013: Phase-3 capstone verification

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: None — verification-only; adds one end-to-end test plus a manual SQLite-inspection runbook. Introduces no production logic.
**Deps**: SPEC003TYPDATMOD-005, SPEC003TYPDATMOD-006, SPEC003TYPDATMOD-007, SPEC003TYPDATMOD-008, SPEC003TYPDATMOD-012

## Problem

SPEC-003's §Verification must be exercised end-to-end once all schema and server tickets land: the full pipeline green (`typecheck`/`lint`/`test`/`build`), the core boundary test green, the server integration behaviors composed, and a power-user SQLite inspection of a created project's `loom.sqlite`. This capstone exercises the pipeline the earlier tickets built; it adds no production code.

## Assumption Reassessment (2026-06-05)

1. Leaf-set Deps cover the full chain: 012 transitively reaches 011→{001,003,004,010} and 002,009; 005/006/007/008 are parallel core branches not in 012's transitive Deps, so they are enumerated explicitly. Together these gate every schema (001–009) and every server surface (010–012). The core boundary test (`packages/core/test/boundary.test.ts`) only passes if all `src/records/` files (001–009) are import-clean.
2. This ticket re-enumerates expected entities from a fixture at test start (e.g. counts of registered record types) rather than hardcoding, per capstone guidance — hardcoded counts go stale as the registry grows.
3. Cross-artifact boundary under audit: the assembled Phase-3 data layer end-to-end — core schemas + registry + server DDL + repository + accessors. The capstone proves they compose; it does not modify any of them.
4. FOUNDATIONS §29 (full alignment checklist) is the lens: the capstone re-confirms no §29 hard-fail surfaced during implementation (no accepted-prose-as-prompt path, no LLM record mutation, no nondeterministic compilation — none exists, no secret/key leakage, malformed payloads rejected). Restated: the capstone is the aggregate fail-closed gate for the phase.
5. SQLite inspection is a manual dry-run runbook (not test-code-runnable as a "power user with ordinary tooling" check); test-runnable portions (table presence, PRAGMA invariance, accepted-segment boundary) are automated. The acceptance criteria distinguish CI-runnable assertions from the implementer checklist.

## Architecture Check

1. A single trailing verification ticket keeps the §Verification contract in one reviewable place and avoids duplicating end-to-end assertions across implementation tickets.
2. No backwards-compatibility shims; no production logic — the capstone exercises, it does not modify.

## Verification Layers

1. Full pipeline green -> command (`npm run typecheck && npm run lint && npm test && npm run build`).
2. Core import boundary holds across all `src/records/` files -> codebase grep-proof via `packages/core/test/boundary.test.ts`.
3. End-to-end: create project → save representative records (atomic + CAST MEMBER) → reload → projections refreshed → reference-integrity holds → singletons/session round-trip → `accepted_segments` unreachable except via its API -> new e2e test (`vitest`).
4. Power-user inspection: created `loom.sqlite` shows the five tables, readable JSON payloads, and unchanged `application_id`/`user_version` -> manual runbook (dry-run checklist).

## What to Change

### 1. End-to-end test

Add `packages/server/src/spec003-data-model.e2e.test.ts`: create a temp project, drive the repository across representative record types + singletons + session + accepted-segment append, and assert the §Verification invariants (re-enumerating registered-type counts from the registry fixture, not hardcoded).

### 2. Manual SQLite-inspection runbook (in this ticket)

Implementer runbook: (a) `npm start` or create a temp project via the manager; (b) open `loom.sqlite` with `sqlite3`/a GUI; (c) confirm `records`, `record_references`, `story_config`, `generation_session`, `accepted_segments` exist; (d) confirm `payload_json` is readable JSON; (e) `PRAGMA application_id` / `PRAGMA user_version` match the SPEC-002 baseline (`user_version` === 1). Record results in the PR.

## Files to Touch

- `packages/server/src/spec003-data-model.e2e.test.ts` (new)

## Out of Scope

- Any production-logic change — belongs to tickets 001–012 (this ticket exercises them).
- Governing-doc status updates — ticket 014.
- CRUD UI / validation / compiler verification — Phases 4/6/7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck && npm run lint && npm test && npm run build` — all green (incl. core boundary test).
2. `npm test --workspace @loom/server` — the new e2e test passes all §Verification sub-cases.

### Invariants

1. The assembled Phase-3 layer composes end-to-end with no §29 hard-fail introduced.
2. Created `loom.sqlite` exposes the five tables with readable JSON payloads and the unchanged SPEC-002 PRAGMA baseline.

## Test Plan

### New/Modified Tests

1. `packages/server/src/spec003-data-model.e2e.test.ts` — end-to-end Phase-3 data-layer exercise mapping each §Verification bullet to a sub-case.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
3. Manual: `sqlite3 <project>/loom.sqlite '.tables'` and `PRAGMA user_version;` — runbook confirmation (not CI-gated; the narrower automated boundary is the e2e test, since "ordinary SQLite tooling" inspection is a human dry-run).

## Outcome

Completed: 2026-06-05.

Added aggregate SPEC-003 coverage through core and server tests that exercise schema registration, lifecycle table creation, repository round-trips, projection refresh, integrity protection, singletons/session, and accepted-segment separation.

Deviation: SQLite inspection was automated through `node:sqlite` integration tests rather than a manual GUI/sqlite3 transcript.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
