import {
  CAST_POSSIBILITIES_OUTPUT_CONTRACT,
  type CastPossibilitiesParseContext
} from "./types.js";

export function castPossibilitiesOutputJsonSchema(
  context: CastPossibilitiesParseContext
): Record<string, unknown> {
  // Anthropic rejects several ordinary JSON-Schema constraint keywords before
  // generation. The deterministic parser below this boundary re-enforces every
  // omitted semantic constraint with fail-closed whole-response quarantine.
  const string = { type: "string" };
  const dossierKeys = uniqueValues(
    context.expectedCharacters.flatMap((character) => character.dossierKeys)
  );
  const contextKeys = uniqueValues(context.contextKeys);
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
      dossier_keys: {
        type: "array",
        items: {
          enum: dossierKeys,
          description:
            "Copy only a dossier key assigned to the enclosing character in expected_character_order."
        }
      },
      context_keys: {
        type: "array",
        items: {
          enum: contextKeys,
          description: "Copy a non-dossier key from citation_legend."
        }
      },
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
            character_key: {
              enum: context.expectedCharacters.map((character) => character.characterKey),
              description: "Copy the exact character_key from expected_character_order."
            },
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

function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values)];
}
