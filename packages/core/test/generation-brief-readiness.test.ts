import { describe, expect, it } from "vitest";

import {
  generationSessionReadySchema,
  normalizeGenerationSessionForReadiness,
  type GenerationSessionDraft
} from "../src/index.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

describe("generation brief readiness normalization", () => {
  it("trims blanks, removes blank list entries and semantic-less array objects, and preserves nonblank fields", () => {
    const draft: GenerationSessionDraft = {
      current_authoritative_state: {
        current_time: "  morning  ",
        current_location: "  old station  ",
        onstage_entities: [idA],
        immediate_situation_summary: "  Mara is at the turnstile while the offered key changes the conversation. ",
        positions: ["  Mara is at the turnstile.  ", ""],
        visible_conditions: ["", "  coat soaked  "],
        pov_cannot_perceive_now: "  Mara cannot see the caller behind the smoked glass.  ",
        routes_and_exits: []
      },
      manual_moment_directive: {
        must_render: ["", "  Mara refuses the offered key.  "],
        may_render_if_naturally_caused: ["   "],
        do_not_force: ["  do not reveal the caller  "]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          current_voice_pressure: "  clipped, wary  ",
          current_must_preserve: ["  short refusals  ", ""]
        },
        {
          cast_member_id: idB,
          current_voice_pressure: "",
          current_must_preserve: []
        }
      ],
      cast_voice_overrides: [
        {
          cast_member_id: idA,
          scope: "current_generation_only",
          override_text: "  make the refusal quieter  ",
          applies_to: ["dialogue"]
        },
        {
          cast_member_id: idB,
          override_text: ""
        }
      ],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: [],
          expected_local_modes: ["dialogue_expected"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: "  Stop on the first refusal. "
      }
    };

    expect(normalizeGenerationSessionForReadiness(draft, { acceptedSegmentCount: 2 })).toEqual({
      current_authoritative_state: {
        current_time: "morning",
        current_location: "old station",
        onstage_entities: [idA],
        immediate_situation_summary: "Mara is at the turnstile while the offered key changes the conversation.",
        positions: ["Mara is at the turnstile."],
        visible_conditions: ["coat soaked"],
        pov_cannot_perceive_now: "Mara cannot see the caller behind the smoked glass."
      },
      manual_moment_directive: {
        must_render: ["Mara refuses the offered key."],
        do_not_force: ["do not reveal the caller"]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          current_voice_pressure: "clipped, wary",
          current_must_preserve: ["short refusals"]
        }
      ],
      cast_voice_overrides: [
        {
          cast_member_id: idA,
          scope: "current_generation_only",
          override_text: "make the refusal quieter",
          applies_to: ["dialogue"]
        }
      ],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["continuation_after_accepted_segment"],
          expected_local_modes: ["dialogue_expected"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop on the first refusal."
      }
    });
  });

  it("keeps blank stop guidance as an allowed empty state while leaving blank launch directive absent", () => {
    const ready = normalizeGenerationSessionForReadiness(
      {
        immediate_handoff: {
          recent_causal_context: "",
          last_visible_moment: "",
          prior_accepted_prose_status_or_handoff_note: "",
          begin_after: ""
        },
        manual_moment_directive: {
          must_render: [],
          may_render_if_naturally_caused: [],
          do_not_force: []
        },
        stop_guidance: {
          soft_unit_guidance: "   "
        }
      },
      { acceptedSegmentCount: 0 }
    );

    expect(ready).toEqual({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: ""
      }
    });
    expect(ready.manual_moment_directive?.must_render).toBeUndefined();
    expect(ready.immediate_handoff).toBeUndefined();
  });

  it("omits blank POV cannot-perceive text without adding a readiness blocker", () => {
    const ready = normalizeGenerationSessionForReadiness(
      {
        current_authoritative_state: {
          immediate_situation_summary: "Mara waits at the turnstile.",
          line_of_sight_and_visibility: "The caller is visible through glass.",
          pov_cannot_perceive_now: "   "
        }
      },
      { acceptedSegmentCount: 0 }
    );

    expect(ready).toEqual({
      current_authoritative_state: {
        immediate_situation_summary: "Mara waits at the turnstile.",
        line_of_sight_and_visibility: "The caller is visible through glass."
      },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: ""
      }
    });
    expect(generationSessionReadySchema.parse(ready)).toEqual(ready);
  });

  it("preserves explicit generation context and parses through the ready schema", () => {
    const ready = normalizeGenerationSessionForReadiness(
      {
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"],
            possible_durable_changes: ["object_use_possible"]
          }
        }
      },
      { acceptedSegmentCount: 4 }
    );

    expect(ready.generation_validation_focus.validation_focus_tags.generation_context).toEqual(["first_segment"]);
    expect(generationSessionReadySchema.parse(ready)).toEqual(ready);
  });

  it("is deterministic and never invents handoff continuity or launch directives", () => {
    const draft: GenerationSessionDraft = {
      immediate_handoff: {
        prior_accepted_prose_status_or_handoff_note: "   "
      },
      manual_moment_directive: {
        must_render: ["   "]
      }
    };

    const first = normalizeGenerationSessionForReadiness(draft, { acceptedSegmentCount: 1 });
    const second = normalizeGenerationSessionForReadiness(draft, { acceptedSegmentCount: 1 });

    expect(first).toEqual(second);
    expect(first).toEqual({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["continuation_after_accepted_segment"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: ""
      }
    });
  });
});
