# SPEC003TYPDATMOD-009: Generation-time brief surface schemas (schemas only)

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` Zod schemas for the eight generation-time brief surfaces; exports from `packages/core/src/index.ts`. No durable-record registration (brief surfaces are session state, not durable records).
**Deps**: SPEC003TYPDATMOD-001

## Problem

The generation-time brief defines the next prose-segment request: ACTIVE WORKING SET, CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF, MANUAL MOMENT DIRECTIVE, CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, GENERATION VALIDATION FOCUS, and STOP GUIDANCE. Phase 3 defines their runtime schemas (only) so the server's `generation_session` table (ticket 012) can persist and validate the current brief state; the workflow editor (Phase 5), validation (Phase 6), and compilation (Phase 7) are deferred.

## Assumption Reassessment (2026-06-05)

1. Substrate from SPEC003TYPDATMOD-001 exists (schemas/exports). Brief surfaces are conceptually distinct from durable records (`DATA-MODEL-AND-RECORDS.md` "Generation-time brief"), so they are exported as standalone schemas and are NOT registered as durable record types in the record-type registry.
2. Field names from `docs/story-record-schema.md` §3.1–§3.8: ACTIVE WORKING SET (§3.1 `selected_records`, `active_onstage_cast_full`, …), CURRENT AUTHORITATIVE STATE (§3.2), IMMEDIATE HANDOFF (§3.3 incl. `prior_accepted_prose_status_or_handoff_note`), MANUAL MOMENT DIRECTIVE (§3.4 `must_render` required), CURRENT CAST VOICE PRESSURE (§3.5), CAST VOICE OVERRIDES (§3.6 `scope: current_generation_only`), GENERATION VALIDATION FOCUS (§3.7 exactly one `generation_context`), STOP GUIDANCE (§3.8 `soft_unit_guidance`).
3. Cross-artifact boundary: these schemas are consumed by ticket 012's `getGenerationSession`/`setGenerationSession`. The contract is "minimal persisted current brief state (JSON), Zod-validated."
4. FOUNDATIONS §10/§28.1 (no accepted prose in prompts) motivates IMMEDIATE HANDOFF: the schema must name the field `prior_accepted_prose_status_or_handoff_note` and must NOT define any field labeled "most recent accepted prose"/"accepted prose summary". Restated: the field exists for a user-authored handoff note or `None`; the schema must not invite prose mining (§10). The secret firewall (§15) is untouched — no compilation here.
5. CAST VOICE OVERRIDES `scope` is `current_generation_only`; the schema does not persist into CAST MEMBER (that is a Phase-5/7 compiler concern). These are session schemas with no durable-record reference projections.

## Architecture Check

1. Defining brief schemas without registry registration keeps the durable/session distinction explicit in code (FOUNDATIONS §6 — five continuity surfaces kept distinct), so the repository routes session state to `generation_session`, never to `records`.
2. No backwards-compatibility shims; no accepted-prose-as-source field.

## Verification Layers

1. Eight brief schemas match `docs/story-record-schema.md` §3.1–§3.8 -> schema validation test (accept valid; reject missing `must_render` / missing `generation_context` / unknown key).
2. IMMEDIATE HANDOFF field name is exactly `prior_accepted_prose_status_or_handoff_note` and no accepted-prose-source field exists -> grep-proof against `generation-brief.ts` (FOUNDATIONS §10/§29.4).
3. Brief surfaces are NOT in the durable record-type registry -> grep-proof / registry test asserting absence.

## What to Change

### 1. Brief schemas

Add `packages/core/src/records/generation-brief.ts`: Zod `.strict()` schemas for the eight surfaces per §3, with required-field rules (`must_render`, single `generation_context`, `soft_unit_guidance`).

### 2. Exports (no registration)

Re-export the eight schemas from `packages/core/src/index.ts`. Do not register them in the durable record-type registry.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (new)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/generation-brief.test.ts` (new)

## Out of Scope

- The generation-time brief **workflow editor** — Phase 5.
- Validation-focus-tag deterministic checks — Phase 6.
- Compiling brief surfaces / voice pressure pins into the prompt — Phase 7.
- The `generation_session` DDL table and accessors — tickets 010/012.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — accept valid brief fixtures; reject missing `must_render`, missing `generation_context`, unknown keys; confirm IMMEDIATE HANDOFF field name and absence of any accepted-prose-source field.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. IMMEDIATE HANDOFF uses `prior_accepted_prose_status_or_handoff_note` and defines no "accepted prose summary/source" field (§10).
2. Brief surfaces are not registered as durable record types (§6 surface distinction).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/generation-brief.test.ts` — per-surface accept/reject, required-field rules, handoff-field-name grep assertion, non-registration assertion.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
