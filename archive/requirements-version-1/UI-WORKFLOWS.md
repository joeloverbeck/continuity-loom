# UI Workflows — Continuity Loom v1

## Purpose

This spec defines the v1 user workflows for a local web continuity cockpit. The UI must make high-friction continuity work fast and tractable without hiding authority, mutating records automatically, or turning generation into plot planning.

## Scope

This spec covers navigation, project create/open, story dashboard, record browser, record editor patterns, CAST MEMBER editor, active working set curation, generation-time brief editor, validation panel, prompt preview, OpenRouter generation, candidate editor, accepted segment browser, and durable-change reminder.

It does not define visual mockups, component code, CSS, or implementation tickets.

## Non-goals

This spec does not design a cloud dashboard, collaboration UI, manuscript publishing suite, branching timeline view, plot-outline board, act/beat tracker, or AI continuity assistant. It does not authorize hidden record selection or automatic record mutation.

## Navigation model

V1 should use a clear local-app shell with these primary areas:

- Project Library / Open Project;
- Story Dashboard;
- Records;
- Active Working Set;
- Generation Brief;
- Validation and Prompt Preview;
- Generate / Candidate;
- Accepted Segments;
- Settings.

A compact sidebar or top-level tabs are acceptable. The key requirement is conceptual separation of the five continuity surfaces.

## Project library/open/create workflow

The user can:

- create a new project in an explicit local folder;
- open an existing project folder;
- see the current project path and title;
- see whether a project requires migration;
- open the tame demo project or create a copy from the demo fixture.

The app should never imply projects live in a cloud account. Project errors should distinguish missing metadata, missing database, incompatible version, migration required, and unreadable/corrupt store.

## Story dashboard

The dashboard gives a high-level current-state view without becoming a plot planner. It may show:

- story title and premise;
- current prose mode;
- current authoritative state summary;
- active working set count by record type;
- blocker/warning counts;
- latest accepted segment index/timestamp;
- durable-change reminder if the last accepted segment has not been acknowledged.

The dashboard must not show act progress, beat completion, chapter milestones, arc progress, or global story-plan widgets.

## Record browser

Atomic records should use a dense split list/detail or table/detail workflow.

Recommended browser features:

- type filter;
- status filter;
- active working set filter;
- text search;
- entity/location/object reference filters;
- salience/urgency grouping where schema-defined;
- validation relevance badges;
- quick select/deselect for active working set;
- create-from-template actions for each record type;
- duplicate-as-new only when it does not imply branching.

Dense tables are preferred over cards for atomic records because the user must compare many small state claims quickly.

## Record editor patterns

Simple atomic record editors may be generic or semi-generic typed forms. Each editor should expose:

- required fields first;
- prompt-facing prose fields clearly;
- validation-only/status fields clearly;
- reference pickers for entities, locations, objects, and records;
- current active working set inclusion state;
- validation diagnostics tied to fields;
- safe delete/archive behavior when referenced.

The app itself does not need raw Markdown/JSON editing. Large prose fields should be comfortable textareas or structured rich text controls that still persist plain text/Markdown-like content.

## CAST MEMBER rich editor

CAST MEMBER needs a custom editor because voice is continuity. The editor should be sectioned and navigable, with at least:

- identity;
- durable voice anchor;
- voice extended / speech-pattern details;
- pressure behavior;
- body and presence;
- agency and planning;
- world pressure / relational charge / moral edge;
- perception and embodiment;
- sample utterances;
- anti-generic and anti-repetition warnings.

The editor must distinguish durable identity from current generation voice pressure. Temporary CAST VOICE OVERRIDES must appear only in the generation-time workflow, not as automatic edits to the durable dossier.

For active/onstage full cast, the UI should warn about long dossiers and suggest stronger current pins, but it must not offer automatic compression as a hidden default.

## Active working set curation

The active working set UI is manual-authority-first. It should make selection fast, but selection remains explicit.

Required behavior:

- selected records are visible by type and prompt section destination;
- active/onstage full cast, present-minor cast, and offstage relevance bands are explicit;
- local cast function is explicit for active/onstage cast;
- deterministic helper panels may suggest missing records or focus tags;
- helpers never silently add or remove records;
- risky omissions produce warnings or blockers, not hidden repair.

The working set should show “what will compile” at a conceptual level before prompt preview exists.

## Generation-time brief editor

The generation-time brief editor should be a purpose-built workflow, not a generic record form.

It must cover:

- current authoritative state;
- immediate handoff;
- manual directive;
- prose mode / selected POV;
- current cast voice pressure;
- cast voice overrides;
- validation focus tags;
- stop guidance.

The editor should clearly mark `prior_accepted_prose_status_or_handoff_note` as a user-authored handoff field and warn/block if accepted prose is pasted there.

Stop guidance should be prominent. The UI should reject or flag non-local instructions such as whole chapter, act, beat, future consequences, alternate options, or multiple response points.

## Validation panel

The validation panel is always available in the generation workflow. It separates blockers and warnings.

Blocker interactions:

- show concise explanation;
- identify affected record/field;
- navigate to fix location;
- update live after fixes;
- disable prompt preview and send.

Warning interactions:

- visible but quieter;
- collapsible;
- may link to relevant records;
- never block;
- never compile into prompt.

## Prompt preview

Prompt preview appears only when blockers are absent. It displays the rendered prompt in the main UI. Source-map/debug provenance is not required in v1.

Preview should support:

- search within prompt;
- copy prompt;
- expand/collapse major sections if feasible;
- visible template/compiler/contract version metadata outside the prompt body;
- clear notice that the prompt is temporary and not canon.

No partial prompt preview is shown when blockers exist.

## Generation and candidate workflow

After prompt preview, the user can send through OpenRouter when a global API key and model setting are available. Missing or invalid API key disables send with a clear safe error.

Candidate prose appears in an editable editor. The user can:

- edit the candidate;
- regenerate, replacing the current unsaved candidate session state;
- discard;
- go back to records/brief;
- accept the current edited candidate.

Rejected and superseded candidates are not permanently stored. The current unsaved candidate may remain visible in the active session for usability.

## Accepted segment browser

Accepted segments are readable story output. The browser should be pleasant and prose-forward, with:

- ordered segment list;
- readable text display;
- segment metadata panel;
- search/filter by text and metadata if simple;
- export selected/all text if implemented;
- delete with confirmation;
- no “use as prompt context” action.

The browser should not resemble a record editor. It is an archive of cloth, not the loom.

## Durable-change reminder

After acceptance, the app shows a persistent durable-change reminder/banner/checklist. It should say, in product terms, that accepted prose may have created durable continuity changes and the user should update records manually before the next generation.

The reminder should not be a blocking modal by default. It may include quick links to create EVENT, FACT, RELATIONSHIP, EMOTION, OBJECT, LOCATION, ENTITY STATUS, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, or CAST MEMBER updates.

Any suggested record types are deterministic links, not LLM extraction.

## Phase 12 implementation note

The durable-change reminder is realized via SPEC-012 (2026-06-06) as an app-wide
shell banner mounted above routed content. It is non-modal, dismissible, and route-safe:
Acknowledge persists the accepted-sequence threshold, Snooze hides the banner only for
the current browser session, and a later acceptance reactivates it. Quick links open
empty record creation forms through `/records?create=<TYPE>`; CAST MEMBER opens the
custom CAST MEMBER editor. The Generate / Candidate post-accept notice is now only a
short acceptance confirmation so the durable-change reminder has one persistent
surface.

## User-facing behavior

The UI should feel strict but fast: dense where records are dense, spacious where prose is read, and explicit where authority changes. The user should never need to guess whether a piece of prose, record, warning, prompt, or candidate is canonical.

## Data/logic implications

UI state must not become hidden continuity state. All compiler inputs are saved records, active working set selections, or generation-time brief fields. Candidate editor state is ephemeral until accepted. Accepted segments are durable output archive but not compiler input.

The UI may cache filters, open panes, and draft edits, but cached UI state cannot silently alter prompts.

## Alignment with `FOUNDATIONS.md`

This UI design implements active working set supremacy, prompt inspection, editable candidates, accepted segment browsing, post-acceptance reminders, no hidden automatic continuity mutation, no prompt hoarding, no plot rails, and the five continuity surfaces.

## Security/privacy implications

The UI must never display API keys in prompt preview, project pages, logs, generated files, or accepted prose. The Settings view may indicate whether an API key is configured without showing the key.

Prompt, candidate, and story record content may be sensitive. The browser app should not send telemetry in v1.

## Validation implications

Validation diagnostics should be field-linked where possible. Prompt preview and send buttons must subscribe to current blocker state, not stale success state. Validation focus tags must remain clearly labeled as completeness checks, not story structure.

## Phase 4 implementation note

The Phase 4 subset is realized in code via SPEC-004 (2026-06-05): the local app shell, dense record browser, type/status/search/reference filtering, generic typed record editors including a complete generic CAST MEMBER editor, three global configuration editors, minimal manual active-working-set membership toggling, and reference-protected delete/archive are implemented without raw-JSON ordinary editors or LLM assistance. The custom rich CAST MEMBER and generation-time brief workflows remain Phase 5 work; validation and prompt preview remain later-phase work.

## Phase 5 implementation note

The Phase 5 subset is realized in code via SPEC-005 (2026-06-05): CAST MEMBER now has a custom sectioned dossier editor driven by a core section model; the generation-time brief has a dedicated workflow over all eight brief surfaces; generation-brief routes persist partial full-session surfaces; active-working-set curation exposes active/onstage, present-minor, and offstage cast bands with `local_function`; and the working-set view shows a deterministic "what will compile" conceptual destination preview. The paste-guard and non-local stop guidance flag are non-blocking editor warnings only. The deterministic validation engine, prompt compiler, and prompt preview remain Phase 6, Phase 7, and Phase 8 work.

## Phase 8 implementation note

The Phase 8 prompt-preview surface is realized in code via SPEC-008 (2026-06-05): "Validation / Prompt Preview" is a primary route backed by the validation-gated compile endpoint, renders no prompt when blockers exist, keeps warnings visible, provides copy/search/clear controls, displays template/compiler/contract metadata and the fingerprint outside the prompt body, and treats the prompt as temporary, inspectable, and not canon. OpenRouter transport and the candidate lifecycle remain Phase 9 and Phase 10 work.

## Failure modes

UI failure modes include:

- making active working set selection feel automatic;
- hiding which records will compile;
- showing prompt preview with blockers;
- treating warnings as blockers or blockers as warnings;
- designing CAST MEMBER like a one-line personality field;
- allowing a present-minor speaker without voice guidance;
- creating a “chapter plan” dashboard that smuggles plot rails into v1;
- making accepted segment browser look like canonical record state;
- modal nagging after every acceptance that makes the durable-change reminder hostile.

## Done Means

UI workflows are satisfied when:

- a user can create/open projects and navigate the five continuity surfaces distinctly;
- all record types can be edited through typed UI;
- CAST MEMBER has a custom rich editor;
- active working set curation is explicit and manual;
- generation-time brief fields are edited in a dedicated workflow;
- blockers/warnings are separate and actionable;
- prompt preview appears only when blockers are absent;
- OpenRouter send leads to editable candidate prose;
- regenerate/discard/accept lifecycle works without storing rejected/superseded candidates permanently;
- accepted segments are readable and not compiler inputs;
- a durable-change reminder appears after acceptance;
- no UI language or widget introduces plot-rail machinery.

## Research sources

- React and Vite local web app basis: https://react.dev/learn/start-a-new-react-project and https://vite.dev/guide/
- TanStack Table: https://tanstack.com/table
- TanStack Form: https://tanstack.com/form
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
- Scrivener feature reference for long-writing organization and research panes: https://www.literatureandlatte.com/scrivener/overview
- Obsidian local vault reference for inspectable local knowledge bases: https://obsidian.md/help/data-storage
