# Custody Ledger and Receipt Contract

Use this contract after `scripts/custody-ledger.mjs intake` freezes a passing
`*-prd-prep.md` inventory. `SKILL.md` owns reconciliation and publication; this file owns the
temporary ledger and renderer-backed closeout.

## Ledger shape

Create one JSON ledger outside the worktree when possible:

```json
{
  "schemaVersion": 1,
  "prepArtifact": "<exact inventory path>",
  "prepSha256": "<exact inventory hash>",
  "firstOperationalAction": {
    "value": "<exact inventory value>",
    "status": "owned",
    "evidence": "<current proof>"
  },
  "nonPrd": [],
  "prds": []
}
```

Keep `nonPrd` and `prds` in inspector source order with no missing, duplicate, or extra entries.
The path, hash, row text, candidate title, role, and first-action value must match the inventory.

### First action

Allowed statuses are `satisfied`, `owned`, `not-required`, and `blocked`; each requires
non-empty evidence. The value is substantive portfolio work, never the mandatory
`$playtest-to-issues` or `/to-prd` handoff. `blocked` prevents complete custody.

### Non-PRD entries

Every entry requires exact `item`, `disposition`, and non-empty `evidence`.

- `published` and `existing-owner` require a positive `issueNumber`, matching GitHub
  `issueUrl`, `liveState` of `OPEN` or `CLOSED`, non-empty exact `labels`, and
  `verifierStatus: "verified"`.
- `routed` requires an exact non-empty `route`. If it names a `$<skill>`, resolve one current
  `SKILL.md`, read it completely, and prove that its trigger, input, and current state accept the
  proposed invocation. Record that check in evidence without executing the route. An absent,
  ambiguous, retired, or incompatible destination is `blocked`.
- `no-create` and `blocked` require a non-empty `reason`; `blocked` prevents complete
  custody.

A route must name a durable owner, not an informal reminder. A row is not `no-create` merely
because it is inconvenient or outside a selected PRD.

### PRD entries

Every entry requires exact `title`, `role`, `disposition`, and non-empty `evidence`.

- `remaining` requires `toPrdInvocation` naming `$to-prd`, the prep path, and candidate title.
- `consumed` requires the same verified issue fields as an owned non-PRD row.
- `rejected` and `blocked` require a non-empty `reason`; `blocked` prevents complete
  custody.

The validator checks structure and completeness, not the truth of evidence or tracker reads.

## Validate and render

Validate after reconciliation and any approved publication:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs validate \
  <prep-artifact> <custody-ledger.json>
```

If the ledger is complete, capture branch and full
`git status --short --untracked-files=all`, then render:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs render-receipt \
  <prep-artifact> <custody-ledger.json> \
  --final-branch <branch> \
  --final-worktree-clean
```

For a dirty worktree, replace `--final-worktree-clean` with one exact quoted
`--final-worktree-row <row>` per status row, preserving order and leading status columns.

When structural validation passes but any row, PRD, or first action is blocked, use the same
posture arguments with `render-blocked-receipt`. It preserves both inventories and every blocker,
marks custody blocked, and prevents `/to-prd`. The passing renderer instead emits the first
remaining candidate's exact next invocation or marks the PRD queue exhausted. Both renderers handle
empty inventories and dirty worktrees; their stdout is the only authoritative receipt.

Capture renderer stdout before cleanup. Remove all temporary custody and publication artifacts,
prove absence, and recapture branch plus full worktree. Emit the captured receipt verbatim only
when the recaptured posture equals the renderer inputs. Never hand-format, abbreviate, or replace
either receipt with a summary.
