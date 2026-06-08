# PROMPTLABEL-002: Stop editor-truncated `displayLabel` from leaking into compiled prompt sections

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` deterministic compiler (`pressure.ts`, `cast.ts`) and the label-derivation helper in `editor-descriptors.ts`; pressure + cast section tests
**Deps**: PROMPTLABEL-001 (shares the principle that `metadata.displayLabel` must not be prompt text; no code dependency, but land after to keep `<physical_continuity>` out of this ticket's scope)

## Problem

`record.metadata.displayLabel` is an editor-list affordance truncated to 77 chars + `...` (`truncateLabel`, `packages/core/src/records/editor-descriptors.ts:439-441`, via `deriveDisplayLabel`, lines 163-173). Several compiled prompt sections render this truncated label as prompt text, so generated prompts contain `...`-truncated sentences for records whose label field is a full sentence:

- `packages/core/src/compiler/sections/pressure.ts:134` — `compactParts([displayLabel(record), project(record, payload)])`, where the rendered records include `CONSEQUENCE` (`labelFieldsByType["CONSEQUENCE"] = ["current_effect"]`) and `OBLIGATION` (`["terms"]`) — full sentences.
- `packages/core/src/compiler/sections/cast.ts` — voice pins (`displayLabel(record)` at line 57) and compressed bands (line 89) for `CAST MEMBER`, whose label field is `identity.one_line` (`labelFieldsByType["CAST MEMBER"] = ["identity.one_line", "entity_id"]`) — a one-line description that can exceed 80 chars. In the compressed band the truncated `displayLabel` is additionally followed by the **full** `identity.one_line` (`cast.ts:88-91`), duplicating the same field.

This violates FOUNDATIONS §8 (the compiler is a deterministic renderer): a truncated `...` is never a truthful rendering of present data. PROMPTLABEL-001 removes this leak from `<physical_continuity>`; this ticket closes the remaining sites.

## Assumption Reassessment (2026-06-08)

1. `pressure.ts:134` and `pressure.ts:192-193` confirm pressure prepends `record.metadata?.displayLabel ?? record.id` to every pressure line. `cast.ts:57`, `cast.ts:89`, and `cast.ts:236-237` confirm the same truncated-`displayLabel`-as-prompt-text pattern in voice pins and compressed bands. Confirmed.
2. `editor-descriptors.ts:163-173` (`deriveDisplayLabel`) always routes through `truncateLabel` (lines 439-441), and is exported from `@loom/core` (`packages/core/src/index.ts:64`). There is currently **no** untruncated label-derivation export. The stored `record.metadata.displayLabel` is therefore always the truncated form; an untruncated prompt label must be re-derived from `record.payload` via `labelFieldsByType`. Confirmed.
3. Shared boundary under audit: the label-derivation contract in `editor-descriptors.ts` (`labelFieldsByType` + `deriveDisplayLabel`/`truncateLabel`) consumed by both the editor/UI path (which wants truncation) and the compiler path (which must not truncate). The end-state separates these: editor keeps `deriveDisplayLabel` (truncated); the compiler gets an untruncated derivation over the same `labelFieldsByType` source.
4. FOUNDATIONS principle under audit: §8 deterministic renderer + §4.4. Truncated `...` in prompt text is a non-truthful rendering; re-deriving the full label is pure deterministic formatting (no LLM, no invented facts). The fix removes content loss, it does not add or infer data.
5. Deterministic-compilation surface: changes formatting of already-present, already-validated records only. No new blocker, no schema change, no effect on the secret firewall (§15) or validation gating.
6. Information-path note (README check #8): the same label fact is currently transported two ways into the prompt — via stored `metadata.displayLabel` (truncated) and, in the compressed cast band, via the raw `identity.one_line` payload field. Canonical end-state: the compiler derives its prompt label from the payload (untruncated); where the body already renders the same field (compressed band `identity.one_line`), the redundant prefix is removed rather than un-truncated, mirroring PROMPTLABEL-001's de-duplication.

## Architecture Check

1. Adding one untruncated label-derivation path for the compiler (over the existing `labelFieldsByType` source) is cleaner than widening `truncateLabel`'s cap, which would corrupt editor-list ergonomics, or than special-casing each section, which would scatter the rule. Editor lists keep truncation; the deterministic prompt always gets full text. Where the truncated prefix merely duplicates a field the body already renders (compressed cast band), removal is preferred over re-deriving, eliminating the duplication at the same time.
2. No backwards-compatibility aliasing or shims. `deriveDisplayLabel` keeps its truncating contract for the editor; the compiler stops calling the truncated stored label. No dual label authority is introduced — both derivations share `labelFieldsByType` as the single field-mapping source.

## Verification Layers

1. No compiled `pressure.ts` or `cast.ts` section line contains a `...` truncation marker for a long label field -> manual review + golden snapshot diff
2. Compressed cast band renders `identity.one_line` exactly once -> schema validation (prompt-section conformance, `docs/compiler-contract.md` cast-band rows) + section test
3. Editor-list label derivation still truncates to the documented cap -> codebase grep-proof (`deriveDisplayLabel`/`truncateLabel` unchanged, still 77+`...`) + existing editor-descriptor test coverage
4. The untruncated compiler label derives from the same `labelFieldsByType` source as the editor label (single field-mapping authority) -> codebase grep-proof

## What to Change

### 1. Provide an untruncated label derivation for the compiler

In `editor-descriptors.ts`, expose an untruncated counterpart of `deriveDisplayLabel` (same `labelFieldsByType` lookup, without the `truncateLabel` step) — e.g. a `deriveFullLabel(type, payload)` export, or a parameter on the existing function that skips truncation. Keep `deriveDisplayLabel`'s truncating behavior intact for editor/UI consumers.

### 2. Use the untruncated label in pressure and cast prompt rendering

Replace the `displayLabel(record)` (truncated `metadata.displayLabel`) prompt usages in `pressure.ts:134` and `cast.ts:57` with the untruncated derivation over `record.payload`. In the compressed cast band (`cast.ts:88-91`), remove the redundant leading label prefix (the body already renders the full `identity.one_line`) rather than un-truncating it. Confirm each section's local `displayLabel` helper has no remaining caller; delete if unused.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify — add untruncated derivation)
- `packages/core/src/index.ts` (modify — export the new helper if added)
- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `packages/core/src/compiler/sections/cast.ts` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/compiler-cast-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify — regenerate if the golden fixture exercises affected records)

## Out of Scope

- `<physical_continuity>` rendering and its reference resolution (PROMPTLABEL-001).
- Any change to `truncateLabel`'s cap or to editor-list / UI label rendering.
- Resolving reference UUIDs in pressure/cast sections (none of the in-scope prompt-text prefixes here are reference fields; if discovered, file a follow-up).

## Acceptance Criteria

### Tests That Must Pass

1. A pressure-section test with a `CONSEQUENCE`/`OBLIGATION` record whose label field exceeds 80 chars asserts the compiled line contains the full text and no `...` marker.
2. A cast-section test with a `CAST MEMBER` whose `identity.one_line` exceeds 80 chars asserts the compressed band renders it once, fully, with no `...`.
3. An editor-descriptor test asserts `deriveDisplayLabel` still truncates to 77 chars + `...` (editor behavior unchanged).
4. `npm test` passes.

### Invariants

1. No compiled prompt section emits `record.metadata.displayLabel` (the truncated editor affordance) as prompt text.
2. The compiler's untruncated label and the editor's truncated label share `labelFieldsByType` as their single field-mapping source.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — long-label `CONSEQUENCE`/`OBLIGATION` case asserting full text + no `...`.
2. `packages/core/test/compiler-cast-sections.test.ts` — long `identity.one_line` case asserting single full rendering in the compressed band and untruncated voice-pin identity.
3. `packages/core/test/records.test.ts` (or the existing editor-descriptor test) — assert `deriveDisplayLabel` truncation is unchanged.

### Commands

1. `npm test --workspace @loom/core -- compiler-pressure-sections compiler-cast-sections`
2. `npm test`
3. `npm run typecheck && npm run lint` — confirms the new helper respects the `@loom/core` import boundary and types.

## Outcome

Completed: 2026-06-08

Added `deriveFullDisplayLabel` in `packages/core/src/records/editor-descriptors.ts` so compiler prompt labels and editor display labels share the same `labelFieldsByType` mapping while preserving editor truncation in `deriveDisplayLabel`.

Updated the compiler prompt label helper to use full label derivation, then routed pressure and cast prompt rendering through it. Removed the redundant compressed-cast leading display-label prefix so `identity.one_line` renders once in compressed notes.

Updated pressure, cast, editor-descriptor, and golden prompt tests to prove long prompt labels render fully, compressed cast identity is not duplicated, and editor labels still truncate to `77 + "..."`.

Deviations: the detailed `active_obligations_and_consequences` lines already rendered payload text rather than metadata labels, so the regression coverage asserts that long obligation/consequence payload text remains full there and uses a long `PLAN.objective` for the pressure-prefix path.

Verification:

- `npm test --workspace @loom/core -- compiler-pressure-sections compiler-cast-sections editor-descriptors` — passed
- `npm test` — passed
- `npm run typecheck` — passed
- `npm run lint` — passed
