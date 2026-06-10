# SPEC019REFINTSTR-002: Reference classification helper

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — new shared validation helper in `@loom/core` (`reference-classification.ts`) plus its unit test; no production behavior change until the reference rules (003–006) consume it.
**Deps**: SPEC019REFINTSTR-001

## Problem

SPEC-019 D2 calls for a single shared helper that classifies any checked reference as `selected` (in `snapshot.records`), `unselected` (in `projectRecordIndex` but not selected), or `dangling` (absent from the index), and checks the reference's actual record type against an expected set. Every brief-field, cast-band, and record-internal rule (003–005) implements the severity lane table against this one classification contract; building it once prevents each rule from re-deriving membership logic and keeps the `selected/unselected/dangling` semantics uniform.

## Assumption Reassessment (2026-06-10)

1. After 001, `ValidationSnapshot` carries `records: readonly ValidationRecord[]` (each with `id` and `type`) and `projectRecordIndex: Readonly<Record<string,string>>` (`id → type`). The helper reads only these two fields — pure `@loom/core`, no `node:*`, no DB.
2. SPEC-019 D2 fixes the classification vocabulary and the severity doctrine; the **severity lane table** itself is documentation (routed to 009), and the per-cell required-vs-optional grading is re-derived at each consuming rule from the compiler-contract §4 requiredness column (SPEC-019 Risk 3). This ticket owns the mechanism, not the table.
3. Cross-artifact boundary under audit: the classification contract is consumed by 003 (brief-field rules), 004 (cast-band rules), and 005 (record-internal rules). The shared boundary is the helper's return shape (`classification`, `actualType`, `typeMatches`); it must be stable before those rules are written.
4. FOUNDATIONS principle motivating this ticket: §11 — blockers are legitimate only on a proven condition (clause 2: a required lane lacks truthful deterministic state; clause 3: a hard contradiction). The helper supplies the deterministic facts (does the id resolve? to what type?) the rules turn into severity; it performs **no** content inspection (SPEC-019 spec invariant: id equality / type comparison / set membership only).
5. Fail-closed enforcement surface this substrate feeds: the reference rules in 003–006, which run inside `runValidation` (`packages/core/src/validation/engine.ts`). This helper introduces no leakage path (it returns record-type strings and a membership verdict, never prose or secret content) and no nondeterminism (pure lookups over snapshot collections; no wall-clock, no `Math.random`, deterministic for identical snapshots).

## Architecture Check

1. One classification helper with an explicit three-way result is cleaner than each rule re-implementing "is this id selected / known / unknown" — it removes the most common drift surface (a rule that forgets the `unselected` middle case and treats every non-selected id as dangling). Threading expected record types through the same call keeps the type-mismatch check co-located with membership, where both facts are already in hand.
2. No backwards-compatibility aliasing/shims: this is a new pure function with no prior implementation to alias.

## Verification Layers

1. Three-way classification correctness -> unit test: ids that are selected, unselected (in index only), and dangling (absent) each return the right `classification`.
2. Type resolution + match -> unit test: `actualType` comes from `records` for selected and from `projectRecordIndex` for unselected; `typeMatches` reflects the expected-type set; dangling has no type.
3. Cross-artifact contract stability -> the return shape is exercised by 003–005; documented here so those tickets bind to it (grep-proof at Step 6 that consumers import this helper).
4. Determinism / no heuristics -> FOUNDATIONS §11 alignment review: only id lookup, type comparison, and set membership are used.

## What to Change

### 1. New helper (`packages/core/src/validation/reference-classification.ts`)

Export `classifyReference(snapshot, id, expectedTypes?)` returning `{ classification: "selected" | "unselected" | "dangling"; actualType: string | undefined; typeMatches: boolean }`:

- `selected` when `snapshot.records` contains a record with that id (`actualType` = that record's `type`);
- else `unselected` when `snapshot.projectRecordIndex` has the id (`actualType` = the indexed type);
- else `dangling` (`actualType` = `undefined`).
- `typeMatches` is `true` when `expectedTypes` is omitted, otherwise whether `actualType` is in `expectedTypes`.

Re-export from `packages/core/src/validation/` as needed so 003–006 can import it. (No change to `packages/core/src/index.ts` is required unless a downstream package outside `@loom/core` must import it — it does not.)

## Files to Touch

- `packages/core/src/validation/reference-classification.ts` (new)
- `packages/core/test/validation-reference-classification.test.ts` (new)

## Out of Scope

- The severity lane table document (SPEC-019 D2 doc portion → 009).
- Any rule that consumes the helper (003–006).
- Adding the helper to a record-type registry or the rule registry (it is a plain function, not a `ValidationRule`).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-reference-classification` — selected/unselected/dangling and type-match cases.
2. `npm run typecheck` — the exported return shape compiles for the consuming rules' expected usage.

### Invariants

1. Classification depends only on id membership in `records` and `projectRecordIndex`; no field-content inspection occurs.
2. The function is deterministic: identical snapshot + id + expected-type set always returns the same result.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-reference-classification.test.ts` (new) — exhaustive classification + type-match matrix, including the `unselected` middle case and the no-expected-types path.

### Commands

1. `npm test --workspace @loom/core -- validation-reference-classification`
2. `npm run lint && npm run typecheck && npm test --workspace @loom/core` — narrower than the full pipeline because this ticket adds a pure helper with no server/web surface; the cross-package consumers arrive in 003–006.
