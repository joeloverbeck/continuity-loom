# Cast Member draft prompt template

Status: active reference — complete static prompt copied from the Cast Member editor for external dossier drafting
Authority: domain authority for the Cast Member draft prompt template (see `docs/ACTIVE-DOCS.md`)
Template version: `1.0.0`

## Purpose and boundary

This document owns the exact prompt text that the app copies from the Cast Member editor. The text between the template markers is implemented verbatim in `@loom/core` as a deterministic, independently versioned static template.

The template contains no project record, story configuration, user data, accepted prose, candidate prose, or hidden application state. Copying it is a local clipboard action. The user supplies their character dossier and interacts with an external LLM outside Continuity Loom. Returned material is review-only assistance: importing it may prefill an unsaved Cast Member draft, but it cannot create or update a record until the user explicitly saves.

## Copyable template

<!-- CAST_MEMBER_DRAFT_PROMPT_START -->
````text
# Cast Member draft prompt

Template version: 1.0.0

## Role

Draft a complete Continuity Loom CAST MEMBER dossier from the character dossier the user provides with this prompt. Write operational character guidance that helps a future prose writer preserve this person's identity, voice, embodied presence, pressure responses, perception, and agency without flattening them into generic dialogue or psychology.

Your response is non-canonical review material. The author remains the sole continuity authority. Do not write story prose, choose a linked entity, update a record, or claim that any invention is established story fact.

## Input and privacy boundary

- Use the character dossier supplied by the user as evidence for established facts and traits.
- This static prompt contains no Continuity Loom project records, story configuration, user data, accepted prose, or hidden application state.
- Do not ask for or infer Continuity Loom record ids. The author selects the linked ENTITY inside the app.
- Keep hard facts, public presentation, private pressure, character belief, and authorial interpretation distinct.
- Do not invent future plot, secret reveals, relationship changes, current locations, current object state, or other continuity changes.

## Extraction and invention rules

- Fill every field shown in the JSON shape below. Do not omit a field merely because the dossier is silent.
- When the dossier supplies evidence, preserve it faithfully and turn it into concise operational guidance rather than biography.
- When the dossier cannot fill a field, invent character-fitting material that follows the established character and makes them more specific and memorable. Treat those inventions as proposals, not facts.
- List every field you substantially invented in invented_fields, using the exact dotted field path from the field reference below. Use sample_utterances for the sample list as a whole.
- List ambiguities, contradictions, risky inferences, and facts that need the author in uncertainties. Do not hide uncertainty by smoothing it away.
- Prefer concrete behavior, language, perception, and choice under pressure. Avoid generic labels, diagnoses, moral summaries, and genre defaults.
- Use "none / not distinctive" only when an absence is itself a useful characterization choice. Do not use an empty string, null, or an omitted key.
- For prose-list fields, provide short non-overlapping strings. For sample utterances, provide one to three short one-line examples, normally 40 words or fewer each.
- Default each sample utterance copy_policy to never_copy_verbatim unless the dossier explicitly establishes a canonical phrase.

## Field reference

### Required core

- entity_id — the author-controlled link to an existing ENTITY; never draft or emit this field, because the app preserves the author's selection.
- identity.one_line — a compact identity sentence naming who this person is in story terms.
- identity.public_face — how the person presents or is legibly seen by others.
- identity.private_pressure — the private need, wound, fear, hunger, shame, or tension pressing on them.
- voice_anchor.core_voice — the irreducible description of how this person sounds or narrates.
- voice_anchor.rhythm_and_syntax — sentence shape, pace, fragmentation, formality, directness, looping, and interruption habits.
- voice_anchor.register_and_diction — social register, education-coded diction, slang, plainness, technicality, lyricism, bluntness, or polish.
- voice_anchor.vocabulary_and_metaphor_pools — recurring domains of language, images, references, and metaphor they naturally reach for.
- voice_anchor.profanity_and_intensity — how they swear, escalate, soften, hedge, or become intense.
- voice_anchor.taboo_and_avoidance_patterns — words, topics, emotions, admissions, or vulnerabilities they avoid.
- voice_anchor.dialogue_tactics_and_speech_functions — what their speech tends to do, such as deflect, bargain, test, charm, dominate, appease, confess, threaten, or perform.
- voice_anchor.address_terms_and_naming — how they use or avoid names, titles, nicknames, insults, honorifics, and relationship terms.
- voice_anchor.silence_interruption_and_turntaking — how they pause, withhold, interrupt, yield, refuse to answer, or fill silence.
- voice_anchor.under_pressure_voice — how their voice changes when scared, cornered, tempted, angry, ashamed, aroused, grieving, or forced to choose.
- voice_anchor.suppression_or_evasion_rule — what they hide, how they hide it, and what leaks despite them.
- voice_anchor.must_preserve — non-negotiable voice or behavior traits a prose writer must retain.
- voice_anchor.must_avoid — specific false voice moves or behavior renderings a prose writer must avoid.
- voice_anchor.anti_repetition_warnings — phrases, gestures, beats, labels, or tics that must not become a repetitive crutch.
- pressure_behavior_core.cornered — what they do when trapped socially, physically, emotionally, legally, or morally.
- pressure_behavior_core.tempted_or_offered_power — how they react when given leverage, permission, advantage, escape, money, status, desire, or control.
- pressure_behavior_core.protecting_attachment — how they act while protecting a person, object, self-image, duty, secret, place, or bond.
- body_presence_core.physicality — story-relevant body, movement, energy, posture, strength, fragility, age, stamina, and physical style.
- body_presence_core.habitual_gestures_or_presence — distinctive gesture, stillness, eye contact, fidgeting, spatial habit, or atmosphere.
- body_presence_core.social_presentation — clothing stance, grooming, and performance of class, status, gender, profession, intimidation, approachability, or concealment.
- agency_core.default_strategy — their usual way of pursuing goals or avoiding harm.
- agency_core.risk_style — their relationship to danger, uncertainty, exposure, escalation, delay, and commitment.

### Optional extended fields that must still be drafted

- world_pressure_core.world_produced_wound — the social, historical, familial, institutional, economic, political, supernatural, or environmental pressure that shaped them.
- world_pressure_core.active_appetite — what they actively want more of now, such as safety, status, recognition, revenge, proof, control, belonging, or quiet.
- world_pressure_core.self_mythology — the story they tell themselves about who they are or what they deserve.
- world_pressure_core.irreconcilable_contradiction — a durable contradiction that cannot be flattened without losing the character.
- relational_charge — their general relational electricity around closeness, distance, power, rivalry, dependency, attraction, disgust, loyalty, and shame.
- moral_psychological_edge — dangerous traits, compromises, compulsions, rationalizations, or limits without narrator endorsement.
- voice_extended.intimacy — how they sound when close, tender, exposed, erotic, trusting, needy, or emotionally bare.
- voice_extended.anger — how anger changes speech, silence, diction, volume, precision, cruelty, or self-control.
- voice_extended.lying — how they lie, omit, redirect, over-explain, perform truthfulness, or leak tells.
- voice_extended.register_switching — how their voice changes across audience, class context, profession, authority, danger, intimacy, or performance.
- voice_extended.humor_or_irony_style — their characteristic wit, mockery, deadpan, charm, self-deprecation, bitterness, or refusal to joke.
- voice_extended.idiom_or_sociolect_notes — dialect, regional terms, class markers, multilingual habits, occupational language, and sociolect constraints without caricature.
- voice_extended.anti_generic_warnings — additional warnings against ways a prose writer might flatten this person.
- body_and_presence_extended.body_limits — injury, disability, illness, fatigue, sensory limits, strength limits, age constraints, medication, or endurance boundaries.
- body_and_presence_extended.clothing_presentation — durable clothing style or presentation logic rather than a current outfit.
- body_and_presence_extended.sensory_or_appearance_signatures — smell, sound, texture, visual detail, aura, scar, grooming, or other meaningful sensory cue.
- perception_and_embodiment.notices — what they reliably notice first.
- perception_and_embodiment.misses — what they overlook, dismiss, cannot read, or habitually ignore.
- perception_and_embodiment.misreads — what they tend to interpret wrongly and why.
- perception_and_embodiment.sensory_bias — their dominant sensory channel or embodied attention pattern.
- pressure_behavior_extended.humiliated — how humiliation changes behavior, speech, posture, retaliation, withdrawal, or need.
- pressure_behavior_extended.offered_power — their more specific appetite, suspicion, refusal, intoxication, or restraint when power is offered.
- pressure_behavior_extended.refused_power — how they react when denied power, leverage, access, desire, or recognition.
- agency_and_planning_extended.fallback_style — what they do when the first plan fails.
- agency_and_planning_extended.planning_blind_spots — what their plans systematically fail to account for.
- sample_utterances[].text — one short representative line of speech, normally no more than 40 words.
- sample_utterances[].situation — the pressure or context in which the line would be spoken.
- sample_utterances[].speech_function — exactly one of refusal, bargaining, evasion, intimacy, anger, politeness, threat, lie, confession, performance, or other.
- sample_utterances[].pressure_tags — short strings naming pressure conditions suited to the sample.
- sample_utterances[].copy_policy — exactly one of never_copy_verbatim, may_reuse_cadence_not_text, or the rare canonical_phrase.

## Output contract

- Return exactly one fenced JSON object and nothing before or after it.
- Use a json fence.
- Use the exact nested field names in the JSON shape below.
- Never emit entity_id. The app preserves the author's current linked ENTITY selection.
- Never emit unknown keys. The only non-record metadata keys allowed are uncertainties and invented_fields.
- Include every shown record field. Use non-empty strings and non-empty list items; do not use null.
- uncertainties must be an array of concise strings. Use an empty array only when there is genuinely nothing for the author to resolve.
- invented_fields must be an array of exact dotted field paths from the field reference. Use an empty array only when no field was substantially invented.
- Do not place uncertainties or invented_fields inside the CAST MEMBER payload structure.

```json
{
  "identity": {
    "one_line": "...",
    "public_face": "...",
    "private_pressure": "..."
  },
  "voice_anchor": {
    "core_voice": "...",
    "rhythm_and_syntax": "...",
    "register_and_diction": "...",
    "vocabulary_and_metaphor_pools": "...",
    "profanity_and_intensity": "...",
    "taboo_and_avoidance_patterns": "...",
    "dialogue_tactics_and_speech_functions": "...",
    "address_terms_and_naming": "...",
    "silence_interruption_and_turntaking": "...",
    "under_pressure_voice": "...",
    "suppression_or_evasion_rule": "...",
    "must_preserve": ["..."],
    "must_avoid": ["..."],
    "anti_repetition_warnings": ["..."]
  },
  "pressure_behavior_core": {
    "cornered": "...",
    "tempted_or_offered_power": "...",
    "protecting_attachment": "..."
  },
  "body_presence_core": {
    "physicality": "...",
    "habitual_gestures_or_presence": "...",
    "social_presentation": "..."
  },
  "agency_core": {
    "default_strategy": "...",
    "risk_style": "..."
  },
  "world_pressure_core": {
    "world_produced_wound": "...",
    "active_appetite": "...",
    "self_mythology": "...",
    "irreconcilable_contradiction": "..."
  },
  "relational_charge": "...",
  "moral_psychological_edge": "...",
  "voice_extended": {
    "intimacy": "...",
    "anger": "...",
    "lying": "...",
    "register_switching": "...",
    "humor_or_irony_style": "...",
    "idiom_or_sociolect_notes": "...",
    "anti_generic_warnings": ["..."]
  },
  "body_and_presence_extended": {
    "body_limits": "...",
    "clothing_presentation": "...",
    "sensory_or_appearance_signatures": "..."
  },
  "perception_and_embodiment": {
    "notices": "...",
    "misses": "...",
    "misreads": "...",
    "sensory_bias": "..."
  },
  "pressure_behavior_extended": {
    "humiliated": "...",
    "offered_power": "...",
    "refused_power": "..."
  },
  "agency_and_planning_extended": {
    "fallback_style": "...",
    "planning_blind_spots": "..."
  },
  "sample_utterances": [
    {
      "text": "...",
      "situation": "...",
      "speech_function": "other",
      "pressure_tags": ["..."],
      "copy_policy": "never_copy_verbatim"
    }
  ],
  "uncertainties": ["..."],
  "invented_fields": ["..."]
}
```
````
<!-- CAST_MEMBER_DRAFT_PROMPT_END -->

## Conformance rules

- `@loom/core` owns the exact static bytes and the independent template version.
- A same-change drift test must derive the CAST MEMBER leaf paths from the registered schema/editor descriptor, require each path in this template, and compare the core text with the marked copyable text above.
- The Cast Member editor copies the current core constant directly. It must not compile project state into this prompt or cache a second browser copy.
- The import parser may recognize only the record payload keys shown above plus `uncertainties` and `invented_fields`; it strips and reports `entity_id`, unknown keys, empty values, and malformed entries.
