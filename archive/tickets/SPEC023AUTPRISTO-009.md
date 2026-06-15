# SPEC023AUTPRISTO-009: Capstone — non-leakage sentinel + isolation regression

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new server-side isolation/sentinel test surface + a manual verification runbook; no production behavior change
**Deps**: 008

## Problem

Isolation is the feature's most important property, and SPEC-023 is explicit: no implementation ticket may close by only proving the Notes CRUD path — at least one prompt/readiness non-leakage sentinel test must exist before the feature is considered complete. This capstone exercises the assembled pipeline end-to-end: it proves a note's content reaches none of validation, readiness, the prose prompt, the ideation prompt, the OpenRouter request body, or logs, and that note mutations never perturb the record graph. It introduces no new production logic.

## Assumption Reassessment (2026-06-15)

1. The pipeline surfaces the sentinel must probe already exist: the readiness route (`packages/server/src/readiness-routes.ts`), the compile/preview route (`packages/server/src/compile-routes.ts`), the generate route (`packages/server/src/generate-routes.ts`, exercised with a mocked OpenRouter client), and the ideation route (`packages/server/src/ideate-routes.ts` / `compileIdeation`). The notes routes/repository (005/004) and UI (007/008) are in place via this ticket's transitive `Deps: 008`.
2. SPEC-023 §"Isolation Guarantees & Tests" item 5 prescribes the sentinel `NOTE_SENTINEL_DO_NOT_PROMPT_9f7e3c1b` in a note's title+body, then asserts its absence from the validation snapshot JSON, readiness diagnostics, compiled prose prompt, ideation prompt, OpenRouter request body, and server logs; item 4 prescribes the no-record-graph-touch checks (note CRUD leaves `record_references`, selected working-set records, and record counts unchanged); §"Manual verification scenario" prescribes the UI runbook.
3. **Cross-artifact boundary under audit**: this is the capstone — it exercises tickets 002–008 end-to-end and modifies none of their files. Its `Deps: 008` is the transitive head of the linear implementation chain (008→007→006→005→004→{002,003}→001), so gating on 008 covers the full feature, including the routes the server sentinel drives. Counts (record totals, reference rows) are re-enumerated from the test fixture at test start, never hardcoded.
4. **FOUNDATIONS principle under audit (§10 / §15 / §29.4 / §29.12)**: the sentinel is the executable proof of the §29.12 hard-fails added by ticket 001 and of §10 (no prose/notes-derived prompt context) and §29.2/§29.4 (notes never become canon or compiler input). The no-record-graph-touch test proves §29.3 (notes are not working-set members).
5. **Enforcement-surface confirmation (§8/§15)**: the enforcement surfaces under audit are readiness/validation, the deterministic compiler, and the generate/ideate request builders. This ticket confirms — by sentinel assertion across all of them plus logs and the mocked OpenRouter body — that no path lets note content leak into a prompt, snapshot, request, or log. It changes none of those surfaces; it proves they remained isolated after the feature landed.

## Architecture Check

1. A single trailing isolation/sentinel test is the correct capstone shape: it concentrates the cross-surface non-leakage proof in one reviewable diff that exercises the composed pipeline, rather than scattering partial sentinels across the CRUD tickets. Re-enumerating counts from the fixture keeps the test robust to unrelated data changes.
2. No backwards-compatibility aliasing/shims; no production logic added — verification-only.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001; this gate must pass before the feature is considered complete.

## Verification Layers

1. The sentinel marker appears in NONE of: validation snapshot JSON, readiness diagnostics, compiled prose prompt, ideation prompt, OpenRouter request body, server logs -> server test (`fastify.inject` + mocked OpenRouter client) asserting absence on every surface.
2. Creating/updating/deleting notes leaves `record_references`, selected working-set records, and record counts unchanged -> server test with before/after counts re-read from the fixture.
3. No compiler golden gains a Notes section or empty state -> existing compiler golden tests re-run unchanged.
4. End-to-end manual scenario (project → sentinel note → Readiness/Preview/Generate/Ideate show nothing → delete → surfaces unchanged) -> manual runbook with per-step expected observable results.

## What to Change

### 1. `packages/server/src/story-notes-isolation.test.ts` (new) — automated sentinel + no-record-graph-touch

Insert a note whose title and body contain `NOTE_SENTINEL_DO_NOT_PROMPT_9f7e3c1b`. Then, via `fastify.inject` (and a mocked OpenRouter client for generate), invoke the readiness, compile/preview, generate, and ideate request-building paths and assert the sentinel appears in none of: the validation snapshot JSON, readiness diagnostics, the compiled prose prompt, the ideation prompt, the captured OpenRouter request body, and server logs. Separately, create/update/delete notes and assert `record_references` rows, the selected working-set record set, and record counts are unchanged (counts re-enumerated from the fixture).

### 2. Manual verification runbook (in this section; implementer-checklist)

Per SPEC-023 §"Manual verification scenario": (1) open a local project; (2) create a note titled `NOTE_SENTINEL_DO_NOT_PROMPT_manual` with the same sentinel in the body — **expected**: it appears in `/notes` and is searchable; (3) open Readiness, Preview, Generate, Ideate — **expected**: the sentinel appears nowhere outside `/notes`; (4) delete the note — **expected**: existing records, working set, story config, prompt preview, and the accepted-segment archive are unchanged.

## Files to Touch

- `packages/server/src/story-notes-isolation.test.ts` (new)

(Capstone introduces no production logic; it exercises tickets 002–008 and modifies none of their files. The manual runbook above is an implementer checklist, not a file.)

## Out of Scope

- Any new production behavior — this ticket is verification-only.
- The CRUD/route/migration unit tests owned by tickets 003–008 (this capstone does not duplicate them; it proves cross-surface isolation).
- FTS5, search-index, or any deferred SPEC-023 §Out-of-Scope item.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — `story-notes-isolation.test.ts` passes: the sentinel is absent from validation snapshot, readiness diagnostics, prose prompt, ideation prompt, OpenRouter request body, and logs.
2. `npm test --workspace @loom/server` — note create/update/delete leaves `record_references`, the selected working set, and record counts unchanged (fixture-derived counts).
3. `npm test` (full) and existing compiler golden tests pass unchanged — no golden gains a Notes section/empty state.

### Invariants

1. No prompt-building, readiness, validation, or OpenRouter path ever contains note content; the only place the sentinel is observable is the `/notes` surface and the `story_notes` table.
2. Note mutations are inert with respect to the record graph, working set, and accepted-segment archive.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-notes-isolation.test.ts` (new) — cross-surface sentinel non-leakage + no-record-graph-touch, via `fastify.inject` and a mocked OpenRouter client.

### Commands

1. `npm test --workspace @loom/server -- story-notes-isolation`
2. `npm test` (full pipeline, incl. compiler golden tests)
3. The manual runbook in What to Change §2 is an implementer checklist (UI smoke); it is not CI-runnable and is verified by hand against a copy of a local project.

## Outcome

Completed on 2026-06-15.

Changed files:

- `packages/server/src/story-notes-isolation.test.ts` adds the capstone isolation test suite.

Verification added:

- Inserts `NOTE_SENTINEL_DO_NOT_PROMPT_9f7e3c1b` into a private note in a populated demo project.
- Asserts the sentinel is absent from `/api/validate`, `/api/readiness`, prose `/api/compile`, ideation `/api/compile`, `/api/generate`, `/api/ideate`, captured OpenRouter request arguments, and server logs.
- Separately creates, updates, and deletes a note while asserting record count, `record_references` count, selected working-set response, and accepted-segment response remain unchanged.
- Uses the existing demo project fixture and mocked OpenRouter client; no production behavior changed.

Commands run:

- `npm test --workspace @loom/server -- story-notes-isolation`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build` (passed; Vite emitted the existing large-chunk warning)

Manual runbook:

- Preserved in this archived ticket's What to Change §2 as the implementer checklist. The automated capstone covers the non-leakage and graph-inertness acceptance criteria; no separate manual artifact was created.
