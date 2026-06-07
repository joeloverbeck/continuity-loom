import { describe, expect, it } from "vitest";

import {
  deriveGenerationContextDefault,
  generationSessionDraftSchema,
  normalizeGenerationSessionDraft,
  type GenerationSessionDraft
} from "../src/index.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

describe("generation brief draft schema", () => {
  it("accepts blank nested surfaces and selected generation context drafts", () => {
    expect(
      generationSessionDraftSchema.safeParse({
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"]
          }
        },
        stop_guidance: { soft_unit_guidance: "" },
        immediate_handoff: {
          recent_causal_context: "",
          last_visible_moment: "",
          prior_accepted_prose_status_or_handoff_note: "none",
          begin_after: ""
        }
      }).success
    ).toBe(true);
  });

  it("accepts an empty manual directive draft", () => {
    expect(
      generationSessionDraftSchema.safeParse({
        manual_moment_directive: {
          must_render: [],
          may_render_if_naturally_caused: [],
          do_not_force: []
        }
      }).success
    ).toBe(true);
  });

  it("rejects unknown keys, invalid enum values, and invalid record IDs", () => {
    expect(
      generationSessionDraftSchema.safeParse({
        stop_guidance: {
          soft_unit_guidance: "",
          unexpected: true
        }
      }).success
    ).toBe(false);

    expect(
      generationSessionDraftSchema.safeParse({
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["middle_segment"]
          }
        }
      }).success
    ).toBe(false);

    expect(
      generationSessionDraftSchema.safeParse({
        active_working_set: {
          selected_records: ["not-a-uuid"]
        }
      }).success
    ).toBe(false);
  });
});

describe("generation brief draft normalization", () => {
  it("derives generation context from accepted segment count", () => {
    expect(deriveGenerationContextDefault(0)).toBe("first_segment");
    expect(deriveGenerationContextDefault(1)).toBe("continuation_after_accepted_segment");
    expect(deriveGenerationContextDefault(12)).toBe("continuation_after_accepted_segment");
  });

  it("trims blanks, drops blank list items, preserves explicit fields, and applies missing context defaults", () => {
    const draft: GenerationSessionDraft = {
      current_authoritative_state: {
        current_time: "  late night  ",
        current_location: "",
        onstage_entities: [idA],
        visible_conditions: ["  rain on the window  ", "   "],
        routes_and_exits: []
      },
      immediate_handoff: {
        recent_causal_context: "   ",
        last_visible_moment: "  Mara reaches the stairwell. ",
        prior_accepted_prose_status_or_handoff_note: " none ",
        begin_after: ""
      },
      manual_moment_directive: {
        must_render: ["   ", "Mara opens the door."],
        may_render_if_naturally_caused: [],
        do_not_force: ["  do not resolve the call  ", ""]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          current_voice_pressure: "  clipped, defensive  ",
          current_must_preserve: ["", "short answers"]
        },
        {
          cast_member_id: idB,
          current_voice_pressure: "",
          current_must_preserve: []
        }
      ],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: [],
          expected_local_modes: ["dialogue_expected"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: "   "
      }
    };

    expect(normalizeGenerationSessionDraft(draft, { acceptedSegmentCount: 0 })).toEqual({
      current_authoritative_state: {
        current_time: "late night",
        onstage_entities: [idA],
        visible_conditions: ["rain on the window"]
      },
      immediate_handoff: {
        last_visible_moment: "Mara reaches the stairwell.",
        prior_accepted_prose_status_or_handoff_note: "none"
      },
      manual_moment_directive: {
        must_render: ["Mara opens the door."],
        do_not_force: ["do not resolve the call"]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          current_voice_pressure: "clipped, defensive",
          current_must_preserve: ["short answers"]
        },
        {
          cast_member_id: idB
        }
      ],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: ["dialogue_expected"]
        }
      }
    });
  });

  it("preserves explicit generation context and is deterministic", () => {
    const draft: GenerationSessionDraft = {
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["continuation_after_accepted_segment"]
        }
      }
    };

    const first = normalizeGenerationSessionDraft(draft, { acceptedSegmentCount: 0 });
    const second = normalizeGenerationSessionDraft(draft, { acceptedSegmentCount: 0 });

    expect(first).toEqual({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["continuation_after_accepted_segment"]
        }
      }
    });
    expect(second).toEqual(first);
  });
});
