# Stress Coverage Matrix

Status: active SPEC-013 coverage audit  
Source: `docs/stress-suite.md`

This is conceptual coverage. The demo does not instantiate every stress case; it gives a normal local project baseline while the validation/compiler capability tests assert representative v1 support for each risk area.

| # | Stress case | Risk area | Implemented v1 capability |
|---|---|---|---|
| Case 1 | Multi-character dialogue with asymmetric secrets | Dialogue voice distinction; POV/audience/secrets separation | `matrix-dialogue-incomplete`, `matrix-ensemble-dialogue-incomplete`, `matrix-secret-clue-incomplete`, `hidden-truth-in-pov-knowledge`; schema fields `CAST MEMBER.voice_anchor`, `SECRET.holders`, `SECRET.non_holders_to_protect`. |
| Case 2 | Physical chase or fight | Physical continuity | `matrix-physical-interaction-incomplete`, `matrix-location-change-incomplete`, `matrix-violence-or-injury-incomplete`, `impossible-action-physical-context`; fields `current_authoritative_state.routes_and_exits`, `positions`, `available_time`. |
| Case 3 | Object transfer under pressure | Object use and transfer; physical continuity | `object-current-holder-contradiction`, `matrix-object-transfer-incomplete`, `matrix-object-use-incomplete`; fields `OBJECT.owner`, `OBJECT.carried_by`, `OBJECT.usable_affordances`. |
| Case 4 | Offstage interruption | Offstage / institutional / nonhuman pressure | `offstage-interruption-missing-route`, `matrix-offstage-interruption-incomplete`, `matrix-institutional-involvement-incomplete`; fields `offstage_pressuring_entities`, `routes_and_exits`, `current_locks`. |
| Case 5 | Intimate scene with consent/status constraints | Mature fiction envelope; physical continuity | `content-envelope-contradiction`, `matrix-intimacy-or-sex-incomplete`, `matrix-restraint-or-coercion-incomplete`; field `consent_or_force_conditions`. |
| Case 6 | Close-third non-POV leakage trap | POV/audience/secrets separation | `matrix-introspection-incomplete`, `hidden-truth-in-pov-knowledge`, `secret-reveal-contradiction`; lock marker `non-POV interiority`. |
| Case 7 | First segment with minimal records | First segment empty-state correctness | `missing-current-authoritative-state`, `missing-immediate-handoff`, `missing-manual-directive`, `missing-stop-guidance`; clean first-segment handoff rule. |
| Case 8 | Continuation after accepted segment | No accepted prose in prompts / continuation handoff | `prompt-facing-prose-contamination`, `handoff-current-state-contradiction`; compiler excludes accepted segment archive from prompt inputs. |
| Case 9 | Hidden offstage plan shaping visible behavior | POV/audience/secrets separation | `matrix-hidden-plan-incomplete`, `inactive-plan-holder`; fields `PLAN.visibility_to_pov`, `PLAN.current_step`, entity status location/agency. |
| Case 10 | Conflicting beliefs and false reports | False reports and belief truth relations | `BELIEF.truth_relation`, `BELIEF.access_route`, `BELIEF.belief_mode`; belief payloads compile as held claims rather than canon facts. |
| Case 11 | Clock tick and obligation breach | Clocks, obligations, consequences | `matrix-clock-tick-incomplete`, `matrix-obligation-breach-incomplete`; fields `CLOCK.tick_trigger`, `CLOCK.next_threshold`, `OBLIGATION.terms`. |
| Case 12 | Large active cast salience stress | Large-context salience / cast dossier bloat | `prompt-length-risk`, `many-high-salience-records`, `long-dossier-needs-pin`; compiler cast sections preserve active/onstage ordering. |
| Case 13 | Low-drama literary scene where almost nothing happens | Low-drama / minimalist prose quality; local boundary | `low-drama-scene-pressure`, `matrix-introspection-incomplete`, `local-prose-scope-violation`; fields `EMOTION`, `BELIEF`, `RELATIONSHIP`, `OPEN THREAD`. |
| Case 14 | Dialogue-only voice distinction | Dialogue voice distinction | `sparse-voice-pressure`, `matrix-dialogue-incomplete`; fields `CAST MEMBER.voice_anchor`, `current_cast_voice_pressure`. |
| Case 15 | Ensemble scene with subtle voice contrast | Dialogue voice distinction; large-context salience | `matrix-ensemble-dialogue-incomplete`, `long-dossier-needs-pin`; distinct current voice pins and relationship/status context. |
| Case 16 | Sparse minimalist fiction | Low-drama / minimalist prose quality | `matrix-ambiguous-perception-incomplete`, `low-drama-scene-pressure`; prose-mode sparse paragraphing and current-state physical continuity. |
| Case 17 | Non-erotic mature fiction | Mature fiction envelope | `content-envelope-contradiction`, `matrix-violence-or-injury-incomplete`; content policy and consequence/emotion records. |
| Case 18 | Nonhuman or institutional pressure source | Offstage / institutional / nonhuman pressure | `matrix-nonhuman-pressure-incomplete`, `matrix-institutional-involvement-incomplete`; `ENTITY.entity_kind` and authority/reach lock markers. |
| Case 19 | Multi-POV project, single local POV lock | POV/audience/secrets separation | `matrix-introspection-incomplete`, `hidden-truth-in-pov-knowledge`; `PROSE MODE.pov_character`, selected POV, and non-POV-interiority lock. |
| Case 20 | Present-minor speech | Dialogue voice distinction | `matrix-present-minor-speech-incomplete`; `present_minor_cast_compressed` and current voice row with `present_minor_speaker`. |
| Case 21 | Active silent cast with strong body/presence | Active silent cast / body presence; physical continuity | `matrix-active-silent-presence-incomplete`, `matrix-physical-interaction-incomplete`; `body_presence_core`, positions, visibility, silence pressure. |
| Case 22 | Non-omniscient narration with heavy audience knowledge | POV/audience/secrets separation | `matrix-secret-clue-incomplete`, `matrix-ambiguous-perception-incomplete`, `hidden-truth-in-pov-knowledge`; secret cue and forbidden reveal fields. |
| Case 23 | Ambiguous visibility and misperception | Physical continuity; POV/audience/secrets separation | `matrix-ambiguous-perception-incomplete`, `matrix-physical-interaction-incomplete`; line-of-sight, visible conditions, perception-limit locks. |
| Case 24 | Object use without transfer | Object use and transfer | `matrix-object-use-incomplete`, `object-current-holder-contradiction`; object state plus visible `use` affordance. |
| Case 25 | Location change under route/time constraints | Physical continuity; clocks/obligations/consequences | `matrix-location-change-incomplete`, `matrix-clock-tick-incomplete`, `inactive-plan-holder`; route/time/destination and movement-constraint locks. |
| Case 26 | Stop-rule response point without over-continuation | Local-prose-only stop boundary | `local-prose-scope-violation`, `directive-stop-guidance-disagreement`, `missing-stop-guidance`; deterministic stop guidance and directive agreement. |
