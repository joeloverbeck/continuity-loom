import {
  IDEATION_OUTPUT_CONTRACT,
  type IdeationAssignment,
  type IdeationMode
} from "./types.js";

export function ideationOutputJsonSchema(
  assignment: IdeationAssignment,
  mode: IdeationMode,
  validCitationKeys: readonly string[]
): Record<string, unknown> {
  const modeField = mode === "ideas" ? "headline" : "question";

  return {
    type: "object",
    additionalProperties: false,
    required: ["contract", "ideas"],
    properties: {
      contract: { enum: [IDEATION_OUTPUT_CONTRACT] },
      ideas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["slot_number", "operator", "status", modeField, "why", "grounds"],
          properties: {
            slot_number: { enum: assignment.slots.map((_, index) => index + 1) },
            operator: { enum: assignment.slots.map((slot) => slot.operator) },
            status: { enum: ["idea", "skipped"] },
            [modeField]: { type: "string" },
            why: { type: "string" },
            grounds: {
              type: "array",
              items: { enum: [...validCitationKeys] }
            }
          }
        }
      }
    }
  };
}
