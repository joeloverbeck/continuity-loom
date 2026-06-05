# SPEC-006 — Deterministic Validation Engine

Status: DRAFT
Phase: Implementation Order Phase 6
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/VALIDATION-ENGINE.md`, `docs/compiler-contract.md`
Supporting authorities: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 6 gate), `docs/story-record-schema.md`, `docs/prompt-template.md`, `docs/stress-suite.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`, `docs/requirements-version-1/UI-WORKFLOWS.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-005 is implemented and archived, analyze
  `IMPLEMENTATION-ORDER.md` (and supporting `docs/requirements-version-1/*`)
  to determine the next spec for `specs/`, align it with `docs/FOUNDATIONS.md`,
  and keep `compiler-contract.md`, `prompt-template.md`, `story-record-schema.md`,
  and `stress-suite.md` in mind. Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–5 ✅ (SPEC-001…005).
  **Phase 6 — Deterministic validation engine** is the next link in the one-way
  dependency chain `storage → records → validation → compiler → preview →
  transport`. It sits *after* the Phase-5 editors (✅ SPEC-005) and *before* the
  Phase-7 compiler, which it gates. The dependency gate is verified against code:
  every validation *input* already exists — the 21-type record registry +
  projectors (`packages/core/src/records/registry.ts`), the full eight-surface
  generation-brief schema incl. `generation_validation_focus`
  (`packages/core/src/records/generation-brief.ts`), the active-working-set + cast
  bands, the story-config singletons (STORY CONTRACT / UNIVERSAL CONTENT POLICY /
  PROSE MODE), and the SPEC-005 brief/working-set/story-config server routes.
  No validation engine, compiler, preview, or transport exists yet, so Phase 6 is
  correctly next and nothing downstream is skipped.
- **What SPEC-005 deferred *to* Phase 6 (now in scope here):** the fail-closed
  blocking engine; the **authoritative accepted-prose-contamination blocker**
  (Phase 5 shipped only a non-blocking paste-guard); the **non-local
  directive/stop-guidance blocker** (Phase 5 only flagged, did not block);
  structured blocker-vs-warning separation as the gatekeeper Phase 8/9 will consume.
- **Reference material:** none externally authored — the repo docs are
  orientation; the request is the spec.
- **Scope decision (confirmed by the user during brainstorm):** **Full stack.**
  SPEC-006 ships the pure `@loom/core` engine **plus** a `POST /api/validate`
  server endpoint **plus** a web validation panel wired into the SPEC-005
  generation-brief workflow. (Alternatives considered and rejected: engine +
  endpoint only, or core engine only — both deferred the surfacing layer to
  Phase 8. The user chose the most complete, matching `VALIDATION-ENGINE.md`
  "User-facing behavior.")
- **Assumptions carried (detail-level, correct if not flagged):**
  - **The engine is the authoritative gatekeeper; it does not gate a preview/send
    that does not exist yet.** It exposes a single deterministic result
    (`blockers` / `warnings` / a derived "generation is blocked" boolean). Phase 8
    (prompt preview) and Phase 9 (send) will *consume* that result. SPEC-006 wires
    the result into a **read-only validation panel**, not into a preview/send gate.
  - **No prompt is compiled or rendered.** Universal-minimum-completeness and
    "required constitutional section present" checks are evaluated against the
    deterministic *sources* named in `compiler-contract.md` §4 (template constants
    are present by construction; populated-enough story/brief fields are the
    checkable surface), **not** by running a compiler. The compiler is Phase 7.
  - **Validation operates on an explicit immutable snapshot** (records + active
    working set + generation-time brief + story config + template/compiler version
    identifiers). Result caching keyed on snapshot/version is an allowed optimization,
    **not** required for v1.
- **Final confidence:** ~96%. Which spec is settled by the dependency chain; the
  scope lever (how far up the stack) is resolved to Full.

---

## Problem Statement

After SPEC-005 the app can author every record type, curate the active working
set with explicit cast bands, and fill all eight generation-brief surfaces — but
**nothing prevents an impossible, contradictory, or constitutionally invalid
generation from proceeding.** SPEC-005 deliberately shipped only *non-blocking*
editor warnings (the `prior_accepted_prose_status_or_handoff_note` paste-guard
and the non-local stop-guidance flag) and explicitly handed the fail-closed
engine to Phase 6.

`FOUNDATIONS.md` §4.5 / §5 / §11 make deterministic, blocking validation
constitutional: *"When deterministic validation detects contradictions, impossible
prompt conditions, unsafe continuity gaps, or dangerous prompt-quality gaps,
generation must be blocked. There is no override in v1."* `IMPLEMENTATION-ORDER.md`
Phase 6 is a **hard phase gate**: the compiler (Phase 7), preview (Phase 8), send
(Phase 9), candidate lifecycle (Phase 10), and archive (Phase 11) are all gated
on it. If prompt rendering came first, *"invalid prompts will become design
gravity."*

`VALIDATION-ENGINE.md` and `compiler-contract.md` already define the doctrine and
the exact rule set — universal minimum completeness (`compiler-contract.md` §5),
the per-focus-tag contextual matrix (`compiler-contract.md` §6), the universal
blockers (`FOUNDATIONS.md` §11 / `VALIDATION-ENGINE.md` "Universal blockers"), the
warning examples, the diagnostic-message requirements, and the prompt/send gating
rules. **The rules exist on paper; no engine exists in code.** The codebase has a
mature 21-type record registry, the full generation-brief schema, story-config
singletons, and SPEC-005 server routes — but no validation module, no diagnostic
type, no snapshot concept, and no `/api/validate` endpoint.

Phase 6's job is to implement that engine deterministically, fail-closed, with no
LLM and no record mutation, producing structured blockers and warnings with
field-linked, actionable diagnostics, and to surface them to the user as the
authoritative readiness signal for the generation workflow.

## Approach

Single approach — fully constrained by `VALIDATION-ENGINE.md` (the Phase-6
authority) and `compiler-contract.md` §5–§6 (the binding rule set), layered on
the SPEC-001…005 package boundary: `@loom/core` stays pure (no `node:*`, no
framework — enforced by `packages/core/test/boundary.test.ts`); `@loom/server`
owns I/O + HTTP; `@loom/web` owns React UI. **No schema field is added or renamed
and no DDL / `user_version` bump occurs** — validation reads existing records and
the existing `generation_session`; it never writes.

### `@loom/core` — the pure deterministic engine

- **Validation snapshot (pure, immutable).** A constructor that assembles an
  explicit immutable snapshot from already-loaded inputs: resolved selected-record
  payloads + their cast-band assignments, the eight generation-brief surfaces, the
  three story-config singletons (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE
  MODE), and the active template and compiler version identifiers
  (`versionInfo.templates.version` + `versionInfo.compiler.version`, both
  `placeholder`/`0.0.0` until Phase 7; `VersionInfo` exposes no distinct
  compiler-contract version identifier yet, so v1 folds the contract version into
  the compiler version — a distinct `contract` key would be added with the Phase-7
  compiler per `compiler-contract.md` §10). The engine
  reads **only** the snapshot. It never reads accepted segments except to assert
  their text is absent from prompt-facing fields (`VALIDATION-ENGINE.md`
  "Data/logic implications").
- **Diagnostic model.** A `Diagnostic` shape carrying: `severity`
  (`blocker` | `warning`); a **stable diagnostic `code`**; a plain-language
  `message`; `affected` record/field references (`{ recordId?, field? }[]`) where
  available; a `whyItMatters` continuity/safety rationale; and `suggestedActions`
  (revise / remove / deselect / add current state / add route / add knowledge
  constraint / add reveal permission / promote cast / add voice or body pressure /
  change directive / change stop guidance). Diagnostic text is a **user repair
  surface** — never moralizing, vague, or model-facing
  (`VALIDATION-ENGINE.md` "Diagnostic message requirements").
- **`ValidationResult`.** `{ blockers: Diagnostic[]; warnings: Diagnostic[];
  isBlocked: boolean }` where `isBlocked === blockers.length > 0`. This is the
  authoritative gatekeeper value Phase 8/9 will consume. Results are
  deterministic and stable-sorted (by code, then affected ref) so identical
  snapshots produce identical results.
- **Rule families (all from the binding docs):**
  1. **Universal minimum completeness** (`compiler-contract.md` §5 /
     `VALIDATION-ENGINE.md` "Universal minimum completeness"): story contract +
     content policy + prose mode populated enough to avoid a generic prompt;
     current authoritative state, immediate handoff, manual directive, and stop
     guidance present and local-prose-only; non-omniscient POV has populated POV
     knowledge sources; active secrets carry holders / protected non-holders /
     allowed cues when clues may appear / forbidden reveals / reveal permission;
     active physical interaction carries location, onstage entities,
     positions/distance, possession when objects matter, visibility/line of sight,
     routes/exits, available time, and impossible-action notes where omission
     invites error; active/onstage person-like cast materially involved has a core
     dossier + `local_function`; exactly one generation-context focus tag;
     accepted/rejected/superseded/auto-summary prose absent from prompt-facing
     fields.
  2. **Universal blockers** (`FOUNDATIONS.md` §11 / `VALIDATION-ENGINE.md`
     "Universal blockers" / `compiler-contract.md` §6 tail): whole-chapter /
     outline / alternate-options / downstream-summary / plot-beat-package /
     multiple-response-point directive or stop guidance; directive vs stop-guidance
     disagreement about the local unit; current authoritative state contradicts
     immediate handoff; one entity in two current locations; one object with two
     current holders; an active plan held by a dead/unconscious/captive/
     incapacitated/absent entity with no plausible means to act; a selected secret
     both hidden-from and known-by the same POV without explicit partial/ambiguous
     access; hidden truth in a POV-knowledge field that must not contain it;
     offstage interruption lacking route/timing/communication/awareness; physical
     action lacking bodies/positions/routes/visibility/time/consent-or-force where
     relevant; active/onstage materially-involved cast missing required core
     dossier fields; expected dialogue lacking enough voice pressure; content
     envelope contradicting active cast ages/statuses/story config/provider
     constraints; prompt-facing fields containing accepted/rejected/superseded/
     auto-summary prose; any required constitutional section missing or
     structurally empty.
  3. **Context-dependent matrix** (`compiler-contract.md` §6 /
     `VALIDATION-ENGINE.md` "Context-dependent validation matrix"): each v1
     validation focus tag activates its specified contextual blockers —
     `dialogue_expected`, `ensemble_dialogue_expected`, `introspection_expected`,
     `physical_interaction_expected`, `active_silent_presence_expected`,
     `present_minor_speech_possible`, `ambiguous_perception_expected`,
     `offstage_interruption_possible`,
     `nonhuman_or_institutional_pressure_expected`, `secret_or_clue_pressure`,
     `non_pov_hidden_plan_behavior`, and the durable-change tags
     (`object_use_possible`, `object_transfer_possible`, `location_change_possible`,
     `restraint_or_coercion_possible`, `intimacy_or_sex_possible`,
     `violence_or_injury_possible`, `institutional_involvement_possible`,
     `clock_tick_possible`, `obligation_breach_possible`), plus the
     `first_segment` / `continuation_after_accepted_segment` contextual rows.
  4. **Warnings** (`compiler-contract.md` §6 / `VALIDATION-ENGINE.md` "Warning
     examples"): prompt length / lost-in-the-middle risk; too many high-salience
     records; no sample utterances; sparse setting texture; no active
     clock/obligation/thread where the directive otherwise suffices; long active
     dossier may need a stronger current pin; low-drama scene may need sharper
     prose-craft pressure; old/resolved-but-selected record. Warnings **never**
     block and **never** compile into a prompt.
  5. **Secret/key safety** (`VALIDATION-ENGINE.md` / `FOUNDATIONS.md` §23): an
     API-key-like string detected in a prompt-facing field is a **security
     blocker**. Diagnostics must not echo keys or copy large sensitive prose.
- The engine performs **no record mutation, no LLM call, no record selection, no
  contradiction "repair," and no gap-filling** (`FOUNDATIONS.md` §4.4 / §29.4 /
  §29.5). New exports are added to `packages/core/src/index.ts`; the boundary test
  stays green.

### `@loom/server` — localhost validation endpoint

- **`POST /api/validate`** (new `packages/server/src/validation-routes.ts`,
  registered in `server.ts` like the SPEC-005 routes). Requires an open project;
  returns the structured `no-open-project` error otherwise. The handler loads the
  current records, `generation_session`, and story-config singletons, builds the
  core snapshot, runs the engine, and returns `ValidationResult`. It **does not
  mutate** any project data and returns the same structured result for the same
  state. Request/response bodies carry brief/directive/voice text and must **not**
  be logged — the SPEC-001 `req` serializer already emits only
  method/url/hostname/ip; the handler logs no payloads, and any key-like string is
  handled by the engine's security blocker rather than echoed.

### `@loom/web` — validation panel in the generation workflow

- A **validation panel** surfaced in the SPEC-005 generation-brief workflow
  (`packages/web/src/generation-brief/` + app shell), calling `POST /api/validate`
  via a typed wrapper added to the existing `packages/web/src/api.ts`. It:
  - summarizes **blockers and warnings separately** (`VALIDATION-ENGINE.md`
    "User-facing behavior"): blockers surgical and prominent; warnings collapsible
    / visually quieter;
  - renders each diagnostic's `code`, `message`, `whyItMatters`, and
    `suggestedActions`;
  - **clicking a diagnostic navigates to the affected record or field** when an
    `affected` ref is present;
  - **re-runs validation deterministically** when inputs change (brief edit,
    working-set change, record edit);
  - presents the result as the **authoritative readiness signal**, but gates no
    preview/send (neither exists yet) — it states plainly when generation is
    blocked. No "validate anyway," no override, no hidden bypass
    (`VALIDATION-ENGINE.md` "Prompt/send gating").

## Deliverables

1. **`@loom/core` deterministic validation engine (pure).**
   - Immutable validation snapshot constructor over resolved selected records +
     cast bands + eight brief surfaces + three story-config singletons +
     template/compiler version identifiers (see Approach; no distinct contract
     version identifier exists in `VersionInfo` yet).
   - `Diagnostic` and `ValidationResult` types; stable diagnostic-code catalogue.
   - Rule families 1–5 above: universal minimum completeness, universal blockers,
     the full v1 context-dependent focus matrix, warnings, and secret/key safety.
   - New exports in `packages/core/src/index.ts`; boundary test stays green
     (no `node:*` / framework imports).
   - Unit tests (`packages/core/test/validation.test.ts` + companions): each
     blocker and each focus-tag matrix row fires on a crafted snapshot and stays
     silent on a clean one; `isBlocked` reflects blocker presence; warnings never
     set `isBlocked`; identical snapshots produce identical stable-sorted results
     (determinism); the engine performs no mutation and calls no LLM; the
     accepted-prose-contamination blocker and the non-local directive/stop blocker
     (SPEC-005 deferrals) fire; the API-key security blocker fires and the key is
     not echoed in the diagnostic.

2. **`@loom/server` `POST /api/validate` route.**
   - Builds the snapshot from the open project, runs the engine, returns
     `ValidationResult`; structured `no-open-project` error when none is open;
     never mutates; logs no brief/directive/voice/key text.
   - Registered in `server.ts`. **No new tables, no DDL change, no `user_version`
     bump.**
   - Integration tests against a temp project: clean state → empty blockers;
     contradictory state (two locations / two holders / accepted-prose
     contamination / non-local directive) → expected blocker codes; warning-only
     state → `isBlocked: false` with warnings present; no-open-project → clean
     structured error; logs contain no brief/directive/key text; validation
     mutates nothing (record + session round-trip unchanged after a validate call).

3. **`@loom/web` validation panel.**
   - Panel in the generation-brief workflow: blockers vs warnings separated,
     warnings collapsible; per-diagnostic code/message/why/actions; click-to-
     navigate to affected record/field; deterministic re-run on input change;
     no override / no "validate anyway".
   - Typed `validate` wrapper added to the existing `packages/web/src/api.ts` for
     `POST /api/validate`.
   - Component tests (Testing Library): blockers and warnings render in separate
     groups; a blocker disables/hides any "ready to generate" affordance the panel
     owns; clicking a field-linked diagnostic triggers navigation; warning-only
     state shows warnings but reports "not blocked"; no override control exists.

4. **Governing-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 6: add
     `Status: ✅ Implemented via SPEC-006 (YYYY-MM-DD).` and check the Phase-6 gate
     bullets satisfied. Do not alter ordering rationale or later phases.
   - `docs/requirements-version-1/VALIDATION-ENGINE.md`: add a short "Phase 6
     implementation note" recording that the deterministic engine, the diagnostic
     model, the `/api/validate` endpoint, and the validation panel are realized via
     SPEC-006, leaving the prompt compiler (Phase 7) and prompt preview (Phase 8)
     open.
   - **No `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md`
     change is required** — SPEC-006 adds no prompt placeholder and no schema
     field. If implementation finds a rule that cannot be evaluated from the
     documented deterministic sources, reconcile the contract/doc in the **same
     change** rather than forking behavior (`FOUNDATIONS.md` §8 anti-drift rule;
     `compiler-contract.md` §10 change-control).
   - Archive SPEC-006 to `archive/specs/` per `docs/archival-workflow.md` once
     complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §4.5 / §5 / §11 / §29.5 Fail closed; no v1 override | aligns | Engine returns `isBlocked` from any blocker; panel exposes no "validate anyway"/override/bypass @ core engine + web panel. |
| §4.4 / §8 / §29.4 Deterministic compilation preconditions; no LLM intermediary | aligns | Pure engine over an immutable snapshot; stable-sorted results; identical snapshot → identical result; zero LLM call @ core engine. |
| §4.1 / §26 / §29.2 No LLM record authority; no automatic record mutation | aligns | Engine and endpoint read-only; validation never writes records or the session @ core engine + server. |
| §10 / §28.1 / §29.4 No accepted prose in prompts | aligns | Authoritative accepted/rejected/superseded/auto-summary contamination blocker on prompt-facing fields (the SPEC-005 paste-guard's blocking successor) @ core engine. |
| §15 / §29.6 POV / reveal discipline | aligns | Blockers for secret hidden+known-by-same-POV, hidden truth in POV fields, missing secret holder/non-holder/cues/forbidden/permission @ core engine. |
| §16 / §29.7 Physical continuity | aligns | Blockers for two locations, two holders, missing bodies/positions/routes/visibility/time/consent, offstage interruption without route @ core engine. |
| §17 Character voice is continuity | aligns | Dialogue/ensemble/active-silent focus rows block on missing voice pressure / core dossier; no compression imposed @ core engine. |
| §23 / §29.9 Secrets and key safety | aligns | API-key-like string in a prompt-facing field is a security blocker; diagnostics never echo keys; routes log no payloads @ core engine + server. |
| §6 / §7 Five surfaces distinct; active-working-set supremacy | aligns | Engine reads the user's snapshot only; reports risk via diagnostics; never silently adds/removes/compresses records @ core engine. |
| §2 / §12 / §29.1 No plot-rail machinery | aligns | Local-prose-only blocker rejects chapter/act/beat/arc/outline/multi-point directives; focus tags treated as completeness checks, never beats @ core engine. |

No §29 hard-fail is answered "yes": no autonomous generation; no branching/plot
rails (local-prose-only blocker, focus tags as checks not beats); no
accepted-prose-as-canon (contamination blocker); no LLM authority or record
mutation (read-only, deterministic); no nondeterminism (immutable snapshot,
stable sort); no silent working-set mutation; no override of hard validation in
v1; warnings and blockers are distinct in data and UI; no key leakage (security
blocker, no payload logging); no remote sole-source-of-truth.

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test passes — the engine imports no `node:*` and no framework.
- **Determinism**: the same snapshot produces byte-identical stable-sorted
  results across repeated runs.
- **Fail-closed**: every documented universal blocker and every v1 focus-tag
  matrix row fires on a crafted snapshot and stays silent on a clean one;
  `isBlocked` is true iff a blocker is present; warnings never set `isBlocked`.
- **SPEC-005 deferrals landed**: accepted-prose-contamination blocker and
  non-local directive/stop blocker fire as *blockers* (not mere warnings).
- **No mutation / no LLM**: a validate call leaves records and `generation_session`
  unchanged; no model transport is invoked.
- **Server**: `/api/validate` returns expected blocker codes for contradictory
  states, `isBlocked: false` for warning-only states, a clean structured error
  with no open project; logs contain no brief/directive/voice/key text.
- **Web**: blockers and warnings render separately; field-linked diagnostics
  navigate; no override control; the panel reports "blocked" when blockers exist.
- **Stress mapping**: a representative subset of `docs/stress-suite.md`
  hard-fail scenarios that fall within Phase-6 scope (e.g. two-location, two-holder,
  secret leakage, impossible action, non-local directive, accepted-prose
  contamination) are exercised as engine test fixtures and produce blockers.
- Manual smoke: open a project; fill a deliberately contradictory brief; confirm
  the panel shows blockers with actionable text and that clicking navigates to the
  offending field; fix the fields; confirm the panel re-runs and clears; confirm
  the server still binds `127.0.0.1` only.

## Out of Scope

- **Deterministic prompt compiler / placeholder rendering / empty-state prompt
  text / voice-pressure-pin computation / POV-audience knowledge-profile
  compilation** — Phase 7. SPEC-006 evaluates *sources*, it does not render a
  prompt.
- **Prompt preview and any preview/send gate wiring that consumes `isBlocked`** —
  Phase 8. SPEC-006 exposes the authoritative result and a read-only panel; it
  does not gate a preview/send surface (neither exists).
- **OpenRouter transport, candidate lifecycle, accepted-segment browser,
  durable-change reminder** — Phases 9–12.
- **Deterministic focus-tag *suggestion* panels** (proactive "you selected two
  speakers; add `dialogue_expected`?" prompts), which SPEC-005 mentioned as a
  Phase-6 candidate. Treated as **deferrable polish**, not gate-required: the
  engine's field-linked diagnostics + `suggestedActions` already satisfy the
  Phase-6 gate and `VALIDATION-ENGINE.md` Done Means. May be a follow-on ticket;
  see Risks.
- **Result caching / cache-invalidation infrastructure** — allowed later as an
  optimization; the v1 engine recomputes deterministically.
- **Any LLM-assisted validation, repair, or suggestion** — forbidden in v1
  validation (`FOUNDATIONS.md` §4.4 / §26 / §29.5).
- **Schema changes / new tables / DDL evolution / `user_version` bump** — none
  needed; validation is read-only over existing storage.

## Risks & Open Questions

- **Matrix surface is large.** The full v1 context-dependent matrix
  (`compiler-contract.md` §6) is ~22 focus-tag rows plus the universal blockers
  and universal-minimum-completeness checks. `spec-to-tickets` should batch as
  reviewable diffs, suggested: (a) core snapshot + `Diagnostic`/`ValidationResult`
  types + diagnostic-code catalogue; (b) core universal minimum completeness +
  universal blockers + tests; (c) core context-dependent matrix rows (possibly
  split: knowledge/secret/POV rows; physical/object/movement rows; voice/dialogue
  rows; durable-change rows) + tests; (d) core warnings + secret/key safety +
  tests; (e) server `/api/validate` + tests; (f) web `validate` wrapper (in the
  existing `packages/web/src/api.ts`) + validation panel + tests. Each a reviewable
  diff.
- **"Populated enough to avoid a generic prompt" is a judgement threshold.** The
  universal-minimum checks (`compiler-contract.md` §5.2) must use **deterministic,
  documented** criteria (presence / non-empty / enum-resolved), never a
  quality/"genericness" heuristic that drifts. Where the doc says "populated
  enough," implement as concrete presence/non-blank rules and, if a finer rule is
  needed, add it to `compiler-contract.md` in the same change.
- **Physical-impossibility and "no plausible means to act" rules need bounded,
  deterministic criteria.** E.g. "active plan held by an incapacitated entity"
  keys on ENTITY STATUS `life`/`agency` enums vs. PLAN `holder` + `can_drive_prose`
  — concrete, enum-driven. Rules must not infer impossibility by free-text NLP.
  Keep each rule traceable to a named record field.
- **Snapshot resolution boundary.** The snapshot must resolve
  `active_working_set.selected_records` to payloads via the repository *before*
  the pure engine runs (the engine takes resolved data, not IDs-to-fetch), keeping
  `@loom/core` free of I/O. The server route owns resolution.
- **Accepted-prose-contamination heuristic vs. the SPEC-005 paste-guard.** The
  Phase-6 rule is the **authoritative blocker**; it should be at least as strict as
  the SPEC-005 editor paste-guard and must stay deterministic (length/structure/
  marker heuristics on `prior_accepted_prose_status_or_handoff_note` and other
  prompt-facing fields), never an LLM check and never silently mutating.
- **Focus-tag suggestion panels (deferred).** If the user later wants the
  proactive suggestion affordance, it is a small additive web feature over the
  same engine; confirm at Phase 6 close whether to fold it in or ticket it
  separately.
- **Resolved during brainstorm:** which spec (Phase 6); scope lever (Full stack —
  core engine + `/api/validate` + web panel).
