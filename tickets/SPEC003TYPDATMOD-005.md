# SPEC003TYPDATMOD-005: Knowledge & concealment schemas (FACT, BELIEF, SECRET)

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` payload schemas for FACT, BELIEF, SECRET; status enums; reference extractors; registry registration; exports.
**Deps**: SPEC003TYPDATMOD-001

## Problem

FACT, BELIEF, and SECRET preserve truth, belief/false-report, hidden truth, holders, and reveal constraints. They are the substrate for POV/secret-firewall validation (Phase 6) and the compiled POV/AUDIENCE knowledge profiles (Phase 7). Phase 3 needs their runtime schemas, status semantics, and holder/known-by reference projections.

## Assumption Reassessment (2026-06-05)

1. Substrate from SPEC003TYPDATMOD-001 exists. This ticket registers three definitions with type-specific status enums.
2. Field names + status enums from `docs/story-record-schema.md`: FACT §6.1 (`status: active` only; `known_by` list, `fact_kind`, `audience_visibility`, `salience`); BELIEF §6.2 (`status: active|resolved|abandoned`; `holder`, `belief_mode`, `truth_relation`; removed value `branch_counterfactual` must NOT appear); SECRET §6.3 (`status: hidden|partially_revealed|revealed|disproven|abandoned`; `holders` list, `non_holders_to_protect`, `pov_access`, `reveal_permission`, `clue_carriers`).
3. POV KNOWLEDGE PROFILE / AUDIENCE KNOWLEDGE PROFILE (§6.4/§6.5) are **compiled** generation-time profiles, NOT durable records — out of scope here (SPEC-003 §Out of Scope confirms Phase 3 stores their sources: FACT/BELIEF/SECRET/PROSE MODE).
4. FOUNDATIONS §15 (POV, knowledge, secrets) + §29.6 motivate SECRET: the schema must carry holders, non-holders-to-protect, allowed cues, forbidden reveals, and reveal permission so the Phase-6 secret firewall can block leakage. Restated: Phase 3 stores the firewall inputs faithfully; it enforces no reveal rule yet and adds no path that leaks a secret (no compilation here).
5. Reference roles: FACT → `known_by`; BELIEF → `holder`; SECRET → `secret_holder` (from `holders`), `non_holder_to_protect` (from `non_holders_to_protect`). `branch_counterfactual` (BELIEF removed value) verified absent.

## Architecture Check

1. Per-type status enums (FACT active-only vs. SECRET five-state) live in the registry definition, so Phase 6 reads active-truth vs. resolved-but-relevant deterministically without a hardcoded switch.
2. No backwards-compatibility shims; no `branch_counterfactual` alias.

## Verification Layers

1. FACT/BELIEF/SECRET schemas + status enums match `docs/story-record-schema.md` §6.1–§6.3 -> schema validation test (accept valid; reject bad status value, unknown key, `branch_counterfactual`).
2. SECRET emits `secret_holder` + `non_holder_to_protect` projections; FACT emits `known_by`; BELIEF emits `holder` -> `extractReferences` unit tests.
3. POV/AUDIENCE profiles absent from durable schemas -> grep-proof (no `pov_knowledge_profile` durable record registered).

## What to Change

### 1. Schemas

Add `packages/core/src/records/knowledge.ts`: Zod `.strict()` schemas for FACT, BELIEF, SECRET per §6.1–§6.3, each with its status enum.

### 2. Registry + extractors

Register all three with status enums. Extractors emit the holder/known-by/secret-holder/non-holder projections above.

### 3. Exports

Re-export from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/knowledge.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register three definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/knowledge.test.ts` (new)

## Out of Scope

- Compiled POV/AUDIENCE knowledge profiles — Phase 7.
- Secret-leakage validation / reveal-permission enforcement — Phase 6.
- DDL / repository — tickets 010/011.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — accept valid FACT/BELIEF/SECRET; reject bad status values, unknown keys, and `branch_counterfactual`; reference extraction for all three.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. FACT status enum is `active` only; SECRET status enum is the five §6.3 values; BELIEF excludes `branch_counterfactual`.
2. SECRET carries holders, non-holders-to-protect, allowed cues, forbidden reveals, and reveal permission fields (§15 firewall inputs).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/knowledge.test.ts` — accept/reject + status-enum + reference-extractor coverage; `branch_counterfactual` rejection.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
