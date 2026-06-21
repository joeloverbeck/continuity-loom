# SPEC027RECHYGASS-003: Record-hygiene authority doc + ACTIVE-DOCS registry

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new authority doc `docs/story-record-hygiene-prompt-template.md` and `docs/ACTIVE-DOCS.md` registry + version-note edits (documentation surfaces). No production behavior change; the doc is the normative contract the compiler (SPEC027RECHYGASS-004) implements.
**Deps**: `archive/tickets/SPEC027RECHYGASS-001.md`

> **Same revision; never merge standalone (§8).** The authority doc is the deterministic contract the core hygiene compiler (SPEC027RECHYGASS-004) renders. Drift between template, schema, and contract is a continuity bug (FOUNDATIONS §8), so this doc and 004 must land in the **same revision**; the doc must not precede its implementation (it would register an authority for unimplemented behavior).

## Problem

The record-hygiene rules (source contract, hygiene-active predicate, relation/action taxonomies, per-type and cross-type overlap criteria, prompt section order, serialization, output contract, UI quarantine) currently live only in the source proposal and the spec, both of which archive after completion. They need a durable domain-authority document, and a new `docs/` file must be registered in `docs/ACTIVE-DOCS.md` in the same change (per the root `CLAUDE.md` registry rule).

## Assumption Reassessment (2026-06-21)

1. **ACTIVE-DOCS insertion points (codebase).** `docs/ACTIVE-DOCS.md` carries the registry table (the ideation-template row is the anchor to insert after), the "Prompt, compiler, validation, and schema authorities" bullet list, the "Use these when changing…" sentence (`:64`), and the version note (`:158`: "template is `1.1.0`, compiler is `1.3.0`, and compiler contract is `1.4.0`"). All verified by direct read this session.
2. **Spec/doc authority.** `specs/SPEC-027-record-hygiene-assistance-prompt.md` Deliverable 1 + source proposal §11.1 (authority-doc contents) and §11.2 (exact ACTIVE-DOCS edits). The root `CLAUDE.md` and `docs/ACTIVE-DOCS.md` themselves require a new `docs/*.md` to be registered in the same change.
3. **Cross-artifact boundary under audit.** This doc is the normative source the core compiler (SPEC027RECHYGASS-004) renders section-for-section; the §8 same-change rule binds them. The doc must reproduce proposal §§3–6 + §7.3 as normative text (not summary), and must **not** copy the stale "as the general list route currently does" rationale — the verified mechanism is that `listRecords` returns malformed rows as `{ ok:false, kind:"malformed-record" }` and the builder fails on them (see SPEC027RECHYGASS-005).
4. **FOUNDATIONS principle motivating this ticket.** §9.1 (amended) `project-review` source profile + §8 (one explicit source contract per prompt class, documented in the domain authority). The authority doc is where that profile's archive/per-type-status predicate and deterministic order are recorded for downstream readers.
5. **Determinism / secret-firewall doctrine carried by the doc (§8/§15).** The doc states the deterministic whole-project source rule (no filter/threshold/ranking/eviction), the data-not-instruction canonical-JSON serialization (escape `<`,`>`,`&`), and the pre-send secret-disclosure boundary. It records doctrine; it weakens nothing — the enforcement lives in 004 (compiler) and 005/006 (server). Confirm the doc's send-disclosure text matches the §22/§23 audit boundaries.

## Architecture Check

1. **A durable authority doc beats leaving rules in an archiving proposal.** Specs and reports move to `archive/` after completion; the hygiene rules must remain the live, registered domain authority (mirroring `docs/ideation-prompt-template.md`). Registering it in ACTIVE-DOCS keeps the authority map complete and prevents a future agent from treating archived material as current.
2. **No backwards-compatibility aliasing/shims.** New doc + additive registry rows; no duplicated hygiene contract is copied into `docs/prompt-template.md` (a cross-reference only, owned by 008).

## Verification Layers

1. New doc registered → codebase grep-proof: `docs/ACTIVE-DOCS.md` contains the `story-record-hygiene-prompt-template.md` registry row and the authorities-bullet entry.
2. Doc carries the normative contract (predicate, relation/action taxonomies, per-type + cross-type criteria, section order, serialization, output format, UI quarantine) → manual review against proposal §§3–6 + §7.3; no rule weakened or silently omitted.
3. Version note bumped → grep-proof: `docs/ACTIVE-DOCS.md:158`-area note reads template `1.2.0` / compiler `1.4.0` / contract `1.5.0` (consistent with the `version.ts` bump co-landing in 004).

## What to Change

### 1. `docs/story-record-hygiene-prompt-template.md` (new)

Author the authority doc with the opening from proposal §11.1 (status/authority preamble naming it the `project-review` source profile) followed, as **normative** text, by: the in-scope/excluded source rules (§§3.1–3.2), the hygiene-active predicate (§3.3), the deterministic order (§3.4), the relation/action/hard-distinction-guard rules (§4), the full per-type and cross-type criteria (§5), the request/section-order/citation/serialization/procedure/output contract (§6), and the UI quarantine rules (§7.3). Cite the verified malformed-row mechanism, not the stale rationale.

### 2. `docs/ACTIVE-DOCS.md` (modify)

Add the registry row immediately after the ideation-template row; add `docs/story-record-hygiene-prompt-template.md` to the "Prompt, compiler, validation, and schema authorities" bullets; update the "Use these when changing…" sentence to include assistance source profiles and the hygiene prompt; update the version note to template `1.2.0` / compiler `1.4.0` / compiler contract `1.5.0` (per proposal §11.2).

## Files to Touch

- `docs/story-record-hygiene-prompt-template.md` (new)
- `docs/ACTIVE-DOCS.md` (modify)

## Out of Scope

- `docs/compiler-contract.md` and `docs/story-record-schema.md` edits — §8-co-located with the compiler in SPEC027RECHYGASS-004.
- `docs/ideation-prompt-template.md` opening reword and all other doc syncs — SPEC027RECHYGASS-008.
- The compiler implementation itself — SPEC027RECHYGASS-004.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "story-record-hygiene-prompt-template" docs/ACTIVE-DOCS.md` returns the new registry row and the authorities-bullet entry.
2. `grep -nE "1\.2\.0|1\.4\.0|1\.5\.0" docs/ACTIVE-DOCS.md` shows the version note updated to the new template/compiler/contract pins.
3. `test -f docs/story-record-hygiene-prompt-template.md` and the doc contains the section set from proposal §§3–6 + §7.3 (manual review confirms no rule weakened/omitted).

### Invariants

1. Every active `docs/*.md` is registered in `docs/ACTIVE-DOCS.md` (the new authority doc included) — the registry stays complete.
2. The authority doc carries no stored-schema-field claim and no validation-diagnostic code; it documents an assistance source profile only.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is grep-based plus manual review against the proposal's normative sections, and the compiler conformance is exercised by SPEC027RECHYGASS-004's golden and the capstone (009).`

### Commands

1. `grep -nE "story-record-hygiene-prompt-template|project-review" docs/ACTIVE-DOCS.md docs/story-record-hygiene-prompt-template.md` — registry + authority-doc presence.
2. `grep -nE "1\.2\.0|1\.4\.0|1\.5\.0" docs/ACTIVE-DOCS.md` — version-note bump.
3. A doc-level grep set is the correct verification boundary because the doc is the compiler's *contract*; conformance of the rendered prompt to this contract is proven by the golden test in SPEC027RECHYGASS-004 (same revision), not by a test in this docs ticket.

## Outcome

Completed: 2026-06-21

What changed:
- Added `docs/story-record-hygiene-prompt-template.md` as the active project-review record-hygiene prompt authority.
- Registered the new authority doc in `docs/ACTIVE-DOCS.md`, added it to the prompt/compiler/schema authority list, updated the source-profile guidance sentence, and bumped the version note to template `1.2.0`, compiler `1.4.0`, and contract `1.5.0`.
- Coupled this authority-doc registration in the same revision as SPEC027RECHYGASS-004 so the registered contract and compiler implementation land together.

Deviations:
- The authority doc carries the proposal's normative source predicate, taxonomies, section order, serialization, output contract, and quarantine rules in compact active-doc form rather than copying the entire source proposal verbatim.
- The stale malformed-row rationale was not copied; the doc states the verified `listRecords` `{ ok:false, kind:"malformed-record" }` mechanism.

Verification:
- `grep -nE "story-record-hygiene-prompt-template|project-review" docs/ACTIVE-DOCS.md docs/story-record-hygiene-prompt-template.md` passed.
- `grep -nE "1\\.2\\.0|1\\.4\\.0|1\\.5\\.0" docs/ACTIVE-DOCS.md docs/compiler-contract.md packages/core/src/version.ts` passed.
- Active `docs/*.md` registry completeness loop produced no missing docs.
- `npm test -- record-hygiene-golden` passed: 1 file, 5 tests.
- `npm run build` passed.
- `npm run typecheck` passed.
- `npm test` passed: 137 files, 1032 tests.
- `npm run lint --workspace @loom/core` passed.
- Path-scoped `npx eslint` over touched code/tests passed.
- `npm run lint` did not pass because the pre-existing untracked `.codex/worktrees/spec026-mutdrirob` checkout is inside the repo and ESLint traversed its generated `dist` files. This was unrelated to SPEC027RECHYGASS-003/004 and was left untouched.
