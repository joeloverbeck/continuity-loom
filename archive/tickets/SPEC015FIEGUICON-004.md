# SPEC015FIEGUICON-004: Guidance content for generation-brief and story-config fields

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new guidance-content module (`field-guidance-brief-config.ts`), registry wiring in `field-guidance.ts`, and a scoped coverage test; no production behavior change (catalog not yet consumed by compiler or UI).
**Deps**: SPEC015FIEGUICON-002, SPEC015FIEGUICON-003

## Problem

The generation brief and story configuration carry the highest-risk authoring fields in the product — the handoff note that must not become a prose-paste channel, the manual directive that cannot override canon, current authoritative state, validation focus tags, and stop guidance. SPEC-015 §14.1–§14.11 and §15.1–§15.2 specify product copy for these. This ticket authors the guidance entries for **every** `generationSessionSchema` leaf field (full-schema coverage per Q1(a)) and every story-config field, with high-risk fields getting examples and anti-examples (§19.3 high-risk-first), and registers them in the catalog.

## Assumption Reassessment (2026-06-07)

1. The model/registry/lookup/validator (`field-guidance.ts`) come from SPEC015FIEGUICON-002 and the path sources (`storyConfigFieldPaths`, `generationBriefFieldPaths`) from SPEC015FIEGUICON-003. The field paths are confirmed against `packages/core/src/records/generation-brief.ts` (`immediate_handoff.{recent_causal_context,last_visible_moment,prior_accepted_prose_status_or_handoff_note,begin_after}`, `manual_moment_directive.{must_render,may_render_if_naturally_caused,do_not_force}`, `current_authoritative_state.*`, `current_cast_voice_pressure[].*`, `cast_voice_overrides[].*`, `generation_validation_focus.validation_focus_tags.{generation_context,expected_local_modes,possible_durable_changes}`, `stop_guidance.soft_unit_guidance`) and `packages/core/src/records/global-config.ts` (`storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema`). Prompt destinations confirmed present in `PLACEHOLDER_MAP` (`{prior_accepted_prose_status_or_handoff_note}`, `{manual_must_render}`, `{soft_unit_guidance}`, current-state placeholders).
2. The required copy semantics are `specs/SPEC-015-…md` §14.1–§14.11, §15.1–§15.2; coverage rules §11 r1–2,6,7; Q1(a) (catalog covers the full schema, including the not-yet-rendered `begin_after`/`do_not_force[]`/`consent_or_force_conditions`).
3. **Shared boundary under audit**: each authored entry's `fieldPath`/`ownerKind` must equal a path emitted by SPEC015FIEGUICON-003 (`GENERATION BRIEF.…`, `STORY CONTRACT.…`, `UNIVERSAL CONTENT POLICY.…`, `PROSE MODE.…`); a mismatch makes the scoped coverage test fail (the intended guard) rather than silently mis-key the UI lookup.
4. **FOUNDATIONS §10 / §29.4 (no accepted prose / no help in prompts) and §11 (warnings vs blockers)**: the `prior_accepted_prose_status_or_handoff_note` entry teaches the accepted-prose exclusion in context (§14.1) and must carry no "paste/auto-summarize prose" wording; the `validation_focus_tags.*` entries are `promptFacing: "never"` with `promptDestinations: []` (§14.10, "checks, not plot beats") and must carry no prompt-sent language. These invariants are enforced by the doctrine-regression suite in SPEC015FIEGUICON-011; this ticket supplies copy that already satisfies them.

## Architecture Check

1. Authoring brief + story-config content in one module keyed by canonical path (rather than scattering copy through React components, §6) keeps doctrine reviewable as data and lets the scoped coverage test prove completeness for these two surfaces independently of record content (005/006). High-risk-first authoring within the ticket honors §19.3 without a cross-cutting "high-risk only" ticket that would leave the catalog half-covered.
2. No backwards-compatibility shim: net-new content; the `field-guidance.ts` change is the additive registry-aggregation wiring SPEC015FIEGUICON-002 left open.

## Verification Layers

1. Full brief + story-config coverage → scoped test iterating `storyConfigFieldPaths()` ∪ `generationBriefFieldPaths()` and asserting `getFieldGuidance(path)` is defined for each.
2. Prompt-destination validity → test running `validatePromptDestinations` over every entry in this module (must all return `[]`).
3. Validation-only discipline → test asserting `validation_focus_tags.*` entries have `promptFacing === "never"` and `promptDestinations: []`.
4. High-risk completeness → test asserting the handoff/directive/stop entries (`…prior_accepted_prose_status_or_handoff_note`, `…must_render[]`, `…soft_unit_guidance`) carry non-empty `examples` and `antiExamples` (§14, §18.3).

## What to Change

### 1. New module `packages/core/src/records/field-guidance-brief-config.ts`

- Author a `FieldGuidance` entry for every story-config field (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE) and every `generationSessionSchema` leaf path, `surface: "story_config" | "generation_brief"`.
- High-risk entries (per §14.1–§14.11) with `examples`/`antiExamples`: handoff note (accepted-prose exclusion), `recent_causal_context`, `begin_after`, `must_render[]` / `may_render_if_naturally_caused[]` / `do_not_force[]` (pressure-not-override), current authoritative state (`promptDestinations` across current-state placeholders), current cast voice pressure (temporary, not durable identity), cast voice overrides (current-generation-only), validation focus tags (`promptFacing: "never"`), stop guidance.
- Enum guidance (§15.1) for `content_intensity`, `psychic_distance`, `interiority`/`interiority_mode`, `dialogue_density`, `person`/`pov_character` where consequences are non-obvious.

### 2. Registry wiring `packages/core/src/records/field-guidance.ts`

- Import `briefConfigGuidance` from the new module and spread it into the `GUIDANCE_ENTRIES` aggregation (the open extension point from SPEC015FIEGUICON-002).

## Files to Touch

- `packages/core/src/records/field-guidance-brief-config.ts` (new)
- `packages/core/test/field-guidance-brief-config.test.ts` (new)
- `packages/core/src/records/field-guidance.ts` (modify — registry aggregation; Deps SPEC015FIEGUICON-002 creates this file)

## Out of Scope

- Record-type, cast-member, entity/material guidance (SPEC015FIEGUICON-005, -006).
- Any web rendering or UI help triggers (SPEC015FIEGUICON-007+).
- Rendering the not-yet-rendered brief fields in `GenerationBriefView` — §7.2 pre-validated non-goal; this ticket authors their catalog entries but adds no UI.
- The global cross-surface coverage gate and doctrine-regression suite (SPEC015FIEGUICON-011).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance-brief-config` (vitest, `@loom/core`) — every path in `storyConfigFieldPaths()` ∪ `generationBriefFieldPaths()` resolves to a guidance entry.
2. `npm test -- field-guidance-brief-config` — `validatePromptDestinations` returns `[]` for every authored entry; `validation_focus_tags.*` entries are `promptFacing: "never"` with empty `promptDestinations`.
3. `npm run typecheck && npm run lint` pass.

### Invariants

1. Catalog coverage for the brief is keyed to the full `generationSessionSchema` (no field omitted because the UI does not yet render it).
2. No entry's copy implies pasting/auto-summarizing accepted prose or instructing the prose model via a validation-only field.

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-brief-config.test.ts` — surface coverage, destination validity, validation-only discipline, high-risk example/anti-example presence.

### Commands

1. `npm test -- field-guidance-brief-config`
2. `npm test -- field-guidance` — confirms registry aggregation still builds (no duplicate `fieldPath`).
3. `npm run typecheck && npm run lint`

## Outcome

Completed: 2026-06-07

Changed:

- Added `packages/core/src/records/field-guidance-brief-config.ts` with authored guidance entries for every schema-derived story-config path and every full `generationSessionSchema` path.
- Wired `briefConfigGuidance` into the core guidance registry.
- Added enum guidance for high-impact story-config/prose-mode and generation-brief enum fields.
- Added high-risk examples, anti-examples, doctrine warnings, and visible hints for accepted-prose handoff, manual directives, cast voice pressure, validation focus, temporary voice overrides, and stop guidance.
- Added `packages/core/test/field-guidance-brief-config.test.ts` for full surface coverage, destination validity, validation-only discipline, and high-risk example coverage.

Deviations from original plan:

- None.

Verification:

- `npm test -- field-guidance-brief-config` passed.
- `npm test -- field-guidance` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
