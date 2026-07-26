Recommendation: keep PRD #500 as `enhancement` + `needs-triage`; it cannot be decomposed yet.

Current HEAD violates the contract accepted by completed issue #480: a recognized `finish_reason: stop` with `content: null` is misclassified as a generic malformed response, and the focused test fails. This is a conformance regression requiring a new standalone `bug` repair ticket—not a reopening of #480. The supplied exhaustive search found no existing repair owner.

Re-evaluate #500 only after that repair closes as `COMPLETED` and the contract passes verification at then-current HEAD. Await maintainer direction before publishing the repair ticket.
