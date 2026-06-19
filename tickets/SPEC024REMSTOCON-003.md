# SPEC024REMSTOCON-003: Remove the `prose_preferences` group from the story-config UI

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — removes the `prose_preferences` `nested_group` from the STORY CONTRACT editor descriptor and the three STORY-CONTRACT prose-prefs paths from `EnumGuidance`, plus the editor test fixture; no production behavior beyond the editor no longer rendering the dead group.
**Deps**: SPEC024REMSTOCON-001

## Problem

The story-config editor renders a `prose_preferences` nested group under STORY CONTRACT (`packages/web/src/config/StoryConfigEditor.tsx:54-61`) and offers contextual enum help for three of its paths (`packages/web/src/field-help/EnumGuidance.tsx:18-20`). Once SPEC024REMSTOCON-001 removes the field from `storyContractSchema`, this UI edits a group the schema rejects on save — it must be removed so the editor matches the surviving record shape, leaving PROSE MODE as the sole place these four knobs are edited.

## Assumption Reassessment (2026-06-19)

1. **UI surfaces confirmed** (grep, 2026-06-19): `StoryConfigEditor.tsx:54-61` declares `field("prose_preferences", "nested_group", { fields: [psychic_distance, dialogue_density, interiority, paragraphing] })` inside the STORY CONTRACT descriptor; `EnumGuidance.tsx:18-20` lists the three `STORY CONTRACT.prose_preferences.*` enum paths (psychic_distance, dialogue_density, interiority); `StoryConfigEditor.test.tsx:29` carries a `prose_preferences` fixture block. The PROSE MODE descriptor (`StoryConfigEditor.tsx:74+`) is unaffected.
2. **Schema authority** (`docs/story-record-schema.md`, updated in 001): STORY CONTRACT no longer defines `prose_preferences`; the four knobs survive only on PROSE MODE. No web schema drift beyond this removal.
3. **Cross-package boundary under audit:** `@loom/web` consumes `@loom/core`'s `StoryContract` shape. This ticket `Deps` on SPEC024REMSTOCON-001 and co-lands with it — a STORY CONTRACT payload built or parsed through the post-001 schema must not include `prose_preferences`, so the editor test fixture is updated in lockstep.
4. **FOUNDATIONS alignment (§13 field economy, §27 UI distinctness):** removing the dead editor group makes the surfaces more honest — the four knobs appear once (PROSE MODE), not twice — satisfying §29.11's "more distinct rather than more blurred" quality check. No continuity-bearing or prompt-facing surface is touched.

## Architecture Check

1. Deleting the descriptor entry and the three guidance paths is the minimal change that aligns the editor with the post-001 schema; no alternative (hiding/disabling the group) is justified since the field is gone outright.
2. No backwards-compatibility shim or alias is introduced.
3. **Co-landing constraint:** lands in the **same revision** as SPEC024REMSTOCON-001; must not merge standalone (the editor would otherwise let users save a `prose_preferences` block the post-001 schema rejects, or — if its fixture is type-bound — break web typecheck against the still-required field before 001 lands).

## Verification Layers

1. The STORY CONTRACT editor descriptor no longer renders a `prose_preferences` group → `StoryConfigEditor.test.tsx` (component assertion) + grep-proof (`prose_preferences` absent from `StoryConfigEditor.tsx`).
2. `EnumGuidance` no longer lists the three `STORY CONTRACT.prose_preferences.*` paths → grep-proof (`EnumGuidance.tsx` absent).

## What to Change

### 1. Editor descriptor (`StoryConfigEditor.tsx`)

Remove the `field("prose_preferences", "nested_group", { … })` entry (lines 54-61) from the STORY CONTRACT descriptor. Leave the PROSE MODE descriptor and all other STORY CONTRACT fields intact.

### 2. Enum guidance (`EnumGuidance.tsx`)

Remove the three `STORY CONTRACT.prose_preferences.*` path entries (lines 18-20).

### 3. Editor test (`StoryConfigEditor.test.tsx`)

Drop the `prose_preferences` block from the STORY CONTRACT fixture (line 29) and any assertion that the group renders; keep coverage of the surviving STORY CONTRACT fields.

## Files to Touch

- `packages/web/src/config/StoryConfigEditor.tsx` (modify)
- `packages/web/src/field-help/EnumGuidance.tsx` (modify)
- `packages/web/src/config/StoryConfigEditor.test.tsx` (modify)

## Out of Scope

- Any change to the PROSE MODE editor descriptor or its enum guidance.
- The `@loom/core` schema/validation removal (SPEC024REMSTOCON-001) and the `@loom/server` migration (SPEC024REMSTOCON-002).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web` — green after the fixture update; the STORY CONTRACT editor renders no `prose_preferences` group.
2. `npm run typecheck` — clean across `@loom/web`.

### Invariants

1. The story-config UI edits the four prose-style knobs in exactly one place (PROSE MODE); STORY CONTRACT exposes none.

## Test Plan

### New/Modified Tests

1. `packages/web/src/config/StoryConfigEditor.test.tsx` — drop the `prose_preferences` fixture block and assert the STORY CONTRACT descriptor no longer renders the group.

### Commands

1. `npm test --workspace @loom/web`
2. `npm run typecheck`
3. `grep -rn "prose_preferences" packages/web/src && echo FAIL || echo OK` — targeted; repo-wide sweep is the capstone (SPEC024REMSTOCON-004).
