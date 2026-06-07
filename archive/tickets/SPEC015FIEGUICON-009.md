# SPEC015FIEGUICON-009: GenerationBriefView help triggers for rendered fields

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `GenerationBriefView` renders help triggers on its rendered fields and reconciles its inline hints; brief payload and validation are unchanged.
**Deps**: SPEC015FIEGUICON-007

## Problem

`GenerationBriefView` holds the most dangerous generation-time fields (handoff, directive, validation focus, stop guidance) but is hand-built, not descriptor-driven, so it cannot inherit help via the generic `FieldShell`. SPEC-015 §8.3 requires it to explicitly call `FieldHelp` with canonical field paths for each hand-built field, and §19.6 says the dangerous rendered fields must not be left unguided. Per Q1(a), v1 attaches UI help to the fields the brief currently renders; reassessment finding **M4** requires its existing inline hints to be subsumed, not duplicated.

## Assumption Reassessment (2026-06-07)

1. `packages/web/src/generation-brief/GenerationBriefView.tsx` is hand-built (not driven by `recordEditorDescriptors`) and renders a subset of `generationSessionSchema`: `active_working_set.selected_pov`, `current_authoritative_state.current_time`, `immediate_handoff.{recent_causal_context,prior_accepted_prose_status_or_handoff_note}`, `manual_moment_directive.must_render`, `current_cast_voice_pressure[].{cast_member_id,local_function,current_voice_pressure}`, `cast_voice_overrides[].override_text`, `generation_validation_focus.validation_focus_tags.generation_context`, `stop_guidance.soft_unit_guidance` (confirmed). It already carries inline hints: "Completeness checks, not plot beats.", the prose-paste warning on the handoff note, the non-local stop-guidance warning, and "current_generation_only; never written back to CAST MEMBER records." `FieldHelp` is from SPEC015FIEGUICON-007; the full-schema catalog entries (including the not-yet-rendered fields) are authored in SPEC015FIEGUICON-004.
2. The integration directive and scope are `specs/SPEC-015-…md` §8.3, §19.6, Q1(a) (UI help on rendered fields only), and reassessment finding **M4**.
3. **Shared boundary under audit**: each hand-built `FieldHelp` call must pass the canonical key `GENERATION BRIEF.<schema_group>.<field>` (e.g. `GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note`) — matching SPEC015FIEGUICON-004's authored entries and SPEC015FIEGUICON-003's enumeration — even though the DOM `name` attributes use the `generationSession.` prefix. The two namespaces are intentionally distinct; the canonical key is the guidance lookup key, not the form field name.
4. **FOUNDATIONS §10 / §11 + M4**: the handoff paste-warning and the validation-focus "checks, not plot beats" hint are subsumed into the guidance entries' `criticalVisibleHint`/badges and rendered once; `FieldHelp` is display-only and the brief's `updateSurface`/save payload and `ValidationPanel` behavior are unchanged.

## Architecture Check

1. Explicit `FieldHelp` calls keyed by canonical path (rather than refactoring the hand-built brief into descriptor-backed groups) is the smaller v1 change and matches §8.3's stated alternative; the catalog already carries full-schema entries (SPEC015FIEGUICON-004), so growing the brief UI later only needs to render more fields, not author more guidance. Subsuming the inline hints into the guidance system removes the duplicate-copy maintenance hazard.
2. No backwards-compatibility shim: the hand-built fields gain triggers in place; no parallel brief renderer is introduced.

## Verification Layers

1. Rendered brief fields get help triggers → RTL test (`GenerationBriefView.test.tsx`) asserting a `Help for <label>` trigger on the handoff note, must-render, validation-focus, and stop-guidance fields.
2. Canonical key correctness → test asserting the handoff trigger resolves `GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note`.
3. Inline-hint reconciliation → test asserting the paste-warning / "checks, not plot beats" copy is present once (via guidance), not duplicated beside a popover carrying the same text.
4. Brief payload unchanged → existing `GenerationBriefView` save/validation tests stay green.

## What to Change

### 1. `packages/web/src/generation-brief/GenerationBriefView.tsx`

- For each rendered field, render `<FieldHelp fieldPath="GENERATION BRIEF.<group>.<field>" fieldLabel="<label>" />` adjacent to the field label (mapping each rendered control to its canonical path).
- Reconcile inline hints (M4): replace the standalone "Completeness checks, not plot beats.", handoff paste-warning, non-local stop-warning, and override "current_generation_only…" notes with the corresponding guidance `criticalVisibleHint`/badge surfaced through `FieldHelp`, keeping each as a single source. Leave the runtime *validation* warnings (`pasteWarning`, `nonLocalStopWarning` computed state) intact — those are dynamic validators, not static doctrine copy.

### 2. Test

- Extend `GenerationBriefView.test.tsx` with the help-presence, canonical-key, and reconciliation assertions; keep existing save/validation assertions.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- Expanding `GenerationBriefView` to render the full `generationSessionSchema` field set — §7.2 pre-validated non-goal; not-yet-rendered fields get no UI trigger in v1 (their catalog entries already exist via SPEC015FIEGUICON-004).
- The generic `FieldShell` integration (SPEC015FIEGUICON-008).
- Enum radio/card controls (SPEC015FIEGUICON-010).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- GenerationBriefView` (vitest + RTL, `@loom/web`) — the rendered handoff, directive, validation-focus, and stop-guidance fields each expose a `Help for <label>` trigger.
2. `npm test -- GenerationBriefView` — the handoff trigger resolves the canonical key `GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note`; reconciled doctrine copy appears once; existing save/validation assertions still pass.
3. `npm run typecheck && npm run lint` pass (web package).

### Invariants

1. v1 UI help is attached only to fields the brief renders; the canonical lookup key is `GENERATION BRIEF.<group>.<field>`, distinct from the `generationSession.` DOM `name`.
2. Static doctrine hints are sourced once from the guidance catalog; dynamic validation warnings are preserved.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — help-trigger presence, canonical-key resolution, inline-hint reconciliation, unchanged save/validation.

### Commands

1. `npm test -- GenerationBriefView`
2. `npm run typecheck && npm run lint`

## Outcome

Completed: 2026-06-07

Changed:

- Added explicit `FieldHelp` calls in `GenerationBriefView` for every currently rendered generation-brief control, keyed by canonical `GENERATION BRIEF.<group>.<field>` paths rather than DOM `generationSession.*` names.
- Removed static inline override and validation-focus hints that are now surfaced once through guidance critical hints and badges.
- Preserved dynamic paste-like and non-local stop validation warnings.
- Extended `GenerationBriefView.test.tsx` for help-trigger presence, canonical handoff id derivation, one-copy doctrine-hint reconciliation, and unchanged save behavior.

Deviations from original plan:

- Added a local `ResizeObserver` stub to the jsdom test file because opening Radix Popover content requires it.

Verification:

- `npm test -- GenerationBriefView` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
