# SPEC027RECHYGASS-008: Cross-cutting documentation sync

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — modifies six documentation surfaces (`docs/ideation-prompt-template.md`, `docs/validation-rule-inventory.md`, `docs/user-guide.md`, `README.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`); no production behavior change.
**Deps**: SPEC027RECHYGASS-007

## Problem

The non-§8-bound documentation surfaces must sync once the feature surfaces exist coherently: the ideation-template opening renamed to the `prose-aligned` source profile (doctrinal coherence with the §9.1 amendment), a note that hygiene findings are not validation diagnostics, the user-guide and README Record Hygiene workflow, and the record-hygiene stress cases + coverage matrix. These reference the compiler, routes, page, and version that earlier tickets build, so they land atomically as a trailing docs diff.

## Assumption Reassessment (2026-06-21)

1. **Doc surfaces exist (codebase).** `docs/ideation-prompt-template.md:11` opens "The ideation prompt is the sanctioned assistance prompt class from `docs/FOUNDATIONS.md` Section 9.1… compiled from the same authority sources as the prose prompt" — the replace-target verified this session. `docs/validation-rule-inventory.md`, `docs/user-guide.md`, `README.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md` all exist (pre-write `test -f` confirmed).
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 6 + proposal §11.3 (ideation opening), §11.6 (validation-inventory note), §11.8 (user guide), §11.9 (README), §11.10 (stress cases), §11.11 (coverage matrix). Proposal §11.7 / §11.12: `docs/narrative-theory-blocker-roadmap.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md` get **no behavior change** (optional cross-reference only) — not ticketed.
3. **Cross-artifact boundary under audit.** These docs reference surfaces built across SPEC027RECHYGASS-002…007 (compiler, version, routes, page). `Deps: SPEC027RECHYGASS-007` is the transitive head of the linear implementation chain (001←002←004←005←006←007, 003←004), so all referenced surfaces exist when this lands. The §8-bound docs (`docs/compiler-contract.md`, `docs/story-record-schema.md`) and the ACTIVE-DOCS registry are **not** here — they co-landed in 004 / 003 respectively.
4. **FOUNDATIONS principle motivating this ticket.** §9.1 (amended) doctrinal coherence — the ideation opening must restate ideation as the `prose-aligned` source profile so the doc set moves together with the amendment; §11 — the validation-inventory note must state hygiene findings are **not** validation diagnostics and add **no** diagnostic code.
5. **No validation code / no gate added (§11).** Confirm the `validation-rule-inventory.md` edit is the single documentary note only — it adds no diagnostic code to the inventory table — and the stress docs add review *cases*, not gates that block any operation.

## Architecture Check

1. **A trailing cross-cutting docs ticket beats per-ticket scattering here.** These surfaces require the whole feature to exist coherently (the user guide describes the page + send disclosure; the stress matrix maps cases to the compiler/server/web tests). Landing them atomically avoids a staleness window. The §8-bound contract/schema docs deliberately stayed with their code ticket (004) instead.
2. **No backwards-compatibility aliasing/shims.** Additive doc edits; the ideation opening is replaced in full (no dual-wording path); no hygiene contract is duplicated into the prose-prompt authorities.

## Verification Layers

1. Ideation opening names the `prose-aligned` source profile → codebase grep-proof in `docs/ideation-prompt-template.md`.
2. Validation-inventory note present and **no** new diagnostic code added → grep-proof (the inventory's code table is unchanged; only the note is added).
3. User-guide + README carry the Record Hygiene workflow + non-canonical/no-auto-write warning → grep-proof.
4. Stress-suite has the record-hygiene cases and the coverage matrix has the Record-hygiene row group + completeness requirement → grep-proof.

## What to Change

### 1. `docs/ideation-prompt-template.md` (modify)
Replace the opening paragraph per proposal §11.3 — name it the `prose-aligned` assistance source profile under §9.1; no other ideation behavior changes.

### 2. `docs/validation-rule-inventory.md` (modify)
Add only the single optional documentary note (proposal §11.6) that hygiene findings are non-deterministic advisory output and do not appear in the inventory or gate any operation. Add no diagnostic code.

### 3. `docs/user-guide.md` (modify)
Add the "Review overlapping active records" subsection and the post-acceptance-loop line (proposal §11.8).

### 4. `README.md` (modify)
Add the capability bullet and the Record Hygiene menu/workflow warning (proposal §11.9).

### 5. `docs/stress-suite.md` (modify)
Add the 20 record-hygiene assistance stress cases (proposal §11.10).

### 6. `docs/stress-coverage-matrix.md` (modify)
Add the Record-hygiene row group mapping each case to its proof surface and the exact coverage-completeness requirement (proposal §11.11).

## Files to Touch

- `docs/ideation-prompt-template.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `docs/user-guide.md` (modify)
- `README.md` (modify)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)

## Out of Scope

- `docs/compiler-contract.md` + `docs/story-record-schema.md` (§8-co-located in SPEC027RECHYGASS-004) and `docs/ACTIVE-DOCS.md` (SPEC027RECHYGASS-003) and `docs/FOUNDATIONS.md` (SPEC027RECHYGASS-001).
- `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/narrative-theory-blocker-roadmap.md` — no behavior change.
- Any production code; any validation diagnostic code.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "prose-aligned" docs/ideation-prompt-template.md` returns the reworded opening; `grep -c "compiled from the same authority sources as the prose prompt" docs/ideation-prompt-template.md` no longer matches the old framing as a standalone claim.
2. `grep -ni "hygiene" docs/validation-rule-inventory.md` returns the documentary note only — the inventory's diagnostic-code table gains no new code.
3. `grep -ni "record hygiene" docs/user-guide.md README.md` and `grep -nic "hygiene" docs/stress-suite.md docs/stress-coverage-matrix.md` confirm the workflow sections, the 20 stress cases, and the coverage row group are present.

### Invariants

1. No diagnostic code is added to `docs/validation-rule-inventory.md`; hygiene findings remain non-validation advisory output.
2. The hygiene contract is documented only in its authority doc (003) + the schema/contract docs (004); it is not duplicated into the prose-prompt authorities.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is grep-based against the post-implementation tree, and feature behavior is covered by SPEC027RECHYGASS-002…007 plus the capstone (009).`

### Commands

1. `grep -nE "prose-aligned|record hygiene|Record Hygiene" docs/ideation-prompt-template.md docs/user-guide.md README.md` — doctrinal + workflow presence.
2. `grep -nic "hygiene" docs/stress-suite.md docs/stress-coverage-matrix.md` — stress-case + coverage-row presence (expect the 20-case block and the row group).
3. Grep-proofs against the post-implementation tree are the correct boundary because this ticket is documentation-only; the behaviors the docs describe are gated by the capstone (SPEC027RECHYGASS-009).
