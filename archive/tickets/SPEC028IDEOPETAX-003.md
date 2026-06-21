# SPEC028IDEOPETAX-003: Ideation taxonomy regression capstone, dense-working-set breadth fixture, and completion bookkeeping

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds a new end-to-end ideation-taxonomy regression test file (including the dense-working-set breadth fixture); updates the `docs/ACTIVE-DOCS.md` version note and archives the spec; no production behavior change
**Deps**: `archive/tickets/SPEC028IDEOPETAX-001.md`, `archive/tickets/SPEC028IDEOPETAX-002.md`

## Problem

SPEC-028 §Verification lists ~11 deterministic regression properties that must hold across the full ideation taxonomy change, plus a **dense-working-set** golden/property fixture (proposal §5.4) confirming the interleaved fixed operator order gives acceptable breadth on the default `count: 5` dense slate (Risk 4 — fixed-order bias). Tickets 001/002 cover these per-surface; this capstone exercises them end-to-end as one suite, adds the breadth fixture, and performs end-of-change bookkeeping (the `docs/ACTIVE-DOCS.md` version note for the bumped triple and archiving the now-implemented spec per `docs/archival-workflow.md`).

## Assumption Reassessment (2026-06-21)

1. **Upstream surfaces exist after 001/002** — the new operator set + slot-assignment algorithm (`packages/core/src/compiler/ideation/*`), the EMOTION/ENTITY STATUS keys (`sections/pressure.ts`, `sections/records-tail.ts`), the distinctness constant (`template-constants.ts`), the regenerated `golden-ideation.prompt.txt`, and the bumped `version.ts` triple are all present once Deps land. This ticket adds no production logic; it exercises them.
2. **Spec authority** — SPEC-028 §Verification (the regression-property list) is the capstone's acceptance source; §Risks 4 motivates the dense-working-set fixture. `docs/ACTIVE-DOCS.md:161` carries the human-readable version note ("template is 1.2.0, compiler is 1.4.0, contract is 1.5.0") that must move to `1.3.0 / 1.5.0 / 1.6.0`. `docs/archival-workflow.md` governs the spec move (`specs/` → `archive/specs/`, status flip, Outcome section).
3. **Cross-artifact boundary under audit** — the end-to-end ideation prompt-compilation contract: a clean ideation-ready snapshot yields a deterministic grounded ideation prompt whose slates satisfy every §Verification property; this capstone is the single place exercising the composed pipeline.
4. **FOUNDATIONS principle restated** — §4.4/§8/§29.4: the suite asserts determinism (identical snapshot+request+versions → byte-identical prompt), no eviction (all selected records render), and no model judgment; it changes no production behavior, exercising the surfaces in a test sandbox only.
5. **Enforcement surface (test-armoring)** — this is a test-only + bookkeeping ticket pinning the existing (post-001/002) deterministic-compilation surface; confirmed it modifies no production code and introduces no behavior change, only assertions and doc/archival edits.
6. **Adjacent contradiction** — none. The §8-bound authority docs (`compiler-contract.md`, `ideation-prompt-template.md`) co-landed in 001/002; only the non-§8 `docs/ACTIVE-DOCS.md` registry note and the spec archival remain, which correctly belong in this trailing ticket.
7. **Mismatch + correction** — the new capstone test file `packages/core/test/ideation-taxonomy-capstone.test.ts` does not exist yet (`test ! -f` confirmed) and is created here `(new)`; `archive/specs/SPEC-028-…md` does not exist yet (the archival target).

## Architecture Check

1. A single trailing capstone is cleaner than scattering the end-to-end §Verification properties and the breadth fixture across the implementation tickets: it re-enumerates expected slate composition from a fixture at test start (no hardcoded counts), proving the *composed* pipeline rather than any one surface, and co-locates the completion bookkeeping gated on the suite passing. Per the decomposition capstone + completion-bookkeeping patterns.
2. No backwards-compatibility aliasing or shims: the ticket adds assertions and moves/annotates docs; it introduces no production logic and no compatibility layer.

## Verification Layers

1. End-to-end regression properties (minimum bundle per slot, no operator-id repeat, no avoidable ground repeat, `commit_at_a_cost` two-family, locked-secret-no-cue cannot reveal, stale statuses create no slot, dormant oldest-viable-or-shrink, all records render, schema + `IDEATION_SECTION_ORDER` unchanged) → `ideation-taxonomy-capstone.test.ts` sub-cases.
2. Dense-working-set breadth: the default `count: 5` + `dormantSlot: true` dense slate draws interleaved breadth, not the historical list head → dense-working-set fixture property in the capstone.
3. Version note + archival landed → codebase grep-proof on `docs/ACTIVE-DOCS.md` (`1.3.0`/`1.5.0`/`1.6.0`) + `test -f archive/specs/SPEC-028-…md` and `test ! -f specs/SPEC-028-…md`.

## What to Change

### 1. Capstone regression suite + dense-working-set fixture

Add `packages/core/test/ideation-taxonomy-capstone.test.ts` exercising the SPEC-028 §Verification properties end-to-end against representative ideation-ready snapshots, re-enumerating expected slate composition from each fixture at test start. Include the dense-working-set fixture (a dense selected set spanning many pressure families) asserting the default slate draws breadth across interleaved operators and that the dormant slot carries a real unused operator (or the slate shrinks).

### 2. ACTIVE-DOCS version note

Update the version-triple note in `docs/ACTIVE-DOCS.md` to `template 1.3.0 / compiler 1.5.0 / contract 1.6.0`.

### 3. Archive the spec

Per `docs/archival-workflow.md`: flip the spec Status to COMPLETED, add an Outcome section (completion date, what changed across 001-003, version bump, golden re-baseline, verification results), then `git mv specs/SPEC-028-ideation-operator-taxonomy-distinctness-and-comprehensiveness.md archive/specs/`.

## Files to Touch

- `packages/core/test/ideation-taxonomy-capstone.test.ts` (new)
- `docs/ACTIVE-DOCS.md` (modify)
- `specs/SPEC-028-ideation-operator-taxonomy-distinctness-and-comprehensiveness.md` (modify) → moved to `archive/specs/SPEC-028-ideation-operator-taxonomy-distinctness-and-comprehensiveness.md`

## Out of Scope

- Any production code change to the operator taxonomy, eligibility, bundles, dormancy, citation keys, or distinctness rule (tickets 001/002) — this ticket is verification + bookkeeping only.
- The §8-bound authority docs (`docs/compiler-contract.md`, `docs/ideation-prompt-template.md`) — co-landed in 001/002, not re-touched here.
- The offline adversarial semantic-distinctness evaluation corpus (must not become runtime model judgment).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/test/ideation-taxonomy-capstone.test.ts` — every §Verification regression property holds; the dense-working-set slate shows interleaved breadth.
2. `grep -q "1.3.0" docs/ACTIVE-DOCS.md && grep -q "1.6.0" docs/ACTIVE-DOCS.md` — version note updated; `test -f archive/specs/SPEC-028-ideation-operator-taxonomy-distinctness-and-comprehensiveness.md && test ! -f specs/SPEC-028-ideation-operator-taxonomy-distinctness-and-comprehensiveness.md` — spec archived.
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. The capstone re-enumerates expected counts from fixtures at test start (no hardcoded slate counts that go stale).
2. No production behavior change: the suite mutates the compilation surface in a test sandbox only; runtime output is identical to the post-002 tree.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-taxonomy-capstone.test.ts` — new end-to-end regression suite + dense-working-set breadth fixture covering the SPEC-028 §Verification list.

### Commands

1. `npx vitest run packages/core/test/ideation-taxonomy-capstone.test.ts`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. The grep/`test -f` checks in Acceptance are the correct boundary for the docs-note + archival bookkeeping, which carry no test-runnable assertion of their own.

## Outcome

Completed: 2026-06-21

Added `packages/core/test/ideation-taxonomy-capstone.test.ts`, covering the composed SPEC-028 ideation taxonomy behavior: dense default breadth, dormancy as a real-operator modifier, minimum bundle sizes, unused-first grounds, two-family commitment, fail-closed reveal/status edges, deterministic prompt output, section order, and no selected-record eviction. Updated `docs/ACTIVE-DOCS.md` to the new version note: template `1.3.0`, compiler `1.5.0`, contract `1.6.0`.

Verification:
- `npx vitest run packages/core/test/ideation-taxonomy-capstone.test.ts` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- First `npm test` run passed the capstone but hit one unrelated `GenerationBriefView.test.tsx` mock-call assertion; rerunning that file passed, and the required broad rerun passed: 158 test files, 1674 tests.
- `npm run build` passed. Vite reported the existing non-failing large chunk warning.
- `grep -q "1.3.0" docs/ACTIVE-DOCS.md` passed.
- `grep -q "1.6.0" docs/ACTIVE-DOCS.md` passed.

Browser smoke rationale: not run for this capstone because it is test-only and documentation/archive bookkeeping; no browser-facing UI flow or request shape changed beyond the already-covered prompt-rendering surfaces.
