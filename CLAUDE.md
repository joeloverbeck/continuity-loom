# CLAUDE.md — Continuity Loom

Continuity Loom is a **local-first story-state operating system**: a Node process
serves a React UI and a localhost-only API that tracks story records, compiles
them into a deterministic prose-generation prompt, and handles segment acceptance.
No account, no cloud — data stays on the user's machine.

## Architecture

npm-workspaces ESM monorepo, Node ≥ 24 (`.nvmrc`), strict TypeScript. Three packages:

- **`@loom/core`** — pure continuity/compiler logic. **Purity boundary (enforced by
  ESLint `no-restricted-imports` + a boundary test): no `fastify`, `react`, `vite`,
  or `node:*` builtins.** Keep it framework- and platform-free.
- **`@loom/server`** — serves the built UI and the localhost API.
- **`@loom/web`** — React + Vite front end.

Every server (dev, API, production launch) binds `127.0.0.1` only — never expose to the LAN.

## Commands

```bash
npm run lint        # ESLint + per-package lint, incl. the core import-boundary rule
npm run typecheck   # strict TS, all packages
npm test            # builds @loom/core first, then Vitest
npm run build       # build all packages
npm run dev         # Vite HMR + API side by side (UI :5173, API :5174)
npm start           # build all, serve UI+API on one port (:4173)
```

The first four also gate CI on every push to `main` and every PR. Run lint + typecheck
+ test before claiming any change complete.

## Governing docs

**`docs/FOUNDATIONS.md` is the project constitution.** Before any change to runtime
behavior, stored data, the prompt-compilation path, validation rules, or LLM-assistance
surfaces, it governs — and a feature that conflicts with it is wrong unless FOUNDATIONS is
amended first. **§29 is the alignment checklist** every spec/ticket must clear.

When working in a specific domain, read the relevant spec:

| Touching… | Read |
|---|---|
| The deterministic prompt compiler | `docs/compiler-contract.md` |
| The universal prompt template / its rationale | `docs/prompt-template.md`, `docs/prompt-template-rationale.md` |
| Story record shape & fields | `docs/story-record-schema.md` |
| Validation / hard-fail edge cases | `docs/stress-suite.md` |

## Conventions

- **ESM only** (`"type": "module"`) — no CommonJS `require`.
- Work flows **`specs/` → `tickets/` → `archive/`**, driven by the `brainstorm`,
  `reassess-spec`, and `spec-to-tickets` skills; archive per `docs/archival-workflow.md`.
- Never adapt tests to match a bug — fix the code.
