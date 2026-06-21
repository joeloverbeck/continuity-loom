import fc from "fast-check";

import type {
  BuildValidationSnapshotInput,
  ValidationRecord
} from "../../../src/index.js";

export type EmptyCategoryId = "hard_canon" | "present_minor_cast" | "offstage_relevance";

export const emptyCategoryArbitrary: fc.Arbitrary<EmptyCategoryId> = fc.constantFrom(
  "hard_canon",
  "present_minor_cast",
  "offstage_relevance"
);

const hardCanonFactId = "019b0298-5c00-7000-8000-000000000701";
const presentMinorCastId = "019b0298-5c00-7000-8000-000000000702";
const offstageCastId = "019b0298-5c00-7000-8000-000000000703";
const castEntityId = "019b0298-5c00-7000-8000-000000000704";

export function emptyPromptInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}

export function inputWithOneCategoryRecord(category: EmptyCategoryId): BuildValidationSnapshotInput {
  const input = emptyPromptInput();

  if (category === "hard_canon") {
    return {
      ...input,
      records: [hardCanonFact()]
    };
  }

  if (category === "present_minor_cast") {
    return {
      ...input,
      records: [compressedCast(presentMinorCastId, "present_minor_cast_compressed", "Jon watches from the stair.")]
    };
  }

  return {
    ...input,
    records: [compressedCast(offstageCastId, "offstage_relevant_cast", "The guard may return soon.")]
  };
}

function hardCanonFact(): ValidationRecord {
  return {
    id: hardCanonFactId,
    type: "FACT",
    metadata: metadata(hardCanonFactId, "Archive key"),
    payload: {
      fact_kind: "hard_canon",
      statement: "The archive key is unique.",
      known_by: "public"
    }
  };
}

function compressedCast(
  id: string,
  castBand: "present_minor_cast_compressed" | "offstage_relevant_cast",
  oneLine: string
): ValidationRecord {
  return {
    id,
    type: "CAST MEMBER",
    castBand,
    metadata: metadata(id, oneLine),
    payload: {
      entity_id: castEntityId,
      identity: {
        one_line: oneLine
      },
      voice_anchor: {
        core_voice: "Plainspoken and wary."
      }
    }
  };
}

function metadata(id: string, displayLabel: string): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    archived: false
  };
}
