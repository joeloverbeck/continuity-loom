import { describe, expect, it } from "vitest";

import {
  buildChatCompletionRequest,
  fingerprintChatCompletionRequest,
  inspectChatCompletionRequest
} from "./openrouter/request.js";

describe("buildChatCompletionRequest", () => {
  it("selects one completion ceiling through the output policy", () => {
    const settings = {
      model: "test/model",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1200,
      assistanceMaxOutputTokens: 5000
    };
    const proseRequest = buildChatCompletionRequest({ prompt: "Same prompt", settings, outputPolicy: "prose" });
    const assistanceRequest = buildChatCompletionRequest({
      prompt: "Same prompt",
      settings,
      outputPolicy: "strict"
    });

    expect(inspectChatCompletionRequest(proseRequest, "prose", settings)).toMatchObject({
      completionCeilingClass: "prose",
      maxOutputTokens: 1200
    });
    expect(inspectChatCompletionRequest(assistanceRequest, "strict", settings)).toMatchObject({
      completionCeilingClass: "assistance",
      maxOutputTokens: 5000
    });
    expect(fingerprintChatCompletionRequest(proseRequest)).not.toBe(
      fingerprintChatCompletionRequest(assistanceRequest)
    );
    expect(fingerprintChatCompletionRequest(proseRequest)).toBe(fingerprintChatCompletionRequest(
      buildChatCompletionRequest({
        prompt: "Same prompt",
        settings: { ...settings, assistanceMaxOutputTokens: 9000 },
        outputPolicy: "prose"
      })
    ));
    expect(fingerprintChatCompletionRequest(assistanceRequest)).toBe(fingerprintChatCompletionRequest(
      buildChatCompletionRequest({
        prompt: "Same prompt",
        settings: { ...settings, proseMaxOutputTokens: 3000 },
        outputPolicy: "strict"
      })
    ));
  });

  it("builds a non-streaming chat completion request from the compiled prompt and settings", () => {
    expect(
      buildChatCompletionRequest({
        prompt: "Compiled prompt\nwith records.",
        settings: {
          model: "anthropic/claude-sonnet-4",
          temperatureMode: "explicit",
          temperature: 0.7,
          proseMaxOutputTokens: 1800,
          assistanceMaxOutputTokens: 4096,
          topP: 0.9
        },
        outputPolicy: "prose"
      })
    ).toEqual({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: "Compiled prompt\nwith records." }],
      temperature: 0.7,
      max_completion_tokens: 1800,
      top_p: 0.9,
      provider: { require_parameters: true, allow_fallbacks: false },
      plugins: [],
      transforms: [],
      tools: [],
      tool_choice: "none",
      stream: false
    });
  });

  it("omits top_p when topP is not configured", () => {
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "openai/gpt-4.1",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096
      },
      outputPolicy: "prose"
    });

    expect(request).toEqual({
      model: "openai/gpt-4.1",
      messages: [{ role: "user", content: "Prompt" }],
      temperature: 1,
      max_completion_tokens: 1024,
      provider: { require_parameters: true, allow_fallbacks: false },
      plugins: [],
      transforms: [],
      tools: [],
      tool_choice: "none",
      stream: false
    });
    expect(request).not.toHaveProperty("top_p");
    expect(request.messages).toHaveLength(1);
  });

  it("preserves global routing and no-transform protections around workflow options", () => {
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "openai/gpt-4.1",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096
      },
      outputPolicy: "strict",
      requestOptions: {
        provider: { require_parameters: false, allow_fallbacks: true, data_collection: "deny" },
        plugins: [{ id: "unexpected" }],
        transforms: ["middle-out"],
        tools: [{ type: "function", function: { name: "lookup" } }],
        tool_choice: "auto"
      }
    });

    expect(request.provider).toEqual({
      require_parameters: true,
      allow_fallbacks: false,
      data_collection: "deny"
    });
    expect(request.plugins).toEqual([]);
    expect(request.transforms).toEqual([]);
    expect(request.tools).toHaveLength(1);
    expect(request.tool_choice).toBe("auto");
  });

  it("omits temperature in provider-default mode and discloses no invented numeric value", () => {
    const settings = {
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 2048
    };
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings,
      outputPolicy: "strict"
    });

    expect(request).not.toHaveProperty("temperature");
    expect(inspectChatCompletionRequest(request, "strict", settings)).toEqual({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      completionCeilingClass: "assistance",
      maxOutputTokens: 2048,
      requestFingerprint: fingerprintChatCompletionRequest(request)
    });
  });

  it("discloses only the selected model's cached context length without changing the request fingerprint", () => {
    const settings = {
      model: "provider/selected",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 2048,
      cachedModels: [
        { id: "provider/other", name: "Other", contextLength: 999 },
        { id: "provider/selected", name: "Selected", contextLength: 4096 }
      ]
    };
    const request = buildChatCompletionRequest({ prompt: "Prompt", settings, outputPolicy: "strict" });

    expect(inspectChatCompletionRequest(request, "strict", settings)).toEqual({
      model: "provider/selected",
      temperatureMode: "provider_default",
      completionCeilingClass: "assistance",
      maxOutputTokens: 2048,
      contextLength: 4096,
      requestFingerprint: fingerprintChatCompletionRequest(request)
    });
    expect(inspectChatCompletionRequest(request, "strict", {
      ...settings,
      cachedModels: [{ id: "provider/selected", name: "Selected" }]
    })).not.toHaveProperty("contextLength");
  });

  it("refuses inspection when the ceiling policy contradicts the finalized request", () => {
    const settings = {
      model: "provider/selected",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096
    };
    const request = buildChatCompletionRequest({ prompt: "Prompt", settings, outputPolicy: "prose" });

    expect(() => inspectChatCompletionRequest(request, "strict", settings)).toThrow(
      /finalized request uses 1024 completion tokens but the Assistance ceiling is 4096/i
    );
  });

  it("fingerprints provider configuration without changing prompt bytes", () => {
    const explicit = buildChatCompletionRequest({
      prompt: "Byte-identical prompt",
      settings: {
        model: "test/model",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096
      },
      outputPolicy: "prose"
    });
    const providerDefault = buildChatCompletionRequest({
      prompt: "Byte-identical prompt",
      settings: {
        model: "test/model",
        temperatureMode: "provider_default",
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096
      },
      outputPolicy: "prose"
    });

    expect(explicit.messages).toEqual(providerDefault.messages);
    expect(fingerprintChatCompletionRequest(explicit)).not.toBe(fingerprintChatCompletionRequest(providerDefault));
  });
});
