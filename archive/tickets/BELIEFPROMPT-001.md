# BELIEFPROMPT-001: Render all prompt-facing BELIEF fields in both belief prompt sections

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/records-tail.ts` (belief resolvers); `docs/compiler-contract.md` and `docs/story-record-schema.md` (prompt-treatment notes); `packages/core/test/compiler-tail-sections.test.ts`.
**Deps**: None.

## Problem

A BELIEF record carries seven prompt-relevant authored fields (`claim`, `belief_mode`, `truth_relation`, `confidence`, `access_route`, `behavioral_effect`, plus `visibility`). The deterministic compiler renders only a hand-picked subset per section, silently dropping the rest:

- `{pov_relevant_beliefs}` (held by the POV/protagonist) renders only `claim` + `truth_relation`. **`behavioral_effect` never appears for a protagonist belief**, and `belief_mode`, `confidence`, `access_route` never appear either.
- `{non_pov_behavior_shaping_beliefs}` renders only `claim` + `behavioral_effect`. `truth_relation`, `belief_mode`, `confidence`, `access_route` never appear.

This was confirmed by compiling a fully-populated belief: the POV section emitted `- <claim>; truth: unknown` with no `behavioral_effect`, `belief_mode`, `confidence`, or `access_route`. Authored continuity the user entered is invisible to the prose writer. (`visibility` is handled in the follow-up BELIEFPROMPT-002 because surfacing it cleanly requires a per-type prompt-facing-classification change; it is explicitly out of scope here.)

Note on the reported "claim is getting trimmed": investigation found the claim is **not** trimmed in the prompt — `asString` only trims surrounding whitespace and the full claim renders in both sections. The 80-character truncation the user saw is `truncateLabel` inside `deriveDisplayLabel` (`packages/core/src/records/editor-descriptors.ts:369-372`), applied to the record's *display label* and shown in the working-set table (`packages/web/src/working-set/WorkingSetView.tsx:229`) and record lists, never in the belief prompt sections. No prompt change is needed for the claim; it is already rendered in full. This ticket adds an explicit regression assertion that a long claim survives intact.

## Assumption Reassessment (2026-06-08)

1. **Belief schema fields** — `packages/core/src/records/knowledge.ts:24-50` defines `beliefSchema` with `id, status, holder, claim, belief_mode, truth_relation, confidence, visibility, access_route, behavioral_effect, salience`. `claim` and `behavioral_effect` are `nonemptyString` (always present); `belief_mode`, `truth_relation`, `confidence`, `access_route`, `visibility` are required enums (always present); `holder` is the grouping reference, `salience` drives ordering, `status` filters, `id` is system. Confirmed.
2. **Current rendering** — `packages/core/src/compiler/sections/records-tail.ts:25-38`: the `pov_relevant_beliefs` resolver projects `compactParts([asString(payload.claim), labelValue("truth", payload.truth_relation)])`; the `non_pov_behavior_shaping_beliefs` resolver projects `compactParts([asString(payload.claim), labelValue("behavior", payload.behavioral_effect)])`. Both filter by `payload.holder === selectedPov(snapshot)` / `!==`. Confirmed.
3. **Doc authority under audit** — `docs/compiler-contract.md:152-153` (BELIEF rows: Notes "Mark truth relation." / "Render through behavior.") and `docs/story-record-schema.md:601-605` (§6.2 BELIEF "Prompt treatment": "Group by holder; Separate POV beliefs from non-POV behavior-shaping beliefs; Mark truth relation clearly."). These are the prompt-contract docs of record for belief rendering and must be updated in lockstep so they describe full-field rendering. `docs/prompt-template.md:281,284` only defines the placeholder names (`{pov_relevant_beliefs}`, `{non_pov_behavior_shaping_beliefs}`) — unchanged by this ticket. `docs/prompt-template-rationale.md` has no belief-specific rendering note (line 136 concerns causal-pressure) — confirmed no change needed there.
4. **FOUNDATIONS principle under audit** — §8 deterministic compilation and §9 universal prompt contract: rendering more user-authored fields keeps compilation deterministic (no hidden state, controlled enum/prose values from the validation snapshot). §13–§14 record philosophy: records (not accepted prose) are the continuity authority; surfacing authored belief fields strengthens this. §15 POV/knowledge: the non-POV "render through behavior" emphasis is preserved by leading that section with `behavior`; the added fields are *labeled writer-visible metadata*, consistent with how FACT/EVENT metadata already renders, not instructions to write non-POV interiority as prose.
5. **Deterministic-compilation surface** — this change is confined to the field projection inside two existing resolvers; it does not alter record selection, ordering (`orderCompilerRecords`), filtering, empty-state behavior, or the placeholder map, and cannot query state outside the snapshot. No weakening of the secret firewall (§15) or determinism (§8).
6. **Schema consumers** — no schema is changed (additive rendering only). The consumer is the prompt text; the change is additive (more labeled segments appended to the same `- ` lines via the existing `compactParts`/`labelValue` helpers). `labelValue` already omits empty/`"none"` values, so no empty labels appear.
7. **Adjacent contradiction classified** — `visibility` is authored on beliefs and behaviorally relevant, but is classified operational/non-prompt-facing by field name in `editor-descriptors.ts:69` and `field-guidance-records.ts:22` (shared with RELATIONSHIP/EMOTION/causal-pressure). Surfacing it requires a per-type classification change to keep field guidance honest. This is **future cleanup that is its own ticket: BELIEFPROMPT-002**, not a consequence of this ticket.

## Architecture Check

1. Reuses the existing `compactParts` + `labelValue` rendering helpers already used for every other tail record type (FACT, EVENT, LOCATION, OBJECT, AFFORDANCE), so belief rendering becomes consistent with the rest of the section rather than a special-cased subset. No new rendering machinery.
2. No backwards-compatibility aliasing/shims. The two resolver lambdas are edited in place; no parallel rendering path is introduced.

## Verification Layers

1. POV beliefs render `claim` + `belief_mode` + `truth_relation` + `confidence` + `access_route` + `behavioral_effect` → schema validation (prompt-section conformance against `docs/compiler-contract.md`) + unit test on `{pov_relevant_beliefs}` body.
2. Non-POV beliefs render `claim` + `behavioral_effect` + `belief_mode` + `truth_relation` + `confidence` + `access_route` → unit test on `{non_pov_behavior_shaping_beliefs}` body.
3. A long (>80-char) claim renders in full (no truncation) in the belief sections → unit test asserting the full claim string is present.
4. Deterministic compilation unchanged for selection/ordering/empty-state → existing `compiler-tail-sections.test.ts` empty-state and ordering assertions still pass (FOUNDATIONS §8 alignment check).

## What to Change

### 1. `packages/core/src/compiler/sections/records-tail.ts` — belief field projections

Expand both belief resolver projections to render the full prompt-facing field set, preserving each section's contract emphasis (POV leads with truth relation; non-POV leads with behavior):

- `pov_relevant_beliefs` projection becomes:
  `compactParts([asString(payload.claim), labelValue("truth", payload.truth_relation), labelValue("mode", payload.belief_mode), labelValue("confidence", payload.confidence), labelValue("access", payload.access_route), labelValue("behavior", payload.behavioral_effect)])`
- `non_pov_behavior_shaping_beliefs` projection becomes:
  `compactParts([asString(payload.claim), labelValue("behavior", payload.behavioral_effect), labelValue("mode", payload.belief_mode), labelValue("truth", payload.truth_relation), labelValue("confidence", payload.confidence), labelValue("access", payload.access_route)])`

Do not change the predicates, the `renderRecords` call, or the empty-state fallbacks. (`visibility` is added in BELIEFPROMPT-002.)

### 2. `docs/compiler-contract.md` — belief rows (lines 152-153)

Update the Notes column for `{pov_relevant_beliefs}` and `{non_pov_behavior_shaping_beliefs}` so they describe full-field rendering: POV beliefs render the claim plus belief mode, truth relation, confidence, access route, and behavioral effect (truth relation marked first); non-POV beliefs render the claim plus behavioral effect first, then belief mode, truth relation, confidence, access route. Keep the existing "Mark truth relation" / "Render through behavior" emphasis as the lead of each.

### 3. `docs/story-record-schema.md` — §6.2 BELIEF "Prompt treatment" (lines 601-605)

Replace the three-bullet "Prompt treatment" note with one that states: group by holder; separate POV beliefs from non-POV behavior-shaping beliefs; render all prompt-facing belief fields in both groups (claim in full, belief_mode, truth_relation, confidence, access_route, behavioral_effect); lead POV beliefs with the truth relation and non-POV beliefs with the behavioral effect; no field is trimmed. (Note `visibility` is added by BELIEFPROMPT-002.)

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)

## Out of Scope

- `BELIEF.visibility` rendering and the per-type prompt-facing-classification change — BELIEFPROMPT-002.
- The 80-char display-label truncation (`deriveDisplayLabel`/`truncateLabel`) and its UI surfaces — by design for compact labels; does not affect the prompt.
- Any change to belief selection, ordering, status filtering, or the placeholder map.
- Any schema change to `beliefSchema`.

## Acceptance Criteria

### Tests That Must Pass

1. A new/extended test in `packages/core/test/compiler-tail-sections.test.ts` compiles a fully-populated POV belief and asserts the `{pov_relevant_beliefs}` body contains the claim, `mode:`, `truth:`, `confidence:`, `access:`, and `behavior:` segments.
2. A test asserts the `{non_pov_behavior_shaping_beliefs}` body for a fully-populated non-POV belief contains the claim, `behavior:`, `mode:`, `truth:`, `confidence:`, and `access:` segments.
3. A test asserts a >80-character claim renders verbatim (no `...` / no truncation) in both belief sections.
4. `npm run lint`, `npm run typecheck`, and `npm test` all pass.

### Invariants

1. Compilation remains deterministic: identical snapshot input yields identical belief-section output (no hidden state, no nondeterministic ordering) — FOUNDATIONS §8.
2. No accepted prose, rejected/superseded candidate, or prose-derived summary becomes belief-section content; only authored belief-record fields render — FOUNDATIONS §13–§14.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — extend the populated-records fixture beliefs with all prompt-facing fields and add assertions for both belief sections plus the long-claim regression.

### Commands

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/compiler-tail-sections.test.ts`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

The belief prompt resolvers now render all BELIEFPROMPT-001 prompt-facing fields in both belief sections. POV beliefs keep truth relation first and add belief mode, confidence, access route, and behavioral effect. Non-POV beliefs keep behavioral effect first and add belief mode, truth relation, confidence, and access route. The compiler contract, story-record schema prompt-treatment note, compiler tail tests, and frozen golden prompt fixture were updated to match the new deterministic prompt output.

Deviation from plan: the frozen golden prompt fixture also needed an intentional rebaseline because it covers the demo belief prompt output byte-for-byte.

Verification:

- `npm run build --workspace @loom/core` passed.
- `npx vitest run packages/core/test/compiler-tail-sections.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
