# SPEC-009 — OpenRouter Global Settings and Non-Streaming Send

Status: DRAFT
Phase: Implementation Order Phase 9
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED), SPEC-002 (Local Project Folder and SQLite Storage Foundation, COMPLETED), SPEC-003 (Typed Data Model and Record Identity/Reference Layer, COMPLETED), SPEC-004 (Record CRUD and Basic Editors, COMPLETED), SPEC-005 (Custom Rich Editors for CAST MEMBER and the Generation-Time Brief, COMPLETED), SPEC-006 (Deterministic Validation Engine, COMPLETED), SPEC-007 (Deterministic Prompt Compiler, COMPLETED), SPEC-008 (Prompt Preview Gated by Validation, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` (the Phase-9 authority), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 9 gate)
Supporting authorities: `docs/requirements-version-1/UI-WORKFLOWS.md` ("Generation"/settings surfaces), `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (candidate boundary — Phase 10), `docs/requirements-version-1/TESTING-STRATEGY.md` (OpenRouter mock strategy), `docs/FOUNDATIONS.md` §5 (authority hierarchy), §23 (OpenRouter and secrets), §25 (mature fiction envelope), §29.9 (prompt audit and secrets hard fails)

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style, and not any archived spec's incidental layout.

## Brainstorm Context

- **Original request:** Now that SPEC-008 is implemented and archived
  (`archive/specs/`), analyze `IMPLEMENTATION-ORDER.md` (and supporting
  `docs/requirements-version-1/*`) to determine the next spec for `specs/`, in
  full alignment with `docs/FOUNDATIONS.md`, relying on `compiler-contract.md`,
  `prompt-template.md`, `story-record-schema.md`, and `stress-suite.md`. Create that spec.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks Phases 1–8 ✅ (SPEC-001…008).
  **Phase 9 — OpenRouter global settings and non-streaming send** is the next link in
  the one-way dependency chain `storage → records → validation → compiler → preview →
  **transport** → candidate → accepted archive`. It sits *after* the Phase-8 preview
  (✅ SPEC-008, which consumes the validation-gated `POST /api/compile` and renders the
  inspectable prompt) and *before* the Phase-10 candidate editor/regenerate/discard/accept
  lifecycle, which builds on the candidate text that transport returns. The ordering doc
  is explicit: "transport should consume a compiled prompt and settings, not query
  records directly." Verified against code: `POST /api/compile` already returns
  `{ prompt, metadata }` only when not blocked; `packages/server/src/settings.ts` exports
  an inert placeholder `getSettings()` returning `{ openRouterModel: "unset",
  hasOpenRouterCredential: false }` (SPEC-001's "placeholder settings boundary"); the web
  `AppShell` already has a `/settings` route with an inline `SettingsSurface` placeholder
  ("OpenRouter key: Not configured"); the Fastify logger already `redact`s
  `req.headers.authorization`, `apiKey`, `api_key`, `prompt`, `candidateProse`,
  `acceptedProse`, `recordPayload`; `project-store.secret-boundary.test.ts` already
  enforces no API-key-shaped fields in project data. No OpenRouter transport, no real
  settings read, and no send endpoint exist yet, so Phase 9 is correctly next and nothing
  downstream (candidate lifecycle / accepted archive) is pulled forward.
- **Reference material:** none externally authored — the repo docs are orientation;
  the request is the spec. `compiler-contract.md` / `prompt-template.md` /
  `story-record-schema.md` / `stress-suite.md` were consulted and bear on this spec only
  indirectly: transport consumes the *already-compiled* prompt string verbatim and must
  not re-read or re-shape records, so the compiler/schema contracts constrain this spec
  by exclusion (transport touches none of them).
- **Scope decisions (single fully-constrained approach, two scope edges confirmed in brainstorm):**
  - **Candidate-side scope = read-only ephemeral display.** Phase 9 adds a **Generate**
    action on the existing `/preview` surface, sends the compiled prompt non-streaming,
    and displays the returned candidate text **read-only and ephemeral**, plus normalized
    errors. It ships **no** candidate editing, regenerate, discard, or accept — those are
    Phase 10. The disabled `"Generate/Candidate"` later-phase nav placeholder **stays
    disabled** (it is Phase 10's surface).
  - **Transport home = `@loom/server` only.** All OpenRouter code (request shaping, the
    `fetch`, secret read, response/error normalization, optional model-list refresh) lives
    in `@loom/server`. `@loom/core` is **untouched** — it stays continuity/compiler-only,
    preserving the enforced purity boundary (no `fastify`/`react`/`vite`/`node:*` in core).
    The pure, deterministic parts (request-builder, error normalizer) are unit-testable
    server modules; only the client module performs I/O.
- **Assumptions carried (detail-level, correct if not flagged):**
  - **Global settings storage = one global config file outside any project folder**,
    holding only non-secret model settings (`model`, `temperature`, `maxOutputTokens`,
    optional `topP`, optional cached model list). Default location is an OS app-config
    directory (`$XDG_CONFIG_HOME/continuity-loom/openrouter.json`, falling back to
    `~/.config/continuity-loom/openrouter.json`); overridable by an env var
    (`CONTINUITY_LOOM_CONFIG_DIR`) for tests. The file **never** contains the API key.
  - **API key source = `OPENROUTER_API_KEY` environment variable only** (read at request
    time from `process.env`, never persisted, never returned to the client, never logged).
    The settings API returns only a boolean `hasOpenRouterCredential`, never the value.
  - **Send is a new `POST /api/generate` endpoint** that internally builds the snapshot,
    re-runs `runValidation()` (server-side fail-closed gate — send is impossible when
    blockers exist, mirroring `/api/compile`), compiles the prompt, then calls OpenRouter.
    It returns a normalized `{ ok: true; candidate: { text } }` on success or a normalized
    structured error otherwise. It writes **nothing** durable.
  - **Settings are a new `GET`/`PUT /api/settings/openrouter` pair** plus an optional
    `POST /api/settings/openrouter/models` refresh; `packages/server/src/settings.ts`
    becomes the real read/write surface (replacing the inert placeholder), and the inline
    `SettingsSurface` in `AppShell.tsx` is promoted to a real editing surface (extracted
    into its own component file).
  - **One user message.** The request sends a single `user` role message containing the
    compiled prompt verbatim, `stream: false`, per OPENROUTER-INTEGRATION "Non-streaming
    send".
- **Final confidence:** ~93%. Which spec is settled by the dependency chain; the feature
  set (global settings, env-only key, non-streaming send, normalized errors, optional model
  refresh, read-only ephemeral candidate) is settled by OPENROUTER-INTEGRATION + the Phase-9
  gate; the two scope edges (candidate display depth, transport package home) were confirmed
  in brainstorm. Storage path/format and model-refresh ergonomics are detail-level and left
  to the implementer within the stated constraints.

---

## Problem Statement

After SPEC-008 the app can compile a blocker-free story state into the universal prose
prompt and let the user inspect it: `POST /api/compile` runs `runValidation()` first and
returns `{ prompt, metadata }` only when not blocked, and the `/preview` surface renders
that prompt ephemerally. **But there is no way to send that prompt to a model.** The
OpenRouter settings boundary is still the SPEC-001 placeholder
(`getSettings()` returns inert `{ openRouterModel: "unset", hasOpenRouterCredential:
false }`, wired to no route); the web `/settings` surface shows a static "OpenRouter key:
Not configured"; there is no API-key detection, no model configuration, no model-list
refresh, no outbound HTTP, and no send endpoint. The server makes **no** outbound network
calls today.

`IMPLEMENTATION-ORDER.md` Phase 9 is the next link in the one-way chain and is explicitly
gated *after* preview: "transport should consume a compiled prompt and settings, not query
records directly," and *before* Phase 10's candidate lifecycle. Building the candidate
editor before transport, or letting transport read records directly, would violate the
ordering doctrine and FOUNDATIONS.

`docs/requirements-version-1/OPENROUTER-INTEGRATION.md` is the Phase-9 authority. It fixes
OpenRouter as **transport only** — never continuity, validation, or record authority. It
requires: global (not per-project) settings for model / temperature / max output tokens /
optional `top_p`; the API key read from `OPENROUTER_API_KEY` or equivalent global local
secret storage **outside project folders**; the key absent from project metadata, SQLite
stores, prompts, prompt preview, logs, accepted prose, candidate text, generated files,
demo fixtures, and debug export; both manual model-id entry **and** optional model-list
refresh (cache failure must not block manual entry); a non-streaming chat-completion send
whose returned content becomes the **current session candidate, not an accepted segment**;
normalized error categories; logging prohibitions; and a request lifecycle that mutates no
project data on failure.

`FOUNDATIONS.md` reinforces this: §23 makes the secret rules constitutional and requires
the model setting be "stored data-driven in a configurable file or equivalent local
configuration surface, not hardcoded into compiler logic," and the app to "fail safely and
clearly when no API key is configured"; §5 places governing model/provider/platform policy
*first* in the authority hierarchy (transport must not override it); §4.4 / §8 keep the
compiler LLM-free (transport consumes the compiled string and never feeds a model back into
compilation); §29.9 is the secrets hard-fail checklist this spec must clear.

**The compiled prompt exists and is inspectable; no transport exists.** Phase 9's job is to
add real global OpenRouter settings, env-only key handling, and a fail-closed non-streaming
send that returns read-only candidate text — entirely in `@loom/server` and `@loom/web`,
with `@loom/core` untouched — without ever logging or persisting keys, prompts, or candidate
text, and without writing any project data.

## Approach

Single approach — fully constrained by `OPENROUTER-INTEGRATION.md`, the Phase-9 gate, and
`FOUNDATIONS.md` §5/§23/§25/§29.9, layered on the SPEC-001…008 package boundary. Two scope
edges were confirmed in brainstorm: **read-only ephemeral candidate display** (no Phase-10
lifecycle) and **all transport code in `@loom/server`** (`@loom/core` untouched).

### `@loom/core` — untouched

No new core module, type, or export. Transport is platform I/O and provider shaping, not
continuity/compiler logic; placing it in core would breach the enforced purity boundary
(`packages/core/test/boundary.test.ts` forbids `fastify`/`react`/`vite`/`node:*`). The web
already imports `ValidationResult` / `CompileResult` as types from `@loom/core`; the
`/api/generate` response reuses those existing shapes for its blocked/error branches.

### `@loom/server` — settings, secrets, and transport

- **`packages/server/src/settings.ts` becomes real.** Replace the inert `getSettings()`
  with a read/write surface over a **global config file outside project folders**:
  - `readOpenRouterSettings(): OpenRouterSettings` — loads `{ model, temperature,
    maxOutputTokens, topP?, cachedModels? }` from the global config file (defaults applied
    when the file is absent/partial), and derives `hasOpenRouterCredential` from
    `process.env.OPENROUTER_API_KEY` presence at call time. **Never** returns the key.
  - `writeOpenRouterSettings(patch): OpenRouterSettings` — validates (Zod) and persists the
    **non-secret** model settings to the global config file; rejects any key-shaped field.
  - Config location: `CONTINUITY_LOOM_CONFIG_DIR` env override, else
    `$XDG_CONFIG_HOME/continuity-loom/`, else `~/.config/continuity-loom/`; filename
    `openrouter.json`. The file is created on first write; reads tolerate its absence.
  - The key is **never** read into this module's persisted state; it is read on demand by
    the transport client only.
- **`packages/server/src/openrouter/` — the transport (all I/O isolated to one module):**
  - `request.ts` (**pure**) — `buildChatCompletionRequest({ prompt, settings }):
    OpenRouterRequest` builds the POST body: `model`, a single `user` message containing
    the compiled prompt, `temperature`, the supported max-output-tokens parameter,
    optional `top_p`, `stream: false`. No I/O; fully unit-testable. No advanced provider
    routing / transforms / guardrail knobs (OPENROUTER-INTEGRATION non-goals).
  - `errors.ts` (**pure**) — `normalizeOpenRouterError(status, body?, cause?):
    NormalizedTransportError` maps HTTP status (400/401/402/403/408/429/502/503), the
    OpenRouter JSON error shape, network/timeout/abort causes, and malformed responses to
    the OPENROUTER-INTEGRATION category set: `missing-key`, `invalid-key`,
    `insufficient-credits`, `invalid-request`, `provider-unavailable`, `rate-limit`,
    `timeout`, `moderation-refusal`, `malformed-response`, `network`, `unknown`. Each
    carries a user-facing `message` and `category`; it **never** echoes the
    authorization header or raw key. Honors `Retry-After` as advisory metadata only (no
    auto-retry — OPENROUTER-INTEGRATION failure mode "retrying automatically and creating
    multiple unsaved candidates").
  - `client.ts` (**I/O**) — `sendChatCompletion({ prompt, settings, apiKey, signal? }):
    Promise<TransportResult>` performs the `fetch` to the OpenRouter chat-completions
    endpoint with `Authorization: Bearer <key>`, parses the first choice's message content
    into `{ ok: true; candidate: { text } }`, and routes every failure through
    `normalizeOpenRouterError`. Reads `OPENROUTER_API_KEY` from `process.env` at call time;
    fails with `missing-key` (before any network call) when absent. The endpoint URL and
    optional non-secret app/site headers come from config, not hardcoded compiler logic
    (§23 "data-driven … not hardcoded").
  - `models.ts` (**I/O, optional**) — `refreshModelList({ apiKey }):
    Promise<ModelListResult>` calls the OpenRouter models API and returns id/name/context-
    length metadata for caching in the global config file. Refresh failure is non-fatal:
    it returns a normalized error and the UI keeps manual model entry working. The
    OpenRouter models API also returns pricing and supported-parameters metadata
    (OPENROUTER-INTEGRATION "Model list"); v1 **intentionally defers** caching those —
    manual model entry is the primary path and the max-output-tokens parameter name is
    pinned in the pure `request.ts` builder (see Risks), so neither is needed for the v1
    send. A future spec may surface them if model-aware parameter validation is wanted.
- **Routes:**
  - `settings-routes.ts` — `GET /api/settings/openrouter` (returns the non-secret settings
    + `hasOpenRouterCredential`, never the key), `PUT /api/settings/openrouter` (Zod-
    validated non-secret patch), and optional `POST /api/settings/openrouter/models`
    (refresh + cache; failure → normalized error, manual entry unaffected).
  - `generate-routes.ts` — `POST /api/generate`: builds the snapshot via the existing
    `buildSnapshotFromOpenProject(manager)`, re-runs `runValidation()` and **returns the
    `validation-blocked` body with no candidate when blocked** (same fail-closed gate as
    `/api/compile` — send is impossible while blockers exist), compiles the prompt with
    `compilePrompt()`, reads settings + env key, calls `sendChatCompletion()`, and returns
    `{ ok: true; candidate: { text }, metadata: { model, versions } }` on success or a
    normalized structured error otherwise. Returns `missing-key` (without hitting the
    network) when the env key is absent. **No project records or accepted segments are
    written, ever** (Phase 10/11 own persistence). Reuses the
    `no-open-project` / `malformed-validation-source` snapshot-builder errors unchanged.
  - Register both in `createServer()` alongside the existing `register*Routes` calls.
- **Logging.** Extend the Fastify `redact` paths to also cover the OpenRouter request/
  response surfaces (`req.headers.authorization` is already redacted; add `messages`,
  `candidate`, `candidateText`, `choices`, `body` as applicable) so no full prompt, full
  candidate, raw request/response body, or key can reach logs. Default logs may include
  only timestamp, model id, status category, latency, and error category
  (OPENROUTER-INTEGRATION "Logging prohibitions").

### `@loom/web` — settings surface + Generate action + read-only candidate

- **`packages/web/src/api.ts` — typed clients** (reusing the existing `requestJson`/
  `postJson` helpers; note SPEC-008's fix: only send `Content-Type` when a JSON body is
  present):
  - `getOpenRouterSettings()`, `putOpenRouterSettings(patch)`, optional `refreshModels()`.
  - `generate(): Promise<GenerateResponse>` over `POST /api/generate`, a discriminated
    union: success `{ ok: true; candidate: { text }; metadata }`; blocked
    `{ ok: false; kind: "validation-blocked"; validation: ValidationResult }`; failure the
    shared `ApiFailure` shape carrying the normalized transport `kind`/`category` +
    `message` (and `no-open-project` / `malformed-validation-source`).
- **Settings surface (promote the existing placeholder).** Extract the inline
  `SettingsSurface` from `AppShell.tsx` into its own component file and make it a real
  editor: model id (manual entry, plus a chooser populated by optional refresh),
  temperature, max output tokens, optional `top_p`, an **"API key configured" / "API key
  missing"** status (never the value), and a **Refresh model list** action whose failure
  shows a non-blocking notice and leaves manual entry usable. The `/settings` route and
  nav link already exist — no nav change.
- **Generate action on `/preview` (read-only ephemeral candidate).** On the existing
  `PromptPreviewView`, in the **ready** (compiled, not blocked) state, add a **Generate**
  button that calls `generate()` and renders one of:
  - **sending** — a non-committal "Generating…" status (cancellable if practical;
    cancellation is not required to be durable);
  - **candidate** — the returned candidate text in a **read-only**, scrollable panel,
    clearly ephemeral, with a **Clear** action and a notice that it is a draft candidate,
    not an accepted segment, and not canon. **No edit field, no regenerate, no discard, no
    accept** (Phase 10);
  - **error** — the normalized transport error category as an actionable message (e.g.
    "API key missing — configure it in Settings", "Insufficient credits", "Rate limited —
    wait and retry", "Provider/model unavailable"), with project data unchanged;
  - **blocked** — defers to the existing blocked view (Generate is only offered in the
    ready state, but a state change between compile and send is handled by the
    `validation-blocked` response → no candidate).
  The candidate text lives only in React state for the session: it is **never** written to
  `localStorage` / `sessionStorage` / IndexedDB / disk, never logged to the console, and
  **Clear** or navigation drops it.
- **No secrets in the UI.** The settings surface shows only the boolean key status; the
  preview/candidate surfaces render only the endpoint payloads, which are key-free. No view
  introduces a field that could carry a key or secret-storage value.

## Deliverables

1. **Global OpenRouter settings (server).**
   - `settings.ts` rewritten to read/write non-secret model settings from a global config
     file outside project folders (location resolved via `CONTINUITY_LOOM_CONFIG_DIR` →
     `$XDG_CONFIG_HOME` → `~/.config`), with defaults when absent, and to derive
     `hasOpenRouterCredential` from `process.env.OPENROUTER_API_KEY`. Never reads/persists/
     returns the key. Rejects key-shaped fields on write.
   - `settings-routes.ts`: `GET`/`PUT /api/settings/openrouter` (+ optional models refresh),
     registered in `createServer()`.
   - Tests: settings round-trip through the config file; the key is never in the file, the
     GET/PUT responses, or any error; `hasOpenRouterCredential` flips with env presence; a
     key-shaped PUT field is rejected; reads tolerate a missing config file. The existing
     `packages/server/src/settings.test.ts` (currently asserting `getSettings()` returns the
     inert `{ openRouterModel: "unset", hasOpenRouterCredential: false }` defaults — its only
     consumer) is **replaced** by these tests, since `getSettings()` is removed; this keeps
     `npm test` green.

2. **OpenRouter transport (server, `openrouter/`).**
   - `request.ts` pure builder (one `user` message, `stream:false`, settings mapped to
     supported parameters, no advanced routing); `errors.ts` pure normalizer over the full
     category set incl. `missing-key`; `client.ts` `fetch`-based `sendChatCompletion` reading
     the env key at call time; optional `models.ts` refresh with non-fatal failure.
   - Tests (no real network — `fetch` mocked, per `TESTING-STRATEGY.md`): success →
     `{ candidate: { text } }`; 401 → `invalid-key`; 402 → `insufficient-credits`; 429 →
     `rate-limit`; 408/timeout/abort → `timeout`; network throw → `network`; malformed body
     (no choices / no content) → `malformed-response`; missing env key → `missing-key`
     **before** any fetch; the request body carries exactly one `user` message + `stream:false`;
     the authorization header / key never appears in any normalized error.

3. **Send endpoint (server).**
   - `generate-routes.ts`: `POST /api/generate` — snapshot → `runValidation()` (blocked →
     `validation-blocked`, no candidate) → `compilePrompt()` → `sendChatCompletion()` →
     normalized success/error; missing key → `missing-key` with no network call; writes no
     project data on success or failure; reuses `no-open-project` /
     `malformed-validation-source`. Registered in `createServer()`.
   - Tests (`fastify.inject` + mocked transport, plus the `captureProcessWrites` logging
     pattern from `compile-routes.test.ts`): blocked state → `validation-blocked`, no
     candidate, no network call; no-open-project → structured error; missing key →
     `missing-key`, no fetch; success → candidate text; transport error → normalized error;
     **no accepted segment / record is written** in any branch; logs (logger on) contain no
     prompt, no candidate text, no key, no raw request/response body.

4. **Logging redaction extension (server).**
   - Extend `createServer()`'s `redact.paths` to cover OpenRouter message/candidate/choices/
     body fields; a logging test asserts a deliberately seeded key/prompt/candidate string
     never appears in captured stdout/stderr.

5. **Web settings surface + API clients.**
   - `api.ts`: `getOpenRouterSettings()`, `putOpenRouterSettings()`, optional
     `refreshModels()`, and `generate()` returning the discriminated union; client tests for
     each branch (success/blocked/failure incl. `missing-key`).
   - `SettingsSurface` extracted from `AppShell.tsx` into its own component: model entry +
     optional chooser, temperature, max output tokens, optional top_p, "API key configured/
     missing" status (never the value), and a Refresh-model-list action with non-blocking
     failure. Component tests: settings load/edit/save; key status reflects the boolean;
     refresh failure leaves manual entry usable; the key value never appears in the DOM.
   - **`App.test.tsx` update** if the current test asserts the static placeholder text
     ("OpenRouter key: Not configured"); update it to the promoted surface's status text so
     `npm test` stays green.

6. **Generate action + read-only candidate on `/preview` (web).**
   - `PromptPreviewView` ready state gains a **Generate** button → `generate()` →
     sending/candidate/error/blocked states; read-only ephemeral candidate panel with
     **Clear** and a "draft candidate — not accepted, not canon" notice; **no** edit/
     regenerate/discard/accept.
   - Component tests: success → read-only candidate text present (no editable field, no
     accept control); error → actionable category message, no candidate; blocked-on-send →
     no candidate; **Clear** removes the candidate from the DOM; candidate text is never
     written to `localStorage`/`sessionStorage` (asserted); no accept/persist affordance
     exists.

7. **Styling.**
   - Minimal `packages/web/src/styles.css` additions for the settings form and the read-only
     candidate panel, consistent with existing surfaces; no new CSS framework.

8. **Env example.**
   - **Create** `.env.example` (it does not exist yet) and add `OPENROUTER_API_KEY=` (name
     only, no value). `.gitignore` already ignores `.env`/`.env.*` and whitelists
     `!.env.example` (lines 70–72), so no gitignore change is needed — confirm `.env` stays
     ignored (`FOUNDATIONS.md` §23 "Example environment files may name variables but must not
     contain real keys").

9. **Governing-doc updates on completion** (performed by the implementer when Verification
   passes, not a precondition):
   - `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 9: add
     `Status: ✅ Implemented via SPEC-009 (YYYY-MM-DD).` and check the Phase-9 gate bullets.
     Note that the candidate **lifecycle** (edit/regenerate/discard/accept) remains Phase 10
     and that Phase 9 ships only read-only ephemeral candidate display.
   - `docs/requirements-version-1/OPENROUTER-INTEGRATION.md`: add a short "Phase 9
     implementation note" recording the realized transport (global config file location,
     env-only key, `/api/generate` fail-closed gate, normalized categories, read-only
     ephemeral candidate, candidate lifecycle deferred to Phase 10).
   - Archive SPEC-009 to `archive/specs/` per `docs/archival-workflow.md` once complete.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §23 / §29.9 OpenRouter key never in project data/prompt/preview/logs/files | aligns | Key read only from `process.env.OPENROUTER_API_KEY` at request time; never persisted, never returned to client (only a boolean), never logged (redact extended); global config file holds non-secret settings only @ server settings + transport. |
| §23 Fail safely/clearly with no key; model setting data-driven not hardcoded | aligns | `missing-key` is returned before any network call; model/temperature/tokens/endpoint come from the global config file, not compiler logic @ server transport + settings. |
| §23 / §5 OpenRouter is transport only, not continuity authority; provider policy first | aligns | Transport consumes the compiled prompt string + settings, reads no records, mutates no records; governing provider policy stays first in the hierarchy (no app-level override of moderation/refusal) @ server transport. |
| §4.5 / §11 / §29.5 Fail closed; send impossible while blockers exist | aligns | `/api/generate` re-runs `runValidation()` and returns `validation-blocked` with no candidate when blocked — same server-side gate as `/api/compile`; no v1 override @ generate endpoint. |
| §4.4 / §8 / §29.4 Deterministic, LLM-free compilation | aligns | The model output is never fed back into compilation; transport is downstream of `compilePrompt()` and never selects/summarizes/repairs records @ server transport. |
| §2 / §3 / §20 / §29.2 / §29.8 Accepted prose only by explicit human acceptance; no canon mutation from generation | aligns | `/api/generate` returns a read-only ephemeral candidate and writes **no** records or accepted segments; acceptance is Phase 10/11 @ generate endpoint + web preview. |
| §9 / §10 / §22 No accepted prose in prompts; no permanent prompt/candidate archive | aligns | The sent message is the compiled prompt (no accepted prose by construction); prompt and candidate live only in session state, never persisted or logged @ web preview + server. |
| §25 Mature fiction envelope bounded by provider policy | aligns | No app-level sanitization is added; provider moderation/refusal is surfaced as a normalized `moderation-refusal` transport outcome, not treated as a validation result of the story state @ server transport. |
| §12 / §29.5 No plot-rail machinery | aligns | The send requests one local-prose segment via the existing compiled prompt; no act/beat/chapter or multi-response shaping is introduced @ server transport + web. |

No §29 hard-fail is answered "yes": the key lives only in env and never reaches project
data/prompt/preview/logs/files; send is blocked while validation blockers exist with no
override; the candidate is read-only/ephemeral and writes no records or accepted segments;
no LLM touches compilation or record authority; provider policy remains first in the
hierarchy; no permanent prompt/candidate archive is created; no plot-rail or
provider-specific-core surface is introduced.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green (lint
  includes the `@loom/core` import-boundary rule; this spec leaves core untouched, so the
  boundary test stays green).
- **Fail-closed send**: with a blocked project state, `POST /api/generate` returns the
  `validation-blocked` body, no candidate, and makes **no** network call; with a
  blocker-free state it sends and returns candidate text.
- **Missing-key safety**: with `OPENROUTER_API_KEY` unset, `/api/generate` returns
  `missing-key` **before** any fetch, mutates no project data, and the web shows an
  actionable "configure key in Settings" message.
- **Key never leaks**: the key value appears in no GET/PUT settings response, no config
  file, no normalized error, no log (logger-on test asserts a seeded key string is absent
  from captured stdout/stderr), and no DOM node; the settings UI shows only "configured/
  missing".
- **Transport correctness (mocked fetch)**: the request body has exactly one `user`
  message containing the compiled prompt and `stream:false`; each HTTP status / failure
  mode maps to its documented normalized category; `Retry-After` triggers no automatic
  retry.
- **No durable writes**: across success and every error branch, no record and no accepted
  segment is written; `/api/generate` touches no SQLite store and the accepted archive
  (Phase 11) does not exist.
- **Read-only ephemeral candidate**: the candidate panel offers no edit/regenerate/discard/
  accept; **Clear** removes it; the candidate text is written to no `localStorage`/
  `sessionStorage`/IndexedDB/disk (asserted) and is not logged.
- **Model list resilience**: with refresh failing/unavailable, manual model-id entry still
  works and the failure is a non-blocking notice.
- **Settings are global, not per-project**: the SQLite project store and project metadata
  contain no model settings and no key (the existing `project-store.secret-boundary.test.ts`
  continues to pass; settings live only in the global config file).
- **Manual smoke**: `npm start`; open a project; in **Settings**, set a model + parameters
  (with `OPENROUTER_API_KEY` set), confirm "API key configured"; on **Validation / Prompt
  Preview** with a blocker-free state, **Generate** and confirm a read-only candidate
  appears with a "draft — not accepted" notice; **Clear** empties it; unset the key and
  confirm a clear "configure key" error with no candidate and no crash; confirm the browser
  console / network logs contain no key, no full prompt, and no persisted candidate.

## Out of Scope

- **Candidate editor / regenerate / discard / accept lifecycle** — Phase 10
  (`CANDIDATES-AND-ACCEPTED-SEGMENTS.md`). Phase 9 ships only read-only ephemeral candidate
  display; the disabled `"Generate/Candidate"` later-phase nav placeholder stays disabled.
  Note the deliberate divergence from `OPENROUTER-INTEGRATION.md` request-lifecycle step 7
  ("displays **editable** candidate prose"): that editable candidate is the **Phase-10
  end-state**, gated out here by `IMPLEMENTATION-ORDER.md` Phase 9 ("non-streaming send
  returns candidate text") vs Phase 10 ("user can edit candidate before acceptance"). Phase 9
  is display-only; decomposition must not pull candidate editing forward.
- **Accepted-segment archive + browser, durable-change reminder** — Phases 11–12; the
  `"Accepted Segments"` placeholder stays disabled; no accepted-segment table/DDL is added.
- **Streaming send, provider routing/transforms, guardrail routing, provider preferences,
  experimental knobs** — OPENROUTER-INTEGRATION non-goals; v1 is non-streaming with model /
  temperature / max-output-tokens / optional top_p only.
- **Automatic retry / multi-candidate generation** — `Retry-After` is advisory only; a send
  produces at most one candidate (OPENROUTER-INTEGRATION failure mode).
- **Any `@loom/core` change** — transport lives entirely in `@loom/server`; the compiler,
  validation engine, version triple, and `CompileResult`/`ValidationResult` types are
  consumed/imported as-is. The purity boundary is preserved.
- **Per-project model configuration / storing settings or keys in the project store** —
  forbidden by §23; settings are global, the key is env-only.
- **Permanent prompt or candidate archive / prompt or candidate logging / transport
  request-response body persistence** — forbidden (§22, OPENROUTER-INTEGRATION logging
  prohibitions); prompt and candidate are ephemeral session state.
- **Asking another LLM to clean the response / any continuity inference from candidate
  text** — forbidden (§4.1, OPENROUTER-INTEGRATION "Response handling"); the response is
  surfaced verbatim (transport artifacts trimmed only), never mined for canon.
- **Schema changes / new SQLite tables / `user_version` bump** — none; `/api/generate`
  writes no durable project data.

## Risks & Open Questions

- **Global config file location across OSes.** The `$XDG_CONFIG_HOME` → `~/.config`
  resolution is Linux/macOS-friendly and matches the dev environment; Windows users would
  fall to `~/.config`. `CONTINUITY_LOOM_CONFIG_DIR` makes this testable and overridable. If
  a Windows-native `%APPDATA%` path is later wanted, it is an additive resolver change, not a
  contract change. `spec-to-tickets` should treat the config-resolver + settings.ts rewrite
  as the first reviewable diff (it has no UI/network dependency and unblocks the rest).
- **`fetch` and `node:*` in the transport client.** `client.ts`/`models.ts` use global
  `fetch` (Node ≥ 24) and may need `node:` builtins for config-file I/O — this is fine in
  `@loom/server` (the purity boundary applies only to `@loom/core`). Keep `request.ts` and
  `errors.ts` import-free of I/O so they stay pure and fast to unit-test.
- **Max-output-tokens parameter name.** OpenRouter's supported token parameter must be
  mapped correctly (`max_tokens` vs a newer field) — confirm against the live OpenRouter
  parameters doc at implementation time; the pure `request.ts` builder centralizes this so
  a single change covers it.
- **Moderation/refusal is a transport outcome, not a story-state verdict.** A provider
  policy refusal must surface as `moderation-refusal` and must **not** be presented as a
  validation pass/fail of the records (OPENROUTER-INTEGRATION failure mode; §25). The web
  copy should make this distinction without moralizing.
- **Cancellation.** An in-flight request "should be cancellable if practical" but
  cancellation support is not required to store durable state — implement `AbortSignal`
  wiring only if cheap; do not block the spec on it (YAGNI).
- **Stale prompt on send.** Because `/api/generate` recompiles from the *current* snapshot
  (not from the previewed string), a state change between preview and Generate is handled by
  re-validation + recompile — the user can never send a prompt that no longer validates.
  Consider surfacing in the UI that Generate compiles fresh (not "sends exactly what you
  previewed") to avoid confusion; minor copy decision, left to the implementer.
- **Resolved during brainstorm:** which spec (Phase 9); candidate-side depth (read-only
  ephemeral display, lifecycle deferred to Phase 10); transport package home (all in
  `@loom/server`, `@loom/core` untouched); key source (env-only); settings storage (global
  config file outside project folders).
