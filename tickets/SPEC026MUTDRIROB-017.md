# SPEC026MUTDRIROB-017: Add knowledge and voice matrix diagnostic contracts

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends the diagnostic contract registry with the knowledge and voice matrix families; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md, archive/tickets/SPEC026MUTDRIROB-013.md

## Problem

The knowledge and voice matrix rule families encode field-matrix predicates (knowledge/secrets boundaries, voice consistency) whose comparisons Stryker mutates directly. A surviving mutant changes which knowledge or voice contradiction is flagged while staying green — and a knowledge mutant can touch the §15 secret boundary. This ticket covers every code and predicate boundary in the two families, extending the archive/tickets/SPEC026MUTDRIROB-013.md registry.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/rules/matrix-knowledge.ts` and `matrix-voice.ts` exist (confirmed this session) and are inside the P3 mutation glob.
2. SPEC-026 §Deliverables D5 + report §8.2/§8.7 define covering every code + predicate boundary in the two matrices; the registry + runner exist from archive/tickets/SPEC026MUTDRIROB-013.md.
3. Cross-artifact boundary under audit: each case extends the independent registry and derives no expected value from `matrix-*.ts` under mutation.
4. FOUNDATIONS principle restated: §11 fail-closed validation + §15 POV/knowledge/secrets + §29.6 POV/reveal — knowledge-matrix blockers preserve the secret boundary; voice-matrix preserves voice consistency. Contract cases pin them without changing rules.
5. Fail-closed-validation + secret-firewall surfaces (§11, §15): the knowledge-matrix contracts must confirm the secret boundary is not weakened — a surviving knowledge mutant that opens a secret leak is a CRITICAL behavior-fix ticket, not a test relaxation.

## Architecture Check

1. Covering every knowledge/voice predicate boundary targets the comparison/boolean mutants precisely; a minimal-defect/repair fixture per code is mutation-tight where a count is not.
2. No backwards-compatibility shims; registry extension only.

## Verification Layers

1. Per-code contract -> baseline clean → minimal defect → exact code/severity/affected → repair removes exactly that diagnostic, for every knowledge and voice matrix code.
2. Predicate boundaries -> each comparison/negation/conjunction boundary in the two matrices has a discriminating case.
3. Secret boundary -> the knowledge-matrix cases confirm no mutant opens a knowledge/secret leak the matrix should block (§15 manual review + contract assertion).
4. Mutants killed -> `npm run mutation:validation` over `matrix-knowledge.ts` + `matrix-voice.ts` reports survivors classified.

## What to Change

### 1. Matrix contract cases

Extend `packages/core/test/validation-diagnostic-contract.test.ts` and the registry with knowledge + voice matrix cases: one minimal-defect/repair fixture per code and a discriminating case at each predicate boundary, including the knowledge/secret-boundary codes.

### 2. Survivor classification

Run `npm run mutation:validation` scoped to `matrix-knowledge.ts` + `matrix-voice.ts`; classify every survivor.

## Files to Touch

- `packages/core/test/validation-diagnostic-contract.test.ts` (modify) — add knowledge/voice matrix cases
- `packages/core/test/support/diagnostic-contract.ts` (modify) — register matrix cases

## Out of Scope

- Durable/physical matrices (SPEC026MUTDRIROB-016); security/warning/taxonomy (SPEC026MUTDRIROB-018).
- Universal/referential/internal/structural families (archive/tickets/SPEC026MUTDRIROB-015.md).
- Any change to matrix rule production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` passes with the new matrix cases.
2. `npm run mutation:validation` shows zero unclassified survivors in `matrix-knowledge.ts` + `matrix-voice.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Every knowledge/voice matrix code has a contract case asserting exact severity + affected target.
2. No knowledge-matrix mutant opens a secret leak under the contract cases (§15).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-diagnostic-contract.test.ts` — knowledge/voice matrix cases (modify).
2. `packages/core/test/support/diagnostic-contract.ts` — registry extension (modify).

### Commands

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` — targeted run.
2. `npm run mutation:validation` — survivor classification for the two matrix files.
3. Per-boundary cases plus the §15 secret-boundary assertion are the correct boundary for the knowledge/voice matrices.
