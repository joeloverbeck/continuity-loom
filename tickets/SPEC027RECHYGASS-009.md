# SPEC027RECHYGASS-009: Capstone regression + conformance

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds a cross-surface e2e/conformance test surface; no production behavior change (it exercises the pipeline the earlier tickets composed).
**Deps**: `archive/tickets/SPEC027RECHYGASS-007.md`

## Problem

The feature spans `@loom/core`, `@loom/server`, and `@loom/web` plus many docs. A trailing capstone must prove the whole pipeline is correct end-to-end and that the cross-surface invariants hold: no database migration, no persisted hygiene output, prose/ideation goldens unchanged except version metadata, accepted prose + notes excluded from every prompt, and existing archive/delete reference-integrity intact. The live OpenRouter `Analyze` round-trip cannot run in CI (it needs a real model), so this capstone is a hybrid: CI-runnable conformance assertions plus a manual runbook.

## Assumption Reassessment (2026-06-21)

1. **Upstream surfaces exist (codebase, post-batch).** The capstone exercises — and introduces no new production logic over — the predicate (`archive/tickets/SPEC027RECHYGASS-002.md`), compiler/golden (004), snapshot builder/parser (005), routes (006), and web page (007). Counts are re-enumerated from a fixture at test start rather than hardcoded.
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 7 + §Verification (Core / Server / Web / Cross-surface) + source proposal §15. The §Verification bullets are this ticket's acceptance sub-cases.
3. **Cross-artifact boundary under audit.** The capstone composes the full pipeline (compile → inspect → [manual send] → parse → render) gated on the implementation leaf `archive/tickets/SPEC027RECHYGASS-007.md` (transitive head of the linear chain reaching `archive/tickets/SPEC027RECHYGASS-001.md` through `archive/tickets/SPEC027RECHYGASS-006.md`). The parallel docs leaf (008) is excluded from the gate — the capstone proves *behavior*, which the docs ticket does not carry.
4. **FOUNDATIONS principle motivating this ticket.** §8 deterministic compilation (regression: identical inputs+versions → identical prompts; prose/ideation contracts unchanged) + §22 prompt audit boundaries (no prompts/output persisted by default). These are the regression invariants under audit.
5. **Determinism + audit conformance (§8/§22) — verify, do not weaken.** Confirm via test that **no** DB migration, persisted hygiene output, run table, or similarity/embedding cache exists; the prose + ideation goldens are unchanged except expected version metadata; accepted prose and author-private notes are excluded from every prompt; active-working-set compilation remains selected-record-only; the readiness/validation diagnostic inventories are unchanged; and existing record archive/delete reference-integrity behavior remains authoritative.

## Architecture Check

1. **A capstone that exercises rather than modifies keeps the regression boundary clean.** It introduces no production logic; it adds one cross-surface conformance test and a manual runbook for the un-automatable live send. Re-enumerating expected counts from a fixture avoids stale hardcoded numbers.
2. **No backwards-compatibility aliasing/shims.** The capstone touches only its own test file + runbook; it does not modify upstream tickets' files.

## Verification Layers

1. Cross-surface conformance (no DB migration / persisted output / similarity cache; prose+ideation goldens unchanged except version metadata; accepted-prose + notes exclusion; AWS compilation still selected-record-only; readiness/validation inventories unchanged; archive/delete integrity intact) → the new e2e/conformance test (CI-runnable).
2. End-to-end local pipeline (compile route → prompt inspection → parser on a captured fixture response → finding render) → CI-runnable e2e against fixtures.
3. Live OpenRouter `Analyze` round-trip (real send → quarantined findings render → no logging → no record mutation) → **manual runbook** (not CI-runnable; needs a live model).

## What to Change

### 1. `packages/server/src/record-hygiene.e2e.test.ts` (new) — CI-runnable conformance
Assert the cross-surface invariants from §Verification: grep/structural proof that no migration or persisted hygiene store exists; prose + ideation golden snapshots differ from baseline only in version metadata; a fixture project with accepted prose + notes produces a hygiene prompt containing neither; active-working-set compilation stays selected-record-only; the validation/readiness inventories are byte-unchanged; archive/delete on a referenced record still fails per existing integrity rules. Re-enumerate record/section counts from the fixture at test start.

### 2. Manual runbook (in this section) — live `Analyze`
Implementer checklist: (a) copy a demo/fixture project to a disposable location; (b) configure an OpenRouter key in local settings; (c) open Record Hygiene, inspect the prompt, click `Analyze with OpenRouter`; (d) verify quarantined findings render with provenance, no record is mutated, the page offers no apply control, and server logs contain no prompt/payload/raw-output/key; (e) clear results and confirm no project-store residue. Each step lists its expected observable result.

## Files to Touch

- `packages/server/src/record-hygiene.e2e.test.ts` (new)

## Out of Scope

- Any production logic or modification of upstream tickets' files (the capstone exercises, it does not change them).
- The trailing docs sync (SPEC027RECHYGASS-008) — a parallel leaf, not gated here.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — the new e2e/conformance test passes: no migration/persisted-output/cache; prose+ideation goldens unchanged except version metadata; accepted-prose + notes excluded from the hygiene prompt; AWS compilation selected-record-only; inventories unchanged; archive/delete integrity intact.
2. `npm run build && npm run typecheck && npm run lint && npm test` — the full gate is green across all three packages.
3. Manual runbook (implementer checklist, not CI): the live `Analyze` round-trip renders quarantined findings, mutates no record, and logs no prompt/payload/key.

### Invariants

1. The feature adds no stored project entity, run table, suggestion table, similarity/embedding cache, or schema migration.
2. Prose and ideation prompt contracts are unchanged except for the expected version-metadata bump; accepted prose and notes never enter any prompt.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-hygiene.e2e.test.ts` (new) — cross-surface conformance + local end-to-end pipeline (compile → parse fixture response → render); counts re-enumerated from the fixture.

### Commands

1. `npm test -- record-hygiene.e2e` — targeted cross-surface conformance.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline regression gate (all three packages).
3. The split boundary is deliberate: CI assertions cover every deterministic/structural invariant, while the live-LLM `Analyze` path is a manual runbook because no live-model harness exists in the project's test infra.
