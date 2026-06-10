# SPEC018FOUDOCCON-005: Standardize doc headers and apply in-place corrections

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — header standardization across 10 active docs plus three in-place corrections (contract-version pin, schema storage-note contextualization, demo-recipes provenance); no production behavior change
**Deps**: `archive/tickets/SPEC018FOUDOCCON-002.md` (headers cite the authority tiers the registry defines). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D2 + D3 + D4 + D6, merged — they edit the same header regions of overlapping files).

## Problem

Active docs carry ad-hoc, drifting headers and three verified in-place defects: `docs/compiler-contract.md` has no contract-version pin (code is at `contract 1.2.0`); `docs/story-record-schema.md` cites `SPEC004RECCRUBAS-002` as if it were an open design option (it is implemented and archived) and its status line ("corrected baseline requirements schema") reads as pre-implementation language; `docs/demo-blocker-recipes.md` claims `Scope: SPEC-013 …` as current scope though SPEC-013 is archived. Headers should uniformly state status/genre/scope and authority tier so the registry (002) has a per-doc mirror.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `docs/compiler-contract.md:1-5` has `Status:`/`Scope:`/`Non-scope:` lines and no version pin; `packages/core/src/version.ts` holds `contract: 1.2.0`, `compiler: 1.2.0`. `docs/story-record-schema.md:124-129` carries the `SPEC004RECCRUBAS-002` storage note with no archived-context marker; the ticket is archived at `archive/tickets/SPEC004RECCRUBAS-002.md` (file exists). `docs/demo-blocker-recipes.md:3-4` reads `Status: active` / `Scope: SPEC-013 demo validation smoke recipes …`; SPEC-013 is archived at `archive/specs/SPEC-013-tame-demo-project-and-stress-coverage.md` (file exists).
2. SPEC-018 D2 (as reassessed 2026-06-10) **exempts `docs/FOUNDATIONS.md`**: its constitutional header stays unchanged; any header change to it is D9a-gated constitutional work. This ticket therefore touches exactly the 10 non-FOUNDATIONS active docs. The two new docs (inventory, roadmap) are created with conforming headers by `archive/tickets/SPEC018FOUDOCCON-003.md` / SPEC018FOUDOCCON-004 and are not touched here.
3. Cross-artifact boundary under audit: each header's `Authority:` line must agree with the doc's tier row in the `docs/ACTIVE-DOCS.md` registry (002) — the registry is canonical; headers mirror it. The D3 version pin must agree with `packages/core/src/version.ts` — the code is canonical; the pin mirrors it with a same-change rule.
4. FOUNDATIONS principle restated before trusting the spec narrative: §8 — drift between template, schema, rationale, and contract is a continuity bug; the D3 pin restates that same-change discipline at the point of use. No validation behavior, prompt compilation, or record semantics change; `docs/demo-blocker-recipes.md` stays active (spec-confirmed: keep, do not archive).
5. Adjacent contradictions classified: the existing `Purpose:`/`Non-scope:` header lines in `docs/compiler-contract.md` and `docs/story-record-schema.md` are not part of the two-line standard; keep any still-accurate content by folding it into the scope one-liner or the doc body rather than deleting information (required consequence of D2's "replacing/normalizing" instruction, applied conservatively).
6. Mismatch + correction: none — all line anchors re-verified this session; re-locate by text if lines shifted.

## Architecture Check

1. One ticket for headers + the three header-adjacent corrections is cleaner than four tickets editing the same lines of the same files (D4's status-line refresh is literally "per D2"); the merge eliminates intra-batch merge conflicts on identical regions while remaining one reviewable docs diff.
2. No backwards-compatibility aliasing/shims introduced — old ad-hoc header forms are replaced, not kept alongside the new form; no `last-reviewed` dates (they rot).

## Verification Layers

1. Header uniformity across the 10 docs → codebase grep-proof (`grep -l "^Status: active" docs/*.md` plus per-file `Authority:` line check; FOUNDATIONS excluded).
2. Contract pin matches code → codebase grep-proof (`grep -n "1.2.0" docs/compiler-contract.md` vs `packages/core/src/version.ts` `contract.version`).
3. Archived references read as historical provenance → manual review (`SPEC004RECCRUBAS-002` note names `archive/tickets/…`; demo-recipes scope names `archive/specs/SPEC-013-…`).
4. Headers agree with registry tiers → manual review against the `docs/ACTIVE-DOCS.md` registry table (002).

## What to Change

### 1. D2 — Uniform two-line header on the 10 non-FOUNDATIONS active docs

For `ACTIVE-DOCS.md`, `archival-workflow.md`, `compiler-contract.md`, `demo-blocker-recipes.md`, `prompt-template.md`, `prompt-template-rationale.md`, `story-record-schema.md`, `stress-coverage-matrix.md`, `stress-suite.md`, `user-guide.md`:

```
Status: active <genre> — <one-line scope>
Authority: <constitutional | domain authority for <surface> | support> (see docs/ACTIVE-DOCS.md)
```

Replace/normalize the existing ad-hoc `Status:`/`Scope:` lines; no `last-reviewed` dates. Genre and tier values come from the registry rows (002). Content edits beyond headers are limited to items 2–4 below.

### 2. D3 — Pin the contract version in `docs/compiler-contract.md`

Add to the header region: documented contract version `1.2.0`, with the same-change rule — any change that bumps `contract.version` or `compiler.version` in `packages/core/src/version.ts` must update this pin in the same revision (restating FOUNDATIONS §8 drift doctrine at the point of use).

### 3. D4 — Contextualize the archived reference in `docs/story-record-schema.md`

Rework the storage note (lines ~124–129) so `SPEC004RECCRUBAS-002` reads as historical provenance — "implemented as designed; ticket archived at `archive/tickets/SPEC004RECCRUBAS-002.md`" — rather than an open design option. Refresh the status line per the D2 header (the "corrected baseline requirements schema" phrasing reads as pre-implementation language).

### 4. D6 — Correct `docs/demo-blocker-recipes.md` provenance

Keep `Status: active`. Reword the scope line so SPEC-013 reads as archived provenance, not current scope: the recipes remain live smoke checks against the existing demo fixture ("The Letter Under the Flour Bin"); their originating spec is archived at `archive/specs/SPEC-013-tame-demo-project-and-stress-coverage.md`.

## Files to Touch

- `docs/ACTIVE-DOCS.md` (modify)
- `docs/archival-workflow.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/demo-blocker-recipes.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)
- `docs/stress-suite.md` (modify)
- `docs/user-guide.md` (modify)

## Out of Scope

- `docs/FOUNDATIONS.md` (header explicitly exempt; constitutional work is D9a-gated — `archive/tickets/SPEC018FOUDOCCON-001.md`).
- The two new docs' headers (created conforming in `archive/tickets/SPEC018FOUDOCCON-003.md` / SPEC018FOUDOCCON-004).
- Stress-matrix body backfill (SPEC018FOUDOCCON-006 — this ticket touches only the headers of those two files).
- Archiving `docs/demo-blocker-recipes.md` (spec-rejected; it stays active).
- Lint-enforcing the header format (spec open question, deferred).
- Content rewrites of `prompt-template.md`, `prompt-template-rationale.md`, `user-guide.md`, `archival-workflow.md` beyond the header lines (verified accurate by the spec audit).

## Acceptance Criteria

### Tests That Must Pass

1. All 10 listed docs have the two-line header (`Status: active …` + `Authority: … (see docs/ACTIVE-DOCS.md)`); `docs/FOUNDATIONS.md` is unchanged by this ticket (`git diff --stat` shows no FOUNDATIONS hunk).
2. `grep -n "1.2.0" docs/compiler-contract.md` — pin present with the same-change rule; value matches `packages/core/src/version.ts`.
3. `grep -n "archive/tickets/SPEC004RECCRUBAS-002.md" docs/story-record-schema.md` and `grep -n "archive/specs/SPEC-013" docs/demo-blocker-recipes.md` — both archived references contextualized with resolving paths.
4. `npm run lint && npm run typecheck && npm test` — unaffected (docs-only), all pass.

### Invariants

1. No `last-reviewed`/date line appears in any standardized header.
2. Every `Authority:` line agrees with the doc's tier in the ACTIVE-DOCS registry; no header invents a tier the registry does not assign.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `for f in docs/*.md; do [ "$f" = "docs/FOUNDATIONS.md" ] && continue; grep -L "see docs/ACTIVE-DOCS.md" "$f"; done` (expect no output once 003/004 docs also exist; before then, expect only the not-yet-created docs)
2. `npm run lint && npm run typecheck && npm test`
3. Per-file grep-proofs are the correct verification boundary: the deliverable is header/provenance text; the pipeline run only proves no collateral damage.
