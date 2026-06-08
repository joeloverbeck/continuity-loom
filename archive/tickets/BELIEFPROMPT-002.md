# BELIEFPROMPT-002: Make prompt-facing classification per-type and surface BELIEF.visibility in the prompt

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `packages/core/src/records/editor-descriptors.ts` and `packages/core/src/records/field-guidance-records.ts` (per-type prompt-facing classification); `packages/core/src/compiler/sections/records-tail.ts` (belief resolvers); `docs/compiler-contract.md` and `docs/story-record-schema.md` (belief prompt-treatment notes); tests in `packages/core/test/`.
**Deps**: BELIEFPROMPT-001 (edits the same two belief resolver lambdas and the same belief doc rows; this ticket appends `visibility` to them).

## Problem

`BELIEF.visibility` (`private | shared | factional | public | rumored | concealed | suppressed`) is an authored field that materially shapes how a character acts on a belief (a *concealed* belief is held differently from a *public* one) and should reach the prose writer, but it never appears in the prompt. It cannot simply be rendered, because two classifiers mark `visibility` as operational/non-prompt-facing **by field name**, and that name is shared with RELATIONSHIP, EMOTION, and causal-pressure records:

- `packages/core/src/records/editor-descriptors.ts:69` `STATUS_OR_VALIDATION_FIELDS` (drives the editor `FieldDescriptor.promptFacing` boolean).
- `packages/core/src/records/field-guidance-records.ts:22` `operationalFields` (drives the user-facing field guidance, which currently tells the user `visibility` *never* reaches the prompt and gives it a `validationRole` instead of `promptDestinations`).

A name-keyed reclassification would wrongly flip `visibility` to prompt-facing for RELATIONSHIP/EMOTION/causal-pressure too, whose compilers do not render it — producing the inverse inconsistency there. The fix is to make the classification per-(recordType, field) so `BELIEF.visibility` can be marked prompt-facing while the other types are untouched, then render it in the belief sections.

## Assumption Reassessment (2026-06-08)

1. **Classifiers and consumers** — `editor-descriptors.ts:201` sets `promptFacing: !STATUS_OR_VALIDATION_FIELDS.has(name)` inside `describeField`; `field-guidance-records.ts:200` sets `isOperational = operationalFields.has(leafName)` inside `recordEntry`, which then drives `promptFacing` (`"never"` vs `"conditional"`), `promptDestinations`, and `validationRole`. Both flags are consumed **only by UI/guidance surfaces** (editor field display, field-guidance), confirmed below. Confirmed.
2. **The classification flags do NOT gate the compiler or validation** — the compiler renders belief fields explicitly in `records-tail.ts` independent of any classification; the security/prose-contamination scan `promptFacingFields` in `packages/core/src/validation/rules/security.ts:24` walks **every string in every record payload** regardless of classification (and `visibility` is a controlled enum, not free prose, so it is harmless to that scan). Therefore marking `BELIEF.visibility` prompt-facing has **no functional or validation effect** — it only corrects what the field-guidance UI tells the user. Confirmed.
3. **`visibility` is shared across record types** — bare `visibility:` appears in `packages/core/src/records/knowledge.ts:33` (BELIEF), `packages/core/src/records/relationship-emotion.ts:38,97` (RELATIONSHIP, EMOTION), and `packages/core/src/records/causal-pressure.ts:91,110,124`. None of those non-BELIEF compilers render `visibility`, so they must stay classified operational. Confirmed — per-type classification is required, not a global rename.
4. **`recordType` is available at the classification sites** — `editor-descriptors.ts:131` builds descriptors from `recordTypeRegistry` entries that expose `definition.recordType`, so `recordType` can be threaded into `describeObjectFields`/`describeField`; `field-guidance-records.ts` `recordEntry` already receives `recordType`. `describeSchemaFields`/`describeObjectFields` are also called without a record type (generic schema description, nested groups) — the threaded `recordType` must be optional and the per-type override applies only when present. Confirmed.
5. **No active doc pins `visibility` as operational** — grep of `docs/*.md` found no statement classifying `visibility` (or any belief field) as operational/non-prompt-facing; the field-guidance system (originally `archive/specs/SPEC015FIEGUICON-*`) is code-governed. Making the classification per-type *increases* the accuracy of the field guidance, which is its documented purpose, so this aligns with the docs without requiring any doc amendment.
6. **Schema extension check** — no schema field is added or changed; `beliefSchema.visibility` already exists. The change is additive rendering plus a UI-classification correction; consumers of the classification (editor display, field guidance) are updated in this ticket.
7. **FOUNDATIONS principles under audit** — §8 deterministic compilation (rendering a controlled enum from the snapshot stays deterministic); §9 universal prompt contract (belief doc rows updated in lockstep); §13–§14 record philosophy (authored field stops being dropped); §15 POV/knowledge (visibility is labeled writer-visible metadata, not a directive to write interiority). No weakening of the secret firewall or determinism.
8. **Adjacent contradiction classified** — once `BELIEF.visibility` is prompt-facing, the field guidance for it changes from `promptFacing: "never"` + `validationRole` to `promptFacing: "conditional"` + `promptDestinations: [BELIEF family]` via the existing `recordEntry` branch. This is a required consequence of this ticket and must be asserted in tests, not left implicit.

## Architecture Check

1. A per-(recordType, field) override set is the minimal change that lets `BELIEF.visibility` be prompt-facing without lying about RELATIONSHIP/EMOTION/causal-pressure `visibility`. Defining one shared override constant (in `editor-descriptors.ts`, imported by `field-guidance-records.ts`, which already imports `recordEditorDescriptors` from it) keeps the editor flag and the field guidance from drifting — a single source of truth rather than two parallel exception lists.
2. No backwards-compatibility aliasing/shims. The default global operational/status sets remain authoritative; the override is additive and explicit, and the threaded `recordType` is optional so existing generic callers are unaffected.

## Verification Layers

1. `BELIEF.visibility` is prompt-facing; RELATIONSHIP/EMOTION/causal-pressure `visibility` remain non-prompt-facing → unit test on `recordEditorDescriptors` (`FieldDescriptor.promptFacing`) for each affected type.
2. Field guidance for `BELIEF.visibility` is `promptFacing: "conditional"` with a belief `promptDestinations` entry and no `validationRole`; the other types' `visibility` guidance is unchanged (`"never"`) → unit test on `recordGuidance` / the relevant field-guidance coverage test.
3. `BELIEF.visibility` renders in both `{pov_relevant_beliefs}` and `{non_pov_behavior_shaping_beliefs}` bodies → compiler unit test on both belief sections.
4. The security/prose-contamination scan behavior is unchanged by the reclassification → existing `security` validation test suite still passes (FOUNDATIONS §15 alignment + grep-proof that `promptFacingFields` does not reference the classification sets).

## What to Change

### 1. `packages/core/src/records/editor-descriptors.ts` — per-type prompt-facing override

- Add an exported `PROMPT_FACING_FIELD_OVERRIDES: Readonly<Record<string, ReadonlySet<string>>>` mapping `recordType -> set of field names that are prompt-facing despite appearing operational by default`, initialized with `{ BELIEF: new Set(["visibility"]) }`.
- Thread an optional `recordType` through `describeObjectFields` → `describeField` (defaulting `undefined`; recursion for nested groups passes it along).
- Change `promptFacing` computation to: `(!!recordType && PROMPT_FACING_FIELD_OVERRIDES[recordType]?.has(name)) || !STATUS_OR_VALIDATION_FIELDS.has(name)`.
- Pass `definition.recordType` at the `recordEditorDescriptors` build site (`editor-descriptors.ts:131-138`). Leave `describeSchemaFields` callers without a record type (no override applied) — behavior unchanged for them.

### 2. `packages/core/src/records/field-guidance-records.ts` — honor the per-type override

- Import `PROMPT_FACING_FIELD_OVERRIDES` from `editor-descriptors.ts`.
- In `recordEntry`, compute `isOperational = operationalFields.has(leafName) && !PROMPT_FACING_FIELD_OVERRIDES[recordType]?.has(leafName)`. This flips `BELIEF.visibility` to the non-operational branch (`promptFacing: "conditional"`, `promptDestinations: [destinationFamilyByType["BELIEF"]]`, no `validationRole`) while leaving every other type's `visibility` operational.

### 3. `packages/core/src/compiler/sections/records-tail.ts` — render belief visibility

Append `labelValue("visibility", payload.visibility)` to both belief resolver projections established in BELIEFPROMPT-001 (POV: after `behavior`; non-POV: after `access`). `labelValue` omits empty/`"none"` values; `visibility` is a required enum, so it always renders.

### 4. Docs — add visibility to the belief prompt-treatment notes

- `docs/compiler-contract.md` belief rows (152-153, as updated by BELIEFPROMPT-001): add `visibility` to the rendered field list for both belief placeholders.
- `docs/story-record-schema.md` §6.2 BELIEF "Prompt treatment" (as updated by BELIEFPROMPT-001): add `visibility` to the rendered field list.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)
- `packages/core/test/field-guidance-records.test.ts` (modify, or the relevant field-guidance coverage test)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)

## Out of Scope

- Rendering `visibility` in RELATIONSHIP, EMOTION, or causal-pressure prompt sections — those compilers and their classification are unchanged; only `BELIEF.visibility` is reclassified.
- The other belief fields (BELIEFPROMPT-001).
- Any change to `beliefSchema` or to the global `STATUS_OR_VALIDATION_FIELDS` / `operationalFields` default membership.

## Acceptance Criteria

### Tests That Must Pass

1. `editor-descriptors.test.ts` asserts `recordEditorDescriptors.BELIEF` has `visibility` with `promptFacing: true`, while RELATIONSHIP/EMOTION and the causal-pressure record types still have `visibility` with `promptFacing: false`.
2. The field-guidance test asserts `BELIEF.visibility` guidance has `promptFacing: "conditional"` with a non-empty belief `promptDestinations` and no `validationRole`, and that another type's `visibility` guidance remains `"never"`.
3. `compiler-tail-sections.test.ts` asserts `visibility:` renders in both the `{pov_relevant_beliefs}` and `{non_pov_behavior_shaping_beliefs}` bodies for a fully-populated belief.
4. The existing `security` validation tests still pass (reclassification has no effect on the prose-contamination scan).
5. `npm run lint`, `npm run typecheck`, and `npm test` all pass.

### Invariants

1. The per-type override is the only mechanism that flips a field's prompt-facing status away from the global default; no field name other than `BELIEF.visibility` changes classification — codebase grep-proof on `PROMPT_FACING_FIELD_OVERRIDES`.
2. Compilation remains deterministic and renders only authored belief fields — FOUNDATIONS §8, §13–§14.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — assert per-type `promptFacing` for `visibility` across BELIEF vs RELATIONSHIP/EMOTION/causal-pressure.
2. `packages/core/test/field-guidance-records.test.ts` (or the field-guidance coverage test) — assert `BELIEF.visibility` guidance flipped to conditional/prompt-facing with belief destination.
3. `packages/core/test/compiler-tail-sections.test.ts` — assert `visibility:` appears in both belief sections.

### Commands

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/editor-descriptors.test.ts packages/core/test/field-guidance-records.test.ts packages/core/test/compiler-tail-sections.test.ts`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

`BELIEF.visibility` is now the only field-name override that is prompt-facing despite the global operational-field default. The editor descriptor builder threads record type into field classification, field guidance reuses the same override, and RELATIONSHIP, EMOTION, CLOCK, OBLIGATION, and CONSEQUENCE `visibility` fields remain non-prompt-facing. The belief prompt renderers now append `visibility:` to both POV and non-POV belief sections. The compiler contract, story-record schema note, targeted tests, and frozen golden prompt fixture were updated to match the rendered prompt surface.

Deviation from plan: the frozen golden prompt fixture also needed an intentional rebaseline because it covers demo belief visibility output byte-for-byte.

Verification:

- `npm run build --workspace @loom/core` passed.
- `npx vitest run packages/core/test/editor-descriptors.test.ts packages/core/test/field-guidance-records.test.ts packages/core/test/compiler-tail-sections.test.ts` passed.
- `npx vitest run packages/core/test/validation-warnings-security.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `rg -n "PROMPT_FACING_FIELD_OVERRIDES|visibility" packages/core/src/records/editor-descriptors.ts packages/core/src/records/field-guidance-records.ts packages/core/test/editor-descriptors.test.ts packages/core/test/field-guidance-records.test.ts` confirmed the override map contains only `BELIEF.visibility` and is reused by field guidance.
