# SPEC012DURCHAREM-007: Phase-12 capstone — manual smoke + governing-doc updates + archival

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: None — verification, governing-doc updates, and archival bookkeeping only (no production code)
**Deps**: SPEC012DURCHAREM-006

## Problem

Phase 12's §Verification end-to-end check is a manual browser smoke (the project has Vitest/RTL only — no e2e/browser-automation harness), and the governing-doc/archival bookkeeping is gated on that smoke passing. This trailing ticket exercises the full reminder loop the prior tickets composed, records the Phase-12 completion in the governing docs, and archives the spec. It introduces no new production logic. (SPEC-012 Deliverable 7 + §Verification.)

## Assumption Reassessment (2026-06-06)

1. **Governing docs and conventions confirmed.** The Phase-12 gate is `docs/requirements-version-1/IMPLEMENTATION-ORDER.md:224-236`; the Phase-11 entry (`:200-214`) shows the `Status: ✅ Implemented via SPEC-NNN (YYYY-MM-DD).` + implementation-note convention to mirror. `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` and `UI-WORKFLOWS.md` carry the durable-change reminder sections (CANDIDATES §"Post-acceptance durable-change reminder" `:138-151`; UI-WORKFLOWS §"Durable-change reminder" `:207-213`) that take a short Phase-12 implementation note.
2. **Archival process and spec path confirmed.** The spec is `specs/SPEC-012-durable-change-reminder-workflow.md`; archival follows `docs/archival-workflow.md` into `archive/specs/` (where SPEC-001…011 already live). SPEC-012 §Deliverables 7 governs.
3. **Cross-artifact boundary under audit:** the Phase-12 §Verification gate spans every prior ticket (001–006). `Deps: SPEC012DURCHAREM-006` is the transitive head — 006→005→{003,004}, 003→002→001 — so depending on 006 alone gates the full chain.
4. **FOUNDATIONS principle restated:** §29.8 #5 — the persistent reminder appears after acceptance and clears the SPEC-010 interim tension; this ticket's docs/notes make that landing explicit (no silent retcon, §20). The implementation note records the realized shape (app-wide shell banner, deterministic checklist + `?create=<TYPE>` quick-links, durable Acknowledge + session-only Snooze, no LLM prose parsing, no record mutation, ephemeral Phase-10 notice superseded).
5. **Archival blast radius:** moving the spec out of `specs/` is safe — the batch's tickets reference SPEC-012 by name in prose only, never as a `Deps` path, so the move breaks no ticket dependency (grep: no ticket `Deps:` names the spec path).

## Architecture Check

1. Merging the capstone (manual-runbook variant) with the docs/bookkeeping ticket is cleaner than splitting: both depend on the same upstream leaf (006) and the doc/status flip is gated on the smoke passing, so a separate inter-ticket dependency would add nothing. CI-runnable assertions (full pipeline, doc grep-proofs, archival boundary) are kept distinct from the implementer-checklist runbook.
2. No backwards-compatibility shim: this is bookkeeping over already-landed surfaces; it adds no code and no alias.

## Verification Layers

1. Full automated suite green -> CI command: `npm run typecheck && npm run lint && npm test && npm run build` (all prior tickets' tests pass together).
2. Governing-doc status/notes landed -> codebase grep-proof: Phase-12 `Status: ✅ Implemented via SPEC-012` in IMPLEMENTATION-ORDER.md; a Phase-12 implementation note present in CANDIDATES and UI-WORKFLOWS.
3. Archival boundary -> `test ! -f specs/SPEC-012-…` and `test -f archive/specs/SPEC-012-…`.
4. End-to-end reminder loop -> manual runbook (UI smoke; no automation harness) with each step's expected observable result.

## What to Change

### 1. Manual smoke runbook (implementer-executed)

`npm start`; open a project with a blocker-free state and a configured key. On **Generate / Candidate**: Send → Accept. Then verify, in order:
1. the persistent shell banner appears (without navigation) with the six-question checklist + quick-links;
2. a quick-link opens the matching create form (CAST MEMBER → custom editor); create/update a record;
3. return and **Acknowledge** the banner → it hides;
4. perform a second accept, then **Snooze** → the banner hides and re-appears on reload;
5. inspect the SQLite `reminder_state` row → it holds only the integer threshold + timestamp (no prose), and no record was created by the reminder itself.

### 2. Governing-doc updates

- `IMPLEMENTATION-ORDER.md` Phase 12: add `Status: ✅ Implemented via SPEC-012 (YYYY-MM-DD).`, check the gate bullets, and note that Phase 13 (demo/stress) and Phase 14 (hardening) remain and that dashboard latest-segment surfacing remains deferred (the app-wide banner stands in).
- `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`: add a short "Phase 12 implementation note" (realized reminder shape, per Assumption Reassessment item 4).
- `UI-WORKFLOWS.md`: add a short Phase-12 implementation note under the existing implementation-note convention.

### 3. Archive the spec

Move `specs/SPEC-012-durable-change-reminder-workflow.md` to `archive/specs/` per `docs/archival-workflow.md`.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (modify)
- `docs/requirements-version-1/UI-WORKFLOWS.md` (modify)
- `specs/SPEC-012-durable-change-reminder-workflow.md` (modify — archival move out)
- `archive/specs/SPEC-012-durable-change-reminder-workflow.md` (new — archival move in)

## Out of Scope

- Any production code change — all implementation lands in SPEC012DURCHAREM-001…006.
- Phase 13 demo-fixture exercise / stress-suite coverage mapping, and Phase 14 compiler golden/regression hardening.
- Editing the spec's deliverable content (archival is a move, not a rewrite).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck && npm run lint && npm test && npm run build` all green with tickets 001–006 landed.
2. Grep-proof: `Status: ✅ Implemented via SPEC-012` present in `IMPLEMENTATION-ORDER.md` Phase 12; a Phase-12 implementation note present in `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` and `UI-WORKFLOWS.md`.
3. `test ! -f specs/SPEC-012-durable-change-reminder-workflow.md` and `test -f archive/specs/SPEC-012-durable-change-reminder-workflow.md`.

### Invariants (implementer-checklist runbook)

1. The manual smoke (What to Change §1, steps 1–5) passes with each observable result confirmed.
2. The SQLite `reminder_state` row holds only an integer threshold + timestamp; no record is created by the reminder itself.

## Test Plan

### New/Modified Tests

1. `None — verification/documentation-only ticket; verification is command-based plus a manual UI runbook, and the automated reminder coverage is provided by the suites named in SPEC012DURCHAREM-001…006.`

### Commands

1. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline gate.
2. `grep -n "Implemented via SPEC-012" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` — Phase-12 status proof.
3. `test ! -f specs/SPEC-012-durable-change-reminder-workflow.md && test -f archive/specs/SPEC-012-durable-change-reminder-workflow.md && echo archived` — archival boundary proof.

## Outcome

Completed: 2026-06-06

Updated the governing docs for Phase 12: `IMPLEMENTATION-ORDER.md` now marks Phase 12 implemented via SPEC-012 with checked gate bullets and notes that Phase 13/14 remain; `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` and `UI-WORKFLOWS.md` now include Phase 12 implementation notes describing the realized app-wide reminder shape, deterministic quick-links, durable Acknowledge, session-only Snooze, no LLM extraction, and no record mutation.

Marked `specs/SPEC-012-durable-change-reminder-workflow.md` completed, added an outcome with implementation and verification evidence, and moved it to `archive/specs/SPEC-012-durable-change-reminder-workflow.md`.

Executed the capstone smoke against a production launch on localhost using the real API and Playwright CLI: created a project, appended accepted segment 1, observed the shell banner/checklist/quick-links, opened the CAST MEMBER create form from the quick-link without creating a record, acknowledged the banner and verified `reminder_state` contains only the threshold/timestamp columns with `acknowledged_through_sequence = 1`, appended segment 2, verified banner reactivation, snoozed it, and confirmed reload shows it again. The Generate / Candidate immediate-refresh path is covered by the SPEC012DURCHAREM-006 provider+banner test.

Verification:

- Production smoke via `node packages/server/dist/launch.js --no-open` + Playwright CLI — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
- `grep -n "Implemented via SPEC-012\\|Phase 12 implementation note" ...` — passed.
- `test ! -f specs/SPEC-012-durable-change-reminder-workflow.md && test -f archive/specs/SPEC-012-durable-change-reminder-workflow.md` — passed.
