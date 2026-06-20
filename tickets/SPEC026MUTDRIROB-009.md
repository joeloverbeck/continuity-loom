# SPEC026MUTDRIROB-009: Add P1 metamorphic and contamination properties; run full prose campaign

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — adds prose-compiler metamorphic + context-firewall property tests and completes the full P1 mutation campaign; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md, archive/tickets/SPEC026MUTDRIROB-005.md, archive/tickets/SPEC026MUTDRIROB-006.md, archive/tickets/SPEC026MUTDRIROB-007.md, archive/tickets/SPEC026MUTDRIROB-008.md

## Problem

Beyond per-module branches, the prose compiler must satisfy whole-prompt relations (snapshot-permutation invariance, repeatability, deep-freeze purity, optional-section behavior) and the §10 context firewall (no accepted/rejected/superseded/auto-derived prose and no author-private notes in the prompt). A surviving contamination mutant would leak forbidden text into the prompt — a FOUNDATIONS hard-fail surface — while staying green. This ticket adds those properties at the nearest real data boundary and runs/classifies the full P1 campaign, completing P1.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/compile-prompt.ts` (orchestrator) and the section/placeholder/ordering modules exist (confirmed this session); the existing accepted-prose exclusion coverage is the baseline this ticket strengthens.
2. SPEC-026 §Deliverables B5 + report §6.3.C/E define the required relations (permutation invariance, repeatability, deep-freeze, optional-section, real-boundary canaries for accepted/rejected/superseded/auto-summary/author-private notes); FOUNDATIONS §10 (context firewall) and §29.12 (author-private notes firewall) are the governing invariants.
3. Cross-artifact boundary under audit: the canaries must be placed at the **nearest real data boundary** — do not invent new compiler parameters to inject forbidden data; where a forbidden source cannot reach core directly, note the deferred S1 snapshot-boundary pin (out of scope here).
4. FOUNDATIONS principle restated: §10 — accepted prose, rejected/superseded candidates, and automatic prose-derived summaries are **not** prompt context; §29.12 — author-private notes never enter compiler authority. Properties assert their absence without adding any note/prose field to the compiler.
5. Deterministic-compilation + firewall surfaces (§8, §10): the campaign mutates the whole prose compiler in the sandbox only. A surviving contamination mutant that reflects a real leak is a CRITICAL behavior-fix ticket, not a test relaxation.

## Architecture Check

1. Whole-prompt metamorphic relations + boundary canaries catch cross-section mutants that per-module tests cannot (e.g. a contamination path through the orchestrator); they are named tests, not anonymous loops, so a failure documents which relation broke.
2. No backwards-compatibility shims; no new compiler parameter is added to inject forbidden data — canaries ride the real data path.

## Verification Layers

1. Metamorphic relations -> properties: snapshot-permutation invariance (bytes + metadata), repeatability (two compilations byte-identical), deep-freeze purity (no input mutation), optional-section behavior.
2. Context firewall -> unique canaries at the real data boundary for accepted prose, rejected/superseded candidates, auto-summaries, and author-private notes; assert none appears in the prompt.
3. Full P1 adequacy -> `npm run mutation:prose` across the entire P1 glob meets the configured break floor and reports zero unclassified survivors.

## What to Change

### 1. Metamorphic + contamination properties

Add `packages/core/test/compiler-prose-metamorphic.property.test.ts`: permutation-invariance, repeatability, deep-freeze, and optional-section relations over generated deep-frozen valid snapshots (self-contained snapshot/defect generators in `packages/core/test/support/arbitraries/prose-snapshots.ts`). Add `packages/core/test/compiler-context-firewall.test.ts`: unique canaries placed at the nearest real data boundary for accepted prose, rejected candidates, superseded candidates, auto/prose-derived summaries, and author-private notes; assert none reaches the prose prompt.

### 2. Full P1 campaign

Run `npm run mutation:prose` across the entire P1 glob; classify every survivor per the survivor protocol. Record the reviewed P1 score for the baseline (consumed by SPEC026MUTDRIROB-022). Any contamination/contract defect → CRITICAL behavior-fix ticket.

## Files to Touch

- `packages/core/test/compiler-prose-metamorphic.property.test.ts` (new)
- `packages/core/test/compiler-context-firewall.test.ts` (new)
- `packages/core/test/support/arbitraries/prose-snapshots.ts` (new) — self-contained snapshot/defect generators

## Out of Scope

- Pinning forbidden sources that cannot reach core directly (deferred to the S1 snapshot-boundary follow-up — report §6.3.E).
- P2/P3 work and cross-pillar contracts (later tickets).
- Activating floors/ratchets (SPEC026MUTDRIROB-022) — this ticket records the reviewed P1 score only.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/compiler-prose-metamorphic.property.test.ts packages/core/test/compiler-context-firewall.test.ts` passes with the fixed seed.
2. `npm run mutation:prose` over the full P1 glob reports zero unclassified survivors and meets the configured break floor.
3. The existing prose golden passes unchanged; `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. No accepted/rejected/superseded/auto-derived prose or author-private note appears in any compiled prose prompt under the canary tests.
2. No new compiler parameter was introduced to inject forbidden data; canaries use the real data path.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-prose-metamorphic.property.test.ts` — permutation/repeatability/deep-freeze/optional-section relations.
2. `packages/core/test/compiler-context-firewall.test.ts` — §10/§29.12 boundary canaries.
3. `packages/core/test/support/arbitraries/prose-snapshots.ts` — self-contained snapshot/defect generators (new).

### Commands

1. `vitest run packages/core/test/compiler-prose-metamorphic.property.test.ts packages/core/test/compiler-context-firewall.test.ts` — targeted run.
2. `npm run mutation:prose` — full P1 campaign + survivor classification.
3. The full-glob mutation campaign is the P1 acceptance boundary; the targeted Vitest run is the fast inner loop.
