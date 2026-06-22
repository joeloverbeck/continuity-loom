# SPEC030RECHYGWOR-005: Trailing docs — ACTIVE-DOCS, user guide, README, stress suite/matrix

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — updates `docs/ACTIVE-DOCS.md`, `docs/user-guide.md`, `README.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`; no production behavior change.
**Deps**: SPEC030RECHYGWOR-004

## Problem

The non-§8 documentation surfaces must reflect the two hygiene scopes once the feature has landed end-to-end: the `docs/ACTIVE-DOCS.md` version note + registry description, the user-facing guidance on when to use working-set scope, and the stress coverage that pins the scope behavior. These are deliberately separated from the §8-bound contract docs (which co-land with their implementing code in -002): they describe usage and regression coverage, not the deterministic prompt contract, so they land once after the implementation tickets to avoid a staleness window.

## Assumption Reassessment (2026-06-22)

1. Current doc surfaces confirmed this session: `docs/ACTIVE-DOCS.md` version note at `:161` (template `1.3.0` / compiler `1.5.0` / contract `1.6.0`, "after the SPEC-028 ideation taxonomy update") and the hygiene-template registry description at `:33` ("Whole-project atomic-record hygiene assistance prompt"); `docs/user-guide.md`, `README.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md` all exist.
2. Specs/docs confirmed: Deliverable 5's ACTIVE-DOCS bullet + the reassess I1 registry-description edit (`specs/SPEC-030-record-hygiene-working-set-scope.md:324-329` post-reassess) and Deliverable 6's user-docs + stress bullets (`:327-336`). The version note's target values (`1.4.0` / `1.6.0` / `1.7.0`) must match `packages/core/src/version.ts` as bumped in -002.
3. Cross-artifact boundary under audit: this is a docs-only ticket; its references must stay true against the post-implementation tree. It cites the feature's user-visible behavior (two scopes) and the bumped version triple — both produced by upstream tickets, so this ticket depends on the implementation leaf (-004) so its grep-proofs resolve against landed surfaces.
4. Adjacent contradiction classification: the ACTIVE-DOCS version note is a *descriptive* surface (not a §8 contract pin); a brief window after -002 where `version.ts` says `1.4.0`/`1.6.0`/`1.7.0` while ACTIVE-DOCS still says the old triple is acceptable drift that this trailing ticket closes — distinct from the compiler-contract version pin (a §8 contract co-landed in -002).

## Architecture Check

1. A single trailing docs ticket for the non-§8 surfaces is cleaner than scattering usage/stress edits across the implementation tickets: the user guide and stress matrix describe the *complete* feature (both scopes, empty-scope behavior, archived-in-scope exclusion), which only exists coherently after -004; landing them together avoids half-described behavior.
2. No backwards-compatibility aliasing/shims: docs are edited in place; no duplicate or deprecated guidance retained.

## Verification Layers

1. ACTIVE-DOCS version note equals the bumped triple and registry description names the scope surface → codebase grep-proof (exact-string match against `docs/ACTIVE-DOCS.md`).
2. User guide + README document both scopes and when to use working-set scope → codebase grep-proof (scope-name strings present).
3. Stress suite + matrix add the scope cases (working-set discloses scope; predicate renders every in-scope record; empty-scope truthful empty state; selected-but-archived/terminal excluded; whole-project unchanged) → codebase grep-proof (case identifiers present in both files).

## What to Change

### 1. `docs/ACTIVE-DOCS.md`

Update the version note (`:161`) to template `1.4.0` / compiler `1.6.0` / contract `1.7.0`, and update the hygiene-template registry description (`:33`) from "Whole-project atomic-record hygiene assistance prompt" to reflect the whole-project-default-plus-working-set-scope surface.

### 2. `docs/user-guide.md` + `README.md`

Document the two hygiene scopes and when to use working-set scope (focus the review on what you're currently working on), noting whole-project remains the way to find duplicates anywhere in the store.

### 3. `docs/stress-suite.md` + `docs/stress-coverage-matrix.md`

Add record-hygiene scope cases: working-set scope discloses the active scope; the predicate renders every in-scope record completely; empty working-set scope → truthful empty state; a working-set-selected-but-archived/terminal record is still excluded; whole-project mode unchanged. Add the matching rows to the coverage matrix tying each case to the compiler/server behavior it pins.

## Files to Touch

- `docs/ACTIVE-DOCS.md` (modify)
- `docs/user-guide.md` (modify)
- `README.md` (modify)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)

## Out of Scope

- The §8-bound contract docs (`docs/compiler-contract.md`, `docs/story-record-hygiene-prompt-template.md`, `docs/story-record-schema.md §9.3`) — co-landed with code in -002.
- Any production code, test, or behavior change — this ticket is docs-only.
- The end-to-end regression gate (SPEC030RECHYGWOR-006).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -F "1.4.0" docs/ACTIVE-DOCS.md && grep -F "1.6.0" docs/ACTIVE-DOCS.md && grep -F "1.7.0" docs/ACTIVE-DOCS.md` — version note shows the bumped triple, and the values match `packages/core/src/version.ts`.
2. `docs/user-guide.md` and `README.md` both contain the working-set-scope guidance; `docs/stress-suite.md` and `docs/stress-coverage-matrix.md` both contain the new scope case identifiers.
3. `npm run lint` passes (doc lint, if configured); no code tests are affected.

### Invariants

1. Every version number this ticket writes matches `packages/core/src/version.ts` (no independent drift).
2. The docs describe behavior that exists in the landed tree (both scopes, empty-scope message, archived-in-scope exclusion) — no documentation-ahead-of-code.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -F "template is \`1.4.0\`" docs/ACTIVE-DOCS.md || grep -F "1.4.0" docs/ACTIVE-DOCS.md` (version-note proof).
2. `npm run lint`
3. A doc-grep boundary is correct because this ticket changes only usage/registry/stress prose; the behavior those docs describe is proved by -002/-003/-004 and exercised end-to-end by -006.
