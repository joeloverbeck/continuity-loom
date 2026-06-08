# SPECFOUDOCAME-008: Documentation acceptance & cross-doc consistency gate

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — documentation acceptance/consistency verification runbook (no new files); no production behavior change.
**Deps**: SPECFOUDOCAME-001, SPECFOUDOCAME-002, SPECFOUDOCAME-003, SPECFOUDOCAME-004, SPECFOUDOCAME-005, SPECFOUDOCAME-006, SPECFOUDOCAME-007

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §5 + §7; SPEC-implementation-order-and-regression-plan.md Phase 7 regression coverage. -->

## Problem

Once the per-doc amendments land (SPECFOUDOCAME-001…007), the active-doc set must be verified to agree on the draft/readiness doctrine and to no longer carry the old over-gating phrasings. This trailing ticket is the §7 documentation acceptance gate plus the §5 cross-document conflict search-checks — it introduces no doctrine of its own; it exercises the set the prior tickets composed.

## Assumption Reassessment (2026-06-08)

1. This ticket exercises the surfaces produced by SPECFOUDOCAME-001…007: `docs/FOUNDATIONS.md`, `docs/story-record-schema.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/user-guide.md`, `docs/demo-blocker-recipes.md`, `docs/stress-coverage-matrix.md`, `docs/stress-suite.md`, `docs/ACTIVE-DOCS.md` — all confirmed present this session.
2. The acceptance and search-check criteria come from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §7 (preservation / consistency / prompt-template / search checks) and §5 (per-concept search-and-correct terms), and align with `specs/SPEC-implementation-order-and-regression-plan.md` Phase 7 regression coverage (lines 220–225: docs no longer claim blank stop guidance blocks; docs no longer claim current cast voice pressure is universal; docs state draft saving is independent of readiness).
3. Cross-artifact boundary under audit: the consistency contract is that all amended docs make the same statements about draft/readiness — distinct invariants (stop guidance, voice pressure, draft/readiness, generation context, current-state floor, warnings) each verified by its own grep/review surface, not collapsed into one "looks consistent" check.
4. FOUNDATIONS principle under audit: §29 alignment + §11 — the doc set must preserve each engaged §29 hard-fail's intent post-amendment (no LLM in compilation, no accepted prose in prompts, secret firewall, warnings never gate, human gatekeeping) and the warnings-vs-blockers split.
5. Determinism / secret-firewall verification surface: §7.3 prompt/template checks confirm the template still renders first-segment (blank stop guidance + blank handoff), continuation (user-authored handoff), and excludes accepted prose — a prose-firewall + determinism audit, not a behavior change.
6. Adjacent contradiction handling: the §5 search-checks run repo-wide over `docs/`; a hit in a doc **not** in SPECFOUDOCAME-001…007's scope (e.g. `README.md`) is a straggler — surface it as a cross-spec follow-up rather than silently editing an out-of-scope doc in this verification ticket.

## Architecture Check

1. A single trailing consistency gate is the right shape because cross-doc agreement only becomes checkable after every per-doc amendment lands; folding it into any one content ticket would create a staleness window where the gate runs against an incomplete set.
2. No backwards-compatibility aliasing and no production logic: this ticket only runs searches and a manual runbook; it modifies no doc and adds no code.

## Verification Layers

1. Preservation — each amended doc keeps its top-level headings and is not compressed → codebase grep-proof (`grep -c "^## " <doc>` per doc, compared to pre-amendment counts named in each upstream ticket).
2. Consistency — all docs agree on the §7.2 statements (draft save ≠ readiness; readiness gates Preview/Generate; `generation_context` defaults from accepted-segment count; blank `soft_unit_guidance` allowed; first-segment needs no continuation handoff; warnings never block) → per-statement grep across the doc set.
3. Stop-guidance / voice / draft / generation-context / current-state / warning cleanups (§5.1–§5.6) → negative grep-proofs (the retired phrasings no longer appear as active doctrine).
4. Prompt/template render checks (§7.3) → manual runbook review of `docs/prompt-template.md` (first-segment, continuation, no accepted prose, pins present/absent, long dossiers without per-record spam).
5. §29 intent preservation → FOUNDATIONS alignment check (manual) against §29.1/§29.4/§29.5/§29.6 + §20.

## What to Change

This is a verification-only ticket — it modifies no doc. Implementer runbook:

### 1. Automated search-checks (CI-runnable greps)

- §5.1 stop guidance: assert no active doc states blank `soft_unit_guidance` blocks (`grep -rnE "stop guidance is required|Blocks generation if blank" docs/` returns nothing in active doctrine; `missing-stop-guidance` appears only as a reclassified/warning reference).
- §5.2 voice pressure: assert no active doc states current cast voice pressure is required for active speakers / `sparse-voice-pressure` as a blocker; durable anchors are primary.
- §5.3 draft/readiness: assert docs state draft persistence accepts incomplete fields and readiness gates Preview/Generate.
- §5.4 generation context: assert `generation_context` is described as normalized + defaulted from accepted-segment count.
- §5.5 current state: assert the universal-floor-plus-context-gated framing (not "all fields always required").
- §5.6 warnings/gating: assert no active doc states warnings block.
- §7.4 search checks: the five retired statements no longer appear as active doctrine.

### 2. Manual runbook (not CI-runnable)

- §7.1 preservation: confirm each amended doc kept its headings, retained still-valid doctrine, was not compressed, and any removed text is listed in the PR notes.
- §7.2 consistency: read the twelve cross-doc statements and confirm every amended doc agrees.
- §7.3 prompt/template: confirm the template renders first-segment (blank stop guidance + blank handoff), continuation (user-authored handoff), no accepted prose, pins present/absent, and long dossiers without per-record warning spam.
- §29 intent: confirm no engaged hard-fail's intent is broken post-amendment.
- Record any §5 search hit in an out-of-scope doc (e.g. `README.md`) as a cross-spec follow-up.

## Files to Touch

- `None — verification-only` (the gate is exercised by the grep commands plus the manual runbook above; no doc is modified by this ticket).

## Out of Scope

- Modifying any doc (all content edits live in SPECFOUDOCAME-001…007); this ticket only verifies.
- Editing out-of-scope docs (e.g. `README.md`) flagged by the search-checks — those route to a cross-spec follow-up.
- Reconciling `IMPLEMENTATION-ORDER.md` or archiving this spec (cross-spec follow-ups).
- Any production code or test change.

## Acceptance Criteria

### Tests That Must Pass

1. The §5.1–§5.6 / §7.4 negative greps return no active-doctrine occurrences of the retired phrasings across `docs/` (the reclassified codes appear only as warnings/historical references).
2. The §7.2 consistency statements each grep-resolve in every amended doc that should carry them (draft≠readiness; readiness gates Preview/Generate; blank `soft_unit_guidance` allowed; `generation_context` defaulted; first-segment needs no continuation handoff; warnings never block).
3. `for d in FOUNDATIONS story-record-schema compiler-contract prompt-template prompt-template-rationale user-guide demo-blocker-recipes stress-coverage-matrix stress-suite ACTIVE-DOCS; do grep -q "^## " docs/$d.md || echo "MISSING headings $d"; done` prints nothing (no doc compressed away).

### Invariants

1. Every amended doc agrees on the draft/readiness doctrine; no doc still presents a retired over-gating phrasing as active doctrine.
2. §29 intent invariant: deterministic compilation (no LLM), no accepted prose in prompts, the secret firewall, warnings-never-gate, and human gatekeeping all remain intact across the doc set.

## Test Plan

### New/Modified Tests

1. `None — verification-only capstone ticket; the verification is the search-checks plus the manual runbook above. No new test file (the repo has no doc-consistency test harness); the §5/§7 greps are the CI-runnable portion and the prompt/§29 reviews are the implementer-checklist portion.`

### Commands

1. `grep -rnE "stop guidance is required|Blocks generation if blank|current cast voice pressure is required|warnings block|quality gap blocks" docs/` — the §5 retired-phrasing sweep; must return no active-doctrine hits (only reclassified/historical references).
2. `grep -rnE "draft|readiness|generation_context|universal floor|warnings (do not|never) block" docs/` — confirm the new doctrine is present and consistent across the set.
3. Manual runbook (§7.1 preservation, §7.3 prompt/template render, §29 intent) — the correct boundary for the non-greppable checks (heading preservation judgement, prose-firewall audit, hard-fail intent).
