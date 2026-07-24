import { CAST_POSSIBILITIES_OUTPUT_CONTRACT } from "./types.js";

export function castPossibilitiesOutputJsonSchema(): Record<string, unknown> {
  const nonblankString = { type: "string", minLength: 1 };
  const citationArray = {
    type: "array",
    minItems: 1,
    uniqueItems: true,
    items: { type: "string", minLength: 1 }
  };
  const card = {
    type: "object",
    additionalProperties: false,
    required: [
      "observable_move",
      "character_fit",
      "moment_fit",
      "local_effect",
      "dossier_keys",
      "context_keys",
      "distinction"
    ],
    properties: {
      observable_move: nonblankString,
      character_fit: nonblankString,
      moment_fit: nonblankString,
      local_effect: nonblankString,
      dossier_keys: citationArray,
      context_keys: citationArray,
      distinction: nonblankString
    }
  };

  return {
    type: "object",
    additionalProperties: false,
    required: ["contract", "characters"],
    properties: {
      contract: { type: "string", const: CAST_POSSIBILITIES_OUTPUT_CONTRACT },
      characters: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["character_key", "cards"],
          properties: {
            character_key: nonblankString,
            cards: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: card
            }
          }
        }
      }
    }
  };
}
