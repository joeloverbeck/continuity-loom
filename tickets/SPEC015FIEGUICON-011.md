# SPEC015FIEGUICON-011: Capstone — global coverage gate, doctrine regression, and accessibility suite

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new verification surfaces (global coverage gate, doctrine-regression suite, FieldHelp accessibility suite); no production behavior change.
**Deps**: SPEC015FIEGUICON-004, SPEC015FIEGUICON-005, SPEC015FIEGUICON-006, SPEC015FIEGUICON-009, SPEC015FIEGUICON-010

## Problem

SPEC-015's completion is defined by its coverage rules (§11), testing requirements (§16), accessibility requirements (§13), and acceptance criteria (§18) — there is no separate "§Verification" section; these are the verification carrier. This capstone exercises the fully assembled guidance system end-to-end: it proves every field across all four surfaces has guidance, that no guidance copy can leak into a prompt or imply prose-as-canon/plot-rails, and that the accessibility contract holds in integration. It introduces no new production logic; it gates the pipeline the prior tickets composed.

## Assumption Reassessment (2026-06-07)

1. All enumeration and assembly surfaces exist once content lands: `storyConfigFieldPaths`/`generationBriefFieldPaths` (SPEC015FIEGUICON-003), `recordEditorDescriptors` (existing core), `castMemberSectionModel()` + `emphasisFieldPaths` (existing core), and `GUIDANCE_REGISTRY`/`getFieldGuidance`/`validatePromptDestinations` (SPEC015FIEGUICON-002) populated by SPEC015FIEGUICON-004/005/006. The deterministic compiler (`packages/core/src/compiler/compile-prompt.ts`) does not import `field-guidance*` (to be asserted by grep-proof). Web a11y harness is vitest + `@testing-library/react`.
2. The gate's content is `specs/SPEC-015-…md` §11 (coverage rules 1–12), §16.1 (core coverage tests), §16.3 (doctrine regression), §13 (accessibility), §18 (acceptance criteria), §19.8–§19.9.
3. **Cross-artifact ticket — shared boundary under audit**: this gate re-runs the per-surface checks against the *fully assembled* catalog (core) and against the integrated `FieldHelp` (web); it is the authoritative full-batch verification that the per-ticket scoped tests back-stop. Each invariant maps to its own proof surface (see Verification Layers) — coverage to core enumeration, prompt-exclusion to a compiler grep-proof + fixture compile, accessibility to the web suite.
4. **FOUNDATIONS §10 / §29.4 (no help in prompts), §29.1 / §28.1 (no prose-as-canon, no plot-rails), §15 / §29.6 (no secret-leak language) — restated before trusting the spec narrative**: the catalog must never become a prompt source or a second canon archive. The doctrine-regression suite is the enforcement surface for these principles applied to guidance copy.
5. **Enforcement surface named (HARD-fail-style gate)**: the doctrine-regression + prompt-exclusion tests are the fail-closed gate for guidance copy — a forbidden phrase or a guidance string appearing in a compiled prompt fails the build. This strengthens, and does not weaken, the secret firewall (§15) or deterministic compilation (§8): the compiler path is unchanged and asserted free of any `field-guidance` import.

## Architecture Check

1. A single trailing capstone that enumerates every surface from its source-of-truth (descriptors/schemas/section model) re-derives expected coverage at test time rather than hardcoding counts that go stale, and concentrates the cross-surface doctrine/accessibility gates in one reviewable diff. It introduces no production logic — it exercises the catalog and component the prior tickets built.
2. No backwards-compatibility shim: net-new test surfaces; the capstone modifies no production file.

## Verification Layers

1. Full-surface coverage → core test (`field-guidance-coverage.test.ts`) enumerating `storyConfigFieldPaths()` ∪ `generationBriefFieldPaths()` ∪ every `recordEditorDescriptors` path ∪ `castMemberSectionModel()` fields/emphasis paths, asserting `getFieldGuidance` is defined for each and no path carries a numeric index (§11 r1–4,12).
2. Catalog-wide prompt-destination validity + high-implication enum guidance → core test over `GUIDANCE_REGISTRY` (§11 r5–6).
3. No guidance copy in a prompt → core grep-proof that `compile-prompt.ts`/compiler modules do not import `field-guidance*`, plus a fixture compile asserting no `GUIDANCE_REGISTRY` `short`/`details` string appears in the compiled output (§10, §11 r8, §18.11).
4. Doctrine regression → core test (`field-guidance-doctrine.test.ts`) asserting `promptFacing:"never"` entries carry no prompt-sent wording and no copy implies accepted-prose paste/mine/canon, LLM-infers-canon, plot beats/acts/branches/drama-manager, or directive-overrides-canon (§11 r7–10, §16.3).
5. Accessibility in integration → web suite (`FieldHelp.a11y.test.tsx`) covering keyboard open, Escape dismissal, touch/click open, focus behavior, and screen-reader associations (§13, §19.8).

## What to Change

### 1. New `packages/core/test/field-guidance-coverage.test.ts`

- The global coverage gate (Verification Layers 1–2): enumerate all four surfaces from their sources and assert complete guidance coverage, valid prompt destinations, no numeric-index paths, and enum guidance for every high-implication enum.

### 2. New `packages/core/test/field-guidance-doctrine.test.ts`

- The doctrine-regression + prompt-exclusion suite (Verification Layers 3–4): forbidden-phrase scans over all guidance copy, the compiler-import grep-proof, and the fixture-compile guidance-string-absence assertion.

### 3. New `packages/web/src/field-help/FieldHelp.a11y.test.tsx`

- The accessibility suite (Verification Layer 5) exercising the integrated `FieldHelp` keyboard/touch/Escape/focus/ARIA behavior.

## Files to Touch

- `packages/core/test/field-guidance-coverage.test.ts` (new)
- `packages/core/test/field-guidance-doctrine.test.ts` (new)
- `packages/web/src/field-help/FieldHelp.a11y.test.tsx` (new)

## Out of Scope

- Any production-logic change (the capstone exercises, it does not modify, upstream surfaces).
- Authoring or editing guidance content (SPEC015FIEGUICON-004/005/006).
- Expanding `GenerationBriefView` to render the full schema (§7.2 non-goal) — coverage is asserted against the catalog, not the brief UI.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- field-guidance-coverage` (vitest, `@loom/core`) — every field path across story config, generation brief (full schema), records (nested/list), and cast sections (incl. emphasis paths) resolves to a guidance entry; all prompt destinations valid; no numeric-index path.
2. `npm test -- field-guidance-doctrine` — forbidden-phrase regression passes; the compiler imports no `field-guidance*` module and no guidance string appears in a compiled fixture prompt.
3. `npm test -- FieldHelp` (a11y suite) passes; `npm test && npm run typecheck && npm run lint` pass across the repo (full-pipeline gate).

### Invariants

1. No field on any covered surface lacks guidance; the catalog is never a prompt source or a second canon archive.
2. No guidance copy implies prose-as-canon, LLM-inferred canon, plot-rail machinery, or directive-overrides-canon; the help interaction is fully keyboard/touch/screen-reader accessible.

## Test Plan

### New/Modified Tests

1. `packages/core/test/field-guidance-coverage.test.ts` — global coverage + destination + enum gate.
2. `packages/core/test/field-guidance-doctrine.test.ts` — doctrine regression + prompt-exclusion.
3. `packages/web/src/field-help/FieldHelp.a11y.test.tsx` — integrated accessibility suite.

### Commands

1. `npm test -- field-guidance-coverage field-guidance-doctrine`
2. `npm test -- FieldHelp`
3. `npm test && npm run typecheck && npm run lint` — full-pipeline acceptance gate (the correct boundary because the capstone asserts cross-package, end-to-end completeness).
