import {
  DIAGNOSTIC_CODES,
  runValidation,
  type GenerationSession
} from "@loom/core";
import { describe, expect, it } from "vitest";

import type { ProjectStoreManager } from "./project-store.js";
import type { AcceptedSegment } from "./record-repository.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

function managerFor(input: {
  generationSession?: Partial<GenerationSession>;
  acceptedSegmentCount?: number;
}): ProjectStoreManager {
  const acceptedSegments = Array.from({ length: input.acceptedSegmentCount ?? 0 }, (_, index) => ({
    id: index + 1,
    sequence: index + 1,
    text: `Accepted prose ${index + 1}`,
    metadata: {},
    createdAt: "2026-06-07T00:00:00.000Z"
  })) satisfies AcceptedSegment[];

  return {
    getRecordRepository: () => ({
      getGenerationSession: () =>
        input.generationSession
          ? { ok: true as const, payload: input.generationSession }
          : { ok: false as const, kind: "not-found" as const, message: "Generation session not found." },
      listAcceptedSegments: () => acceptedSegments,
      getStoryConfig: () => ({ ok: false as const }),
      getRecord: () => ({ ok: false as const, message: "Record not found." })
    }),
    createProject: async () => {
      throw new Error("not implemented");
    },
    openProject: async () => {
      throw new Error("not implemented");
    },
    closeProject: async () => {},
    getProjectStatus: () => ({ state: "none" as const }),
    getOpenProjectMetadata: () => null,
    getDatabasePath: () => null
  } as ProjectStoreManager;
}

function contextFor(input: {
  generationSession?: Partial<GenerationSession>;
  acceptedSegmentCount?: number;
}) {
  const result = buildSnapshotFromOpenProject(managerFor(input));
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected snapshot build to succeed.");
  }

  return result.snapshot.generationSession.generation_validation_focus?.validation_focus_tags.generation_context;
}

function focusTagsFor(input: {
  generationSession?: Partial<GenerationSession>;
  acceptedSegmentCount?: number;
}) {
  const result = buildSnapshotFromOpenProject(managerFor(input));
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected snapshot build to succeed.");
  }

  return result.snapshot.generationSession.generation_validation_focus?.validation_focus_tags;
}

describe("buildSnapshotFromOpenProject generation context defaults", () => {
  it("defaults missing generation context to first_segment with zero accepted segments", () => {
    expect(contextFor({ generationSession: {}, acceptedSegmentCount: 0 })).toEqual(["first_segment"]);
  });

  it("defaults partial validation focus without nested tags", () => {
    expect(
      focusTagsFor({
        generationSession: {
          generation_validation_focus: {}
        } as Partial<GenerationSession>,
        acceptedSegmentCount: 0
      })
    ).toEqual({
      generation_context: ["first_segment"],
      expected_local_modes: [],
      possible_durable_changes: []
    });
  });

  it("defaults partial validation tags without generation context", () => {
    expect(
      focusTagsFor({
        generationSession: {
          generation_validation_focus: {
            validation_focus_tags: {
              expected_local_modes: ["dialogue_expected"]
            }
          }
        } as Partial<GenerationSession>,
        acceptedSegmentCount: 2
      })
    ).toEqual({
      generation_context: ["continuation_after_accepted_segment"],
      expected_local_modes: ["dialogue_expected"],
      possible_durable_changes: []
    });
  });

  it("defaults missing generation context to continuation when accepted segments exist", () => {
    expect(contextFor({ generationSession: {}, acceptedSegmentCount: 2 })).toEqual([
      "continuation_after_accepted_segment"
    ]);
  });

  it("preserves an explicit valid generation context", () => {
    expect(
      contextFor({
        generationSession: {
          generation_validation_focus: {
            validation_focus_tags: {
              generation_context: ["first_segment"]
            }
          }
        },
        acceptedSegmentCount: 3
      })
    ).toEqual(["first_segment"]);
  });

  it("does not raise focus-tag-count-invalid after defaulting context", () => {
    const result = buildSnapshotFromOpenProject(managerFor({ generationSession: {}, acceptedSegmentCount: 0 }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const validation = runValidation(result.snapshot);
    expect([...validation.blockers, ...validation.warnings].map((diagnostic) => diagnostic.code)).not.toContain(
      DIAGNOSTIC_CODES.focusTagCountInvalid
    );
  });
});
