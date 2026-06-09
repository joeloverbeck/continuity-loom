# OFFSTAGEREL-001: Replace the bare "None" in `<offstage_relevance>` with a useful directive

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/empty-states.ts`; `docs/compiler-contract.md`; `packages/core/test/compiler-cast-sections.test.ts`.
**Deps**: None

## Problem

`<offstage_relevance>` can render a bare `None` body — wasted, slightly misleading tokens. The section gate `shouldRenderOffstageRelevance` (`packages/core/src/compiler/compile-prompt.ts:309-317`) opens when **any** of three signals is present: (1) a cast member is in the `offstage_relevant_cast` band, (2) `current_authoritative_state.offstage_pressuring_entities` is non-empty, or (3) the `offstage_interruption_possible` focus tag is set. But the body is fed **only** by band (1) — `renderCompressedCastBand` (`packages/core/src/compiler/sections/cast.ts`), which projects `identity.one_line` + `voice_anchor.core_voice` for offstage-band cast and otherwise falls back to `EMPTY_STATE_CONSTANTS.offstage_relevance_notes` = `"None"` (`empty-states.ts:51`). So when the gate opens via (2)/(3) with no offstage cast, the section renders `None`. Compounding it, `offstage_pressuring_entities` is already rendered in `<current_authoritative_state>` ("Offstage but pressuring entities:", `compile-prompt.ts:25`), so the same fact appears once with content there and once as `None` here.

Removing the section was considered and **rejected**: FOUNDATIONS §9 (`docs/FOUNDATIONS.md:284`) permits omitting `<offstage_relevance>` *only* "when no offstage cast is selected **and** no offstage pressure or interruption is active," and §29.4 (`:910`) hard-fails on nondeterministic omission of a universal section. Because a bare `None` only appears when pressure/interruption *is* active, omitting then would violate §9, trip §29.4, and weaken the §368/§938 rule that validation must block offstage interruption lacking entrance/route/timing. The user-approved fix therefore **keeps the section present** and replaces the bare `None` with a short directive, turning wasted tokens into a useful authoring/writer instruction.

## Assumption Reassessment (2026-06-09)

1. Body source confirmed: `EMPTY_STATE_CONSTANTS.offstage_relevance_notes = "None"` (`packages/core/src/compiler/empty-states.ts:51`), consumed by `renderCompressedCastBand` in `packages/core/src/compiler/sections/cast.ts` (`lines.join("\n") || emptyState`). Gate is `compile-prompt.ts:309-317`; `offstage_pressuring_entities` also renders at `compile-prompt.ts:25`. There is **no dedicated editor field** for offstage relevance — it is populated solely via the cast-band dropdown ("offstage relevance" option) in `packages/web/src/working-set/WorkingSetView.tsx:235-244`; dossier text lives in `CastMemberEditor`.
2. Docs: `compiler-contract.md:150` declares the feed "ENTITY/CAST selected offstage + offstage pressure records" and "the section remains present even when validation will block missing route/timing/communication"; `:102` ("Offstage relevance section may expand"); `:265` (omission rule). FOUNDATIONS §9 (`:284`), §29.4 (`:910`), §368/§938 (offstage interruption requires entrance/route/timing).
3. Shared boundary under audit: the deterministic prompt-compilation surface (`{offstage_relevance_notes}` empty-state + the `<offstage_relevance>` section contract). Change is text-only to the empty-state constant; the gate and section presence are unchanged.
4. Motivating principle (FOUNDATIONS §9 + §29.4): the section's presence under active offstage pressure/interruption is a deliberate, deterministic authoring-forcing affordance. Restated: keep the section deterministically present; make its empty body informative rather than a bare `None`.
5. Deterministic-compilation surface touched: only the empty-state **string** changes. The gate (`shouldRenderOffstageRelevance`) and the §29.4 omission logic (`compile-prompt.ts:110-112`) are untouched, so section presence stays deterministic and no universal section is omitted. No secret-firewall (§15) impact.
6. Touches the `{offstage_relevance_notes}` prompt-section empty-state. Additive/replacement of a constant string; consumers: `cast.ts` render path and `packages/core/test/compiler-cast-sections.test.ts:332` (which asserts the body `.toContain(EMPTY_STATE_CONSTANTS.offstage_relevance_notes)` — it compares against the constant, so it stays coherent after the value changes, but must be extended to assert the directive renders in the gate-open-no-cast case).
8. Adjacent contradiction: `compiler-contract.md:150` says the feed includes "offstage pressure records," which the compiler never renders. Implementing that content expansion would be **new behavior** (a future spec), so it is **out of scope**; the directive covers the gap deterministically without adding a new feed.

## Architecture Check

1. Changing the single `EMPTY_STATE_CONSTANTS.offstage_relevance_notes` source propagates to every consumer of the empty-state, with no new branch or gate logic. The directive is only ever reached when the section is already (correctly) rendered and the offstage band is empty — i.e. exactly the bare-`None` case — so behavior for offstage-cast-present and gate-closed cases is unchanged.
2. No backwards-compatibility shim: one constant, one authority path.

## Verification Layers

1. Gate open via offstage pressure/interruption with **no** offstage cast → body renders the directive, not `None` → `@loom/core` compiler test.
2. Gate open **with** offstage cast → body renders the cast slices; directive absent → existing/extended test.
3. Gate closed (no offstage cast, no offstage pressure, no interruption tag) → `<offstage_relevance>` section is omitted entirely (returns `null`), leaving no gap (sections join with `\n\n`, nulls filtered) → existing omission test.
4. §29.4 determinism: section presence/omission rule unchanged → prompt-fingerprint/golden snapshot unchanged except for the substituted empty-state text.

## What to Change

### 1. `packages/core/src/compiler/empty-states.ts`

Replace `offstage_relevance_notes: "None"` (`:51`) with a concise directive, exact text (pinned by the golden test):

`Offstage pressure or interruption is active, but no offstage cast slice has been authored. Establish why the offstage party matters now, whether and how it can interrupt (entrance, communication, timing, or route), and what must not be revealed or assumed.`

### 2. `docs/compiler-contract.md`

Update the `{offstage_relevance_notes}` row (`:150`) empty-state/Notes cells: when the section gate opens via offstage pressure/interruption with no offstage cast selected, the body renders the directive above (not `None`); the section is still omitted only per §9 (no offstage cast **and** no offstage pressure/interruption). Note that rendering the contract's "offstage pressure records" as body content is not yet implemented and is deferred.

### 3. `packages/core/test/compiler-cast-sections.test.ts`

Extend the offstage-relevance coverage (currently `:332`) to assert: (a) gate-open-no-cast renders the directive text; (b) gate-open-with-cast renders cast slices and not the directive; (c) gate-closed omits the section.

## Files to Touch

- `packages/core/src/compiler/empty-states.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-cast-sections.test.ts` (modify)

## Out of Scope

- Omitting/removing the `<offstage_relevance>` section when empty (rejected — violates FOUNDATIONS §9/§29.4 when pressure/interruption is active).
- Changing the gate conditions in `shouldRenderOffstageRelevance`.
- Implementing the contract's "offstage pressure records" as body content (new behavior; future spec).
- The `offstage_pressuring_entities` duplication between `<current_authoritative_state>` and the offstage gate (separate concern; not addressed here).

## Acceptance Criteria

### Tests That Must Pass

1. Gate-open-no-cast compiles `<offstage_relevance>` with the directive body (exact text) and no `None`.
2. Gate-open-with-cast compiles the cast slices; gate-closed omits the section with no residual blank line.
3. `npm test`, `npm run lint`, `npm run typecheck` all pass.

### Invariants

1. `<offstage_relevance>` is omitted if and only if there is no offstage cast **and** no offstage pressure/interruption (FOUNDATIONS §9 / §29.4) — unchanged by this ticket.
2. The empty-state directive is the single source of truth for the empty offstage body.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-cast-sections.test.ts` — directive on gate-open-no-cast; cast slices on gate-open-with-cast; omission on gate-closed.

### Commands

1. `npm test` (targeted: `compiler-cast-sections.test.ts`)
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Replaced the `{offstage_relevance_notes}` empty state with the pinned directive so gate-open/no-offstage-cast prompts no longer render a bare `None`.
- Updated `docs/compiler-contract.md` to document the directive body, the unchanged omission rule, and the deferred status of rendering offstage pressure records as section body content.
- Extended `packages/core/test/compiler-cast-sections.test.ts` for gate-open/no-cast directive rendering, gate-open/with-cast directive absence, and gate-closed omission.
- Updated `packages/core/test/golden-first-segment.prompt.txt` for the intentional prompt-text change.

Deviations from original plan:

- The frozen golden prompt required an expected-baseline update because the directive text appears in the first-segment fixture.
- The pressure-path test uses a complete `current_authoritative_state` fixture to satisfy current TypeScript schema requirements.

Verification results:

- `npm test -- packages/core/test/compiler-cast-sections.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
