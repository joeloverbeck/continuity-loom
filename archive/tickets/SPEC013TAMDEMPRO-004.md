# SPEC013TAMDEMPRO-004: Demo blocker recipes doc + blocker-recipe tests

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `docs/demo-blocker-recipes.md`; new server test asserting each recipe fires its blocker and disables preview/send (no production logic)
**Deps**: SPEC013TAMDEMPRO-001, SPEC013TAMDEMPRO-002

## Problem

SPEC-013 D4 requires the 8 demo blocker scenarios documented as reproducible normal-edit recipes — each naming its expected blocker — plus tests that start from the valid demo, apply each edit through the normal record/brief paths, and assert the corresponding deterministic validation blocker fires and disables preview/send. Ship only the valid demo; breakage is documented + test-asserted, with no pre-broken fixtures and no blocker-toggle UI (spec §Scope decision 1).

## Assumption Reassessment (2026-06-06)

1. All 8 recipes map to real **blocker-severity** diagnostics, verified in `packages/core/src/validation/types.ts` and the rule files: `object-current-holder-contradiction` (`universal-blockers.ts:171`), `impossible-action-physical-context` (`:321`), `offstage-interruption-missing-route` (`:291`), `prompt-facing-prose-contamination` (`:388/415/427`), `hidden-truth-in-pov-knowledge` (`:264`), `local-prose-scope-violation` (`:60`), `sparse-voice-pressure` (`:353`; also `matrix-dialogue-incomplete`, `matrix-voice.ts:33`), `matrix-physical-interaction-incomplete` (`matrix-physical.ts:46`). Codes confirmed in `validation/types.ts:44-91`.
2. SPEC-013 (reassessed in-session 2026-06-06) §Approach 4 ships the recipe→diagnostic-code mapping table; §Deliverables ties `docs/demo-blocker-recipes.md` to it. The valid baseline comes from SPEC013TAMDEMPRO-001; the asserting test instantiates it via `POST /api/project/create-demo` (SPEC013TAMDEMPRO-002) and exercises the deterministic gate via `POST /api/validate` and the validation-gated `POST /api/compile` (`packages/server/src/validate`/`compile-routes.ts`).
3. Shared boundary under audit: the recipe set is a contract shared by the human-facing doc (UI edit steps) and the executable test (programmatic edits via `PUT /api/records/:id` + `PUT /api/generation-brief` / `PUT /api/working-set`). Each doc recipe's named code must equal the code the test asserts and must exist in `validation/types.ts` — doc↔test↔engine parity.
4. FOUNDATIONS principle / Validation Rule motivating this ticket: §11 (validation is deterministic and blocking; blockers ≠ warnings; no v1 override). Recipe 4 specifically distinguishes the **engine** blocker `prompt-facing-prose-contamination` from the Phase-5 brief-editor paste-guard, which is a non-blocking soft warning (`docs/requirements-version-1/UI-WORKFLOWS.md`) — the test targets the engine, not the editor. Restated before trusting spec narrative.
5. Fail-closed / secret-firewall surface exercised: the enforcement surfaces are `packages/core/src/validation/rules/universal-blockers.ts`, `matrix-physical.ts`, `matrix-voice.ts` (gating preview/send via SPEC-008). Recipe 5 (`hidden-truth-in-pov-knowledge`) is a §15 secret-firewall assertion. This ticket adds no validator and weakens nothing — it proves the existing fail-closed gate and firewall fire on the demo; the deterministic compile gate stays blocking.

## Architecture Check

1. Documenting blockers as normal-edit recipes + asserting them programmatically from the single valid fixture (rather than shipping pre-broken fixtures or a demo-only toggle UI) keeps the demo "ordinary project data" and exercises the real validation gate, not a special path (FOUNDATIONS §4.4/§11). Co-locating the doc with its executable assertion guarantees the doc cannot drift from the engine without a test failure.
2. No backwards-compatibility aliasing/shims: net-new doc + test; no production code changes.

## Verification Layers

1. Each recipe fires its named blocker -> schema/validation: `POST /api/validate` after applying recipe N returns a diagnostic whose `code` equals the mapped code (8 sub-cases).
2. Each recipe disables preview/send -> fail-closed gate: with recipe N applied, `POST /api/compile` is blocked (no compiled prompt returned), proving the SPEC-008 validation gate holds.
3. Recipe 4 targets the engine blocker, not the editor warning -> FOUNDATIONS alignment check (§11): the asserted `prompt-facing-prose-contamination` originates from `/api/validate`, distinct from the non-blocking editor paste-guard.
4. Doc↔test↔engine parity -> codebase grep-proof: every code named in `docs/demo-blocker-recipes.md` is asserted in the test and present in `packages/core/src/validation/types.ts`.

## What to Change

### 1. Blocker recipes doc

Add `docs/demo-blocker-recipes.md`: for each of the 8 scenarios, give the starting demo state, the exact normal edit (which record/brief field to change and to what), the expected blocker (plain-language message + diagnostic code from the SPEC-013 Approach §4 table), and the expected preview/send disablement. Include the engine-blocker-vs-editor-warning note for recipe 4.

### 2. Blocker-recipe test

Add `packages/server/src/demo-blocker-recipes.test.ts`: create the demo, then for each recipe apply the edit through the normal record/brief routes, assert `/api/validate` reports the mapped blocker code, and assert `/api/compile` is blocked. Drive the 8 cases from a table so doc and test share one recipe list.

## Files to Touch

- `docs/demo-blocker-recipes.md` (new)
- `packages/server/src/demo-blocker-recipes.test.ts` (new)

## Out of Scope

- Pre-broken demo variants or interactive blocker-toggle UI (spec §Out of Scope).
- Adding, renaming, or changing any validation rule — recipes target existing blockers only (spec §Out of Scope).
- The stress-suite coverage matrix and capability tests (SPEC013TAMDEMPRO-005).
- The valid-baseline end-to-end accept/reminder flow (SPEC013TAMDEMPRO-006).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/demo-blocker-recipes.test.ts` — all 8 recipes fire their mapped blocker and block `/api/compile`.
2. `grep -oE '[a-z-]+-(contradiction|context|route|contamination|knowledge|violation|pressure|incomplete)' docs/demo-blocker-recipes.md` — every emitted code resolves in `packages/core/src/validation/types.ts`.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. Every recipe asserts a blocker-severity diagnostic (never a warning) and a blocked preview — fail-closed (§11), no v1 override.
2. The doc's recipe→code list and the test's table stay identical (single source); no code appears in one but not the other.

## Test Plan

### New/Modified Tests

1. `packages/server/src/demo-blocker-recipes.test.ts` — table-driven: 8 recipes × (blocker-code assertion + compile-blocked assertion) from the valid demo baseline.

### Commands

1. `npx vitest run packages/server/src/demo-blocker-recipes.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted server test is the correct boundary (it instantiates the demo and drives `/api/validate` + `/api/compile`); a pure core-validation test could not prove "disables preview/send," so the server gate is the right surface.

## Outcome

Completed: 2026-06-06

What changed:
- Added `docs/demo-blocker-recipes.md` documenting the 8 normal-edit blocker recipes, expected diagnostic codes, and compile-blocked result.
- Added `packages/server/src/demo-blocker-recipes.test.ts`, which creates a fresh demo through `POST /api/project/create-demo`, applies each recipe through normal record/brief HTTP routes, asserts the named blocker, and asserts `/api/compile` returns `validation-blocked` with no prompt.
- Refined the demo fixture baseline so it validates cleanly before breakage: added `use` to the visible affordance action families and added the non-POV-interiority current-state lock required by the existing matrix validation rules.
- Amended the archived SPEC013TAMDEMPRO-001 outcome to record the fixture refinement.

Deviations from original plan:
- Recipe 2 uses the existing physical-context validator mechanics by pairing the hidden-letter directive with removed route context; the current validator does not semantically infer object access from the directive text alone.
- Recipe 7 removes Niko's current cast voice row rather than deleting the required CAST MEMBER `voice_anchor`, preserving schema-valid normal edits while still firing `sparse-voice-pressure`.

Verification:
- `npx vitest run packages/core/src/demo/demo-fixture.test.ts packages/server/src/demo-blocker-recipes.test.ts` passed.
- The documented grep/code-resolution check passed for all recipe codes.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
