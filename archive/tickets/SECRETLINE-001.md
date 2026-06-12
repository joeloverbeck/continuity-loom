# SECRETLINE-001: Omit empty value-lines in `<secrets_and_reveal_constraints>`

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — dedicated renderer for `secrets_and_reveal_constraints` in `@loom/core` (`compile-prompt.ts`); golden refreshes (prose + ideation); `docs/compiler-contract.md` + `docs/prompt-template.md` (lockstep).
**Deps**: None

## Problem

`<secrets_and_reveal_constraints>` renders all six value-lines (writer-visible truths, secret holders, characters who must not know, allowed clues, forbidden reveals, reveal permission) even when a line has nothing to show — emitting `Forbidden reveals now:\nNone specified` and similar across every prompt. This is the same token-waste pattern already fixed for `<pov_knowledge_constraints>` in the prior pass (`archive/tickets/POVEMPTYLINE-001.md`), which established that omitting empty value-*lines* within a section (keeping the section tag + static rules text) is the sanctioned pattern and satisfies FOUNDATIONS §29.4.

Context: this was surfaced while investigating an Ideate prompt showing `Forbidden reveals now:\n- n`. That specific output was **faithful rendering of authored data** (`forbidden_reveals: ["n"]` in the `red-bunny` secret) and is corrected by deleting the stray list item, NOT by code. This ticket addresses the adjacent, genuine hygiene gap: the empty-line case. It does not change the `- n` line.

## Assumption Reassessment (2026-06-12)

1. **Current rendering (verified):** `secrets_and_reveal_constraints` is rendered via the generic template path — `renderSection` falls through to `SECTION_TEMPLATES[sectionId]` + `renderTemplate` (`compile-prompt.ts:187-188`); the template `template-constants.ts:184-204` hardcodes all six labels with `{placeholder}` lines. Empty placeholders resolve to `EMPTY_STATE_CONSTANTS.*` (e.g. `forbidden_reveals: "None specified"`, `empty-states.ts:32`) via `front.ts:142-165`, so the label line is always emitted.
2. **Precedent pattern (verified):** `renderPovKnowledgeConstraintsSection` (`compile-prompt.ts:219-232`) builds label/value blocks, drops a block when its value is empty or equals the empty-state constant, and appends the section's static rules text. The same shape applies directly to secrets.
3. **Deterministic-compilation surface (§8) + §29.4:** the section tag `<secrets_and_reveal_constraints>` and its static rules paragraph (`template-constants.ts:203`) must always remain so the universal section is never dropped; only empty value-lines are omitted — matching the POVEMPTYLINE precedent and §29.4.
4. **Schema/consumer check:** no schema change; `forbidden_reveals` keeps its `array | "none"` shape (`records/knowledge.ts:74`). The active-secret affirmative `none` sentinel still renders `No reveals are forbidden beyond the stated reveal permission.` (`front.ts:157-158`) — that is content, not an empty line, so it is NOT omitted.
5. **Shared by both prompts:** the section is in both `SECTION_ORDER` (`:13`) and `IDEATION_SECTION_ORDER` (`:44`), so the change affects prose and ideation prompts identically — both goldens refresh.

## Architecture Check

1. Reuse the established `renderPovKnowledgeConstraintsSection` shape (label/value blocks + retained static rules) rather than adding ad-hoc emptiness checks inside the template string — consistent with the sanctioned pattern and keeps the section tag/rules invariant.
2. No shim: replace the generic template resolution for this one section id with a dedicated renderer branch in `renderSection`, mirroring the existing `pov_knowledge_constraints` branch.

## Verification Layers

1. Empty value-lines omitted → unit/golden: a snapshot with no active secrets renders `<secrets_and_reveal_constraints>` with only the static rules text (no `None specified` value-lines), tag retained.
2. Populated lines preserved → snapshot with active secrets renders the non-empty lines, including the affirmative `none` sentinel line.
3. §29.4 invariant → section tag + static rules paragraph always present.

## What to Change

### 1. Dedicated secrets renderer

In `compile-prompt.ts`: add a `secretsAndRevealConstraintBlocks` label/placeholder list and a `renderSecretsAndRevealConstraintsSection` mirroring `renderPovKnowledgeConstraintsSection` — emit only blocks whose resolved value is non-empty and not equal to the placeholder's empty-state constant, then append the static rules text (`A secret may be revealed only if …`). Wire a `sectionId === "secrets_and_reveal_constraints"` branch in `renderSection`.

### 2. Docs (lockstep)

- `docs/compiler-contract.md` — update the `secrets_and_reveal_constraints` rows (incl. `{forbidden_reveals}` empty-state row `:180`) to state empty value-lines are omitted, section tag + rules retained.
- `docs/prompt-template.md` — reflect the value-line omission in the secrets section description.

### 3. Goldens

- Refresh `golden-ideation.prompt.txt` (empty `None specified` lines at ~132/135/153) and `golden-first-segment.prompt.txt` if its secrets section has empty lines.

## Files to Touch

- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify — add empty/populated secrets cases)
- `packages/core/test/compiler-golden.test.ts` / `golden-first-segment.prompt.txt` (modify if affected)
- `packages/core/test/compiler-ideation-golden.test.ts` / `golden-ideation.prompt.txt` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)

## Out of Scope

- The `forbidden_reveals: ["n"]` production data (authored junk; user deletes the stray item — not a code change).
- Dropping the whole `<secrets_and_reveal_constraints>` section when fully empty (forbidden by §29.4 — tag + rules always render).
- Any change to the affirmative `none` sentinel behavior.

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-front-sections.test.ts` — no-active-secrets snapshot: section has the tag + static rules and zero `None specified` value-lines.
2. Active-secrets snapshot: non-empty value-lines render; affirmative `none` renders its sentence (not omitted).
3. Goldens regenerated; `npm run lint && npm run typecheck && npm test`.

### Invariants

1. `<secrets_and_reveal_constraints>` tag and static rules paragraph are always present (§29.4).
2. No value-line equal to an empty-state constant (`None specified`, etc.) appears in the rendered section.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — empty and populated secrets section cases.
2. Golden refreshes (prose + ideation).

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-12

Implemented a dedicated `secrets_and_reveal_constraints` renderer in `@loom/core` that omits empty placeholder value-lines while preserving the section tag and static reveal-permission rule. Updated compiler-section and scaffold tests for no-active-secret and partially populated active-secret cases, including preservation of the affirmative `forbidden_reveals: "none"` sentence as content rather than empty state. Updated `docs/compiler-contract.md` and `docs/prompt-template.md` to make the omission rule explicit.

Deviations from original plan: the prose and ideation golden files did not require refresh because their existing secrets sections already contain populated secret data; their golden tests passed unchanged.

Verification results:

- `npm test -- compiler-front-sections` passed.
- `npm test -- compiler-golden compiler-ideation-golden` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` initially exposed one scaffold pin for the old empty-state behavior; after updating that scaffold test, `npm test -- compiler-scaffold` passed.
- `npm test` passed: 121 test files, 909 tests.
- `npm run build` passed; Vite emitted the existing large-chunk warning.
