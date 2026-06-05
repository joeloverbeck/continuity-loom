# SPEC-001 — Repository and Runtime Foundation

Status: COMPLETED
Phase: Implementation Order Phase 1
Date: 2026-06-05
Governing authority: `docs/FOUNDATIONS.md`

## Brainstorm Context

- **Original request:** Create the first spec in `specs/*` for what to build at this greenfield stage, grounded in `docs/FOUNDATIONS.md` and `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`, and indicate which `docs/requirements-version-1/*` files to mark done once the spec is implemented.
- **Reference material:** `docs/FOUNDATIONS.md` (constitution), `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (14-phase build order), `TECHNOLOGY-DECISIONS.md`, `LOCAL-FIRST-STORAGE.md`, `TESTING-STRATEGY.md`, `README-SPEC-INDEX.md`.
- **Scope decision:** This spec covers **Implementation Order Phase 1 only** (repository and runtime foundation). Local project folders and the canonical SQLite store (Phase 2) are deliberately deferred to a later spec, because Phase 1's clean dependency boundary is the substrate everything else builds on.
- **Final confidence:** ~93%. The build order and stack are fully settled by the requirements docs; the only open choices were sub-tooling, carried below as explicit decisions.
- **Note on house style:** This file follows the section structure used by the `docs/requirements-version-1/*` specs (Purpose / Scope / Non-goals / … / Done Means) and adds an explicit architecture, verification, and requirements-doc-update section.

---

## Purpose

Establish the TypeScript/Node + React/Vite local web-app skeleton for Continuity Loom v1, with a hard separation between the React UI, the localhost Node server, and a pure deterministic domain core.

This phase exists so every later phase — storage, data model, CRUD, validation, compiler, prompt preview, OpenRouter transport, candidate lifecycle, accepted archive — has a stable, correctly-layered home. The constitutional payoff of doing this first is that the deterministic domain core (where validation and prompt compilation will live) is provably isolated from HTTP and UI from day one, so it can be tested without a server or a browser.

This phase must not spend effort on desktop packaging, storage, API-key handling, or any model transport.

## Scope

This spec covers:

- the workspace/package layout and the one-way dependency direction between layers;
- the deterministic domain core package boundary (no filesystem, no HTTP, no SQLite, no framework imports);
- a localhost-only Node server that serves the built UI and a stub API;
- the React + Vite UI shell with a minimal placeholder screen;
- the development experience (Vite dev server + API proxy) and the single-port production launch (Node serves built assets, opens browser);
- a placeholder settings boundary that handles no secrets;
- baseline tooling: TypeScript strict, ESM, Vitest, ESLint, Prettier, the `dev` / `build` / `typecheck` / `lint` / `test` scripts, and a pinned Node runtime (`engines.node >= 24` in the root `package.json` plus an `.nvmrc`) so the named Node-version-mismatch failure mode is guarded rather than only warned about;
- the smoke/boundary tests that prove the phase gate;
- the modifications to `docs/requirements-version-1/*` to perform when this spec is implemented.

## Non-goals

This spec does **not**:

- create local project folders, project metadata files, or any SQLite store (Phase 2);
- define runtime record schemas, record identity, or repository interfaces (Phase 3);
- build record CRUD, editors, validation, or the prompt compiler (Phases 4–7);
- add OpenRouter transport, API-key reading, or any secret handling beyond an inert settings boundary (Phase 9);
- introduce a packaged desktop app (Tauri/Electron) — explicitly future per `TECHNOLOGY-DECISIONS.md`;
- add any cloud account, sync, collaboration, or remote scaffolding;
- introduce routing, state-management libraries, a design system, or non-placeholder UI;
- introduce branches, plot-rail machinery, accepted-prose handling, or any LLM call.

The Phase-1 UI is intentionally **pre-`UI-WORKFLOWS.md`**: a placeholder screen only. `IMPLEMENTATION-ORDER.md`'s cross-spec table lists `UI-WORKFLOWS.md` as informing Phase 1, but its record-editing, working-set-curation, and generation workflows belong to Phases 4–12; nothing from it is realized here beyond the bare launch-and-render loop.

## Recommended stack (from `TECHNOLOGY-DECISIONS.md`)

The stack is already settled by `TECHNOLOGY-DECISIONS.md`; this spec realizes the Phase-1-relevant subset and does not re-litigate it:

- **Runtime/language:** TypeScript on **Node.js 24 LTS**. Default development target: WSL2 Ubuntu.
- **Frontend:** **React + Vite** (TypeScript template). Browser-based local cockpit launched by a Node process.
- **Backend:** a small **localhost** Node server that serves the built UI and exposes a local API, keeping the domain core independent of HTTP.
- **Runtime schema validation:** **Zod** is the project standard; in Phase 1 it is used only for validating the stub API responses / version payload shape, not for record payloads (those arrive in Phase 3).

Phase-1 sub-tooling decisions (left open by `TECHNOLOGY-DECISIONS.md`, fixed here):

- **Workspace tool: npm workspaces.** Built into the npm bundled with Node 24; zero extra tooling, "boring where correctness matters." pnpm is an acceptable drop-in if a future need appears; switching does not change the package boundaries below.
- **HTTP framework: Fastify.** Mature, fast, with first-class request/response schema validation for the future record-CRUD / compile / send API, and controllable logging so keys, prompts, candidate prose, and full record payloads are never emitted by default (FOUNDATIONS §23). Hono is the lighter alternative; bare `node:http` is possible but boilerplate-heavy. The choice is encapsulated in the `server` package and does not leak into `core`.
- **Test runner: Vitest.** Pairs with Vite, ESM-native, fast.
- **Lint/format: ESLint (flat config) + Prettier**, with TypeScript strict mode.

## Architecture and structure

Three packages with a strict one-way dependency direction:

```text
continuity-loom/
  package.json                 # workspace root; scripts: dev, build, typecheck, lint, test; engines.node >= 24
  .nvmrc                        # pins Node 24 LTS for the dev/launch toolchain
  tsconfig.base.json           # shared strict TS config; project references below
  packages/
    core/                      # pure TypeScript domain layer
      package.json             # name: @loom/core ; no internal deps
      tsconfig.json
      src/
    server/                    # localhost Node HTTP server (Fastify)
      package.json             # name: @loom/server ; depends on @loom/core
      tsconfig.json
      src/
    web/                       # React + Vite UI
      package.json             # name: @loom/web ; depends on @loom/core (types) ; Vite app
      tsconfig.json
      src/
      vite.config.ts
```

Dependency direction (must remain one-way):

```text
web  ─▶ core
server ─▶ core
core ─▶ (nothing internal; no fs, no http, no sqlite, no framework)
```

### `packages/core` — deterministic domain layer

- Pure TypeScript. **Must not** import any `node:*` builtin (the whole namespace — `node:fs`, `node:fs/promises`, `node:http`, `node:https`, `node:net`, `node:sqlite`, `node:child_process`, `node:tls`, `node:dns`, etc.) or any I/O / framework module (`fastify`, `react`, `vite`). The denial is the entire `node:*` namespace rather than a hand-maintained blocklist; if a genuinely pure builtin is ever needed, it is added back by explicit allowance, so a forgotten I/O module can never silently re-enter `core`.
- Phase 1 content is intentionally minimal: shared types (e.g. a `versionInfo` type describing app/template/compiler version metadata) and any pure helpers needed by the stub API. It exists primarily to **establish and prove the boundary** that validation and the compiler will later occupy.
- This is the package that must be testable without a server or network (`TESTING-STRATEGY.md` "the domain core should be testable without the UI and without network"; `TECHNOLOGY-DECISIONS.md` "pure enough to test with in-memory objects"), so the future validator/compiler can satisfy FOUNDATIONS §4.4 / §8 deterministic compilation in isolation.

### `packages/server` — localhost transport boundary

- A Fastify server bound to **localhost only** (e.g. `127.0.0.1`), never `0.0.0.0` / LAN.
- Serves the built `web` static assets in normal launch mode.
- Exposes a stub API:
  - `GET /api/health` → `{ status: "ok" }`;
  - `GET /api/version` → app version + (placeholder) template/compiler version metadata sourced from `core`.
- Owns the future filesystem / SQLite / OpenRouter boundary. In Phase 1 it performs no fs, no storage, and no secret access.
- Logging is configured so that — now and as a standing default — API keys, prompts, candidate prose, accepted prose, and full record payloads are never logged (FOUNDATIONS §23; `TECHNOLOGY-DECISIONS.md` security section).

### `packages/web` — UI shell

- React + Vite, TypeScript. Minimal placeholder screen: app name and the version/health values fetched from `/api/version` and `/api/health`.
- No routing library, no global state library, no design system in Phase 1.
- Depends on `core` for shared types only; it must not import `server`.

### Boundary enforcement (three layers)

1. **Workspace graph:** `core` declares no internal dependencies; `server` and `web` depend on `core`. The package manager prevents `core` from importing the others.
2. **Lint rule:** an ESLint `no-restricted-imports` (with a `patterns` entry matching `node:*`, plus an `paths`/pattern denial of `fastify`, `react`, `vite`) — or an equivalent boundary plugin — rule in `core` forbids the entire `node:*` namespace and the named frameworks, with any pure builtin re-allowed only by explicit exception.
3. **Boundary test:** a Vitest test asserts the `core` source tree imports no `node:*` builtin (matched by namespace prefix, not an enumerated list) and none of the named frameworks, so a violation — including an I/O module nobody thought to blocklist — fails CI rather than only the linter.

## Key decisions

1. **Multi-package workspace over a single package with directory conventions.** Hard module boundaries make the deterministic-core isolation structural (it *cannot* import I/O), not merely advisory. This directly serves the constitution's requirement that validation/compilation be deterministic and independently testable.
2. **Localhost-only binding by default.** Project data is private creative material (often mature fiction); the server must never expose project operations to the LAN (`LOCAL-FIRST-STORAGE.md`, `TECHNOLOGY-DECISIONS.md`).
3. **Single-port production launch, dual-port dev.** Dev uses the Vite dev server with HMR plus the Node API server, with Vite proxying `/api`. Normal launch builds `core`/`web`, has the Node server serve the static assets and the API on one localhost port, and opens the browser. This satisfies the Phase 1 gate ("launches locally from Node and opens in browser") without a packaged shell. **Browser auto-open is best-effort:** the launch must always print the localhost URL prominently and treat opening as a convenience that may fail — on the default WSL2 Ubuntu target there is frequently no Linux default browser and the URL must be opened in the Windows host. The gate is satisfied by "prints the URL and opens it where the platform supports it," so a WSL2 launch where the user opens the printed URL manually still passes.
4. **Inert placeholder settings boundary.** A `settings` module defines the *interface* for future global settings (OpenRouter model, key-presence) and returns static defaults. It reads, stores, and logs **no** API key. This satisfies the gate's "placeholder settings boundary" while keeping FOUNDATIONS §23 / §29.9 clean from the first commit.
5. **ESM + TypeScript strict + project references.** `"type": "module"` across packages; strict TS with project references for correct build ordering and editor performance.

## Data flow / process

Phase 1 has no story data flow. The only runtime flow is operational:

```text
launch (node) ─▶ server binds 127.0.0.1 ─▶ serves built web assets + /api stub
browser opens ─▶ web fetches /api/health and /api/version ─▶ renders placeholder screen
```

In development:

```text
vite dev (HMR) ──/api proxy──▶ node server (127.0.0.1) ──▶ /api stub
```

No filesystem writes, no SQLite, no network egress, no secrets.

## Edge cases

- **Port already in use:** the server should fail with a clear, actionable message naming the port; it must not silently bind elsewhere without surfacing it.
- **API unreachable from the UI:** the placeholder screen should show a clear "cannot reach local server" state rather than a blank page, so the launch gate is observably pass/fail.
- **Accidental non-localhost binding:** treated as a defect; the boundary/smoke tests assert the bind address is loopback.
- **Core purity violation:** caught by both the lint rule and the boundary test; a forbidden import in `core` fails the build.
- **Browser cannot be auto-opened (e.g. WSL2 with no default Linux browser):** auto-open is best-effort and must never fail the launch; the server still prints the localhost URL prominently for the user to open manually. A failed auto-open is not a gate failure.

## Verification / testing

Per `TESTING-STRATEGY.md`, the domain core must be testable without UI or network, and tests prioritize structural correctness over visual polish. Phase 1 verification:

- **Boundary test (Vitest):** `core` contains none of the forbidden I/O/framework imports.
- **Server smoke test (Vitest):** server boots on a loopback address; `GET /api/health` returns `{ status: "ok" }`; `GET /api/version` returns the expected version payload shape (validated with Zod); the bind address is localhost.
- **Build/typecheck/lint green:** `typecheck`, `lint`, and `build` all pass for every package.
- **Manual launch check:** the normal launch command starts the Node server and opens the placeholder UI in a browser, which displays the health/version values.

No live network calls, no real secrets, no fixtures with keys.

## User-facing behavior

The user runs a single command from a Node process (targeting WSL2 Ubuntu among other environments), the app prints a localhost URL and opens it, and a minimal placeholder cockpit appears showing the app name and version. There is no project picker, no records, and no generation yet — early builds intentionally feel like an empty shell. No account, login, sync service, or packaged desktop shell is required.

## Data/logic implications

- The deterministic domain core is established as a pure, side-effect-free package, preserving the option to test validation and compilation with in-memory objects in later phases.
- The HTTP boundary is isolated in `server`, so the domain core never depends on transport.
- No continuity surface exists yet, but the layering ensures future surfaces (all records, active working set, generation-time brief, generated prompt, accepted segment archive) can remain distinct rather than blurred by an over-coupled foundation.

## Alignment with `FOUNDATIONS.md`

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §4.4 Deterministic compilation / §28.3 record-grounded context | aligns | Pure `core` package with enforced no-I/O boundary @ domain core — guarantees the future compiler/validator is deterministic and testable without HTTP/UI. |
| §4.10 / §24 / §29.10 Local-first, user-owned data | aligns | No cloud account, sync, or remote scaffolding; localhost-only server @ runtime/server. |
| §23 / §29.9 OpenRouter and secrets | aligns | Placeholder settings boundary reads/stores/logs no API key; logging configured to never emit keys/prompts @ server/settings. |
| §9 Universal prose prompt contract | N/A (preserved) | No provider-specific forks or prompt logic introduced; the boundary that keeps the prompt contract portable is left intact @ compiler (future). |
| §27 / §29.3 UI and active-working-set inspectability | aligns | Layered foundation keeps the five continuity surfaces separable for later phases; no hidden coupling @ UI/server. |

No §29 hard-fail question is answered "yes": no autonomous generation, no branches, no plot rails, no accepted-prose-as-canon, no LLM record mutation, no validation override, no permanent prompt archive, no key leakage, no remote authority.

## Security/privacy implications

- The server binds only to a loopback address by default and must not expose project operations to the LAN.
- No API keys are read, stored, embedded, or logged in this phase; the settings boundary is inert with respect to secrets.
- Logging is configured to never emit API keys, prompts, candidate/accepted prose, or full record payloads — established as a standing default before any sensitive data exists.
- No project data is written to disk in Phase 1, so there is no project store that could leak secrets yet.

## Validation implications

Domain (continuity) validation does not exist yet — it arrives in Phase 6. Phase 1 only introduces Zod at the transport edge to validate the stub API/version payload shapes. The layering guarantees that when domain validation is added, it can run in the pure `core` package independent of HTTP and UI, as `TESTING-STRATEGY.md` requires.

## Failure modes

- Spending Phase 1 effort on desktop packaging instead of the local web loop.
- Letting the dev/launch server listen beyond localhost.
- Allowing `core` to import filesystem, HTTP, SQLite, or framework modules, eroding the deterministic-core boundary.
- Introducing storage, key handling, or any model transport prematurely under the banner of "foundation."
- Using a Node version that mismatches Vite/SQLite assumptions (target Node 24 LTS) — guarded by `engines.node >= 24` and `.nvmrc`, not left to convention.
- Adding routing/state/design-system weight before there is any product behavior to justify it.

## Risks & Open Questions

- **Open questions:** none remaining. The only choices left open by `TECHNOLOGY-DECISIONS.md` for this phase — workspace tool, HTTP framework, test runner, lint/format — were resolved in §Key decisions and §Recommended stack (npm workspaces, Fastify, Vitest, ESLint flat config + Prettier). All five `IMPLEMENTATION-ORDER.md` Phase 1 gate items are covered by §Done Means.
- **Known risk — boundary enforcement scope:** the deterministic-core isolation is only as strong as the `node:*`-namespace denial in the lint rule and boundary test (§Architecture › Boundary enforcement). Decomposition must implement the namespace-prefix match, not a hand-maintained blocklist.
- **Known risk — WSL2 launch:** the "opens in browser" gate degrades to best-effort on the default WSL2 target; the printed URL is the durable contract (see §Edge cases and §Key decisions #3).
- **Deferred by design:** storage, SQLite, record schemas, validation, the compiler, OpenRouter transport, and API-key handling are out of scope (§Non-goals) and carried by later-phase specs.

## Requirements-doc updates on completion

When this spec is implemented and its Done Means criteria pass, update the requirements documents to record the work as done:

1. **`docs/requirements-version-1/IMPLEMENTATION-ORDER.md` — Phase 1 ("Repository and runtime foundation"):**
   - Add a status line directly under the Phase 1 heading: `Status: ✅ Implemented via SPEC-001 (2026-…).`
   - Mark each Phase 1 phase-gate bullet as satisfied (convert the bullet list to checked items, e.g. `- [x] app launches locally from Node and opens in browser`), or add a short "Verified by SPEC-001" note to the phase gate block.
   - Do not alter the ordering rationale or any later phase.

2. **`docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`:**
   - Add a one-line note in the relevant area (e.g. near "Done Means" or "Recommended v1 stack") that the Phase-1 stack choices are now realized in code: Node 24 LTS + TypeScript baseline, React + Vite local UI, WSL2 development path, npm workspaces, Fastify localhost server, Vitest — with a reference to SPEC-001. Do not remove or rewrite the existing decision rationale or the deferred (storage, OpenRouter, packaging) choices.

3. **No other `docs/requirements-version-1/*` file is marked done by this spec.** `LOCAL-FIRST-STORAGE.md`, `DATA-MODEL-AND-RECORDS.md`, `VALIDATION-ENGINE.md`, `PROMPT-COMPILER.md`, etc. remain open for their respective later-phase specs.

These doc edits are part of the spec's completion; they are performed by the implementer at the end of the work, not as a precondition.

## Done Means

This spec is satisfied when:

- a TypeScript/Node 24 + React/Vite local web app skeleton exists with `packages/core`, `packages/server`, and `packages/web` and a one-way `web→core`, `server→core`, `core→(nothing internal)` dependency direction;
- `core` is pure TypeScript with no filesystem, HTTP, SQLite, or framework imports, enforced by both a lint rule and a boundary test;
- the Node server binds to localhost only, serves the built UI, and exposes `/api/health` and `/api/version` stubs;
- the app launches from a Node process, prints the localhost URL prominently, and opens a minimal placeholder cockpit in the browser showing version/health (auto-open is best-effort; on WSL2 without a default browser, opening the printed URL manually still satisfies the gate);
- development runs via the Vite dev server with an `/api` proxy to the Node server;
- a placeholder settings boundary exists that handles no API keys and logs no secrets;
- `dev`, `build`, `typecheck`, `lint`, and `test` scripts exist and pass, including the boundary and server smoke tests;
- the Node runtime is pinned via `engines.node >= 24` in the root `package.json` and an `.nvmrc`;
- no cloud account, sync, collaboration, storage, SQLite, API-key handling, model transport, branches, plot rails, or accepted-prose handling has been introduced;
- `IMPLEMENTATION-ORDER.md` Phase 1 and the Phase-1 notes in `TECHNOLOGY-DECISIONS.md` are updated to mark this work done, per "Requirements-doc updates on completion."

## Research sources

The stack premises in this spec derive from the already-researched `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` (Node 24 LTS, React + Vite, Node `node:sqlite` for later phases, Zod, TanStack, Tauri-over-Electron-if-needed) and its cited sources, including:

- Node.js release schedule: https://nodejs.org/en/about/previous-releases
- Vite guide: https://vite.dev/guide/
- React "Start a New React Project": https://react.dev/learn/start-a-new-react-project
- Node on WSL guidance: https://learn.microsoft.com/windows/dev-environment/javascript/nodejs-on-wsl
- Zod: https://zod.dev/
- Fastify: https://fastify.dev/
- Vitest: https://vitest.dev/

Per `README-SPEC-INDEX.md`, the uploaded source hierarchy (FOUNDATIONS → compiler-contract → prompt-template → rationale → schema → stress-suite) wins over research; research selects tools, not continuity authority.

## Outcome

Completed: 2026-06-05

Implemented the Phase 1 repository/runtime foundation through archived tickets
`SPEC001REPRUNFOU-001` through `SPEC001REPRUNFOU-008`: npm workspace root,
Node 24 engine pin, strict TypeScript/ESM baseline, ESLint/Prettier/Vitest
tooling, pure `@loom/core` with enforced no-Node/no-framework boundary,
Fastify loopback `@loom/server` with `/api/health` and `/api/version`, inert
settings boundary, React + Vite `@loom/web` placeholder cockpit, dev proxy,
single-port production launch, best-effort browser open, and requirements-doc
completion annotations.

Deviation from the original plan: the core boundary scanner lives under
`packages/core/test/` instead of `packages/core/src/` so production core source
can remain genuinely free of `node:*` imports while the scanner itself uses
Node filesystem APIs.

Verification results: `npm run typecheck`, `npm run lint`, `npm test`, `npm run
build`, `npm audit --omit=dev`, `git diff --check`, package-local core/server/web
tests, a negative core-boundary import check, and a localhost production launch
smoke all passed. The local shell used Node 22.17.0, so `npm install` correctly
reported the expected `engines.node >=24` warning while still allowing
verification commands to run.
