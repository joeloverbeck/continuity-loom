# SPEC015FIEGUICON-008: Wire FieldHelp into RecordEditor/FieldShell, story config, and cast sections

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `RecordEditor`/`FieldShell` render per-field help; `CastMemberEditor` threads owner kind and reconciles inline hints; `StoryConfigEditor` inherits. No change to form payload or validation.
**Deps**: SPEC015FIEGUICON-007

## Problem

`FieldHelp` (SPEC015FIEGUICON-007) is a standalone component; this ticket renders it inside the generic record editor so guidance appears at the point of authoring across record editing, story configuration, and cast dossiers. SPEC-015 §8.3 and §12.1 require a guided `FieldShell`, reuse of the shared renderer in cast sections, and that critical hints stay visible. Reassessment finding **M4** requires the existing hand-written inline hints to be subsumed, not duplicated.

## Assumption Reassessment (2026-06-07)

1. `packages/web/src/records/RecordEditor.tsx`: `FieldShell({field, path, children, form, serverIssues})` renders label + required marker + client/server errors and has **no** help trigger (confirmed); `FieldRenderer` recurses nested groups at `${path}.${child.name}` and list items at `${path}.${index}`. `packages/web/src/records/CastMemberEditor.tsx` **already imports and uses the shared `FieldRenderer`** (per section, `path={field.name}`, confirmed line ~168) — so §8.3's "reuse the same field renderer" is already satisfied; only owner-kind threading is needed for cast help. `packages/web/src/config/StoryConfigEditor.tsx` reuses `RecordEditor` with `recordType` = the config kind, so it inherits help with no source change. `FieldHelp`/`fieldHelpId` (SPEC015FIEGUICON-007), `normalizeListIndices` (SPEC015FIEGUICON-001), and `getFieldGuidance` (SPEC015FIEGUICON-002) are available.
2. The integration patterns and visible-critical rule are `specs/SPEC-015-…md` §8.3, §12.1, §19.5; reassessment finding **M4** names the exact inline hints to reconcile.
3. **Shared boundary under audit**: `FieldShell` must compute the canonical guidance key as `${ownerKind}.${normalizeListIndices(path)}` — so an `ownerKind` must be threaded from `RecordEditor` (= `recordType`, including the story-config kinds `STORY CONTRACT`/`UNIVERSAL CONTENT POLICY`/`PROSE MODE`) and from `CastMemberEditor` (= `"CAST MEMBER"`) down through `FieldRenderer`/`ListField`. A wrong owner kind makes the lookup miss; this is the contract joining the web renderer to the core catalog keys.
4. **FOUNDATIONS §10 / §29.4 + §17 (cast voice) + M4**: `FieldHelp` renders adjacent to each control and reads guidance for display only — the form payload, prune logic, and Zod validation are untouched (help never enters the generation payload). M4: the duplicate per-field inline notices in `CastMemberEditor` (the sample-utterance copy-policy note; the raw `emphasisFieldPaths` list) are subsumed by per-field help, while the genuinely section-scoped doctrine (the durable-dossier boundary notice and the long-dossier warning) remains as the single section-level copy, not re-emitted inside field popovers.

## Architecture Check

1. Threading a single `ownerKind` and computing the canonical key in `FieldShell` centralizes path derivation (reusing SPEC015FIEGUICON-001) instead of having each surface invent paths — `StoryConfigEditor` and `CastMemberEditor` then inherit help for free because both already route through the shared renderer. Graceful degradation (no guidance entry → label-only) keeps the editor working while content tickets land.
2. No backwards-compatibility shim: `FieldShell` gains a trigger; no parallel "old vs new" field renderer is introduced.

## Verification Layers

1. Per-field help renders in the generic editor → RTL test (`RecordEditor.test.tsx`) asserting a `Help for <label>` trigger for a known guided field and that the canonical key resolves.
2. Cast per-field help renders inside sections → RTL test (`CastMemberEditor.test.tsx`) asserting a trigger appears for a `voice_anchor` field and that the reconciled notices are not duplicated.
3. Story-config inherits help → RTL test (`StoryConfigEditor.test.tsx`) asserting a trigger for `premise`/`pov_character`.
4. Form payload/validation unchanged → existing `RecordEditor`/`CastMemberEditor` submit tests stay green (display-only invariant).

## What to Change

### 1. `packages/web/src/records/RecordEditor.tsx`

- Add an `ownerKind: string` prop threaded `RecordEditor → FieldRenderer → ListField/nested → FieldShell`. In `FieldShell`, compute `canonicalPath = \`${ownerKind}.${normalizeListIndices(path)}\`` and render `<FieldHelp fieldPath={canonicalPath} fieldLabel={field.name} listContext={path} />` adjacent to the label, alongside (not replacing) the required marker and error region. `RecordEditor` passes `ownerKind={recordType}`.

### 2. `packages/web/src/records/CastMemberEditor.tsx`

- Pass `ownerKind="CAST MEMBER"` to each `FieldRenderer`. Reconcile inline hints per M4: drop the per-field `sample_utterances` muted note and the raw `emphasisFieldPaths` `<ul>` (now carried by per-field help), keep the section-scoped durable-dossier boundary notice and long-dossier warning as the single source.

### 3. Tests

- Extend `RecordEditor.test.tsx`, `CastMemberEditor.test.tsx`, `StoryConfigEditor.test.tsx` with the help-presence assertions above; keep existing submit/validation assertions.

## Files to Touch

- `packages/web/src/records/RecordEditor.tsx` (modify)
- `packages/web/src/records/CastMemberEditor.tsx` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)
- `packages/web/src/records/CastMemberEditor.test.tsx` (modify)
- `packages/web/src/config/StoryConfigEditor.test.tsx` (modify)

## Out of Scope

- `GenerationBriefView` help triggers (SPEC015FIEGUICON-009).
- Enum radio/card controls and selected-value display (SPEC015FIEGUICON-010).
- Authoring guidance content (SPEC015FIEGUICON-004/005/006) — this ticket renders whatever the catalog holds.
- `StoryConfigEditor.tsx` source changes — it inherits help through `RecordEditor` with no edit.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- RecordEditor` (vitest + RTL, `@loom/web`) — a guided record field renders a `Help for <label>` trigger; existing submit/validation assertions still pass.
2. `npm test -- CastMemberEditor` and `npm test -- StoryConfigEditor` — per-field help renders inside cast sections and on story-config fields; the reconciled cast inline notices are not duplicated.
3. `npm run typecheck && npm run lint` pass (web package).

### Invariants

1. The canonical guidance key is `${ownerKind}.${normalizeListIndices(path)}` everywhere a field is rendered; no surface invents its own path scheme.
2. Wiring help changes no form payload, prune behavior, or validation result.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordEditor.test.tsx` — help-trigger presence + unchanged submit.
2. `packages/web/src/records/CastMemberEditor.test.tsx` — cast-section help + reconciled notices.
3. `packages/web/src/config/StoryConfigEditor.test.tsx` — inherited help.

### Commands

1. `npm test -- RecordEditor CastMemberEditor StoryConfigEditor`
2. `npm run typecheck && npm run lint`

## Outcome

Completed: 2026-06-07

Changed:

- Threaded `ownerKind` through `RecordEditor`, `FieldRenderer`, `ListField`, nested groups, and cast-section rendering.
- `FieldShell` now computes canonical guidance keys as `${ownerKind}.${normalizeListIndices(path)}` and renders `FieldHelp` adjacent to each field label.
- Story configuration inherits per-field help through `RecordEditor` with no `StoryConfigEditor.tsx` source change.
- Cast sections now pass `ownerKind="CAST MEMBER"` and no longer render duplicate sample-utterance or raw emphasis-path inline notices that are covered by per-field guidance.
- Extended `RecordEditor`, `CastMemberEditor`, and `StoryConfigEditor` tests for help-trigger presence and cast notice reconciliation.

Deviations from original plan:

- Placed the help trigger outside the wrapping `<label>` but adjacent to it, so the help button does not become part of the input label text or label click target.

Verification:

- `npm test -- RecordEditor CastMemberEditor StoryConfigEditor` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
