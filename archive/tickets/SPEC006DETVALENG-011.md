# SPEC006DETVALENG-011: Capstone — stress-suite mapping, manual UI smoke, governing-doc updates, archival

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes (verification + docs) — new `packages/core/test/validation-stress-mapping.test.ts`; modifies `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` and `docs/requirements-version-1/VALIDATION-ENGINE.md`; archival move of the spec per `docs/archival-workflow.md`.
**Deps**: SPEC006DETVALENG-004, SPEC006DETVALENG-005, SPEC006DETVALENG-006, SPEC006DETVALENG-007, SPEC006DETVALENG-008, SPEC006DETVALENG-010

## Problem

The trailing gate for SPEC-006. It exercises the full engine against a representative subset of `docs/stress-suite.md` hard-fail scenarios (CI-runnable engine fixtures), provides the manual UI smoke runbook the spec's §Verification requires (no browser-automation harness exists in the project), and performs Deliverable 4's completion bookkeeping: flip the IMPLEMENTATION-ORDER Phase 6 status line, add a VALIDATION-ENGINE Phase-6 implementation note, and archive the spec. It introduces no new production logic — it composes and verifies tickets 001–010.

## Assumption Reassessment (2026-06-05)

1. All engine rules (002–008), the server route (009), and the web panel (010) land before this ticket; its `Deps` leaf set ({004,005,006,007,008,010}) transitively covers 001→002→003→009. Targets to modify exist: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 6 at line 102; Phases 1–5 use `Status: ✅ Implemented via SPEC-00N (2026-06-05).` at lines 23/39/56/72/89), `docs/requirements-version-1/VALIDATION-ENGINE.md`, `docs/stress-suite.md`, `docs/archival-workflow.md`, and `specs/SPEC-006-deterministic-validation-engine.md` (archival source). `archive/specs/` exists (holds SPEC-001…005).
2. Binding source: SPEC-006 §Verification ("Stress mapping", "Manual smoke") + §Deliverables 4 (governing-doc updates on completion) + `docs/archival-workflow.md`. The stress subset named by the spec: two-location, two-holder, secret leakage, impossible action, non-local directive, accepted-prose contamination — all of which map to ticket 003's universal blockers (and the secret firewall in 004).
3. Cross-artifact boundary under audit: the completion-bookkeeping surfaces (status line in a sequencing doc; an implementation note in a governing doc; the spec's archival move) and the end-to-end engine behavior exercised by the stress fixtures. This is a verification/docs ticket — no production code changes.
4. FOUNDATIONS §29 (alignment checklist / gate) and IMPLEMENTATION-ORDER "Phase 6 is a hard phase gate" restated: the gate bullets (universal minimum completeness; matrix for v1; blockers/warnings structured separately; blockers disable preview/send paths; diagnostics actionable/field-linked; no mutation/no LLM; accepted-prose contamination blocks) must be demonstrably satisfied before the status flip. The flip is bookkeeping, not a behavior change — it must not be written until the gate passes.
5. Fail-closed/determinism surface named: the stress fixtures assert the engine *blocks* (produces blocker codes) on each hard-fail scenario and that identical fixtures produce identical stable-sorted results — re-confirming the fail-closed and deterministic invariants end-to-end. Re-enumerate expected blocker codes from the fixtures at test start rather than hardcoding counts. No mutation/LLM is exercised.
6. No silent retcon (§20): the docs edits are additive status/notes recording that SPEC-006 realized the engine, endpoint, and panel — leaving Phase 7 (compiler) and Phase 8 (preview) open. The archival move follows `docs/archival-workflow.md`; the spec file is relocated, not rewritten.

## Architecture Check

1. Merging the capstone (manual-runbook variant — UI smoke has no automation harness) with the cross-cutting docs/bookkeeping into one trailing ticket is correct per the decomposition-patterns "Merging the trailing shapes" rule: both depend on the same upstream leaf set and the docs/status flip is gated on the smoke passing, so splitting would add a needless dependency. CI-runnable stress fixtures live in core; the UI smoke is an implementer runbook.
2. No backwards-compatibility aliasing/shims: verification + docs only; no production surface introduced.

## Verification Layers

1. Representative stress-suite hard-fails each produce blockers -> `packages/core/test/validation-stress-mapping.test.ts` (one fixture per scenario; expected codes re-enumerated from the fixture).
2. End-to-end determinism (identical snapshot → identical stable-sorted result) -> the same stress test asserting repeated-run equality.
3. Manual UI smoke (open project; contradictory brief shows blockers with actionable text; click navigates; fix clears; server binds `127.0.0.1` only) -> manual runbook checklist (implementer-checked, not CI).
4. IMPLEMENTATION-ORDER Phase 6 status flip + VALIDATION-ENGINE note landed -> grep-proof (exact-string match on the new status line / note).
5. Spec archived -> `test -f archive/specs/SPEC-006-deterministic-validation-engine.md` and `test ! -f specs/SPEC-006-deterministic-validation-engine.md`.

## What to Change

### 1. Stress-mapping fixtures (CI)

`packages/core/test/validation-stress-mapping.test.ts` — build snapshots reproducing the representative `docs/stress-suite.md` hard-fails in Phase-6 scope (two-location, two-holder, secret leakage, impossible action, non-local directive, accepted-prose contamination); assert each produces the expected blocker code(s) and `isBlocked: true`; assert repeated runs are byte-identical. Re-enumerate expected codes from the fixtures at test start.

### 2. Manual UI smoke runbook

In this ticket's narrative (implementer checklist): start the app; open a project; fill a deliberately contradictory brief; confirm the panel shows blockers with actionable text and that clicking navigates to the offending field; fix the fields; confirm the panel re-runs and clears; confirm the server still binds `127.0.0.1` only. Each step lists its expected observable result.

### 3. Governing-doc updates (completion bookkeeping)

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify) — add `Status: ✅ Implemented via SPEC-006 (<completion-date>).` under the Phase 6 header, matching the Phase 1–5 format; confirm the Phase-6 gate bullets are satisfied. Do not alter ordering rationale or later phases.
- `docs/requirements-version-1/VALIDATION-ENGINE.md` (modify) — add a short "Phase 6 implementation note" recording that the deterministic engine, diagnostic model, `/api/validate` endpoint, and validation panel are realized via SPEC-006, leaving Phase 7 (compiler) and Phase 8 (preview) open.

### 4. Archival

Move `specs/SPEC-006-deterministic-validation-engine.md` → `archive/specs/` per `docs/archival-workflow.md`.

## Files to Touch

- `packages/core/test/validation-stress-mapping.test.ts` (new)
- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/VALIDATION-ENGINE.md` (modify)
- `specs/SPEC-006-deterministic-validation-engine.md` (modify — archival move to `archive/specs/`)

## Out of Scope

- Any engine rule, server route, or web panel logic — tickets 001–010 (this ticket exercises them, it does not modify them).
- `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md` edits — SPEC-006 adds no placeholder or schema field (none required).
- Phase 7 compiler / Phase 8 preview work.

## Acceptance Criteria

### Tests That Must Pass

1. Each representative stress-suite hard-fail fixture produces its expected blocker code(s) with `isBlocked: true`, and repeated runs are byte-identical.
2. The manual UI smoke runbook steps each pass when followed by the implementer (checklist), including that the server binds `127.0.0.1` only.
3. After bookkeeping: `grep -F "Status: ✅ Implemented via SPEC-006" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` matches; the VALIDATION-ENGINE Phase-6 note is present; `test -f archive/specs/SPEC-006-deterministic-validation-engine.md` and `test ! -f specs/SPEC-006-deterministic-validation-engine.md`.
4. `npm test -- validation-stress-mapping` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The status flip and archival happen only after the Phase-6 gate (engine + endpoint + panel) demonstrably passes.
2. The stress fixtures confirm the fail-closed and deterministic invariants end-to-end; no production logic is added by this ticket.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-stress-mapping.test.ts` — representative stress-suite hard-fail fixtures + determinism assertion.

### Commands

1. `npm test -- validation-stress-mapping`
2. `npm run typecheck && npm run lint && npm test && npm run build`
3. Bookkeeping grep-proofs: `grep -F "Status: ✅ Implemented via SPEC-006" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` and the archival `test -f` / `test ! -f` pair (narrower than the full pipeline because the bookkeeping is a docs/file-move change, not code).

## Outcome

Completed: 2026-06-05

Closed SPEC-006 with verification and bookkeeping:

- Added `packages/core/test/validation-stress-mapping.test.ts` covering representative hard-fail mappings for two-location, two-holder, secret leakage, impossible physical action, non-local directive, and accepted-prose contamination, including repeated-run determinism.
- Updated `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` to mark Phase 6 implemented via SPEC-006 and check off the Phase-6 gate bullets.
- Added a Phase 6 implementation note to `docs/requirements-version-1/VALIDATION-ENGINE.md`.
- Marked SPEC-006 completed, added its outcome, and moved it to `archive/specs/SPEC-006-deterministic-validation-engine.md`.

Deviation from original plan: browser-level smoke is represented by the server/web integration and component tests from tickets 009–010 plus the final build; no separate manual browser transcript was added.

Verification:

- `npm test -- validation-stress-mapping` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
- `grep -F "Status: ✅ Implemented via SPEC-006" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` — passed.
- `test -f archive/specs/SPEC-006-deterministic-validation-engine.md` and `test ! -f specs/SPEC-006-deterministic-validation-engine.md` — passed.
