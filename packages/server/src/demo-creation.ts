import {
  LETTER_UNDER_FLOUR_BIN_TITLE,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  type ProjectStatus
} from "@loom/core";
import { rm } from "node:fs/promises";

import {
  ProjectCreateError,
  type ProjectStoreManager
} from "./project-store.js";
import type { StoryConfigKind } from "./record-repository.js";

const DEMO_STORY_CONFIGS = [
  ["STORY CONTRACT", demoStoryConfig.storyContract],
  ["UNIVERSAL CONTENT POLICY", demoStoryConfig.universalContentPolicy],
  ["PROSE MODE", demoStoryConfig.proseMode]
] as const satisfies readonly (readonly [StoryConfigKind, unknown])[];

export interface CreateDemoProjectInput {
  parentPath: string;
  folderName: string;
}

export async function createDemoProject(
  manager: ProjectStoreManager,
  input: CreateDemoProjectInput
): Promise<ProjectStatus> {
  const status = await manager.createProject({
    parentPath: input.parentPath,
    folderName: input.folderName,
    title: LETTER_UNDER_FLOUR_BIN_TITLE,
    isDemoFixture: true
  });

  try {
    const repository = manager.getRecordRepository();
    if (!repository) {
      throw new Error("Demo project was created without an active record repository.");
    }

    const idMap = new Map<string, string>();

    for (const [index, record] of demoRecords.entries()) {
      const created = repository.createRecord({
        type: record.type,
        displayLabel: record.displayLabel,
        payload: record.payload,
        userOrder: index
      });
      idMap.set(record.id, created.id);
    }

    for (const [kind, payload] of DEMO_STORY_CONFIGS) {
      repository.setStoryConfig(kind, payload);
    }

    repository.setGenerationSession(remapDemoIds(demoGenerationSession, idMap));
    return status;
  } catch (error) {
    await manager.closeProject();
    await rm(status.folderPath, { force: true, recursive: true });

    if (error instanceof ProjectCreateError) {
      throw error;
    }

    throw new ProjectCreateError(
      "unwritable",
      "The demo project was created but could not be populated."
    );
  }
}

function remapDemoIds(value: unknown, idMap: ReadonlyMap<string, string>): unknown {
  if (typeof value === "string") {
    return idMap.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapDemoIds(item, idMap));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, remapDemoIds(item, idMap)])
    );
  }

  return value;
}
