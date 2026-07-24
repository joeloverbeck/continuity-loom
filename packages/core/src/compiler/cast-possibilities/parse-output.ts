import {
  CAST_POSSIBILITIES_OUTPUT_CONTRACT,
  type CastPossibilitiesCard,
  type CastPossibilitiesOutput,
  type CastPossibilitiesParseContext
} from "./types.js";

export type CastPossibilitiesQuarantineReason =
  | "not-pure-json"
  | "schema-mismatch"
  | "contract-mismatch"
  | "character-set-mismatch"
  | "character-order-mismatch"
  | "card-count-mismatch"
  | "blank-field"
  | "unknown-citation"
  | "duplicate-citation"
  | "dossier-citation-owner-mismatch";

export type CastPossibilitiesParseResult =
  | { status: "accepted"; output: CastPossibilitiesOutput }
  | {
      status: "quarantined";
      reasonCode: CastPossibilitiesQuarantineReason;
      summary: string;
      recovery: "inspect-source-and-response";
    };

export function parseCastPossibilitiesOutput(
  input: unknown,
  context: CastPossibilitiesParseContext
): CastPossibilitiesParseResult {
  try {
    return { status: "accepted", output: parse(input, context) };
  } catch (error) {
    const failure = error as ParseFailure;
    return {
      status: "quarantined",
      reasonCode: failure.reasonCode ?? "schema-mismatch",
      summary: failure.message || "The complete Cast Possibilities response is malformed.",
      recovery: "inspect-source-and-response"
    };
  }
}

class ParseFailure extends Error {
  constructor(
    readonly reasonCode: CastPossibilitiesQuarantineReason,
    message: string
  ) {
    super(message);
  }
}

function fail(reasonCode: CastPossibilitiesQuarantineReason, message: string): never {
  throw new ParseFailure(reasonCode, message);
}

function parse(input: unknown, context: CastPossibilitiesParseContext): CastPossibilitiesOutput {
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      fail("not-pure-json", "The response was not one complete JSON value.");
    }
  }
  const envelope = exactObject(input, ["contract", "characters"]);
  if (envelope.contract !== CAST_POSSIBILITIES_OUTPUT_CONTRACT) {
    fail("contract-mismatch", "The response contract does not match cast_possibilities.v1.");
  }
  if (!Array.isArray(envelope.characters)) {
    fail("schema-mismatch", "The response must contain a characters array.");
  }
  if (envelope.characters.length !== context.expectedCharacters.length) {
    fail("character-set-mismatch", "The response must contain every eligible character exactly once.");
  }

  const contextKeys = new Set(context.contextKeys);
  const seenCharacters = new Set<string>();
  const characters = envelope.characters.map((value, index) => {
    const expected = context.expectedCharacters[index];
    const character = exactObject(value, ["character_key", "cards"]);
    const characterKey = nonblank(character.character_key, "character_key");
    if (seenCharacters.has(characterKey)) {
      fail("character-set-mismatch", "Character results must not be duplicated.");
    }
    seenCharacters.add(characterKey);
    if (!expected || characterKey !== expected.characterKey) {
      fail("character-order-mismatch", "Character results must use the complete deterministic order.");
    }
    if (!Array.isArray(character.cards) || character.cards.length !== 3) {
      fail("card-count-mismatch", "Every eligible character must have exactly three cards.");
    }

    const dossierKeys = new Set(expected.dossierKeys);
    const cards = character.cards.map((card) => parseCard(card, dossierKeys, contextKeys));
    return {
      character_key: characterKey,
      cards: cards as [CastPossibilitiesCard, CastPossibilitiesCard, CastPossibilitiesCard]
    };
  });

  return {
    contract: CAST_POSSIBILITIES_OUTPUT_CONTRACT,
    characters
  };
}

function parseCard(
  input: unknown,
  ownedDossierKeys: ReadonlySet<string>,
  contextKeys: ReadonlySet<string>
): CastPossibilitiesCard {
  const value = exactObject(input, [
    "observable_move",
    "character_fit",
    "moment_fit",
    "local_effect",
    "dossier_keys",
    "context_keys",
    "distinction"
  ]);
  const dossierKeys = citations(value.dossier_keys);
  const cardContextKeys = citations(value.context_keys);

  if (dossierKeys.some((key) => !ownedDossierKeys.has(key))) {
    fail("dossier-citation-owner-mismatch", "A card cites dossier evidence owned by another character.");
  }
  if (cardContextKeys.some((key) => !contextKeys.has(key))) {
    fail("unknown-citation", "A card cites context that is not in the compiled source.");
  }

  return {
    observable_move: nonblank(value.observable_move, "observable_move"),
    character_fit: nonblank(value.character_fit, "character_fit"),
    moment_fit: nonblank(value.moment_fit, "moment_fit"),
    local_effect: nonblank(value.local_effect, "local_effect"),
    dossier_keys: dossierKeys,
    context_keys: cardContextKeys,
    distinction: nonblank(value.distinction, "distinction")
  };
}

function citations(input: unknown): string[] {
  if (!Array.isArray(input) || input.length === 0) {
    fail("schema-mismatch", "Citation arrays must be non-empty.");
  }
  const values = input.map((value) => nonblank(value, "citation"));
  if (new Set(values).size !== values.length) {
    fail("duplicate-citation", "Citation arrays must not contain duplicates.");
  }
  return values;
}

function exactObject(input: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("schema-mismatch", "Expected an object.");
  }
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
  ) {
    fail("schema-mismatch", "The response contains missing or unsupported fields.");
  }
  return value;
}

function nonblank(input: unknown, field: string): string {
  if (typeof input !== "string" || !input.trim()) {
    fail("blank-field", `${field} must be a nonblank string.`);
  }
  return input.trim();
}
