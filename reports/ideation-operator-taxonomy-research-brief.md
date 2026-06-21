# Research brief — Ideation operator "lens" taxonomy: distinctness & comprehensiveness audit

> **For ChatGPT-Pro Session 2. This prompt is final and self-contained.** Paste it whole and
> upload the named manifest. Do **not** interview or ask clarifying questions — every decision
> below is locked. Produce the deliverable directly as a downloadable markdown document.

---

## 1. Context

The uploaded manifest (`reports/manifest_2026-06-21_c10355e.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a **local-first story-state operating system**: a Node
process serves a React UI and a localhost-only API that tracks story records, compiles them into a
deterministic prose-generation prompt, and handles segment acceptance. No account, no cloud — data
stays on the user's machine. It is an npm-workspaces ESM monorepo (Node ≥ 24, strict TypeScript)
with three packages: `@loom/core` (pure continuity/compiler logic, framework- and platform-free —
no `fastify`/`react`/`vite`/`node:*`), `@loom/server` (serves the built UI + localhost API), and
`@loom/web` (React + Vite front end).

Governing docs: **`docs/FOUNDATIONS.md` is the constitution** (its §29 is the alignment/hard-fail
checklist every change must clear); **`docs/ACTIVE-DOCS.md`** maps the active authority hierarchy
and the active-vs-archive boundary. **Fetch every file from commit `c10355e`** — the uploaded
manifest reflects exactly that tree (`git ls-tree -r --name-only c10355e`). No earlier "commit of
record" cited inside any report supersedes this baseline.

**This is a fresh audit, not a continuation.** No prior research brief targeted the ideation
operator taxonomy. The current 9-operator taxonomy was established by two now-archived specs —
`archive/specs/SPEC-021-grounded-ideation-prompt.md` (the grounded ideation prompt and its operator
set) and `archive/specs/SPEC-022-ideation-native-prompt-template.md` (the ideation-native template
variants). Read them for provenance — *why* the current operators exist — but treat the **shipped
behavior** in `docs/ideation-prompt-template.md` and the code as the authoritative present state;
where an archived spec and the live doc disagree, the live doc wins.

Several sibling research briefs exist in `reports/` (schema audits, prompt-duplication, record
hygiene). **None of them is a predecessor to this one** — they share the word "prompt" but operate
on schema/field authority, cross-segment duplication, or the project-review hygiene prompt, not on
the ideation operator taxonomy. Do not treat their scope as completed work to extend here.

## 2. Read in full (authority order)

Read these before producing. Order is Loom's authority hierarchy.

**Primary (load-bearing for this target):**

- `docs/ACTIVE-DOCS.md` — the authority map: which doc governs which surface, and the
  active-vs-archive boundary. Read first so you cite the right authority for every proposed change.
- `docs/FOUNDATIONS.md` — the project constitution. §4.7 (causality over structure), §9.1
  (assistance prompt class — the ideation prompt is the sanctioned `prose-aligned` assistance
  prompt), §12 (no branches / plot-rail machinery), §18 (causal pressure records), §28.4
  (narrative-planning research informs causality, not plot machinery), and §29.4 (prompt-compilation
  hard fails) together bound what *any* operator-taxonomy change is allowed to do. A change that
  trips a §29 hard fail is wrong unless FOUNDATIONS is amended first.
- `docs/ideation-prompt-template.md` — **the domain authority** for the ideation prompt. Its
  `## Operator Taxonomy` section (the 9 operators), `## Slot Assignment`, the `<ideation_quality>`
  section (the **mutual-distinctness rule**), `## Citation Keys`, and the request shape are the
  exact surface under audit.
- `docs/compiler-contract.md` — §3.2 (Ideation Prompt Section Order) is the co-authority: it
  re-states operator eligibility, dormancy reservation, the distinctness rule, and citation-key
  render sites. Any taxonomy change must land here too.
- `docs/story-record-schema.md` — the conceptual record taxonomy and causal-pressure record types
  the operators feed from. This is the substrate for the **internal-coverage** benchmark (does every
  causal-pressure record type feed at least one distinct lens?).
- `archive/specs/SPEC-021-grounded-ideation-prompt.md` — provenance: the rationale that produced the
  original operator set and the grounded-ideation design.
- `archive/specs/SPEC-022-ideation-native-prompt-template.md` — provenance: the ideation-native
  template variants and what they deliberately drop from the prose prompt.

**Boundary-awareness (read to bound scope — NOT a redesign target):**

- `docs/prompt-template.md` and `docs/prompt-template-rationale.md` — the universal **prose** prompt
  and its rationale. Read only to keep the ideation/prose boundary sharp: the ideation prompt must
  never drift into prose machinery, branches, outlines, or beat packages. Do not propose changes to
  the prose prompt.
- `docs/narrative-theory-blocker-roadmap.md` — Loom's existing, non-binding narrative-theory
  research stance for deterministic validation candidates. Read so your external-theory benchmarking
  does not duplicate or contradict positions Loom has already taken, and so you keep "validation
  blocker" research distinct from "ideation operator" research.

**Inspect, not read in full** (read enough to ground claims about current behavior; do not audit for
code quality):

- `packages/core/src/compiler/ideation/operators.ts` — `IDEATION_OPERATORS`: the code authority for
  the 9 operators, their ids, definitions, feeding record types, required type groups, and minimum
  record counts.
- `packages/core/src/compiler/ideation/slot-assignment.ts` — `assignSlots(...)`: deterministic
  eligibility, taxonomy-order fill, `dormantSlot` reservation, shrink-not-pad behavior.
- `packages/core/src/compiler/ideation/types.ts` — `ideationRequestSchema`: request shape
  (`mode`, `count` 3–6, `dormantSlot`, `avoidList`).
- `packages/core/src/compiler/ideation/citation-keys.ts` — deterministic `[<TYPE>-<n>]` keying.
- `packages/core/src/compiler/sections/ideation.ts` — `renderIdeationSlotsSection(...)`.
- `packages/core/src/compiler/template-constants.ts` — `IDEATION_SECTION_TEMPLATES`
  (`ideation_role`, `ideation_quality`, `ideation_output_format`) and `IDEATION_SECTION_ORDER`.
- `packages/core/test/ideation-operator-eligibility.test.ts` and
  `packages/core/test/ideation-slot-assignment.test.ts` — the operator truth-table and slot-fill
  assertions that any taxonomy change must keep green.

## 3. Settled intentions (these make this session no-questions)

1. **Audit scope = the operator taxonomy + its directly-coupled machinery.** In scope to *propose
   changing*: the 9 operators (add / merge / split / redefine / reorder / re-feed their record
   types), the `<ideation_quality>` **mutual-distinctness rule**, and the slot-assignment
   **eligibility** logic. Everything else in the ideation prompt — the broader quality rubric beyond
   distinctness, the output format, the request shape (`mode`/`count`/`dormantSlot`/`avoidList`), and
   the section-selection/order — is **boundary-awareness only**: understand it, do not redesign it.
   Resist scope inflation; the request is about the "lenses," not the whole prompt.

2. **Deliverable = a spec-precursor change-proposal document, NOT a numbered spec.** Produce a
   standalone downloadable markdown change-proposal the user will hand to a coding agent to *become*
   a spec downstream (Loom's pipeline: research-brief → this change document → spec → tickets). Do
   **not** assign it a `SPEC-NNN` and do **not** write it in spec form. (Downstream context only: it
   would land as `specs/SPEC-028-<slug>.md` — the next free number across `specs/` + `archive/specs/`
   — but you do not claim that number.)

3. **Verdict mode = always produce, with the determination as a section.** The document is *always*
   produced. It opens with an explicit, evidence-backed **determination**: is the operator taxonomy
   as **distinct** and **comprehensive** as intended? If your honest finding is that it is already
   adequate, still produce the full document — it then records the audit evidence and **locks the
   properties** that make the taxonomy adequate, so a future change cannot silently erode them.

4. **"Comprehensive" is benchmarked against both axes — you synthesize the recommendation.** This is
   a decision delegated to you, with anchors, not a question to reopen:
   - **Internal coverage:** does every causal-pressure record type (PLAN, INTENTION, CLOCK,
     OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, EMOTION, AFFORDANCE, EVENT, SECRET, BELIEF —
     plus LOCATION/OBJECT/FACT as the operators currently use them) feed at least one **distinct**
     lens, and is any record type over- or under-served? Note that EMOTION and ENTITY STATUS
     currently ground *no* operator — assess whether that is a deliberate, defensible gap or a
     comprehensiveness hole.
   - **External coverage:** benchmark the dramatic *moves* the operators express against established
     narrative-theory taxonomies. Named anchors (extend as the research warrants): Polti's thirty-six
     dramatic situations, Propp's narrative functions, scene/sequel (Bickham/Swain), value-shift /
     "turn" theory (e.g. McKee's value charge, Robert Olen Butler), story-grammar / story-point
     models, Bremond's narrative possibilities, and dilemma/try-fail-cycle craft theory.
   You own the synthesis of how these two axes combine into a comprehensiveness verdict and any
   recommended additions; cite sources for every external claim that shapes a recommendation.

5. **"Distinct" = mutual non-overlap of the lenses.** Test operator pairs for redundancy and
   conceptual overlap (for example: `Collide Two Threads` vs `Plan Meets Friction` vs `Falsify a
   Belief`; and the meta/orthogonal nature of `Reincorporate the Dormant`, which selects by recency
   rather than expressing a dramatic move). Recommend merges, splits, or sharpened definitions where
   overlap is real, and justify each against both the internal and external benchmarks.

6. **Foundational amendments are FLAGGED, not authored.** If any recommended change collides with
   `FOUNDATIONS.md` doctrine (notably §4.7 causality-over-structure, §9.1 assistance-class source
   profile and output quarantine, §12 no plot-rail machinery, §18 causal-pressure-records intent,
   and the §29.4 prompt-compilation hard fails), state the collision explicitly, name the section,
   and describe what amendment would be required — but do **not** draft FOUNDATIONS edits in this
   document, and never design a recommendation against the constitution silently. If no
   recommendation requires a foundational amendment, say so explicitly.

7. **Enumerate the full authority-sync surface.** Any operator-taxonomy change in Loom must update
   **four** authority locations in lockstep; the change-proposal must list them so the downstream
   spec inherits a complete change-surface:
   (a) code — `packages/core/src/compiler/ideation/operators.ts` (`IDEATION_OPERATORS`);
   (b) domain doc — `docs/ideation-prompt-template.md` `## Operator Taxonomy` (and the
   `<ideation_quality>` distinctness rule if that moves);
   (c) compiler contract — `docs/compiler-contract.md` §3.2;
   (d) tests — `packages/core/test/ideation-operator-eligibility.test.ts` (operator truth-table) and
   the golden ideation prompt baseline, which regenerates when operator definitions/order change.

## 4. The task

Audit whether the Continuity Loom ideation prompt's **operator "lens" taxonomy** — the nine
deterministic operators that brainstorm premise-level ideas/questions for the current scene from
selected records — is as **distinct** (mutually non-overlapping) and **comprehensive** (covering the
space of dramatically useful, causality-first moves the system intends) as it is meant to be; then
specify the **improvements** that make it more so, aligned with `docs/**`. This is a
**determination-first task feeding a new spec**: produce an evidence-based verdict, then a
change-proposal precursor document the user can turn into a spec. Ground every recommendation in
both Loom's own record taxonomy/doctrine and external narrative-theory research, and keep the
ideation prompt firmly an *assistance* surface — never prose, branch, or plot-machinery.

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — follow the ideation code
seams, the golden prompt fixtures, and any record-type or validation behavior that bears on operator
eligibility. **Research online as deeply as needed** — narrative-theory taxonomies of dramatic
situations and story moves, academic narrative-planning / story-generation literature, and
comparable "story idea / beat suggestion" features in other tools (interactive-fiction engines,
AI writing assistants, tabletop "oracle"/move systems such as PbtA "moves") — wherever it sharpens
the distinctness/comprehensiveness verdict or a recommended operator. **Cite sources for every
external claim that shapes a decision.** The deep research is yours to run; do not defer it.

## 6. Doctrine & constraints

Honor these; a proposal that violates one is wrong, not the authority.

- `docs/FOUNDATIONS.md` is the constitution — every recommendation must satisfy it and clear its §29
  hard-fail checklist (esp. §29.4). A genuine divergence requires *flagging* a FOUNDATIONS amendment
  (per Settled Intention 6), never designing against the constitution silently.
- Authority order per `docs/ACTIVE-DOCS.md`: constitution above domain docs above implementation
  convenience. If a proposal conflicts with a higher authority, the proposal is wrong.
- The ideation prompt is the **`prose-aligned` §9.1 assistance prompt**: deterministic, inspectable
  before send, compiled only from story configuration + the selected active-working-set records +
  the generation-time fields its purpose needs. It must **never** select/rank/omit records by
  keyword, probability, model judgment, embeddings, token budget, accepted prose, candidates,
  author-private notes, or hidden UI state. Operators are assigned deterministically from selected
  records only; the compiler reads no wall-clock time and no accepted prose.
- The ideation output is **quarantined scratch** — premise-level ideas or author-facing questions,
  never prose. It is not a story record, not a generation-time brief field, not accepted prose, and
  not context for prose generation. No recommendation may erode this quarantine, propose
  auto-writing records, or feed ideation output into any prose prompt.
- Loom non-negotiable invariants (do not weaken any): records + user-authored generation-time fields
  are the continuity authority; accepted prose / rejected / superseded candidates / auto prose
  summaries are never prompt context; deterministic compilation; fail-closed validation; explicit
  user-controlled active working set (no silent inclusion); **no branches, plot rails, beat
  packages, act machinery, or autonomous plot planner**; the app never uses an LLM to mutate records
  automatically; local-first, `127.0.0.1`-only, API keys are local secrets.
- Causality over structure (§4.7, §18, §28.4): operators must produce **local causal motion** — a
  single next pressure, complication, reveal-withheld, or irreversible turn — never global plot
  shape, multi-beat outlines, or act structure. An operator that schedules the future or plans
  multiple beats is out of bounds by construction.

## 7. Deliverable specification

Produce **one downloadable markdown document**:

- **Filename (hand-off artifact, not a repo path):** `ideation-operator-taxonomy-change-proposal.md`
  — **NEW**. Do **not** assign a `SPEC-NNN`; do **not** write it in spec form. It is the precursor a
  coding agent will convert into a spec (downstream landing: `specs/SPEC-028-<slug>.md`).
- **Required shape**, in order:
  1. **Determination / verdict** — an explicit, evidence-backed answer to "is the operator taxonomy
     as distinct and comprehensive as intended?", with the distinctness analysis (operator-pair
     overlap) and the comprehensiveness analysis (internal record-type coverage table + external
     narrative-theory benchmark). Always present, even on a "largely adequate" finding.
  2. **Recommended changes** — the proposed operator additions / merges / splits / redefinitions /
     reorderings and any change to the `<ideation_quality>` distinctness rule or slot-assignment
     eligibility, each justified against the §3.4–3.5 benchmarks and aligned to the exact `docs/**`
     wording it would replace. If the verdict is "adequate," this section instead **locks** the
     properties that keep it adequate (the invariants a future change must preserve).
  3. **Authority-sync map** — the four lockstep change locations from Settled Intention 7, so the
     downstream spec inherits a complete change-surface.
  4. **Foundational-amendment flag** — per Settled Intention 6: whether any recommendation requires a
     `FOUNDATIONS.md` amendment, which section, and why — or an explicit statement that none does.
  5. **Open questions / risks** — anything the downstream spec author must still resolve.
- The document must be **self-justifying with citations** for every external narrative-theory claim,
  and must align each recommendation to the `docs/**` authority it touches.

**Locked / no-questions instruction:**

> Produce the deliverable directly as a downloadable markdown document. Do not interview, do not ask
> clarifying questions — the requirements above are final. If a genuine contradiction makes a
> requirement impossible, state it in the deliverable and proceed with the most faithful
> interpretation.

## 8. Self-check (run before returning)

- [ ] The document opens with an explicit, evidence-backed **determination** of distinctness AND
      comprehensiveness, and is produced even if the verdict is "largely adequate."
- [ ] Comprehensiveness is assessed on **both** axes — internal record-type coverage (incl. the
      EMOTION/ENTITY STATUS no-operator gap) and external narrative-theory taxonomies — with sources
      cited for external claims.
- [ ] Distinctness is tested at the **operator-pair** level, with merges/splits justified.
- [ ] Every recommendation stays inside §1 audit scope (operators + distinctness rule + slot
      eligibility); it does not redesign the output format, request shape, or section order.
- [ ] No recommendation weakens the §9.1 assistance quarantine, determinism, fail-closed validation,
      causality-over-structure, or the no-plot-machinery invariant; none trips a §29.4 hard fail.
- [ ] The **four-location authority-sync map** is present and complete.
- [ ] Any required `FOUNDATIONS.md` amendment is **flagged** (section named, reason given), not
      drafted; or it is explicitly stated that none is required.
- [ ] The deliverable is a **precursor change-proposal**, not a `SPEC-NNN` and not in spec form.
- [ ] The deliverable set matches §7 exactly (one document, the named filename).
- [ ] Every file cited in §2 exists at baseline commit `c10355e`; section anchors (e.g.
      compiler-contract §3.2, FOUNDATIONS §29.4) resolve in that commit's tree.
