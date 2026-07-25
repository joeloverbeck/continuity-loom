No tracker comment or close command is authorized. Unresolved scaffold placeholders and the absence of closing validation are hard stops.

Immediately before the first tracker mutation, the exact completed and inspected body must pass the applicable implement closing validator:

```bash
node A/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --emit-preflight --mutation-ready <all other applicable closeout flags>
```

The final mechanical gate is that mutation-ready validation, including verbatim publication of its emitted `Closeout preflight:` block, `Closeout gate passed: audit sink ...` line, `Post-comment verification next:` line, and mutation-ready confirmation. A successful `--closing` run without both `--emit-preflight` and `--mutation-ready` is diagnostic only and does not authorize mutation.
