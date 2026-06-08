# HANDOFFDIR-002: Wire up the four missing handoff/directive brief editor fields

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/generation-brief/GenerationBriefView.tsx` editor surface (additive UI only; no schema or compiler change)
**Deps**: None (independent of archived `archive/tickets/HANDOFFDIR-001.md`; order-free). Complements it: HANDOFFDIR-001 omits these fields when empty, this ticket makes them authorable so they can be non-empty.

## Problem

Four generation-time brief fields are present in the data model, consumed by the compiler, given help text in field guidance, and required/recommended by the compiler contract — but have **no editor input** in the UI, so the writer can never fill them:

- `immediate_handoff.last_visible_moment`
- `immediate_handoff.begin_after`
- `manual_moment_directive.may_render_if_naturally_caused`
- `manual_moment_directive.do_not_force`

`GenerationBriefView.tsx` initializes all four in draft state (`:184-193`) and persists them, but renders inputs only for `recent_causal_context` (`:556`), `prior_accepted_prose_status_or_handoff_note` (`:565`), and `must_render` (`:587`). The four above are therefore permanently empty. This is an oversight, not a deliberate omission: the compiler contract makes `last_visible_moment`/`begin_after` continuation-required (`docs/compiler-contract.md` rows 114, 116), `do_not_force` a recommended guardrail (row 119), and `may_render_if_naturally_caused` the invention corridor (row 118); FOUNDATIONS line 333 names last-visible-moment and begin-exactly-after as allowed continuation-launch material; and field guidance was already authored for all four (`packages/core/src/records/field-guidance-brief-config.ts:231,243,251,254`). Without editors, continuations cannot supply the user-authored launch material the contract requires.

## Assumption Reassessment (2026-06-08)

1. **Code**: `GenerationBriefView.tsx` IMMEDIATE HANDOFF section (`:552-580`) renders textareas for `recent_causal_context` and `prior_accepted_prose_status_or_handoff_note` only; MANUAL MOMENT DIRECTIVE section (`:583-593`) renders a textarea for `must_render` only. The four target fields are initialized in `immediateHandoffDraft`/`manualDirectiveDraft` defaults (`:182-193`) and flow through `updateSurface` + the save payload (`:266-269`), but have no `<textarea>`.
2. **Field shapes (load-bearing for the input pattern)**:
   - `last_visible_moment`: `string` — render a single textarea, mirror `recent_causal_context` (`:554-561`), `onChange` writes the raw string via `updateSurface("immediate_handoff", { ...immediateHandoff, last_visible_moment: event.target.value })`.
   - `begin_after`: `string` — same single-textarea pattern.
   - `may_render_if_naturally_caused`: `string[]` (default `[]`, `:192`) — mirror `must_render` (`:585-592`): bind `value={...join("\n")}`, `onChange` via `splitLines(...)`.
   - `do_not_force`: `string[]` (default `[]`, `:193`) — same array pattern.
   Verify these shapes against `packages/core/src/records/generation-brief.ts` (handoff fields ~lines 53/55; directive fields ~lines 62/63) before wiring.
3. **Shared boundary under audit**: the generation-time brief contract shared between the web editor, the `@loom/core` brief model (`generation-brief.ts` / `generation-brief-draft.ts`), and the compiler resolvers (`front.ts:102-120`). This ticket is **additive UI only** — the fields, model, persistence path, and compiler consumers already exist; no schema or compiler change. The extension is therefore not a schema change at all (UI catches up to an existing schema).
4. **FOUNDATIONS principle**: §6/§16 user authoring of generation-time fields and line 333 (allowed continuation-launch material). Making these fields authorable serves human gatekeeping; it cannot leak accepted prose (they are user-typed free text, same firewall posture as the existing handoff editors, including the `proseLikePaste` warning already wired for `prior_accepted_prose_status_or_handoff_note` at `:227-228, 579`). No §29 hard-fail is tripped.
5. **Field guidance already exists (no new guidance needed)**: `field-guidance-brief-config.ts` defines `immediate_handoff.last_visible_moment` (`:231`), `immediate_handoff.begin_after` (`:243`), `manual_moment_directive.may_render_if_naturally_caused[]` (`:251`), `manual_moment_directive.do_not_force[]` (`:254`). Reuse via `<BriefFieldHelp path=... label=... />`, matching the existing calls (`:561, 576-577, 592`). Note the array fields use the `[]` path suffix in guidance keys, as `must_render[]` already does.
6. **Adjacent bug (classified: required consequence of this ticket)**: the save payload normalizes only `must_render` (`:269` — `must_render: normalizeLines(manualDirective.must_render)`). The two newly-editable array fields (`may_render_if_naturally_caused`, `do_not_force`) must be normalized the same way on save, or they will persist unnormalized lines. Extend the `manual_moment_directive` payload normalization to all three array fields.

## Architecture Check

1. Reuses the two existing editor patterns verbatim (single-string textarea for handoff strings; `join("\n")`/`splitLines` textarea for directive arrays) and the existing `BriefFieldHelp` guidance surface — no new component, no new state machinery, no new guidance entries. Cleanest possible change: the UI catches up to a model/compiler/guidance contract that already supports these fields.
2. No backwards-compatibility aliasing/shims. No schema change (additive UI over existing optional fields).

## Verification Layers

1. Each of the four fields has an editable input bound to the correct draft path → component test (RTL) typing into each input and asserting the value round-trips.
2. Array fields (`may_render_if_naturally_caused`, `do_not_force`) split on newlines and are normalized on save identically to `must_render` → component test asserting the saved payload arrays are normalized.
3. The four field-guidance entries render via `BriefFieldHelp` → component test asserting the help text/labels are present.
4. No regression to existing handoff/directive editors or to compilation → `npm test`.

## What to Change

### 1. IMMEDIATE HANDOFF section (`GenerationBriefView.tsx:552-580`)

Add two single-textarea fields after the existing handoff inputs: `last_visible_moment` and `begin_after`, mirroring the `recent_causal_context` block (label, `name="generationSession.immediate_handoff.<field>"`, `value`, `onChange` via `updateSurface`, and a `<BriefFieldHelp path="immediate_handoff.<field>" label="<field>" />`).

### 2. MANUAL MOMENT DIRECTIVE section (`GenerationBriefView.tsx:583-593`)

Add two array textareas after `must_render`: `may_render_if_naturally_caused` and `do_not_force`, mirroring the `must_render` block (`value={...join("\n")}`, `onChange` via `splitLines`, `<BriefFieldHelp path="manual_moment_directive.<field>[]" label="<field>" />`).

### 3. Save normalization (`GenerationBriefView.tsx:269`)

Extend the `manual_moment_directive` payload to normalize all three array fields:
`{ ...manualDirective, must_render: normalizeLines(manualDirective.must_render), may_render_if_naturally_caused: normalizeLines(manualDirective.may_render_if_naturally_caused), do_not_force: normalizeLines(manualDirective.do_not_force) }`.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify — add coverage for the four new inputs and array normalization)

## Out of Scope

- Compiler omission of these fields when empty (`archive/tickets/HANDOFFDIR-001.md`).
- Any change to the `@loom/core` brief schema, draft defaults, or compiler resolvers (all already support these fields).
- New field-guidance entries (the four already exist).
- Changing required/recommended classification or adding new validation blockers.

## Acceptance Criteria

### Tests That Must Pass

1. Component test: typing into the `last_visible_moment` and `begin_after` textareas updates draft state and the value round-trips on re-render.
2. Component test: entering multi-line text in `may_render_if_naturally_caused` and `do_not_force` produces normalized string arrays in the save payload (matching `must_render` behavior).
3. Component test: `BriefFieldHelp` renders for all four new fields.
4. `npm test` passes.

### Invariants

1. All four previously-unauthorable brief fields are editable in the UI and persist through the existing save path.
2. `may_render_if_naturally_caused` and `do_not_force` are normalized on save identically to `must_render` (no unnormalized line drift).
3. No schema or compiler change is introduced (additive UI only).

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — input presence, value round-trip, array normalization on save, and `BriefFieldHelp` rendering for the four new fields.

### Commands

1. `npm exec -- vitest run packages/web/src/generation-brief/GenerationBriefView.test.tsx`
2. `npm test`
3. `npm run lint && npm run typecheck`
