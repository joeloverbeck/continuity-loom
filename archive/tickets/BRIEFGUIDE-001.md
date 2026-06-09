# BRIEFGUIDE-001: Add a deterministic requiredness tier to field guidance

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends the `FieldGuidance` type (`packages/core/src/records/field-guidance.ts`) and populates a new `requiredness` field across the generation-brief guidance entries (`packages/core/src/records/field-guidance-brief-config.ts`). No prompt-compilation or validation-gate behavior changes.
**Deps**: none

## Problem

The generation brief offers no answer to "which of these fields do I actually have to fill in?" `FieldGuidance` (the per-field metadata the editors consume) carries `promptFacing` but **no requiredness**. Requiredness is computed only by the readiness blocker engine and surfaced only in the separate `ValidationPanel`/`ReadinessChecklist`, never next to the field. There is no single, deterministic, UI-consumable source of per-field requiredness — so the popup (BRIEFGUIDE-003) and the inline page markers (BRIEFGUIDE-004) would otherwise each have to re-derive it and risk drifting from the contract.

This ticket adds that single source. It is **descriptive metadata that mirrors `docs/compiler-contract.md`** — it does **not** become a gate. The readiness blocker engine remains the sole fail-closed authority for Prompt Preview / Generate.

## Assumption Reassessment (2026-06-09)

1. `FieldGuidance` is defined at `packages/core/src/records/field-guidance.ts:20-38` and currently has `promptFacing: PromptFacing` but no requiredness field. The registry is built from `briefConfigGuidance` + `castMaterialGuidance` + `recordGuidance` (`field-guidance.ts:40-44`) and looked up via `getFieldGuidance` (`field-guidance.ts:66-71`). Both `FieldGuidance` and `getFieldGuidance` are re-exported from `@loom/core` and consumed by `packages/web/src/field-help/FieldHelp.tsx:2-6`.
2. Generation-brief guidance entries are produced by the `brief()` helper (`field-guidance-brief-config.ts:325-340`); the five user-flagged fields are at lines 186-247. The authoritative requiredness contract is the placeholder table in `docs/compiler-contract.md:98-116` (per-field "Readiness required" / "Context-gated required" / continuation rows) plus the always-render rules at `docs/compiler-contract.md:261-262`, corroborated by `docs/user-guide.md:36-38` (directive required; handoff usually only required for continuation; stop guidance optional).
3. Shared boundary under audit: the `FieldGuidance` contract consumed by the web `FieldHelp`/brief editors and by the `@loom/core` guidance-coverage tests (`packages/core/test/guidance-coverage-sources.test.ts`, `packages/core/test/field-guidance-brief-config.test.ts`). The new field must be additive and must not change existing lookups.
4. FOUNDATIONS principle restated: deterministic validation **fails closed** and the readiness gate is the authority (FOUNDATIONS §validation; `docs/ACTIVE-DOCS.md` non-negotiable invariant "Validation must fail closed"). This ticket's `requiredness` is descriptive and must never be wired into a gate, save block, or compile block.
5. Enforcement-surface confirmation: this ticket touches neither the compiler nor the blocker rules. It must not alter `packages/core/src/validation/**` or `packages/core/src/compiler/**`. The secret firewall (§15) and deterministic compilation (§8) are untouched — verified by leaving those trees unedited.
6. Schema extension: `FieldGuidance` is an internal UI-guidance interface (not a stored story-record/brief/prompt schema). Adding optional `requiredness?` + `requirednessNote?` is additive-only. Consumers: `FieldHelp.tsx` (BRIEFGUIDE-003), `GenerationBriefView.tsx` (BRIEFGUIDE-004), and the core coverage tests. No persisted data changes.

## Architecture Check

1. Co-locating requiredness on `FieldGuidance` (rather than a parallel map) reuses the one registry the editors already query via `getFieldGuidance`, so there is exactly one lookup and one source of truth. A separate module would force a second lookup and invite drift from the guidance the popup already shows.
2. No backwards-compatibility shims: `requiredness` is a new optional field with a single population pass. No alias paths, no duplicate authority. The tier is asserted equal to the `compiler-contract.md` classification by a test, so the doc remains the authority and the code mirrors it.

## What to Change

### 1. Extend the `FieldGuidance` type

In `packages/core/src/records/field-guidance.ts`, add:

```ts
export type FieldRequiredness = "always" | "continuation" | "conditional" | "optional";
```

and to `FieldGuidance`: `requiredness?: FieldRequiredness;` and `requirednessNote?: string;` (a short, author-language "when this is required" line). Re-export `FieldRequiredness` from `@loom/core`.

### 2. Populate requiredness on the generation-brief entries

Add a `requiredness` (and where useful `requirednessNote`) to the `brief()` calls in `field-guidance-brief-config.ts`, derived strictly from `docs/compiler-contract.md:98-116` + `:261-262` + `docs/user-guide.md:36-38`:

- **`always`** — `current_authoritative_state.current_time`, `.current_location`, `.onstage_entities[]`, `.immediate_situation_summary`; `manual_moment_directive.must_render[]`.
- **`continuation`** — `immediate_handoff.recent_causal_context`; `immediate_handoff.last_visible_moment` and `immediate_handoff.begin_after` (note in `requirednessNote`: "for continuations, this *or* `begin_after` is required").
- **`conditional`** — the eleven context-gated current-state lines (`offstage_pressuring_entities[]`, `positions`, `possessions`, `visible_conditions[]`, `environmental_conditions`, `entity_statuses`, `line_of_sight_and_visibility`, `routes_and_exits[]`, `available_time`, `consent_or_force_conditions`, `current_locks[]`).
- **`optional`** — `immediate_handoff.prior_accepted_prose_status_or_handoff_note` (note: "always renders; leave as `None` unless you have a user-authored handoff bridge"), `stop_guidance.soft_unit_guidance`, `manual_moment_directive.may_render_if_naturally_caused[]` / `.do_not_force[]`, `active_working_set.*`, all `current_cast_voice_pressure[].*`, all `cast_voice_overrides[].*`.
- Validation-focus entries (`promptFacing: "never"`) keep `requiredness: "optional"` (they are completeness tags, not author-fill requirements).

Story-config and record-surface guidance entries are **out of scope** (no requiredness populated) — the user's request is the generation-brief page.

## Files to Touch

- `packages/core/src/records/field-guidance.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/test/field-guidance-brief-config.test.ts` (modify)
- `packages/core/test/guidance-coverage-sources.test.ts` (modify, only if it enumerates required keys)

## Out of Scope

- Any UI rendering of requiredness (BRIEFGUIDE-003 popup, BRIEFGUIDE-004 inline markers).
- Guidance prose enrichment of the five flagged fields (BRIEFGUIDE-002).
- Wiring `requiredness` into any blocker, save gate, or compile gate. It is descriptive only.
- Requiredness for story-config or record-editor surfaces.

## Acceptance Criteria

### Tests That Must Pass

1. A new core test asserts the requiredness tier of every populated generation-brief field equals the classification in `docs/compiler-contract.md:98-116` / `:261-262` (the four always-required current-state fields + `must_render` = `always`; the three handoff bridge fields = `continuation`; the eleven context-gated lines = `conditional`; `prior_accepted_prose_status_or_handoff_note`, stop guidance, optional directive lists, voice fields = `optional`).
2. `npm test` — existing guidance-coverage and brief-config tests stay green (additive field, no lookup change).
3. `npm run typecheck && npm run lint && npm test` (full pipeline; build of `@loom/core` precedes Vitest).

### Invariants

1. `requiredness` is read-only metadata: grep-proof that no file under `packages/core/src/validation/` or `packages/core/src/compiler/` references `requiredness` (it never participates in a gate).
2. The `FieldGuidance` change is additive — every existing `getFieldGuidance(path)` call site compiles unchanged.

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-brief-config.test.ts` — assert per-field requiredness tiers against the compiler-contract classification.
2. `packages/core/test/guidance-coverage-sources.test.ts` — extend only if it enumerates the brief surface's keys.

### Commands

1. `npm test -w @loom/core`
2. `npm run typecheck && npm run lint && npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Added additive `FieldRequiredness`, `FieldGuidance.requiredness`, and `FieldGuidance.requirednessNote` metadata in `@loom/core`.
- Populated requiredness only for generation-brief guidance entries, matching the compiler-contract tiers: always-required current-state/directive fields, continuation handoff fields, context-gated current-state fields, and optional active-working-set/voice/directive/stop/validation-focus fields.
- Added core tests that assert the requiredness table, continuation either/or notes, the `prior_accepted...` `None` guidance note, and that story-config guidance remains unpopulated.

Deviations from original plan:

- None. The metadata remains descriptive only; compiler and validation code do not reference `requiredness`.

Verification:

- `npm test -w @loom/core` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
- `rg -n "requiredness" packages/core/src/validation packages/core/src/compiler` returned no matches.
