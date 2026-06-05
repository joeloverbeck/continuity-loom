# SPEC003SCHEMAFIX-010: Guard `updateRecord` against PK / payload-`id` divergence

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `@loom/server` `packages/server/src/record-repository.ts` `updateRecord` (id-consistency guard).
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists). New finding — not covered by the round-2 audit (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`), which examined reference-integrity archive/delete but not the update-path PK/payload-`id` invariant.

## Problem

`updateRecord` (`record-repository.ts:184–230`) updates the row whose primary key is `input.id`, but writes `canonicalJson(payload)` where `payload` is `parseRecordPayload(type, input.payload)` — and for every id-bearing record type the payload carries its own required `id` field (`id: recordId` in ENTITY/FACT/BELIEF/SECRET/LOCATION/OBJECT/VISIBLE AFFORDANCE/EVENT/INTENTION/PLAN/CLOCK/OBLIGATION/CONSEQUENCE/OPEN THREAD/RELATIONSHIP/EMOTION). Nothing checks that `payload.id === input.id`.

So a caller passing `input.id = X` with a payload whose `id = Y` (≠ X) persists a row at PK `X` whose stored `payload_json.id` is `Y`. From then on `getRecord(X)` returns `{ id: X (from the row), payload: { id: Y, … } }` — the record's identity column and its payload `id` disagree, and any reference projection that targets `X` no longer matches the payload's self-id. This is a silent record-identity inconsistency.

There is no live exploit today (no Phase-4 CRUD route exposes `updateRecord`, and current tests pass matching ids), but the repository is the identity-authority substrate every later phase trusts, so the invariant should be enforced at the write boundary rather than left to caller discipline. `createRecord` already derives the PK from the payload (`recordIdFromPayload`, `record-repository.ts:77–88`); `updateRecord` should make the corresponding consistency check explicit.

## Assumption Reassessment (2026-06-05)

1. Current code: `record-repository.ts:184–230` `updateRecord` — parses `input.payload` (line 192), uses `input.id` for the `WHERE id = ?` (line 207) and for the returned `RecordRepositoryRecord.id`, and writes `canonicalJson(payload)` (line 209) with no comparison of `payload.id` to `input.id`. `createRecord` derives the PK from `payload.id` when present via `recordIdFromPayload` (lines 77–88, 135), establishing that for id-bearing types the PK and payload `id` are intended to be the same value.
2. Authoritative shape: `docs/story-record-schema.md` gives every durable record type a required `id: id` field; `DATA-MODEL-AND-RECORDS.md` "Identity rules" treats the record id as the stable durable identity. CAST MEMBER (§5, keyed by `entity_id`) and ENTITY STATUS (§4.2, keyed by `entity_id`) carry **no** top-level `id` field — their PK is repository-generated — so the guard must apply only when the parsed payload actually has a string `id`.
3. Schema under audit: the record-identity contract between the `records.id` PK column and the payload's self-`id`. Consumer: every reference projection and every later phase that resolves a `target_id` back to a record. The change is a write-time precondition, additive and non-breaking for already-consistent callers.
4. FOUNDATIONS principle restated: §13 (records & stable current continuity) and §29.10/§24 (inspectable, user-owned store) rely on a record's identity being single-valued; a PK that disagrees with the payload's own `id` is a latent continuity-integrity defect. Restated invariant: for any id-bearing record, `records.id` equals `payload_json.id`.
5. Adjacent-contradiction classification: a **separate, newly-found** robustness gap, not a consequence of `SPEC003SCHEMAFIX-001..009`. It does not touch reference-integrity archive/delete (verified correct in the prior triage) and does not change any payload schema. It is its own ticket, not folded into the salience/urgency fidelity ticket (`SPEC003SCHEMAFIX-009`).

## Architecture Check

1. Enforcing `payload.id === input.id` at the `updateRecord` boundary keeps record identity single-valued and mirrors `createRecord`'s existing PK-from-payload derivation, so the two write paths share one identity rule rather than diverging. A reused `RecordIntegrityError` (already defined, `record-repository.ts:118–123`) makes the failure structured and consistent with the existing integrity-protection surface.
2. No backwards-compatibility shim: the guard rejects the inconsistent input outright; it does not silently rewrite `payload.id` to match (silent coercion would hide caller bugs and is the kind of quiet repair FOUNDATIONS forbids elsewhere).

## Verification Layers

1. `updateRecord` with a payload whose `id` differs from `input.id` (for an id-bearing type) throws and writes nothing -> server integration test asserting the throw and that the row is unchanged.
2. `updateRecord` with a matching `id` succeeds and round-trips -> existing/extended update round-trip test (no regression).
3. `updateRecord` for an id-less type (CAST MEMBER / ENTITY STATUS, keyed by `entity_id`) is unaffected -> server integration test updating a CAST MEMBER succeeds without an `id`-equality check firing.

## What to Change

### 1. Add a PK/payload-`id` consistency guard in `updateRecord`

After parsing the payload (`record-repository.ts:192`), if the parsed payload is an object carrying a string `id` and that `id !== input.id`, throw `RecordIntegrityError` with a message naming both ids (e.g. ``Record update id mismatch: row ${input.id} vs payload ${payload.id}``). Skip the check when the payload has no string `id` (CAST MEMBER, ENTITY STATUS). Reuse the existing `recordIdFromPayload`-style extraction or an inline `typeof` check, consistent with `createRecord`.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify — add the id-consistency guard to `updateRecord`)
- `packages/server/src/record-layer.test.ts` (modify — mismatch-throws test + id-less-type update test)

## Out of Scope

- `createRecord` (already derives the PK from `payload.id`; no divergence path).
- The `salience`/`urgency` column-affinity fidelity fix — separate ticket `SPEC003SCHEMAFIX-009`.
- Any payload schema change (the payload `id` field stays required for id-bearing types, as the schema doc specifies).
- Allowing record-id reassignment / re-keying (out of scope; the guard forbids it rather than supporting it).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — `updateRecord` with `payload.id` ≠ `input.id` (e.g. a FACT) throws `RecordIntegrityError` and leaves the stored row (PK and `payload_json`) unchanged.
2. `npm test --workspace @loom/server` — `updateRecord` with matching ids round-trips; updating a CAST MEMBER (id-less) succeeds.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. For every id-bearing record, `records.id` equals the stored `payload_json.id` after any `updateRecord`.
2. Id-less record types (CAST MEMBER, ENTITY STATUS) are unaffected by the guard.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-layer.test.ts` — id-mismatch update throws + no-write assertion.
2. `packages/server/src/record-layer.test.ts` — matching-id update and id-less-type update both succeed.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
