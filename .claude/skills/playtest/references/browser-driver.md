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
- `POST /api/accepted-segment-change-review/analyze`
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

The context launches with `reducedMotion: "reduce"` so animations that honor
`prefers-reduced-motion` cannot keep a click target perpetually in motion (see
[Act through visible UI](#act-through-visible-ui)). It also runs a one-shot **screenshot
self-check** at startup and records `screenshotCapable` (plus `screenshotProbeMs` and either
`screenshotProbeBytes` or `screenshotProbeError`) in `session.json` and in the ready line. Read
`screenshotCapable` before relying on raster evidence: `true` means routine and finding
screenshots are available this run; `false` means fall back to text/tree snapshots and note the
probe error. The self-check is fail-soft and never aborts the run. The default headless build is
the lightweight `chromium_headless_shell`; a run needing higher raster fidelity or a
human-equivalent window may launch `--headed` (uses the WSLg display when present) or the full
Chromium channel, but neither is required for screenshots.

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

If a `click` times out at Playwright's motion-stability gate, the target is animating — its
bounding box never settles — not broken, and this is not an environment failure. The context
already runs `reducedMotion: "reduce"`; when an animation ignores that (no `prefers-reduced-motion`
guard), activate the control with `focus <selector>` then a global `press Enter` (or `Space`):
keyboard activation needs no motion stability. Do not resort to forced clicks that skip the
visibility, enabled, and hit-testing checks. Navigate SPA routes with `goto` rather than clicking
nav links.

`text-file` may read only a prompt that is visibly open in the prompt inspector. Record its
fingerprint and visible metadata before extracting it. `fill-file` is the required path for raw
subagent prose so the content is not exposed in shell arguments or command output.

`text`, `tree`, and `html` fail closed when their selected scope contains or intersects a visible
compiled prompt body. For diagnostics on a prompt page, select a narrow semantic region outside
the prompt. Do not bypass this guard with a broad page snapshot; use `text-file` for the exact
visible prompt.

## Perception and evidence

After every consequential action, wait for the UI to settle and inspect a fresh screenshot or
visible-text/snapshot result before acting again. Routine shots stay under `/tmp`; do not turn the
report evidence directory into a click-by-click screen recording.

Promote only evidence that supports a report finding or important strength. Prefer
`elementshot` or a tightly scoped viewport state that avoids exposing full record payloads,
prompts, candidate prose, or accepted prose. Never retain a browser trace: it may contain the
entire story and prompt.

When `screenshotCapable` is true, capture a tightly scoped `elementshot` for any UI or
information-architecture finding you annotate — a control's label, state, focus ring, or layout —
because a raster is the clearest evidence for those, and annotating the UI is a primary reason the
playtest exists. Keep the privacy rules above: no full prompt, record-payload, candidate, or
accepted-prose raster. When `screenshotCapable` is false, record the finding from `tree`/`text`
and state that raster evidence was unavailable this run. The report validator does not require
images, so a genuinely capability-limited run still validates.

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
