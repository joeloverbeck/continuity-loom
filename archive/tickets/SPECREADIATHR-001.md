# SPECREADIATHR-001: Core readiness model, diagnostic types, and `deriveReadiness`

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/core/src/validation/readiness.ts` (the `GenerationReadiness` / `ReadinessDiagnostic` / `AffectedTarget` types, the `deriveReadiness` adapter, and the per-code author-facing copy table); barrel export from `packages/core/src/index.ts`. No change to existing validator rules or emitted `Diagnostic` codes.
**Deps**: None

## Problem

The three generation pages each interpret raw `ValidationResult` independently and render `diagnostic.code` as the primary clickable label (`packages/web/src/generation-brief/ValidationResultView.tsx:68`). The spec requires a single derived readiness model — author-facing checklist first, raw codes in a technical expander — shared by all three pages. The core, framework-free derivation (`deriveReadiness`) plus the diagnostic copy model is the foundation every later ticket consumes; it must exist before the server route (SPECREADIATHR-002) and the UI (003–006).

## Assumption Reassessment (2026-06-07)

1. The validator already emits `Diagnostic { severity, code, message, affected, whyItMatters, suggestedActions }` and `ValidationResult { blockers, warnings, isBlocked }` from `packages/core/src/validation/types.ts`; `DIAGNOSTIC_CODES` is the frozen code registry there. `deriveReadiness` consumes these unchanged — this ticket adds a presentation layer, it does not re-run or alter validation.
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Derivation from the existing validator `Diagnostic`, §Diagnostic copy model, §Shared route/model recommendation) sites `deriveReadiness` at `packages/core/src/validation/readiness.ts`, **distinct** from the existing `packages/core/src/records/generation-brief-readiness.ts`, which is the unrelated draft→ready *normalizer* (`normalizeGenerationSessionForReadiness`). Confirmed both files are different concerns; no collision (`test -f` shows `validation/readiness.ts` does not yet exist).
3. Cross-artifact boundary under audit: the `Diagnostic` → `ReadinessDiagnostic` mapping contract defined in the spec's derivation table. The author-facing `code` slug is distinct from `technical.legacyCode` (the real emitted `Diagnostic.code`); the per-code copy table is keyed by the validator code. This boundary is owned here and consumed by SPECREADIATHR-002/003.
4. FOUNDATIONS principle restated before trusting the spec: §11 — warnings are advisory and must never gate; only blockers gate. §4.4/§8 — deterministic compilation; this module is a pure transform with no LLM, wall-clock, or hidden state, so identical inputs produce identical `GenerationReadiness`.
5. Deterministic-compilation / secret-firewall surface: `deriveReadiness` is pure and must stay within the `@loom/core` purity boundary (no `node:*`, `fastify`, `react`, `vite` imports — enforced by ESLint `no-restricted-imports` and the core boundary test). It carries only diagnostics and an injected `recordId→displayLabel` map; it performs no repository access and introduces no secret or payload path (secrets/payload exclusion is enforced downstream at the server route, SPECREADIATHR-002).
6. Schema derived-from: the consumed output schema is the validator `Diagnostic`/`ValidationResult`. The change is additive — new types and a new function; the existing `Diagnostic` shape and `DIAGNOSTIC_CODES` are untouched. Consumers of the new types are the server readiness adapter (002) and the shared checklist component (003), both later in this batch.

## Architecture Check

1. A pure core adapter keeps the readiness contract framework-free and unit-testable in isolation, and lets the server route and all three pages share one deterministic interpretation instead of three divergent client-side reinterpretations of raw `ValidationResult`. Display labels are injected as data (a `ReadonlyMap<string,string>`) rather than fetched, preserving core purity while still satisfying the "resolve display labels" requirement.
2. No backwards-compatibility aliasing or shims: `deriveReadiness` is net-new; the existing `Diagnostic`/`ValidationResult` types are reused as-is, not forked.

## Verification Layers

1. Determinism (identical `result` + `providerState` + `draftState` + `labels` → identical `GenerationReadiness`) -> unit test in `packages/core/test/readiness.test.ts`.
2. Every `ReadinessDiagnostic.technical.legacyCode` equals its source `Diagnostic.code` -> unit test asserting the mapping for each example code.
3. Warnings never set `canPreview` / `canGenerate` (§11) -> unit test feeding warning-only `ValidationResult` and asserting both remain `true` (FOUNDATIONS alignment check).
4. An unmapped `Diagnostic.code` degrades to a deterministic default (raw code as title, `technical-diagnostics` group) rather than throwing -> unit test with a synthetic code.
5. Core purity (no LLM / node / fetch / wall-clock) -> codebase grep-proof: `grep -nE "node:|fastify|react|Date\.now|Math\.random|fetch\(" packages/core/src/validation/readiness.ts` returns nothing.

## What to Change

### 1. New module `packages/core/src/validation/readiness.ts`

Define the spec's types verbatim in shape: `GenerationReadiness` (`status`, `canSaveDraft`, `canPreview`, `canGenerate`, `blockers`, `warnings`, `provider`, `unsavedDraft`, `summary`), `ReadinessDiagnostic`, `AffectedTarget`, `DiagnosticAction`, and the four-value group union. Implement:

- `deriveReadiness(result: ValidationResult, providerState: { configured: boolean }, draftState: { hasUnsavedChanges: boolean }, labels: ReadonlyMap<string, string>): GenerationReadiness`.
- Mapping per the spec's derivation table: `Diagnostic.code → technical.legacyCode`/`ruleId`; `affected[].field → technical.rawPaths`; `affected[].recordId` enriched with `labels.get(recordId)` as `displayLabel`; `suggestedActions` + nav target → `actions`.
- A per-code copy table keyed by validator `Diagnostic.code`, supplying author-facing `code` slug, `title`, `group`, `whyItMatters`, `fastestFix`, and the optional `whenItBecomesBlocking` / `whyThisIsNotBlocking` / `ignoringIsReasonableWhen`. Seed it with the four codes the spec grounds: `missing-manual-directive`, `missing-immediate-handoff`, `local-prose-scope-violation`, `cast-salience-risk` (plus the other emitted blocker/warning codes in `DIAGNOSTIC_CODES`).
- Deterministic fallback for any code with no copy-table entry: raw code as `title`, `technical-diagnostics` group, severity-derived placement.
- `status` derivation: `draft` (malformed/no-project handled upstream), `blocked` (any blocker), `ready-with-warnings` (warnings only), `ready` (clean); `canSaveDraft` always `true`; `canPreview`/`canGenerate` driven only by blockers (+ provider for generate); grouping/dedup so per-record salience warnings collapse to one entry listing multiple affected targets.

### 2. Barrel export `packages/core/src/index.ts`

Export `deriveReadiness` and the new types alongside the existing `DIAGNOSTIC_CODES` / `runValidation` exports.

## Files to Touch

- `packages/core/src/validation/readiness.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/readiness.test.ts` (new)

## Out of Scope

- The server `/api/readiness` route and web `api.ts` client (SPECREADIATHR-002).
- Any UI rendering of the readiness model (SPECREADIATHR-003–006).
- Changing validator rules, emitted codes, or requiredness — owned by the landed `archive/specs/SPEC-validation-gating-taxonomy-and-focus-matrix.md`.
- Doc amendments (FOUNDATIONS / schema / compiler-contract / user-guide) — `cross-spec: SPEC-foundational-doc-amendments-for-generation-readiness` (Phase 7).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/core/test/readiness.test.ts` — covers determinism, legacy-code mapping, warning-only non-gating, and unmapped-code fallback.
2. `npm run typecheck` — strict TS across packages with the new types and barrel export.
3. `npm run lint` — passes, including the `@loom/core` import-boundary rule on the new module.

### Invariants

1. `deriveReadiness` is a pure deterministic transform: no `node:*`/`fastify`/`react` import, no `Date.now()`/`Math.random()`/`fetch`, no repository access.
2. `canSaveDraft` is always `true`; warnings never set `canPreview` or `canGenerate`; every `ReadinessDiagnostic` carries `technical.legacyCode` equal to its source `Diagnostic.code`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/readiness.test.ts` — new: determinism (same inputs → deep-equal output), legacy-code linkage per seeded code, warning-only state stays `ready-with-warnings` with `canPreview`/`canGenerate` true, blocker state sets `blocked`, unmapped-code fallback, display-label enrichment from the injected map, grouped salience warning lists multiple affected targets.

### Commands

1. `npm test -- packages/core/test/readiness.test.ts`
2. `npm run typecheck && npm run lint`
3. Targeted core test is the correct boundary because this ticket adds pure core logic with no server/UI surface; the full pipeline is exercised by the SPECREADIATHR-007 capstone.

## Outcome

Completed: 2026-06-08

What changed:

- Added `packages/core/src/validation/readiness.ts` with the pure `deriveReadiness` adapter, readiness/checklist types, seeded author-facing copy for the grounded diagnostic examples, deterministic fallback copy, provider-state gating, unsaved-draft stale state, display-label enrichment, and warning grouping.
- Exported the new readiness function and types from `packages/core/src/index.ts`.
- Added `packages/core/test/readiness.test.ts` covering determinism, legacy-code preservation, warning-only non-gating, blocker gating, provider gating, fallback behavior, display labels, grouped cast-salience warnings, and unsaved draft state.

Deviations from original plan:

- None. Server route and UI wiring remain out of scope for later tickets.

Verification:

- `npm test -- packages/core/test/readiness.test.ts` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `rg -n "node:|fastify|react|Date\\.now|Math\\.random|fetch\\(" packages/core/src/validation/readiness.ts` — no matches.
