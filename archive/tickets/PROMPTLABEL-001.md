# PROMPTLABEL-001: Resolve reference labels and drop duplicated/truncated identity prefix in `<physical_continuity>`

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` deterministic compiler (`packages/core/src/compiler/sections/records-tail.ts`); golden + tail-section tests
**Deps**: None

## Problem

The compiled `<physical_continuity>` block has three user-visible defects, all originating in `renderPhysicalContinuity` / `physicalRecordText` (`packages/core/src/compiler/sections/records-tail.ts:143-188`):

1. **Truncated sentences.** Each record line is prefixed with `displayLabel(record)` (line 163), which returns `record.metadata.displayLabel`. For an `ENTITY STATUS` record that label is derived from `current_activity` (`labelFieldsByType["ENTITY STATUS"] = ["current_activity", "entity_id"]`, `editor-descriptors.ts:121`) and truncated to 77 chars + `...` by `truncateLabel` (`editor-descriptors.ts:439-441`). The prompt therefore prints `…bought a Cormac McCarthy n...`.
2. **Raw UUIDs instead of names.** `physicalRecordText` renders `entity: <entity_id>` and `location: <location>` (lines 175-177) as raw reference UUIDs (`019ea213-…`). `docs/compiler-contract.md` (lines 95, 128-129, 272) requires prompt-facing id-derived fields to resolve to the referenced record's human display label, with a raw-id fallback **only** when the referenced record is absent from the snapshot.
3. **Duplication.** Line 163 is `compactParts([displayLabel(record), physicalRecordText(record, payload)])`. For a `LOCATION`, `displayLabel(record)` is `payload.label` and `physicalRecordText` (line 183) also leads with `asString(payload.label)`, so the label prints twice (`Jon Ureña's home; Jon Ureña's home;`). For an `ENTITY STATUS` the same prefix repeats the activity (once truncated as the prefix, once full as `activity:`).

The redundant `displayLabel(record)` prefix is the shared cause of defects 1 and 3 inside this section; defect 2 is an independent failure to adopt the established reference-resolution contract.

## Assumption Reassessment (2026-06-08)

1. `renderPhysicalContinuity` (`packages/core/src/compiler/sections/records-tail.ts:143-168`) builds each record line as `compactParts([displayLabel(record), physicalRecordText(record, payload)])` (line 163); the local `displayLabel` (line 249-251) returns `record.metadata?.displayLabel ?? record.id`. `physicalRecordText` (line 170-188) renders `entity_id`, `location`, etc. via `labelValue`, which prints the raw value. Confirmed.
2. The established reference→label resolver already exists in the same compiler at `packages/core/src/compiler/sections/front.ts:256-264` (`resolveEntityLabel`: finds `snapshot.records` by id, returns its `displayLabel`, falls back to the raw id). `docs/compiler-contract.md:272` states raw ids in resolved lines mean the referenced record was absent from the snapshot. Confirmed. This ticket reuses that pattern; it must NOT introduce a second divergent resolver — see Architecture Check.
3. Shared boundary under audit: the `ENTITY STATUS.entity_id` / `ENTITY STATUS.location` reference fields (referenceTargetsByRole: `entity_id → ["ENTITY"]`, `editor-descriptors.ts:97`) and the prompt-section contract for `{physical_continuity}` (`docs/compiler-contract.md:161`). `ENTITY` records carry a short `display_name` label field (`labelFieldsByType["ENTITY"] = ["display_name"]`), so resolved entity labels are not themselves at truncation risk; `LOCATION` labels (`["label"]`) are likewise short in practice but are covered by PROMPTLABEL-002's untruncated path if ever long.
4. FOUNDATIONS principle under audit: §8 "the prompt compiler is a deterministic renderer" and §4.4 deterministic compilation. Truncated `...` and unresolved UUIDs are non-truthful renderings of present data; resolving references and removing duplication is pure deterministic formatting (no LLM, no invented facts). The contract-drift rule (`docs/FOUNDATIONS.md:252`) also applies: `{physical_continuity}` must match the compiler-contract's stated reference-resolution behavior.
5. Deterministic-compilation surface: this changes only how already-present, already-validated records are formatted. It adds no blocker and removes no field; it does not weaken the secret firewall (§15) or alter validation gating. Reference resolution is additive rendering; absent-record raw-id fallback preserves fail-truthful behavior.
6. Adjacent contradiction classified: the identical truncated-`displayLabel`-as-prompt-text pattern in `pressure.ts:134` and `cast.ts` (compressed bands / voice pins) is a **separate concern handled by PROMPTLABEL-002**, not this ticket. This ticket is scoped to `records-tail.ts` `<physical_continuity>` only.

## Architecture Check

1. Resolving `entity_id`/`location` through the existing `front.ts` resolution pattern (rather than a new bespoke lookup) keeps a single reference-resolution authority in the compiler and matches `{pov_character}`/`{secret_holders}` behavior, so the contract reads uniformly. Dropping the `displayLabel(record)` prefix (rather than de-duplicating field-by-field inside `physicalRecordText`) removes the defect at its source: the prefix was an editor-list affordance that never belonged in deterministic prompt text. Each record line then derives its identity from resolved, untruncated fields the body already carries.
2. No backwards-compatibility aliasing or shims. The `displayLabel(record)` prefix is removed outright, not retained behind a flag. If the `front.ts` resolver is promoted to a shared compiler helper, the old private copy is deleted, not aliased.

## Verification Layers

1. `entity_id`/`location` in `<physical_continuity>` render the referenced record's display label, raw id only when the target record is absent from the snapshot -> schema validation (prompt-section conformance against `docs/compiler-contract.md:161,272`)
2. No compiled `<physical_continuity>` line contains a trailing `...` truncation marker or a duplicated leading label -> manual review + golden snapshot diff
3. Cross-section invariant (reference resolution reuses the `front.ts` authority, not a divergent copy) -> codebase grep-proof (single resolver symbol referenced by both `front.ts` and `records-tail.ts`)

## What to Change

### 1. Resolve reference fields in `physicalRecordText`

Thread `snapshot` into `physicalRecordText` and resolve `payload.entity_id` and `payload.location` (the `ENTITY STATUS` branch) to the referenced record's display label using the same logic as `front.ts:resolveEntityLabel` (find by id in `snapshot.records`, return its display label, fall back to the raw id when absent). Prefer promoting `resolveEntityLabel` to a shared compiler helper imported by both sections over copying it.

### 2. Remove the duplicated/truncated identity prefix

In `renderPhysicalContinuity`, change line 163's projection from `compactParts([displayLabel(record), physicalRecordText(record, payload)])` to render the record line from `physicalRecordText` alone, so the line is headed by the resolved entity name (`ENTITY STATUS`) or the body's own `label` (`LOCATION`/`OBJECT`/`VISIBLE AFFORDANCE`) — never the editor-truncated `metadata.displayLabel`. Confirm the local `displayLabel` helper (line 249-251) has no remaining caller in this file; if not, delete it.

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify — only if promoting `resolveEntityLabel` to a shared helper)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` / `packages/core/test/golden-first-segment.prompt.txt` (modify — regenerate golden if the fixture exercises `<physical_continuity>` with entity-status/location records)

## Out of Scope

- Truncated `displayLabel` leakage in `pressure.ts` and `cast.ts` (PROMPTLABEL-002).
- Any change to `truncateLabel` / `deriveDisplayLabel` itself or to editor-list label behavior.
- New validation rules or warning codes for absent physical references (existing raw-id fallback is retained).
- Changing the `current_authoritative_state` `location` rendering (it is free text, not a reference, and already renders a name).

## Acceptance Criteria

### Tests That Must Pass

1. A tail-section test with an `ENTITY STATUS` record whose `entity_id`/`location` point to present `ENTITY`/`LOCATION` records asserts the compiled line shows those records' display labels, not UUIDs.
2. A tail-section test with a `LOCATION` record asserts its label appears exactly once in the `<physical_continuity>` line, and that no line ends in `...`.
3. A tail-section test asserts that when an `ENTITY STATUS.entity_id` references a record absent from the snapshot, the raw id is rendered as the documented fallback.
4. `npm test` (builds `@loom/core` then runs Vitest, incl. golden) passes.

### Invariants

1. `<physical_continuity>` never emits `record.metadata.displayLabel` (the editor-truncated affordance) as prompt text.
2. Prompt-facing reference fields in `<physical_continuity>` resolve to display labels, with raw ids only as the absent-record fallback, consistent with `{pov_character}`/`{secret_holders}`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — add cases for entity/location reference resolution, single-label rendering, no-`...` invariant, and absent-record raw-id fallback.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerate iff the golden fixture renders `<physical_continuity>` with affected records; review the diff for resolved names and removed duplication.

### Commands

1. `npm test --workspace @loom/core -- compiler-tail-sections`
2. `npm test`
3. `npm run typecheck && npm run lint` — confirms the `snapshot` thread-through and any helper move type-check and respect the `@loom/core` import boundary.

## Outcome

Completed: 2026-06-08

Implemented the physical-continuity prompt-label fix in `packages/core/src/compiler/sections/records-tail.ts`. The section no longer prepends `record.metadata.displayLabel` to physical records, resolves `ENTITY STATUS.entity_id` and `ENTITY STATUS.location` through a shared compiler label helper, and preserves raw ids as the absent-record fallback.

Added `packages/core/src/compiler/labels.ts` so front-section id label rendering and physical-continuity reference rendering share one resolver. The helper prefers prompt-facing payload labels for material records before falling back to stored metadata or raw ids.

Updated tail-section coverage for resolved entity/location labels, single location label rendering, no truncated-line markers, and absent-reference fallback. Updated the frozen first-segment prompt baseline for the removed physical-continuity id/display-label prefixes.

Deviations: promoted the resolver into a shared helper as planned. The helper also avoids stale/truncated material-record metadata when a referenced `ENTITY`/`LOCATION` has an untruncated payload label, which keeps the physical-continuity invariant truthful.

Verification:

- `npm test --workspace @loom/core -- compiler-tail-sections` — passed
- `npm test` — passed
- `npm run typecheck` — passed
- `npm run lint` — passed
