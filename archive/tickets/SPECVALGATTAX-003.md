# SPECVALGATTAX-003: Cast voice-pressure doctrine — remove `sparse-voice-pressure`, downgrade dialogue/ensemble blockers

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — removes the `sparse-voice-pressure` universal blocker (`universal-blockers.ts`); downgrades current-voice-pressure from a blocker to a warning in the dialogue/ensemble matrix (`matrix-voice.ts`); adds `local-voice-pressure-may-help` and `ensemble-voice-distinction-risk` warnings (`warnings.ts`); enum updates (`types.ts`). Production behavior change (durable voice anchors, not current pressure pins, gate dialogue).
**Deps**: None

## Problem

The validator treats current cast voice pressure as the primary voice authority: `sparse-voice-pressure` blocks any active speaker / POV narrator lacking a current pressure pin, and the dialogue/ensemble matrix rules block when speakers lack current voice pressure. The spec (§Current cast voice pressure doctrine) inverts this: the durable `CAST MEMBER` voice anchor is the primary authority (FOUNDATIONS §17); current voice pressure is optional scene-specific salience, so its absence must **warn**, not block. Current pressure may block only when user-supplied pressure text contradicts hard canon/state/POV/policy.

## Assumption Reassessment (2026-06-07)

1. `validateDialogueVoicePressure` (`packages/core/src/validation/rules/universal-blockers.ts:330-362`) emits `sparseVoicePressure` (blocker) for every `active_speaker`/`pov_narrator` lacking a voice anchor **or** a current pressure pin (`pressuredIds.has(castId)`). `matrix-voice.ts` `validateDialogueExpected` (line 14) requires `hasVoicePressure` as a blocker condition; `validateEnsembleDialogueExpected` (line 42) requires `distinctPins.size === speakerIds.length` as a blocker condition.
2. The spec (§Current cast voice pressure doctrine, §Expected local modes table rows `dialogue_expected`/`ensemble_dialogue_expected`) keeps as blockers: active speaker IDs selected, durable voice anchor present, listener/onstage status known, POV/prose-mode permits speech. It moves missing current voice pressure to a warning (`local-voice-pressure-may-help`), and ensemble pin distinctness to a grouped warning (`ensemble-voice-distinction-risk`).
3. Cross-artifact boundary under audit: `DIAGNOSTIC_CODES` (`types.ts:36`) ↔ the three rule files. `sparseVoicePressure` is removed; `localVoicePressureMayHelp` and `ensembleVoiceDistinctionRisk` are added (the spec already names `ensemble-voice-distinction-risk` in the matrix table and `local-voice-pressure-may-help` in §Current cast voice pressure doctrine).
4. FOUNDATIONS principle restated: §17 — "A durable cast dossier should distinguish stable voice identity from current-generation voice pressure. Stable voice identity belongs in a durable voice anchor. Current voice pressure pins are compiled salience duplicates." The voice anchor is binding; the pin is salience. The current blocker contradicts §17 by making the salience pin mandatory; this ticket aligns the validator to §17.
5. Fail-closed surface touched: removing `sparse-voice-pressure` and downgrading matrix conditions converts a quality-risk gate to a warning, which is the spec's intent and §11-correct (warnings advisory, blockers structural). The retained dialogue blocker (missing durable voice anchor when a speaker will speak) keeps the deterministic floor. The secret firewall (§15) and deterministic compilation (§8) are untouched; the new warnings never enter the compiled prompt.
6. Removes a diagnostic code: `grep -rn "sparse-voice-pressure" packages/ docs/` → `types.ts` (enum), `universal-blockers.ts` (producer, removed here), `docs/demo-blocker-recipes.md` + `docs/stress-coverage-matrix.md` (SPECVALGATTAX-005). No web test references it (confirmed by grep), so no SPECVALGATTAX-006 coupling for this code.

## Architecture Check

1. Locating the voice floor in the durable voice anchor (a record the user authors once) and treating current pressure as a warning matches the user-is-the-gate principle (§7, §17): the compiler must not flatten cast, but the user decides when a pin is needed. A blocker on the pin punished the common case (a fully-authored cast member with no scene-specific pin).
2. No backwards-compatibility alias: `sparse-voice-pressure` is removed, not renamed-in-place; the optional warning `local-voice-pressure-may-help` is a distinct, advisory code (the spec's "if retained as a warning, rename and rewrite" instruction).

## Verification Layers

1. Active speaker with a durable voice anchor but no current pressure pin -> no blocker, optional warning -> validation unit tests (`validation-matrix-voice.test.ts`, `validation-warnings-security.test.ts`).
2. Active speaker missing a durable voice anchor when speaking -> still blocks -> validation unit test (`validation-matrix-voice.test.ts`).
3. User-supplied contradictory voice pressure -> still blocks -> validation unit test (`validation-blockers.test.ts`).
4. `sparse-voice-pressure` removed -> codebase grep-proof (`grep -rn "sparse-voice-pressure" packages/core/src` returns nothing).

## What to Change

### 1. Remove the universal sparse-voice blocker (`universal-blockers.ts`)

Remove `validateDialogueVoicePressure` from `universalBlockerRules` and delete the function. Retain the contradiction path (user-supplied current pressure text that conflicts with hard canon / current state / POV / policy / durable voice) — if not already covered, add it as a narrow blocker keyed on contradiction, per the spec's "may block only when ... contradicts" list.

### 2. Downgrade the dialogue/ensemble matrix (`matrix-voice.ts`)

In `validateDialogueExpected`, drop `hasVoicePressure(...)` from the blocker condition; keep speaker-IDs-selected, durable voice anchor, POV knowledge, and relationship/status. In `validateEnsembleDialogueExpected`, drop the `distinctPins.size === speakerIds.length` blocker condition; keep ≥3 speakers, durable anchors, relationship/status, and audibility (line-of-sight/positions).

### 3. Add the salience warnings (`warnings.ts`)

Add `local-voice-pressure-may-help` (dialogue expected, durable anchor present, no current pressure pin, prompt long enough or unusual stress per the spec's warn-conditions) and `ensemble-voice-distinction-risk` (ensemble expected, pins absent or too similar).

### 4. Enum (`types.ts`)

Remove `sparseVoicePressure`; add `localVoicePressureMayHelp: "local-voice-pressure-may-help"` and `ensembleVoiceDistinctionRisk: "ensemble-voice-distinction-risk"`.

## Files to Touch

- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/validation/rules/matrix-voice.ts` (modify)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `packages/core/test/validation-matrix-voice.test.ts` (modify)
- `packages/core/test/validation-warnings-security.test.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify)

## Out of Scope

- `long-dossier-needs-pin` / `prompt-length-risk` regrouping (SPECVALGATTAX-004).
- Minimum-state and stop/handoff changes (SPECVALGATTAX-002).
- `docs/demo-blocker-recipes.md` / `docs/stress-coverage-matrix.md` sync (SPECVALGATTAX-005).

## Acceptance Criteria

### Tests That Must Pass

1. `dialogue_expected` with an active speaker holding a durable voice anchor but no current pressure pin produces no blocker (an optional `local-voice-pressure-may-help` warning is allowed).
2. `dialogue_expected` with a speaker lacking a durable voice anchor still blocks; user-supplied contradictory voice pressure still blocks.
3. `ensemble_dialogue_expected` with non-distinct pins warns (`ensemble-voice-distinction-risk`) but does not block on pin-distinctness alone.
4. `npm test` passes.

### Invariants

1. No current-voice-pressure absence ever sets a blocker; durable voice anchor presence is the deterministic dialogue floor (§17).
2. The new warnings are advisory only — they never gate Preview/Generate and never enter the compiled prompt (§11).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-voice.test.ts` — anchor-present-no-pin passes; anchor-missing blocks; ensemble pin-distinctness warns not blocks.
2. `packages/core/test/validation-warnings-security.test.ts` — `local-voice-pressure-may-help` and `ensemble-voice-distinction-risk` emit as warnings.
3. `packages/core/test/validation-blockers.test.ts` — contradictory user voice pressure still blocks; `sparse-voice-pressure` no longer emitted.

### Commands

1. `npm run -w @loom/core build && npx vitest run packages/core/test/validation-matrix-voice.test.ts packages/core/test/validation-warnings-security.test.ts packages/core/test/validation-blockers.test.ts`
2. `npm test`

## Outcome

Completion date: 2026-06-07

Removed `sparse-voice-pressure` as a universal blocker and removed current voice pressure pin presence/distinctness from dialogue and ensemble blocker conditions. Dialogue now gates on durable voice anchors plus language, POV knowledge, and relationship/status context; ensemble dialogue gates on three anchored speakers plus relationship/status and audibility/position context. Added advisory `local-voice-pressure-may-help` and `ensemble-voice-distinction-risk` warnings, and extended content-envelope validation to scan user-authored current voice pressure/override text so policy-contradictory pressure still blocks.

Deviations from original plan: updated the demo blocker recipe test to use a still-blocking dialogue matrix case (missing relationship/status context) because missing current pressure is intentionally no longer a blocker.

Verification results:

- `npm run -w @loom/core build` passed.
- `npx vitest run packages/core/test/validation-matrix-voice.test.ts packages/core/test/validation-warnings-security.test.ts packages/core/test/validation-blockers.test.ts packages/server/src/demo-blocker-recipes.test.ts packages/core/src/demo/stress-coverage.test.ts` passed.
- `npm test` passed: 95 test files, 564 tests.
- `rg -n "sparse-voice-pressure|sparseVoicePressure" packages/core/src` returned no matches.
