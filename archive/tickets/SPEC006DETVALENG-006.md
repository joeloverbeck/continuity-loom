# SPEC006DETVALENG-006: Context-dependent matrix — voice/dialogue/presence rows

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule module `validation/rules/matrix-voice.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule family 3 (one of four matrix clusters): the voice/dialogue/presence rows of the context-dependent validation matrix (`docs/compiler-contract.md` §6 / `docs/requirements-version-1/VALIDATION-ENGINE.md`). When present, these focus tags activate cast-voice completeness gates: `dialogue_expected` (active speakers require core CAST MEMBER dossier, voice anchor, current voice pressure or sufficient pin, language/register state, POV knowledge boundaries, relationship/status context), `ensemble_dialogue_expected` (≥3 likely speakers require distinct voice pins, speaker functions, relationship/status pressure, audibility/interruptibility state), `active_silent_presence_expected` (core dossier, `body_presence_core`, position/visibility, `nonverbal_or_silence_pressure`, allowed actions, POV access limits), and `present_minor_speech_possible` (compressed voice note sufficient for a line, or promotion to active/onstage).

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic`, barrel) is created by SPEC006DETVALENG-001. This ticket adds `rules/matrix-voice.ts` and appends to `rules/index.ts`. The activating tags `dialogue_expected`, `ensemble_dialogue_expected`, `active_silent_presence_expected`, `present_minor_speech_possible` are members of `generationValidationFocusSchema...expected_local_modes` (`packages/core/src/records/generation-brief.ts`).
2. Binding source: `compiler-contract.md` §6 matrix rows + `VALIDATION-ENGINE.md`. Field inputs: CAST MEMBER dossier fields incl. `voice_anchor`/`body_presence_core` (`packages/core/src/records/cast-member.ts`, `cast-member-sections.ts`), `currentCastVoicePressureSchema` and `activeWorkingSetSchema.active_onstage_cast_full[].local_function` (`generation-brief.ts`). The `local_function` enum includes `active_speaker`, `active_silent`, `present_minor_speaker`, `pov_narrator`.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature; parallel sibling with tickets 004/005/007 (append-only). Rules activate only on their tag.
4. FOUNDATIONS §17 (character voice is continuity) restated: active/onstage cast must not be flattened into interchangeable speech; the compiler must not impose token-budget compression — the user is the gate. These rows block when an active dialogue/voice focus lacks enough voice/body pressure to avoid generic rendering. The engine warns/blocks but never compresses or rewrites cast (no mutation).
5. Fail-closed/determinism surface named: voice-pressure sufficiency is evaluated as deterministic presence/non-blank of named CAST MEMBER/`current_cast_voice_pressure` fields and speaker-count thresholds (`>= 3` for ensemble), never a prose-quality/"genericness" heuristic and never an LLM judgement. No leakage or nondeterminism path; the matrix only checks input presence the Phase-7 compiler will later render.

## Architecture Check

1. Clustering the voice/dialogue/presence rows under §17 keeps the cast-voice review surface in one diff and separates speaker-count and voice-pressure-presence logic from the physical (005) and durable-change (007) clusters. Speaker counting is a deterministic count over `active_onstage_cast_full` entries with speaking `local_function`s.
2. No backwards-compatibility aliasing/shims: net-new rule module.

## Verification Layers

1. Each tag's blockers fire when the tag is present and required voice/dossier fields are missing (and, for ensemble, when ≥3 speakers lack distinct pins) -> unit test per row.
2. Each row is silent when its tag is absent and when present-and-complete -> unit test (negatives).
3. Voice/dossier field requirements -> FOUNDATIONS alignment check (§17) + schema validation against CAST MEMBER / `currentCastVoicePressureSchema` field names.

## What to Change

### 1. Voice/dialogue/presence matrix rules

`packages/core/src/validation/rules/matrix-voice.ts` — tag-activated predicates:
- `dialogue_expected` → active speakers have core dossier, voice anchor, current voice pressure or sufficient pin, language/register state, POV knowledge boundaries, relationship/status context.
- `ensemble_dialogue_expected` → ≥3 likely speakers have distinct voice pins, current speaker functions, relationship/status pressure, physical/auditory state (who can hear/interrupt whom).
- `active_silent_presence_expected` → active silent cast core dossier, `body_presence_core`, current position/visibility, `nonverbal_or_silence_pressure`, allowed actions, POV access limits.
- `present_minor_speech_possible` → present-minor speaker has a compressed voice note sufficient for a line, or is promoted to active/onstage; otherwise block material speech.

### 2. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `voiceMatrixRules` and spread into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/matrix-voice.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-matrix-voice.test.ts` (new)

## Out of Scope

- Knowledge/secret/POV rows — ticket 004.
- Physical/perception/offstage rows — ticket 005.
- Durable-change rows — ticket 007.
- The unconditional "materially-involved cast missing core dossier" blocker — ticket 003 (activation-distinct; this ticket handles the focus-tag-activated voice checks only).

## Acceptance Criteria

### Tests That Must Pass

1. Each of the four tags' blockers fires on a snapshot where the tag is set and a required field is missing; `ensemble_dialogue_expected` fires when ≥3 speakers lack distinct pins.
2. Each row is silent when its tag is absent and when the tag is present with all required fields populated.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. A matrix row contributes diagnostics only when its activating focus tag is present.
2. Voice sufficiency is deterministic presence/count over named cast fields — never a prose-quality heuristic, never compression of cast, never an LLM.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-voice.test.ts` — per-row tag-present-missing, ensemble speaker-count, tag-absent, and tag-present-clean cases.

### Commands

1. `npm test -- validation-matrix-voice`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the voice/dialogue/presence context-dependent matrix cluster:

- Added `validation/rules/matrix-voice.ts` with tag-gated blockers for `dialogue_expected`, `ensemble_dialogue_expected`, `active_silent_presence_expected`, and `present_minor_speech_possible`.
- Registered the voice matrix rule family in the validation rule barrel.
- Added stable matrix diagnostic codes for incomplete dialogue, ensemble dialogue, active silent presence, and present minor speech rows.
- Added `packages/core/test/validation-matrix-voice.test.ts` covering tag-absent silence, tag-present clean silence, and tag-present missing-state blockers for each row.

Deviation from original plan: voice sufficiency is deliberately implemented as named-field presence and distinct current-pressure text for ensemble speakers, not a prose-quality heuristic or compression step.

Verification:

- `npm test -- validation-matrix-voice` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
