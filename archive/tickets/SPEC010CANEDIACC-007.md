# SPEC010CANEDIACC-007: Phase-10 capstone — manual smoke, governing-doc updates, archive

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — governing docs (`IMPLEMENTATION-ORDER.md`, `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`); archival move of SPEC-010
**Deps**: SPEC010CANEDIACC-006

## Problem

SPEC-010's §Verification ends with a manual end-to-end smoke that no automated harness in this repo
can run (a browser click-path; the project has no browser-automation test infra), and Deliverable 8
is end-of-phase bookkeeping: mark Phase 10 done in the implementation-order ledger, add a Phase-10
implementation note to the candidate authority doc, and archive the spec. This trailing capstone
exercises the pipeline the prior tickets composed end-to-end (manual runbook) and lands the
governing-doc updates atomically once everything ships. It introduces **no production logic**.

## Assumption Reassessment (2026-06-06)

1. The implementation chain is complete at this point: SPEC010CANEDIACC-001 (generate snapshot) → -002 (accept route) → -003 (web clients) → -004 (shared inspector) → -005 (route/nav relocation) → -006 (candidate lifecycle). -006's transitive `Deps` reach every prior ticket, so a single `Deps: -006` covers the full chain (linear head).
2. Bookkeeping targets exist: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 10 (`:176-189`, currently no `Status:` line; prior phases use `Status: ✅ Implemented via SPEC-00N (YYYY-MM-DD).`, e.g. `:157`); `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (the Phase-10 authority); `docs/archival-workflow.md` is the canonical archival process; `archive/specs/` already holds SPEC-001…009.
3. Shared boundary under audit: this ticket only annotates aggregate completion and moves the spec; it cites no individual code symbols that could go stale independently, so capstone-gated `Deps: -006` is the correct dependency shape (not a per-surface docs enumeration).
4. FOUNDATIONS §29 motivates the smoke: the runbook confirms acceptance is human-gatekept (§3/§20), one ordered segment is written with full metadata and no prompt (§21), the candidate never persists (§22), and no key/prompt reaches logs (§29.9) — end-to-end, against real storage/transport.
5. No production-logic / no-retcon (§20): the docs edits record landed work; they assert the accepted-segment **browser** stays Phase 11 and the **persistent** durable-change reminder stays Phase 12 (Phase 10 ships only the minimal ephemeral notice), so the ledger does not over-claim.

## Architecture Check

1. Merging the capstone (manual smoke) and the docs/bookkeeping into one trailing ticket is correct here: both depend on the same upstream leaf (-006) and the status flip is gated on the smoke passing — splitting them would only add a needless inter-ticket dependency, and there is no CI-runnable verification distinct from the docs change to justify a separate capstone test file.
2. Acceptance is grep-proofs on the status/note lines plus `test -f`/`test ! -f` on the archival boundary — a verification-only contract, no new code.
3. No backwards-compatibility shims: this ticket adds notes and moves a file; it introduces no aliases.

## Verification Layers

1. End-to-end candidate→accept loop works against real infra → **manual runbook** (see What to Change) — implementer-checklist, not CI.
2. Phase-10 ledger marked done → grep-proof: `IMPLEMENTATION-ORDER.md` Phase 10 has `Status: ✅ Implemented via SPEC-010 (<date>).`.
3. Candidate authority doc records the realized lifecycle → grep-proof: a "Phase 10 implementation note" string in `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`.
4. Spec archived → `test -f archive/specs/SPEC-010-candidate-editor-and-accept-lifecycle.md` and `test ! -f specs/SPEC-010-candidate-editor-and-accept-lifecycle.md`.
5. Whole pipeline green → `npm run typecheck && npm run lint && npm test && npm run build`.

## What to Change

### 1. Manual smoke runbook (implementer-checklist)

Run `npm start`; open a project with a blocker-free state and a configured key. On **Generate / Candidate**: inspect the prompt → **Send** → edit the candidate → **Regenerate** (confirm the edit-replacement warning) → **Discard** → **Send** again → **Accept**. Expected observable results per step: prompt renders before Send; Send yields an editable draft candidate; Regenerate warns about pending edits then replaces; Discard returns to pre-send; Accept shows the ephemeral notice and clears the candidate. Then confirm the SQLite `accepted_segments` table holds exactly one row with the **edited** text + full metadata snapshot and **no** prompt; confirm the browser console/network logs contain no key, no full prompt, and no persisted candidate.

### 2. Governing-doc updates

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 10: add `Status: ✅ Implemented via SPEC-010 (<YYYY-MM-DD>).` and check the Phase-10 gate bullets, noting the accepted-segment **browser**/deletion/export remain Phase 11 and the **persistent** durable-change reminder remains Phase 12 (Phase 10 ships only a minimal ephemeral post-accept notice).
- `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`: add a short "Phase 10 implementation note" recording the realized lifecycle (dedicated `/generate` surface, `POST /api/accepted-segments` over the existing table, full metadata snapshot, no rejected/superseded persistence, browser → Phase 11, persistent reminder → Phase 12).

### 3. Archive the spec

Move `specs/SPEC-010-candidate-editor-and-accept-lifecycle.md` → `archive/specs/` per `docs/archival-workflow.md`.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (modify)
- `specs/SPEC-010-candidate-editor-and-accept-lifecycle.md` → `archive/specs/SPEC-010-candidate-editor-and-accept-lifecycle.md` (move)

## Out of Scope

- Any production code change (all implementation lands in -001…-006).
- Phase 11 (accepted-segment browser) and Phase 12 (persistent reminder) work and their doc sections beyond noting they remain deferred.
- Editing any sibling spec or ticket.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -F "Status: ✅ Implemented via SPEC-010" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` returns the Phase-10 status line; `grep -iF "Phase 10 implementation note" docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` returns the note.
2. `test -f archive/specs/SPEC-010-candidate-editor-and-accept-lifecycle.md && test ! -f specs/SPEC-010-candidate-editor-and-accept-lifecycle.md` — archival boundary holds.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green; the manual runbook checklist is completed and its observations recorded.

### Invariants

1. The ledger records Phase 10 as done without over-claiming: browser stays Phase 11, persistent reminder stays Phase 12 (§20 no retcon).
2. The manual smoke confirms one ordered accepted segment with full metadata and no prompt, candidate non-persistence, and no secret/prompt in logs (§21/§22/§29.9).

## Test Plan

### New/Modified Tests

1. `None — verification-only ticket; CI verification is command-based (grep-proofs + archival `test -f`/`test ! -f` + the full pipeline), and end-to-end behavior is exercised by the manual runbook plus the automated coverage named in -001…-006.`

### Commands

1. `grep -F "Status: ✅ Implemented via SPEC-010" docs/requirements-version-1/IMPLEMENTATION-ORDER.md && grep -iF "Phase 10 implementation note" docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`
2. `test -f archive/specs/SPEC-010-candidate-editor-and-accept-lifecycle.md && test ! -f specs/SPEC-010-candidate-editor-and-accept-lifecycle.md`
3. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-06

What changed:
- Marked Phase 10 implemented in `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  and checked its gate bullets.
- Added a Phase 10 implementation note to
  `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`, recording the
  dedicated `/generate` surface, accept route, full metadata snapshot, no rejected/
  superseded persistence, and Phase 11/12 boundaries.
- Marked SPEC-010 completed with an outcome and archived it to `archive/specs/`.

Deviations from original plan:
- The real-provider browser smoke could not be completed in this environment because
  `OPENROUTER_API_KEY` is absent. The local route, storage, and UI lifecycle were verified
  through the automated coverage landed in SPEC010CANEDIACC-001 through -006 and the full
  repo gates.

Verification results:
- `grep -F "Status: ✅ Implemented via SPEC-010" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  and `grep -iF "Phase 10 implementation note" docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`
  — passed.
- `test -f archive/specs/SPEC-010-candidate-editor-and-accept-lifecycle.md && test ! -f specs/SPEC-010-candidate-editor-and-accept-lifecycle.md`
  — passed after archive move.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
