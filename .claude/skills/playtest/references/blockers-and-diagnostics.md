# Blockers and Diagnostics

## What is a blocker

A blocker prevents the sincere author journey or its one-segment boundary after bounded recovery:

- the app cannot build or launch on loopback;
- the guarded browser cannot launch;
- a new project cannot be created or a continuation project no longer exists/cannot open;
- visible UI provides no reasonable path to create required state, resolve readiness, inspect the
  prompt, enter a user-supplied candidate, accept it, or verify the accepted sequence;
- a required control stalls, crashes, or repeatedly loses author work;
- the cold-subagent surface is unavailable;
- neither of the two allowed prose attempts can become acceptable without replacement-level
  rewriting;
- a provider send is attempted, even when the browser guard blocks it;
- project state becomes unsafe or ambiguous enough that continuing could corrupt the playtest.

Confusing terminology, excessive work, a poor response, or an avoidable workaround is not
automatically a blocker when the author can still proceed sincerely. Report severity by actual
impact. A weak, empty, malformed, or misleading Accepted-Segment Change Review cold draw is not a
blocker and receives no quality retry; only a genuinely absent substantive response permits one
bounded harness re-dispatch under [Bounded recovery](#bounded-recovery).

## Bounded recovery

When a probable blocker appears:

1. Stop interacting and append the visible state, intended action, expectation, and last
   successful action to the scratchpad.
2. Capture privacy-safe evidence before disturbing the state.
3. Inspect the existing console/network/provider-guard streams and, only after the visible issue
   is recorded, the relevant accessibility tree, geometry, or DOM fragment.
4. Attempt one safe recovery through a visible control.
5. Reload once if state should safely persist.
6. If still blocked, close the browser and make one fresh guarded-browser attempt against the
   same isolated app and project. Do not restart the app as a recovery for a browser-visible state
   failure, and do not create a replacement story project.
7. If the same blocker recurs or state cannot safely resume, stop and write a blocked report.

Do not silently recover, repeatedly retry, randomly click, weaken validation, switch to direct API
or file manipulation, restart until data happens to look favorable, or omit the original failure
after a later recovery.

## Diagnostics boundary

The browser streams console warnings/errors, page exceptions, failed requests, HTTP errors, and
provider-guard events from pre-navigation onward. Use them to explain a visible finding, not to
decide story content, discover hidden state, or compensate for the UI.

Never inspect API request/response bodies, application stores, React state, SQLite, project files,
accepted-segment storage, hidden prompt data, `.env`, or source code during a run. Do not retain a
trace. A report may cite a short relevant console/network excerpt only when it contains no prompt,
record payload, candidate, accepted prose, or secret.

## Screenshots and the motion-stability gate

Screenshots work in this harness; the startup self-check records `screenshotCapable` in
`session.json` (see [Browser driver](browser-driver.md#start-the-guarded-browser-before-navigation)).
Treat a `false` result as this run's real capability, not an assumption — earlier reports that
called headless screenshot capture unavailable were mistaken; the capability was never exercised to
failure.

A `click` that times out at Playwright's motion-stability gate (commonly ~5000 ms) means the
target is perpetually animating, so its bounding box never settles. This is an animation ×
actionability interaction that any environment hits, not a WSL2 or product defect. It is **not** a
blocker on its own: the context runs with `reducedMotion: "reduce"`, and any control that still
will not stabilize is activated with `focus <selector>` then a global `press Enter`/`Space`.
Escalate to a blocker only when keyboard activation also cannot operate a required control after
bounded recovery.

## Provider-safety failure

If `provider-request-blocks.jsonl` gains an entry or the UI's provider send control was clicked:

- stop the run immediately;
- confirm the browser guard aborted the request and the app process was launched with a blank
  credential;
- set report status to `blocked` and completion reason to `provider-request-attempt`;
- record the visible action and endpoint without request content;
- do not retry the send or continue authoring.

If there is any evidence a request escaped the guard, report the uncertainty immediately and stop.

## Blocked-report rule

Every blocked run still receives the full report shape. Sections not reached contain
`Not reached — <specific blocker>`. Preserve the `/tmp` project and scratchpad until the report is
written and validated. If report writing fails, retain the scratchpad under the run's `/tmp` root
and return its path; never copy raw story or prompt material into reports as recovery notes.

**Completion criterion:** recovery never exceeds one visible action, one reload, and one fresh
browser; diagnostics stay tied to visible findings; provider safety is fail-closed; and every
terminal blocker produces a truthful validated report.
