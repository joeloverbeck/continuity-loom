I’m treating this as a design/plan stress-test, not an implementation review.

Frozen-source limitation: I can assess the proposal’s internal design from the supplied immutable excerpt, but I have not refreshed the current authorities, implementation, status vocabulary, durable operator-ID usage, or tracker state. Any claim that depends on those live facts remains open for later verification.

Explored fact: the three proposed changes form one dependency chain:

`peer operator semantics → legal current-state grounds → minimum deterministic bundle`

The taxonomy names the state transition a slot is meant to cause. State-aware eligibility prevents a resolved or otherwise inactive record from falsely qualifying that move. Minimum bundles identify the exact records that prove the move is available and prevent “all matching records” from dissolving its boundary. Taxonomy alone would therefore leave the proposal’s distinctness claim unenforced; eligibility and bundles without the taxonomy would have no stable move-specific contract to enforce.

Finding: they belong in one semantic approval package, with different levels of confidence inside it. The core package—nine genuine moves, current-state-aware qualification, and move-specific minimum bundles—is coherent and should rise or fall together. The exact status-edge matrix, reveal-authorization edge, operator-ID compatibility, fixed ordering, and dormant-slot viability are downstream risk branches that the frozen excerpt itself says still need confirmation; approving the package should not silently ratify those unverified details.

Question 1: package boundary. My recommendation (Recommended): approve the three-part design as one indivisible semantic contract, while keeping its enumerated compatibility and status-edge details open for explicit confirmation before they become normative. This is the narrowest approval that actually delivers nine peer moves rather than nine labels over the old permissive assignment behavior. Do you agree?
