# CLAUDE.md — Continuity Loom

Continuity Loom is a **local-first story-state operating system**: a Node process serves a React UI and a localhost-only API that tracks story records, compiles them into a deterministic prose-generation prompt, and handles segment acceptance. No account, no cloud — data stays on the user's machine.

## Start Here

Read `docs/ACTIVE-DOCS.md` before changing code or docs. It is the post-v1 map of active authorities, archived material, and change-intake rules.

Read `docs/FOUNDATIONS.md` before any change to runtime behavior, stored data, prompt compilation, validation rules, generation behavior, accepted-segment behavior, OpenRouter behavior, or LLM-assistance surfaces. A feature that conflicts with `FOUNDATIONS.md` is wrong unless `FOUNDATIONS.md` is deliberately amended first.

Treat `archive/**` as historical evidence, not active implementation guidance, unless an active issue or doc explicitly points to a specific archived file.

## Architecture

npm-workspaces ESM monorepo, Node ≥ 24 (`.nvmrc`), strict TypeScript. Three packages:

- **`@loom/core`** — pure continuity/compiler logic. **Purity boundary enforced by ESLint `no-restricted-imports` and a boundary test: no `fastify`, `react`, `vite`, or `node:*` builtins.** Keep it framework- and platform-free.
- **`@loom/server`** — serves the built UI and the localhost API.
- **`@loom/web`** — React + Vite front end.

Every server — dev, API, and production launch — binds `127.0.0.1` only. Never expose the app to the LAN.

## Commands

```bash
npm run lint        # ESLint + per-package lint, incl. the core import-boundary rule
npm run typecheck   # strict TS, all packages
npm test            # builds @loom/core first, then Vitest
npm run build       # build all packages
npm run dev         # Vite HMR + API side by side (UI :5173, API :5174)
npm start           # build all, serve UI+API on one port (:4173)
```

The first four also gate CI on every push to `main` and every PR. Run the relevant checks before claiming any change complete, and report any command that could not be run.

## Governing docs

**`docs/FOUNDATIONS.md` is the project constitution.** Section 29 is the alignment checklist every PRD and implementation issue must clear.

Use `docs/ACTIVE-DOCS.md` to choose the right active doc before touching a domain:

| Touching… | Read |
|---|---|
| The deterministic prompt compiler | `docs/compiler-contract.md` |
| The universal prompt template / its rationale | `docs/prompt-template.md`, `docs/prompt-template-rationale.md` |
| Story record shape and fields | `docs/story-record-schema.md` |
| Validation, stress behavior, hard-fail edge cases, or demo blockers | `docs/validation-rule-inventory.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md` |
| Non-binding validation research candidates | `docs/narrative-theory-blocker-roadmap.md` |
| User-facing local loop and project ownership | `docs/user-guide.md` |

## Change intake and archive

All change intake goes through GitHub. Broad or risky behavior changes — compiler, validation, storage, schema, accepted-prose boundaries, OpenRouter/security, local-first data, or anything that could violate `FOUNDATIONS.md` — start as a **PRD** published to GitHub Issues. Narrow, already-scoped implementation work starts as a **GitHub issue**. See `docs/agents/issue-tracker.md`.

The repository-native `specs/` and `tickets/` workflow is retired. Do not open new local specs or tickets, and do not treat the absence of a local spec as a gate on published work. `tickets/README.md` and `tickets/_TEMPLATE.md` survive only as historical format references.

Completed requirements sets and reports move under `archive/` according to `docs/archival-workflow.md`. Do not revive archived v1 requirements as active backlog.

## Agent skills

### Issue tracker

Engineering-workflow issues and PRDs are tracked in GitHub Issues; external pull requests are also a triage request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. Read the root `CONTEXT.md` and `docs/adr/` when present. See `docs/agents/domain.md`.

## Conventions

- **ESM only** (`"type": "module"`) — no CommonJS `require`.
- Keep changes narrow and aligned with package boundaries.
- Never adapt tests to match a bug — fix the code.
- Do not introduce backwards-compatibility aliases, shims, or duplicate authority paths unless a published PRD explicitly justifies them.
- Do not let rejected candidates, superseded candidates, or automatic prose-derived summaries become prompt context. Accepted prose may appear only as bounded evidence in the exact one-segment assistance profiles sanctioned by `docs/FOUNDATIONS.md` §9.1; it never becomes canon or prose-prompt authority.
- Do not weaken validation gates, deterministic compilation, API-key secrecy, localhost binding, or local-first project ownership.
