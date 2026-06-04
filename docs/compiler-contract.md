# Compiler Contract — Continuity Loom

Status: authoritative deterministic prompt-compilation and validation bridge  
Scope: conceptual compiler mapping, prompt section order, empty-state rendering, validation focus matrix, and blocker/warning taxonomy  
Non-scope: code, SQL, API design, migrations, UI mockups, tickets, tests

---

## 1. Purpose

`compiler-contract.md` exists to prevent drift between `FOUNDATIONS.md`, `prompt-template.md`, `prompt-template-rationale.md`, `story-record-schema.md`, and generated examples.

The compiler is a deterministic renderer. Given the same story configuration, selected records, generation-time fields, template version, compiler version, and compiler contract version, it must produce the same prompt.

The compiler must not use an LLM to select, rank, summarize, repair, rewrite, or prioritize records.

## 2. Source hierarchy

The compiler renders from these sources only:

1. Template constants from `prompt-template.md`.
2. Story configuration records: STORY CONTRACT, UNIVERSAL CONTENT POLICY, and story-level prose preferences.
3. Generation-time brief: current authoritative state, immediate handoff, manual directive, prose mode, stop guidance, validation focus tags, current cast voice pressure, and cast voice overrides.
4. User-selected active working set records.
5. User-selected cast inclusion bands: active/onstage full, present-minor compressed, offstage relevance.

The compiler must not use accepted prose, rejected candidates, regenerated candidates, prompt archives, model memory, or inactive records unless the user has represented equivalent information in selected records or generation-time fields.

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

Rationale: state and handoff appear early; current causal pressure appears before long cast dossiers; stop/output instructions remain at the final edge.

## 4. Placeholder mapping

| Prompt section / placeholder | Deterministic source | Required? | Missing behavior | Empty-state rendering | Notes |
|---|---|---:|---|---|---|
| `<role>` | Template constant | Yes | Block if missing | N/A | No story data. |
| `<authority_hierarchy>` | Template constant aligned with FOUNDATIONS | Yes | Block if missing or incompatible | N/A | Manual directive below state/POV/reveal/physical continuity. |
| `{rating_label}` | UNIVERSAL CONTENT POLICY.rating_label | Yes | Block | N/A | Must not render `NO RESTRICTIONS`. |
| content policy body | UNIVERSAL CONTENT POLICY + STORY CONTRACT content fields | Yes | Block if absent or contradictory | Story-configured envelope | Governing provider/platform policy remains first. |
| `{title}` | STORY CONTRACT.title | Yes | Block | N/A | Stable story identity. |
| `{premise}` | STORY CONTRACT.premise | Yes | Block if blank | N/A | Durable premise, not current recap. |
| `{genre_mode}`, `{tone}`, `{content_intensity}`, `{explicitness}`, `{language_register}`, `{setting_baseline}` | STORY CONTRACT fields | Yes for title/premise/tone/content; setting may warn if irrelevant | Block/warn as applicable | `None specified` only for optional subfields | Does not override state/canon. |
| `<prose_mode>` fields | PROSE MODE generation-time or story defaults | Yes | Block if POV/person/tense/interiority unresolved | N/A | Non-omniscient POV requires knowledge profile. |
| `{paragraphing}` | PROSE MODE or STORY CONTRACT default | Yes | Block if unresolved | N/A | Render explicitly. |
| `{hard_canon_bullets}` | Selected FACT records where `fact_kind=hard_canon`, plus selected immutable story locks | Yes if relevant hard canon exists | Warn if none; block if needed for active age/status | `None selected for this generation` | Do not silently include unselected facts except story configuration constants. |
| `<current_authoritative_state>` fields | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + LOCATION + OBJECT | Yes | Block when mandatory for current generation | Optional subfields: `None currently specified` | Current state overrides older material only after contradictions resolved. |
| `{line_of_sight_and_visibility}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS.visibility_to_pov | Required for physical interaction, secrecy, perception, violence, intimacy, interruption | Block if relevant and absent | `None currently specified` only for nonphysical/minimal moments | Also reflected in physical continuity. |
| `{routes_and_exits}` | CURRENT AUTHORITATIVE STATE + LOCATION.access_routes + AFFORDANCE | Required for movement, pursuit, escape, interruption, location change | Block if route matters and absent | `None currently specified` | Include impossible routes if omission invites errors. |
| `{available_time}` | CURRENT AUTHORITATIVE STATE + CLOCK + handoff | Required when timing matters | Block if directive requires action without enough time state | `None currently specified` | “Enough time to speak” can be sufficient. |
| `{consent_or_force_conditions}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + RELATIONSHIP/OBLIGATION/AFFORDANCE | Required for intimacy, restraint, coercion, object seizure, rescue, captivity, violence | Block if relevant and absent | `None currently specified` | Continuity field, not moralizing. |
| `{recent_causal_context}` | IMMEDIATE HANDOFF + selected EVENT immediate/recent | Yes | Block if blank and not self-sufficient first segment | `None; first local unit begins from current state` | Writer-visible, not POV knowledge. No accepted prose. |
| `{last_visible_moment}` | IMMEDIATE HANDOFF.last_visible_moment | Yes | Block if blank | N/A | Launch point. |
| `{prior_accepted_prose_status_or_handoff_note}` | IMMEDIATE HANDOFF user-authored field | Yes | Block if prose text or auto summary detected | `None. No accepted prose is included.` | Replaces accepted prose summary. |
| `{begin_after}` | IMMEDIATE HANDOFF.begin_after | Yes | Block if blank | N/A | Must align with state/handoff. |
| `{manual_must_render}` | MANUAL DIRECTIVE.must_render | Yes | Block if blank | N/A | May be one instruction. |
| `{manual_may_render_if_naturally_caused}` | MANUAL DIRECTIVE.may_render_if_naturally_caused | No | No block | `None specified` | Invention corridor. |
| `{manual_do_not_force}` | MANUAL DIRECTIVE.do_not_force | Recommended | Warn if blank in risky scenes | `None specified` | Guardrail against overreach. |
| `<pov_knowledge_constraints>` | Compiled POV profile from PROSE MODE, FACT, BELIEF, SECRET, EVENT, ENTITY STATUS | Yes when non-omniscient | Block if missing or contradictory | Optional lanes: `None specified`; section never omitted | Labels do not grant knowledge. |
| `<audience_knowledge>` | AUDIENCE KNOWLEDGE PROFILE from SECRET/EVENT/FACT/user notes | Required when audience differs from POV or hidden truth is writer-visible | Block if active secret lacks audience/POV relation | `No audience knowledge distinct from POV specified` | Dramatic irony without leakage. |
| `<secrets_and_reveal_constraints>` | Selected SECRET records | Required when any secret affects current moment | Block if holders/non-holders/reveal permission absent | `No active secrets or reveal locks selected` | `locked` cannot be overridden by directive. |
| `<active_working_set>` pressure lanes | User-authored generation-time pressure summary + deterministic grouping of selected pressure records | Yes | Warn if lanes empty; block if directive lacks enough context | `None beyond detailed records below` | Précis, not LLM summary. |
| `{active_cast_voice_pressure_pins}` | CAST MEMBER.voice_anchor + CURRENT CAST VOICE PRESSURE + CAST VOICE OVERRIDES | Required for active/onstage cast when dialogue or close POV voice matters | Block if required and missing | N/A if no active person-like cast | Salience duplicate. |
| `{active_intentions}` | Selected INTENTION records | No | Warn if directive implies goal but none selected/authored | `None active` | Weaker than plans. |
| `{active_plans}` | Selected PLAN records | No unless directive depends on plan | Block if plan holder cannot act but plan is meant to drive prose | `None active` | Active relevant plans drive tactics. |
| `{active_clocks}` | Selected CLOCK records | No | Block if contradicts current state; warn stale | `None active` | Writer-facing pressure; human updates after acceptance. |
| `{active_obligations}` / `{active_consequences}` | Selected OBLIGATION / CONSEQUENCE records | No | Block if assumes contradicted state | `None active` | Durable-change support. |
| `{active_open_threads}` | Selected OPEN THREAD records | No | Warn if too many high-urgency threads | `None active` | Never commands closure. |
| `{active_onstage_full_cast_dossiers}` | CAST MEMBER selected active/onstage | Required for active person-like cast materially involved | Block if required core missing | N/A if no active person-like cast | Include all populated fields. No silent compression. |
| `Current generation voice override` line | CAST VOICE OVERRIDES targeting active/onstage cast | No | No block unless contradictory | Omit when absent | Temporary, scoped, not durable. |
| sample utterances inside dossiers | CAST MEMBER.sample_utterances selected by user or deterministic metadata | No | No block | Omit or `No selected sample utterances` | At most three; default zero. |
| `{present_minor_cast_notes}` | ENTITY/CAST MEMBER selected present-minor | No | No block; block only if present-minor speech is required and voice note absent | `None` | Compressed notes only. |
| `{offstage_relevance_notes}` | ENTITY/CAST selected offstage + offstage pressure records | Required if offstage interruption/pressure active | Block if interruption lacks route/timing/communication | `None` | No full offstage dossier unless active. |
| `{pov_accessible_facts}` | Selected FACT known to POV/public | No except when directive depends on them | Block if required fact missing | `None beyond current state and hard canon` | Prevents generic fact leakage. |
| `{writer_visible_or_non_pov_facts}` | Selected FACT not POV-accessible; SECRET/EVENT-derived writer-visible truth | No | Block if hidden fact lacks reveal constraints | `None` | Not narrator knowledge. |
| `{pov_relevant_beliefs}` | BELIEF held by POV | No | Warn if POV-heavy scene lacks interpretive pressure | `None specified` | Mark truth relation. |
| `{non_pov_behavior_shaping_beliefs}` | BELIEF held by non-POV cast | No | Block if used as direct interiority in forbidden prose mode | `None specified` | Render through behavior. |
| `{recent_events}`, `{relevant_backstory}`, `{offstage_or_withheld_events}` | Selected EVENT grouped by event_kind/visibility | No except when needed | Warn if too many; block if contradictory | `None selected` | No flat archive dump. |
| `{locations}`, `{objects}`, `{visible_affordances}`, `{unavailable_or_impossible_actions}` | LOCATION, OBJECT, AFFORDANCE, ENTITY STATUS, CURRENT STATE | Yes for active physical interaction | Block if underspecified | Optional lanes: `None specified` | Include unavailable actions when useful. |
| `{physical_continuity}` | CURRENT STATE + ENTITY STATUS + LOCATION/OBJECT/AFFORDANCE | Yes for active physical interaction | Block if missing required physical fields | N/A only for nonphysical abstract prose | Concrete and current. |
| `<invention_permissions>` | Template constant + configured permissions | Yes | Block if absent | N/A | Human gatekeeping. |
| `<contradiction_prohibitions>` | Template constant + selected current locks | Yes | Block if absent | N/A | Cannot be weakened by directive. |
| `<prose_craft>` | Template constant + story/prose preferences + cast voice fields | Yes | Warn if style conflicts with prose mode | N/A | Craft cannot alter continuity. |
| `{soft_unit_guidance}` | STOP GUIDANCE generation-time field | Yes | Block if blank | N/A | Replaces beat count. |
| `<final_output_instruction>` | Template constant | Yes | Block if absent | N/A | Final prompt edge. |
| `validation_focus_tags` | GENERATION VALIDATION FOCUS | Yes, validation-only | Block if generation context absent | Not prompt-facing | Activates matrix rows only. |

## 5. Universal minimum prompt completeness

Generation blocks unless these are satisfied:

1. Role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction exist.
2. Current authoritative state, immediate handoff, manual directive, and stop guidance exist.
3. Non-omniscient POV has a populated POV knowledge profile.
4. Active secrets have holders, protected non-holders, allowed cues, forbidden reveals, and reveal permission.
5. Active physical interaction has current location, onstage entities, positions/distance, object possession, visibility/line of sight, routes/exits, available time, and impossible/unavailable actions where omission would invite error.
6. Active/onstage person-like cast materially involved has a core dossier. Dialogue or close POV requires enough voice anchor/current voice pressure to avoid generic rendering.
7. Generation validation focus tags identify first segment vs continuation.
8. Optional sections render explicit empty states; constitutional sections are not omitted.
9. Accepted prose text, rejected candidate text, or automatic prose-derived summaries never appear in prompt-facing fields.

## 6. Generation validation matrix

| Validation focus tag | Context-dependent blockers |
|---|---|
| `first_segment` | `prior_accepted_prose_status_or_handoff_note` must render no accepted prose included; launch state must be self-sufficient; no continuation phrases such as “as above.” |
| `continuation_after_accepted_segment` | Handoff must be user-authored; accepted prose/rejected candidate/auto summary blocks; deterministically identifiable durable changes in handoff must be represented in selected records or current state. |
| `dialogue_expected` | Active speakers require core CAST MEMBER dossier, voice anchor, current voice pressure or sufficient pin, language/register state, POV knowledge boundaries, and relationship/status context. |
| `introspection_expected` | Requires POV beliefs/suspicions/misreads, relevant emotion/interior pressure, psychic distance/interiority mode, and non-POV interiority restrictions. |
| `physical_interaction_expected` | Requires location, onstage entities, positions/distance, visibility, possessions, routes/exits, available time, and impossible/unavailable actions when omission invites error. |
| `present_minor_speech_possible` | Present-minor speaker needs compressed voice note sufficient for a line or must be promoted to active/onstage; otherwise block material speech. |
| `offstage_interruption_possible` | Requires offstage entity location or uncertainty state, awareness mechanism, communication/entrance/timing route, and interruption type: physical, audible, digital, institutional, or environmental. |
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

Warnings that must not block:

- prompt length or lost-in-the-middle risk;
- too many high-salience records selected;
- no sample utterances selected;
- no active clock where directive is otherwise sufficient;
- sparse setting texture;
- long active dossier that may need stronger voice pins.

## 7. Blocker/warning rendering

Blockers are shown to the user in the app before compilation. They prevent prompt generation and OpenRouter sending.

Warnings are shown to the user but do not compile into the prose prompt. The compiler must not render unresolved warnings as `<compiler_warning>` or similar prompt text.

A validation message should identify the conflicting records or fields, explain the conflict in plain language, and indicate possible user actions: revise, remove, deselect, add current state, add route, add knowledge constraint, add reveal permission, promote cast, or change directive.

## 8. Empty-state rendering rules

- Constitutional sections are never omitted.
- Optional list sections render `None`, `None active`, `None selected`, or `None specified` using the exact phrase defined in the mapping row.
- Empty states must not imply missing canon is safe when a validation tag requires it. Required-but-missing state blocks before rendering.
- Empty states are deterministic constants, not model-authored paraphrases.

## 9. Prompt-facing vs validation-only fields

Validation-only by default:

- `validation_focus_tags`
- validation diagnostics
- blocker/warning severity
- record IDs unless deliberately exposed for debugging outside the generated prompt
- source provenance metadata
- prompt/template/compiler version metadata unless the user chooses a debug prompt view

Prompt-facing when selected or compiled:

- user-authored current state, handoff, directive, pressure text, record prose fields, cast dossiers, voice anchors, current voice pressure pins, secrets/reveal lanes, affordances, and stop guidance.

## 10. Change-control rule

Any change to a prompt placeholder, template section, schema field used for compilation, requiredness rule, empty-state rendering rule, validation focus tag, or blocker/warning row must update this compiler contract in the same document revision.
