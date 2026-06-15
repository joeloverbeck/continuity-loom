# SECRETFIRE-001: Fix `secret-reveal-contradiction` false positive for `all_except_holders` secrets

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — modifies the deterministic validation rule `validateSecretFirewall` (diagnostic code `secret-reveal-contradiction`) in `packages/core/src/validation/rules/universal-blockers.ts`.
**Deps**: None

## Problem

The `secret-reveal-contradiction` blocker fires spuriously for any SECRET whose `non_holders_to_protect` is `all_except_holders` and whose holder is the selected POV — the canonical, valid configuration of a character who is the POV of their own secret.

`all_except_holders` means "protect everyone **except** the holders" (`docs/story-record-schema.md:648`; rendered as *"Everyone except the secret holders"* in `packages/core/test/compiler-front-sections.test.ts:621`). A holder is therefore never in the protected set. But `validateSecretFirewall` treats `non_holders_to_protect === "all_except_holders"` as `protectedFromPov = true` **unconditionally**, so the blocker fires whenever the POV is also a holder — which is exactly when there is no contradiction.

Real-world trigger (from the report): a `motive` SECRET with `holders: ["019ec0c4…"]`, `non_holders_to_protect: "all_except_holders"`, `pov_access: "knows"`, selected POV = that holder. The blocker `Selected secret is both known by and hidden from the selected POV` fires, but the holder both holding and knowing their own secret is valid.

Proof the branch yields only false positives: the blocker requires `knownByPov && protectedFromPov`. On the `all_except_holders` branch `protectedFromPov` is always true, so it fires iff `knownByPov` (POV ∈ holders). But a holder is excluded from `all_except_holders` protection, so that case is never a real contradiction; and when the POV is not a holder, `knownByPov` is false and it never fires. Net: the branch can never fire correctly.

## Assumption Reassessment (2026-06-13)

1. **Rule location & logic confirmed.** `validateSecretFirewall` in `packages/core/src/validation/rules/universal-blockers.ts:232-278`. The defect is at lines 245-248: `knownByPov = Array.isArray(payload.holders) && payload.holders.includes(pov)`, and `protectedFromPov = (… non_holders_to_protect.includes(pov)) || payload.non_holders_to_protect === "all_except_holders"`. The blocker pushes at lines 251-262 when `knownByPov && protectedFromPov && payload.pov_access !== "knows_partly"`. The sibling `hiddenTruthInPovKnowledge` check (lines 264-275) is independent and unaffected.
2. **Schema & docs confirmed.** `non_holders_to_protect: list[entity_id] | all_except_holders | none` (`docs/story-record-schema.md:648`); zod enum at `packages/core/src/records/knowledge.ts:69`. Constitutional basis for the genuine contradiction: `docs/FOUNDATIONS.md:417` ("selected secret is both hidden from POV and revealed to POV by another selected record") and the legibility requirement `docs/FOUNDATIONS.md:425`. No spec in `specs/` governs this rule; `archive/specs/SPEC-006…` (detval engine) is historical only.
3. **Not a cross-skill/cross-artifact ticket.** The change is confined to one `@loom/core` validation rule plus its co-located test; no shared boundary, schema, or contract is altered. `secret-reveal-contradiction` / `secretRevealContradiction` is referenced only as a diagnostic-code constant (`packages/core/src/validation/types.ts:98`) and in test/stress mappings — none of which depend on the *firing condition* being unchanged.
4. **FOUNDATIONS principle restated (§15 secret firewall).** §15 protects a POV from being given both protected ignorance and confirmed knowledge of the same secret (`FOUNDATIONS.md:417`, `:524-547`). A holder knowing their own secret is **not** that contradiction. The fix narrows the rule to the real contradiction; it does not relax §15.
5. **Fail-closed / secret-firewall non-weakening confirmed.** The genuine contradiction is still caught by (a) the explicit-list branch — `non_holders_to_protect` array containing the POV while the POV is a holder — which is unchanged, and (b) the independent `hiddenTruthInPovKnowledge` blocker. Existing fixture `hiddenKnownSecret()` (`packages/core/test/validation-blockers.test.ts:428-443`) uses the explicit-list form and must stay green, proving the firewall is intact.

## Architecture Check

1. The fix is a minimal, semantically-correct guard: `all_except_holders` contributes to `protectedFromPov` only when the POV is not a holder (`!knownByPov`), exactly matching the schema's "everyone except the holders" definition. This is cleaner than adding a downstream suppression or a new exception code — it makes the predicate mean what the field means.
2. No backwards-compatibility aliasing or shims introduced; the change is a single boolean-predicate correction with no new public surface.

## Verification Layers

1. *`all_except_holders` + holder-POV must not block* → schema validation + skill dry-run: new unit test asserting `runValidation` emits no `secretRevealContradiction` for that configuration.
2. *Genuine explicit-list contradiction must still block* → codebase grep-proof + existing test: `hiddenKnownSecret()` fixture continues to produce `secretRevealContradiction` (`validation-blockers.test.ts:149-155`).
3. *Secret firewall not weakened* → FOUNDATIONS alignment check: §15 / `FOUNDATIONS.md:417` real contradiction still detected via explicit-list branch and `hiddenTruthInPovKnowledge`.

## What to Change

### 1. Gate the `all_except_holders` branch on non-holder POV

In `packages/core/src/validation/rules/universal-blockers.ts`, within `validateSecretFirewall`, change `protectedFromPov` so the `all_except_holders` sentinel only counts when the POV is not a holder:

```ts
const protectedFromPov =
  (Array.isArray(payload.non_holders_to_protect) && payload.non_holders_to_protect.includes(pov)) ||
  (payload.non_holders_to_protect === "all_except_holders" && !knownByPov);
```

`knownByPov` is already computed on the preceding line, so no reordering is required.

### 2. Add a regression test for the `all_except_holders` + holder-POV non-contradiction

In `packages/core/test/validation-blockers.test.ts`, add a focused test (a SECRET with `holders: [povId]`, `non_holders_to_protect: "all_except_holders"`, `pov_access: "knows"`, selected POV = `povId`) asserting `runValidation` returns **no** diagnostic with code `DIAGNOSTIC_CODES.secretRevealContradiction`. Mirror the existing `buildValidationSnapshot` / `hiddenKnownSecret` setup pattern; the new fixture must not set `pov_access: "hidden"` (which would legitimately trip `hiddenTruthInPovKnowledge`).

## Files to Touch

- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify)

## Out of Scope

- Enriching the blocker message text (the message already satisfies `FOUNDATIONS.md:425` — it names the conflicting field, record, and a suggested action; the report's "more informative information" request was contingent on the blocker being correct, which it is not).
- Any change to the explicit-list contradiction branch, the `hiddenTruthInPovKnowledge` blocker, or the `knows_partly` exemption.
- Compiler rendering of `non_holders_to_protect` (already correct per `compiler-front-sections.test.ts:621`).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: a SECRET with `non_holders_to_protect: "all_except_holders"`, `holders: [povId]`, `pov_access: "knows"`, POV = `povId` produces **no** `secretRevealContradiction` diagnostic.
2. Existing test "secret both hidden from and known by POV" (`validation-blockers.test.ts:149-155`, explicit-list fixture) still produces `secretRevealContradiction`.
3. `npm test` passes (builds `@loom/core`, then full Vitest), and `npm run lint` + `npm run typecheck` are clean.

### Invariants

1. `secret-reveal-contradiction` fires only when a POV is both a holder and explicitly listed in `non_holders_to_protect`, or otherwise genuinely protected while holding — never solely because `non_holders_to_protect === "all_except_holders"`.
2. The `all_except_holders` predicate in `validateSecretFirewall` agrees with the schema definition ("everyone except the holders"): a holder is never treated as protected by that sentinel.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-blockers.test.ts` — add the `all_except_holders` + holder-POV non-contradiction regression test; confirm the existing explicit-list contradiction case is untouched.

### Commands

1. `npx vitest run packages/core/test/validation-blockers.test.ts` — targeted rule coverage.
2. `npm test` — full-pipeline (builds `@loom/core` then runs Vitest across packages).
3. `npm run lint && npm run typecheck` — gate the change per the project completion checklist.

## Outcome

Completed: 2026-06-13

What changed:

- Corrected `validateSecretFirewall` so `non_holders_to_protect === "all_except_holders"` only protects the selected POV when the POV is not a secret holder.
- Added a regression test proving a selected POV who holds their own secret with `all_except_holders` and `pov_access: "knows"` does not emit `secretRevealContradiction`.

Deviations from original plan:

- Ran `npm exec vitest run packages/core/test/validation-blockers.test.ts` instead of the ticket's `npx vitest run ...` command; it exercises the same Vitest target through npm.
- Also ran `npm run build` per repository completion guidance.

Verification results:

- `npm exec vitest run packages/core/test/validation-blockers.test.ts` passed: 1 file, 30 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 121 files, 911 tests.
- `npm run build` passed, with the existing Vite chunk-size warning.
