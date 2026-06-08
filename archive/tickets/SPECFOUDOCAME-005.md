# SPECFOUDOCAME-005: Amend user-guide.md and demo-blocker-recipes.md

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/user-guide.md` (The Loop, new Generation Readiness section, field guidance, FAQ) and `docs/demo-blocker-recipes.md` (true-blocker + non-blocking-warning recipes); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.6 + §4.7 + §5.2; constitution amended in SPECFOUDOCAME-001. -->

## Problem

The author-facing guide has no generation-readiness guidance (draft-save vs ready-to-generate, blockers vs warnings) and no field-level help for the draft/readiness model. The demo-blocker-recipes doc lists only blocker recipes — including a stale `sparse-voice-pressure` blocker that contradicts the new voice-pressure-optionality doctrine — and no non-blocking warning recipes. This ticket teaches the loop and demonstrates true blockers vs warnings.

## Assumption Reassessment (2026-06-08)

1. `docs/user-guide.md` headers exist: `## The Loop` (line 7), `## FAQ` (83) with subsections; `docs/demo-blocker-recipes.md` is a table-based recipe doc (recipes 1–8 at lines 12–19, intro at line 8) — confirmed this session.
2. Amendment plan from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.6 (user-guide) and §4.7 (demo recipes), with the voice-pressure cleanup from §5.2, validated against the live docs during `/reassess-spec`.
3. Cross-artifact boundary under audit: two author-facing files with distinct invariants — the user-guide is prose explanation; the demo recipes are concrete, runnable validation examples whose expected blocker codes must match the implemented engine. Merged here because both are author-facing and share the blocker-vs-warning framing. SPECFOUDOCAME-008 verifies the framing matches the other docs.
4. FOUNDATIONS principle under audit: §11 `Validation and hard fails` — warnings are advisory and never block; blockers prove deterministic impossibility / contract failure. The guide and recipes must present that split truthfully (a blocker means the app cannot safely compile/send; a warning means generation is possible but may be weaker).
5. Fail-closed validation surface touched: reclassifying the demo's missing-voice-pin scenario from blocker to warning aligns the doc with the implemented taxonomy (where `sparse-voice-pressure` is not a real blocker — see item 6). It does **not** weaken the secret firewall (§15, untouched) or determinism (§8); the genuine blocker recipes (`object-current-holder-contradiction`, `impossible-action-physical-context`, `offstage-interruption-missing-route`, `prompt-facing-prose-contamination`, `hidden-truth-in-pov-knowledge`, `local-prose-scope-violation`, `matrix-physical-interaction-incomplete`) remain blockers.
6. Adjacent contradiction classified: demo Recipe 7 ("Remove Niko's current cast voice row while dialogue is expected → `sparse-voice-pressure` → Blocked"). `grep -rn "sparse-voice-pressure" packages/` returns **nothing** — the code lives only in `docs/demo-blocker-recipes.md` and `docs/stress-coverage-matrix.md`, not the implemented validator. Under the new doctrine (current voice pressure is optional salience when durable cast anchors exist), this scenario is a **warning**, not a blocker. This is a required consequence of this ticket: reclassify Recipe 7 into the new non-blocking-warning section, removing the stale `sparse-voice-pressure` blocker framing. (The stress-coverage-matrix occurrence is fixed in SPECFOUDOCAME-006.)

## Architecture Check

1. A dedicated "Generation Readiness" section plus a non-blocking-warning recipe set gives authors a clear, demonstrable mental model (save freely; fix blockers; ignore warnings when reasonable) — cleaner than scattering the distinction across existing prose.
2. No backwards-compatibility aliasing: the stale `sparse-voice-pressure` blocker recipe is reclassified, not duplicated; no "legacy blocker" alias is retained.

## Verification Layers

1. (user-guide) Generation Readiness section + draft-save-vs-ready prose present → codebase grep-proof (`grep -nE "Generation Readiness|Draft saved|A blocker means" docs/user-guide.md`).
2. (user-guide) FAQ gains the three readiness Q&As → grep-proof of the new FAQ subsections.
3. (demo recipes) true-blocker recipes retained + non-blocking-warning recipes added → grep-proof of a new warning section and recipe rows.
4. (demo recipes) stale `sparse-voice-pressure` blocker reclassified → grep-proof (`grep -c "sparse-voice-pressure" docs/demo-blocker-recipes.md` reflects the reclassification; the row no longer reads "Blocked").
5. (cross-artifact) blocker/warning framing matches FOUNDATIONS §11 and the schema/compiler docs → FOUNDATIONS alignment + SPECFOUDOCAME-008 consistency gate.

## What to Change

### 1. `docs/user-guide.md`

- Under `## The Loop`: add that a Generation Brief can be saved before it is ready; saving preserves the draft; Preview/Generate become available only after required readiness items are fixed.
- New `## Generation Readiness` section: draft-saved vs ready-to-preview/generate; blockers vs warnings; warnings never block; raw technical codes live in details (suggested wording per spec §4.6).
- Field guidance: concise author-facing notes for `Generation context` (defaults from accepted-prose presence, stays visible), `Current state` (minimum = time/place/onstage/now), `Manual moment directive` (required launch action + examples; not a plot outline), `Stop guidance` (optional; blank uses universal stop rule), `Immediate handoff` (usually only for continuation), `Current cast voice pressure` (optional local emphasis; durable profiles primary).
- `## FAQ`: add "Why can I save a brief that still has blockers?", "Do I have to fill stop guidance?", "Why is the app asking for a manual directive?". (Spec §4.6.)

### 2. `docs/demo-blocker-recipes.md`

- Keep/curate the true-blocker recipes for: missing manual directive (blocks Preview/Generate, draft still saves); missing universal current-state floor; continuation missing handoff; nonlocal supplied stop guidance; physical-interaction tag missing positions/visibility/object state; secret-reveal missing holder/non-holder/reveal permission; provider settings missing (blocks Generate, not necessarily Preview).
- Add a **non-blocking warning** recipe set: blank `soft_unit_guidance` (no diagnostic / info only); long active cast dossiers (grouped salience warning); **missing current voice pressure pins with durable anchors present** (the reclassified Recipe 7 — warning only when local mode makes salience risk real); sparse setting texture; no active clock/thread in a quiet scene.
- Reclassify the stale Recipe 7 `sparse-voice-pressure` blocker per item 6; verify the kept blocker recipes' codes against the implemented engine. Each recipe states: setup, expected readiness result, expected author-facing copy, expected technical code, expected affected-target display behavior. (Spec §4.7.)

## Files to Touch

- `docs/user-guide.md` (modify)
- `docs/demo-blocker-recipes.md` (modify)

## Out of Scope

- The stress-coverage-matrix `sparse-voice-pressure` / `long-dossier-needs-pin` occurrences (SPECFOUDOCAME-006).
- Constitution / schema / compiler doctrine (SPECFOUDOCAME-001 / -002 / -003).
- Any production validator code or demo-fixture data change (owned by the archived behavioral specs; spec §8). If a kept blocker recipe's code does not resolve in the engine, flag it as a cross-spec follow-up rather than editing engine code here.
- Final cross-doc consistency search-checks (SPECFOUDOCAME-008).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "Generation Readiness|A blocker means|A warning means" docs/user-guide.md` returns the new readiness section; `grep -nE "Why can I save a brief|Do I have to fill stop guidance|asking for a manual directive" docs/user-guide.md` returns the FAQ additions.
2. `grep -nE "warning|advisory|grouped salience" docs/demo-blocker-recipes.md` returns the new non-blocking-warning recipes.
3. `grep -n "sparse-voice-pressure" docs/demo-blocker-recipes.md` shows the entry reclassified (no longer presented as a blocker that blocks compile).

### Invariants

1. The guide keeps its simple author-facing tone; no internal/engine terminology leaks as primary author copy.
2. Validation-truth invariant: every recipe still labelled a blocker maps to a real implemented blocker code; every non-blocking recipe is shown as advisory and explicitly does not block Preview/Generate.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). Demo validation behavior is covered by the archived demo/stress spec's tests; cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "Generation Readiness|Draft saved|blocker|warning" docs/user-guide.md` — confirm the readiness section + framing landed.
2. `grep -rn "sparse-voice-pressure" docs/demo-blocker-recipes.md packages/` — confirm the doc reclassification and that no engine code asserts it as a blocker.
3. Manual review of each kept blocker recipe's code against the implemented validator (the correct boundary — a recipe is only valid if its code is a real engine blocker, which is per-code, not a single grep).

## Outcome

Completed on 2026-06-08.

Changed `docs/user-guide.md` to add author-facing Generation Readiness guidance, explain draft saving versus readiness, distinguish blockers from warnings, document field guidance for generation context, current state, manual directive, stop guidance, immediate handoff, and current cast voice pressure, and add FAQ entries for saving blocked drafts, blank stop guidance, and manual directive requirements.

Changed `docs/demo-blocker-recipes.md` from a blocker-only table into true-blocker recipes plus non-blocking warning recipes. Reclassified the stale `sparse-voice-pressure` scenario as warning-only behavior using implemented warning codes such as `local-voice-pressure-may-help`, while retaining implemented blocker codes for true readiness failures.

Deviations from original plan: none. Provider configuration is documented as a Generate-only blocker using the implemented readiness code `provider-configuration-missing`.

Verification:

- `grep -nE "Generation Readiness|A blocker means|A warning means" docs/user-guide.md`
- `grep -nE "Why can I save a brief|Do I have to fill stop guidance|asking for a manual directive" docs/user-guide.md`
- `grep -nE "warning|advisory|grouped salience" docs/demo-blocker-recipes.md`
- `grep -n "sparse-voice-pressure" docs/demo-blocker-recipes.md packages/` returned no matches
- Manual code review confirmed each kept blocker or warning code appears in `packages/core/src/validation/types.ts` or the provider readiness code in `packages/core/src/validation/readiness.ts`.
