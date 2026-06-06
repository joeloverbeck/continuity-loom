# SPEC-010 — Candidate Editor and Regenerate/Discard/Accept Lifecycle

Status: COMPLETED
Phase: Implementation Order Phase 10
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED), SPEC-007 (Deterministic Prompt Compiler, COMPLETED), SPEC-008 (Prompt Preview Gated by Validation, COMPLETED), SPEC-009 (OpenRouter Global Settings and Non-Streaming Send, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (the Phase 10–12 authority), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 10 gate)
Supporting authorities: `docs/requirements-version-1/UI-WORKFLOWS.md` ("Generation and candidate workflow", navigation model), `docs/story-record-schema.md` §3.3 (immediate handoff — no accepted prose in prompt-facing fields), `docs/requirements-version-1/TESTING-STRATEGY.md` (mocked-transport strategy), `docs/FOUNDATIONS.md` §3 (core loop), §6.5 / §21 (accepted segment archive), §20 (durable change and human gatekeeping), §22 (prompt inspection), §10 (no accepted prose in prompts), §29.2 / §29.8 / §29.9 hard-fail checklists

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-009 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and supporting
  `docs/requirements-version-1/*`) to determine the next spec for `specs/`, in full
  alignment with `docs/FOUNDATIONS.md`, relying on `docs/compiler-contract.md`,
  `docs/prompt-template.md`, `docs/story-record-schema.md`, and `docs/stress-suite.md`.
  Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–9 ✅ (SPEC-001…009).
  **Phase 10 — Candidate editor and regenerate/discard/accept lifecycle** is the next
  link in the one-way chain `storage → records → validation → compiler → preview →
  transport → **candidate** → accepted archive`. It sits *after* Phase 9 (✅ SPEC-009,
  which returns a **read-only ephemeral** candidate from `POST /api/generate`) and
  *before* Phase 11's accepted-segment **browser**/deletion/export and Phase 12's
  durable-change **reminder**. The ordering doc is explicit: "candidates are the UI result
  of transport … acceptance needs a durable target."
- **Reference material:** none externally authored — the repo docs are orientation; the
  request is the spec. `compiler-contract.md` / `prompt-template.md` / `stress-suite.md`
  were consulted and constrain this spec **by exclusion**: the candidate lifecycle is
  strictly downstream of compilation — it neither re-reads nor re-shapes records, and
  accepted prose must never re-enter the compiler input path (`story-record-schema.md`
  §3.3, FOUNDATIONS §10). `story-record-schema.md` bears on the accepted-segment metadata
  shape (§21 list) and the no-accepted-prose-in-handoff rule.
- **Verified against code (the candidate substrate already exists):**
  - `POST /api/generate` (`packages/server/src/generate-routes.ts`) is stateless,
    recompiles from the current snapshot, re-runs `runValidation()` fail-closed, and
    returns `{ ok:true, candidate:{ text }, metadata:{ model, versions } }`. It writes
    **nothing** durable.
  - The **`accepted_segments` table already exists** (`packages/server/src/record-tables.ts`,
    `id`/`sequence UNIQUE`/`text`/`metadata_json`/`created_at`; `user_version = 1`), built
    as the Phase-3 "physically distinct" storage substrate.
    `RecordRepository.appendAcceptedSegment({ text, metadata? }): AcceptedSegment` and
    `listAcceptedSegments(): AcceptedSegment[]` are **already implemented**
    (`packages/server/src/record-repository.ts:341` / `:357`); `AcceptedSegment` is exported
    at `record-repository.ts:41`. **No accept route is wired yet**, and `appendAcceptedSegment`
    has **no caller**. So Phase 10 wires an accept endpoint to **existing** archive logic;
    it does not invent storage or bump `user_version`.
  - The web candidate is React-state-only: `PromptPreviewView` renders the read-only
    `<pre className="candidateBody">` (SPEC-009). `packages/web/src/api.ts` exports
    `generate(): Promise<GenerateResponse>` (`:304`).
  - `packages/web/src/shell/AppShell.tsx` has **disabled** nav placeholders
    `["Generate/Candidate", "Accepted Segments"]` with no routes.
- **Scope decisions (single fully-constrained approach; two scope edges confirmed in brainstorm):**
  - **Candidate surface = promote the dedicated `Generate / Candidate` nav route.** The
    editable candidate + regenerate/discard/accept lifecycle lives on a **new primary
    route** (the disabled `"Generate/Candidate"` placeholder becomes real), matching
    `UI-WORKFLOWS.md`'s distinct nav surfaces and SPEC-009's note that this placeholder is
    "Phase 10's surface." `/preview` stays **inspection-only**: the SPEC-009 Generate
    button + read-only candidate panel are **relocated** off `/preview` to the new surface.
    The compiled-prompt inspector is factored into a shared component so the prompt remains
    inspectable **on the generate surface before Send** (FOUNDATIONS §22, "inspectable
    before sending").
  - **Accept metadata = full deterministic snapshot.** On accept, the segment stores
    `model`, `provider` (`"openrouter"`), `temperature`, `maxOutputTokens`, optional
    `topP`, and the `{ template, compiler, contract }` version triple — all knowable
    server-side at generation time and threaded through the generate→accept path. The
    `generate` response is extended to carry the parameter snapshot so accept can persist
    what **actually** produced the text. Optional `finishReason` / token `usage` /
    non-reversible prompt `fingerprint` are **deferred** (they need extra transport
    plumbing; `CANDIDATES` lists them "optional … if returned").
- **Assumptions carried (detail-level, correct if not flagged):**
  - **Accept endpoint = `POST /api/accepted-segments`** (the create half of the Phase-11
    resource), body `{ text, generationMetadata }`; server Zod-validates the metadata shape
    and calls `appendAcceptedSegment({ text, metadata })`. It writes **exactly one** segment
    and mutates **no** records, current state, working set, brief, or cast dossiers. It does
    **not** re-run validation/compilation (the accepted text is human-approved prose, not a
    fresh prompt) and does **not** store an "edited" flag (FOUNDATIONS §21 / §29.8).
  - **The edited text is authoritative.** Accept persists the **current candidate-editor
    text** verbatim (FOUNDATIONS §21 "the accepted text is the accepted text").
  - **Regenerate = re-call `generate()`**, replacing the session candidate; superseded text
    is **never** persisted. When the current candidate has unsaved edits, the UI warns
    before replacing (session-level friction only, no storage).
  - **Discard** clears the session candidate and returns to the pre-send state with
    validation/compile state intact; **no** durable write.
  - **Minimal ephemeral post-accept notice** (not the Phase-12 reminder): after a
    successful accept, the surface shows a non-modal, non-persistent confirmation —
    "Accepted as segment N. Durable changes likely need manual record updates before the
    next generation." — and clears the candidate. The **persistent** banner/checklist,
    acknowledge/snooze state, and record quick-links remain **Phase 12**; the
    `"Accepted Segments"` browser remains **Phase 11** (its nav placeholder stays disabled).
  - **`@loom/core` untouched** — the lifecycle is server I/O + web UI over already-compiled
    output; the purity boundary (`packages/core/test/boundary.test.ts`) stays green.
- **Final confidence:** ~93%. Which spec is settled by the dependency chain; the feature
  set (editable candidate, regenerate/discard/accept, one accepted-segment write with full
  metadata, no rejected/superseded persistence, no browser, no persistent reminder) is
  settled by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` + `UI-WORKFLOWS.md` + the Phase-10 gate;
  the two scope edges (dedicated surface, full metadata) were confirmed in brainstorm.
  Endpoint naming, the regenerate-warning ergonomics, and the post-accept notice copy are
  detail-level and left to the implementer within the stated constraints.

---

## Problem Statement

After SPEC-009 the app can send a validated, compiled prompt to OpenRouter and display the
returned candidate **read-only and ephemerally** on `/preview`. But the candidate is a
dead end: it cannot be edited, regenerated, discarded, or accepted, and there is **no way to
turn a candidate into durable story output**. `appendAcceptedSegment()` exists in
`record-repository.ts` but has no caller and no route; the `accepted_segments` table sits
empty with no write path; the `"Generate/Candidate"` nav surface is a disabled placeholder.

`IMPLEMENTATION-ORDER.md` Phase 10 is the next link in the one-way chain and is explicitly
gated *after* transport ("candidates are the UI result of transport") and *before* the
accepted-segment **browser** (Phase 11) and the durable-change **reminder** (Phase 12):
"acceptance needs a durable target." Building the browser or the reminder before the
acceptance write exists, or letting acceptance mutate records, would violate the ordering
doctrine and FOUNDATIONS.

`docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` is the Phase-10 authority.
It fixes the candidate as **session-only editable cloth-in-progress**: created from a
transport success; editable before acceptance with **no** edit-tracking; regenerable
(replace/supersede, **no** persistence of superseded text); discardable (no durable write);
acceptable into **exactly one** accepted segment carrying metadata and **no** full prompt
text. Rejected and superseded candidates are **never** stored. Acceptance mutates **no**
records, current state, working set, brief, or cast dossiers, and accepted text **never**
re-enters the compiler input path.

`FOUNDATIONS.md` reinforces this: §3 makes the human acceptance step the core loop's gate;
§20 makes durable change human-gatekept (no canon inference from generation/regeneration/
acceptance); §21 / §6.5 define the accepted-segment archive, its metadata, "the accepted
text is the accepted text" (no edited flag), and "do not store discarded/regenerated
candidates"; §10 forbids accepted prose in generated prompts; §22 requires the prompt be
inspectable before sending; §29.2 / §29.8 / §29.9 are the hard-fail checklists this spec
must clear.

**The candidate exists but is inert; the acceptance write path is unbuilt.** Phase 10's job
is to add the editable candidate lifecycle on a dedicated `Generate / Candidate` surface and
a fail-safe single-segment accept write — entirely in `@loom/server` and `@loom/web`, with
`@loom/core` untouched — without persisting any rejected/superseded candidate, without
mutating any record on accept, without storing a full prompt or an "edited" flag, and
without letting accepted text reach compilation.

## Approach

Single approach — fully constrained by `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`, the Phase-10
gate, `UI-WORKFLOWS.md`, and `FOUNDATIONS.md` §3/§10/§20/§21/§22, layered on the
SPEC-001…009 boundary and the **already-present** `accepted_segments` table +
`appendAcceptedSegment`. Two scope edges were confirmed in brainstorm: **a dedicated
`Generate / Candidate` route** (not an in-place `/preview` extension) and a **full
deterministic metadata snapshot** on accept.

### `@loom/core` — untouched

No new core module, type, or export. The candidate lifecycle is platform I/O and UI over
**already-compiled** output; placing any of it in core would breach the enforced purity
boundary. The web continues to import `ValidationResult` / `CompileResult` types from
`@loom/core` for the blocked/error branches.

### `@loom/server` — parameter-bearing generate, accept route, archive write

- **Extend the generate metadata (parameter snapshot).** `POST /api/generate`
  (`generate-routes.ts`) currently returns `metadata:{ model, versions }`. Extend it to
  `metadata:{ model, provider:"openrouter", temperature, maxOutputTokens, topP?, versions }`
  — all read from `readOpenRouterSettings()` + `compileResult.metadata.versions` at send
  time, so the accept step can persist **what actually generated the text**. No new I/O; no
  secret added (still no key in any response).
- **Accept route + archive write.** New `accepted-routes.ts`:
  - `POST /api/accepted-segments` — body `{ text: string, generationMetadata: <snapshot> }`.
    Zod-validates the body (non-empty `text`; metadata matching the extended generate
    snapshot via a `z.strictObject` — matching the `openRouterSettingsSchema` style at
    `settings.ts:33` — which **inherently rejects** any unknown key, including key-shaped
    (`apiKey`/`api_key`) or prompt-text (`prompt`/`fullPrompt`) fields; no separate
    key-detector is needed, and `settings.ts`'s `assertNoKeyFields` is module-private, not
    importable). Resolves the open project's
    `RecordRepository` (reusing the `no-open-project` error path), calls
    `appendAcceptedSegment({ text, metadata: generationMetadata })`, and returns
    `{ ok:true, segment:{ id, sequence, createdAt } }`. It **does not** run
    `runValidation()`/`compilePrompt()`, **does not** mutate any record/store beyond the
    single `accepted_segments` insert, and **does not** store a full prompt or an "edited"
    flag. Register in `createServer()` alongside the existing `register*Routes`.
  - The metadata persisted in `metadata_json` is exactly the full deterministic snapshot
    (model, provider, temperature, maxOutputTokens, optional topP, version triple). Segment
    `sequence` and `createdAt` come from the repository (existing behavior); the story/
    project identifier is implicit in the project-local DB (FOUNDATIONS §21 "story
    identifier" is satisfied by project-local storage; an explicit field may be added later
    if cross-project export needs it — out of scope here).
- **Logging.** The existing `redact.paths` (`server.ts:35-49`) already cover specific prose
  keys — `candidateProse`/`acceptedProse`/`candidateText`/`prompt`. The accept route should
  log any accepted-prose value under one of these **specific** keys (e.g. `acceptedProse`)
  rather than a generic `text` path — adding bare `text` to the global `redact.paths` would
  over-redact every `text` field app-wide. Confirm no accepted prose reaches logs; if a new
  redaction path is genuinely needed, prefer a specific name matching the existing style.
  Default logs may include only segment id/sequence, model id, and status.

### `@loom/web` — promote the `Generate / Candidate` surface

- **New primary route + nav.** Promote `"Generate/Candidate"` from the disabled
  `laterPhaseSurfaces` placeholder in `AppShell.tsx` to a real route (e.g. `/generate`) with
  an enabled nav link. `"Accepted Segments"` **stays disabled** (Phase 11).
- **Shared compiled-prompt inspector.** Factor the compiled-prompt display currently in
  `PromptPreviewView` into a shared component used by both `/preview` (inspection-only) and
  `/generate` (inspect-then-send), so the prompt is **inspectable before Send** on the
  generate surface (FOUNDATIONS §22). `/preview` loses its SPEC-009 Generate button and
  read-only candidate panel (relocated here).
- **`api.ts` clients.** Extend `generate()`'s `GenerateResponse` metadata to the parameter
  snapshot; add `acceptCandidate({ text, generationMetadata }): Promise<AcceptResponse>`
  over `POST /api/accepted-segments` (success `{ ok:true, segment }`; failure the shared
  `ApiFailure` incl. `no-open-project`).
- **Candidate lifecycle UI** on `/generate`:
  - **pre-send** — shared prompt inspector + a **Send/Generate** button (disabled with a
    clear notice when blocked or when the API key is missing, mirroring SPEC-009 errors);
  - **sending** — non-committal "Generating…" status;
  - **candidate** — the returned text in an **editable** control (textarea), clearly marked
    "draft candidate — not accepted, not canon", with **Regenerate**, **Discard**, and
    **Accept** actions. Editing is local React state only; it is **never** written to
    `localStorage`/`sessionStorage`/IndexedDB/disk and **never** logged;
  - **error** — the normalized transport category as an actionable message, project data
    unchanged;
  - **post-accept** — a **minimal, non-modal, non-persistent** confirmation: "Accepted as
    segment N. Durable changes likely need manual record updates before the next
    generation." The candidate clears. (The **persistent** durable-change banner/checklist/
    quick-links + acknowledge/snooze are **Phase 12**.)
  - **Regenerate** re-calls `generate()`, replacing the candidate; if the candidate has
    unsaved edits, warn before replacing. Superseded text is never persisted.
  - **Discard** clears the candidate and returns to pre-send with validation/compile intact.
  - **Accept** posts the **current edited text** + the generation metadata snapshot to
    `acceptCandidate()`, then shows the post-accept confirmation and clears the candidate.
- **No secrets / no canon masquerade.** The surface shows only key-free endpoint payloads;
  the candidate control is visibly a draft, not a record editor and not an accepted-segment
  browser.

## Deliverables

1. **Parameter-snapshot generate metadata (server).**
   - `generate-routes.ts`: extend the success `metadata` to
     `{ model, provider:"openrouter", temperature, maxOutputTokens, topP?, versions }`.
   - Tests: the success body carries the full snapshot from settings + compile versions;
     no key, no prompt, no candidate text appears in the response or logs.

2. **Accept route + archive write (server).**
   - `accepted-routes.ts`: `POST /api/accepted-segments` — Zod-validated `{ text,
     generationMetadata }` (a `z.strictObject` over the snapshot, which rejects unknown
     key-shaped/prompt-text fields inherently) → `appendAcceptedSegment({ text, metadata })`
     → `{ ok:true, segment:{ id, sequence, createdAt } }`; reuses `no-open-project`; writes
     **exactly one** segment; runs no validation/compilation; stores no full prompt and no
     edited flag. Registered in `createServer()`.
   - Tests (`fastify.inject`): a valid accept inserts one row with the full metadata snapshot
     in `metadata_json` and nothing else; `text` is persisted verbatim (including edited
     text differing from any generated text); no-open-project → structured error; an
     empty/missing `text` → validation error and **no** insert; **no record table is written**
     in any branch; the metadata contains no `edited` flag and no full prompt; logs contain
     no accepted prose and no key. A second accept appends a second segment with the next
     `sequence` (append-only, ordered).

3. **Logging redaction confirmation (server).**
   - Confirm/extend `createServer()` `redact.paths` so the accept request body's text field
     is redacted; a logging test asserts a seeded accepted-prose string never appears in
     captured stdout/stderr.

4. **Web API clients (web).**
   - `api.ts`: `GenerateResponse` metadata widened to the parameter snapshot;
     `acceptCandidate({ text, generationMetadata })` returning the discriminated
     success/failure union; client tests for success and failure (incl. `no-open-project`).

5. **`Generate / Candidate` route + nav promotion (web).**
   - `AppShell.tsx`: `"Generate/Candidate"` promoted from `laterPhaseSurfaces` to a real
     enabled route + nav link; `"Accepted Segments"` stays disabled.
   - Shared compiled-prompt inspector extracted from `PromptPreviewView` and consumed by
     both `/preview` and `/generate`; `/preview` Generate button + read-only candidate panel
     **removed** (relocated). The candidate generate state machine (`GenerateState`,
     `generateCandidate` — currently `PromptPreviewView.tsx:22-89`) relocates to the
     `/generate` surface with the button/panel. The existing `/preview` generate/candidate
     tests in `packages/web/src/preview/PromptPreviewView.test.tsx` (the four cases at ll.
     112–182: read-only draft candidate, the two generate-error cases, validation-blocked
     deferral) must be **relocated** to the new `/generate` surface's test, not left asserting
     removed behavior. Tests: nav exposes an enabled `Generate / Candidate` and a
     still-disabled `Accepted Segments`; `/preview` no longer offers Generate/candidate.

6. **Candidate lifecycle UI (web).**
   - `/generate` surface: pre-send (inspector + Send, disabled-when-blocked/missing-key),
     sending, editable candidate with Regenerate/Discard/Accept, error, and the minimal
     post-accept confirmation; candidate text is editable React state only.
   - Component tests: success → **editable** candidate (an editable control exists, "draft —
     not accepted" notice present); editing the text then Accept posts the **edited** text;
     Regenerate replaces the candidate and warns when edits are pending; Discard clears with
     no durable write; Accept → post-accept confirmation + candidate cleared; blocked/
     missing-key → Send disabled with actionable copy and no candidate; candidate text is
     written to **no** `localStorage`/`sessionStorage` (asserted); **no** accepted-segment
     browser and **no** persistent reminder appear (Phase 11/12).

7. **Styling.**
   - Minimal `packages/web/src/styles.css` additions for the candidate editor, lifecycle
     buttons, and the post-accept notice, consistent with existing surfaces; no new CSS
     framework.

8. **Governing-doc updates on completion** (performed by the implementer when Verification
   passes, not a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 10: add
     `Status: ✅ Implemented via SPEC-010 (YYYY-MM-DD).` and check the Phase-10 gate bullets,
     noting that the accepted-segment **browser**/deletion/export remain Phase 11 and the
     **persistent** durable-change reminder remains Phase 12 (Phase 10 ships only a minimal
     ephemeral post-accept notice).
   - `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`: add a short "Phase 10
     implementation note" recording the realized lifecycle (dedicated surface,
     `POST /api/accepted-segments` write over the existing table, full metadata snapshot, no
     rejected/superseded persistence, browser deferred to Phase 11, persistent reminder
     deferred to Phase 12).
   - Archive SPEC-010 to `archive/specs/` per `docs/archival-workflow.md` once complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §3 / §20 / §29.2 Durable change is human-gatekept; no canon inference from generation/regeneration/acceptance | aligns | Accept persists only the human-approved candidate text and mutates **no** records/current state/working set/brief/dossiers; no LLM touches records; regenerate/discard write nothing @ accept route + candidate UI. |
| §21 / §6.5 / §29.8 Accepted-segment archive; "accepted text is the accepted text" (no edited flag); discarded/regenerated not stored | aligns | One `appendAcceptedSegment` write per accept with the full deterministic metadata snapshot and **no** edited flag; superseded/discarded candidates are session-only and never persisted @ accept route + candidate UI. |
| §10 / §29.4 No accepted prose in generated prompts | aligns | Accept writes to the archive only; the compiler input path is untouched and accepted text never re-enters it (`story-record-schema.md` §3.3); no "include last segment" affordance @ accept route + web. |
| §22 / §29.9 Prompt inspectable before sending; no permanent prompt/candidate archive | aligns | The shared compiled-prompt inspector renders on `/generate` before Send; candidate text lives only in session React state (never persisted/logged); the accept body stores **no** full prompt @ web + accept route. |
| §4.5 / §11 / §29.5 Fail closed; send impossible while blockers exist | aligns | Send reuses `/api/generate`, which re-runs `runValidation()` and returns `validation-blocked` with no candidate when blocked; Send is disabled in the blocked state @ generate endpoint + web. |
| §23 / §29.9 Secrets never in archive/logs/UI | aligns | The accept body and segment metadata carry no key; the parameter snapshot is key-free; redaction covers accepted-prose request bodies @ accept route + logging. |
| §29.8 #5 Remind user to update records after accepted durable changes | tensions (interim) — cleared by Phase 12 | Phase 10 ships a **minimal ephemeral** post-accept notice so acceptance is never silent; the **persistent** banner/checklist/quick-links + acknowledge/snooze are sequenced to Phase 12 by `IMPLEMENTATION-ORDER.md` (itself FOUNDATIONS-aligned). Flagged; full clearance lands with Phase 12 @ candidate UI. |
| §12 / §29.1 No branches/plot-rail machinery; accepted prose not canon | aligns | Acceptance appends one ordered segment; no branch, alternate timeline, or canon tree; accepted prose is output, not a generation source @ accept route. |

§29 hard-fail clearance: no hard-fail is answered "yes." Acceptance mutates no records and
infers no canon (§29.2); rejected/superseded candidates are not stored, accepted segments
carry no edited flag and are not used as prompt context (§29.8); no accepted prose enters
prompts (§29.4); no key/prompt/candidate reaches logs or the archive (§29.9); send stays
fail-closed (§29.5). The single **interim tension** — the *persistent* durable-change
reminder is Phase 12 — is mitigated by the minimal ephemeral post-accept notice so §29.8 #5
is not silently tripped, and is fully cleared when Phase 12 ships.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green (lint includes
  the `@loom/core` import-boundary rule; this spec leaves core untouched, so the boundary
  test stays green).
- **One-write accept**: a valid accept inserts **exactly one** `accepted_segments` row with
  the full metadata snapshot in `metadata_json`; a second accept appends the next `sequence`
  (ordered, append-only); no record table is written in any branch.
- **Edited text is authoritative**: editing the candidate then accepting persists the
  **edited** text verbatim; the stored metadata contains **no** `edited` flag and **no** full
  prompt text.
- **No rejected/superseded persistence**: regenerate and discard write **nothing** durable;
  only `accepted_segments` ever gains a row, and only on accept.
- **Fail-closed send**: with a blocked state, Send is disabled and `/api/generate` returns
  `validation-blocked` with no candidate and no network call; with a missing key, Send shows
  the SPEC-009 missing-key error and no candidate.
- **No accepted prose in compilation**: the compiler/snapshot path is unchanged; no UI offers
  "include last segment in prompt"; `story-record-schema.md` §3.3 paste-guard behavior is
  unaffected.
- **Secrets/logging**: no key appears in the generate/accept responses, the segment metadata,
  or logs; a logger-on test asserts a seeded accepted-prose string is absent from captured
  stdout/stderr; the candidate text is written to no `localStorage`/`sessionStorage`/disk
  (asserted) and is not logged.
- **Surface separation**: `Generate / Candidate` is an enabled primary route; `Accepted
  Segments` stays disabled; `/preview` is inspection-only (no Generate/candidate controls);
  the compiled prompt is inspectable on `/generate` before Send.
- **Post-accept notice**: after accept, a non-modal, non-persistent confirmation appears and
  the candidate clears; **no** persistent banner/checklist, acknowledge/snooze state, or
  record quick-links exist (Phase 12), and **no** accepted-segment browser exists (Phase 11).
- **Manual smoke**: `npm start`; open a project with a blocker-free state and a configured
  key; on **Generate / Candidate**, inspect the prompt, **Send**, edit the candidate,
  **Regenerate** (confirm the edit-replacement warning), **Discard**, **Send** again, then
  **Accept**; confirm the post-accept notice, that the candidate cleared, and that the SQLite
  `accepted_segments` table now holds one row with the edited text + full metadata and no
  prompt; confirm the browser console/network logs contain no key, no full prompt, and no
  persisted candidate.

## Out of Scope

- **Accepted-segment browser, ordered reading view, segment deletion, export** — Phase 11
  (`CANDIDATES-AND-ACCEPTED-SEGMENTS.md` "Accepted segment archive"/"Deletion and export").
  The `"Accepted Segments"` nav placeholder stays disabled; `listAcceptedSegments()` already
  exists but gains no route/UI here.
- **Persistent durable-change reminder** (banner/checklist, acknowledge/snooze state, record
  quick-links, dashboard "unacknowledged" surfacing) — Phase 12 (`UI-WORKFLOWS.md` "Durable-
  change reminder"). Phase 10 ships only a minimal ephemeral post-accept notice.
- **Optional richer accept metadata** — `finishReason`, token `usage`, non-reversible prompt
  `fingerprint` are deferred (they need transport plumbing; `CANDIDATES` lists them
  "optional … if returned"). The full-prompt text is **never** stored.
- **Streaming send, automatic retry, multi-candidate generation** — out (SPEC-009 / OpenRouter
  non-goals); a send yields at most one candidate, and regenerate is an explicit user action.
- **Any prose-to-canon extraction / LLM parsing of accepted prose / record auto-creation** —
  forbidden (FOUNDATIONS §20 / §29.2); the post-accept notice only links the human to manual
  updates (and the quick-links themselves are Phase 12).
- **Any `@loom/core` change / schema change / new SQLite table / `user_version` bump** — the
  `accepted_segments` table and `appendAcceptedSegment` already exist; the purity boundary is
  preserved.
- **Edit-tracking / candidate history / "was this edited?" metadata** — forbidden
  (FOUNDATIONS §21 / §29.8 #3).

## Risks & Open Questions

- **Accept endpoint shape (`POST /api/accepted-segments`).** Chosen as the create half of the
  Phase-11 resource so Phase 11 adds `GET`/`DELETE` over the same path. An action-named
  `POST /api/accept` would work equally; this is a naming choice the implementer may settle —
  the contract (one write, full metadata, no validation, no record mutation) is fixed.
- **Trusting client-supplied generation metadata.** Accept persists the metadata snapshot the
  client received from `generate` (so the segment reflects what **actually** generated the
  text, even if Settings changed since). For a local single-user app this is acceptable; the
  server still Zod-validates the shape and rejects key/prompt-text fields. A future spec could
  mint a short-lived server-side generation token if stricter provenance is wanted (YAGNI now).
- **Inspect-before-send on a single surface.** Factoring the prompt inspector into a shared
  component keeps `/generate` self-sufficient for §22 without forcing a `/preview` visit. The
  implementer should ensure the inspector on `/generate` reflects the **same** validation-gated
  compile the Send uses, so the user never sends something they could not inspect.
- **Regenerate edit-loss friction.** The warning before replacing edited candidate text is
  session-level friction only (no storage). Keep it lightweight; do not persist superseded text
  to "protect" it (that would violate §21 / §29.8).
- **§29.8 #5 interim tension.** The *persistent* reminder is Phase 12. The minimal ephemeral
  post-accept notice is the interim mitigation; decomposition must not let it grow into the
  Phase-12 banner/checklist/quick-links (scope creep), nor omit it entirely (silent §29.8 gap).
- **`spec-to-tickets` sequencing hint.** The first reviewable diff should be the server pair
  (parameter-snapshot generate metadata + `accepted-routes.ts` over the existing
  `appendAcceptedSegment`) since it has no UI dependency and unblocks the web work; the shared
  inspector extraction + nav promotion is the natural second diff; the candidate lifecycle UI
  is the third.
- **Resolved during brainstorm:** which spec (Phase 10); candidate surface (dedicated
  `Generate / Candidate` route, `/preview` inspection-only); accept metadata depth (full
  deterministic snapshot, optional usage/finish-reason/fingerprint deferred); storage target
  (existing `accepted_segments` table + `appendAcceptedSegment`, no schema change); post-accept
  UX (minimal ephemeral notice; persistent reminder → Phase 12; browser → Phase 11).

## Outcome

Completed: 2026-06-06

What actually changed:
- `POST /api/generate` now returns a full key-free generation metadata snapshot:
  model, provider, temperature, max output tokens, optional top-p, and
  template/compiler/contract versions.
- `POST /api/accepted-segments` appends exactly one accepted segment through the existing
  `accepted_segments` table and stores the edited accepted text plus the generation
  metadata snapshot. It does not run validation/compilation, mutate records, store full
  prompts, or store an edited flag.
- The web API exposes the widened `GenerationMetadata` contract and `acceptCandidate()`.
- The prompt inspector is shared by `/preview` and `/generate`.
- `Generate / Candidate` is an enabled route. `/preview` is inspection-only.
- `/generate` supports prompt inspection before Send, editable session-only candidates,
  Regenerate with edit-loss warning, Discard, Accept, missing-key disabled Send, and a
  minimal ephemeral post-accept notice.
- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` and
  `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` record Phase 10
  completion and preserve Phase 11/12 boundaries.

Deviations from original plan:
- The accept route returns HTTP `201 Created`, matching existing create-route style, while
  preserving the planned success body shape.
- The web API tests were added to the existing `api.test.tsx` file instead of creating a
  duplicate `api.test.ts`.
- `PromptInspector` owns the search input and metadata panel in addition to the prompt
  body, because those are part of the reusable prompt-inspection surface.
- Missing-key disabled Send is driven by `getOpenRouterSettings()` before transport,
  rather than waiting for `/api/generate` to report `missing-key`.
- The real-provider manual smoke could not be completed in this environment because
  `OPENROUTER_API_KEY` is not configured. Automated server and web tests cover the local
  route, storage, and UI lifecycle seams.

Verification results:
- `npm test -- generate-routes` — passed.
- `npm test -- accepted-routes` — passed.
- `npm test -- api` — passed.
- `npm test -- PromptInspector PromptPreviewView` — passed.
- `npm test -- AppShell GenerateView PromptPreviewView App` — passed.
- `npm test -- GenerateView` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
