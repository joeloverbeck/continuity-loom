# Research brief — Story-record schema, generation-brief, and record-taxonomy field-economy audit

> **For ChatGPT-Pro Session 2. This is a locked, no-questions brief.** Everything you need is
> in this prompt plus the uploaded manifest. Do not interview, do not ask clarifying
> questions — the requirements below are final. Produce the deliverable directly.

---

## 1. Context

The uploaded manifest (`reports/manifest_2026-06-20_8970656.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a **local-first story-state operating system**: a Node
process serves a React UI and a localhost-only API that tracks story records, compiles them into a
**deterministic** prose-generation prompt, and handles segment acceptance. No account, no cloud;
data stays on the user's machine. It is an npm-workspaces ESM monorepo (Node ≥ 24, strict
TypeScript) with three packages: `@loom/core` (pure continuity/compiler logic, framework- and
platform-free — no `fastify`/`react`/`vite`/`node:*`), `@loom/server` (serves the built UI + the
localhost API), `@loom/web` (React + Vite front end).

Governing docs: `docs/FOUNDATIONS.md` is the **constitution** (its **§29** is the alignment /
hard-fail checklist every spec or ticket must clear; its **§13** states the field-economy rule that
is the core yardstick for this audit); `docs/ACTIVE-DOCS.md` maps the active authority hierarchy and
the active-vs-archive boundary.

**Fetch every file from commit `8970656` (`89706560a6af55a3741450b15d89d5dd5ad082d0`)** — the
uploaded manifest reflects exactly that tree. Read repository files from that commit only. (No
referenced report cites a divergent "commit of record" for this target; if you encounter one, prefer
this baseline.)

**Predecessor work.** This brief does **not** continue an earlier research brief. Two other briefs
exist in `reports/` — `prompt-duplication-cross-segment-research-brief.md` and
`author-private-story-notes-research-brief.md`. They address **different** targets (cross-segment
prompt duplication; the author-private-notes surface) and are named here only so you do **not**
conflate them with this audit. Treat them as related context at most, not as scope you must extend.

**Recent precedent you must internalize.** `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`
(completed 2026-06-19, the repo's most recent change) is a field-economy *removal* of exactly the
kind this audit may recommend: it deleted the dead, duplicated `STORY CONTRACT.prose_preferences`
group whose only runtime "function" was a self-referential validation presence check and whose
field-guidance falsely promised a prompt destination. **It removed only that duplicate** — STORY
CONTRACT and PROSE MODE themselves remain fully live and compiled. Use SPEC-024 as the model for the
*bar*, the *method* (schema → validation → UI → field-guidance → migration → docs → tests, in
package-boundary order), and the *evidentiary standard* a removal must meet.

---

## 2. Read in full (authority order)

Read these from commit `8970656`, in this order. Primary (load-bearing conformance targets) are
marked **[primary]**; the rest are **[boundary]** — read to bound scope and to learn what each field
must support, not as things to audit or "correct" in their own right.

**Constitution & authority map**
- `docs/ACTIVE-DOCS.md` — **[primary]** the authority registry, the active-vs-archive boundary, and
  the "when a change needs a spec/ticket/doc-correction" intake rules. Tells you which doc owns which
  surface, so your change recommendations target the right authority.
- `docs/FOUNDATIONS.md` — **[primary]** the constitution. Load-bearing sections for this audit:
  **§13** (the field-economy rule — *every field must earn its place through ≥1 concrete function:
  deterministic compilation, deterministic validation, continuity interpretation, character
  voice/behavior preservation, prose-quality protection, or authorial control* — this is the
  yardstick); **§12** (no branches / plot rails / act machinery / beat packages — the boundary for
  concern #3); **§29.1–29.12** (the hard-fail checklist every recommendation must clear); **§5**
  (story-state authority); **§28** (research-grounded conclusions already adopted — do not re-litigate
  them blindly). The whole document is the constitution; read it all.

**Product / user-facing (boundary-awareness — what an author actually needs a field for)**
- `README.md` — **[boundary]** product identity and the local loop.
- `docs/user-guide.md` — **[boundary]** the user-facing install/run/verify/author workflow; grounds
  the "authorial control" function in the field-economy rule.

**Primary domain authorities (the audit's core surfaces)**
- `docs/story-record-schema.md` — **[primary]** THE central audit target: the global story
  properties (§2), the entire generation-time brief (§3), the full record taxonomy (§4–9), the
  schema/template synchronization rules (§10), and the blocker/warning taxonomy (§11). Every concern
  axis lands here.
- `docs/compiler-contract.md` — **[primary]** the deterministic placeholder mapping, prompt section
  order, requiredness, and empty-state rendering. A field with **no** prompt destination here AND no
  validation/authorial-control use is a prime removal candidate; a field whose contract promises a
  destination that the compiler never fills is the SPEC-024 "misleads authors" failure mode.
- `docs/prompt-template.md` — **[primary]** the universal prose prompt template and its placeholder
  structure — where each compiled field actually lands in the prompt the external writer sees.
- `docs/prompt-template-rationale.md` — **[primary]** the existing field-economy *defense* for each
  section and ordering choice. Before recommending removal of a field/section, you must engage the
  rationale already on record for it; before recommending an addition, check it was not already
  considered and rejected here.
- `docs/validation-rule-inventory.md` — **[primary]** the implemented validation-diagnostic
  inventory and the same-change drift rule. A field's *validation use* is a field-economy
  justification; use this to confirm whether a field actually backs a live diagnostic or only a
  hollow presence check (the SPEC-024 pattern).

**Research candidates for concerns #2 (missing fields) and #3 (missing categories)**
- `docs/narrative-theory-blocker-roadmap.md` — **[primary]** the non-binding, research-grounded
  candidate list for possible future deterministic validation / field work. Directly relevant: a
  "missing field/category" you propose may already be catalogued here (cite it) or may be
  deliberately deferred here (engage the reasoning).

**Regression / behavior boundary-awareness (what fields must keep supporting)**
- `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md` —
  **[boundary]** the canonical stress/demo behaviors a field may exist to protect. Removing a field
  that a stress case depends on is a regression; check here before recommending removal.
- `docs/ideation-prompt-template.md` — **[boundary]** the grounded-ideation surface; some
  generation-brief/global fields originate or are previewed here. Bounds what is *not* part of the
  prose-generation schema.

**Precedent & taxonomy provenance**
- `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md` — **[primary]** the bar,
  method, and evidentiary standard for a field removal (see §1).
- `archive/specs/SPEC-003-typed-data-model-and-record-identity.md` — **[boundary]** established the
  typed record taxonomy and record identity; provenance for *why the current category set exists*.
- `archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md` — **[boundary]** established
  the cast dossier + generation-brief editors; provenance for the brief's field set.

**Code seams (inspect directly; do not paste them into the deliverable — you read them yourself)**
- `packages/core/src/records/*` — the authoritative field shapes and Zod schemas. Especially
  `registry.ts` (the record-category set), `entity.ts`, `cast-member.ts` + `cast-member-sections.ts`,
  `knowledge.ts`, `space-material.ts`, `causal-pressure.ts`, `relationship-emotion.ts`,
  `generation-brief.ts` + `generation-brief-draft.ts` + `generation-brief-readiness.ts`,
  `global-config.ts`, `compile-destinations.ts`, `field-guidance-*.ts`.
- `packages/core/src/compiler/sections/*` (`front.ts`, `cast.ts`, `pressure.ts`, `records-tail.ts`,
  `ideation.ts`) — where each field is actually read and rendered (the ground truth for "does this
  field have a prompt destination").
- `packages/core/src/validation/rules/*` — where each field is actually checked (the ground truth
  for "does this field back a live diagnostic").

Explore further across `@loom/core`, `@loom/server`, and `@loom/web` as needed — the lists above are
the floor, not the ceiling.

---

## 3. Settled intentions (final — do not re-open)

These were resolved with the repo owner. They are decisions, not options.

1. **Audit scope is the whole schema.** Three surfaces: global story properties (schema §2 — STORY
   CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE), the entire generation-time brief (schema §3 —
   active working set, current authoritative state, immediate handoff, manual moment directive,
   current cast voice pressure, cast voice overrides, generation validation focus, stop guidance),
   and the full record taxonomy (schema §4–9 — ENTITY, ENTITY STATUS, CAST MEMBER, FACT, BELIEF,
   SECRET, POV/AUDIENCE KNOWLEDGE PROFILE, LOCATION, OBJECT, VISIBLE AFFORDANCE, EVENT, INTENTION,
   PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, EMOTION).
2. **Three concern axes, judged against the FOUNDATIONS §13 field-economy rule:** (a) fields or
   generation-brief content that are **unnecessary or harmful**; (b) genuinely **missing fields**;
   (c) **gaps in the set of record categories**, warranting one or more **new categories**.
3. **"Harmful" spans all four failure modes** (audit against each): (i) **degrades prose / over-
   constrains** the writer (stiffens, flattens, manufactures incident the stop-rule/craft sections
   work against); (ii) **misleads authors or agents** — dead/phantom prompt destination, circular
   self-referential validation, or guidance promising a compilation effect that does not exist (the
   SPEC-024 pattern); (iii) **contamination / hidden state** — risks pulling accepted prose,
   rejected/superseded candidates, or auto-derived summaries into prompt context, or introduces
   non-deterministic / hidden compiler state; (iv) **generator bias / forces events** — biases the
   generator toward outcomes or acts as a soft plot-rail (forcing beats/escalation), drifting toward
   §12-prohibited machinery.
4. **Stay within the current constitution; flag, do not design against it.** Recommendations must be
   compatible with `docs/FOUNDATIONS.md` as it stands. If a genuinely valuable change would require a
   constitutional amendment (e.g., a new record category that brushes §12, or a field that touches an
   accepted-prose / determinism invariant), present it as a **separate, clearly-labeled
   "FOUNDATIONS-amendment-required" item** stating the exact §-level conflict and the rationale — but
   do **not** assume the amendment, and do **not** silently design around the invariant.
5. **Change surface is schema fields + generation brief + record taxonomy.** Those are the units of
   analysis. Prompt-template and compiler-contract *wording* may change **only as required to stay in
   sync** with a recommended field/category change (per schema §10 synchronization rules) — they are
   not independent audit-and-rewrite targets. Do not audit the template prose for its own sake.
6. **High evidentiary bar; "no change" is an explicitly valid verdict — even the whole-audit
   verdict.** The current system may be complete. Every recommendation must name the concrete
   function it adds or the concrete failure mode it removes, with evidence from the code/docs and (for
   additions) from external research. Reject change-for-its-own-sake. SPEC-024 is the precedent for
   the bar a removal must clear.
7. **The deliverable is a change-proposal document, NOT a numbered spec.** The repo owner's coding
   agent (Claude Code) will turn a positive verdict into a spec (the next number would be SPEC-025).
   Do not author a `SPEC-NNN` file, do not assign a spec number, and do not write to a repo path —
   produce a single consolidated downloadable markdown document (see §7).

---

## 4. The task

This is a **new-spec-precursor audit** (dominant: new-spec; secondary: foundational/doc-overhaul
cascade across the schema/template authorities). Achieve a rigorous, evidence-complete determination
of whether Continuity Loom's story-record schema, generation-time brief, and record-category
taxonomy are correct as they stand — judged against the FOUNDATIONS §13 field-economy rule and the
§29 hard-fail checklist — across three axes: unnecessary/harmful content, missing fields, and missing
record categories. Where changes are warranted, specify them in enough detail (code + docs) that a
coding agent can turn them into an implementation spec without re-deriving the analysis; where a
surface is correct as-is, record the evidence-backed verdict that it is. The goal is the *right*
schema, not a *changed* schema.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — the field shapes,
compiler sections, validation rules, field-guidance, and tests are the ground truth for whether a
field has a real function. **Research online as deeply as needed** — similar implementations
(narrative-state / interactive-fiction / story-bible / character-bible / "memory" systems for LLM
fiction, tabletop GM-assist state models, story-database schemas), academic work (narratology and
story grammars; character/persona modeling; narrative planning and intentionality; knowledge/belief
and theory-of-mind state; long-context and context-engineering / RAG; few-shot conditioning effects
on style), and prompt-engineering prior art — wherever it sharpens a keep/remove/add decision. **Cite
every external source** that shapes a recommendation. Distinguish evidence-backed recommendations
from speculative ones, and prefer the conservative verdict when evidence is thin (per §3.6).

---

## 6. Doctrine & constraints (honor these; do not weaken any)

- `docs/FOUNDATIONS.md` is the constitution. Every recommendation must satisfy it and clear its **§29
  hard-fail checklist**. A genuine divergence is an amendment to flag (§3.4), never a design to
  smuggle in.
- Authority order per `docs/ACTIVE-DOCS.md`: constitution above domain docs above implementation
  convenience. If a proposal conflicts with a higher authority, the proposal is wrong, not the
  authority. Any field/category change must update its owning authority doc **in the same change**
  (schema §10 synchronization: every prompt placeholder appears in the compiler contract; every
  prompt-facing field names its destination; every validation-only field is marked not-prompt-facing;
  adding/renaming/deleting a placeholder requires a compiler-contract update in the same change).
- No backwards-compatibility shims, aliases, or duplicate authority paths in new work unless
  explicitly justified — duplicate authority is precisely what SPEC-024 removed.
- Loom non-negotiable invariants (every recommendation must preserve all of them):
  - Records and user-authored generation-time fields are the continuity authority.
  - **Accepted prose, rejected candidates, superseded candidates, and automatic prose-derived
    summaries are NOT prompt context.** A new field must not become a back door for any of them.
  - The prompt compiler is **deterministic** and must not query hidden state outside the validation
    snapshot, nor use an LLM to select/summarize/rank/interpret records.
  - Validation **fails closed**: blockers gate prompt preview and send; warnings never compile into
    the prose prompt as instructions.
  - The active working set is explicit and user-controlled — no silent inclusion of "relevant"
    records.
  - **No branches, plot rails, beat packages, act machinery, or autonomous plot planner** (§12). A
    new record category or field must express *local causal pressure*, not future structure.
  - The app never uses an LLM to mutate records automatically.
  - API keys are global local secrets; keys, full prompts, candidates, accepted prose, and full
    record payloads are not logged by default.
  - Project data stays local and user-owned; the only network traffic is the prompt the user
    intentionally sends through OpenRouter; every server binds `127.0.0.1` only.

---

## 7. Deliverable specification — determination-plus-conditional (mode: produce-only-if-positive)

First, **produce a verdict**: for each audited surface (the three global blocks, each generation-
brief sub-block, and each record category), a clearly-labeled, evidence-based determination of
whether change is warranted on any of the three concern axes, and why.

Then, conditional on that verdict:

- **If any change is warranted anywhere** (any keep/remove/add recommendation that clears the §3.6
  bar) → produce **one downloadable markdown document** named
  **`continuity-loom-schema-audit-and-changes.md`**. This is the repo owner's hand-off artifact — it
  is **not** a repo path and **not** a `SPEC-NNN` file (Claude Code converts it into SPEC-025). The
  document must contain:
  1. **Executive verdict** — a per-surface table (surface · axis · verdict: unchanged / remove /
     modify / add-field / add-category / amendment-required · one-line justification).
  2. **For each recommended change**, in enough detail to become a spec without re-analysis:
     - the exact field path or record category, and which concern axis and (for harm) which of the
       four failure modes it answers;
     - **code changes** — the specific `@loom/core` schema shape (Zod), and the cascade across
       validation rules, compiler sections, field-guidance, the record registry, demo fixtures, and
       any `@loom/server` storage/migration impact (note that tightening a `.strict()` schema or
       removing/adding a stored field forces a migration, per the SPEC-024 storage analysis);
     - **doc updates** — which authority doc and section change (`docs/story-record-schema.md`,
       `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`,
       `docs/validation-rule-inventory.md`), honoring schema §10 synchronization;
     - **prompt-template/compiler-contract sync** changes required by the field change (only those —
       per §3.5);
     - **FOUNDATIONS §29 clearance** — which hard-fail sub-checks the change must satisfy, and the
       argument that it does; OR, if it cannot, the **FOUNDATIONS-amendment-required** flag per §3.4.
  3. **Examined-but-unchanged areas** — the evidence-backed "no change needed, because it earns its
     place via <function>" verdict for every surface you audited and left alone, so the document is a
     *complete* audit, not just a changelist.
  4. **Sources** — full citations for every external claim that shaped a decision.
- **If the audit is fully clean** (no change clears the bar on any surface or axis) → produce **no
  file**. Instead, report inline: the per-surface verdict table and the evidence that each surface
  already earns its place. (The repo owner has explicitly accepted "no changes" as a valid outcome.)

> **Locked / no-questions.** Produce the deliverable directly. Do not interview, do not ask
> clarifying questions — the requirements above are final. If a genuine contradiction makes a
> requirement impossible, state it in the deliverable and proceed with the most faithful
> interpretation.

---

## 8. Self-check (run against your own output before returning)

- [ ] Every recommendation names the **concrete function added or failure mode removed**, judged
      against the FOUNDATIONS §13 field-economy rule — none is change-for-its-own-sake.
- [ ] Every recommendation **clears the §29 hard-fail checklist**, or is explicitly flagged
      **FOUNDATIONS-amendment-required** with the §-level conflict (§3.4) — none silently weakens an
      invariant in §6.
- [ ] No recommendation introduces a back door for accepted prose / rejected / superseded /
      auto-derived summaries, hidden compiler state, non-determinism, or §12 plot-rail machinery.
- [ ] Change surface stayed within **schema fields + generation brief + taxonomy**; template/contract
      edits appear **only** as sync consequences of a field/category change (§3.5).
- [ ] The deliverable form matches the verdict: a single `continuity-loom-schema-audit-and-changes.md`
      iff any change is warranted; inline report only iff fully clean (§7).
- [ ] When the file is produced, it includes the **examined-but-unchanged** verdicts, so the audit is
      complete — not merely a changelist.
- [ ] Every external claim that shaped a decision is **cited**.
- [ ] Every doc impact respects **schema §10 synchronization** (placeholder ↔ compiler-contract ↔
      field destination ↔ validation-only marking, all in the same change).
- [ ] All files were read from commit **`8970656`**, the manifest baseline; no path referenced
      outside that tree.
