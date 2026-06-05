# SPEC006DETVALENG-001: Core validation foundation — snapshot, Diagnostic/ValidationResult, code catalogue, engine shell

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` `validation/` module (snapshot type + constructor, `Diagnostic`/`ValidationResult` types, stable diagnostic-code catalogue, rule-dispatch engine, rule barrel); new public exports in `packages/core/src/index.ts`.
**Deps**: None

## Problem

SPEC-006 requires a pure, deterministic, fail-closed validation engine in `@loom/core` that all later rule tickets, the `/api/validate` route, and the web panel build on. Before any rule can be written there must be: an explicit immutable snapshot type the engine reads, the `Diagnostic`/`ValidationResult` data contract, a stable diagnostic-code catalogue, and an orchestration shell that runs registered rules, stable-sorts the output, and derives `isBlocked`. This ticket establishes that foundation and its public surface so rule families (002–008) and consumers (009–010) attach to a stable contract.

## Assumption Reassessment (2026-06-05)

1. No `validation/` module exists in `@loom/core`: `packages/core/src/validation/` is absent (`test -e` → absent); `packages/core/src/index.ts` exports records/version only (no `Diagnostic`/`ValidationResult`/`runValidation`). Existing record types and the generation session live in `packages/core/src/records/` (`registry.ts` 21-type registry; `generation-brief.ts` `generationSessionSchema` with 8 surfaces).
2. The binding contract is `docs/compiler-contract.md` §5–§6 and `docs/requirements-version-1/VALIDATION-ENGINE.md` ("Diagnostic message requirements", "Data/logic implications"); SPEC-006 §Approach "`@loom/core` — the pure deterministic engine" defines the snapshot inputs (resolved selected-record payloads + cast bands + 8 brief surfaces + 3 story-config singletons + template/compiler version identifiers) and `ValidationResult` shape `{ blockers, warnings, isBlocked }` with `isBlocked === blockers.length > 0`.
3. Shared boundary under audit: the `ValidationSnapshot` type and the rule-dispatch contract (`ValidationRule` signature + the `validation/rules` barrel array). Every downstream rule ticket (002–008) appends to this barrel and consumes this snapshot; the server route (009) constructs the snapshot. The contract must be additive (append-only rule list) so siblings do not collide beyond an append.
4. FOUNDATIONS §4.4/§8 (deterministic compilation preconditions): given identical inputs the engine must produce identical output. Mechanism: the engine reads only the snapshot (no wall-clock, no I/O, no `Math.random`), iterates an insertion-ordered rule array, and stable-sorts diagnostics by `(code, affected-ref)` before returning.
5. Fail-closed/deterministic surface named: this module IS the fail-closed gatekeeper (§4.5/§11) that later phases (Phase 8 preview, Phase 9 send) consume. It performs no record mutation, no LLM call, and no record selection (§29.4/§29.5). The snapshot carries already-resolved payloads (the server owns ID→payload resolution, SPEC-006 §Risks "Snapshot resolution boundary"), keeping `@loom/core` free of I/O and preserving the `node:*`/framework boundary enforced by `packages/core/test/boundary.test.ts`.
6. Mismatch + correction: SPEC-006 (post-reassessment) snapshots **template + compiler** version identifiers only — `VersionInfo` (`packages/core/src/version.ts`) exposes `app`/`templates.version`/`compiler.version` (both `"placeholder"`/`"0.0.0"`); there is no `contract` version key. The snapshot type uses `templates.version` + `compiler.version`; a distinct compiler-contract version is folded into the compiler version for v1.

## Architecture Check

1. A snapshot-in / result-out pure function with an append-only rule registry mirrors the existing `recordTypeRegistry` pattern (`packages/core/src/records/registry.ts`): each rule family is an isolated module contributing to one frozen array, so rule tickets are independently reviewable and the engine stays a thin deterministic orchestrator. Alternatives (one monolithic validate function, or per-rule exported functions wired by the server) were rejected — the first is unreviewable, the second leaks rule orchestration out of `@loom/core`.
2. No backwards-compatibility aliasing/shims: this is net-new surface; no prior validation API exists to alias.

## Verification Layers

1. Determinism (identical snapshot → byte-identical stable-sorted result) -> schema validation + unit test asserting repeated `runValidation` calls deep-equal and ordering is stable by `(code, affected)`.
2. `isBlocked === blockers.length > 0` invariant -> unit test over synthetic diagnostics (blocker present/absent).
3. Purity boundary (no `node:*`/`fastify`/`react`/`vite`) -> codebase grep-proof via existing `packages/core/test/boundary.test.ts` staying green.
4. Public API exported -> codebase grep-proof: `grep -n "runValidation\|ValidationResult\|buildValidationSnapshot" packages/core/src/index.ts`.

## What to Change

### 1. New `validation/` module in `@loom/core`

- `packages/core/src/validation/types.ts` — `Severity = "blocker" | "warning"`; `SuggestedAction` union (revise, remove, deselect, add-current-state, add-route, add-knowledge-constraint, add-reveal-permission, promote-cast, add-voice-or-body-pressure, change-directive, change-stop-guidance); `Diagnostic` (`severity`, `code`, `message`, `affected: { recordId?: string; field?: string }[]`, `whyItMatters`, `suggestedActions: SuggestedAction[]`); `ValidationResult` (`{ blockers: Diagnostic[]; warnings: Diagnostic[]; isBlocked: boolean }`); `DIAGNOSTIC_CODES` stable catalogue (frozen const object) — seed the entries this ticket needs and let later tickets extend the catalogue object additively.
- `packages/core/src/validation/snapshot.ts` — `ValidationSnapshot` type (resolved selected-record payloads + cast-band assignments, the 8 brief surfaces, the 3 story-config singletons, template + compiler version identifiers) and `buildValidationSnapshot(input): ValidationSnapshot` — a pure constructor that freezes/normalizes already-loaded inputs into a stable, order-normalized snapshot (sort record arrays by id) so determinism does not depend on caller ordering.
- `packages/core/src/validation/rules/types.ts` — `ValidationRule = (snapshot: ValidationSnapshot) => Diagnostic[]`.
- `packages/core/src/validation/rules/index.ts` — `export const validationRules: readonly ValidationRule[] = Object.freeze([])` (empty barrel; tickets 002–008 append their rule spreads here).
- `packages/core/src/validation/engine.ts` — `runValidation(snapshot): ValidationResult` — runs every rule in `validationRules`, partitions diagnostics by severity, stable-sorts each partition by `(code, then JSON of affected refs)`, sets `isBlocked = blockers.length > 0`.

### 2. Public exports

- `packages/core/src/index.ts` — add `export { runValidation } from "./validation/engine.js";`, `export { buildValidationSnapshot } from "./validation/snapshot.js";`, and `export type { Diagnostic, ValidationResult, ValidationSnapshot, Severity, SuggestedAction } from ...`, plus `DIAGNOSTIC_CODES`.

## Files to Touch

- `packages/core/src/validation/types.ts` (new)
- `packages/core/src/validation/snapshot.ts` (new)
- `packages/core/src/validation/rules/types.ts` (new)
- `packages/core/src/validation/rules/index.ts` (new)
- `packages/core/src/validation/engine.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/validation.test.ts` (new)

## Out of Scope

- Any concrete validation rule (universal completeness, blockers, matrix rows, warnings, key safety) — tickets 002–008.
- The `/api/validate` route and snapshot resolution from the repository — ticket 009 (server owns ID→payload resolution).
- The web panel — ticket 010.
- Result caching / cache invalidation — SPEC-006 §Out of Scope (allowed later as an optimization).

## Acceptance Criteria

### Tests That Must Pass

1. `runValidation` on a snapshot with no registered-rule output returns `{ blockers: [], warnings: [], isBlocked: false }`.
2. With synthetic diagnostics injected via a test-only rule: `isBlocked` is `true` iff ≥1 blocker; warnings never set `isBlocked`; repeated runs produce deep-equal, stable-sorted results.
3. `npm test -- validation` (core builds first, the new test passes) and `packages/core/test/boundary.test.ts` stays green.

### Invariants

1. The engine reads only the snapshot — no I/O, no `Date`/`Math.random`, no record mutation, no LLM call.
2. `ValidationResult.isBlocked === (blockers.length > 0)` always; diagnostics are stable-sorted by `(code, affected)`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation.test.ts` — engine shell, snapshot constructor normalization, determinism/stable-sort, `isBlocked` derivation, structural no-mutation assertion.

### Commands

1. `npm test -- validation`
2. `npm run typecheck && npm run lint && npm test && npm run build`
3. Targeted boundary re-check: `npm test -- boundary` (confirms the new module imports no `node:*`/framework).
