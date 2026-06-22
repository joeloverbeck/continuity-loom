# continuity-loom

Track story record continuity, generate deterministic prompts, and handle story segment acceptance.

Continuity Loom runs as a local-first web app: a Node process serves a React UI and a localhost-only API. There is no account, login, or cloud service — your data stays on your machine.

Core capabilities include deterministic prompt preview, OpenRouter-assisted generation and ideation, local accepted-segment handling, private notes that stay out of prompts, and Record Hygiene review for overlapping active story records.

## Prerequisites

- **Node.js ≥ 24.** The version is pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm) run `nvm use` in the repo root. npm ships with Node.

## Install

```bash
npm ci
```

## Documentation

- [User guide](docs/user-guide.md) — the local-first story loop, prompt preview, OpenRouter settings, candidate lifecycle, accepted segments, backup, and FAQ.
- [Active docs map](docs/ACTIVE-DOCS.md) — where future coding agents should start after v1.
- [Foundations](docs/FOUNDATIONS.md) — the constitutional design contract for continuity authority, deterministic compilation, validation, accepted-prose boundaries, local-first data, and future work.
- [Validation rule inventory](docs/validation-rule-inventory.md) — the implemented validation diagnostic codes and severity drift check.
- [Narrative-theory blocker roadmap](docs/narrative-theory-blocker-roadmap.md) — non-binding research candidates, not validation authority or backlog.

## Run in development (hot reload)

```bash
npm run dev
```

This builds the API server, then runs the Vite dev server with hot module reload and the API side by side:

- **UI:** http://127.0.0.1:5173
- **API:** http://127.0.0.1:5174 (proxied under `/api` by the dev server)

Open the UI URL in your browser. Stop with `Ctrl+C`.

## Launch (production build)

```bash
npm start
```

This builds every package, then starts the Node server which serves the built UI **and** the API on a single localhost port:

- **App:** http://127.0.0.1:4173

The launcher tries to open your browser automatically. On WSL2 (the default development target) there is often no Linux default browser — if nothing opens, copy the URL printed in the terminal and open it manually (for example, in your Windows host browser).

## Verify

```bash
npm run lint        # ESLint + per-package lint, incl. the core import-boundary rule
npm run typecheck   # strict TypeScript, all packages
npm test            # Vitest: core boundary test + server smoke/gate tests
npm run build       # build all packages
```

These four checks also run on every push to `main` and every pull request via GitHub Actions (`.github/workflows/ci.yml`).

## Networking

Every server — dev, API, and production launch — binds to `127.0.0.1` (localhost) only. The app is never exposed to your LAN.

## Record Hygiene

Record Hygiene is a project-required menu view for reviewing overlap, stale shadows, and consolidation candidates across non-archived hygiene-active atomic records. Whole project is the default scope and is the right choice for finding duplicates anywhere in the store. Active working set scope narrows review to the records you are currently working with, useful after you sideline records from the next generation without archiving them. Compile and inspect the prompt locally first; the OpenRouter send requires an explicit confirmation because the in-scope active record payload, including hidden SECRET content, leaves the machine for that request.

Record Hygiene findings are non-canonical scratch. The page has no apply, merge, delete, deactivate, archive, accept, fix-all, working-set mutation, brief-insertion, or use-as-prose action. Use citation links to open records and make any durable edits yourself.
