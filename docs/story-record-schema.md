# Definitive Story Record Schema for the Continuity-First Prose App

Status: corrected baseline requirements schema  
Purpose: conceptual schema, prompt-compilation behavior, validation requirements, and minimal record taxonomy  
Scope: not SQL, UI design, API design, migrations, tickets, or implementation plan

---

## 1. Design stance

Continuity Loom stores one current continuity. There are no branches, branch histories, alternative timelines, act structures, or plot rails.

The user curates an active working set for the next local prose generation. The deterministic compiler turns selected records and generation-time fields into a universal prose prompt for an external prose writer. The compiler may format, group, sort, and render. It must not use an LLM to select, summarize, repair, rank, or interpret story records.

The schema is hybrid. Structured fields carry operational meaning for validation, filtering, sorting, and deterministic compilation. Author-written prose fields carry nuance for continuity interpretation, character voice, prose quality, POV handling, and authorial control.

Field economy rule: every field must earn its place through at least one concrete function: deterministic compilation, deterministic validation, continuity interpretation, character voice/behavior preservation, prose-quality protection, or authorial control. A prose-rich field may be justified even when it cannot be fully validated deterministically.

## 2. Global story properties

### 2.1 STORY CONTRACT

Defines durable story identity.

Required fields:

```yaml
title: string
premise: prose
genre_mode: prose or enum list
tone: prose or tag list
continuity_philosophy: continuity_first
setting_baseline: prose
content_intensity: general | mature | explicit | graphic | variable
explicitness: prose
language_register: prose
prose_preferences:
  psychic_distance: close | medium | distant | variable
  dialogue_density: sparse | balanced | moment_led | dense
  interiority: minimal | filtered | free_indirect | direct | variable
  paragraphing: spare | mixed | lush | variable
```

Prompt treatment:

- Always included.
- Does not override hard canon, current authoritative state, POV constraints, reveal locks, or provider policy.

### 2.2 UNIVERSAL CONTENT POLICY

Required fields:

```yaml
rating_label: string
allowed_content_scope: prose
tonal_handling: prose
governing_policy_note: prose
character_bias_handling: prose
```

Required semantic content:

- Adult/mature fiction may be supported when story configuration permits it.
- Explicit language, explicit sexuality, violence, horror, substance use, prejudice, morally reprehensible thoughts, morally reprehensible speech, and morally reprehensible behavior may be rendered when they serve character, situation, and continuity.
- The block must never say `NO RESTRICTIONS`.
- It must not attempt to override external model/provider/platform policy.
- It should forbid assistant disclaimers, moral lectures, warnings, safety commentary, or out-of-fiction analysis inside prose.
- It must preserve the distinction between character-held bias and narrator-certified fact.

### 2.3 PROSE MODE

Required fields:

```yaml
pov_character: entity_id | omniscient | variable
person: first | second | third | omniscient
tense: past | present | future | variable
psychic_distance: close | medium | distant | variable
interiority_mode: minimal | filtered | free_indirect | direct | variable
dialogue_density: sparse | balanced | moment_led | dense
paragraphing: spare | mixed | lush | variable
language_output: string
special_style_constraints: prose list
```

Prompt treatment:

- Always included.
- Non-omniscient POV requires a compiled POV knowledge profile.

## 3. Generation-time brief

Generation-time fields define the immediate prompt generation. They are not durable story records unless the user manually writes equivalent durable records.

### 3.1 ACTIVE WORKING SET

Fields:

```yaml
selected_records: list[record_id]
active_onstage_cast_full: list[cast_member_id]
present_minor_cast_compressed: list[cast_member_id]
offstage_relevant_cast: list[cast_member_id]
selected_pov: entity_id | omniscient
manual_directive_id: id
```

Compiler requirements:

- Include selected records in deterministic section order.
- Do not silently add globally important records merely because they seem important.
- Do not silently remove or compress selected active/onstage cast.
- Warn about risky omissions or prompt length; block only when minimum completeness or contradiction rules require it.

### 3.2 CURRENT AUTHORITATIVE STATE

Snapshot of what is true at the start of generation.

Required fields:

```yaml
current_time: prose or timestamp-like string
current_location: location_id | prose
onstage_entities: list[entity_id]
offstage_pressuring_entities: list[entity_id]
positions: prose or structured list
possessions: prose or structured list
visible_conditions: prose list
environmental_conditions: prose
entity_statuses: prose or compiled ENTITY STATUS list
line_of_sight_and_visibility: prose
routes_and_exits: prose list
available_time: prose
consent_or_force_conditions: prose | none
current_locks: prose list
```

Prompt treatment:

- Always included.
- Overrides older events, older facts, and stale descriptions, but contradictions must be resolved before compilation.
- Should be compact, explicit, and state-like.

### 3.3 IMMEDIATE HANDOFF

Fields:

```yaml
recent_causal_context: prose
last_visible_moment: prose
prior_accepted_prose_status_or_handoff_note: prose | none
begin_after: prose
```

Rules:

- Always included.
- Must not contain verbatim accepted prose, rejected candidate prose, superseded regeneration text, or automatic prose-derived summaries.
- `prior_accepted_prose_status_or_handoff_note` must render `None. No accepted prose is included.` for first segments or when no handoff is needed.
- Durable changes from accepted prose must be represented in selected records or current state before the next prompt.

### 3.4 MANUAL MOMENT DIRECTIVE

Fields:

```yaml
must_render: prose list
may_render_if_naturally_caused: prose list
do_not_force: prose list
```

Rules:

- `must_render` is required.
- The other two fields are optional but should render explicit empty states.
- The directive wins over character defaults and soft tendencies.
- The directive does not override hard canon, current state, physical possibility, POV/reveal constraints, or provider policy.

### 3.5 CURRENT CAST VOICE PRESSURE

Generation-time field used to compile active cast voice pressure pins. This is not durable identity.

Fields:

```yaml
current_cast_voice_pressure:
  - cast_member_id: id
    current_speech_pressure: prose
    current_must_preserve: prose list
    current_must_avoid: prose list
```

Rules:

- Required when an active/onstage character is expected to speak materially or when close POV narration depends on a character-specific current voice pressure.
- May be empty only when the durable voice anchor is sufficient and dialogue/close POV voice is not a focus.
- Compiles into `{active_cast_voice_pressure_pins}`.

### 3.6 CAST VOICE OVERRIDES

Temporary generation-time voice instructions. They are not persistent character identity.

Fields:

```yaml
cast_voice_overrides:
  - cast_member_id: id
    scope: current_generation_only
    reason: prose | none
    applies_to:
      - dialogue
      - pov_narration
      - interiority
      - nonverbal_behavior
      - register
      - rhythm
      - diction
      - profanity
      - silence
      - all_prompted_voice
    override_text: prose
```

Compiler treatment:

- Optional.
- May target active/onstage cast or present-minor cast selected for the current generation.
- For active/onstage cast, compile into the active cast voice pressure pin and into the full dossier under `Current generation voice override`.
- For present-minor cast, compile only into the compressed present-minor note.
- Never persist automatically into the durable CAST MEMBER record.

Validation:

- Warn if the override targets a cast member not selected for the current generation.
- Block if it contradicts hard canon, current authoritative state, physical continuity, POV constraints, reveal constraints, or governing content policy.
- Do not block merely because it is stylistic, temporary, or prose-rich.

### 3.7 GENERATION VALIDATION FOCUS

Validation focus tags activate context-dependent deterministic checks. They are not plot beats, arcs, drama management, or prompt instructions.

Fields:

```yaml
validation_focus_tags:
  generation_context:
    - first_segment
    - continuation_after_accepted_segment
  expected_local_modes:
    - dialogue_expected
    - introspection_expected
    - physical_interaction_expected
    - present_minor_speech_possible
    - offstage_interruption_possible
    - secret_or_clue_pressure
    - non_pov_hidden_plan_behavior
  possible_durable_changes:
    - object_use_possible
    - object_transfer_possible
    - location_change_possible
    - restraint_or_coercion_possible
    - intimacy_or_sex_possible
    - violence_or_injury_possible
    - institutional_involvement_possible
    - clock_tick_possible
    - obligation_breach_possible
```

Requirements:

- Exactly one `generation_context` value is required.
- Other tags may be empty only if the manual directive and current state are genuinely minimal.
- Tags are selected by the user or deterministic UI controls, not by an LLM.
- Tags are validation-facing by default and should not compile into the prose prompt.

## 4. Core entity records

### 4.1 ENTITY

Base record for anything that can hold state, exert pressure, possess objects, appear in relationships, or affect clocks.

Required fields:

```yaml
id: id
display_name: string
entity_kind: person | group | institution | faction | family | animal | place_agent | object_agent | supernatural_force | system | other
roles_in_story:
  - viewpoint
  - primary_actor
  - opposing_actor
  - allied_actor
  - authority
  - dependent
  - witness
  - information_source
  - pressure_source
  - social_bridge
  - background
short_description: prose
```

Prompt treatment:

- Person-like active entities should usually have CAST MEMBER records.
- Non-person entities may compile as institutions, factions, systems, places, or pressure sources when selected.

### 4.2 ENTITY STATUS

Tracks current operational state.

Fields:

```yaml
entity_id: id
life: alive | dead | unknown | not_applicable
agency: free | constrained | coerced | captive | incapacitated | unconscious | unknown | not_applicable
location: location_id | unknown | concealed | offstage | not_applicable
visibility_to_pov: visible | audible | inferred | hidden | not_applicable
current_activity: prose
```

Prompt treatment:

- Compiles into current authoritative state and physical continuity.
- Contradictions with active plans, current state, or location records block when they make the generation impossible or contradictory.

## 5. CAST MEMBER rich dossier

Active/onstage cast need rich dossiers, but not every rich field should be a universal blocker. The corrected shape distinguishes a required voice/behavior core from optional extended richness. The compiler includes all populated active/onstage dossier fields; it must not silently compress them.

### 5.1 Required core fields

```yaml
entity_id: id
identity:
  one_line: prose
  public_face: prose
  private_pressure: prose
voice_anchor:
  core_voice_in_one_sentence: prose
  baseline_register: prose
  under_pressure: prose
  rhythm_register_and_diction: prose
  vocabulary_and_metaphor_pools: prose
  profanity_taboo_and_avoidance: prose
  dialogue_tactics: prose
  suppression_or_evasion_rule: prose
  must_preserve: prose list
  must_avoid: prose list
  anti_repetition_warnings: prose list
pressure_behavior_core:
  cornered: prose
  tempted_or_offered_power: prose
  protecting_attachment: prose
body_presence_core:
  physicality: prose
  habitual_gestures_or_presence: prose
  social_presentation: prose
agency_core:
  default_strategy: prose
  risk_style: prose
```

### 5.2 Optional extended fields

```yaml
world_pressure_core:
  world_produced_wound: prose
  active_appetite: prose
  self_mythology: prose
  irreconcilable_contradiction: prose
relational_charge: prose
moral_psychological_edge: prose
voice_extended:
  intimacy: prose
  anger: prose
  lying: prose
  register_switching: prose
  address_terms_and_naming: prose
  silence_and_interruption_behavior: prose
  anti_generic_warnings: prose list
body_and_presence_extended:
  body_limits: prose
  clothing_presentation: prose
  sensory_or_appearance_signatures: prose
perception_and_embodiment:
  notices: prose
  misses: prose
  misreads: prose
  sensory_bias: prose
pressure_behavior_extended:
  humiliated: prose
  offered_power: prose
  refused_power: prose
agency_and_planning_extended:
  fallback_style: prose
  planning_blind_spots: prose
sample_utterances:
  - text: string
    situation: prose
    speech_function: prose
    pressure_tags: prose list
    copy_policy: never_copy_verbatim | may_echo_lightly | canonical_phrase
```

Removed field:

- `additional_do_not_write` is removed. Its functions are covered by `must_avoid`, `anti_generic_warnings`, `anti_repetition_warnings`, reveal constraints, and contradiction prohibitions. Keeping it as a separate catch-all creates duplication and inconsistent priority.

### 5.3 Active cast voice pressure pins

Voice pressure pins are compiled, not durable records.

Compiled shape:

```yaml
active_cast_voice_pressure_pin:
  cast_member_id: id
  core_voice: from CAST MEMBER.voice_anchor.core_voice_in_one_sentence
  current_speech_pressure: from CURRENT CAST VOICE PRESSURE or explicit generation-time pressure
  rhythm_register_and_diction: from CAST MEMBER.voice_anchor
  current_must_preserve: merged durable + generation-time entries
  current_must_avoid: merged durable + generation-time entries
  temporary_override: from CAST VOICE OVERRIDES | none
```

Rules:

- Required for active/onstage person-like cast when dialogue or close POV voice matters.
- The compiler may merge fields deterministically; it must not use an LLM to summarize them.
- The pin is a salience duplicate. It does not replace full dossiers.

### 5.4 Sample utterance policy

Requirements:

- Optional.
- Default compiled count is zero.
- At most three per active/onstage character may compile.
- Compile only when user-selected or deterministically selected by explicit `speech_function`/`pressure_tags` metadata matching current generation-time pressure.
- Default copy policy is `never_copy_verbatim`.
- `canonical_phrase` must be rare and should still compile with anti-repetition warning.
- Samples must not reveal secrets, future-state material, or knowledge unavailable to the speaking character.

### 5.5 Prompt inclusion levels for cast

```yaml
active_onstage_full:
  include: all populated dossier fields + compiled voice pressure pin + current knowledge constraints + temporary voice override when present
present_minor_compressed:
  include: identity, current physical state, immediate behavior, voice warning, allowed actions, temporary override if any
offstage_relevance:
  include: why they matter now, current plan/clock/obligation, possible entrance or communication route if any, what not to reveal
background:
  include: omit or one line only
```

## 6. Knowledge, truth, and concealment records

### 6.1 FACT

Fields:

```yaml
id: id
fact_kind: hard_canon | current_state | setting_fact | discovered_fact
statement: prose
scope: global | entity | location | object | relationship | current_segment
known_by: list[entity_id] | public | unknown | not_applicable
audience_visibility: hidden | implied | explicit | not_applicable
salience: low | medium | high | critical
status: active
```

Notes:

- `deprecated_fact` is not a normal record kind.
- Supersession is a validation diagnostic, not a persistent FACT status.
- If a selected fact contradicts current authoritative state, generation blocks until the user revises, removes, or deselects it.

### 6.2 BELIEF

Fields:

```yaml
id: id
holder: entity_id
claim: prose
belief_mode: knows | believes | suspects | doubts | denies | reports | claims | deceives | misremembers | interprets
truth_relation: true | false | partly_true | unknown | contested | future_contingent
confidence: certain | high | medium | low | uncommitted
visibility: private | shared | factional | public | rumored | concealed | suppressed
access_route: direct_observation | testimony | document | object_trace | location_trace | inference | surveillance | institutional_channel | magic_tech | rumor | authorial_initialization
behavioral_effect: prose
salience: low | medium | high | critical
status: active | resolved | abandoned
```

Removed value:

- `branch_counterfactual` is removed. Use `false`, `contested`, `misremembers`, or remove the record.

Prompt treatment:

- Group by holder.
- Separate POV beliefs from non-POV behavior-shaping beliefs.
- Mark truth relation clearly.

### 6.3 SECRET

Fields:

```yaml
id: id
secret_kind: identity | motive | location | event_cause | artifact_truth | relationship | institutional | body_state | plan | other
secret_claim: prose
holders: list[entity_id]
non_holders_to_protect: list[entity_id] | all_except_holders | none
audience_visibility: hidden | implied | explicit | ambiguous
pov_access: hidden | can_suspect | knows_partly | knows
salience: low | medium | high | critical
status: hidden | partially_revealed | revealed | disproven | abandoned
allowed_surface_cues: prose list
forbidden_reveals: prose list
reveal_permission: locked | clue_only | natural_reveal_allowed | directive_required
reveal_triggers: prose list
clue_carriers:
  - clue_text: prose
    clue_strength: weak | suggestive | confirming | decisive | misleading
    discovered_by: none | entity_id | multiple | audience_only
    audience_visible: hidden | visible | ambiguous
    status: available | discovered | destroyed | suppressed | superseded
```

Rules:

- `locked` cannot be overridden by manual directive.
- Hidden truth may shape behavior but must not leak into the wrong narrator or mind.

### 6.4 POV KNOWLEDGE PROFILE

Compiled generation-time profile derived from PROSE MODE, FACT, BELIEF, SECRET, EVENT, and ENTITY STATUS.

```yaml
pov_knows: prose list
pov_believes_suspects_misreads: prose list
pov_does_not_know: prose list
pov_cannot_perceive_now: prose list
non_pov_interiority_rule: prose
```

### 6.5 AUDIENCE KNOWLEDGE PROFILE

Compiled generation-time profile.

```yaml
audience_knows: prose list
audience_does_not_know: prose list
dramatic_irony_permissions: prose list
```

## 7. State, space, and material records

### 7.1 LOCATION

```yaml
id: id
label: string
description: prose
layout_relevant_now: prose
access_routes: prose list
visibility_and_sound: prose
hazards_or_shelters: prose list
social_rules: prose list
status: active | inactive | destroyed | inaccessible
```

### 7.2 OBJECT

```yaml
id: id
label: string
description: prose
owner: entity_id | none | unknown
carried_by: entity_id | none | unknown
current_location: location_id | carried_by_holder | unknown | offstage
visibility_to_pov: visible | hidden | inferred | unknown
usable_affordances: prose list
constraints: prose list
durability: local_texture | continuity_relevant | major
status: active | lost | destroyed | transferred | inactive
```

### 7.3 VISIBLE AFFORDANCE

```yaml
id: id
label: string
available_to: entity_id | group | any_onstage
action_families:
  - move
  - evade
  - pursue
  - perceive
  - investigate
  - communicate
  - persuade
  - negotiate
  - bond
  - oppose
  - harm
  - protect
  - control
  - transfer
  - use
  - make_change
  - ritual_protocol
  - recover
  - wait
  - decide
requires: prose list
risk: none | social | physical | legal | emotional | secrecy | mixed
durability: local | reversible_state_change | durable_state_change | irreversible
prompt_text: prose
status: available | blocked | unavailable
```

Prompt treatment:

- Compile visible affordances as possible actions.
- Compile unavailable/impossible actions when omission would invite continuity errors.

## 8. Causal pressure records

### 8.1 EVENT

```yaml
id: id
event_kind: immediate_previous | recent_causal | relevant_backstory | offstage | withheld
sequence_order: number | prose | unknown
description: prose
participants: list[entity_id]
location: location_id | unknown | offstage
pov_visibility: perceived_directly | inferred_from_trace | reported | discovered_after | withheld
audience_visibility: hidden | implied | explicit | ambiguous
known_by: list[entity_id] | public | unknown
causes: list[record_id] | prose list
effects: list[record_id] | prose list
current_relevance: none | low | medium | high | critical
status: active | resolved | background | abandoned
```

### 8.2 INTENTION

```yaml
id: id
holder: entity_id
intent: prose
urgency: low | medium | high | critical
behavioral_pressure: prose
status: active | satisfied | abandoned | blocked
```

### 8.3 PLAN

```yaml
id: id
holder: entity_id
objective: prose
plan_status: active | blocked | suspended | fulfilled | failed | abandoned | revised
resources: prose list
blockers: prose list
current_step: prose
fallback_steps: prose list
visibility_to_pov: visible | hidden | suspected | known
salience: low | medium | high | critical
can_drive_prose: true | false
```

### 8.4 CLOCK

```yaml
id: id
title: string
clock_kind: danger | racing | mission | faction | exposure | pursuit | deadline | worsening_condition | opportunity | resource | emotional
salience: low | medium | high | critical
visibility: hidden | holder_specific | public | factional | audience_only
current_pressure: prose
tick_trigger: prose
next_threshold: prose
possible_effects: prose list
tick_history:
  - threshold: prose
    cause: prose
    result: prose
status: active | paused | resolved | abandoned
```

### 8.5 OBLIGATION

```yaml
id: id
status: open | closed | escalated | abandoned | transferred
obligation_kind: promise | debt | role | legal | social | familial | magical | financial | moral | institutional | other
owed_by: list[entity_id]
owed_to: list[entity_id] | public | institution | self | unknown
urgency: low | medium | high | critical
terms: prose
consequence_if_broken: prose
visibility: private | shared | public | hidden
```

### 8.6 CONSEQUENCE

```yaml
id: id
status: pending | active | resolved | escalated | abandoned
consequence_kind: physical | emotional | social | legal | financial | reputational | relational | logistical | supernatural | institutional | other
holder_or_target: list[entity_id] | location_id | object_id | public | unknown
cause: record_id | prose
urgency: low | medium | high | critical
current_effect: prose
possible_next_effect: prose
visibility: hidden | holder_specific | public | audience_only
```

### 8.7 OPEN THREAD

```yaml
id: id
type: question | promise | unresolved_setup | tension | mystery | risk
status: active | answered | resolved | escalated | abandoned | superseded
title: string
summary: prose
audience_visibility: hidden | implied | explicit | ambiguous
urgency: low | medium | high | critical
current_relevance: none | low | medium | high | critical
possible_pressure_now: prose
answer_if_known: prose | none
```

Rules:

- Use `OPEN THREAD`, not `dramatic question`.
- Open threads color local pressure; they do not command closure.

## 9. Relationship and emotion records

### 9.1 RELATIONSHIP

```yaml
id: id
axis: trust | fear | desire | debt | intimacy | loyalty | resentment | power_imbalance | attention | familiarity | approval | respect | obligation | hostility | dependency | rivalry | protectiveness | other
direction_kind: directed | bidirectional
from: entity_id
to: entity_id
value: none | trace | low | medium | high | extreme
valence: symmetric | asymmetric | bidirectional | adversarial | unstable
visibility: private | shared | public | hidden | audience_only
description: prose
pressure_text: prose
current_expression: prose
status: active | resolved | abandoned
```

Prompt treatment:

- Compile `description`, `pressure_text`, and `current_expression`, not raw axes alone.

### 9.2 EMOTION

```yaml
id: id
holder: entity_id
description: prose
status: active | suppressed | settled | transformed | dissociated
affect_kind: fear | anxiety | anger | disgust | grief | shame | guilt | humiliation | hope | relief | joy | awe | tenderness | desire | envy | contempt | confusion | dread | numbness | mixed | null
intensity: low | medium | high | extreme
behavioral_pressure:
  - approach
  - flee
  - freeze
  - attack
  - reject
  - dominate
  - submit
  - seek_contact
  - protect_other
  - seek_help
  - confess
  - conceal
  - withdraw_socially
  - plan
  - accommodate
  - self_soothe
  - ruminate
  - collapse
visibility: private | visible | inferred | hidden
surface_expression: prose
```

Prompt treatment:

- Compile as behavioral pressure and surface expression.
- Non-POV emotion is rendered through behavior/speech unless prose mode permits direct interiority.

## 10. Compiler contract and minimum prompt completeness

The authoritative placeholder mapping, section order, empty-state rendering rules, validation matrix, and blocker/warning taxonomy live in `compiler-contract.md`.

Schema/template synchronization rules:

- Every prompt placeholder must appear in `compiler-contract.md`.
- Every template section required by `FOUNDATIONS.md` must have a deterministic source and empty-state behavior.
- Every schema field used primarily for prompt compilation must name its prompt destination either here or in the compiler contract.
- Every validation-only field must be explicitly marked not prompt-facing by default.
- Adding, renaming, or deleting a prompt placeholder requires a compiler-contract update in the same change.

Minimum prompt completeness for v1:

1. Role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction must always compile.
2. Current authoritative state, immediate handoff, manual directive, and stop guidance must be present for every generation.
3. Non-omniscient POV requires a populated POV knowledge profile.
4. Active secrets require holders, protected non-holders, allowed cues, forbidden reveals, and reveal permission.
5. Active physical interaction requires current location, onstage entities, positions/distance, object possession, visibility/line of sight, routes/exits, available time, and unavailable/impossible actions where omission would invite error.
6. Active/onstage person-like cast requires a core cast dossier. Dialogue or close POV voice requires a compiled voice pressure pin.
7. Generation validation focus tags must identify first segment vs continuation and activate context-dependent blockers.
8. Optional sections render explicit empty states; constitutional sections are not omitted.
9. Unresolved contradictions, impossible conditions, missing mandatory fields, secret leakage, and accepted-prose inclusion are blockers.

## 11. Validation blockers and warnings

Blockers prevent prompt generation and OpenRouter sending. Warnings remain app-surface diagnostics and do not compile into the prose prompt.

Blockers include:

- two current locations for one entity;
- two holders for one object;
- active plan held by a dead, unconscious, captive, incapacitated, absent, or otherwise unable entity with no plausible means to act;
- selected POV both lacks and has the same secret according to selected records;
- manual directive requiring impossible movement, perception, timing, object possession, knowledge, or reveal;
- current authoritative state contradicting immediate handoff;
- relationship record implying actual contact between characters who have not met unless one-sided;
- clock threshold selected as happened while clock remains unticked and no consequence exists;
- offstage interruption without entrance, communication, timing, or causal route;
- content envelope inconsistent with active cast ages/statuses, story configuration, or provider constraints;
- active physical interaction without bodies, positions, objects, routes, visibility, time, and consent/force conditions where relevant;
- active/onstage person-like cast missing required core dossier when materially involved;
- dialogue or close POV expected while active speaker lacks enough voice anchor/current voice pressure;
- selected validation focus tag missing matrix-required state;
- accepted prose text, rejected candidate text, or automatic prose-derived summary appearing in prompt-facing fields;
- required constitutional prompt section missing or structurally empty.

Warnings include:

- prompt length or lost-in-the-middle risk;
- too many high-salience records for one local unit;
- missing optional sample utterances;
- sparse setting texture;
- no active clock/obligation/open thread when manual directive is otherwise sufficient;
- long active cast dossier where the user may want a stronger voice pin.

## 12. Local invention and durable change

```yaml
local_texture:
  examples: gestures, blocking, sensory details, unnamed background people, minor objects, minor sublocations
  record_update_needed: usually no
minor_complication:
  examples: interruption, misunderstanding, delay, refusal, evasive answer, visible clue, practical obstacle
  record_update_needed: sometimes
durable_change:
  examples: secret revelation, injury, sex/intimacy, violence, arrest, death, promise, object transfer, object destruction, major location change, institutional involvement, relationship redefinition, clock threshold tick
  record_update_needed: yes if accepted
```

Durable changes require strong cause from manual directive, plan step, clock trigger, obligation/consequence, physical affordance, relationship/emotion pressure, secret reveal trigger, object/location affordance, danger, or authority pressure.

## 13. Prompt ordering requirements

The compiler contract defines the authoritative order. The corrected high-level order is:

1. Role/output contract
2. Authority hierarchy
3. Content policy
4. Story contract and prose mode
5. Hard canon/current authoritative state
6. Immediate handoff
7. Manual directive
8. POV, audience knowledge, and reveal constraints
9. Active working set and current voice pressure pins
10. Plans, intentions, clocks, obligations, consequences, and open threads
11. Rich active cast dossiers
12. Present-minor and offstage cast relevance
13. Facts, beliefs, and events
14. Locations, objects, affordances, and physical continuity
15. Invention permissions and contradiction prohibitions
16. Prose craft
17. Stop rule
18. Final output instruction

This order keeps hard state early, final stop/output instructions late, and causal pressure before long dossiers.

## 14. Research notes

Provider guidance supports clear, structured prompts. Long-context research supports avoiding archive dumps and keeping high-priority information salient. RAG research supports explicit external context. Narrative-planning research supports causality and intentionality without requiring plot rails. Persona research supports rich character profiles, while few-shot over-prompting research supports sparse, annotated, non-copyable sample utterances.
