# RECIDGEN-002: Make the server the sole authority for record `id` — generate on create, preserve on update

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/server`: `packages/server/src/record-repository.ts` (`createRecord`, `updateRecord`, `recordIdFromPayload`).
**Deps**: RECIDGEN-001 (system-managed-`id` concept originates there; this ticket is the server half of the same change).

## Problem

The server already has UUIDv7 infrastructure (`generateRecordId`, `packages/core/src/records/uuidv7.ts`) and `recordIdFromPayload` tries `payloadRecordId(payload) ?? generateRecordId()` (`record-repository.ts:101-102`). But that call runs **after** `parseRecordPayload` (`:149`), which already requires a valid `id: z.uuid()`. So for the 16 id-bearing record types the `?? generateRecordId()` fallback is **unreachable dead code** — it can only fire for the id-less types (ENTITY STATUS / CAST MEMBER). Once the web form stops sending an `id` (RECIDGEN-001/003), creation would otherwise fail validation.

This ticket makes the server the **sole authority** for a record's own `id`: generate a UUIDv7 on create when the client omits it, reuse the existing row id on update, and inject the id into the payload **before** validation so the strict `id: z.uuid()` storage schema is satisfied **without weakening it**. Client-supplied ids (used by import flows and existing tests) remain honored.

## Assumption Reassessment (2026-06-07)

1. `record-repository.ts:143-150`: `createRecord` calls `parseRecordPayload(input.type, input.payload)` (`:149`) **then** `recordIdFromPayload(input.type, payload)` (`:150`). Because the parsed schema requires `id` (`common.ts:7`, `entity.ts:9`, etc.), the `?? generateRecordId()` branch (`:102`) never runs for id-bearing types. Confirmed.
2. `record-repository.ts:199-211`: `updateRecord` parses the payload (requires `id`) and, via `payloadRecordId`, enforces a row-id/payload-id match (`:208-210`). With the form no longer sending `id` (RECIDGEN-003), the payload would lack `id` and fail parse unless the server injects it.
3. Cross-artifact boundary under audit: the **stored payload contract** (`payload_json` in the `records` table, re-validated on read at `:262`) and the **record-create/update API**. Invariant to preserve: the stored payload's `id` always equals the `records.id` row key, and remains a valid `z.uuid()`. `extractReferences` reads reference fields (e.g. `entity_id`), **not** the own `id` (`entity.ts:66-70`), so reference integrity is independent of how the own id is produced.
4. FOUNDATIONS under audit: §11 / §29.5 validation hard-fails govern **continuity** contradictions and missing **generation-time** fields — the record primary key is operational metadata, not a continuity gate. Keeping the storage schema strict (`id` required, server-injected) means **no** validation weakening. §4.4 / §29.4: `generateRecordId` runs once at create time, not at prompt-compile time; compilation reads stored ids, so prompt output stays deterministic for identical stored state.
5. Enforcement-surface check: this touches a storage-validation surface but does **not** weaken the secret firewall (§15) or deterministic compilation (§8). The own `id` is never prompt-facing; the change only relocates *when* the id is assigned (server, before parse) rather than *whether* it is validated.
6. Schema-extension classification: no schema field is added or made optional. The storage schemas keep `id: z.uuid()` required; the server guarantees its presence before validation. Additive behavior only.
8. Adjacent: client-supplied id honoring must be retained so `packages/server/src/record-routes.test.ts` fixtures (which pass explicit `id` inside payload, `:37-58`) keep passing — classified as a **required constraint** of this ticket, not separate cleanup.

## Architecture Check

1. Injecting the id into the raw payload **before** `parseRecordPayload` keeps the storage schema strict (`id` required) — the strongest possible stored-data invariant — while letting the client omit it. This is cleaner than making `id` optional in 16 schemas (weaker invariant, high churn) and centralizes id authority on the server, matching the existing `generateRecordId` infra. The previously-dead `?? generateRecordId()` fallback becomes the live, intended create path.
2. No backwards-compatibility shims: client-supplied ids are still honored through the existing `payloadRecordId(...) ?? generateRecordId()` precedence, so no alias path is introduced; the only change is *ordering* (inject-then-parse).

## Verification Layers

1. Create with no `id` in payload yields a stored record whose `payload.id === record.id` and is a valid UUIDv7 -> schema validation + server integration test (`record-routes.test.ts` / `record-layer.test.ts`).
2. Create with a client-supplied valid `id` honors that id (import/fixture path) -> server integration test asserting the returned `record.id` equals the supplied id.
3. Update from a form payload lacking `id` preserves the row id and stores `payload.id === row id`; a payload carrying a **mismatched** id still throws `RecordIntegrityError` -> server integration test (both branches).
4. FOUNDATIONS §4.4 — compiled prompt output unchanged for identical stored state -> existing `compiler-golden` suite remains green (id non-prompt-facing).

## What to Change

### 1. Generate-and-inject on create

In `createRecord` (`record-repository.ts:143-150`), determine the id from the **raw** input first and inject it before validation, e.g.:
`const id = payloadRecordId(input.payload) ?? generateRecordId();`
`const payload = parseRecordPayload(input.type, injectId(input.payload, id));`
where `injectId` merges `{ id }` into the raw payload object (when it is an object; non-object payloads still fail parse as today). Use the parsed `payload` (now guaranteed to contain `id`) for `canonicalJson(payload)` storage so `payload.id` always equals the row `id`. Drop/retire the now-redundant post-parse `recordIdFromPayload` call for the create path.

### 2. Preserve the row id on update

In `updateRecord` (`:199-211`), inject the existing `input.id` into the raw payload before parse so a form payload that omits `id` still validates and stores `payload.id === input.id`. Keep the mismatch guard: if the **raw** payload carries an `id` that differs from `input.id`, throw `RecordIntegrityError` (preserve current `:208-210` behavior for explicit mismatches).

### 3. Tidy `recordIdFromPayload`

Keep `payloadRecordId` (still used for the honor-client-id precedence and the update mismatch check). Simplify or inline `recordIdFromPayload` so no dead post-parse fallback remains.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify)
- `packages/server/src/record-routes.test.ts` (modify)
- `packages/server/src/record-layer.test.ts` (modify)

## Out of Scope

- Core descriptor / form-schema change (RECIDGEN-001).
- Web form resolver and reference-picker regression (RECIDGEN-003).
- Any change to the universal prompt compiler or validation rules.

## Acceptance Criteria

### Tests That Must Pass

1. Server test: `POST /api/records` with an ENTITY payload that **omits** `id` returns `201`; the stored record's `payload.id` equals `record.id` and matches the UUID format.
2. Server test: `POST /api/records` with a client-supplied valid `id` honors that id; `updateRecord` with a payload omitting `id` preserves the row id, and a mismatched explicit id still throws `RecordIntegrityError`.
3. `npm run typecheck && npm run lint && npm test`

### Invariants

1. For every stored record, `payload.id === records.id` and is a valid `z.uuid()`.
2. Storage schemas remain strict (`id` required); the server, not the client, guarantees the id's presence.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-routes.test.ts` — add create-without-id (server-generated) and create-with-explicit-id (honored) cases.
2. `packages/server/src/record-layer.test.ts` — add update-without-id (row id preserved) and update-with-mismatched-id (throws) cases.

### Commands

1. `npm test -w @loom/server`
2. `npm run typecheck && npm run lint && npm test`

## Outcome

Completed on 2026-06-07.

The server is now the authority for id-bearing record payload ids. `createRecord` chooses a raw client-supplied id when present or generates a UUID otherwise, injects it before payload validation only for schemas with a top-level `id`, and stores canonical payload JSON whose `payload.id` equals the row id. `updateRecord` rejects explicit mismatched ids before parsing, injects the existing row id for id-bearing schemas, and leaves id-less strict schemas such as CAST MEMBER unchanged.

Deviation from original plan: the implementation retained id-less record behavior explicitly by schema-shape checking before injection; this prevents strict id-less payload schemas from receiving an unknown `id`.

Verification: `npm test -w @loom/server`, `npm run typecheck`, `npm run lint`, and `npm test` all passed. Browser smoke on `http://127.0.0.1:5173/records` confirmed id-free ENTITY creation succeeds against the real server and stores the generated UUID in the payload.
