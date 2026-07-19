# Browser Driver

## Why Playwright

Use the repository-pinned Playwright package and bundled session helpers. They provide one fresh
Chromium context, semantic locators, screenshots, console/page/network evidence, and an explicit
provider-request guard. Do not substitute browser tests, a saved browser profile, or direct API
calls.

## Build and start the safe app session

Resolve the repository root once with `pwd -P`; use that literal absolute path in helper commands.
Run the repository build, then start the app holder as a background task:

```bash
npm run build

node /absolute/repository/root/.claude/skills/playtest/scripts/safe-app-session.mjs \
  --repo-root /absolute/repository/root \
  --session-dir /tmp/continuity-loom-playtest/<stem>/app \
  --config-dir /tmp/continuity-loom-playtest/<stem>/config
```

Wait for `<session-dir>/app-session.json`. Use its `baseUrl`; never assume port 4173. The helper
starts the built production app on `127.0.0.1` with an ephemeral port, an explicitly blank
`OPENROUTER_API_KEY`, and the run's isolated config directory. It writes server output under
`/tmp`, not `reports/`.

Do not reuse an existing app process. An existing process may have a real credential or user
settings and cannot satisfy the no-paid-request proof.

## Start the guarded browser before navigation

Start another background task:

```bash
node /absolute/repository/root/.claude/skills/playtest/scripts/browser-session.mjs \
  --evidence-dir /absolute/repository/root/reports/assets/<stem> \
  --scratch-dir /tmp/continuity-loom-playtest/<stem>/browser \
  --base-url <baseUrl-from-app-session.json> \
  --port 0
```

Wait for `<evidence-dir>/session.json`. The session starts a fresh 1440x900 Chromium context,
records console warnings/errors and failed/HTTP-error requests, and aborts these provider-send
endpoints before they reach the local server:

- `POST /api/generate`
- `POST /api/ideate`
- `POST /api/record-hygiene/analyze`
- `POST /api/segment-reconciliation/analyze`
- `POST /api/settings/openrouter/models`

Any guard event is recorded in `provider-request-blocks.jsonl` and is a run defect. The guard is
defence in depth, not permission to click a send control.

The session also refuses browser requests outside the exact app origin from
`app-session.json`; any such attempt is recorded in `external-request-blocks.jsonl`. This keeps
the playtest local and prevents an accidental navigation to a different localhost service.

`shutdown.request` is the browser holder's only expected termination and exits with status `0`.
If the holder receives `SIGINT` or `SIGTERM`, or if its browser context closes first, it appends a
privacy-safe `session-termination` entry with the trigger and exit status to `console-log.jsonl`
and exits nonzero.

The helper first uses Playwright's managed Chromium, then the system Chrome channel. If both are
unavailable, request permission to run `npx playwright install chromium`, retry once, and produce
a blocked report if no browser launches. Do not switch to a different automation framework
mid-run.

## Recover host loopback permission failures

If a run-owned helper or `browser-act.mjs` command fails because the host sandbox denies binding
or connecting to its assigned `127.0.0.1` app or CDP port (for example, `EPERM`), retry that exact
command once through the host's narrow permission or approval mechanism. Do not change the
loopback host, ephemeral-port policy, blank-credential setup, isolated config, browser framework,
or intended browser action.

Record the denied attempt and authorized retry as harness recovery rather than product behavior.
If the exact retry still fails at the same host permission boundary, follow the blocker policy.

## Recover an unexpected browser-holder termination

If the browser holder exits before the planned shutdown request, stop interacting. Inspect
`console-log.jsonl` for a `session-termination` entry and copy its trigger, expected flag, and exit
status into the scratchpad before bounded recovery. If no such entry exists, record the cause as
unavailable rather than describing the exit as clean. Then follow the fresh-browser limit in
[Blockers and diagnostics](blockers-and-diagnostics.md#bounded-recovery); do not restart the app or
replace the story project.

## Act through visible UI

One visible action per command:

```bash
node /absolute/repository/root/.claude/skills/playtest/scripts/browser-act.mjs \
  --session /absolute/repository/root/reports/assets/<stem> \
  <verb> [arguments] [--shot /tmp/continuity-loom-playtest/<stem>/shots/NNN-description.png]
```

Supported verbs:

- `goto <url>`
- `click|dblclick|hover|focus|check <selector>`
- `clear <selector>` to empty a visible editable control without a temporary file
- `fill <selector> <value>` for short non-sensitive values
- `fill-file <selector> <absolute-file>` for story prose or other long/sensitive values
- `select <selector> <value>`
- `press [<selector>] <key>`
- `back`
- `reload` for blocker recovery only
- `wait <milliseconds|selector>`
- `screenshot <path>`
- `elementshot <selector> <path>`
- `text [selector]`
- `text-file <selector> <absolute-file>` for exact visible prompt extraction without printing it
- `tree [selector]`
- `box <selector>`
- `html <selector>` after a visible defect only
- `pages`

Prefer role, accessible-name, label, and visible-text selectors. Use CSS only when the visible UI
does not expose a stable semantic locator. Never use source-derived test ids, implementation
classes, hidden elements, `evaluate`, `run-code`, or app-internal selectors to figure out what to
do.

`text-file` may read only a prompt that is visibly open in the prompt inspector. Record its
fingerprint and visible metadata before extracting it. `fill-file` is the required path for raw
subagent prose so the content is not exposed in shell arguments or command output.

## Perception and evidence

After every consequential action, wait for the UI to settle and inspect a fresh screenshot or
visible-text/snapshot result before acting again. Routine shots stay under `/tmp`; do not turn the
report evidence directory into a click-by-click screen recording.

The sole perception-order exception is an `active` new-story Cold First-View Witness. Navigate with
`goto <base-url> --shot <temporary-path>` and give the sealed screenshot packet to the witness
without opening the image or requesting page text/tree/HTML in the parent context. After the witness
answer is saved, the main operator inspects that same initial state independently before reading the
answer. Resume the normal inspect-after-action rule immediately afterward.

Promote only evidence that supports a report finding or important strength. Prefer
`elementshot` or a tightly scoped viewport state that avoids exposing full record payloads,
prompts, candidate prose, or accepted prose. Never retain a browser trace: it may contain the
entire story and prompt.

Use `tree`, `box`, or `html` only after a visible accessibility/layout/defect concern is recorded,
or for a light accessibility check at a safe point. Diagnostics explain visible behavior; they
must not reveal hidden state or compensate for poor discoverability.

## Shutdown

Before creating either shutdown request, copy the needed safety counts and browser/app metadata
into the scratchpad or draft report. Then create `<evidence-dir>/shutdown.request` and wait for the
browser holder to exit with status `0`. Create `<app-session-dir>/shutdown.request` and wait for the
app holder to exit. Stop only these run-owned processes. A nonzero browser-holder exit or a
`session-termination` entry belongs in the scratchpad and report even when later recovery succeeds.

Remove `session.json`, empty diagnostic streams, other session plumbing, routine screenshots, and
every uncited or forbidden evidence artifact before invoking the report validator. Follow
[Report format: Challenge, validate, register, and close](report-format.md#challenge-validate-register-and-close) as the canonical closeout
order: keep the scratchpad and exchange files through the first passing validation, delete them,
then validate again.

**Completion criterion:** a fresh guarded browser visibly renders the isolated app at 1440x900;
the app session proves blank credential and isolated config; diagnostic streams began before
navigation; and both run-owned processes are closed at the end.
