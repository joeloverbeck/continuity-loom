# Triage labels

The engineering skills use five canonical triage roles. This file maps those roles to the actual label strings used in this repository's issue tracker.

| Canonical role | Tracker label | Creation color | Creation description |
| --- | --- | --- | --- |
| `needs-triage` | `needs-triage` | `FBCA04` | Maintainer needs to evaluate this issue |
| `needs-info` | `needs-info` | `D876E3` | Waiting on the reporter for more information |
| `ready-for-agent` | `ready-for-agent` | `0E8A16` | Fully specified and ready for an AFK agent |
| `ready-for-human` | `ready-for-human` | `1D76DB` | Requires human implementation |
| `wontfix` | `wontfix` | `FFFFFF` | This will not be worked on |

When a skill mentions a role, use the corresponding tracker label from this table.

The color and description columns are canonical creation metadata for a missing label. They do not authorize rewriting an existing label's metadata. When publication discovers that a required label is absent, include the exact proposed operation in the workflow's existing approval checkpoint before creating it:

```sh
gh label create "<Tracker label>" --color "<Creation color>" --description "<Creation description>"
```

If a non-canonical type label is missing, do not invent creation metadata; include its exact proposed name, color, and description in the approval checkpoint or stop before publication.
