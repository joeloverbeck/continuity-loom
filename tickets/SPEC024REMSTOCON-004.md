# SPEC024REMSTOCON-004: Cross-package removal verification — repo-wide grep-proofs + full green

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: None — verification-only; runs existing lint/typecheck/test/build plus repo-wide grep sweeps, adds no production or test surface.
**Deps**: SPEC024REMSTOCON-001, SPEC024REMSTOCON-002, SPEC024REMSTOCON-003

## Problem

The spec's §Verification includes cross-package guarantees no single package ticket can assert alone: the `prose_preferences` identifier (and the space-form "prose preferences" residue) must be **fully gone** repo-wide, and the whole monorepo must build, typecheck, lint, and test green once the three package removals land together. This capstone exercises the composed end state; it introduces no production logic.

## Assumption Reassessment (2026-06-19)

1. **Upstream tickets compose the end state:** SPEC024REMSTOCON-001 (core + docs), -002 (server migration), -003 (web) each clear their own `prose_preferences` sites (verified per-package in their own Acceptance). This ticket asserts the union — there is nothing left to remove, only to prove gone.
2. **Verification surfaces confirmed** (grep / package.json, 2026-06-19): the underscore inventory and the 3 space-form sites were enumerated during reassessment; `npm run lint|typecheck|test|build` are real root scripts. The one **intended survivor** of the space-form sweep is `docs/compiler-contract.md:242` ("Story/prose preferences … render in their own placeholders") — accurate via PROSE MODE, retained by design in 001.
3. **Cross-artifact boundary under audit:** the whole-repo token surface (`packages/**`, `docs/**`) for `prose_preferences` and "prose preferences". The grep must run **after `npm run build`** so regenerated `dist/` artifacts are not stale false positives.
4. **FOUNDATIONS alignment (§13 field economy, §8 schema/contract sync):** a clean repo-wide grep is the proof that the duplicate authority path is fully gone and that schema, validation, guidance, demo, UI, stored data, and authority docs are mutually consistent — no residue that would let the dead field reappear as prompt context or a stored key.

## Architecture Check

1. A single trailing verification ticket is the right home for cross-package assertions: each package ticket can only grep its own tree, so the repo-wide "fully gone" proof and the full-monorepo green build belong to one capstone gating all three. It adds no production logic.
2. No backwards-compatibility shim or alias is introduced (verification-only).
3. **Co-landing constraint:** because 001/002/003 land in one revision, this capstone's gates are the revision's merge proof — it does not land separately afterward; it is the revision-level acceptance.

## Verification Layers

1. `prose_preferences` identifier gone repo-wide → grep-proof: after `npm run build`, `grep -rn "prose_preferences" packages docs` (excluding `dist/`) returns nothing.
2. Space-form residue cleared except the intended survivor → grep-proof: `grep -rni "prose preferences" packages docs` (excluding `dist/`) returns only `docs/compiler-contract.md:242`.
3. Whole monorepo is green → `npm run lint && npm run typecheck && npm test && npm run build`.

## What to Change

### 1. Run the cross-package verification (no code change)

This ticket changes no files. The implementer runs, against the post-001/002/003 tree:
- `npm run build` (regenerate `dist/` so grep is not stale), then the two grep sweeps below;
- the full `npm run lint && npm run typecheck && npm test && npm run build` gate.

Record the sweep outputs in the PR/review notes as the removal's completion proof.

## Files to Touch

- None — verification-only (exercises the surfaces SPEC024REMSTOCON-001/-002/-003 modified; does not modify them).

## Out of Scope

- Any production or test code change — all removals live in 001/002/003. If a sweep finds an un-cleared site, fix it in the owning package ticket, not here.
- Archiving the spec to `archive/specs/` (post-merge bookkeeping per `docs/archival-workflow.md`, not a spec deliverable).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build` then `grep -rn "prose_preferences" packages docs | grep -v /dist/` returns no matches.
2. `grep -rni "prose preferences" packages docs | grep -v /dist/` returns only `docs/compiler-contract.md:242`.
3. `npm run lint && npm run typecheck && npm test && npm run build` — all green across all packages.

### Invariants

1. No `prose_preferences` identifier exists anywhere in `packages/` or `docs/` source after the removal.
2. The only surviving "prose preferences" prose is the accurate PROSE-MODE rendering note at `docs/compiler-contract.md:242`.

## Test Plan

### New/Modified Tests

1. None — verification-only ticket; behavioral coverage is the regressions added in SPEC024REMSTOCON-001 (field-path absence) and -002 (legacy-payload migration), plus the existing pipeline suites named above.

### Commands

1. `npm run build && { grep -rn "prose_preferences" packages docs | grep -v /dist/ && echo FAIL || echo OK; }`
2. `grep -rni "prose preferences" packages docs | grep -v /dist/`
3. `npm run lint && npm run typecheck && npm test && npm run build`
