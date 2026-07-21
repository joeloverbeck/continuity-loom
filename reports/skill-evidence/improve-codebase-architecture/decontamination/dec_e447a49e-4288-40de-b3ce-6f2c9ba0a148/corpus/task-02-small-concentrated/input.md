# Task-local repository dossier

Repository: `counter-table`, a small pnpm workspace. All session behavior is
concentrated in the following files:

```text
apps/web/src/App.tsx
apps/web/src/storage.ts
apps/web/src/record-writer.ts
packages/framework/src/session.ts
scripts/scaffold-game.mjs
templates/game-package/README.md
CONTEXT.md
docs/adr/0001-workspace-shape.md
```

`CONTEXT.md` defines GameModule, Hub, Session record, and Tabletop kit. ADR 0001
protects the current workspace split.

`App.tsx` imports `fixtureCounterModule`, `FixtureCounterAction`, and
`FixtureCounterState`; it starts and restores sessions directly. `session.ts`
has generic session creation and restoration functions but `App.tsx` does not
use them through an app-owned adapter.

Record capture crosses `session.ts`, `storage.ts`, `record-writer.ts`, and a Vite
development endpoint. Each layer owns one format conversion.

`scaffold-game.mjs` embeds package templates as string literals. The maintained
`templates/game-package` directory currently contains only a README describing
the intended generated files.

The codebase is small enough to inspect directly. The active agent policy would
allow delegated work only if the user had explicitly asked for it; they did not.
The OS temp directory is writable. Opening the report may emit desktop warnings
and stay attached. No code change is requested in this turn.
