import {
  buildValidationSnapshot,
  DIAGNOSTIC_CODES,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationResult
} from "../src/index.js";
import { castBandRules } from "../src/validation/rules/cast-band.js";
import { warningRules } from "../src/validation/rules/warnings.js";
import { describe, expect, it } from "vitest";

const entityId = "019b0298-5c00-7000-8000-000000000401";
const castId = "019b0298-5c00-7000-8000-000000000402";
const secondCastId = "019b0298-5c00-7000-8000-000000000403";
const unselectedCastId = "019b0298-5c00-7000-8000-000000000404";
const wrongTypeId = "019b0298-5c00-7000-8000-000000000405";
const danglingId = "019b0298-5c00-7000-8000-000000000406";

describe("cast-band and POV reference validation", () => {
  it("stays silent for coherent selected cast-band, POV, and voice-pressure attachments", () => {
    const result = validate(baseInput());

    expect(result.blockers).toEqual([]);
    expect(codes(result.warnings)).not.toContain(DIAGNOSTIC_CODES.voicePressureOrphanedAttachment);
  });

  it("blocks cast members assigned to multiple cast bands", () => {
    const input = baseInput();
    input.generationSession.active_working_set!.present_minor_cast_compressed = [castId];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.castBandDuplicateMembership);
  });

  it.each([
    ["unselected", unselectedCastId],
    ["mistyped", wrongTypeId],
    ["dangling", danglingId]
  ])("blocks %s cast-band references", (_name, id) => {
    const input = baseInput();
    input.generationSession.active_working_set!.active_onstage_cast_full = [
      { cast_member_id: id, local_function: "active_speaker" }
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.castBandReferenceInvalid);
  });

  it.each([
    ["unselected", unselectedCastId],
    ["mistyped", wrongTypeId],
    ["dangling", danglingId]
  ])("blocks %s selected POV references", (_name, id) => {
    const input = baseInput();
    input.generationSession.active_working_set!.selected_pov = id;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.selectedPovReferenceInvalid);
  });

  it("allows literal omniscient selected POV when prose mode is variable", () => {
    const omniscient = baseInput();
    omniscient.generationSession.active_working_set!.selected_pov = "omniscient";

    expect(blockerCodes(omniscient)).not.toContain(DIAGNOSTIC_CODES.selectedPovReferenceInvalid);
  });

  it("requires selected POV when prose mode is variable", () => {
    const input = baseInput();
    delete input.generationSession.active_working_set!.selected_pov;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.selectedPovRequiredForVariableMode);
  });

  it("blocks selected POV conflicts with fixed prose mode", () => {
    const input = baseInput();
    input.storyConfig.proseMode!.pov_character = secondCastId;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.selectedPovConflictsWithProseMode);
  });

  it.each([
    ["current voice pressure dangling", "current_cast_voice_pressure", danglingId],
    ["current voice pressure mistyped", "current_cast_voice_pressure", wrongTypeId],
    ["voice override dangling", "cast_voice_overrides", danglingId],
    ["voice override mistyped", "cast_voice_overrides", wrongTypeId]
  ])("blocks %s attachments", (_name, field, id) => {
    const input = baseInput();
    if (field === "current_cast_voice_pressure") {
      input.generationSession.current_cast_voice_pressure = [voicePressure(id)];
    } else {
      input.generationSession.cast_voice_overrides = [voiceOverride(id)];
    }

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.voicePressureAttachmentInvalid);
  });

  it("warns when voice pressure targets an existing cast member outside rendered bands", () => {
    const input = baseInput();
    input.generationSession.current_cast_voice_pressure = [voicePressure(unselectedCastId)];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.voicePressureAttachmentInvalid);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.voicePressureOrphanedAttachment);
    expect(result.isBlocked).toBe(false);
  });
});

function validate(input: BuildValidationSnapshotInput): ValidationResult {
  return runValidation(buildValidationSnapshot(input), [...castBandRules, ...warningRules]);
}

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return codes(validate(input).blockers);
}

function codes(diagnostics: ValidationResult["blockers"]): readonly string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [
      record(entityId, "ENTITY"),
      record(castId, "CAST MEMBER"),
      record(secondCastId, "CAST MEMBER"),
      record(wrongTypeId, "FACT")
    ],
    generationSession: {
      active_working_set: {
        selected_records: [entityId, castId, secondCastId, wrongTypeId],
        active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: entityId
      },
      current_cast_voice_pressure: [voicePressure(castId)],
      cast_voice_overrides: []
    },
    storyConfig: {
      proseMode: {
        pov_character: "variable",
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
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    },
    projectRecordIndex: {
      [entityId]: "ENTITY",
      [castId]: "CAST MEMBER",
      [secondCastId]: "CAST MEMBER",
      [unselectedCastId]: "CAST MEMBER",
      [wrongTypeId]: "FACT"
    }
  };
}

function record(id: string, type: string) {
  return {
    id,
    type,
    payload: {}
  };
}

function voicePressure(castMemberId: string) {
  return {
    cast_member_id: castMemberId,
    local_function: "active_speaker" as const,
    current_voice_pressure: "Precise and clipped.",
    dialogue_pressure: "Direct.",
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: "none",
    current_must_preserve: [],
    current_must_avoid: []
  };
}

function voiceOverride(castMemberId: string) {
  return {
    cast_member_id: castMemberId,
    reason: "Tighten this local exchange.",
    applies_to: ["dialogue" as const],
    override_text: "Shorter than usual."
  };
}
