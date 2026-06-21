# SPEC-027 — Record-Hygiene Assistance Prompt and Quarantined Review Page

**Status**: COMPLETED
Phase: post-v1 feature spec; adds a second assistance prompt class (project-review record hygiene) plus its menu-accessible review page — gated on a sign-off-required `docs/FOUNDATIONS.md` amendment (Deliverable 0)
Depends on: the existing deterministic prose/ideation compilers, the ideation assistance surface (`/api/ideate`, `IdeateView`, session keepers), the record repository (`listRecords`), the OpenRouter client, and the core import-boundary rule
Governing authority: `docs/FOUNDATIONS.md` (constitutional — this spec proposes an amendment to it)
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/ideation-prompt-template.md`
Supporting authorities: `docs/validation-rule-inventory.md`, `docs/narrative-theory-blocker-roadmap.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/user-guide.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`, `README.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the
> external-generator evidence-ledger preamble (`Target commit:` /
> fetch-provenance / raw-URL acquisition ledger in the source proposal's
> Appendix A), because this spec was authored locally against the working tree,
> not fetched at an exact commit — matching the SPEC-024 / SPEC-025 / SPEC-026
> precedent.

---

## Brainstorm Context

- **Original request:** Analyze `reports/story-record-hygiene-assistant-change-proposal.md`
  and create a spec in `specs/*` with what is actionable, aligned with `docs/**`
  unless amendments are also warranted.
- **Source report:** `reports/story-record-hygiene-assistant-change-proposal.md` —
  a 17-section "Branch A change proposal" that returns a verdict (add a dedicated
  records-only `record_hygiene` assistance prompt and a quarantined **Record
  Hygiene** page; do **not** add a similarity/embedding/validation detector in
  v1) and supplies a fully-specified, normative design: source contract,
  hygiene-active predicate, relation/action taxonomies, per-type and cross-type
  overlap rules, prompt section order, snapshot/types, server routes, web page
  shape, and the exact `docs/FOUNDATIONS.md` / active-doc amendments. The proposal
  prescribes its own decomposition (§14 lists 7 workstreams) and explicitly
  nominates itself for `specs/SPEC-027-<slug>.md`, leaving the slug to the coding
  agent.
- **Spec number:** `SPEC-027` — highest existing is `SPEC-026` (active in
  `specs/`); `archive/specs/` tops out at `SPEC-025`. The proposal anticipated
  this number.
- **Deliverable-count decision:** **one spec.** The request asked for "a spec"
  (singular); the proposal is a single coherent, self-decomposing feature whose
  constitutional, core, server, and web workstreams share one toolchain and one
  source contract and must land coherently (the amendment and first dependent
  behavior must ship in the same revision). The repo's spec→tickets workflow
  decomposes the 7 workstreams downstream.
- **Deliverable-class decision:** the request pre-authorized a spec; this work
  touches deterministic prompt compilation, the compiler contract, record-schema
  projection, OpenRouter transport, and a new LLM-assistance surface — every one
  of which `docs/ACTIVE-DOCS.md` ("When a change needs a spec") routes to a spec.
  The pre-authorized class is correct.
- **Amendment posture:** the design is incompatible with the current literal
  `docs/FOUNDATIONS.md` §9.1 (which defines *every* assistance prompt as compiled
  from the prose-prompt sources). A deliberate, narrow constitutional amendment is
  therefore warranted and is captured as **Deliverable 0**, fenced as
  **sign-off-gated**: its exact wording is presented for explicit user sign-off,
  and the amendment must not be implemented (the `docs/FOUNDATIONS.md` edit, and
  the spec's decomposition into the dependent code tickets) until that sign-off is
  recorded. The amendment and its first dependent behavior land in the **same
  revision** (FOUNDATIONS §1; proposal §1.3, §10).

### Premise verification (operator-verified by Read/grep against the working tree)

`git rev-parse HEAD` returns `ab375e97e03785e2dbd5cec8a045569f435a6849` — **exactly**
the proposal's stated target commit (Appendix A). The proposal's "not independently
verified as latest main" freshness caveat is therefore mooted; it audited current
`HEAD`, which strengthens its repository-state premises. Every load-bearing premise
below was verified directly, not relayed from a sub-agent line range:

- **Version pins.** `packages/core/src/version.ts` sets `templates.version`
  `"1.1.0"`, `compiler.version` `"1.3.0"`, `contract.version` `"1.4.0"` — exactly
  the proposal's "from" values. Proposed bumps: template → `1.2.0`, compiler →
  `1.4.0`, contract → `1.5.0` (proposal §7.5, §11.2). `docs/ACTIVE-DOCS.md`
  version note and `docs/compiler-contract.md` contract-version pin must update in
  the same revision.
- **FOUNDATIONS replace-targets (all verbatim-accurate).**
  `docs/FOUNDATIONS.md:223` `### 6.4 Generated prompt`;
  `docs/FOUNDATIONS.md:264` `## 8. Deterministic prompt compilation`;
  `docs/FOUNDATIONS.md:308` `### 9.1 Assistance prompt class` whose first sentence
  is "compiled from the **same authority sources as the prose prompt** (story
  configuration, active working set, generation-time fields)" — the exact tension
  the amendment resolves; `docs/FOUNDATIONS.md:1009` `### 29.3` first bullet is
  exactly `Does it silently include records the user did not select?` (the §10.4
  replace-target); `### 29.4` (1015) and `### 29.5` (1023) exist for the §10.5/10.6
  additions; `## 26` / `### 26.1` (862/882) already codify opt-in, quarantine,
  provenance, ephemeral-by-default assistance-output rules the design rides on.
- **Ideation parallels (the design mirrors these surfaces).**
  `packages/server/src/ideate-routes.ts:19` `registerIdeateRoutes`, route
  `POST /api/ideate`, wired at `packages/server/src/server.ts:93`;
  `packages/core/src/compiler/compile-prompt.ts:107` `compilePrompt(snapshot:
  ValidationSnapshot, …)` (the hygiene compiler must be a **separate** entry
  point, not an overload of this);
  `packages/core/src/compiler/ideation/citation-keys.ts` `citationKey` /
  `citationKeysFor` produce `[type-n]` keys;
  `packages/server/src/ideation-parse.ts:18` `parseIdeationResponse(text,
  validCitationKeys)` returns `{ ok:false, raw }` on malformed output, surfaced by
  the route as `{ ok:true, malformed:true, raw }`;
  `packages/web/src/ideate/keepers.ts:1` uses `sessionStorage` key
  `loom.ideate.keepers.v1`;
  `packages/web/src/shell/AppShell.tsx:28` route shape `{ to, label,
  requiresProject }` (Ideate at :36) and `RequireProject` wrapper (:146), routes
  declared `<Route path="/ideate" element={<RequireProject>…} />` (:130);
  `packages/web/src/api.ts:457` `ideate()` via `postJson`, `:434`
  `compileIdeation()` via `postJson("/api/compile", { promptKind:"ideation", … })`;
  `eslint.config.js:56-80` `no-restricted-imports` forbids `fastify`/`react`/`vite`
  and `node:*` in `packages/core/src/**`.
- **Premise correction — malformed-row handling.** The proposal §6.3 says the
  snapshot builder must fail "never silently drop malformed records **as the
  general list route currently does**." Verified false at the repository layer:
  `packages/server/src/record-repository.ts:306` `listRecords({ type?,
  includeArchived? })` does **not** silently drop malformed rows — it returns each
  as `{ ok:false, kind:"malformed-record" }` (`:293-316`). The *desired*
  behavior is unchanged and in fact easier: `buildStoryRecordHygieneSnapshot`
  must inspect each `RecordReadResult`, and **fail with `422
  malformed-hygiene-source` on any `ok:false` row** rather than filtering it out.
  The stale "as the general list route currently does" rationale must not be
  copied into the durable authority doc; cite the actual mechanism instead.

---

## Problem Statement

Continuity Loom's atomic-record design deliberately separates many record types
(FACT, EVENT, BELIEF, SECRET, EMOTION, RELATIONSHIP, INTENTION, PLAN, CLOCK,
OBLIGATION, CONSEQUENCE, OPEN THREAD, LOCATION, OBJECT, VISIBLE AFFORDANCE, ENTITY
STATUS). Repeated authoring across many accepted segments predictably produces
multiple **record instances** that purport to own the same current assertion or
pressure. This is a clerical failure mode, not an exceptional data error, and it
is distinct from the *authority-path* duplication that SPEC-025 (schema audit pass
2) removed: this spec reviews duplicate/overlapping **instances** authored under
valid schemas. No existing surface offers a whole-project review of near-duplicate
records — the active working set is intentionally local to one generation, and the
Records grid is a raw editor, not a semantic, type-aware comparator.

**Considered and rejected for v1** (proposal §1.2, §12): an exact-string/fingerprint
detector, weighted lexical similarity, local embeddings in `@loom/core`,
deterministic validation warnings, and a manual checklist as the *sole* solution.
Each either supplies *candidates* rather than *story-state adjudication*, demands a
labeled Loom corpus that does not yet exist, would pollute the deterministic
validation inventory with heuristics, or (embeddings in core) would break the
framework/platform-free boundary. Entity-resolution practice separates candidate
generation from match adjudication; a score would look more authoritative than it
is. **Chosen:** an external-LLM assistance prompt that compiles deterministically,
renders the full structured corpus, and returns provenance-bearing, quarantined,
session-scoped recommendations the author adjudicates manually. Its
non-determinism is acceptable *only because* compilation is deterministic, output
is quarantined and inspectable, and no mutation is possible. Local embeddings in
`@loom/server` remain the technically-permissible home for a *future* calibrated
candidate generator and are explicitly deferred until a labeled
false-positive/false-negative corpus exists.

The complete normative design lives in the source proposal and is reproduced as
durable authority in the new `docs/story-record-hygiene-prompt-template.md`
(Deliverable 1). This spec is the actionable conversion: the constitutional
amendment, the new authority doc + registry/active-doc edits, the core compiler,
the server snapshot/parser/routes, the web page, version pins, and the test/stress
regime.

## Approach

A single, fully-constrained approach (the proposal supplies a proven design; the
narrowing constraint is the proposal plus `docs/ACTIVE-DOCS.md` routing). Build a
**second assistance prompt class** — `record_hygiene`, a *project-review* source
profile — strictly parallel to the existing *prose-aligned* ideation surface, with
these invariants:

1. **Deterministic whole-project source.** The prompt compiles from the complete
   set of non-archived, hygiene-active atomic records (the §3.3 per-type
   status predicate), in a fixed type → full-label → id order, with no filter,
   threshold, ranking, active-working-set dependency, token-budget eviction, or
   model-selected subset. A provider-context overflow is a *send failure*, never
   permission to truncate.
2. **Separate types and entry point in core.** A new `StoryRecordHygieneSnapshot`
   (not `ValidationSnapshot`) and a distinct `compileRecordHygienePrompt(...)`
   entry point. Shared fingerprint/label/order/escaping utilities may be extracted
   only where source semantics are identical — never overload `compilePrompt` with
   unsafe unions or smuggle whole-project data into `ValidationSnapshot`. Core
   stays free of `node:*`/fastify/react/vite/SQLite/network/model imports.
3. **Server recompiles; never trusts client prompt text.** `/api/record-hygiene/compile`
   and `/api/record-hygiene/analyze` both rebuild the snapshot server-side from
   project state. `analyze` mirrors `/api/ideate` error categories, strictly
   parses the flat output format, verifies every citation against the compiled key
   set, and quarantines malformed output. Secrets and full payloads are never
   logged; loopback binding and redaction preserved.
4. **Quarantined, no-write web page.** A `Record Hygiene` menu entry + `/record-hygiene`
   route (project-required), inspect-before-send, explicit network disclosure,
   parsed cluster cards, record navigation, `sessionStorage` keepers
   (`loom.record-hygiene.keepers.v1`), copy-out, and clear. **No** apply / merge /
   delete / deactivate / archive / accept / "fix all" / brief-insertion /
   working-set / use-as-prose control exists anywhere in DOM or handlers.
5. **Not a validation diagnostic.** No overlap code enters
   `docs/validation-rule-inventory.md`, `runValidation`, readiness, the generation
   checklist, or the Records grid. The surface fails closed only on structural or
   transport blockers — never on the overlap/contradiction/staleness it exists to
   inspect.
6. **Constitutional gating.** All of the above is legal only after the Deliverable
   0 amendment is signed off; the amendment and first dependent behavior land in
   one revision.

The proposal's §14 workstreams map onto the Deliverables below; the recommended
build/dependency order is **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7**, with Workstream-2 core
types and Deliverable-0 sign-off preparation developable in parallel, but **no
dependent behavior landing before the amendment**.

## Deliverables

> Deliverable 0 is **sign-off-gated**: present its exact wording (below /
> proposal §10) for explicit user sign-off. Do not perform the
> `docs/FOUNDATIONS.md` edit or decompose Deliverables 2–6 into implementing
> tickets until sign-off is recorded. When signed off, the constitutional edit is
> applied **atomically in the same revision** as the first dependent behavior —
> never landed standalone.

### Deliverable 0 — Constitutional amendment to `docs/FOUNDATIONS.md` (SIGN-OFF-GATED)

Apply the exact amendments in proposal §10, verified accurate against current text:

- **§10.1** Replace §6.4 in full (introduces assistance source profiles; states a
  project-review prompt grants no prose authority and does not change the active
  working set).
- **§10.2** Replace §8 in full (every prompt class has one explicit source
  contract; prose/prose-aligned vs. project-review compilation; project-review
  compiler receives its own typed snapshot).
- **§10.3** Replace §9.1 in full (defines the two named, deterministic assistance
  **source profiles** — `prose-aligned` and `project-review` — with explicit
  archive/status predicates and the no-selection/eviction rules).
- **§10.4** Replace the §29.3 first bullet and add the project-review
  whole-source-predicate hard-fail bullet.
- **§10.5** Add three §29.4 source-profile hard-fail bullets.
- **§10.6** Add the §29.5 diagnostic-not-blocked-by-the-condition-it-inspects
  bullet.

These additions weaken no existing hard fail; they make the new source profile
auditable. Principles affected: §6.4, §8, §9.1, §29.3–29.5 (and they reference the
existing §26 quarantine rules unchanged). The §13 hard-fail self-audit in the
proposal answers every existing and new question **No**.

>> I'm the user that requested this spec. I'm signing-off this FOUNDATIONS constitutional amendment. Proceed.

### Deliverable 1 — New authority doc + active-doc/registry edits

- Create `docs/story-record-hygiene-prompt-template.md` (proposal §11.1) carrying,
  as **normative** text (not summary), the complete source rules (§§3.1–3.2), the
  exact hygiene-active predicate (§3.3), deterministic order (§3.4), the relation
  / action / hard-distinction-guard rules (§4), the full per-type and cross-type
  criteria (§5), and the request/section-order/citation/serialization/procedure/
  output contract (§6) plus the UI quarantine rules (§7.3). It becomes the durable
  domain authority. **Do not copy the stale "as the general list route currently
  does" rationale** — cite the verified mechanism (Premise correction above).
- Amend `docs/ACTIVE-DOCS.md` (proposal §11.2): add the registry row + the
  "Prompt, compiler, validation, and schema authorities" bullet after the ideation
  rows; update the "Use these when changing…" sentence to include assistance
  source profiles and the hygiene prompt; update the version note to template
  `1.2.0` / compiler `1.4.0` / contract `1.5.0`.
- Amend `docs/ideation-prompt-template.md` opening (proposal §11.3) to name it the
  `prose-aligned` source profile under §9.1 (wording only; no ideation behavior
  change).

### Deliverable 2 — Core source types, predicate, and deterministic compiler

- Add `HygieneRecordType`, the fixed type order, `RecordHygieneRequest`
  (`{ mode: "full_active_atomic_review" }`), `StoryRecordHygieneSnapshot`,
  `HygieneRecord`, and `HygieneReferenceSummary` types (proposal §6.2, §7.1).
- Implement the exact §3.3 archive + type + per-type-status predicate as one
  exported authority function (FACT projects `active`; ENTITY STATUS includes
  every non-archived record; all enum values tested included/excluded).
- Implement `compileRecordHygienePrompt(snapshot, request?)`: the 11 fixed
  sections in §6.4 order (every section incl. truthful empty state), canonical
  **escaped** JSON serialization (`<`,`>`,`&` → `<>&`; record
  values are data, never instructions, never interpolated into tags/headings),
  deterministic `[TYPE-n]` citation keys (§6.6), reference-summary rendering,
  fingerprint, token/length estimate, counts-by-type, and compile metadata.
- Golden fixtures with hostile record text and every record type; the empty-source
  golden; bump `packages/core/src/version.ts` template/compiler/contract versions
  and update all goldens/pins in the same change.

### Deliverable 3 — Server snapshot builder and response parser

- `buildStoryRecordHygieneSnapshot` (proposal §6.3): call
  `listRecords({ includeArchived: false })` once; **fail `422
  malformed-hygiene-source` on any `ok:false`/malformed row** (per Premise
  correction — inspect results, never filter); apply only the §3.3 predicate;
  derive labels/projected statuses via core registry functions; collect
  deterministic incoming/outgoing reference summaries; resolve excluded
  ENTITY/CAST MEMBER references to stored repository `displayLabel` **only** (no
  payload field enters the snapshot); validate unique ids/supported types/payload
  validity; return a complete snapshot or a clear failure.
- `record-hygiene-parse.ts`: strict parser for the §6.9 flat format — verify every
  citation against the compiled key set, require ≥2 distinct citations per finding,
  require same-type citations + a single cited `survivor` for `MERGE`/`REMOVE`,
  flag unknown action/relation/confidence values and duplicate finding numbers /
  clusters, require `findings_reported` to equal the parsed block count and the
  final `END HYGIENE REVIEW` marker; quarantine malformed output rather than repair
  it with another model call; never convert output into record-write payloads.

### Deliverable 4 — Server routes and OpenRouter safety

- `record-hygiene-routes.ts` registering `POST /api/record-hygiene/compile`
  (always-available local compilation; §7.2 response shape with metadata +
  citations) and `POST /api/record-hygiene/analyze` (validate fixed request,
  rebuild snapshot, recompile, check provider config, send the exact prompt via
  the existing OpenRouter client, parse, verify citations, return parsed findings
  or `{ ok:true, malformed:true, raw }`). Reject any client-supplied prompt,
  subset, edit payload, or write instruction.
- **Dispatch boundary.** Record-hygiene compiles through its own
  `compileRecordHygienePrompt` entry point (Deliverable 2) and these dedicated
  routes — the shared `promptKindSchema` / `POST /api/compile` dispatch (currently
  `"prose" | "ideation"`, `compile-routes.ts:44-53`) is **not** extended with a
  `record_hygiene` arm. The proposal §6.1 names a `record_hygiene` prompt-kind
  literal; if it is added to `promptKindSchema` for telemetry/labeling, `/api/compile`
  must **explicitly reject** it rather than dispatch it into the prose/ideation
  `compilePrompt`. The spec's intent is the dedicated path, not a shared-schema arm.
- Mirror ideation error categories (`no-open-project`,
  `invalid-record-hygiene-request`, `malformed-hygiene-source`, `missing-key`,
  `insufficient-credits`, `rate-limit`, `provider-unavailable`,
  `moderation-refusal`, `prompt-too-large`, `malformed-record-hygiene-response`).
  Register both routes in `server.ts`; preserve loopback binding and redaction;
  add secret-leakage/log-capture tests proving prompts, full payloads, raw output,
  parsed findings, citation maps with story content, and keys are never logged;
  add no-eviction + `prompt-too-large` behavior (no retry with fewer records).

### Deliverable 5 — Web page and API client

- Menu entry `{ to:"/record-hygiene", label:"Record Hygiene", requiresProject:true }`
  + `<Route path="/record-hygiene" element={<RequireProject><RecordHygieneView/>…}>`;
  `recordHygieneCompile`/`recordHygieneAnalyze` API client functions.
- `RecordHygieneView` with the §7.3 ordered sections: quarantine banner, source
  disclosure (counts by type + explicit exclusions), prompt inspector,
  `Refresh prompt` / `Copy prompt` / `Analyze with OpenRouter`, the network
  disclosure/confirmation, parsed cluster cards (action, relation, citations,
  shared core, differences, why, manual recommendation, survivor, reference
  caution, confidence), record navigation to `/records?recordId=<id>`,
  `sessionStorage` keepers under `loom.record-hygiene.keepers.v1`, copy findings,
  and clear. `KEEP_DISTINCT` reads as protective; `REMOVE` carries the strongest
  caution and is never styled as one-click. Accessibility labels for
  `KEEP_DISTINCT`/`REMOVE`/`HUMAN_REVIEW` do not rely on color alone.
- The page contains **no** apply/merge/delete/deactivate/archive/accept/"fix all"/
  brief-insertion/working-set/use-as-prose/notes-import/background-scan/persisted-
  history control (asserted in DOM + handler tests).

### Deliverable 6 — Supporting active-doc, schema, and stress edits

- `docs/compiler-contract.md` (proposal §11.4): contract-version pin → `1.5.0`;
  determinism sentence rewrite; replace §2 (source hierarchy: prose/ideation vs.
  project-review profiles + universal exclusions); add §3.3 record-hygiene section
  order; add §4.1 record-hygiene source mapping table; add the §10 change-control
  rule.
- `docs/story-record-schema.md` (proposal §11.5): insert §9.3 "Story-record
  hygiene assistance projection" (in-scope types, the hygiene-active status table,
  full-field rendering + reference summaries, no-stored-fields, no effect on prose
  compilation/validation/lifecycle).
- `docs/validation-rule-inventory.md` (proposal §11.6): **no diagnostic code**; the
  single optional documentary note that hygiene findings are not validation
  diagnostics.
- `docs/user-guide.md` (proposal §11.8) and `README.md` (proposal §11.9): the
  Record Hygiene workflow subsection / capability bullet + menu warning; the
  post-acceptance-loop "run Record Hygiene; no-findings is not proof of clean"
  line.
- `docs/stress-suite.md` (proposal §11.10): the 20 record-hygiene stress cases.
- `docs/stress-coverage-matrix.md` (proposal §11.11): the Record-hygiene row group
  + the exact coverage-completeness requirement.
- `docs/narrative-theory-blocker-roadmap.md` and `docs/prompt-template.md` /
  `docs/prompt-template-rationale.md`: **no behavior change** (proposal §11.7,
  §11.12) — an optional cross-reference only.

### Deliverable 7 — Capstone regression and conformance

- Full core/server/web build, typecheck, lint, unit, golden, conformance,
  accepted-prose-exclusion, notes-isolation, and logging tests green; stress matrix
  verified; version endpoints/doc pins consistent; **no** DB migration / persisted
  hygiene output / similarity cache exists (proposal §7.4). Cross-surface
  regression: prose + ideation goldens unchanged except expected version metadata;
  active-working-set compilation remains selected-record-only; readiness/validation
  inventories unchanged; existing archive/delete reference-integrity behavior
  remains authoritative.

## FOUNDATIONS Alignment

| Principle / surface | Stance | Rationale |
|---|---|---|
| §9.1 assistance prompt class @ compiler | **tensions → resolved by Deliverable 0** | Current §9.1 binds every assistance prompt to prose-prompt sources; the §10.3 amendment introduces the `project-review` source profile. Legal only after sign-off; amendment + first behavior ship together. |
| §6.4 / §8 deterministic compilation @ compile path | aligns (post-amendment) | New compiler is a deterministic renderer with one explicit source contract; identical snapshot/request/version → identical prompt; no LLM intermediary selects/ranks/summarizes/omits records. |
| §7 active-working-set supremacy @ source profile | aligns | Project-review records never enter a prose prompt, never alter working-set membership, gain no prose authority (new §29.3/29.4 checks enforce). |
| §26 / §26.1 optional LLM assistance @ web + transport | aligns | Opt-in, pull-based, quarantined, provenance-bearing, ephemeral-by-default (sessionStorage only), no auto-mutation, no apply control — rides existing rules unchanged. |
| §11 Validation and hard fails @ validation gate | aligns | Adds no validation code; fails closed only on structural/transport blockers; never blocks on the overlap it inspects (new §29.5 bullet). |
| §15 POV, knowledge, secrets @ prompt payload | aligns | Secret holders/non-holders/reveal locks preserved as comparison fields; merge rules forbid weakening them; secrets sent only via explicit, inspectable, disclosed send. |
| §16 Physical continuity @ overlap guards | aligns | Distinct physical identity/location/ownership/route/affordance are hard anti-merge guards; no cross-type merge. |
| §22 Prompt inspection / §23 OpenRouter and secrets @ server | aligns | Prompts, full payloads, raw output, parsed findings, citation maps with content, and keys are never logged; loopback binding preserved. |
| §24 Local-first and user-owned data @ storage | aligns | No stored entity / run table / migration; keepers are browser-session only; prompt is copy-outable for fully-manual use. |
| §29.3–29.5 hard-fail checklist @ spec gate | aligns | Proposal §13 self-audit answers every existing and new hard-fail **No**; new bullets are additive. |

## Verification

Per proposal §15 (Core / Server / Web / Cross-surface). Highlights the tickets must
satisfy:

- **Core:** §3.3 predicate covers every enum value for all 16 types; FACT projects
  `active`; ENTITY STATUS includes all non-archived; excluded CAST MEMBER/ENTITY
  payloads never enter snapshot/compiler types; record order stable under input
  permutation; citation keys stable + unique; canonical escaping prevents payload
  text closing/opening tags; fingerprint changes on included-field changes and not
  on excluded timestamp/order; golden has all 11 sections in order; empty source →
  exact empty state; no core import crosses the ESLint boundary.
- **Server:** all non-archived hygiene-active records included even when absent
  from the active working set; archived/terminal excluded; notes/accepted/story-
  config/generation-session never queried for prompt content; one malformed row →
  `422 malformed-hygiene-source`, not silently skipped; `analyze` ignores any
  client prompt/subset; unknown citations / cross-type merge / invalid survivor /
  duplicate keys / malformed blocks quarantined; missing key blocks send only;
  prompt/payload/raw-output absent from captured logs; full-source overflow never
  truncates or retries.
- **Web:** `Record Hygiene` is a project-required route; prompt visible before
  send; counts/exclusions + sensitive-data disclosure visible; copy works without
  credentials; findings link to exact ids; **no** apply/merge/delete/status/
  archive/working-set/brief action in rendered DOM or handlers; keepers use
  sessionStorage, survive same-session nav, vanish on clear/session end; clearing
  performs no server write; malformed raw output labeled non-canonical + copyable,
  never parsed optimistically; the three high-stakes actions have distinguishable
  non-color-only labels.
- **Cross-surface:** prose/ideation goldens unchanged except expected version
  metadata; active-working-set compilation stays selected-record-only; accepted prose + notes
  excluded from every prompt; archive/delete reference-integrity unchanged;
  readiness/validation inventories unchanged.

Gate every ticket on `npm run lint`, `npm run typecheck`, `npm test`, `npm run
build`.

## Out of Scope

Per proposal §16 non-goals and feature boundary: automatic merge/deletion;
semantic search; embeddings/vector storage (incl. the deferred `@loom/server`
candidate generator); validation warning codes; background scores/badges/scanning;
historical or terminal-record cleanup; record creation from suggestions; CAST
MEMBER/ENTITY dossier deduplication; prose/plot/outline/beat/branch/future-event
generation; accepted-prose extraction; persistent assistance history; any chunking
or token-budget batching of the source (a future batching design is a separate spec
with deterministic partitions and explicit cross-batch reconciliation). No change
to `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, or
`docs/narrative-theory-blocker-roadmap.md` behavior. No database migration. No
new `promptKind` arm on the shared `/api/compile` route — record-hygiene compiles
through its own entry point and dedicated routes (see Deliverable 4 dispatch
boundary).

## Risks & Open Questions

- **Amendment sign-off (blocking).** Deliverable 0 must be explicitly signed off
  before the `docs/FOUNDATIONS.md` edit or decomposition of Deliverables 2–6 into
  code tickets; the amendment and first dependent behavior land in one revision. If
  sign-off is declined, the whole spec is blocked (the design is unconstitutional
  without it).
- **Model over-merges nuanced records.** Mitigated by type-specific hard guards,
  the mandatory `material_differences` field, `KEEP_DISTINCT`/`HUMAN_REVIEW`, no
  auto-action, no cross-type merge, and citations.
- **Whole-project prompt too large.** Show estimates, never evict, fail send
  clearly, retain copy-out; no hidden ranking/chunking in v1.
- **Record content behaves like prompt injection.** Escaped canonical data
  serialization, fixed structural tags, explicit data-not-instruction rule, strict
  citation verification, no model repair pass.
- **Hidden secret material leaves the machine.** Local compile by default, prompt
  inspection, explicit per-send disclosure, no background calls, no logging,
  copy-out alternative.
- **Slug.** This spec uses `record-hygiene-assistance-prompt`; the proposal left
  the slug open. Rename before decomposition if a different slug is preferred.
- **Open (design-settled, flagged for the implementer):** the proposal fixes the
  v1 request to `{ mode: "full_active_atomic_review" }` with no filters; any future
  request variant is out of scope and would require revisiting §6.1 and the
  compiler contract.

## Outcome

Completed: 2026-06-21

Implemented the SPEC-027 record-hygiene assistance surface across the governing
docs, core compiler, server API, web UI, user docs, stress coverage, and capstone
regression proof. The work added the signed-off `docs/FOUNDATIONS.md` amendment,
the hygiene-active predicate and deterministic record-hygiene compiler, the
dedicated prompt template and contract/version documentation, server snapshot
building and strict response parsing, dedicated compile/analyze routes, the
menu-accessible Record Hygiene page with session-only keepers, and documentation
for the workflow and stress cases. All nine implementation tickets were completed
and archived under `archive/tickets/`.

Deviations from the original plan:

- The capstone includes an automated end-to-end regression around the server route
  and prompt surfaces rather than a live paid OpenRouter run; the archived final
  ticket preserves a manual live-analyze runbook.
- Root `npm run lint` remains blocked by unrelated generated files under
  `.codex/worktrees/spec026-mutdrirob`; owned package/path lint checks passed.

Verification performed:

- Targeted suites covered the hygiene predicate, compiler golden behavior,
  snapshot builder, parser quarantine rules, API routes, web view, shell route,
  documentation grep checks, and capstone conformance.
- Full `npm run typecheck`, `npm run build`, and `npm test` passed after the
  capstone test was added. The final full test run covered 142 files and 1057
  tests.
- `npm run lint --workspace @loom/server`, `npm run lint --workspace @loom/web`,
  and path-focused ESLint checks for owned changed files passed; root
  `npm run lint` failed only on the unrelated `.codex/worktrees/spec026-mutdrirob`
  generated-output tree.
