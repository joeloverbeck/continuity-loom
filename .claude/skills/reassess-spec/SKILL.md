---
name: reassess-spec
description: "Use when preparing a Continuity Loom spec for ticket decomposition. Reassesses a spec at specs/SPEC-NNN-<slug>.md against the codebase (docs/, .claude/skills/, existing specs) and docs/FOUNDATIONS.md; identifies issues/improvements/additions, presents findings for approval, then writes the updated spec. Produces: findings report + updated spec file. Mutates: the target spec file on user approval."
user-invocable: true
arguments:
  - name: spec_path
    description: "Path to the spec file (e.g., specs/SPEC-001-prompt-compiler.md)"
    required: true
---

# Reassess Spec

Reassess a Continuity Loom spec against the codebase and `docs/FOUNDATIONS.md`. Validates assumptions, identifies issues / improvements / additions, presents findings for approval, then writes the updated spec.

<HARD-GATE>
Do NOT Write or Edit the spec file until:
(a) Step 6 findings have been presented and the user has responded — either explicit per-finding disposition (fix / defer / reject), OR no explicit objection to a finding (silence on a finding while answering Questions counts as approval; an explicit objection re-opens that finding and requires re-presenting the corrected recommendation first);
(b) Step 7's pre-apply verification table has been emitted in chat, one check + result row per finding, with any detected mismatch reclassified and — for recommendation-changing mismatches — re-presented for fresh approval;
(c) any open Questions from Step 6 have been answered.

This gate holds under auto mode and any autonomous-execution context. Auto-mode carve-out: when Step 6 findings contain no Issues (CRITICAL/HIGH or FOUNDATIONS hard-fails) and no open Questions, Step 7 may proceed without fresh approval, but the pre-apply verification table MUST still be emitted before any Write/Edit.
</HARD-GATE>

## Invocation

```
/reassess-spec <spec-path> [inline user hint]
```

**Argument** (required): `<spec-path>` — path to the spec file. If missing, ask for it before proceeding.

**Glob resolution**: if the argument contains wildcards, resolve via `ls`/`find`; proceed if exactly one match (note the resolution inline), disambiguate if many, stop with an error if none.

**Inline user hint (optional)**: text accompanying the path — a parenthetical, post-dash note, or follow-on message (e.g. `specs/SPEC-004-validator.md (Note: I'm worried some validators are too brittle)`) — is an audit-lens constraint. It shapes severity assignment at Step 5 and may reframe Questions at Step 6; it is NOT a second path argument and does NOT override FOUNDATIONS alignment or approved recommendations. When a hint materially shaped a finding's classification, cite it in the Step 6 presentation. A hint that would force a FOUNDATIONS hard-fail is flagged as a CRITICAL Issue, not applied. A hint that instead names a document or path ("rely on / per / see X") is a **reference pointer**, not a severity lens: promote the named doc into the Step 1–2 mandatory reads and treat it as a Step 3 cross-validation authority (e.g. the canonical source for deliverable names) — see §3.7 Bidirectional symbol-name consistency.

## Process Flow

```
Pre-Process: classify the spec (a / b / c / d) + hybrid detection
       |
       v
Step 1: mandatory reads (spec file + docs/FOUNDATIONS.md)
       |
       v
Step 2: extract references (file paths, types, schema fields, functions, deps, source docs)
       |
       v
Step 3: codebase validation (load references/codebase-validation.md)
       |
       v
Step 4: FOUNDATIONS alignment + §29 hard-fail check (load references/foundations-alignment.md)
       |
       v
Steps 5-6: classify findings + present to user (load references/findings-and-questions.md)
       |
       v   [user approval gate — HARD-GATE fires here]
       v
Step 7: pre-apply verification table -> write updated spec (load references/spec-writing-rules.md)
       |
       v
Step 8: final summary + suggested next step
```

## Reference Files

Five reference files, each loaded with the Read tool before its step:

- **Step 3** — `references/codebase-validation.md`
- **Step 4** — `references/foundations-alignment.md`
- **Steps 5-6** — `references/findings-and-questions.md`
- **Step 7** — `references/spec-writing-rules.md`
- **Plan mode** — `references/plan-mode.md`, loaded at entry when plan mode is active.

Load each before the corresponding work begins. Loading all of them in one parallel batch right after Step 1 is the simplest path; on-demand loading per step is also fine. Steps 1, 2, and 8 need no reference file.

## Inputs / Output

**Input**: `spec_path` (required). Plan-mode and worktree-root resolution are auto-detected.

**Output**:
- **Findings report** — presented in chat at Step 6 (Issues / Improvements / Additions, severity-ranked; open Questions; optional Substantial Redesign Flag).
- **Pre-apply verification table** — emitted in chat at Step 7 before any Write/Edit.
- **Updated spec at `<spec_path>`** — edited in place on approval. For classification (d): Status flipped to COMPLETED, Outcome section populated.
- **Post-apply confirmation** — emitted at Step 8 (grep-proofs that eliminated references are gone and corrected ones resolve).

## Prerequisites

Before acting, this skill MUST read:

- `<spec_path>` — the target spec, entire contents.
- `docs/FOUNDATIONS.md` — the constitution. Skip only if read earlier this session and unmodified.
- Every file path, skill directory, and sibling-spec reference extracted at Step 2 — read as part of Step 3.

Reading scope: anything under `specs/`, `.claude/skills/`, `docs/`, `reports/`. This skill does not author story-record data — it reasons about specs that describe app behavior.

## Worktree & Plan-Mode Awareness

If working inside a git worktree, ALL paths (reads, writes, globs, greps) resolve from the worktree root. If plan mode is active, load `references/plan-mode.md` at entry.

## Pre-Process: Spec Classification

Classify the spec into exactly one of four classes. Classification drives which Step 3 substeps apply (see the substep table in `references/codebase-validation.md`).

- **(a) New component** — introduces a new module/surface, a new skill (new `.claude/skills/<name>/`), a new validator, or a new doc-governed contract. Full Step 3 checklist applies.
- **(b) Extension** — extends an existing module, skill, validator, or contract without introducing a new one. Most substeps apply; skill-structure (3.5) applies only when a SKILL.md changes structurally; FOUNDATIONS-contract fidelity (3.8) applies only when the deliverable touches validation / compilation / record-authority / POV-secrets semantics. **Removal/teardown specs** (deliverable is *deleting* a field, validator, command, or symbol) classify as (b) with 3.6 downstream-consumer analysis load-bearing — an un-removed consumer is a correctness break, not mere drift.
- **(c) Refactor** — structural restructuring with no behavioral change. Substeps 3.0–3.4 apply; skip consumer/fidelity/completeness substeps unless boundaries or SKILL.md content move. Focus on symbol existence, count accuracy, blast radius.
- **(d) Retroactive** — validation concludes (via Step 3 evidence) that all deliverables already landed. **Not pre-selected** — activates only when every deliverable verifies as implemented. A user hint ("I think this already shipped") is a soft signal; only Step 3 evidence confirms (d). Step 7 switches to Outcome population + Status flip (see the retroactive branch in `references/spec-writing-rules.md`).

**Per-deliverable already-landed**: when one deliverable shipped while others remain pending, the spec stays (a)/(b)/(c) — reframe just that deliverable as historical, cite the delivering commit/spec, and route residual sub-tasks to a deferred note. Do not flip the whole spec to (d).

**Removal target that never existed**: when a spec tasks removing a symbol that returns zero matches AND was never created, there is nothing to delete — classify as a stale-premise Issue (HIGH when restated across multiple sections), drop the removal framing, and where the symbol name still appears in Verification, keep it as a trivially-passing absence guard.

**Documentation / amendment specs**: a spec whose deliverables are edits to existing docs (a doc-amendment spec, often amending `docs/FOUNDATIONS.md` and synchronizing sibling docs) classifies as **(b)**. Treat each file's amendment plan as a deliverable (per Step 1's non-numbered-deliverables rule). Map the Step 3 substeps to doc surfaces: 3.1 → doc/section existence; 3.2 → section-heading, prompt-placeholder, and schema-field existence **plus** the spec's quoted *current text* matching the live doc verbatim (a stale quote is an Issue — see `references/codebase-validation.md` §3.2); 3.6/3.7 → sibling docs/specs carrying the same doctrine. When the spec amends FOUNDATIONS, also apply the constitutional-amendment carve-out in Guardrails — relaxing a rule is then the intended deliverable, not an auto-CRITICAL violation.

**Hybrid specs**: apply the union of applicable substeps, using the most rigorous classification's checklist for shared substeps.

**Re-reassessment shortcut**: if the same spec was reassessed earlier this session and not externally modified, Steps 2–3 may scope to only the references affected by the triggering change. Step 1 still applies.

## Step 1: Mandatory Reads

Read both before any analysis:

1. **The spec file** (entire).
2. **`docs/FOUNDATIONS.md`** — skip only if read earlier this session and unmodified.

Parse the spec's metadata (Status, `Depends on:` / `Predecessors:` / `Blocks:` / `Related:`) and its sections (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions, and any deliverable sections).

**Non-numbered deliverables**: if the spec uses sections or a numbered `§Scope` list instead of numbered deliverables, treat each distinct implementation section (or in-scope item) as a deliverable for validation purposes.

## Step 2: Extract References

Extract every concrete codebase reference from the spec:

- **File paths** — both existing (`docs/FOUNDATIONS.md`, `docs/compiler-contract.md`) and proposed.
- **Type / interface / schema field names** — story-record fields, generation-time-brief fields, prompt-section names, validation-rule codes.
- **Function / command / surface names**.
- **Skill / module names**.
- **Spec dependencies** — `Depends on:` / `Predecessors:` / `Blocks:` / `Related:` headers or prose.
- **Source documents** — when the spec cites an external source (a report under `reports/`, a brainstorm output under `docs/plans/`, a research report) in its Problem Statement / Motivating Evidence / Approach, extract the path AND enumerate its actionable claims at Step 2 itself (read the source; for oversized docs use targeted greps with permissive anchoring). Tag each claim's adjudication status (accept / reject / defer / unadjudicated) by scanning the spec's Approach / Deliverables / Out of Scope. This feeds Step 3.10.
- **Code examples** (TypeScript, JSON/YAML schema snippets, prompt-section blocks) — extract for fidelity checking.
- **Validation thresholds / config** — focus tags, severity mappings (warning vs blocker per FOUNDATIONS §11).

**Reference-count checkpoint**: before Step 3, emit a one-line note with the exact reference count and the tracking decision — e.g. `Reference count: 12 — mental tracking sufficient` or `Reference count: 23 — TaskCreate recommended`. Use an exact integer (not `~20` or `20+`); the >15 threshold-decision must be reproducible. **Exception for doc/amendment specs**: when references are doc-section anchors rather than discrete code symbols (so an exact tally is arbitrary), an estimate plus the tracking decision is acceptable — the reproducibility requirement then binds the >15 *decision*, not the precise count (e.g. `Reference count: ~60 doc-section anchors — clustered, mental tracking sufficient`). For specs with >15 references spanning unrelated areas, consider `TaskCreate` per-reference tracking; for tightly-clustered sets, mental tracking is acceptable. A fixed closed set checked by one presence grep counts as 1 reference, not N.

**Source-document engagement checkpoint** (when source documents are cited): emit a one-line note naming each source and its per-document adjudication counts — `Source-document engagement: <doc>: N claims enumerated, M adjudicated (accept / reject / defer), (N-M) unadjudicated flagged as findings.` When no source document is cited, emit `Source-document engagement: N/A — no external source cited`. When a cited source document cannot be resolved or read, emit `Source-document engagement: <doc> — CITED BUT MISSING` and raise a finding (see §3.10).

Prioritize references most likely to have drifted (import paths, signatures, types the spec extends, sibling-spec dependency paths). Stable references (FOUNDATIONS principle names, well-known schema fields) can be spot-checked.

## Step 3: Codebase Validation

**Load `references/codebase-validation.md` before classification-driven substep selection.** Then validate every Step 2 reference, applying the substep subset for the Pre-Process classification. Collect everything; do not present findings yet.

## Step 4: FOUNDATIONS Alignment Check

**Load `references/foundations-alignment.md` before alignment classification.** Then check the spec against applicable FOUNDATIONS principles — the §4 non-negotiable principles, §11 validation/hard-fails, the five continuity surfaces (§6), and the **§29 hard-fail checklist**. Any §29 question answered "yes" is a CRITICAL Issue — except for sanctioned FOUNDATIONS-amendment specs, where the §29 check is evaluated against the hard-fail's *intent* post-amendment (see the constitutional-amendment carve-out in `references/foundations-alignment.md` §4.4).

## Steps 5-6: Classify and Present Findings

**Load `references/findings-and-questions.md` before classifying.** Classify findings into Issues (CRITICAL / HIGH / MEDIUM / LOW), Improvements, Additions, and Questions; present using the template there.

**Redesign-count checkpoint**: count deliverables whose *approach* materially changed (eliminated, replaced with a different mechanism, or restructured beyond a refinement) over the pre-reassessment total. Emit the `N/total` ratio in the Step 6 Classification block. If it exceeds 50%, the Substantial Redesign Flag section is mandatory immediately above Questions.

**Wait for the user before Step 7.** In plan mode, write the plan file per `references/plan-mode.md`, then call ExitPlanMode. Auto-mode / no-stopping directives proceed directly to Step 7 ONLY when there are no Issues (CRITICAL/HIGH) and no open Questions; cite the directive inline.

## Step 7: Write the Updated Spec

**Load `references/spec-writing-rules.md` before writing.** Build the pre-apply verification table and emit it in chat before any Write/Edit. For each finding (keyed `I1`, `M1`, `A1`…), run a targeted check and record the command + result. Reclassify any mismatch (evidence-refining / recommendation-changing / scope-extending) per the reference; re-present recommendation-changing mismatches before applying. Then apply all approved changes, preserving structure and voice.

For classification **(d) retroactive**, Step 7 instead flips Status to COMPLETED and populates the Outcome section (see the retroactive branch in `references/spec-writing-rules.md`).

## Step 8: Final Summary

Present:

- Issues fixed, improvements applied, additions incorporated.
- Change inventory grouped by finding type.
- **Post-apply confirmation**: for every eliminated or renamed reference, grep-prove it is gone and corrected references resolve.
- Deferred items and reassessment-driven scope exclusions (with reasons).
- The 1–3 sections that changed most, flagged for review.
- **Classification shift note**, if the effective classification shifted (e.g. "(a) collapsed to (b) after deliverable removal"; "(b) shifted to (d) after Step 3 verified full landing"). Omit if unchanged.
- **Suggested next step**: "Review the updated spec, then decompose into tickets — by hand into `tickets/<PREFIX>-NNN.md`, or via `/brainstorm` (decompose-into-tickets path). reassess-spec prepares specs for decomposition but does not perform it." For (d): note the spec is now a historical record (Status COMPLETED).

Do NOT commit. Leave the file for user review.

## Guardrails

- **FOUNDATIONS is authoritative**: never approve a spec change that violates a FOUNDATIONS principle or trips a §29 hard-fail, even if requested — flag it as a CRITICAL Issue instead.
- **Constitutional-amendment specs are the exception**: when the spec's declared purpose is amending `docs/FOUNDATIONS.md` itself (FOUNDATIONS §1 permits deliberate amendment — "the feature is wrong unless this document is deliberately amended first"), relaxing or removing a rule is the intended deliverable and is NOT auto-CRITICAL. Audit the amendment instead for (1) internal coherence — every restated rule across the doc set moves together, with no orphaned bullet left contradicting the new doctrine; (2) preservation of each §29 hard-fail's *intent* — deterministic compilation with no LLM intermediary, no accepted prose in prompts, the secret firewall, warnings never gating, human gatekeeping; (3) cross-doc synchronization. Flag CRITICAL only when the amendment is internally incoherent or breaks a §29 hard-fail in spirit — not merely because it loosens a rule. See `references/foundations-alignment.md` §4.4 and `references/codebase-validation.md` §3.8.
- **Codebase truth**: every reference in the updated spec must be validated. Never propagate stale paths, renamed types, or removed functions through Step 7.
- **No scope creep**: the deliverable is the updated spec file. Do not write design docs, create tickets, start implementation, or edit sibling spec files — unless a Step 6 question response explicitly authorizes a named sibling-spec edit (record it in Step 8 under a "Cross-spec scope extension" line).
- **No greenfield approach proposals**: validate and refine the existing design, not alternatives — except when the approach violates a FOUNDATIONS principle or conflicts with an established contract (`docs/compiler-contract.md`, the universal prompt contract, the story-record schema), where a minimum-viable alternative is part of the Issue finding.
- **Substantial redesign flag**: if reassessment changes >50% of deliverables' approach, flag at Step 6.
- **Worktree discipline**: inside a worktree, all paths resolve from the worktree root.
- **Plan-mode discipline**: load `references/plan-mode.md`, write the plan file, call ExitPlanMode, then execute Steps 7–8 after approval.
- **Do not `git commit`**: writes land in the working tree; the user reviews and commits.

## FOUNDATIONS Alignment

| Principle | Step | Mechanism |
|-----------|------|-----------|
| §4 Non-negotiable principles | Step 1 (mandatory read), Step 4 | FOUNDATIONS.md is a required read; every finding is checked against the §4 principles and §29 hard-fail checklist. |
| §11 Validation and hard fails | Steps 3.8, 4 | Specs proposing validation rules must distinguish warnings from blockers and keep validation deterministic and blocking; deviations are flagged. |
| §4.4 / §8 Deterministic compilation | Step 4 (§4.3 determinism sub-check) | Specs claiming determinism or reproducibility are checked for nondeterministic inputs (wall-clock, unordered collections, LLM intermediaries in compilation). |
| §15 POV, knowledge, secrets | Step 3.8 | Specs touching POV/secret handling must preserve the secret firewall (no leakage the deterministic records forbid); violations are CRITICAL. |
| §20 Durable change & human gatekeeping | Steps 4, 7 (retroactive) | Specs that mutate records or canon must keep human review/acceptance authoritative; the spec's own retroactive Outcome section makes landed work explicit (no silent retcon). |
| §29 Alignment checklist | Step 4 | Any §29 hard-fail answered "yes" is a CRITICAL Issue blocking ticket decomposition — except sanctioned FOUNDATIONS-amendment specs, judged against the hard-fail's post-amendment intent (see Guardrails carve-out). |

## Final Rule

A reassessment is not complete until every reference in the updated spec is validated against the current codebase and `docs/FOUNDATIONS.md`, every approved finding has a pre-apply verification row proving the fix landed, and every eliminated or renamed reference has a post-apply grep-proof that it is gone.
