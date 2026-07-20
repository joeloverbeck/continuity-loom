# Out-of-Scope Knowledge Base

`.out-of-scope/` records rejected enhancement concepts so their durable reasoning is not lost and similar requests are not re-litigated from scratch.

## Record contract

Use one short kebab-case file per concept, not per issue:

```markdown
# Concept name

The durable decision and scope statement.

## Why this is out of scope

Substantive product, architectural, or strategic reasoning. Do not use a temporary capacity constraint as a permanent rejection.

## Prior requests

- #42 — Request title
```

Group later requests for the same concept in the existing file. Matching is conceptual, not keyword-only.

## Triage behavior

When a plausible match exists, summarize the prior decision for the maintainer. They may:

- confirm it, append the request, and close;
- reconsider it, update or remove the record, and triage normally; or
- decide the concepts differ and continue normal triage.

Write or update a record only after the maintainer rejects an **enhancement**. Never write one for a rejected bug or for behavior that is already implemented; an already-built closing comment points to the implementation.

For an approved rejection:

1. Create or update the concept record and its prior-request link.
2. Post the disclaimer-prefixed decision comment linking the record.
3. Apply the approved roles and close the issue or PR.
4. Read the tracker outcome back exactly.

If the maintainer later changes the decision, update or remove the concept record. Historical closed issues need not be reopened; the new request resumes normal triage.
