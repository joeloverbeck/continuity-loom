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

function pressureRecords(): ValidationRecord[] {
  return [
    {
      id: planId,
      type: "PLAN",
      metadata: metadata(planId, "Plan B", { userOrder: 2, salience: "critical" }),
      payload: {
        plan_status: "active",
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
        holder: "019b0298-5c00-7000-8000-000000000201",
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
        owed_by: ["019b0298-5c00-7000-8000-000000000202"],
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
        pressure_text: "Old resentment makes every favor feel costly."
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

describe("compiler pressure-section resolvers", () => {
  it("renders populated pressure and causal sections", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(populatedInput()));

    expect(sectionBody(prompt, "active_working_set")).toContain("Distract the guard at the side door.");
    expect(sectionBody(prompt, "active_working_set")).toContain("Old resentment makes every favor feel costly.");
    expect(sectionBody(prompt, "active_working_set")).toContain("The stair turns sharply before the landing.");
    expect(sectionBody(prompt, "active_working_set")).toContain("Keep replies clipped and guarded.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Keep the guard calm.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Get the ledger out of the archive.");
    expect(sectionBody(prompt, "active_clocks")).toContain("Guard return");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("Do not abandon the apprentice.");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("The office is under inspection.");
    expect(sectionBody(prompt, "active_open_threads")).toContain("Who moved the ledger?");
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
    expect(sectionBody(forward, "active_working_set").indexOf("Clock A")).toBeLessThan(
      sectionBody(forward, "active_working_set").indexOf("Plan B")
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
});
