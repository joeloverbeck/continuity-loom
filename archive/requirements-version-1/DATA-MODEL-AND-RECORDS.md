# Data Model and Records — Continuity Loom v1

## Purpose

This spec translates `story-record-schema(17).md` into implementation-oriented v1 data-model requirements while preserving its conceptual taxonomy. The goal is complete record coverage, stable identity, deterministic reference behavior, and prompt/validation readiness without turning records into plot rails or prose archives.

## Scope

This spec covers record categories, CRUD expectations, identity/reference rules, status semantics, active working set inclusion levels, cast dossier handling, generation-time brief handling, accepted prose storage rules, and implementation storage shape.

It does not define SQL DDL, migrations, UI component internals, or test files.

## Non-goals

This spec does not define database migrations, tickets, code, UI mockups, branching history, alternate timelines, plot structures, automatic prose-to-canon extraction, or LLM-authored record updates. It does not make accepted prose a record source.

## Required record coverage

V1 must support full CRUD for every record/surface named here:

- STORY CONTRACT;
- UNIVERSAL CONTENT POLICY;
- PROSE MODE;
- ACTIVE WORKING SET;
- CURRENT AUTHORITATIVE STATE;
- IMMEDIATE HANDOFF;
- MANUAL MOMENT DIRECTIVE;
- CURRENT CAST VOICE PRESSURE;
- CAST VOICE OVERRIDES;
- GENERATION VALIDATION FOCUS;
- STOP GUIDANCE;
- ENTITY;
- ENTITY STATUS;
- CAST MEMBER;
- FACT;
- BELIEF;
- SECRET;
- LOCATION;
- OBJECT;
- VISIBLE AFFORDANCE;
- EVENT;
- INTENTION;
- PLAN;
- CLOCK;
- OBLIGATION;
- CONSEQUENCE;
- OPEN THREAD;
- RELATIONSHIP;
- EMOTION.

Generation-time brief surfaces are persisted as project-local operational state, but they are conceptually distinct from durable story records unless the user manually writes equivalent durable records.

## Recommended storage shape

Use a hybrid SQLite model:

- common record metadata: stable ID, type, display label, status, salience/urgency where applicable, created/updated timestamps, archived/deleted marker, and user-defined ordering where relevant;
- typed payload stored as canonical JSON text validated by Zod or equivalent runtime schemas;
- extracted index/reference projections for dense browsing and deterministic validation: entity IDs, holder IDs, object IDs, location IDs, record links, status fields, known-by/holder/non-holder references, selected working-set membership, and cast inclusion band;
- separate tables or equivalent structures for accepted segments and current generation session state.

This shape keeps v1 schema evolution manageable while preserving deterministic validation. The typed JSON payload is not a license for arbitrary unvalidated blobs. Every record type has a runtime schema and a compiler/validation interpretation.

## Identity rules

Every durable record has a stable app-generated ID. Use UUIDv7, ULID, or an equivalent sortable stable identifier. Human-facing labels are editable and not identity.

Entity identity is central:

- person-like active entities should usually have CAST MEMBER records;
- non-person entities may appear as institutions, systems, factions, animals, supernatural forces, object agents, or pressure sources;
- references must use IDs, not mutable names;
- display names are prompt-facing handles only and do not grant POV knowledge.

The app must prevent deletion or make deletion safe when other active records reference the target. Safe options include blocking deletion, requiring reference cleanup, or converting deletion into archive/inactive status. Silent dangling references are not allowed.

## Record categories

### Global story configuration

STORY CONTRACT, UNIVERSAL CONTENT POLICY, and default PROSE MODE define durable story identity, maturity envelope, prose defaults, setting baseline, tone, language/register, and continuity philosophy.

These are always available to generation but may still be validated for completeness and content-envelope consistency.

### Generation-time brief

ACTIVE WORKING SET, CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF, MANUAL MOMENT DIRECTIVE, CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, GENERATION VALIDATION FOCUS, and STOP GUIDANCE define the next generation request.

These are not automatic durable-story updates. After accepted prose, the user manually updates records/current state before the next generation.

### Entity and cast state

ENTITY and ENTITY STATUS define what can hold state or exert pressure. CAST MEMBER defines rich voice, behavior, pressure, embodiment, agency, perception, and anti-generic constraints for person-like entities.

### Knowledge and concealment

FACT, BELIEF, SECRET, POV KNOWLEDGE PROFILE, and AUDIENCE KNOWLEDGE PROFILE preserve truth, belief, false report, hidden truth, reveal permission, POV limits, and audience/POV separation.

POV and audience profiles are compiled from records and generation-time fields. They may be represented in UI as editable generation-time brief surfaces, but their sources must remain explicit.

### Space and material state

LOCATION, OBJECT, VISIBLE AFFORDANCE, and ENTITY STATUS preserve physical possibility, possession, line of sight, routes, exits, access, visibility, object use, and object transfer.

### Causal pressure

EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, and OPEN THREAD produce local causal pressure. They are not plot machinery.

OPEN THREAD is the allowed term for unresolved pressures. Terms such as dramatic question, act, beat, arc, midpoint, climax, milestone, hero’s journey, and chapter package must not be record machinery.

### Relationship and emotion

RELATIONSHIP and EMOTION preserve social/affective pressure. Prompt-facing rendering should use prose fields such as description, pressure text, current expression, behavioral pressure, and surface expression rather than raw axes alone.

## Status semantics

V1 must distinguish status by record function.

Plain FACT records represent active truth. If a fact becomes false, the user should revise, remove, or replace it with current state, EVENT, BELIEF, CONSEQUENCE, or another active record. Deprecated facts must not remain normal prompt-facing records.

Resolved or abandoned statuses are useful for pressure records when the resolution/abandonment remains current causal or characterization pressure. For example, an abandoned PLAN may matter because it reveals cowardice or loss of resources; a resolved OBLIGATION may matter because gratitude or resentment remains active.

Inactive or archived records are not branches. They are simply not current prompt authority unless selected or represented in generation-time fields.

## Active working set rules

The active working set is manual-authority-first. The app may suggest missing records or risky omissions deterministically, but it must not silently add, remove, rewrite, summarize, or prioritize records.

Selected records compile in deterministic section order. User-defined local order may be honored inside a section; otherwise use stable deterministic ordering such as type, salience/urgency where schema-defined, label, and ID. The compiler must not use model judgment to decide what matters.

Cast inclusion bands:

- **active/onstage full**: all populated CAST MEMBER fields compile, core-first, with no silent compression;
- **present-minor compressed**: identity, physical state, immediate behavior, allowed actions, enough voice note for possible one-line speech, and temporary override if present;
- **offstage relevance**: why they matter now, what pressure they exert, whether/how they can interrupt, and what must not be revealed or assumed;
- **background**: omitted or one line only, if selected for orientation.

## CAST MEMBER handling

CAST MEMBER is the rich-record exception. Active/onstage cast need strong dossiers because voice is continuity.

V1 must support all required core fields from `story-record-schema(17).md`:

- identity: one-line, public face, private pressure;
- voice anchor: core voice, rhythm/syntax, register/diction, vocabulary/metaphor pools, profanity/intensity, taboo/avoidance, dialogue tactics, address/naming, silence/interruption/turn-taking, under-pressure voice, suppression/evasion, must-preserve, must-avoid, anti-repetition;
- pressure behavior core;
- body presence core;
- agency core.

Optional extended fields must be storable and compilable when populated. Active/onstage full dossiers render all populated fields in schema order after the required core ordering. Sample utterances are optional, sparse, selected, short, annotated, and non-copyable by default.

Temporary CAST VOICE OVERRIDES are generation-time only. They never rewrite durable CAST MEMBER identity automatically.

## Generation-time brief handling

Generation-time fields are editable and persisted so the user can return to a working generation setup. They compile only for the current request.

The brief must include:

- current authoritative state;
- immediate handoff;
- manual directive;
- selected POV/prose mode;
- current cast voice pressure;
- temporary cast voice overrides when present;
- validation focus tags;
- stop guidance.

The brief must not contain verbatim accepted prose, rejected candidate text, superseded regeneration text, or automatic prose-derived summaries. The field `prior_accepted_prose_status_or_handoff_note` may contain `None. No accepted prose is included.` or a user-authored handoff note.

## Accepted prose storage rules

Accepted segments are stored separately from story records and generation-time fields. They are append-only in order, except for deletion/export. They may store useful metadata: story/project ID, segment index/order, timestamp, model/provider/model identifier, generation settings, prompt template version, compiler version, and contract version.

They must not store the full prompt by default. They must not be used by compiler input queries. They must not be automatically mined into records.

The app does not need to track whether the user edited a candidate before acceptance. The accepted text is the accepted segment.

## User-facing behavior

Users edit records through typed app editors. Atomic records use fast generic/semi-generic editors with strong filtering and grouping. CAST MEMBER uses a custom rich editor. Generation-time brief fields use a dedicated workflow editor.

The record browser should expose status, type, references, salience/urgency, active working set inclusion, and validation relevance. It should be easy to see when a record is active truth, inactive, resolved, abandoned, archived, or selected for the current prompt.

## Data/logic implications

Every record save must parse the typed payload and refresh reference projections. Every compiler input must be derived from selected records and generation-time fields, not from accepted prose or hidden caches.

Reference validation must detect contradictions such as two current locations for one entity, two holders for one object, secret holder/non-holder conflicts, or active plan holder incapacity.

## Alignment with `FOUNDATIONS.md`

This data model preserves the foundation’s record-first substrate, single continuity, active working set supremacy, character voice as continuity, POV/secret separation, physical continuity, causal pressure without plot rails, and accepted prose archive boundary.

## Security/privacy implications

Records may contain sensitive story material. They remain local. API keys are not records. Prompt/candidate/accepted prose text is not logged by default. Accepted prose is stored only after explicit acceptance.

A project database may be inspected externally, so it must not contain secrets that belong in global environment storage.

## Validation implications

The model must support deterministic validation across typed payloads and references. Required fields from the schema are blockers only in the contexts defined by `compiler-contract(8).md`; not every optional rich field is a universal blocker.

Malformed payloads block use until repaired. Selected contradictory records block generation. Warnings surface risky omissions or length/salience issues but do not compile into prompts.

## Phase 3 implementation note

The Phase 3 subset is realized in code via SPEC-003 (2026-06-05): runtime schemas for required durable record types and generation-time brief surfaces, stable UUIDv7 record identity, common metadata projections, reference extraction, a typed repository, and physically distinct `generation_session` and `accepted_segments` tables. CRUD UI, custom rich editors, deterministic validation, and prompt compilation remain later-phase work.

## Phase 4 implementation note

The Phase 4 subset is realized in code via SPEC-004 (2026-06-05): full record CRUD routes and repository operations, dense browsing with type/status/search/reference filters, generic typed editors including a complete generic CAST MEMBER editor, the three global story-configuration editors, minimal manual active-working-set membership toggling, and reference-protected delete/archive. Custom rich CAST MEMBER and generation-time brief editors remain Phase 5 work; deterministic validation remains Phase 6 work; prompt compilation remains Phase 7 work.

## Phase 5 implementation note

The Phase 5 subset is realized in code via SPEC-005 (2026-06-05): the existing schemas and `generation_session` table now have full editing and HTTP persistence for generation-brief surfaces without a schema or `user_version` bump. CAST MEMBER durable dossier editing is sectioned but still uses the same schema fields; current cast voice pressure and cast voice overrides remain generation-time data and are not written back to durable CAST MEMBER records. Active-working-set cast bands and `local_function` are explicit user-authored data, and the "what will compile" preview is a coarse deterministic destination grouping rather than the Phase 7 compiler.

## Failure modes

Data model failure modes include:

- treating inactive records as alternate timelines;
- keeping deprecated facts as prompt-facing truth;
- using display names as identity;
- dangling references after deletion;
- flattening CAST MEMBER into generic notes;
- storing prompt text in accepted segment metadata;
- allowing generation-time overrides to mutate durable cast identity;
- making accepted prose a hidden compiler input;
- storing arbitrary JSON without runtime schema validation.

## Done Means

The data model is satisfied when:

- all required record types and generation-time surfaces have CRUD/editing support;
- records have stable IDs and reference integrity protections;
- typed payloads are runtime-validated on load/save;
- active working set membership and cast inclusion bands are explicit;
- active/onstage CAST MEMBER dossiers compile without silent compression;
- generation-time brief fields are persisted but remain distinct from durable records;
- accepted segments are stored separately and cannot be selected as prompt inputs;
- status semantics prevent stale facts from silently polluting prompts;
- deterministic validation can traverse all relevant records/references without LLM assistance.
