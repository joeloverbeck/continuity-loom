# SPEC028IDEOPETAX-002: Add EMOTION + ENTITY STATUS citation keys and replace the ideation distinctness instruction

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds ideation citation keys for EMOTION (`sections/pressure.ts`) and ENTITY STATUS (`sections/records-tail.ts`), replaces the `<ideation_quality>` distinctness text constant (`template-constants.ts`), co-lands the matching `docs/ideation-prompt-template.md` + `docs/compiler-contract.md` citation-keys/distinctness sections, and re-baselines the ideation golden; no change to prose-prompt behavior
**Deps**: SPEC028IDEOPETAX-001

## Problem

Two SPEC-028 changes remain after the taxonomy rewrite (ticket 001), both pure ideation prompt-text changes that share the ideation golden and the two authority docs:

1. **Coverage holes** — `EMOTION` and `ENTITY STATUS` render *unkeyed* in the ideation prompt today (`sections/pressure.ts:259-265` `keyedLabel` explicitly excludes EMOTION; `sections/records-tail.ts` `renderEntityStatuses` applies no key), even though SPEC-028 grounds them via `emotion_becomes_action` and `shift_option_set` and slot `grounds:` lines must be able to cite them.
2. **Distinctness rule** — the emitted `<ideation_quality>` text (`template-constants.ts:461-468`, the `IDEATION_SECTION_TEMPLATES.ideation_quality` constant) still carries the old distinctness wording and a stale `reincorporation` mention tied to the removed operator.

This ticket adds the two citation keys at their real render sites, replaces the distinctness instruction (§F) in both the code constant and the docs, and re-baselines the golden once on top of ticket 001's baseline.

## Assumption Reassessment (2026-06-21)

1. **Real render sites (reassess-corrected)** — EMOTION renders at `sections/pressure.ts` `renderRelationshipEmotionPressure` via `keyedLabel` (`:259-265`), which returns the bare label for `record.type === "EMOTION"` (no key); RELATIONSHIP is already keyed there via `keyedText`. ENTITY STATUS renders at `sections/records-tail.ts` `renderEntityStatuses` (`:374`), the ideation `<physical_continuity>` current-state path, with no key applied. `sections/ideation.ts` renders only `<ideation_slots>` and is **not** a key render site (corrects SPEC-028 Deliverable 2's file attribution).
2. **Distinctness emitted text is a code constant** — `IDEATION_SECTION_TEMPLATES.ideation_quality` (`template-constants.ts:461-468`) is the authority for the emitted `<ideation_quality>` body (confirmed by `docs/compiler-contract.md`: "`<ideation_quality>` from a template constant"). The current text (`:467`) and the `reincorporation` mention (`:466`) are the replace targets. `docs/ideation-prompt-template.md:106` and `docs/compiler-contract.md:169` (the unkeyed statement) are the doc co-authorities.
3. **Cross-artifact boundary under audit** — the ideation citation-key one-authoritative-site invariant and the distinctness contract, shared by the render code, the two authority docs (`## Citation Keys`, `<ideation_quality>` rule), and the regenerated golden. The added keys must not duplicate a record into a second section.
4. **FOUNDATIONS principle restated** — §8/§29.4 deterministic compilation: keys are render-site formatting only; identical inputs+versions still produce an identical prompt. §9.1: the ideation assistance output stays non-prose quarantined scratch.
5. **Enforcement surface (test-armoring + render)** — this ticket touches the deterministic-compilation surface. Confirmed the change weakens no firewall and adds no nondeterminism: keys are emitted only when `context.citationKeys` is set, which happens **only** in `renderIdeationPrompt` (`compile-prompt.ts:135-138`); the prose path passes `{}`, so adding EMOTION/ENTITY STATUS keys **cannot leak ideation citation keys into the prose prompt** (preserving `docs/compiler-contract.md`'s "the prose prompt never renders ideation citation keys" and SPEC-028 §Out of Scope "prose unchanged").
6. **Schema extension** — none. `citationKeysFor` (`ideation/citation-keys.ts`) already keys every passed record; this ticket only stops suppressing the key at two render sites. No story-record schema change.
7. **Adjacent contradiction** — the `reincorporation` token in the `ideation_quality` constant (`:466`) is left over from `reincorporate_dormant`. Classified as a **required consequence**: reconcile it with dormancy's new status as a slot-selection modifier (§E) while replacing the distinctness wording.
8. **Mismatch + correction** — none beyond the render-site re-attribution in Assumption 1 (already reflected in Files to Touch). Version triple already bumped in ticket 001; this ticket re-baselines the golden under the same `template 1.3.0 / compiler 1.5.0 / contract 1.6.0` and does **not** re-bump.

## Architecture Check

1. Grouping the two citation keys and the distinctness replacement in one diff is cleaner than three parallel tickets: all three changes re-baseline the same `golden-ideation.prompt.txt` and edit the same two authority docs (`## Citation Keys` / distinctness rule), so separating them would force serialized golden churn and repeated doc touches with no review benefit. They are all "remaining ideation prompt-text changes," reviewable together.
2. No backwards-compatibility aliasing or shims: the EMOTION special-case in `keyedLabel` is removed outright (EMOTION keys like RELATIONSHIP); the old distinctness wording and `reincorporation` mention are replaced, not retained behind a flag.

## Verification Layers

1. EMOTION + ENTITY STATUS each emit exactly one citation key at one authoritative ideation site → `ideation-citation-keys.property.test.ts` (bijection/uniqueness) + `ideation-request-rendering.test.ts` render assertions.
2. Prose prompt renders no ideation citation keys after the change → codebase grep-proof / render assertion that the prose path (`citationKeys` unset) yields unkeyed relationship/emotion + entity-status lines (§8 firewall).
3. Distinctness rule text matches across constant and docs; no stale `reincorporation`/old-operator wording → codebase grep-proof (`IDEATION_SECTION_TEMPLATES.ideation_quality` ↔ `docs/ideation-prompt-template.md:106` ↔ `docs/compiler-contract.md`).
4. Determinism preserved (identical inputs+versions → byte-identical prompt) → `compiler-ideation-golden.test.ts` re-baseline.

## What to Change

### 1. EMOTION citation key (`sections/pressure.ts`)

In `keyedLabel` (`:259-265`), remove the `if (record.type === "EMOTION") return label;` special-case so EMOTION is keyed via `keyedText` like RELATIONSHIP when `options.citationKeys` is present. Confirm the prose path (no `citationKeys`) still renders EMOTION unkeyed.

### 2. ENTITY STATUS citation key (`sections/records-tail.ts`)

In `renderEntityStatuses` (`:374`) / its ideation `<physical_continuity>` caller, apply the citation key from `TailRenderOptions.citationKeys` to each ENTITY STATUS line, ideation-only (keys absent on the prose path). Preserve the one-authoritative-site invariant — no ENTITY STATUS record duplicated into a second section.

### 3. Distinctness instruction (`template-constants.ts`)

Replace the `IDEATION_SECTION_TEMPLATES.ideation_quality` distinctness sentence (`:467`) with the SPEC-028 §F / proposal §2.6 wording (each idea executes its assigned operator and produces one dominant local state transition; no two ideas use the same operator or end in the same dominant change target; wording/actors/keys do not by themselves make ideas distinct; the nine dominant targets enumerated; "who acts"/"which pressure fires" demoted to secondary). Reconcile the `reincorporation` mention (`:466`) with dormancy-as-modifier.

### 4. Authority docs (§8 co-land)

`docs/ideation-prompt-template.md`: replace the `<ideation_quality>` distinctness rule (`:106`); update `## Citation Keys` so EMOTION gets a key at `<relationship_and_emotion_pressure>` and ENTITY STATUS at its authoritative ideation current-state site, removing the "render without keys" statement (`:179`). `docs/compiler-contract.md`: mirror the distinctness rule and replace the EMOTION/ENTITY STATUS "unkeyed" statement (`:169`); keep section order + assistance source profile unchanged.

### 5. Re-baseline golden

Regenerate `golden-ideation.prompt.txt` via `compiler-ideation-golden.test.ts` under the already-bumped version triple.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/ideation-citation-keys.property.test.ts` (modify)
- `packages/core/test/ideation-request-rendering.test.ts` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)

## Out of Scope

- The operator taxonomy, eligibility, minimum bundles, dormancy modifier, and version bump (ticket 001).
- Capstone regression suite + dense-working-set fixture + spec archival + ACTIVE-DOCS note (ticket 003).
- Any prose-prompt rendering, prose template, citation-key syntax, response block schema, or `IDEATION_SECTION_ORDER` change (spec §Out of Scope).
- Re-bumping the version triple (done once in ticket 001).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts` — EMOTION + ENTITY STATUS each emit exactly one key at one site; bijection/uniqueness/permutation-stable hold.
2. `npx vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts` — ideation golden re-baselines; the **prose** golden is byte-for-byte unchanged (no ideation keys leaked).
3. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green.

### Invariants

1. One-authoritative-site: each selected EMOTION/ENTITY STATUS record renders/keys at exactly one ideation section, never duplicated into a second.
2. §8 firewall: the prose prompt renders zero ideation citation keys; keys are emitted only when `context.citationKeys` is set (ideation path only).

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-citation-keys.property.test.ts` — extend key-coverage/uniqueness properties to EMOTION + ENTITY STATUS.
2. `packages/core/test/ideation-request-rendering.test.ts` — assert keyed EMOTION/ENTITY STATUS lines in the ideation prompt and unkeyed in the prose path; assert the new `<ideation_quality>` distinctness text.
3. `packages/core/test/golden-ideation.prompt.txt` + `packages/core/test/compiler-ideation-golden.test.ts` — re-baselined golden.

### Commands

1. `npx vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts packages/core/test/compiler-ideation-golden.test.ts`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. Running `compiler-golden.test.ts` (prose) alongside the ideation golden is the correct boundary to prove the key additions did not leak into the prose prompt.
