import {
  classifyApplicationId,
  evaluateStoreCompatibility,
  LOOM_APPLICATION_ID,
  LOOM_SCHEMA_VERSION,
  projectMetadataSchema,
  type CreateFailureKind,
  type OpenProjectResult,
  type ProjectMetadata,
  type ProjectStatus
} from "@loom/core";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { isAbsolute, join, relative, resolve } from "node:path";
import { z, ZodError } from "zod";

import { backfillDisplayLabels } from "./display-label-backfill.js";
import { migrateGlobalConfigRecords } from "./global-config-migration.js";
import { RecordRepository } from "./record-repository.js";
import { ensureRecordTables } from "./record-tables.js";
import { repairWorkingSetReferences } from "./working-set-integrity-migration.js";

const METADATA_FILENAME = "continuity-loom.project.json";
const DATABASE_FILENAME = "loom.sqlite";

/**
 * Raised by {@link ProjectStoreManager.createProject} when the project folder
 * cannot be created. Carries a {@link CreateFailureKind} so the API layer can
 * return an actionable diagnostic instead of an opaque "could not be created".
 */
export class ProjectCreateError extends Error {
  constructor(
    readonly kind: CreateFailureKind,
    message: string
  ) {
    super(message);
    this.name = "ProjectCreateError";
  }
}

/**
 * True when `child` resolves to `root` itself or any path nested inside it.
 * Used to keep project stores out of the application's own working directory
 * (the repository in dev) so user data is never accidentally committed.
 */
function isWithin(child: string, root: string): boolean {
  const rel = relative(resolve(root), resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

function createErrorFromFsError(
  error: unknown,
  parentPath: string,
  folderName: string
): ProjectCreateError {
  switch (errorCode(error)) {
    case "ENOENT":
      return new ProjectCreateError(
        "parent-missing",
        `The parent path does not exist: ${parentPath}`
      );
    case "EEXIST":
      return new ProjectCreateError(
        "folder-exists",
        `A folder named "${folderName}" already exists in ${parentPath}.`
      );
    case "EACCES":
    case "EPERM":
    case "EROFS":
      return new ProjectCreateError(
        "unwritable",
        `Continuity Loom does not have permission to write in ${parentPath}.`
      );
    default:
      return new ProjectCreateError("unwritable", "The project folder could not be created.");
  }
}

const createProjectInputSchema = z
  .object({
    parentPath: z.string().min(1),
    folderName: z.string().min(1),
    title: z.string().trim().min(1),
    description: z.string().optional(),
    isDemoFixture: z.boolean().optional()
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export type ProjectOpenState = ProjectStatus | { open: false };

export interface ProjectStoreManager {
  createProject(input: CreateProjectInput): Promise<ProjectStatus>;
  openProject(folderPath: string): Promise<OpenProjectResult>;
  getActiveProjectStatus(): ProjectOpenState;
  getRecordRepository(): RecordRepository | null;
  closeProject(): Promise<{ open: false }>;
  createBackup(): Promise<{ backupPath: string }>;
}

interface ActiveProject {
  folderPath: string;
  metadata: ProjectMetadata;
  database: DatabaseSync;
  recordRepository: RecordRepository;
  storeUserVersion: number;
}

function metadataPath(folderPath: string): string {
  return join(folderPath, METADATA_FILENAME);
}

function databasePath(folderPath: string, metadata: ProjectMetadata): string {
  return join(folderPath, metadata.databaseFilename);
}

function readPragmaNumber(database: DatabaseSync, pragmaName: "application_id" | "user_version"): number {
  const row = database.prepare(`PRAGMA ${pragmaName}`).get() as Record<string, unknown> | undefined;
  const value = row?.[pragmaName];

  if (typeof value !== "number") {
    throw new Error(`Could not read PRAGMA ${pragmaName}.`);
  }

  return value;
}

function configureDatabase(database: DatabaseSync): void {
  database.exec(`
    PRAGMA application_id = ${LOOM_APPLICATION_ID};
    PRAGMA user_version = ${LOOM_SCHEMA_VERSION};
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
  `);
}

function statusFromActive(active: ActiveProject): ProjectStatus {
  return {
    folderPath: active.folderPath,
    title: active.metadata.title,
    projectUuid: active.metadata.projectUuid,
    databaseFilename: active.metadata.databaseFilename,
    ...(active.metadata.isDemoFixture === undefined ? {} : { isDemoFixture: active.metadata.isDemoFixture }),
    appSchemaVersion: LOOM_SCHEMA_VERSION,
    storeUserVersion: active.storeUserVersion,
    compatibility: evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, active.storeUserVersion)
  };
}

function sqliteStringLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function failure(kind: Exclude<OpenProjectResult, { ok: true }>["kind"], message: string): OpenProjectResult {
  return { ok: false, kind, message };
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function timestampForFilename(date = new Date()): string {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

export interface ProjectStoreOptions {
  /**
   * Directory that project folders must stay outside of. Defaults to the
   * process working directory (the repository in dev) so user data is never
   * created inside, and accidentally committed to, the application tree.
   */
  applicationRoot?: string;
}

export function createProjectStoreManager(options: ProjectStoreOptions = {}): ProjectStoreManager {
  const applicationRoot = resolve(options.applicationRoot ?? process.cwd());
  let active: ActiveProject | null = null;

  function closeActive(): void {
    if (active?.database.isOpen) {
      active.database.close();
    }

    active = null;
  }

  return {
    async createProject(input) {
      const parsed = createProjectInputSchema.parse(input);

      if (!isAbsolute(parsed.parentPath)) {
        throw new ProjectCreateError(
          "parent-not-absolute",
          "The parent path must be an absolute path (for example /home/you/continuity-loom-projects)."
        );
      }

      const folderPath = resolve(parsed.parentPath, parsed.folderName);

      if (isWithin(folderPath, applicationRoot)) {
        throw new ProjectCreateError(
          "parent-inside-app",
          `Projects cannot be created inside the Continuity Loom application folder (${applicationRoot}). Choose a folder elsewhere, such as your home directory.`
        );
      }

      const now = new Date().toISOString();
      const metadata = projectMetadataSchema.parse({
        title: parsed.title,
        projectUuid: randomUUID(),
        createdAt: now,
        updatedAt: now,
        schemaMinVersion: LOOM_SCHEMA_VERSION,
        databaseFilename: DATABASE_FILENAME,
        ...(parsed.description ? { description: parsed.description } : {}),
        ...(parsed.isDemoFixture === undefined ? {} : { isDemoFixture: parsed.isDemoFixture })
      });

      try {
        await mkdir(folderPath);
        await writeFile(metadataPath(folderPath), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
      } catch (error) {
        throw createErrorFromFsError(error, parsed.parentPath, parsed.folderName);
      }

      const database = new DatabaseSync(databasePath(folderPath, metadata));

      try {
        configureDatabase(database);
        ensureRecordTables(database);
        backfillDisplayLabels(database);
        migrateGlobalConfigRecords(database);
        repairWorkingSetReferences(database);
        closeActive();
        active = {
          folderPath,
          metadata,
          database,
          recordRepository: new RecordRepository(database),
          storeUserVersion: readPragmaNumber(database, "user_version")
        };

        return statusFromActive(active);
      } catch (error) {
        database.close();
        throw error;
      }
    },

    async openProject(folderPathInput) {
      const folderPath = resolve(folderPathInput);
      let metadata: ProjectMetadata;

      try {
        const metadataJson = await readFile(metadataPath(folderPath), "utf8");
        metadata = projectMetadataSchema.parse(JSON.parse(metadataJson));
      } catch (error) {
        if (isFileNotFound(error)) {
          return failure(
            "missing-metadata",
            "The selected folder does not contain continuity-loom.project.json."
          );
        }

        if (error instanceof SyntaxError || error instanceof ZodError) {
          return failure(
            "invalid-metadata",
            "The project metadata file is not valid Continuity Loom metadata."
          );
        }

        return failure("unreadable", "The selected project folder could not be read.");
      }

      const storePath = databasePath(folderPath, metadata);

      try {
        await access(storePath);
      } catch (error) {
        if (isFileNotFound(error)) {
          return failure("invalid-sqlite", "The project store loom.sqlite is missing.");
        }

        return failure("unreadable", "The project store could not be read.");
      }

      let database: DatabaseSync;

      try {
        database = new DatabaseSync(storePath);
      } catch {
        return failure("invalid-sqlite", "The project store is not a readable SQLite database.");
      }

      try {
        const applicationId = readPragmaNumber(database, "application_id");
        const storeUserVersion = readPragmaNumber(database, "user_version");
        const applicationIdClassification = classifyApplicationId(applicationId);

        if (applicationIdClassification !== "ok") {
          database.close();
          return failure(
            applicationIdClassification,
            "The selected SQLite file is not a Continuity Loom project store."
          );
        }

        if (metadata.schemaMinVersion !== storeUserVersion) {
          database.close();
          return failure(
            "invalid-metadata",
            "The project metadata schema version does not match the SQLite store version."
          );
        }

        const compatibility = evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, storeUserVersion);

        if (compatibility !== "ok") {
          database.close();
          return failure(
            compatibility,
            compatibility === "incompatible-version"
              ? "The project store was created by a newer schema version."
              : "The project store requires a migration before it can be opened."
          );
        }

        closeActive();
        ensureRecordTables(database);
        backfillDisplayLabels(database);
        migrateGlobalConfigRecords(database);
        repairWorkingSetReferences(database);
        active = {
          folderPath,
          metadata,
          database,
          recordRepository: new RecordRepository(database),
          storeUserVersion
        };

        return { ok: true, status: statusFromActive(active) };
      } catch {
        database.close();
        return failure("invalid-sqlite", "The project store is not a readable SQLite database.");
      }
    },

    getActiveProjectStatus() {
      return active ? statusFromActive(active) : { open: false };
    },

    getRecordRepository() {
      return active?.recordRepository ?? null;
    },

    closeProject() {
      closeActive();
      return Promise.resolve({ open: false } as const);
    },

    async createBackup() {
      if (!active) {
        throw new Error("No project is open.");
      }

      const backupsPath = join(active.folderPath, "backups");
      await mkdir(backupsPath, { recursive: true });

      const backupPath = join(backupsPath, `loom-backup-${timestampForFilename()}.sqlite`);
      active.database.exec(`VACUUM INTO ${sqliteStringLiteral(backupPath)}`);

      return { backupPath };
    }
  };
}
