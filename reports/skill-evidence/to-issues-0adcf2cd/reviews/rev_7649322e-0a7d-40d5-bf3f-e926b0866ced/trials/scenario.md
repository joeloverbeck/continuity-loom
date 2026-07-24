# Shared scenario (fictional)

PRD **#200 — Scene beat annotations** was approved for breakdown into three child slices, in this
dependency order:

| slice id | title | blocked by |
|---|---|---|
| `record` | Store scene beat annotations on the story record | nothing |
| `compiler` | Compile scene beat annotations into the prose prompt | `record` |
| `editor` | Edit scene beat annotations in the scene editor | `compiler` |

Additional frozen facts:

- The `compiler` slice also carries a pre-existing tracker prerequisite: issue **#188**.
- Only the `editor` slice is browser-visible. `record` and `compiler` change no UI.
- Acceptance counts: `record` 4, `compiler` 3, `editor` 8.
- Labels on every child: `enhancement`, `ready-for-agent`.
- The parent PRD #200 is OPEN and, after the approved transition, carries `needs-triage`.
- The approved posture is child mode with a posted child-map ledger.
- Published results (only for trials that say the family is already published):
  - `record` → #201, `compiler` → #202, `editor` → #203
  - ledger comment URL `https://github.com/joeloverbeck/continuity-loom/issues/200#issuecomment-9001`
