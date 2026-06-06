# SPEC009OPEGLOBSET-010: Phase-9 capstone — manual smoke, governing-doc updates, archival

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes (docs/bookkeeping only) — `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase-9 status, `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` Phase-9 note, and the archival move of `specs/SPEC-009-…md` → `archive/specs/`.
**Deps**: SPEC009OPEGLOBSET-007, SPEC009OPEGLOBSET-008, SPEC009OPEGLOBSET-009

## Problem

Once the server transport, routes, web settings surface, candidate panel, and env example all ship, Phase 9 needs its end-to-end manual smoke run and its completion bookkeeping: flip the Phase-9 status in the implementation-order ledger, add a realized-implementation note to the OpenRouter authority doc, and archive the spec. This trailing ticket exercises the composed pipeline (it adds no production logic) and records the phase as done. It is the merged capstone + cross-cutting-docs shape: the spec's §Verification ends in a manual UI smoke (the project has no browser-automation harness for its own app), and the bookkeeping is gated on that smoke passing.

## Assumption Reassessment (2026-06-06)

1. The upstream implementation tickets are the leaf set SPEC009OPEGLOBSET-007 (settings surface), -008 (candidate panel), and -009 (env example); their transitive `Deps` cover -001…-006. No further production code is introduced here. The automated §Verification assertions (fail-closed send, missing-key, key-never-leaks, transport-correctness, no-durable-writes, read-only-ephemeral, model-list-resilience, settings-global) are each owned by the upstream tickets' test plans — this ticket does **not** duplicate them as new test files.
2. `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 9 (lines ~155–171) is the gate to flip; `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` is the authority doc to annotate; both verified present. `specs/SPEC-009-…md` Deliverable 9 specifies: add `Status: ✅ Implemented via SPEC-009 (YYYY-MM-DD)` + check the Phase-9 gate bullets, add a short "Phase 9 implementation note" recording the realized transport, and archive per `docs/archival-workflow.md`. The 8 archived SPEC-001…008 in `archive/specs/` confirm the archival convention exists and the move target (`archive/specs/SPEC-009-…md`) is currently free.
3. Cross-artifact boundary under audit: this ticket only annotates *aggregate completion* (a status flip + a realized-implementation note) and moves the spec file — it does not cite individually-staleable symbols, so a leaf-set `Deps` is sufficient. The Phase-9 note must accurately reflect the realized contract (global config file location, env-only key, `/api/generate` fail-closed gate, normalized categories, **read-only ephemeral** candidate, candidate lifecycle deferred to Phase 10).
4. FOUNDATIONS principle motivating this ticket — §20 (durable change & human gatekeeping → no silent retcon: the doc updates make the landed work explicit) and §29.9 / §22 (the manual smoke confirms no key/prompt/candidate leaks to console/logs and no candidate is persisted). Restated: bookkeeping records reality; it does not change runtime behavior.
5. Manual-smoke surface: per `docs/requirements-version-1/TESTING-STRATEGY.md`, OpenRouter is mocked in automated tests; the live-key smoke is a manual runbook step, not CI. The smoke must confirm the browser console / network logs contain no key, no full prompt, and no persisted candidate.

## Architecture Check

1. A single trailing ticket for the smoke + bookkeeping avoids a needless inter-ticket dependency: the docs/status flip is gated on the same smoke the capstone runs, and both depend on the same leaf set, so merging them is cleaner than splitting. It introduces no production logic, so it cannot regress the implementation tickets.
2. No backwards-compatibility shim: documentation and an archival move only.

## Verification Layers

1. Phase-9 status flipped → grep-proof: `IMPLEMENTATION-ORDER.md` Phase 9 shows the `✅ Implemented via SPEC-009` status line.
2. Realized note present → grep-proof: `OPENROUTER-INTEGRATION.md` contains the "Phase 9 implementation note" naming read-only ephemeral candidate + Phase-10 deferral.
3. Spec archived → `test -f archive/specs/SPEC-009-openrouter-global-settings-and-send.md` **and** `test ! -f specs/SPEC-009-openrouter-global-settings-and-send.md`.
4. Manual smoke (runbook) → implementer checklist: each step's expected observable result confirmed by hand (not CI-runnable).

## What to Change

### 1. Manual smoke runbook (implementer-executed)

`npm start`; open a project. In **Settings** (with `OPENROUTER_API_KEY` set in `.env`), set a model + parameters; confirm "API key configured". On **Validation / Prompt Preview** with a blocker-free state, click **Generate**; confirm a **read-only** candidate appears with a "draft — not accepted" notice; click **Clear** and confirm it empties. Unset the key and confirm a clear "configure key in Settings" error with no candidate and no crash. Confirm the browser console / network logs contain no key, no full prompt, and no persisted candidate (check `localStorage`/`sessionStorage`).

### 2. Governing-doc updates (gated on the smoke passing)

- `IMPLEMENTATION-ORDER.md` Phase 9: add `Status: ✅ Implemented via SPEC-009 (2026-06-06).` and check the Phase-9 gate bullets; note that the candidate **lifecycle** (edit/regenerate/discard/accept) remains Phase 10 and that Phase 9 ships only read-only ephemeral candidate display.
- `OPENROUTER-INTEGRATION.md`: add a short "Phase 9 implementation note" recording the realized transport (global config-file location, env-only key, `/api/generate` fail-closed gate, normalized categories, read-only ephemeral candidate, lifecycle deferred to Phase 10).

### 3. Archive the spec

Move `specs/SPEC-009-openrouter-global-settings-and-send.md` → `archive/specs/` per `docs/archival-workflow.md`.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify — Phase-9 status + gate checks)
- `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` (modify — Phase-9 implementation note)
- `specs/SPEC-009-openrouter-global-settings-and-send.md` → `archive/specs/SPEC-009-openrouter-global-settings-and-send.md` (archival move)

## Out of Scope

- Any production code — all server/web implementation is in SPEC009OPEGLOBSET-001…-008; the env example is -009.
- New automated tests — the §Verification automated assertions are owned by the upstream tickets; this ticket adds none.
- Candidate lifecycle (edit/regenerate/discard/accept), accepted-segment archive — Phases 10–11.

## Acceptance Criteria

### Tests That Must Pass

1. Full pipeline green after all upstream tickets: `npm run typecheck && npm run lint && npm test && npm run build`.
2. `IMPLEMENTATION-ORDER.md` Phase 9 shows the `✅ Implemented via SPEC-009` status line with the gate bullets checked.
3. `OPENROUTER-INTEGRATION.md` carries the Phase-9 implementation note (read-only ephemeral candidate; lifecycle deferred to Phase 10).
4. The spec file lives at `archive/specs/…` and no longer at `specs/…`.
5. Manual smoke runbook completed: read-only candidate appears + Clear empties it + missing-key error is clear + no key/prompt/candidate in console/logs/storage.

### Invariants

1. Bookkeeping reflects the realized implementation with no silent retcon (§20).
2. The manual smoke confirms the secret/ephemerality guarantees end-to-end (§22, §29.9).

## Test Plan

### New/Modified Tests

1. `None — capstone/docs ticket; CI verification is the upstream tickets' suites plus the full-pipeline command, and the live-key smoke is a manual runbook (OpenRouter is mocked in automated tests per TESTING-STRATEGY.md).`

### Commands

1. `npm run typecheck && npm run lint && npm test && npm run build`
2. `grep -n "Implemented via SPEC-009" docs/requirements-version-1/IMPLEMENTATION-ORDER.md && grep -n "Phase 9 implementation note" docs/requirements-version-1/OPENROUTER-INTEGRATION.md`
3. `test -f archive/specs/SPEC-009-openrouter-global-settings-and-send.md && test ! -f specs/SPEC-009-openrouter-global-settings-and-send.md && echo archived`

## Outcome

Completion date: 2026-06-06.

What changed:

- Completed the Phase 9 capstone smoke with `npm start` on `127.0.0.1:4173`.
- Updated `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` with the SPEC-009 implemented status, checked Phase 9 gate bullets, and the Phase 10 lifecycle deferral note.
- Updated `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` with the Phase 9 implementation note covering global config location, env-only key handling, fail-closed `/api/generate`, normalized errors, read-only ephemeral candidate display, and Phase 10 lifecycle deferral.
- Marked and archived `specs/SPEC-009-openrouter-global-settings-and-send.md` after completion.

Deviations:

- The live-key smoke used `.env` sourced into the `npm start` process environment; `npm start` itself does not load `.env`.
- The Phase 9 UI remains read-only and ephemeral by design. Editable candidate lifecycle behavior remains Phase 10.

Verification results:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 56 files, 324 tests.
- `npm run build` passed.
- Live-key browser smoke confirmed Settings showed the key configured, model refresh populated models, Generate produced a draft candidate, Clear removed it, and `localStorage`/`sessionStorage` stayed empty.
- No-key browser/API smoke confirmed a blocker-free project compiled, `/api/generate` returned `category: "missing-key"` with no candidate, the UI showed "API key missing. Configure it in Settings.", and browser storage stayed empty.
- Browser console artifact contained only the expected 409 from a preview reload before an active project was selected; it contained no key, prompt, or candidate text.
