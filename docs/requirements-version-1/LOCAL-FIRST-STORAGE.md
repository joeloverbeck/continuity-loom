# Local-First Storage — Continuity Loom v1

## Purpose

This spec defines how Continuity Loom v1 stores user-owned story projects locally while preserving portability, durability, inspectability, deterministic validation, and strict secret boundaries.

The storage model must make the project feel like a folder the user owns, not a cloud account, hidden database, or opaque app silo.

## Scope

This spec covers project folders, canonical SQLite storage, metadata/config files, backup/copy expectations, inspectability, hand-editing boundaries, migration/versioning expectations, data ownership, and secret-handling boundaries.

It does not define database migrations, table DDL, export-format code, cloud sync, collaboration, encryption, or a desktop packaging strategy.

## Non-goals

This spec does not make Markdown/JSON the canonical editable store, does not define a cloud backup service, does not add sync or collaboration, does not require encryption in v1, and does not create a complex publishing/export system. It also does not permit API keys, permanent prompts, or rejected candidates in project folders.

## Project folder model

V1 projects are explicit local folders created or opened by the user. The app must not hide all projects inside an app-managed opaque directory.

Recommended folder shape:

```text
Example Continuity Loom Project/
  continuity-loom.project.json
  loom.sqlite
  README.md                       # optional user-facing note, not required
  backups/                        # optional app-created backup copies
```

The exact database filename may evolve, but the project metadata must identify it. The project folder is the unit the user can copy, back up, archive, or move.

## Canonical store

The canonical store is a SQLite database file inside the project folder.

SQLite is preferred over a folder of Markdown/JSON files because Continuity Loom needs:

- stable record identity;
- cross-record references;
- dense filtering and grouping;
- deterministic validation over object possession, locations, holders, statuses, secrets, and active working sets;
- transactions around multi-record edits;
- append-only accepted segment ordering;
- migration/version metadata;
- reliable crash behavior for local writes.

A folder of Markdown/JSON is more hand-editable, but it makes reference integrity, atomic updates, validation scans, and migration safety weaker for this specific record graph. Obsidian-style plaintext vaults are excellent for notes, but Continuity Loom’s canonical graph is more relational and stateful than a normal knowledge base.

## Project metadata/config files

`continuity-loom.project.json` is small and readable. It may contain:

- project display title;
- project UUID;
- created/updated timestamps;
- expected app/schema minimum version;
- canonical database filename;
- human-facing project description;
- optional demo/fixture marker.

It must not contain:

- OpenRouter API keys;
- generated prompts;
- candidate prose;
- accepted prose;
- compiler caches containing prompt text;
- local absolute paths that prevent project portability unless unavoidable;
- hidden cloud account identifiers.

Global OpenRouter model settings and API key configuration are not project metadata.

## Inspectability

A power user may inspect the SQLite database with ordinary SQLite tools. The app should use SQLite features that aid identification and recovery, such as `PRAGMA user_version` and a recognizable `application_id` where appropriate.

Inspectable does not mean freely hand-editable. The app should document that external edits to `loom.sqlite` are unsupported while the project is open and may make validation fail until corrected.

The app itself does not need raw Markdown/JSON editing for records. Ordinary users edit through typed app forms. Power users can inspect database content externally at their own risk.

## Backup and copy expectations

The simplest supported backup story is:

- close the project or app;
- copy the entire project folder.

Because SQLite may use journal or WAL sidecar files while open, the app should also provide a simple “Create Backup Copy” workflow that uses SQLite’s backup/VACUUM-style mechanisms or otherwise guarantees a consistent copy without requiring the user to understand WAL files.

SPEC-002 realizes the Phase 2 storage subset in code: explicit project folders, `continuity-loom.project.json`, canonical `loom.sqlite`, the app/schema version gate, and a timestamped `VACUUM INTO` backup workflow. The migration runner and accepted-prose archive separation remain later-phase work.

V1 does not need a complex whole-project export system. It should provide enough backup/portability that a user can copy a project folder, move it to another machine with the app installed, and open it.

Accepted prose export may exist as a simple reading/export affordance, but exported prose is not canonical continuity.

## What is hand-editable

Safe-ish hand-editable files:

- `README.md`, if present;
- a clearly documented project metadata file, as long as edits are schema-valid.

Not intended for ordinary hand-editing:

- `loom.sqlite` record payloads;
- active working set state;
- generation-time brief state;
- accepted segment archive;
- validation metadata;
- migration/version fields.

The app must not assume external edits are malicious. It should parse and validate defensively, then show actionable corruption or invalid-project diagnostics.

## Migration and versioning expectations

The project database has explicit schema/application version metadata. Migrations must be deterministic, transactional, and one-way for v1. Before any migration that changes canonical data, the app should either create a backup or require the user to confirm after clearly stating the risk.

Migration failures must leave the previous project intact or produce a recoverable backup. They must not half-update records, active working sets, accepted segments, or project metadata.

Compiler/template/contract version metadata belongs with generation metadata and accepted segment metadata where useful. It must not be used to store prompt text permanently.

## Data ownership

All story records, generation-time brief state, active working set selections, accepted segments, and project metadata live locally in the project folder’s canonical store unless explicitly exported. No remote service owns continuity.

OpenRouter receives only the generated prompt intentionally sent for a generation request. OpenRouter never receives the full project store unless the selected active working set and generation-time fields happen to include those details in the prompt.

## Secret-handling boundaries

API keys never live in project folders. V1 should read `OPENROUTER_API_KEY` from `.env`, `.env.local`, shell environment, OS credential store, or equivalent global local secret storage outside project data. Example env files may name the variable but must never include a real key.

The app must treat any API key discovered inside a project file, generated prompt, prompt preview, log, generated file, fixture, or accepted prose as a security bug.

Prompt inspection is in-memory or current-session only by default. Permanent prompt archives are not created. Temporary caches should be clearable and should avoid disk where practical.

## User-facing behavior

The project picker lets the user create a project in an explicit folder or open an existing folder. The app should show the project path, title, schema/app version compatibility, and last opened state.

When backing up, the app should offer a clear operation such as “Create backup copy” and produce a timestamped copy that can be opened later. It should not imply that backup copies are branches or alternate timelines.

When a project cannot be opened, the app should distinguish missing metadata, incompatible version, invalid SQLite file, migration required, migration failed, or corrupted/unreadable data.

## Data/logic implications

Storage logic must preserve:

- one canonical project store per project;
- stable IDs for records and accepted segments;
- deterministic ordering for prompt compilation;
- active working set selections as project state, not global app state;
- generation-time brief state as project-local operational state;
- accepted segments as readable output archive only;
- no prompt archive by default;
- no key storage in projects.

## Alignment with `FOUNDATIONS.md`

This design implements local-first user-owned data, the five continuity surfaces, prompt transparency without prompt hoarding, accepted prose archive boundaries, and the OpenRouter secret rules. It rejects cloud storage as canonical authority and does not introduce collaboration, sync, branches, or prose-as-canon.

## Security/privacy implications

Project folders contain private creative material and may contain mature fiction. The app must not upload them except for explicit prompt sends through OpenRouter. Local HTTP endpoints must bind to localhost. Backups must not accidentally include global `.env` files or API keys.

If future encryption is added, it must not become required for v1 portability. V1 may document that disk-level encryption or OS account security protects local files.

## Validation implications

On project open, app-level schema validation should verify metadata and database compatibility before domain records enter the UI. On record load/save, runtime schema validation should reject malformed payloads. Domain validation remains separate and checks continuity/prompt safety before generation.

External database edits may create invalid records. The app should surface these as data validity errors, not crash.

## Failure modes

Storage failure modes include:

- copying an open SQLite database without WAL sidecars and producing an inconsistent backup;
- hiding project data in an app-private directory and breaking user ownership;
- storing API keys in project metadata;
- treating backup copies as branches;
- using Markdown/JSON as canonical storage and losing reference integrity;
- letting permanent prompt text accumulate in caches;
- running a migration that corrupts or partially updates a project;
- failing to distinguish accepted prose from canonical records in storage queries.

## Done Means

Local-first storage is satisfied when:

- users create and open explicit local project folders;
- every project contains a readable project metadata file and one canonical SQLite store;
- all required v1 story records, active working set state, generation-time brief state, and accepted segments persist locally;
- backup/copy guidance is documented and a consistent backup workflow exists;
- API keys and OpenRouter secrets cannot be written to project metadata or canonical stores through normal app paths;
- prompt text is not permanently archived by default;
- migration/version fields exist and migration failures are recoverable;
- external malformed data produces actionable diagnostics rather than silent repair or crashes;
- accepted prose storage is physically and logically separate from compiler input queries.

## Research sources

- Local-first principles: https://www.inkandswitch.com/essay/local-first/
- SQLite as application file format: https://sqlite.org/appfileformat.html
- SQLite atomic commit: https://sqlite.org/atomiccommit.html
- SQLite corruption and journaling guidance: https://sqlite.org/howtocorrupt.html
- SQLite PRAGMA documentation: https://sqlite.org/pragma.html
- Library of Congress SQLite sustainability note: https://www.loc.gov/preservation/digital/formats/fdd/fdd000461.shtml
- Obsidian local Markdown vault model: https://obsidian.md/help/data-storage
