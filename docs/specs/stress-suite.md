# Continuity Loom Prompt/Schema Stress Suite

Status: active audit — canonical stress cases for validation, compiler, prompt, and demo regression coverage
Authority: domain authority for validation stress cases (see docs/ACTIVE-DOCS.md)

---

## Purpose

Red Bunny is a strong first-person, two-character, secret/POV/physical-continuity stress prompt. It is not sufficient as the only stress case. This suite covers additional failure modes the template, schema, validation matrix, and compiler contract must survive.

Each case lists the stress target, required records or generation-time fields, suggested validation focus tags, expected blockers, and prompt-quality risks. These are conceptual stress cases, not implementation tests.

---

## Coverage matrix

This matrix exists to prevent drift. It does not replace the cases; it shows whether the suite still covers the major prompt/schema/compiler risks. A new stress case must land with updates to this matrix and `docs/specs/stress-coverage-matrix.md` in the same revision.

| Risk / validation surface | Primary cases | Coverage note |
|---|---|---|
| No accepted prose in prompts / continuation handoff | 8, 29 | Handoff must be user-authored and represented in records/current state; accepted prose remains excluded even when accepted segments trigger continuation defaults. |
| First segment empty-state correctness | 7, 28 | First segment must be self-sufficient without accepted prose; generation context defaults must normalize from project state without UI-only drift. |
| Draftability and readiness separation | 27, 28, 29, 30, 31 | Draft save, Preview, Generate, provider configuration, and warning-only states remain separate readiness surfaces. |
| Local-prose-only stop boundary | 13, 26 | The universal stop rule must define a response point; optional stop guidance may narrow it but is not required. |
| Dialogue voice distinction | 1, 12, 14, 15, 20, 31 | Covers two-speaker, ensemble, present-minor, large-cast voice risks, and deduplicated optional voice-pin warnings. |
| Active silent cast / body presence | 21 | Prevents silent active characters from disappearing. |
| POV/audience/secrets separation | 1, 6, 9, 19, 22, 23, 40 | Covers hidden truths, non-POV behavior shaping, multi-POV projects, ambiguous perception, and multi-secret reveal-lane correlation. |
| Physical continuity | 2, 3, 4, 5, 21, 23, 24, 25 | Covers routes, exits, line of sight, body positions, time, objects, and force/consent. |
| Object use and transfer | 3, 24 | Separates use from holder change. |
| Offstage / institutional / nonhuman pressure | 4, 18 | Requires route, reach, authority, communication, or operating mechanism. |
| Mature fiction envelope | 5, 17 | Covers erotic and non-erotic mature material with provider-policy priority. |
| Clocks, obligations, consequences | 11, 25 | Requires current opportunity and visible cause for ticks/breaches. |
| Low-drama / minimalist prose quality | 13, 16 | Guards against generic filler and manufactured incident without fake validators. |
| Large-context salience / cast dossier bloat | 12, 15, 31, 32 | Warnings, voice pins, and core-first dossier order must preserve salience without compression or repeated warning spam. |
| False reports and belief truth relations | 10 | Prevents testimony from becoming canon. |
| Record hygiene assistance | RH-01-RH-25 | Covers complete-source compilation, explicit scope disclosure, parser quarantine, citation discipline, no-write UI, OpenRouter disclosure, and stress cases for duplicate/overlap/stale-shadow review. |
| Segment reconciliation assistance | SR-01-SR-12 | Covers latest-segment-only evidence, prompt-injection escaping, oversize/no-eviction failures, empty scope, secret reveal, object transfer, movement/visibility updates, pressure-record lifecycle changes, new-record dependencies, parser quarantine, echo guard, and stale-fingerprint rejection. |

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
- A current cast voice pressure row for the same cast member when the line needs local dialogue, POV-narration, nonverbal, or avoidance guidance; this guidance must be visible in the compiled present-minor cast section.
- Current position/audibility.
- Knowledge constraints for what the minor can know.

Validation focus tags:

- `present_minor_speech_possible`
- `dialogue_expected`

Expected blockers:

- Present-minor cast member speaks materially with no voice note.
- Present-minor line reveals a secret they cannot know.
- Present-minor speech relies on a removed role field instead of selected cast-band membership plus structured voice-pressure destinations.

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

## Case 28 — Generation-context coherence at the first-segment boundary

Stress target: missing, matching, and contradictory saved context when accepted-segment count is zero, including the inverse mismatch after final accepted-segment deletion.

Required records:

- Generation Brief drafts with omitted, matching `first_segment`, and contradictory `continuation_after_accepted_segment` values.
- Zero accepted segments, including a project that has just deleted its final accepted segment.

Validation focus tags:

- Ready-input normalization resolves `first_segment` from count while storage preserves any contradictory saved value.

Expected blockers:

- None solely because the draft omitted `generation_context`.
- `generation-context-accepted-segment-mismatch` when a saved continuation context remains after final deletion.

Expected readiness outcome:

- No false `focus-tag-count-invalid` after normalization.
- Generation Brief shows saved value, required value, count, and status; draft Save remains available.
- Preview, user-supplied candidate intake, Generate, and provider transport remain blocked on contradiction.
- Choosing `first_segment` and explicitly saving clears the blocker on reload and permits a fresh compile.

Prompt-quality risk:

- Automatic deletion repair mutates the author-owned draft, or stale prompt/candidate controls remain available after the boundary change.

---

## Case 29 — Generation-context coherence at the continuation boundary

Stress target: first acceptance creates an actionable mismatch, while additional acceptance and non-final deletion preserve coherent continuation state and accepted prose remains excluded.

Required records:

- A saved `first_segment` context followed by first acceptance.
- A saved `continuation_after_accepted_segment` context with one or many accepted segments.
- User-authored immediate handoff.
- Current state updated for the continuation start.

Validation focus tags:

- `continuation_after_accepted_segment`

Expected blockers:

- `generation-context-accepted-segment-mismatch` after first acceptance until explicit selector Save.
- Missing user-authored handoff is evaluated against the required continuation context even while the mismatch exists.
- Accepted prose, rejected candidate text, superseded regeneration text, or automatic prose-derived summary in prompt-facing fields.

Expected readiness outcome:

- The saved draft is byte-for-byte unchanged by first/additional acceptance and non-final deletion.
- First acceptance blocks Preview, user-supplied candidate intake, Generate, and provider transport; choosing continuation and explicitly saving clears the mismatch on reload.
- Additional acceptance and non-final deletion remain coherent without another repair.
- Continuation requires handoff but never includes accepted prose text; only accepted-segment count crosses the boundary.

Prompt-quality risk:

- Prose archive treated as canon or style context, automatic context mutation, or reuse of a prompt inspected before acceptance.

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

---

## Case 33 — Generation-brief reference drift

Stress target: generation-brief id lanes must not silently degrade to raw ids.

Required records:

- Current authoritative state names onstage, offstage, entity-status, and current-location ids.
- Some ids are dangling, mistyped, or present in the project but not selected.

Validation focus tags:

- `offstage_interruption_possible` or a current-status mode when required-lane blocking is expected.

Expected blockers:

- `onstage-entity-reference-invalid`
- `offstage-entity-reference-invalid`
- `entity-statuses-reference-invalid`
- `current-location-reference-invalid`

Warnings:

- `offstage-entity-reference-unselected-optional` when offstage pressure is optional.
- `entity-statuses-reference-unselected-optional` when current agency/status is optional.

Expected readiness outcome:

- Required brief lanes block Preview/Generate.
- Optional unselected references warn without blocking.

Prompt-quality risk:

- Prompt lanes render raw UUIDs or omit context that the author believed was active.

---

## Case 34 — Cast-band and local voice reference integrity

Stress target: working-set cast bands, selected POV, and voice-pressure attachments must resolve to the intended selected records.

Required records:

- Active/onstage, present-minor, and offstage cast-band assignments.
- Selected POV and current voice pressure rows.
- One missing or mistyped cast id, one duplicate band membership, and one existing cast id outside rendered bands.

Validation focus tags:

- `dialogue_expected` or `ensemble_dialogue_expected`.

Expected blockers:

- `cast-band-duplicate-membership`
- `cast-band-reference-invalid`
- `selected-pov-reference-invalid`
- `voice-pressure-attachment-invalid`

Warnings:

- `voice-pressure-orphaned-attachment`

Expected readiness outcome:

- Broken cast/POV/attachment ids block.
- Existing but non-rendered voice-pressure attachments warn.

Prompt-quality risk:

- Dialogue or POV authority points at the wrong person, a missing cast member, or a voice pin that cannot be rendered.

---

## Case 35 — Record-internal reference integrity

Stress target: selected durable records must not contain dangling, mistyped, or required-but-unselected references.

Required records:

- BELIEF, SECRET, OBJECT, RELATIONSHIP, and PLAN records with reference fields.
- CAST MEMBER records in active/onstage-full, present-minor, and offstage-relevant bands, each linked through `entity_id` to an ENTITY target.
- One dangling holder, one current-location type mismatch, one hidden secret holder that is present but unselected, and one optional relationship endpoint that is unselected.
- For each CAST MEMBER band, exercise dangling, wrong-kind, and existing-but-unselected `entity_id` targets. Then verify both recovery paths in every band: select the existing ENTITY target, and correct `entity_id` to an already selected ENTITY.

Validation focus tags:

- `non_pov_hidden_plan_behavior` when testing hidden-plan requiredness.

Expected blockers:

- `record-reference-dangling`
- `record-reference-type-mismatch`
- `record-reference-unselected-required`

Warnings:

- `record-reference-unselected-optional`

Expected readiness outcome:

- Required unresolved internal references block; optional unselected internal references warn.
- Every invalid CAST MEMBER `entity_id` path blocks Preview and Generate with `record-reference-unselected-required` for an existing-but-unselected ENTITY, while selection or correction restores ordinary readiness without changing any other reference role's posture.

Prompt-quality risk:

- Compiler-resolved labels fall back to UUIDs or omit important selected-record context. CAST MEMBER `entity_id` is the deliberate exception: its target must be selected and its raw id never reaches the prompt.

---

## Case 36 — Migration-selected record now fails closed

Stress target: old projects with previously tolerated unselected required references should fail closed with a legible blocker.

Required records:

- A selected active SECRET from an existing project.
- Its holder or protected non-holder id exists in the project but is no longer selected into the active working set.

Validation focus tags:

- Any secret or reveal-pressure context.

Expected blockers:

- `record-reference-unselected-required`

Expected readiness outcome:

- Preview/Generate block until the user selects the referenced record or revises the secret lane.

Prompt-quality risk:

- A migration silently compiles without the holder/protected-non-holder authority the author expected.

---

## Case 37 — Onstage state contradiction

Stress target: current authoritative state and selected entity-status records must agree about whether an entity is physically present.

Required records:

- Current authoritative state with an entity in `onstage_entities`.
- The same entity also appears in `offstage_pressuring_entities`, or a selected ENTITY STATUS places it `offstage`, `concealed`, or at a different record-id location.

Validation focus tags:

- Any local mode with physical or dialogue presence.

Expected blockers:

- `onstage-offstage-entity-overlap`
- `onstage-entity-status-contradiction`

Expected readiness outcome:

- Preview/Generate block until the current state and entity status agree.

Prompt-quality risk:

- The prompt asks the writer to render an entity as both present and absent.

---

## Case 38 — Object holder/location incoherence

Stress target: object location and holder state must agree before object use or transfer.

Required records:

- A selected OBJECT with `current_location: carried_by_holder`.
- The same OBJECT has `carried_by: none`.

Validation focus tags:

- `object_transfer_possible` or `object_use_possible`.

Expected blockers:

- `object-location-holder-incoherence`

Expected readiness outcome:

- Preview/Generate block until object location or holder state is corrected.

Prompt-quality risk:

- The prompt instructs a physical action around an object whose holder/location state is impossible.

---

## Case 39 — Relationship self-reference

Stress target: relationship endpoints must be distinct while still allowing bad saved records to load.

Required records:

- A selected RELATIONSHIP with `from` and `to` pointing to the same entity id.

Validation focus tags:

- Dialogue, intimacy, obligation, or other relationship-pressure context.

Expected blockers:

- `relationship-self-reference`

Expected readiness outcome:

- The record loads, validation blocks, and the user can revise the relationship endpoints.

Prompt-quality risk:

- Relationship pressure becomes ambiguous or nonsensical because the source and target are the same.

---

## Case 40 — Multi-secret reveal-constraint correlation

Stress target: two or more active secrets in `<secrets_and_reveal_constraints>` where holders, protected non-holders, allowed clues, forbidden reveals, and reveal permission must remain attributable to the correct hidden truth even when one lane omits a value for one secret.

Required records:

- At least two active SECRET records with distinct `secret_claim`, `secret_kind`, holders, protected non-holders, forbidden reveals, and reveal permission.
- At least one selected inactive SECRET record when testing non-contiguous SECRET ordinals.
- One active secret with an omitted optional cue lane, such as no `allowed_surface_cues` and no available clue carrier.
- Current POV/audience knowledge records or fields sufficient to keep hidden-truth access explicit.

Validation focus tags:

- `secret_or_clue_pressure`
- `introspection_expected` if close POV could leak a hidden truth.

Expected blockers:

- Active secret lacks holders, protected non-holders, or reveal permission.
- POV knowledge profile grants a hidden secret while the secret says protected.
- Any selected secret references required holder/non-holder records that are not selected.

Prompt-quality risk:

- The writer correlates holders, non-holders, clues, forbidden reveals, or permission by list position rather than by `Secret N`.
- A missing clue lane shifts later bullets and attaches one secret's reveal constraints to another secret.
- Ideation citation keys and prose `Secret N` labels diverge.

---

## Record Hygiene Assistance Stress Cases

These cases are conceptual review cases for the Record Hygiene assistance surface. They are not validation gates and do not add diagnostic codes.

### RH-01 — Exact duplicate active facts

Stress target: two active FACT records have the same statement with different display labels.

Expected hygiene review: exact duplicate relation with a manual consolidation recommendation.

Proof surface: compiler golden includes both records; parser requires two valid citations; UI renders advisory scratch only.

### RH-02 — Near duplicate facts with material scope difference

Stress target: two FACT records share a core claim but differ by `scope`, salience, or audience visibility.

Expected hygiene review: near duplicate or legitimate near match, with material differences called out.

Proof surface: prompt includes both payloads and action labels distinguish `KEEP_DISTINCT` from edit recommendations.

### RH-03 — Belief restates a fact as held knowledge

Stress target: BELIEF claim overlaps an active FACT but remains character-held perspective.

Expected hygiene review: cross-type restatement or legitimate near match, never an automatic merge.

Proof surface: parser rejects cross-type `MERGE`; UI provides no apply control.

### RH-04 — False report versus canon fact

Stress target: BELIEF or EVENT testimony contradicts a FACT while truth relation marks it false or uncertain.

Expected hygiene review: conflict or uncertain relation with human review recommendation.

Proof surface: findings remain non-validation scratch and do not affect readiness.

### RH-05 — Stale active event shadow

Stress target: EVENT current relevance is still active but newer records supersede its stated pressure.

Expected hygiene review: stale shadow relation with deactivate or reword recommendation.

Proof surface: source predicate includes active events and excludes terminal events.

### RH-06 — Complementary fragments split across records

Stress target: two records are not duplicates but each carries half of one durable state.

Expected hygiene review: complementary fragment relation and manual merge or make-specific recommendation.

Proof surface: parser requires a cited survivor for merge/remove actions and quarantines malformed survivor claims.

### RH-07 — Broad and narrow plan overlap

Stress target: one PLAN states a broad objective while another active PLAN states a specific step.

Expected hygiene review: broad-narrow relation, usually keep distinct or make specific.

Proof surface: prompt preserves type order and full labels so the distinction is visible.

### RH-08 — Active plan and intention duplicate motive

Stress target: INTENTION and PLAN repeat the same objective without enough operational difference.

Expected hygiene review: cross-type restatement or partial overlap with no cross-type merge.

Proof surface: parser rejects cross-type merge/remove and UI links citations to records.

### RH-09 — Clock and obligation duplicate deadline pressure

Stress target: CLOCK threshold and OBLIGATION terms both encode the same impending deadline.

Expected hygiene review: partial overlap with manual recommendation to clarify separate functions.

Proof surface: complete-source compilation includes both active pressure records.

### RH-10 — Consequence restates resolved event

Stress target: CONSEQUENCE remains active while its triggering EVENT is resolved or terminal.

Expected hygiene review: stale shadow or broad-narrow relation with reference caution.

Proof surface: hygiene-active predicate excludes terminal source records and includes active consequence records.

### RH-11 — Open thread duplicates obligation

Stress target: OPEN THREAD question and OBLIGATION terms both track the same unresolved promise.

Expected hygiene review: partial overlap or complementary fragment with manual clarification.

Proof surface: counts by type and citations make both record kinds inspectable.

### RH-12 — Location and affordance overlap

Stress target: LOCATION hazards/rules and VISIBLE AFFORDANCE availability repeat the same physical constraint.

Expected hygiene review: cross-type restatement with keep-distinct caution if they serve different prompt lanes.

Proof surface: prompt includes active LOCATION and VISIBLE AFFORDANCE records without ENTITY/CAST payloads.

### RH-13 — Object state and fact duplicate ownership

Stress target: OBJECT holder/owner and FACT statement both assert the same possession state.

Expected hygiene review: cross-type restatement with recommendation to keep the structured OBJECT field authoritative.

Proof surface: UI provides navigation only; durable edits remain manual.

### RH-14 — Secret and belief reveal-boundary overlap

Stress target: SECRET hidden truth and BELIEF held by a non-holder contain overlapping wording.

Expected hygiene review: conflict or legitimate near match depending on holder/protection state.

Proof surface: OpenRouter send disclosure covers hidden SECRET payload leaving the machine only on explicit analyze.

### RH-15 — Relationship and emotion duplicate affect

Stress target: RELATIONSHIP pressure and EMOTION state repeat the same interpersonal tension.

Expected hygiene review: complementary fragment or partial overlap, not a delete recommendation by default.

Proof surface: high-stakes actions carry non-color-only labels and no mutation controls.

### RH-16 — Active record outside working set

Stress target: duplicate candidates exist outside the active working set.

Expected hygiene review: both records appear because Record Hygiene is whole-project, not selected-record scoped.

Proof surface: server builder uses `listRecords({ includeArchived: false })`; page source disclosure states complete active review.

### RH-17 — Archived duplicate excluded

Stress target: an archived record duplicates an active record.

Expected hygiene review: archived duplicate does not enter the prompt.

Proof surface: source predicate and user-facing source disclosure name archived records as excluded.

### RH-18 — Malformed record row

Stress target: one stored row cannot parse into a supported record payload.

Expected hygiene review: route fails closed with malformed hygiene source rather than silently skipping it.

Proof surface: server snapshot-builder tests and route error path.

### RH-19 — Malformed model output

Stress target: OpenRouter returns prose, JSON, unknown citations, missing end marker, or invalid action fields.

Expected hygiene review: raw output is quarantined as non-canonical scratch.

Proof surface: parser tests and UI malformed-output test.

### RH-20 — Oversized project review

Stress target: full active review exceeds known selected model context length.

Expected hygiene review: prompt-too-large response with no record eviction and no retry with fewer records.

Proof surface: route test covers no-eviction fail-fast behavior.

### RH-21 — Working-set scope disclosure

Stress target: active-working-set review must be explicit and inspectable.

Expected hygiene review: the compiled prompt and UI disclose `active_working_set` scope, while whole-project remains the default.

Proof surface: core hygiene golden and Record Hygiene view tests assert request mode, `hygiene_scope`, and UI scope copy for both modes.

### RH-22 — Working-set predicate completeness

Stress target: every selected hygiene-active record must render completely within working-set scope.

Expected hygiene review: selected records satisfying the archive and per-type status predicate appear in deterministic order with full payload, projected status, citation key, and references.

Proof surface: server snapshot-builder and route tests cover selected in-scope inclusion, fixed output order, and route/compiler composition.

### RH-23 — Empty working-set scope

Stress target: the user selects working-set scope when the active working set is empty or has no hygiene-active records.

Expected hygiene review: the prompt remains inspectable with the truthful empty-source state, and the UI shows a distinct "nothing in your current scope" message.

Proof surface: core hygiene golden covers empty working-set prompt rendering; Record Hygiene view tests cover the distinct empty-scope UI message and unchanged send enablement.

### RH-24 — Selected archived or terminal record excluded

Stress target: active-working-set scope must not override archive or per-type terminal-status predicates.

Expected hygiene review: a selected archived or terminal record is excluded by the normal predicate, while selected hygiene-active records remain included.

Proof surface: server snapshot-builder tests cover selected archived/terminal exclusion.

### RH-25 — Whole-project scope unchanged

Stress target: adding a working-set option must not weaken the original whole-project review.

Expected hygiene review: whole-project mode includes all non-archived hygiene-active atomic records even when records are absent from the active working set.

Proof surface: server snapshot-builder tests prove whole-project mode ignores working-set membership; Record Hygiene view tests and browser smoke keep default whole-project disclosure visible.

## Segment Reconciliation Assistance Stress Cases

These cases are conceptual review cases for the Segment Reconciliation assistance surface. They are not validation gates and do not add diagnostic codes.

### SR-01 — Long injection segment

Stress target: the latest accepted segment contains XML-like prompt tags, imperative prompt-injection text, and long paragraphs.

Expected reconciliation review: the complete segment renders as escaped evidence spans, never as prompt instructions or headings.

Proof surface: segment-reconciliation golden prompt covers escaped accepted evidence and single output-format section.

### SR-02 — Near-context-limit segment

Stress target: one latest accepted segment nearly fills the selected model context window.

Expected reconciliation review: compile remains deterministic if it fits; analyze fails before transport if the prompt plus output budget exceeds context.

Proof surface: route prompt-too-large tests cover fail-fast behavior without compression, middle-out, span eviction, or retry.

### SR-03 — Oversize whole project

Stress target: whole-project record scope exceeds model context when combined with the latest accepted segment and schema catalog.

Expected reconciliation review: `segment-reconciliation-prompt-too-large` blocks send with no record ranking, summarization, batching, or fallback scope.

Proof surface: server route tests assert no transport call on oversize.

### SR-04 — No selected records

Stress target: active-working-set scope is selected while no records are selected.

Expected reconciliation review: the prompt remains inspectable with the accepted segment, nineteen brief fields, an empty record scope, and no silent whole-project substitution.

Proof surface: core golden and route compile tests cover truthful empty record rendering.

### SR-05 — Secret reveal

Stress target: accepted prose reveals a hidden SECRET or changes a holder/non-holder boundary.

Expected reconciliation review: advisory proposals cite segment spans and contrast keys, warn through UI disclosure that SECRET records may leave the machine, and never auto-edit records.

Proof surface: web view tests cover secret-source disclosure and suggestion-only controls.

### SR-06 — Object transfer

Stress target: the segment moves an OBJECT from one holder/location to another.

Expected reconciliation review: proposals may suggest brief possession text or OBJECT patch review, with segment evidence and existing-record contrast.

Proof surface: parser and UI card tests cover JSON patch proposals with copy/navigation/keeper controls only.

### SR-07 — Entrance, exit, and line-of-sight change

Stress target: characters enter or leave the scene and visibility changes.

Expected reconciliation review: proposals may target current-state onstage entities, positions, line of sight, and routes as whole-field brief deltas.

Proof surface: parser field-path allowlist tests and web grouped-card rendering cover brief proposals.

### SR-08 — PLAN, CLOCK, OBLIGATION, and CONSEQUENCE transitions

Stress target: one segment fulfills a plan step, ticks a clock, transfers an obligation, and activates a consequence.

Expected reconciliation review: existing-record lifecycle and patch proposals remain advisory and must cite the accepted segment plus current record contrast.

Proof surface: parser lifecycle-destination validation and route typed-output tests cover record-change proposals.

### SR-09 — New ENTITY plus CAST MEMBER dependency

Stress target: the segment introduces a new person who needs both ENTITY and CAST MEMBER records.

Expected reconciliation review: creation proposals use `NEW-###` dependencies and no repository ids; the user opens blank typed editors manually if useful.

Proof surface: parser creation-dependency tests and web card tests cover new-record suggestions without apply/create controls.

### SR-10 — Invented enum response

Stress target: the model returns a lifecycle or payload enum value that the registry does not define.

Expected reconciliation review: the full response is quarantined as malformed; no partial salvage occurs.

Proof surface: parser `invalid-enum` tests cover registry-derived enum enforcement.

### SR-11 — Accepted-handoff quote response

Stress target: the model copies a long accepted-prose phrase into a proposed handoff, record value, label, or rationale.

Expected reconciliation review: the verbatim-echo firewall marks the whole response malformed.

Proof surface: parser echo-guard tests cover accepted-prose substring/token-run rejection.

### SR-12 — Post-inspection new acceptance

Stress target: a user inspects a prompt, accepts another segment, then sends the old analysis request.

Expected reconciliation review: analyze rebuilds the source, detects fingerprint drift, and returns `reconciliation-source-changed` without provider transport.

Proof surface: route and web stale-prompt tests cover 409 handling and prompt refresh requirements.
