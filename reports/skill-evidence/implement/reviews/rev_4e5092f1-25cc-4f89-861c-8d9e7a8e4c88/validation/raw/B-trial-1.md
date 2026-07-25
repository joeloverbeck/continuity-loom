Scaffold/body route:

```bash
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/implement-evolution-blind.9k8VHl/fixtures/standalone-issue.json --output /tmp/closeout-901-acceptance-manifest.json --audit-output /tmp/closeout-901-acceptance-audit.md
node .claude/skills/implement/scripts/build-closeout-body.mjs /tmp/closeout-901-acceptance-manifest.json --audit-input /tmp/closeout-901-acceptance-audit.md --output /tmp/closeout-901.md --scope standalone --anchor 901 --review normal --principles --size-plan --require-headroom
```

`Implementation closeout for standalone issue #901`

Parent/sibling applicability: N/A because #901 is one standalone issue with no parent PRD and no in-scope siblings.

`Parent PRD coverage: N/A because this is one standalone issue with no parent PRD.`
