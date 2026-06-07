# SPEC-015 — Field Guidance and Contextual Help

**Status:** proposed implementation specification  
**Feature name:** Field Guidance System  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630`  
**Output:** Markdown implementation specification only. No code patches, no implementation tickets, no zip.

This workflow analyzes the user-supplied target commit only. It does **not** independently verify latest `main`, branch state, or repository state after `25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630`.

No abort condition was encountered: every repository source used for analysis was fetched from the exact `joeloverbeck/continuity-loom` raw GitHub URL pattern for the target commit.

---

## 1. Exact-commit evidence ledger

Repository evidence was fetched only by exact raw URLs of this form:

```text
https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/<path>
```

### 1.1 Active docs read

- `docs/ACTIVE-DOCS.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/ACTIVE-DOCS.md`
- `docs/FOUNDATIONS.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/FOUNDATIONS.md`
- `docs/archival-workflow.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/archival-workflow.md`
- `docs/compiler-contract.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/compiler-contract.md`
- `docs/demo-blocker-recipes.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/demo-blocker-recipes.md`
- `docs/prompt-template-rationale.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/prompt-template-rationale.md`
- `docs/prompt-template.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/prompt-template.md`
- `docs/story-record-schema.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/story-record-schema.md`
- `docs/stress-coverage-matrix.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/stress-coverage-matrix.md`
- `docs/stress-suite.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/stress-suite.md`
- `docs/user-guide.md`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/docs/user-guide.md`

### 1.2 Implementation files inspected

- `package.json`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/package.json`
- `packages/web/package.json`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/package.json`
- `packages/core/src/records/editor-descriptors.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/editor-descriptors.ts`
- `packages/core/src/records/registry.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/registry.ts`
- `packages/core/src/records/global-config.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/global-config.ts`
- `packages/core/src/records/generation-brief.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/generation-brief.ts`
- `packages/core/src/records/compile-destinations.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/compile-destinations.ts`
- `packages/core/src/records/cast-member.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/cast-member.ts`
- `packages/core/src/records/cast-member-sections.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/cast-member-sections.ts`
- `packages/core/src/records/entity.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/entity.ts`
- `packages/core/src/records/knowledge.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/knowledge.ts`
- `packages/core/src/records/causal-pressure.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/causal-pressure.ts`
- `packages/core/src/records/relationship-emotion.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/relationship-emotion.ts`
- `packages/core/src/records/space-material.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/records/space-material.ts`
- `packages/core/src/compiler/placeholder-map.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/compiler/placeholder-map.ts`
- `packages/core/src/compiler/compile-prompt.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/compiler/compile-prompt.ts`
- `packages/core/src/validation/engine.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/engine.ts`
- `packages/core/src/validation/rules/universal-blockers.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/universal-blockers.ts`
- `packages/core/src/validation/rules/universal-completeness.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/universal-completeness.ts`
- `packages/core/src/validation/rules/matrix-durable.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/matrix-durable.ts`
- `packages/core/src/validation/rules/matrix-knowledge.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/matrix-knowledge.ts`
- `packages/core/src/validation/rules/matrix-physical.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/matrix-physical.ts`
- `packages/core/src/validation/rules/matrix-voice.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/matrix-voice.ts`
- `packages/core/src/validation/rules/warnings.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/src/validation/rules/warnings.ts`
- `packages/core/test/editor-descriptors.test.ts`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/core/test/editor-descriptors.test.ts`
- `packages/web/src/records/RecordEditor.tsx`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/src/records/RecordEditor.tsx`
- `packages/web/src/records/CastMemberEditor.tsx`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/src/records/CastMemberEditor.tsx`
- `packages/web/src/config/StoryConfigEditor.tsx`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/src/config/StoryConfigEditor.tsx`
- `packages/web/src/generation-brief/GenerationBriefView.tsx`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/src/generation-brief/GenerationBriefView.tsx`
- `packages/web/src/styles.css`  
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/25ea294b3d146b3dc9cb2d05935c6d8d4d6e1630/packages/web/src/styles.css`

---

## 2. Problem statement

Continuity Loom already has rich story-state, prompt-compilation, validation, and generation-time brief concepts. The user problem is that the form surfaces do not make those concepts legible at the point of authoring. A writer filling a field often cannot tell:

- what the field means in Continuity Loom doctrine;
- whether the field is prompt-facing, validation-only, or operational metadata;
- which prompt section or placeholder it influences;
- whether it controls continuity authority, POV knowledge, reveal locks, physical state, cast voice, or local causal pressure;
- what enum values imply beyond their labels;
- what good entries look like and what misuse looks like.

This is not a “tooltip polish” problem. It is a product semantics problem. Continuity Loom needs a deterministic, test-covered **Field Guidance System** that sits beside the schema/editor descriptor layer and renders accessible contextual help in the UI.

---

## 3. User intent summary

The implementation must honor these resolved user intentions:

- Most fields should not show a permanent paragraph of help. Use an info button or disclosure by default.
- Critical instructions needed to complete the field must remain visible, not hidden in optional help.
- The main interaction should be click/tap/keyboard accessible, not hover-only.
- Help should explain prompt effects, validation effects, and continuity implications when applicable.
- Prompt-facing fields should name exact prompt destinations where that improves clarity.
- Validation-only and operational fields should explicitly say when they are **not sent to the prose model**.
- Enum values need descriptions only when their consequences are non-obvious.
- Small, high-impact enums may become radio/card controls when comprehension materially improves; this is not a blanket requirement.
- v1 help copy should be product-authored, deterministic, versioned, and test-covered. Do not allow project-specific custom help copy in v1.
- Scope includes story config, generation-time brief, generic record editor fields, and cast-member fields.
- Tone should be precise, opinionated, and writing-craft-aware: “Use this as local causal pressure, not as a mini-outline.”
- A standalone searchable Field Guide page is not required in v1, but the guidance registry must make one possible later.
- Help must reinforce Continuity Loom doctrine in context: records are canon; accepted prose is output, not prompt authority; manual directives cannot override hard canon, physical state, POV knowledge, reveal locks, or provider policy; validation focus tags are not plot beats; warnings do not enter the prompt.

---

## 4. Research summary and applied conclusions

1. **Do not hide vital instructions in tooltips.** Nielsen Norman Group’s tooltip guidance says tooltips should not contain information vital to task completion, and its info-tip guidance similarly warns against hiding essential information in info icons. Apply this by keeping requiredness, validation errors, blockers, and essential doctrine warnings visible, while using popovers for supplemental explanation. [R1], [R2]

2. **Use progressive disclosure.** GOV.UK’s details guidance recommends disclosure for information only some users need and warns against hiding information the majority needs. Apply this by using sparse labels, status badges, short visible hints where necessary, and on-demand deeper help. [R5]

3. **Prefer popovers/disclosures over hover-only tooltips.** WAI-ARIA’s tooltip pattern is hover/focus oriented and uses `role="tooltip"` with `aria-describedby`; WCAG requires hover/focus content to be dismissible, hoverable, and persistent. React Aria explicitly notes that tooltips are not shown on touch screens and recommends ensuring the UI works without tooltips or using Popover. Continuity Loom’s guidance is longer and more semantic than a micro-tooltip, so use a click/tap/focus popover or inline disclosure as the primary pattern. [R3], [R4], [R6]

4. **Use a proven popover primitive unless the project rejects new UI dependencies.** Radix Popover provides controlled/uncontrolled state, positioning/collision handling, optional arrows, customizable focus behavior, modal and non-modal modes, and dismissal/layering behavior. Floating UI is powerful but lower-level and pushes more interaction/ARIA responsibility into app code. Because the inspected web package has no existing overlay primitive or Radix dependency, v1 should add `@radix-ui/react-popover` unless maintainers deliberately prefer the dependency-free fallback. [R7], [R8]

5. **Writing-tool guidance must preserve author agency.** Recent HCI work on AI co-writing emphasizes preserving writers’ agency and ownership, with different desired AI intervention levels across planning, drafting, reviewing, and monitoring. The help system should teach authors how their own fields control prompt meaning; it must not suggest automatic record mutation, model-inferred canon, or AI-authored hidden help. [R10]

6. **Narrative theory supports causality and intentionality, not plot rails.** Riedl and Young frame causal progression and character intentionality as core to narrative understandability. Continuity Loom should apply that insight to field copy—especially plans, obligations, relationship pressure, and cast voice—without importing plot beats, act structure, branching, or autonomous planning. [R9]

7. **Character/relationship work benefits from explicit support.** Constella’s storywriter research focuses on interconnected character creation and preserving authorial agency. That supports strong field guidance for cast voice, relationship pressure, emotion, and sample utterance semantics, while keeping Continuity Loom’s deterministic, author-owned state model intact. [R11]

---

## 5. Repository findings

### 5.1 Active-doc authority

`docs/ACTIVE-DOCS.md` makes `docs/FOUNDATIONS.md` the constitutional authority and says new specs are appropriate for changes touching deterministic prompt compilation or compiler metadata, validation, record schema, generation-time brief schema, accepted-prose boundaries, broad UI workflows, or any feature that could introduce hidden prompt context, branches, plot rails, autonomous continuity changes, or prose-to-canon drift. This feature touches broad UI workflows, compiler metadata explanation, validation meaning, and generation-time brief semantics, so an implementation spec is warranted.

### 5.2 Constitutional doctrine

`docs/FOUNDATIONS.md` defines Continuity Loom as a continuity-first story-state operating system. The relevant invariants for field guidance are:

- records and user-authored generation-time fields are the continuity authority;
- accepted prose is readable output, not future prompt authority;
- deterministic compilation must not use an LLM to select, summarize, repair, rank, rewrite, or compress records;
- validation must fail closed;
- the active working set is explicit and user-controlled;
- manual directives cannot override hard canon, physical continuity, POV knowledge, reveal locks, or provider policy;
- the app must not introduce branches, plot rails, beat packages, act machinery, or autonomous plot planning.

The guidance system must teach these boundaries field-by-field instead of relying on users to read doctrine docs.

### 5.3 Compiler contract and prompt destinations

`docs/compiler-contract.md` is the authoritative bridge between schema fields, prompt placeholders, requiredness, missing behavior, empty states, validation focus rows, and warning/blocker taxonomy. It defines a long placeholder map including, among others:

- story config placeholders: `{title}`, `{premise}`, `{tone}`, `{content_intensity}`, `{language_register}`;
- prose mode placeholders: `{pov_character}`, `{person}`, `{tense}`, `{psychic_distance}`, `{interiority_mode}`, `{dialogue_density}`, `{paragraphing}`;
- current state placeholders: `{current_time}`, `{current_location}`, `{onstage_entities}`, `{positions}`, `{possessions}`, `{visible_conditions}`, `{routes_and_exits}`, `{available_time}`, `{consent_or_force_conditions}`;
- handoff/directive placeholders: `{recent_causal_context}`, `{last_visible_moment}`, `{prior_accepted_prose_status_or_handoff_note}`, `{begin_after}`, `{manual_must_render}`, `{manual_may_render_if_naturally_caused}`, `{manual_do_not_force}`;
- knowledge/reveal placeholders: `{pov_knows}`, `{pov_does_not_know}`, `{audience_knows}`, `{writer_visible_hidden_truths}`, `{allowed_clues_and_surface_cues}`, `{forbidden_reveals}`, `{reveal_permissions}`;
- pressure/cast/material placeholders: `{active_action_pressure}`, `{relationship_emotion_pressure}`, `{voice_pressure}`, `{active_cast_voice_pressure_pins}`, `{active_onstage_full_cast_dossiers}`, `{present_minor_cast_notes}`, `{locations}`, `{objects}`, `{visible_affordances}`, `{physical_continuity}`;
- validation-only `validation_focus_tags`.

Field guidance should use these exact prompt destination names when that makes field meaning clearer.

### 5.4 Schema and descriptor layer

`docs/story-record-schema.md` explicitly distinguishes structured fields from author-written prose fields: structured fields carry operational meaning for validation, filtering, sorting, and deterministic compilation, while prose fields carry nuance for continuity interpretation, character voice, prose quality, POV handling, and authorial control.

`packages/core/src/records/editor-descriptors.ts` currently derives `FieldDescriptor` data from Zod schemas. A descriptor has `name`, `kind`, `required`, `promptFacing`, optional `enumValues`, optional `referenceRole`, optional `itemDescriptor`, and optional nested `fields`. It heuristically marks some fields as validation/status/operational fields and infers prose-vs-short-string kind from name hints. It does **not** provide semantic help, prompt destination explanations, validation role explanations, enum value guidance, examples, anti-examples, or doctrine warnings.

The record registry combines entity, cast member, knowledge, material, causal-pressure, relationship, and emotion definitions into record types. Story configuration schemas live in `global-config.ts`; generation-time brief schemas live in `generation-brief.ts`.

### 5.5 UI surfaces

`RecordEditor.tsx` renders fields generically from descriptors. `FieldShell` currently renders label, required marker, child control, and client/server errors. It has no help trigger or guidance lookup. List and nested group fields are recursively rendered and therefore need field-path normalization for repeated items.

`CastMemberEditor.tsx` wraps cast fields in sections and includes valuable section-level doctrine copy: persistent identity/voice anchor material belongs in the cast dossier, while current voice pressure and temporary overrides belong in the generation-time brief; long active/onstage cast dossiers should not be auto-compressed; sample utterances should be sparse and annotated by copy policy. It still lacks per-field help.

`StoryConfigEditor.tsx` defines local descriptors for `STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, and `PROSE MODE`, then reuses `RecordEditor`. Those local descriptors must be covered by the same guidance system even though they are not generated from `recordTypeRegistry`. Because they live in the web package while the §16.1 coverage test runs in `@loom/core`, core needs its own field-path source for story config (derived from the exported `storyContractSchema`/`universalContentPolicySchema`/`proseModeSchema`); see §8.2.

`GenerationBriefView.tsx` is a hand-built surface, not currently driven by generic descriptors. The spec must therefore require either a descriptor-like metadata model for generation brief fields or explicit field-path registration against the hand-built components.

### 5.6 Dependencies

`packages/web/package.json` contains React 19, React Hook Form, React Router, TanStack Table, Vite, Zod, and Testing Library dependencies. It does not include Radix, Floating UI, or another overlay primitive. The project should add `@radix-ui/react-popover` for the guidance popover unless maintainers choose the native disclosure fallback.

---

## 6. Product principles

1. **Field help is product behavior.** It is not decoration and not copy sprinkled through React components.
2. **The guidance catalog is authoritative.** Help text must be version-controlled, deterministic, reviewed, and tested like schema behavior.
3. **The UI should stay calm.** Most fields get a compact info trigger, not permanent explanatory paragraphs.
4. **Critical information stays visible.** Validation errors, required state, blockers, and essential safety/doctrine warnings must not be available only through hidden help.
5. **Prompt-facing status is explicit.** Users should know whether a field is sent to the prose model, never sent, or conditionally rendered.
6. **Validation-only means validation-only.** Fields such as validation focus tags must say they activate checks and do not instruct the prose model.
7. **Continuity doctrine is taught in context.** The help for `prior_accepted_prose_status_or_handoff_note` should explain accepted prose exclusion right there, not merely in a manual.
8. **No hidden prompt context.** Help text must never itself enter generated prompts and must not create a side channel for instructions.
9. **No LLM-generated help in v1.** Help copy is authored by the product, not generated at runtime.
10. **No plot rails.** Help may explain causal pressure and character intentionality, but must not introduce beats, acts, branches, route planning, or drama-manager concepts.

---

## 7. Scope

### 7.1 In scope

The first implementation must cover all fields on these authoring surfaces:

1. **Story configuration**
   - `STORY CONTRACT`
   - `UNIVERSAL CONTENT POLICY`
   - `PROSE MODE`

2. **Generation-time brief**
   - active working set fields shown in the brief UI;
   - current authoritative state;
   - immediate handoff;
   - manual moment directive;
   - current cast voice pressure;
   - cast voice overrides;
   - generation validation focus tags;
   - stop guidance.

3. **Story record creation/editing**
   - every generic record type in `recordTypeRegistry`;
   - nested groups;
   - list fields and list-item fields;
   - the cast-member section editor.

4. **UI rendering and accessibility**
   - reusable field help trigger/component;
   - visible critical hints where needed;
   - prompt-facing/validation-only status treatment;
   - enum guidance display;
   - keyboard/touch/screen-reader behavior and tests.

### 7.2 Out of scope / non-goals

The implementation must not include:

- runtime LLM-generated help copy;
- automatic record updates from generated or accepted prose;
- hidden help text injected into prompts;
- help copy stored in project data;
- user-customizable help copy in v1;
- hover-only tooltips as the only access path;
- browser `title` attributes as the guidance system;
- validation errors hidden inside help popovers;
- using help text to compensate for labels that should simply be renamed;
- a large standalone Field Guide page as a required v1 deliverable;
- expanding `GenerationBriefView` to render the full `generationSessionSchema` field set — v1 authors catalog coverage for every brief field (§8.3) but only attaches UI help triggers to the fields the brief already renders; growing the brief UI to render (and then help) the remaining fields is a follow-on;
- branches, plot beats, act structure, drama-manager guidance, or autonomous planning machinery.

---

## 8. Proposed architecture

### 8.1 Architectural stance

Build a core **Field Guidance System**, not a local tooltip component. The hard part is the catalog: stable field paths, prompt destinations, validation roles, continuity roles, enum implications, examples, anti-examples, and doctrine warnings. The popover is only the renderer.

### 8.2 Conceptual modules

Use names consistent with repo conventions, but the implementation should introduce equivalents of:

```text
packages/core/src/records/field-guidance.ts
packages/core/src/records/field-guidance.test.ts
packages/web/src/field-help/FieldHelp.tsx
packages/web/src/field-help/FieldHelp.test.tsx
```

Supporting files (`field-paths.ts` and `field-help-ids.ts` are optional; the two coverage-source modules are **required wherever a `@loom/core` coverage test enumerates that surface**, see §16.1):

```text
packages/core/src/records/field-paths.ts                 # optional path helpers
packages/core/src/records/story-config-descriptors.ts    # required: core-accessible story-config field source
packages/core/src/records/generation-brief-descriptors.ts # required: core-accessible generation-brief field source
packages/web/src/field-help/field-help-ids.ts            # optional
```

Why required, not optional: §16.1 places the story-config and generation-brief coverage tests in `@loom/core`, but the story-config descriptors live in web today (`storyConfigEditorDescriptors` in `packages/web/src/config/StoryConfigEditor.tsx`) and the generation brief is hand-built with no descriptor at all. A core test cannot enumerate either surface unless core owns a field-path source for it. Both surfaces' Zod schemas are already exported from `@loom/core` (`storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema`, `generationSessionSchema`), so the simplest implementation derives canonical paths from those schemas with the existing `describeObjectFields` machinery rather than re-listing fields by hand. If instead the web-local `storyConfigEditorDescriptors` is reused, it must also be guarded against schema drift (it is hand-maintained today with no test asserting it matches `storyContractSchema`/`universalContentPolicySchema`/`proseModeSchema`).

The exact names may vary, but the boundaries should not:

- `@loom/core` owns guidance content, canonical field paths, prompt destination references, and coverage tests.
- `@loom/web` owns accessible presentation, trigger/popover/disclosure behavior, styling, and UI tests.
- Project data stores none of the guidance copy.
- Generated prompts include none of the guidance copy.

### 8.3 Integration with existing descriptors

The existing `FieldDescriptor` shape should not be overloaded with long help copy. It may gain a small stable guidance reference, or the web layer may look up guidance by canonical field path.

Acceptable patterns:

1. **Preferred:** add a deterministic `fieldPath` or `guidancePath` to descriptors during descriptor generation.
2. **Acceptable:** compute canonical field paths in the renderer from `ownerKind`, `surface`, and nested/list path context.
3. **Do not:** duplicate long help strings in React component definitions or Zod schemas.

`RecordEditor` should render a guided `FieldShell` for generic record, story config, nested group, and list-item fields. `CastMemberEditor` should reuse the same field renderer so per-field help appears inside cast sections. `GenerationBriefView` should either be refactored toward descriptor-backed groups or explicitly call `FieldHelp` with canonical field paths for each hand-built field.

**Catalog coverage vs. rendered-field coverage (generation brief).** `GenerationBriefView` is currently a skeletal editor: it renders only a representative subset of `generationSessionSchema` (e.g. CURRENT AUTHORITATIVE STATE exposes only `current_time`; IMMEDIATE HANDOFF omits `begin_after` and `last_visible_moment`; MANUAL MOMENT DIRECTIVE omits `may_render_if_naturally_caused` and `do_not_force`). Several paths the catalog must carry (§10.2: `begin_after`, `may_render_if_naturally_caused[]`, `do_not_force[]`, `positions`, `consent_or_force_conditions`) therefore have no rendered control to attach a help trigger to. v1 resolves this split as follows:

- **Guidance catalog coverage is keyed to the full `generationSessionSchema`** (the §16.1 core test enumerates every schema leaf path), so every high-risk handoff/directive/state field has an authored entry regardless of whether the brief UI renders it yet.
- **UI help triggers in v1 are attached only to the generation-brief fields the current `GenerationBriefView` actually renders.** Expanding `GenerationBriefView` to render the full schema field set is explicitly deferred (see §7.2); the authored catalog entries are ready for those fields the moment the brief UI grows to render them.

**Reconcile existing always-visible hints — do not duplicate.** Both `GenerationBriefView` and `CastMemberEditor` already render hand-written always-visible doctrine hints that overlap this system's `criticalVisibleHint`/doctrine copy: in `GenerationBriefView`, "Completeness checks, not plot beats.", the prose-paste warning on `prior_accepted_prose_status_or_handoff_note`, the non-local stop-guidance warning, and "current_generation_only; never written back to CAST MEMBER records."; in `CastMemberEditor`, the durable-dossier-boundary notice, the long-dossier ("should stay durable and full") warning, and the sample-utterance note. The implementation must subsume these into the guidance system (as `criticalVisibleHint` entries or section copy) rather than leave a duplicate hand-written hint beside the new one.

### 8.4 Dependency recommendation

Add `@radix-ui/react-popover` to `packages/web` dependencies and use it for the primary field guidance popover.

Rationale:

- The feature needs click/tap/keyboard guidance, not hover-only micro-tooltips.
- The inspected project has no existing overlay primitive.
- Radix Popover supplies collision-aware positioning, arrows, managed/customizable focus, modal/non-modal behavior, and dismissal/layering primitives.
- Floating UI is excellent but lower-level; using it directly would make this project responsible for more accessibility and interaction glue.

Fallback if maintainers reject a dependency: use native `<details>/<summary>` or a simple inline disclosure. Do **not** build a fragile custom hover tooltip.

---

## 9. Field guidance data model

The final implementation may adjust names, but the catalog must carry comparable semantics to this conceptual shape:

```ts
interface FieldGuidance {
  fieldPath: string;
  surface: "story_config" | "generation_brief" | "record";
  ownerKind: string;
  short: string;
  details?: string;
  promptFacing: "always" | "conditional" | "never";
  promptDestinations?: string[];
  validationRole?: string;
  continuityRole?: string;
  authoringAdvice?: string;
  criticalVisibleHint?: string;
  doctrineWarnings?: string[];
  commonMistakes?: string[];
  examples?: string[];
  antiExamples?: string[];
  relatedFields?: string[];
  enumValues?: Record<string, EnumValueGuidance>;
}

interface EnumValueGuidance {
  short: string;
  implications?: string;
  useWhen?: string;
  avoidWhen?: string;
}
```

### 9.1 Required semantics

Every guidance entry must answer, when applicable:

- **Meaning:** What does this field mean in the story-state model?
- **Prompt:** Is this sent to the prose model? If yes, where? If no, say so.
- **Validation:** Does it gate validation or activate checks?
- **Continuity:** Does it define canon, current state, knowledge, reveal permission, cast identity, or temporary generation pressure?
- **Advice:** What practical authoring move prevents misuse?
- **Examples:** For high-risk fields, what is a good entry and what is not?

### 9.2 Prompt-facing values

Use a tri-state value:

- `always`: consistently sent to the prose prompt when the owning surface is used.
- `conditional`: rendered only when selected, active, non-empty, or relevant to the active working set.
- `never`: not sent to the prose model. Validation-only, UI-only, status-only, metadata-only, or operational.

Guidance marked `promptFacing: "never"` must not include copy like “the model sees this,” “tell the prose writer,” or “this prompt says.”

### 9.3 Prompt destinations

`promptDestinations` must reference known prompt placeholders or known compile destination family IDs. Valid prompt placeholder names should be derived from `PLACEHOLDER_MAP` and `docs/compiler-contract.md`. Valid compile destination families should be derived from `compile-destinations.ts`.

Examples:

```text
promptDestinations: ["{prior_accepted_prose_status_or_handoff_note}"]
promptDestinations: ["{manual_must_render}", "{manual_may_render_if_naturally_caused}"]
promptDestinations: ["rich_active_cast_dossiers", "{active_onstage_full_cast_dossiers}"]
promptDestinations: [] // required for validation-only fields
```

### 9.4 Content rules

Guidance copy must be:

- deterministic and version-controlled;
- product-authored, not generated at runtime;
- concise but not bland;
- specific enough to prevent misuse;
- clear about prompt/validation/continuity implications;
- free of hidden instructions intended for the external prose model;
- free of prose-to-canon suggestions;
- free of plot beat, act, branch, or drama-manager terminology.

---

## 10. Canonical field-path convention

The implementation must define one canonical field-path format and use it everywhere: guidance registry, coverage tests, UI test IDs, related-field references, and future generated field guide surfaces.

### 10.1 Format

```text
<OWNER_KIND>.<field>[.<nested_field>][].<list_item_field>
```

Rules:

- `OWNER_KIND` is the exact record/config/group name where users see the field, e.g. `STORY CONTRACT`, `PROSE MODE`, `CAST MEMBER`, `SECRET`, `GENERATION BRIEF`.
- Nested fields use dot notation.
- List item fields use `[]`, never numeric indexes.
- Generation brief groups include the group name after `GENERATION BRIEF`.
- Field paths are stable product keys. They must not contain record IDs, array indexes, database row IDs, or generated DOM IDs.

### 10.2 Required examples

The catalog must include these exact or equivalently normalized paths:

```text
STORY CONTRACT.premise
STORY CONTRACT.prose_preferences.psychic_distance
UNIVERSAL CONTENT POLICY.allowed_content_scope
PROSE MODE.pov_character
GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note
GENERATION BRIEF.immediate_handoff.recent_causal_context
GENERATION BRIEF.immediate_handoff.begin_after
GENERATION BRIEF.manual_moment_directive.must_render[]
GENERATION BRIEF.manual_moment_directive.may_render_if_naturally_caused[]
GENERATION BRIEF.manual_moment_directive.do_not_force[]
GENERATION BRIEF.current_authoritative_state.current_time
GENERATION BRIEF.current_authoritative_state.current_location
GENERATION BRIEF.current_authoritative_state.positions
GENERATION BRIEF.current_authoritative_state.consent_or_force_conditions
GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure
GENERATION BRIEF.current_cast_voice_pressure[].local_function
GENERATION BRIEF.cast_voice_overrides[].override_text
GENERATION BRIEF.generation_validation_focus.validation_focus_tags.expected_local_modes[]
GENERATION BRIEF.stop_guidance.soft_unit_guidance
CAST MEMBER.voice_anchor.core_voice
CAST MEMBER.voice_anchor.rhythm_and_syntax
CAST MEMBER.voice_anchor.must_preserve[]
CAST MEMBER.voice_anchor.must_avoid[]
CAST MEMBER.sample_utterances[].copy_policy
SECRET.reveal_permission
SECRET.allowed_surface_cues[]
SECRET.forbidden_reveals[]
FACT.audience_visibility
RELATIONSHIP.pressure_text
EMOTION.behavioral_pressure[]
PLAN.current_step
CLOCK.current_pressure
OBLIGATION.consequence_if_broken
CONSEQUENCE.possible_next_effect
OPEN THREAD.possible_pressure_now
```

---

## 11. Coverage rules

The feature is not complete until tests prove coverage. Required coverage rules:

1. Every story-config descriptor field has a guidance entry.
2. Every generation-brief field has a guidance entry. Coverage is keyed to the full `generationSessionSchema` field set (not only the subset the current `GenerationBriefView` renders), so deferred-but-mandated paths such as `begin_after`, `may_render_if_naturally_caused[]`, and `do_not_force[]` are covered in the catalog now (see §8.3).
3. Every record editor descriptor field has a guidance entry, including nested fields and list-item fields.
4. Every cast-member section field has a guidance entry. Enumerate these from the existing `castMemberSectionModel()` (`packages/core/src/records/cast-member-sections.ts`): each section's `fields` plus its `emphasisFieldPaths`. The emphasis-only paths — `voice_anchor.anti_repetition_warnings` and `voice_extended.anti_generic_warnings` — must each have guidance even though they surface only in the emphasis section.
5. Every high-implication enum value has guidance.
6. Guidance `promptDestinations`, when present, reference known prompt placeholders or known compile destination family IDs.
7. Guidance marked `promptFacing: "never"` does not include prompt-sent language.
8. No guidance text suggests accepted prose should be pasted, mined, summarized automatically, or treated as canon.
9. No guidance text suggests the external prose model will fix records, infer canon, update state, reconcile contradictions, or make continuity decisions.
10. No guidance text introduces branches, plot beats, act structure, drama managers, route planners, or autonomous plot machinery.
11. Every field with `criticalVisibleHint` has a UI test proving the hint is visible without opening the popover/disclosure.
12. Every repeated list field uses `[]` canonical path coverage rather than requiring per-index guidance.

---

## 12. UI behavior requirements

### 12.1 Default field presentation

For most fields, render a compact label row:

```text
<label>field_name [required marker] [prompt/status badge if useful] [info button]</label>
```

Do not add a full visible help paragraph under every field. The editor already has many high-density story-state fields; flooding the screen with copy will make the form worse.

Always-visible content is required for:

- required markers;
- validation errors;
- blockers and warnings;
- critical safety/doctrine warnings;
- short hints that most users need to answer the field correctly;
- selected enum value explanation when the enum is high-impact and non-obvious.

### 12.2 Field help trigger

The help trigger must be a real button or equivalent keyboard-operable control. It should be visually compact and adjacent to the field label.

Required behavior:

- opens by click/tap;
- opens by keyboard activation;
- dismisses with Escape;
- dismisses with outside click;
- second trigger click may close;
- optional hover/focus opening is allowed only as an enhancement, never the only access path;
- works in nested groups and repeated list items;
- uses deterministic DOM IDs derived from canonical field paths plus stable list context, without storing those IDs in project data.

### 12.3 Popover content structure

For ordinary fields, use this structure:

```text
Short explanation.
Prompt: Sent to <placeholder/section> / Not sent to prose model / Conditional.
Validation: <short role, if any>.
Continuity: <short doctrine/implication, if any>.
Advice: <one concrete authoring sentence, if useful>.
```

For complex fields, include collapsible or clearly separated subsections:

```text
Examples
Avoid
Related fields
```

Keep popovers useful, not encyclopedic. If a field requires more than a compact popover can sanely hold, the v1 renderer should show a short popover plus an inline “More about this field” disclosure or reserve the longer entry for a future generated Field Guide page.

### 12.4 Prompt/status badges

Render a small status badge only when it materially reduces confusion:

- `Prompt` for always/conditionally prompt-facing fields;
- `Validation only` for fields not sent to the prose model;
- `Current generation only` for cast voice overrides and current voice pressure;
- `Canon` or `Current state` only where it truly describes authority;
- avoid badge clutter on obvious fields.

### 12.5 Enum guidance UI

For high-implication enums:

- show selected value explanation near the control or in the popover;
- describe non-obvious values only;
- consider radio/card controls for small high-impact enums where reading all options matters;
- keep plain selects for obvious or long enums.

Candidate card/radio enums:

- `content_intensity`
- `psychic_distance`
- `interiority` / `interiority_mode`
- `dialogue_density`
- `SECRET.reveal_permission`
- `CAST MEMBER.sample_utterances[].copy_policy`
- `GENERATION BRIEF.active_working_set.active_onstage_cast_full[].local_function`
- `GENERATION BRIEF.current_cast_voice_pressure[].local_function`

Do not convert every enum to cards. That would bloat the editor and slow expert use.

---

## 13. Accessibility requirements

Accessibility is an acceptance criterion, not a polish pass.

The implementation must ensure:

- info triggers are real `<button>` elements or equivalent keyboard-operable controls;
- help can be opened without mouse hover;
- help can be used on touch devices;
- Escape dismisses open help;
- outside click dismisses open help;
- focus behavior is predictable;
- non-modal popovers do not trap focus unless intentionally configured for interactive content;
- the trigger communicates expanded state via `aria-expanded` and associates with content via `aria-controls` and/or `aria-describedby`, depending on final pattern;
- if `role="tooltip"` is used for any microcontent, it follows the WAI-ARIA tooltip pattern and is not used for long or interactive content;
- popover/disclosure content has appropriate role/labeling for screen readers;
- requiredness, errors, blockers, warnings, and critical instructions are not available only in hidden help;
- contrast meets WCAG expectations;
- help remains visible long enough to read;
- help does not obscure the input the user is editing when avoidable;
- repeated list item help remains associated with the correct field instance;
- tests cover keyboard opening, Escape dismissal, touch/click opening, and screen-reader associations.

---

## 14. Required high-risk guidance examples

The catalog should begin with high-risk fields. The examples below are product copy requirements in spirit; final copy may be tightened, but it must preserve the semantics.

### 14.1 `GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note`

- **Short:** A user-authored continuity handoff note, not a place to paste previous prose.
- **Prompt:** Sent to `{prior_accepted_prose_status_or_handoff_note}`.
- **Continuity:** Accepted prose is readable output, not prompt authority. Durable changes must be represented in records, current state, or handoff before generation.
- **Advice:** Use `None. No accepted prose is included.` for a first segment or when no handoff is needed.
- **Example:** `None. No accepted prose is included.`
- **Example:** `User-authored handoff: Mara has already locked the pantry door and is hiding the brass key in her left glove.`
- **Avoid:** `Paste the last paragraph here.`
- **Avoid:** `Summarize the accepted prose automatically.`

### 14.2 `GENERATION BRIEF.immediate_handoff.recent_causal_context`

- **Short:** The immediate causal pressure leading into the next local prose unit.
- **Prompt:** Sent to `{recent_causal_context}`.
- **Continuity:** Writer-visible context does not automatically become POV knowledge.
- **Advice:** State what currently makes the moment unstable. Do not recap the whole story.
- **Example:** `The flour bin has just shifted because someone pushed the cellar door from the other side.`
- **Avoid:** `Chapter recap: everything that happened in the last scene.`

### 14.3 `GENERATION BRIEF.immediate_handoff.begin_after`

- **Short:** The exact launch boundary for the next prose.
- **Prompt:** Sent to `{begin_after}`.
- **Validation:** Blocks when blank or contradictory with current state/handoff.
- **Advice:** Use a local start instruction, not a future outline.
- **Example:** `Begin after Mara hears the latch click, before she turns around.`
- **Avoid:** `Begin after the next three chapters of pursuit.`

### 14.4 `GENERATION BRIEF.manual_moment_directive.must_render[]`

- **Short:** One or more authorial pressures that must appear if they are possible under canon.
- **Prompt:** Sent to `{manual_must_render}`.
- **Continuity:** This is pressure, not override permission. It cannot break hard canon, physical state, POV knowledge, reveal locks, or provider policy.
- **Advice:** Make it local and renderable.
- **Example:** `Mara must decide whether to lie about the missing key before Tomas reaches the pantry.`
- **Avoid:** `Reveal the killer even though the POV cannot know it.`
- **Avoid:** `Write the whole escape sequence and its aftermath.`

### 14.5 `GENERATION BRIEF.manual_moment_directive.may_render_if_naturally_caused[]`

- **Short:** Optional invention corridor for local consequences that may occur if the compiled state naturally causes them.
- **Prompt:** Sent to `{manual_may_render_if_naturally_caused}`.
- **Advice:** Use it to permit texture, escalation, or interruption without forcing it.
- **Example:** `If the cellar door pressure keeps building, the hinges may groan loudly enough for Mara to notice.`
- **Avoid:** `Introduce a new villain with no selected record or causal route.`

### 14.6 `GENERATION BRIEF.manual_moment_directive.do_not_force[]`

- **Short:** Guardrails against melodrama, premature reveals, or over-completion.
- **Prompt:** Sent to `{manual_do_not_force}`.
- **Advice:** Use this to protect restraint, ambiguity, silence, or unresolved pressure.
- **Example:** `Do not force Mara to confess; keep the pressure in evasive behavior unless the state makes confession unavoidable.`
- **Avoid:** `Do not let anything happen.`

### 14.7 `GENERATION BRIEF.current_authoritative_state.*`

- **Short:** What is true now before the next prose begins.
- **Prompt:** Sent across current-state placeholders such as `{current_time}`, `{current_location}`, `{positions}`, `{possessions}`, `{line_of_sight_and_visibility}`, `{routes_and_exits}`, `{available_time}`, and `{consent_or_force_conditions}`.
- **Validation:** Physical, knowledge, object transfer, location change, violence/injury, intimacy, and interruption checks depend on this state.
- **Continuity:** Current authoritative state outranks handoff and manual directive.
- **Advice:** Put present truth here. Put launch motion in immediate handoff. Put durable canon in records.

### 14.8 `GENERATION BRIEF.current_cast_voice_pressure[].current_voice_pressure`

- **Short:** Current-generation pressure on how this cast member should speak, think, move, or stay silent right now.
- **Prompt:** Sent to `{voice_pressure}` and `{active_cast_voice_pressure_pins}` when applicable.
- **Continuity:** Temporary generation pressure, not a durable cast identity update.
- **Advice:** Use this to pin the present function of the voice under pressure, not to rewrite the character dossier.
- **Example:** `Tonight her politeness is brittle: every sentence tries to end the conversation without admitting fear.`
- **Avoid:** `Change her permanent voice to sarcastic from now on.`

### 14.9 `GENERATION BRIEF.cast_voice_overrides[].override_text`

- **Short:** A scoped, current-generation-only exception to normal cast voice behavior.
- **Prompt:** Rendered as a current generation voice override for selected cast.
- **Continuity:** Does not mutate the cast member record.
- **Advice:** Give a reason and a narrow scope.
- **Example:** `For this generation only, keep Tomas unusually formal because the magistrate is listening.`
- **Avoid:** `Make Tomas talk like a different character forever.`

### 14.10 `GENERATION BRIEF.generation_validation_focus.validation_focus_tags.*`

- **Short:** Activates deterministic validation rows for the kind of local moment being attempted.
- **Prompt:** Not sent to the prose model.
- **Validation:** Controls which completeness and contradiction checks run.
- **Continuity:** Tags are checks, not plot beats.
- **Advice:** Select what could materially happen in this local unit. Do not use tags to force events.
- **Example:** `dialogue_expected` when active speakers may exchange lines.
- **Avoid:** Treating `clock_tick_possible` as an instruction that a clock must tick.

### 14.11 `GENERATION BRIEF.stop_guidance.soft_unit_guidance`

- **Short:** The local stopping boundary for the next prose unit.
- **Prompt:** Sent to `{soft_unit_guidance}`.
- **Validation:** Blocks if blank, non-local, contradictory with directive, or asking for chapters/outlines/multiple response points.
- **Advice:** Stop at the next decision point, response point, or durable-change boundary.
- **Example:** `Stop when Mara must answer Tomas or choose silence.`
- **Avoid:** `Continue through the aftermath and summarize consequences.`

### 14.12 `SECRET.reveal_permission`

- **Short:** Controls whether hidden truth may surface, only leave clues, or remain locked.
- **Prompt:** Sent through `{reveal_permissions}` when the secret is selected and active.
- **Validation:** Blocks contradictions between POV access, holders, protected non-holders, clues, forbidden reveals, and reveal permission.
- **Continuity:** `locked` cannot be overridden by manual directive.
- **Enum guidance:**
  - `locked`: no reveal; protect the secret from narrator/POV leakage.
  - `clue_only`: surface cues may appear, but the hidden truth remains unrevealed.
  - `natural_reveal_allowed`: the truth may emerge if current state and POV access naturally support it.
  - `directive_required`: do not reveal unless the manual directive explicitly asks and canon permits it.

### 14.13 `SECRET.allowed_surface_cues[]`

- **Short:** Clues or observable traces that may appear without revealing the secret.
- **Prompt:** Sent to `{allowed_clues_and_surface_cues}`.
- **Advice:** Write cues the POV can perceive, not the hidden explanation.
- **Example:** `Tomas avoids touching the iron latch and watches Mara’s glove instead.`
- **Avoid:** `Tomas is the saboteur.`

### 14.14 `SECRET.forbidden_reveals[]`

- **Short:** Specific truth, wording, or inference the prose must not reveal yet.
- **Prompt:** Sent to `{forbidden_reveals}`.
- **Continuity:** Prevents narrator leakage and POV over-knowledge.
- **Example:** `Do not state that the magistrate planted the key.`
- **Avoid:** Empty field on an active critical secret.

### 14.15 `FACT.audience_visibility`

- **Short:** Whether the audience can know this fact, independent from the POV.
- **Prompt:** Can influence `{audience_knows}`, `{audience_does_not_know}`, `{pov_accessible_facts}`, or `{writer_visible_or_non_pov_facts}` depending on selection and visibility.
- **Continuity:** Audience visibility is not POV knowledge.
- **Advice:** Use this to manage dramatic irony without letting the narrator leak hidden truth through close POV.

### 14.16 `CAST MEMBER.sample_utterances[].copy_policy`

- **Short:** How the compiler/model may use this sample’s cadence.
- **Prompt:** Sample utterances may render inside `{active_onstage_full_cast_dossiers}` when selected/available.
- **Continuity:** Samples teach function, cadence, and pressure—not lines to copy by default.
- **Enum guidance:**
  - `never_copy_verbatim`: default; use the sample as a voice calibration, never as dialogue text.
  - `may_reuse_cadence_not_text`: cadence and syntax may echo, but wording should change.
  - `canonical_phrase`: a rare phrase that may be reused because repetition is intentional canon.

### 14.17 `CAST MEMBER.voice_anchor.*`

- **Short:** Durable voice identity and anti-generic pressure.
- **Prompt:** Sent in full active/onstage cast dossiers when selected as active/onstage full.
- **Continuity:** Voice is continuity. It should not be silently compressed for active/onstage cast.
- **Advice:** Write behaviorally useful voice constraints: rhythm, diction, avoidance, turn-taking, pressure response.
- **Avoid:** Generic adjectives such as `witty`, `smart`, `sad` without speech behavior.

### 14.18 `RELATIONSHIP.pressure_text`

- **Short:** The local causal pressure this relationship creates when selected.
- **Prompt:** Sent through `{relationship_emotion_pressure}` when relevant.
- **Continuity:** Axes and values are operational; this field carries nuance.
- **Advice:** Write what the relationship makes each person do, avoid, risk, conceal, or misread now.
- **Example:** `Mara trusts Tomas with logistics but not motives, so she lets him hold the map while withholding the destination.`
- **Avoid:** `They have tension.`

### 14.19 `EMOTION.behavioral_pressure[]`

This is a **closed enum array**, not a free-prose field: the schema is `z.array(z.enum([...]))` over a fixed vocabulary (`approach`, `flee`, `freeze`, `attack`, `reject`, `dominate`, `submit`, `seek_contact`, `protect_other`, `seek_help`, `confess`, `conceal`, `withdraw_socially`, `plan`, `accommodate`, `self_soothe`, `ruminate`, `collapse`), and the descriptor renders it as a list of enum selections. Author its guidance as selection guidance over those values, not as prose-entry guidance.

- **Short:** Selected action tendencies created by the emotion (chosen from the fixed list above).
- **Prompt:** Supports `{relationship_emotion_pressure}` when selected.
- **Continuity:** Emotion matters when it changes behavior, perception, speech, or restraint.
- **Advice:** Pick the tendencies that can actually be rendered in this local unit; do not treat the emotion as a mood label with no selected behavior.

### 14.20 Plan, clock, obligation, consequence, and open-thread pressure fields

Required guidance must explain:

- `PLAN.current_step`: current tactic, not a full outline.
- `PLAN.can_drive_prose`: whether this plan may push the next local unit; validation may block if the holder cannot plausibly act.
- `CLOCK.current_pressure`: what pressure is active now, not an abstract timer.
- `CLOCK.tick_trigger`: what event would make the clock advance.
- `OBLIGATION.consequence_if_broken`: durable pressure if the obligation breaks.
- `CONSEQUENCE.current_effect`: what is already true.
- `CONSEQUENCE.possible_next_effect`: what may become true if the next local unit triggers it.
- `OPEN THREAD.possible_pressure_now`: current pressure, not a command to resolve the thread.

---

## 15. Enum guidance requirements

The implementation must identify high-implication enum values and provide value-level explanations where labels are not self-explanatory.

### 15.1 Story/prose config enums

- `content_intensity`: explain story envelope vs provider-policy override.
- `psychic_distance`: explain how close the narration may sit to POV thought/perception.
- `interiority` / `interiority_mode`: explain allowed access to thought and filtering.
- `dialogue_density`: explain prose balance, not a guaranteed dialogue quota.
- `person`, `pov_character`, and `omniscient`/`variable`: explain POV knowledge consequences.

### 15.2 Generation brief enums

- active/onstage cast `local_function`: explain active speaker, active silent, POV narrator, close non-POV, physically active, materially referenced, and present-minor speaker.
- validation focus tags: explain each tag as a validation activator, not a plot instruction.
- cast voice override `applies_to`: explain scope of temporary override.

### 15.3 Record enums

- `SECRET.reveal_permission`: must have value-level guidance.
- `SECRET.pov_access` and `SECRET.audience_visibility`: must distinguish POV, audience, and writer-visible truth.
- `FACT.audience_visibility`: must distinguish audience visibility from POV access.
- `CAST MEMBER.sample_utterances[].copy_policy`: must have value-level guidance.
- `PLAN.visibility_to_pov`, `PLAN.can_drive_prose`, `CLOCK.visibility`, `OBJECT.visibility_to_pov`, and material `durability` enums should be guided when visible in the editor.
- `EMOTION.behavioral_pressure[]` is an enum array (see §14.19); the non-obvious values (`accommodate`, `self_soothe`, `ruminate`, `withdraw_socially`) should get value-level guidance, while self-evident ones (`flee`, `attack`) need none.
- Status/salience/urgency enums need guidance only when they affect filtering, validation, prompt salience, or compile behavior.

---

## 16. Testing requirements

### 16.1 Core tests

Add core tests that:

1. collect all story-config descriptor field paths and assert guidance exists;
2. collect all generation-brief field paths — derived from `generationSessionSchema` (its full leaf set, including nested groups and list-item fields), not from the partial set the brief UI currently renders — and assert guidance exists;
3. collect all `recordEditorDescriptors` field paths, including nested/list fields, and assert guidance exists;
4. assert every guidance `promptDestination` references a known placeholder or compile destination family;
5. assert `promptFacing: "never"` entries do not contain prompt-sent wording;
6. assert forbidden doctrine phrases do not appear in guidance;
7. assert no coverage test relies on numeric list indexes;
8. assert enum guidance exists for high-implication enum values.

### 16.2 Web tests

Use React Testing Library or existing project conventions to test:

- `FieldHelp` renders a button trigger;
- click opens help;
- keyboard activation opens help;
- Escape dismisses help;
- outside click or second trigger click dismisses help;
- touch/click path does not rely on hover;
- trigger exposes accessible name such as `Help for <field label>`;
- trigger exposes expanded state;
- popover content is associated with the trigger and/or field;
- critical visible hints render without opening help;
- validation errors remain visible and are not hidden in popovers;
- list item help for two repeated items associates with the correct trigger/content;
- selected enum value guidance renders for high-impact enums;
- `GenerationBriefView` includes help triggers for the generation-brief fields it currently renders (v1 attaches UI help to rendered fields only; full-schema brief rendering is deferred per §7.2).

### 16.3 Regression tests for doctrine

Add text-level tests over all guidance copy that reject strings or patterns implying:

- accepted prose can be pasted as prompt context;
- candidate prose can be mined as canon;
- the LLM can infer or update canon;
- warnings enter the generated prompt;
- validation tags are plot beats;
- manual directive can override canon, POV knowledge, reveal locks, physical state, or provider policy;
- active/onstage cast dossiers may be silently compressed;
- user-custom help changes product doctrine in v1.

---

## 17. Migration and backwards compatibility

No project-data migration should be required.

The guidance catalog is product metadata shipped with the app. It must not be serialized into project folders, SQLite records, accepted segment metadata, prompts, candidates, or OpenRouter requests.

Adding `fieldPath` or `guidancePath` to descriptors is safe as runtime/editor metadata if it does not change stored record payload schemas. The existing `packages/core/test/editor-descriptors.test.ts` is **not** a snapshot test — it asserts the set of top-level field names per record type (`fields.map(f => f.name).sort()` against the schema's object keys) and that each field carries `kind`/`required`/`promptFacing` of the right type; it does not assert the absence of extra descriptor properties. Adding an optional `fieldPath`/`guidancePath` is therefore provably non-breaking against the current tests. If a future test snapshots full descriptor objects, update it to include or intentionally omit the field based on expected public API behavior.

Adding `@radix-ui/react-popover` changes web package dependencies and lockfile only. It does not affect core schema compatibility.

---

## 18. Acceptance criteria

This spec is satisfied when:

1. A deterministic, version-controlled guidance catalog exists in core or an equivalent shared layer.
2. Guidance coverage is complete for story config, generation brief, generic record editor fields, nested fields, list-item fields, and cast-member section fields.
3. High-risk fields have examples and anti-examples.
4. High-implication enums have value-level guidance where labels are insufficient.
5. Prompt-facing status is explicit and accurate.
6. Validation-only fields clearly say they are not sent to the prose model.
7. `RecordEditor`, `CastMemberEditor`, `StoryConfigEditor`, and `GenerationBriefView` render accessible field help.
8. Critical instructions are visible without opening help.
9. The primary help interaction works by click, tap, and keyboard, and is dismissible with Escape.
10. Tests cover guidance data integrity, prompt destination validity, doctrine safety, UI behavior, accessibility associations, and repeated list items.
11. No help copy enters generated prompts.
12. No project data stores help copy.
13. No implementation introduces branches, plot beats, act structure, autonomous record mutation, or hidden prompt context.

---

## 19. Implementation sequencing guidance

This is sequencing guidance, not tickets.

1. **Canonical paths and catalog skeleton**  
   Define canonical field-path helpers, prompt destination constants, and an empty/minimal guidance catalog shape. Add tests for path normalization, especially nested groups and `[]` list items.

2. **Descriptor coverage extraction**  
   Add utilities/tests that enumerate field paths from story-config descriptors, generation-brief schemas or descriptors, and `recordEditorDescriptors`. Fail tests for missing guidance.

3. **High-risk guidance first**  
   Populate guidance for handoff, directive, current state, stop guidance, validation focus tags, secrets/reveals, cast voice, sample utterances, and relationship/emotion pressure.

4. **Complete coverage**  
   Fill remaining story config, record, nested, and list fields. Prefer concise copy and shared helper text where fields repeat across record types.

5. **Web renderer**  
   Add `FieldHelp` and integrate it with `RecordEditor`/`FieldShell`. Then ensure `CastMemberEditor` and `StoryConfigEditor` inherit the behavior.

6. **Generation brief integration**  
   Add explicit help triggers or descriptor-backed groups to `GenerationBriefView` for the fields it renders; do not leave the dangerous *rendered* generation-time fields unguided. Catalog entries for not-yet-rendered brief fields are still authored (§8.3), but their UI triggers wait on the deferred brief-UI expansion (§7.2).

7. **Enum guidance and selected-value display**  
   Add value-level help for high-impact enums and upgrade select/radio/card presentation only where it materially improves comprehension.

8. **Accessibility hardening**  
   Add keyboard/touch/Escape/focus/ARIA tests. Verify popover placement does not obscure the active input in common layouts.

9. **Doctrine regression hardening**  
   Add forbidden-phrase tests and prompt-exclusion tests so guidance cannot drift into prose-as-canon or hidden prompt behavior.

---

## 20. Open questions

No blocking product questions remain for v1.

Non-blocking implementation choice:

- Whether to add `fieldPath` directly to `FieldDescriptor` or compute it in the renderer. Strong preference: add or compute a canonical path in a shared utility and test it thoroughly. Do not let each React surface invent paths locally.

---

## 21. Research references

- [R1] Nielsen Norman Group, “Tooltip Guidelines”  
  `https://www.nngroup.com/articles/tooltip-guidelines/`
- [R2] Nielsen Norman Group, “Why So Many Info Tips Are Bad (and How to Make Them Better)”  
  `https://www.nngroup.com/articles/info-tips-bad/`
- [R3] W3C WAI-ARIA Authoring Practices Guide, “Tooltip Pattern”  
  `https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/`
- [R4] W3C WCAG 2.2 Understanding SC 1.4.13, “Content on Hover or Focus”  
  `https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html`
- [R5] GOV.UK Design System, “Details” and “Text input”  
  `https://design-system.service.gov.uk/components/details/`  
  `https://design-system.service.gov.uk/components/text-input/`
- [R6] React Aria, “Tooltip”  
  `https://react-aria.adobe.com/Tooltip`
- [R7] Radix Primitives, “Popover”  
  `https://www.radix-ui.com/primitives/docs/components/popover`
- [R8] Floating UI, “Popover”  
  `https://floating-ui.com/docs/popover`
- [R9] Mark Owen Riedl and Robert Michael Young, “Narrative Planning: Balancing Plot and Character”  
  `https://arxiv.org/abs/1401.3841`
- [R10] Mohi Reza et al., “Co-Writing with AI, on Human Terms: Aligning Research with User Demands Across the Writing Process”  
  `https://arxiv.org/abs/2504.12488`
- [R11] Syemin Park, Soobin Park, and Youn-kyung Lim, “Constella: Supporting Storywriters’ Interconnected Character Creation through LLM-based Multi-Agents”  
  `https://arxiv.org/html/2507.05820v1`

---

## 22. FOUNDATIONS alignment

This feature only *describes* continuity doctrine in static, product-authored help copy; it changes no runtime behavior — no compilation, validation, record authority, or POV/secret handling is altered. The relevant `docs/FOUNDATIONS.md` principles and how this spec satisfies them:

- **§10 / §29.4 — No accepted prose, no help text in generated prompts.** Guidance copy is product metadata in `@loom/core`/`@loom/web` only; it is never serialized into project data, prompts, candidates, or OpenRouter requests (§7.2, §17), and never enters a generated prompt. Coverage rule 8, regression tests (§16.3), and acceptance criteria 11–12 enforce this. The help for `prior_accepted_prose_status_or_handoff_note` teaches the accepted-prose exclusion rather than weakening it (§14.1).
- **§28.1 / §29.1 — Accepted prose is output, not canon; no plot rails.** Coverage rules 8 and 10 and the doctrine regression tests reject any copy implying prose can be mined as canon or introducing beats/acts/branches/drama-manager machinery.
- **§26 — Optional LLM assistance stays non-authoritative.** All help copy is product-authored and version-controlled; no runtime LLM generates help (§6.9, §7.2). The system reduces clerical/comprehension friction without taking continuity authority from the user.
- **§15 / §29.6 — POV, knowledge, secrets.** Guidance for `SECRET.*`, `FACT.audience_visibility`, and POV/reveal fields teaches the secret firewall (POV vs. audience vs. writer-visible truth; `locked` reveal permission cannot be overridden by directive) without changing it (§14.12–§14.15, §15.3).
- **§11 / §29.5 — Validation warnings vs. blockers.** Help distinguishes validation-only fields ("not sent to the prose model") from blockers and explains that focus tags are checks, not plot beats (§9.2, §12.4, §14.10), reinforcing the warning/blocker separation rather than blurring it.
- **§29.11 — Quality and workflow.** The system improves validation legibility, makes prompt-facing status explicit, and surfaces continuity doctrine at the point of authoring, while keeping critical instructions always-visible (§12.1) so help never hides task-essential information.

No §29 hard-fail question is answered "yes."
