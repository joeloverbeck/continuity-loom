# SPEC021GROIDEPRO-004: Kind-aware validation readiness (relaxed ideation gate, still fail-closed)

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `deriveReadiness` becomes prompt-kind aware via a new per-kind blocker-applicability map; `docs/validation-rule-inventory.md` gains an ideation-applicability column; new readiness tests. Prose readiness is unchanged.
**Deps**: SPEC021GROIDEPRO-002 (imports the `PromptKind` type)

## Problem

Ideation must stay fail-closed but with a relaxed blocker set: a contradictory or impossible state should still block ideation (ideas from broken state are garbage), and provider/content-policy misconfiguration must still block sending — but prose-launch requirements that have no ideation function (missing manual directive, prose-mode/local-mode completeness, voice-pressure, stop-guidance) must not block ideation. This ticket threads `promptKind` through readiness and adds a single-sourced applicability map (rule code → applies-to kinds) so the rule inventory stays one source of truth instead of forking rule logic. No LLM in validation; no override (§4.5/§11).

## Assumption Reassessment (2026-06-12)

1. **Readiness shape confirmed.** `deriveReadiness(result, providerState, draftState, labels): GenerationReadiness` (`packages/core/src/validation/readiness.ts:202`) computes `const blockers = groupDiagnostics(result.blockers.map(...))`, then `canPreview = blockers.length === 0` and `canGenerate = canPreview && providerBlockers.length === 0` (lines ~208–212). Each diagnostic carries a `.code`. Provider blockers come from `providerState.configured` independently of record blockers. The kind filter attaches at the `result.blockers` → `blockers` step.
2. **Rule inventory is the classification source.** `docs/validation-rule-inventory.md` (domain authority for the implemented validation-rule inventory) enumerates every diagnostic code and its severity; `packages/core/src/validation/rules/index.ts:15` is the frozen rule array. The one-severity-per-code model (enforced by `packages/core/test/validation-rule-inventory.test.ts`) is **untouched** — this ticket adds an *applicability* dimension (which kinds a blocker applies to), not a severity, so no code resolves to two severities.
3. **Cross-artifact boundary under audit:** the applicability map is the shared contract between the rule inventory (doc), readiness (code), and the server's kind-aware gate (005 calls `deriveReadiness` with a `promptKind`). It lives in one module (`kind-applicability.ts`) keyed on the existing `DIAGNOSTIC_CODES`, so a new rule added later defaults to "applies to all kinds" unless explicitly scoped prose-only.
4. **FOUNDATIONS principle restated:** §4.5 / §11 fail-closed, no override in v1 — ideation keeps the deterministic blocking gate; the relaxation removes *only* prose-launch requirements that have no ideation function. §29.5 — ideation still cannot generate from contradictory state or under unsafe provider/policy config. Warnings never block either kind.
5. **Fail-closed validation surface (the enforcement gate under audit):** confirm the change does not weaken the gate — hard contradictions (two current locations, two holders, state-vs-handoff conflict, secret hidden-and-revealed), structural snapshot failures, and provider/content-policy blockers continue to gate compile/preview/send for ideation; only the prose-launch-only codes (e.g. `missing-launch-directive`, prose-mode/local-mode completeness, voice-pressure, `stop-guidance-nonlocal`) are filtered out for the ideation kind. No LLM in validation; no override path is added. The exact prose-only code set is read off `docs/validation-rule-inventory.md` at implementation, not guessed.

## Architecture Check

1. A per-kind applicability map (`code → Set<PromptKind>`) consulted at the single `result.blockers` filter point is cleaner than forking each rule or duplicating readiness: rules stay single-sourced, the relaxation is auditable as data, and a new rule is automatically prose+ideation unless deliberately scoped. It mirrors the existing single-source `DIAGNOSTIC_CODES` / inventory pattern.
2. No backwards-compatibility shims: `deriveReadiness` gains a `promptKind` parameter defaulting to `"prose"`, so all existing callers and tests are unchanged; no parallel readiness path.

## Verification Layers

1. A hard-contradiction fixture blocks ideation (relaxed gate still fails closed) → `validation-ideation-readiness.test.ts`.
2. A missing-manual-directive fixture blocks prose but NOT ideation → same test (asserts `canPreview` true for ideation, false for prose on identical input).
3. Warnings never block either kind → same test (warning-only fixture → `canPreview` true for both).
4. Provider-missing still gates ideation send → same test (`canGenerate` false when provider unconfigured, even for ideation).
5. Every blocker code is mapped (no code silently absent from the applicability map → it would default-apply, which is correct, but the inventory column must be complete) → grep/assert that `docs/validation-rule-inventory.md` has an ideation-applicability entry per code, cross-checked against `DIAGNOSTIC_CODES`.

## What to Change

### 1. Per-kind applicability map

`packages/core/src/validation/kind-applicability.ts` (new): `blockerApplies(code: string, kind: PromptKind): boolean`, backed by a map of the prose-only codes (the prose-launch requirement set). Default: a code applies to all kinds; codes in the prose-only set do not apply to `"ideation"`. Provider/policy blockers are kind-independent and always apply.

### 2. Thread promptKind through readiness

`packages/core/src/validation/readiness.ts` (modify): `deriveReadiness(result, providerState, draftState, labels, promptKind: PromptKind = "prose")`. When `ideation`, filter `result.blockers` through `blockerApplies(code, "ideation")` before computing `canPreview`. Provider gating and warnings logic unchanged.

### 3. Inventory applicability column

`docs/validation-rule-inventory.md` (modify): add an ideation-applicability column (applies / prose-only) for every diagnostic code, in the same change (the inventory's same-change drift rule).

## Files to Touch

- `packages/core/src/validation/kind-applicability.ts` (new)
- `packages/core/src/validation/readiness.ts` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/validation-ideation-readiness.test.ts` (new)

## Out of Scope

- The ideation compile path / section templates — SPEC021GROIDEPRO-003.
- The server route that *calls* `deriveReadiness` with a kind and gates `/api/ideate` — SPEC021GROIDEPRO-005.
- Any new diagnostic code or severity change — this ticket adds only an applicability dimension.
- Adding an override path — there is no override in v1 (§4.5).

## Acceptance Criteria

### Tests That Must Pass

1. `packages/core/test/validation-ideation-readiness.test.ts` — contradiction blocks ideation; missing-directive blocks prose but not ideation; warning-only blocks neither; provider-missing gates ideation send.
2. Existing readiness/validation suites (`validation.test.ts`, `readiness-cross-page.test.tsx`, `validation-rule-inventory.test.ts`) pass unchanged (prose readiness and one-severity-per-code intact).
3. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

### Invariants

1. Ideation readiness is a strict relaxation of prose readiness: every blocker that applies to ideation also applies to prose; ideation drops only the prose-launch-only codes; provider/policy and hard-contradiction blockers apply to both.
2. Validation remains deterministic, blocking, LLM-free, and override-free; warnings never gate either kind.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-ideation-readiness.test.ts` (new) — the four relaxed-gate behaviors above, on shared fixtures toggled only by `promptKind`.

### Commands

1. `npm test -- validation-ideation-readiness`
2. `npm test -- validation-rule-inventory readiness` — proves the one-severity-per-code model and prose readiness are untouched.
3. `npm test && npm run typecheck && npm run lint && npm run build`
