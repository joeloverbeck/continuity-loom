Status: active audit — implemented validation diagnostic code inventory
Authority: domain authority for implemented validation-rule inventory (see docs/ACTIVE-DOCS.md)

# Validation Rule Inventory

This inventory lists every value in `DIAGNOSTIC_CODES` from `packages/core/src/validation/types.ts`. It documents implemented validation behavior and the current diagnostic-code namespace; it is not a roadmap for new rules.

Same-change rule: adding, removing, or re-severitying a diagnostic code must update this inventory in the same revision. The drift test in `packages/core/test/validation-rule-inventory.test.ts` checks the rule ID set and severity column.

FOUNDATIONS §11 taxonomy clauses used below:

1. Compiler cannot produce a structurally valid universal prompt.
2. Required prompt contract section would be missing and has no truthful deterministic empty state.
3. Selected records or generation fields contain a hard contradiction.
4. Manual directive requires impossible knowledge, perception, movement, timing, physical action, reveal, or provider-policy violation based on explicit fields.
5. Selected local mode requires state that is deterministically absent.
6. Provider or content-policy configuration is missing or contradictory enough that sending would be unsafe.
7. Prompt would ask the prose writer to plan, summarize future consequences, produce alternatives, produce branches, or perform nonlocal story-structure work.

## Universal Completeness

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `missing-story-config` | blocker | applies | Story contract, content policy, or prose mode is missing required launch context. | §11.2 | Case 1 |
| `missing-current-authoritative-state` | blocker | applies | Current time, location, onstage entities, or immediate situation summary is missing. | §11.2 | Cases 2, 27 |
| `missing-immediate-handoff` | blocker | prose-only | Continuation handoff lacks required user-authored launch context. | §11.2 | Cases 3, 29 |
| `missing-manual-directive` | blocker | prose-only | Manual directive lacks a local must-render instruction. | §11.2 | Cases 4, 27 |
| `pov-knowledge-missing` | blocker | prose-only | Selected non-omniscient POV has no selected knowledge profile. | §11.5 | Case 5 |
| `active-secret-incomplete` | blocker | applies | Active secret lacks holders, protected non-holders, reveal constraints, or required clue cues. | §11.5 | Cases 6, 18 |
| `active-physical-context-incomplete` | blocker | applies | Active physical interaction lacks required current physical continuity context. | §11.5 | Cases 7, 15 |
| `active-cast-incomplete` | blocker | prose-only | Active onstage cast lacks local function or core dossier authority. | §11.5 | Cases 8, 13 |
| `focus-tag-count-invalid` | blocker | prose-only | Generation validation focus does not identify exactly one generation context. | §11.1 | Cases 28, 29 |
| `cast-missing-core-dossier` | blocker | applies | Reserved diagnostic code for missing cast core dossier; current validation uses `active-cast-incomplete` for this blocker. | §11.5 | — |

## Universal Blockers

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `local-prose-scope-violation` | blocker | prose-only | Directive or stop guidance asks for non-local prose scope. | §11.7 | Cases 9, 10 |
| `directive-stop-guidance-disagreement` | blocker | prose-only | Manual directive and stop guidance disagree about the local unit boundary. | §11.1 | Case 11 |
| `handoff-current-state-contradiction` | blocker | applies | Immediate handoff explicitly contradicts current authoritative state. | §11.3 | Case 12 |
| `onstage-offstage-entity-overlap` | blocker | applies | Current authoritative state places the same entity both onstage and offstage-pressuring. | §11.3 | — |
| `onstage-entity-status-contradiction` | blocker | applies | An onstage entity's selected status places it offstage, concealed, or at a different record-id current location. | §11.3 | — |
| `entity-current-location-contradiction` | blocker | applies | Selected records place one entity in more than one current location. | §11.3 | Case 14 |
| `object-current-holder-contradiction` | blocker | applies | Selected object has two different current holders. | §11.3 | Case 16 |
| `object-location-holder-incoherence` | blocker | applies | Object location says carried-by-holder while carried_by is none. | §11.3 | — |
| `relationship-self-reference` | blocker | applies | A selected relationship record uses the same endpoint for from and to. | §11.3 | — |
| `inactive-plan-holder` | blocker | applies | Active plan is held by an entity that currently cannot plausibly act. | §11.3 | Case 17 |
| `secret-reveal-contradiction` | blocker | applies | Secret reveal permission conflicts with protected non-holder state or directive pressure. | §11.4 | Case 18 |
| `hidden-truth-in-pov-knowledge` | blocker | applies | POV knowledge contains a selected hidden truth the POV must not know. | §11.4 | Case 18 |
| `offstage-interruption-missing-route` | blocker | applies | Offstage interruption lacks a communication, entrance, timing, or route mechanism. | §11.4 | Case 19 |
| `impossible-action-physical-context` | blocker | applies | Manual directive requires physical action that current state marks impossible. | §11.4 | Case 20 |
| `content-envelope-contradiction` | blocker | applies | Content envelope contradicts active cast age/status or provider constraints. | §11.6 | Case 21 |
| `prompt-facing-prose-contamination` | blocker | applies | Prompt-facing fields contain accepted prose, rejected candidate text, superseded regeneration text, or automatic prose-derived summary. | §11.1 | Cases 22, 29 |
| `missing-constitutional-section` | blocker | applies | Required constitutional prompt section lacks deterministic template or compiler source. | §11.1 | Case 23 |

## Durable-Change Matrix

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `matrix-object-use-incomplete` | blocker | applies | Object-use focus lacks object state, usable affordance, positions, visibility, or constraints. | §11.5 | Case 24 |
| `matrix-object-transfer-incomplete` | blocker | applies | Object-transfer focus lacks holder/location state, body positions, consent or force, transfer route, or resulting holder state. | §11.5 | Case 24 |
| `matrix-location-change-incomplete` | blocker | applies | Location-change focus lacks route, time, movement constraints, or arrival consequence. | §11.5 | Case 15 |
| `matrix-restraint-or-coercion-incomplete` | blocker | applies | Restraint/coercion focus lacks agency, force, positions, exits, power relation, time, or constraints. | §11.5 | Case 25 |
| `matrix-intimacy-or-sex-incomplete` | blocker | applies | Intimacy/sex focus lacks cast status, envelope consistency, consent/force, privacy, relationship pressure, or affordance state. | §11.5 | Case 25 |
| `matrix-violence-or-injury-incomplete` | blocker | applies | Violence/injury focus lacks agency, positions, force, consequence, visibility, time, or location constraints. | §11.5 | Case 25 |
| `matrix-institutional-involvement-incomplete` | blocker | applies | Institutional involvement focus lacks entity, access route, authority relation, or current opportunity. | §11.5 | Case 26 |
| `matrix-clock-tick-incomplete` | blocker | applies | Clock-tick focus lacks active clock pressure, trigger, threshold, effects, or visible cause. | §11.5 | Case 26 |
| `matrix-obligation-breach-incomplete` | blocker | applies | Obligation-breach focus lacks terms, parties, visibility, consequence, or current opportunity pressure. | §11.5 | Case 26 |

## Knowledge Matrix

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `matrix-introspection-incomplete` | blocker | prose-only | Introspection focus lacks POV belief/emotion pressure, psychic-distance mode, or non-POV interiority restrictions. | §11.5 | Case 5 |
| `matrix-ambiguous-perception-incomplete` | blocker | applies | Ambiguous-perception focus lacks line of sight, uncertainty source, POV limits, or audience/writer knowledge boundary. | §11.5 | Case 6 |
| `matrix-secret-clue-incomplete` | blocker | applies | Secret/clue focus lacks holders, protected non-holders, POV/audience visibility, allowed clues, forbidden reveals, or reveal permission. | §11.5 | Case 18 |
| `matrix-hidden-plan-incomplete` | blocker | applies | Hidden-plan focus lacks holder status/location/means, current step, visibility to POV, surface cues, or close-POV restrictions. | §11.5 | Case 17 |

## Physical Matrix

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `matrix-physical-interaction-incomplete` | blocker | applies | Physical-interaction focus lacks bodies, positions, visibility, routes, time, object state, or impossible-action locks. | §11.5 | Cases 7, 15 |
| `matrix-offstage-interruption-incomplete` | blocker | applies | Offstage-interruption focus lacks source, awareness mechanism, route/timing, or interruption type. | §11.5 | Case 19 |
| `matrix-nonhuman-pressure-incomplete` | blocker | applies | Nonhuman/institutional pressure lacks entity rules, reach, pressure mechanism, or agency/interiority limits. | §11.5 | Case 26 |

## Voice Matrix

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `matrix-dialogue-incomplete` | blocker | prose-only | Dialogue focus lacks speaker dossier/voice authority, language/register state, POV knowledge, or relationship/status context. | §11.5 | Case 8 |
| `matrix-ensemble-dialogue-incomplete` | blocker | prose-only | Ensemble dialogue focus lacks speaker functions, relationship/status pressure, or auditory/interruptibility state. | §11.5 | Case 8 |
| `matrix-active-silent-presence-incomplete` | blocker | prose-only | Active silent presence lacks dossier, body presence, position/visibility, allowed actions, or POV access limits. | §11.5 | Case 13 |
| `matrix-present-minor-speech-incomplete` | blocker | prose-only | Present-minor speech lacks deliverable dialogue guidance, a dialogue-targeted current override, or promotion to active/onstage status. | §11.5 | Case 13 |

## Referential Integrity

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `cast-band-duplicate-membership` | blocker | applies | One cast member id appears in more than one working-set cast band. | §11.3 | — |
| `cast-band-reference-invalid` | blocker | applies | A working-set cast-band id is not selected or does not resolve to a selected CAST MEMBER record. | §11.2 / §11.3 | — |
| `onstage-cast-band-missing` | blocker | applies | Onstage character's selected CAST MEMBER is Unassigned or in offstage relevance, so its dossier is not compiled as present cast. | §11.3 / §11.5 | — |
| `selected-pov-reference-invalid` | blocker | applies | Selected POV is dangling, mistyped, or not selected for the readiness-required POV lane. | §11.2 / §11.3 | — |
| `voice-pressure-attachment-invalid` | blocker | applies | Current voice pressure or voice override targets a dangling or non-CAST MEMBER record. | §11.3 | — |
| `record-reference-dangling` | blocker | applies | A selected record's extracted internal reference does not resolve to a project record. | §11.3 | — |
| `record-reference-type-mismatch` | blocker | applies | A selected record's extracted internal reference resolves to a record outside the lane's expected type family. | §11.3 | — |
| `record-reference-unselected-required` | blocker | applies | A selected record's extracted internal reference resolves to an unselected record in a required prompt lane. | §11.2 | — |
| `onstage-entity-reference-invalid` | blocker | applies | A generation-brief onstage entity id is dangling, mistyped, or not selected for the readiness-required onstage-entities lane. | §11.2 / §11.3 | — |
| `offstage-entity-reference-invalid` | blocker | applies | A generation-brief offstage pressure id is dangling or mistyped, or is unselected when offstage pressure is context-required. | §11.2 / §11.3 | — |
| `entity-statuses-reference-invalid` | blocker | applies | A generation-brief entity-status record id is dangling or mistyped, or is unselected when current agency/status is context-required. | §11.2 / §11.3 | — |
| `current-location-reference-invalid` | blocker | applies | A current-location value that resolves to a project record is mistyped or not selected for the readiness-required current-location lane. | §11.2 / §11.3 | — |

## Security

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `api-key-like-prompt-facing-text` | blocker | applies | Prompt-facing text contains an API-key-like secret. | §11.6 | — |

## Warnings

| Rule ID | Severity | Ideation applicability | Description | FOUNDATIONS §11 clause | Stress cases |
|---|---|---|---|---|---|
| `prompt-middle-salience-risk` | warning | applies | Snapshot is large enough to risk lost-in-the-middle prompt behavior. | Warning; §11 warnings never gate | Cases 31, 32 |
| `many-high-salience-records` | warning | applies | Many high-salience records are selected for one local unit. | Warning; §11 warnings never gate | Case 32 |
| `offstage-entity-reference-unselected-optional` | warning | applies | Offstage pressure names an existing ENTITY record that is not selected while the lane is optional. | Warning; §11 warnings never gate | — |
| `entity-statuses-reference-unselected-optional` | warning | applies | Current agency/status names an existing ENTITY STATUS record that is not selected while the lane is optional. | Warning; §11 warnings never gate | — |
| `voice-pressure-orphaned-attachment` | warning | applies | Current voice pressure or voice override targets an existing CAST MEMBER that is not in a rendered cast band. | Warning; §11 warnings never gate | — |
| `record-reference-unselected-optional` | warning | applies | A selected record's extracted internal reference resolves to an unselected record in an optional prompt lane. | Warning; §11 warnings never gate | — |
| `no-sample-utterances` | warning | applies | Active cast has no selected sample utterances. | Warning; §11 warnings never gate | Case 8 |
| `sparse-setting-texture` | warning | applies | Setting texture is sparse for the current local unit. | Warning; §11 warnings never gate | — |
| `no-active-clock-pressure` | warning | applies | Directive has local pressure but no active clock, obligation, or open thread selected. | Warning; §11 warnings never gate | Case 26 |
| `local-voice-pressure-may-help` | warning | applies | Dialogue is ready, but local voice pressure may help keep active speakers salient. | Warning; §11 warnings never gate | Case 8 |
| `ensemble-voice-distinction-risk` | warning | applies | Ensemble dialogue is ready, but absent or repeated local voice pins may blur speakers. | Warning; §11 warnings never gate | Case 31 |
| `cast-salience-risk` | warning | applies | Long active cast dossiers may need stronger local salience pins. | Warning; §11 warnings never gate | Cases 31, 32 |
| `low-drama-scene-pressure` | warning | applies | Low-drama scene may need sharper prose-craft pressure. | Warning; §11 warnings never gate | — |
| `stale-selected-record` | warning | applies | Selected record is old or resolved but may still be relevant. | Warning; §11 warnings never gate | — |
