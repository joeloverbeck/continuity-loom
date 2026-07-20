# Pull request #205 snapshot

Title: Permit LAN access for phone testing

Author association: `FIRST_TIME_CONTRIBUTOR`

Labels: none.

Body: "This changes the dev and production hosts from 127.0.0.1 to 0.0.0.0 so I can open the app from my phone."

Diff summary: Vite, API, and production launch bind to `0.0.0.0`. No authentication, origin protection, threat analysis, or tests are added.

Repository facts: every server path must bind `127.0.0.1` only; exposing the app to the LAN conflicts with `AGENTS.md` and the local-first security boundary. External pull requests are valid triage surfaces; collaborator PRs would be excluded.
