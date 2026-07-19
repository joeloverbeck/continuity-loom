import { describe, expect, it } from "vitest";

import {
  buildCastMemberDraftImportReport,
  getRecordTypeDefinition,
  mapCastMemberDraftFields,
  parseCastMemberDraftResponse
} from "../src/index.js";

function parsedObject(input: string): Record<string, unknown> {
  const result = parseCastMemberDraftResponse(input);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.value;
}

describe("Cast Member draft response parsing", () => {
  it.each([
    [
      "a json fence",
      "Assistant preface\n```json\n{\"identity\":{\"one_line\":\"The witness.\"}}\n```\nAssistant tail"
    ],
    [
      "chat prose around a balanced object",
      "Here is the draft: {\"identity\":{\"one_line\":\"A witness with {careful} phrasing.\"}} Review it."
    ]
  ])("extracts %s without changing the object", (_label, input) => {
    const identity = parsedObject(input).identity;
    expect(typeof identity).toBe("object");
    if (
      typeof identity !== "object"
      || identity === null
      || Array.isArray(identity)
      || !("one_line" in identity)
    ) {
      throw new Error("Expected an identity object.");
    }
    expect(identity.one_line).toContain("witness");
  });

  it.each([
    ["no object", "I could not produce the requested object."],
    ["broken json", "```json\n{\"identity\":\n```"],
    ["array envelope", "[1, 2, 3]"]
  ])("returns an author-readable error for %s", (_label, input) => {
    const result = parseCastMemberDraftResponse(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("JSON object");
    }
  });
});

describe("Cast Member draft field mapping", () => {
  it("validates each present schema field independently and reports adversarial values", () => {
    const input = {
      entity_id: "019b0298-5c00-7000-8000-000000000099",
      identity: {
        one_line: "A precise operator.",
        public_face: "   ",
        private_pressure: "Fears becoming unnecessary.",
        surprise_key: "must not pass"
      },
      voice_anchor: {
        must_preserve: ["precision", ""],
        must_avoid: "not-an-array"
      },
      sample_utterances: [
        {
          text: "No. We will read the terms first.",
          situation: "Offered a dangerous shortcut.",
          speech_function: "invalid-enum",
          pressure_tags: ["control"],
          copy_policy: "never_copy_verbatim"
        },
        "malformed utterance",
        {
          text: "Then ask the right question.",
          situation: "Pressed for an answer.",
          speech_function: "evasion",
          pressure_tags: [""],
          copy_policy: "never_copy_verbatim"
        }
      ],
      unexpected_top_level: true,
      uncertainties: ["The dossier conflicts about age.", ""],
      invented_fields: ["identity.private_pressure", 7]
    };
    const frozen = structuredClone(input);

    expect(getRecordTypeDefinition("CAST MEMBER")).toBeDefined();
    const mapping = mapCastMemberDraftFields(input);

    expect(input).toEqual(frozen);
    expect(mapping.values).toEqual({
      identity: {
        one_line: "A precise operator.",
        private_pressure: "Fears becoming unnecessary."
      },
      voice_anchor: {
        must_preserve: ["precision"]
      },
      sample_utterances: [
        {
          text: "No. We will read the terms first.",
          situation: "Offered a dangerous shortcut.",
          pressure_tags: ["control"],
          copy_policy: "never_copy_verbatim"
        },
        {
          text: "Then ask the right question.",
          situation: "Pressed for an answer.",
          speech_function: "evasion",
          copy_policy: "never_copy_verbatim"
        }
      ]
    });
    expect(mapping.uncertainties).toEqual(["The dossier conflicts about age."]);
    expect(mapping.inventedFields).toEqual(["identity.private_pressure"]);
    expect(mapping.skippedFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "entity_id", reason: "protected field" }),
      expect.objectContaining({ path: "identity.public_face", reason: "empty value" }),
      expect.objectContaining({ path: "identity.surprise_key", reason: "unknown field" }),
      expect.objectContaining({ path: "voice_anchor.must_preserve[1]", reason: "empty value" }),
      expect.objectContaining({ path: "voice_anchor.must_avoid", reason: "malformed entry" }),
      expect.objectContaining({ path: "sample_utterances[0].speech_function", reason: "invalid enum value" }),
      expect.objectContaining({ path: "sample_utterances[1]", reason: "malformed entry" }),
      expect.objectContaining({ path: "sample_utterances[2].pressure_tags[0]", reason: "empty value" }),
      expect.objectContaining({ path: "unexpected_top_level", reason: "unknown field" }),
      expect.objectContaining({ path: "uncertainties[1]", reason: "empty value" }),
      expect.objectContaining({ path: "invented_fields[1]", reason: "malformed entry" })
    ]));
  });

  it("keeps absent fields absent and produces deterministic results", () => {
    const input = {
      identity: { one_line: "A careful operator." },
      uncertainties: [],
      invented_fields: []
    };

    expect(mapCastMemberDraftFields(input)).toEqual(mapCastMemberDraftFields(input));
    expect(mapCastMemberDraftFields(input).values).toEqual({
      identity: { one_line: "A careful operator." }
    });
  });
});

describe("Cast Member draft import report", () => {
  it("separates filled, skipped, and needs-author bands without leaking metadata into values", () => {
    const mapping = mapCastMemberDraftFields(parsedObject(`
      \`\`\`json
      {
        "identity": { "one_line": "A careful operator.", "public_face": "" },
        "uncertainties": ["The dossier gives two incompatible ages."],
        "invented_fields": ["identity.one_line"]
      }
      \`\`\`
    `));

    expect(buildCastMemberDraftImportReport(mapping)).toEqual({
      filledFields: ["identity.one_line"],
      skippedFields: [
        expect.objectContaining({ path: "identity.public_face", reason: "empty value" })
      ],
      needsAuthor: {
        entityId: "Select or confirm the linked ENTITY in the Cast Member editor.",
        uncertainties: ["The dossier gives two incompatible ages."],
        inventedFields: ["identity.one_line"]
      }
    });
    expect(mapping.values).not.toHaveProperty("uncertainties");
    expect(mapping.values).not.toHaveProperty("invented_fields");
  });
});
