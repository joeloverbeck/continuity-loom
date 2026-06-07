# SPECGENBRIDRA-005: GET/PUT generation-brief route contracts

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — rewrites `GET`/`PUT /api/generation-brief` (deterministic display defaults, field-aware merge, draft-schema parse, `malformed-draft` response); modifies `generation-brief-routes.ts` + its test
**Deps**: SPECGENBRIDRA-001, SPECGENBRIDRA-004

## Problem

`PUT /api/generation-brief` (`packages/server/src/generation-brief-routes.ts:33`) shallow-merges the body into the persisted session and parses with the strict schema, returning the generic `"Generation brief request is invalid."` on any blank nested field — saving a draft behaves like asking permission to generate. `GET` (`:15`) returns the persisted session or `{ ok: true, session: {} }` with no deterministic defaults. This ticket makes save a draft write (permissive, field-aware merge, normalized, `400` only for genuinely malformed shapes) and makes GET return deterministic display defaults including the accepted-segment-count-derived `generation_context`.

## Assumption Reassessment (2026-06-07)

1. Current route behavior is as the spec describes: GET not-found returns `{ ok: true, session: {} }` (`:24`/`:30`); PUT builds `const merged = { ...session, ...body }` (`:47`), calls `repository.setGenerationSession(merged)` (`:49`), and on `ZodError` returns `{ ok:false, kind:"invalid-request", message:"Generation brief request is invalid.", issues }` (`:52–60`). Confirmed this session.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §API contract, §Field-aware merge semantics) prescribes the GET `defaults` block, the PUT draft-parse + field-aware merge + normalize, and the `malformed-draft` failure shape. `ReadinessSummary`/`readinessSummary` is annotated out of scope (owned by `SPEC-readiness-diagnostics-and-three-page-ux.md`) — the success response here is `{ ok: true, session: GenerationSessionDraft }`.
3. Shared boundary under audit: the `/api/generation-brief` request/response contract, consumed by `packages/web/src/api.ts` (`getGenerationBrief`/`setGenerationBrief`, `:327`/`:331`, type `GenerationBriefResponse` at `:182`). Web consumption (response-shape + `defaults`) is SPECGENBRIDRA-008. Repository draft-parse is SPECGENBRIDRA-004 (declared Dep). Accepted-segment count source: `repository.listAcceptedSegments().length` (`record-repository.ts:423`).
4. FOUNDATIONS restated: §11 — save success must never depend on a blocker-free readiness summary; the route runs **no** generation-readiness validation; `400` is returned only for malformed shape (unknown keys, invalid enum/ID, impossible structure), which the UI treats as an input-shape bug, not readiness feedback. §22/§23 — the save path must not log prompt text, API keys, candidate text, accepted prose, or full record payloads; error responses surface JSON paths + human messages only, never raw secret-bearing payloads.
5. Secret-firewall surface named: the route handles request bodies and error reporting. Confirm no `console`/logger call emits the body, the merged session, or stored record payloads; the `malformed-draft` `issues[]` carry `{ path, message, expected? }` derived from Zod issues (paths + messages), not echoed field values that could contain secrets (§15/§23). This does not weaken deterministic compilation (no compiler path touched).
6. Schema/response classification: the GET response gains an additive `defaults` block; the PUT failure shape changes `kind` from `invalid-request` to `malformed-draft` with structured `issues`. These are **breaking** response-shape changes for the web consumer — SPECGENBRIDRA-008 updates `api.ts`/`GenerationBriefView` accordingly (declared via 008→005 Dep).
7. Mismatch + correction: none beyond the spec — the in-session `/reassess-spec` run already aligned the route contract (deferred `readinessSummary`, named the merge semantics); this ticket implements the corrected contract.

## Architecture Check

1. Field-aware per-surface merge (omitted surface unchanged; present object deep-merged then normalized; present array replaced) plus draft-schema parse is cleaner than the shallow `{...session, ...body}` merge, which can blow away a whole nested surface when a form edits one field. Returning the stored normalized draft makes the client's view authoritative.
2. No backwards-compatibility aliasing/shims: the `invalid-request` kind is replaced by `malformed-draft`, not kept as an alias; one canonical storage form (compact normalized draft via `normalizeGenerationSessionDraft`) is enforced.

## Verification Layers

1. Draft-save invariant (PUT of a partial/blank draft returns `{ ok: true, session }`, runs no readiness blockers) -> server route test.
2. Field-aware merge invariant (editing one nested field preserves the rest of its surface; arrays replace; omitted surfaces unchanged) -> server route test with sequential PUTs.
3. Malformed-shape invariant (unknown key / invalid enum / invalid ID → `400` with `kind: "malformed-draft"` and `issues[].path`) -> server route test.
4. GET-default invariant (`defaults.generation_context` = `first_segment` at zero accepted segments, `continuation_after_accepted_segment` otherwise, with `source` + `acceptedSegmentCount`) -> server route test seeding accepted segments.
5. Secret-discipline invariant (no log line emits body/session/record payloads/keys; `issues` carry paths+messages only) -> manual review (secret-firewall audit) + grep-proof of logging calls in the route.

## What to Change

### 1. `GET /api/generation-brief` (`generation-brief-routes.ts`)

- Return `{ ok: true, session, defaults }` where `session` is the persisted draft (or `{}`), and `defaults.generation_context = { value, source: "persisted" | "accepted-segment-count", acceptedSegmentCount }` computed via `deriveGenerationContextDefault(repository.listAcceptedSegments().length)` unless the persisted session already selected a context. Do not fabricate a manual directive; do not treat blank stop guidance as invalid.

### 2. `PUT /api/generation-brief` (`generation-brief-routes.ts`)

- Parse the body with `generationSessionDraftSchema`. Apply field-aware merge against the existing stored draft: omitted top-level surface → unchanged; explicit `null` → reject as `malformed-draft` (clearing unsupported); present object surface → merge known nested fields then normalize; present array surface → replace. Run `normalizeGenerationSessionDraft` (persist deterministic `generation_context` when never selected), call `repository.setGenerationSession`, and return `{ ok: true, session }`. Return `400 { ok:false, kind:"malformed-draft", message:"…", issues:[{path,message,expected?}] }` only for malformed shape. Run no generation-readiness validation. Emit no log lines containing body/session/record payloads or secrets.

## Files to Touch

- `packages/server/src/generation-brief-routes.ts` (modify)
- `packages/server/src/generation-brief-routes.test.ts` (modify)

## Out of Scope

- Web consumption of the new response shapes (SPECGENBRIDRA-008).
- Repository draft-schema parse (SPECGENBRIDRA-004 — depended upon).
- Snapshot-builder defaulting (SPECGENBRIDRA-006) and one-time backfill (SPECGENBRIDRA-007).
- `readinessSummary` emission (Readiness/UX spec).

## Acceptance Criteria

### Tests That Must Pass

1. `PUT` of a partial blank draft returns `ok: true`; the response `session` is the stored normalized draft; no readiness blocker is evaluated.
2. `PUT` persists an explicit user override of `generation_context`; a subsequent `PUT` editing one nested field leaves other fields of that surface intact.
3. Malformed input (unknown key / invalid enum / invalid ID / explicit null surface) returns `400` with `kind: "malformed-draft"` and `issues[].path`.
4. `GET` returns `first_segment` when accepted-segment count is `0` and `continuation_after_accepted_segment` when nonzero, with `source` and `acceptedSegmentCount` populated.
5. The save path logs nothing containing prompt text, API keys, candidate text, accepted prose, or full record payloads.
6. `npm test` passes.

### Invariants

1. Save success is independent of generation readiness — `canSaveDraft` holds except for malformed shape or no open project (§11).
2. No secret-bearing payload is logged or echoed in error responses (§22/§23).

## Test Plan

### New/Modified Tests

1. `packages/server/src/generation-brief-routes.test.ts` (modify) — draft-save success, field-aware merge, `malformed-draft` cases, GET defaults across accepted-segment counts, and a secret-discipline assertion (no payload in logs/issues).

### Commands

1. `npx vitest run packages/server/src/generation-brief-routes.test.ts` — targeted route-contract tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate.

## Outcome

Completion date: 2026-06-07

Updated `GET /api/generation-brief` to return persisted draft state plus deterministic `defaults.generation_context`, and updated `PUT /api/generation-brief` to parse draft payloads, field-aware merge object surfaces, normalize compact draft storage, persist missing `generation_context`, and return `malformed-draft` issue responses without echoing submitted values.

Deviations from original plan: `packages/server/src/snapshot-builder.ts` needed a minimal compatibility default for `current_cast_voice_pressure` and `cast_voice_overrides` because existing compile/generate validation code dereferences those arrays while route normalization now stores compact draft sessions.

Verification results:

- `npm exec vitest run packages/server/src/generation-brief-routes.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
- `git diff --check` passed.
