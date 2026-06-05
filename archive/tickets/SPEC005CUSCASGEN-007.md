# SPEC005CUSCASGEN-007: Active-working-set curation extension

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extend `packages/web/src/working-set/WorkingSetView.tsx` with cast bands, `local_function`, and the "what will compile" destination preview
**Deps**: SPEC005CUSCASGEN-002, SPEC005CUSCASGEN-004

## Problem

`WorkingSetView` shows only membership (selected records grouped by type, with a Remove action). Curation must make the cast inclusion bands (active/onstage full, present-minor compressed, offstage relevance) and each active/onstage member's `local_function` explicit and editable, and must show selected records by prompt-section destination via the core "what will compile" helper (SPEC005CUSCASGEN-002) — manual-authority-first, with no silent mutation (`UI-WORKFLOWS.md:111-124`, `DATA-MODEL-AND-RECORDS.md:125-136`).

## Assumption Reassessment (2026-06-05)

1. `WorkingSetView` (`packages/web/src/working-set/WorkingSetView.tsx`) loads records + membership via `listRecords` / `getWorkingSet`, removes via `setWorkingSet` (membership only); it has no band, `local_function`, or destination UI. The `active_working_set` band shapes are in `activeWorkingSetSchema` (`packages/core/src/records/generation-brief.ts:5-28`): `active_onstage_cast_full` = array of `{cast_member_id, local_function}` (6-value enum), `present_minor_cast_compressed` / `offstage_relevant_cast` = `recordId` arrays, plus `selected_pov` and `manual_directive_id`.
2. `whatWillCompile(...)` from SPEC005CUSCASGEN-002 (`@loom/core`) groups selected records by destination family. The extended `active_working_set` write is issued via the SPEC005CUSCASGEN-004 client (`setGenerationBrief({ active_working_set: ... })`).
3. Shared boundary under audit: this surface consumes the SPEC005CUSCASGEN-002 helper and the SPEC005CUSCASGEN-004 client; it persists bands and `local_function`. Selection stays manual — there is no hidden auto-selection, add/remove, or compression.
4. (FOUNDATIONS §7 / §29.3) Active-working-set supremacy: bands and `local_function` are explicit user choices; bands are not a back door for silent compression — an active/onstage full dossier stays full. Deterministic helper/suggestion panels (suggest missing records or focus tags) are deferred to Phase 6 and are not built here.
5. (Deterministic-compilation substrate) The "what will compile" preview is the conceptual destination grouping from the SPEC005CUSCASGEN-002 helper, **not** the Phase-7 compiler; it reads record type + band only, never secret values, and is deterministic — opening no §15 firewall path.

## Architecture Check

1. Extending the existing `WorkingSetView` keeps active-working-set curation on one surface; rendering destinations from the core helper (the single section-name source) avoids embedding prompt-section logic in React; explicit band / `local_function` controls persisted through the partial-merge route keep selection manual and inspectable.
2. No backwards-compatibility aliasing or shims — additive controls on the existing surface; the membership Remove path is preserved.

## Verification Layers

1. Cast bands explicit and editable → `WorkingSetView.test.tsx`: a selected cast record can be assigned to each band and the assignment persists via the mocked client.
2. `local_function` explicit for active/onstage → `WorkingSetView.test.tsx`: the 6-value `local_function` selector appears for active-onstage members.
3. "What will compile" preview groups by destination → `WorkingSetView.test.tsx`: selected records render under the `whatWillCompile(...)` buckets.
4. No silent mutation → `WorkingSetView.test.tsx`: no add/remove/compress occurs without an explicit user action.

## What to Change

### 1. Band + local_function controls

Extend `WorkingSetView.tsx` to assign selected cast records to `active_onstage_cast_full` (with `local_function`), `present_minor_cast_compressed`, and `offstage_relevant_cast`, persisting via the SPEC005CUSCASGEN-004 client (the `active_working_set` surface). Preserve the existing membership Remove behavior.

### 2. Destination preview

Render selected records grouped by the `whatWillCompile(...)` buckets — the "what will compile" conceptual preview shown before prompt preview exists.

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (modify)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (modify)

## Out of Scope

- Deterministic helper / suggestion panels (suggest missing records or focus tags) — Phase 6.
- Prompt preview (Phase 8).
- Story Dashboard working-set/blocker/warning counts (deferred).
- Any auto-selection or compression (never).

## Acceptance Criteria

### Tests That Must Pass

1. `WorkingSetView.test.tsx`: cast bands and `local_function` are explicit/editable and persist via the mocked client.
2. `WorkingSetView.test.tsx`: the "what will compile" preview groups selected records by destination; no silent add/remove/compress occurs.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Selection stays manual-authority-first — no hidden auto-selection, add/remove, or compression.
2. Cast bands are explicit user choices, never a back door for silent compression; an active/onstage full dossier stays full.

## Test Plan

### New/Modified Tests

1. `packages/web/src/working-set/WorkingSetView.test.tsx` — band + `local_function` editing/persistence, destination preview, no-silent-mutation.

### Commands

1. `npm test` — builds `@loom/core`, then runs Vitest (includes the extended `WorkingSetView.test.tsx`).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the curation surface is proven by `WorkingSetView.test.tsx` within `npm test`; `npx vitest run packages/web/src/working-set/WorkingSetView.test.tsx` (from `packages/web`) filters to it during development.
