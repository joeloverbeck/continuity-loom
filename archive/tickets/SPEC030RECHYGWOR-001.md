# SPEC030RECHYGWOR-001: FOUNDATIONS amendment — explicit user-selected scope for project-review assistance prompts

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `docs/FOUNDATIONS.md` §9.1 project-review bullet, a new §9.1 scope paragraph, and the §29.3 project-review hard-fail bullet; no production code change.
**Deps**: None

## Problem

Record Hygiene (SPEC-027) is a `project-review` assistance prompt. The literal post-SPEC-027 constitution binds it to the whole project: §9.1 (`docs/FOUNDATIONS.md:320`) defines project-review as "a deterministic records-only projection … across the project," and §29.3 (`:1012`) hard-fails any project-review prompt that "hide[s], var[ies], or incompletely render[s] its declared whole-project source predicate." SPEC-030 lets the author scope hygiene to the active working set — which is incompatible with that literal wording. FOUNDATIONS §1 requires the constitution be "deliberately amended first" before such a feature is legal. This ticket lands that amendment. The amendment wording was signed off in-session (recorded at `specs/SPEC-030-record-hygiene-working-set-scope.md:247`).

## Assumption Reassessment (2026-06-22)

1. The three amendment targets exist verbatim where the spec claims: §9.1 project-review bullet at `docs/FOUNDATIONS.md:320`; the "Assistance source selection must never be … taken from hidden UI state." sentence ending at `:322`; the §29.3 project-review hard-fail bullet at `:1012`. Confirmed by direct read this session. No production code references these prose lines.
2. The spec's Deliverable 0 (`specs/SPEC-030-record-hygiene-working-set-scope.md:205-249`) carries the exact From/To wording for §0.1/§0.2/§0.3 and the recorded sign-off at `:247`. The companion docs that restate the doctrine (`docs/story-record-hygiene-prompt-template.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md §9.3`) are NOT edited here — they co-land with their implementing code in SPEC030RECHYGWOR-002/003 (per the §8 co-location rule).
3. Cross-artifact boundary under audit: `docs/FOUNDATIONS.md` is the constitution that governs the record-hygiene compiler (`packages/core/src/compiler/hygiene/`) and snapshot builder (`packages/server/src/record-hygiene-snapshot-builder.ts`). This ticket changes only the governing doc; the dependent behavior lands in -002 (compiler) and -003 (server). Per FOUNDATIONS §1.1, the amendment must ship in the **same revision** as the first dependent behavior (-002), never standalone ahead of it.
4. FOUNDATIONS principle restated before trusting the spec narrative: §9.1 binds each assistance prompt to exactly one declared source profile, and the project-review profile's §29.3 guard exists to forbid *silent / model / eviction-driven* shrinkage of the source — not an *explicit authorial choice*. The amendment widens the profile to "an explicit, user-selected, disclosed scope" while keeping every silent/probabilistic/model/token-budget/hidden-UI path forbidden (the §0.2 paragraph restates the full prohibition list for scope selection).
5. Deterministic-compilation (§8) and secret-firewall (§15) enforcement surfaces touched: the §29.3 hard fail guards deterministic whole-project rendering. Confirm the amendment preserves that intent — the reworded bullet still forbids hiding/varying/incompletely rendering the predicate *within the declared scope* and adds two new prohibitions (applying an unselected scope; failing to disclose the active scope). It grants no record prose authority and reads the working set without mutating it, so the secret firewall and human gatekeeping are untouched. Per the constitutional-amendment carve-out, relaxing the literal "whole-project" wording is the intended deliverable, not a §29 violation, because the hard-fail's intent is preserved.
6. Rename/removal blast radius (the amendment rewords two doc-governed bullets): grep `docs/FOUNDATIONS.md` for the doctrine being moved — `whole-project` and `across the project` resolve to exactly the two bullets edited here (`:320`, `:1012`); no orphaned third occurrence remains inside FOUNDATIONS. The sibling docs carrying the same doctrine are addressed in -002 (see item 2). Verified by `grep -ni "whole.project\|across the project" docs/FOUNDATIONS.md` returning only the two target lines.

## Architecture Check

1. Two narrow additive edits plus one reworded hard fail is cleaner than introducing a new prompt class or a parallel "scoped-review" profile: the project-review profile already owns the deterministic-records-only projection semantics; widening its declared scope keeps one source profile, one hard-fail bullet, and one audit surface rather than forking the doctrine.
2. No backwards-compatibility aliasing or shims: the old §9.1/§29.3 wording is replaced in place, not retained alongside the new wording. No dual authority path.

## Verification Layers

1. Amendment wording matches the signed-off Deliverable-0 text → codebase grep-proof (`grep -F` the new §0.1/§0.2/§0.3 sentences against `docs/FOUNDATIONS.md` and the spec).
2. Internal coherence — no orphaned "whole-project" bullet left contradicting the new doctrine → codebase grep-proof (`grep -ni "whole.project\|across the project" docs/FOUNDATIONS.md` returns only the intended new wording).
3. §29 hard-fail intent preserved (deterministic compilation, no LLM intermediary, no eviction, secret firewall, disclosure) → FOUNDATIONS alignment check against §8/§15/§29.3/§29.4.

## What to Change

### 1. §0.1 — Replace the §9.1 project-review bullet (`docs/FOUNDATIONS.md:320`)

Replace the existing bullet with the Deliverable-0 §0.1 "To" wording: a deterministic records-only projection of explicitly named story-record types, "drawn from an explicit, user-selected, disclosed scope — the whole project by default, or a narrower scope the user has explicitly chosen (for example, the active working set) — with explicit archive and per-type status predicates applied identically to every record within that scope."

### 2. §0.2 — Insert one paragraph into §9.1 (immediately after the sentence ending at `:322`, "…taken from hidden UI state.")

Add the Deliverable-0 §0.2 paragraph: a project-review prompt may offer more than one scope only when every scope is explicit, user-selected, deterministic, and disclosed; the active scope must be named in the compiled prompt and the inspection UI; the declared predicates must render every qualifying record within the selected scope; reading active-working-set membership to honor a working-set scope is not a mutation and grants no prose authority; and scope selection — exactly like source selection — must never be keyword-triggered, probabilistic, model-selected, token-budget-evicted, inferred from accepted prose/candidates, derived from author-private notes, or taken from hidden UI state.

### 3. §0.3 — Replace the §29.3 project-review hard-fail bullet (`docs/FOUNDATIONS.md:1012`)

Replace the existing bullet with the Deliverable-0 §0.3 "To" wording: "Does a project-review assistance prompt hide, vary, or incompletely render the source predicate within its declared, user-selected scope; apply a scope the user did not explicitly select; or fail to disclose its active scope in the compiled prompt and the inspection UI?"

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Any edit to the sibling docs that restate the doctrine (`docs/story-record-hygiene-prompt-template.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md §9.3`) — those co-land with their implementing code in -002/-003.
- Any production code change (compiler, snapshot builder, routes, web) — those are -002/-003/-004.
- Changing the default scope away from whole-project (the spec keeps whole-project default).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -F "drawn from an explicit, user-selected, disclosed scope" docs/FOUNDATIONS.md` returns the new §9.1 bullet.
2. `grep -F "apply a scope the user did not explicitly select" docs/FOUNDATIONS.md` returns the new §29.3 bullet.
3. `grep -ni "whole.project\|across the project" docs/FOUNDATIONS.md` shows no orphaned bullet still binding project-review to the whole project under the old doctrine.
4. `npm run lint` (markdown/doc lint, if any) passes; no code tests are affected by this ticket.

### Invariants

1. The §29.3 / §29.4 self-audit answers every existing and new hard-fail question "No": deterministic compilation with no LLM intermediary, no accepted prose in prompts, the secret firewall, no token-budget eviction, and human gatekeeping all remain intact post-amendment.
2. Exactly one source profile governs project-review; no parallel/duplicate scope-doctrine path is introduced.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -F "drawn from an explicit, user-selected, disclosed scope" docs/FOUNDATIONS.md && grep -F "apply a scope the user did not explicitly select" docs/FOUNDATIONS.md`
2. `npm run lint`
3. A narrower doc-grep boundary is correct here because this ticket changes only constitutional prose; no compiler/validation behavior changes, so the full `npm test` pipeline is exercised by the dependent ticket -002 (which co-lands in the same revision).

## Same-Revision Co-Landing Constraint (FOUNDATIONS §1.1)

This amendment must land in the **same revision (commit/PR)** as SPEC030RECHYGWOR-002 (the first dependent behavior), never standalone ahead of it. -002 declares `Deps: SPEC030RECHYGWOR-001` and carries the mirror of this constraint. The amendment wording is already signed off (`specs/SPEC-030-record-hygiene-working-set-scope.md:247`).

## Outcome

Completed: 2026-06-22

What changed:

- Updated `docs/FOUNDATIONS.md` §9.1 so `project-review` assistance prompts may use an explicit, user-selected, disclosed scope, with whole-project as the default and active working set as an allowed narrower scope.
- Added the signed-off §9.1 paragraph requiring scope disclosure in compiled prompts and inspection UI, complete predicate rendering within scope, no working-set mutation, and no keyword/model/token-budget/hidden-state scope selection.
- Reworded the §29.3 hard-fail bullet to reject incomplete rendering within the declared scope, unselected scopes, and missing prompt/UI disclosure.

Deviations:

- Co-landed in the same revision as SPEC030RECHYGWOR-002, as required by FOUNDATIONS §1.1 and this ticket's same-revision constraint.

Verification:

- `grep -F "drawn from an explicit, user-selected, disclosed scope" docs/FOUNDATIONS.md && grep -F "apply a scope the user did not explicitly select" docs/FOUNDATIONS.md` passed.
- `grep -ni "whole.project\|across the project" docs/FOUNDATIONS.md` returned only the new §9.1 scope wording, with no old whole-project-only project-review bullet.
- `npm test -- record-hygiene-golden` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
