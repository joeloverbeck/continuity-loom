# AUDAMBIG-001: Surface `audience_visibility: ambiguous` secrets in a dedicated omit-when-empty audience-knowledge line

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` compiler (`sections/front.ts`, `compile-prompt.ts`, `placeholder-map.ts`, `empty-states.ts`, `template-constants.ts`); docs `compiler-contract.md`, `prompt-template.md`, `prompt-template-rationale.md`. Additive extension of the universal prompt contract (FOUNDATIONS §9).
**Deps**: None

## Problem

An active `SECRET` (`status` ∈ `{hidden, partially_revealed}`) with `audience_visibility: "ambiguous"` is rendered into **none** of the three `<audience_knowledge>` lanes, so it silently vanishes from the audience-knowledge section of the compiled prompt.

The three audience resolvers in `packages/core/src/compiler/sections/front.ts` bucket only:

- `renderAudienceKnows` (front.ts:358) — `audience_visibility ∈ {explicit, implied}`
- `renderAudienceDoesNotKnow` (front.ts:369) — `audience_visibility === "hidden"`
- `renderDramaticIrony` (front.ts:380) — `audience_visibility === "explicit"` and `pov_access !== "knows"`

`ambiguous` matches no branch. Validation does not catch this: `matrix-knowledge.ts:109` only checks that `audience_visibility` *has text*, and `ambiguous` is a schema-legal, filled value (`knowledge.ts:70`, `story-record-schema.md:617`), so an ambiguous secret passes the secret/clue-pressure gate yet produces no audience guidance.

`ambiguous` is a deliberate third audience state — "the audience may be inferring the truth, but whether they have grasped it is unresolved" (the slow-burn / reader-suspects-but-isn't-sure tool). Collapsing it into either binary lane destroys the nuance that motivated choosing `ambiguous` over `hidden`/`implied`/`explicit`. The fix is a distinct, faithful representation that does not overstate audience knowledge.

The secret's *truth* is already writer-visible elsewhere via `{writer_visible_hidden_truths}` (front.ts:135, all active secrets regardless of audience visibility); what is missing is the **audience-relationship** guidance for the ambiguous case.

## Assumption Reassessment (2026-06-08)

1. **Codebase — the drop is real.** The only audience-lane resolvers are `renderAudienceKnows` / `renderAudienceDoesNotKnow` / `renderDramaticIrony` (`packages/core/src/compiler/sections/front.ts:358–389`). None handles `audience_visibility === "ambiguous"`. Confirmed by grep: no `"ambiguous"` branch exists in `packages/core/src/compiler/`.
2. **Codebase — validation does not block it.** `packages/core/src/validation/rules/matrix-knowledge.ts:109` gates on `hasText(payload.audience_visibility)` only; `ambiguous` satisfies it. So the secret compiles with no audience representation and no warning.
3. **Schema — `ambiguous` is a first-class persistable value.** `secretSchema.audience_visibility = z.enum(["hidden", "implied", "explicit", "ambiguous"])` (`packages/core/src/records/knowledge.ts:70`); mirrored in `docs/story-record-schema.md:617`. Therefore an authoring-time block on `ambiguous` would contradict the schema and is rejected as the fix; the compiler must represent it.
4. **FOUNDATIONS principle under audit.** §9 universal prompt contract (the `<audience_knowledge>` section shape), §8 deterministic compilation (output is a pure function of records), §15 POV/knowledge/secrets (the new line must not overstate audience knowledge or grant the POV forbidden knowledge). The change is additive and deterministic; it does not weaken the secret firewall — the ambiguous line carries explicit "not established reader knowledge / do not grant the POV forbidden knowledge" framing.
5. **Deterministic-compilation surface.** The section is currently produced by the static-template fallback in `renderSection` (`packages/core/src/compiler/compile-prompt.ts:119–122`) via `SECTION_TEMPLATES.audience_knowledge` (`template-constants.ts:151`). The omit-when-empty pattern already exists in this compiler: `renderStopRuleSection` (compile-prompt.ts:153) keeps the static template as the single authority and injects a conditional line before a known anchor only when content is present; `renderManualDirectiveSection`/`renderImmediateHandoffSection` filter lines on `alwaysRender || hasValue`. This ticket follows the `renderStopRuleSection` precedent so non-ambiguous prompts stay byte-identical.
6. **Output-schema extension.** Extends the compiled `<audience_knowledge>` prompt section with one new optional line and one new placeholder (`audience_perception_ambiguous`). The consumer is the prose-generation LLM reading the prompt; the extension is additive (new line rendered only when ≥1 active ambiguous secret exists), so no existing consumer or golden output for non-ambiguous prompts changes. The authority docs `compiler-contract.md` and `prompt-template.md` are amended in the same ticket so the contract and the implementation stay in lockstep.
7. **Adjacent contradictions.** While reassessing, two adjacent items were noted and are **explicitly out of scope** of this ticket: (a) whether `implied` is "strong enough" to be labeled "Audience already knows" (a label-semantics question), and (b) whether the existing always-on "None specified" audience lanes are noise (a separate omit-when-empty proposal). Neither is required for this fix; each must become its own ticket if pursued.

## Architecture Check

1. **Why this approach.** A dedicated, omit-when-empty line is the only option that preserves the authorial intent of `ambiguous` (a third state distinct from knows/doesn't-know) while not overstating audience knowledge. Routing `ambiguous` into "Audience already knows" overstates (audience has not confirmed the truth); routing into "Audience does not know" understates and discards the suspense nuance; an authoring-time block contradicts the schema (Assumption 3). Omit-when-empty keeps the common prompt clean and reuses the established `renderStopRuleSection` injection pattern, so it adds no "None specified" noise and keeps a single source of truth for the static section text.
2. **No backwards-compatibility aliasing/shims.** No alias or duplicate authority path is introduced. `SECTION_TEMPLATES.audience_knowledge` remains the single source of the static section text; the render function injects the conditional line rather than forking a second copy of the section.

## Verification Layers

1. **Invariant: an active secret with `audience_visibility: "ambiguous"` appears in the compiled `<audience_knowledge>` section.** → schema validation (prompt-section conformance against `docs/compiler-contract.md` new row) + unit test in `packages/core/test/compiler-front-sections.test.ts`.
2. **Invariant: prompts with no active ambiguous secret render the `<audience_knowledge>` section byte-identically to current output (line omitted).** → codebase grep-proof (the injected line is gated on a non-empty resolver) + existing compiler golden/section tests remain green.
3. **Invariant: the ambiguous line does not assert audience knowledge or grant the POV forbidden knowledge (secret firewall, FOUNDATIONS §15).** → manual review (secret-firewall audit of the rendered line wording) + FOUNDATIONS alignment check (§15).
4. **Invariant: `ambiguous` secrets are still excluded from the three existing lanes** (no double-counting). → unit test asserting an ambiguous secret is absent from "Audience already knows" / "Audience does not know" / "Dramatic irony allowed now".

## What to Change

### 1. New placeholder + resolver (`packages/core/src/compiler/sections/front.ts`)

- Add `audience_perception_ambiguous` to the `frontResolvers` map, backed by a new `renderAudiencePerceptionAmbiguous(snapshot)` that mirrors the existing audience resolvers:
  - select via `bulletRecords(snapshot, "SECRET", (payload) => isActiveSecret(payload) && payload.audience_visibility === "ambiguous", (payload) => asString(payload.secret_claim))`;
  - return `lines.join("\n")` or `EMPTY_STATE_CONSTANTS.audience_perception_ambiguous` when empty.
- Leave `renderAudienceKnows` / `renderAudienceDoesNotKnow` / `renderDramaticIrony` unchanged (ambiguous must remain excluded from all three — Verification Layer 4).

### 2. Register the placeholder name (`packages/core/src/compiler/placeholder-map.ts`)

- Add `| "audience_perception_ambiguous"` to the `PlaceholderName` union.

### 3. Empty-state constant (`packages/core/src/compiler/empty-states.ts`)

- Add `audience_perception_ambiguous: "None specified"`. (Used only by the registry default path; the section omits the line when the resolver is empty, so this string is not expected to surface — it exists for type completeness and the `resolvePlaceholder` contract.)

### 4. Conditional injection in the section render (`packages/core/src/compiler/compile-prompt.ts`)

- Add a branch in `renderSection`: `if (sectionId === "audience_knowledge") return renderAudienceKnowledgeSection(snapshot);`
- Implement `renderAudienceKnowledgeSection` mirroring `renderStopRuleSection`: start from `SECTION_TEMPLATES.audience_knowledge`; resolve `audience_perception_ambiguous`; when the resolved value is non-empty, inject the labeled block immediately before the trailing anchor line `If the audience knows something the POV does not,` (the existing static instruction). When empty, return the template unchanged (byte-identical to current output).
- Proposed injected block (final wording, refinable at review):

  ```
  Audience may be inferring (ambiguous — not established reader knowledge):
  {audience_perception_ambiguous}

  Treat these as unresolved: shape suspense and surface cues, but do not write as if the audience has confirmed them.
  ```

### 5. Authority docs (additive)

- `docs/compiler-contract.md`: add a placeholder row for `{audience_perception_ambiguous}` immediately after `{dramatic_irony_permissions}` — source `AUDIENCE KNOWLEDGE PROFILE` derived from active `SECRET` where `audience_visibility === "ambiguous"`; empty/missing behavior **"Omit line when empty"** (mirroring the manual-directive rows, not the `None specified` sentinel rows); note "Audience grasp deliberately unresolved; does not assert audience knowledge or grant POV knowledge."
- `docs/prompt-template.md`: add the conditional `Audience may be inferring (ambiguous — not established reader knowledge):` block to the `<audience_knowledge>` section, annotated as rendered only when an active ambiguous secret exists.
- `docs/prompt-template-rationale.md` §14: one sentence explaining the ambiguous lane (third audience state between hidden and known; preserved rather than collapsed into a binary lane).

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify)
- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)

## Out of Scope

- Re-evaluating whether `implied` should be labeled "Audience already knows" (Assumption 7a — separate ticket if pursued).
- Converting the existing always-on audience lanes ("Audience does not know" / "Dramatic irony allowed now") to omit-when-empty (Assumption 7b — separate ticket if pursued).
- Any change to the `SECRET` schema, validation enum values, or `audience_visibility` semantics — `ambiguous` remains a schema-legal value.
- `audience_visibility: ambiguous` handling on `FACT`, `EVENT`, or `OPEN THREAD` records — this ticket is scoped to the `SECRET` audience-knowledge lanes only.

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: a snapshot with one active `SECRET` (`status: partially_revealed`, `audience_visibility: "ambiguous"`) compiles a `<audience_knowledge>` section that contains the `Audience may be inferring (ambiguous` line and the secret's `secret_claim`, and the same claim is **absent** from the three existing lanes.
2. New unit test: a snapshot with no ambiguous secret compiles a `<audience_knowledge>` section with **no** `Audience may be inferring` line (byte-identical to current output).
3. `npm test` (builds `@loom/core` then runs Vitest) passes, including existing compiler/golden tests unchanged for non-ambiguous prompts.

### Invariants

1. The compiled `<audience_knowledge>` section is a deterministic pure function of the snapshot; the ambiguous line renders iff ≥1 active secret has `audience_visibility === "ambiguous"`.
2. `SECTION_TEMPLATES.audience_knowledge` remains the single authority for the section's static text; no duplicate copy of the section body is introduced.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add ambiguous-secret coverage: the new line renders with the claim, the claim is excluded from the three existing lanes, and the line is omitted when no ambiguous secret exists.

### Commands

1. `npm test -- compiler-front-sections` — targeted Vitest run for the audience-section changes.
2. `npm run lint && npm run typecheck && npm test` — full gate (the new `PlaceholderName` member and resolver must typecheck against the frozen placeholder map).
3. A narrower command is insufficient because adding a `PlaceholderName` union member touches the exhaustive `EMPTY_STATE_CONSTANTS` / `PLACEHOLDER_MAP` registries; `typecheck` is the boundary that proves registration completeness.

## Outcome

Completion date: 2026-06-08

What changed:

- Added the `{audience_perception_ambiguous}` placeholder, resolver, and empty-state registration.
- Added conditional `<audience_knowledge>` rendering that injects an ambiguous audience-perception block only when at least one active `SECRET` has `audience_visibility: "ambiguous"`.
- Updated compiler contract/template/rationale docs for the additive audience-knowledge prompt contract extension.
- Added compiler-front tests proving ambiguous secrets render in the dedicated block, stay out of the three existing audience lanes, and omit the new block when absent.

Deviations from original plan:

- Used ASCII hyphen wording (`ambiguous - not established reader knowledge`) to match repository editing defaults.
- The resolver still returns the registered `None specified` sentinel for registry completeness; the audience-section renderer treats that sentinel as empty and omits the conditional block.

Verification results:

- `npm test -- compiler-front-sections` passed: 1 test file, 24 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 test files, 697 tests.
