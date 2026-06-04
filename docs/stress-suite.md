# Continuity Loom Prompt/Schema Stress Suite

Status: conceptual prompt/schema-facing stress suite  
Scope: not implementation tests, not tickets, not UI design

---

## Purpose

Red Bunny is a strong first-person, two-character, secret/POV/physical-continuity stress prompt. It is not sufficient as the only stress case. This suite covers additional failure modes the template, schema, validation matrix, and compiler contract must survive.

Each case lists the stress target, required records or generation-time fields, suggested validation focus tags, expected blockers, and prompt-quality risks.

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
- `secret_or_clue_pressure`
- `physical_interaction_expected` if blocking matters

Expected blockers:

- Any active speaker lacks core voice anchor.
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
- Flattened consent state.
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
- PROSE MODE.
- CURRENT AUTHORITATIVE STATE.
- IMMEDIATE HANDOFF with no accepted prose.
- MANUAL DIRECTIVE.
- STOP GUIDANCE.
- At least one active CAST MEMBER core dossier if a person-like character is onstage.

Validation focus tags:

- `first_segment`
- other tags only if the directive actually expects them

Expected blockers:

- Missing current state.
- Missing manual directive.
- Missing stop guidance.
- Active speaker lacks core voice anchor.

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

- Verbatim accepted prose in handoff.
- Automatic prose-derived summary.
- Handoff says object changed hands but OBJECT/current possessions still disagree.

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
- Current voice pressure pins for each likely speaker.
- Relationship/status notes to prevent generic group speech.
- Present-minor compression for silent/backgrounded characters.

Validation focus tags:

- `dialogue_expected`
- `physical_interaction_expected` if blocking matters

Expected blockers:

- Material speaker selected only as background with no voice note.
- Active cast lacks core voice anchors.

Warnings:

- Prompt length.
- Lost-in-the-middle risk.
- Too many high-salience records for one local unit.

Prompt-quality risk:

- All characters sound alike.
- The model overuses only the first or last dossier.
- Causal pressure buried under characterization.
