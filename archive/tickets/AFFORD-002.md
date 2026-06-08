# AFFORD-002: Compile VISIBLE AFFORDANCE `durability` into `{visible_affordances}`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — deterministic compiler section (`@loom/core` `records-tail.ts`) plus a one-line note in `docs/compiler-contract.md`.
**Deps**: None

## Problem

VISIBLE AFFORDANCE has a `durability` enum field (`local | reversible_state_change | durable_state_change | irreversible`, `packages/core/src/records/space-material.ts:72`). It is a stored, prompt-facing field with authored field guidance — *"How durable the result of using this affordance may be."* (`packages/core/src/records/field-guidance-cast-material.ts:116`) — and it appears in the editor.

But it is **never compiled into any prompt section**: grep for `durability` across `packages/core/src/compiler/` returns zero hits. The `{visible_affordances}` resolver (`packages/core/src/compiler/sections/records-tail.ts:102`) emits `label`, `prompt_text`, `available_to`, `action_families`, `requires`, and `risk` — but not `durability`. The model therefore never learns that taking a given action would cause a `durable_state_change` or `irreversible` outcome, even though that is exactly the information the durable-change framework depends on (`docs/prompt-template.md:339`: durable changes require strong cause). The field is authored effort that reaches nothing.

## Assumption Reassessment (2026-06-08)

1. `durability` is on the affordance schema at `space-material.ts:72` and has field guidance at `field-guidance-cast-material.ts:116`; it is not in `STATUS_OR_VALIDATION_FIELDS`, so it is treated as prompt-facing by `editor-descriptors.ts:282`. Confirmed authored + prompt-facing yet uncompiled.
2. `docs/compiler-contract.md:159` defines `{visible_affordances}` source as "Selected VISIBLE AFFORDANCE records + current state" and labels it "Possible actions" but does **not** enumerate which payload fields render, and does not currently mention `durability`. Adding `durability` to the rendered output is a deterministic-compilation change, so the contract row's note must be updated to keep the doc and compiler in lockstep (§29.4 determinism alignment).
3. Shared boundary under audit: the `{visible_affordances}` deterministic resolver and its golden test. The resolver builds a fixed-order `compactParts([...])` line; the golden assertion in `compiler-tail-sections.test.ts:260` pins the exact string, so it must be updated for the new field (this is intended new behavior, not adapting a test to a bug).
4. FOUNDATIONS principle: §29.4 — prompt compilation must stay deterministic and free of any LLM intermediary. Rendering a stored enum via the existing deterministic `labelValue` helper preserves both.
6. Output-schema impact: this **extends** a compiled prompt section (`{visible_affordances}`). The consumer is the downstream LLM prompt; the change is additive (one new labeled clause appended to each available-affordance line). No stored record schema changes.

## Architecture Check

1. The change reuses the existing deterministic `labelValue` helper and the established `compactParts` line shape — no new mechanism, no nondeterminism, no LLM step. Cleaner than leaving an authored field silently dead.
2. No backwards-compat shim: this is a pure additive render of an existing field through the existing path.

## Verification Layers

1. Compile invariant: an available affordance with `durability: reversible_state_change` renders a `durability:` clause in `{visible_affordances}` -> `@loom/core` golden test (`compiler-tail-sections.test.ts`).
2. Determinism invariant: identical inputs produce identical `{visible_affordances}` output (no ordering or LLM variance) -> existing deterministic-compiler golden coverage re-run.
3. Doc/code lockstep: `docs/compiler-contract.md`'s `{visible_affordances}` row mentions `durability` -> manual review + grep.

## What to Change

### 1. Render `durability` in the available-affordance line (`@loom/core`)

In `packages/core/src/compiler/sections/records-tail.ts`, the `visible_affordances` resolver (`:102`), append after the `risk` clause:

```ts
labelValue("risk", payload.risk),
labelValue("durability", payload.durability)
```

Keep it scoped to the **available** affordances section only; the unavailable/blocked section (`renderUnavailableActions`, `:133`) stays minimal (label/status/prompt_text/requires), since durability of an action that cannot be taken adds no continuity value. (If reassessment during implementation finds a concrete continuity case for the unavailable section, raise it as a separate ticket rather than widening this one.)

### 2. Update the contract note (`docs`)

In `docs/compiler-contract.md`, the `{visible_affordances}` row (line ~159): extend the note to state that affordance `durability` renders as a deterministic labeled clause alongside `actions`, `requires`, and `risk`.

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-tail-sections.test.ts` (modify — update golden)

## Out of Scope

- Adding `durability` to the unavailable/impossible-actions section or to `physical_continuity`.
- Any change to `durability`'s schema, enum values, validation, or field guidance.
- Any new validation rule keyed on affordance durability.

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-tail-sections.test.ts` golden: the available-affordance line for a fixture with a set `durability` now contains `durability: <value>` appended after `risk:`.
2. The unavailable-actions golden is **unchanged** (durability intentionally omitted there).
3. `npm run typecheck`, `npm run lint`, and `npm test` pass.

### Invariants

1. `{visible_affordances}` output remains deterministic for identical inputs (no LLM intermediary, fixed clause order).
2. Only the available-affordance line shape changes; all other tail sections render byte-for-byte as before.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — update the available-affordance golden string to include the `durability:` clause; assert the unavailable golden is unchanged.

### Commands

1. `npm test --workspace @loom/core` (after `npm run build --workspace @loom/core` if required by the test runner) — targeted compiler golden coverage.
2. `npm run typecheck && npm run lint && npm test` — full pipeline.

## Outcome

Completed: 2026-06-08

What changed:
- Added deterministic `durability` rendering to available VISIBLE AFFORDANCE lines in `{visible_affordances}`.
- Updated the compiler contract row to document the durability clause.
- Updated compiler tail-section and frozen first-segment prompt coverage.

Deviations from original plan:
- The focused available-affordance test uses `risk: physical` because the existing `labelValue` helper intentionally omits `risk: none`.
- The frozen golden prompt file preserves its existing no-final-newline convention.

Verification results:
- `npm test --workspace @loom/core` passed: 38 files, 284 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 99 files, 669 tests.
