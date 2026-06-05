# SPEC-003 — Typed Data Model and Record Identity/Reference Layer

Status: 🟡 DRAFT
Phase: Implementation Order Phase 3
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority doc: `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`
Supporting authorities: `docs/story-record-schema.md`, `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style.

## Brainstorm Context

- **Original request:** Analyze `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  now that SPEC-002 is implemented and archived, determine which spec to create
  next in `specs/`, align it with `docs/FOUNDATIONS.md` (mindful of
  `compiler-contract.md`, `prompt-template.md`, `prompt-template-rationale.md`,
  `story-record-schema.md`, `stress-suite.md`), and have the spec indicate the
  need to update `IMPLEMENTATION-ORDER.md` and other files once its work is done.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phase 1 ✅ (SPEC-001) and
  Phase 2 ✅ (SPEC-002). **Phase 3 — Typed data model and record
  identity/reference layer** is the next link in the strict one-way dependency
  chain (`storage → records → validation → compiler → preview → transport`).
  SPEC-002 explicitly deferred "Runtime record schemas, record identity/reference
  layer, repository interfaces for story records" to Phase 3. The problem space is
  fully constrained by `DATA-MODEL-AND-RECORDS.md` and `story-record-schema.md`,
  so a **single approach** is presented rather than competing alternatives.
- **Reference material:** none externally authored — the repo docs are
  orientation, the request is the spec.
- **Scope decisions made during brainstorm (confirmed by the user):**
  1. **Versioning — forward-only idempotent DDL, migration runner stays
     deferred.** Record tables are ensured with `CREATE TABLE IF NOT EXISTS`
     under the current baseline `user_version`. No released stores exist yet, so
     no data migration is needed; the transactional migration runner deferred by
     SPEC-002 stays deferred.
  2. **Record IDs — UUIDv7.** Time-sortable stable IDs for durable records, per
     `DATA-MODEL-AND-RECORDS.md` "Identity rules." The project-metadata UUID
     (SPEC-002, `randomUUID()`/v4) is unaffected — it is project identity, not a
     sortable record.
  3. **Generation-time brief — schemas + minimal session table only.** Define
     runtime Zod schemas for all eight brief surfaces and a minimal persisted
     generation-session table now (per the Phase-3 gate's "even if not fully used
     yet"); defer the brief *workflow editor* to Phase 5 and
     validation/compilation to Phases 6/7.
- **Final confidence:** ~96%. Which spec is settled by the dependency chain; the
  three scope boundaries above are the only open decisions and are now resolved.

---

## Problem Statement

After SPEC-002 the app can create/open a user-owned project folder with a
canonical `loom.sqlite` store, a readable metadata file, a version-compatibility
gate, an open/close lifecycle, and a backup workflow. But the store today holds
**zero record tables** — `configureDatabase` (`packages/server/src/project-store.ts`)
sets PRAGMAs only. The app has **no concept of a story record**: no runtime
schemas, no stable record identity, no reference projections, no repository for
loading/saving records, and no physically distinct home for accepted segments.

Every later phase depends on these invariants. Phase 4 CRUD editors must not
"invent ad hoc record shapes"; deterministic validation (Phase 6) and the
compiler (Phase 7) must read a canonical, stably-identified, reference-resolvable
snapshot; the accepted-segment archive (Phase 11) needs a durable table that is
**logically excluded from compiler inputs** (FOUNDATIONS §10, §21). Phase 3's job
is to lay that typed substrate — and nothing above it.

This spec introduces **no CRUD UI, no custom editors, no validation engine, no
compiler, no transport, and no LLM surface**. It is a headless data-model layer.
Unlike SPEC-002 (which needed a minimal picker to be usable at all), Phase 3 has
nothing to render until Phase 4 CRUD, so it ships no `@loom/web` surface.

## Approach

Single approach — the problem space is fully constrained by
`DATA-MODEL-AND-RECORDS.md` (Phase 3 authority) and `story-record-schema.md`
(field-level taxonomy). Layering follows the SPEC-001/002 boundary.

### `@loom/core` (pure — no `node:*`, no framework)

The deterministic, I/O-free heart of the data model, unit-testable without a
filesystem (TESTING-STRATEGY: the core is testable without I/O):

- **Common record-metadata schema** (Zod): `id`, `type`, `displayLabel`,
  optional `status`, optional `salience`, optional `urgency`, `createdAt`,
  `updatedAt`, `archived`, optional `userOrder`. The authoritative per-type
  status lives in the typed payload (see **Status-semantics types** below); the
  common `status` is a **nullable denormalized projection** of it (`NULL` for
  status-less types), kept for cheap browser/validation filtering. `salience`
  and `urgency` are likewise optional projections (no type carries both).
- **Per-type payload schemas** (Zod) for every required record type in
  `DATA-MODEL-AND-RECORDS.md` "Required record coverage," matching the field
  names in `story-record-schema.md` so the Phase-7 schema→placeholder mapping is
  clean. Exposed as a **record-type registry** (`recordType → { metadataShape,
  payloadSchema }`) so Phase 4 editors and Phase 6 validation iterate types
  deterministically rather than hardcoding a switch.
  - Durable records: `ENTITY`, `ENTITY STATUS`, `CAST MEMBER`, `FACT`, `BELIEF`,
    `SECRET`, `LOCATION`, `OBJECT`, `VISIBLE AFFORDANCE`, `EVENT`, `INTENTION`,
    `PLAN`, `CLOCK`, `OBLIGATION`, `CONSEQUENCE`, `OPEN THREAD`, `RELATIONSHIP`,
    `EMOTION`.
  - Global story configuration (singletons): `STORY CONTRACT`,
    `UNIVERSAL CONTENT POLICY`, `PROSE MODE`.
  - Generation-time brief surfaces (schemas only this phase): `ACTIVE WORKING
    SET`, `CURRENT AUTHORITATIVE STATE`, `IMMEDIATE HANDOFF`, `MANUAL MOMENT
    DIRECTIVE`, `CURRENT CAST VOICE PRESSURE`, `CAST VOICE OVERRIDES`,
    `GENERATION VALIDATION FOCUS`, `STOP GUIDANCE`.
- **CAST MEMBER** carries the full required-core + optional-extended shape from
  `story-record-schema.md` §5 (identity, voice_anchor, pressure_behavior_core,
  body_presence_core, agency_core; optional world_pressure_core,
  relational_charge, moral_psychological_edge, voice_extended,
  body_and_presence_extended, perception_and_embodiment,
  pressure_behavior_extended, agency_and_planning_extended, sample_utterances —
  i.e. every optional extended field in `story-record-schema.md` §5.2).
  Schemas allow optional extended fields; **no field is silently dropped**
  (FOUNDATIONS §17, §29.3).
- **UUIDv7 generator** (pure): time-sortable IDs via the Web Crypto global
  (`globalThis.crypto.getRandomValues`) and `Date.now()` — both globals, not
  `node:*` imports, so the core purity boundary test stays green. (Fallback: a
  pinned `uuid@^11` dependency, permitted under the boundary — see Risks.)
- **Reference-projection extractors** (pure functions): given a parsed record
  payload, return its outgoing references as `{ refRole, targetId }` tuples
  (e.g. `holder`, `owner`, `carried_by`, `current_location`, `known_by`,
  `secret_holder`, `non_holder_to_protect`, `participant`, `from`, `to`,
  `record_link`). These feed the projection table and deterministic validation.
- **Status-semantics types**: per-type status enums from the schema, carried in
  the typed payload as the authoritative source. The status field name and value
  set vary by type (e.g. FACT is `active` only; BELIEF/RELATIONSHIP allow
  `resolved`/`abandoned`; PLAN uses **`plan_status`** with its own enum;
  OBLIGATION uses `open`/`closed`/`escalated`/…; SECRET uses
  `hidden`/`partially_revealed`/…), and several types carry **no** status at all
  (`ENTITY`, `ENTITY STATUS`, `CAST MEMBER`, and the global-config singletons).
  The repository maps each type's payload status (where one exists) into the
  nullable common `status` projection so Phase 6 can reason about active-truth
  vs. resolved-but-relevant deterministically.

### `@loom/server` (I/O boundary — the only place that imports `node:sqlite`/`node:fs`)

- **Record-table DDL initializer**, a dedicated idempotent `ensureRecordTables`
  step (`CREATE TABLE IF NOT EXISTS`) invoked on **both** lifecycle paths — from
  `createProject` (after `configureDatabase`) and from `openProject` (after
  compatibility validation passes, before the active handle is set). It must not
  be wired solely into `configureDatabase`, which today runs only on create
  (`packages/server/src/project-store.ts`); opening a store that lacks the record
  tables must ensure them too. Hybrid SQLite shape from
  `DATA-MODEL-AND-RECORDS.md` "Recommended storage shape":
  - `records` — common metadata columns (`id` TEXT PK, `type`, `display_label`,
    `status` NULL (denormalized from payload), `salience` NULL, `urgency` NULL,
    `archived` INTEGER, `user_order` INTEGER NULL, `created_at`, `updated_at`) +
    `payload_json` TEXT (canonical JSON validated by Zod on read and write).
  - `record_references` — extracted projection (`from_record_id`, `ref_role`,
    `target_id`), indexed for dense browsing and deterministic validation;
    refreshed transactionally on every save. `target_id` is a **denormalized
    projection, not an enforced SQL foreign key** — targets may be authored
    later, and referential integrity is the app-level archive/delete policy
    below, not a `FOREIGN KEY` constraint (relevant because
    `configureDatabase` sets `PRAGMA foreign_keys = ON`).
  - `story_config` — singleton rows keyed by config kind (STORY CONTRACT /
    CONTENT POLICY / PROSE MODE), one each, Zod-validated JSON.
  - `generation_session` — minimal persisted current generation-time brief state
    (JSON), so the user can return to a working setup; conceptually distinct from
    durable records.
  - `accepted_segments` — append-only ordered text + metadata, **physically and
    logically distinct** from `records`; no compiler-input query references it
    (Phase 11 fills it).
- **Typed `recordRepository`** on the server instance (not a module singleton —
  same rationale as SPEC-002's active-project handle):
  - `createRecord` / `updateRecord` — assign/keep UUIDv7 id, Zod-parse payload
    **before** write (malformed payloads are rejected, never persisted —
    FOUNDATIONS §29.4 "no arbitrary unvalidated blobs"), recompute reference
    projections **and the denormalized metadata columns** (`status`, `salience`,
    `urgency`) from the parsed payload in the same transaction.
  - `getRecord` / `listRecords` — Zod-parse on read; a payload that fails to
    parse surfaces a structured "malformed record" diagnostic rather than
    crashing or silently coercing.
  - `archiveRecord` / `deleteRecord` — **reference-integrity protected**: if
    other active (non-archived) records reference the target, deletion is blocked
    or converted to archive; **no silent dangling references**
    (`DATA-MODEL-AND-RECORDS.md` "Identity rules," Failure mode "dangling
    references after deletion").
  - `getStoryConfig` / `setStoryConfig`, `getGenerationSession` /
    `setGenerationSession` — singleton upserts.
  - `listAcceptedSegments` / `appendAcceptedSegment` — minimal, ordered;
    **not** exposed to any compiler-input path.
- Reuses SPEC-001/002 logging redaction; record payloads, prose, and brief text
  are **not logged** (`DATA-MODEL-AND-RECORDS.md` Security/privacy). No API keys
  or prompt text can enter these tables (closed schemas; no such fields exist).

### `@loom/web`

No change. Phase 3 ships no UI; the project picker from SPEC-002 is untouched.
(Whether a thin debug/list route is exposed is a deferred decision — see Out of
Scope; the default is no new API routes this phase, keeping the surface headless
until Phase 4 needs CRUD endpoints.)

## Deliverables

1. **`@loom/core` data-model module(s) (pure).**
   - Common record-metadata Zod schema + per-type payload schemas for all record
     types, global story-config singletons, and the eight generation-time brief
     surfaces, matching `story-record-schema.md` field names.
   - The record-type **registry** mapping each type to its schema + status enum.
   - Pure **UUIDv7 generator** (Web Crypto global; no `node:*` import).
   - Pure **reference-projection extractors** returning `{ refRole, targetId }`
     tuples per record type.
   - New exports added to `packages/core/src/index.ts`.
   - Unit tests: accept/reject per record type (including a rejected payload
     carrying a forbidden API-key-shaped field), UUIDv7 monotonic-sortability and
     format, reference-extractor coverage for every reference-bearing type.

2. **`@loom/server` record schema + repository.**
   - DDL initializer (`ensureRecordTables`) creating `records`,
     `record_references`, `story_config`, `generation_session`,
     `accepted_segments` idempotently under the current baseline `user_version`
     (no version bump, no migration runner), invoked on **both** the create and
     open paths (not solely from create-only `configureDatabase`).
   - `recordRepository` with create/update/get/list, reference-projection refresh
     on save, reference-integrity-protected archive/delete, story-config and
     generation-session singleton accessors, and minimal accepted-segment
     append/list.
   - Held as server-instance state; `ensureRecordTables` integrated into both
     the create and open lifecycle so tables exist for any opened project,
     including a store created before the tables existed.

3. **Tests (Vitest).**
   - Core unit tests (deliverable 1).
   - Server integration tests against a temp project: create→save→load
     round-trip for representative record types (atomic + CAST MEMBER rich
     dossier), malformed-payload rejection on write and on read, reference
     projection populated/refreshed on save, reference-integrity protection
     (deleting a referenced ENTITY is blocked or archived — no dangling
     reference), story-config and generation-session singleton round-trips, a
     test that opening a project whose store lacks the record tables ensures
     them (open-path `ensureRecordTables`), and a test asserting
     `accepted_segments` is reachable **only** through the accepted-segment API —
     no record or reference query reads it (the repository-API boundary this
     phase can assert; it establishes the no-compiler-input invariant Phase 7
     inherits).
   - Core boundary test stays green (no `node:*`/framework imports added to core).

4. **Requirements-/governing-doc updates on completion** (performed by the
   implementer when Verification passes, not as a precondition):
   - `IMPLEMENTATION-ORDER.md` Phase 3: add `Status: ✅ Implemented via SPEC-003
     (YYYY-MM-DD).` and mark the Phase-3 phase-gate bullets satisfied. Do not
     alter ordering rationale or later phases.
   - `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`: add a short note
     that the Phase-3 subset (runtime schemas, stable UUIDv7 identity, reference
     projections, repository, physically distinct accepted-segment/session
     tables) is realized in code via SPEC-003, leaving CRUD UI (Phase 4), custom
     editors (Phase 5), validation (Phase 6), and compilation (Phase 7) open.
   - **No `compiler-contract.md` / `prompt-template.md` change is required this
     phase** — Phase 3 introduces no prompt placeholders. The schema field names
     are kept aligned with `story-record-schema.md` precisely so the Phase-7
     schema→placeholder mapping (which *will* update `compiler-contract.md` in the
     same change, per FOUNDATIONS §8) is mechanical. If during implementation a
     schema field is found to diverge from `story-record-schema.md`, reconcile the
     schema doc in the same change rather than forking a new field name.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §13 Records & current continuity (atomic + CAST MEMBER exception) | aligns | Atomic per-type schemas + a rich CAST MEMBER dossier schema; field-economy taxonomy mirrored from `story-record-schema.md` @ domain core. |
| §29.4 Prompt-compilation hard fails ("arbitrary unvalidated blobs") | aligns | Every payload is Zod-parsed on read and write; malformed payloads are rejected, never persisted @ repository. |
| §29.3 Active-working-set hard fails ("silently compress active cast") | aligns | CAST MEMBER schema allows all populated core+extended fields with no drop; compression is not a data-model behavior @ schema. |
| §10 / §21 / §29.8 No accepted prose in prompts; archive separated | aligns | `accepted_segments` is a physically distinct, append-only table with no compiler-input query path @ storage. |
| §24 / §29.10 Local-first, user-owned, inspectable | aligns | Hybrid SQLite with canonical JSON payloads inspectable by ordinary tools; no remote authority, no opaque silo @ storage. |
| §23 / §29.9 Secrets boundary | aligns | Closed schemas define no API-key/prompt field; record payloads and brief text are not logged @ repository/logging. |
| §4.5 / §11 Fail closed (foundation for Phase 6) | aligns | Reference projections + status enums give Phase 6 the deterministic, traversable substrate to block on contradictions; this phase adds no override @ domain core. |

No §29 hard-fail is answered "yes": no autonomous generation, no branches/plot
rails, no accepted-prose-as-canon, no LLM record mutation, no nondeterminism, no
silent active-cast compression, no remote sole-source-of-truth, no secret/key
leakage, no validation override.

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test passes — new core data-model code imports no `node:*` and no
  framework (UUIDv7 uses the Web Crypto global, not `node:crypto`).
- Server integration tests: record round-trips for atomic + CAST MEMBER types;
  malformed-payload rejection on write and read; reference projection (and the
  `status`/`salience`/`urgency` metadata columns) populated/refreshed on save;
  reference-integrity protection prevents dangling references; opening a store
  that lacks the record tables ensures them via the open-path
  `ensureRecordTables`; singleton config/session round-trips; `accepted_segments`
  is read only by the accepted-segment API and by no record or reference query.
- Inspect a created project's `loom.sqlite` with ordinary SQLite tooling and
  confirm the expected tables exist, payloads are readable JSON, and
  `application_id`/`user_version` are unchanged from the SPEC-002 baseline.

## Out of Scope

- **CRUD UI, dense record browser, working-set toggles** — Phase 4.
- **Custom CAST MEMBER and generation-time brief editors / workflow** — Phase 5
  (Phase 3 defines the brief *schemas* + a minimal session table only).
- **Deterministic validation engine** (contradiction/blocker rules over records
  and references) — Phase 6. Phase 3 supplies the traversable substrate, not the
  rules.
- **Prompt compiler, placeholder mapping, `compiler-contract.md` updates,
  POV/AUDIENCE KNOWLEDGE PROFILE compilation** — Phase 7. (POV/AUDIENCE profiles
  are *compiled* generation-time projections, not durable records; Phase 3 stores
  their record sources — FACT/BELIEF/SECRET/PROSE MODE — not the compiled
  profile.)
- **New record/CRUD API routes** — Phase 4. Phase 3 wires the repository into the
  project lifecycle but exposes no new HTTP surface by default.
- **Migration runner / DDL evolution beyond first-create** — still deferred
  (SPEC-002); forward-only `CREATE TABLE IF NOT EXISTS` under the baseline
  version, no `user_version` bump.
- **Accepted-segment lifecycle, candidate session, OpenRouter transport** —
  Phases 9–11; Phase 3 only creates the distinct, mostly-empty tables.

## Risks & Open Questions

- **Schema surface is large (18 durable record types + 3 global-config
  singletons + 8 generation-time brief surfaces = 29 schema surfaces).** The
  decomposition into tickets (`spec-to-tickets`) should batch by category (global
  config; entity/cast; knowledge/concealment; space/material; causal pressure;
  relationship/emotion; generation-time brief; repository + DDL; accepted-segment
  /session skeletons) so each ticket is a reviewable diff. The registry pattern
  keeps additions mechanical.
- **UUIDv7 generation in pure core.** The recommended path is an in-core
  generator using the Web Crypto global + `Date.now()` (no new dependency, no
  `node:*` import). If implementation finds the global awkward to test
  deterministically, the documented fallback is a pinned `uuid@^11` dependency
  (permitted under the boundary, which restricts only `fastify`/`react`/`vite`/
  `node:*`). Either keeps IDs time-sortable and the boundary test green.
- **Singleton vs. record modeling for global story config.** STORY CONTRACT /
  CONTENT POLICY / PROSE MODE are modeled as `story_config` singletons rather than
  rows in `records`, because they are one-per-project and "always available to
  generation." If a later phase needs them in the unified record browser, a view
  over both tables is cheaper than reshaping storage now.
- **`node:sqlite` experimental warning** (carried from SPEC-002) and the
  `better-sqlite3` fallback behind the same repository seam remain the documented
  contingencies; the new repository lives behind that seam.
- **Reference-integrity policy choice** (block delete vs. force archive vs.
  require manual cleanup) is left to the implementer within the constraint that
  silent dangling references are forbidden; the test asserts the invariant, not a
  specific UX.
- **Resolved during brainstorm:** which spec (Phase 3), versioning (forward-only
  DDL, runner deferred), record ID format (UUIDv7), and brief depth (schemas +
  minimal session table).
