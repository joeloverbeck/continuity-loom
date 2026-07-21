# Assessment

`ProjectStoreManager` is already the correct external seam: it is the one owner of the currently open local project. The safe move is to deepen that module, not split its 624 lines by topic. `FOUNDATIONS.md` explicitly requires local, inspectable, portable, recoverable user-owned data; storage safety, compatibility classification, rollback, and backup are therefore invariants, not implementation conveniences.

## Responsibility and dependency map

- The project-store module owns folder placement, strict metadata parsing/replacement, SQLite identity and schema compatibility, connection lifetime, active-project switching, repository construction, close, and backup.
- `@loom/core` supplies the metadata contract, application/schema identities, and compatibility policy.
- The filesystem and `node:sqlite` are local-substitutable dependencies. Ordinary tests should use temp directories and real SQLite; they do not justify filesystem or database ports in the public interface.
- Versioned schema migrations and the on-open cleanup/backfill sequence are part of store preparation. Their ordering must remain owned by the project-store module.
- `RecordRepository` and `StoryNotesRepository` own data operations after activation. Record/reference updates that currently share `BEGIN IMMEDIATE` must stay together in those repositories; moving individual SQL statements into the manager would reduce locality.
- Routes currently learn that an active project consists of two independently nullable concrete repository getters. That leaks a lifecycle invariant and repeats the no-open-project decision across callers.

## Deepest safe seam

Keep one public **ProjectStore** module around the full project lifecycle. Internally divide work into `prepare` and `activate`, but do not expose those internal seams:

1. `prepareCreate` or `prepareOpen` builds a complete, validated `PreparedProject` without changing the active project.
2. Store migration, metadata replacement, repository construction, and final compatibility validation finish while the candidate is inactive.
3. `activate` closes the old session and publishes the prepared session as one state transition. A failed candidate is closed and the previous active project remains active.

Replace the two nullable repository getters with one atomic active-project query, updating all callers in the same change and deleting the old methods rather than retaining aliases:

```ts
interface ProjectStore {
  createProject(input: CreateProjectInput): Promise<ProjectStatus>;
  openProject(folderPath: string): Promise<OpenProjectResult>;
  getActiveProject(): ActiveProjectAccess | null;
  closeProject(): Promise<{ open: false }>;
  createBackup(): Promise<{ backupPath: string }>;
}

interface ActiveProjectAccess {
  readonly status: ProjectStatus;
  readonly records: RecordRepository;
  readonly storyNotes: StoryNotesRepository;
}
```

This does not pretend that one production repository implementation needs a speculative port. It simply makes the real invariant visible: status and both repositories exist and die together. The raw `DatabaseSync`, paths used for mutation, migration functions, and activation remain hidden.

The migration catalog is a justified private historical-contract seam. Each `fromVersion -> toVersion` step must own the exact old schema knowledge it consumes and must not consult mutable current UI/catalog sources. It is tested by opening frozen old project artifacts through `ProjectStore.openProject`, not by calling migration helpers directly.

## Failure and rollback semantics

- **Create:** validate before touching disk. Build the metadata and SQLite store in a unique staging directory under the selected parent, validate identity/version, then rename the directory to the requested final name. Any failure closes SQLite and removes only that operation's staging directory. The existing active project is unchanged. A final-name collision remains `folder-exists`.
- **Open/preflight:** missing, malformed, unreadable, foreign, mismatched, newer, and unsupported-old stores retain the existing result taxonomy. Preflight failures do not mutate either disk or active state.
- **Migration:** never claim that the database is intact unless that is proved. The current v1-to-v2 and v2-to-v3 paths commit SQLite before a plain metadata write; v3-to-v4 compensates caught errors but is not crash-atomic across SQLite and the sidecar file. Before changing these paths, choose and specify a recovery protocol: preserve original metadata plus a SQLite backup, durably mark upgrade phase, migrate and validate, and either complete or restore on the next open. A caught failure rolls back the current transaction, restores the proven pre-migration pair, closes the candidate, and returns `migration-failed`. If restore itself fails, preserve the recovery artifacts and report that fact rather than relabeling it `invalid-sqlite`.
- **Activation:** publish no candidate until all preparation succeeds. If closing the previous session fails, close the candidate and leave the previous session as the manager's state.
- **Close:** idempotent; clear active state only after the owned database handle closes.
- **Backup:** require an active project, write to a new path, validate the copy's application id and schema version, and return only a complete copy. Remove an incomplete new backup on failure; never overwrite an older backup.

The cross-resource crash protocol is the principal design uncertainty. It needs an explicit decision and recovery tests before altering migration behavior; exception-only compensation is not enough evidence of recoverability.

## Invariants kept inside the module

- Projects stay outside the application root and remain locally owned.
- Metadata is strict, contains no secret-shaped additions, and names the database opened.
- Metadata `schemaMinVersion` and SQLite `user_version` agree whenever a project is activated.
- `application_id` identifies a Loom store; newer or unsupported stores are never mutated.
- WAL, foreign keys, synchronous mode, tables, ordered migrations/backfills, and repositories are ready before exposure.
- Exactly zero or one active session exists; its repositories cannot outlive its database.
- Failed create/open/upgrade never replaces a healthy active session.
- Backups are point-in-time SQLite copies and never masquerade as successful partial files.

## Incremental extraction order

1. Add interface-level characterization tests for current taxonomy, preservation of the old active project, backup validity, migration ordering, and partial-failure cases.
2. Introduce private `PreparedProject` plus centralized `activate/closeCandidate`; make both create and open use it without changing callers.
3. **Abort point:** if preparation cannot be separated without changing observable results, or the sidecar/SQLite recovery protocol is not approved, stop here. Do not publish a cosmetic wrapper or a compatibility shim.
4. Move only the ordered version catalog and recovery coordination into a private migration module; keep individual step contracts frozen.
5. Implement staged create and the approved migration recovery protocol.
6. Replace both repository getters with `getActiveProject()` in one repository-wide change, then delete the old getters and their tests.

## Verification strategy

Test through `ProjectStore` using temp project directories and real SQLite. Use frozen v1-v4/newer fixtures and assert observable results: returned taxonomy, exact metadata bytes where non-mutation is promised, pragmas and table/data state, preserved active status, repository usability, closed ownership, and backup reopenability. A private fault-injecting I/O adapter is justified only for deterministic failures at write, rename, commit, rollback, close, and backup points; it must not enter the public interface. Once these tests cover the module seam, delete tests that only pin private helper calls or migration structure.
