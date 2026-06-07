# SPECGENBRIDRA-002: Core ready-candidate normalizer & ready schema

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` exports `normalizeGenerationSessionForReadiness`, `generationSessionReadySchema` (+ `GenerationSessionReadyCandidate`, `GenerationSessionReady` types); new `packages/core/src/records/generation-brief-readiness.ts`; new test file
**Deps**: SPECGENBRIDRA-001

## Problem

Validation must not parse persisted draft state with the same schema used for persistence. Per the spec's three-layer model, the draft layer (SPECGENBRIDRA-001) must first be normalized into a **ready candidate** — trimmed, blank-as-absent, deterministic-context-applied — which the generation-readiness validator (a later phase) consumes. This ticket builds that read/verify path: `normalizeGenerationSessionForReadiness` and the internal `GenerationSessionReady` view. It produces deliverables consumed by `SPEC-validation-gating-taxonomy-and-focus-matrix.md` (Phase 4); there is no in-spec consumer yet, so this ticket is unit-tested in isolation.

## Assumption Reassessment (2026-06-07)

1. SPECGENBRIDRA-001 provides `generationSessionDraftSchema`, `GenerationSessionDraft`, and `deriveGenerationContextDefault` from `packages/core/src/records/generation-brief-draft.ts`; this ticket imports those rather than re-deriving the draft shape or the default rule. Confirmed: 001 is its declared Dep.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §Required data models → `GenerationSessionReadyCandidate`, `GenerationSessionReady`) names `normalizeGenerationSessionForReadiness` as the producing function; `specs/IMPLEMENTATION-ORDER.md:32` and the regression-plan spec confirm that symbol and the `GenerationSessionReadyCandidate` type as Phase-1 core deliverables.
3. Shared boundary under audit: the ready-candidate contract is the input the future generation-readiness validator parses instead of persisted draft state. The consumer is `SPEC-validation-gating-taxonomy-and-focus-matrix.md`; this ticket must not assume a validator exists yet — it ships the normalizer + schema only, so the downstream spec can build against a stable shape.
4. FOUNDATIONS restated: §8 — normalization is deterministic (trim, blank-removal, context default are pure functions of the draft + accepted-segment count). §11 — the ready candidate produces blockers only by *absence* of required ready fields (e.g. `manual_moment_directive.must_render` absent → later blocks Preview/Generate); normalization itself never fabricates a field to dodge a blocker (it must "never invent a launch directive").
5. Substrate determinism/firewall check: this is the input to the deferred readiness-validation enforcement surface. `normalizeGenerationSessionForReadiness` must introduce no nondeterminism and no leakage path: blank `prior_accepted_prose_status_or_handoff_note` normalizes to absent (never to fabricated continuity), and accepted prose can never enter via normalization (§10/§15). `soft_unit_guidance` blank → deterministic empty state, not a blocker.
6. Schema extension classification: `generationSessionReadySchema` is a **new internal normalized view**, not a change to `generationSessionSchema` or `generationSessionDraftSchema`. It is additive; its sole consumer is the Phase-4 validator. No existing consumer is altered.
7. Mismatch + correction: the spec names the function `normalizeGenerationSessionForReadiness` (the in-session `/reassess-spec` run added this name where only the *type* was previously named); this ticket uses it verbatim to match the regression-plan spec.

## Architecture Check

1. A dedicated readiness normalizer + ready schema (separate from draft persistence) realizes the spec's explicit rule that "validation should not parse persisted draft state with the same schema used for persistence." Keeping the ready view internal (not a persistence schema) prevents it from becoming a second stored authority.
2. No backwards-compatibility aliasing/shims: the ready view is net-new; it reuses `deriveGenerationContextDefault` from 001 rather than duplicating the default rule (no duplicate authority path).

## Verification Layers

1. Normalization invariant (trims strings, removes blank array entries, removes empty array objects with no semantic content, preserves explicit nonblank fields, applies/preserves `generation_context`) -> unit test in `packages/core/test/generation-brief-readiness.test.ts`.
2. Empty-state-not-blocker invariant (blank `soft_unit_guidance` → allowed empty ready state; blank `must_render` → absent, i.e. a later missing-directive blocker, never fabricated) -> unit test asserting the ready candidate.
3. Determinism invariant (identical draft + accepted-segment count → identical ready candidate) -> unit test; FOUNDATIONS §8 alignment check.
4. No-leakage invariant (blank handoff/`prior_accepted_prose_status_or_handoff_note` never normalizes into invented continuity or accepted prose) -> manual review (secret-firewall/determinism) + assertion test.

## What to Change

### 1. New `packages/core/src/records/generation-brief-readiness.ts`

- `export type GenerationSessionReadyCandidate` — the normalized draft view: trimmed, blanks treated as absent, deterministic `generation_context` resolved.
- `generationSessionReadySchema` + `export type GenerationSessionReady` — the internal generation-ready view; required ready fields are present-or-absent, and absence is an allowed (later-blocking) state, not a parse error.
- `normalizeGenerationSessionForReadiness(draft: GenerationSessionDraft, opts: { acceptedSegmentCount: number }): GenerationSessionReadyCandidate` — trim strings; treat blank strings as absent for readiness; remove blank array entries and empty semantic-less array objects; apply `deriveGenerationContextDefault` when no explicit context, preserve a valid explicit context; preserve nonblank stop guidance, convert blank `soft_unit_guidance` to the allowed empty state (not a blocker); never invent story content or a launch directive.

### 2. Export from `packages/core/src/index.ts`

- Add `normalizeGenerationSessionForReadiness`, `generationSessionReadySchema`, and the `GenerationSessionReadyCandidate` / `GenerationSessionReady` types to the public barrel.

## Files to Touch

- `packages/core/src/records/generation-brief-readiness.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/generation-brief-readiness.test.ts` (new)

## Out of Scope

- The generation-readiness validator that consumes this candidate (`SPEC-validation-gating-taxonomy-and-focus-matrix.md`, Phase 4).
- Draft schema / draft-storage normalizer / `deriveGenerationContextDefault` (SPECGENBRIDRA-001 — imported here).
- Server, snapshot, route, migration, web, and compiler changes (later tickets).

## Acceptance Criteria

### Tests That Must Pass

1. `normalizeGenerationSessionForReadiness` trims blanks, removes empty list items/objects, and preserves explicit nonblank fields (the spec's ready-candidate bullet list).
2. Blank `soft_unit_guidance` normalizes to the allowed empty ready state; blank `manual_moment_directive.must_render` remains absent (never fabricated); blank `immediate_handoff` for `first_segment` is allowed.
3. `deriveGenerationContextDefault` is applied when no context is selected and a valid explicit context is preserved when present.
4. `npm test` passes.

### Invariants

1. The ready view is internal/derived — no code path persists a `GenerationSessionReady` as stored project state.
2. Normalization is deterministic and never introduces accepted prose, invented continuity, or a fabricated launch directive (§8/§10).

## Test Plan

### New/Modified Tests

1. `packages/core/test/generation-brief-readiness.test.ts` (new) — normalization correctness, empty-state-not-blocker behavior, context defaulting/preservation, determinism, and no-leakage assertions.

### Commands

1. `npm test --workspace @loom/core` — targeted readiness-normalizer tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate including the core import-boundary rule.

## Outcome

Completion date: 2026-06-07

Implemented the additive readiness contract in `packages/core/src/records/generation-brief-readiness.ts`, including `generationSessionReadySchema`, `GenerationSessionReadyCandidate`, `GenerationSessionReady`, and `normalizeGenerationSessionForReadiness`. Exported the new readiness symbols from `packages/core/src/index.ts` and added focused coverage in `packages/core/test/generation-brief-readiness.test.ts`.

Deviations from original plan: none. The ready view remains derived-only; no repository persistence path writes `GenerationSessionReady`.

Verification results:

- `npm test --workspace @loom/core` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
