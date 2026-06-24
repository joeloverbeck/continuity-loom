# Research Brief — Segment Reconciliation Assistance Surface

> **For ChatGPT-Pro (deep-research Session 2).** This brief is self-contained. You have the
> uploaded manifest and this prompt — nothing else from the authoring session. Read the files
> named in §2 in full, explore and research as deeply as §5 authorizes, then produce the
> deliverable in §7 directly. **Do not interview or ask clarifying questions** — the
> requirements here are final.

---

## 1. Context

The uploaded manifest (`manifest_2026-06-24_c04bcf9.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a **local-first story-state operating system**: a Node
process serves a React UI and a localhost-only API that tracks story records, compiles them
into a deterministic prose-generation prompt, and handles segment acceptance. It is an
npm-workspaces ESM monorepo (Node ≥ 24, strict TypeScript) with three packages: `@loom/core`
(pure continuity/compiler logic, framework- and platform-free), `@loom/server`, `@loom/web`.
Governing docs: `docs/FOUNDATIONS.md` is the constitution (its §29 is the alignment/hard-fail
checklist); `docs/ACTIVE-DOCS.md` maps the active authority hierarchy. **Fetch every file from
commit `c04bcf9` (`c04bcf9afe4881c5940574a6ab9fa31633d5c0bd`)** — the manifest reflects that
exact tree. No referenced report cites a divergent "commit of record"; if you encounter one,
prefer `c04bcf9`.

**This is a new surface, not a continuation of a prior brief.** It is the **third** LLM-assistance
surface in a family of two already-shipped siblings, and it must be modeled on them:

- **Grounded ideation** (`prose-aligned` source profile) — shipped via
  `archive/specs/SPEC-021-grounded-ideation-prompt.md` and
  `archive/specs/SPEC-022-ideation-native-prompt-template.md`; documented in
  `docs/ideation-prompt-template.md`. Closest **structural** model (request shape, section
  order, citation keys, output contract, UI quarantine).
- **Record hygiene** (`project-review` source profile, with a working-set/whole-project dual
  scope) — shipped via `archive/specs/SPEC-027-record-hygiene-assistance-prompt.md` and
  `archive/specs/SPEC-030-record-hygiene-working-set-scope.md`; documented in
  `docs/story-record-hygiene-prompt-template.md`. Model for **dual scope, action/relation
  taxonomy, output contract, UI quarantine, and same-change synchronization rules**.

It also **upgrades, without replacing,** the existing post-acceptance **durable-change reminder**
(`archive/specs/SPEC-012-durable-change-reminder-workflow.md`), which today only nags the user
to update records manually.

**Predecessor caveat (shared vocabulary, distinct scope).** Record hygiene also proposes record
`DEACTIVATE`/`REMOVE`/`MERGE` actions — but it is a *records-only project-review* surface that is
constitutionally **forbidden from reading accepted prose, generation-time fields, or candidates**.
This new surface is different in kind: it is driven *by the latest accepted segment* and also
proposes generation-brief-field updates and new-record creation. Do not treat hygiene's scope as
this feature's scope, and do not assume hygiene's source rules already permit what this surface
needs — they explicitly do not (see §2 and §3).

**Deliverable-format precedent.** This brief is the first stage of Loom's canonical pipeline
(research-brief → ChatGPT-Pro change-proposal → spec → tickets). `reports/ideation-operator-taxonomy-change-proposal.md`
and `reports/private-notes-usability-change-proposal.md` are the format models for the
change-proposal you will produce.

---

## 2. Read in full (authority order)

Read these completely before producing. Order follows Loom's authority hierarchy
(`docs/ACTIVE-DOCS.md`).

**Primary (load-bearing — conformance targets):**

```
docs/ACTIVE-DOCS.md
  — the authority map: which doc governs which surface, the active-vs-archive boundary, and the
    rule that any new docs/ file must be registered here in the same change.
docs/FOUNDATIONS.md
  — the constitution. Load-bearing sections for this target: §9.1 (assistance prompt class — the
    TWO existing source profiles and why neither reads accepted prose), §10 + §28.1–§28.2 (no
    accepted prose in prompts; no archive dumping), §26 + §26.1 (sanctioned LLM assistance and
    the shared assistance-output quarantine rules), §20–§21 (durable change + post-acceptance
    reminder), §29 (the hard-fail checklist this proposal must clear AND amend). §1.1 is the
    amendment procedure you must follow when authoring the amendment block.
docs/compiler-contract.md
  — deterministic placeholder mapping, section order, empty-state rules, assistance source-profile
    registration, and the version/same-change drift rules. The new source profile and prompt must
    be registered here; the amendment cascade lands here.
docs/ideation-prompt-template.md
  — the `prose-aligned` assistance sibling and your closest structural template: request shape,
    deterministic section order, citation-key scheme, output contract, and UI quarantine list.
docs/story-record-hygiene-prompt-template.md
  — the `project-review` assistance sibling: dual user-selected scope, source contract, relation
    + action taxonomy, hard distinction guards, output contract, UI quarantine, and the
    same-change synchronization rule across template/schema/contract/golden tests.
docs/story-record-schema.md
  — the record-type catalog with every enum vocabulary (the creation surface's source of truth),
    plus the generation-time brief field shapes (CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF,
    MANUAL MOMENT DIRECTIVE, STOP GUIDANCE, voice pressure/overrides) used by the §3 in/out-of-scope
    split, and the §3.3 rule that handoff fields must never contain verbatim accepted prose.
docs/validation-rule-inventory.md
  — implemented diagnostic inventory + same-change drift rule; confirms this surface adds no
    readiness blockers and must honor §29.5 (a diagnostic assistance prompt must not block on the
    condition it exists to inspect).
docs/user-guide.md
  — the user-facing local loop and the exact manual post-segment workflow this surface automates.
```

**Predecessors (read to reuse the pattern and avoid re-commissioning shipped work):**

```
archive/specs/SPEC-012-durable-change-reminder-workflow.md   — the reminder this upgrades (not replaces).
archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md — how the latest accepted segment is exposed.
archive/specs/SPEC-021-grounded-ideation-prompt.md           — prose-aligned assistance precedent.
archive/specs/SPEC-022-ideation-native-prompt-template.md    — ideation-native template precedent.
archive/specs/SPEC-027-record-hygiene-assistance-prompt.md   — project-review assistance precedent.
archive/specs/SPEC-030-record-hygiene-working-set-scope.md   — dual user-selected scope precedent.
reports/ideation-operator-taxonomy-change-proposal.md        — change-proposal deliverable FORMAT model.
reports/ideation-operator-taxonomy-research-brief.md         — the brief→change-proposal pipeline model.
reports/private-notes-usability-change-proposal.md           — second change-proposal format model.
```

**Boundary-awareness (read to bound scope — NOT conformance targets; do not audit or "correct" them):**

```
docs/prompt-template.md, docs/prompt-template-rationale.md
  — the UNIVERSAL PROSE prompt + its rationale. Read only to confirm the new surface is an
    ASSISTANCE prompt, NOT a prose prompt, and to reuse shared-section framing the way ideation
    does. Do not extend the prose template.
docs/stress-suite.md, docs/stress-coverage-matrix.md
  — the regression/golden coverage model, to say where new coverage lands. Not a behavior spec for this surface.
docs/archival-workflow.md, tickets/README.md, tickets/_TEMPLATE.md
  — the downstream spec→ticket pipeline your change-proposal feeds. Read to shape the hand-off, not to author tickets.
```

### Inspect, not read in full (code seams)

Inspect these to ground feasibility and name concrete integration points; you need not read them
whole.

- **`@loom/core`**: `packages/core/src/compiler/ideation/*` (request types, slot assignment,
  citation keys), `packages/core/src/compiler/hygiene/*` (snapshot types, record renderer,
  template, active predicate, citation keys), `packages/core/src/records/registry.ts` (record-type
  registry, enums, `parseRecordPayload`, `projectRecordStatus`),
  `packages/core/src/records/generation-brief.ts` + `generation-brief-draft.ts` +
  `generation-brief-readiness.ts` (brief field schemas + draft/ready shapes),
  `packages/core/src/version.ts` (`versionInfo`: `templates.version`, `compiler.version`,
  `contract.version`, `app.version`), `packages/core/src/compiler/template-constants.ts`
  (`SECTION_ORDER`, `IDEATION_SECTION_ORDER`).
- **`@loom/server`**: `ideate-routes.ts`, `record-hygiene-routes.ts`,
  `record-hygiene-snapshot-builder.ts`, `snapshot-builder.ts`, `accepted-routes.ts`,
  `generation-brief-routes.ts`, `reminder-routes.ts` (note `getLatestAcceptedSegment`,
  `getReminderAcknowledgedSequence`).
- **`@loom/web`**: `ideate/IdeateView.tsx`, `record-hygiene/RecordHygieneView.tsx`,
  `accepted-segments/AcceptedSegmentsView.tsx`, `generation-brief/GenerationBriefView.tsx`,
  `shell/DurableChangeReminder.tsx`, `shell/AppShell.tsx` (nav `primaryRoutes`), `api.ts`.
- **Tests**: `packages/core/test/compiler-ideation-golden.test.ts`,
  `packages/core/test/record-hygiene-golden.test.ts`, and server route/e2e tests for ideate and
  record hygiene — the golden-test pattern any new surface must follow.

---

## 3. Settled intentions (locked — do not reopen)

These decisions were resolved with the repo owner. Treat them as fixed requirements.

1. **What the surface is.** A new, third LLM-assistance surface — working title **"Segment
   Reconciliation"** (`assumption: final name is the spec's to finalize`) — exposed as a **new
   sibling top-level nav section**, peer to Ideate and Record Hygiene. It generates a
   deterministic, inspectable, **opt-in pull-based** assistance prompt whose job is to contrast
   the **latest accepted segment** against the current generation-brief fields and story records,
   and to return **quarantined advisory output** in three parts: (a) which generation-brief fields
   to update or fill, (b) which existing records to change or deactivate, (c) which new records to
   create.

2. **Constitutional status — a FOUNDATIONS amendment is required, and you must author its exact
   wording.** The feature is sanctioned in spirit by §26 ("extracting candidate events from
   user-selected prose for review"; "proposing handoff text"; "drafting record suggestions"). But
   §9.1 currently defines exactly **two** assistance source profiles — `prose-aligned` and
   `project-review` — and **neither may read accepted prose**, while §10/§28.1 state accepted prose
   is not prompt context and §28.2 forbids archive dumping. Therefore the surface cannot ship
   without a constitutional amendment. The deliverable **must include a clearly labeled FOUNDATIONS
   amendment block with the precise proposed wording**, following the §1.1 amendment procedure:
   - a **new third assistance source profile** in §9.1 (a name is yours to propose, e.g.
     `segment-reconciliation`) whose declared source is **exactly one user-selected accepted
     segment — the latest by default — plus prose-aligned sources**, with the single-segment limit,
     determinism, inspectability, and output-quarantine constraints stated;
   - the reconciliation of §10/§28.1/§28.2 (carve the narrow, inspectable, single-segment
     assistance-read as an explicit exception to "no accepted prose in prompts," while preserving
     the hard rule that accepted prose never enters a **prose** prompt or any **stored** field);
   - the matching **§29.4 hard-fail additions** (and any other §29 subsections the change touches),
     so the checklist still rejects misuse (e.g. accepted prose entering a prose prompt, multi-segment
     dumping, auto-write of output);
   - the **cascade** edits required in the same change: register the new profile/prompt in
     `docs/compiler-contract.md`, and add the projection + field-scope rules to
     `docs/story-record-schema.md`. Show proposed wording for these too.

   Present the amendment as a proposal for the owner's sign-off (per §1.1 step 2), not as an
   accomplished edit.

3. **Prose source = the latest accepted segment ONLY.** Exactly one segment — the latest by
   default — is read. Never the whole archive, never a multi-segment range (that would violate
   §28.2 and the lost-in-the-middle doctrine of §28.2/§9). The accepted-segment access path already
   exists (SPEC-020 / `reminder-routes.ts` `getLatestAcceptedSegment`).

4. **Record contrast scope — delegated to you, bounded.** You will **research and recommend** the
   scope model for deciding which records need changing/deactivating, bounded strictly to §9.1's
   rule that every scope must be **explicit, user-selected, deterministic, and disclosed** (named
   in the compiled prompt and surfaced in the inspection UI). The owner's stated manual baseline is
   the **active working set**; a disclosed **whole-project** option (mirroring record hygiene's
   dual scope) is permitted and worth evaluating, since a durable change can affect a record the
   user did not select for the last segment. Commit to a recommendation; do not leave it open.

5. **Generation-brief fields the LLM may propose.**
   - **In scope (reconcile backward from the accepted segment):** all of **CURRENT AUTHORITATIVE
     STATE** (`current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`,
     `offstage_pressuring_entities`, `positions`, `possessions`, `visible_conditions`,
     `environmental_conditions`, `entity_statuses`, `line_of_sight_and_visibility`,
     `pov_cannot_perceive_now`, `routes_and_exits`, `available_time`, `consent_or_force_conditions`,
     `current_locks`) and **IMMEDIATE HANDOFF** (`recent_causal_context`, `last_visible_moment`,
     `begin_after`).
   - **Out of scope (forward-looking next-segment authoring — the LLM must NOT propose these):**
     **MANUAL MOMENT DIRECTIVE** (`must_render`, `may_render_if_naturally_caused`, `do_not_force`)
     and **STOP GUIDANCE** (`soft_unit_guidance`) — this exclusion is the owner's explicit
     instruction. Also excluded (`assumption`, owner did not name them but they are forward-looking
     next-segment instructions): **CURRENT CAST VOICE PRESSURE**, **CAST VOICE OVERRIDES**, **ACTIVE
     WORKING SET** curation (`selected_records`, cast bands, `selected_pov`), **GENERATION VALIDATION
     FOCUS** tags, and the auto-normalized `generation_context`. Durable story config (**STORY
     CONTRACT**, **UNIVERSAL CONTENT POLICY**, **PROSE MODE**) is also out of scope (`assumption`):
     it is global story identity, not per-segment brief reconciliation.
   - The amendment/proposal may refine the `assumption`-labeled boundary if your research finds a
     better-justified line, but the explicitly-named forward-looking exclusions are fixed.

6. **Record-creation output contract — delegated to you, with locked hard requirements.** The
   owner's sharpest pain is that **record creation is troublesome** (17 record types, each with many
   constrained enum vocabularies — see `docs/story-record-schema.md`). Research how comparable
   systems do **schema-guided / structured extraction** and propose a concrete output contract.
   These requirements are **non-negotiable** regardless of the contract you choose:
   - every creation proposal names a **valid record type** from the schema taxonomy;
   - every enum-valued field uses **only real enum values** drawn from `docs/story-record-schema.md`
     (the contract must make the enum vocabularies available to the model so proposals are
     well-formed);
   - every proposal (field update, record change, deactivation, creation) carries **provenance** —
     which span of the accepted segment justifies it — per §26 and §26.1;
   - a deactivation proposal names a lifecycle destination that exists for that record type;
   - output is **advisory only**: structured for fast human transcription, but **never auto-written**
     (see §6).

7. **Reminder integration.** The existing durable-change reminder (SPEC-012) is **upgraded, not
   replaced**: it gains a call-to-action that links into this new section. The new section does not
   remove the reminder's acknowledge workflow.

8. **Anti-contamination posture (carried from doctrine, non-negotiable — see §6).** Reading the
   accepted segment to *propose* IMMEDIATE HANDOFF / brief text must never produce **verbatim**
   accepted prose; proposals are paraphrased advisory text the user re-authors. Output is
   quarantined ephemeral scratch and never becomes prompt context for prose generation, a stored
   record, a generation-time field, or working-set membership without explicit per-item human
   action.

---

## 4. The task

Produce a **change-proposal precursor document** (new-spec target; secondary
foundational/doc-overhaul) that fully specifies a new **Segment Reconciliation** LLM-assistance
surface for Continuity Loom, modeled on the two shipped assistance surfaces and upgrading the
durable-change reminder. The document must specify the surface end-to-end — source profile,
request shape, deterministic section order, the recommended record-contrast scope model, and the
three-part advisory output contract (brief-field updates, record changes/deactivations, and
schema-and-enum-valid record creations) — and must include the **exact proposed FOUNDATIONS
amendment wording plus its compiler-contract/schema cascade** that makes the surface
constitutional. Ground every design choice in repo doctrine and in external prior art on
schema-guided extraction and LLM-assisted state/memory updating.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — follow the code seams,
read sibling specs, and confirm how the existing assistance surfaces are wired end-to-end before
designing.

Research online as deeply as needed — similar implementations, research papers, and prior art —
wherever it sharpens the deliverable. Especially valuable here:

- **schema-guided / constrained structured extraction** from narrative text into typed records
  with controlled enum vocabularies (function-calling / JSON-schema-constrained generation,
  grammar-constrained decoding, taxonomy-guided extraction);
- **LLM-assisted state / memory updating** in agent and interactive-fiction systems (how durable
  "world state" or "memory" deltas are proposed from new events and reviewed before commit);
- how comparable creative-writing / worldbuilding tools (e.g. those named in `docs/FOUNDATIONS.md`
  §30) handle "update your story bible after a scene" — and how they fail (state laundering,
  prose-as-canon drift), which Loom explicitly rejects.

Cite sources for any external claim that shapes a decision.

---

## 6. Doctrine & constraints

Honor these; a proposal that conflicts with a higher authority is wrong, not the authority.

- **`docs/FOUNDATIONS.md` is the constitution.** Every product-behavior decision must satisfy it
  and clear its §29 hard-fail checklist. The one sanctioned divergence here — reading the latest
  accepted segment into an assistance prompt — must be handled by the **amendment in §3.2**
  (amend first, per §1.1; never design against the constitution silently).
- **Authority order** per `docs/ACTIVE-DOCS.md`: constitution above domain docs above
  implementation convenience.
- **No backwards-compatibility shims, aliases, or duplicate authority paths** in new work unless
  explicitly justified.
- **Loom non-negotiable invariants engaged by this surface (do not weaken any):**
  - The app **never uses an LLM to mutate records automatically** (§4.1). Output is **suggestions,
    not mutations**; the user reviews and accepts each item (§26, §26.1).
  - Accepted prose, rejected/superseded candidates, and automatic prose-derived summaries are
    **never prose-prompt context and never stored continuity** (§10, §28.1). The new source profile
    reads the latest accepted segment **only** for this advisory assistance prompt — it must not
    leak accepted prose into any **prose** prompt, any stored record, or any generation-time field,
    and proposed handoff/brief text must **never be verbatim** accepted prose (§3.3).
  - **Deterministic compilation** (§4.4, §8): identical declared sources + request inputs + versions
    produce an identical prompt; no LLM intermediary selects, ranks, summarizes, or repairs sources
    during compilation; no wall-clock or hidden-UI-state reads.
  - **Assistance source/scope selection** is never keyword-triggered, probabilistic, model-selected,
    token-budget-evicted, or inferred from hidden state (§9.1, §29.4). Every scope is explicit,
    user-selected, disclosed, and renders every qualifying record within it.
  - **Quarantine + provenance + ephemerality** (§26.1): output rendered in a clearly labeled
    non-canonical surface; provenance mandatory; clearing leaves no project-store residue; nothing
    logged/archived by default; never auto-inserted into a record, brief field, working set, or
    prose prompt.
  - **Validation posture** (§11, §29.5): this diagnostic assistance prompt must not be blocked
    merely because it detects the change it exists to surface; it adds no readiness blockers to the
    prose pipeline; structurally malformed source data or unsafe provider config may block the
    affected operation only.
  - **Author-private notes** (§6.6, §29.12) are never a source for this surface.
  - **Same-change synchronization** (§8 / schema §10 / compiler-contract): adding the new prompt,
    placeholders, source predicate, section order, or output parser requires updating the relevant
    domain doc(s), `docs/compiler-contract.md`, the template/compiler/contract versions in
    `packages/core/src/version.ts`, and golden tests in the same change. The change-proposal must
    enumerate this cascade.
  - **No branches / no plot-rail machinery / local-prose-only** (§12, §4.6): the surface reconciles
    state from one past segment; it must not plan future structure or request prose.
  - **API-key secrecy, localhost-only binding, local-first ownership** (§23, §24) remain intact.

---

## 7. Deliverable specification

Produce **one downloadable Markdown document**:

- **Filename (hand-off artifact, NOT a repo path, NOT a `SPEC-NNN`):**
  `segment-reconciliation-assistance-change-proposal.md`.
- **Form:** a change-proposal precursor in the style of
  `reports/ideation-operator-taxonomy-change-proposal.md` — a document the repo owner hands to a
  coding agent to *become* a spec. **Do not assign a spec number and do not author it in spec
  form.** For downstream context only, you may note that it will land as **SPEC-032** (the next
  number after the highest existing `SPEC-031` across `specs/` and `archive/specs/`) — but do not
  claim that number or write a `SPEC-032` file.

The document must contain, at minimum:

1. **Problem & intent** — the manual post-segment workflow being automated (read it in
   `docs/user-guide.md`), and the surface's place beside Ideate / Record Hygiene and above the
   durable-change reminder.
2. **The new assistance source profile** — its name, declared sources (latest accepted segment +
   the in-scope generation-brief fields + the contrast record set), and how it satisfies §9.1's
   determinism/inspectability/quarantine rules. Include the **recommended record-contrast scope
   model** (§3.4) with justification.
3. **Request shape & deterministic section order** for the compiled prompt (model on
   `docs/ideation-prompt-template.md` and `docs/story-record-hygiene-prompt-template.md`).
4. **Output contract** for all three advisory parts: (a) brief-field update/fill proposals over the
   §3.5 in-scope fields with provenance; (b) record change/deactivation proposals with a valid
   lifecycle destination + provenance; (c) **record-creation proposals** meeting every §3.6 hard
   requirement (valid type, real enum values, provenance, advisory-only). Define a parseable,
   malformed-output-quarantined format.
5. **UI & quarantine** — the new nav section's controls, mirroring the Ideate/Hygiene quarantine
   lists (pull-based; prompt inspect before send; no auto-write / no insertion into brief, records,
   or working set; session-scoped keepers; clear leaves no residue), plus the reminder CTA
   integration (§3.7).
6. **The FOUNDATIONS amendment block** — clearly labeled, with **exact proposed wording** for the
   new §9.1 source profile, the §10/§28 reconciliation, and the §29.4 (and any other) hard-fail
   additions, following the §1.1 amendment procedure and presented for owner sign-off.
7. **The cascade** — exact proposed additions to `docs/compiler-contract.md` and
   `docs/story-record-schema.md`, the `docs/ACTIVE-DOCS.md` registry note if any new `docs/` file is
   introduced, the version bumps in `packages/core/src/version.ts`, and the golden/stress coverage
   to add. Enumerate the same-change synchronization set.
8. **Risks & rejected alternatives** — name the field's failure modes (state laundering,
   prose-as-canon drift, archive dumping, auto-mutation) and how this design avoids each; record any
   design alternative you considered and rejected.
9. **Citations** — external prior art per §5.

**Locked / no-questions instruction:**

> Produce the deliverable directly as a downloadable Markdown document. Do not interview, do not
> ask clarifying questions — the requirements above are final. If a genuine contradiction makes a
> requirement impossible, state it in the deliverable and proceed with the most faithful
> interpretation.

---

## 8. Self-check (run before returning)

- [ ] Every file in §2 was fetched from commit `c04bcf9` and read in full (primary) or to bound
      scope (boundary-awareness).
- [ ] The deliverable is the single change-proposal file named in §7, in change-proposal form, with
      **no** `SPEC-NNN` assigned (SPEC-032 named only as downstream context).
- [ ] The FOUNDATIONS amendment block is present with **exact proposed wording**, follows the §1.1
      procedure, and includes the §29 hard-fail additions and the compiler-contract + schema cascade.
- [ ] The design reads **only the latest single accepted segment** — never a multi-segment range or
      the whole archive.
- [ ] The generation-brief field split matches §3.5 (CURRENT AUTHORITATIVE STATE + IMMEDIATE HANDOFF
      in scope; manual directive, stop guidance, voice pressure/overrides, working-set curation,
      focus tags, durable story config out of scope).
- [ ] Record-creation proposals satisfy every §3.6 hard requirement (valid type, real enum values,
      provenance, advisory-only).
- [ ] No proposed behavior weakens a §6 invariant or trips a §29 hard-fail: no auto-mutation, no
      accepted prose in any prose prompt or stored field, no verbatim handoff echo, deterministic
      compilation, explicit/disclosed scope, quarantined ephemeral output with provenance.
- [ ] The same-change synchronization cascade (docs + version + golden tests) is enumerated.
- [ ] Every external claim that shaped a decision is cited.
- [ ] Each §3 `assumption:` is surfaced in the deliverable as a labeled default the owner can
      override, not as a silent decision.
