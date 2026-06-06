# Implementation Order — Continuity Loom v1

## Purpose

This document recommends the build order for Continuity Loom v1. It is sequencing guidance for a future implementation agent, not a ticket backlog. Each phase exists because later phases depend on its invariants.

## Scope

The order covers repository/runtime foundation, storage, data model, CRUD, custom editors, validation, compiler, prompt preview, OpenRouter transport, candidate lifecycle, accepted archive, durable-change reminder, demo/stress coverage, and hardening.

It does not define implementation tickets, production code, database migrations, test files, UI mockups, or cloud architecture.

## Non-goals

This document is not a backlog. It does not allocate tasks, estimate effort, define tickets, prescribe code structure, add a cloud/collaboration path, or justify shipping generation before deterministic storage, validation, and compilation are working.

## Ordering principle

Build the deterministic substrate before model transport. The app should be able to create records, validate them, and compile a prompt before it can call OpenRouter. Otherwise the project risks becoming a generation UI that later tries to retrofit continuity discipline.

## Phase 1 — Repository and runtime foundation

Status: ✅ Implemented via SPEC-001 (2026-06-05).

Establish the TypeScript/Node/React/Vite local web app shape and the separation between frontend UI, local server, and domain core.

Why first: every later phase needs a stable place to put domain logic, local HTTP boundaries, runtime schemas, and UI workflows. This phase must not spend effort on desktop packaging.

Phase gate:

- [x] app launches locally from Node and opens in browser;
- [x] local server binds to localhost;
- [x] TypeScript project boundaries are clear enough to keep validation/compiler independent of HTTP/UI;
- [x] no cloud account, sync, or collaboration scaffolding exists;
- [x] no API key handling is added yet except a placeholder settings boundary.

## Phase 2 — Local project folder and SQLite storage foundation

Status: ✅ Implemented via SPEC-002 (2026-06-05).

Implement explicit create/open project folder behavior, project metadata parsing, canonical SQLite store open/create, version metadata, and basic backup/copy assumptions.

Why before records: records need a stable project identity, canonical store, schema/version gate, and safe open/close lifecycle.

Phase gate:

- [x] user can create/open a local project folder;
- [x] metadata and SQLite store are created/read;
- [x] invalid/missing project files produce clear diagnostics;
- [x] app knows project path/title/version;
- [x] API keys are not stored in the project;
- [x] no story records are required yet beyond minimal project metadata.

## Phase 3 — Typed data model and record identity/reference layer

Status: ✅ Implemented via SPEC-003 (2026-06-05).

Define runtime schemas for all record payloads, stable IDs, common metadata, reference projections, and repository interfaces.

Why before CRUD: editors should not invent ad hoc record shapes. Validation and compiler later depend on stable IDs and references.

Phase gate:

- [x] every required record type has a runtime schema;
- [x] records have stable IDs and common metadata;
- [x] reference projections exist for entity/location/object/record relationships;
- [x] load/save rejects malformed payloads;
- [x] accepted segment storage is physically distinct from records even if not fully used yet.

## Phase 4 — CRUD for all schema record types with basic complete editors

Status: ✅ Implemented via SPEC-004 (2026-06-05).

Build generic/semi-generic typed editors and dense browsing so every record type can be created, viewed, edited, deleted/archived, filtered, and selected.

Why before custom polish: v1 requires full record coverage. Deterministic validation cannot be meaningful if some required record types cannot be authored.

Phase gate:

- [x] full CRUD exists for every schema record type;
- [x] record browser supports type/status/search/reference filtering;
- [x] active working set inclusion can be toggled manually;
- [x] delete/archive behavior protects references;
- [x] no editor uses raw arbitrary JSON as ordinary UI;
- [x] no LLM assistance exists.

## Phase 5 — Custom rich editors for CAST MEMBER and generation-time brief

Status: ✅ Implemented via SPEC-005 (2026-06-05).

Replace generic surfaces where generic editing would be hostile or unsafe: CAST MEMBER dossiers and generation-time brief workflows.

Why after basic CRUD: custom editors need the underlying record model stable. Why before validation/compiler: CAST MEMBER and generation-time brief fields are central to prompt completeness.

Phase gate:

- [x] CAST MEMBER editor exposes durable identity, voice anchor, pressure behavior, body presence, agency, extended fields, samples, and anti-generic warnings;
- [x] generation-time brief editor covers current authoritative state, immediate handoff, manual directive, prose mode/POV, current cast voice pressure, temporary voice overrides, validation focus tags, and stop guidance;
- [x] durable cast identity and temporary current voice pressure are visibly distinct;
- [x] active/onstage, present-minor, and offstage cast bands are explicit.

## Phase 6 — Deterministic validation engine

Status: ✅ Implemented via SPEC-006 (2026-06-05).

Implement fail-closed validation over selected records, active working set, story configuration, and generation-time brief.

Why before compiler: compiler output is only meaningful after blockers are resolved. If prompt rendering comes first, invalid prompts will become design gravity.

Phase gate:

- [x] universal minimum completeness checks exist;
- [x] compiler-contract validation focus matrix is implemented for v1;
- [x] blockers and warnings are structured separately;
- [x] blockers disable prompt preview and send paths;
- [x] diagnostics are actionable and field-linked where possible;
- [x] validation does not mutate records and uses no LLM;
- accepted prose contamination blocks.

## Phase 7 — Deterministic prompt compiler

Status: ✅ Implemented via SPEC-007 (2026-06-05).

Implement the universal prompt renderer from validated snapshots using `prompt-template.md` and `compiler-contract.md`.

Why after validation: compiler can rely on required state and focus tags having already been checked. Why before OpenRouter: prompt preview must exist before transport.

Phase gate:

- [x] exact section order is implemented;
- [x] every placeholder maps to deterministic sources;
- [x] empty-state rendering is deterministic;
- [x] active/onstage CAST MEMBER dossiers render all populated fields without silent compression;
- [x] selected records compile only when selected;
- [x] no accepted prose, rejected candidate, superseded candidate, or auto prose-derived summary compiles;
- [x] identical inputs produce identical prompt text.

## Phase 8 — Prompt preview gated by validation

Status: ✅ Implemented via SPEC-008 (2026-06-05).

Build the UI surface that displays the compiled prompt only when blockers are absent.

Why before OpenRouter: the user must inspect the prompt before sending. This is a constitutional workflow boundary.

Phase gate:

- [x] prompt preview appears only with zero blockers;
- [x] no partial prompt preview exists;
- [x] prompt preview is readable/searchable enough for large prompts;
- [x] warnings remain visible but do not compile;
- [x] prompt text is not permanently archived by default;
- [x] template/compiler/contract version metadata is visible outside the prompt body.

## Phase 9 — OpenRouter global settings and non-streaming send

Status: ✅ Implemented via SPEC-009 (2026-06-06).

Add global OpenRouter settings, API-key detection, optional model-list refresh/manual model entry, and non-streaming send.

Why after prompt preview: transport should consume a compiled prompt and settings, not query records directly.

Implementation note: Phase 9 returns read-only ephemeral candidate text from transport. The editable candidate lifecycle, regenerate/discard behavior, and acceptance entry point remain Phase 10.

Phase gate:

- [x] model, temperature, max output tokens, and optional top_p are configurable globally;
- [x] API key is read from global secret storage only;
- [x] missing/invalid key fails safely;
- [x] model-list refresh is optional and manual model entry works;
- [x] non-streaming send returns candidate text;
- [x] errors are normalized;
- [x] no project data mutates on send failure;
- [x] prompts and keys are not logged.

## Phase 10 — Candidate editor and regenerate/discard/accept lifecycle

Status: ✅ Implemented via SPEC-010 (2026-06-06).

Implement current-session candidate display/editing, regeneration, discard, and acceptance entry point.

Why after OpenRouter: candidates are the UI result of transport. Why before accepted archive browser: acceptance needs a durable target.

Implementation note: Phase 10 ships the dedicated Generate / Candidate surface, editable
session-only candidate text, regenerate/discard behavior, and one accepted-segment append
through `POST /api/accepted-segments` with a full key-free metadata snapshot. The accepted
segment browser, deletion, and export remain Phase 11. The persistent durable-change
banner/checklist with acknowledge/snooze remains Phase 12; Phase 10 includes only the
minimal ephemeral post-accept notice.

Phase gate:

- [x] successful send creates editable candidate only;
- [x] user can edit candidate before acceptance;
- [x] regenerate replaces or supersedes current unsaved candidate without permanent storage;
- [x] discard clears current candidate without durable writes;
- [x] accept writes one accepted segment through archive logic;
- [x] no rejected/superseded candidates persist.

## Phase 11 — Accepted segment archive and browser

Implement ordered accepted segment storage, metadata, browsing, deletion, and simple export if included.

Why after candidate lifecycle: accepted segments are created by explicit acceptance. Why before durable-change reminder: reminder references a real acceptance event.

Phase gate:

- accepted segments store text and metadata in order;
- browser is readable and prose-forward;
- deletion/export do not affect records automatically;
- accepted segment text is physically/logically excluded from compiler inputs;
- no full prompt text is stored with segments by default.

## Phase 12 — Durable-change reminder workflow

Add the persistent post-acceptance banner/checklist and quick links for manual record updates.

Why after archive: the reminder should appear only after a real accepted segment exists. It should guide manual updates without extracting canon.

Phase gate:

- reminder appears after acceptance;
- reminder can be acknowledged/snoozed without creating records;
- quick links open relevant record editors or creation forms;
- no LLM parses accepted prose;
- next-generation workflow still relies on user-updated records/current state.

## Phase 13 — Tame demo project and stress coverage

Create the tame demo fixture and use it to exercise the full loop and validation blocker examples.

Why near the end: demo should run through real project/storage/record/validation/compiler/OpenRouter/candidate/archive paths, not special-case scaffolding.

Phase gate:

- The Letter Under the Flour Bin demo can be created/opened as normal project data;
- valid demo setup passes validation and compiles prompt;
- invalid demo variants demonstrate blockers;
- mocked OpenRouter response can be edited/accepted;
- accepted browser and durable reminder work;
- Red Bunny content is absent from demo;
- stress-suite coverage mapping is checked against implemented capabilities.

## Phase 14 — Polish, regression hardening, and documentation

Harden the system after the full loop exists.

Why last: polish should not precede core continuity correctness. Regression hardening should focus on authority bugs discovered during full-loop use.

Phase gate:

- compiler golden outputs stabilized;
- validation diagnostics refined for clarity;
- storage backup/migration behavior documented and hardened;
- UI performance acceptable for dense record projects;
- API-key leakage tests pass;
- accepted-prose exclusion regressions pass;
- user-facing documentation explains the loop, project ownership, prompt preview, OpenRouter settings, candidate lifecycle, and manual record updates.

## Cross-spec dependencies

- `TECHNOLOGY-DECISIONS.md` informs phases 1, 3, 4, and 9.
- `LOCAL-FIRST-STORAGE.md` informs phases 2, 3, 11, and 14.
- `DATA-MODEL-AND-RECORDS.md` informs phases 3, 4, 5, 6, 7, and 11.
- `VALIDATION-ENGINE.md` is the phase 6 authority and gates phases 7–10.
- `PROMPT-COMPILER.md` is the phase 7 authority and gates phases 8–10.
- `UI-WORKFLOWS.md` informs phases 1, 4, 5, 8, 10, 11, and 12.
- `OPENROUTER-INTEGRATION.md` informs phase 9.
- `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` informs phases 10–12.
- `DEMO-PROJECT-AND-STRESS-COVERAGE.md` informs phase 13.
- `TESTING-STRATEGY.md` applies throughout and becomes especially important from phase 6 onward.

## User-facing behavior

The build order should make visible user value appear gradually without violating the model. Early builds may feel like a records database. That is acceptable. The app should not ship a generation button before validation and prompt preview are trustworthy.

## Data/logic implications

The ordering enforces a one-way dependency:

records and project storage → validation → compiler → prompt preview → OpenRouter → candidate → accepted archive → manual update reminder.

No later phase is allowed to reach backward and mutate records automatically.

## Alignment with `FOUNDATIONS.md`

This order prioritizes the constitutional hard parts before model calls: local-first data ownership, explicit records, active working set selection, fail-closed validation, deterministic compilation, prompt inspection, and human gatekeeping.

## Security/privacy implications

Secret handling should be designed before OpenRouter send exists. Logging rules should exist before prompt/candidate traffic is generated. Project storage should be stable before any sensitive story data is sent over transport.

## Validation implications

Validation is a hard phase gate. No prompt preview, OpenRouter send, candidate lifecycle, or accepted segment archive integration should be treated as complete unless blockers cannot be bypassed.

## Failure modes

Implementation-order failure modes include:

- building OpenRouter generation before validation/compiler and letting invalid prompt patterns ossify;
- spending v1 effort on desktop packaging before local web loop works;
- polishing UI cards before dense record CRUD exists;
- implementing accepted archive before candidate acceptance boundaries are clear;
- adding demo special cases instead of normal project data;
- deferring secret/logging rules until after transport exists;
- treating this document as a ticket list instead of dependency sequencing.

## Done Means

The implementation order is satisfied when:

- phases are followed in dependency order unless a future spec explicitly justifies reordering;
- each phase has a clear phase gate;
- no phase introduces branches, plot rails, cloud authority, automatic prose-to-canon extraction, LLM record mutation, permanent prompt archives by default, API-key leakage, or validation override;
- the first end-to-end generation happens only after storage, records, validation, compiler, and prompt preview are functional;
- the demo fixture validates the full real loop rather than bypassing it;
- hardening includes regressions for no accepted-prose prompt inclusion and no API-key leakage.
