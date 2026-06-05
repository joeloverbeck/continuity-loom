import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createProjectStoreManager,
  type CreateProjectInput,
  type ProjectStoreManager
} from "./project-store.js";

const keyPattern = /openRouterApiKey|OPENROUTER_API_KEY|apiKey/;
const managers: ProjectStoreManager[] = [];

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-project-secret-"));
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("project storage secret boundary", () => {
  it("rejects API-key-shaped fields and does not write them to project files", async () => {
    const parentPath = await tempParent();
    const storeManager = manager();

    await expect(
      storeManager.createProject({
        parentPath,
        folderName: "rejected",
        title: "Rejected",
        openRouterApiKey: "sk-secret"
      } as unknown as CreateProjectInput)
    ).rejects.toThrow();

    const status = await storeManager.createProject({
      parentPath,
      folderName: "accepted",
      title: "Accepted"
    });

    const metadataText = await readFile(
      join(status.folderPath, "continuity-loom.project.json"),
      "utf8"
    );
    const storeBytes = await readFile(join(status.folderPath, "loom.sqlite"));

    expect(metadataText).not.toMatch(keyPattern);
    expect(storeBytes.toString("utf8")).not.toMatch(keyPattern);
  });
});
