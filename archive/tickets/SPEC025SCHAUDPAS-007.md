# SPEC025SCHAUDPAS-007: One deterministic effective POV (resolveEffectivePov + consumers + 2 diagnostics)

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `resolveEffectivePov` module, compiler POV rendering, five validation POV consumers, two new diagnostic codes + readiness combination logic, web POV controls, authority docs, route tests, invariant test, goldens
**Deps**: None

## Problem

Two POV authorities are never synchronized: `proseMode.pov_character` (`global-config.ts:30`, allows `variable`) and `active_working_set.selected_pov` (`generation-brief.ts:25`, no `variable`). The compiler's `renderPovCharacter` (`front.ts:232`) renders only the global value — so the literal string `variable` can reach the prose writer — while POV-knowledge/reveal lanes (`front.ts:339`) use `selected_pov`. A valid snapshot can tell the writer `POV: variable` while building knowledge from a specific person, threatening §29.6. This ticket adds one pure resolver, drives every POV consumer through it, and makes literal `variable` impossible in a ready prompt.

## Assumption Reassessment (2026-06-20)

1. `proseMode.pov_character` is `recordId | "omniscient" | "variable"` (`global-config.ts:30`); `selected_pov` is `recordId | "omniscient"` optional (`generation-brief.ts:25`). Compiler POV functions live in `front.ts`: `renderPovCharacter:232` (global only), `selectedPov:339` (selected only), `renderPovKnows:347` / `renderPovBeliefs:373` / `renderPovDoesNotKnow:385`. `resolveEffectivePov` does **not** yet exist (new). Confirmed by grep.
2. `docs/story-record-schema.md` §§2.3 and 3.1 are the authorities; §3.1 carries the **erroneous** claim that `selected_pov` may be `variable` (`docs/story-record-schema.md:137`), contradicting the correct `selected_pov: entity_id | omniscient` at `:115`. The `variable`-renders-as-literal claim appears at **both** `docs/compiler-contract.md:172` (placeholder row) **and** `:383` (id-resolution paragraph). `proseMode.pov_character` legitimately keeps `variable` (`:70`).
3. Cross-artifact boundary under audit: the new `resolveEffectivePov` resolver is the single authority that the compiler POV render path, the five validation POV consumers, and the new readiness diagnostics must all route through. This **replaces the existing ad-hoc `selected_pov ?? proseMode.pov_character` coalesce** at five validation sites — `universal-blockers.ts:521`, `universal-completeness.ts:307`, `cast-band.ts:58`, `matrix-voice.ts:200`, `matrix-knowledge.ts:201`.
4. FOUNDATIONS principles motivating this ticket: §15 / §29.6 (POV/reveal — one effective-POV authority, no `variable` to the writer, no secret leak into the wrong mind) and §8 (deterministic compilation — the resolver is pure and total). Restated: every POV/knowledge/reveal/interiority rule resolves the same effective POV; conflicts fail closed; literal `variable` cannot reach a ready prompt.
5. Enforcement-surface check (§8/§15/§29.6): `resolveEffectivePov(snapshot)` is pure, framework-free, total — `pov_character === "variable"` → `selected_pov`; fixed id → that id; `omniscient` → `omniscient`. Its semantics **deliberately differ** from the replaced coalesce (which let `selected_pov` silently win over a fixed `pov_character` and treated `(variable, absent)` as no-POV): the resolver makes a fixed `pov_character` authoritative and converts `(fixed, divergent selected_pov)` and `(variable, absent selected_pov)` into blockers. This **strengthens** the firewall (the writer never sees `variable`; every POV/reveal lane uses the same concrete POV) and stays deterministic. Affected validation tests/goldens are updated to the new blockers, **not** re-blessed.
6. Schema shapes unchanged (no migration): **keep both fields** — `pov_character` stays `recordId | "omniscient" | "variable"`; do **not** add `variable` to `selected_pov` (it is a configuration sentinel, never a concrete generation choice). The change is two **new** diagnostic codes (`DIAGNOSTIC_CODES` in `validation/types.ts:83`, alongside `selectedPovReferenceInvalid:83`) and a new readiness combination rule, not a stored-field change. New codes are **blockers** defined in a rule module (not `warnings.ts`), fitting the one-severity-per-code inventory model (`docs/validation-rule-inventory.md` + `validation-rule-inventory.test.ts`).
7. Blast radius: the coalesce token spans the five validation sites (Files to Touch); the new codes need entries in `validation/types.ts` + `docs/validation-rule-inventory.md`; the `variable`-literal doc claim spans `compiler-contract.md:172,383` and `story-record-schema.md:137`. No stored-field removal, so no migration; server surfaces are route **tests** only. This is one indivisible authority-reconciliation vertical (the resolver + all consumers co-land for typecheck + behavior; a split leaves a broken intermediate).

## Architecture Check

1. One pure resolver consumed everywhere is cleaner than three divergent conventions (global-only compiler display, selected-only knowledge lanes, `selected_pov ?? pov_character` coalesce in validation): it makes effective POV deterministic and single-sourced, eliminates the `POV: variable` leak, and turns two silent ambiguities into actionable blockers. Keeping both fields with distinct roles (sentinel vs concrete selection) avoids inventing a new stored field.
2. No backwards-compatibility aliasing or shims: the coalesce is replaced at every site (none left on the old form); no `variable` is added to `selected_pov`; the two new diagnostics are distinct codes, not an overload of a generic missing-config code.

## Verification Layers

1. `resolveEffectivePov` drives every POV consumer; coalesce gone → codebase grep-proof: `grep -rn "selected_pov ?? " packages/core/src` returns nothing (or only inside the resolver); all five sites import the resolver.
2. Literal `variable` cannot occur in a ready prompt → invariant test: a `variable`-mode snapshot either resolves to a concrete `selected_pov` or blocks; no compiled ready prompt contains `POV: variable`.
3. Readiness combination table fails closed on conflict → unit tests for every row: `(variable, absent)` blocks (`selected-pov-required-for-variable-mode`); `(fixed, divergent)` and `(omniscient, concrete id)` block (`selected-pov-conflicts-with-prose-mode`); valid rows resolve.
4. Two new codes are blockers, one severity each → drift test: `validation-rule-inventory.test.ts` passes with the two codes added to `docs/validation-rule-inventory.md`.
5. Secret firewall + knowledge lanes use effective POV → FOUNDATIONS §15/§29.6 review + matrix-knowledge/voice tests.

## What to Change

### 1. Add the pure resolver

Create `packages/core/src/records/effective-pov.ts` exporting `resolveEffectivePov(snapshot): string | "omniscient" | undefined`: `pov_character === "variable"` → `selected_pov`; fixed id → that id; `omniscient` → `omniscient`. Pure, framework-free (no `node:*`/react/fastify — respects the `@loom/core` boundary).

### 2. Route every POV consumer through it

In `front.ts`, resolve `{pov_character}` display-label from the resolver (so `variable` never renders) and drive `renderPovKnows` / `renderPovBeliefs` / `renderPovDoesNotKnow` from it. Replace the `selected_pov ?? proseMode.pov_character` coalesce with `resolveEffectivePov` at `universal-blockers.ts:521` (secret firewall + dramatic-irony), `universal-completeness.ts:307` (POV-knowledge completeness), `cast-band.ts:58` (referential POV validation), `matrix-voice.ts:200`, and `matrix-knowledge.ts:201`. Route any viewpoint-dependent ideation slot through it too.

### 3. Readiness combination diagnostics

Add `selected-pov-required-for-variable-mode` and `selected-pov-conflicts-with-prose-mode` to `DIAGNOSTIC_CODES` (`validation/types.ts`) and implement the SPEC-025 R6 combination table in the referential POV validation (`cast-band.ts` `validateSelectedPovReference`): `(variable, id|omniscient)` → effective POV; `(variable, absent)` → required blocker; `(fixed, absent|same id)` → effective POV; `(fixed, divergent|omniscient)` → conflict blocker; `(omniscient, absent|omniscient)` → effective POV; `(omniscient, concrete id)` → conflict blocker. Effective non-omniscient id must resolve to a selected ENTITY/CAST MEMBER; never silently choose between conflicting values. (Normalizing away an exactly-matching redundant `selected_pov` is left to an established deterministic pattern; if none exists, accept the duplicate exact match — never resolve a conflict silently.)

### 4. Web + docs + invariant test

In the web POV controls (`StoryConfigEditor.tsx` for `pov_character`, `GenerationBriefView.tsx` for `selected_pov`): when variable, mark `selected_pov` readiness-required; when fixed, hide/disable the selector (show the fixed value) or allow only the matching value; show actionable conflict blockers; preview shows the resolved label, never `variable`. UI does not alter storage. Update `docs/story-record-schema.md` §§2.3 and 3.1 (delete the erroneous `selected_pov` `variable` claim at `:137`; distinguish sentinel from concrete selection), `docs/compiler-contract.md` at **both** `:172` and `:383` (`{pov_character}` maps to effective POV; `variable` never renders — surgically drop `variable`, retain `omniscient` as a literal), `docs/prompt-template-rationale.md`, and `docs/validation-rule-inventory.md` (two diagnostics; all rules use effective POV). Add the invariant test that `POV: variable` cannot occur in a ready prompt; regenerate goldens only if the resolver changes the demo's compiled POV display (otherwise assert byte-identical).

## Files to Touch

- `packages/core/src/records/effective-pov.ts` (new)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/src/validation/rules/cast-band.ts` (modify)
- `packages/core/src/validation/rules/matrix-voice.ts` (modify)
- `packages/core/src/validation/rules/matrix-knowledge.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `packages/web/src/config/StoryConfigEditor.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)

## Out of Scope

- Adding `variable` to `selected_pov` (rejected — it is a sentinel) or any stored-field migration (both fields kept).
- The four field removals — separate tickets.
- The retired-key capstone (ticket 008). Overloading a generic missing-config code (rejected — two distinct codes required).

## Acceptance Criteria

### Tests That Must Pass

1. A new `effective-pov` unit test — the resolver returns the correct effective POV for every `(pov_character, selected_pov)` combination; conflicts/variable-absent return the blocker-driving states.
2. A new invariant test — no ready compiled prompt contains `POV: variable`.
3. `npm test -- validation-rule-inventory` — the two new blocker codes pass the one-severity-per-code drift test.
4. Server route tests for every combination — compile/send is blocked on conflict and on variable-mode missing selection.
5. `npm run lint && npm run typecheck && npm test` — full pipeline green (incl. the `@loom/core` import-boundary check on the new module).

### Invariants

1. Every POV/knowledge/reveal/interiority rule and the compiler `{pov_character}` display resolve through `resolveEffectivePov`; the `selected_pov ?? pov_character` coalesce exists nowhere outside the resolver.
2. Literal `variable` never reaches a ready compiled prompt; POV conflicts fail closed; warnings never gate.

## Test Plan

### New/Modified Tests

1. `packages/core/test/` — new `effective-pov` resolver unit test (all combinations).
2. `packages/core/test/compiler-front-sections.test.ts` / a new invariant test — no `POV: variable` in a ready prompt; POV lanes use effective POV.
3. `packages/core/test/validation-matrix-knowledge.test.ts`, `validation-matrix-voice.test.ts`, completeness/cast-band tests — updated to the resolver + the two new blockers (not re-blessed).
4. `packages/server/src/validation-routes.test.ts` / `compile-routes.test.ts` — every combination-table row; compile blocked on conflict.
5. `packages/web/src/config/StoryConfigEditor.test.tsx`, `generation-brief/GenerationBriefView.test.tsx` — selector behavior + resolved-label preview.

### Commands

1. `npm test -- effective-pov validation-rule-inventory validation-matrix-knowledge compiler-front-sections`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted suites prove the resolver, the diagnostics, and the no-`variable` invariant; the full pipeline is the correct final boundary because the change spans the compiler, five validators, the diagnostic inventory, web, and route tests.

## Outcome

Completed: 2026-06-20

Added `resolveEffectivePov` as the pure core resolver and routed the compiler front/tail POV rendering plus all five validation POV consumers through it. Literal `variable` no longer renders in ready prompts; fixed PROSE MODE values are authoritative; variable mode requires a concrete generation `selected_pov`; and divergent fixed/selected POV combinations fail closed.

Added blocker diagnostics `selected-pov-required-for-variable-mode` and `selected-pov-conflicts-with-prose-mode`, documented them in the validation inventory, and updated schema/compiler/rationale docs to distinguish the PROSE MODE `variable` sentinel from concrete selected POV values.

Updated Generation Brief POV controls to show the resolved effective POV, require selection for variable mode, and constrain the selector when PROSE MODE is fixed. Added route coverage proving validation and compile return blockers with no prompt for missing variable POV and fixed/selected conflicts.

Verification:
- `npm test -- GenerationBriefView validation-routes compile-routes effective-pov validation-cast-band validation-rule-inventory compiler-front-sections`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite chunk-size warning)
- `git diff --check`
- Grep: no `selected_pov ??` coalesce remains; `POV: variable` appears only in the invariant assertion and docs saying it never renders.

Browser smoke: not run; this ticket is covered by core resolver/compiler/validator tests, server route tests, and jsdom UI tests.
