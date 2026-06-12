# SPEC022IDENATPRO-004: Grounds provenance — server key→label map + web label resolution

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds a deterministic `citations` key→label map to the `/api/ideate` response and resolves short citation keys to full record labels in the Ideate UI (`SlateCard` and kept ideas); no change to prompt compilation or the server's unknown-citation verification logic.
**Deps**: `archive/tickets/SPEC022IDENATPRO-002.md`

## Problem

Once citation keys are short `[TYPE-n]` (`archive/tickets/SPEC022IDENATPRO-002.md`), they are no longer self-describing, so the Ideate UI can no longer show a human-readable record from the key alone. SPEC-022 §A (UI provenance, §26.1) requires `SlateCard` and kept ideas to resolve returned keys to full record labels using the same deterministic key map the server computes. Validation found the gap: `/api/ideate` (`packages/server/src/ideate-routes.ts:79-83`) returns only `{ ideas (grounds: string[], unknownCitations), metadata }` — it computes `citationKeysFor` internally for verification but exposes no key→label map; `ParsedIdeationIdea`/`IdeationKeeper` carry no labels. This ticket adds the server-side map (the expand-scope-in-place disposition of Issue I1) and consumes it in the web UI. It depends on -002 because the labels only matter once keys are short.

## Assumption Reassessment (2026-06-12)

1. `/api/ideate` returns `{ ok: true, ideas, metadata }` (`ideate-routes.ts:79-83`); it already calls `citationKeysFor(snapshotResult.snapshot.records)` (`:79`) to build `validCitationKeys`. The web `IdeateResponse` (`packages/web/src/api.ts:125-130`) and `ParsedIdeationIdea` (`api.ts:115-123`) mirror this with `grounds: readonly string[]` and no label map. `SlateCard` renders `idea.grounds` raw as chips (`packages/web/src/ideate/SlateCard.tsx:21-25`) with an unknown-citation warning style. Kept ideas (`packages/web/src/ideate/keepers.ts:3-11` `IdeationKeeper`) are persisted to `sessionStorage` (`loom.ideate.keepers.v1`) and rendered in a separate list (`IdeateView.tsx:397`).
2. SPEC-022 §A confirms the UI resolves keys "using the same deterministic key map the server already computes" — i.e. the server should expose, not the web re-derive (re-deriving `citationKeysFor` ordering in web TS would duplicate compiler logic). The key→label map is `citationKeysFor(records)` (id→key) composed with `displayLabel(record)` (id→label) — both already available server-side (`displayLabel` from `@loom/core`).
3. Cross-artifact boundary under audit: the provenance contract spans the server response shape (`IdeateResponse`), the web type (`api.ts`), and two render sites (`SlateCard` for the live slate, the keepers list for persisted ideas). The map must reach both render paths; persisted keepers must retain resolved labels so the kept list resolves without re-fetching.
4. §26.1 provenance (the FOUNDATIONS principle motivating this ticket): assistance output must show what records it derives from. Resolving `[BELIEF-1]` to its record label is strictly more readable provenance than today's raw bracket; the map is derived deterministically from the same `citationKeysFor` the verifier uses (§8) — no new nondeterministic input, no LLM, and it adds nothing to any prose prompt or record (quarantine preserved).
5. Output-schema extension: `IdeateResponse` gains `citations: Record<string,string>` and `IdeationKeeper` gains resolved-label data. Consumers are `IdeateView`, `SlateCard`, the keepers store, and their tests. The `IdeationKeeper` addition is additive — `isKeeper` (`keepers.ts:65-75`) validates `grounds`/`unknownCitations`; an older persisted keeper lacking the new field still parses, and the new field is optional with a key-fallback render, so no sessionStorage migration is required.

## Architecture Check

1. Computing the key→label map server-side from the existing `citationKeysFor` call (rather than re-deriving the deterministic ordering in web TS) keeps `citationKeysFor` the single source of truth for keys and avoids duplicating compiler sort logic in the UI. `SlateCard` becomes a pure function of `(idea, citations)` — it renders `citations[ground] ?? ground`, preserving the unknown-citation fallback for keys absent from the map.
2. No backwards-compatibility aliasing: the server adds one response field; the web types extend additively; persisted keepers degrade gracefully (key-fallback) rather than requiring a versioned migration or a parallel store.

## Verification Layers

1. Server emits the map -> `ideate-routes.test.ts`: a successful `/api/ideate` response includes `citations` mapping each grounded key to its record's `displayLabel`, derived from the same `citationKeysFor` call used for verification.
2. Live slate resolves -> `SlateCard.test.tsx`: a known key renders its full label; an unknown key renders the raw key with the warning style.
3. Persisted keepers resolve -> `keepers.test.ts`: a kept idea retains its resolved labels across `addKeeper`/`listKeepers`; an older keeper without labels still parses.
4. Determinism / quarantine (§26.1, §8) -> manual review + grep-proof: the map derives only from `citationKeysFor` + `displayLabel`; nothing from the map enters a prompt, record, or generation-time field.

## What to Change

### 1. Server: expose the key→label map

In `ideate-routes.ts`, build `citations: Record<string,string>` from the existing `citationKeysFor(snapshotResult.snapshot.records)` map (id→key) joined with `displayLabel(record)` (id→label), and add it to the `{ ok: true, ideas, metadata }` response. The verification logic (`validCitationKeys`, `unknownCitations`) is unchanged.

### 2. Web types + render sites

In `api.ts`: add `citations: Record<string,string>` to the success `IdeateResponse`. In `IdeateView.tsx`: carry `citations` in the `ideas` scratch state (`:32,106`) and pass it to `SlateCard`; on keep, store the resolved ground labels on the keeper. In `SlateCard.tsx`: accept the citations map (or resolved labels) as a prop and render `citations[ground] ?? ground` per chip, keeping the unknown-citation warning style. In `keepers.ts`: extend `IdeationKeeper` with optional resolved-label data and keep `isKeeper` backward-tolerant.

## Files to Touch

- `packages/server/src/ideate-routes.ts` (modify)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/ideate/IdeateView.tsx` (modify)
- `packages/web/src/ideate/SlateCard.tsx` (modify)
- `packages/web/src/ideate/keepers.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (modify)
- `packages/web/src/ideate/SlateCard.test.tsx` (modify)
- `packages/web/src/ideate/IdeateView.test.tsx` (modify)
- `packages/web/src/ideate/keepers.test.ts` (modify)

## Out of Scope

- The citation-key format and inline keyed render sites (`archive/tickets/SPEC022IDENATPRO-002.md` — prerequisite).
- The server's unknown-citation verification logic (unchanged; only the response gains a field).
- Any change to prompt compilation, the ideation request shape, or the quarantine rules (the citations map is display-only and never enters a prompt/record/brief).

## Acceptance Criteria

### Tests That Must Pass

1. `ideate-routes.test.ts`: a successful ideate response includes a `citations` map resolving each grounded `[TYPE-n]` key to its record's display label.
2. `SlateCard.test.tsx`: known keys render full labels; unknown keys render the raw key with the warning style.
3. `keepers.test.ts`: kept ideas retain resolved labels across persistence; older keepers without labels still parse.
4. `npm test`, `npm run lint`, `npm run typecheck` pass.

### Invariants

1. The key→label map is derived only from `citationKeysFor` + `displayLabel` and is display-only — it never enters a prompt, story record, or generation-time field (§26.1 quarantine).
2. `SlateCard` renders a resolved label when present and falls back to the raw key otherwise; the `IdeationKeeper` field is additive (no sessionStorage migration).

## Test Plan

### New/Modified Tests

1. `packages/server/src/ideate-routes.test.ts` — assert the `citations` map shape and key→label correctness (shares this file with `archive/tickets/SPEC022IDENATPRO-002.md`, which lands first; this ticket adds the citations assertions).
2. `packages/web/src/ideate/SlateCard.test.tsx` — label resolution + unknown fallback.
3. `packages/web/src/ideate/keepers.test.ts` — resolved-label persistence + backward-tolerant parse.
4. `packages/web/src/ideate/IdeateView.test.tsx` — citations threaded from response to `SlateCard` and onto kept ideas.

### Commands

1. `npx vitest run packages/server/src/ideate-routes.test.ts`
2. `npx vitest run packages/web/src/ideate/SlateCard.test.tsx packages/web/src/ideate/keepers.test.ts packages/web/src/ideate/IdeateView.test.tsx`
3. `npm test` — full-pipeline gate (server + web), the correct boundary since this ticket spans both packages.
