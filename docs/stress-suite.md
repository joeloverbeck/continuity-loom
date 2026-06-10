# Continuity Loom Prompt/Schema Stress Suite

Status: active audit — canonical stress cases for validation, compiler, prompt, and demo regression coverage
Authority: domain authority for validation stress cases (see docs/ACTIVE-DOCS.md)

---

## Purpose

Red Bunny is a strong first-person, two-character, secret/POV/physical-continuity stress prompt. It is not sufficient as the only stress case. This suite covers additional failure modes the template, schema, validation matrix, and compiler contract must survive.

Each case lists the stress target, required records or generation-time fields, suggested validation focus tags, expected blockers, and prompt-quality risks. These are conceptual stress cases, not implementation tests.

---

## Coverage matrix

This matrix exists to prevent drift. It does not replace the cases; it shows whether the suite still covers the major prompt/schema/compiler risks.

| Risk / validation surface | Primary cases | Coverage note |
|---|---|---|
| No accepted prose in prompts / continuation handoff | 8 | Handoff must be user-authored and represented in records/current state. |
| First segment empty-state correctness | 7 | First segment must be self-sufficient without accepted prose. |
| Local-prose-only stop boundary | 13, 26 | The universal stop rule must define a response point; optional stop guidance may narrow it but is not required. |
| Dialogue voice distinction | 1, 12, 14, 15, 20 | Covers two-speaker, ensemble, present-minor, and large-cast voice risks. |
| Active silent cast / body presence | 21 | Prevents silent active characters from disappearing. |
| POV/audience/secrets separation | 1, 6, 9, 19, 22, 23 | Covers hidden truths, non-POV behavior shaping, multi-POV projects, and ambiguous perception. |
| Physical continuity | 2, 3, 4, 5, 21, 23, 24, 25 | Covers routes, exits, line of sight, body positions, time, objects, and force/consent. |
| Object use and transfer | 3, 24 | Separates use from holder change. |
| Offstage / institutional / nonhuman pressure | 4, 18 | Requires route, reach, authority, communication, or operating mechanism. |
| Mature fiction envelope | 5, 17 | Covers erotic and non-erotic mature material with provider-policy priority. |
| Clocks, obligations, consequences | 11, 25 | Requires current opportunity and visible cause for ticks/breaches. |
| Low-drama / minimalist prose quality | 13, 16 | Guards against generic filler and manufactured incident without fake validators. |
| Large-context salience / cast dossier bloat | 12, 15 | Warnings, voice pins, and core-first dossier order must preserve salience without compression. |
| False reports and belief truth relations | 10 | Prevents testimony from becoming canon. |

---

## Case 1 — Multi-character dialogue with asymmetric secrets

Stress target: three active speakers, one secret held by two but not the POV, audience knows the secret.

Required records:

- PROSE MODE: close third or first person.
- Three active CAST MEMBER core dossiers and voice pressure pins.
- SECRET with holders, protected non-holders, allowed clues, forbidden reveals, reveal permission.
- RELATIONSHIP records among all active speakers where pressure matters.
- Current positions, sight lines, and who can hear whom.

Validation focus tags:

- `dialogue_expected`
- `ensemble_dialogue_expected`
- `secret_or_clue_pressure`
- `physical_interaction_expected` if blocking matters

Expected blockers:

- Any active speaker lacks core voice anchor.
- Ensemble speakers lack distinct current voice pins or relationship/status context.
- Secret has no protected non-holders or reveal permission.
- POV knowledge profile grants the secret while the secret says hidden.

Prompt-quality risk:

- Generic group banter.
- Secret leakage into POV narration.
- Dialogue becoming exposition instead of tactic.

---

## Case 2 — Physical chase or fight

Stress target: fast movement, injury possibility, route constraints, line of sight.

Required records:

- CURRENT AUTHORITATIVE STATE with positions, distance, line of sight, exits, route limits, available time.
- ENTITY STATUS for pursuer and pursued.
- LOCATION with routes, hazards, shelters, visibility/sound.
- AFFORDANCE records for run, hide, grapple, strike, block, escape.
- CONSEQUENCE records for current injuries or prior exhaustion.

Validation focus tags:

- `physical_interaction_expected`
- `location_change_possible`
- `violence_or_injury_possible`
- `clock_tick_possible` if pursuit/danger worsens

Expected blockers:

- No route/exits.
- No available time.
- Entity incapacitated but plan requires pursuit.
- Weapon/object used but object visibility/possession missing.

Prompt-quality risk:

- Teleporting bodies.
- Untracked injuries.
- Fight choreography ignoring POV visibility.

---

## Case 3 — Object transfer under pressure

Stress target: possession continuity and consent/force state.

Required records:

- OBJECT with owner, carried_by, current_location, visibility, affordances, constraints.
- CURRENT AUTHORITATIVE STATE possessions and positions.
- AFFORDANCE for offer, grab, hide, refuse, drop, use.
- Relationship/emotion pressure affecting whether transfer is plausible.

Validation focus tags:

- `object_transfer_possible`
- `object_use_possible`
- `physical_interaction_expected`
- `restraint_or_coercion_possible` if seizure or forced handoff is possible

Expected blockers:

- Two current holders.
- Object transferred without body positions or plausible action.
- Directive requires character to use an object they cannot see/access.

Prompt-quality risk:

- Object teleportation.
- Forced transfer sanitized as consent.
- Symbolic object treated as disposable texture.

---

## Case 4 — Offstage interruption

Stress target: offstage entity affects the scene without magical arrival.

Required records:

- Offstage entity status/location or uncertainty state.
- Communication/entrance/timing route.
- Awareness mechanism: why the offstage entity can interrupt now.
- Current location access rules.
- Existing clock/plan/obligation if interruption is pressured.

Validation focus tags:

- `offstage_interruption_possible`
- `institutional_involvement_possible` if police/school/hospital/workplace/system acts

Expected blockers:

- Offstage character appears without route.
- Phone call occurs but no phone/object/communication affordance exists.
- Institution acts without contact or jurisdiction route.

Prompt-quality risk:

- Deus ex interruption.
- Offstage interiority in close POV.
- Interruption resolving instead of complicating local pressure.

---

## Case 5 — Intimate scene with consent/status constraints

Stress target: mature fiction envelope plus continuity, age/status, agency, body positions, publicness.

Required records:

- Active cast ages/statuses.
- Content envelope.
- Consent/force conditions.
- Current body positions and privacy/publicness.
- Relationship/emotion pressure.
- Secret/reveal constraints if intimacy would expose hidden truth.

Validation focus tags:

- `intimacy_or_sex_possible`
- `physical_interaction_expected`
- `secret_or_clue_pressure` if relevant
- `restraint_or_coercion_possible` if power/force ambiguity matters

Expected blockers:

- Missing ages/statuses.
- Content envelope contradicts active cast ages/statuses or provider constraints.
- Consent/force conditions absent where intimacy/restraint is possible.

Prompt-quality risk:

- Content-policy moralizing.
- Flattened consent/force state.
- Characters acting from genre heat rather than current records.

---

## Case 6 — Close-third non-POV leakage trap

Stress target: close POV where non-POV dossier is rich but interiority is forbidden.

Required records:

- PROSE MODE: close third, single POV.
- Non-POV active cast full dossier.
- POV knowledge profile.
- Non-POV beliefs/emotions marked behavior-shaping only.

Validation focus tags:

- `introspection_expected`
- `dialogue_expected`
- `secret_or_clue_pressure` if hidden truth matters

Expected blockers:

- POV profile absent.
- Non-POV secret marked hidden but narration allowed to certify it.

Prompt-quality risk:

- Dossier leaks as direct non-POV thoughts.
- Close third becomes omniscient.
- Surface behavior loses specificity because interiority is forbidden.

---

## Case 7 — First segment with minimal records

Stress target: minimum viable prompt without overblocking.

Required records:

- STORY CONTRACT.
- UNIVERSAL CONTENT POLICY.
- PROSE MODE.
- CURRENT AUTHORITATIVE STATE.
- MANUAL DIRECTIVE.
- Optional STOP GUIDANCE.
- At least one active CAST MEMBER core dossier if a person-like character is materially onstage.

Validation focus tags:

- `first_segment`
- other tags only if the directive actually expects them

Expected blockers:

- Missing current state.
- Missing manual directive.
- Active speaker lacks core voice anchor.

Expected readiness outcome:

- Passes with blank stop guidance and blank continuation handoff when current-state floor and manual directive are present.
- Blocks only true missing readiness items such as current state, manual directive, or required cast authority.

Prompt-quality risk:

- Overdesigned schema blocks a legitimate small opening.
- Lack of pressure produces generic prose.

---

## Case 8 — Continuation after accepted segment

Stress target: no prose-as-canon drift.

Required records:

- User-authored handoff note, not accepted prose.
- EVENT/FACT/OBJECT/LOCATION/RELATIONSHIP/etc. records representing durable changes from the accepted segment.
- Current state updated to the new start point.

Validation focus tags:

- `continuation_after_accepted_segment`

Expected blockers:

- Missing user-authored continuation handoff.
- Verbatim accepted prose in handoff.
- Automatic prose-derived summary.
- Handoff says object changed hands but OBJECT/current possessions still disagree.

Expected readiness outcome:

- Blocks when continuation handoff is missing.
- Never includes accepted prose, rejected candidates, superseded candidates, or automatic prose summaries in prompt-facing fields.

Prompt-quality risk:

- Model echoing prior prose.
- Archived prose becoming canon authority.
- Handoff/current-state contradiction.

---

## Case 9 — Hidden offstage plan shaping visible behavior

Stress target: non-POV plan influences action without mind-reading.

Required records:

- PLAN with holder, current_step, visibility_to_pov, resources, blockers.
- ENTITY STATUS for plan holder.
- Surface cues that can be visible to POV.
- POV knowledge profile marking plan as hidden/suspected/known.

Validation focus tags:

- `non_pov_hidden_plan_behavior`
- `secret_or_clue_pressure` if plan is secret

Expected blockers:

- Plan holder cannot act and no means exists.
- Hidden plan compiled as narrator-certified fact in close POV.

Prompt-quality risk:

- Plan disappears because it is hidden.
- Plan leaks as direct non-POV intention.

---

## Case 10 — Conflicting beliefs and false reports

Stress target: truth relation and testimony route.

Required records:

- BELIEF records with truth_relation, holder, access_route, confidence, behavioral_effect.
- FACT/current state where known truth exists.
- POV profile distinguishing knows/believes/suspects/reports.

Validation focus tags:

- `dialogue_expected`
- `introspection_expected`

Expected blockers:

- Same selected claim marked both true and false as current fact without belief framing.
- POV knows a fact and simultaneously does not know it.

Prompt-quality risk:

- False report becomes canon.
- Characters all speak from authorial truth instead of their own beliefs.

---

## Case 11 — Clock tick and obligation breach

Stress target: pressure record causes durable change without drama-manager logic.

Required records:

- CLOCK with current_pressure, tick_trigger, next_threshold, possible_effects.
- OBLIGATION with terms, owed_by, owed_to, consequence_if_broken.
- Current opportunity to tick/breach/fulfill.
- Consequence record if threshold already passed.

Validation focus tags:

- `clock_tick_possible`
- `obligation_breach_possible`

Expected blockers:

- Clock threshold already happened but clock remains active with no consequence.
- Obligation breach possible but terms/owed parties absent.

Prompt-quality risk:

- Clock ticks for excitement.
- Obligation treated as moral lecture rather than constraint.

---

## Case 12 — Large active cast salience stress

Stress target: long prompt with many onstage people.

Required records:

- Full active dossiers for all materially active characters.
- Durable voice anchors for likely speakers; current voice pressure pins are recommended local salience, not universal blockers.
- Relationship/status notes to prevent generic group speech.
- Present-minor compression for silent/backgrounded characters.

Validation focus tags:

- `dialogue_expected`
- `ensemble_dialogue_expected`
- `physical_interaction_expected` if blocking matters

Expected blockers:

- Material speaker selected only as background with no voice note.
- Active cast lacks core voice anchors.

Warnings:

- Prompt length.
- Lost-in-the-middle risk.
- Too many high-salience records for one local unit.
- Grouped salience warning when long dossiers may need local pins.

Expected readiness outcome:

- Missing optional current pins warn when durable anchors are sufficient.
- Missing durable voice anchors or material speaker authority still blocks.

Prompt-quality risk:

- All characters sound alike.
- The model overuses only the first or last dossier.
- Causal pressure buried under characterization.

---

## Case 13 — Low-drama literary scene where almost nothing happens

Stress target: prose quality without manufactured incident.

Required records:

- STORY CONTRACT and PROSE MODE with precise style/tone.
- CURRENT AUTHORITATIVE STATE with a small but specific pressure.
- At least one EMOTION, BELIEF, RELATIONSHIP, or OPEN THREAD that can color perception.
- STOP GUIDANCE that allows a tiny response point.
- Manual directive forbidding forced escalation.

Validation focus tags:

- `introspection_expected` if interiority matters
- `physical_interaction_expected` only if bodies/objects matter

Expected blockers:

- No current state or manual directive.
- Close POV introspection expected but no POV beliefs/suspicions/misreads.

Prompt-quality risk:

- Generic lyrical filler.
- Artificial interruption or melodrama.
- Abstract diagnosis replacing concrete observation.

---

## Case 14 — Dialogue-only voice distinction

Stress target: two or three speakers are physically static; the output must distinguish them by voice alone.

Required records:

- Active CAST MEMBER core dossiers with distinct rhythm, diction, tactics, taboos, and anti-repetition warnings.
- Current voice pressure pins for each likely speaker are optional local emphasis.
- Relationship/status pressure and turn-taking/silence behavior.
- Current knowledge boundaries for what each speaker can say.

Validation focus tags:

- `dialogue_expected`
- `ensemble_dialogue_expected` if three or more speakers

Expected blockers:

- A likely speaker has only a personality label and no voice anchor.
- Dialogue requires knowledge the speaker lacks.

Expected readiness outcome:

- Durable anchors satisfy readiness; current pins may warn but are optional.

Prompt-quality risk:

- Interchangeable voices.
- Catchphrase loops.
- Exposition-dialogue.

---

## Case 15 — Ensemble scene with subtle voice contrast

Stress target: many characters speak in the same social class/register but must remain distinguishable.

Required records:

- Voice anchors emphasizing micro-differences: sentence length, address habits, hedging, interruption, metaphor pool, politeness strategy, profanity intensity.
- Current voice pressure pins that do not merely repeat the durable anchor are recommended for salience.
- Relationship/status context among speakers.
- Physical/auditory state showing who can hear or interrupt whom.

Validation focus tags:

- `dialogue_expected`
- `ensemble_dialogue_expected`

Expected blockers:

- Missing durable/compressed voice authority for material speakers.
- Relationship/status pressure absent in a scene where speakers respond to each other.
- Missing audibility or turn-taking state when the ensemble exchange depends on it.

Warnings:

- Current pins repeat generic moods only.
- Long dossiers may need grouped salience warnings.

Prompt-quality risk:

- Everyone sounds like the same witty narrator.
- The loudest dossier dominates the whole scene.

---

## Case 16 — Sparse minimalist fiction

Stress target: strong continuity with minimal prose, low explanation, and high subtext.

Required records:

- PROSE MODE with sparse paragraphing and restrained interiority.
- Current state and physical continuity sufficient for short action.
- Voice anchors that work under compression.
- Manual directive that protects restraint.

Validation focus tags:

- `dialogue_expected` if speech occurs
- `ambiguous_perception_expected` if uncertainty matters

Expected blockers:

- Manual directive asks for minimalism while requiring exposition-heavy backstory delivery.
- POV knowledge profile absent in close sparse POV.

Prompt-quality risk:

- Stiff underwritten prose.
- Continuity omitted because prose is spare.
- Generic Hemingway imitation.

---

## Case 17 — Non-erotic mature fiction

Stress target: mature envelope for violence, grief, addiction, prejudice, trauma, or moral compromise without erotic content.

Required records:

- UNIVERSAL CONTENT POLICY distinguishing allowed mature scope from explicit sexual scope.
- Character-bias handling if prejudice or morally reprehensible perception appears.
- Consequence/EMOTION records for trauma/grief/addiction pressure.

Validation focus tags:

- `violence_or_injury_possible` if violence/injury may occur
- `introspection_expected` if interiority is central
- `secret_or_clue_pressure` if trauma/culpability is hidden

Expected blockers:

- Content envelope says non-erotic mature but manual directive demands explicit sex.
- Bias is compiled as objective fact rather than character-held perception.

Prompt-quality risk:

- Safety lecture tone.
- Sanitized or euphemistic mature material.
- Shock content detached from continuity.

---

## Case 18 — Nonhuman or institutional pressure source

Stress target: pressure from a school, hospital, employer, court, landlord, animal, weather system, machine, or supernatural force without turning it into a human mind.

Required records:

- ENTITY with non-person kind and operating description.
- LOCATION/OBJECT/AFFORDANCE records showing how the pressure reaches the scene.
- Current status/reach/authority relation.
- Limits on agency/interiority.

Validation focus tags:

- `nonhuman_or_institutional_pressure_expected`
- `institutional_involvement_possible` if an institution acts
- `physical_interaction_expected` if the pressure affects bodies/space

Expected blockers:

- Institution acts without route, jurisdiction, communication, or authority relation.
- Nonhuman force receives human interiority without story rules permitting it.

Prompt-quality risk:

- Institution becomes a person-shaped villain.
- Pressure is vague atmosphere rather than actionable constraint.

---

## Case 19 — Multi-POV project, single local POV lock

Stress target: project has multiple viewpoint characters, but this local unit must not switch POV.

Required records:

- PROSE MODE selecting one POV for the generation.
- POV knowledge profile for selected POV.
- Audience knowledge profile if audience knows material from other POVs.
- Non-POV active dossiers marked behavior-shaping only.

Validation focus tags:

- `introspection_expected`
- `secret_or_clue_pressure` if other-POV knowledge matters

Expected blockers:

- PROSE MODE says variable POV without selecting current POV.
- Non-POV interiority allowed in close first/third without omniscient mode.

Prompt-quality risk:

- Head-hopping.
- Audience knowledge leaks into POV certainty.
- Other POV dossiers vanish because direct interiority is forbidden.

---

## Case 20 — Present-minor speech

Stress target: a minor onstage character may speak one material line without becoming active/onstage full.

Required records:

- Present-minor compressed note with identity, physical state, allowed action, and enough voice note for one line.
- Current position/audibility.
- Knowledge constraints for what the minor can know.

Validation focus tags:

- `present_minor_speech_possible`
- `dialogue_expected`

Expected blockers:

- Present-minor cast member speaks materially with no voice note.
- Present-minor line reveals a secret they cannot know.

Prompt-quality risk:

- Generic NPC speech.
- A background character hijacks the local unit.

---

## Case 21 — Active silent cast with strong body/presence

Stress target: a character matters intensely but does not speak.

Required records:

- Active/onstage CAST MEMBER full dossier.
- `active_silent` local function.
- Body_presence_core, pressure behavior, current position/visibility.
- Current nonverbal_or_silence_pressure pin is recommended local emphasis.
- POV access limits.

Validation focus tags:

- `active_silent_presence_expected`
- `physical_interaction_expected` if blocking matters
- `ambiguous_perception_expected` if the POV may misread silence

Expected blockers:

- Silent active character lacks body presence, current position/visibility, or allowed-action authority when their silent presence materially affects prose.
- POV narrates the silent character’s thoughts directly in close mode.

Expected readiness outcome:

- Current silence pressure is recommended, not universal.

Prompt-quality risk:

- Silent character disappears.
- Silence becomes generic sadness, menace, or passivity.

---

## Case 22 — Non-omniscient narration with heavy audience knowledge

Stress target: the reader knows much more than the narrator; dramatic irony must not become POV knowledge.

Required records:

- POV knowledge profile.
- AUDIENCE KNOWLEDGE PROFILE with what the audience knows/does not know.
- SECRET records with holders, protected non-holders, allowed cues, forbidden reveals.
- Current visible cues that can carry irony.

Validation focus tags:

- `secret_or_clue_pressure`
- `introspection_expected`
- `ambiguous_perception_expected` if cues are unclear

Expected blockers:

- Audience-known hidden truth appears in `pov_knows`.
- Allowed clues absent but manual directive asks for dramatic irony.

Prompt-quality risk:

- Smug narrator leakage.
- Hidden truth overexplained to the reader.
- Non-POV behavior becomes opaque because interiority is forbidden.

---

## Case 23 — Ambiguous visibility and misperception

Stress target: the POV sees something partially, hears it badly, or must infer from incomplete physical cues.

Required records:

- Line of sight / visibility state.
- Environmental obstruction, distance, sound, lighting, crowd, or object occlusion.
- POV beliefs/suspicions/misreads.
- Audience/writer knowledge if different from POV.

Validation focus tags:

- `ambiguous_perception_expected`
- `physical_interaction_expected`
- `secret_or_clue_pressure` if the perception is clue-bearing

Expected blockers:

- Directive requires certain knowledge from ambiguous perception.
- Physical state does not say what can be seen/heard.

Prompt-quality risk:

- The model resolves ambiguity too early.
- The POV perceives impossible detail.

---

## Case 24 — Object use without transfer

Stress target: an object is used, shown, hidden, read, smelled, aimed, or activated without changing ownership.

Required records:

- OBJECT with owner/carried_by/current_location/visibility/affordances/constraints.
- Current body positions and access.
- Affordance for use without transfer.
- Consequence if use creates durable state.

Validation focus tags:

- `object_use_possible`
- `physical_interaction_expected`

Expected blockers:

- Character uses object they cannot access.
- Use implies transfer but OBJECT/current possessions remain unchanged.

Prompt-quality risk:

- Object ownership silently changes.
- Object becomes symbolic texture with no physical continuity.

---

## Case 25 — Location change under route/time constraints

Stress target: movement from one place to another must respect route, time, transport, exits, and arrival consequences.

Required records:

- Source location and destination/reachable route.
- Routes/exits and transport if relevant.
- Available time.
- Current positions and movement constraints.
- Consequence or current state update if arrival is durable.

Validation focus tags:

- `location_change_possible`
- `physical_interaction_expected`
- `clock_tick_possible` if timing pressure matters

Expected blockers:

- Destination exists but no route or time exists.
- Character changes location while captive/incapacitated/constrained with no means.

Prompt-quality risk:

- Teleportation.
- Travel time skipped despite local-prose-only rule.
- Arrival resolves too much downstream consequence.

---

## Case 26 — Stop-rule response point without over-continuation

Stress target: the external prose writer must stop at the first new response point instead of resolving the whole encounter.

Required records:

- Optional STOP GUIDANCE with concrete `soft_unit_guidance`, such as one approach, one refusal, one short exchange, one object offer, or one reveal-withheld, when the author wants extra narrowing.
- MANUAL DIRECTIVE that fits the same local unit.
- CURRENT AUTHORITATIVE STATE sufficient for the local action.
- At least one pressure source: INTENTION, OPEN THREAD, RELATIONSHIP, EMOTION, CLOCK, OBLIGATION, SECRET, AFFORDANCE, or immediate handoff pressure.

Validation focus tags:

- `first_segment` or `continuation_after_accepted_segment`
- Add `dialogue_expected`, `physical_interaction_expected`, `secret_or_clue_pressure`, `object_use_possible`, or other mode tags only when the local unit actually requires them.

Expected blockers:

- Stop guidance asks for a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points.
- Manual directive and stop guidance disagree about whether the prose should stop after the first response point or continue through later consequences.

Expected readiness outcome:

- Blank soft guidance still enforces the universal stop rule and does not block.

Prompt-quality risk:

- The model keeps writing after the first refusal/question/reveal-withheld.
- The model summarizes future consequences instead of stopping.
- The model treats the stop rule as a target length rather than a causal boundary.

---

## Case 27 — Draft save despite readiness blockers

Stress target: draft persistence separate from Preview/Generate readiness.

Required records:

- A structurally saveable Generation Brief draft with a blank manual directive or missing current-state floor.
- Existing project/story configuration sufficient to keep the draft form meaningful.

Validation focus tags:

- Any; this case tests persistence/readiness separation.

Expected blockers:

- `missing-manual-directive` or `missing-current-authoritative-state` blocks Preview/Generate.

Expected readiness outcome:

- Draft save succeeds.
- Prompt preview and Generate remain blocked until required readiness items are fixed.

Prompt-quality risk:

- Treating ordinary authoring incompleteness as a storage failure.

---

## Case 28 — Generation-context default mismatch prevention

Stress target: no false `focus-tag-count-invalid` when project state can normalize context.

Required records:

- Generation Brief draft with omitted or stale `generation_context`.
- Accepted segment count available from project state.

Validation focus tags:

- Normalization resolves exactly one context from accepted-segment count.

Expected blockers:

- None solely because the draft omitted `generation_context`.

Expected readiness outcome:

- No false `focus-tag-count-invalid` after normalization.
- The resolved context remains visible and editable.

Prompt-quality risk:

- UI-only defaults drift from server readiness and block valid prompt preview.

---

## Case 29 — Continuation default from accepted-segment count

Stress target: continuation readiness when accepted prose exists but prose text remains excluded.

Required records:

- At least one accepted segment in the archive.
- Generation context normalized to `continuation_after_accepted_segment`.
- User-authored immediate handoff.
- Current state updated for the continuation start.

Validation focus tags:

- `continuation_after_accepted_segment`

Expected blockers:

- Missing user-authored handoff.
- Accepted prose, rejected candidate text, superseded regeneration text, or automatic prose-derived summary in prompt-facing fields.

Expected readiness outcome:

- Continuation requires handoff but never includes accepted prose text.

Prompt-quality risk:

- Prose archive treated as canon or style context.

---

## Case 30 — Provider-only Generate block

Stress target: provider configuration is separate from story/compiler readiness.

Required records:

- Story/compiler readiness passes.
- OpenRouter provider configuration is missing.

Validation focus tags:

- Any local mode whose story readiness passes.

Expected blockers:

- `provider-configuration-missing` blocks Generate.

Expected readiness outcome:

- Prompt Preview remains available.
- Generate is disabled until provider settings are configured.

Prompt-quality risk:

- Confusing transport setup with story readiness.

---

## Case 31 — Deduplicated long-dossier warning

Stress target: grouped salience warnings for long active cast dossiers.

Required records:

- Several active/onstage CAST MEMBER dossiers with rich populated fields.
- Durable voice/body anchors present.
- Optional current voice pins missing or sparse.

Validation focus tags:

- `dialogue_expected` or `ensemble_dialogue_expected` if speech matters.

Expected blockers:

- None when durable voice/body authority is sufficient.

Warnings:

- One grouped `cast-salience-risk` or related salience warning, not repeated per-record blocker spam.

Expected readiness outcome:

- Preview/Generate remain available with advisory warning.

Prompt-quality risk:

- Long-context salience degradation if the user ignores optional local pins.

---

## Case 32 — Cross-segment salience duplicate calibration

Stress target: pressure summaries must preserve useful salience duplicates without copying inert archive text forward.

Required records:

- One high-salience BELIEF with populated behavioral effect.
- One ordinary low-salience setting FACT.
- One critical current-state FACT.
- One `immediate_previous` EVENT with high current relevance.
- One `relevant_backstory` EVENT with low current relevance.
- One SECRET with holders, protected non-holders, allowed cues, forbidden reveals, and locked or clue-only reveal permission.
- One VISIBLE AFFORDANCE that can drive action.
- One active/onstage cast member with a long full dossier and a current voice pressure pin.

Validation focus tags:

- `dialogue_expected`, `introspection_expected`, `secret_or_clue_pressure`, or another local mode that makes the selected pressure records relevant.

Expected blockers:

- None solely because ordinary FACT or backstory EVENT records are absent from active knowledge pressure.

Expected prompt behavior:

- BELIEF appears as behavior/interiority pressure in active knowledge pressure and as full metadata in belief details.
- Ordinary low-salience setting FACT does not appear in active knowledge pressure, but remains in detail facts.
- Critical/current FACT appears in active knowledge pressure and in detail or hard canon as applicable.
- Immediate/recent high-relevance EVENT appears in active knowledge pressure and event details.
- Low-relevance backstory does not appear in active knowledge pressure.
- SECRET lanes remain separate; only lane-specific text repeats.
- VISIBLE AFFORDANCE action text appears in active action pressure and detail/physical continuity, not material pressure.
- Voice pin remains before the full cast dossier.

Prompt-quality risk:

- Future token-budget cleanup could mistake deliberate pressure/detail dual framing for redundant restatement, or copy ordinary archive facts/events into the prompt front edge.
