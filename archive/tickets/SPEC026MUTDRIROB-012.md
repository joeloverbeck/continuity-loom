# SPEC026MUTDRIROB-012: Mutation-tighten P2 citation keys and ideation rendering; run full ideation campaign

**Status**: COMPLETED (2026-06-21)
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — adds citation-key bijection properties + exact request-field rendering assertions and completes the full P2 mutation campaign; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001, archive/tickets/SPEC026MUTDRIROB-010.md, archive/tickets/SPEC026MUTDRIROB-011.md

## Problem

The ideation compiler assigns citation keys and renders the final request representation (mode, count + shrink disclosure, avoid-list, reveal permission, operator labels, slot grounds). Mutants here — a citation type/label/ID/ordinal tie-break changed, grounds rendered without a resolvable key, a request field silently dropped from the prompt — corrupt the grounded prompt while staying green. This ticket pins the citation bijection and exact request-field rendering, runs/classifies the full P2 campaign, and completes P2 with the ideation golden unchanged.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/ideation/citation-keys.ts` and `sections/ideation.ts` exist (confirmed this session) and are inside the P2 mutation glob.
2. SPEC-026 §Deliverables C3 + report §7.3.E/F define the bijection properties (one key per cited record, unique keys, contiguous ordinals per type, stable order by type/label/ID, permutation invariance, every grounding reference uses a present key) and the exact request-field assertions; the existing ideation golden (`packages/core/test/compiler-ideation-golden.test.ts` → `golden-ideation.prompt.txt`) must remain byte-for-byte unchanged.
3. Cross-artifact boundary under audit: the ideation golden is the high-level contract; this ticket adds properties + focused exact assertions around it without modifying the golden file.
4. FOUNDATIONS principle restated: §9.1 — citation-key construction and grounding are part of the ideation contract; properties pin them without changing production source.
5. Deterministic-compilation surface (§8): the full P2 campaign mutates the ideation compiler in the sandbox only; confirm citation/grounding stays deterministic and the existing ideation golden is unaffected, with no production change. Any defect → separate behavior-fix ticket.

## Architecture Check

1. A citation bijection property (key↔record one-to-one, contiguous ordinals) plus focused request-field assertions catch ordinal/tie-break and field-drop mutants that the single golden cannot localize; properties carry the combinatorial load instead of a snapshot corpus.
2. No backwards-compatibility shims; tests only. Existing ideation golden untouched.

## Verification Layers

1. Citation bijection -> every cited record has exactly one key; every key resolves to exactly one record; keys unique; ordinals contiguous within each record type; type/label/ID determine stable order; input permutation does not change keys.
2. Grounding integrity -> every rendered grounding reference uses a key present in the citation table; no unused key is emitted unless the template requires a complete index.
3. Request-field rendering -> exact assertions for mode, requested count + shrink disclosure, avoid-list, reveal permission, operator labels/slot grounds, and absence of prose-only continuation sections / hidden clock instructions.
4. Full P2 adequacy -> `npm run mutation:ideation` across the full P2 glob meets the break floor with zero unclassified survivors; the ideation golden is unchanged.

## What to Change

### 1. Citation bijection + rendering tests

Add `packages/core/test/ideation-citation-keys.property.test.ts` (bijection/ordinal/permutation properties over generated assigned slates) and `packages/core/test/ideation-request-rendering.test.ts` (exact request-field assertions). Reuse self-contained ideation generators (new `packages/core/test/support/arbitraries/ideation-slates.ts`).

### 2. Full P2 campaign

Run `npm run mutation:ideation` across the full P2 glob; classify every survivor. Record the reviewed P2 score for the baseline (consumed by SPEC026MUTDRIROB-022). Any contract defect → separate behavior-fix ticket.

## Files to Touch

- `packages/core/test/ideation-citation-keys.property.test.ts` (new)
- `packages/core/test/ideation-request-rendering.test.ts` (new)
- `packages/core/test/support/arbitraries/ideation-slates.ts` (new) — self-contained slate generators

## Out of Scope

- Operator eligibility / slot assignment (archive/tickets/SPEC026MUTDRIROB-010.md, archive/tickets/SPEC026MUTDRIROB-011.md).
- Cross-pillar contracts (SPEC026MUTDRIROB-019); activating floors/ratchets (SPEC026MUTDRIROB-022).
- Any change to citation/rendering production logic or the existing ideation golden.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts` passes with the fixed seed.
2. `npm run mutation:ideation` over the full P2 glob reports zero unclassified survivors and meets the break floor.
3. The existing ideation golden passes unchanged; `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Citation keys form a bijection with cited records; ordinals are contiguous within each type.
2. The ideation golden file is not modified.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-citation-keys.property.test.ts` — bijection/ordinal/permutation properties.
2. `packages/core/test/ideation-request-rendering.test.ts` — exact request-field rendering assertions.
3. `packages/core/test/support/arbitraries/ideation-slates.ts` — self-contained slate generators (new).

### Commands

1. `vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts` — targeted run.
2. `npm run mutation:ideation` — full P2 campaign + survivor classification.
3. The full-glob mutation campaign is the P2 acceptance boundary; the targeted Vitest run is the fast inner loop.

## Outcome

Completed 2026-06-21. Added `packages/core/test/ideation-citation-keys.property.test.ts`, `packages/core/test/ideation-request-rendering.test.ts`, and `packages/core/test/support/arbitraries/ideation-slates.ts`; extended `packages/core/test/support/arbitraries/ideation-records.ts` to support explicit test labels.

The new tests pin citation-key one-to-one mapping, uniqueness, contiguous per-type ordinals, type/full-label/id ordering, storage-order permutation invariance, slot-ground key resolvability, direct single-record `citationKey` behavior, avoid-list trimming, exact ideation slot rendering, empty-slot rendering, and absence of prose-only continuation sections in ideation prompts. The existing ideation golden file was not modified.

Verification:

1. `npx vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts` — passed, 10 tests.
2. `npm run mutation:ideation -- --force` — full P2 campaign completed at 95.88 overall mutation score / 98.41 covered score: 186 killed, 84 compile-error mutants, 3 survived, 5 no-coverage, 0 timeout. `citation-keys.ts`, `operators.ts`, `types.ts`, and `sections/ideation.ts` each reported 100.00 mutation score.
   - Classified survivors: `slot-assignment.ts` line 25 `slots.length < request.count` changed to `true` / `<=` is equivalent under the current schema because `dormantSlot: true` computes `nonDormantTarget` as `count - 1`, so the dormant branch can only be reached while `slots.length < count`; line 48 `operator.id === "reveal"` changed to `true` is equivalent because the reveal branch falls back to all matching records when no revealable record exists, making non-reveal operators byte-identical.
   - Classified no-coverage: `slot-assignment.ts` line 74 nullish fallback is unreachable because `REINCORPORATE_DORMANT_OPERATOR` is a module constant present in this build; line 90 citation fallback is unreachable because `citationKeysFor(records)` is built from the same records passed to `toSlot`; line 100 missing-`updatedAt` fallbacks are unreachable after `dormantTargetRecords` filters for string `metadata.updatedAt`.
3. `git status --short packages/core/test/golden-ideation.prompt.txt packages/core/test/compiler-ideation-golden.test.ts` — no output; the ideation golden and its existing test were unchanged.
4. `npm run lint` — passed.
5. `npm run typecheck` — passed.
6. `npm test` — passed, 146 files / 1138 tests.
7. `npm run build` — passed under escalation due prior sandbox write restrictions; Vite emitted the existing chunk-size warning.

No browser smoke was run because this ticket changes only core test coverage and self-contained test arbitraries.
