# Definitive Story Record Schema for the Continuity-First Prose App

Status: recommended baseline requirements schema  
Purpose: repository requirement document for future app iterations  
Scope: conceptual schema, prompt-compilation behavior, and minimal record taxonomy; not SQL, UI, migrations, API design, or implementation tickets

---

## 1. Design stance

The app stores a single current continuity. There are no branches and no branch history. The user selects or curates the active working set for the next prompt. The compiler deterministically turns the selected story records into a generated prose prompt for an external LLM writer.

The schema therefore has two jobs:

1. Preserve story truth, state, character, pressure, and affordance in a maintainable form.
2. Give the deterministic compiler enough structured information to assemble a prompt without needing another LLM to interpret, summarize, or rank records.

The schema is **hybrid**: structured fields carry operational meaning, while author-written prose fields carry nuance. The compiler should not invent prose-facing relationship pressure, voice, or hidden-truth handling from raw enums alone. If a nuance matters, it must be stored directly in a prose field such as `description`, `pressure_text`, `surface_cues`, `voice_profile`, or `current_expression`.

---

## 2. Global story properties

### 2.1 STORY CONTRACT

Defines the durable identity of the work.

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
- Kept near the top, before state and cast.
- Does not override hard canon, current authoritative state, POV constraints, or reveal locks.

### 2.2 UNIVERSAL CONTENT POLICY

A universal mature-fiction envelope, not per-story presets.

Required fields:

```yaml
rating_label: string
allowed_content_scope: prose
tonal_handling: prose
governing_policy_note: prose
```

Required semantic content:

- Adult/mature fiction is permitted.
- Explicit language, explicit sexuality, violence, horror, substance use, prejudice, morally reprehensible thoughts, morally reprehensible speech, and morally reprehensible behavior may be rendered when they serve character, situation, and continuity.
- The block must **not** say “NO RESTRICTIONS.” That phrase is dangerous because the prompt also depends on many restrictions: canon, POV, physical state, reveal rules, output format, and stop behavior.
- The block must not attempt to override the external model/platform’s governing policy.
- The block should forbid safety disclaimers, moral lectures, or assistant commentary inside the prose.

### 2.3 PROSE MODE

Defines the current rendering mode.

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
- If `pov_character` is set, POV knowledge constraints must also be compiled.

---

## 3. Generation-time brief

These properties are not necessarily permanent story records. They define the immediate prompt generation.

### 3.1 ACTIVE WORKING SET

The active working set is a first-class generation input, not necessarily a persisted record type.

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

- The compiler includes selected records in deterministic section order.
- The user may override active selection.
- Records outside the working set are omitted unless the same information is present in explicit story configuration or generation-time fields authored/selected by the user. The compiler must not silently add globally important records merely because they seem important.
- Active/onstage cast gets rich dossiers.
- Present-but-minor cast gets compressed presence/voice/affordance notes.
- Offstage cast gets relevance slices only.
- There is no maximum number of active/onstage full dossiers. The user is the gate. The compiler may warn about prompt length but must not silently compress active/onstage full cast.

### 3.2 CURRENT AUTHORITATIVE STATE

Snapshot of what is true at the start of generation.

Fields:

```yaml
current_time: prose or timestamp-like string
current_location: location_id | prose
onstage_entities: list[entity_id]
offstage_pressuring_entities: list[entity_id]
positions: prose or structured list
possessions: prose or structured list
visible_conditions: prose list
environmental_conditions: prose
current_locks: prose list
entity_statuses: prose or compiled ENTITY STATUS list
line_of_sight_and_visibility: prose
routes_and_exits: prose list
available_time: prose
consent_or_force_conditions: prose | none
```

Prompt treatment:

- Always included.
- Overrides older events, older facts, and stale descriptions.
- Should be compact, explicit, and state-like.

### 3.3 IMMEDIATE HANDOFF

The launch ramp for the prose segment.

Fields:

```yaml
recent_causal_context: prose
last_visible_moment: prose
prior_accepted_prose_status_or_handoff_note: prose | none
begin_after: prose
```

Prompt treatment:

- Always included.
- The external LLM begins after `last_visible_moment` or `begin_after`.
- It may include relevant prior events leading to the first segment, but must not become a flat event archive.
- It must not contain verbatim accepted prose or an automatic prose-derived summary. It is a user-authored continuity handoff only.

### 3.4 MANUAL MOMENT DIRECTIVE

The author’s current local instruction.

Fields:

```yaml
must_render: prose list
may_render_if_naturally_caused: prose list
do_not_force: prose list
```

Compiler treatment:

- If the user supplies only a vague instruction, the app may mechanically place it under `must_render` and leave the other fields blank or defaulted.
- Better UI should encourage the user to split the directive into the three fields, but the schema should not require them all to be filled.

Prompt authority:

- The directive wins over character defaults, ordinary reluctance, soft tendencies, and general pressure records.
- The directive does **not** override hard canon, current state, physical possibility, POV knowledge constraints, reveal locks, or governing content rules.


### 3.5 CAST VOICE OVERRIDES

Generation-time voice overrides are current-generation instructions for how an active/onstage cast member should be voiced in this specific prose request. They are not persistent character identity and must not be stored inside the durable CAST MEMBER dossier unless the user manually updates that dossier.

Fields:

```yaml
cast_voice_overrides:
  - cast_member_id: id
    override_text: prose
    applies_to: current_generation_only
```

Compiler treatment:

- Optional.
- Applies only to cast members selected in `active_onstage_cast_full` or `present_minor_cast_compressed`.
- Compile each override into `{active_cast_voice_pressure_pins}` for the matching cast member.
- Also compile each override into the matching active cast dossier under a clearly labeled line:

```md
Current generation voice override:
{override_text}
```

- Do not persist this field as durable character identity.
- Do not silently update the CAST MEMBER record from this field.
- If the user wants the override to become durable, they must manually edit the CAST MEMBER dossier.

Validation:

- Warn if an override targets a cast member not selected for the current generation.
- Block only if the override contradicts hard canon, current authoritative state, POV constraints, reveal constraints, or governing content rules.
- Do not block merely because the override is stylistic, temporary, or prose-rich.

### 3.6 GENERATION VALIDATION FOCUS

Generation-time validation focus tags tell deterministic validation which context-dependent minimums apply. They are not plot beats, act structure, dramatic arcs, or story rails. They do not instruct the prose writer to force events. They only activate validation requirements before compilation.

Fields:

```yaml
validation_focus_tags:
  generation_context:
    - first_segment
    - continuation_after_accepted_segment
  expected_local_modes:
    - physical_interaction_expected
    - dialogue_expected
    - introspection_expected
    - offstage_interruption_possible
    - secret_or_clue_pressure
    - non_pov_hidden_plan_behavior
  possible_durable_changes:
    - object_transfer_possible
    - location_change_possible
    - intimacy_or_sex_possible
    - violence_or_injury_possible
    - clock_tick_possible
    - obligation_breach_possible
```

Requirements:

- At least one `generation_context` value is required.
- `expected_local_modes` and `possible_durable_changes` may be empty only if the manual directive and current state are genuinely minimal.
- Tags are selected by the user or by deterministic UI controls, not by an LLM.
- Tags are validation-facing by default. They do not need to compile into the prompt unless the app later proves a prompt-facing validation-focus line improves outputs.
- If a tag is selected, the corresponding context-dependent blockers in the validation matrix apply.

---

## 4. Core entity records

### 4.1 ENTITY

Base record for anything that can hold state, exert pressure, be known about, possess objects, appear in relationships, or affect clocks.

ENTITY and CAST MEMBER should remain separate. ENTITY is the universal state-bearing object. CAST MEMBER extends ENTITY for human/person-like figures requiring voice, body, psychology, and dialogue.

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
- Non-character entities are supported because institutions, factions, families, places, systems, and supernatural forces can create obligations, clocks, authority, danger, access, witnesses, or pressure.

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

- Used to compile current authoritative state and physical continuity.
- Conflicts with active plans, current state, or location records should generate validation blockers when they make the generation impossible or contradictory; they should generate warnings only for non-blocking salience or completeness risks.

---

## 5. CAST MEMBER rich dossier

Active/onstage cast members need rich dossiers. The mission of the prose writer is not merely to move tokens through a state machine; it must render distinct human behavior and speech. Therefore, active cast should not be reduced to tiny character slices.

### 5.1 CAST MEMBER fields

Required fields:

```yaml
entity_id: id
identity:
  one_line: prose
  public_face: prose
  private_pressure: prose
world_pressure_core:
  world_produced_wound: prose
  active_appetite: prose
  self_mythology: prose
  irreconcilable_contradiction: prose
relational_charge: prose
moral_psychological_edge: prose
voice_pressure_pin:
  core_voice_in_one_sentence: prose
  current_speech_pressure: prose
  rhythm_register_and_diction: prose
  must_preserve: prose list
  must_avoid: prose list
voice:
  baseline: prose
  under_pressure: prose
  intimacy: prose
  evasion: prose
  anger: prose
  lying: prose
  anti_generic_warnings: prose list
speech_pattern_peculiarities:
  sentence_rhythm: prose
  vocabulary_and_metaphor_pools: prose
  profanity_and_taboo_behavior: prose
  register_switching: prose
  address_terms_and_naming: prose
  silence_and_interruption_behavior: prose
  dialogue_tactics: prose
  suppression_rules: prose
  anti_repetition_warnings: prose list
body_and_presence:
  physicality: prose
  body_limits: prose
  habitual_gestures: prose
  clothing_presentation: prose
  social_presentation: prose
pressure_behavior:
  cornered: prose
  tempted: prose
  humiliated: prose
  protecting_attachment: prose
  offered_power: prose
perception_and_embodiment:
  notices: prose
  misses: prose
  misreads: prose
  sensory_bias: prose
agency_and_planning:
  default_strategy: prose
  risk_style: prose
  fallback_style: prose
  planning_blind_spots: prose
```

Optional fields:

```yaml
sample_utterances:
  - text: string
    situation: prose
    speech_function: prose
    copy_policy: never_copy_verbatim | may_echo_lightly | canonical_phrase
additional_do_not_write: prose list
```

### 5.2 Sample utterance policy

Sample dialogue lines are powerful but risky. They can improve register, cadence, and role consistency, but they can also cause shallow mimicry and phrase repetition. Use them sparingly.

Requirements:

- `sample_utterances` are optional.
- Each sample must have `situation`, `speech_function`, and `copy_policy`.
- Default copy policy is `never_copy_verbatim`.
- The compiler may compile at most three sample utterances per active/onstage character.
- Default compiled sample count is zero.
- Samples compile only when user-selected or deterministically selected by explicit metadata such as `speech_function` matching a selected generation focus tag.
- Samples marked `canonical_phrase` should be rare and should still compile with an anti-repetition warning.
- Samples must not reveal secrets, future-state material, or knowledge unavailable to the speaking character in the current generation.

### 5.3 Prompt inclusion levels for cast

```yaml
active_onstage_full:
  include: full rich dossier + voice pressure pin + current knowledge constraints; generation-time voice overrides appear as clearly labeled temporary lines when present
present_minor_compressed:
  include: identity, current physical state, immediate behavior, voice warning, allowed actions
offstage_relevance:
  include: why they matter now, current plan/clock/obligation, possible entrance route if any, what not to reveal
background:
  include: omit or one line only
```

No hard cap on active full dossiers. The compiler may warn about length and “lost in the middle” risk, but should not silently discard active cast richness.

---

## 6. Knowledge, truth, and concealment records

### 6.1 FACT

Facts should be split by prompt function.

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

- Do not use `deprecated_fact` as a normal record kind. If a fact is wrong or retired, the user should remove or supersede it.
- Supersession is not a persistent FACT status. If validation detects that a selected fact appears superseded by current authoritative state, it should report a validation diagnostic such as:

```yaml
diagnostic_kind: superseded_by_current_state_candidate
severity: blocker | warning
affected_records: list[record_id]
message: prose
```

If the selected fact truly contradicts current state, generation blocks until the user revises, removes, or deselects the fact.

Prompt treatment:

- `hard_canon` and `current_state` go near the top.
- `setting_fact` and `discovered_fact` go later, only when relevant.

### 6.2 BELIEF

Holder-specific claim, interpretation, misbelief, report, suspicion, denial, or knowledge-state.

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

- `branch_counterfactual` is removed. There are no branches. Use `false`, `contested`, or remove the record.

Prompt treatment:

- Group by holder.
- Separate POV beliefs from non-POV behavior-shaping beliefs.
- False or partial beliefs should be clearly marked so the writer can render misread without turning it into truth.

### 6.3 SECRET

Story-local hidden truth.

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

Prompt treatment:

- Compile into separate lanes: writer-visible hidden truth, holders, non-holders, allowed cues, forbidden reveals, reveal permission.
- The writer may know the secret so behavior and subtext work.
- The POV/narrator may not know the secret unless the POV access allows it.
- Natural revelation is allowed only when `reveal_permission` is `natural_reveal_allowed`. `directive_required` allows reveal only when the manual directive explicitly requires or permits it. `locked` cannot be overridden by manual directive.

### 6.4 POV KNOWLEDGE PROFILE

A compiled generation-time section, derived from FACT, BELIEF, SECRET, EVENT, and PROSE MODE.

Fields:

```yaml
pov_knows: prose list
pov_believes_suspects_misreads: prose list
pov_does_not_know: prose list
pov_cannot_perceive_now: prose list
non_pov_interiority_rule: prose
```

Not a separate persistent record unless the app benefits from storing it.

### 6.5 AUDIENCE KNOWLEDGE PROFILE

A compiled generation-time section.

Fields:

```yaml
audience_knows: prose list
audience_does_not_know: prose list
dramatic_irony_permissions: prose list
```

Audience knowledge matters. The reader may know something the POV does not. The prose can use surface irony without granting forbidden knowledge to the POV.

---

## 7. State, space, and material records

### 7.1 LOCATION

Fields:

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

Prompt treatment:

- Include current location and immediately reachable locations.
- Avoid dumping irrelevant world atlas material.

### 7.2 OBJECT

Fields:

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

Prompt treatment:

- Include objects that are visible, carried, usable, desired, missing, dangerous, symbolic, or likely to change hands.

### 7.3 VISIBLE AFFORDANCE

What can plausibly happen now.

Fields:

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

- Compile as prose-facing possible actions, not as raw enum lists only.
- Affordances should include impossible/unavailable actions when that prevents continuity errors.

---

## 8. Causal pressure records

### 8.1 EVENT

Historical record of important events before or within the story.

Fields:

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

Prompt treatment:

- Do not show events as a flat archive.
- Compile into: immediate previous event, recent causal chain, relevant backstory, offstage event, withheld event.
- Include causal links when they matter for current behavior.

### 8.2 INTENTION

A current goal-state, not necessarily a plan.

Fields:

```yaml
id: id
holder: entity_id
intent: prose
urgency: low | medium | high | critical
behavioral_pressure: prose
status: active | satisfied | abandoned | blocked
```

Prompt treatment:

- Include when active and currently relevant.
- Intentions shape choices but are weaker than active PLAN records.

### 8.3 PLAN

Actor-owned tactical plan over multiple prose segments.

Fields:

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

Prompt treatment:

- Active, relevant plans strongly drive prose.
- Plans should be included as pressure, resources, blockers, current step, and fallback.
- Non-POV hidden plans may shape behavior but not POV knowledge.

### 8.4 CLOCK

Present-causal pressure that can worsen or change through time, exposure, pursuit, deadlines, danger, scarcity, faction action, emotional collapse, or opportunity loss.

Fields:

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

Prompt treatment:

- Because the user manually updates records, clocks are not mechanically advanced by the app.
- The prompt may allow the external writer to make a clock visibly tick when strongly caused by the current moment.
- The accepted prose only becomes continuity after the human accepts it and updates records.

### 8.5 OBLIGATION

Promised, owed, required, role-bound, legal, magical, social, familial, financial, or moral constraint.

Fields:

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

Prompt treatment:

- Obligations constrain plausible choice and can justify escalation or durable change.

### 8.6 CONSEQUENCE

Realized or pending effect from prior event or state.

Fields:

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

Prompt treatment:

- Consequences are one of the cleanest justifications for durable change.

### 8.7 OPEN THREAD

Merge THREAD and STORY QUESTION into OPEN THREAD.

Fields:

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

Prompt treatment:

- Use “open thread,” not “dramatic question,” in generated prompts.
- Threads should not impose act structure. They keep unresolved setup visible.

---

## 9. Relationship and emotion records

### 9.1 RELATIONSHIP

Directed or symmetric relation between entities.

Fields:

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

- Do not show raw relationship axes alone.
- Compile `description`, `pressure_text`, and `current_expression` into relationship/emotion pressure.
- Raw metadata can appear in brackets only when useful.

### 9.2 EMOTION

Current emotional pressure.

Fields:

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

- Compile as behavioral pressure, not diagnostic exposition.
- Non-POV emotions must be rendered through surface expression, speech, action, and timing unless omniscient mode allows more.

---

## 10. Compiler mapping and minimum prompt completeness

Every prompt placeholder must have a deterministic source. The compiler is allowed to format, group, sort, and render selected records and generation-time fields. It is not allowed to infer missing pressure, silently select outside records, summarize prose, or repair contradictions with an LLM.


Schema/template synchronization rule:

- Every prompt placeholder must appear in this mapping table.
- Every template section required by FOUNDATIONS must have a source and empty-state behavior.
- Every schema field that exists primarily for prompt compilation must name its prompt destination.
- Every validation-only field must be explicitly marked as not prompt-facing by default.
- Adding, renaming, or deleting a prompt placeholder requires a mapping-table update in the same change.

| Prompt section / placeholder | Source record type or generation-time field | Required? | Validation if missing | Empty-state rendering | Notes |
|---|---|---:|---|---|---|
| `<role>` | Template constant | Yes | Block if template missing | Not applicable | No story data. |
| `<authority_hierarchy>` | Template constant aligned with FOUNDATIONS | Yes | Block if omitted or reordered incompatibly | Not applicable | Manual directive remains below state, physical continuity, POV, and reveal locks. |
| `{rating_label}` and content-policy body | UNIVERSAL CONTENT POLICY + STORY CONTRACT content fields | Yes | Block if rating/content envelope is absent or contradicts active cast ages/statuses/provider constraints | Render story-configured envelope; never render `NO RESTRICTIONS` | Governing provider/platform policy remains first. |
| `{title}` | STORY CONTRACT.title | Yes | Block | Not applicable | Stable story identity. |
| `{premise}` | STORY CONTRACT.premise | Yes | Block if blank | Not applicable | Should be durable premise, not current scene recap. |
| `{genre_mode}`, `{tone}`, `{content_intensity}`, `{explicitness}`, `{language_register}`, `{setting_baseline}` | STORY CONTRACT fields | Yes | Block if absent for title/premise/tone; warn for missing setting baseline when irrelevant | `None specified` only for nonessential subfields | These do not override canon/state. |
| `<prose_mode>` fields | PROSE MODE generation-time field or story default overridden for generation | Yes | Block if POV/person/tense/interiority cannot be resolved | Not applicable | If POV is not omniscient, knowledge constraints are mandatory. |
| `{paragraphing}` | PROSE MODE.paragraphing or STORY CONTRACT prose preference default | Yes | Block if unresolved | Not applicable | Template renders it explicitly. |
| `{hard_canon_bullets}` | FACT where `fact_kind=hard_canon` selected, plus story-level immutable locks selected by user | Yes if story has hard canon relevant to segment | Warn if none; block if current state needs missing hard canon such as active cast age/status | `None selected for this generation` | Do not silently include unselected facts except story configuration constants. |
| `<current_authoritative_state>` fields | CURRENT AUTHORITATIVE STATE generation-time field, ENTITY STATUS, LOCATION, OBJECT | Yes | Block if active physical interaction lacks time/location/onstage entities/positions/possessions/visibility/routes as applicable | Optional subfields render `None currently specified` | Current state overrides older selected records only if no contradiction remains; unresolved contradictions block. |
| `{line_of_sight_and_visibility}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS.visibility_to_pov | Required for physical interaction; recommended always | Block when physical interaction, perception, secrecy, violence, intimacy, or interruption depends on visibility | `None currently specified` only for nonphysical/minimal moments | Also reflected in physical continuity. |
| `{routes_and_exits}` | CURRENT AUTHORITATIVE STATE + LOCATION.access_routes + AFFORDANCE | Required for movement, pursuit, escape, interruption, location change | Block when route matters and absent | `None currently specified` | Must include impossible/unavailable routes when omission invites errors. |
| `{available_time}` | CURRENT AUTHORITATIVE STATE + CLOCK + handoff | Required when timing, pursuit, deadline, injury, intimacy, or interruption matters | Block if directive requires action without enough time state | `None currently specified` | “Enough time to speak” can be sufficient. |
| `{consent_or_force_conditions}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + RELATIONSHIP/OBLIGATION/AFFORDANCE as selected | Required for intimacy, restraint, violence, coercion, object seizure, rescue, captivity | Block if relevant and absent | `None currently specified` | Does not moralize; it preserves physical/social continuity. |
| `{recent_causal_context}` | IMMEDIATE HANDOFF.recent_causal_context + selected EVENT records grouped as immediate/recent | Yes | Block if blank and generation is not first segment or lacks launch context | `None; first local unit begins from current state` | Writer-visible, not automatically POV knowledge. Must not contain verbatim accepted prose. |
| `{last_visible_moment}` | IMMEDIATE HANDOFF.last_visible_moment | Yes | Block if blank | Not applicable | The exact launch point. |
| `{prior_accepted_prose_status_or_handoff_note}` | IMMEDIATE HANDOFF prior status/handoff note authored by user | Yes | Block if it contains accepted prose text or automatic prose-derived summary | `None. No accepted prose is included.` | Replaces `most_recent_prose_summary`. |
| `{begin_after}` | IMMEDIATE HANDOFF.begin_after | Yes | Block if blank | Not applicable | Must not contradict last visible moment/current state. |
| `{manual_must_render}` | MANUAL MOMENT DIRECTIVE.must_render | Yes | Block if absent/blank | Not applicable | May be a single plain instruction. |
| `{manual_may_render_if_naturally_caused}` | MANUAL MOMENT DIRECTIVE.may_render_if_naturally_caused | No | No block | `None specified` | Optional invention corridor. |
| `{manual_do_not_force}` | MANUAL MOMENT DIRECTIVE.do_not_force | No but recommended | Warn if blank for risky scenes | `None specified` | Useful guardrail against overreach. |
| `<pov_knowledge_constraints>` | Compiled POV KNOWLEDGE PROFILE from PROSE MODE, FACT, BELIEF, SECRET, EVENT, ENTITY STATUS | Yes when POV is not omniscient | Block if missing, contradictory, or if selected secret is both hidden and granted to POV | Optional lanes render `None specified`; the section itself never omitted | Prompt labels do not grant POV knowledge. |
| `<audience_knowledge>` | AUDIENCE KNOWLEDGE PROFILE from SECRET.audience_visibility, EVENT.audience_visibility, FACT.audience_visibility, user-authored generation-time audience notes | Yes when audience differs from POV or hidden truth is writer-visible | Warn if empty; block if active secret has no audience/POV relation | `No audience knowledge distinct from POV specified` | Dramatic irony without leakage. |
| `<secrets_and_reveal_constraints>` | SECRET records selected or active in current moment | Required if any selected secret affects current behavior, POV, or reveal | Block if holders/non-holders/reveal permission missing | `No active secrets or reveal locks selected` | `locked` cannot be overridden by manual directive. |
| `<active_working_set>` pressure lanes | User-authored generation-time pressure summary, plus deterministic grouping of selected pressure records using their prose-facing fields | Yes | Warn if all pressure lanes empty; block if manual directive lacks enough context to produce local motion | Empty lanes render `None beyond detailed records below` | This is a précis, not LLM summarization. |
| `{active_cast_voice_pressure_pins}` | CAST MEMBER.voice_pressure_pin + generation-time cast_voice_overrides | Yes for active/onstage person-like cast | Block if missing and dialogue or close POV is expected; warn otherwise | Not applicable if no active person-like cast | Salience duplicate, not compression. |
| `validation_focus_tags` | GENERATION VALIDATION FOCUS | Yes, validation-only | Block if generation context absent; apply matrix rows by selected tags | Not prompt-facing by default | Not plot structure. |
| `{active_onstage_full_cast_dossiers}` | CAST MEMBER records selected as active_onstage_full | Yes for active person-like onstage cast | Block if active/onstage person lacks cast dossier or minimal voice/behavior fields | Not applicable when no person-like cast is onstage | Must not be silently compressed. |
| `{present_minor_cast_notes}` | CAST MEMBER/ENTITY selected as present_minor_compressed | No | No block | `None` | Compressed notes only. |
| `{offstage_relevance_notes}` | CAST MEMBER/ENTITY selected as offstage_relevant_cast + offstage plans/clocks/obligations | No unless offstage pressure/interruption is active | Block if offstage interruption is possible/required but route/timing/communication is missing | `None` | No full offstage dossier unless user selects. |
| `{active_intentions}` | INTENTION records selected, status active/blocked if relevant | No | Warn if manual directive implies a character goal but none is selected/authored | `None active` | Intentions are weaker than plans. |
| `{active_plans}` | PLAN records selected, status active/blocked/suspended if current pressure | No unless directive depends on plan | Block if plan holder cannot act and plan is meant to drive prose | `None active` | Plans drive tactics only when current step can operate. |
| `{active_clocks}` | CLOCK records selected, status active/paused as relevant | No | Block if selected clock contradicts current state; warn if clock appears stale | `None active` | Writer-facing pressure; human updates after acceptance. |
| `{active_obligations}` / `{active_consequences}` | OBLIGATION and CONSEQUENCE records selected | No | Block if selected obligation/consequence assumes contradicted state | `None active` | Strong durable-change support. |
| `{active_open_threads}` | OPEN THREAD records selected | No | Warn if too many high-urgency threads selected for a local unit | `None active` | Never commands closure. |
| `{pov_accessible_facts}` | FACT records selected and known_by includes POV/public or POV knows via BELIEF | No, except where needed for directive/current state | Block if required fact missing for manual directive | `None beyond current state and hard canon` | Replaces generic `{relevant_facts}`. |
| `{writer_visible_or_non_pov_facts}` | FACT records selected but not POV-accessible; SECRET/Event-derived facts with audience/writer visibility | No | Block if hidden fact lacks reveal constraints | `None` | Must not become narrator knowledge. |
| `{pov_relevant_beliefs}` | BELIEF records held by POV | No | Warn if none and POV-heavy scene lacks interpretive pressure | `None specified` | Mark truth relation. |
| `{non_pov_behavior_shaping_beliefs}` | BELIEF records held by non-POV cast | No | Block if used as direct non-POV interiority in close POV mode | `None specified` | Render through behavior. |
| `{recent_events}`, `{relevant_backstory}`, `{offstage_or_withheld_events}` | EVENT records grouped by event_kind and visibility | No except when handoff/directive depends on them | Warn if too many background events selected; block if event contradicts current state | `None selected` | No flat archive dump. |
| `{locations}`, `{objects}`, `{visible_affordances}`, `{unavailable_or_impossible_actions}` | LOCATION, OBJECT, AFFORDANCE, ENTITY STATUS, CURRENT AUTHORITATIVE STATE | Yes for active physical interaction | Block if physical continuity dangerously underspecified | Optional lanes render `None specified` | Include unavailable actions when omission invites error. |
| `{physical_continuity}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + LOCATION/OBJECT/AFFORDANCE | Yes for active physical interaction | Block if missing bodies/objects/routes/visibility/time/consent-force conditions where relevant | Not applicable only for nonphysical abstract prose, which v1 should rarely generate | Must be concrete and current. |
| `<invention_permissions>` | Template constant + story/generation configured permissions | Yes | Block if absent | Not applicable | Durable changes require strong cause and human gatekeeping. |
| `<contradiction_prohibitions>` | Template constant + selected current locks | Yes | Block if absent | Not applicable | Cannot be weakened by directive. |
| `<prose_craft>` | Template constant + story/prose preferences + cast voice fields | Yes | Warn if special style constraints conflict with prose mode | Not applicable | Craft cannot alter continuity. |
| `{soft_unit_guidance}` | STOP GUIDANCE generation-time field | Yes | Block if blank | Not applicable | Replaces beat count. |
| `<final_output_instruction>` | Template constant | Yes | Block if absent | Not applicable | Keep at final prompt edge. |

Minimum prompt completeness for v1:

1. Role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction must always compile.
2. Current authoritative state, immediate handoff, manual directive, and stop guidance must be present for every generation.
3. Non-omniscient POV requires a populated POV knowledge profile.
4. Any active secret requires holders, protected non-holders, allowed cues, forbidden reveals, and reveal permission.
5. Any active physical interaction requires current location, onstage entities, positions/distance, object possession, visibility/line of sight, routes/exits, available time, and unavailable/impossible actions where omission would invite error.
6. Any active/onstage person-like cast member requires a full cast dossier plus a voice pressure pin, or explicit user-selected minimal emergency dossier; v1 should block if neither exists.
7. Generation validation focus tags must identify whether this is a first segment or a continuation after an accepted segment, and must activate context-dependent blockers when relevant.
8. The compiler must render empty optional sections explicitly as `None`, `None active`, or `None selected`; it must not omit constitutional sections.
9. Unresolved contradictions, impossible conditions, missing mandatory fields, secret leakage, and accepted-prose inclusion are blockers. Length, salience, optional nuance gaps, and lost-in-the-middle risk are warnings.


### 10.1 Generation validation matrix

Universal minimum prompt completeness is necessary but not enough. The selected `validation_focus_tags` activate context-dependent blockers.

| Validation focus tag | Context-dependent blockers |
|---|---|
| `first_segment` | `prior_accepted_prose_status_or_handoff_note` must render as no accepted prose included; launch state must be self-sufficient; no continuation phrase like “as above.” |
| `continuation_after_accepted_segment` | Handoff note must be user-authored; accepted prose text/rejected candidate text/auto prose summary blocks; durable changes mentioned in handoff must be represented in selected records or current state when deterministically identifiable. |
| `physical_interaction_expected` | Requires location, onstage entities, positions/distance, visibility/line of sight, possessions, routes/exits, available time, and unavailable/impossible actions when omission invites error. |
| `dialogue_expected` | Active speakers need CAST MEMBER dossiers, voice pressure pins, language/register state, POV knowledge boundaries, and relationship/status context sufficient to avoid generic exchange. |
| `introspection_expected` | Requires POV beliefs/suspicions/misreads, relevant emotions or interior pressure, psychic distance/interiority mode, and non-POV interiority restrictions. |
| `secret_or_clue_pressure` | Requires secret claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, reveal permission, and reveal triggers if any. |
| `object_transfer_possible` | Requires object owner/carried_by/current_location/visibility, usable affordances, constraints, transfer possibility, and current body positions. |
| `location_change_possible` | Requires source location, destination or reachable route, exits, available time, movement constraints, transport if relevant, and offstage arrival consequences if relevant. |
| `offstage_interruption_possible` | Requires offstage entity location or uncertainty state, communication/entrance/timing route, awareness mechanism, and whether interruption is physical, audible, digital, institutional, or environmental. |
| `intimacy_or_sex_possible` | Requires active cast ages/statuses, content envelope consistency, consent/force conditions, body positions, privacy/publicness, relationship/emotion pressure, and physical affordances. |
| `violence_or_injury_possible` | Requires agency/status, positions, weapons or bodily affordances, force conditions, injury consequences, visibility, available time, and location constraints. |
| `clock_tick_possible` | Requires active clock, current pressure, tick trigger, next threshold, possible effects, and concrete event that could visibly cause the tick. |
| `obligation_breach_possible` | Requires obligation terms, owed_by, owed_to, visibility, consequence_if_broken, and current opportunity or pressure to breach/fulfill. |
| `non_pov_hidden_plan_behavior` | Requires plan holder status/location/means, current step, visibility_to_pov, behavioral surface cues, and close-POV non-interiority restrictions. |

Warnings that must not block:

- prompt length or lost-in-the-middle risk;
- too many high-salience records;
- missing optional sample utterances;
- no active clock when the manual directive is otherwise sufficient;
- sparse setting texture;
- a long cast dossier that may benefit from a stronger voice pin.

## 11. Validation blockers and compiler warnings

The deterministic compiler must classify validation output as either blockers or warnings. Blockers prevent prompt generation and OpenRouter sending. Warnings may be shown to the user, but they do not become instructions to the external prose writer.

Blockers include:

- two current locations for one entity when both are selected as current
- two holders for one object when both are selected as current
- an active plan held by a dead, unconscious, captive, incapacitated, absent, or otherwise unable entity with no plausible means to act
- a POV character marked as not knowing a secret while another selected record grants that knowledge
- a manual directive requiring impossible movement, impossible perception, impossible timing, impossible object possession, impossible knowledge, or a reveal forbidden by a locked secret
- current authoritative state contradicting immediate handoff
- a relationship implying actual contact between characters who have not met, unless the record clearly marks one-sided perception/desire/fear
- a clock threshold that selected records say has happened while the clock remains unticked and no resolved consequence exists
- an offstage entity marked as interrupting without an entrance route, communication route, timing route, or plausible causal mechanism
- a content-policy envelope inconsistent with active cast ages/statuses, story configuration, or governing model/provider constraints
- active physical interaction without enough bodies, positions, objects, routes, visibility, available time, and consent/force conditions where relevant
- active/onstage person-like cast missing a full dossier, voice pressure pin, or minimal emergency voice/behavior substitute when dialogue or close POV is expected
- selected generation validation focus tag missing its required state from the validation matrix
- accepted prose text, rejected candidate text, or an automatic prose-derived summary appearing in any prompt-facing field
- any constitutional prompt section missing or structurally empty where the universal prompt contract requires content

Warnings include:

- prompt length or lost-in-the-middle risk
- too many high-salience records selected for one local unit
- missing optional nuance such as sample utterances, anti-repetition warnings, or setting texture
- no active clock, obligation, open thread, or relationship pressure when the manual directive is otherwise sufficient
- active cast dossier is long enough that the user may want to strengthen the concise voice pressure pin in `<active_working_set>`

Do not compile unresolved contradictions into the generated prose prompt as `<compiler_warning>`. If the issue is real, block. If it is not blocking, show it in the app’s validation surface, not as prose-writer context.

---

## 12. Local invention and durable change

The schema must support three levels of invention.

```yaml
local_texture:
  examples: gestures, blocking, sensory details, unnamed background people, minor objects, minor sublocations
  record_update_needed: usually no
minor_complication:
  examples: interruption, misunderstanding, delay, refusal, evasive answer, visible clue, practical obstacle
  record_update_needed: sometimes
durable_change:
  examples: secret revelation, injury, sex/intimacy, violence, arrest, death, promise, object transfer, major location change, institutional involvement, relationship redefinition, clock threshold tick
  record_update_needed: yes if accepted
```

The external writer may create durable changes when strongly caused by active records and the current moment. The human reader remains the continuity gate by accepting/rejecting the prose and manually updating records.

Durable changes can be justified by:

- manual directive
- active plan current step
- active clock tick trigger
- obligation enforcement or breach
- pending/active consequence
- immediate physical affordance
- relationship/emotion pressure combined with feasible action
- secret reveal trigger
- object/location affordance
- current danger or authority pressure

Durable changes should not be justified by:

- tone alone
- genre expectation alone
- a stale backstory detail
- a hidden truth with no current clue, pressure, or reveal permission
- a relationship axis without current expression or immediate action

---

## 13. Prompt ordering requirements

The generated prompt should order records roughly as follows:

1. Role/output contract
2. Authority hierarchy
3. Content policy
4. Story contract and prose mode
5. Hard canon/current authoritative state
6. Immediate handoff
7. Manual directive
8. POV, audience knowledge, and reveal constraints
9. Active working set, voice pressure pins, and causal pressure
10. Rich active cast dossiers
11. Present-minor and offstage cast relevance
12. Plans, clocks, obligations, consequences, open threads
13. POV-accessible facts, writer-visible/non-POV facts, beliefs, events
14. Locations, objects, affordances, physical continuity
15. Invention permissions and contradiction prohibitions
16. Prose craft
17. Stop rule
18. Final output instruction

This order keeps critical state early, rich characterization available, and final output/stop instructions late.

---

## 14. Research notes

- Structured prompts with explicit sections are recommended by current provider guidance. OpenAI, Anthropic, and Google all document sectioned prompt practices; Anthropic and Google specifically show XML-style or tag/Markdown boundary patterns for mixed instructions, context, and tasks.
- Long-context research shows that models can underuse information buried in the middle of long prompts. This supports placing hard state and final output/stop instructions at the beginning/end, and using section labels to reduce ambiguity.
- Retrieval-augmented generation research supports explicit external context over relying on a model’s internal memory for specificity and factuality. In this app, selected active records function as story-specific retrieval context.
- Narrative-planning research emphasizes causal progression and character intentionality. That supports strong PLAN, INTENTION, CLOCK, CONSEQUENCE, and OBLIGATION records without using act structure.
- Persona and role-playing LLM research supports supplying character profiles for consistency, but few-shot prompting research and practice warn against over-conditioning with too many examples. That is why active cast gets rich dossiers, while sample utterances remain optional, annotated, and non-copyable by default.

Sources: OpenAI prompt engineering guide; Anthropic prompting best practices; Google Gemini prompt design strategies; Liu et al., “Lost in the Middle”; Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks”; Riedl & Young, “Narrative Planning: Balancing Plot and Character”; Young, Ware, Cassell & Robertson, “Plans and Planning in Narrative Generation”; Tseng et al., “Two Tales of Persona in LLMs”; Tang et al., “The Few-shot Dilemma.”
