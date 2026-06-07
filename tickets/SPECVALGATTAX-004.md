# SPECVALGATTAX-004: Grouped salience warnings — `cast-salience-risk` and `prompt-middle-salience-risk`

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — replaces the per-record `long-dossier-needs-pin` warning with a once-per-result grouped `cast-salience-risk`; renames `prompt-length-risk` to `prompt-middle-salience-risk` (`warnings.ts`); enum updates (`types.ts`). Production behavior change (warning shape and codes change; still advisory).
**Deps**: None

## Problem

The spec (§Long dossier warning doctrine, §Invalid diagnostics) says a diagnostic that "repeats the same warning once per record without grouping" is invalid. The current `long-dossier-needs-pin` fires once per long cast record (`warnings.ts:62`), and `prompt-length-risk` is the existing lost-in-the-middle warning (`warnings.ts:16`). Replace the per-record warning with a single grouped `cast-salience-risk` carrying the affected cast labels, and rename `prompt-length-risk` to `prompt-middle-salience-risk` so there is one lost-in-the-middle warning, not two parallel ones.

## Assumption Reassessment (2026-06-07)

1. `warnLongDossierNeedsPin` (`packages/core/src/validation/rules/warnings.ts:62`) returns one warning per long `CAST MEMBER` record lacking a pin. `warnPromptLengthRisk` (line 16) emits `prompt-length-risk` once when the snapshot is large. Both are already `severity: "warning"` via the local `warning(...)` helper (line 95).
2. The spec (§`cast-salience-risk`) wants one warning per readiness result, payload = affected cast display labels, which have durable voice anchors, which lack optional local pressure rows, whether dialogue/close-POV is expected, and a fastest-fix string. The spec (§`prompt-middle-salience-risk`) explicitly says it "replaces the existing `prompt-length-risk` warning ... Rename or rewrite that rule."
3. Cross-artifact boundary under audit: `DIAGNOSTIC_CODES` (`types.ts:36`) ↔ `warnings.ts`. `longDossierNeedsPin` and `promptLengthRisk` are removed; `castSalienceRisk` and `promptMiddleSalienceRisk` are added.
4. FOUNDATIONS principle restated: §11 — "The app should distinguish warnings from blockers. Length warnings, lost-in-the-middle warnings, salience doubts ... may be warnings." §28.2 grounds the lost-in-the-middle warning in the Liu et al. result the spec's §Research basis cites. These are warnings only; they must never gate generation.
5. Renames/removes diagnostic codes: `grep -rn "long-dossier-needs-pin\|prompt-length-risk" packages/ docs/` → `types.ts` (enum), `warnings.ts` (producers, changed here), web `ValidationPanel.test.tsx` / `ValidationResultView.test.tsx` reference `prompt-length-risk` (Readiness/UX-owned — folded into SPECVALGATTAX-006 per F2), `docs/stress-coverage-matrix.md` (SPECVALGATTAX-005). Producers + enum land here.

## Architecture Check

1. One grouped `cast-salience-risk` per result is both more actionable (it names the cast member whose local stress matters most as the fastest fix) and aligned with the spec's "invalid if it repeats the same warning once per record without grouping." A single lost-in-the-middle code removes the redundant second warning path.
2. No backwards-compatibility alias: the old codes are removed, not kept as aliases; the grouped payload is the new shape, not a wrapper over the per-record warning.

## Verification Layers

1. Long active cast dossiers without pins -> exactly one `cast-salience-risk` warning (not one per record) -> validation unit test (`validation-warnings-security.test.ts`).
2. Large snapshot -> one `prompt-middle-salience-risk` warning, no `prompt-length-risk` -> validation unit test (`validation-warnings-security.test.ts`).
3. Both remain warnings (never blockers) -> validation unit test asserting `severity === "warning"` and `isBlocked` unaffected.

## What to Change

### 1. Grouped cast-salience warning (`warnings.ts`)

Replace `warnLongDossierNeedsPin` with `warnCastSalienceRisk`: when ≥1 long active cast dossier lacks a current pressure pin, emit a single `cast-salience-risk` warning whose affected list carries the cast display labels (and the spec's payload fields where the snapshot exposes them). Register the replacement in `warningRules`.

### 2. Rename the lost-in-the-middle warning (`warnings.ts`)

Rename `warnPromptLengthRisk` → `warnPromptMiddleSalienceRisk` emitting `prompt-middle-salience-risk`; keep the size threshold and the advisory message (citing the prompt-length estimate / diluted sections per the spec).

### 3. Enum (`types.ts`)

Remove `longDossierNeedsPin` and `promptLengthRisk`; add `castSalienceRisk: "cast-salience-risk"` and `promptMiddleSalienceRisk: "prompt-middle-salience-risk"`.

## Files to Touch

- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/src/validation/types.ts` (modify)
- `packages/core/test/validation-warnings-security.test.ts` (modify)

## Out of Scope

- `local-voice-pressure-may-help` / `ensemble-voice-distinction-risk` (SPECVALGATTAX-003).
- Web validation panel/test updates for `prompt-length-risk` (folded into SPECVALGATTAX-006).
- `docs/stress-coverage-matrix.md` sync (SPECVALGATTAX-005).

## Acceptance Criteria

### Tests That Must Pass

1. Two long pin-less active cast dossiers produce exactly one `cast-salience-risk` warning (grouped, not two).
2. A large snapshot produces `prompt-middle-salience-risk` and never `prompt-length-risk`.
3. Both warnings leave `isBlocked` false and never appear in the compiled prompt; `npm test` passes.

### Invariants

1. `cast-salience-risk` is emitted at most once per readiness result (§Invalid diagnostics: no per-record repetition).
2. `long-dossier-needs-pin` and `prompt-length-risk` have zero producing sites after this ticket.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-warnings-security.test.ts` — grouped `cast-salience-risk` single-emission; `prompt-middle-salience-risk` replaces `prompt-length-risk`; both stay warnings.

### Commands

1. `npm run -w @loom/core build && npx vitest run packages/core/test/validation-warnings-security.test.ts`
2. `npm test`
