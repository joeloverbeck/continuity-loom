# Assessment

`ProjectStoreManager` is already placed at the right external seam: one module owns the currently open local project. The opportunity is to deepen that module, not split `project-store.ts` by file size. In particular, callers currently have to know that status and two nullable repositories are separate lookups and that backup is legal only while a project is open. More importantly, the implementation mixes the in-memory active-project transition with the fallible preparation of a candidate store.

The deepest safe seam is **project preparation and activation**. Everything required to turn a local folder into a verified, current, repository-ready project belongs behind it. `RecordRepository` remains a separate module: its record CRUD and reference transactions are cohesive and do not belong in project lifecycle code.

This is a **local-substitutable** dependency: production uses the local filesystem and SQLite; tests should use temporary directories and real SQLite files. Filesystem fault injection can be an internal seam. It should not become a storage port in the external interface. Migrations also have a real historical/versioned seam: each version step must be frozen and tested with old artifacts rather than importing future behavior into old migrations.

## Responsibility and dependency map

| Responsibility | Dependencies | Recommended owner |
| --- | --- | --- |
| Validate create input and keep projects outside the application tree | path resolution, metadata schema | project-store lifecycle module |
| Create project folder, manifest, and SQLite store | filesystem, UUID/clock, SQLite | candidate preparation |
| Read and atomically replace the manifest | filesystem | internal manifest implementation |
| Prove Loom identity and compatibility | SQLite pragmas, core compatibility rules | candidate preparation |
| Run ordered schema migrations and on-open repairs | SQLite, versioned migration steps, manifest replacement | one migration coordinator behind the same seam |
| Construct repositories sharing the verified database handle | `RecordRepository`, `StoryNotesRepository` | candidate preparation |
| Replace/close the active project | prepared candidate | thin active-session owner |
| Create a consistent backup | active database, filesystem | active project capability |
| Record CRUD/reference integrity | core record schemas, SQLite transaction | `RecordRepository`, unchanged |

The transaction-coupled knowledge is the compatibility check, migration order, `user_version`, manifest `schemaMinVersion`, repair order, repository construction, and handle ownership. It must remain together. Pulling each migration or filesystem call into a public helper would make a shallow interface and let callers assemble unsafe orders.

## Interface sketch

Keep the public interface lifecycle-shaped and make the prepared project a capability rather than three independently nullable getters:

```ts
type OpenProjectFailure = Exclude<OpenProjectResult, { ok: true }>;

interface OpenProject {
  readonly status: ProjectStatus;
  readonly records: RecordRepository;
  readonly storyNotes: StoryNotesRepository;
  createBackup(): Promise<{ backupPath: string }>;
}

interface ProjectStore {
  create(input: CreateProjectInput): Promise<ProjectStatus>;
  open(folderPath: string): Promise<OpenProjectResult>;
  current(): OpenProject | null;
  close(): Promise<void>;
}
```

Internally, use a smaller seam whose result is not visible until fully prepared:

```ts
interface ProjectPreparer {
  create(input: CreateProjectInput): Promise<PreparedProject>;
  open(folderPath: string): Promise<PreparedProject | OpenProjectFailure>;
}

interface PreparedProject extends OpenProject {
  close(): void;
}
```

`ProjectStore.open` asks the preparer for a candidate. Only a successful `PreparedProject` may replace the current one. In the eventual caller migration, update all route callers to `current()` and remove `getActiveProjectStatus`, `getRecordRepository`, `getStoryNotesRepository`, and manager-level `createBackup` in the same change. Do not retain aliases or a compatibility shim.

## Failure and rollback semantics

- Input, missing/invalid manifest, unreadable store, non-Loom application id, version mismatch, and newer-version incompatibility are classified before activation. Compatibility rejection must not mutate either file.
- Candidate preparation owns the candidate database handle. Every unsuccessful path closes it. A failed open leaves the prior active project open and unchanged; a successful open prepares completely, then closes the old handle and swaps once.
- Migrations and on-open repairs finish before repositories are exposed. A thrown upgrade remains `migration-failed`, never `invalid-sqlite`; repository getters/capabilities cannot expose partially upgraded data.
- Every SQLite migration step uses `BEGIN IMMEDIATE`, changes data and `user_version`, and either commits all of that step or rolls it back. The ordering of schema migrations and later record/draft repairs remains owned by the coordinator.
- The manifest and SQLite database cannot share one atomic transaction. The current v1→v2 and v2→v3 paths commit SQLite and then perform a non-atomic manifest write, so a crash or write failure can leave versions split. Do not hand-wave this. Before changing those paths, choose and specify a recovery protocol, preferably a small atomically written migration-intent file: record `from`/`to`, commit the database step, atomically replace the manifest, then remove the intent. On reopen, the coordinator deterministically rolls back an uncommitted step or completes the manifest replacement for a committed step. The existing v3→v4 compensating manifest rewrite becomes one tested case of that protocol.
- Backup should publish a result only after `VACUUM INTO` completes. Write to a unique temporary destination in `backups/`, then rename to the final timestamped name; on failure, close/clean the candidate and return no path.
- `close` is idempotent and clears the active reference even if the underlying handle is already closed.

Create rollback is a remaining design decision. A staging-directory-and-rename protocol gives the strongest all-or-nothing publication but changes observable filesystem behavior. Until a PRD explicitly chooses it, preserve the current rule that a post-`mkdir` initialization failure closes the database and may leave recoverable local artifacts; report that failure distinctly and never activate the project.

## Invariants kept inside the module

- A project is always local, outside the application tree, and identified by a valid manifest plus Loom `application_id`.
- Manifest schema version and SQLite `user_version` agree at activation, and the version is compatible with the running app.
- No repository is available before migrations and ordered repairs complete.
- All repositories for one active project share its one owned, open database handle.
- At most one project is active per store instance; failed candidate work cannot evict it.
- Closing the server/project closes the owned handle; no caller closes repository databases directly.
- Metadata replacement, migration recovery, and backup publication never report success for partial output.
- Local-first ownership, portability, backup, and inspectability remain constitutional behavior, not adapter details.

## Incremental extraction order

1. Characterize current outcomes at the existing `ProjectStoreManager` interface: failed-open preservation of the current project, handle closure, exact failure taxonomy, version non-mutation, migration rollback, and backup reopenability.
2. Extract a private `prepareOpenProject`/`PreparedProject` implementation without changing the public interface. Move identity checks, compatibility, migrations, repairs, repository construction, and candidate-handle cleanup together.
3. **Abort point:** if characterization differs after step 2, stop and revert the extraction. No caller migration or recovery-policy change should proceed on a behaviorally uncertain base.
4. Add an internal manifest implementation with atomic replacement and deterministic fault injection. Specify and implement the cross-file migration-intent protocol as a separate, explicitly reviewed storage change.
5. Move backup publication behind `PreparedProject` and make temporary-file cleanup observable in tests.
6. In one bounded caller change, introduce `current(): OpenProject | null`, update all route callers, and delete the four superseded getters/methods immediately. No compatibility shim.

## Verification strategy

Test through the project-store interface with a temporary directory and real `node:sqlite`; do not mock repository internals or SQLite statements.

- Table-test every open failure and assert result kind, candidate handle closure, unchanged active project, and exact manifest/database bytes where non-mutation is promised.
- Seed v1/v2/v3 fixtures and verify upgrade, idempotent reopen, ordering, row preservation, and repository availability only after completion.
- Inject failure before/during/after database commit, manifest temp write, manifest rename, compensation/recovery, and backup rename. Assert either the old consistent pair or a recoverable journaled state, never an activated split state.
- Exercise create/open/switch/close through the interface and prove that failed switching retains the old session while successful switching closes it.
- Reopen backups as Loom stores and verify application id, version, and representative records.
- Keep `RecordRepository` transaction tests at its own interface for create/update/delete/reference rollback. Delete tests that only assert private preparation helpers once the interface-level coverage exists.

