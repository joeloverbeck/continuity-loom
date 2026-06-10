# SPEC019REFINTSTR-009: Contract, schema, and version doc amendments

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — bumps `contract.version` in `packages/core/src/version.ts`; amends `docs/compiler-contract.md` and `docs/story-record-schema.md`; updates hardcoded `contract: "1.2.0"` assertions in seven test files. No runtime behavior change.
**Deps**: SPEC019REFINTSTR-001, SPEC019REFINTSTR-003, SPEC019REFINTSTR-004, SPEC019REFINTSTR-005, SPEC019REFINTSTR-006

## Problem

SPEC-019 D8 (docs/version portion): the contract pin, the universal-prompt validation matrix, the placeholder mapping, the validation-only field list, and the story-record schema must document the new referential/structural validation behavior in the same revision (FOUNDATIONS §8 change-control, §1.1 contract amendment). This trailing ticket lands all `compiler-contract.md` / `story-record-schema.md` / `version.ts` edits atomically once the rules exist, and reconciles the version-assertion tests.

## Assumption Reassessment (2026-06-10)

1. `docs/compiler-contract.md` structure confirmed: pin at line 5 (`Contract version: \`1.2.0\``); §4 "Exhaustive placeholder mapping" holds the `{pov_character}` row (line 99) whose missing-behavior cell documents the `pov-character-not-selected` warning fallback; §6 "Generation validation matrix" plus a "Warnings that must not block" list whose last bullet is the POV must-not-block statement; §9 "Prompt-facing vs validation-only fields" holds the validation-only list and the raw-id paragraph. `docs/story-record-schema.md` exists. `packages/core/src/version.ts:34` sets `contract.version: "1.2.0"`.
2. `contract.version` is **not** consumed by the compiler (no `packages/core/src/compiler` reference), so the bump leaves the compiled prompt and `compiler-golden.test.ts`'s golden file byte-identical. However, `metadata.versions` embeds the contract version and is asserted as `contract: "1.2.0"` in seven test files (grepped: `compiler-golden.test.ts:139,157,182`, `generate-routes.test.ts:147,183`, `compile-routes.test.ts:118`, `generation-brief-draftability.e2e.test.ts:200`, `field-guidance-doctrine.test.ts:63`, `validation-taxonomy-capstone.test.ts:136`); these update with the bump. `compiler.version` and `template.version` are unchanged, so `compiler-front-sections.test.ts:441` (asserts compiler `"1.2.0"`) is untouched.
3. Cross-artifact boundary: this docs ticket references the diagnostic codes/behaviors implemented by 001/003/004/005/006 and must land after them (atomic docs). The `docs/validation-rule-inventory.md` rows are **not** here — each rule ticket adds its own rows so the drift test stays green per diff.
4. FOUNDATIONS §8 change-control requires the compiler contract to move in the same revision as a requiredness/blocker-row/empty-state change; §1.1 requires the pin bump to land with the dependent change. The §6 lane table + new blocker/warning rows document 003–006; the POV §4/§6 reversal documents 004's `selected-pov-reference-invalid` (a §29.5-legitimate, user-signed-off warning→blocker, SPEC-019 scope decision 2).
5. Determinism (§8): the version bump does not alter compiled output (compiler ignores `contract.version`); no nondeterminism is introduced.
6. Schema doc: `story-record-schema.md` gains additive validation-requirement notes on each field that now carries a referential or coherence check (no field shape changes).
7. Rename/removal in docs: the `pov-character-not-selected` references in `compiler-contract.md` (§4 row + §6 bullet) are removed here — the matching code/rule/inventory removal is owned by 004, so this ticket completes the doc side of that removal's blast radius.

## Architecture Check

1. A single trailing docs+version ticket lands the contract amendments atomically after the rules exist, avoiding a window where the contract documents behavior that is not yet implemented (or vice versa). Keeping the inventory rows with each rule ticket (not here) is what keeps the drift test green per reviewable diff; this ticket owns only the contract/schema/version surfaces.
2. No backwards-compatibility aliasing/shims: the pin and version move forward; the POV warning rows are deleted, not aliased.

## Verification Layers

1. Contract pin and `version.ts` agree -> grep-proof: `docs/compiler-contract.md` line 5 and `version.ts` `contract.version` both read `1.3.0`.
2. POV reversal documented -> grep-proof: no `pov-character-not-selected` remains in `compiler-contract.md`; the §4 `{pov_character}` row and §6 list state the unselected/unresolved POV blocks.
3. Lane table + new rows present -> grep-proof: the D2 severity lane table and each new blocker/warning row appear in §6; the validation-only project record index appears in the §9 list.
4. Schema notes present -> grep-proof: `story-record-schema.md` carries validation-requirement notes on the checked fields.
5. Version-assertion tests reconciled -> `npm test` green with `contract: "1.3.0"` across the seven updated files.

## What to Change

### 1. `docs/compiler-contract.md`

Bump the line-5 pin to `1.3.0`; add the D2 severity lane table and the new blocker/warning rows to §6; delete the POV must-not-block bullet from the §6 "Warnings that must not block" list **and** amend the §4 `{pov_character}` row (line 99) so an unresolved/unselected POV blocks; amend the §9 raw-id paragraph (raw-id fallback persists only in optional lanes and is always warning-surfaced; required lanes block before compilation); add the validation-only project record index to the §9 list.

### 2. `docs/story-record-schema.md`

Add validation-requirement notes on every field gaining a referential or coherence check (brief id fields, record-internal reference fields, cast bands, OBJECT/RELATIONSHIP/ENTITY STATUS coherence fields).

### 3. `packages/core/src/version.ts` + version-assertion tests

Set `contract.version` to `"1.3.0"`. Update the hardcoded `contract: "1.2.0"` assertions to `"1.3.0"` in the seven test files named in Assumption Reassessment item 2 (grep `'contract: "1.2.0"'` as the gate).

## Files to Touch

- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/src/version.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/field-guidance-doctrine.test.ts` (modify)
- `packages/core/test/validation-taxonomy-capstone.test.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (modify)
- `packages/server/src/generate-routes.test.ts` (modify)
- `packages/server/src/generation-brief-draftability.e2e.test.ts` (modify)

## Out of Scope

- `docs/validation-rule-inventory.md` rows (each rule ticket 003–006 owns its own rows; drift test stays green per diff).
- Any rule implementation (003–006), the snapshot index (001), or the D7 build-failure path (007).
- The stress suite / coverage matrix (008).
- `docs/FOUNDATIONS.md` (no amendment — SPEC-019 §11 list is non-exhaustive; §6.2/§7 already sanction blocking on structurally missing required state).

## Acceptance Criteria

### Tests That Must Pass

1. Grep-proofs: `grep -c '1.3.0' docs/compiler-contract.md` ≥ 1 and `version.ts` `contract.version` is `"1.3.0"`; `grep -c 'pov-character-not-selected' docs/compiler-contract.md` is `0`; the §6 lane table and §9 index note resolve.
2. `grep -rn 'contract: "1.2.0"' packages` returns nothing (all version assertions updated).
3. `npm run lint && npm run typecheck && npm test` — full gate green, including `compiler-golden.test.ts` (golden file byte-identical; only the asserted `metadata.versions.contract` string changed).

### Invariants

1. The `compiler-contract.md` pin and `version.ts` `contract.version` are equal at `1.3.0`; `compiler.version`/`template.version` are unchanged.
2. The contract documents exactly the behavior implemented by 001/003–006 — no documented rule lacks an implementation and no implemented code lacks a contract/inventory entry.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-golden.test.ts`, `packages/core/test/field-guidance-doctrine.test.ts`, `packages/core/test/validation-taxonomy-capstone.test.ts`, `packages/server/src/compile-routes.test.ts`, `packages/server/src/generate-routes.test.ts`, `packages/server/src/generation-brief-draftability.e2e.test.ts` (modify) — bump asserted `metadata.versions.contract` to `1.3.0`. No new test; existing ones are reconciled to the version bump.

### Commands

1. `grep -rn 'contract: "1.2.0"' packages` (expect no output) and `grep -n '1.3.0' docs/compiler-contract.md packages/core/src/version.ts`
2. `npm run lint && npm run typecheck && npm test` — full pipeline confirms the doc/version amendments and the reconciled assertions all pass with the rules in place.
