# SPECVALGATTAX-001: Add `immediate_situation_summary` current-state field, placeholder, and backfill

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new generation-time-brief field (`current_authoritative_state.immediate_situation_summary`) across final/draft/ready schemas; new prompt placeholder + template slot; `docs/compiler-contract.md` + `docs/story-record-schema.md` updates; draft-migration backfill. Production behavior changes (a new prompt-facing line and a new field the snapshot carries).
**Deps**: None (consumes the landed draft migration `packages/server/src/generation-session-draft-migration.ts`)

## Problem

The corrected universal blocker set (SPECVALGATTAX-002) needs a deterministic, prose-neutral statement of the immediate local situation that is always present for a first quiet unit — independent of the physical fields that become context-gated. The spec (§Minimum universal current authoritative state) adds `immediate_situation_summary` to `current_authoritative_state` as a universally-required field. The field does not exist yet (`grep -rn immediate_situation_summary packages/ docs/` returns nothing), so it must be introduced coherently across schema, compiler, docs, and the draft backfill in one change before the validator can require it.

## Assumption Reassessment (2026-06-07)

1. The field is genuinely new: `grep -rn "immediate_situation_summary" packages/ docs/` returns 0 matches. `current_authoritative_state` is defined in three variants — `currentAuthoritativeStateSchema` (`packages/core/src/records/generation-brief.ts:31`), `currentAuthoritativeStateDraftSchema` (`packages/core/src/records/generation-brief-draft.ts:35`, permissive/optional), and `currentAuthoritativeStateReadySchema` (`packages/core/src/records/generation-brief-readiness.ts:174`). All three must gain the field.
2. The spec (`specs/SPEC-validation-gating-taxonomy-and-focus-matrix.md` §Minimum universal current authoritative state) names this exact deliverable and its coordinated surfaces; it requires the field stay user-authored and never prose-derived (FOUNDATIONS §10). `docs/story-record-schema.md` and `docs/compiler-contract.md` are the schema/compiler authorities per `docs/ACTIVE-DOCS.md`.
3. Cross-artifact boundary under audit: the generation-time-brief schema ↔ deterministic prompt placeholder contract. The prompt section that renders current state lives in `SECTION_TEMPLATES` (`packages/core/src/compiler/template-constants.ts:102-104`: `Time/Location/Onstage entities`); placeholders are typed by `PlaceholderName` (`packages/core/src/compiler/placeholder-map.ts:10`) and resolved via `EMPTY_STATE_CONSTANTS` keys + a per-field resolver in `packages/core/src/compiler/sections/front.ts`.
4. FOUNDATIONS principle restated before trusting the spec: §8 requires that adding a prompt placeholder updates the compiler contract in the **same** change ("Drift between template, schema, rationale, example, and compiler contract is a continuity bug"); §9 lists "current authoritative state" as a universal prompt section — adding a sub-field preserves the section, it does not add a new top-level section.
5. Deterministic-compilation surface touched: the new placeholder resolves deterministically from the user-authored field, with a deterministic empty-state string when blank — no LLM intermediary, no nondeterministic input. The field is user-authored only; it must never be populated from accepted prose or an auto-summary (secret firewall is unaffected — the field carries no POV/secret semantics, but the no-prose-derived rule under §10 is enforced by leaving population to the user/UI, never the compiler).
6. Extends an existing output schema (generation-time brief + prompt section). Consumers of `current_authoritative_state`: the compiler front section, the validator rules, the readiness normalizer, the demo fixture, and the draft migration. The extension is **required** (not optional), so every strict-schema construction site must supply it; the draft schema keeps it optional (permissive draft contract) and the migration backfills a deterministic value so existing persisted drafts are not invalidated.

## Architecture Check

1. Co-locating the schema field, the placeholder, the template slot, the contract/doc update, and the backfill in one ticket keeps the §8 "same-change" contract intact — splitting them would create a window where the template references a placeholder the schema/contract does not define. The placeholder auto-wires through `EMPTY_STATE_CONSTANTS` (the `PLACEHOLDER_MAP` builds resolvers from its keys), so the empty-state path needs no bespoke plumbing.
2. No backwards-compatibility alias is introduced. The draft schema's optional field + a one-time migration backfill is the migration path, not a permanent dual-field shim; the strict schemas require the field outright.

## Verification Layers

1. Field present in all three schema variants -> codebase grep-proof (`immediate_situation_summary` in `generation-brief.ts`, `generation-brief-draft.ts`, `generation-brief-readiness.ts`).
2. Placeholder renders deterministically with a blank empty-state -> schema validation / compiler golden test (`packages/core/test/compiler-golden.test.ts`).
3. Compiler-contract ↔ template ↔ schema coherence -> FOUNDATIONS alignment check (§8) + grep that `docs/compiler-contract.md` names the new placeholder.
4. Existing persisted drafts survive the new field -> migration test (draft without the field backfills the deterministic value, stays loadable).

## What to Change

### 1. Schema (three variants)

Add `immediate_situation_summary` as a required non-empty string to `currentAuthoritativeStateSchema` (`generation-brief.ts`) and `currentAuthoritativeStateReadySchema` (`generation-brief-readiness.ts`); add it as an optional field to `currentAuthoritativeStateDraftSchema` (`generation-brief-draft.ts`) consistent with the other permissive draft fields.

### 2. Compiler placeholder + template slot

Add `"immediate_situation_summary"` to the `PlaceholderName` union (`placeholder-map.ts`) and a deterministic empty-state entry to `EMPTY_STATE_CONSTANTS` (`empty-states.ts`), e.g. `"None currently specified"`. Add the value resolver in `compiler/sections/front.ts` alongside the other current-state field resolvers. Add the render slot to the current-authoritative-state section in `SECTION_TEMPLATES` (`template-constants.ts`), e.g. `Immediate situation: {immediate_situation_summary}` adjacent to the Time/Location/Onstage lines.

### 3. Docs

Document the field in `docs/story-record-schema.md` (current-authoritative-state field list) and the placeholder + section line in `docs/compiler-contract.md`, in the same change.

### 4. Backfill + demo fixture

Add a backfill in `packages/server/src/generation-session-draft-migration.ts` that supplies a deterministic `immediate_situation_summary` for drafts lacking it (mirroring the existing field normalization). Update the demo fixture `packages/core/src/demo/letter-under-flour-bin.ts` current_authoritative_state literal to include a user-authored value (e.g. `"Mara is alone in the pantry after hearing a sound near the flour bin."`).

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-readiness.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify)
- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/generation-session-draft-migration.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/generation-brief-draft.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)

## Out of Scope

- Making the validator require the field (SPECVALGATTAX-002).
- Any UI field/control for editing it (Readiness/Three-Page UX spec).
- The minimum-vs-context-gated split of the other current-state fields (SPECVALGATTAX-002).

## Acceptance Criteria

### Tests That Must Pass

1. A `current_authoritative_state` parsed by the strict (`generation-brief.ts`) and ready schemas without `immediate_situation_summary` is rejected; with it, accepted.
2. A draft missing `immediate_situation_summary` loads and backfills the deterministic value via `generation-session-draft-migration.ts`.
3. `npm test` (builds `@loom/core` then runs Vitest) passes, including the updated golden snapshot rendering the new section line.

### Invariants

1. The new placeholder resolves deterministically: identical inputs + versions produce identical prompt output (§8); blank field renders the fixed empty-state string.
2. `immediate_situation_summary` is user-authored only — no compiler/migration path populates it from accepted prose, candidate prose, or an auto-summary (§10).

## Test Plan

### New/Modified Tests

1. `packages/core/test/generation-brief-draft.test.ts` — assert draft accepts missing field and migration backfills it; strict schema rejects missing field.
2. `packages/core/test/compiler-golden.test.ts` — regenerate/extend the golden to cover the new current-state section line and its empty-state.

### Commands

1. `npm run -w @loom/core build && npx vitest run packages/core/test/generation-brief-draft.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test`
