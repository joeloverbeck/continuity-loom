# RELFIELD-001: Compile RELATIONSHIP `current_expression` into the relationship/emotion pressure line

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`, `docs/compiler-contract.md` (row 136), `packages/core/test/compiler-pressure-sections.test.ts`, `packages/core/test/golden-first-segment.prompt.txt`
**Deps**: None

## Problem

`current_expression` is a **required** prose field on every RELATIONSHIP record (`packages/core/src/records/relationship-emotion.ts:41`, `current_expression: nonemptyString`), but the compiler **never reads it**. The `relationship_emotion_pressure` resolver projects:

```ts
(record, payload) => firstText(payload, ["pressure_text", "surface_expression", "description"])
```

(`packages/core/src/compiler/sections/pressure.ts:30`). `firstText` returns the **first** non-empty field, and `pressure_text` is itself a required `nonemptyString`, so for a RELATIONSHIP record `pressure_text` *always* wins and `current_expression` is silently discarded. The author is forced to fill a field whose content never reaches the prose prompt — a data-loss defect.

This is an **asymmetry**, not a design choice: EMOTION's analogous visible-manifestation field `surface_expression` *is* in the list and *does* compile (`relationship-emotion.ts:98`); RELATIONSHIP's `current_expression` was simply never wired in. The current compiled relationship line therefore carries only two of the three prose fields the docs require — `description` (rendered as the line's display label; `labelFieldsByType.RELATIONSHIP = ["description"]`, `packages/core/src/records/editor-descriptors.ts:134`) and `pressure_text` — observable in the committed golden at `packages/core/test/golden-first-segment.prompt.txt:203`:

```
- They trust each other's decency but disagree over whether protection justifies concealment.; Their affection makes every evasion feel personal.
```

The demo record that produces that line already stores a `current_expression` ("Niko asks to be trusted; Elin tries to protect him by withholding the worst fact." — `packages/core/src/demo/letter-under-flour-bin.ts:522`) that never appears.

This contradicts the active prompt-treatment authority:

- `docs/story-record-schema.md:871` — "Compile `description`, `pressure_text`, and `current_expression`, not raw axes alone."
- `docs/prompt-template-rationale.md:138` — the compiler "should render `description`, `pressure_text`, `current_expression`, `behavioral_pressure`, and `surface_expression` when nuance matters."

The docs are correct; the code is behind. The fix renders `current_expression` **in addition to** `pressure_text` (chosen rendering: a bare third `; `-joined clause, consistent with the existing compact pressure-summary style).

## Assumption Reassessment (2026-06-09)

<!-- Items 1-3 always required. -->

1. **`current_expression` is required and never consumed.** Confirmed: `relationshipSchema` declares `current_expression: nonemptyString` (`packages/core/src/records/relationship-emotion.ts:41`); a repo search for `current_expression` under `packages/core/src/compiler/` returns zero hits. The only consumer of RELATIONSHIP/EMOTION prose is `relationship_emotion_pressure` (`packages/core/src/compiler/sections/pressure.ts:26-32`), whose `firstText` list omits it (`:30`). Because `pressure_text` is required, the `surface_expression`/`description` fallbacks are already unreachable for RELATIONSHIP, so appending `current_expression` to the same `firstText` list would **not** fix it — composition is required.
2. **The docs already mandate compilation.** `docs/story-record-schema.md:871` and `docs/prompt-template-rationale.md:138` both list `current_expression` as prompt-facing. No `docs/FOUNDATIONS.md` amendment is needed; §18 ("render as pressure text and current expression, not raw axes alone") is the principle this restores. `docs/compiler-contract.md:136` row text ("rendered as pressure text") is stale and must be widened.
3. **Shared boundary under audit:** the `relationship_emotion_pressure` resolver is shared by RELATIONSHIP and EMOTION via `pressureFromRecords` (`packages/core/src/compiler/sections/pressure.ts:126-138`). The change must leave EMOTION output **byte-identical** (EMOTION has no `current_expression` field — `emotionSchema`, `:45-100`), so EMOTION golden lines (`golden-first-segment.prompt.txt:201-202`) must not move.
6. **Schema/consumer note (additive-read only):** this ticket reads an existing required field; it does not change `relationshipSchema` or any stored shape. The only consumer affected is the compiler. No persisted data migrates.
8. **Adjacent contradiction (classified as out of scope, not a separate bug here):** `description` is reachable only as the display label, never via the `firstText` body fallback, for both RELATIONSHIP and EMOTION. This is *correct* (it already compiles as the label, satisfying §9.1:871 for `description`), so no change is needed; it is documented here to prevent a future "description is also dead" misread. Clarifying field-help guidance for this is RELFIELD-002, not this ticket.

## Architecture Check

1. Composing `pressure_text` + `current_expression` (rather than extending the `firstText` priority list) is the only correct fix: `firstText` is a first-match-wins selector suited to *alternative* optional fields, but `pressure_text` and `current_expression` are *complementary* required fields with distinct meaning (live actionable pressure vs. visible behavioral manifestation). Composition via the existing `compactParts` helper reuses in-file machinery and keeps EMOTION (no `current_expression`) unchanged because `compactParts` drops empty parts.
2. No backwards-compatibility alias or shim is introduced; the resolver projection is edited in place and the golden is regenerated to the new truth.

## Verification Layers

1. RELATIONSHIP `current_expression` reaches the prompt -> new assertion in `compiler-pressure-sections.test.ts` (fixture relationship gains a distinct `current_expression`; assert the string appears in `active_working_set`).
2. EMOTION output is unchanged -> golden diff shows only the RELATIONSHIP line(s) move; EMOTION lines (`golden:201-202`) byte-identical.
3. `pressure_text` still compiles (no regression) -> existing assertion `toContain("Old resentment makes every favor feel costly.")` (`compiler-pressure-sections.test.ts:389`) still passes.
4. Doc/code agreement -> `docs/compiler-contract.md` row 136 names `description`, `pressure_text`, and `current_expression` (FOUNDATIONS alignment check against §9.1:871).

## What to Change

### 1. Compose `current_expression` in the relationship/emotion projection

In `packages/core/src/compiler/sections/pressure.ts`, change the `relationship_emotion_pressure` projection (`:30`) from the first-match selector to a composition of the primary pressure field and `current_expression`:

```ts
relationship_emotion_pressure: (snapshot) =>
  pressureFromRecords(
    snapshot,
    ["RELATIONSHIP", "EMOTION"],
    (record, payload) =>
      compactParts([
        firstText(payload, ["pressure_text", "surface_expression", "description"]),
        asString(payload.current_expression)
      ]),
    "relationship_emotion_pressure"
  ),
```

`compactParts` (`:203`) and `asString` (`:216`) already exist in-file. For RELATIONSHIP this yields `<pressure_text>; <current_expression>`; for EMOTION (no `current_expression`) `asString` returns `""` and `compactParts` drops it, leaving `<surface_expression>` unchanged. The outer `compactSummaryLine(displayLabel, projected)` then produces the final line `- <description>; <pressure_text>; <current_expression>`.

### 2. Widen the compiler-contract row

In `docs/compiler-contract.md`, row 136, change the rendering note from "Selected RELATIONSHIP/EMOTION records rendered as pressure text" to name all three prose fields, e.g. "rendered as the description label plus pressure text and (RELATIONSHIP) current expression". Keep the "Avoid raw axes alone." cell.

### 3. Extend the test fixture and assert

In `packages/core/test/compiler-pressure-sections.test.ts`, give the RELATIONSHIP fixture a distinct `current_expression` value and add an assertion that it appears in the `active_working_set` body, alongside the existing `pressure_text` assertion.

### 4. Regenerate the golden

Regenerate `packages/core/test/golden-first-segment.prompt.txt` so line 203 includes the demo record's `current_expression`. Confirm the diff is limited to the RELATIONSHIP line(s).

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify — row 136)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify — regenerate)

## Out of Scope

- Field-help / `i`-button guidance content (RELFIELD-002).
- Any change to `relationshipSchema`, `emotionSchema`, or stored data.
- De-duplicating the rare case where an author writes identical `pressure_text` and `current_expression` prose (an authoring concern; `compactParts` does not dedupe distinct parts, matching the rest of the compact pressure style).
- `description`'s role as display label (already correct; no change).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/core` — new `current_expression` assertion passes; existing `pressure_text` assertion (`compiler-pressure-sections.test.ts:389`) still passes.
2. Golden test passes after regeneration; the committed golden diff is confined to the RELATIONSHIP pressure line(s); EMOTION lines unchanged.
3. `npm run lint && npm run typecheck && npm test` — full gate green.

### Invariants

1. Every RELATIONSHIP record with a non-empty `current_expression` contributes that text to `{relationship_emotion_pressure}` in the compiled prompt.
2. EMOTION compilation output is unchanged by this ticket (no `current_expression` field exists on EMOTION).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — add a distinct `current_expression` to the relationship fixture and assert it appears in `active_working_set`; this is the direct regression guard for the dead-field defect.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated; locks the composed line shape end-to-end.

### Commands

1. `npm test -w @loom/core`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-09.

What changed:

- `relationship_emotion_pressure` now composes RELATIONSHIP `pressure_text` with `current_expression`, while EMOTION records remain on the existing `surface_expression` path.
- `docs/compiler-contract.md` now names the RELATIONSHIP description label, pressure text, and current expression rendering.
- `compiler-pressure-sections.test.ts` asserts a distinct RELATIONSHIP `current_expression` reaches the active working set.
- `golden-first-segment.prompt.txt` now includes the demo RELATIONSHIP current expression in the relationship/emotion pressure line.

Deviations from original plan:

- None.

Verification:

- `npm test -w @loom/core` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
