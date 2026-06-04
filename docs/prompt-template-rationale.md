# Rationale for the Universal Prose Prompt Template

Purpose: durable explanation of the sections, categories, placeholders, and major design decisions in `prompt-template.md`.  
Status: corrected companion rationale aligned with `FOUNDATIONS.md`, `story-record-schema.md`, and `compiler-contract.md`.

---

## 1. Why a Markdown/XML hybrid

The generated prompt mixes role instructions, story facts, current state, hidden truths, character dossiers, physical constraints, invention permissions, and output rules. A flat prose prompt makes these lanes porous. A pure JSON prompt is inspectable for machines but hostile to human authors and unnatural for prose generation.

The recommended form remains Markdown with XML-style section blocks. Markdown keeps the prompt readable. XML-style tags provide stable semantic boundaries such as `<current_authoritative_state>`, `<secrets_and_reveal_constraints>`, `<active_cast_full_dossiers>`, and `<stop_rule>`.

The exact tag names matter less than consistency. The compiler should generate the same section order and tag names for a given template version. Prompt versioning belongs in the application/compiler layer, not in an external reusable prompt object.

## 2. Why the authority hierarchy is not “manual directive above everything”

The manual directive is authorial pressure. It should win over ordinary character reluctance, soft tendencies, and general record pressure. It must not win over hard canon, current authoritative state, physical continuity, POV knowledge boundaries, reveal locks, or external model/provider policy.

That split prevents dangerous prompts such as “have Jon understand why Ane is crying” from granting impossible knowledge. The directive can force contact; it cannot grant non-POV backstory.

Narrative-planning research supports preserving causality and character intentionality, but Continuity Loom uses that lesson without adopting a planner. Plans, intentions, clocks, obligations, and consequences make local action legible; they do not become plot rails.

## 3. Why current authoritative state is separate from immediate handoff

`<current_authoritative_state>` is the live start snapshot: time, place, bodies, positions, agency/status, possessions, visible conditions, line of sight, routes, available time, consent/force conditions, and continuity locks.

`<immediate_handoff>` is the launch ramp: recent causal context, last visible moment, prior accepted prose status or user-authored handoff note, and begin-after instruction.

Keeping these separate is the biggest safeguard after POV/reveal locks. Current state answers “what is true now.” Handoff answers “how did we get here and where does prose begin.” Mixing them invites the prose writer to turn non-POV context into POV knowledge.

## 4. Why `prior_accepted_prose_status_or_handoff_note` stays narrow

The old idea of a most-recent-prose summary is wrong for this app. It points implementers toward mining accepted prose, which violates record-first continuity.

The correct field is `prior_accepted_prose_status_or_handoff_note`. It may render `None`, or it may render a user-authored continuity handoff. It must not contain verbatim accepted prose, rejected candidate text, superseded regeneration text, or an automatic prose-derived summary.

If an accepted segment created a durable change, that change belongs in selected story records, current authoritative state, immediate handoff, or selected event/fact/belief/relationship/emotion/plan/clock/obligation/consequence/open-thread/location/object/affordance/cast records before the next generation.

## 5. Why causal pressure now appears before full cast dossiers

The prompt keeps hard state near the front, and final stop/output instructions at the end. The corrected template also moves active plans, intentions, clocks, obligations, consequences, and open threads before the rich active cast dossiers.

Reason: active cast dossiers can be long. If causal pressure is placed after several long dossiers, the model may underuse it. The active working set already provides a compact pressure précis near the front; the dedicated causal-pressure sections now reinforce that before the prompt enters long characterization material.

This is not plot machinery. These sections do not define arcs, acts, beats, or future structure. They define local causal pressure.

## 6. Why active/onstage cast gets rich dossiers

Active/onstage cast should not be reduced to role labels, moods, diagnoses, or one-line goals. Dialogue and behavior need stable character-specific resources: sentence rhythm, diction, register, vocabulary and metaphor pools, profanity behavior, taboo/avoidance patterns, evasion style, pressure behavior, body, social presentation, perception, agency, and anti-generic warnings.

Present-minor cast gets compressed notes. Offstage cast gets relevance slices. The compiler must not silently compress active/onstage cast due to token budget. It may warn about length and lost-in-the-middle risk, but the user remains the gate.

## 7. Why durable voice anchors are separate from current voice pressure pins

The previous shape put `current_speech_pressure` inside the durable CAST MEMBER dossier. That is a stale-state trap: what a character must do vocally in one local unit changes from generation to generation.

The corrected shape separates:

- durable `voice_anchor`: stable identity, cadence, register, diction, tactics, taboos, avoidance, anti-repetition, and anti-generic constraints;
- generation-time `current_cast_voice_pressure`: what this local moment is doing to the character’s voice;
- compiled `active_cast_voice_pressure_pins`: a deterministic salience duplicate near `<active_working_set>` assembled from the voice anchor, current voice pressure, and any temporary override.

The pin does not replace the full dossier. It prevents generic dialogue when the full dossier is long.

## 8. Why cast voice overrides are generation-time only

`CAST VOICE OVERRIDES` are useful, but dangerous if they become a second persistent character system. They remain generation-time fields only.

The corrected override shape includes target cast member, scope, reason, affected speech/rendering functions, and override text. Overrides may compile into the active cast voice pressure pin. For active/onstage cast, they may also compile into the full dossier under a clearly labeled `Current generation voice override`. For present-minor cast, they compile only into compressed notes.

No override silently updates durable CAST MEMBER identity. If the user wants the change to persist, the user edits the durable dossier manually.

## 9. Why sample utterances stay optional, sparse, and non-copyable by default

Few-shot examples can steer style, cadence, and output format. They can also over-condition the model, encourage mimicry, create phrase echo, and turn voice into catchphrase loops.

Sample utterances therefore remain optional. The default compiled count is zero. At most three may compile for an active/onstage character. They must be annotated with situation, speech function, optional pressure tags, and copy policy. The default copy policy is `never_copy_verbatim`.

Samples should teach speech function and cadence: refusal, bargaining, lying-by-understatement, evasive tenderness, tactical politeness, anger, seduction-as-performance, guarded confession. They should not become a bank of quotable phrases. `canonical_phrase` should be rare and should still carry anti-repetition warnings.

## 10. Why secrets are split into lanes

A single “secret” paragraph is too blunt. The writer may need hidden truth to shape subtext while the POV must not know it.

The template keeps separate lanes for writer-visible hidden truths, holders, protected non-holders, allowed clues, forbidden reveals, and reveal permission. Hidden truth may shape visible behavior, silence, timing, object handling, and evasions. It must not leak into the wrong mind or narrator.

## 11. Why audience knowledge is separate from POV knowledge

Audience knowledge can differ from POV knowledge. Dramatic irony is allowed, but it must not become POV leakage. The audience-knowledge section tells the prose writer which truths can shape reader-facing tension while remaining unavailable to the narrator or current POV.

## 12. Why facts and events are grouped by prompt function

A flat event archive makes the writer guess what matters. Events therefore compile by function: immediate previous, recent causal, relevant backstory, offstage, or withheld.

Facts are split by POV accessibility. A fact may be true but not available to the POV. The prompt therefore separates POV-accessible facts from writer-visible/non-POV facts.

Deprecated facts are not normal prompt-facing records. If a fact is false, it should be removed, revised, or replaced with current state, event, belief, consequence, or another active record. Supersession is a validation diagnostic, not a persistent FACT status.

## 13. Why relationships and emotions need prose-facing pressure

Raw axes are useful for filtering and validation but weak prompt material. `desire=high` is less useful than “Jon’s desire is immediate, one-sided, and ethically contaminated by the girl’s apparent vulnerability.”

The schema keeps structured metadata, but the compiler should render `description`, `pressure_text`, `current_expression`, `behavioral_pressure`, and `surface_expression` when nuance matters.

## 14. Why durable change is allowed but gated by the human

The external writer may create durable or irreversible changes when strongly caused by the current moment: a secret revelation, injury, intimacy, violence, promise, object transfer, major location change, relationship redefinition, institutional involvement, or clock threshold tick.

This is safe only because the human remains the gate. If the user rejects the prose, the change does not become continuity. If the user accepts or edits and accepts it, the user manually updates records.

Durable change should come from current pressure, physical affordance, manual directive, plan step, clock trigger, obligation, consequence, secret reveal permission, or immediate danger. It should not come from genre expectation or the model’s desire to escalate.

## 15. Why the stop rule replaces beat counts

Hard “3–5 beat” instructions can make the model continue after the first real response point. The better rule is local and causal: render the next local unit, then stop when continuing would answer the next question rather than create it.

The `soft_unit_guidance` placeholder can say “one approach,” “one short exchange,” “one discovery,” or “one physical maneuver,” but the response-point stop rule outranks length preference.

## 16. Why generation validation focus tags are validation-only by default

Universal minimum prompt completeness is not enough. Different local modes need different completeness checks: dialogue, physical interaction, object use, object transfer, location change, offstage interruption, intimacy, violence, clock ticks, obligation breach, hidden-plan behavior, and continuation after accepted prose.

Generation validation focus tags activate deterministic checks before compilation. They are not plot beats, act structure, dramatic arcs, or story rails. They should not compile into the generated prompt by default. A future prompt-facing use would need evidence of generation-quality gain and a clear guarantee that it does not become an instruction to force events.

## 17. Why warnings must not enter the prompt

Unresolved contradictions must block. Non-blocking warnings belong in the app validation surface. They should not compile as `<compiler_warning>` or prose-writer instructions.

Putting warnings into the prompt asks the external prose writer to repair continuity. That reintroduces the intelligence layer the app rejects.

## 18. Why a compiler contract is warranted

The template, schema, rationale, and examples are now complex enough that a standalone compiler contract earns its maintenance cost. It gives one authoritative place for prompt section order, placeholder mapping, requiredness, empty-state rendering, validation focus matrix, and blocker/warning classification.

The schema remains the conceptual record model. The compiler contract is the deterministic rendering and validation bridge. Any prompt placeholder change must update the compiler contract in the same change.

## 19. Research notes

Structured sectioning is supported by current provider guidance. Anthropic explicitly recommends XML tags for complex prompts mixing instructions, context, examples, and variable inputs. OpenAI currently emphasizes code-managed, versioned production prompts with typed inputs and tests. Google’s Gemini guidance treats prompt design as iterative and documents structured prompt strategies.

Context research supports curated high-signal context rather than archive dumping. Long-context studies show that models can underuse information buried in the middle of long prompts. RAG research supports explicit external context over relying on model memory. Continuity Loom applies this by compiling selected story records, not accepted prose archives.

Persona and role-playing research supports supplying character profiles for role consistency, but few-shot over-prompting research warns that excessive examples can degrade performance. That is why durable voice anchors are rich, current voice pins are compact, and sample utterances are sparse, annotated, selected, and non-copyable by default.
