Publication has not begun. I’m at the sole seam-and-package checkpoint.

The proposed publication package is one GitHub PRD, working title `PRD: Manual local backup export`, with type `enhancement` and intended triage label `ready-for-agent`. There are no follow-on PRDs and no product decisions left open. Because this changes project storage, backup, and export safety, the PRD will require a focused implementation spec; that is part of the implementation deliverables, not a second PRD, and will be checked by review/conformance against `FOUNDATIONS.md` rather than by its own test seam.

The proposed implementation test seams are:

1. A pure core bundle-assembler and manifest-verifier seam proving the exact inclusion/exclusion policy, deterministic versioned manifest entries and digests, complete-bundle verification, and rejection of incomplete or mismatched bundles.
2. The localhost export-route seam, with filesystem operations injected so tests can prove successful temporary-sibling creation and atomic rename, cancellation and write-failure cleanup, preservation of an existing destination, and no provider or other network request.
3. One new production browser-flow seam proving the plaintext-private-notes disclosure before export, cancellation, a successful user-selected local export, accessible control/state behavior, and zero network traffic.

Does this exact single-PRD package, label posture, and three-seam test plan match your expectations? If so, reply `Approved` and I’ll draft, validate, publish, and verify the PRD. Because the production browser flow is a new seam, I will not proceed on a timeout or assumed approval.
