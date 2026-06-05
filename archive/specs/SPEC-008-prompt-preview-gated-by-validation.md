# SPEC-008 — Prompt Preview Gated by Validation

Status: ✅ COMPLETED
Phase: Implementation Order Phase 8
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED), SPEC-007 (Deterministic Prompt Compiler, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/UI-WORKFLOWS.md` ("Validation panel" + "Prompt preview"), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 8 gate)
Supporting authorities: `docs/requirements-version-1/PROMPT-COMPILER.md` ("Prompt preview boundaries"), `docs/compiler-contract.md` (§3 section order, §10 versioning), `docs/prompt-template.md`, `docs/requirements-version-1/TESTING-STRATEGY.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-007 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and supporting
  `docs/requirements-version-1/*`) to determine the next spec for `specs/`, in
  full alignment with `docs/FOUNDATIONS.md`, keeping `compiler-contract.md`,
  `prompt-template.md`, `story-record-schema.md`, and `stress-suite.md` in mind.
  Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–7 ✅ (SPEC-001…007).
  **Phase 8 — Prompt preview gated by validation** is the next link in the one-way
  dependency chain `storage → records → validation → compiler → preview →
  transport`. It sits *after* the Phase-7 compiler (✅ SPEC-007, which exposed the
  validation-gated `POST /api/compile` endpoint) and *before* the Phase-9 OpenRouter
  send, which consumes a compiled prompt. The ordering doc is explicit that "the
  user must inspect the prompt before sending. This is a constitutional workflow
  boundary." The gate is verified against code: the `/api/compile` endpoint already
  returns `{ prompt, metadata }` when not blocked and a structured
  `validation-blocked` response (no prompt) when blocked; `@loom/core` exports
  `CompileResult` / `CompileMetadata` / `ValidationResult` / `VersionInfo` /
  `versionInfo`; the web `AppShell` already reserves a **disabled `"Validation/Preview"`
  placeholder** in its later-phase surface list, and a reusable `ValidationPanel`
  already exists. No prompt-preview UI exists yet, so Phase 8 is correctly next and
  nothing downstream (OpenRouter send / candidate lifecycle) is pulled forward.
- **Reference material:** none externally authored — the repo docs are orientation;
  the request is the spec.
- **Scope decision (single fully-constrained approach):** **`@loom/web` prompt-preview
  surface only.** SPEC-008 promotes the reserved disabled `"Validation/Preview"`
  placeholder into a real **"Validation / Prompt Preview"** route that consumes the
  existing `/api/compile` endpoint, renders the compiled prompt **only** when
  validation reports no blockers, and renders **no prompt** (no partial preview) when
  blocked. It ships **no** OpenRouter send button, no candidate UI, and no server,
  core, or schema change. (Alternatives considered and rejected: inlining the preview
  into `GenerationBriefView` — contradicts the UI-WORKFLOWS navigation model, which
  lists "Validation and Prompt Preview" as a distinct primary continuity surface;
  adding a send affordance now — pulls Phase 9 across a documented phase boundary.)
- **Assumptions carried (detail-level, correct if not flagged):**
  - **The preview surface is a new dedicated route** at `/preview` (label
    "Validation / Prompt Preview"), promoted from the existing disabled
    `laterPhaseSurfaces` placeholder in `AppShell`. The existing inline
    `ValidationPanel` inside `GenerationBriefView` **stays** ("the validation panel is
    always available in the generation workflow" — UI-WORKFLOWS); the reusable
    `ValidationPanel` component is reused on the new surface, not duplicated.
  - **The gate is the `/api/compile` contract itself**, not a second client-side
    completeness check. The surface calls `compile()`; a `validation-blocked` body
    drives the no-prompt blocked view, a `{ prompt, metadata }` body drives the
    preview. The web never re-derives "is this blocked" — it trusts the endpoint's
    server-side `runValidation()` gate (single completeness authority stays in the
    SPEC-006 engine).
  - **Preview state is ephemeral.** The compiled prompt and metadata live only in
    React component state for the active session; they are **never** written to
    `localStorage`, `sessionStorage`, IndexedDB, a file, or any durable store, and a
    **Clear** action drops them immediately (`FOUNDATIONS.md` §22 "easy to clear", "no
    permanent prompt archive by default"). Re-entering the route re-fetches.
  - **Live blocker subscription, not stale success.** The surface fetches on mount and
    exposes an explicit **Refresh preview** action; it never shows a previously-compiled
    prompt after the user has changed state without re-compiling
    (UI-WORKFLOWS "Validation implications": preview must subscribe to current blocker
    state).
  - **Version metadata renders outside the prompt body.** The template / compiler /
    contract version triple plus fingerprint + length/token estimate render in a
    metadata panel **adjacent to**, never inside, the prompt text
    (IMPLEMENTATION-ORDER Phase 8 gate; UI-WORKFLOWS "Prompt preview"). The prompt body
    contains only `CompileResult.prompt`.
  - **No secrets surface.** The `/api/compile` payload carries no API keys or
    secret-storage values (SPEC-007 metadata is key-free); the preview displays the
    payload verbatim and adds nothing, so no key can appear in the preview UI
    (`FOUNDATIONS.md` §22/§23).
- **Final confidence:** ~94%. Which spec is settled by the dependency chain; the
  surface placement (dedicated route) and feature set (copy, in-prompt search, clear,
  not-canon notice, external version metadata) are settled by UI-WORKFLOWS + the Phase-8
  gate; section expand/collapse is left optional per the gate's "if feasible".

---

## Problem Statement

After SPEC-007 the app can compile a blocker-free story state into the universal
prose prompt: `POST /api/compile` runs `runValidation()` first and returns
`{ prompt, metadata }` only when not blocked, a structured `validation-blocked`
response (carrying the `ValidationResult`, no prompt) when blocked, and the shared
snapshot-builder's structured errors (`no-open-project`,
`malformed-validation-source`, session-load) otherwise — **but there is no UI for the
user to inspect that compiled prompt.** The web `AppShell` lists
`"Validation/Preview"` only as a **disabled** later-phase placeholder button; no route,
no preview pane, and no compile API client exist on the front end.

`IMPLEMENTATION-ORDER.md` Phase 8 is the next link in the one-way chain and is gated
*forward* into Phase 9: "the user must inspect the prompt before sending. This is a
constitutional workflow boundary." Building OpenRouter transport before a trustworthy,
validation-gated preview would let the user send prompts they have never seen and would
let "invalid prompt patterns ossify."

`FOUNDATIONS.md` §6.4 names the generated prompt as one of the five continuity
surfaces — "the deterministic, inspectable prompt … not canon … an operational
artifact for one generation request." §22 fixes the inspection contract: prompt
transparency is required but permanent prompt archives are not; the current prompt
must be inspectable before sending; if temporary inspection is implemented it must
not contain keys/secrets, must be easy to clear, must not be treated as canon, and
must not become a hidden source for future compilation. §4.5 requires the surface to
**fail closed** — no prompt when blocked. `UI-WORKFLOWS.md` specifies the exact surface
behavior: preview appears only when blockers are absent, no partial preview when
blockers exist, search within prompt, copy prompt, optional section expand/collapse,
visible template/compiler/contract version metadata **outside** the prompt body, and a
clear notice that the prompt is temporary and not canon; and that preview "must
subscribe to current blocker state, not stale success state."

**The contract and the endpoint exist; no preview surface exists.** Phase 8's job is to
build that surface in `@loom/web` over the existing endpoint, with no new server, core,
or schema behavior: a validation-gated, ephemeral, inspectable, easy-to-clear prompt
preview that never shows a partial prompt, never persists, never logs, and never
surfaces secrets.

## Approach

Single approach — fully constrained by `UI-WORKFLOWS.md` ("Validation panel" +
"Prompt preview"), the Phase-8 gate in `IMPLEMENTATION-ORDER.md`, and `FOUNDATIONS.md`
§6.4/§22/§4.5, layered on the SPEC-001…007 package boundary: **`@loom/web` only**, plus
one client method in `packages/web/src/api.ts`. **`@loom/server`, `@loom/core`, and the
storage schema are untouched** — the `/api/compile` endpoint, the deterministic
compiler, the version triple, and the validation engine already exist and are consumed
as-is. No DDL, no `user_version` bump, no new route on the server.

### `packages/web/src/api.ts` — typed compile client

- Add `compile()` calling `POST /api/compile`, returning a discriminated union typed
  from the exported `@loom/core` shapes:
  - **success** — the bare `CompileResult` (`{ prompt, metadata }`); note the success
    body has **no** `ok` field (the endpoint returns the compiler result directly);
  - **blocked** — `{ ok: false; kind: "validation-blocked"; validation: ValidationResult }`;
  - **failure** — the shared `ApiFailure` shape already used by other clients
    (`{ ok: false; kind; message }`) for `no-open-project`,
    `malformed-validation-source`, and the session-load error forwarded by the
    snapshot builder.
- Discrimination rule: a body with `ok === false` is blocked-or-error (switch on
  `kind`); any other 200 body is a `CompileResult` (presence of `prompt` + `metadata`).
  Reuse the existing `requestJson`/`postJson` helpers; do not add a second fetch layer.

### `packages/web/src` — the "Validation / Prompt Preview" surface

- **New route + nav promotion.** Add a `PromptPreviewView` at route `/preview` and a
  `{ to: "/preview", label: "Validation / Prompt Preview" }` entry to `AppShell`'s
  `primaryRoutes`; **remove** the corresponding `"Validation/Preview"` entry from the
  disabled `laterPhaseSurfaces` list (the remaining `"Generate/Candidate"` and
  `"Accepted Segments"` stay disabled — Phases 9–11). Register the `<Route>` in
  `AppShell`'s `<Routes>`.
- **Gate behavior.** On mount and on an explicit **Refresh preview** action, the view
  calls `compile()` and renders one of:
  - **loading** — a non-committal "Compiling prompt…" status;
  - **blocked** — the existing `ValidationPanel`-style blocked view driven by the
    returned `ValidationResult` (blockers listed and field/record-navigable, warnings
    collapsible), a clear "Prompt preview is unavailable while blockers exist" message,
    and **no prompt element rendered at all** (no empty `<pre>`, no truncated body —
    "no partial prompt preview");
  - **ready** — the compiled prompt preview (below);
  - **error** — `no-open-project` → a "Open a project first" prompt;
    `malformed-validation-source` / session-load → a safe structured message; no prompt.
  The view **reuses the exported `ValidationPanel`** for the blocker list (it already
  fetches `/api/validate`; on this surface the `validation-blocked` body already
  carries the `ValidationResult`, so render directly from it rather than double-fetching
  — extract the blocker/warning list rendering into a presentational sub-component if
  that avoids a redundant validate call). Either way, the no-blocker gate is the
  endpoint's server-side `runValidation()`, never a re-derived client check.
- **Prompt preview pane (ready state).** Renders `CompileResult.prompt` in a readable
  monospace, scrollable, large-prompt-tolerant region, with:
  - **Copy prompt** — copies the exact prompt text to the clipboard;
  - **Search within prompt** — an in-prompt find affordance (highlight / next-match or
    a filtered view) sufficient for a long prompt;
  - **Clear** — drops the compiled prompt + metadata from component state immediately
    (§22 "easy to clear"), returning the surface to an un-compiled state;
  - a prominent **"This prompt is temporary and not canon"** notice
    (`FOUNDATIONS.md` §6.4/§22);
  - optional **expand/collapse of major sections** — left out of v1 unless trivial
    (gate says "if feasible"; see Out of Scope).
- **Metadata panel (outside the prompt body).** A panel adjacent to (never inside) the
  prompt text renders `CompileMetadata`: the template / compiler / contract version
  triple, the fingerprint, and the length/token estimate (Phase-8 gate: "template/
  compiler/contract version metadata is visible outside the prompt body").
- **Ephemerality + no logging.** The prompt and metadata live only in React state for
  the session. The view writes **nothing** to `localStorage` / `sessionStorage` /
  IndexedDB / disk, performs no analytics/telemetry call, and logs no prompt text to the
  console. Navigating away or pressing **Clear** discards it; re-entering re-fetches.
- **No stale success.** The surface never displays a prompt compiled from an earlier
  state after the user changes records/working-set/brief without re-compiling — the
  prompt is only ever the result of the most recent `compile()` call; **Refresh preview**
  is the explicit re-subscribe (UI-WORKFLOWS "Validation implications").
- **No secrets in preview.** The preview renders only the endpoint payload, which is
  key-free by SPEC-007; the view introduces no field that could carry a key or
  secret-storage value (`FOUNDATIONS.md` §22/§23).

## Deliverables

1. **`api.ts` compile client.**
   - `compile()` over `POST /api/compile` returning the discriminated union
     `CompileResult | { ok: false; kind: "validation-blocked"; validation: ValidationResult } | ApiFailure`,
     typed from the exported `@loom/core` shapes; reuses existing request helpers.
   - Client tests: a success body maps to the `CompileResult` branch; a
     `validation-blocked` body maps to the blocked branch carrying the
     `ValidationResult`; a `no-open-project` / `malformed-validation-source` body maps to
     the failure branch with its `kind`.

2. **`PromptPreviewView` + `AppShell` route promotion.**
   - New `PromptPreviewView` component at `/preview`; `primaryRoutes` gains the
     "Validation / Prompt Preview" entry and the `<Route>` is registered; the
     `"Validation/Preview"` placeholder is removed from the disabled `laterPhaseSurfaces`
     (the other two later-phase buttons remain disabled).
   - States: loading, blocked (no prompt), ready (prompt + metadata), and the structured
     error states (`no-open-project`, malformed source / session-load). On mount it
     compiles; a **Refresh preview** control re-compiles.
   - Ready-state pane: monospace scrollable prompt body, **Copy prompt**, in-prompt
     **search**, **Clear**, the "temporary / not canon" notice, and a metadata panel
     (version triple + fingerprint + length/token estimate) rendered **outside** the
     prompt body.
   - Blocked-state view reuses the existing blocker/warning rendering (via
     `ValidationPanel` or an extracted presentational sub-component) driven by the
     returned `ValidationResult`; **no** prompt element is rendered.
   - **`App.test.tsx` update.** `packages/web/src/App.test.tsx` currently asserts
     `"Validation/Preview"` is a *disabled* later-phase button (in the
     `["Validation/Preview", "Generate/Candidate", "Accepted Segments"]` loop). Because
     this spec removes `"Validation/Preview"` from `laterPhaseSurfaces` and promotes it to
     a `primaryRoutes` nav link, that loop must drop `"Validation/Preview"` (leaving the
     two surfaces that stay disabled) and gain a positive assertion that the new
     "Validation / Prompt Preview" nav link renders and routes to `PromptPreviewView`.
     Without this edit `npm test` cannot go green. (This stays within the
     "diff touches only `packages/web`" boundary asserted in Verification.)
   - Component tests (`PromptPreviewView.test.tsx`, plus the `App.test.tsx` update above
     and any `ValidationPanel` change):
     blocked compile → blocker list shown and **no prompt element** in the DOM (assert
     absence, not emptiness); not-blocked compile → prompt text present, all expected
     sections visible, version triple + fingerprint present **outside** the prompt
     `<pre>`/body; **Copy** copies the exact prompt; **Clear** removes the prompt +
     metadata from the DOM; **Refresh preview** re-issues `compile()` and replaces stale
     state; `no-open-project` → the "open a project" message and no prompt; the prompt
     body is never written to `localStorage`/`sessionStorage` (assert storage untouched);
     the version triple never appears inside the prompt body element.

3. **Styling.**
   - Minimal additions to `packages/web/src/styles.css` for the preview pane (readable
     monospace, scroll, metadata panel) consistent with existing surface styling; no new
     CSS framework.

4. **Governing-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 8: add
     `Status: ✅ Implemented via SPEC-008 (YYYY-MM-DD).` and check the Phase-8 gate
     bullets satisfied. Do not alter ordering rationale or later phases.
   - `docs/requirements-version-1/UI-WORKFLOWS.md`: add a short "Phase 8 implementation
     note" recording that the validation-gated prompt-preview surface (no-partial-preview,
     copy/search/clear, external version metadata, ephemeral/not-canon) is realized via
     SPEC-008, leaving OpenRouter transport (Phase 9) and the candidate lifecycle
     (Phase 10) open.
   - Archive SPEC-008 to `archive/specs/` per `docs/archival-workflow.md` once complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §6.4 / §22 / §29.9 Prompt inspectable before sending | aligns | A dedicated "Validation / Prompt Preview" surface renders the compiled prompt for inspection before any transport exists @ web preview. |
| §4.5 / §29.5 Fail closed; preview only when not blocked | aligns | The surface trusts the `/api/compile` server-side `runValidation()` gate: blocked → blocker view with **no prompt element**; never re-derives completeness @ web preview. |
| §22 No permanent prompt archive; easy to clear | aligns | Prompt + metadata live only in React state; **Clear** drops them; nothing written to localStorage/disk; no prompt logging; re-entry re-fetches @ web preview. |
| §22 / §23 / §29.9 No keys/secrets in prompt inspection | aligns | The view renders only the key-free `/api/compile` payload and adds no secret-bearing field; no key can appear in preview @ web preview. |
| §6.4 / §27 Prompt is not canon | aligns | A prominent "temporary — not canon" notice; the preview is never written to records or accepted archive and is not a compile input @ web preview. |
| §8 / §29.4 Deterministic compilation (consumed, not re-implemented) | aligns | The web performs no compilation/selection/summarization; it displays the deterministic compiler output verbatim @ web preview. |
| §27 prompt inspection; placement per Phase-8 gate / UI-WORKFLOWS | aligns | Template/compiler/contract triple + fingerprint render in a metadata panel adjacent to, never inside, the prompt text — the outside-the-body requirement traces to the IMPLEMENTATION-ORDER Phase-8 gate + UI-WORKFLOWS "Prompt preview" @ web preview. |
| §12 / §29.5 No plot-rail machinery | aligns | The surface shows one local-prose prompt + validation state; it adds no act/beat/chapter view @ web preview. |

No §29 hard-fail is answered "yes": the preview shows the prompt only when the
server-side validation gate reports no blockers (no compile-from-blocked path on the
client); it never shows a partial prompt; it adds no accepted prose, no record mutation,
and no LLM call; it persists no permanent prompt archive and logs no prompt text; it
surfaces no API key or secret; it introduces no provider-specific or plot-rail surface.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green.
- **Gate — no prompt when blocked**: with a blocked project state, the surface renders
  the blocker list and **no prompt element exists in the DOM** (assert absence); with a
  blocker-free state, the prompt renders.
- **No partial preview**: there is no code path that renders a truncated or
  partially-resolved prompt; the blocked and error states render no prompt body.
- **Inspection affordances**: the ready state offers copy (exact prompt text), in-prompt
  search over a long prompt, and the not-canon notice; the prompt body is readable and
  scrollable for large prompts.
- **Clearable + ephemeral**: **Clear** removes the prompt + metadata from the DOM; no
  prompt text is written to `localStorage`/`sessionStorage`/IndexedDB or any durable
  store (asserted), and re-entering the route re-fetches.
- **Live blocker subscription**: after a state change, the surface does not display the
  previously-compiled prompt until **Refresh preview** re-issues `compile()`; stale
  success is not shown.
- **Version metadata placement**: the template/compiler/contract triple + fingerprint +
  length/token estimate render outside the prompt body; the triple never appears inside
  the prompt text element.
- **Secret safety**: the compiled prompt and metadata shown contain no API key or
  secret-storage value (the payload is key-free; the view adds nothing).
- **No server/core/schema change**: `git` diff touches only `packages/web` (and the
  governing docs on completion); no `@loom/server` route, `@loom/core` module, or DDL /
  `user_version` change.
- **Manual smoke**: `npm start`; open a project; with blockers present, visit
  "Validation / Prompt Preview" and confirm the blocker list shows and no prompt is
  visible; resolve blockers, **Refresh preview**, and confirm a complete prompt with the
  version triple + fingerprint outside the body, copy works, **Clear** empties it, and
  the browser console / network logs contain no persisted prompt and no key.

## Out of Scope

- **OpenRouter global settings, API-key detection, model list, non-streaming send /
  any "Generate" or "Send" button** — Phase 9. The preview surface ends at inspection;
  the "Generate/Candidate" later-phase placeholder stays disabled.
- **Candidate editor / regenerate / discard / accept lifecycle, accepted-segment archive
  + browser, durable-change reminder** — Phases 10–12; the "Accepted Segments" placeholder
  stays disabled.
- **Any `@loom/server` change** — the `/api/compile` endpoint, its validation gate, and
  its error contract already exist (SPEC-007) and are consumed unchanged; no new route,
  no logging change, no `127.0.0.1` binding change.
- **Any `@loom/core` change** — the compiler, the §4 placeholder mapping, the version
  triple, and the `CompileResult`/`CompileMetadata` types already exist and are imported
  as-is; no new export is required by this spec (if one proves necessary, it is a
  type-only re-export, not new behavior).
- **Schema changes / new tables / DDL evolution / `user_version` bump** — none; the
  surface is read-only over the existing endpoint.
- **Permanent prompt archive / prompt logging / source-map or debug provenance in the
  prompt / prompt diffing / prompt history** — forbidden in v1 (`FOUNDATIONS.md` §22;
  `PROMPT-COMPILER.md`); the preview is ephemeral.
- **Section expand/collapse of the prompt body** — the Phase-8 gate lists it only "if
  feasible"; v1 ships a plain scrollable body. May be added later without a contract
  change if it stays purely presentational and does not alter the prompt text.
- **Re-validating or extending the SPEC-006 engine on the client** — the web trusts the
  endpoint's server-side gate and never re-derives completeness.

## Risks & Open Questions

- **Blocked-state rendering reuse vs. double-fetch.** The existing `ValidationPanel`
  fetches `/api/validate` itself, but the `validation-blocked` compile body already
  carries the `ValidationResult`. To avoid a redundant validate call on this surface,
  extract `ValidationPanel`'s blocker/warning list into a presentational sub-component
  that accepts a `ValidationResult` prop, and have `PromptPreviewView` render it from the
  compile response. Keep `ValidationPanel`'s existing self-fetching behavior intact for
  `GenerationBriefView`. `spec-to-tickets` should treat this extraction as the first
  reviewable diff if pursued; otherwise the surface may fetch once and accept the small
  redundancy.
- **Determinism display vs. UI noise.** The fingerprint and length/token estimate are
  reproducibility signals, not user-facing canon; render them quietly in the metadata
  panel, not as prominent story state, so the preview does not read like a second
  archive (`FOUNDATIONS.md` §22).
- **"No partial preview" must be a DOM-absence guarantee, not an empty element.** Tests
  must assert the prompt element is *absent* in blocked/error states, not merely empty —
  an empty `<pre>` would still read as "a prompt exists" and risks normalizing partial
  preview.
- **Stale-success avoidance is the subtle gate.** Because the surface fetches on mount,
  the main stale risk is the user editing state in another tab/route and returning to a
  cached React tree; the explicit **Refresh preview** action plus fetch-on-mount cover
  v1, but the implementer should ensure navigation into `/preview` always re-fetches
  rather than reusing a memoized prior result.
- **Search affordance scope.** "Search within prompt" can be a browser-native scroll-to
  highlight or a lightweight filter; v1 needs only enough to navigate a long prompt.
  Avoid building a full find-and-replace or regex engine (YAGNI).
- **Reproducibility-grade type imports only.** The web imports `CompileResult` /
  `CompileMetadata` / `ValidationResult` as **types** from `@loom/core`; it must not
  import compiler runtime functions (`compilePrompt`) — compilation stays server-side.
  Confirm the web build pulls only the type surface. **The metadata panel's version triple
  is read from `CompileResult.metadata.versions`** (`ValidationVersions =
  { template, compiler, contract }`), *not* from the `VersionInfo` shape or the
  `versionInfo` global constant — those carry global/runtime versions, whereas the
  transparency artifact must be the versions the compile actually used.
- **Resolved during brainstorm:** which spec (Phase 8); surface placement (dedicated
  `/preview` route, promoted from the disabled placeholder); feature set (copy, in-prompt
  search, clear, not-canon notice, external version metadata); section expand/collapse
  deferred per the gate's "if feasible".

## Outcome

Completed: 2026-06-05

SPEC-008 implemented the Phase 8 validation-gated prompt preview in `@loom/web`:

- added a typed `compile()` client for `POST /api/compile`;
- extracted reusable `ValidationResultView` presentation for blocker/warning rendering;
- promoted "Validation / Prompt Preview" to a primary `/preview` route;
- rendered no prompt element when compile is validation-blocked or errors;
- rendered the successful prompt in an ephemeral, clearable, searchable, copyable preview;
- displayed template/compiler/contract versions, fingerprint, and length/token estimates
  outside the prompt body;
- left OpenRouter transport, candidate lifecycle, accepted segments, server behavior, core
  compiler behavior, and storage schema out of scope.

Deviation from original plan: runtime smoke found that the web request helper sent
`Content-Type: application/json` on bodyless `POST /api/compile`, which Fastify rejected
in the production app. The helper now only sends `Content-Type` when a JSON body is
present, and the API client test covers that bodyless compile request.

Verification:

- `npm test -- packages/web/src/api.test.tsx packages/web/src/preview/PromptPreviewView.test.tsx packages/web/src/App.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Production smoke on `127.0.0.1`: blocked compile showed the blocker list and no prompt;
  ready compile showed the complete prompt with version metadata/fingerprint outside the
  prompt body; **Copy prompt** reported success; **Clear** removed prompt and metadata;
  the successful browser run produced no console log artifact containing prompt text or
  API-key-like data.
