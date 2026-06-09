# SPEC017GENBRIVIS-003: Fill-chip helper and shared `isRequiredNow` predicate

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds two pure helpers (`isRequiredNow`, section fill computation) and refactors `RequirednessMarker` onto the shared predicate; no validation, gating, or behavior change
**Deps**: None

## Problem

The section rail (SPEC017GENBRIVIS-004) needs a quiet per-section "draft fill" indicator — how many *currently-required* fields in each section are non-empty in the in-memory draft (SPEC-017 D3). The "currently-required" rule (`always`, or `continuation` only when the effective generation context is a continuation) is already inlined inside `RequirednessMarker`; reimplementing it for the chips would let the per-field `*` marker and the section chip drift (SPEC-017 M3). This ticket extracts that rule once and builds the DOM-free chip computation on top of it.

## Assumption Reassessment (2026-06-10)

1. `RequirednessMarker` (`packages/web/src/generation-brief/RequirednessMarker.tsx:5–35`) inlines the required-now rule at `:16–24`: `always` → required `*`; `continuation` → required `*` iff `generationContext === "continuation_after_accepted_segment"`, else an "Optional for a first segment" tag; `conditional` → "Conditional" tag; else "Optional". `FieldRequiredness = "always" | "continuation" | "conditional" | "optional"` (`packages/core/src/records/field-guidance.ts:12`). Core exports `getFieldGuidance`, `FieldRequiredness`, `generationBriefFieldPaths`, and `generationSessionDraftSchema` (`packages/core/src/index.ts:102,109,140,126`) — everything the pure helper needs, so it requires no DOM and no `displayLabel` (SPEC017GENBRIVIS-001 is **not** a dependency).
2. SPEC-017 D3 chip rules: `always` counts as required always; `continuation` counts only when the effective `generation_context` is `continuation_after_accepted_segment`; `conditional`/`optional` never count as required. Chips are advisory draft-fill indicators — wording must say "filled"/"empty", never "valid"/"ready"; the readiness panel stays the only diagnostic authority. The effective generation context mirrors `GenerationBriefView`'s `generationContext` (validation-focus tag, falling back to the project-derived default) — this helper takes it as a parameter, not a new derivation.
3. Shared boundary under audit: `isRequiredNow(requiredness, generationContext): boolean` is the single source of truth consumed by `RequirednessMarker` (web), the section-fill helper (web), and — transitively — the rail (SPEC017GENBRIVIS-004). The contract types are `FieldRequiredness` and the `GenerationContext` union, both already used in `RequirednessMarker`.
4. FOUNDATIONS §11 / §29.5 (validation discipline): the fill chips are **presentation of existing `requiredness` metadata over the in-memory draft** — they gate nothing, add no validation rule, and never conflate with readiness. §29.5's hard-fails ("treats warnings and blockers as the same thing", "lets a warning gate …") are not engaged because a chip is neither a warning nor a blocker; Save/Preview/Generate gating is untouched.
5. Adjacent-behavior classification: the `RequirednessMarker` change is a **behavior-preserving** refactor (extract-and-reuse), not a behavior change — a required consequence of removing the duplicated rule (§20: cited, no silent retcon). It is asserted unchanged across all four `requiredness` values × both generation contexts.

## Architecture Check

1. One exported `isRequiredNow` predicate eliminates the duplicated required-now rule, so the marker and the chip can never disagree. The section-fill helper is a pure function over `(draft, generationContext)` returning per-section counts — unit-testable without a DOM, which the spec calls out as the natural seam for the otherwise-untestable scroll-spy rail.
2. No backwards-compatibility aliasing/shims: `RequirednessMarker` is refactored in place to call the new predicate; no parallel copy of the rule is left behind.

## Verification Layers

1. `isRequiredNow` truth table over `{always, continuation, conditional, optional} × {first_segment, continuation_after_accepted_segment}` → unit test (`section-fill.test.ts`).
2. `RequirednessMarker` rendered output is identical before/after the refactor for every combination → render test (`RequirednessMarker.test.tsx`).
3. Section-fill computation — required counting incl. continuation context switching; "filled"/"empty" semantics, never "valid"/"ready" → unit test + grep-proof that the helper's chip-tone/label strings contain "filled"/"empty"/"required" and not "valid"/"ready".

## What to Change

### 1. `isRequiredNow` predicate (new)

Create `packages/web/src/generation-brief/requiredness-now.ts` exporting `isRequiredNow(requiredness: FieldRequiredness | undefined, generationContext: GenerationContext): boolean` — `true` for `always`, or for `continuation` when `generationContext === "continuation_after_accepted_segment"`; `false` otherwise.

### 2. Section-fill helper (new)

Create `packages/web/src/generation-brief/section-fill.ts`: a pure function mapping each of the 8 brief sections to a fill descriptor computed from the draft plus `getFieldGuidance(path).requiredness` filtered by `isRequiredNow`. For a section with required fields, report `{ requiredFilled, requiredTotal }` and a tone (success when all required filled, amber when any required empty); for a section with no required fields, report a neutral `{ filled }` count. The helper returns data only (counts + tone enum), not rendered strings that assert validity.

### 3. Refactor `RequirednessMarker`

Update `RequirednessMarker.tsx` so its `*`-required branches call `isRequiredNow` instead of re-testing `requiredness`/`generationContext` inline. Output unchanged.

## Files to Touch

- `packages/web/src/generation-brief/requiredness-now.ts` (new)
- `packages/web/src/generation-brief/section-fill.ts` (new)
- `packages/web/src/generation-brief/section-fill.test.ts` (new)
- `packages/web/src/generation-brief/RequirednessMarker.test.tsx` (new)
- `packages/web/src/generation-brief/RequirednessMarker.tsx` (modify)

## Out of Scope

- The `SectionRail` component, anchors, scroll-spy, and chip rendering (SPEC017GENBRIVIS-004) — this ticket ships the logic the rail consumes.
- Any change to readiness/validation logic or gating; chips never gate.
- Wiring chips into the page UI or any CSS.

## Acceptance Criteria

### Tests That Must Pass

1. `section-fill.test.ts`: `isRequiredNow` matches the truth table; a section with a `continuation`-required field empty is `amber` under `continuation_after_accepted_segment` and not counted required under `first_segment`.
2. `RequirednessMarker.test.tsx`: rendered marker is identical to pre-refactor output for all four `requiredness` values in both contexts.
3. `npm test --workspace @loom/web` and `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. `isRequiredNow` is the only place the "currently-required" rule is expressed; `RequirednessMarker` and the section-fill helper both call it.
2. The section-fill helper returns advisory fill data only — no value it produces asserts validity/readiness.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/section-fill.test.ts` — `isRequiredNow` truth table + section-fill counting incl. continuation switching.
2. `packages/web/src/generation-brief/RequirednessMarker.test.tsx` — behavior-preservation across `requiredness × context`.

### Commands

1. `npm test --workspace @loom/web -- section-fill`
2. `npm test --workspace @loom/web -- RequirednessMarker`
3. `npm run lint && npm run typecheck && npm test`
