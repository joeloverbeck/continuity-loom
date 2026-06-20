# SPEC025SCHAUDPAS-008: Capstone — SPEC-025 §Verification end-to-end + retired-key / no-variable invariants

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends the pass-1 schema-audit-cleanup capstone test with pass-2 retired-key / destination / storage / no-`variable` assertions; no production behavior change
**Deps**: archive/tickets/SPEC025SCHAUDPAS-002.md, archive/tickets/SPEC025SCHAUDPAS-003.md, SPEC025SCHAUDPAS-004, SPEC025SCHAUDPAS-006, SPEC025SCHAUDPAS-007

## Problem

SPEC-025's §Verification asserts cross-cutting invariants no single field ticket fully owns: a repository-wide audit that none of the four retired keys survive, destination truthfulness for `reason` / `selected_pov` / no-literal-`variable`, storage safety (legacy project opens after deterministic migration; malformed-row rollback), intended-changed-vs-unchanged prompt bytes, validation behavior, and no new hidden authority. This trailing capstone exercises the pipeline the prior tickets composed and pins those invariants, extending the existing pass-1 capstone rather than adding a second one.

## Assumption Reassessment (2026-06-20)

1. The pass-1 capstone `packages/core/test/schema-audit-cleanup-capstone.test.ts` exists (from CONLOOSCHAUD, merged #60) and is the home for retired-key absence assertions; pass-2 assertions extend it (per the reassessment M3 finding). Confirmed by `test -f`. It currently references some pass-2 retired keys as still-present (e.g. `prior_accepted_prose_status_or_handoff_note`, `can_drive_prose`); those references flip to absence assertions here.
2. The four retired keys (`governing_policy_note`, `prior_accepted_prose_status_or_handoff_note`, `FACT.status`, `PLAN.can_drive_prose`) are removed by tickets 003/002/005/006; effective-POV resolution and the no-`variable` invariant land in 007. SPEC-025 §Verification + §"Test order (per package)" enumerate the capstone sub-cases.
3. Cross-artifact boundary under audit: this ticket introduces **no production logic** — it exercises the surfaces tickets 002–007 composed (schema, compiler, validation, migration, web) end-to-end. Its leaf-set `Deps` (002, 003, 004, 006, 007) transitively cover the whole DAG (005 via 006, 001 via 002).
4. FOUNDATIONS principles asserted: §8 (deterministic compilation — byte-identical FACT/PLAN output for equivalent migrated data; intended byte changes only where named) and §11/§29.5 (fail-closed — continuation readiness = bridge + either cutpoint; selected active plans cannot bypass holder/means checks; POV conflicts block; warnings never gate; structurally-saveable drafts still save). Restated before trusting the spec narrative so the capstone proves the principles, not just the spec's prose.
5. Enforcement-surface check (§8/§15): the capstone *asserts* — it does not implement — the no-accepted-prose firewall (contamination scans still block on the remaining prompt-facing lanes), the secret firewall + effective-POV (no `POV: variable`, no leak into the wrong mind), and deterministic compilation (byte-stability). It introduces no leakage or nondeterminism path of its own; counts are re-enumerated from fixtures at test start rather than hardcoded.

## Architecture Check

1. A single trailing capstone gated on the implementation leaf set is cleaner than scattering cross-cutting assertions across the field tickets: the repository-wide "no retired key anywhere" and "no `POV: variable` anywhere" invariants are inherently whole-tree and belong in one place that runs after every removal lands. Extending the existing pass-1 capstone keeps one authoritative schema-audit gate rather than a duplicate.
2. No backwards-compatibility aliasing or shims: the capstone adds assertions only; it modifies no production surface and the prior tickets' files (it exercises them, it does not touch them).

## Verification Layers

1. No retired key survives anywhere → codebase grep-proof inside the capstone: a repository-wide scan asserts zero production-source matches for all four retired keys.
2. Destination truthfulness → schema validation + prompt-inspection assertions: `reason` non-prompt-facing; `selected_pov` participates in effective-POV resolution; no compiled ready prompt contains literal `variable`; no deleted placeholder remains in contract or template.
3. Storage safety → server e2e: a legacy project containing all four retired keys opens after migration; a second open is a no-op; a malformed/invalid payload rolls back atomically with an actionable error; no migration copies data into a semantically guessed field.
4. Prompt + validation behavior → golden diffs (intended changes) + byte-stability (FACT/PLAN unchanged) + readiness/holder/POV-conflict assertions, each mapped to the responsible upstream ticket.

## What to Change

### 1. Extend the pass-1 capstone with pass-2 assertions

In `packages/core/test/schema-audit-cleanup-capstone.test.ts`, flip the still-present references to the four pass-2 retired keys into absence assertions and add the SPEC-025 §Verification sub-cases:
- repository-wide retired-key audit (no live schema/descriptor/guidance/editor/compiler-resolver/validation-field-path/demo-fixture/API type for the four keys; archived historical docs may still mention them);
- destination truthfulness (every prompt-facing field names a real destination; `reason` non-prompt-facing; `selected_pov` in effective-POV resolution; no literal `variable`; no orphaned placeholder);
- intended changed bytes (governing-policy-note line, accepted-prose handoff line, override reason removed; variable/conflicting POV resolves or blocks) vs intended unchanged bytes (FACT/PLAN rendering; unrelated sections/ordering; fixed external-policy boundary; fixed accepted-prose firewall; static local-unit stop rule);
- validation behavior (continuation = bridge + either cutpoint; contamination markers still block; selected active plans cannot bypass holder/means; POV conflicts + missing variable-mode selection block; warnings never gate; saveable drafts still save);
- no new hidden authority (no summarizer/ranker/selector/relevance model/prose-miner/LLM intermediary; no accepted/rejected/superseded text in a snapshot; no record silently added/removed; no author-only field smuggled into ideation/prose; no private note in validation/prompting).

### 2. Storage-safety capstone (server)

Add or extend a server-side capstone assertion that a legacy project carrying all four retired keys opens after deterministic migration, second-open is a no-op, and a malformed transformed payload rolls back atomically — re-enumerating expected record counts from the fixture at test start.

## Files to Touch

- `packages/core/test/schema-audit-cleanup-capstone.test.ts` (modify)

## Out of Scope

- Any production logic — this is verification-only; it exercises tickets 002–007, it does not modify their surfaces.
- The §10 amendment (001) and the individual field removals/effective-POV work (002–007) — each owns its own deliverable tests; this capstone gates the composed pipeline.
- Re-baselining goldens (owned by the upstream field tickets); the capstone asserts the intended changed/unchanged state, it does not regenerate goldens.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- schema-audit-cleanup-capstone` — all pass-2 retired-key absence, destination-truthfulness, and no-`variable` assertions pass.
2. The storage-safety capstone — legacy project with all four keys opens after migration; idempotent; malformed-row rollback with actionable error.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green across all three packages (the capstone is the final end-to-end gate).

### Invariants

1. No production source under `packages/` references any of the four retired keys; no ready compiled prompt contains `POV: variable`.
2. Equivalent migrated FACT/PLAN data compiles byte-identically; all SPEC-025 §Verification sub-cases hold as re-runnable assertions.

## Test Plan

### New/Modified Tests

1. `packages/core/test/schema-audit-cleanup-capstone.test.ts` — extended with the pass-2 §Verification sub-cases (retired-key audit, destination truthfulness, byte-stability, no-`variable`, no-hidden-authority).

### Commands

1. `npm test -- schema-audit-cleanup-capstone`
2. `npm run lint && npm run typecheck && npm test`
3. The capstone suite is the cross-cutting verification boundary; the full pipeline confirms the composed feature is correct end-to-end across `@loom/core`, `@loom/server`, and `@loom/web`.
