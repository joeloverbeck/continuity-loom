# SPECGENBRIDRA-001: Core draft schema, draft normalizer & generation_context default

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` exports `generationSessionDraftSchema`, `normalizeGenerationSessionDraft`, `deriveGenerationContextDefault` (+ `GenerationSessionDraft` type); new `packages/core/src/records/generation-brief-draft.ts`; new test file
**Deps**: None

## Problem

Saving a generation brief currently behaves like asking permission to generate prose: `setGenerationSession` parses every write with the strict `generationSessionSchema` (`packages/core/src/records/generation-brief.ts:158`), whose present nested surfaces require non-empty strings (`immediateHandoffSchema`, `stopGuidanceSchema.soft_unit_guidance`, `manualMomentDirectiveSchema.must_render` `.min(1)`) and a `generation_context` of exactly length 1. A normal authoring workflow cannot persist a partial draft of the very fields needed to clear generation blockers. This ticket lays the data-contract foundation: a permissive **draft** schema, a deterministic **draft-storage normalizer**, and the deterministic **generation_context default** — the write path of the spec's three-layer model. The read/verify (ready-candidate) path is SPECGENBRIDRA-002.

## Assumption Reassessment (2026-06-07)

1. The strict schema and its non-empty constraints exist as the spec describes: `generationSessionSchema` at `packages/core/src/records/generation-brief.ts:158`; `immediateHandoffSchema` (lines 49–56), `stopGuidanceSchema` (152–156), `manualMomentDirectiveSchema.must_render` `.min(1)` (60), `generationValidationFocusSchema…generation_context` `.length(1)` (114) all reject blanks/absence when their surface is present. Confirmed this session.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §Required data models → `GenerationSessionDraft`, §Deterministic defaults → `deriveGenerationContextDefault`) names exactly these deliverables; `specs/IMPLEMENTATION-ORDER.md:31` confirms `deriveGenerationContextDefault` and `normalizeGenerationSessionDraft` as Phase-1 core symbols.
3. Shared boundary under audit: the generation-session JSON contract in `@loom/core`, consumed by `packages/server` (repository, routes, snapshot) and `packages/web`. This ticket adds a **parallel permissive schema**; it does not modify `generationSessionSchema` (the strict schema remains the shape source for `generation-brief-descriptors.ts:5`). Downstream read-path switch is SPECGENBRIDRA-004; routes are SPECGENBRIDRA-005.
4. FOUNDATIONS principle restated before trusting the spec: §4.4/§8 deterministic compilation — `deriveGenerationContextDefault(acceptedSegmentCount)` must be a pure function of its integer input (no wall-clock, no LLM, no unordered iteration), and `normalizeGenerationSessionDraft` must be deterministic. §11 — draftability must not weaken any validation gate; strictness moves to Preview/Generate (later phases), it is not removed.
5. Substrate-only determinism/firewall check: this schema is the **input** to a deferred enforcement surface — generation-readiness validation (`SPEC-validation-gating-taxonomy-and-focus-matrix.md`, Phase 4) and deterministic compilation (`packages/core/src/compiler`). The draft schema must introduce no nondeterminism path and no secret-leakage path those surfaces would have to undo: it keeps IDs, enums, and `prior_accepted_prose_status_or_handoff_note` typed (`nonemptyString | "none"`), so permissiveness never admits accepted prose or untyped data (§10/§15). Unknown keys stay rejected (`.strict()`).
6. Schema extension classification: the draft schema is **additive** — a new exported schema alongside `generationSessionSchema`, not a change to it. No existing consumer of `generationSessionSchema` is altered by this ticket; consumers that must read persisted drafts are migrated in SPECGENBRIDRA-004. The strict schema and `GenerationSession` type are unchanged.
7. Mismatch + correction: the spec originally named the default `defaultGenerationContext`; the in-session `/reassess-spec` run corrected it to `deriveGenerationContextDefault` to match `specs/IMPLEMENTATION-ORDER.md` and the regression-plan spec. This ticket uses the corrected name.

## Architecture Check

1. A separate `generationSessionDraftSchema` (vs. relaxing `generationSessionSchema` in place) keeps the strict schema as the single authority for generation-ready shape and `generation-brief-descriptors.ts`, while giving persistence a permissive contract — the spec's explicit "different acts need different contracts" doctrine. Co-locating the default and draft normalizer in one new file keeps the deterministic write-path logic reviewable as one unit.
2. No backwards-compatibility aliasing or shims: the draft schema is net-new; no parallel/duplicate authority for the *ready* shape is introduced (that is one normalized internal view, built in SPECGENBRIDRA-002).

## Verification Layers

1. Draft permissiveness invariant (blank nested surfaces, empty arrays, partial handoff accepted; unknown keys + bad enums/IDs rejected) -> schema validation in `packages/core/test/generation-brief-draft.test.ts`.
2. Determinism invariant (`deriveGenerationContextDefault` pure on `acceptedSegmentCount`; `normalizeGenerationSessionDraft` byte-stable) -> unit test asserting fixed input → fixed output; FOUNDATIONS §8 alignment check.
3. Additive-only invariant (`generationSessionSchema` and `GenerationSession` unchanged) -> codebase grep-proof that `generation-brief.ts` strict exports are untouched and the new file is the only schema addition.
4. Public-API invariant (new symbols exported) -> grep-proof of `packages/core/src/index.ts` exporting the three symbols + type.

## What to Change

### 1. New `packages/core/src/records/generation-brief-draft.ts`

- `generationSessionDraftSchema`: same top-level surfaces as `generationSessionSchema`, all optional; each nested surface a permissive variant where string fields accept `""` and string arrays accept `[]`; `manual_moment_directive.must_render` allows `[]`; `generation_context` allows `0` or `1` entries; IDs (`recordId`), enums, and union literals stay typed; `prior_accepted_prose_status_or_handoff_note` stays `nonemptyString | "none"`; every object `.strict()` (unknown keys rejected).
- `export type GenerationSessionDraft = z.infer<typeof generationSessionDraftSchema>`.
- `deriveGenerationContextDefault(acceptedSegmentCount: number): "first_segment" | "continuation_after_accepted_segment"` — returns `first_segment` when count is `0`, else `continuation_after_accepted_segment`.
- `normalizeGenerationSessionDraft(draft: GenerationSessionDraft, opts: { acceptedSegmentCount: number }): GenerationSessionDraft` — compact normalized draft storage: trim strings, drop blank array items, omit fully-blank optional surfaces, and persist a deterministic `generation_context` (via `deriveGenerationContextDefault`) only when the user has never selected one. Never invents story content; never invents a launch directive (`must_render` stays absent/empty if blank).

### 2. Export from `packages/core/src/index.ts`

- Add `generationSessionDraftSchema`, `normalizeGenerationSessionDraft`, `deriveGenerationContextDefault`, and the `GenerationSessionDraft` type to the public barrel, alongside the existing `generationSessionSchema` export at line 100.

## Files to Touch

- `packages/core/src/records/generation-brief-draft.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/generation-brief-draft.test.ts` (new)

## Out of Scope

- The ready-candidate / ready schema and `normalizeGenerationSessionForReadiness` (SPECGENBRIDRA-002).
- Repository read-path switch and migration (SPECGENBRIDRA-004, -007).
- Route contracts, field-aware merge, malformed-draft response (SPECGENBRIDRA-005).
- Compiler empty states (SPECGENBRIDRA-003) and any change to `generationSessionSchema`/descriptors.
- `ReadinessSummary` (owned by `SPEC-readiness-diagnostics-and-three-page-ux.md`).

## Acceptance Criteria

### Tests That Must Pass

1. `generationSessionDraftSchema` parses each spec example draft (blank nested stop guidance; partial `immediate_handoff` with blank strings; empty `manual_moment_directive` arrays; `generation_context: ["first_segment"]` only) with `ok: true`.
2. `generationSessionDraftSchema` rejects unknown keys, invalid enum values, and invalid record IDs.
3. `deriveGenerationContextDefault(0) === "first_segment"` and `deriveGenerationContextDefault(n>0) === "continuation_after_accepted_segment"`; `normalizeGenerationSessionDraft` trims blanks, drops blank list items, preserves explicit nonblank fields, and applies the context default only when none was selected.
4. `npm test` (the `@loom/core` build + Vitest run) passes.

### Invariants

1. `generationSessionSchema` and the `GenerationSession` type in `packages/core/src/records/generation-brief.ts` are byte-unchanged by this ticket (additive-only).
2. `deriveGenerationContextDefault` and `normalizeGenerationSessionDraft` are deterministic — identical inputs yield identical outputs, with no wall-clock, randomness, or LLM intermediary (§8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/generation-brief-draft.test.ts` (new) — draft-schema acceptance/rejection cases, `deriveGenerationContextDefault` truth table, and `normalizeGenerationSessionDraft` normalization + determinism.

### Commands

1. `npm test --workspace @loom/core` — targeted core schema/normalizer tests (build + Vitest for the package under change).
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate (the core import-boundary rule must still pass; `@loom/core` stays free of `node:*`/fastify/react/vite).
