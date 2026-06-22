# Definitive Story Record Schema for the Continuity-First Prose App

Status: active reference — story-record schema, generation-time brief schema, prompt-compilation behavior, validation requirements, and record taxonomy
Authority: domain authority for story record and generation-time brief schema (see docs/ACTIVE-DOCS.md)

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
setting_baseline: prose
content_intensity: general | mature | explicit | graphic | variable
explicitness: prose
language_register: prose
```

Prompt treatment:

- Always included.
- Continuity-first doctrine is constitutional/static, not a configurable story property.
- Does not override hard canon, current authoritative state, POV constraints, reveal locks, or provider policy.

### 2.2 UNIVERSAL CONTENT POLICY

Required fields:

```yaml
rating_label: string
allowed_content_scope: prose
tonal_handling: prose
character_bias_handling: prose
```

Required semantic content:

- Adult/mature fiction may be supported when story configuration permits it.
- Explicit language, explicit sexuality, violence, horror, substance use, prejudice, morally reprehensible thoughts, morally reprehensible speech, and morally reprehensible behavior may be rendered when they serve character, situation, and continuity.
- The block must never say `NO RESTRICTIONS`.
- It must not attempt to override external model/provider/platform policy.
- External model/provider/platform policy is fixed template doctrine, not editable project data.
- It should forbid assistant disclaimers, moral lectures, warnings, safety commentary, or out-of-fiction analysis inside prose.
- It must preserve the distinction between character-held bias and narrator-certified fact.
- All five fields compile into `<content_policy>`; the compiler must not replace them with a generic maturity boilerplate.

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

### 3.0 Draft and ready generation session shapes

Generation-time fields have a draft shape and a ready shape.

`GenerationSessionDraft` is the persistence shape. It may contain partial nested objects, blank optional strings, empty arrays, and missing readiness fields. It must preserve the author's work even when Preview and Generate are blocked.

`GenerationSessionReadyInput` is the normalized validation and compiler input. It is produced from the saved draft, selected records, story configuration, accepted-segment count, provider configuration where relevant, and deterministic empty-state/default rules. It may default non-story values such as `generation_context`; it must not invent story facts, handoff prose, routes, positions, current situation, voice pressure, or manual directive content.

Schema-level principle:

- Draft schema should be permissive enough for normal form work.
- Ready schema should be strict enough for compiler safety.
- Storage validation and generation readiness validation are separate concerns.

### 3.1 ACTIVE WORKING SET

Fields:

```yaml
selected_records: list[record_id]
active_onstage_cast_full:
  - cast_member_id: id
    local_function: pov_narrator | active_speaker | active_silent | close_non_pov | physically_active | materially_referenced
present_minor_cast_compressed: list[cast_member_id]
offstage_relevant_cast: list[cast_member_id]
selected_pov: entity_id | omniscient
```

Storage note: historical provenance from SPEC004RECCRUBAS-002 Option A,
implemented as designed and archived at
`archive/tickets/SPEC004RECCRUBAS-002.md`: storage may persist membership-only
active working sets containing `selected_records` without a POV or manual
directive. `selected_pov` remains a generation-time readiness requirement when
the prose mode needs a concrete viewpoint, but that fail-closed check belongs to
the validation engine rather than the storage schema. The manual directive's
readiness-required content is `manual_moment_directive.must_render`, not a
separate active-working-set reference.

Compiler requirements:

- Include selected records in deterministic section order.
- Do not silently add globally important records merely because they seem important.
- Do not silently remove or compress selected active/onstage cast.
- Use `local_function` to determine validation floors and voice/body pin requirements, not to reduce a full active/onstage dossier.
- Warn about risky omissions or prompt length; block only when minimum completeness or contradiction rules require it.
- `selected_records` ids must resolve before a validation snapshot can be built; stale ids fail closed with the missing ids and the fix to remove them from the working set.
- Cast-band ids must resolve to selected CAST MEMBER records and a cast member may appear in only one rendered band.
- `selected_pov` may be `omniscient`; otherwise it must resolve to a selected ENTITY or CAST MEMBER before compilation. `variable` is only a PROSE MODE sentinel and must resolve to a concrete generation-time `selected_pov`.

### 3.2 CURRENT AUTHORITATIVE STATE

Snapshot of what is true at the start of generation.

Readiness-required universal fields:

- `current_time`: prose or timestamp-like string;
- `current_location`: location id, scene-space id, or prose location/scene-space label;
- `onstage_entities`: list of entity ids or an explicit none/abstract state when the local unit has no material entities;
- `immediate_situation_summary`: concise prose describing what is happening now and why the next local unit can begin.

Context-gated fields:

- `offstage_pressuring_entities` is required when offstage pressure, interruption, communication, pursuit, or institutional action can matter.
- `positions` is required when physical interaction, line of sight, movement, intimacy, violence, object transfer, turn-taking, or blocking can matter.
- `possessions` is required when object use, transfer, search, concealment, theft, weapon use, or carried-object continuity can matter.
- `visible_conditions` is required when injury, restraint, disguise, exhaustion, intoxication, status, or other visible condition can affect the local unit.
- `environmental_conditions` is required when environment constrains action, perception, tone, danger, route, or affordance.
- `entity_statuses` is required for materially involved entities whose agency, consciousness, availability, captivity, injury, age/status, or presence matters.
- `line_of_sight_and_visibility` is required when perception, secrecy, ambiguous perception, violence, intimacy, interruption, or who-can-see/hear-whom matters.
- `pov_cannot_perceive_now` is required when a POV-specific perception limit matters. It is not a duplicate of line-of-sight geometry.
- `routes_and_exits` is required when movement, pursuit, escape, entrance, interruption, location change, or containment matters.
- `available_time` is required when a clock, interruption, deadline, pursuit, timed action, or temporal impossibility can matter.
- `consent_or_force_conditions` is required when intimacy, sex, restraint, coercion, object seizure, rescue movement, violence, captivity, or power-limited agency can matter.
- `current_locks` is required when a lock/constraint exists or when the directive could contradict a lock.

Field catalog:

```yaml
current_time: prose or timestamp-like string
current_location: location_id | prose
onstage_entities: list[entity_id]
immediate_situation_summary: prose
offstage_pressuring_entities: list[entity_id]
positions: prose or structured list
possessions: prose or structured list
visible_conditions: prose list
environmental_conditions: prose
entity_statuses: prose or compiled ENTITY STATUS list
line_of_sight_and_visibility: prose
pov_cannot_perceive_now: prose
routes_and_exits: prose list
available_time: prose
consent_or_force_conditions: prose | none
current_locks: prose list
```

Prompt treatment:

- Always included.
- `immediate_situation_summary` is a short, user-authored, prose-neutral description of the immediate local situation; it must not be generated from accepted prose, candidate prose, or automatic summaries.
- Overrides older events, older facts, and stale descriptions, but contradictions must be resolved before compilation.
- Should be compact, explicit, and state-like.

Validation:

- `onstage_entities` ids must resolve to selected ENTITY records.
- `offstage_pressuring_entities` ids must resolve to ENTITY records; unselected resolved ids warn when the lane is optional and block when offstage interruption pressure is required.
- `entity_statuses` record-id arrays must resolve to ENTITY STATUS records; unselected resolved ids warn when optional and block when current agency/status is required.
- `current_location` may be prose. If it resolves to a project record, it must be a selected LOCATION record.
- The same entity must not appear as both onstage and offstage-pressuring.
- A selected ENTITY STATUS for an onstage entity must not place it `offstage`, `concealed`, or at a different record-id current location.

### 3.3 IMMEDIATE HANDOFF

Fields:

```yaml
recent_causal_context: prose
last_visible_moment: prose
begin_after: prose
```

Rules:

- Always included.
- Must not contain verbatim accepted prose, rejected candidate prose, superseded regeneration text, or automatic prose-derived summaries.
- For `first_segment`, all handoff prose fields are optional. The compiler renders a deterministic first-segment empty state when no recent causal context exists.
- For `continuation_after_accepted_segment`, a user-authored handoff is required. The required continuation handoff must include a recent causal bridge and either a last visible moment or a begin-after point.
- Durable changes from accepted prose must be represented in selected records or current state before the next prompt.

### 3.4 MANUAL MOMENT DIRECTIVE

Fields:

```yaml
must_render: prose list
may_render_if_naturally_caused: prose list
do_not_force: prose list
```

Rules:

- `must_render` is required for readiness, prompt preview, compilation, and generation. It may be blank in a saved draft. Blank `must_render` produces a readiness blocker, not a draft-save failure.
- The other two fields are optional but should render explicit empty states.
- The directive wins over character defaults and soft tendencies.
- The directive does not override hard canon, current state, physical possibility, POV/reveal constraints, or provider policy.

### 3.5 CURRENT CAST VOICE PRESSURE

Generation-time field used to compile active cast voice pressure pins. This is not durable identity. It covers speech, POV narration, nonverbal behavior, silence, and turn-taking when those functions matter locally.

Fields:

```yaml
current_cast_voice_pressure:
  - cast_member_id: id
    current_voice_pressure: prose
    dialogue_pressure: prose | none
    pov_narration_pressure: prose | none
    nonverbal_or_silence_pressure: prose | none
    current_must_preserve: prose list
    current_must_avoid: prose list
```

Rules:

- Current cast voice pressure is optional scene-specific salience reinforcement. Durable CAST MEMBER voice and behavior fields are the primary authority.
- Active/full local function is derived from `active_working_set.active_onstage_cast_full`; present-minor delivery is derived from `present_minor_cast_compressed`. Current cast voice pressure does not carry its own role authority.
- Recommended when an active/onstage character is expected to speak materially.
- Recommended when close POV narration depends on a character-specific current voice pressure.
- Recommended when an active/onstage silent character's body, gesture, posture, stillness, or social presence materially drives the local unit.
- It is not normally required when the durable dossier already gives enough voice/body authority.
- Blocks only when supplied current pressure contradicts hard canon, current state, POV/reveal constraints, physical continuity, or provider policy; or when a selected local mode requires voice/body authority and neither durable cast fields nor compressed present-minor guidance can supply it.
- Active/onstage pressure compiles into `{active_cast_voice_pressure_pins}`. Present-minor current pressure compiles into compressed present-minor notes in prose prompts only.

### 3.6 CAST VOICE OVERRIDES

Temporary generation-time voice instructions. They are not persistent character identity.

Fields:

```yaml
cast_voice_overrides:
  - cast_member_id: id
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
- `reason` is author-only metadata. It is saved for the user's process but is not sent to the writer and is not scanned as prompt-facing text.
- Intrinsically current-generation-only; there is no per-item scope field.
- May target active/onstage cast or present-minor cast selected for the current generation.
- For active/onstage cast, `applies_to` and `override_text` compile into the active cast voice pressure pin and into the full dossier under `Current generation voice override`.
- For present-minor cast, `applies_to` and `override_text` compile only into the compressed present-minor note.
- Never persist automatically into the durable CAST MEMBER record.

Validation:

- Warn if the override targets an existing cast member not selected for the current generation.
- Block if the override targets a missing or non-CAST MEMBER record.
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
    - ensemble_dialogue_expected
    - introspection_expected
    - physical_interaction_expected
    - active_silent_presence_expected
    - present_minor_speech_possible
    - ambiguous_perception_expected
    - offstage_interruption_possible
    - nonhuman_or_institutional_pressure_expected
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

- Exactly one `generation_context` value is required in `GenerationSessionReadyInput`. A draft may omit it.
- Normalization defaults `generation_context` from accepted-segment count: no accepted segments means `first_segment`; one or more accepted segments means `continuation_after_accepted_segment`.
- Other tags may be empty only if the manual directive and current state are genuinely minimal.
- Tags are selected by the user or deterministic UI controls, or are deterministically derived from explicit controls/records. They are never derived from LLM interpretation of prose.
- Tags are validation-facing by default and should not compile into the prose prompt.

### 3.8 STOP GUIDANCE

Generation-time field defining optional user narrowing for the local unit and response-point boundary. Blank or missing stop guidance does not block readiness because the universal prompt contains the local-unit stop rule.

Fields:

```yaml
soft_unit_guidance: prose
```

Rules:

- `soft_unit_guidance` is optional.
- If supplied, it must describe the next local unit of causally connected forward motion, such as one approach, one exchange, one discovery, one refusal, one physical maneuver, one interruption, one reveal-withheld, or one practical result.
- If supplied, it must not request a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points.
- Blocks generation only when supplied guidance is structurally non-local or contradictory with the manual directive.
- The stop rule outranks desired length, drama, escalation, or completion.

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
- Selected non-person entities compile into material pressure using `entity_kind` and `short_description`.
- Person entities do not compile into material pressure; active person-like prose authority belongs in CAST MEMBER records.

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

Validation:

- `entity_id` must resolve to an ENTITY record. Dangling or mistyped references block; unselected resolved entity ids warn while optional.
- Record-id `location` values must resolve to LOCATION records. Dangling or mistyped references block; unselected resolved locations warn while optional.
- If the entity is listed as onstage in current authoritative state, `location` must not be `offstage`, `concealed`, or a different record-id current location.

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
  core_voice: prose
  rhythm_and_syntax: prose
  register_and_diction: prose
  vocabulary_and_metaphor_pools: prose
  profanity_and_intensity: prose
  taboo_and_avoidance_patterns: prose
  dialogue_tactics_and_speech_functions: prose
  address_terms_and_naming: prose
  silence_interruption_and_turntaking: prose
  under_pressure_voice: prose
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

Core fields are required for materially involved active/onstage person-like cast. They are not all universal blockers for every background mention. A field may be filled with a concise “none / not distinctive” value only when that absence is itself truthful and useful.

Validation:

- `entity_id` must resolve to an ENTITY record. Dangling or mistyped references block; unselected resolved entity ids warn while optional.

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
  humor_or_irony_style: prose
  idiom_or_sociolect_notes: prose
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
  - text: string  # one short line; target <=40 words; no multi-paragraph samples
    situation: prose
    speech_function: refusal | bargaining | evasion | intimacy | anger | politeness | threat | lie | confession | performance | other
    pressure_tags: prose list
    copy_policy: never_copy_verbatim | may_reuse_cadence_not_text | canonical_phrase
```

Removed field:

- `additional_do_not_write` is removed. Its functions are covered by `must_avoid`, `anti_generic_warnings`, `anti_repetition_warnings`, reveal constraints, and contradiction prohibitions. Keeping it as a separate catch-all creates duplication and inconsistent priority.

### 5.3 Active cast voice pressure pins

Voice pressure pins are compiled, not durable records.

Compiled shape:

```yaml
active_cast_voice_pressure_pin:
  cast_member_id: id
  local_function: from ACTIVE WORKING SET.local_function
  core_voice: from CAST MEMBER.voice_anchor.core_voice
  current_voice_pressure: from CURRENT CAST VOICE PRESSURE or explicit generation-time pressure
  dialogue_pressure: from CURRENT CAST VOICE PRESSURE | none
  pov_narration_pressure: from CURRENT CAST VOICE PRESSURE | none
  nonverbal_or_silence_pressure: from CURRENT CAST VOICE PRESSURE | none
  rhythm_register_and_diction: from CAST MEMBER.voice_anchor rhythm/register fields
  current_must_preserve: merged durable + generation-time entries
  current_must_avoid: merged durable + generation-time entries
  temporary_override: from CAST VOICE OVERRIDES | none
```

Rules:

- Required for active/onstage person-like cast when dialogue or close POV voice matters.
- Required for active silent cast when their visible presence, body, gesture, silence, or social pressure materially matters.
- The compiler may merge fields deterministically; it must not use an LLM to summarize them.
- The pin is a salience duplicate. It does not replace full dossiers.
- `cast_member_id` must resolve to a CAST MEMBER record. Missing or mistyped ids block; existing cast members outside the rendered bands warn as orphaned attachments.

### 5.4 Sample utterance policy

Requirements:

- Optional.
- Default compiled count is zero.
- At most three per active/onstage character may compile.
- Each compiled sample should be one short line, normally no more than about 40 words. Multi-paragraph samples are not allowed.
- Compile only when user-selected or deterministically selected by explicit `speech_function`/`pressure_tags` metadata matching current generation-time pressure.
- Default copy policy is `never_copy_verbatim`.
- `may_reuse_cadence_not_text` permits transfer of rhythm, speech function, register, or tactical pattern; it does not permit close wording reuse.
- `canonical_phrase` must be rare and should still compile with anti-repetition warning.
- Samples must not reveal secrets, future-state material, or knowledge unavailable to the speaking character.

### 5.5 Prompt inclusion levels for cast

```yaml
active_onstage_full:
  include: all populated dossier fields + local_function + compiled voice/body pressure pin + current knowledge constraints + temporary voice override when present
  render_order: identity -> voice_anchor -> voice_extended/speech-pattern fields -> pressure_behavior_core -> body_presence_core -> agency_core -> remaining optional extended fields in schema order -> selected sample_utterances last
present_minor_compressed:
  include: identity, current physical state, immediate behavior, voice warning, allowed actions, temporary override if any
offstage_relevance:
  include: why they matter now, current plan/clock/obligation, possible entrance or communication route if any, what not to reveal
background:
  include: omit or one line only
```

Local-function sub-bands determine minimum completeness and pin requirements. They must not become a back door for silently compressing active/onstage cast. A materially active cast member with a full dossier remains full.

Core-first render order is a salience rule, not a compression rule. It improves long-context use while preserving all populated active/onstage fields.

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
```

Notes:

- `deprecated_fact` is not a normal record kind.
- FACT records are active truth by category invariant. `active` may be projected in registry/UI metadata, but it is not stored in the FACT payload.
- Supersession is a validation diagnostic, not a persistent FACT status.
- If a selected fact contradicts current authoritative state, generation blocks until the user revises, removes, or deselects it.
- Record-id `known_by` entries must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved references warn while optional. `public`, `unknown`, and `not_applicable` remain literals.

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
- Render all prompt-facing belief fields in both groups: claim in full, belief_mode, truth_relation, confidence, access_route, behavioral_effect, and visibility. Lead POV beliefs with truth relation; lead non-POV beliefs with behavioral effect. No field is trimmed.

Validation:

- `holder` must resolve to an ENTITY or CAST MEMBER. Dangling or mistyped references block; unselected resolved holders warn while the lane is optional.

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
forbidden_reveals: prose list | none
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
- `holders` and record-id `non_holders_to_protect` entries must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block. Active hidden/partially revealed/revealed secrets require those references to be selected; unselected required references block.
- `clue_carriers[].discovered_by` is not a prompt-facing reference lane; clue carriers surface clue text, not discovery ids.

### 6.4 POV KNOWLEDGE PROFILE

Compiled generation-time profile derived from PROSE MODE, FACT, BELIEF, SECRET, EVENT, ENTITY STATUS, and user-authored generation-time POV perception limits.

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

Prompt treatment:

- Selected active LOCATION records render description, layout, routes, visibility/sound, hazards or shelters, and social rules in prose prompts.
- Ideation renders selected LOCATION records regardless of status, with status plus the same hazards/social-rules clauses.

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

Validation:

- `owner` and `carried_by` record ids must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved references warn while optional.
- `current_location` record ids must resolve to LOCATION or OBJECT records. Dangling or mistyped references block; unselected resolved references warn while optional.
- `current_location: carried_by_holder` is incoherent when `carried_by: none` and blocks validation.
- `durability` is continuity metadata for author review. It is not currently rendered as literal object prompt text.

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

Validation:

- Record-id `available_to` values must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved references warn while optional. `group` and `any_onstage` remain literals.

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

`sequence_order` is authoring metadata only. It is not sent to the prose prompt and does not control compiled event ordering.

Validation:

- `participants`, record-id `known_by`, and record-id `location` values are checked as internal references. Dangling or mistyped references block; unselected resolved references warn while optional.
- `causes` and `effects` record-id values are checked as broad record links: dangling references block and unselected resolved links warn while optional.

### 8.2 INTENTION

```yaml
id: id
holder: entity_id
intent: prose
urgency: low | medium | high | critical
behavioral_pressure: prose
status: active | satisfied | abandoned | blocked
```

Validation:

- `holder` must resolve to an ENTITY or CAST MEMBER. Dangling or mistyped references block; unselected resolved holders warn while optional.

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
```

Validation:

- `holder` must resolve to an ENTITY or CAST MEMBER. Dangling or mistyped references block. For every selected active PLAN, an unselected resolved holder blocks; otherwise it warns. Hidden-plan behavior focus also makes the holder reference required.
- `fallback_steps` is authoring metadata. When a fallback becomes current, update `current_step`, selected pressure, or current state; the compiler does not offer multiple future options.

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

Prompt treatment:

- Current clock pressure renders through `current_pressure`, `tick_trigger`, `next_threshold`, and `possible_effects`.
- `tick_history` is continuity history for author review. If a historical tick still matters now, represent it as current state, an EVENT, a CONSEQUENCE, or current clock pressure.

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

Validation:

- `owed_by` and record-id `owed_to` entries must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved references warn while optional. `public`, `institution`, `self`, and `unknown` remain literals.

### 8.6 CONSEQUENCE

```yaml
id: id
status: pending | active | resolved | escalated | abandoned
consequence_kind: physical | emotional | social | legal | financial | reputational | relational | logistical | supernatural | institutional | other
holder_or_target: list[entity_id] | public | unknown
cause: record_id | prose
urgency: low | medium | high | critical
current_effect: prose
possible_next_effect: prose
visibility: hidden | holder_specific | public | audience_only
```

Validation:

- Record-id `holder_or_target` values must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved references warn while optional.
- Record-id `cause` values are broad record links: dangling references block and unselected resolved links warn while optional. Prose causes pass through as prose.

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
- `answer_if_known` is authoring-only resolution tracking and is not sent to the prose prompt.

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
- `axis`, `direction_kind`, `value`, `valence`, and `visibility` are classifier/review metadata. They are not literal prompt content.

Validation:

- `from` and `to` must resolve to ENTITY or CAST MEMBER records. Dangling or mistyped references block; unselected resolved endpoints warn while optional.
- `from` and `to` must not be the same id.

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

Validation:

- `holder` must resolve to an ENTITY or CAST MEMBER. Dangling or mistyped references block; unselected resolved holders warn while optional.

Prompt treatment:

- Compile as behavioral pressure and surface expression.
- Non-POV emotion is rendered through behavior/speech unless prose mode permits direct interiority.

### 9.3 Story-record hygiene assistance projection

The story-record hygiene assistance prompt is a project-review surface, not a prose-prompt source and not an active-working-set mutation surface. It adds no stored schema fields.

The projection includes only non-archived records in the user-selected scope of these atomic types when their projected status is hygiene-active: FACT (`active`), EVENT (`active`), BELIEF (`active`), SECRET (`hidden`, `partially_revealed`, `revealed`), EMOTION (`active`, `suppressed`, `transformed`, `dissociated`), RELATIONSHIP (`active`), INTENTION (`active`, `blocked`), PLAN (`active`, `blocked`, `suspended`), CLOCK (`active`, `paused`), OBLIGATION (`open`, `escalated`), CONSEQUENCE (`pending`, `active`, `escalated`), OPEN THREAD (`active`, `escalated`), LOCATION (`active`), OBJECT (`active`), VISIBLE AFFORDANCE (`available`, `blocked`), and every non-archived ENTITY STATUS. Whole-project scope is the default; active-working-set scope reads `active_working_set.selected_records` without adding stored fields and without affecting prose compilation, validation, lifecycle, or working-set membership.

Each included record renders its full payload as escaped canonical JSON plus deterministic display labels, projected status, citation key, and reference summaries. ENTITY and CAST MEMBER payloads are excluded; references to those records may resolve only to stored display labels. Accepted prose, candidates, story notes, story configuration, generation-time brief fields, active-working-set membership as prose authority, timestamps, user-order values, and provider settings are not part of this projection.

Hygiene findings are advisory assistance output. They do not mutate lifecycle, do not satisfy validation, do not add validation diagnostics, and do not change prose compilation or active-working-set membership.

## 10. Compiler contract and minimum prompt completeness

The authoritative placeholder mapping, section order, empty-state rendering rules, validation matrix, and blocker/warning taxonomy live in `compiler-contract.md`.

Schema/template synchronization rules:

- Every prompt placeholder must appear in `compiler-contract.md`.
- Every template section required by `FOUNDATIONS.md` must have a deterministic source and empty-state behavior.
- Every schema field used primarily for prompt compilation must name its prompt destination either here or in the compiler contract.
- Every validation-only field must be explicitly marked not prompt-facing by default.
- Adding, renaming, or deleting a prompt placeholder requires a compiler-contract update in the same change.
- Any change to the record-hygiene in-scope type list, active predicate, ordering, serialization, citation keys, section order, relation taxonomy, action taxonomy, type-aware distinction rules, output format, or parser validation must update `docs/story-record-hygiene-prompt-template.md`, this schema where applicable, `docs/compiler-contract.md`, compiler/template versions, and golden tests in the same change.

Minimum prompt completeness for v1:

1. Role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction must always compile.
2. Current authoritative state has a universal minimum: current time or temporal position, current location or scene-space, onstage/materially relevant entities, and immediate situation summary.
3. Context-gated current-state fields are required only when explicit focus tags, selected records, story configuration, or the manual directive make them structurally necessary.
4. Immediate handoff is required only for `continuation_after_accepted_segment`; first segments compile a deterministic no-prior-prose empty state.
5. Stop guidance is optional because the universal prompt always contains the local-unit stop rule. Supplied stop guidance must be local and noncontradictory.
6. Manual directive `must_render` remains required for readiness, prompt preview, compilation, and generation.
7. Non-omniscient POV requires a populated POV knowledge profile.
8. Active secrets require holders, protected non-holders, allowed cues, forbidden reveals, and reveal permission.
9. Active physical interaction requires current location, onstage entities, positions/distance, object possession, visibility/line of sight, routes/exits, available time, and unavailable/impossible actions where omission would invite error.
10. Active/onstage person-like cast requires a core cast dossier and local function. Current cast voice pressure is optional unless the selected local mode needs voice/body authority and no durable or compressed source exists, or supplied pressure contradicts authority.
11. Generation validation focus tags must resolve first segment vs continuation and activate context-dependent blockers.
12. Optional sections may render explicit empty states or be omitted when the surrounding prompt remains structurally complete; constitutional sections are not omitted.
13. Unresolved contradictions, impossible conditions, missing mandatory readiness fields, secret leakage, and accepted-prose inclusion are blockers.

## 11. Validation blockers and warnings

Blockers prevent prompt generation and OpenRouter sending. Warnings remain app-surface diagnostics and do not compile into the prose prompt.

Blockers include:

- two current locations for one entity;
- two holders for one object;
- active plan held by a dead, unconscious, captive, incapacitated, absent, or otherwise unable entity with no plausible means to act;
- selected POV both lacks and has the same secret according to selected records;
- manual directive requiring impossible movement, perception, timing, object possession, knowledge, or reveal;
- manual directive or stop guidance requesting a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points instead of one local prose segment;
- current authoritative state contradicting immediate handoff;
- relationship record implying actual contact between characters who have not met unless one-sided;
- clock threshold selected as happened while clock remains unticked and no consequence exists;
- offstage interruption without entrance, communication, timing, or causal route;
- content envelope inconsistent with active cast ages/statuses, story configuration, or provider constraints;
- active physical interaction without bodies, positions, objects, routes, visibility, time, and consent/force conditions where relevant;
- active/onstage person-like cast missing required core dossier when materially involved;
- dialogue or close POV expected while active speaker lacks durable voice/body authority, compressed present-minor guidance, and any current voice pressure sufficient for the local function;
- ensemble dialogue expected while likely speakers lack distinct durable voice/body authority or relationship/status context;
- active silent presence expected while body presence, visibility, or allowed-action authority is missing;
- ambiguous perception expected while line of sight, sound, obstruction, or POV uncertainty is unspecified;
- nonhuman/institutional pressure expected while entity operating rules, authority/route, or action mechanism is missing;
- selected validation focus tag missing matrix-required state;
- accepted prose text, rejected candidate text, or automatic prose-derived summary appearing in prompt-facing fields;
- required constitutional prompt section missing or structurally empty.

Warnings include:

- prompt length or lost-in-the-middle risk;
- too many high-salience records for one local unit;
- missing optional sample utterances;
- sparse setting texture;
- no active clock/obligation/open thread when manual directive is otherwise sufficient;
- long active cast dossier where the user may want a stronger voice pin;
- missing current cast voice pressure when durable anchors are sufficient but the local unit may benefit from scene-specific emphasis.

Diagnostic author-surface metadata should be rich enough to explain blockers and warnings without making raw codes primary author copy:

```ts
interface DiagnosticAuthorSurface {
  code: string;
  severity: "blocker" | "warning" | "info";
  group: "required" | "provider" | "recommended" | "salience" | "technical";
  title: string;
  summary: string;
  whyBlocks?: string;
  whatMayDegrade?: string;
  whyNotBlocking?: string;
  whenBecomesBlocking?: string;
  fastestFix: string;
  ignoreGuidance?: string;
  affected: AffectedTarget[];
  technicalDetails?: unknown;
}
```

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
