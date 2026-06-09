# HARDCANONOMIT-001: Omit `<hard_canon>` when empty (requires FOUNDATIONS amendment)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small (code) + constitutional amendment (sign-off-gated)
**Engine Changes**: Yes — `docs/FOUNDATIONS.md` (§9 + §29.4 amendment), `packages/core/src/compiler/compile-prompt.ts`, `docs/compiler-contract.md`, `docs/prompt-template.md`
**Deps**: None. The §A amendment was **signed off by the user on 2026-06-09** — the constitutional gate is cleared. Apply §A atomically with the code change (§1–§3) in a single revision; do not land the FOUNDATIONS edit standalone (it would leave the doc ahead of the compiler).

## Problem

When no hard canon is selected, the prompt renders a full section with a filler line:

```
<hard_canon>
None selected for this generation
</hard_canon>
```

The user wants `<hard_canon>` omitted entirely (no leftover blank line) when empty. The feed itself is correct — hard canon comes from selected `FACT` records with `fact_kind=hard_canon` (`front.ts:44-47`), and `None selected for this generation` is exactly the contract-specified empty state (`docs/compiler-contract.md:97`). The only change requested is *omission when empty*.

## ⚠️ Constitutional gate — CLEARED (signed off 2026-06-09)

Omitting `<hard_canon>` directly trips **FOUNDATIONS §29.4** hard-fail (`docs/FOUNDATIONS.md:910`): *"Does it omit one of the universal prompt contract sections other than the designated optional cast-band sections without constitutional amendment...?"* `<hard_canon>` is a universal prompt-contract section (`docs/FOUNDATIONS.md:274`); only `<present_minor_cast>` and `<offstage_relevance>` are sanctioned-omittable (`:283-284`). The user **approved the §A amendment on 2026-06-09**, so the gate is cleared. The amendment and the omission remain inseparable: apply §A in the **same revision** as the code change (§1–§3); never land the FOUNDATIONS edit on its own.

## A. FOUNDATIONS amendment — APPROVED 2026-06-09 (apply atomically with §1–§3)

This is a deliberate, user-approved constitutional change. Apply the exact wording below together with the code change in one revision.

**A1. `docs/FOUNDATIONS.md` §9 — line 274.** Replace:

```
- hard canon;
```

with:

```
- hard canon, except that this designated optional section may be deterministically omitted when no hard-canon FACT is selected and no immutable story lock is active;
```

**A2. `docs/FOUNDATIONS.md` §29.4 — line 910.** Replace:

```
- Does it omit one of the universal prompt contract sections other than the designated optional cast-band sections without constitutional amendment, or omit even a designated optional section nondeterministically?
```

with:

```
- Does it omit one of the universal prompt contract sections other than the designated optional sections enumerated in §9 (present minor cast, offstage relevance, hard canon) without constitutional amendment, or omit even a designated optional section nondeterministically?
```

Rationale: this designates `<hard_canon>` as a third deterministically-omittable section, on the same footing as the two cast-band sections, and keeps the omission **deterministic** (omit iff empty), which §29.4 still requires.

## Assumption Reassessment (2026-06-09)

1. `hard_canon` renders via the generic template path (`packages/core/src/compiler/template-constants.ts:129-131`, dispatched by `compile-prompt.ts:124-125`); empty fallback `EMPTY_STATE_CONSTANTS.hard_canon_bullets = "None selected for this generation"` (`empty-states.ts:35`).
2. Section omission is already implemented deterministically for `present_minor_cast`/`offstage_relevance` by returning `null` from `renderSection`, which is filtered out at `compile-prompt.ts:87-88` (sections joined with `\n\n`, so a dropped section leaves **no** extra blank line) — this directly satisfies the user's "without leaving any additional spaces" requirement.
3. Shared boundary under audit: the universal prompt contract (FOUNDATIONS §9, §29.4) and the deterministic compiler. Both `docs/compiler-contract.md` (§3 section order :44-47, §4 row :97, §8) and `docs/prompt-template.md` must be updated in lockstep per the contract §10 change-control rule.
4. FOUNDATIONS principle under audit: **§29.4** (above). The amendment converts an otherwise-forbidden omission into a sanctioned, deterministic one. §8 determinism preserved (omit iff no hard-canon FACT selected and no immutable lock active).
5. Hard-canon feed includes "immutable story locks" per `docs/compiler-contract.md:97`; confirm during implementation whether such locks currently flow into `hard_canon_bullets` (today `front.ts:44-47` filters only `FACT` with `fact_kind=hard_canon`). The omission predicate must match the contract's "selected hard canon exists" definition exactly so a present lock never gets silently dropped.
6. Adjacent contradiction classification: none new; this is a scoped, self-contained behavior change gated on the amendment.

## Architecture Check

1. Reuse the existing `renderSection` `null`-return + filter mechanism (the same one used for the two cast-band sections) rather than inventing new omission logic — minimal, consistent, and inherently "no extra spaces".
2. No backwards-compatibility shim; the empty-state constant `hard_canon_bullets` may remain for any debug/inspection path but is no longer emitted into the compiled prompt when empty.

## Verification Layers

1. Amendment wording is approved and applied -> manual review + FOUNDATIONS alignment check (§9 :274, §29.4 :910 updated).
2. `<hard_canon>` is omitted (tag and content absent, no double blank line) when no hard-canon FACT/lock is selected -> golden test asserting the section is absent and adjacent sections are separated by exactly one blank line.
3. `<hard_canon>` renders with bullets when at least one hard-canon FACT is selected -> golden test.
4. Omission is deterministic (same input -> same omission) -> schema validation against updated `docs/compiler-contract.md` §3/§4/§8.

## What to Change

> §A is approved (2026-06-09). Apply §A1/§A2 and §1–§3 in a single revision.

### 1. Compiler omission

In `packages/core/src/compiler/compile-prompt.ts` `renderSection`, return `null` for `hard_canon` when the resolved hard-canon content is empty (no hard-canon FACT selected and no immutable lock active), mirroring the `present_minor_cast`/`offstage_relevance` guards.

### 2. Docs in lockstep (§10 change-control)

- `docs/compiler-contract.md`: in §3 mark `<hard_canon>` as omittable-when-empty; in the §4 `{hard_canon_bullets}` row (:97) change the empty-state column to "omit whole section when empty"; add `<hard_canon>` to the §8 list of designated optional omittable sections.
- `docs/prompt-template.md`: add a note that `<hard_canon>` is omitted when no hard canon is selected (matching the cast-band omission notes at `:269`, `:277`).

### 3. FOUNDATIONS amendment

Apply §A1 and §A2 to `docs/FOUNDATIONS.md`.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify — §A, sign-off-gated)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-scaffold.test.ts` (modify, if it asserts section presence/order)

## Out of Scope

- Changing how hard canon is selected or which records feed it.
- Omitting any other universal section.
- Non-deterministic omission of any kind.

## Acceptance Criteria

### Tests That Must Pass

1. With no hard-canon FACT and no immutable lock selected, the compiled prompt contains no `<hard_canon>` tag and no extra blank line between `<prose_mode>` and `<current_authoritative_state>`.
2. With at least one hard-canon FACT selected, `<hard_canon>` renders with its bullets in section order.
3. `npm test` passes; golden fixtures refreshed.

### Invariants

1. `<hard_canon>` is omitted **iff** it is empty, deterministically (FOUNDATIONS §8, §29.4 as amended).
2. The amended FOUNDATIONS §9/§29.4 and `docs/compiler-contract.md` §3/§4/§8 agree that `<hard_canon>` is a designated optional omittable section.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-golden.test.ts` — empty-hard-canon (section absent) and populated-hard-canon (section present) cases.
2. `packages/core/test/compiler-scaffold.test.ts` — section-order assertions tolerate the optional `<hard_canon>`.

### Commands

1. `npm test -- compiler-golden`
2. `npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Applied the approved `FOUNDATIONS.md` §9 and §29.4 amendment atomically with the compiler change.
- Updated the compiler to omit `<hard_canon>` when the resolved hard-canon bullets are empty, using the existing deterministic optional-section path so no extra blank line is left between `<prose_mode>` and `<current_authoritative_state>`.
- Updated `docs/compiler-contract.md` and `docs/prompt-template.md` so `<hard_canon>` is listed as a designated optional section.
- Updated compiler golden/scaffold/front-section tests and refreshed the frozen first-segment prompt fixture.

Deviations from original plan:

- No separate immutable-lock transport was added. The omission predicate follows the existing `hard_canon_bullets` resolver, which is the current compiler authority for whether hard-canon content exists.

Verification results:

- `npm test -- compiler-golden compiler-scaffold compiler-front-sections` passed: 3 files, 34 tests.
- `npm test` passed: 99 files, 727 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
