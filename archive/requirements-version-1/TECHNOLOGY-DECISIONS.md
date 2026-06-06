# Technology Decisions — Continuity Loom v1

## Purpose

This spec selects a practical v1 technology stack for a local-first, single-user, deterministic continuity cockpit. The stack must be boring where correctness matters, ergonomic where record editing matters, and explicit where prompt/validation determinism matters.

## Scope

This spec covers runtime, frontend, backend, storage access, schema validation, forms, dense tables, development environment, desktop packaging alternatives, and researched rejected options. It does not define production code, migrations, component APIs, or test files.

## Non-goals

This spec does not mandate a desktop package, cloud backend, collaboration service, ORM, visual design system, or provider-specific prompt fork. It does not authorize nondeterministic compilation, model-driven record mutation, or storage of prompts/API keys in project data.

## Recommended v1 stack

SPEC-001 realizes the Phase 1 stack in code: Node 24 LTS + TypeScript baseline,
React + Vite local UI, WSL2-oriented Node launch path, npm workspaces, Fastify
localhost server, and Vitest verification.

### Runtime and language

Use **TypeScript on Node.js 24 LTS** as the v1 runtime foundation.

Node’s official release schedule shows Node 24 as the active LTS line in mid-2026 and Node 26 as the current release that enters LTS in October 2026. V1 should not chase Node 26 before it becomes LTS. Node 24 also satisfies current Vite requirements and provides the official `node:sqlite` module surface introduced in recent Node releases.

Default development target: WSL2 Ubuntu with Node 24 LTS.

### Frontend

Use **React + Vite** for the local web UI.

React’s official “start a new project” guidance recommends using a framework or build tool and shows Vite’s React TypeScript template as a lightweight way to start. Vite’s official guide currently requires Node 20.19+ or 22.12+ and supports a React TypeScript template. Node 24 LTS exceeds that requirement.

The app should be a browser-based local cockpit launched by a Node process. This avoids desktop packaging complexity in v1 while preserving a future packaging path.

### Backend/server

Use a small local Node server that:

- serves the built React UI;
- exposes a local API for project open/create, record CRUD, validation, compilation, OpenRouter send, and accepted segment operations;
- owns filesystem and SQLite access, so the browser UI does not need direct filesystem privileges;
- never logs API keys, prompts, candidate prose, accepted prose, or full record payloads by default.

A minimal HTTP framework is acceptable if it does not obscure request validation. The implementation should keep the domain core independent of HTTP so deterministic validation and compilation can be tested without a server.

### Canonical project store

Use **SQLite as the canonical project store** inside an explicit user-owned project folder.

SQLite is well suited to application file formats: it is a single cross-platform file, supports transactions, can be inspected with ordinary tools, and is recommended by the SQLite project and the Library of Congress for durable application data. Its atomic-commit behavior is directly relevant to a continuity store that must not partially mutate records after crashes.

### SQLite access approach

Use **raw SQL through Node’s official `node:sqlite` module behind a thin typed repository layer** for v1.

Rationale:

- deterministic validation benefits from explicit queries and predictable data access;
- v1 should avoid ORM magic around record identity, references, and prompt inputs;
- `node:sqlite` avoids an extra native dependency and has official Node documentation, synchronous APIs, prepared statements, and SQL tag support;
- the app is single-user local, so synchronous SQLite work is acceptable when kept behind short operations and not used for long-running network work;
- an internal repository boundary preserves the option to move to `better-sqlite3`, Kysely, or Drizzle later if a concrete need appears.

Alternatives considered:

- **better-sqlite3**: strong, widely used, synchronous, and explicit. It is a reasonable fallback if `node:sqlite` support proves insufficient.
- **Kysely**: excellent type-safe SQL builder with thin “what you see is what you get” semantics. Consider later if raw SQL becomes hard to maintain.
- **Drizzle**: supports SQLite including `node:sqlite` and has good TypeScript ergonomics. Consider later if schema declaration and migrations become a bigger need than hand-auditable SQL.
- **Prisma**: not recommended for v1. It is powerful, but heavier than the app needs and less aligned with deterministic, local, inspectable SQLite-first validation.

### Runtime schema validation

Use **Zod** or an equivalent TypeScript-first runtime schema library for all record payload parsing, generation-time brief parsing, settings parsing, and OpenRouter response normalization.

Zod’s TypeScript-first runtime parsing model fits the project’s need to treat all persisted and loaded data as untrusted until validated. Static TypeScript types alone are not enough because project files and SQLite payloads can be externally inspected or edited.

### Forms

Use **TanStack Form** or **React Hook Form** with Zod integration. The recommended first choice is TanStack Form because its headless, TypeScript-first model pairs well with heterogeneous typed record editors and TanStack Table. React Hook Form remains a mature fallback if implementation experience favors it.

The CAST MEMBER editor should be custom, sectioned, and optimized for long prose fields. The app does not need WYSIWYG rich-text storage in v1. Store prose-rich fields as plain text or Markdown-like text, not opaque editor JSON or HTML.

### Dense browsing tables

Use **TanStack Table** for dense, headless record browsing. Record work needs fast filtering, grouping, sorting, column visibility, row selection, and split list/detail behavior. A headless table library avoids locking the app into one visual system.

### Rich text/editor tooling

For v1:

- use structured forms with large textareas for most prose-rich fields;
- optionally use a read-only code/editor surface such as CodeMirror for large prompt preview ergonomics;
- defer Tiptap/ProseMirror/Lexical as persistent rich-text editors unless plain-text editing proves inadequate.

This keeps the canonical data store inspectable and avoids a second editor-specific document format.

### Desktop packaging

Do **not** make a packaged desktop app mandatory for v1.

Tauri is the preferred future packaging direction if packaging becomes necessary: it uses system webviews and can produce small binaries, but it adds Rust and Linux WebKit dependency setup. Electron is mature and familiar, but it embeds Chromium and Node, which is unnecessary for a v1 local web app.

## User-facing behavior

The user starts the app from a Node process and opens it in a browser. The app should work well from WSL2 Ubuntu. The app may show a local URL and a project picker, but it should not require a hosted backend, account login, sync service, or packaged desktop shell.

Users should not be exposed to SQLite mechanics during ordinary use. They should see explicit projects, records, validation, prompt preview, generation, candidates, and accepted prose.

## Data/logic implications

The technology stack must preserve a deterministic domain core:

- validation and prompt compilation must be pure enough to test with in-memory objects;
- SQLite access must be explicit and bounded;
- Zod schemas must define runtime acceptance for record payloads and settings;
- UI state may be rich and reactive, but cannot become a hidden continuity source;
- OpenRouter transport must be isolated from continuity authority.

The app should treat project data as data, not source code. The project folder is portable and inspectable, but app behavior is mediated by schema validation and repository logic.

## Alignment with `FOUNDATIONS.md`

The stack supports the foundation by keeping data local and user-owned, separating deterministic validation/compiler logic from model transport, making prompt inspection feasible, avoiding cloud authority, and avoiding packaging complexity that would distract from continuity correctness.

## Security/privacy implications

The local server must bind only to localhost by default. It must not expose project operations to the LAN. It must not log API keys, prompts, candidates, accepted prose, or full record payloads. API keys live in environment variables or equivalent global local secret storage, never project folders.

SQLite files may contain sensitive story material. The app should not upload project data except the one prompt sent intentionally through OpenRouter.

## Validation implications

Zod validation is not the story validation engine, but it is the first gate: malformed persisted payloads should not enter domain validation. Domain validation then checks continuity, prompt completeness, secrets, physical possibility, and local-prose-only constraints.

Raw SQL/repository logic must not bypass runtime validation when loading or saving records.

## Failure modes

Key technology failure modes:

- choosing an ORM that hides too much and makes deterministic validation opaque;
- storing rich-text editor internals as canonical prose fields;
- making a desktop wrapper mandatory before core continuity behavior exists;
- using browser-only storage and losing explicit project-folder ownership;
- allowing the dev server to listen beyond localhost;
- using Node versions that mismatch Vite or SQLite assumptions;
- letting generated prompt text leak into logs or persisted debug files.

## Done Means

The technology decision is satisfied when:

- Node 24 LTS + TypeScript is the documented runtime baseline;
- React + Vite is the documented local web UI approach;
- WSL2 Ubuntu is a supported development path;
- SQLite is the canonical per-project store;
- raw SQL via `node:sqlite` behind a typed repository boundary is the v1 default, with better-sqlite3/Kysely/Drizzle listed as justified alternatives but not default;
- Prisma is rejected for v1 unless a future spec overturns the rationale;
- Zod or equivalent runtime parsing is required for project/settings data;
- TanStack Table and a typed form strategy are selected for dense record work;
- desktop packaging is explicitly future, with Tauri preferred over Electron if needed;
- no technology choice introduces cloud dependency, collaboration, nondeterministic compilation, accepted-prose prompt sourcing, or API-key leakage.

## Research sources

- Node.js previous releases and release schedule: https://nodejs.org/en/about/previous-releases and https://nodejs.org/en/about/previous-releases#release-schedule
- Vite guide: https://vite.dev/guide/
- React “Start a New React Project”: https://react.dev/learn/start-a-new-react-project
- Microsoft WSL install and Node on WSL guidance: https://learn.microsoft.com/windows/wsl/install and https://learn.microsoft.com/windows/dev-environment/javascript/nodejs-on-wsl
- SQLite application file format guidance: https://sqlite.org/appfileformat.html
- SQLite atomic commit: https://sqlite.org/atomiccommit.html
- SQLite corruption guidance and PRAGMA documentation: https://sqlite.org/howtocorrupt.html and https://sqlite.org/pragma.html
- Library of Congress SQLite format description: https://www.loc.gov/preservation/digital/formats/fdd/fdd000461.shtml
- Node `node:sqlite` docs: https://nodejs.org/api/sqlite.html
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Drizzle SQLite docs: https://orm.drizzle.team/docs/get-started-sqlite
- Kysely docs: https://kysely.dev/
- Prisma SQLite docs: https://www.prisma.io/docs/concepts/database-connectors/sqlite
- Zod: https://zod.dev/
- TanStack Form and Table: https://tanstack.com/form and https://tanstack.com/table
- Tauri docs: https://tauri.app/ and https://v2.tauri.app/start/prerequisites/
- Electron docs: https://www.electronjs.org/docs/latest/
