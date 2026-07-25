Scaffold route:

```bash
node A/scripts/build-acceptance-manifest.mjs fixtures/sibling-issues.json --output /tmp/issues-902-903-acceptance-manifest.json --audit-output /tmp/issues-902-903-acceptance-audit.md
node A/scripts/build-closeout-body.mjs /tmp/issues-902-903-acceptance-manifest.json --audit-input /tmp/issues-902-903-acceptance-audit.md --output /tmp/issues-902-903-closeout.md --scope issue-set --anchor 902 --review normal --size-plan --require-headroom
```

Expected heading:

`Implementation closeout for sibling issue set anchored at #902`

Audit anchor: issue #902, the lowest-numbered sibling, because no parent PRD or stronger user/tracker anchor is present.
