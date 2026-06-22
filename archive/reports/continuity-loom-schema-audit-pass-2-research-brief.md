# Research brief — Schema, generation-brief, and record-taxonomy re-audit (pass 2, less-deferential)

> **For ChatGPT-Pro Session 2. This is a locked, no-questions brief.** Everything you need is in
> this prompt plus the uploaded manifest. Do not interview, do not ask clarifying questions — the
> requirements below are final. Produce the deliverable directly.

---

## 1. Context

The uploaded manifest (`reports/manifest_2026-06-20_a1846ef.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a **local-first story-state operating system**: a Node process
serves a React UI and a localhost-only API that tracks story records, compiles them into a
**deterministic** prose-generation prompt, and handles segment acceptance. No account, no cloud; data
stays on the user's machine. It is an npm-workspaces ESM monorepo (Node ≥ 24, strict TypeScript) with
three packages: `@loom/core` (pure continuity/compiler logic, framework- and platform-free — no
`fastify`/`react`/`vite`/`node:*`), `@loom/server` (serves the built UI + the localhost API),
`@loom/web` (React + Vite front end).

Governing docs: `docs/FOUNDATIONS.md` is the **constitution** (its **§29** is the alignment /
hard-fail checklist; its **§13** states the **field-economy rule** that is the core yardstick for this
audit; its **§12** is the no-branches / no-plot-rail boundary; its **§28** records research-grounded
conclusions already adopted). `docs/ACTIVE-DOCS.md` maps the active authority hierarchy and the
active-vs-archive boundary.

**Fetch every file from commit `a1846ef`
(`a1846efaddfb95c64de8256dc1b8e4780c170844`)** — the uploaded manifest reflects exactly that tree.
Read repository files from that commit only. (No referenced report cites a divergent "commit of
record" for this target; if you encounter one, prefer this baseline.)

**This brief is the SECOND iterative pass on a target the first pass already audited.** It is a
**delta**, not a cold start:

- The first pass's brief was `reports/schema-field-and-taxonomy-audit-research-brief.md`. It
  commissioned a whole-schema field-economy audit on three concern axes (unnecessary/harmful fields,
  missing fields, missing record categories).
- That pass produced the change-proposal document now archived at
  `archive/specs/continuity-loom-schema-audit-and-changes.md` (status: COMPLETED). Its 5
  recommendations **have already been implemented and merged into `main`** (PR #60, branch
  `implemented-conlooschaud`), and the authority docs at this baseline already reflect them. The 5
  implemented changes were:
  1. removed `STORY CONTRACT.continuity_philosophy` (fixed constitutional literal);
  2. removed `ACTIVE WORKING SET.manual_directive_id` (phantom reference — no MANUAL DIRECTIVE record
     category exists);
  3. removed `CURRENT CAST VOICE PRESSURE[].local_function` (duplicate of the working-set role);
  4. removed `CAST VOICE OVERRIDES[].scope` (fixed literal inside an already generation-scoped block);
  5. delivery repairs **adding no fields** — removed the redundant `{voice_pressure}` prompt lane,
     routed present-minor `current_voice_pressure` into the compressed present-minor notes, rendered
     selected non-person `ENTITY` (`entity_kind` + `short_description`) into `{material_pressure}`,
     rendered `LOCATION.hazards_or_shelters` and `LOCATION.social_rules`, and made a set of retained
     fields explicitly authoring/validation/history/UI-facing.

So at this baseline those four fields are **already gone** and those delivery fixes are **already
live**. Do not re-recommend them as new. (You **may** reconsider them — see §3.5.)

Two other briefs exist in `reports/` —
`prompt-duplication-cross-segment-research-brief.md` and
`author-private-story-notes-research-brief.md`. They address **different** targets and are named here
only so you do not conflate them with this audit. Related context at most, not scope you must extend.

---

## 2. Read in full (authority order)

Read these from commit `a1846ef`, in this order. **[primary]** = a load-bearing conformance target you
must reason against. **[boundary]** = read to bound scope and learn what each field must support — not
something to audit or "correct" in its own right.

**Constitution & authority map**
- `docs/ACTIVE-DOCS.md` — **[primary]** the authority registry, the active-vs-archive boundary, and
  the "when a change needs a spec / ticket / doc-correction" intake rules. Tells you which doc owns
  which surface, so your recommendations target the right authority.
- `docs/FOUNDATIONS.md` — **[primary]** the constitution; read it all. Load-bearing sections: **§13**
  (the field-economy rule — *every field must earn its place through ≥1 concrete function: deterministic
  compilation, deterministic validation, continuity interpretation, character voice/behavior
  preservation, prose-quality protection, or authorial control* — the yardstick); **§12** (no branches
  / plot rails / act machinery / beat packages — the boundary for concern axis (c)); **§28**
  (research-grounded conclusions already adopted — engage them, but per §3.3 this pass does **not**
  treat them as immune to a well-evidenced challenge); **§29.1–29.12** (the hard-fail checklist every
  recommendation must clear); **§5** (story-state authority); **§9–§11** (universal prose prompt
  contract, no-accepted-prose rule, validation/hard-fail doctrine). Per §3.4 this pass may **propose**
  amendments to this document.

**Product / user-facing (boundary-awareness — what an author actually needs a field for)**
- `README.md` — **[boundary]** product identity and the local loop.
- `docs/user-guide.md` — **[boundary]** the user-facing install/run/verify/author workflow; grounds
  the "authorial control" function in the field-economy rule.

**Primary domain authorities (the audit's core surfaces)**
- `docs/story-record-schema.md` — **[primary]** THE central audit target: global story properties
  (§2 — STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE), the entire generation-time brief (§3),
  the full record taxonomy (§4–9), the schema/template synchronization rules (§10), and the
  blocker/warning taxonomy (§11). Every concern axis lands here.
- `docs/compiler-contract.md` — **[primary]** the deterministic placeholder mapping, prompt section
  order, requiredness, and empty-state rendering. A field with **no** prompt destination here AND no
  validation / authorial-control use is a prime removal candidate; a field whose contract promises a
  destination the compiler never fills is the SPEC-024 "misleads authors" failure mode.
- `docs/prompt-template.md` — **[primary]** the universal **prose** prompt template and its placeholder
  structure — where each compiled field lands in the prompt the external writer sees. **The quality of
  prose generated through this prompt is the goal of the whole audit.**
- `docs/prompt-template-rationale.md` — **[primary]** the existing field-economy *defense* for each
  section and ordering choice. Per §3.3 this pass is **licensed to challenge** this rationale, not
  merely engage-and-defer: where a defense is weak, circular, or contradicted by evidence, say so. (You
  must still *engage* it before overturning it — an unaddressed rationale is not a refuted one.)
- `docs/validation-rule-inventory.md` — **[primary]** the implemented validation-diagnostic inventory
  and the same-change drift rule. A field's *validation use* is a field-economy justification; use this
  to confirm whether a field actually backs a live diagnostic or only a hollow presence check (the
  SPEC-024 pattern).

**Research candidates for concern axes (b) missing fields and (c) missing categories**
- `docs/narrative-theory-blocker-roadmap.md` — **[primary]** the non-binding, research-grounded
  candidate list for possible future deterministic validation / field work. A "missing field/category"
  you propose may already be catalogued here (cite it) or deliberately deferred here (engage the
  reasoning, and — per §3.3 — feel free to argue the deferral was wrong if the evidence supports it).

**Regression / behavior boundary-awareness (what fields must keep supporting)**
- `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md` —
  **[boundary]** the canonical stress/demo behaviors a field may exist to protect. Removing a field a
  stress case depends on is a regression; check here before recommending removal.
- `docs/ideation-prompt-template.md` — **[boundary]** the grounded-ideation prompt (the sanctioned
  assistance surface, FOUNDATIONS §9.1). Read it for **sync and consistency awareness only** — it is
  **not** a primary audit target (the prose prompt's quality is the goal). But it shares serializers
  with the prose prompt, so any field add/remove/change you recommend must state its ideation-template
  and ideation-golden sync consequence.

**Precedent & taxonomy provenance**
- `archive/specs/continuity-loom-schema-audit-and-changes.md` — **[primary]** the first pass's
  completed change-proposal — the source of the 5 already-implemented changes that define this
  baseline. Read it to know exactly what was changed and *why*, so you (a) do not re-recommend it, and
  (b) can, per §3.5, reconsider it with fresh evidence.
- `reports/schema-field-and-taxonomy-audit-research-brief.md` — **[primary]** the first pass's brief —
  what was already commissioned and the settled intentions that scoped it. Do not re-commission
  completed work.
- `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md` — **[primary]** the removal
  precedent: the bar, the method (schema → validation → UI → field-guidance → migration → docs → tests,
  in package-boundary order), and the evidentiary standard a field removal must meet.
- `archive/specs/SPEC-003-typed-data-model-and-record-identity.md` — **[boundary]** established the
  typed record taxonomy and record identity; provenance for *why the current category set exists*.
- `archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md` — **[boundary]** established the
  cast dossier + generation-brief editors; provenance for the brief's field set.

**Inspect, not read in full** (the ground truth for "does this field have a real function" — read the
files yourself; do not paste them into the deliverable):
- `packages/core/src/records/*` — the authoritative field shapes and Zod schemas. Especially the
  record registry, the entity / cast-member / knowledge / space-material / causal-pressure /
  relationship-emotion record modules, `generation-brief*.ts` (storage / draft / readiness),
  `global-config.ts`, `compile-destinations.ts`, and `field-guidance-*.ts`.
- `packages/core/src/compiler/sections/*` (e.g. `front.ts`, `cast.ts`, `pressure.ts`, `records-tail.ts`,
  `ideation.ts`) plus `placeholder-map.ts` and `empty-states.ts` — where each field is actually read and
  rendered (the ground truth for "does this field have a prompt destination").
- `packages/core/src/validation/rules/*` — where each field is actually checked (the ground truth for
  "does this field back a live diagnostic").
- `@loom/server` storage/migration seams — to scope any `.strict()`-tightening migration cost.

Explore further across `@loom/core`, `@loom/server`, and `@loom/web` as needed — the lists above are
the floor, not the ceiling.

---

## 3. Settled intentions (final — do not re-open)

These were resolved with the repo owner. They are decisions, not options.

1. **This is a second iterative pass on the post-implementation baseline.** The baseline (commit
   `a1846ef`) already contains the 5 implemented changes from the first pass (§1). Treat the current
   schema/brief/taxonomy as it stands at this commit as the starting state.
2. **Audit scope is the whole schema, on three concern axes**, judged against the FOUNDATIONS §13
   field-economy rule and the §29 hard-fail checklist. Three surfaces: global story properties (schema
   §2 — STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE), the entire generation-time brief
   (schema §3 — active working set, current authoritative state, immediate handoff, manual moment
   directive, current cast voice pressure, cast voice overrides, generation validation focus, stop
   guidance), and the full record taxonomy (schema §4–9 — ENTITY, ENTITY STATUS, CAST MEMBER, FACT,
   BELIEF, SECRET, POV/AUDIENCE KNOWLEDGE PROFILE, LOCATION, OBJECT, VISIBLE AFFORDANCE, EVENT,
   INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, EMOTION). The three axes:
   (a) fields or generation-brief content that are **unnecessary or harmful**; (b) genuinely **missing
   fields** not already covered by an existing field; (c) **gaps in the set of record categories**,
   warranting one or more **new categories**. "Harmful" spans four failure modes — audit against each:
   (i) **degrades prose / over-constrains** the writer (stiffens, flattens, manufactures incident the
   stop-rule/craft sections work against); (ii) **misleads authors or agents** — dead/phantom prompt
   destination, circular self-referential validation, or guidance promising a compilation effect that
   does not exist (the SPEC-024 pattern); (iii) **contamination / hidden state** — risks pulling
   accepted prose, rejected/superseded candidates, or auto-derived summaries into prompt context, or
   introduces non-deterministic / hidden compiler state; (iv) **generator bias / forces events** —
   biases the generator toward outcomes or acts as a soft plot-rail, drifting toward §12-prohibited
   machinery.
3. **This is an explicitly LESS-DEFERENTIAL pass. Do not treat the current code/doc surface as
   settled.** Re-derive the schema, generation brief, and taxonomy as if from first principles. You are
   licensed to challenge `docs/prompt-template-rationale.md`'s on-record defenses and the first pass's
   "examined-but-unchanged" verdicts in `continuity-loom-schema-audit-and-changes.md` — engage them,
   then overturn them where the evidence warrants. The first pass deliberately stayed conservative and
   deferred to existing rationale; this pass should re-examine the conclusions it reached by deference.
   (Engaging a rationale before overturning it is required; an unaddressed defense is not a refuted
   one.)
4. **Stay within the current constitution for design, but FOUNDATIONS amendments may be PROPOSED.**
   Every recommended *design* must be compatible with `docs/FOUNDATIONS.md` as it stands — do **not**
   silently design against a current invariant (§6). However, where a genuinely valuable change would
   require amending the constitution — including loosening or sharpening the §12 no-plot-rails boundary
   or the §13 field-economy rule, or touching a determinism / accepted-prose / fail-closed invariant —
   present it as a **separate, clearly-labeled `FOUNDATIONS-amendment-required` item** that states the
   exact §-level conflict and the rationale. Flag it; do not assume the amendment, and do not smuggle a
   design around the invariant.
5. **The 5 already-implemented changes are reconsiderable with evidence.** Because nothing is treated as
   settled, you may critique, refine, or even recommend **reverting or revising** one of the 5 — but
   only with concrete evidence, and you must (a) never re-recommend any of them as if it were a new
   finding, and (b) explicitly record, in the examined-but-unchanged section, where you agree the
   implemented change was correct. A recommendation to revisit an implemented change is a normal
   keep/remove/modify recommendation subject to the same §3.6 bar.
6. **High evidentiary bar; "no change" is an explicitly valid verdict — including the whole-audit
   verdict.** The current system may already be correct. Every recommendation must name the concrete
   function it adds or the concrete failure mode it removes, with evidence from the code/docs and (for
   additions) from external research. Reject change-for-its-own-sake; prefer the conservative verdict
   when evidence is thin. SPEC-024 is the precedent for the bar a removal must clear.
7. **The prose prompt is the quality target; ideation is sync-only.** The audit's goal is the quality
   of prose generated through the **main prose prompt** (`docs/prompt-template.md`).
   `docs/ideation-prompt-template.md` is read for boundary/sync awareness only — not a primary audit
   target. But because the two prompts share serializers, any recommended field add/remove/change must
   state its sync consequence for the ideation template **and** the ideation golden.
8. **Change surface = schema fields + generation brief + record taxonomy.** Those are the units of
   analysis. Prompt-template and compiler-contract *wording* may change **only as required to stay in
   sync** with a recommended field/category change (schema §10). Do not audit the template prose for its
   own sake.
9. **The deliverable is a change-proposal document, NOT a numbered spec.** A positive verdict will be
   turned into a spec by the repo owner's coding agent (Claude Code); the next number would be SPEC-025
   (`specs/` is empty; highest across `specs/` + `archive/specs/` is SPEC-024). Do not author a
   `SPEC-NNN` file, do not assign a spec number, and do not write to a repo path — produce the single
   downloadable markdown document specified in §7.

---

## 4. The task

This is a **new-spec-precursor re-audit** (dominant: new-spec; secondary: a foundational/doc-overhaul
cascade across the schema/template authorities, plus — newly licensed this pass — possible
FOUNDATIONS-amendment proposals). Achieve a rigorous, evidence-complete, **less-deferential**
determination of whether Continuity Loom's story-record schema, generation-time brief, and
record-category taxonomy are correct **as they stand at this post-implementation baseline** — judged
against the FOUNDATIONS §13 field-economy rule and the §29 hard-fail checklist — across three axes:
unnecessary/harmful content, missing fields, and missing record categories. Unlike the first pass, do
not treat the current surface, the on-record rationale, or the prior audit's "unchanged" verdicts as
settled; re-derive and be willing to overturn them. Where changes are warranted, specify them in enough
detail (code + docs) that a coding agent can turn them into an implementation spec without re-deriving
the analysis; where a surface is correct as-is, record the evidence-backed verdict that it is. The goal
is the **right** schema for prose quality, not a *changed* schema.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — the field shapes, compiler
sections, validation rules, field-guidance, and tests are the ground truth for whether a field has a
real function. **Research online as deeply as needed** — similar implementations (narrative-state /
interactive-fiction / story-bible / character-bible / "memory" systems for LLM fiction, tabletop
GM-assist state models, story-database schemas), academic work (narratology and story grammars;
character/persona modeling; narrative planning and intentionality; knowledge/belief and
theory-of-mind state; long-context and context-engineering / RAG; few-shot conditioning effects on
style), and prompt-engineering prior art — wherever it sharpens a keep/remove/add decision. **Cite
every external source** that shapes a recommendation. Distinguish evidence-backed recommendations from
speculative ones, and prefer the conservative verdict when evidence is thin (per §3.6).

---

## 6. Doctrine & constraints (honor these; do not weaken any)

- `docs/FOUNDATIONS.md` is the constitution. Every recommended *design* must satisfy it and clear its
  **§29 hard-fail checklist**. A genuine divergence is an amendment to flag (§3.4), never a design to
  smuggle in.
- Authority order per `docs/ACTIVE-DOCS.md`: constitution above domain docs above implementation
  convenience. If a proposal conflicts with a higher authority, the proposal is wrong, not the
  authority — unless you are explicitly flagging a FOUNDATIONS amendment per §3.4. Any field/category
  change must update its owning authority doc **in the same change** (schema §10 synchronization: every
  prompt placeholder appears in the compiler contract; every prompt-facing field names its destination;
  every validation-only field is marked not-prompt-facing; adding/renaming/deleting a placeholder
  requires a compiler-contract update in the same change).
- No backwards-compatibility shims, aliases, or duplicate authority paths in new work unless explicitly
  justified — duplicate authority is precisely what SPEC-024 and the first pass removed.
- Loom non-negotiable invariants (every recommended design must preserve all of them; to touch one, you
  must instead raise a §3.4 amendment flag):
  - Records and user-authored generation-time fields are the continuity authority.
  - **Accepted prose, rejected candidates, superseded candidates, and automatic prose-derived summaries
    are NOT prompt context.** A new field must not become a back door for any of them.
  - The prompt compiler is **deterministic** and must not query hidden state outside the validation
    snapshot, nor use an LLM to select/summarize/rank/interpret records.
  - Validation **fails closed**: blockers gate prompt preview and send; warnings never compile into the
    prose prompt as instructions.
  - The active working set is explicit and user-controlled — no silent inclusion of "relevant" records.
  - **No branches, plot rails, beat packages, act machinery, or autonomous plot planner** (§12). A new
    record category or field must express *local causal pressure*, not future structure.
  - The app never uses an LLM to mutate records automatically.
  - API keys are global local secrets; keys, full prompts, candidates, accepted prose, and full record
    payloads are not logged by default.
  - Project data stays local and user-owned; the only network traffic is the prompt the user
    intentionally sends through OpenRouter; every server binds `127.0.0.1` only.

---

## 7. Deliverable specification — determination-plus-conditional (mode: produce-only-if-positive)

First, **produce a verdict**: for each audited surface (the three global blocks, each generation-brief
sub-block, and each record category), a clearly-labeled, evidence-based determination of whether change
is warranted on any of the three concern axes, and why. Each verdict must engage the relevant on-record
rationale and, where applicable, the first pass's verdict on that surface — and may overturn either
(§3.3).

Then, conditional on that verdict:

- **If any change is warranted anywhere** (any keep/remove/add/revise recommendation — including a
  reconsideration of one of the 5 implemented changes — that clears the §3.6 bar) → produce **one
  downloadable markdown document** named **`continuity-loom-schema-audit-pass-2.md`**. This is the repo
  owner's hand-off artifact — it is **not** a repo path and **not** a `SPEC-NNN` file (Claude Code
  converts it into SPEC-025). The document must contain:
  1. **Executive verdict** — a per-surface table (surface · axis · verdict: unchanged / remove / modify
     / add-field / add-category / revise-implemented-change / amendment-required · one-line
     justification).
  2. **For each recommended change**, in enough detail to become a spec without re-analysis:
     - the exact field path or record category, which concern axis, and (for harm) which of the four
       failure modes it answers;
     - **code changes** — the specific `@loom/core` schema shape (Zod), and the cascade across
       validation rules, compiler sections, field-guidance, the record registry, demo fixtures, and any
       `@loom/server` storage/migration impact (note that tightening a `.strict()` schema or
       removing/adding a stored field forces a migration, per the SPEC-024 storage analysis);
     - **doc updates** — which authority doc and section change
       (`docs/story-record-schema.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`,
       `docs/prompt-template-rationale.md`, `docs/validation-rule-inventory.md`), honoring schema §10
       synchronization;
     - **prompt-template / compiler-contract sync** changes required by the field change (only those —
       §3.8), **and** the **ideation-template + ideation-golden** sync consequence (§3.7);
     - **FOUNDATIONS §29 clearance** — which hard-fail sub-checks the change must satisfy, and the
       argument that it does; OR, if it cannot, the **`FOUNDATIONS-amendment-required`** flag per §3.4,
       naming the exact §-level conflict.
  3. **Examined-but-unchanged areas** — the evidence-backed "no change needed, because it earns its
     place via <function>" verdict for every surface you audited and left alone, **including each of the
     5 implemented changes you agree was correct** (§3.5), so the document is a *complete* audit, not
     just a changelist.
  4. **Sources** — full citations for every external claim that shaped a decision.
- **If the audit is fully clean** (no change clears the bar on any surface or axis) → produce **no
  file**. Instead, report inline: the per-surface verdict table and the evidence that each surface
  already earns its place. (The repo owner has explicitly accepted "no changes" as a valid outcome.)

> **Locked / no-questions.** Produce the deliverable directly. Do not interview, do not ask clarifying
> questions — the requirements above are final. If a genuine contradiction makes a requirement
> impossible, state it in the deliverable and proceed with the most faithful interpretation.

---

## 8. Self-check (run against your own output before returning)

- [ ] Every recommendation names the **concrete function added or failure mode removed**, judged
      against the FOUNDATIONS §13 field-economy rule — none is change-for-its-own-sake.
- [ ] Every verdict that overturns an on-record rationale or a first-pass "unchanged" verdict
      **engages that rationale first** (§3.3); none is overturned by silence.
- [ ] No re-recommendation of any of the 5 already-implemented changes as if new; any reconsideration of
      one is evidence-backed and labeled (§3.5), and every implemented change agreed-correct is recorded
      in examined-but-unchanged.
- [ ] Every recommendation either **clears the §29 hard-fail checklist**, or is explicitly flagged
      **`FOUNDATIONS-amendment-required`** with the §-level conflict (§3.4) — none silently weakens an
      invariant in §6.
- [ ] No recommendation introduces a back door for accepted prose / rejected / superseded / auto-derived
      summaries, hidden compiler state, non-determinism, or §12 plot-rail machinery (absent an explicit
      §3.4 amendment flag).
- [ ] Change surface stayed within **schema fields + generation brief + taxonomy**; template/contract
      edits appear **only** as sync consequences of a field/category change (§3.8), and every such
      change states its **ideation-template + ideation-golden** sync consequence (§3.7).
- [ ] The deliverable form matches the verdict: a single `continuity-loom-schema-audit-pass-2.md` iff any
      change is warranted; inline report only iff fully clean (§7).
- [ ] When the file is produced, it includes the **examined-but-unchanged** verdicts, so the audit is
      complete — not merely a changelist.
- [ ] Every external claim that shaped a decision is **cited**.
- [ ] Every doc impact respects **schema §10 synchronization** (placeholder ↔ compiler-contract ↔ field
      destination ↔ validation-only marking, all in the same change).
- [ ] All files were read from commit **`a1846ef`**, the manifest baseline; no path referenced outside
      that tree.
