# Browser Driver

Use the repository-pinned Playwright package and these helpers. Do not substitute
browser tests, saved profiles, direct API calls, or another automation framework.

## Start the isolated app

Resolve the repository root once with `pwd -P`, build, then start the holder as a
background task with literal absolute paths:

```bash
npm run build

node /absolute/repository/root/.claude/skills/playtest/scripts/safe-app-session.mjs \
  --repo-root /absolute/repository/root \
  --session-dir /tmp/continuity-loom-playtest/<stem>/app \
  --config-dir /tmp/continuity-loom-playtest/<stem>/config
```

Wait for `app-session.json` and use its `baseUrl`; never assume port 4173. The
helper binds `127.0.0.1` on an ephemeral port with a blank credential and isolated
config. Never reuse an existing app process because it may carry real settings.

## Start the guard before navigation

```bash
node /absolute/repository/root/.claude/skills/playtest/scripts/browser-session.mjs \
  --evidence-dir /absolute/repository/root/reports/assets/<stem> \
  --scratch-dir /tmp/continuity-loom-playtest/<stem>/browser \
  --base-url <baseUrl> \
  --port 0
```

Wait for `session.json`. The helper starts a fresh 1440×900 context, captures
privacy-safe console/page/network failures, blocks provider-send routes, and
rejects browser requests outside the exact app origin. A guard event is a run
defect, not evidence that clicking send was safe. If managed Chromium and system
Chrome both fail, request permission for `npx playwright install chromium`, retry
once, then report a browser blocker.

If sandbox policy denies the exact loopback bind/connect with `EPERM`, retry that
command once through the narrow approval mechanism without changing host, port,
credentials, config, framework, or intended action. Record this as harness
recovery. If the browser holder exits unexpectedly, record its termination event
and use only the fresh-browser recovery allowed by the blocker policy; never
restart the app or replace the project.

## Act and observe

```bash
node /absolute/repository/root/.claude/skills/playtest/scripts/browser-act.mjs \
  --session /absolute/repository/root/reports/assets/<stem> \
  <verb> [arguments] [--shot /tmp/continuity-loom-playtest/<stem>/shots/NNN.png]
```

Use `browser-act.mjs --help` as the verb owner. Important boundaries:

- one visible action per command;
- prefer roles, accessible names, labels, and visible text; use CSS only when no
  semantic locator exists;
- never use source-derived test IDs/classes, hidden elements, `evaluate`,
  `run-code`, or internal selectors;
- use `text-file` only on a visibly open prompt and `fill-file` for long or
  sensitive prose, keeping content out of terminal output;
- `text`, `tree`, and `html` must not cross the visible prompt-body guard;
- use `html`, geometry, or accessibility-tree diagnostics only after recording a
  visible concern.

After each consequential action, wait for the UI to settle and inspect fresh
visible output before acting again. Keep routine screenshots under `/tmp`.
Promote only tightly scoped, privacy-safe evidence supporting a finding or
important strength. Never retain a trace.

## Shutdown

Copy safety counts and browser/app metadata first. Create the browser evidence
directory's `shutdown.request` and wait for holder exit `0`; then create the app
session directory's `shutdown.request` and wait. Stop only run-owned processes.
Record any nonzero or unexpected termination even after recovery. Remove session
files, empty streams, routine screenshots, and uncited/forbidden evidence before
final validation.
