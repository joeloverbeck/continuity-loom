# IDEAPROMPT-002: Give the ideation prompt its own trimmed `<contradiction_prohibitions>`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — new ideation-specific section in `@loom/core` (`template-constants.ts`); golden-ideation refresh; `docs/ideation-prompt-template.md` + `docs/compiler-contract.md` amendment (lockstep).
**Deps**: None

## Problem

The Ideate page prompt includes `<contradiction_prohibitions>` copied verbatim from the **prose-writer** prompt. The ideator produces premise-level ideas or author-facing questions — never prose — so roughly half the block's lines are prose-craft prohibitions that do not apply, and several others duplicate constraints `<ideation_role>` / `<ideation_quality>` already state. Prose-craft lines that misfit ideation:

- `flatten active cast into generic speech or generic psychology`
- `copy verbatim, closely echo, or turn sample utterances into catchphrases; \`may_reuse_cadence_not_text\` … \`canonical_phrase\` …`
- `resolve immediate tension unless the directive requires it`
- `write exposition-dialogue unless the moment pressures the character to say it`
- `replace concrete behavior with abstract diagnosis`

The continuity/canon/knowledge/secret prohibitions in the block ARE relevant and worth keeping (e.g. *give characters knowledge they do not have*, *reveal secrets to the wrong character or narrator*, *turn prejudice/fantasy into objective fact unless records establish it*). Decision (user, 2026-06-12): **trim to a continuity-only ideation block**, not drop and not keep-as-is.

## Assumption Reassessment (2026-06-12)

1. **Shared constant (verified):** `<contradiction_prohibitions>` is a single template in `packages/core/src/compiler/template-constants.ts:348-363`, referenced by both `SECTION_ORDER` (`:26`, prose) and `IDEATION_SECTION_ORDER` (`:56`, ideation). There is no ideation-specific override today.
2. **Authority doc currently sanctions the full block (verified):** `docs/ideation-prompt-template.md:49` lists `<contradiction_prohibitions>` at ideation position 22 with no trim note; `docs/compiler-contract.md:105` lists it as ideation section 22. Trimming therefore requires amending both docs in lockstep — current behavior matches the docs, so this is a deliberate design change, not a bug-vs-doc fix.
3. **Extension mechanism (verified):** ideation-unique sections live in `IDEATION_SECTION_TEMPLATES` (`template-constants.ts:408-440`), typed `StaticIdeationSectionId = Exclude<IdeationSectionId, PromptSectionId | "ideation_slots">` (`:96`); `renderSection` resolves them via `isStaticIdeationSectionId` (`compile-prompt.ts:179-181`) BEFORE the shared `SECTION_TEMPLATES` fallback (`:187`). A new ideation-only section id slots cleanly into this existing path.
4. **FOUNDATIONS (§9.1):** the ideation prompt is the sanctioned, deterministic assistance prompt (`docs/ideation-prompt-template.md:11`). Replacing a prose-only constraint block with an ideation-appropriate one keeps it deterministic and inspectable; no secret-firewall or determinism weakening.
5. **Adjacent-contradiction classification:** the prose `<contradiction_prohibitions>` (SECTION_ORDER #25) is correct for prose and must stay byte-identical — this ticket must NOT alter the prose prompt. Verified prose-golden coverage exists (`packages/core/test/compiler-golden.test.ts` / `golden-first-segment.prompt.txt`) and must remain green unchanged.

## Architecture Check

1. Cleaner to add a dedicated `ideation_contradiction_prohibitions` section (its own `IDEATION_SECTION_ORDER` entry + `IDEATION_SECTION_TEMPLATES` template) than to branch inside the shared template — it mirrors how `ideation_role` / `ideation_quality` / `ideation_output_format` already diverge, leaves the prose block untouched, and needs no conditional in `renderSection` beyond the existing static-ideation path.
2. No shim/alias: the prose `contradiction_prohibitions` constant is unchanged; the ideation order references the new id instead of the shared one.

## Verification Layers

1. Ideation prompt shows the trimmed block, prose prompt unchanged → two goldens: `golden-ideation.prompt.txt` updated; `golden-first-segment.prompt.txt` byte-identical.
2. Section ordering preserved → ideation order still renders the block at position 22 (now the ideation-specific id).
3. Docs match compiled output → `compiler-contract.md` + `ideation-prompt-template.md` describe the trimmed ideation block.

## What to Change

### 1. New ideation section template

In `template-constants.ts`: add `ideation_contradiction_prohibitions` to `IDEATION_SECTION_ORDER` (position 22, replacing the shared `contradiction_prohibitions` entry) and add its trimmed template to `IDEATION_SECTION_TEMPLATES`. Keep the continuity/canon/knowledge/secret/physical-continuity lines; drop the prose-craft lines enumerated in Problem. (Wrap it in `<contradiction_prohibitions>…</contradiction_prohibitions>` tags so the output tag name is unchanged — only the ideation body differs.)

### 2. Docs (lockstep)

- `docs/ideation-prompt-template.md` — update the §Section Order entry (position 22) and add an Ideation-Sections description of the trimmed `<contradiction_prohibitions>`, noting it diverges from the prose block.
- `docs/compiler-contract.md:105` — update the ideation section-22 row to point at the ideation-specific source.

### 3. Golden

- Refresh `packages/core/test/golden-ideation.prompt.txt` (lines ~311-326) to the trimmed block.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` / `golden-ideation.prompt.txt` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `docs/compiler-contract.md` (modify)

## Out of Scope

- The prose-writer `<contradiction_prohibitions>` (SECTION_ORDER #25) — must remain byte-identical.
- Re-deriving `<ideation_role>` / `<ideation_quality>` content (the trim only avoids duplicating, it doesn't move text between sections).
- Dropping the block entirely (rejected in favor of trim, user decision 2026-06-12).

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-ideation-golden.test.ts` — ideation golden shows the trimmed `<contradiction_prohibitions>` (prose-craft lines absent, continuity lines present).
2. `compiler-golden.test.ts` — prose golden `golden-first-segment.prompt.txt` is byte-identical (prose block untouched).
3. `npm run lint && npm run typecheck && npm test`.

### Invariants

1. The prose prompt's `<contradiction_prohibitions>` is unchanged by this ticket.
2. The ideation prompt renders exactly one `<contradiction_prohibitions>` block, at section-order position 22, containing no prose-craft-only prohibitions.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ideation-golden.test.ts` / `golden-ideation.prompt.txt` — trimmed ideation block.
2. Add an assertion that the ideation prompt does not contain the dropped prose-craft phrases (e.g. `exposition-dialogue`, `catchphrases`).

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-12

What changed:
- `packages/core/src/compiler/template-constants.ts` now uses an ideation-specific `ideation_contradiction_prohibitions` section id in `IDEATION_SECTION_ORDER`.
- The new ideation template still renders the public `<contradiction_prohibitions>` tag at the same prompt position, but trims the body to continuity/canon/knowledge/reveal/future-consequence/global-structure prohibitions.
- The prose prompt's shared `contradiction_prohibitions` template and prose golden remain unchanged.
- `packages/core/test/compiler-ideation-golden.test.ts` now asserts the ideation prompt excludes prose-craft-only lines such as `exposition-dialogue`, `catchphrases`, and generic-speech flattening.
- `docs/compiler-contract.md` and `docs/ideation-prompt-template.md` now describe the ideation-specific trimmed block.

Deviations from original plan:
- Implemented and archived together with `IDEAPROMPT-001` because both tickets intentionally update the same ideation golden fixture and ideation prompt contract docs. No prose-prompt behavior was coupled into the ideation trim.

Verification:
- `npm exec vitest run packages/core/test/ideation-slot-assignment.test.ts packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts` passed.
- `npm run build --workspace @loom/core` passed.
- `npm exec vitest run packages/server/src/ideate.e2e.test.ts packages/server/src/ideate-routes.test.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 121 files, 909 tests.
- `npm run build` passed, with Vite's existing large-chunk warning.
