# SPEC-013 — Tame demo project and stress coverage

Status: DRAFT
Phase: 13 (Implementation Order — Continuity Loom v1)
Depends on: SPEC-001 … SPEC-012 (all implemented; the full create → validate → compile → preview → send → candidate → accept → archive → reminder loop exists)
Governing authority: `docs/requirements-version-1/DEMO-PROJECT-AND-STRESS-COVERAGE.md` (primary), `docs/stress-suite.md` (the 26 conceptual cases)
Engaged by relevance: `docs/story-record-schema.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/requirements-version-1/VALIDATION-ENGINE.md` — the demo's records/config/brief must conform to these; this spec adds **no** new rules to any of them.

> Section set: the canonical `specs/` set (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions) — used because no live spec in `specs/` set a house convention and archived specs do not establish it.

---

## Brainstorm Context

**Original request.** "We've implemented SPEC-012, now archived. Analyze `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (and supporting docs) to determine the next spec to create in `specs/`, aligned with `docs/FOUNDATIONS.md` and relying on `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`."

**Roadmap selection.** Phases 1–12 are all `✅ Implemented` (SPEC-001 → SPEC-012, archived). The next not-yet-implemented unit in the implementation order is **Phase 13 — Tame demo project and stress coverage**. Its phase-gate dependency ("the demo should run through real project/storage/record/validation/compiler/OpenRouter/candidate/archive paths, not special-case scaffolding") is satisfied because the full loop now exists. Next number across `specs/` (empty) + `archive/specs/` (max 012) is **013**.

**Premise verification (file:line).**

- Project metadata schema already carries an unused `isDemoFixture: z.boolean().optional()` — `packages/core/src/project-storage.ts:16`. This is the marker the demo creation path sets.
- Project create/open: `POST /api/project/create`, `POST /api/project/open` (`packages/server/src/project-routes.ts:30-71`) → `manager.createProject(input)` / `manager.openProject(folderPath)` (`packages/server/src/project-store.ts:200-351`). `createProjectInputSchema` = `{ parentPath, folderName, title, description? }` (`packages/server/src/project-store.ts:86-93`, `.strict()`); it does **not** currently set `isDemoFixture`.
- Records: created one-at-a-time via `POST /api/records` (`packages/server/src/record-routes.ts:180-219`) → `RecordRepository.createRecord(input)` (`packages/server/src/record-repository.ts:142-196`). **No bulk insert exists.**
- Record types & story-config schemas registered in `@loom/core`: registry at `packages/core/src/records/registry.ts`; STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE in `packages/core/src/records/global-config.ts:7-78`; cast/knowledge/entity/causal-pressure/relationship-emotion/space-material modules under `packages/core/src/records/`.
- Story config persisted via `RecordRepository.setStoryConfig(kind, payload)` / `getStoryConfig(kind)` (`story_config` table); routes `PUT/GET /api/story-config/:kind` (`packages/server/src/story-config-routes.ts:32-79`).
- Generation-time brief + active working set + cast bands all live in **one** `generation_session` payload persisted via `RecordRepository.setGenerationSession()` (`generation_session` table, `packages/server/src/record-tables.ts:39`); the cast inclusion bands are `active_working_set.{active_onstage_cast_full[].local_function, present_minor_cast_compressed, offstage_relevant_cast}` (`generationSessionSchema`/`activeWorkingSetSchema`, `packages/core/src/records/generation-brief.ts:5-27,158-170`). The brief is read/written over `GET/PUT /api/generation-brief` (`packages/server/src/generation-brief-routes.ts:15,33`; client `packages/web/src/api.ts:314,318`); the active working set is a slice of the same session via `GET/PUT /api/working-set` (`packages/server/src/working-set-routes.ts:21,45`). The demo orchestration writes the whole session in one `setGenerationSession` call rather than through these routes. Validation focus tags use a structured `generation_context` enum (`packages/core/src/records/generation-brief.ts:112-114`).
- Web landing/entry point: `<ProjectPicker />` at route `/` (`packages/web/src/shell/AppShell.tsx:23-33`, `packages/web/src/ProjectPicker.tsx`), the natural home for a "Create demo project" affordance.
- **No existing demo/fixture/seed loading mechanism** — searches for `demo`, `fixture`, `seed`, `Letter Under`, `Flour` found only the unused `isDemoFixture` flag and ad-hoc inline test payloads. This feature is built from scratch.

**Scope decisions (settled with the user at brainstorm time).**

1. **Blocker variants → documented + test-asserted.** Ship only the *valid* demo. Each of the 8 blocker scenarios is documented as a reproducible normal-edit recipe and asserted in tests by applying that edit and checking the blocker fires. No pre-broken fixtures and no demo-specific blocker-toggle UI.
2. **Stress coverage → new coverage-audit doc + tests.** Write a `docs/` matrix mapping all 26 stress cases → the implemented v1 capability/validation rule that supports each, backed by a capability test per risk-area.
3. **Architecture:** demo *data* lives as pure objects in `@loom/core` (purity boundary preserved); demo *creation* orchestration lives in `@loom/server` and drives the same `createProject` → `createRecord` (looped) → `setStoryConfig` → `setGenerationSession` paths a user would. No special-case compiler logic.

**Final confidence:** ~95% after scope-edge confirmation.

---

## Problem Statement

Continuity Loom has a complete v1 loop but no built-in way to exercise it end-to-end without an author hand-building a project. There is no onboarding artifact, no smoke-test fixture, and no auditable confirmation that the implemented capabilities actually cover the conceptual stress suite. Phase 13 closes this: a tame, bundled demo project that loads as ordinary local project data and walks every surface, plus a coverage audit proving the 26 stress cases are supported by real v1 capabilities.

The demo must be **tame** (general / mild suspense; no Red Bunny content, no mature material), must be **ordinary project data** (no special-case compiler/validation code paths), and must support intentional, user-reproducible validation breakage for smoke testing.

## Approach

Add an in-repo demo fixture, created through the existing normal paths:

1. **Demo data (`@loom/core`, pure).** A new fixture module exporting *The Letter Under the Flour Bin* as plain typed objects: the three story-config payloads (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE), the required records (CAST MEMBER ×2 for Elin and Niko; ENTITY for Mara Venn and Orin Ward; SECRET, OBJECT ×4, LOCATION + VISIBLE AFFORDANCE, and the PRESSURE records: EVENT ×2, BELIEF ×2, EMOTION ×2, RELATIONSHIP, INTENTION ×2, OPEN THREAD, optional CLOCK/CONSEQUENCE), and the first-segment generation-time brief (with the active working set selection, cast inclusion bands, and validation focus tags `first_segment`, `dialogue_expected`, `introspection_expected`, `secret_or_clue_pressure`, `physical_interaction_expected`, `object_use_possible`). Every payload validates against its existing record/config/brief schema. No `node:*`, no framework imports — keeps the core purity boundary intact (enforced by the boundary test).

2. **Demo creation orchestration (`@loom/server`).** A function that, given a parent path + folder name, calls `createProject` with `isDemoFixture: true` set on the metadata, then populates the project by looping the existing `repository.createRecord` over the fixture records, calling `setStoryConfig` for each config kind, and `setGenerationSession` for the brief + working set + bands. Exposed as `POST /api/project/create-demo` (a thin variant of the create route). Because it reuses the same repository/store calls, the resulting folder is indistinguishable from a hand-built project except for the `isDemoFixture` marker.

3. **Web entry point (`@loom/web`).** A "Create demo project" affordance in `ProjectPicker` that calls the new client function and then opens the created project, landing the user in the normal app shell. The created project clearly reads as sample data (its title and the `isDemoFixture` marker).

4. **Blocker recipes + tests.** Document the 8 demo blocker scenarios as normal-edit recipes; add tests that start from the valid demo, apply each edit programmatically through the normal record/brief paths, and assert the corresponding validation blocker fires and disables preview/send. Each recipe targets a specific **blocker-severity** diagnostic in the deterministic validation engine (`packages/core/src/validation/rules/*`, codes in `packages/core/src/validation/types.ts`):

   | # | Demo blocker recipe | Expected diagnostic code |
   |---|---|---|
   | 1 | Letter has two holders (Elin and Niko) | `object-current-holder-contradiction` |
   | 2 | Directive "Niko reads the letter" while it is hidden in Elin's jacket / Niko lacks access | `impossible-action-physical-context` |
   | 3 | Directive "Mara enters the cellar" with no route/timing/awareness mechanism | `offstage-interruption-missing-route` |
   | 4 | Handoff contains pasted accepted prose | `prompt-facing-prose-contamination` |
   | 5 | SECRET marks Niko protected non-holder while POV-knowledge field says Niko knows | `hidden-truth-in-pov-knowledge` |
   | 6 | Stop guidance asks for the whole chapter / mystery reveal | `local-prose-scope-violation` |
   | 7 | Active speaker Niko lacks a voice anchor | `sparse-voice-pressure` (also `matrix-dialogue-incomplete` when `dialogue_expected` is active) |
   | 8 | Physical interaction expected but positions/routes blank | `matrix-physical-interaction-incomplete` |

   Recipe 4 must target the **validation-engine** blocker `prompt-facing-prose-contamination` (`packages/core/src/validation/rules/universal-blockers.ts`), which is distinct from the Phase-5 brief-editor paste-guard — the latter is a non-blocking soft warning (`docs/requirements-version-1/UI-WORKFLOWS.md`) and does not gate preview/send.

5. **Stress coverage audit.** A new `docs/stress-coverage-matrix.md` mapping each of the 26 stress-suite cases to the implemented v1 capability/validation rule supporting it, backed by a per-risk-area capability test.

## Deliverables

- **`packages/core/src/demo/` fixture module** — pure typed demo data (story config, records, brief/working-set/bands) for *The Letter Under the Flour Bin*; each payload schema-valid; no node/framework imports.
- **`@loom/server` demo creation** — orchestration function + `POST /api/project/create-demo` route that creates the project (`isDemoFixture: true`) and populates it via the existing `createRecord` / `setStoryConfig` / `setGenerationSession` calls; returns the created `ProjectStatus`.
- **`@loom/web` "Create demo project" entry point** in `ProjectPicker`, with client function in `api.ts`, that creates then opens the demo project.
- **`docs/demo-blocker-recipes.md`** — the 8 reproducible blocker scenarios as normal-edit steps, each naming the expected blocker and its diagnostic code (see the Approach §4 mapping table).
- **`docs/stress-coverage-matrix.md`** — 26-case → v1-capability coverage audit.
- **Tests:**
  - core: fixture payloads validate against their schemas; demo set is complete (every required record type present).
  - server: `create-demo` produces a project that passes validation, compiles a prompt, and round-trips an accepted segment + durable-change reminder; demo metadata carries `isDemoFixture: true`; no API key/prompt is logged.
  - server/core: each of the 8 blocker recipes fires its blocker and disables preview/send from the valid demo baseline.
  - per-risk-area capability tests backing the coverage matrix.
  - web: `ProjectPicker` "Create demo project" calls the client and navigates into the app.

## FOUNDATIONS Alignment

| Principle / §29 hard-fail | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §29.1 Identity (no autonomous generation, no plot rails/branches) | aligns | Demo is ordinary records + a first-segment brief; no plot machinery, no branch/canon tree @ storage + records. |
| §29.3 Active working set (no silent include/remove/compress) | aligns | Demo sets an explicit working set + cast bands via `setGenerationSession`; user can inspect/edit @ working-set + brief surfaces. |
| §29.4 Prompt compilation (deterministic, no LLM intermediary, no special-casing) | aligns | Demo compiles through the unchanged deterministic compiler; identical inputs → identical prompt; no demo-specific compiler branch @ prompt-compilation. |
| §29.5 Validation (fail-closed, blockers ≠ warnings) | aligns | Valid demo passes; 8 documented blocker recipes trip real blockers that disable preview/send through the normal validation gate @ validation gate. |
| §29.6 POV & reveal (secret holders/non-holders/clues/forbidden reveals) | aligns | Demo SECRET names holder (Elin), protected non-holder (Niko), allowed cues, forbidden reveals; a blocker recipe asserts POV/secret contradiction @ records + validation. |
| §29.7 Physical continuity (positions, routes, object possession) | aligns | Demo CURRENT STATE/LOCATION/OBJECT encode positions, routes, possession; blocker recipes assert impossible-movement and access violations @ records + validation. |
| §29.8 Accepted-prose archive (reminds user; segments excluded from prompts) | aligns | Demo walks accept → archive → durable-change reminder (the surface Phase 12 closed); accepted prose never re-enters compiler inputs @ archive + compiler. **Closes the earlier interim trip** that earlier phases left open before the reminder existed. |
| §29.9 Prompt audit & secrets (no key/prompt logging, no key in story files) | aligns | Demo creation logs no prompt/key; bundled demo contains no API key; test asserts no leakage @ transport + storage. |
| §29.10 Data ownership (local ordinary data) | aligns | Demo is a normal local project folder + SQLite store, fully owned/exportable; only the `isDemoFixture` marker distinguishes it @ storage. |
| Mature-fiction envelope / Red Bunny boundary | aligns | Demo is general / mild suspense; no Red Bunny content bundled (DEMO spec §Red Bunny boundary) @ content. |

No hard-fail is tripped and no interim tension exists: Phase 12 already cleared §29.8's reminder, and the demo exercises rather than defers it. Phase 14 (hardening) follows, but Phase 13 defers nothing that trips a hard-fail.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` pass (including the core import-boundary test — fixture stays framework/node-free).
- Creating the demo via `POST /api/project/create-demo` yields a project that: opens normally, passes validation with zero blockers, compiles a non-empty deterministic prompt, previews it, accepts an (edited) candidate into the archive, and raises the durable-change reminder.
- Each of the 8 blocker recipes, applied to the valid demo, produces its named blocker and disables preview/send.
- `docs/stress-coverage-matrix.md` maps all 26 cases with a backing capability test per risk-area.
- Demo metadata has `isDemoFixture: true`; no API key or prompt text is logged during demo creation; no Red Bunny content present.

## Out of Scope

- Pre-broken demo variants or interactive blocker-toggle UI (blockers are documented + test-asserted only).
- Mocked-OpenRouter automated send test wiring beyond what existing transport tests already provide — the demo's send step is exercised manually/with existing mocks, not a new transport harness.
- Dashboard latest-segment surfacing (remains deferred per the order doc).
- Any change to compiler, validation, schema, or prompt-template behavior. The demo conforms to them; it does not amend them.
- Phase 14 hardening (golden-output stabilization, migration hardening, leakage regression suite) — separate phase.
- Bundling, packaging, or auto-loading the demo on first launch beyond the `ProjectPicker` entry point.

## Risks & Open Questions

- **One-at-a-time inserts.** No bulk insert exists; demo creation loops `createRecord`. For ~25 records this is fine, but creation should be wrapped so a mid-loop failure does not leave a half-populated project (cleanup or fail-clean). *Resolution direction:* create the folder/store, populate inside a clear success/failure boundary; on failure, surface a clear diagnostic (mirroring existing create/open diagnostics).
- **`isDemoFixture` is currently set nowhere.** `createProject` doesn't accept it; the demo path must set it on metadata. The clean path is to extend `createProjectInputSchema` (`project-store.ts:86-93`, `.strict()`) with `isDemoFixture?: boolean` and thread it into the single `projectMetadataSchema.parse({...})` call at `project-store.ts:220`. The alternative — "set the flag after metadata construction" — is not clean: `createProject` writes the metadata JSON exactly once and exposes no metadata-update method, so a post-hoc flag would require rewriting `continuity-loom.project.json` after the call returns. Both `createProjectBodySchema` (route) and `createProjectInputSchema` (store) are `.strict()`, so the field must be added explicitly to whichever schema(s) the demo path traverses.
- **Reveal-permission / CLOCK demo variant.** The DEMO spec leaves `reveal_permission` (`clue_only` vs `natural_reveal_allowed`) and the optional CLOCK to "depending on scenario." v1 demo should pick one concrete valid configuration (recommend `clue_only`, no active CLOCK) and document it; alternates belong to blocker recipes / later variants.
- **Exact valid working-set membership.** The demo brief must select a working set that validates cleanly; the precise inclusion list is a decompose-time detail to be derived from the validation focus tags and the required-records list.
- **First-segment handoff must stay contamination-free.** Because the valid demo uses `generation_context: first_segment`, `validateGenerationContextRows` (`packages/core/src/validation/rules/universal-blockers.ts:412`) fires the `prompt-facing-prose-contamination` blocker on the *valid* baseline unless `prior_accepted_prose_status_or_handoff_note` passes `isCleanNoAcceptedProseNote` (e.g. the DEMO source's `None. No accepted prose is included.`) **and** no handoff field contains a `CONTINUATION_MARKERS` phrase (`as above`, `as before`, `from the previous segment`, `continue from last time`) or a `CONTAMINATION_MARKERS` phrase. The DEMO source wording already complies; decomposition must preserve this when authoring the fixture brief.
