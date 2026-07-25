import {
  CAST_POSSIBILITIES_OUTPUT_CONTRACT,
  type CastPossibilitiesParseContext
} from "./types.js";

export interface CastPossibilitiesOutputGuidance {
  immediateSituation: string;
  mustRender: readonly string[];
  mayRenderIfNaturallyCaused: readonly string[];
  doNotForce: readonly string[];
}

export function castPossibilitiesOutputJsonSchema(
  context: CastPossibilitiesParseContext,
  guidance: CastPossibilitiesOutputGuidance
): Record<string, unknown> {
  // Anthropic rejects several ordinary JSON-Schema constraint keywords before
  // generation. The deterministic parser below this boundary re-enforces every
  // omitted semantic constraint with fail-closed whole-response quarantine.
  const string = { type: "string" };
  const observableMove = {
    type: "string",
    description:
      "Describe one premise-level observable action feasible in the saved immediate situation. Summarize any speech act. Do not write quoted dialogue or exact words."
  };
  const momentFit = {
    type: "string",
    description:
      "Explain why the move is feasible now. Remain compatible with every saved constraint and explain how the move satisfies each requirement that explicitly constrains this character's participation."
  };
  const localEffect = {
    type: "string",
    description:
      "Describe only the useful immediate pressure or changed local action space, without future sequence or plot planning."
  };
  const dossierKeys = uniqueValues(
    context.expectedCharacters.flatMap((character) => character.dossierKeys)
  );
  const contextKeys = uniqueValues(context.contextKeys);
  const card = {
    type: "object",
    description: [
      "Every card must remain compatible with this exact saved constraint set.",
      "A card does not need to enact every scene-level requirement.",
      "Every requirement that explicitly constrains this character's participation must be satisfied by every card.",
      `Saved immediate situation: ${JSON.stringify(guidance.immediateSituation)}.`,
      `Exact saved must_render requirements: ${JSON.stringify(guidance.mustRender)}.`,
      `May render only if naturally caused: ${JSON.stringify(guidance.mayRenderIfNaturallyCaused)}.`,
      `Every card must not force: ${JSON.stringify(guidance.doNotForce)}.`
    ].join(" "),
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
      observable_move: observableMove,
      character_fit: string,
      moment_fit: momentFit,
      local_effect: localEffect,
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
