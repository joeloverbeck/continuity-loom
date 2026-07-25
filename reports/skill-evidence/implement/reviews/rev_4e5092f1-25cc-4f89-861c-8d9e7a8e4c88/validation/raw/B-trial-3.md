Scaffold route:

```bash
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/implement-evolution-blind.9k8VHl/fixtures/sibling-issues.json --output /tmp/closeout-902-903-acceptance-manifest.json --audit-output /tmp/closeout-902-903-acceptance-audit.md
node .claude/skills/implement/scripts/build-closeout-body.mjs /tmp/closeout-902-903-acceptance-manifest.json --audit-input /tmp/closeout-902-903-acceptance-audit.md --output /tmp/closeout-902-903.md --scope issue-set --anchor 902 --review normal --size-plan --require-headroom
```

Expected heading: `Implementation closeout for sibling issue set anchored at #902`

Audit anchor: issue #902, the lowest issue number, because no stronger tracker or user signal identifies another anchor.
