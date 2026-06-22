# SPEC-030 — User-Selected Scope for the Record-Hygiene Assistance Prompt

**Status**: DRAFT
Phase: post-v1 feature spec; adds an explicit, user-selected, disclosed *scope* to the existing `project-review` record-hygiene assistance prompt (whole-project default + active-working-set option) — gated on a sign-off-required `docs/FOUNDATIONS.md` amendment (Deliverable 0)
Depends on: the SPEC-027 record-hygiene surface (core `compileRecordHygienePrompt`, `buildStoryRecordHygieneSnapshot`, `/api/record-hygiene/*` routes, `RecordHygieneView`), the active-working-set store (`active_working_set.selected_records` on the generation session), and the core import-boundary rule
Governing authority: `docs/FOUNDATIONS.md` (constitutional — this spec proposes an amendment to it)
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/story-record-hygiene-prompt-template.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`
Supporting authorities: `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/user-guide.md`, `README.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It mirrors the SPEC-027 hand-authored
> preamble style (status/phase/authority blocks, premise-verification +
> scope-decisions blocks) and deliberately omits any external-generator
> evidence-ledger scaffolding — this spec was authored locally against the
> working tree.

---

## Brainstorm Context

- **Original request:** "We recently created the Record Hygiene page, but the
  prompt generation considers even deactivated story records (not in the current
  working set). … a major incident happened in a story, and we had to deactivate
  (not remove) half of the story records, and the prompt generation for record
  hygiene is polluted now with concerns regarding story records that aren't
  relevant nor active now. Figure out what we can do about this in alignment with
  `docs/**`, then create tickets in `tickets/*`."
- **Diagnosis (no source report).** "Deactivate" = removing a record from the
  active working set (`active_working_set.selected_records`); that set feeds
  *generation only*. Record Hygiene is, by deliberate SPEC-027 design, a
  **whole-project** review that never consults the working set: the snapshot
  builder calls `listRecords({ includeArchived: false })` and filters only by the
  archive + type + per-type-status predicate. The user's records are not archived
  and not terminal, so they correctly remain in the hygiene corpus.
- **Considered remedy — reversible/bulk archive (rejected by the user).** The only
  *currently* docs-aligned lever that removes a record from hygiene is
  `archived === true`, but archive is irreversible (no `unarchiveRecord`), one
  record at a time (`POST /api/records/:id/archive`), and reference-guarded — so it
  cannot serve as a "temporarily sideline half the records during incident
  recovery" gesture. A reversible/bulk-archive feature was presented as the
  no-amendment remedy; the user instead chose to amend the constitution so hygiene
  can be **scoped to the working set**, judging the whole-project-only behavior
  unusable after an incident. Reversible/bulk archive is therefore deferred (Out of
  Scope) as a still-valid independent improvement, not part of this spec.
- **Deliverable-class decision:** the request pre-authorized tickets, but the user
  redirected to a constitutional amendment, and the work touches deterministic
  prompt compilation, the compiler contract, a record-schema projection, the
  assistance source profile, and OpenRouter transport — every one of which
  `docs/ACTIVE-DOCS.md` ("When a change needs a spec") routes to a spec, and a
  constitutional amendment is spec-shaped by definition. This mirrors how SPEC-027
  introduced the surface. One spec.
- **Amendment posture:** scoping a `project-review` prompt to the active working
  set is incompatible with the literal post-SPEC-027 `docs/FOUNDATIONS.md` §9.1
  ("…across the project…") and trips the §29.3 hard fail
  (`FOUNDATIONS.md:1012`, "incompletely render its declared whole-project source
  predicate"). A deliberate, narrow amendment is therefore warranted and is
  captured as **Deliverable 0**, fenced as **sign-off-gated**: its exact wording is
  presented for explicit user sign-off, and it must not be implemented (the
  `docs/FOUNDATIONS.md` edit, or decomposition into the dependent code tickets)
  until sign-off is recorded. The amendment and its first dependent behavior land
  in the **same revision** (FOUNDATIONS §1).
- **Soundness principle baked into the design:** the §29.3 guard exists to forbid
  *silent / model / eviction-driven* shrinkage of the source, not an *explicit
  authorial choice*. The working-set scope is therefore designed as an explicit,
  user-selected, fully-disclosed, deterministic option — the active working set is
  itself a first-class authorial decision (§7) — and the full archive + status
  predicate still renders completely *within the selected scope*.

### Premise verification (operator-verified by Read/grep against the working tree)

- **Hygiene is working-set-independent today.** `record-hygiene-snapshot-builder.ts:25`
  calls `listRecords({ includeArchived: false })`; the only filter is
  `isHygieneActive` (`active-predicate.ts:35-46`), which checks archive + type +
  per-type status and **never** consults the working set. The
  `RecordHygieneRepository` interface (`record-hygiene-snapshot-builder.ts:18-22`)
  exposes no working-set accessor.
- **Working set lives on the generation session.** Stored as
  `active_working_set.selected_records` (`working-set-routes.ts:37-41`); the record
  repository already exposes `getGenerationSession()` (`record-repository.ts:371`),
  so the snapshot builder can read the scope without new storage.
- **Request shape is closed to one mode.** Core `RecordHygieneRequest` is
  `{ mode: "full_active_atomic_review" }` (`types.ts:22-24`); the compiler's
  `normalizeRequest` throws on any other mode
  (`compile-record-hygiene-prompt.ts:19,59-65`) and already renders `request_mode`
  into the prompt (`:95`). The server route rejects any non-default mode
  (`record-hygiene-routes.ts:135-138`; `allowedRequestKeys` `:11`) and calls
  `buildStoryRecordHygieneSnapshot(repository)` (`:109`).
- **Constitutional targets (verbatim-accurate).** §9.1 `project-review` bullet at
  `FOUNDATIONS.md:320`; the surrounding "does not change the active working set …
  scope/source selection must never be …" sentence at `:322`; §6.4 at `:225-227`;
  §8 project-review compilation bullet at `:273`; §29.3 whole-project hard-fail
  bullet at `:1012`; §29.4 no-eviction hard-fail bullet at `:1027` (forbids
  token-budget/model/keyword eviction — unchanged and *supportive* of an explicit
  scope). §7 active-working-set supremacy at `:252-260`.
- **Web + versions.** Source-disclosure copy at `RecordHygieneView.tsx:129`; API
  client `recordHygieneCompile`/`recordHygieneAnalyze` at `api.ts:562-569`. Current
  versions (`version.ts:25-36`): template `1.3.0`, compiler `1.5.0`, contract
  `1.6.0`; `docs/ACTIVE-DOCS.md:161` records the same. Proposed bumps: template
  `1.4.0`, compiler `1.6.0`, contract `1.7.0`.

### Scope decisions (confirmed / recommended; adjustable at Deliverable-0 sign-off)

1. **Scope is an explicit option, not a replacement.** Two modes:
   `full_active_atomic_review` (unchanged) and a new
   `active_working_set_atomic_review`. The whole-project predicate is untouched in
   the default mode.
2. **Default stays whole-project.** Preserves the existing SPEC-027 guarantee and
   the §29.3 safe default; the working-set scope is opt-in and disclosed. (The user
   may flip the default to working-set at sign-off; flagged in Risks.)
3. **The scope reads, never mutates, the working set.** No working-set write, no
   prose authority granted, no new storage/schema, no migration.
4. **Predicate complete within scope.** Inside the selected scope, the full
   archive + per-type-status predicate renders every qualifying record — no record
   in scope is hidden, ranked, evicted, or summarized.
5. **Scope is disclosed** in both the compiled prompt (`request_mode` + a scope
   line) and the inspection UI (named active scope + counts + the explicit "records
   you have not selected are excluded by your scope choice" note).
6. **Reversible/bulk archive (the alternative remedy) is out of scope** — deferred.

---

## Problem Statement

Record Hygiene (SPEC-027) is a `project-review` assistance prompt that compiles
deterministically from the complete set of non-archived, hygiene-active atomic
records across the **whole project**, with no active-working-set dependency — by
deliberate constitutional design (`FOUNDATIONS.md` §9.1, §29.3 hard fail;
`docs/story-record-hygiene-prompt-template.md` §1). This is correct for the
canonical use case (find duplicate/overlapping records anywhere in the store).

But it has no notion of *current focus*. After a story incident, a user may
sideline a large coherent set of records by removing them from the active working
set ("deactivating" them) without resolving, abandoning, archiving, or deleting
them — they intend to bring those records back. Because hygiene ignores the working
set, the review is then flooded with overlap/redundancy findings about records the
user considers inactive and irrelevant right now, drowning the findings that matter
for the records they are actually working on. With the present record-management
primitives, the only docs-aligned way to remove those records from hygiene is to
archive them, which is irreversible, one-at-a-time, and reference-guarded — not a
viable bulk, reversible "sideline for now" gesture.

The actionable conversion: give the `project-review` profile an **explicit,
user-selected, disclosed scope** so the author can run hygiene over the active
working set (their declared current focus) without changing any record's archived
state or lifecycle status. Because this narrows the source of a `project-review`
prompt, it requires a narrow `docs/FOUNDATIONS.md` amendment (Deliverable 0) that
distinguishes an explicit authorial scope from the silent/model/eviction-driven
shrinkage the §29.3/§29.4 hard fails forbid.

**Considered and rejected** (see Brainstorm Context): reversible/bulk archive (the
user chose the amendment path instead; deferred); a new "excluded-from-review" flag
separate from `archived` (duplicate authority path — `archived` already is the
canonical set-aside axis, §6.1); bulk terminal-status changes (semantically false,
lossy, per-type, not cleanly reversible); disclosure-only copy fix (necessary but
insufficient without a usable scope).

## Approach

A single, fully-constrained approach (the narrowing constraint is the user's
decision to scope hygiene to the working set plus the FOUNDATIONS soundness
requirement). Extend the existing `project-review` record-hygiene surface — never
fork it — with an explicit scope selector, holding every SPEC-027 invariant:

1. **Constitutional gating (Deliverable 0).** Amend §9.1 to permit an explicit,
   user-selected, disclosed deterministic scope for `project-review` profiles, and
   reword the §29.3 whole-project hard fail to bind to "the declared, user-selected
   scope" while forbidding any scope the user did not select or that is not
   disclosed. Legal only after sign-off; amendment + first dependent behavior ship
   in one revision.
2. **Two explicit request modes in core.** Widen `RecordHygieneRequest.mode` to
   `"full_active_atomic_review" | "active_working_set_atomic_review"`. The compiler
   stays a deterministic renderer: it renders whatever records the snapshot
   contains, in the same fixed order, and discloses the active mode/scope. Identical
   snapshot + request + versions → identical prompt.
3. **Scope applied server-side, deterministically.** The snapshot builder selects
   the scope: whole-project (current behavior) or the intersection of the
   hygiene-active corpus with `active_working_set.selected_records` read from the
   generation session. The archive + per-type-status predicate is applied
   identically within the scope; nothing inside the scope is filtered, ranked, or
   evicted. A working-set entry that is archived/terminal drops via the normal
   predicate. The malformed-row fail-closed behavior is unchanged.
4. **Disclosure everywhere.** The compiled prompt renders the active scope; the
   server response and the web page name the active scope, show in-scope counts,
   and state that records outside the selected scope are excluded by the user's
   explicit choice (distinct from archive/terminal exclusion).
5. **Quarantine and transport unchanged.** No new write controls; no working-set
   mutation from the page; secrets/full payloads never logged; loopback binding and
   the §26 quarantine rules preserved.
6. **Doc + version lockstep.** Template/compiler/contract versions bump together;
   the domain authority, compiler contract, schema projection note, `ACTIVE-DOCS`
   version note, stress suite, and user docs update in the same change.

## Deliverables

> Deliverable 0 is **sign-off-gated**: present its exact wording (below) for
> explicit user sign-off. Do not perform the `docs/FOUNDATIONS.md` edit or
> decompose Deliverables 1–6 into implementing tickets until sign-off is recorded.
> When signed off, the constitutional edit is applied **atomically in the same
> revision** as the first dependent behavior — never landed standalone.

>> I'm the user here. I'm signing off on the amendment, giving the go ahead.

### Deliverable 0 — Constitutional amendment to `docs/FOUNDATIONS.md` (SIGN-OFF-GATED)

Two narrow, additive edits. They weaken no existing hard fail; they make an
explicit authorial scope auditable and keep every silent/model/eviction path
forbidden.

**§0.1 — Replace the §9.1 `project-review` bullet (`FOUNDATIONS.md:320`).**

- From:
  > - **project-review:** a deterministic records-only projection of explicitly named story-record types across the project, with explicit archive and per-type status predicates.
- To:
  > - **project-review:** a deterministic records-only projection of explicitly named story-record types, drawn from an explicit, user-selected, disclosed scope — the whole project by default, or a narrower scope the user has explicitly chosen (for example, the active working set) — with explicit archive and per-type status predicates applied identically to every record within that scope.

**§0.2 — Add one paragraph to §9.1 immediately after the sentence at
`FOUNDATIONS.md:322`** ("…taken from hidden UI state."):

  > A project-review assistance prompt may offer more than one scope only when every
  > scope is an explicit, user-selected, deterministic, and disclosed projection. The
  > active scope must be named in the compiled prompt and surfaced in the inspection
  > UI, and the declared archive and per-type status predicates must render every
  > qualifying record within the selected scope — none hidden, ranked, summarized, or
  > omitted. Reading active-working-set membership to honor a user-selected
  > working-set scope is not a working-set mutation and grants no record any prose
  > authority. Scope selection, exactly like source selection, must never be
  > keyword-triggered, probabilistic, model-selected, token-budget-evicted, inferred
  > from accepted prose or candidates, derived from author-private notes, or taken
  > from hidden UI state.

**§0.3 — Replace the §29.3 project-review hard-fail bullet (`FOUNDATIONS.md:1012`).**

- From:
  > - Does a project-review assistance prompt hide, vary, or incompletely render its declared whole-project source predicate?
- To:
  > - Does a project-review assistance prompt hide, vary, or incompletely render the source predicate within its declared, user-selected scope; apply a scope the user did not explicitly select; or fail to disclose its active scope in the compiled prompt and the inspection UI?

Principles affected: §9.1 and §29.3. **Reviewed and requiring no change:** §6.4
(`:227`, "does not change the active working set" — reading the set to scope is not
a mutation), §8 (`:273`, the projection is still "explicit deterministic", now with
a declared scope), and §29.4 (`:1027`, the no-eviction bullet — an explicit user
scope is expressly not eviction and the §0.2 paragraph reaffirms it). The §29.3 /
§29.4 self-audit answers every existing and new hard-fail question **No**.

> >> SIGN-OFF RECORDED — 2026-06-22, user joeloverbeck: "I'm signing off on the
> >> amendment, giving the go ahead" (Deliverable-0 preamble above). The §9.1/§29.3
> >> wording is approved; the `docs/FOUNDATIONS.md` edit must land atomically in the
> >> same revision as the first dependent behavior (Deliverable 1), never standalone.

### Deliverable 1 — Core request mode, types, and compiler scope disclosure

- Widen `RecordHygieneRequest.mode` (`packages/core/src/compiler/hygiene/types.ts`)
  to `"full_active_atomic_review" | "active_working_set_atomic_review"`; default
  remains `full_active_atomic_review`. Update `normalizeRequest`
  (`compile-record-hygiene-prompt.ts:59-65`) to accept both modes and reject any
  other.
- The compiler renders the active scope: keep `request_mode` and add a
  human-readable scope line in the records/source section (e.g.
  `hygiene_scope: whole_project | active_working_set`). The compiler does **not**
  itself filter by working set — it renders the snapshot it is given (scope is
  applied upstream in Deliverable 2); this preserves the deterministic-renderer
  boundary and §8.
- Bump `packages/core/src/version.ts` to template `1.4.0`, compiler `1.6.0`,
  contract `1.7.0`; refresh all goldens and version pins in the same change.
- Golden fixtures: a whole-project golden (unchanged content, new version metadata
  + scope line) and a new working-set-scope golden (subset corpus, scope disclosed);
  the empty-working-set golden (truthful empty state distinct from empty-project).

### Deliverable 2 — Server snapshot scope selection

- Extend `RecordHygieneRepository` (`record-hygiene-snapshot-builder.ts:18-22`) and
  `buildStoryRecordHygieneSnapshot` to accept the request/mode and, for
  `active_working_set_atomic_review`, read `active_working_set.selected_records` via
  `getGenerationSession()` and restrict the candidate corpus to that set **before**
  applying the unchanged archive + per-type-status predicate. Whole-project mode is
  byte-for-byte unchanged.
- Determinism + completeness: scope membership is an explicit id-set test only —
  no ranking, salience, recency, or token-budget logic. Every in-scope record that
  satisfies the predicate is included; malformed in-scope rows still fail
  `422 malformed-hygiene-source` (a malformed row outside the scope is not part of
  the source and is not consulted — document this precisely).
- Edge cases: empty/absent working set → empty in-scope corpus → truthful empty
  state; a selected id that is archived/terminal → excluded by the normal
  predicate; a selected id that no longer exists → ignored deterministically; a
  malformed or unreadable generation-session payload → empty in-scope corpus
  (deterministically, mirroring `working-set-routes.ts:38-39`'s
  `Array.isArray(...) ? … : []` default), **not** a `422` — `422
  malformed-hygiene-source` stays scoped to malformed in-scope record rows, never
  the session read.

### Deliverable 3 — Server route mode plumbing and safety

- Update `record-hygiene-routes.ts` request parsing (`:135-138`,
  `allowedRequestKeys` `:11`) to accept both modes; pass the mode through
  `compileFromOpenProject` (`:99-116`) into the snapshot builder and compiler.
- Reaffirm transport safety unchanged: server recompiles from project state, never
  trusts a client prompt; prompts/full payloads/raw output never logged; loopback
  binding preserved; `prompt-too-large` still a send failure with no eviction or
  retry. Add a test that working-set mode reads but never writes the working set.

### Deliverable 4 — Web scope selector, disclosure, and API client

- `RecordHygieneView`: add an explicit scope control (e.g. radio "Whole project"
  (default) / "Active working set") that recompiles on change. Update the Source
  Disclosure copy (`RecordHygieneView.tsx:129`) to name the active scope, show
  in-scope counts, and state that in working-set mode "records you have not added to
  the active working set are excluded by your scope choice (not by archive or
  status)." When working-set mode yields zero in-scope records, show a distinct
  empty-scope message ("nothing in your current scope to review," distinct from "no
  hygiene-active records exist in the project"); send behavior is unchanged from the
  existing empty-project case — the truthful empty-state prompt stays inspectable and
  sendable, with no scope-specific send-disable.
- `api.ts` `recordHygieneCompile`/`recordHygieneAnalyze` (`:562-569`) pass the
  selected mode. No new write controls; no working-set **mutation** from this page —
  the scope selector reads working-set membership only. Refine the existing quarantine
  assertion (`packages/web/src/record-hygiene/RecordHygieneView.test.tsx:85`, which
  asserts no `/working set/i` control) so it forbids working-set *mutation* controls
  while permitting the read-only scope selector; keep asserting no
  apply/merge/delete/archive/status/working-set-write control (DOM + handler tests).

### Deliverable 5 — Authority-doc, schema, and contract edits (lockstep)

- `docs/story-record-hygiene-prompt-template.md`: §1 source contract — move
  active-working-set membership from "Excluded" (`:17`) to an **explicit optional
  scope selector** (whole-project default; working-set option), documenting that the
  full predicate renders within the selected scope; §8 request (`:78`) — add the
  second request mode and a scope-disclosure section line; keep §2 predicate and
  §§3–7 unchanged. Also amend the recurring normative statements the scope makes
  stale, in lockstep: the intro paragraph (`:11`, "It does not read …
  active-working-set membership …") must be reworded so reading working-set
  membership to honor the user-selected scope is permitted; §11 UI Quarantine
  (`:134`) must distinguish a read-only scope selector from a working-set *mutation*
  control (the "working-set" entry forbids mutation, not the scope toggle); and the
  Status banner (`:3`, "whole-project … hygiene assistance prompt") must read
  whole-project-default-plus-working-set-scope.
- `docs/compiler-contract.md`: contract-version pin → `1.7.0`; add the
  record-hygiene request modes and the scope-disclosure mapping to the
  record-hygiene source-mapping section (§2.2); note scope is applied in the snapshot
  builder, not the compiler. De-fix the "fixed `RecordHygieneRequest` input" wording
  (`:46`) to reflect the two modes, and qualify the §2.2 exclusion of
  "active-working-set membership" (`:49`) so it stays excluded as a *prose-prompt*
  source but is read as the user-selected scope input in working-set mode; the
  compiler "must not filter, rank, summarize, batch, or evict" clause (`:53`) is
  unchanged — scope is applied upstream in the snapshot builder.
- `docs/story-record-schema.md`: amend the §9.3 hygiene projection note to record
  the user-selected scope (reads `active_working_set.selected_records`; no stored
  fields; no effect on prose compilation, validation, or lifecycle).
- `docs/ACTIVE-DOCS.md`: update the version note (`:161`) to template `1.4.0` /
  compiler `1.6.0` / contract `1.7.0`, and update the hygiene-template registry
  description (`:33`, "Whole-project atomic-record hygiene assistance prompt") to
  reflect the whole-project-default-plus-working-set-scope surface.

### Deliverable 6 — Stress coverage, user docs, and capstone regression

- `docs/stress-suite.md` + `docs/stress-coverage-matrix.md`: add record-hygiene
  scope cases — working-set scope discloses the active scope; the predicate renders
  every in-scope record completely; empty working-set scope → truthful empty state;
  a working-set-selected-but-archived/terminal record is still excluded; whole-project
  mode unchanged.
- `docs/user-guide.md` + `README.md`: document the two hygiene scopes and when to
  use working-set scope (focus the review on what you're currently working on),
  noting whole-project remains the way to find duplicates anywhere.
- Capstone: full lint/typecheck/build/unit/golden/conformance green; prose +
  ideation goldens unchanged except expected version metadata; active-working-set
  *prose* compilation remains selected-record-only and is not affected by hygiene
  scope; no DB migration; no persisted hygiene output.

## FOUNDATIONS Alignment

| Principle / surface | Stance | Rationale |
|---|---|---|
| §9.1 project-review source profile @ compiler | **tensions → resolved by Deliverable 0** | Literal §9.1 binds project-review to "across the project"; §0.1/§0.2 introduce an explicit, user-selected, disclosed scope. Legal only after sign-off; amendment + first behavior ship together. |
| §29.3 project-review hard fail @ spec gate | **tensions → resolved by Deliverable 0** | The whole-project bullet (`:1012`) is reworded (§0.3) to bind to the declared user-selected scope while forbidding any unselected or undisclosed scope. |
| §6.4 / §8 deterministic compilation @ compile path | aligns (post-amendment) | Scope is an explicit, deterministic, disclosed id-set test applied in the snapshot builder; identical snapshot + request + versions → identical prompt; compiler stays a pure renderer. |
| §7 active-working-set supremacy @ source profile | aligns | The scope **reads** the working set (a first-class authorial decision) and never mutates it; project-review still grants no prose authority and cannot alter working-set membership. |
| §29.4 no-eviction hard fail (`:1027`) @ compiler | aligns | Scope is explicit user selection, expressly not keyword/probability/model/token-budget/hidden-UI eviction; §0.2 reaffirms the prohibition for scope selection. |
| §26 / §26.1 optional assistance output @ web + transport | aligns | Opt-in, quarantined, ephemeral; no new write/apply control; no working-set mutation from the page — unchanged. |
| §22 / §23 prompt inspection + OpenRouter secrecy @ server | aligns | Prompts, full payloads, raw output, and keys still never logged; loopback binding preserved; scope is disclosed in the inspectable prompt. |
| §24 local-first / user-owned data @ storage | aligns | Reads the existing generation-session working set; no new storage, schema, or migration. |

FOUNDATIONS-amendment determination: **warranted** (§9.1 + §29.3, Deliverable 0).
No other principle requires amendment.

## Verification

- **Core:** `RecordHygieneRequest.mode` accepts exactly the two modes; the compiler
  renders the scope line + `request_mode`; whole-project golden is unchanged except
  version metadata + scope line; working-set golden renders only the in-scope corpus
  in the same fixed order; empty-scope golden renders the truthful empty state;
  identical snapshot + request + versions → identical prompt; no core import crosses
  the ESLint boundary.
- **Server:** whole-project mode includes all non-archived hygiene-active records
  even when absent from the working set (SPEC-027 invariant intact); working-set
  mode includes exactly the in-scope hygiene-active records and no others; archived/
  terminal in-scope records excluded; a malformed in-scope row → `422
  malformed-hygiene-source`; scope reads but never writes the working set; prompts/
  payloads/raw output absent from captured logs; no eviction/retry on overflow.
- **Web:** scope control defaults to whole-project; switching recompiles; disclosure
  names the active scope and in-scope counts and explains working-set exclusion;
  empty working-set scope shows a distinct empty-scope message and leaves send
  behavior identical to the existing empty-project case (no scope-specific
  send-disable); no apply/merge/delete/archive/status/working-set-mutation control in
  DOM or handlers; the read-only scope selector is the only working-set-referencing
  control; keepers remain sessionStorage-only.
- **Cross-surface:** prose/ideation goldens unchanged except expected version
  metadata; prose active-working-set compilation stays selected-record-only and
  independent of hygiene scope; accepted prose + notes excluded from every prompt;
  readiness/validation inventories unchanged; no migration.

Gate every ticket on `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Out of Scope

- **Reversible / bulk archive** (the no-amendment alternative remedy) — a separate
  initiative; still valid if the user later wants a "set aside from *all* surfaces"
  gesture distinct from a hygiene scope. Deferred, not part of this spec.
- Any scope other than whole-project and active-working-set (saved filters, salience
  windows, type subsets, per-type scopes).
- Changing the **default** scope away from whole-project (the default stays
  whole-project unless redirected at sign-off).
- Persisting a scope preference beyond sessionStorage; any new DB table, migration,
  or persisted hygiene output.
- Mutating the active working set from the Record Hygiene page.
- Any change to prose/ideation compilation behavior, the validation inventory, or
  the §3.3 hygiene-active predicate itself.

## Risks & Open Questions

- **Amendment sign-off (blocking).** Deliverable 0 must be explicitly signed off
  before the `docs/FOUNDATIONS.md` edit or decomposition of Deliverables 1–6; the
  amendment and first dependent behavior land in one revision. If declined, the
  spec is blocked (the design is unconstitutional without it) and the reversible/
  bulk-archive alternative returns as the fallback remedy.
- **Default scope.** Set to whole-project to preserve the SPEC-027 guarantee and the
  §29.3-safe default; the user judged whole-project-only "unusable," so they may
  prefer the working-set scope as the default (or a sticky last-used scope). Decide
  at sign-off; a working-set default is constitutionally fine post-amendment because
  the scope is explicit and disclosed, but it makes hygiene review less by default.
- **Empty-scope clarity.** Working-set mode with an empty/all-excluded working set
  must read as "nothing in your current scope to review," clearly distinct from "no
  hygiene-active records exist in the project."
- **Disclosure is load-bearing for §29.3.** The reworded hard fail requires the
  active scope to be disclosed in both the compiled prompt and the UI; tests must
  assert both, not just the filtering behavior.
- **Slug.** This spec uses `record-hygiene-working-set-scope`; rename before
  decomposition if preferred.
