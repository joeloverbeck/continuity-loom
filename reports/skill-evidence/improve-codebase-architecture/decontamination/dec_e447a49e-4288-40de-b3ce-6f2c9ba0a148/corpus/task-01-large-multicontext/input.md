# Task-local repository dossier

Repository: `harbor-engine`, a TypeScript monorepo with packages for an engine,
server, and React UI. The working tree already contains unrelated changes to
`docs/notes.md` and `.claude/skills/tdd/SKILL.md`.

Agent policy: delegated agents require an explicit user request. Invoking a
skill by name is not delegation authorization.

Authority map:

- Root `CONTEXT.md` defines Harbor, Shelf, Wash, and Dry-out. It defers game UI
  terms to `games/tides/CONTEXT.md`.
- `games/tides/CONTEXT.md` defines Capture, Table view, and Tide preview.
- `docs/adr/0004-engine-public-surface.md` keeps shelf transition calculations
  behind the existing engine export.
- `docs/adr/0007-capture-ownership.md` assigns playtest capture to the game UI.

Relevant tree and excerpts:

```text
games/tides/engine/src/index.ts
games/tides/ui/src/playtest-capture.ts
games/tides/ui/src/wash-plan.ts
packages/backend/src/submit.ts
packages/backend/src/projection.ts
```

`engine/src/index.ts` contains both `projectNextDryOut` and `projectWashRefill`.
Each independently computes shelf capacity, refill order, and overflow using
nearly identical loops. Both are public functions used by engine tests. The UI
calls only those public functions.

`playtest-capture.ts` owns capture serialization and sends a submission
envelope to `backend/submit.ts`. `backend/projection.ts` consumes that same
envelope but does not import the UI.

`wash-plan.ts` maps engine projections into presentation rows. Its mapper is 18
lines, pure, and covered by snapshot tests.

The environment permits writing only to the repository and `/tmp`. Browser
automation is unavailable. The final response for this turn must not implement
code; it should deliver the architecture review and wait for the user's choice.
