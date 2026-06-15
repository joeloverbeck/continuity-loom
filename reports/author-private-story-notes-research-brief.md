# Research brief — Author-private "Notes" feature for Continuity Loom

> **You are ChatGPT-Pro Session 2, a deep researcher.** Produce the deliverable directly.
> Do **not** interview, do **not** ask clarifying questions — the requirements below are final.
> If a genuine contradiction makes a requirement impossible, state it in the deliverable and
> proceed with the most faithful interpretation.

---

## 1. Context

The uploaded manifest (`manifest_2026-06-15_a62f975.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repository — a **local-first story-state operating system**: a
Node process serves a React UI and a localhost-only API that tracks structured story records,
compiles them into a *deterministic* prose-generation prompt, and handles segment acceptance. No
account, no cloud — data stays on the user's machine. It is an npm-workspaces ESM monorepo
(Node ≥ 24, strict TypeScript) with three packages: **`@loom/core`** (pure continuity/compiler
logic — framework- and platform-free; no `fastify`, `react`, `vite`, or `node:*` builtins),
**`@loom/server`** (Fastify localhost API + static UI host), and **`@loom/web`** (React + Vite
front end).

Governing docs: **`docs/FOUNDATIONS.md` is the constitution** (its §29 is the alignment / hard-fail
checklist every spec must clear; §1.1 is the amendment procedure); **`docs/ACTIVE-DOCS.md`** maps the
active authority hierarchy and the active-vs-archive boundary.

**Fetch every file named below from commit `a62f975` (`a62f975e08528cc713492af87d06623dd7872ed9`)** —
the uploaded manifest reflects exactly that tree. If any file you open cites a different "commit of
record," that is that file's own baseline; use `a62f975`, not the cited string.

This is a **cold-start, standalone brief** — it does not continue a prior research brief. (A
sibling, `reports/prompt-duplication-cross-segment-research-brief.md`, exists but is unrelated.)

---

## 2. Read in full (authority order)

Read these before producing. Order follows Loom's authority hierarchy (`docs/ACTIVE-DOCS.md`).

**Primary (load-bearing for this target):**

- `docs/ACTIVE-DOCS.md` — the authority map: which doc governs which surface, the active-vs-archive
  boundary, **the rule that every active `docs/*.md` must be registered here**, and the spec-vs-ticket
  intake rules. A new author-private surface and any new doc must respect this registry.
- `docs/FOUNDATIONS.md` — the project constitution. Load-bearing sections: **§2** (app identity — what
  the app is *not*), **§6** (the *five* continuity surfaces — Notes would be a sixth, and the
  enumeration is closed), **§10 / §28.1** (no accepted prose or prose-derived material in prompts),
  **§22** (prompt inspection/audit boundaries), **§24** (local-first, user-owned data), **§27** (UI
  principles — the surfaces must stay clearly distinct), **§29** (hard-fail checklist), and **§1.1**
  (amendment procedure and precedence — needed if admitting a sixth surface requires amending §6).
- `docs/story-record-schema.md` — the story-record + generation-time-brief schema. Read it to prove
  Notes are **not** a record type, **not** a generation-time field, and must stay off every
  prompt-facing and validation path. Note especially the field-economy rule and the storage-validation
  vs. readiness-validation separation.
- `docs/user-guide.md` — the user-facing local install/run/verify loop and the existing app surfaces a
  Notes view must slot beside coherently.

**Boundary-awareness (read to bound scope — *not* a conformance target):**

- `docs/compiler-contract.md` — read only to **confirm Notes introduce no new prompt placeholder, no
  compiler input, and no entry in the section-order/empty-state machinery**. This is a negative
  constraint: nothing in the Notes feature should appear here.
- `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md` — the process and ticket
  shape for the *eventual* decomposition (out of scope for this deliverable, which is the spec only).
- `README.md` — repo identity and run model, for grounding only.

**Code seams to inspect directly (read the source yourself — do not rely on this summary):**

- `packages/server/src/record-tables.ts` — SQLite `CREATE TABLE IF NOT EXISTS` declarations and the
  `story_config` table a Notes table would sit beside; `PRAGMA user_version` is the schema-version hook.
- `packages/server/src/record-routes.ts` — the canonical project-scoped CRUD route shape
  (GET/POST/PUT/DELETE, Zod request validation, `{ ok, kind, message }` discriminated error union,
  `409 no-open-project`). The Notes routes should mirror this.
- `packages/server/src/record-repository.ts` — the repository abstraction over SQLite; how payloads are
  Zod-parsed at the storage boundary and how `story_config` (kind/payload_json/updated_at) is read/written.
- `packages/server/src/project-store.ts` — `ProjectStoreManager` singleton, single-active-project session
  model, per-request project resolution, and the open-time migration steps (`ensureRecordTables`, etc.).
- `packages/core/src/project-storage.ts` — `LOOM_APPLICATION_ID`, `LOOM_SCHEMA_VERSION`, project-metadata
  schema, and store-compatibility evaluation (the migration/versioning contract).
- `packages/core/test/boundary.test.ts` — the runtime purity test that fails if `@loom/core` imports
  `fastify`/`react`/`vite`/`node:*`. Any pure Notes types placed in core must keep this green.
- `packages/web/src/shell/AppShell.tsx` — the React-Router route table + sidebar nav with
  `requiresProject` gating; where a `/notes` route registers.
- `packages/web/src/records/RecordBrowser.tsx` — the list → detail → editor surface pattern (TanStack
  Table list, detail pane, editor form) the Notes UI should mirror.
- `packages/web/src/api.ts` — the native-`fetch` client layer (`fetchJson`/`postJson`, typed
  discriminated responses) where `listNotes`/`getNote`/`createNote`/`updateNote`/`deleteNote` belong.

Supporting facts you may assume (verify against source as needed): the API is **Fastify**, binds
**`127.0.0.1` only** (`LOOPBACK_HOST` in `packages/server/src/server.ts`), serves the built UI via
`@fastify/static` with an SPA fallback; the web app uses **plain global CSS** (`packages/web/src/styles.css`,
no CSS modules/Tailwind), **React Router**, and **Context + `useState`** (no Redux/query library); tests
are **Vitest**, colocated as `*.test.ts(x)`, server routes tested via `fastify.inject()`.

---

## 3. Settled intentions (final — these make this session locked)

These were resolved with the repository owner and are **committed decisions, not options**. They
pre-empt every clarifying question.

1. **Per-story, not global.** Notes live inside an *existing* project/story and are persisted in that
   project's local SQLite store, opened and closed with the project — the same lifecycle as records and
   `story_config`. Notes are **not** a user-level/global setting (unlike the OpenRouter key).
2. **Permanent parallel scratchpad.** Notes are for the author's own brainstorming, worldbuilding,
   todos, and reminders that live alongside the structured records indefinitely. They are **not** a
   staging ground for records: there is **no** "promote note → record" conversion path, and the spec
   must not design one.
3. **Never prompt context — constitutional hard wall.** Note titles and bodies must **never** enter the
   compiled prompt, the validation/readiness snapshot, the generation-time brief, the active working
   set, the ideation prompt, or *any* compiler input — by default or otherwise. Notes are a **sixth,
   author-private surface**, deliberately *outside* FOUNDATIONS §6's five continuity surfaces. The
   feature adds **no** new prompt placeholder and **no** compiler-contract entry.
4. **Fully isolated — no record links.** A note **cannot** reference story records. Notes never touch
   the record graph, the `record_references` table, or referential-integrity validation. This is a
   deliberate anti-contamination choice that minimizes the leakage surface; do not add optional
   record-linking, tagging-by-record, or backlinks.
5. **Minimum shape is locked; richness above it is yours to research.** Every note has at least a
   **title** and a **freeform body**, and the user can **create, edit, browse, and delete** notes. Above
   that floor, **you (the researcher) decide and justify** which enhancements earn their place —
   candidates include markdown rendering, plain-text vs. rich body, full-text search, tags/labels,
   folders/categories, pinning/favoriting, manual ordering, sort options, autosave/draft behavior,
   timestamps, and soft-delete/trash. Recommend a concrete, bounded feature set with cited rationale;
   **do not** breach intentions 1–4 to add reach, and do not expand into record-coupling or
   prompt-coupling under any justification.
6. **Package boundaries and purity preserved.** Any pure note domain types / Zod schema belong in
   `@loom/core` and must keep `packages/core/test/boundary.test.ts` green (no `node:*`, `fastify`,
   `react`, `vite`). Persistence (SQLite table + migration) and HTTP routes live in `@loom/server`;
   the React surface lives in `@loom/web`. **Storage validation** (Zod shape at the persistence
   boundary) stays a separate concern from **generation/readiness validation** — which Notes do not
   participate in at all.
7. **Local-first, loopback-only, secret-safe.** Notes add **no** new network surface and travel only
   inside the local project store; note bodies are not logged by default. Every server still binds
   `127.0.0.1` only.
8. **FOUNDATIONS alignment is part of the deliverable.** Determine whether admitting a sixth
   author-private surface requires a deliberate amendment to `FOUNDATIONS.md` (most likely §6's
   five-surface enumeration, possibly §2/§27), and — if so — **draft the amendment text** following the
   §1.1 amendment procedure, and note the matching `docs/ACTIVE-DOCS.md` registry update if any new
   doc is introduced. If you conclude no amendment is required, say so explicitly with reasoning.

---

## 4. The task

Produce a **new implementation spec** (target type: *new spec*) for an author-private **Notes**
feature in Continuity Loom: titled, freeform, per-story notes the user can create, edit, browse, and
delete, persisted in the local project store and **completely walled off** from the deterministic
prompt-compilation pipeline. Ground the design in a deep survey of how comparable tools and the
research literature handle author notebooks / personal-knowledge scratch surfaces, and translate that
into a concrete, FOUNDATIONS-aligned design that fits Loom's existing storage, server, and web
patterns — choosing, within the locked constraints of §3, exactly which features above the
title-plus-body floor are worth building and why.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — follow the storage, route,
and React patterns to their real implementations and tests. **Research online as deeply as needed** —
similar implementations and the research/design literature — wherever it sharpens the deliverable, for
example:

- writer-focused notebook/scratch surfaces in tools such as **Scrivener** (Research/Notes, the
  Binder), **Obsidian** / **Logseq** (note granularity, linking, daily notes), **Notion**, **World
  Anvil**, **Campfire**, **Ellipsus**, and **bibisco** — what note model and browse/organize affordances
  writers actually use;
- **personal-knowledge-management (PKM)** and note-taking HCI research — note granularity, titling vs.
  tagging vs. foldering, findability/search, the cost of premature structure, and why isolated scratch
  surfaces succeed or fail;
- **local-first software** design (e.g. the Ink & Switch local-first essay/CRDT literature) for
  storage, durability, autosave, and conflict/edit-loss avoidance in a single-user local store;
- markdown-in-editor trade-offs (plain text vs. rendered) and lightweight full-text search over a
  small local SQLite corpus (e.g. SQLite FTS5) — *only if* you recommend search.

Cite sources for any external claim that shapes a decision. The deep research is **your** job; the
brief commissions it, it does not pre-perform it.

---

## 6. Doctrine & constraints

Honor these (they are the parts of the constitution this feature engages):

- **`docs/FOUNDATIONS.md` is the constitution.** Every product-behavior decision must satisfy it and
  clear its **§29** hard-fail checklist. A genuine divergence requires **amending FOUNDATIONS first**
  (per §1.1) — never design silently against it. Admitting a sixth surface is exactly such a deliberate
  amendment if §6 needs it (see §3.8).
- **Authority order** per `docs/ACTIVE-DOCS.md`: if a proposal conflicts with a higher authority
  (constitution > domain docs > implementation convenience), the proposal is wrong, not the authority.
  Every new active `docs/*.md` must be registered in `docs/ACTIVE-DOCS.md` in the same change.
- **No backwards-compatibility shims, aliases, or duplicate authority paths** in new work unless the
  spec explicitly justifies them.
- **Loom non-negotiable invariants this feature must not weaken:**
  - Records and user-authored generation-time fields are the continuity authority; **Notes are neither**
    and must never be treated as continuity or canon.
  - Accepted prose, rejected/superseded candidates, and automatic prose-derived summaries are **not**
    prompt context — and **neither are Notes**. Nothing in a note may reach a prompt-facing field.
  - The prompt compiler is deterministic and queries no hidden state outside the validation snapshot;
    Notes contribute **nothing** to that snapshot.
  - Validation fails closed; Notes add no blockers/warnings and do not gate Preview/Generate.
  - The active working set is explicit and user-controlled; Notes never enter it.
  - No branches, plot rails, beat packages, act machinery, or autonomous planner; Notes are inert scratch.
  - The app never uses an LLM to mutate records or notes automatically.
  - API keys are global local secrets; note bodies, like full prompts/candidates/record payloads, are
    not logged by default.
  - Project data stays local and user-owned; the only network traffic remains the prompt the user
    intentionally sends through OpenRouter; every server binds `127.0.0.1` only.
- **Package boundaries:** keep `@loom/core` pure (boundary test must stay green); persistence + routes in
  `@loom/server`; UI in `@loom/web`. Mirror existing patterns (Zod-at-boundary storage validation,
  `{ ok, kind, message }` route errors, `fastify.inject()` tests, list→detail→editor React surface,
  native-fetch `api.ts` client, plain global CSS).

---

## 7. Deliverable specification

Produce **exactly one downloadable markdown document** — a **new** file, replacing nothing:

- **Filename:** `specs/SPEC-023-author-private-story-notes.md`
  - Spec number **023** is the next free number — one past the highest `SPEC-NNN` across both `specs/`
    and `archive/specs/` (the highest present is `SPEC-022`; `specs/` is otherwise empty because active
    specs are routinely archived after implementation, so a `specs/`-only scan would collide with
    archived history). Header **`Status: DRAFT`**.
  - `assumption:` the slug `author-private-story-notes` is the intended slug; adjust only if a clearly
    better one emerges, and label the change.
- **Follow the repository's spec conventions** observed in `archive/specs/SPEC-0NN-*.md` (design stance,
  scope, schema/shape, storage, API, UI, validation, testing, FOUNDATIONS-alignment, out-of-scope).
  The spec must include, at minimum:
  1. **Design stance & scope** — what Notes are and are not; the sixth-surface framing; the five locked
     intentions restated as binding requirements.
  2. **Research grounding & rationale** — a dedicated section synthesizing the §5 survey, with citations,
     justifying the chosen feature set above the title+body floor (and explicitly listing what you
     deliberately excluded and why).
  3. **Data model** — the note shape (pure types/Zod in `@loom/core`), the SQLite table design
     (placement beside `story_config`, columns, identity/UUID, timestamps), and the migration/versioning
     approach consistent with `PRAGMA user_version` / `ensureRecordTables`.
  4. **Server API** — project-scoped Notes routes mirroring `record-routes.ts` (verbs, Zod validation,
     `{ ok, kind, message }` errors, `409 no-open-project`), with explicit loopback/secret/logging notes.
  5. **Web UI** — a `/notes` route + list→detail→editor surface mirroring `RecordBrowser.tsx`, sidebar
     nav with `requiresProject` gating, `api.ts` client functions, plain-CSS classes; how it stays
     visually and conceptually distinct from records/working-set/brief/archive per FOUNDATIONS §27.
  6. **Isolation guarantees & tests** — concrete, checkable proof that note content cannot reach any
     prompt/validation/compiler input (e.g. the compiler/readiness paths take no note input; a test
     asserting Notes contribute nothing to the prompt or snapshot); core-purity preserved.
  7. **FOUNDATIONS alignment & required amendment** — the §29 pass, and the §3.8 verdict: whether a
     FOUNDATIONS amendment (and `ACTIVE-DOCS.md` registry entry) is required and, if so, the **drafted
     amendment text**; if not, the explicit reasoning.
  8. **Out of scope** — name the excluded coupling explicitly (record links, promote-to-record,
     prompt/compiler inclusion, cross-project/global notes, sync/cloud), and defer ticket decomposition.

Do **not** produce tickets, code, or any second document. Ticket decomposition happens later via the
repository's own spec-to-tickets workflow.

**Locked / no-questions:** Produce the spec directly as a downloadable markdown document. Do not
interview, do not ask clarifying questions — the requirements above are final. If a genuine
contradiction makes a requirement impossible, state it in the deliverable and proceed with the most
faithful interpretation.

---

## 8. Self-check (run before returning)

- [ ] The deliverable is exactly one new file, `specs/SPEC-023-author-private-story-notes.md`,
      `Status: DRAFT`; nothing is replaced; no tickets/code emitted.
- [ ] All five locked intentions (per-story, permanent scratchpad, never-prompt-context, no-record-links,
      title+body floor with researcher-chosen richness) appear as binding requirements.
- [ ] The spec proves Notes contribute **nothing** to the prompt, validation snapshot, generation brief,
      working set, or compiler — with at least one checkable test/guarantee.
- [ ] `@loom/core` purity preserved (boundary test stays green); storage validation kept separate from
      readiness validation; routes/UI mirror the existing record patterns.
- [ ] No invariant in §6 is weakened; the §29 hard-fail checklist is passed and shown.
- [ ] The FOUNDATIONS §6 sixth-surface question is answered with an explicit verdict, and amendment text
      (+ `ACTIVE-DOCS.md` registry note) is drafted if required.
- [ ] Every external claim that shaped a decision is cited.
- [ ] Commit `a62f975` contains every file named in §2 (it does — the uploaded manifest is that tree).
