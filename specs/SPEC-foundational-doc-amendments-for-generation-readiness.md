# SPEC: Foundational Document Amendments for Generation Readiness

Status: proposed doc-amendment spec  
Repository: `joeloverbeck/continuity-loom`  
Baseline commit used for this review: `e1df2d032c7ae7976108f70cafa5802a7398ce39`  
Purpose: describe precise amendments to the existing active Markdown documents; do **not** provide replacement documents.  
Intended consumer: Claude Code or another implementation agent decomposing this into documentation and follow-on implementation tickets.  
Predecessors (this spec supplies their documentation content): `SPEC-generation-brief-draftability-and-save-model.md`, `SPEC-validation-gating-taxonomy-and-focus-matrix.md`, `SPEC-readiness-diagnostics-and-three-page-ux.md`.  
Execution spine: `SPEC-implementation-order-and-regression-plan.md` / `IMPLEMENTATION-ORDER.md`. These amendments are **Phase 7 ("Active docs and user guide")** of that plan and must land *after* the behavioral specs, "once behavior is settled" — updating the docs first would make them describe unimplemented behavior.

---

## 1. Executive decision

Do **not** apply the previously generated active-doc replacements.

Those replacements compressed several constitutional documents into short doctrine summaries. That was the wrong artifact shape. The existing active docs contain large amounts of still-valid project doctrine: record-first continuity, the five continuity surfaces, active working set authority, no accepted prose in prompts, POV/reveal discipline, physical continuity, cast dossiers, mature fiction envelope, OpenRouter/secrets, local-first data ownership, research notes, and alignment checklists. The generation-readiness correction does not invalidate those foundations.

The correct work is surgical amendment:

1. Start from the current repository files.
2. Preserve the existing headings, structure, and still-valid doctrine.
3. Amend only the parts that over-gate generation validation, confuse draft persistence with readiness, or misclassify optional salience fields as blockers.
4. Add missing doctrine where the existing docs do not yet define the draft/readiness split and readiness UX model.
5. Keep the amended docs internally synchronized across schema, compiler contract, prompt template, rationale, user guide, demo recipes, and stress coverage.

The previous compressed replacements may be used only as idea notes. They must not be used as the base for edits.

---

## 2. Audit of the bad replacement strategy

This table is included so future tickets do not repeat the same mistake. The issue is not merely file size; the issue is that canonical sections disappeared without proof that they were obsolete.

| Active doc | Current repo baseline words | Unsafe replacement words | Replacement retained |
|---|---:|---:|---:|
| `docs/FOUNDATIONS.md` | 7,086 | 1,121 | 15.8% |
| `docs/compiler-contract.md` | 4,185 | 593 | 14.2% |
| `docs/story-record-schema.md` | 4,657 | 966 | 20.7% |
| `docs/prompt-template-rationale.md` | 2,437 | 504 | 20.7% |
| `docs/prompt-template.md` | 2,207 | 464 | 21.0% |
| `docs/user-guide.md` | 912 | 589 | 64.6% |
| `docs/demo-blocker-recipes.md` | 341 | 497 | 145.7% |
| `docs/stress-coverage-matrix.md` | 680 | 309 | 45.4% |
| `docs/stress-suite.md` | 3,347 | 242 | 7.2% |

Any ticket that changes an active foundational doc should include a preservation note:

```text
Base file used: current repository file, not generated replacement.
Original headings preserved: yes/no, list exceptions.
Sections removed: none, or list each removed section with reason.
Doctrine changed: list exact concepts changed.
Cross-doc sync completed: yes/no.
```

A documentation PR that reduces one of these active docs by more than roughly 10-15% should be treated as suspicious unless the ticket explicitly says the file is being retired.

---

## 3. Global doctrine that should be amended into the docs

The following decisions remain sound and should be added to the existing docs. They are the actual generation-readiness correction. They are not a license to rewrite the documents wholesale.

### 3.1 Draft persistence is not generation readiness

Saving the generation brief must behave like saving a draft. A generation session may be incomplete and still saveable. Draft saving should fail only for structural/persistence errors such as malformed JSON, invalid enum values that cannot be preserved, impossible record references where the storage model requires referential integrity, or storage failures.

Readiness validation gates Preview, prompt compilation, Generate, and provider send. It must not gate ordinary form persistence.

The app should be able to say:

```text
Draft saved. Preview is blocked by required readiness items.
```

It should not treat ordinary authoring incompleteness as:

```text
Generation brief request is invalid.
```

### 3.2 Blockers must prove deterministic impossibility or contract violation

A blocker is legitimate only when deterministic validation proves one of these:

1. The compiler cannot produce a structurally valid universal prompt.
2. A required prompt contract section would be missing and has no truthful deterministic empty state.
3. Selected records or generation fields contain a hard contradiction.
4. The manual directive requires impossible knowledge, perception, movement, timing, physical action, reveal, or provider-policy violation based on explicit fields.
5. The selected local mode requires state that is deterministically absent.
6. Provider/content-policy configuration is missing or contradictory enough that sending would be unsafe.
7. The prompt would ask the external prose writer to plan, summarize future consequences, produce alternatives, produce branches, or perform nonlocal story-structure work.

Do not classify literary weakness, sparse style, prompt length risk, lack of optional nuance, or possible lost-in-the-middle salience risk as blockers. Those are warnings.

### 3.3 Warnings never block Preview or Generate

Warnings are advisory. They must not disable Preview, Generate, prompt compilation, or draft saving. A warning must explain:

- what may degrade;
- why it is not blocking;
- when it would become blocking;
- the fastest fix;
- when ignoring it is reasonable;
- which field or record is affected using display labels when available.

Raw diagnostic codes belong in technical details, not as the primary author-facing UI.

### 3.4 Generation context is deterministically defaulted

The normalized readiness model must always resolve exactly one generation context:

- `acceptedSegmentCount === 0` -> `first_segment`
- `acceptedSegmentCount > 0` -> `continuation_after_accepted_segment`

This default is not invented story content. It is derived from project state. The selector should remain visible and editable, but a UI-only local default is insufficient. The same value must be available to the saved draft or readiness snapshot so validation cannot raise a false `focus-tag-count-invalid` blocker.

The preferred implementation doctrine is:

1. Put the defaulting rule in shared core normalization.
2. Apply it in the server save route when safe.
3. Apply it defensively in snapshot/readiness construction.
4. Show the resolved value in the UI.

### 3.5 Blank `soft_unit_guidance` is allowed

The universal prompt template already contains a strong local-unit stop rule. `stop_guidance.soft_unit_guidance` should be optional user narrowing, not a universal readiness blocker.

Blank stop guidance means:

```text
No additional user-authored stop preference.
```

The compiler should not invent a stop point. Prefer omitting the optional soft-unit line entirely when no user guidance exists, leaving the universal stop rule intact. If technical constraints make omission awkward, render a deterministic, non-story empty state such as `None supplied.`

Stop guidance can still block when supplied text is nonlocal or contradictory, for example if it asks for a whole chapter, options, branches, a downstream consequence summary, an arc/beat package, or continuation through multiple response points.

### 3.6 Manual directive remains readiness-required

`manual_moment_directive.must_render` is the author’s immediate launch choice. It is analogous to an interactive-fiction player action: “do this now,” not “outline the plot.”

It remains a true readiness blocker if empty. It does not block draft saving.

The docs and UI should describe it as an immediate launch action/intent/pressure, with examples such as:

```text
Have Mara open the cellar door.
Render the next immediate beat from Ken’s intention to lie.
Let the child notice the flour on the latch.
```

The directive cannot override hard canon, current state, POV/reveal limits, physical possibility, or provider policy.

### 3.7 Immediate handoff is context-gated

For `first_segment`, handoff fields are optional. The compiler can truthfully render an empty state equivalent to:

```text
No prior accepted prose. Begin from current authoritative state and the manual directive.
```

For `continuation_after_accepted_segment`, a user-authored recent causal bridge or begin-after point is required. The prompt still must not include accepted prose text, rejected candidate text, superseded regeneration text, or automatic prose-derived summaries.

### 3.8 Current authoritative state has a minimal universal floor plus context-gated requirements

The universal readiness floor should be reduced to what every valid local prompt needs:

1. current time or temporal position;
2. current location or scene-space;
3. onstage/materially relevant entities;
4. immediate situation summary.

Fields such as positions, routes, exits, line of sight, available time, possessions, locks, consent/force conditions, environmental constraints, and offstage interruption routes become blockers only when explicit focus tags, selected records, story config, or manual directive make them structurally necessary.

No LLM-based validation, semantic inference from prose, hidden judgement calls, or taste heuristics may create a blocker.

### 3.9 Durable cast dossiers are primary voice authority

Current cast voice pressure is scene-specific salience reinforcement. It is not the primary source of character voice. Durable CAST MEMBER fields remain the stable voice/behavior authority.

Current cast voice pressure may warn when unusual local voice/body stress is expected and the author may want a pin. It should block only when explicit data is contradictory or when the selected local mode requires voice/body authority and there is no durable or compressed source from which to render safely.

Repeated per-record warnings such as `long-dossier-needs-pin` should be grouped and rewritten as actionable salience warnings.

### 3.10 The three generation pages share one readiness model

Generation Brief, Preview, and Generate should not maintain separate interpretations of validation. The readiness model should drive all three surfaces.

Workflow doctrine:

1. Save generation brief drafts freely.
2. Always show readiness status.
3. Preview is disabled only by true story/compiler readiness blockers.
4. Generate is disabled by true readiness blockers or provider configuration blockers.
5. Warnings remain advisory.
6. The user should understand whether the issue is unsaved state, missing structural story state, missing launch directive, provider/API configuration, optional quality warning, or technical diagnostic.

---

## 4. File-by-file amendment plan

### 4.1 `docs/FOUNDATIONS.md`

#### Preservation requirement

Preserve the existing document as the constitutional baseline. Keep the current structure and sections 1-30 unless a ticket explicitly proves a section is obsolete. The generation-readiness work should amend the constitution, not replace it.

#### Amend section 3, `Core loop`

The current loop implies validation happens before generation and blocks generation. Keep that, but add draft persistence explicitly.

Required doctrine to add:

```md
Generation-time brief editing has a draft state. Saving an incomplete generation brief is ordinary authoring work and must not be blocked by generation-readiness validation. Deterministic validation gates prompt preview, deterministic compilation, OpenRouter sending, and candidate generation. It does not gate basic persistence of a structurally saveable draft.
```

Revise the workflow steps so they distinguish:

- save draft;
- run readiness;
- fix blockers;
- preview/compile/send only when ready.

Do not remove the human-accepted-prose loop, durable-change reminder, or no-accepted-prose doctrine.

#### Amend section 4.5, `Fail closed`

The existing `Fail closed` doctrine is directionally right but too broad if read as “anything risky blocks everything.” Change it to fail closed for prompt generation and sending only.

Required doctrine:

```md
Fail closed applies to prompt compilation, prompt preview availability where no valid prompt can be compiled, and provider sending. It does not mean incomplete generation-time drafts cannot be saved. It does not let advisory warnings block Preview or Generate. Quality, salience, and prompt-length risks are warnings unless they also prove a structural prompt-contract failure, hard contradiction, policy conflict, or deterministic impossibility.
```

Remove or soften any phrase implying “dangerous prompt-quality gaps” are blockers. Quality gaps should be warnings unless they fit the blocker taxonomy.

#### Amend section 6.3, `Generation-time brief`

Add the draft/readiness split:

```md
The generation-time brief has two operational states: draft and ready. Draft fields may be partial, blank, or locally inconsistent while the author is working. The app may show readiness diagnostics while the draft is incomplete, but it must still preserve the author’s partial work. Ready state is the normalized input used for prompt preview, compilation, and generation.
```

Add that deterministic defaults, especially `generation_context`, are allowed when derived from project state and do not invent story content.

#### Amend section 8, `Deterministic prompt compilation`

Add that compilation consumes a normalized ready model, not raw UI state and not an unsaved local-only default.

Required doctrine:

```md
The compiler receives a normalized readiness input. Normalization may apply deterministic non-story defaults, such as first-segment vs continuation derived from accepted-segment count. Normalization must not invent story facts, handoff prose, current situation, routes, positions, voice pressure, or directive content.
```

#### Amend section 9, `Universal prose prompt contract`

Add that the universal stop rule is part of the constitutional prompt contract and does not depend on `soft_unit_guidance` being filled.

Required doctrine:

```md
The universal prompt always contains the local-unit stop rule. Optional stop guidance may narrow that local unit for the current generation, but blank optional stop guidance is not a structural prompt failure. Nonlocal or contradictory supplied stop guidance remains a blocker.
```

#### Amend section 11, `Validation and hard fails`

Add the blocker taxonomy from section 3.2 of this spec. Also state that readiness diagnostics must be author-actionable and cannot use raw codes as the primary message.

Remove the existing hard-fail bullet `missing stop guidance;` from the §11 hard-validation list. The universal stop rule makes blank `soft_unit_guidance` non-blocking (see section 3.5); leaving this bullet would make the amended constitution contradict itself. Retain `missing manual directive;`. (Note: this prose bullet is distinct from the `missing-stop-guidance` validation code in section 5.1; both must be addressed.)

Make explicit:

- warnings never compile into the prompt;
- warnings never block Preview or Generate;
- validation cannot use an LLM;
- validation cannot infer semantics from prose to create hidden blockers;
- deterministic threshold warnings are allowed only as warnings.

#### Amend section 16, `Physical continuity`

Preserve the physical continuity doctrine, but clarify that not every physical field is universal. The minimum current state is universal; detailed spatial/affordance fields are context-gated.

Required doctrine:

```md
Physical continuity is hard authority when the selected local mode involves bodies, movement, object use, transfer, pursuit, intimacy, violence, restraint, entrance, interruption, perception, or timing. The absence of detailed routes, line of sight, possessions, locks, or force conditions should not block a quiet minimal opening unless an explicit tag, selected record, or manual directive makes that detail structurally necessary.
```

#### Amend section 17, `Character voice and cast dossiers`

Preserve character voice as continuity. Correct current voice pressure requiredness.

Required doctrine:

```md
Durable CAST MEMBER records are the primary voice and behavior authority. Current cast voice pressure is optional scene-specific salience reinforcement or temporary emphasis. It may help in dialogue-heavy, ensemble, close-POV, or silent-body-pressure moments, but its absence is not normally a blocker when durable voice/body anchors are sufficient. It blocks only when supplied pressure contradicts hard canon/POV/physical continuity/policy, or when the selected local mode requires voice/body authority and no durable or compressed authority exists.
```

#### Amend section 27, `UI and workflow principles`

Add readiness checklist doctrine.

Required doctrine:

```md
Author-facing generation diagnostics should be presented as a readiness checklist, not as raw validation codes. The same readiness model must drive Generation Brief, Prompt Preview, and Generate. Draft saving should show whether the draft saved and whether Preview/Generate remain blocked. Warnings should explain what may degrade and why ignoring them may be reasonable.
```

#### Amend section 29, `Alignment checklist for future specs and tickets`

Add checks for:

- draft saving is not blocked by readiness;
- Preview/Generate are blocked only by true blockers;
- blank `soft_unit_guidance` is allowed;
- `manual_moment_directive.must_render` remains readiness-required;
- `generation_context` defaults deterministically;
- current cast voice pressure is optional unless contradiction/no voice authority;
- warnings cannot gate.

---

### 4.2 `docs/story-record-schema.md`

#### Preservation requirement

Preserve the record taxonomy and the existing schema philosophy. Do not collapse the document into a generation-session-only schema. Most of the current record definitions remain valid and are outside the generation-readiness correction.

#### Amend section 3, `Generation-time brief`

Add a new subsection before `3.1 ACTIVE WORKING SET`:

```md
### 3.0 Draft and ready generation session shapes

Generation-time fields have a draft shape and a ready shape.

`GenerationSessionDraft` is the persistence shape. It may contain partial nested objects, blank optional strings, empty arrays, and missing readiness fields. It must preserve the author’s work even when Preview and Generate are blocked.

`GenerationSessionReadyInput` is the normalized validation and compiler input. It is produced from the saved draft, selected records, story configuration, accepted-segment count, provider configuration where relevant, and deterministic empty-state/default rules. It may default non-story values such as `generation_context`; it must not invent story facts, handoff prose, routes, positions, current situation, voice pressure, or manual directive content.
```

Schema-level principle:

- Draft schema should be permissive enough for normal form work.
- Ready schema should be strict enough for compiler safety.
- Storage validation and generation readiness validation are separate concerns.

#### Amend section 3.2, `CURRENT AUTHORITATIVE STATE`

The current section labels every field as required. That is the core over-gating bug. Change the field list into categories.

Recommended replacement for the requiredness paragraph, while preserving the field catalog:

```md
Readiness-required universal fields:

- `current_time`: prose or timestamp-like string;
- `current_location`: location id, scene-space id, or prose location/scene-space label;
- `onstage_entities`: list of entity ids or an explicit none/abstract state when the local unit has no material entities;
- `immediate_situation_summary`: concise prose describing what is happening now and why the next local unit can begin.

Context-gated fields:

- `offstage_pressuring_entities` is required when offstage pressure, interruption, communication, pursuit, or institutional action can matter.
- `positions` is required when physical interaction, line of sight, movement, intimacy, violence, object transfer, turn-taking, or blocking can matter.
- `possessions` is required when object use, transfer, search, concealment, theft, weapon use, or carried-object continuity can matter.
- `visible_conditions` is required when injury, restraint, disguise, exhaustion, intoxication, status, or other visible condition can affect the local unit.
- `environmental_conditions` is required when environment constrains action, perception, tone, danger, route, or affordance.
- `entity_statuses` is required for materially involved entities whose agency, consciousness, availability, captivity, injury, age/status, or presence matters.
- `line_of_sight_and_visibility` is required when perception, secrecy, ambiguous perception, violence, intimacy, interruption, or who-can-see/hear-whom matters.
- `routes_and_exits` is required when movement, pursuit, escape, entrance, interruption, location change, or containment matters.
- `available_time` is required when a clock, interruption, deadline, pursuit, timed action, or temporal impossibility can matter.
- `consent_or_force_conditions` is required when intimacy, sex, restraint, coercion, object seizure, rescue movement, violence, captivity, or power-limited agency can matter.
- `current_locks` is required when a lock/constraint exists or when the directive could contradict a lock.
```

Add `immediate_situation_summary` to the field catalog. This is not a plot outline. It is the immediate state bridge needed to prevent the external prose writer from fabricating the initial situation.

#### Amend section 3.3, `IMMEDIATE HANDOFF`

Keep the field names but change requiredness:

```md
For `first_segment`, all handoff prose fields are optional. The compiler renders a deterministic first-segment empty state when no prior accepted prose exists.

For `continuation_after_accepted_segment`, a user-authored handoff is required. The required continuation handoff must include a recent causal bridge and either a last visible moment or a begin-after point. It must not include verbatim accepted prose, rejected candidate prose, superseded regeneration prose, or automatic prose-derived summaries.
```

Do not allow the docs to imply accepted prose can become prompt context.

#### Amend section 3.4, `MANUAL MOMENT DIRECTIVE`

Preserve `must_render` as readiness-required. Add draft caveat:

```md
`must_render` is required for readiness, prompt preview, compilation, and generation. It may be blank in a saved draft. Blank `must_render` produces a readiness blocker, not a draft-save failure.
```

Add UI guidance examples or cross-reference `user-guide.md`.

#### Amend section 3.5, `CURRENT CAST VOICE PRESSURE`

Replace “required when active/onstage character is expected to speak materially” with conditional doctrine that respects durable cast dossiers.

Required doctrine:

```md
Current cast voice pressure is optional scene-specific salience reinforcement. Durable CAST MEMBER voice and behavior fields are the primary authority. Current pressure is recommended for unusual local stress, ensemble turn-taking, close POV voice pressure, or silent physical presence that needs emphasis. It is not normally required when the durable dossier already gives enough voice/body authority.

It blocks only when supplied current pressure contradicts hard canon, current state, POV/reveal constraints, physical continuity, or provider policy; or when a selected local mode requires voice/body authority and neither durable cast fields nor compressed present-minor guidance can supply it.
```

Change the existing hard “Required when...” bullets into “Recommended when...” bullets, plus the blocking exceptions above.

#### Amend section 3.7, `GENERATION VALIDATION FOCUS`

Keep focus tags. Change generation-context requiredness to normalized readiness:

```md
Exactly one `generation_context` value is required in `GenerationSessionReadyInput`. A draft may omit it. Normalization defaults it from accepted-segment count: no accepted segments means `first_segment`; one or more accepted segments means `continuation_after_accepted_segment`.
```

Add that focus tags must be user-selected or deterministically derived from explicit controls/records, never from LLM interpretation of prose.

#### Amend section 3.8, `STOP GUIDANCE`

Change from required to optional:

```md
`soft_unit_guidance` is optional user narrowing for the current generation. Blank or missing stop guidance does not block readiness because the universal prompt contains the local-unit stop rule. If supplied, `soft_unit_guidance` must be local, must not ask for branches/options/outlines/future summaries, and must not contradict the manual directive.
```

Remove the rule “Blocks generation if blank.” Preserve blocking for nonlocal/contradictory supplied guidance.

#### Amend section 10, `Compiler contract and minimum prompt completeness`

Change the minimum completeness list so it matches the new requiredness:

- current authoritative state has a universal minimum plus context-gated requirements;
- immediate handoff is required only for continuation;
- stop guidance is optional;
- manual directive remains required;
- current cast voice pressure is optional unless needed because no durable/compressed voice authority exists.

#### Amend section 11, `Validation blockers and warnings`

Update blocker examples:

- remove blank `soft_unit_guidance` as a blocker;
- remove generic missing current cast voice pressure as a blocker;
- retain nonlocal directive/stop guidance blockers;
- retain accepted-prose contamination blockers;
- retain physical/knowledge/policy contradictions;
- reclassify long dossier/current pin concerns as grouped warnings.

Add diagnostic metadata requirements, either in section 11 or a new subsection:

```ts
interface DiagnosticAuthorSurface {
  code: string;
  severity: "blocker" | "warning" | "info";
  group: "required" | "provider" | "recommended" | "salience" | "technical";
  title: string;
  summary: string;
  whyBlocks?: string;
  whatMayDegrade?: string;
  whyNotBlocking?: string;
  whenBecomesBlocking?: string;
  fastestFix: string;
  ignoreGuidance?: string;
  affected: AffectedTarget[];
  technicalDetails?: unknown;
}
```

This is conceptual schema, not necessarily final TypeScript.

---

### 4.3 `docs/compiler-contract.md`

#### Preservation requirement

Preserve the compiler contract structure: purpose, source hierarchy, section order, exhaustive placeholder mapping, minimum completeness, validation matrix, rendering, empty states, prompt-facing vs validation-only fields, and change-control rule. This file is a bridge document; do not compress it.

#### Add requiredness terminology near section 4

Add definitions before the placeholder mapping:

```md
Requiredness terms:

- Draft-save required: necessary for storing a structurally valid draft.
- Readiness required: blocks prompt preview/compilation/generation when missing after normalization.
- Context-gated required: readiness-required only when explicit focus tags, selected records, story configuration, or manual directive make the state structurally necessary.
- Optional prompt preference: may compile if supplied; blank/missing state has a truthful deterministic omission or empty state.
```

#### Amend section 2, `Source hierarchy`

Add normalized readiness input as the compiler source, rather than raw UI state:

```md
The compiler consumes `GenerationSessionReadyInput`, produced by deterministic normalization from saved draft state, story configuration, active working set, accepted-segment count, and selected records. It does not consume UI-only defaults.
```

Do not weaken the no-LLM, no-accepted-prose, no-inactive-records source rules.

#### Amend section 4, placeholder mapping

Make these row-level changes while preserving the full table.

| Placeholder/area | Required amendment |
|---|---|
| `{current_time}` | Readiness required. |
| `{current_location}` | Readiness required; allow scene-space/prose label where no LOCATION record exists yet. |
| `{onstage_entities}` | Readiness required for material prose; allow explicit deterministic empty state only for abstract/non-material first prose if the app supports that mode. |
| new `{immediate_situation_summary}` | Add row. Readiness required. Source: `CURRENT AUTHORITATIVE STATE.immediate_situation_summary`. Missing behavior: blocker. Empty state: none. |
| `{positions}` | Context-gated required, not universal. Required for physical interaction, blocking, object transfer, turn-taking/audibility, intimacy, violence, movement, restraint, or line-of-sight-sensitive moments. |
| `{entity_statuses}` | Required for materially involved entities where agency/status matters; not a universal blocker for an entity-free/abstract opening. |
| `{possessions}` | Context-gated required when objects can matter. |
| `{visible_conditions}` | Context-gated required when visible condition affects continuity; otherwise optional/warning. |
| `{environmental_conditions}` | Context-gated required only when environment constrains local action/perception; otherwise optional/warning. |
| `{line_of_sight_and_visibility}` | Context-gated required for perception, secrecy, violence, intimacy, interruption, ambiguous perception, or who-can-see/hear-whom. |
| `{routes_and_exits}` | Context-gated required for movement, pursuit, escape, interruption, entrance, location change, containment. |
| `{available_time}` | Context-gated required when timing matters. |
| `{consent_or_force_conditions}` | Context-gated required for intimacy/sex, restraint, coercion, object seizure, rescue movement, violence, captivity, or constrained agency. |
| `{current_locks}` | Required when locks/constraints exist or directive could contradict them. |
| immediate handoff placeholders | First segment: optional deterministic empty state. Continuation: user-authored recent causal bridge plus last visible moment or begin-after required. |
| `{manual_must_render}` | Readiness required; draft may save blank. |
| `{soft_unit_guidance}` | Optional prompt preference. Blank does not block. Prefer conditional omission of the soft-unit line; otherwise render a deterministic non-story empty state. Supplied nonlocal/contradictory text blocks. |
| `{active_cast_voice_pressure_pins}` | Optional salience block. Missing pins do not block when durable cast dossiers/compressed minor notes are sufficient. Contradictory supplied pins block. Missing voice authority blocks only when local mode requires speech/POV/body presence and no durable/compressed authority exists. |
| `validation_focus_tags` | Validation-only. Exactly one generation context after normalization. Missing draft value defaults by accepted-segment count. |

#### Amend section 5, `Universal minimum prompt completeness`

Replace the current universal list with this shape:

1. Constitutional template sections always compile: role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction.
2. Story configuration is populated enough to avoid a generic story prompt and to satisfy provider/content boundaries.
3. Current authoritative state has the universal floor: time/temporal position, location/scene-space, onstage/material entities, immediate situation summary.
4. Manual directive `must_render` is present and local.
5. Generation context is resolved by normalization.
6. First segment can compile without continuation handoff. Continuation requires user-authored handoff.
7. Blank stop guidance is allowed; supplied stop guidance must be local and noncontradictory.
8. Non-omniscient POV requires a populated POV knowledge profile when a POV entity is involved.
9. Active secrets/reveal constraints require deterministic holder/non-holder/reveal-permission data when selected or relevant.
10. Context-gated physical, knowledge, cast, object, movement, violence, intimacy, institutional, clock, and obligation requirements apply only when explicit tags/records/directive make them structurally necessary.
11. Accepted prose/candidate contamination never appears in prompt-facing fields.

#### Amend section 6, `Generation validation matrix`

Keep the matrix, but update rows with over-gating:

- `first_segment`: no continuation handoff required; launch state must be self-sufficient.
- `continuation_after_accepted_segment`: user-authored handoff required; accepted prose text still banned.
- `dialogue_expected`: current voice pressure is not automatically required if durable voice anchors are sufficient.
- `ensemble_dialogue_expected`: distinct voice pins should usually warn unless durable anchors are missing or turn-taking/audibility/relationship state is absent.
- `active_silent_presence_expected`: body/visibility/allowed-action authority is required if the silent character materially affects the prose; current silence pressure is recommended, not universal.
- `present_minor_speech_possible`: block only if material speech is expected and neither promotion nor compressed voice note exists.
- physical/object/location/force/intimacy/violence rows remain strong blockers when explicit tags make missing state structurally impossible.

#### Amend section 7, `Blocker/warning rendering`

Add author-facing readiness item fields and deduplication rules. Raw code first is banned.

Required author-facing warning model:

```text
Title
What may degrade
Why this is not blocking
When it would become blocking
Fastest fix
Ignoring is reasonable when
Affected labels
Technical code in details
```

#### Amend section 8, `Empty-state rendering rules`

Add:

```md
Optional prompt-preference fields may be omitted entirely when blank if the surrounding universal instruction remains structurally complete. Empty-state rendering is required only when omission would make the prompt ambiguous or structurally malformed.
```

This is important for blank `soft_unit_guidance`: the best prompt is usually the universal stop rule with no extra empty sentence.

---

### 4.4 `docs/prompt-template.md`

#### Preservation requirement

Preserve the full universal prompt template. Do not replace it with a simplified prompt. The current template contains extensive valid instructions around authority, content policy, POV knowledge, secrets, active working set, cast dossiers, physical continuity, invention permissions, contradiction prohibitions, prose craft, stop rule, and output format.

#### Amend `<current_authoritative_state>`

Add a line near the top:

```md
Immediate situation: {immediate_situation_summary}
```

Keep the existing detailed lines. Their placeholders remain available, but requiredness is context-gated in the compiler contract.

#### Amend `<immediate_handoff>`

Keep the section because it is useful and transparent. Ensure first-segment empty states are truthful and do not imply missing required context.

Required compiler behavior to document here or in comments around the template:

```md
For first-segment generation, missing handoff fields render deterministic first-segment empty states and do not block. For continuation, these fields must be user-authored and must not include accepted prose.
```

#### Amend `<active_working_set>` current voice pressure language

The `<active_working_set>` voice-pressure prose already states the pins are optional salience duplicates:

```text
Voice pressure pins are current-generation salience duplicates for dialogue, POV narration, nonverbal behavior, silence, and turn-taking where relevant. They do not replace the full active cast dossiers. If a current-generation voice override is included in a pin, apply it only within the scope stated there.
```

This requiredness framing is already correct and needs no doctrinal change. The only adjustment is empty-pin behavior: if `{active_cast_voice_pressure_pins}` is empty, the compiler should either omit the pins sub-block or render a concise deterministic empty state, and the surrounding prose must not command the model to use nonexistent pins. The misleading "Use active cast voice anchors, current voice pressure pins, …" phrasing that implies pins always exist lives in `<prose_craft>`, not here — correct it there (next subsection). The requiredness correction itself belongs to the schema and compiler contract (sections 4.2 and 4.3).

#### Amend `<prose_craft>` voice sentence

Revise:

```text
Use active cast voice anchors, current voice pressure pins, and speech-pattern peculiarities.
```

To:

```text
Use active cast voice anchors, speech-pattern peculiarities, body/behavior dossiers, and any supplied current voice pressure pins.
```

#### Amend `<stop_rule>`

Do not require a filled soft-unit line.

Preferred template shape:

```md
<stop_rule>
Render only the next local unit of causally connected forward motion.

[If user stop guidance is supplied:]
Additional user stop guidance:
{soft_unit_guidance}

Stop as soon as one of these occurs:
...
</stop_rule>
```

The bracketed line is documentation for deterministic conditional rendering, not text to send literally. If no `soft_unit_guidance` exists, omit the optional block and keep the universal stop triggers.

If implementation cannot support conditional omission immediately, use this temporary deterministic empty state:

```text
Additional user stop guidance: None supplied.
```

Do not generate story-specific stop guidance when the field is blank.

---

### 4.5 `docs/prompt-template-rationale.md`

#### Preservation requirement

Preserve the current rationale sections. The existing rationale explains why the prompt is a Markdown/XML hybrid, why current state is separate from handoff, why accepted prose is excluded, why durable voice anchors differ from current pins, why secrets have lanes, why warnings stay outside prompts, and why a compiler contract is warranted. Those explanations remain valuable.

#### Amend section 5, `Why current authoritative state is separate from immediate handoff`

Add first-segment vs continuation behavior:

```md
First-segment generation may have no prior accepted prose and therefore no continuation handoff. In that case, current authoritative state plus manual directive are sufficient to launch if the universal current-state floor is populated. Continuation after accepted prose needs a user-authored handoff because the prompt deliberately excludes accepted prose text.
```

#### Amend section 6, `Why prior accepted prose status or handoff note stays narrow`

Add:

```md
A handoff note is not a prose archive substitute. It is a user-authored bridge from the last accepted durable/current state into the next local unit. It may describe current facts caused by accepted prose only after the author has accepted responsibility for those facts as records or current state. It must not quote accepted prose.
```

#### Amend section 10, `Why durable voice anchors are separate from current voice pressure pins`

Add the corrected requiredness:

```md
Durable CAST MEMBER fields are the primary voice authority. Current pins exist to duplicate or emphasize local pressure when salience matters. They should not be required merely because a character is active; otherwise the app forces authors to restate durable voice work every generation. Missing pins are usually warnings, not blockers.
```

#### Amend section 19, `Why the stop rule replaces beat counts`

Add:

```md
Because the universal stop rule already defines the local prose boundary, blank `soft_unit_guidance` is not a prompt-contract failure. Optional user stop guidance should narrow a specific generation only when the author has a more precise boundary in mind.
```

#### Amend section 20, `Why generation validation focus tags are validation-only by default`

Add deterministic defaulting:

```md
Generation context is validation-facing but must be resolved consistently. It may be defaulted from accepted-segment count because that is project state, not story invention. Other focus tags should come from explicit user controls or structured selections, not LLM interpretation.
```

#### Amend section 21, `Why warnings must not enter the prompt`

Add:

```md
Warnings also must not indirectly gate Preview or Generate. If a warning is serious enough to block, it is misclassified and must be rewritten as a deterministic blocker with a specific contract failure. Otherwise it remains advisory.
```

#### Add a short new rationale section, if acceptable

Add near the end:

```md
## Why draft saving is separate from readiness

Authors often need to save partial generation-time context before they can fix readiness issues. Treating the final ready schema as the draft persistence schema creates a hostile workflow and can trap the user outside the form state needed to repair blockers. Draft persistence protects author work. Readiness protects prompt compilation and provider sending.
```

---

### 4.6 `docs/user-guide.md`

#### Preservation requirement

Preserve the guide’s simple author-facing tone. This file can grow more than the others because it is currently short and lacks generation-readiness guidance.

#### Add or amend under `The Loop`

Add a concrete generation workflow:

```md
You can save a Generation Brief before it is ready to generate. Saving preserves your draft. Preview and Generate become available only after required readiness items are fixed.
```

#### Add a new section: `Generation Readiness`

Required content:

- Draft saved vs ready to preview/generate.
- Blockers vs warnings.
- Warnings never block.
- Raw technical codes live in details.

Suggested wording:

```md
A blocker means the app cannot safely compile or send the prompt yet. A warning means generation is possible, but output may be weaker or less focused. Warnings do not block Preview or Generate.
```

#### Add guidance for key fields

Add concise user-facing explanations:

- `Generation context`: defaults from whether accepted prose exists, but remains visible.
- `Current state`: minimum is time, place/scene-space, onstage entities, and what is happening now.
- `Manual moment directive`: required launch action; examples; not a plot outline.
- `Stop guidance`: optional; blank uses the universal local stop rule.
- `Immediate handoff`: usually only required for continuation after accepted prose.
- `Current cast voice pressure`: optional local emphasis; durable cast profiles remain primary.

#### Amend FAQ

Add FAQ entries:

```md
### Why can I save a brief that still has blockers?
Because saving protects your draft. Blockers only prevent prompt preview and generation.

### Do I have to fill stop guidance?
No. The prompt always includes a universal local stop rule. Fill stop guidance only when you want a narrower boundary for this generation.

### Why is the app asking for a manual directive?
The external prose writer should render your next chosen local action or pressure, not choose the story’s next move for you.
```

---

### 4.7 `docs/demo-blocker-recipes.md`

#### Preservation requirement

This file is short and can be expanded substantially. The goal is concrete examples for demos and tests, not constitutional breadth.

#### Add true blocker recipes

Include recipes for:

1. Missing manual directive blocks Preview/Generate but draft saves.
2. Missing universal current-state floor blocks readiness.
3. Continuation after accepted segment missing handoff blocks readiness.
4. Supplied stop guidance asks for chapter/options/branches/future summary; blocks.
5. Physical interaction tag missing positions/visibility/object state; blocks.
6. Secret reveal focus missing holder/non-holder/reveal permission; blocks.
7. Provider settings missing; blocks Generate, not necessarily Preview.

#### Add non-blocking warning recipes

Include recipes for:

1. Blank `soft_unit_guidance`; no diagnostic or info only, not blocker.
2. Long active cast dossiers; grouped salience warning, not blocker.
3. Missing current voice pressure pins with durable anchors present; optional warning only when local mode makes salience risk real.
4. Sparse setting texture; warning if relevant, not blocker.
5. No active clock/open thread in a quiet scene; warning at most, often no diagnostic.

Each recipe should say:

- setup;
- expected readiness result;
- expected author-facing copy;
- expected technical code;
- expected affected target display behavior.

---

### 4.8 `docs/stress-coverage-matrix.md`

#### Preservation requirement

Preserve existing coverage categories and add readiness/draftability coverage. Do not shrink this file.

#### Revise existing rows that cite reclassified codes

The live matrix is a four-column, case-indexed table: `| # | Stress case | Risk area | Implemented v1 capability |`. Two pairs of existing rows cite codes this correction reclassifies and must be updated, not merely supplemented:

- **Case 7** and **Case 26** list `missing-stop-guidance` as an implemented v1 capability — revise so blank `soft_unit_guidance` no longer reads as a blocker (the universal stop rule remains compiled).
- **Case 12** and **Case 15** list `long-dossier-needs-pin` — revise to the grouped salience warning model.

#### Add a readiness/draftability coverage sub-section

Do **not** append the rows below to the case-indexed table; the columns differ. Add them as a new sub-section/table titled "Readiness and draftability coverage" with columns `| Coverage area | Required proof |`:

| Coverage area | Required proof |
|---|---|
| Draft save with blockers | Incomplete generation brief saves; readiness reports blockers separately. |
| Blank stop guidance | Does not block; universal stop rule remains compiled. |
| First-segment default | No accepted prose defaults to `first_segment`; no continuation handoff required. |
| Continuation default | Accepted prose count > 0 defaults to continuation; user-authored handoff required. |
| Manual directive required | Blank `must_render` blocks Preview/Generate but not draft save. |
| Current-state universal floor | Time/place/onstage/situation required. |
| Physical context gating | Detailed physical fields block only under relevant tags/records/directive. |
| Voice pressure optionality | Durable cast voice anchors satisfy normal voice authority; current pins are warnings unless no authority/contradiction. |
| Warning deduplication | Long-dossier or salience warnings group by cause and show display labels. |
| Three-page shared readiness | Generation Brief, Preview, Generate show same readiness interpretation. |
| Provider separation | Provider blockers are separate from story readiness and block Generate specifically. |

---

### 4.9 `docs/stress-suite.md`

#### Preservation requirement

Preserve the existing 26 stress cases. They are valuable. Do not replace them with a short gate list.

#### Amend existing cases

Add expected readiness outcomes to these cases:

- **Case 7 — First segment with minimal records**: should pass with blank stop guidance and blank continuation handoff if universal current-state floor and manual directive are present.
- **Case 8 — Continuation after accepted segment**: should block when user-authored handoff is missing; should not include accepted prose in prompt.
- **Case 12 — Large active cast salience stress**: should produce grouped salience warnings, not repeated blockers.
- **Case 14 — Dialogue-only voice distinction**: durable cast voice anchors should satisfy readiness; current voice pressure pins are optional unless durable anchors are missing.
- **Case 15 — Ensemble scene with subtle voice contrast**: warn for salience/turn-taking risk when appropriate; block only missing speaker/audibility/relationship/voice authority, not missing optional pins.
- **Case 21 — Active silent cast with strong body/presence**: require position/visibility/body authority when silent presence materially matters; current silence pressure is recommended unless durable body presence is absent.
- **Case 26 — Stop-rule response point without over-continuation**: blank soft guidance should still enforce the universal stop rule.

#### Add new cases if the file accepts expansion

Add cases 27-31:

1. **Draft save despite readiness blockers**: blank `must_render`, blank stop guidance, missing optional handoff. Save succeeds; readiness blocks only missing manual/current-state fields.
2. **Generation context default mismatch prevention**: UI shows first segment, persisted snapshot also normalizes first segment, no false `focus-tag-count-invalid`.
3. **Continuation default from accepted-segment count**: one accepted segment creates continuation context; missing handoff blocks readiness.
4. **Provider-only block**: story readiness is ready; Generate blocked by missing provider settings; Preview still available.
5. **Deduplicated long dossier warning**: many long active cast records produce one grouped warning with display labels.

---

### 4.10 `docs/ACTIVE-DOCS.md`

This spec is part of a five-document generation-readiness set — the three behavioral specs (draftability/save, validation-gating, readiness-diagnostics), the regression-plan spec, and `IMPLEMENTATION-ORDER.md` — none of which currently appears in `docs/ACTIVE-DOCS.md`. Add the set (or at minimum this spec plus `IMPLEMENTATION-ORDER.md`) to the active-doc index so change-intake routes through it per `CLAUDE.md`. If the team deliberately keeps these as `specs/`-only planning artifacts outside the active index, record that decision here instead of leaving the index silently incomplete.

---

### 4.11 `docs/archival-workflow.md`

No required change for this mission.

---

## 5. Cross-document conflict cleanup checklist

When editing docs, search the active docs for these phrases or concepts and revise them to match the new doctrine.

### 5.1 Stop guidance conflicts

Search for:

```text
stop guidance is required
soft_unit_guidance is required
Blocks generation if blank
missing-stop-guidance
missing stop guidance
```

(`missing stop guidance` without the hyphen is the FOUNDATIONS §11 hard-fail bullet; `missing-stop-guidance` is the validation code. Search for both.)

Correct to:

```text
Stop guidance is optional user narrowing. Blank stop guidance does not block because the universal stop rule remains. Supplied nonlocal or contradictory stop guidance blocks.
```

### 5.2 Voice pressure conflicts

Search for:

```text
current cast voice pressure required
voice pressure pins required
long-dossier-needs-pin
active speaker lacks enough voice anchor/current voice pressure
```

Correct to:

```text
Durable cast voice anchors are primary. Current pins are optional salience reinforcement unless no durable/compressed voice authority exists or supplied pins contradict higher authority.
```

For `long-dossier-needs-pin`, rewrite as a grouped salience warning, not a per-record raw warning.

### 5.3 Draft/readiness conflicts

Search for:

```text
generation brief request is invalid
validation blocks save
required for storage
```

Correct to:

```text
Draft persistence accepts incomplete generation-time fields. Readiness validation gates Preview/Generate.
```

### 5.4 Generation context conflicts

Search for:

```text
Exactly one generation_context value is required
focus-tag-count-invalid
```

Correct to:

```text
Exactly one generation context is required after normalization. Drafts may omit it. It defaults from accepted-segment count.
```

### 5.5 Current authoritative state conflicts

Search for any universal list implying all of these are always required:

```text
positions
possessions
visible_conditions
environmental_conditions
line_of_sight_and_visibility
routes_and_exits
available_time
consent_or_force_conditions
current_locks
```

Correct to universal floor plus context-gated requirements.

### 5.6 Warning/gating conflicts

Search for:

```text
warnings block
quality gap blocks
dangerous prompt-quality gap
```

Correct to:

```text
Warnings do not block. If a condition must block, it must be expressed as a deterministic blocker with a specific missing contract field, contradiction, policy conflict, or local-mode impossibility.
```

---

## 6. Suggested ticket decomposition

These are not ticket files. They are suggested ticket boundaries for the **Phase 7 ("Active docs and user guide")** doc work in `IMPLEMENTATION-ORDER.md` — the decomposition of that single phase, executed *after* the behavioral specs land, not a parallel implementation track.

### DOCREADINESS-001 — Repair `FOUNDATIONS.md`

Scope:

- Preserve existing `FOUNDATIONS.md`.
- Add draft/readiness split.
- Narrow fail-closed doctrine.
- Add blocker taxonomy.
- Add blank stop guidance doctrine.
- Add current cast voice optionality.
- Add readiness checklist doctrine.
- Update alignment checklist.

Acceptance:

- Existing major sections remain.
- No active foundation principle is deleted without explicit rationale.
- `soft_unit_guidance` blank is not described as blocker.
- warnings never gate.

### DOCREADINESS-002 — Repair generation-session schema doctrine in `story-record-schema.md`

Scope:

- Add draft vs ready shapes.
- Add/define `immediate_situation_summary`.
- Reclassify current state fields.
- Context-gate handoff.
- Keep `must_render` readiness-required.
- Make stop guidance optional.
- Make current voice pressure optional salience.
- Add diagnostic metadata model.

Acceptance:

- Record taxonomy preserved.
- Generation brief draft can represent incomplete work.
- Ready schema still blocks true impossibilities.

### DOCREADINESS-003 — Repair `compiler-contract.md`

Scope:

- Add requiredness terminology.
- Add normalized readiness input source.
- Amend placeholder mapping rows.
- Amend universal minimum completeness.
- Amend validation matrix rows.
- Add warning copy/dedup expectations.
- Add optional-omission empty-state rule.

Acceptance:

- Full mapping remains exhaustive.
- Prompt placeholders and requiredness align with schema and template.
- Blank stop guidance no longer blocks.

### DOCREADINESS-004 — Repair prompt template and rationale

Scope:

- Add `immediate_situation_summary` to current state.
- Make soft stop guidance conditional/optional.
- Revise current voice pressure wording.
- Add first-segment handoff empty-state doctrine.
- Amend rationale sections 5, 6, 10, 19, 20, 21.
- Add rationale for draft saving vs readiness.

Acceptance:

- Universal stop rule remains strong.
- No story-specific text is invented when optional guidance is blank.
- Prompt still excludes accepted prose.

### DOCREADINESS-005 — Repair author-facing docs and demo recipes

Scope:

- Update `user-guide.md`.
- Expand `demo-blocker-recipes.md`.
- Add examples for true blockers vs warnings.
- Add guidance for manual directive, stop guidance, generation context, handoff, and current voice pressure.

Acceptance:

- Author can understand how to fix blockers.
- Author can decide whether to ignore warnings.
- No normal draft incompleteness is called an error.

### DOCREADINESS-006 — Repair stress coverage docs

Scope:

- Update `stress-coverage-matrix.md`.
- Preserve and amend all existing `stress-suite.md` cases.
- Add draftability/readiness/defaulting/dedup/provider cases.

Acceptance:

- Existing 26 cases remain.
- New cases cover the production symptom.
- First-segment and continuation behavior are both represented.

---

## 7. Documentation acceptance tests

Before merging documentation changes, verify these manually or with a small script.

### 7.1 Preservation checks

For each touched active doc:

- Existing top-level headings are preserved unless the ticket explicitly says otherwise.
- Existing core doctrine not related to generation-readiness remains intact.
- The document is not compressed into a summary.
- Removed text is listed in the PR notes with rationale.

### 7.2 Consistency checks

The active docs agree on these statements:

- Draft save is separate from readiness.
- Readiness gates Preview/Generate, not persistence.
- `generation_context` defaults from accepted-segment count.
- Blank `soft_unit_guidance` is allowed.
- Supplied nonlocal stop guidance blocks.
- `manual_moment_directive.must_render` blocks readiness if blank.
- First segment does not require continuation handoff.
- Continuation requires user-authored handoff.
- Current authoritative state has a universal floor plus context-gated requirements.
- Current cast voice pressure is optional salience unless no voice authority/contradiction.
- Warnings never block.
- Raw diagnostic codes are technical details.

### 7.3 Prompt/template checks

Verify the prompt template can still render:

- first segment with blank stop guidance and blank handoff;
- continuation with user-authored handoff;
- no accepted prose in prompt;
- current voice pressure pins present;
- current voice pressure pins absent;
- long cast dossiers without per-record warning spam.

### 7.4 Search checks

After edits, these statements should no longer appear as active doctrine unless they are explicitly qualified:

```text
soft_unit_guidance blocks if blank
stop guidance is required for every generation
current cast voice pressure is required for active speakers
warnings block generation
quality gap blocks generation
```

---

## 8. Implementation notes for later code tickets

This spec is documentation-focused. The code work the docs imply is **owned by the behavioral specs**, not re-decomposed here: `SPEC-generation-brief-draftability-and-save-model.md` (draft persistence, save model), `SPEC-validation-gating-taxonomy-and-focus-matrix.md` (blocker taxonomy; stop-guidance / voice / generation-context requiredness), and `SPEC-readiness-diagnostics-and-three-page-ux.md` (shared readiness model, diagnostic surface). The list below is a doc-author awareness index that maps each implied change to its owning spec — not an independent backlog:

1. Add `GenerationSessionDraft` and normalized `GenerationSessionReadyInput` concepts.
2. Make `/api/generation-brief` save partial drafts.
3. Normalize `generation_context` from accepted-segment count in shared core/server/snapshot builder.
4. Allow blank `soft_unit_guidance` in schemas and readiness.
5. Context-gate first-segment vs continuation handoff.
6. Add or surface `immediate_situation_summary`.
7. Rework validation blockers and warnings to the taxonomy.
8. Rework `long-dossier-needs-pin` into grouped salience warning.
9. Add readiness model consumed by Generation Brief, Preview, and Generate.
10. Improve API error payloads so draft save errors are structural and readiness blockers are not HTTP 400 form failures.

Do not implement these inside the doc-amendment ticket unless the ticket explicitly includes code.

---

## 9. Final guidance

The foundation docs should remain large because they are doing real constitutional work. The goal is not brevity. The goal is consistency, precision, and operational truth.

Use this rule of thumb:

> If a section is still true, preserve it. If a sentence over-gates generation readiness, amend that sentence. If a doctrine is missing, add it. Do not summarize away the constitution.

---

## 10. Open questions and sequencing risks

- **Sequencing dependency (resolved).** These amendments are Phase 7 ("Active docs and user guide") of `IMPLEMENTATION-ORDER.md` and must land *after* the behavioral specs (Draftability/Save → Validation Taxonomy → Readiness/Three-Page UX). Updating the docs before the behavior exists would make them describe unimplemented behavior. The section 6 ticket boundaries are the decomposition of that one phase, not a parallel track.
- **§29 preservation (checked).** Every amendment was checked against FOUNDATIONS §29; none trips a hard fail. The amendments sharpen the warnings-vs-blockers distinction (§29.5), preserve deterministic compilation with no LLM intermediary (§29.4), keep the no-accepted-prose-in-prompts rule (§29.1 / §10), preserve the secret firewall (§29.6), and context-gate — rather than drop — physical continuity (§29.7). The one mechanical risk is leaving a stale hard-fail bullet behind; see the explicit removal instruction in section 4.1 and the dual search terms in section 5.1.
- **Open questions:** none remaining at reassessment time.

