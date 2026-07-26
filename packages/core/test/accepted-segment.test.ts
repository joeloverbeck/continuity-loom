import { describe, expect, it } from "vitest";

import { acceptedSegmentProvenanceSchema } from "../src/accepted-segment.js";

const versions = {
  template: "1.7.0",
  compiler: "1.9.0",
  contract: "1.10.0"
} as const;

function openRouterProvenance(reasoningIntent: string): Record<string, unknown> {
  return {
    source: "openrouter",
    model: "openai/gpt-5",
    provider: "openrouter",
    temperatureMode: "explicit",
    temperature: 0.4,
    maxOutputTokens: 2200,
    reasoningIntent,
    versions
  };
}

describe("acceptedSegmentProvenanceSchema", () => {
  it("accepts strict OpenRouter and user-supplied provenance variants", () => {
    const openRouter = {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperatureMode: "explicit",
      temperature: 0.4,
      maxOutputTokens: 2200,
      topP: 0.9,
      reasoningIntent: "medium",
      versions
    } as const;
    const userSupplied = {
      source: "user_supplied",
      versions
    } as const;

    expect(acceptedSegmentProvenanceSchema.parse(openRouter)).toEqual(openRouter);
    expect(acceptedSegmentProvenanceSchema.parse(userSupplied)).toEqual(userSupplied);
    expect(acceptedSegmentProvenanceSchema.parse({
      source: "openrouter",
      model: "anthropic/claude-sonnet-5",
      provider: "openrouter",
      temperatureMode: "provider_default",
      maxOutputTokens: 2200,
      reasoningIntent: "medium",
      versions
    })).not.toHaveProperty("temperature");
    expect(() => acceptedSegmentProvenanceSchema.parse({
      ...openRouter,
      temperatureMode: "provider_default"
    })).toThrow();
    expect(() => acceptedSegmentProvenanceSchema.parse({
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperatureMode: "explicit",
      maxOutputTokens: 2200,
      versions
    })).toThrow();

    for (const forbiddenField of [
      { model: "external/model" },
      { provider: "openrouter" },
      { temperature: 0.4 },
      { temperatureMode: "provider_default" },
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

  it.each(["minimal", "low", "medium", "high", "xhigh", "max"])(
    "accepts exact sent reasoning intent %s",
    (reasoningIntent) => {
      expect(acceptedSegmentProvenanceSchema.parse(openRouterProvenance(reasoningIntent))).toMatchObject({
        source: "openrouter",
        reasoningIntent
      });
    }
  );

  it("accepts provider_default only as historical OpenRouter provenance", () => {
    expect(acceptedSegmentProvenanceSchema.parse(openRouterProvenance("provider_default"))).toMatchObject({
      source: "openrouter",
      reasoningIntent: "provider_default"
    });
  });

  it("requires a recognized reasoning intent and rejects forbidden reasoning fields", () => {
    const withoutIntent = openRouterProvenance("low");
    delete withoutIntent.reasoningIntent;

    expect(acceptedSegmentProvenanceSchema.safeParse(withoutIntent).success).toBe(false);
    expect(acceptedSegmentProvenanceSchema.safeParse(openRouterProvenance("none")).success).toBe(false);
    expect(acceptedSegmentProvenanceSchema.safeParse(openRouterProvenance("automatic")).success).toBe(false);
    expect(acceptedSegmentProvenanceSchema.safeParse({
      ...openRouterProvenance("low"),
      reasoningContent: "hidden chain of thought"
    }).success).toBe(false);
    expect(acceptedSegmentProvenanceSchema.safeParse({
      ...openRouterProvenance("low"),
      reasoningTokens: 123
    }).success).toBe(false);
  });

  it("does not grant reasoning provenance to user-supplied prose", () => {
    expect(acceptedSegmentProvenanceSchema.safeParse({
      source: "user_supplied",
      reasoningIntent: "low",
      versions
    }).success).toBe(false);
  });
});
