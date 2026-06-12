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
        "grounds: [SECRET-1], [CLOCK-99]"
      ].join("\n"),
      new Set(["[SECRET-1]"])
    );

    expect(parsed).toEqual({
      ok: true,
      ideas: [
        {
          slotNumber: 1,
          operator: "Reveal",
          headline: "Let the sealed letter become visible.",
          why: "The letter and the latch support a pressure move.",
          grounds: ["[SECRET-1]", "[CLOCK-99]"],
          unknownCitations: ["[CLOCK-99]"]
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
