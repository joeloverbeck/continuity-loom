# BRIEFVALGUARD-001: Stop first-segment handoff validation from crashing on an absent prior-prose note

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/validation/rules/universal-blockers.ts` (validation rule `validateGenerationContextRows` / helper `isCleanNoAcceptedProseNote`)
**Deps**: None

## Problem

Opening a real project (`/home/joeloverbeck/stories/red-bunny`) and visiting `/generation-brief`, `/preview`, or `/generate` produces console errors and broken pages. All three depend on `/api/compile` and/or `/api/readiness`, and **both endpoints return `500 Internal Server Error: "Cannot read properties of undefined (reading 'trim')"`**.

Reproduced live (against a disposable copy of the project) with this stack trace:

```
TypeError: Cannot read properties of undefined (reading 'trim')
  at isCleanNoAcceptedProseNote (packages/core/src/validation/rules/universal-blockers.ts:515)
  at validateGenerationContextRows (packages/core/src/validation/rules/universal-blockers.ts:384)
  at runValidation (packages/core/src/validation/engine.ts:10)
```

`isCleanNoAcceptedProseNote(text: string)` calls `text.trim()`, but its caller at line 384 passes `handoff.prior_accepted_prose_status_or_handoff_note`, which is **optional** in the immediate-handoff schema. The red-bunny brief has `generation_context = "first_segment"` and `immediate_handoff = { recent_causal_context: "Aaaa" }` — i.e. no prior-prose note — so the value is `undefined` and `undefined.trim()` throws **inside `runValidation`**, which both `/api/compile` and `/api/readiness` call. This is a fail-open crash (HTTP 500) where validation is required to fail closed (clean blocker or clean pass).

Per `docs/story-record-schema.md:207`, *"For `first_segment`, all handoff prose fields are optional. The compiler renders a deterministic first-segment empty state when no prior accepted prose exists."* An absent prior-prose note on a first segment is therefore a **valid** state — the rule must treat it as clean (no accepted prose referenced), neither crashing nor raising a spurious contamination blocker.

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. Items 4+ are a menu; include only those matching this ticket's scope. -->

1. **Crash site (codebase):** `packages/core/src/validation/rules/universal-blockers.ts:514-516` — `isCleanNoAcceptedProseNote(text: string)` returns `text.trim().toLowerCase() === "none. no accepted prose is included."`. Typed parameter is `string`, but the caller at line 384 passes `handoff.prior_accepted_prose_status_or_handoff_note`. Confirmed by reproduction stack trace above. The same helper is also called at line 510 via `isCleanAcceptedStatus`, so the guard must keep both call sites safe.
2. **Schema (codebase + docs):** `immediate_handoff.prior_accepted_prose_status_or_handoff_note` is required only in the **strict** schema (`packages/core/src/records/generation-brief.ts:54`, `z.union([nonemptyString, z.literal("none")])`) but **optional** in the draft schema (`packages/core/src/records/generation-brief-draft.ts:59`, `…optional()`). Validation runs on snapshot data built from the **draft-shaped** stored session (`packages/server/src/snapshot-builder.ts:39-47`, `getGenerationSession()` payload parsed elsewhere as draft), so the field is legitimately absent at validation time. Docs: `docs/story-record-schema.md:207` and `docs/compiler-contract.md:188` confirm first-segment handoff fields are optional.
3. **Shared boundary under audit:** the `runValidation` → `validateGenerationContextRows` rule path, consumed by both `packages/server/src/compile-routes.ts` (POST `/api/compile`) and `packages/server/src/readiness-routes.ts` (POST `/api/readiness`). A single fix must restore both endpoints.
4. **FOUNDATIONS principle under audit:** §11 (Validation and hard fails) — validation must **fail closed**: produce a deterministic blocker or a clean pass, never a runtime exception. A 500 from inside `runValidation` violates this. The fix preserves the existing contamination intent (a non-empty first-segment note that is neither the clean sentinel nor `"none"` still blocks) while making the rule total over the optional/absent case.
5. **Enforcement surface:** this is a fail-closed validation surface. The change is additive guarding only; it does not weaken the secret firewall (§15) and does not touch deterministic compilation (§8) — the compiler is never reached today because the crash precedes it.
8. **Adjacent contradictions:** reassessment uncovered a **family of sibling unguarded accesses** of the same `generation_validation_focus?.validation_focus_tags.…` pattern (`universal-blockers.ts:370`, `universal-completeness.ts:98` & `:258`, `snapshot-builder.ts:73, 81, 83`). These are **not** triggered by red-bunny (its `validation_focus_tags.generation_context` is populated and the open-time migration backfills it) and are classified as a **separate latent bug** tracked by **BRIEFVALGUARD-002**, not part of this confirmed-crash fix.
9. **Mismatch + correction:** the Explore pass initially proposed `snapshot-builder.ts:73` as the root cause; reproduction disproved that for this data (`validation_focus_tags` is present in red-bunny) and isolated the true crash to the `.trim()` on the absent prior-prose note. `snapshot-builder.ts:73` is real but latent → moved to BRIEFVALGUARD-002.

## Architecture Check

1. The minimal, doc-aligned fix makes `isCleanNoAcceptedProseNote` **total**: an absent/empty note is treated as clean (no accepted prose present), and a present note is still compared against the clean sentinel. This is cleaner than guarding at the single call site (line 384) because the same helper is reused by `isCleanAcceptedStatus` (line 510) and the totality belongs to the predicate, not its callers. It aligns with `docs/story-record-schema.md:207` (first-segment handoff fields optional) rather than inventing new behavior.
2. No backwards-compatibility aliasing or shims are introduced; the helper signature is widened to accept the value type the caller already passes.

## Verification Layers

1. **No 500 from validation on a first-segment brief lacking a prior-prose note** → manual review + server route test (`compile-routes.test.ts`) asserting a non-500 response for that fixture.
2. **`isCleanNoAcceptedProseNote` is total over `string | undefined`** → core unit test (`validation-blockers.test.ts`) covering `undefined`, `""`, the clean sentinel, `"none"`, and a real handoff note.
3. **First-segment-optional contract preserved** → FOUNDATIONS/schema alignment check citing `docs/story-record-schema.md:207`; an absent note yields no contamination blocker, a continuation-style note still blocks.

## What to Change

### 1. Make the clean-note predicate total

In `packages/core/src/validation/rules/universal-blockers.ts`, change `isCleanNoAcceptedProseNote` to accept `string | undefined` and treat an absent/empty (post-trim) value as clean, while preserving the existing sentinel comparison for present values. Confirm no other caller relies on the parameter being required (today: lines 384 and 510 only).

## Files to Touch

- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify — add coverage)
- `packages/server/src/compile-routes.test.ts` (modify — add first-segment-no-handoff-note regression)

## Out of Scope

- The latent sibling unguarded accesses of `generation_validation_focus?.validation_focus_tags.…` (covered by **BRIEFVALGUARD-002**).
- Any change to the strict/draft schema definitions or to the open-time migration backfill.
- Normalization of the literal `"none"` vs. the rendered sentinel (no behavior change intended here beyond not crashing).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: `isCleanNoAcceptedProseNote(undefined)` and `isCleanNoAcceptedProseNote("")` return `true`; the clean sentinel returns `true`; a continuation-style note (e.g. `"as above"` context or any non-empty non-sentinel text) returns `false`.
2. New route test in `packages/server/src/compile-routes.test.ts`: a generation session with `generation_context = "first_segment"` and an `immediate_handoff` lacking `prior_accepted_prose_status_or_handoff_note` does **not** produce a 500 from `/api/compile`; `runValidation` returns a structured result (pass or deterministic blocker), not a thrown error.
3. `npm test` passes (builds `@loom/core`, runs Vitest across packages).

### Invariants

1. `runValidation` never throws for any draft-shaped generation session; it always returns a `ValidationResult`.
2. A first-segment brief with no prior-prose note produces no `promptFacingProseContamination` blocker for that field (aligns with `docs/story-record-schema.md:207`).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-blockers.test.ts` — totality of `isCleanNoAcceptedProseNote` and the first-segment contamination branch over absent/empty/sentinel/real-note inputs.
2. `packages/server/src/compile-routes.test.ts` — end-to-end regression that the red-bunny-shaped brief (first_segment, no prior-prose note) no longer 500s.

### Commands

1. `npm test -- validation-blockers` (targeted core rule coverage)
2. `npm test` (full pipeline: builds `@loom/core`, then Vitest)
3. Manual: with the dev server running, open a first-segment project lacking a prior-prose note and confirm `/generation-brief`, `/preview`, and `/generate` load without console errors.

## Outcome

Completed: 2026-06-08

Changed `packages/core/src/validation/rules/universal-blockers.ts` so the first-segment prior-prose note predicate is total over absent, empty, `"none"`, and rendered clean-sentinel values while still rejecting real continuation-style handoff text.

Added regression coverage in `packages/core/test/validation-blockers.test.ts` for the predicate and first-segment validation path, and in `packages/server/src/compile-routes.test.ts` for `/api/compile` with a first-segment draft that omits `immediate_handoff.prior_accepted_prose_status_or_handoff_note`.

Deviation: the helper is exported from its internal validation-rule module for direct unit coverage, but it is not added to the public package index.

Verification:

- `npm test -- validation-blockers` passed.
- `npm test -- compile-routes` passed.
- `npm test` passed: 99 files, 611 tests.
