import { CAST_POSSIBILITIES_OUTPUT_CONTRACT } from "./types.js";

export function castPossibilitiesOutputJsonSchema(): Record<string, unknown> {
  // Anthropic rejects several ordinary JSON-Schema constraint keywords before
  // generation. The deterministic parser below this boundary re-enforces every
  // omitted semantic constraint with fail-closed whole-response quarantine.
  const string = { type: "string" };
  const citationArray = {
    type: "array",
    items: string
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
      observable_move: string,
      character_fit: string,
      moment_fit: string,
      local_effect: string,
      dossier_keys: citationArray,
      context_keys: citationArray,
      distinction: string
    }
  };

  return {
    type: "object",
    additionalProperties: false,
    required: ["contract", "characters"],
    properties: {
      contract: { enum: [CAST_POSSIBILITIES_OUTPUT_CONTRACT] },
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["character_key", "cards"],
          properties: {
            character_key: string,
            cards: {
              type: "array",
              items: card
            }
          }
        }
      }
    }
  };
}
