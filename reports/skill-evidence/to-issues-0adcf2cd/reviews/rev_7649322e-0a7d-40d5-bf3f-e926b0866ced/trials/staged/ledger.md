# Child Issue Map

| Slice | Issue | Blocked by | Checklist mapped |
|---|---|---|---|
| record | #201 | None | N/A - changes no UI |
| compiler | #202 | #188, #201 | N/A - changes no UI |
| editor | #203 | #202 | yes |

## Breakdown decisions

- The record/compiler split exists because a half-migrated store would otherwise be observable.
- #188 gates the compiler slice only.
- Story mappings are durable in the child bodies.
