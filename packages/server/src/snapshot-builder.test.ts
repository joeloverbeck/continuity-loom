import {
  DIAGNOSTIC_CODES,
  runValidation,
  type GenerationSession
} from "@loom/core";
import { describe, expect, it } from "vitest";

import type { ProjectStoreManager } from "./project-store.js";
import type { RecordRepositoryRecord } from "./record-repository.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

function managerFor(input: {
  generationSession?: Partial<GenerationSession>;
  acceptedSegmentCount?: number;
  records?: readonly RecordRepositoryRecord[];
}): ProjectStoreManager {
  return {
    getRecordRepository: () => ({
      getGenerationSession: () =>
        input.generationSession
          ? { ok: true as const, payload: input.generationSession }
          : { ok: false as const, kind: "not-found" as const, message: "Generation session not found." },
      listAcceptedSegments: (options?: { projection?: "full" | "count" }) => {
        if (options?.projection === "count") {
          return input.acceptedSegmentCount ?? 0;
        }
        throw new Error("Snapshot lifecycle derivation must not materialize accepted prose.");
      },
      getStoryConfig: () => ({ ok: false as const }),
      getRecord: (id: string) => {
        const record = (input.records ?? []).find((item) => item.id === id && !item.archived);

        return record
          ? { ok: true as const, record }
          : { ok: false as const, kind: "not-found" as const, message: `Record not found: ${id}`, id };
      },
      listRecords: (options?: { includeArchived?: boolean }) =>
        (input.records ?? [])
          .filter((record) => options?.includeArchived || !record.archived)
          .map((record) => ({ ok: true as const, record }))
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

  it("preserves an explicit generation context that matches the archive requirement", () => {
    expect(
      contextFor({
        generationSession: {
          generation_validation_focus: {
            validation_focus_tags: {
              generation_context: ["first_segment"]
            }
          }
        },
        acceptedSegmentCount: 0
      })
    ).toEqual(["first_segment"]);
  });

  it("reports contradictory saved context while evaluating the archive-required context", () => {
    const result = buildSnapshotFromOpenProject(
      managerFor({
        generationSession: {
          generation_validation_focus: {
            validation_focus_tags: {
              generation_context: ["first_segment"]
            }
          }
        },
        acceptedSegmentCount: 3
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const snapshot = result.snapshot as typeof result.snapshot & {
      generationContext: {
        savedValue: "first_segment" | "continuation_after_accepted_segment" | null;
        requiredValue: "first_segment" | "continuation_after_accepted_segment";
        acceptedSegmentCount: number;
        coherent: boolean;
      };
    };
    const validation = runValidation(snapshot);

    expect(snapshot.generationContext).toEqual({
      savedValue: "first_segment",
      requiredValue: "continuation_after_accepted_segment",
      acceptedSegmentCount: 3,
      coherent: false
    });
    expect(snapshot.generationSession.generation_validation_focus?.validation_focus_tags.generation_context).toEqual([
      "continuation_after_accepted_segment"
    ]);
    expect(validation.blockers.map((diagnostic) => diagnostic.code)).toContain(
      DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch
    );
    expect(validation.blockers.find(
      (diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch
    )?.message).toBe(
      "Generation context is saved as First segment, but the accepted-segment archive contains 3 accepted segments and requires Continuation after accepted segment. Choose Continuation after accepted segment in Generation Brief and save the draft."
    );
    expect(validation.blockers.find(
      (diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch
    )?.repairInstruction).toBe(
      "Choose Continuation after accepted segment in Generation Brief and save the draft."
    );
    expect(validation.blockers.map((diagnostic) => diagnostic.code)).toContain(
      DIAGNOSTIC_CODES.missingImmediateHandoff
    );
    expect([...validation.blockers, ...validation.warnings].map((diagnostic) => diagnostic.code)).not.toContain(
      DIAGNOSTIC_CODES.focusTagCountInvalid
    );
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

  it("populates the project record index with non-archived project records only", () => {
    const selectedId = "019b0298-5c00-7000-8000-000000000101";
    const unselectedId = "019b0298-5c00-7000-8000-000000000102";
    const archivedId = "019b0298-5c00-7000-8000-000000000103";
    const result = buildSnapshotFromOpenProject(
      managerFor({
        generationSession: {
          active_working_set: {
            selected_records: [selectedId],
            active_onstage_cast_full: [],
            present_minor_cast_compressed: [],
            offstage_relevant_cast: []
          }
        },
        records: [
          record(selectedId, "CAST MEMBER", false),
          record(unselectedId, "LOCATION", false),
          record(archivedId, "ENTITY", true)
        ]
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.snapshot.records.map((item) => item.id)).toEqual([selectedId]);
    expect(result.snapshot.projectRecordIndex).toEqual({
      [selectedId]: "CAST MEMBER",
      [unselectedId]: "LOCATION"
    });
  });

  it("fails closed with every dangling selected record id in the malformed-source body", () => {
    const selectedId = "019b0298-5c00-7000-8000-000000000111";
    const missingA = "019b0298-5c00-7000-8000-000000000112";
    const missingB = "019b0298-5c00-7000-8000-000000000113";
    const result = buildSnapshotFromOpenProject(
      managerFor({
        generationSession: {
          active_working_set: {
            selected_records: [selectedId, missingA, missingB],
            active_onstage_cast_full: [],
            present_minor_cast_compressed: [],
            offstage_relevant_cast: []
          }
        },
        records: [record(selectedId, "CAST MEMBER", false)]
      })
    );

    expect(result).toMatchObject({
      ok: false,
      status: 422,
      body: {
        ok: false,
        kind: "malformed-validation-source",
        danglingSelectedRecordIds: [missingA, missingB],
        suggestedAction: "Remove these ids from the active working set."
      }
    });
    expect(JSON.stringify(result)).toContain(missingA);
    expect(JSON.stringify(result)).toContain(missingB);
    expect(JSON.stringify(result)).toContain("Remove these ids from the active working set.");
  });
});

function record(id: string, type: string, archived: boolean): RecordRepositoryRecord {
  return {
    id,
    type,
    displayLabel: id,
    status: "active",
    salience: null,
    urgency: null,
    archived,
    userOrder: null,
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    payload: {}
  };
}
