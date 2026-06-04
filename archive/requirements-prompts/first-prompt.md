# Mission — Research-Backed Redesign of a Universal Prose-Generation Prompt Template for a Continuity-First Story App

## Context

I am preparing to develop a relatively simple story-writing app.

The app will let a user define a story premise, tone, point of view, content policy, prose preferences, cast members, locations, objects, beliefs, intentions, relationships, plans, clocks, secrets, story questions, and similar continuity records.

The app is not meant to enforce dramatic act structure. It is not a three-act, save-the-cat, hero’s journey, midpoint/climax, or global plot-arc system. The core philosophy is continuity-first storytelling: story progression emerges from current state, character pressure, causal records, secrets, intentions, obligations, clocks, relationships, affordances, and the user’s current manual directive.

There are no branches. There is no branching-story history. There is only the current continuity. The user creates, removes, modifies, and selects which records are active for the next prompt generation.

The app will generate prompts for an external LLM prose writer. That external LLM’s job is to render the next prose segment from the provided story records and current directive. After the prose is generated, the human user reads it and manually updates story records as needed.

The prose-writing LLM is not a record updater, validator, critic, planner, or assistant. It should output prose only.

I will upload `prompt-1.md` in this session. Treat it as the current baseline generated prompt surface. It has the right general direction, but it has problems:

- Section references no longer correlate reliably with actual sections.
- It does not include all intended story record types.
- Some records are shown in forms that may not be optimal for an LLM prose writer.
- It may overload the prose writer with too much full dossier material.
- It may fail to distinguish hard continuity, current causal pressure, POV knowledge, audience knowledge, writer-visible secrets, local affordances, and prose craft rules.
- It contains inherited language about branches/branching that should be removed.
- Its stop rule and beat-cluster framing may need improvement.

Your task is to produce a research-backed critique and redesign proposal for the generated prompt surface.

## Primary Goal

Design the best possible universal generated-prompt template for an external LLM prose writer whose task is to generate vivid, POV-filtered prose from selected active story records.

The template should be genre-neutral, but strong enough for psychologically intense fiction, erotica, dark realism, action, investigation, fantasy, science fiction, domestic drama, literary fiction, roleplay-derived fiction, and other serious narrative uses.

The template must support mature/adult fiction. Every generated prompt should include a content policy block.

## External Prose Writer’s Intended Role

The external LLM prose writer should:

- Take into account all provided active records, story contract, premise, tone, current state, and manual directive.
- Respect current continuity and hard records.
- Dramatize the next local progression in prose.
- Generate approximately the next several beats of forward motion, unless a better stopping unit is justified by research and proposed.
- Invent local gestures, dialogue, blocking, sensory details, small frictions, unnamed background people, minor objects, and sub-locations when they make sense.
- Invent minor complications when supported by current context and active records.
- Escalate danger or consequence when supported by active records and current pressure.
- Potentially create irreversible events if they make strong contextual sense, because the human user can reject/regenerate the output. However, the prompt should still distinguish clearly between ordinary local invention and durable story-changing invention.
- Remain inside the selected POV and prose mode.
- Output prose only.

The external LLM prose writer should not:

- Output commentary, analysis, record updates, warnings, summaries, choices, headings, markdown, or notes.
- Contradict canon.
- Ignore physical continuity.
- Reveal secrets too early or to the wrong character.
- Summarize instead of dramatizing.
- Ignore tone.
- Write generic prose.
- Flatten character voice.
- Over-explain psychology.
- Continue past the intended stopping pressure.
- Use dramatic act structure.
- Try to complete a mini-arc merely because prose often wants closure.

## Failure Priority

Treat these failure modes as ranked from worst to least bad:

1. Contradicting canon.
2. Ignoring physical continuity.
3. Revealing secrets too early or to the wrong character.
4. Summarizing instead of dramatizing.
5. Ignoring tone.
6. Writing generic prose.
7. Flattening character voice.
8. Over-explaining psychology.
9. Continuing past the stop point.

The redesigned prompt should be especially strong against the top failures.

## Manual Directive Priority

The user’s manual moment directive should win over character defaults and normal record pressure.

In fiction, a current authorial directive can intentionally create tension between established character tendencies and story progress. For example, if a character usually avoids contact but the directive says to have him approach, the directive wins. Records shape how the directive is rendered; they should not veto it unless the directive contradicts hard continuity or impossible physical facts.

Propose a clear hierarchy of authority for the prompt. A candidate hierarchy is:

manual directive > hard canon/current authoritative state > physical continuity > secrets/reveal rules > active plans/intentions/clocks > beliefs/relationships/emotions > character voice > tone/style > optional texture

Revise this if research or judgment supports a better hierarchy.

## No Dramatic Act Structures

Do not design this around dramatic act structures.

Do not use or recommend:

- three-act structure
- four-act structure
- five-act structure
- save-the-cat beats
- hero’s journey
- midpoint/climax machinery
- mandatory rising-action structure
- global drama-manager plot arcs
- chapter-level story engineering
- predesigned scene-function slots

You may mention such models only to explain why they are not appropriate for this app.

The desired system is story-record-based continuity storytelling, not act-structure storytelling.

## Research Expectations

Deep research is encouraged, but sources/citations are not mandatory in the final answer unless you choose to include them.

Research areas to consider:

- LLM prompt design for long-context generation.
- LLM instruction hierarchy and prompt organization.
- Retrieval-augmented generation and context selection.
- Interactive narrative systems.
- Computational narratology.
- Game AI planning, especially goal/plan/state-driven systems.
- Storylet, quest, and emergent narrative design.
- Fiction craft, especially POV discipline, psychic distance, scene units, concrete prose, voice, and dramatization.
- How structured data should be translated into prose-facing context for generative models.
- How to avoid overloading an LLM with irrelevant context.
- How to represent secrets, beliefs, audience knowledge, and POV-limited knowledge.
- How to control stopping behavior without forcing artificial closure.

Avoid hand-wavy assumptions. Where research or practice suggests one prompt form is likely to outperform another, say so and explain why.

## Desired Output

Produce the following deliverables:

1. A direct critique of `prompt-1.md`.

   This can be section-by-section or architectural, whichever is more useful. Identify what is strong, what is broken, what is missing, what is redundant, what may hurt prose quality, and what may hurt continuity reliability.

2. A redesigned prompt architecture.

   Explain the proposed sections, order, and authority hierarchy. Explain how the generated prompt should distinguish:

   - hard canon
   - current authoritative state
   - current situation/handoff
   - manual directive
   - active working-set records
   - POV knowledge
   - audience knowledge
   - writer-visible hidden truths
   - secrets not to reveal
   - physical continuity
   - active cast vs offstage cast
   - affordances
   - plans
   - clocks
   - obligations
   - consequences
   - story questions
   - prose craft rules
   - output rules

3. A prompt compiler contract.

   This should not be an app implementation plan. It should define how raw records should be selected, compressed, transformed, translated, prioritized, omitted, or warned about when compiling a generated prose prompt.

   Include guidance for:

   - how to select active records
   - how to handle active/on-location cast versus offstage cast
   - how much of a cast member dossier to include
   - how to show beliefs
   - how to show secrets
   - how to show plans
   - how to show clocks
   - how to show relationships
   - how to show objects and affordances
   - how to show event history
   - how to handle conflicts in the working set
   - how to handle records that are true but irrelevant to the next prose segment
   - how to preserve characterization without drowning the immediate moment
   - how to distinguish “the LLM may invent this locally” from “the LLM may durably change continuity”

4. A proposed universal generated-prompt template in full.

   This is the most important deliverable.

   Provide a complete copy-pasteable Markdown template with placeholders such as `{story_contract}`, `{current_state}`, `{active_cast}`, `{visible_affordances}`, etc.

   The template should be what the future app eventually generates for the external LLM prose writer.

   The template must include:

   - content policy block
   - story contract
   - prose mode
   - current authoritative state
   - immediate handoff
   - manual directive
   - active working set
   - current POV and knowledge constraints
   - secrets/reveal constraints
   - physical continuity
   - active cast characterization
   - offstage cast relevance
   - active plans/intentions
   - active clocks
   - active obligations/consequences
   - active threads/story questions
   - relevant beliefs/facts/events
   - objects/locations/affordances
   - relationship/emotion pressure
   - invention permissions
   - contradiction prohibitions
   - prose craft instructions
   - stop rule
   - output instruction: prose only

5. Example rewritten sections using `prompt-1.md`.

   Use the uploaded Red Bunny prompt as a stress test. You do not have to rewrite the entire prompt unless you think that is necessary. But include enough concrete rewritten sections to prove the architecture works on the messy real example.

6. Minimal schema/taxonomy recommendations.

   You may recommend changing, merging, splitting, or removing record types or fields, but only when it improves the minimal necessary field set for prompt quality and continuity tracking.

   Avoid “nice to have” schema bloat.

7. Optional failure tests / evaluation rubric.

   Include this if useful. Possible tests:

   - canon contradiction test
   - physical continuity test
   - secret leakage test
   - POV slippage test
   - generic prose test
   - summary instead of dramatization test
   - over-explanation test
   - premature closure test
   - unsupported escalation test
   - characterization flattening test

## Important Design Preferences

- Human readability is secondary. The generated prompt should be in the form that best helps the external LLM prose writer.
- Token efficiency matters only insofar as it improves output quality and reduces distraction.
- Vivid prose is preferred over mechanical continuity, but canon and physical continuity must still be protected.
- The prompt should strongly enforce POV-filtered prose.
- Prose should be centered around concrete nouns and vigorous verbs.
- “Show, don’t explain” should be enforced.
- Characters should not explain backstory in dialogue unless pressured by the moment.
- Dialogue should remain in English with local flavor when the story is set in a non-English location, unless the story contract says otherwise.
- The external prose writer should be allowed to end mid-conversation or immediately after an action creates pressure.
- The prose segment should not resolve immediate tension unless the manual directive clearly calls for it.
- The LLM should not add choices, notes, headings, or commentary.
- The final prose output should not mention narrative structure terms such as page, scene, act, arc, midpoint, climax, beat, or plot.

## Clarified Assumptions

- There are no branches.
- There is no branch history.
- There is only the current continuity.
- Accepted prose does not automatically update records.
- The human user manually updates records after reading generated prose.
- The prompt is generated from a user-selected active working set of records.
- Records outside the working set are not included unless needed as global constraints or compact continuity context.
- The external LLM may invent local details, background people, objects, and sub-locations when contextually appropriate.
- The external LLM may introduce complications or irreversible events when strongly supported by the active records and current moment, but the prompt must clearly distinguish ordinary local invention from durable continuity-changing invention.

## Story Record Taxonomy

The app may use the following record categories. You may recommend changes if research and judgment support them.

### BELIEF

Tracks a holder-specific claim, interpretation, misbelief, report, suspicion, denial, or knowledge-state.

Fields:

- holder
- claim
- belief_mode: knows | believes | suspects | doubts | denies | reports | claims | deceives | misremembers | interprets
- truth_relation: true | false | partly_true | unknown | contested | branch_counterfactual | future_contingent
- confidence: certain | high | medium | low | uncommitted
- visibility: private | shared | factional | public | rumored | concealed | suppressed
- access_route: direct_observation | testimony | document | object_trace | location_trace | inference | surveillance | institutional_channel | magic_tech | rumor | authorial_initialization

Note: Since there are no branches, consider whether `branch_counterfactual` should be removed or renamed.

### ENTITY

Identifies a story-local entity, mainly cast members.

Fields:

- display_name
- role_in_story

Role values:

- viewpoint: The entity can anchor scene perception or scene-plan point of view.
- primary_actor: The entity can initiate major page actions or state changes.
- opposing_actor: The entity actively resists or pressures a primary actor's goals.
- allied_actor: The entity materially supports a primary actor's goals.
- authority: The entity can grant, deny, enforce, or legitimate permissions and consequences.
- dependent: The entity's safety, access, or agency depends on another actor or institution.
- witness: The entity can observe and later testify, remember, report, or misreport events.
- information_source: The entity is a likely source of continuity-relevant knowledge.
- pressure_source: The entity generates urgency, danger, obligation, scarcity, or social pressure.
- social_bridge: The entity connects otherwise separate actors, groups, institutions, or locations.
- background: The entity is present for continuity, texture, or constraints but is not currently action-driving.

Question to evaluate: should ENTITY and CAST MEMBER be separate, merged, or redefined? Should non-character entities such as institutions, factions, families, companies, supernatural forces, animals, or places-as-agents be supported?

### ENTITY STATUS

Tracks the present operational state of a cast member/entity.

Fields:

- cast_member
- life: alive | dead | unknown
- agency: free | constrained | coerced | captive | incapacitated | unconscious | dead | unknown
- location: [named_location] | unknown | concealed | offstage

### VISIBLE AFFORDANCES

Guidance for what characters can plausibly do in the current moment.

Fields:

- label
- available_to
- action_families

Action family taxonomy:

- move: Change physical position or navigate to a different place, route, stance, or cover.
- evade: Avoid detection, pursuit, contact, obligation, or immediate danger.
- pursue: Follow, chase, track, shadow, or close distance toward a target.
- perceive: Look, listen, sense, inspect, notice, or attend to available evidence.
- investigate: Test a hypothesis, interrogate evidence, search a location, or reconstruct causes.
- communicate: Say, signal, write, reveal, ask, report, warn, or otherwise convey information.
- persuade: Try to change another actor's belief, stance, permission, or willingness.
- negotiate: Exchange terms, bargain, compromise, threaten, or settle conditions.
- bond: Strengthen, strain, repair, acknowledge, or redefine a relationship.
- oppose: Resist, challenge, block, refuse, undercut, or contest another actor or force.
- harm: Damage, wound, sabotage, degrade, or impose a cost.
- protect: Defend, shield, hide, preserve, escort, or secure something at risk.
- control: Restrain, command, contain, direct, lock down, or otherwise govern behavior or access.
- transfer: Give, take, trade, steal, lend, return, or move possession/custody.
- use: Employ an object, place, capability, relationship, or institution for its ordinary function.
- make_change: Alter a material, social, informational, or environmental state.
- ritual_protocol: Perform a formalized procedure with magical, legal, social, religious, or institutional force.
- recover: Rest, heal, repair, regain, stabilize, resupply, or de-escalate damage.
- wait: Hold, observe, delay, defer, maintain position, or let a condition mature.
- decide: Choose, commit, prioritize, accept, reject, or resolve between alternatives.

### EVENT

Historical record of important events in the story or before the story.

Fields:

- description
- pov_visibility: perceived_directly | inferred_from_trace | reported | discovered_after | withheld

Evaluate whether events should be grouped as recent causal history, relevant backstory, offstage events, and withheld events rather than shown as a flat archive.

### INTENTION

Tracks an entity's active goal-state.

Fields:

- holder
- intent
- urgency: low | medium | high

### FACT

Tracks what is known in the world of the story, separate from holder-specific beliefs.

Field:

- statement

Evaluate whether FACT should be split into hard canon, current state, setting fact, and discovered fact.

### OBLIGATION

Tracks promised, owed, or required behavior that constrains future choice.

Fields:

- status: open | closed | escalated | abandoned | transferred
- obligation_kind
- owed_by: one or more cast members
- owed_to: one or more cast members; may be the same as owed_by
- urgency: low | medium | high

### CONSEQUENCE

Tracks a realized or pending effect from a prior event or state.

Fields:

- status: pending | resolved | escalated | abandoned
- consequence_kind
- urgency: low | medium | high

### THREAD

Tracks an active narrative tension across prose segments.

Fields:

- status: active | resolved | escalated | abandoned
- title
- summary
- urgency: low | medium | high

### RELATIONSHIP

Tracks a directed or symmetric relation between entities along a closed taxonomy axis.

Fields:

- axis
- direction_kind: directed | bidirectional
- from
- to
- value: none | trace | low | medium | high | extreme
- valence: symmetric | asymmetric | bidirectional | adversarial
- description

Axis taxonomy:

- trust: Degree of reliance on another actor's honesty, competence, or follow-through.
- fear: Degree of apprehension, intimidation, dread, or threat sensitivity.
- desire: Degree of wanting, attraction, envy, ambition, or motivated pull.
- debt: Degree of owed favor, compensation, restitution, gratitude, or liability.
- intimacy: Degree of private knowledge, emotional closeness, bodily closeness, or vulnerability.
- loyalty: Degree of durable allegiance, duty, or willingness to prioritize the relation.
- resentment: Degree of grievance, bitterness, jealousy, humiliation, or stored anger.
- power_imbalance: Degree of asymmetry in command, leverage, dependency, status, or coercive capacity.
- attention: Degree of focus, surveillance, fascination, neglect, or scrutiny.
- familiarity: Degree of personal knowledge, routine contact, recognition, or ease.
- approval: Degree of praise, sanction, endorsement, acceptance, or social permission.
- respect: Degree of esteem, deference, credibility, or perceived worth.
- obligation: Degree of duty, promise, role-bound responsibility, or expected performance.
- hostility: Degree of active antagonism, aggression, rivalry, contempt, or intent to harm.

Evaluate whether raw relationship records should be shown directly or translated into prose-facing relationship pressure.

### LOCATION

Tracks a spatial reference, usually a stage for cast members to operate in.

Fields:

- label
- description

### OBJECT

Tracks a movable or grounded object referenced by affordances or possession state.

Fields:

- label
- description
- owner
- carried_by
- current_location

Current location may be a location, unknown, offstage, or carried by someone.

### CLOCK

Tracks present-causal pressure that advances over time or through events: danger clocks, faction activity, countdowns, pursuit, exposure, deadlines, and worsening conditions.

Fields:

- title
- clock_kind: danger | racing | mission | faction | exposure | pursuit | deadline
- salience: low | medium | high
- visibility: hidden | holder_specific | public | factional
- next_thresholds:
  - label
  - description of the effects it could or will have
- tick_history:
  - resolved threshold
  - cause
  - result

### SECRET

Tracks story-local hidden truth.

Fields:

- secret_kind: identity | motive | location | event_cause | artifact_truth | relationship | institutional
- secret_claim
- holders
- salience: low | medium | high
- clue_carriers:
  - clue_text
  - clue_strength: weak | suggestive | confirming | decisive | misleading
  - discovered_by: none | one specific cast member | multiple cast members
  - audience_visible: hidden | visible | ambiguous
  - status: available | discovered | destroyed | suppressed | superseded
- status: hidden | partially_revealed | revealed | disproven | abandoned

The prose writer may see secrets held by non-POV characters so that behavior can be shaped by concealment, but the prompt must prevent the wrong character from knowing or revealing them too early.

Evaluate whether secrets should be split in the prompt into:

- writer-visible hidden truths
- audience-visible secrets
- POV-hidden secrets
- do-not-reveal-yet constraints
- clue carriers available in the moment

### STORY QUESTION

Tracks present-causal open-setup state: an element introduced into the continuity that remains active until answered, paid off, abandoned, inherited, or superseded.

Fields:

- setup_kind: setup | dramatic_question | promise
- question_or_setup
- audience_visibility: hidden | implied | explicit
- answer, if any

Consider whether “dramatic_question” is too act-structure-coded or whether it is still useful as local continuity pressure.

### PLAN

Tracks an actor-owned tactical plan over multiple prose segments: how a holder is presently trying to pursue an intention, which resources or leverage the plan rests on, what currently blocks it, and what the actor would try if the current step fails.

Fields:

- holder
- objective
- plan_status: active | blocked | suspended | fulfilled | failed | abandoned | revised
- resources: what facts, objects, locations, relationships, obligations, etc. are relevant as resources
- blockers
- current_step: current actions and targets
- fallback_steps: actions and targets if the current step is not feasible

Active PLAN records should strongly drive prose when relevant.

### EMOTION

Tracks current emotional pressure.

Fields:

- holder
- description
- status: active | suppressed | settled | transformed | dissociated
- affect_kind: fear | anxiety | anger | disgust | grief | shame | guilt | humiliation | hope | relief | joy | awe | tenderness | desire | envy | contempt | confusion | dread | null
- intensity: low | medium | high | extreme
- behavioral_pressure: approach | flee | freeze | attack | reject | dominate | submit | seek_contact | protect_other | seek_help | confess | conceal | withdraw_socially | plan | accommodate | self_soothe | ruminate | collapse

`behavioral_pressure` may allow multiple values.

### CAST MEMBER

Represents a cast member of the story. `prompt-1.md` contains concrete examples of the kinds of properties a cast member may have.

Evaluate what the minimal necessary cast-member fields should be for high-quality prose generation.

A key concern: active/on-location cast members likely need rich characterization so the external prose writer can nail voice and behavior. Offstage cast members may need only relevant excerpts.

Do not casually remove characterization material if that would damage prose quality. But do consider whether a compact active-character slice can outperform huge full dossiers.

## Questions You Should Resolve

Please resolve the following through research and judgment:

1. Should ENTITY and CAST MEMBER be separate concepts?
2. Should non-character entities be supported?
3. Should records be shown raw, translated into prose-facing language, or hybridized?
4. Should BELIEF records be grouped by holder, POV relevance, truth relation, or dramatic irony?
5. Should RELATIONSHIP records be shown raw or compiled into relationship pressure?
6. How should hidden truths be exposed to the writer without leaking into POV?
7. What is the best stopping rule for this kind of continuity-first prose generation?
8. What should replace or refine “2–5 beats,” if anything?
9. What taxonomy of acceptable minor complications should the prose writer be allowed to introduce?
10. Which active record types can justify danger escalation?
11. Which active record types can justify irreversible events?
12. How can the prompt avoid artificial closure?
13. How much full character dossier should be included for active cast?
14. How should offstage cast be represented?
15. How should prose-craft instructions be written so they are strong but not bloated?
16. Should explicit internal monologue be allowed, restricted, or style-dependent?
17. How should current authoritative state override older or conflicting records?
18. What app-side warnings should be shown before prompt generation if the active working set is contradictory?

## Prose Craft Requirements

The universal prompt template should strongly support:

- single-POV discipline
- POV-filtered perception
- character-specific diction
- concrete nouns
- vigorous verbs
- embodied action
- local physical continuity
- sensory specificity
- free indirect style where appropriate
- minimal filtering language unless the act of perception matters
- dramatized psychology rather than explanation
- dialogue that emerges from pressure rather than exposition
- no generic literary filler
- no abstract diagnosis in place of behavior
- no premature closure

Research whether the current prose-craft instructions in `prompt-1.md` are too long, too short, correctly focused, or missing anything important.

## Output Format

Produce a structured Markdown report.

Be direct and opinionated.

Do not produce implementation tickets.

Do not design the whole app UI.

Do not write code.

Focus on the generated prompt surface and the minimal record/prompt compiler implications needed to support it.

The most important artifact is the full proposed universal generated-prompt template.