# SPEC — Validation Gating Taxonomy and Focus Matrix

Status: proposed active implementation spec  
Repository: `joeloverbeck/continuity-loom`  
Target commit: `e1df2d032c7ae7976108f70cafa5802a7398ce39`

## Executive decision

The current validation rules are too strict in the wrong places and too vague in the places that should help the author. The corrected validator must distinguish structural impossibility from optional literary seasoning.

Blockers are allowed only when deterministic validation proves that Preview or Generate would produce an invalid, unsafe, nonlocal, or structurally under-specified prompt. Warnings are advisory. Warnings must never block Preview or Generate, directly or indirectly.

## Current problems found at the target commit

The current active docs and validation rules treat blank stop guidance as a blocker even though the prompt template already contains a strong universal stop rule. The current schema makes `stop_guidance.soft_unit_guidance` nonempty when the surface is present. The current universal completeness rule raises `missing-stop-guidance` when that field is blank or absent.

The current validation focus requires exactly one generation context but relies on the persisted server snapshot. The UI locally defaults to `first_segment`, which can create a false blocker when the unsaved or unsaveable persisted session has no context.

The current universal voice rule blocks an active speaker or POV narrator merely because no current cast voice pressure row exists. That is backwards. Durable `CAST MEMBER` voice anchors are the primary voice authority; current cast voice pressure is a local salience pin or override-like emphasis.

The current universal current-state rule requires many physical fields for every generation, including positions, routes, line of sight, available time, and locks. Those fields are sometimes essential. They are not universally essential for a quiet first local unit that does not involve movement, object transfer, coercion, violence, intimacy, offstage entrance, pursuit, or tight spatial blocking.

## Blocker taxonomy

A diagnostic may be a blocker only when deterministic validation proves one of these conditions:

1. The compiler cannot produce a structurally valid universal prompt.
2. A required prompt contract section would be missing and has no truthful deterministic empty state.
3. The selected records or generation fields contain a hard contradiction.
4. The launch directive requires impossible knowledge, perception, movement, timing, physical action, or reveal under the current state.
5. The selected local mode requires state that is deterministically absent.
6. Provider or content-policy configuration is missing or contradictory enough that sending would be unsafe.
7. The prompt would ask the model to plan, summarize future consequences, produce options/branches, or perform nonlocal story-structure work.

Everything else is a warning or no diagnostic.

## Warning taxonomy

A diagnostic should be a warning when all of these are true:

1. Generation is architecturally possible.
2. Output quality, salience, voice, context position, prompt length, or curation may suffer.
3. The issue cannot be proven to make the prompt invalid.
4. The user can knowingly ignore it.
5. The warning is not inserted into the prompt and does not ask the external prose model to repair continuity.

Approximate thresholds, such as long prompt size or many selected records, are warnings only.

## Invalid diagnostics

A diagnostic is invalid if it:

- Blocks draft saving.
- Blocks generation based on optional nuance.
- Blocks because a UI-only default was not persisted.
- Tells the user to fill a field without explaining the field’s purpose.
- Suggests only `revise` without a concrete target.
- Uses only raw record IDs where display labels exist.
- Repeats the same warning once per record without grouping.
- Treats literary quality risk as deterministic impossibility.
- Lets warnings block Preview or Generate.

## Required decisions

### Separate draft and ready schemas

Yes. There must be a separate `GenerationSessionDraft` schema and a normalized readiness model. The current final schema cannot serve as the draft persistence schema.

### Draft save route

Yes. `/api/generation-brief` must accept partial draft saves even when generation validation would fail.

### Deterministic defaults

Defaults belong in a shared core normalizer and must be applied by server routes, snapshot building, migration/backfill, and UI presentation. UI defaults alone are not authoritative.

### `generation_context`

Default rule:

| Accepted segments | Default generation context |
|---:|---|
| 0 | `first_segment` |
| 1 or more | `continuation_after_accepted_segment` |

The selector remains visible and editable. An explicit valid user selection wins over the default. The value used by validation must be persisted or applied by the server-side snapshot normalizer. A local React default is not enough.

### Blank `soft_unit_guidance`

Blank `soft_unit_guidance` is allowed. It is not a blocker.

The compiler renders this deterministic empty state:

```text
Soft unit: No additional user narrowing; use the universal local stop rule above.
```

The universal stop rule already tells the prose model to render only the next local unit and stop at the immediate response point. The blank user field therefore means “no extra narrowing,” not “no stop rule.”

`missing-stop-guidance` must be retired or downgraded to an internal migration-only warning that never blocks. The preferred route is to remove it entirely and replace invalid nonblank stop guidance with specific blockers:

- `stop-guidance-nonlocal`
- `stop-guidance-conflicts-with-launch-directive`
- `stop-guidance-asks-for-future-consequences`

### Immediate handoff

| Context | Required? | Correct behavior |
|---|---:|---|
| First segment | No | The compiler renders `No prior accepted prose. Begin from current authoritative state and the launch directive.` |
| Continuation after accepted segment | Yes | Requires a recent causal bridge, last visible moment, and begin-after point. Must not include accepted prose text. |

For first-segment generation, handoff cannot be a universal blocker because there is no prior accepted prose to hand off from. The current authoritative state and launch directive are sufficient.

For continuation, the handoff is required because accepted prose is not prompt context. The handoff is the deterministic bridge from record-first canon to the next local unit.

### Manual moment directive

`manual_moment_directive.must_render` remains required for Preview and Generate.

User-facing name: **Launch directive**.

Purpose: the author’s immediate local action, intention, pressure, or response point for the next prose unit.

Allowed examples:

- `Have Mara test whether the flour bin has been moved.`
- `Render Niko trying to sound casual while asking about the sealed letter.`
- `Begin from Elin hearing the latch and deciding whether to hide the ledger.`

The directive must not override hard canon, current state, POV/reveal constraints, physical possibility, consent/force conditions, or provider policy.

### Minimum universal current authoritative state

The universal blocker set should be minimal:

| Field | Required universally? | Rationale |
|---|---:|---|
| `current_time` / temporal position | Yes | Local causality needs now. |
| `current_location` / scene-space | Yes | The model needs where the prose begins. |
| `onstage_entities` | Yes | The model needs who/what is immediately present. |
| `immediate_situation_summary` | Yes | The model needs the immediate pressure or settled situation in prose-neutral record terms. |

`immediate_situation_summary` should be added to `current_authoritative_state`. It is not an outline. It is a short deterministic description of the current local situation, such as `Mara is alone in the pantry after hearing a sound near the flour bin.`

All other current-state fields become context-gated.

## Context-gated current-state matrix

The validator must derive requirements from explicit, deterministic inputs only:

- `generation_validation_focus.validation_focus_tags.expected_local_modes`
- `generation_validation_focus.validation_focus_tags.possible_durable_changes`
- story config, especially POV/prose mode and policy envelope
- selected records and their record types/compile destinations
- active working set local functions
- explicit launch directive references when they can be matched by ID/selector, not prose inference

No LLM validation. No semantic guessing from free prose. No quality-feel blockers.

### Expected local modes

| Focus tag | Additional blockers when selected | Warnings when structurally possible but weak |
|---|---|---|
| `dialogue_expected` | Active speaker IDs must be selected; each speaking cast member must have a durable voice anchor; listener/onstage status must be known; POV/prose mode must permit the speech. | Missing current cast voice pressure may warn only if the scene asks for unusual local stress, code-switching, deception, silence, or a temporary override. |
| `ensemble_dialogue_expected` | At least three active speakers if ensemble dialogue is truly expected; durable voice anchors for all required speakers; relationship/status context if direct address depends on hierarchy or secrecy. | Grouped `ensemble-voice-distinction-risk` if local pressure pins are absent or too similar. |
| `introspection_expected` | POV character or omniscient mode must be explicit; non-POV interiority must be forbidden or authorized by prose mode; secrets/protected knowledge cannot be revealed through unavailable interiority. | Weak POV pressure may warn when durable POV voice exists but no current emotional/body pressure is supplied. |
| `physical_interaction_expected` | Positions/visibility/affordances/possessions/locks required only for the actors and objects involved. | Vague physical texture may warn if the action is possible but sensory grounding is thin. |
| `active_silent_presence_expected` | The silent actor’s onstage status, position, visible condition, and physical capacity must be known when their body/presence matters. | Missing nonverbal/silence pressure is a warning unless the directive specifically requires a contradiction-prone silent behavior. |
| `present_minor_speech_possible` | No blocker merely because minor speech is possible. Block only if the launch directive requires a minor cast member to speak and the member lacks a durable voice anchor or promoted active role. | Warn that promotion or a short local pressure row may improve the result. |
| `ambiguous_perception_expected` | Relevant line of sight, hearing/access route, visible conditions, and POV knowledge boundaries must be present. | Warn if the ambiguity is technically possible but cue salience is likely weak. |
| `offstage_interruption_possible` | Offstage actor/institution/entity must exist; route, communication channel, or arrival mechanism must be known; timing must be possible. | Warn if interruption is merely allowed but not launched by directive or current pressure. |
| `nonhuman_or_institutional_pressure_expected` | Institution/entity record, authority/reach mechanism, affected actors, and visible manifestation must be present. | Warn if institutional pressure exists only as broad backstory and may be underused. |
| `secret_or_clue_pressure` | Secret/clue holder/protection/access route must be modeled; POV cannot know protected information unless record says so. | Warn if clue salience is low but no reveal contradiction exists. |
| `non_pov_hidden_plan_behavior` | Hidden plan holder, visibility to POV, current step, and permitted visible behavior must be modeled. | Warn if plan exists but no visible pressure is selected. |

### Possible durable changes

| Durable-change tag | Additional blockers when selected |
|---|---|
| `object_use_possible` | Object identity, current holder/location, usable affordance, and access/visibility must be known. |
| `object_transfer_possible` | Object identity, current holder, recipient, transfer mechanism, consent/force status if contested, and resulting holder/destination must be known. |
| `location_change_possible` | Starting location, target or route/exits, available time, movement constraints, and relevant blockers/locks must be known. |
| `restraint_or_coercion_possible` | Actor/target positions, power relation, consent/force condition, physical capacity, and policy envelope must be known. |
| `intimacy_or_sex_possible` | Consent/force condition, relationship/status constraints, age/policy envelope, location privacy, and allowed prose mode must be known. |
| `violence_or_injury_possible` | Actor/target positions, weapon/object/force mechanism if relevant, injury status, capacity, and policy envelope must be known. |
| `institutional_involvement_possible` | Institution record, authority mechanism, procedure/norm/obligation, affected actors, and visible trigger must be known. |
| `clock_tick_possible` | Current time, clock/threshold, available time, and trigger semantics must be known. |
| `obligation_breach_possible` | Obligation terms, obligated party, current status, deadline/condition, and consequence visibility must be known. |

### Selected records must not over-trigger blockers

A selected record should not activate every possible validation matrix by existing. The active working set is curation, not proof that every affordance will be used.

Blockers may be activated by selected records only when a deterministic contract says the record is required for the selected local mode or durable-change tag. Examples:

- Selecting an `OBJECT` record does not require object-transfer state unless `object_transfer_possible` is selected or the launch directive is bound to that object action by UI structure.
- Selecting a `CAST MEMBER` record does not require a current cast voice pressure row. It requires a durable voice anchor only when the cast member will speak, narrate closely, or carry local voice-bearing presence.
- Selecting a `SPACE` record does not require routes/exits unless movement, interruption, pursuit, visibility, or spatial blocking is selected.

## Current cast voice pressure doctrine

Current cast voice pressure is optional scene-specific salience. It is not the primary voice authority.

Primary voice authority lives in durable `CAST MEMBER` records:

- voice anchor
- speech habits / sample utterances where available
- body presence core
- relationship and emotional records
- POV/prose mode

Current cast voice pressure may warn when:

- dialogue is expected and the prompt is long enough that voice salience may be lost;
- ensemble dialogue is expected and multiple durable voices may blur;
- a temporary condition matters, such as lying, shock, pain, intoxication, ritual formality, silence, or body-language pressure;
- a user supplied a cast voice override without a clear local pressure reason.

Current cast voice pressure may block only when user-supplied current pressure or override text contradicts:

- hard canon;
- current physical state;
- POV/reveal limits;
- provider/content policy;
- durable voice constraints in a way the compiler cannot truthfully reconcile.

The existing universal `sparse-voice-pressure` blocker must be removed. If retained as a warning, it must be renamed and rewritten as something like `local-voice-pressure-may-help`.

## Long dossier warning doctrine

`long-dossier-needs-pin` should not continue as a repeated per-record warning.

Replace it with grouped warnings:

### `cast-salience-risk`

Raised once per readiness result when long active cast dossiers may dilute local voice/body salience.

Payload includes:

- affected cast display labels;
- which have durable voice anchors;
- which lack optional local pressure rows;
- whether dialogue or close POV is expected;
- fastest fix: add a one-sentence current pressure only for the cast member whose local stress matters most.

### `prompt-middle-salience-risk`

Raised when active prompt inputs are large enough that important material may sit in the middle of the prompt.

This is advisory. It should cite the prompt-length estimate and the sections most likely to be diluted.

## Diagnostic code changes

Retire or change severity:

| Current code | Correct action |
|---|---|
| `missing-stop-guidance` | Remove as blocker. Replace invalid nonblank stop guidance with specific local-scope blockers. |
| `missing-immediate-handoff` | Context-gate: blocker only for continuation context. Not first segment. |
| `sparse-voice-pressure` | Remove as universal blocker. Reintroduce as grouped warning only if useful. |
| `long-dossier-needs-pin` | Replace with grouped salience warnings. |
| `missing-current-authoritative-state` | Split into minimum-state blocker and context-gated state blockers. |
| `focus-tag-count-invalid` | Should not appear for missing context after normal defaults/backfill. Keep only for malformed multiple context values. |

## Tests

Validation tests must prove:

- blank `soft_unit_guidance` does not block;
- nonlocal stop guidance still blocks;
- first segment with no handoff compiles with the deterministic first-segment empty state;
- continuation with accepted segments and no handoff blocks;
- missing `must_render` blocks Preview/Generate;
- missing current cast voice pressure does not block when durable voice anchors exist;
- supplied contradictory voice pressure blocks;
- prompt-length and cast-salience warnings do not block;
- selected records alone do not activate unrelated physical/durable blockers;
- each focus tag activates only its deterministic matrix requirements;
- generation context defaulting uses accepted-segment count;
- no warning appears in the compiled prompt.

## Research basis

Long-context research supports salience warnings, not hard blockers. Liu et al. show that models can underuse information in the middle of long contexts, with stronger performance near the beginning and end of prompts. That justifies prompt organization and curation warnings, not arbitrary generation blocking: <https://aclanthology.org/2024.tacl-1.9/>.

Provider prompt-engineering documentation supports clear instructions, structured sections, delimiter/XML-like boundaries, and regression testing. That supports Continuity Loom’s deterministic compiler and readiness tests, not LLM-based validation: <https://platform.openai.com/docs/guides/prompt-engineering>, <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview>.

Interactive drama theory treats agency as meaningful action under material and formal constraints. That supports preserving `must_render` as the user’s immediate launch choice while validating deterministic affordances and constraints around that choice: <https://users.soe.ucsc.edu/~michaelm/publications/mateas-dc-2001.pdf>.
