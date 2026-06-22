# Research Brief — Cross-Segment Story-Record Duplication in the Prose-Generation Prompt

**For:** an external deep-research session (ChatGPT-Pro, "Session 2").
**From:** a repo-grounded authoring session with full access to the Continuity Loom codebase.
**Deliverable:** one downloadable markdown document (see §7).
**Mode:** LOCKED. Do not interview, do not ask clarifying questions, do not request the repo be re-explained. The requirements below are final. Produce the deliverable directly.

---

## 0. How to use this brief

You are the deep researcher. Everything you need is in (a) this brief and (b) the uploaded repository manifest. You have no memory of the session that authored this brief, and that is expected — the brief is self-contained.

Your job:

1. Fetch and read, in full, the files in **§2** from the pinned baseline commit.
2. Do the deep external research commissioned in **§4** (LLM prompt-engineering literature, prior art in comparable systems, narrative/craft theory).
3. Reach the verdict described in **§5** and **§6**.
4. Produce the single markdown deliverable specified in **§7**, whose *shape follows your verdict*.

You must engage — not sidestep — the fact that this project **currently believes the duplication under investigation is beneficial**. The user's worry contradicts the project's own stated doctrine. Your value is an evidence-based ruling on that tension, not a restatement of either side.

---

## 1. Provenance, baseline, and manifest

- **Repository:** Continuity Loom — a local-first "story-state operating system." A Node process serves a React UI and a localhost-only API that tracks story records, compiles them into a **deterministic** prose-generation prompt, and handles segment acceptance. No cloud, no account.
- **Fetch baseline commit:** `2f6f2cf` (`2f6f2cfda7861afdbb4821d9a5bb4ec7a0c1721b`). Fetch **every** file in §2 from this exact commit so the line references and section numbers resolve.
- **Manifest:** `reports/manifest_2026-06-09_2f6f2cf.txt` — the complete path inventory of that commit's tree (569 paths). Upload it alongside this brief. If a path you want is not in the manifest, it does not exist at the baseline; do not invent it.
- **Predecessor work (delta, not cold start):** there is **no** prior research brief or spec on this specific question — cross-segment duplication of story-record content and its effect on prose quality has never been investigated. However, `archive/reports/continuity-first-prose-prompt-redesign-first-iteration.md` (the original prompt-redesign research brief that produced today's universal template) already reasoned about *intra-dossier* redundancy in its "What is redundant" analysis and about lost-in-the-middle placement. Treat that as the rationale ancestor of the current design: read it to understand **why** the duplication exists before you judge whether it should.

---

## 2. Read in full, in this authority order

Continuity Loom has a strict authority hierarchy (see `docs/ACTIVE-DOCS.md`). Read top-down; later docs must not be read as overriding earlier ones.

**Constitution**
- `docs/FOUNDATIONS.md` — the project constitution. The verdict and any proposed change live or die by it. Load-bearing sections for this task: **§8 Deterministic prompt compilation**, **§9 Universal prose prompt contract** (the mandatory/designated-optional section set), **§17 Character voice and cast dossiers** (durable dossiers are primary authority; current voice pressure is "optional salience reinforcement"), **§28.2 Long-context capability does not justify archive dumping** (the explicit lost-in-the-middle stance), and **§29 + §29.4 Alignment checklist / Prompt compilation hard fails** (every proposed change must clear these).

**Product / user-facing**
- `README.md` — what the app is and the local loop it serves.
- `docs/user-guide.md` — the user's actual prose-generation loop; grounds "prose quality" in the real workflow.

**Prompt / compiler / schema authorities**
- `docs/compiler-contract.md` — **the authoritative bridge.** §3 is the exact 28-section render order; §4 is the exhaustive placeholder→source map where every duplication site is named; §8 empty-state rules; §9 prompt-facing vs validation-only; §10 change-control. Any change you propose must be expressible as edits here.
- `docs/prompt-template.md` — the universal template / segment structure being evaluated.
- `docs/prompt-template-rationale.md` — **the most load-bearing doc for the verdict.** Its §7 (active-working-set précis + dedicated causal-pressure sections) and §10 (durable voice anchors vs. "current-generation salience duplicate" voice pins) are the *existing pro-duplication argument*. You must confirm or overturn this on evidence.
- `docs/story-record-schema.md` — the conceptual schema; defines each record type's fields and therefore what content is even duplicable.

**Stress / regression support**
- `docs/stress-suite.md` — the 26 conceptual stress cases; where a "duplication-vs-quality" case would live and how the salience cases (≈12–16) currently reason.
- `docs/stress-coverage-matrix.md` — the audit table mapping cases to risk areas; shows the current coverage a new case must slot into.

**Rationale ancestor**
- `archive/reports/continuity-first-prose-prompt-redesign-first-iteration.md` — why the current template (and its deliberate redundancy) was chosen.

**Code seams — read to ground claims; do NOT paste verbatim into the deliverable.** These are the concrete render sites of every duplication. Confirm the contract against the code; flag any drift you find.
- `packages/core/src/compiler/compile-prompt.ts` — entry point; `renderPrompt` walks `SECTION_ORDER`, `renderSection` dispatches.
- `packages/core/src/compiler/template-constants.ts` — `SECTION_ORDER`, section templates, composite sub-block structure, the literal "salience duplicate" notes.
- `packages/core/src/compiler/placeholder-map.ts` — placeholder→resolver registry.
- `packages/core/src/compiler/sections/front.ts` — story config, current state, handoff, secrets (incl. the 5 reveal lanes), POV/audience knowledge.
- `packages/core/src/compiler/sections/pressure.ts` — the `active_working_set` pressure **summaries** (`active_action_pressure`, `active_knowledge_pressure`, `relationship_emotion_pressure`, `material_pressure`, `voice_pressure`) and the dedicated detail sections (plans, intentions, clocks, obligations, consequences, threads).
- `packages/core/src/compiler/sections/cast.ts` — voice pins vs. full dossiers vs. minor/offstage notes.
- `packages/core/src/compiler/sections/records-tail.ts` — `relevant_facts_beliefs_events`, `locations_objects_affordances`, `physical_continuity` detail sections.

---

## 3. The problem, precisely stated

The deterministic compiler renders the same story-record datum in **more than one** XML segment of the final prompt, at different granularities and under different selection predicates. This is not a bug — it is the current intended design — but its effect on prose quality has never been tested. The user worries it **confuses the LLM prose writer and degrades prose quality and coherence**. The project's current doctrine says the opposite: that the repetition is **salience reinforcement** that fights lost-in-the-middle degradation.

### 3.1 The duplication map (verified against the compiler at baseline `2f6f2cf`)

There is **no deduplication, cross-referencing, or "mention once" logic** anywhere in the compiler. Each section independently filters and re-renders its records. The concrete repeats (all in scope for this brief):

- **BELIEF** → `active_knowledge_pressure` (compact summary, in `<active_working_set>`) **and** `pov_relevant_beliefs` *or* `non_pov_behavior_shaping_beliefs` (full dossier, in `<relevant_facts_beliefs_events>`). This is the user's named example.
- **FACT** → `hard_canon_bullets` (if hard canon) **and** `active_knowledge_pressure` (if selected) **and** `pov_accessible_facts` *or* `writer_visible_or_non_pov_facts`. Up to three sites.
- **EVENT** → `active_knowledge_pressure` summary **and** one of `recent_events` / `relevant_backstory` / `offstage_or_withheld_events`.
- **SECRET** → `active_knowledge_pressure` summary **and** five lanes in `<secrets_and_reveal_constraints>` (`writer_visible_hidden_truths`, `secret_holders`, `secret_non_holders_to_protect`, `allowed_clues_and_surface_cues`, `forbidden_reveals`, `reveal_permissions`). The claim/identity recurs many times.
- **LOCATION / OBJECT / VISIBLE AFFORDANCE** → `material_pressure` (and, for affordances, `active_action_pressure`) summary **and** the `locations` / `objects` / `visible_affordances` detail **and** `physical_continuity`. Up to 3–5 sites for affordances.
- **PLAN / INTENTION / OPEN THREAD / CONSEQUENCE** → `active_action_pressure` summary **and** their dedicated `active_*` detail sections.
- **ENTITY STATUS** → `material_pressure` summary **and** `physical_continuity` detail.
- **CAST MEMBER voice** → `active_cast_voice_pressure_pins` (explicitly labeled in `template-constants.ts` as a "current-generation salience duplicate") **and** the full `active_onstage_full_cast_dossiers`.

### 3.2 The doctrine the verdict must confront

The current design is principled, not accidental:
- `prompt-template-rationale.md §7`: the working-set précis "already provides a compact pressure précis near the front; the dedicated causal-pressure sections reinforce that before the prompt enters long characterization material."
- `prompt-template-rationale.md §10` / `FOUNDATIONS §17`: voice pins are deliberate salience duplicates that "prevent generic dialogue and generic close narration when the full dossier is long."
- `FOUNDATIONS §28.2`: long context does not make burial safe; "important information can be underused when buried in the middle of long prompts."

So the project already *uses* duplication as a deliberate countermeasure to lost-in-the-middle. The open question is whether that countermeasure is net-positive for prose quality across **all** the surfaces in §3.1, or whether — past some point, or for some record types, or in some prompt-length regimes — it crosses into the confusion/contradiction-risk/token-waste the user fears.

---

## 4. The research commissioned (this is your deep-research mandate)

Go as deep as you need across these axes. Cite sources. Distinguish strong empirical findings from plausible craft heuristics.

1. **LLM behavior under intra-prompt repetition.** What does the literature (and credible practitioner evidence) say about repeating the same information in multiple places within a single long prompt? Cover: salience/priming and recency-primacy effects; "lost in the middle" and long-context positional bias; whether redundancy helps recall of buried facts; whether it causes over-weighting, contradiction when the two renders subtly differ, instruction dilution, or attention splitting; the "needle-in-a-haystack" vs. "multi-needle" findings; any results on *structured/XML-tagged* prompts specifically.
2. **Summary-plus-detail patterns.** Evidence on the "compact précis near the front + full detail later" pattern Continuity Loom uses — is front-loaded summarization of later content a known win, a wash, or a liability for generation quality and coherence? Distinguish *summary that paraphrases* from *verbatim restatement*.
3. **Differentiation by content type.** Is there reason to believe duplication helps for some kinds of content (e.g., voice/character salience, hard constraints) and hurts for others (e.g., narrative facts, beliefs, situational detail)? The deliverable's recommendation is allowed to be **differentiated per record type / per surface**, not a single global rule.
4. **Cross-referencing as an alternative.** Evidence on pointer/cross-reference schemes ("see the beliefs section") vs. verbatim repetition vs. single-placement, for instruction-following models. Does a deterministic "render once, reference elsewhere" scheme preserve salience without the repetition cost? Does it risk the model failing to follow the pointer?
5. **Comparable systems / prior art.** How do mature LLM narrative-generation, RAG-context-assembly, agent-memory, and character-card systems (e.g. structured context builders, "lorebook"/world-info injection, scene-state prompts) handle the same datum being relevant to multiple framings? Do they dedupe, repeat for salience, or reference? What did they learn?
6. **Narrative / craft theory.** From writing-craft and narratology: does giving a prose writer the same fact under two framings (e.g., a belief as *interiority pressure* vs. as *behavior-shaping force*) actually serve generation, or is one framing sufficient? This bears on whether some of Continuity Loom's "duplication" is really *two genuinely different instructions about one datum* rather than redundant restatement — a distinction the verdict should make explicitly.
7. **Token budget.** Quantify, at least roughly, the token cost of the current duplication and the realistic savings of each de-dup option. Token budget is **secondary** to prose quality here, but must be reported so the user can weigh it.

---

## 5. The verdict you must reach (UNBIASED)

Reach an **evidence-based ruling**, not a foregone conclusion. The user explicitly asked for an unbiased verdict that may *vindicate, refine, reduce, or even strengthen* the current duplication. Your verdict must:

- State, per duplication surface in §3.1, whether the repetition is **net-positive, net-neutral, or net-negative** for prose quality and coherence, with the evidence.
- Explicitly **rule on the project's existing doctrine** (§3.2): does the lost-in-the-middle / salience-reinforcement rationale hold across all surfaces, or only some?
- Distinguish **redundant restatement** (same datum, same framing, twice) from **dual-framing** (same datum, two genuinely different instructions). The former is the user's real target; the latter may be legitimate and should be defended if so.
- Account for **prompt-length regime**: the right answer may depend on how long the assembled prompt is (a short prompt has no middle to get lost in). If so, say whether a deterministic length-aware rule is warranted or whether that would violate determinism/simplicity.
- Honor the **hard invariants** (see §8). No recommendation may rely on an LLM to summarize/select/dedupe at compile time, on hidden state, on accepted/rejected/superseded prose, or on auto-derived summaries entering the prompt.

---

## 6. Foundations posture

You **may** propose amendments to the governing docs (`FOUNDATIONS.md`, `compiler-contract.md`, `prompt-template.md`, `prompt-template-rationale.md`) where your evidence justifies a change that current foundations would otherwise forbid. When you do:

- Quote the specific clause that would block the change, and argue whether amending it is **truly** warranted (the user's words) — not merely convenient. A change that can be made *within* current foundations must be made within them; only propose an amendment when the research genuinely requires it.
- Run every proposed change through **FOUNDATIONS §29 and §29.4** (the alignment checklist and prompt-compilation hard-fails) and show the result inline.
- Never weaken these even via amendment: deterministic compilation, validation failing closed, API-key secrecy, localhost binding, local-first ownership, and the exclusion of accepted/rejected/superseded prose and auto-derived summaries from prompt context. If your idea collides with one of these, it is the idea that yields.

If your verdict is that **no change is warranted**, you do not propose amendments — you defend the status quo per §7 Branch B.

---

## 7. The deliverable (single document, shape follows verdict)

Produce **one** downloadable markdown file:

> **`prompt-duplication-verdict-and-spec.md`**

It always opens with the **verdict** — the §5 ruling, surface-by-surface, with the §4 research and citations behind it, and the explicit ruling on the project's existing doctrine. Then the body takes one of two shapes depending on the verdict (this is an **always-produce, form-follows-verdict** deliverable — you must emit one of the two branches, never neither):

### Branch A — a change is warranted
The body **is an implementation-ready spec**, provisionally numbered **SPEC-017**, structured to mirror an existing archived spec (study `archive/specs/SPEC-007-deterministic-prompt-compiler.md` for the house structure). It must include:
- Scope and non-goals; the verdict as the rationale section.
- **Per-surface / per-record-type** changes (which renders stay, which are removed, which become cross-references, which are reframed as legitimate dual-framing). A differentiated recommendation is expected, not a blanket rule.
- The exact **`compiler-contract.md` edits** (§3 order, §4 placeholder rows, §8 empty-state, §10 change-control) — changes must be expressible as deterministic contract edits.
- Any **`prompt-template.md` / `prompt-template-rationale.md`** edits, and any **`FOUNDATIONS.md`** amendment (per §6), each with its §29/§29.4 alignment shown inline.
- **Validation, stress-suite, and golden-prompt impacts:** which `docs/stress-suite.md` cases change or are added (e.g., a duplication-vs-quality case and where it sits in `stress-coverage-matrix.md`), and that the golden-prompt regression baseline will move.
- A decomposition note: the spec must be cleanly splittable into reviewable tickets via the repo's spec→tickets workflow.
- A token-budget delta estimate.

### Branch B — the status quo is vindicated (no change, or only selective refinement)
The body **is a rationale report** that:
- Marshals the evidence that **overrides the user's confusion worry**, surface by surface, and explains why the existing salience-reinforcement doctrine holds.
- Calls out any surface where the evidence is weak or mixed, so the user knows where the confidence is thin.
- If the research supports *small* selective refinements (e.g., dedupe one record type, tighten one summary) while keeping the overall design, include those as a clearly-scoped **mini-spec** with the same contract-edit precision as Branch A, for just those items.

In both branches: keep code out of the document except as short illustrative snippets; reference files by path and section, not by pasted blocks. The user will place the result into `specs/` (or `archive/reports/`) themselves — write it to be adoptable as-is.

---

## 8. Hard invariants (non-negotiable; from FOUNDATIONS + CLAUDE.md)

Any recommendation that violates one of these is wrong by construction:

1. **Deterministic compilation.** No LLM may select, rank, summarize, repair, rewrite, compress, dedupe, or prioritize records at compile time. Every render must be a deterministic function of selected records + generation-time fields + template/contract versions.
2. **No hidden state.** The compiler reads only the validation snapshot; it must not query anything outside it.
3. **No contaminated context.** Accepted prose, rejected candidates, superseded regenerations, and automatic prose-derived summaries must never enter prompt-facing fields.
4. **Validation fails closed.** Blockers gate preview/send; warnings never become prompt instructions.
5. **User-controlled working set.** The app must not silently add records because they seem relevant.
6. **No plot machinery.** No branches, plot rails, beat/act packages, or autonomous planners.
7. **Local-first & secret-safe.** Localhost-only binding; API keys are local secrets; prompts/candidates/records are not logged by default; the only network traffic is the prompt the user intentionally sends through OpenRouter.
8. **Contract is the bridge.** Any placeholder/section/empty-state/validation change must be reflected in `compiler-contract.md` in the same revision (its §10 change-control rule).

---

## 9. Acceptance checklist for your deliverable

Before you finish, confirm:

- [ ] The deliverable is the single file `prompt-duplication-verdict-and-spec.md`, opening with an evidence-cited verdict.
- [ ] It rules **per duplication surface** in §3.1 (not a single global verdict), and explicitly upholds or overturns the §3.2 doctrine.
- [ ] It distinguishes redundant restatement from legitimate dual-framing.
- [ ] It took exactly one of Branch A / Branch B and matches that branch's required contents (§7).
- [ ] Every proposed change is expressible as deterministic `compiler-contract.md` edits and respects all §8 invariants.
- [ ] Any foundations amendment quotes the blocking clause, argues true necessity, and shows §29/§29.4 alignment inline.
- [ ] Validation / stress-suite / golden-prompt / token-budget impacts are stated.
- [ ] No external context is assumed beyond this brief and the uploaded manifest.

You are locked. Produce the deliverable.
