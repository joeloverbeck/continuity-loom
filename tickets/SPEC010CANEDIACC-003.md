# SPEC010CANEDIACC-003: Web API clients — widen GenerateResponse + acceptCandidate

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `packages/web/src/api.ts` client surface (`GenerateResponse` metadata widened; new `acceptCandidate()` + `AcceptResponse`)
**Deps**: SPEC010CANEDIACC-001, SPEC010CANEDIACC-002

## Problem

The web layer can call `generate()` but has no typed client for the new accept endpoint, and its
`GenerateResponse` metadata type (`packages/web/src/api.ts:84`) still reflects the old
`{ model, versions }` shape. The candidate lifecycle UI (SPEC010CANEDIACC-006) needs (a) the
widened metadata snapshot threaded through `generate()` so it can pass it to accept, and (b) an
`acceptCandidate()` client over `POST /api/accepted-segments`. This ticket supplies the typed
client contract.

## Assumption Reassessment (2026-06-06)

1. `packages/web/src/api.ts:83-84` defines `GenerateResponse` with `metadata: { model: string; versions: CompileResult["metadata"]["versions"] }`; `CompileResult` is imported from `@loom/core`. Client requests use the existing `requestJson<T>(url, method, body?)` helper (`api.ts:154,176`) and `fetchJson` (`api.ts:140`); failures use `ApiFailure` (`api.ts:40`).
2. The server contracts this mirrors: `/api/generate` success metadata (SPEC010CANEDIACC-001) and `POST /api/accepted-segments` returning `{ ok:true, segment:{ id, sequence, createdAt } }` or a structured failure incl. `no-open-project` (SPEC010CANEDIACC-002).
3. Shared boundary under audit: the web `GenerateResponse.metadata` type and a new `GenerationMetadata` type must be the **single source** the UI passes verbatim from generate → accept, so the persisted segment reflects what actually generated the text (SPEC-010 §Risks "trusting client-supplied generation metadata").
4. FOUNDATIONS §23/§29.9: the client payloads are key-free — `generate()` already carries no key, and `acceptCandidate` sends only `{ text, generationMetadata }`; no key field is ever constructed client-side.
5. Schema extension: `GenerateResponse.metadata` is widened additively to `{ model, provider, temperature, maxOutputTokens, topP?, versions }`. The only existing construction site of this type is the test mock `candidateMetadata()` in `PromptPreviewView.test.tsx:225` — that test currently lives on `/preview` and is **relocated** in SPEC010CANEDIACC-005, where its mock is updated to the widened shape. No production construction site exists in web code (the server produces it; the web only reads it), so widening the type breaks no runtime web code, only the test mock handled in -005.

## Architecture Check

1. A dedicated exported `GenerationMetadata` type (reused by both `GenerateResponse.metadata` and `acceptCandidate`'s argument) makes the generate→accept hand-off type-safe end to end — the UI cannot accept a segment with metadata that does not match what generate returned.
2. `acceptCandidate` follows the existing `requestJson`-based client pattern and the `{ ok:true } | ApiFailure` discriminated-union convention used across `api.ts` (e.g. `OkResponse`, `RecordsListResponse`) — no new client abstraction.
3. No backwards-compatibility aliasing: the old narrow metadata type is replaced, not kept beside the new one.

## Verification Layers

1. `acceptCandidate` success → web client test (`api.test.ts`) mocks `fetch` returning `{ ok:true, segment }` and asserts the parsed union.
2. `acceptCandidate` failure incl. `no-open-project` → web client test asserts the `ApiFailure` branch is returned, not thrown.
3. Type coherence generate↔accept → typecheck-proof: a value of `GenerateResponse["metadata"]` (minus none) is assignable to `acceptCandidate`'s `generationMetadata` argument (`npm run typecheck`).

## What to Change

### 1. Widen GenerateResponse metadata + export GenerationMetadata

In `packages/web/src/api.ts`, add:

```ts
export interface GenerationMetadata {
  model: string;
  provider: "openrouter";
  temperature: number;
  maxOutputTokens: number;
  topP?: number;
  versions: CompileResult["metadata"]["versions"];
}
```

and change `GenerateResponse`'s success branch metadata type to `GenerationMetadata`.

### 2. Add acceptCandidate client + AcceptResponse

```ts
export interface AcceptedSegmentRef { id: number; sequence: number; createdAt: string; }
export type AcceptResponse = { ok: true; segment: AcceptedSegmentRef } | ApiFailure;

export async function acceptCandidate(input: { text: string; generationMetadata: GenerationMetadata }): Promise<AcceptResponse> {
  return requestJson<AcceptResponse>("/api/accepted-segments", "POST", input);
}
```

(Confirm `ApiFailure` already models `no-open-project`; if `kind` is open-string it does — assert in the test.)

### 3. New client tests

Create `packages/web/src/api.test.ts` mocking `fetch` for `acceptCandidate` success and failure (incl. `no-open-project`) and for `generate()` returning the widened metadata.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api.test.ts` (new)

## Out of Scope

- The `/generate` route, nav promotion, and shared inspector — SPEC010CANEDIACC-005.
- The candidate lifecycle UI consuming these clients — SPEC010CANEDIACC-006.
- Updating the relocated `candidateMetadata()` test mock — owned by SPEC010CANEDIACC-005 (where the test moves to `/generate`).
- Any server change — contracts are delivered by -001 and -002.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- api` (web) — `acceptCandidate` returns the `{ ok:true, segment }` union on success and the `ApiFailure` branch (incl. `no-open-project`) on failure, never throwing on a structured error.
2. `npm run typecheck` — `GenerateResponse["metadata"]` is assignable to `acceptCandidate`'s `generationMetadata` parameter (single shared `GenerationMetadata`).
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The metadata the UI accepts is the exact metadata `generate()` returned (one shared `GenerationMetadata` type, no re-derivation).
2. No client payload constructs or carries an API key (§23/§29.9).

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.ts` — `acceptCandidate` success/failure and `generate()` widened-metadata parsing, with `fetch` mocked.

### Commands

1. `npm test -- api`
2. `npm run typecheck && npm run lint && npm test && npm run build`
