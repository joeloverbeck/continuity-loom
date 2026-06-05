# SPEC005CUSCASGEN-006: Generation-time brief workflow surface

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `packages/web/src/generation-brief/` module; `AppShell.tsx` route wiring (disabled affordance promoted to a real route)
**Deps**: SPEC005CUSCASGEN-004

## Problem

The generation-time brief is mostly unauthorable: only `active_working_set.selected_records` is editable today; the other seven surfaces have no UI. Build the purpose-built eight-surface workflow (`UI-WORKFLOWS.md:126-143`), wired into the app shell, replacing the disabled "Generation Brief" affordance (`packages/web/src/shell/AppShell.tsx:24`).

## Assumption Reassessment (2026-06-05)

1. `AppShell` (`packages/web/src/shell/AppShell.tsx`) lists "Generation Brief" as a disabled `laterPhaseSurfaces` button (`:24`, rendered `:90-96`) and defines `primaryRoutes` (`:16-22`) plus the `<Routes>` block (`:99-105`). Wiring the brief means adding a route + promoting it to a `NavLink` and removing "Generation Brief" from `laterPhaseSurfaces`.
2. Brief surface shapes are in `packages/core/src/records/generation-brief.ts`: `currentAuthoritativeStateSchema` (`:30`), `immediateHandoffSchema` with `prior_accepted_prose_status_or_handoff_note` (`:53`), `manualMomentDirectiveSchema` with `must_render` `.min(1)` (`:60`), `currentCastVoicePressureSchema` with a **7-value** `local_function` enum including `present_minor_speaker` (`:69-77`), `castVoiceOverridesSchema` with `scope: "current_generation_only"` (`:87-108`), `generationValidationFocusSchema` with `generation_context` `.length(1)` (`:114`), `stopGuidanceSchema.soft_unit_guidance` (`:153`). PROSE MODE is read via `getStoryConfig("PROSE MODE")` (`api.ts:214`). The brief read/write client wrappers come from SPEC005CUSCASGEN-004.
3. Shared boundary under audit: this surface consumes the SPEC005CUSCASGEN-004 client (`getGenerationBrief` / `setGenerationBrief`) and `getStoryConfig`, persisting via `PUT /api/generation-brief` partial-merge. Local typing narrows the `unknown` session via `z.infer<typeof generationSessionSchema>` from `@loom/core`.
4. (FOUNDATIONS §10 / §28.1 + §4.1 / §26 + §2 / §29.1) `prior_accepted_prose_status_or_handoff_note` is marked user-authored with a deterministic paste-guard (best-effort heuristic, non-blocking, never mutates); CAST VOICE OVERRIDES are labeled current-generation-only and never written back to CAST MEMBER records; GENERATION VALIDATION FOCUS tags are labeled completeness checks, not plot beats.
5. (Deterministic / secret-firewall surface) The paste-guard and the non-local stop-guidance flag are **deterministic, non-blocking editor warnings**, not the Phase-6 fail-closed engine (which does not exist yet — `UI-WORKFLOWS.md:143`, SPEC-005 §29.5 stance). They read only the field being typed, leak no secret value, and add no nondeterminism. Temporary overrides compile current-generation-only (Phase 7) and never persist to durable records.
6. (Adjacent contradiction — required consequence) CURRENT CAST VOICE PRESSURE / CAST VOICE OVERRIDES are per-cast-member arrays; CCVP's `local_function` is a **7-value superset** (adds `present_minor_speaker`) of the AWS active-band 6-value enum (SPEC-005 §Risks). The CCVP selector must offer all 7 values and must not be bound to the AWS active-band enum (which would silently drop the present-minor-speaker case).

## Architecture Check

1. A purpose-built workflow (not a generic record form) makes the eight surfaces and the durable/temporary distinction structural; the deterministic editor-level guards (paste-guard, non-local flag) live in the UI as warnings, keeping the Phase-6 fail-closed engine cleanly separable. Reading PROSE MODE through the existing config route avoids duplicating POV state.
2. No backwards-compatibility aliasing or shims — the disabled placeholder is replaced with a real route, not aliased.

## Verification Layers

1. All eight surfaces editable and persisted → `GenerationBriefView.test.tsx` covering each surface round-trip via the mocked client.
2. Paste-guard fires on `prior_accepted_prose_status_or_handoff_note` → test entering prose-like text → warning, no mutation/block.
3. Non-local stop-guidance flagged (non-blocking) → test entering "whole chapter" → warning surfaces but does not block.
4. CAST VOICE OVERRIDE does not mutate the durable CAST MEMBER record → test asserting no record-write call on override entry.
5. CCVP `local_function` selector offers all 7 values including `present_minor_speaker` → test.
6. App shell route wired and the affordance no longer disabled → `AppShell` test / `GenerationBriefView` mount via route.

## What to Change

### 1. Brief workflow module

Add `packages/web/src/generation-brief/GenerationBriefView.tsx` (plus subcomponents) with editors for: CURRENT AUTHORITATIVE STATE; IMMEDIATE HANDOFF (with the `prior_accepted_prose_status_or_handoff_note` paste-guard); MANUAL MOMENT DIRECTIVE (`must_render` required, ≥1); CURRENT CAST VOICE PRESSURE (per active cast member, 7-value `local_function`); CAST VOICE OVERRIDES (current-generation-only labeled); GENERATION VALIDATION FOCUS (exactly one `generation_context`; tags as completeness checks); STOP GUIDANCE (prominent, with the deterministic non-local flag); prose mode / selected POV (read PROSE MODE via `getStoryConfig`, write `active_working_set.selected_pov`). Load and persist via the SPEC005CUSCASGEN-004 client (partial-merge).

### 2. App shell wiring

In `AppShell.tsx`, add the brief route + a `NavLink`, and remove "Generation Brief" from `laterPhaseSurfaces`.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (new)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)

## Out of Scope

- The fail-closed validation engine / blocking gate (Phase 6) — the paste-guard and non-local flag are non-blocking warnings only.
- Prompt preview / send (Phase 8/9).
- POV / audience knowledge-profile compilation (Phase 7).
- Writing overrides or current voice pressure back to CAST MEMBER records (never).
- Active-working-set band / `local_function` curation (SPEC005CUSCASGEN-007).

## Acceptance Criteria

### Tests That Must Pass

1. `GenerationBriefView.test.tsx`: all eight surfaces edit and persist via the mocked client; the paste-guard fires; a non-local stop-guidance entry is flagged without blocking.
2. `GenerationBriefView.test.tsx`: a CAST VOICE OVERRIDE triggers no CAST MEMBER record write; the CCVP `local_function` selector offers all 7 values; the app-shell affordance is a live route (no longer disabled).
3. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Temporary overrides and current voice pressure never persist to CAST MEMBER records.
2. The paste-guard and non-local flag are non-blocking and never mutate input; the brief affordance is promoted from disabled to a real route.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — eight-surface round-trip, paste-guard, non-local flag, override-no-mutation, 7-value CCVP selector, shell wiring.

### Commands

1. `npm test` — builds `@loom/core`, then runs Vitest (includes the new brief component test).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the brief workflow is proven by `GenerationBriefView.test.tsx` within `npm test`; `npx vitest run packages/web/src/generation-brief/GenerationBriefView.test.tsx` (from `packages/web`) filters to it during development.
