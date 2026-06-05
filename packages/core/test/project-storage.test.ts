import { describe, expect, it } from "vitest";

import {
  classifyApplicationId,
  evaluateStoreCompatibility,
  LOOM_APPLICATION_ID,
  projectMetadataSchema
} from "../src/project-storage.js";

const validMetadata = {
  title: "My Project",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  createdAt: "2026-06-05T10:30:00.000Z",
  updatedAt: "2026-06-05T10:30:00.000Z",
  schemaMinVersion: 1,
  databaseFilename: "loom.sqlite"
};

describe("projectMetadataSchema", () => {
  it("accepts the Phase 2 project metadata shape", () => {
    expect(
      projectMetadataSchema.parse({
        ...validMetadata,
        description: "Draft continuity workspace",
        isDemoFixture: false
      })
    ).toEqual({
      ...validMetadata,
      description: "Draft continuity workspace",
      isDemoFixture: false
    });
  });

  it("rejects API-key-shaped extra fields", () => {
    expect(() =>
      projectMetadataSchema.parse({
        ...validMetadata,
        openRouterApiKey: "sk-secret"
      })
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    const missingTitle: Record<string, unknown> = { ...validMetadata };
    delete missingTitle.title;

    expect(() => projectMetadataSchema.parse(missingTitle)).toThrow();
  });
});

describe("evaluateStoreCompatibility", () => {
  it("returns ok for matching app and store schema versions", () => {
    expect(evaluateStoreCompatibility(1, 1)).toBe("ok");
  });

  it("requires migration when the store is older than the app", () => {
    expect(evaluateStoreCompatibility(2, 1)).toBe("migration-required");
  });

  it("marks the store incompatible when it is newer than the app", () => {
    expect(evaluateStoreCompatibility(1, 2)).toBe("incompatible-version");
  });
});

describe("classifyApplicationId", () => {
  it("accepts only the Continuity Loom application id", () => {
    expect(classifyApplicationId(LOOM_APPLICATION_ID)).toBe("ok");
    expect(classifyApplicationId(0)).toBe("not-a-loom-store");
    expect(classifyApplicationId(123)).toBe("not-a-loom-store");
  });
});
