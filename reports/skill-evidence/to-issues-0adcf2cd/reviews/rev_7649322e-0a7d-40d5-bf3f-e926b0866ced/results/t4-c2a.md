# Child Issue Map

The approved breakdown of this PRD is published as three children, in the dependency order
`record` → `compiler` → `editor`. Every child is OPEN and labeled `enhancement`,
`ready-for-agent`; this PRD carries `needs-triage` so it cannot compete with its ready children.

| Slice | Title | Issue | Blocked by | Checklist mapped |
|---|---|---|---|---|
| record | Store scene beat annotations on the story record | #201 | None | N/A - changes no UI |
| compiler | Compile scene beat annotations into the prose prompt | #202 | #188, #201 | N/A - changes no UI |
| editor | Edit scene beat annotations in the scene editor | #203 | #202 | yes |

## Breakdown decisions

- The `record`/`compiler` split exists because a half-migrated store would otherwise be observable.
  Landing storage and compilation as one slice would leave a state in which annotations persist but
  never reach the prose prompt, so they are separated to keep each slice's end state coherent and
  verifiable on its own.
- The pre-existing tracker prerequisite #188 gates `compiler` only. `record` starts immediately, and
  `editor` inherits that gate transitively through #202 rather than declaring #188 as its own
  blocker.
- Story coverage is durable in the child bodies: each child carries its own
  `## User stories covered` section (US1, US2, and US3 in dependency order), so this ledger
  deliberately does not restate the mapping.
