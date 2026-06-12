# Compiler Contract — Continuity Loom

Status: active reference — deterministic prompt/compiler mapping, prompt section order, empty-state rendering, validation focus matrix, and blocker/warning taxonomy
Authority: domain authority for prompt compiler and validation bridge (see docs/ACTIVE-DOCS.md)
Contract version: `1.4.0`; any change that bumps `contract.version` or `compiler.version` in `packages/core/src/version.ts` must update this pin in the same revision.

---

## 1. Purpose

`compiler-contract.md` exists to prevent drift between `FOUNDATIONS.md`, `prompt-template.md`, `prompt-template-rationale.md`, `story-record-schema.md`, stress examples, and generated prompt surfaces.

Non-scope: code, SQL, API design, migrations, UI mockups, tickets, tests.

The compiler is a deterministic renderer. Given the same story configuration, selected records, generation-time fields, template version, compiler version, and compiler contract version, it must produce the same prompt.

The compiler must not use an LLM to select, rank, summarize, repair, rewrite, compress, or prioritize records.

This contract is not an appendix. It is the authoritative bridge between conceptual records and the generated prose prompt.

## 2. Source hierarchy

The compiler renders from these sources only:

1. Template constants from `prompt-template.md`.
2. Story configuration records: STORY CONTRACT, UNIVERSAL CONTENT POLICY, story-level prose preferences, and story-level defaults.
3. `GenerationSessionReadyInput`, produced by deterministic normalization from saved draft state, story configuration, active working set, accepted-segment count, selected records, provider configuration where relevant, and deterministic empty-state/default rules.
4. Generation-time brief fields inside that ready input: current authoritative state, immediate handoff, manual directive, prose mode, stop guidance, validation focus tags, current cast voice pressure, and cast voice overrides.
5. User-selected active working set records.
6. User-selected cast inclusion bands: active/onstage full, present-minor compressed, offstage relevance.
7. Deterministic empty-state constants defined in this contract.

The compiler consumes `GenerationSessionReadyInput`, not UI-only defaults. Normalization may default non-story values such as generation context from accepted-segment count, but it must not invent story facts, handoff prose, routes, positions, current situation, voice pressure, or manual directive content.

The compiler must not use accepted prose, rejected candidates, regenerated candidates, prompt archives, model memory, inactive records, or automatic prose-derived summaries unless the user has represented equivalent information in selected records or generation-time fields.

Generation-time fields may override story defaults for the current request, but they do not override hard canon, current authoritative state, physical continuity, POV/reveal locks, or governing provider/platform policy.

## 3. Prompt Section Orders

### 3.1 Prose Prompt Section Order

The compiler renders sections in this order:

1. `<role>`
2. `<authority_hierarchy>`
3. `<content_policy>`
4. `<story_contract>`
5. `<prose_mode>`
6. `<hard_canon>` when at least one hard-canon FACT is selected
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
19. `<present_minor_cast>` when at least one present-minor cast record is selected
20. `<offstage_relevance>` when at least one offstage cast record is selected or offstage pressure/interruption is active
21. `<relevant_facts_beliefs_events>`
22. `<locations_objects_affordances>`
23. `<physical_continuity>`
24. `<invention_permissions>`
25. `<contradiction_prohibitions>`
26. `<prose_craft>`
27. `<stop_rule>`
28. `<final_output_instruction>`

Rationale: hard state and launch state appear early; compact active pressure and voice pins appear before long cast dossiers; final stop/output instructions remain at the final edge.

Active working-set lines are pressure summaries, not archive copies. A record may appear both in a pressure summary and in a later detail section only when the pressure rendering performs a different prompt function: current causal force, behavior/interiority pressure, physical constraint, reveal safety, or voice salience.

### 3.2 Ideation Prompt Section Order

The ideation prompt is the sanctioned §9.1 assistance prompt class. It reuses the same deterministic source hierarchy and shared renderers as the prose prompt where the sections describe authority, current state, knowledge, and selected records. It replaces prose-only launch/output sections with ideation-specific sections, renders an ideation-specific continuity-only contradiction-prohibitions body inside the shared `<contradiction_prohibitions>` tag, and uses ideation-only render variants where the assistance task needs less duplicated context.

The compiler renders ideation sections in this order:

1. `<ideation_role>`
2. `<authority_hierarchy>`
3. `<content_policy>`
4. `<story_contract>`
5. `<hard_canon>` when at least one hard-canon FACT is selected
6. `<current_authoritative_state>`
7. `<immediate_handoff>`
8. `<manual_directive>` when at least one manual directive field is supplied
9. `<pov_knowledge_constraints>`
10. `<audience_knowledge>`
11. `<secrets_and_reveal_constraints>`
12. `<active_plans_and_intentions>`
13. `<active_clocks>`
14. `<active_obligations_and_consequences>`
15. `<active_open_threads>`
16. `<relationship_and_emotion_pressure>`
17. `<active_cast_full_dossiers>`
18. `<present_minor_cast>` when at least one present-minor cast record is selected
19. `<offstage_relevance>` when at least one offstage cast record is selected or offstage pressure/interruption is active
20. `<relevant_facts_beliefs_events>`
21. `<locations_objects_affordances>`
22. `<physical_continuity>`
23. `<contradiction_prohibitions>` from the ideation-specific continuity-only template
24. `<ideation_slots>`
25. `<ideation_quality>`
26. `<ideation_output_format>`

Ideation prompts do not render `<role>`, `<prose_mode>`, `<active_working_set>`, `<invention_permissions>`, `<prose_craft>`, `<stop_rule>`, or `<final_output_instruction>`. Those are prose-prompt sections. The ideation prompt instead renders:

- `<ideation_role>` from a template constant that frames the model as a story-development consultant, forbids prose/dialogue/scene text/branches/outlines, and labels output as non-canonical scratch.
- `<relationship_and_emotion_pressure>` from the same deterministic `relationship_emotion_pressure` placeholder used by the prose working-set summary, so RELATIONSHIP and EMOTION records still render after the ideation prompt drops `<active_working_set>`.
- `<ideation_slots>` from deterministic `assignSlots(snapshot.records, ideationRequest)`, including operator name, operator id, definition, slate shrink status, and slot citation keys.
- `<ideation_quality>` from a template constant containing the eventfulness, surprise-without-contradiction, reveal-discipline, and skip-if-unsupported rules.
- `<ideation_output_format>` from a template constant defining the flat idea/question block format and malformed-output discard rule.
- `<contradiction_prohibitions>` from an ideation-specific template constant containing continuity, canon, knowledge, reveal, future-consequence, and no-global-structure prohibitions without prose-craft-only lines.

For ideation prompts only, the `locations` and `objects` sub-blocks of `<locations_objects_affordances>` render every selected LOCATION and OBJECT record regardless of status, with status shown as a label. The prose prompt keeps the active/available status gate. For ideation prompts only, `<physical_continuity>` renders current-state physical lines plus status-only ENTITY STATUS, LOCATION, OBJECT, and VISIBLE AFFORDANCE lines; it does not re-render LOCATION/OBJECT descriptions already carried by `<locations_objects_affordances>`.

The ideation request is deterministic input. The current fields are `mode` (`ideas` or `questions`, default `ideas`), `count` (3-6, default 5), `dormantSlot` (default true), and `avoidList` (default empty). The prompt compiler must not read wall-clock time or accepted prose to assign slots. Citation keys are deterministic per compile and derived from selected record type plus the full display label, not the truncated browse label, with deterministic suffixes for collisions.

## 4. Exhaustive placeholder mapping

Every placeholder in `prompt-template.md` must appear in this mapping. Grouped rows are allowed only when each placeholder is named explicitly and all named placeholders share the same source, requiredness, missing behavior, and empty-state behavior.

Requiredness terms:

- Draft-save required: necessary for storing a structurally valid draft.
- Readiness required: blocks prompt preview, compilation, and generation when missing after normalization.
- Context-gated required: readiness-required only when explicit focus tags, selected records, story configuration, or manual directive make the state structurally necessary.
- Optional prompt preference: may compile if supplied; blank or missing state has a truthful deterministic omission or empty state.

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
| `{pov_character}` | PROSE MODE `pov_character`, resolved to the referenced selected record's human display label | Yes | Block if blank, unresolved, mistyped, or not selected | N/A | `omniscient` and `variable` render as literals. Non-omniscient POV requires knowledge profile. A referenced entity or cast member must resolve to a selected record before compilation. |
| `{person}`, `{tense}`, `{psychic_distance}`, `{interiority_mode}`, `{dialogue_density}`, `{paragraphing}`, `{language_output}`, `{special_style_constraints}` | PROSE MODE generation-time field or story default | Yes | Block if unresolved or internally contradictory | `None specified` only for optional special constraints | Describes person, tense, interiority, rhythm, and style constraints for the current generated segment. |
| `{hard_canon_bullets}` | Selected FACT records with `fact_kind=hard_canon` plus selected immutable story locks | Yes if relevant hard canon exists | Warn if none; block if needed for active age/status/identity/provider boundary | Omit whole `<hard_canon>` section when empty | Do not silently include unselected facts except story configuration constants. |
| `{current_time}` | CURRENT AUTHORITATIVE STATE.current_time | Readiness required | Block if blank | N/A | Approximate prose time is acceptable. |
| `{current_location}` | CURRENT AUTHORITATIVE STATE.current_location + selected LOCATION label if present | Readiness required | Block if blank | N/A | Scene-space/prose label is acceptable where no LOCATION record exists yet; must not contradict ENTITY STATUS/LOCATION records. |
| `{onstage_entities}` | CURRENT AUTHORITATIVE STATE.onstage_entities + ENTITY/CAST selected active or present-minor | Readiness required for material prose | Block if directive requires an entity but none selected/onstage | `None onstage` only for abstract/nonphysical prose | Person-like material entities require cast handling. |
| `{immediate_situation_summary}` | CURRENT AUTHORITATIVE STATE.immediate_situation_summary user-authored generation-time field | Readiness required | Block if blank | `None currently specified` only during deterministic backfill or empty prompt inspection | Prose-neutral summary of the immediate local situation. Must not be inferred from accepted prose or generated automatically. |
| `{offstage_pressuring_entities}` | CURRENT AUTHORITATIVE STATE.offstage_pressuring_entities + offstage selected records | Context-gated required | Block if offstage interruption lacks source | Omit line when empty | Required when offstage pressure/interruption is active. Offstage relevance section may expand. |
| `{positions}` | CURRENT AUTHORITATIVE STATE.positions + ENTITY STATUS + LOCATION/OBJECT state | Context-gated required | Block if relevant and absent | Omit line when empty | Required for physical interaction, gaze, object transfer, intimacy, violence, movement, blocking, turn-taking, or audibility. |
| `{entity_statuses}` | CURRENT AUTHORITATIVE STATE.entity_statuses + ENTITY STATUS records | Context-gated required | Block if relevant and absent or contradictory | Omit line when empty | Required for materially involved entities whose agency/status matters. |
| `{possessions}` | CURRENT AUTHORITATIVE STATE.possessions + OBJECT.owner/carried_by/current_location | Context-gated required | Block if object use/transfer/search/concealment can matter and absent | Omit line when empty | Two holders for one object block. |
| `{visible_conditions}` | CURRENT AUTHORITATIVE STATE.visible_conditions + ENTITY STATUS/CONSEQUENCE where visible | Context-gated required | Block if visible condition is structurally necessary and absent; otherwise warn | Omit line when empty | Includes visible injury, exhaustion, restraint, disguise. |
| `{environmental_conditions}` | CURRENT AUTHORITATIVE STATE.environmental_conditions + LOCATION | Context-gated required | Block if environment constrains local action/perception and absent; otherwise warn | Omit line when empty | Texture and physical constraint. |
| `{line_of_sight_and_visibility}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS.visibility_to_pov + LOCATION.visibility_and_sound | Context-gated required | Block if relevant and absent | Omit line when empty | Required for perception, secrecy, violence, intimacy, interruption, ambiguous perception, or who-can-see/hear-whom. |
| `{routes_and_exits}` | CURRENT AUTHORITATIVE STATE + LOCATION.access_routes + AFFORDANCE | Context-gated required | Block if route matters and absent | Omit line when empty | Required for movement, pursuit, escape, interruption, entrance, location change, or containment. Include impossible routes when omission invites errors. |
| `{available_time}` | CURRENT AUTHORITATIVE STATE + CLOCK + handoff | Context-gated required | Block if directive requires action without enough time state | Omit line when empty | "Enough time to speak" can be sufficient. |
| `{consent_or_force_conditions}` | CURRENT AUTHORITATIVE STATE + ENTITY STATUS + RELATIONSHIP/OBLIGATION/AFFORDANCE | Context-gated required | Block if relevant and absent | Omit line when empty; literal `none` is empty | Required for intimacy, restraint, coercion, object seizure, rescue movement, captivity, violence, or constrained agency. |
| `{current_locks}` | CURRENT AUTHORITATIVE STATE.current_locks + hard current locks from selected records | Context-gated required | Block if directive contradicts a lock | Omit line when empty | Required when locks/constraints exist or directive could contradict them. |
| `{recent_causal_context}` | IMMEDIATE HANDOFF.recent_causal_context + selected EVENT immediate/recent | Context-gated required | Block if continuation handoff is blank or not self-sufficient | `None; first local unit begins from current state` | First segment: optional deterministic empty state. Continuation: user-authored handoff required. Writer-visible; not automatically POV knowledge. No accepted prose. |
| `{last_visible_moment}` | IMMEDIATE HANDOFF.last_visible_moment | Context-gated required | Block if continuation lacks last visible moment or begin-after | Omit line when empty | First segment: optional. Continuation requires this or `{begin_after}`. |
| `{prior_accepted_prose_status_or_handoff_note}` | IMMEDIATE HANDOFF user-authored field | Yes | Block if accepted prose text, rejected candidate text, superseded regeneration text, or automatic prose-derived summary detected | `None. No accepted prose is included.` | Replaces accepted prose summary. |
| `{begin_after}` | IMMEDIATE HANDOFF.begin_after | Context-gated required | Block if continuation lacks begin-after or last visible moment; block if contradicts state/handoff | Omit line when empty | Exact start instruction. |
| `{manual_must_render}` | MANUAL DIRECTIVE.must_render | Readiness required | Block if blank after normalization | N/A | May be one instruction. Draft may save blank. |
| `{manual_may_render_if_naturally_caused}` | MANUAL DIRECTIVE.may_render_if_naturally_caused | No | No block | Omit line when empty | Invention corridor. |
| `{manual_do_not_force}` | MANUAL DIRECTIVE.do_not_force | Recommended | Warn if blank in risky scenes | Omit line when empty | Guardrail against overreach. |
| `{pov_knows}` | POV KNOWLEDGE PROFILE.pov_knows from PROSE MODE/FACT/BELIEF/SECRET/EVENT/ENTITY STATUS | Required for non-omniscient POV | Block if absent or contradictory | Omit line when empty | Labels do not grant knowledge. |
| `{pov_believes_suspects_misreads}` | POV KNOWLEDGE PROFILE.pov_believes_suspects_misreads | Required for close introspection; otherwise optional | Block if introspection expected and absent | Omit line when empty | Must distinguish from fact. |
| `{pov_does_not_know}` | POV KNOWLEDGE PROFILE.pov_does_not_know + SECRET non-holder lanes | Required when hidden truth exists or POV limit matters | Block if active secret lacks POV non-knowledge relation | Omit line when empty | Prevents leakage. |
| `{pov_cannot_perceive_now}` | CURRENT AUTHORITATIVE STATE.pov_cannot_perceive_now user-authored generation-time field | Required when perception limits matter | Block if ambiguous perception or hidden plan depends on it and absent | Omit line when empty | Prevents impossible perception. Does not read `{line_of_sight_and_visibility}` automatically. |
| `{audience_knows}` | AUDIENCE KNOWLEDGE PROFILE.audience_knows | Required when audience differs from POV or hidden truth is writer/audience-visible | Block if active secret lacks audience relation | `No audience knowledge distinct from POV specified` | Dramatic irony without leakage. |
| `{audience_does_not_know}` | AUDIENCE KNOWLEDGE PROFILE.audience_does_not_know | No unless audience ignorance matters | No block | `None specified` | Avoids overrevealing. |
| `{dramatic_irony_permissions}` | AUDIENCE KNOWLEDGE PROFILE.dramatic_irony_permissions | Required when audience knows more than POV | Block if absent in heavy irony scene | `None specified` | Does not grant POV knowledge. |
| `{audience_perception_ambiguous}` | AUDIENCE KNOWLEDGE PROFILE from active `SECRET` where `audience_visibility === "ambiguous"` | No unless active ambiguous secret exists | No block | Omit line when empty | Audience grasp deliberately unresolved; does not assert audience knowledge or grant POV knowledge. |
| `{writer_visible_hidden_truths}` | Selected SECRET.secret_claim prefixed with SECRET.secret_kind, plus writer-visible hidden facts | Required when any active secret matters | Block if absent but secret tag set | Omit line when empty; underlying empty constant remains `No active secrets or reveal locks selected` | Writer-facing only; kind prefix is a deterministic category label, not extra knowledge. |
| `{secret_holders}` | SECRET.holders resolved to referenced records' display labels | Required for active secret | Block if blank | Omit line when empty; underlying empty constant remains `No active secrets or reveal locks selected` | Raw-id fallback only when a referenced record is absent from the selected snapshot; holder list may be all/unknown only if explicit. Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous. |
| `{secret_non_holders_to_protect}` | SECRET.non_holders_to_protect resolved to referenced records' display labels | Required for active secret | Block if blank | Omit line when empty; underlying empty constant remains `No active secrets or reveal locks selected` | Defines protected ignorance. Raw-id fallback only when a referenced record is absent from the selected snapshot; `all_except_holders` and `none` render as deterministic phrases. Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous. |
| `{allowed_clues_and_surface_cues}` | SECRET.allowed_surface_cues + `clue_carriers` entries with `status: "available"` | Required for clue pressure; optional otherwise | Block if clue pressure tag set and absent | Omit line when empty; underlying empty constant remains `None specified` | Surface cues without reveal; clue carriers surface only `clue_text`, not `discovered_by` ids or audience metadata. Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous. |
| `{forbidden_reveals}` | SECRET.forbidden_reveals | Required for active secret | Block if blank | Omit line when empty; active secrets may use the affirmative `none` sentinel, which renders as `No reveals are forbidden beyond the stated reveal permission.` | Prevents narrator leakage. Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous. |
| `{reveal_permissions}` | SECRET.reveal_permission + reveal_triggers | Required for active secret | Block if blank or contradictory | Omit line when empty; underlying empty constant remains `No active secrets or reveal locks selected` | `locked` cannot be overridden by directive. Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous. |
| `{active_action_pressure}` | User-authored pressure summary + selected INTENTION/PLAN/AFFORDANCE/CONSEQUENCE/OPEN THREAD grouped deterministically | Yes | Warn if empty; block if directive lacks enough context | `None beyond detailed records below` | Not an LLM summary. INTENTION and PLAN lines prefix the holder's resolved display label with raw-id fallback; holder-less action-pressure records render without a name prefix. CONSEQUENCE lines render `possible_next_effect` as their summary text. Unlike the detailed `<active_*>` sections, this summary retains non-active action-pressure records with a deterministic display-label annotation: INTENTION/PLAN/OPEN THREAD/CONSEQUENCE statuses other than `active`, and VISIBLE AFFORDANCE statuses other than `available`, render as `[<type> <status>]` so blocked, suspended, answered, resolved, or unavailable pressure is not mistaken for active pressure. VISIBLE AFFORDANCE action text belongs here as current action possibility; do not duplicate the same action text in `{material_pressure}`. |
| `{active_knowledge_pressure}` | User-authored pressure summary + selected SECRET/BELIEF/FACT/EVENT lanes, narrowed by pressure predicates | Yes when knowledge/secrecy matters | Warn/block as applicable | `None beyond detailed records below` | Keeps information pressure salient without copying the archive. BELIEF pressure leads with `behavioral_effect` when present, followed by a compact belief identifier/claim. This behavioral-effect-first ordering applies to all beliefs in the pressure summary by design — the pressure line conveys current behavioral/interiority force, not the dossier — and intentionally differs from the `{pov_relevant_beliefs}` detail row, which leads POV beliefs with truth relation; the difference is a deliberate dual-frame, not a drift bug. SECRET pressure may state the hidden truth only when reveal constraints still govern its use. FACT pressure renders only when `fact_kind=hard_canon`, `fact_kind=current_state`, `scope=current_segment`, or `salience=high|critical`; ordinary low/medium setting/discovered facts remain in the detail sections. EVENT pressure renders `immediate_previous` and `recent_causal` events with `current_relevance` other than `none`; `offstage` events render here only when `current_relevance=high|critical`; `relevant_backstory` and `withheld` events do not render here unless separately represented by a SECRET/reveal lane. If the projected pressure text equals the display label, render it once. EVENT knowledge pressure renders the description claim without appending the relevance enum. |
| `{relationship_emotion_pressure}` | Selected RELATIONSHIP/EMOTION records rendered as the description label plus pressure text and, for RELATIONSHIP, current expression | No unless local pressure depends on it | Warn if expected but absent | `None beyond detailed records below` | Avoid raw axes alone. |
| `{material_pressure}` | Selected LOCATION/OBJECT/ENTITY STATUS pressure summary | Required for physical/object-heavy moments | Block if physical tag set and absent | `None beyond detailed records below` | Current physical/material pressure. VISIBLE AFFORDANCE action text does not render here; affordances are carried by `{active_action_pressure}`, `{visible_affordances}`, and `{physical_continuity}`. If a future implementation needs a blocked/unavailable affordance warning here, it must render status-only, not repeat the affordance `prompt_text`. |
| `{voice_pressure}` | User-authored generation-time voice pressure summary | Optional prompt preference | Warn if absent when local voice salience may degrade; block only when no durable/compressed voice authority exists for required speech/POV/body presence | `None beyond detailed records below` | Complements durable voice anchors and pins. |
| `{active_cast_voice_pressure_pins}` | CAST MEMBER.voice_anchor + CURRENT CAST VOICE PRESSURE + CAST VOICE OVERRIDES + active local_function | Optional prompt preference | Warn if absent when durable anchors are sufficient; block only if supplied pressure contradicts authority or required voice/body authority has no durable/compressed/current source | Omit or `None` if no active person-like cast | Salience duplicate; includes dialogue/narration/nonverbal/silence scopes. |
| `{active_intentions}` | Selected INTENTION records | No | Warn if directive implies goal but none selected/authored | `None active` | Holder ids resolve to selected records' display labels with raw-id fallback. Free-text intent and behavioral pressure render verbatim. Weaker than plans. |
| `{active_plans}` | Selected PLAN records | No unless directive depends on plan | Block if plan holder cannot act but plan is meant to drive prose | `None active` | Holder ids resolve to selected records' display labels with raw-id fallback. Free-text objective/current step/resources/blockers render verbatim. Active relevant plans drive tactics. |
| `{active_clocks}` | Selected CLOCK records | No | Block if contradicts current state; warn stale | `None active` | Human updates after acceptance. |
| `{active_obligations}` | Selected OBLIGATION records | No | Block if assumes contradicted state | `None active` | `owed_by` and record-id `owed_to` values resolve to selected records' display labels with raw-id fallback; sentinel `public`/`institution`/`self`/`unknown` values render literally. Free-text terms and consequence text render verbatim. Durable-change support. |
| `{active_consequences}` | Selected CONSEQUENCE records | No | Block if assumes contradicted state | `None active` | `holder_or_target` and record-id `cause` values resolve to selected records' display labels with raw-id fallback; sentinel `public`/`unknown` values and free-text `cause` render literally. Free-text effects render verbatim. Durable-change support. |
| `{active_open_threads}` | Selected OPEN THREAD records | No | Warn if too many high-urgency threads | `None active` | Never commands closure. |
| `{active_onstage_full_cast_dossiers}` | CAST MEMBER selected active/onstage full, including all populated prompt-facing fields | Required for active person-like cast materially involved | Block if required core missing | N/A if no active person-like cast | Include all populated fields except record-reference IDs such as `entity_id`, which remain validation-only per §9. Render structured fields core-first: identity, voice_anchor plus voice_extended/speech-pattern fields, pressure_behavior_core, body_presence_core, agency_core, remaining optional extended fields, selected samples last. No silent compression. |
| `Current generation voice override` line | CAST VOICE OVERRIDES targeting active/onstage cast | No | No block unless contradictory | Omit when absent | Temporary, scoped, not durable. For present-minor targets, render inside `{present_minor_cast_notes}` only. |
| sample utterances inside dossiers | CAST MEMBER.sample_utterances selected by user or deterministic metadata | No | No block | Omit; optional explicit `No selected sample utterances` allowed in examples | At most three; default zero; one short line each, normally <=40 words; `may_reuse_cadence_not_text`, not `may_echo_lightly`. |
| `{present_minor_cast_notes}` | ENTITY/CAST MEMBER selected present-minor + current status + compressed voice note + temporary voice override when present | No | No block; block only if present-minor speech is required and voice note absent | Omit whole `<present_minor_cast>` section when the band is empty | Compressed notes only. Temporary overrides remain current-generation only. |
| `{offstage_relevance_notes}` | ENTITY/CAST selected offstage + offstage pressure records | Required if offstage interruption/pressure active | Block if interruption lacks route/timing/communication | Omit whole `<offstage_relevance>` section when the band is empty and no offstage pressure/interruption is active. If offstage pressure/interruption is active with no offstage cast slice, render: `Offstage pressure or interruption is active, but no offstage cast slice has been authored. Establish why the offstage party matters now, whether and how it can interrupt (entrance, communication, timing, or route), and what must not be revealed or assumed.` | No full offstage dossier unless active. If offstage pressure/interruption is active, the section remains present even when validation will block missing route/timing/communication. Rendering offstage pressure records as body content is deferred and not implemented in the current compiler. |
| `{pov_accessible_facts}` | Selected FACT known to POV/public | No except when directive depends on them | Block if required fact missing | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Prevents generic fact leakage. |
| `{writer_visible_or_non_pov_facts}` | Selected FACT not POV-accessible; SECRET/EVENT-derived writer-visible truth | No | Block if hidden fact lacks reveal constraints | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Not narrator knowledge. |
| `{pov_relevant_beliefs}` | BELIEF held by POV | No | Warn if POV-heavy scene lacks interpretive pressure | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Mark truth relation first; render claim in full plus belief mode, truth relation, confidence, access route, behavioral effect, and visibility. This detail row remains the full authority record. Any prior active knowledge pressure line is a current-pressure cue, not a substitute for these fields. |
| `{non_pov_behavior_shaping_beliefs}` | BELIEF held by non-POV cast | No | Block if used as direct interiority in forbidden prose mode | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Render through behavior first; render claim in full plus behavioral effect, belief mode, truth relation, confidence, access route, and visibility. This detail row remains the full authority record. Any prior active knowledge pressure line is a current-pressure cue, not a substitute for these fields. |
| `{recent_events}` | Selected EVENT with event_kind immediate_previous/recent_causal | No except when needed | Warn if too many; block if contradictory | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | No flat archive dump. |
| `{relevant_backstory}` | Selected EVENT relevant_backstory and selected backstory facts with current relevance | No | Warn if too many/stale | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Only current-relevant backstory. |
| `{offstage_or_withheld_events}` | Selected EVENT offstage/withheld grouped by visibility | No except when offstage/withheld pressure matters | Block if withheld event leaks into POV | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Writer-visible does not mean POV-visible. |
| `{locations}` | Selected LOCATION + current location | Required for physical/location-focused generation | Block if underspecified | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Current first. |
| `{objects}` | Selected OBJECT + current possessions | Required for object use/transfer or salient object presence | Block if underspecified | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Owner/carried_by/current_location ids resolve to selected records' display labels, with raw-id fallback when absent. Visibility must align. |
| `{visible_affordances}` | Selected VISIBLE AFFORDANCE records + current state | Required for physical interaction/action choices | Block if directive requires action without affordance | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Possible actions. `available_to` ids resolve to selected records' display labels, with raw-id fallback when absent; `group` and `any_onstage` render as literals. Affordance `durability` renders as a deterministic labeled clause alongside actions, requires, and risk. |
| `{unavailable_or_impossible_actions}` | CURRENT STATE locks + AFFORDANCE unavailable/blocked + validation-derived impossibilities | Required when omission would invite errors | Block if physical scene risky and absent | Omit sub-block when empty; section-level `None specified` only when all sibling sub-blocks empty | Must not be invented by an LLM. |
| `{physical_continuity}` | CURRENT STATE + ENTITY STATUS + LOCATION/OBJECT/AFFORDANCE | Yes for active physical interaction | Block if missing required physical fields | N/A only for nonphysical abstract prose | Concrete and current. |
| `<invention_permissions>` | Template constant | Yes | Block if absent | N/A | Human gatekeeping. Dynamic durable-change pressure renders in its own records and placeholders, not as a second render site here. |
| `<contradiction_prohibitions>` | Template constant | Yes | Block if absent | N/A | Cannot be weakened by directive. Selected current locks render in `{current_locks}` and physical-continuity placeholders. |
| `<prose_craft>` | Template constant | Yes | Warn if style conflicts with prose mode | N/A | Craft cannot alter continuity. Story/prose preferences and cast voice fields render in their own placeholders. |
| `{soft_unit_guidance}` | STOP GUIDANCE.soft_unit_guidance generation-time field | Optional prompt preference | Block only if supplied text is non-local or contradictory with manual directive; blank does not block | Supplied text renders once as `Soft unit: <text>`; blank omits the line | Replaces beat count; must describe the next local unit, not a chapter/arc/future summary. Blank guidance means no additional user narrowing beyond the universal local stop rule. |
| `<final_output_instruction>` | Template constant | Yes | Block if absent | N/A | Final prompt edge. |
| `validation_focus_tags` | GENERATION VALIDATION FOCUS | Readiness required, validation-only | Exactly one generation context after normalization; draft value may default by accepted-segment count | Not prompt-facing | Activates matrix rows only. |

## 5. Universal minimum prompt completeness

Generation blocks unless these are satisfied:

1. Constitutional template sections always compile: role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction.
2. Story configuration is populated enough to avoid a generic story prompt and to satisfy provider/content boundaries.
3. Current authoritative state has the universal floor: time/temporal position, location/scene-space, onstage/material entities, and immediate situation summary.
4. Manual directive `must_render` is present and local.
5. Generation context is resolved by normalization.
6. First segment can compile without continuation handoff. Continuation requires user-authored handoff.
7. Blank stop guidance is allowed; supplied stop guidance must be local and noncontradictory.
8. Non-omniscient POV requires a populated POV knowledge profile when a POV entity is involved.
9. Active secrets/reveal constraints require deterministic holder/non-holder/reveal-permission data when selected or relevant.
10. Context-gated physical, knowledge, cast, object, movement, violence, intimacy, institutional, clock, and obligation requirements apply only when explicit tags, records, story configuration, or directive make them structurally necessary.
11. Accepted prose text, rejected candidate text, superseded regeneration text, automatic prose-derived summaries, and prose-mined continuity never appear in prompt-facing fields.

## 6. Generation validation matrix

| Validation focus tag | Context-dependent blockers |
|---|---|
| `first_segment` | No continuation handoff is required. `prior_accepted_prose_status_or_handoff_note` must render no accepted prose included; launch state must be self-sufficient; no continuation phrases such as "as above." |
| `continuation_after_accepted_segment` | Handoff must be user-authored; accepted prose/rejected candidate/auto summary blocks; deterministically identifiable durable changes in handoff must be represented in selected records or current state. |
| `dialogue_expected` | Active speakers require core CAST MEMBER dossier, durable voice anchor or compressed present-minor voice note, language/register state, POV knowledge boundaries, and relationship/status context. Current voice pressure warns when absent unless no durable/compressed voice authority exists. |
| `ensemble_dialogue_expected` | Three or more likely speakers require current speaker functions, relationship/status pressure among speakers, and physical/auditory state showing who can hear or interrupt whom. Distinct current voice pins usually warn unless durable voice anchors are missing or too generic for required material speech. |
| `introspection_expected` | Requires POV beliefs/suspicions/misreads, relevant emotion/interior pressure, psychic distance/interiority mode, and non-POV interiority restrictions. |
| `physical_interaction_expected` | Requires location, onstage entities, positions/distance, visibility, possessions where relevant, routes/exits, available time, and impossible/unavailable actions when omission invites error. |
| `active_silent_presence_expected` | Active silent character needs core dossier, body_presence_core, current position/visibility, allowed actions, and POV access limits when the silent presence materially affects prose. Current silence pressure is recommended, not universal. |
| `present_minor_speech_possible` | Present-minor speaker needs compressed voice note sufficient for material speech or must be promoted to active/onstage; otherwise block material speech. No block when no material speech is expected. |
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

Reference severity lanes:

| Lane | Dangling or mistyped reference | Existing but unselected reference |
|---|---|---|
| Readiness-required brief lanes (`selected_pov`, onstage entities, current location, required offstage pressure, required entity-status records) | Block | Block |
| Optional brief lanes (optional offstage pressure, optional entity-status records) | Block | Warn |
| Cast-band and voice attachment lanes | Block when missing or mistyped; duplicate cast-band membership blocks | Warn when a voice-pressure attachment targets an existing cast member outside rendered bands |
| Required record-internal lanes (active secret holders/protected non-holders; plan holder when prose-driving or hidden-plan focus applies) | Block | Block |
| Optional record-internal lanes (relationship endpoints, object owner/carrier/location, event participants/known-by/location/record links, affordance availability, belief/emotion/intention holders, obligation/consequence targets) | Block when dangling or mistyped by lane; broad record links may accept any record type | Warn |
| Structural coherence lanes (onstage/offstage overlap, onstage status/location, object holder/location, relationship endpoints) | N/A | Block on deterministic enum/id contradiction |

Implemented reference and structural blocker codes:

- `selected-pov-reference-invalid`, `onstage-entity-reference-invalid`, `offstage-entity-reference-invalid`, `entity-statuses-reference-invalid`, and `current-location-reference-invalid`;
- `cast-band-duplicate-membership`, `cast-band-reference-invalid`, and `voice-pressure-attachment-invalid`;
- `record-reference-dangling`, `record-reference-type-mismatch`, and `record-reference-unselected-required`;
- `onstage-offstage-entity-overlap`, `onstage-entity-status-contradiction`, `object-location-holder-incoherence`, and `relationship-self-reference`.

Implemented reference warning codes:

- `offstage-entity-reference-unselected-optional`, `entity-statuses-reference-unselected-optional`, `voice-pressure-orphaned-attachment`, and `record-reference-unselected-optional`.

Universal blockers not tied to a single validation focus tag:

- manual directive or stop guidance requesting a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points instead of one local prose segment;
- manual directive and stop guidance contradicting each other about the local unit or stop boundary;
- dangling, mistyped, duplicated, or required-but-unselected references in readiness-required brief, cast-band, voice attachment, or record-internal lanes;
- deterministic structural contradictions: the same entity both onstage and offstage-pressuring, an onstage entity status placing it offstage/concealed or at a different record-id location, an object whose location is `carried_by_holder` while `carried_by` is `none`, or a relationship whose endpoints are the same id;
- template, schema, or compiler-contract version mismatch that leaves a prompt placeholder without a deterministic source.

Warnings that must not block:

- prompt length or lost-in-the-middle risk;
- too many high-salience records selected;
- no sample utterances selected;
- no active clock where directive is otherwise sufficient;
- sparse setting texture;
- low-drama scene may need stronger prose-craft pressure;
- long active dossier may need stronger current voice/body pressure pin;
- active/onstage extended dossier is sparse but required core is sufficient;
- existing but unselected references in optional brief or record-internal lanes;
- voice pressure targets an existing cast member outside the rendered cast bands.

## 7. Blocker/warning rendering

Blockers are shown to the user before compilation. They prevent prompt generation and OpenRouter sending.

Warnings are shown to the user but do not compile into the prose prompt. The compiler must not render unresolved warnings as `<compiler_warning>` or similar prompt text.

A validation message should identify the conflicting records or fields, explain the conflict in plain language, and indicate possible user actions: revise, remove, deselect, add current state, add route, add knowledge constraint, add reveal permission, promote cast, add voice/body pressure, or change directive.

Author-facing readiness items must not lead with raw technical codes. Blockers and warnings should include these fields where relevant:

- Title.
- What may degrade.
- Why this is not blocking.
- When it would become blocking.
- Fastest fix.
- Ignoring is reasonable when.
- Affected labels.
- Technical code in details.

Repeated warnings should deduplicate by affected field/record group and present grouped salience warnings instead of one warning per long dossier, missing optional pin, or sparse optional nuance.

## 8. Empty-state rendering rules

- Constitutional sections are never omitted.
- Optional list sections render `None`, `None active`, `None selected`, or `None specified` using the exact phrase defined in the mapping row.
- Empty states must not imply missing canon is safe when a validation tag requires it. Required-but-missing state blocks before rendering.
- Empty states are deterministic constants, not model-authored paraphrases.
- A pressure summary may be empty even when later detail sections contain records, if no selected record satisfies that pressure summary's deterministic predicate. Use the existing empty state (`None beyond detailed records below`) and do not synthesize a filler summary.
- Empty-state rendering must not be used to hide a structurally unusable prompt.
- Optional prompt-preference fields may be omitted entirely when blank if the surrounding universal instruction remains structurally complete.
- Empty-state rendering is required only when omission would make the prompt ambiguous or structurally malformed.
- `<current_authoritative_state>` always renders the section tag and the four readiness-required lines: time, location, onstage entities, and immediate situation. The eleven context-gated lines omit both label and value when empty; `consent_or_force_conditions: "none"` is treated as empty.
- `<immediate_handoff>` always renders the section tag, `recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, and the accepted-prose firewall instruction text. `last_visible_moment` and `begin_after` omit both label and value when empty.
- `<manual_directive priority="high">` always renders the section tag and `must_render`. `may_render_if_naturally_caused` and `do_not_force` omit both label and value when empty.
- `<pov_knowledge_constraints>` always renders the section tag and the static prompt-label and non-POV interiority rules. `pov_knows`, `pov_believes_suspects_misreads`, `pov_does_not_know`, and `pov_cannot_perceive_now` omit both label and value when empty.
- `<secrets_and_reveal_constraints>` always renders the section tag and the static reveal-permission rule. `writer_visible_hidden_truths`, `secret_holders`, `secret_non_holders_to_protect`, `allowed_clues_and_surface_cues`, `forbidden_reveals`, and `reveal_permissions` omit both label and value when empty. The affirmative `forbidden_reveals: "none"` sentinel is content, not empty state, and still renders its deterministic sentence.
- `<hard_canon>`, `<present_minor_cast>`, and `<offstage_relevance>` are the designated optional universal-prompt sections. `<hard_canon>` omits the entire section when no hard-canon FACT is selected and no immutable story lock is active. `<present_minor_cast>` omits the entire section when no present-minor cast record is selected. `<offstage_relevance>` omits the entire section only when no offstage cast record is selected and no offstage pressure or interruption is active.
- Optional list sub-blocks inside `<relevant_facts_beliefs_events>` and `<locations_objects_affordances>` omit both the sub-block header and value when empty. If all sibling sub-blocks in one of those composite sections are empty, the section tag remains and renders the single deterministic section-level empty state `None specified`.

## 9. Prompt-facing vs validation-only fields

Validation-only by default:

- `validation_focus_tags`;
- validation diagnostics;
- blocker/warning severity;
- record IDs unless deliberately exposed for debugging outside the generated prompt;
- project record index and selected/unselected/dangling reference classifications;
- source provenance metadata;
- prompt/template/compiler version metadata unless the user chooses a debug prompt view.

The `{pov_character}`, `{current_location}`, `{onstage_entities}`, `{offstage_pressuring_entities}`, `{entity_statuses}`, `{secret_holders}`, `{secret_non_holders_to_protect}`, `{active_intentions}`, `{active_plans}`, `{active_obligations}`, `{active_consequences}`, `{objects}`, and `{visible_affordances}` placeholders include prompt-facing id-derived values: entity, entity-status array entries, current-location records, object-holder, object-location, affordance availability, plan/intention holder, obligation owed-by/owed-to, and consequence target/cause ids are resolved to selected records' human display labels before rendering. `{pov_character}` also renders `omniscient` and `variable` as literals. `{current_location}` prose values pass through verbatim when they do not match a project record. `{entity_statuses}` resolves only the record-id array branch; prose values pass through verbatim. `{secret_non_holders_to_protect}` renders `all_except_holders` and `none` as deterministic phrases. `{active_obligations}` renders `public`, `institution`, `self`, and `unknown` as deterministic literals. `{active_consequences}` renders `public` and `unknown` as deterministic literals, and free-text `cause` values pass through verbatim. `{visible_affordances}` renders `group` and `any_onstage` as deterministic literals. Required unresolved references block before compilation. Optional unselected references warn; optional raw-id fallback is permitted only where the lane is explicitly optional and the warning is surfaced.

Prompt-facing when selected or compiled:

- user-authored current state, handoff, directive, pressure text, record prose fields, cast dossiers, voice anchors, current voice pressure pins, secrets/reveal lanes, affordances, stop guidance, and temporary cast voice overrides.

Prompt-facing only as deterministic labels when useful for rendering/validation clarity:

- active cast local function labels such as active speaker, active silent, POV narrator, or present-minor speaker.

## 10. Change-control rule

Any change to a prompt placeholder, template section, schema field used for compilation, requiredness rule, empty-state rendering rule, validation focus tag, blocker/warning row, Red Bunny generated prompt surface, or stress-suite assumption must update this compiler contract in the same document revision.

Changes to pressure-predicate inclusion, pressure-summary field precedence, or VISIBLE AFFORDANCE placement must update compiler tests, the golden prompt baseline, `docs/prompt-template.md`, and `docs/prompt-template-rationale.md` in the same revision.
