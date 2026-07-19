# Custody Ledger and Receipt Contract

Use this contract only after `scripts/custody-ledger.mjs intake` has frozen a validated
`*-prd-prep.md` inventory. `SKILL.md` owns the workflow; this file owns the temporary ledger and
final receipt shapes.

## Temporary custody ledger

Create one JSON file outside the worktree when possible:

```json
{
  "schemaVersion": 1,
  "prepArtifact": "reports/playtest-example-prd-prep.md",
  "prepSha256": "<64 lowercase hex characters>",
  "firstOperationalAction": {
    "value": "<exact inspector value>",
    "status": "owned",
    "evidence": "<current proof>"
  },
  "nonPrd": [
    {
      "item": "F001 - Example follow-up",
      "disposition": "published",
      "issueNumber": 123,
      "issueUrl": "https://github.com/owner/repo/issues/123",
      "liveState": "OPEN",
      "labels": ["bug", "ready-for-agent"],
      "verifierStatus": "verified",
      "evidence": "Exact staged/published body and metadata verifier passed."
    },
    {
      "item": "F002 - Method repair",
      "disposition": "routed",
      "route": "$skill-audit \".claude/skills/playtest\"",
      "evidence": "The prep classifies this as skill maintenance rather than product work."
    }
  ],
  "prds": [
    {
      "title": "Example PRD",
      "role": "first",
      "disposition": "remaining",
      "toPrdInvocation": "$to-prd \"reports/playtest-example-prd-prep.md - create Example PRD\"",
      "evidence": "No current tracker owner; current authority and implementation still show the gap."
    }
  ]
}
```

Use the inspector's exact source order. `prepArtifact`, `prepSha256`, item text, PRD title, PRD
role, and first-action value must match exactly.

### First operational action

Allowed statuses:

- `satisfied` — completed behavior or evidence now satisfies it;
- `owned` — a verified issue or routed workflow owns it;
- `not-required` — the exact source action is explicitly `none` or current evidence removes it;
  or
- `blocked` — it cannot yet be owned or resolved truthfully.

Every status requires non-empty `evidence`. `blocked` prevents a complete receipt.

### Non-PRD entries

Allowed dispositions:

- `published` and `existing-owner` require `issueNumber`, matching GitHub `issueUrl`, `liveState`,
  a non-empty exact `labels` array, `verifierStatus: verified`, and evidence;
- `routed` requires an exact non-empty `route` and evidence;
- `no-create` requires a non-empty `reason` and evidence; and
- `blocked` requires a non-empty `reason` and evidence and prevents a complete receipt.

Do not use `routed` for an informal reminder. The route must name the owning workflow, command, or
durable tracker artifact. Do not use `no-create` merely because a row is inconvenient or was not
part of the selected PRD.

### PRD entries

Allowed dispositions:

- `remaining` requires an exact `$to-prd` invocation containing the prep path and candidate title;
- `consumed` requires `issueNumber`, matching `issueUrl`, `liveState`,
  `verifierStatus: verified`, and evidence;
- `rejected` requires a non-empty `reason` and evidence; and
- `blocked` requires a non-empty `reason` and evidence and prevents a complete receipt.

The validator permits no missing, duplicate, or extra source item or candidate. It does not prove
the semantic truth of evidence or make tracker reads; the workflow's live exact-read and family
verification gates own those claims.

## Final receipt

After the custody validator exits zero, report exactly these headings and fields:

```markdown
## Playtest Follow-Up Custody Receipt

Prep artifact: reports/<stem>-prd-prep.md
Prep SHA-256: <hash>
Custody validator: passed
Non-PRD custody: <resolved>/<source count>
First operational action: <status> - <evidence>

| Non-PRD item | Disposition | Owner or proof |
| --- | --- | --- |
| <exact item> | <published / existing-owner / routed / no-create> | <issue link, route, or evidence> |

PRD queue: <remaining count / exhausted>

| PRD candidate | Role | Disposition | Next action or proof |
| --- | --- | --- | --- |
| <exact title> | <exact role> | <remaining / consumed / rejected> | <invocation, issue link, or evidence> |

Next PRD action: $to-prd "<prep-artifact> - create <exact first remaining candidate>"
Temporary artifacts: absent
Final branch: <branch>
Final worktree: <exact status rows, or clean>
```

When the PRD queue is exhausted, replace `Next PRD action` with
`Next PRD action: none - PRD queue exhausted`. List every deferred remaining candidate in its
source order, but only the first remaining candidate belongs in the next invocation.

When validation fails because custody is blocked, use the same inventory tables with
`Custody validator: blocked`, name every blocker, omit a passing receipt claim, and write
`Next PRD action: blocked - resolve follow-up custody first`.
