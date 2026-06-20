# Rationale for the Universal Prose Prompt Template

Status: active explanation — rationale for prompt-template design choices and section ordering
Authority: support (see docs/ACTIVE-DOCS.md)

---

## 1. Why a Markdown/XML hybrid

The generated prompt mixes role instructions, story facts, current state, hidden truths, character dossiers, physical constraints, invention permissions, and output rules. A flat prose prompt makes these lanes porous. A pure JSON prompt is inspectable for machines but hostile to human authors and unnatural for prose generation.

The recommended form remains Markdown with XML-style section blocks. Markdown keeps the prompt readable. XML-style tags provide stable semantic boundaries such as `<current_authoritative_state>`, `<secrets_and_reveal_constraints>`, `<active_cast_full_dossiers>`, and `<stop_rule>`.

The exact tag names matter less than consistency. The compiler should generate the same section order and tag names for a given template version. Prompt versioning belongs in the application/compiler layer, not in an external reusable prompt object.

## 2. Why the role block says “prose only” without telling the model to ignore policy

The role block must make the external model behave as a prose renderer rather than a planner, validator, critic, or assistant. It should not tell the model that it is “not a safety analyst” in a way that could be read as suppressing provider/platform policy. The corrected wording says not to output policy/safety analysis, validation analysis, notes, choices, or assistant chat. Governing external model/platform policy remains first in the authority hierarchy.

This protects the app’s prose-only contract without turning the prompt into a policy-bypass attempt.

## 3. Why the content policy now exposes story-specific fields

A generic maturity boilerplate is not enough. The schema has `rating_label`, `allowed_content_scope`, `tonal_handling`, and `character_bias_handling`; all four compile into `<content_policy>`. External model/provider/platform policy remains fixed template doctrine rather than editable project data.

This matters because mature-fiction permission, tonal handling, provider-policy priority, and character-bias handling are different concerns. A story may be explicit but non-sensational; violent but restrained; prejudiced in character perception but not narrator-certified; adult-only but still bounded by platform policy. These distinctions should be author-visible and prompt-facing.

The policy block still does not override external model/provider/platform policy. Its job is to keep the prose from becoming assistant moralizing or sanitized generic output when the story configuration permits mature material.

## 4. Why the authority hierarchy is not “manual directive above everything”

The manual directive is authorial pressure. It should win over ordinary character reluctance, soft tendencies, and general record pressure. It must not win over hard canon, current authoritative state, physical continuity, POV knowledge boundaries, reveal locks, or external model/provider policy.

That split prevents dangerous prompts such as “have Jon understand why Ane is crying” from granting impossible knowledge. The directive can force contact; it cannot grant non-POV backstory.

Narrative-planning research supports preserving causality and character intentionality, but Continuity Loom uses that lesson without adopting a planner. Plans, intentions, clocks, obligations, and consequences make local action legible; they do not become plot rails.

## 5. Why current authoritative state is separate from immediate handoff

`<current_authoritative_state>` is the live start snapshot: time, place, onstage bodies, immediate local situation, positions, agency/status, possessions, visible conditions, line of sight, routes, available time, consent/force conditions, and continuity locks.

`<immediate_handoff>` is the launch ramp: recent causal context, last visible moment, and begin-after instruction.

Keeping these separate is the biggest safeguard after POV/reveal locks. Current state answers “what is true now.” Handoff answers “how did we get here and where does prose begin.” Mixing them invites the prose writer to turn non-POV context into POV knowledge.

For a first segment, there is no prior accepted prose and no continuation bridge to supply. Current authoritative state plus the manual directive can be enough to begin. For a continuation after an accepted segment, a user-authored handoff is needed because accepted prose remains excluded from prompt context.

## 6. Why accepted prose stays out of handoff fields

The old idea of a most-recent-prose summary is wrong for this app. It points implementers toward mining accepted prose, which violates record-first continuity.

Continuation launch uses user-authored recent causal context plus a visible or imperative cutpoint. These fields must not contain verbatim accepted prose, rejected candidate text, superseded regeneration text, or an automatic prose-derived summary.

The handoff is a bridge written by the user, not a prose-archive substitute. It may identify the causal hinge or begin-after point for a continuation, but it must not quote accepted prose or let the compiler mine prose into canon.

If an accepted segment created a durable change, that change belongs in selected story records, current authoritative state, immediate handoff, or selected event/fact/belief/relationship/emotion/plan/clock/obligation/consequence/open-thread/location/object/affordance/cast records before the next generation.

## 7. Why causal pressure now appears before full cast dossiers

The prompt keeps hard state near the front, and final stop/output instructions at the end. The corrected template also keeps active plans, intentions, clocks, obligations, consequences, and open threads before the rich active cast dossiers.

Reason: active cast dossiers can be long. If causal pressure is placed after several long dossiers, the model may underuse it. The active working set already provides a compact pressure précis near the front; the dedicated causal-pressure sections reinforce that before the prompt enters long characterization material.

This is not plot machinery. These sections do not define arcs, acts, beats, or future structure. They define local causal pressure.

### 7.x Salience duplicates vs redundant restatement

The active working set is a salience device, not a duplicate archive. A record may appear in the active working set and later in its full detail section when the two renderings perform different jobs: current causal pressure, behavior/interiority pressure, reveal safety, physical constraint, or voice salience. The compiler should avoid same-framing repeats where a front pressure line merely repeats an ordinary fact, event description, or affordance action text already rendered later with no additional current-pressure function.

## 8. Why active/onstage cast gets rich dossiers

Active/onstage cast should not be reduced to role labels, moods, diagnoses, or one-line goals. Dialogue and behavior need stable character-specific resources: rhythm and syntax, register and diction, vocabulary and metaphor pools, profanity behavior, taboo and avoidance patterns, address/naming habits, silence/interruption/turn-taking behavior, evasion style, pressure behavior, body, social presentation, perception, agency, and anti-generic warnings.

Present-minor cast gets compressed notes. Offstage cast gets relevance slices. The compiler must not silently compress active/onstage cast due to token budget. It may warn about length and lost-in-the-middle risk, but the user remains the gate.

Within active/onstage dossiers, structured fields should render core-first: identity, durable voice anchor plus voice-related extended fields, pressure behavior core, body presence core, agency core, then remaining optional extended fields in schema order, with selected sample utterances last. This is a salience rule, not a deletion rule. It keeps voice and immediate behavior from being buried under optional backstory while preserving every populated active/onstage field.

Material pressure is the prose-only salience lane for current physical and institutional constraints. It may include selected non-person ENTITY kind/description alongside entity-status, location, and object pressure; person ENTITY records stay out of that lane so they do not duplicate CAST MEMBER authority. LOCATION detail rendering also carries hazards/shelters and social rules because those fields are movement, access, and behavior constraints, not decorative setting.

## 9. Why active/onstage local-function sub-bands are validation aids, not compression rules

The schema now lets active/onstage cast be labeled by local function: POV narrator, active speaker, active silent, close non-POV, physically active, or materially referenced.

These labels answer a validation question: what minimum pressure does this character need for this generation? An active speaker needs a speech-capable voice pin. A close POV narrator needs narration pressure. An active silent character may need body/presence/silence pressure rather than dialogue pressure. An ensemble scene needs relationship/status context among speakers.

The labels must not become a hidden token-budget mechanism. If a character is active/onstage full, all populated dossier fields compile.

## 10. Why durable voice anchors are separate from current voice pressure pins

The previous shape put `current_speech_pressure` inside the durable CAST MEMBER dossier. That is a stale-state trap: what a character must do vocally in one local unit changes from generation to generation.

The corrected shape separates:

- durable `voice_anchor`: stable identity, rhythm, syntax, register, diction, vocabulary, metaphor pool, tactics, taboos, avoidance, turn-taking, anti-repetition, and anti-generic constraints;
- generation-time `current_cast_voice_pressure`: what this local moment is doing to dialogue, POV narration, nonverbal behavior, silence, and turn-taking;
- compiled `active_cast_voice_pressure_pins`: deterministic salience duplicates near `<active_working_set>` assembled from the voice anchor, current voice pressure, active working-set local function, and any temporary override.

The pin does not replace the full dossier. It prevents generic dialogue and generic close narration when the full dossier is long.

Voice pins remain protected salience duplicates. They should not be removed for token-budget reasons while active/onstage cast dossiers are long. The pin is the current-generation voice pressure; the dossier is the durable character authority.

Durable CAST MEMBER fields are the primary voice authority. Current voice pressure pins are optional scene-specific emphasis. Missing pins are usually salience warnings, not blockers, when durable voice anchors and body/behavior dossiers are sufficient. A missing pin becomes blocking only when the selected local mode needs voice/body authority and no durable, compressed, or current source can supply it, or when supplied current pressure contradicts higher authority.

Present-minor supplied current pressure is rendered in prose prompts inside the compressed present-minor notes, not in a separate voice-pressure lane. The ideation prompt omits that prose-delivery pressure.

## 11. Why cast voice overrides are generation-time only

`CAST VOICE OVERRIDES` are useful, but dangerous if they become a second persistent character system. They remain generation-time fields only.

The override shape includes target cast member, an author-only reason, affected speech/rendering functions, and override text. The block is intrinsically current-generation-only. Only the affected surfaces and override text compile into prompt output; the reason stays local author metadata. Overrides may compile into the active cast voice pressure pin. For active/onstage cast, they may also compile into the full dossier under a clearly labeled `Current generation voice override`. For present-minor cast, they compile only into compressed notes.

No override silently updates durable CAST MEMBER identity. If the user wants the change to persist, the user edits the durable dossier manually.

## 12. Why sample utterances stay optional, sparse, and non-copyable by default

Few-shot examples can steer style, cadence, and output format. They can also over-condition the model, encourage mimicry, create phrase echo, and turn voice into catchphrase loops.

Sample utterances therefore remain optional. The default compiled count is zero. At most three may compile for an active/onstage character. Each compiled sample should be one short line, normally no more than about 40 words. They must be annotated with situation, speech function, optional pressure tags, and copy policy. The default copy policy is `never_copy_verbatim`.

The previous `may_echo_lightly` copy policy was too permissive and too vague. It is replaced by `may_reuse_cadence_not_text`, which permits rhythm, register, speech function, or tactical pattern transfer without close wording reuse. `canonical_phrase` should be rare and should still carry anti-repetition warnings.

Samples should teach speech function and cadence: refusal, bargaining, lying-by-understatement, evasive tenderness, tactical politeness, anger, seduction-as-performance, guarded confession. They should not become a bank of quotable phrases.

## 13. Why secrets are split into lanes

A single “secret” paragraph is too blunt. The writer may need hidden truth to shape subtext while the POV must not know it.

The template keeps separate lanes for writer-visible hidden truths, holders, protected non-holders, allowed clues, forbidden reveals, and reveal permission. Hidden truth may shape visible behavior, silence, timing, object handling, and evasions. It must not leak into the wrong mind or narrator.

## 14. Why audience knowledge is separate from POV knowledge

Audience knowledge can differ from POV knowledge. Dramatic irony is allowed, but it must not become POV leakage. The audience-knowledge section tells the prose writer which truths can shape reader-facing tension while remaining unavailable to the narrator or current POV.

Ambiguous audience perception is a third audience state between hidden and known, so it is preserved as unresolved reader inference instead of being collapsed into either binary lane.

## 15. Why facts and events are grouped by prompt function

A flat event archive makes the writer guess what matters. Events therefore compile by function: immediate previous, recent causal, relevant backstory, offstage, or withheld.

Facts are split by POV accessibility. A fact may be true but not available to the POV. The prompt therefore separates POV-accessible facts from writer-visible/non-POV facts.

POV accessibility is keyed to one effective POV resolved from PROSE MODE and the generation brief. `variable` is only a configuration sentinel; ready prompts must resolve it to a concrete selected POV or block before prompt compilation.

Deprecated facts are not normal prompt-facing records. If a fact is false, it should be removed, revised, or replaced with current state, event, belief, consequence, or another active record. FACT active truth is implicit in the record category; supersession is a validation diagnostic, not a persistent FACT status.

## 16. Why relationships and emotions need prose-facing pressure

Raw axes are useful for filtering and validation but weak prompt material. `desire=high` is less useful than “Jon’s desire is immediate, one-sided, and ethically contaminated by the girl’s apparent vulnerability.”

The schema keeps structured metadata, but the compiler should render `description`, `pressure_text`, `current_expression`, `behavioral_pressure`, and `surface_expression` when nuance matters.

## 17. Why low-drama prose gets an explicit craft warning, not a plot mechanism

Low-drama scenes are a real stress case. If the app only protects action, secrets, and physical continuity, quiet literary openings can degrade into generic filler or manufactured incident.

The prompt therefore tells the prose writer to preserve pressure through exact perception, rhythm, gesture, omission, and subtext rather than inventing drama. This is prose craft, not a validation tag or plot rail. The stress suite should test it, but the validator should not pretend it can deterministically certify literary quality.

## 18. Why durable change is allowed but gated by the human

The external writer may create durable or irreversible changes when strongly caused by the current moment: a secret revelation, injury, intimacy, violence, promise, object transfer, major location change, relationship redefinition, institutional involvement, or clock threshold tick.

This is safe only because the human remains the gate. If the user rejects the prose, the change does not become continuity. If the user accepts or edits and accepts it, the user manually updates records.

Durable change should come from current pressure, physical affordance, manual directive, plan step, clock trigger, obligation, consequence, secret reveal permission, or immediate danger. It should not come from genre expectation or the model’s desire to escalate.

## 19. Why the stop rule replaces beat counts

Hard “3–5 beat” instructions can make the model continue after the first real response point. The better rule is local and causal: render the next local unit, then stop when continuing would answer the next question rather than create it.

The `soft_unit_guidance` placeholder can say “one approach,” “one short exchange,” “one discovery,” or “one physical maneuver,” but the response-point stop rule outranks length preference. Stop guidance is optional user narrowing, not a universal readiness field. Validation should block a directive or supplied stop guidance that asks for a whole chapter, global outline, alternate options, future consequences, plot beats, or multiple response points.

Blank `soft_unit_guidance` is not a prompt-contract failure. The universal stop rule already defines the boundary, so optional user guidance narrows the local unit only when supplied. Validation should still block supplied guidance that is nonlocal or contradicts the manual directive.

## 20. Why generation validation focus tags are validation-only by default

Universal minimum prompt completeness is not enough. Different local modes need different completeness checks: dialogue, ensemble dialogue, introspection, physical interaction, active silent presence, ambiguous perception, present-minor speech, offstage interruption, nonhuman/institutional pressure, object use, object transfer, location change, intimacy, violence, clock ticks, obligation breach, hidden-plan behavior, and continuation after accepted prose.

Generation validation focus tags activate deterministic checks before compilation. They are not plot beats, act structure, dramatic arcs, or story rails. They should not compile into the generated prompt by default. A future prompt-facing use would need evidence of generation-quality gain and a clear guarantee that it does not become an instruction to force events.

Generation context may be defaulted deterministically from accepted-segment count: no accepted segments means first segment, and one or more accepted segments means continuation after accepted segment. That default is project state, not story invention. Other focus tags should come from explicit controls or records, not LLM interpretation of prose.

## 21. Why warnings must not enter the prompt

Unresolved contradictions must block. Non-blocking warnings belong in the app validation surface. They should not compile as `<compiler_warning>` or prose-writer instructions.

Putting warnings into the prompt asks the external prose writer to repair continuity. That reintroduces the intelligence layer the app rejects.

Warnings must not indirectly gate Preview or Generate. If a diagnostic is serious enough to block compilation or sending, it is not a warning; it must be classified as a deterministic blocker with a concrete condition and author-facing fix.

## 22. Why a compiler contract is warranted

The template, schema, rationale, examples, and stress suite are complex enough that a standalone compiler contract earns its maintenance cost. It gives one authoritative place for prompt section order, placeholder mapping, requiredness, empty-state rendering, validation focus matrix, and blocker/warning classification.

The schema remains the conceptual record model. The compiler contract is the deterministic rendering and validation bridge. Any prompt placeholder change must update the compiler contract in the same change.

## 23. Why draft saving is separate from readiness

Draft persistence protects author work. A generation brief can be incomplete, locally messy, or missing readiness fields while the author is still shaping the next launch.

Readiness protects prompt preview, deterministic compilation, OpenRouter sending, and candidate generation. It checks whether the normalized ready input can produce a structurally valid, local, non-leaking prompt. The app should be able to save a draft and still say that Preview or Generate is blocked by required readiness items.

Keeping these states separate prevents validation from trapping the author outside the form state needed to fix blockers, while preserving fail-closed behavior for compilation and provider send.

## 24. Research notes

Provider guidance supports clear, structured prompts. Anthropic recommends XML tags for complex prompts that mix instructions, context, examples, and variable inputs. OpenAI guidance emphasizes clear instructions and separating instructions from context. Google’s Gemini documentation treats prompt design as iterative and supports structured prompt strategies.

Context research supports curated high-signal context rather than archive dumping. Long-context studies show that models can underuse information buried in the middle of long prompts. RAG research supports explicit external context over relying on model memory. Continuity Loom applies this by compiling selected story records, not accepted prose archives.

Persona and role-playing research supports supplying character profiles for role consistency, but few-shot over-prompting research warns that excessive examples can degrade performance. That is why durable voice anchors are rich, current voice pins are compact, and sample utterances are sparse, annotated, selected, and non-copyable by default.
