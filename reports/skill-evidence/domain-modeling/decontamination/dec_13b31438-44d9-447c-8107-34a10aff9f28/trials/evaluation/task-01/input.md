# Frozen input

Repository: Continuity Loom, a local-first story-state application.

Starting state:

- There is no `CONTEXT.md` yet.
- There are no relevant ADRs for these three terms.
- The repository uses one domain context across core, server, and web.

Settled product language from the session:

- A **story record** is user-authored structured continuity state. It is authoritative input to prompt compilation.
- An **accepted segment** is prose the user deliberately accepted into the manuscript. Acceptance does not make the prose continuity authority or prompt context.
- A **candidate** is generated prose returned for review before acceptance. Rejected and superseded candidates are not durable story state or prompt context.

The team wants these concepts named consistently in product discussions, issue titles, tests, and UI copy. No implementation mechanism or file format was decided.
