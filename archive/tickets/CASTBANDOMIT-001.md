# CASTBANDOMIT-001: Omit empty `<present_minor_cast>` / `<offstage_relevance>` sections (with FOUNDATIONS amendment)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — **`docs/FOUNDATIONS.md` §9 + §29.4 (constitutional amendment)**, `packages/core/src/compiler/compile-prompt.ts`, `packages/core/src/compiler/sections/cast.ts`, `docs/compiler-contract.md` (rows 148-149, §8), `packages/core/test/golden-first-segment.prompt.txt`
**Deps**: None

> ⚠️ **This ticket contains a constitutional amendment to `docs/FOUNDATIONS.md`.** The amendment (Change 1) is a prerequisite for the code change and must be reviewed as a deliberate constitution change. Direction approved during brainstorm; the exact amendment wording is proposed here for review.

## Problem

When no cast is selected into the present-minor or offstage inclusion bands, the compiler still renders the entire `<present_minor_cast>` and `<offstage_relevance>` sections — each with its full multi-line instructional preamble followed by `None` (reproduced at `golden-first-segment.prompt.txt:284-294`). For the common case of a scene with no backgrounded or offstage cast, this emits instructional boilerplate that applies to nothing, spending tokens and adding low-signal context that can degrade the prose writer's focus.

The chosen remedy is to **omit the entire section** when its band is empty. Because FOUNDATIONS §9 currently lists *present minor cast* and *offstage relevance* as universal-prompt-contract sections, and §29.4 makes omitting a contract section a hard fail "without constitutional amendment," this ticket **first amends FOUNDATIONS** to permit deterministic omission of these two designated optional sections when empty, then implements the omission.

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **Both sections share one render path.** Confirmed: `packages/core/src/compiler/sections/cast.ts:33-34` maps `present_minor_cast_notes` and `offstage_relevance_notes` to `renderCompressedCastBand` (`cast.ts:81-104`), which filters `snapshot.records` by `record.castBand === "present_minor_cast_compressed"` / `"offstage_relevant_cast"` and returns `EMPTY_STATE_CONSTANTS.present_minor_cast_notes` / `.offstage_relevance_notes` (both `"None"`, `empty-states.ts:50,65`) when empty. The static section templates (`template-constants.ts:248-257`) always emit the preamble. Source is the **cast inclusion band**, not a free-text editor field.
2. **FOUNDATIONS currently forbids omission.** `docs/FOUNDATIONS.md:283-284` lists "present minor cast" and "offstage relevance" among the sections "the universal prompt must preserve"; §29.4 (line 910) asks "Does it omit one of the universal prompt contract sections without constitutional amendment?" `docs/compiler-contract.md` rows 148-149 set empty-state `None`, while §8 (lines 258-259) already permits omitting optional sections when blank if the surrounding instruction stays complete — an internal contract tension this ticket resolves. The amendment removes the §9/§29.4 conflict; the contract rows are then updated to "omit section when empty."
3. **Shared boundary under audit:** the universal-prompt-contract section set across `FOUNDATIONS.md` §9/§29.4, `compiler-contract.md` (§3 section order, rows 148-149, §8), the section-assembly loop in `compile-prompt.ts:82-111`, and `prompt-template.md`. The `compile-prompt.ts` render loop currently has **no mechanism to drop a whole static section**; this ticket adds conditional section assembly for exactly these two sections.

4. **FOUNDATIONS principle under audit:** §9 universal prompt contract and §29.4 prompt-compilation hard fails. The amendment must keep the omission *deterministic* (§8): a section is omitted only when its band is provably empty, never by model judgment, and offstage relevance remains **required** (and therefore present) whenever offstage interruption/pressure is active (`compiler-contract.md` row 149; FOUNDATIONS §29.7 "offstage interruption without communication/entrance/timing route").

5. **Deterministic-compilation surface:** omission is a pure function of `castBand` record presence in the snapshot. No LLM, no hidden state. Determinism is preserved: identical inputs → identical presence/absence of the section. Secret firewall (§15) untouched.

8. **Adjacent contradiction classification:** the `compiler-contract.md` §8-vs-rows-148/149 tension is a **required consequence** resolved here. The `offstage_relevance` *required-when-active* path (row 149 / §29.7) is **not** weakened — it is an explicit guard in this ticket (omit only when the band is empty AND not validation-required).

## Architecture Check

1. Adding conditional whole-section omission to the `compile-prompt.ts` render loop (e.g. allow `renderSection` to return `null`/`""` for these two sections when empty, and filter before joining) is cleaner than rendering-then-stripping text, and confines the new behavior to two explicitly designated sections rather than making all static sections silently omittable. This keeps the universal-section guarantee auditable.
2. No backwards-compatibility shims. The `None` empty-state constants for these two placeholders are removed from the active render path rather than retained behind a flag.

## Verification Layers

1. Empty present-minor band → no `<present_minor_cast>` tag in the prompt -> new unit test + regenerated golden.
2. Empty offstage band (and no offstage validation requirement) → no `<offstage_relevance>` tag -> new unit test + regenerated golden.
3. Populated bands still render full sections with notes -> existing assertions in `packages/core/test/compiler-cast-sections.test.ts:291-293` (updated as needed).
4. Offstage relevance still renders when offstage interruption/pressure is active -> FOUNDATIONS alignment check (§29.7) + validation-matrix test (`offstage_interruption_possible`).
5. Amendment keeps omission deterministic and section-scoped -> FOUNDATIONS alignment check (§8, §9, §29.4).

## What to Change

### 1. Amend `docs/FOUNDATIONS.md` (constitutional)

In §9, mark *present minor cast* and *offstage relevance* as **optional sections that may be deterministically omitted when their inclusion band is empty** (while every other listed section remains always-present). In §29.4, refine the hard-fail question to: "Does it omit one of the universal prompt contract sections **other than the designated optional cast bands** without constitutional amendment, **or omit even a designated optional section non-deterministically**?" Wording to be reviewed at implementation.

### 2. Conditional section assembly

In `compile-prompt.ts`, allow `<present_minor_cast>` and `<offstage_relevance>` to be omitted entirely when their band is empty. Guard: `offstage_relevance` must still render when offstage pressure/interruption is validation-active (keep parity with `compiler-contract.md` row 149).

### 3. Update `docs/compiler-contract.md`

Change rows 148-149 empty-state behavior from `None` to "omit section when empty band and not validation-required," and add a §8 bullet documenting the two designated omittable sections. Update §3 if needed to note conditional presence.

### 4. Regenerate the golden

Update `packages/core/test/golden-first-segment.prompt.txt` to drop both empty sections.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify) — §9, §29.4 amendment
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/sections/cast.ts` (modify) — signal-empty contract
- `packages/core/src/compiler/empty-states.ts` (modify) — remove the two `None` constants from the render path
- `docs/compiler-contract.md` (modify) — rows 148-149, §8
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/compiler-cast-sections.test.ts` (modify)

## Out of Scope

- Any other universal-prompt-contract section (all others remain always-present).
- Changing what selects cast into a band, or the compressed-note rendering itself.
- The composite-section "None specified" behavior of `<relevant_facts_beliefs_events>` / `<locations_objects_affordances>` (unchanged).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: empty present-minor band ⇒ compiled prompt does **not** contain `<present_minor_cast>`.
2. New unit test: empty offstage band with no active offstage requirement ⇒ prompt does **not** contain `<offstage_relevance>`.
3. New/updated test: offstage interruption active ⇒ `<offstage_relevance>` is present with content.
4. `npm run lint && npm run typecheck && npm test`.

### Invariants

1. A section is omitted only by deterministic empty-band detection, never by model judgment (FOUNDATIONS §8).
2. Every universal-prompt-contract section other than the two designated optional cast bands always renders (FOUNDATIONS §9/§29.4 as amended).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-cast-sections.test.ts` — empty-omits-section and populated-renders-section for both bands.
2. `packages/core/test/validation-matrix-*.test.ts` (offstage) — offstage-required path still renders the section.
3. `packages/core/test/golden-first-segment.prompt.txt` — regenerated.

### Commands

1. `npm test -- compiler-cast-sections`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

Implemented the constitutional and compiler-contract amendment for the two designated optional cast-band sections. The compiler now omits `<present_minor_cast>` when no present-minor cast is selected, and omits `<offstage_relevance>` only when no offstage cast is selected and no offstage pressure/interruption is active. Populated bands still render compressed notes, and offstage interruption focus keeps the offstage section present.

Updated the prompt template note, compiler scaffold/cast/golden tests, and the first-segment golden prompt.

Deviation from original plan: `offstage_relevance_notes` still has the deterministic `None` fallback for active offstage pressure/focus with no rendered notes; it is no longer used for the ordinary empty-band case.

Verification:

- `npm test -- compiler-cast-sections compiler-scaffold compiler-golden` passed.
- `npm test -- compiler-cast-sections compiler-scaffold compiler-golden compile-routes generate-routes generation-brief-draftability` passed.
- `npm run lint && npm run typecheck && npm test` passed when rerun with loopback binding allowed; the sandboxed run failed only on `listen EPERM: operation not permitted 127.0.0.1` in server loopback tests.
