# SPEC-007 — Deterministic Prompt Compiler

Status: ✅ COMPLETED
Phase: Implementation Order Phase 7
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/PROMPT-COMPILER.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`
Supporting authorities: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 7 gate), `docs/prompt-template-rationale.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-006 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and supporting
  `docs/requirements-version-1/*`) to determine the next spec for `specs/`, in
  full alignment with `docs/FOUNDATIONS.md`, keeping `compiler-contract.md`,
  `prompt-template.md`, `story-record-schema.md`, and `stress-suite.md` in mind.
  Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–6 ✅ (SPEC-001…006).
  **Phase 7 — Deterministic prompt compiler** is the next link in the one-way
  dependency chain `storage → records → validation → compiler → preview →
  transport`. It sits *after* the Phase-6 validation engine (✅ SPEC-006) and
  *before* the Phase-8 prompt preview, which it feeds. The gate is verified
  against code: every compiler *input* already exists — the immutable snapshot
  constructor `buildValidationSnapshot()` (`packages/core/src/validation/snapshot.ts`)
  already assembles resolved selected records + cast bands + the eight
  generation-brief surfaces + the three story-config singletons + version
  identifiers; `whatWillCompile()` (`packages/core/src/records/compile-destinations.ts`)
  already routes record types to prompt families deterministically; the
  `POST /api/validate` route already resolves selected-record IDs to payloads.
  No compiler module, no `POST /api/compile`, and no prompt preview exist yet, so
  Phase 7 is correctly next and nothing downstream is skipped.
- **Reference material:** none externally authored — the repo docs are
  orientation; the request is the spec.
- **Scope decision (confirmed by the user during brainstorm):** **Core compiler +
  validation-gated `POST /api/compile` endpoint.** SPEC-007 ships the pure
  `@loom/core` deterministic renderer **plus** a localhost `POST /api/compile`
  route that runs validation first and returns the compiled prompt + metadata
  only when not blocked. It ships **no web preview UI** — that is Phase 8's named
  gate ("Prompt preview gated by validation"), kept cleanly separate. (Alternatives
  considered and rejected: core compiler only — defers the exercisable end-to-end
  path; core + endpoint + a read-only preview — pulls Phase 8 forward across a
  documented phase boundary.)
- **Assumptions carried (detail-level, correct if not flagged):**
  - **The compiler consumes the existing immutable snapshot** produced by
    `buildValidationSnapshot()` (records + cast bands + brief + story config +
    versions). It reads **only** the snapshot; it never queries live UI state,
    never reads accepted segments, rejected candidates, superseded regenerations,
    prompt archives, model memory, or inactive/unselected records
    (`PROMPT-COMPILER.md` "Source inputs"; `compiler-contract.md` §2).
  - **Compilation runs only after blocker-free validation.** The pure compiler
    asserts its invariants; if a required deterministic source is absent it raises
    a **bug-level error** and produces **no partial prompt** — it does not surface
    user-facing blockers for the first time (`PROMPT-COMPILER.md` "Validation
    implications"). The `/api/compile` route runs `runValidation()` first and
    refuses to compile when `isBlocked`.
  - **Version metadata is retired from placeholder.** `version.ts` currently
    carries `status: "placeholder"` / `0.0.0` for template + compiler and **no
    contract version** — SPEC-006 explicitly deferred this to Phase 7. SPEC-007
    sets stable non-placeholder template, compiler, **and** compiler-contract
    version identifiers; the reproducibility triple travels with compiler output
    metadata (`compiler-contract.md` §10; `PROMPT-COMPILER.md` "Versioning").
  - **The compiler output is in-memory and ephemeral.** It is not permanently
    archived by default and prompt-string logging is off entirely
    (`PROMPT-COMPILER.md` "Data/logic implications").
- **Final confidence:** ~96%. Which spec is settled by the dependency chain; the
  scope lever (how far up the stack) is resolved to core compiler + `/api/compile`
  endpoint.

---

## Problem Statement

After SPEC-006 the app can author every record type, curate the active working
set with explicit cast bands, fill all eight generation-brief surfaces, and run a
fail-closed validation engine that emits structured blockers/warnings and an
authoritative `isBlocked` gatekeeper value — but **there is still no way to turn a
blocker-free story state into the prompt that the external prose writer will
actually receive.** The validation engine evaluates the deterministic *sources*;
nothing yet *renders* them into the universal prompt.

`IMPLEMENTATION-ORDER.md` Phase 7 is the next link in the one-way chain and is
gated *forward* into Phases 8–10: prompt preview (Phase 8) displays the compiled
prompt, OpenRouter send (Phase 9) consumes it as transport payload, and the
candidate lifecycle (Phase 10) is the UI result of that transport. The ordering
doc is explicit that the compiler must exist *before* preview so that "prompt
preview must exist before transport," and *after* validation so the compiler "can
rely on required state and focus tags having already been checked." Building
preview or transport first would let "invalid prompt patterns ossify."

`FOUNDATIONS.md` §8 makes the compiler **constitutionally deterministic**: "a
deterministic renderer, not an intelligence layer" that must not use an LLM to
select, summarize, repair, or compress records, must not include accepted prose,
and must not silently compress active/onstage cast dossiers. §9 fixes the
universal prompt contract and its conceptual sections; §10/§28.1 forbid accepted
prose in prompts. `compiler-contract.md` already specifies the exact bridge: the
28-section order (§3), an exhaustive per-placeholder mapping with source /
requiredness / missing behavior / empty-state phrase (§4), and deterministic
empty-state rendering (§8). `prompt-template.md` is the literal template surface.

**The contract exists on paper; no compiler exists in code.** The codebase has a
mature record registry, the validation snapshot, the validation engine, and a
deterministic record→family router — but no compiler module, no section
renderers, no placeholder-resolution layer, no compile-result/metadata type, no
`/api/compile` endpoint, and the version triple is still `placeholder`.

Phase 7's job is to implement that renderer: pure, deterministic
(byte-identical output for identical snapshot + versions), no LLM, no record
mutation, no accepted prose, no silent cast compression; to map **every**
placeholder to a deterministic source with exact empty-state constants; and to
expose the compiled prompt + reproducibility metadata through a validation-gated
localhost endpoint, without a permanent prompt archive and without logging prompt
text.

## Approach

Single approach — fully constrained by `PROMPT-COMPILER.md` (the Phase-7
authority), `compiler-contract.md` §3–§4 + §8–§10 (the binding mapping and
empty-state rules), and `prompt-template.md` (the literal surface), layered on the
SPEC-001…006 package boundary: `@loom/core` stays pure (no `node:*`, no framework —
enforced by `packages/core/test/boundary.test.ts`); `@loom/server` owns I/O + HTTP;
`@loom/web` is untouched (preview is Phase 8). **No schema field is added or
renamed and no DDL / `user_version` bump occurs** — the compiler reads the
existing snapshot and never writes.

### `@loom/core` — the pure deterministic compiler

- **Compiler input.** The compiler consumes the existing immutable
  `ValidationSnapshot` (resolved selected-record payloads + cast-band assignments,
  the eight generation-brief surfaces, the three story-config singletons, and the
  version identifiers). It reads **only** the snapshot (`PROMPT-COMPILER.md`
  "Source inputs"; `compiler-contract.md` §2). It never reads accepted segments,
  rejected candidates, superseded regenerations, prompt archives, model memory, or
  inactive/unselected records. The snapshot's `versions` triple is extended to
  carry the compiler-contract version alongside template + compiler (see Version
  metadata below).
- **Placeholder mapping as a single source of truth.** A deterministic mapping
  layer realizes `compiler-contract.md` §4 exactly: for **every** placeholder in
  `prompt-template.md`, a resolver `(snapshot) → string`, a requiredness rule, a
  missing behavior, and the **exact** empty-state phrase. Empty-state phrases are
  deterministic constants copied verbatim from the §4 rows — e.g.
  `None selected for this generation` (`{hard_canon_bullets}`),
  `None currently specified` (most current-state physical fields),
  `None beyond detailed records below` (pressure summaries),
  `No active secrets or reveal locks selected` (secret lanes),
  `No audience knowledge distinct from POV specified` (`{audience_knows}`),
  `None; first local unit begins from current state` (`{recent_causal_context}`),
  `None. No accepted prose is included.` (`{prior_accepted_prose_status_or_handoff_note}`),
  `None active` / `None selected` / `None specified` / `None` per their rows. No
  empty-state is a model-authored paraphrase (`compiler-contract.md` §8).
- **Exact section order.** The renderer emits the **28 sections in the exact
  order** of `compiler-contract.md` §3 / `prompt-template.md`: `<role>`,
  `<authority_hierarchy>`, `<content_policy>`, `<story_contract>`, `<prose_mode>`,
  `<hard_canon>`, `<current_authoritative_state>`, `<immediate_handoff>`,
  `<manual_directive>`, `<pov_knowledge_constraints>`, `<audience_knowledge>`,
  `<secrets_and_reveal_constraints>`, `<active_working_set>`,
  `<active_plans_and_intentions>`, `<active_clocks>`,
  `<active_obligations_and_consequences>`, `<active_open_threads>`,
  `<active_cast_full_dossiers>`, `<present_minor_cast>`, `<offstage_relevance>`,
  `<relevant_facts_beliefs_events>`, `<locations_objects_affordances>`,
  `<physical_continuity>`, `<invention_permissions>`,
  `<contradiction_prohibitions>`, `<prose_craft>`, `<stop_rule>`,
  `<final_output_instruction>`. Constitutional sections are **never omitted**
  (`PROMPT-COMPILER.md` "Empty-state rendering"). Template-constant sections
  (`<role>`, `<authority_hierarchy>`, the prose of `<content_policy>`,
  `<invention_permissions>`, `<contradiction_prohibitions>`, `<prose_craft>`
  guidance, `<stop_rule>` guidance, `<final_output_instruction>`) render from
  frozen template constants byte-for-byte aligned with `prompt-template.md`.
- **Deterministic intra-section ordering.** Within each section, ordering follows
  `PROMPT-COMPILER.md` "Deterministic ordering": explicit user order where
  provided; else stable schema-defined grouping (reusing/extending
  `whatWillCompile()`'s family routing); then stable metadata such as
  salience/urgency where the schema defines it; then display label; then stable
  ID. Ordering is **not** model ranking and must never infer salience from prose
  fields.
- **Active/onstage cast dossier rendering, core-first, no compression.**
  Active/onstage full CAST MEMBER dossiers render **all populated fields** with
  **no silent compression** (`FOUNDATIONS.md` §8/§17; `PROMPT-COMPILER.md` "Active
  cast dossier rendering"; `compiler-contract.md` §4 `{active_onstage_full_cast_dossiers}`),
  in the deterministic core-first order: (1) identity; (2) voice anchor + voice-
  related extended fields; (3) pressure-behavior core; (4) body-presence core;
  (5) agency core; (6) remaining optional extended fields in schema order;
  (7) selected sample utterances last (≤3, default zero; obey each sample's copy
  policy label; never invent missing samples). Current voice-pressure pins compile
  near `<active_working_set>` as salience duplicates that **do not replace** the
  full dossier. Temporary cast voice overrides compile **only** for the current
  generation and **never** mutate durable CAST MEMBER records; present-minor
  overrides render only inside `{present_minor_cast_notes}`. Present-minor and
  offstage cast render in their compressed/relevance bands only.
- **Accepted-prose exclusion (constitutional).** No accepted/rejected/superseded
  prose and no automatic prose-derived summary can enter any prompt-facing field
  (`FOUNDATIONS.md` §10/§28.1; `PROMPT-COMPILER.md` "Accepted prose exclusion").
  `{prior_accepted_prose_status_or_handoff_note}` renders only the user-authored
  note or the exact constant `None. No accepted prose is included.` Warnings never
  compile into prompt text; validation-only fields (focus tags, diagnostics,
  severity, record IDs, provenance, version metadata) are never prompt-facing
  (`compiler-contract.md` §9).
- **Compile precondition + invariant assertions.** `compilePrompt(snapshot)`
  assumes a blocker-free snapshot and **asserts** that every required deterministic
  source per §4 is present. A failed assertion is a **bug-level error** that aborts
  with **no partial prompt** — it does not return user-facing blockers
  (`PROMPT-COMPILER.md` "Validation implications"). It performs **no record
  mutation, no LLM call, no record selection/ranking/summarization/repair, no
  token-budget compression, and no gap-filling** (`FOUNDATIONS.md` §8/§29.4).
- **Compile result + metadata.** `compilePrompt()` returns
  `{ prompt: string, metadata }` where `metadata` carries the reproducibility
  triple (template / compiler / contract versions), a non-reversible content
  fingerprint, and a length / token estimate — **never** API keys, secret-storage
  values, the focus tags, or any validation-only field
  (`PROMPT-COMPILER.md` "Security/privacy implications"; `compiler-contract.md` §9).
  Identical snapshot + versions → **byte-identical** prompt and identical
  fingerprint. The fingerprint is a deterministic **pure-JS** hash (no
  `node:crypto`) and the length / token estimate is a deterministic char-based
  heuristic (no external tokenizer dependency) — both stay inside the `@loom/core`
  purity boundary (`packages/core/test/boundary.test.ts` forbids all `node:*` and
  framework imports). New exports are added to `packages/core/src/index.ts`; the
  boundary test stays green.

### Version metadata — retire placeholder, add contract version

- `packages/core/src/version.ts` currently exposes `templates`/`compiler` as the
  literal type `status: "placeholder"` at `0.0.0` and exposes **no** compiler-contract
  version. SPEC-007 retires this: the `VersionInfo` interface and the `versionInfo`
  constant change the `status` literal from `"placeholder"` to `"stable"` on the
  `templates` and `compiler` keys, set each version to `1.0.0`, and **add a distinct
  `contract: { version, status }` key** (also `1.0.0` / `"stable"`), so the
  reproducibility triple (template / compiler / contract) is fully realized
  (`compiler-contract.md` §10; `PROMPT-COMPILER.md` "Versioning and change control";
  the SPEC-006 deferral note). The concrete `1.0.0` / `"stable"` values are the
  v1 baseline; later contract/template/compiler edits bump them per §10.
- `ValidationVersions` (`snapshot.ts`) is extended from `{ template, compiler }`
  to include `contract`, and the SPEC-006 `/api/validate` route is updated to pass
  it (a one-field, behavior-preserving change). Any future edit to the template
  surface, the placeholder mapping, empty-state rendering, requiredness, or
  rendered template text bumps the relevant version per `compiler-contract.md` §10.

### `@loom/server` — validation-gated localhost compile endpoint

- **`POST /api/compile`** (new `packages/server/src/compile-routes.ts`, registered
  in `server.ts` like the SPEC-005/006 routes). Requires an open project; returns
  the structured `no-open-project` error otherwise. The handler builds the snapshot
  from the open project (records + `generation_session` + story-config singletons +
  the version triple), **runs `runValidation()` first**, and:
  - if `isBlocked` → returns a structured **blocked** response carrying the
    `ValidationResult` (blockers/warnings) and **no prompt** — no partial prompt is
    ever emitted (`PROMPT-COMPILER.md` "Prompt preview boundaries");
  - else → runs `compilePrompt()` and returns `{ prompt, metadata }`.
- **One shared error contract with `/api/validate`.** `/api/compile` surfaces the
  same structured pre-validation errors the shared builder already raises in
  `validation-routes.ts`: `no-open-project` (no repository), the session-load error
  (`getGenerationSession()` fails for a reason other than `not-found`), and
  `malformed-validation-source` (a selected record ID no longer resolves). These
  are returned with the same `kind` codes and status as `/api/validate` — `no
  prompt` is emitted on any of them — so the two endpoints never drift on how they
  reject a structurally broken project.
- **Snapshot construction is shared, not duplicated.** The selected-record
  resolution + story-config/session loading currently inside `validation-routes.ts`
  is extracted into a shared server-side snapshot builder reused by both
  `/api/validate` and `/api/compile`, keeping the two endpoints on one resolution
  path (no drift between what is validated and what is compiled).
- **No mutation, no archive, no logging.** The route mutates no project data,
  persists **no** prompt (no permanent archive by default), and logs **no**
  prompt/brief/directive/voice/key text — the SPEC-001 `req` serializer already
  emits only method/url/hostname/ip; the handler logs no payloads. The server still
  binds `127.0.0.1` only.

## Deliverables

1. **`@loom/core` deterministic prompt compiler (pure).**
   - A `compilePrompt(snapshot)` entry point over the existing immutable
     `ValidationSnapshot`, returning `{ prompt, metadata }`.
   - The §4 placeholder-mapping layer: one resolver + requiredness + missing
     behavior + exact empty-state constant per placeholder in `prompt-template.md`;
     frozen template-constant blocks byte-aligned with the template.
   - The 28-section renderer in exact `compiler-contract.md` §3 order;
     deterministic intra-section ordering (user order → schema grouping →
     salience/urgency → label → ID), reusing/extending `whatWillCompile()`.
   - Core-first active/onstage cast dossier rendering with no silent compression;
     voice-pressure pins near `<active_working_set>`; temporary overrides scoped to
     the current generation; present-minor / offstage compressed bands;
     sample-utterance copy-policy handling (≤3, default zero, no invention).
   - Accepted/rejected/superseded/auto-summary prose excluded from every
     prompt-facing field; warnings and validation-only fields never prompt-facing.
   - Bug-level invariant assertion on a missing required source (no partial
     prompt); zero record mutation, zero LLM, zero selection/ranking/summarization.
   - Compile-result + metadata types (template/compiler/contract versions,
     non-reversible fingerprint, length/token estimate; no keys, no validation-only
     fields).
   - New exports in `packages/core/src/index.ts`; boundary test stays green
     (no `node:*` / framework imports).
   - Unit + golden tests (`packages/core/test/compiler*.test.ts`): the 28 sections
     render in exact order; every placeholder resolves or renders its exact
     empty-state constant; **determinism** — identical snapshot + versions produce
     byte-identical output and an identical fingerprint across repeated runs;
     active/onstage dossiers render all populated fields with no compression and in
     core-first order; voice pins duplicate without replacing dossiers; temporary
     overrides do not mutate records; accepted-prose / rejected / superseded /
     auto-summary text cannot enter prompt-facing fields; warnings and version
     metadata never appear in prompt text; a missing required source aborts as a
     bug-level error with no partial prompt; the compiler performs no mutation and
     calls no LLM.

2. **Version metadata retirement + contract version.**
   - `version.ts`: in both the `VersionInfo` interface and the `versionInfo`
     constant, flip the `status` literal from `"placeholder"` to `"stable"` on
     `templates` and `compiler`, set each version to `1.0.0`, and add a
     `contract: { version: "1.0.0", status: "stable" }` key; the reproducibility
     triple is exposed via `versionInfo`.
   - `ValidationVersions` (`snapshot.ts`) extended from `{ template, compiler }`
     with `contract`; SPEC-006 `/api/validate` updated to pass
     `contract: versionInfo.contract.version` alongside the existing
     `template`/`compiler` mapping (behavior-preserving). Tests assert the triple is
     present, non-placeholder (`status: "stable"`), and threaded into both the
     snapshot and the compile metadata.

3. **`@loom/server` `POST /api/compile` route.**
   - Shared server-side snapshot builder extracted from `validation-routes.ts` and
     reused by `/api/validate` and `/api/compile` (single resolution path).
   - `/api/compile`: builds the snapshot, runs validation first, returns a
     structured blocked response (with `ValidationResult`, no prompt) when blocked,
     else `{ prompt, metadata }`; surfaces the shared builder's structured
     pre-validation errors (`no-open-project`, session-load error, and
     `malformed-validation-source`) with the same `kind` codes and status as
     `/api/validate`, each carrying no prompt; never mutates; persists no prompt;
     logs no prompt/brief/directive/voice/key text. Registered in `server.ts`.
     **No new tables, no DDL change, no `user_version` bump.**
   - Integration tests against a temp project: blocker-free state → `{ prompt,
     metadata }` with all 28 sections and the version triple; blocked state →
     structured blocked response with **no** prompt; no-open-project → clean
     structured error; an unresolvable selected-record ID → `malformed-validation-
     source` error with **no** prompt (same shape as `/api/validate`); identical
     state → byte-identical prompt across calls;
     compile mutates nothing (record + session round-trip unchanged after a compile
     call); logs contain no prompt/brief/directive/key text; the shared builder
     keeps `/api/validate` behavior unchanged.

4. **Governing-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 7: add
     `Status: ✅ Implemented via SPEC-007 (YYYY-MM-DD).` and check the Phase-7 gate
     bullets satisfied. Do not alter ordering rationale or later phases.
   - `docs/requirements-version-1/PROMPT-COMPILER.md`: add a short "Phase 7
     implementation note" recording that the deterministic renderer, the §4
     placeholder mapping, the version triple, and the `/api/compile` endpoint are
     realized via SPEC-007, leaving prompt preview (Phase 8) and OpenRouter
     transport (Phase 9) open.
   - **If implementation finds any placeholder, requiredness rule, empty-state
     phrase, or section-order detail that the template/contract under-specifies**,
     reconcile `compiler-contract.md` / `prompt-template.md` in the **same change**
     rather than forking compiler behavior (`FOUNDATIONS.md` §8 anti-drift rule;
     `compiler-contract.md` §10 change-control). No schema field is added by this
     spec. **Known drift to resolve here:** `compiler-contract.md` §4 describes
     `<invention_permissions>` (Template constant + configured durable-change
     permissions), `<contradiction_prohibitions>` (+ selected current locks), and
     `<prose_craft>` (+ story/prose preferences + cast voice fields) as having
     dynamic sources, yet the literal `prompt-template.md` renders all three as
     placeholder-free constant prose (their dynamic content already renders
     elsewhere — e.g. selected current locks via `{current_locks}` under
     `<current_authoritative_state>`). The compiler follows the literal template
     (byte-for-byte constants); reconcile the §4 wording so the contract no longer
     implies a second render site, rather than adding placeholders to the template.
   - Archive SPEC-007 to `archive/specs/` per `docs/archival-workflow.md` once
     complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §4.4 / §8 / §29.4 Deterministic compilation; renderer not intelligence | aligns | Pure `compilePrompt` over the immutable snapshot; deterministic section + intra-section ordering; identical snapshot+versions → byte-identical prompt; zero LLM select/rank/summarize/repair @ core compiler. |
| §9 / §29.4 Universal prose prompt contract; all sections preserved | aligns | All 28 conceptual sections render in exact `compiler-contract.md` §3 order; constitutional sections never omitted; template constants byte-aligned; no provider-specific fork @ core compiler. |
| §10 / §28.1 / §29.4 No accepted prose in prompts | aligns | Accepted/rejected/superseded/auto-summary text excluded from every prompt-facing field; `{prior_accepted_prose…}` renders user note or the exact `None. No accepted prose is included.` constant @ core compiler. |
| §8 / §17 No silent active cast compression; voice is continuity | aligns | Active/onstage dossiers render all populated fields, core-first, no token-budget compression; voice pins duplicate without replacing dossiers @ core compiler. |
| §8 (empty-state) / `compiler-contract.md` §8 Deterministic empty states | aligns | Optional lists render exact verbatim empty-state constants from §4 rows, never model paraphrases; required-but-missing state is a bug-level abort, not an empty state @ core compiler. |
| §4.1 / §26 / §29.4 No LLM record authority; no record mutation | aligns | Compiler and endpoint are read-only over the snapshot; never write records or the session; no LLM intermediary @ core compiler + server. |
| §4.5 / §29.5 Fail closed; compile only after blocker-free validation | aligns | `/api/compile` runs `runValidation()` first and refuses with a blocked response (no prompt) when `isBlocked`; compiler asserts invariants and emits no partial prompt @ server + core compiler. |
| §22 / §29.9 Prompt inspection without hoarding; secret safety | aligns | In-memory prompt + metadata only; no permanent archive by default; no prompt/key logging; metadata carries no keys or validation-only fields @ core compiler + server. |
| §8 anti-drift / `compiler-contract.md` §10 Change control | aligns | Placeholder mapping treated as contract; version triple retired from placeholder; any under-specification reconciled in the contract in the same change @ core + docs. |
| §12 / §29.5 No plot-rail machinery | aligns | Renderer emits one local-prose prompt; focus tags stay validation-only and never compile as beats/acts; stop-rule renders local-unit guidance only @ core compiler. |

No §29 hard-fail is answered "yes": no LLM intermediary in compilation; output is
deterministic for identical inputs+versions; no accepted prose in prompts; no
provider-specific prompt fork in core; no universal-contract section omitted; no
record mutation; no compilation from a blocked/contradictory state (validation
gate precedes compile); no permanent prompt archive by default; no key leakage in
prompt or metadata or logs.

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test passes — the compiler imports no `node:*` and no framework.
- **Determinism**: the same snapshot + version triple produces byte-identical
  prompt output and an identical fingerprint across repeated runs.
- **Section order + completeness**: the compiled prompt contains all 28 sections
  in exact `compiler-contract.md` §3 order; no constitutional section is omitted;
  every `prompt-template.md` placeholder either resolves to its deterministic
  source or renders its exact empty-state constant.
- **Cast fidelity**: active/onstage dossiers render every populated field in
  core-first order with no silent compression; voice pins appear near
  `<active_working_set>` without replacing dossiers; temporary overrides are
  current-generation-only and mutate no record.
- **Accepted-prose exclusion**: accepted / rejected / superseded / auto-summary
  text cannot appear in any prompt-facing field; `{prior_accepted_prose…}` renders
  only the user note or the exact constant; warnings and validation-only fields
  never appear in prompt text.
- **Fail-closed compile**: `/api/compile` returns a structured blocked response
  with no prompt when validation is blocked, and `{ prompt, metadata }` only when
  not blocked; the pure compiler aborts as a bug-level error (no partial prompt) on
  a missing required source.
- **No mutation / no LLM**: a compile call leaves records and `generation_session`
  unchanged; no model transport is invoked; the prompt is not persisted.
- **Version triple**: template / compiler / contract versions are non-placeholder,
  exposed via `versionInfo`, threaded into the snapshot and the compile metadata;
  `/api/validate` still behaves identically after the shared-builder extraction.
- **Secret/key safety**: compiled prompt, metadata, and server logs contain no API
  keys or secret-storage values; the server still binds `127.0.0.1` only.
- **Stress mapping**: a representative subset of `docs/stress-suite.md` scenarios
  that fall within Phase-7 scope (e.g. a fully-populated active scene compiling all
  sections; empty-state rendering for an abstract/minimal moment; a dense
  multi-cast dossier rendering without compression) are exercised as compiler test
  fixtures and produce the expected deterministic prompt shape.
- Manual smoke: open a project; fill a blocker-free brief + working set; call
  `/api/compile`; confirm a complete, ordered, accepted-prose-free prompt with a
  stable fingerprint; introduce a blocker; confirm the endpoint refuses with no
  prompt; confirm logs contain no prompt/brief/key text.

## Out of Scope

- **Prompt preview UI / readable monospace preview / copy-search-expand / blocked-
  state preview explainer / version-metadata UI surfacing** — Phase 8. SPEC-007
  exposes the compiled prompt + metadata through `/api/compile`; it ships no web
  surface.
- **OpenRouter global settings, API-key detection, model list, non-streaming
  send** — Phase 9. The compiled prompt is transport payload for a later phase.
- **Candidate editor / regenerate / discard / accept lifecycle, accepted-segment
  archive + browser, durable-change reminder** — Phases 10–12.
- **Permanent prompt archive / prompt logging / source-map or debug provenance in
  the prompt** — not in v1 (`PROMPT-COMPILER.md`); the compiler output is in-memory
  and ephemeral.
- **Provider-specific prompt adapters / hidden model-specific prompt forks /
  token-budget compression of active cast / LLM prompt repair / LLM record
  selection-ranking-summarization / automatic prose-derived summaries** — forbidden
  in v1 core (`FOUNDATIONS.md` §8/§9; `PROMPT-COMPILER.md` "Non-goals").
- **New validation rules / changes to the SPEC-006 engine** — none; the compiler
  *consumes* validation, it does not extend it. (If a §4 source proves
  unevaluable, reconcile the contract, not the engine, in the same change.)
- **Schema changes / new tables / DDL evolution / `user_version` bump** — none
  needed; compilation is read-only over existing storage.

## Risks & Open Questions

- **Placeholder surface is large.** `prompt-template.md` has ~70 placeholders and
  `compiler-contract.md` §4 maps each. `spec-to-tickets` should batch as reviewable
  diffs, suggested: (a) core compile-result/metadata types + version-triple
  retirement (`version.ts` + `ValidationVersions` + `/api/validate` pass-through) +
  the placeholder-map scaffold + frozen template constants + the 28-section
  skeleton + fingerprint/determinism harness; (b) front-section resolvers
  (`<content_policy>`…`<secrets_and_reveal_constraints>`: story config, prose mode,
  hard canon, current authoritative state, immediate handoff, manual directive,
  POV/audience/secret lanes) + tests; (c) active-working-set + pressure summaries +
  plans/clocks/obligations/consequences/open-threads renderers + deterministic
  intra-section ordering + tests; (d) cast renderers (core-first active/onstage
  dossiers, voice pins, present-minor, offstage, temporary overrides, sample
  utterances) + tests; (e) facts/beliefs/events + locations/objects/affordances +
  physical-continuity + tail constant sections + golden full-prompt test; (f)
  server shared snapshot builder + `POST /api/compile` + tests. Each a reviewable
  diff.
- **Template-constant fidelity.** Constant blocks (`<role>`, `<authority_hierarchy>`,
  `<content_policy>` prose, `<invention_permissions>`, `<contradiction_prohibitions>`,
  `<prose_craft>`, `<stop_rule>` guidance, `<final_output_instruction>`) must match
  `prompt-template.md` byte-for-byte. Recommend a test that asserts the rendered
  constant sections equal the canonical template text so drift is caught; any
  intentional edit bumps the template version per §10. Note `<invention_permissions>`,
  `<contradiction_prohibitions>`, and `<prose_craft>` are placeholder-free in the
  literal template even though `compiler-contract.md` §4 lists "+ dynamic" sources
  for them — render them as constants and reconcile the §4 wording per Deliverable 4
  (see the "Known drift" note there).
- **"Populated enough" is validation's job, not the compiler's.** The compiler
  must not re-derive completeness heuristics; it assumes a blocker-free snapshot
  and asserts only *presence of a required deterministic source* (a bug-level
  invariant), keeping the single completeness authority in the SPEC-006 engine.
- **Empty-state phrase exactness.** Each empty-state string must be the verbatim
  constant from its §4 row (e.g. `None selected for this generation` vs.
  `None currently specified` vs. `None active`), not a unified placeholder.
  Mis-copying a phrase is a determinism/contract bug; tests should pin each
  constant to its section.
- **Fingerprint must be non-reversible, key-free, and boundary-safe.** The content
  fingerprint is a stable hash/length signal for reproducibility, never a
  recoverable prompt store; it must not embed secrets and must not become a
  permanent prompt archive. Because `@loom/core` may not import `node:*`, the hash
  must be a **pure-JS** implementation (not `node:crypto`) and the token estimate a
  deterministic char-based heuristic (not an external tokenizer); both are
  reproducibility signals, not cryptographic guarantees, so a simple stable hash
  suffices.
- **Snapshot reuse vs. a compile-specific snapshot.** The compiler reuses the
  validation `ValidationSnapshot` so validated state and compiled state cannot
  drift. If a compile-only field is ever needed, extend the shared snapshot (and
  the contract) rather than forking a parallel snapshot.
- **Resolved during brainstorm:** which spec (Phase 7); scope lever (core compiler
  + `/api/compile` endpoint; web preview deferred to Phase 8).

## Outcome

Completed: 2026-06-05

What changed:
- Implemented the pure `@loom/core` deterministic prompt compiler, including the
  version triple, 28-section renderer, placeholder registry, empty-state constants,
  deterministic fingerprint/length metadata, and resolver groups for front sections,
  pressure/causal sections, cast sections, and tail record sections.
- Added the validation-gated `POST /api/compile` route in `@loom/server` through a
  shared snapshot builder used by both `/api/validate` and `/api/compile`.
- Added compiler and server coverage for section order, placeholder rendering,
  determinism, no accepted-prose inclusion, no cast compression, secret/firewall
  separation, blocked compile refusal, no mutation, and no prompt-facing log leakage.
- Reconciled governing docs for Phase 7 completion and the known constant-section
  contract wording drift.

Deviations from original plan:
- The end-to-end smoke was performed through direct local HTTP requests to the
  production `npm start` server rather than browser clicks; the endpoint behavior was
  the required Phase 7 surface.

Verification:
- Per-ticket proof was recorded in archived tickets `SPEC007DETPROCOM-001` through
  `SPEC007DETPROCOM-008`.
- Final manual smoke passed against `http://127.0.0.1:4173`: complete prompt,
  stable prompt/fingerprint, version triple present, blocked response with no prompt,
  and no prompt/brief/directive/key text in server console output.
- Final full pipeline passed: `npm run typecheck`, `npm test`, `npm run lint`, and
  `npm run build` (Vite large-chunk warning only).
