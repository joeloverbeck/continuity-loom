# ONSTAGEJOIN-001: Comma-join onstage/offstage entity reference lists in the prompt

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` (`renderEntityReferenceList`); golden prompt fixtures
**Deps**: None

## Problem

In `<current_authoritative_state>`, multiple onstage entities render one-per-line instead of as a single comma-joined line. Observed in a production prompt:

```
Onstage entities: Ane Arrieta
Jon Ureña
```

This breaks the template's one-line `Onstage entities: {onstage_entities}` structure and will confuse the external LLM (the trailing lines look like new fields). The same defect affects `Offstage but pressuring entities`, because both placeholders are rendered by the same helper.

## Assumption Reassessment (2026-06-09)

1. `renderEntityReferenceList` at `packages/core/src/compiler/sections/front.ts:195-201` joins resolved labels with `"\n"`. It is used by both `onstage_entities` (`front.ts:53-57`) and `offstage_pressuring_entities` (`front.ts:63-70`).
2. Sibling helpers in the same file already use `", "`: `listLine` (`front.ts:241-247`) and `resolveEntityLabels` (`front.ts:249-266`). The single-line intent is confirmed by `prompt-template.md:90` (`Onstage entities: {onstage_entities}`) and `docs/prompt-template.md:94` (offstage line).
3. Shared boundary under audit: the deterministic prompt-compilation surface (`docs/compiler-contract.md` §4 rows `{onstage_entities}`, `{offstage_pressuring_entities}`). The contract is silent on the separator, so this is a pure rendering bug, not a contract change; `docs/compiler-contract.md` does **not** require a same-revision update for this fix (no placeholder/empty-state/requiredness/validation row changes).
4. FOUNDATIONS principle under audit: §8 deterministic compilation — the change keeps output deterministic for identical inputs; it only changes the separator.
5. Adjacent contradiction classification: the identical `offstage_pressuring_entities` defect is a **required consequence** of fixing the shared helper (one diff fixes both), not a separate ticket.

## Architecture Check

1. Fixing the single shared helper (`renderEntityReferenceList`) is cleaner than special-casing each call site and automatically aligns onstage and offstage rendering with every other comma-joined list in the file.
2. No backwards-compatibility aliasing/shims introduced; the newline behavior was a defect, not a contract.

## Verification Layers

1. Onstage list renders on one comma-joined line -> schema validation (prompt-section conformance against `docs/compiler-contract.md` / `docs/prompt-template.md`) via golden test.
2. Offstage pressuring list renders on one comma-joined line -> golden test assertion in the same suite.
3. No other call site relied on newline-joined entity lists -> codebase grep-proof (`renderEntityReferenceList` has exactly two callers).

## What to Change

### 1. Join separator

In `packages/core/src/compiler/sections/front.ts`, change `renderEntityReferenceList` to join with `", "` instead of `"\n"`, matching `listLine`/`resolveEntityLabels`.

### 2. Golden fixtures

Update any golden prompt fixture that currently encodes newline-separated onstage/offstage entities so the expected output is comma-joined.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify, if it asserts onstage/offstage multi-entity output)
- `packages/core/test/compiler-front-sections.test.ts` (modify/add — direct assertion on the join)

## Out of Scope

- Any change to which entities are selected/onstage, or to label resolution (`resolveRecordLabel`).
- Empty-state behavior of these lines (unchanged).
- The `<pov_knowledge_constraints>` and `<hard_canon>` sections (separate tickets).

## Acceptance Criteria

### Tests That Must Pass

1. A compiler test with two onstage entities asserts the rendered line is exactly `Onstage entities: <A>, <B>` (single line, no embedded newline).
2. A compiler test with two offstage pressuring entities asserts a single comma-joined `Offstage but pressuring entities:` line.
3. `npm test` (builds `@loom/core` then runs Vitest) passes.

### Invariants

1. `renderEntityReferenceList` joins with `", "` and is the only entity-reference list renderer for current-state entity arrays.
2. Compilation remains deterministic for identical inputs/versions (FOUNDATIONS §8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — assert single-line comma join for onstage and offstage entity lists.
2. `packages/core/test/compiler-golden.test.ts` — refresh expected golden output for any multi-entity fixture.

### Commands

1. `npm test -- compiler-front-sections`
2. `npm test`

## Outcome

Completed: 2026-06-09

Changed `packages/core/src/compiler/sections/front.ts` so `renderEntityReferenceList` joins resolved current-state entity labels with `", "` instead of newlines. This fixes both `Onstage entities:` and `Offstage but pressuring entities:` because both placeholders use the shared helper.

Added a regression assertion in `packages/core/test/compiler-front-sections.test.ts` covering two onstage entities and two offstage pressuring entities as single comma-joined prompt lines, and refreshed `packages/core/test/golden-first-segment.prompt.txt` for the demo prompt.

Deviations from original plan: none. No compiler-contract or schema update was required because the placeholder mapping, requiredness, and empty-state behavior did not change.

Verification:

- `npm test -- compiler-front-sections` passed.
- `npm test -- compiler-golden` passed after refreshing the golden fixture.
- `npm test` passed.
- `rg -n "renderEntityReferenceList" packages/core/src/compiler/sections/front.ts packages/core/test/compiler-front-sections.test.ts` confirmed the helper is used only by the onstage and offstage current-state resolvers.
