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
const pressureEntityId = "019b0298-5c00-7000-8000-000000000204";
const personEntityId = "019b0298-5c00-7000-8000-000000000205";
const activeCastId = "019b0298-5c00-7000-8000-000000000206";
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

function nonActiveActionPressureRecords(): ValidationRecord[] {
  return pressureRecords().map((record) => {
    if (record.id === intentionId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          status: "blocked"
        }
      };
    }

    if (record.id === planId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          plan_status: "suspended"
        }
      };
    }

    if (record.id === threadId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          status: "answered"
        }
      };
    }

    if (record.id === affordanceId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          status: "unavailable"
        }
      };
    }

    if (record.id === consequenceId) {
      return {
        ...record,
        payload: {
          ...payloadOf(record),
          status: "resolved"
        }
      };
    }

    return record;
  });
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
        fact_kind: "current_state",
        statement: "The stair bell rings before the upper door opens."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000304",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000304", "Event A"),
      payload: {
        event_kind: "immediate_previous",
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

function gatedKnowledgePressureRecords(): ValidationRecord[] {
  return [
    {
      id: "019b0298-5c00-7000-8000-000000000401",
      type: "FACT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000401", "Ordinary setting fact"),
      payload: {
        fact_kind: "setting_fact",
        salience: "medium",
        statement: "The archive windows face east."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000402",
      type: "FACT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000402", "Current state fact"),
      payload: {
        fact_kind: "current_state",
        salience: "low",
        statement: "The stair bell is already trembling."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000403",
      type: "FACT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000403", "Segment scope fact"),
      payload: {
        fact_kind: "discovered_fact",
        scope: "current_segment",
        salience: "low",
        statement: "The rain has made the side steps slick."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000404",
      type: "FACT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000404", "High salience fact"),
      payload: {
        fact_kind: "setting_fact",
        salience: "high",
        statement: "The east window is the only one not barred."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000405",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000405", "Backstory event"),
      payload: {
        event_kind: "relevant_backstory",
        current_relevance: "critical",
        description: "Mara trained in the archive years ago."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000406",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000406", "Recent event"),
      payload: {
        event_kind: "recent_causal",
        current_relevance: "high",
        description: "The guard heard the bell stutter."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000407",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000407", "Low offstage event"),
      payload: {
        event_kind: "offstage",
        current_relevance: "low",
        description: "A clerk coughed in the courtyard."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000408",
      type: "EVENT",
      metadata: metadata("019b0298-5c00-7000-8000-000000000408", "High offstage event"),
      payload: {
        event_kind: "offstage",
        current_relevance: "critical",
        description: "The captain is already crossing the courtyard."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000409",
      type: "BELIEF",
      metadata: metadata("019b0298-5c00-7000-8000-000000000409", "Belief with behavior"),
      payload: {
        claim: "Mara thinks the guard will choose the rain door.",
        behavioral_effect: "Mara keeps her hand on the latch instead of running."
      }
    },
    {
      id: "019b0298-5c00-7000-8000-000000000410",
      type: "BELIEF",
      metadata: metadata("019b0298-5c00-7000-8000-000000000410", "Belief without behavior"),
      payload: {
        claim: "Niko believes the apprentice can keep quiet."
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

function activeWorkingSetSubBlock(prompt: string, label: string): string {
  const activeWorkingSet = sectionBody(prompt, "active_working_set");
  const pattern = new RegExp(`${label}:\\n([\\s\\S]*?)(?:\\n\\n[A-Z][A-Za-z ]+:|\\n\\nActive cast voice pressure pins:|$)`);
  return activeWorkingSet.match(pattern)?.[1] ?? "";
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
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Keep the guard calm.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("Get the ledger out of the archive.");
    expect(sectionBody(prompt, "active_clocks")).toContain("Guard return");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("Do not abandon the apprentice.");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("The office is under inspection.");
    expect(sectionBody(prompt, "active_open_threads")).toContain("Who moved the ledger?");
  });

  it("renders selected non-person entity material pressure once without duplicating active cast entities", () => {
    const records: ValidationRecord[] = [
      ...pressureRecords(),
      {
        id: pressureEntityId,
        type: "ENTITY",
        metadata: metadata(pressureEntityId, "Dock Authority"),
        payload: {
          id: pressureEntityId,
          display_name: "Dock Authority",
          entity_kind: "institution",
          roles_in_story: ["authority", "pressure_source"],
          short_description: "A harbor office with power to close the pier gates."
        }
      },
      {
        id: personEntityId,
        type: "ENTITY",
        metadata: metadata(personEntityId, "Elin Vale"),
        payload: {
          id: personEntityId,
          display_name: "Elin Vale",
          entity_kind: "person",
          roles_in_story: ["primary_actor"],
          short_description: "An active speaker with a full cast dossier."
        }
      },
      {
        id: activeCastId,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        metadata: metadata(activeCastId, "Elin cast"),
        payload: {
          entity_id: personEntityId,
          identity: { one_line: "Elin is trying to keep the ledger hidden." },
          voice_anchor: { core_voice: "Clipped and careful." }
        }
      }
    ];
    const materialPressure = sectionBody(compilePrompt(buildValidationSnapshot(populatedInput(records))).prompt, "active_working_set");

    expect(materialPressure.match(/Dock Authority - institution/g)).toHaveLength(1);
    expect(materialPressure).toContain("Dock Authority - institution; A harbor office with power to close the pier gates.");
    expect(materialPressure).not.toContain("An active speaker with a full cast dossier.");
    expect(materialPressure).not.toContain(pressureEntityId);
    expect(materialPressure).not.toContain(personEntityId);
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
    expect(activeWorkingSet).toContain("- The office is under inspection.; The side door may be watched.");
    expect(activeWorkingSet).not.toContain("- Niko: Who moved the ledger?");
    expect(activeWorkingSet).not.toContain("- Niko: Loose latch");
    expect(activeWorkingSet).not.toContain("- Niko: The office is under inspection.");
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

  it("annotates non-active action-pressure records with deterministic status tags", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(nonActiveActionPressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- Niko: Keep the guard calm. [intention blocked]; Speak softly and keep moving.");
    expect(activeWorkingSet).toContain(
      "- Niko: Get the ledger out of the archive. [plan suspended]; Distract the guard at the side door."
    );
    expect(activeWorkingSet).toContain("- Who moved the ledger? [open thread answered]; A denial would matter.");
    expect(activeWorkingSet).toContain("- Loose latch [affordance unavailable]; The latch can be slipped quietly.");
    expect(activeWorkingSet).toContain(
      "- The office is under inspection. [consequence resolved]; The side door may be watched."
    );
  });

  it("omits action-pressure status tags for active and available records", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain("- Niko: Keep the guard calm.; Speak softly and keep moving.");
    expect(activeWorkingSet).toContain(
      "- Niko: Get the ledger out of the archive.; Distract the guard at the side door."
    );
    expect(activeWorkingSet).toContain("- Who moved the ledger?; A denial would matter.");
    expect(activeWorkingSet).toContain("- Loose latch; The latch can be slipped quietly.");
    expect(activeWorkingSet).toContain("- The office is under inspection.; The side door may be watched.");
    expect(activeWorkingSet).not.toContain("[intention active]");
    expect(activeWorkingSet).not.toContain("[plan active]");
    expect(activeWorkingSet).not.toContain("[open thread active]");
    expect(activeWorkingSet).not.toContain("[affordance available]");
    expect(activeWorkingSet).not.toContain("[consequence active]");
  });

  it("keeps affordance action text in Action pressure and out of Material pressure", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput())).prompt;
    const actionPressure = activeWorkingSetSubBlock(prompt, "Action pressure");
    const materialPressure = activeWorkingSetSubBlock(prompt, "Material pressure");

    expect(actionPressure).toContain("- Loose latch; The latch can be slipped quietly.");
    expect(materialPressure).not.toContain("Loose latch");
    expect(materialPressure).not.toContain("The latch can be slipped quietly.");
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

  it("narrows FACT and EVENT active knowledge pressure to current pressure predicates", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(gatedKnowledgePressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).not.toContain("The archive windows face east.");
    expect(activeWorkingSet).toContain("- The stair bell is already trembling.");
    expect(activeWorkingSet).toContain("- The rain has made the side steps slick.");
    expect(activeWorkingSet).toContain("- The east window is the only one not barred.");
    expect(activeWorkingSet).not.toContain("Mara trained in the archive years ago.");
    expect(activeWorkingSet).toContain("- The guard heard the bell stutter.");
    expect(activeWorkingSet).not.toContain("A clerk coughed in the courtyard.");
    expect(activeWorkingSet).toContain("- The captain is already crossing the courtyard.");
  });

  it("renders BELIEF active knowledge pressure as behavior-first with claim fallback", () => {
    const prompt = compilePrompt(buildValidationSnapshot(populatedInput(gatedKnowledgePressureRecords()))).prompt;
    const activeWorkingSet = sectionBody(prompt, "active_working_set");

    expect(activeWorkingSet).toContain(
      "- Mara keeps her hand on the latch instead of running.; Mara thinks the guard will choose the rain door."
    );
    expect(activeWorkingSet).not.toContain("- Belief with behavior; Mara thinks the guard will choose the rain door.");
    expect(activeWorkingSet).toContain("- Niko believes the apprentice can keep quiet.");
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
    expect(sectionBody(prompt, "active_working_set")).toContain(EMPTY_STATE_CONSTANTS.active_cast_voice_pressure_pins);
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
