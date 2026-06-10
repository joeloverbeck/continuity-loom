# SPEC018FOUDOCCON-002: Harden docs/ACTIVE-DOCS.md into the authority registry

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `docs/ACTIVE-DOCS.md` (authority registry, precedence ladder, snapshot-claim removal, version-claim fix); no production behavior change
**Deps**: SPEC018FOUDOCCON-001 (the precedence ladder must mirror the signed-off §1.1 wording). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D1).

## Problem

`docs/ACTIVE-DOCS.md` is the post-v1 entry map but carries verified drift: a false version claim (the `## Version note` says template/compiler/contract versions "are `1.0.0`" while `packages/core/src/version.ts` holds `templates 1.0.0`, `compiler 1.2.0`, `contract 1.2.0`), and rot-prone snapshot claims ("There are currently no active implementation tickets." / "There are currently no active specs.") that falsify whenever work opens — SPEC-018's own existence already falsifies the second. It also lacks the registry structure (per-doc scope/genre/tier) and the precedence ladder that make it the single authority registry.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `packages/core/src/version.ts` lines 25–37 hold `templates: 1.0.0`, `compiler: 1.2.0`, `contract: 1.2.0`; `docs/ACTIVE-DOCS.md` line ~136 (under `## Version note`, heading at line 134) falsely claims all three "are `1.0.0`"; the snapshot claims sit at lines ~85 and ~95 under `## Active tickets and specs` (heading at line 79). `docs/` currently contains exactly 11 `.md` files.
2. SPEC-018 D1 was reassessed 2026-06-10 (`/reassess-spec`) with all premises re-verified; the registry covers the 11 existing docs — the two new docs (`docs/validation-rule-inventory.md`, `docs/narrative-theory-blocker-roadmap.md`) add their own rows in SPEC018FOUDOCCON-003/-004 per the registry-completeness rule this ticket introduces (deliberate dogfooding, coordinated under SPEC-018 D10).
3. Cross-artifact boundary under audit: the precedence-ladder wording mirrors FOUNDATIONS §1.1 as signed off on SPEC018FOUDOCCON-001 — copy that exact ladder ("this document first, then the domain authority that `docs/ACTIVE-DOCS.md` names for the touched surface, then support docs and guides"), do not paraphrase. If 001's sign-off revised the wording, this ticket inherits the revision.
4. FOUNDATIONS principle restated before trusting the spec narrative: §8 treats drift between authority docs as a continuity bug; this ticket removes drift (false version claim) and adds the registry-completeness same-change rule extending that doctrine to the registry itself. No validation gate, compilation behavior, or record authority is touched.
5. Mismatch + correction: none — all line anchors re-verified this session; treat line numbers as informational and re-locate by heading/text if the file moved since.

## Architecture Check

1. A registry table inside the existing entry-map doc is cleaner than a new registry file: agents already start at `docs/ACTIVE-DOCS.md` (per `CLAUDE.md`/`AGENTS.md`), and a separate registry would create a second authority-location authority. Replacing snapshot claims with directions to check `tickets/` and `specs/` directly removes a class of guaranteed-to-rot statements instead of patching their current values.
2. No backwards-compatibility aliasing/shims introduced — drifted claims are corrected in place, not preserved alongside corrections.

## Verification Layers

1. Version claim matches code → codebase grep-proof (versions in `docs/ACTIVE-DOCS.md` vs `packages/core/src/version.ts` values `1.0.0`/`1.2.0`/`1.2.0`, citing the file as source of truth).
2. No rot-prone snapshot claims remain → codebase grep-proof (`grep -i "currently no active" docs/ACTIVE-DOCS.md` returns nothing).
3. Registry completeness over the 11 existing docs → codebase grep-proof (`ls docs/*.md` filename list vs registry table rows, 11/11).
4. Ladder wording mirrors §1.1 → manual review (exact-string comparison against the post-001 `docs/FOUNDATIONS.md` §1.1 ladder sentence).

## What to Change

### 1. Fix the version claim (`## Version note`)

Reword the false sentence to state: template `1.0.0`, compiler `1.2.0`, contract `1.2.0`, citing `packages/core/src/version.ts` as the source of truth (so a future bump has one authoritative home and this note points at it rather than restating values as standalone facts — keep the pointer framing, listing current values as "as of this writing" alongside the citation).

### 2. Remove snapshot claims (`## Active tickets and specs`)

Replace "There are currently no active implementation tickets." and "There are currently no active specs." (and any similar present-tense emptiness claims in the section) with directions to check `tickets/` and `specs/` directly. Preserve the archived-material pointers in that section.

### 3. Add the authority registry table

One row per `docs/*.md` (all 11 existing files, including `docs/ACTIVE-DOCS.md` itself and `docs/FOUNDATIONS.md`), with columns: doc, scope (one line), genre (`reference` / `explanation` / `how-to` / `audit`), authority tier (`constitutional` / `domain authority for <surface>` / `support`). Place it in or adjacent to the existing `## Authority hierarchy` section (line ~20) — that section already carries tier prose this table makes structural.

### 4. State the precedence ladder

Mirroring the signed-off §1.1 constitutional wording: `FOUNDATIONS.md` → the domain authority named in the registry for the touched surface → support docs and guides.

### 5. Add the registry-completeness rule

A new file under `docs/` must be added to the registry in the same change.

## Files to Touch

- `docs/ACTIVE-DOCS.md` (modify)

## Out of Scope

- The two new docs' registry rows (added by SPEC018FOUDOCCON-003/-004 when those files land).
- Header standardization of `docs/ACTIVE-DOCS.md` per D2 (SPEC018FOUDOCCON-005).
- Any FOUNDATIONS edit (SPEC018FOUDOCCON-001).
- Numbered folder restructuring or file moves under `docs/` (spec-rejected).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "1.2.0" docs/ACTIVE-DOCS.md` — compiler and contract versions stated as `1.2.0` with `packages/core/src/version.ts` cited; `grep -n 'are .1\.0\.0.' docs/ACTIVE-DOCS.md` no longer matches the old collective claim.
2. `grep -ci "currently no active" docs/ACTIVE-DOCS.md` — returns 0.
3. Registry completeness: every filename from `ls docs/*.md` (11 files) appears as a registry table row.
4. `npm run lint && npm run typecheck && npm test` — unaffected (docs-only), all pass.

### Invariants

1. The precedence ladder in this doc is wording-identical to the FOUNDATIONS §1.1 ladder (one canonical formulation, two locations, same sentence).
2. No statement in the doc asserts a point-in-time emptiness/count of `tickets/` or `specs/` — the doc directs readers to the directories instead.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -ci "currently no active" docs/ACTIVE-DOCS.md` (expect `0`) and `ls docs/*.md | wc -l` vs registry row count (expect 11/11)
2. `npm run lint && npm run typecheck && npm test`
3. Grep-proofs are the correct verification boundary: the deliverable is registry/claim content in one doc; the pipeline run only proves no collateral damage.
