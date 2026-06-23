# SPEC031MULSECREV-002: `ACTIVE-DOCS` version note + multi-secret reveal-constraint stress case

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — updates `docs/ACTIVE-DOCS.md` (registry version note) and `docs/stress-suite.md` / `docs/stress-coverage-matrix.md` (canonical stress set); no production behavior change.
**Deps**: archive/tickets/SPEC031MULSECREV-001.md

## Problem

Two non-§8 trailing-doc surfaces are left after the per-secret label vertical completed in `archive/tickets/SPEC031MULSECREV-001.md`: (1) the `docs/ACTIVE-DOCS.md` version note still records the pre-bump version triple (a descriptive registry note, not a §8-bound contract the compiler reads); (2) the canonical stress set has no multi-secret reveal-constraint case, so the exact regression SPEC-031 fixes — cross-lane correlation breaking with ≥2 active secrets — is not pinned in `docs/stress-suite.md` / `docs/stress-coverage-matrix.md`. Both are intentionally split out of the atomic §8 vertical (per `references/decomposition-patterns.md` §8: ACTIVE-DOCS version notes and non-§8 audit docs belong in the trailing docs ticket).

## Assumption Reassessment (2026-06-23)

<!-- Items 1-3 always required. Items 4+ selected from the menu and renumbered from 4. -->

1. **Target docs (codebase).** `docs/ACTIVE-DOCS.md:161` carries the version note ("after the SPEC-030 record-hygiene working-set scope update, template is `1.4.0`, compiler is `1.6.0`, and compiler contract is `1.7.0`"). `docs/stress-suite.md` is the canonical stress-case authority and `docs/stress-coverage-matrix.md` the case→rule/compiler/regression map (both registered in `docs/ACTIVE-DOCS.md`). None is §8-bound to the compiler, so a brief post-001 staleness window is tolerable and no conformance test enforces ACTIVE-DOCS↔`version.ts` equality (verified: only `compiler-front-sections.test.ts` asserts `versionInfo`, not the ACTIVE-DOCS prose).
2. **Authoritative version triple (spec/docs).** The version note must mirror whatever triple `archive/tickets/SPEC031MULSECREV-001.md` lands in `packages/core/src/version.ts` — `compiler` and `contract` bump unconditionally; `templates` bumps only if 001's normative template text changed. This ticket reads the post-001 `version.ts`, it does not re-decide the bump.
3. **Cross-artifact boundary under audit.** The shared boundary is the ACTIVE-DOCS registry note ↔ `packages/core/src/version.ts` (descriptive mirror) and the stress-suite case ↔ the `<secrets_and_reveal_constraints>` renderer behavior 001 ships. This ticket only describes/records; it adds no executable test and no production code.
4. **FOUNDATIONS principle motivating the stress case (§29.6 / §8).** The multi-secret stress case armors the §29.6 reveal-attribution behavior (each secret's holders/clues/forbidden-reveals unambiguously attributable) and the §8 deterministic rendering that `archive/tickets/SPEC031MULSECREV-001.md` implements; restating it here keeps the stress entry aligned with the regression it guards, not with prose intent.

## Architecture Check

1. Routing the ACTIVE-DOCS version note and the stress-doc case into a trailing ticket (rather than the §8 vertical) keeps 001's diff focused on the atomic compiler↔contract↔template change while landing the descriptive/regression docs once 001's behavior exists — the prescribed split for non-§8 surfaces. The stress case documents the multi-secret scenario rather than duplicating 001's executable golden, so there is one behavioral pin (the golden) and one canonical-scenario record (the stress entry).
2. No backwards-compatibility aliasing or shims: docs are edited in place; no parallel version note or duplicate stress registry is introduced.

## Verification Layers

1. ACTIVE-DOCS version note matches post-001 `version.ts` -> codebase grep-proof (`docs/ACTIVE-DOCS.md` triple == `packages/core/src/version.ts`).
2. Multi-secret case present in the stress set and mapped in the matrix -> codebase grep-proof (`docs/stress-suite.md` + `docs/stress-coverage-matrix.md` carry the new case id and its row).
3. Single-layer rationale: this is a documentation-only ticket; both invariants are grep-checkable doc-state assertions, so no schema/skill-dry-run/test-execution layer applies.

## What to Change

### 1. ACTIVE-DOCS version note

Update `docs/ACTIVE-DOCS.md:161` to record the post-001 version triple (read from `packages/core/src/version.ts`), reframing the note from the SPEC-030 baseline to the SPEC-031 per-secret-label update — e.g. "after the SPEC-031 per-secret reveal-constraint label update, template is `<t>`, compiler is `<c>`, and compiler contract is `<k>`", using whichever of `templates`/`compiler`/`contract` 001 actually bumped.

### 2. Multi-secret reveal-constraint stress case

Add a canonical stress case to `docs/stress-suite.md` covering ≥2 active secrets in `<secrets_and_reveal_constraints>` (the cross-lane correlation scenario), and a corresponding row in `docs/stress-coverage-matrix.md` tying the case to the secrets-rendering compiler behavior and the `archive/tickets/SPEC031MULSECREV-001.md` golden/regression surface. Follow the existing case-id and matrix-row conventions of those docs.

## Files to Touch

- `docs/ACTIVE-DOCS.md` (modify)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)

## Out of Scope

- **The renderer change, version bumps, §8-bound docs (`compiler-contract.md`, prompt templates, rationale), goldens, and code tests** — all owned by `archive/tickets/SPEC031MULSECREV-001.md`. This ticket touches no production code and adds no executable test.
- **No new validation rule or executable stress fixture** — the stress entry is a documented canonical case; the behavioral pin is 001's golden.
- **No re-deciding the version bump** — this ticket mirrors 001's landed `version.ts`, it does not choose the triple.

## Acceptance Criteria

### Tests That Must Pass

1. `grep` proves the `docs/ACTIVE-DOCS.md` version note states the same triple as `packages/core/src/version.ts` after 001.
2. `grep` proves the new multi-secret case id appears in `docs/stress-suite.md` and its mapping row in `docs/stress-coverage-matrix.md`.
3. `npm run lint` passes (no doc-lint/build regression introduced by the edits).

### Invariants

1. The ACTIVE-DOCS version note never contradicts `packages/core/src/version.ts` (descriptive mirror, kept truthful).
2. Every canonical stress case in `docs/stress-suite.md` has a corresponding row in `docs/stress-coverage-matrix.md` (the new case included).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage from archive/tickets/SPEC031MULSECREV-001.md's golden + unit tests is named in Assumption Reassessment.`

### Commands

1. `grep -n "compiler is" docs/ACTIVE-DOCS.md && grep -n "version" packages/core/src/version.ts` — confirm the version note mirrors the source triple.
2. `npm run lint` — full doc/lint gate (narrower than `npm test` because this ticket changes no code or executable test; behavioral regression coverage is owned by 001).

## Outcome

Completed: 2026-06-23

What changed:

- Updated `docs/ACTIVE-DOCS.md` to mirror the post-001 version triple from `packages/core/src/version.ts`: template `1.5.0`, compiler `1.7.0`, contract `1.8.0`.
- Added Case 40, "Multi-secret reveal-constraint correlation," to `docs/stress-suite.md` and updated the suite summary row for POV/audience/secrets separation.
- Added the matching Case 40 row to `docs/stress-coverage-matrix.md`, pointing at the archived 001 ticket and its golden/unit regression surfaces.

Deviations from original plan:

- None. This remained documentation-only and added no executable test or production behavior.
- No browser or localhost smoke was run because no UI, API request shape, or runtime behavior changed in this ticket.

Verification results:

- `grep -n "compiler is" docs/ACTIVE-DOCS.md && grep -n "version" packages/core/src/version.ts` passed and showed the same `1.5.0` / `1.7.0` / `1.8.0` triple.
- `grep -n "Case 40" docs/stress-suite.md docs/stress-coverage-matrix.md` passed.
- `git diff --check -- docs/ACTIVE-DOCS.md docs/stress-suite.md docs/stress-coverage-matrix.md tickets/SPEC031MULSECREV-002.md` passed.
- `npm run lint` passed.
