import { describe, expect, it } from "vitest";

import { parseIdeationResponse } from "./ideation-parse.js";

describe("ideation response parser", () => {
  it("parses flat idea blocks and flags unknown citations", () => {
    const parsed = parseIdeationResponse(
      [
        "IDEA 1",
        "operator: Reveal",
        "headline: Let the sealed letter become visible.",
        "why: The letter and the latch support a pressure move.",
        "grounds: [SECRET: Letter], [CLOCK: Missing]"
      ].join("\n"),
      new Set(["[SECRET: Letter]"])
    );

    expect(parsed).toEqual({
      ok: true,
      ideas: [
        {
          slotNumber: 1,
          operator: "Reveal",
          headline: "Let the sealed letter become visible.",
          why: "The letter and the latch support a pressure move.",
          grounds: ["[SECRET: Letter]", "[CLOCK: Missing]"],
          unknownCitations: ["[CLOCK: Missing]"]
        }
      ]
    });
  });

  it("returns raw text for malformed responses", () => {
    expect(parseIdeationResponse("No idea blocks here.", new Set())).toEqual({
      ok: false,
      raw: "No idea blocks here."
    });
  });
});
