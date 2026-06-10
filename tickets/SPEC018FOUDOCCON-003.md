# SPEC018FOUDOCCON-003: Create docs/validation-rule-inventory.md with a CI drift test

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new doc `docs/validation-rule-inventory.md`, new test `packages/core/test/validation-rule-inventory.test.ts`, one registry row in `docs/ACTIVE-DOCS.md`; no production behavior change
**Deps**: `archive/tickets/SPEC018FOUDOCCON-002.md` (the ACTIVE-DOCS registry must exist to receive this doc's row). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D7).

## Problem

The implemented validation taxonomy — 55 diagnostic codes in `DIAGNOSTIC_CODES` (`packages/core/src/validation/types.ts`) — exists only in code with no documented, auditable inventory. There is no single place to see every rule, its severity, the FOUNDATIONS §11 taxonomy clause it enforces, and the stress-suite case(s) covering it. Without CI armor, any such inventory would drift the first time a rule is added, removed, or re-severitied.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `DIAGNOSTIC_CODES` is `Object.freeze({...})` at `packages/core/src/validation/types.ts:36` with exactly **55** entries (camelCase key → kebab-case string value; the inventory's rule IDs are the *values*). Each rule definition carries an explicit `severity: "blocker" | "warning"` literal in its implementing module (e.g. `packages/core/src/validation/rules/universal-blockers.ts:436`, `packages/core/src/validation/rules/warnings.ts:184`) — severity is read from that field, never inferred from module location or stress-suite prose.
2. The implementing module families exist as stated in SPEC-018 D7: `packages/core/src/validation/rules/` contains `universal-completeness.ts`, `universal-blockers.ts`, `matrix-voice.ts`, `matrix-knowledge.ts`, `matrix-physical.ts`, `matrix-durable.ts`, `security.ts`, `warnings.ts` (plus `index.ts`, `types.ts`). FOUNDATIONS §11's blocker taxonomy (7 legitimacy conditions) is the clause column's vocabulary. Stress-case mappings come from `docs/stress-coverage-matrix.md` rows (use `—` where no case maps).
3. Cross-artifact boundary under audit: the doc's rule-ID and severity columns are a parse contract consumed by the new drift test — backticked kebab-case code IDs, one per row; severity values exactly `blocker` or `warning`. Keep the table format stable; the test fails on any asymmetric ID difference or severity mismatch.
4. FOUNDATIONS principle restated before trusting the spec narrative: §11 — validation is deterministic and blocking, warnings never gate. This ticket documents the implemented taxonomy without adding, removing, or re-grading any rule; the drift test is regression armor for existing behavior, not product behavior. §8 drift doctrine motivates the same-change rule stated in the doc.
5. Reading a repo doc from a core test follows the existing convention: `packages/core/test/accepted-prose-exclusion.test.ts:78` already does `readFileSync(new URL("../../../docs/story-record-schema.md", import.meta.url), "utf8")`; the core purity boundary (ESLint `no-restricted-imports`) binds `src`, not `test`.
6. Mismatch + correction: none — counts, paths, and severity encoding all re-verified this session.

## Architecture Check

1. A markdown inventory parsed by a Vitest test is cleaner than generating the doc from code or maintaining a JSON sidecar: the doc stays human-curated (the §11-clause and stress-case columns are editorial judgments code cannot emit), while the machine-checkable subset (ID set, severity) is CI-enforced. The test imports `DIAGNOSTIC_CODES` and the rule registry directly, so there is exactly one source of truth per column.
2. No backwards-compatibility aliasing/shims introduced — new doc, new test, no existing surface altered.

## Verification Layers

1. Inventory rule-ID set ≡ `DIAGNOSTIC_CODES` values (55/55) → new Vitest drift test (asymmetric-difference assertion).
2. Each row's severity matches the registered rule's explicit `severity` field → same drift test, second assertion.
3. Doc registered in the authority registry → codebase grep-proof (`grep -n "validation-rule-inventory" docs/ACTIVE-DOCS.md`).
4. No validation behavior changed → codebase grep-proof on `packages/core/src/validation/` (this ticket adds no diff under `src/`).

## What to Change

### 1. Create `docs/validation-rule-inventory.md`

- Two-line standard header per SPEC-018 D2 (`Status: active audit — …` / `Authority: domain authority for the implemented validation-rule inventory (see docs/ACTIVE-DOCS.md)` — final tier wording per the registry).
- One row per diagnostic code (all 55), columns: rule ID (backticked kebab-case value), severity (`blocker`/`warning`, taken from the rule definition's explicit `severity` field), one-line description, FOUNDATIONS §11 taxonomy clause it enforces, stress-suite case(s) covered (or `—`).
- Group rows by implementing module family: universal completeness, universal blockers, voice/knowledge/physical/durable matrix, security, warnings.
- State the same-change rule: adding, removing, or re-severitying a diagnostic code updates this inventory in the same revision.

### 2. Create `packages/core/test/validation-rule-inventory.test.ts`

- Read the doc via `readFileSync(new URL("../../../docs/validation-rule-inventory.md", import.meta.url), "utf8")` (existing convention).
- Parse the rule-ID column (backticked codes) and the severity column from the markdown table rows.
- Assert (a) the parsed ID set equals the set of `DIAGNOSTIC_CODES` values exactly — report any asymmetric difference in the failure message; (b) each row's severity equals the registered rule's `severity` field (resolve rules via the validation rule registry exported from `packages/core/src/validation/rules/`).

### 3. Add the registry row in `docs/ACTIVE-DOCS.md`

One row for `docs/validation-rule-inventory.md` (scope, genre `audit`, tier per the registry's vocabulary), per the registry-completeness rule introduced in `archive/tickets/SPEC018FOUDOCCON-002.md`.

## Files to Touch

- `docs/validation-rule-inventory.md` (new)
- `packages/core/test/validation-rule-inventory.test.ts` (new)
- `docs/ACTIVE-DOCS.md` (modify — one registry row)

## Out of Scope

- Adding, removing, or re-grading any validation rule (spec-wide non-goal).
- The narrative-theory blocker roadmap (SPEC018FOUDOCCON-004) — candidate future rules do not belong in this inventory.
- Cross-reference sync beyond the single registry row (`CLAUDE.md`/`AGENTS.md`/`README.md`/archival-workflow — SPEC018FOUDOCCON-007).
- Lint-enforcing the doc header format (spec open question, explicitly deferred).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — the new drift test passes: inventory rule IDs ≡ `DIAGNOSTIC_CODES` values (55/55) and every row's severity matches the registered rule's explicit `severity` field.
2. Mutation check (manual, pre-merge): temporarily removing one inventory row makes the drift test fail with the missing ID named; restoring it makes the test pass.
3. `npm run lint && npm run typecheck` — pass (test file conforms to the core package's lint/TS config).

### Invariants

1. The inventory documents implemented behavior only — every row's rule ID exists in `DIAGNOSTIC_CODES`; no speculative or future rules appear.
2. The drift test reads severity from rule definitions (the explicit `severity` field), never from module filenames or doc prose.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-rule-inventory.test.ts` — CI drift armor: ID-set equality (55/55) plus per-row severity assertion against the registered rules.

### Commands

1. `npm test -- validation-rule-inventory` (targeted; Vitest filters by filename substring)
2. `npm run lint && npm run typecheck && npm test`
3. The targeted test run is the correct verification boundary for drift armor; the full pipeline proves the new test integrates with the build-then-test flow (`npm test` builds `@loom/core` first).
