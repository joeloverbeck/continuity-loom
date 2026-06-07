# ENUMRADIO-001: Give card-style enum radio groups a unique name per list item

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/web/src/field-help/EnumGuidance.tsx` (radio `name` attribute); regression test in `packages/web/src/records/CastMemberEditor.test.tsx`. No schema, compiler, validation, or stored-data change.
**Deps**: None

## Problem

In the cast-dossier editor, when a CAST MEMBER has more than one `sample_utterance`, picking a `copy_policy` (e.g. `never_copy_verbatim`) on one utterance visually clears the selected `copy_policy` on every other utterance.

Root cause: `copy_policy` is rendered as a radio-card group by `EnumGuidance` because `CAST MEMBER.sample_utterances[].copy_policy` is listed in `cardEnumPaths` (`packages/web/src/field-help/EnumGuidance.tsx:24`). The radio inputs use `name={fieldPath}` (`EnumGuidance.tsx:48`), and `fieldPath` is built by `FieldRenderer` as `` `${ownerKind}.${normalizeListIndices(path)}` `` (`packages/web/src/records/RecordEditor.tsx:337`). `normalizeListIndices` strips the list index (`packages/core/src/records/field-paths.ts:17-19`), so `sample_utterances.0.copy_policy` and `sample_utterances.1.copy_policy` both normalize to `sample_utterances[].copy_policy`. Every `copy_policy` radio across all utterances therefore shares one `name`, so the browser groups them into a single native radio group where only one selection can exist — selecting one de-selects the rest.

The radio `name` is only a DOM grouping handle; it carries no canonical-path meaning (guidance lookup uses `fieldPath` separately). The fix is to give each rendered `EnumGuidance` card group its own unique `name` via React's `useId()`.

The same defect affects every card-style enum nested in a list. From `cardEnumPaths` that is three paths, all on voice/generation surfaces:
- `CAST MEMBER.sample_utterances[].copy_policy` (reported)
- `GENERATION BRIEF.active_working_set.active_onstage_cast_full[].local_function`
- `GENERATION BRIEF.current_cast_voice_pressure[].local_function`

A single fix in `EnumGuidance` repairs all three. Non-card enums render a `<select>` (no `name`), and single-instance card enums (e.g. `SECRET.reveal_permission`) are unaffected because there is only one group on the page.

## Assumption Reassessment (2026-06-07)

1. **Code under audit.** `EnumGuidance` (`packages/web/src/field-help/EnumGuidance.tsx:29-79`) renders the card branch for paths in `cardEnumPaths` (`:15-27`) and sets `name={fieldPath}` on each radio (`:48`). Confirmed `fieldPath` arrives normalized from `FieldRenderer` (`packages/web/src/records/RecordEditor.tsx:336-337`), and `normalizeListIndices` strips `.<digits>` segments to `[]` (`packages/core/src/records/field-paths.ts:17-19`). The non-card branch uses `<select>` with no `name` (`EnumGuidance.tsx:66-78`), so it is not affected.
2. **Docs/specs.** No active doc governs the DOM `name` attribute of radio inputs; `docs/story-record-schema.md` defines `copy_policy` semantics, `docs/FOUNDATIONS.md` governs faithful authoring of durable cast-dossier voice data. This change restores intended authoring behavior without altering schema, compilation, or validation. `tickets/` contains only `README.md` and `_TEMPLATE.md` (no prior or conflicting ticket).
3. **Shared boundary under audit.** `EnumGuidance` is shared across CAST MEMBER and GENERATION BRIEF card enums via `FieldRenderer`; the `name` change is internal to `EnumGuidance` and does not alter its props or the `value`/`onChange` contract (those use the indexed `path`, unchanged).
4. **FOUNDATIONS principle restated.** The durable cast dossier (identity + voice anchor incl. `sample_utterances`/`copy_policy`) must be authored and edited faithfully; a UI defect that silently drops a user's selected per-utterance copy policy undermines that authoring fidelity. This ticket restores it; it does not weaken any validation gate, the secret firewall (§15), or deterministic compilation (§8) — none are touched.
5. **Testing-environment caveat (mismatch corrected).** jsdom does **not** emulate native radio-group exclusivity: a test asserting on radio `.checked` state passes even with the bug present (verified during diagnosis — a false green). The regression test must therefore assert on the **`name` attribute** (distinct per list item, shared within a single group), which is the precise defect and is observable in jsdom.

## Architecture Check

1. `useId()` is the idiomatic React 18 way to mint a stable, unique, per-instance identifier for grouping form controls. It is cleaner than threading the indexed `path` into `EnumGuidance` (Approach B) because the radio `name` needs no canonical meaning — only uniqueness — so deriving it from the field path would add a prop and cross-file coupling for no behavioral gain. It is more robust than reusing `fieldPath`, which is intentionally index-stripped for guidance lookups.
2. No backwards-compatibility aliasing or shims introduced. `EnumGuidance`'s public props and the `value`/`onChange` contract are unchanged; only the internal radio `name` source changes.

## Verification Layers

1. Radio groups for two list items render distinct `name` attributes -> manual review + new jsdom regression test asserting `name` uniqueness across `sample_utterances` items.
2. Radios within a single card group still share one `name` (so they remain one selectable group) -> same regression test asserting intra-group `name` equality.
3. The fix changes no canonical path / guidance lookup (`fieldPath` still drives `getFieldGuidance`) -> codebase grep-proof that `normalizeListIndices(fieldPath)` / `getFieldGuidance` usage in `EnumGuidance` is unchanged.
4. No schema/compiler/validation surface touched -> FOUNDATIONS alignment check (§8 deterministic compilation, §11 validation untouched; change is presentation-layer only).

## What to Change

### 1. Unique radio-group name in `EnumGuidance`

In `packages/web/src/field-help/EnumGuidance.tsx`:
- Import `useId` from `react`.
- Inside `EnumGuidance`, derive `const radioGroupName = useId();`.
- In the card branch, change the radio input `name={fieldPath}` (`:48`) to `name={radioGroupName}`.

Leave the `aria-label` on the `radiogroup` (`${fieldPath} values`), the `checked`/`onChange` wiring, and the guidance lookups unchanged.

### 2. Regression test

In `packages/web/src/records/CastMemberEditor.test.tsx`, add a test that:
- Renders `CastMemberEditor` (create mode) and adds two `sample_utterances`.
- Locates the `copy_policy` radios within `sample_utterances 1` and `sample_utterances 2` groups.
- Asserts the two groups' radio `name` attributes differ (distinct native radio groups).
- Asserts radios within a single group share the same `name`.
- Does NOT assert on `.checked` collision (jsdom limitation — would false-pass; documented in Assumption Reassessment item 5).

## Files to Touch

- `packages/web/src/field-help/EnumGuidance.tsx` (modify)
- `packages/web/src/records/CastMemberEditor.test.tsx` (modify)

## Out of Scope

- Any change to `copy_policy` / `local_function` enum values, semantics, defaults, or schema.
- Any change to deterministic compilation, validation, or stored record shape.
- Refactoring `cardEnumPaths`, `normalizeListIndices`, or the `FieldRenderer`/`EnumGuidance` prop contract beyond the `name` source.
- A separate regression test for the GENERATION BRIEF list card-enums (the single `EnumGuidance` fix repairs them; the CAST MEMBER test guards the shared component).

## Acceptance Criteria

### Tests That Must Pass

1. New regression test in `packages/web/src/records/CastMemberEditor.test.tsx` (distinct radio-group `name` per `sample_utterance`, shared `name` within a group) passes.
2. `npm test` (builds `@loom/core` then runs Vitest) passes with the existing CAST MEMBER editor suite green.
3. `npm run lint` and `npm run typecheck` pass.

### Invariants

1. Each rendered card-style enum group has a `name` unique to that group instance; selecting a value in one list item never alters the displayed selection of any other list item.
2. The fix is presentation-layer only: `copy_policy`/`local_function` values, schema, deterministic compilation, and validation behavior are unchanged.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/CastMemberEditor.test.tsx` — add a test asserting per-list-item radio-group `name` uniqueness (and intra-group sharing) for `copy_policy`; this is the defect-precise assertion given jsdom does not emulate native radio exclusivity.

### Commands

1. `npx vitest run packages/web/src/records/CastMemberEditor.test.tsx`
2. `npm test`
3. `npm run lint && npm run typecheck` — confirms the `useId` import and component change satisfy lint/strict-TS gates.
