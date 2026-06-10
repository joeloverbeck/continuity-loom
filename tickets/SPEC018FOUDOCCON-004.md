# SPEC018FOUDOCCON-004: Create docs/narrative-theory-blocker-roadmap.md (non-binding)

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new doc `docs/narrative-theory-blocker-roadmap.md`, one registry row in `docs/ACTIVE-DOCS.md`; no production behavior change
**Deps**: SPEC018FOUDOCCON-002 (the ACTIVE-DOCS registry must exist to receive this doc's row). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D8).

## Problem

SPEC-018's research pass identified theory-grounded candidates for future deterministic blockers (causal-network, focalization, scene–sequel, plant/payoff, and continuity-practice traditions), but they are recorded nowhere. Without a non-binding home, the research either evaporates or gets smuggled into feature work without FOUNDATIONS §29 screening. The roadmap captures candidates as research, explicitly not as backlog or validation authority.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `docs/narrative-theory-blocker-roadmap.md` does not exist (no name collision in `docs/`); `EVENT.sequence_order` exists at `docs/story-record-schema.md:740` and is authoring metadata only ("not sent to the prose prompt and does not control compiled event ordering", line 753) — consistent with listing its prompt-wiring as deferred, not re-proposed.
2. The deferral provenance is real: `triage/2026-06-09-open-thread-fields-triage.md` item O5 explicitly scopes out wiring `sequence_order` into compilation/ordering ("Wiring it into compiled output/ordering would be new behavior needing a spec — out of scope"). This ticket's known-deferred section cites that triage, changing nothing about the deferral.
3. Cross-artifact boundary under audit: this doc must not become a second validation authority. The boundary with `docs/validation-rule-inventory.md` (SPEC018FOUDOCCON-003) is implemented-vs-candidate: the inventory documents only `DIAGNOSTIC_CODES` members; this roadmap documents only non-implemented candidates. No rule ID may appear in both.
4. FOUNDATIONS principles restated before trusting the spec narrative: §11 — semantic prose checks cannot be deterministic blockers (each candidate carries a deterministic-checkability verdict); §12/§29.1 — no plot-rail machinery (candidates that brush structure, e.g. scene-goal absence and plant/payoff linkage, each carry a mandatory screening note explaining why they are causal-state checks, not act-structure machinery). The doc authorizes nothing: promoting any candidate requires its own spec clearing §29.
5. Mismatch + correction: none — collision, schema-field, and triage references re-verified this session.

## Architecture Check

1. A single non-binding research doc is cleaner than seeding speculative tickets or annotating the rule inventory with "future" rows: it gives the research one citable home with an explicit non-authority status header, keeps the inventory implementation-pure (003's invariant), and routes all promotion pressure through the constitutional §29 gate instead of around it.
2. No backwards-compatibility aliasing/shims introduced — new doc only.

## Verification Layers

1. Doc is explicitly non-binding → manual review (status header names it a research-grounded candidate list, not a backlog, not validation authority).
2. Every candidate carries the required fields (theory citation, deterministic-checkability, blocker-vs-warning grade, required schema fields, §12/§29.1 screening note) → manual review against the candidate list below.
3. No candidate is implemented or implies implementation → codebase grep-proof (no candidate name appears in `DIAGNOSTIC_CODES` at `packages/core/src/validation/types.ts`; no code diff in this ticket).
4. Doc registered in the authority registry → codebase grep-proof (`grep -n "narrative-theory-blocker-roadmap" docs/ACTIVE-DOCS.md`).

## What to Change

### 1. Create `docs/narrative-theory-blocker-roadmap.md`

- Two-line standard header per SPEC-018 D2, with the status line explicitly marking the doc **non-binding**: a research-grounded candidate list, not a backlog, not validation authority.
- Candidate entries, each with: name; theory citation; deterministic-checkability (yes / partially / no — semantic prose checks are out of scope per FOUNDATIONS §11); blocker- vs warning-grade; schema fields it would require; a §12 / §29.1 screening note (does the candidate risk plot-rail machinery, and why or why not). Candidates from SPEC-018 D8: causal-antecedent-missing for a planned beat; unmotivated-action / intentionality gap; dead-end pressure; scene-goal absence; sequel/outcome linkage; plant/payoff linkage (both directions of Chekhov's gun); thread starvation; pressure staleness; clock-deadline expiry against story time; flagged anachrony with fabula-time-aware continuity checks; knowledge provenance.
- Known-deferred section: `EVENT.sequence_order` prompt-wiring, deferred by the 2026-06-09 open-thread-fields triage (O5) — listed as deferred, not re-proposed.
- Closing rule: promoting any candidate requires its own spec clearing FOUNDATIONS §29; nothing in this doc authorizes implementation.
- Research source list: Trabasso & van den Broek 1985; Genette/Niederhoff; Riedl & Young 2010; Ware & Young CPOCL; Re3/DOC; Dramatron; KG-guided storytelling 2025; Swain/Bickham; script-supervisor practice; Barthes S/Z.

### 2. Add the registry row in `docs/ACTIVE-DOCS.md`

One row for `docs/narrative-theory-blocker-roadmap.md` (scope, genre, tier — `support`, non-binding), per the registry-completeness rule from SPEC018FOUDOCCON-002.

## Files to Touch

- `docs/narrative-theory-blocker-roadmap.md` (new)
- `docs/ACTIVE-DOCS.md` (modify — one registry row)

## Out of Scope

- Implementing any candidate (every D8 candidate is a spec-wide non-goal; each needs its own future spec clearing §29).
- Wiring `EVENT.sequence_order` into compilation (explicitly deferred by prior triage; listed as deferred only).
- The validation rule inventory (SPEC018FOUDOCCON-003).
- Cross-reference sync beyond the single registry row (SPEC018FOUDOCCON-007, including the archival-asymmetry note in `docs/archival-workflow.md`).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -ni "non-binding" docs/narrative-theory-blocker-roadmap.md` — the status header marks the doc non-binding.
2. `grep -n "sequence_order" docs/narrative-theory-blocker-roadmap.md` — the known-deferred section lists it as deferred with the 2026-06-09 triage citation.
3. `npm run lint && npm run typecheck && npm test` — unaffected (docs-only), all pass.

### Invariants

1. No candidate in this doc names an existing `DIAGNOSTIC_CODES` value as its own — the implemented/candidate boundary with the rule inventory holds in both directions.
2. Every candidate that brushes story structure carries a §12 / §29.1 screening note; the doc's closing rule routes all promotion through a new spec clearing §29.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -ni "non-binding\|sequence_order" docs/narrative-theory-blocker-roadmap.md`
2. `npm run lint && npm run typecheck && npm test`
3. Grep-proofs are the correct verification boundary: the deliverable is a non-binding research doc; the pipeline run only proves no collateral damage.
