Recommendation: keep PRD #500 as `enhancement` + `needs-triage`. It cannot be decomposed now.

Current HEAD violates completed issue #480’s accepted contract: a recognized `finish_reason: stop` response with `content: null` is treated as generically malformed before response classification, and the focused test fails.

Treat this as a new `bug` conformance repair. Preserve #480 as completed historical evidence; do not reopen it automatically. No existing durable repair ticket was found in the supplied tracker search, so the next action is to create a standalone repair issue.

Re-evaluate #500 only after that repair closes with state reason `COMPLETED` and the #480 contract passes at then-current HEAD. No labels or tracker state should change yet.
