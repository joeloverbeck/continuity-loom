# Blockers and Diagnostics

A blocker prevents the sincere visible journey or one-segment boundary after
bounded recovery: app/browser launch failure; missing/unopenable project; no
visible path to required state, readiness, prompt inspection, local candidate,
acceptance, or sequence proof; repeated loss/crash/stall; unavailable cold
executor; two unusable prose attempts; any provider-send attempt; or project
state too unsafe or ambiguous to continue.

Confusing language, excessive work, a poor response, or an avoidable workaround
is not automatically a blocker when the author can proceed sincerely. Report
actual impact.

## Bounded recovery

1. Stop and record the visible state, intended action, expectation, and last
   successful action.
2. Capture privacy-safe evidence before disturbing the state.
3. Inspect existing console/network/guard streams and, only after the visible
   issue is recorded, the relevant accessibility tree, geometry, or DOM fragment.
4. Try one safe recovery through a visible control.
5. Reload once only when state should safely persist.
6. If still blocked, close the browser and make one fresh guarded-browser attempt
   against the same app and project. Do not restart the app or replace the story.
7. On recurrence or unsafe resumption, stop and write a blocked report.

Never randomly click, repeatedly retry, weaken validation, use direct API/file
mutation, or omit the original failure after later recovery.

Diagnostics explain visible behavior only. Never inspect request/response
bodies, application stores, React state, SQLite, project files, hidden prompt
data, `.env`, or source during the journey. Never retain a trace. A report may
cite only short privacy-safe console/network excerpts tied to visible findings.

If a send control is clicked or `provider-request-blocks.jsonl` gains an entry,
stop immediately. Confirm guard abort and blank credential, set `status: blocked`
and `completion_reason: provider-request-attempt`, record the visible action and
endpoint without content, and never retry. If escape is possible, report that
uncertainty immediately.

Every blocked run still gets the complete report shape; use `Not reached —
<specific blocker>` for unreached phases. Preserve the project and scratchpad
through validation. If report writing cannot finish, retain and return the exact
run root rather than copying private material into a recovery report.
