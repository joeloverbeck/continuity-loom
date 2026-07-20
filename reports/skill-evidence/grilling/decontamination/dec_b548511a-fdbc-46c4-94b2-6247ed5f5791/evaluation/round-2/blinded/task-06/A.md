# Readiness determination

**Verdict: not PRD-ready yet.** The discussion has a clear goal and useful scope boundaries, but consequential product, security, persistence, and acceptance decisions remain open. Handing it to `to-prd` now would make that workflow invent requirements rather than synthesize agreed ones.

Source: the entire frozen discussion transcript supplied for this determination.

## Settled scope

Decision: [RATIFIED] How export runs -> manually, locally, and only from an open project; rationale: the owner controls each backup and nothing is scheduled or uploaded.

Decision: [RATIFIED] What the bundle includes -> story records, generation-time brief state, the accepted-segment archive, and private notes; rationale: these are the stated backup contents.

Decision: [RATIFIED] What the bundle excludes -> API keys, logs, generated and rejected candidates, and prompt previews; rationale: secrets and non-authoritative generation residue are outside the backup.

Decision: [RATIFIED] Where export writes -> a user-selected local path; rationale: destination choice remains with the local owner.

Decision: [RATIFIED] Whether this change restores bundles -> import and restore are out of scope; rationale: this change is export-only.

Decision: [RATIFIED] Network posture -> the server remains bound to `127.0.0.1`; rationale: export does not weaken the local-only boundary.

## Why it is not ready

Finding: plaintext versus encryption is a product and threat-model decision, not a packaging detail. It determines the container, password or key interaction, error cases, and what “private” means after the bundle leaves the project directory.

Finding: directory versus single-file output changes portability, collision handling, atomicity, cleanup, and the integrity oracle.

Finding: the component that owns the user-selected path and final write has not been identified. A browser save/download flow and a localhost server filesystem write have different permission, disclosure, cancellation, and failure semantics.

Finding: no successful-export oracle exists. A round-trip import test cannot be the acceptance seam while import is explicitly out of scope.

Finding: bundle versioning and source-schema treatment are undecided, as are overwrite, naming collision, partial-write, cancellation, and cleanup behavior. These affect whether an export can truthfully be reported as complete.

## Recommended resolution path

Resolve these branches in dependency order before invoking `to-prd`:

1. **Confidentiality:** use an authenticated encrypted bundle, protected by a per-export user-supplied passphrase that the app does not persist. This is the safer default for a portable artifact containing private notes. If plaintext is preferred, that needs an explicit disclosure rule and an accepted threat-model boundary.
2. **Artifact shape:** use one compressed, versioned bundle rather than a directory. A single artifact is easier to move and gives the write operation one commit point.
3. **Write ownership:** choose explicitly between browser-owned save and server-owned path writing after checking the supported runtime surface. Do not let the PRD assume these are interchangeable.
4. **Format and migration posture:** include a manifest with bundle-format and source-schema versions; export the current canonical data without migrating it, and make restore compatibility a future import concern.
5. **Commit semantics:** build beside the destination as a temporary artifact, validate it, then commit it as the final path. Do not silently overwrite an existing bundle; require a new destination or explicit replacement. On failure or cancellation, remove the temporary artifact and leave no partial final bundle.
6. **Integrity oracle:** test export through an independent bundle reader/inspector, not an import feature. It should verify that the archive opens, the manifest is valid, every required class is present, every excluded class is absent, entry counts match, and per-entry hashes verify. Failure-injection tests should cover cleanup and preservation of an existing destination.

The later `to-prd` pass still owes its testing-seam confirmation; the independent bundle-inspection seam above is the recommendation, not a completed publication checkpoint.

Rejected alternatives: a plain directory loses the single commit point and multiplies partial-write states; future round-trip import as the only oracle makes this PRD depend on out-of-scope work; silent overwrite risks destroying an earlier backup; leaving these choices to implementation would produce an unverifiable contract.

Out of scope remains scheduled export, upload, import, restore, API-key handling, and changes to localhost binding. Cryptographic recovery, cross-version restore, and retention policy should not enter this first PRD unless the confidentiality decision explicitly requires them.

Exact resume point: settle the confidentiality model first, because it constrains the artifact format and write flow. Then settle write ownership before finalizing failure and verification semantics. This should be a bounded decision pass, not a general requirements interview.

Freshness limitation: this determination used only the frozen transcript. Under the frozen-source constraint, I did not inspect current authorities, implementation, runtime capabilities, tracker overlap, archive material, source durability, or worktree state. No tests or app runs were performed. Before publication, those live facts must be refreshed and any conflicts reconciled. No PRD, report artifact, repository change, or external mutation was created for this analysis.
