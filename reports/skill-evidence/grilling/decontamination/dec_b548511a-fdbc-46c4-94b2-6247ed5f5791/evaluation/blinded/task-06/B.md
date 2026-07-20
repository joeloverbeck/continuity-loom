## Readiness determination

**Not ready to hand to `to-prd` yet.** The discussion has a coherent goal and strong scope boundaries, but four unresolved branches are product decisions, not drafting details. Handing it off now would require `to-prd` to invent security, artifact, integrity, and failure semantics.

### What is settled

- `Decision: [RATIFIED]` Export is manual, local-only, initiated from an open project, and written to a user-selected local path.
- `Decision: [RATIFIED]` The export includes story records, generation-time brief state, the accepted-segment archive, and private notes.
- `Decision: [RATIFIED]` API keys, logs, generated or rejected candidates, and prompt previews are excluded.
- `Decision: [RATIFIED]` Import and restore are outside this change, and the server remains bound to `127.0.0.1`.

### Material branches still open

1. **Confidentiality policy.** The owner has not decided whether private notes may be plaintext in the backup. My recommendation is a clearly disclosed, unencrypted first version, because the export is manual and user-directed and encryption would introduce passphrase, recovery, compatibility, and future-restore requirements. If encryption is non-negotiable, that must be ratified before `to-prd`; it materially changes the feature and may justify a separate first PRD.

2. **Bundle shape.** My recommendation is one compressed, versioned archive rather than a plain directory. It is easier to move as a backup and gives the exporter a single commit boundary. The archive should contain a manifest identifying the bundle-format version and expected entries. The specific compression codec can remain an implementation choice unless compatibility requirements exist.

3. **Export-integrity oracle.** Round-trip import testing is not suitable while import is explicitly out of scope. My recommendation is direct archive inspection: build an export from a fixture project, open the archive independently, verify the manifest, entry counts and digests, compare included records with the canonical source fixture, and assert that every excluded class is absent. Corruption or validation failure must prevent publication of the final bundle.

4. **Destination and failure semantics.** The PRD needs a user-visible rule for collisions, partial writes, cancellation, and cleanup. My recommendation is: never overwrite silently; require explicit replacement or a different path; stage to a temporary sibling; validate before finalizing; replace atomically where the platform permits; leave any existing destination unchanged on failure; and remove temporary output after failure or cancellation. A default filename and collision behavior should be ratified, while low-level buffering details can remain implementation-owned.

Migration support does not belong in this PRD because restore is excluded, but the exported format still needs an explicit version in its manifest so a future restore feature has a stable compatibility boundary.

### Recommended PRD shape once those choices are ratified

Use **one PRD**, not a program: a manual project-backup export with an explicit bundle contract and safe-write semantics.

Acceptance should prove that:

- an open project can produce one bundle at the selected local destination;
- every required data class is represented and every prohibited class is absent;
- the manifest and integrity checks describe the bundle completely;
- collision, failure, and cancellation paths cannot leave a corrupt final bundle or silently damage an existing one; and
- neither localhost binding nor local-only ownership changes.

Keep import, restore, scheduled export, upload or cloud storage, and—if the recommendation above is accepted—encrypted export out of scope. At the later `to-prd` handoff, the testing-seam checkpoint is still owed; the recommended seam is the exporter boundary, exercised with fixture-based archive inspection plus injected write and validation failures.

### Rejected alternatives

- **Hand off immediately:** rejected because it would conceal unresolved product choices inside PRD drafting.
- **Use round-trip import as acceptance proof:** rejected because it creates an undeclared dependency on an out-of-scope feature.
- **Treat the directory/archive choice as incidental:** rejected because it changes portability, partial-write behavior, and the bundle contract.

### Exact resume point

Resolve the confidentiality policy first; it determines the viable container and verification design. Then ratify the single-archive recommendation and the safe-write/collision policy. Once those decisions are recorded, the discussion is ready for `to-prd` without a routine requirements interview.

This determination uses only the supplied frozen discussion. Current repository authorities, implementation, tracker overlap, worktree state, and runtime behavior were not inspected, and no tests or app runs were performed. The transcript's durability and publication visibility are unverified, so a later PRD should summarize these decisions unless they are first recorded in a stable source. No PRD, file, or external mutation was created as part of the simulated response.
