# BRIEFGUIDE-004: Inline required/optional markers on the Generation Brief page

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `packages/web/src/generation-brief/GenerationBriefView.tsx` renders a per-field requiredness marker next to each field label. No core/compiler/validation changes.
**Deps**: `archive/tickets/BRIEFGUIDE-001.md` (completed; provides `FieldGuidance.requiredness`)

## Problem

On `/generation-brief` there is no requiredness signal next to any field name. The page is hand-rolled — each field is a bare `<label>` + control + `<BriefFieldHelp>` (`GenerationBriefView.tsx:386-746`) — and never adopted the required marker the record editor already shows (`RecordEditor.tsx:256`: `<strong aria-label="required"> *</strong>`). Requiredness appears only in the separate `ValidationPanel`. This violates SPEC-015's "requiredness stays visible" doctrine (`archive/specs/SPEC-015-field-guidance-and-contextual-help.md:150,229`) on this one surface, and is the user's reported "I can't tell which fields are even required."

## Assumption Reassessment (2026-06-09)

1. `GenerationBriefView.tsx` renders each field as `<label>{name}<control/></label>` followed by `<BriefFieldHelp path=… label=…/>` (e.g. `:386-394`, `:422-433`, `:558-602`). There is no requiredness marker anywhere on the page (grep `required` in `packages/web/src/generation-brief/` returns only `ValidationPanel`/`ReadinessChecklist` references). The record-editor idiom to mirror is `RecordEditor.tsx:256`.
2. The live generation context is already in the component: the selected value is `validationFocusTags.generation_context?.[0] ?? defaultGenerationContext` (`:706`), and `defaultGenerationContext = briefDefaults?.generation_context.value ?? "first_segment"` (`:212`). This lets the marker resolve the `continuation` tier against the *current* context without new data.
3. Requiredness tiers come from `getFieldGuidance("GENERATION BRIEF." + path).requiredness` (`archive/tickets/BRIEFGUIDE-001.md`); `BriefFieldHelp` already builds that exact path (`:69-71`).
4. FOUNDATIONS principle restated: validation **fails closed** and is the gate (`docs/ACTIVE-DOCS.md` invariant). The marker is an authoring affordance only — it must **not** block Save, must not call readiness, and must not fork the gate logic. The existing `ValidationPanel` remains the authority.
5. Enforcement surface: this is a render-only change in one web component. It does not touch the readiness API, blocker rules, or compile path; verified by leaving `packages/server`, `packages/core/src/validation`, and `packages/core/src/compiler` unedited.

## Architecture Check

1. A small presentational `<RequirednessMarker>` reading the same `getFieldGuidance` registry the page already uses (via `BriefFieldHelp`) keeps one source of truth and mirrors the record-editor `*` idiom, so the two surfaces look consistent.
2. Resolving the `continuation` tier against the in-component `generation_context` (no new fetch, no new state) avoids duplicating readiness logic; `conditional` stays honest by pointing to the checklist rather than guessing.

## What to Change

### 1. Add a requiredness marker component

A presentational component that, given a `requiredness` tier and the current `generation_context`, renders next to the label:

- `always` → required marker (reuse the `*` + `aria-label="required"` idiom from `RecordEditor.tsx:256`).
- `continuation` → required marker when context is `continuation_after_accepted_segment`; otherwise a muted "Optional for a first segment" hint.
- `conditional` → muted "Conditional" tag with `aria-label`/title "Required when relevant — the readiness checklist confirms when."
- `optional` → muted "Optional" tag (or nothing, per design; keep it explicit so the page reads as deliberate).

### 2. Render it per field

Render the marker inside/next to each `<label>` in the generation-brief sections, looking up the tier via the field's canonical path. A brief legend near the top (e.g. "* required · Conditional · Optional") makes the markers self-explanatory.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- a new small marker component under `packages/web/src/generation-brief/` or `field-help/` (new)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- Popup requiredness (completed in `archive/tickets/BRIEFGUIDE-003.md`).
- Populating requiredness data (completed in `archive/tickets/BRIEFGUIDE-001.md`).
- Any change to save behavior, the readiness API, or the `ValidationPanel`/`ReadinessChecklist`.
- Markers on story-config or record-editor surfaces (record editors already show them).

## Acceptance Criteria

### Tests That Must Pass

1. A `GenerationBriefView` test asserts an always-required field (`immediate_situation_summary`) shows a required marker regardless of context.
2. A test asserts a `continuation` field (`recent_causal_context`) shows the required marker when `generation_context = continuation_after_accepted_segment` and the "optional for a first segment" hint when `first_segment` — driven by changing the context selector.
3. A test asserts a `conditional` field (e.g. `positions`) shows the conditional tag and never a hard required marker.
4. A test asserts changing the generation-context selector flips continuation-field markers without a save/readiness round-trip (marker is local, not gated).
5. `npm run typecheck && npm run lint && npm test`.

### Invariants

1. The marker never blocks Save and never calls the readiness API — grep-proof the marker component has no readiness/save imports; `ValidationPanel` remains the only gate.
2. Always-required markers are context-independent; continuation markers are the only ones that react to the context selector.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — tier rendering, context-reactive continuation markers, conditional tag, no-gate behavior.

### Commands

1. `npm test -w @loom/web`
2. `npm run typecheck && npm run lint && npm test`
