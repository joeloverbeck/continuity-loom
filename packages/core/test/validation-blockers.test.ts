import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

const povId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";
const factId = "019b0298-5c00-7000-8000-000000000003";
const entityId = "019b0298-5c00-7000-8000-000000000004";
const recordA = "019b0298-5c00-7000-8000-000000000005";
const recordB = "019b0298-5c00-7000-8000-000000000006";

describe("universal blocker validation", () => {
  it("stays silent for a clean universal-blocker snapshot", () => {
    expect(runValidation(buildValidationSnapshot(cleanInput())).blockers).toEqual([]);
  });

  it("does not throw when optional voice-pressure rows are absent", () => {
    const snapshot = buildValidationSnapshot({
      records: [],
      generationSession: {},
      storyConfig: {},
      versions: {
        template: "0.0.0",
        compiler: "0.0.0",
        contract: "1.0.0"
      }
    } as unknown as BuildValidationSnapshotInput);

    expect(() => runValidation(snapshot)).not.toThrow();
  });

  it("does not throw when validation focus tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus = {} as BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"];

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
  });

  it("does not throw when generation context is absent from validation focus tags", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus = ({
      validation_focus_tags: {
        expected_local_modes: [],
        possible_durable_changes: []
      }
    } as unknown) as BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"];

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
  });

  it.each([
    [
      "non-local directive",
      DIAGNOSTIC_CODES.localProseScopeViolation,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
      }
    ],
    [
      "non-local stop guidance",
      DIAGNOSTIC_CODES.localProseScopeViolation,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.stop_guidance!.soft_unit_guidance = "Continue through future consequences.";
      }
    ],
    [
      "directive and stop disagreement",
      DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
        input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
      }
    ],
    [
      "state handoff contradiction",
      DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
      }
    ],
    [
      "one entity in two locations",
      DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000111" }
          },
          {
            id: recordB,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000222" }
          }
        ];
      }
    ],
    [
      "one object with two holders",
      DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "OBJECT",
            payload: {
              owner: povId,
              carried_by: entityId
            }
          }
        ];
      }
    ],
    [
      "active plan held by unable entity",
      DIAGNOSTIC_CODES.inactivePlanHolder,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "unconscious", location: "019b0298-5c00-7000-8000-000000000111" }
          },
          {
            id: recordB,
            type: "PLAN",
            payload: {
              plan_status: "active",
              holder: entityId,
              current_step: "Act now.",
              resources: [],
              fallback_steps: []
            }
          }
        ];
      }
    ],
    [
      "secret both hidden from and known by POV",
      DIAGNOSTIC_CODES.secretRevealContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      }
    ],
    [
      "hidden truth in POV knowledge",
      DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
      (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      }
    ],
    [
      "offstage interruption missing route",
      DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["offstage_interruption_possible"];
        input.generationSession.current_authoritative_state!.routes_and_exits = [];
      }
    ],
    [
      "physical action missing context",
      DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["physical_interaction_expected"];
        input.generationSession.current_authoritative_state!.consent_or_force_conditions = "";
      }
    ],
    [
      "current voice pressure contradicts content envelope",
      DIAGNOSTIC_CODES.contentEnvelopeContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure[0]!.current_voice_pressure = "Render graphic gore in the voice.";
      }
    ],
    [
      "content envelope contradiction",
      DIAGNOSTIC_CODES.contentEnvelopeContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex or non-graphic violence.";
        input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
      }
    ],
    [
      "prompt-facing prose contamination",
      DIAGNOSTIC_CODES.promptFacingProseContamination,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.recent_causal_context = "This is copied accepted prose from the last scene.";
      }
    ],
    [
      "missing constitutional section source",
      DIAGNOSTIC_CODES.missingConstitutionalSection,
      (input: BuildValidationSnapshotInput) => {
        input.versions.template = "";
      }
    ]
  ])("blocks %s", (_name, code, mutate) => {
    const input = cleanInput();
    mutate(input);

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find((item) => item.code === code);

    expect(diagnostic?.severity).toBe("blocker");
  });

  it.each([
    {
      name: "non-local directive",
      code: DIAGNOSTIC_CODES.localProseScopeViolation,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
      },
      expected: {
        affected: [{ field: "generationSession.manual_moment_directive.must_render[0]" }],
        message: "Directive or stop guidance asks for non-local prose scope.",
        whyItMatters: "Generation must render only the next local prose unit, not chapters, outlines, plot packages, or multiple response points.",
        suggestedActions: ["change-directive"]
      }
    },
    {
      name: "non-local stop guidance",
      code: DIAGNOSTIC_CODES.localProseScopeViolation,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.stop_guidance!.soft_unit_guidance = "Continue through future consequences.";
      },
      expected: {
        affected: [{ field: "generationSession.stop_guidance.soft_unit_guidance" }],
        message: "Directive or stop guidance asks for non-local prose scope.",
        whyItMatters: "Generation must render only the next local prose unit, not chapters, outlines, plot packages, or multiple response points.",
        suggestedActions: ["change-stop-guidance"]
      }
    },
    {
      name: "directive stop conflict",
      code: DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
        input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
      },
      expected: {
        affected: [{ field: "generationSession.manual_moment_directive" }],
        message: "Manual directive and stop guidance disagree about the local unit.",
        whyItMatters: "The prompt cannot deterministically tell the writer both to continue past and stop at the same local boundary.",
        suggestedActions: ["change-directive", "change-stop-guidance"]
      }
    },
    {
      name: "handoff state contradiction",
      code: DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
      },
      expected: {
        affected: [{ field: "generationSession.immediate_handoff" }],
        message: "Immediate handoff explicitly contradicts current authoritative state.",
        whyItMatters: "The prompt cannot launch from one current state while the handoff tells the writer a different state is true.",
        suggestedActions: ["revise", "add-current-state"]
      }
    },
    {
      name: "entity current location conflict",
      code: DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          statusRecord(recordA, entityId, "019b0298-5c00-7000-8000-000000000111"),
          statusRecord(recordB, entityId, "019b0298-5c00-7000-8000-000000000222")
        ];
      },
      expected: {
        affected: [{ recordId: entityId, field: "ENTITY STATUS.location" }],
        message: "Selected records place one entity in more than one current location.",
        whyItMatters: "A character or entity cannot be physically current in two different places unless the records explicitly model a special means.",
        suggestedActions: ["revise", "remove", "deselect"]
      }
    },
    {
      name: "object holder conflict",
      code: DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, { id: recordA, type: "OBJECT", payload: { owner: povId, carried_by: entityId } }];
      },
      expected: {
        affected: [{ recordId: recordA, field: "OBJECT.owner/carried_by" }],
        message: "Selected object has two different current holders.",
        whyItMatters: "Object possession must be deterministic before the prompt can render use, transfer, loss, or physical action.",
        suggestedActions: ["revise", "remove", "deselect"]
      }
    },
    {
      name: "inactive active-plan holder",
      code: DIAGNOSTIC_CODES.inactivePlanHolder,
      mutate: addUnableActivePlan,
      expected: {
        affected: [{ recordId: recordB, field: "PLAN.holder" }],
        message: "Active plan is held by an entity that currently cannot plausibly act.",
        whyItMatters: "A plan cannot drive local prose if its holder is dead, captive, unconscious, incapacitated, absent, or otherwise without means.",
        suggestedActions: ["revise", "deselect"]
      }
    },
    {
      name: "known hidden secret",
      code: DIAGNOSTIC_CODES.secretRevealContradiction,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      },
      expected: {
        affected: [{ recordId: recordA, field: "SECRET.holders/non_holders_to_protect" }],
        message: "Selected secret is both known by and hidden from the selected POV.",
        whyItMatters: "The prompt must not give a POV both protected ignorance and confirmed knowledge of the same secret.",
        suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
      }
    },
    {
      name: "hidden truth in POV knowledge",
      code: DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      },
      expected: {
        affected: [{ recordId: recordA, field: "SECRET.pov_access" }],
        message: "Hidden secret truth appears in a POV knowledge field.",
        whyItMatters: "A hidden truth cannot be simultaneously modeled as POV-held knowledge without breaking reveal discipline.",
        suggestedActions: ["add-knowledge-constraint"]
      }
    },
    {
      name: "offstage interruption route",
      code: DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["offstage_interruption_possible"];
        input.generationSession.current_authoritative_state!.routes_and_exits = [];
      },
      expected: {
        affected: [{ field: "generationSession.current_authoritative_state" }],
        message: "Offstage interruption lacks route, timing, communication, or awareness context.",
        whyItMatters: "An offstage interruption needs a deterministic way to enter, communicate, be heard, or arrive at the local moment.",
        suggestedActions: ["add-current-state", "add-route"]
      }
    },
    {
      name: "physical action context",
      code: DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["physical_interaction_expected"];
        input.generationSession.current_authoritative_state!.available_time = "";
      },
      expected: {
        affected: [{ field: "generationSession.current_authoritative_state" }],
        message: "Physical action lacks required bodies, routes, visibility, time, or consent/force context.",
        whyItMatters: "The prompt cannot safely render physical action without deterministic physical and consent/force conditions.",
        suggestedActions: ["add-current-state", "add-route"]
      }
    },
    {
      name: "content envelope conflict",
      code: DIAGNOSTIC_CODES.contentEnvelopeContradiction,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex.";
        input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
      },
      expected: {
        affected: [{ field: "storyConfig.universalContentPolicy.allowed_content_scope" }],
        message: "Manual directive contradicts the active content envelope.",
        whyItMatters: "The prompt cannot ask the provider to render material that the story configuration or policy envelope excludes.",
        suggestedActions: ["revise", "change-directive"]
      }
    },
    {
      name: "prompt-facing contamination",
      code: DIAGNOSTIC_CODES.promptFacingProseContamination,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.recent_causal_context = "Copied accepted prose goes here.";
      },
      expected: {
        affected: [{ field: "generationSession.immediate_handoff.recent_causal_context" }],
        message: "Prompt-facing field appears to contain accepted, rejected, superseded, or automatic prose-derived text.",
        whyItMatters: "Accepted and candidate prose are not canon for future prompts; durable changes must be represented in records or current state.",
        suggestedActions: ["revise", "remove"]
      }
    },
    {
      name: "first-segment continuation phrasing",
      code: DIAGNOSTIC_CODES.promptFacingProseContamination,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.begin_after = "As above.";
      },
      expected: {
        affected: [{ field: "generationSession.immediate_handoff" }],
        message: "First segment handoff must not depend on accepted prose or continuation phrasing.",
        whyItMatters: "A first segment prompt must be self-sufficient from current state and records.",
        suggestedActions: ["revise"]
      }
    },
    {
      name: "continuation contamination",
      code: DIAGNOSTIC_CODES.promptFacingProseContamination,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = ["continuation_after_accepted_segment"];
        input.generationSession.immediate_handoff!.begin_after = "Use the rejected candidate.";
      },
      expected: {
        affected: [{ field: "generationSession.immediate_handoff.begin_after" }],
        message: "Prompt-facing field appears to contain accepted, rejected, superseded, or automatic prose-derived text.",
        whyItMatters: "Accepted and candidate prose are not canon for future prompts; durable changes must be represented in records or current state.",
        suggestedActions: ["revise", "remove"]
      }
    },
    {
      name: "missing constitutional source",
      code: DIAGNOSTIC_CODES.missingConstitutionalSection,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.versions.compiler = "";
      },
      expected: {
        affected: [{ field: "versions" }],
        message: "Template or compiler version is missing for constitutional prompt sections.",
        whyItMatters: "Required constitutional sections must have deterministic template and compiler sources before prompt compilation.",
        suggestedActions: ["revise"]
      }
    }
  ])("emits exact diagnostic contract for $name", ({ code, mutate, expected }) => {
    const input = cleanInput();
    mutate(input);

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find((item) => item.code === code);

    expect(diagnostic).toEqual({
      severity: "blocker",
      code,
      ...expected
    });
  });

  it("blocks first segment continuation phrasing and preserves the clean no-accepted-prose note", () => {
    const input = cleanInput();

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);

    input.generationSession.immediate_handoff!.begin_after = "Continue from last time.";

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });

  it("does not block first-segment handoff when the prior-prose note is absent", () => {
    const input = cleanInput();
    input.generationSession.immediate_handoff = {
      recent_causal_context: "A arrived with the key.",
      last_visible_moment: "B noticed the key.",
      begin_after: "B noticing the key."
    };

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });

  it("names the missing current-state fields in the universal blocker", () => {
    const input = cleanInput();
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      current_time: "Night.",
      current_location: "",
      onstage_entities: [],
      immediate_situation_summary: ""
    };

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find(
      (item) => item.code === DIAGNOSTIC_CODES.missingCurrentAuthoritativeState
    );

    expect(diagnostic?.message).toBe(
      "Current authoritative state is missing: current location, onstage entities, immediate situation summary."
    );
  });

  it("does not emit the current-state blocker when all current-state required fields are present", () => {
    const input = cleanInput();

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.missingCurrentAuthoritativeState);
  });

  it("does not block a holder POV protected by all_except_holders", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "hidden",
          holders: [povId],
          non_holders_to_protect: "all_except_holders",
          pov_access: "knows",
          forbidden_reveals: ["Do not reveal the motive to non-holders."],
          reveal_permission: "locked",
          allowed_surface_cues: ["a careful pause"]
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
  });

  it("blocks contaminated continuation handoff", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = ["continuation_after_accepted_segment"];
    input.generationSession.immediate_handoff!.recent_causal_context = "Rejected candidate: she opened the door.";

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });

  it("emits the continuation-context contamination diagnostic alongside prompt-facing field contamination", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = ["continuation_after_accepted_segment"];
    input.generationSession.immediate_handoff!.last_visible_moment = "Copied accepted prose: she opened the door.";

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find(
      (item) => item.message === "Continuation handoff contains accepted/candidate prose contamination instead of user-authored state."
    );

    expect(diagnostic).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.promptFacingProseContamination,
      affected: [{ field: "generationSession.immediate_handoff" }],
      message: "Continuation handoff contains accepted/candidate prose contamination instead of user-authored state.",
      whyItMatters: "Continuation handoff may refer to user-authored durable state, but it must not paste candidate or accepted prose into prompt inputs.",
      suggestedActions: ["revise"]
    });
  });

  it.each([
    ["generation context", "generation_context"],
    ["expected local mode", "expected_local_modes"],
    ["possible durable change", "possible_durable_changes"]
  ] as const)("reads offstage-interruption focus tags from %s", (_name, tagField) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags = {
      generation_context: [],
      expected_local_modes: [],
      possible_durable_changes: [],
      [tagField]: ["offstage_interruption_possible"]
    };
    input.generationSession.current_authoritative_state!.routes_and_exits = [];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.offstageInterruptionMissingRoute);
  });

  it("accepts non-array, non-string route values as present offstage context", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["offstage_interruption_possible"];
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = ["radio"];
    input.generationSession.current_authoritative_state!.routes_and_exits = { route: "speaker" } as unknown as string[];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.offstageInterruptionMissingRoute);
  });

  type FocusTags = NonNullable<
    NonNullable<BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"]>["validation_focus_tags"]
  >;
  type ExpectedLocalMode = NonNullable<FocusTags["expected_local_modes"]>[number];
  type PossibleDurableChange = NonNullable<FocusTags["possible_durable_changes"]>[number];
  const physicalActionTagRows = [
    ["expected_local_modes", "physical_interaction_expected"],
    ["possible_durable_changes", "object_use_possible"],
    ["possible_durable_changes", "object_transfer_possible"],
    ["possible_durable_changes", "location_change_possible"],
    ["possible_durable_changes", "restraint_or_coercion_possible"],
    ["possible_durable_changes", "intimacy_or_sex_possible"],
    ["possible_durable_changes", "violence_or_injury_possible"]
  ] satisfies readonly (
    | readonly ["expected_local_modes", ExpectedLocalMode]
    | readonly ["possible_durable_changes", PossibleDurableChange]
  )[];

  it.each(physicalActionTagRows)("requires physical context for %s.%s", (field, tag) => {
    const input = cleanInput();
    if (field === "expected_local_modes") {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [tag];
    } else {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [tag];
    }
    input.generationSession.current_authoritative_state!.consent_or_force_conditions = "";

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.impossibleActionPhysicalContext);
  });

  it.each([
    ["stop-immediately directive versus continuing stop guidance", (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive!.must_render = ["Stop immediately after one look."];
      input.generationSession.stop_guidance!.soft_unit_guidance = "Continue through the later consequence.";
    }],
    ["single-line directive versus later-consequence stop guidance", (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive!.do_not_force = ["Keep this to a single line."];
      input.generationSession.stop_guidance!.soft_unit_guidance = "Continue through the later consequence.";
    }]
  ])("blocks directive/stop boundary conflict from %s", (_name, mutate) => {
    expectBlock(DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement, mutate);
  });

  it.each([
    ["continue-through directive with stop-after guidance", "Continue through the argument.", "Stop after the first response point."],
    ["do-not-stop directive with first-response guidance", "Do not stop until the door opens.", "Stop after the first response point."],
    ["keep-going directive with next-response guidance", "Keep going until the alarm starts.", "Stop at the next response point."],
    ["stop-immediately directive with continue-through guidance", "Stop immediately after one look.", "Continue through the later consequence."],
    ["single-line directive with later-consequence guidance", "Keep this to a single line.", "Continue through the later consequence."]
  ])("blocks directive/stop marker pair: %s", (_name, directiveText, stopText) => {
    expectBlock(DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement, (input) => {
      input.generationSession.manual_moment_directive!.must_render = [directiveText];
      input.generationSession.stop_guidance!.soft_unit_guidance = stopText;
    });
  });

  it.each([
    ["matching stop guidance without directive marker", "B asks for the key.", "Stop after the first response point."],
    ["matching directive without stop marker", "Continue through the argument.", "End once B speaks."],
    ["later-consequence stop without immediate-stop directive", "B asks for the key.", "Continue through the later consequence."],
    ["immediate-stop directive without later-consequence stop", "Stop immediately after one look.", "End once B speaks."]
  ])("does not invent directive/stop conflict for %s", (_name, directiveText, stopText) => {
    const input = cleanInput();
    input.generationSession.manual_moment_directive!.must_render = [directiveText];
    input.generationSession.stop_guidance!.soft_unit_guidance = stopText;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement);
  });

  it.each([
    "This contradicts current state.",
    "This is not the current state."
  ])("blocks handoff contradiction marker '%s'", (handoffText) => {
    expectBlock(DIAGNOSTIC_CODES.handoffCurrentStateContradiction, (input) => {
      input.generationSession.immediate_handoff!.recent_causal_context = handoffText;
    });
  });

  it.each([
    ["unknown entity location", { entity_id: entityId, life: "alive", agency: "free", location: "unknown" }],
    ["missing entity id", { life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000333" }],
    ["missing location", { entity_id: entityId, life: "alive", agency: "free" }]
  ])("does not treat %s as a second current location", (_name, payload) => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "ENTITY STATUS",
        payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000111" }
      },
      { id: recordB, type: "ENTITY STATUS", payload }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.entityCurrentLocationContradiction);
  });

  it("does not inspect non-status records for current-location conflicts", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "FACT",
        payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000111" }
      },
      statusRecord(recordB, entityId, "019b0298-5c00-7000-8000-000000000222")
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.entityCurrentLocationContradiction);
  });

  it("does not block duplicate entity-status records when they agree on the same current location", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      statusRecord(recordA, entityId, "019b0298-5c00-7000-8000-000000000111"),
      statusRecord(recordB, entityId, "019b0298-5c00-7000-8000-000000000111")
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.entityCurrentLocationContradiction);
  });

  it.each([
    ["owner none", { owner: "none", carried_by: entityId }],
    ["carrier none", { owner: povId, carried_by: "none" }],
    ["owner unknown", { owner: "unknown", carried_by: entityId }],
    ["carrier unknown", { owner: povId, carried_by: "unknown" }],
    ["same holder", { owner: povId, carried_by: povId }],
    ["missing owner", { carried_by: entityId }],
    ["missing carrier", { owner: povId }]
  ])("does not block object holder state when %s", (_name, payload) => {
    const input = cleanInput();
    input.records = [...input.records, { id: recordA, type: "OBJECT", payload }];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.objectCurrentHolderContradiction);
  });

  it("does not inspect non-object records for owner and carrier conflicts", () => {
    const input = cleanInput();
    input.records = [...input.records, { id: recordA, type: "FACT", payload: { owner: povId, carried_by: entityId } }];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.objectCurrentHolderContradiction);
  });

  it.each([
    ["dead holder", { life: "dead", agency: "free", location: "019b0298-5c00-7000-8000-000000000111" }],
    ["captive holder", { life: "alive", agency: "captive", location: "019b0298-5c00-7000-8000-000000000111" }],
    ["incapacitated holder", { life: "alive", agency: "incapacitated", location: "019b0298-5c00-7000-8000-000000000111" }],
    ["offstage holder", { life: "alive", agency: "free", location: "offstage" }]
  ])("blocks active plan from %s without plausible means", (_name, statusPatch) => {
    expectBlock(DIAGNOSTIC_CODES.inactivePlanHolder, (input) => {
      input.records = [
        ...input.records,
        {
          id: recordA,
          type: "ENTITY STATUS",
          payload: { entity_id: entityId, ...statusPatch }
        },
        {
          id: recordB,
          type: "PLAN",
          payload: {
            plan_status: "active",
            holder: entityId,
            current_step: "Wait.",
            resources: [],
            fallback_steps: []
          }
        }
      ];
    });
  });

  it.each([
    ["resources", { resources: ["phone"], fallback_steps: [], current_step: "Wait." }],
    ["fallback steps", { resources: [], fallback_steps: ["send another person"], current_step: "Wait." }],
    ["remote current step", { resources: [], fallback_steps: [], current_step: "Send a remote signal." }],
    ["message current step", { resources: [], fallback_steps: [], current_step: "Send a message." }],
    ["delegate current step", { resources: [], fallback_steps: [], current_step: "Delegate through a proxy." }]
  ])("allows inactive active-plan holder when plausible means come from %s", (_name, planPatch) => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "ENTITY STATUS",
        payload: { entity_id: entityId, life: "alive", agency: "unconscious", location: "019b0298-5c00-7000-8000-000000000111" }
      },
      {
        id: recordB,
        type: "PLAN",
        payload: {
          plan_status: "active",
          holder: entityId,
          ...planPatch
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it.each([
    ["non-active plan", { plan_status: "paused", holder: entityId }],
    ["missing holder", { plan_status: "active" }],
    ["no selected holder status", { plan_status: "active", holder: entityId }]
  ])("does not block active-plan holder when %s", (_name, planPayload) => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordB,
        type: "PLAN",
        payload: {
          current_step: "Wait.",
          resources: [],
          fallback_steps: [],
          ...planPayload
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it("ignores malformed entity-status payloads when indexing active plan holders", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "ENTITY STATUS",
        payload: { life: "dead", agency: "unconscious", location: "offstage" }
      },
      {
        id: recordB,
        type: "PLAN",
        payload: {
          plan_status: "active",
          holder: entityId,
          current_step: "Wait.",
          resources: [],
          fallback_steps: []
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it("does not use non-status records as active-plan holder status", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "FACT",
        payload: { entity_id: entityId, life: "dead", agency: "unconscious", location: "offstage" }
      },
      {
        id: recordB,
        type: "PLAN",
        payload: {
          plan_status: "active",
          holder: entityId,
          current_step: "Wait.",
          resources: [],
          fallback_steps: []
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it("does not treat non-plan records with plan-shaped payloads as active plans", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "ENTITY STATUS",
        payload: { entity_id: entityId, life: "dead", agency: "unconscious", location: "offstage" }
      },
      {
        id: recordB,
        type: "FACT",
        payload: {
          plan_status: "active",
          holder: entityId,
          current_step: "Wait.",
          resources: [],
          fallback_steps: []
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it("does not run the secret firewall for omniscient POV", () => {
    const input = cleanInput();
    input.generationSession.active_working_set!.selected_pov = "omniscient";
    input.storyConfig.proseMode!.pov_character = "omniscient";
    input.records = [...input.records, hiddenKnownSecret()];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge);
  });

  it("does not run the secret firewall when no effective POV is selected", () => {
    const input = cleanInput();
    input.generationSession.active_working_set!.selected_pov = undefined;
    input.storyConfig.proseMode!.pov_character = "";
    input.records = [...input.records, hiddenKnownSecret()];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge);
  });

  it("allows a partly known POV secret that is also protected from fuller reveal", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "partially_revealed",
          holders: [povId],
          non_holders_to_protect: [povId],
          pov_access: "knows_partly",
          forbidden_reveals: ["Do not state the whole name."],
          reveal_permission: "clue_only",
          allowed_surface_cues: ["a chill"]
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
  });

  it("does not run the secret firewall on non-secret records with secret-shaped payloads", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "FACT",
        payload: {
          id: recordA,
          status: "hidden",
          holders: [povId],
          non_holders_to_protect: [povId],
          pov_access: "hidden"
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge);
  });

  it("does not block malformed secret-holder containers as known-by-POV", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "hidden",
          holders: povId,
          non_holders_to_protect: [povId],
          pov_access: "hidden"
        }
      },
      {
        id: recordB,
        type: "SECRET",
        payload: {
          id: recordB,
          status: "hidden",
          holders: [entityId],
          non_holders_to_protect: povId,
          pov_access: "knows"
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge);
  });

  it("does not block all-except-holders protection when the selected POV is not modeled as a holder", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "hidden",
          holders: [entityId],
          non_holders_to_protect: "all_except_holders",
          pov_access: "knows",
          forbidden_reveals: ["Do not reveal the motive to non-holders."],
          reveal_permission: "locked",
          allowed_surface_cues: ["a careful pause"]
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
  });

  it("does not treat all-except-holders protection as hiding a secret from holders", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "hidden",
          holders: [povId],
          non_holders_to_protect: "all_except_holders",
          pov_access: "knows",
          forbidden_reveals: ["Do not reveal the motive."],
          reveal_permission: "locked",
          allowed_surface_cues: ["a careful pause"]
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
  });

  it("treats array payloads as empty objects for blocker payload guards", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      { id: recordA, type: "SECRET", payload: [povId] },
      { id: recordB, type: "PLAN", payload: [entityId] }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.inactivePlanHolder);
  });

  it.each([
    ["manual may-render lane", (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive!.may_render_if_naturally_caused = ["Use the accepted segment text."];
    }],
    ["manual do-not-force lane", (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive!.do_not_force = ["Do not contradict the superseded regeneration."];
    }],
    ["stop guidance lane", (input: BuildValidationSnapshotInput) => {
      input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the auto-summary resolves.";
    }]
  ])("blocks prompt-facing contamination from %s", (_name, mutate) => {
    expectBlock(DIAGNOSTIC_CODES.promptFacingProseContamination, mutate);
  });

  it.each([
    ["voice pressure", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "Non-graphic only.";
      input.generationSession.current_cast_voice_pressure[0]!.dialogue_pressure = "Demand graphic sex.";
    }],
    ["voice preserve lane", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex.";
      input.generationSession.current_cast_voice_pressure[0]!.current_must_preserve = ["Explicit sex description."];
    }],
    ["voice avoid lane", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "Non-explicit and non-graphic.";
      input.generationSession.current_cast_voice_pressure[0]!.current_must_avoid = ["Do not use graphic gore."];
    }],
    ["voice override", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "Non-graphic only.";
      input.generationSession.cast_voice_overrides = [{
        cast_member_id: castId,
        reason: "Temporary read.",
        applies_to: ["dialogue"],
        override_text: "Push into graphic gore."
      }];
    }]
  ])("blocks content envelope contradiction from %s", (_name, mutate) => {
    expectBlock(DIAGNOSTIC_CODES.contentEnvelopeContradiction, mutate);
  });

  it.each([
    ["non-explicit policy with graphic sex", "Non-explicit only.", "Render graphic sex."],
    ["no-explicit-sex policy with explicit sex", "No explicit sex.", "Render explicit sex."],
    ["non-graphic policy with graphic gore", "Non-graphic only.", "Render graphic gore."]
  ])("blocks content envelope marker pair: %s", (_name, policy, directive) => {
    expectBlock(DIAGNOSTIC_CODES.contentEnvelopeContradiction, (input) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = policy;
      input.generationSession.manual_moment_directive!.must_render = [directive];
    });
  });

  it("blocks content-envelope pressure when voice lists are omitted", () => {
    expectBlock(DIAGNOSTIC_CODES.contentEnvelopeContradiction, (input) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "Non-graphic only.";
      input.generationSession.current_cast_voice_pressure = [{
        cast_member_id: castId,
        current_voice_pressure: "Push into graphic gore.",
        dialogue_pressure: "none",
        pov_narration_pressure: "none",
        nonverbal_or_silence_pressure: "none"
      } as never];
    });
  });

  it("does not block content envelope when policy is absent", () => {
    const input = cleanInput();
    delete input.storyConfig.universalContentPolicy;
    input.generationSession.manual_moment_directive!.must_render = ["Render graphic gore."];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.contentEnvelopeContradiction);
  });

  it.each([
    "object_use_possible",
    "object_transfer_possible",
    "location_change_possible",
    "restraint_or_coercion_possible",
    "intimacy_or_sex_possible",
    "violence_or_injury_possible"
  ])("blocks missing physical context for focus tag %s", (focusTag) => {
    expectBlock(DIAGNOSTIC_CODES.impossibleActionPhysicalContext, (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [focusTag as never];
      input.generationSession.current_authoritative_state!.available_time = null as never;
    });
  });

  it("blocks missing offstage route when the focus tag comes from durable changes", () => {
    expectBlock(DIAGNOSTIC_CODES.offstageInterruptionMissingRoute, (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "offstage_interruption_possible" as never
      ];
      input.generationSession.current_authoritative_state!.routes_and_exits = undefined as never;
    });
  });

  it("blocks when the compiler version source is missing", () => {
    expectBlock(DIAGNOSTIC_CODES.missingConstitutionalSection, (input) => {
      input.versions.compiler = "";
    });
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function expectBlock(code: string, mutate: (input: BuildValidationSnapshotInput) => void): void {
  const input = cleanInput();
  mutate(input);

  const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find((item) => item.code === code);

  expect(diagnostic?.severity).toBe("blocker");
}

function statusRecord(id: string, entityIdValue: string, location: string) {
  return {
    id,
    type: "ENTITY STATUS",
    payload: { entity_id: entityIdValue, life: "alive", agency: "free", location }
  };
}

function addUnableActivePlan(input: BuildValidationSnapshotInput): void {
  input.records = [
    ...input.records,
    {
      id: recordA,
      type: "ENTITY STATUS",
      payload: { entity_id: entityId, life: "alive", agency: "unconscious", location: "019b0298-5c00-7000-8000-000000000111" }
    },
    {
      id: recordB,
      type: "PLAN",
      payload: {
        plan_status: "active",
        holder: entityId,
        current_step: "Wait.",
        resources: [],
        fallback_steps: []
      }
    }
  ];
}

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: povId,
        type: "ENTITY",
        payload: {
          id: povId,
          entity_kind: "person"
        }
      },
      {
        id: entityId,
        type: "ENTITY",
        payload: {
          id: entityId,
          entity_kind: "person"
        }
      },
      {
        id: castId,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        localFunction: "active_speaker",
        payload: fullCastPayload(entityId)
      },
      {
        id: factId,
        type: "FACT",
        payload: {
          id: factId,
          known_by: [povId]
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [povId, castId, factId],
        active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        immediate_situation_summary: "A and B are at the loading door while the key changes hands.",
        offstage_pressuring_entities: [],
        positions: "A and B stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "They can see each other.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["The roof exit is blocked."]
      },
      immediate_handoff: {
        recent_causal_context: "A arrived with the key.",
        last_visible_moment: "B noticed the key.",
        begin_after: "B noticing the key."
      },
      manual_moment_directive: {
        must_render: ["B asks for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: castId,
          current_voice_pressure: "B is clipped and afraid.",
          dialogue_pressure: "Direct question.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "none",
          current_must_preserve: [],
          current_must_avoid: []
        }
      ],
      cast_voice_overrides: [],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop after B's first response point."
      }
    },
    storyConfig: {
      storyContract: {
        title: "Continuity Test",
        premise: "A city keeps its promises badly.",
        genre_mode: "urban fantasy",
        tone: "tense and intimate",
        setting_baseline: "Rainy districts under old bargains.",
        content_intensity: "mature",
        explicitness: "Render mature material only when earned.",
        language_register: "controlled contemporary prose",
      },
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      },
      proseMode: {
        pov_character: povId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: {
      template: "0.0.0",
      compiler: "0.0.0",
      contract: "1.0.0"
    }
  };
}

function hiddenKnownSecret() {
  return {
    id: recordA,
    type: "SECRET",
    payload: {
      id: recordA,
      status: "hidden",
      holders: [povId],
      non_holders_to_protect: [povId],
      pov_access: "hidden",
      forbidden_reveals: ["Do not state the name."],
      reveal_permission: "locked",
      allowed_surface_cues: ["a chill"]
    }
  };
}

function fullCastPayload(entityIdValue: string) {
  return {
    entity_id: entityIdValue,
    identity: {
      one_line: "A careful operator.",
      public_face: "Composed.",
      private_pressure: "Fearful."
    },
    voice_anchor: {
      core_voice: "formal",
      rhythm_and_syntax: "measured",
      register_and_diction: "precise",
      vocabulary_and_metaphor_pools: "weather",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "home",
      dialogue_tactics_and_speech_functions: "deflects",
      address_terms_and_naming: "titles",
      silence_interruption_and_turntaking: "strategic",
      under_pressure_voice: "clipped",
      suppression_or_evasion_rule: "redirects",
      must_preserve: ["precision"],
      must_avoid: ["rambling"],
      anti_repetition_warnings: ["do not repeat weather metaphors"]
    },
    pressure_behavior_core: {
      cornered: "narrows choices",
      tempted_or_offered_power: "bargains",
      protecting_attachment: "deflects"
    },
    body_presence_core: {
      physicality: "still",
      habitual_gestures_or_presence: "folded hands",
      social_presentation: "controlled"
    },
    agency_core: {
      default_strategy: "delay",
      risk_style: "calculated"
    }
  };
}
