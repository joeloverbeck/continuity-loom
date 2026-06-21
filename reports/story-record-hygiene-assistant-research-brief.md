# Research Brief — Story-Record Hygiene / Overlap-and-Redundancy Assistant

> **You are ChatGPT-Pro Session 2.** This brief is self-contained and final. Read the uploaded
> manifest and the files named below, explore and research as deeply as you need, then **produce
> the deliverable directly as a downloadable markdown document.** Do **not** interview or ask
> clarifying questions — the requirements here are locked.

---

## 1. Context

The uploaded manifest (`manifest_2026-06-20_ab375e9.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a local-first **story-state operating system**: a Node
process serves a React UI and a localhost-only API that tracks story records, compiles them into a
deterministic prose-generation prompt, and handles segment acceptance. It is an npm-workspaces ESM
monorepo (Node ≥ 24, strict TypeScript) with three packages: `@loom/core` (pure
continuity/compiler logic, framework- and platform-free, enforced by an ESLint import boundary),
`@loom/server` (serves the built UI + a `127.0.0.1`-only API), and `@loom/web` (React + Vite).

Governing docs: `docs/FOUNDATIONS.md` is the constitution (its **§29** is the alignment/hard-fail
checklist every proposal must clear; **§1.1** is the amendment procedure); `docs/ACTIVE-DOCS.md`
maps the active authority hierarchy and the active-vs-archive boundary. **Fetch every file from
commit `ab375e9` — the manifest reflects exactly that tree** (`git ls-tree -r HEAD`). If any file
you read cites a different "commit of record," it is that file's own baseline; ignore it and use
`ab375e9`.

**This is a fresh target, not a continuation.** One prior report touches a *superficially similar*
theme — `reports/continuity-loom-schema-audit-pass-2.md` (archived as `SPEC-025`) — but that work
deduplicated **authority at the schema/field layer** (which doc/field owns a definition). This
target is different: deduplicating **record instances** that a user has authored (two BELIEFs that
say nearly the same thing). Treat the schema-audit report only as evidence of how Loom reasons
about redundancy, not as completed work you must extend.

---

## 2. Read in full (authority order)

Read these before producing. Order follows Loom's authority hierarchy (`docs/ACTIVE-DOCS.md`).

**Primary (load-bearing for this target):**

1. `docs/ACTIVE-DOCS.md` — the authority map: which doc governs which surface, the active-vs-archive
   boundary, and the registry every new `docs/*.md` file must join in the same change.
2. `docs/FOUNDATIONS.md` — the project constitution. Load-bearing sections for this target:
   **§6** (the six project surfaces) and **§7** (active-working-set supremacy); **§9.1** (the
   *assistance prompt class* — the doctrinal home of this feature, and the likely amendment target);
   **§13–§14** and **§28.6** (atomic-record and resolved/abandoned-record philosophy — the substrate
   that makes records dedup-prone); **§26** + **§26.1** (optional LLM assistance + assistance-output
   handling rules); **§28.8** (rejected industry anti-patterns: state laundering, keyword activation,
   token-budget eviction, probabilistic inclusion); **§29** (the hard-fail checklist your proposal
   must clear); **§1.1** (how to amend the constitution if you propose to).
3. `docs/story-record-schema.md` — the record taxonomy, per-type `status` enums, and which fields are
   prompt-facing vs. validation/metadata. This defines what "overlap" *means* per record type and
   anchors the in/out scope decision in §3.
4. `docs/ideation-prompt-template.md` — **the precedent assistance prompt.** Its request shape,
   deterministic section order, slot/operator taxonomy, citation keys, and especially its **UI
   quarantine rules** ("UI Handling") are the closest existing model for what you will design.
5. `docs/compiler-contract.md` — the deterministic prompt/compiler contract: placeholder mapping,
   section order, empty-state rendering, and the assistance/ideation compile rules. A new prompt
   class (or a new deterministic detector) is a compiler-contract change.
6. `docs/validation-rule-inventory.md` — the implemented validation diagnostic-code inventory and the
   same-change drift rule. Load-bearing **only if** you recommend deterministic in-app overlap
   detection surfaced as warnings.
7. `docs/narrative-theory-blocker-roadmap.md` — the non-binding research-candidate list for future
   deterministic validation work; overlap/redundancy detection is research-grounded territory and may
   belong here.
8. `archive/specs/SPEC-021-grounded-ideation-prompt.md` and
   `archive/specs/SPEC-022-ideation-native-prompt-template.md` — how an assistance prompt was specced
   end-to-end (request shape, determinism, citation keys, native template variant). Your strongest
   structural template for a Branch-A change proposal.
9. `archive/specs/SPEC-023-author-private-story-notes.md` — the inert-scratch / quarantine precedent
   (a local surface that must never touch prompts, validation, or canon).
10. `reports/continuity-loom-schema-audit-pass-2.md` — prior *schema-layer* dedup reasoning (related
    theme, **not** a continuation; see §1).
11. `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md` — the downstream pipeline
    (research-brief → change-proposal doc → spec → tickets) and where docs/specs/tickets land.

**Boundary-awareness (read to bound scope, *not* a conformance target):**

- `README.md`, `docs/user-guide.md` — product framing and the user-facing local loop; locate where
  the *post-acceptance record-review* step the user performs by hand fits today.
- `docs/prompt-template.md`, `docs/prompt-template-rationale.md` — the universal **prose** prompt and
  its rationale: read to know what your feature is **not** (this is not a prose prompt).
- `docs/stress-suite.md`, `docs/stress-coverage-matrix.md` — regression-coverage surfaces, relevant
  only if you propose deterministic detection that needs stress cases.

### Inspect, not read in full (code seams)

Inspect these for current behavior; do not transcribe them.

- **Assistance-prompt compiler (the precedent):** `packages/core/src/compiler/compile-prompt.ts`
  (`compilePrompt` / `renderPrompt`, branches on `promptKind`);
  `packages/core/src/compiler/ideation/operators.ts`, `…/slot-assignment.ts`, `…/citation-keys.ts`;
  `packages/core/src/compiler/template-constants.ts` (ideation section order/templates).
- **Records data layer:** `packages/core/src/records/registry.ts` (type registry +
  `projectRecordStatus`), `packages/core/src/records/metadata.ts` (per-record `status` field);
  `packages/server/src/record-repository.ts` (`listRecords({ type, includeArchived })`),
  `packages/server/src/record-routes.ts` (`GET /api/records` **already supports `?status=`,
  `?type=`, `?includeArchived=`** filtering), `packages/server/src/snapshot-builder.ts`.
- **Server wiring precedent:** `packages/server/src/ideate-routes.ts` (`POST /api/ideate`: compile →
  validate → optional OpenRouter send → quarantined parse), `packages/server/src/compile-routes.ts`.
- **Web menu + view precedent:** `packages/web/src/shell/AppShell.tsx` (`primaryRoutes` is "the
  menu"; add a page by adding a route entry + a `<Route>`); `packages/web/src/ideate/IdeateView.tsx`
  and `packages/web/src/ideate/keepers.ts` (inspect-before-send, quarantined output, session-scoped
  keepers).
- **Purity & versioning:** `packages/core/src/version.ts` (template/compiler/contract versions —
  template `1.1.0`, compiler `1.3.0`, contract `1.4.0`); `eslint.config.js` (core import-boundary
  rule: no `fastify`/`react`/`vite`/`node:*` in `@loom/core`).

---

## 3. Settled intentions (locked — do not reopen)

These were resolved with the repo owner before this brief was written. Treat each as a decision you
**execute**, not a question you reopen.

1. **The problem.** Story records proliferate and drift: a user authoring atomic records across many
   generations accumulates **near-duplicate or overlapping records** — e.g. one BELIEF that "his
   artistic career may be over," then a second BELIEF rewording it with slightly more context, then
   overlapping EMOTIONs with near-identical context. Today the user catches these by hand by reading
   every record after each accepted segment. The goal is to help the user decide which records to
   **reword, make more specific, merge, deactivate, or remove as redundant** — faster and more
   reliably than manual review.

2. **Mechanism is delegated to you (Session 2) to research and recommend** — with the **§9.1
   external-LLM assistance prompt** (records-only, copy-out, inspect-before-send, quarantined output,
   manually applied) as the **named baseline anchor.** You may instead, or additionally, recommend a
   deterministic **in-app overlap detector** (e.g. local similarity/near-duplicate clustering surfaced
   as non-blocking warnings or a review view). Bounding constraints on *any* recommended mechanism:
   it must obey **§4.4** (deterministic compilation — no LLM intermediary inside compilation),
   **§26/§26.1** (no automatic record mutation; opt-in, pull-based, quarantined, provenance-bearing
   output), and the **§28.8** anti-pattern bans (no state laundering, no probabilistic inclusion).
   If you recommend a local-similarity mechanism, address whether it can run inside `@loom/core`
   without violating its purity boundary, or whether it belongs in `@loom/server`.

3. **Record scope = atomic record types only.** In scope: FACT, EVENT, BELIEF, SECRET, EMOTION,
   RELATIONSHIP, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, LOCATION, OBJECT,
   VISIBLE AFFORDANCE, ENTITY STATUS. **Excluded: CAST MEMBER dossiers and ENTITY base records** —
   the owner never edits the large dossiers for this purpose. You may, with justification against the
   schema, recommend a narrower default within the in-scope set (e.g. the types most prone to overlap),
   but do not silently re-include CAST MEMBER or ENTITY.

4. **Source = the whole project, records-only.** The surface operates over **all in-scope records in
   the project at active status** — *not* the active working set, and with **no generation-time brief
   content** of any kind. "Active status" is anchored to Loom's existing model: per-record `status`
   (per-type enums in the schema) plus the repository archive flag (`includeArchived`); refine the
   exact "active" predicate per record type, and state it explicitly. This whole-project source is the
   deliberate divergence from the existing assistance prompt, which is scoped to the active working set
   + generation fields.

5. **Constitutional appetite: amendment is permitted where warranted.** §9.1 currently defines an
   assistance prompt as "compiled from the same authority sources as the prose prompt (story
   configuration, active working set, generation-time fields)." A whole-project-sourced,
   brief-excluded hygiene prompt does not fit that wording. You **may** propose amending
   **FOUNDATIONS §9.1** (and updating `docs/ACTIVE-DOCS.md`, and any other doc the amendment
   cascades into) to admit this new assistance purpose — with **exact proposed wording**, following
   the §1.1 amendment procedure, and re-clearing §29. Prefer the *smallest* doctrine change that
   makes the feature legal; do not weaken any non-negotiable invariant (§4) to do it.

6. **A new web page, menu-accessible.** The feature is surfaced as a new page reachable from the app
   menu (`primaryRoutes` in `AppShell.tsx`), modeled on the **Ideate** view's shape:
   inspect-before-send (or inspect-the-detector-output), clearly-labeled non-canonical output,
   session-scoped keepers/scratch, copy-to-clipboard, **no automatic record writes, no insertion into
   any record or the generation brief.** If the mechanism is the assistance prompt, an optional
   send-through-OpenRouter path may mirror `POST /api/ideate`; if the user instead pastes into an
   external Pro model, copy-out is sufficient — specify which.

7. **Output is advisory only.** Whatever the mechanism, every output is a **suggestion** — overlap
   findings, merge/reword/specify/deactivate/remove recommendations with provenance (which records,
   why). The user manually edits records. Nothing the tool emits mutates a record, enters a prompt, or
   enters the active working set automatically (§26.1, §29.2). Rejected/cleared output leaves no
   project-store residue.

8. **The hard design problem to solve (the crux).** Define **what makes two records "overlapping"
   and what action each overlap warrants** — the decision criteria that separate "reword for
   precision," "make more specific," "merge into one," "deactivate (no longer relevant)," and "remove
   as clearly redundant." This must be type-aware (overlap between two BELIEFs differs from overlap
   between two EMOTIONs or two OPEN THREADs) and must respect that *similar-looking records can be
   legitimately distinct* (e.g. the same claim held by two different `holder`s, or an active vs. a
   resolved pressure record that still matters per §14). This is the part you are most expected to
   ground in external research.

---

## 4. The task

Produce a **determination-first new-spec precursor.** Decide, on the evidence, whether Continuity
Loom should add a dedicated story-record **hygiene / overlap-and-redundancy** capability and, if so,
*which mechanism* and *how it must behave* — then deliver a single markdown document whose shape
follows that verdict (see §7). The document must be implementable: precise enough that a Loom coding
agent can turn a positive verdict into a numbered spec and then tickets without re-researching the
problem, and honest enough that a negative verdict tells the owner exactly what cheaper practice to
adopt instead. The hardest content is the **type-aware overlap/redundancy decision criteria** of
§3.8; treat that as the spec's center of gravity.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed above. Research online as deeply
as needed — similar implementations, research papers, and prior art — wherever it sharpens the
deliverable. Cite sources for any external claim that shapes a decision. Productive directions
(non-exhaustive):

- **Entity resolution / record deduplication / near-duplicate detection** — blocking, similarity
  thresholds, merge vs. link vs. keep-distinct decisions, precision/recall trade-offs in human-in-the-
  loop dedup.
- **Knowledge-base / ontology normalization and TBox/ABox hygiene** — how curated stores manage
  redundant assertions without losing legitimately distinct ones.
- **Narrative theory / story-bible and worldbuilding-tool practice** — how comparable tools (the
  named ones in FOUNDATIONS §30: Novelcrafter, Sudowrite, World Anvil, Campfire, SillyTavern World
  Info, NovelAI Lorebook, etc.) handle lore/entry proliferation and duplication, and where they fall
  into the §28.8 anti-patterns Loom rejects.
- **LLM-assisted-but-not-authoritative review patterns** — how to prompt an external model to *flag
  and recommend* without authoring canon, and how to keep its output deterministic and inspectable.
- **Local-first similarity** — whether embeddings/lexical similarity can run locally without a network
  call, and the determinism implications.

---

## 6. Doctrine & constraints (honor these; a violation invalidates the deliverable)

- `docs/FOUNDATIONS.md` is the constitution. Every product-behavior decision must satisfy it and clear
  its **§29** hard-fail checklist. A genuine divergence requires amending FOUNDATIONS **first**
  (per §1.1, with exact wording), never designing against it silently. State explicitly which §29
  questions your proposal must answer "no" to, and confirm it does.
- Authority order per `docs/ACTIVE-DOCS.md`: if a proposal conflicts with a higher authority
  (constitution > domain doc > implementation convenience), the proposal is wrong, not the authority.
  Any new `docs/*.md` must be added to the ACTIVE-DOCS registry in the same change; any prompt
  placeholder or compiler behavior must land in `docs/compiler-contract.md` in the same change.
- No backwards-compatibility shims, aliases, or duplicate authority paths in new work unless you
  explicitly justify them.
- **Loom non-negotiable invariants — do not weaken any:**
  - Records and user-authored generation-time fields are the continuity authority.
  - Accepted prose, rejected candidates, superseded candidates, and automatic prose-derived summaries
    are **not** prompt context (this feature must not introduce any of them as a source).
  - Deterministic compilation: no LLM intermediary selects, ranks, summarizes, repairs, or rewrites
    records during compilation.
  - Validation fails closed; warnings never become prompt instructions and never gate draft saving.
  - The active working set is explicit and user-controlled — no silent inclusion of "relevant" records.
  - No branches, plot rails, beat packages, act machinery, or autonomous plot planner.
  - **The app never uses an LLM to mutate records automatically** (§26, §29.2) — this is the single
    most load-bearing constraint for this feature.
  - API keys are global local secrets; keys, full prompts, candidates, accepted prose, and full record
    payloads are not logged by default.
  - Project data stays local and user-owned; network traffic is limited to prompts the user
    intentionally sends through OpenRouter, and every server binds `127.0.0.1` only.
- Author-private notes (§6.6 / §29.12) must remain entirely out of this surface: never a source,
  never an output target.

---

## 7. Deliverable specification

Produce **exactly one** downloadable markdown document, **always** — its *form follows your verdict*
(this is "mode iii: always produce, form follows verdict"). Filename in **both** branches:

> **`story-record-hygiene-assistant-change-proposal.md`**

This is a **hand-off artifact filename, not a repo path.** Do **not** assign it a `SPEC-NNN` number
and do **not** author it in numbered-spec form — it is the spec *precursor* in Loom's pipeline
(research-brief → change-proposal doc → spec → tickets). As downstream context only, you may note
that it would land as **`specs/SPEC-027-<slug>.md`** when a coding agent converts it (next number
past `specs/SPEC-026` and `archive/specs/SPEC-025`); do not claim that number yourself.
`assumption:` the slug is the coding agent's to finalize.

The document **must open with a clearly labeled, evidence-based VERDICT**: is a dedicated record-
hygiene mechanism warranted, and if so which one (assistance prompt, deterministic detector, or a
combination)? Then:

**Branch A — verdict is positive (a mechanism is warranted).**
The body is a **change-proposal document aligned with `docs/**`** that a coding agent can turn into
a spec. It must specify, at minimum:

- the chosen mechanism and why it beat the alternatives you researched;
- the record source + scope rules (§3.3, §3.4) and the explicit per-type "active" predicate;
- **the type-aware overlap/redundancy decision criteria and action taxonomy (§3.8)** — the core:
  what counts as overlap per record type, and what separates reword / make-specific / merge /
  deactivate / remove, including the guards that protect legitimately-distinct records;
- if assistance-prompt: the new prompt class — request shape, deterministic section order, what
  records render and how, citation/identification keys, output format, and the quarantine/UI rules
  (modeled on the ideation precedent and §26.1); whether it is copy-out only or also sends via a new
  server route mirroring `POST /api/ideate`;
- if deterministic detector: the algorithm, where it runs (core purity implications), and how findings
  surface (warning surface vs. dedicated review view) without becoming blockers;
- the new web page and its menu entry, modeled on the Ideate view's quarantine shape;
- **every required doc amendment with exact proposed wording** — FOUNDATIONS §9.1 (and the §29
  checklist if the amendment changes what proposals must clear), `docs/ACTIVE-DOCS.md` registry,
  `docs/compiler-contract.md`, `docs/story-record-schema.md`, and any others the change cascades into;
- the §29 hard-fail self-audit (which questions, answered "no," and why);
- a suggested implementation/ticket decomposition outline (not full tickets).

**Branch B — verdict is negative (no dedicated mechanism warranted).**
The body is a **standalone rationale report** (same filename) that is evidence-complete: it explains
*why* a dedicated mechanism is not warranted (citing the research and the doctrine that argue against
it), and recommends the **lighter alternative** the owner should adopt instead — e.g. a manual
post-acceptance review checklist, a small non-blocking warning, or a documentation note — with enough
specificity to act on. A negative verdict must still engage §3.8: explain how the owner should reason
about overlap manually.

Include this instruction verbatim in the document's framing:

> Produce the deliverable directly as a downloadable markdown document. Do not interview, do not ask
> clarifying questions — the requirements above are final. If a genuine contradiction makes a
> requirement impossible, state it in the deliverable and proceed with the most faithful
> interpretation.

---

## 8. Self-check (run before returning)

- [ ] The document opens with an explicit, evidence-based **verdict**, and its form matches the
      verdict (Branch A change-proposal vs. Branch B rationale report), under the single filename
      `story-record-hygiene-assistant-change-proposal.md`.
- [ ] It is **not** authored as a numbered `SPEC-NNN`; SPEC-027 is named only as downstream landing
      context.
- [ ] The **type-aware overlap/redundancy decision criteria (§3.8)** are the center of gravity, with
      explicit guards for legitimately-distinct records.
- [ ] Record scope excludes CAST MEMBER and ENTITY; source is whole-project active records, with no
      generation-brief content and not the active working set.
- [ ] No proposed behavior lets an LLM mutate records, lets assistance output enter a prompt / record
      / generation-time field automatically, introduces accepted prose as a source, makes compilation
      nondeterministic, or trips any other §29 hard fail — and the document states the §29 self-audit.
- [ ] Any proposed FOUNDATIONS/doc amendment shows **exact wording**, follows §1.1, updates the
      §29 checklist if it changes what proposals must clear, and adds any new `docs/*.md` to the
      ACTIVE-DOCS registry; it is the smallest doctrine change that makes the feature legal.
- [ ] Every external claim that shapes a decision is **cited**.
- [ ] Every section/anchor cited *into* a Loom doc (e.g. "FOUNDATIONS §9.1", "§29.2") was verified
      against the fetched file at commit `ab375e9`, not assumed.
