# CAST MEMBER record field guide for dossier extraction

Purpose: guide an external LLM that is given a complex character dossier and asked to draft the available Continuity Loom `CAST MEMBER` record fields.

Source of truth: `docs/story-record-schema.md` section 5 and the implemented `CAST MEMBER` schema in `packages/core/src/records/cast-member.ts`.

Important boundary: the external LLM is not the continuity authority. Its output should be treated as a draft for the user to review and enter or edit. Do not infer canon from accepted prose, and do not let an external prose writer mutate records automatically.

## Record role

A `CAST MEMBER` record is a rich, durable profile for a human or person-like story participant. It preserves the character's identity, voice, embodied presence, pressure responses, and agency so the prompt compiler can render active/onstage cast without flattening them into generic dialogue or generic psychology.

The record links to a base `ENTITY` through `entity_id`. The base `ENTITY` identifies what the character is in the story world. The `CAST MEMBER` dossier explains how that person-like entity sounds, moves, chooses, evades, misreads, and behaves under pressure.

## Extraction rules for the external LLM

- Fill fields from dossier evidence, not from genre assumptions.
- Prefer concise operational prose over biography. A field should tell a future prose writer what to preserve or avoid during a local scene.
- Use `none / not distinctive` only when the absence is true and useful. Do not use it as a fallback for unknown material that needs author review.
- Keep hard facts, character beliefs, public presentation, private pressure, and authorial interpretation distinct.
- Do not create future plot, secret reveals, relationship changes, or new motivations unless they are already in the dossier.
- For list fields, use short concrete bullets. Avoid overlapping entries that say the same thing in different words.
- For sample utterances, provide short one-line examples only. Default to `never_copy_verbatim` unless the phrase is explicitly canonical.

## Required core fields

These fields are required for materially involved active/onstage person-like cast. They are the minimum durable dossier needed to protect character voice, behavior, body presence, and agency.

| Field | What to fill | Rationale |
| --- | --- | --- |
| `entity_id` | The record id of the linked `ENTITY`. | Connects the dossier to the canonical entity that can hold state, location, relationships, plans, objects, beliefs, secrets, and status records. |
| `identity.one_line` | A compact identity sentence naming who the cast member is in story terms. | Gives the compiler and UI a high-salience label for the character without dumping biography. |
| `identity.public_face` | How the character presents or is legibly seen by others. | Separates social surface from private motive so prose can render what other characters can observe. |
| `identity.private_pressure` | The private need, wound, fear, hunger, shame, or tension that pressures the character. | Preserves subtext and pressure response without making all of it visible to other characters. |
| `voice_anchor.core_voice` | The irreducible description of how this character sounds or narrates. | Primary anti-generic voice anchor for dialogue, POV narration, and rendered interiority. |
| `voice_anchor.rhythm_and_syntax` | Sentence shape, pacing, fragmentation, formality, directness, looping, or interruption habits. | Helps the prose writer produce recognizable cadence instead of only matching vocabulary. |
| `voice_anchor.register_and_diction` | Social register, education-coded diction, slang, plainness, technicality, lyricism, bluntness, or polish. | Keeps speech level and word choice consistent across scenes. |
| `voice_anchor.vocabulary_and_metaphor_pools` | Recurring domains of language, images, references, or metaphor the character naturally reaches for. | Gives concrete material for voice without requiring verbatim catchphrases. |
| `voice_anchor.profanity_and_intensity` | Whether and how the character swears, escalates, softens, hedges, or becomes intense. | Prevents wrong intensity, sanitized speech, or out-of-character vulgarity. |
| `voice_anchor.taboo_and_avoidance_patterns` | Words, topics, emotions, admissions, or forms of vulnerability the character avoids. | Protects concealment, repression, denial, pride, trauma, social strategy, and reveal locks. |
| `voice_anchor.dialogue_tactics_and_speech_functions` | What their speech usually does: deflect, bargain, test, charm, dominate, appease, confess, threaten, perform, etc. | Treats dialogue as action under pressure, not decorative exposition. |
| `voice_anchor.address_terms_and_naming` | How the character names people, avoids names, uses titles, nicknames, insults, honorifics, or relationship terms. | Preserves relationship texture and social distance in dialogue. |
| `voice_anchor.silence_interruption_and_turntaking` | How they pause, withhold, interrupt, let others speak, refuse to answer, or fill silence. | Makes non-speech and conversational timing character-specific. |
| `voice_anchor.under_pressure_voice` | How voice changes when scared, cornered, tempted, angry, ashamed, aroused, grieving, or forced to choose. | Prevents static characterization when the scene pressure changes. |
| `voice_anchor.suppression_or_evasion_rule` | The rule for what they hide, how they hide it, and what leaks despite them. | Keeps subtext playable without accidental confession or omniscient leakage. |
| `voice_anchor.must_preserve` | Non-negotiable voice or behavior traits to keep whenever this character is active. | High-priority guardrails merged into cast voice pressure pins. |
| `voice_anchor.must_avoid` | Specific wrong renderings, false voice moves, or behavior mistakes to avoid. | Prevents common model failure modes for this character. |
| `voice_anchor.anti_repetition_warnings` | Repeated phrases, gestures, beats, labels, or tics that should not become a crutch. | Helps avoid mechanical repetition when the compiler includes a rich dossier many times. |
| `pressure_behavior_core.cornered` | What the character does when trapped socially, physically, emotionally, legally, or morally. | Local prose often pressures characters; this field preserves their failure mode and tactic under constraint. |
| `pressure_behavior_core.tempted_or_offered_power` | How they react when given leverage, permission, advantage, escape, money, status, desire, or control. | Prevents generic temptation responses and anchors choices when agency expands. |
| `pressure_behavior_core.protecting_attachment` | How they behave when protecting someone, something, self-image, duty, secret, place, or bond. | Ties attachment to action, not just sentiment. |
| `body_presence_core.physicality` | Body type as story-relevant, movement, energy, posture, strength, fragility, age, stamina, or physical style. | Maintains embodied continuity and prevents impossible or generic physical behavior. |
| `body_presence_core.habitual_gestures_or_presence` | Distinctive gestures, stillness, eye contact, fidgeting, spatial habits, or atmosphere. | Gives visible characterization for non-POV and silent presence. |
| `body_presence_core.social_presentation` | Clothing stance, grooming, performance of class/status/gender/profession, intimidation, approachability, or concealment. | Preserves how the character reads socially before or beyond dialogue. |
| `agency_core.default_strategy` | The character's usual way of pursuing goals or avoiding harm. | Keeps action choices character-specific while still allowing the manual directive to pressure them. |
| `agency_core.risk_style` | Their relationship to danger, uncertainty, exposure, escalation, delay, and commitment. | Helps the prose writer judge plausible action under time pressure. |

## Optional extended fields

These fields should be filled when the dossier contains useful material. They are not universal blockers, but populated active/onstage fields are included by the compiler and should not be silently compressed.

| Field | What to fill | Rationale |
| --- | --- | --- |
| `world_pressure_core.world_produced_wound` | The external social, historical, familial, institutional, economic, political, supernatural, or environmental pressure that shaped them. | Keeps character psychology grounded in story world causality rather than generic backstory. |
| `world_pressure_core.active_appetite` | What the character actively wants more of: safety, status, sex, recognition, revenge, proof, control, belonging, quiet, etc. | Gives desire a present-tense engine. |
| `world_pressure_core.self_mythology` | The story the character tells about who they are or what they deserve. | Supports biased self-justification and unreliable self-reading. |
| `world_pressure_core.irreconcilable_contradiction` | A durable contradiction that cannot be flattened without losing the character. | Protects complexity when the model tries to simplify motive. |
| `relational_charge` | The character's general relational electricity: how they affect and are affected by closeness, distance, power, rivalry, dependency, attraction, disgust, loyalty, or shame. | Gives relationship scenes an operating charge even before a specific `RELATIONSHIP` record is selected. |
| `moral_psychological_edge` | Morally or psychologically dangerous traits, compromises, compulsions, rationalizations, or limits. | Preserves morally complicated behavior without turning it into narrator endorsement. |
| `voice_extended.intimacy` | How the character sounds when close, tender, exposed, erotic, trusting, needy, or emotionally bare. | Avoids generic intimacy voice. |
| `voice_extended.anger` | How anger changes their speech, silence, diction, volume, precision, cruelty, or self-control. | Keeps conflict voice specific. |
| `voice_extended.lying` | How they lie, omit, redirect, over-explain, perform truthfulness, or leak tells. | Supports deception scenes and POV-safe subtext. |
| `voice_extended.register_switching` | How voice changes across audience, class context, profession, authority, danger, intimacy, or performance. | Prevents one-note voice when social context shifts. |
| `voice_extended.humor_or_irony_style` | Their style of wit, mockery, deadpan, charm, self-deprecation, bitterness, or refusal to joke. | Keeps levity and irony character-specific. |
| `voice_extended.idiom_or_sociolect_notes` | Dialect, regional terms, class markers, multilingual habits, occupational language, or sociolect constraints. | Preserves language texture without caricature or overuse. |
| `voice_extended.anti_generic_warnings` | Extra warnings against ways models tend to flatten this character. | Complements `must_avoid` with broader anti-flattening guidance. |
| `body_and_presence_extended.body_limits` | Injuries, disability, illness, fatigue, sensory limits, strength limits, age constraints, medication, or endurance boundaries. | Blocks physically impossible action and supports embodied continuity. |
| `body_and_presence_extended.clothing_presentation` | Durable clothing style or presentation logic, not every outfit change. | Keeps visual/social presentation consistent without replacing current-state clothing records. |
| `body_and_presence_extended.sensory_or_appearance_signatures` | Smell, sound, texture, visual details, aura, scars, grooming, or sensory cues that matter. | Gives concrete prose hooks for presence. |
| `perception_and_embodiment.notices` | What the character reliably notices first: threats, money, exits, hunger, status, lies, beauty, pain, rules, etc. | Shapes POV filtering and action priorities. |
| `perception_and_embodiment.misses` | What they overlook, dismiss, cannot read, or habitually ignore. | Prevents implausibly complete perception. |
| `perception_and_embodiment.misreads` | What they tend to interpret wrongly and why. | Supports biased POV and interpersonal misfire without changing objective canon. |
| `perception_and_embodiment.sensory_bias` | Dominant sensory channel or embodied attention pattern. | Helps prose feel filtered through this character rather than neutral camera description. |
| `pressure_behavior_extended.humiliated` | How humiliation changes behavior, speech, posture, retaliation, withdrawal, or need. | Useful for shame and status-pressure scenes. |
| `pressure_behavior_extended.offered_power` | More specific version of how they respond when power is offered. | Captures appetite, suspicion, refusal, intoxication, or strategic restraint. |
| `pressure_behavior_extended.refused_power` | How they behave when denied power, leverage, access, desire, or recognition. | Supports reactions to thwarted agency. |
| `agency_and_planning_extended.fallback_style` | What they do when the first plan fails. | Makes improvisation character-specific. |
| `agency_and_planning_extended.planning_blind_spots` | What their plans systematically fail to account for. | Creates plausible mistakes without inventing stupidity. |
| `sample_utterances[].text` | One short line of representative speech. Target 40 words or fewer. | Provides cadence and speech-function examples without turning the dossier into a script. |
| `sample_utterances[].situation` | The pressure or context in which the sample line would be spoken. | Prevents sample lines from being reused in the wrong emotional or tactical situation. |
| `sample_utterances[].speech_function` | One of `refusal`, `bargaining`, `evasion`, `intimacy`, `anger`, `politeness`, `threat`, `lie`, `confession`, `performance`, or `other`. | Lets the compiler select samples deterministically when the current generation pressure matches. |
| `sample_utterances[].pressure_tags` | Short tags describing pressure conditions that fit the sample. | Enables deterministic matching to local voice pressure. |
| `sample_utterances[].copy_policy` | `never_copy_verbatim`, `may_reuse_cadence_not_text`, or rare `canonical_phrase`. | Protects against accidental copying while allowing explicit canonical phrases when the author wants them. |

## What not to put in CAST MEMBER

- Current location, life state, captivity, visibility, or current activity: use `ENTITY STATUS` and current authoritative state.
- Specific facts, beliefs, secrets, relationship facts, obligations, plans, clocks, object state, or consequences: use their dedicated record types.
- Temporary one-generation voice instructions: use generation-time `CURRENT CAST VOICE PRESSURE` or `CAST VOICE OVERRIDES`.
- Full biography when it does not affect voice, body, agency, pressure behavior, perception, or continuity.
- Accepted prose excerpts as canon. Durable changes from prose must be manually converted into records by the user.

## Suggested LLM output shape

Ask the external LLM for a structured draft matching the field names exactly, plus an `uncertainties` section for missing or ambiguous evidence.

```yaml
entity_id: "<existing ENTITY record id>"
identity:
  one_line: ""
  public_face: ""
  private_pressure: ""
voice_anchor:
  core_voice: ""
  rhythm_and_syntax: ""
  register_and_diction: ""
  vocabulary_and_metaphor_pools: ""
  profanity_and_intensity: ""
  taboo_and_avoidance_patterns: ""
  dialogue_tactics_and_speech_functions: ""
  address_terms_and_naming: ""
  silence_interruption_and_turntaking: ""
  under_pressure_voice: ""
  suppression_or_evasion_rule: ""
  must_preserve: []
  must_avoid: []
  anti_repetition_warnings: []
pressure_behavior_core:
  cornered: ""
  tempted_or_offered_power: ""
  protecting_attachment: ""
body_presence_core:
  physicality: ""
  habitual_gestures_or_presence: ""
  social_presentation: ""
agency_core:
  default_strategy: ""
  risk_style: ""
world_pressure_core:
  world_produced_wound: ""
  active_appetite: ""
  self_mythology: ""
  irreconcilable_contradiction: ""
relational_charge: ""
moral_psychological_edge: ""
voice_extended:
  intimacy: ""
  anger: ""
  lying: ""
  register_switching: ""
  humor_or_irony_style: ""
  idiom_or_sociolect_notes: ""
  anti_generic_warnings: []
body_and_presence_extended:
  body_limits: ""
  clothing_presentation: ""
  sensory_or_appearance_signatures: ""
perception_and_embodiment:
  notices: ""
  misses: ""
  misreads: ""
  sensory_bias: ""
pressure_behavior_extended:
  humiliated: ""
  offered_power: ""
  refused_power: ""
agency_and_planning_extended:
  fallback_style: ""
  planning_blind_spots: ""
sample_utterances:
  - text: ""
    situation: ""
    speech_function: other
    pressure_tags: []
    copy_policy: never_copy_verbatim
uncertainties:
  - ""
```
