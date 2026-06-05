# SPEC-005 — Custom Rich Editors for CAST MEMBER and the Generation-Time Brief

Status: COMPLETED
Phase: Implementation Order Phase 5
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/UI-WORKFLOWS.md`, `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`
Supporting authorities: `docs/story-record-schema.md`, `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 5 gate), `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style.

## Brainstorm Context

- **Original request:** Analyze `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  now that SPEC-004 is implemented and archived, determine which spec to create
  next in `specs/`, align it with `docs/FOUNDATIONS.md` (referencing
  `compiler-contract.md`, `prompt-template.md`, `story-record-schema.md`,
  `stress-suite.md` as needed), and create that spec. The spec must flag the
  need to update `IMPLEMENTATION-ORDER.md` and other documents on completion.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–4 ✅ (SPEC-001…004).
  **Phase 5 — Custom rich editors for CAST MEMBER and generation-time brief** is
  the next link in the one-way dependency chain
  (`storage → records → validation → compiler → preview → transport`). It sits
  *after* basic CRUD (✅ SPEC-004) and *before* the Phase-6 validation engine, so
  no dependency is violated. SPEC-004's "Out of Scope" explicitly hands the
  custom CAST MEMBER editor, the generation-brief workflow, cast inclusion bands,
  and `local_function` to Phase 5. The problem space is fully constrained by
  `UI-WORKFLOWS.md` and `DATA-MODEL-AND-RECORDS.md`, so a **single approach** is
  presented rather than competing alternatives.
- **Reference material:** none externally authored — the repo docs are
  orientation; the request is the spec.
- **Scope decisions made during brainstorm (confirmed by the user):**
  1. **One spec for both surfaces.** Phase 5 ships as a single SPEC-005 covering
     the custom CAST MEMBER editor *and* the generation-time brief workflow, then
     decomposes into per-diff tickets. The two surfaces share the
     `generation_session` storage and the new server routes, so one spec keeps
     that shared infrastructure coherent.
  2. **Curation depth — bands + conceptual preview.** This spec implements the
     gate-required cast inclusion bands (active/onstage full, present-minor,
     offstage) and `local_function`, plus the "what will compile" *conceptual*
     destination preview `UI-WORKFLOWS.md` calls for. **Deterministic
     helper/suggestion panels** (suggest missing records or focus tags) are
     **deferred to Phase 6**, because they lean on the validation engine.
- **Assumptions carried (detail-level, correct if not flagged):**
  - **POV KNOWLEDGE PROFILE / AUDIENCE KNOWLEDGE PROFILE are not authored here.**
    Per `story-record-schema.md` §6.4/§6.5 they are *compiled* generation-time
    profiles derived from records; their compilation belongs to Phase 7. Phase 5
    edits their *sources* (PROSE MODE, `selected_pov`, FACT/BELIEF/SECRET/EVENT
    records) but adds no profile-authoring surface.
  - **Phase 5 adds no fail-closed validation engine.** The brief editor's
    paste-guard on `prior_accepted_prose_status_or_handoff_note` and its
    non-local stop-guidance flag are **deterministic editor-level input
    warnings**, not the blocking validation engine (Phase 6). There is no prompt
    preview or send to gate in Phase 5.
- **Final confidence:** ~97%. Which spec is settled by the dependency chain; the
  two scope boundaries above are the only material open decisions and are now
  resolved.

---

## Problem Statement

After SPEC-004, every schema record type is reachable through typed UI, but two
Phase-5 surfaces are deliberately incomplete:

1. **CAST MEMBER editing is "complete but plain."** `UI-WORKFLOWS.md` ("CAST
   MEMBER rich editor") requires a **custom, sectioned, navigable** editor
   because voice is continuity (FOUNDATIONS §17). Today
   `packages/web/src/records/CastMemberEditor.tsx` is an 8-line thin wrapper that
   delegates to the generic registry-driven `RecordEditor` — it exposes every
   field without silent drop (Phase-4 contract satisfied) but renders the deep
   field tree (identity, the 14-field `voice_anchor`, pressure/body/agency cores,
   five optional extended groups, sample utterances) as one undifferentiated
   form. It does not make **durable identity vs. current-generation voice
   pressure** visibly distinct, has no section navigation, and gives no
   long-dossier guidance.

2. **The generation-time brief is mostly unauthorable.** All eight brief surfaces
   have closed Zod schemas in `@loom/core`
   (`packages/core/src/records/generation-brief.ts`) and persist through the
   repository's `getGenerationSession` / `setGenerationSession`
   (`generationSessionSchema`, six surfaces `.optional()` and
   `current_cast_voice_pressure` / `cast_voice_overrides` as
   `z.array(...).default([])` — every surface is omittable from a write), but only
   `active_working_set.selected_records` is editable today
   (`packages/web/src/working-set/WorkingSetView.tsx` +
   `packages/server/src/working-set-routes.ts`). The other seven surfaces —
   **CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF, MANUAL MOMENT DIRECTIVE,
   CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, GENERATION VALIDATION
   FOCUS, STOP GUIDANCE** — plus the rest of ACTIVE WORKING SET (cast inclusion
   bands, `local_function`, `selected_pov`, `manual_directive_id`) have **no UI
   and no HTTP route**.

Phase 5's job, per `IMPLEMENTATION-ORDER.md`, is to **replace the generic
surfaces where generic editing would be hostile or unsafe**: a custom rich CAST
MEMBER dossier editor and a purpose-built generation-time brief workflow, with
durable cast identity and temporary current voice pressure visibly distinct, and
the active/onstage / present-minor / offstage cast bands explicit.

This spec introduces **no deterministic validation engine (Phase 6), no prompt
compiler (Phase 7), no prompt preview (Phase 8), no OpenRouter transport (Phase
9+), and no LLM surface of any kind.** It builds editors and full-session
persistence over the existing SPEC-003 schemas and SPEC-004 repository.

## Approach

Single approach — fully constrained by `UI-WORKFLOWS.md` ("CAST MEMBER rich
editor," "Generation-time brief editor," "Active working set curation") and
`DATA-MODEL-AND-RECORDS.md` ("CAST MEMBER handling," "Generation-time brief
handling," "Active working set rules"). Layering follows the SPEC-001…004
boundary: `@loom/core` stays pure (no `node:*`, no framework), `@loom/server`
owns I/O + HTTP, `@loom/web` owns React UI. No schema field is added or renamed;
no DDL or `user_version` bump (the SPEC-003 `generation_session` table and the
every-surface-omittable `generationSessionSchema` already suffice).

### `@loom/core` (pure — UI-supporting helpers only)

- **CAST MEMBER section model (pure, deterministic).** A registry-derived,
  ordered grouping of the existing CAST MEMBER field descriptors into the
  navigable sections `UI-WORKFLOWS.md` names — identity; durable voice anchor;
  voice extended / speech-pattern; pressure behavior; body and presence; agency
  and planning; world pressure / relational charge / moral edge; perception and
  embodiment; sample utterances; anti-generic and anti-repetition warnings — in
  the `story-record-schema.md` §5.5 core-first render order
  (`identity → voice_anchor → voice_extended → pressure_behavior_core →
  body_presence_core → agency_core → remaining optional extended → sample
  utterances last`). This is presentation grouping over the SPEC-004
  descriptors; it adds **no new fields** and yields a placement for **every**
  populated and unpopulated dossier field **exactly once** (no omission, no
  duplication). The `anti_repetition_warnings` field lives inside `voice_anchor`
  and `anti_generic_warnings` inside `voice_extended`; both render **in-place
  within their parent groups** per the §5.5 nesting. "Anti-generic and
  anti-repetition warnings" therefore names a navigation/emphasis cue across
  those parents, **not** a field-relocating section — keeping the
  every-field-exactly-once invariant testable.
- **"What will compile" conceptual destination helper (pure, deterministic).**
  Given the selected records + cast band assignments, return each selected
  record's **prompt-section destination bucket** using the
  `story-record-schema.md` §13 / compiler-contract section names (e.g. "rich
  active cast dossiers," "facts/beliefs/events," "plans/clocks/obligations,"
  "locations/objects/affordances"). The helper keys on **record type** (plus the
  cast band for CAST MEMBER) into these coarse section *families*; it
  deliberately does **not** read discriminant subfields (`fact_kind`,
  `event_kind`, BELIEF holder-POV) that route a record to a finer prompt section
  — that finer routing is the Phase-7 compiler's job. This keeps the conceptual
  buckets deterministic and honest. This is a *destination grouping* for the
  curation UI — **not** compiled prompt text, **not** a prompt renderer, and it
  invokes no LLM. The actual deterministic compiler is Phase 7.
- No voice-pressure-pin computation, no POV/audience profile compilation — those
  are compiler concerns (Phase 7) and stay out of core here.
- New exports added to `packages/core/src/index.ts`; the core import-boundary
  test stays green.

### `@loom/server` (I/O + HTTP boundary)

Expose the existing `RecordRepository` generation-session methods over a
localhost-only REST surface, registered like `registerWorkingSetRoutes`. All
routes require an open project and return a structured `no-open-project` error
when none is open. Validation stays at the repository boundary
(`setGenerationSession` Zod-parses against `generationSessionSchema`); routes are
thin.

- **Generation-brief routes** (`packages/server/src/generation-brief-routes.ts`,
  or an extension of the existing working-set route module):
  - `GET /api/generation-brief` — return the full current `generation_session`
    payload (all populated surfaces), surfacing the `not-found` →
    empty-session and `malformed` (422) results from `getGenerationSession`.
  - `PUT /api/generation-brief` — **partial-merge** write of any subset of brief
    surfaces (`active_working_set`, `current_authoritative_state`,
    `immediate_handoff`, `manual_moment_directive`, `current_cast_voice_pressure`,
    `cast_voice_overrides`, `generation_validation_focus`, `stop_guidance`). The
    handler merges the provided surfaces into the existing session and writes via
    `setGenerationSession`, so a write of one surface never requires fabricating
    the others. Malformed surface payloads return a structured 400 carrying
    Zod field-level issues so the UI can field-link them.
- **Extend the active-working-set write path** so the curation UI can persist the
  full `active_working_set` surface (cast bands `active_onstage_cast_full` with
  `local_function`, `present_minor_cast_compressed`, `offstage_relevant_cast`,
  `selected_pov`, `manual_directive_id`), not only `selected_records`. Preserve
  the existing `GET/PUT /api/working-set` membership behavior for back-compat, or
  fold it into the generation-brief route surface — implementer's choice in the
  ticket phase, provided the SPEC-004 membership round-trip keeps working.
- Brief prose, directive text, and voice pressure text are **not logged**: the
  routes log no request bodies and the SPEC-001 `req` serializer emits only
  method / url / hostname / ip, so brief surfaces never reach the log stream.
  This is the protective mechanism — not field-path redaction; the existing
  redact paths cover `apiKey` / `prompt` / `candidateProse` / `acceptedProse` /
  `recordPayload`, none of which exist in these schemas.

### `@loom/web` (React + Vite)

- **Custom sectioned CAST MEMBER editor**
  (`packages/web/src/records/CastMemberEditor.tsx` becomes a real component, or a
  new `cast-member/` module; the generic delegation is removed). Driven by the
  core CAST MEMBER section model:
  - left-rail / tabbed **section navigation**; required core sections first,
    optional extended sections clearly marked optional;
  - **durable identity vs. current voice pressure visibly distinct** — the
    durable `voice_anchor` / identity sections are presented as the persistent
    dossier; the editor explains (copy + layout) that *current* voice pressure
    and *temporary* overrides live in the generation-time brief, never auto-edited
    here;
  - **long-dossier guidance**: for active/onstage cast the editor may warn about
    long dossiers and suggest stronger current pins, but **offers no automatic
    compression** (FOUNDATIONS §17 / §29.3) — warning text only;
  - **sample utterances** rendered with their `situation` / `speech_function` /
    `pressure_tags` / `copy_policy` annotations, default `copy_policy`
    `never_copy_verbatim`, kept sparse;
  - every populated field still renders (no silent drop); the editor is a
    *presentation* over the SPEC-004 descriptors and the same CRUD routes.
- **Generation-time brief workflow editor** (new `packages/web/src/generation-
  brief/` surface; replaces the disabled "Generation Brief" affordance in
  `shell/AppShell.tsx`). A purpose-built workflow, not a generic record form,
  covering the eight surfaces:
  - CURRENT AUTHORITATIVE STATE; IMMEDIATE HANDOFF; MANUAL MOMENT DIRECTIVE
    (`must_render` required); CURRENT CAST VOICE PRESSURE (per active cast member,
    keyed by `local_function`); CAST VOICE OVERRIDES (clearly labeled
    **current-generation-only**, never written back to CAST MEMBER records);
    GENERATION VALIDATION FOCUS (exactly one `generation_context`; tags marked as
    completeness checks, not plot beats); STOP GUIDANCE (prominent);
  - **prose mode / selected POV**: read the global PROSE MODE singleton and set
    `active_working_set.selected_pov`;
  - `prior_accepted_prose_status_or_handoff_note` is **clearly marked as a
    user-authored handoff field** with a deterministic **paste-guard warning** if
    text resembling pasted accepted prose is entered (FOUNDATIONS §10 / §28.1);
  - **stop guidance prominent** with a deterministic **non-local flag** when it
    requests a whole chapter, act, beat, future consequences, alternate options,
    or multiple response points (`UI-WORKFLOWS.md` "Generation-time brief
    editor"). These are **non-blocking editor warnings** in Phase 5 — the
    fail-closed blocking engine and prompt-preview/send gating are Phase 6/8.
- **Active working set curation extension**
  (`packages/web/src/working-set/`): make the **cast inclusion bands**
  (active/onstage full, present-minor compressed, offstage relevance) and each
  active/onstage member's `local_function` **explicit and editable**; show
  selected records by **prompt-section destination** via the core "what will
  compile" helper (conceptual preview before prompt preview exists). Selection
  stays manual-authority-first: **no hidden auto-selection, no silent
  add/remove/compress.** Deterministic suggestion/helper panels are deferred to
  Phase 6.
- **API client** (`packages/web/src/api.ts`): typed wrappers for the new
  generation-brief routes and the extended working-set write.

## Deliverables

1. **`@loom/core` UI-supporting helpers (pure).**
   - CAST MEMBER section model (ordered, registry-derived, core-first; covers
     every dossier field).
   - "What will compile" conceptual destination helper (selected records + cast
     bands → prompt-section buckets; deterministic; no prompt text, no LLM).
   - New exports in `packages/core/src/index.ts`.
   - Unit tests: the section model places every CAST MEMBER field **exactly
     once** in §5.5 order (no omission, no duplication; `anti_repetition_warnings`
     and `anti_generic_warnings` render within their `voice_anchor` /
     `voice_extended` parents); destination buckets are deterministic and
     stable-sorted, keyed by record type into coarse section families (no
     discriminant-subfield routing); core boundary test stays green (no `node:*`
     / framework imports added).

2. **`@loom/server` generation-brief + extended working-set routes.**
   - `GET /api/generation-brief` (full session) and `PUT /api/generation-brief`
     (partial-merge of any surface subset) over `getGenerationSession` /
     `setGenerationSession`; structured `no-open-project` / `malformed` (422) /
     field-level 400 results.
   - Extended active-working-set write persisting the full `active_working_set`
     surface (cast bands, `local_function`, `selected_pov`, `manual_directive_id`);
     SPEC-004 `selected_records` membership round-trip preserved.
   - Registered in `server.ts`. **No new tables, no DDL change, no
     `user_version` bump.**

3. **`@loom/web` UI.**
   - Custom sectioned CAST MEMBER editor replacing the generic delegation:
     section navigation; durable-identity-vs-current-voice-pressure distinction;
     long-dossier warning with **no** auto-compression; annotated sample
     utterances; every populated field rendered.
   - Generation-time brief workflow surface covering all eight surfaces, wired
     into the app shell (disabled affordance replaced); prose-mode/POV selection;
     `prior_accepted_prose_status_or_handoff_note` paste-guard; prominent stop
     guidance with non-local flag; temporary overrides scoped to generation-time
     only.
   - Active-working-set curation extended with explicit cast bands +
     `local_function` and the "what will compile" conceptual preview; manual,
     no silent mutation.
   - Extended `api.ts` client.

4. **Tests (Vitest).**
   - Core unit tests (deliverable 1).
   - Server route integration tests against a temp project: full generation-brief
     read/write round-trip; **partial-surface write** persists one surface
     without fabricating others; cast-band + `local_function` + `selected_pov` +
     `manual_directive_id` persistence; malformed surface payload → 400 with
     field issues; routes return clean structured error with no open project;
     SPEC-004 working-set membership round-trip still passes; redaction holds
     (brief/directive/voice text not logged).
   - Web component tests (Testing Library): the sectioned CAST MEMBER editor
     exposes every populated field and navigates sections; durable identity and
     current voice pressure are presented as distinct surfaces; long-dossier
     warning appears without offering auto-compression; the brief editor covers
     all eight surfaces; the `prior_accepted_prose_status_or_handoff_note`
     paste-guard fires; a non-local stop-guidance entry is flagged; a CAST VOICE
     OVERRIDE does **not** mutate the durable CAST MEMBER record; cast bands and
     `local_function` are explicit; the "what will compile" preview groups
     selected records by destination. No raw-JSON editor is presented.

5. **Governing-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 5: add
     `Status: ✅ Implemented via SPEC-005 (YYYY-MM-DD).` and check the Phase-5
     gate bullets satisfied. Do not alter ordering rationale or later phases.
   - `docs/requirements-version-1/UI-WORKFLOWS.md` and
     `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`: add a short "Phase 5
     implementation note" recording that the custom CAST MEMBER editor, the
     generation-time brief workflow, full-session persistence routes, cast
     inclusion bands + `local_function`, and the "what will compile" conceptual
     preview are realized via SPEC-005 — leaving the deterministic validation
     engine (Phase 6), the prompt compiler (Phase 7), and prompt preview (Phase 8)
     open.
   - **No `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md`
     change is required** — Phase 5 introduces no prompt placeholders and no
     schema fields. If a schema field is found during implementation to diverge
     from `story-record-schema.md`, reconcile the schema doc in the same change
     rather than forking a field name (FOUNDATIONS §8 anti-drift rule).
   - Archive SPEC-005 to `archive/specs/` per `docs/archival-workflow.md` once
     complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §8.8 / §17 Character voice is continuity; no silent compression of active cast | aligns | Custom sectioned editor surfaces the full dossier core-first; long-dossier *warning* only, never auto-compression @ CAST MEMBER editor. |
| §17 Durable voice anchor vs. current voice pressure pins distinct | aligns | Durable identity/voice sections live in the dossier editor; current voice pressure + temporary overrides live in the generation-brief surface and never auto-write the dossier @ editor + brief surfaces. |
| §6.2 / §6.3 / §7 Five surfaces distinct; active-working-set supremacy; generation-brief is the launch surface | aligns | A purpose-built brief workflow distinct from record forms; AWS curation stays manual; cast bands explicit @ brief editor + AWS curation. |
| §29.3 Active-working-set hard fails (silent add/remove/compress; cast bands as back-door compression) | aligns | Bands + `local_function` are explicit user choices; no hidden selection; a full active/onstage dossier stays full @ AWS curation + editor. |
| §10 / §28.1 No accepted prose in prompts | aligns | `prior_accepted_prose_status_or_handoff_note` marked user-authored with a deterministic paste-guard; no surface reads the accepted-segment archive @ brief editor. |
| §4.1 / §26 No LLM authority; no automatic record mutation | aligns | Temporary CAST VOICE OVERRIDES are generation-time-only and never persist to CAST MEMBER; zero LLM surface added @ brief editor. |
| §5 / §15 POV discipline | aligns | Brief editor sets `selected_pov` from PROSE MODE; POV/audience *profile compilation* deferred to Phase 7 (no profile authoring smuggled in) @ brief editor. |
| §11 / §29.5 No validation override in v1 | N/A (no engine yet) | Phase 5 adds no fail-closed engine; paste-guard and non-local stop flag are non-blocking editor warnings, not gating logic; the blocking engine + send gating are Phase 6/8 @ brief editor. |
| §2 / §12 / §29.1 No plot-rail machinery | aligns | GENERATION VALIDATION FOCUS tags labeled as completeness checks, not beats; OPEN THREAD remains the only unresolved-pressure term; no act/beat/arc widgets @ brief editor. |

No §29 hard-fail is answered "yes": no autonomous generation, no branching/plot
rails, no accepted-prose-as-canon (paste-guard), no LLM record mutation (overrides
never persist), no nondeterminism (pure helpers, deterministic destination
buckets), no silent active-working-set mutation or cast compression (explicit
bands, warning-only long dossiers), no remote sole-source-of-truth, no
secret/key leakage, no validation override (no validation engine exists yet).

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test passes — new core helpers import no `node:*` and no
  framework.
- Server route tests: full + partial generation-brief round-trips; cast-band /
  `local_function` / `selected_pov` / `manual_directive_id` persistence;
  malformed surface → 400 with field-linked issues; clean structured error with
  no open project; SPEC-004 working-set membership round-trip still green; logs
  contain no brief/directive/voice text.
- Web tests: sectioned CAST MEMBER editor exposes all populated fields and
  navigates sections; durable vs. current distinction visible; long-dossier
  warning without auto-compression; brief editor covers eight surfaces;
  paste-guard fires on `prior_accepted_prose_status_or_handoff_note`; non-local
  stop-guidance flagged; override does not mutate the durable dossier; cast bands
  explicit; "what will compile" preview groups by destination; no raw-JSON
  editor.
- Manual smoke (per `UI-WORKFLOWS.md` "Done Means"): open a project; author a
  CAST MEMBER through the sectioned editor; assign active/onstage / present-minor
  / offstage bands and `local_function`; fill the generation-time brief across all
  eight surfaces; confirm an override stays generation-time-only; confirm the
  paste-guard and non-local flag warn (but do not block — nothing to gate yet);
  server still binds `127.0.0.1` only.

## Out of Scope

- **Deterministic validation engine** (contradiction/blocker rules, field-linked
  diagnostics, the fail-closed gate) — Phase 6. Phase 5's paste-guard and
  non-local stop flag are non-blocking editor warnings, not the engine.
- **Deterministic prompt compiler, placeholder mapping, voice-pressure-pin
  computation, POV/audience knowledge-profile compilation** — Phase 7.
- **Prompt preview** (and any send-gating it implies) — Phase 8.
- **OpenRouter transport, candidate lifecycle, accepted-segment browser,
  durable-change reminder** — Phases 9–12.
- **Deterministic helper/suggestion panels** in AWS curation (suggest missing
  records or focus tags) — deferred to Phase 6 (they lean on the validation
  engine). Phase 5 ships the explicit cast bands + the conceptual destination
  preview only.
- **Story Dashboard** (working-set counts, blocker/warning counts) — still
  deferred; blocker/warning counts require the Phase-6 engine.
- **Any LLM-assisted surface** (record suggestions, handoff drafting,
  inconsistency hints) — out of v1 here entirely (FOUNDATIONS §26).
- **New tables / DDL evolution / `user_version` bump** — none needed; the
  SPEC-003 `generation_session` table and the every-surface-omittable
  `generationSessionSchema` suffice.

## Risks & Open Questions

- **Working-set route shape: extend vs. fold.** The extended `active_working_set`
  write can either keep `GET/PUT /api/working-set` and add `GET/PUT
  /api/generation-brief`, or fold membership into the brief route surface.
  Either is acceptable provided the SPEC-004 membership round-trip keeps passing;
  resolve in the ticket phase. (Repository support is confirmed:
  `setGenerationSession` accepts any optional-surface subset of
  `generationSessionSchema`.)
- **CURRENT CAST VOICE PRESSURE / CAST VOICE OVERRIDES are per-cast-member
  lists.** The brief editor must let the user add a pressure/override entry per
  active cast member keyed by `local_function`; the UI should make "override is
  current-generation-only" unmistakable to avoid any perception of durable
  mutation. Ensure list add/remove parity with the schema's array shapes. **Enum
  note:** `current_cast_voice_pressure.local_function` is a 7-value enum that
  adds `present_minor_speaker` — a superset of
  `active_working_set.active_onstage_cast_full[].local_function` (6 values). A
  CURRENT CAST VOICE PRESSURE entry carries its own `local_function`, so the
  editor must offer all 7 values and must not bind the selector to the
  active-band enum (that would silently drop the present-minor-speaker case).
- **Paste-guard heuristic must stay deterministic and non-authoritative.** The
  `prior_accepted_prose_status_or_handoff_note` guard is a best-effort textual
  warning (e.g. length/structure heuristics), not the Phase-6 blocking rule and
  not an LLM check. It must never silently mutate or block; document it as
  guidance. The authoritative accepted-prose-contamination *blocker* is Phase 6.
- **"What will compile" preview must not become a prompt renderer.** It groups
  selected records by destination section name only, keyed on record type (plus
  cast band) into coarse section families — it does **not** read discriminant
  subfields (`fact_kind`, `event_kind`, BELIEF holder-POV), assemble prompt text,
  infer salience by model judgment, or read accepted prose. The real compiler,
  which does the finer per-record section routing, is Phase 7.
- **Decomposition.** The surface is large. `spec-to-tickets` should batch as:
  (a) core CAST MEMBER section model + tests; (b) core "what will compile"
  destination helper + tests; (c) server generation-brief routes + extended
  working-set write + tests; (d) web API client extension; (e) custom sectioned
  CAST MEMBER editor; (f) generation-brief workflow surface (eight surfaces +
  paste-guard + non-local flag); (g) AWS curation extension (cast bands +
  `local_function` + destination preview). Each should be a reviewable diff.
- **Resolved during brainstorm:** which spec (Phase 5), packaging (one SPEC-005),
  and curation depth (bands + conceptual preview; helper panels deferred to
  Phase 6).

## Outcome

Completed: 2026-06-05.

What changed:

- Added pure `@loom/core` helpers for CAST MEMBER section grouping and conceptual "what will compile" destination buckets.
- Added server `GET/PUT /api/generation-brief` routes over the existing `generation_session` repository methods, preserving `/api/working-set` membership behavior.
- Added web generation-brief API wrappers, a sectioned CAST MEMBER editor, a generation-time brief workflow route, and active-working-set cast-band / `local_function` curation with destination preview.
- Updated governing Phase 5 documentation in `IMPLEMENTATION-ORDER.md`, `UI-WORKFLOWS.md`, and `DATA-MODEL-AND-RECORDS.md`.

Deviations from original plan:

- Extended `active_working_set` writes landed through `PUT /api/generation-brief`; the existing `/api/working-set` membership route remains unchanged for SPEC-004 compatibility.
- The "anti-generic and anti-repetition warnings" CAST MEMBER item is represented as a navigation/emphasis cue while the actual fields stay nested under `voice_anchor` and `voice_extended`.

Verification:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Focused unit/integration tests for the core helpers, generation-brief routes, API client wrappers, CAST MEMBER editor, generation-brief workflow, and working-set curation.
- Final smoke included `npm start` and confirmed the production server bound to `127.0.0.1` only.
