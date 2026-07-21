# Closeout builder and templates

Use the executable helpers as the authority for body syntax. Do not hand-copy large TDD, review, or preflight blocks from prose.

## Build from exact tracker input

Save exact bodies once, then derive the acceptance manifest and scaffold:

```bash
node .claude/skills/implement/scripts/capture-github-issues.mjs 101 102 --output /tmp/implement-issues.json
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/implement-issues.json --output /tmp/implement-acceptance-manifest.json --audit-output /tmp/implement-acceptance-audit.md
node .claude/skills/implement/scripts/build-closeout-body.mjs /tmp/implement-acceptance-manifest.json --audit-input /tmp/implement-acceptance-audit.md --output /tmp/implement-closeout.md --parent 101 --review normal --tdd-parent-rollup --browser --principles --size-plan --require-headroom
```

For siblings with no parent, use `--scope issue-set --anchor <issue>`. Use `--review fallback` only when the canonical `code-review` workflow selected fallback. Add `--immediate-fix` when review findings were fixed, `--local-only` only when authorized, and `--fixed-child pending|final` only for real parent scope. Run each helper with `--help` for the current flag contract.

The scaffold is intentionally incomplete. Fill every placeholder from actual final-tree evidence; never convert a row to `satisfied` without exact proof.

## Structured evidence

Prefer `--evidence-input <evidence.json>` when findings, TDD review fixes, or many rows would otherwise be copied between tables. The builder derives repeated counts and ledgers. Minimal shape:

```json
{
  "auditRows": [
    {
      "issue": 102,
      "checkId": "AC1",
      "atoms": "required behavior",
      "proofSurfaces": "test path and exact command",
      "sequence": "request -> state change -> assertion",
      "status": "satisfied"
    }
  ],
  "tddRows": [
    {
      "issue": 102,
      "contextStatus": "present or absent",
      "authorityStatus": "aligned because ...",
      "seam": "public seam",
      "red": "exact failing command and intended failure",
      "green": "exact passing command and result",
      "acceptance": "AC1; atoms: ...; proof surfaces: ...; sequence: ...",
      "reviewDisposition": "RF-1 mapped below or N/A"
    }
  ],
  "tddReviewFixes": [
    {
      "id": "RF-1",
      "finding": "finding title",
      "red": "intended red command/failure",
      "green": "green command/result",
      "issue": 102,
      "seam": "public seam",
      "durability": "durable regression test path",
      "browserFreshness": "rerun or reasoned N/A",
      "backendCurrentness": "currentness proof or reasoned N/A",
      "identityRefresh": "same-sink refresh disposition"
    }
  ],
  "reviewFindings": [
    {
      "id": "P1-spec-1",
      "severity": "high",
      "reviewer": "reviewer identity",
      "originalFinding": "finding title",
      "repairClass": "behavior",
      "tddDisposition": "RF-1",
      "repair": "repair made",
      "rerunEvidence": "exact passing command/result",
      "finalStatus": "fixed"
    }
  ]
}
```

Use either `auditRows` or `--audit-input`, not both. Structured TDD requires at least one unique `(issue, seam)` row per represented manifest issue. Each `RF-N` maps to an exact issue/seam row; each review ID is `P<pass>-standards|spec-N`. Let builder errors define current allowed enums and field forms.

## Size and split workflow

GitHub's default hard stop is 65,536 UTF-8 bytes. Run the size plan before filling a body that will carry substantial TDD/review/browser evidence. Never create headroom by deleting required atoms or using circular references.

On `low-headroom` or `exceeds-limit`:

1. Use repeatable `build-acceptance-manifest.mjs --select <issue[:check-id,...]> --completed-audit-input <full-audit>` to create disjoint subset manifests/audits that collectively cover the full manifest.
2. Build the shared evidence core with `--split-core-preindex`, validate with matching flags plus `--emit-preflight --mutation-ready`, post it, and exact-read it.
3. Build each remaining subset with `--audit-chunk --shared-evidence-core-url <verified-core-url>`, validate, post, and exact-read it.
4. Patch the core using `--split-core-final` and repeatable `--linked-audit-chunk-url <verified-https-url>`, then revalidate and exact-read the patched core.

The core owns TDD, review, browser, identity, Principles, and preflight evidence. Chunks own only their disjoint audit rows.

## Validation order

Run applicable nested validators and the implement validator as separate output-bounded commands. A common final sequence is:

```bash
node .claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --acceptance-manifest /tmp/implement-acceptance-manifest.json
node .claude/skills/code-review/scripts/validate-review-normal-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --acceptance-manifest /tmp/implement-acceptance-manifest.json
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --acceptance-manifest /tmp/implement-acceptance-manifest.json
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --acceptance-manifest /tmp/implement-acceptance-manifest.json --emit-preflight --mutation-ready
```

Add only applicable flags. Never drop `--expected-final-sha` from closing validation. Inspect exact body size, relevant sections, audit rows/statuses, and unresolved placeholders before the mutation-ready run. If output is truncated or the body changes, inspection and all affected validators are stale.

Post long evidence with `gh issue comment --body-file`, exact-read the returned URL with `verify-github-comment-body.mjs`, then close with a short inline pointer. Keep local staging paths out of the published body.

## Blocked closeout handoff

When any row is blocked or not done, do not run tracker mutations. Report:

```markdown
Blocked closeout handoff for <issue/scope>

- Live tracker state: <exact readback>
- Verified implementation frontier: <files/commit or no-commit decision>
- Final-tree verification: <commands/results or blocker>
- Review: <canonical review line or N/A because review was not reached>
- Browser/process/artifact disposition: <facts/N/A>

| Work item | Exact criterion | Satisfied evidence or missing proof | Next exact action | Status |
|---|---|---|---|---|
| #N | ... | atoms/proof surfaces/sequence or blocker | ... | satisfied / blocked / not done |
```

Name the authority/decision needed and leave the affected issue and parent open.
