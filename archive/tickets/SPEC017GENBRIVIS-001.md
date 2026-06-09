# SPEC017GENBRIVIS-001: Add `displayLabel` to core field guidance

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds optional `displayLabel?: string` to the `FieldGuidance` interface (`@loom/core` guidance metadata) and populates it for all generation-brief entries; no prompt/compiler/validation behavior change
**Deps**: None

## Problem

Generation-brief field labels in the UI are raw snake_case schema leaf names (`pov_cannot_perceive_now`, `prior_accepted_prose_status_or_handoff_note`), forcing the author to translate machine names on every visit (SPEC-017 Problem Statement §3). The field-semantics authority for the brief already lives in `@loom/core` field guidance; human-readable labels belong there as a single source, not in a parallel web-side label map (SPEC-017 Brainstorm decision: "no duplicate authority paths"). This ticket adds the data substrate (`displayLabel`) the web field-row rework (SPEC017GENBRIVIS-002) consumes.

## Assumption Reassessment (2026-06-10)

1. `FieldGuidance` (`packages/core/src/records/field-guidance.ts:21–41`) carries `short`, `requiredness`, `promptDestinations`, etc. but **no** display-label field — confirmed (`grep displayLabel field-guidance.ts` → absent). Generation-brief entries are authored via the `brief()` / `validationFocus()` factories in `packages/core/src/records/field-guidance-brief-config.ts` (46 `brief(`-surface entries). `getFieldGuidance` (`field-guidance.ts:69`) and `generationBriefFieldPaths` (exported `packages/core/src/index.ts:140`) enumerate them. No generation-brief-surface entries live outside `field-guidance-brief-config.ts` (`grep generation_brief` in `field-guidance-cast-material.ts` / `field-guidance-records.ts` → none), so populating this file covers the whole surface.
2. SPEC-017 D1 requires every `generation_brief`-surface entry to carry a non-empty `displayLabel`; the spec's scope note flags that there are **46** core brief entries vs ~30 rendered fields — populate all 46 (the test enforces it), not only the rendered subset. The `prior_accepted_prose_status_or_handoff_note` label must keep the user-authored-handoff framing required by FOUNDATIONS §10 / §28.1 and must not imply accepted prose is a prompt source. `docs/story-record-schema.md` is unaffected — `displayLabel` is guidance metadata, not a stored record/brief field.
3. Shared contract under audit: `FieldGuidance` is consumed by `packages/web/src/field-help/FieldHelp.tsx`, `EnumGuidance.tsx`, `GenerationBriefView.tsx` (`getFieldGuidance`), and the three guidance-config files. Adding an **optional** field is additive — no consumer destructures `FieldGuidance` exhaustively or breaks on an extra key (verified: consumers read named properties only).
4. FOUNDATIONS §10 / §28.1 (no accepted prose as prompt source; naming rule): the human label for `prior_accepted_prose_status_or_handoff_note` is restated as "Prior accepted-prose status / handoff note" — it names a *status/handoff note*, never "most recent accepted prose" or an accepted-prose summary, preserving the §10 naming prohibition before trusting the spec narrative.
5. §8 deterministic compilation (no-compile surface): `displayLabel` is UI-only metadata. The compiler reads `promptDestinations` / `promptFacing` (via `PLACEHOLDER_MAP` and `compile-destinations`), never `displayLabel`; this ticket adds no path by which `displayLabel` enters prompt compilation, so determinism and the "no prose-derived / non-authored content in prompts" guarantee are untouched. The downstream enforcement surface (the deterministic compiler in `@loom/core`) needs no change.

## Architecture Check

1. Placing `displayLabel` on the existing `FieldGuidance` registry keeps field semantics in one authority (the guidance registry that already owns `short`, `requiredness`, `promptDestinations`). A parallel web-side label map would duplicate field-name authority and drift from the guidance the popover already renders — the spec rejected it explicitly.
2. No backwards-compatibility aliasing/shims: the field is a new optional property; existing entries and consumers are unchanged until they opt in.

## Verification Layers

1. Every `generation_brief`-surface entry has a non-empty `displayLabel` → schema-coverage test in `field-guidance-coverage.test.ts` (iterate `generationBriefFieldPaths`, assert `getFieldGuidance(path)?.displayLabel` is a non-empty string).
2. `displayLabel` is never compiled → codebase grep-proof: `grep -rn displayLabel packages/core/src/compiler` returns nothing; FOUNDATIONS §8 alignment check.
3. `prior_accepted_prose_status_or_handoff_note` label preserves handoff framing → manual review + FOUNDATIONS §10 alignment check asserting the literal label string contains "handoff" and not "accepted prose summary"/"most recent accepted prose".

## What to Change

### 1. Add the optional field

Add `displayLabel?: string;` to the `FieldGuidance` interface in `packages/core/src/records/field-guidance.ts` (alongside `short` / `requiredness`).

### 2. Populate every generation-brief entry

In `packages/core/src/records/field-guidance-brief-config.ts`, give every `brief()` / `validationFocus()` entry (all 46 generation-brief-surface entries) a sentence-case `displayLabel` that keeps constitutional vocabulary intact. Examples from the spec: `must_render` → "Must render"; `pov_cannot_perceive_now` → "POV cannot perceive right now"; `prior_accepted_prose_status_or_handoff_note` → "Prior accepted-prose status / handoff note". Story-config (`config()`) entries are out of scope.

### 3. Coverage test

Extend `packages/core/test/field-guidance-coverage.test.ts` with an `it(...)` asserting each path in `generationBriefFieldPaths` resolves to guidance whose `displayLabel` is a non-empty trimmed string. Re-enumerate paths from `generationBriefFieldPaths` at test time (do not hardcode a count).

## Files to Touch

- `packages/core/src/records/field-guidance.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/test/field-guidance-coverage.test.ts` (modify)

## Out of Scope

- Display labels for non-brief surfaces (records, story config) — the field can carry them later; populating them is not this spec (SPEC-017 Out of Scope).
- Web consumption of `displayLabel` (the field-row rework) — SPEC017GENBRIVIS-002.
- Any prompt template, compiler, validation, or stored-schema change.

## Acceptance Criteria

### Tests That Must Pass

1. New coverage test: every `generationBriefFieldPaths` entry has a non-empty `displayLabel` (fails before population, passes after).
2. `grep -rn "displayLabel" packages/core/src/compiler` returns no matches (label never enters compilation).
3. `npm test --workspace @loom/core` passes (existing guidance/coverage/doctrine tests still green).

### Invariants

1. `displayLabel` is optional on `FieldGuidance`; no consumer requires it, and absence is legal for non-brief surfaces.
2. The `prior_accepted_prose_status_or_handoff_note` label names a status/handoff note and never implies accepted prose is a prompt source (§10 / §28.1).

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-coverage.test.ts` — adds the `displayLabel` completeness assertion over `generationBriefFieldPaths`.

### Commands

1. `npm test --workspace @loom/core -- field-guidance-coverage`
2. `npm run lint && npm run typecheck && npm test`
3. `grep -rn "displayLabel" packages/core/src/compiler` — must print nothing (narrow proof that the label is non-compiled; the compiler subtree is the correct boundary since it is the only path into prompt output).

## Outcome

Completed 2026-06-10.

Added optional `displayLabel` metadata to `FieldGuidance`, centralized explicit display labels for every generation-brief guidance entry in `field-guidance-brief-config.ts`, and added a coverage test asserting every `generationBriefFieldPaths()` entry resolves to a non-empty label.

Deviation from original plan: the ticket's broad `grep -rn "displayLabel" packages/core/src/compiler` proof was stale because the compiler already had unrelated record-display-label helpers before this ticket. The relevant compiler-boundary proof used `rg -n "field-guidance|getFieldGuidance|FieldGuidance" packages/core/src/compiler`, which returned no matches, proving the new guidance metadata is not read by compilation.

Verification:

- `npm test --workspace @loom/core -- field-guidance-coverage` passed.
- `npm test --workspace @loom/core` passed.
- `rg -n "field-guidance|getFieldGuidance|FieldGuidance" packages/core/src/compiler` returned no matches.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
