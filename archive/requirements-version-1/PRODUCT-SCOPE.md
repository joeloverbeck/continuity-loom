# Product Scope — Continuity Loom v1

## Purpose

Continuity Loom v1 exists to help one human author maintain explicit story continuity and use that continuity to generate one local prose segment at a time through an external prose-writing model. It is a continuity cockpit, not an autonomous author.

The v1 product question is not “how can the app write a novel?” The question is “how can the app make the next generated prose segment obey the current user-owned continuity state?”

## Scope

V1 includes:

- multiple local story projects;
- explicit create/open project-folder workflow;
- full CRUD for all record types named in `story-record-schema(17).md`;
- custom rich editing for CAST MEMBER dossiers;
- custom workflow editors for generation-time brief surfaces;
- manual active working set curation;
- deterministic validation with blockers and warnings;
- deterministic prompt compilation from selected records and generation-time fields;
- prompt preview after validation passes;
- global OpenRouter model settings and non-streaming send;
- editable current-session candidate prose;
- regenerate, discard, edit, and accept flow;
- accepted segment archive for reading and export/deletion;
- durable-change reminder after acceptance;
- tame built-in demo fixture for smoke testing and onboarding.

The product is local web first: a Node-launched local server opened in the user’s browser. No packaged desktop app is mandatory for v1.

## Non-goals

V1 is not:

- an autonomous story generator;
- a plot planner;
- a branching-story or alternate-timeline engine;
- a dramatic-arc, act, beat, chapter, or milestone manager;
- a lorebook that automatically injects context because keywords match;
- a system that mines accepted prose into canon;
- an LLM assistant that mutates records;
- a collaboration app;
- a cloud service;
- a sync system;
- a manuscript drafting suite that replaces Scrivener or a prose editor;
- a full export/publishing pipeline;
- a permanent prompt archive or audit log.

## User model

The v1 user is a power author who accepts explicit continuity work in exchange for controlled generation. The UI may be developer-friendly and dense, but it must remain pleasant, fast, and non-hostile. It should serve a user who thinks in records, states, secrets, objects, voice dossiers, and local causal pressure.

There are no user accounts, organizations, roles, permissions, team projects, cloud identities, or collaboration permissions.

## Core loop

The v1 loop is:

1. The user opens a local story project.
2. The user creates or edits story records.
3. The user curates the active working set for the next local generation.
4. The user edits current authoritative state, immediate handoff, manual directive, prose mode, stop guidance, voice pressure, cast overrides, and validation focus tags.
5. Deterministic validation runs.
6. If blockers exist, prompt preview and OpenRouter send are disabled.
7. If validation passes, the app renders the deterministic prompt.
8. The user inspects the prompt.
9. The app sends the prompt to OpenRouter only when the user chooses to generate and a global API key/model setting is valid.
10. The app receives one candidate response.
11. The user edits, regenerates, discards, or accepts the candidate.
12. Only accepted text is stored as an accepted segment.
13. The app shows a durable-change reminder so the user can manually update records.

This loop preserves the foundation rule that generation may propose cloth, but only user-authored records are the loom.

## Five continuity surfaces

V1 must keep these surfaces visually and logically distinct.

### 1. All story records

The full local continuity store for a story. It may contain active, inactive, resolved, abandoned, archived, or currently irrelevant records. It is not automatically prompt context.

### 2. Active working set

The selected records that matter for the next local generation. This is an authorial selection surface. The app may warn or block when the set is unsafe, but it must not silently add, remove, reprioritize, rewrite, or compress selected records.

### 3. Generation-time brief

The immediate launch surface: current authoritative state, immediate handoff, manual directive, prose mode, stop guidance, validation focus tags, current cast voice pressure, and temporary cast voice overrides. These fields are prompt inputs, not durable records unless the user also creates durable records.

### 4. Generated prompt

The deterministic operational artifact compiled from the active working set and generation-time brief. It is inspectable for the current generation session. It is not canon and is not permanently archived by default.

### 5. Accepted segment archive

The ordered readable prose output archive. It is for reading, review, deletion, and export. It is never a prompt source.

## Feature boundary

V1 must support every record type in the schema, but it does not need bespoke UI glamour for every atomic record on day one. The boundary is complete CRUD and deterministic participation in validation/compiler logic. Simple atomic record types may use generic or semi-generic typed editors, while CAST MEMBER and generation-time brief fields require custom workflows.

V1 may include deterministic helper panels. They may suggest missing focus tags, missing records, likely blockers, or risky omissions based on explicit current UI state. They must not silently make the author’s selection.

V1 may support mature story configurations, but only as story-configured context bounded by external model/provider/platform policy. It must not attempt to bypass provider policy or insert out-of-fiction safety analysis into prose.

## User-facing behavior

The user should always know:

- which project is open;
- which records exist;
- which records are selected for the next prompt;
- which generation-time fields will compile;
- whether validation is passing;
- why blockers block;
- what the exact generated prompt is after validation passes;
- which model/settings will be used to send;
- whether a prose segment is merely a candidate or an accepted segment;
- that accepted prose does not update continuity automatically.

The product should feel strict but not punitive. Blockers must be surgical and actionable. Warnings must be visible without becoming nagging modal friction.

## Data/logic implications

Product logic must enforce these separations:

- record CRUD does not imply active working set inclusion;
- active working set inclusion does not imply prompt compilation if validation blocks;
- prompt generation does not imply OpenRouter send;
- OpenRouter candidate receipt does not imply accepted prose;
- accepted prose does not imply continuity mutation;
- accepted segment browsing does not imply prompt context.

The app must maintain one current continuity per project. Inactive or archived records are not branches; they are merely not current prompt authority unless selected or represented by current generation-time fields.

## Alignment with `FOUNDATIONS.md`

This scope implements the foundation’s app identity, core loop, active working set supremacy, deterministic compiler doctrine, fail-closed validation doctrine, no accepted prose in prompts rule, prompt transparency without prompt hoarding, local-first data ownership, OpenRouter transport boundary, and durable-change human gatekeeping.

## Security/privacy implications

V1 is local-first and single-user. There are no cloud accounts or server-side project stores. Project data remains in explicit local folders. API keys are global secrets outside project folders and never appear in prompts, project data, logs, generated files, or accepted prose.

Candidate text is private local session data until acceptance. Rejected and superseded candidates are not permanently stored.

## Validation implications

V1 validation must block generation when mandatory generation-time fields are missing, selected records contradict each other, physical continuity is impossible, secrets would leak, prompt fields contain accepted prose, the manual directive asks for non-local output, or active cast lacks required voice/body dossier support.

V1 has no blocker override. This is product behavior, not merely a validation-engine detail.

## Failure modes

Product-level failure modes include:

- the UI makes accepted prose feel like canon;
- generation appears to update records automatically;
- active working set curation is hidden or automatic;
- validation blockers are too vague to fix;
- warnings are treated like blockers and make the app hostile;
- prompt preview is shown from partial invalid state;
- the app accidentally grows into a plot planner through labels such as act, beat, chapter package, arc, or milestone;
- rejected candidates are saved as hidden history;
- a missing API key causes partial data writes or confusing downstream errors.

## Done Means

V1 product scope is satisfied when:

- a user can create/open multiple local projects;
- every schema record type can be created, read, updated, deleted, filtered, and selected/deselected for the active working set;
- CAST MEMBER and generation-time brief workflows are purpose-built enough to support the prompt contract;
- validation blockers prevent prompt preview and OpenRouter send;
- a passing generation can be previewed, sent, edited, regenerated, discarded, or accepted;
- accepted segments can be browsed in order and deleted/exported without becoming compiler inputs;
- durable-change reminders appear after acceptance;
- no UI, data model, compiler path, validation path, or transport path violates the non-negotiable alignment summary.
