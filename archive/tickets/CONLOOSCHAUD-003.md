# CONLOOSCHAUD-003: Normalize current cast voice pressure and repair present-minor delivery

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — removes `current_cast_voice_pressure[].local_function` from core schema/draft/descriptor/guidance + a generation-session migration step; rewrites the matrix-voice present-minor speech blocker to derive role from cast band + deliverable speech guidance; delivers present-minor current voice pressure into the compressed cast band (prose-only); removes the redundant `{voice_pressure}` placeholder lane; compiled prose prompt changes (present-minor pressure added, `{voice_pressure}` removed); ideation prompt voice-delivery output unchanged
**Deps**: archive/tickets/CONLOOSCHAUD-002.md

## Problem

Three coupled defects in current cast voice pressure (spec §6):

1. **Duplicate authority** — `current_cast_voice_pressure[].local_function` repeats role authority that already belongs to `active_working_set.active_onstage_cast_full[].local_function`; a mismatch creates two competing claims about the same character's local function. Its only extra enum member, `present_minor_speaker`, does not justify a second role field.
2. **Redundant lane** — the `{voice_pressure}` placeholder (resolver in `packages/core/src/compiler/sections/pressure.ts`) renders `current_cast_voice_pressure[].current_voice_pressure` for every entry, duplicating what `{active_cast_voice_pressure_pins}` already carries (with richer per-cast detail) for active cast.
3. **Present-minor delivery gap** — `renderCompressedCastBand` (`packages/core/src/compiler/sections/cast.ts`) omits the per-cast `currentVoicePressureLines` serializer, so present-minor dialogue / POV-narration / nonverbal pressure never reaches the writer. Validation (`matrix-voice.ts`) can require/clear present-minor speech via a field the renderer drops — a validation pass that does not correspond to delivered prompt material.

These cannot be fixed independently: removing `local_function` breaks its sole blocking consumer (`hasPresentMinorVoicePressure`, matrix-voice.ts:178), and removing `{voice_pressure}` without delivering present-minor pressure would drop present-minor `current_voice_pressure` entirely (spec §6.3).

## Assumption Reassessment (2026-06-20)

1. `current_cast_voice_pressure[].local_function` exists in `packages/core/src/records/generation-brief.ts:71` (within `currentCastVoicePressureSchema`) and `generation-brief-draft.ts`. The working-set `active_onstage_cast_full[].local_function` (`generation-brief.ts:12`) is the distinct, retained role authority. The `{voice_pressure}` resolver is at `packages/core/src/compiler/sections/pressure.ts:52` (NOT `cast.ts`); the placeholder union member is `placeholder-map.ts:95`; its empty state is `empty-states.ts:89`; the template literal is `template-constants.ts:241`. Verified by read/grep 2026-06-20.
2. `renderCompressedCastBand` (`cast.ts:80`) takes `(snapshot, castBand)` with no ideation flag, serves both `present_minor_cast_compressed` and `offstage_relevant_cast`, and emits identity one-line + voice anchor + `overrideLines` only — it does not call `currentVoicePressureLines` (`cast.ts:174`), which is used only by `renderActiveVoicePins` (`cast.ts:60`). `matrix-voice.ts` `validatePresentMinorSpeechPossible` (line 104) gates on the `present_minor_speech_possible` focus tag and clears when each present-minor id is promoted to active OR `hasPresentMinorVoicePressure` (line 175) returns true; that helper reads `pressure.local_function === "present_minor_speaker"`. `docs/story-record-schema.md` §3.5, `docs/compiler-contract.md`, `docs/prompt-template.md` (`{voice_pressure}` at line 220), `docs/prompt-template-rationale.md` §§9–11, `docs/validation-rule-inventory.md`, and `docs/ideation-prompt-template.md` are the authority docs. Spec: `specs/continuity-loom-schema-audit-and-changes.md` §6.
3. Cross-artifact boundary under audit: the generation-session voice-pressure schema (`generation-brief.ts`/`draft`) ↔ the compiler placeholder set (`placeholder-map.ts`/`types.ts`/`empty-states.ts`/`template-constants.ts`) and its resolvers (`pressure.ts`, `cast.ts`) ↔ the voice validation rule (`matrix-voice.ts`) ↔ the server draft migration (`generation-session-draft-migration.ts`) ↔ the prose + ideation goldens ↔ the five voice/compiler authority docs. This is an information-path consolidation: present-minor `current_voice_pressure` currently has two lawful transports (`{voice_pressure}` and — for active only — pins); the canonical end-state is the pins lane for active cast and the compressed-band lane for present-minor cast, with `{voice_pressure}` removed.
4. FOUNDATIONS principles motivating the ticket: §17 (character voice is continuity; durable identity vs current-generation pressure; pins are deliberate salience duplicates, not a third frame), §11 (a voice blocker must correspond to delivered authority; optional pressure stays a warning where durable/compressed authority suffices), §8 (deterministic, snapshot-only rendering), §13 (remove duplicate authority). §29.5/§29.11: the blocker is made stricter in the correct sense without converting optional pressure into a blocker.
5. Fail-closed / deterministic-compilation surfaces: the `{voice_pressure}` placeholder removal must keep every remaining template placeholder backed by a concrete resolver or deliberate constant (no dangling `PlaceholderName`), and the universal prompt contract must stay complete via a same-change template/contract edit (§8/§29.4). The matrix-voice present-minor blocker stays a single `blocker` severity (`matrixPresentMinorSpeechIncomplete`), so `validation-rule-inventory.test.ts`'s one-severity-per-code model is preserved; only its detection logic and message change. No secret-firewall (§15) path is touched — POV-narration pressure stays bounded by the existing POV/reveal system.
6. Output-schema modification: removes `local_function` from the `current_cast_voice_pressure` item (storage + draft) and removes the `voice_pressure` `PlaceholderName`. Consumers: descriptors, field guidance, `compile-destinations.ts`, `matrix-voice.ts`, the `{voice_pressure}` resolver/empty-state/template literal, web brief help, the server migration, and tests. All updated here; breaking changes handled by the migration (schema) and the same-change template/contract edits (placeholder).
7. Removed-symbol blast radius (grep 2026-06-20): `local_function` in `current_cast_voice_pressure` context appears in `generation-brief.ts`, `generation-brief-draft.ts`, and is consumed in `matrix-voice.ts:178`; `voice_pressure` appears in `placeholder-map.ts`, `types.ts`, `empty-states.ts`, `pressure.ts`, `template-constants.ts`, `docs/prompt-template.md`, `docs/compiler-contract.md`, and golden/contract tests. Tests touching these: `validation-matrix-voice.test.ts`, `validation-cast-band.test.ts`, `validation-onstage-cast-band.test.ts`, `compiler-cast-sections.test.ts`, `compiler-pressure-sections.test.ts`, `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `generation-session-draft-migration.test.ts`, `records.test.ts`.
8. Adjacent contradiction (required consequence, not a separate bug): removing `local_function` from the voice-pressure item breaks `hasPresentMinorVoicePressure` (matrix-voice.ts:178), which is why this ticket co-lands the matrix-voice rewrite, the present-minor delivery, and the `{voice_pressure}` removal as one indivisible diff. A `(modify)`-only split (CLAUDE.md forbids shims/aliases) would leave a typecheck-failing or regressed intermediate.
9. Mismatch + correction: none beyond mechanical enumeration of consumers. The spec's self-corrections (resolver in `pressure.ts`, `renderCompressedCastBand` takes no flag, `overrideLines` shared) are all confirmed accurate against the codebase.

## Architecture Check

1. Deriving role/band deterministically — match `cast_member_id` against `active_onstage_cast_full` (use that entry's `local_function`), else treat as present-minor band material, treating it as speech-oriented only when a deliverable speech destination exists (nonblank `dialogue_pressure`, a suitable `current_voice_pressure`, or an override whose `applies_to` includes dialogue / `all_prompted_voice`) — is cleaner than a stored duplicate enum: it makes the working set the single role authority and ties the speech blocker to material the renderer actually emits. Reusing the existing `currentVoicePressureLines` serializer for present-minor (instead of a new summary resolver) preserves the intentional pins/dossier dual frame and removes the accidental third frame.
2. No backwards-compatibility aliasing/shims. `local_function` is deleted (not retained-and-ignored); `{voice_pressure}` is deleted (not emptied). Role is derived, not stored under a new name. No LLM is used to infer role from prose (§29.4).

## Verification Layers

1. `local_function` (voice-pressure item) and `voice_pressure` placeholder are gone -> codebase grep-proof (absent from `packages/*/src`, template constants, placeholder map, `pressure.ts`, contract, golden).
2. Legacy draft migrates without losing pressure prose; draft/ready schemas reject nested `local_function` -> schema validation (`generation-session-draft-migration.test.ts`).
3. Present-minor current dialogue pressure appears in the compiled prose prompt; nonverbal-only pressure does not falsely satisfy a speech requirement; a dialogue-targeted override satisfies the lane -> compiler section + golden tests (`compiler-cast-sections.test.ts`, `compiler-golden.test.ts`).
4. The voice blocker cannot be cleared by a dropped field; active/full role floors still derive from `active_onstage_cast_full[].local_function`; absent optional pressure stays non-blocking where durable/compressed authority suffices -> FOUNDATIONS §11/§29.11 alignment via `validation-matrix-voice.test.ts`.
5. Ideation `<present_minor_cast>` gains no current voice-delivery pressure (prose-only, Q1); offstage band receives no current onstage pressure -> ideation golden (`compiler-ideation-golden.test.ts`) + compiler section test.
6. Every remaining template placeholder has a concrete resolver or deliberate constant -> compiler scaffold/contract conformance test (`compiler-scaffold.test.ts` / contract test).

## What to Change

### 1. Core schema, draft, descriptor, guidance

Remove `local_function` from the `current_cast_voice_pressure` item in `generation-brief.ts` and `generation-brief-draft.ts`; remove its descriptor entry (`generation-brief-descriptors.ts`), field-guidance entry (`field-guidance-brief-config.ts`), and any `compile-destinations.ts` destination for it. Retain all prose/list fields (`current_voice_pressure`, `dialogue_pressure`, `pov_narration_pressure`, `nonverbal_or_silence_pressure`, `current_must_preserve`, `current_must_avoid`).

### 2. Compiler — remove the redundant lane

Delete `voice_pressure` from `placeholder-map.ts`, its key in `types.ts`, its resolver in `pressure.ts`, its empty state in `empty-states.ts`, and the `{voice_pressure}` line in `template-constants.ts`. Retain `active_cast_voice_pressure_pins` (`cast.ts`); do not add a second summary resolver.

### 3. Compiler — deliver present-minor current pressure

In `cast.ts`, thread an `ideation` flag into `renderCompressedCastBand`. For the `present_minor_cast_compressed` band in the **prose** prompt only, reuse `currentVoicePressureLines` so the compressed block gains current-generation voice pressure (subsuming at least `current_voice_pressure`) under an explicit current-generation label, with overrides after/with it, in a stable order: (1) display/one-line identity; (2) durable compressed voice/body note; (3) current-generation voice pressure; (4) current-generation override. Gate the new current-pressure lines off when `ideation` is true (the ideator writes no prose — Q1). Do not deliver present-minor current pressure to the offstage band; do not promote a present-minor member to a full dossier; keep active/onstage dossier behavior unchanged.

### 4. Validation — make the blocker correspond to delivery

In `matrix-voice.ts`, rewrite `hasPresentMinorVoicePressure` (and any cast-band helper) so present-minor speech detection no longer reads the removed `local_function`: base it on present-minor band membership plus a deliverable speech destination (nonblank `dialogue_pressure`, a suitable `current_voice_pressure`, or an override whose `applies_to` targets dialogue / `all_prompted_voice`). Active/full role floors continue using `active_onstage_cast_full[].local_function`. Supplied contradictory current pressure still blocks; absent optional pressure stays a warning or no diagnostic when durable/compressed authority suffices. Keep `matrixPresentMinorSpeechIncomplete` a single blocker; update its message to identify the missing usable lane.

### 5. Server migration

In `generation-session-draft-migration.ts`, add an idempotent step stripping `current_cast_voice_pressure[*].local_function` for every array item before strict parse: preserve item order and every pressure string/list, leave malformed non-object items to the normal malformed-draft policy, and do no role inference.

### 6. Authority docs (§8 co-land)

`docs/story-record-schema.md` §3.5 (remove `local_function`, explain deterministic role derivation, state present-minor current pressure compiles into compressed notes); `docs/compiler-contract.md` (remove `{voice_pressure}` mapping, update `{active_cast_voice_pressure_pins}` and `<present_minor_cast>` source/requiredness, keep the exhaustive-placeholder claim true); `docs/prompt-template.md` (delete the `Voice pressure: {voice_pressure}` lines, retain `Active cast voice pressure pins`); `docs/prompt-template-rationale.md` §§9–11 (retain the pin/dossier rationale, state present-minor supplied current pressure is rendered); `docs/validation-rule-inventory.md` (update the voice diagnostic source/coverage/message); `docs/ideation-prompt-template.md` (note present-minor current voice-delivery pressure is NOT rendered in ideation `<present_minor_cast>` — prose-only, Q1). Update the prose golden (`golden-first-segment.prompt.txt`) and re-verify the ideation golden (`golden-ideation.prompt.txt`) for voice-delivery stability.

### 7. Web brief help

Update generation-brief rendering/help in `GenerationBriefView.tsx` so no `local_function` control appears inside current pressure, users learn active/full role comes from the working set, and no guidance points to `{voice_pressure}`.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-descriptors.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/records/compile-destinations.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify)
- `packages/core/src/compiler/types.ts` (modify)
- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `packages/core/src/compiler/sections/cast.ts` (modify)
- `packages/core/src/validation/rules/matrix-voice.ts` (modify)
- `packages/server/src/generation-session-draft-migration.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/validation-matrix-voice.test.ts` (modify)
- `packages/core/test/compiler-cast-sections.test.ts` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/server/src/generation-session-draft-migration.test.ts` (modify)
- `packages/core/test/records.test.ts` (modify)

## Out of Scope

- Restoring `local_function` or adding any new stored role/band field.
- Inferring role/band from prose with an LLM.
- Promoting a present-minor cast member to a full dossier.
- Adding present-minor current pressure to the ideation prompt or the offstage band.
- The `cast_voice_overrides.scope` removal (CONLOOSCHAUD-004) and the entity/location delivery (CONLOOSCHAUD-005).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- validation-matrix-voice` — present-minor speech blocker derives detection from band membership + deliverable speech guidance; nonverbal-only pressure does not clear a speech requirement; contradictory pressure still blocks; absent optional pressure with sufficient durable authority does not block.
2. `npm test -- compiler-cast-sections compiler-golden compiler-ideation-golden` — present-minor current dialogue pressure appears in the prose prompt in the stable order; `{voice_pressure}` is absent from the prose golden; ideation `<present_minor_cast>` voice-delivery output is unchanged; offstage band has no current onstage pressure.
3. `npm test -- generation-session-draft-migration` — nested `local_function` stripped, all pressure prose preserved, item order preserved, rerun a no-op.
4. `npm run lint && npm run typecheck && npm test && npm run build` — full pipeline green (strict TS confirms no dangling `voice_pressure` placeholder).

### Invariants

1. `current_cast_voice_pressure[].local_function` and the `voice_pressure` placeholder do not appear in `packages/*/src`, template constants, the placeholder map, `pressure.ts`, the compiler contract, or the prose golden (grep-proof).
2. Every remaining template placeholder has a concrete resolver or deliberate constant source; a voice validation pass corresponds to voice material the compiler emits.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-matrix-voice.test.ts` — replace the `local_function`-based present-minor case with band-membership + deliverable-guidance cases (dialogue pressure clears; nonverbal-only does not; dialogue-targeted override clears; contradiction blocks).
2. `packages/core/test/compiler-cast-sections.test.ts` — assert present-minor compressed block includes current voice pressure in the stable order (prose) and excludes it under the ideation flag; offstage excluded.
3. `packages/server/src/generation-session-draft-migration.test.ts` — nested-`local_function` strip + prose-preservation + idempotence cases.

### Commands

1. `npm test -- validation-matrix-voice compiler-cast-sections compiler-pressure-sections compiler-golden compiler-ideation-golden generation-session-draft-migration`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `! grep -rn "voice_pressure\b" packages/core/src/compiler && ! grep -rn "{voice_pressure}" docs packages/core/test/golden-first-segment.prompt.txt` (grep-proof; run after `npm run build`).

## Outcome

Completed: 2026-06-20

Changed:
- Removed `current_cast_voice_pressure[].local_function` from the generation brief schemas, draft/readiness paths, web generation-brief form, field guidance, fixtures, and demo data.
- Removed the redundant `{voice_pressure}` placeholder lane from the compiler placeholder map, empty states, pressure resolver, template, prose golden, and compiler contract docs.
- Delivered present-minor current voice pressure through the prose-only compressed present-minor cast renderer while keeping ideation and offstage output unchanged.
- Reworked `matrixPresentMinorSpeechIncomplete` to derive from present-minor band membership plus deliverable dialogue guidance/current speech pressure/dialogue-targeted overrides.
- Added an idempotent generation-session draft migration that strips legacy current-cast `local_function` before strict parse without role inference.

Deviations:
- `generation-brief-descriptors.ts`, `compile-destinations.ts`, `compiler/types.ts`, `records.test.ts`, and `golden-ideation.prompt.txt` did not contain owned changes after live-code inspection; no edits were needed there.

Verification:
- `npm test -- validation-matrix-voice compiler-cast-sections compiler-pressure-sections compiler-golden compiler-ideation-golden generation-session-draft-migration generation-brief-routes`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Grep proof: no `{voice_pressure}` or `current_cast_voice_pressure[].local_function` remains in active source/docs/goldens outside the legacy migration test fixture and active ticket/spec references.
- Browser smoke: local dev app on `127.0.0.1`; disposable `/tmp` project opened on `/generation-brief`; `current_voice_pressure` control rendered, removed current-cast `local_function` path/control absent, and console reported 0 errors / 0 warnings.
