# Brief template & target-type reads

This file defines (A) the canonical anatomy of the emitted ChatGPT-Pro prompt and (B) the
research-target → load-bearing-reads map. The SKILL.md flow references both.

---

## A. Canonical brief anatomy

The emitted file `reports/<topic>-research-brief.md` is the *prompt the user pastes into
ChatGPT-Pro Session 2*. It is self-contained: Session 2 sees only this prompt plus the
uploaded manifest. Use these eight sections, in order. Scale each to the target; omit a
section only when genuinely N/A and say so.

### 1. Context

One or two sentences. Begin with the manifest pointer, then repo identity, then the **exact
fetch-baseline commit** Session 2 must read every file from (the verified repo HEAD per the
Step 6 baseline-commit rule — never a commit string copied from a report without confirming it
contains the §2 read-list):

> The uploaded manifest is the path inventory of the `joeloverbeck/continuity-loom` repo —
> a local-first story-state operating system: a Node process serves a React UI and a
> localhost-only API that tracks story records, compiles them into a deterministic
> prose-generation prompt, and handles segment acceptance. It is an npm-workspaces ESM
> monorepo (Node ≥ 24, strict TypeScript) with three packages: `@loom/core` (pure
> continuity/compiler logic, framework- and platform-free), `@loom/server`, `@loom/web`.
> Governing docs: `docs/FOUNDATIONS.md` is the constitution (its §29 is the alignment/hard-fail
> checklist); `docs/ACTIVE-DOCS.md` maps the active authority hierarchy. Fetch every file from
> commit `<HEAD>` — the manifest reflects that tree. (If a referenced report cites a different
> "commit of record," note the divergence here and use the verified HEAD, not the report's string.)

If this brief **continues a prior one** (a multi-block campaign, a follow-up to earlier
research, or an extension of an already-shipped spec), name the predecessor
(`reports/<...>-research-brief.md` and/or the implemented `archive/specs/SPEC-NNN-*.md` when the
feature already shipped) and state what it already delivered, so Session 2 treats this as a
*delta* — not a cold start — and does not re-commission completed work. **If the predecessor's deliverable was already implemented** (its recommendations
became merged code, not just completed research), the delta is a *baseline shift*, not just prior
findings: name the implementing commit/PR, declare the post-implementation baseline, list the
now-live changes so Session 2 does not re-recommend them as new, and state whether those
implemented changes are themselves reconsiderable in this pass.

**If a prior report shares vocabulary but is *not* a predecessor** — a superficially similar theme
at a different layer or scope (e.g. schema/field-authority dedup vs. record-instance dedup) — name
it and state explicitly what makes this target distinct, so Session 2 does not conflate them or
treat that report's work as completed scope to extend.

### 2. Read in full (authority order)

An explicit, tiered path list — every file Session 2 must read before producing — each
with a one-line reason it is load-bearing *for this target*. Built from Step 2 exploration.
Order strictly by Loom's authority hierarchy (`docs/ACTIVE-DOCS.md`). Example shape:

```
Read these in full, in this order:

docs/ACTIVE-DOCS.md — the authority map: which doc governs which surface, and the active-vs-archive boundary.
docs/FOUNDATIONS.md — the project constitution; §29 is the hard-fail checklist every deliverable must clear.
docs/compiler-contract.md — the deterministic prompt-compiler contract <if the target touches compilation>.
docs/prompt-template.md / docs/prompt-template-rationale.md — the universal prompt template + its rationale <if relevant>.
docs/story-record-schema.md — record + generation-time-brief shapes <if the target touches data>.
docs/stress-suite.md / docs/stress-coverage-matrix.md / docs/demo-blocker-recipes.md — validation/stress/demo behavior <if relevant>.
reports/<report> — <prior finding-set this target builds on>.
archive/specs/<spec> — <completed work that established the current state>.
```

**Boundary-awareness reads.** When the target mandates reading a whole doc cluster (the user says
"read all of the prompt/compiler authorities"), or when a scoped audit must read adjacent docs *only*
to know what is **out** of scope, mark those entries as *boundary-awareness (read to bound scope, not a
conformance target)* — distinct from *primary (load-bearing)* entries. This keeps §2 useful at high
file counts and stops Session 2 from auditing or "correcting" code the scope intentions exclude. Call
out the primary entries explicitly; list the rest grouped, with the boundary-awareness purpose stated once.

**Code seams are not read-in-full entries.** The seams identified in Step 2 (files/modules Session 2
should *inspect*, not read whole) belong in a clearly-labeled `Inspect, not read in full` subsection at
the end of §2 — never intermixed with the authority-ordered read-in-full list, and never pasted inline.
(They may instead ride in §5's exploration mandate; default to the §2 subsection so the emitted
structure is deterministic across briefs.)

### 3. Settled intentions

The decisions the interview resolved — the heart of why Session 2 is *locked*. State each
as a committed decision, not an option. This section pre-empts every clarifying question
Session 2 might otherwise ask. A committed decision may itself be a *delegation to Session 2* —
when the interview resolved that a research-suited axis (technique mix, thresholds, enforcement
model) is Session 2's to settle, state it as the locked decision **plus its bounding
constraints/anchor** (e.g. "the technique mix is Session 2's to recommend, with mutation testing
the named anchor"), so the delegation reads as a decision Session 2 executes, not a question it
reopens. Carry any early-exit gaps here as `assumption: <X>` lines so
they read as defaults the user can override, not as open questions.

### 4. The task

A precise statement of what Session 2 must achieve — the goal behind the deliverable. One
tight paragraph. Name the target type (new spec / thorny fix / hardening / overhaul).

### 5. Exploration + online-research mandate

Authorize depth explicitly:

> Explore the repository as deeply as needed beyond the files listed above. Research online
> as deeply as needed — similar implementations, research papers, prior art — wherever it
> sharpens the deliverable. Cite sources for any external claim that shapes a decision.

### 6. Doctrine & constraints

Pointers Session 2 must honor:

- `docs/FOUNDATIONS.md` is the constitution — every product-behavior decision must satisfy it,
  and must clear its §29 hard-fail checklist; a genuine divergence requires amending
  FOUNDATIONS first, never designing against it silently.
- Authority order per `docs/ACTIVE-DOCS.md`: if a proposal conflicts with a higher authority
  (constitution above domain docs above implementation convenience), the proposal is wrong, not
  the authority.
- No backwards-compatibility shims, aliases, or duplicate authority paths in new work unless a
  spec explicitly justifies them.
- Loom non-negotiable invariants (do not weaken any):
  - Records and user-authored generation-time fields are the continuity authority.
  - Accepted prose, rejected candidates, superseded candidates, and automatic prose-derived
    summaries are NOT prompt context.
  - The prompt compiler is deterministic and must not query hidden state outside the validation snapshot.
  - Validation fails closed: blockers gate prompt preview and send; warnings never become prompt instructions.
  - The active working set is explicit and user-controlled — no silent inclusion of "relevant" records.
  - No branches, plot rails, beat packages, act machinery, or autonomous plot planner.
  - The app never uses an LLM to mutate records automatically.
  - API keys are global local secrets; keys, full prompts, candidates, accepted prose, and full
    record payloads are not logged by default.
  - Project data stays local and user-owned; network traffic is limited to the prompt the user
    intentionally sends through OpenRouter, and every server binds `127.0.0.1` only.

Trim to the constraints the target actually engages.

### 7. Deliverable specification

Exactly what Session 2 outputs — leave no ambiguity:

- each **downloadable markdown document**, by filename and whether it **replaces** an
  existing file or is **new**;
- for replacements, name the file being replaced and what must be preserved vs. changed;
- when the deliverable is a **numbered spec**, derive its number and path from the repo's
  spec series: the next number is one past the **highest `SPEC-NNN` found across both
  `specs/` and `archive/specs/`** (active specs are routinely empty and archived, so a
  `specs/`-only scan would re-claim a number and collide with archived history). The path is
  `specs/SPEC-NNN-<slug>.md` with `Status: DRAFT`. Loom numbers specs as a single flat
  sequence — there is no ledger, no staging epochs, and no live-vs-archived renumbering to
  reconcile. Carry any residual slug/placement ambiguity as a labeled `assumption:` line
  rather than asserting it;
- when the deliverable is a **spec-precursor change-proposal document** — a standalone downloadable
  markdown the user hands to a coding agent to *become* a spec, not a spec itself (the canonical Loom
  pipeline: research-brief → ChatGPT-Pro change document → spec → tickets) — name it as a **hand-off
  artifact filename, not a repo path**, and instruct Session 2 **not** to assign a `SPEC-NNN` or author
  it in spec form. The next spec number may still be computed and named *as downstream context* (so the
  coding agent knows where it will land) without Session 2 claiming it. When the target's
  wording merely says "spec," it is ambiguous between a numbered `SPEC-NNN` and this precursor —
  default to the precursor and resolve the choice in the interview as a settled intention, never
  letting the bare word "spec" select a numbered-spec deliverable;
- the **locked / no-questions** instruction, verbatim intent:

> Produce the deliverables directly as downloadable markdown documents. Do not interview,
> do not ask clarifying questions — the requirements above are final. If a genuine
> contradiction makes a requirement impossible, state it in the deliverable and proceed
> with the most faithful interpretation.

**Determination-plus-conditional targets.** When the research target is "decide whether X is
needed, and *if so* produce X" (common for hardening / anti-contamination passes), the deliverable
is contingent on a judgment Session 2 must make first. Do not leave the contingency implicit. The
brief must (a) instruct Session 2 to produce a clearly labeled, evidence-based **determination /
verdict** ("is a new spec warranted, and why"), and (b) state — as a settled intention resolved in
the interview — which of **three** modes governs the artifact: (i) **unconditionally** (one always-produced
document with the verdict embedded as a section); (ii) **only if the verdict is positive** (nothing authored
on a negative verdict); or (iii) **always produce, form follows the verdict** — one document is always
produced, but its *shape* depends on the verdict (e.g. a full spec if warranted, a standalone rationale
report if clean). Prefer (i) "always produce, with the verdict as a section" when the artifact's value
survives a negative verdict (e.g. it locks already-correct properties); choose (iii) when a negative verdict
still warrants a substantial evidence-complete document but in a *different form* than the spec; reserve
(ii) "produce only if positive" for when a negative verdict means there is genuinely nothing to author.
Note that **trigger and scope are independent axes**: a mode-(ii) artifact is *authored only on a
positive verdict*, but when authored it may still need to record the evidence-backed verdicts for the
examined-but-unchanged surfaces, so the document is a complete audit rather than a bare changelist. For
mode (iii), the brief's deliverable spec (§7) must define **both** artifact shapes (a Branch A / Branch B
specification) so Session 2 commits to one without asking.

### 8. Self-check

A short acceptance checklist Session 2 runs against its own output before returning —
e.g. every replacement preserves the load-bearing content of the original; no new doctrine
weakens FOUNDATIONS or trips a §29 hard-fail; every external claim is cited; the deliverable
set matches §7 exactly; the §1 fetch-baseline commit contains every file named in the §2
read-in-full list. When the brief cites a specific `§N`/section anchor *into* a read-list doc,
that anchor was grep-confirmed at the baseline before writing — a path that resolves can still be
cited at the wrong section, and the locked brief gives Session 2 no way to challenge it.

---

## B. Target-type → load-bearing reads

A starting map for §2; always refine against Step 2 exploration. `docs/ACTIVE-DOCS.md`
and `docs/FOUNDATIONS.md` are load-bearing for every type.

| Target type | Load-bearing docs / files (beyond the two universal) |
|---|---|
| **new-spec** | the domain authority for the touched surface (e.g. `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/story-record-schema.md`); sibling specs in `specs/` + `archive/specs/`; the relevant code seams in `packages/core`/`server`/`web`; `tickets/README.md` + `tickets/_TEMPLATE.md` if decomposition follows. |
| **thorny-fix** | the domain authority doc for the affected surface; the relevant code seams; any `reports/**` or `archive/reports/**` audit touching the defect; `docs/stress-suite.md` if a validation/stress gate is in play. |
| **hardening / anti-contamination** | `docs/FOUNDATIONS.md` (esp. accepted-prose exclusion, deterministic compilation, fail-closed validation); `docs/compiler-contract.md` + `docs/prompt-template.md` for prompt-context boundaries; `docs/stress-suite.md` / `docs/stress-coverage-matrix.md` / `docs/demo-blocker-recipes.md` for regression coverage; prior hardening specs in `archive/specs/**` (e.g. SPEC-014). |
| **foundational / doc-overhaul** | the doc being overhauled plus `docs/FOUNDATIONS.md` and `docs/ACTIVE-DOCS.md` (authority flows downward from the constitution and the map); any `reports/**` staleness/downstream audit; cross-references in lower-authority docs that the overhaul will invalidate. |
| **other** | derive entirely from exploration; default to the universal two plus whatever the target names. |
