import {
  classifyApplicationId,
  evaluateStoreCompatibility,
  LOOM_APPLICATION_ID,
  LOOM_SCHEMA_VERSION,
  projectMetadataSchema,
  type OpenProjectResult,
  type ProjectMetadata,
  type ProjectStatus
} from "@loom/core";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";
import { z } from "zod";

const METADATA_FILENAME = "continuity-loom.project.json";
const DATABASE_FILENAME = "loom.sqlite";

const createProjectInputSchema = z
  .object({
    parentPath: z.string().min(1),
    folderName: z.string().min(1),
    title: z.string().trim().min(1),
    description: z.string().optional()
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export type ProjectOpenState = ProjectStatus | { open: false };

export interface ProjectStoreManager {
  createProject(input: CreateProjectInput): Promise<ProjectStatus>;
  openProject(folderPath: string): Promise<OpenProjectResult>;
  getActiveProjectStatus(): ProjectOpenState;
  closeProject(): Promise<{ open: false }>;
  createBackup(): Promise<{ backupPath: string }>;
}

interface ActiveProject {
  folderPath: string;
  metadata: ProjectMetadata;
  database: DatabaseSync;
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
    appSchemaVersion: LOOM_SCHEMA_VERSION,
    storeUserVersion: active.storeUserVersion,
    compatibility: evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, active.storeUserVersion)
  };
}

function sqliteStringLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function timestampForFilename(date = new Date()): string {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

export function createProjectStoreManager(): ProjectStoreManager {
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
      const folderPath = resolve(parsed.parentPath, parsed.folderName);
      const now = new Date().toISOString();
      const metadata = projectMetadataSchema.parse({
        title: parsed.title,
        projectUuid: randomUUID(),
        createdAt: now,
        updatedAt: now,
        schemaMinVersion: LOOM_SCHEMA_VERSION,
        databaseFilename: DATABASE_FILENAME,
        ...(parsed.description ? { description: parsed.description } : {})
      });

      await mkdir(folderPath);
      await writeFile(metadataPath(folderPath), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

      const database = new DatabaseSync(databasePath(folderPath, metadata));

      try {
        configureDatabase(database);
        closeActive();
        active = {
          folderPath,
          metadata,
          database,
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
      const metadataJson = await readFile(metadataPath(folderPath), "utf8");
      const metadata = projectMetadataSchema.parse(JSON.parse(metadataJson));
      const database = new DatabaseSync(databasePath(folderPath, metadata));

      try {
        const applicationId = readPragmaNumber(database, "application_id");
        const storeUserVersion = readPragmaNumber(database, "user_version");
        const applicationIdClassification = classifyApplicationId(applicationId);

        if (applicationIdClassification !== "ok") {
          database.close();
          return {
            ok: false,
            kind: applicationIdClassification,
            message: "The selected SQLite file is not a Continuity Loom project store."
          };
        }

        const compatibility = evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, storeUserVersion);

        if (compatibility !== "ok") {
          database.close();
          return {
            ok: false,
            kind: compatibility,
            message:
              compatibility === "incompatible-version"
                ? "The project store was created by a newer schema version."
                : "The project store requires a migration before it can be opened."
          };
        }

        closeActive();
        active = {
          folderPath,
          metadata,
          database,
          storeUserVersion
        };

        return { ok: true, status: statusFromActive(active) };
      } catch (error) {
        database.close();
        throw error;
      }
    },

    getActiveProjectStatus() {
      return active ? statusFromActive(active) : { open: false };
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
