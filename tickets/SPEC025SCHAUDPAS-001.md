# SPEC025SCHAUDPAS-001: FOUNDATIONS §10 amendment — sharpen no-accepted-prose, drop the named-field exception

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — docs (`docs/FOUNDATIONS.md` §10 amendment); no production behavior change
**Deps**: None

## Problem

`docs/FOUNDATIONS.md` §10 forbids naming any prompt field as accepted prose, then immediately names `prior_accepted_prose_status_or_handoff_note` as the sanctioned exception (`docs/FOUNDATIONS.md:409`). SPEC-025 R2 (ticket 002) removes that field; leaving §10 naming a field the code no longer has would make the constitution describe a non-existent surface. This is a constitutional amendment under FOUNDATIONS §1.1: it must be signed off on its exact wording and must land in the **same revision** as the field removal, never standalone ahead of it.

The amendment **sharpens** the no-accepted-prose doctrine — it removes a named exception and replaces it with a stronger source-level invariant. It does not loosen any §10 rule.

## Assumption Reassessment (2026-06-20)

1. The §10 field-naming paragraph exists verbatim at `docs/FOUNDATIONS.md:409` ("The correct generation-time field is `prior_accepted_prose_status_or_handoff_note`. ..."); the general prohibition above it at `:407` ("Prompt, schema, and compiler surfaces must not name or label any prompt field as ...") is the rule that stays. Confirmed by grep during SPEC-025 reassessment.
2. SPEC-025 Deliverable 0 supplies the exact replacement wording and gates ticket 002 on it; `specs/SPEC-025-schema-audit-pass-2-authority-deduplication.md` §"Deliverable 0" carries the fenced amendment text and the "if sign-off declined, drop R2 entirely" rule.
3. Cross-artifact boundary under audit: the constitution (`docs/FOUNDATIONS.md`) and the schema/code surface ticket 002 removes. The shared contract is the no-accepted-prose firewall — this ticket changes only the *doc* expression of it; the *code* firewall (the contamination scan) is preserved by ticket 002.
4. FOUNDATIONS principle motivating this ticket: §10 "No accepted prose in generated prompts" and §1.1 "Amendment procedure and precedence." Restated: amendments must (1) be explicitly labeled with exact wording, (2) receive explicit user sign-off before implementation, (3) land in the same revision as the coupled code change, (4) update the §29 checklist when they change what proposals must clear. This amendment changes no §29 hard-fail item (the field name appears nowhere in §29), so no §29 edit is required — verified: `grep -n prior_accepted_prose_status_or_handoff_note docs/FOUNDATIONS.md` returns only `:409`.
5. Enforcement-surface check (§8/§15): the amendment touches the no-accepted-prose firewall doctrine. It does **not** weaken it — it removes a named exception and asserts a stronger source-level rule ("no prompt-facing schema field may use accepted prose ... as its source"). The deterministic contamination scan that enforces the firewall (`packages/core/src/validation/rules/universal-blockers.ts`, `isCleanNoAcceptedProseNote`) is preserved by ticket 002 against the remaining genuinely prompt-facing handoff lanes; this doc change introduces no leakage or nondeterminism path.
6. Doc-governed-contract removal blast radius: the field name `prior_accepted_prose_status_or_handoff_note` recurs across `docs/`, `packages/`, and tests, but within **`docs/FOUNDATIONS.md` it appears only at `:409`** — so this constitutional amendment is self-contained to §10. Every other occurrence (schema docs, compiler contract, code, tests) is owned by ticket 002, not this ticket.

## Architecture Check

1. Keeping the amendment as its own ticket isolates the constitutional sign-off surface from the code diff while the §1.1 co-landing constraint keeps them atomic — cleaner than merging into 002 (which would bury the exact constitutional wording inside a large code removal and blur the sign-off boundary) and safer than a standalone doc commit ahead of the code (which §1.1 forbids).
2. No backwards-compatibility aliasing or shims: the old exception text is replaced, not retained alongside the new invariant.

## Verification Layers

1. The §10 exception naming the field is gone → codebase grep-proof: `grep -n "prior_accepted_prose_status_or_handoff_note" docs/FOUNDATIONS.md` returns zero matches after the amendment.
2. The stronger invariant is present → codebase grep-proof: `grep -n "No prompt-facing schema field may use accepted prose" docs/FOUNDATIONS.md` returns one match.
3. The §10 general prohibition and durable-change-into-records rule are preserved → manual review of §10 against the pre-amendment text (no rule weakened).
4. Amendment does not alter any §29 hard-fail → FOUNDATIONS alignment check: §29 text unchanged; field name absent from §29 (grep-proof on the whole doc returns only the §10 site, now removed).

## What to Change

### 1. Replace the §10 field-naming exception with the stronger invariant

In `docs/FOUNDATIONS.md` §10, remove the paragraph at `:409` that names `prior_accepted_prose_status_or_handoff_note` as "the correct generation-time field," and replace it with the wording fixed by SPEC-025 Deliverable 0:

> No prompt-facing schema field may use accepted prose, rejected candidates, superseded candidates, or automatic prose-derived summaries as its source. Continuation launch must use user-authored recent causal context plus a visible or imperative cutpoint, grounded in selected records and current authoritative state.

Preserve every other §10 rule: the general prohibition at `:407` (no prompt field labeled as accepted prose), accepted prose remains excluded, and durable change must still be written into records / current state before the next prompt (`:411`). Introduce no archive mining, summaries, phrase reuse, or hidden inference.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- The R2 field removal itself and all schema/compiler/validation/migration/web/test changes — owned by ticket 002 (this ticket is the constitutional doc edit only).
- Any other §10 rule, any §29 checklist edit (none required), and any sibling authority doc (`docs/story-record-schema.md` §10 sync is owned by 002).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "prior_accepted_prose_status_or_handoff_note" docs/FOUNDATIONS.md` — returns nothing (exception removed).
2. `grep -n "No prompt-facing schema field may use accepted prose" docs/FOUNDATIONS.md` — returns one match in §10.
3. `npm run lint && npm run typecheck && npm test` — green (this doc-only change must not break the suite; no code or golden depends on the removed §10 sentence).

### Invariants

1. Within `docs/FOUNDATIONS.md`, the no-accepted-prose firewall is stated at least as strictly as before — a named-field exception is replaced by a source-level prohibition, never relaxed.
2. The amendment lands in the same revision as ticket 002's field removal and is never committed standalone ahead of it (§1.1).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -n "prior_accepted_prose_status_or_handoff_note\|No prompt-facing schema field may use accepted prose" docs/FOUNDATIONS.md`
2. `npm run lint && npm run typecheck && npm test`
3. A narrower command is correct here because the deliverable is a single constitutional paragraph swap; the grep proves the swap and the full pipeline proves no regression — there is no behavior to unit-test.
