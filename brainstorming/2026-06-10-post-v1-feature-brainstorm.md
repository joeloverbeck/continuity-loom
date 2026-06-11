# Post-v1 Feature Brainstorm — Elevating Continuity Loom

Date: 2026-06-10
Status: brainstorm — not a spec, not a backlog commitment
Provenance: user request ("what new features could elevate the app without violating the foundations, or pushing them a bit"), full read of `docs/FOUNDATIONS.md` + `docs/ACTIVE-DOCS.md`, codebase capability survey, and two external research passes (competing tools 2025–2026; narrative theory + human-AI co-creativity research). Source links inline.

## How to read this

Ideas are ordered by priority: a blend of (a) how much they elevate the core loop, (b) FOUNDATIONS fit, (c) competitive differentiation, and (d) research support. Each idea names the FOUNDATIONS posture — `aligns`, or `needs amendment` with the specific section. Ideas 1–3 form a natural arc: they are the three sanctioned LLM-assistance surfaces FOUNDATIONS §26 already contemplates, applied to the three friction points of the loop (what next? → is this candidate safe? → what changed?).

A consolidated FOUNDATIONS-amendment section and a deliberately-rejected list close the document.

---

## 1. Grounded Ideation Prompt — "What could happen next?" (the user's candidate)

**What.** A second prompt kind, compiled deterministically from the *same* sources as the prose prompt (active working set + generation-time brief + story config), that asks the external LLM for **ideas about what could happen next** instead of prose. Invoked pull-based ("I'm stuck"), never push-based.

**Why this is the right #1.**
- It is the documented open quadrant in the market: Sudowrite Brainstorm has the best ideation-curation UX but "doesn't see your Story Bible details" ([Sudowrite docs](https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/brainstorm/5xJUutV75BLU6u9LZndcDs)); NovelCrafter chat is codex-grounded but outputs freeform conversation. Only a niche SillyTavern extension ("Choices!") does both. A deterministic-compiler-grounded idea generator has **no direct competitor**.
- Co-creativity research converges on ideation as the highest-value, lowest-harm AI assistance: Wordcraft's professional writers found brainstorming the killer use ([arXiv 2211.05030](https://arxiv.org/abs/2211.05030)); CoAuthor found ownership erodes when AI contributes *text*, not ideas ([arXiv 2201.06796](https://arxiv.org/abs/2201.06796)).
- It answers the exact moment of friction: "at the edge of progressing but not sure what could happen."

**Design sketch (research-backed choices).**
- **3–6 forced-divergent, premise-level ideas — never one concrete continuation.** Single concrete suggestions maximize fixation and homogenization ([CHI 2024 fixation study](https://dl.acm.org/doi/full/10.1145/3613904.3642919), [C&C 2024 homogenization](https://mkremins.github.io/publications/Homogenization_C&C2024.pdf)). Diversity must be demanded structurally in the prompt, not hoped for.
- **Each idea slot uses a different causal mechanism drawn from the record taxonomy**: one secret partially surfaces, one clock visibly ticks, one plan degrades, one belief collides with a fact, one affordance/object gets exploited, one relationship shifts expression. This is the app's unfair advantage — no other tool has typed pressure records to enumerate mechanisms from.
- **Every idea must cite the records it builds on** ("uses: SECRET s3, CLOCK c1, OBJECT o2"). Ideas built from already-recorded material are automatically "surprising yet inevitable" — the foreshadowing already happened (retrospective coherence). This also makes ideas auditable against state.
- **Encode surprise/suspense operators instead of asking for "interesting":** Brewer & Lichtenstein's structural-affect channels map directly onto record types (secrets → curiosity/surprise; clocks/plans/obligations → suspense; belief-vs-fact deltas → dramatic irony). Ely–Frankel–Kamenica: a surprising idea is one that moves reader belief far *without contradicting established facts*. Dramatis gives a concrete suspense move: "degrade the protagonist's best remaining plan without removing all hope." LLMs under-produce suspense by default ([arXiv 2407.13248](https://arxiv.org/pdf/2407.13248)), so the operators belong in the template.
- **Question sub-mode.** A second variant: "ask me 5 pointed questions about the current pressure state" ("Who benefits if CLOCK c1 expires? What does B do when BELIEF b2 breaks?"). Writer's-block research shows many writers unblock by answering questions, not picking options ([Ahmed & Güss 2022](https://www.tandfonline.com/doi/abs/10.1080/10400419.2022.2031436)); Wordcraft writers explicitly wished the model would ask and push back.
- **Optional oblique constraint toggle:** one idea slot must use a so-far-unused selected record. Randomness drawn from the author's own records stays canon-compatible.
- **Quarantined output.** Ideas render in a scratch panel: no one-click insertion into records or brief fields, easy to clear, ephemeral by default (mirrors §22 prompt-inspection posture). Staging-area friction preserves engagement and ownership; auto-insertion erodes both. Ideas are never prompt context for prose generation — same anti-contamination class as rejected candidates.

**FOUNDATIONS posture: needs a narrow amendment.** §26 sanctions exactly this lane ("LLM assistance may be useful for… identifying possible inconsistencies, proposing handoff text…"; non-authoritative, reviewable). But §9 declares "one universal prose prompt template in v1," and §11/§29.5 block prompts that ask the model to "produce alternatives" — rules written to keep the *prose writer* local, which an ideation prompt is not. Amendment A1 (below) adds a second sanctioned prompt class. The ideation compiler stays deterministic (same input → same ideation prompt), validation still gates it (a contradictory state should block ideation too — ideas from broken state are garbage), and the prompt stays inspectable.

**Implementation surfaces** (from codebase survey): `packages/core/src/compiler/compile-prompt.ts` (template-version dispatch), `template-constants.ts` (ideation constants), new `sections/ideation-tail.ts` (replaces prose-craft/stop-rule/final-output sections; front/pressure/cast/records sections reused), `packages/server/src/generate-routes.ts` (new route or `promptKind` param), new web panel. Likely a relaxed validation matrix (voice-pressure completeness matters less for ideation).

---

## 2. Post-Acceptance Record-Update Suggestion Queue

**What.** After the user accepts a segment, an optional LLM pass reads the accepted text plus the current records and proposes a **reviewable queue of record updates**: "EVENT: Maro learned about the ledger (new)", "OBJECT knife: carried_by → Tessa", "SECRET s3: now partially exposed to POV". Every suggestion shows provenance (the prose span + records it derives from) and requires explicit per-item accept/edit/reject. Nothing mutates automatically.

**Why #2.** The #1 user complaint about *every* structured-state tool (NovelCrafter Codex, Story Bible, lorebooks) is manual-update tedium; the market's two live answers are silent auto-mutation (AI Dungeon Memory Bank — exactly what FOUNDATIONS forbids) and propose-then-review (SillyTavern's WorldInfo Recommender — the consensus sweet spot). Continuity Loom's loop *depends* on step 17 ("the user manually updates records") — it is the highest-friction step in the app's own canonical workflow, and the durable-change reminder currently tells the user to do work the app could help draft.

**FOUNDATIONS posture: aligns — §26 explicitly contemplates it** ("extracting candidate events from user-selected prose for review"). Hard constraints honored: suggestions are not records until accepted; provenance shown; rejected suggestions do not pollute the working set; the accepted-prose-is-not-canon rule is untouched because the *user* authors the resulting records by accepting each diff. One sharp edge: the suggestion pass sends accepted prose to OpenRouter — a new, user-initiated network surface; must be opt-in per invocation and never background-automatic.

**Design notes.** Tie it to the existing post-acceptance durable-change reminder (§3 step 16): the reminder becomes actionable ("review 4 suggested record updates") instead of purely admonitory. Suggestions arrive as structured diffs against the record schema, not free text. Aggressively label: "AI-suggested, not canon."

---

## 3. Pre-Acceptance Continuity Review — candidate vs. records

**What.** Before accepting a candidate, the user can invoke an advisory LLM check: "does this candidate contradict the compiled records?" Output: a reviewable flag list (physical continuity, POV/knowledge leaks, secret leakage, voice drift), each citing the record and the prose span in tension. Advisory only — it never gates acceptance.

**Why #3.** Post-hoc whole-manuscript consistency scanning is becoming commodity (long-context Claude passes, epos-ai, Novarrium); but checking a *candidate segment against a human-authored authoritative record set before acceptance* is the prevention-grade variant nobody else can do, because nobody else has deterministic ground truth. It directly serves the app's first obligation (continuity discipline) at the exact moment errors enter the archive.

**FOUNDATIONS posture: aligns** (§26: "identifying possible inconsistencies"). Constraints: deterministic validation remains the only *blocking* authority (§11 — LLM checks can never become blockers); flags are suggestions with provenance; rejected flags leave no residue. Caution from research: LLMs are unreliable plot-hole detectors and degrade with length ([FlawedFictions, arXiv 2504.11900](https://arxiv.org/abs/2504.11900)) — mitigated here because the input is one short segment plus compiled structured state, the easiest possible setting; still, frame output as "possible tensions," never verdicts.

---

## 4. Deterministic Pressure Sifting — "charged configurations" surface (no LLM)

**What.** Pure `@loom/core` logic that scans records for **narratively charged configurations** and surfaces them in the UI: unresolved OBLIGATION + ticking CLOCK held by the same entity; BELIEF whose `truth_relation` contradicts a selected FACT (dramatic-irony fuel); SECRET with reveal permission whose holder is onstage; OPEN THREAD untouched for N segments; PLAN whose blocker was just resolved. Inspired by story-sifting research (Ryan; Kreminski's [Felt](https://mkremins.github.io/publications/Felt_SimpleStorySifter/), [Loose Ends](https://mkremins.github.io/publications/LooseEnds_AIIDE2022.pdf)).

**Why #4.** It is the zero-risk sibling of idea #1: fully deterministic, no LLM, no network, no new prompt class — just queries over typed records, which is what the app's data model was built for. It helps the stuck author *before* reaching for the LLM ("you have three loaded guns on the mantel"), powers working-set curation ("this dormant thread is selectable"), and can seed the ideation prompt's mechanism slots. The SillyTavern tracker ecosystem demonstrates organic demand for state visualization (relationship graphs, clock dashboards) that Loom's records support natively.

**FOUNDATIONS posture: aligns cleanly.** Read-only, deterministic, advisory. Guard one edge: sifting patterns must surface *existing* pressure, never command closure or score "story health" — no thread-starvation nagging that becomes plot-rail pressure by another name (§4.7, and the narrative-theory roadmap's own warnings). Presentation is "currently charged," not "you should resolve."

---

## 5. Handoff & Brief Drafting Assistance

**What.** LLM-drafted *suggestions* for the generation-time brief's hardest prose fields — `recent_causal_context`, `last_visible_moment`, `immediate_situation_summary`, `prior_accepted_prose_status_or_handoff_note` — proposed from the accepted segment and current records, reviewed and hand-edited before save. The natural companion to idea #2 (same trigger moment, same review pattern): #2 updates durable records, #5 drafts the next launch surface.

**Why #5.** The user-guide's continuation workflow makes the author hand-write a causal recap every cycle; it is pure clerical translation of "what just happened" into brief fields — exactly the "reduce clerical effort" lane §26 names ("proposing handoff text" verbatim). Risk to manage: drafted handoff text comes *from* accepted prose, so the suggestion pass must enforce the §10 firewall in its instructions (continuity summary, never verbatim prose; no inviting the model to mine the archive) and the user reviews every word before it becomes brief content.

**FOUNDATIONS posture: aligns** (§26 names it), with the §10 discipline above. Same opt-in network-surface caveat as #2.

---

## 6. Record-Drafting Assistant — braindump → atomic records

**What.** Paste freeform notes ("Tessa owes the dockmaster, she's hiding the burn scar, the tide turns at dusk") and get proposed atomic records back — typed, schema-shaped, one claim each — to review, edit, accept, or discard. Also: draft a CAST MEMBER dossier skeleton from a freeform character sketch, with the voice-anchor fields stubbed for the author to fill.

**Why #6.** Cold-start cost is the steepest adoption wall for record-first tools (NovelCrafter's top complaint: "you have to fill it all in manually"; Sudowrite's Import features exist precisely because of this). Atomic-record discipline (§13) is the app's strength and its data-entry tax; §26 sanctions "drafting record suggestions" and "helping the user phrase records." Lower priority than 2/3/5 because it serves project start-up rather than the per-segment loop.

**FOUNDATIONS posture: aligns** (§26). Suggestions land in a review tray, never directly into the record store; rejected drafts vanish.

---

## 7. Working-Set & Record-Graph UX Upgrades (no LLM)

**What.** A basket of §7-sanctioned curation improvements:
- **Saved working-set templates** ("dock scenes," "Tessa-POV interiors") — one click to load a selection baseline, then adjust.
- **Record relationship map**: a graph view over existing record references (RELATIONSHIP from/to, OBJECT carried_by, PLAN holder, SECRET holders) for orientation in large projects — the most-praised feature class across Campfire/World Anvil/NovelCrafter.
- **EVENT timeline view** (read-only, story_time ordered) for orientation — explicitly a reading aid, not act machinery.
- **Working-set diff vs. last generation**: "since you last generated: 2 records edited, 1 deselected."

**FOUNDATIONS posture: aligns** — §7 explicitly calls for "templates, filtering, search, grouping, salience labels"; §27 wants curation "fast, pleasing, and hard to misuse." All deterministic UI over existing data. Lower priority only because the curation UX is already decent and the loop-level frictions (1–5) dominate.

---

## 8. Voice-Drift Advisory on Candidates

**What.** An optional per-character check of candidate dialogue/narration against the CAST MEMBER voice anchor (register, rhythm, taboo words, address terms), flagging drift ("Maro uses contractions here; his anchor says he never does"). Could be a lens within idea #3 or standalone. Market precedent: ProseEngine drift detection, AutoCrit dialogue comparison — but both compare prose-to-prose; Loom can compare prose-to-*authored-anchor*, which is stronger ground truth.

**FOUNDATIONS posture: aligns** (§4.8 voice is continuity; §26 advisory lane). Priority 8 because idea #3 subsumes most of its value, and §17's rich anchors only pay off when something *checks* against them — but dialogue-heavy authors would feel this immediately.

---

## Consolidated FOUNDATIONS amendments

Only one amendment is strictly required for the top idea; two more are worth considering at implementation time.

**A1 (required for #1): second sanctioned prompt class.** Amend §9 (and the §29.4/§29.5 checklist rows that assume all prompts are prose prompts) to recognize a deterministic, inspectable, validation-gated **assistance prompt class** distinct from the universal prose prompt: compiled from the same sources, never a prose-writer (its output is never story text), never prompt context for prose generation, and exempt from the local-prose stop rule *because it produces no prose*. The "no alternatives/plans" prohibitions in §11.7/§29.5 should be scoped to the prose prompt. This is a clarifying amendment, not a doctrinal change — §26 already authorizes the assistance lane; §9 just predates a second prompt kind.

**A2 (optional, for #2/#3/#5): assistance-output handling.** A short section pinning the shared rules for all LLM-assistance surfaces: opt-in per invocation; suggestions quarantined until accepted; provenance mandatory; suggestions never become prompt context; rejected suggestions leave no residue; assistance output is never logged or archived by default (mirrors §22). Codifying once beats re-arguing per feature.

**A3 (optional): per-purpose model setting.** §23 mandates one global model setting. Idea generation, record extraction, and prose writing plausibly want different models (cheap/fast for extraction, strong for prose). A narrow amendment could allow named per-purpose model slots while keeping each a global local setting. Defer until a real need appears.

## Considered and rejected (by name)

- **Auto-summarization / memory banks** (AI Dungeon-style prose→state distillation without review) — state laundering, rejected by §28.8.
- **Keyword-triggered record activation** (lorebook/World-Info-style context injection) — rejected by name in §28.8; the active working set stays explicit.
- **Beat/arc/act outline tooling** (Sudowrite Canvas templates, Plottr-style beat sheets) — plot-rail machinery, §12.
- **Branching "what-if" trees** (WHAT-IF-paper-style alternative-branch exploration) — §4.2 single continuity. The ideation prompt deliberately outputs *premises*, not branches: nothing is stored as a timeline.
- **Feeding recent chapters into prose prompts** (Sudowrite/Inkfluence rolling context) — §10 hard rule; the market's drift toward manuscript-context retrieval is the failure mode this app exists to reject.
- **Always-on suggestion surfacing** (push-based ideation after each segment) — Ely–Frankel–Kamenica: constant twist-pressure is self-defeating; also violates the writers-want-firm-boundaries finding. Pull-based only.

## Sources (primary anchors)

- Tool landscape: Sudowrite docs (Brainstorm/Canvas/Story Bible), NovelCrafter docs (Codex/Chat/Beats), SillyTavern "Choices!" + WorldInfo Recommender, AI Dungeon memory system, Latitude Voyage (2026). Links inline above.
- Co-creativity: Wordcraft (arXiv 2211.05030), CoAuthor (arXiv 2201.06796), Dramatron (CHI 2023), Sparks (arXiv 2110.07640), Gero CHI 2023, Holding the Line (arXiv 2404.13165), Chakrabarty C&C 2024 (arXiv 2309.12570).
- Ideation UX hazards: homogenization (C&C 2024), fixation (CHI 2024), content-diversity loss (arXiv 2309.05196), Luminate (CHI 2024).
- Narrative theory: Brewer & Lichtenstein structural-affect (1982), Ely–Frankel–Kamenica suspense/surprise (JPE 2015), Dramatis (AAAI 2014), Suspenser (2015), Riedl & Young narrative planning (JAIR 2010), Felt / Loose Ends (Kreminski).
- LLM limits: FlawedFictions (arXiv 2504.11900), narrative-quality gap (arXiv 2407.13248).
