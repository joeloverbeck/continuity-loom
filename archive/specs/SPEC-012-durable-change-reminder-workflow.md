# SPEC-012 — Durable-Change Reminder Workflow

Status: COMPLETED
Phase: Implementation Order Phase 12
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED), SPEC-007 (Deterministic Prompt Compiler, COMPLETED), SPEC-008 (Prompt Preview Gated by Validation, COMPLETED), SPEC-009 (OpenRouter Global Settings and Non-Streaming Send, COMPLETED), SPEC-010 (Candidate Editor and Regenerate/Discard/Accept Lifecycle, COMPLETED), SPEC-011 (Accepted Segment Archive and Browser, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (the Phase 10–12 authority; §"Post-acceptance durable-change reminder"), `docs/requirements-version-1/UI-WORKFLOWS.md` (§"Durable-change reminder", §"Story dashboard"), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 12 gate)
Supporting authorities: `docs/FOUNDATIONS.md` §3 (core loop steps 13–15), §20 (durable change and human gatekeeping), §21 / §6.5 (accepted segment archive), §26 (no LLM auto-inference), §27 (UI/workflow principles — post-acceptance reminders), §29.2 / §29.8 hard-fail checklists. `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/story-record-schema.md`, and `docs/stress-suite.md` were consulted; they constrain this spec **by exclusion** (the reminder is strictly downstream of acceptance and must never touch the compiler input path or record canon).

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-011 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and any other
  `docs/requirements-version-1/*` doc needed) to determine the next spec for
  `specs/`, in full alignment with `docs/FOUNDATIONS.md`, relying on
  `docs/compiler-contract.md`, `docs/prompt-template.md`,
  `docs/story-record-schema.md`, and `docs/stress-suite.md`. Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–11 ✅ (SPEC-001…011,
  all archived). **Phase 12 — Durable-change reminder workflow** is the next link in
  the one-way chain `storage → records → validation → compiler → preview → transport →
  candidate → accepted archive → **durable-change reminder** → manual record update`. It
  sits *after* Phase 11's accepted-segment browser/deletion/export (✅ SPEC-011) because
  "the reminder should appear only after a real accepted segment exists." The ordering doc
  is explicit: the reminder "should guide manual updates without extracting canon."
- **Reference material:** none externally authored — the repo docs are orientation; the
  request is the spec. `compiler-contract.md` / `prompt-template.md` /
  `story-record-schema.md` / `stress-suite.md` were consulted and constrain this spec **by
  exclusion**: the reminder is strictly downstream of acceptance — it neither reads nor
  reshapes records, the active working set, the generation-time brief, or the compiler
  input path, and it must never become a prose-to-canon extractor (FOUNDATIONS §20 / §26 /
  §29.2). `story-record-schema.md` bears only on which record *types* the deterministic
  quick-links target.
- **Verified against code (the reminder is unbuilt; the substrate it derives from exists):**
  - The Phase-10 post-accept notice is **ephemeral and session-only**: `GenerateView`
    (`packages/web/src/generate/GenerateView.tsx:43,145-148`) sets a transient
    `acceptNotice` string after a successful accept. It is cleared on refresh/navigation
    and is **not** persistent, has **no** checklist, **no** quick-links, and **no**
    acknowledge/snooze. SPEC-010 flagged this as the interim mitigation for §29.8 #5.
  - The **accepted-segment archive already exists and is ordered**: `accepted_segments`
    (`packages/server/src/record-tables.ts:45`, `sequence INTEGER NOT NULL UNIQUE`),
    `RecordRepository.appendAcceptedSegment` / `listAcceptedSegments` /
    `deleteAcceptedSegment` (`record-repository.ts:341/357/371`),
    `GET`/`POST`/`DELETE /api/accepted-segments` (`accepted-routes.ts`). So Phase 12
    **derives** reminder state from the *existing* archive; it adds no archive behavior.
  - There is a **project-local non-record single-row state precedent**: the
    `generation_session` table (`record-tables.ts:39`, `id INTEGER PRIMARY KEY CHECK (id=1)`)
    with `RecordRepository.setGenerationSession` / `getGenerationSession`
    (`record-repository.ts:318/329`). The reminder's persisted acknowledge state follows
    this exact single-row pattern.
  - **Schema versioning:** `LOOM_SCHEMA_VERSION = 1` (`packages/core/src/project-storage.ts:5`);
    all tables are created idempotently by `ensureRecordTables` (`record-tables.ts:3`,
    called on every open at `project-store.ts:241,337`). Adding a new
    `IF NOT EXISTS` table keeps `user_version = 1` for existing stores — **no migration**,
    matching how SPEC-010 added the accept write over the pre-existing `accepted_segments`
    table without a version bump.
  - **Compiler isolation confirmed:** `buildSnapshotFromOpenProject`
    (`packages/server/src/snapshot-builder.ts:31`) reads only `generation_session`,
    `story_config`, and selected `records`. A new reminder-state table is **never** read by
    the snapshot/compiler path, so reminder state cannot leak into a prompt.
  - **There is no Story Dashboard surface.** `packages/web/src/shell/AppShell.tsx` routes `/` to `ProjectPicker`
    (Project Library); the `UI-WORKFLOWS.md` "Story dashboard" with reminder surfacing was
    never built (SPEC-010/011 deferred dashboard latest-segment surfacing). The app-wide
    shell banner in this spec is the persistent surface and stands in for that intent; a
    dedicated dashboard remains out of scope.
  - **Record creation surface exists, but needs a new create-deep-link param:** `RecordBrowser`
    (`packages/web/src/records/RecordBrowser.tsx`) has a per-type create rail
    (`:340-354`: `CAST MEMBER → setCastEditorRecord(null)`, else `setGenericEditorRecord({ recordType })`)
    opened only by button click. It already reads a `recordId` search param (`:212`), but that
    param **selects an existing record for editing** (`:213-223`) — it does **not** open a blank
    create form. Quick-links therefore require a **new** `?create=<TYPE>` param that `RecordBrowser`
    consumes to open the matching create form by reusing the existing create-rail branch (no new
    editor is invented).
- **Scope decisions (single fully-constrained approach; two scope edges confirmed in brainstorm):**
  - **Render location = app-wide shell banner.** The persistent reminder is mounted in
    `AppShell` above the routed content, visible from **any** surface until the user
    acknowledges or snoozes it. This best matches the authorities' "persistent banner" +
    "visible enough that the user remembers" language and stands in for the unbuilt
    dashboard surfacing. (Confined-to-pre-generation-surfaces and Generate-only were
    considered and rejected as easier to miss.)
  - **Snooze = session-only.** Snooze dismisses the banner for the current session; it
    re-appears on reload / next app session. Only **Acknowledge** persists durably (it
    advances `acknowledged_through_sequence`). No server-side snooze storage. This keeps the
    reminder "visible enough" and adds no extra persisted state.
- **Assumptions carried (detail-level, correct if not flagged):**
  - **Acknowledge granularity is per-acceptance.** The reminder is `active` when the latest
    accepted segment's `sequence` is greater than the persisted
    `acknowledged_through_sequence` (default `0`). Acknowledge sets
    `acknowledged_through_sequence = latestSequence`; the next acceptance re-activates it
    (FOUNDATIONS §3 step 14 / §29.8 #5 — "reminder appears after acceptance"). This is
    fixed, not a question.
  - **Reminder state persistence = a new single-row `reminder_state` table** (`id=1`,
    `acknowledged_through_sequence INTEGER NOT NULL DEFAULT 0`, `updated_at TEXT`), created
    idempotently in `ensureRecordTables`, mirroring `generation_session`. No
    `user_version` bump; no story record is created or mutated.
  - **Endpoints:** `GET /api/durable-change-reminder` → `{ ok:true, reminder: { active,
    latestSegment: { sequence, createdAt } | null, acknowledgedThroughSequence } }`;
    `POST /api/durable-change-reminder/acknowledge` → advances the threshold to the current
    latest sequence and returns the recomputed reminder state. Both reuse the
    `no-open-project` error path. Endpoint naming is a detail the implementer may settle; the
    contract (derive-only read, advance-threshold write, no record mutation) is fixed.
  - **Quick-links open record creation forms** via the deterministic deep link
    `/records?create=<TYPE>` (param name fixed during reassessment), pre-opening the matching
    create form (CAST MEMBER routing to its custom editor). They are plain navigation, not LLM
    extraction. This requires a paired change in `RecordBrowser` to read `?create=<TYPE>` and
    open the create form (see Deliverable 4); the banner side alone is insufficient.
  - **Post-accept coordination:** after a successful accept on `GenerateView`, the shell
    banner refreshes so it appears immediately without requiring navigation (a small shared
    refresh trigger — React context or equivalent). The Phase-10 ephemeral `acceptNotice` is
    superseded by / folded into the persistent banner so the surfaces do not double up.
  - **`@loom/core` untouched** — the reminder is server I/O + web UI over the existing
    archive; the purity boundary (`packages/core/test/boundary.test.ts`) stays green.
- **Final confidence:** ~92%. Which spec is settled by the dependency chain; the feature set
  (persistent post-acceptance reminder, checklist of deterministic continuity questions,
  deterministic record-creation quick-links, acknowledge + snooze without creating records,
  no LLM prose parsing) is settled by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` +
  `UI-WORKFLOWS.md` + the Phase-12 gate; the two scope edges (app-wide shell banner,
  session-only snooze) were confirmed in brainstorm. Endpoint naming, quick-link query-param
  mechanics, and banner copy are detail-level and left to the implementer within the stated
  constraints.

---

## Problem Statement

After SPEC-011 the app can accept a candidate into the ordered `accepted_segments` archive
and browse/delete/export it, but the **post-acceptance loop is incomplete**. FOUNDATIONS §3
steps 13–15 require that after the app stores an accepted segment it (14) **reminds the user
that durable changes likely require manual record updates** and (15) the user manually
updates records before the next generation. Today the only post-accept signal is the
Phase-10 **ephemeral** `acceptNotice` on `GenerateView` — a transient one-line string that
vanishes on refresh/navigation, with no checklist, no quick-links, and no
acknowledge/snooze. SPEC-010 explicitly flagged this as an **interim** mitigation and tagged
§29.8 #5 as `tensions (interim) — cleared by Phase 12`.

`IMPLEMENTATION-ORDER.md` Phase 12 is the next link in the one-way chain and is gated
*after* the accepted archive ("the reminder should appear only after a real accepted segment
exists") and is the **last loop-closing phase before the demo/hardening phases**. Its gate:
the reminder appears after acceptance; it can be acknowledged/snoozed **without creating
records**; quick links open relevant record editors/creation forms; **no LLM parses accepted
prose**; the next-generation workflow still relies on user-updated records/current state.

`docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` §"Post-acceptance
durable-change reminder" fixes the content: a **persistent** banner/checklist asking whether
a secret became known, a character moved, an object changed hands, a relationship/emotion
changed, a promise/obligation/clock/consequence/injury/open-thread changed, or current
authoritative state needs updating — with quick links to record creation/editing surfaces,
acknowledge/snooze, and **no** automatic record creation or LLM prose parsing.
`UI-WORKFLOWS.md` §"Durable-change reminder" adds: not a blocking modal by default; quick
links to create EVENT/FACT/RELATIONSHIP/EMOTION/OBJECT/LOCATION/ENTITY STATUS/CLOCK/
OBLIGATION/CONSEQUENCE/OPEN THREAD/CAST MEMBER; suggested types are **deterministic links,
not LLM extraction**.

`FOUNDATIONS.md` reinforces this: §20 makes durable change human-gatekept (acceptance must
not infer canon); §21 ends "After acceptance, the app should remind the user that durable
changes likely require manual record updates"; §26 forbids auto-inferring canon from
accepted prose; §27 lists "post-acceptance reminders to update records" as a UI obligation
and "no hidden automatic continuity mutation"; §29.2 / §29.8 are the hard-fail checklists.

**The reminder is unbuilt; the archive it must key off already exists.** Phase 12's job is to
add a persistent, non-modal durable-change reminder — an app-wide shell banner derived from
"is there an accepted segment newer than what the user acknowledged?" — with a deterministic
continuity checklist and deterministic record-creation quick-links, plus durable Acknowledge
and session-only Snooze — entirely in `@loom/server` and `@loom/web`, with `@loom/core`
untouched, **without creating or mutating any story record, without parsing accepted prose
with an LLM, without blocking generation, and without letting reminder state reach the
compiler input path.** Delivering it **clears** the §29.8 #5 interim tension SPEC-010
carried.

## Approach

Single approach — fully constrained by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`
§"Post-acceptance durable-change reminder", `UI-WORKFLOWS.md` §"Durable-change reminder", the
Phase-12 gate, and `FOUNDATIONS.md` §3/§20/§21/§26/§27, layered on the SPEC-001…011 boundary
and the **already-present** ordered `accepted_segments` archive + `generation_session`
single-row state precedent. Two scope edges were confirmed in brainstorm: an **app-wide
shell banner** (not a confined or modal surface) and **session-only snooze** (only
Acknowledge persists).

### `@loom/core` — untouched

No new core module, type, or export. The reminder is platform state + UI over the existing
archive; placing any of it in core would breach the enforced purity boundary and (worse)
risk reminder state being mistaken for a compiler input. The web continues to import only
existing types from `@loom/core`.

### `@loom/server` — derive-only reminder state over the existing archive

- **New single-row `reminder_state` table.** Add to `ensureRecordTables`
  (`record-tables.ts`), mirroring `generation_session`:
  `CREATE TABLE IF NOT EXISTS reminder_state ( id INTEGER PRIMARY KEY CHECK (id = 1),
  acknowledged_through_sequence INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL );`.
  Idempotent; **no `user_version` bump** (stays `1`); existing stores gain the table on next
  open. It holds **only** an integer threshold and a timestamp — **no** prose, **no** prompt,
  **no** secret, **no** record reference.
- **Repository methods** (`record-repository.ts`):
  - `getLatestAcceptedSegment(): { sequence: number; createdAt: string } | null` —
    `SELECT … ORDER BY sequence DESC LIMIT 1` over `accepted_segments` (gap-tolerant; MAX
    sequence). No prose text is returned (only `sequence`/`createdAt`), so the reminder read
    never surfaces accepted prose.
  - `getReminderAcknowledgedSequence(): number` — reads the single row (default `0` when
    absent).
  - `acknowledgeRemindersThrough(sequence: number): void` — upserts the single row to
    `acknowledged_through_sequence = sequence`, `updated_at = now`. Mutates **no** story
    record, current state, working set, brief, cast dossier, or accepted segment.
- **New `reminder-routes.ts`** registered in `createServer()` alongside the existing
  `register*Routes`:
  - `GET /api/durable-change-reminder` → resolves the open project's `RecordRepository`
    (reusing the `no-open-project` 409 path), computes
    `latest = getLatestAcceptedSegment()`, `acknowledged = getReminderAcknowledgedSequence()`,
    and returns
    `{ ok:true, reminder: { active: latest !== null && latest.sequence > acknowledged,
    latestSegment: latest, acknowledgedThroughSequence: acknowledged } }`. **Read-only /
    derive-only** — it writes nothing and runs no validation/compilation.
  - `POST /api/durable-change-reminder/acknowledge` → resolves the repository, reads
    `latest`; if a latest segment exists, calls `acknowledgeRemindersThrough(latest.sequence)`
    (no-op-safe when none); returns the recomputed reminder state (now `active:false`).
    Body is empty / `z.strictObject({})` so no unknown (key-shaped / prose) field can be
    smuggled in.
- **No new redaction needed.** The reminder endpoints carry no prose, prompt, key, or
  candidate text; the existing `redact.paths` are sufficient. A test still asserts the
  endpoints emit no accepted prose / secret to logs.

### `@loom/web` — persistent app-shell banner + deterministic quick-links

- **`api.ts` clients.** Add `getDurableChangeReminder(): Promise<ReminderResponse>` and
  `acknowledgeDurableChangeReminder(): Promise<ReminderResponse>` over the two endpoints,
  each returning a discriminated success/`ApiFailure` union (incl. `no-open-project`).
- **`DurableChangeReminder` component, mounted in `AppShell`** above the routed content pane
  so it is visible from **any** surface:
  - On mount (and when a refresh is triggered) it calls `getDurableChangeReminder()`. When
    `reminder.active` and not session-snoozed, it renders a **non-modal** banner (not a
    blocking modal — `UI-WORKFLOWS.md`) containing:
    - a plain-language lead ("Segment N was accepted. Accepted prose may have created durable
      continuity changes — update records manually before the next generation.");
    - the deterministic **checklist** of the six authority questions (secret became known?
      character moved? object changed hands? relationship/emotion changed? promise/
      obligation/clock/consequence/injury/open-thread changed? current authoritative state
      needs updating?). The checklist is a static prompt list — **not** persisted, **not**
      tracked as canon, **not** plot/act/beat machinery;
    - **deterministic quick-links** to record creation forms for the authority record types
      (EVENT, FACT, RELATIONSHIP, EMOTION, OBJECT, LOCATION, ENTITY STATUS, CLOCK, OBLIGATION,
      CONSEQUENCE, OPEN THREAD, CAST MEMBER — all twelve verified present in `@loom/core`'s
      `recordTypes`) — each a `/records?create=<TYPE>` deep link that pre-opens that type's
      create form (CAST MEMBER → its custom editor). No LLM, no pre-filled content, no
      extraction. Checklist question #6 ("current authoritative state needs updating?") has no
      record-creation type — it is addressed via the existing Generation Brief surface (a
      `/generation-brief` link is acceptable), not a record-create quick-link;
    - **Acknowledge** → calls `acknowledgeDurableChangeReminder()`, hides the banner until the
      next acceptance advances the latest sequence past the threshold;
    - **Snooze** → hides the banner for the current session only (client state); it re-appears
      on reload / next session. No server write, no record.
  - When `reminder.active` is false (no segments, or latest ≤ acknowledged) or no project is
    open, the banner renders nothing.
- **Post-accept coordination.** After a successful accept in `GenerateView`, trigger a shell
  reminder refresh (a small shared refresh signal — e.g. a React context exposing
  `refreshReminder()` that the banner subscribes to) so the banner appears immediately
  without navigation. The Phase-10 ephemeral `acceptNotice` is **superseded** by the
  persistent banner (removed from `GenerateView`, or reduced to a transient "Accepted as
  segment N" toast that does not duplicate the durable-change copy) so the two surfaces do
  not double up.
- **No canon masquerade / no secrets.** The banner shows only key-free derived state
  (sequence number, timestamp) and static checklist text; it is visibly a reminder, not a
  record editor and not an accepted-segment browser.

## Deliverables

1. **`reminder_state` table + repository methods (server).**
   - `record-tables.ts`: add the idempotent single-row `reminder_state` table; **no
     `user_version` bump**.
   - `record-repository.ts`: `getLatestAcceptedSegment()` (sequence/createdAt only, no
     text), `getReminderAcknowledgedSequence()` (default `0`), `acknowledgeRemindersThrough()`
     (single-row upsert).
   - Tests: a fresh store reads acknowledged `0` and `latest:null`; after appending segments
     the latest reflects MAX(sequence) with gaps tolerated; `acknowledgeRemindersThrough`
     upserts exactly the one row and mutates **no** record/accepted-segment/config/brief.

2. **Reminder routes (server).**
   - `reminder-routes.ts`: `GET /api/durable-change-reminder` (derive-only) and
     `POST /api/durable-change-reminder/acknowledge` (advance threshold), both reusing
     `no-open-project`; registered in `createServer()`.
   - Tests (`fastify.inject`): with no segments → `active:false`, `latestSegment:null`; after
     one accept → `active:true`; acknowledge → `active:false` and the threshold equals the
     latest sequence; a **second** accept → `active:true` again (per-acceptance
     re-activation); no-open-project → structured 409; the GET/acknowledge responses contain
     **no** accepted-segment text, no key, no prompt; **no record table and no
     `accepted_segments` row is written** by either endpoint.

3. **Web API clients (web).**
   - `api.ts`: `getDurableChangeReminder()` / `acknowledgeDurableChangeReminder()` returning
     the discriminated success/failure union; client tests for active, inactive,
     post-acknowledge, and `no-open-project`.

4. **Persistent durable-change reminder banner + `RecordBrowser` create-deep-link (web).**
   - `DurableChangeReminder` component mounted in `packages/web/src/shell/AppShell.tsx`, inside
     `<div className="contentPane">` above `<Routes>` (`:81-92`) so it is visible across routed
     surfaces while staying within `BrowserRouter`: non-modal banner with the lead copy, the
     six-question deterministic checklist, the deterministic `/records?create=<TYPE>`
     quick-links, Acknowledge (durable), and Snooze (session-only). Renders nothing when
     inactive / no project open.
   - **`RecordBrowser` create-deep-link consumer** (`packages/web/src/records/RecordBrowser.tsx`):
     read a new `?create=<TYPE>` search param and open the matching create form by reusing the
     existing create-rail branch (`:340-354`: `CAST MEMBER → setCastEditorRecord(null)`, else
     `setGenericEditorRecord({ recordType })`); `<TYPE>` must be one of the 12 valid
     `recordTypes`. This is the consumer that makes the banner's quick-links functional — the
     existing `?recordId` param only selects an existing record for editing and cannot open a
     create form.
   - Component tests: active reminder renders the checklist + quick-links + both buttons;
     Acknowledge calls the endpoint and hides the banner; Snooze hides it without any network
     write and it re-appears after a simulated refresh; inactive state renders nothing; the
     banner is **not** a blocking modal (no focus trap / no route block); **`?create=<TYPE>`
     opens the records create form for its type (CAST MEMBER → custom editor)**; **no**
     checklist answer is persisted and **no** record is created by the banner.

5. **Post-accept coordination + ephemeral-notice supersession (web).**
   - `GenerateView`: on successful accept, trigger the shell reminder refresh so the banner
     appears immediately; remove/reduce the Phase-10 `acceptNotice` so the durable-change
     copy is not duplicated.
   - Shared refresh mechanism (React context or equivalent) wired through `AppShell`.
   - Tests: after accept, the shell banner becomes active without navigation; `GenerateView`
     no longer shows the full Phase-10 durable-change sentence as a standalone ephemeral
     notice (or shows only a minimal non-duplicating confirmation).

6. **Styling.**
   - Minimal `packages/web/src/styles.css` additions for the banner, checklist, quick-link
     row, and Acknowledge/Snooze buttons, consistent with existing surfaces; no new CSS
     framework; visually a reminder, not a modal and not a record editor.

7. **Governing-doc updates on completion** (performed by the implementer when Verification
   passes, not a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 12: add
     `Status: ✅ Implemented via SPEC-012 (YYYY-MM-DD).` and check the Phase-12 gate bullets,
     noting that the demo/stress loop (Phase 13) and hardening (Phase 14) remain, and that
     dashboard latest-segment surfacing remains deferred (the app-wide shell banner stands in
     for it).
   - `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`: add a short "Phase 12
     implementation note" recording the realized reminder (app-wide shell banner derived from
     latest-vs-acknowledged sequence, deterministic checklist + record-creation quick-links,
     durable Acknowledge + session-only Snooze, no LLM prose parsing, no record mutation,
     ephemeral Phase-10 notice superseded).
   - `docs/requirements-version-1/UI-WORKFLOWS.md`: add a short Phase 12 implementation note
     under the existing implementation-note convention.
   - Archive SPEC-012 to `archive/specs/` per `docs/archival-workflow.md` once complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §3 step 14 / §21 / §29.8 #5 Remind the user to update records after accepted durable changes | aligns — **closes the SPEC-010 interim trip** | The persistent app-wide banner appears after every acceptance (derived `latestSequence > acknowledgedThrough`) with the six-question checklist; this is exactly the *persistent* reminder SPEC-010 deferred from Phase 10, so it **clears** the `tensions (interim)` row SPEC-010 carried @ shell banner + reminder routes. |
| §20 / §29.2 Durable change is human-gatekept; no canon inference from acceptance | aligns | Acknowledge/Snooze and quick-links mutate **no** story record, current state, working set, brief, or cast dossier; only `acknowledged_through_sequence` (an integer threshold) is written; the user creates records by hand via deterministic links @ reminder routes + banner. |
| §26 / §29.2 No automatic canon inference from accepted prose; no LLM record mutation | aligns | The checklist is a static deterministic question list and the quick-links are plain navigation; **no** LLM reads/parses accepted prose; `getLatestAcceptedSegment` returns sequence/timestamp only, never text @ repository + banner. |
| §10 / §4.4 / §29.4 No accepted prose / non-record state in generated prompts; deterministic compilation | aligns | `reminder_state` is never read by `buildSnapshotFromOpenProject`/the compiler; the reminder is strictly downstream of acceptance and cannot alter prompt text @ snapshot-builder (untouched) + new table. |
| §6.5 / §21 Accepted-segment archive is read-only output, not canon | aligns | The reminder only *reads* the archive's MAX sequence to decide visibility; it adds no archive write, no branch, no "use as context" affordance; deletion (Phase 11) recomputes the derived state deterministically @ repository + reminder routes. |
| §27 UI: post-acceptance reminders; no hidden automatic continuity mutation; dangerous actions hard to do accidentally | aligns | A persistent **non-modal** banner (not a blocking modal) keeps the manual-update step visible without nagging; nothing mutates continuity automatically @ shell banner. |
| §22 / §29.9 No permanent prompt archive; secrets never in UI/logs | aligns | The reminder stores/serves only an integer threshold + timestamp — no prompt, no candidate, no key; existing redaction suffices @ table + routes. |
| §12 / §29.1 No branches / plot-rail machinery | aligns | The checklist questions are continuity-state prompts (secret/movement/object/relationship/obligation/state), **not** act/beat/arc/milestone structure; quick-links target atomic continuity record types only @ banner. |
| §24 / §29.10 Local-first, user-owned data | aligns | Reminder state lives in the project-local SQLite store as a single non-record row; no remote authority, no opaque service @ table. |

§29 hard-fail clearance: no hard-fail is answered "yes." Acknowledge/Snooze and the
quick-links create/mutate **no** record and infer **no** canon (§29.2); the reminder does not
hide accepted segments from review and **does** remind the user after durable changes —
positively clearing §29.8 #5, the row SPEC-010 carried as an interim tension; no accepted
prose or non-record state enters prompts (§29.4); no key/prompt/prose reaches logs or the UI
(§29.9); the banner is non-modal and never blocks or overrides validation (§29.5 untouched);
no branch/plot-rail machinery is introduced (§29.1). This phase is a **clearance**, not a
fresh interim tension — it closes the loop FOUNDATIONS §3 describes.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green (lint includes
  the `@loom/core` import-boundary rule; this spec leaves core untouched, so the boundary
  test stays green).
- **Derive-only reminder state:** `GET /api/durable-change-reminder` returns `active:false`
  with `latestSegment:null` for a fresh store; `active:true` after one accept;
  `active:false` after acknowledge with `acknowledgedThroughSequence` equal to the latest
  sequence; `active:true` again after a **second** accept (per-acceptance re-activation).
- **No record mutation / no archive write:** neither reminder endpoint writes a record,
  config, brief, cast dossier, or `accepted_segments` row in any branch; only the single
  `reminder_state` row changes on acknowledge.
- **No prose / no secrets exposure:** the reminder GET/acknowledge responses and the
  `getLatestAcceptedSegment` result contain **no** accepted-segment text, key, or prompt; a
  logger-on test asserts no accepted prose / key appears in captured stdout/stderr for the
  reminder paths.
- **Compiler isolation:** the snapshot/compiler path is unchanged; `reminder_state` is never
  read by `buildSnapshotFromOpenProject`; no UI offers "include last segment in prompt".
- **Persistent + non-modal banner:** an active reminder renders the six-question checklist,
  the deterministic record-creation quick-links, Acknowledge, and Snooze; it is **not** a
  blocking modal (no focus trap, no route block); Acknowledge hides it durably until the next
  acceptance; Snooze hides it for the session only and it re-appears after a simulated
  reload; an inactive/no-project state renders nothing.
- **Quick-links are deterministic navigation:** a `/records?create=<TYPE>` quick-link opens the
  records create form for its type (CAST MEMBER → custom editor) via `RecordBrowser`'s new
  `?create=<TYPE>` consumer; no LLM call, no pre-filled record content, no record created by the
  banner; no checklist answer is persisted.
- **No migration:** opening a pre-Phase-12 store (`user_version = 1`) creates `reminder_state`
  via the idempotent path and reads acknowledged `0` without a migration prompt.
- **Post-accept coordination:** after accept on Generate / Candidate, the shell banner becomes
  active without navigation; the Phase-10 standalone ephemeral durable-change notice is gone
  (or reduced to a non-duplicating confirmation).
- **Manual smoke:** `npm start`; open a project with a blocker-free state and a configured
  key; on **Generate / Candidate**, Send → Accept; confirm the persistent shell banner
  appears with the checklist + quick-links; click a quick-link and confirm it opens the
  matching create form; create/update a record; return and **Acknowledge** the banner and
  confirm it hides; **Snooze** after a second accept and confirm it re-appears on reload;
  confirm the SQLite `reminder_state` row holds only the integer threshold + timestamp and no
  prose, and that no record was created by the reminder itself.

## Out of Scope

- **Story Dashboard surface** (`UI-WORKFLOWS.md` §"Story dashboard": current-state summary,
  latest accepted segment index, working-set counts, blocker/warning counts) — not built and
  not introduced here. The app-wide shell banner stands in for the dashboard's reminder
  surfacing; a dedicated dashboard is later/optional work, not Phase 12.
- **Any prose-to-canon extraction / LLM parsing of accepted prose / record auto-creation or
  pre-fill** — forbidden (FOUNDATIONS §20 / §26 / §29.2). The quick-links open empty creation
  forms; the user authors all content.
- **Tracking which checklist items the user addressed, or any "did you update records?"
  enforcement / generation gating on the reminder** — out. The reminder is non-blocking
  (§27); validation gating is unchanged (SPEC-006). The checklist is a prompt, not tracked
  state.
- **Durable (cross-session) snooze, snooze timers, or per-item snooze** — out; Snooze is
  session-only and only Acknowledge persists.
- **Editing/extending accepted-segment storage, the accept write, or the browser** — Phase
  10/11 (SPEC-010/011, COMPLETED). Phase 12 only **reads** the archive's latest sequence.
- **Any `@loom/core` change / schema-version bump / new record type** — the reminder is
  server I/O + web UI over existing storage; `reminder_state` is added idempotently at
  `user_version = 1`; the purity boundary is preserved.
- **Demo fixture exercise of the reminder, stress-suite coverage mapping** — Phase 13;
  compiler golden/regression hardening — Phase 14.

## Risks & Open Questions

- **Reminder-state persistence shape (`reminder_state` single-row table).** Chosen to mirror
  the existing `generation_session` single-row pattern and to keep the derived "active"
  computation trivial (`latest > acknowledged`). A key/value `app_state` table would work
  equally; this is a naming/shape choice the implementer may settle — the contract
  (project-local non-record integer threshold, no `user_version` bump, never read by the
  compiler) is fixed.
- **Endpoint shape (`/api/durable-change-reminder` + `/acknowledge`).** A sub-resource of
  `accepted-segments` (e.g. `…/reminder`) would also work; the implementer may settle naming.
  The contract (derive-only read, advance-threshold write, `no-open-project` reuse, no record
  mutation) is fixed.
- **Post-accept refresh coordination.** The shell banner must learn about an accept that
  happens on `GenerateView`. A small shared refresh signal (React context exposing
  `refreshReminder()`) is the recommended seam; polling on route change is a heavier fallback.
  Keep it lightweight — do not introduce a global store framework for one signal.
- **Deletion interaction (Phase 11).** Deleting the latest accepted segment lowers MAX
  sequence; the derived `active` recomputes deterministically (if the new latest is still
  `> acknowledged`, the banner stays/returns active — correct, since unacknowledged durable
  changes may still exist). This is acceptable; the implementer need not special-case it, but
  a test documenting the recompute after deletion is welcome.
- **Quick-link deep-link mechanics (resolved).** The create deep-link param is fixed at
  `?create=<TYPE>` (distinct from the existing edit-oriented `?recordId`). `RecordBrowser` must
  be extended to consume it (Deliverable 4) — the existing `?recordId` param only selects an
  existing record for editing and cannot open a create form. Ensure CAST MEMBER routes to its
  custom editor.
- **Banner intrusiveness.** `UI-WORKFLOWS.md` failure mode: "modal nagging after every
  acceptance that makes the durable-change reminder hostile." Keep it a calm, dismissible,
  **non-modal** banner; Snooze must be one click; never trap focus or block routes.
- **§29.8 #5 is cleared here, not deferred.** Decomposition must deliver the *persistent*
  banner + checklist + quick-links + acknowledge/snooze (not a second ephemeral notice), or
  the interim tension SPEC-010 carried would remain open.
- **`spec-to-tickets` sequencing hint.** The first reviewable diff should be the server pair
  (`reminder_state` table + repository methods + `reminder-routes.ts`) since it has no UI
  dependency and unblocks the web work; the `api.ts` clients + the `DurableChangeReminder`
  banner mounted in `AppShell` + the `RecordBrowser` `?create=<TYPE>` consumer is the natural
  second diff; the post-accept coordination + Phase-10 ephemeral-notice supersession is the
  third.
- **Resolved during brainstorm:** which spec (Phase 12); render location (app-wide shell
  banner; confined / Generate-only / dashboard rejected); snooze model (session-only; only
  Acknowledge persists); acknowledge granularity (per-acceptance via
  `acknowledged_through_sequence`); storage (idempotent single-row `reminder_state`, no
  version bump); no-LLM/no-record-mutation contract for the checklist and quick-links.

## Outcome

Completed: 2026-06-06

Implemented Phase 12 as a downstream reminder workflow over the existing accepted-segment
archive. The server now creates an idempotent project-local `reminder_state` table and
exposes derive-only reminder state plus an acknowledge endpoint. The web client has typed
reminder API functions, an app-wide non-modal `DurableChangeReminder` banner in `AppShell`,
deterministic checklist text, deterministic record-create quick-links via
`/records?create=<TYPE>`, durable Acknowledge, session-only Snooze, and a lightweight
post-accept refresh signal from `GenerateView`.

The Phase-10 ephemeral durable-change notice was reduced to a short acceptance
confirmation so the persistent banner is the only durable-change reminder surface. The
reminder stores no prose, reads no accepted prose, invokes no LLM, creates no records,
mutates no records, and is not read by the compiler/snapshot path. The dedicated Story
Dashboard remains deferred; the app-wide shell banner is the realized Phase 12 surface.

Verification:

- `npm test -- record-layer` — passed.
- `npm test -- reminder-routes` — passed.
- `npm test -- api.test` — passed.
- `npm test -- RecordBrowser` — passed.
- `npm test -- DurableChangeReminder` — passed.
- `npm test -- AppShell` — passed.
- `npm test -- GenerateView` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
- Production smoke via `node packages/server/dist/launch.js --no-open` and Playwright CLI
  on localhost passed: accepted-segment reminder appeared, CAST MEMBER quick-link opened
  the create form without creating a record, Acknowledge persisted only
  `acknowledged_through_sequence`, a second acceptance reactivated the banner, Snooze hid
  it for the session, and reload showed it again.
