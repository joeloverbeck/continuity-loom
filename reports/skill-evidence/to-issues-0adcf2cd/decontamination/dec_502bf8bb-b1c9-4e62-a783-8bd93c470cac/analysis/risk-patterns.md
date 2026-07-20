# Audit-induced risk patterns

These are candidate risks, not automatic deletions.

| Pattern | Evidence | Why it risks runtime behavior | Trial protection |
|---|---|---|---|
| Qualifications layered on qualifications | `SKILL.md` decision scans, artifact cases, ledger fallbacks, and approval variants repeatedly restate the same stop/ratify/publish boundary. | The common breakdown path is obscured and agents optimize for checklist recital instead of issue quality. | Tasks 01-03 and 05. |
| Several runtime homes for one publication invariant | Approval, parent custody, checklist, artifact durability, blockers, cleanup, and final proof appear in both files while scripts also enforce them. | Wording can drift and creates instruction competition with executable truth. | All tasks; helper tests. |
| Tool commands embedded where behavior is the real contract | Long `gh`, `rg`, Git, JSON, and manifest examples occupy both normal-path and approval-only prose. | Commands age faster than invariants and crowd out the state transition they implement. | Tasks 04, 06, 07; helper tests. |
| One-off defensive procedure generalized into ceremony | Exact two-phase ledger-precedent reads and the status-preserving ad hoc sweep are mandatory even though bounded exact reads and the canonical validator already express the transferable invariant. | Rare mechanics burden every multi-issue run. | Tasks 01, 02, 04. |
| Audit/conformance vocabulary in issue drafting | Composite-synonym matcher implementation and repeated warnings to write validator-recognized prose are loaded as authoring doctrine. | It encourages acceptance criteria written to a matcher rather than to observable behavior. | Tasks 01 and 02 plus validator tests. |
| Large examples duplicate executable schemas | Working-ledger and family-manifest JSON examples narrate schemas the verifier validates. | Runtime context scales with examples while schema enforcement already exists in code/tests. | Tasks 04 and 06 plus verifier tests. |
| Instruction collision on authorization | `SKILL.md` first requires approval, then permits publication after a second timeout. | A timeout is not authority for external mutation and contradicts the repository's recommendation-first posture. | Tasks 01, 03, 05, and 07. |
| Frontmatter/history residue | `disable-model-invocation: true` remains despite direct invocation being the explicit trigger. | Provenance is unclear, but removing it could alter invocation semantics, so it is retained as uncertain domain/tool metadata. | Not changed. |
