import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  PLACEHOLDER_MAP,
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecordIds,
  demoRecords,
  demoStoryConfig,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";

const acceptedProseCanary = "CAPSTONE_ACCEPTED_PROSE_CANARY_DO_NOT_PROMPT";
const rejectedCandidateCanary = "CAPSTONE_REJECTED_CANDIDATE_CANARY_DO_NOT_PROMPT";
const supersededCandidateCanary = "CAPSTONE_SUPERSEDED_CANDIDATE_CANARY_DO_NOT_PROMPT";
const derivedSummaryCanary = "CAPSTONE_DERIVED_SUMMARY_CANARY_DO_NOT_PROMPT";

const authorOnlyCanaries = {
  fallbackStep: "CAPSTONE_AUTHOR_ONLY_PLAN_FALLBACK_DO_NOT_PROMPT",
  tickHistoryThreshold: "CAPSTONE_AUTHOR_ONLY_TICK_THRESHOLD_DO_NOT_PROMPT",
  tickHistoryCause: "CAPSTONE_AUTHOR_ONLY_TICK_CAUSE_DO_NOT_PROMPT",
  tickHistoryResult: "CAPSTONE_AUTHOR_ONLY_TICK_RESULT_DO_NOT_PROMPT",
  sequenceOrder: "CAPSTONE_AUTHOR_ONLY_SEQUENCE_ORDER_DO_NOT_PROMPT",
  threadAnswer: "CAPSTONE_AUTHOR_ONLY_THREAD_ANSWER_DO_NOT_PROMPT",
  relationshipAxis: "power_imbalance",
  relationshipValue: "extreme",
  relationshipValence: "adversarial"
} as const;

describe("schema-audit cleanup capstone", () => {
  it("compiles prose and ideation prompts deterministically from the composed cleanup fixture", () => {
    const snapshot = buildValidationSnapshot(cleanInput());
    const firstProse = compilePrompt(snapshot);
    const secondProse = compilePrompt(snapshot);
    const firstIdeation = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
    });
    const secondIdeation = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
    });

    expect(secondProse.prompt).toBe(firstProse.prompt);
    expect(secondProse.metadata.fingerprint).toBe(firstProse.metadata.fingerprint);
    expect(secondIdeation.prompt).toBe(firstIdeation.prompt);
    expect(secondIdeation.metadata.fingerprint).toBe(firstIdeation.metadata.fingerprint);
  });

  it("keeps accepted, candidate, superseded, and derived prose canaries out of compiled prompts", () => {
    const input = cleanInput();
    const contaminationCanaries = [
      acceptedProseCanary,
      rejectedCandidateCanary,
      supersededCandidateCanary,
      derivedSummaryCanary
    ];

    for (const field of [
      "recent_causal_context",
      "last_visible_moment",
      "begin_after"
    ] as const) {
      const contaminated = structuredClone(input);
      contaminated.generationSession.immediate_handoff![field] =
        `Rejected candidate copied from accepted prose: ${contaminationCanaries.join(" ")}`;

      const result = runValidation(buildValidationSnapshot(contaminated));

      expect(result.blockers.map((diagnostic) => diagnostic.code)).toContain(
        DIAGNOSTIC_CODES.promptFacingProseContamination
      );
    }

    const snapshot = buildValidationSnapshot(input);
    const prompts = [
      compilePrompt(snapshot).prompt,
      compilePrompt(snapshot, {
        promptKind: "ideation",
        ideationRequest: { mode: "questions", count: 4, dormantSlot: true }
      }).prompt
    ];

    expect(contaminationCanaries.length).toBe(4);
    for (const prompt of prompts) {
      for (const canary of contaminationCanaries) {
        expect(prompt).not.toContain(canary);
      }
    }
  });

  it("does not leak author-only cleanup audit fields into prose or ideation prompts", () => {
    const input = inputWithAuthorOnlyCanaries();
    const snapshot = buildValidationSnapshot(input);
    const prompts = [
      compilePrompt(snapshot).prompt,
      compilePrompt(snapshot, {
        promptKind: "ideation",
        ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
      }).prompt
    ];
    const canaries = Object.values(authorOnlyCanaries);

    expect(canaries.length).toBe(Object.keys(authorOnlyCanaries).length);
    for (const prompt of prompts) {
      for (const canary of canaries) {
        expect(prompt).not.toContain(canary);
      }
    }
  });

  it("keeps removed schema fields and the removed voice-pressure lane absent from compiler surfaces", () => {
    const input = inputWithAuthorOnlyCanaries();
    const snapshot = buildValidationSnapshot(input);
    const prompts = [
      compilePrompt(snapshot).prompt,
      compilePrompt(snapshot, {
        promptKind: "ideation",
        ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
      }).prompt
    ];
    const removedIdentifiers = [
      "continuity_philosophy",
      "manual_directive_id",
      "current_cast_voice_pressure[].local_function",
      "cast_voice_overrides[].scope",
      "{voice_pressure}"
    ];

    expect(Object.hasOwn(PLACEHOLDER_MAP, "voice_pressure")).toBe(false);
    expect(input.generationSession.current_cast_voice_pressure).toHaveLength(
      demoGenerationSession.current_cast_voice_pressure.length
    );
    for (const prompt of prompts) {
      for (const removed of removedIdentifiers) {
        expect(prompt).not.toContain(removed);
      }
    }
  });
});

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: demoRecords.map((record): ValidationRecord => ({
      id: record.id,
      type: record.type,
      payload: structuredClone(record.payload),
      metadata: {
        id: record.id,
        type: record.type,
        displayLabel: record.displayLabel,
        createdAt: "2026-06-20T00:00:00.000Z",
        updatedAt: "2026-06-20T00:00:00.000Z",
        archived: false
      },
      ...(record.id === demoRecordIds.elinCast
        ? { castBand: "active_onstage_cast_full" as const, localFunction: "pov_narrator" }
        : {}),
      ...(record.id === demoRecordIds.nikoCast
        ? { castBand: "active_onstage_cast_full" as const, localFunction: "active_speaker" }
        : {})
    })),
    generationSession: structuredClone(demoGenerationSession),
    storyConfig: structuredClone(demoStoryConfig),
    versions: { template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" }
  };
}

function inputWithAuthorOnlyCanaries(): BuildValidationSnapshotInput {
  const input = cleanInput();
  const records = [
    ...input.records,
    record("019b0298-5c00-7000-8000-077000000001", "PLAN", "Canary fallback plan", {
      id: "019b0298-5c00-7000-8000-077000000001",
      plan_status: "active",
      holder: demoRecordIds.elinEntity,
      objective: "Keep the letter safe until Orin's route is known.",
      resources: ["locked cellar door"],
      blockers: ["Niko is watching the bin"],
      current_step: "Listen at the stair before moving the flour bin.",
      fallback_steps: [authorOnlyCanaries.fallbackStep],
      visibility_to_pov: "known",
      salience: "high",
      can_drive_prose: true
    })
  ];
  const event = mustFind(records, demoRecordIds.marketBell);
  const clock = mustFind(records, demoRecordIds.bellClock);
  const thread = mustFind(records, demoRecordIds.missingLedgerThread);
  const relationship = mustFind(records, demoRecordIds.elinNikoTrust);

  Object.assign(event.payload as Record<string, unknown>, {
    sequence_order: authorOnlyCanaries.sequenceOrder
  });
  Object.assign(clock.payload as Record<string, unknown>, {
    tick_history: [
      {
        threshold: authorOnlyCanaries.tickHistoryThreshold,
        cause: authorOnlyCanaries.tickHistoryCause,
        result: authorOnlyCanaries.tickHistoryResult
      }
    ]
  });
  Object.assign(thread.payload as Record<string, unknown>, {
    answer_if_known: authorOnlyCanaries.threadAnswer
  });
  Object.assign(relationship.payload as Record<string, unknown>, {
    axis: authorOnlyCanaries.relationshipAxis,
    value: authorOnlyCanaries.relationshipValue,
    valence: authorOnlyCanaries.relationshipValence
  });

  const activeWorkingSet = input.generationSession.active_working_set;
  if (!activeWorkingSet) {
    throw new Error("Demo fixture must include an active working set for capstone coverage");
  }

  input.records = records;
  activeWorkingSet.selected_records = [
    ...activeWorkingSet.selected_records,
    "019b0298-5c00-7000-8000-077000000001"
  ];

  return input;
}

function record(id: string, type: ValidationRecord["type"], displayLabel: string, payload: unknown): ValidationRecord {
  return {
    id,
    type,
    payload,
    metadata: {
      id,
      type,
      displayLabel,
      createdAt: "2026-06-20T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
      archived: false
    }
  };
}

function mustFind(records: ValidationRecord[], id: string): ValidationRecord {
  const record = records.find((candidate) => candidate.id === id);

  if (!record) {
    throw new Error(`Missing fixture record ${id}`);
  }

  return record;
}
