import {
  buildValidationSnapshot,
  DIAGNOSTIC_CODES,
  runValidation,
  type BuildValidationSnapshotInput,
  type SelectedCastBand,
  type ValidationResult
} from "../src/index.js";
import { onstageCastBandRules } from "../src/validation/rules/onstage-cast-band.js";
import { describe, expect, it } from "vitest";

const entityId = "019b0298-5c00-7000-8000-000000000801";
const castId = "019b0298-5c00-7000-8000-000000000802";
const locationId = "019b0298-5c00-7000-8000-000000000803";

describe("onstage cast-band validation", () => {
  it("blocks an onstage character whose selected cast dossier is unassigned", () => {
    const result = validate(baseInput());

    expect(codes(result.blockers)).toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
    expect(result.blockers[0]?.message).toContain("\"Mara Vale\" is Unassigned");
    expect(result.blockers[0]?.whyItMatters).toBe(
      "An onstage character must have its dossier rendered as present cast so voice, body, and pressure authority compile deterministically."
    );
    expect(result.blockers[0]?.suggestedActions).toEqual(["promote-cast", "revise", "deselect"]);
    expect(result.isBlocked).toBe(true);
  });

  it.each([
    ["offstage relevance", "offstage_relevant_cast", true],
    ["active/onstage full", "active_onstage_cast_full", false],
    ["present-minor compressed", "present_minor_cast_compressed", false]
  ] as const)("handles %s cast band", (_name, band, shouldBlock) => {
    const input = baseInput(band);
    const result = validate(input);
    const blockerCodes = codes(result.blockers);

    if (shouldBlock) {
      expect(blockerCodes).toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
      expect(result.isBlocked).toBe(true);
    } else {
      expect(blockerCodes).not.toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
    }
  });

  it("uses the offstage relevance state in the blocker message", () => {
    const result = validate(baseInput("offstage_relevant_cast"));

    expect(result.blockers[0]?.message).toContain("\"Mara Vale\" is in offstage relevance");
    expect(result.blockers[0]?.message).not.toContain("Unassigned");
  });

  it("stays silent when no onstage entities are listed", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.onstage_entities = [];

    expect(codes(validate(input).blockers)).not.toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
  });

  it("does not block an onstage entity with no linked selected cast member", () => {
    const input = baseInput();
    input.records = input.records.filter((record) => record.type !== "CAST MEMBER");

    expect(codes(validate(input).blockers)).not.toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
  });

  it("does not treat non-cast records with matching entity ids as cast dossiers", () => {
    const input = baseInput();
    input.records = [
      {
        id: "fact-with-entity",
        type: "FACT",
        payload: {
          entity_id: entityId,
          summary: "Mara is in the room."
        }
      }
    ];

    expect(codes(validate(input).blockers)).not.toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
  });

  it.each([
    ["array payload", []],
    ["null payload", null],
    ["missing entity id", { note: "No link." }]
  ])("ignores cast records with %s", (_name, payload) => {
    const input = baseInput();
    input.records = input.records.map((record) =>
      record.id === castId
        ? {
            ...record,
            payload
          }
        : record
    );

    expect(() => validate(input)).not.toThrow();
    expect(codes(validate(input).blockers)).not.toContain(DIAGNOSTIC_CODES.onstageCastBandMissing);
  });
});

function validate(input: BuildValidationSnapshotInput): ValidationResult {
  return runValidation(buildValidationSnapshot(input), onstageCastBandRules);
}

function codes(diagnostics: ValidationResult["blockers"]): readonly string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function baseInput(castBand?: SelectedCastBand): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: entityId,
        type: "ENTITY",
        payload: {
          entity_kind: "person",
          name: "Mara Vale"
        }
      },
      {
        id: castId,
        type: "CAST MEMBER",
        payload: {
          entity_id: entityId
        },
        metadata: {
          id: castId,
          type: "CAST MEMBER",
          displayLabel: "Mara Vale",
          createdAt: "2026-06-16T00:00:00.000Z",
          updatedAt: "2026-06-16T00:00:00.000Z",
          archived: false
        },
        ...(castBand ? { castBand } : {})
      }
    ],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
      current_authoritative_state: {
        current_time: "Night.",
        current_location: locationId,
        onstage_entities: [entityId],
        immediate_situation_summary: "Mara waits by the door.",
        offstage_pressuring_entities: [],
        positions: "Mara is beside the threshold.",
        possessions: "None.",
        visible_conditions: [],
        environmental_conditions: "Still air.",
        entity_statuses: [],
        line_of_sight_and_visibility: "Clear.",
        routes_and_exits: ["door"],
        available_time: "One exchange.",
        consent_or_force_conditions: "none",
        current_locks: []
      }
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    }
  };
}
