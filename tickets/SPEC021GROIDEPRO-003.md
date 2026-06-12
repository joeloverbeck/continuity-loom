# SPEC021GROIDEPRO-003: Ideation prompt assembly + version bumps + compiler-contract mapping + golden

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `compilePrompt` gains an ideation kind (new `IDEATION_SECTION_ORDER`, four ideation section templates, citation-key rendering on reused record sections); `version.ts` template/compiler/contract bumps; `docs/compiler-contract.md` ideation mapping; new byte-frozen ideation golden. Prose-prompt behavior is byte-identical (default kind stays `prose`).
**Deps**: SPEC021GROIDEPRO-002 (consumes `PromptKind`/`IdeationRequest` types, `assignSlots`, `citationKey`)

## Problem

With the operator engine in place (002), this ticket makes a second deterministic prompt actually compile. It adds the `ideation` kind to `compilePrompt`: a frozen ideation section order that reuses the shared front/state/knowledge/records/pressure/cast renderers and replaces the prose-specific tail with four ideation sections (role, slots, quality, output-format), applies stable citation keys to the compiled records, bumps the three contract versions, updates the compiler contract in the same change (§8), and freezes the result in a byte-for-byte golden plus a determinism proof — while guaranteeing the universal prose prompt and its golden are untouched.

## Assumption Reassessment (2026-06-12)

1. **Compiler shape confirmed.** `compilePrompt(snapshot: ValidationSnapshot): CompileResult` (`packages/core/src/compiler/compile-prompt.ts:79`) renders `"# Generated Prose Prompt"` (line 95) then `SECTION_ORDER.map(renderSection)` (line 95–98). `SECTION_ORDER` is one frozen array ending `…contradiction_prohibitions, prose_craft, stop_rule, final_output_instruction` (`template-constants.ts:1–30`); the prose-specific tail templates sit at `template-constants.ts:331–372`. Dynamic sections (`pressure`, `cast`) render via `sections/*.ts`; static sections are template strings in `template-constants.ts`.
2. **Version-bump blast radius confirmed (the §8 / metadata path).** `compile-prompt.ts:85` echoes `snapshot.versions` into metadata; the **server** stamps the real `versionInfo` into the snapshot at `snapshot-builder.ts:74–77`. So bumping `version.ts` (templates `1.0.0→1.1.0`, compiler `1.2.0→1.3.0`, contract `1.3.0→1.4.0`) breaks exactly two assertion sites: `packages/core/test/compiler-front-sections.test.ts:441–442` (`expect(versionInfo.compiler.version).toBe("1.2.0")` / contract `"1.3.0"`) and `packages/server/src/compile-routes.test.ts:156` (`expect(firstBody.metadata.versions).toEqual({…1.2.0…1.3.0})`, produced through the real API). The pervasive `1.0.0/1.0.0/1.0.0` snapshot fixtures and `compiler-golden.test.ts`'s `1.0.0/1.2.0/1.3.0` triple are **explicit fixture inputs**, not `versionInfo`-derived, and stay green (`compiler-golden.test.ts` thereby remains the prose-unchanged guard). `generation-brief-draftability.e2e.test.ts:231` is an accepted-segment input fixture, not a produced-version assertion. As a backstop, regrep `versionInfo\.\w+\.version).toBe` and `metadata.versions).toEqual` before finishing.
3. **Cross-artifact boundary under audit:** the prompt-section contract spans code (`template-constants.ts`, `compile-prompt.ts`), its schema authority (`docs/compiler-contract.md`, "domain authority for prompt compiler"), and the byte-golden. §8 mandates these move in the **same change** — hence `docs/compiler-contract.md` is in this ticket's Files to Touch, not the trailing docs ticket (008). The new `docs/ideation-prompt-template.md` *authority doc* is a separate concern (008).
4. **FOUNDATIONS principle restated:** §8 / §4.4 deterministic compilation — identical snapshot + ideation request → identical ideation prompt, no LLM intermediary; §9 (as amended by 001) — the universal-section list governs the prose prompt class, so replacing the prose tail in the *ideation* class is sanctioned; §29.4's section-omission clause is scoped to prose prompts by 001, so the ideation kind omitting `prose_craft`/`stop_rule`/`final_output_instruction`/`invention_permissions` is not a hard-fail.
5. **Deterministic-compilation + secret-firewall surface:** the ideation render path adds bracketed citation keys to records but must not perturb prose output (guarded by the unchanged prose golden) and must not emit secret payloads the records forbid — the reused secrets/reveal-constraints section renders identically, and `ideation_quality` carries the reveal-discipline rule (surface cues, not certified reveals, where reveal permission is absent, per §15). No `Date.now()`, no unsorted iteration in the ideation path.
6. **Schema/contract extension + consumers:** `IDEATION_SECTION_ORDER` is a new prompt-section set whose schema authority is `docs/compiler-contract.md`; downstream consumers are the server preview/ideate route (005) and the web prompt inspector (006). The extension is additive (new section set beside `SECTION_ORDER`); the prose section set is unchanged.

## Architecture Check

1. A second frozen `IDEATION_SECTION_ORDER` beside `SECTION_ORDER`, dispatched on `promptKind`, is cleaner than branching inside each renderer: the shared front/state/knowledge/records/pressure/cast renderers are reused verbatim (no fork), only the tail differs, and the prose path is provably untouched because its array and header are unchanged. Citation keys are applied as an ideation-mode render option, not a second copy of the record renderers.
2. No backwards-compatibility shims: `compilePrompt` gains an optional `{ promptKind?, ideationRequest? }` argument defaulting to `prose`, so every existing caller (`compilePrompt(snapshot)`) and test compiles unchanged — additive, not aliased.

## Verification Layers

1. Ideation prompt is deterministic → `compiler-ideation-golden.test.ts`: two compiles of the same snapshot + ideation request are byte-identical, and match the frozen `golden-ideation.prompt.txt`.
2. Prose prompt is byte-identical (no regression) → existing `packages/core/test/compiler-golden.test.ts` passes unmodified (default `prose` kind).
3. Version bump landed and reflected end-to-end → `compiler-front-sections.test.ts` (real `versionInfo`) and `compile-routes.test.ts` (real API metadata) updated to `1.1.0/1.3.0/1.4.0` and passing.
4. Ideation section order omits prose-only sections and includes the four ideation sections → grep-proof on `golden-ideation.prompt.txt` section tags (no `<prose_craft>`/`<stop_rule>`/`<final_output_instruction>`; has `<ideation_role>`/`<ideation_slots>`/`<ideation_quality>`/`<ideation_output_format>`).
5. Citation keys are present, unique, and deterministic in the ideation prompt → assertion in the golden test (keys appear on records and in `grounds`).
6. Compiler contract reflects the ideation mapping → grep-proof in `docs/compiler-contract.md`.

## What to Change

### 1. Ideation section templates + section order

`template-constants.ts` (modify): add the static templates `ideation_role` (story-development-consultant frame; suspends the prose writer; output is premise-level ideas/questions, never prose; no new named entities beyond compiled records), `ideation_quality` (Schmid eventfulness rubric + surprise-without-contradiction + reveal-discipline + the per-slot `SKIPPED` rule), and `ideation_output_format` (flat tagged block: ~25-word headline, one-sentence `why` paraphrasing cited records, `grounds` = citation keys, operator name; optional free-text thinking region; "output only the ideas block; malformed output is discarded"). Add the frozen `IDEATION_SECTION_ORDER` array: the reused shared sections (authority hierarchy → contradiction prohibitions, with manual directive rendered only when present as optional author intent) then `ideation_role`, `ideation_slots`, `ideation_quality`, `ideation_output_format`.

### 2. Dynamic ideation_slots renderer + citation keys

`sections/ideation.ts` (new): renders `ideation_slots` from the `IdeationSlot[]` produced by `assignSlots` (002) — each slot names its operator, definition, and the citation keys of eligible feeding records; question-mode renders the question-form contract. Applies `citationKey` (002) to records in the ideation render path as a render option, leaving the prose render path unperturbed.

### 3. Dispatch in compilePrompt

`compile-prompt.ts` (modify): accept `{ promptKind = "prose", ideationRequest }`; for `ideation`, render the ideation header + `IDEATION_SECTION_ORDER`; for `prose`, the existing path verbatim. Build slots via `assignSlots(snapshot working-set records, ideationRequest)`.

### 4. Version bumps + contract + golden

`version.ts` (modify): templates `1.1.0`, compiler `1.3.0`, contract `1.4.0`. `compiler-front-sections.test.ts` + `compile-routes.test.ts` (modify): update the real-version assertions to the bumped triple. `docs/compiler-contract.md` (modify): add the ideation section-order/empty-state mapping (§8 same-change). `golden-ideation.prompt.txt` (new) + `compiler-ideation-golden.test.ts` (new): freeze and prove the ideation prompt.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/sections/ideation.ts` (new)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify) — real `versionInfo` assertion → `1.3.0`/`1.4.0`
- `packages/server/src/compile-routes.test.ts` (modify) — produced `metadata.versions` → `1.1.0`/`1.3.0`/`1.4.0`
- `docs/compiler-contract.md` (modify) — ideation mapping (§8 same-change)
- `packages/core/test/golden-ideation.prompt.txt` (new)
- `packages/core/test/compiler-ideation-golden.test.ts` (new)

## Out of Scope

- Operator taxonomy / slot-assignment algorithm — SPEC021GROIDEPRO-002 (consumed here).
- Kind-aware readiness / relaxed gate — SPEC021GROIDEPRO-004.
- Server route, idea-block parsing, server-side citation *verification* — SPEC021GROIDEPRO-005.
- The new `docs/ideation-prompt-template.md` authority doc, ACTIVE-DOCS registry/version-note, user-guide — SPEC021GROIDEPRO-008.
- Any change to the universal prose prompt template, `SECTION_ORDER`, or `golden-first-segment.prompt.txt` — they remain byte-frozen.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/core/test/compiler-ideation-golden.test.ts` — ideation prompt matches `golden-ideation.prompt.txt` byte-for-byte; two compiles of identical inputs are identical; the four ideation section tags present and prose-only tags absent; citation keys present/unique.
2. `packages/core/test/compiler-golden.test.ts` — unchanged, still byte-identical to `golden-first-segment.prompt.txt` (prose-unchanged guard).
3. `packages/core/test/compiler-front-sections.test.ts` and `packages/server/src/compile-routes.test.ts` — pass with the bumped `1.1.0`/`1.3.0`/`1.4.0` versions.
4. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

### Invariants

1. Default `promptKind` is `prose`; every pre-existing caller/test of `compilePrompt(snapshot)` is byte-identical to before (no prose regression).
2. `version.ts` and `docs/compiler-contract.md` move in this same change (§8); no other test asserting `versionInfo`-derived versions remains stale (regrep `versionInfo\.\w+\.version).toBe` and `metadata.versions).toEqual`).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ideation-golden.test.ts` (new) — ideation golden + determinism + section-tag presence/absence + citation-key assertions.
2. `packages/core/test/compiler-front-sections.test.ts` (modify) — bumped real-version assertion.
3. `packages/server/src/compile-routes.test.ts` (modify) — bumped produced-metadata assertion.

### Commands

1. `npm test -- compiler-ideation-golden compiler-golden compiler-front-sections compile-routes`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. `grep -rnE "versionInfo\.(templates|compiler|contract)\.version\)\.toBe|metadata\.versions\)\.toEqual" packages/ --include=*.ts` — the correct narrow surface to prove the version-bump blast radius is fully covered, not just the two known sites.
