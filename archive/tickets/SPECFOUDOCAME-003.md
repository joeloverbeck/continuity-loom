# SPECFOUDOCAME-003: Amend compiler-contract.md — requiredness terms and placeholder rows

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/compiler-contract.md` requiredness terminology + §2/§4/§5/§6/§7/§8; no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.3; constitution amended in SPECFOUDOCAME-001; schema in SPECFOUDOCAME-002. -->

## Problem

The compiler contract treats placeholder requiredness as flat and does not define a normalized readiness input as the compilation source. It needs requiredness terminology (draft-save / readiness / context-gated / optional), a normalized-input source rule, per-row requiredness reclassification, and an optional-omission empty-state rule — so the deterministic compiler's documented contract matches the draft/readiness doctrine.

## Assumption Reassessment (2026-06-08)

1. The target sections exist in `docs/compiler-contract.md`: §2 `Source hierarchy` (line 19), §4 `Exhaustive placeholder mapping` (69, with the `{immediate_situation_summary}` row at 90), §5 `Universal minimum prompt completeness` (158), §6 `Generation validation matrix` (173), §7 `Blocker/warning rendering` (217), §8 `Empty-state rendering rules` (225) — confirmed this session.
2. Amendment plan from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.3, validated against the live contract during `/reassess-spec`.
3. Cross-artifact boundary under audit: `docs/compiler-contract.md` is the bridge between the schema (`docs/story-record-schema.md`, SPECFOUDOCAME-002) and the prompt template (`docs/prompt-template.md`, SPECFOUDOCAME-004). Placeholder requiredness here must match schema requiredness and template placeholders; SPECFOUDOCAME-008 verifies the three-way agreement.
4. FOUNDATIONS principle under audit: §8 `Deterministic prompt compilation` — the compiler is a deterministic renderer with no LLM intermediary. The amendment adds that the compiler consumes `GenerationSessionReadyInput` (normalized from saved draft + config + active working set + accepted-segment count + selected records), not UI-only defaults — preserving determinism and the no-LLM/no-accepted-prose/no-inactive-records source rules.
5. Deterministic-compilation surface: the §2 source-hierarchy change must not weaken the no-LLM, no-accepted-prose, or no-inactive-records rules. The normalized-input framing strengthens determinism (UI-only defaults can drift; a normalized snapshot is reproducible). No secret-firewall path is touched.
6. Schema (prompt-section contract) extension: the placeholder mapping gains a new `{immediate_situation_summary}` row plus requiredness reclassification of physical/voice/handoff/stop placeholders. Per FOUNDATIONS §8 ("Adding, renaming, deleting, or changing the requiredness of a prompt placeholder must update the compiler contract in the same change"), the requiredness changes belong here and must stay consistent with template + schema.
7. Adjacent already-landed sub-deliverable: the `{immediate_situation_summary}` row is **already present** (`docs/compiler-contract.md` line 90: readiness-required, source `CURRENT AUTHORITATIVE STATE.immediate_situation_summary`, "Block if blank"). This ticket **verifies/preserves** it (the existing row already matches the spec's intended requiredness) — it does not re-add the row; the only optional refinement is its empty-state cell, which is acceptable as-is.

## Architecture Check

1. Explicit requiredness vocabulary (draft-save / readiness / context-gated / optional) makes the placeholder table self-documenting and prevents the flat "all required" reading that caused the over-gating — cleaner than per-row prose with no shared terms.
2. No backwards-compatibility aliasing: the source hierarchy is amended in place to name `GenerationSessionReadyInput`; no parallel raw-UI-state path is preserved.

## Verification Layers

1. Requiredness terminology defined near §4 → codebase grep-proof (`grep -nE "Readiness required|Context-gated required|Optional prompt preference" docs/compiler-contract.md`).
2. Normalized readiness input named as compiler source (§2) → grep-proof (`grep -n "GenerationSessionReadyInput" docs/compiler-contract.md`).
3. Placeholder rows context-gated, not universal (§4) → manual review of the table rows against spec §4.3.
4. `{soft_unit_guidance}` row marked optional / blank-does-not-block (§4) → grep-proof of the amended row.
5. Optional-omission empty-state rule added (§8) → grep-proof of the new rule.

## What to Change

### 1. Requiredness terminology (before §4 placeholder mapping)

Add definitions: **Draft-save required**, **Readiness required**, **Context-gated required**, **Optional prompt preference** (spec §4.3). These anchor the per-row requiredness in §4.

### 2. §2 `Source hierarchy` — normalized readiness input

Add that the compiler consumes `GenerationSessionReadyInput`, produced by deterministic normalization from saved draft state, story config, active working set, accepted-segment count, and selected records — not UI-only defaults. Do not weaken the no-LLM, no-accepted-prose, or no-inactive-records source rules. (Spec §4.3 → §2 block.)

### 3. §4 `Exhaustive placeholder mapping` — row-level requiredness

Apply the spec §4.3 row table: `{current_time}`/`{current_location}`/`{onstage_entities}` readiness-required; `{immediate_situation_summary}` row preserved (already present); `{positions}`/`{entity_statuses}`/`{possessions}`/`{visible_conditions}`/`{environmental_conditions}`/`{line_of_sight_and_visibility}`/`{routes_and_exits}`/`{available_time}`/`{consent_or_force_conditions}`/`{current_locks}` context-gated; immediate-handoff placeholders first-segment-optional / continuation-required; `{manual_must_render}` readiness-required (draft may save blank); `{soft_unit_guidance}` optional prompt preference (blank does not block; prefer conditional omission); `{active_cast_voice_pressure_pins}` optional salience; `validation_focus_tags` validation-only with one normalized generation context. Preserve the full table. (Spec §4.3 → §4 block.)

### 4. §5 / §6 — minimum completeness + validation matrix rows

- §5 `Universal minimum prompt completeness`: replace with the spec's 11-point shape (constitutional sections always compile; story config populated; current-state universal floor; manual directive present/local; generation context resolved by normalization; first-segment compiles without continuation handoff; blank stop guidance allowed; non-omniscient POV requires POV knowledge profile; active secrets require holder/non-holder/reveal data; context-gated requirements apply only when explicit; accepted-prose contamination never appears).
- §6 `Generation validation matrix`: update over-gating rows (`first_segment` no continuation handoff; `continuation_after_accepted_segment` user-authored handoff, accepted prose still banned; `dialogue_expected`/`ensemble_dialogue_expected`/`active_silent_presence_expected`/`present_minor_speech_possible` voice rows; physical/object/location/force/intimacy/violence rows stay strong blockers under explicit tags). (Spec §4.3 → §5/§6 blocks.)

### 5. §7 / §8 — author-facing rendering + optional-omission empty state

- §7 `Blocker/warning rendering`: add the author-facing readiness-item field model (Title / what may degrade / why not blocking / when it becomes blocking / fastest fix / ignore-reasonable-when / affected labels / technical code in details) and dedup rules; raw-code-first is banned.
- §8 `Empty-state rendering rules`: add that optional prompt-preference fields may be omitted entirely when blank if the surrounding universal instruction remains structurally complete; empty-state rendering required only when omission would make the prompt ambiguous or malformed (esp. blank `soft_unit_guidance`). (Spec §4.3 → §7/§8 blocks.)

## Files to Touch

- `docs/compiler-contract.md` (modify)

## Out of Scope

- Re-adding the `{immediate_situation_summary}` row (already present; verify/preserve).
- Prompt-template rendering text and the schema field catalog (SPECFOUDOCAME-004 / -002).
- Any production compiler/normalizer code (owned by the archived behavioral specs; spec §8).
- Final cross-doc consistency search-checks (SPECFOUDOCAME-008).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "Readiness required|Context-gated required|Optional prompt preference|Draft-save required" docs/compiler-contract.md` returns the requiredness terminology.
2. `grep -n "GenerationSessionReadyInput" docs/compiler-contract.md` returns the §2 source-hierarchy addition.
3. `grep -n "immediate_situation_summary" docs/compiler-contract.md` still resolves (row preserved); the `{soft_unit_guidance}` row no longer marks blank as blocking.

### Invariants

1. The placeholder mapping remains exhaustive (no placeholder dropped); §4 still maps every prompt placeholder to a deterministic source.
2. Determinism invariant: compilation consumes a normalized input with no LLM intermediary; identical inputs + versions still produce identical output.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). Compiler behavior is already covered by the archived compiler/validation specs' tests; cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "GenerationSessionReadyInput|Context-gated required|Optional prompt preference" docs/compiler-contract.md` — confirm the source + requiredness terms landed.
2. `grep -nE "\{soft_unit_guidance\}|\{immediate_situation_summary\}|\{manual_must_render\}" docs/compiler-contract.md` — confirm the affected rows render with corrected requiredness.
3. Manual review of the §4 table against `docs/story-record-schema.md` §3.2/§3.8 and `docs/prompt-template.md` placeholders (the correct boundary; three-way requiredness agreement is verified end-to-end by SPECFOUDOCAME-008).

## Outcome

Completed on 2026-06-08.

Changed `docs/compiler-contract.md` to make `GenerationSessionReadyInput` the deterministic compiler source, add requiredness terminology, reclassify current-state, handoff, stop-guidance, validation-focus, and cast-voice placeholder rows, and update minimum completeness, validation matrix, warning rendering, and empty-state rules for the draft/readiness doctrine.

Deviations from original plan: none. `{immediate_situation_summary}` was preserved as readiness-required, and `{soft_unit_guidance}` was changed to an optional prompt preference that does not block when blank.

Verification:

- `grep -nE "Readiness required|Context-gated required|Optional prompt preference|Draft-save required" docs/compiler-contract.md`
- `grep -n "GenerationSessionReadyInput" docs/compiler-contract.md`
- `grep -nE "\{soft_unit_guidance\}|\{immediate_situation_summary\}|\{manual_must_render\}" docs/compiler-contract.md`
- Manual review confirmed the placeholder mapping still maps every existing row to deterministic sources and keeps no-LLM, no-accepted-prose, and no-inactive-record source rules intact.
