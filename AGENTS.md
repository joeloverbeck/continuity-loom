# AGENTS.md - Continuity Loom

Continuity Loom is a local-first story-state app: a Node process serves a React UI
and a localhost-only API for story records, deterministic prompt compilation, and
segment acceptance. Data stays on the user's machine; there is no account, login,
or cloud service.

## Repository Shape

This is an npm-workspaces ESM monorepo on Node >= 24 (`.nvmrc`) with strict
TypeScript.

- `packages/core`: pure continuity/compiler logic. Do not import `fastify`,
  `react`, `vite`, or `node:*` builtins here; ESLint and a boundary test enforce
  this platform-free boundary.
- `packages/server`: localhost API plus production UI serving.
- `packages/web`: React + Vite front end.

Every server path, including dev, API, and production launch, must bind
`127.0.0.1` only. Never expose the app to the LAN.

## Commands

Use these root commands unless a narrower package-local check is clearly enough:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Before claiming a code change complete, run the relevant checks and report any
that could not be run. `npm run dev` starts Vite HMR plus the API (`5173`/`5174`);
`npm start` builds and serves the app on `127.0.0.1:4173`.

## Governing Docs

`docs/FOUNDATIONS.md` is the project constitution. Read it before changing
runtime behavior, stored data, prompt compilation, validation rules, or
LLM-assistance surfaces. Features that conflict with it are wrong unless
FOUNDATIONS is amended first. Section 29 is the alignment checklist for specs
and tickets.

Read the domain docs that match the files being changed:

- Prompt compiler: `docs/compiler-contract.md`
- Universal prompt template: `docs/prompt-template.md` and
  `docs/prompt-template-rationale.md`
- Story record shape and fields: `docs/story-record-schema.md`
- Validation and hard-fail cases: `docs/stress-suite.md`

## Conventions

- Use ESM only; do not add CommonJS `require`.
- Keep changes narrow and aligned with existing package boundaries.
- Never adapt tests to match a bug; fix the code.
- Work flows through `specs/`, `tickets/`, and `archive/`; follow
  `docs/archival-workflow.md` for archival tasks.
