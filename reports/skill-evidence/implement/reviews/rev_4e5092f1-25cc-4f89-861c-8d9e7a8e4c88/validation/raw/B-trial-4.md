Scaffold route:

```bash
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/implement-evolution-blind.9k8VHl/fixtures/parent-child-issues.json --output /tmp/closeout-904-905-acceptance-manifest.json --audit-output /tmp/closeout-904-905-acceptance-audit.md
node .claude/skills/implement/scripts/build-closeout-body.mjs /tmp/closeout-904-905-acceptance-manifest.json --audit-input /tmp/closeout-904-905-acceptance-audit.md --output /tmp/closeout-904.md --parent 904 --review normal --principles --fixed-child pending --size-plan --require-headroom
```

Expected heading: `Implementation closeout for #904`

Before the parent rollup URL exists, the fixed-child state is pending: build with `--fixed-child pending` and validate the inspected, unposted body with `--fixed-child-pending`, never `--fixed-child`. Use stable self-referential wording such as `Evidence: this parent rollup comment URL`; do not put a pending-URL placeholder in a posted body. The exact final inline child comment remains N/A until the real parent rollup URL is captured.
