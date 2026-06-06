# SPEC010CANEDIACC-002: Accept route + archive write + log redaction

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/accepted-routes.ts` (`POST /api/accepted-segments`), registered in `createServer()`; `server.ts` redaction config
**Deps**: SPEC010CANEDIACC-001

## Problem

`appendAcceptedSegment()` exists (`packages/server/src/record-repository.ts:341`) and the
`accepted_segments` table exists (`packages/server/src/record-tables.ts:45`), but there is **no
route** that turns an approved candidate into a durable accepted segment — `appendAcceptedSegment`
has no caller. SPEC-010 Deliverables 2 + 3: add a fail-safe single-segment accept write that
mutates no records, stores no full prompt and no "edited" flag, and never lets accepted prose
reach logs. This is the durable target the candidate lifecycle (SPEC010CANEDIACC-006) accepts into.

## Assumption Reassessment (2026-06-06)

1. `appendAcceptedSegment(input: { text: string; metadata?: unknown }): AcceptedSegment` (`record-repository.ts:341-355`) inserts one row (`sequence = MAX+1`, `created_at = nowIso()`, `metadata_json = canonicalJson(metadata)`) and returns `{ id, sequence, text, metadata, createdAt }` (`AcceptedSegment`, `record-repository.ts:41-47`). It writes only `accepted_segments` and bumps no `user_version`.
2. The open project's repository is resolved via `manager.getRecordRepository(): RecordRepository | null` (`packages/server/src/project-store.ts:103,357`); the established no-open-project response is `reply.code(409).send({ ok:false, kind:"no-open-project", message:"No project is open." })` — the same inline pattern used at `snapshot-builder.ts:24`, `record-routes.ts:39`, `working-set-routes.ts:13`, `generation-brief-routes.ts:7`. There is no shared helper to import; mirror the inline shape.
3. Shared boundary under audit: the `generationMetadata` body field must match the parameter snapshot emitted by `/api/generate` (SPEC010CANEDIACC-001) — `{ model, provider:"openrouter", temperature, maxOutputTokens, topP?, versions:{ template, compiler, contract } }`. The accept route is the persistence half of that contract.
4. FOUNDATIONS principles motivating this ticket: §21 (accepted-segment archive; "the accepted text is the accepted text" — **no edited flag**; discarded/regenerated not stored); §20/§29.2 (accept mutates no records, infers no canon); §10/§29.4 (accepted prose never re-enters compilation — this route runs no `compilePrompt`/`runValidation`); §23/§29.9 (no key/prompt in logs).
5. Fail-closed / secret-firewall surface (§15/§23/§29.9): the route runs **no** validation/compilation (accepted text is human-approved prose, not a fresh prompt), so it adds no generation path that could leak. Metadata is validated with `z.strictObject` over the known snapshot fields — matching the `openRouterSettingsSchema` style at `packages/server/src/settings.ts:33` — which **inherently rejects** unknown keys including key-shaped (`apiKey`/`api_key`) and prompt-text (`prompt`/`fullPrompt`) fields; no separate key-detector is needed, and `settings.ts`'s `assertNoKeyFields` is module-private (not importable). Redaction: `server.ts:35-49` `redact.paths` already cover `acceptedProse`/`candidateProse`/`prompt`/`body`; the route logs accepted prose (if at all) only under the specific existing `acceptedProse` key — **never** under a bare `text` path (which would over-redact app-wide). Per SPEC-010 reassessment finding M2.
6. Schema extension: `accepted_segments.metadata_json` stores arbitrary JSON via `canonicalJson`; `AcceptedSegment.metadata` is typed `unknown` — persisting the snapshot is additive, no migration, no `user_version` bump (SPEC-010 §Out of Scope). The response returns the subset `{ id, sequence, createdAt }`.

## Architecture Check

1. A `z.strictObject` over the exact snapshot fields gives validation + secret/prompt rejection in one mechanism (unknown keys throw), rather than a permissive object plus a bespoke key scrubber — fewer moving parts, no firewall gap.
2. Registering `registerAcceptedRoutes(app, projectStoreManager)` alongside the existing `register*Routes` in `createServer()` (`server.ts:70-78`) follows the established route-module pattern; no new server bootstrap concept.
3. No backwards-compatibility shims: a single new route module and one `createServer` registration line; no alias endpoint.

## Verification Layers

1. One-write accept → server e2e (`fastify.inject` POST `/api/accepted-segments` inserts exactly one `accepted_segments` row; a second accept appends the next `sequence`; **no record table written**) in `accepted-routes.test.ts`.
2. Edited text is authoritative + no edited flag → assert persisted `text` equals the posted (possibly edited) text verbatim and `metadata_json` contains no `edited` flag and no full prompt → schema/grep assertion on the stored row.
3. Strict metadata rejection → posting metadata with an extra `prompt`/`apiKey` field returns a validation error and writes nothing → server e2e.
4. No-open-project + empty-text fail closed → 409 `no-open-project` with no repo; empty/missing `text` → validation error and no insert → server e2e.
5. No accepted prose in logs → logger-on test asserts a seeded accepted-prose string is absent from captured stdout/stderr → manual-capture log assertion.

## What to Change

### 1. New accept route module

Create `packages/server/src/accepted-routes.ts` exporting
`registerAcceptedRoutes(app: FastifyInstance, manager: ProjectStoreManager): void`:

- `app.post("/api/accepted-segments", ...)`.
- Zod body schema: `z.strictObject({ text: z.string().min(1), generationMetadata: z.strictObject({ model: z.string(), provider: z.literal("openrouter"), temperature: z.number(), maxOutputTokens: z.number().int(), topP: z.number().optional(), versions: z.strictObject({ template: z.string(), compiler: z.string(), contract: z.string() }) }) })`. Reject on parse failure with a structured `{ ok:false, kind:"invalid-body", ... }` (422).
- `const repository = manager.getRecordRepository();` → if `null`, `reply.code(409).send({ ok:false, kind:"no-open-project", message:"No project is open." })`.
- `const segment = repository.appendAcceptedSegment({ text, metadata: generationMetadata });`
- Return `{ ok:true, segment: { id: segment.id, sequence: segment.sequence, createdAt: segment.createdAt } }`.
- Run **no** `runValidation`/`compilePrompt`; mutate **no** record/store beyond the single insert.

### 2. Register the route + confirm redaction

In `packages/server/src/server.ts`, import and call `registerAcceptedRoutes(app, projectStoreManager)` alongside the existing registrations (after `registerGenerateRoutes`, `server.ts:78`). Confirm `redact.paths` covers accepted prose: it already lists `acceptedProse` (`server.ts:47`); ensure the route logs any prose value under that specific key and **do not** add a bare `text` path.

### 3. Tests

Create `packages/server/src/accepted-routes.test.ts` covering all Verification Layers, including the logger-on no-prose-in-logs assertion (instantiate via `createServer({ logger: true })` and capture output).

## Files to Touch

- `packages/server/src/accepted-routes.ts` (new)
- `packages/server/src/accepted-routes.test.ts` (new)
- `packages/server/src/server.ts` (modify)

## Out of Scope

- The accepted-segment **browser**/read view/deletion/export — Phase 11; `listAcceptedSegments()` gains no route here.
- Re-running validation or compilation on accept (forbidden — accepted prose is not a fresh prompt).
- Storing a full prompt, an "edited" flag, or any rejected/superseded candidate (FOUNDATIONS §21/§29.8).
- The web client (`acceptCandidate`) and UI — SPEC010CANEDIACC-003 / -006.
- Any schema change / new table / `user_version` bump — the table and append method already exist.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- accepted-routes` — a valid accept inserts exactly one `accepted_segments` row with the full snapshot in `metadata_json`; a second accept appends the next `sequence`; no record table is written in any branch.
2. `npm test -- accepted-routes` — edited `text` persists verbatim; stored metadata has no `edited` flag and no full prompt; metadata with an unknown/`prompt`/key field is rejected with no insert; empty/missing `text` → validation error, no insert; no-open-project → 409; logger-on run shows no seeded accepted-prose string in captured output.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Acceptance mutates only `accepted_segments` (one row per accept) and never any record/current-state/working-set/brief/cast table (§20/§29.2).
2. No accepted prose, full prompt, or API key ever reaches the response, the stored metadata, or logs (§21/§23/§29.9).

## Test Plan

### New/Modified Tests

1. `packages/server/src/accepted-routes.test.ts` — full accept-route behavior, strict-metadata rejection, fail-closed branches, and the no-prose-in-logs assertion.

### Commands

1. `npm test -- accepted-routes`
2. `npm run typecheck && npm run lint && npm test && npm run build`
