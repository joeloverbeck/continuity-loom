import { z } from "zod";

// Changing this value would make existing project stores look foreign to the app.
export const LOOM_APPLICATION_ID = 0x4c4f4f4d;
export const LOOM_SCHEMA_VERSION = 1;

export const projectMetadataSchema = z
  .object({
    title: z.string().trim().min(1),
    projectUuid: z.uuid(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    schemaMinVersion: z.int(),
    databaseFilename: z.string().min(1),
    description: z.string().optional(),
    isDemoFixture: z.boolean().optional()
  })
  .strict();

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;

export type StoreCompatibility = "ok" | "incompatible-version" | "migration-required";

export type OpenFailureKind =
  | "missing-metadata"
  | "invalid-metadata"
  | "not-a-loom-store"
  | "incompatible-version"
  | "migration-required"
  | "invalid-sqlite"
  | "unreadable";

export type CreateFailureKind =
  | "parent-not-absolute"
  | "parent-inside-app"
  | "parent-missing"
  | "folder-exists"
  | "unwritable";

export interface ProjectStatus {
  folderPath: string;
  title: string;
  projectUuid: string;
  databaseFilename: string;
  isDemoFixture?: boolean;
  appSchemaVersion: number;
  storeUserVersion: number;
  compatibility: StoreCompatibility;
}

export type OpenProjectResult =
  | { ok: true; status: ProjectStatus }
  | { ok: false; kind: OpenFailureKind; message: string };

export function evaluateStoreCompatibility(
  appSchemaVersion: number,
  storeUserVersion: number
): StoreCompatibility {
  if (storeUserVersion > appSchemaVersion) {
    return "incompatible-version";
  }

  if (storeUserVersion < appSchemaVersion) {
    return "migration-required";
  }

  return "ok";
}

export function classifyApplicationId(storeApplicationId: number): "ok" | "not-a-loom-store" {
  return storeApplicationId === LOOM_APPLICATION_ID ? "ok" : "not-a-loom-store";
}
