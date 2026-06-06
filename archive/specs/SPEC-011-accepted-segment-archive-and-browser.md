# SPEC-011 — Accepted Segment Archive and Browser

Status: COMPLETED
Phase: Implementation Order Phase 11
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED), SPEC-007 (Deterministic Prompt Compiler, COMPLETED), SPEC-008 (Prompt Preview Gated by Validation, COMPLETED), SPEC-009 (OpenRouter Global Settings and Non-Streaming Send, COMPLETED), SPEC-010 (Candidate Editor and Regenerate/Discard/Accept Lifecycle, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (the Phase 10–12 authority — §"Accepted segment archive", §"Deletion and export", §"Accepted prose is not prompt context"), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 11 gate)
Supporting authorities: `docs/requirements-version-1/UI-WORKFLOWS.md` (§"Accepted segment browser", §"Story dashboard" latest-segment surfacing, navigation model), `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` (export/portability), `docs/FOUNDATIONS.md` §6.5 / §21 (accepted segment archive, browsing, metadata), §10 / §28.1 (no accepted prose in prompts), §25–26 (local-first ownership, easy export/backup), §27 (five distinct continuity surfaces), §29.8 / §29.9 / §29.10 hard-fail checklists

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-010 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and supporting
  `docs/requirements-version-1/*`) to determine the next spec for `specs/`, in full
  alignment with `docs/FOUNDATIONS.md`, relying on `docs/compiler-contract.md`,
  `docs/prompt-template.md`, `docs/story-record-schema.md`, and `docs/stress-suite.md`.
  Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–10 ✅ (SPEC-001…010).
  **Phase 11 — Accepted segment archive and browser** is the next link in the one-way
  chain `storage → records → validation → compiler → preview → transport → candidate →
  **accepted archive** → manual-update reminder`. It sits *after* Phase 10 (✅ SPEC-010,
  which wired the acceptance **write** — `POST /api/accepted-segments` — and left a
  **disabled** `"Accepted Segments"` nav placeholder) and *before* Phase 12's
  durable-change **reminder** ("the reminder should appear only after a real accepted
  segment exists … reminder references a real acceptance event"). The ordering doc is
  explicit: "accepted segments are created by explicit acceptance" (so the write precedes
  the browser) and "reminder references a real acceptance event" (so the browser precedes
  the reminder).
- **Reference material:** none externally authored — the repo docs are orientation; the
  request is the spec. `compiler-contract.md` / `prompt-template.md` / `stress-suite.md`
  were consulted and constrain this spec **by exclusion**: the accepted archive is strictly
  *downstream* of compilation and is **never** a compiler input — the browser neither reads
  nor reshapes records, and accepted prose must never re-enter the prompt path
  (`story-record-schema.md` §3.3, FOUNDATIONS §10 / §28.1). `story-record-schema.md` bears
  only on the metadata shape already persisted in SPEC-010 (FOUNDATIONS §21 list); this spec
  reads that metadata back, it does not change it. The phase's binding authority is
  `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` + `UI-WORKFLOWS.md`; `DATA-MODEL-AND-RECORDS.md`,
  `PROMPT-COMPILER.md`, and `VALIDATION-ENGINE.md` are *not* engaged (no schema change, no
  compiler change, no validation change).
- **Verified against code (the archive substrate already exists from SPEC-010):**
  - The **`accepted_segments` table already exists** (`packages/server/src/record-tables.ts`:
    `id INTEGER PK AUTOINCREMENT`, `sequence INTEGER NOT NULL UNIQUE`, `text`, `metadata_json`,
    `created_at`).
  - `RecordRepository.appendAcceptedSegment({ text, metadata? }): AcceptedSegment`
    (`record-repository.ts:341`) and `listAcceptedSegments(): AcceptedSegment[]`
    (`record-repository.ts:357`, `ORDER BY sequence`) are **already implemented**;
    `AcceptedSegment` (`{ id, sequence, text, metadata, createdAt }`) is exported at
    `record-repository.ts:41`. **No `deleteAcceptedSegment` method exists yet.**
  - `packages/server/src/accepted-routes.ts` registers **only** `POST /api/accepted-segments`
    (the SPEC-010 write); **no GET, no DELETE.** It is registered in `createServer()` via
    `registerAcceptedRoutes(app, projectStoreManager)` (`server.ts`), reusing the
    `no-open-project` error path.
  - `packages/web/src/api.ts` exports `acceptCandidate()`, the `GenerationMetadata` and
    `AcceptedSegmentRef` types, and the shared `ApiFailure` shape (incl. `no-open-project`).
    **No list/delete client exists.**
  - `packages/web/src/shell/AppShell.tsx` keeps `"Accepted Segments"` in the disabled
    `laterPhaseSurfaces` array (rendered as a `<button disabled>`); `Generate / Candidate`
    is the live precedent for promoting a placeholder to a real `primaryRoutes` entry + route.
    **No `AcceptedSegments` view component exists.**
  - `server.ts` `redact.paths` already covers `acceptedProse` and `body`.
- **Scope decisions (single fully-constrained approach; two source-optional edges confirmed
  in brainstorm):**
  - **Minimal export = in scope.** Phase 11 explicitly scopes "simple export if included" and
    `CANDIDATES` says "Plain text or Markdown export is sufficient." The browser offers an
    explicit **export-all** action producing Markdown (and plain-text) via a client-side
    download — no server-side export archive, no prompt-context path. Exported prose is **not**
    canonical continuity and **never** becomes a compiler input (FOUNDATIONS §25, §10).
  - **Simple text filter = in scope.** UI-WORKFLOWS scopes "search/filter by text and metadata
    if simple." Implemented as a **client-side substring filter** over the already-fetched
    segment list (text + visible metadata) — no server query, no index.
- **Assumptions carried (detail-level, doc-settled, correct if not flagged):**
  - **Deletion leaves a `sequence` gap; sequences are never renumbered.** `sequence` is
    `UNIQUE NOT NULL`; deleting a segment removes its row and leaves a gap. Ordering stays
    `sequence ASC` and remaining segments keep their original `sequence`. Renumbering would
    "rewrite meaning" (`CANDIDATES` §"Data/logic implications": "preserve remaining order or
    clearly re-index display order without rewriting meaning"); the browser may show a derived
    1-based **display index** for readability while the stored `sequence` is immutable.
  - **`DELETE /api/accepted-segments/:id`** (the delete half of the Phase-11 resource) →
    new `deleteAcceptedSegment(id): boolean` repo method (single-row delete, no record
    mutation, no branch/rollback, no re-sequence). Confirmation lives in the UI.
  - **`GET /api/accepted-segments`** returns `listAcceptedSegments()` verbatim
    (`[{ id, sequence, text, metadata, createdAt }]`).
  - **No persistent durable-change reminder** — Phase 12. SPEC-010's minimal ephemeral
    post-accept notice already exists on `/generate`; this spec adds none.
  - **The dashboard latest-segment surfacing** (UI-WORKFLOWS §"Story dashboard": "latest
    accepted segment index/timestamp") is **deferred** unless trivially derivable here; the
    primary Phase-11 deliverable is the browser. (Carried as an explicit Out-of-Scope edge so
    decomposition does not silently absorb it.)
  - **`@loom/core` untouched** — the archive is server I/O + read-only web UI over already-
    stored output; the purity boundary (`packages/core/test/boundary.test.ts`) stays green.
- **Final confidence:** ~94%. Which spec is settled by the dependency chain; the feature set
  (ordered browser, readable text, metadata panel, simple text filter, delete-with-confirmation,
  minimal Markdown/plain-text export, **no** prompt-context affordance, accepted text excluded
  from compiler inputs) is settled by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` +
  `UI-WORKFLOWS.md` + the Phase-11 gate + FOUNDATIONS §6.5/§21. The two source-optional edges
  (export, filter) were confirmed in brainstorm. Endpoint/route naming, delete-confirmation
  ergonomics, and export copy are detail-level and left to the implementer within the stated
  constraints.

---

## Problem Statement

After SPEC-010 the app can **write** an accepted segment — `POST /api/accepted-segments`
appends one row to the `accepted_segments` table through `appendAcceptedSegment()`, storing
the edited accepted text plus the key-free generation-metadata snapshot. But the archive is
**write-only**: there is **no way to read it back**. `listAcceptedSegments()` exists in
`record-repository.ts` but has **no route and no client**; there is **no delete path** at all
(`deleteAcceptedSegment` does not exist); and the `"Accepted Segments"` nav surface is a
**disabled placeholder**. A user who accepts prose cannot review it, cannot read prior
segments in order, cannot remove a mistaken acceptance, and cannot export their prose for
reading outside the app.

`IMPLEMENTATION-ORDER.md` Phase 11 is the next link in the one-way chain and is explicitly
gated *after* the acceptance write ("accepted segments are created by explicit acceptance")
and *before* the durable-change **reminder** (Phase 12: "reminder references a real acceptance
event"). Building the reminder before a browsable archive exists, or letting the browser feed
accepted prose back into prompts, or letting deletion rewrite records, would violate the
ordering doctrine and FOUNDATIONS.

`docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` is the Phase-11 authority.
It fixes accepted segments as **ordered, append-only readable story output** (append-only
"except deletion/export"); browsable individually and in order; deletable **with confirmation**
(removing "a readable output segment", **not** rewriting records and **not** creating a
branch); exportable for **reading/output** (plain text or Markdown is sufficient; exported
prose "must not become a compiler input through the app"). Accepted segment text is
**physically/logically excluded from compiler inputs** — "compiler queries must not read
accepted segment text" and "the UI must not offer a 'include last segment in prompt' action."

`FOUNDATIONS.md` reinforces this: §6.5 / §21 define the ordered readable archive, its metadata,
and "the app should allow the user to see accepted segments individually and in order" (and
§29.8 hard-fails *hiding* segments from review); §10 / §28.1 forbid accepted prose in generated
prompts; §25–26 require local-first ownership with easy export/backup and forbid making export
unreasonably difficult (§29.10); §27 requires the five continuity surfaces stay distinct — the
browser "should not resemble a record editor … an archive of cloth, not the loom."

**The archive is written but unreadable; there is no browse, delete, or export path.** Phase
11's job is to add a `GET` list route, a `DELETE` route + a single-row repository delete, and a
prose-forward read-only browser (ordered list, readable text, metadata panel, simple text
filter, delete-with-confirmation, minimal Markdown/plain-text export) — entirely in
`@loom/server` and `@loom/web`, with `@loom/core` untouched — without ever offering accepted
text as prompt context, without mutating any record on delete, without renumbering sequences,
and without adding a persistent reminder (Phase 12).

## Approach

Single approach — fully constrained by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`, the Phase-11
gate, `UI-WORKFLOWS.md` §"Accepted segment browser", and `FOUNDATIONS.md`
§6.5/§21/§10/§25/§27, layered on the SPEC-001…010 boundary and the **already-present**
`accepted_segments` table + `appendAcceptedSegment`/`listAcceptedSegments`. Two source-optional
edges were confirmed in brainstorm: **include minimal export** and **include a simple
client-side text filter**.

### `@loom/core` — untouched

No new core module, type, or export. The archive is platform I/O and read-only UI over
**already-stored** output; placing any of it in core would breach the enforced purity boundary.
The web continues to import shared types from `@loom/core` only where it already does.

### `@loom/server` — list route, delete route + repository delete

- **`GET /api/accepted-segments`** (in the existing `accepted-routes.ts`): resolves the open
  project's `RecordRepository` (reusing the `no-open-project` error path), returns
  `{ ok: true, segments: listAcceptedSegments() }` where each segment is
  `{ id, sequence, text, metadata, createdAt }` ordered by `sequence ASC`. Read-only; runs no
  validation/compilation; touches no record table.
- **`DELETE /api/accepted-segments/:id`** (same file): validates `:id` as a positive integer;
  resolves the repository; calls a **new** `RecordRepository.deleteAcceptedSegment(id): boolean`
  (single-row `DELETE FROM accepted_segments WHERE id = ?`; returns whether a row was removed;
  **no** re-sequence, **no** record-table write, **no** branch/rollback). Returns
  `{ ok: true, deleted: { id } }` on success and a structured `not-found` failure when no row
  matched. Deletion leaves a `sequence` gap by design; `listAcceptedSegments` ordering is
  unaffected.
- **Registration.** Both routes register inside the existing `registerAcceptedRoutes`
  (already wired in `createServer()`); no new registration call.
- **Logging.** The GET list response carries accepted prose (under the `segments[].text` field);
  the DELETE response carries none. The operative protection is **not** the `acceptedProse`/`body`
  redaction path — pino redaction by path matches a key literally named `acceptedProse` and will
  **not** mask a key named `text` (or the enclosing `segments`). Protection comes from two facts:
  (1) Fastify does not serialize request/response bodies into logs by default, so the response
  `text` is never logged unless a route explicitly logs it; and (2) the routes must log only
  `id`/`sequence`/`createdAt`/model id, **never** `text`. The existing `redact.paths`
  (`acceptedProse`, `body`) remain as defense-in-depth (they fire only if some path logs those
  specific keys), but the operative guard is the discipline above plus the logging test: a test
  asserts a seeded accepted-prose string never appears in captured stdout/stderr for list or delete.

### `@loom/web` — promote the `Accepted Segments` surface

- **New primary route + nav.** Promote `"Accepted Segments"` from the disabled
  `laterPhaseSurfaces` array in `AppShell.tsx` to a real `primaryRoutes` entry (e.g.
  `/accepted-segments`) with an enabled `NavLink` and a `<Route>` to a new
  `AcceptedSegmentsView`, mirroring the `Generate / Candidate` precedent. No placeholder
  remains disabled after this (Phase 12's reminder is not a nav surface).
- **`api.ts` clients.** Add `listAcceptedSegments(): Promise<ListAcceptedSegmentsResponse>`
  over `GET /api/accepted-segments` (success `{ ok: true, segments: AcceptedSegment[] }`;
  failure the shared `ApiFailure` incl. `no-open-project`) and
  `deleteAcceptedSegment(id: number): Promise<DeleteAcceptedSegmentResponse>` over
  `DELETE /api/accepted-segments/:id` (success `{ ok: true, deleted: { id } }`; failure incl.
  `no-open-project` / `not-found`). Reuse the existing `AcceptedSegmentRef`/metadata types;
  extend with a web `AcceptedSegment` view type carrying `text` + `metadata` for the list.
- **`AcceptedSegmentsView` — prose-forward, read-only browser** (`UI-WORKFLOWS.md`
  §"Accepted segment browser"):
  - **ordered list** of segments by `sequence ASC`, each showing a derived 1-based display
    index, the readable **text**, and accepted timestamp;
  - **readable text display** — spacious, prose-forward typography (not a dense record card);
  - **metadata panel** per segment — model, provider, temperature, max output tokens, optional
    top-p, and the template/compiler/contract version triple, read from `metadata`;
  - **simple text filter** — a client-side substring filter over text + visible metadata of the
    already-fetched list; no server round-trip;
  - **delete with confirmation** — a confirm step (e.g. a confirm dialog / two-step button)
    before calling `deleteAcceptedSegment(id)`; on success the segment is removed from the list;
    copy makes clear deletion removes readable output only and does **not** repair records
    (the user repairs continuity manually if a discrepancy results);
  - **export** — an explicit **export-all** action that serializes the **complete archive in
    `sequence ASC` order, independent of the active text filter** (export-all exports every
    accepted segment, not the filtered view), to **Markdown** (and a plain-text variant) and
    triggers a client-side download; no server export archive; exported text is labeled reading
    output, not canon, and is never offered as prompt context;
  - **empty state** — a clear "no accepted segments yet" message;
  - **no "use as prompt context" / "include last segment in prompt" action anywhere**
    (FOUNDATIONS §10 / §28.1), and the view never feeds text into `/generate` or the brief.
- **No canon masquerade.** The browser is visibly an **archive of cloth** — read-only, distinct
  from the record editor and the candidate editor; it shows only key-free payloads.

## Deliverables

1. **List route (server).**
   - `accepted-routes.ts`: `GET /api/accepted-segments` → `{ ok: true, segments: [...] }` over
     `listAcceptedSegments()`, reusing `no-open-project`; read-only, no validation/compilation,
     no record-table read.
   - Tests (`fastify.inject`): returns segments in `sequence ASC` order with `text` + full
     `metadata`; empty archive → `{ ok: true, segments: [] }`; no-open-project → structured
     error; response carries no API key and no full prompt; logs contain no accepted prose.

2. **Delete route + repository delete (server).**
   - `record-repository.ts`: new `deleteAcceptedSegment(id: number): boolean` — single-row
     delete, returns whether a row was removed; **no** re-sequence, **no** record write.
   - `accepted-routes.ts`: `DELETE /api/accepted-segments/:id` — positive-integer `:id`
     validation → `deleteAcceptedSegment(id)` → `{ ok: true, deleted: { id } }`; unmatched id →
     structured `not-found`; reuses `no-open-project`.
   - Tests: deleting an existing segment removes exactly that row and **no** other table is
     written; remaining segments keep their original `sequence` (gap left, **not** renumbered)
     and `listAcceptedSegments` still returns them in order; deleting a missing id → `not-found`
     and no write; a non-integer/negative `:id` → validation error and no write; no record table
     is mutated in any branch.

3. **Logging redaction confirmation (server).**
   - Keep accepted prose out of logs: routes log only `id`/`sequence`/`createdAt`/model id, never
     `text` (Fastify does not log bodies by default; the `acceptedProse`/`body` redaction is
     defense-in-depth that does **not** match a `text`/`segments` key). The operative guard is a
     logging test asserting a seeded accepted-prose string never appears in captured
     stdout/stderr across `GET` and `DELETE`.

4. **Web API clients (web).**
   - `api.ts`: `listAcceptedSegments()` and `deleteAcceptedSegment(id)` returning discriminated
     success/failure unions over the shared `ApiFailure`; a web `AcceptedSegment` view type
     (`{ id, sequence, text, metadata, createdAt }`). Client tests for success and failure
     (incl. `no-open-project` and `not-found`).

5. **`Accepted Segments` route + nav promotion (web).**
   - `AppShell.tsx`: `"Accepted Segments"` promoted from `laterPhaseSurfaces` to a real enabled
     `primaryRoutes` entry + `NavLink` + `<Route>` to `AcceptedSegmentsView`. Tests: nav exposes
     an enabled `Accepted Segments` link and the route renders; no disabled placeholder remains.

6. **Accepted segment browser UI (web).**
   - `AcceptedSegmentsView`: ordered prose-forward list, readable text, per-segment metadata
     panel, client-side text filter, delete-with-confirmation, export-all (Markdown +
     plain-text download), empty state. Read-only — not a record editor.
   - Component tests: list renders segments in order with text + metadata; the filter narrows
     the visible list by substring and clearing it restores the full list; delete requires
     confirmation, then removes the segment from the list on success and surfaces failures
     (`not-found`/`no-open-project`) without removing it; export-all produces Markdown/plain-text
     containing **every** segment's text in `sequence ASC` order even when a text filter is active
     (download invoked); **no** "use as prompt context" /
     "include in prompt" control exists anywhere (asserted); **no** persistent durable-change
     banner/checklist appears (Phase 12); the view never writes accepted text to the brief or
     `/generate`.

7. **Styling.**
   - Minimal `packages/web/src/styles.css` additions for the prose-forward browser, metadata
     panel, filter input, confirm-delete affordance, and export button, consistent with existing
     surfaces; no new CSS framework.

8. **Governing-doc updates on completion** (performed by the implementer when Verification
   passes, not a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 11: add
     `Status: ✅ Implemented via SPEC-011 (YYYY-MM-DD).` and check the Phase-11 gate bullets,
     noting the **persistent** durable-change reminder remains Phase 12 and the dashboard
     latest-segment surfacing (if not delivered) remains later-phase.
   - `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`: add a short "Phase 11
     implementation note" recording the realized browser (list `GET`, delete `DELETE` with
     confirmation leaving sequence gaps un-renumbered, Markdown/plain-text export, simple text
     filter, no prompt-context affordance, reminder deferred to Phase 12).
   - Archive SPEC-011 to `archive/specs/` per `docs/archival-workflow.md` once complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §6.5 / §21 / §29.8 #4 Ordered readable archive; user can see segments individually and in order; do not hide segments from review | aligns | `GET /api/accepted-segments` + the prose-forward browser render every segment in `sequence ASC` with readable text and a metadata panel; the previously-disabled nav surface becomes a real route @ list route + browser. |
| §21 "the accepted text is the accepted text" (no edited flag); discarded/regenerated not stored | aligns | The browser reads back exactly what SPEC-010 stored — no edited flag is shown or required; nothing in this spec persists discarded/superseded candidates @ browser (read-only). |
| §10 / §28.1 / §29.4 No accepted prose in generated prompts | aligns | The browser offers **no** "use as prompt context"/"include last segment" action; accepted text is never written to the brief or `/generate`; the compiler input path is untouched (`story-record-schema.md` §3.3) @ browser + (unchanged) compiler. |
| §25 / §26 / §29.10 Local-first ownership; easy export/backup; export not unreasonably difficult | aligns | Explicit client-side **export-all** to Markdown/plain-text gives the user their prose without lock-in; exported prose is reading output, not canon, and never a compiler input @ browser export. |
| §4.1 / §13 Records changed only by the user; §12 / §4.2 / §29.1 Deletion does not rewrite records or create a branch | aligns | `DELETE` removes one readable output row only — **no record mutation** (§4.1/§13), **no re-sequence, no rollback/branch** (§12/§4.2/§29.1); a left `sequence` gap is intentional and the user repairs continuity manually @ delete route + repo `deleteAcceptedSegment`. |
| §27 Five continuity surfaces stay distinct ("archive of cloth, not the loom") | aligns | The browser is visibly read-only and prose-forward, structurally distinct from the record editor and candidate editor; it never masquerades as canonical record state @ browser. |
| §23 / §29.9 Secrets never in archive/logs/UI | aligns | List/delete payloads and stored metadata carry no key; redaction suppresses accepted prose from logs; export emits prose only, no secrets @ list/delete routes + logging + export. |

§29 hard-fail clearance: no hard-fail is answered "yes." The archive is **not** hidden from
review — it becomes browsable for the first time (§29.8 #4); accepted segments are **not** used
as prompt context and carry **no** edited flag (§29.8 #2/#3, §29.4); deletion rewrites **no**
records and creates **no** branch (§29.1); export is **easy**, not unreasonably difficult, and
keeps data locally owned (§29.10); no key/prompt/candidate reaches logs, payloads, or exports
(§29.9). The §29.8 #5 "remind the user to update records after accepted durable changes"
clause is satisfied for now by SPEC-010's minimal ephemeral post-accept notice; the **persistent**
reminder is sequenced to Phase 12 by `IMPLEMENTATION-ORDER.md` (itself FOUNDATIONS-aligned) and
is **out of scope** here — this spec neither regresses that notice nor pre-builds Phase 12.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green (lint includes the
  `@loom/core` import-boundary rule; this spec leaves core untouched, so the boundary test stays
  green).
- **Ordered read-back**: `GET /api/accepted-segments` returns all segments in `sequence ASC`
  with `text` + full `metadata`; an empty archive returns `{ ok: true, segments: [] }`.
- **Delete is single-row, non-destructive to records**: deleting a segment removes exactly that
  row; remaining segments keep their original `sequence` (gap left, **not** renumbered) and
  still list in order; **no** record table is written in any branch; deleting a missing id →
  `not-found` with no write; a bad `:id` → validation error with no write.
- **No accepted prose in compilation / no prompt-context affordance**: the compiler/snapshot
  path is unchanged; the browser exposes **no** "use as prompt context"/"include in prompt"
  control; accepted text is never written to the brief or `/generate`.
- **Export**: export-all produces Markdown (and plain-text) containing the full archive's segment
  text in `sequence ASC` order regardless of the active filter, via a
  client-side download; no server export archive is created; exported prose is labeled reading
  output, not canon.
- **Filter**: the client-side text filter narrows the visible list by substring and restores the
  full list when cleared; no server round-trip occurs on filter.
- **Secrets/logging**: no key appears in list/delete responses, stored metadata, or exports; a
  logger-on test asserts a seeded accepted-prose string is absent from captured stdout/stderr for
  `GET` and `DELETE`.
- **Surface separation**: `Accepted Segments` is an enabled primary route; no disabled
  placeholder remains; the browser is read-only and structurally distinct from the record and
  candidate editors; **no** persistent durable-change banner/checklist appears (Phase 12).
- **Manual smoke**: `npm start`; open a project, accept one or more segments via
  **Generate / Candidate**, then open **Accepted Segments**; confirm segments read in order with
  metadata; filter by a substring; delete a segment with confirmation and confirm it disappears
  while the others keep order; export-all and confirm the downloaded Markdown/plain-text holds
  the prose; confirm there is no "use in prompt" control anywhere and that the browser
  console/network logs contain no key and no full prompt.

## Out of Scope

- **Persistent durable-change reminder** (banner/checklist, acknowledge/snooze state, record
  quick-links, dashboard "unacknowledged" surfacing) — Phase 12 (`UI-WORKFLOWS.md`
  §"Durable-change reminder"). This spec adds none and does not regress SPEC-010's minimal
  ephemeral post-accept notice.
- **Dashboard latest-accepted-segment index/timestamp surfacing** (`UI-WORKFLOWS.md`
  §"Story dashboard") — deferred to the dashboard/polish phase unless the implementer finds it
  trivially derivable; it is **not** a Phase-11 gate requirement and must not balloon this spec.
- **Sophisticated publishing/export pipeline** — chapter assembly, manuscript formatting,
  per-segment selection export, EPUB/DOCX, version control, diffing — out
  (`CANDIDATES` "V1 does not need a sophisticated publishing/export pipeline"). Phase 11 ships
  plain-text/Markdown export-all only.
- **Sequence renumbering / re-indexing of stored sequences on delete** — forbidden here
  (rewriting meaning); deletion leaves a gap and the stored `sequence` is immutable. A derived
  display index is presentation only.
- **Any prose-to-canon extraction / LLM parsing of accepted prose / record auto-creation** —
  forbidden (FOUNDATIONS §20 / §29.2).
- **Editing accepted segment text in place** — accepted text is fixed output ("the accepted text
  is the accepted text"); the browser is read-only. Re-generation is a fresh candidate, not an
  edit of an archived segment.
- **Any "include last segment in prompt" / accepted-prose-as-context affordance** — forbidden
  (FOUNDATIONS §10 / §28.1 / §29.4).
- **Any `@loom/core` change / schema change / new SQLite table / `user_version` bump** — the
  `accepted_segments` table already exists; only a read route, a delete route + single-row delete
  method, and read-only UI are added; the purity boundary is preserved.

## Risks & Open Questions

- **Delete leaves `sequence` gaps.** Chosen over renumbering to avoid "rewriting meaning"
  (`CANDIDATES` §"Data/logic implications"). The browser shows a derived 1-based display index
  for readability; the stored `sequence` is immutable. If a future spec needs gapless ordering
  for export pagination, it can introduce a derived order without touching stored sequences.
- **Delete route shape (`DELETE /api/accepted-segments/:id`).** Chosen as the delete half of the
  Phase-11 resource so the route family is cohesive (`POST` write from SPEC-010, `GET` list,
  `DELETE` remove). An action-named alternative would work equally; the contract (single-row
  delete, no record mutation, no re-sequence) is fixed.
- **Accepted prose in list/delete logs.** The GET list response can carry prose under
  `segments[].text`. The mitigation is **not** the `acceptedProse`/`body` redaction path (which
  matches those literal keys, not `text`/`segments`); it is that Fastify does not log bodies by
  default plus the discipline of logging only `id`/`sequence`/`createdAt`/model id, verified by a
  logging test. The implementer must not add a generic `text` redaction path (over-redacts
  app-wide) — keep prose-specific keys, matching SPEC-010's logging discipline; the existing
  `acceptedProse`/`body` redaction stays as defense-in-depth.
- **Export as a canon side-channel.** Export is reading output, not canon, and must never become
  a compiler input "through the app" (`CANDIDATES` §"Deletion and export"). The export action
  must be visibly distinct from prompt construction and must not write to the brief or `/generate`.
- **Browser vs. record-editor blur (§27).** The browser must read as an "archive of cloth," not a
  record editor — prose-forward typography, no field-editing affordances, clearly distinct nav
  surface. Decomposition should keep the read-only contract explicit.
- **`spec-to-tickets` sequencing hint.** The first reviewable diff should be the server pair
  (`GET` list route + `DELETE` route over a new `deleteAcceptedSegment`) since it has no UI
  dependency and unblocks the web work; the `api.ts` clients + nav promotion is the natural second
  diff; the `AcceptedSegmentsView` (list/metadata/filter/delete/export) is the third.
- **Resolved during brainstorm:** which spec (Phase 11); export inclusion (minimal Markdown/
  plain-text export-all, no per-segment selection); filter inclusion (simple client-side text
  filter); delete semantics (single-row, sequence gap left un-renumbered, no record mutation);
  storage target (existing `accepted_segments` table + `listAcceptedSegments` + new
  `deleteAcceptedSegment`, no schema change); reminder (persistent banner → Phase 12; this spec
  adds none).

## Outcome

Completed: 2026-06-06

Implemented across SPEC011ACCSEGARC-001 through SPEC011ACCSEGARC-005. Server work added
`GET /api/accepted-segments`, `DELETE /api/accepted-segments/:id`, and
`RecordRepository.deleteAcceptedSegment(id)`, with tests for ordered list read-back, structured
failure cases, sequence-gap preservation, record-table inertness, and accepted-prose log
exclusion. Web work added typed list/delete clients, a read-only `/accepted-segments` browser,
metadata rendering, client-side text/metadata filtering, two-step delete confirmation,
Markdown/plain-text export-all over the full archive, and enabled shell routing.

Governing docs now mark Phase 11 complete while explicitly leaving the persistent durable-change
reminder in Phase 12 and dashboard latest-segment surfacing deferred. During capstone smoke, a
fresh-project validation crash was found and fixed by treating missing
`current_cast_voice_pressure` rows as an empty collection; a regression test now covers that
case. The browser smoke used a local throwaway project and seeded accepted segments through the
localhost acceptance API because no real OpenRouter generation setup was available; it verified
ordered display, metadata, filter, delete confirmation, Markdown/text downloads containing the
full archive despite an active filter, no prompt-context control, and no key/prompt text in
observed console output.

Verification:

- `npm test -w @loom/server -- accepted-routes record-layer` — passed
- `npm test -w @loom/web -- api` — passed
- `npm test -w @loom/web -- AcceptedSegmentsView` — passed
- `npm test -w @loom/web -- AppShell App` — passed
- `npm test -w @loom/core -- validation-blockers` — passed
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed (61 files, 355 tests)
- `npm run build` — passed
