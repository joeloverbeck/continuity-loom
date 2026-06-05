# SPEC007DETPROCOM-005: Cast renderers — core-first dossiers, voice pins, present-minor, offstage, overrides, samples

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds the cast-band renderers (`compiler-contract.md` §3 sections 18–20 + the voice-pressure pins) into the `@loom/core` compiler.
**Deps**: SPEC007DETPROCOM-002

## Problem

The scaffold renders the cast sections as empty-state constants. This ticket fills the
richest part of the compiler: active/onstage full CAST MEMBER dossiers in deterministic
core-first order with **no silent compression**, the current voice-pressure pins
(salience duplicates near `<active_working_set>` that do not replace the dossier),
present-minor compressed notes, offstage relevance slices, temporary cast voice
overrides (scoped to the current generation, never mutating records), and selected
sample utterances (≤3, default zero, copy-policy-respecting, never invented). Character
voice is continuity (§17), so this rendering must be faithful and complete.

## Assumption Reassessment (2026-06-05)

1. The scaffold (`compiler/placeholder-map.ts`, section-order array, ordering helper
   from 004 if landed — else this ticket's own stable order) exists after 002. The
   snapshot carries cast-band assignments on `ValidationRecord.castBand`
   (`packages/core/src/validation/snapshot.ts:9-21`: `active_onstage_cast_full` /
   `present_minor_cast_compressed` / `offstage_relevant_cast`) plus
   `current_cast_voice_pressure` and `cast_voice_overrides` on the generation session
   (`packages/core/src/records/generation-brief.ts:164-165`).
2. The placeholders and rules are fixed by `docs/compiler-contract.md` §4:
   `{active_onstage_full_cast_dossiers}` (all populated fields, core-first, no
   compression), `{active_cast_voice_pressure_pins}`, `{present_minor_cast_notes}` →
   `None`, `{offstage_relevance_notes}` → `None`, sample utterances (≤3, default zero,
   `may_reuse_cadence_not_text`). The CAST MEMBER field names (`voice_anchor`,
   `pressure_behavior_core`, `body_presence_core`, `agency_core`, `sample_utterances`,
   etc.) **must be verified against `docs/story-record-schema.md`** and the cast record
   module at implementation time, not assumed.
3. **Cross-artifact boundary under audit**: section `<active_working_set>` (slot 13) is
   shared with 004 — this ticket renders `{active_cast_voice_pressure_pins}` adjacent to
   (not inside) 004's user-authored pressure summaries; both `Deps: 002`, override
   different placeholder-map entries, and must not write the same entry. The cast
   dossiers themselves render at slots 18–20.
4. **FOUNDATIONS principle restated**: §8 — the compiler "must not silently compress
   active/onstage cast dossiers" and must not impose token-budget compression (§17);
   the user is the gate. §17 — voice (rhythm, register, profanity, evasion, anti-
   repetition, etc.) is continuity; current voice-pressure pins are salience duplicates
   assembled deterministically from voice anchor + current pressure + temporary
   override, and **do not** rewrite durable identity. Sample utterances are sparse,
   annotated, never-copy-verbatim by default.
5. **Deterministic-compilation surface named (override scoping)**: temporary cast voice
   overrides (`cast_voice_overrides`) compile **only** for the current generation and
   **never** mutate durable CAST MEMBER records — the compiler is read-only over the
   snapshot (no write path exists; `compilePrompt` returns a string, mutates nothing).
   Present-minor overrides render only inside `{present_minor_cast_notes}`. Rendering is
   deterministic: core-first field order is schema-fixed, sample selection is by user
   selection / stable metadata, never LLM ranking; missing samples are never invented.

## Architecture Check

1. A dedicated `sections/cast.ts` with an explicit core-first field sequence (identity →
   voice anchor + voice-extended → pressure_behavior_core → body_presence_core →
   agency_core → remaining optional extended → samples last) is cleaner than a generic
   field-dump: it guarantees the §17 ordering and makes "no silent compression"
   testable (every populated field appears).
2. No backwards-compatibility aliasing/shims: renders directly from the snapshot's cast
   records; no token-budget compression path, no parallel "compact dossier" mode.

## Verification Layers

1. No silent compression (§8/§17) → unit test: a dense multi-field active dossier
   renders **every** populated field; no field is dropped for length.
2. Core-first order (§17) → unit test: rendered field blocks follow identity → voice →
   pressure → body → agency → optional → samples.
3. Voice pins duplicate-not-replace (§17) → unit test: a current voice-pressure pin
   appears near `<active_working_set>` AND the full dossier still renders at slot 18.
4. Override scoping (§17) → FOUNDATIONS alignment check + unit test: a temporary voice
   override renders for the current generation and the source CAST MEMBER record is
   unchanged after `compilePrompt` (compiler mutates nothing).
5. Samples (§17/§28.7) → unit test: ≤3 selected samples, default zero, copy-policy
   label respected, no invented sample.

## What to Change

### 1. Cast renderers (`compiler/sections/cast.ts`)

`{active_onstage_full_cast_dossiers}` core-first with all populated fields;
`{active_cast_voice_pressure_pins}` assembled from voice anchor + current voice
pressure + temporary override; `{present_minor_cast_notes}` (compressed, incl.
present-minor overrides); `{offstage_relevance_notes}`; sample-utterance handling
(≤3, default zero, copy policy, no invention). Empty states per §4.

### 2. Register resolvers (`compiler/placeholder-map.ts`)

Wire the cast resolvers into the map (overriding scaffold defaults), placing the voice
pins adjacent to 004's `<active_working_set>` block.

## Files to Touch

- `packages/core/src/compiler/sections/cast.ts` (new)
- `packages/core/src/compiler/placeholder-map.ts` (modify — Deps 002 creates it; shared with 003/004/006)
- `packages/core/test/compiler-cast-sections.test.ts` (new)

## Out of Scope

- Non-cast sections (003/004/006), the server route (007), docs (008).
- Any write-back to CAST MEMBER records from overrides — structurally impossible here
  and forbidden (§17); not implemented.
- Length / lost-in-the-middle warnings — those are SPEC-006 validation warnings, not
  compiler behavior.

## Acceptance Criteria

### Tests That Must Pass

1. A dense active/onstage dossier renders every populated field, core-first, with no
   compression.
2. Voice pin appears near `<active_working_set>` without replacing the full dossier.
3. A temporary voice override renders current-generation-only and mutates no record.
4. Sample utterances: ≤3, default zero, copy policy respected, none invented.
5. `npm run typecheck && npm test && npm run lint && npm run build` — green.

### Invariants

1. Active/onstage dossiers are never silently compressed (§8/§17).
2. The compiler performs zero record mutation; overrides are scoped to the request (§17).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-cast-sections.test.ts` — no-compression, core-first
   order, pin duplication, override scoping + no-mutation, sample-utterance policy.

### Commands

1. `npm test --workspace @loom/core` — targeted cast-section tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Added cast compiler resolvers for active/onstage full dossiers, active cast voice
  pressure pins, present-minor compressed notes, and offstage relevance notes.
- Rendered active/onstage CAST MEMBER dossiers in explicit core-first field order
  with all populated fields preserved and sample utterances capped at three.
- Rendered current-generation voice overrides in prompt output without mutating
  source records.
- Added cast-section tests for no-compression dossier rendering, core-first order,
  sample policy/limit, voice pin duplication, override scoping, no mutation, and
  cast-band empty states.

Deviations from original plan:
- None.

Verification:
- `npm test --workspace @loom/core` passed: 19 files, 127 tests.
- `npm run typecheck` passed.
- `npm test` passed: 44 files, 236 tests.
- `npm run lint` passed.
- `npm run build` passed, with Vite's large-chunk warning only.
