# SPEC015FIEGUICON-010: Enum guidance UI — selected-value display and radio/card controls

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `EnumGuidance` component, enum-rendering enhancement in `RecordEditor`, and enum/card styles; enum presentation changes, form payload unchanged.
**Deps**: SPEC015FIEGUICON-008

## Problem

SPEC-015 §12.4–§12.5 and §15 require value-level enum guidance: a selected-value explanation near high-implication enum controls, descriptions for non-obvious values, and radio/card controls for a small set of high-impact enums where reading all options materially improves comprehension — while keeping plain selects for obvious or long enums. This ticket adds that presentation layer on top of the wired `FieldHelp` integration.

## Assumption Reassessment (2026-06-07)

1. `packages/web/src/records/RecordEditor.tsx` `FieldRenderer` renders enums as a plain `<select>` over `field.enumValues` (confirmed). The per-value copy comes from `getFieldGuidance(path).enumValues` (`EnumValueGuidance` from SPEC015FIEGUICON-002; content from SPEC015FIEGUICON-004/005/006). The §12.5 candidate enums exist in core: `content_intensity`, `psychic_distance`, `interiority`/`interiority_mode`, `dialogue_density` (`global-config.ts`); `SECRET.reveal_permission` (`knowledge.ts`); `CAST MEMBER.sample_utterances[].copy_policy` (`cast-member.ts`); `local_function` on `active_onstage_cast_full[]` and `current_cast_voice_pressure[]` (`generation-brief.ts`).
2. The presentation rules are `specs/SPEC-015-…md` §12.4 (badges), §12.5 (selected-value display, card/radio candidates, "do not convert every enum"), §15 (enum inventory), §19.7.
3. **Shared boundary under audit**: `EnumGuidance` reads `guidance.enumValues` keyed by the same canonical path the control resolves; each value key must equal a schema enum literal (e.g. `reveal_permission` → `locked`/`clue_only`/`natural_reveal_allowed`/`directive_required`), or a value renders with no explanation.
4. **FOUNDATIONS §10 / §29.4**: the selected-value explanation and card controls are display affordances reading guidance for presentation only; the bound form value and Zod validation are unchanged (a card group writes the same enum string a `<select>` would).

## Architecture Check

1. A dedicated `EnumGuidance` component invoked from the enum branch of `FieldRenderer` keeps the card-vs-select decision in one place (a curated allowlist of high-impact enums) rather than scattering presentation logic; non-allowlisted enums keep the plain select plus a selected-value explanation, honoring §12.5's "do not convert every enum." Reading values from the catalog keeps copy out of the component.
2. No backwards-compatibility shim: the enum branch is enhanced in place; no second enum renderer is kept alongside.

## Verification Layers

1. Selected-value explanation renders → RTL test (`EnumGuidance.test.tsx`) asserting the chosen value's `EnumValueGuidance.short` appears for a high-impact enum.
2. Card/radio control for allowlisted enum → RTL test asserting `SECRET.reveal_permission` renders selectable cards, each labelled with its value guidance, and selecting one updates the bound value to the enum literal.
3. Non-allowlisted enum keeps a select → RTL test asserting a long/obvious enum still renders `<select>` (no card bloat).
4. Payload unchanged → existing `RecordEditor` submit test stays green (card selection writes the same enum string).

## What to Change

### 1. New `packages/web/src/field-help/EnumGuidance.tsx`

- Props: `{ fieldPath: string; enumValues: readonly string[]; value: string; onChange: (v: string) => void; }`. Look up `getFieldGuidance(fieldPath).enumValues`; render the selected value's explanation; for an allowlisted high-impact enum (the §12.5 candidate set) render a radio/card group with per-value guidance, otherwise render a `<select>` plus the selected-value explanation.

### 2. `packages/web/src/records/RecordEditor.tsx`

- In the `enum` branch of `FieldRenderer`, delegate to `EnumGuidance` (passing the canonical `fieldPath` already computed in SPEC015FIEGUICON-008), preserving the existing register/`onChange` wiring so the form value is unchanged.

### 3. Styles

- Add enum card/radio and selected-value-explanation styles to `packages/web/src/styles.css`.

## Files to Touch

- `packages/web/src/field-help/EnumGuidance.tsx` (new)
- `packages/web/src/field-help/EnumGuidance.test.tsx` (new)
- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Converting every enum to cards (§12.5 explicitly warns against; only the curated high-impact set gets cards).
- Authoring the enum value copy (`EnumValueGuidance` content lands in SPEC015FIEGUICON-004/005/006).
- Generation-brief-only enum controls already rendered by `GenerationBriefView` (SPEC015FIEGUICON-009) beyond shared `RecordEditor` enums.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- EnumGuidance` (vitest + RTL, `@loom/web`) — selected-value explanation renders; an allowlisted enum (`SECRET.reveal_permission`) renders cards; a non-allowlisted enum renders a `<select>`.
2. `npm test -- RecordEditor` — selecting an enum card writes the same enum literal a `<select>` would; existing submit assertions pass.
3. `npm run typecheck && npm run lint` pass (web package).

### Invariants

1. Only the curated high-impact enum set renders as cards; all other enums keep plain selects.
2. Enum presentation never changes the bound form value or validation outcome.

## Test Plan

### New/Modified Tests

1. `packages/web/src/field-help/EnumGuidance.test.tsx` — selected-value display, card vs select, value-write correctness.

### Commands

1. `npm test -- EnumGuidance RecordEditor`
2. `npm run typecheck && npm run lint`

## Outcome

Completed: 2026-06-07

Changed:

- Added `packages/web/src/field-help/EnumGuidance.tsx` for selected-value enum explanations, plain-select rendering for ordinary enums, and card/radio rendering for a curated high-impact enum set.
- Updated `RecordEditor` enum rendering to delegate to `EnumGuidance` with canonical guidance paths and to write enum string literals back through React Hook Form state.
- Added enum card, selected-value, and enum explanation styles.
- Added `packages/web/src/field-help/EnumGuidance.test.tsx` for selected-value copy, card/radio behavior, and select fallback.
- Extended `RecordEditor.test.tsx` to prove a card selection submits the same enum literal expected by the schema.

Deviations from original plan:

- Added an `allowUnset` prop to preserve the existing optional-enum unset behavior for non-required fields.

Verification:

- `npm test -- EnumGuidance RecordEditor` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
