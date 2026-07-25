Scaffold route:

```bash
node A/scripts/build-acceptance-manifest.mjs fixtures/parent-child-issues.json --output /tmp/issues-904-905-acceptance-manifest.json --audit-output /tmp/issues-904-905-acceptance-audit.md
node A/scripts/build-closeout-body.mjs /tmp/issues-904-905-acceptance-manifest.json --audit-input /tmp/issues-904-905-acceptance-audit.md --output /tmp/issues-904-905-closeout.md --parent 904 --review normal --principles --fixed-child pending --size-plan --require-headroom
```

Expected heading:

`Implementation closeout for #904`

Before the parent rollup URL exists, the fixed-child state is pending: build with `--fixed-child pending` and validate with `--fixed-child-pending`, never `--fixed-child`. The inspected unposted body uses the stable self-referential line `Fixed child inline close comment: Completed by <final SHA>. Evidence: this parent rollup comment URL` and records `Fixed child final inline close comment inspected: N/A before parent URL exists`; it must not publish a pending-URL placeholder.
