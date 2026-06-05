# SPEC-004 — CRUD for All Schema Record Types with Basic Complete Editors

Status: DRAFT
Phase: Implementation Order Phase 4
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`, `docs/requirements-version-1/UI-WORKFLOWS.md`
Supporting authorities: `docs/story-record-schema.md`, `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style.

## Brainstorm Context

- **Original request:** Analyze `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  now that SPEC-003 is implemented and archived, determine which spec to create
  next in `specs/`, align it with `docs/FOUNDATIONS.md` (mindful of
  `compiler-contract.md`, `prompt-template.md`, `story-record-schema.md`,
  `stress-suite.md`), and create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phase 1 ✅ (SPEC-001),
  Phase 2 ✅ (SPEC-002), and Phase 3 ✅ (SPEC-003). **Phase 4 — CRUD for all
  schema record types with basic complete editors** is the next link in the
  strict one-way dependency chain
  (`storage → records → validation → compiler → preview → transport`). SPEC-003
  explicitly deferred "CRUD UI, dense record browser, working-set toggles" and
  "New record/CRUD API routes" to Phase 4. The problem space is fully
  constrained by `DATA-MODEL-AND-RECORDS.md` and `UI-WORKFLOWS.md`, so a
  **single approach** is presented rather than competing alternatives.
- **Reference material:** none externally authored — the repo docs are
  orientation, the request is the spec.
- **Scope decisions made during brainstorm (confirmed by the user):**
  1. **UI dependency posture — adopt TanStack Table + React Hook Form (with a
     Zod resolver) + a lightweight router.** The web package is today plain
     React 19 + Vite with no router and no table/form library; Phase 4 is the
     app's first substantial UI. These are the libraries `UI-WORKFLOWS.md`
     names as research sources, and they scale to dense atomic-record browsing
     and the deep CAST MEMBER field tree.
  2. **CAST MEMBER editor — generic/semi-generic functional editor now; the
     custom rich sectioned editor stays in Phase 5.** The Phase-4 gate requires
     "full CRUD exists for every schema record type" (CAST MEMBER included), but
     `IMPLEMENTATION-ORDER.md` Phase 5 owns the *custom* CAST MEMBER and
     generation-time brief editors. Phase 4 ships a complete-but-plain typed
     editor that exposes every CAST MEMBER field without silent drop; Phase 5
     replaces it.
  3. **Story Dashboard deferred.** Phase 4 builds the navigation shell and the
     record-centric surfaces. The Story Dashboard's blocker/warning counts
     depend on the Phase-6 validation engine, so the dashboard is deferred until
     it can be populated truthfully.
- **Final confidence:** ~97%. Which spec is settled by the dependency chain; the
  three scope boundaries above are the only material open decisions and are now
  resolved.

---

## Problem Statement

After SPEC-003 the app has a complete headless data-model layer: closed runtime
Zod schemas for every record type (18 durable types + 3 global-config
singletons + 8 generation-time brief surfaces), a record-type **registry**,
UUIDv7 identity, reference projections, and a lifecycle-bound
`RecordRepository` on the server with `createRecord` / `updateRecord` /
`getRecord` / `listRecords` / `archiveRecord` / `deleteRecord` (reference-
integrity protected) / `getStoryConfig` / `setStoryConfig` /
`getGenerationSession` / `setGenerationSession` and the physically distinct
`accepted_segments` table. Malformed payloads are already rejected at the
repository boundary (`parseRecordPayload`).

But **none of this is reachable by a user.** The HTTP API
(`packages/server/src/project-routes.ts` + `server.ts`) exposes only project
lifecycle routes (`/api/health`, `/api/version`, `/api/project/*`); there are no
record routes. The web app (`packages/web/src/`) is a project picker only —
`App.tsx` + `ProjectPicker.tsx` + `api.ts` — with no record browser, no editor,
no navigation shell.

Phase 4's job, per `IMPLEMENTATION-ORDER.md`, is to make the SPEC-003 substrate
usable: **full CRUD for every schema record type through typed UI**, a dense
record browser with filtering, manual active-working-set inclusion toggling, and
reference-protected delete/archive — "no editor uses raw arbitrary JSON as
ordinary UI" and "no LLM assistance exists."

This spec introduces **no deterministic validation engine (Phase 6), no prompt
compiler (Phase 7), no prompt preview (Phase 8), no OpenRouter transport (Phase
9), no candidate lifecycle (Phase 10), no custom CAST MEMBER / generation-brief
workflow editors (Phase 5), and no LLM surface of any kind.** It exposes the
existing repository over HTTP and builds the typed UI on top of it.

## Approach

Single approach — the problem space is fully constrained by
`DATA-MODEL-AND-RECORDS.md` ("Required record coverage," "Active working set
rules," "User-facing behavior") and `UI-WORKFLOWS.md` ("Record browser," "Record
editor patterns," "Active working set curation"). Layering follows the
SPEC-001/002/003 boundary: `@loom/core` stays pure, `@loom/server` owns I/O and
HTTP, `@loom/web` owns React UI.

### `@loom/core` (pure — no `node:*`, no framework)

The data-model layer is complete; Phase 4 adds only **UI-supporting pure
helpers**, all unit-testable without I/O and within the import-boundary:

- **Per-type field manifests / editor descriptors** derived deterministically
  from the registry: for each record type, the ordered list of fields, each
  field's kind (short string, prose/textarea, enum + its values, reference
  picker + target role, list-of, nested group), requiredness, and prompt-facing
  vs. validation-only/status classification (per `UI-WORKFLOWS.md` "required
  fields first; prompt-facing prose fields clearly; validation-only/status
  fields clearly"). This descriptor is what drives the generic typed forms so no
  editor falls back to raw JSON. Whether descriptors are introspected from the
  Zod schemas or hand-authored alongside each schema is an implementation choice
  for the ticket phase; either way they live in core and are registry-keyed.
- **Display-label derivation helper** (pure): given a record type + payload,
  produce a sensible default `displayLabel` (e.g. ENTITY `display_name`, FACT
  truncated `statement`) so create-from-template forms pre-fill a label.
- **Reference-target option helpers** (pure): given the set of existing records
  and a reference role, return the eligible target records (e.g. an `owner`
  picker offers ENTITY records). Selection logic stays deterministic; no LLM,
  no "smart" ranking beyond stable sort.

No new prompt placeholders, no compiler logic, no validation rules are added —
those are Phases 6–7. Schema field names remain aligned with
`story-record-schema.md`.

### `@loom/server` (I/O + HTTP boundary)

Expose the existing `RecordRepository` over a localhost-only REST surface,
registered the same way as `registerProjectRoutes`. All routes require an open
project and return a structured error when none is open. Validation stays at the
repository boundary; routes are thin.

- **Record CRUD routes** (`packages/server/src/record-routes.ts`):
  - `GET  /api/records` — list, with query params for `type`, `status`,
    `includeArchived`, free-text `q`, and reference filter
    (`refRole`/`targetId`); maps to `listRecords` plus deterministic in-repo
    filtering. Returns the common metadata projection per row (id, type,
    displayLabel, status, salience, urgency, archived, userOrder, timestamps)
    for dense browsing; full payload on demand via the detail route.
  - `GET  /api/records/:id` — single record; surfaces the
    `not-found` / `malformed-record` structured results from `getRecord`.
  - `POST /api/records` — create; body `{ type, displayLabel?, payload }`;
    repository Zod-parses and rejects malformed payloads with a structured 400
    carrying the field-level issues (so the UI can field-link them).
  - `PUT  /api/records/:id` — update; same validation contract.
  - `POST /api/records/:id/archive` — soft archive (`archiveRecord`).
  - `DELETE /api/records/:id` — hard delete (`deleteRecord`); on inbound active
    references, returns a structured `reference-integrity` error
    (`RecordIntegrityError`) listing the blocking referrers so the UI can guide
    cleanup — **never a silent dangling reference**.
  - `GET  /api/records/:id/references` — outgoing + incoming references for the
    detail pane and pre-delete safety check.
- **Global story-config routes**: `GET /api/story-config/:kind` and
  `PUT /api/story-config/:kind` for `STORY CONTRACT`, `UNIVERSAL CONTENT
  POLICY`, `PROSE MODE` (singleton upserts via `getStoryConfig`/
  `setStoryConfig`).
- **Active-working-set membership routes** (minimal — full curation is Phase 5):
  `GET /api/working-set` and `PUT /api/working-set` that read/write **only the
  `selected_records` membership list**, persisted through the existing
  `generation_session` storage. Cast inclusion bands, `local_function`,
  POV/voice-pressure, focus tags, and stop guidance are **out of scope** here
  (Phase 5). The membership write must not require a fully-populated
  generation-time brief.
- Reuses SPEC-001/002/003 logging redaction: record payloads, prose fields, and
  brief text are **not logged**; no API-key or prompt fields exist in these
  schemas.

### `@loom/web` (React + Vite — the app's first substantial UI)

Build the navigation shell and record-centric surfaces. New dependencies (per
the confirmed posture): a lightweight router, `@tanstack/react-table`,
`react-hook-form` + a Zod resolver. Forms and reference pickers drive off the
core registry/field descriptors so the UI is type-complete and registry-extends
automatically.

- **App shell + navigation** (`UI-WORKFLOWS.md` "Navigation model"): a compact
  shell separating the continuity surfaces this phase touches — **Records**,
  **Active Working Set**, **Story Configuration (global)**, and **Settings
  (placeholder)** — plus the existing **Project Library / Open Project**. The
  shell must keep the five-surface conceptual separation; surfaces not yet built
  (Generation Brief, Validation/Preview, Generate/Candidate, Accepted Segments)
  may appear as clearly-disabled "later phase" affordances or be omitted. **No
  Story Dashboard this phase** (deferred — see Out of Scope).
- **Record browser** (`UI-WORKFLOWS.md` "Record browser"): dense split
  list/detail (or table/detail) over TanStack Table, with type filter, status
  filter, active-working-set filter, text search, entity/location/object
  reference filters, salience/urgency grouping where schema-defined, quick
  select/deselect for the active working set, and create-from-template actions
  per record type. Dense table over cards for atomic records. Duplicate-as-new
  is optional and, if included, must not imply branching.
- **Generic/semi-generic typed record editors** (`UI-WORKFLOWS.md` "Record
  editor patterns"): one registry-driven form engine rendering required fields
  first, prompt-facing prose fields as comfortable textareas, validation-only/
  status fields clearly, enum fields as selects, and reference fields as pickers
  populated from existing records. **No raw Markdown/JSON editor as ordinary
  UI.** Editors surface current active-working-set inclusion state and
  safe-delete/archive behavior. The same engine renders **CAST MEMBER**
  completely (all required-core + optional-extended fields, no silent drop) —
  functional but plain; the custom sectioned editor is Phase 5.
- **Global story-configuration editors**: typed forms for STORY CONTRACT,
  UNIVERSAL CONTENT POLICY, and PROSE MODE (singletons), reachable from the
  shell.
- **Active-working-set surface** (minimal): an explicit, manual membership view
  listing selected records by type with quick toggle; no hidden auto-selection,
  no silent add/remove. Cast bands and `local_function` are deferred to Phase 5.
- **API client** (`packages/web/src/api.ts`): typed fetch wrappers for every new
  route, mirroring the existing project wrappers.

## Deliverables

1. **`@loom/core` UI-supporting helpers (pure).**
   - Registry-keyed per-type field manifests / editor descriptors (field order,
     kind, requiredness, prompt-facing vs. status/validation-only).
   - Display-label derivation helper.
   - Reference-target option helpers (deterministic eligible-target resolution
     per reference role).
   - New exports added to `packages/core/src/index.ts`.
   - Unit tests: every registry record type yields a descriptor covering all its
     schema fields (no field omitted); label derivation for representative
     types; reference-target eligibility for representative roles. Core boundary
     test stays green (no `node:*`/framework imports added).

2. **`@loom/server` record + config + working-set HTTP routes.**
   - `record-routes.ts` (CRUD + archive + delete + references) registered in
     `server.ts`, all gated on an open project, all delegating validation to the
     repository and surfacing structured `not-found` / `malformed-record` /
     `reference-integrity` results with field-level issues.
   - Story-config singleton routes and minimal working-set membership routes.
   - No new tables, no schema/DDL change (SPEC-003 tables suffice); no
     `user_version` bump.

3. **`@loom/web` UI.**
   - Navigation shell with the record-centric surfaces; router wired.
   - Dense record browser with the full filter/search/reference/working-set
     feature set and create-from-template actions.
   - Registry-driven typed editors for all durable record types (including a
     complete generic CAST MEMBER editor) and the three global-config
     singletons; reference pickers; safe archive/delete with reference-integrity
     surfacing.
   - Minimal manual active-working-set membership surface + browser quick-toggle.
   - Extended `api.ts` client.

4. **Tests (Vitest).**
   - Core unit tests (deliverable 1).
   - Server route integration tests against a temp project: create→list→get→
     update→archive→delete round-trips for representative types (atomic + CAST
     MEMBER); malformed-payload 400 with field issues; reference-integrity error
     on deleting a referenced record; story-config singleton round-trip;
     working-set membership read/write through `generation_session` without a
     full brief; every route returns a clean structured error when no project is
     open; redaction holds (payload/prose not logged).
   - Web component tests (Testing Library): browser renders + filters; a
     generic editor creates and edits a representative atomic record; the CAST
     MEMBER editor exposes all populated fields; reference picker lists eligible
     targets; delete blocked-by-reference shows the guiding message; working-set
     toggle reflects membership. No raw-JSON editor is presented for any type.

5. **Governing-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `IMPLEMENTATION-ORDER.md` Phase 4: add
     `Status: ✅ Implemented via SPEC-004 (YYYY-MM-DD).` and check the Phase-4
     gate bullets satisfied. Do not alter ordering rationale or later phases.
   - `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` and/or
     `UI-WORKFLOWS.md`: add a short "Phase 4 implementation note" recording that
     full CRUD, the dense browser, typed editors, minimal working-set toggling,
     and reference-protected delete/archive are realized via SPEC-004, leaving
     custom CAST MEMBER / generation-brief editors (Phase 5), validation (Phase
     6), and compilation (Phase 7) open.
   - **No `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md`
     change is required** — Phase 4 introduces no prompt placeholders and no
     schema fields. If a schema field is found during implementation to diverge
     from `story-record-schema.md`, reconcile the schema doc in the same change
     rather than forking a field name (FOUNDATIONS §8 anti-drift rule).

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §6 / §7 Five continuity surfaces; active-working-set supremacy | aligns | Nav shell keeps surfaces distinct; working-set membership is explicit and manual, never auto-populated @ UI shell + working-set routes. |
| §29.3 Active-working-set hard fails (silent add/remove/compress) | aligns | Membership toggle adds/removes only on explicit user action; CAST MEMBER editor exposes every populated field with no silent compression @ working-set surface + editor. |
| §13 / §17 Records atomic; CAST MEMBER rich exception; field economy | aligns | Dense typed editors for atomic types; complete (if plain) CAST MEMBER editor covering required-core + optional-extended fields @ editor engine. |
| §29.4 No arbitrary unvalidated blobs | aligns | All writes Zod-parse at the repository boundary; routes surface field-level issues; no raw-JSON editor in UI @ routes + editor engine. |
| Data-model "Identity rules" / §29.7-adjacent reference integrity | aligns | Delete/archive routes surface `RecordIntegrityError` with blocking referrers; UI guides cleanup; no silent dangling references @ delete route + UI. |
| §4.1 / §26 No LLM authority; no LLM record mutation | aligns | Phase 4 adds zero LLM surface; all reference-target suggestion and label derivation is deterministic @ core helpers. |
| §10 / §21 No accepted prose as compiler input | aligns | `accepted_segments` is untouched; no record/working-set route reads it; no prompt path exists yet @ routes. |
| §23 / §29.9 Secrets boundary | aligns | No API-key/prompt fields in any schema; payload/prose not logged; Settings surface is a placeholder that never shows keys @ routes + logging. |
| §29.1 Plot-rail hard fails | aligns | No dashboard/board/act/beat widgets; duplicate-as-new must not imply branching; OPEN THREAD remains the only unresolved-pressure term @ UI. |

No §29 hard-fail is answered "yes": no autonomous generation, no branching/plot
rails, no accepted-prose-as-canon, no LLM record mutation, no nondeterminism, no
silent active-working-set mutation or cast compression, no remote
sole-source-of-truth, no secret/key leakage, no validation override (no
validation engine exists yet).

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test passes — new core helpers import no `node:*` and no
  framework.
- Server route tests: CRUD round-trips for atomic + CAST MEMBER types;
  malformed-payload 400 with field-linked issues; reference-integrity error on
  deleting a referenced record (no dangling reference); story-config singleton
  round-trip; working-set membership persists via `generation_session` without a
  full brief; routes error cleanly with no open project; logs contain no payload/
  prose text.
- Web tests: every record type is creatable/editable through a typed form with
  no raw-JSON fallback; CAST MEMBER editor exposes all populated fields; browser
  filters (type/status/working-set/search/reference) work; reference pickers
  list eligible targets; blocked delete shows guidance; working-set toggle
  reflects membership.
- Manual smoke (per `UI-WORKFLOWS.md` "Done Means"): create/open a project,
  create one record of each category, edit, filter, toggle working-set
  membership, attempt a blocked delete, edit the three global-config singletons —
  all through the app, server still binds `127.0.0.1` only.

## Out of Scope

- **Custom rich CAST MEMBER editor; generation-time brief workflow editor** —
  Phase 5. Phase 4 ships only a complete generic CAST MEMBER editor and the
  minimal working-set membership toggle.
- **Full active-working-set curation** (cast inclusion bands, `local_function`,
  POV/voice-pressure pins, focus tags, stop guidance, "what will compile"
  preview) — Phase 5.
- **Story Dashboard** (working-set counts by type, blocker/warning counts,
  latest-accepted summary) — deferred; blocker/warning counts require the
  Phase-6 validation engine. May land alongside or after Phase 6.
- **Deterministic validation engine** (contradiction/blocker rules, field-linked
  diagnostics, prompt-preview/send gating) — Phase 6. Phase 4 surfaces
  repository-level structural errors (malformed payload, reference integrity)
  only, not continuity validation.
- **Prompt compiler, placeholder mapping, prompt preview** — Phases 7–8.
- **OpenRouter transport, candidate lifecycle, accepted-segment browser,
  durable-change reminder** — Phases 9–12.
- **Any LLM-assisted surface** (record suggestions, inconsistency hints, handoff
  drafting) — out of v1 Phase 4 entirely (FOUNDATIONS §26).
- **New tables / DDL evolution / migration runner** — none needed; SPEC-003
  tables suffice; no `user_version` bump.

## Risks & Open Questions

- **New UI dependencies must earn their place.** TanStack Table, React Hook
  Form, the Zod resolver, and a router are the first non-trivial web deps. They
  match `UI-WORKFLOWS.md` research sources and the dense-browser / typed-form
  requirements, but the ticket phase should confirm each is actually used and
  pin versions (Zod resolver must support the Zod v4 the core schemas use —
  `z.uuid()` / `z.iso.datetime()` are Zod 4 APIs).
- **Generic editor for deeply nested CAST MEMBER may be unwieldy.** This is
  accepted: Phase 4's contract is *complete*, not *pleasant*, CAST MEMBER
  editing; Phase 5 delivers the custom sectioned editor. The risk is users
  finding it hostile in the interim — documented and time-boxed by the phase
  order.
- **Field-descriptor source (Zod introspection vs. hand-authored manifests).**
  Introspecting Zod v4 schemas keeps a single source of truth but is more
  fragile; hand-authored manifests are explicit but risk drift from the schema.
  Left to the ticket phase within the constraint that descriptors are
  registry-keyed, cover every field, and never yield a raw-JSON fallback. A
  drift guard (test asserting each descriptor's fields match its schema's keys)
  is recommended.
- **Working-set membership persistence shape.** Phase 4 stores only
  `selected_records` via `generation_session`. The implementer must ensure a
  membership write does not require (or fabricate) the rest of the
  generation-time brief, and that Phase 5 can extend the same storage without
  migration. If `setGenerationSession` currently validates against a strict full
  brief schema, a partial/loose membership shape may be needed — reconcile in
  the ticket phase.
- **Decomposition.** The surface is large (≈9 route handlers + a registry-driven
  form engine + dense browser + per-category editor coverage + global-config
  editors). `spec-to-tickets` should batch as: (a) server record CRUD routes +
  tests; (b) server config + working-set routes + tests; (c) core field
  descriptors + helpers + tests; (d) web shell + router + API client; (e) dense
  browser; (f) generic editor engine + reference pickers; (g) CAST MEMBER +
  global-config editors; (h) working-set surface. Each should be a reviewable
  diff.
- **Resolved during brainstorm:** which spec (Phase 4), UI dependency posture
  (TanStack Table + RHF + Zod resolver + router), CAST MEMBER depth (generic now,
  rich in Phase 5), and dashboard scope (deferred).
