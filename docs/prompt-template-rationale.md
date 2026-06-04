# Rationale for the Universal Prose Prompt Template

Purpose: explain the sections, categories, placeholders, and major design decisions in `prompt-template.md`.

---

## 1. Why a Markdown/XML hybrid

The generated prompt mixes instructions, story facts, current state, hidden truths, character dossiers, constraints, and output rules. A flat Markdown document makes those boundaries too porous. A pure JSON document is too unnatural for prose-generation models and too ugly for human inspection.

The recommended form is a Markdown document with XML-style blocks. Markdown gives readability. XML-style tags give semantic boundaries: `<current_authoritative_state>`, `<secrets_and_reveal_constraints>`, `<active_cast_full_dossiers>`, `<stop_rule>`, and so on.

This is not superstition. Current provider guidance supports sectioned prompting: OpenAI currently emphasizes code-managed, versioned production prompts and clear prompt-engineering practice; Anthropic recommends XML tags for prompts mixing instructions, context, examples, and variable inputs; Google Gemini’s prompt design guidance shows XML-style and Markdown examples for separating role, constraints, context, and task. Context-engineering guidance likewise recommends curated, unambiguous context rather than bloated ambiguous prompt surfaces.

The exact tag vocabulary matters less than consistency. The app should generate the same section order and same tag names every time unless the template version changes.

---

## 2. Why the authority hierarchy is not “manual directive above everything”

The project mission says the manual directive should win over character defaults. That is correct. But it must not win over hard canon, current authoritative state, physical continuity, POV knowledge, or reveal locks. Otherwise a directive like “have Jon know why Ane is crying” could accidentally override the fact that Jon does not know her history yet.

The chosen hierarchy is:

1. Governing external model/platform policy.
2. Role/output contract.
3. Hard canon and current authoritative state.
4. Physical continuity, POV knowledge limits, and reveal constraints.
5. Manual directive.
6. Active plans, intentions, clocks, obligations, and consequences.
7. Beliefs, relationships, emotions, open threads, facts, and events.
8. Active cast characterization and voice.
9. Tone and prose craft.
10. Invention permissions.

This preserves the core authorial power you want: the directive can force a character past default reluctance. But it cannot force impossible knowledge, impossible bodies, or secret leakage.

Narrative-planning research supports this split. Character believability depends on characters appearing as intentional agents, but authorial goals and character goals are distinct forces that must be reconciled. In this app, the manual directive is authorial pressure; plans/intentions are character pressure; hard state and continuity are the substrate they operate on.

---

## 3. Why current authoritative state is separate from the handoff

The original Red Bunny prompt had a strong handoff but mixed too much: older events, current bodies, Jon’s sexual reaction, non-POV truths, and launch point. That makes it easy for the prose writer to import knowledge into the wrong mind.

The template splits:

- `<hard_canon>`: never contradict this.
- `<current_authoritative_state>`: what is physically and operationally true at generation start.
- `<immediate_handoff>`: how we got here and exactly where prose begins.

This split is the most important continuity safeguard after POV/reveal locks. It also helps long-context models because hard state appears early and in a compact form.


### 3.1 Why `most_recent_prose_summary` was removed

The old placeholder name `most_recent_prose_summary` was too dangerous. It pointed the user and future implementers toward accepted prose as the thing to summarize, even though the constitutional rule says accepted prose is not prompt context. The corrected placeholder is `prior_accepted_prose_status_or_handoff_note`. It may render `None`, or it may render a user-authored continuity handoff. It must not contain verbatim accepted prose, rejected candidate text, or an automatic prose-derived summary.

The purpose of the field is launch clarity, not prose mining. If a prior segment changed continuity, the durable change belongs in records and current state before the next generation.

### 3.2 Why recent causal context is writer-visible but not POV knowledge

The handoff may need to tell the prose writer about non-POV causes that shape visible behavior. That does not make those causes available to the narrator. The template therefore labels recent causal context as writer-visible and repeats that entity labels, dossier headings, and handoff facts do not grant POV knowledge.

---

## 4. Why active/onstage cast gets rich dossiers

The prose writer must preserve characterization and unique speech patterns, and small active-cast slices will often flatten character voice.

The revised rule:

- **Active/onstage cast:** full rich dossier.
- **Present but minor/silent/backgrounded cast:** compressed presence and voice notes.
- **Offstage cast:** relevance slice only.
- **No hard maximum:** the compiler may warn about long-context risk, but the user decides whether rich active-cast fidelity is worth the token cost.

The reason is practical: dialogue and behavior quality depend on more than “goal + mood.” They need diction, rhythm, class register, pressure behavior, evasion style, taboo/suppression rules, body, perception, misreads, and anti-generic warnings.

Long-context research warns that information buried in the middle may be underused, but the solution is not to starve active cast. The solution is to put state and instructions at the edges, give active cast clear headings, and avoid dumping full offstage dossiers.

---


### 4.1 Why active cast also needs compact voice pressure pins

Full active/onstage dossiers remain correct. The compiler should not silently compress them.

However, long dossiers can dilute the most important voice constraints. The prompt should therefore compile a compact per-character voice pressure pin near `<active_working_set>`. This is not a replacement for the full dossier. It is a salience duplicate: the few voice constraints most likely to prevent generic dialogue in the current local unit.

A good voice pin includes current speech pressure, rhythm/register, vocabulary or metaphor pools, suppression/taboo behavior, dialogue tactics, and anti-generic/anti-repetition warnings.

The pin should be deterministic: either stored directly, derived from stable dossier fields by fixed formatting, or authored as a generation-time override. It must not be summarized by an LLM.

---

## 5. Why speech-pattern peculiarities get their own subsection

Voice is one of the mission’s major failure risks: generic prose and flattened character speech. A character’s speech pattern is not one thing. It is a bundle:

- sentence length and rhythm
- vocabulary pool
- metaphor pool
- class/education/professional register
- profanity behavior
- taboo words or avoided subjects
- register switching under pressure
- address terms and naming
- interruption/silence behavior
- lying/evasion style
- intimacy style
- anger style
- anti-repetition warnings

The universal template therefore expects rich active cast dossiers to include `speech_pattern_peculiarities`, not just a generic “voice” field.

---

## 6. Why sample dialogue is optional, capped, selected, and non-copyable by default

Few-shot examples are powerful because they condition the model’s next output. This can help with difficult style and voice targets. It can also make the model echo examples, overuse catchphrases, or treat examples as content rather than pattern.

The schema allows `sample_utterances`, but they are optional and must be annotated by situation, speech function, and copy policy. Default copy policy is `never_copy_verbatim`.

Compiled sample utterances should be capped at zero to three per active/onstage character. The default compiled count is zero. Samples should compile only when selected by the user or selected by deterministic metadata tied to the current pressure. An LLM must not choose or rewrite samples during prompt compilation.

Best use:

- one to three micro-examples for the current pressure
- examples of speech function, not catchphrases
- examples showing refusal, bargaining, evasion, seduction-as-performance, guarded tenderness, anger, lying-by-understatement, or other pressure behavior
- pairing with anti-repetition warnings

Bad use:

- large dialogue banks pasted into every prompt
- repeated catchphrases
- examples not tied to current situation
- examples that reveal secrets or future-state material
- samples treated as prose to continue

---

## 7. Why secrets are split into lanes

A single “secret” paragraph is not enough. The writer may need to know hidden truth to shape subtext, while the POV must not know it and another character may or may not reveal it.

The template separates:

- writer-visible hidden truths
- secret holders
- non-holders to protect
- allowed clues and surface cues
- forbidden reveals
- reveal permission

This lets the external writer use hidden truth for behavior without leaking it into the wrong narrator.

The Red Bunny use case proves the need. The writer should know Ane is a sex worker so her guarded behavior can be accurate. Jon should not narrate that fact as knowledge before the prose earns it.

---

## 8. Why audience knowledge is separate from POV knowledge

Audience knowledge can differ from POV knowledge. In Red Bunny, the audience can know Ane’s work and morning trauma while Jon does not. That difference creates dramatic irony and tension.

Without an audience-knowledge section, the writer may either hide too much and make behavior generic, or leak too much and break POV. The separate section says: this truth can shape surface cues, but not the POV’s knowledge.

---

## 9. Why facts are split but deprecated facts are not a normal category

The schema uses:

- hard canon
- current state
- setting fact
- discovered fact

`deprecated_fact` should not be a normal record type. In a single-continuity app, wrong facts should be removed, corrected, or superseded by current state. Keeping retired facts around in the active story model invites leakage.

The only temporary “superseded” state worth supporting is a validation diagnostic: “this selected fact appears superseded by current authoritative state.” It is not a story record category, not a compiler repair state, and not prompt-facing text. If the selected fact truly contradicts current state, generation blocks until the user revises, removes, or deselects it.

---

## 10. Why events are grouped by function, not dumped as history

A flat event archive makes the prompt writer guess what matters. The schema therefore gives every event a prompt-facing kind:

- immediate previous
- recent causal
- relevant backstory
- offstage
- withheld

The compiler uses those groups. This preserves causality without forcing the model to treat all history as equally important.

For Red Bunny, the morning abuse and chase are recent causal events. Jon buying the book is immediate route context. Marisa’s deeper history is offstage background and should not be pasted in full for the first Jon segment.

---

## 11. Why PLAN records strongly drive prose

You said users will create PLAN records only when a real plan exists. That makes plans high-signal. Active relevant plans should drive tactics, refusals, fallback steps, conflicts, and choices.

This is also research-compatible. Narrative generation work repeatedly treats goals and plans as central to meaningful character action. Plans make behavior legible without requiring act structure.

The template gives plans and intentions their own dedicated causal-pressure section, while `<active_working_set>` may surface a compact pressure précis near the front. Do not claim that plans appear before cast dossiers unless the template order actually changes.

---

## 12. Why CLOCK records become writer-facing pressure

Some clock systems depend on an internal LLM judging when a clock should tick. Continuity Loom does not do that. The human updates records manually.

Therefore, CLOCK records should not be hidden mechanics. They should be writer-facing causal pressure:

- current pressure
- tick trigger
- next threshold
- possible effects
- visibility

The external writer may make a clock visibly tick if the prose earns it. The human then accepts/rejects and updates records.

This keeps clocks useful without pretending the app has an autonomous drama manager.

---

## 13. Why THREAD and STORY QUESTION become OPEN THREAD

THREAD and STORY QUESTION overlap too much. “Dramatic question” also risks importing act-structure vocabulary.

The merged record is OPEN THREAD:

- question
- promise
- unresolved setup
- tension
- mystery
- risk

Open threads are not instructions to close anything. They are unresolved pressures that can color the next local unit.

---

## 14. Why relationships are not shown as raw axes only

Raw axes like `desire=high` are useful for storage but poor prompt material. The writer needs prose-facing pressure.

Bad prompt surface:

```md
Axis: desire. Value: high. Valence: asymmetric.
```

Good prompt surface:

```md
Jon's desire for Ane is immediate, overwhelming, one-sided, and ethically contaminated by her apparent vulnerability.
```

The schema still keeps axis/value metadata for filtering and UI. But the prompt should show `description`, `pressure_text`, and `current_expression`.

---

## 15. Why the prompt allows irreversible events

You want the human reader to be the gate. That means the external writer may generate an irreversible event when strongly supported by the current moment. The accepted prose only becomes continuity if the human accepts it and updates records.

The template permits durable changes but names them clearly:

- secret revelation
- injury
- sex/intimacy
- violence
- arrest
- death
- promise
- object transfer
- major location change
- relationship redefinition
- institutional involvement
- clock threshold tick

The prompt also says not to create durable changes merely for excitement. This preserves creative range while warning against random escalation.

---

## 16. Why the stop rule replaces hard “3–5 beats”

“3–5 beats” is understandable to humans but can become a bad optimization target for LLMs. The model may continue to satisfy the count even after the first real response point has arrived.

The new rule is:

> Render only the next local unit of causally connected forward motion. Stop at the first new response point that would require the author to choose what happens next.

This supports short, sharp outputs. It allows the prose to end mid-conversation, after a refusal, after a question, after a reveal-withheld, after an interruption, or after a practical result changes the situation.

The template keeps `soft_unit_guidance` so the app can say “one approach,” “one short exchange,” “one discovery,” or “one physical maneuver,” but the response-point stop rule outranks length.

---

## 17. Why prose craft is compact but forceful

The original prose-craft section had good instincts: POV discipline, free indirect style, filter-word reduction, concrete grounding, and stopping behavior. The problem was length, section-reference drift, and repeated ideas.

The revised craft block keeps the essentials:

- stay in POV/person/tense
- let POV diction color prose
- preserve active cast voice
- use concrete nouns and embodied verbs
- use interiority only when pressured
- minimize filter words
- render non-POV psychology through behavior
- make dialogue tactical
- avoid closure

This is enough to steer the writer without turning the prompt into an essay about craft.

---

## 18. Placeholder rationale

### `{story_contract}` placeholders

These define the work’s permanent identity: title, premise, tone, content intensity, language register, and setting baseline. They should be included every time because the external writer has no durable memory.

### `{hard_canon_bullets}`

Bullets, not paragraphs. Canon must be easy to scan and hard to misread.

### `{current_authoritative_state}` placeholders

These are the live start facts: time, place, bodies, agency/status, positions, possessions, visible injuries/conditions, environment, line of sight, routes/exits, available time, consent/force conditions, and current locks. They override older material and should be compact enough to scan early.

### `{immediate_handoff}` placeholders

These provide causal launch, not an archive. The handoff tells the writer where prose begins. The handoff must use `prior_accepted_prose_status_or_handoff_note`, not `most_recent_prose_summary`, because accepted prose is not prompt context.

### `{manual_must_render}`, `{manual_may_render_if_naturally_caused}`, `{manual_do_not_force}`

This split reduces ambiguity. It gives the writer the author’s required move, allowed optional developments, and forbidden overreach.

### `{pov_knows}`, `{pov_believes_suspects_misreads}`, `{pov_does_not_know}`

These prevent knowledge leakage and support POV-filtered misread.

### `{audience_knows}`

This enables dramatic irony without giving the POV forbidden information.

### `{writer_visible_hidden_truths}` and reveal placeholders

These let hidden truth shape behavior while protecting secrets.

### `{active_cast_voice_pressure_pins}`

These are compact per-character salience duplicates compiled near `<active_working_set>`. They do not replace full dossiers. They keep the most important current voice constraints near the prompt front.

### `{active_onstage_full_cast_dossiers}`

This is where rich characterization lives. Do not compress active cast here unless the user chooses to. Current-generation voice overrides may also appear here under a clearly labeled temporary line.

### `{present_minor_cast_notes}` and `{offstage_relevance_notes}`

These prevent dossier overload while preserving continuity and pressure.

### `{active_plans}`, `{active_clocks}`, `{active_obligations}`, `{active_consequences}`

These are the causal engines. They justify action, escalation, interruption, refusal, and durable change.

### `{visible_affordances}` and `{unavailable_or_impossible_actions}`

These protect physical continuity and help the writer invent plausible action.

### `{soft_unit_guidance}`

This replaces hard beat counts. It gives a human-readable target while keeping the stop condition dominant.

---

## 19. Why generic facts are split by POV accessibility

The original `{relevant_facts}` placeholder was too broad. A true fact can be writer-visible, audience-visible, hidden from the POV, publicly known, or known only by a non-POV character. A single generic fact bucket invites first-person or close-third leakage.

The corrected prompt splits facts into `pov_accessible_facts` and `writer_visible_or_non_pov_facts`. This uses existing schema data (`known_by`, `audience_visibility`, `pov_access`, and secret lanes) and keeps the prose writer from turning all truth into narrator knowledge.

---

## 20. Why a compiler mapping table is required

A deterministic compiler needs an explicit mapping from prompt placeholders to record types and generation-time fields. Without it, future implementation will quietly invent source rules, silently omit minimum fields, or drift template/schema/rationale out of sync.

The mapping table belongs primarily in `story-record-schema.md`, because the schema is where record types, prompt-compilation behavior, validation requirements, and empty-state behavior meet. The rationale should explain why the table exists; it should not duplicate every row unless needed.

The mapping table must specify:

- prompt section or placeholder;
- source record type or generation-time field;
- whether it is required;
- validation behavior when missing;
- deterministic empty-state rendering;
- notes about authority, POV, reveal, or physical continuity.

---


## 20.1 Why generation validation focus tags are needed

Universal minimum prompt completeness is necessary but not enough. Many blockers are context-dependent. A dialogue-only continuation, an object transfer, a location change, an intimacy scene, a violence/injury moment, and an offstage interruption require different minimum state.

The schema should therefore include generation-time validation focus tags. These tags are not plot structure, beats, arcs, or drama management. They do not tell the story where to go. They tell deterministic validation which completeness checks must pass before the prompt may be generated.

Examples: `physical_interaction_expected`, `dialogue_expected`, `secret_or_clue_pressure`, `object_transfer_possible`, `location_change_possible`, `offstage_interruption_possible`, `intimacy_or_sex_possible`, `violence_or_injury_possible`, `clock_tick_possible`, and `continuation_after_accepted_segment`.

These tags should be selected by the user or by deterministic UI controls. They must not be inferred by an LLM.

---

## 21. Why unresolved compiler warnings must not enter prompts

The schema previously allowed unresolved conflicts to be compiled as a writer-visible `<compiler_warning>`. That contradicts fail-closed validation. If a contradiction is real, prompt generation must block. If a risk is only a warning, it belongs in the app validation surface, not in the prose prompt.

Putting unresolved warnings into the prompt asks the external prose writer to repair continuity, which is exactly the intelligence layer the app rejects.

---

## 22. Source notes

- OpenAI prompt engineering guide: https://developers.openai.com/api/docs/guides/prompt-engineering
- Anthropic prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Google Gemini prompt design strategies: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Liu et al., “Lost in the Middle: How Language Models Use Long Contexts”: https://arxiv.org/abs/2307.03172
- Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks”: https://arxiv.org/abs/2005.11401
- Riedl & Young, “Narrative Planning: Balancing Plot and Character”: https://arxiv.org/abs/1401.3841
- Young, Ware, Cassell & Robertson, “Plans and Planning in Narrative Generation”: https://justusrobertson.com/papers/Young%20Ware%20Cassell%20and%20Robertson%202013%20-%20Plans%20and%20Planning%20in%20Narrative%20Generation.pdf
- Tseng et al., “Two Tales of Persona in LLMs”: https://aclanthology.org/2024.findings-emnlp.969.pdf
- Tang et al., “The Few-shot Dilemma”: https://arxiv.org/html/2509.13196v1
