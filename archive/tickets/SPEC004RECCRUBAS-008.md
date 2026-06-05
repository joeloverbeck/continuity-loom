# SPEC004RECCRUBAS-008: Web complete generic CAST MEMBER editor

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` CAST MEMBER editor surface (generic, complete)
**Deps**: SPEC004RECCRUBAS-007

## Problem

The Phase-4 gate requires full CRUD for *every* schema record type, and CAST MEMBER is the rich exception: its dossier carries the required voice/behavior/body/agency core plus all optional extended fields (`story-record-schema.md` §5). Phase 5 will deliver the *custom, sectioned, navigable* CAST MEMBER editor; Phase 4 must deliver a **complete but plain** editor that exposes every populated CAST MEMBER field with no silent drop, so a cast dossier can be authored and edited now. This ticket wires CAST MEMBER onto the generic editor engine (-007) and verifies field completeness, deferring the rich UX to Phase 5.

## Assumption Reassessment (2026-06-05)

1. The editor engine from SPEC004RECCRUBAS-007 (`packages/web/src/records/RecordEditor.tsx`) renders nested groups and lists, and the CAST MEMBER descriptor from SPEC004RECCRUBAS-001 enumerates the full field tree of `castMemberSchema` (`packages/core/src/records/cast-member.ts`): `identity`, `voice_anchor` (with `must_preserve`/`must_avoid`/`anti_repetition_warnings` lists), `pressure_behavior_core`, `body_presence_core`, `agency_core`, plus optional `world_pressure_core`, `relational_charge`, `moral_psychological_edge`, `voice_extended`, `body_and_presence_extended`, `perception_and_embodiment`, `pressure_behavior_extended`, `agency_and_planning_extended`, `sample_utterances`.
2. Spec `specs/SPEC-004-...md` (Approach → "the same engine renders CAST MEMBER completely … functional but plain; the custom sectioned editor is Phase 5"; scope decision #2) and `IMPLEMENTATION-ORDER.md` Phase 5 ("Custom rich editors for CAST MEMBER") confirm the split. `docs/requirements-version-1/UI-WORKFLOWS.md` "CAST MEMBER rich editor" describes the Phase-5 target, explicitly out of scope here.
3. Shared boundary under audit: the **editor engine component API** (-007) and the **CAST MEMBER descriptor** (-001) — this ticket adds no new form primitives; it composes them and asserts full-field coverage for the deepest schema in the registry.
4. FOUNDATIONS §17 (character voice is continuity; active cast must not be flattened) and §29.3 (no silent compression of active/onstage cast dossiers) motivate the hard requirement that the editor expose **every** populated CAST MEMBER field — the engine must not truncate, collapse, or hide any dossier field. This is a data-authoring surface, not a compiler surface, so "no silent compression" here means the UI never drops a field from edit.

## Architecture Check

1. Reusing the generic engine for CAST MEMBER (rather than hand-building a bespoke form now) delivers complete coverage with minimal new code and keeps the field list schema-sourced, so it cannot drift from `cast-member.ts`. The Phase-5 custom editor replaces the presentation without changing the data contract.
2. No backwards-compatibility shim: the CAST MEMBER editor is the engine applied to one type; no parallel cast form or alias is introduced.

## Verification Layers

1. The CAST MEMBER editor exposes every field of `castMemberSchema` (core + all extended) for edit — none omitted -> web component test diffing rendered fields against the descriptor/schema key set.
2. Create + edit round-trip of a CAST MEMBER with populated extended fields persists all of them -> component test with mocked create/update routes asserting payload completeness.
3. Sample-utterance and list/nested fields are editable (add/remove) -> component test.

## What to Change

### 1. CAST MEMBER editor wiring

Add `packages/web/src/records/CastMemberEditor.tsx` (a thin composition over `RecordEditor` for the `CAST MEMBER` type), reachable from the browser's create/edit actions for CAST MEMBER. It renders the full descriptor — required core first, then optional extended fields in schema order, sample utterances last (per `story-record-schema.md` §5.5 render order) — using the generic engine's controls. No truncation, no "show more" that hides fields by default.

## Files to Touch

- `packages/web/src/records/CastMemberEditor.tsx` (new)
- `packages/web/src/records/CastMemberEditor.test.tsx` (new)

## Out of Scope

- The Phase-5 custom **sectioned, navigable** CAST MEMBER editor, long-dossier warnings, current-vs-durable voice-pressure distinction, and temporary voice overrides — Phase 5.
- Generation-time CAST VOICE OVERRIDES / current voice pressure surfaces — Phase 5.
- Any new form primitive (all controls come from SPEC004RECCRUBAS-007).
- Compiler-side dossier rendering / no-compression-at-compile — Phase 7.

## Acceptance Criteria

### Tests That Must Pass

1. The CAST MEMBER editor renders an editable control for **every** field in `castMemberSchema` (core + extended), asserted against the descriptor/schema key set — no field omitted or hidden by default.
2. Creating and editing a CAST MEMBER with populated extended fields and sample utterances persists all of them (mocked routes).
3. List and nested-group fields (e.g. `must_avoid`, `anti_repetition_warnings`, `sample_utterances`) support add/remove.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. The editor never silently drops, truncates, or hides-by-default a populated CAST MEMBER field (FOUNDATIONS §17/§29.3).
2. CAST MEMBER is editable through typed UI, not raw JSON.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/CastMemberEditor.test.tsx` — full-field coverage diff, populated-extended round-trip, list/nested add-remove.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/records/CastMemberEditor.test.tsx`
2. `npm test && npm run typecheck && npm run lint && npm run build`
