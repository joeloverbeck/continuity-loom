# BRIEFVALGUARD-002: Harden generation-validation-focus access against partial (draft-shaped) sessions

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/validation/rules/universal-blockers.ts`, `packages/core/src/validation/rules/universal-completeness.ts`, `packages/server/src/snapshot-builder.ts`
**Deps**: None (independent of BRIEFVALGUARD-001; same root pattern, different sites)

## Problem

While diagnosing the confirmed first-segment crash (BRIEFVALGUARD-001), reassessment found a **family of sibling unguarded member accesses** that share the same defect class: an optional chain on `generation_validation_focus?` followed by an **unguarded** access to `validation_focus_tags` and/or `generation_context`. Validation and snapshot-building code assume the **strict (complete)** generation-brief shape, but they execute against **draft-shaped (partial)** data, where `validation_focus_tags` may be absent and `generation_context` may be empty/absent.

Affected sites:

- `packages/core/src/validation/rules/universal-blockers.ts:370` — `…generation_validation_focus?.validation_focus_tags.generation_context[0]`
- `packages/core/src/validation/rules/universal-completeness.ts:98` — `…generation_validation_focus?.validation_focus_tags.generation_context[0]`
- `packages/core/src/validation/rules/universal-completeness.ts:258` — `…generation_validation_focus?.validation_focus_tags.generation_context`
- `packages/server/src/snapshot-builder.ts:73` — `session.generation_validation_focus?.validation_focus_tags.generation_context`
- `packages/server/src/snapshot-builder.ts:81` — `…validation_focus_tags.expected_local_modes ?? []`
- `packages/server/src/snapshot-builder.ts:83` — `…validation_focus_tags.possible_durable_changes ?? []`

Each throws `TypeError: Cannot read properties of undefined` when `generation_validation_focus` exists but `validation_focus_tags` is absent (or, for the `generation_context[0]` sites, when `generation_context` is absent). The draft schema permits exactly this (`packages/core/src/records/generation-brief-draft.ts`: `validation_focus_tags` optional, `generation_context` `…max(1).optional()`).

These are **not** reproduced by the red-bunny project (its `validation_focus_tags.generation_context = ["first_segment"]` is populated, and the open-time migration `migrateGenerationSessionDraft` → `backfillGenerationContext` backfills it on open). They are latent: reachable via a mid-session brief edit + save (`PUT /api/generation-brief` does not re-run the open-time backfill in a way that guarantees these subfields), after which `/api/compile` or `/api/readiness` would 500. This ticket is defense-in-depth to make these paths total, consistent with §11 fail-closed validation. Note `snapshot-builder.ts:73` is especially perverse: it crashes inside the very block (lines 74-85) whose purpose is to *default* a missing `generation_context`.

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. Items 4+ are a menu; include only those matching this ticket's scope. -->

1. **Codebase sites:** all six line references above verified by grep on 2026-06-08 (`grep -n "validation_focus_tags\." … | grep -v "validation_focus_tags?\."`). Each is an optional-chain-then-unguarded-access on `generation_validation_focus`.
2. **Schema (codebase + docs):** the draft schema (`packages/core/src/records/generation-brief-draft.ts`) makes `validation_focus_tags` optional and `generation_context` `…max(1).optional()`; the strict schema (`packages/core/src/records/generation-brief.ts`) requires `generation_context` `.length(1)`. Snapshot/validation run on the draft-shaped payload, so the strict-shape assumption is unsafe. `docs/story-record-schema.md:333` documents that `generation_context` is *normalized*/defaulted from accepted-segment count, which is the intended safe default these sites should converge on.
3. **Shared boundary under audit:** the `generation_validation_focus.validation_focus_tags.{generation_context,expected_local_modes,possible_durable_changes}` access contract, transported into (a) the server snapshot defaulter (`snapshot-builder.ts`) and (b) two core validation rules (`universal-blockers.ts`, `universal-completeness.ts`). The end-state invariant: every read of these subfields tolerates an absent `validation_focus_tags`/`generation_context`.
4. **FOUNDATIONS principle under audit:** §11 (Validation and hard fails) — fail closed, never throw. §8 (deterministic compilation) — the snapshot defaulter must still deterministically resolve `generation_context` from accepted-segment count (`deriveGenerationContextDefault`, already imported in `snapshot-builder.ts`) when absent, not silently drop it.
5. **Enforcement surface:** fail-closed validation + the deterministic snapshot defaulter. Changes are guarding/defaulting only; no change to the secret firewall (§15) and no change to compiled output for already-complete sessions (§8) — behavior is identical when `validation_focus_tags.generation_context` is already present.
6. **Schema consumers:** the three files above are the consumers of these subfields under audit. Change is read-side guarding only; no schema field is added or removed, so it is additive/non-breaking to stored data.
8. **Adjacent contradictions:** the confirmed user-facing crash (the `.trim()` on an absent prior-prose note) is a *different* site and is owned by **BRIEFVALGUARD-001**; this ticket deliberately excludes it to keep the urgent fix as a tight diff.

## Architecture Check

1. Guarding each access (optional chaining through `validation_focus_tags?.` and treating an absent `generation_context` as "use the deterministic default") is cleaner than relying on the open-time migration to have populated the data, because validation/snapshot code must be **total over the draft schema it actually consumes**. For `snapshot-builder.ts`, the existing intent (default `generation_context` via `deriveGenerationContextDefault`) is preserved and made reachable; for the read-only validation rules, an absent context simply yields the existing "no context" early-return behavior (e.g. `universal-blockers.ts:373` already early-returns when `context` is falsy).
2. No backwards-compatibility aliasing/shims; only optional-chaining and existing-default reuse are added.

## Verification Layers

1. **Snapshot defaulter total over absent `validation_focus_tags`** → server unit test (`snapshot-builder.test.ts`) feeding a session with `generation_validation_focus: {}` and asserting `generation_context` resolves to the deterministic default and no throw.
2. **Core validation rules total over absent `validation_focus_tags`/`generation_context`** → core unit tests (`validation-blockers.test.ts`, `validation-completeness.test.ts`) feeding such sessions and asserting a `ValidationResult` (no throw).
3. **Deterministic default preserved** → FOUNDATIONS §8 alignment check: with no accepted segments an absent context defaults to `first_segment`; with ≥1 it defaults to `continuation_after_accepted_segment` (`deriveGenerationContextDefault`, `docs/story-record-schema.md:333`).
4. **No behavior change for complete sessions** → grep-proof + existing tests: when `validation_focus_tags.generation_context` is present, output is byte-identical (red-bunny path unaffected).

## What to Change

### 1. Guard the snapshot defaulter

In `packages/server/src/snapshot-builder.ts` (lines 73, 81, 83), optional-chain through `validation_focus_tags?.` so an absent `validation_focus_tags` does not throw; the existing default block must still populate `generation_context` via `deriveGenerationContextDefault(acceptedSegmentCount)` and default `expected_local_modes`/`possible_durable_changes` to `[]`.

### 2. Guard the validation-rule reads

In `packages/core/src/validation/rules/universal-blockers.ts:370` and `packages/core/src/validation/rules/universal-completeness.ts:98` & `:258`, optional-chain through `validation_focus_tags?.` and `generation_context?.[0]` / `generation_context?.` so an absent subfield yields the existing falsy/empty handling (early-return / no diagnostic) rather than a throw.

## Files to Touch

- `packages/server/src/snapshot-builder.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/server/src/snapshot-builder.test.ts` (modify — add partial-session coverage)
- `packages/core/test/validation-blockers.test.ts` (modify — add partial-session coverage)
- `packages/core/test/validation-completeness.test.ts` (modify — add partial-session coverage)

## Out of Scope

- The confirmed first-segment `.trim()` crash (owned by **BRIEFVALGUARD-001**).
- Changing the draft/strict schemas or the open-time migration backfill.
- Any change to compiled prompt output for sessions that already carry `validation_focus_tags.generation_context`.

## Acceptance Criteria

### Tests That Must Pass

1. `buildSnapshotFromOpenProject` / `withSnapshotSessionDefaults` does not throw for a session with `generation_validation_focus: {}` (no `validation_focus_tags`); resolved snapshot has `generation_context` set to the deterministic default for the accepted-segment count.
2. `runValidation` does not throw for sessions with absent `validation_focus_tags` or absent `generation_context`; it returns a `ValidationResult`.
3. For a session that already has `validation_focus_tags.generation_context`, snapshot and validation output are unchanged (existing tests still pass).
4. `npm test` passes.

### Invariants

1. Every read of `generation_validation_focus.validation_focus_tags.{generation_context,expected_local_modes,possible_durable_changes}` tolerates an absent parent object and does not throw.
2. The snapshot defaulter deterministically resolves an absent `generation_context` from accepted-segment count (§8), never leaving it undefined.

## Test Plan

### New/Modified Tests

1. `packages/server/src/snapshot-builder.test.ts` — partial session (`generation_validation_focus: {}`) defaults `generation_context` and does not throw.
2. `packages/core/test/validation-blockers.test.ts` — `validateGenerationContextRows` total over absent `validation_focus_tags`/`generation_context`.
3. `packages/core/test/validation-completeness.test.ts` — completeness reads at lines 98 & 258 total over the same partial shapes.

### Commands

1. `npm test -- snapshot-builder` (targeted server defaulter coverage)
2. `npm test -- validation-blockers validation-completeness` (targeted core coverage)
3. `npm test` (full pipeline: builds `@loom/core`, then Vitest)

## Outcome

Completed: 2026-06-08

Changed `packages/server/src/snapshot-builder.ts` so generation-validation-focus defaulting optional-chains through absent `validation_focus_tags` and preserves existing deterministic default behavior for missing `generation_context`.

Changed `packages/core/src/validation/rules/universal-blockers.ts` and `packages/core/src/validation/rules/universal-completeness.ts` so validation reads tolerate absent `validation_focus_tags` and absent `generation_context` instead of throwing on draft-shaped sessions.

Added regression coverage in `packages/server/src/snapshot-builder.test.ts`, `packages/core/test/validation-blockers.test.ts`, and `packages/core/test/validation-completeness.test.ts` for partial validation-focus data.

Deviation: no schema or migration changes were needed; the fix stayed read-side and reused the existing `deriveGenerationContextDefault` path.

Verification:

- `npm test -- snapshot-builder` passed.
- `npm test -- validation-blockers validation-completeness` passed.
- `npm test` passed: 99 files, 617 tests.
