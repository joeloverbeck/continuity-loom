# Compiler Contract — Continuity Loom

Status: authoritative deterministic prompt-compilation and validation bridge  
Scope: conceptual compiler mapping, prompt section order, empty-state rendering, validation focus matrix, and blocker/warning taxonomy  
Non-scope: code, SQL, API design, migrations, UI mockups, tickets, tests

---

## 1. Purpose

`compiler-contract.md` exists to prevent drift between `FOUNDATIONS.md`, `prompt-template.md`, `prompt-template-rationale.md`, `story-record-schema.md`, stress examples, and generated prompt surfaces.

The compiler is a deterministic renderer. Given the same story configuration, selected records, generation-time fields, template version, compiler version, and compiler contract version, it must produce the same prompt.

The compiler must not use an LLM to select, rank, summarize, repair, rewrite, compress, or prioritize records.

This contract is not an appendix. It is the authoritative bridge between conceptual records and the generated prose prompt.

## 2. Source hierarchy

The compiler renders from these sources only:

1. Template constants from `prompt-template.md`.
2. Story configuration records: STORY CONTRACT, UNIVERSAL CONTENT POLICY, story-level prose preferences, and story-level defaults.
3. Generation-time brief: current authoritative state, immediate handoff, manual directive, prose mode, stop guidance, validation focus tags, current cast voice pressure, and cast voice overrides.
4. User-selected active working set records.
5. User-selected cast inclusion bands: active/onstage full, present-minor compressed, offstage relevance.
6. Deterministic empty-state constants defined in this contract.

The compiler must not use accepted prose, rejected candidates, regenerated candidates, prompt archives, model memory, inactive records, or automatic prose-derived summaries unless the user has represented equivalent information in selected records or generation-time fields.

Generation-time fields may override story defaults for the current request, but they do not override hard canon, current authoritative state, physical continuity, POV/reveal locks, or governing provider/platform policy.

## 3. Prompt section order

The compiler renders sections in this order:

1. `<role>`
2. `<authority_hierarchy>`
3. `<content_policy>`
4. `<story_contract>`
5. `<prose_mode>`
6. `<hard_canon>`
7. `<current_authoritative_state>`
8. `<immediate_handoff>`
9. `<manual_directive>`
10. `<pov_knowledge_constraints>`
11. `<audience_knowledge>`
12. `<secrets_and_reveal_constraints>`
13. `<active_working_set>`
14. `<active_plans_and_intentions>`
15. `<active_clocks>`
16. `<active_obligations_and_consequences>`
17. `<active_open_threads>`
18. `<active_cast_full_dossiers>`
19. `<present_minor_cast>`
20. `<offstage_relevance>`
21. `<relevant_facts_beliefs_events>`
22. `<locations_objects_affordances>`
23. `<physical_continuity>`
24. `<invention_permissions>`
25. `<contradiction_prohibitions>`
26. `<prose_craft>`
27. `<stop_rule>`
28. `<final_output_instruction>`

Rationale: hard state and launch state appear early; compact active pressure and voice pins appear before long cast dossiers; final stop/output instructions remain at the final edge.

## 4. Exhaustive placeholder mapping

Every placeholder in `prompt-template.md` must appear in this mapping. Grouped rows are allowed only when each placeholder is named explicitly and all named placeholders share the same source, requiredness, missing behavior, and empty-state behavior.

| Prompt section / placeholder(s) | Deterministic source | Required? | Missing behavior | Empty-state rendering | Notes |
|---|---|---:|---|---|---|
| `<role>` | Template constant | Yes | Block if missing or edited to permit non-prose output | N/A | Must not invite planning, validation, record updates, or commentary. |
| `<authority_hierarchy>` | Template constant aligned with `FOUNDATIONS.md` | Yes | Block if missing or incompatible | N/A | Manual directive remains below state/POV/reveal/physical continuity. |
| `{rating_label}` | UNIVERSAL CONTENT POLICY.rating_label | Yes | Block | N/A | Must not render `NO RESTRICTIONS`. |
| `{allowed_content_scope}` | UNIVERSAL CONTENT POLICY.allowed_content_scope | Yes | Block if blank or incompatible with story/active cast constraints | N/A | Story maturity envelope, not provider-policy override. |
| `{tonal_handling}` | UNIVERSAL CONTENT POLICY.tonal_handling | Yes | Block if blank | N/A | Describes how mature material should be handled in prose. |
| `{governing_policy_note}` | UNIVERSAL CONTENT POLICY.governing_policy_note | Yes | Block if blank or attempts to override provider/platform policy | N/A | Must preserve governing policy as first authority. |
| `{character_bias_handling}` | UNIVERSAL CONTENT POLICY.character_bias_handling | Yes | Block if blank in stories involving prejudice/bias; otherwise warn | N/A | Keeps character-held perception separate from narrator-certified fact. |
| `{title}` | STORY CONTRACT.title | Yes | Block | N/A | Stable story identity. |
| `{premise}` | STORY CONTRACT.premise | Yes | Block if blank | N/A | Durable premise, not current recap. |
| `{genre_mode}`, `{tone}`, `{content_intensity}`, `{explicitness}`, `{language_register}`, `{setting_baseline}` | STORY CONTRACT fields | Yes for genre/tone/content/language; setting may warn if truly irrelevant | Block or warn as applicable | `None specified` only for optional subfields | Does not override current state/canon. |
| `{pov_character}`, `{person}`, `{tense}`, `{psychic_distance}`, `{interiority_mode}`, `{dialogue_density}`, `{paragraphing}`, `{language_output}`, `{special_style_constraints}` | PROSE MODE generation-time field or story default | Yes | Block if unresolved or internally contradictory | `None specified` only for optional special constraints | Non-omniscient POV requires knowledge profile. |
| `{hard_canon_bullets}` | Selected FACT records with `fact_kind=hard_canon` plus selected immutable story locks | Yes if relevant hard canon exists | Warn if none; block if needed for active age/status/identity/provider boundary | `None selected for this generation` | Do not silently include unselected facts except story configuration constants. |
| `{current_time}` | CURRENT AUTHORITATIVE STATE.current_time | Yes | Block if blank | N/A | Approximate prose time is acceptable. |
| `{current_location}` | CURRENT AUTHORITATIVE STATE.current_location + selected LOCATION label if present | Yes | Block if blank | N/A | Must not contradict ENTITY STATUS/LOCATION records. |
| `{onstage_entities}` | CURRENT AUTHORITATIVE STATE.onstage_entities + ENTITY/CAST selected active or present-minor | Yes when any entity is materially involved | Block if directive requires an entity but none selected/onstage | `None onstage` only for abstract/nonphysical prose | Person-like material entities require cast handling. |
| `{offstage_pressuring_entities}` | CURRENT AUTHORITATIVE STATE.offstage_pressuring_entities + offstage selected records | No unless offstage pressure/interruption active | Block if offstage interruption lacks source | `None specified` | Offstage relevance section may expand. |
| `{positions}` | CURRENT AUTHORITATIVE STATE.positions + ENTITY STATUS + LOCATION/OBJECT state | Required for physical interaction, gaze, object transfer, intimacy, violence, movement | Block if relevant and absent | `None currently specified` only for nonphysical/minimal moments | Distance counts as position state. |
| `{entity_statuses}` | CURRENT AUTHORITATIVE STATE.entity_statuses + ENTITY STATUS records | Yes for material entities | Block if absent or contradictory | `None currently specified` only when no material entities | Life/agency/location/visibility contradictions block. |
| `{possessions}` | CURRENT AUTHORITATIVE STATE.possessions + OBJECT.owner/carried_by/current_location | Required when objects can matter | Block if object use/transfer possible and absent | `None currently specified` | Two holders for one object block. |
| `{visible_conditions}` | CURRENT AUTHORITATIVE STATE.visible_conditions + ENTITY STATUS/CONSEQUENCE where visible | No unless injury/status/condition matters | Warn if expected but absent | `None currently specified` | Includes visible injury, exhaustion, restraint, disguise. |
| `{environmental_conditions}` | CURRENT AUTHORITATIVE STATE.environmental_conditions + LOCATION | No unless environment affects action/perception/tone | Warn if sparse | `None currently specified` | Texture and physical constraint. |
| `{line_of_sight_and_visibility}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS.visibility_to_pov + LOCATION.visibility_and_sound | Required for physical interaction, perception, secrets, violence, intimacy, interruption, ambiguous perception | Block if relevant and absent | `None currently specified` only for nonphysical/minimal moments | Also reflected in physical continuity. |
| `{routes_and_exits}` | CURRENT AUTHORITATIVE STATE + LOCATION.access_routes + AFFORDANCE | Required for movement, pursuit, escape, interruption, location change | Block if route matters and absent | `None currently specified` | Include impossible routes when omission invites errors. |
| `{available_time}` | CURRENT AUTHORITATIVE STATE + CLOCK + handoff | Required when timing matters | Block if directive requires action without enough time state | `None currently specified` | “Enough time to speak” can be sufficient. |
| `{consent_or_force_conditions}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + RELATIONSHIP/OBLIGATION/AFFORDANCE | Required for intimacy, restraint, coercion, object seizure, rescue movement, captivity, violence | Block if relevant and absent | `None currently specified` | Continuity field, not moralizing. |
| `{current_locks}` | CURRENT AUTHORITATIVE STATE.current_locks + hard current locks from selected records | Yes when locks exist; otherwise optional | Block if directive contradicts a lock | `None currently specified` | Keeps current impossibilities visible. |
| `{recent_causal_context}` | IMMEDIATE HANDOFF.recent_causal_context + selected EVENT immediate/recent | Yes unless first segment is fully self-sufficient from current state | Block if blank and not self-sufficient | `None; first local unit begins from current state` | Writer-visible; not automatically POV knowledge. No accepted prose. |
| `{last_visible_moment}` | IMMEDIATE HANDOFF.last_visible_moment | Yes | Block if blank | N/A | Launch point. |
| `{prior_accepted_prose_status_or_handoff_note}` | IMMEDIATE HANDOFF user-authored field | Yes | Block if accepted prose text, rejected candidate text, superseded regeneration text, or automatic prose-derived summary detected | `None. No accepted prose is included.` | Replaces accepted prose summary. |
| `{begin_after}` | IMMEDIATE HANDOFF.begin_after | Yes | Block if blank or contradicts state/handoff | N/A | Exact start instruction. |
| `{manual_must_render}` | MANUAL DIRECTIVE.must_render | Yes | Block if blank | N/A | May be one instruction. |
| `{manual_may_render_if_naturally_caused}` | MANUAL DIRECTIVE.may_render_if_naturally_caused | No | No block | `None specified` | Invention corridor. |
| `{manual_do_not_force}` | MANUAL DIRECTIVE.do_not_force | Recommended | Warn if blank in risky scenes | `None specified` | Guardrail against overreach. |
| `{pov_knows}` | POV KNOWLEDGE PROFILE.pov_knows from PROSE MODE/FACT/BELIEF/SECRET/EVENT/ENTITY STATUS | Required for non-omniscient POV | Block if absent or contradictory | `None specified` only for omniscient or no relevant knowledge | Labels do not grant knowledge. |
| `{pov_believes_suspects_misreads}` | POV KNOWLEDGE PROFILE.pov_believes_suspects_misreads | Required for close introspection; otherwise optional | Block if introspection expected and absent | `None specified` | Must distinguish from fact. |
| `{pov_does_not_know}` | POV KNOWLEDGE PROFILE.pov_does_not_know + SECRET non-holder lanes | Required when hidden truth exists or POV limit matters | Block if active secret lacks POV non-knowledge relation | `None specified` | Prevents leakage. |
| `{pov_cannot_perceive_now}` | POV KNOWLEDGE PROFILE.pov_cannot_perceive_now + visibility/line-of-sight state | Required when perception limits matter | Block if ambiguous perception or hidden plan depends on it and absent | `None specified` | Prevents impossible perception. |
| `{audience_knows}` | AUDIENCE KNOWLEDGE PROFILE.audience_knows | Required when audience differs from POV or hidden truth is writer/audience-visible | Block if active secret lacks audience relation | `No audience knowledge distinct from POV specified` | Dramatic irony without leakage. |
| `{audience_does_not_know}` | AUDIENCE KNOWLEDGE PROFILE.audience_does_not_know | No unless audience ignorance matters | No block | `None specified` | Avoids overrevealing. |
| `{dramatic_irony_permissions}` | AUDIENCE KNOWLEDGE PROFILE.dramatic_irony_permissions | Required when audience knows more than POV | Block if absent in heavy irony scene | `None specified` | Does not grant POV knowledge. |
| `{writer_visible_hidden_truths}` | Selected SECRET.secret_claim and writer-visible hidden facts | Required when any active secret matters | Block if absent but secret tag set | `No active secrets or reveal locks selected` | Writer-facing only. |
| `{secret_holders}` | SECRET.holders | Required for active secret | Block if blank | `No active secrets or reveal locks selected` | Holder list may be all/unknown only if explicit. |
| `{secret_non_holders_to_protect}` | SECRET.non_holders_to_protect | Required for active secret | Block if blank | `No active secrets or reveal locks selected` | Defines protected ignorance. |
| `{allowed_clues_and_surface_cues}` | SECRET.allowed_surface_cues + clue_carriers available now | Required for clue pressure; optional otherwise | Block if clue pressure tag set and absent | `None specified` | Surface cues without reveal. |
| `{forbidden_reveals}` | SECRET.forbidden_reveals | Required for active secret | Block if blank | `None specified` only when no active secret | Prevents narrator leakage. |
| `{reveal_permissions}` | SECRET.reveal_permission + reveal_triggers | Required for active secret | Block if blank or contradictory | `No active secrets or reveal locks selected` | `locked` cannot be overridden by directive. |
| `{active_action_pressure}` | User-authored pressure summary + selected INTENTION/PLAN/AFFORDANCE/CONSEQUENCE/OPEN THREAD grouped deterministically | Yes | Warn if empty; block if directive lacks enough context | `None beyond detailed records below` | Not an LLM summary. |
| `{active_knowledge_pressure}` | User-authored pressure summary + POV/SECRET/BELIEF/EVENT lanes | Yes when knowledge/secrecy matters | Warn/block as applicable | `None beyond detailed records below` | Keeps information pressure salient. |
| `{relationship_emotion_pressure}` | Selected RELATIONSHIP/EMOTION records rendered as pressure text | No unless local pressure depends on it | Warn if expected but absent | `None beyond detailed records below` | Avoid raw axes alone. |
| `{material_pressure}` | Selected LOCATION/OBJECT/AFFORDANCE/ENTITY STATUS pressure summary | Required for physical/object-heavy moments | Block if physical tag set and absent | `None beyond detailed records below` | Current physical affordances. |
| `{voice_pressure}` | User-authored generation-time voice pressure summary | Required when dialogue, close POV, ensemble, or active silent presence matters | Block if required and absent | `None beyond detailed records below` | Complements pins. |
| `{active_cast_voice_pressure_pins}` | CAST MEMBER.voice_anchor + CURRENT CAST VOICE PRESSURE + CAST VOICE OVERRIDES + active local_function | Required for active/onstage cast when dialogue, close POV voice, ensemble speech, or active silent presence matters | Block if required and missing/too generic | N/A if no active person-like cast | Salience duplicate; includes dialogue/narration/nonverbal/silence scopes. |
| `{active_intentions}` | Selected INTENTION records | No | Warn if directive implies goal but none selected/authored | `None active` | Weaker than plans. |
| `{active_plans}` | Selected PLAN records | No unless directive depends on plan | Block if plan holder cannot act but plan is meant to drive prose | `None active` | Active relevant plans drive tactics. |
| `{active_clocks}` | Selected CLOCK records | No | Block if contradicts current state; warn stale | `None active` | Human updates after acceptance. |
| `{active_obligations}` | Selected OBLIGATION records | No | Block if assumes contradicted state | `None active` | Durable-change support. |
| `{active_consequences}` | Selected CONSEQUENCE records | No | Block if assumes contradicted state | `None active` | Durable-change support. |
| `{active_open_threads}` | Selected OPEN THREAD records | No | Warn if too many high-urgency threads | `None active` | Never commands closure. |
| `{active_onstage_full_cast_dossiers}` | CAST MEMBER selected active/onstage full, including all populated fields | Required for active person-like cast materially involved | Block if required core missing | N/A if no active person-like cast | Include all populated fields. Render structured fields core-first: identity, voice_anchor plus voice_extended/speech-pattern fields, pressure_behavior_core, body_presence_core, agency_core, remaining optional extended fields, selected samples last. No silent compression. |
| `Current generation voice override` line | CAST VOICE OVERRIDES targeting active/onstage cast | No | No block unless contradictory | Omit when absent | Temporary, scoped, not durable. For present-minor targets, render inside `{present_minor_cast_notes}` only. |
| sample utterances inside dossiers | CAST MEMBER.sample_utterances selected by user or deterministic metadata | No | No block | Omit; optional explicit `No selected sample utterances` allowed in examples | At most three; default zero; one short line each, normally <=40 words; `may_reuse_cadence_not_text`, not `may_echo_lightly`. |
| `{present_minor_cast_notes}` | ENTITY/CAST MEMBER selected present-minor + current status + compressed voice note + temporary voice override when present | No | No block; block only if present-minor speech is required and voice note absent | `None` | Compressed notes only. Temporary overrides remain current-generation only. |
| `{offstage_relevance_notes}` | ENTITY/CAST selected offstage + offstage pressure records | Required if offstage interruption/pressure active | Block if interruption lacks route/timing/communication | `None` | No full offstage dossier unless active. |
| `{pov_accessible_facts}` | Selected FACT known to POV/public | No except when directive depends on them | Block if required fact missing | `None beyond current state and hard canon` | Prevents generic fact leakage. |
| `{writer_visible_or_non_pov_facts}` | Selected FACT not POV-accessible; SECRET/EVENT-derived writer-visible truth | No | Block if hidden fact lacks reveal constraints | `None` | Not narrator knowledge. |
| `{pov_relevant_beliefs}` | BELIEF held by POV | No | Warn if POV-heavy scene lacks interpretive pressure | `None specified` | Mark truth relation. |
| `{non_pov_behavior_shaping_beliefs}` | BELIEF held by non-POV cast | No | Block if used as direct interiority in forbidden prose mode | `None specified` | Render through behavior. |
| `{recent_events}` | Selected EVENT with event_kind immediate_previous/recent_causal | No except when needed | Warn if too many; block if contradictory | `None selected` | No flat archive dump. |
| `{relevant_backstory}` | Selected EVENT relevant_backstory and selected backstory facts with current relevance | No | Warn if too many/stale | `None selected` | Only current-relevant backstory. |
| `{offstage_or_withheld_events}` | Selected EVENT offstage/withheld grouped by visibility | No except when offstage/withheld pressure matters | Block if withheld event leaks into POV | `None selected` | Writer-visible does not mean POV-visible. |
| `{locations}` | Selected LOCATION + current location | Required for physical/location-focused generation | Block if underspecified | `None specified` only for nonphysical abstract prose | Current first. |
| `{objects}` | Selected OBJECT + current possessions | Required for object use/transfer or salient object presence | Block if underspecified | `None specified` | Owner/carried_by/current_location/visibility must align. |
| `{visible_affordances}` | Selected VISIBLE AFFORDANCE records + current state | Required for physical interaction/action choices | Block if directive requires action without affordance | `None specified` | Possible actions. |
| `{unavailable_or_impossible_actions}` | CURRENT STATE locks + AFFORDANCE unavailable/blocked + validation-derived impossibilities | Required when omission would invite errors | Block if physical scene risky and absent | `None specified` | Must not be invented by an LLM. |
| `{physical_continuity}` | CURRENT STATE + ENTITY STATUS + LOCATION/OBJECT/AFFORDANCE | Yes for active physical interaction | Block if missing required physical fields | N/A only for nonphysical abstract prose | Concrete and current. |
| `<invention_permissions>` | Template constant + configured durable-change permissions | Yes | Block if absent | N/A | Human gatekeeping. |
| `<contradiction_prohibitions>` | Template constant + selected current locks | Yes | Block if absent | N/A | Cannot be weakened by directive. |
| `<prose_craft>` | Template constant + story/prose preferences + cast voice fields | Yes | Warn if style conflicts with prose mode | N/A | Craft cannot alter continuity. |
| `{soft_unit_guidance}` | STOP GUIDANCE.soft_unit_guidance generation-time field | Yes | Block if blank, non-local, or contradictory with manual directive | N/A | Replaces beat count; must describe the next local unit, not a chapter/arc/future summary. |
| `<final_output_instruction>` | Template constant | Yes | Block if absent | N/A | Final prompt edge. |
| `validation_focus_tags` | GENERATION VALIDATION FOCUS | Yes, validation-only | Block if generation context absent | Not prompt-facing | Activates matrix rows only. |

## 5. Universal minimum prompt completeness

Generation blocks unless these are satisfied:

1. Role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction exist.
2. Story title, premise, tone/content envelope, language/register, and prose mode are populated enough to avoid a generic story prompt.
3. Current authoritative state, immediate handoff, manual directive, and stop guidance exist, and the manual directive/stop guidance remain local-prose-only.
4. Non-omniscient POV has a populated POV knowledge profile.
5. Active secrets have holders, protected non-holders, allowed cues when clues may appear, forbidden reveals, and reveal permission.
6. Active physical interaction has current location, onstage entities, positions/distance, object possession when objects matter, visibility/line of sight, routes/exits, available time, and impossible/unavailable actions where omission would invite error.
7. Active/onstage person-like cast materially involved has a core dossier and local function. Dialogue, close POV voice, ensemble speech, or active silent presence requires enough voice/body pressure to avoid generic rendering.
8. Generation validation focus tags identify first segment vs continuation and activate all context-dependent blockers relevant to the directive/current state.
9. Optional sections render explicit empty states; constitutional sections are not omitted.
10. Accepted prose text, rejected candidate text, superseded regeneration text, automatic prose-derived summaries, and prose-mined continuity never appear in prompt-facing fields.

## 6. Generation validation matrix

| Validation focus tag | Context-dependent blockers |
|---|---|
| `first_segment` | `prior_accepted_prose_status_or_handoff_note` must render no accepted prose included; launch state must be self-sufficient; no continuation phrases such as “as above.” |
| `continuation_after_accepted_segment` | Handoff must be user-authored; accepted prose/rejected candidate/auto summary blocks; deterministically identifiable durable changes in handoff must be represented in selected records or current state. |
| `dialogue_expected` | Active speakers require core CAST MEMBER dossier, voice anchor, current voice pressure or sufficient pin, language/register state, POV knowledge boundaries, and relationship/status context. |
| `ensemble_dialogue_expected` | Three or more likely speakers require distinct voice pins, current speaker functions, relationship/status pressure among speakers, and physical/auditory state showing who can hear or interrupt whom. |
| `introspection_expected` | Requires POV beliefs/suspicions/misreads, relevant emotion/interior pressure, psychic distance/interiority mode, and non-POV interiority restrictions. |
| `physical_interaction_expected` | Requires location, onstage entities, positions/distance, visibility, possessions where relevant, routes/exits, available time, and impossible/unavailable actions when omission invites error. |
| `active_silent_presence_expected` | Active silent character needs core dossier, body_presence_core, current position/visibility, nonverbal_or_silence_pressure, allowed actions, and POV access limits. |
| `present_minor_speech_possible` | Present-minor speaker needs compressed voice note sufficient for a line or must be promoted to active/onstage; otherwise block material speech. |
| `ambiguous_perception_expected` | Requires line-of-sight/sound state, obstruction or uncertainty source, what the POV can and cannot perceive, possible misreads, and whether audience/writer knows more. |
| `offstage_interruption_possible` | Requires offstage entity location or uncertainty state, awareness mechanism, communication/entrance/timing route, and interruption type: physical, audible, digital, institutional, or environmental. |
| `nonhuman_or_institutional_pressure_expected` | Requires ENTITY kind/description, operating rules or authority relation, current location/reach, mechanism for pressure, and limits on interiority/agency if non-person. |
| `secret_or_clue_pressure` | Requires secret claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, reveal permission, and reveal triggers if any. |
| `non_pov_hidden_plan_behavior` | Requires plan holder status/location/means, current step, visibility_to_pov, behavioral surface cues, and close-POV non-interiority restrictions. |
| `object_use_possible` | Requires object owner/carried_by/current_location/visibility, usable affordance, constraints, user/accessibility, and consequence of use if durable. |
| `object_transfer_possible` | Requires object owner/carried_by/current_location/visibility, transfer affordance, body positions, consent/force if relevant, and resulting holder state. |
| `location_change_possible` | Requires source location, destination or reachable route, exits, available time, movement constraints, transport if relevant, and arrival consequences if relevant. |
| `restraint_or_coercion_possible` | Requires agency/status, consent/force conditions, body positions, exits, power relationship, available time, and physical/social constraints. |
| `intimacy_or_sex_possible` | Requires active cast ages/statuses, content envelope consistency, consent/force conditions, body positions, privacy/publicness, relationship/emotion pressure, and physical affordances. |
| `violence_or_injury_possible` | Requires agency/status, positions, weapons/body affordances, force conditions, injury consequences, visibility, time, and location constraints. |
| `institutional_involvement_possible` | Requires institution/entity record or explicit current-state route, communication/access mechanism, jurisdiction or authority relation if relevant, and current opportunity for contact. |
| `clock_tick_possible` | Requires active clock, current pressure, tick trigger, next threshold, possible effects, and concrete event that could visibly cause tick. |
| `obligation_breach_possible` | Requires obligation terms, owed_by, owed_to, visibility, consequence_if_broken, and current opportunity/pressure to breach or fulfill. |

Universal blockers not tied to a single validation focus tag:

- manual directive or stop guidance requesting a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points instead of one local prose segment;
- manual directive and stop guidance contradicting each other about the local unit or stop boundary;
- template, schema, or compiler-contract version mismatch that leaves a prompt placeholder without a deterministic source.

Warnings that must not block:

- prompt length or lost-in-the-middle risk;
- too many high-salience records selected;
- no sample utterances selected;
- no active clock where directive is otherwise sufficient;
- sparse setting texture;
- low-drama scene may need stronger prose-craft pressure;
- long active dossier may need stronger current voice/body pressure pin;
- active/onstage extended dossier is sparse but required core is sufficient.

## 7. Blocker/warning rendering

Blockers are shown to the user before compilation. They prevent prompt generation and OpenRouter sending.

Warnings are shown to the user but do not compile into the prose prompt. The compiler must not render unresolved warnings as `<compiler_warning>` or similar prompt text.

A validation message should identify the conflicting records or fields, explain the conflict in plain language, and indicate possible user actions: revise, remove, deselect, add current state, add route, add knowledge constraint, add reveal permission, promote cast, add voice/body pressure, or change directive.

## 8. Empty-state rendering rules

- Constitutional sections are never omitted.
- Optional list sections render `None`, `None active`, `None selected`, or `None specified` using the exact phrase defined in the mapping row.
- Empty states must not imply missing canon is safe when a validation tag requires it. Required-but-missing state blocks before rendering.
- Empty states are deterministic constants, not model-authored paraphrases.
- Empty-state rendering must not be used to hide a structurally unusable prompt.

## 9. Prompt-facing vs validation-only fields

Validation-only by default:

- `validation_focus_tags`;
- validation diagnostics;
- blocker/warning severity;
- record IDs unless deliberately exposed for debugging outside the generated prompt;
- source provenance metadata;
- prompt/template/compiler version metadata unless the user chooses a debug prompt view.

Prompt-facing when selected or compiled:

- user-authored current state, handoff, directive, pressure text, record prose fields, cast dossiers, voice anchors, current voice pressure pins, secrets/reveal lanes, affordances, stop guidance, and temporary cast voice overrides.

Prompt-facing only as deterministic labels when useful for rendering/validation clarity:

- active cast local function labels such as active speaker, active silent, POV narrator, or present-minor speaker.

## 10. Change-control rule

Any change to a prompt placeholder, template section, schema field used for compilation, requiredness rule, empty-state rendering rule, validation focus tag, blocker/warning row, Red Bunny generated prompt surface, or stress-suite assumption must update this compiler contract in the same document revision.
