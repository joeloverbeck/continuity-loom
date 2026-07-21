# AGENTS.md - Continuity Loom

Continuity Loom is a local-first story-state app: a Node process serves a React UI and a localhost-only API for story records, deterministic prompt compilation, and segment acceptance. Data stays on the user's machine; there is no account, login, or cloud service.

## Start Here

Before changing code or docs, read `docs/principles/README.md` for the conformance rule, then `docs/ACTIVE-DOCS.md` for active-authority routing, archived-material boundaries, and change-intake rules.

Then read `docs/principles/FOUNDATIONS.md` for any change touching runtime behavior, stored data, prompt compilation, validation rules, generation behavior, accepted-segment behavior, OpenRouter behavior, or LLM-assistance surfaces. Features that conflict with it are wrong unless `docs/principles/FOUNDATIONS.md` is deliberately amended first.

Treat `archive/**` as historical evidence, not active implementation guidance, unless an active issue or doc explicitly points to a specific archived file.

## Repository Shape

This is an npm-workspaces ESM monorepo on Node >= 24 (`.nvmrc`) with strict TypeScript.

- `packages/core`: pure continuity/compiler logic. Do not import `fastify`, `react`, `vite`, or `node:*` builtins here; ESLint and a boundary test enforce this platform-free boundary.
- `packages/server`: localhost API plus production UI serving.
- `packages/web`: React + Vite front end.

Every server path, including dev, API, and production launch, must bind `127.0.0.1` only. Never expose the app to the LAN.

## Commands

Use these root commands unless a narrower package-local check is clearly enough:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Before claiming a code change complete, run the relevant checks and report any that could not be run. `npm run dev` starts Vite HMR plus the API (`5173`/`5174`); `npm start` builds and serves the app on `127.0.0.1:4173`.

## Governing Docs

`docs/principles/FOUNDATIONS.md` is the project constitution. Section 29 is the alignment checklist every PRD and implementation issue must clear.

Use `docs/specs/README.md` and `docs/ACTIVE-DOCS.md` to choose the right living specification before touching a domain. In particular:

- Prompt compiler: `docs/specs/compiler-contract.md`
- Universal prompt template: `docs/specs/prompt-template.md` and `docs/prompt-template-rationale.md`
- Story record shape and fields: `docs/specs/story-record-schema.md`
- Validation and hard-fail cases: `docs/specs/validation-rule-inventory.md`, `docs/specs/stress-suite.md`, `docs/specs/stress-coverage-matrix.md`, and `docs/demo-blocker-recipes.md`
- Non-binding validation research candidates: `docs/narrative-theory-blocker-roadmap.md`
- User-facing behavior: `docs/user-guide.md`

## Change Intake and Archive

All change intake goes through GitHub. Broad or risky behavior changes — compiler, validation, storage, schema, accepted-prose boundaries, OpenRouter/security, local-first data, or anything that could violate `docs/principles/FOUNDATIONS.md` — start as a **PRD** published to GitHub Issues. Narrow, already-scoped implementation work starts as a **GitHub issue**. See `docs/agents/issue-tracker.md`.

The repository-native `specs/` and `tickets/` workflow is retired. Do not open new local specs or tickets, and do not treat the absence of a local spec as a gate on published work. `tickets/README.md` and `tickets/_TEMPLATE.md` survive only as historical format references.

Completed requirements sets and reports move under `archive/` according to `docs/archival-workflow.md`. Do not revive archived v1 requirements as active backlog.

## Conventions

- Use ESM only; do not add CommonJS `require`.
- Keep changes narrow and aligned with existing package boundaries.
- Never adapt tests to match a bug; fix the code.
- Do not introduce backwards-compatibility aliases, shims, or duplicate authority paths unless a published PRD explicitly justifies them.
- Do not let rejected candidates, superseded candidates, or automatic prose-derived summaries become prompt context. Accepted prose may appear only as bounded evidence in the exact one-segment assistance profiles sanctioned by `docs/principles/FOUNDATIONS.md` §9.1; it never becomes canon or prose-prompt authority.
- Do not weaken validation gates, deterministic compilation, API-key secrecy, localhost binding, or local-first project ownership.
