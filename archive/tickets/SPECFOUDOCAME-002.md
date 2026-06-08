# SPECFOUDOCAME-002: Amend story-record-schema.md — draft/ready shapes and field reclassification

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/story-record-schema.md` §3.0 (new), §3.2/§3.3/§3.4/§3.5/§3.7/§3.8, §10, §11 (diagnostic metadata model); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.2; constitution amended in SPECFOUDOCAME-001. -->

## Problem

The generation-time-brief schema doc labels every `CURRENT AUTHORITATIVE STATE` field as required, treats blank `soft_unit_guidance` and missing current cast voice pressure as blockers, and offers no draft persistence shape. This over-gates ordinary authoring and conflates storage validation with generation readiness. This ticket documents the draft-vs-ready split and reclassifies field requiredness to a universal floor plus context-gated requirements.

## Assumption Reassessment (2026-06-08)

1. The target subsections exist in `docs/story-record-schema.md`: §3.1 `ACTIVE WORKING SET` (line 96 — the §3.0 insertion anchor), §3.2 `CURRENT AUTHORITATIVE STATE` (125, "Required fields:" at 129), §3.3 `IMMEDIATE HANDOFF` (156), §3.4 `MANUAL MOMENT DIRECTIVE` (174, "`must_render` is required." at 186), §3.5 `CURRENT CAST VOICE PRESSURE` (191, "Required when…" at 211–213), §3.7 `GENERATION VALIDATION FOCUS` (256), §3.8 `STOP GUIDANCE` (298, "Blocks generation if blank…" at 313), §10 `Compiler contract and minimum prompt completeness` (865), §11 `Validation blockers and warnings` (889) — all confirmed this session.
2. Amendment plan from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.2, validated against the live schema doc during `/reassess-spec` this session.
3. Cross-artifact boundary under audit: this schema doc is the authoritative record/brief field contract (`docs/story-record-schema.md`, per CLAUDE.md). The reclassified requiredness must stay consistent with the compiler-contract placeholder requiredness (SPECFOUDOCAME-003) and the FOUNDATIONS §11 blocker taxonomy (SPECFOUDOCAME-001); SPECFOUDOCAME-008 verifies the cross-doc consistency.
4. FOUNDATIONS principle under audit: §11 `Validation and hard fails` — validation stays deterministic and blocking, distinguishes warnings from blockers, and no LLM/semantic-inference creates hidden blockers. The reclassification expresses exactly this: a universal current-state floor (time/location/onstage/situation) plus context-gated fields that block only when explicit tags/records/directive make them structurally necessary.
5. Fail-closed / secret-firewall / determinism surfaces: the doc describes what blocks readiness. Relaxing blank-stop-guidance and generic-voice-pressure blockers does not weaken the secret firewall (§15) — secret/reveal requiredness is untouched — and the `generation_context` normalization default (from accepted-segment count) is deterministic project state, not story invention (§8). `GenerationSessionReadyInput` is explicitly defined as not inventing story facts, handoff prose, routes, positions, voice pressure, or directive content.
6. Schema extension audit: the doc gains `GenerationSessionDraft` (permissive persistence shape) and `GenerationSessionReadyInput` (strict normalized validation/compiler shape) as documented concepts, plus a `DiagnosticAuthorSurface` conceptual metadata interface. These describe shapes the archived `SPEC-generation-brief-draftability-and-save-model` already implemented in code — this ticket documents existing shapes (additive doc description), it does not introduce a new runtime schema.
7. Adjacent already-landed sub-deliverable: `immediate_situation_summary` is **already present** in the field catalog (`docs/story-record-schema.md` line 135 `immediate_situation_summary: prose`, definition at 152). This ticket **verifies/preserves** it (confirm it reads as the immediate-state bridge and sits in the readiness-required universal floor) — it does **not** re-add it.

## Architecture Check

1. Documenting two shapes (permissive draft, strict ready) cleanly separates storage validation from generation readiness — the exact correction the spec identifies — rather than overloading one ready schema as the draft persistence schema, which traps the author outside the form state needed to fix blockers.
2. No backwards-compatibility aliasing: requiredness doctrine is reclassified in place; the `Blocks generation if blank` rule for `soft_unit_guidance` is removed, not shadowed by a compatibility note.

## Verification Layers

1. Draft/ready shapes documented (new §3.0) → codebase grep-proof (`grep -n "GenerationSessionDraft\|GenerationSessionReadyInput" docs/story-record-schema.md`).
2. `CURRENT AUTHORITATIVE STATE` reclassified to universal floor + context-gated (§3.2) → manual review of the field-category lists against spec §3.8/§4.2.
3. `soft_unit_guidance` no longer "Blocks generation if blank" (§3.8) → grep-proof (`grep -c "Blocks generation if blank" docs/story-record-schema.md` → 0).
4. `must_render` retained as readiness-required (§3.4) → grep-proof of the retained requiredness + added draft caveat.
5. `immediate_situation_summary` preserved in the field catalog (§3.2) → schema-doc grep-proof (line ~135 still present).

## What to Change

### 1. New §3.0 `Draft and ready generation session shapes` (before §3.1)

Add the `GenerationSessionDraft` (persistence) vs `GenerationSessionReadyInput` (normalized validation/compiler input) distinction and the schema-level principle: draft schema permissive for normal form work; ready schema strict for compiler safety; storage validation and readiness validation are separate concerns. (Spec §4.2 → §3.0 block.)

### 2. §3.2 `CURRENT AUTHORITATIVE STATE` — categorize requiredness

Replace the flat "every field required" framing with **readiness-required universal fields** (`current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`) and **context-gated fields** (`offstage_pressuring_entities`, `positions`, `possessions`, `visible_conditions`, `environmental_conditions`, `entity_statuses`, `line_of_sight_and_visibility`, `routes_and_exits`, `available_time`, `consent_or_force_conditions`, `current_locks`) each with its triggering condition. Preserve the full field catalog. Confirm `immediate_situation_summary` (already present) is filed under the universal floor. (Spec §4.2 → §3.2 block.)

### 3. §3.3 / §3.4 — context-gate handoff; keep `must_render` required

- §3.3 `IMMEDIATE HANDOFF`: `first_segment` handoff prose optional (deterministic empty state); `continuation_after_accepted_segment` requires user-authored handoff (recent causal bridge + last visible moment or begin-after), never verbatim accepted/rejected/superseded prose or auto-summaries.
- §3.4 `MANUAL MOMENT DIRECTIVE`: keep `must_render` readiness-required; add the draft caveat (blank `must_render` produces a readiness blocker, not a draft-save failure). (Spec §4.2 → §3.3/§3.4 blocks.)

### 4. §3.5 / §3.7 / §3.8 — voice optionality, normalized context, optional stop guidance

- §3.5 `CURRENT CAST VOICE PRESSURE`: change "Required when…" bullets to "Recommended when…" plus the blocking exceptions (contradiction; or selected local mode needs voice/body authority and no durable/compressed source).
- §3.7 `GENERATION VALIDATION FOCUS`: exactly one `generation_context` required in `GenerationSessionReadyInput`; a draft may omit it; normalization defaults it from accepted-segment count; focus tags are user-selected or deterministically derived, never LLM-interpreted.
- §3.8 `STOP GUIDANCE`: make `soft_unit_guidance` optional; **remove "Blocks generation if blank"**; preserve blocking for nonlocal/contradictory supplied guidance. (Spec §4.2 → §3.5/§3.7/§3.8 blocks.)

### 5. §10 / §11 — minimum completeness + diagnostic metadata

- §10 `Compiler contract and minimum prompt completeness`: universal minimum current state + context-gated; handoff only for continuation; stop guidance optional; manual directive required; voice pressure optional unless no durable/compressed authority.
- §11 `Validation blockers and warnings`: remove blank `soft_unit_guidance` and generic missing-voice-pressure as blockers; retain nonlocal-directive/stop, accepted-prose-contamination, physical/knowledge/policy contradictions; reclassify long-dossier/pin concerns as grouped warnings; add the `DiagnosticAuthorSurface` conceptual metadata interface (spec §4.2). (Spec §4.2 → §10/§11 blocks.)

## Files to Touch

- `docs/story-record-schema.md` (modify)

## Out of Scope

- Re-adding `immediate_situation_summary` (already present; verify/preserve only).
- Compiler-contract placeholder rows and prompt-template rendering (SPECFOUDOCAME-003 / -004).
- Any production schema/validator/normalizer code (owned by the archived `SPEC-generation-brief-draftability-and-save-model`; spec §8).
- Final cross-doc consistency search-checks (SPECFOUDOCAME-008).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "GenerationSessionDraft|GenerationSessionReadyInput" docs/story-record-schema.md` returns the new §3.0 shapes.
2. `grep -c "Blocks generation if blank" docs/story-record-schema.md` returns `0`; `grep -nE "must_render. is required|Readiness-required universal" docs/story-record-schema.md` returns the retained/added requiredness.
3. `grep -n "immediate_situation_summary" docs/story-record-schema.md` still resolves (field preserved, not removed).

### Invariants

1. The record taxonomy and existing record definitions outside §3 remain intact (schema is reclassified, not collapsed into a generation-session-only doc).
2. Data-contract invariant: no field is removed; reclassification changes requiredness doctrine only, and ready-shape strictness still blocks true impossibilities (nonlocal stop guidance, accepted-prose contamination, hard contradictions).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). Code-level draft/ready behavior is already covered by the archived Draftability spec's tests; cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "Readiness-required universal|Context-gated|GenerationSessionDraft|DiagnosticAuthorSurface" docs/story-record-schema.md` — confirm the reclassification and metadata model landed.
2. `grep -c "Blocks generation if blank" docs/story-record-schema.md` — must return `0`.
3. Manual review of §3.2 field categories against `docs/compiler-contract.md` placeholder requiredness (the correct boundary, since cross-doc requiredness agreement is not single-file greppable) — full agreement is gated by SPECFOUDOCAME-008.

## Outcome

Completed on 2026-06-08.

Changed `docs/story-record-schema.md` to add `GenerationSessionDraft` and `GenerationSessionReadyInput`, distinguish storage validation from readiness validation, reclassify `CURRENT AUTHORITATIVE STATE` into a readiness-required universal floor plus context-gated fields, make first-segment handoff optional and continuation handoff required, preserve `manual_moment_directive.must_render` as readiness-required while allowing draft saves, make `soft_unit_guidance` optional, and reclassify current cast voice pressure as optional salience with narrow blocking exceptions.

Also updated §10/§11 minimum completeness and validation examples so blank stop guidance and generic missing current cast voice pressure are not blockers, while nonlocal supplied stop guidance, accepted-prose contamination, hard contradictions, and missing true readiness authority remain blockers. Added conceptual `DiagnosticAuthorSurface` metadata for author-facing diagnostics.

Deviations from original plan: none. `immediate_situation_summary` was preserved and filed under the universal floor; no field was removed.

Verification:

- `grep -nE "GenerationSessionDraft|GenerationSessionReadyInput" docs/story-record-schema.md`
- `grep -c "Blocks generation if blank" docs/story-record-schema.md` returned `0`
- `grep -nE "must_render. is required|Readiness-required universal" docs/story-record-schema.md`
- `grep -n "immediate_situation_summary" docs/story-record-schema.md`
- `grep -nE "Readiness-required universal|Context-gated|GenerationSessionDraft|DiagnosticAuthorSurface" docs/story-record-schema.md`
- Manual review confirmed the field catalog remains intact and the reclassified requiredness matches the amended FOUNDATIONS doctrine.
