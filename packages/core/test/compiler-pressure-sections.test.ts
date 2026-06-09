import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { describe, expect, it } from "vitest";

const intentionId = "019b0298-5c00-7000-8000-000000000101";
const planId = "019b0298-5c00-7000-8000-000000000102";
const clockId = "019b0298-5c00-7000-8000-000000000103";
const obligationId = "019b0298-5c00-7000-8000-000000000104";
const consequenceId = "019b0298-5c00-7000-8000-000000000105";
const threadId = "019b0298-5c00-7000-8000-000000000106";
const relationshipId = "019b0298-5c00-7000-8000-000000000107";
const emotionId = "019b0298-5c00-7000-8000-000000000108";
const locationId = "019b0298-5c00-7000-8000-000000000109";
const affordanceId = "019b0298-5c00-7000-8000-000000000110";
const holderAId = "019b0298-5c00-7000-8000-000000000201";
const holderBId = "019b0298-5c00-7000-8000-000000000202";
const causeFactId = "019b0298-5c00-7000-8000-000000000203";
const absentReferenceId = "019b0298-5c00-7000-8000-000000000999";
const longObligationTerms =
  "Do not abandon the apprentice while the archive stair is flooding and every witness expects a public explanation before the bell stops.";
const longConsequenceEffect =
  "The office is under inspection by a hostile clerk who keeps asking exactly which ledger moved and why the seal looks warmed.";
const longPlanObjective =
  "Get the ledger out of the archive by sending the guard toward the rain door before the apprentice notices the missing seal.";

function pressureRecords(): ValidationRecord[] {
  return [
    {
      id: planId,
      type: "PLAN",
      metadata: metadata(planId, "Plan B", { userOrder: 2, salience: "critical" }),
      payload: {
        plan_status: "active",
        holder: holderAId,
        objective: "Get the ledger out of the archive.",
        current_step: "Distract the guard at the side door.",
        resources: ["lamp", "rain noise"],
        blockers: ["guard is suspicious"],
        visibility_to_pov: "visible"
      }
    },
    {
      id: clockId,
      type: "CLOCK",
      metadata: metadata(clockId, "Clock A", { userOrder: 1, salience: "low" }),
      payload: {
        status: "active",
        title: "Guard return",
        current_pressure: "The guard is due back soon.",
        tick_trigger: "A shouted warning.",
        next_threshold: "Guard reaches the landing.",
        possible_effects: ["escape route closes"]
      }
    },
    {
      id: intentionId,
      type: "INTENTION",
      metadata: metadata(intentionId, "Intent A", { urgency: "high" }),
      payload: {
        status: "active",
        holder: holderAId,
        intent: "Keep the guard calm.",
        urgency: "high",
        behavioral_pressure: "Speak softly and keep moving."
      }
    },
    {
      id: obligationId,
      type: "OBLIGATION",
      metadata: metadata(obligationId, "Debt A", { urgency: "medium" }),
      payload: {
        status: "open",
        owed_by: [holderBId],
        owed_to: "self",
        urgency: "medium",
        terms: "Do not abandon the apprentice.",
        consequence_if_broken: "Trust collapses."
      }
    },
    {
      id: consequenceId,
      type: "CONSEQUENCE",
      metadata: metadata(consequenceId, "Result A", { urgency: "critical" }),
      payload: {
        status: "active",
        holder_or_target: "public",
        cause: "The missing ledger.",
        urgency: "critical",
        current_effect: "The office is under inspection.",
        possible_next_effect: "The side door may be watched."
      }
    },
    {
      id: threadId,
      type: "OPEN THREAD",
      metadata: metadata(threadId, "Thread A", { urgency: "low" }),
      payload: {
        status: "active",
        title: "Who moved the ledger?",
        summary: "The ledger changed shelves overnight.",
        urgency: "low",
        possible_pressure_now: "A denial would matter."
      }
    },
    {
      id: relationshipId,
      type: "RELATIONSHIP",
      metadata: metadata(relationshipId, "Relationship A"),
      payload: {
        status: "active",
        pressure_text: "Old resentment makes every favor feel costly.",
        current_expression: "They trade polite favors without meeting each other's eyes."
      }
    },
    {
      id: emotionId,
      type: "EMOTION",
      metadata: metadata(emotionId, "Emotion A"),
      payload: {
        status: "active",
        surface_expression: "Her hands keep smoothing the same page."
      }
    },
    {
      id: locationId,
      type: "LOCATION",
      metadata: metadata(locationId, "Location A"),
      payload: {
        status: "active",
        label: "Archive stair",
        layout_relevant_now: "The stair turns sharply before the landing."
      }
    },
    {
      id: affordanceId,
      type: "VISIBLE AFFORDANCE",
      metadata: metadata(affordanceId, "Affordance A"),
      payload: {
        status: "available",
        label: "Loose latch",
        prompt_text: "The latch can be slipped quietly."
      }
    },
    {
      id: holderAId,
      type: "ENTITY",
      metadata: metadata(holderAId, "Niko"),
      payload: {
        display_name: "Niko"
      }
    },
    {
      id: holderBId,
      type: "ENTITY",
      metadata: metadata(holderBId, "Mara"),
      payload: {
        display_name: "Mara"
      }
    },
    {
      id: causeFactId,
      type: "FACT",
      metadata: metadata(causeFactId, "Stolen ledger"),
      payload: {
        statement: "The ledger was stolen."
      }
    }
  ];
}

function longLabelPressureRecords(): ValidationRecord[] {
  return [
    {
      id: planId,
      type: "PLAN",
      metadata: metadata(planId, `${longPlanObjective.slice(0, 77)}...`),
      payload: {
        plan_status: "active",
        objective: longPlanObjective,
        current_step: "Distract the guard at the side door.",
        resources: ["lamp", "rain noise"],
        blockers: ["guard is suspicious"],
        visibility_to_pov: "visible"
      }
    },
    {
      id: obligationId,
      type: "OBLIGATION",
      metadata: metadata(obligationId, `${longObligationTerms.slice(0, 77)}...`),
      payload: {
        status: "open",
        owed_by: ["019b0298-5c00-7000-8000-000000000202"],
        owed_to: "self",
        urgency: "critical",
        terms: longObligationTerms,
        consequence_if_broken: "Trust collapses."
      }
    },
    {
      id: consequenceId,
      type: "CONSEQUENCE",
      metadata: metadata(consequenceId, `${longConsequenceEffect.slice(0, 77)}...`),
      payload: {
        status: "active",
        holder_or_target: "public",
        cause: "The missing ledger.",
        urgency: "critical",
        current_effect: longConsequenceEffect,
        possible_next_effect: "The side door may be watched."
      }
    }
  ];
}

function referenceResolutionRecords(): ValidationRecord[] {
  return pressureRecords().map((record) => {
    if (record.id === obligationId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          owed_by: [holderAId, holderBId],
          owed_to: [holderBId]
        }
      };
    }

    if (record.id === consequenceId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          holder_or_target: holderBId,
          cause: causeFactId
        }
      };
    }

    return record;
  });
}

function absentReferenceRecords(): ValidationRecord[] {
  return pressureRecords().map((record) => {
    if (record.id === obligationId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          owed_by: [absentReferenceId],
          owed_to: "institution"
        }
      };
    }

    return record;
  });
}

function absentActionHolderRecords(): ValidationRecord[] {
  return pressureRecords().filter((record) => record.id !== holderAId);
}

function knowledgePressureRecords(): ValidationRecord[] {
  return [
    {
      id: "019b0298-5c00-7000-8000-000000000301",
      type: "SECRET",
      metadata: metadata("019b0298-5c00-7000-8000-000000000301", "Secret A"),
      payload: {
        secret_claim: "The archive key was copied before dawn."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000302",
      type: "BELIEF",
      metadata: metadata("019b0298-5c00-7000-8000-000000000302", "Belief A"),
      payload: {
        claim: "Mara believes the guard will return through the rain door."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000303",
      type: "FACT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000303", "Fact A"),
      payload: {
        statement: "The stair bell rings before the upper door opens."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000304",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000304", "Event A"),
      payload: {
        description: "Niko saw Mara hide the ledger under the oilcloth.",
        current_relevance: "critical"
      }
    },
    {
      id: intentionId,
      type: "INTENTION",
      metadata: metadata(intentionId, "Intent A"),
      payload: {
        status: "active",
        intent: "Keep the guard calm.",
        behavioral_pressure: "Speak softly and keep moving."
      }
    }
  ];
}

function populatedInput(records = pressureRecords()): BuildValidationSnapshotInput {
  return {
    records,
    generationSession: {
      current_cast_voice_pressure: [
        {
          cast_member_id: "019b0298-5c00-7000-8000-000000000201",
          local_function: "active_speaker",
          current_voice_pressure: "Keep replies clipped and guarded.",
          dialogue_pressure: "none",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "none",
          current_must_preserve: [],
          current_must_avoid: []
        }
      ],
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

function emptyInput(): BuildValidationSnapshotInput {
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

function metadata(
  id: string,
  displayLabel: string,
  values: Partial<NonNullable<ValidationRecord["metadata"]>> = {}
): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    archived: false,
    ...values
  };
}

function sectionBody(prompt: string, section: string): string {
  const pattern = new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`);
  return prompt.match(pattern)?.[1] ?? "";
}

function payloadOf(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" ? (record.payload as Record<string, unknown>) : {};
}

describe("compiler pressure-section resolvers", () => {
  it("renders populated pressure and causal sections", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));

    expect(sectionBody(prompt, "active_working_set")).toContain("Distract the guard at the side door.");
    expect(sectionBody(prompt, "active_working_set")).toContain("Old resentment makes every favor feel costly.");
    expect(sectionBody(prompt, "active_working_set")).toContain(
      "They trade polite favors without meeting each other's eyes."
    );
    expect(sectionBody(prompt, "active_working_set")).toContain("The stair turns sharply before the landing.");
    expect(sectionBody(prompt, "active_working_set")).toContain("Keep replies clipped and guarded.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Keep the guard calm.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Get the ledger out of the archive.");
    expect(sectionBody(prompt, "active_clocks")).toContain("Guard return");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("Do not abandon the apprentice.");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("The office is under inspection.");
    expect(sectionBody(prompt, "active_open_threads")).toContain("Who moved the ledger?");
  });

  it("resolves causal-pressure reference fields to selected record display labels", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput(referenceResolutionRecords())));
    const plans = sectionBody(prompt, "active_plans_and_intentions");
    const obligations = sectionBody(prompt, "active_obligations_and_consequences");

    expect(plans).toContain("holder: Niko");
    expect(obligations).toContain("owed by: Niko, Mara");
    expect(obligations).toContain("owed to: Mara");
    expect(obligations).toContain("target: Mara");
    expect(obligations).toContain("cause: The ledger was stolen.");
    expect(obligations).not.toContain(holderAId);
    expect(obligations).not.toContain(holderBId);
    expect(obligations).not.toContain(causeFactId);
  });

  it("preserves causal-pressure free text, sentinel literals, and absent-id fallback", () => {
    const populated = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const fallback = compilePrompt(buildValidationSnapshot(populatedInput(absentReferenceRecords()))).prompt;

    expect(sectionBody(populated, "active_obligations_and_consequences")).toContain("owed to: self");
    expect(sectionBody(populated, "active_obligations_and_consequences")).toContain("cause: The missing ledger.");
    expect(sectionBody(fallback, "active_obligations_and_consequences")).toContain(`owed by: ${absentReferenceId}`);
    expect(sectionBody(fallback, "active_obligations_and_consequences")).toContain("owed to: institution");
  });

  it("prefixes intention and plan action-pressure summaries with holder labels", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- Niko: Keep the guard calm.; Speak softly and keep moving.");
    expect(activeWorkingSet).toContain(
      "- Niko: Get the ledger out of the archive.; Distract the guard at the side door."
    );
  });

  it("does not invent holder prefixes for holder-less action-pressure records", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- Who moved the ledger?; A denial would matter.");
    expect(activeWorkingSet).toContain("- Loose latch; The latch can be slipped quietly.");
    expect(activeWorkingSet).not.toContain("- Niko: Who moved the ledger?");
    expect(activeWorkingSet).not.toContain("- Niko: Loose latch");
  });

  it("falls back to the raw holder id in action-pressure summaries when the holder record is absent", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(absentActionHolderRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain(
      `- ${holderAId}: Keep the guard calm.; Speak softly and keep moving.`
    );
    expect(activeWorkingSet).toContain(
      `- ${holderAId}: Get the ledger out of the archive.; Distract the guard at the side door.`
    );
  });

  it("deduplicates knowledge-pressure labels that match projected text", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(knowledgePressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- The archive key was copied before dawn.");
    expect(activeWorkingSet).toContain("- Mara believes the guard will return through the rain door.");
    expect(activeWorkingSet).toContain("- The stair bell rings before the upper door opens.");
    expect(activeWorkingSet).not.toContain(
      "- The archive key was copied before dawn.; The archive key was copied before dawn."
    );
    expect(activeWorkingSet).not.toContain(
      "- Mara believes the guard will return through the rain door.; Mara believes the guard will return through the rain door."
    );
    expect(activeWorkingSet).not.toContain(
      "- The stair bell rings before the upper door opens.; The stair bell rings before the upper door opens."
    );
  });

  it("renders event knowledge pressure without a relevance-enum tail", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(knowledgePressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- Niko saw Mara hide the ledger under the oilcloth.");
    expect(activeWorkingSet).not.toContain("- Niko saw Mara hide the ledger under the oilcloth.; critical");
  });

  it("preserves distinct compact pressure-summary parts", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(knowledgePressureRecords()))).prompt;

    expect(sectionBody(prompt, "active_working_set")).toContain(
      "- Keep the guard calm.; Speak softly and keep moving."
    );
  });

  it("renders exact empty-state constants when pressure sources are absent", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyInput()));

    expect(sectionBody(prompt, "active_working_set")).toContain(EMPTY_STATE_CONSTANTS.active_action_pressure);
    expect(sectionBody(prompt, "active_working_set")).toContain(EMPTY_STATE_CONSTANTS.voice_pressure);
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain(EMPTY_STATE_CONSTANTS.active_intentions);
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain(EMPTY_STATE_CONSTANTS.active_plans);
    expect(sectionBody(prompt, "active_clocks")).toContain(EMPTY_STATE_CONSTANTS.active_clocks);
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain(
      EMPTY_STATE_CONSTANTS.active_obligations
    );
    expect(sectionBody(prompt, "active_open_threads")).toContain(EMPTY_STATE_CONSTANTS.active_open_threads);
  });

  it("orders records independently from input order using structured metadata", () => {
    const forward = compilePrompt(buildValidationSnapshot(populatedInput(pressureRecords()))).prompt;
    const reversed = compilePrompt(buildValidationSnapshot(populatedInput([...pressureRecords()].reverse()))).prompt;
    const plans = sectionBody(forward, "active_plans_and_intentions");

    expect(reversed).toBe(forward);
    expect(plans.indexOf("Keep the guard calm.")).toBeLessThan(plans.indexOf("Get the ledger out of the archive."));
    expect(sectionBody(forward, "active_working_set").indexOf("Guard return")).toBeLessThan(
      sectionBody(forward, "active_working_set").indexOf("Get the ledger out of the archive.")
    );
  });

  it("keeps pressure sections free of plot-structure rail terms", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));
    const pressureSections = [
      "active_working_set",
      "active_plans_and_intentions",
      "active_clocks",
      "active_obligations_and_consequences",
      "active_open_threads"
    ].map((section) => sectionBody(prompt, section).toLowerCase());

    expect(pressureSections.join("\n")).not.toMatch(/\b(act structure|beat|arc|chapter)\b/);
  });

  it("renders long pressure labels fully without editor truncation markers", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(longLabelPressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");
    const obligations = sectionBody(prompt, "active_obligations_and_consequences");

    expect(activeWorkingSet).toContain(longPlanObjective);
    expect(obligations).toContain(longObligationTerms);
    expect(obligations).toContain(longConsequenceEffect);
    expect(activeWorkingSet).not.toContain(`${longPlanObjective.slice(0, 77)}...`);
    expect(obligations).not.toContain(`${longObligationTerms.slice(0, 77)}...`);
    expect(obligations).not.toContain(`${longConsequenceEffect.slice(0, 77)}...`);
  });
});
