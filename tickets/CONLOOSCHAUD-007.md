# CONLOOSCHAUD-007: Schema-cleanup regression capstone and stress/demo doc sync

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — adds a cross-cutting regression/determinism capstone test and syncs the non-§8 stress/demo support docs to the new compiled-prompt behavior; no production behavior change
**Deps**: archive/tickets/CONLOOSCHAUD-001.md, CONLOOSCHAUD-006

## Problem

The schema-cleanup set (archive/tickets/CONLOOSCHAUD-001.md, archive/tickets/CONLOOSCHAUD-002.md, archive/tickets/CONLOOSCHAUD-003.md, archive/tickets/CONLOOSCHAUD-004.md, and CONLOOSCHAUD-005…006) removes four stored fields and one prompt lane, repairs present-minor voice delivery, and renders entity/location state that previously fell through. Several spec §16 test-matrix rows are cross-cutting rather than owned by a single change — deterministic repeat-compilation, the accepted-prose firewall across all changes, author-only fields not leaking, and post-build grep-proofs for every removed identifier — and the non-§8 support docs (`docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`) describe behavior that several of these changes alter. This capstone exercises the composed pipeline end-to-end and lands the support-doc sync once all upstream changes exist coherently. (Spec §15 Phase 7, §16.)

## Assumption Reassessment (2026-06-20)

1. The repo uses a capstone test convention (`packages/core/test/validation-taxonomy-capstone.test.ts`); the new `packages/core/test/schema-audit-cleanup-capstone.test.ts` does not exist yet (verified by directory listing 2026-06-20) and is the correct `(new)` file for this gate. The prose golden is `golden-first-segment.prompt.txt`; the ideation golden is `golden-ideation.prompt.txt`; `compiler-golden.test.ts` already carries golden/determinism assertions.
2. The non-§8 support docs `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, and `docs/demo-blocker-recipes.md` exist (verified 2026-06-20). The §8-bound authority docs (`compiler-contract.md`, `story-record-schema.md`, `prompt-template.md`, `prompt-template-rationale.md`, `ideation-prompt-template.md`, `validation-rule-inventory.md`) are co-landed in the upstream code tickets (001–006), not here. Spec: `specs/continuity-loom-schema-audit-and-changes.md` §15 Phase 7 + §16.
3. Cross-artifact boundary under audit: this is the spec's §16 verification carrier. It exercises the upstream tickets end-to-end (it introduces no new production logic) and owns only the cross-cutting regression test plus the non-§8 support-doc sync. Per the capstone leaf-set rule, its `Deps` are the leaf set covering the full DAG: CONLOOSCHAUD-006 (transitively covers 002→003→004→005) and archive/tickets/CONLOOSCHAUD-001.md (the independent global-config removal).
4. FOUNDATIONS §8 (deterministic compilation — identical normalized input/version → byte-identical prompt), §10/§29.8 (accepted prose never enters a prompt), and §17/§29 (the consolidated clearance the spec asserts in its §17 table) are the principles this capstone proves rather than re-derives.
5. Deterministic-compilation + accepted-prose firewall are the enforcement surfaces under test: the capstone asserts repeat-compilation byte-identity and that none of the cleanup changes admit accepted/candidate/superseded/derived prose into any prompt. It adds no production code and weakens no secret firewall (§15) — it is a verification-and-docs ticket.
6. (Schema-extension item not applicable — the capstone extends no schema; it exercises the schemas the upstream tickets changed.)
7. (Rename/removal item not applicable — but the capstone's grep-proofs *verify* the upstream removals: `continuity_philosophy`, `manual_directive_id`, `current_cast_voice_pressure[].local_function`, `cast_voice_overrides[].scope`, and the `{voice_pressure}` placeholder are absent from `packages/*/src`, template constants, and goldens after `npm run build` refreshes `dist/**`.)
8. Adjacent contradiction: none new. The capstone is the backstop that catches any upstream ticket that under-delivered a §16 row (e.g. a removed identifier still present in a fixture, or a non-deterministic compile).
9. Mismatch + correction: none. The §16 matrix rows map to upstream tickets (per Step 6 coverage) with the cross-cutting rows owned here.

## Architecture Check

1. A single trailing capstone is cleaner than scattering cross-cutting checks: determinism, the accepted-prose firewall, author-only non-leakage, and post-build grep-proofs are properties of the *composed* result, not any one change. Merging the capstone with the non-§8 support-doc sync avoids a needless extra inter-ticket dependency, since both gate on the same upstream leaf set and the doc sync is meaningless until the behavior lands.
2. No backwards-compatibility aliasing/shims; no new production logic. The capstone exercises existing pipelines and the docs describe the landed behavior.

## Verification Layers

1. Identical normalized input/version compiles byte-identically across repeat compilation -> deterministic repeat-compile assertion (`schema-audit-cleanup-capstone.test.ts`).
2. No removed identifier or `{voice_pressure}` remains after build -> codebase grep-proof over `packages/*/src`, `template-constants.ts`, and both goldens (run after `npm run build`).
3. None of the cleanup changes admit accepted/candidate/derived prose into a prompt -> accepted-prose firewall assertion (FOUNDATIONS §10/§29.8 alignment check).
4. Author-only fields (fallback steps, tick history, sequence order, thread answer, structured relationship metadata) do not leak into prose or ideation prompts -> golden/grep assertion.
5. Stress/demo support docs reflect the new compiled-prompt behavior (present-minor speech recipe shows required guidance visible in the compiled prompt; removed-lane/field behavior corrected) -> doc grep-proof against the post-implementation tree.

## What to Change

### 1. Regression capstone test (new)

Add `packages/core/test/schema-audit-cleanup-capstone.test.ts` covering the cross-cutting §16 rows not owned by a single upstream ticket: deterministic repeat-compilation (byte-identical prompt on re-compile of the same normalized snapshot/version); the accepted-prose firewall (no accepted/candidate/superseded/derived prose in any prompt) across the cleanup; and author-only-field non-leakage (fallback steps, tick history, sequence order, thread answer, structured relationship metadata) in both prose and ideation prompts. Re-enumerate expected counts from a fixture at test start rather than hardcoding. Do not duplicate the per-ticket assertions already owned by 001–006; this ticket exercises the composed pipeline.

### 2. Stress / demo support docs (non-§8)

Update `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, and `docs/demo-blocker-recipes.md` where behavior changed: update any present-minor speech recipe so the required guidance is visible in the compiled prompt (now that present-minor current pressure is delivered), and correct any reference to the removed `{voice_pressure}` lane or removed fields. Do not independently rewrite prompt prose beyond the required synchronization.

## Files to Touch

- `packages/core/test/schema-audit-cleanup-capstone.test.ts` (new)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)
- `docs/demo-blocker-recipes.md` (modify)

## Out of Scope

- Any production logic, schema, compiler resolver, validation rule, or migration change (all owned by 001–006).
- The §8-bound authority docs (`compiler-contract.md`, `story-record-schema.md`, `prompt-template.md`, `prompt-template-rationale.md`, `ideation-prompt-template.md`, `validation-rule-inventory.md`) — co-landed in their respective upstream tickets.
- Re-asserting per-ticket behavior already covered by 001–006's own tests.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- schema-audit-cleanup-capstone` — deterministic repeat-compile is byte-identical; accepted-prose firewall holds; author-only fields do not leak into prose or ideation prompts.
2. `npm run lint && npm run typecheck && npm test && npm run build` — full workspace pipeline green (the §16 "full suite" row).
3. Post-build grep-proof (see command 3) prints nothing for every removed identifier and `{voice_pressure}`.

### Invariants

1. Identical normalized input + template/compiler version produces byte-identical prose and ideation prompts.
2. No removed field/identifier or `{voice_pressure}` remains anywhere in `packages/*/src`, template constants, or the goldens after build; no author-only field appears in any compiled prompt.

## Test Plan

### New/Modified Tests

1. `packages/core/test/schema-audit-cleanup-capstone.test.ts` — cross-cutting determinism + accepted-prose-firewall + author-only-non-leakage cases, with fixture-derived expected counts.

### Commands

1. `npm test -- schema-audit-cleanup-capstone`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `npm run build && for id in continuity_philosophy manual_directive_id voice_pressure; do grep -rn "$id" packages/core/src packages/server/src packages/web/src && echo "LEAK: $id"; done; grep -rn "{voice_pressure}" docs packages/core/test/golden-first-segment.prompt.txt && echo "LEAK: voice_pressure lane"; true` (post-build grep-proof; must report no LEAK lines).
