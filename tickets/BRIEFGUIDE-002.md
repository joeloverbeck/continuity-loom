# BRIEFGUIDE-002: Make the state/handoff field guidance unmistakable

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — rewrites the guidance prose (semantic help) for five generation-brief fields in `packages/core/src/records/field-guidance-brief-config.ts`, including new `relatedFields` cross-links. No schema, prompt-compilation, or validation behavior changes.
**Deps**: none (composes with BRIEFGUIDE-003, which renders this prose)

## Problem

A user authoring a real scene could not tell five generation-brief fields apart, and the current "i" popups do not draw the distinctions the docs treat as load-bearing:

- `immediate_situation_summary` (CURRENT AUTHORITATIVE STATE) vs `recent_causal_context` (IMMEDIATE HANDOFF) "invite exactly the same content." The docs separate them deliberately: current state answers *"what is true now"*; handoff answers *"how we got here / where prose begins"*, and `recent_causal_context` is explicitly *"writer-visible; not automatically POV knowledge"* (`docs/prompt-template.md:108`). `docs/prompt-template-rationale.md:44` calls keeping them separate *"the biggest safeguard after POV/reveal locks,"* because mixing them turns non-POV context into POV knowledge. None of that is in the popups.
- `last_visible_moment` reads as "part of the other fields." Its guidance entry (`field-guidance-brief-config.ts:231-233`) is the thinnest in the file — only a one-line `short`, no `continuityRole`, `authoringAdvice`, or examples.
- `begin_after` looks identical to `last_visible_moment`. The distinction (descriptive image vs imperative cut-point) is real but unstated; `docs/compiler-contract.md:114,116` even treats them as an either/or for continuation readiness.
- `prior_accepted_prose_status_or_handoff_note` pushes the author toward writing "Previous segment accepted" — low-value status the prose writer does not need. Per FOUNDATIONS §10 (`docs/FOUNDATIONS.md:337`) the field is `None`-or-a-user-authored-bridge, **not** acceptance bookkeeping.

## Assumption Reassessment (2026-06-09)

1. The five entries live at `packages/core/src/records/field-guidance-brief-config.ts`: `immediate_situation_summary` (186-196), `recent_causal_context` (224-230), `last_visible_moment` (231-233), `prior_accepted_prose_status_or_handoff_note` (234-242), `begin_after` (243-247). The `FieldGuidance` shape supports `continuityRole`, `authoringAdvice`, `examples`, `antiExamples`, `doctrineWarnings`, `criticalVisibleHint`, and `relatedFields` (`field-guidance.ts:20-38`); all are rendered by `FieldHelp.tsx:64-72`, and `relatedFields` renders as a "Related" section (`FieldHelp.tsx:72`) but is currently unset for all five.
2. Authorities for the corrected prose: `docs/prompt-template-rationale.md:38-56` (§5 state-vs-handoff separation, §6 why `prior_accepted…` stays narrow), `docs/prompt-template.md:107-122`, `docs/story-record-schema.md:184-209`, `docs/FOUNDATIONS.md:333-339` (§10 the correct field is `prior_accepted_prose_status_or_handoff_note`, `None`-or-bridge, never prose-mined).
3. Shared boundary: the `FieldGuidance` registry consumed by `FieldHelp` and asserted by `packages/core/test/field-guidance-brief-config.test.ts` / `guidance-coverage-sources.test.ts`. Prose edits must keep `promptDestinations`/`promptFacing` and `fieldPath` unchanged so coverage tests stay valid.
4. FOUNDATIONS principle restated: no accepted prose, rejected candidate, superseded candidate, or automatic prose-derived summary becomes prompt context (`docs/ACTIVE-DOCS.md` non-negotiable invariant; FOUNDATIONS §10). The new prose must reinforce this, never soften it — `prior_accepted…` guidance must keep its `doctrineWarnings` against prose-mining.
5. Adjacent observation: requiredness wording belongs to BRIEFGUIDE-001 (`requirednessNote`), not here; this ticket only sharpens semantic distinctions. Kept separate to keep each diff reviewable.

## Architecture Check

1. Enriching existing guidance entries (vs adding a new help surface) reuses the rendering `FieldHelp` already does — the popup sections exist and are empty for these fields, so the fix is pure content plus `relatedFields` cross-links that the component already supports.
2. No shims: edits replace the option objects on existing `brief()` calls; no new code paths, no duplicate guidance authority.

## What to Change

### 1. `immediate_situation_summary`

Keep `currentStateOpts`. Sharpen `authoringAdvice` to: state-now snapshot — *what is true at the start*, prose-neutral, no causal narration. Add `antiExamples` showing causal/"how we got here" content that belongs in `recent_causal_context`. Add `relatedFields: ["GENERATION BRIEF.immediate_handoff.recent_causal_context"]`.

### 2. `recent_causal_context`

Add `continuityRole` stating it is the recent cause that launches the segment and is **writer-visible, not automatically POV knowledge** (so it may hold something the POV does not yet know). Keep the existing example/anti-example; add a `doctrineWarnings` line that it must not paste accepted prose. Add `relatedFields` to `immediate_situation_summary`, `last_visible_moment`, and `begin_after`.

### 3. `last_visible_moment`

Fill the empty entry: `continuityRole` = the concrete final image/action the prose renders *from* (the sensory anchor), distinct from the abstract situation summary; `authoringAdvice`; `examples`/`antiExamples`; `relatedFields: ["…begin_after"]` with a note that for a continuation this *or* `begin_after` is required.

### 4. `begin_after`

Add `continuityRole` making explicit it is an **imperative cut-point** ("begin prose exactly after this point") that stops the writer skipping the next decision or re-narrating — contrasted with `last_visible_moment` (a description). Keep existing examples; add `relatedFields: ["…last_visible_moment"]`.

### 5. `prior_accepted_prose_status_or_handoff_note`

Rewrite `authoringAdvice`/`examples` so the recommended content is **`None`** (first segment / no bridge needed) **or a user-authored continuity bridge** — not acceptance status. Replace the "Previous segment accepted" example with a real bridge example; add an anti-example of acceptance bookkeeping ("Previous segment accepted."). Keep the existing `doctrineWarnings` and `criticalVisibleHint` (the prose firewall).

## Files to Touch

- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/test/field-guidance-brief-config.test.ts` (modify)

## Out of Scope

- Requiredness metadata/notes (BRIEFGUIDE-001).
- Any rendering change in `FieldHelp.tsx` or the brief page.
- Changing prompt template, schema, or compiler behavior, or any `fieldPath`/`promptDestinations`.

## Acceptance Criteria

### Tests That Must Pass

1. A core test asserts each of the five entries now carries the new guidance fields: `recent_causal_context` includes the "not automatically POV knowledge" wording; `last_visible_moment` has a non-empty `continuityRole`; `begin_after` and `last_visible_moment` cross-link each other via `relatedFields`; `prior_accepted_prose_status_or_handoff_note` retains its prose-mining `doctrineWarnings` and no longer recommends "Previous segment accepted".
2. `npm test` — `field-guidance-brief-config.test.ts` and `guidance-coverage-sources.test.ts` stay green (no `fieldPath`/destination changes).
3. `npm run typecheck && npm run lint && npm test`.

### Invariants

1. No `fieldPath`, `promptDestinations`, or `promptFacing` value changes — grep-proof the placeholder destinations for the five fields are unchanged.
2. `prior_accepted_prose_status_or_handoff_note` keeps a `doctrineWarnings` entry forbidding prose-as-canon (FOUNDATIONS §10 firewall not weakened).

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-brief-config.test.ts` — assert presence/content of the new guidance fields and the `relatedFields` cross-links for the five entries.

### Commands

1. `npm test -w @loom/core`
2. `npm run typecheck && npm run lint && npm test`
