# Continuity Loom schema, generation-brief, and record-taxonomy audit

**Document class:** change proposal / new-spec precursor  
**Not an implementation spec and not assigned a spec number**  
**Requested repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `89706560a6af55a3741450b15d89d5dd5ad082d0`  
**Freshness claim:** user-supplied target commit only; not independently verified as the current `main`  
**Audit date:** 2026-06-20

> I am not verifying that this commit is the current `main`. I am using the supplied commit as the target of record and analyzing files fetched only by exact commit URL from `joeloverbeck/continuity-loom`.

---

## 1. Executive verdict

**Change is warranted, but the correct change set is narrow.** The schema is fundamentally sound. Its ontology already covers identity, operational state, truth and belief, concealment, space and material state, local action possibility, causal pressure, social structure, affect, and generation-time control without crossing into branch or plot-rail machinery.

The audit found:

1. **Four stored fields that do not earn independent authority and should be removed:**
   - `STORY CONTRACT.continuity_philosophy`
   - `ACTIVE WORKING SET.manual_directive_id`
   - `CURRENT CAST VOICE PRESSURE[].local_function`
   - `CAST VOICE OVERRIDES[].scope`
2. **One redundant prompt lane that should be removed:** `{voice_pressure}`. Its resolver in `packages/core/src/compiler/sections/pressure.ts` duplicates the live `{active_cast_voice_pressure_pins}` lane (both read `current_cast_voice_pressure`).
3. **One voice-delivery defect that should be fixed:** current pressure supplied for present-minor cast can satisfy validation while not reaching the compressed prompt representation.
4. **Two record-field delivery defects that should be fixed without adding fields:**
   - selected non-person or otherwise undossiered `ENTITY` identity/description does not reach its promised material-pressure destination;
   - `LOCATION.hazards_or_shelters` and `LOCATION.social_rules` are valid fields but are omitted by the location renderer.
5. **Several field-guidance claims should be made explicit and truthful:** a small set of retained fields are deliberately authoring-, validation-, history-, classification-, or UI-facing rather than literal prompt content.
6. **No new field clears the evidence bar.**
7. **No new record category clears the evidence bar.**
8. **No recommendation requires a `FOUNDATIONS.md` amendment.**

This is not a call for schema expansion. It is a cleanup and delivery-alignment proposal: remove duplicate authority, make valid authored state reach its existing deterministic destination, and stop field guidance from implying effects that do not exist.

Because the sanctioned ideation/assistance prompt (`docs/FOUNDATIONS.md` §9.1) is compiled from the same authority sources through the same shared section serializers (`records-tail.ts`, `cast.ts`), the delivery changes below propagate into the ideation prompt. This proposal therefore also synchronizes `docs/ideation-prompt-template.md` and the ideation golden, while keeping current voice-delivery pressure prose-only.

---

## 2. Governing standard and method

### 2.1 Field-economy test

`docs/FOUNDATIONS.md` §13 and `docs/story-record-schema.md` §1 establish the operative test: a field earns its place through at least one concrete function in:

- deterministic compilation;
- deterministic validation;
- continuity interpretation;
- character voice or behavior preservation;
- prose-quality protection; or
- authorial control.

A field is not dead merely because its prose cannot be fully machine-validated. Conversely, a fixed literal, phantom reference, circular presence gate, or guidance-only promise does not become legitimate merely because it exists in a strict schema.

### 2.2 Harm tests applied

Every field and generation-time block was also checked against the four harm modes in the brief:

1. **Prose degradation / over-constraint:** stiffens or flattens prose, forces incident, or undermines the local stop rule.
2. **Misleading authors or agents:** phantom destination, circular validation, duplicated authority, or guidance that promises an absent compiler effect.
3. **Contamination / hidden state:** admits accepted prose, rejected or superseded candidates, automatic prose-derived summaries, hidden selection, or nondeterministic interpretation.
4. **Generator bias / forced events:** acts as a soft plot rail, forces escalation or payoff, or drifts into §12-prohibited machinery.

### 2.3 Evidence method

The determination traces each candidate across the owning documentation and the implementation seams relevant to its function:

- Zod storage, draft, and ready schemas;
- compiler placeholder mapping and section renderers;
- validation rules and focus matrices;
- field-guidance and editor descriptors;
- active-working-set integrity handling;
- demo fixtures;
- server storage/migration seams;
- web editing surfaces;
- contract, template, rationale, validation inventory, stress documents, and tests.

The removal bar follows the completed `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`: a removal must demonstrate absence of an independent function and carry the same-change cascade through schema, validation, compiler, guidance, UI, migration, docs, fixtures, and tests where applicable.

### 2.4 External-research use

External research was used conservatively. Narrative-planning work is treated as evidence about useful representational distinctions—belief, intention, plan, action preconditions—not as permission to turn Loom into a planner. Persona and emotional-fidelity work is treated as evidence for retaining rich character/affect context, not as proof that every possible persona field belongs in the prompt. Long-context research supports removing redundant prompt lanes and keeping important current pressure salient; it does not justify automatic compression or deletion of selected authority.

---

## 3. Per-surface verdict

| Audited surface | Concern axis | Verdict | One-line justification |
|---|---|---:|---|
| STORY CONTRACT | unnecessary/harmful | **remove one field** | `continuity_philosophy` is a fixed constitutional literal, offers no author choice, is not compiled, and duplicates static continuity-first doctrine. |
| UNIVERSAL CONTENT POLICY | all axes | **unchanged** | Its five fields divide the content envelope, allowed scope, tonal handling, provider-policy boundary, and character-vs-narrator bias handling; all compile. |
| PROSE MODE | all axes | **unchanged** | Its fields independently control POV, grammar, psychic access, dialogue rhythm, paragraphing, output language, and special style constraints. |
| ACTIVE WORKING SET | unnecessary/harmful | **remove one field** | `manual_directive_id` points to no manual-directive record category and has no compiler or meaningful referential-validation use. |
| CURRENT AUTHORITATIVE STATE | all axes | **unchanged** | It is the current-state authority for time, scene space, presence, agency, perception, possession, routes, timing, force/consent, and locks. |
| IMMEDIATE HANDOFF | contamination plus field economy | **unchanged** | The four fields provide a narrow, user-authored continuation bridge while explicitly excluding accepted/candidate prose and automatic summaries. |
| MANUAL MOMENT DIRECTIVE | over-constraint / authorial control | **unchanged** | `must_render`, `may_render_if_naturally_caused`, and `do_not_force` form a balanced local instruction triad rather than a plot rail. |
| CURRENT CAST VOICE PRESSURE | misleading / duplicate authority | **modify** | Remove duplicate `local_function`; derive role from the working set, ensure present-minor pressure is rendered, and eliminate the redundant `{voice_pressure}` lane. |
| CAST VOICE OVERRIDES | unnecessary/harmful | **remove one field** | `scope` is a fixed literal inside an already generation-scoped block and is redundantly printed; `applies_to` carries the real targeting information. |
| GENERATION VALIDATION FOCUS | contamination / prompt bias | **unchanged** | Tags deterministically select validation rows and remain validation-only; they do not become prose instructions. |
| STOP GUIDANCE | generator bias / plot rails | **unchanged** | It narrows only the next local unit while the universal stop rule prevents chapter, arc, beat-package, or multi-response behavior. |
| ENTITY | missing delivery, not missing field | **modify compiler/guidance** | `entity_kind` and `short_description` are valid, but selected non-person or undossiered entities need a deterministic material-pressure rendering. |
| ENTITY STATUS | all axes | **unchanged** | It gives a compact operational state for life, agency, location, POV visibility, and current activity and backs physical/state validation. |
| CAST MEMBER | all axes | **unchanged** | The rich-dossier exception is justified by voice, body, behavior, perception, agency, and anti-generic prose protection. |
| FACT | all axes | **unchanged** | Objective/current truth must remain distinct from held belief and protected truth. |
| BELIEF | all axes | **unchanged** | Character-specific, possibly false epistemic state is necessary for plausible action and POV control. |
| SECRET | all axes | **unchanged** | Holders, protected non-holders, clues, reveal permissions, and reveal state support deterministic leakage control. |
| POV KNOWLEDGE PROFILE | all axes | **unchanged** | The derived profile keeps POV knowledge, misbelief, ignorance, and current perceptual limits explicit. |
| AUDIENCE KNOWLEDGE PROFILE | all axes | **unchanged** | Audience knowledge and dramatic-irony permissions are not interchangeable with POV knowledge. |
| LOCATION | missing delivery, not missing field | **modify compiler/guidance** | `hazards_or_shelters` and `social_rules` earn their place but currently fail to reach the location prompt rendering. |
| OBJECT | misleading guidance risk | **modify guidance only** | The category is sound; classify `durability` explicitly as authorial/salience metadata unless and until a live compiler or validator consumes it. |
| VISIBLE AFFORDANCE | all axes | **unchanged** | It represents current action possibility, requirements, risk, and change durability without prescribing a future plot. |
| EVENT | all axes | **unchanged** | It represents causal history/current relevance; `sequence_order` correctly remains authoring metadata rather than prompt-order machinery. |
| INTENTION | all axes | **unchanged** | A holder’s commitment/pressure is distinct from an executable plan. |
| PLAN | misleading / generator bias | **modify guidance only** | Keep `fallback_steps` for author planning continuity, but mark it non-prompt-facing so alternatives do not become soft branches. |
| CLOCK | misleading / generator bias | **modify guidance only** | Keep `tick_history` as continuity/audit history; compile only current pressure, trigger, threshold, and possible effects. |
| OBLIGATION | all axes | **unchanged** | Promise/debt/role pressure has distinct parties, terms, urgency, visibility, and breach consequence. |
| CONSEQUENCE | all axes | **unchanged** | Current and possible effects attached to a cause/target are distinct from clocks and obligations. |
| OPEN THREAD | all axes | **unchanged** | It tracks unresolved pressure without commanding closure; `answer_if_known` correctly remains authoring-only. |
| RELATIONSHIP | misleading guidance risk | **modify guidance only** | Structured axes and scalar metadata support authoring/validation; prose compilation should continue to use description, pressure, and current expression. |
| EMOTION | all axes | **unchanged** | Current affect and behavioral pressure are not reducible to durable cast identity or relationship structure. |
| Record-category set as a whole | missing category | **unchanged; add none** | Proposed additions reduce to existing primitives or cross into §12-prohibited scene/plot machinery. |

---

## 4. Recommended change 1 — remove `STORY CONTRACT.continuity_philosophy`

### 4.1 Exact surface and concern

- **Field path:** `storyContract.continuity_philosophy`
- **Concern axis:** unnecessary/harmful
- **Harm mode:** misleading/duplicate authority
- **Verdict:** remove

### 4.2 Evidence and field-economy determination

The core schema constrains the field to the single literal `continuity_first`. The story-config editor therefore cannot offer a meaningful alternative. The deterministic compiler does not read the stored value; continuity-first and no-branches rules already live in the constitutional/static prompt authority. Field guidance describes the field as an operational doctrine marker rather than a prompt destination.

That does not establish an independent function. A fixed persisted echo of the constitution is not authorial control, and a presence check or strict-schema requirement would be circular. Keeping it creates a second apparent authority path: an agent may infer that changing story configuration could alter continuity philosophy even though no supported alternate philosophy exists.

This is the same class of defect as the removal precedent, although smaller: a stored field that appears meaningful but does not control the promised behavior.

### 4.3 Target core shape

Remove the key without replacement or alias:

```ts
const storyContractSchema = z
  .object({
    title: z.string(),
    premise: z.string(),
    genre_mode: /* existing shape */,
    tone: /* existing shape */,
    setting_baseline: z.string(),
    content_intensity: /* existing enum */,
    explicitness: z.string(),
    language_register: z.string(),
  })
  .strict();
```

Do **not**:

- add a deprecated optional alias;
- introduce `continuity_mode`;
- create a default-then-override relationship;
- make the static prompt doctrine conditional on stored data.

The constitution and universal prompt contract remain continuity-first.

### 4.4 Code cascade

#### `@loom/core`

Change:

- `packages/core/src/records/global-config.ts`
  - remove the Zod field and inferred type member;
- `packages/core/src/records/story-config-descriptors.ts`
  - remove the editor descriptor;
- `packages/core/src/records/field-guidance-brief-config.ts`
  - remove the field guidance entry;
- `packages/core/src/records/field-path-enumeration.ts` and/or `field-paths.ts`
  - ensure the path is no longer emitted;
- `packages/core/src/demo/letter-under-flour-bin.ts`
  - remove the fixture key;
- any global-config completeness helper/message that names the field
  - remove only the dead presence condition; leave substantive STORY CONTRACT and PROSE MODE readiness intact.

No compiler resolver should be added. The field’s absence should not change compiled prompt text.

#### `@loom/web`

Change:

- `packages/web/src/config/StoryConfigEditor.tsx`
  - remove the one-option control;
- corresponding tests and contextual enum guidance, if any.

#### `@loom/server`

A strict-schema removal is storage-incompatible without migration.

Extend the existing global-config migration path so it strips `continuity_philosophy` from:

1. live `story_config` STORY CONTRACT rows before strict parsing; and
2. orphan global-config records before the migration code parses and moves them.

The migration must be:

- idempotent;
- key-specific;
- lossless for all sibling fields;
- executed before strict Zod parse;
- covered through the ordinary project-open/read path, not merely a direct helper test.

Do not preserve an alias or rewrite it to another field.

### 4.5 Authority-doc and prompt sync

Update in the same change:

- `docs/story-record-schema.md` §2.1
  - delete the field from STORY CONTRACT;
  - state continuity-first doctrine is constitutional/static, not a configurable story property.
- `docs/compiler-contract.md`
  - remove any input inventory or field-guidance implication that treats it as a compiler source.
- `docs/prompt-template.md`
  - **no structural prompt change**; static continuity doctrine remains.
- `docs/prompt-template-rationale.md`
  - change only if it describes the stored field as a source.
- `docs/validation-rule-inventory.md`
  - update only if a named completeness diagnostic or source inventory mentions it.

This change does not add, rename, or delete a prompt placeholder.

### 4.6 Required verification

- legacy live story-config row with the key opens, migrates, and re-saves without it;
- legacy orphan STORY CONTRACT record migrates instead of being classified malformed;
- migration rerun is a no-op;
- field-path and guidance coverage contain no removed path;
- story-config UI has no control for it;
- compiled prompt golden output is unchanged;
- repository grep leaves no schema/UI/guidance use of the identifier.

### 4.7 `FOUNDATIONS.md` §29 clearance

- **§29.1:** adds no planner, branch, rail, or future-plot authority.
- **§29.2:** removes duplicate stored doctrine; it does not permit automatic mutation.
- **§29.3:** working-set selection and inspection are unaffected.
- **§29.4:** prompt compilation remains deterministic and structurally unchanged.
- **§29.5:** only a hollow/fixed-literal requirement is removed; real story-config readiness remains.
- **§29.6–29.8:** POV, reveal, physical continuity, and accepted-prose boundaries are unaffected.
- **§29.9–29.10:** local migration changes no secret, logging, or ownership boundary.
- **§29.11:** reduces clerical friction and false configurability.
- **§29.12:** author-private notes remain isolated.

**Amendment required:** no.

---

## 5. Recommended change 2 — remove `ACTIVE WORKING SET.manual_directive_id`

### 5.1 Exact surface and concern

- **Field path:** `generationSession.active_working_set.manual_directive_id`
- **Concern axis:** unnecessary/harmful
- **Harm mode:** misleading phantom reference / duplicate authority
- **Verdict:** remove

### 5.2 Evidence and field-economy determination

The generation session already contains the actual manual directive inline as:

- `manual_moment_directive.must_render`;
- `manual_moment_directive.may_render_if_naturally_caused`;
- `manual_moment_directive.do_not_force`.

There is no `MANUAL DIRECTIVE` record category in the registry for `manual_directive_id` to resolve to. The compiler does not use the ID to obtain directive content. The live referential validation does not establish a meaningful target contract. The working-set integrity path treats it only as a value to retain/prune, and the demo fixture points it at an `INTENTION` identifier, demonstrating that the field lacks a stable semantic target.

The active schema documentation also says the field is generation-time-required while implementation shapes allow it to be absent. That contradiction is itself evidence that the ID is not the authority: readiness correctly depends on the inline `must_render` content, not an orphan identifier.

### 5.3 Target core shape

Remove it from storage, draft, ready, and normalized working-set shapes:

```ts
const activeWorkingSetSchema = z
  .object({
    selected_records: z.array(recordIdSchema),
    active_onstage_cast_full: z.array(activeCastEntrySchema),
    present_minor_cast_compressed: z.array(recordIdSchema),
    offstage_relevant_cast: z.array(recordIdSchema),
    selected_pov: /* existing shape */,
  })
  .strict();
```

No replacement ID should be introduced. The inline manual directive remains the sole generation-time authority.

### 5.4 Code cascade

#### `@loom/core`

Change:

- `packages/core/src/records/generation-brief.ts`
- `packages/core/src/records/generation-brief-draft.ts`
- `packages/core/src/records/generation-brief-readiness.ts`
- `packages/core/src/records/generation-brief-descriptors.ts`
- `packages/core/src/records/field-guidance-brief-config.ts`
- `packages/core/src/records/field-path-enumeration.ts` / `field-paths.ts`
- `packages/core/src/records/working-set-integrity.ts`
  - remove pruning/copy logic for this non-reference;
- `packages/core/src/demo/letter-under-flour-bin.ts`
  - remove the misleading fixture value.

Retain the existing readiness rule that `manual_moment_directive.must_render` must be nonblank for Preview/Generate while a draft may be saved before it is complete.

#### `@loom/web`

Remove any active-working-set or generation-brief control/help text for the ID. The user should edit the directive content, not select a nonexistent directive record.

#### `@loom/server`

Add an idempotent generation-session draft migration that deletes:

```text
active_working_set.manual_directive_id
```

before the tightened nested `.strict()` schemas parse persisted drafts.

The migration must preserve incomplete but structurally saveable drafts. It must not synthesize directive content from the old ID or any referenced record.

### 5.5 Authority-doc and prompt sync

Update:

- `docs/story-record-schema.md` §3.1
  - remove the field;
  - remove the statement that it is generation-time-required;
  - reiterate that `manual_moment_directive.must_render` is readiness-required.
- `docs/compiler-contract.md`
  - remove any source/reference mention of the ID;
  - preserve the inline directive placeholders and readiness rules.
- `docs/prompt-template.md`
  - no placeholder or wording change is required.
- `docs/prompt-template-rationale.md`
  - no change unless it implies a directive record.
- `docs/validation-rule-inventory.md`
  - update if a diagnostic message names a missing directive ID rather than missing directive content.

### 5.6 Required verification

- draft and ready schemas reject the legacy key after migration;
- legacy draft opens and retains all inline directive prose;
- `workingSetIntegrity` no longer reports/prunes the field;
- no generated prompt changes;
- readiness still blocks blank `must_render`;
- draft saving remains permitted while `must_render` is incomplete;
- no demo/test fixture uses an unrelated record ID as a manual-directive ID.

### 5.7 `FOUNDATIONS.md` §29 clearance

- **§29.1:** removes a misleading pseudo-record link; adds no plot structure.
- **§29.2:** strengthens visible human authority by leaving the actual authored directive as the only source.
- **§29.3:** reduces false working-set structure without changing explicit record selection.
- **§29.4:** compiler inputs become simpler and remain deterministic.
- **§29.5:** mandatory content remains fail-closed through `must_render`; draftability remains separate from readiness.
- **§29.6–29.12:** no impact on POV, reveal, physical state, accepted prose, secrets, ownership, or private notes.

**Amendment required:** no.

---

## 6. Recommended change 3 — normalize current cast voice pressure and repair delivery

### 6.1 Exact surfaces and concerns

- **Field path to remove:** `current_cast_voice_pressure[].local_function`
- **Prompt placeholder to remove:** `{voice_pressure}`
- **Renderer behavior to modify:** present-minor compressed cast rendering
- **Validation behavior to modify:** voice-matrix checks must test pressure that is actually delivered
- **Concern axis:** unnecessary/harmful plus implementation omission
- **Harm mode:** misleading duplicate authority / phantom destination
- **Verdict:** modify

### 6.2 Why `local_function` is duplicate authority

For full active/onstage cast, local function already belongs to:

```text
active_working_set.active_onstage_cast_full[].local_function
```

The current-pressure entry repeats that role. The compiler’s active pin construction derives the role from the selected working-set record, while the pressure line serializer reads the pressure prose but does not need the duplicate enum. A mismatch can therefore create two competing claims about the same character’s local function.

The only extra enum member in the pressure item is `present_minor_speaker`. That distinction does not justify a second role-authority field. Present-minor band membership already comes from `present_minor_cast_compressed`; speech-oriented pressure can be identified from actual supplied dialogue/current-voice content and temporary override targeting.

### 6.3 Why `{voice_pressure}` is a redundant lane

`docs/prompt-template.md` currently places both:

```text
Voice pressure:
{voice_pressure}

Active cast voice pressure pins:
{active_cast_voice_pressure_pins}
```

The compiler contract describes `{voice_pressure}` as a user-authored generation-time summary. Its resolver does exist — in `packages/core/src/compiler/sections/pressure.ts` it renders `current_cast_voice_pressure[].current_voice_pressure` for every entry — but it is redundant: the same generation-time voice material is already assembled, with richer per-cast detail, in `{active_cast_voice_pressure_pins}` (`packages/core/src/compiler/sections/cast.ts`) and in dossier/compressed-cast rendering. `{active_cast_voice_pressure_pins}` covers active/onstage cast; the present-minor band's `current_voice_pressure` currently reaches the prose prompt *only* through `{voice_pressure}`, which is why its removal must be paired with the present-minor delivery fix below — otherwise present-minor `current_voice_pressure` is dropped.

Because the lane only duplicates content the pins/dossier lanes already carry for active cast, the correct repair is to remove the redundant lane and keep the live pins lane, while routing present-minor `current_voice_pressure` to the present-minor compressed notes (next subsection).

This also aligns with long-context evidence: strategically repeated salient information can help, but redundant lanes that carry the same authority are not free. Relevant information can be used less reliably when buried or diluted in long contexts; Loom should preserve the intentional pins/dossier dual frame, not add an accidental third frame.

### 6.4 Why present-minor delivery must change

The present-minor compressed-cast renderer (`renderCompressedCastBand` in `packages/core/src/compiler/sections/cast.ts`) emits compressed identity/durable notes and a temporary override, but it does not include the per-cast current-pressure serializer (`currentVoicePressureLines`) used by active pins. So the richer present-minor pressure fields — dialogue, POV-narration, and nonverbal/silence pressure — never reach the external writer, and once the redundant `{voice_pressure}` lane is removed, even `current_voice_pressure` would stop reaching the prose prompt. Validation can therefore accept or require current pressure for a present-minor speaker even though that pressure is not (or no longer) delivered.

That is the most serious defect in this group: a validation pass must correspond to prompt material that can satisfy the validated need.

### 6.5 Target core shapes and deterministic derivation

Remove `local_function` from durable-ready and draft item schemas:

```ts
const currentCastVoicePressureItemSchema = z
  .object({
    cast_member_id: recordIdSchema,
    current_voice_pressure: z.string(),
    dialogue_pressure: optionalProse,
    pov_narration_pressure: optionalProse,
    nonverbal_or_silence_pressure: optionalProse,
    current_must_preserve: z.array(z.string()),
    current_must_avoid: z.array(z.string()),
  })
  .strict();
```

Derive role/band deterministically:

1. Match `cast_member_id` against `active_onstage_cast_full`.
   - If present, use that entry’s `local_function`.
2. Otherwise match against `present_minor_cast_compressed`.
   - Treat it as present-minor band material.
   - Treat it as speech-oriented only when supplied pressure/override has a speech destination, such as nonblank `dialogue_pressure`, a suitable `current_voice_pressure`, or an override whose `applies_to` includes dialogue or `all_prompted_voice`.
3. Reject or diagnose a current-pressure entry whose cast member is in no allowed selected cast band.
4. Do not infer role from prose with an LLM.
5. Do not add a new stored role field.

### 6.6 Compiler changes

#### Remove the redundant lane

Change:

- `packages/core/src/compiler/placeholder-map.ts`
  - delete `voice_pressure`;
- `packages/core/src/compiler/types.ts`
  - delete any corresponding placeholder/type key;
- `packages/core/src/compiler/sections/pressure.ts`
  - delete the `voice_pressure` resolver — this is where it actually lives (not `cast.ts`); leaving it would dangle a resolver keyed to a removed `PlaceholderName` and break the typecheck;
- `packages/core/src/compiler/empty-states.ts`
  - delete its empty state;
- `packages/core/src/compiler/sections/cast.ts`
  - retain `active_cast_voice_pressure_pins`; do not create a second summary resolver;
- template conformance tests/golden prompt
  - remove the lane.

#### Deliver current pressure to present-minor cast

In `packages/core/src/compiler/sections/cast.ts`:

- reuse the existing deterministic `currentVoicePressureLines` serializer for present-minor selected entries;
- it must subsume at least `current_voice_pressure`, so that removing the redundant `{voice_pressure}` lane does not regress present-minor `current_voice_pressure` delivery;
- append the supplied current pressure to that cast member’s compressed block under an explicit current-generation label;
- include temporary overrides after or with the current pressure in a stable order;
- gate this current-pressure rendering to the **prose** prompt only: thread an `ideation` flag into `renderCompressedCastBand` (it currently takes none) so the ideation prompt’s `<present_minor_cast>` does not gain current voice-delivery pressure — the ideator writes no prose, and the ideation template deliberately omits voice-pin/prose-craft material (Q1: prose-only);
- do not include present-minor current pressure in offstage relevance;
- do not silently promote a present-minor cast member to a full dossier;
- keep active/onstage full dossier behavior unchanged.

A stable compressed order should be:

1. display identity / one-line identity;
2. durable compressed voice/body note;
3. current-generation voice pressure;
4. current-generation override, when supplied.

#### Preserve the intended duplicate, remove the accidental one

Keep:

- active current voice pin near the working-set summaries; and
- full durable dossier later.

Remove:

- the redundant `{voice_pressure}` block.

The first pair has distinct functions: current salience versus full authority. The third lane has a source (`current_cast_voice_pressure`) but no *independent* function — it only duplicates what the pins lane already carries for active cast.

### 6.7 Validation changes

Update `packages/core/src/validation/rules/matrix-voice.ts` and any cast-band helper so:

- active/full role floors use `active_onstage_cast_full[].local_function`;
- present-minor speech checks are based on selected band membership plus actual deliverable speech guidance;
- a blocker cannot be cleared solely by a field the renderer drops;
- supplied contradictory current pressure still blocks;
- absent optional pressure remains a warning or no diagnostic when durable/compressed authority is sufficient, preserving `FOUNDATIONS.md` §29.11;
- no warning text is compiled into the prose prompt.

Diagnostic wording should identify the missing usable lane, for example: a selected present-minor speaker needs durable compressed speech guidance, current dialogue pressure, or a dialogue-targeted current override.

### 6.8 Guidance and editor changes

Update:

- `packages/core/src/records/generation-brief-descriptors.ts`
- `packages/core/src/records/field-guidance-brief-config.ts`
- `packages/core/src/records/compile-destinations.ts`
- web generation-brief rendering/help

so that:

- no `local_function` control appears inside current pressure;
- users understand that active/full role comes from the active working set;
- current pressure fields name only real destinations:
  - active cast voice pressure pins;
  - full dossier current-generation annotation where implemented;
  - present-minor compressed notes;
- no guidance points to `{voice_pressure}`.

### 6.9 Server migration

Extend the generation-session draft migration to strip, for every array item:

```text
current_cast_voice_pressure[*].local_function
```

before strict parsing.

Requirements:

- preserve item order and every pressure string/list;
- leave malformed non-object array items for the normal malformed-draft policy rather than “repairing” their prose;
- idempotent;
- no role inference during migration.

### 6.10 Authority-doc and prompt sync

Update in one change:

- `docs/story-record-schema.md` §3.5
  - remove `local_function`;
  - explain deterministic role derivation;
  - state present-minor current pressure compiles into compressed notes.
- `docs/compiler-contract.md`
  - remove the `{voice_pressure}` mapping;
  - update `{active_cast_voice_pressure_pins}`;
  - update `<present_minor_cast>` source and requiredness notes;
  - ensure the exhaustive-placeholder claim remains true.
- `docs/prompt-template.md`
  - delete the `Voice pressure: {voice_pressure}` lines;
  - retain `Active cast voice pressure pins`;
  - revise “scope stated there” wording after the scope-field removal described in change 4.
- `docs/prompt-template-rationale.md` §§9–11
  - retain the intentional pin/dossier rationale;
  - explicitly state that present-minor supplied current pressure is rendered;
  - remove the claim that an override carries a separate scope field.
- `docs/validation-rule-inventory.md`
  - update the voice diagnostic source/coverage if its rule mechanics or message changes.
- `docs/ideation-prompt-template.md`
  - this registered domain authority has no conformance test, so it must be synced by hand: note that present-minor current voice-delivery pressure is **not** rendered in the ideation `<present_minor_cast>` (prose-only, per Q1), and that override-scope removal (change 4) drops the scope clause from the ideation present-minor and full-dossier renderings.
- stress/demo docs
  - update any present-minor speech recipe so the required guidance is visible in the compiled prompt.

### 6.11 Required verification

Add or update tests proving:

- draft/ready schemas have no nested `local_function`;
- legacy drafts migrate without losing pressure prose;
- active/full local functions still drive the same validation floors;
- present-minor current dialogue pressure appears in the prompt;
- present-minor nonverbal-only pressure does not falsely satisfy a speech requirement;
- dialogue-targeted override can satisfy the appropriate current-generation lane;
- offstage compressed output does not receive current onstage pressure;
- `{voice_pressure}` is absent from template constants, placeholder map, the `pressure.ts` resolver, contract, and golden prompt;
- the ideation prompt’s `<present_minor_cast>` does not gain current voice-delivery pressure (prose-only, per Q1), verified against the ideation golden;
- every remaining template placeholder has a concrete resolver or deliberate constant source;
- identical snapshots compile identically.

### 6.12 `FOUNDATIONS.md` §29 clearance

- **§29.1:** no branch, beat, autonomous plot, or future-structure mechanism.
- **§29.2:** removes conflicting stored role authority; no LLM mutation or inference.
- **§29.3:** derives only from explicit selected cast bands and does not compress full dossiers.
- **§29.4:** deterministic snapshot-only rendering; accepted prose remains excluded; universal structure remains complete after a same-change template/contract edit.
- **§29.5:** strengthens fail-closed validity by making a voice pass correspond to delivered guidance; optional pressure remains optional where durable authority suffices.
- **§29.6:** POV-narration pressure remains bounded by the existing POV/reveal system.
- **§29.7:** nonverbal/body pressure continues to support physical presence.
- **§29.8–29.10:** no archive, secret, network, or ownership effect.
- **§29.11:** preserves rich cast authority and improves validation legibility.
- **§29.12:** private notes remain outside every input and renderer.

**Amendment required:** no.

---

## 7. Recommended change 4 — remove `CAST VOICE OVERRIDES[].scope`

### 7.1 Exact surface and concern

- **Field path:** `cast_voice_overrides[].scope`
- **Concern axis:** unnecessary/harmful
- **Harm mode:** duplicate authority / misleading configurability
- **Verdict:** remove

### 7.2 Evidence and field-economy determination

The field is constrained to `current_generation_only`. The enclosing block is already defined as temporary generation-time state, and the renderer labels the material as a current-generation override. The field offers no choice and is repeated as prompt text.

The real authorial control resides in:

- target `cast_member_id`;
- optional `reason`;
- `applies_to`;
- `override_text`.

`scope` adds no independent compilation, validation, continuity, voice, prose-quality, or author-control function.

### 7.3 Target core shape

```ts
const castVoiceOverrideSchema = z
  .object({
    cast_member_id: recordIdSchema,
    reason: optionalProse,
    applies_to: z.array(castVoiceOverrideTargetSchema),
    override_text: z.string(),
  })
  .strict();
```

The generation-time-only rule remains structural and documented.

### 7.4 Code cascade

#### `@loom/core`

Change:

- `generation-brief.ts`
- `generation-brief-draft.ts`
- `generation-brief-readiness.ts`
- `generation-brief-descriptors.ts`
- `field-guidance-brief-config.ts`
- cast renderer
  - remove dynamic scope output;
  - retain a static “Current generation voice override” label.

#### `@loom/web`

Remove any one-option scope control/readout. The UI should make temporariness clear at the block level.

#### `@loom/server`

Strip:

```text
cast_voice_overrides[*].scope
```

from persisted generation-session drafts before strict parse. Preserve all other override data and order.

### 7.5 Authority-doc and prompt sync

Update:

- `docs/story-record-schema.md` §3.6
  - delete the field;
  - state the block is intrinsically current-generation-only.
- `docs/compiler-contract.md`
  - remove dynamic scope as a source/rendered clause.
- `docs/prompt-template.md`
  - replace “within the scope stated there” with wording based on the listed `applies_to` functions and current-generation block semantics.
- `docs/prompt-template-rationale.md` §11
  - remove `scope` from the shape description;
  - retain the reason for non-durable overrides.
- `docs/ideation-prompt-template.md`
  - `overrideLines` is shared, so scope removal also drops the scope clause from the ideation `<present_minor_cast>` and `<active_cast_full_dossiers>` renderings; sync the doc and the ideation golden.
- guidance/tests/goldens
  - update in the same change, including the ideation golden (`packages/core/test/golden-ideation.prompt.txt`).

### 7.6 Required verification

- legacy draft migration;
- no scope control or field path;
- override still renders for active/full and present-minor targets as specified;
- `applies_to` still gates the affected dimensions;
- no override persists into a durable CAST MEMBER record;
- golden prompt loses only the redundant scope clause.

### 7.7 `FOUNDATIONS.md` §29 clearance

This removal does not alter continuity authority, deterministic compilation, fail-closed validation, working-set selection, POV/reveal boundaries, accepted-prose exclusion, or local ownership. It reduces a duplicate path while preserving explicit temporary authorial control.

**Amendment required:** no.

---

## 8. Recommended change 5 — repair record-field destinations and guidance truthfulness

This change does not add fields or categories. It makes existing valid fields reach an existing prompt destination where promised, and explicitly marks retained non-prompt fields as such.

### 8.1 `ENTITY.entity_kind` and `ENTITY.short_description`

#### Determination

- **Concern axis:** missing delivery / misleading prompt contract
- **Verdict:** modify compiler and guidance; retain fields and category

`ENTITY` is defined as the base for anything that can hold state or exert pressure, including groups, institutions, factions, systems, animals, place-agents, object-agents, and supernatural forces. The schema says selected non-person entities may compile as pressure sources.

The current record-tail/material-pressure renderer does not provide a concrete representation of the selected entity’s `entity_kind` or `short_description`. A label resolved from an ID is not enough to tell the external writer what an institution, system, collective, or nonhuman agent is or how it bears on the moment. This weakens the existing `nonhuman_or_institutional_pressure_expected` validation intent.

#### Target rendering

Add a deterministic entity-pressure serializer to the existing `{material_pressure}` source. Suggested shape:

```text
<display name> — <humanized entity kind>: <short description>
```

Inclusion rule:

- selected `ENTITY` records whose kind is not `person`; or
- selected person-like entities not represented by a selected CAST MEMBER dossier and materially relevant to the current unit.

Do not duplicate a full selected cast dossier in material pressure. Do not compile raw IDs. Do not infer relevance outside explicit selection/current-state membership.

This entity-pressure rendering is **prose-only** (Q2). The ideation prompt does not render `{material_pressure}` — its `<physical_continuity>` emits status-only ENTITY STATUS, LOCATION, OBJECT, and VISIBLE AFFORDANCE lines — so selected non-person entities remain surfaced to the ideator through their ENTITY STATUS physical-continuity lines, not through this new serializer. Extending entity material-pressure into the ideation prompt is a separately justified change, out of scope here.

Keep `roles_in_story` out of literal prose unless a future, separately justified contract change gives it a concrete use. It remains structured authoring/organization metadata.

#### Code and docs

Change:

- `packages/core/src/compiler/sections/pressure.ts` or the shared material-pressure serializer;
- any label/ordering helper needed for deterministic humanization;
- compiler tests and golden prompts;
- `docs/compiler-contract.md` `{material_pressure}` source/notes;
- `docs/prompt-template.md` explanatory sentence so material pressure covers entity, entity-status, location, and object constraints;
- `docs/prompt-template-rationale.md` only to explain the existing summary destination;
- field guidance for `entity_kind`, `short_description`, `roles_in_story`, aliases, lifecycle/status metadata.

No storage migration is required.

#### §29 clearance

Rendering only explicitly selected/current snapshot entities preserves working-set supremacy and determinism. It adds no planning or hidden relevance selection. It strengthens pressure clarity without changing current state or accepted-prose boundaries.

### 8.2 `LOCATION.hazards_or_shelters` and `LOCATION.social_rules`

#### Determination

- **Concern axis:** missing delivery / misleading field guidance
- **Verdict:** modify compiler and guidance; retain fields

Both fields have concrete functions:

- `hazards_or_shelters` constrains safe movement, danger, cover, refuge, and feasible physical action;
- `social_rules` constrains public behavior, access, etiquette, authority, taboo, and likely consequences in a place.

The location renderer currently emits description, status, layout, routes, and visibility/sound, but omits these two fields. Their omission is especially costly because the current-state matrix treats environment, route, perception, and force constraints as load-bearing.

#### Target rendering

For each selected/current location, append stable labeled clauses when nonempty:

```text
Hazards or shelters: ...
Social rules: ...
```

Preserve schema order and deterministic list formatting. Do not synthesize or rank entries.

`renderLocations`/`renderObjects` in `records-tail.ts` are the single shared serializers for both prompt kinds (the prose prompt status-gates them; the ideation prompt passes `ideation: true` to render every selected record with a status label). The hazards/social-rules clauses must therefore render in both modes, and adding them inherently changes the ideation `<locations_objects_affordances>` output. This is synchronization, not an ideation-template redesign.

#### Code and docs

Change:

- `packages/core/src/compiler/sections/records-tail.ts` location rendering (`renderLocations`, plus `renderObjects` if social/material clauses extend there) — shared by both prose and ideation, so no separate ideation serializer exists or is needed (`packages/core/src/compiler/sections/ideation.ts` renders only `<ideation_slots>`);
- field guidance and compile destinations;
- compiler contract `{locations}`;
- `docs/ideation-prompt-template.md` — update the `<locations_objects_affordances>` description to include hazards/shelters and social rules;
- prompt rationale only as needed;
- location/compiler golden and stress tests, including the ideation golden (`packages/core/test/golden-ideation.prompt.txt`).

No migration is required.

#### §29 clearance

This strengthens physical continuity (§29.7), remains deterministic, uses only selected records, and does not force an event. A hazard is a constraint/affordance condition, not a command that harm occur; a social rule is pressure, not a required beat.

### 8.3 Make retained non-prompt fields explicit

The guidance system should not rely on a broad default that makes every prose-looking or structured field appear conditionally prompt-facing. Add field-specific destinations/statuses for at least the following:

| Field | Keep because | Prompt status |
|---|---|---|
| `ENTITY.roles_in_story` | author categorization, browser/editor organization, continuity interpretation | **not literal prompt content** |
| `ENTITY.aliases` and lifecycle/timestamp metadata | lookup/display, identity continuity, operational filtering/audit | **not literal prompt content unless used to resolve labels** |
| `OBJECT.durability` | authorial salience/classification of the object record itself | **not currently literal prompt content** |
| `EVENT.sequence_order` | chronology authoring metadata; active doc explicitly defers prompt wiring | **not prompt-facing and does not order compilation** |
| `PLAN.fallback_steps` | records the holder’s known contingencies for author continuity | **not prompt-facing by default**; avoids turning alternatives into soft branches |
| `CLOCK.tick_history.*` | continuity/audit history of prior ticks | **not prompt-facing**; only current pressure/trigger/threshold/effects compile |
| `OPEN THREAD.answer_if_known` | private resolution tracking | **not prompt-facing** |
| `RELATIONSHIP.axis` | structured classification/filtering and validator/UI support | **not literal prompt content** |
| `RELATIONSHIP.direction_kind` | endpoint semantics/validation | **not literal prompt content** |
| `RELATIONSHIP.value` | structured intensity metadata | **not literal prompt content** |
| `RELATIONSHIP.valence` | structural relationship characterization | **not literal prompt content** |
| `RELATIONSHIP.visibility` | knowledge/reveal classification and UI support | **not literal prompt content unless a future rule uses it** |
| record IDs, source provenance, timestamps, diagnostic severity | resolution/audit/validation | **validation or operational only** |

For `RELATIONSHIP`, keep the current prose-facing contract: `description`, `pressure_text`, and `current_expression` are the writer-facing representation. The structured fields remain useful without being dumped as raw enum labels.

For `PLAN.fallback_steps`, guidance should state that when a fallback becomes current, the author should update `current_step`, selected pressure, or current state rather than expect the compiler to offer multiple future options.

For `CLOCK.tick_history`, guidance should state that historical ticks remain visible to the author but are excluded from current prompt context unless their result is represented as current state, event, consequence, or current clock pressure.

### 8.4 Guidance implementation surface

Change:

- `packages/core/src/records/compile-destinations.ts`;
- `field-guidance-records.ts`;
- `field-guidance.ts`;
- editor descriptors where destination badges/help are derived;
- guidance coverage and doctrine tests;
- `docs/story-record-schema.md` prompt-treatment notes where absent;
- `docs/compiler-contract.md` §9 prompt-facing vs validation-only fields.

This subsection is a doc/guidance truthfulness correction. It does not tighten stored Zod shapes and requires no migration.

---

## 9. Examined but unchanged — global story properties

### 9.1 STORY CONTRACT fields retained

| Field/group | Concrete function |
|---|---|
| `title` | stable story identity and prompt anchoring |
| `premise` | durable high-level story identity, not a current recap |
| `genre_mode` | genre conventions and reader expectation constraints |
| `tone` | prose-quality and tonal-control constraint |
| `setting_baseline` | durable world/setting context against which current state is interpreted |
| `content_intensity` | structured maturity envelope and validation/configuration input |
| `explicitness` | nuanced author-written treatment within that envelope |
| `language_register` | durable linguistic/register control distinct from current character voice |

No other STORY CONTRACT field is a removal candidate. The removed `prose_preferences` precedent must not be generalized into stripping rich fields merely because their effects are qualitative.

### 9.2 UNIVERSAL CONTENT POLICY

All five fields remain:

- `rating_label` gives a concise configured classification;
- `allowed_content_scope` states what story material may be rendered;
- `tonal_handling` states how that material should be treated in prose;
- `governing_policy_note` preserves provider/platform policy as the outer boundary;
- `character_bias_handling` prevents a character’s prejudice or misconception from becoming narrator-certified truth.

These are not five restatements of “mature content.” They divide envelope, treatment, policy hierarchy, and epistemic framing, and the compiler contract gives each a concrete placeholder.

### 9.3 PROSE MODE

Retain all fields:

- `pov_character` controls focal authority and knowledge-profile derivation;
- `person` and `tense` control grammar;
- `psychic_distance` and `interiority_mode` control access and narration distance;
- `dialogue_density` and `paragraphing` control local prose rhythm;
- `language_output` controls output language;
- `special_style_constraints` gives authorial control for constraints not captured by enums.

No missing prose-mode field clears the bar. Additional knobs such as sentence length, figurative-density sliders, “show versus tell,” scene pace, or sensory quotas would overlap existing prose fields, stiffen output, and risk turning craft preferences into checklists.

---

## 10. Examined but unchanged — generation-time brief

### 10.1 Active working set after the ID removal

Retain:

- `selected_records`;
- `active_onstage_cast_full[].cast_member_id`;
- `active_onstage_cast_full[].local_function`;
- `present_minor_cast_compressed`;
- `offstage_relevant_cast`;
- `selected_pov`.

These fields are the explicit user-controlled inclusion and cast-band authority. They back reference resolution, cast floors, deterministic ordering, POV validation, and prompt inspection. The audit recommends removing only the unrelated `manual_directive_id`.

### 10.2 Current authoritative state

Every subfield has a concrete current-continuity function:

| Field | Function |
|---|---|
| `current_time` | temporal anchor and clock/timing consistency |
| `current_location` | scene-space authority |
| `onstage_entities` | presence authority |
| `immediate_situation_summary` | compact user-authored current situation; never derived from prose |
| `offstage_pressuring_entities` | source of interruption/pursuit/institutional pressure |
| `positions` | blocking, distance, gaze, transfer, intimacy, violence, turn-taking |
| `possessions` | object ownership/carry/transfer continuity |
| `visible_conditions` | injuries, restraints, disguises, exhaustion, visible status |
| `environmental_conditions` | action/perception/tone/route constraints |
| `entity_statuses` | current agency, consciousness, availability, captivity, status |
| `line_of_sight_and_visibility` | who can see/hear whom; perception and secrecy |
| `pov_cannot_perceive_now` | POV-specific limitation distinct from geometry |
| `routes_and_exits` | movement, pursuit, escape, entrance, containment |
| `available_time` | deadlines, interruption, timed feasibility |
| `consent_or_force_conditions` | agency and coercion boundary for intimacy, restraint, seizure, rescue, violence |
| `current_locks` | explicit hard local constraints |

No field is merely decorative. Context gating prevents the block from becoming a universal form burden.

### 10.3 Immediate handoff

Retain the four fields:

- `recent_causal_context`;
- `last_visible_moment`;
- `prior_accepted_prose_status_or_handoff_note`;
- `begin_after`.

The long name of `prior_accepted_prose_status_or_handoff_note` is justified by its firewall function. It is a user-authored status/bridge lane, not accepted prose, not a summary generated from accepted prose, and not a candidate archive. Removing it would either weaken continuation clarity or pressure authors toward forbidden prose copying.

### 10.4 Manual moment directive

Retain the triad:

- `must_render` expresses the required local outcome/action/image;
- `may_render_if_naturally_caused` permits but does not force optional material;
- `do_not_force` protects against incident manufacture and over-eager payoff.

Collapsing the triad into one prose box would blur obligation, permission, and prohibition. Adding scene goals, beats, escalation targets, or payoff requirements would cross the §12 line.

### 10.5 Current cast voice pressure after normalization

Retain all prose/list fields:

- `current_voice_pressure`;
- `dialogue_pressure`;
- `pov_narration_pressure`;
- `nonverbal_or_silence_pressure`;
- `current_must_preserve`;
- `current_must_avoid`.

They represent distinct current-generation channels. External persona research consistently treats role profile and dialogue context as relevant to role consistency, while the Loom rationale correctly distinguishes durable identity from moment-specific pressure. The fix is delivery and authority normalization, not deletion.

### 10.6 Cast voice overrides after scope removal

Retain:

- `cast_member_id`;
- `reason`;
- `applies_to`;
- `override_text`.

These give precise temporary authorial control without mutating the durable dossier. `reason` is worth keeping even if not always prompt-facing: it helps the author understand why a temporary exception exists and can support validation/UI review. `applies_to` prevents a dialogue change from silently overriding all narration, body, diction, profanity, or silence behavior.

### 10.7 Generation validation focus

Retain the focus tags and deterministic generation-context normalization. They let Loom activate only relevant matrix rows without sending diagnostics as instructions. Removing the block would either weaken fail-closed validation or force every context-gated field universally.

### 10.8 Stop guidance

Retain the local stop fields and universal stop rule. Blank optional soft-unit guidance must remain nonblocking. No “beat count,” “chapter target,” “arc progress,” or “escalation quota” field should be added.

---

## 11. Examined but unchanged — record taxonomy

### 11.1 ENTITY and ENTITY STATUS remain distinct

`ENTITY` answers “what is this thing and what kind of agent/state-holder can it be?”  
`ENTITY STATUS` answers “what is its current life/agency/location/visibility/activity state?”

Merging them would make current operational state harder to include/exclude atomically and would mix durable identity with frequently changing state.

### 11.2 CAST MEMBER remains a rich-dossier exception

The rich record is justified because voice, body, behavior, perception, agency, pressure response, and anti-generic constraints interact. Splitting every trait into atomic records would make active cast curation slower and increase the risk that essential voice material is omitted. Persona research supports treating role profiles and dialogue context as a distinct consistency problem; emotional-fidelity research likewise shows that affective faithfulness is not guaranteed by general model capability alone.

The existing safeguards against over-conditioning are sound:

- optional, sparse sample utterances;
- bounded count/length;
- speech-function annotation;
- default non-copy policy;
- anti-repetition warnings;
- current pressure separated from durable identity.

No new “voice,” “gesture,” “trauma,” “archetype,” or “personality” category is warranted; those would duplicate the dossier or reduce nuanced prose fields to labels.

### 11.3 FACT, BELIEF, and SECRET remain separate

This three-way split is essential:

- `FACT` is objective/current truth;
- `BELIEF` is holder-specific, possibly false or incomplete epistemic state;
- `SECRET` is truth plus controlled distribution/reveal semantics.

Computational narrative research repeatedly distinguishes world truth from character belief because differing or mistaken beliefs change plausible action and can explain failed attempts. That supports Loom’s split without importing a planning engine.

A single `KNOWLEDGE` record would blur truth, belief, concealment, and reveal permission. A separate `RUMOR` category is unnecessary: a rumor is a BELIEF with source/access details expressed in prose or related EVENT/FACT records.

### 11.4 POV and audience profiles remain derived, not new stored categories

The profiles correctly compile from PROSE MODE, FACT, BELIEF, SECRET, EVENT, ENTITY STATUS, and current perceptual limits. Storing them as independent durable records would create duplicate authority and stale derived state.

### 11.5 LOCATION, OBJECT, and VISIBLE AFFORDANCE remain separate

- `LOCATION` models scene space, access, perception, hazards/shelters, social rules, and status.
- `OBJECT` models possession, location, visibility, usable affordances, constraints, durability classification, and lifecycle.
- `VISIBLE AFFORDANCE` models a currently available/blocked action family, its requirements, risk, and change durability.

An affordance is not an event or plan: it says what can be done now, not what must happen. This is exactly the kind of local causal possibility §12 permits.

No new `RESOURCE` category is needed. A resource is normally an OBJECT, a CLOCK, an OBLIGATION, an AFFORDANCE requirement, or PLAN resource prose depending on its function.

### 11.6 EVENT remains causal history, not sequence machinery

Retain all fields. `sequence_order` remains authoring-only and must not control compiler order. `causes`, `effects`, visibility, knowledge, status, and current relevance make historical material usable only when it bears on current continuity.

Do not add a scene, chapter, beat, act, arc, or “story event slot” category.

### 11.7 INTENTION and PLAN remain distinct

An intention is a holder’s commitment or desired direction; a plan is an organized method with resources, blockers, current step, visibility, salience, and drive permission. Research on intention revision distinguishes changing an intention from replanning after failure, which supports separate primitives.

The categories must remain local state/pressure records. Loom must not calculate plans, select goals, or construct plot.

### 11.8 CLOCK, OBLIGATION, CONSEQUENCE, and OPEN THREAD remain distinct

- `CLOCK` is changing temporal/resource/exposure pressure with a trigger and threshold.
- `OBLIGATION` is a normative debt/promise/role between parties.
- `CONSEQUENCE` is a current or pending effect attached to a cause/target.
- `OPEN THREAD` is unresolved audience/story pressure that does not command closure.

They overlap in ordinary language but not operationally. Merging them would weaken validation and prompt grouping. The current status/current-relevance fields prevent resolved or abandoned pressure from leaking into current generation.

### 11.9 RELATIONSHIP and EMOTION remain distinct

A relationship is relatively durable social structure between endpoints; an emotion is current affect held by an entity. Relationship pressure may cause emotion, and emotion may change relationship expression, but they are not the same state.

Emotional-fidelity work supports treating emotion as its own consistency dimension. The category’s `behavioral_pressure` and `surface_expression` are particularly valuable because they turn affect into behavior without reducing it to a mood label.

---

## 12. Missing-field audit — candidates examined and rejected

| Candidate field | Possible benefit | Why it does not clear the bar now |
|---|---|---|
| `PLAN.prerequisites` / `INTENTION.prerequisites` | deterministic support checks | Existing `resources`, `blockers`, `current_step`, EVENT causes, AFFORDANCE requires, and current locks cover explicit local support. A new parallel prerequisite path would duplicate authority unless a separately specified validator requires it. |
| `BELIEF.access_route` / knowledge provenance | stronger knowledge-route validation | Valuable research direction, already recognized in the roadmap, but current EVENT visibility/known-by, SECRET holders/clues, POV profiles, and prose belief source fields provide partial coverage. No complete deterministic contract or migration semantics has been established. |
| structured `CLOCK.deadline` | compare against current time | Current time and clocks are prose-flexible. Adding one structured deadline without a complete story-time model would create false precision and inconsistent comparisons. |
| `EVENT.story_time` / anachrony flag | chronology checks | The roadmap correctly treats this as a larger chronology model. It is not a field-sized addition and risks making `sequence_order` into plot machinery. |
| OPEN THREAD age/starvation metadata | stale-thread warnings | Storage timestamps are not story time. Adding a second age path without a defined story-time authority would mislead. |
| scene goal / outcome / turn / beat fields | local structure | High plot-rail risk. Existing directive, intentions, plans, handoff, current state, and stop guidance already express the next local unit without imposing scene-sequel machinery. |
| explicit theme/motif field | thematic prose control | STORY CONTRACT premise/tone/genre and FACT/OBJECT/EVENT symbolism in prose can carry this. A structured theme command risks forcing interpretation and repetition. |
| sensory checklist fields | vivid prose | CAST MEMBER perception/embodiment, LOCATION visibility/sound/environment, and prose-mode/style constraints already provide control. A quota/checklist would stiffen prose. |
| separate desire/goal category | character motivation | `INTENTION`, CAST MEMBER appetite/private pressure, PLAN objective, OBLIGATION, and EMOTION cover stable and current motivational pressure. |
| separate threat/risk category | danger representation | `CLOCK`, `CONSEQUENCE`, `OPEN THREAD`, `VISIBLE AFFORDANCE.risk`, LOCATION hazards, and current state cover it compositionally. |
| provenance/source metadata for every field | auditability | Broad source provenance is operational metadata, not a story-schema primitive, and would add clerical load without a defined compiler/validator use. |
| automatic summary/cache field | context compression | Violates the prohibition on automatic prose-derived summaries and risks hidden prompt state. |
| “previous prose excerpt” field | continuity/style bridge | Directly violates accepted-prose exclusion. The narrow handoff fields are the constitutional solution. |

**Verdict:** no missing field should be added in the proposed change.

Promising roadmap candidates should remain roadmap candidates until a separate proposal demonstrates a deterministic rule, a nonduplicative authority path, realistic authoring cost, migration semantics, and §29 clearance.

---

## 13. Missing-category audit — candidates examined and rejected

| Candidate category | Existing representation | Verdict |
|---|---|---|
| FACTION / INSTITUTION / ORGANIZATION | `ENTITY.entity_kind` plus FACT, RELATIONSHIP, OBLIGATION, PLAN, CLOCK | no new category |
| SYSTEM / ENVIRONMENTAL FORCE / SUPERNATURAL FORCE | `ENTITY.entity_kind`, LOCATION, CLOCK, FACT, CONSEQUENCE | no new category |
| WORLD RULE / LORE | FACT, with SECRET/BELIEF where distribution differs | no new category |
| MEMORY / TRAUMA | EVENT plus BELIEF, EMOTION, CAST MEMBER durable fields, SECRET where protected | no new category |
| RUMOR / CLAIM | BELIEF plus EVENT/FACT source context | no new category |
| CLUE | SECRET clue carrier plus OBJECT/EVENT/FACT/AFFORDANCE | no new category |
| RESOURCE | OBJECT, CLOCK, PLAN resources, AFFORDANCE requirements | no new category |
| THREAT / HAZARD | LOCATION hazards, CLOCK, CONSEQUENCE, OPEN THREAD, AFFORDANCE risk | no new category |
| GOAL / DESIRE | INTENTION, CAST MEMBER appetite/private pressure, PLAN objective | no new category |
| SOCIAL NORM / LAW | LOCATION social rules, FACT, OBLIGATION, ENTITY institution | no new category |
| ACTION | VISIBLE AFFORDANCE for possibility; EVENT for occurrence; PLAN current step for intended tactic | no new category |
| SCENE / BEAT / SEQUEL / CHAPTER / ACT | manual directive, handoff, current state, stop guidance provide local control | reject; §12/§29.1 conflict risk |
| ARC / QUEST / STORYLINE / BRANCH | existing pressure records can represent current commitments without future structure | reject; constitutional conflict |
| THEME / MOTIF | STORY CONTRACT and ordinary selected records | no new category |
| NARRATOR as a separate record | PROSE MODE plus CAST MEMBER/ENTITY when embodied | no new category |
| AUDIENCE as a record | derived audience knowledge profile | no new category |
| CANDIDATE / ACCEPTED SEGMENT as story records | separate archive/workflow surfaces | reject; would blur continuity authority |

The taxonomy’s strength is compositionality. An institution can be an ENTITY that holds an OBLIGATION, advances a CLOCK, owns OBJECTs, has RELATIONSHIPs, and causes CONSEQUENCEs. A trauma can be an EVENT that creates BELIEF and EMOTION and alters a CAST MEMBER dossier. Adding a category for every literary noun would destroy atomic inclusion and create overlapping authority.

**Verdict:** no missing category should be added.

---

## 14. Harm-mode audit

### 14.1 Prose degradation / over-constraint

No live rich prose field was found to warrant deletion on this ground. The main protections are already correct:

- current state is factual/state-like rather than prose imitation;
- manual directives distinguish must/may/do-not-force;
- open threads do not demand payoff;
- clocks do not tick merely for excitement;
- stop guidance rejects chapter/arc/beat packages;
- cast sample utterances are sparse and non-copyable by default.

The guidance corrections for `PLAN.fallback_steps` and `CLOCK.tick_history` are important because compiling them would encourage alternative futures or stale event repetition.

### 14.2 Misleading authors or agents

Confirmed defects:

- fixed `continuity_philosophy`;
- phantom `manual_directive_id`;
- duplicate current-pressure `local_function`;
- fixed override `scope`;
- redundant `{voice_pressure}` destination (a real resolver in `pressure.ts` duplicating the active pins lane);
- valid present-minor pressure accepted but not delivered;
- `ENTITY` and `LOCATION` fields with promised/obvious prompt functions omitted from renderers;
- retained operational fields insufficiently explicit about non-prompt status.

These are the change set’s core.

### 14.3 Contamination / hidden state

No new contamination path was found in the audited schema. Important boundaries are sound:

- accepted prose is not prompt context;
- rejected and superseded candidates are not prompt context;
- immediate handoff is user-authored;
- current situation is not automatically summarized from prose;
- working-set inclusion is explicit;
- validation focus is not prompt content;
- private notes are isolated.

No automatic summary, retrieval ranking, or hidden relevance field should be added.

### 14.4 Generator bias / forced events

No current record category inherently violates §12 when used as documented. The key boundary is current pressure versus future structure:

- PLAN represents a holder’s current plan, not the app’s plot;
- CLOCK represents current pressure, not mandated escalation;
- OPEN THREAD does not command closure;
- VISIBLE AFFORDANCE represents possibility, not required action;
- CONSEQUENCE may be pending/current without dictating the next scene.

This is why the audit rejects scene, beat, arc, quest, payoff, and branch categories and keeps plan fallbacks/tick history out of literal prompt context.

---

## 15. Implementation order

Use the same package-boundary discipline established by the removal precedent.

### Phase 1 — core schema and types

1. Remove:
   - `storyContract.continuity_philosophy`;
   - `active_working_set.manual_directive_id`;
   - `current_cast_voice_pressure[].local_function`;
   - `cast_voice_overrides[].scope`.
2. Update draft, ready, normalized, descriptors, paths, and fixture types.
3. Typecheck core before continuing.

### Phase 2 — server migrations before strict parse

1. Global-config migration:
   - live STORY CONTRACT rows;
   - orphan STORY CONTRACT records.
2. Generation-session migration:
   - working-set directive ID;
   - nested current-pressure local function;
   - nested override scope.
3. Make every pass idempotent and lossless.
4. Exercise real project-open/read paths.

### Phase 3 — validation and working-set integrity

1. Remove dead ID pruning/reference logic.
2. Derive active voice role from the working set.
3. Make present-minor speech checks depend on guidance that the compiler will render.
4. Preserve draftability/readiness separation and warning/blocker taxonomy.

### Phase 4 — compiler

1. Remove `{voice_pressure}` from template types/map/empty states.
2. Render present-minor current pressure.
3. Render selected non-person/undossiered entity identity in material pressure.
4. Render location hazards/shelters and social rules.
5. Preserve deterministic order and all selected full cast dossiers.

### Phase 5 — field guidance and web UI

1. Remove controls/help for removed fields.
2. Add truthful prompt destinations.
3. Add explicit non-prompt annotations for retained operational/history/classification fields.
4. Keep the generation-time-only nature of overrides visible at block level.

### Phase 6 — authority documents

Update in authority order:

1. `docs/story-record-schema.md`
2. `docs/compiler-contract.md`
3. `docs/prompt-template.md`
4. `docs/prompt-template-rationale.md`
5. `docs/ideation-prompt-template.md` (registered domain authority with no conformance test — sync by hand for the shared location/present-minor/override renderings)
6. `docs/validation-rule-inventory.md`
7. stress/demo support docs where behavior changed

Do not independently rewrite prompt prose beyond the required placeholder/label synchronization.

### Phase 7 — regression and proof

At minimum:

- lint;
- strict TypeScript typecheck;
- all workspace tests;
- core compiler/golden tests;
- ideation compiler/golden tests (`packages/core/test/compiler-ideation-golden.test.ts`, `packages/core/test/golden-ideation.prompt.txt`);
- field-path and field-guidance coverage;
- migration tests for live/orphan global config and saved generation drafts;
- project-open recoverability tests;
- validation matrix voice tests;
- present-minor compiler tests;
- entity/location renderer tests;
- prompt-template/contract conformance tests;
- deterministic repeat-compilation test;
- grep proof for removed identifiers and `{voice_pressure}`;
- ensure generated build artifacts are refreshed before grep proof.

---

## 16. Test matrix required for the eventual implementation spec

| Area | Required regression |
|---|---|
| STORY CONTRACT migration | legacy live row strips fixed field before strict parse |
| orphan global config | legacy orphan is moved, not dropped as malformed |
| generation draft migration | all three removed nested/session keys are stripped without prose loss |
| idempotence | running each migration twice produces the same payload |
| draftability | incomplete generation draft still saves |
| readiness | blank `must_render` still blocks Preview/Generate |
| working-set integrity | no manual-directive ID classification/pruning remains |
| voice role derivation | active/full role comes from working-set entry |
| present-minor voice | supplied current dialogue pressure appears in compressed output |
| false pass prevention | non-rendered/non-speech material cannot clear present-minor speech requirement |
| override behavior | `applies_to` still limits current-generation override |
| prompt conformance | `{voice_pressure}` removed from template, contract, map, type, and golden |
| ENTITY rendering | selected non-person entity kind/description appears once in material pressure |
| cast duplication guard | entity renderer does not duplicate a selected full cast dossier |
| LOCATION rendering | hazards/shelters and social rules render in deterministic order |
| ideation rendering | shared renderers propagate to the ideation prompt: hazards/social rules appear in ideation `<locations_objects_affordances>`; present-minor current voice-delivery pressure stays prose-only; override-scope clause drops from ideation cast renderings; `docs/ideation-prompt-template.md` synced |
| author-only fields | fallback steps, tick history, sequence order, thread answer, and structured relationship metadata do not leak into prompt |
| determinism | identical normalized input/version produces byte-identical prompt |
| accepted-prose firewall | none of the changes admit accepted/candidate/derived prose |
| full suite | lint, typecheck, tests, build, and source grep all pass |

---

## 17. Consolidated `FOUNDATIONS.md` §29 clearance

| Checklist section | Clearance |
|---|---|
| §29.1 Identity | No autonomous generation, future-plot choice, branch, arc, beat, or rail is introduced. The category-addition verdict is explicitly “none.” |
| §29.2 Continuity authority | Duplicate stored fields are removed; no LLM updates or inferred canon are added. |
| §29.3 Active working set | Selection remains explicit. Voice roles are derived from explicit cast-band data, and full dossiers remain uncompressed. |
| §29.4 Prompt compilation | All new rendering is deterministic and snapshot-bound. A dead placeholder is removed in a same-change template/contract update. Accepted prose remains excluded. |
| §29.5 Validation | A voice validation pass is made stricter in the correct sense: it must correspond to delivered authority. Draftability, blocker/warning separation, and optional soft guidance are preserved. |
| §29.6 POV and reveal | Knowledge, secret, audience, and POV structures are unchanged; current narration pressure remains subordinate to them. |
| §29.7 Physical continuity | Location hazard/social-rule delivery and entity pressure improve current physical/social constraint visibility. |
| §29.8 Accepted prose archive | No archive or handoff boundary changes; no prose is added to prompt context. |
| §29.9 Prompt audit and secrets | No key/logging/prompt persistence behavior changes. |
| §29.10 Data ownership | Only local, idempotent stored-payload migrations are required. |
| §29.11 Quality/workflow | Removes four false controls, improves guidance truthfulness, preserves rich cast, and makes validation more legible. |
| §29.12 Author-private notes | Notes remain completely outside schema, working set, validation, compiler, and assistance output. |

**FOUNDATIONS-amendment-required recommendations:** none.

---

## 18. Risks and implementation cautions

### 18.1 Migration ordering is the highest implementation risk

All four field removals tighten `.strict()` schemas. Legacy payload stripping must run before strict parsing. A migration that covers only newly moved/orphan records but not live rows would recreate the exact storage failure analyzed in the removal precedent.

### 18.2 Present-minor role derivation must remain deterministic

Do not parse pressure prose semantically. Use selected band membership and structured/nonblank destination fields. If the current schema cannot deterministically identify which present-minor character may speak under a broad focus tag, improve the validator’s lane rule or UI wording—not by adding an LLM classifier and not by restoring duplicate `local_function`.

### 18.3 Entity rendering must avoid cast duplication

A selected full CAST MEMBER already carries rich identity. The entity-pressure serializer should primarily cover non-person entities and selected person entities lacking a selected dossier. Add explicit tests for one-and-only-one rendering.

### 18.4 “Not prompt-facing” does not mean “unnecessary”

The retained guidance-only fields have authoring, classification, continuity-history, validation, or UI functions. The implementation should correct their destination labels, not delete them in a broad cleanup.

### 18.5 Do not turn roadmap candidates into opportunistic scope

Structured chronology, knowledge provenance, prerequisite graphs, and stale-thread aging each require their own evidence and contract. They are not hidden prerequisites for this cleanup.

---

## 19. Final determination

Continuity Loom does **not** need a broader story ontology. The record taxonomy is already appropriately compositional and constitutionally bounded. The global blocks and generation brief are also fundamentally correct.

The warranted work is precise:

- delete four false or duplicate stored authorities;
- delete one dead prompt placeholder;
- make voice validation correspond to delivered present-minor context;
- render two classes of existing selected state that currently fall through;
- make field guidance tell the truth about author-only and validation-only data.

That is enough to satisfy the field-economy rule without weakening rich prose control or manufacturing a new schema for its own sake.

---

## 20. Repository evidence map

All repository URLs below are pinned to the supplied target commit.

### Governing and domain authorities

- [`docs/ACTIVE-DOCS.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/ACTIVE-DOCS.md)
- [`docs/FOUNDATIONS.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/FOUNDATIONS.md)
- [`docs/story-record-schema.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/story-record-schema.md)
- [`docs/compiler-contract.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/compiler-contract.md)
- [`docs/prompt-template.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/prompt-template.md)
- [`docs/prompt-template-rationale.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/prompt-template-rationale.md)
- [`docs/validation-rule-inventory.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/validation-rule-inventory.md)
- [`docs/narrative-theory-blocker-roadmap.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/narrative-theory-blocker-roadmap.md)
- [`docs/stress-suite.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/stress-suite.md)
- [`docs/stress-coverage-matrix.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/stress-coverage-matrix.md)
- [`docs/demo-blocker-recipes.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/docs/demo-blocker-recipes.md)

### Precedent and provenance

- [`archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/archive/specs/SPEC-024-remove-story-contract-prose-preferences.md)
- [`archive/specs/SPEC-003-typed-data-model-and-record-identity.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/archive/specs/SPEC-003-typed-data-model-and-record-identity.md)
- [`archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md`](https://raw.githubusercontent.com/joeloverbeck/continuity-loom/89706560a6af55a3741450b15d89d5dd5ad082d0/archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md)

### Load-bearing implementation seams

- [`packages/core/src/records/global-config.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/global-config.ts)
- [`packages/core/src/records/generation-brief.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/generation-brief.ts)
- [`packages/core/src/records/generation-brief-draft.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/generation-brief-draft.ts)
- [`packages/core/src/records/generation-brief-readiness.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/generation-brief-readiness.ts)
- [`packages/core/src/records/registry.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/registry.ts)
- [`packages/core/src/records/entity.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/entity.ts)
- [`packages/core/src/records/space-material.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/space-material.ts)
- [`packages/core/src/records/causal-pressure.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/causal-pressure.ts)
- [`packages/core/src/records/relationship-emotion.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/relationship-emotion.ts)
- [`packages/core/src/records/field-guidance-brief-config.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/field-guidance-brief-config.ts)
- [`packages/core/src/records/field-guidance-records.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/field-guidance-records.ts)
- [`packages/core/src/records/compile-destinations.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/compile-destinations.ts)
- [`packages/core/src/records/working-set-integrity.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/records/working-set-integrity.ts)
- [`packages/core/src/compiler/placeholder-map.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/compiler/placeholder-map.ts)
- [`packages/core/src/compiler/sections/front.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/compiler/sections/front.ts)
- [`packages/core/src/compiler/sections/cast.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/compiler/sections/cast.ts)
- [`packages/core/src/compiler/sections/pressure.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/compiler/sections/pressure.ts)
- [`packages/core/src/compiler/sections/records-tail.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/compiler/sections/records-tail.ts)
- [`packages/core/src/validation/rules/matrix-voice.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/validation/rules/matrix-voice.ts)
- [`packages/core/src/validation/rules/matrix-physical.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/validation/rules/matrix-physical.ts)
- [`packages/core/src/validation/rules/matrix-knowledge.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/core/src/validation/rules/matrix-knowledge.ts)
- [`packages/server/src/global-config-migration.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/server/src/global-config-migration.ts)
- [`packages/server/src/generation-session-draft-migration.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/server/src/generation-session-draft-migration.ts)
- [`packages/server/src/project-store.ts`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/server/src/project-store.ts)
- [`packages/web/src/config/StoryConfigEditor.tsx`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/web/src/config/StoryConfigEditor.tsx)
- [`packages/web/src/generation-brief/GenerationBriefView.tsx`](https://github.com/joeloverbeck/continuity-loom/blob/89706560a6af55a3741450b15d89d5dd5ad082d0/packages/web/src/generation-brief/GenerationBriefView.tsx)

The full exact-URL evidence ledger was reported before analysis. No repository metadata, default-branch lookup, branch fetch, code search, snippet search, clone, or connector namespace label was used as evidence.

---

## 21. External sources

1. Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, and Percy Liang. “Lost in the Middle: How Language Models Use Long Contexts.” *Transactions of the Association for Computational Linguistics* 12 (2024): 157–173. https://aclanthology.org/2024.tacl-1.9/ — Used to support the conservative treatment of prompt duplication and salience placement; not used to justify silent compression of selected records.

2. Stephen G. Ware and Cory Siler. “Sabre: A Narrative Planner Supporting Intention and Deep Theory of Mind.” *Proceedings of the Seventeenth AAAI Conference on Artificial Intelligence and Interactive Digital Entertainment* (2021). https://cdn.aaai.org/ojs/18896/18896-52-22662-1-2-20211004.pdf — Used as representational evidence that intentions and limited/possibly wrong beliefs are distinct explanatory primitives. Loom does not adopt Sabre’s planner architecture or author-goal search.

3. Matthew Christensen, Jennifer M. Nelson, and Rogelio E. Cardona-Rivera. “Using Domain Compilation to Add Belief to Narrative Planners.” *Proceedings of the Sixteenth AAAI Conference on Artificial Intelligence and Interactive Digital Entertainment* (2020). https://ojs.aaai.org/index.php/AIIDE/article/download/7405/7334/10934 — Used to support keeping world truth and character belief distinct because differing beliefs change plausible choices and failed actions.

4. Rushit Sanghrajka, R. Michael Young, and Brandon Thorne. “HeadSpace: Incorporating Action Failure and Character Beliefs into Narrative Planning.” *Proceedings of the AAAI Conference on Artificial Intelligence and Interactive Digital Entertainment* 18.1 (2022): 171–178. https://ojs.aaai.org/index.php/AIIDE/article/view/21961 — Used to support the belief/action-condition distinction and the value of representing misconception-driven failed action without adding a Loom planning engine.

5. Matthew William Fendt and R. Michael Young. “The Case for Intention Revision in Stories and Its Incorporation into IRIS — A Story-Based Planning System.” AAAI narrative-intelligence proceedings (2011). https://cdn.aaai.org/ojs/12461/12461-52-15989-1-2-20201228.pdf — Used to support keeping intention and plan as separate records: revising a commitment is not the same operation as replanning.

6. Yu-Min Tseng, Yu-Chao Huang, Teng-Yun Hsiao, Wei-Lin Chen, Chao-Wei Huang, Yu Meng, and Yun-Nung Chen. “Two Tales of Persona in LLMs: A Survey of Role-Playing and Personalization.” *Findings of the Association for Computational Linguistics: EMNLP 2024*, 16612–16631. https://aclanthology.org/2024.findings-emnlp.969/ — Used to support retaining an explicit rich persona/role surface rather than reducing active cast to generic role labels.

7. Ke Ji, Yixin Lian, Linxu Li, Jingsheng Gao, Weiyuan Li, and Bin Dai. “Enhancing Persona Consistency for LLMs’ Role-Playing using Persona-Aware Contrastive Learning.” *Findings of the Association for Computational Linguistics: ACL 2025*, 26221–26238. https://aclanthology.org/2025.findings-acl.1344.pdf — Used cautiously as evidence that role characteristics and dialogue context are distinct inputs to persona consistency; the proposed Loom change does not copy its training method.

8. Qiming Feng, Qiujie Xie, Xiaolong Wang, Qingqiu Li, Yuejie Zhang, Rui Feng, Tao Zhang, and Shang Gao. “EmoCharacter: Evaluating the Emotional Fidelity of Role-Playing Agents in Dialogues.” *Proceedings of NAACL 2025*, 6218–6240. https://aclanthology.org/2025.naacl-long.316/ — Used to support retaining EMOTION as a distinct current-consistency surface rather than assuming a general character profile guarantees emotional fidelity.

---

## 22. Limitation statement

This document proves only that its repository analysis used the user-supplied target commit and exact-commit file URLs. It does not prove that `89706560a6af55a3741450b15d89d5dd5ad082d0` was the latest `main` on 2026-06-20.

No repository was cloned and no implementation tests were executed as part of this research audit. The test and verification sections above are requirements for the eventual implementation work.
