# SPEC005CUSCASGEN-005: Custom sectioned CAST MEMBER editor

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — rewrite `packages/web/src/records/CastMemberEditor.tsx` from a generic delegate into a custom sectioned editor (optional `cast-member/` subcomponents)
**Deps**: SPEC005CUSCASGEN-001

## Problem

`CastMemberEditor.tsx` is a 7-line wrapper delegating to the generic `RecordEditor`, rendering the deep dossier (identity, the 14-field `voice_anchor`, pressure/body/agency cores, five optional extended groups, sample utterances) as one undifferentiated form. It exposes every field (SPEC-004 contract) but has no section navigation, does not make durable identity vs. current-generation voice pressure visibly distinct, and gives no long-dossier guidance (`UI-WORKFLOWS.md:92-109`). Replace it with a custom sectioned editor driven by the core section model (SPEC005CUSCASGEN-001).

## Assumption Reassessment (2026-06-05)

1. `CastMemberEditor` (`packages/web/src/records/CastMemberEditor.tsx:1-8`) delegates to `RecordEditor` with props `Omit<RecordEditorProps, "recordType">`. It is consumed by `RecordBrowser.tsx` (import `:18`, usage `:236` passing `record` / `referenceRecords` / `onSaved`) and by `CastMemberEditor.test.tsx`. Keeping the export name and props at the same path leaves `RecordBrowser.tsx` untouched.
2. `castMemberSectionModel()` from SPEC005CUSCASGEN-001 (`@loom/core`) supplies the ordered sections. `docs/story-record-schema.md:496-512` (§5.5) and `docs/requirements-version-1/UI-WORKFLOWS.md:92-109` define the section set, the durable-vs-current rule, and the long-dossier warning-only (no auto-compression) rule. Sample-utterance annotation fields (`situation`, `speech_function`, `pressure_tags`, `copy_policy` default `never_copy_verbatim`) are in `packages/core/src/records/cast-member.ts:55-77`.
3. Shared boundary under audit: this editor consumes the core section model (a `FieldDescriptor` grouping) and the existing CRUD client (`createRecord` / `updateRecord` in `api.ts`). It must keep every populated field rendered (no silent drop — SPEC-004 contract) and preserve the `onSaved(savedRecord)` callback shape `RecordBrowser.tsx` relies on.
4. (FOUNDATIONS §17 / §29.3 / §8.8) Durable identity and `voice_anchor` sections are presented as the persistent dossier; current voice pressure and temporary overrides live in the generation-time brief (SPEC005CUSCASGEN-006) and are never auto-written here. For active/onstage cast the editor warns about long dossiers and suggests stronger current pins but offers **no** automatic compression (§5.5 "salience rule, not a compression rule").
5. (Skill rename/removal blast radius) The generic delegation is removed. Repo-wide grep confirms the only consumers of `CastMemberEditor` are `RecordBrowser.tsx` (import/usage) and `CastMemberEditor.test.tsx`; both are handled by keeping the export name and path (so `RecordBrowser.tsx` needs no change) and rewriting the test. No other consumer exists.

## Architecture Check

1. Driving the editor from the core section model (the single ordering source) keeps presentation deterministic and avoids duplicating field order in React; sectioned navigation plus explicit durable/current copy makes the §17 distinction structural rather than incidental. Reusing the existing field-input primitives from `RecordEditor` (where extractable) avoids reimplementing field widgets.
2. No backwards-compatibility aliasing or shims — the component keeps its name and path (no alias); the generic delegation is replaced, not wrapped.

## Verification Layers

1. Every populated field renders → `CastMemberEditor.test.tsx`: all dossier fields present for a fully-populated record (no silent drop).
2. Section navigation works → `CastMemberEditor.test.tsx`: sections are navigable; required-core first, optional-extended marked.
3. Durable identity vs. current voice pressure visibly distinct → `CastMemberEditor.test.tsx`: the durable sections are presented as the persistent dossier and no current-voice-pressure / override authoring appears inline.
4. Long-dossier warning without auto-compression → `CastMemberEditor.test.tsx`: the warning appears for an active/onstage long dossier and no compression control is offered.

## What to Change

### 1. Custom sectioned editor

Rewrite `CastMemberEditor.tsx` (same export name, same `Omit<RecordEditorProps, "recordType">` props, same path) to render sections from `castMemberSectionModel()`: left-rail / tabbed section navigation; required-core sections first, optional-extended clearly marked; durable identity / `voice_anchor` sections labeled as the persistent dossier with copy explaining that current voice pressure and temporary overrides live in the generation-time brief; a long-dossier warning for active/onstage cast (no auto-compression); sample utterances rendered with their `situation` / `speech_function` / `pressure_tags` / `copy_policy` annotations (default `never_copy_verbatim`), kept sparse. Submit through the existing CRUD client and preserve `onSaved`.

### 2. Optional subcomponents

Section subcomponents may be extracted under `packages/web/src/records/cast-member/`; the public `CastMemberEditor` export stays at `packages/web/src/records/CastMemberEditor.tsx`.

## Files to Touch

- `packages/web/src/records/CastMemberEditor.tsx` (modify)
- `packages/web/src/records/CastMemberEditor.test.tsx` (modify)
- `packages/web/src/records/cast-member/` (new, optional — extracted section subcomponents)

## Out of Scope

- Current voice pressure / cast voice override authoring (generation-time brief — SPEC005CUSCASGEN-006).
- Current-voice-pressure-pin compilation (Phase 7).
- Active-working-set bands / `local_function` (SPEC005CUSCASGEN-007).
- Any new or renamed schema field; relocating the `CastMemberEditor` export (kept at its current path so `RecordBrowser.tsx` is untouched).

## Acceptance Criteria

### Tests That Must Pass

1. `CastMemberEditor.test.tsx`: a fully-populated CAST MEMBER renders every field across navigable sections (no silent drop).
2. `CastMemberEditor.test.tsx`: durable identity and current voice pressure are presented as distinct surfaces; the long-dossier warning appears without offering auto-compression.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. No populated dossier field is silently dropped; the editor adds no new field.
2. No automatic compression of active/onstage dossiers; no current-voice-pressure / override authoring on this surface.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/CastMemberEditor.test.tsx` — field coverage, section navigation, durable-vs-current distinction, long-dossier warning (no compression control).

### Commands

1. `npm test` — builds `@loom/core`, then runs Vitest (includes the rewritten `CastMemberEditor.test.tsx`).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the editor is proven by `CastMemberEditor.test.tsx` within `npm test`; `npx vitest run packages/web/src/records/CastMemberEditor.test.tsx` (from `packages/web`) filters to it during development.
