# Tracker closeout gates

Read this immediately before the first closeout mutation, after any interruption, and whenever the final SHA, evidence, or body changes.

## Closeout predicate

No `gh issue comment`, `gh issue close`, `glab` equivalent, or parent close is allowed until the exact publishable body proves:

- one exact audit row for every manifest check, with columns `Acceptance criterion or conformance check`, `Evidence`, and `Status`;
- every row being closed is literally `satisfied`; each Evidence cell contains non-circular `atoms:`, concrete `proof surfaces:`, and `sequence:` ordered proof or a justified sequence N/A;
- the final SHA matches current `HEAD`, every reviewed-HEAD field, and every published final-tree verification row;
- actual remote reachability, or the authorized full local-only rationale, is recorded;
- final-tree command ledger, repository `tdd` evidence or reasoned N/A, canonical `code-review` evidence, Principles/ADR conformance or N/A, browser/console/backend/freshness evidence or reasoned N/A/blocked, and current/historical/superseded evidence identities are present;
- any body-size split, fixed-child comment, and child-state condition is complete;
- all applicable validators pass on the exact inspected body with no unresolved placeholders.

Use the scripts and flag matrix in `closeout-templates.md`. On the last successful implement validation immediately before mutation, `--expected-final-sha`, `--emit-preflight`, and `--mutation-ready` are mandatory. Copy the helper's emitted `Closeout preflight:`, `Closeout gate passed:`, `Post-comment verification next:`, mutation-ready confirmation, and any `Accepted residuals:` summary verbatim. A plain `--closing` success is diagnostic and explicitly not mutation-ready.

Validators are not a substitute for visually confirming that every named criterion has exact evidence and literal status.

## Publishing and exact readback

For a long GitHub body:

```bash
comment_url="$(gh issue comment <issue> --body-file "$body")"
node .claude/skills/implement/scripts/verify-github-comment-body.mjs "$comment_url" "$body"
gh issue close <issue> --reason completed --comment "Completed; evidence: $comment_url"
```

The exact UTF-8 body match must pass before close. Do not publish local staging paths in durable sink fields.

Keep state reads output-bounded:

```bash
gh issue view <issue> --json number,state,stateReason,url --jq '{number,state,stateReason,url}'
gh issue view <issue> --json comments --jq '.comments[-1] | {body,url}'
```

If a mutation returns success or a URL but later readback fails, preserve the mutation evidence and retry only the read-only lookup. Never replay solely because verification was unavailable. If state remains unverifiable, say so and keep dependent parent closeout blocked.

## Family ordering

- Post and exact-read shared evidence before children cite it.
- Close only children whose own rows are satisfied.
- Exact-read every child state by issue number and durably record CLOSED states before parent close.
- Exact-read parent and children again before the final response.
- For siblings without a parent, use the chosen shared audit anchor but keep state and acceptance rows per issue.

## Local-only and blocked outcomes

A remote tracker close normally cites a remote-reachable final SHA. A local-only SHA is allowed only when the user requested closeout without push/PR, repository policy permits it, and the durable body states both why it is not remote-reachable and why local-only closeout is acceptable. If push/publication is required, push before close.

Any `blocked` or `not done` row keeps that issue open. Missing external proof, absent final SHA, unresolved review result, stale browser evidence, or unverified mutation state produces the blocked handoff in `closeout-templates.md`, not a softened completion claim.

After closeout, verify the final SHA and its actual visibility, exact issue states, latest relevant comments, and `git status --short`. Stop proof-owned processes and truthfully classify retained/removed evidence artifacts.
