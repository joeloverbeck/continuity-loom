The discussion is not yet ready for a synthesis-only handoff to `to-prd`. The product seam is coherent, but four unresolved choices would force `to-prd` to invent requirements rather than publish already-settled intent. It is one focused decision pass away from PRD-ready.

Source: the supplied frozen discussion transcript.

Selected section: N/A; the whole export-bundle discussion was assessed.

Verdict: Not PRD-ready yet.

Evidence:

- Settled: manual, local-only export from an open project; explicit included and excluded data; user-selected local destination; no scheduling or upload; import/restore excluded; localhost binding preserved.
- Blocker 1 — artifact contract: directory versus compressed file remains open. This affects the user interaction, portability, naming, collision handling, and integrity model.
- Blocker 2 — confidentiality: plaintext versus local encryption remains open. Because private notes are included, this is a product/security decision, not an implementation detail. Choosing encryption also creates passphrase/key handling and failure requirements.
- Blocker 3 — completion semantics: overwrite, collision, partial-write, cancellation, and cleanup behavior are unspecified. Without an all-or-nothing completion rule, the PRD cannot define what counts as a successful backup.
- Blocker 4 — acceptance proof: round-trip import is incompatible with the stated scope, and no export-only integrity oracle has replaced it.

Inspected authorities: only the frozen discussion supplied for this analysis; no live repository, product authority, or tracker material was consulted.

Candidate set: (1) hand the discussion to `to-prd` as-is; (2) ratify the four export-contract decisions, then hand it off; (3) add import/restore so round-trip testing becomes possible.

Winning candidate: Candidate 2 — settle the export contract first, while preserving import/restore as out of scope.

Recommendation: use one versioned compressed file; make the confidentiality posture explicit before handoff (recommended: local encryption with an export-time secret that is never stored); forbid implicit overwrite; write to a sibling temporary artifact and expose the final bundle only after validation; remove temporary data on error or cancellation; and use a manifest plus per-entry digests and inclusion/exclusion assertions as the export-only integrity oracle. These are recommendations, not ratified decisions.

Recommended testing seam: compile the export payload deterministically, reopen and verify the completed bundle, validate its manifest/version and every digest, assert the required record classes are present, and assert excluded secrets and candidate/prompt material are absent. This tests export integrity without importing anything into a project. The later `to-prd` seam-confirmation checkpoint remains owed.

Rejected alternatives: handing off now would make `to-prd` choose security and failure semantics; expanding this change to import/restore contradicts the agreed scope.

Rejected/no-op alternatives: round-trip import tests are not a valid no-op substitute for an export oracle, and leaving plaintext-versus-encryption unstated is not acceptable when private notes are included.

Tracker overlap: N/A; live tracker access was outside this frozen analysis.

Existing prep artifact status: N/A; none was supplied.

Out of scope: import/restore, scheduled or remote export, API keys, logs, generated or rejected candidates, prompt previews, any change to localhost binding, and implementation or publication in this turn.

External research: skipped because the request is a frozen, analysis-only determination and external research was neither needed nor permitted.

Supporting skill result: N/A; no supporting skill was invoked.

Freshness: this verdict applies only to the supplied frozen transcript; no live repo or tracker state was refreshed. No PRD, file, tracker item, or implementation change was created.
