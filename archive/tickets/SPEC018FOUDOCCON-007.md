# SPEC018FOUDOCCON-007: Cross-reference sync, SPEC-018 verification capstone, and spec archival

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/archival-workflow.md` cross-reference updates; SPEC-018 status flip + archival move; no production behavior change
**Deps**: `archive/tickets/SPEC018FOUDOCCON-003.md`, `archive/tickets/SPEC018FOUDOCCON-005.md`, `archive/tickets/SPEC018FOUDOCCON-006.md` (leaf set — 006 transitively covers 004→002→001; 003 and 005 cover 002→001). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D10 + §Verification + completion bookkeeping).

## Problem

Once the SPEC-018 docs land, the repo's entry points must reference them or agents won't find them: `CLAUDE.md`'s governing-docs table and `AGENTS.md`'s governing-docs bullet list don't name the two new docs, `README.md`'s active-docs pointers may warrant additions, and `docs/archival-workflow.md`'s canonical-active-docs enumeration must protect the new inventory doc (and already omits `docs/ACTIVE-DOCS.md` and itself). The spec's §Verification must then be exercised end-to-end, and the completed spec archived per `docs/archival-workflow.md`.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `CLAUDE.md` has a `| Touching… | Read |` table (line ~42) with a validation/stress row naming `stress-suite.md`/`stress-coverage-matrix.md`/`demo-blocker-recipes.md`; `AGENTS.md` carries the same map as a **bullet list** (lines ~42–46), not a table; `README.md` lists `docs/user-guide.md`, `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md` (lines 19–21); `docs/archival-workflow.md`'s do-not-archive protection is a **prose sentence** in paragraph 2 (no structured list) enumerating canonical docs — currently omitting `docs/ACTIVE-DOCS.md` and `docs/archival-workflow.md` itself.
2. Per the reassessed SPEC-018 D10: add `docs/validation-rule-inventory.md` to the validation/stress row (CLAUDE.md) and bullet (AGENTS.md); add `docs/narrative-theory-blocker-roadmap.md` as a non-binding research reference; extend the archival-workflow enumeration with the inventory doc AND fix its pre-existing omissions (`ACTIVE-DOCS.md`, `archival-workflow.md` itself) in the same edit; note the asymmetry that the roadmap doc (D8) MAY be archived if ever superseded. The ACTIVE-DOCS registry rows for both new docs were added by 003/004 — verify presence, do not duplicate.
3. Cross-artifact boundary under audit: this ticket exercises the contract every prior ticket composed — the spec's §Verification checks 1–8 are this ticket's acceptance runbook. The archival boundary follows `docs/archival-workflow.md`: flip Status to COMPLETED, add an Outcome section (completion date, what changed, deviations, verification results), `git mv specs/SPEC-018-foundational-docs-consolidation-and-hardening.md archive/specs/`, then correct any active-doc reference to the old path.
4. FOUNDATIONS principle restated before trusting the spec narrative: §20 human gatekeeping / no silent retcon — the spec's Outcome section makes the landed work explicit before archival; nothing is retconned. §29 — the whole batch is docs + one regression test; re-confirm at capstone time that no runtime, schema, storage, compiler, prompt, or validation behavior changed (`git diff` against the pre-batch base shows no `packages/*/src` changes except none).
5. Adjacent contradictions classified: the archival-workflow enumeration omissions (`ACTIVE-DOCS.md`, itself) are pre-existing drift adopted into this ticket's scope by the reassessed D10 (required consequence, not separate cleanup).
6. Mismatch + correction: none — all four entry-point files and their structures re-verified this session.

## Architecture Check

1. One trailing ticket merging cross-reference sync + verification capstone + archival bookkeeping is cleaner than three: all three are gated on the same upstream leaf set, the docs sync cites surfaces only as aggregate pointers (no individually-staleable symbols), and the spec's §Verification is grep/command-based — there is no separate CI artifact to justify a standalone capstone (the one real test landed with 003).
2. No backwards-compatibility aliasing/shims introduced — references point at the new docs directly; the archived spec is moved, not duplicated.

## Verification Layers

1. Spec §Verification checks 1–7 hold end-to-end → command runbook below (each check is a copy-paste command).
2. §Verification check 8 (D9 wording matches sign-off) → manual review (diff `docs/FOUNDATIONS.md` §1.1/§28.8 against the wording signed off on `archive/tickets/SPEC018FOUDOCCON-001.md`).
3. Cross-references resolve → codebase grep-proof (every `docs/`-internal path in active docs, `CLAUDE.md`, `AGENTS.md`, `README.md` exists on disk).
4. Archival boundary correct → codebase grep-proof (`test ! -f specs/SPEC-018-…md && test -f archive/specs/SPEC-018-…md`; no active doc references the old `specs/` path).

## What to Change

### 1. `CLAUDE.md` — governing-docs table

Add `docs/validation-rule-inventory.md` to the validation/stress row; add `docs/narrative-theory-blocker-roadmap.md` as a non-binding research reference row (or a note in the appropriate row).

### 2. `AGENTS.md` — governing-docs bullet list

Same two additions, in the list's existing bullet idiom.

### 3. `README.md` — active-doc pointers

Add pointers for the new docs if they fit the existing three-pointer pattern (user-guide / active-docs-map / foundations); at minimum ensure the active-docs-map pointer suffices and no README claim is stale.

### 4. `docs/archival-workflow.md` — canonical-active-docs enumeration

In the paragraph-2 prose sentence: add `docs/validation-rule-inventory.md`, plus the pre-existing omissions `docs/ACTIVE-DOCS.md` and `docs/archival-workflow.md` itself. Note the asymmetry: `docs/narrative-theory-blocker-roadmap.md` is deliberately NOT added — it may be archived if ever superseded.

### 5. Run the SPEC-018 §Verification runbook (acceptance criteria below)

### 6. Archive SPEC-018

Per `docs/archival-workflow.md`: flip `**Status:** DRAFT` to `**Status**: COMPLETED`; append an Outcome section (completion date, landed changes by ticket, deviations, verification results from item 5); `git mv specs/SPEC-018-foundational-docs-consolidation-and-hardening.md archive/specs/`; fix any active reference to the old path.

## Files to Touch

- `CLAUDE.md` (modify)
- `AGENTS.md` (modify)
- `README.md` (modify)
- `docs/archival-workflow.md` (modify)
- `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (modify + `git mv` to `archive/specs/`)

## Out of Scope

- Any change to the docs the upstream tickets created/edited (this ticket only references them; defects found by the runbook route back to the owning ticket).
- Creating an ADR log or restamping `archive/specs/` (spec-rejected).
- Lint-enforcing headers (spec open question, deferred).
- `git commit` — the user reviews and commits.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint && npm run typecheck && npm test` — all pass (spec §V1; includes the 003 drift test, spec §V5).
2. Registry completeness (spec §V2): every file from `ls docs/*.md` (13 post-batch) appears in the ACTIVE-DOCS registry table.
3. Version accuracy (spec §V3): versions in `docs/ACTIVE-DOCS.md` and `docs/compiler-contract.md` match `packages/core/src/version.ts` (`1.0.0`/`1.2.0`/`1.2.0`).
4. Matrix completeness (spec §V4): the Case-loop grep from `archive/tickets/SPEC018FOUDOCCON-006.md` prints nothing; `grep -c "predates Cases 27" docs/stress-coverage-matrix.md` returns 0.
5. Snapshot claims gone (spec §V6): `grep -ci "currently no active" docs/ACTIVE-DOCS.md` returns 0.
6. Cross-references resolve (spec §V7): every `docs/`-internal path mentioned in active docs, `CLAUDE.md`, `AGENTS.md`, `README.md` exists on disk (script the extraction with grep -oE on `docs/[a-z-]+\.md` + `test -f` loop).
7. D9 wording match (spec §V8): `docs/FOUNDATIONS.md` §1.1/§28.8 text matches the sign-off recorded on `archive/tickets/SPEC018FOUDOCCON-001.md` (manual diff).
8. Archival boundary: `test ! -f specs/SPEC-018-foundational-docs-consolidation-and-hardening.md && test -f archive/specs/SPEC-018-foundational-docs-consolidation-and-hardening.md`.

### Invariants

1. No production code changed across the whole SPEC-018 batch except the 003 drift test (docs + regression armor only).
2. After archival, no active doc references `specs/SPEC-018-…` as an active path.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (the spec's §Verification runbook) and the batch's one test landed with the archived SPEC018FOUDOCCON-003 ticket.`

### Commands

1. `npm run lint && npm run typecheck && npm test`
2. `grep -ci "currently no active" docs/ACTIVE-DOCS.md; for n in $(grep -oE '^## Case [0-9]+' docs/stress-suite.md | grep -oE '[0-9]+'); do grep -q "| Case $n " docs/stress-coverage-matrix.md || echo "MISSING Case $n"; done`
3. The §Verification runbook (Acceptance 1–8) is the correct verification boundary — this ticket IS the spec's verification surface; each check maps to one spec §V item.

## Outcome

Completed: 2026-06-10

What changed:

- Added `docs/validation-rule-inventory.md` and `docs/narrative-theory-blocker-roadmap.md` to `CLAUDE.md`, `AGENTS.md`, and `README.md` where appropriate.
- Updated `docs/archival-workflow.md` to protect `docs/ACTIVE-DOCS.md`, `docs/archival-workflow.md`, and `docs/validation-rule-inventory.md`, while leaving the non-binding roadmap archivable if superseded.
- Ran the SPEC-018 verification runbook and archived the completed spec.

Deviations from original plan:

- Reworded one archival-workflow example so the cross-reference resolver did not treat `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` as a live active-doc path.

Verification results:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 104 test files, 778 tests.
- `npm run build` passed; Vite reported only its large-chunk warning.
- Registry completeness check found 13 `docs/*.md` files and 13 registry rows, with no missing doc rows.
- Version checks confirmed template `1.0.0`, compiler `1.2.0`, compiler contract `1.2.0`, and compiler-contract pin `1.2.0`.
- Matrix completeness loop printed no missing cases; the old "predates Cases 27" disclaimer count was `0`.
- Snapshot-claim grep for "currently no active" returned `0`.
- Cross-reference resolver over active docs, `CLAUDE.md`, `AGENTS.md`, and `README.md` printed no missing `docs/*.md` paths after the archival-workflow example correction.
- D9 heading check found FOUNDATIONS §1.1 and §28.8 in place.
