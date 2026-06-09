# BRIEFGUIDE-003: Surface requiredness in the field-help popup

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/field-help/FieldHelp.tsx` reads the new `requiredness`/`requirednessNote` from `FieldGuidance` and renders it. No core/compiler/validation changes.
**Deps**: BRIEFGUIDE-001 (provides `FieldGuidance.requiredness`)

## Problem

The "i" popup shows a single badge derived only from `promptFacing` (`FieldHelp.tsx:81-94`: "Prompt" / "Validation only" / "Current generation only"). It never tells the author whether the field is **required**. SPEC-015's own doctrine (`archive/specs/SPEC-015-field-guidance-and-contextual-help.md:150,229`) is that requiredness must stay visible and may be *supplemented* — not replaced — by popovers. With BRIEFGUIDE-001 supplying a deterministic tier, the popup should state it.

## Assumption Reassessment (2026-06-09)

1. `FieldHelp.tsx` renders a header badge via `statusLabel(guidance)` (`FieldHelp.tsx:60-62,81-94`) and a stack of `GuidanceSection`s (`:64-72`). It consumes `FieldGuidance` from `@loom/core` (`:2-6`). After BRIEFGUIDE-001, `guidance.requiredness` / `guidance.requirednessNote` are available; this ticket is blocked until that lands.
2. The requiredness tier semantics (`always` / `continuation` / `conditional` / `optional`) and authority are defined in BRIEFGUIDE-001 from `docs/compiler-contract.md:98-116`. The popup must phrase them in author language and must reference the readiness checklist as the gate, consistent with `docs/user-guide.md:28-30`.
3. Shared boundary: the `FieldGuidance` contract (core) ↔ `FieldHelp` (web). This ticket only reads the new optional fields; it must no-op gracefully when `requiredness` is absent (story-config/record surfaces, which BRIEFGUIDE-001 leaves unpopulated).
4. FOUNDATIONS principle restated: validation is the fail-closed gate (`docs/ACTIVE-DOCS.md` invariant). The popup must present requiredness as guidance and point to readiness for the actual gate — it must not imply the popup itself enforces anything.

## Architecture Check

1. Reading an existing `FieldGuidance` field and adding one rendered section reuses the established popover structure; no new data flow.
2. No shims — a small `requirednessLabel(guidance)` helper beside `statusLabel`, rendered only when `requiredness` is set.

## What to Change

### 1. Render requiredness in the popover

Add a `requirednessLabel(requiredness)` mapping: `always` → "Required", `continuation` → "Required for continuations", `conditional` → "Required when relevant", `optional` → "Optional". Render it as a distinct, visible element near the header badge (not buried in a collapsed section), plus the `requirednessNote` (e.g. the "this or begin_after" / "leave as None unless…" line) as a short line. When `guidance.requiredness` is undefined, render nothing (unchanged behavior for non-brief surfaces). Reference the readiness checklist in copy for `conditional`/`continuation` (e.g. "the readiness checklist confirms exactly when").

## Files to Touch

- `packages/web/src/field-help/FieldHelp.tsx` (modify)
- `packages/web/src/field-help/FieldHelp.test.tsx` (modify)
- `packages/web/src/field-help/FieldHelp.a11y.test.tsx` (modify, if the new element needs an a11y assertion)

## Out of Scope

- Inline markers on the brief page (BRIEFGUIDE-004).
- Populating requiredness data (BRIEFGUIDE-001).
- Changing the existing `promptFacing` badge.

## Acceptance Criteria

### Tests That Must Pass

1. A `FieldHelp` test renders the popup for an `always` field (e.g. `immediate_situation_summary`) and asserts a visible "Required" indicator; for a `continuation` field (`recent_causal_context`) asserts "Required for continuations" + its note; for an `optional` field asserts "Optional".
2. A `FieldHelp` test for a guidance entry with no `requiredness` (a story-config field) asserts no requiredness indicator renders.
3. `npm run typecheck && npm run lint && npm test`.

### Invariants

1. The popup presents requiredness as guidance only — copy references the readiness checklist as the gate; no save/preview behavior is touched (web-only render change).

## Test Plan

### New/Modified Tests

1. `packages/web/src/field-help/FieldHelp.test.tsx` — tier-to-label rendering + absent-tier no-op.

### Commands

1. `npm test -w @loom/web`
2. `npm run typecheck && npm run lint && npm test`
