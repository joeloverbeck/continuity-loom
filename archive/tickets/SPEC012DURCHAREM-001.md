# SPEC012DURCHAREM-001: `reminder_state` table + repository methods

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `reminder_state` single-row storage table (project-local SQLite); 3 new `RecordRepository` methods (`getLatestAcceptedSegment`, `getReminderAcknowledgedSequence`, `acknowledgeRemindersThrough`)
**Deps**: None

## Problem

Phase 12's durable-change reminder is derived from "is there an accepted segment newer than what the user acknowledged?" That needs (a) a project-local place to persist the acknowledged-through threshold and (b) read/write methods over it and the existing `accepted_segments` archive. This ticket adds the storage substrate only — no routes, no UI. It is the foundation every later reminder ticket reads from. (SPEC-012 Deliverable 1.)

## Assumption Reassessment (2026-06-06)

1. **Single-row state precedent exists.** `packages/server/src/record-tables.ts:39-43` defines `generation_session (id INTEGER PRIMARY KEY CHECK (id = 1), payload_json TEXT NOT NULL, updated_at TEXT NOT NULL)`, created by `ensureRecordTables` (`record-tables.ts:3`), itself called on every open at `packages/server/src/project-store.ts:241,337`. `reminder_state` mirrors this exact pattern.
2. **Archive shape confirmed.** `accepted_segments` (`record-tables.ts:45-51`) has `sequence INTEGER NOT NULL UNIQUE` and `created_at TEXT NOT NULL`; existing repo methods map `created_at → createdAt` (`record-repository.ts:367`). `getLatestAcceptedSegment` returns `{ sequence, createdAt }` (no `text`). SPEC-012 §Deliverables 1 and FOUNDATIONS §24/§20 govern.
3. **Shared boundary under audit:** the project-local SQLite storage schema. `reminder_state` is a non-record, single-row table — it is NOT a story record, NOT in the active working set, NOT a generation-time brief field; it holds only an integer threshold and a timestamp.
4. **FOUNDATIONS principle restated:** §20 / §29.2 — durable change is human-gatekept and the app must not infer canon or mutate records. `acknowledgeRemindersThrough` advances an integer threshold only; it mutates no story record, accepted segment, config, or brief. §24 — reminder state lives in the local store as a single non-record row (local-first, user-owned).
5. **Determinism / firewall substrate:** the future reminder read path (SPEC012DURCHAREM-002) is the only consumer of `reminder_state`; it must never reach the compiler. `buildSnapshotFromOpenProject` (`packages/server/src/snapshot-builder.ts:31`) reads only `getGenerationSession`, story config, and selected records (`snapshot-builder.ts:38-46`) — adding `reminder_state` introduces no compiler-input path, and this ticket adds no read of it inside the snapshot/compile path. §8 / §10 / §29.4 enforcement remains intact.

## Architecture Check

1. Mirroring the proven `generation_session` single-row pattern (idempotent `CREATE TABLE IF NOT EXISTS`, `id=1` check) keeps the derived `active` computation trivial (`latest > acknowledged`) and avoids a key/value indirection table. No `user_version` bump is needed — existing stores gain the table on next open, exactly as SPEC-010 added the accept write over the pre-existing `accepted_segments` table.
2. No backwards-compatibility shim: there is no prior reminder storage to alias. `getLatestAcceptedSegment` is a new read over an existing table, not a wrapper around an old surface.

## Verification Layers

1. Table created idempotently at `user_version = 1` -> codebase grep-proof (`CREATE TABLE IF NOT EXISTS reminder_state` in `record-tables.ts`) + test: a fresh store reads acknowledged `0` and `latest: null` without a migration prompt.
2. Read surface carries no prose -> manual review + test asserts `getLatestAcceptedSegment` returns only `{ sequence, createdAt }` (no `text`/`metadata`).
3. Acknowledge mutates exactly one row -> test asserts `acknowledgeRemindersThrough` writes only `reminder_state` and leaves `records`, `accepted_segments`, `story_config`, and the generation-session row unchanged.
4. Reminder state is firewalled from compilation -> codebase grep-proof: `reminder_state` does not appear in `packages/server/src/snapshot-builder.ts`.

## What to Change

### 1. Add the `reminder_state` table

In `packages/server/src/record-tables.ts`, inside `ensureRecordTables`, add (idempotent, no `user_version` bump):

```sql
CREATE TABLE IF NOT EXISTS reminder_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  acknowledged_through_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

### 2. Add repository methods

In `packages/server/src/record-repository.ts`:

- `getLatestAcceptedSegment(): { sequence: number; createdAt: string } | null` — `SELECT sequence, created_at FROM accepted_segments ORDER BY sequence DESC LIMIT 1` (gap-tolerant; MAX sequence). Returns `null` when empty. Returns no prose text.
- `getReminderAcknowledgedSequence(): number` — reads the single `reminder_state` row; returns `0` when the row is absent.
- `acknowledgeRemindersThrough(sequence: number): void` — upserts the single row to `acknowledged_through_sequence = sequence`, `updated_at = nowIso()` (reuse the existing `nowIso()` helper used at `record-repository.ts:346`). Mutates no other table.

## Files to Touch

- `packages/server/src/record-tables.ts` (modify)
- `packages/server/src/record-repository.ts` (modify)
- `packages/server/src/record-layer.test.ts` (modify)

## Out of Scope

- Reminder HTTP routes / endpoint contract — SPEC012DURCHAREM-002.
- Any web client, banner, or quick-link — SPEC012DURCHAREM-003/004/005.
- `user_version` bump or migration logic — explicitly excluded (additive idempotent table).
- Any mutation of story records, accepted segments, config, brief, or cast dossier.

## Acceptance Criteria

### Tests That Must Pass

1. A fresh store: `getReminderAcknowledgedSequence()` returns `0` and `getLatestAcceptedSegment()` returns `null`.
2. After appending segments (including a sequence gap from a prior deletion), `getLatestAcceptedSegment()` reflects MAX(`sequence`) with the matching `createdAt`, and returns no `text` field.
3. `acknowledgeRemindersThrough(n)` upserts exactly the one `reminder_state` row (`acknowledged_through_sequence = n`) and leaves `records`, `accepted_segments`, `story_config`, and the generation-session row byte-unchanged.
4. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. `reminder_state` holds only an integer threshold and a timestamp — no prose, prompt, secret, or record reference.
2. `reminder_state` is never read by `buildSnapshotFromOpenProject` / the compiler path.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-layer.test.ts` — add a `reminder_state` describe block covering the four acceptance tests (fresh-store defaults, MAX-with-gap latest, single-row upsert isolation, no-prose read shape), alongside the existing accepted-segment/generation-session repo coverage.

### Commands

1. `npm test -- record-layer` — targeted run of the repository-layer suite.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline (root `test` builds `@loom/core` first, then runs Vitest).

## Outcome

Completed: 2026-06-06

Implemented the project-local `reminder_state` single-row table in `packages/server/src/record-tables.ts` without a `user_version` bump. Added repository methods in `packages/server/src/record-repository.ts` to read the latest accepted segment without prose, read the acknowledged-through threshold with a default of `0`, and upsert the acknowledgement threshold.

Added repository-layer coverage in `packages/server/src/record-layer.test.ts` for fresh-store defaults, gap-tolerant latest accepted sequence lookup, prose-free latest-segment shape, single-row acknowledgement upsert behavior, and preservation of records, accepted segments, story config, and generation-session rows during acknowledgement writes. No deviations from the ticket plan.

Verification:

- `npm test -- record-layer` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
