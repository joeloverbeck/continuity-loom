# SPECGENBRIDRA-003: Compiler empty states for blank stop-guidance & first-segment handoff

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — modifies `EMPTY_STATE_CONSTANTS` (compiler output), bumps `compiler`/`contract` versions, updates `docs/compiler-contract.md` and compiler goldens; deliberate prompt-fingerprint change
**Deps**: None

## Problem

Once draft saving (SPECGENBRIDRA-001/-004/-005) allows blank `soft_unit_guidance` and blank first-segment `immediate_handoff`, the compiler must emit a truthful, deterministic empty state for them rather than relying on the now-removed schema guarantee that those fields are non-empty. This is the Phase-3 shared compiler seam in `specs/IMPLEMENTATION-ORDER.md` (specified by both this spec and `SPEC-validation-gating-taxonomy-and-focus-matrix.md`): the validator's decision to *not* block on blank stop guidance / first-segment handoff is only safe once the compiler has truthful empty text to render. Landing the strings here once bundles the intended fingerprint change into a single deliberate version bump.

## Assumption Reassessment (2026-06-07)

1. `EMPTY_STATE_CONSTANTS` (`packages/core/src/compiler/empty-states.ts`) already holds `soft_unit_guidance: "None specified"` (line 77) and the per-placeholder first-segment handoff defaults (`recent_causal_context`, `last_visible_moment`, `begin_after`, `prior_accepted_prose_status_or_handoff_note`). `soft_unit_guidance` is emitted via the placeholder fallback (`placeholder-map.ts:98 return () => EMPTY_STATE_CONSTANTS[placeholder]`), with no dedicated section producer; the handoff placeholders render in `sections/front.ts:88–98`. Confirmed this session — so the `soft_unit_guidance` change is a single constant edit; `front.ts` needs no change.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §Deterministic defaults → `soft_unit_guidance`, `immediate_handoff`) prescribes the exact strings and, via the in-session `/reassess-spec` reconciliation, requires this change to update `EMPTY_STATE_CONSTANTS` in place as the single deterministic authority and to record the first-segment handoff rendering decision in the compiler contract.
3. Shared boundary under audit: the prompt-section empty-state contract in `docs/compiler-contract.md` and the compiler fingerprint. This is the seam two specs share; landing it here keeps the Validation spec from re-ticketing it. Consumers of `EMPTY_STATE_CONSTANTS`: `placeholder-map.ts`, `sections/front.ts`, `sections/cast.ts`, `sections/pressure.ts`, `sections/records-tail.ts`, and the compiler tests — all read the constants generically, so a value change needs no consumer code edits, only golden/expectation updates.
4. FOUNDATIONS restated: §8 deterministic compilation — the empty-state strings are fixed compiler text, identical for identical inputs+versions. §9 universal prompt contract — the affected sections (immediate handoff, stop rule) stay present; their empty state is made truthful, not omitted. §10 — the handoff empty state asserts "No prior accepted prose," reinforcing that accepted prose is never a prompt source.
5. Deterministic-compilation surface named: this ticket changes rendered compiler output, so it changes the prompt fingerprint. Per the spec's Phase-3 risk note, bump the `compiler` (and `contract`) version in `packages/core/src/version.ts` and regenerate goldens in one deliberate step — this does not weaken the secret firewall (§15) and keeps compilation deterministic (§8).
6. First-segment handoff rendering decision (records the spec's open reconciliation so it is not re-proposed): keep the existing **per-placeholder** empty-state constants as canonical (they already render a truthful first-segment empty state via `front.ts`), and update only `soft_unit_guidance` to the spec string. `docs/compiler-contract.md` records per-placeholder rendering as canonical; the spec's single combined line is documentation-level phrasing, not a second rendering path. No backwards-compat shim is introduced.

## Architecture Check

1. Updating `EMPTY_STATE_CONSTANTS` in place (vs. adding a parallel empty-state map) preserves the single deterministic authority for placeholder empty states and confines the change to one frozen constant object plus a version bump. Keeping per-placeholder handoff rendering avoids churning four placeholders' goldens for a cosmetic combined line.
2. No backwards-compatibility aliasing/shims: the old `"None specified"` value is replaced, not aliased; no dual-authority empty-state path is introduced.

## Verification Layers

1. Blank stop-guidance empty state invariant (`EMPTY_STATE_CONSTANTS.soft_unit_guidance` === the spec string) -> codebase grep-proof + compiler section/golden test.
2. First-segment handoff truthful-empty invariant (per-placeholder constants render "no prior accepted prose / begin from current state") -> compiler-front-sections golden assertion.
3. Determinism/fingerprint invariant (output changes exactly once; version bumped; goldens regenerated to match) -> `compiler-golden.test.ts` + FOUNDATIONS §8 alignment check.
4. Contract-doc fidelity invariant (`docs/compiler-contract.md` records the new empty-state text + the per-placeholder canonical decision) -> grep-proof against the doc.

## What to Change

### 1. `packages/core/src/compiler/empty-states.ts`

- Replace `soft_unit_guidance: "None specified"` with `soft_unit_guidance: "Soft unit: No additional user narrowing; use the universal local stop rule above."`. Leave the handoff placeholder constants as-is (canonical per-placeholder rendering).

### 2. `packages/core/src/version.ts`

- Bump `versionInfo.compiler.version` and `versionInfo.contract.version` (e.g. `1.0.0` → `1.1.0`) to mark the deliberate prompt-fingerprint/contract change.

### 3. `docs/compiler-contract.md`

- Record the updated `soft_unit_guidance` empty-state text and document that the first-segment immediate-handoff empty state is rendered per-placeholder (canonical), noting the spec's single-line phrasing is descriptive.

### 4. Compiler goldens / section expectations

- Regenerate/adjust `packages/core/test/compiler-golden.test.ts` and `packages/core/test/compiler-front-sections.test.ts` expectations to the new `soft_unit_guidance` text and bumped version.

## Files to Touch

- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)

## Out of Scope

- The draft/ready schemas and normalizers (SPECGENBRIDRA-001/-002).
- The validator's blank-stop-guidance / first-segment-handoff blocking decisions (`SPEC-validation-gating-taxonomy-and-focus-matrix.md`, Phase 4).
- Any change to `sections/front.ts` rendering logic (per-placeholder rendering kept).
- Server/web/migration changes (other tickets).

## Acceptance Criteria

### Tests That Must Pass

1. `EMPTY_STATE_CONSTANTS.soft_unit_guidance` equals the spec string; a compiled prompt with blank stop guidance renders that line under the stop-rule section.
2. A compiled `first_segment` prompt with blank immediate handoff renders the truthful per-placeholder empty state (no accepted prose; begin from current state).
3. `compiler-golden.test.ts` passes against regenerated goldens reflecting the bumped `compiler`/`contract` version.
4. `npm test` passes.

### Invariants

1. Compilation stays deterministic: identical inputs + bumped versions produce identical output; the fingerprint changes exactly once for this deliberate bump (§8).
2. No universal-prompt-contract section is omitted; the stop-rule and immediate-handoff sections remain present with truthful empty states (§9).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-golden.test.ts` (modify) — regenerate golden(s) for the new empty-state text + version bump.
2. `packages/core/test/compiler-front-sections.test.ts` (modify) — assert first-segment handoff and blank stop-guidance empty-state rendering.

### Commands

1. `npm test --workspace @loom/core` — targeted compiler golden + section tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate (fingerprint/version coherence across the build).
