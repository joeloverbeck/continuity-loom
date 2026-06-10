# SPEC-018 — Foundational Docs Consolidation and Hardening

**Status:** DRAFT
**Feature name:** Foundational Docs Consolidation & Hardening
**Classification:** product-behavior (a docs-hardening spec that armors FOUNDATIONS-governed surfaces — authority registry, validation taxonomy documentation, constitutional amendments. No runtime behavior, schema, validation, storage, or compiler changes.)
**Governing authority:** `docs/FOUNDATIONS.md`
**Supporting authorities:** `docs/ACTIVE-DOCS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`, `docs/archival-workflow.md`

> Section style note: this spec uses the canonical `specs/` section set parsed by `reassess-spec` and `spec-to-tickets` (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions).

---

## Brainstorm Context

**Original request.** Post-v1 consolidation of `docs/**`: for each doc decide remove / merge / correct / create-new, decide whether a numbered folder structure is warranted, and encode all genuine deterministically-checkable narrative-theory blockers — backed by deep external research (narrative theory, similar projects, docs practices). Result: this spec.

**Scope decisions (user-confirmed 2026-06-10).**
1. **Structure:** flat `docs/` + hardened authority registry. Numbered tier folders (`0-X/`, `1-X/`) rejected: at ~11 docs they break every cross-reference and agent path memory, force renumber-or-misfile on insertion, and duplicate what a registry expresses better (conditional dependencies: "touching the compiler? read Y").
2. **New docs:** create both the validation rule inventory and the narrative-theory blocker roadmap.
3. **FOUNDATIONS:** targeted strengthening (amendment procedure, precedence ladder, named differentiation/anti-patterns, overflow stance) — wording sign-off-gated in this spec. No doctrine changes.
4. **demo-blocker-recipes.md:** keep active with a provenance correction; do not archive.

**Audit verdicts.** No doc warrants removal; no merge pays for itself (merging `stress-coverage-matrix.md` into `stress-suite.md` was considered and rejected — backfill plus a same-change maintenance rule is cheaper and keeps the audit table scannable). `prompt-template.md`, `prompt-template-rationale.md`, `user-guide.md`, and `archival-workflow.md` verified accurate; they receive only the cross-cutting header standardization.

**Premise verification (all verified directly against the working tree, 2026-06-10):**
- `packages/core/src/version.ts:25-37` — `templates: 1.0.0`, `compiler: 1.2.0`, `contract: 1.2.0`.
- `docs/ACTIVE-DOCS.md:136` — falsely claims template, compiler, and contract versions "are `1.0.0`".
- `docs/ACTIVE-DOCS.md:85,95` — snapshot claims ("There are currently no active implementation tickets/specs") that falsify whenever work opens; this spec's own existence falsifies line 95.
- `docs/stress-coverage-matrix.md` — rows exist for Cases 1–26 and 32 only; Cases 27–31 missing; drift acknowledged at `docs/stress-coverage-matrix.md:38`.
- `docs/stress-suite.md:16-37` — the embedded risk-surface coverage matrix references only Cases 1–26 (neither 27–31 nor 32).
- `docs/story-record-schema.md:125-129` — storage note cites `SPEC004RECCRUBAS-002` with no indication it is archived/completed (`archive/tickets/`).
- `docs/demo-blocker-recipes.md:3-4` — `Status: active` with `Scope: SPEC-013 demo validation smoke recipes`; SPEC-013 is archived at `archive/specs/SPEC-013-tame-demo-project-and-stress-coverage.md`.
- `docs/compiler-contract.md:1-5` — has a Status line but no contract-version pin.
- `packages/core/src/validation/types.ts` — `DIAGNOSTIC_CODES` contains **55** diagnostic codes (count verified by direct read; an earlier sub-agent figure of 41 was wrong).

**Prior-decision coordination (from `triage/2026-06-09-*` and archives):**
- The hard-canon-omission FOUNDATIONS amendment (HARDCANONOMIT-001) is already applied (`docs/FOUNDATIONS.md:274`, `:910`); nothing here re-litigates it.
- `EVENT.sequence_order` prompt-wiring was explicitly **deferred** to a future spec (open-thread-fields triage, O5). The blocker-roadmap doc (D8) must list it as a known deferred item, not re-propose it.

**Research provenance.** Narrative-theory pass: Trabasso & van den Broek causal networks; Genette focalization/paralepsis; Barthes' hermeneutic code; Swain/Bickham scene–sequel; script-supervisor continuity practice; Re3/DOC/Dramatron/KG-guided generation. Similar-tools pass: novelcrafter, Sudowrite, RaptorWrite, Plottr/Campfire/World Anvil, SillyTavern World Info, NovelAI lorebook, AI Dungeon memory, waterverri/continuum. Headline finding: **no surveyed tool deterministically validates and blocks before generation** — Continuity Loom's fail-closed gate is a deliberate inversion of the field's norm, and the active docs do not currently say so. Docs-practice pass: Diátaxis, Nygard ADRs, arc42, GitHub spec-kit, AGENTS.md progressive-disclosure guidance — unanimous against numbered folders at this scale, in favor of a registry with per-doc status and an explicit precedence ladder. Source URLs are carried into D8 and the D9 amendment rationale.

---

## Problem Statement

Version 1 is complete and running in production use. The 11 active docs are doctrinally consistent but carry verified drift (a false version claim, two stale coverage matrices, rot-prone snapshot claims, uncontextualized archived references), the implemented validation taxonomy (55 diagnostic codes) exists only in code with no documented inventory, the project's central differentiation and the anti-patterns it rejects are undocumented, FOUNDATIONS has no amendment procedure or precedence ladder despite both being load-bearing in practice, and the theory-grounded candidates for future deterministic blockers identified by research are recorded nowhere. Before building on v1, the foundational docs must be made accurate, drift-resistant, and complete as authorities.

## Approach

Keep `docs/` flat. Make `docs/ACTIVE-DOCS.md` the single authority **registry** (per-doc scope, genre, authority tier) and remove every rot-prone snapshot claim from it. Apply the six verified corrections in place. Extend the existing FOUNDATIONS §8 same-change drift doctrine to the stress matrices and the new rule inventory, so each authority doc states the rule that keeps it synchronized. Create two new docs: a validation rule inventory (the auditable form of the implemented blocker taxonomy, backed by a unit test so drift fails CI) and a non-binding narrative-theory blocker roadmap (capturing research without smuggling in feature work). Amend FOUNDATIONS with the four targeted strengthenings, exact wording below, gated on explicit sign-off. Sync all cross-references (`CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/archival-workflow.md`) in the same change.

## Deliverables

### D1 — Harden `docs/ACTIVE-DOCS.md` into the authority registry
- Fix the version claim (line 136): template `1.0.0`, compiler `1.2.0`, contract `1.2.0`, citing `packages/core/src/version.ts` as the source of truth.
- Remove snapshot claims (lines 85, 95 and similar): replace "There are currently no active tickets/specs" with directions to check `tickets/` and `specs/` directly.
- Add a registry table covering every `docs/*.md`: one row per doc with scope (one line), genre (`reference` / `explanation` / `how-to` / `audit`), and authority tier (`constitutional` / `domain authority` / `support`).
- State the precedence ladder (mirroring the constitutional wording added in D9): `FOUNDATIONS.md` → the domain authority named in the registry for the touched surface → support docs and guides.
- Add the registry-completeness rule: a new file under `docs/` must be added to the registry in the same change.

### D2 — Standardize per-doc status headers
Every active `docs/*.md` gets a uniform two-line header (replacing/normalizing the existing ad-hoc `Status:`/`Scope:` lines):
```
Status: active <genre> — <one-line scope>
Authority: <constitutional | domain authority for <surface> | support> (see docs/ACTIVE-DOCS.md)
```
No `last-reviewed` dates (they rot). Content edits beyond the header are governed by the other deliverables.

### D3 — Pin the contract version in `docs/compiler-contract.md`
Add to the header: the documented contract version (`1.2.0`) with a same-change rule — any change that bumps `contract.version` or `compiler.version` in `packages/core/src/version.ts` must update this pin in the same revision (this restates FOUNDATIONS §8 drift doctrine at the point of use).

### D4 — Contextualize archived references in `docs/story-record-schema.md`
- Lines 125–129: mark the `SPEC004RECCRUBAS-002` storage note as historical provenance ("implemented as designed; ticket archived at `archive/tickets/SPEC004RECCRUBAS-002.md`") rather than an open design option.
- Refresh the status line per D2 (the current "corrected baseline requirements schema" reads as pre-implementation language).

### D5 — Backfill both stress coverage matrices
- `docs/stress-coverage-matrix.md`: add rows for Cases 27–31 (mapping each to the validation rules / compiler behaviors that cover it, same shape as existing rows); remove the line-38 drift disclaimer.
- `docs/stress-suite.md` embedded risk-surface matrix (lines 16–37): extend rows to reference Cases 27–32 where they map.
- Add to both files the same-change maintenance rule: a new stress case must land with its matrix row(s) in the same revision.

### D6 — Correct `docs/demo-blocker-recipes.md` provenance
Keep `Status: active`. Reword the scope line so SPEC-013 reads as archived provenance, not current scope: the recipes remain live smoke checks against the existing demo fixture ("The Letter Under the Flour Bin"); their originating spec is archived at `archive/specs/SPEC-013-tame-demo-project-and-stress-coverage.md`.

### D7 — Create `docs/validation-rule-inventory.md` (+ drift test)
- One row per diagnostic code in `DIAGNOSTIC_CODES` (`packages/core/src/validation/types.ts`) — all 55 — with: rule ID, severity (blocker/warning, derived from the implementing rule module), one-line description, the FOUNDATIONS §11 taxonomy clause it enforces, and the stress-suite case(s) it covers (or `—` where none).
- Group by the implementing module families (universal completeness, universal blockers, voice/knowledge/physical/durable matrix, security, warnings).
- Same-change rule stated in the doc: adding, removing, or re-severitying a diagnostic code updates this inventory in the same revision.
- **Drift test:** add a Vitest test in `@loom/core` asserting that the set of rule IDs in the inventory doc equals the values of `DIAGNOSTIC_CODES` exactly (parse the doc's rule-ID column; fail on any asymmetric difference). This is regression armor, not product behavior.

### D8 — Create `docs/narrative-theory-blocker-roadmap.md` (non-binding)
- Status header marks it explicitly **non-binding**: a research-grounded candidate list, not a backlog, not validation authority.
- Candidate entries from the research pass, each with: name; theory citation; deterministic-checkability (yes / partially / no — semantic prose checks are out of scope by §11); blocker- vs warning-grade; schema fields it would require; and a §12 / §29.1 screening note (does the candidate risk plot-rail machinery, and why or why not). Candidates: causal-antecedent-missing for a planned beat; unmotivated-action / intentionality gap; dead-end pressure; scene-goal absence; sequel/outcome linkage; plant/payoff linkage (both directions of Chekhov's gun); thread starvation; pressure staleness; clock-deadline expiry against story time; flagged anachrony with fabula-time-aware continuity checks; knowledge provenance.
- Known-deferred section: `EVENT.sequence_order` prompt-wiring (deferred by the 2026-06-09 open-thread-fields triage) listed as deferred, not re-proposed.
- Closing rule: promoting any candidate requires its own spec clearing FOUNDATIONS §29; nothing in this doc authorizes implementation.
- Carries the research source list (Trabasso & van den Broek 1985; Genette/Niederhoff; Riedl & Young 2010; Ware & Young CPOCL; Re3/DOC; Dramatron; KG-guided storytelling 2025; Swain/Bickham; script-supervisor practice; Barthes S/Z).

### D9 — FOUNDATIONS amendments (SIGN-OFF GATED)
> **Gate:** the exact wording below requires explicit user sign-off before any ticket implements it. Per the amendment-procedure being introduced, the sign-off decision should be recorded on the implementing ticket. These are doc-only amendments with no coupled code change.

**D9a — Add §1.1 Amendment procedure and precedence** (new subsection under §1):

> ### 1.1 Amendment procedure and precedence
>
> A change to this document is constitutional work. An amendment must:
>
> 1. be proposed as an explicitly labeled FOUNDATIONS amendment in a spec or ticket, with the exact wording shown;
> 2. receive explicit user sign-off on that wording before implementation;
> 3. if coupled to a code or behavior change that depends on it, land in the same revision as that change — never standalone ahead of it;
> 4. update the §29 alignment checklist in the same amendment when it changes what proposals must clear.
>
> On conflict between active documents, precedence is: this document first, then the domain authority that `docs/ACTIVE-DOCS.md` names for the touched surface, then support docs and guides. `docs/ACTIVE-DOCS.md` is the registry of which document is the domain authority for each surface.

**D9b — Add §28.8 Validate-and-block before generation is the differentiator** (new research-grounded conclusion):

> ### 28.8 Validate-and-block before generation is the differentiator
>
> Surveyed story-AI tools maintain story state, but none deterministically validate and block generation on inconsistent state; the field handles consistency probabilistically after generation, or not at all. Continuity Loom's fail-closed pre-generation gate is a deliberate inversion of the field's norm, not an implementation detail.
>
> The industry's recurring failure modes are rejected by name:
>
> - **state laundering** — AI-generated bible entries, automatic prose-derived summaries, or AI-updated profiles quietly becoming canon;
> - **keyword-triggered context activation** — record inclusion decided by string matching against recent text instead of explicit user selection;
> - **token-budget eviction** — silently trimming or dropping selected context to fit a budget;
> - **probabilistic inclusion** — records entering the prompt by chance.
>
> Compiled prompt size never causes silent eviction. Oversize and salience risks are warning surfaces; the user, not the compiler, decides what leaves the active working set.

### D10 — Cross-reference sync
- `CLAUDE.md` and `AGENTS.md` governing-docs tables: add the two new docs (D7 to the validation/stress row; D8 as non-binding research reference).
- `README.md`: add pointers if it lists active docs.
- `docs/archival-workflow.md` do-not-archive list: add `docs/validation-rule-inventory.md`; D8 may be archived if ever superseded (note this asymmetry).
- `docs/ACTIVE-DOCS.md` registry (D1) includes both new docs.

## FOUNDATIONS Alignment

| Principle / clause | Stance | Rationale |
|---|---|---|
| §1 (constitution, deliberate amendment) | aligns | D9 is a deliberate, sign-off-gated amendment introducing the very procedure §1 implies; no doctrine changes. |
| §8 (drift between template/schema/rationale/contract is a continuity bug) | aligns | D3, D5, D7 extend the same-change discipline to the contract-version pin, both stress matrices, and the rule inventory; the D7 drift test makes one instance CI-enforced. |
| §11 (deterministic, blocking validation; taxonomy of legitimate blockers) | aligns | D7 documents the implemented taxonomy without adding, removing, or re-grading any rule; D8 is explicitly non-binding and adds no validation behavior. |
| §12 / §29.1 (no plot-rail machinery) | aligns | D8 candidates that brush structure (scene goal, plant/payoff) each carry a mandatory §12 screening note; the doc authorizes nothing — promotion requires a new spec clearing §29. |
| §28 (research-grounded conclusions) | aligns | D9b adds a conclusion in the established §28 form, grounded in the similar-tools survey. |
| §29 hard-fail checklist | aligns | Docs-and-test-only change; no runtime, schema, storage, compiler, prompt, or validation behavior changes; the D7 test is regression armor for existing behavior. |

## Verification

1. `npm run lint`, `npm run typecheck`, `npm test` pass (the D7 drift test is the only code addition; everything else is docs).
2. Registry completeness: every file in `docs/*.md` appears in the D1 registry table (grep-proof: filename list vs table rows).
3. Version accuracy: the versions stated in `docs/ACTIVE-DOCS.md` and `docs/compiler-contract.md` match `packages/core/src/version.ts`.
4. Matrix completeness: every `## Case N` heading in `docs/stress-suite.md` has a corresponding row in `docs/stress-coverage-matrix.md` (grep-proof); the drift disclaimer is gone.
5. Inventory completeness: the D7 test passes — inventory rule IDs ≡ `DIAGNOSTIC_CODES` values (55/55).
6. No rot-prone snapshot claims remain in `docs/ACTIVE-DOCS.md` (grep for "currently no active").
7. Cross-references resolve: every `docs/`-internal path mentioned in active docs, `CLAUDE.md`, `AGENTS.md`, and `README.md` exists on disk.
8. D9 wording in `docs/FOUNDATIONS.md` matches the signed-off wording in this spec exactly.

## Out of Scope

- Implementing any new validation rule, warning, schema field, or record type (including every D8 candidate).
- Wiring `EVENT.sequence_order` into compilation (explicitly deferred by prior triage).
- Numbered folder restructuring or any file moves/renames under `docs/`.
- Merging any existing docs; archiving `docs/demo-blocker-recipes.md`.
- Creating an ADR log or restamping `archive/specs/` with ADR statuses.
- Any change to runtime behavior, prompt compilation, the universal template, stored data, or UI.
- Rewriting doctrinal restatements across docs into references (the precedence ladder makes divergence resolvable; trimming restatements is deliberate future doc work if divergence is ever observed).

## Risks & Open Questions

- **Inventory drift** (D7) is the main ongoing risk; mitigated by the same-change rule plus the CI drift test. The test parses a markdown table — keep the rule-ID column format stable (backticked code IDs, one per row).
- **Severity derivation** (D7): severity is per implementing module (warnings live in `warnings.ts`); if any rule's severity is ambiguous at implementation time, resolve from the rule module, not from stress-suite prose.
- **D9 sign-off** is a hard gate: if the user revises wording, this spec must be updated to match before the amendment ticket proceeds (§1.1 item 4 discipline applies to itself).
- **Case 27–31 mapping** (D5): the backfill must map cases to *implemented* rules; if a case turns out to have no covering rule, record the gap honestly in the matrix (coverage note "no deterministic rule; warning-grade gap") rather than inventing coverage — and surface it as a candidate for D8.
- Open question: should the D2 header standardization eventually be lint-enforced? Out of scope here; revisit if headers drift.
