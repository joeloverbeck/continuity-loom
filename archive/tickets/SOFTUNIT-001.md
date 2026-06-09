# SOFTUNIT-001: Wire soft-unit stop guidance to the prompt and omit it when blank

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/` (new resolver), `packages/core/src/compiler/compile-prompt.ts`, `packages/core/src/compiler/empty-states.ts`, `docs/compiler-contract.md` (row 165), `docs/prompt-template.md` (stop_rule), `packages/core/test/golden-first-segment.prompt.txt`
**Deps**: None

## Problem

The `<stop_rule>` section renders the user's stop guidance incorrectly in three compounding ways:

1. **User input is silently dropped.** `soft_unit_guidance` has no resolver in `sections/front.ts`, `sections/pressure.ts`, `sections/cast.ts`, or `sections/records-tail.ts`. It therefore falls through to the generic empty resolver built in `packages/core/src/compiler/placeholder-map.ts:104-115`, which always returns `EMPTY_STATE_CONSTANTS.soft_unit_guidance`. Whatever the user types into the STOP GUIDANCE editor field (`generationSession.stop_guidance.soft_unit_guidance`) never reaches the prompt.
2. **Double `Soft unit:` prefix.** The empty-state constant (`empty-states.ts:78`) is itself `"Soft unit: No additional user narrowing; use the universal local stop rule above."`, and the template line (`template-constants.ts:354`) already prepends `Soft unit: `. Result: `Soft unit: Soft unit: No additional user narrowing…` (reproduced at `golden-first-segment.prompt.txt:407`).
3. **The line should be omitted when blank.** `docs/prompt-template.md` (the corrected baseline) already specifies conditional omission; the code template was never updated to match. FOUNDATIONS §29.5 confirms blank `soft_unit_guidance` must not be treated as a structural failure, and §10/§9 confirm the universal stop rule itself always compiles.

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **No resolver exists for `soft_unit_guidance`.** Confirmed: `grep -rn "soft_unit_guidance" packages/core/src/compiler/` returns only `placeholder-map.ts:85` (type union), `template-constants.ts:354` (template literal), and `empty-states.ts:78` (empty constant) — no entry in any `sections/*` resolver map. The field is defined in `packages/core/src/records/generation-brief.ts:153-157` (`stopGuidanceSchema = { soft_unit_guidance: nonemptyString }`) and reaches the compiler via `snapshot.generationSession.stop_guidance?.soft_unit_guidance` (optional, `generationSessionSchema` at `generation-brief.ts:168`).
2. **Docs already prescribe the corrected behavior, and disagree with each other on the dead fallback path.** `docs/prompt-template.md:381` says: *"if `{soft_unit_guidance}` is supplied, render `Soft unit: {soft_unit_guidance}`. If it is blank, omit that line; if conditional omission is unavailable, render `Additional user stop guidance: None supplied.`"* `docs/compiler-contract.md` row 165 says: *"Prefer conditional omission; otherwise `Soft unit: No additional user narrowing; use the universal local stop rule above.`"* Both prescribe omission; their *fallback* texts differ. Because the compiler can always omit a line (the `alwaysRender`/filter pattern in `compile-prompt.ts:113-139` proves it), the fallback path is dead — but the two docs must be reconciled to one wording in this ticket to prevent future drift (FOUNDATIONS §8 "drift between template, schema, rationale, example, and compiler contract is a continuity bug").
3. **Shared boundary under audit:** the `{soft_unit_guidance}` placeholder contract across `prompt-template.md` (`<stop_rule>`), `compiler-contract.md` row 165, the compiler template/empty-state constants, and the resolver layer. The `<stop_rule>` section is constitutional (FOUNDATIONS §9) and must continue to compile in full; only the optional inner soft-unit *line* becomes conditional.

4. **FOUNDATIONS principle motivating this ticket:** §8 deterministic compilation ("preserve author-written nuance fields" — dropped user input violates this) and §29.5 ("Does it treat blank optional `soft_unit_guidance` as a blocker…"). The intended principle: supplied stop guidance must compile faithfully; blank stop guidance must omit cleanly without inventing or doubling text.

5. **Deterministic-compilation surface:** the new resolver reads only `snapshot.generationSession.stop_guidance?.soft_unit_guidance` — a normalized generation-time field — and renders deterministically. No LLM, no hidden state, no weakening of the secret firewall (§15). The `<stop_rule>` constitutional section is preserved (§9); only an optional line within it is conditionally omitted.

8. **Adjacent contradiction classification:** the `compiler-contract.md` row 165 vs `prompt-template.md:381` fallback-text mismatch is a **required consequence** of this ticket (reconciled here), not a separate bug.

## Architecture Check

1. Adding a real resolver plus a conditional `<stop_rule>` renderer (mirroring `renderCurrentAuthoritativeStateSection` / `renderImmediateHandoffSection` in `compile-prompt.ts`) is the established pattern for "render line only when populated." It removes the double-prefix at its source by letting the template own the `Soft unit: ` label and the resolver own the value — no constant carries the label. The alternative (keeping the generic empty resolver and patching the constant) leaves the user-input-dropped bug unfixed and is rejected.
2. No backwards-compatibility aliases or shims. The dead fallback constant is removed/repurposed rather than retained alongside a new path.

## Verification Layers

1. Supplied `soft_unit_guidance` reaches the prompt verbatim, once, with a single `Soft unit:` prefix -> schema validation (prompt-section conformance vs `compiler-contract.md` row 165) + new unit test.
2. Blank `soft_unit_guidance` omits the soft-unit line entirely while `<stop_rule>` still compiles -> new unit test + regenerated golden.
3. `<stop_rule>` remains present and constitutionally complete in both states -> FOUNDATIONS alignment check (§9, §29.4 "omit a contract section").
4. Docs reconciled: `prompt-template.md` `<stop_rule>` and `compiler-contract.md` row 165 state one consistent rule -> manual review.

## What to Change

### 1. Add a resolver for `soft_unit_guidance`

In the appropriate `sections/*` resolver map (front or a small stop-guidance resolver), resolve `soft_unit_guidance` from `snapshot.generationSession.stop_guidance?.soft_unit_guidance`, trimmed; return `""` when blank/absent so the conditional renderer can omit the line.

### 2. Render `<stop_rule>` conditionally

Convert `<stop_rule>` to a custom-rendered section in `compile-prompt.ts` (like `current_authoritative_state`/`immediate_handoff`): emit the fixed opening line, then emit `Soft unit: <value>` **only when** the resolver returns non-empty, then emit the remaining fixed stop-trigger body. Remove the static `Soft unit: {soft_unit_guidance}` line from `template-constants.ts`'s `stop_rule` constant (or restructure so the line is owned by the conditional renderer).

### 3. Remove the redundant prefix from the empty constant

Delete the `Soft unit: ` prefix from `empty-states.ts:78` (or remove the constant from the rendering path entirely, since the line is now omitted when blank). The empty-state must never re-introduce the label.

### 4. Reconcile docs

Update `docs/compiler-contract.md` row 165 and `docs/prompt-template.md` `<stop_rule>` so both state the same rule: supplied → `Soft unit: <text>`; blank → omit the line (the universal stop rule remains). Pick one canonical fallback wording (or state that conditional omission is always available, so no fallback text is rendered).

### 5. Regenerate the golden

Update `packages/core/test/golden-first-segment.prompt.txt` so the (blank-guidance) fixture omits the soft-unit line entirely. Do **not** preserve the double-prefix line.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify) — or a small new stop-guidance resolver
- `packages/core/src/compiler/compile-prompt.ts` (modify) — conditional `<stop_rule>` renderer
- `packages/core/src/compiler/template-constants.ts` (modify) — remove static soft-unit line
- `packages/core/src/compiler/empty-states.ts` (modify) — drop redundant prefix
- `docs/compiler-contract.md` (modify) — reconcile row 165
- `docs/prompt-template.md` (modify) — reconcile `<stop_rule>`
- `packages/core/test/golden-first-segment.prompt.txt` (modify) — regenerate
- `packages/core/test/compiler-*.test.ts` (modify) — add supplied/blank assertions

## Out of Scope

- Validation of non-local/contradictory supplied stop guidance (already a blocker; unchanged).
- Any change to the universal stop-trigger body text.
- The STOP GUIDANCE editor UI.

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: supplied `soft_unit_guidance="Stop after she refuses."` renders exactly one line `Soft unit: Stop after she refuses.` inside `<stop_rule>`.
2. New unit test: blank/absent `soft_unit_guidance` produces a `<stop_rule>` with **no** `Soft unit:` line and no `Additional user stop guidance` line, and the section still contains the universal stop triggers.
3. `npm run lint && npm run typecheck && npm test` (builds `@loom/core` then Vitest; golden regenerated).

### Invariants

1. No string `Soft unit: Soft unit:` can appear in any compiled prompt.
2. `<stop_rule>` is always present and constitutionally complete regardless of `soft_unit_guidance` state (FOUNDATIONS §9/§29.4).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-*.test.ts` (stop_rule coverage) — assert supplied-verbatim, blank-omitted, no-double-prefix.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated to the corrected blank-state output.

### Commands

1. `npm test -- compiler`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

Added a real `soft_unit_guidance` resolver sourced from `generationSession.stop_guidance.soft_unit_guidance`, removed the static `Soft unit: {soft_unit_guidance}` template line, and made `<stop_rule>` insert `Soft unit: <text>` only when guidance is supplied. Blank guidance now omits the line while the universal stop triggers remain present.

Updated the obsolete empty-state prefix, reconciled `docs/compiler-contract.md` and `docs/prompt-template.md`, added front-section tests for supplied and blank guidance, and regenerated the first-segment golden prompt so the demo guidance renders once.

Deviation from original plan: no new resolver module was needed; the existing front-section resolver map owns the generation-time stop guidance field.

Verification:

- `npm test -- compiler-front-sections compiler-golden` passed.
- `npm run lint && npm run typecheck && npm test` passed with loopback binding allowed for server tests.
