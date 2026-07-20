Verdict: do not publish the proposed three-ticket set as written. The frozen artifact is credible historical triage, but it is not current, issue-ready authority.

Finding: at commit `557b9abb332de97b712abe129b5c09a7b4639e42`, the artifact reports one demonstrated root cause shared by `holders` and `non_holders_to_protect`: prompt rendering joined stored values without the ID-to-display-label resolution used elsewhere. If that behavior still exists, O1 is the strongest implementation candidate and the two affected fields belong in one bug ticket. Its acceptance criteria must preserve literal pass-through, define behavior for unresolved IDs, keep deterministic ordering, and prove that the ID-keyed secret firewall is unchanged.

Finding: O2 is not yet an ordinary implementation ticket. “The contract promises `clue_carriers`, but the compiler omits it” leaves an authority choice unresolved: either the promised prompt behavior is still intended and code must implement it, or the contract is stale and should be corrected. Calling it an ACT item before reconciling that choice bakes the artifact’s assumption into the ticket.

Finding: O3 is a product/schema decision, not a low-severity bug. An unused `secret_kind` could be deliberate metadata, deferred behavior, or dead schema. It needs an explicit keep-and-use, keep-as-metadata, or remove decision before anyone can write an implementation brief.

Rejected paths:

- Publishing all three destinations verbatim: their paths, namespace availability, severities, duplicate status, and underlying behavior are only historical claims.
- Combining all three into one implementation ticket: they have different evidence and completion gates.
- Starting code or documentation changes: neither the design branches nor mutation authorization is settled.
- Silently dropping O2 or O3: both describe potentially real work, but they need different dispositions from O1.

What should happen next is a read-only current-state refresh against the active authorities, schema/compiler/tests, and narrow tracker overlap. That refresh should return three explicit dispositions: O1 confirmed/fixed/already-owned/no longer reproducible; O2 implement-contract/amend-contract/already-owned; and O3 use/retain inert/remove/defer. Only then should exact issue bodies, destinations, severities, and dependencies be proposed for a separate approval checkpoint. Issue creation, tracker changes, code changes, and publication remain outside scope and were not performed.

Freshness limitation: I was restricted to the immutable 2026-06-08 artifact. I could not verify current authorities, implementation, tests, tracker state, archive status, or whether any proposed work has already landed. No user-owned design decision is ratified yet.

Question 1: publication posture. My recommendation (Recommended): treat this as three separate decision lanes, not an approved three-ticket batch, and require the live read-only refresh before declaring any lane issue-ready. Do you agree?
