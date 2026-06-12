# SPEC021GROIDEPRO-001: FOUNDATIONS amendments A1+A2 — second sanctioned prompt class

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `docs/FOUNDATIONS.md` §9/§9.1, §11 item 7, §19, §26/§26.1, §29.2/§29.4/§29.5 amended; no production code or behavior change
**Deps**: None — but see Architecture Check: this ticket MUST be committed in the same revision as SPEC021GROIDEPRO-002 (the first dependent core change) and MUST NOT merge to `main` standalone ahead of it, per FOUNDATIONS §1.1.

## Problem

The ideation feature (SPEC-021) is blocked constitutionally, not technically. `docs/FOUNDATIONS.md` §9 declares "one universal prose prompt template in v1," and §11 blocker-taxonomy item 7 plus the §29.5 checklist block any prompt that asks the model to "produce alternatives" — rules written to keep the *prose writer* local. An ideation prompt is not a prose prompt (its output is never story text). Per §1, a feature that conflicts with FOUNDATIONS is wrong unless FOUNDATIONS is deliberately amended first. This ticket lands the exact, sign-off-approved amendment wording (A1 + A2) that sanctions a second deterministic, inspectable, validation-gated **assistance prompt class** and codifies the shared rules every future assistance surface obeys.

## Assumption Reassessment (2026-06-12)

1. **Amendment targets exist verbatim in the live constitution.** Verified against `docs/FOUNDATIONS.md`: §9 opening sentence "Continuity Loom uses one universal prose prompt template in v1." (line 272); §11 blocker item 7 (line 370); §19 "The prompt must not ask for alternate options, future summaries, downstream consequences, chapter packages, or global continuation plans." (line 650); §4.6 (line 131); §26 (ends line 819); §29.2 (lines 912–918); §29.4 universal-contract-sections row (line 934); §29.5 alternate-options row (line 940). All edit anchors confirmed present.
2. **Spec authority.** `specs/SPEC-021-grounded-ideation-prompt.md` §A (Deliverable D1) carries the proposed constitutional wording, reassessed and corrected this session (reassess-spec finding I1 added §4.6/§19 to the §9.1 scoping enumeration and an explicit §19 edit instruction; this ticket transcribes that corrected wording).
3. **Cross-artifact boundary under audit:** the FOUNDATIONS doc set's internal coherence — every restated "no alternatives" rule across §9/§11/§19/§29 must move together so no bullet is left contradicting the new §9.1 doctrine. The §9.1 scoping enumeration `(§4.6, §11 item 7, §19, §29.5)` and the per-site edits below are what hold that coherence.
4. **FOUNDATIONS principle restated before trusting the spec narrative:** §1.1 amendment procedure — an amendment must (a) be explicitly labeled with exact wording, (b) receive user sign-off (obtained this session), (c) land in the same revision as the dependent code change, never standalone ahead of it, and (d) update the §29 checklist in the same amendment. This ticket satisfies (a)/(b)/(d); (c) is enforced by the same-revision constraint with SPEC021GROIDEPRO-002.
5. **§29 hard-fail intent preserved (deterministic-compilation + secret-firewall + human-gatekeeping surfaces).** A1/A2 relax only the prose-writer-scoped "no alternatives / one template" rules; they preserve every §29 hard-fail's *intent*: deterministic compilation with no LLM intermediary (§29.4 retained, scoped to prose prompts only for the section-omission clause), no accepted prose in prompts (untouched), the secret firewall (untouched), warnings never gating (untouched), human gatekeeping (A2 adds the §29.2 no-auto-insertion hard-fail). The amendment loosens no §29 question in spirit; it adds one.

## Architecture Check

1. A clarifying amendment that *scopes* existing prose-writer rules to the prose prompt class — rather than deleting them — is cleaner than carving exceptions per-feature: §26 already authorizes the assistance lane; §9 merely predates a second prompt kind. Scoping at every restatement site (§9.1 enumeration + §11/§19/§29 inline) keeps the constitution internally consistent, so future specs read one coherent doctrine instead of a rule and its silent exception.
2. No backwards-compatibility aliasing or shims: this is a constitutional text edit, introduces no parallel authority path, and creates no code surface. **§1.1 co-landing:** this ticket is authored as its own reviewable diff (the constitutional wording is a distinct sign-off concern) but is committed in the **same revision** as SPEC021GROIDEPRO-002; it is never merged to `main` alone ahead of the dependent code (§1.1 clause 3).

## Verification Layers

1. §9.1 section inserted with all five required-properties bullets and the local-prose-scope clause → codebase grep-proof (`grep -n "9.1 Assistance prompt class" docs/FOUNDATIONS.md`).
2. "No alternatives" doctrine scoped at every restatement site, no orphaned blanket bullet → grep-proof that §11 item 7, §19 (line 650), §29.4, §29.5 each carry the scoping parenthetical, and §9.1 enumerates `(§4.6, §11 item 7, §19, §29.5)`.
3. §26.1 appended and §29.2 gains the no-auto-insertion hard-fail → grep-proof (`grep -n "26.1 Assistance-output handling" docs/FOUNDATIONS.md`; `grep -n "without explicit per-item user action" docs/FOUNDATIONS.md`).
4. §29 hard-fail intent preserved → FOUNDATIONS alignment check (manual review against the §29 post-amendment sweep in spec §FOUNDATIONS Alignment).

## What to Change

### 1. §9 — recognize the second prompt class + insert §9.1

After §9's opening sentence ("Continuity Loom uses one universal prose prompt template in v1."), insert the A1 paragraph recognizing the **assistance prompt** class and the new **§9.1 Assistance prompt class** subsection, exactly as worded in spec §A (the five bullets: compiles deterministically from the same authority sources; inspectable under §22 audit boundaries; gated by deterministic validation with prose-launch requirements applying only where the assistance purpose needs them; never produces/requests story prose; never enters a prose prompt/record/field automatically). The §9.1 closing paragraph scopes the local-prose stop rule and the alternatives/plans/summaries prohibition `(§4.6, §11 item 7, §19, §29.5)` to the prose prompt class.

### 2. Scope the "no alternatives" doctrine at every restatement site

- **§11 item 7** — append: "(this condition scopes to prose prompts; a sanctioned §9.1 assistance prompt may request non-prose alternatives)".
- **§19** (line 650) — after "…or global continuation plans.", append: "(this scopes to the prose prompt class; a sanctioned §9.1 assistance prompt may request non-prose alternatives)". (§4.6 is already scoped by its explicit subject "the external prose writer"; the §9.1 cross-reference makes it unambiguous — no inline edit to §4.6.)
- **§29.4** — the universal-contract-sections row gains "(prose prompts)" after "universal prompt contract sections".
- **§29.5** — the "alternate options" row gains "(in a prose prompt or its directive/stop guidance)".

### 3. §26 — append §26.1 Assistance-output handling (A2)

Append the **§26.1** subsection with the six shared rules for all present/future LLM-assistance surfaces, exactly as worded in spec §A (opt-in/pull-based; quarantined non-canonical surface; mandatory provenance; no residue on rejection; ephemeral/never-logged-by-default mirroring §22; current ephemeral output may parameterize a follow-up assistance request but never prose generation).

### 4. §29.2 — add the no-auto-insertion hard-fail

Add one hard-fail question: "Does it let assistance output enter a prose prompt, a story record, or a generation-time field without explicit per-item user action?"

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Any code change (types, compiler, validation, server, web) — those are SPEC021GROIDEPRO-002…009.
- `docs/ACTIVE-DOCS.md` registry/version-note edits and the new ideation authority doc — SPEC021GROIDEPRO-008.
- Amendment A3 (per-purpose model setting) — deferred per spec §Out of Scope; not part of this revision.
- Re-litigating the amendment wording — it received explicit user sign-off this session; this ticket transcribes it.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "9.1 Assistance prompt class" docs/FOUNDATIONS.md` returns one match; `grep -n "26.1 Assistance-output handling" docs/FOUNDATIONS.md` returns one match.
2. `grep -n "(§4.6, §11 item 7, §19, §29.5)" docs/FOUNDATIONS.md` returns one match (the §9.1 scoping enumeration); `grep -n "without explicit per-item user action" docs/FOUNDATIONS.md` returns one match (new §29.2 hard-fail).
3. `npm run lint` passes (no broken markdown lint rule if one is configured) — full repo gate unchanged since this is docs-only.

### Invariants

1. No "no alternatives / one template" rule remains as a blanket statement contradicting §9.1: §11 item 7, §19, §29.4, §29.5 each carry a prose-prompt scoping clause.
2. Every §29 hard-fail's intent is preserved or strengthened — the amendment adds the §29.2 no-auto-insertion question and loosens no other §29 question in spirit (deterministic compilation, no accepted prose in prompts, secret firewall, warnings-never-gate, human gatekeeping all intact).

## Test Plan

### New/Modified Tests

1. `None — constitutional-amendment ticket; verification is grep-based and the doc set carries no automated coherence test. Behavioral preservation is exercised by the existing core/validation suites unchanged in this revision (the §1.1 co-landing SPEC021GROIDEPRO-002 carries the first code).`

### Commands

1. `grep -nE "9.1 Assistance prompt class|26.1 Assistance-output handling|\(§4.6, §11 item 7, §19, §29.5\)|without explicit per-item user action" docs/FOUNDATIONS.md`
2. `npm run lint && npm run build`
3. A narrower per-section grep is the correct boundary here: this ticket adds no executable behavior, so the verification surface is exact-string presence of each amended clause, not a runtime test.

## Outcome

Completed: 2026-06-12

What changed:
- Amended `docs/FOUNDATIONS.md` with the sanctioned §9.1 assistance prompt class, scoped prose-only "no alternatives" language in §11/§19/§29, appended §26.1 assistance-output handling rules, and added the §29.2 hard-fail preventing automatic assistance-output insertion.
- Co-landed this constitutional amendment with SPEC021GROIDEPRO-002's first dependent core code in the same revision, per §1.1.

Deviations:
- None.

Verification:
- `grep -nE "9.1 Assistance prompt class|26.1 Assistance-output handling|\(§4.6, §11 item 7, §19, §29.5\)|without explicit per-item user action" docs/FOUNDATIONS.md` returned the required amendment anchors.
- `npm test -- ideation-slot-assignment` passed.
- `npm test -- boundary` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 112 files, 878 tests.
- `npm run build` passed; Vite reported the existing large-chunk warning.
