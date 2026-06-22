import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  compilePrompt,
  immediateHandoffSchema,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { proseSnapshotInput } from "./support/arbitraries/prose-snapshots.js";
import { describe, expect, it } from "vitest";

const canaries = {
  accepted: "P1_ACCEPTED_PROSE_CANARY_DO_NOT_PROMPT",
  rejected: "P1_REJECTED_CANDIDATE_CANARY_DO_NOT_PROMPT",
  superseded: "P1_SUPERSEDED_CANDIDATE_CANARY_DO_NOT_PROMPT",
  derived: "P1_AUTO_DERIVED_SUMMARY_CANARY_DO_NOT_PROMPT",
  note: "P1_AUTHOR_PRIVATE_NOTE_CANARY_DO_NOT_PROMPT",
  prepNote: "P1_SCENE_PREP_NOTE_CANARY_DO_NOT_PROMPT",
  clip: "P1_STORY_NOTE_CLIP_CANARY_DO_NOT_PROMPT",
  clipSourceTitle: "P1_STORY_NOTE_CLIP_SOURCE_TITLE_CANARY_DO_NOT_PROMPT",
  clipTimestamp: "2026-06-22T00:00:00.000Z_P1_STORY_NOTE_CLIP_TIMESTAMP_CANARY"
} as const;

const promptFacingHandoffFields = [
  "recent_causal_context",
  "last_visible_moment",
  "begin_after"
] as const;

describe("compiler context firewall", () => {
  it("keeps accepted, rejected, superseded, derived, and note canaries outside prose prompts at the snapshot boundary", () => {
    const input = proseSnapshotInput("material") as BuildValidationSnapshotInput & {
      acceptedSegments?: readonly string[];
      rejectedCandidates?: readonly string[];
      supersededCandidates?: readonly string[];
      automaticProseSummaries?: readonly string[];
      storyNotes?: readonly { title: string; body: string }[];
      storyNoteClips?: readonly {
        content: string;
        sourceTitleSnapshot: string;
        sourceUpdatedAtAtCapture: string;
      }[];
    };
    input.acceptedSegments = [canaries.accepted];
    input.rejectedCandidates = [canaries.rejected];
    input.supersededCandidates = [canaries.superseded];
    input.automaticProseSummaries = [canaries.derived];
    input.storyNotes = [
      { title: "Private note", body: canaries.note },
      { title: "Scene prep", body: canaries.prepNote }
    ];
    input.storyNoteClips = [
      {
        content: canaries.clip,
        sourceTitleSnapshot: canaries.clipSourceTitle,
        sourceUpdatedAtAtCapture: canaries.clipTimestamp
      }
    ];

    const prompt = compilePrompt(buildValidationSnapshot(input)).prompt;

    for (const canary of Object.values(canaries)) {
      expect(prompt).not.toContain(canary);
    }
  });

  it.each(promptFacingHandoffFields)("blocks prose-contamination canaries in prompt-facing handoff field %s", (field) => {
    const input = proseSnapshotInput("material");
    input.generationSession.immediate_handoff![field] =
      `Rejected candidate copied from accepted prose: ${canaries.accepted} ${canaries.rejected} ${canaries.superseded} ${canaries.derived}`;

    const result = runValidation(buildValidationSnapshot(input));

    expect(result.isBlocked).toBe(true);
    expect(result.blockers.map((diagnostic) => diagnostic.code)).toContain(
      DIAGNOSTIC_CODES.promptFacingProseContamination
    );
  });

  it("keeps automatic summaries and author-private notes out of the handoff schema", () => {
    const handoff = proseSnapshotInput("minimal").generationSession.immediate_handoff!;

    expect(() =>
      immediateHandoffSchema.parse({
        ...handoff,
        automatic_prose_summary: canaries.derived,
        author_private_note: canaries.note
      })
    ).toThrow();
  });
});
