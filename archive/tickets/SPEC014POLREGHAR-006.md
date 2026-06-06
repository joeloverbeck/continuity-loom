# SPEC014POLREGHAR-006: Accepted-prose exclusion regression suite

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds `packages/core/test/accepted-prose-exclusion.test.ts` and extends `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`; no production code changes.
**Deps**: None

## Problem

The constitutional boundary "accepted prose is never prompt context" (FOUNDATIONS §10, §29.8, §29.4) is enforced today but tested in scattered happy-path spots (`validation-blockers`, stress-coverage, demo-fixture). SPEC-014 D6 consolidates the proof into one named regression suite pinning: (a) the compiler consumes only a `ValidationSnapshot` and never the accepted-segment archive; (b) verbatim accepted/rejected/superseded text in a prompt-facing handoff field trips `promptFacingProseContamination` and blocks preview/send; (c) a clean user-authored handoff note is allowed; (d) the accepted-segment browser exposes no "include in prompt" affordance; (e) no automatic prose-derived summary field exists in the generation-time brief schema.

## Assumption Reassessment (2026-06-06)

1. The compiler entry is `compilePrompt(snapshot: ValidationSnapshot)` (`packages/core/src/compiler/compile-prompt.ts:11`); nothing under `packages/core/src/compiler/` imports the accepted-segment archive, which lives in `@loom/server` (`packages/server/src/{accepted-routes,record-repository,record-tables}.ts`). The `@loom/core` purity boundary (`packages/core/test/boundary.test.ts` + `npm run lint`) structurally forbids core importing the server archive, so (a) is reinforced by an output assertion (compiled prompt excludes accepted text) on top of that structural guarantee.
2. `promptFacingProseContamination` (`"prompt-facing-prose-contamination"`, `packages/core/src/validation/types.ts:80`) is emitted by `validatePromptFacingContamination` and `validateGenerationContextRows` in `packages/core/src/validation/rules/universal-blockers.ts:388,415,427`; its message covers "accepted, rejected, superseded, or automatic prose-derived text." The generation-time-brief handoff fields are `recent_causal_context`, `last_visible_moment`, `prior_accepted_prose_status_or_handoff_note`, and `begin_after` (read at `universal-blockers.ts` `validateGenerationContextRows`). The **only** legitimate prior-prose field is the user-authored `prior_accepted_prose_status_or_handoff_note` (FOUNDATIONS §10); `docs/story-record-schema.md` is the schema authority for the brief.
3. Cross-artifact boundary under audit: items (a)(b)(c)(e) are `@loom/core` (compiler + validation + brief schema); item (d) is `@loom/web` (`packages/web/src/accepted-segments/AcceptedSegmentsView.tsx`, with test `AcceptedSegmentsView.test.tsx`). Core cannot render the web view, so the "consolidated suite" is the core file plus one web negative test — the split is by package boundary, not by deliverable.
4. FOUNDATIONS principle under audit: §10 / §28.1 "no accepted prose in generated prompts" (hard rule) and §29.8 archive hard-fails ("does it use accepted segments as prompt context"), plus §29.4 ("does it include accepted prose in generated prompts"). The regression armors exactly these.
5. Accepted-prose firewall + deterministic-compilation surface: the suite only **observes** compiler output, validation diagnostics, the brief schema shape, and the rendered view — it adds no code to the firewall and cannot weaken it. It confirms the compiler's sole input remains `ValidationSnapshot` (deterministic, §8) and that contamination stays fail-closed (§11).
6. No mismatch: the contamination code's emit sites (`:388,415,427`, corrected from the spec's earlier `:385,412,424`) and the four handoff field names were read from `universal-blockers.ts` on 2026-06-06; `acceptedProseContamination` is a registered-but-unfired orphan and is **not** the code asserted here.

## Architecture Check

1. One named suite is more legible and harder to let rot than scattered assertions; co-locating (a)(b)(c)(e) in a single core file gives reviewers a single place to confirm the constitutional boundary. Asserting (e) structurally (the brief schema has no auto-summary field) catches a future field addition that would invite prose mining — a gap the contamination-marker tests alone would miss.
2. No backwards-compatibility shims: the suite reads existing compiler/validation/schema/view surfaces directly; it introduces no parallel "exclusion checker."

## Verification Layers

1. Compiler excludes archive (a) → given an accepted segment with distinctive text, `compilePrompt(snapshot)` for the same story produces a prompt not containing that text; core cannot import the server archive (boundary test) → test assertion + grep-proof.
2. Contamination blocks (b) → a snapshot with verbatim accepted/rejected/superseded text in a prompt-facing handoff field yields a `promptFacingProseContamination` blocker and `isBlocked === true` → test assertion (distinct surface: validation).
3. Clean handoff allowed (c) → a user-authored, contamination-free `prior_accepted_prose_status_or_handoff_note` yields no contamination blocker → test assertion.
4. No auto-summary field (e) → the generation-time-brief handoff schema exposes only `prior_accepted_prose_status_or_handoff_note` for prior prose and no `*summary*`/auto-derived field → schema assertion against the brief type + `docs/story-record-schema.md`.
5. No "include in prompt" affordance (d) → `AcceptedSegmentsView` renders no control/handler matching /include in prompt/i → web test assertion (distinct surface: UI).

## What to Change

### 1. Core regression file (a, b, c, e)

Create `packages/core/test/accepted-prose-exclusion.test.ts`:

- **(a)** Build a `ValidationSnapshot` for a story that also has an accepted segment with a distinctive canary phrase; assert `compilePrompt(snapshot).prompt` does not contain the canary. Add a grep-style assertion (or reference `boundary.test.ts`) confirming `packages/core/src/compiler/` imports nothing from the accepted archive.
- **(b)** For each prompt-facing handoff field, set verbatim accepted/rejected/superseded text (containing the contamination markers the rules detect) and assert `runValidation` returns a blocker with `code === DIAGNOSTIC_CODES.promptFacingProseContamination` and `isBlocked === true`.
- **(c)** Set a clean user-authored `prior_accepted_prose_status_or_handoff_note` and assert no `promptFacingProseContamination` blocker is emitted.
- **(e)** Assert the brief's `immediate_handoff` shape contains only `recent_causal_context`, `last_visible_moment`, `prior_accepted_prose_status_or_handoff_note`, `begin_after` (its current fields) and no automatic prose-derived summary field; cross-check against `docs/story-record-schema.md`.

### 2. Web negative test (d)

Extend `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`: render the view with sample accepted segments and assert there is **no** element, button, or handler whose label/text matches /include in prompt/i (the accepted-segment browser is a reading affordance only).

## Files to Touch

- `packages/core/test/accepted-prose-exclusion.test.ts` (new)
- `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` (modify)

## Out of Scope

- Any change to the compiler, validation rules, the brief schema, or `AcceptedSegmentsView` (regression-only; a failure here is a code bug to fix in its own ticket, never a test relaxation).
- Removing the orphaned `acceptedProseContamination` code (separate cleanup).
- Broader stress-suite additions (SPEC-014 adds no new rule).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/accepted-prose-exclusion.test.ts` — (a)(b)(c)(e) pass.
2. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — the (d) negative affordance test passes.
3. `npm test` — full suite green.

### Invariants

1. The compiler's sole input is `ValidationSnapshot`; accepted-segment text never appears in a compiled prompt.
2. Prompt-facing handoff contamination is always a `promptFacingProseContamination` blocker (fail-closed); a clean handoff is allowed; no auto-summary field exists; the accepted-segment browser offers no "include in prompt" action.

## Test Plan

### New/Modified Tests

1. `packages/core/test/accepted-prose-exclusion.test.ts` — consolidated compiler/validation/schema regression (a,b,c,e).
2. `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — no-"include in prompt"-affordance negative test (d).

### Commands

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/accepted-prose-exclusion.test.ts`
2. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`
3. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-06

What changed:
- Added `packages/core/test/accepted-prose-exclusion.test.ts`.
- The core suite asserts accepted-segment canary text is absent from compiled prompts, compiler source imports no accepted/archive server modules, all prompt-facing handoff fields fail closed on contamination, clean continuation handoff text is allowed, and the immediate handoff schema remains strict with no automatic prose summary field.
- Extended `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` with the explicit `include in prompt` negative affordance assertion.

Deviations from original plan:
- The compiler grep proof targets import specifiers rather than all source text because compiler prompt constants legitimately contain accepted-prose exclusion wording.
- The clean handoff assertion uses `continuation_after_accepted_segment`; first-segment handoffs intentionally require the special no-accepted-prose status note.

Verification results:
- `npm run build --workspace @loom/core` passed.
- `npm exec vitest run packages/core/test/accepted-prose-exclusion.test.ts` passed: 1 file, 7 tests.
- `npm exec vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` passed: 1 file, 7 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 72 files, 429 tests.
