import { describe, expect, it } from "vitest";

import { acceptedSegmentProvenanceSchema } from "../src/accepted-segment.js";

const versions = {
  template: "1.7.0",
  compiler: "1.9.0",
  contract: "1.10.0"
} as const;

describe("acceptedSegmentProvenanceSchema", () => {
  it("accepts strict OpenRouter and user-supplied provenance variants", () => {
    const openRouter = {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      topP: 0.9,
      versions
    } as const;
    const userSupplied = {
      source: "user_supplied",
      versions
    } as const;

    expect(acceptedSegmentProvenanceSchema.parse(openRouter)).toEqual(openRouter);
    expect(acceptedSegmentProvenanceSchema.parse(userSupplied)).toEqual(userSupplied);

    for (const forbiddenField of [
      { model: "external/model" },
      { provider: "openrouter" },
      { temperature: 0.4 },
      { maxOutputTokens: 2200 },
      { topP: 0.9 },
      { prompt: "must not be stored" },
      { candidate: "must not be stored" },
      { apiKey: "sk-secret" },
      { edited: true }
    ]) {
      expect(() => acceptedSegmentProvenanceSchema.parse({ ...userSupplied, ...forbiddenField })).toThrow();
    }
  });
});
