# SPEC026MUTDRIROB-011: Mutation-tighten P2 slot assignment

**Status**: COMPLETED (2026-06-21)
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds slot-assignment boundary and metamorphic property tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The ideation compiler assigns request slots with bounded counts, a no-padding contract, a shrink disclosure, dormant-slot reservation, and deterministic tie-breaks (oldest by `updatedAt`, ID tie-break). Mutants here — a count boundary flipped inclusive/exclusive, synthetic padding added, the `shrunk` flag emitted under the wrong condition, the dormant slot placed anywhere but last, the oldest-record sort reversed — silently change the slate while example tests stay green. This ticket pins the boundaries and relations and classifies survivors.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/ideation/slot-assignment.ts` exists (confirmed this session) and is inside the P2 mutation glob.
2. SPEC-026 §Deliverables C2 + report §7.3.B/D define the boundaries (2/3/6/7 + default omission) and relations (no padding, `shrunk` ⇔ assigned<requested, dormant-only-when-requested/eligible/available, dormant-last, oldest-by-`updatedAt` with ID tie-break, ineligible-add no-op, permutation invariance).
3. Cross-artifact boundary under audit: the request-count contract from `docs/ideation-prompt-template.md` — boundary tests must assert the exact result or error, not merely that a call succeeds.
4. FOUNDATIONS principle restated: §9.1 — bounded counts, slot reservation, and deterministic tie-breaks are part of the ideation contract; properties pin them without changing production source.
5. Deterministic-compilation surface (§8): the tests mutate `slot-assignment.ts` in the sandbox only; confirm assignment stays deterministic (stable tie-breaks, no ambient/clock/random state) with no production change. Any contract mismatch → separate behavior-fix ticket.

## Architecture Check

1. Exact boundary assertions (2/3/6/7) plus metamorphic relations (permutation invariance, dormant-last, oldest tie-break) target precisely the comparison and conjunction mutants Stryker synthesizes — stronger than a single mid-range example.
2. No backwards-compatibility shims; tests + self-contained generators only.

## Verification Layers

1. Count boundaries -> exact accept/reject assertions at 2, 3, 6, 7 requested items + default omission.
2. Slot relations -> properties: no synthetic padding; `shrunk` true exactly when assigned<requested; dormant slot only when requested/eligible/available and always last; dormant record is oldest by `updatedAt` with ID tie-break; adding an ineligible record cannot alter assignment; storage-order permutation leaves slots unchanged.
3. Mutants killed -> `npm run mutation:ideation` over `slot-assignment.ts` reports zero unclassified survivors.

## What to Change

### 1. Slot-assignment boundary + property tests

Add `packages/core/test/ideation-slot-assignment.property.test.ts`: exact boundary table (2/3/6/7 + default) and the metamorphic relations above, over generated valid requests + record sets (self-contained generators in `packages/core/test/support/arbitraries/ideation-requests.ts`). Assigned count never exceeds requested count; removing one prerequisite removes only operators that require it, subject to deterministic refill from the fixed sequence.

### 2. Survivor classification

Run `npm run mutation:ideation` scoped to `slot-assignment.ts`; classify every survivor. Any contract mismatch → separate behavior-fix ticket.

## Files to Touch

- `packages/core/test/ideation-slot-assignment.property.test.ts` (new)
- `packages/core/test/support/arbitraries/ideation-requests.ts` (new) — self-contained request generators

## Out of Scope

- Operator eligibility (archive/tickets/SPEC026MUTDRIROB-010.md), citation keys / rendering / full campaign (SPEC026MUTDRIROB-012).
- Any change to `slot-assignment.ts` production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/ideation-slot-assignment.property.test.ts` passes with the fixed seed.
2. `npm run mutation:ideation` shows zero unclassified survivors in `slot-assignment.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. No synthetic padding occurs; `shrunk` is true exactly when assigned count < requested count.
2. A dormant slot appears only when requested, eligible, and available, and is always last.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-slot-assignment.property.test.ts` — boundary table + dormant/shrink/permutation relations.
2. `packages/core/test/support/arbitraries/ideation-requests.ts` — self-contained request generators (new).

### Commands

1. `vitest run packages/core/test/ideation-slot-assignment.property.test.ts` — targeted run.
2. `npm run mutation:ideation` — survivor classification for `slot-assignment.ts`.
3. Exact boundary assertions + metamorphic relations are the correct boundary: they assert the exact result or error, not merely call success.

## Outcome

Completed 2026-06-21. Added `packages/core/test/ideation-slot-assignment.property.test.ts` and `packages/core/test/support/arbitraries/ideation-requests.ts`; extended `packages/core/test/support/arbitraries/ideation-records.ts` to create `directive_required` test secrets.

The new property test pins count boundaries/defaults, no-padding and shrink truth, dormant slot reservation and omission, oldest/ID dormant tie-breaks, storage-order permutation invariance, ineligible-record no-op behavior, and reveal-permission guard behavior. No production code changed.

Verification:

1. `npx vitest run packages/core/test/ideation-slot-assignment.property.test.ts` — passed, 10 tests.
2. `npm run mutation:ideation -- --force --mutate packages/core/src/compiler/ideation/slot-assignment.ts` — completed with `slot-assignment.ts` at 90.59 mutation score: 77 killed, 45 compile-error mutants, 3 survived, 5 no-coverage, 0 timeout.
   - Classified survivors: line 25 `slots.length < request.count` changed to `true` / `<=` is equivalent under the current schema because `dormantSlot: true` computes `nonDormantTarget` as `count - 1`, so the dormant branch can only be reached while `slots.length < count`; line 48 `operator.id === "reveal"` changed to `true` is equivalent because the reveal branch falls back to all matching records when no revealable record exists, making non-reveal operators byte-identical.
   - Classified no-coverage: line 74 nullish fallback is unreachable because `REINCORPORATE_DORMANT_OPERATOR` is a module constant present in this build; line 90 citation fallback is unreachable because `citationKeysFor(records)` is built from the same records passed to `toSlot`; line 100 missing-`updatedAt` fallbacks are unreachable after `dormantTargetRecords` filters for string `metadata.updatedAt`.
3. `npm run lint` — passed.
4. `npm run typecheck` — passed.
5. `npm test` — passed, 144 files / 1128 tests.
6. `npm run build` — passed under escalation due prior sandbox write restrictions; Vite emitted the existing chunk-size warning.

No browser smoke was run because this ticket changes only core test coverage and self-contained test arbitraries.
