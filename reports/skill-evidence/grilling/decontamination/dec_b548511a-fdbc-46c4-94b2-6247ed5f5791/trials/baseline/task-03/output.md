The plan should not move to publication yet. The frozen artifact supports three separate workstreams, but not three equally issue-ready deliverables.

Explored fact: `archive/triage/2026-06-08-secret-field-audit-triage.md` at `557b9abb332de97b712abe129b5c09a7b4639e42` is historical evidence. It supplies a diagnosis and proposed destinations; it does not prove current source or tracker state and grants no mutation authority.

Finding: O1 is the strongest ticket candidate because the artifact identifies a concrete UUID-rendering path and a stated compiler-contract violation. O2 is conditional on the active contract still requiring `clue_carriers`; that contract/implementation direction must be reconciled before ticket wording presupposes the fix. O3 is an unresolved product/schema choice, so an implementation ticket would prematurely encode whether `secret_kind` should be compiled, retained as non-prompt metadata, or removed. The proposed HIGH/MEDIUM/LOW severities are likewise recommendations, not ratified tracker facts.

Recommendation: keep O1, O2, and O3 separate; resolve the intent branches in this grill; then refresh the live authorities, implementation, existing prep artifacts, and tracker overlap before producing an issue-ready recap. No issue creation, tracker mutation, code or doc change, ticket file, or publication should happen in this turn. Even after the plan is ratified, publication needs a separate explicit approval.

Question 1: deliverable readiness. My recommendation (Recommended): treat O1 as a candidate bug ticket, O2 as a conditional contract-conformance ticket pending live reconciliation, and O3 as a design decision that must be resolved before it can become an implementation ticket. Do you agree?
