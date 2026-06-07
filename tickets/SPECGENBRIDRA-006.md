# SPECGENBRIDRA-006: Snapshot builder generation_context last-defense default

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `buildSnapshotFromOpenProject` applies `deriveGenerationContextDefault` from accepted-segment count before validation; modifies `snapshot-builder.ts`; new test file
**Deps**: SPECGENBRIDRA-001

## Problem

The `focus-tag-count-invalid` false blocker exists because the server validation snapshot is built from persisted state with no server-side `generation_context` default, while the web editor's local `first_segment` default never reaches validation. `buildSnapshotFromOpenProject` (`packages/server/src/snapshot-builder.ts:31`) reads `getGenerationSession` and passes the session straight to `buildValidationSnapshot` (`:42–53`); `universal-completeness.ts:273–282` then sees a missing `generation_context` and raises `focus-tag-count-invalid`. This ticket adds the deterministic last-defense default at the snapshot builder, using the repository's accepted-segment count as the source of truth.

## Assumption Reassessment (2026-06-07)

1. `buildSnapshotFromOpenProject` reads the session via `repository.getGenerationSession()` and passes `generationSession` to `buildValidationSnapshot` with no defaulting (`snapshot-builder.ts:38–53`). The repository exposes accepted-segment access — `listAcceptedSegments()` (`record-repository.ts:423`) and `getLatestAcceptedSegment()` (`:437`). Confirmed this session.
2. The false-blocker mechanism is confirmed at `packages/core/src/validation/rules/universal-completeness.ts:273` (reads `…generation_validation_focus?.validation_focus_tags.generation_context`) → `:281` emits `DIAGNOSTIC_CODES.focusTagCountInvalid`. The spec (§Deterministic defaults → `generation_context`) names `buildSnapshotFromOpenProject` as a location that must apply `deriveGenerationContextDefault`.
3. Shared boundary under audit: the `ValidationSnapshot.generationSession` consumed by the validation rules. This ticket injects a deterministic context default into that snapshot; it imports `deriveGenerationContextDefault` from `@loom/core` (SPECGENBRIDRA-001), the same rule used by GET (SPECGENBRIDRA-005) — single source, server-visible.
4. FOUNDATIONS restated: §4.4/§8 — the default must be deterministic and server-visible, derived from the repository's accepted-segment count (source of truth), never from browser state. §11 — applying the default removes a false blocker without weakening any real blocker: when `generation_validation_focus` carries a malformed multiple-context value, validation still flags it (handled by the Validation spec).
5. Validation-feeding surface named: the snapshot is the input to deterministic validation. Confirm the default is applied as a normalization step (not an LLM/heuristic), preserving an explicit valid context if the session already has one — so identical persisted state + accepted-segment count always yields the same snapshot (§8). No secret path is touched (§15 N/A here).
6. Mismatch + correction: the spec originally named this site `buildServerValidationSnapshot`; the in-session `/reassess-spec` run corrected it to the real symbol `buildSnapshotFromOpenProject`. This ticket targets the corrected symbol.

## Architecture Check

1. Defaulting at the snapshot builder (with repository-sourced accepted-segment count) puts the deterministic, server-visible default exactly where validation reads it, eliminating the UI/server split that produced the false blocker — cleaner than teaching every validation rule to default independently.
2. No backwards-compatibility aliasing/shims: reuses the shared `deriveGenerationContextDefault` rather than duplicating the threshold logic in the server.

## Verification Layers

1. Default-applied invariant (snapshot's `generation_context` is `first_segment` when accepted-segment count is `0`, `continuation_after_accepted_segment` otherwise, when the persisted session lacks a context) -> server test in `snapshot-builder.test.ts`.
2. Source-of-truth invariant (the count comes from the repository's accepted-segment API, not browser state) -> server test seeding accepted segments and asserting the snapshot context.
3. Preserve-explicit invariant (a valid persisted `generation_context` is not overwritten) -> server test.
4. No-false-blocker invariant (a snapshot with a defaulted context does not raise `focus-tag-count-invalid`) -> server test asserting the diagnostic is absent.

## What to Change

### 1. `packages/server/src/snapshot-builder.ts`

- Import `deriveGenerationContextDefault` from `@loom/core`.
- In `buildSnapshotFromOpenProject`, before constructing the `buildValidationSnapshot` input, compute the accepted-segment count via the repository (`listAcceptedSegments().length`) and, when the resolved `generationSession.generation_validation_focus?.validation_focus_tags.generation_context` is absent/empty, inject the deterministic default; preserve an existing valid context unchanged. Do not include accepted-segment *text* in the snapshot — only the count is used.

## Files to Touch

- `packages/server/src/snapshot-builder.ts` (modify)
- `packages/server/src/snapshot-builder.test.ts` (new)

## Out of Scope

- The validator's blocker taxonomy and the `focus-tag-count-invalid` retention rule for malformed multiple-context values (`SPEC-validation-gating-taxonomy-and-focus-matrix.md`).
- GET-route display defaults (SPECGENBRIDRA-005) and repository draft parse (SPECGENBRIDRA-004).
- Any inclusion of accepted-prose text in the snapshot.

## Acceptance Criteria

### Tests That Must Pass

1. With no persisted `generation_context` and zero accepted segments, the built snapshot carries `generation_context: ["first_segment"]`.
2. With ≥1 accepted segment, the built snapshot carries `continuation_after_accepted_segment`.
3. A persisted valid `generation_context` is preserved unchanged.
4. A snapshot built with a defaulted context does not raise `focus-tag-count-invalid`.
5. `npm test` passes.

### Invariants

1. The default is deterministic and sourced from the repository's accepted-segment count, never browser state (§4.4/§8).
2. No accepted-prose text enters the snapshot — only the segment count is read (§10).

## Test Plan

### New/Modified Tests

1. `packages/server/src/snapshot-builder.test.ts` (new) — default application across accepted-segment counts, explicit-context preservation, and absence of the false blocker.

### Commands

1. `npx vitest run packages/server/src/snapshot-builder.test.ts` — targeted snapshot-default tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate.
