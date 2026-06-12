# SPEC021GROIDEPRO-008: Docs — ideation template authority, ACTIVE-DOCS registry + version note, user-guide

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — new `docs/ideation-prompt-template.md` authority doc + its mandatory `docs/ACTIVE-DOCS.md` registry entry, the ACTIVE-DOCS version-note refresh, and a `docs/user-guide.md` workflow addition; no production behavior change
**Deps**: SPEC021GROIDEPRO-003 (ideation template + version bumps to document), SPEC021GROIDEPRO-007 (the full Ideate workflow the user-guide describes)

## Problem

The ideation feature needs its documentation authorities to land coherently once the implementation exists: a new `docs/ideation-prompt-template.md` (the domain authority for the ideation template, the sibling of `docs/prompt-template.md`), its mandatory ACTIVE-DOCS registry entry, the ACTIVE-DOCS version-note refresh to the post-bump values, and a user-guide workflow addition. These are grouped as one trailing docs diff because they must reference final symbols (template text, bumped versions, the shipped UI flow) and ACTIVE-DOCS requires a new `docs/` file to be registered in the same change that creates it.

## Assumption Reassessment (2026-06-12)

1. **Targets confirmed.** `docs/ideation-prompt-template.md` does not exist (clean new path). `docs/ACTIVE-DOCS.md` carries the doc registry table and, at line 156, the version note "template is `1.0.0`, compiler is `1.2.0`, and compiler contract is `1.2.0`" — the contract value is already stale vs `version.ts` (`1.3.0`), and 003 bumps all three to `1.1.0`/`1.3.0`/`1.4.0`. `docs/user-guide.md` exists.
2. **§8 routing already handled.** `docs/compiler-contract.md`'s ideation mapping is **not** in this ticket — it co-lands with the compiler change in 003 (§8 same-change rule). This ticket owns the *new authority doc* and the *registry/version/user-guide* surfaces only.
3. **Cross-artifact boundary under audit:** ACTIVE-DOCS is the authority registry — its rule "Every active `docs/*.md` file must appear in the registry … A new file under `docs/` must be added to this registry in the same change" binds: `ideation-prompt-template.md` and its registry row land together here. The version note must match `version.ts` post-003.
4. **FOUNDATIONS principle restated (ACTIVE-DOCS registry contract + §8 drift rule):** docs must not drift from the implementation they document — the new authority doc describes the *as-shipped* ideation template (003), the version note matches the *as-shipped* `version.ts` (003), and the user-guide describes the *as-shipped* pull-based, quarantined, no-insertion workflow (006/007). Restating these before writing prevents documenting an intended-but-changed design.

## Architecture Check

1. One trailing docs ticket is cleaner than co-locating each doc edit with its implementing ticket here: the version note needs all three bumped values to exist coherently, the user-guide needs the full UI flow shipped, and ACTIVE-DOCS registration must be atomic with the new doc — a staleness window would otherwise open. (`compiler-contract.md` is the deliberate exception, co-landed in 003 per §8.)
2. No backwards-compatibility shims: additive doc + additive registry row + a value refresh + a new user-guide section; no doc authority is renamed or removed.

## Verification Layers

1. New authority doc exists and is registered → grep-proofs: `docs/ideation-prompt-template.md` present; `docs/ACTIVE-DOCS.md` registry table has a row naming it as the ideation-template domain authority.
2. Version note refreshed to post-bump values → grep-proof that ACTIVE-DOCS line ~156 reads template `1.1.0` / compiler `1.3.0` / contract `1.4.0` and no longer asserts `1.2.0`.
3. User-guide documents the ideation workflow (pull-based, quarantined, copy-only, no insertion) → grep-proof for the new section heading.
4. Docs-implementation coherence → FOUNDATIONS/ACTIVE-DOCS alignment check (manual review that the documented template matches the 003 templates and the documented flow matches 006/007).

## What to Change

### 1. Ideation template authority doc

`docs/ideation-prompt-template.md` (new): the domain authority for the ideation template — its section order (`IDEATION_SECTION_ORDER`), the four ideation sections (role/slots/quality/output-format), the operator taxonomy and deterministic slot/dormancy rules, the citation-key convention, and the question sub-mode. Mirrors the structure/genre of `docs/prompt-template.md`.

### 2. ACTIVE-DOCS registry + version note

`docs/ACTIVE-DOCS.md` (modify): add a registry-table row for `docs/ideation-prompt-template.md` (genre: reference; tier: domain authority for the ideation template) and add it under the prompt/compiler authorities list; refresh the version note (line ~156) to template `1.1.0` / compiler `1.3.0` / contract `1.4.0`.

### 3. User-guide workflow

`docs/user-guide.md` (modify): add an "Ideate — what could happen next?" workflow section: open the Ideate view (pull-based, when stuck), inspect the prompt, generate/regenerate a slate, pin keepers (session-scoped), and copy ideas by hand — ideas are scratch, never inserted into records or the brief.

## Files to Touch

- `docs/ideation-prompt-template.md` (new)
- `docs/ACTIVE-DOCS.md` (modify)
- `docs/user-guide.md` (modify)

## Out of Scope

- `docs/compiler-contract.md` ideation mapping — owned by SPEC021GROIDEPRO-003 (§8 same-change).
- `docs/FOUNDATIONS.md` amendment — `archive/tickets/SPEC021GROIDEPRO-001.md`.
- Any code, test, schema, or UI change — this is a documentation-only diff.
- `docs/validation-rule-inventory.md` ideation column — SPEC021GROIDEPRO-004.

## Acceptance Criteria

### Tests That Must Pass

1. `test -f docs/ideation-prompt-template.md` succeeds, and `grep -c "ideation-prompt-template.md" docs/ACTIVE-DOCS.md` ≥ 1 (registered).
2. `grep -nE "1\.1\.0.*1\.3\.0.*1\.4\.0" docs/ACTIVE-DOCS.md` matches the refreshed version note; `grep -n "compiler contract is .1\.2\.0" docs/ACTIVE-DOCS.md` returns nothing (stale value gone).
3. `npm run lint && npm run build` pass (docs-only; full pipeline unaffected).

### Invariants

1. Every active `docs/*.md` file — including the new ideation template authority — appears in the ACTIVE-DOCS registry (the registry's completeness rule holds).
2. Documented versions, template, and workflow match the as-shipped implementation (003 / 006 / 007); no documented-but-unbuilt behavior.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based grep-proofs and the existing pipeline coverage named in Assumption Reassessment (003's golden/version tests, 006/007's component tests) exercises the behavior these docs describe.`

### Commands

1. `test -f docs/ideation-prompt-template.md && grep -n "ideation-prompt-template.md" docs/ACTIVE-DOCS.md`
2. `grep -nE "template.*1\.1\.0|compiler.*1\.3\.0|contract.*1\.4\.0" docs/ACTIVE-DOCS.md && ! grep -q "compiler contract is .1\.2\.0" docs/ACTIVE-DOCS.md`
3. `npm run lint && npm run build` — the correct boundary for a docs-only change (no test runtime touched).
