# SPECFOUDOCAME-004: Amend prompt-template.md and prompt-template-rationale.md

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/prompt-template.md` (`<current_authoritative_state>`, `<immediate_handoff>`, `<active_working_set>`, `<prose_craft>`, `<stop_rule>`) and `docs/prompt-template-rationale.md` (§5, §6, §10, §19, §20, §21 + new section); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.4 + §4.5; constitution amended in SPECFOUDOCAME-001. -->

## Problem

The universal prompt template renders the soft-unit stop line unconditionally (`Soft unit: {soft_unit_guidance}`) and the `<prose_craft>` voice sentence implies current voice pressure pins always exist. The rationale doc lacks the first-segment/continuation handoff explanation, the corrected voice-pin requiredness, and any explanation of why draft saving is separate from readiness. This ticket makes the template render blank stop guidance / blank pins truthfully and documents the rationale.

## Assumption Reassessment (2026-06-08)

1. Template anchors exist in `docs/prompt-template.md`: `Immediate situation: {immediate_situation_summary}` (line 89), `<active_working_set>` voice-pressure prose (204), `<prose_craft>` voice sentence (356), `<stop_rule>` (367) with `Soft unit: {soft_unit_guidance}` (369) — confirmed this session. Rationale anchors exist in `docs/prompt-template-rationale.md`: §5 (38), §6 (46), §10 (78), §19 (146), §20 (152), §21 (158), §22 (164) — confirmed this session.
2. Amendment plan from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.4 (template) and §4.5 (rationale), validated against the live docs during `/reassess-spec`.
3. Cross-artifact boundary under audit: two distinct files with distinct invariants — the template is the prompt-contract rendering surface; the rationale explains why. They are merged here because the rationale changes only make sense alongside the template changes they justify. Template placeholders must stay consistent with `docs/compiler-contract.md` §4 (SPECFOUDOCAME-003); SPECFOUDOCAME-008 verifies it.
4. FOUNDATIONS principle under audit: §9 `Universal prose prompt contract` — the universal prompt always contains the local-unit stop rule; blank optional stop guidance is not a structural failure. The template must keep the stop rule intact while making the optional soft-unit line conditional.
5. Deterministic-compilation / no-accepted-prose surface: the `<stop_rule>` conditional-omission is documentation for deterministic conditional rendering (not story-specific text invented when blank); the `<immediate_handoff>` first-segment empty states must remain truthful and must not imply missing required context, and continuation handoff must never include accepted/rejected/superseded prose (§10). No secret path is touched.
6. Prompt-section contract: this changes the rendering/requiredness of `{soft_unit_guidance}` and `{active_cast_voice_pressure_pins}` (blank → omit or deterministic empty state) and the `<prose_craft>` voice sentence — additive/clarifying, no placeholder removed.
7. Adjacent already-correct / already-landed items: (a) `Immediate situation: {immediate_situation_summary}` is **already present** (line 89) — verify/preserve, do not re-add; (b) the `<active_working_set>` voice-pressure prose (line 204) is **already correct** per spec §4.4 (pins are optional salience duplicates) and needs no doctrinal change — only the empty-pin rendering behavior and the misleading `<prose_craft>` sentence change.

## Architecture Check

1. Conditional omission of the soft-unit line (keeping the universal stop triggers) is the cleanest faithful rendering of "blank stop guidance is allowed" — better than emitting a hollow `Soft unit:` line that reads as missing content, and better than inventing story-specific stop text.
2. No backwards-compatibility aliasing: the template is edited in place; the rationale's new section is additive. The temporary `None supplied.` deterministic empty state is offered only as a fallback when conditional omission cannot be implemented, not a permanent shim.

## Verification Layers

1. (template) `<stop_rule>` no longer requires a filled soft-unit line → codebase grep-proof of the conditional-rendering doc + retained universal stop triggers.
2. (template) `<prose_craft>` voice sentence revised to not imply pins always exist → grep-proof (`grep -n "body/behavior dossiers\|any supplied current voice pressure pins" docs/prompt-template.md`).
3. (template) `<immediate_handoff>` first-segment empty-state behavior documented; accepted prose still excluded → manual review (secret/prose-firewall check) of the section.
4. (rationale) §5/§6/§10/§19/§20/§21 amended + new draft-vs-readiness section → grep-proof of each added paragraph and the new `## ` heading.
5. (cross-artifact) template placeholder requiredness matches compiler-contract §4 → FOUNDATIONS alignment + SPECFOUDOCAME-008 consistency gate.

## What to Change

### 1. `docs/prompt-template.md`

- `<current_authoritative_state>`: confirm `Immediate situation: {immediate_situation_summary}` is present near the top and preserved (already landed — no re-add). Keep existing detailed lines; requiredness is context-gated in the compiler contract.
- `<immediate_handoff>`: keep the section; ensure first-segment empty states are truthful and do not imply missing required context; document (here or in comments) that first-segment missing handoff renders deterministic empty states and does not block, while continuation requires user-authored handoff with no accepted prose.
- `<active_working_set>`: leave the (already-correct) voice-pressure prose; adjust empty-pin behavior — when `{active_cast_voice_pressure_pins}` is empty, omit the pins sub-block or render a concise deterministic empty state, and ensure surrounding prose never commands the model to use nonexistent pins.
- `<prose_craft>`: revise `Use active cast voice anchors, current voice pressure pins, and speech-pattern peculiarities.` → `Use active cast voice anchors, speech-pattern peculiarities, body/behavior dossiers, and any supplied current voice pressure pins.`
- `<stop_rule>`: do not require a filled soft-unit line; render the optional soft-unit block only when `{soft_unit_guidance}` is supplied (else omit and keep the universal stop triggers); fallback deterministic empty state `Additional user stop guidance: None supplied.` only if conditional omission cannot ship immediately. (Spec §4.4.)

### 2. `docs/prompt-template-rationale.md`

- §5: add first-segment (no prior accepted prose → current state + manual directive suffice) vs continuation (user-authored handoff needed because accepted prose is excluded).
- §6: add that a handoff note is a user-authored bridge, not a prose-archive substitute; must not quote accepted prose.
- §10: add corrected requiredness — durable CAST MEMBER fields are primary voice authority; current pins are optional emphasis; missing pins are usually warnings, not blockers.
- §19: add that blank `soft_unit_guidance` is not a prompt-contract failure because the universal stop rule already defines the boundary.
- §20: add deterministic defaulting — generation context may be defaulted from accepted-segment count (project state, not story invention); other focus tags come from explicit controls, not LLM interpretation.
- §21: add that warnings must not indirectly gate Preview/Generate; a warning serious enough to block is misclassified and must become a deterministic blocker.
- New section near the end: `## Why draft saving is separate from readiness` (draft persistence protects author work; readiness protects compilation and provider sending). (Spec §4.5.)

## Files to Touch

- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)

## Out of Scope

- Re-adding the `Immediate situation:` line (already present) or rewriting the already-correct `<active_working_set>` voice-pressure prose.
- Schema field catalog and compiler-contract placeholder rows (SPECFOUDOCAME-002 / -003).
- Any production compiler/template-rendering code (owned by the archived behavioral specs; spec §8).
- Final cross-doc consistency search-checks (SPECFOUDOCAME-008).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "body/behavior dossiers|any supplied current voice pressure pins" docs/prompt-template.md` returns the revised `<prose_craft>` sentence; the old `current voice pressure pins, and speech-pattern peculiarities` phrasing is gone.
2. `grep -nE "None supplied|supplied|conditional" docs/prompt-template.md` confirms the `<stop_rule>` soft-unit line is conditional, and `grep -n "Immediate situation: {immediate_situation_summary}" docs/prompt-template.md` still resolves (preserved).
3. `grep -nE "Why draft saving is separate from readiness" docs/prompt-template-rationale.md` returns the new section; §5/§6/§10/§19/§20/§21 additions are present.

### Invariants

1. The universal prompt template still preserves all constitutional sections (no prompt section removed); the local-unit stop rule always compiles.
2. No-accepted-prose invariant: the `<immediate_handoff>` section never instructs inclusion of accepted/rejected/superseded prose; continuation handoff is user-authored only.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). Template-rendering behavior is already covered by the archived compiler spec's tests; cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "<stop_rule>|Soft unit|None supplied|<prose_craft>" docs/prompt-template.md` — confirm the stop-rule + prose-craft edits landed.
2. `grep -nE "^## (5|6|10|19|20|21|23)\.|Why draft saving is separate from readiness" docs/prompt-template-rationale.md` — confirm rationale sections amended + new section added.
3. Manual review of `<immediate_handoff>` for accepted-prose exclusion (the correct boundary — the no-prose firewall is a prose-audit check, not a greppable count).
