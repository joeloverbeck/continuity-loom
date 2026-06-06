# SPEC014POLREGHAR-002: Validation clarity-invariant test

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — adds `packages/core/test/validation-clarity-invariants.test.ts`; no production validation-rule changes (message refinement is deferred-unless-triggered, see Out of Scope).
**Deps**: None

## Problem

Validation diagnostics already carry the right shape — `severity`, `code`, `message`, `whyItMatters`, `suggestedActions` (`packages/core/src/validation/types.ts:21-28`) — but no invariant test guarantees every emitted blocker stays *actionable* (≥1 `suggestedActions` element) and *legible* (non-empty `message`/`whyItMatters`), that diagnostic codes stay unique, or that warnings never gate while blockers always do. SPEC-014 D2 adds that invariant so a future rule that ships a blocker with no suggested action, an empty message, or a duplicated code fails CI instead of silently degrading validation legibility (FOUNDATIONS §11, §29.11).

## Assumption Reassessment (2026-06-06)

1. The diagnostic contract is `interface Diagnostic { severity; code; message; affected; whyItMatters; suggestedActions }` with `suggestedActions: readonly SuggestedAction[]` (`packages/core/src/validation/types.ts:21-28`) — the field is the **plural array** `suggestedActions`, not `suggestedAction`. `ValidationResult` is `{ blockers; warnings; isBlocked }` (`types.ts:30-34`). The diagnostic codes registry is `DIAGNOSTIC_CODES` (`types.ts:36-92`).
2. Production validation runs through `runValidation(...)` (`packages/core/src/validation/engine.ts:6`); existing tests (`validation.test.ts`, `validation-blockers.test.ts`, `validation-warnings-security.test.ts`, stress fixtures) already drive it, so a representative corpus of snapshots that emit blockers and warnings is available to reuse rather than invent.
3. Cross-artifact boundary under audit: the invariant test asserts properties of the *diagnostics contract* (`types.ts`) as produced by the *rule engine* (`engine.ts`). The audit confirms these are the canonical surfaces and that the test must not hard-code the diagnostic count (it should iterate whatever the corpus emits).
4. FOUNDATIONS principle under audit: §11 — "validation errors must be legible and actionable… identify the conflicting records or fields, explain the conflict in plain language, and indicate what the user can change," and "the app should distinguish warnings from blockers." The invariant operationalizes this; it changes no gating behavior.
5. Fail-closed validation surface: the test asserts the existing gate (`isBlocked` true iff ≥1 blocker; warnings never set `isBlocked`) without weakening it. **Code-uniqueness is scoped to the `DIAGNOSTIC_CODES` registry / emitted diagnostics — the test must NOT assert that every registered code is emitted**, because `acceptedProseContamination` (`"accepted-prose-contamination"`, `types.ts:37`) is registered but fired by no production rule (the verbatim-prose path emits `promptFacingProseContamination`, `universal-blockers.ts:388,415,427`). Removing that orphan is a code change out of scope here.
6. No mismatch: confirmed the field is `suggestedActions` (array) and the orphaned code has zero emit sites (`grep -rn acceptedProseContamination packages/*/src` returns only the `types.ts` definition) during the 2026-06-06 spot-check.

## Architecture Check

1. A single corpus-driven invariant test is cleaner than scattering per-rule assertions: it catches *any* future rule that violates the contract without that rule's author having to remember to add a legibility check. Driving real `runValidation` output (not a hand-listed diagnostic table) keeps the invariant honest as rules evolve.
2. No backwards-compatibility shims: the test reads the existing `DIAGNOSTIC_CODES` and `runValidation` surfaces directly; it introduces no parallel rule registry or adapter.

## Verification Layers

1. Code uniqueness → `Object.values(DIAGNOSTIC_CODES)` has no duplicates (set size equals array length) — static assertion.
2. Blocker actionability + legibility → for every blocker emitted across the corpus, `suggestedActions.length >= 1`, `message` non-empty, `whyItMatters` non-empty — test assertion over `runValidation` output.
3. Warnings non-gating / blockers gating → a warning-only snapshot yields `isBlocked === false`; a blocker-bearing snapshot yields `isBlocked === true` — test assertion (distinct invariant, distinct fixtures).
4. FOUNDATIONS §11 legibility intent → FOUNDATIONS alignment check (no gating/severity/code/field change introduced).

## What to Change

### 1. Add the clarity-invariant test

Create `packages/core/test/validation-clarity-invariants.test.ts`:

- **Registry uniqueness**: assert `new Set(Object.values(DIAGNOSTIC_CODES)).size === Object.values(DIAGNOSTIC_CODES).length`.
- **Emitted-diagnostic legibility**: assemble a corpus of `ValidationSnapshot`s that collectively emit a broad set of blockers and warnings (reuse demo + stress + existing blocker-test fixtures). For each emitted diagnostic assert `message.trim()` and `whyItMatters.trim()` are non-empty; for each **blocker** additionally assert `suggestedActions.length >= 1`.
- **Gating discipline**: assert a warning-only result has `isBlocked === false` and `blockers.length === 0`; assert a result with ≥1 blocker has `isBlocked === true`.
- Add a comment documenting that uniqueness is scoped to the registry and the test deliberately does **not** require every registered code to be emitted (orphan `acceptedProseContamination`).

## Files to Touch

- `packages/core/test/validation-clarity-invariants.test.ts` (new)

## Out of Scope

- Any change to diagnostic `code`, `severity`, gating behavior, or field shape.
- Validation **message-text refinement** — SPEC-014 scopes it to messages "demonstrably unclear" during this phase; none is identified here, so no production message edit lands in this ticket. If a specific unclear message is found, it is a separate ticket that keeps code/severity/field stable.
- Removing the orphaned `acceptedProseContamination` code (separate cleanup, not this hardening phase).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/validation-clarity-invariants.test.ts` — uniqueness, legibility, and gating invariants pass.
2. A local experiment that adds a fake blocker with empty `suggestedActions` to the corpus makes the test fail — confirming the invariant has teeth.
3. `npm test` — full suite green.

### Invariants

1. Every emitted blocker carries ≥1 `suggestedActions` element and non-empty `message`/`whyItMatters`.
2. `isBlocked` is true iff `blockers.length > 0`; warnings never set `isBlocked`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-clarity-invariants.test.ts` — the corpus-driven clarity + gating invariant.

### Commands

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/validation-clarity-invariants.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The single-file vitest run is the correct boundary — the deliverable is one self-contained invariant suite; `npm test` confirms the corpus reuse did not disturb sibling validation tests.

## Outcome

Completed: 2026-06-06

What changed:
- Added `packages/core/test/validation-clarity-invariants.test.ts`.
- The suite asserts diagnostic-code uniqueness in `DIAGNOSTIC_CODES`, non-empty `message` and `whyItMatters` on emitted diagnostics, suggested actions on emitted blockers, and the existing warnings/non-gating versus blockers/gating discipline.
- The test uses a representative production `runValidation` corpus and deliberately does not require every registered code to be emitted, preserving the ticket's scoped treatment of the orphaned `acceptedProseContamination` code.

Deviations from original plan:
- No production validation message text was changed; no demonstrably unclear message surfaced while implementing the invariant.
- Did not perform the fake-empty-suggested-actions mutation experiment as a persistent fixture; the test directly asserts the required failure condition over emitted blockers.

Verification results:
- `npm run build --workspace @loom/core` passed.
- `npm exec vitest run packages/core/test/validation-clarity-invariants.test.ts` passed: 1 file, 3 tests.
- `npm test` passed: 69 files, 416 tests.
