# Stress Coverage Matrix

Status: active audit — stress-case coverage matrix tying cases to validation rules, compiler behavior, and regression surfaces
Authority: support (see docs/ACTIVE-DOCS.md)

Source: `docs/stress-suite.md`

This is conceptual coverage. The demo does not instantiate every stress case; it gives a normal local project baseline while the validation/compiler capability tests assert representative v1 support for each risk area.

Same-change maintenance rule: a new stress case in `docs/stress-suite.md` must land with its numbered matrix row and any relevant readiness/draftability coverage row updates in this file in the same revision.

| # | Stress case | Risk area | Implemented v1 capability |
|---|---|---|---|
| Case 1 | Multi-character dialogue with asymmetric secrets | Dialogue voice distinction; POV/audience/secrets separation | `matrix-dialogue-incomplete`, `matrix-ensemble-dialogue-incomplete`, `matrix-secret-clue-incomplete`, `hidden-truth-in-pov-knowledge`; schema fields `CAST MEMBER.voice_anchor`, `SECRET.holders`, `SECRET.non_holders_to_protect`. |
| Case 2 | Physical chase or fight | Physical continuity | `matrix-physical-interaction-incomplete`, `matrix-location-change-incomplete`, `matrix-violence-or-injury-incomplete`, `impossible-action-physical-context`; fields `current_authoritative_state.routes_and_exits`, `positions`, `available_time`. |
| Case 3 | Object transfer under pressure | Object use and transfer; physical continuity | `object-current-holder-contradiction`, `matrix-object-transfer-incomplete`, `matrix-object-use-incomplete`; fields `OBJECT.owner`, `OBJECT.carried_by`, `OBJECT.usable_affordances`. |
| Case 4 | Offstage interruption | Offstage / institutional / nonhuman pressure | `offstage-interruption-missing-route`, `matrix-offstage-interruption-incomplete`, `matrix-institutional-involvement-incomplete`; fields `offstage_pressuring_entities`, `routes_and_exits`, `current_locks`. |
| Case 5 | Intimate scene with consent/status constraints | Mature fiction envelope; physical continuity | `content-envelope-contradiction`, `matrix-intimacy-or-sex-incomplete`, `matrix-restraint-or-coercion-incomplete`; field `consent_or_force_conditions`. |
| Case 6 | Close-third non-POV leakage trap | POV/audience/secrets separation | `matrix-introspection-incomplete`, `hidden-truth-in-pov-knowledge`, `secret-reveal-contradiction`; lock marker `non-POV interiority`. |
| Case 7 | First segment with minimal records | First segment empty-state correctness | `missing-current-authoritative-state`, `missing-manual-directive`; blank stop guidance and blank continuation handoff do not block when the universal floor and directive are present. |
| Case 8 | Continuation after accepted segment | No accepted prose in prompts / continuation handoff | `prompt-facing-prose-contamination`, `handoff-current-state-contradiction`; compiler excludes accepted segment archive from prompt inputs. |
| Case 9 | Hidden offstage plan shaping visible behavior | POV/audience/secrets separation | `matrix-hidden-plan-incomplete`, `inactive-plan-holder`; fields `PLAN.visibility_to_pov`, `PLAN.current_step`, entity status location/agency. |
| Case 10 | Conflicting beliefs and false reports | False reports and belief truth relations | `BELIEF.truth_relation`, `BELIEF.access_route`, `BELIEF.belief_mode`; belief payloads compile as held claims rather than canon facts. |
| Case 11 | Clock tick and obligation breach | Clocks, obligations, consequences | `matrix-clock-tick-incomplete`, `matrix-obligation-breach-incomplete`; fields `CLOCK.tick_trigger`, `CLOCK.next_threshold`, `OBLIGATION.terms`. |
| Case 12 | Large active cast salience stress | Large-context salience / cast dossier bloat | `prompt-length-risk`, `many-high-salience-records`, `cast-salience-risk` as grouped warnings; compiler cast sections preserve active/onstage ordering. |
| Case 13 | Low-drama literary scene where almost nothing happens | Low-drama / minimalist prose quality; local boundary | `low-drama-scene-pressure`, `matrix-introspection-incomplete`, `local-prose-scope-violation`; fields `EMOTION`, `BELIEF`, `RELATIONSHIP`, `OPEN THREAD`. |
| Case 14 | Dialogue-only voice distinction | Dialogue voice distinction | `matrix-dialogue-incomplete` blocks only when durable/compressed voice authority is missing; `local-voice-pressure-may-help` can warn when optional current pins would improve salience. |
| Case 15 | Ensemble scene with subtle voice contrast | Dialogue voice distinction; large-context salience | `matrix-ensemble-dialogue-incomplete` blocks missing speaker/audibility/relationship/voice authority; `ensemble-voice-distinction-risk` and `cast-salience-risk` are grouped warnings. |
| Case 16 | Sparse minimalist fiction | Low-drama / minimalist prose quality | `matrix-ambiguous-perception-incomplete`, `low-drama-scene-pressure`; prose-mode sparse paragraphing and current-state physical continuity. |
| Case 17 | Non-erotic mature fiction | Mature fiction envelope | `content-envelope-contradiction`, `matrix-violence-or-injury-incomplete`; content policy and consequence/emotion records. |
| Case 18 | Nonhuman or institutional pressure source | Offstage / institutional / nonhuman pressure | `matrix-nonhuman-pressure-incomplete`, `matrix-institutional-involvement-incomplete`; `ENTITY.entity_kind` and authority/reach lock markers. |
| Case 19 | Multi-POV project, single local POV lock | POV/audience/secrets separation | `matrix-introspection-incomplete`, `hidden-truth-in-pov-knowledge`; `PROSE MODE.pov_character`, selected POV, and non-POV-interiority lock. |
| Case 20 | Present-minor speech | Dialogue voice distinction | `matrix-present-minor-speech-incomplete`; `present_minor_cast_compressed` plus the matching current voice-pressure row render local guidance in the compiled prompt without a duplicate role field. |
| Case 21 | Active silent cast with strong body/presence | Active silent cast / body presence; physical continuity | `matrix-active-silent-presence-incomplete`, `matrix-physical-interaction-incomplete`; `body_presence_core`, positions, visibility, silence pressure. |
| Case 22 | Non-omniscient narration with heavy audience knowledge | POV/audience/secrets separation | `matrix-secret-clue-incomplete`, `matrix-ambiguous-perception-incomplete`, `hidden-truth-in-pov-knowledge`; secret cue and forbidden reveal fields. |
| Case 23 | Ambiguous visibility and misperception | Physical continuity; POV/audience/secrets separation | `matrix-ambiguous-perception-incomplete`, `matrix-physical-interaction-incomplete`; line-of-sight, visible conditions, perception-limit locks. |
| Case 24 | Object use without transfer | Object use and transfer | `matrix-object-use-incomplete`, `object-current-holder-contradiction`; object state plus visible `use` affordance. |
| Case 25 | Location change under route/time constraints | Physical continuity; clocks/obligations/consequences | `matrix-location-change-incomplete`, `matrix-clock-tick-incomplete`, `inactive-plan-holder`; route/time/destination and movement-constraint locks. |
| Case 26 | Stop-rule response point without over-continuation | Local-prose-only stop boundary | `local-prose-scope-violation`, `directive-stop-guidance-disagreement`; blank `soft_unit_guidance` still uses the universal local stop rule and does not block. |
| Case 27 | Draft save despite readiness blockers | Readiness vs draft persistence | `missing-manual-directive` and `missing-current-authoritative-state` block Preview/Generate readiness, while draft persistence accepts structurally saveable incomplete generation briefs; see readiness table row "Draft save with blockers". |
| Case 28 | Generation-context default mismatch prevention | Deterministic readiness normalization | `deriveGenerationContextDefault` and `normalizeGenerationSessionForReadiness` resolve exactly one `generation_context` from accepted-segment count; `focus-tag-count-invalid` covers invalid multi-context state rather than omitted draft context. |
| Case 29 | Continuation default from accepted-segment count | No accepted prose in prompts / continuation handoff | `deriveGenerationContextDefault` resolves continuation after accepted segments; `missing-immediate-handoff` requires user-authored handoff and `prompt-facing-prose-contamination` blocks accepted prose, rejected candidates, superseded regenerations, and automatic summaries. |
| Case 30 | Provider-only Generate block | Provider separation from story/compiler readiness | Readiness `provider-configuration-missing` blocks Generate when OpenRouter credentials are missing while prompt Preview can remain available; provider blockers are separate from core story/compiler diagnostics. |
| Case 31 | Deduplicated long-dossier warning | Warning deduplication; large-context salience | `cast-salience-risk`, `ensemble-voice-distinction-risk`, `local-voice-pressure-may-help`, and `prompt-middle-salience-risk` remain grouped warning surfaces; warnings do not block Preview/Generate when durable/compressed voice authority is sufficient. |
| Case 32 | Cross-segment salience duplicate calibration | Prompt salience vs redundant restatement; long-context placement; duplicate-noise control | Active working set predicates (`fact_kind`/`scope`/`salience` FACT gate, `event_kind`/`current_relevance` EVENT gate), belief behavior-first pressure, affordance removal from `material_pressure`, voice-pin preservation; golden prompt diff plus compiler pressure tests prove current-pressure summaries remain dual-frame while inert archive text is not copied forward. |
| Case 33 | Generation-brief reference drift | Brief reference integrity; optional vs required lanes | `onstage-entity-reference-invalid`, `offstage-entity-reference-invalid`, `entity-statuses-reference-invalid`, `current-location-reference-invalid`, `offstage-entity-reference-unselected-optional`, and `entity-statuses-reference-unselected-optional` distinguish dangling, mistyped, required-unselected, and optional-unselected brief ids. |
| Case 34 | Cast-band and local voice reference integrity | Cast/POV/voice reference integrity | `cast-band-duplicate-membership`, `cast-band-reference-invalid`, `selected-pov-reference-invalid`, `voice-pressure-attachment-invalid`, and `voice-pressure-orphaned-attachment` cover duplicated bands, missing/mistyped cast ids, selected POV ids, and orphaned voice pins. |
| Case 35 | Record-internal reference integrity | Durable record reference integrity | `record-reference-dangling`, `record-reference-type-mismatch`, `record-reference-unselected-required`, and `record-reference-unselected-optional` validate extracted record references without hand-written field walking. |
| Case 36 | Migration-selected record now fails closed | Migration friction; fail-closed readiness | Existing-project hidden SECRET holder/protected-non-holder references now surface `record-reference-unselected-required` instead of compiling with missing selected context. |
| Case 37 | Onstage state contradiction | Physical presence contradiction | `onstage-offstage-entity-overlap` and `onstage-entity-status-contradiction` block current-state/status disagreement about whether an entity is present. |
| Case 38 | Object holder/location incoherence | Object use and transfer; physical continuity | `object-location-holder-incoherence` blocks `current_location: carried_by_holder` when `carried_by` is `none`. |
| Case 39 | Relationship self-reference | Relationship pressure integrity | `relationship-self-reference` is a validation blocker, not a schema refinement, so bad saved records remain loadable and actionable. |

## Record Hygiene Assistance Coverage

Record Hygiene coverage is advisory-assistance coverage, not validation coverage. These rows must stay complete with the RH-01-RH-20 cases in `docs/stress-suite.md`: every RH case needs a row here, and every row must name the proof surface that keeps the review complete, quarantined, citation-grounded, and non-mutating.

| # | Stress case | Risk area | Required proof surface |
|---|---|---|---|
| RH-01 | Exact duplicate active facts | Duplicate detection | Core golden prompt includes both records; parser accepts two valid same-type citations. |
| RH-02 | Near duplicate facts with material scope difference | Near-match discrimination | Prompt renders scope/salience/visibility fields; UI action labels distinguish keep-distinct from edit recommendations. |
| RH-03 | Belief restates a fact as held knowledge | Cross-type authority separation | Parser rejects cross-type `MERGE`; findings remain scratch. |
| RH-04 | False report versus canon fact | Belief truth relation | Validation inventory note confirms hygiene findings are not diagnostics or gates. |
| RH-05 | Stale active event shadow | Stale-shadow review | Active EVENT predicate includes current-relevance records; terminal events are excluded. |
| RH-06 | Complementary fragments split across records | Fragment consolidation | Parser survivor rules and malformed quarantine tests cover merge/remove discipline. |
| RH-07 | Broad and narrow plan overlap | Broad/narrow distinction | Deterministic type order and full display labels appear in the hygiene prompt. |
| RH-08 | Active plan and intention duplicate motive | Cross-type merge prevention | Parser rejects cross-type merge/remove; web links citations only. |
| RH-09 | Clock and obligation duplicate deadline pressure | Deadline pressure overlap | Complete-source compiler includes active CLOCK and OBLIGATION records. |
| RH-10 | Consequence restates resolved event | Terminal-source exclusion | Hygiene-active predicate excludes terminal events while keeping active consequences. |
| RH-11 | Open thread duplicates obligation | Type-aware overlap | Counts by type and citation chips make both records inspectable. |
| RH-12 | Location and affordance overlap | Physical constraint restatement | Prompt includes active LOCATION and VISIBLE AFFORDANCE records while excluding ENTITY/CAST payloads. |
| RH-13 | Object state and fact duplicate ownership | Structured-field authority | Web surface has navigation only and no apply/write action. |
| RH-14 | Secret and belief reveal-boundary overlap | Hidden payload disclosure | Web send confirmation states hidden SECRET content leaves only on explicit analyze. |
| RH-15 | Relationship and emotion duplicate affect | Non-color-only caution | Finding-card tests cover high-stakes action labels and absence of mutation controls. |
| RH-16 | Active record outside working set | Whole-project completeness | Server builder uses all non-archived hygiene-active records, not the active working set. |
| RH-17 | Archived duplicate excluded | Archive exclusion | Source predicate and web source disclosure name archived records as excluded. |
| RH-18 | Malformed record row | Fail-closed source build | Snapshot-builder tests cover `malformed-hygiene-source` without silent skipping. |
| RH-19 | Malformed model output | Output quarantine | Parser and UI tests quarantine raw output as non-canonical scratch. |
| RH-20 | Oversized project review | No eviction/retry | Route test covers `prompt-too-large` with no reduced-record retry. |

## Readiness and draftability coverage

The numbered table above maps each stress case to implemented behavior. This readiness table cuts across Cases 27-31 by shared product surface so draftability, normalization, warning behavior, and provider separation stay visible without duplicating every case row.

| Coverage area | Required proof |
|---|---|
| Draft save with blockers | Case 27: a structurally saveable generation brief can save while Preview/Generate remain blocked by readiness diagnostics. |
| Blank stop guidance | Case 26: blank `soft_unit_guidance` does not block; supplied nonlocal or contradictory guidance still blocks. |
| First-segment default | Case 28: no accepted segments resolves `generation_context` to `first_segment` without requiring continuation handoff. |
| Continuation default | Case 29: one or more accepted segments resolves `generation_context` to `continuation_after_accepted_segment` and requires user-authored handoff. |
| Manual directive required | Case 27: blank `manual_moment_directive.must_render` blocks readiness, not draft saving. |
| Current-state universal floor | Case 27: time, location/scene-space, onstage/material entities, and immediate situation summary are the universal floor. |
| Physical context gating | Positions, routes, line of sight, locks, force, objects, and time block only when explicit mode/records/directive make them structurally necessary. |
| Voice pressure optionality | Case 31: durable CAST MEMBER anchors are primary; missing current pins warn unless no durable/compressed authority exists. |
| Warning deduplication | Case 31: long-dossier and optional-pin risks are grouped salience warnings, not repeated blockers. |
| Three-page shared readiness | Cases 27-31: Generation Brief, Preview, and Generate use the same readiness model; provider configuration can block Generate without blocking Preview. |
| Provider separation | Case 30: provider configuration blockers are separate from story/compiler readiness blockers. |
