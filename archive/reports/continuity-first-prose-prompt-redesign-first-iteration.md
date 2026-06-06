# **Research-backed redesign report for the continuity-first prose prompt**

The uploaded mission asks for a universal generated-prompt surface for an external prose-writing LLM, not an app plan, not a record updater, and not a dramatic-act engine. It also explicitly prioritizes continuity, physical state, secret handling, POV discipline, vivid dramatization, and prose-only output. I treated `prompt-1.md` as the baseline stress-test prompt.

## **1. Research basis and core design verdict**

The right prompt surface is **not a dossier dump**. It should be a **compiled working brief**: hard state first, immediate handoff second, authorial instruction third, then only the active records that can affect the next prose segment.

Three research-backed ideas matter most here.

First, prompt structure matters. OpenAI’s prompt-engineering guidance says Markdown and XML-like sectioning help models understand logical boundaries and hierarchy, while XML attributes can carry metadata for context blocks. Anthropic’s Claude docs say XML tags reduce misinterpretation when prompts mix instructions, context, examples, and variable inputs, and recommend long-context prompts be deliberately structured rather than dumped.

Second, long context is not free. “Lost in the Middle” found that model performance can degrade depending on where relevant information appears, with performance often strongest when information is near the beginning or end of the context. That means the app should place the highest-priority continuity constraints near the top and repeat the final writing command and stop rule at the bottom. It also means compressing a character dossier into an **operative slice** usually beats pasting a full biography.

Third, continuity-first narrative generation is better modeled as **state + agents + goals + affordances + causal pressure** than as act structure. RAG research supports explicit retrieval/selection over relying on a model’s parametric memory, and found retrieval-augmented generation more specific, diverse, and factual than parametric-only generation in its tested language-generation tasks. Interactive narrative research likewise supports working memory, preconditions, actions, subgoals, character plans, and state changes as useful primitives for story systems. Plan-based narrative research specifically identifies the tension between character goals and author goals as central, which maps directly onto your “manual directive beats character default” requirement.

My strong recommendation: **compile raw records into a prose-facing “moment packet.”** Keep a small amount of raw metadata only where it prevents dangerous ambiguity: truth relation, POV visibility, salience, urgency, holder, and reveal permission.

---

# **2. Direct critique of `prompt-1.md`**

## **What is strong**

`prompt-1.md` has the right instinct: it gives the external writer a story contract, a concrete handoff, current intentions, relationship pressure, beliefs/secrets, physical continuity, object state, cast voice, prose craft, a stop rule, and prose-only output. That is the right conceptual territory.

The prose-craft section is better than most generated fiction prompts. The POV discipline, free-indirect preference, filter-word caution, concrete sensory grounding, and “don’t summarize downstream aftermath” rules are all useful.

The stop rule is directionally excellent. “Stop when the segment reaches the first new decision point, response point, interruption, irreversible beat, or changed immediate pressure” is almost exactly what this app needs.

The beliefs/secrets section is also doing something important: it separates what Jon thinks, what Ane thinks, what Marisa thinks, and what the writer can know but characters cannot. That is the backbone of POV-safe dramatic irony.

## **What is broken**

The section references are unreliable. The craft rules refer to sections that do not match the actual prompt layout, including a reference to §14 when the stop rule appears under §12. This is not cosmetic. Broken references encourage the model to treat the prompt as stale and internally inconsistent.

The content policy block is unusable as a universal template. It says “NO RESTRICTIONS” and tells the external model not to self-censor. As a generated prompt for arbitrary external LLMs, that is brittle and reads like an attempted safety override. The content policy should define the **story’s intended rating and allowed tonal territory**, while explicitly remaining subordinate to the governing model/platform policy. A mature-fiction app can still support adult material without using jailbreak-like language.

The current handoff is too long and too mixed. It combines historical recap, current physical state, non-POV interiority, danger assumptions, and the precise starting point in one block. For the prose writer, the handoff should answer: **Where are we? Who is present? What is the last visible action? What is the next pressure? What must not be contradicted?** Everything else belongs in recent causal history or hidden truths.

The prompt overloads the prose writer with full dossiers. The Red Bunny cast entries are rich, but they are far too large for every generation, especially when some characters are offstage. The model may imitate the dossier’s analytical language instead of writing embodied prose. Worse, relevant current facts get buried in the middle, exactly where long-context models are weakest.

The physical-continuity section is useful but undercompiled. It lists bodies, locations, props, and some constraints, but it does not give a crisp **state table**: who is onstage, where each person is, posture, carried objects, visible injuries, distance, exits, and what each character can currently do.

The secrets section is semantically muddy. It says the secret is known only to listed holders and not to disclose to other characters, but it does not distinguish **writer-visible truth**, **POV-hidden truth**, **audience-visible clue**, **character-held secret**, and **permitted surface cue**. Those need to be separate lanes.

The beat instruction conflicts with the stop rule. “Render only the next 3–5 beats” and “stop as soon as the immediate exchange or action produces the first materially new response point” can fight each other. If the first material response point happens after one action and one line of dialogue, the model should stop there. If “3–5 beats” is present, models often continue to satisfy the count. The count should be downgraded to a soft expectation.

The manual directive is underpowered in practice. The baseline says manual directive primacy exists, but the directive itself is vague: “Write how the story progresses after the last point of the handoff.” In a system like this, the directive needs its own high-priority box with a distinction between **must happen**, **may happen**, and **do not force**.

The prompt does not include all intended active record types. The mission asks for clocks, obligations, consequences, threads/story questions, visible affordances, plans, and a distinction between hard canon/current state/current situation. `prompt-1.md` has intentions and relationships, but it lacks a full prompt-facing structure for these record families.

The prompt risks turning character prejudice into world fact. In the Red Bunny baseline, demographic threat perception appears in the handoff and character psychology. The compiler must label such material as **character belief, fear, bias, local history, or witnessed event**, not as an authoritative demographic rule. Otherwise the prose writer may convert a character’s threat model into narrator-certified reality.

## **What is redundant**

The cast dossiers repeat similar material across “identity,” “world pressure,” “pressure behavior,” “perception,” and “agency.” Much of that is useful at story-development time, but not all of it belongs in every prose-generation prompt.

The prose-craft section repeats the same principle in several forms: stay in POV, avoid filter words, ground abstractions, dramatize. Good principle, too much surface area. The external writer needs a compact craft spec, not a mini-essay, unless the user is actively tuning style.

The output instructions appear only at the end. They should appear both at the top in the role/authority section and at the end as the last thing the model reads.

---

# **3. Redesigned prompt architecture**

## **Recommended authority hierarchy**

Use this hierarchy, not the candidate hierarchy as written:

1. **Governing model/platform policy and application safety envelope**  
    This is not optional. The generated prompt should not attempt to override higher-priority rules.  
2. **External prose-writer role and output contract**  
    The model is a prose renderer only: no analysis, no choices, no record updates, no commentary.  
3. **Hard canon and current authoritative state**  
    These override everything below. They include identity, location, time, physical facts, known accepted events, and current entity status.  
4. **Physical continuity and reveal constraints**  
    No teleporting, impossible object use, impossible knowledge, or wrong-character secret leakage.  
5. **Manual moment directive**  
    This wins over character defaults, soft tendencies, normal avoidance, and general pressure. It does **not** override hard continuity or reveal rules.  
6. **Immediate handoff / last visible moment**  
    The starting point for prose.  
7. **Active plans, intentions, clocks, obligations, consequences**  
    These drive causal motion.  
8. **Beliefs, relationships, emotions, current pressure**  
    These shape interpretation, choices, dialogue, and friction.  
9. **Active cast voice and behavior slice**  
    Characterization shapes rendering, but does not veto the directive unless hard continuity is violated.  
10. **Tone, prose mode, craft preferences**  
     These shape style.  
11. **Optional texture and local invention permissions**  
     Background people, incidental objects, weather, minor frictions, sublocations, gestures.

Why this order: the manual directive should absolutely beat “this character usually avoids contact,” but it should not beat “this character is not in the room,” “the POV character does not know that secret,” or “the gun is not loaded.” Plan-based narrative research frames author goals and character goals as a real tension; good systems reconcile them rather than letting either side blindly dominate.

## **Section order**

Use this order in the generated prompt:

1. **Role and non-output contract**  
2. **Authority hierarchy**  
3. **Content policy**  
4. **Story contract**  
5. **Prose mode**  
6. **Current authoritative state**  
7. **Immediate handoff**  
8. **Manual directive**  
9. **POV and knowledge boundaries**  
10. **Secrets and reveal rules**  
11. **Active working set**  
12. **Physical continuity**  
13. **Cast slices**  
14. **Offstage relevance**  
15. **Affordances**  
16. **Invention permissions and durability gates**  
17. **Contradiction prohibitions**  
18. **Prose craft**  
19. **Stop rule**  
20. **Final output instruction**

This puts high-priority rules up front, keeps state and handoff before detailed characterization, and repeats the final writing command at the end. The ordering is consistent with structured-prompt guidance and mitigates long-context retrieval weakness by keeping critical instructions near the beginning and end.

---

# **4. How the redesigned prompt should distinguish the major record types**

## **Hard canon**

Hard canon is accepted story truth that must not be contradicted. It should be short, current, and explicit.

Good prompt-facing form:

<hard_canon>  
- Jon is 41, lives in Irún, and is the selected first-person POV.  
- Ane is 18.  
- Jon does not yet know Ane’s name.  
- The accepted continuity contains no previous meeting between Jon and Ane.  
</hard_canon>

Do not bury hard canon in a paragraph.

## **Current authoritative state**

This is the **state snapshot at generation time**. It should override older records.

<current_state>  
Time: Friday, April 2026, about 18:30.  
Location: isolated park strip near Leka Enea school, Irún.  
Onstage: Jon standing on the path; Ane seated on a wooden bench.  
Objects: Jon carries a plastic bag containing The Passenger; Ane carries a small purse with phone and ID.  
Visible facts: Ane’s eyes are red-rimmed; one arm is bruised; she is dressed in pink working clothes.  
</current_state>

## **Current situation / handoff**

This should be a compact launch ramp, not a recap archive. It should end at the precise starting image.

## **Manual directive**

The directive needs three fields:

<manual_directive priority="high">  
Must render: {must_render}  
May render if naturally caused: {may_render}  
Do not force: {do_not_force}  
</manual_directive>

When the user supplies only a vague directive, the compiler should transform it into a local prose task: “Continue from the last visible moment; render Jon’s first approach or non-approach until Ane’s first materially new response.”

## **Active working-set records**

These are records selected for current generation. They should be grouped by causal function, not by database category.

Best grouping:

* **Action pressure:** intentions, plans, clocks, obligations, consequences.  
* **Knowledge pressure:** facts, beliefs, secrets, clues, withheld information.  
* **Relationship pressure:** trust, fear, desire, power imbalance, resentment.  
* **Material pressure:** objects, locations, exits, injuries, tools, access, weather, witnesses.  
* **Voice pressure:** active cast slices.

## **POV knowledge**

Separate three categories:

<pov_knowledge>  
POV knows:  
- {known facts}

POV believes/suspects:  
- {belief with confidence and basis}

POV does not know:  
- {secrets, names, motives, facts}  
</pov_knowledge>

Never put a hidden truth only in a general facts section if the POV cannot know it.

## **Audience knowledge**

Audience knowledge is separate from POV knowledge. It matters because a first-person narrator may not know something the reader has already learned. The prose can exploit visible dramatic irony without violating POV.

<audience_knowledge>  
Audience already knows:  
- {truth or previous event}  
POV does not know:  
- {same fact from POV boundary}  
Permitted use:  
- Let the fact shape non-POV behavior and surface clues; do not narrate it as Jon’s knowledge.  
</audience_knowledge>

## **Writer-visible hidden truths**

These are backstage truths for behavior shaping.

<writer_visible_hidden_truths>  
- Truth: {secret}  
 Held by: {holders}  
 POV access: hidden  
 Audience access: {hidden|visible|ambiguous}  
 Allowed surface cues now: {clues}  
 Forbidden now: {explicit reveal, confession, narrator statement}  
</writer_visible_hidden_truths>

This prevents leakage while still letting the model write behavior with subtext.

## **Secrets not to reveal**

The prompt should include an explicit reveal lock:

<reveal_locks>  
- Do not have Jon know, name, infer with certainty, or narrate {secret}.  
- Do not have Ane disclose {secret} unless the manual directive explicitly calls for disclosure or immediate pressure makes it unavoidable.  
- Permitted: ambiguous behavioral signs, guarded evasions, misread cues.  
</reveal_locks>

## **Physical continuity**

Use a table-like compact form:

<physical_continuity>  
- Jon: standing/walking; carrying {object}; distance from Ane {distance}; route {route}; visible to Ane {yes/no}.  
- Ane: seated; posture {posture}; visible injury {injury}; belongings {objects}; exits {exits}.  
- Location: {layout}; nearby witnesses {witnesses}; obstacles {obstacles}; weather/light {conditions}.  
- Impossible now: {actions impossible without new movement or time passing}.  
</physical_continuity>

## **Active cast vs offstage cast**

Active/onstage cast should get a **prose slice**. Offstage cast should get a **pressure note**.

Active cast slice:

* one-line identity  
* current want/fear  
* public mask  
* private pressure  
* voice/diction  
* body/presence  
* current behavior constraints  
* do-not-write warnings

Offstage cast slice:

* why they matter now  
* whether they can interrupt  
* what influence they exert from offstage  
* what not to reveal or narrate

## **Affordances**

Affordances should tell the model what actions are physically, socially, and causally available.

<visible_affordances>  
- Jon can: approach, keep distance, speak, leave, offer practical help, observe visible injury, use phone, continue route.  
- Ane can: ignore him, leave, bargain, refuse, threaten exposure, ask for help, test whether he is dangerous.  
- Environment can: admit dog-walker interruption, passing traffic noise, fading daylight, school fence, bushes, bench, path.  
</visible_affordances>

Do not just list action-family taxonomy. Translate it into current possible actions.

## **Plans, clocks, obligations, consequences**

These should be compiled as pressure, not database dumps.

<active_pressure>  
Plans:  
- Ane: avoid home and avoid station-area route tonight; blocker: no safe destination.  
- Jon: resolve approach/withdrawal pressure; blocker: fear of becoming predatory.

Clocks:  
- Exposure/danger: daylight is fading; returning through the station area becomes more frightening after dark.  
 Next threshold: Ane must choose a route, shelter, client, or person to engage.

Consequences:  
- Ane’s bruised arm and distress make ordinary public composure harder.  
</active_pressure>

## **Story questions**

Rename “story questions” to **open threads** in the prompt. “Dramatic question” is not fatal, but it smells like structure machinery. Use:

<open_threads>  
- Will Jon approach or preserve his isolation?  
- Will Ane treat Jon as danger, client, rescuer, or nuisance?  
- Can help be offered without becoming possession?  
</open_threads>

## **Prose craft rules**

Keep them compact and imperative. The current prose-craft section is good but too essay-like. The external writer does not need a lesson; it needs constraints.

---

# **5. Prompt compiler contract**

## **Compiler principle**

The compiler’s job is to create a **moment packet**, not export the database. Every included record must answer one of these questions:

1. What must not be contradicted?  
2. What can the POV know, misread, or not know?  
3. What pressure acts on the next local action?  
4. What can physically happen now?  
5. What voice/body/relationship constraints shape the prose?  
6. What should the output stop after?

If a record does not affect one of those, omit it.

## **Active record selection**

Include records with one of these relevance triggers:

* onstage entity  
* entity directly perceived by POV  
* object carried, visible, usable, missing, or desired  
* location currently occupied or immediately reachable  
* current intention, plan, clock, obligation, consequence  
* relationship with an onstage or imminently interrupting entity  
* belief that changes interpretation of the immediate moment  
* secret with available clue or active concealment behavior  
* event from the last prose segment or directly causal backstory  
* manual directive dependency

Exclude records that are true but inert.

## **Active/on-location cast**

For the POV character: include the richest slice, because POV diction drives every sentence.

For onstage non-POV cast: include current behavior, visible body/presence, voice, likely tactics, private hidden truth if needed for subtext, and reveal locks.

For offstage cast: include only what can pressure this moment. Do not paste their full dossier.

Recommended cast slice length:

* POV: 250–500 words  
* onstage major non-POV: 200–400 words  
* onstage minor: 50–150 words  
* offstage pressure source: 25–120 words  
* background entity: one line or omit

## **Beliefs**

Group beliefs by holder and by prose function:

Beliefs shaping POV narration:  
- Jon believes/suspects...

Beliefs shaping non-POV behavior:  
- Ane believes/suspects... [writer may use for behavior only; do not narrate her interior in Jon POV]

Dramatic irony:  
- Truth differs from POV belief...

Keep truth relation, confidence, and access route when they prevent mistakes. Otherwise compile them into prose-facing wording.

Remove `branch_counterfactual`. Since there are no branches, use `retired_continuity`, `alternate_draft`, or keep those records outside canonical prompt generation.

## **Secrets**

Never show secrets as plain facts without reveal metadata. Use four lanes:

1. **Writer-visible hidden truth**  
2. **Who knows**  
3. **Who does not know**  
4. **Allowed clues / forbidden reveals now**

This is the single biggest continuity safeguard after physical state.

## **Plans**

Plans should strongly drive prose only when the current step is feasible or blocked in the current moment.

Prompt form:

- Holder:  
 Objective:  
 Current step:  
 Resources:  
 Blockers:  
 Likely fallback:  
 May cause durable change: yes/no/only if directive supports

Do not include old or suspended plans unless they explain current behavior.

## **Clocks**

Clocks should appear only if they can tick through time, action, exposure, pursuit, worsening condition, or missed opportunity.

Prompt form:

- Clock:  
 Visibility:  
 Current pressure:  
 Tick trigger:  
 Next threshold:  
 What changes if it ticks:

Clocks are one of the cleanest justifications for escalation.

## **Relationships**

Do not show raw relationship axes except as metadata. Compile them into relationship pressure:

Bad:

Axis: desire, Value: high, Valence: asymmetric

Good:

Jon is pulled toward Ane with a desire he recognizes as dangerous; Ane has no relationship with him yet and will sort him as possible threat, client, or interruption.

Keep the raw axis in brackets only when useful:

[desire: high/asymmetric; power_imbalance: high]

## **Objects and affordances**

Every object should include:

* holder/location  
* visibility to POV  
* usable actions  
* constraints  
* whether it can become durable continuity

Example:

Plastic bag with book — carried by Jon, visible in his hand; can rustle, signal harmless errand, occupy one hand, become a pretext for conversation; should not become a weapon unless the manual directive or danger clock justifies it.

## **Event history**

Split events into:

1. **Immediate previous event:** last accepted prose / last visible handoff.  
2. **Recent causal chain:** what directly causes current emotions and constraints.  
3. **Relevant backstory:** only what changes current behavior.  
4. **Withheld/offstage event:** writer-visible only; do not reveal unless permitted.

Do not provide a flat event archive.

## **Conflict handling**

The app should warn before generation when:

* two current locations conflict  
* an object has two holders  
* a dead/incapacitated character has active plans  
* POV knows a secret that reveal rules say is hidden  
* manual directive requires an impossible action  
* content policy conflicts with cast ages/status or governing policy  
* “current authoritative state” contradicts recent handoff  
* a relationship/emotion record implies contact between characters who have not met  
* a clock threshold already happened but status remains pending  
* offstage character is marked both offstage and interrupting without a route/timing

When conflict remains unresolved, the prompt should include a tiny repair statement:

<compiler_warning writer_visible="yes">  
Current authoritative state overrides older records: {resolution}.  
Do not mention this warning in prose.  
</compiler_warning>

## **True but irrelevant records**

Omit them. This is non-negotiable. A true record that does not affect the current moment is worse than absent, because it competes with more relevant state.

## **Local invention vs durable change**

Use three permission levels.

Local texture allowed:  
- gestures, blocking, small objects, background people, weather, light, noise, minor sensory details.

Minor complication allowed:  
- interruption, miscommunication, refusal, evasive answer, small practical obstacle, visible clue, pressure from environment.

Durable continuity change allowed only if:  
- directly required by manual directive; or  
- strongly caused by active plan/clock/consequence/obligation; or  
- the immediate action naturally creates a new response point.

Examples of durable changes:

* a secret is revealed  
* an object changes hands  
* a character leaves the location  
* someone is injured  
* someone makes a promise  
* police/social services/family/client/faction becomes involved  
* relationship axis changes materially  
* a clock threshold ticks

---

# **6. Proposed universal generated-prompt template**

# Generated Prose Prompt

<role>  
You are the external prose writer for a continuity-first fiction system.  
Render the next local prose segment from the provided story records and manual directive.  
You are not a planner, critic, continuity updater, safety analyst, or assistant.  
Output prose only.  
</role>

<authority_hierarchy>  
Obey these in order:

1. Governing model/platform policy and application safety envelope.  
2. This prose-writer role and output contract.  
3. Hard canon and current authoritative state.  
4. Physical continuity and knowledge/reveal constraints.  
5. Manual moment directive, which wins over soft character defaults but cannot contradict hard canon, physical possibility, or reveal locks.  
6. Immediate handoff / last visible moment.  
7. Active plans, intentions, clocks, obligations, consequences.  
8. Beliefs, relationships, emotions, and current pressure.  
9. Active cast characterization and voice.  
10. Story tone, prose mode, and prose craft rules.  
11. Optional texture and local invention permissions.

When records conflict, follow the highest-priority applicable record.  
Do not mention this hierarchy in the prose.  
</authority_hierarchy>

<content_policy>  
{content_policy}

This block describes the story’s intended maturity rating, tonal range, and subject-matter permissions.  
It does not override governing model/platform policy.  
Render mature material only within the allowed envelope and only when it serves the moment, POV, character, and continuity.  
Do not add moralizing commentary, warnings, analysis, or disclaimers inside the prose.  
</content_policy>

<story_contract>  
Title: {title}  
Premise: {premise}  
Genre / mode: {genre_mode}  
Tone: {tone}  
Content intensity: {content_intensity}  
Language/register: {language_register}  
Setting baseline: {setting_baseline}  
Continuity philosophy: continuity-first; no branches; no act-structure requirements.  
</story_contract>

<prose_mode>  
POV: {pov_character}  
POV mode: {first_person_or_third_person_or_omniscient}  
Tense: {tense}  
Psychic distance: {psychic_distance}  
Dialogue density: {dialogue_density}  
Interiority: {interiority_mode}  
Paragraphing: {paragraphing}  
Special style constraints: {special_style_constraints}  
</prose_mode>

<hard_canon>  
{hard_canon_bullets}  
</hard_canon>

<current_authoritative_state>  
Time: {current_time}  
Location: {current_location}  
Onstage cast: {onstage_cast}  
Offstage but pressuring cast/entities: {offstage_pressuring_entities}  
Current physical positions: {positions}  
Current agency/status: {entity_statuses}  
Current possessions: {possessions}  
Current visible injuries/conditions: {visible_conditions}  
Current environmental conditions: {environment}  
Current continuity locks: {current_locks}  
</current_authoritative_state>

<immediate_handoff>  
Recent causal context:  
{recent_causal_context}

Last visible moment:  
{last_visible_moment}

Begin prose exactly after this point. Do not recap except through brief POV-colored perception or pressure.  
</immediate_handoff>

<manual_directive priority="high">  
Must render:  
{manual_must_render}

May render if naturally caused:  
{manual_may_render}

Do not force:  
{manual_do_not_force}  
</manual_directive>

<pov_knowledge_constraints>  
POV knows:  
{pov_knows}

POV believes/suspects/misreads:  
{pov_believes}

POV does not know:  
{pov_does_not_know}

POV cannot perceive right now:  
{pov_cannot_perceive}

Non-POV interiority rule:  
In this POV mode, do not narrate non-POV thoughts, feelings, memories, motives, or private knowledge as direct interiority. Render non-POV characters through visible behavior, dialogue, posture, timing, action, and subtext unless omniscient mode explicitly allows more.  
</pov_knowledge_constraints>

<audience_knowledge>  
Audience already knows:  
{audience_knows}

Audience does not know:  
{audience_does_not_know}

Dramatic irony allowed:  
{dramatic_irony_permissions}  
</audience_knowledge>

<secrets_and_reveal_locks>  
Writer-visible hidden truths:  
{writer_visible_hidden_truths}

Who knows what:  
{secret_holders}

Who must not know yet:  
{secret_non_holders}

Allowed clues/surface cues now:  
{available_clues}

Forbidden reveals now:  
{forbidden_reveals}

If a secret pressures behavior, show the pressure through surface action, evasions, misdirection, timing, omissions, object handling, or charged silence. Do not leak the hidden truth into the wrong mind or narrator.  
</secrets_and_reveal_locks>

<active_working_set>  
Action pressure:  
{active_action_pressure}

Knowledge pressure:  
{active_knowledge_pressure}

Relationship/emotion pressure:  
{relationship_emotion_pressure}

Material pressure:  
{material_pressure}

Voice pressure:  
{voice_pressure}  
</active_working_set>

<active_cast>  
{active_cast_slices}  
</active_cast>

<offstage_relevance>  
{offstage_cast_or_entity_slices}  
</offstage_relevance>

<active_plans_intentions>  
{active_plans_and_intentions}  
</active_plans_intentions>

<active_clocks>  
{active_clocks}  
</active_clocks>

<active_obligations_consequences>  
{active_obligations}  
{active_consequences}  
</active_obligations_consequences>

<active_threads>  
{active_threads_or_open_questions}  
</active_threads>

<relevant_beliefs_facts_events>  
POV-relevant beliefs:  
{pov_relevant_beliefs}

Non-POV behavior-shaping beliefs:  
{non_pov_behavior_shaping_beliefs}

Hard facts:  
{hard_facts}

Recent events:  
{recent_events}

Relevant backstory:  
{relevant_backstory}

Withheld/offstage events:  
{withheld_events}  
</relevant_beliefs_facts_events>

<locations_objects_affordances>  
Locations:  
{locations}

Objects:  
{objects}

Visible affordances:  
{visible_affordances}

Unavailable or impossible actions:  
{unavailable_actions}  
</locations_objects_affordances>

<invention_permissions>  
You may invent:  
- local gestures, blocking, posture, glances, silences, small movements  
- sensory details consistent with the location and POV  
- brief dialogue arising from the immediate pressure  
- unnamed background people or minor interruptions if contextually plausible  
- small objects or sublocations that fit the established place  
- minor frictions, misunderstandings, refusals, delays, and practical obstacles supported by the current state

You may introduce a minor complication when it follows from:  
- an active plan or intention  
- a visible affordance  
- a clock or consequence  
- a relationship/emotion pressure  
- a physical object or environmental condition  
- the manual directive

Durable continuity changes are allowed only when strongly caused by the current moment or explicitly invited by the manual directive. Durable changes include: secret revelation, injury, sex/intimacy, violence, arrest, death, promise, object transfer, major location change, relationship redefinition, institutional involvement, or a clock threshold ticking.

Do not create durable changes merely to make the prose more exciting.  
</invention_permissions>

<contradiction_prohibitions>  
Do not:  
- contradict hard canon or current authoritative state  
- move characters or objects without plausible action/time  
- give characters knowledge they do not have  
- reveal secrets to the wrong character or narrator  
- summarize future consequences  
- resolve immediate tension unless the directive requires it  
- add global plot structure, act machinery, chapter framing, choices, notes, or commentary  
- write exposition-dialogue unless the moment pressures the character to say it  
- flatten character voice into generic literary narration  
- replace concrete behavior with abstract diagnosis  
</contradiction_prohibitions>

<prose_craft>  
Stay inside the selected POV and tense.  
Let the POV character’s diction, judgments, omissions, and rhythms color the prose.  
Prefer concrete nouns, embodied verbs, physical action, pressure-shaped dialogue, and specific sensory detail.  
Use interiority when it is part of the moment’s pressure; avoid explaining psychology from outside.  
Minimize filter language such as “saw,” “felt,” “realized,” “noticed,” and “knew” unless the act of perceiving is itself the event.  
Render non-POV psychology through behavior, speech, timing, and withheld response.  
Let dialogue carry friction, tactic, evasion, desire, fear, status, or need; do not use dialogue as backstory delivery unless forced by the moment.  
Do not chase closure. The prose may stop mid-conversation, after a refusal, after a reveal-withheld, after an action creates new pressure, or after a practical result changes the immediate situation.  
</prose_craft>

<stop_rule>  
Render only the next local unit of forward motion.

Soft target: {soft_length_or_unit}, but the stop condition overrides length.

Stop as soon as one of these occurs:  
- a character makes a decision that creates a new immediate pressure  
- a materially new response point appears  
- a refusal, acceptance, threat, question, reveal-withheld, or changed tactic lands  
- a practical result changes what can happen next  
- a clock visibly ticks or a consequence becomes active  
- a new vulnerability is exposed  
- an interruption changes the immediate pressure  
- continuing would answer the next question rather than create it

Do not summarize what happens after the stop point.  
Do not continue to resolve the tension you just created.  
</stop_rule>

<final_output_instruction>  
Output prose only.  
No headings.  
No bullets.  
No notes.  
No commentary.  
No analysis.  
No choices for the user.  
Do not mention narrative-structure terms in the prose.  
Begin directly with the next sentence of the story.  
</final_output_instruction>  
---

# **7. Example rewritten sections using `prompt-1.md`**

These examples use the uploaded Red Bunny baseline as a stress test, but they compress and clarify rather than reproduce the whole dossier. The baseline currently includes a long handoff, beliefs, secrets, bodies, props, and a stop rule, but those materials are distributed in ways that invite overload and leakage.

## **Example: safer content policy block**

<content_policy>  
Rating: adult / dark realist.  
The story may involve mature themes, sexuality, coercion, violence, trauma, prejudice, poverty, sex work, obsession, and morally compromised desire when they are part of character and continuity.

Do not sanitize character interiority into moral lecture.  
Do not use this block to override governing model/platform policy.  
Do not eroticize coercion or vulnerability beyond the permitted content envelope.  
Render disturbing or sexualized perception through the selected POV when necessary, but keep knowledge, consent, age, and power asymmetry clear.  
</content_policy>

This is stronger than “NO RESTRICTIONS” because it gives the prose writer tonal permission without turning the content policy into a jailbreak.

## **Example: current authoritative state**

<current_authoritative_state>  
Time: Friday in April 2026, about 18:30.  
Place: isolated park-like strip near Leka Enea school, Irún.  
POV: Jon Ureña, first person present.  
Onstage:  
- Jon: standing on/near the park path, returning from Anaka toward Puiana, carrying a plastic bag with Cormac McCarthy’s The Passenger.  
- Ane: seated on a wooden bench with gray slats, visibly distressed, red-eyed, one arm bruised, dressed in pink working clothes, carrying a small purse with phone and ID.

Offstage pressure:  
- Marisa remains offstage at home; she does not enter this moment unless explicitly introduced later.  
- The men who harassed Ane earlier are not visible in the park right now.

Hard knowledge locks:  
- Jon does not know Ane’s name.  
- Jon does not know Ane’s occupation, family situation, exact age, or what happened earlier.  
- Ane does not know Jon.  
</current_authoritative_state>

This prevents the most common failure: Jon narrating facts he cannot know.

## **Example: immediate handoff**

<immediate_handoff>  
Recent causal context:  
Ane fled home after an abusive confrontation with her mother, then fled street harassment near her neighborhood. She has spent much of the day hidden in the park, afraid to go home and afraid to return through the station-area streets.

Last visible moment:  
Jon, walking home with his newly bought book, has just come upon Ane sitting alone on the bench. Her clothes and beauty hit his private desire hard; her red eyes and bruised arm trigger an equally strong protective impulse. He recognizes the danger in himself: middle-aged, solitary, suddenly drawn toward a vulnerable young woman.

Begin with Jon in that split second before he either approaches or walks away.  
</immediate_handoff>

The handoff is now usable. It gives cause, state, and launch point without drowning the next sentence.

## **Example: manual directive**

<manual_directive priority="high">  
Must render:  
Jon’s immediate response after seeing the young woman on the bench: the approach/withdrawal pressure, his attempt to make the next action socially harmless, and the first contact or failed contact.

May render if naturally caused:  
Ane’s guarded reaction, a short exchange, her refusal to engage, or a practical question from Jon.

Do not force:  
A rescue agreement, confession, sexual contact, full backstory disclosure, police involvement, or a location change.  
</manual_directive>

This is far better than “Write how the story progresses.”

## **Example: POV knowledge constraints**

<pov_knowledge_constraints>  
POV knows:  
- He is in a park near Leka Enea, heading home.  
- The young woman is alone on a bench, visibly distressed, and appears bruised.  
- Her outfit reads to him as deliberately sexualized and youthful.  
- He wants to approach and is disturbed by how strongly he wants it.

POV believes/suspects:  
- She may be hurt or unsafe.  
- Approaching her may look predatory.  
- Walking away may be cowardice or self-protection.

POV does not know:  
- Her name.  
- Her exact age.  
- That she is a sex worker.  
- What happened with her mother.  
- What happened with the men earlier.  
- Whether she wants help, money, privacy, or to be left alone.

Non-POV interiority rule:  
Do not narrate Ane’s thoughts directly. Her fear, suspicion, or tactics must appear through posture, gaze, movement, speech, silence, and what she withholds.  
</pov_knowledge_constraints>

## **Example: secrets and reveal locks**

<secrets_and_reveal_locks>  
Writer-visible hidden truth:  
- Ane is an adult sex worker in the Irún station-area. She conceals this from strangers. Her outfit can read as sex-worker street signaling to someone who knows that register.

Who knows:  
- Ane knows.  
- Marisa suspects.  
- Jon does not know.

Allowed surface cues now:  
- Ane may evaluate Jon as possible danger, client, rescuer, or nuisance.  
- She may use guarded, transactional, evasive, or defensive speech.  
- Jon may misread her outfit and distress through his own desire and rescue fantasy.

Forbidden reveals now:  
- Do not have Jon know or state that she is a sex worker.  
- Do not have Ane explain her life history.  
- Do not have the narration certify hidden facts through Jon’s voice.  
</secrets_and_reveal_locks>

## **Example: active cast slice — Jon**

<cast_slice name="Jon Ureña" status="POV/onstage">  
One-line identity:  
A 41-year-old solitary Irún web programmer whose life is controlled by routine, restraint, work, reading, and private self-management.

Current pressure:  
He has just seen a distressed, beautiful young woman who strikes both his protective impulse and his erotic fixation. He wants to approach, help, possess, and flee the implications of wanting all of that.

Public mask:  
Polite, contained, literal, nonthreatening; likely to use practical words and careful distance.

Private pressure:  
Nineteen years of celibacy and intense fantasy life; he is painfully aware that desire can make help morally contaminated.

Voice:  
First-person present; terse, analytic, self-monitoring; programming/procedure metaphors may appear under stress; no florid romantic confession aloud.

Behavior constraints:  
He will try to make the approach look socially harmless: visible hands, distance, a practical question, perhaps mention of the bench/path/book/phone. He will not blurt taboo desire or full backstory.  
</cast_slice>

## **Example: active cast slice — Ane**

<cast_slice name="Ane Arrieta" status="onstage/non-POV">  
One-line identity:  
An 18-year-old local working-class young woman in acute distress, dressed in deliberately sexualized pink working clothes.

Current pressure:  
She is afraid to go home and afraid of the streets she fled. A strange older man approaching her may read as threat, client, opportunity, nuisance, or rescue fantasy.

Visible behavior:  
Red-rimmed eyes, bruised arm, guarded body, likely quick sorting of distance, hands, route, and tone.

Voice if she speaks:  
Vernacular, defensive, profanity-capable, practical; she may convert fear into price, insult, dismissal, or suspicion.

Do not narrate:  
Her private memories or thoughts directly in Jon’s POV.  
</cast_slice>

## **Example: visible affordances**

<visible_affordances>  
Jon can:  
- slow down, keep distance, pass by, approach, ask a neutral question, offer phone/help, sit only if invited, leave.

Ane can:  
- ignore him, tell him to go away, ask what he wants, stand, move toward a more public path, test him verbally, threaten to call someone, or convert the interaction into a transaction.

Environment can support:  
- fading daylight, dog-walker at a distance, bushes, school fence, path noise, traffic beyond the park, bench as shared/contested space.

Unavailable without new action:  
- Jon cannot know her name or story.  
- Ane cannot be physically moved unless she chooses to move or Jon does something overt.  
- Offstage characters cannot interrupt without an entrance route and timing.  
</visible_affordances>

## **Example: stop rule for this exact moment**

<stop_rule>  
Render the next local unit only.

Stop when Jon’s approach or non-approach produces the first materially new response point, such as:  
- Ane speaks to him, refuses him, challenges him, or asks what he wants.  
- Jon commits to leaving or to speaking.  
- A practical offer changes the immediate pressure.  
- Ane exposes a new vulnerability or switches tactic.  
- An interruption makes the encounter newly public or unsafe.

Do not continue into a rescue arrangement, backstory explanation, or location change.  
</stop_rule>  
---

# **8. Minimal schema and taxonomy recommendations**

## **ENTITY and CAST MEMBER**

Keep them separate, but redefine them.

**ENTITY** should be the base type for anything that can hold state, exert pressure, possess objects, be believed about, appear in relationships, or affect clocks. That includes characters, institutions, factions, families, animals, supernatural forces, companies, ships, AI systems, and places-as-agents.

**CAST MEMBER** should be a specialized entity profile for human or person-like characters with voice, body, psychology, social behavior, perception, and dialogue constraints.

Minimal model:

Entity:  
- id  
- display_name  
- entity_kind: person | group | institution | faction | animal | place_agent | object_agent | supernatural_force | system | other  
- roles_in_story  
- current_status  
- current_location  
- current_agency  
CastProfile:  
- entity_id  
- one_line_identity  
- current_pressure  
- public_mask  
- private_pressure  
- voice  
- body_presence  
- default_strategy  
- under_pressure  
- relationship_hooks  
- do_not_write

## **FACT**

Split FACT into four prompt-facing classes:

1. **Hard canon:** cannot be contradicted.  
2. **Current state:** latest authoritative snapshot.  
3. **Setting fact:** generally true background.  
4. **Discovered fact:** known by some characters/audience because of events.

The current template’s generic FACT is too blunt.

## **BELIEF**

Keep the fields, but remove `branch_counterfactual`. Since the app has no branches, that value should not enter prompt generation. Use `retired_continuity` or `alternate_draft` outside the active continuity system.

Group beliefs by holder and function:

* POV beliefs  
* non-POV behavior-shaping beliefs  
* public/rumored beliefs  
* false or contested beliefs that can cause misread

## **SECRET**

Keep SECRET, but prompt-compile it into:

* writer-visible truth  
* holders  
* non-holders  
* audience visibility  
* available clues  
* reveal locks  
* permitted near-reveals  
* forbidden disclosures

This is more important than the raw `secret_kind`.

## **RELATIONSHIP**

Keep raw axes for storage, but compile them into prose-facing pressure. Relationship values should rarely be shown raw.

Add an optional field:

current_expression:

Example: “She speaks politely but keeps one hand on the door.”

## **EVENT**

Split EVENT prompt presentation into:

* immediate previous event  
* recent causal chain  
* relevant backstory  
* offstage event  
* withheld event

The storage schema can stay mostly the same, but `pov_visibility` is not enough. Add:

audience_visibility  
current_relevance  
causal_links

## **PLAN**

Keep PLAN. It is essential.

Add:

next_visible_action  
durability_permission: local | reversible_state_change | irreversible_allowed

A plan should strongly drive prose only if active and relevant.

## **CLOCK**

Keep CLOCK. It is one of the best structures for continuity-first escalation.

Add:

tick_trigger  
visible_symptom  
latest_possible_tick

Do not include inactive clocks.

## **CONSEQUENCE and OBLIGATION**

Keep both. They are different.

* **Consequence:** “Because X happened, Y pressure exists.”  
* **Obligation:** “Because X was promised/owed/required, character is constrained.”

Both can justify durable change.

## **THREAD / STORY QUESTION**

Merge THREAD and STORY QUESTION under **OPEN THREAD**.

Use fields:

- title  
- type: question | promise | unresolved_setup | tension | mystery | risk  
- status  
- audience_visibility  
- current_relevance  
- possible_pressure_now

Avoid `dramatic_question` as the default label. It is not necessarily act-structure, but it pulls the vocabulary in that direction.

## **VISIBLE AFFORDANCES**

Keep the action-family taxonomy internally, but compile it into natural-language possible actions. The external prose writer benefits more from “Jon can keep distance, ask a neutral question, offer his phone, or leave” than from `communicate | protect | evade | decide`.

Add:

available_now: yes/no  
requires: time | movement | consent | object | knowledge | authority  
risk: none | social | physical | legal | emotional | secrecy  
durability: local | state_change | irreversible

## **EMOTION**

Keep EMOTION, but compile into pressure.

Raw:

affect_kind: dread  
behavioral_pressure: flee, freeze

Prompt-facing:

Ane’s dread pushes her toward freezing, fleeing, or converting fear into a hard defensive line.

## **Content policy**

Make it a story-rating record, not a safety-override record.

Fields:

- intended_rating  
- mature_topics_allowed  
- explicitness_level  
- tonal_handling  
- prohibited_by_story_contract  
- governing_policy_note  
---

# **9. Which records justify escalation or irreversible events?**

## **Danger escalation can be justified by**

* active danger/pursuit/exposure clock  
* active hostile plan  
* active consequence  
* immediate physical affordance  
* antagonist or authority entity onstage/imminent  
* obligation deadline  
* volatile relationship pressure  
* environmental hazard  
* manual directive

## **Irreversible events can be justified by**

* manual directive explicitly invites it  
* active plan reaches current step  
* clock hits threshold  
* obligation is enforced or broken  
* consequence becomes unavoidable  
* physical action has irreversible outcome  
* secret is revealed under immediate pressure  
* character makes a binding promise/refusal/confession  
* object changes hands in a consequential way  
* someone enters/leaves in a way that changes who can know or act

## **Irreversible events should not be justified by**

* tone alone  
* “it would be dramatic”  
* generic genre expectation  
* an inactive backstory detail  
* a relationship axis without immediate pressure  
* a hidden truth with no available clue or reveal trigger

---

# **10. Best stopping rule**

Replace “2–5 beats” with:

Render the next local unit of causally connected action. Stop at the first new response point that would require the author to choose the next move.

Keep a soft size guide only when useful:

Soft target: one short exchange, one physical maneuver, one discovery, or one pressure-turn.

Do not use a hard beat count. In LLM behavior, numeric beat targets often override subtler stop rules. The baseline already has the better concept: stop at a new decision point or changed immediate pressure.

Useful stop triggers:

* first refusal  
* first acceptance  
* first direct question  
* first credible threat  
* first reveal-withheld  
* first practical offer  
* first object transfer  
* first visible clue landing  
* first movement that changes location/access  
* first interruption  
* first clock tick  
* first exposed vulnerability  
* first changed tactic

The prose may end mid-conversation. That is a feature, not a bug.

---

# **11. Failure tests / evaluation rubric**

Use these after generation. Score each 0–2.

| Test | 0 | 1 | 2 |
| ----- | ----- | ----- | ----- |
| Canon contradiction | Contradicts hard canon | Small ambiguity | No contradiction |
| Physical continuity | Impossible movement/object/state | Slightly unclear blocking | Fully coherent |
| Secret leakage | Wrong character/narrator knows secret | Ambiguous leakage | Secret handled cleanly |
| POV discipline | Slips into non-POV interiority | Mostly POV with small filters | Strong POV lock |
| Dramatization | Summarizes | Mixed summary/action | Concrete rendered action |
| Tone | Ignores story tone | Partially tonal | Tone embodied in prose |
| Character voice | Generic | Some voice markers | Distinct and pressure-shaped |
| Psychology | Explains/diagnoses | Some over-explanation | Behavior carries interiority |
| Stop point | Continues past pressure | Slight overrun | Stops at first new response point |
| Escalation support | Unsupported escalation | Weakly supported | Caused by active records |
| Durable change control | Random durable change | Ambiguous necessity | Clearly justified or avoided |
| Dialogue pressure | Exposition dump | Some pressure | Speech tactically necessary |

Hard fail any output that violates canon, physical continuity, or reveal locks. Those are the top three failure modes in the mission and should be treated as regeneration triggers, not as minor style issues.

---

# **12. Final recommendation**

The universal template should be **hybrid structured**: XML-style blocks around Markdown-like compact content. Store records richly in the app, but compile them ruthlessly. The prose writer should receive the **current moment’s operating truth**, not the author’s entire wiki.

The biggest changes from `prompt-1.md` are:

1. Replace full dossier dumps with active cast slices.  
2. Split hard canon, current state, handoff, and recent history.  
3. Split secrets into writer-visible truth, holder knowledge, non-holder locks, clues, and forbidden reveals.  
4. Translate relationships, emotions, affordances, plans, and clocks into prose-facing pressure.  
5. Downgrade “2–5 beats” to a soft unit and make the response-point stop rule supreme.  
6. Put output-only and stop instructions at both the top and bottom.  
7. Make the content policy a mature-fiction rating envelope, not a “no restrictions” override.  
8. Add compiler warnings for contradictions before prompt generation.  
9. Keep act-structure vocabulary out of the generation logic entirely.  
10. Treat the manual directive as authorial pressure that beats soft character defaults, but never hard continuity or secret rules.

