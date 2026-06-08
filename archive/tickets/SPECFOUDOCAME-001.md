# SPECFOUDOCAME-001: Amend FOUNDATIONS.md for the draft/readiness split

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `docs/FOUNDATIONS.md` doctrine sections (§3, §4.5, §6.3, §8, §9, §11, §16, §17, §27, §29); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.1; decomposition of SPEC-implementation-order-and-regression-plan.md Phase 7. -->

## Problem

The constitution does not yet distinguish *saving a generation-brief draft* (ordinary authoring) from *generation readiness* (the gate on Preview / compilation / Generate / send). It also lacks the blocker taxonomy that separates true deterministic-impossibility blockers from advisory quality/salience warnings. Without these, the docs over-gate generation validation and confuse draft persistence with readiness. This ticket amends the constitution so the rest of the active-doc set has an authoritative draft/readiness doctrine to synchronize to.

## Assumption Reassessment (2026-06-08)

1. The target sections exist in `docs/FOUNDATIONS.md` at their cited headings: §3 `Core loop`, §4.5 `Fail closed`, §6.3 `Generation-time brief`, §8 `Deterministic prompt compilation`, §9 `Universal prose prompt contract`, §11 `Validation and hard fails`, §16 `Physical continuity`, §17 `Character voice and cast dossiers`, §27 `UI and workflow principles`, §29 `Alignment checklist` — all confirmed present (sections 1–30 intact).
2. The amendment text and per-section plan come from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.1, validated against the live constitution during `/reassess-spec` this session.
3. Cross-artifact boundary under audit: `FOUNDATIONS.md` is the constitutional authority the other Phase-7 docs (schema, compiler-contract, prompt-template, user-guide, stress docs) must align with (FOUNDATIONS §1). This ticket changes only `FOUNDATIONS.md`; sibling docs are amended in SPECFOUDOCAME-002…007 and reconciled by the SPECFOUDOCAME-008 consistency gate.
4. FOUNDATIONS principles motivating this ticket (sanctioned constitutional amendment per FOUNDATIONS §1 — "the feature is wrong unless this document is deliberately amended first"): the intended doctrine is **draft persistence ≠ generation readiness** (saving an incomplete brief is ordinary authoring; fail-closed gates compilation/preview/send only) and **warnings never gate** (quality/salience/length/lost-in-the-middle risks are advisory unless they also prove a structural prompt-contract failure, hard contradiction, policy conflict, or deterministic impossibility).
5. Fail-closed / deterministic-compilation surfaces touched: §4.5 (Fail closed), §8 (Deterministic compilation), §11 (Validation and hard fails). The amendment **relaxes** specific gates (draft saving, blank `soft_unit_guidance`, universal current-state floor) but preserves each §29 hard-fail's intent: deterministic compilation with no LLM intermediary (§8/§29.4), no accepted prose in prompts (§10/§29.1), the secret firewall (§15/§29.6), warnings never gating (§29.5), and human gatekeeping (§20). The §8 amendment adds that compilation consumes a *normalized readiness input* and that normalization may apply deterministic non-story defaults (e.g. `generation_context` from accepted-segment count) but must not invent story facts — strengthening, not weakening, determinism.
6. Adjacent contradiction classified: the spec's earlier draft assumed §11 carried a removable `missing stop guidance;` hard-fail bullet. It does **not** (verified — zero matches in `FOUNDATIONS.md`); §11's only stop-guidance bullet is the nonlocal-request blocker, which is retained. The blank-stop-guidance over-gating lives in `docs/story-record-schema.md` §3.8 and the `missing-stop-guidance` validation code in `docs/stress-coverage-matrix.md` Cases 7/26 — fixed in SPECFOUDOCAME-002 and -006, **not here**. This ticket adds no removal of a §11 bullet.

## Architecture Check

1. Surgical amendment preserves the constitution's still-valid doctrine (record-first continuity, the five surfaces, no-accepted-prose, POV/secret firewall) while correcting only the over-gating sentences — far safer than the rejected "compressed replacement" approach (spec §1–§2) that dropped canonical sections without proof of obsolescence.
2. No backwards-compatibility aliasing or shims: doctrine is amended in place; no parallel/duplicate authority path is created. FOUNDATIONS remains the single constitutional authority.

## Verification Layers

1. Draft/readiness split present in §3 and §6.3 → codebase grep-proof (`grep -n "draft" docs/FOUNDATIONS.md` returns the new doctrine in §3 Core loop and §6.3).
2. Fail-closed scoped to compilation/preview/send, not draft saving (§4.5) → manual review of §4.5 prose + grep for the added draft-saving clause.
3. Blocker taxonomy + no-LLM-validation + warnings-never-gate present in §11 → grep-proof of the taxonomy and the explicit "validation cannot use an LLM" / "warnings never block Preview or Generate" lines.
4. §29 alignment checklist gains the seven new readiness checks → grep-proof in §29.
5. Each §29 hard-fail's *intent* preserved (no LLM in compilation, no accepted prose, secret firewall, warnings never gate, human gatekeeping) → FOUNDATIONS alignment check (manual, against §29.1/§29.4/§29.5/§29.6 and §20).

## What to Change

### 1. §3 `Core loop` — add draft persistence

Add doctrine that generation-time brief editing has a draft state; saving an incomplete brief is ordinary authoring and is not blocked by readiness validation. Distinguish the workflow steps: save draft → run readiness → fix blockers → preview/compile/send only when ready. Do not remove the human-accepted-prose loop, durable-change reminder, or no-accepted-prose doctrine. (Spec §4.1 → §3 block.)

### 2. §4.5 `Fail closed` — scope to compilation/preview/send

Add that fail-closed applies to prompt compilation, prompt-preview availability where no valid prompt can compile, and provider sending — **not** to saving a structurally saveable draft, and not a license for advisory warnings to block Preview/Generate. The current §4.5 already carries the warnings-vs-blockers nuance; the net-new clause is the draft-saving distinction. (Spec §4.1 → §4.5 block.)

### 3. §6.3 `Generation-time brief` — add the draft/ready split

Add the two operational states (draft vs ready) and that deterministic defaults (esp. `generation_context`) are allowed when derived from project state and do not invent story content. (Spec §4.1 → §6.3 block.)

### 4. §8 `Deterministic prompt compilation` — normalized readiness input

Add that the compiler receives a normalized readiness input; normalization may apply deterministic non-story defaults (first-segment vs continuation from accepted-segment count) but must not invent story facts, handoff prose, current situation, routes, positions, voice pressure, or directive content. (Spec §4.1 → §8 block.)

### 5. §9 `Universal prose prompt contract` — stop rule independent of stop guidance

Add that the universal prompt always contains the local-unit stop rule; blank optional stop guidance is not a structural prompt failure; nonlocal/contradictory supplied stop guidance remains a blocker. (Spec §4.1 → §9 block.)

### 6. §11 `Validation and hard fails` — blocker taxonomy + warning discipline

Add the blocker taxonomy from spec §3.2 and that readiness diagnostics must be author-actionable (no raw codes as primary message). Make explicit: warnings never compile into the prompt; warnings never block Preview/Generate; validation cannot use an LLM; validation cannot infer semantics from prose to create hidden blockers; deterministic threshold warnings are allowed only as warnings. **Do not** add or remove a `missing stop guidance;` bullet — none exists (see Assumption Reassessment 6); retain the nonlocal-request blocker and `missing manual directive;`. (Spec §4.1 → §11 block.)

### 7. §16, §17, §27, §29 — context-gating, voice optionality, readiness checklist, alignment checks

- §16 `Physical continuity`: clarify that the minimum current state is universal; detailed spatial/affordance fields are context-gated. (Spec §4.1 → §16 block.)
- §17 `Character voice and cast dossiers`: durable CAST MEMBER records are primary voice authority; current cast voice pressure is optional salience reinforcement that blocks only on contradiction or when the local mode needs voice/body authority with no durable/compressed source. (Spec §4.1 → §17 block.)
- §27 `UI and workflow principles`: add readiness-checklist doctrine (one readiness model drives Generation Brief, Preview, Generate; diagnostics as a checklist, not raw codes). (Spec §4.1 → §27 block.)
- §29 `Alignment checklist`: add the seven readiness checks (draft saving not blocked by readiness; Preview/Generate blocked only by true blockers; blank `soft_unit_guidance` allowed; `manual_moment_directive.must_render` readiness-required; `generation_context` defaults deterministically; current cast voice pressure optional unless contradiction/no authority; warnings cannot gate). (Spec §4.1 → §29 block.)

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Editing the `missing-stop-guidance` validation code or the `Blocks generation if blank` rule — those live in `docs/story-record-schema.md` (SPECFOUDOCAME-002) and `docs/stress-coverage-matrix.md` (SPECFOUDOCAME-006).
- Any production code, schema, validator, or compiler change (owned by the archived behavioral specs; spec §8).
- Sibling-doc synchronization and the §5/§7 consistency search-checks (SPECFOUDOCAME-008).
- Reconciling `IMPLEMENTATION-ORDER.md` or archiving this spec (cross-spec follow-ups).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "draft state|Saving an incomplete generation brief|draft and ready" docs/FOUNDATIONS.md` returns the new §3/§6.3 doctrine.
2. `grep -nE "Fail closed applies to prompt compilation|normalized readiness input|validation cannot use an LLM" docs/FOUNDATIONS.md` returns the §4.5/§8/§11 additions.
3. `grep -c "missing stop guidance" docs/FOUNDATIONS.md` returns `0` (no spurious bullet introduced); `grep -c "missing manual directive" docs/FOUNDATIONS.md` returns ≥1 (retained).

### Invariants

1. Constitutional sections 1–30 remain present; no section deleted (`grep -c "^## " docs/FOUNDATIONS.md` unchanged or higher).
2. No §29 hard-fail intent is broken: deterministic compilation has no LLM intermediary, no accepted prose enters prompts, the secret firewall holds, warnings never gate, and human gatekeeping remains authoritative.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below) and the constitution carries no automated doc test. Cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "draft|readiness|normalized readiness input|blocker taxonomy" docs/FOUNDATIONS.md` — confirm the added doctrine lands in the intended sections.
2. `grep -c "^## " docs/FOUNDATIONS.md` — confirm no top-level section was dropped.
3. Manual review of §29 against §29.1/§29.4/§29.5/§29.6 + §20 — confirm each engaged hard-fail's intent is preserved post-amendment (the correct verification boundary, since intent preservation is not greppable).

## Outcome

Completed on 2026-06-08.

Changed `docs/FOUNDATIONS.md` to document the generation-brief draft/readiness split, scope fail-closed behavior to readiness surfaces rather than draft persistence, define normalized readiness input for deterministic compilation, add the readiness blocker taxonomy and no-LLM validation rule, clarify optional stop guidance, context-gated physical detail, and current cast voice pressure optionality, and add readiness checklist doctrine and §29 alignment checks.

Deviations from original plan: none. The existing `missing manual directive` blocker was preserved, and no `missing stop guidance` blocker was introduced.

Verification:

- `grep -nE "draft state|Saving an incomplete generation brief|draft and ready" docs/FOUNDATIONS.md`
- `grep -nE "Fail closed applies to prompt compilation|normalized readiness input|validation cannot use an LLM" docs/FOUNDATIONS.md`
- `grep -c "missing stop guidance" docs/FOUNDATIONS.md` returned `0`
- `grep -c "missing manual directive" docs/FOUNDATIONS.md` returned `1`
- `grep -c "^## " docs/FOUNDATIONS.md` returned `30`
- Manual §29 intent review confirmed deterministic compilation, no accepted prose in prompts, the secret firewall, warning/blocker separation, and human gatekeeping remain intact.
