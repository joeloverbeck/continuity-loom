# Research brief — Private Notes usability redesign for Continuity Loom

> **You are ChatGPT-Pro Session 2, a deep researcher.** Produce the deliverable directly.
> Do **not** interview, do **not** ask clarifying questions — the requirements below are final.
> If a genuine contradiction makes a requirement impossible, state it in the deliverable and
> proceed with the most faithful interpretation.

---

## 1. Context

The uploaded manifest (`manifest_2026-06-22_90d17f8.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repository — a **local-first story-state operating system**: a
Node process serves a React UI and a localhost-only API that tracks structured story records,
compiles them into a *deterministic* prose-generation prompt, and handles segment acceptance. No
account, no cloud — data stays on the user's machine. It is an npm-workspaces ESM monorepo
(Node ≥ 24, strict TypeScript) with three packages: **`@loom/core`** (pure continuity/compiler
logic — framework- and platform-free; no `fastify`, `react`, `vite`, or `node:*` builtins),
**`@loom/server`** (Fastify localhost API + static UI host), and **`@loom/web`** (React + Vite
front end).

Governing docs: **`docs/principles/FOUNDATIONS.md` is the constitution** (its §29 is the alignment / hard-fail
checklist every spec must clear; §1.1 is the amendment procedure and precedence rule);
**`docs/ACTIVE-DOCS.md`** maps the active authority hierarchy and the active-vs-archive boundary.

**Fetch every file named below from commit `90d17f8`
(`90d17f8b2e868b90b2f536316e06438e994098cf`)** — the uploaded manifest reflects exactly that tree.
If any file you open cites a different "commit of record," that is that file's own baseline; use
`90d17f8`, not the cited string.

### This brief continues — and modifies — an already-implemented feature

This is **not** a cold start. The **Private Notes** surface already exists in the shipped app. It
was designed by `archive/specs/SPEC-023-author-private-story-notes.md`, which was itself
commissioned by the predecessor research brief
`archive/reports/author-private-story-notes-research-brief.md`. **SPEC-023's recommendations are
merged, live code** — so this brief is a *baseline shift*, not just prior findings.

What is already live at commit `90d17f8` (do **not** re-recommend these as new — they are the
floor this redesign starts from):

- **Per-story, author-private notes** persisted in the project's local SQLite store
  (`story_notes` table at `LOOM_SCHEMA_VERSION = 2`), opened/closed with the project.
- Each note has: `id` (UUIDv7), `title` (≤160 chars), `body` (markdown, ≤200 000 chars),
  `tags` (string array, ≤12, normalized/deduped), `pinned` (boolean), `createdAt`, `updatedAt`.
- A flat list → detail → editor React surface at `/notes` with: full-text-ish `q` search, single
  `tag` filter, `pinned` filter (all/only/unpinned), five `sort` options, safe markdown rendering,
  ~900ms autosave, and hard delete with confirm.
- A **constitutional hard wall**: notes are FOUNDATIONS §6.6's *sixth, author-private surface*,
  deliberately outside the five continuity surfaces, and are proven by firewall/isolation tests to
  never reach any prompt, validation, readiness, compiler, working-set, OpenRouter, or
  prompt-inspection path.

**Reconsiderable vs. fixed in this pass.** The *feature set above the hard wall* (flat model, the
filter/sort UX, tags, pinning, autosave, hard-delete-only) **is open to redesign**. The
**isolation invariants of §8 below are not** — they are the reason the feature was built the way it
was, and they survive this pass untouched.

This brief shares vocabulary with, but is distinct from, the broader schema/record work in
`archive/reports/continuity-loom-schema-audit-pass-2.md` and the record-hygiene work in
`archive/reports/story-record-hygiene-assistant-change-proposal.md` — those concern **story
records** (continuity authority, prompt-facing). Private Notes are the *opposite* surface
(author-private, never prompt-facing); do not conflate them or import record-side mechanisms that
would breach the wall.

---

## 2. Read in full (authority order)

Read these before producing. Order follows Loom's authority hierarchy (`docs/ACTIVE-DOCS.md`).

**Primary (load-bearing for this target):**

- `docs/ACTIVE-DOCS.md` — the authority map: which doc governs which surface, the active-vs-archive
  boundary, the rule that **every active Markdown document under `docs/` must be registered here**, and the
  spec-vs-ticket intake rules. Any new doc or registry impact of this redesign must respect it.
- `docs/principles/FOUNDATIONS.md` — the constitution. Load-bearing sections (all grep-confirmed at `90d17f8`):
  **§2** (app identity — what the app is *not*); **§6.6 "Author-private story notes"** — the exact
  wall this redesign must not breach (notes never enter validation snapshots, readiness, compiler
  inputs, prose/ideation/assistance prompts, OpenRouter bodies, active-working-set membership,
  record-reference graphs, or prompt inspection; the app must not infer canon from notes, **promote
  notes to records, or link notes to records**); **§22** (prompt inspection/audit boundaries);
  **§24** (local-first, user-owned data); **§27** (UI/workflow principles — notes must stay
  *clearly distinct* from the five continuity surfaces and **labeled/arranged so the user can tell
  they are inert scratch**); **§29.12 "Author-private notes hard fails"** (the specific hard-fail
  gate — titles, bodies, **tags, metadata, previews, summaries, or derived material** must never
  influence any prompt/validation/working-set/inspection path, and a note must never be a
  record-reference target/source or promote-to-record staging item); **§29** (the full hard-fail
  checklist); **§1.1** (amendment procedure + precedence — needed only if a structural change
  touches §6.6/§27/§29.12).
- `archive/specs/SPEC-023-author-private-story-notes.md` — the spec that built the feature; its
  design stance, data model, API, UI, isolation guarantees, and locked intentions are the baseline
  this redesign modifies. Read what was deliberately *excluded* and why before proposing to add it.
- `archive/reports/author-private-story-notes-research-brief.md` — the predecessor brief; the
  research already commissioned and the locked constraints, so you do not re-commission completed
  work or re-litigate settled boundaries.
- `docs/specs/story-record-schema.md` — *boundary-awareness*: read to **prove** notes remain not a record
  type, not a generation-time field, and off every prompt-facing/validation path. Nothing in this
  redesign should add a record/brief entry.
- `docs/user-guide.md` — the user-facing local loop and the existing app surfaces the Notes view
  must keep sitting beside coherently.

**Boundary-awareness (read to bound scope — *not* a conformance target):**

- `docs/specs/compiler-contract.md` — read only to **confirm Notes introduce no new prompt placeholder,
  no compiler input, and no section-order/empty-state entry**. This is a negative constraint:
  nothing in this redesign should appear here.
- `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md` — the process and ticket
  shape for the *eventual* decomposition. Out of scope for this deliverable (which is the
  change-proposal document only), but grounds how it will land downstream.
- `README.md` — repo identity and run model, for grounding only.

### Inspect, not read in full (code seams)

Read the source yourself; do not rely on any summary. These are the seams this redesign touches:

- `packages/core/src/story-notes.ts` — the pure note domain types + Zod schemas (`StoryNote`,
  create/update inputs, tag normalization, ID generation). The shape to evolve; any new pure types
  belong here and must keep `@loom/core` pure.
- `packages/core/test/story-notes.test.ts`, `packages/core/test/compiler-context-firewall.test.ts`,
  `packages/server/src/story-notes-isolation.test.ts` — the **isolation/firewall proofs**
  (sentinel-canary tests asserting note content never appears in any compiled prompt, validation,
  readiness, generation, ideation, OpenRouter request, or log). These must stay green; the redesign
  must extend them to cover any new fields/derived material.
- `packages/core/test/boundary.test.ts` — the runtime purity test (fails if `@loom/core` imports
  `fastify`/`react`/`vite`/`node:*`). Any new core note code must keep it green.
- `packages/server/src/record-tables.ts` — the SQLite `CREATE TABLE IF NOT EXISTS` declarations,
  the `story_notes` table + its indexes, and where a new table/column would sit.
- `packages/server/src/story-notes-repository.ts` — the repository layer over the notes table
  (`listNotes`/`getNote`/`createNote`/`updateNote`/`deleteNote`/`listTags`, search/sort/filter SQL).
- `packages/server/src/story-note-routes.ts` — the project-scoped REST routes
  (`GET/POST/PUT/DELETE /api/notes`, Zod request validation, `{ ok, kind, message }` error union,
  `409 no-open-project`).
- `packages/server/src/record-routes.ts` — the canonical record-route pattern the notes routes
  mirror; reference for any new verbs.
- `packages/server/src/story-notes-migration.test.ts`, `packages/server/src/project-store.ts`,
  `packages/core/src/project-storage.ts` — the **migration/versioning contract**:
  `LOOM_SCHEMA_VERSION`, `PRAGMA user_version`, `evaluateStoreCompatibility`, and the idempotent
  open-time migration steps. This is how any shape change must preserve existing notes (see §8.7).
- `packages/web/src/notes/NotesView.tsx`, `NoteEditor.tsx`, `NoteDetail.tsx`, `safe-markdown.tsx` —
  the current list→detail→editor UI, autosave, filters/sort, markdown render, and the
  "Author-private · never sent to prompts" boundary badge. The surface to redesign.
- `packages/web/src/shell/AppShell.tsx` — the React-Router route table + sidebar nav with
  `requiresProject` gating; where `/notes` registers and where new note routes would.
- `packages/web/src/api.ts` — the native-`fetch` client layer (`listNotes`/`getNote`/… typed
  discriminated responses) where any new client functions belong.
- `packages/core/src/version.ts` — the template/compiler/contract version constants. Confirm this
  redesign touches **none** of them (notes are not a prompt/compiler surface).

Supporting facts you may assume (verify against source as needed): the API is **Fastify**, binds
**`127.0.0.1` only**, serves the built UI via `@fastify/static` with SPA fallback; the web app uses
**plain global CSS** (`packages/web/src/styles.css`, no CSS modules/Tailwind), **React Router**, and
**Context + `useState`** (no Redux/query library); tests are **Vitest**, colocated as
`*.test.ts(x)`, server routes tested via `fastify.inject()`.

---

## 3. Settled intentions (final — these make this session locked)

Resolved with the repository owner; **committed decisions, not options**. They pre-empt every
clarifying question.

1. **This is a delta on the live SPEC-023 feature, not a fresh build.** Treat the floor described
   in §1 as already shipped. The *feature set above the isolation wall* (flat model, filter/sort
   UX, tags, pinning, autosave, hard-delete-only) is **open to redesign**; the isolation invariants
   (§8) are **fixed**.

2. **The deliverable is a change-proposal precursor document, not a numbered spec.** You output a
   standalone downloadable markdown change document that the repository owner's coding agent will
   later turn into a numbered spec via Loom's own pipeline (research-brief → change document → spec
   → tickets). **Do not assign a `SPEC-NNN` and do not author the deliverable in spec form.** As
   *downstream context only*, the change document may note that it will land as
   `specs/SPEC-029-<slug>.md` (the next free number — one past the highest `SPEC-NNN` across both
   `specs/` and `archive/specs/`, which is `SPEC-028`); you do **not** claim that number.

3. **The problem to solve is the find → assemble → orient workflow for prepping the next scene.**
   The owner's current ritual: review all notes, identify which parts matter for the next scene to
   write, copy/paste fragments from many notes into one new working note, and empty out / remove
   notes as needed. The real burden is **(a) finding** the relevant material scattered across many
   notes, **(b) assembling** fragments and whole notes into a scene-prep working surface without
   laborious manual copy/paste, and **(c) keeping the big picture** across a large flat note set.
   The cleanup/deletion step itself is **not** the burden (see intention 4).

4. **Consumed-note lifecycle: permanent deletion is the desired end state.** When note material has
   been *rendered into a written scene*, it is "consumed" and should be **permanently removable**
   (hard delete is wanted — **not** archive/soft-delete/recover) so it stops cluttering the active
   view and never confuses future searches. The normal arc of finishing a novel funnels notes into
   written scenes, shrinking the note set over time. **Consumption is a manual user judgment**:
   there is **no** automatic detection and **no** link from a note to a scene, record, or accepted
   prose segment (such a link is constitutionally forbidden — §6.6/§29.12). You may design
   affordances that make manual retirement of consumed material fast and safe, but you must not
   build a note→scene/record association to detect or drive it.
   - *Caveat distinct from this:* intention 7 (existing notes survive the change) is about
     **data already at rest before the migration**, not about consumed-note deletion. Permanent
     deletion of consumed notes by the user is fine; silent loss of a user's existing notes during
     the upgrade is not.

5. **Mixed granularity.** Material is consumed and assembled at **both** the whole-note level and
   the fragment-within-a-note level (a single note often holds material for several scenes).
   Design for both; do not assume a note maps 1:1 to a scene.

6. **Structural depth is yours to research and recommend — a bounded delegation.** Whether the right
   answer is incremental usability polish or a redesigned note model is **your** call, justified by
   research, and bounded by intentions 7–10. Candidates you should weigh and explicitly accept or
   reject *with cited rationale* include (non-exhaustive): note hierarchy / folders / nesting;
   note→note links, backlinks, or transclusion/embedding; an outliner / block model;
   multi-note / side-by-side / a dedicated composition (scene-prep) surface; saved searches or saved
   views / smart filters; improved local full-text or fuzzy search (e.g. SQLite FTS5);
   richer tagging or tag hierarchies; note splitting/merging; drag-to-collect fragments into a
   working set. Recommend a **concrete, bounded** feature set; **list what you deliberately
   excluded and why.** Do not breach intentions 7–10 to add reach.

7. **Migration safety is a hard requirement.** The owner has real production notes in a live story
   store. After this change, **every existing note must remain loadable** — via a migration if the
   shape changes. Follow the existing contract: `LOOM_SCHEMA_VERSION` / `PRAGMA user_version` /
   `evaluateStoreCompatibility` and the **idempotent open-time migration** pattern in
   `project-store.ts` (mirroring how `story_notes` itself was added at v1→v2). Structural change is
   allowed; when the shape changes you **must specify the migration path** (forward-fill defaults,
   new tables/columns, index changes) such that no existing note's title/body/tags/pin/timestamps
   are lost or rendered unreadable. State the new `LOOM_SCHEMA_VERSION` if you bump it.

8. **Local-first / no new network surface (anchor).** Default: this redesign adds **no** new
   OpenRouter/LLM/cloud surface over notes. "Finding relevant material" must be solved by **local**
   means (local full-text/fuzzy/semantic search computed on-device, e.g. SQLite FTS5), not a remote
   call. Notes add no logging of bodies by default; every server still binds `127.0.0.1` only. If
   you conclude any assistive surface (e.g. an LLM helper over notes) is genuinely warranted, you
   must **explicitly reconcile it with FOUNDATIONS §24 and SPEC-023's "no new network surface"
   intention, and flag it as requiring deliberate reconsideration** — never assume it, and never let
   it create a path by which note content could reach a model that also serves prompts.

9. **The constitutional hard wall is preserved and is not reconsiderable.** See §6 (doctrine) and §8
   (self-check). Note content **and any new derived material** (search index, previews, tags,
   metadata, summaries, embeddings) must never reach validation, readiness, the active working set,
   the compiler, any prompt (prose/ideation/assistance), any OpenRouter request body, prompt
   inspection, or the record-reference graph. **No note→record links. No promote-note-to-record
   path.** *Note→note* linking is **not** forbidden by SPEC-023 or FOUNDATIONS and may be proposed —
   but a note→note link must itself stay entirely author-private and never become a record reference.

10. **Package boundaries and purity preserved.** Pure note domain types / Zod belong in
    `@loom/core` and must keep `packages/core/test/boundary.test.ts` green (no `node:*`, `fastify`,
    `react`, `vite`). Persistence (table + migration) and HTTP routes live in `@loom/server`; the
    React surface lives in `@loom/web`. Storage validation (Zod at the persistence boundary) stays a
    separate concern from generation/readiness validation — which notes do not participate in at all.

11. **FOUNDATIONS-amendment determination is part of the deliverable.** The sixth surface is
    *already admitted* (§6.6 exists). Determine whether any structural change you propose requires a
    deliberate amendment to §6.6 (its enumeration of what notes are/are-not), §27 (the
    distinct-and-labeled UI requirement), or §29.12 (the hard-fail gate). If yes, **draft the
    amendment text** following the §1.1 procedure and note any `docs/ACTIVE-DOCS.md` registry update.
    If no amendment is required, **say so explicitly with reasoning.** (This is a determination to
    record inside the change document, not a separate doc-overhaul deliverable.)

---

## 4. The task

Produce a **change-proposal document** (target type: *new spec precursor*) recommending concrete
improvements to Continuity Loom's existing author-private **Private Notes** surface, so that the
owner's real workflow — finding relevant material across many notes, assembling fragments and whole
notes into a scene-prep working surface, keeping the big picture, and permanently retiring consumed
material — becomes markedly less laborious. Ground the design in a deep survey of how comparable
writing/notebook/PKM tools and the research literature handle author scratch surfaces, note
granularity, findability, composition, and lifecycle, then translate that into a concrete,
FOUNDATIONS-aligned set of changes that fits Loom's existing storage, server, and web patterns and
preserves the constitutional isolation wall and the owner's existing production notes. Decide, within
the bounded delegation of §3.6, exactly how far the structural change should go and justify it.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files in §2 — follow the storage, route,
migration, and React patterns to their real implementations and tests. **Research online as deeply
as needed** — similar implementations and the research/design literature — wherever it sharpens the
deliverable, and **cite sources for any external claim that shapes a decision.** Useful directions
(non-prescriptive):

- writer-focused notebook/scratch and *composition* surfaces in tools such as **Scrivener**
  (the Binder, the Scratchpad, Collections, Split view), **Obsidian** / **Logseq** (note
  granularity, `[[wikilinks]]`, backlinks, block references/transclusion, outlining),
  **Notion**, **Ulysses**, **Bear**, **bibisco**, **World Anvil**, **Campfire** — what note model,
  *gather-and-compose* affordances, and lifecycle/retirement patterns writers actually use when
  pulling scattered material into one working surface;
- **personal-knowledge-management (PKM)** and note-taking HCI research — note granularity, the cost
  of premature structure, foldering vs. tagging vs. linking, findability/search, and why "atomic
  notes + links" or "outliner/block" models help or hurt *assembly* tasks specifically;
- **information-foraging / sensemaking** literature (e.g. Pirolli & Card; the "shoebox → evidence
  file" sensemaking loop) — directly relevant to "scan everything, collect the relevant bits,
  assemble a working set";
- **local-first software** design (e.g. the Ink & Switch local-first literature) for durable
  storage, autosave/edit-loss avoidance, and migration in a single-user local SQLite store;
- lightweight **local full-text / fuzzy search** over a small SQLite corpus (e.g. **SQLite FTS5**,
  trigram/`LIKE` trade-offs) — for the "finding relevant material" burden, computed on-device;
- markdown plain-text vs. rendered editing trade-offs, and transclusion/embedding mechanics if you
  recommend them.

The deep research is **your** job; this brief commissions it, it does not pre-perform it.

---

## 6. Doctrine & constraints

Honor these (the parts of the constitution this feature engages):

- **`docs/principles/FOUNDATIONS.md` is the constitution.** Every product-behavior decision must satisfy it and
  clear its **§29** hard-fail checklist (especially **§29.12**, the author-private-notes hard
  fails). A genuine divergence requires **amending FOUNDATIONS first** (per §1.1) — never design
  silently against it.
- **Authority order** per `docs/ACTIVE-DOCS.md`: constitution > domain docs > implementation
  convenience. If a proposal conflicts with a higher authority, the proposal is wrong, not the
  authority. Every new active Markdown document under `docs/` must be registered in `docs/ACTIVE-DOCS.md` in the same
  change.
- **No backwards-compatibility shims, aliases, or duplicate authority paths** in new work unless the
  change explicitly justifies them. (A schema *migration* that preserves existing notes is **not** a
  shim — it is the required upgrade path of §3.7, and is expected.)
- **Loom non-negotiable invariants this redesign must not weaken:**
  - Records and user-authored generation-time fields are the continuity authority; **notes are
    neither** and must never be treated as continuity or canon.
  - Accepted prose, rejected/superseded candidates, and prose-derived summaries are not prompt
    context — **and neither are notes, nor any material derived from notes** (search indexes,
    previews, tags, summaries, embeddings). Nothing in or derived from a note may reach a
    prompt-facing field, the validation snapshot, readiness, the active working set, the
    record-reference graph, or prompt inspection.
  - The prompt compiler is deterministic and queries no hidden state outside the validation
    snapshot; notes contribute **nothing** to it.
  - Validation fails closed; notes add no blockers/warnings and do not gate Preview/Generate.
  - The active working set is explicit and user-controlled; notes never enter it.
  - No branches, plot rails, beat packages, act machinery, or autonomous planner; notes are inert
    scratch.
  - The app never uses an LLM to mutate records — or notes — automatically. (And per §3.8, adds no
    new LLM/network surface over notes without explicit, flagged reconsideration.)
  - API keys are global local secrets; note bodies, like full prompts/candidates/record payloads,
    are not logged by default.
  - Project data stays local and user-owned; the only network traffic remains the prompt the user
    intentionally sends through OpenRouter; every server binds `127.0.0.1` only.
- **Package boundaries:** keep `@loom/core` pure (boundary test green); persistence + routes +
  migration in `@loom/server`; UI in `@loom/web`. Mirror existing patterns (Zod-at-boundary storage
  validation, `{ ok, kind, message }` route errors, `fastify.inject()` tests, list→detail→editor
  React surface, native-fetch `api.ts` client, plain global CSS, `requiresProject` route gating).

---

## 7. Deliverable specification

Produce **exactly one downloadable markdown document** — a standalone **change-proposal
precursor**, replacing nothing in the repo:

- **Hand-off filename:** `private-notes-usability-change-proposal.md` (a hand-off artifact name, **not**
  a repo path). **Do not** assign it a `SPEC-NNN` and **do not** write it in spec form — it is the
  document a coding agent will later convert into a spec.
  - *Downstream context only:* you may note that it is expected to land as
    `specs/SPEC-029-<slug>.md` with `Status: DRAFT` (029 = next free number past `SPEC-028`, the
    highest across `specs/` + `archive/specs/`). You do not claim or author that spec.
  - `assumption:` a reasonable slug is `private-notes-usability`; the coding agent may refine it.

The change-proposal document must include, at minimum:

1. **Problem & goals** — restate the find → assemble → orient burden (§3.3), the mixed-granularity
   reality (§3.5), and the consumed-note lifecycle (§3.4) as the goals the redesign serves. Make
   explicit that this is a delta on the live SPEC-023 feature (§1), and what the current floor is.
2. **Research grounding & rationale** — a dedicated section synthesizing the §5 survey **with
   citations**, justifying the chosen feature set above the current floor, and **explicitly listing
   what you considered and deliberately excluded, and why** (e.g. why a full block/outliner model is
   or isn't worth it here; foldering vs. linking vs. saved views; FTS5 vs. simpler search).
3. **Recommended changes (the design)** — the concrete, bounded feature set, organized by the three
   burdens (finding / assembling / orienting) plus the consumed-note retirement flow. For each
   change: what it does, how it serves the workflow, and how it stays inside §8's wall.
4. **Data model & migration** — the evolved note shape (pure types/Zod in `@loom/core`), any new
   SQLite tables/columns/indexes (placement beside `story_notes`), identity/UUID/timestamps, and a
   **concrete migration plan** per §3.7 (new `LOOM_SCHEMA_VERSION` if bumped, the idempotent
   open-time migration steps, forward-fill defaults) that **preserves every existing note**. State
   explicitly what an existing v2 note looks like after migration.
5. **Server API** — the project-scoped route deltas mirroring `record-routes.ts`/
   `story-note-routes.ts` (verbs, Zod validation, `{ ok, kind, message }` errors,
   `409 no-open-project`), with explicit loopback/secret/logging notes. Search/assembly endpoints
   stay local-only.
6. **Web UI** — the redesigned `/notes` surface: the find/assemble/orient affordances and the
   consumed-note (hard-delete) retirement flow, mirroring Loom's list→detail→editor pattern,
   `requiresProject` gating, `api.ts` client functions, plain-CSS classes, and the
   "Author-private · never sent to prompts" boundary labeling — staying visually/conceptually
   distinct from the five continuity surfaces per FOUNDATIONS §27.
7. **Isolation guarantees & tests** — concrete, checkable proof that note content **and any new
   derived material** cannot reach any prompt/validation/compiler/working-set/inspection/OpenRouter
   path: name the existing firewall/isolation tests
   (`compiler-context-firewall.test.ts`, `story-notes-isolation.test.ts`, `story-notes.test.ts`)
   and specify how each new field/index/feature extends them (e.g. a sentinel canary in any new
   field asserted absent from every compiled output and log). Confirm `@loom/core` purity preserved.
8. **FOUNDATIONS alignment & amendment determination** — the §29 / §29.12 pass shown, and the §3.11
   verdict: whether §6.6/§27/§29.12 need amending and, if so, the **drafted amendment text** (per
   §1.1) plus any `docs/ACTIVE-DOCS.md` registry note; if not, the explicit reasoning.
9. **Out of scope** — name the excluded couplings explicitly: note→record links, promote-note-to-record,
   any prompt/compiler/validation/working-set inclusion, cross-project/global notes, cloud/sync, and
   any LLM-over-notes surface (unless §3.8-reconciled and flagged). Defer ticket decomposition to
   Loom's spec-to-tickets workflow.

Do **not** produce tickets, code, or a second document.

**Locked / no-questions:** Produce the change-proposal document directly as a downloadable markdown
file. Do not interview, do not ask clarifying questions — the requirements above are final. If a
genuine contradiction makes a requirement impossible, state it in the deliverable and proceed with
the most faithful interpretation.

---

## 8. Self-check (run before returning)

- [ ] The deliverable is exactly one downloadable markdown change-proposal document named
      `private-notes-usability-change-proposal.md`; it is **not** a `SPEC-NNN` and is **not** written in
      spec form; nothing in the repo is replaced; no tickets/code emitted.
- [ ] The proposal is framed as a **delta on the live SPEC-023 feature** (§1), not a fresh build; it
      does not re-recommend the already-shipped floor as new.
- [ ] The three burdens (finding / assembling / orienting) and the **mixed-granularity** reality are
      each addressed; the **consumed-note lifecycle is permanent hard-delete, manual, with no
      note→scene/record link** (§3.4).
- [ ] A **migration plan preserves every existing note** (§3.7); the post-migration shape of an
      existing v2 note is stated; `LOOM_SCHEMA_VERSION` change (if any) is named.
- [ ] The **constitutional wall holds**: note content and any new derived material reach **no**
      prompt, validation snapshot, readiness, compiler input, active working set, OpenRouter body,
      prompt inspection, or record-reference graph; **no note→record link, no promote-to-record**;
      the §29.12 hard fails are all answered "no"; isolation/firewall tests are named and extended.
- [ ] **No new network/LLM surface** over notes unless explicitly §3.8-reconciled and flagged;
      "finding relevant material" is solved by **local** search.
- [ ] `@loom/core` purity preserved (boundary test stays green); storage validation kept separate
      from readiness validation; routes/UI/migration mirror existing patterns.
- [ ] The §6.6/§27/§29.12 amendment question is answered with an explicit verdict, and amendment text
      (+ any `ACTIVE-DOCS.md` registry note) is drafted if required.
- [ ] Every external claim that shaped a decision is cited.
- [ ] Commit `90d17f8` contains every file named in §2 (it does — the uploaded manifest is that
      tree).
